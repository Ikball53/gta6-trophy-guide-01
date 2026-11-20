"use strict";

// Leonida Trophy Companion — offline tracker logic.
// Loads app/data/trophies.json (same-origin file only), renders the checklist,
// saves progress in localStorage, supports export/import, kind + grade filters,
// search, spoiler-safe mode, and a staged roadmap view. No network requests
// beyond the local data file; source links in guides are plain anchors that
// only open when the reader follows them.

const STORAGE_KEY = "leonida-trophy-companion-progress-v1";
const PREFS_KEY = "leonida-trophy-companion-prefs-v1";

const state = {
  trophies: [],
  earned: new Set(),
  view: "checklist",
  kind: "all",
  grade: "all",
  query: "",
  spoiler: false,
  hideDone: false,
  selectedId: null,
};

const els = {};

function grab(id) {
  return document.getElementById(id);
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (typeof prefs.spoiler === "boolean") state.spoiler = prefs.spoiler;
    if (typeof prefs.hideDone === "boolean") state.hideDone = prefs.hideDone;
  } catch (err) {
    // Corrupt prefs fall back to defaults; progress is stored separately.
  }
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ spoiler: state.spoiler, hideDone: state.hideDone }));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (Array.isArray(ids)) {
      state.earned = new Set(ids.filter((n) => Number.isInteger(n)));
    }
  } catch (err) {
    state.earned = new Set();
  }
}

function saveProgress() {
  const payload = { earned: [...state.earned].sort((a, b) => a - b) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function setStatus(text) {
  els.statusLine.textContent = text;
}

function isSpoilerHidden(trophy) {
  return state.spoiler && trophy.kind === "story" && !state.earned.has(trophy.id);
}

function displayName(trophy) {
  return isSpoilerHidden(trophy) ? "Hidden story trophy" : trophy.name;
}

function displayDesc(trophy) {
  if (isSpoilerHidden(trophy)) {
    return "Story details hidden by spoiler-safe mode — earn it (or turn the mode off) to reveal.";
  }
  return trophy.description;
}

function matchesFilters(trophy) {
  if (state.kind === "missable") {
    if (!trophy.missable) return false;
  } else if (state.kind !== "all" && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.hideDone && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = [trophy.name, trophy.description, trophy.guide, trophy.kind, trophy.grade]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function kindLabel(kind) {
  const labels = {
    story: "Story",
    missable: "Missable",
    collectibles: "Collectibles",
    activities: "Activities",
    online: "Online",
  };
  return labels[kind] || kind;
}

function badgeHtml(trophy) {
  const parts = [];
  parts.push(`<span class="badge grade-${trophy.grade}">${trophy.grade}</span>`);
  parts.push(`<span class="badge kind">${kindLabel(trophy.kind)}</span>`);
  if (trophy.missable) parts.push(`<span class="badge missable">Missable</span>`);
  if (trophy.hidden) parts.push(`<span class="badge hidden-flag">Hidden</span>`);
  if (trophy.count !== null && trophy.count !== undefined) {
    parts.push(`<span class="badge count">× ${trophy.count}</span>`);
  }
  return parts.join("");
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  els.progressCount.textContent = `${done} / ${total}`;
  els.progressPct.textContent = `${pct}%`;
  const degrees = Math.round((done / Math.max(total, 1)) * 360);
  els.progressRing.style.background =
    `conic-gradient(var(--teal) 0deg, var(--teal) ${degrees}deg, #24365f ${degrees}deg)`;
  const platinum = state.trophies.find((t) => t.grade === "platinum");
  if (platinum) {
    els.platinumState.textContent = state.earned.has(platinum.id)
      ? `Platinum earned: ${platinum.name}`
      : `Platinum: ${platinum.name}`;
  }
}

function renderList() {
  const visible = state.trophies.filter(matchesFilters);
  els.visibleCount.textContent = `${visible.length} shown · ${state.earned.size} earned`;
  els.emptyState.hidden = visible.length !== 0;
  els.trophyList.innerHTML = visible
    .map((t) => {
      const earned = state.earned.has(t.id);
      const selected = state.selectedId === t.id ? " selected" : "";
      return `<article class="trophy-card${earned ? " earned" : ""}${selected}" data-id="${t.id}" tabindex="0" role="button" aria-label="Open guide for ${escapeHtml(displayName(t))}">
        <input class="trophy-check" type="checkbox" data-check="${t.id}" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(displayName(t))} as earned">
        <div>
          <p class="trophy-name">${escapeHtml(displayName(t))}</p>
          <p class="trophy-desc">${escapeHtml(displayDesc(t))}</p>
          <div class="trophy-meta">${badgeHtml(t)}</div>
        </div>
        <span class="stage-pill">Stage ${t.stage} · #${t.order}</span>
      </article>`;
    })
    .join("");

  els.trophyList.querySelectorAll(".trophy-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.matches("input[type=checkbox]")) return;
      selectTrophy(Number(card.dataset.id));
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTrophy(Number(card.dataset.id));
      }
    });
  });
  els.trophyList.querySelectorAll("[data-check]").forEach((box) => {
    box.addEventListener("change", () => {
      toggleEarned(Number(box.dataset.check), box.checked);
    });
  });
}

