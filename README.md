# Press Start to Consult

*Cosmo the Cougar's Case Interview Strategy Guide.* Raw copy and art prompts for a retro 16-bit strategy guide that walks BYU Marriott MBA candidates through the consulting recruiting pipeline.

## The set

| File | Book | Use it when | Length |
|---|---|---|---|
| `01-the-warp-zone.md` | The Warp Zone | The night before an interview. Numbers, the case skeleton, the boss checklists. | 3 pages |
| `02-story-mode.md` | Story Mode | Two to four weeks out. The full method with one running case. | 10 pages |
| `03-new-game-plus.md` | New Game+ | Deep preparation. Skill trees, sector codex, full mock boss fights with pushback and math corrections. | 30 to 40 pages |
| `image-prompts.md` | Art bible | Generate the art. One prompt per placeholder, with aspect ratio and layout notes. | n/a |

The three books share one universe. Cosmo is the player. The interviewer is Player 2, a co-op partner. The recruiting pipeline is the Quest Line. The case is the Boss Fight. A number without a "so what" is an empty treasure chest.

## Handoff to the designer

- Placeholders sit on their own line in the exact form `[IMAGE: Cosmo_Name_01]`. Each ID has one entry in `image-prompts.md` with the same ID, the page location, the prompt, and an aspect ratio flag.
- Palette: BYU blue `#002E5D`, white, tan `#F5E6C8`, with a dark navy shadow tone allowed. Style: SNES-era pixel art with chunky outlines and no anti-aliasing.
- Tables are meant to become RPG inventory panels. Mock dialogues use **COSMO:** and **PLAYER 2:** labels and are meant to become dialogue boxes.
- Numbers in the books are canonical and consistent across all three. `scripts/fixtures.json` is the single source of truth; change it there first if a figure needs updating, then update the copy.

## Where the content comes from

Built from notes taken at a three-hour case interview workshop hosted by the BYU Marriott MBA program in September 2026, taught by a former McKinsey engagement manager and a former Bain consultant, and supplemented with standard MBB case frameworks and public sector baselines. The workshop's own slides, example client, example cases, and scoring rubric belong to the outside training firm that ran it and appear nowhere in this set. The running client, Wasatch Wheels, is fictional. Cosmo and the BYU marks belong to Brigham Young University and are used here for a student project.

## Checks

`GATES.md` is an unlazy completion ledger. `scripts/verify.mjs` holds the oracles:

```bash
node scripts/verify.mjs structure
node scripts/verify.mjs words
node scripts/verify.mjs placeholders
node scripts/verify.mjs banned-all
node scripts/verify.mjs overlap-all
node scripts/verify.mjs fractions
node scripts/verify.mjs atlas
node scripts/verify.mjs math
node scripts/verify.mjs git
```

The overlap check compares every nine-word run in the books against hashed shingles of the workshop sources (`scripts/source-shingles.json`), so the sources themselves stay out of the repo. Rebuild the hashes with `node scripts/build-shingles.mjs <source files>`.
