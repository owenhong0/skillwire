import type { Trust } from '../types'

const LABEL: Record<Trust, string> = {
  verified: '✓ Verified',
  unverified: 'Unverified',
  flagged: '⚠ Flagged',
}

export default function TrustBadge({ trust, score }: { trust: Trust; score?: number }) {
  return (
    <span className="meta-badges">
      <span className={`trust-badge trust-${trust}`}>{LABEL[trust]}</span>
      {typeof score === 'number' && score > 0 && (
        <span className="score-chip" title="Skillwire score (0–100)">
          {score}
        </span>
      )}
    </span>
  )
}
