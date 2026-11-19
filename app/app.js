// Leonida Platinum — offline GTA VI trophy guide and tracker.
// Loads app/data/trophies.json, renders the checklist, roadmap, missable list and
// trophy detail views, and keeps the checklist in localStorage. No network use:
// the only fetch is the trophy data file under app/ itself.
const STORAGE_KEY = 'leonida-platinum-v2';
const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const STAGES = [
  { n: 1, title: 'Stage 1 — Story: play it through', note: 'Chapters 1 to 4, the final mission, the mission trophies and the stranger strands. These unlock by playing the story; nothing here needs hunting. The four missable moments in Stage 2 are the only ones to watch for while you play.' },
  { n: 2, title: 'Stage 2 — Partner and missable moments', note: 'Four trophies can be missed, and they all need a moment that may not come back: a partner beside you, a one-time airport exit, or a story choice. Do them the moment the chance appears — before the finale.' },
  { n: 3, title: 'Stage 3 — Open world: activities', note: 'Races, stunts, the shooting range, robberies, hunting and the odd moments. Do these any time after the story; none of them is missable, and most of them pop during regular play.' },
  { n: 4, title: 'Stage 4 — Collectibles, money and the map, then platinum', note: 'Cards, WAiNK spots, meditation, vehicles, areas, garages and the money grinds. Sweep the map last, then the platinum follows on its own.' },
];

const rowsEl = document.getElementById('rows');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const earnedFilterEl = document.getElementById('earned-filter');
const spoilerEl = document.getElementById('spoiler');

let trophies = [];
let earned = new Set(loadProgress());

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
}

function trophyPoints(t) {
  return POINTS[t.grade] ?? 15;
}

function earnedPoints() {
  return trophies.reduce((sum, t) => sum + (earned.has(t.id) ? trophyPoints(t) : 0), 0);
}

function totalPoints() {
  return trophies.reduce((sum, t) => sum + trophyPoints(t), 0);
}

function renderProgress() {
  const count = earned.size;
  const total = trophies.length;
  document.getElementById('progress-count').textContent = `${count} of ${total} earned`;
  document.getElementById('progress-points').textContent = `${earnedPoints()} / ${totalPoints()} pts`;
  document.getElementById('progress-fill').style.width = total ? `${Math.round((count / total) * 100)}%` : '0%';
  document.getElementById('progress-note').textContent = count === total && total > 0
    ? 'Platinum earned — you are a Leonida Legend.'
    : `Platinum: earn the other ${total - count}.`;
}

function spoilerHides(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.id);
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = `grade-badge grade-${t.grade}`;
  span.textContent = t.grade;
  return span;
}

function kindTag(t) {
  const span = document.createElement('span');
  span.className = 'kind-tag';
  span.textContent = t.kind;
  return span;
}

function missableFlag(t) {
  if (!t.missable) return null;
  const span = document.createElement('span');
  span.className = 'missable-flag';
  span.textContent = 'Missable';
  return span;
}

function trophyMatches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kindEl.value === 'missable') {
    if (!t.missable) return false;
  } else if (kindEl.value !== 'all' && t.kind !== kindEl.value) {
    return false;
  }
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedFilterEl.value === 'earned' && !earned.has(t.id)) return false;
  if (earnedFilterEl.value === 'todo' && earned.has(t.id)) return false;
  return true;
}

function renderChecklist() {
  rowsEl.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  document.getElementById('count-line').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned`;
  for (const t of shown) {
    const tr = document.createElement('tr');
    if (earned.has(t.id)) tr.classList.add('earned-row');
    const hidden = spoilerHides(t);
    const boxCell = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveProgress();
      renderAll();
    });
    boxCell.append(box);
    const nameCell = document.createElement('td');
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden trophy' : t.name;
    nameCell.append(name);
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Hidden until earned — finish the story to reveal it.' : t.description;
    nameCell.append(desc);
    const flag = missableFlag(t);
    if (flag) nameCell.append(flag);
    const gradeCell = document.createElement('td');
    gradeCell.append(gradeBadge(t));
    const kindCell = document.createElement('td');
    kindCell.append(kindTag(t));
    const guideCell = document.createElement('td');
    guideCell.className = 'guide-cell';
    guideCell.textContent = hidden ? 'Guide hidden until earned.' : t.guide;
    const source = document.createElement('span');
    source.className = 'guide-source';
    source.textContent = hidden ? '' : `Source: ${t.source}`;
    guideCell.append(source);
    tr.append(boxCell, nameCell, gradeCell, kindCell, guideCell);
    tr.addEventListener('click', (event) => {
      if (event.target === box) return;
      location.hash = `#/trophy/${t.id}`;
    });
    rowsEl.append(tr);
  }
}

