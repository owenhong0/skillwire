# Changelog

All notable changes to Skillwire are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the project aims
to follow semantic versioning.

## [0.1.0] — 2026-06-15

First tagged release. Inferred from the project's git history.

### Added
- Live, keyless static frontend that searched GitHub directly from the browser. (`f23523a`)
- Visual **Learn** page (8 AI concepts with inline SVG diagrams). (`fd155a4`)
- FastAPI backend aggregating real AI/LLM news (Hacker News, RSS, Reddit) plus
  GitHub repos, with in-memory caching. (`d4fb9e7`)
- **Trust + scoring + formatting** agent pipeline: `trust.py` (source allowlist +
  signal checks), `scorer.py` (Claude `claude-sonnet-4-6`, 0–100), `formatter.py`
  (Claude card copy + tags), `pipeline.py` (`run_pipeline`). Endpoints now return a
  unified enriched `Card`; the frontend shows a trust badge + score. (`88441ee`)

### Changed
- Rebuilt the entire frontend into the **"Skillwire Dispatch"** editorial design in
  **TypeScript/TSX** (Trending front page, Discover search, article dossier, Learn). (`9735cbf`)
- Restyled to Open Design's open-source "claude" design system. (`fd155a4`)
- Wired the frontend to the live Render backend at `skillwire.onrender.com` via a
  build-time `VITE_API_BASE`. (`41a7e02`)
- Pointed all deploy config at `owenhong0/skillwire` (lowercase) for GitHub Pages. (`af6f8c9`)

### Removed
- The original keyless, browser-only data path was superseded by the backend
  (a direct-GitHub fallback remains for local dev without the backend). (`d4fb9e7`)

[0.1.0]: https://github.com/owenhong0/skillwire/commits/main
