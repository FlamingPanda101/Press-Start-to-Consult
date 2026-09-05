# Design handoff: Press Start to Consult

Paste everything below the line into Claude Design. The copy is finished and verified; this brief covers layout only.

---

## What you are building

**Press Start to Consult**, a case-interview preparation set for MBA students at the BYU Marriott School of Business, laid out as a 16-bit retro video game strategy guide. Cosmo the Cougar, the BYU mascot, is the player character. The reader is Cosmo.

The set is three books that share one visual universe, plus a separate file of art prompts. All copy is final. Do not rewrite it, do not cut it, and do not change a single number: the figures are cross-checked by scripts and a candidate will say them out loud in an interview.

| Source file | Book | Trim | Body words | Art slots | Tables | Dialogue lines |
|---|---|---|---|---|---|---|
| `01-the-warp-zone.md` | The Warp Zone | 3 pages | 1,036 | 3 | 9 | 0 |
| `02-story-mode.md` | Story Mode | 10 pages | 4,096 | 11 | 12 | 11 |
| `03-new-game-plus.md` | New Game+ | 30 to 40 pages | 17,188 | 31 | 24 | 80 |

Get the content from the repository at **https://github.com/FlamingPanda101/Press-Start-to-Consult**. Read `README.md` first, then the three books, then `image-prompts.md`.

## The core tension, and how to resolve it

A pixel typeface is the whole point of the look and is unreadable across 17,000 words. Split the job:

- **Display type is pixel.** Book titles, section openers, panel titles, HUD labels, menu items, numbers inside game furniture. A chunky bitmap face with hard edges.
- **Body type is not.** Running prose uses a highly legible humanist sans at a comfortable reading size with generous leading. A student reads this at 11 pm the night before a first round, and legibility beats theme every time they conflict.

Let the pixel voice live in the furniture around the text rather than in the text.

## Palette

Three inks and one shadow. Nothing else.

| Role | Value |
|---|---|
| Primary | BYU blue `#002E5D` |
| Paper and highlight | White `#FFFFFF` |
| Warm fill | Tan `#F5E6C8` |
| Shadow and depth | Dark navy `#001A38` |

Build greys by dithering blue into white rather than by adding a grey. No gradients, no soft shadows, no blur, no anti-aliased glow. Edges are hard and offsets are square.

## Reading the markdown

The copy encodes its own layout. Map it like this.

| In the file | On the page |
|---|---|
| `#` heading | Book cover title |
| `##` heading | Section opener. Full-width band in BYU blue with the title in pixel display type. In the tome these are the chapter breaks. |
| `###` heading | Subsection head in the body column |
| `####` heading | Panel title. Always sits on a boxed panel, either a table or a checklist. Set it as a tab or a header bar on the box, not as running text. |
| Markdown table | Inventory panel. Navy header row with white type, tan or white body rows, a white keyline border, and figures aligned right. |
| `**COSMO:**` and `**PLAYER 2:**` | RPG dialogue box. Navy panel, white keyline, speaker name in a small tab on the top left edge, a blinking triangle cursor in the bottom right. Alternate the two speakers so a reader can follow a long exchange. |
| `[Cosmo writes for 30 seconds]` | Stage direction. Small centered caption between dialogue boxes, no panel, no cursor. |
| `[IMAGE: Cosmo_Something_01]` | Art slot. See below. |
| Numbered lists under a `####` panel title | Checklist panel with pixel checkbox glyphs |
| `- [ ]` items in the Trophy Room | Achievement row: locked trophy icon, name, unlock condition |

## The art slots

There are 45 slots across the three books and no images yet. `image-prompts.md` holds one prompt per slot with a matching ID, and the client will generate them separately. Your job is to size and place the slots so the images drop straight in.

Every entry in `image-prompts.md` carries an aspect ratio. Honor it.

| Flag | Count | Placement |
|---|---|---|
| `--ar 16:9` | 23 | Full-column-width banner, usually opening a section |
| `--ar 4:5` | 14 | Half-page infographic beside or under the text it explains |
| `--ar 3:4` | 4 | Full-page plate, given its own page |
| `--ar 1:1` | 4 | Spot illustration beside the text |

Draw each empty slot as a navy box with a white keyline, the aspect ratio held exactly, and the placeholder ID printed small in the corner so the client can match slot to prompt. The IDs are unique and every one has exactly one prompt.

Several slots are step-by-step infographics whose prompts specify exact labels and figures copied from the copy beside them. When you size those, leave room for the labels; a cramped skill tree or a squeezed five-floor dungeon cross-section loses the teaching.

## Per-book direction

**The Warp Zone**, 3 pages. Densest and most scannable. A student holds this the night before. Reference tables and checklists dominate; prose is minimal. Multi-column, tight leading on the tables, strong panel separation so the eye can jump. Three art slots only: a cover banner and two spots. Nothing here should require reading a paragraph to find a number.

**Story Mode**, 10 pages. The balanced manual. A single generous body column with panels breaking in. Roughly one art slot per page, so use them to pace the read. It contains two short mock dialogues, so the dialogue-box treatment appears here first and should feel like a reward.

**New Game+**, 30 to 40 pages. The textbook. Needs a running header carrying the section name, a page number in a pixel HUD frame, and a table of contents. Eighteen `##` sections become eighteen chapter openers, so those bands are the primary navigation. Eighty dialogue lines across five long mock interviews: these are the most distinctive pages in the set and deserve the strongest treatment. Widest table is five columns, so nothing needs to break across a spread.

## Recurring furniture

Establish these once and reuse them.

- **HUD bars.** Three stacked bars labeled HP, MP, XP. White frames, tan fill, navy backing. HP is composure, MP is mental math, XP is live cases. They appear as a motif, not as live data.
- **Dialogue box.** Described above. The single most important component.
- **Inventory grid.** Navy slots with white borders and 16-pixel icons, used for the reference tables.
- **Skill tree.** Round medallion nodes joined by white lines, solid when unlocked and dithered when locked.
- **Treasure chest.** Marks a "Loot" callout, the guide's term for the takeaway from a piece of analysis.
- **Game Over screen.** A dark panel listing common mistakes, closing on the word "Continue?" with a cursor on YES.

## Build order

Do not lay out 48 pages one at a time. Build the system first:

1. A cover
2. A section opener band
3. A body page with a sidebar panel
4. A table-heavy page
5. A dialogue page
6. A full-page art plate

Get those six approved, then apply them across the three books.

## Constraints

- Copy is final and verified. Do not edit, reorder, or trim it.
- Numbers are cross-checked by scripts. Changing one breaks the build.
- Tables must stay scannable. No table may be set so small that a figure is hard to read.
- Nothing on any page may run wider than its column.
- Both light and dark presentation must keep the palette above; the design is not theme-switchable.

## Attribution note

Cosmo the Cougar and the block Y are trademarks of Brigham Young University, used here for a student project. Keep them recognizable and respectful, and use no other institution's marks. The set carries no consulting firm's logo and must not gain one.
