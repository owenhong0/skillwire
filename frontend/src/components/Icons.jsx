// SVG icon set, ported from the v1 static site. Use <Icon name="star" />.

const PATHS = {
  gh: (
    <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
  ),
  star: <path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2 4.1 13.3l.9-4.3-3.3-3 4.4-.5z" />,
  hn: <rect x="1.5" y="1.5" width="13" height="13" rx="2" />,
  clock: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 1.5" />
    </g>
  ),
  warn: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 1.5l6.5 11.5H1.5z" />
      <path d="M8 6v3.5" />
      <circle cx="8" cy="11.5" r=".5" fill="currentColor" />
    </g>
  ),
}

const FILLED = new Set(['gh', 'star', 'hn'])

export function Icon({ name, className }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg viewBox="0 0 16 16" className={className} fill={FILLED.has(name) ? 'currentColor' : 'none'}>
      {path}
    </svg>
  )
}

export function GlassIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13l4 4" />
    </svg>
  )
}

export function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}
