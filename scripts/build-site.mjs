// Builds docs/ (the GitHub Pages site) from the source markdown.
// The markdown is the single source of truth; nothing here edits copy.
// Usage: node scripts/build-site.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const OUT = 'docs'
const BOOKS = [
  {
    slug: 'warp-zone', file: '01-the-warp-zone.md', title: 'The Warp Zone',
    tag: 'Book 1', pages: '3 pages',
    blurb: 'The night before. Numbers, the case skeleton, and the boss checklists, with nothing you have to read twice.',
  },
  {
    slug: 'story-mode', file: '02-story-mode.md', title: 'Story Mode',
    tag: 'Book 2', pages: '10 pages',
    blurb: 'Two to four weeks out. The whole method, run end to end on one client, with the reference tables you will reach for most.',
  },
  {
    slug: 'new-game-plus', file: '03-new-game-plus.md', title: 'New Game+',
    tag: 'Book 3', pages: '30 to 40 pages',
    blurb: 'The completion run. Framework skill trees, a full sector codex, and five mock interviews with pushback and a math correction.',
  },
]

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = s => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

// ---------------------------------------------------------------- art slots
function readArt() {
  const bible = readFileSync('image-prompts.md', 'utf8')
  const slots = new Map()
  const re = /^### \[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]\s*$/gm
  let m
  while ((m = re.exec(bible))) {
    const id = m[1]
    const block = bible.slice(m.index, bible.indexOf('\n### ', m.index + 5) === -1 ? bible.length : bible.indexOf('\n### ', m.index + 5))
    const ar = (block.match(/--ar (\d+:\d+)/) || [])[1] || '16:9'
    const prompt = (block.match(/\*\*Prompt:\*\*\s*([^\n]+)/) || [])[1] || ''
    // First sentence of the prompt is the gist a designer or reader needs.
    const gist = prompt.replace(/^16-bit\s*/i, '').split(/\.\s/)[0].slice(0, 150)
    slots.set(id, { id, ar, gist })
  }
  const alts = existsSync('scripts/art-alts.json') ? JSON.parse(readFileSync('scripts/art-alts.json', 'utf8')) : {}
  const have = existsSync('docs/assets/art') ? new Set(readdirSync('docs/assets/art')) : new Set()
  for (const s of slots.values()) {
    s.src = have.has(`${s.id}.jpg`) ? `assets/art/${s.id}.jpg` : null
    s.alt = alts[s.id] || null
  }
  return slots
}

