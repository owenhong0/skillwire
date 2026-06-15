"""Trust verification layer.

verify_source(url) classifies a source as verified / unverified / flagged:
- Allowlisted domains → "verified".
- Unknown domains → fetch basic signals (HTTPS, an /about page, domain age via
  WHOIS *if the optional `whois` package is installed*) and grade them:
  decent signals → "unverified"; weak → "flagged".

Per the spec, flagged results are later filtered unless their score > 80.
Results are cached per-domain (cheap network checks run at most once a day).
"""
import asyncio
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

import httpx

from cache import get_or_set

# Allowlist → display label.
TRUSTED_DOMAINS = {
    "github.com": "GitHub",
    "developer.mozilla.org": "MDN",
    "docs.python.org": "Python Docs",
    "arxiv.org": "arXiv",
    "npmjs.com": "npm",
    "pypi.org": "PyPI",
    "developer.apple.com": "Apple",
    "web.dev": "web.dev",
    "docs.microsoft.com": "Microsoft",
    "stackoverflow.com": "Stack Overflow",
    "news.ycombinator.com": "Hacker News",
}


def _host(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower().split(":")[0]
        return netloc[4:] if netloc.startswith("www.") else netloc
    except ValueError:
        return ""


def _match_trusted(host: str) -> Optional[str]:
    for domain, label in TRUSTED_DOMAINS.items():
        if host == domain or host.endswith("." + domain):
            return label
    return None


async def _domain_age_ok(host: str) -> Optional[bool]:
    """True if the domain is > 1 year old. None if WHOIS isn't available."""
    try:
        import whois  # optional dependency
    except Exception:
        return None

    def query():
        try:
            created = whois.whois(host).creation_date
            return created[0] if isinstance(created, list) else created
        except Exception:
            return None

    try:
        created = await asyncio.wait_for(asyncio.to_thread(query), timeout=4.0)
    except Exception:
        return None
    if not isinstance(created, datetime):
        return None
    return (datetime.now() - created).days > 365


async def _basic_signals(url: str, host: str):
    https = url.lower().startswith("https")
    about = False
    try:
        async with httpx.AsyncClient(
            timeout=5.0, follow_redirects=True, headers={"User-Agent": "skillwire/1.0"}
        ) as client:
            res = await client.get(f"https://{host}/about")
            about = res.status_code == 200
    except httpx.HTTPError:
        about = False
    age_ok = await _domain_age_ok(host)
    return https, about, age_ok


async def _verify(url: str, host: str) -> dict:
    label = _match_trusted(host)
    if label:
        return {"trusted": True, "label": label, "reason": "allowlisted domain", "level": "verified"}

    https, about, age_ok = await _basic_signals(url, host)
    pts = (1 if https else 0) + (1 if about else 0) + (1 if age_ok else 0)
    detail = f"https={https}, about={about}, age_ok={age_ok}"
    if pts >= 2:
        return {"trusted": False, "label": host, "reason": f"unknown domain, signals ok ({detail})", "level": "unverified"}
    return {"trusted": False, "label": host, "reason": f"unknown domain, weak signals ({detail})", "level": "flagged"}


async def verify_source(url: str) -> dict:
    """Return {"trusted": bool, "label": str, "reason": str, "level": str}."""
    host = _host(url)
    if not host:
        return {"trusted": False, "label": "unknown", "reason": "no host in url", "level": "flagged"}
    return await get_or_set(f"trust:{host}", 86400, lambda: _verify(url, host))
