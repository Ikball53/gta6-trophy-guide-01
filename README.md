# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Ledger — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official PlayStation name, description and grade, a guide written in our own words with its sources named beside it, and a flag wherever the official description makes it missable. Tick trophies off as you earn them: progress is saved in your browser (localStorage), can be exported to a file and imported back, and can be filtered by kind — story, missable, collectibles, activities, online — with a spoiler setting that hides story trophy names and descriptions until you earn them. A five-stage platinum roadmap orders the whole hunt, from the opening mission to 100% completion. The app is plain static files with no build step and makes no network requests at run time; serve `app/` with any static file server and open `index.html`.

Trophy names, descriptions, grades and tracked counts follow the official PlayStation 5 list as published by Exophase and PSNProfiles (see the source list inside each trophy's guide in the app). Guides are original text for this entry; sources are cited, never copied. No Rockstar Games logo, artwork or game screenshot is used anywhere — the look is our own.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`. To just read the guide, serve the `app/` folder, for example `python3 -m http.server -d app 8080`, then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=06mvdhm0&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