function stageTitle(stage) {
  const titles = {
    1: "Stage 1 — Story: Chapters 1–2",
    2: "Stage 2 — Story: Chapters 3–4 & finale",
    3: "Stage 3 — Side strands & partner jobs",
    4: "Stage 4 — Collectibles & exploration",
    5: "Stage 5 — Activities & skill trophies",
    6: "Stage 6 — Cleanup, economy & 100%",
    7: "Stage 7 — Platinum",
  };
  return titles[stage] || `Stage ${stage}`;
}

function stageSub(stage) {
  const subs = {
    1: "Play the opening and Chapters 1–2. Watch the missable flags before you advance.",
    2: "Finish Chapters 3–4 and the final mission. Story trophies cannot be missed — they unlock in order.",
    3: "Clear the stranger strands and each contact's final mission while the map is fresh.",
    4: "Sweep Leonida for cards, WAiNK spots, meditation points, vehicles, and every area.",
    5: "Grind the activity trophies: races, ranges, stunts, challenges, and partner jobs.",
    6: "Spend, launder, buy garages, rob the remaining vaults, and push the checklist to 100%.",
    7: "With the other 54 earned, the platinum pops on its own.",
  };
  return subs[stage] || "";
}

function renderRoadmap() {
  const stages = [...new Set(state.trophies.map((t) => t.stage))].sort((a, b) => a - b);
  els.roadmapView.innerHTML = stages
    .map((stage) => {
      const items = state.trophies
        .filter((t) => t.stage === stage)
        .sort((a, b) => a.order - b.order);
      const doneHere = items.filter((t) => state.earned.has(t.id)).length;
      const rows = items
        .map((t) => {
          const earned = state.earned.has(t.id);
          return `<li class="${earned ? "earned" : ""}" data-road="${t.id}" tabindex="0">
            <span class="stage-num">${t.order}</span>
            <span>${escapeHtml(displayName(t))}</span>
            ${t.missable ? '<span class="badge missable">Missable</span>' : ""}
            <span class="badge grade-${t.grade}">${t.grade}</span>
          </li>`;
        })
        .join("");
      return `<div class="stage-block">
        <h3>${escapeHtml(stageTitle(stage))} <span class="visible-count">(${doneHere}/${items.length})</span></h3>
        <p class="stage-sub">${escapeHtml(stageSub(stage))}</p>
        <ul>${rows}</ul>
      </div>`;
    })
    .join("");
  els.roadmapView.querySelectorAll("[data-road]").forEach((row) => {
    row.addEventListener("click", () => selectTrophy(Number(row.dataset.road)));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTrophy(Number(row.dataset.road));
      }
    });
  });
}

