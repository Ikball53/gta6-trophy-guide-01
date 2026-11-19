"use strict";

/* Leonida Trophy Tracker — offline checklist, roadmap and missables.
   Loads only data/trophies.json from this same app folder. */

var STORAGE_KEY = "leonida-trophy-progress-v1";
var SPOILER_KEY = "leonida-trophy-spoiler-v1";
var TOTAL_TROPHIES = 55;

var STAGE_INFO = {
  1: { title: "Stage 1 — Early story", why: "Opening missions and Chapter 1. Grab the Ocean Beach moment while it is fresh." },
  2: { title: "Stage 2 — Mid story", why: "Chapters 2 and 3 plus the named missions inside them. Do each named mission when it is offered." },
  3: { title: "Stage 3 — Late story and finale", why: "Chapter 4, the VCIA window, choice moments and the final mission. Save separately before the finale." },
  4: { title: "Stage 4 — Strangers and side strands", why: "Finish every stranger strand to its final mission. Eight full strands also clear Strangers & Freaks." },
  5: { title: "Stage 5 — Activities and collectibles", why: "Races, ranges, stunts, cards, WAiNK spots, vehicles and robberies in free roam." },
  6: { title: "Stage 6 — 100% mop-up", why: "Challenges, vaults, full exploration, money totals, garages and the 100% completion trophy." },
  7: { title: "Stage 7 — Platinum", why: "Vice Got a Price! arrives when the other 54 are earned. Nothing left to do but collect it." }
};

var state = {
  trophies: [],
  earned: {},
  selectedName: "",
  kindFilter: "all",
  gradeFilter: "all",
  searchText: "",
  spoilerOn: false,
  view: "checklist"
};

function byId(id) { return document.getElementById(id); }

function queryParams() {
  var out = {};
  var raw = window.location.search.replace(/^\?/, "");
  if (!raw) return out;
  raw.split("&").forEach(function (pair) {
    var parts = pair.split("=");
    out[decodeURIComponent(parts[0] || "")] = decodeURIComponent(parts.slice(1).join("=") || "");
  });
  return out;
}

function loadEarned() {
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    var parsed = JSON.parse(raw);
    var names = Array.isArray(parsed) ? parsed : parsed.earned;
    var map = {};
    if (Array.isArray(names)) names.forEach(function (n) { map[n] = true; });
    return map;
  } catch (err) {
    return {};
  }
}

function saveEarned() {
  try {
    var names = Object.keys(state.earned).filter(function (n) { return state.earned[n]; }).sort();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ app: "leonida-trophy-tracker", version: 1, earned: names }));
    byId("saveNote").textContent = "Progress saves in this browser (local storage). Last saved just now.";
  } catch (err) {
    byId("saveNote").textContent = "This browser refused local saving. Export your progress to keep a copy.";
  }
}

function loadSpoiler() {
  try { return window.localStorage.getItem(SPOILER_KEY) === "1"; } catch (err) { return false; }
}

function saveSpoiler() {
  try { window.localStorage.setItem(SPOILER_KEY, state.spoilerOn ? "1" : "0"); } catch (err) { /* spoiler still works for this visit */ }
}

function isEarned(trophy) { return state.earned[trophy.name] === true; }

function isHiddenBySpoiler(trophy) {
  return state.spoilerOn && trophy.kind === "story" && !isEarned(trophy);
}

function displayName(trophy) {
  return isHiddenBySpoiler(trophy) ? "Hidden story trophy" : trophy.name;
}

function displayDesc(trophy) {
  return isHiddenBySpoiler(trophy) ? "Earn it to reveal its name and description." : trophy.description;
}

function gradeLabel(grade) {
  if (grade === "platinum") return "Platinum";
  if (grade === "gold") return "Gold";
  if (grade === "silver") return "Silver";
  return "Bronze";
}

function kindLabel(kind) {
  if (kind === "story") return "Story";
  if (kind === "missable") return "Missable";
  if (kind === "collectibles") return "Collectibles";
  return "Activities";
}

function earnedCount() {
  return state.trophies.filter(isEarned).length;
}

function makeBadge(text, extraClass) {
  var span = document.createElement("span");
  span.className = "badge" + (extraClass ? " " + extraClass : "");
  span.textContent = text;
  return span;
}

function matchesFilters(trophy) {
  if (state.kindFilter !== "all" && trophy.kind !== state.kindFilter) return false;
  if (state.gradeFilter !== "all" && trophy.grade !== state.gradeFilter) return false;
  if (state.searchText) {
    var hay = (trophy.name + " " + trophy.description + " " + trophy.guide + " " + trophy.kind + " " + trophy.grade).toLowerCase();
    if (hay.indexOf(state.searchText.toLowerCase()) === -1) return false;
  }
  return true;
}

