[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# GTA VI Trophy Guide — Leonida Legend Tracker

An offline static web app that tracks all 55 official GTA VI PS5 trophies: checklist with grades and progress saved in localStorage, filters by kind and grade, search, spoiler toggle for story trophies, missable badges, a roadmap to platinum, per-trophy guide panels with cited sources, and JSON export/import of your progress.

## Run it

Serve the `app/` folder with any static file server, then open it in a browser:

```bash
cd app
python3 -m http.server 8000
# open http://localhost:8000
```

No build step and no network access are needed — everything (HTML, CSS, JS, and `data/trophies.json`) is local.

## Build the submission bundle

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `dossier.json` there.
