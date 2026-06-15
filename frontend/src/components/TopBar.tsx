import type { View } from '../types'

const NAV: [View, string][] = [
  ['trending', 'Trending'],
  ['discover', 'Discover'],
  ['learn', 'Learn'],
]

export default function TopBar({ view, onNav }: { view: View; onNav: (v: View) => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" role="button" tabIndex={0} onClick={() => onNav('trending')}>
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h4l2-7 3 14 2-7h3" />
            </svg>
          </span>
          <span className="wordmark">
            Skill<b>wire</b>
          </span>
        </a>
        <nav className="topnav" aria-label="Primary">
          {NAV.map(([v, label]) => (
            <a key={v} aria-current={view === v ? 'page' : undefined} onClick={() => onNav(v)}>
              {label}
            </a>
          ))}
        </nav>
        <span className="spacer" />
        <a className="btn" onClick={() => onNav('discover')}>
          Search the catalog
        </a>
      </div>
    </header>
  )
}
