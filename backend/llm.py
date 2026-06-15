"""Thin Claude (claude-sonnet-4-6) JSON helper for the scorer and formatter.

Claude is used when ANTHROPIC_API_KEY is set (e.g. on Render). When it's absent
or a call fails, callers fall back to deterministic logic — so the API stays up
and fully functional keyless (which is also how it's verified locally).
"""
import json
import os
from typing import Optional

MODEL = "claude-sonnet-4-6"

_client = None
_checked = False


def _get_client():
    global _client, _checked
    if _checked:
        return _client
    _checked = True
    if not os.environ.get("ANTHROPIC_API_KEY"):
        _client = None
        return None
    try:
        from anthropic import AsyncAnthropic

        _client = AsyncAnthropic()
    except Exception as exc:  # SDK missing / bad config — degrade gracefully
        print(f"[llm] Claude unavailable: {exc}")
        _client = None
    return _client


def available() -> bool:
    return _get_client() is not None


async def complete_json(prompt: str, schema: dict, max_tokens: int = 600) -> Optional[dict]:
    """Ask Claude for a single JSON object matching `schema`. None on any failure."""
    client = _get_client()
    if client is None:
        return None
    try:
        resp = await client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
        text = next((b.text for b in resp.content if getattr(b, "type", None) == "text"), "")
        return json.loads(text) if text else None
    except Exception as exc:
        print(f"[llm] call failed: {exc}")
        return None
