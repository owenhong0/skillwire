import { useCallback, useRef, useState } from 'react'
import { searchRepos, fetchHnSignal, RateLimitError } from '../lib/search.js'

// status: 'idle' | 'loading' | 'done' | 'empty' | 'error'
//
// No backend, no keys: this calls GitHub Search + Hacker News directly from the
// browser. Base cards render as soon as the single GitHub request returns; each
// card's Hacker News chip is patched in as it resolves. Results are cached
// in-memory per (query, type) for 10 minutes.

const CACHE_TTL = 10 * 60 * 1000
const cache = new Map() // `${type}:${query}` -> { at, cards }

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.cards
}

const EMPTY_MESSAGE = (query) =>
  `Nothing found for “${query}” — try a broader term like “database” or “automation”.`

export default function useSearch() {
  const [cards, setCards] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const abortRef = useRef(null)
  const lastRef = useRef(null) // { query, type } for retry

  const run = useCallback(async (query, type) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    lastRef.current = { query, type }

    setCards([])
    setError('')
    setStatus('loading')

    const key = `${type}:${query.toLowerCase()}`
    const cached = cacheGet(key)
    if (cached) {
      setCards(cached)
      setStatus(cached.length ? 'done' : 'empty')
      if (!cached.length) setError(EMPTY_MESSAGE(query))
      return
    }

    let base
    try {
      base = await searchRepos(query, type, signal)
    } catch (e) {
      if (signal.aborted) return
      if (e instanceof RateLimitError) {
        setError("GitHub's free rate limit kicked in (no key needed — the network is just busy). Wait a minute and try again.")
      } else {
        setError("Couldn't reach GitHub search. Check your connection and try again.")
      }
      setStatus('error')
      return
    }

    if (signal.aborted) return

    if (!base.length) {
      setError(EMPTY_MESSAGE(query))
      setStatus('empty')
      cache.set(key, { at: Date.now(), cards: [] })
      return
    }

    // Render base cards immediately, then patch in Hacker News chips as they land.
    setCards(base)
    setStatus('done')

    const working = base.map((c) => ({ ...c }))
    await Promise.all(
      working.map(async (card, i) => {
        const chip = await fetchHnSignal(card.repo, signal)
        if (signal.aborted || !chip) return
        // Slot HN between the stars chip and the maintained chip.
        const signals = [...card.signals]
        signals.splice(1, 0, chip)
        working[i] = { ...card, signals }
        setCards((prev) =>
          prev.map((c) => (c.repo === card.repo ? working[i] : c)),
        )
      }),
    )

    if (!signal.aborted) cache.set(key, { at: Date.now(), cards: working })
  }, [])

  const search = useCallback(
    (query, type) => {
      const q = (query || '').trim()
      if (!q) {
        if (abortRef.current) abortRef.current.abort()
        setCards([])
        setError('')
        setStatus('idle')
        lastRef.current = null
        return
      }
      run(q, type)
    },
    [run],
  )

  const retry = useCallback(() => {
    if (lastRef.current) run(lastRef.current.query, lastRef.current.type)
  }, [run])

  return { cards, status, error, search, retry }
}
