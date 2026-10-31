// Checks the built site (dist/): every internal link and #anchor resolves,
// and every page has a title. Run after `npm run build`.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(dist)) { console.error('dist/ not found: run npm run build first'); process.exit(1); }
const pages = new Map();
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.set('/' + p.slice(dist.length + 1).replace(/index\.html$/, '').replace(/\\/g, '/'), readFileSync(p, 'utf8'));
  }
})(dist);

const problems = [];
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [url, html] of pages) {
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${url}: no <title>`);
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:)/.test(href) || href.startsWith('/pagefind/') || href.startsWith('/_astro/') || href === '/favicon.svg') continue;
    const [path, hash] = href.split('#');
    const target = path === '' ? url : (path.endsWith('/') ? path : path + '/');
    const page = pages.get(target) ?? pages.get(path);
    if (!page) { problems.push(`${url}: broken link ${href}`); continue; }
    if (hash && !ids(page).has(hash)) problems.push(`${url}: missing anchor ${href}`);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`check_site: ${pages.size} pages, all internal links and anchors resolve.`);
