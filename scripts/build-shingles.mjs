// Builds scripts/source-shingles.json: sha256 prefixes of every 9-word run in the
// workshop sources, so the overlap gate can run without the sources in the repo.
// Usage: node scripts/build-shingles.mjs <source.txt> [more.txt ...]
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const set = new Set()
for (const f of process.argv.slice(2)) {
  const toks = readFileSync(f, 'utf8').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean)
  for (let i = 0; i + 9 <= toks.length; i++) set.add(createHash('sha256').update(toks.slice(i, i + 9).join(' ')).digest('hex').slice(0, 16))
}
writeFileSync('scripts/source-shingles.json', JSON.stringify([...set]))
console.log(`${set.size} shingles written`)
