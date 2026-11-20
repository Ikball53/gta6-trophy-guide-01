"use strict";
/* Leonida Ledger — offline GTA VI trophy guide & tracker.
   Loads only data/trophies.json from this same folder; progress lives in
   localStorage. No network requests leave the device. */

var STORE_KEY = "leonida-ledger-v1";

var STAGE_INFO = {
  1: {
    title: "Stage 1 — Opening chapters",
    why: "Play Chapter 1 and the first named missions. Watch for the Ocean Beach cocktail moment (In The Beginning…) while the story still has you there, and sample every activity type once as the map opens."
  },
  2: {
    title: "Stage 2 — Mid-story & first sweeps",
    why: "Chapters 2–3 and the early stranger strands. Start the collectible sweeps (meditation spots, WAiNK locations, new vehicles) and bank the easy free-roam feats like Gunslinger and Ten Pin between missions."
  },
  3: {
    title: "Stage 3 — Late story, strands & missables",
    why: "Chapter 4, the named heist and operation missions, and every stranger strand. This is where the missable story moments cluster — keep a manual save before each late mission and finish the partner free-roam trophies before the finale."
  },
  4: {
    title: "Stage 4 — Free-roam cleanup",
    why: "After the final mission: the long counts — 250 stunts, 42 shooting-range golds, 50 challenges, 100 WAiNK locations, 5 bank vaults, $250,000 laundered — plus exploration, races and drone races."
  },
  5: {
    title: "Stage 5 — 100% & the platinum",
    why: "Mop up whatever the completion tracker still counts toward A Long Road (100%). When the other 54 trophies are earned, Vice Got a Price! — the platinum — unlocks on its own."
  }
};

var state = {
  trophies: [],
  earned: {},
  counters: {},
  spoiler: false,
  kind: "all",
  search: "",
  sort: "official",
  selectedId: null,
  view: "checklist"
};

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (saved && typeof saved === "object") {
      state.earned = saved.earned || {};
      state.counters = saved.counters || {};
      state.spoiler = !!saved.spoiler;
    }
  } catch (err) {
    state.earned = {};
    state.counters = {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: state.earned,
      counters: state.counters,
      spoiler: state.spoiler
    }));
  } catch (err) { /* storage unavailable: progress simply will not persist */ }
}

function isEarned(t) { return !!state.earned[t.id]; }

function isMasked(t) {
  return state.spoiler && t.kind === "story" && !isEarned(t);
}

function displayName(t) {
  return isMasked(t) ? "Hidden story trophy" : t.name;
}

