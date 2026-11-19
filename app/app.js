/* Leonida Platinum — trophy tracker. Own code, no libraries, no network at run time. */
const STORE_KEY = 'leonida-platinum-v1';
const KINDS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online', completion: 'Completion', platinum: 'Platinum' };
const STAGES = {
  1: ['Play the story', 'Chapters 1–4, the final mission, the named story missions and the side-character arcs. Story trophies cannot be missed — just play through.'],
  2: ['Side arcs & activities', 'Stranger strands and the activities: shooting range, races, fishing, arcade, bowling, meditation, hunting and challenges.'],
  3: ['Collectibles & counts', 'Cards, WAiNK spots, vehicles, areas, garages, vaults, gang operations and the money goals.'],
  4: ['Cleanup & platinum', 'The situational feats, the partner-gated and choice-gated trophies, then 100% completion and the platinum.']
};

let trophies = [];
let state = loadState();
let currentView = 'checklist';
let selectedId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { earned: s.earned || {}, spoiler: s.spoiler !== false, kind: s.kind || 'all', grade: s.grade || 'all', hideEarned: !!s.hideEarned, query: s.query || '' };
    }
  } catch (e) { /* fresh state on bad save */ }
  return { earned: {}, spoiler: true, kind: 'all', grade: 'all', hideEarned: false, query: '' };
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }
function isHidden(t) { return state.spoiler && t.kind === 'story' && !state.earned[t.id]; }
function displayName(t) { return isHidden(t) ? 'Hidden story trophy' : t.name; }
function displayDesc(t) { return isHidden(t) ? 'Earn it to reveal its name and description.' : t.description; }

function earnedList() { return trophies.filter(t => state.earned[t.id]); }
function renderProgress() {
  const earned = earnedList().length;
  const pct = Math.round((earned / trophies.length) * 100);
  $('earnedCount').textContent = earned;
  $('progressFill').style.width = pct + '%';
  $('progressLine').textContent = pct + '% — ' + (earned === 0 ? 'nothing earned yet' : earned === trophies.length ? 'platinum earned!' : earned + ' of 55 earned');
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map(g => {
    const total = trophies.filter(t => t.grade === g).length;
    const got = trophies.filter(t => t.grade === g && state.earned[t.id]).length;
    return gradeLabel(g) + ' ' + got + '/' + total;
  }).join(' · ');
  $('gradeCounts').textContent = counts;
}

