"""Tiny async-friendly in-memory TTL cache.

Mirrors the client-side pattern in frontend/src/hooks/useSearch.ts — no Redis,
no DB. Render's free tier is ephemeral, which is fine: the cache only exists to
smooth over rate limits within an instance's lifetime.
"""
import time
from typing import Any, Awaitable, Callable

_store: "dict[str, tuple[float, Any]]" = {}


async def get_or_set(key: str, ttl: float, factory: Callable[[], Awaitable[Any]]) -> Any:
    """Return a cached value if fresh, else await `factory()`, store, and return it."""
    now = time.time()
    hit = _store.get(key)
    if hit is not None and now - hit[0] < ttl:
        return hit[1]
    value = await factory()
    _store[key] = (now, value)
    return value
