# Leonida Platinum

[![make.fun](https://make.fun/api/competitions/gta6-trophy-guide-01/badge?type=entry&handle=kaka-aja)](https://make.fun/bounty/gta6-trophy-guide-01) [![make.fun](https://make.fun/api/competitions/gta6-trophy-guide-01/badge?type=dev)](https://make.fun/bounty/gta6-trophy-guide-01) [![make.fun](https://make.fun/api/competitions/gta6-trophy-guide-01/badge?type=result)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI** — made for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it is

- **Checklist** of all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden), each with its official name, description and grade, plus a guide written in our own words and a cited source.
- **Progress saved in the browser** (localStorage), with export to `leonida-platinum-save.json` and import back.
- **Filters** by kind (story, missable, collectibles, activities, online) and search by name or description.
- **Spoiler setting** that hides story trophy names and descriptions until earned.
- **Roadmap in 4 stages** to the platinum: story → activities and skills → collectibles and exploration → cleanup.
- **Missables**: 4 trophies flagged from their official descriptions (Hot Together, Retail Therapy, Catch Me If You Can, Actions Speak Louder), with the rule used to flag them.

## How to use it

Open `app/index.html` in a desktop browser. No network is needed — the app is fully static and offline. Tick a trophy when you earn it; your progress stays in the browser. Export a save file to back it up or move it to another machine.

## Sources

The official trophy list (names, descriptions, grades) via Exophase; target counts via PSNProfiles. Every guide is written in our own words for this entry; where a method is not yet checked in the game, the guide says so plainly. No Rockstar logo, wordmark or artwork is used.

## Build

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from the kit's `vendor/makefun-frontend.ts`. It clears only the output directory's contents — never the directory itself, which in the grader is a bind-mount.

## License

MIT — see [LICENSE](LICENSE).
