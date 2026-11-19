# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Tracker is an offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies. It shows every official name, description and grade with an original guide per trophy that names its sources, saves your checklist in the browser with export and import, filters by kind and grade with text search, hides story trophies behind a spoiler shield until earned, and lays out a seven-stage roadmap to the platinum with every missable flagged and explained. The app is static files with no build step and makes no network requests at run time.

## Run it

```sh
python3 -m http.server 8000 --directory app
# then open http://localhost:8000/ in desktop Chrome
# grader entrypoint (copies app/ and screenshots/ and writes dossier.json):
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
