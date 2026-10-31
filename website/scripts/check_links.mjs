// Checks every internal link in the built site (dist/) resolves.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dist = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(dist);
const bad = [];
for (const p of pages) {
  for (const m of readFileSync(p, 'utf8').matchAll(/href="(\/[^"#?]*)/g)) {
    const t = join(dist, m[1]);
    if (!existsSync(t) && !existsSync(join(t, 'index.html')) && !existsSync(t + '.html')) bad.push(`${p.slice(dist.length)} -> ${m[1]}`);
  }
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`links ok across ${pages.length} pages`);