function displayDesc(t) {
  return isMasked(t) ? "Hidden by the spoiler shield until earned." : t.description;
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function medalHtml(t) {
  return '<span class="medal medal-' + t.grade + '">' + t.grade.toUpperCase() + "</span>";
}

function metaHtml(t) {
  var html = medalHtml(t);
  html += '<span class="kind-tag">' + esc(t.kind) + "</span>";
  html += '<span class="stage-tag">Stage ' + t.stage + "</span>";
  if (t.missable) html += '<span class="missable-flag">MISSABLE</span>';
  if (t.count) {
    var have = state.counters[t.id] || 0;
    html += '<span class="stage-tag">' + have + " / " + t.count + "</span>";
  }
  return html;
}

function filteredTrophies() {
  var list = state.trophies.slice();
  if (state.kind === "missable") {
    list = list.filter(function (t) { return t.missable; });
  } else if (state.kind !== "all") {
    list = list.filter(function (t) { return t.kind === state.kind; });
  }
  if (state.search) {
    var q = state.search.toLowerCase();
    list = list.filter(function (t) {
      return displayName(t).toLowerCase().indexOf(q) !== -1 ||
        displayDesc(t).toLowerCase().indexOf(q) !== -1;
    });
  }
  var gradeRank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  if (state.sort === "grade") {
    list.sort(function (a, b) { return gradeRank[a.grade] - gradeRank[b.grade] || a.id - b.id; });
  } else if (state.sort === "stage") {
    list.sort(function (a, b) { return a.stage - b.stage || a.id - b.id; });
  } else if (state.sort === "name") {
    list.sort(function (a, b) { return displayName(a).localeCompare(displayName(b)); });
  } else {
    list.sort(function (a, b) { return a.id - b.id; });
  }
  return list;
}

function renderScoreboard() {
  var earned = state.trophies.filter(isEarned).length;
  document.getElementById("earned-count").textContent = earned;
  document.getElementById("progress-fill").style.width = (earned / 55 * 100) + "%";
  var byGrade = { platinum: [0, 1], gold: [0, 2], silver: [0, 6], bronze: [0, 46] };
  state.trophies.forEach(function (t) {
    if (isEarned(t)) byGrade[t.grade][0]++;
  });
  document.getElementById("grade-line").textContent =
    "Platinum " + byGrade.platinum[0] + "/1 · Gold " + byGrade.gold[0] + "/2 · Silver " +
    byGrade.silver[0] + "/6 · Bronze " + byGrade.bronze[0] + "/46";
  var missableLeft = state.trophies.filter(function (t) { return t.missable && !isEarned(t); }).length;
  document.getElementById("missable-badge").textContent = missableLeft;
}

function renderList() {
  var list = filteredTrophies();
  var ul = document.getElementById("trophy-list");
  var note = document.getElementById("list-note");
  if (state.kind === "online") {
    note.textContent = "The official PlayStation 5 list of 55 trophies contains no online trophies — every trophy in this guide is earned in the single-player game. This filter is kept so the full set of kinds stays visible.";
  } else {
    note.textContent = "Showing " + list.length + " of 55 trophies. Tick a box to mark it earned; click a row for its guide and sources.";
  }
  ul.innerHTML = list.map(function (t) {
    var cls = "trophy-row" + (isEarned(t) ? " is-earned" : "") + (state.selectedId === t.id ? " is-selected" : "");
    return '<li class="' + cls + '" data-id="' + t.id + '">' +
      '<input type="checkbox" class="trophy-check" data-check="' + t.id + '"' + (isEarned(t) ? " checked" : "") + ' aria-label="Mark earned">' +
      '<div class="trophy-main">' +
      '<div class="trophy-name' + (isMasked(t) ? " masked" : "") + '">' + esc(displayName(t)) + "</div>" +
      '<div class="trophy-desc">' + esc(displayDesc(t)) + "</div>" +
      '<div class="trophy-meta">' + metaHtml(t) + "</div>" +
      "</div></li>";
  }).join("");
}

function renderDetail() {
  var pane = document.getElementById("detail-pane");
  var t = null;
  state.trophies.forEach(function (x) { if (x.id === state.selectedId) t = x; });
  if (!t) {
    pane.innerHTML = '<p class="masked">Pick a trophy from the list to read its guide and sources here.</p>';
    return;
  }
  if (isMasked(t)) {
    pane.innerHTML = "<h3 class=\"masked\">Hidden story trophy</h3>" +
      '<p class="detail-desc">The spoiler shield is hiding this story trophy\u2019s name, description and guide until you earn it.</p>' +
      '<div class="trophy-meta">' + metaHtml(t) + "</div>" +
      '<p style="margin-top:12px"><button type="button" class="earned-btn" data-toggle="' + t.id + '">I earned this — reveal it</button></p>';
    return;
  }
  var html = "<h3>" + esc(t.name) + "</h3>";
  html += '<p class="detail-desc">\u201C' + esc(t.description) + '\u201D — official PlayStation description</p>';
  html += '<div class="trophy-meta">' + metaHtml(t) + "</div>";
  if (t.missable) {
    html += '<div class="missable-banner" style="margin-top:12px"><strong>Missable.</strong> This trophy is tied to a one-time story moment. Keep a manual save before the relevant missions; if the moment passes, reload and replay that stretch.</div>';
  }
  html += '<p class="detail-guide">' + esc(t.guide) + "</p>";
  if (t.count) {
    html += '<div class="counter-row"><label>Your progress toward ' + t.count + ':</label>' +
      '<input type="number" min="0" max="' + t.count + '" value="' + (state.counters[t.id] || 0) + '" data-counter="' + t.id + '">' +
      "<span>of " + t.count + "</span></div>";
  }
  html += '<button type="button" class="earned-btn' + (isEarned(t) ? " is-earned" : "") + '" data-toggle="' + t.id + '">' +
    (isEarned(t) ? "Earned ✓ — tap to undo" : "Mark as earned") + "</button>";
  html += '<div class="sources-box"><strong>Sources for this guide</strong><ul>' +
    t.sources.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + "</a></li>";
    }).join("") +
    "</ul><p>Guide written in our own words for this entry; sources are cited, never copied. Links open only when you follow them — this app fetches nothing.</p></div>";
  pane.innerHTML = html;
}

