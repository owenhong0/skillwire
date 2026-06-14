# Skillwire

Live search for popular Claude **skills** and **repos** (MCP servers, CLI
tools, libraries) — with **no API keys and no backend**.

Type a query, hit search, and the browser queries live data directly:

1. **GitHub Search API** (keyless) finds the top matching repositories, sorted
   by stars — returning name, description, topics, language, stars, and
   last-commit date in a single request.
2. **Hacker News (Algolia) API** (keyless) attaches discussion points for each
   repo as a second signal.

Cards render as soon as the GitHub request returns; each card's Hacker News
chip fills in as it resolves. Every card shows an **evidence strip** (why it
surfaced) and a visible amber **"Not audited"** caution panel — a deliberate,
permanent feature. Skillwire highlights; it does not audit. Check the source
before installing.

> **No keys, by design.** Both APIs are public and CORS-enabled, so the static
> site calls them straight from the browser. Nothing to sign up for, nothing to
> deploy a server for.

## Layout

```
skillwire/
├── vercel.json            static deploy config (Vercel)
├── frontend/
│   ├── index.html
│   ├── vite.config.js     React 18 + Vite (no dev proxy — no backend)
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx        top-level UI, search state, nav
│       ├── styles.css     design tokens in :root at the top
│       ├── lib/search.js  keyless GitHub + Hacker News queries → card objects
│       ├── hooks/useSearch.js   search state, 10-min in-memory cache, progressive HN enrichment
│       └── components/    SkillCard, SkeletonCard, Icons
└── legacy/                the original v1 static site, kept for reference
```

## Run it locally

One process. No environment variables, no keys.

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Open the page and search for `pdf`, `postgres`, or `browser automation`.
Cards appear after one request; HN chips pop in a moment later.

## Build

```bash
cd frontend
npm run build    # outputs frontend/dist/
npm run preview  # serve the production build locally
```

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages) — there
is no server. `vercel.json` at the repo root builds the frontend and serves
`frontend/dist` with SPA rewrites:

- **Vercel** — import the repo; the included `vercel.json` handles it. No env
  vars to set.
- **Netlify / Cloudflare Pages** — build command `cd frontend && npm install &&
  npm run build`, publish directory `frontend/dist`.
- **GitHub Pages** — `npm run build` and publish `frontend/dist`.

## How a card is built

| Field     | Source |
|-----------|--------|
| `name`    | GitHub repo name |
| `repo`    | `owner/name` |
| `kind`    | `skill` (skills tab) or inferred (`mcp server` / `cli tool` / `library`) from name/description/topics |
| `summary` | GitHub repo description |
| `tags`    | GitHub topics (falls back to primary language) |
| `uses`    | Factual lines — language, license, and an "open the repo" pointer |
| `signals` | GitHub stars · Hacker News points · last-commit age |

```json
{
  "type": "repo",
  "name": "browser-mcp",
  "repo": "driftco/browser-mcp",
  "kind": "mcp server",
  "summary": "A controllable headless browser exposed to agents over MCP.",
  "tags": ["browser", "automation", "mcp"],
  "uses": ["Written in TypeScript", "MIT licensed", "Open the repo to see how to install and use it."],
  "signals": [
    { "src": "GitHub",      "icon": "star",  "val": "4.6k ★" },
    { "src": "Hacker News", "icon": "hn",    "val": "301 pts across 3 posts" },
    { "src": "Maintained",  "icon": "clock", "val": "last commit 1d ago" }
  ]
}
```

## Notes & limits

- **Skills vs repos tabs** bias the GitHub query with a keyword (`skill` /
  `mcp`). These are tunable constants — `BIAS` at the top of
  `frontend/src/lib/search.js`. Add `claude` to narrow to the Claude ecosystem.
- **No AI-written prose.** Removing API keys means removing Claude; summaries
  and tags now come straight from GitHub metadata rather than being written by
  an agent.
- **No star velocity.** The `+N/mo` figure needed the paginated, timestamped
  stargazers API, which exhausts GitHub's unauthenticated 60-requests/hour
  limit almost immediately from a browser. The strip shows total stars instead.
- **GitHub rate limits** (unauthenticated, per IP): Search API ~10 req/min.
  Each search makes exactly one GitHub request, and a 10-minute cache reuses
  identical `(query, type)` searches. If you hit the limit, the UI shows a
  "wait a minute" message.
- **Design system** (do not change without reason): Space Grotesk (headings),
  IBM Plex Sans (body), IBM Plex Mono (labels). Color tokens live in
  `frontend/src/styles.css` `:root`. The amber caution strip is core.
