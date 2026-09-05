// Salted hashes of the proper nouns that must never appear in the deliverables.
// The names themselves stay out of the repository, so the guard keeps working
// after the repository goes public without naming anyone.
//
// Rebuild the list:  node scripts/blocklist.mjs "Name One" "Name Two" ...
// The canary is always included so a negative control can trip the name check
// without a real name living in this repository.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const SALT = 'press-start-to-consult/blocked-names/v1'
// One token, so it always fits inside the MAX_WORDS scan window and cannot
// collide with real prose.
export const CANARY = 'zzblockednamecanaryzz'
export const FILE = 'scripts/blocked-names.json'
export const MAX_WORDS = 4

export const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
export const hash = s => createHash('sha256').update(SALT + ' ' + norm(s)).digest('hex').slice(0, 20)

export function load() {
  if (!existsSync(FILE)) throw new Error(`${FILE} is missing; rebuild it with node scripts/blocklist.mjs "<name>"`)
  const d = JSON.parse(readFileSync(FILE, 'utf8'))
  if (d.salt !== SALT) throw new Error(`${FILE} was built with a different salt; rebuild it`)
  return new Set(d.hashes)
}

// Returns each blocked name found in the text, as the matched words.
export function blockedIn(body, set) {
  const w = norm(body).split(' ').filter(Boolean)
  const hits = new Set()
  for (let i = 0; i < w.length; i++)
    for (let n = 1; n <= MAX_WORDS && i + n <= w.length; n++) {
      const gram = w.slice(i, i + n).join(' ')
      if (set.has(hash(gram))) hits.add(gram)
    }
  return [...hits]
}

// CLI only. Importing this module must have no side effects.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const names = process.argv.slice(2)
  if (!names.length) {
    console.log('give one or more names to block, quoted')
    process.exit(2)
  }
  const hashes = [...new Set([...names, CANARY].map(n => hash(n)))].sort()
  writeFileSync(FILE, JSON.stringify({ salt: SALT, maxWords: MAX_WORDS, hashes }, null, 1) + '\n')
  // Prove the round trip before claiming success.
  const set = load()
  const missed = [...names, CANARY].filter(n => !blockedIn(n, set).length)
  if (missed.length) {
    console.log(`FAIL ${missed.length} name(s) did not round-trip through the blocklist`)
    process.exit(1)
  }
  console.log(`${hashes.length} names hashed, all round-tripped (including the canary)`)
}