function renderProgress() {
  var count = earnedCount();
  var pct = Math.round((count / TOTAL_TROPHIES) * 100);
  byId("earnedCount").textContent = String(count);
  byId("earnedPct").textContent = String(pct);
  byId("progressFill").style.width = pct + "%";
  byId("progressBarWrap").setAttribute("aria-valuenow", String(pct));
  var missTotal = state.trophies.filter(function (t) { return t.missable; }).length;
  var missDone = state.trophies.filter(function (t) { return t.missable && isEarned(t); }).length;
  byId("missableNavCount").textContent = "(" + missDone + "/" + missTotal + ")";
}

function renderFilterNote(shown) {
  var bits = ["Showing " + shown + " of " + TOTAL_TROPHIES + " trophies"];
  if (state.kindFilter !== "all") bits.push("kind: " + kindLabel(state.kindFilter));
  if (state.gradeFilter !== "all") bits.push("grade: " + gradeLabel(state.gradeFilter));
  if (state.searchText) bits.push("search: \"" + state.searchText + "\"");
  if (state.spoilerOn) bits.push("spoiler shield on");
  byId("filterNote").textContent = bits.join(" · ") + ".";
}

function trophyRow(trophy, compact) {
  var row = document.createElement("button");
  row.type = "button";
  row.className = (compact ? "stage-row" : "trophy-row") + (isEarned(trophy) ? " is-earned" : "") + (state.selectedName === trophy.name ? " is-selected" : "");

  var check = document.createElement("input");
  check.type = "checkbox";
  check.className = "trophy-check";
  check.checked = isEarned(trophy);
  check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
  check.addEventListener("click", function (event) {
    event.stopPropagation();
    setEarned(trophy.name, check.checked);
  });

  var main = document.createElement("span");
  main.className = "trophy-main";
  var nameEl = document.createElement("span");
  nameEl.className = compact ? "row-name" : "trophy-name";
  nameEl.textContent = displayName(trophy);
  var descEl = document.createElement("span");
  descEl.className = compact ? "row-desc" : "trophy-desc";
  descEl.textContent = displayDesc(trophy);
  main.appendChild(nameEl);
  main.appendChild(document.createElement("br"));
  main.appendChild(descEl);

  if (!compact) {
    var meta = document.createElement("span");
    meta.className = "trophy-meta";
    meta.appendChild(makeBadge(gradeLabel(trophy.grade), "badge-grade-" + trophy.grade));
    meta.appendChild(makeBadge(kindLabel(trophy.kind), "badge-kind"));
    if (trophy.missable) meta.appendChild(makeBadge("Missable", "badge-missable"));
    meta.appendChild(makeBadge("Stage " + trophy.stage, "badge-stage"));
    main.appendChild(meta);
  } else {
    var meta2 = document.createElement("span");
    meta2.className = "trophy-meta";
    meta2.appendChild(makeBadge(gradeLabel(trophy.grade), "badge-grade-" + trophy.grade));
    if (trophy.missable) meta2.appendChild(makeBadge("Missable", "badge-missable"));
    main.appendChild(meta2);
  }

  row.appendChild(check);
  row.appendChild(main);
  row.addEventListener("click", function () { selectTrophy(trophy.name, true); });
  return row;
}

function renderChecklist() {
  var list = byId("trophyList");
  list.innerHTML = "";
  var shown = state.trophies.filter(matchesFilters);
  shown.forEach(function (trophy) {
    var li = document.createElement("li");
    li.appendChild(trophyRow(trophy, false));
    list.appendChild(li);
  });
  byId("emptyList").hidden = shown.length !== 0;
  renderFilterNote(shown.length);
}

