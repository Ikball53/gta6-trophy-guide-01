'use strict';
/* Leonida Trophy Companion — offline tracker logic.
   Data: data/trophies.json (55 official trophies + original guides).
   Progress persists in localStorage; export/import moves it between browsers.
   No network requests beyond the local data file: the app works fully offline. */

const STORAGE_KEY = 'leonida-trophy-companion-v1';
const STAGE_TITLES = {
  1: 'Stage 1 — Opening & Chapter 1 (grab the early missable)',
  2: 'Stage 2 — Chapters 2–3 (bank collectibles as the map opens)',
  3: 'Stage 3 — Chapter 4 & finale (partner crimes BEFORE the final mission)',
  4: 'Stage 4 — Stranger strands & first activities',
  5: 'Stage 5 — Activities, races, combat & crimes',
  6: 'Stage 6 — Collectible sweeps, vaults & money',
  7: 'Stage 7 — 100% completion & the platinum',
};
const KIND_LABELS = {
  story: 'Story', collectibles: 'Collectibles', activities: 'Activities',
  strangers: 'Strangers', crimes: 'Crimes', combat: 'Combat', money: 'Money',
  partner: 'Partner', completion: 'Completion', misc: 'Misc', platinum: 'Platinum',
};

let trophies = [];
let earned = loadProgress();
let selectedId = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function gradeCounts() {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const done = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    totals[t.grade] = (totals[t.grade] || 0) + 1;
    if (earned.has(t.id)) done[t.grade] = (done[t.grade] || 0) + 1;
  }
  return { totals, done };
}

function renderProgress() {
  const { totals, done } = gradeCounts();
  document.getElementById('earnedCount').textContent = String(earned.size);
  document.getElementById('progressFill').style.width = (earned.size / 55 * 100) + '%';
  document.getElementById('gradeLine').textContent =
    'Platinum ' + done.platinum + '/' + totals.platinum +
    ' · Gold ' + done.gold + '/' + totals.gold +
    ' · Silver ' + done.silver + '/' + totals.silver +
    ' · Bronze ' + done.bronze + '/' + totals.bronze;
}

function isSpoilerHidden(t) {
  const spoilerOn = document.getElementById('spoilerToggle').checked;
  return spoilerOn && t.kind === 'story' && !earned.has(t.id);
}

