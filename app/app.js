'use strict';
/* Leonida Platinum Ledger — offline GTA VI trophy guide and tracker. */
const STORE_KEY = 'leonida-platinum-ledger-progress-v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const params = new URLSearchParams(location.search);

let trophies = [];
let earned = new Set();
let view = params.get('view') || 'checklist';
let filter = params.get('filter') || 'all';
let query = (params.get('q') || '').toLowerCase();
let spoiler = params.get('spoiler') === '1';
let selected = Number(params.get('open') || 0);

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) earned = new Set(JSON.parse(raw));
  } catch (e) { earned = new Set(); }
  const seed = params.get('checked');
  if (seed) seed.split(',').forEach((n) => { const i = Number(n); if (Number.isInteger(i)) earned.add(i); });
}
function saveProgress() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...earned])); } catch (e) { /* private mode */ }
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function isStory(t) { return t.kind === 'story'; }
function shownName(t, i) {
  if (spoiler && isStory(t) && !earned.has(i)) return '<span class="hidden-name">Hidden story trophy</span>';
  return esc(t.name);
}
function shownDesc(t, i) {
  if (spoiler && isStory(t) && !earned.has(i)) return 'Description hidden by spoiler mode — earn it to reveal.';
  return esc(t.description);
}
function badges(t) {
  let h = '<span class="badge g-' + t.grade + '">' + t.grade.toUpperCase() + '</span> ';
  h += '<span class="badge b-kind">' + esc(t.kind) + '</span> ';
  if (t.missable) h += '<span class="badge b-miss">MISSABLE</span> ';
  if (t.count !== null && t.count !== undefined) h += '<span class="badge b-count">count ' + t.count + '</span>';
  return h;
}
function renderStats() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const steps = trophies.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const srcs = new Set();
  trophies.forEach((t) => (t.sources || []).forEach((s) => srcs.add(s)));
  document.getElementById('counts').textContent =
    total + ' trophies · ' + done + ' earned (' + pct + '%) · ' + steps + ' cited steps · ' + srcs.size + ' sources';
  document.getElementById('barfill').style.width = pct + '%';
  document.getElementById('gradecounts').textContent = GRADE_ORDER.map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t, i) => t.grade === g && earned.has(i)).length;
    return g + ' ' + got + '/' + all;
  }).join(' · ');
}
function matches(t, i) {
  if (filter === 'missable' && !t.missable) return false;
  if (filter !== 'all' && filter !== 'missable' && t.kind !== filter) return false;
  if (query && !(t.name + ' ' + t.description).toLowerCase().includes(query)) return false;
  return true;
}
function renderList() {
  const el = document.getElementById('list');
  el.innerHTML = trophies.map((t, i) => {
    if (!matches(t, i)) return '';
    return '<div class="row' + (earned.has(i) ? ' done' : '') + (i === selected ? ' sel' : '') + '" data-i="' + i + '" role="listitem">' +
      '<input type="checkbox" data-check="' + i + '"' + (earned.has(i) ? ' checked' : '') + ' aria-label="Mark earned">' +
      '<div><div class="rname">' + shownName(t, i) + '</div><div class="rdesc">' + shownDesc(t, i) + '</div>' +
      '<div>' + badges(t) + '</div></div></div>';
  }).join('') || '<p>No trophies match this filter.</p>';
  el.querySelectorAll('.row').forEach((r) => r.addEventListener('click', (e) => {
    if (e.target.matches('input')) return;
    selected = Number(r.dataset.i); renderList(); renderDetail();
  }));
  el.querySelectorAll('input[data-check]').forEach((c) => c.addEventListener('change', () => {
    const i = Number(c.dataset.check);
    if (c.checked) earned.add(i); else earned.delete(i);
    saveProgress(); renderStats(); renderList(); renderDetail();
  }));
}
function renderDetail() {
  const t = trophies[selected];
  const el = document.getElementById('detail');
  if (!t) { el.innerHTML = '<p>Pick a trophy to see its cited guide.</p>'; return; }
  const hiddenNow = spoiler && isStory(t) && !earned.has(selected);
  el.innerHTML =
    '<h2>' + shownName(t, selected) + '</h2>' +
    '<p class="desc">' + shownDesc(t, selected) + '</p>' +
    '<div>' + badges(t) + ' <span class="badge b-count">Roadmap stage ' + esc(t.stage) + '</span></div>' +
    (hiddenNow
      ? '<h3>Guide</h3><p>Spoiler mode is on: this story guide stays hidden until the trophy is earned. Tick it in the checklist to reveal the guide, steps and sources.</p>'
      : '<h3>Guide</h3><p>' + esc(t.guide) + '</p>' +
        '<h3>Steps</h3><ol>' + (t.steps || []).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
        (t.missable ? '<h3>Miss window</h3><p>' + esc(t.misswindow || 'Can be missed — see the guide above.') + '</p>' : '') +
        '<h3>Sources</h3><p class="sources">Cited: ' + (t.sources || []).map(esc).join(' · ') + '</p>');
}
function renderRoadmap() {
  const el = document.getElementById('view-roadmap');
  const stages = [];
  trophies.forEach((t, i) => {
    let s = stages.find((x) => x.name === t.stage);
    if (!s) { s = { name: t.stage, items: [] }; stages.push(s); }
    s.items.push({ t, i });
  });
  stages.sort((a, b) => a.name.localeCompare(b.name));
  el.innerHTML = '<h2 style="margin-top:0">Platinum roadmap — earn in this order</h2>' +
    '<p style="font-size:15.5px">Story chapters first so nothing story-gated is missed, side strands before the finale, then activities and collectibles cleanup, and the 100% and platinum trophies last. Stages are built from the official trophy descriptions.</p>' +
    stages.map((s) =>
      '<div class="stage"><div><h3>' + esc(s.name) + '</h3><div class="when">' + s.items.length + ' trophies</div></div><ul>' +
      s.items.map(({ t, i }) => '<li>' + (earned.has(i) ? '✓ ' : '') + shownName(t, i) + ' <span class="badge g-' + t.grade + '">' + t.grade + '</span>' + (t.missable ? ' <span class="badge b-miss">MISSABLE</span>' : '') + '</li>').join('') +
      '</ul></div>').join('');
}
function renderMissables() {
  const el = document.getElementById('view-missables');
  const miss = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.missable);
  const srcs = new Set();
  trophies.forEach((t) => (t.sources || []).forEach((s) => srcs.add(s)));
  el.innerHTML = '<h2 style="margin-top:0">Missable trophies — ' + miss.length + ' flagged</h2>' +
    '<p style="font-size:15.5px">These can be lost for a playthrough if their window closes. Windows below are read from the official descriptions; where GTA VI is still pre-release and a window is inferred rather than confirmed, the guide says so.</p>' +
    miss.map(({ t, i }) =>
      '<div class="missrow"><h3>' + shownName(t, i) + ' ' + badges(t) + '</h3>' +
      '<p><strong>When it can be missed:</strong> ' + esc(t.misswindow || 'See guide.') + '</p>' +
      '<p>' + esc(t.guide) + '</p>' +
      '<p class="sources">Cited: ' + (t.sources || []).map(esc).join(' · ') + '</p></div>').join('') +
    '<table class="matrix"><tr><th>Source</th><th>Used for</th></tr>' +
    [...srcs].map((s) => '<tr><td>' + esc(s) + '</td><td>' + (s.includes('PSNProfiles') || s.includes('Exophase') ? 'Official name, description, grade and tracked count' : s.includes('Rockstar') ? 'Game and setting facts' : 'Guide steps and miss-window context') + '</td></tr>').join('') +
    '</table>';
}
function render() {
  renderStats();
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  document.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.filter === filter));
  document.getElementById('spoiler').checked = spoiler;
  ['checklist', 'roadmap', 'missables'].forEach((v) => {
    document.getElementById('view-' + v).hidden = v !== view;
  });
  renderList(); renderDetail(); renderRoadmap(); renderMissables();
}
function wireControls() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; render(); }));
  document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
  document.getElementById('search').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); renderList(); });
  document.getElementById('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; render(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-platinum-ledger-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then((txt) => {
      const data = JSON.parse(txt);
      earned = new Set(Array.isArray(data) ? data : data.earned || []);
      saveProgress(); render();
    }).catch(() => { /* unreadable file: keep current progress */ });
  });
}
fetch('data/trophies.json')
  .then((r) => r.json())
  .then((data) => {
    trophies = Array.isArray(data) ? data : data.trophies;
    if (selected < 0 || selected >= trophies.length) selected = 0;
    loadProgress();
    wireControls();
    render();
  })
  .catch(() => {
    document.getElementById('counts').textContent = 'Could not load data/trophies.json — serve the app/ folder over HTTP.';
  });
