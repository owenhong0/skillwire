import { useEffect, useState } from 'react'
import type { Repo } from '../types'
import { getRepoDetail, NotFoundError, fmtNum, ago, titleize, catLabel, kindToCat } from '../lib/github'
import Motif from './Motif'
import { NewsState, Sk } from './news'
import {
  StarIcon,
  ClockIcon,
  AlertIcon,
  CodeIcon,
  WarnIcon,
  BackArrowIcon,
} from './Icons'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; r: Repo; paras: string[] }
  | { kind: 'notfound' }
  | { kind: 'error' }

export default function StoryArticle({ repo, onBack }: { repo: string; onBack: () => void }) {
  const [st, setSt] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setSt({ kind: 'loading' })
    getRepoDetail(repo, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return
        const { readme_paras, ...r } = detail
        setSt({ kind: 'ok', r, paras: readme_paras })
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setSt(e instanceof NotFoundError ? { kind: 'notfound' } : { kind: 'error' })
      })
    return () => controller.abort()
  }, [repo])

  return (
    <article className="article" aria-live="polite">
      <a className="crumb" onClick={onBack}>
        <BackArrowIcon /> The Skillwire Dispatch
      </a>
      <div style={{ marginTop: 18 }}>
        {st.kind === 'loading' && <ArticleSkeleton />}
        {st.kind === 'notfound' && (
          <NewsState
            title="Story not found"
            action={
              <button className="btn" onClick={onBack}>
                ← Back to the front page
              </button>
            }
          >
            That repository isn't on GitHub anymore, or the name changed. Head back to the front page
            for what's live now.
          </NewsState>
        )}
        {st.kind === 'error' && (
          <NewsState
            title="The presses are paused"
            action={
              <button className="btn" onClick={onBack}>
                ← Back to the front page
              </button>
            }
          >
            GitHub's free rate limit kicked in (no key needed — the wire is just busy). Wait a minute
            and refresh.
          </NewsState>
        )}
        {st.kind === 'ok' && <Dossier r={st.r} paras={st.paras} />}
      </div>
    </article>
  )
}

function Dossier({ r, paras }: { r: Repo; paras: string[] }) {
  const cat = kindToCat(r).cat
  useEffect(() => {
    document.title = `The Skillwire Dispatch — ${titleize(r.name)}`
    return () => {
      document.title = 'The Skillwire Dispatch'
    }
  }, [r.name])

  const topics = (r.topics || []).slice(0, 8)
  const lic =
    r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : 'No license stated'

  return (
    <>
      <span className="kicker a-kicker">{catLabel(cat)} · Live dossier</span>
      <h1>{titleize(r.name)}</h1>
      <p className="dek">{r.description || 'A public project in the LLM tooling ecosystem.'}</p>
      <div className="a-byline">
        <span>
          By <b>{r.owner?.login || 'unknown'}</b>
        </span>
        <span className="mono">{r.full_name}</span>
        <span>
          Updated <b>{ago(r.pushed_at, true)}</b>
        </span>
      </div>
      <div className="a-visual">
        <div className="glyph">
          <Motif cat={cat} />
        </div>
      </div>

      <div className="a-body">
        {paras.length > 0 ? (
          <>
            <p className="lede">{paras[0]}</p>
            {paras[1] && <p>{paras[1]}</p>}
          </>
        ) : (
          <>
            <p className="lede">
              {r.description || `${titleize(r.name)} is a public repository in the LLM tooling ecosystem.`}
            </p>
            <p>
              The author hasn’t shipped a readable overview we could excerpt here, so the facts below
              come straight from GitHub: it’s written in {r.language || 'an unspecified language'},
              carries {fmtNum(r.stargazers_count)} stars, and was last touched {ago(r.pushed_at, true)}.
            </p>
          </>
        )}
        {r.description && <blockquote className="pullquote">“{r.description}”</blockquote>}
      </div>

      <div className="a-sub">Why it surfaced</div>
      <div className="ev-row">
        <span className="chip">
          <StarIcon />
          <b>{fmtNum(r.stargazers_count)}</b> stars
        </span>
        <span className="chip">
          <ClockIcon />
          last commit {ago(r.pushed_at, true)}
        </span>
        <span className="chip">
          <AlertIcon />
          <b>{fmtNum(r.open_issues_count)}</b> open issues
        </span>
        {r.language && (
          <span className="chip">
            <CodeIcon />
            {r.language}
          </span>
        )}
        <span className="chip">{lic}</span>
      </div>

      {topics.length > 0 && (
        <>
          <div className="a-sub">Topics</div>
          <div className="a-tags">
            {topics.map((t) => (
              <a key={t}>#{t}</a>
            ))}
          </div>
        </>
      )}

      <div className="a-caution">
        <div className="h">
          <WarnIcon />
          Not audited
        </div>
        <p>
          This dossier is assembled from public GitHub activity, not a security review. Read the
          source before you install or run anything.
        </p>
        <div className="a-actions">
          <a className="btn btn-primary" href={r.html_url} target="_blank" rel="noopener noreferrer">
            View source on GitHub
          </a>
          {r.homepage && (
            <a className="btn" href={r.homepage} target="_blank" rel="noopener noreferrer">
              Project site
            </a>
          )}
        </div>
      </div>
    </>
  )
}

function ArticleSkeleton() {
  return (
    <>
      <Sk h={16} w="24%" mt={24} />
      <Sk h={60} w="80%" mt={16} />
      <Sk h={18} w="60%" mt={18} />
      <Sk h={230} mt={22} />
      <Sk h={16} mt={22} />
      <Sk h={16} w="92%" mt={9} />
      <Sk h={16} w="88%" mt={9} />
    </>
  )
}
