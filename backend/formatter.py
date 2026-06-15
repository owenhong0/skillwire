"""Formatter agent. Produces the clean card the frontend renders.

Claude (claude-sonnet-4-6) writes a specific 1-2 sentence description and 3-5
tags; signals are assembled from real data (never invented). Falls back to
rule-based text when Claude isn't available.

Returns None (filtered out) when score < 40, or when trust is "flagged" and
score < 80.
"""
import re
from datetime import datetime, timezone
from typing import List, Optional

from llm import available, complete_json

FORMAT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "description", "tags"],
    "additionalProperties": False,
}


def _label(raw: dict) -> str:
    return raw.get("title") or raw.get("name") or raw.get("full_name") or "Untitled"


def _fmt_num(n) -> str:
    n = int(n or 0)
    if n >= 1000:
        return f"{n / 1000:.1f}k".replace(".0k", "k")
    return str(n)


def _ago(iso: Optional[str]) -> Optional[str]:
    if not iso:
        return None
    try:
        when = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except ValueError:
        return None
    days = (datetime.now(timezone.utc) - when).days
    if days <= 0:
        return "today"
    if days < 14:
        return f"{days}d ago"
    if days < 60:
        return f"{days // 7}w ago"
    if days < 365:
        return f"{days // 30}mo ago"
    return f"{days // 365}y ago"


def _card_type(kind: str) -> str:
    return "news" if kind == "news" else ("skill" if kind == "skill" else "repo")


def _repo_ref(raw: dict, kind: str) -> str:
    if kind == "news":
        return raw.get("url") or raw.get("html_url") or ""
    return raw.get("full_name") or raw.get("url") or ""


def _signals(raw: dict, kind: str, source_label: str) -> List[dict]:
    out: List[dict] = []
    if kind == "news":
        pts = raw.get("score")
        if isinstance(pts, int) and pts > 0:
            out.append({"src": source_label or "source", "icon": "hn", "val": f"{pts} pts"})
        comments = raw.get("comments")
        if isinstance(comments, int) and comments > 0:
            out.append({"src": "Discussion", "icon": "hn", "val": f"{comments} comments"})
        age = _ago(raw.get("published_at"))
        if age:
            out.append({"src": "Published", "icon": "clock", "val": age})
    else:
        out.append({"src": "GitHub", "icon": "star", "val": f"{_fmt_num(raw.get('stargazers_count'))} ★"})
        age = _ago(raw.get("pushed_at"))
        if age:
            out.append({"src": "Maintained", "icon": "clock", "val": f"last commit {age}"})
        issues = raw.get("open_issues_count")
        if isinstance(issues, int):
            out.append({"src": "Issues", "icon": "alert", "val": f"{_fmt_num(issues)} open"})
    return out


def _fallback_tags(raw: dict) -> List[str]:
    tags = [t for t in (raw.get("topics") or []) if isinstance(t, str)][:5]
    if tags:
        return tags
    if raw.get("language"):
        return [str(raw["language"]).lower()]
    return []


def _titleize(name: str) -> str:
    return re.sub(r"\b\w", lambda m: m.group(0).upper(), re.sub(r"[-_.]", " ", name or ""))


def _format_prompt(raw: dict, kind: str) -> str:
    import json as _json

    facts = {
        "name": _label(raw),
        "current_description": raw.get("description") or raw.get("summary") or "",
        "topics": raw.get("topics") or [],
        "language": raw.get("language"),
        "type": kind,
    }
    return (
        "Write a catalog card for this AI/LLM resource.\n"
        f"{_json.dumps(facts, indent=2, default=str)}\n\n"
        "Rules:\n"
        "- title: a clean human-readable title.\n"
        "- description: ONE or TWO sentences, SPECIFIC (not generic) — say what makes this "
        "uniquely useful. No marketing fluff.\n"
        "- tags: 3-5 concise lowercase keyword tags.\n"
        "Return ONLY a JSON object with keys title, description, tags."
    )


async def format_card(raw: dict, score: int, trust: dict, kind: str) -> Optional[dict]:
    level = trust.get("level", "flagged")
    if score < 40:
        return None
    if level == "flagged" and score < 80:
        return None

    title = _titleize(_label(raw)) if kind != "news" else _label(raw)
    description = raw.get("description") or raw.get("summary") or ""
    tags = _fallback_tags(raw)

    if available():
        refined = await complete_json(_format_prompt(raw, kind), FORMAT_SCHEMA, max_tokens=400)
        if refined:
            title = refined.get("title") or title
            description = refined.get("description") or description
            rtags = refined.get("tags")
            if isinstance(rtags, list) and rtags:
                tags = [str(t) for t in rtags][:5]

    if not description:
        description = "No description provided — open the source to see what it does."

    return {
        "title": title,
        "description": description,
        "type": _card_type(kind),
        "repo": _repo_ref(raw, kind),
        "tags": tags[:5],
        "signals": _signals(raw, kind, trust.get("label", "")),
        "score": score,
        "trust": level,
        "sourceLabel": trust.get("label", "source"),
    }