// ---------------------------------------------------------------- renderer
function render(md, art, ctx) {
  const lines = md.split('\n')
  const out = []
  const toc = []
  const seen = new Map()
  let i = 0
  // A panel title renders one level below the heading above it, so the document
  // outline never skips a level even though the source writes every panel as h4.
  let lastLevel = 1

  const idFor = text => {
    let base = slug(text)
    const n = (seen.get(base) || 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  }

  const table = () => {
    const rows = []
    while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
    const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const head = cells(rows[0])
    const body = rows.slice(2).map(cells)
    // Right-align a column when every body cell in it reads as a figure.
    const numeric = head.map((_, c) =>
      body.length > 0 && body.every(r => !r[c] || /^[$+-]?[\d.,]+\s*(%|[KMBT]|x|days?|years?|pallets|lb|ft|TEU|cu ft)?\+?$/i.test(r[c].replace(/<[^>]+>/g, '').trim())))
    const th = head.map((h, c) => `<th scope="col"${numeric[c] ? ' class="num"' : ''}>${inline(h)}</th>`).join('')
    const tb = body.map(r =>
      `<tr>${r.map((c, j) => j === 0
        ? `<th scope="row">${inline(c)}</th>`
        : `<td${numeric[j] ? ' class="num"' : ''}>${inline(c)}</td>`).join('')}</tr>`).join('')
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="Reference table, scrolls horizontally">`
      + `<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`
  }

  const figure = id => {
    const s = art.get(id)
    if (!s) throw new Error(`placeholder ${id} has no art bible entry`)
    ctx.slots.push(id)
    const [w, h] = s.ar.split(':').map(Number)
    if (s.src) {
      ctx.withArt.push(id)
      return `<figure class="art" style="--ar:${w}/${h}">`
        + `<img src="${s.src}" alt="${esc(s.alt || s.gist)}" width="${w * 100}" height="${h * 100}" loading="lazy" decoding="async">`
        + `</figure>`
    }
    ctx.pending.push(id)
    return `<figure class="art art--pending" style="--ar:${w}/${h}" role="img" aria-label="Artwork not yet made: ${esc(s.gist)}">`
      + `<div class="art__slot"><span class="art__id">${esc(id)}</span>`
      + `<span class="art__ar">${esc(s.ar)}</span>`
      + `<span class="art__gist">${esc(s.gist)}</span></div></figure>`
  }

  while (i < lines.length) {
    const l = lines[i]
    const t = l.trim()

    if (!t) { i++; continue }

    if (t.startsWith('# ')) { out.push(`<h1 class="book__title">${inline(t.slice(2))}</h1>`); i++; continue }

    if (/^#{2,4} /.test(t)) {
      const level = t.match(/^#+/)[0].length
      const text = t.replace(/^#+\s*/, '')
      const id = idFor(text)
      if (level === 2) toc.push({ id, text, level: 2 })
      if (level === 3) toc.push({ id, text, level: 3 })
      if (level < 4) lastLevel = level
      // An h4 titles the panel that follows it, so open a panel wrapper.
      if (level === 4) {
        i++
        const inner = []
        while (i < lines.length && !lines[i].trim()) i++
        if (i < lines.length && lines[i].startsWith('|')) inner.push(table())
        else {
          while (i < lines.length && /^(\d+\.|-) /.test(lines[i].trim())) {
            const ol = /^\d+\. /.test(lines[i].trim())
            const items = []
            while (i < lines.length && /^(\d+\.|-) /.test(lines[i].trim())) {
              items.push(`<li>${inline(lines[i].trim().replace(/^(\d+\.|-)\s*/, ''))}</li>`)
              i++
            }
            inner.push(`<${ol ? 'ol' : 'ul'} class="panel__list">${items.join('')}</${ol ? 'ol' : 'ul'}>`)
            while (i < lines.length && !lines[i].trim()) i++
          }
        }
        const pl = Math.min(lastLevel + 1, 4)
        out.push(`<section class="panel"><h${pl} class="panel__title" id="${id}">${inline(text)}</h${pl}>${inner.join('')}</section>`)
        continue
      }
      out.push(`<h${level} id="${id}" class="h${level}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${inline(text)}</h${level}>`)
      i++
      continue
    }

    if (t.startsWith('|')) { out.push(table()); continue }

    if (/^\[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]$/.test(t)) {
      out.push(figure(t.match(/^\[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]$/)[1]))
      i++
      continue
    }

    if (/^\*\*(COSMO|PLAYER 2):\*\*/.test(t)) {
      const turns = []
      while (i < lines.length) {
        const lt = lines[i].trim()
        if (/^\*\*(COSMO|PLAYER 2):\*\*/.test(lt)) {
          const who = lt.match(/^\*\*(COSMO|PLAYER 2):\*\*/)[1]
          const said = lt.replace(/^\*\*(COSMO|PLAYER 2):\*\*\s*/, '')
          turns.push(`<div class="say say--${who === 'COSMO' ? 'cosmo' : 'p2'}">`
            + `<p class="say__who">${who}</p>`
            + `<p class="say__line">${inline(said)}</p></div>`)
          i++
        } else if (/^\[[^\]]+\]$/.test(lt) && !/^\[IMAGE:/.test(lt)) {
          turns.push(`<p class="stage">${inline(lt.slice(1, -1))}</p>`)
          i++
        } else if (!lt) {
          // A blank line inside an exchange is spacing, not the end of it.
          let j = i
          while (j < lines.length && !lines[j].trim()) j++
          const nxt = j < lines.length ? lines[j].trim() : ''
          if (/^\*\*(COSMO|PLAYER 2):\*\*/.test(nxt) || (/^\[[^\]]+\]$/.test(nxt) && !/^\[IMAGE:/.test(nxt))) { i = j; continue }
          break
        } else break
      }
      out.push(`<div class="dialogue">${turns.join('')}</div>`)
      continue
    }

    if (/^\[[^\]]+\]$/.test(t) && !/^\[IMAGE:/.test(t)) {
      out.push(`<p class="stage">${inline(t.slice(1, -1))}</p>`)
      i++
      continue
    }

    if (/^- \[ \] /.test(t)) {
      const items = []
      while (i < lines.length && /^- \[ \] /.test(lines[i].trim())) {
        items.push(`<li class="trophy"><span class="trophy__box" aria-hidden="true"></span><span class="trophy__text">${inline(lines[i].trim().slice(6))}</span></li>`)
        i++
      }
      out.push(`<ul class="trophies">${items.join('')}</ul>`)
      continue
    }

    if (/^(\d+\.|-) /.test(t)) {
      const ol = /^\d+\. /.test(t)
      const items = []
      while (i < lines.length && /^(\d+\.|-) /.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^(\d+\.|-)\s*/, ''))}</li>`)
        i++
      }
      out.push(`<${ol ? 'ol' : 'ul'}>${items.join('')}</${ol ? 'ol' : 'ul'}>`)
      continue
    }

    if (/^\*[^*]+\*$/.test(t)) { out.push(`<p class="subtitle">${inline(t)}</p>`); i++; continue }

    out.push(`<p>${inline(t)}</p>`)
    i++
  }
  return { html: out.join('\n'), toc }
}

// ---------------------------------------------------------------- shell
// Assets are fingerprinted so a rebuild reaches visitors who already have the
// old file cached. GitHub Pages caches aggressively and offers no purge.
const fp = (path, v) => `${path}?v=${v}`
const head = (title, desc, V) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap">
<link rel="stylesheet" href="${fp('assets/site.css', V.css)}">
<link rel="icon" href="${fp('assets/favicon.svg', V.ico)}" type="image/svg+xml">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`

const nav = current => `<header class="topbar">
<nav class="topbar__inner" aria-label="Books">
<a class="brand" href="index.html"><span class="brand__press">PRESS START</span><span class="brand__to">TO CONSULT</span></a>
<ul class="topbar__links">
${BOOKS.map(b => `<li><a href="${b.slug}.html"${b.slug === current ? ' aria-current="page"' : ''}>${esc(b.title)}</a></li>`).join('\n')}
</ul>
</nav>
</header>`

const foot = V => `<footer class="foot">
<p>Built from a case interview workshop at the BYU Marriott School of Business. The running client, Wasatch Wheels, is fictional.</p>
<p>Cosmo the Cougar and the block Y are trademarks of Brigham Young University, used here for a student project.</p>
<p><a href="https://github.com/FlamingPanda101/Press-Start-to-Consult">Source and the markdown these pages are built from</a></p>
</footer>
<script src="${fp('assets/site.js', V.js)}" defer></script>
</body>
</html>`

// ---------------------------------------------------------------- build
mkdirSync(join(OUT, 'assets', 'art'), { recursive: true })

// Art is copied in before the slots are read, so the renderer knows what exists.
const artSrc = process.env.ART_SRC
if (artSrc && existsSync(artSrc)) {
  for (const f of readdirSync(artSrc)) if (f.endsWith('.jpg')) copyFileSync(join(artSrc, f), join(OUT, 'assets', 'art', f))
}

const art = readArt()
const search = []
const pages = []
let totalSlots = 0, totalArt = 0, totalPending = 0

for (const b of BOOKS) {
  const md = readFileSync(b.file, 'utf8')
  const ctx = { slots: [], withArt: [], pending: [] }
  const { html, toc } = render(md, art, ctx)
  totalSlots += ctx.slots.length; totalArt += ctx.withArt.length; totalPending += ctx.pending.length

  // Section text for the search index, split on h2/h3 boundaries. Slice from the
  // start of the heading's tag, not from the id attribute inside it, or the
  // attribute text survives the tag strip and shows up in search snippets.
  const startOf = id => {
    const at = html.indexOf(`id="${id}"`)
    return at < 0 ? -1 : html.lastIndexOf('<', at)
  }
  for (const s of toc) {
    const idx = startOf(s.id)
    const nxt = toc[toc.indexOf(s) + 1]
    const end = nxt ? startOf(nxt.id) : html.length
    const body = html.slice(idx, end > idx ? end : html.length)
      .replace(/<a class="anchor"[^>]*>#<\/a>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ').trim()
    search.push({ b: b.title, u: `${b.slug}.html#${s.id}`, h: s.text, t: body.slice(0, 900) })
  }

  const tocHtml = toc.map(s =>
    `<li class="toc__l${s.level}"><a href="#${s.id}">${esc(s.text)}</a></li>`).join('\n')

  pages.push([b, toc, html, tocHtml])
  console.log(`${b.slug}.html: ${toc.length} sections, ${ctx.slots.length} art slots (${ctx.withArt.length} with art)`)
}

// The index must exist before any page is written, because each page carries the
// index's fingerprint so a stale cached copy can never be used.
const indexJson = JSON.stringify(search)
writeFileSync(join(OUT, 'assets', 'search-index.json'), indexJson)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`
  + `<rect width="16" height="16" fill="#002E5D"/>`
  + `<path fill="#FFFFFF" d="M3 3h2v2H3zm8 0h2v2h-2zM5 5h2v2H5zm4 0h2v2H9zM7 7h2v2H7zm0 2h2v4H7z"/></svg>`
writeFileSync(join(OUT, 'assets', 'favicon.svg'), favicon)
const digest = t => createHash('sha256').update(t).digest('hex').slice(0, 10)
const V = {
  css: digest(readFileSync(join(OUT, 'assets', 'site.css'), 'utf8')),
  js: digest(readFileSync(join(OUT, 'assets', 'site.js'), 'utf8')),
  idx: digest(indexJson),
  ico: digest(favicon),
}

for (const [b, toc, html, tocHtml] of pages) {
  writeFileSync(join(OUT, `${b.slug}.html`), `${head(`${b.title} | Press Start to Consult`, b.blurb, V)}
${nav(b.slug)}
<div class="shell">
<button class="toc-toggle" aria-expanded="false" aria-controls="toc">Contents</button>
<nav class="toc" id="toc" aria-label="Sections in this book">
<p class="toc__head">${esc(b.title)}</p>
<ol class="toc__list">
${tocHtml}
</ol>
</nav>
<main id="main" class="book" tabindex="-1" aria-label="${esc(b.title)}">
<p class="book__tag">${esc(b.tag)} &middot; ${esc(b.pages)}</p>
${html}
</main>
</div>
${foot(V)}`)
}

const cards = BOOKS.map(b => {
  const cover = [...art.values()].find(s => s.id.toLowerCase().includes(b.slug.replace('-', '').slice(0, 8)) && s.src)
  return `<a class="card" href="${b.slug}.html">
<span class="card__tag">${esc(b.tag)} &middot; ${esc(b.pages)}</span>
<span class="card__title">${esc(b.title)}</span>
<span class="card__blurb">${esc(b.blurb)}</span>
<span class="card__go">Read<span aria-hidden="true"> &rsaquo;</span></span>
</a>`
}).join('\n')

writeFileSync(join(OUT, 'index.html'), `${head('Press Start to Consult', 'A case interview strategy guide for BYU Marriott MBA students, written as a 16-bit retro game guide.', V)}
${nav('index')}
<main id="main" class="home" tabindex="-1" data-search="${fp('assets/search-index.json', V.idx)}">
<section class="hero">
<p class="hero__kicker">BYU Marriott MBA</p>
<h1 class="hero__title">PRESS START<br>TO CONSULT</h1>
<p class="hero__sub">Cosmo the Cougar's case interview strategy guide. Three books, one universe, every number checked by a script.</p>
<div class="hero__hud" aria-hidden="true">
<span class="bar"><b>HP composure</b><span class="bar__track"><i style="width:100%"></i></span></span>
<span class="bar"><b>MP mental math</b><span class="bar__track"><i style="width:64%"></i></span></span>
<span class="bar"><b>XP live cases</b><span class="bar__track"><i style="width:28%"></i></span></span>
</div>
</section>
<div class="search">
<label class="search__label" for="q">Search the guide</label>
<input id="q" type="search" class="search__input" placeholder="inventory turns, MECE, the pause menu..." autocomplete="off" aria-describedby="search-help">
<p id="search-help" class="search__help">Searches every section of all three books.</p>
<ul id="results" class="results" aria-live="polite"></ul>
</div>
<section class="cards" aria-label="The three books">
${cards}
</section>
<section class="how">
<h2>How the three fit together</h2>
<p>You are Cosmo. The interviewer is Player 2, playing co-op rather than against you. The recruiting pipeline is the Quest Line, the case is a multi-phase Boss Fight, and a number without a "so what" is an empty treasure chest.</p>
<p>Start in <a href="story-mode.html">Story Mode</a> if you have a few weeks. Open <a href="warp-zone.html">The Warp Zone</a> the night before. Work <a href="new-game-plus.html">New Game+</a> when you want the framework skill trees, the sector codex, and mock interviews with real pushback.</p>
</section>
</main>
${foot(V)}`)

writeFileSync(join(OUT, '.nojekyll'), '')
console.log(`\n${totalSlots} art slots total: ${totalArt} with art, ${totalPending} awaiting art`)
console.log(`search index: ${search.length} sections`)
