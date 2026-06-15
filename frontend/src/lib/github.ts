// Data layer. Talks to the Skillwire Dispatch backend (FastAPI), which now
// returns enriched, trust-scored Cards. When VITE_API_BASE is unset (local dev
// without the backend), repo search falls back to direct keyless GitHub and
// maps raw repos into Cards client-side (no score); the news feed requires the
// backend.
import type { Repo, RepoDetail, Card, Cat, CatId, Section } from '../types'

const API_BASE: string = import.meta.env.VITE_API_BASE || ''

const GH_SEARCH = 'https://api.github.com/search/repositories'
const GH_REPOS = 'https://api.github.com/repos'
const ACCEPT = { Accept: 'application/vnd.github+json' }

export class RateLimitError extends Error {
  constructor() {
    super('rate limited')
    this.name = 'RateLimitError'
  }
}
export class NotFoundError extends Error {
  constructor() {
    super('not found')
    this.name = 'NotFoundError'
  }
}
export class NoBackendError extends Error {
  constructor() {
    super('backend not configured')
    this.name = 'NoBackendError'
  }
}

export const SECTIONS: Section[] = [
  { id: 'skills', label: 'Skills', query: 'claude skill' },
  { id: 'mcp', label: 'MCP Servers', query: 'mcp server' },
  { id: 'web', label: 'Browser & Web', query: 'browser automation' },
  { id: 'data', label: 'Data & DB', query: 'database vector' },
  { id: 'agents', label: 'Agents', query: 'ai agent framework' },
]

function ghRateLimited(res: Response): boolean {
  return res.status === 429 || (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0')
}

// ---- repos: search → enriched Cards ----
export async function searchRepos(query: string, perPage: number, signal?: AbortSignal): Promise<Card[]> {
  if (API_BASE) {
    const url = `${API_BASE}/api/repos/search?q=${encodeURIComponent(query)}&per_page=${perPage}`
    const res = await fetch(url, { signal })
    if (res.status === 429) throw new RateLimitError()
    if (!res.ok) throw new Error(`search failed (${res.status})`)
    return (await res.json()) as Card[]
  }
  // dev fallback: direct GitHub → map to Cards (no score/trust scoring)
  const q = `${query} in:name,description,readme`
  const url = `${GH_SEARCH}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`
  const res = await fetch(url, { headers: ACCEPT, signal })
  if (ghRateLimited(res)) throw new RateLimitError()
  if (res.status === 422) return []
  if (!res.ok) throw new Error(`GitHub search failed (${res.status})`)
  const data = (await res.json()) as { items?: Repo[] }
  return (Array.isArray(data.items) ? data.items : []).map(repoToCard)
}

function repoToCard(r: Repo): Card {
  const c = kindToCat(r)
  const signals = [{ src: 'GitHub', icon: 'star', val: `${fmtNum(r.stargazers_count)} ★` }]
  if (r.pushed_at) signals.push({ src: 'Maintained', icon: 'clock', val: `last commit ${ago(r.pushed_at)}` })
  return {
    title: titleize(r.name),
    description: r.description || 'No description provided — open the source to see what it does.',
    type: c.cat === 'skill' ? 'skill' : 'repo',
    repo: r.full_name,
    tags: (r.topics || []).slice(0, 5),
    signals,
    score: 0, // unknown without the backend's scoring agent
    trust: 'verified',
    sourceLabel: 'GitHub',
  }
}

// ---- articles (news) → enriched Cards (backend required) ----
export async function fetchArticles(limit = 12, signal?: AbortSignal): Promise<Card[]> {
  if (!API_BASE) throw new NoBackendError()
  const res = await fetch(`${API_BASE}/api/articles?limit=${limit}`, { signal })
  if (!res.ok) throw new Error(`articles failed (${res.status})`)
  return (await res.json()) as Card[]
}

// ---- repo detail (dossier): repo + readme paragraphs ----
export async function getRepoDetail(fullName: string, signal?: AbortSignal): Promise<RepoDetail> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/repos/${fullName}`, { signal })
    if (res.status === 404) throw new NotFoundError()
    if (res.status === 429) throw new RateLimitError()
    if (!res.ok) throw new Error(`repo failed (${res.status})`)
    return (await res.json()) as RepoDetail
  }
  const res = await fetch(`${GH_REPOS}/${fullName}`, { headers: ACCEPT, signal })
  if (res.status === 404) throw new NotFoundError()
  if (ghRateLimited(res)) throw new RateLimitError()
  if (!res.ok) throw new Error(`GitHub repo failed (${res.status})`)
  const repo = (await res.json()) as Repo
  const readme_paras = await getReadmeParas(fullName, signal)
  return { ...repo, readme_paras }
}

async function getReadmeParas(fullName: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch(`${GH_REPOS}/${fullName}/readme`, {
      headers: { Accept: 'application/vnd.github.raw' },
      signal,
    })
    if (!res.ok) return []
    return mdToParas(await res.text())
  } catch {
    return []
  }
}

function mdToParas(input: string): string[] {
  if (!input) return []
  let md = input
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  md = md.replace(/^[#>\-*\s].*$/gm, (l) =>
    /^#{1,6}\s/.test(l) || /shields\.io|badge|!\[/.test(l) ? '' : l,
  )
  md = md.replace(/[*_`>#]/g, '')
  return md
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 60 && /[a-z]/.test(b) && !/^https?:\/\//.test(b))
    .slice(0, 2)
}

// ---- helpers ----
export function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)
}

export function ago(iso: string, long = false): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000
  if (Number.isNaN(d)) return ''
  if (d < 1) return 'today'
  if (d < 2) return long ? '1 day ago' : '1d ago'
  if (d < 30) return `${Math.round(d)}${long ? ' days ago' : 'd ago'}`
  if (d < 365) return `${Math.round(d / 30)}${long ? ' months ago' : 'mo ago'}`
  return `${Math.round(d / 365)}${long ? ' years ago' : 'y ago'}`
}

export function titleize(name: string): string {
  return (name || '').replace(/[-_.]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

export function kindToCat(r: Repo): Cat {
  const hay = `${r.name || ''} ${r.description || ''} ${(r.topics || []).join(' ')}`.toLowerCase()
  return catFromText(hay)
}

// Category for a Card (drives the line-art Motif).
export function catForCard(card: Card): CatId {
  if (card.type === 'news') return 'web'
  return catFromText(`${card.title} ${card.description} ${card.tags.join(' ')}`.toLowerCase()).cat
}

function catFromText(hay: string): Cat {
  if (/\bmcp\b|model context protocol/.test(hay)) return { cat: 'mcp', label: 'MCP Server' }
  if (/browser|scrape|crawl|playwright|puppeteer|web/.test(hay)) return { cat: 'web', label: 'Browser & Web' }
  if (/database|postgres|sqlite|sql|vector|duckdb/.test(hay)) return { cat: 'data', label: 'Data & DB' }
  if (/agent|autonomous|orchestr/.test(hay)) return { cat: 'agent', label: 'Agent' }
  if (/\bcli\b|command.line|terminal/.test(hay)) return { cat: 'cli', label: 'CLI Tool' }
  return { cat: 'skill', label: 'Skill' }
}

const CAT_LABELS: Record<CatId, string> = {
  skill: 'Skill',
  mcp: 'MCP Server',
  web: 'Browser & Web',
  data: 'Data & DB',
  agent: 'Agent',
  cli: 'CLI Tool',
}
export function catLabel(cat: CatId): string {
  return CAT_LABELS[cat] || 'Skill'
}
