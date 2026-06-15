import type { Repo, CatId } from '../types'
import { fmtNum, ago, titleize, kindToCat } from '../lib/github'
import Motif from './Motif'

// Secondary "story card" — used in the Trending front page and the Discover grid.
export default function StoryCard({ r, onOpen }: { r: Repo; onOpen: (repo: string, cat: CatId) => void }) {
  const c = kindToCat(r)
  return (
    <a className="story-card" onClick={() => onOpen(r.full_name, c.cat)}>
      <div className="scard-vis">
        <Motif cat={c.cat} />
      </div>
      <span className="kicker">{c.label}</span>
      <h3>{titleize(r.name)}</h3>
      <p>{(r.description || '').slice(0, 120) || 'Open the source for details.'}</p>
      <div className="mini-by">
        {fmtNum(r.stargazers_count)} ★ · {ago(r.pushed_at)}
      </div>
    </a>
  )
}
