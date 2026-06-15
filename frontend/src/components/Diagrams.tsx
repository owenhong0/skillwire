// Inline SVG diagrams for the Learn page. Drawn in a warm ink/terracotta
// palette that sits comfortably on the Dispatch's parchment.

const C = {
  ink: '#1a1814',
  soft: '#5E5D59',
  dim: '#87867F',
  terra: '#C96442',
  coral: '#D97757',
  olive: '#6B6F4E',
  sand: '#E8E6DC',
  cream: '#EFE7D2',
  white: '#FFFFFF',
}
const MONO = "'IBM Plex Mono', ui-monospace, monospace"

export function NextToken() {
  const words = ['The', 'cat', 'sat', 'on', 'the']
  const bars: [string, number][] = [
    ['mat', 0.61],
    ['floor', 0.18],
    ['rug', 0.13],
    ['roof', 0.05],
  ]
  let x = 16
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label="Next-token prediction probability bars">
      {words.map((w, i) => {
        const wpx = w.length * 9 + 22
        const el = (
          <g key={i}>
            <rect x={x} y={24} width={wpx} height={30} rx={7} fill={C.white} stroke={C.cream} />
            <text x={x + wpx / 2} y={44} fontFamily={MONO} fontSize="14" fill={C.ink} textAnchor="middle">{w}</text>
          </g>
        )
        x += wpx + 8
        return el
      })}
      <rect x={x} y={24} width={46} height={30} rx={7} fill="none" stroke={C.terra} strokeDasharray="4 4" />
      <text x={x + 23} y={45} fontFamily={MONO} fontSize="16" fill={C.terra} textAnchor="middle">?</text>
      {bars.map(([label, p], i) => {
        const y = 96 + i * 46
        const w = Math.round(p * 360)
        return (
          <g key={label}>
            <text x={16} y={y + 21} fontFamily={MONO} fontSize="13" fill={C.soft}>{label}</text>
            <rect x={92} y={y} width={360} height={28} rx={6} fill={C.sand} />
            <rect x={92} y={y} width={w} height={28} rx={6} fill={i === 0 ? C.terra : C.coral} opacity={i === 0 ? 1 : 0.55} />
            <text x={462} y={y + 20} fontFamily={MONO} fontSize="13" fill={C.ink}>{p.toFixed(2)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function Tokenize() {
  const toks = ['Skill', 'wire', ' is', ' great', '!']
  let x = 70
  return (
    <svg viewBox="0 0 560 250" role="img" aria-label="Text split into tokens with ids">
      <rect x={120} y={18} width={320} height={36} rx={9} fill={C.white} stroke={C.cream} />
      <text x={280} y={41} fontFamily={MONO} fontSize="15" fill={C.ink} textAnchor="middle">"Skillwire is great!"</text>
      <path d="M280 60 L280 92" stroke={C.dim} strokeWidth="2" markerEnd="url(#tk-arr)" />
      <defs>
        <marker id="tk-arr" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
          <path d="M0 0 L9 4.5 L0 9 z" fill={C.dim} />
        </marker>
      </defs>
      {toks.map((t, i) => {
        const wpx = Math.max(t.length * 10 + 18, 44)
        const el = (
          <g key={i}>
            <rect x={x} y={108} width={wpx} height={38} rx={9} fill="#F6E7DF" stroke="#EAC6B6" />
            <text x={x + wpx / 2} y={132} fontFamily={MONO} fontSize="14" fill={C.terra} textAnchor="middle">{t.replace(' ', '␣')}</text>
            <text x={x + wpx / 2} y={170} fontFamily={MONO} fontSize="12" fill={C.dim} textAnchor="middle">{8420 + i * 137}</text>
          </g>
        )
        x += wpx + 10
        return el
      })}
      <text x={70} y={208} fontFamily={MONO} fontSize="12" fill={C.soft}>token</text>
      <text x={70} y={226} fontFamily={MONO} fontSize="12" fill={C.dim}>id</text>
    </svg>
  )
}

export function Embeddings() {
  const clusters = [
    { label: 'animals', color: C.olive, pts: [[120, 90], [150, 110], [108, 130], [140, 150]] },
    { label: 'code', color: C.terra, pts: [[380, 80], [410, 100], [368, 116], [402, 140]] },
    { label: 'food', color: C.coral, pts: [[230, 210], [262, 196], [210, 184], [250, 230]] },
  ]
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label="Words placed as points in a semantic vector space">
      <rect x={40} y={28} width={480} height={236} rx={12} fill={C.white} stroke={C.cream} />
      <line x1={60} y1={250} x2={500} y2={250} stroke={C.cream} strokeWidth="1.5" />
      <line x1={60} y1={250} x2={60} y2={46} stroke={C.cream} strokeWidth="1.5" />
      {clusters.map((c) => (
        <g key={c.label}>
          {c.pts.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={7} fill={c.color} opacity="0.85" />
          ))}
          <text x={c.pts[0][0]} y={c.pts[0][1] - 16} fontFamily={MONO} fontSize="12.5" fill={c.color} fontWeight="600">{c.label}</text>
        </g>
      ))}
      <line x1={150} y1={110} x2={108} y2={130} stroke={C.olive} strokeWidth="2" strokeDasharray="3 3" />
      <text x={300} y={284} fontFamily={MONO} fontSize="12" fill={C.dim} textAnchor="middle">close together = similar meaning</text>
    </svg>
  )
}

export function Attention() {
  const toks = ['The', 'cat', 'sat', 'because', 'it', 'was', 'tired']
  const xs: number[] = []
  let x = 18
  const boxes = toks.map((t, i) => {
    const wpx = t.length * 9 + 20
    const cx = x + wpx / 2
    xs.push(cx)
    const b = { t, x, wpx, cx, i }
    x += wpx + 10
    return b
  })
  const itX = xs[4]
  const links: [number, number][] = [
    [1, 5],
    [6, 3],
    [2, 1.4],
  ]
  return (
    <svg viewBox="0 0 560 210" role="img" aria-label="The word it attends most strongly to cat">
      <defs>
        <marker id="at-arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={C.terra} />
        </marker>
      </defs>
      {links.map(([target, w], k) => {
        const tx = xs[target]
        const midY = 70 - (k + 1) * 6
        return (
          <path key={k} d={`M${itX} 120 C ${itX} ${midY}, ${tx} ${midY}, ${tx} 96`} fill="none" stroke={C.terra} strokeWidth={w} opacity={0.4 + w * 0.09} markerEnd="url(#at-arr)" />
        )
      })}
      {boxes.map((b) => {
        const isIt = b.i === 4
        return (
          <g key={b.i}>
            <rect x={b.x} y={96} width={b.wpx} height={34} rx={8} fill={isIt ? C.terra : C.white} stroke={isIt ? C.terra : C.cream} />
            <text x={b.cx} y={118} fontFamily={MONO} fontSize="13.5" fill={isIt ? C.white : C.ink} textAnchor="middle">{b.t}</text>
          </g>
        )
      })}
      <text x={itX} y={158} fontFamily={MONO} fontSize="12" fill={C.terra} textAnchor="middle" fontWeight="600">"it" → "cat"</text>
      <text x={280} y={182} fontFamily={MONO} fontSize="11.5" fill={C.dim} textAnchor="middle">thicker arrow = more attention</text>
    </svg>
  )
}

function MiniBars({ x, title, probs, accent }: { x: number; title: string; probs: number[]; accent: string }) {
  const base = 150
  return (
    <g>
      <text x={x + 110} y={24} fontFamily={MONO} fontSize="13" fill={C.ink} textAnchor="middle" fontWeight="600">{title}</text>
      {probs.map((p, i) => {
        const h = Math.round(p * 110)
        const bx = x + i * 42 + 8
        return (
          <g key={i}>
            <rect x={bx} y={base - h} width={30} height={h} rx={5} fill={accent} opacity={0.4 + p * 0.6} />
            <rect x={bx} y={base} width={30} height={4} rx={2} fill={C.cream} />
          </g>
        )
      })}
    </g>
  )
}
export function Temperature() {
  return (
    <svg viewBox="0 0 560 200" role="img" aria-label="Low temperature is peaked, high temperature is flatter">
      <MiniBars x={20} title="T = 0.2  (focused)" probs={[0.82, 0.1, 0.05, 0.03]} accent={C.terra} />
      <line x1={285} y1={20} x2={285} y2={170} stroke={C.cream} strokeWidth="1.5" />
      <MiniBars x={300} title="T = 1.2  (creative)" probs={[0.38, 0.27, 0.21, 0.14]} accent={C.coral} />
      <text x={280} y={192} fontFamily={MONO} fontSize="11.5" fill={C.dim} textAnchor="middle">same options, reshaped odds</text>
    </svg>
  )
}

export function ContextWindow() {
  const n = 18
  const winStart = 9
  return (
    <svg viewBox="0 0 560 200" role="img" aria-label="A sliding context window over a sequence of tokens">
      {Array.from({ length: n }).map((_, i) => {
        const inWin = i >= winStart
        const bx = 20 + i * 29
        return (
          <rect key={i} x={bx} y={70} width={24} height={30} rx={5} fill={inWin ? '#F6E7DF' : C.sand} stroke={inWin ? '#EAC6B6' : C.cream} opacity={inWin ? 1 : 0.35 + i * 0.04} />
        )
      })}
      <rect x={20 + winStart * 29 - 4} y={58} width={(n - winStart) * 29} height={54} rx={9} fill="none" stroke={C.terra} strokeWidth="2" />
      <text x={20 + winStart * 29 + ((n - winStart) * 29) / 2 - 4} y={132} fontFamily={MONO} fontSize="12" fill={C.terra} textAnchor="middle" fontWeight="600">context window — what the model can see</text>
      <text x={20} y={44} fontFamily={MONO} fontSize="11.5" fill={C.dim}>← older tokens fall out of view</text>
      <text x={20} y={170} fontFamily={MONO} fontSize="11.5" fill={C.soft}>a fixed token budget (e.g. 200K) slides forward as the conversation grows</text>
    </svg>
  )
}

function Box({ x, y, w, h, fill, stroke, label, sub, color }: { x: number; y: number; w: number; h: number; fill: string; stroke: string; label: string; sub?: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5)} fontFamily={MONO} fontSize="13" fill={color} textAnchor="middle" fontWeight="600">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 16} fontFamily={MONO} fontSize="11" fill={C.dim} textAnchor="middle">{sub}</text>}
    </g>
  )
}
export function RAG() {
  return (
    <svg viewBox="0 0 560 230" role="img" aria-label="Retrieval-augmented generation flow">
      <defs>
        <marker id="rag-arr" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
          <path d="M0 0 L9 4.5 L0 9 z" fill={C.dim} />
        </marker>
      </defs>
      <Box x={16} y={90} w={104} h={50} fill={C.white} stroke={C.cream} label="Question" color={C.ink} />
      <path d="M120 115 L150 115" stroke={C.dim} strokeWidth="2" markerEnd="url(#rag-arr)" />
      <Box x={150} y={90} w={110} h={50} fill="#ECEDDF" stroke="#D4D6BE" label="Retrieve" sub="search your docs" color="#54583B" />
      <rect x={150} y={20} width={110} height={42} rx={9} fill={C.cream} stroke={C.cream} />
      <text x={205} y={46} fontFamily={MONO} fontSize="12" fill={C.soft} textAnchor="middle">📄 your docs</text>
      <path d="M205 62 L205 88" stroke={C.dim} strokeWidth="2" markerEnd="url(#rag-arr)" />
      <path d="M260 115 L290 115" stroke={C.dim} strokeWidth="2" markerEnd="url(#rag-arr)" />
      <Box x={290} y={90} w={110} h={50} fill="#F6E7DF" stroke="#EAC6B6" label="LLM" sub="question + docs" color={C.terra} />
      <path d="M400 115 L430 115" stroke={C.dim} strokeWidth="2" markerEnd="url(#rag-arr)" />
      <Box x={430} y={90} w={114} h={50} fill={C.white} stroke={C.cream} label="Grounded" sub="answer + sources" color={C.ink} />
      <text x={280} y={196} fontFamily={MONO} fontSize="11.5" fill={C.dim} textAnchor="middle">facts come from retrieved text, not just the model's memory</text>
    </svg>
  )
}

