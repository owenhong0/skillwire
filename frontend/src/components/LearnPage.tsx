import type { ComponentType, ReactNode } from 'react'
import {
  NextToken,
  Tokenize,
  Embeddings,
  Attention,
  Temperature,
  ContextWindow,
  RAG,
  AgentLoop,
} from './Diagrams'

interface Concept {
  id: string
  title: string
  lede: string
  Fig: ComponentType
  caption: string
  body: ReactNode
  takeaway: string
}

const CONCEPTS: Concept[] = [
  {
    id: 'next-token',
    title: 'Models are next-token guessers',
    lede: 'A large language model does one thing astonishingly well: predict what comes next.',
    Fig: NextToken,
    caption: 'Given “The cat sat on the”, the model ranks likely next words.',
    body: (
      <>
        <p>
          At each step the model looks at everything so far and produces a <strong>probability for
          every possible next token</strong>. It picks one, appends it, and repeats — one token at a
          time — until the answer is complete.
        </p>
        <p>
          There is no database of answers inside it. The fluent paragraphs you read are the result of
          millions of these tiny “what’s most likely next?” decisions chained together.
        </p>
      </>
    ),
    takeaway: 'Everything else here is a technique for making that next-token guess better-informed.',
  },
  {
    id: 'tokens',
    title: 'Models read tokens, not words',
    lede: 'Before a model can read text, the text is chopped into tokens — chunks of characters.',
    Fig: Tokenize,
    caption: 'One string becomes several tokens, each mapped to a numeric id.',
    body: (
      <>
        <p>
          A token is often a word, but long or unusual words split into pieces (<code>Skill</code> +{' '}
          <code>wire</code>), and a leading space is part of the token. Each token maps to an{' '}
          <strong>id number</strong> the model actually operates on.
        </p>
        <p>
          Tokens are also the unit of <strong>cost and limits</strong>: pricing is per token, and a
          model’s context window is measured in tokens. Roughly, 1 token ≈ 4 characters of English.
        </p>
      </>
    ),
    takeaway: 'When you see “200K context” or “$3 / 1M tokens”, that’s counting these chunks.',
  },
  {
    id: 'embeddings',
    title: 'Meaning becomes coordinates',
    lede: 'Models turn tokens into vectors — long lists of numbers — that place meaning in space.',
    Fig: Embeddings,
    caption: 'Related concepts land near each other in the vector space.',
    body: (
      <>
        <p>
          An <strong>embedding</strong> is a point in a high-dimensional space where{' '}
          <strong>similar meanings sit close together</strong>. “dog” and “puppy” are neighbors;
          “invoice” is far away.
        </p>
        <p>
          This is the engine behind semantic search and retrieval: instead of matching keywords, you
          compare distances between vectors, so “car trouble” can find “engine won’t start.”
        </p>
      </>
    ),
    takeaway: 'Embeddings are what make “find things that mean the same” possible.',
  },
  {
    id: 'attention',
    title: 'Attention: how words read each other',
    lede: 'The Transformer architecture lets every token weigh how much each other token matters.',
    Fig: Attention,
    caption: 'To resolve “it”, the model attends most strongly to “cat”.',
    body: (
      <>
        <p>
          <strong>Attention</strong> is the breakthrough behind modern models. For each token, the
          model computes how relevant every other token is, then blends them by those weights — that’s
          how it figures out “it” refers to “cat,” not “because.”
        </p>
        <p>
          Stacking many attention layers lets the model track long-range relationships — the “T” in
          GPT and the core of every model Skillwire’s tools talk to.
        </p>
      </>
    ),
    takeaway: 'Attention is how context — not just the last word — shapes the next guess.',
  },
  {
    id: 'temperature',
    title: 'Temperature: focused vs. creative',
    lede: 'A single knob reshapes how boldly the model samples from its ranked options.',
    Fig: Temperature,
    caption: 'Low temperature sharpens the top choice; high temperature flattens the field.',
    body: (
      <>
        <p>
          After ranking next tokens, the model has to <strong>pick one</strong>. <code>Temperature</code>{' '}
          controls how much it favors the top choice. <strong>Low</strong> (≈0.2) is focused and
          repeatable — good for code. <strong>High</strong> (≈1.0+) is varied — good for brainstorming.
        </p>
        <p>It doesn’t add new knowledge; it only changes the odds among options already considered.</p>
      </>
    ),
    takeaway: 'Same model, same prompt — temperature decides how safe or adventurous the answer is.',
  },
  {
    id: 'context',
    title: 'The context window: working memory',
    lede: 'A model can only “see” a fixed number of tokens at once — its short-term memory.',
    Fig: ContextWindow,
    caption: 'Older tokens slide out of view as the conversation grows past the budget.',
    body: (
      <>
        <p>
          The <strong>context window</strong> is everything the model reads for one response: the
          system prompt, the history, retrieved docs, and your question. Modern windows are huge
          (100K–1M tokens), but still finite.
        </p>
        <p>
          Go over budget and the earliest content is dropped or summarized — which is exactly why
          retrieval and good prompting matter.
        </p>
      </>
    ),
    takeaway: 'The model has no memory beyond this window unless you put it back in.',
  },
  {
    id: 'rag',
    title: 'RAG: giving a model your facts',
    lede: 'Retrieval-Augmented Generation feeds relevant documents into the prompt before answering.',
    Fig: RAG,
    caption: 'Retrieve relevant text, add it to the prompt, then let the model answer from it.',
    body: (
      <>
        <p>
          A base model only knows its training data. <strong>RAG</strong> fixes that: search your own
          content (often via embeddings), paste the best matches into the context window, and ask the
          model to answer <strong>using that text</strong>.
        </p>
        <p>
          The result is grounded, up-to-date, and citable — without retraining. Most “chat with your
          docs” tools on Skillwire are RAG underneath.
        </p>
      </>
    ),
    takeaway: 'RAG = retrieval (find the facts) + generation (write the answer from them).',
  },
  {
    id: 'agents',
    title: 'Agents: models that use tools',
    lede: 'Give a model tools and a loop, and it can act — not just talk.',
    Fig: AgentLoop,
    caption: 'The model calls a tool, reads the result, and loops until the task is done.',
    body: (
      <>
        <p>
          An <strong>agent</strong> wraps a model in a loop with <strong>tools</strong> it can call:
          run a query, fetch a page, edit a file. The model picks a tool, sees the real result, and
          decides again — repeating until the goal is met.
        </p>
        <p>
          <strong>MCP</strong> (Model Context Protocol) is the standard way to expose those tools, and{' '}
          <strong>skills</strong> are reusable instruction sets — both front and center in Skillwire’s
          catalog.
        </p>
      </>
    ),
    takeaway: 'Tools turn a text predictor into something that can take real actions for you.',
  },
]

