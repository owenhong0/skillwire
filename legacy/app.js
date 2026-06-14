/* Skillwire app logic. Reads DATA from data.js. */

const ICON = {
  gh:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>',
  star:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2 4.1 13.3l.9-4.3-3.3-3 4.4-.5z"/></svg>',
  hn:'<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="1.5" width="13" height="13" rx="2"/></svg>',
  clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>',
  warn:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 1.5l6.5 11.5H1.5z"/><path d="M8 6v3.5"/><circle cx="8" cy="11.5" r=".5" fill="currentColor"/></svg>'
};

const state = { view:'skills', query:'' };
const grid = document.getElementById('grid');
const resultline = document.getElementById('resultline');
const qInput = document.getElementById('q');
const clearBtn = document.getElementById('clear');

document.getElementById('count-skills').textContent = '('+DATA.filter(d=>d.type==='skill').length+')';
document.getElementById('count-repos').textContent = '('+DATA.filter(d=>d.type==='repo').length+')';

function matches(item, query){
  if(!query) return true;
  const hay = (item.name+' '+item.summary+' '+item.tags.join(' ')+' '+item.uses.join(' ')).toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(term => hay.includes(term));
}

function cardHTML(item){
  const chips = item.signals.map(s =>
    `<span class="chip">${ICON[s.icon]}<span class="src">${s.src}</span><span class="val">${s.val}</span></span>`).join('');
  const tags = item.tags.map(t => `<button class="tag" data-tag="${t}">${t}</button>`).join('');
  return `<article class="card" tabindex="0">
    <div class="card-head">
      <div>
        <h2 class="card-title">${item.name}</h2>
        <p class="repo">${ICON.gh}${item.repo}</p>
      </div>
      <span class="kind ${item.type==='skill'?'skill':'repo'}">${item.kind}</span>
    </div>
    <p class="summary">${item.summary}</p>
    <div class="tags">${tags}</div>
    <p class="label">Strengths &amp; good for</p>
    <ul class="uses">${item.uses.map(u=>`<li>${u}</li>`).join('')}</ul>
    <div class="strip">
      <div class="strip-evidence">
        <p class="label">Why it's here</p>
        <div class="chips">${chips}</div>
      </div>
      <aside class="strip-caution">
        <div class="caution-head">${ICON.warn} Not audited</div>
        <div class="caution-sub">We haven't reviewed this for security. Read the source before installing.</div>
        <a class="caution-link" href="https://github.com/${item.repo}">View source →</a>
      </aside>
    </div>
  </article>`;
}

function render(){
  document.querySelectorAll('.nav button').forEach(b =>
    b.setAttribute('aria-current', b.dataset.view === state.view ? 'true' : 'false'));
  const typeKey = state.view === 'skills' ? 'skill' : 'repo';
  const pool = DATA.filter(d => d.type === typeKey);
  const found = pool.filter(d => matches(d, state.query));
  clearBtn.style.display = state.query ? 'block' : 'none';

  if(found.length === 0){
    resultline.textContent = '';
    grid.innerHTML = `<div class="empty">
      <h3>Nothing matches "${state.query}" in ${state.view}</h3>
      <div>Try a broader term, or look in the other section.</div>
      <button id="resetq">Clear search</button>
    </div>`;
    document.getElementById('resetq').onclick = () => { qInput.value=''; state.query=''; qInput.focus(); render(); };
    return;
  }
  resultline.textContent = state.query
    ? `${found.length} of ${pool.length} ${state.view} match "${state.query}"`
    : `${pool.length} ${state.view}`;
  grid.innerHTML = found.map(cardHTML).join('');
}

document.querySelectorAll('.nav button').forEach(b =>
  b.addEventListener('click', () => { state.view = b.dataset.view; location.hash = b.dataset.view; render(); }));
qInput.addEventListener('input', e => { state.query = e.target.value.trim(); render(); });
clearBtn.addEventListener('click', () => { qInput.value=''; state.query=''; qInput.focus(); render(); });
grid.addEventListener('click', e => {
  const t = e.target.closest('.tag');
  if(t){ qInput.value = t.dataset.tag; state.query = t.dataset.tag; qInput.focus(); render(); }
});
window.addEventListener('hashchange', () => {
  const v = location.hash.replace('#','');
  if(v === 'skills' || v === 'repos'){ state.view = v; render(); }
});

const initial = location.hash.replace('#','');
if(initial === 'repos') state.view = 'repos';
render();
