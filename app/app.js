// Leonida Platinum — the tracker: checklist, filters, spoiler setting,
// roadmap and missables, progress saved in the browser with export/import.
//
// The app loads one file at run time: data/trophies.json, its own data.
// It makes no network request of its own; source links open only when the
// reader follows them.
const SAVE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

// The roadmap, built from the official descriptions: four stages, each
// naming the trophies it covers by their id in data/trophies.json.
const ROADMAP = [
  {
    title: 'Stage 1 — Play the story',
    note: 'Chapters 1 to 4, the finale, and the contact finales. Do the four missables here, while the story is still open: Hot Together and Retail Therapy need your partner beside you, Catch Me If You Can needs the airport, and Actions Speak Louder is a choice you only get to make once.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 33, 34, 37, 48],
  },
  {
    title: 'Stage 2 — Activities and skills',
    note: 'Races, the shooting range, stunts, stranger strands and the one-off feats. These are all available after the story; the counts are PSN\'s own targets, so the grind is honest and the progress is tracked.',
    ids: [15, 16, 17, 18, 19, 20, 21, 25, 28, 29, 32, 36, 38, 39, 40, 41, 43, 44, 45, 46, 47, 49, 50, 51, 52, 53],
  },
  {
    title: 'Stage 3 — Collectibles and exploration',
    note: 'Cards, WAiNK tags, vehicles, areas and properties. Best done with the map open and a checklist in hand; none of them can be missed.',
    ids: [30, 31, 35, 42, 54, 55],
  },
  {
    title: 'Stage 4 — Cleanup and the platinum',
    note: 'Whatever is left, then 100% completion, then the platinum. A Long Road is the last gate before Vice Got a Price!',
    ids: [14, 1],
  },
];

const state = {
  trophies: [],
  earned: new Set(),
  spoiler: true,
  kind: 'all',
  query: '',
  tab: 'checklist',
  openId: null,
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter(Number.isInteger));
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch (err) {
    // A damaged save is ignored, never fatal.
    console.warn('Leonida Platinum: saved progress could not be read', err);
  }
}

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoiler: state.spoiler,
    }));
  } catch (err) {
    console.warn('Leonida Platinum: progress could not be saved', err);
  }
}

function trophyById(id) {
  return state.trophies.find((t) => t.id === id);
}

function isHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function medalHtml(trophy) {
  return `<span class="medal ${escapeHtml(trophy.grade)}">${escapeHtml(gradeLabel(trophy.grade))}</span>`;
}

function tagsHtml(trophy) {
  const tags = [`<span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>`];
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag">Hidden</span>');
  return tags.join(' ');
}

function sourcesHtml(trophy) {
  if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) return '';
  const links = trophy.sources.map((s) => {
    const label = escapeHtml(s.label || s.url);
    const url = escapeHtml(s.url || '');
    return url ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : label;
  });
  return `<p class="sources">Sources: ${links.join('; ')}.</p>`;
}

function detailHtml(trophy) {
  const stage = ROADMAP.find((s) => s.ids.includes(trophy.id));
  const stageNote = stage ? `<p class="stage-note">Roadmap: ${escapeHtml(stage.title)}.</p>` : '';
  if (isHidden(trophy)) {
    return `<div class="detail"><h3>Hidden story trophy</h3><p>This story trophy is hidden until you earn it. Turn the spoiler setting off to see its name and guide.</p></div>`;
  }
  return `<div class="detail"><h3>Guide</h3><p>${escapeHtml(trophy.guide)}</p>${sourcesHtml(trophy)}${stageNote}</div>`;
}