function renderDetail(trophy) {
  if (!trophy) {
    els.detailPanel.innerHTML =
      '<p class="detail-placeholder">Select a trophy to read its full guide: what to do, where and how, when it can be missed, its roadmap order, and the sources each fact comes from.</p>';
    return;
  }
  const earned = state.earned.has(trophy.id);
  const hidden = isSpoilerHidden(trophy);
  const steps = Array.isArray(trophy.steps) ? trophy.steps : [];
  const sources = Array.isArray(trophy.sources) ? trophy.sources : [];
  const stepsHtml = steps.length
    ? `<ol>${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
    : "";
  const sourcesHtml = sources.length
    ? `<ul class="sources-list">${sources
        .map((s) => {
          if (s.url) {
            return `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>${s.note ? ` — ${escapeHtml(s.note)}` : ""}</li>`;
          }
          return `<li>${escapeHtml(s.label)}${s.note ? ` — ${escapeHtml(s.note)}` : ""}</li>`;
        })
        .join("")}</ul>`
    : "";
  const missableHtml = trophy.missable
    ? `<div class="missable-callout"><strong>Missable — when it locks:</strong> ${escapeHtml(trophy.missableWhen || "See the guide steps for the lock point.")}</div>`
    : `<div class="detail-section"><h4>Missable?</h4><p>Not missable. You can earn this at any point, including after the story — free-roam cleanup is safe.</p></div>`;
  const countLine =
    trophy.count !== null && trophy.count !== undefined
      ? `<div class="detail-section"><h4>Count</h4><p>${trophy.count} required (official list count).</p></div>`
      : "";

  els.detailPanel.innerHTML = `
    <h3>${escapeHtml(displayName(trophy))}</h3>
    <p class="detail-desc">“${escapeHtml(displayDesc(trophy))}”</p>
    <div class="trophy-meta">${badgeHtml(trophy)}<span class="badge kind">Roadmap stage ${trophy.stage} · order #${trophy.order}</span></div>
    ${
      hidden
        ? `<div class="detail-section"><h4>Guide</h4><p>Hidden by spoiler-safe mode. Turn the mode off in the toolbar, or earn this story trophy, to read the full guide.</p></div>`
        : `<div class="detail-section"><h4>Guide — what to do, where &amp; how</h4><p>${escapeHtml(trophy.guide)}</p>${stepsHtml}</div>`
    }
    ${missableHtml}
    ${countLine}
    <div class="detail-section"><h4>Roadmap order</h4><p>${escapeHtml(stageTitle(trophy.stage))} — position #${trophy.order} of 55. ${escapeHtml(stageSub(trophy.stage))}</p></div>
    ${sourcesHtml ? `<div class="detail-section"><h4>Sources</h4>${sourcesHtml}</div>` : ""}
    <label class="detail-check"><input type="checkbox" id="detailCheck" ${earned ? "checked" : ""}> I earned this trophy</label>
  `;
  const box = grab("detailCheck");
  if (box) {
    box.addEventListener("change", () => toggleEarned(trophy.id, box.checked));
  }
}

function selectTrophy(id) {
  state.selectedId = id;
  const trophy = state.trophies.find((t) => t.id === id);
  renderDetail(trophy || null);
  renderList();
}

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id);
  else state.earned.delete(id);
  saveProgress();
  renderProgress();
  renderList();
  if (state.view === "roadmap") renderRoadmap();
  const trophy = state.trophies.find((t) => t.id === id);
  if (trophy && state.selectedId === id) renderDetail(trophy);
  setStatus(earned ? `Marked earned: ${trophy ? trophy.name : id}. Progress saved.` : "Progress updated and saved.");
}

function setView(view) {
  state.view = view;
  els.tabChecklist.classList.toggle("active", view === "checklist");
  els.tabRoadmap.classList.toggle("active", view === "roadmap");
  els.tabChecklist.setAttribute("aria-selected", String(view === "checklist"));
  els.tabRoadmap.setAttribute("aria-selected", String(view === "roadmap"));
  els.trophyList.hidden = view !== "checklist";
  els.roadmapView.hidden = view !== "roadmap";
  els.listTitle.textContent = view === "roadmap" ? "Roadmap to Platinum" : "Checklist";
  if (view === "roadmap") renderRoadmap();
  else renderList();
}

function exportProgress() {
  const payload = {
    app: "leonida-trophy-companion",
    version: 1,
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-trophy-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${state.earned.size} earned trophies to leonida-trophy-progress.json.`);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error("no earned list");
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(ids.filter((n) => valid.has(n)));
      saveProgress();
      renderProgress();
      renderList();
      if (state.view === "roadmap") renderRoadmap();
      if (state.selectedId !== null) {
        renderDetail(state.trophies.find((t) => t.id === state.selectedId) || null);
      }
      setStatus(`Imported progress: ${state.earned.size} earned trophies.`);
    } catch (err) {
      setStatus("Import failed: that file is not a valid progress export.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get("kind");
  if (kind && ["all", "story", "missable", "collectibles", "activities", "online"].includes(kind)) {
    state.kind = kind;
    document.querySelectorAll("[data-kind]").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.kind === kind);
    });
  }
  if (params.get("spoiler") === "1") state.spoiler = true;
  if (params.get("view") === "roadmap") state.view = "roadmap";
  const open = params.get("open");
  if (open && Number.isInteger(Number(open))) state.selectedId = Number(open);
  const done = params.get("done");
  if (done) {
    done.split(",").forEach((part) => {
      const n = Number(part.trim());
      if (Number.isInteger(n)) state.earned.add(n);
    });
  }
}

