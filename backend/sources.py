"""Source fetchers + normalizers for The Skillwire Dispatch.

All network I/O happens here, server-side — which is the whole point: it lets us
pull CORS-blocked feeds (RSS, Reddit) and attach a server-only GitHub token,
without anything touching the browser.
"""
import asyncio
import hashlib
import os
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import List, Optional, Tuple
from urllib.parse import urlparse

import feedparser
import httpx

from models import Article, Repo, RepoDetail

GITHUB_SEARCH = "https://api.github.com/search/repositories"
GITHUB_REPOS = "https://api.github.com/repos"
HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date"

USER_AGENT = "skillwire-dispatch/1.0 (+https://owenhong0.github.io/skillwire)"

# Front-page sections → GitHub queries (mirrors frontend/src/lib/github.ts SECTIONS).
SECTIONS = {
    "skills": "claude skill",
    "mcp": "mcp server",
    "web": "browser automation",
    "data": "database vector",
    "agents": "ai agent framework",
}

# Curated AI/LLM news feeds — edit freely. Fetched server-side, so CORS is moot.
RSS_FEEDS: List[Tuple[str, str]] = [
    ("Hugging Face", "https://huggingface.co/blog/feed.xml"),
    ("Simon Willison", "https://simonwillison.net/atom/everything/"),
    ("Latent Space", "https://www.latent.space/feed"),
    ("Google AI Blog", "https://blog.google/technology/ai/rss/"),
]

REDDIT_SUBS = ["LocalLLaMA", "MachineLearning"]

# Terms used to keep the Hacker News firehose on-topic.
HN_QUERY = "LLM OR Claude OR GPT OR agent OR MCP OR Anthropic OR OpenAI"


def _github_headers() -> dict:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=12.0, headers={"User-Agent": USER_AGENT}, follow_redirects=True)


class RateLimited(Exception):
    pass


class NotFound(Exception):
    pass


# --------------------------------------------------------------------------- #
# GitHub
# --------------------------------------------------------------------------- #
def _trim_repo(raw: dict) -> Repo:
    return Repo(
        full_name=raw.get("full_name", ""),
        name=raw.get("name", ""),
        description=raw.get("description"),
        stargazers_count=raw.get("stargazers_count", 0),
        pushed_at=raw.get("pushed_at"),
        language=raw.get("language"),
        topics=raw.get("topics", []) or [],
        open_issues_count=raw.get("open_issues_count", 0),
        owner={"login": (raw.get("owner") or {}).get("login", "")} if raw.get("owner") else None,
        html_url=raw.get("html_url", ""),
        homepage=raw.get("homepage"),
        license={"spdx_id": (raw.get("license") or {}).get("spdx_id")} if raw.get("license") else None,
    )


async def search_github(query: str, per_page: int) -> List[Repo]:
    q = f"{query} in:name,description,readme"
    params = {"q": q, "sort": "stars", "order": "desc", "per_page": str(per_page)}
    async with _client() as client:
        res = await client.get(GITHUB_SEARCH, params=params, headers=_github_headers())
    if res.status_code in (403, 429) and res.headers.get("X-RateLimit-Remaining") == "0":
        raise RateLimited()
    if res.status_code == 422:
        return []
    res.raise_for_status()
    items = res.json().get("items", [])
    return [_trim_repo(r) for r in items if isinstance(r, dict)]


async def get_github_repo(owner: str, repo: str) -> RepoDetail:
    full = f"{owner}/{repo}"
    async with _client() as client:
        res = await client.get(f"{GITHUB_REPOS}/{full}", headers=_github_headers())
        if res.status_code == 404:
            raise NotFound()
        if res.status_code in (403, 429) and res.headers.get("X-RateLimit-Remaining") == "0":
            raise RateLimited()
        res.raise_for_status()
        raw = res.json()
        # Best-effort README excerpt — never blocks the response.
        paras: List[str] = []
        try:
            rd = await client.get(
                f"{GITHUB_REPOS}/{full}/readme",
                headers={**_github_headers(), "Accept": "application/vnd.github.raw"},
            )
            if rd.status_code == 200:
                paras = md_to_paras(rd.text)
        except httpx.HTTPError:
            pass

    base = _trim_repo(raw)
    return RepoDetail(**base.model_dump(), readme_paras=paras)


def md_to_paras(md: str) -> List[str]:
    """Reduce a README to 1-2 readable paragraphs (port of the frontend cleaner)."""
    if not md:
        return []
    md = re.sub(r"```[\s\S]*?```", "", md)
    md = re.sub(r"<[^>]+>", "", md)
    md = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", md)
    md = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", md)
    md = re.sub(
        r"^[#>\-*\s].*$",
        lambda m: "" if re.match(r"^#{1,6}\s", m.group(0)) or re.search(r"shields\.io|badge|!\[", m.group(0)) else m.group(0),
        md,
        flags=re.MULTILINE,
    )
    md = re.sub(r"[*_`>#]", "", md)
    blocks = [re.sub(r"\s+", " ", b).strip() for b in re.split(r"\n\s*\n", md)]
    keep = [b for b in blocks if len(b) > 60 and re.search(r"[a-z]", b) and not b.startswith("http")]
    return keep[:2]