function rowHtml(trophy) {
  const hidden = isHidden(trophy);
  const earned = state.earned.has(trophy.id);
  const name = hidden ? '<span class="hidden-name">Hidden story trophy</span>' : escapeHtml(trophy.name);
  const desc = hidden ? 'Earn it to reveal its name and description.' : escapeHtml(trophy.description);
  const open = state.openId === trophy.id ? detailHtml(trophy) : '';
  return `<li class="trophy${earned ? ' earned' : ''}" data-id="${trophy.id}">
    <div class="trophy-row" role="button" tabindex="0" aria-expanded="${state.openId === trophy.id}">
      <input type="checkbox" ${earned ? 'checked' : ''} aria-label="Earned: ${escapeHtml(trophy.name)}">
      <div class="trophy-main">
        <div class="trophy-name">${name}</div>
        <div class="trophy-desc">${desc}</div>
        <div class="trophy-meta">${medalHtml(trophy)}${tagsHtml(trophy)}</div>
      </div>
    </div>
    ${open}
  </li>`;
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    // Search names, descriptions and guide text, so a word from a guide finds its trophy.
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderChecklist() {
  const list = document.getElementById('trophyList');
  const shown = visibleTrophies();
  list.innerHTML = shown.map(rowHtml).join('');
  document.getElementById('emptyNote').hidden = shown.length > 0;
}

function renderMissables() {
  const list = document.getElementById('missableList');
  list.innerHTML = state.trophies.filter((t) => t.missable).map(rowHtml).join('');
}

function renderRoadmap() {
  const box = document.getElementById('roadmapStages');
  box.innerHTML = ROADMAP.map((stage) => {
    const items = stage.ids.map((id) => {
      const t = trophyById(id);
      if (!t) return '';
      const done = state.earned.has(id) ? ' class="done"' : '';
      const name = isHidden(t) ? 'Hidden story trophy' : escapeHtml(t.name);
      return `<li${done}>${name} <span class="tag">${escapeHtml(gradeLabel(t.grade))}</span></li>`;
    }).join('');
    const doneCount = stage.ids.filter((id) => state.earned.has(id)).length;
    return `<div class="stage"><h3>${escapeHtml(stage.title)} <span class="stage-count">${doneCount}/${stage.ids.length}</span></h3><p>${escapeHtml(stage.note)}</p><ul>${items}</ul></div>`;
  }).join('');
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('totalCount').textContent = String(total);
  document.getElementById('progressFill').style.width = total ? `${Math.round((earned / total) * 100)}%` : '0%';
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderMissables();
  renderRoadmap();
}

function bindList(listEl) {
  listEl.addEventListener('click', (event) => {
    const row = event.target.closest('.trophy-row');
    const box = event.target.closest('input[type="checkbox"]');
    const item = event.target.closest('.trophy');
    if (!item) return;
    const id = Number(item.dataset.id);
    if (box) {
      if (box.checked) state.earned.add(id); else state.earned.delete(id);
      persistSave();
      renderAll();
      return;
    }
    if (row) {
      state.openId = state.openId === id ? null : id;
      renderAll();
    }
  });
  listEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('.trophy-row');
    if (!row) return;
    event.preventDefault();
    const id = Number(event.target.closest('.trophy').dataset.id);
    state.openId = state.openId === id ? null : id;
    renderAll();
  });
}

function switchTab(name) {
  state.tab = name;
  document.querySelectorAll('.tab').forEach((b) => {
    const active = b.dataset.tab === name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === `tab-${name}`);
  });
}

function exportSave() {
  const blob = new Blob([JSON.stringify({
    app: 'Leonida Platinum',
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-save.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const saved = JSON.parse(String(reader.result));
      if (!Array.isArray(saved.earned)) throw new Error('no earned list');
      state.earned = new Set(saved.earned.filter(Number.isInteger));
      if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
      document.getElementById('spoilerToggle').checked = state.spoiler;
      persistSave();
      renderAll();
    } catch (err) {
      alert('That file is not a Leonida Platinum save.');
    }
  };
  reader.readAsText(file);
}

async function boot() {
  loadSave();
  document.getElementById('spoilerToggle').checked = state.spoiler;
  const response = await fetch(DATA_URL);
  const data = await response.json();
  state.trophies = data.trophies || data;

  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });
  document.querySelectorAll('#kindFilters .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.kind = chip.dataset.kind;
      document.querySelectorAll('#kindFilters .chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderChecklist();
    });
  });
  document.getElementById('searchBox').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderChecklist();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    persistSave();
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportSave);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importSave(file);
    event.target.value = '';
  });
  bindList(document.getElementById('trophyList'));
  bindList(document.getElementById('missableList'));
  renderAll();
}

boot();
