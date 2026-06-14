/*
  Skillwire content.
  Each entry is one card. To add a skill or repo, copy a block and edit it.

  Fields:
    type    'skill' or 'repo'   — which page it shows on
    name    display title
    repo    owner/name on GitHub (used for the "View source" link)
    kind    short label shown as a badge, e.g. 'skill', 'mcp server', 'cli tool'
    summary one plain sentence: what it is and why it's useful
    tags    keywords / functions used by search and shown as clickable chips
    uses    2-3 short strengths / "good for" lines
    signals the evidence row. Each has { src, icon, val }.
            icon is one of: 'star' (GitHub), 'hn' (Hacker News), 'clock' (maintained)
            Drop a signal entirely if you don't have it — the strip adapts.
*/

const DATA = [
  { type:'skill', name:'PDF form filler', repo:'dochelpers/pdf-form-filler', kind:'skill',
    summary:'Fills and flattens PDF forms from structured data, so an agent can produce finished paperwork without a third-party service.',
    tags:['pdf','forms','documents','automation'],
    uses:['Handles standard AcroForm fields and falls back gracefully on scanned PDFs','Runs locally and deterministically — same input, same output, no API calls','Reach for it when batch-generating filled documents or automating intake forms'],
    signals:[{src:'GitHub',icon:'star',val:'3.1k ★ · +280/mo'},{src:'Hacker News',icon:'hn',val:'214 pts · 96 comments'},{src:'Maintained',icon:'clock',val:'last commit 4d ago'}] },

  { type:'skill', name:'Docx report builder', repo:'paperkit/docx-report', kind:'skill',
    summary:'Turns structured content into polished Word documents — headings, tables, page numbers — for client-ready deliverables.',
    tags:['docx','word','documents','reports','templates'],
    uses:['Renders templates with real styling rather than plain text dumps','Inserts tables and images without breaking layout','Reach for it when producing formal documents from generated content'],
    signals:[{src:'GitHub',icon:'star',val:'1.8k ★ · +120/mo'},{src:'Maintained',icon:'clock',val:'last commit 1w ago'}] },

  { type:'skill', name:'Spreadsheet analyzer', repo:'gridworks/xlsx-skill', kind:'skill',
    summary:'Reads, cleans, and charts messy spreadsheets, then writes results back to a formatted workbook.',
    tags:['xlsx','spreadsheets','data','charts','analysis'],
    uses:['Cleans malformed rows and misplaced headers into a proper table','Computes formulas and builds charts in-place','Reach for it when wrangling tabular files into something usable'],
    signals:[{src:'GitHub',icon:'star',val:'2.4k ★ · +95/mo'},{src:'Hacker News',icon:'hn',val:'88 pts · 41 comments'},{src:'Maintained',icon:'clock',val:'last commit 3d ago'}] },

  { type:'skill', name:'Slide deck generator', repo:'deckline/pptx-skill', kind:'skill',
    summary:'Builds presentation decks slide by slide from an outline, with consistent layouts and speaker notes.',
    tags:['pptx','slides','presentations','documents'],
    uses:['Keeps layouts consistent across every slide','Adds speaker notes and section dividers automatically','Reach for it when turning an outline into a shareable deck'],
    signals:[{src:'GitHub',icon:'star',val:'920 ★ · +40/mo'},{src:'Maintained',icon:'clock',val:'last commit 2w ago'}] },

  { type:'repo', name:'Postgres query server', repo:'loomlabs/pg-mcp', kind:'mcp server',
    summary:'Lets Claude answer questions over a Postgres database through MCP, with a read-only mode that keeps an agent from changing your data.',
    tags:['database','postgres','sql','mcp','read-only'],
    uses:['Read-only by default, with schema introspection so the model understands your tables','Parameterized queries rather than raw string interpolation','Reach for it when you want an agent to explore data it should not be able to edit'],
    signals:[{src:'GitHub',icon:'star',val:'980 ★ · +60/mo'},{src:'Maintained',icon:'clock',val:'last commit 2w ago'}] },

  { type:'repo', name:'Browser automation server', repo:'driftco/browser-mcp', kind:'mcp server',
    summary:'Gives an agent a controllable headless browser for navigating pages, filling forms, and pulling content.',
    tags:['browser','automation','scraping','mcp','web'],
    uses:['Navigates, clicks, and types in a real headless browser','Returns page content and screenshots for the model to read','Reach for it when a task needs the live web, not a static API'],
    signals:[{src:'GitHub',icon:'star',val:'4.6k ★ · +410/mo'},{src:'Hacker News',icon:'hn',val:'301 pts · 154 comments'},{src:'Maintained',icon:'clock',val:'last commit 1d ago'}] },

  { type:'repo', name:'Filesystem server', repo:'nodebase/fs-mcp', kind:'mcp server',
    summary:'Exposes a sandboxed slice of the filesystem to an agent, scoped to directories you choose.',
    tags:['files','filesystem','mcp','local'],
    uses:['Restricts access to an allow-list of directories','Reads, writes, and lists files with clear boundaries','Reach for it when an agent needs local files but not your whole disk'],
    signals:[{src:'GitHub',icon:'star',val:'1.3k ★ · +75/mo'},{src:'Maintained',icon:'clock',val:'last commit 5d ago'}] },

  { type:'repo', name:'Vector search toolkit', repo:'embed-io/vec-search', kind:'cli tool',
    summary:'Builds and queries a local embeddings index so an agent can do semantic search over your own documents.',
    tags:['embeddings','search','vectors','rag','retrieval'],
    uses:['Indexes a folder of documents into a local vector store','Runs semantic queries without a hosted service','Reach for it when wiring up retrieval over private content'],
    signals:[{src:'GitHub',icon:'star',val:'2.0k ★ · +130/mo'},{src:'Hacker News',icon:'hn',val:'120 pts · 58 comments'},{src:'Maintained',icon:'clock',val:'last commit 6d ago'}] }
];
