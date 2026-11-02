// Make room for new chapters: every chapter after N moves up by K.
//
//   node scripts/renumber.mjs --after 29 --by 3 [--dry-run]
//
// Chapters 30, 31, ... become 33, 34, ..., which leaves 30–32 free for new
// chapters (write them, and add them to the outline, afterwards). It updates:
//   - chapter folders (NNN-slug), their frontmatter n and day, diagram
//     folders (components/diagrams/chNNN) and the imports that point at them,
//     and refs-new/NNN-slug.js;
//   - the outline (src/data/outline/partN.js `n:` fields) and each part's
//     `days` range;
//   - text references to chapters ("chapter 30", "chapters 30–44",
//     "Chapters 31 and 35") in the book, its cards, diagrams, pages, data and
//     docs, and on the docs site (website/src/content). References to
//     chapters of *other* books ("The Rust Programming Language, chapter
//     12") are left alone; every rewrite and every skip is logged to
//     renumber-log.txt for review;
//   - src/data/renumbering.js, which records the move so the reader's saved
//     review deck and progress (keyed by chapter number) migrate in the
//     browser, and src/data/redirects.js, so the old URLs keep working.
import { readdirSync, readFileSync, writeFileSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i < 0 ? undefined : args[i + 1]; };
const after = Number(opt('--after'));
const by = Number(opt('--by'));
const dry = args.includes('--dry-run');
if (!Number.isInteger(after) || after < 0 || !Number.isInteger(by) || by < 1) {
  console.error('usage: node scripts/renumber.mjs --after N --by K [--dry-run]');
  process.exit(2);
}
const CHAPTERS_PER_DAY = 4;
const map = (n) => (n > after ? n + by : n);
const pad = (n) => String(n).padStart(3, '0');
const log = [];
const write = (p, s) => { if (!dry) writeFileSync(p, s); };
const move = (a, b) => { log.push(`move ${relative(repo, a)} -> ${relative(repo, b)}`); if (!dry) renameSync(a, b); };

const chaptersDir = join(root, 'src/content/chapters');
const diagramsDir = join(root, 'src/components/diagrams');
const refsNewDir = join(root, 'src/data/refs-new');
const folders = readdirSync(chaptersDir).filter((d) => /^\d{3}-/.test(d));
const maxN = Math.max(...folders.map((f) => Number(f.slice(0, 3))));
if (maxN + by > 999) throw new Error('chapter numbers would pass 999');

