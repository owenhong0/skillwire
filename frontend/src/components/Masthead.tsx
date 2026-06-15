// The Dispatch nameplate — shown atop the Trending front page.
export default function Masthead() {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return (
    <div className="masthead">
      <div className="meta-row">
        <span>{date}</span>
        <span>No. 001 · Live edition</span>
      </div>
      <h1>The Skillwire Dispatch</h1>
      <p className="motto">All the skills that are fit to ship — we highlight, we don't audit.</p>
      <div className="rule-double" />
    </div>
  )
}
