import { Icon } from './Icons.jsx'

// One catalog card. The amber "Not audited" caution panel is a core product
// feature — it stays visible on every card. Don't remove or de-emphasize it.
export default function SkillCard({ card, onTagClick }) {
  const isSkill = card.type === 'skill'
  return (
    <article className="card" tabIndex={0}>
      <div className="card-head">
        <div>
          <h2 className="card-title">{card.name}</h2>
          <p className="repo">
            <Icon name="gh" />
            {card.repo}
          </p>
        </div>
        <span className={`kind ${isSkill ? 'skill' : 'repo'}`}>{card.kind}</span>
      </div>

      <p className="summary">{card.summary}</p>

      <div className="tags">
        {card.tags.map((t) => (
          <button key={t} className="tag" onClick={() => onTagClick?.(t)}>
            {t}
          </button>
        ))}
      </div>

      <p className="label">Strengths &amp; good for</p>
      <ul className="uses">
        {card.uses.map((u, i) => (
          <li key={i}>{u}</li>
        ))}
      </ul>

      <div className="strip">
        <div className="strip-evidence">
          <p className="label">Why it's here</p>
          <div className="chips">
            {card.signals.map((s, i) => (
              <span className="chip" key={i}>
                <Icon name={s.icon} />
                <span className="src">{s.src}</span>
                <span className="val">{s.val}</span>
              </span>
            ))}
          </div>
        </div>
        <aside className="strip-caution">
          <div className="caution-head">
            <Icon name="warn" /> Not audited
          </div>
          <div className="caution-sub">
            We haven't reviewed this for security. Read the source before installing.
          </div>
          <a className="caution-link" href={`https://github.com/${card.repo}`} target="_blank" rel="noreferrer">
            View source →
          </a>
        </aside>
      </div>
    </article>
  )
}
