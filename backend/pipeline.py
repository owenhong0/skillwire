"""The enrichment pipeline: verify (trust) -> score -> format, per item.

Runs all items concurrently, drops anything the formatter filters out, and
returns ranked Cards. Wired into the /api/articles and /api/repos/search
endpoints in main.py.
"""
import asyncio
from typing import List

from formatter import format_card
from models import Card
from scorer import score_item
from trust import verify_source

_FLAGGED = {"trusted": False, "label": "unknown", "reason": "no url", "level": "flagged"}


async def _one(raw: dict, query: str, kind: str):
    url = raw.get("url") or raw.get("html_url")
    if not url and raw.get("full_name"):
        url = f"https://github.com/{raw['full_name']}"
    trust = await verify_source(url) if url else dict(_FLAGGED)
    score = await score_item(raw, query, trust["trusted"], kind)
    card = await format_card(raw, score, trust, kind)
    return Card(**card) if card else None


async def run_pipeline(raw_items: List[dict], query: str, kind: str) -> List[Card]:
    results = await asyncio.gather(
        *(_one(r, query, kind) for r in raw_items), return_exceptions=True
    )
    cards: List[Card] = []
    for r in results:
        if isinstance(r, Card):
            cards.append(r)
        elif isinstance(r, Exception):
            print(f"[pipeline] item failed: {r}")
    cards.sort(key=lambda c: c.score, reverse=True)
    return cards
