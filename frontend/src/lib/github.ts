// Keyless, typed access to the GitHub Search + Repos APIs (CORS-enabled, no
// auth). One search request per query returns everything a card needs.
import type { Repo, Cat, CatId, Section } from '../types'

const SEARCH = 'https://api.github.com/search/repositories'
const REPOS = 'https://api.github.com/repos'
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

// Front-page sections — each maps to a GitHub search query. Tunable.
export const SECTIONS: Section[] = [
  { id: 'skills', label: 'Skills', query: 'claude skill' },
  { id: 'mcp', label: 'MCP Servers', query: 'mcp server' },
  { id: 'web', label: 'Browser & Web', query: 'browser automation' },
  { id: 'data', label: 'Data & DB', query: 'database vector' },
  { id: 'agents', label: 'Agents', query: 'ai agent framework' },
]

function rateLimited(res: Response): boolean {
  return res.status === 429 || (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0')
}

export async function searchRepos(query: string, perPage: number, signal?: AbortSignal): Promise<Repo[]> {
  const q = `${query} in:name,description,readme`
  const url = `${SEARCH}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`
  const res = await fetch(url, { headers: ACCEPT, signal })
  if (rateLimited(res)) throw new RateLimitError()
  if (res.status === 422) return [] // malformed query → no results
  if (!res.ok) throw new Error(`GitHub search failed (${res.status})`)
  const data = (await res.json()) as { items?: Repo[] }
  return Array.isArray(data.items) ? data.items : []
}

export async function getRepo(fullName: string, signal?: AbortSignal): Promise<Repo> {
  const res = await fetch(`${REPOS}/${fullName}`, { headers: ACCEPT, signal })
  if (res.status === 404) throw new NotFoundError()
  if (rateLimited(res)) throw new RateLimitError()
  if (!res.ok) throw new Error(`GitHub repo failed (${res.status})`)
  return (await res.json()) as Repo
}

// Best-effort README excerpt — never blocks the render.
export async function getReadmeParas(fullName: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch(`${REPOS}/${fullName}/readme`, {
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
    .replace(/```[\s\S]*?```/g, '') // code fences
    .replace(/<[^>]+>/g, '') // html
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
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

// ---- formatting helpers ----
export function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)
}

export function ago(iso: string, long = false): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000
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
