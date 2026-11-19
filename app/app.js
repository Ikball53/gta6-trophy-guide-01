(function () {
  'use strict';

  var STORAGE_KEY = 'leonida-trophy-guide-v1';
  var EXOPHASE_URL = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
  var PSNPROFILES_URL = 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi';

  var COUNTERS = {
    'Cunning Stunts': { target: 250, unit: 'stunts' },
    'The Shootist': { target: 42, unit: 'gold medals' },
    'Earn Cash, Not Kudos': { target: 20, unit: 'different races won' },
    'Strangers & Freaks': { target: 8, unit: 'strands completed' },
    "Don't Touch My Deck": { target: 3, unit: 'card sets completed' },
    'You WAiNKer!': { target: 100, unit: 'locations' },
    'One Last Thing': { target: 50, unit: 'challenges completed' },
    'Whip It Good': { target: 100, unit: 'vehicles discovered' },
    'Maximum Withdrawal': { target: 5, unit: 'bank vaults escaped' },
    'Dime on the Dollar': { target: 250000, unit: 'dollars laundered' },
    'Treat Yo Self': { target: 100000, unit: 'dollars spent' },
    'On the Spot': { target: 10, unit: 'vehicles registered' }
  };

  var STAGE_TITLES = {
    1: 'Stage 1 — Story',
    2: 'Stage 2 — Strands, partner & missable window',
    3: 'Stage 3 — Activities, races & robberies',
    4: 'Stage 4 — Collectibles, exploration & money',
    5: 'Stage 5 — 100% + Platinum'
  };

  var STAGE_BLURBS = {
    1: 'Play the main story from Gone Fishing to the final mission. Keep the spoiler shield on if you want story names hidden until earned.',
    2: 'Finish every strand finale, partner trophy and choice-based trophy while they are available. Keep a backup save before big decisions.',
    3: 'Clear races, shooting range golds, stunts, challenges and robbery trophies. Use the counters to track long grinds.',
    4: 'Sweep collectibles, explore the whole map, discover vehicles and finish the money trophies.',
    5: 'Close out 100% completion, then collect the platinum once every other trophy is earned.'
  };

  var KINDS = [
    { id: 'all', label: 'All' },
    { id: 'story', label: 'Story' },
    { id: 'collectibles', label: 'Collectibles' },
    { id: 'activities', label: 'Activities' },
    { id: 'completion', label: 'Completion' },
    { id: 'platinum', label: 'Platinum' },
    { id: 'missable', label: 'Missable' }
  ];

  var trophies = [];
  var selectedName = null;
  var activeKind = 'all';

  var state = loadState();

  function defaultState() {
    return { earned: {}, counters: {}, spoiler: false };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      return {
        earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
        counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
        spoiler: !!parsed.spoiler
      };
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable; progress still works for this session
    }
  }

  function $(id) { return document.getElementById(id); }

  function isEarned(name) { return !!state.earned[name]; }

  function isShielded(t) {
    return state.spoiler && t.kind === 'story' && !isEarned(t.name);
  }

  function displayName(t) {
    return isShielded(t) ? 'Story trophy — hidden by spoiler shield' : t.name;
  }

  function displayDesc(t) {
    return isShielded(t) ? 'Earn this trophy or turn off the spoiler shield to reveal it.' : t.description;
  }

  function medalLetter(grade) {
    if (grade === 'platinum') return 'P';
    if (grade === 'gold') return 'G';
    if (grade === 'silver') return 'S';
    return 'B';
  }

  function fmt(n) {
    return Number(n).toLocaleString('en-US');
  }

  function renderProgress() {
    var earned = trophies.filter(function (t) { return isEarned(t.name); }).length;
    $('earnedCount').textContent = String(earned);
    var pct = trophies.length ? Math.round((earned / trophies.length) * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressBarWrap').setAttribute('aria-valuenow', String(earned));
    $('progressHint').textContent = earned === trophies.length && trophies.length
      ? 'All 55 earned — Leonida Legend. Nice work.'
      : 'Tick trophies as you earn them. Progress saves automatically on this device. (' + pct + '% complete)';

    var grades = ['platinum', 'gold', 'silver', 'bronze'];
    var html = '';
    grades.forEach(function (g) {
      var total = trophies.filter(function (t) { return t.grade === g; }).length;
      var got = trophies.filter(function (t) { return t.grade === g && isEarned(t.name); }).length;
      html += '<li><b>' + got + ' / ' + total + '</b>' + g + '</li>';
    });
    $('gradeCounts').innerHTML = html;
  }

  function renderKindChips() {
    var wrap = $('kindChips');
    wrap.innerHTML = '';
    KINDS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (activeKind === k.id ? ' is-active' : '');
      b.textContent = k.label;
      b.addEventListener('click', function () {
        activeKind = k.id;
        renderKindChips();
        renderList();
      });
      wrap.appendChild(b);
    });
  }

  function filteredTrophies() {
    var grade = $('gradeFilter').value;
    var status = $('statusFilter').value;
    var q = $('searchInput').value.trim().toLowerCase();
    return trophies.filter(function (t) {
      if (activeKind === 'missable') {
        if (!t.missable) return false;
      } else if (activeKind !== 'all' && t.kind !== activeKind) {
        return false;
      }
      if (grade !== 'all' && t.grade !== grade) return false;
      if (status === 'earned' && !isEarned(t.name)) return false;
      if (status === 'unearned' && isEarned(t.name)) return false;
      if (q) {
        var hay = (displayName(t) + ' ' + displayDesc(t) + ' ' + t.kind + ' ' + t.grade).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function trophyRow(t) {
    var li = document.createElement('li');
    li.className = 'trophy' + (isEarned(t.name) ? ' is-earned' : '') + (selectedName === t.name ? ' is-selected' : '');

    var medal = document.createElement('div');
    medal.className = 'medal medal-' + t.grade;
    medal.textContent = medalLetter(t.grade);
    medal.title = t.grade;
    li.appendChild(medal);

    var body = document.createElement('div');
    body.className = 'tbody';
    var name = document.createElement('div');
    name.className = 'tname';
    name.textContent = displayName(t);
    body.appendChild(name);
    var desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = displayDesc(t);
    body.appendChild(desc);
    var tags = document.createElement('div');
    tags.className = 'tags';
    tags.innerHTML =
      '<span class="tag">' + t.kind + '</span>' +
      '<span class="tag tag-stage">Stage ' + t.stage + '</span>' +
      '<span class="tag">' + t.grade + '</span>' +
      (t.missable ? '<span class="tag tag-missable">Missable</span>' : '');
    body.appendChild(tags);
    li.appendChild(body);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'earn-btn';
    btn.textContent = isEarned(t.name) ? 'Earned ✓' : 'Mark earned';
    btn.setAttribute('aria-pressed', isEarned(t.name) ? 'true' : 'false');
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      toggleEarned(t.name);
    });
    li.appendChild(btn);

    li.addEventListener('click', function () {
      selectedName = t.name;
      renderList();
      renderDetail();
    });
    return li;
  }

  function renderList() {
    var list = filteredTrophies();
    var el = $('trophyList');
    el.innerHTML = '';
    list.forEach(function (t) { el.appendChild(trophyRow(t)); });
    $('resultCount').textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies.';
    if (!list.length) {
      var li = document.createElement('li');
      li.className = 'trophy';
      li.textContent = 'No trophies match these filters. Try clearing the search or choosing All.';
      el.appendChild(li);
    }
  }

  function renderMissables() {
    var el = $('missableList');
    el.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      el.appendChild(trophyRow(t));
    });
  }

  function counterHtml(t) {
    var c = COUNTERS[t.name];
    if (!c) return '';
    var val = Number(state.counters[t.name] || 0);
    var pct = Math.min(100, Math.round((val / c.target) * 100));
    return '<div class="counter-box"><h4>Counter — ' + fmt(val) + ' / ' + fmt(c.target) + ' ' + c.unit + '</h4>' +
      '<div class="counter-row">' +
      '<button type="button" class="cbtn" data-counter="-1">−</button>' +
      '<input type="number" min="0" max="' + c.target + '" step="1" value="' + val + '" data-counter-input aria-label="Counter value">' +
      '<button type="button" class="cbtn" data-counter="1">+</button>' +
      '<button type="button" class="cbtn" data-counter="10">+10</button>' +
      (c.target >= 1000 ? '<button type="button" class="cbtn" data-counter="1000">+1,000</button>' : '') +
      '</div><div class="mini-bar"><div class="mini-fill" style="width:' + pct + '%"></div></div>' +
      '<p class="hint" style="margin-top:8px">Reaching the target does not auto-tick the trophy — mark it earned once it pops in-game.</p></div>';
  }

  function renderDetail() {
    var panel = $('detailPanel');
    var t = null;
    trophies.forEach(function (x) { if (x.name === selectedName) t = x; });
    if (!t) {
      panel.innerHTML = '<p class="detail-empty">Select a trophy to see its guide, counters and sources.</p>';
      return;
    }
    var shielded = isShielded(t);
    var guideHtml = shielded
      ? '<p class="shield-note">Spoiler shield is on — guide hidden for this unearned story trophy.</p>'
      : '<p class="guide">' + t.guide + '</p>';
    panel.innerHTML =
      '<h3>' + displayName(t) + '</h3>' +
      '<p class="ddesc">' + displayDesc(t) + '</p>' +
      '<div class="tags" style="margin-bottom:10px">' +
      '<span class="tag">' + t.kind + '</span><span class="tag tag-stage">Stage ' + t.stage + '</span>' +
      '<span class="tag">' + t.grade + '</span>' +
      (t.missable ? '<span class="tag tag-missable">Missable</span>' : '') + '</div>' +
      guideHtml +
      counterHtml(t) +
      '<button type="button" class="btn" id="detailToggle">' + (isEarned(t.name) ? 'Earned ✓ — tap to undo' : 'Mark as earned') + '</button>' +
      '<p class="sources" style="margin-top:14px">Sources: ' +
      t.sources.map(function (s) { return s; }).join(' · ') + '<br>' +
      '<a href="' + EXOPHASE_URL + '" target="_blank" rel="noopener">Exophase official list</a>' +
      '<a href="' + PSNPROFILES_URL + '" target="_blank" rel="noopener">PSNProfiles official list</a></p>';

    $('detailToggle').addEventListener('click', function () { toggleEarned(t.name); });

    var input = panel.querySelector('[data-counter-input]');
    if (input) {
      input.addEventListener('change', function () {
        setCounter(t.name, Number(input.value));
      });
    }
    var btns = panel.querySelectorAll('[data-counter]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var delta = Number(b.getAttribute('data-counter'));
        setCounter(t.name, Number(state.counters[t.name] || 0) + delta);
      });
    });
  }

  function setCounter(name, value) {
    var c = COUNTERS[name];
    var v = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
    if (c) v = Math.min(v, c.target);
    state.counters[name] = v;
    saveState();
    renderDetail();
  }

  function toggleEarned(name) {
    state.earned[name] = !state.earned[name];
    if (!state.earned[name]) delete state.earned[name];
    saveState();
    renderAll();
  }

  function renderRoadmap() {
    var wrap = $('roadmapStages');
    wrap.innerHTML = '';
    [1, 2, 3, 4, 5].forEach(function (stage) {
      var inStage = trophies.filter(function (t) { return t.stage === stage; });
      var got = inStage.filter(function (t) { return isEarned(t.name); }).length;
      var card = document.createElement('div');
      card.className = 'stage-card';
      var h = document.createElement('h3');
      h.textContent = STAGE_TITLES[stage];
      card.appendChild(h);
      var meta = document.createElement('p');
      meta.className = 'stage-meta';
      meta.textContent = got + ' / ' + inStage.length + ' earned in this stage. ' + STAGE_BLURBS[stage];
      card.appendChild(meta);
      var chips = document.createElement('div');
      chips.className = 'stage-chips';
      inStage.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'stage-chip' + (isEarned(t.name) ? ' is-earned' : '') + (t.missable ? ' is-missable' : '');
        b.textContent = displayName(t) + (t.missable ? ' ⚠' : '');
        b.addEventListener('click', function () {
          selectedName = t.name;
          switchView('checklist');
          renderAll();
          $('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        chips.appendChild(b);
      });
      card.appendChild(chips);
      wrap.appendChild(card);
    });
  }

  function renderExport() {
    $('exportText').value = JSON.stringify(state, null, 2);
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderMissables();
    renderRoadmap();
    renderDetail();
    renderExport();
  }

  function switchView(view) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-view') === view);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.classList.toggle('is-active', v.id === 'view-' + view);
    });
  }

  function loadDemo() {
    var demoEarned = [
      'Just Like Paradise', 'Paradise Lost', 'Trust', 'Break the Bank', 'Family Matters',
      'Master of None', 'Stick Fiddler', 'Gunslinger', 'Sneakthief', 'A Classic Blitz Play',
      'Capital Offense', 'Ten Pin', 'Catch Me If You Can'
    ];
    state = defaultState();
    demoEarned.forEach(function (n) { state.earned[n] = true; });
    state.counters = {
      'Cunning Stunts': 87,
      'Earn Cash, Not Kudos': 6,
      'One Last Thing': 18,
      'Whip It Good': 41,
      'Treat Yo Self': 32500,
      'Maximum Withdrawal': 2
    };
    selectedName = 'Cunning Stunts';
    saveState();
    renderAll();
  }

  function setSaveMsg(text, ok) {
    var el = $('saveMsg');
    el.textContent = text;
    el.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  function applyImport(text) {
    try {
      var parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad');
      state = {
        earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
        counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
        spoiler: !!parsed.spoiler
      };
      $('spoilerToggle').checked = state.spoiler;
      saveState();
      renderAll();
      setSaveMsg('Progress imported successfully.', true);
    } catch (e) {
      setSaveMsg('Import failed — that text is not valid exported progress JSON.', false);
    }
  }

  function wire() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.addEventListener('click', function () { switchView(tab.getAttribute('data-view')); });
    });

    $('spoilerToggle').checked = state.spoiler;
    $('spoilerToggle').addEventListener('change', function () {
      state.spoiler = $('spoilerToggle').checked;
      saveState();
      renderAll();
    });

    $('gradeFilter').addEventListener('change', renderList);
    $('statusFilter').addEventListener('change', renderList);
    $('searchInput').addEventListener('input', renderList);

    $('demoBtn').addEventListener('click', loadDemo);
    $('demoBtn2').addEventListener('click', loadDemo);

    $('exportBtn').addEventListener('click', function () {
      renderExport();
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'leonida-trophy-progress.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
    $('refreshExportBtn').addEventListener('click', renderExport);

    $('importBtn').addEventListener('click', function () {
      applyImport($('importText').value);
    });
    $('importFile').addEventListener('change', function () {
      var f = $('importFile').files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { applyImport(String(reader.result || '')); };
      reader.readAsText(f);
    });

    $('resetBtn').addEventListener('click', function () {
      state = defaultState();
      selectedName = null;
      $('spoilerToggle').checked = false;
      saveState();
      renderAll();
      setSaveMsg('All progress reset.', true);
    });
  }

  function init() {
    wire();
    renderKindChips();
    fetch('data/trophies.json')
      .then(function (r) {
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then(function (data) {
        trophies = data.trophies || [];
        renderAll();
      })
      .catch(function () {
        $('trophyList').innerHTML = '<li class="trophy">Could not load trophy data. Make sure data/trophies.json sits next to this page.</li>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
