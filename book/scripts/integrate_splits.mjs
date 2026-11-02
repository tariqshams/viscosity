// Bring split chapters into the book.
//
// A writer who splits chapter NNN leaves the second half in
//   src/content/staging/NNN-b-slug/            (index.mdx with n: NNN, split_of: NNN)
//   src/components/diagrams/chNNNb/            (its diagrams, imported by that path)
// This script, for each staged chapter (highest NNN first):
//   1. makes room with scripts/renumber.mjs --after NNN --by 1;
//   2. moves it to chapters/(NNN+1)-slug, fixes n, day and the diagram imports,
//      and drops split_of;
//   3. adds it to the outline right after NNN, moving the concepts it took
//      over (its frontmatter `introduces`) out of chapter NNN's entry, with
//      their descriptions.
//
//   node scripts/integrate_splits.mjs
import { readdirSync, readFileSync, writeFileSync, renameSync, existsSync, rmdirSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const staging = join(root, 'src/content/staging');
const chapters = join(root, 'src/content/chapters');
const diagrams = join(root, 'src/components/diagrams');
const outlineDir = join(root, 'src/data/outline');
const pad = (n) => String(n).padStart(3, '0');
const CHAPTERS_PER_DAY = 4;

if (!existsSync(staging)) { console.log('nothing staged'); process.exit(0); }
// NNN-b-, NNN-c-, ...: processed from the last (highest number, latest letter)
// first, so after all of them the order is NNN, NNN-b, NNN-c, ...
const staged = readdirSync(staging).filter((d) => /^\d{3}-[b-z]-/.test(d)).sort().reverse();
if (!staged.length) { console.log('nothing staged'); process.exit(0); }
const logDir = join(root, '.renumber-logs');
mkdirSync(logDir, { recursive: true });

const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const key = (k) => (/^[a-z][a-z0-9]*$/i.test(k) ? k : q(k));

for (const folder of staged) {
  const n = Number(folder.slice(0, 3));
  const letter = folder[4];
  const slug = folder.slice('NNN-b-'.length);
  execFileSync('node', [join(root, 'scripts/renumber.mjs'), '--after', String(n), '--by', '1'], { stdio: 'inherit' });
  renameSync(join(root, 'renumber-log.txt'), join(logDir, `split-${n}.txt`));
  const m = n + 1;

  // 2. Move the staged chapter in.
  const to = join(chapters, `${pad(m)}-${slug}`);
  renameSync(join(staging, folder), to);
  const mdxPath = join(to, 'index.mdx');
  let mdx = readFileSync(mdxPath, 'utf8');
  const fm = parseYaml(mdx.match(/^---\n([\s\S]*?)\n---/)[1]);
  mdx = mdx
    .replace(/^split_of: .*\n/m, '')
    .replace(/^(---\n(?:[\s\S]*?\n)?n: )\d+(\nday: )\d+/, `$1${m}$2${Math.ceil(m / CHAPTERS_PER_DAY)}`)
    .replaceAll(`diagrams/ch${pad(n)}${letter}/`, `diagrams/ch${pad(m)}/`);
  writeFileSync(mdxPath, mdx);
  const dOld = join(diagrams, `ch${pad(n)}${letter}`);
  if (existsSync(dOld)) {
    const dNew = join(diagrams, `ch${pad(m)}`);
    if (existsSync(dNew)) throw new Error(`${dNew} already exists`);
    renameSync(dOld, dNew);
  }

  // 3. The outline: move the taken-over concepts into a new entry after n.
  const file = readdirSync(outlineDir).find((f) => /^part\d+\.js$/.test(f) && new RegExp(`\\{\\s*n:\\s*${n},`).test(readFileSync(join(outlineDir, f), 'utf8')));
  if (!file) throw new Error(`chapter ${n} is not in the outline`);
  const p = join(outlineDir, file);
  const mod = await import(`${pathToFileURL(p).href}?t=${Date.now()}`);
  const orig = mod.default.chapters.find((c) => c.n === n);
  const moved = {};
  for (const id of fm.introduces) {
    if (!(id in orig.introduces)) throw new Error(`${folder} introduces "${id}", which chapter ${n} does not`);
    moved[id] = orig.introduces[id];
  }
  const kept = Object.fromEntries(Object.entries(orig.introduces).filter(([k]) => !(k in moved)));
  const entry = (num, title, intro) => `    { n: ${num}, title: ${q(title)}, introduces: {\n${Object.entries(intro).map(([k, v]) => `      ${key(k)}: ${q(v)},`).join('\n')}\n    } },`;
  let s = readFileSync(p, 'utf8');
  const at = s.search(new RegExp(`\\{\\s*n:\\s*${n},`));
  const lineStart = s.lastIndexOf('\n', at) + 1;
  // An entry ends at the first "} }," after it (one-line or multi-line form).
  const end = s.indexOf('} },', at) + '} },'.length;
  s = s.slice(0, lineStart) + entry(n, orig.title, kept) + '\n' + entry(m, fm.title, moved) + s.slice(end);
  writeFileSync(p, s);
  appendFileSync(join(logDir, 'splits.txt'), `${n} -> ${n} + ${m} (${fm.title}): moved ${Object.keys(moved).join(', ')}\n`);
  console.log(`split ${n}: new chapter ${m}, "${fm.title}", takes ${Object.keys(moved).join(', ')}`);
}
if (!readdirSync(staging).length) rmdirSync(staging);
