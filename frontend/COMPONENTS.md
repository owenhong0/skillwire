# Frontend component reference

> React + Vite + **TypeScript**. The data layer is `src/lib/github.ts` (calls the REST
> backend; falls back to direct GitHub in dev). There is no NDJSON stream — components
> consume plain `Card` / `RepoDetail` JSON. Types live in `src/types.ts`.

## Component inventory

### `App.tsx`
- **Renders:** the shell — `TopBar`, a `<main>` that switches between views, and the footer.
- **State:** `view: 'trending' | 'discover' | 'learn'`; `story: string | null` (the repo
  slug of an open dossier; non-null overrides the view to show `StoryArticle`).
- **Props:** none.

### `TopBar.tsx`
- **Renders:** brand wordmark + nav (Trending / Discover / Learn) + "Search the catalog".
- **Props:** `view: View` (required), `onNav: (v: View) => void` (required).
- **Card fields:** none.

### `Masthead.tsx`
- **Renders:** the Dispatch nameplate + today's date. **Props:** none. **State:** none.

### `Trending.tsx`
- **Renders:** Masthead, section tabs, and the front page — a lead story + up to 3
  secondary `StoryCard`s + the `Headlines` rail.
- **Props:** `onOpen: (repo: string) => void` (required) — open a repo's dossier.
- **Card fields (lead):** `sourceLabel`, `title`, `repo`, `description`, `signals`, `trust`, `score`.
- **State:** `active` (section index), `items: Card[]`, `status`, `count`. Fetches via
  `searchRepos(SECTIONS[active].query, …)` on section change.

### `Discover.tsx`
- **Renders:** the search box + a grid of `StoryCard`s, with loading/empty/error states.
- **Props:** `onOpen: (repo: string) => void` (required).
- **Card fields:** delegated to `StoryCard`.
- **State:** `q` (input). Search state comes from the `useSearch` hook.

### `StoryCard.tsx`
- **Renders:** one card — glyph (`Motif`), `sourceLabel` kicker, title, description, a
  signals meta line, and a `TrustBadge`. `type === 'news'` → external link; otherwise an
  `onOpen(repo)` click.
- **Props:** `card: Card` (required), `onOpen: (repo: string) => void` (required).
- **Card fields:** `type`, `sourceLabel`, `title`, `description`, `signals`, `trust`, `score`, `repo`.

### `Headlines.tsx`
- **Renders:** the "On the wire" news rail — fetches news `Card`s and lists them as briefs
  (external links) with a `TrustBadge`. Handles loading / empty / error / no-backend states.
- **Props:** none.
- **Card fields:** `repo` (url), `title`, `sourceLabel`, `signals`, `trust`, `score`.
- **State:** `items: Card[]`, `status`. Fetches via `fetchArticles(7)`.

### `StoryArticle.tsx`
- **Renders:** the article/"dossier" view for a repo — kicker, title, dek, byline, glyph,
  body (README paragraphs), evidence chips, the "Not audited" caution panel, source links.
- **Props:** `repo: string` (required, slug), `onBack: () => void` (required).
- **Data:** fetches `getRepoDetail(repo)` → `RepoDetail` (raw repo fields + `readme_paras`);
  category derived internally via `kindToCat`. **State:** `st` (loading/ok/notfound/error).

### `TrustBadge.tsx`
- **Renders:** the trust pill (✓ Verified / Unverified / ⚠ Flagged) + an optional score chip.
- **Props:** `trust: Trust` (required), `score?: number` (optional; chip hidden when 0/absent).

### `Motif.tsx`
- **Renders:** a line-art SVG glyph per category. **Props:** `cat: CatId` (required).

### `Icons.tsx`
- **Renders:** inline SVG icons (`GlassIcon`, `StarIcon`, `ClockIcon`, `AlertIcon`,
  `CodeIcon`, `WarnIcon`, `ArrowIcon`, `BackArrowIcon`). No icon-font dependency.

### `LearnPage.tsx` + `Diagrams.tsx`
- **Renders:** the static "Learn" page — 8 AI concepts, each paired with an inline SVG
  diagram from `Diagrams.tsx`. **Props:** none. **Card fields:** none (no API calls).

### `news.tsx`
- **`NewsState`** — empty/error block. Props: `title: string`, `children: ReactNode`, `action?: ReactNode`.
- **`Sk`** — one shimmer skeleton bar. Props: `h: number`, `w?: string`, `mt?: number`.

## Data flow

```
            src/lib/github.ts  (fetch: searchRepos / fetchArticles / getRepoDetail)
                  │
        ┌─────────┼───────────────────────────┐
        ▼         ▼                           ▼
  hooks/useSearch.ts   Trending.tsx /        StoryArticle.tsx
   (Discover state,    Headlines.tsx          (dossier fetch)
    10-min cache)      (fetch on mount)
        │                  │                       │
        ▼                  ▼                       ▼
     App.tsx  ── view + open-story state; renders the active view ──►  components
                  │
                  └── onOpen(repo) ─► App sets `story` ─► StoryArticle
```

`App.tsx` owns navigation (`view`) and which dossier is open (`story`). `useSearch`
owns Discover's query/results. `Trending`, `Headlines`, and `StoryArticle` fetch their
own data directly through `lib/github.ts`.

## Adding a new card field

1. **Backend:** add the field to `Card` in `backend/models.py` and populate it in
   `backend/formatter.py` (`format_card`'s returned dict).
2. **Frontend types:** add it to the `Card` interface in `src/types.ts`.
3. **Render it:** update the component(s) that show cards — `StoryCard.tsx`,
   `Headlines.tsx`, and/or `Trending.tsx`'s `Lead` (and `StoryArticle.tsx` if relevant).
4. **Style it:** add any CSS to `src/styles/skillwire.css`.
5. Run `npm run build` (`tsc --noEmit` will flag every spot that needs the field).

## Styling conventions

- **CSS variables** live in `src/styles/skillwire.css` (`:root` — fonts, accent, caution,
  shell) and `src/styles/news.css` (the editorial layer — paper/ink/rule tones, serif
  fonts). Both are imported in `src/main.tsx`.
- **Change the theme:** edit the tokens (`--accent`, `--accent-ink`, `--paper`, `--ink`,
  `--rule`, …). Components reference tokens, not literal colors.
- **Breakpoints (current):** `news.css` has `@media (max-width: 860px)` — the front-page
  grid collapses to one column and the rail moves below. `skillwire.css` honors
  `prefers-reduced-motion`. <!-- [TODO: a 480px mobile pass is planned but not yet added] -->