function renderDetail() {
  var body = byId("detailBody");
  var trophy = null;
  state.trophies.forEach(function (t) { if (t.name === state.selectedName) trophy = t; });
  if (!trophy) {
    body.innerHTML = "";
    var p = document.createElement("p");
    p.className = "detail-placeholder";
    p.textContent = "Pick any trophy on the left to read its guide here — what to do, how to approach it, and when it can be missed, with sources named for every trophy.";
    body.appendChild(p);
    return;
  }

  body.innerHTML = "";
  var badges = document.createElement("div");
  badges.className = "trophy-meta";
  badges.appendChild(makeBadge(gradeLabel(trophy.grade), "badge-grade-" + trophy.grade));
  badges.appendChild(makeBadge(kindLabel(trophy.kind), "badge-kind"));
  badges.appendChild(makeBadge("Stage " + trophy.stage, "badge-stage"));
  if (trophy.missable) badges.appendChild(makeBadge("Missable", "badge-missable"));
  body.appendChild(badges);

  var title = document.createElement("h3");
  title.className = "detail-name";
  title.textContent = displayName(trophy);
  body.appendChild(title);

  var desc = document.createElement("p");
  desc.className = "detail-desc";
  desc.textContent = "Official description: " + displayDesc(trophy);
  body.appendChild(desc);

  if (isHiddenBySpoiler(trophy)) {
    var hiddenNote = document.createElement("p");
    hiddenNote.className = "detail-guide";
    hiddenNote.textContent = "The spoiler shield is hiding this story trophy's guide until you earn it. Tick it as earned, or turn the shield off in the controls above, to read the full guide.";
    body.appendChild(hiddenNote);
  } else {
    var guide = document.createElement("p");
    guide.className = "detail-guide";
    guide.textContent = trophy.guide;
    body.appendChild(guide);
  }

  if (trophy.missable && trophy.missableReason) {
    var flag = document.createElement("div");
    flag.className = "detail-flag";
    var strong = document.createElement("strong");
    strong.textContent = "Missable — ";
    flag.appendChild(strong);
    flag.appendChild(document.createTextNode(trophy.missableReason + " Keep a separate save from before it, and do it when it is offered."));
    body.appendChild(flag);
  }

  var sources = document.createElement("p");
  sources.className = "detail-sources";
  sources.textContent = "Sources for this trophy: official name, description and grade as listed by Exophase and PSNProfiles (full links in the footer). The guide above is original advice derived from the official description and is not yet checked in the game; no specific location is claimed without a cited source.";
  body.appendChild(sources);

  var label = document.createElement("label");
  label.className = "detail-earned";
  var box = document.createElement("input");
  box.type = "checkbox";
  box.checked = isEarned(trophy);
  box.addEventListener("change", function () { setEarned(trophy.name, box.checked); });
  label.appendChild(box);
  label.appendChild(document.createTextNode(isEarned(trophy) ? "Earned — nice work." : "Mark as earned"));
  body.appendChild(label);
}

function renderRoadmap() {
  var wrap = byId("roadmapBody");
  wrap.innerHTML = "";
  [1, 2, 3, 4, 5, 6, 7].forEach(function (stage) {
    var inStage = state.trophies.filter(function (t) { return t.stage === stage; });
    var done = inStage.filter(isEarned).length;
    var block = document.createElement("div");
    block.className = "stage-block";
    var head = document.createElement("div");
    head.className = "stage-head";
    var title = document.createElement("h3");
    title.className = "stage-title";
    title.textContent = STAGE_INFO[stage].title;
    var prog = document.createElement("span");
    prog.className = "stage-progress";
    prog.textContent = done + " / " + inStage.length + " done";
    head.appendChild(title);
    head.appendChild(prog);
    block.appendChild(head);
    var why = document.createElement("p");
    why.className = "stage-why";
    why.textContent = STAGE_INFO[stage].why;
    block.appendChild(why);
    var ul = document.createElement("ul");
    ul.className = "stage-list";
    inStage.forEach(function (trophy) {
      var li = document.createElement("li");
      li.appendChild(trophyRow(trophy, true));
      ul.appendChild(li);
    });
    block.appendChild(ul);
    wrap.appendChild(block);
  });
}

