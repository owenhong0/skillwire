import { useState } from 'react'
import useSearch from './hooks/useSearch.js'
import SkillCard from './components/SkillCard.jsx'
import SkeletonCard from './components/SkeletonCard.jsx'
import { GlassIcon, CloseIcon } from './components/Icons.jsx'

const PLACEHOLDER = "Search by name or function — try 'pdf', 'database', 'automation'"

export default function App() {
  const [view, setView] = useState('skills') // 'skills' | 'repos'
  const [q, setQ] = useState('')
  const { cards, status, error, search, retry } = useSearch()

  const typeFor = (v) => (v === 'skills' ? 'skill' : 'repo')

  const submit = (e) => {
    e.preventDefault()
    search(q, typeFor(view))
  }

  const switchView = (v) => {
    if (v === view) return
    setView(v)
    if (q.trim()) search(q, typeFor(v)) // re-run the active query in the new section
  }

  const onTag = (tag) => {
    setQ(tag)
    search(tag, typeFor(view))
  }

  const clear = () => {
    setQ('')
    search('', typeFor(view))
  }

  const loading = status === 'loading'

  return (
    <>
      <header className="banner">
        <div className="banner-inner">
          <div className="wordmark">
            Skill<span>wire</span>
          </div>
          <p className="banner-note">
            <b>We highlight, we don't audit.</b> Picks are based on live public activity, not a
            security review — check the source before you install anything.
          </p>
        </div>
      </header>

      <main>
        <nav className="nav" aria-label="Sections">
          <button
            data-view="skills"
            aria-current={view === 'skills'}
            onClick={() => switchView('skills')}
          >
            Skills
          </button>
          <button
            data-view="repos"
            aria-current={view === 'repos'}
            onClick={() => switchView('repos')}
          >
            Repos
          </button>
        </nav>

        <form className="search" onSubmit={submit}>
          <GlassIcon className="glass" />
          <input
            type="search"
            autoComplete="off"
            aria-label="Search"
            placeholder={PLACEHOLDER}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="clear" aria-label="Clear search" onClick={clear}>
              <CloseIcon />
            </button>
          )}
          <button type="submit" className="go" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <ResultLine status={status} count={cards.length} view={view} />

        <div id="grid">
          {cards.map((card) => (
            <SkillCard key={card.repo} card={card} onTagClick={onTag} />
          ))}

          {loading &&
            Array.from({ length: cards.length ? 2 : 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}

          {status === 'error' && (
            <div className="notice notice-error">
              <h3>Search hit a snag</h3>
              <div>{error}</div>
              <button onClick={retry}>Try again</button>
            </div>
          )}

          {status === 'empty' && (
            <div className="notice notice-empty">
              <h3>No matches</h3>
              <div>{error}</div>
            </div>
          )}

          {status === 'idle' && (
            <div className="empty">
              <h3>Search live for {view}</h3>
              <div>
                Type a function — like <em>pdf</em>, <em>postgres</em>, or <em>browser automation</em> —
                and hit Search. Results stream in from real GitHub activity.
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function ResultLine({ status, count, view }) {
  let text = ''
  if (status === 'loading') text = count ? `${count} so far — still searching…` : 'Searching GitHub…'
  else if (status === 'done') text = `${count} ${view} found`
  if (!text) return <p className="resultline" />
  return <p className="resultline">{text}</p>
}
