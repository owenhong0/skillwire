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

export type View = 'trending' | 'discover' | 'learn'

export interface StoryRef {
  repo: string
  cat: CatId
}
