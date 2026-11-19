[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ikball53/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI Platinum Roadmap

An offline web app that tracks all 55 Grand Theft Auto VI PS5 trophies: a filterable checklist with per-trophy guides, a 5-stage platinum roadmap, a missables view, progress counters for long grinds, a spoiler shield for story trophies, and local save export/import.

Trophy names, descriptions and grades match the official PS5 list. Guides are original writing for this app and honestly note where the official text gives no location or steps. This is an unofficial fan guide with no Rockstar logos or artwork.

## Run it

Serve the `app/` folder with any static file server, for example:

```bash
python3 -m http.server 8000 --directory app
```

Then open `http://localhost:8000/` in a browser. The app loads `data/trophies.json` locally and saves progress in your browser (localStorage). No network calls beyond that local data file.

To build the make.fun dossier locally:

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

## License

MIT — see `LICENSE` (SPDX-License-Identifier: MIT).