function bindControls() {
  els.tabChecklist.addEventListener("click", () => setView("checklist"));
  els.tabRoadmap.addEventListener("click", () => setView("roadmap"));
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value.trim();
    renderList();
  });
  document.querySelectorAll("[data-kind]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.kind = chip.dataset.kind;
      document.querySelectorAll("[data-kind]").forEach((c) =>
        c.classList.toggle("active", c === chip)
      );
      renderList();
    });
  });
  document.querySelectorAll("[data-grade]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.grade = chip.dataset.grade;
      document.querySelectorAll("[data-grade]").forEach((c) =>
        c.classList.toggle("active", c === chip)
      );
      renderList();
    });
  });
  els.spoilerToggle.addEventListener("change", () => {
    state.spoiler = els.spoilerToggle.checked;
    savePrefs();
    renderList();
    if (state.view === "roadmap") renderRoadmap();
    if (state.selectedId !== null) {
      renderDetail(state.trophies.find((t) => t.id === state.selectedId) || null);
    }
    setStatus(state.spoiler ? "Spoiler-safe mode on: unearned story trophies are hidden." : "Spoiler-safe mode off.");
  });
  els.hideDoneToggle.addEventListener("change", () => {
    state.hideDone = els.hideDoneToggle.checked;
    savePrefs();
    renderList();
  });
  els.exportBtn.addEventListener("click", exportProgress);
  els.importInput.addEventListener("change", () => {
    const file = els.importInput.files && els.importInput.files[0];
    if (file) importProgress(file);
    els.importInput.value = "";
  });
  els.resetBtn.addEventListener("click", () => {
    state.earned.clear();
    saveProgress();
    renderProgress();
    renderList();
    if (state.view === "roadmap") renderRoadmap();
    renderDetail(null);
    state.selectedId = null;
    setStatus("Progress reset. All 55 trophies are unearned again.");
  });
}

async function init() {
  els.progressRing = grab("progressRing");
  els.progressPct = grab("progressPct");
  els.progressCount = grab("progressCount");
  els.platinumState = grab("platinumState");
  els.statusLine = grab("statusLine");
  els.trophyList = grab("trophyList");
  els.roadmapView = grab("roadmapView");
  els.emptyState = grab("emptyState");
  els.visibleCount = grab("visibleCount");
  els.listTitle = grab("listTitle");
  els.detailPanel = grab("detailPanel");
  els.tabChecklist = grab("tabChecklist");
  els.tabRoadmap = grab("tabRoadmap");
  els.searchInput = grab("searchInput");
  els.spoilerToggle = grab("spoilerToggle");
  els.hideDoneToggle = grab("hideDoneToggle");
  els.exportBtn = grab("exportBtn");
  els.importInput = grab("importInput");
  els.resetBtn = grab("resetBtn");

  loadPrefs();
  loadProgress();
  applyUrlParams();
  els.spoilerToggle.checked = state.spoiler;
  els.hideDoneToggle.checked = state.hideDone;
  bindControls();

  try {
    const response = await fetch("data/trophies.json");
    if (!response.ok) throw new Error(`data load failed: ${response.status}`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.trophies;
    if (!Array.isArray(list)) throw new Error("trophies array missing");
    state.trophies = list.slice().sort((a, b) => a.order - b.order);
    // Keep only earned ids that exist in the loaded list.
    const valid = new Set(state.trophies.map((t) => t.id));
    state.earned = new Set([...state.earned].filter((id) => valid.has(id)));
    renderProgress();
    setView(state.view);
    if (state.selectedId !== null) {
      renderDetail(state.trophies.find((t) => t.id === state.selectedId) || null);
      renderList();
    }
    setStatus(`Loaded ${state.trophies.length} trophies. Progress is saved in this browser.`);
  } catch (err) {
    setStatus("Could not load data/trophies.json. Serve the app/ folder over HTTP and reload.");
    els.emptyState.hidden = false;
    els.emptyState.textContent = "Trophy data failed to load. Serve app/ with a static server (for example: python3 -m http.server -d app 8080) and reload.";
  }
}

document.addEventListener("DOMContentLoaded", init);
