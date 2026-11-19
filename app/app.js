// Leonida Platinum — trophy tracker: checklist, filters, spoiler setting,
// roadmap and missables, saved progress with export and import. Static, no
// network: the only fetch is the trophy data file under app/ itself.
const SAVE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';

const state = {
  trophies: [],
  earned: new Set(),
  kind: 'all',
  query: '',
  spoiler: true,
  tab: 'checklist',
  selected: null,
};

const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', text: 'Chapters 1 to 4, the opening mission Gone Fishing, every story mission and the final mission. Story trophies come in chapter order; the four missables are flagged on the Missables tab — earn them while the story is still there to play.' },
  { n: 2, title: 'Stage 2 — Activities and skills', text: 'Shooting Range golds, 250 stunts, races, drone races, fishing against Cal, arcade games, meditation spots, stranger strands, hunts and heists. These are all repeatable in free roam after the story.' },
  { n: 3, title: 'Stage 3 — Collectibles and exploration', text: 'Card sets, WAiNK It locations, vehicles to discover, the 52 areas of Leonida, garage properties, laundered Marked Bills and shop spending. Slow, steady counting — track each one as you go.' },
  { n: 4, title: 'Stage 4 — Cleanup and platinum', text: '100% Completion, the last counts, and the platinum itself. Check the missables once more before the final mission, then mop up whatever is left.' },
];

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) state.earned = new Set(ids.filter((x) => Number.isInteger(x)));
  } catch (_) { /* a corrupt save starts empty */ }
}

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
  } catch (_) { /* private mode: progress lives only for this session */ }
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function isStory(t) {
  return t.kind === 'story';
}

function displayName(t) {
  if (state.spoiler && isStory(t) && !state.earned.has(t.id)) return 'Hidden story trophy';
  return t.name;
}

function displayDescription(t) {
  if (state.spoiler && isStory(t) && !state.earned.has(t.id)) return 'A story trophy. Earn it (or turn the spoiler setting off) to reveal it.';
  return t.description;
}

function filteredTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.kind === 'online') return false; // this list has no online trophies
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function trophyRow(t) {
  const li = document.createElement('li');
  li.className = 'trophy-row' + (state.earned.has(t.id) ? ' earned' : '') + (state.selected === t.id ? ' selected' : '');
  li.dataset.id = t.id;
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'trophy-check';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
  box.addEventListener('click', (ev) => {
    ev.stopPropagation();
    toggleEarned(t.id);
  });
  const medal = document.createElement('span');
  medal.className = 'medal ' + t.grade;
  medal.title = gradeLabel(t);
  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name' + (state.spoiler && isStory(t) && !state.earned.has(t.id) ? ' hidden-name' : '');
  name.textContent = displayName(t);
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = displayDescription(t);
  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  const gradeTag = document.createElement('span');
  gradeTag.className = 'tag grade-' + t.grade;
  gradeTag.textContent = gradeLabel(t);
  tags.appendChild(gradeTag);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = t.kind;
  tags.appendChild(kindTag);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = 'Missable';
    tags.appendChild(m);
  }
  body.appendChild(name);
  body.appendChild(desc);
  body.appendChild(tags);
  li.appendChild(box);
  li.appendChild(medal);
  li.appendChild(body);
  li.addEventListener('click', () => selectTrophy(t.id));
  return li;
}

function renderChecklist() {
  const list = document.getElementById('trophy-list');
  list.textContent = '';
  const rows = filteredTrophies();
  const note = document.getElementById('list-note');
  if (state.kind === 'online') {
    note.textContent = 'This list has no online trophies — every one of the 55 is earned in single player.';
  } else if (rows.length === 0) {
    note.textContent = 'No trophies match this filter.';
  } else {
    note.textContent = 'Showing ' + rows.length + ' of 55 trophies. Tick a trophy when you earn it — progress is saved in this browser.';
  }
  for (const t of rows) list.appendChild(trophyRow(t));
  renderMissableList();
}

function renderMissableList() {
  const list = document.getElementById('missable-list');
  if (!list) return;
  list.textContent = '';
  for (const t of state.trophies.filter((x) => x.missable)) list.appendChild(trophyRow(t));
}