function renderRoadmap() {
  const wrap = document.getElementById('stages');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const card = document.createElement('div');
    card.className = 'stage-card';
    const members = trophies.filter((t) => t.stage === stage.n);
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = ` — ${members.length} trophies`;
    h.append(count);
    const note = document.createElement('p');
    note.textContent = stage.note;
    const list = document.createElement('ul');
    for (const t of members) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#/trophy/${t.id}`;
      link.textContent = spoilerHides(t) ? 'Hidden trophy' : t.name;
      li.append(link);
      if (t.missable) li.append(missableFlag(t));
      list.append(li);
    }
    card.append(h, note, list);
    wrap.append(card);
  }
}

function renderMissables() {
  const wrap = document.getElementById('missable-list');
  wrap.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = t.name;
    h.append(gradeBadge(t));
    const desc = document.createElement('p');
    desc.textContent = t.description;
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const source = document.createElement('p');
    source.className = 'guide-source';
    source.textContent = `Source: ${t.source}`;
    card.append(h, desc, guide, source);
    wrap.append(card);
  }
}

function renderDetail(id) {
  const t = trophies.find((x) => x.id === id);
  const detail = document.getElementById('detail');
  detail.replaceChildren();
  if (!t) {
    detail.textContent = 'No trophy with that number.';
    return;
  }
  const hidden = spoilerHides(t);
  const card = document.createElement('article');
  card.className = 'detail-card';
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden trophy' : t.name;
  const meta = document.createElement('p');
  meta.append(gradeBadge(t), ' ', kindTag(t), ' ');
  if (t.missable) meta.append(missableFlag(t));
  const stageLine = document.createElement('p');
  stageLine.textContent = `Roadmap stage ${t.stage} of 4 · ${STAGES[t.stage - 1].title}`;
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? 'Hidden until earned — finish the story to reveal it.' : t.description;
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'Guide hidden until earned.' : t.guide;
  const source = document.createElement('p');
  source.className = 'guide-source';
  source.textContent = hidden ? '' : `Source: ${t.source}`;
  const toggle = document.createElement('p');
  const label = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    saveProgress();
    renderAll();
  });
  label.append(box, document.createTextNode(' Earned'));
  toggle.append(label);
  card.append(h, meta, stageLine, desc, guide, source, toggle);
  detail.append(card);
}

function showView(name) {
  for (const view of document.querySelectorAll('.view')) view.hidden = true;
  document.getElementById(`view-${name}`).hidden = false;
  for (const tab of document.querySelectorAll('.tab')) tab.classList.remove('active');
  const tab = document.getElementById(`tab-${name === 'detail' ? 'checklist' : name}`);
  if (tab) tab.classList.add('active');
}

function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'roadmap') {
    showView('roadmap');
  } else if (parts[0] === 'missables') {
    showView('missables');
  } else if (parts[0] === 'trophy' && parts[1]) {
    renderDetail(Number(parts[1]));
    showView('detail');
  } else {
    showView('checklist');
  }
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  route();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: 'leonida-platinum', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-save.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const doc = JSON.parse(await file.text());
    const list = Array.isArray(doc) ? doc : doc.earned;
    if (!Array.isArray(list)) throw new Error('bad file');
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(list.filter((id) => valid.has(id)));
    saveProgress();
    renderAll();
  } catch {
    alert('That file is not a Leonida Platinum save.');
  }
}

document.getElementById('export').addEventListener('click', exportProgress);
document.getElementById('import').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
for (const el of [searchEl, kindEl, gradeEl, earnedFilterEl, spoilerEl]) {
  el.addEventListener('input', renderChecklist);
  el.addEventListener('change', renderChecklist);
}
window.addEventListener('hashchange', route);

await loadTrophies();
renderAll();
