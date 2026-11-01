// Checks the built site (dist/): every internal link and #anchor resolves,
// every internal URL is under the book's base path (/book/, where it is
// served at https://viscosity.dev/book/), and every page has a title.
// Run after `npm run build`.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE } from './lib/serve.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(dist)) { console.error('dist/ not found: run npm run build first'); process.exit(1); }
const pages = new Map();
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.set(BASE + p.slice(dist.length + 1).replace(/index\.html$/, '').replace(/\\/g, '/'), readFileSync(p, 'utf8'));
  }
})(dist);

const problems = [];
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const HOST = 'http://book.invalid';
for (const [url, html] of pages) {
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${url}: no <title>`);
  // Links, and the URLs of scripts, stylesheets, icons and images.
  for (const m of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const attr = m[1];
    const raw = m[2].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:|blob:|javascript:)/.test(raw) && !raw.startsWith('//')) continue;
    const u = new URL(raw, HOST + url);
    if (u.origin !== HOST) continue;
    if (!u.pathname.startsWith(BASE)) { problems.push(`${url}: ${attr}="${raw}" is outside the base path ${BASE} (use href() from src/lib/url.ts)`); continue; }
    if (!raw.startsWith('/') && !raw.startsWith('#')) { problems.push(`${url}: relative ${attr}="${raw}" (use href() from src/lib/url.ts)`); continue; }
    const path = u.pathname;
    const page = pages.get(path) ?? pages.get(path.endsWith('/') ? path : path + '/');
    if (!page) {
      if (attr === 'src' || /\.[a-z0-9]+$/i.test(path)) {
        if (!existsSync(join(dist, decodeURIComponent(path.slice(BASE.length))))) problems.push(`${url}: missing file ${raw}`);
      } else problems.push(`${url}: broken link ${raw}`);
      continue;
    }
    const hash = u.hash.slice(1);
    if (hash && !ids(page).has(hash) && !ids(page).has(decodeURIComponent(hash))) problems.push(`${url}: missing anchor ${raw}`);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`check_site: ${pages.size} pages, all internal links and anchors resolve under ${BASE}.`);
