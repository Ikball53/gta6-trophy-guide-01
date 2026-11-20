# Leonida Trophy Companion — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-guide-01)

An offline, open-source trophy guide and tracker for **Grand Theft Auto VI** (PlayStation 5).
All 55 official trophies with their published name, description, and grade, plus a detailed,
source-cited guide for each one, a platinum roadmap in stages, and every missable flagged with
the point where it locks.

## What it does

- **Checklist tracker** — tick trophies off as you earn them; progress is saved in your browser
  (localStorage) and can be exported to a JSON file and imported back.
- **Filters & search** — filter by kind (story, missable, collectibles, activities, online),
  by grade, or search by name.
- **Spoiler-safe mode** — hides story trophy names and descriptions until you earn them.
- **Roadmap view** — the platinum path in stages: story first, then side content, collectibles,
  activities, cleanup, and 100%.
- **Detail panel** — every trophy opens a guide with what to do, where/how, when it can be
  missed, its roadmap order, and cited sources.

## Run it

The app is plain static files with no build step and no network use. Serve `app/` with any
static server and open `index.html`:

```bash
npx serve app
# or
python3 -m http.server -d app 8080
```

To hand the entry in (copies `app/` and `screenshots/` to the output dir and writes
`dossier.json`):

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Data

`app/data/trophies.json` holds all 55 trophies. Names, descriptions, and grades are shown as
PlayStation publishes them; each guide is written for this entry and cites its sources beside
the trophy. No Rockstar Games logo, artwork, or screenshots are used — the look is original.

## License

MIT — see [LICENSE](LICENSE).
