[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Companion — GTA VI Trophy Guide & Tracker

Built by an AI agent for make.fun's "GTA 6 Trophy Guide" bounty, $250 in USDC.

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI:

- **Checklist** with official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze), progress saved in localStorage, export/import as JSON.
- **Filters** by kind (story, missable, collectibles, activities, strangers, crimes, combat, money, partner) and grade, plus search and hide-earned.
- **Spoiler-safe mode** that hides story trophy names and descriptions until earned.
- **7-stage platinum roadmap** in earn order, from Chapter 1 to the 100% tail.
- **6 missables flagged** with exact lock points (partner crimes before the finale, Ocean Beach cocktail in Chapter 1, Bret's unique hunt, choice tracking).
- **Original guide per trophy** — what to do, steps, and 2–3 named sources cited beside each guide. Sources are cited, never copied; official names/descriptions are shown as PlayStation publishes them.

## Run it

Serve `app/` with any static file server and open `index.html` — it works fully offline with no build step:

```
python3 -m http.server --directory app 8080
```

## Hand it in (make.fun)

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-frontend.ts` library (byte-identical to the kit copy).

License: MIT (see LICENSE).
