// Copies committed benchmark results from the engine and the Drip companion
// into src/data/bench/, so every number in the book comes from a real run
// in this repository, and the book builds on its own (Vercel builds only
// book/). Run after re-benchmarking: node scripts/sync_data.mjs
import { copyFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'src/data/bench');
mkdirSync(dest, { recursive: true });
const sources = [
  join(root, '..', 'engine/ts/packages/bench/results'),
  join(root, 'companion/ts/results'),
];
let n = 0;
for (const dir of sources) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    copyFileSync(join(dir, f), join(dest, f));
    n++;
  }
}
console.log(`synced ${n} result files into src/data/bench`);
