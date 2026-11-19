# Leonida Platinum

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Kkajasd/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Kkajasd/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI** — made for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it is

- **Checklist** of all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze), each with its official name, description and grade, plus a guide written in our own words and a cited source.
- **Progress saved in the browser** (localStorage), with export to `leonida-platinum-save.json` and import back.
- **Filters** by kind (story, missable, collectibles, activities) and by grade, plus search and an earned / not-earned filter.
- **Spoiler setting** that hides the names, descriptions and guides of story trophies until they are earned.
- **Roadmap to the platinum** in four stages, in order, with the missable trophies flagged in-flow.
- **Missables view**: the four trophies that can be missed, with their guides and warnings, so they are done when the chance appears.

## How the guide is built

Every guide is written in our own words for this entry. Trophy names, descriptions and grades are the official PlayStation 5 list, as Exophase and PSNProfiles listed it before this guide was written (the two agree on every name, description and grade). Counts — 42 Shooting Range challenges, 14 Top Fun locations, 18 meditation spots, 52 areas, 9 gangs, 8 garage properties, 9 activity types — are from PSNProfiles. Each guide cites its source beside it. Where a detail could not be verified from the official list, the guide says so instead of inventing it. No Rockstar Games logo, artwork or game screenshots are used: the look is our own.

## Run it

The app is static files under `app/` — no build step. Serve it and open `app/index.html`:

```sh
node serve.ts
```

Then open http://localhost:8080. It works with the network off: every file it loads is under `app/`.

## Hand it in

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=kaka-aja&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
