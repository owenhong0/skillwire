# Skillwire — "The Skillwire Dispatch"

> A live, newspaper-style front page for the Claude / LLM tooling ecosystem — real
> AI/LLM **news** and **GitHub repos**, trust-checked and scored 0–100 in real time.

[![Site Audit](https://github.com/owenhong0/skillwire/actions/workflows/audit.yml/badge.svg)](https://github.com/owenhong0/skillwire/actions/workflows/audit.yml)
&nbsp;[![Live site](https://img.shields.io/badge/live-owenhong0.github.io%2Fskillwire-2E5D4B)](https://owenhong0.github.io/skillwire/)
&nbsp;![License](https://img.shields.io/badge/license-TODO-lightgrey)
<!-- [TODO: verify] no LICENSE file exists in the repo yet — add one and update this badge. -->

```
┌──────────────────────────────────────────────────────────────┐
│  THE SKILLWIRE DISPATCH            Trending · Discover · Learn │
│  All the skills that are fit to ship — we highlight,          │
│  we don't audit.                                              │
├───────────────────────────────────────┬──────────────────────┤
│  LEAD STORY                            │  ON THE WIRE          │
│  ┌─────────┐  MCP Server · Lead        │  1 · HN headline      │
│  │ ╱╲ glyph│  browser-mcp              │  2 · RSS headline     │
│  └─────────┘  ✓ Verified  [87]         │  3 · Reddit headline  │
│  A controllable headless browser…      │  …                    │
│  4.6k ★ · last commit 1d ago           │                       │
├───────────────────────────────────────┴──────────────────────┤
│  [secondary repo card]  [secondary repo card]  [secondary]    │
└──────────────────────────────────────────────────────────────┘
```

## What it does

Skillwire is a curated, always-fresh front page for people building with Claude and
other LLMs. Instead of manually searching GitHub and skimming Hacker News, you get one
editorial view that pulls **repos** (skills, MCP servers, CLI tools, libraries) and
**real news articles**, then runs each result through a trust check and an AI scorer so
the strongest, most credible items rise to the top. Every card shows *why* it surfaced
(stars, last commit, HN points) and a trust badge — because Skillwire highlights, it
does not audit. It's for developers who want a signal-rich starting point, not a raw
search results page.

## How it works

> ⚠️ **Accuracy note:** earlier drafts described a "Scout agent + `web_search` +
> `POST /api/search` + NDJSON stream." That is **not** how this codebase works. The real
> pipeline is below: plain REST/JSON, candidate discovery via `sources.py` (not a Scout
> agent), and Claude used only for scoring and formatting.

```
  User opens the site / searches
        │
  React + Vite frontend (TypeScript) — GitHub Pages
        │   GET /api/articles | /api/repos/search | /api/repos/{owner}/{repo}
        ▼
  FastAPI backend (Render)
        │
  sources.py  ── GitHub Search API        (repos)
              ── Hacker News (Algolia)     (news)   ┐ fetched
              ── curated RSS feeds         (news)   │ concurrently
              ── Reddit JSON               (news)   ┘
        │
  pipeline.run_pipeline  (per item, concurrent):
        │   trust.verify_source  → verified / unverified / flagged
        │   scorer.score_item    → Claude (claude-sonnet-4-6) 0–100   (deterministic fallback)
        │   formatter.format_card→ Claude card copy + tags; drops score<40 / flagged<80
        ▼
  JSON array of enriched Cards  →  rendered as Dispatch cards
        (in-memory TTL cache on every endpoint)
```

## Quickstart

### Run locally

Backend (terminal 1):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # optional — works keyless (deterministic scoring)
uvicorn main:app --reload     # http://localhost:8000
```

Frontend (terminal 2):

```bash
cd frontend
echo "VITE_API_BASE=http://localhost:8000" > .env
npm install
npm run dev                   # http://localhost:5173
```

Build the frontend for production:

```bash
cd frontend
npm run build                 # runs: tsc --noEmit && vite build
```

### Env vars needed

Minimum to run: none (keyless). To enable Claude scoring/formatting set
`ANTHROPIC_API_KEY`. See the table below.

## Project structure

```
skillwire/
├── render.yaml                  # Render deploy config for the backend
├── vercel.json                  # alt static-frontend deploy config
├── audit.sh                     # Lighthouse + backend smoke-test script (CI)
├── CHANGELOG.md
├── .github/
│   ├── workflows/audit.yml      # GitHub Actions: runs audit.sh on push to main
│   └── ISSUE_TEMPLATE/          # bug_report.md, feature_request.md
├── backend/                     # FastAPI service (Render)
│   ├── main.py                  # app, CORS, the 4 REST routes
│   ├── sources.py               # GitHub / Hacker News / RSS / Reddit / NewsAPI fetchers
│   ├── pipeline.py              # run_pipeline: verify → score → format (concurrent)
│   ├── trust.py                 # verify_source: allowlist + signal checks
│   ├── scorer.py                # Claude 0–100 scorer (+ deterministic fallback)
│   ├── formatter.py             # Claude card copy + tags; assembles signals; filters
│   ├── llm.py                   # Claude JSON helper, gated on ANTHROPIC_API_KEY
│   ├── cache.py                 # in-memory TTL cache
│   ├── models.py                # Pydantic: Card, Signal, Repo, RepoDetail, Article
│   ├── AGENTS.md                # pipeline / agent reference
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    # React + Vite + TypeScript (GitHub Pages)
│   ├── index.html
│   ├── vite.config.ts           # base: '/skillwire/'
│   ├── tsconfig.json
│   ├── .env.example / .env.production   # VITE_API_BASE
│   ├── COMPONENTS.md            # component reference
│   └── src/
│       ├── App.tsx              # top-level view router (Trending/Discover/Learn + dossier)
│       ├── main.tsx
│       ├── types.ts             # Card, Signal, Trust, Repo, RepoDetail, View
│       ├── lib/github.ts        # data layer → backend (GitHub fallback for dev)
│       ├── hooks/useSearch.ts   # Discover search state + 10-min cache
│       └── components/          # TopBar, Masthead, Trending, Discover, StoryCard,
│                                #   Headlines, StoryArticle, TrustBadge, Motif,
│                                #   Icons, LearnPage, Diagrams, news
├── frontend/design-refs/        # original Open Design "Dispatch" artifacts
└── legacy/                      # the original v1 static site
```

## Environment variables

| Variable | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | No (enables Claude) | platform.claude.com → API keys. Without it, scoring/formatting use a deterministic fallback. |
| `GITHUB_TOKEN` | No | github.com → Settings → Developer settings → tokens. Raises GitHub's rate limit 60→5000/hr. |
| `NEWS_API_KEY` | No | newsapi.org. Adds NewsAPI as an extra article source. |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allowlist. Defaults to the Pages origin + localhost. |
| `VITE_API_BASE` | Frontend, build-time | The backend URL, e.g. `https://skillwire.onrender.com`. Set in `frontend/.env.production`. |

## Deployment

### Frontend → GitHub Pages

`VITE_API_BASE` is baked in at build time (it's in `frontend/.env.production`). Then:

```bash
cd frontend
npm run deploy                # builds and pushes dist/ to the gh-pages branch
```

Live at **https://owenhong0.github.io/skillwire/** (`base: '/skillwire/'` in `vite.config.ts`).

### Backend → Render

Defined in [`render.yaml`](render.yaml). Create a Render Blueprint from the repo; set
`ANTHROPIC_API_KEY` (and optionally `GITHUB_TOKEN` / `NEWS_API_KEY`) in the dashboard.

> **Free tier spin-down:** the Render free instance sleeps after ~15 min idle. The first
> request after a nap takes ~30–60s while it cold-starts. A keep-warm ping to
> `/api/health` avoids it; a paid tier removes it.

## Contributing

- **Tests:** none yet. `npm run build` (frontend, includes `tsc --noEmit`) and a backend
  import check are the current gates. Adding `pytest` for `trust.py`/`pipeline.py` is welcome.
- **Code style:** frontend is TypeScript (strict) — let `tsc` guide you; keep components
  small and typed. Backend is async FastAPI; network I/O lives in `sources.py`/`trust.py`.
- **Add a trusted domain:** edit `TRUSTED_DOMAINS` in `backend/trust.py` (map the domain
  to a display label). Anything on the list is graded `verified`.

See [`backend/AGENTS.md`](backend/AGENTS.md) and [`frontend/COMPONENTS.md`](frontend/COMPONENTS.md)
for deeper references.
