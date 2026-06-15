import { useEffect, useState } from 'react'
import type { Card } from '../types'
import useSearch from '../hooks/useSearch'
import StoryCard from './StoryCard'
import { NewsState, Sk } from './news'
import { MoodEmptyIcon } from './Icons'

type Open = (repo: string) => void
type Filter = 'all' | 'skill' | 'repo'

const EXAMPLES = [
  'Claude MCP tools',
  'Python data pipeline',
  'React hooks library',
  'LLM agent framework',
  'vector database',
  'FastAPI starter',
]

// "Popular this week" — static, real repos, shown on the landing state.
const POPULAR: Card[] = [
  {
    title: 'claude-engineer',
    repo: 'Doriandarko/claude-engineer',
    type: 'repo',
    description:
      'Full-stack AI coding assistant built on Claude. Handles file ops, web search, and multi-step tasks autonomously.',
    tags: ['claude', 'agents', 'coding'],
    score: 91,
    trust: 'verified',
    sourceLabel: 'GitHub',
    signals: [],
  },
  {
    title: 'FastAPI',
    repo: 'tiangolo/fastapi',
    type: 'repo',
    description:
      'High-performance Python web framework with automatic OpenAPI docs. The standard for modern Python APIs.',
    tags: ['python', 'api', 'backend'],
    score: 88,
    trust: 'verified',
    sourceLabel: 'GitHub',
    signals: [],
  },
  {
    title: 'LangChain',
    repo: 'langchain-ai/langchain',
    type: 'repo',
    description: 'Framework for building LLM-powered applications with chains, agents, and memory.',
    tags: ['llm', 'agents', 'python'],
    score: 82,
    trust: 'verified',
    sourceLabel: 'GitHub',
    signals: [],
  },
]

export default function Discover({ onOpen }: { onOpen: Open }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { cards, status, error, search, retry } = useSearch()

  const runSearch = (query: string) => {
    setFilter('all')
    search(query)
  }

  const clear = () => {
    setQ('')
    setFilter('all')
    search('') // resets to idle
  }

  const visible = filter === 'all' ? cards : cards.filter((c) => c.type === filter)

  return (
    <div className="disco">
      <p className="hero-subtitle">
        Find the best Claude skills and repos, scored and verified in real time
      </p>

      <form
        className="disco-search"
        onSubmit={(e) => {
          e.preventDefault()
          runSearch(q)
        }}
      >
        <div className="disco-input-wrap">
          <input
            type="search"
            aria-label="Search the catalog"
            placeholder="Search the catalog — try 'pdf', 'postgres', 'browser automation'"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="clear-x" aria-label="Clear search" onClick={clear}>
              ×
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          {status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* idle: example chips */}
      {status === 'idle' && (
        <div className="example-chips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="example-chip"
              onClick={() => {
                setQ(ex)
                runSearch(ex)
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && (
        <>
          <StatusBanner />
          <DiscoSkeleton />
        </>
      )}

      {status === 'error' && (
        <NewsState
          title="The presses are paused"
          action={
            <button className="btn" onClick={retry}>
              Try again
            </button>
          }
        >
          {error}
        </NewsState>
      )}

      {(status === 'empty' || (status === 'done' && visible.length === 0)) && (
        <div className="empty-state">
          <MoodEmptyIcon className="empty-icon" />
          <h3>No results found</h3>
          <p>Try a broader search term</p>
        </div>
      )}

      {status === 'done' && cards.length > 0 && (
        <>
          <div className="filter-chips" role="tablist" aria-label="Filter results">
            {(['all', 'skill', 'repo'] as Filter[]).map((f) => (
              <button
                key={f}
                className={`filter-chip${filter === f ? ' active' : ''}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'skill' ? 'Skills' : 'Repos'}
              </button>
            ))}
          </div>
          {visible.length > 0 && (
            <div className="disco-grid">
              {visible.map((c) => (
                <StoryCard key={c.repo} card={c} onOpen={onOpen} />
              ))}
            </div>
          )}
        </>
      )}

      {/* landing: popular this week (hidden once a search runs) */}
      {status === 'idle' && (
        <section className="popular">
          <h4>Popular this week</h4>
          <div className="disco-grid">
            {POPULAR.map((c) => (
              <StoryCard key={c.repo} card={c} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      <p className="disco-foot">Results are AI-scored — always verify before installing.</p>
    </div>
  )
}

// Status banner: cycles phase messages, then shows the cold-start note after 8s.
// (The backend is one REST request, so the phases are a client-side approximation
// of the real sources → score → format stages.)
function StatusBanner() {
  const PHASES = ['Searching the web…', 'Scoring results…', 'Formatting cards…']
  const [msg, setMsg] = useState(PHASES[0])
  const [cold, setCold] = useState(false)

  useEffect(() => {
    let i = 0
    const phase = setInterval(() => {
      i = Math.min(i + 1, PHASES.length - 1)
      setMsg(PHASES[i])
    }, 1600)
    const coldTimer = setTimeout(() => setCold(true), 8000)
    return () => {
      clearInterval(phase)
      clearTimeout(coldTimer)
    }
  }, [])

  return (
    <div className="status-banner" role="status">
      {cold ? 'Our server is waking up — first load takes ~30s. Hang tight.' : msg}
    </div>
  )
}

function DiscoSkeleton() {
  return (
    <div className="disco-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="card-skeleton" key={i}>
          <Sk h={92} />
          <Sk h={18} w="70%" mt={14} />
          <Sk h={12} w="95%" mt={10} />
          <Sk h={12} w="85%" mt={6} />
          <Sk h={20} w="55%" mt={14} />
        </div>
      ))}
    </div>
  )
}
