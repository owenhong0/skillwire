// Loading placeholder shown while the agent pipeline streams in cards.
export default function SkeletonCard() {
  return (
    <article className="card skeleton" aria-hidden="true">
      <div className="card-head">
        <div style={{ flex: 1 }}>
          <div className="sk sk-title" />
          <div className="sk sk-repo" />
        </div>
        <div className="sk sk-kind" />
      </div>
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="tags">
        <div className="sk sk-tag" />
        <div className="sk sk-tag" />
        <div className="sk sk-tag" />
      </div>
      <div className="sk sk-strip" />
    </article>
  )
}
