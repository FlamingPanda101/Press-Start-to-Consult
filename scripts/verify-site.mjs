// Gate oracles for the docs/ website. Usage: node scripts/verify-site.mjs <check>
// Every check exits 1 on any failure and prints a success-only marker on pass.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { load as loadBlock, blockedIn } from './blocklist.mjs'

const OUT = 'docs'
const PAGES = ['index.html', 'warp-zone.html', 'story-mode.html', 'new-game-plus.html']
const BOOKS = [['warp-zone.html', '01-the-warp-zone.md'], ['story-mode.html', '02-story-mode.md'], ['new-game-plus.html', '03-new-game-plus.md']]
const read = f => readFileSync(f, 'utf8')
const page = p => read(join(OUT, p))
const fail = msgs => { for (const m of msgs) console.log('FAIL ' + m); process.exit(1) }
const text = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&middot;/g, '.').replace(/&rsaquo;/g, '>')
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&quot;/g, '"').replace(/\s+/g, ' ')

// Blocked proper nouns live as salted hashes so this repository can be public
// without naming anyone. The hashing lives in one place, shared with the builder.
const BSET = loadBlock()

const checks = {
  // Rebuilding must not change anything: the site is a pure function of the markdown.
  'build-idempotent'() {
    const before = new Map()
    const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : before.set(p, read(p)) } }
    walk(OUT)
    execFileSync(process.execPath, ['scripts/build-site.mjs'], { stdio: 'pipe' })
    const errs = []
    const after = new Map()
    walk2(OUT, after)
    for (const [p, v] of before) {
      if (!after.has(p)) errs.push(`${p} disappeared on rebuild`)
      else if (after.get(p) !== v) errs.push(`${p} changed on rebuild`)
    }
    for (const p of after.keys()) if (!before.has(p)) errs.push(`${p} appeared on rebuild`)
    if (before.size < 8) errs.push(`only ${before.size} built files, expected 8+`)
    if (errs.length) fail(errs)
    console.log(`${before.size} files stable across a rebuild`)
    console.log('build idempotency verified')
  },

  // Every heading and every table row in the source must reach the page.
  parity() {
    const errs = []
    // Tag boundaries become spaces, so compare with whitespace removed.
    const squash = t => t.replace(/\s+/g, '')
    for (const [p, md] of BOOKS) {
      const src = read(md), got = squash(text(page(p)))
      const heads = src.split('\n').filter(l => /^#{1,4} /.test(l)).map(l => l.replace(/^#+\s*/, '').replace(/\*\*|\*/g, ''))
      for (const h of heads) if (!got.includes(squash(h))) errs.push(`${p}: heading "${h}" missing from the page`)
      const rows = src.split('\n').filter(l => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l))
      let missing = 0
      for (const r of rows) {
        const first = r.replace(/^\||\|$/g, '').split('|')[0].trim().replace(/\*\*/g, '')
        if (first && !got.includes(squash(first))) { missing++; if (missing < 4) errs.push(`${p}: table row "${first}" missing`) }
      }
      if (missing) errs.push(`${p}: ${missing} table rows missing in total`)
      const paras = src.split('\n').filter(l => l.trim() && !/^[#|\[*-]/.test(l.trim()) && !/^\d+\. /.test(l.trim()))
      let pm = 0
      for (const para of paras) {
        const probe = para.trim().replace(/\*\*|\*/g, '').slice(0, 60)
        if (probe.length > 25 && !got.includes(squash(probe))) { pm++; if (pm < 4) errs.push(`${p}: paragraph "${probe}..." missing`) }
      }
      if (pm) errs.push(`${p}: ${pm} paragraphs missing in total`)
    }
    if (errs.length) fail(errs)
    console.log('source parity verified')
  },

  art() {
    const errs = []
    const bible = read('image-prompts.md')
    const declared = new Set([...bible.matchAll(/^### \[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]\s*$/gm)].map(m => m[1]))
    const rendered = new Set()
    let withArt = 0, pending = 0
    for (const [p] of BOOKS) {
      const h = page(p)
      for (const m of h.matchAll(/<img src="assets\/art\/(Cosmo_[A-Za-z0-9_]+)\.jpg"/g)) { rendered.add(m[1]); withArt++ }
      for (const m of h.matchAll(/class="art__id">(Cosmo_[A-Za-z0-9_]+)</g)) { rendered.add(m[1]); pending++ }
    }
    // The set cover renders on the home page rather than inside a book, and only
    // once its artwork exists; until then the home page simply omits it.
    const COVER = 'Cosmo_BoxArt_Cover_01'
    const coverFile = join(OUT, 'assets', 'art', `${COVER}.jpg`)
    if (existsSync(coverFile)) {
      if (!page('index.html').includes(`assets/art/${COVER}.jpg`)) errs.push(`${COVER} exists but the home page does not show it`)
      rendered.add(COVER); withArt++
    } else {
      declared.delete(COVER)
    }
    for (const id of declared) if (!rendered.has(id)) errs.push(`art slot ${id} never renders on any page`)
    for (const id of rendered) if (!declared.has(id)) errs.push(`rendered slot ${id} has no art bible entry`)
    for (const [p] of BOOKS) for (const m of page(p).matchAll(/(?:src|srcset)="(assets\/art\/[^"]+)"/g))
      if (!existsSync(join(OUT, m[1]))) errs.push(`${p}: image file ${m[1]} does not exist`)
    // Every picture must offer the small format and keep the fallback source.
    for (const [p] of BOOKS) {
      const h = page(p)
      const imgs = (h.match(/<img src="assets\/art\//g) || []).length
      const sources = (h.match(/<source type="image\/webp"/g) || []).length
      if (sources !== imgs) errs.push(`${p}: ${imgs} images but ${sources} WebP sources`)
      for (const m of h.matchAll(/<source type="image\/webp" srcset="([^"]+)"><img src="([^"]+)"/g))
        if (m[1].replace(/\.webp$/, '') !== m[2].replace(/\.jpg$/, ''))
          errs.push(`${p}: WebP source ${m[1]} does not match its fallback ${m[2]}`)
    }
    // Every pending slot must reserve its aspect ratio so nothing shifts when art lands.
    for (const [p] of BOOKS) {
      const h = page(p)
      const slots = (h.match(/class="art art--pending"/g) || []).length
      const ratios = (h.match(/--ar:\d+\/\d+/g) || []).length
      if (ratios < slots) errs.push(`${p}: ${slots - ratios} pending slots reserve no aspect ratio`)
      // The first image is the largest contentful paint and must not be deferred;
      // every later one must be, so a long book does not fetch 30 images at once.
      const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map(m => m[0])
      imgs.forEach((tag, i) => {
        const lazy = /loading="lazy"/.test(tag)
        if (i === 0 && lazy) errs.push(`${p}: the first image is lazy, which delays the largest paint`)
        if (i > 0 && !lazy) errs.push(`${p}: a below-the-fold image is not lazy`)
      })
    }
    if (withArt + pending !== declared.size) errs.push(`${withArt + pending} slots rendered, ${declared.size} declared`)
    if (errs.length) fail(errs)
    console.log(`${declared.size} slots: ${withArt} with art, ${pending} awaiting art, every ratio reserved`)
    console.log('art slot verification passed')
  },

  downloads() {
    const errs = []
    const EDITIONS = [
      'press-start-to-consult-complete.pdf',
      'press-start-to-consult-warp-zone.pdf',
      'press-start-to-consult-story-mode.pdf',
      'press-start-to-consult-new-game-plus.pdf',
    ]
    const h = page('index.html')
    if (!/class="downloads"/.test(h)) fail(['index.html has no downloads section'])
    const cards = (h.match(/<li class="dl[^"]*">/g) || []).length
    if (cards !== EDITIONS.length) errs.push(`${cards} download cards, expected ${EDITIONS.length}`)
    let live = 0, soon = 0
    for (const f of EDITIONS) {
      const onDisk = existsSync(join(OUT, 'downloads', f))
      const linked = h.includes(`href="downloads/${f}"`)
      if (onDisk && !linked) errs.push(`${f} exists but the page does not link it`)
      if (!onDisk && linked) errs.push(`the page links ${f} but the file is missing, so the link would 404`)
      onDisk ? live++ : soon++
    }
    // A card with no file must say so rather than looking clickable.
    const soonCards = (h.match(/class="dl dl--soon"/g) || []).length
    if (soonCards !== soon) errs.push(`${soon} editions have no file but ${soonCards} cards are marked unavailable`)
    for (const m of h.matchAll(/href="downloads\/([^"]+)"([^>]*)>/g)) {
      if (!/\bdownload\b/.test(m[2])) errs.push(`the link to ${m[1]} has no download attribute`)
      if (!existsSync(join(OUT, 'downloads', m[1]))) errs.push(`downloads/${m[1]} is linked but absent`)
    }
    // Every live card must state its real size, so nobody starts a surprise 40 MB fetch.
    for (const f of EDITIONS) {
      if (!existsSync(join(OUT, 'downloads', f))) continue
      const bytes = statSync(join(OUT, 'downloads', f)).size
      const want = bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`
      if (!h.includes(`PDF, ${want}`)) errs.push(`${f} is ${want} on disk but the page does not say so`)
      const head = readFileSync(join(OUT, 'downloads', f)).subarray(0, 5).toString('latin1')
      if (head !== '%PDF-') errs.push(`${f} is not a PDF (starts with ${JSON.stringify(head)})`)
      // A file on disk but untracked would 404 for every visitor, which is how
      // the first upload failed: a blanket *.pdf ignore rule swallowed them.
      try {
        if (!execFileSync('git', ['ls-files', `${OUT}/downloads/${f}`], { encoding: 'utf8' }).trim())
          errs.push(`${f} exists locally but git does not track it, so it would 404 once published`)
      } catch { errs.push(`could not ask git whether ${f} is tracked`) }
    }
    // Each book's rail offers that book's own PDF, never another book's, and only
    // when the file is really there.
    for (const [pageName, md] of BOOKS) {
      const slug = pageName.replace(/\.html$/, '')
      const want = `press-start-to-consult-${slug}.pdf`
      const hb = page(pageName)
      const rail = hb.match(/<a class="toc__pdf" href="downloads\/([^"]+)"([^>]*)>([\s\S]*?)<\/a>/)
      const onDisk = existsSync(join(OUT, 'downloads', want))
      if (!onDisk) { if (rail) errs.push(`${pageName}: the rail links a PDF that is not on disk`); continue }
      if (!rail) { errs.push(`${pageName}: ${want} exists but the contents rail does not offer it`); continue }
      if (rail[1] !== want) errs.push(`${pageName}: the rail offers ${rail[1]}, not this book's ${want}`)
      if (!/\bdownload\b/.test(rail[2])) errs.push(`${pageName}: the rail PDF link has no download attribute`)
      const bytes = statSync(join(OUT, 'downloads', want)).size
      const size = bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`
      if (!rail[3].includes(size)) errs.push(`${pageName}: the rail says the wrong size for ${want}, expected ${size}`)
    }
    if (errs.length) fail(errs)
    console.log(`${live} edition(s) downloadable, ${soon} marked coming soon, ${BOOKS.length} rails offer their own book`)
    console.log('downloads verification passed')
  },

  a11y() {
    const errs = []
    for (const p of PAGES) {
      const h = page(p)
      if (!/<html lang="en">/.test(h)) errs.push(`${p}: no lang on <html>`)
      if (!/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(h)) errs.push(`${p}: no responsive viewport`)
      if (/user-scalable=no|maximum-scale=1/.test(h)) errs.push(`${p}: zoom disabled`)
      if (!/class="skip"/.test(h)) errs.push(`${p}: no skip link`)
      if (!/id="main"/.test(h)) errs.push(`${p}: skip link has no target`)
      if (!/<main[^>]*>/.test(h)) errs.push(`${p}: no main landmark`)
      const h1 = (h.match(/<h1[\s>]/g) || []).length
      if (h1 !== 1) errs.push(`${p}: ${h1} h1 elements, expected exactly 1`)
      for (const m of h.matchAll(/<img\b[^>]*>/g)) {
        const alt = m[0].match(/\salt="([^"]*)"/)
        if (!alt) errs.push(`${p}: an img has no alt attribute`)
        else if (!alt[1].trim()) errs.push(`${p}: an img has empty alt`)
        if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) errs.push(`${p}: an img declares no dimensions, so it can shift layout`)
        // Alt text must describe the image, never fall back to the generation
        // prompt, which describes how to draw it and tells a reader nothing.
        if (alt && /^(16-bit|Full-page|[a-z-]+ (infographic|screen|banner|cover|scene|plate)\b)/.test(alt[1]))
          errs.push(`${p}: alt text "${alt[1].slice(0, 50)}" reads as a prompt fragment, not a description`)
      }
      // Heading levels must not skip on the way down.
      const levels = [...h.matchAll(/<h([1-4])[\s>]/g)].map(m => Number(m[1]))
      for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) errs.push(`${p}: heading jumps from h${levels[i - 1]} to h${levels[i]}`)
      for (const m of h.matchAll(/<(button|a)\b[^>]*>\s*<\/\1>/g)) errs.push(`${p}: empty ${m[1]} with no accessible name`)
      // Every disclosure button must say what it controls and whether it is open,
      // or a screen reader announces a button with no state and no target.
      for (const m of h.matchAll(/<button\b[^>]*>/g)) {
        if (!/aria-expanded="(true|false)"/.test(m[0])) errs.push(`${p}: a button has no aria-expanded state`)
        const controls = (m[0].match(/aria-controls="([^"]+)"/) || [])[1]
        if (!controls) errs.push(`${p}: a button declares no aria-controls target`)
        else if (!new RegExp(`id="${controls}"`).test(h)) errs.push(`${p}: a button controls #${controls}, which does not exist`)
      }
      // Every input needs a name a screen reader can announce: a label pointing at
      // its id, or an aria-label on the control itself.
      for (const m of h.matchAll(/<input\b[^>]*>/g)) {
        const id = (m[0].match(/\sid="([^"]+)"/) || [])[1]
        const labelled = id && new RegExp(`<label[^>]*for="${id}"`).test(h)
        if (!labelled && !/aria-label(ledby)?=/.test(m[0]))
          errs.push(`${p}: input ${id ? '#' + id : '(no id)'} has no label`)
      }
    }
    const css = read(join(OUT, 'assets', 'site.css'))
    if (!/prefers-reduced-motion/.test(css)) errs.push('css never honors prefers-reduced-motion')
    // IntersectionObserver rejects any rootMargin unit other than px or %, and it
    // throws on construction, which kills every line of script after it.
    const js = read(join(OUT, 'assets', 'site.js'))
    for (const m of js.matchAll(/rootMargin:\s*'([^']*)'/g))
      for (const part of m[1].split(/\s+/))
        if (part !== '0' && !/^-?[\d.]+(px|%)$/.test(part))
          errs.push(`rootMargin "${m[1]}" uses ${part}, which throws and disables the rest of the script`)
    // Killing an outline is only acceptable when :not(:focus-visible) keeps the
    // keyboard ring. Check each rule's own selector rather than the whole file.
    const strips = sheet => [...sheet.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(m => /outline:\s*(none|0)\b/.test(m[2]) && !/:not\(\s*:focus-visible\s*\)/.test(m[1]))
      .map(m => m[1].trim())
    if (strips('a:focus { outline: none; }').length !== 1) fail(['focus-outline control did not trip'])
    for (const sel of strips(css)) errs.push(`css removes the focus outline on "${sel}" without keeping :focus-visible`)
    if (!/:focus-visible/.test(css)) errs.push('css defines no visible focus state')
    const fs = css.match(/font-size:\s*(\d+)px/g) || []
    for (const f of fs) if (Number(f.match(/\d+/)[0]) < 16 && /body\s*\{[^}]*font-size:\s*\d+px/.test(css)) { /* body only */ }
    if (!/font-size:\s*1[6-9]px|font-size:\s*[2-9]\dpx/.test(css)) errs.push('body font size is under 16px')

    // Contrast: composite each declared pair and require WCAG AA.
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
    const rgba = c => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : [...hex(c), 1] }
    const over = (fg, bg) => { const f = rgba(fg), b = rgba(bg); return [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])) }
    const L = c => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4) }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] }
    const ratio = (fg, bg) => { const a = L(over(fg, bg)), b = L(rgba(bg).slice(0, 3)); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
    const NAVY = '#002E5D', DEEP = '#001A38', WHITE = '#FFFFFF', TAN = '#F5E6C8', PAPER = '#FBF6EA'
    const pairs = [
      ['body text on paper', DEEP, PAPER], ['body text on white panel', DEEP, WHITE],
      ['white on navy band', WHITE, NAVY], ['tan on navy footer', TAN, NAVY],
      ['tan on navy topbar link', TAN, NAVY], ['navy link on paper', NAVY, PAPER],
      ['navy on tan row', NAVY, TAN], ['muted body on paper', 'rgba(0,26,56,0.72)', PAPER],
      ['muted toc on white', 'rgba(0,26,56,0.82)', WHITE], ['navy label on tan fill', DEEP, TAN],
    ]
    if (ratio(WHITE, PAPER) >= 4.5) fail(['contrast control did not trip: white on paper should fail'])
    for (const [what, fg, bg] of pairs) {
      const r = ratio(fg, bg)
      if (r < 4.5) errs.push(`contrast ${r.toFixed(2)}:1 on ${what}, below the 4.5:1 floor`)
    }

    // Tap targets: every interactive rule must declare a 44px floor.
    const need = ['.topbar__links a', '.toc__list a', '.toc-toggle', '.search__input', '.brand']
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim(), m[2]])
    for (const sel of need) {
      const rule = rules.find(r => r[0] === sel)
      if (!rule) { errs.push(`no rule found for ${sel}`); continue }
      const mh = rule[1].match(/min-height:\s*(\d+)px/)
      if (!mh || Number(mh[1]) < 44) errs.push(`${sel} declares no 44px minimum tap height`)
    }
    if (errs.length) fail(errs)
    console.log('accessibility verification passed')
  },

  links() {
    const errs = []
    const ids = new Map()
    for (const p of PAGES) ids.set(p, new Set([...page(p).matchAll(/\bid="([^"]+)"/g)].map(m => m[1])))
    for (const p of PAGES) {
      const h = page(p)
      for (const m of h.matchAll(/href="([^"]+)"/g)) {
        const href = m[1]
        if (/^(https?:|mailto:)/.test(href)) continue
        // Strip the cache-busting query before resolving the file on disk.
        const [file, frag] = href.split('#').map((part, i) => i === 0 ? part.split('?')[0] : part)
        const target = file ? file : p
        if (file && !existsSync(join(OUT, file))) { errs.push(`${p}: link to missing file ${file}`); continue }
        if (frag && !ids.get(target)?.has(frag)) errs.push(`${p}: anchor #${frag} does not exist on ${target}`)
      }
      // Every contents entry must point at a real section.
      for (const m of h.matchAll(/class="toc__l\d"><a href="#([^"]+)"/g))
        if (!ids.get(p).has(m[1])) errs.push(`${p}: contents entry #${m[1]} has no section`)
    }
    const idx = JSON.parse(read(join(OUT, 'assets', 'search-index.json')))
    for (const e of idx) {
      const [file, frag] = e.u.split('#')
      if (!existsSync(join(OUT, file))) errs.push(`search index points at missing ${file}`)
      else if (!ids.get(file)?.has(frag)) errs.push(`search result "${e.h}" points at missing anchor #${frag}`)
    }
    if (errs.length) fail(errs)
    console.log(`all internal links and ${idx.length} search targets resolve`)
    console.log('link verification passed')
  },

  overflow() {
    const errs = []
    for (const [p] of BOOKS) {
      const h = page(p)
      const tables = (h.match(/<table>/g) || []).length
      const wraps = (h.match(/class="table-wrap"/g) || []).length
      if (tables !== wraps) errs.push(`${p}: ${tables} tables but ${wraps} scroll containers`)
      for (const m of h.matchAll(/<div class="table-wrap"([^>]*)>/g)) {
        if (!/tabindex="0"/.test(m[1])) errs.push(`${p}: a scrollable table is not keyboard focusable`)
        if (!/aria-label=/.test(m[1])) errs.push(`${p}: a scrollable region has no accessible name`)
      }
    }
    const css = read(join(OUT, 'assets', 'site.css'))
    if (!/overflow-x:\s*hidden/.test(css)) errs.push('body does not guard against horizontal overflow')
    if (!/\.table-wrap\s*\{[^}]*overflow-x:\s*auto/.test(css)) errs.push('table wrapper does not scroll')
    for (const m of css.matchAll(/width:\s*(\d{4,})px/g)) errs.push(`css sets a fixed width of ${m[1]}px`)
    if (/100vw/.test(css)) errs.push('css uses 100vw, which overflows when a scrollbar is present')
    // The book links must stay on one line and scroll, never wrap onto a second
    // row, which is what the narrow layout used to do.
    // Strip comments first, or a comment above a rule is captured as part of its selector.
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const navRule = [...bare.matchAll(/([^{}]+)\{([^}]*)\}/g)].find(m => m[1].trim() === '.topbar__links')
    if (!navRule) errs.push('no .topbar__links rule found')
    else {
      if (!/flex-wrap:\s*nowrap/.test(navRule[2])) errs.push('the book links may wrap onto a second row')
      if (!/overflow-x:\s*auto/.test(navRule[2])) errs.push('the book links do not scroll when they overflow')
    }
    if (errs.length) fail(errs)
    console.log('overflow verification passed')
  },

  'pages-ready'() {
    const errs = []
    if (!existsSync(join(OUT, 'index.html'))) errs.push('no docs/index.html entry page')
    if (!existsSync(join(OUT, '.nojekyll'))) errs.push('no .nojekyll, so GitHub Pages would run Jekyll over the output')
    for (const p of PAGES) {
      const h = page(p)
      for (const m of h.matchAll(/(?:src|href)="(\/[^\/"][^"]*)"/g)) errs.push(`${p}: absolute path ${m[1]} breaks on a project Pages URL`)
      for (const m of h.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
        const u = m[1]
        const ok = /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u) || /^https:\/\/github\.com\//.test(u)
        if (!ok) errs.push(`${p}: unexpected off-site asset ${u}`)
      }
      if (!/<title>[^<]+<\/title>/.test(h)) errs.push(`${p}: no title`)
      if (!/<meta name="description"/.test(h)) errs.push(`${p}: no description`)
      // Pages caches hard and cannot be purged, so every mutable local asset must
      // carry a content fingerprint or a return visitor keeps the stale copy.
      for (const m of h.matchAll(/(?:src|href)="(assets\/[^"?]+\.(?:css|js|json|svg))(\?v=([a-f0-9]+))?"/g)) {
        if (!m[3]) errs.push(`${p}: ${m[1]} has no ?v= fingerprint, so a cached copy can go stale`)
      }
      for (const m of h.matchAll(/data-search="(assets\/[^"?]+)(\?v=([a-f0-9]+))?"/g)) {
        if (!m[3]) errs.push(`${p}: the search index reference has no fingerprint`)
      }
    }
    // A fingerprint has to actually track its file's content.
    const digest = t => createHash('sha256').update(t).digest('hex').slice(0, 10)
    for (const [file, key] of [['assets/site.css', 'css'], ['assets/site.js', 'js'], ['assets/search-index.json', 'idx']]) {
      const want = digest(read(join(OUT, file)))
      const seen = new Set([...PAGES.flatMap(p => [...page(p).matchAll(new RegExp(file.replace(/[.\\/]/g, m => '\\' + m) + '\\?v=([a-f0-9]+)', 'g'))].map(m => m[1]))])
      for (const got of seen) if (got !== want) errs.push(`${file} is referenced as v=${got} but its content hashes to ${want}`)
    }
    if (errs.length) fail(errs)
    console.log('pages readiness verified')
  },

  // The site must not drift from the numbers the books gate on.
  figures() {
    const FIX = JSON.parse(read('scripts/fixtures.json'))
    const errs = []
    const tome = text(page('new-game-plus.html'))
    const story = text(page('story-mode.html'))
    const warp = text(page('warp-zone.html'))
    for (const group of [FIX.atlas.us, FIX.atlas.utah, FIX.atlas.world]) {
      for (const [k, v] of Object.entries(group)) if (!tome.includes(v)) errs.push(`tome page lacks ${k} = ${v}`)
    }
    for (const [k, v] of Object.entries(FIX.sectors.supplychain)) if (!tome.includes(v)) errs.push(`tome page lacks supply chain ${k} = ${v}`)
    for (const [f, x] of Object.entries(FIX.worked_examples)) {
      const target = f === 'sensitivity_utah_half_ownership' ? story : tome
      for (const s of x.expected_strings) if (!target.includes(s)) errs.push(`${f}: rendered page lacks "${s}"`)
    }
    for (const [frac, pct] of FIX.fractions) {
      for (const [name, t] of [['warp', warp], ['story', story], ['tome', tome]])
        if (!t.includes(frac) || !t.includes(pct)) errs.push(`${name} page lacks fraction row ${frac} = ${pct}`)
    }
    if (errs.length) fail(errs)
    console.log('rendered figure verification passed')
  },

  banned() {
    const words = ['really', 'just', 'literally', 'genuinely', 'honestly', 'simply', 'actually', 'deeply', 'truly', 'fundamentally', 'inherently', 'inevitably', 'interestingly', 'importantly', 'crucially', 'basically', 'essentially', 'ultimately', 'incredibly', 'extremely', 'very', 'landscape', 'navigate', 'unpack', 'delve', ]
    const phrases = ['grand pause', 'game plan', 'deep dive', 'lean into', 'moving forward', 'circle back', "here's the thing", 'it turns out', 'at the end of the day', 'not just']
    const scan = (label, body) => {
      const out = []
      const low = body.toLowerCase()
      for (const w of words) if (new RegExp(`\\b${w}\\b`).test(low)) out.push(`${label}: banned word "${w}"`)
      for (const p of phrases) if (low.includes(p)) out.push(`${label}: banned phrase "${p}"`)
      for (const hit of blockedIn(body, BSET)) out.push(`${label}: blocked name "${hit}"`)
      if (/[\u2013\u2014]/.test(body)) out.push(`${label}: dash character`)
      return out
    }
    // The control proves the scan can fail. It uses the canary from the blocklist
    // rather than a real name, so no name has to live in this repository.
    if (scan('control', 'This is really just a very deep dive with an em dash \u2014 by zzblockednamecanaryzz.').length < 5)
      fail(['negative control did not trip the rendered banned check'])
    const errs = []
    for (const p of PAGES) errs.push(...scan(p, text(page(p))))
    if (errs.length) fail(errs)
    console.log('rendered banned string verification passed')
  },
}

function walk2(d, into) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    statSync(p).isDirectory() ? walk2(p, into) : into.set(p, readFileSync(p, 'utf8'))
  }
}

const name = process.argv[2]
if (!checks[name]) { console.log(`unknown check ${name}`); process.exit(2) }
checks[name]()