function passesFilters(t) {
  const kind = document.getElementById('kindFilter').value;
  const grade = document.getElementById('gradeFilter').value;
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const hideEarned = document.getElementById('hideEarnedToggle').checked;
  if (hideEarned && earned.has(t.id)) return false;
  if (kind === 'missable' && !t.missable) return false;
  if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
  if (grade !== 'all' && t.grade !== grade) return false;
  if (query) {
    const haystack = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function badgeHtml(t) {
  const parts = [
    '<span class="badge grade-' + t.grade + '">' + t.grade + '</span>',
    '<span class="badge">' + (KIND_LABELS[t.kind] || t.kind) + '</span>',
    '<span class="badge stage">Stage ' + t.stage + '</span>',
  ];
  if (t.missable) parts.push('<span class="badge missable">Missable</span>');
  return '<div class="badges">' + parts.join('') + '</div>';
}

function renderList() {
  const list = document.getElementById('trophyList');
  list.innerHTML = '';
  const visible = trophies.filter(passesFilters);
  if (visible.length === 0) {
    list.innerHTML = '<li class="trophy-item">No trophies match the current filters.</li>';
    return;
  }
  for (const t of visible) {
    const li = document.createElement('li');
    li.className = 'trophy-item' + (earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    const hidden = isSpoilerHidden(t);
    const name = hidden ? 'Story trophy (hidden by spoiler-safe mode)' : t.name;
    const desc = hidden ? 'Earn it to reveal its name and description.' : t.description;
    li.innerHTML =
      '<input type="checkbox" data-id="' + t.id + '"' + (earned.has(t.id) ? ' checked' : '') + ' aria-label="Mark earned">' +
      '<div class="trophy-main"><div class="trophy-name">' + name + '</div>' +
      '<div class="trophy-desc">' + desc + '</div>' + badgeHtml(t) + '</div>';
    li.addEventListener('click', (ev) => {
      if (ev.target.type === 'checkbox') return;
      selectedId = t.id;
      renderList();
      renderDetail(t);
    });
    li.querySelector('input[type="checkbox"]').addEventListener('change', (ev) => {
      if (ev.target.checked) earned.add(t.id); else earned.delete(t.id);
      saveProgress();
      renderProgress();
      renderList();
      renderDetail(t);
      renderRoadmap();
      renderMissables();
    });
    list.appendChild(li);
  }
}

function renderDetail(t) {
  const panel = document.getElementById('detailPanel');
  const hidden = isSpoilerHidden(t);
  if (hidden) {
    panel.innerHTML =
      '<h2>Story trophy — hidden</h2>' +
      '<p>Spoiler-safe mode is on. This story trophy stays hidden until you mark it earned. ' +
      'Its grade is <strong>' + t.grade + '</strong> and it belongs to roadmap stage ' + t.stage + '.</p>' +
      '<p class="hint">Untick spoiler-safe mode, or mark the trophy earned, to reveal its name, description and guide.</p>';
    return;
  }
  const steps = (t.steps || []).map((s) => '<li>' + s + '</li>').join('');
  const sources = (t.sources || []).map((s) => '<li>' + s + '</li>').join('');
  const lock = t.missable && t.lockPoint
    ? '<p class="lockpoint"><strong>Missable — lock point:</strong> ' + t.lockPoint + '</p>' : '';
  panel.innerHTML =
    '<h2>' + t.name + '</h2>' + badgeHtml(t) +
    '<p class="official-desc">Official description: “' + t.description + '”</p>' +
    '<h3>Guide (original wording)</h3><p>' + t.guide + '</p>' +
    (steps ? '<h3>Steps</h3><ol>' + steps + '</ol>' : '') + lock +
    '<div class="sources"><strong>Sources cited for this guide:</strong><ul>' + sources + '</ul>' +
    '<p>Sources are named so every fact can be checked; no source text is copied into this guide.</p></div>';
}

function renderRoadmap() {
  const box = document.getElementById('roadmapList');
  box.innerHTML = '';
  for (let stage = 1; stage <= 7; stage++) {
    const items = trophies.filter((t) => t.stage === stage);
    const doneCount = items.filter((t) => earned.has(t.id)).length;
    const card = document.createElement('div');
    card.className = 'stage-card';
    const rows = items.map((t) => {
      const hidden = isSpoilerHidden(t);
      const label = hidden ? 'Story trophy (hidden)' : t.name;
      const mark = earned.has(t.id) ? ' ✓' : '';
      const miss = t.missable ? ' — MISSABLE, see lock point' : '';
      return '<li><strong>' + label + '</strong> (' + t.grade + ', ' + (KIND_LABELS[t.kind] || t.kind) + ')' + mark + miss + '</li>';
    }).join('');
    card.innerHTML = '<h3>' + STAGE_TITLES[stage] + ' — ' + doneCount + '/' + items.length + ' done</h3><ul>' + rows + '</ul>';
    box.appendChild(card);
  }
}

function renderMissables() {
  const box = document.getElementById('missableList');
  box.innerHTML = '';
  for (const t of trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    card.innerHTML =
      '<h3>' + t.name + ' (' + t.grade + ')' + (earned.has(t.id) ? ' — earned ✓' : '') + '</h3>' +
      '<p class="official-desc">Official description: “' + t.description + '”</p>' +
      '<p class="lockpoint"><strong>Lock point:</strong> ' + (t.lockPoint || '') + '</p>' +
      '<p>' + t.guide + '</p>' +
      '<div class="sources"><strong>Sources:</strong><ul>' + (t.sources || []).map((s) => '<li>' + s + '</li>').join('') + '</ul></div>';
    box.appendChild(card);
  }
}

function switchView(view) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('view-checklist').classList.toggle('hidden', view !== 'checklist');
  document.getElementById('view-roadmap').classList.toggle('hidden', view !== 'roadmap');
  document.getElementById('view-missables').classList.toggle('hidden', view !== 'missables');
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-trophy-companion', version: 1, earned: [...earned].sort((a, b) => a - b) }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      earned = new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
      saveProgress();
      renderAll();
    } catch (err) {
      alert('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderProgress();
  renderList();
  renderRoadmap();
  renderMissables();
  const current = trophies.find((t) => t.id === selectedId);
  if (current) renderDetail(current);
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  trophies = data.trophies.slice().sort((a, b) => a.id - b.id);
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
  for (const id of ['searchInput', 'kindFilter', 'gradeFilter', 'spoilerToggle', 'hideEarnedToggle']) {
    document.getElementById(id).addEventListener('input', renderAll);
    document.getElementById(id).addEventListener('change', renderAll);
  }
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (ev) => {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    earned = new Set();
    saveProgress();
    renderAll();
  });
  renderAll();
  const firstMissable = trophies.find((t) => t.missable);
  if (firstMissable) { selectedId = firstMissable.id; renderList(); renderDetail(firstMissable); }
  // Deep links: ?view=roadmap|missables and ?spoiler=1 open that state directly.
  const params = new URLSearchParams(location.search);
  if (params.get('spoiler') === '1') {
    document.getElementById('spoilerToggle').checked = true;
    renderAll();
    if (firstMissable) renderDetail(firstMissable);
  }
  const viewParam = params.get('view');
  if (viewParam === 'roadmap' || viewParam === 'missables') switchView(viewParam);
}

boot();