function renderRoadmap() {
  const box = document.getElementById('roadmap');
  box.textContent = '';
  for (const s of STAGES) {
    const mine = state.trophies.filter((t) => t.stage === s.n);
    const done = mine.filter((t) => state.earned.has(t.id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = s.title;
    const prog = document.createElement('div');
    prog.className = 'stage-progress';
    prog.textContent = done + ' of ' + mine.length + ' trophies in this stage';
    const p = document.createElement('p');
    p.textContent = s.text;
    const ul = document.createElement('ul');
    for (const t of mine) {
      const li = document.createElement('li');
      li.textContent = (state.earned.has(t.id) ? '✓ ' : '· ') + t.name + (t.missable ? ' — Missable' : '');
      ul.appendChild(li);
    }
    div.appendChild(h);
    div.appendChild(prog);
    div.appendChild(p);
    div.appendChild(ul);
    box.appendChild(div);
  }
}

function renderProgress() {
  const earned = state.earned.size;
  document.getElementById('earned-count').textContent = earned;
  document.getElementById('progress-fill').style.width = (earned / 55 * 100).toFixed(1) + '%';
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of state.trophies) if (state.earned.has(t.id)) counts[t.grade]++;
  document.getElementById('grade-counts').textContent =
    'Platinum ' + counts.platinum + '/1 · Gold ' + counts.gold + '/2 · Silver ' + counts.silver + '/6 · Bronze ' + counts.bronze + '/46';
}

function renderDetail() {
  const pane = document.getElementById('detail');
  const t = state.trophies.find((x) => x.id === state.selected);
  if (!t) {
    pane.innerHTML = '<p class="detail-empty">Select a trophy to see its guide and sources.</p>';
    return;
  }
  pane.textContent = '';
  const h = document.createElement('h2');
  h.textContent = displayName(t);
  const grade = document.createElement('p');
  grade.className = 'detail-grade';
  grade.textContent = gradeLabel(t) + ' · ' + t.kind + (t.missable ? ' · Missable' : '') + ' · Stage ' + t.stage;
  const desc = document.createElement('p');
  desc.textContent = displayDescription(t);
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  const src = document.createElement('p');
  src.className = 'sources';
  const strong = document.createElement('strong');
  strong.textContent = 'Sources: ';
  src.appendChild(strong);
  src.appendChild(document.createTextNode(t.sources));
  pane.appendChild(h);
  pane.appendChild(grade);
  pane.appendChild(desc);
  pane.appendChild(guide);
  pane.appendChild(src);
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderDetail();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id); else state.earned.add(id);
  persistSave();
  renderAll();
}

function selectTrophy(id) {
  state.selected = id;
  renderChecklist();
  renderDetail();
}

function setTab(tab) {
  state.tab = tab;
  for (const b of document.querySelectorAll('.tab')) b.classList.toggle('active', b.dataset.tab === tab);
  for (const v of document.querySelectorAll('.view')) v.classList.add('hidden');
  document.getElementById('view-' + tab).classList.remove('hidden');
}

function exportSave() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', save: 'leonida-platinum', earned: [...state.earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
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
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(ids.filter((x) => Number.isInteger(x) && valid.has(x)));
      persistSave();
      renderAll();
    } catch (_) {
      alert('That file is not a Leonida Platinum save.');
    }
  };
  reader.readAsText(file);
}

function applyHash() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const tab = params.get('tab');
  if (tab === 'roadmap' || tab === 'missables' || tab === 'checklist') setTab(tab);
  const trophy = params.get('trophy');
  if (trophy) {
    const id = Number(trophy);
    if (state.trophies.some((t) => t.id === id)) state.selected = id;
  }
}

async function boot() {
  loadSave();
  const res = await fetch(DATA_URL);
  const data = await res.json();
  state.trophies = Array.isArray(data) ? data : data.trophies;
  const spoiler = document.getElementById('spoiler');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    renderAll();
  });
  document.getElementById('search').addEventListener('input', (ev) => {
    state.query = ev.target.value;
    renderChecklist();
  });
  for (const b of document.querySelectorAll('#filters .chip')) {
    b.addEventListener('click', () => {
      state.kind = b.dataset.kind;
      for (const c of document.querySelectorAll('#filters .chip')) c.classList.toggle('active', c === b);
      renderChecklist();
    });
  }
  for (const b of document.querySelectorAll('.tab')) {
    b.addEventListener('click', () => setTab(b.dataset.tab));
  }
  document.getElementById('export-btn').addEventListener('click', exportSave);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (ev) => {
    if (ev.target.files && ev.target.files[0]) importSave(ev.target.files[0]);
    ev.target.value = '';
  });
  applyHash();
  renderAll();
}

boot();
