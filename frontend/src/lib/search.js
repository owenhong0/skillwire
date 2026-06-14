// Live, keyless search. The browser calls the GitHub Search API and the
// Hacker News (Algolia) API directly — both support CORS and need no auth.
//
// GitHub unauthenticated limits: Search API 10 req/min, core API 60 req/hour
// (per IP). We make exactly ONE GitHub request per search: the repository
// search response already includes stars, last-commit date, topics, language,
// license and description for every result, so no per-repo follow-up calls are
// needed. Hacker News is a separate, generous host (one cheap call per repo).

const GITHUB_SEARCH = 'https://api.github.com/search/repositories'
const HN_SEARCH = 'https://hn.algolia.com/api/v1/search'
const PER_PAGE = 8

// Light query bias so the two tabs return meaningfully different results.
// Tunable — add "claude" to either to narrow to the Claude ecosystem.
const BIAS = {
  skill: 'skill',
  repo: 'mcp',
}

export class RateLimitError extends Error {}

// ---- helpers ---------------------------------------------------------------

function humanizeCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`.replace('.0k', 'k')
  return String(n)
}

function commitAge(iso) {
  if (!iso) return null
  const when = new Date(iso)
  if (isNaN(when)) return null
  const days = Math.floor((Date.now() - when.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 14) return `${days}d ago`
  if (days < 60) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function inferKind(repo, type) {
  if (type === 'skill') return 'skill'
  const hay = `${repo.full_name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase()
  if (/\bmcp\b/.test(hay)) return 'mcp server'
  if (/\bcli\b/.test(hay)) return 'cli tool'
  return 'library'
}

function buildTags(repo) {
  const topics = (repo.topics || []).filter(Boolean).slice(0, 6)
  if (topics.length) return topics
  return repo.language ? [repo.language.toLowerCase()] : []
}

// Honest, data-backed "good for" lines — no invented strengths.
function buildUses(repo) {
  const uses = []
  if (repo.language) uses.push(`Written in ${repo.language}`)
  const spdx = repo.license && repo.license.spdx_id
  if (spdx && spdx !== 'NOASSERTION') uses.push(`${spdx} licensed`)
  uses.push('Open the repo to see how to install and use it.')
  return uses.slice(0, 3)
}

function baseSignals(repo) {
  const signals = [{ src: 'GitHub', icon: 'star', val: `${humanizeCount(repo.stargazers_count || 0)} ★` }]
  const age = commitAge(repo.pushed_at)
  if (age) signals.push({ src: 'Maintained', icon: 'clock', val: `last commit ${age}` })
  return signals
}

function toCard(repo, type) {
  return {
    type,
    name: repo.name,
    repo: repo.full_name,
    kind: inferKind(repo, type),
    summary: repo.description || 'No description provided — open the source to see what it does.',
    tags: buildTags(repo),
    uses: buildUses(repo),
    signals: baseSignals(repo),
  }
}

// ---- GitHub repository search ----------------------------------------------

export async function searchRepos(query, type, signal) {
  const q = `${query} ${BIAS[type] || ''}`.trim()
  const url = `${GITHUB_SEARCH}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_PAGE}`

  const resp = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
    signal,
  })

  if (resp.status === 403 || resp.status === 429) {
    // Unauthenticated rate limit — no key needed, the IP is just busy.
    if (resp.headers.get('X-RateLimit-Remaining') === '0' || resp.status === 429) {
      throw new RateLimitError()
    }
  }
  if (resp.status === 422) return [] // malformed query → treat as no results
  if (!resp.ok) throw new Error(`GitHub search failed (HTTP ${resp.status})`)

  const data = await resp.json()
  const items = Array.isArray(data.items) ? data.items : []
  return items.map((repo) => toCard(repo, type))
}

// ---- Hacker News discussion signal -----------------------------------------

export async function fetchHnSignal(repoFullName, signal) {
  const slug = repoFullName.split('/').pop()
  const url = `${HN_SEARCH}?query=${encodeURIComponent(slug)}&tags=story&hitsPerPage=3`
  let resp
  try {
    resp = await fetch(url, { signal })
  } catch {
    return null
  }
  if (!resp.ok) return null
  const data = await resp.json().catch(() => null)
  const hits = data && Array.isArray(data.hits) ? data.hits : []
  if (!hits.length) return null
  const points = hits.reduce((sum, h) => sum + (parseInt(h.points, 10) || 0), 0)
  if (points <= 0) return null
  const n = hits.length
  return { src: 'Hacker News', icon: 'hn', val: `${points} pts across ${n} post${n !== 1 ? 's' : ''}` }
}
