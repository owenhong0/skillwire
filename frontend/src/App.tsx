import { useState } from 'react'
import type { View, CatId, StoryRef } from './types'
import TopBar from './components/TopBar'
import Trending from './components/Trending'
import Discover from './components/Discover'
import LearnPage from './components/LearnPage'
import StoryArticle from './components/StoryArticle'

export default function App() {
  const [view, setView] = useState<View>('trending')
  const [story, setStory] = useState<StoryRef | null>(null)

  const nav = (v: View) => {
    setStory(null)
    setView(v)
    window.scrollTo(0, 0)
  }

  const openStory = (repo: string, cat: CatId) => {
    setStory({ repo, cat })
    window.scrollTo(0, 0)
  }

  const back = () => {
    setStory(null)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <TopBar view={view} onNav={nav} />
      <main className="nwrap">
        {story ? (
          <StoryArticle repo={story.repo} cat={story.cat} onBack={back} />
        ) : view === 'trending' ? (
          <Trending onOpen={openStory} />
        ) : view === 'discover' ? (
          <Discover onOpen={openStory} />
        ) : (
          <LearnPage />
        )}
      </main>
      <footer className="site-foot">
        <span>
          <b>The Skillwire Dispatch</b> — a live front page over the GitHub Search API.
        </span>
        <span>Every story is public activity, not an endorsement. Read the source.</span>
      </footer>
    </>
  )
}
