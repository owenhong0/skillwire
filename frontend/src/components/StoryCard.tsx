import type { Card } from '../types'
import { catForCard } from '../lib/github'
import Motif from './Motif'
import TrustBadge from './TrustBadge'

// Secondary "story card" — used in the Trending front page and the Discover grid.
export default function StoryCard({ card, onOpen }: { card: Card; onOpen: (repo: string) => void }) {
  const meta = card.signals.map((s) => s.val).join(' · ')
  const inner = (
    <>
      <div className="scard-vis">
        <Motif cat={catForCard(card)} />
      </div>
      <span className="kicker">{card.sourceLabel}</span>
      <h3>{card.title}</h3>
      <p>{card.description.slice(0, 150)}</p>
      {meta && <div className="mini-by">{meta}</div>}
      <TrustBadge trust={card.trust} score={card.score} />
    </>
  )
  if (card.type === 'news') {
    return (
      <a className="story-card" href={card.repo} target="_blank" rel="noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <a className="story-card" onClick={() => onOpen(card.repo)}>
      {inner}
    </a>
  )
}
