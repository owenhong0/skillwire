# Backend / agent pipeline reference

> **Scope correction:** there is no "Scout" agent and no `web_search`. Candidate
> discovery is plain HTTP in `sources.py`. The two genuine *agents* (Claude calls) are
> the **Scorer** and **Formatter**. The API is **REST/JSON**, not an NDJSON event stream.

## Pipeline overview

`sources` → `trust` → `scorer` → `formatter`, orchestrated by `pipeline.run_pipeline`.

`sources.py` fetches raw candidates (repos from the GitHub Search API; news from Hacker
News, curated RSS, Reddit, and optional NewsAPI). For each candidate, `run_pipeline` runs
three stages concurrently across items: **Trust** classifies the source's credibility,
**Scorer** rates it 0–100, and **Formatter** writes the card copy and assembles signals —
dropping anything too weak. The result is a ranked list of unified `Card`s, cached per
endpoint. Each stage exists to convert a raw, noisy feed into a trustworthy, comparable,
human-readable card without a human in the loop.

## Agent reference

### Trust (`trust.py` → `verify_source`)
- **Purpose:** decide how much to trust a result's source.
- **Input:** a URL (the article URL, or `https://github.com/<owner>/<repo>`).
- **Output:** `{ trusted: bool, label: str, reason: str, level: "verified"|"unverified"|"flagged" }`.
- **Model / cost:** none — allowlist (`TRUSTED_DOMAINS`) plus cheap signal checks (HTTPS,
  an `/about` page, optional WHOIS domain age if the `whois` package is installed). Cached per domain (24h).
- **Failure behavior:** network errors degrade to weaker signals; a domain with no host or
  failed checks falls back to `flagged`. Never raises into the pipeline.

### Scorer (`scorer.py` → `score_item`) — *Claude agent*
- **Purpose:** rate an item 0–100 for ranking and filtering.
- **Input:** the raw item dict, the query/topic, the `trusted` bool, and the kind.
- **Output:** an `int` 0–100 (the model's `reasoning` is logged to stdout for debugging).
- **Model / cost:** `claude-sonnet-4-6`, one call per item, structured-JSON output,
  `max_tokens≈400` → roughly a few hundred tokens per call.
- **Failure behavior:** if `ANTHROPIC_API_KEY` is unset or the call fails, falls back to a
  deterministic score from trust + community + quality signals. Never blocks a result.

### Formatter (`formatter.py` → `format_card`) — *Claude agent*
- **Purpose:** produce the final, clean card and apply quality gating.
- **Input:** the raw item dict, its score, the trust dict, and the kind.
- **Output:** a `Card` dict (`title, description, type, repo, tags, signals, score, trust,
  sourceLabel`) — or **`None`** to filter the item out.
- **Model / cost:** `claude-sonnet-4-6`, one call per surviving item, `max_tokens≈400`.
  Only the description + tags come from Claude; `signals` are assembled from real data.
- **Failure behavior:** returns `None` when `score < 40`, or when `trust=="flagged"` and
  `score < 80`. If Claude is unavailable, uses the item's existing text + topic-derived tags.

> **Latency note:** Scorer + Formatter = ~2 Claude calls per item. Items are processed
> concurrently (`asyncio.gather`) and each endpoint caches its enriched result (TTL in
> `main.py`), so the cost is paid at most once per cache window.

## API response schema (the real thing)

The backend returns **JSON**, not an NDJSON event stream. There are no `event: status`
/ `result` / `done` frames. Mapping the originally-requested event types to reality:

| Requested event | Reality |
|---|---|
| `event: status { message }` | none — single request/response; show a client-side "Searching…" + cold-start banner |
| `event: result { ...card }` | one element of the returned `Card[]` JSON array |
| `event: score_debug { slug, score, trust_label }` | server-side stdout logs from `scorer.py` (`[scorer] … -> NN`) |
| `event: error { message }` | a normal HTTP error (`{"detail": "..."}`, e.g. 429/404) |
| `event: done` | end of the JSON array |

**`Card`** (`GET /api/articles`, `GET /api/repos/search`):

```jsonc
{
  "title": "string",
  "description": "string",
  "type": "skill" | "repo" | "news",
  "repo": "string",            // "owner/name" for repos, source URL for news
  "tags": ["string"],
  "signals": [{ "src": "string", "icon": "string", "val": "string" }],
  "score": 0,                  // int 0-100
  "trust": "verified" | "unverified" | "flagged",
  "sourceLabel": "string"      // e.g. "GitHub", "Hacker News", "simonwillison.net"
}
```

`GET /api/repos/{owner}/{repo}` returns a `RepoDetail` (the raw repo fields plus
`readme_paras: string[]`) for the article/dossier view. `GET /api/health` → `{"ok": true}`.

## Adding a new data source

1. **`sources.py`** — add a `fetch_<source>()` async function that returns a list of dicts
   shaped like `Article` (news) or `Repo` (repos). Normalize fields (`title`, `url`,
   `source`, `score`, `published_at`, …).
2. For **news**, add it to the `asyncio.gather(...)` in `aggregate_articles`. For **repos**,
   add a `SECTIONS` entry (id → query) if it's a new front-page section.
3. **`trust.py`** — if the new source has a stable, credible domain, add it to
   `TRUSTED_DOMAINS` so its items grade `verified`.
4. Nothing else changes — `pipeline.run_pipeline` scores/formats whatever the source returns,
   and `main.py` already serves it. Restart and hit `/api/articles` to confirm.

## Tuning the scorer

The rubric lives in `scorer.py`:

- **Relevance (0–30)**, **Credibility (0–25)** (a trusted domain earns full points),
  **Content quality (0–25)**, **Community signals (0–20)**.

Two places to adjust, independently:

- **Claude path** — edit the rubric text in `_prompt(...)`. Change the point ceilings or
  emphasis there; the JSON schema (`SCORE_SCHEMA`) stays the same, so no other agent breaks.
- **Fallback path** — edit the weights in `_fallback(...)` (the `credibility`, `relevance`,
  `quality`, `community` locals). Keep the total clamped to 0–100.

The only cross-agent contract is the **filter thresholds** (`score < 40`, and
`flagged && score < 80`) enforced in `formatter.format_card` — change those there, not in
the scorer, so the meaning of "score" stays consistent everywhere.
