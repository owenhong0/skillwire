import { useState } from 'react'
import type { Card } from '../types'
import { catForCard } from '../lib/github'
import Motif from './Motif'
import TrustBadge from './TrustBadge'
import { ShieldCheckIcon, CopyIcon } from './Icons'

function scoreTier(score: number): string {
  if (score >= 75) return 'good'
  if (score >= 50) return 'mid'
  return 'low'
}

// One catalog card. Clicking the title/visual opens the dossier (repo) or the
// source (news); the copy button is a separate control.
export default function StoryCard({ card, onOpen }: { card: Card; onOpen: (repo: string) => void }) {
  const [copied, setCopied] = useState(false)
  const meta = card.signals.map((s) => s.val).join(' · ')
  const extraTags = Math.max(0, card.tags.length - 3)
  const url = card.type === 'news' ? card.repo : `https://github.com/${card.repo}`

  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const open = () => onOpen(card.repo)

  return (
    <article className="story-card">
      {card.score > 0 && (
        <span className={`score-badge tier-${scoreTier(card.score)}`} title="Skillwire score (0–100)">
          {card.score}
        </span>
      )}

      <div className="scard-vis" onClick={card.type === 'news' ? undefined : open}>
        <Motif cat={catForCard(card)} />
      </div>

      <div className="scard-source">
        {card.trust === 'verified' && <ShieldCheckIcon className="shield" />}
        <span className="kicker">{card.sourceLabel}</span>
        {card.trust !== 'verified' && <TrustBadge trust={card.trust} />}
      </div>

      <h3 className="scard-title">
        {card.type === 'news' ? (
          <a href={card.repo} target="_blank" rel="noreferrer">
            {card.title}
          </a>
        ) : (
          <button type="button" className="linklike" onClick={open}>
            {card.title}
          </button>
        )}
      </h3>

      <p className="scard-desc">{card.description}</p>

      {card.tags.length > 0 && (
        <div className="scard-tags">
          {card.tags.slice(0, 3).map((t) => (
            <span className="tag-pill" key={t}>
              {t}
            </span>
          ))}
          {extraTags > 0 && <span className="tag-pill more">+{extraTags}</span>}
        </div>
      )}

      <div className="scard-repo">
        <span className="slug">{card.repo}</span>
        <button type="button" className="copy-btn" onClick={copy} aria-label="Copy link">
          {copied ? 'Copied!' : <CopyIcon />}
        </button>
      </div>

      {meta && <div className="mini-by">{meta}</div>}
    </article>
  )
}
