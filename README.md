# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum Ledger** — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official PlayStation name, description and grade, a guide written for this entry (what to do, where and how, and when it can be missed), short steps, and the named sources each fact comes from. A platinum roadmap puts the trophies in earning order, missable trophies are flagged with their miss window, and the checklist saves progress in your browser (localStorage) with export/import, kind filters, search, and a spoiler mode that hides story trophies until earned.

GTA VI is pre-release, so guides are built from the official trophy descriptions (as listed by PSNProfiles and Exophase, which agree on every name, description and grade) and say plainly where a detail is inferred rather than confirmed.

## Run it

Hand in the entry (copies `app/` and `screenshots/` to the output directory and writes `dossier.json`):

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Browse the guide offline — serve `app/` with any static file server and open it in a browser:

```
python3 -m http.server 8080 --directory app
```

then visit `http://localhost:8080`. No build step, no network requests: every file the app loads lives under `app/`.