function renderMissables() {
  var wrap = byId("missablesBody");
  wrap.innerHTML = "";
  var flagged = state.trophies.filter(function (t) { return t.missable; });
  flagged.sort(function (a, b) { return (a.stage - b.stage) || a.name.localeCompare(b.name); });
  var ul = document.createElement("ul");
  ul.className = "stage-list";
  flagged.forEach(function (trophy) {
    var li = document.createElement("li");
    var row = document.createElement("button");
    row.type = "button";
    row.className = "miss-row" + (isEarned(trophy) ? " is-earned" : "");
    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = isEarned(trophy);
    check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
    check.addEventListener("click", function (event) {
      event.stopPropagation();
      setEarned(trophy.name, check.checked);
    });
    var main = document.createElement("span");
    main.className = "trophy-main";
    var nameEl = document.createElement("span");
    nameEl.className = "row-name";
    nameEl.textContent = trophy.name + " · Stage " + trophy.stage + " · " + gradeLabel(trophy.grade);
    var descEl = document.createElement("span");
    descEl.className = "row-desc";
    descEl.textContent = trophy.description;
    var reasonEl = document.createElement("span");
    reasonEl.className = "row-reason";
    reasonEl.textContent = "Why flagged: " + trophy.missableReason;
    main.appendChild(nameEl);
    main.appendChild(document.createElement("br"));
    main.appendChild(descEl);
    main.appendChild(reasonEl);
    row.appendChild(check);
    row.appendChild(main);
    row.addEventListener("click", function () { selectTrophy(trophy.name, true); });
    li.appendChild(row);
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function setEarned(name, value) {
  if (value) state.earned[name] = true; else delete state.earned[name];
  saveEarned();
  renderAll();
}

function selectTrophy(name, goToChecklist) {
  state.selectedName = name;
  if (goToChecklist && state.view !== "checklist") {
    window.location.hash = "#/checklist";
  }
  renderAll();
}

function applyViewFromHash() {
  var hash = window.location.hash || "#/checklist";
  var view = "checklist";
  if (hash.indexOf("roadmap") !== -1) view = "roadmap";
  else if (hash.indexOf("missables") !== -1) view = "missables";
  state.view = view;
  byId("view-checklist").hidden = view !== "checklist";
  byId("view-roadmap").hidden = view !== "roadmap";
  byId("view-missables").hidden = view !== "missables";
  var links = document.querySelectorAll("[data-view-link]");
  links.forEach(function (link) {
    link.classList.toggle("is-active", link.getAttribute("data-view-link") === view);
  });
}

function exportProgress() {
  var names = Object.keys(state.earned).filter(function (n) { return state.earned[n]; }).sort();
  var payload = { app: "leonida-trophy-tracker", version: 1, earned: names, earnedCount: names.length };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "leonida-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  byId("saveNote").textContent = "Exported " + names.length + " earned trophies to leonida-trophy-progress.json.";
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(String(reader.result || ""));
      var names = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(names)) throw new Error("No earned list found.");
      var known = {};
      state.trophies.forEach(function (t) { known[t.name] = true; });
      var next = {};
      var kept = 0;
      names.forEach(function (n) { if (known[n]) { next[n] = true; kept += 1; } });
      state.earned = next;
      saveEarned();
      renderAll();
      byId("saveNote").textContent = "Imported " + kept + " earned trophies. Unknown names were ignored.";
    } catch (err) {
      byId("saveNote").textContent = "That file could not be imported. Pick a progress file exported from this tracker.";
    }
  };
  reader.readAsText(file);
}

function seedDemoProgress() {
  var demoNames = [
    "Just Like Paradise", "Paradise Lost", "In The Beginning…",
    "T**s Ass Drug Money", "Vice City, Baby!", "Trust", "Break the Bank", "Family Matters", "DWNFALL",
    "Top Of The World, Ma", "Hi-Jacked",
    "Baited My Tackle", "Road to Rehabilitation", "Fair Game",
    "Master of None", "Stick Fiddler", "Gunslinger", "Ten Pin"
  ];
  demoNames.forEach(function (n) { state.earned[n] = true; });
}

function bindControls() {
  byId("searchInput").addEventListener("input", function (event) {
    state.searchText = event.target.value.trim();
    renderChecklist();
  });
  byId("gradeFilter").addEventListener("change", function (event) {
    state.gradeFilter = event.target.value;
    renderChecklist();
  });
  byId("spoilerToggle").addEventListener("change", function (event) {
    state.spoilerOn = event.target.checked;
    saveSpoiler();
    renderAll();
  });
  document.querySelectorAll("[data-kind]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.kindFilter = btn.getAttribute("data-kind");
      document.querySelectorAll("[data-kind]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderChecklist();
    });
  });
  byId("exportBtn").addEventListener("click", exportProgress);
  byId("importFile").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  byId("resetBtn").addEventListener("click", function () {
    state.earned = {};
    saveEarned();
    renderAll();
    byId("saveNote").textContent = "Progress reset. All 55 trophies are unticked again.";
  });
  window.addEventListener("hashchange", applyViewFromHash);
}

function start() {
  var params = queryParams();
  state.earned = loadEarned();
  state.spoilerOn = loadSpoiler();
  if (params.spoiler === "1") state.spoilerOn = true;
  if (params.spoiler === "0") state.spoilerOn = false;
  if (params.demo === "1") seedDemoProgress();
  byId("spoilerToggle").checked = state.spoilerOn;
  bindControls();
  applyViewFromHash();

  fetch("data/trophies.json")
    .then(function (res) {
      if (!res.ok) throw new Error("trophy data failed to load");
      return res.json();
    })
    .then(function (data) {
      state.trophies = Array.isArray(data) ? data : data.trophies;
      if (params.select) {
        var wanted = params.select;
        state.trophies.forEach(function (t) { if (t.name === wanted) state.selectedName = t.name; });
      }
      if (!state.selectedName && params.demo === "1") state.selectedName = "Break the Bank";
      renderAll();
    })
    .catch(function () {
      byId("filterNote").textContent = "Trophy data could not be loaded. Serve this app folder over HTTP (for example: python3 -m http.server) and reload.";
    });
}

document.addEventListener("DOMContentLoaded", start);