function renderRoadmap() {
  var host = document.getElementById("roadmap-stages");
  host.innerHTML = [1, 2, 3, 4, 5].map(function (stage) {
    var items = state.trophies.filter(function (t) { return t.stage === stage; });
    var done = items.filter(isEarned).length;
    var info = STAGE_INFO[stage];
    return '<div class="stage-block"><div class="stage-head"><h3>' + esc(info.title) + '</h3>' +
      '<span class="stage-count">' + done + " / " + items.length + " earned</span></div>" +
      '<p class="stage-why">' + esc(info.why) + "</p>" +
      '<div class="stage-items">' + items.map(function (t) {
        return '<div class="stage-item" data-goto="' + t.id + '">' +
          '<input type="checkbox" class="trophy-check" data-check="' + t.id + '"' + (isEarned(t) ? " checked" : "") + '>' +
          "<div><strong>" + esc(displayName(t)) + "</strong> " + medalHtml(t) +
          (t.missable ? ' <span class="missable-flag">MISSABLE</span>' : "") +
          '<div class="trophy-desc">' + esc(displayDesc(t)) + "</div></div></div>";
      }).join("") + "</div></div>";
  }).join("");
}

function renderMissables() {
  var host = document.getElementById("missable-list");
  var items = state.trophies.filter(function (t) { return t.missable; });
  host.innerHTML = items.map(function (t) {
    return '<div class="missable-card"><h3>' + esc(displayName(t)) + " " + medalHtml(t) +
      ' <span class="missable-flag">MISSABLE</span></h3>' +
      '<p class="detail-desc">\u201C' + esc(displayDesc(t)) + '\u201D</p>' +
      "<p>" + esc(isMasked(t) ? "Guide hidden by the spoiler shield until earned." : t.guide) + "</p>" +
      '<div class="sources-box"><strong>Sources</strong><ul>' +
      t.sources.map(function (s) {
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + "</a></li>";
      }).join("") + "</ul></div>" +
      '<p style="margin-top:10px"><button type="button" class="earned-btn' + (isEarned(t) ? " is-earned" : "") + '" data-toggle="' + t.id + '">' +
      (isEarned(t) ? "Earned ✓ — tap to undo" : "Mark as earned") + "</button></p></div>";
  }).join("");
}

function renderAll() {
  renderScoreboard();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.classList.toggle("is-active", tab.getAttribute("data-view") === view);
  });
  document.querySelectorAll(".view").forEach(function (sec) {
    sec.classList.toggle("is-active", sec.id === "view-" + view);
  });
}

function toggleEarned(id) {
  if (state.earned[id]) { delete state.earned[id]; } else { state.earned[id] = true; }
  saveProgress();
  renderAll();
}

function exportProgress() {
  var payload = JSON.stringify({
    app: "leonida-ledger",
    version: 1,
    earned: state.earned,
    counters: state.counters,
    spoiler: state.spoiler
  }, null, 2);
  var blob = new Blob([payload], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "leonida-ledger-progress.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  document.getElementById("save-status").textContent = "Progress exported.";
}

function importProgress(file) {
  var status = document.getElementById("save-status");
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || !data.earned) throw new Error("bad file");
      state.earned = data.earned || {};
      state.counters = data.counters || {};
      state.spoiler = !!data.spoiler;
      saveProgress();
      syncSpoilerToggles();
      renderAll();
      status.textContent = "Progress imported.";
    } catch (err) {
      status.textContent = "That file is not a Leonida Ledger progress file.";
    }
  };
  reader.readAsText(file);
}

