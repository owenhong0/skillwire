"""Scoring agent. Claude (claude-sonnet-4-6) rates each item 0-100; falls back
to a deterministic signal-based score when Claude isn't available.

Rubric (0-100):
- Relevance to the query        0-30
- Source credibility            0-25  (trusted domain = full points)
- Content quality               0-25  (docs/README, maintenance, clear description)
- Community signals             0-20  (stars, forks, HN points, upvotes)
"""
import math

from llm import available, complete_json

SCORE_SCHEMA = {
    "type": "object",
    "properties": {"score": {"type": "integer"}, "reasoning": {"type": "string"}},
    "required": ["score", "reasoning"],
    "additionalProperties": False,
}


def _label(raw: dict) -> str:
    return raw.get("title") or raw.get("name") or raw.get("full_name") or "(item)"


def _clamp(n) -> int:
    return max(0, min(100, int(round(float(n)))))


def _prompt(raw: dict, query: str, trusted: bool, kind: str) -> str:
    facts = {
        "title": _label(raw),
        "description": raw.get("description") or raw.get("summary") or "",
        "source_url": raw.get("url") or raw.get("html_url") or raw.get("full_name") or "",
        "trusted_domain": trusted,
        "stars": raw.get("stargazers_count"),
        "open_issues": raw.get("open_issues_count"),
        "last_commit": raw.get("pushed_at"),
        "hn_points": raw.get("score") if kind == "news" else None,
        "hn_comments": raw.get("comments") if kind == "news" else None,
        "topics": raw.get("topics") or [],
    }
    import json as _json

    return (
        "You are scoring one result for a catalog of AI/LLM tools and news.\n"
        f'Original query / focus: "{query}"\n'
        f"Item type: {kind}\n\n"
        "Score 0-100 using this rubric:\n"
        "- Relevance to the query (0-30)\n"
        "- Source credibility (0-25) — a trusted domain earns the full 25\n"
        "- Content quality (0-25) — clear description, docs/README, active maintenance\n"
        "- Community signals (0-20) — stars, forks, HN points, upvotes\n\n"
        f"Facts:\n{_json.dumps(facts, indent=2, default=str)}\n\n"
        "Return ONLY a JSON object: {\"score\": <int 0-100>, \"reasoning\": <one sentence>}."
    )


def _fallback(raw: dict, trusted: bool, kind: str) -> int:
    credibility = 25 if trusted else 12
    relevance = 20  # the item already matched the query/section/feed
    desc = raw.get("description") or raw.get("summary") or ""
    quality = 5
    if len(desc) >= 40:
        quality += 12
    elif desc:
        quality += 6
    if raw.get("topics") or raw.get("tags"):
        quality += 4
    if raw.get("pushed_at"):
        quality += 4
    quality = min(25, quality)
    metric = raw.get("stargazers_count") or raw.get("score") or 0
    community = 4 if metric <= 0 else min(20, int(4 + 4 * math.log10(metric + 1)))
    return _clamp(credibility + relevance + quality + community)


async def score_item(raw: dict, query: str, trusted: bool, kind: str) -> int:
    if available():
        data = await complete_json(_prompt(raw, query, trusted, kind), SCORE_SCHEMA, max_tokens=400)
        if data and isinstance(data.get("score"), (int, float)):
            print(f"[scorer] {_label(raw)} -> {int(data['score'])} | {str(data.get('reasoning', ''))[:160]}")
            return _clamp(data["score"])
    score = _fallback(raw, trusted, kind)
    print(f"[scorer] {_label(raw)} -> {score} (deterministic fallback)")
    return score