function trophyRow(t) {
  const hidden = isHidden(t);
  const row = document.createElement('div');
  row.className = 'trophy-row' + (state.earned[t.id] ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
  row.dataset.id = t.id;
  const pills = '<span class="pill grade-' + t.grade + '">' + gradeLabel(t.grade) + '</span>'
    + (t.kind === 'platinum' ? '' : '<span class="pill">' + (KINDS[t.kind] || t.kind) + '</span>')
    + (t.missable ? '<span class="pill missable">Missable</span>' : '')
    + (t.target ? '<span class="pill">Target: ' + Number(t.target).toLocaleString('en-US') + '</span>' : '')
    + (hidden ? '<span class="pill hidden-tag">Spoiler hidden</span>' : '');
  row.innerHTML = '<input type="checkbox" ' + (state.earned[t.id] ? 'checked' : '') + ' aria-label="Earned">'
    + '<div><div class="trophy-name">' + esc(displayName(t)) + '</div>'
    + '<div class="trophy-desc">' + esc(displayDesc(t)) + '</div>'
    + '<div class="trophy-meta">' + pills + '</div></div>'
    + '<div class="trophy-meta"><span class="pill">Stage ' + t.roadmap + '</span></div>';
  row.querySelector('input').addEventListener('click', (ev) => { ev.stopPropagation(); toggleEarned(t.id); });
  row.addEventListener('click', () => { selectedId = t.id; renderAll(); });
  return row;
}

function filteredTrophies() {
  const q = state.query.trim().toLowerCase();
  return trophies.filter(t => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.kind === 'online') return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned[t.id]) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderChecklist() {
  const pane = $('viewPane');
  pane.innerHTML = '';
  const list = filteredTrophies();
  if (state.kind === 'online') {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'No online trophies in the official list — all 55 are earned in single player.';
    pane.appendChild(note);
  }
  if (list.length === 0 && state.kind !== 'online') {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'No trophies match these filters.';
    pane.appendChild(note);
  }
  list.forEach(t => pane.appendChild(trophyRow(t)));
}

function renderRoadmap() {
  const pane = $('viewPane');
  pane.innerHTML = '';
  Object.keys(STAGES).forEach(num => {
    const stage = document.createElement('div');
    stage.className = 'stage';
    const members = trophies.filter(t => t.roadmap === Number(num));
    const got = members.filter(t => state.earned[t.id]).length;
    stage.innerHTML = '<h2>Stage ' + num + ' — ' + esc(STAGES[num][0]) + ' <span style="color:var(--muted);font-size:14px">(' + got + '/' + members.length + ')</span></h2><p>' + esc(STAGES[num][1]) + '</p>';
    members.forEach(t => stage.appendChild(trophyRow(t)));
    pane.appendChild(stage);
  });
}

function renderMissables() {
  const pane = $('viewPane');
  pane.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'rule-box';
  box.innerHTML = '<h2>How a trophy earns the Missable flag</h2>'
    + '<p>Built from the official descriptions only: a trophy is flagged missable when its window is a specific story moment or a partner-gated event. Mission-completion trophies are story progression and cannot be missed, and everything else can be done in free roam. If a flagged trophy is missed, check whether the mission can be replayed from the pause menu.</p>';
  pane.appendChild(box);
  trophies.filter(t => t.missable).forEach(t => pane.appendChild(trophyRow(t)));
  const note = document.createElement('p');
  note.className = 'empty-note';
  note.textContent = '4 missable trophies. The partner-gated ones (Hot Together, Retail Therapy) must be done while your partner is with you — do not leave them until after the finale.';
  pane.appendChild(note);
}

function renderAbout() {
  const pane = $('viewPane');
  pane.innerHTML = '<div class="about-block">'
    + '<h2>About this guide</h2>'
    + '<p>Leonida Platinum is a free, open-source, offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It runs entirely from its own files — no account, no network, no ads. Your progress is saved in this browser only.</p>'
    + '<h2>How to use it</h2><ul>'
    + '<li>Check a trophy off when you earn it. Progress is saved automatically.</li>'
    + '<li>Filter by kind or grade, or search by name. Hide earned trophies to see what is left.</li>'
    + '<li>Spoilers off (the default) hides the names and descriptions of story trophies until you earn them.</li>'
    + '<li>Export save downloads your progress as a file; Import save reads it back.</li>'
    + '<li>The Roadmap orders the 55 trophies into four stages, from the story to the platinum.</li></ul>'
    + '<h2>Sources</h2><ul>'
    + '<li>Trophy names, descriptions and grades: the official PlayStation list as Exophase and PSNProfiles publish it.</li>'
    + '<li>Counts the description does not state (42 Shooting Range challenges, 14 drone-race locations, 18 meditation spots, 52 Leonida areas, 9 gangs, 8 garages, the 500-choice count): PSNProfiles progress targets.</li>'
    + '<li>Every guide is our own words, written for this entry. Where a method is not yet verified in the game — it released today — the guide says so plainly instead of inventing a walkthrough.</li></ul>'
    + '<h2>What this guide does not do</h2>'
    + '<p>It never copies another guide\u2019s text, shows no Rockstar logo or official artwork, and sends nothing anywhere. If a guide\u2019s step turns out wrong once players have checked it in-game, the honest fix is a cited correction, not a guess.</p>'
    + '</div>';
}

function renderDetail() {
  const pane = $('detailPane');
  const t = trophies.find(x => x.id === selectedId);
  if (!t) {
    pane.innerHTML = '<p class="detail-empty">Pick a trophy from the list to see its guide and sources.</p>';
    return;
  }
  const hidden = isHidden(t);
  pane.innerHTML = '<h2>' + esc(displayName(t)) + '</h2>'
    + '<div class="trophy-meta"><span class="pill grade-' + t.grade + '">' + gradeLabel(t.grade) + '</span>'
    + (t.kind === 'platinum' ? '' : '<span class="pill">' + (KINDS[t.kind] || t.kind) + '</span>')
    + (t.missable ? '<span class="pill missable">Missable</span>' : '')
    + '<span class="pill">Roadmap stage ' + t.roadmap + '</span></div>'
    + '<p class="trophy-desc">' + esc(displayDesc(t)) + '</p>'
    + (hidden
      ? '<div class="detail-guide"><p><i>Spoilers are off — earn this story trophy to reveal its guide.</i></p></div>'
      : '<div class="detail-guide"><h3>Guide</h3><p>' + esc(t.guide) + '</p>'
        + (t.target ? '<p><b>PSN target:</b> ' + Number(t.target).toLocaleString('en-US') + '</p>' : '')
        + '<div class="detail-sources"><b>Sources:</b> ' + esc(t.sources) + '</div></div>')
    + '<label class="detail-earn"><input type="checkbox" id="detailEarned" ' + (state.earned[t.id] ? 'checked' : '') + '> Earned</label>'
    + nextUpHtml(t);
  $('detailEarned').addEventListener('change', () => toggleEarned(t.id));
}

function nextUpHtml(current) {
  const next = trophies.filter(t => !state.earned[t.id]).sort((a, b) => (a.roadmap - b.roadmap) || (a.id - b.id))[0];
  if (!next || next.id === current.id) return '';
  return '<div class="next-up"><b>Next up:</b> ' + esc(isHidden(next) ? 'Hidden story trophy' : next.name) + ' — ' + esc(KINDS[next.kind] || next.kind) + ', stage ' + next.roadmap + '.</div>';
}

function toggleEarned(id) {
  state.earned[id] = !state.earned[id];
  if (!state.earned[id]) delete state.earned[id];
  saveState();
  renderAll();
}

function renderAll() {
  renderProgress();
  if (currentView === 'checklist') renderChecklist();
  else if (currentView === 'roadmap') renderRoadmap();
  else if (currentView === 'missables') renderMissables();
  else renderAbout();
  renderDetail();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === currentView));
  document.querySelectorAll('#kindFilters button').forEach(b => b.classList.toggle('active', b.dataset.kind === state.kind));
  $('gradeFilter').value = state.grade;
  $('hideEarned').checked = state.hideEarned;
  $('spoilerToggle').checked = state.spoiler;
  $('searchBox').value = state.query;
  window.__shotReady = true;
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  if (view && ['checklist', 'roadmap', 'missables', 'about'].includes(view)) currentView = view;
  const trophy = Number(params.get('trophy'));
  if (trophy) selectedId = trophy;
  const spoiler = params.get('spoiler');
  if (spoiler === '0') state.spoiler = false;
  if (spoiler === '1') state.spoiler = true;
  const kind = params.get('filter');
  if (kind && (KINDS[kind] || kind === 'all')) state.kind = kind;
  const seed = Number(params.get('seed'));
  if (seed > 0) {
    // Seed the first N trophies in roadmap order, skipping the platinum:
    // the platinum only unlocks once the other 54 are earned.
    const order = [...trophies].filter(t => t.kind !== 'platinum').sort((a, b) => (a.roadmap - b.roadmap) || (a.id - b.id));
    order.slice(0, seed).forEach(t => { state.earned[t.id] = true; });
  }
  saveState();
}