function syncSpoilerToggles() {
  document.getElementById("spoiler-toggle").checked = state.spoiler;
  document.getElementById("spoiler-toggle-2").checked = state.spoiler;
}

function bindEvents() {
  document.getElementById("tabs").addEventListener("click", function (ev) {
    var tab = ev.target.closest(".tab");
    if (tab) setView(tab.getAttribute("data-view"));
  });
  document.getElementById("kind-filters").addEventListener("click", function (ev) {
    var chip = ev.target.closest(".chip");
    if (!chip) return;
    state.kind = chip.getAttribute("data-kind");
    document.querySelectorAll("#kind-filters .chip").forEach(function (c) {
      c.classList.toggle("is-active", c === chip);
    });
    renderList();
  });
  document.getElementById("search").addEventListener("input", function (ev) {
    state.search = ev.target.value.trim();
    renderList();
  });
  document.getElementById("sort-select").addEventListener("change", function (ev) {
    state.sort = ev.target.value;
    renderList();
  });
  ["spoiler-toggle", "spoiler-toggle-2"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", function (ev) {
      state.spoiler = ev.target.checked;
      saveProgress();
      syncSpoilerToggles();
      renderAll();
    });
  });
  document.addEventListener("click", function (ev) {
    var check = ev.target.closest("[data-check]");
    if (check) {
      ev.stopPropagation();
      toggleEarned(Number(check.getAttribute("data-check")));
      return;
    }
    var toggle = ev.target.closest("[data-toggle]");
    if (toggle) {
      toggleEarned(Number(toggle.getAttribute("data-toggle")));
      return;
    }
    var row = ev.target.closest(".trophy-row");
    if (row) {
      state.selectedId = Number(row.getAttribute("data-id"));
      renderList();
      renderDetail();
      return;
    }
    var goto = ev.target.closest("[data-goto]");
    if (goto) {
      state.selectedId = Number(goto.getAttribute("data-goto"));
      setView("checklist");
      renderList();
      renderDetail();
    }
  });
  document.addEventListener("change", function (ev) {
    var counter = ev.target.closest("[data-counter]");
    if (!counter) return;
    var id = Number(counter.getAttribute("data-counter"));
    var value = Math.max(0, Number(counter.value) || 0);
    state.counters[id] = value;
    saveProgress();
    renderScoreboard();
    renderList();
  });
  document.getElementById("export-btn").addEventListener("click", exportProgress);
  document.getElementById("import-input").addEventListener("change", function (ev) {
    if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
  });
  document.getElementById("reset-btn").addEventListener("click", function () {
    state.earned = {};
    state.counters = {};
    saveProgress();
    renderAll();
    document.getElementById("save-status").textContent = "Progress cleared.";
  });
}

function applyHash() {
  var hash = window.location.hash || "";
  if (hash.indexOf("#roadmap") === 0) setView("roadmap");
  else if (hash.indexOf("#missables") === 0) setView("missables");
  else if (hash.indexOf("#save") === 0) setView("save");
  else if (hash.indexOf("#trophy-") === 0) {
    var id = Number(hash.slice(8));
    if (id) { state.selectedId = id; setView("checklist"); }
  }
}

function boot() {
  loadProgress();
  bindEvents();
  syncSpoilerToggles();
  fetch("data/trophies.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      state.trophies = data.trophies || data;
      if (!state.selectedId && state.trophies.length) state.selectedId = 17;
      applyHash();
      renderAll();
    })
    .catch(function () {
      document.getElementById("trophy-list").innerHTML =
        '<li class="empty-note">Could not load data/trophies.json. Serve this folder with a static file server (opening index.html as a file blocks the data load in some browsers).</li>';
    });
}

document.addEventListener("DOMContentLoaded", boot);