# --------------------------------------------------------------------------- #
# Articles: Hacker News, RSS, Reddit
# --------------------------------------------------------------------------- #
def _strip_html(text: Optional[str], limit: int = 220) -> Optional[str]:
    if not text:
        return None
    clean = re.sub(r"<[^>]+>", "", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    if not clean:
        return None
    return clean[:limit] + ("…" if len(clean) > limit else "")


async def fetch_hn(limit: int = 12) -> List[Article]:
    params = {"query": HN_QUERY, "tags": "story", "hitsPerPage": str(limit)}
    async with _client() as client:
        res = await client.get(HN_SEARCH, params=params)
    res.raise_for_status()
    out: List[Article] = []
    for h in res.json().get("hits", []):
        url = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
        out.append(
            Article(
                id=f"hn-{h.get('objectID')}",
                title=h.get("title") or "(untitled)",
                url=url,
                source="Hacker News",
                author=h.get("author"),
                score=h.get("points"),
                comments=h.get("num_comments"),
                published_at=h.get("created_at"),
                summary=_strip_html(h.get("story_text")),
            )
        )
    return out


def _parse_one_feed(name: str, raw: bytes, per_feed: int) -> List[Article]:
    parsed = feedparser.parse(raw)
    out: List[Article] = []
    for e in parsed.entries[:per_feed]:
        link = getattr(e, "link", None)
        title = getattr(e, "title", None)
        if not link or not title:
            continue
        published = None
        if getattr(e, "published_parsed", None):
            published = datetime(*e.published_parsed[:6], tzinfo=timezone.utc).isoformat()
        out.append(
            Article(
                id="rss-" + hashlib.sha1(link.encode()).hexdigest()[:12],
                title=title,
                url=link,
                source=name,
                author=getattr(e, "author", None),
                published_at=published,
                summary=_strip_html(getattr(e, "summary", None)),
            )
        )
    return out


async def fetch_rss(per_feed: int = 4) -> List[Article]:
    async def one(name: str, url: str) -> List[Article]:
        try:
            async with _client() as client:
                res = await client.get(url)
            if res.status_code != 200:
                return []
            return _parse_one_feed(name, res.content, per_feed)
        except (httpx.HTTPError, Exception):
            return []

    results = await asyncio.gather(*(one(n, u) for n, u in RSS_FEEDS))
    return [a for sub in results for a in sub]


async def fetch_reddit(per_sub: int = 6) -> List[Article]:
    async def one(sub: str) -> List[Article]:
        try:
            async with _client() as client:
                res = await client.get(
                    f"https://www.reddit.com/r/{sub}/top.json",
                    params={"t": "week", "limit": str(per_sub)},
                )
            if res.status_code != 200:
                return []
            posts = res.json().get("data", {}).get("children", [])
            out: List[Article] = []
            for p in posts:
                d = p.get("data", {})
                ext = d.get("url_overridden_by_dest") or d.get("url")
                permalink = f"https://www.reddit.com{d.get('permalink', '')}"
                created = d.get("created_utc")
                published = (
                    datetime.fromtimestamp(created, tz=timezone.utc).isoformat() if created else None
                )
                out.append(
                    Article(
                        id=f"rd-{d.get('id')}",
                        title=d.get("title") or "(untitled)",
                        url=ext or permalink,
                        source=f"r/{sub}",
                        author=d.get("author"),
                        score=d.get("ups"),
                        comments=d.get("num_comments"),
                        published_at=published,
                        summary=None,
                    )
                )
            return out
        except (httpx.HTTPError, Exception):
            return []

    results = await asyncio.gather(*(one(s) for s in REDDIT_SUBS))
    return [a for sub in results for a in sub]


NEWSAPI = "https://newsapi.org/v2/everything"


async def fetch_newsapi(limit: int = 10) -> List[Article]:
    """Optional source — only active when NEWS_API_KEY is set."""
    key = os.environ.get("NEWS_API_KEY")
    if not key:
        return []
    params = {
        "q": 'LLM OR "large language model" OR Anthropic OR OpenAI OR "AI agent"',
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": str(limit),
    }
    try:
        async with _client() as client:
            res = await client.get(NEWSAPI, params=params, headers={"X-Api-Key": key})
        if res.status_code != 200:
            return []
        out: List[Article] = []
        for a in res.json().get("articles", []):
            url = a.get("url")
            if not url or not a.get("title"):
                continue
            out.append(
                Article(
                    id="na-" + hashlib.sha1(url.encode()).hexdigest()[:12],
                    title=a["title"],
                    url=url,
                    source=(a.get("source") or {}).get("name") or "NewsAPI",
                    author=a.get("author"),
                    published_at=a.get("publishedAt"),
                    summary=_strip_html(a.get("description")),
                )
            )
        return out
    except (httpx.HTTPError, Exception):
        return []


def _norm_url(url: str) -> str:
    try:
        p = urlparse(url)
        return (p.netloc + p.path).lower().rstrip("/")
    except ValueError:
        return url.lower()


def _sort_key(a: Article) -> float:
    if a.published_at:
        try:
            return datetime.fromisoformat(a.published_at.replace("Z", "+00:00")).timestamp()
        except ValueError:
            try:
                return parsedate_to_datetime(a.published_at).timestamp()
            except (TypeError, ValueError):
                pass
    return float(a.score or 0)


async def aggregate_articles(limit: int = 12) -> List[Article]:
    """Fan out to every source concurrently, dedupe, and sort newest-first."""
    results = await asyncio.gather(
        fetch_hn(), fetch_rss(), fetch_reddit(), fetch_newsapi(), return_exceptions=True
    )
    articles: List[Article] = []
    for r in results:
        if isinstance(r, list):
            articles.extend(r)

    seen = set()
    deduped: List[Article] = []
    for a in articles:
        key = _norm_url(a.url)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(a)

    deduped.sort(key=_sort_key, reverse=True)
    return deduped[:limit]
