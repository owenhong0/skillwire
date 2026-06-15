import type { ReactNode } from 'react'
import type { CatId } from '../types'

// Line-art glyphs per category, drawn in currentColor (the editorial ink).
const PATHS: Record<CatId, ReactNode> = {
  skill: <path d="M14 32h8l4-14 8 28 5-18 3 4h8" />,
  mcp: (
    <>
      <rect x="14" y="12" width="36" height="12" rx="2" />
      <rect x="14" y="30" width="36" height="12" rx="2" />
      <rect x="14" y="48" width="36" height="8" rx="2" />
      <circle cx="22" cy="18" r="1.6" fill="currentColor" />
      <circle cx="22" cy="36" r="1.6" fill="currentColor" />
    </>
  ),
  web: (
    <>
      <rect x="10" y="14" width="44" height="34" rx="3" />
      <path d="M10 24h44" />
      <circle cx="16" cy="19" r="1.4" fill="currentColor" />
      <circle cx="21" cy="19" r="1.4" fill="currentColor" />
      <path d="M22 38h20M22 32h14" />
    </>
  ),
  data: (
    <>
      <ellipse cx="32" cy="16" rx="18" ry="6" />
      <path d="M14 16v16c0 3.3 8 6 18 6s18-2.7 18-6V16" />
      <path d="M14 32v12c0 3.3 8 6 18 6s18-2.7 18-6V32" />
    </>
  ),
  agent: (
    <>
      <circle cx="16" cy="32" r="7" />
      <circle cx="48" cy="16" r="6" />
      <circle cx="48" cy="32" r="6" />
      <circle cx="48" cy="48" r="6" />
      <path d="M23 32 42 16M23 32h19M23 32 42 48" />
    </>
  ),
  cli: (
    <>
      <rect x="10" y="14" width="44" height="36" rx="3" />
      <path d="M18 28l8 6-8 6M30 42h12" />
    </>
  ),
}

export default function Motif({ cat }: { cat: CatId }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[cat] ?? PATHS.skill}
    </svg>
  )
}
