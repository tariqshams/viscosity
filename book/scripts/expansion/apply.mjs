// Apply scripts/expansion/plan.mjs once: make room (scripts/renumber.mjs),
// add the new chapters to the outline as planned chapters, add the new parts,
// and relabel the parts I..XIV in order.
//
//   node scripts/expansion/apply.mjs
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { INSERTS, NEW_PARTS } from './plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repo = join(root, '..');
const outlineDir = join(root, 'src/data/outline');
const CHAPTERS_PER_DAY = 4;

// 1. Make room, from the last insertion point backwards, so each earlier
// `after` still names the same chapter when its turn comes.
const groups = [...INSERTS].sort((a, b) => b.after - a.after);
for (const g of groups) {
  execFileSync('node', [join(root, 'scripts/renumber.mjs'), '--after', String(g.after), '--by', String(g.chapters.length)], { stdio: 'inherit' });
  renameSync(join(root, 'renumber-log.txt'), join(root, `renumber-log-${g.after}.txt`));
}
// Where an old chapter number ends up after every move.
const finalN = (n) => n + INSERTS.filter((g) => g.after < n).reduce((s, g) => s + g.chapters.length, 0);

// 2. The new chapters, as outline entries.
const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const key = (k) => (/^[a-z][a-z0-9]*$/i.test(k) ? k : q(k));
const entry = (n, c) => `    { n: ${n}, title: ${q(c.title)}, introduces: {\n${Object.entries(c.introduces).map(([k, v]) => `      ${key(k)}: ${q(v)},`).join('\n')}\n    } },`;

const index = readFileSync(join(outlineDir, 'index.js'), 'utf8');
let order = [...index.matchAll(/import (p\d+) from '\.\/(part\d+\.js)'/g)].map((m) => ({ v: m[1], file: m[2] }));
order = order.sort((a, b) => Number(a.v.slice(1)) - Number(b.v.slice(1))).map((x) => x.file);

for (const g of INSERTS) {
  const first = finalN(g.after) + 1;
  const lines = g.chapters.map((c, i) => entry(first + i, c)).join('\n');
  if (g.newPart) {
    const np = NEW_PARTS.find((p) => p.file === g.newPart);
    writeFileSync(join(outlineDir, np.file), `// ${np.title}. Added in the 2026-11 expansion (scripts/expansion/plan.mjs).\nexport default {\n  id: 'NEW', track: ${q(np.track)}, days: '', title: ${q(np.title)},\n  blurb: ${q(np.blurb)},\n  chapters: [\n${lines}\n  ],\n};\n`);
    // Goes after the part that holds old chapter `after`.
    const holder = order.find((f) => new RegExp(`\\{\\s*n:\\s*${finalN(g.after)}\\b`).test(readFileSync(join(outlineDir, f), 'utf8')));
    order.splice(order.indexOf(holder) + 1, 0, np.file);
  } else {
    const file = order.find((f) => new RegExp(`id: '${g.part}'`).test(readFileSync(join(outlineDir, f), 'utf8')));
    const p = join(outlineDir, file);
    const s = readFileSync(p, 'utf8');
    const prev = finalN(g.after);
    // The previous chapter's entry ends with "} }," on its own line or at line end.
    const at = s.search(new RegExp(`\\{\\s*n:\\s*${prev}\\b`));
    if (at < 0) throw new Error(`chapter ${prev} is not in ${file}`);
    const endIdx = s.indexOf('\n', s.indexOf('} },', at)) + 1;
    writeFileSync(p, s.slice(0, endIdx) + lines + '\n' + s.slice(endIdx));
  }
}

// 3. Relabel the parts in order (I, II, ...), renaming the files to match.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
const partMap = {};
const contents = order.map((f) => readFileSync(join(outlineDir, f), 'utf8'));
order.forEach((f, i) => {
  const old = contents[i].match(/id: '([^']+)'/)[1];
  if (old !== 'NEW') partMap[old] = ROMAN[i];
});
for (const f of order) renameSync(join(outlineDir, f), join(outlineDir, `${f}.tmp`));
order.forEach((f, i) => {
  let s = contents[i].replace(/id: '[^']+'/, `id: '${ROMAN[i]}'`);
  const ns = [...s.matchAll(/\{\s*n:\s*(\d+)/g)].map((m) => Number(m[1]));
  const lo = Math.ceil(Math.min(...ns) / CHAPTERS_PER_DAY);
  const hi = Math.ceil(Math.max(...ns) / CHAPTERS_PER_DAY);
  s = s.replace(/days: '[^']*'/, `days: '${lo === hi ? lo : `${lo}–${hi}`}'`)
    .replace(/^\/\/ Part [IVX]+: ([^(\n]*)\(days [^)]*\)/m, `// Part ${ROMAN[i]}: $1(days ${lo === hi ? lo : `${lo}–${hi}`})`);
  writeFileSync(join(outlineDir, `part${i + 1}.js`), s);
  // the .tmp copy is removed below
});
for (const f of order) { const t = join(outlineDir, `${f}.tmp`); if (existsSync(t)) execFileSync('rm', [t]); }
const names = order.map((_, i) => `p${i + 1}`);
writeFileSync(join(outlineDir, 'index.js'), index
  .replace(/\/\/ The whole [^\n]*/, `// The whole curriculum, one file per part.`)
  .replace(/(import p\d+ from '\.\/part\d+\.js';\s*)+/, names.map((v, i) => `import ${v} from './part${i + 1}.js';`).join('\n') + '\n')
  .replace(/export const PARTS = \[[^\]]*\]/, `export const PARTS = [${names.join(', ')}]`));

// Text: "Part VII", "Parts IX and X", and chapter frontmatter `part:`.
const REF = /\b(Parts?)(\s+)([IVX]+\b(?:\s*(?:–|-|,|and|or|to|through)\s*[IVX]+\b)*)/g;
const relabel = (nums) => nums.replace(/\b[IVX]+\b/g, (r) => partMap[r] ?? r);
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
const files = [
  ...walk(join(root, 'src'), ['.mdx', '.md', '.js', '.mjs', '.ts', '.tsx', '.astro']).filter((p) => !p.startsWith(outlineDir)),
  ...['STATUS.md', 'AUTHORING.md', 'WRITING_TRACK_B.md', 'PEDAGOGY.md'].map((f) => join(root, f)).filter(existsSync),
  ...walk(join(repo, 'website/src/content'), ['.md', '.mdx']),
];
const log = [];
for (const p of files) {
  const s = readFileSync(p, 'utf8');
  let t = s.replace(REF, (all, w, sp, nums) => { const out = relabel(nums); if (out !== nums) log.push(`${relative(repo, p)}: ${all} -> ${w}${sp}${out}`); return `${w}${sp}${out}`; });
  if (p.endsWith('index.mdx')) t = t.replace(/^(---\n[\s\S]*?\npart: )([IVX]+)$/m, (_, a, r) => `${a}${partMap[r] ?? r}`);
  if (t !== s) writeFileSync(p, t);
}
writeFileSync(join(root, 'repart-log.txt'), log.join('\n') + '\n');
console.log('parts:', JSON.stringify(partMap));
console.log(`new chapters: ${INSERTS.reduce((s, g) => s + g.chapters.length, 0)}; part references relabelled: ${log.length} (repart-log.txt)`);
