# Skillwire — "The Skillwire Dispatch"

A live, editorial (newspaper-style) front page for the Claude / LLM tooling
ecosystem. It surfaces **real AI/LLM news articles** and **GitHub repos** (skills,
MCP servers, CLI tools, libraries) side by side, ranked from live public activity.
Skillwire **highlights; it does not audit** — every story links to the source.

Two parts:

- **Frontend** — TypeScript + React + Vite, deployed static to **GitHub Pages**.
- **Backend** — **FastAPI** (Python), deployed to **Render**. Aggregates news +
  proxies/caches GitHub. Holds any secrets **server-side only** — nothing reaches
  the browser, and the whole thing works keyless by default.

```
Browser (GitHub Pages)
   │  fetch ${VITE_API_BASE}/api/...
   ▼
FastAPI on Render ──► GitHub Search/Repos  (+ optional GITHUB_TOKEN, cached)
                  ──► Hacker News (Algolia)         (keyless)
                  ──► curated AI/LLM RSS feeds      (server-side; dodges CORS)
                  ──► Reddit public JSON            (keyless)
                  ──► NewsAPI                        (optional; only if NEWS_API_KEY set)
```

If `VITE_API_BASE` is unset (local dev without the backend), the frontend falls
back to calling GitHub directly for repos; the news rail shows a "needs backend"
note.

## Layout

```
skillwire/
├── render.yaml                 backend deploy config (Render)
├── vercel.json                 alt static-frontend deploy config
├── backend/                    FastAPI service
│   ├── main.py                 app + CORS + routes
│   ├── sources.py              GitHub / Hacker News / RSS / Reddit / NewsAPI fetchers
│   ├── cache.py                in-memory TTL cache
│   ├── models.py               Pydantic Article / Repo / RepoDetail
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   TypeScript React (Vite)
│   ├── src/lib/github.ts       data layer — routes to backend, GitHub fallback
│   ├── src/components/         TopBar, Trending, Discover, StoryArticle, Headlines, Learn …
│   ├── src/styles/             skillwire.css (base) + news.css (editorial layer)
│   └── .env.example            VITE_API_BASE
├── design-refs/                original Open Design "Dispatch" artifacts
└── legacy/                     the original v1 static site
```

## API

`GET /api/health` → `{ "ok": true }`
`GET /api/articles?limit=` → aggregated, deduped, recency-sorted `Article[]`
`GET /api/repos/search?section=<id>|q=<text>&per_page=` → `Repo[]`
`GET /api/repos/{owner}/{repo}` → `Repo` + `readme_paras`

Sections: `skills`, `mcp`, `web`, `data`, `agents` (tunable in `backend/sources.py`).

## Run it locally

**Backend** (`:8000`):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # optional — all keys are optional
uvicorn main:app --reload
```

**Frontend** (`:5173`, second terminal):

```bash
cd frontend
echo "VITE_API_BASE=http://localhost:8000" > .env   # point at the local backend
npm install
npm run dev
```

Open http://localhost:5173 — Trending shows repo stories with a live **"On the wire"**
headlines rail; Discover searches the catalog; clicking a story opens its dossier.
Omit the `.env` to run frontend-only (repos via direct GitHub; news rail shows a note).

## Environment variables

### Backend (`backend/.env`) — all optional, server-side only

| Variable          | Purpose |
|-------------------|---------|
| `GITHUB_TOKEN`    | Raises GitHub's API rate limit (60/hr → 5000/hr). |
| `NEWS_API_KEY`    | If set, adds NewsAPI (newsapi.org) as an article source. |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist. Defaults to the Pages origin + localhost. |

### Frontend

| Variable        | Purpose |
|-----------------|---------|
| `VITE_API_BASE` | Backend origin, baked in at **build time**. Unset → direct-GitHub fallback (no news). |

## Deploy

- **Backend → Render.** `render.yaml` at the repo root: Python web service,
  `rootDir: backend`, `uvicorn main:app`. Set `GITHUB_TOKEN` / `NEWS_API_KEY` in the
  dashboard (both `sync: false`). Free tier sleeps when idle (~30–60s cold start) —
  an optional keep-warm ping to `/api/health` avoids it.
- **Frontend → GitHub Pages.** Set `VITE_API_BASE` to the Render URL (e.g. in
  `frontend/.env.production`) so it's inlined at build, then `npm run deploy`
  (`gh-pages -d dist`). Lives at https://owenhong0.github.io/skillwire/.

## Notes

- **Keyless by default, keys never in the browser.** News works with no keys; the
  GitHub token and NewsAPI key are optional server-only secrets on Render.
- **Design** comes from Open Design's open-source "Dispatch" / editorial artifacts
  (preserved in `design-refs/`). The amber **"Not audited"** caution is core — it
  lives in the masthead motto, each article dossier, and the footer.
