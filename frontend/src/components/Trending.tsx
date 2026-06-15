import { useEffect, useState } from 'react'
import type { Repo, CatId } from '../types'
import { SECTIONS, searchRepos, fmtNum, ago, titleize, kindToCat } from '../lib/github'
import Masthead from './Masthead'
import Motif from './Motif'
import StoryCard from './StoryCard'
import { NewsState, Sk } from './news'
import { ArrowIcon } from './Icons'

type Status = 'loading' | 'done' | 'empty' | 'error'
type Open = (repo: string, cat: CatId) => void

export default function Trending({ onOpen }: { onOpen: Open }) {
  const [active, setActive] = useState(0)
  const [items, setItems] = useState<Repo[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [count, setCount] = useState('searching the wire…')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setCount('searching the wire…')
    searchRepos(SECTIONS[active].query, 9, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        if (!data.length) {
          setStatus('empty')
          setCount('empty edition')
          return
        }
        setItems(data)
        setStatus('done')
        setCount(`${data.length} stories · ranked by stars`)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setStatus('error')
        setCount('press paused')
      })
    return () => controller.abort()
  }, [active])

  return (
    <>
      <Masthead />

      <nav className="sections" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          <button key={s.id} aria-pressed={i === active} onClick={() => i !== active && setActive(i)}>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="strap">
        <span>{SECTIONS[active].label}</span>
        <span className="grow" />
        <span>{count}</span>
      </div>

      <div>
        {status === 'loading' && <FrontSkeleton />}
        {status === 'error' && (
          <NewsState title="The presses are paused">
            GitHub's free rate limit kicked in (no key needed — the wire is just busy). Wait a minute
            and refresh.
          </NewsState>
        )}
        {status === 'empty' && (
          <NewsState title="Nothing on the wire">
            This section came back empty. Try another tab — the newsroom runs on live GitHub activity.
          </NewsState>
        )}
        {status === 'done' && <Front items={items} onOpen={onOpen} />}
      </div>
    </>
  )
}

function Front({ items, onOpen }: { items: Repo[]; onOpen: Open }) {
  const lead = items[0]
  const secondary = items.slice(1, 3)
  const briefs = items.slice(3, 8)
  return (
    <div className="front">
      <div className="lead">
        <Lead r={lead} onOpen={onOpen} />
        {secondary.length > 0 && (
          <div className="secondary">
            {secondary.map((r) => (
              <StoryCard key={r.full_name} r={r} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
      <aside className="rail">
        <h4>Most starred this section</h4>
        {briefs.map((r, i) => (
          <Brief key={r.full_name} r={r} i={i} onOpen={onOpen} />
        ))}
      </aside>
    </div>
  )
}

function Lead({ r, onOpen }: { r: Repo; onOpen: Open }) {
  const c = kindToCat(r)
  return (
    <div className="story-lead">
      <span className="kicker">{c.label} · Lead story</span>
      <h2>
        <a onClick={() => onOpen(r.full_name, c.cat)}>{titleize(r.name)}</a>
      </h2>
      <div className="lead-visual">
        <div className="glyph">
          <Motif cat={c.cat} />
        </div>
        <span className="cap">{r.full_name}</span>
      </div>
      <p className="standfirst">
        {r.description || 'No description provided by the author — open the source to see what it does.'}
      </p>
      <div className="byline">
        <span>
          <b>{fmtNum(r.stargazers_count)}</b> ★ stars
        </span>
        <span>
          last commit <b>{ago(r.pushed_at)}</b>
        </span>
        {r.language && <span>{r.language}</span>}
        <span>
          <b>{fmtNum(r.open_issues_count)}</b> open issues
        </span>
      </div>
      <a className="readmore" onClick={() => onOpen(r.full_name, c.cat)}>
        Read the full story <ArrowIcon />
      </a>
    </div>
  )
}

function Brief({ r, i, onOpen }: { r: Repo; i: number; onOpen: Open }) {
  const c = kindToCat(r)
  return (
    <a className="brief" onClick={() => onOpen(r.full_name, c.cat)}>
      <span className="rank">{i + 1}</span>
      <span>
        <div className="bt">{titleize(r.name)}</div>
        <div className="bd">{(r.description || '').slice(0, 90)}</div>
        <div className="bm">
          {fmtNum(r.stargazers_count)} ★ · {c.label}
        </div>
      </span>
    </a>
  )
}

function FrontSkeleton() {
  return (
    <div className="front">
      <div className="lead">
        <Sk h={16} w="30%" />
        <Sk h={54} w="90%" mt={14} />
        <Sk h={200} mt={18} />
        <Sk h={14} w="100%" mt={18} />
        <Sk h={14} w="80%" mt={8} />
      </div>
      <div className="rail">
        <Sk h={14} w="50%" />
        <Sk h={60} mt={16} />
        <Sk h={60} mt={12} />
        <Sk h={60} mt={12} />
      </div>
    </div>
  )
}
