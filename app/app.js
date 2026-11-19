const LS_KEY = 'gta6-trophy-progress-v1';
let trophies = [];
let earned = new Set();
let selected = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) earned = new Set(JSON.parse(raw));
  } catch (e) { earned = new Set(); }
}
function saveProgress() {
  localStorage.setItem(LS_KEY, JSON.stringify([...earned]));
}
function isStory(t) { return t.kind === 'story' || t.kind === 'missable'; }
function displayName(t) {
  const hide = document.getElementById('spoilerToggle').checked;
  if (hide && isStory(t) && !earned.has(t.name)) return 'Hidden story trophy';
  return t.name;
}
function displayDesc(t) {
  const hide = document.getElementById('spoilerToggle').checked;
  if (hide && isStory(t) && !earned.has(t.name)) return 'Earn this story trophy to reveal its description.';
  return t.description;
}
function renderProgress() {
  const total = trophies.length;
  const got = trophies.filter(t => earned.has(t.name)).length;
  const pct = total ? Math.round((got / total) * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = got + ' / ' + total + ' earned (' + pct + '%)';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('gradeCounts').textContent = grades.map(g => {
    const tot = trophies.filter(t => t.grade === g).length;
    const has = trophies.filter(t => t.grade === g && earned.has(t.name)).length;
    return g + ' ' + has + '/' + tot;
  }).join('  ·  ');
}
function filtered() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const kind = document.getElementById('kindFilter').value;
  const grade = document.getElementById('gradeFilter').value;
  const hideEarned = document.getElementById('hideEarned').checked;
  return trophies.filter(t => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (hideEarned && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}
function renderList() {
  const list = document.getElementById('trophyList');
  const items = filtered();
  document.getElementById('resultCount').textContent = 'Showing ' + items.length + ' of ' + trophies.length + ' trophies';
  list.innerHTML = '';
  for (const t of items) {
    const card = document.createElement('article');
    card.className = 'card ' + t.grade + (earned.has(t.name) ? ' earned' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = earned.has(t.name);
    cb.setAttribute('aria-label', 'Mark earned: ' + t.name);
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) earned.add(t.name); else earned.delete(t.name);
      saveProgress(); renderProgress(); renderList(); renderRoadmap();
      if (selected === t.name) openGuide(t);
    });
    const body = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'tname'; nameEl.textContent = displayName(t);
    const descEl = document.createElement('div');
    descEl.className = 'tdesc'; descEl.textContent = displayDesc(t);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const g = document.createElement('span'); g.className = 'pill ' + t.grade; g.textContent = t.grade;
    const k = document.createElement('span'); k.className = 'pill'; k.textContent = t.kind;
    const s = document.createElement('span'); s.className = 'pill'; s.textContent = t.stage;
    meta.append(g, k, s);
    if (t.missable) {
      const m = document.createElement('span'); m.className = 'pill missable'; m.textContent = 'MISSABLE';
      meta.appendChild(m);
    }
    body.append(nameEl, descEl, meta);
    card.append(cb, body);
    card.addEventListener('click', () => openGuide(t));
    list.appendChild(card);
  }
}
function openGuide(t) {
  selected = t.name;
  const panel = document.getElementById('guidePanel');
  const content = document.getElementById('guideContent');
  panel.classList.remove('hidden');
  content.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = displayName(t);
  const d = document.createElement('p'); d.textContent = displayDesc(t);
  const meta = document.createElement('p');
  meta.textContent = 'Grade: ' + t.grade + ' · Kind: ' + t.kind + ' · Stage: ' + t.stage + (t.missable ? ' · MISSABLE' : '');
  const guide = document.createElement('p'); guide.textContent = t.guide;
  const srcTitle = document.createElement('h4'); srcTitle.textContent = 'Sources';
  const ul = document.createElement('ul');
  for (const s of (t.sources || [])) {
    const li = document.createElement('li'); li.textContent = s; ul.appendChild(li);
  }
  content.append(h, d, meta, guide, srcTitle, ul);
}
function renderRoadmap() {
  const wrap = document.getElementById('roadmapList');
  wrap.innerHTML = '';
  const order = ['1. Story', '2. Strands', '3. Collectibles', '4. Activities', '5. Cleanup', 'Platinum'];
  const notes = {
    '1. Story': 'Play the main story first. Keep manual saves before big choices and watch for MISSABLE badges.',
    '2. Strands': 'Finish the named mission strands (Andy, Kenton, Billy, Randy, Tyrone) toward Strangers & Freaks.',
    '3. Collectibles': 'Sweep meditation spots, cards, WAiNK locations, vehicles, and full map exploration.',
    '4. Activities': 'Races, stunts, shooting range golds, drone races, robberies, and partner trophies.',
    '5. Cleanup': 'Money grinds and purchases, then push to 100% Completion.',
    'Platinum': 'Earn every other trophy to become a Leonida Legend.'
  };
  for (const stage of order) {
    const items = trophies.filter(t => t.stage === stage);
    if (!items.length) continue;
    const box = document.createElement('div');
    box.className = 'roadmap-stage';
    const h = document.createElement('h3');
    const got = items.filter(t => earned.has(t.name)).length;
    h.textContent = stage + ' (' + got + '/' + items.length + ')';
    const p = document.createElement('p'); p.textContent = notes[stage] || '';
    const ul = document.createElement('ul');
    for (const t of items) {
      const li = document.createElement('li');
      li.textContent = (earned.has(t.name) ? '✓ ' : '○ ') + displayName(t) + ' — ' + displayDesc(t) + (t.missable ? ' [MISSABLE]' : '');
      ul.appendChild(li);
    }
    box.append(h, p, ul);
    wrap.appendChild(box);
  }
}
function showView(which) {
  const checklist = document.getElementById('checklistView');
  const roadmap = document.getElementById('roadmapView');
  const tc = document.getElementById('tabChecklist');
  const tr = document.getElementById('tabRoadmap');
  if (which === 'roadmap') {
    checklist.classList.add('hidden'); roadmap.classList.remove('hidden');
    tr.classList.add('active'); tc.classList.remove('active');
  } else {
    roadmap.classList.add('hidden'); checklist.classList.remove('hidden');
    tc.classList.add('active'); tr.classList.remove('active');
  }
}
async function init() {
  loadProgress();
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies || [];
  renderProgress(); renderList(); renderRoadmap();
  for (const id of ['search', 'kindFilter', 'gradeFilter', 'spoilerToggle', 'hideEarned']) {
    document.getElementById(id).addEventListener('input', () => { renderList(); renderRoadmap(); });
    document.getElementById(id).addEventListener('change', () => { renderList(); renderRoadmap(); });
  }
  document.getElementById('tabChecklist').addEventListener('click', () => showView('checklist'));
  document.getElementById('tabRoadmap').addEventListener('click', () => showView('roadmap'));
  document.getElementById('closeGuide').addEventListener('click', () => {
    document.getElementById('guidePanel').classList.add('hidden');
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : (parsed.earned || []);
      earned = new Set(arr.filter(n => trophies.some(t => t.name === n)));
      saveProgress(); renderProgress(); renderList(); renderRoadmap();
    } catch (err) { alert('Could not import that file.'); }
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress?')) return;
    earned = new Set(); saveProgress(); renderProgress(); renderList(); renderRoadmap();
  });
}
init();
