import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { fetchArticles, NoBackendError } from '../lib/github'
import TrustBadge from './TrustBadge'
import { Sk } from './news'

type S = 'loading' | 'done' | 'empty' | 'error' | 'nobackend'

// Real AI/LLM news, fetched (enriched) from the Dispatch backend.
export default function Headlines() {
  const [items, setItems] = useState<Card[]>([])
  const [status, setStatus] = useState<S>('loading')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetchArticles(7, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setItems(data)
        setStatus(data.length ? 'done' : 'empty')
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setStatus(e instanceof NoBackendError ? 'nobackend' : 'error')
      })
    return () => controller.abort()
  }, [])

  return (
    <aside className="rail">
      <h4>On the wire</h4>

      {status === 'loading' && (
        <>
          <Sk h={54} mt={8} />
          <Sk h={54} mt={12} />
          <Sk h={54} mt={12} />
        </>
      )}
      {status === 'nobackend' && (
        <p className="rail-note">
          Live news needs the Dispatch backend — set <code>VITE_API_BASE</code> to the API URL to
          light up the wire.
        </p>
      )}
      {status === 'error' && <p className="rail-note">The wire is quiet — couldn’t reach the news service.</p>}
      {status === 'empty' && <p className="rail-note">No headlines on the wire right now.</p>}

      {status === 'done' &&
        items.map((c, i) => {
          const meta = c.signals.map((s) => s.val).join(' · ')
          return (
            <a className="brief" key={c.repo || i} href={c.repo} target="_blank" rel="noreferrer">
              <span className="rank">{i + 1}</span>
              <span>
                <div className="bt">{c.title}</div>
                <div className="bm">
                  {c.sourceLabel}
                  {meta ? ` · ${meta}` : ''}
                </div>
                <TrustBadge trust={c.trust} score={c.score} />
              </span>
            </a>
          )
        })}
    </aside>
  )
}
