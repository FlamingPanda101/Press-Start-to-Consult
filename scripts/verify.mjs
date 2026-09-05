// Gate oracles for Press Start to Consult. Usage: node scripts/verify.mjs <check>
// Every check exits 1 on any failure and prints a success-only marker on pass.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { load as loadBlock, blockedIn } from './blocklist.mjs'

const BOOKS = ['01-the-warp-zone.md', '02-story-mode.md', '03-new-game-plus.md']
const ART = 'image-prompts.md'
const PROSE = [...BOOKS, ART, 'README.md']
const FIX = JSON.parse(readFileSync('scripts/fixtures.json', 'utf8'))
const read = f => readFileSync(f, 'utf8')
const fail = (msgs) => { for (const m of msgs) console.log('FAIL ' + m); process.exit(1) }

// Prose words per the contract: placeholder lines and table rows are excluded unless includeTables is set.
function proseWords(text, includeTables = false) {
  return text
    .split('\n')
    .filter(l => !/^\[IMAGE:/.test(l.trim()) && (includeTables ? !/^\|[\s:-|]*\|$/.test(l.trim()) : !/^\|/.test(l.trim())))
    .join(' ')
    .replace(/[|#*_`>]/g, ' ')
    .split(/\s+/)
    .filter(w => /[A-Za-z0-9]/.test(w)).length
}

// Blocked proper nouns live as salted hashes so this repository can be public
// without naming anyone. The hashing lives in one place, shared with the builder.
const BSET = loadBlock()

const checks = {
  structure() {
    const errs = []
    const need = {
      '01-the-warp-zone.md': ['# The Warp Zone', '## HUD', '## Spellbook', '## Overworld Atlas', '## Sector Codex', '## Quest Map', '## Boss'],
      '02-story-mode.md': ['# Story Mode', '## The Quest Line', '## Player Inventory', '### Spellbook', '### Overworld Atlas', '### Sector Codex', '## The Tutorial', '### The Opening Cutscene', '### The Dialogue Tree', '### The Pause Menu', '### The Quest Map', '## Boss Encounters', '### Boss Fight I', '### Boss Fight II', '### Final Boss', '## Training Grounds'],
      '03-new-game-plus.md': ['# New Game+', '## Title Screen', '## The Quest Line', '## Player Inventory I', '## Player Inventory II', '## Player Inventory III: Sector Codex, Healthcare', '## Player Inventory III: Sector Codex, Supply Chain and Operations', '## Player Inventory III: Sector Codex, Tech', '## Level 1', '## Level 2', '## Framework Skill Trees', '### Blending Trees', '### Compass Rules', '## Level 3', '## Boss Fight I', '### Reading Exhibits', '## Boss Fight II', '## Final Boss', '## Side Quests', '### Character Select', '### The Overworld', '### Other Boss Forms', '### The AI Trap', '## Training Grounds', '## Trophy Room', '## Glossary'],
    }
    for (const f of [...BOOKS, ART]) if (!existsSync(f)) errs.push(`${f} missing`)
    if (errs.length) fail(errs)
    for (const [f, heads] of Object.entries(need)) {
      const lines = read(f).split('\n').map(l => l.trim())
      for (const h of heads) if (!lines.some(l => l.startsWith(h))) errs.push(`${f}: heading "${h}" missing`)
      for (const l of lines) if (l.includes('[IMAGE:') && !/^\[IMAGE: Cosmo_[A-Za-z0-9_]+\]$/.test(l)) errs.push(`${f}: bad placeholder line "${l}"`)
    }
    const dlg = f => read(f).split('\n').filter(l => /^\*\*(COSMO|PLAYER 2):\*\*/.test(l.trim())).length
    if (dlg('03-new-game-plus.md') < 60) errs.push(`tome has ${dlg('03-new-game-plus.md')} dialogue lines, need 60+`)
    if (dlg('02-story-mode.md') < 6) errs.push(`story mode has ${dlg('02-story-mode.md')} dialogue lines, need 6+`)
    if (!read('01-the-warp-zone.md').includes('[IMAGE: Cosmo_WarpZone_Cover_01]')) errs.push('warp zone cover placeholder missing')
    if (errs.length) fail(errs)
    console.log('structure verification passed')
  },

  words() {
    // [prose floor, prose ceiling, ceiling including table cells]
    const range = { '01-the-warp-zone.md': [900, 1400, 1900], '02-story-mode.md': [3300, 4500, 6000], '03-new-game-plus.md': [12000, 17500, 21000] }
    const errs = []
    for (const [f, [lo, hi, cap]] of Object.entries(range)) {
      const n = proseWords(read(f)), all = proseWords(read(f), true)
      console.log(`${f}: ${n} prose words (target ${lo} to ${hi}), ${all} with tables (cap ${cap})`)
      if (n < lo || n > hi) errs.push(`${f} prose word count ${n} outside ${lo} to ${hi}`)
      if (all > cap) errs.push(`${f} total word count ${all} above ${cap}`)
    }
    if (errs.length) fail(errs)
    console.log('word count verification passed')
  },

  placeholders() {
    const used = new Map()
    for (const f of BOOKS) for (const m of read(f).matchAll(/^\[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]$/gm)) used.set(m[1], (used.get(m[1]) || 0) + 1)
    const art = read(ART)
    const entries = [...art.matchAll(/^### \[IMAGE: (Cosmo_[A-Za-z0-9_]+)\]\s*$/gm)].map(m => m[1])
    const errs = []
    for (const id of used.keys()) if (!entries.includes(id)) errs.push(`placeholder ${id} has no art bible entry`)
    for (const id of entries) if (!used.has(id)) errs.push(`art bible entry ${id} is not used in any book`)
    const dup = entries.filter((e, i) => entries.indexOf(e) !== i)
    if (dup.length) errs.push(`duplicate art entries: ${dup.join(', ')}`)
    const blocks = art.split(/^### \[IMAGE: /m).slice(1)
    for (const b of blocks) {
      const id = b.split(']')[0]
      for (const k of ['**Where it sits:**', '**Prompt:**', '**Aspect ratio and layout:**', '--ar ']) if (!b.includes(k)) errs.push(`art entry ${id} lacks ${k}`)
    }
    if (used.size < 35) errs.push(`only ${used.size} placeholders across the books, expected 35+`)
    if (errs.length) fail(errs)
    console.log(`${used.size} placeholders matched to ${entries.length} art entries`)
    console.log('placeholder verification passed')
  },

  banned(files = PROSE) {
    const words = ['really', 'just', 'literally', 'genuinely', 'honestly', 'simply', 'actually', 'deeply', 'truly', 'fundamentally', 'inherently', 'inevitably', 'interestingly', 'importantly', 'crucially', 'basically', 'essentially', 'ultimately', 'incredibly', 'extremely', 'very', 'landscape', 'navigate', 'unpack', 'delve', 'delves', ]
    const phrases = ['grand pause', 'game plan', 'deep dive', 'deep-dive', 'lean into', 'game-changer', 'game changer', 'double down', 'moving forward', 'circle back', 'on the same page', "here's the thing", "here's what", "here's why", "here's how", 'it turns out', 'let me be clear', 'the truth is', 'at the end of the day', "in today's", "it's worth noting", 'when it comes to', 'make no mistake', 'full stop', 'let that sink in', 'this matters because', 'at its core', 'the reality is', 'plot twist', 'not just', "isn't just", 'is not just']
    const errs = []
    for (const f of files) {
      const lines = read(f).split('\n')
      lines.forEach((l, i) => {
        if (/[–—]/.test(l)) errs.push(`${f}:${i + 1} dash character`)
        const low = l.toLowerCase()
        for (const w of words) if (new RegExp(`\\b${w}\\b`).test(low)) errs.push(`${f}:${i + 1} banned word "${w}"`)
        for (const p of phrases) if (new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}\\b`).test(low)) errs.push(`${f}:${i + 1} banned phrase "${p}"`)
        for (const hit of blockedIn(l, BSET)) errs.push(`${f}:${i + 1} blocked name "${hit}"`)
      })
    }
    return errs
  },

  'banned-all'() {
    const control = checks.banned(['scripts/controls/banned-control.md'])
    if (control.length < 3) fail(['negative control did not trip the banned check'])
    const errs = checks.banned()
    if (errs.length) fail(errs)
    console.log('banned string verification passed')
  },

  overlap(files = BOOKS) {
    const set = new Set(JSON.parse(read('scripts/source-shingles.json')))
    const hits = []
    for (const f of files) {
      const toks = read(f).toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean)
      for (let i = 0; i + 9 <= toks.length; i++) {
        const win = toks.slice(i, i + 9)
        if (win.every(t => /^[\d.]+$/.test(t))) continue // an all-numeric run is table data, not prose
        const s = win.join(' ')
        if (set.has(createHash('sha256').update(s).digest('hex').slice(0, 16))) hits.push(`${f}: "${s}"`)
      }
    }
    return hits
  },

  'overlap-all'() {
    const control = checks.overlap(['scripts/controls/overlap-control.md'])
    if (control.length < 1) fail(['negative control did not trip the overlap check'])
    const hits = checks.overlap()
    if (hits.length) fail(hits)
    console.log('source overlap verification passed')
  },

  fractions() {
    const errs = []
    for (const f of BOOKS) {
      const rows = [...read(f).matchAll(/^\|\s*1\/(\d+)\s*\|\s*([\d.]+)%\s*\|/gm)].map(m => [`1/${m[1]}`, `${m[2]}%`, Number(m[1]), Number(m[2])])
      const want = FIX.fractions
      if (rows.length < want.length) errs.push(`${f}: fraction scroll has ${rows.length} rows, fixture has ${want.length}`)
      for (const [frac, pct, n, x] of rows) {
        if (Math.abs(100 / n - x) > 0.06) errs.push(`${f}: ${frac} printed as ${pct}, computed ${(100 / n).toFixed(2)}%`)
        const fx = want.find(w => w[0] === frac)
        if (fx && fx[1] !== pct) errs.push(`${f}: ${frac} printed as ${pct}, fixture says ${fx[1]}`)
      }
      for (const [frac] of want) if (!rows.some(r => r[0] === frac)) errs.push(`${f}: fraction ${frac} missing`)
    }
    if (errs.length) fail(errs)
    console.log('fraction scroll verification passed')
  },

  atlas() {
    const errs = []
    const groups = { ...FIX.atlas, ...FIX.sectors }
    const tome = read('03-new-game-plus.md')
    for (const [g, obj] of Object.entries(groups)) for (const [k, v] of Object.entries(obj)) if (!tome.includes(v)) errs.push(`tome lacks ${g}: ${k} = ${v}`)
    const minCoverage = { '01-the-warp-zone.md': { us: 8, utah: 4, world: 1, metros: 8, countries: 10, healthcare: 6, supplychain: 8, tech: 6 }, '02-story-mode.md': { us: 6, utah: 3, world: 1, metros: 6, countries: 8, healthcare: 5, supplychain: 5, tech: 5 } }
    for (const [f, req] of Object.entries(minCoverage)) {
      const t = read(f)
      for (const [g, n] of Object.entries(req)) {
        const have = Object.values(groups[g]).filter(v => t.includes(v)).length
        if (have < n) errs.push(`${f}: only ${have} of ${g} values present, need ${n}`)
      }
    }
    const names = { ...FIX.atlas.states, ...FIX.atlas.metros, ...FIX.atlas.cities, ...FIX.atlas.countries, ...FIX.atlas.regions }
    for (const f of BOOKS) for (const line of read(f).split('\n')) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|/)
      if (!m) continue
      const label = m[1].replace(/\*/g, '').trim()
      const v = names[label]
      if (v && !line.includes(v)) errs.push(`${f}: row "${label}" does not carry fixture value ${v}: ${line.trim()}`)
    }
    if (errs.length) fail(errs)
    console.log('atlas and sector consistency verification passed')
  },

  math() {
    const W = FIX.worked_examples
    const errs = []
    const K = n => `${Math.round(n / 1000)}K`
    const M1 = n => `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
    const s = W.sizing_utah_ebikes.inputs
    const hh = Math.round(s.utah_population / s.household_size / 1e5) * 1e5
    const own = hh * s.wasatch_share * s.own_rate_wasatch, ownR = hh * (1 - s.wasatch_share) * s.own_rate_rural
    const perYear = (own + ownR) / s.replacement_years, trued = perYear * s.trueup_multiplier, dollars = trued * s.avg_price
    const sizing = [`${M1(hh)} households`, K(own), K(ownR), K(own + ownR), K(perYear), `${(trued / 1000).toFixed(1)}K`, `$${M1(dollars)}`]
    const g = W.quant_germany_bikes.inputs
    const cyc = g.germany_population_shorthand * g.cyclist_share
    const cas = cyc * g.casual_share, com = cyc * g.commuter_share, ent = cyc * g.enthusiast_share
    const bikes = cas / g.casual_years + com / g.commuter_years + ent / g.enthusiast_years
    const eb = [cas / g.casual_years * g.ebike_share_casual, com / g.commuter_years * g.ebike_share_commuter, ent / g.enthusiast_years * g.ebike_share_enthusiast]
    const germany = [`${M1(cyc)} cyclists`, M1(cas), M1(com), M1(ent), `${M1(bikes)} bikes`, `${M1(eb[0] + eb[1] + eb[2])} e-bikes`, M1(eb[0]), M1(eb[1])]
    const b = W.breakeven_assembly_plant.inputs
    const save = b.saving_per_unit * b.annual_units, net = save - b.annual_fixed_opex
    const breakeven = [`$${M1(save)}`, `$${M1(net)}`, `${b.capex / net} years`, `${K(b.annual_fixed_opex / b.saving_per_unit)} units`]
    const e = W.exhibit_segments.inputs
    const t1 = e.y1.reduce((a, c) => a + c), t2 = e.y2.reduce((a, c) => a + c)
    const pct = (a, c) => `${c >= a ? '+' : ''}${Math.round((c - a) / a * 100)}%`
    const exhibit = [`$${t1}M`, `$${t2}M`, pct(e.y1[0], e.y2[0]), pct(e.y1[1], e.y2[1]), pct(e.y1[2], e.y2[2]), `${(e.y1[2] / t1 * 100).toFixed(1)}%`, `${(e.y2[2] / t2 * 100).toFixed(1)}%`]
    const z = W.sensitivity_utah_half_ownership.inputs
    const zOwn = z.households * z.wasatch_share * z.own_rate_wasatch + z.households * (1 - z.wasatch_share) * z.own_rate_rural
    const zUnits = zOwn / z.replacement_years * z.trueup_multiplier
    const sensitivity = [`${(zUnits / 1000).toFixed(1)}K units`, `$${M1(zUnits * z.avg_price)}`]
    const computed = { sizing_utah_ebikes: sizing, quant_germany_bikes: germany, breakeven_assembly_plant: breakeven, exhibit_segments: exhibit, sensitivity_utah_half_ownership: sensitivity }
    for (const [name, arr] of Object.entries(computed)) {
      const exp = W[name].expected_strings
      for (const x of exp) if (!arr.includes(x)) errs.push(`fixture ${name} expects "${x}" but recomputation gives [${arr.join(', ')}]`)
    }
    const tome = read('03-new-game-plus.md'), story = read('02-story-mode.md')
    for (const [name, arr] of Object.entries(computed)) {
      if (name === 'sensitivity_utah_half_ownership') continue // this one is taught only in Story Mode's close
      for (const x of W[name].expected_strings) if (!tome.includes(x)) errs.push(`tome lacks ${name} string "${x}"`)
    }
    for (const x of W.sizing_utah_ebikes.expected_strings) if (!story.includes(x)) errs.push(`story mode lacks sizing string "${x}"`)
    for (const x of W.sensitivity_utah_half_ownership.expected_strings) if (!story.includes(x)) errs.push(`story mode lacks sensitivity string "${x}"`)
    if (errs.length) fail(errs)
    console.log('worked example verification passed')
  },

  git() {
    const run = c => execSync(c, { encoding: 'utf8' }).trim()
    const errs = []
    const dirty = run('git status --porcelain')
    if (dirty) errs.push(`working tree not clean:\n${dirty}`)
    const head = run('git rev-parse HEAD')
    const remote = run('git ls-remote origin refs/heads/main').split(/\s+/)[0]
    if (head !== remote) errs.push(`HEAD ${head} differs from origin/main ${remote || '(none)'}`)
    for (const f of [...BOOKS, ART, 'README.md']) if (!run(`git ls-files ${f}`)) errs.push(`${f} not tracked`)
    if (errs.length) fail(errs)
    console.log('git verification passed')
  },
}

const name = process.argv[2]
if (!checks[name]) { console.log(`unknown check ${name}`); process.exit(2) }
checks[name]()
