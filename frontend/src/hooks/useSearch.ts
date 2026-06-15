import { useCallback, useRef, useState } from 'react'
import { searchRepos, RateLimitError } from '../lib/github'
import type { Card } from '../types'

type Status = 'idle' | 'loading' | 'done' | 'empty' | 'error'

const CACHE_TTL = 10 * 60 * 1000
const cache = new Map<string, { at: number; cards: Card[] }>()

const emptyMsg = (q: string) =>
  `Nothing on the wire for “${q}” — try a broader term like “database” or “automation”.`

// Discover search → enriched Cards from the backend, cached 10 minutes per query.
export default function useSearch() {
  const [cards, setCards] = useState<Card[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const lastRef = useRef<string | null>(null)

  const run = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    lastRef.current = query

    setCards([])
    setError('')
    setStatus('loading')

    const key = query.toLowerCase()
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      setCards(cached.cards)
      setStatus(cached.cards.length ? 'done' : 'empty')
      if (!cached.cards.length) setError(emptyMsg(query))
      return
    }

    try {
      const items = await searchRepos(query, 12, signal)
      if (signal.aborted) return
      if (!items.length) {
        setError(emptyMsg(query))
        setStatus('empty')
      } else {
        setCards(items)
        setStatus('done')
      }
      cache.set(key, { at: Date.now(), cards: items })
    } catch (e) {
      if (signal.aborted) return
      setError(
        e instanceof RateLimitError
          ? "GitHub's free rate limit kicked in (no key needed — the wire is just busy). Wait a minute and try again."
          : "Couldn't reach the search service. Check your connection and try again.",
      )
      setStatus('error')
    }
  }, [])

  const search = useCallback(
    (query: string) => {
      const q = query.trim()
      if (!q) {
        abortRef.current?.abort()
        setCards([])
        setError('')
        setStatus('idle')
        lastRef.current = null
        return
      }
      run(q)
    },
    [run],
  )

  const retry = useCallback(() => {
    if (lastRef.current) run(lastRef.current)
  }, [run])

  return { cards, status, error, search, retry }
}
