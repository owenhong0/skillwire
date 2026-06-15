import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { SECTIONS, searchRepos, catForCard } from '../lib/github'
import Masthead from './Masthead'
import Motif from './Motif'
import StoryCard from './StoryCard'
import Headlines from './Headlines'
import TrustBadge from './TrustBadge'
import { NewsState, Sk } from './news'
import { ArrowIcon } from './Icons'

type Status = 'loading' | 'done' | 'empty' | 'error'
type Open = (repo: string) => void

export default function Trending({ onOpen }: { onOpen: Open }) {
  const [active, setActive] = useState(0)
  const [items, setItems] = useState<Card[]>([])
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
        setCount(`${data.length} stories · ranked & scored`)
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
            This section came back empty. Try another tab — the newsroom runs on live activity.
          </NewsState>
        )}
        {status === 'done' && <Front items={items} onOpen={onOpen} />}
      </div>
    </>
  )
}

function Front({ items, onOpen }: { items: Card[]; onOpen: Open }) {
  const lead = items[0]
  const secondary = items.slice(1, 4)
  return (
    <div className="front">
      <div className="lead">
        <Lead card={lead} onOpen={onOpen} />
        {secondary.length > 0 && (
          <div className="secondary">
            {secondary.map((c) => (
              <StoryCard key={c.repo} card={c} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
      <Headlines />
    </div>
  )
}

function Lead({ card, onOpen }: { card: Card; onOpen: Open }) {
  return (
    <div className="story-lead">
      <span className="kicker">{card.sourceLabel} · Lead story</span>
      <h2>
        <a onClick={() => onOpen(card.repo)}>{card.title}</a>
      </h2>
      <div className="lead-visual">
        <div className="glyph">
          <Motif cat={catForCard(card)} />
        </div>
        <span className="cap">{card.repo}</span>
      </div>
      <p className="standfirst">{card.description}</p>
      <div className="byline">
        <TrustBadge trust={card.trust} score={card.score} />
        {card.signals.map((s, i) => (
          <span key={i}>{s.val}</span>
        ))}
      </div>
      <a className="readmore" onClick={() => onOpen(card.repo)}>
        Read the full story <ArrowIcon />
      </a>
    </div>
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