export default function LearnPage() {
  return (
    <div className="learn">
      <div className="learn-hero">
        <p className="learn-eyebrow">Learn · the ideas behind the tools</p>
        <h1>A visual field guide to how AI actually works</h1>
        <p>
          The Dispatch tracks skills, MCP servers, and libraries built on large language models. Here’s
          the small set of ideas that explains nearly all of them — each in a minute, with a picture.
        </p>
      </div>

      <nav className="learn-toc" aria-label="Concepts">
        {CONCEPTS.map((c, i) => (
          <a key={c.id} href={`#${c.id}`}>
            {String(i + 1).padStart(2, '0')} {c.title.split(':')[0]}
          </a>
        ))}
      </nav>

      {CONCEPTS.map((c, i) => {
        const Fig = c.Fig
        return (
          <section className="concept" id={c.id} key={c.id}>
            <div className="concept-head">
              <span className="concept-num">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="concept-title">{c.title}</h2>
            </div>
            <p className="concept-lede">{c.lede}</p>
            <div className="concept-grid split">
              <div className="concept-body">
                {c.body}
                <div className="takeaway">
                  <b>Takeaway · </b>
                  {c.takeaway}
                </div>
              </div>
              <figure className="fig" style={{ margin: 0 }}>
                <Fig />
                <figcaption className="fig-cap">{c.caption}</figcaption>
              </figure>
            </div>
          </section>
        )
      })}

      <p className="learn-footer">
        Simplified mental models, not exact mechanics — enough to read the catalog with confidence. We
        highlight, we don't audit.
      </p>
    </div>
  )
}
