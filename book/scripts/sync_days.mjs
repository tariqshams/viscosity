// Recompute days from the outline: days count within a section (Prelude,
// Core, Deep dives), four chapters a day. Writes each chapter's frontmatter
// `day` and each outline part's `days` range. Run after anything that moves
// chapters (scripts/renumber.mjs runs it for you).
//
//   node scripts/sync_days.mjs [--dry-run]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry-run');
const PER_DAY = 4;
const outlineDir = join(root, 'src/data/outline');
// A fresh import each run (the outline may have just been rewritten).
const { PARTS } = await import(`${pathToFileURL(join(outlineDir, 'index.js')).href}?t=${Date.now()}`);

const dayOf = {};
const seen = {};
for (const p of PARTS) for (const c of p.chapters) {
  const i = seen[p.section] ?? 0;
  seen[p.section] = i + 1;
  dayOf[c.n] = Math.floor(i / PER_DAY) + 1;
}

let changed = 0;
const chaptersDir = join(root, 'src/content/chapters');
for (const f of readdirSync(chaptersDir)) {
  const p = join(chaptersDir, f, 'index.mdx');
  const s = readFileSync(p, 'utf8');
  const n = Number(s.match(/^n: (\d+)$/m)?.[1]);
  if (!dayOf[n]) continue;
  const t = s.replace(/^day: \d+$/m, `day: ${dayOf[n]}`);
  if (t !== s) { changed++; if (!dry) writeFileSync(p, t); }
}
for (const f of readdirSync(outlineDir).filter((x) => /^part\d+\.js$/.test(x))) {
  const p = join(outlineDir, f);
  const s = readFileSync(p, 'utf8');
  const ns = [...s.matchAll(/\{\s*n:\s*(\d+)/g)].map((m) => dayOf[Number(m[1])]).filter(Boolean);
  if (!ns.length) continue;
  const lo = Math.min(...ns), hi = Math.max(...ns);
  const t = s.replace(/days: '[^']*'/, `days: '${lo === hi ? lo : `${lo}–${hi}`}'`);
  if (t !== s) { changed++; if (!dry) writeFileSync(p, t); }
}
console.log(`${dry ? '[dry run] ' : ''}days synced: ${changed} file(s) changed`);