export function AgentLoop() {
  return (
    <svg viewBox="0 0 560 260" role="img" aria-label="An agent loop: model calls a tool, reads the result, repeats">
      <defs>
        <marker id="ag-arr" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
          <path d="M0 0 L9 4.5 L0 9 z" fill={C.terra} />
        </marker>
      </defs>
      <Box x={210} y={20} w={140} h={52} fill="#F6E7DF" stroke="#EAC6B6" label="Model" sub="decides next step" color={C.terra} />
      <Box x={360} y={120} w={150} h={52} fill={C.white} stroke={C.cream} label="Tool call" sub="search · run · fetch" color={C.ink} />
      <Box x={210} y={196} w={140} h={48} fill="#ECEDDF" stroke="#D4D6BE" label="Reads result" color="#54583B" />
      <Box x={36} y={120} w={150} h={52} fill={C.cream} stroke={C.cream} label="Final answer" sub="when done" color={C.ink} />
      <path d="M350 52 C 430 60, 450 95, 440 118" fill="none" stroke={C.terra} strokeWidth="2.5" markerEnd="url(#ag-arr)" />
      <path d="M420 172 C 410 205, 360 215, 352 218" fill="none" stroke={C.terra} strokeWidth="2.5" markerEnd="url(#ag-arr)" />
      <path d="M278 196 C 270 150, 270 120, 280 74" fill="none" stroke={C.terra} strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#ag-arr)" className="anim-dash" />
      <path d="M210 150 L188 146" stroke={C.dim} strokeWidth="2" markerEnd="url(#ag-arr)" />
      <text x={295} y={150} fontFamily={MONO} fontSize="11" fill={C.dim} textAnchor="middle">loop until</text>
      <text x={295} y={164} fontFamily={MONO} fontSize="11" fill={C.dim} textAnchor="middle">solved</text>
    </svg>
  )
}
