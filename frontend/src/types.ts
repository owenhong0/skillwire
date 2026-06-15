// Shared types for The Skillwire Dispatch.

export interface Repo {
  full_name: string
  name: string
  description: string | null
  stargazers_count: number
  pushed_at: string
  language: string | null
  topics?: string[]
  open_issues_count: number
  owner?: { login: string }
  html_url: string
  homepage?: string | null
  license?: { spdx_id?: string | null } | null
}

export interface RepoDetail extends Repo {
  readme_paras: string[]
}

export type Trust = 'verified' | 'unverified' | 'flagged'

export interface Signal {
  src: string
  icon: string
  val: string
}

// Unified, enriched card the backend returns (matches backend/models.py Card).
export interface Card {
  title: string
  description: string
  type: 'skill' | 'repo' | 'news'
  repo: string // github slug ("owner/name") or source URL
  tags: string[]
  signals: Signal[]
  score: number
  trust: Trust
  sourceLabel: string
}

export type CatId = 'skill' | 'mcp' | 'web' | 'data' | 'agent' | 'cli'

export interface Cat {
  cat: CatId
  label: string
}

export interface Section {
  id: string
  label: string
  query: string
}

export interface Article {
  id: string
  title: string
  url: string
  source: string
  author?: string | null
  score?: number | null
  comments?: number | null
  published_at?: string | null
  summary?: string | null
}

export type View = 'trending' | 'discover' | 'learn'

export interface StoryRef {
  repo: string
  cat: CatId
}