// 1. Text references. Other books' chapters are skipped when the 80
// characters before the match name another book.
const OTHER_BOOK = /(Rust Programming Language|the Book\b(?! *[’']s)|Crafting Interpreters|Dragon|Engineering a Compiler|Modern Compiler|Types and Programming|Handbook|SSA-based|Muchnick|Rustonomicon|Nomicon|Appel|Aho|Cooper and Torczon|Hennessy|Patterson|Drepper|Knuth|Ullman)\b[^.]*$/;
const REF = /\b([Cc]hapters?)(\s+)(\d{1,3}(?:\s*(?:–|-|,|and|or|to|through)\s*\d{1,3})*)/g;
function rewriteRefs(text, where) {
  return text.replace(REF, (all, word, sp, nums, offset) => {
    const before = text.slice(Math.max(0, offset - 80), offset);
    if (OTHER_BOOK.test(before)) { log.push(`skip ${where}: …${before.slice(-40)}${all}`); return all; }
    const out = nums.replace(/\d{1,3}/g, (d) => String(map(Number(d))));
    if (out !== nums) log.push(`ref  ${where}: ${all} -> ${word}${sp}${out}`);
    return `${word}${sp}${out}`;
  });
}
// Also rewrite links and paths that name a chapter folder or diagram folder.
function rewritePaths(text) {
  return text
    .replace(/(chapters\/)(\d{3})(-[a-z0-9-]+)/g, (_, a, n, s) => `${a}${pad(map(Number(n)))}${s}`)
    .replace(/(diagrams\/ch)(\d{3})\b/g, (_, a, n) => `${a}${pad(map(Number(n)))}`)
    .replace(/(\.\.\/ch)(\d{3})(?=\/)/g, (_, a, n) => `${a}${pad(map(Number(n)))}`)
    .replace(/(refs-new\/)(\d{3})(-[a-z0-9-]+)/g, (_, a, n, s) => `${a}${pad(map(Number(n)))}${s}`);
}

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => p.endsWith(x))) out.push(p);
  }
  return out;
}
const TEXT_EXTS = ['.mdx', '.md', '.js', '.mjs', '.ts', '.tsx', '.astro'];
const textFiles = [
  ...walk(join(root, 'src'), TEXT_EXTS),
  ...['STATUS.md', 'AUTHORING.md', 'WRITING_TRACK_B.md', 'PEDAGOGY.md', 'COVERAGE.md'].map((f) => join(root, f)).filter(existsSync),
  ...walk(join(repo, 'website/src/content'), ['.md', '.mdx']),
];
// The registry of moves itself is not rewritten.
const SKIP = new Set([join(root, 'src/data/renumbering.js'), join(root, 'src/data/redirects.js')]);
for (const p of textFiles) {
  if (SKIP.has(p)) continue;
  const s = readFileSync(p, 'utf8');
  let t = rewritePaths(rewriteRefs(s, relative(repo, p)));
  // Frontmatter n/day of a chapter, and `n:` in the outline.
  if (p.startsWith(chaptersDir) && p.endsWith('index.mdx')) {
    t = t.replace(/^(---\n(?:[\s\S]*?\n)?n: )(\d+)(\nday: )(\d+)/, (_, a, n, b) => {
      const m = map(Number(n));
      return `${a}${m}${b}${Math.ceil(m / CHAPTERS_PER_DAY)}`;
    });
  }
  if (p.startsWith(join(root, 'src/data/outline')) && /part\d+\.js$/.test(p)) {
    t = t.replace(/(\{\s*n:\s*)(\d+)/g, (_, a, n) => `${a}${map(Number(n))}`);
  }
  if (t !== s) write(p, t);
}

// 2. Folders, from the highest number down so nothing collides.
const moved = [];
for (const f of [...folders].sort().reverse()) {
  const n = Number(f.slice(0, 3));
  if (n <= after) continue;
  const to = `${pad(map(n))}${f.slice(3)}`;
  move(join(chaptersDir, f), join(chaptersDir, to));
  moved.push([f, to]);
  const dOld = join(diagramsDir, `ch${pad(n)}`);
  if (existsSync(dOld)) move(dOld, join(diagramsDir, `ch${pad(map(n))}`));
  const rOld = join(refsNewDir, `${f}.js`);
  if (existsSync(rOld)) move(rOld, join(refsNewDir, `${to}.js`));
}

// 3. Each part's days range, from its (new) chapter numbers.
const outlineDir = join(root, 'src/data/outline');
for (const f of readdirSync(outlineDir).filter((x) => /^part\d+\.js$/.test(x))) {
  const p = join(outlineDir, f);
  const s = readFileSync(p, 'utf8');
  const ns = [...s.matchAll(/\{\s*n:\s*(\d+)/g)].map((m) => Number(m[1]));
  if (!ns.length) continue;
  const lo = Math.ceil(Math.min(...ns) / CHAPTERS_PER_DAY);
  const hi = Math.ceil(Math.max(...ns) / CHAPTERS_PER_DAY);
  const t = s.replace(/days: '[^']*'/, `days: '${lo === hi ? lo : `${lo}–${hi}`}'`);
  if (t !== s) { log.push(`days ${f}: ${s.match(/days: '[^']*'/)?.[0]} -> days: '${lo === hi ? lo : `${lo}–${hi}`}'`); write(p, t); }
}

// 4. Record the move (for the browser migration) and the redirects.
const renumPath = join(root, 'src/data/renumbering.js');
const { RENUMBERINGS } = await import(pathToFileURL(renumPath).href);
const steps = [...RENUMBERINGS, { after, by }];
const redirPath = join(root, 'src/data/redirects.js');
const { REDIRECTS } = await import(pathToFileURL(redirPath).href);
const redirects = Object.fromEntries(Object.entries(REDIRECTS).map(([from, to]) => [from, rewritePaths(to)]));
for (const [f, to] of moved) redirects[`/chapters/${f}/`] = `/chapters/${to}/`;
const banner = (what) => `// Generated by scripts/renumber.mjs; do not edit by hand.\n// ${what}\n`;
write(renumPath, `${banner('Every renumbering so far, in order: chapters after `after` moved up by `by`. src/lib/renumber.ts uses it to migrate saved progress.')}export const RENUMBERINGS = ${JSON.stringify(steps, null, 2)};\n`);
write(redirPath, `${banner('Old chapter URLs (under the /book base) and where they live now. astro.config.mjs turns these into redirects.')}export const REDIRECTS = ${JSON.stringify(redirects, null, 2)};\n`);

const logPath = join(root, 'renumber-log.txt');
writeFileSync(logPath, log.join('\n') + '\n');
console.log(`${dry ? '[dry run] ' : ''}chapters after ${after} moved up by ${by}: ${moved.length} folders, ${log.filter((l) => l.startsWith('ref ')).length} text references, ${log.filter((l) => l.startsWith('skip')).length} skipped (other books). Review ${relative(process.cwd(), logPath)}.`);