function exportSave() {
  const blob = new Blob([JSON.stringify({ app: 'leonida-platinum', version: 1, exported_at: new Date().toISOString(), earned: Object.keys(state.earned).map(Number) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-save.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const earned = {};
      (data.earned || []).forEach(id => { if (trophies.some(t => t.id === id)) earned[id] = true; });
      state.earned = earned;
      saveState();
      renderAll();
    } catch (e) { alert('That file is not a Leonida Platinum save.'); }
  };
  reader.readAsText(file);
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  applyQueryParams();
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { currentView = b.dataset.view; renderAll(); }));
  document.querySelectorAll('#kindFilters button').forEach(b => b.addEventListener('click', () => { state.kind = b.dataset.kind; currentView = 'checklist'; saveState(); renderAll(); }));
  $('gradeFilter').addEventListener('change', e => { state.grade = e.target.value; saveState(); renderAll(); });
  $('hideEarned').addEventListener('change', e => { state.hideEarned = e.target.checked; saveState(); renderAll(); });
  $('spoilerToggle').addEventListener('change', e => { state.spoiler = e.target.checked; saveState(); renderAll(); });
  $('searchBox').addEventListener('input', e => { state.query = e.target.value; saveState(); renderAll(); });
  $('exportBtn').addEventListener('click', exportSave);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => { if (e.target.files[0]) importSave(e.target.files[0]); });
  renderAll();
}
boot();
