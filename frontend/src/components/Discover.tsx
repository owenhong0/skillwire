import { useState } from 'react'
import useSearch from '../hooks/useSearch'
import StoryCard from './StoryCard'
import { NewsState, Sk } from './news'

type Open = (repo: string) => void

export default function Discover({ onOpen }: { onOpen: Open }) {
  const [q, setQ] = useState('')
  const { cards, status, error, search, retry } = useSearch()

  return (
    <div className="disco">
      <div className="strap">
        <span>Discover</span>
        <span className="grow" />
        <span>live search · trust-scored</span>
      </div>

      <form
        className="disco-search"
        onSubmit={(e) => {
          e.preventDefault()
          search(q)
        }}
      >
        <input
          type="search"
          aria-label="Search the catalog"
          placeholder="Search the catalog — try 'pdf', 'postgres', 'browser automation'"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {status === 'idle' && (
        <NewsState title="Search the live catalog">
          Type a function and hit search. Results are ranked, trust-checked, and scored — we
          highlight, we don't audit.
        </NewsState>
      )}
      {status === 'loading' && <DiscoSkeleton />}
      {status === 'empty' && <NewsState title="Nothing on the wire">{error}</NewsState>}
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
      {status === 'done' && (
        <div className="disco-grid">
          {cards.map((c) => (
            <StoryCard key={c.repo} card={c} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoSkeleton() {
  return (
    <div className="disco-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Sk h={120} />
          <Sk h={20} w="60%" mt={12} />
          <Sk h={14} w="90%" mt={8} />
          <Sk h={12} w="40%" mt={10} />
        </div>
      ))}
    </div>
  )
}
