// Reorder the book into Prelude / Core / Deep dives (scripts/restructure/map.js).
//
//   node scripts/restructure/restructure.mjs [--dry-run]
//
// Each new chapter is built from its old chapters: for a merge, their MDX
// bodies are joined (with a marker comment per source) and their cards are
// combined, renaming any card key, diagram file or imported name that two
// sources share. Writers then rewrite merged chapters into one. It also:
//   - writes the new outline (src/data/outline/part1.js ... partN.js);
//   - rewrites chapter links, diagram imports and "chapter N" references in
//     the book, its data, and the docs site;
//   - appends an explicit map to src/data/renumbering.js (saved reviews and
//     progress migrate in the browser) and redirects every URL that was ever
//     live to the chapter it now belongs to.
// Old chapter numbers that feed several new chapters (remnants, '80r' in the
// map) count as moved to their first, non-remnant home.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, statSync, renameSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PARTS } from './map.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repo = join(root, '..');
const dry = process.argv.includes('--dry-run');
const PER_DAY = 4;
const pad = (n) => String(n).padStart(3, '0');
const chaptersDir = join(root, 'src/content/chapters');
const diagramsDir = join(root, 'src/components/diagrams');
const outlineDir = join(root, 'src/data/outline');
const log = [];

// --- the old book -------------------------------------------------------------
const { OUTLINE: OLD_OUTLINE } = await import(pathToFileURL(join(outlineDir, 'index.js')).href);
const oldIntro = Object.fromEntries(OLD_OUTLINE.map((c) => [c.n, c.introduces ?? {}]));
const oldFolder = Object.fromEntries(readdirSync(chaptersDir).filter((f) => /^\d{3}-/.test(f)).map((f) => [Number(f.slice(0, 3)), f]));

function parseChapter(n) {
  const folder = oldFolder[n];
  const mdx = readFileSync(join(chaptersDir, folder, 'index.mdx'), 'utf8');
  const m = mdx.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fmText = m[1];
  const body = m[2];
  const scalar = (k) => fmText.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1];
  const list = (k) => (fmText.match(new RegExp(`^${k}: \\[(.*)\\]`, 'm'))?.[1] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const objectives = [...(fmText.match(/^objectives:\n((?:  - .*\n?)+)/m)?.[1] ?? '').matchAll(/^  - (.*)$/gm)].map((x) => x[1]);
  const imports = [...body.matchAll(/^import .*$/gm)].map((x) => x[0]);
  const rest = body.replace(/^import .*\n?/gm, '');
  return { n, folder, slug: folder.slice(4), title: scalar('title'), tagline: scalar('tagline'), objectives, introduces: list('introduces'), uses: list('uses'), sources: list('sources'), imports, body: rest };
}

const unquote = (s) => (s ?? '').replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1').replace(/\\'/g, "'");
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const slugify = (t) => t.toLowerCase().replace(/&/g, 'and').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');

// --- the new book ------------------------------------------------------------------
const NEW = [];
const sectionDay = {};
for (const part of PARTS) {
  for (const ch of part.chapters) {
    const n = NEW.length + 1;
    const i = sectionDay[part.section] ?? 0;
    sectionDay[part.section] = i + 1;
    const src = ch.from.map((f) => (typeof f === 'string' ? { n: Number(f.slice(0, -1)), remnant: true } : { n: f, remnant: false }));
    const first = src[0] ? parseChapter(src[0].n) : null;
    const title = ch.title ?? unquote(first?.title);
    const slug = ch.title === null && src.length === 1 && !src[0].remnant ? first.slug : slugify(title);
    NEW.push({ n, part, title, slug, folder: `${pad(n)}-${slug}`, day: Math.floor(i / PER_DAY) + 1, src });
  }
}
// Where each old chapter now lives (its first non-remnant home).
const home = {};
for (const c of NEW) for (const s of c.src) if (!s.remnant && home[s.n] == null) home[s.n] = c;
for (let n = 1; n <= Math.max(...Object.keys(oldFolder).map(Number)); n++) if (oldFolder[n] && !home[n]) throw new Error(`old chapter ${n} has no home`);

// --- build each chapter into a staging area ----------------------------------------
const stage = join(root, 'src/content/.restructure');
const stageDiag = join(root, 'src/components/.restructure-diagrams');
if (!dry) { rmSync(stage, { recursive: true, force: true }); rmSync(stageDiag, { recursive: true, force: true }); mkdirSync(stage, { recursive: true }); mkdirSync(stageDiag, { recursive: true }); }

const owner = new Map(); // concept -> new n (first introducer in book order)
const keyRenames = {}; // `${oldN}.${key}` -> new key (prompts only matter for saved reviews)

function toJs(v, ind = '') {
  const next = ind + '  ';
  if (typeof v === 'string') {
    if (v.includes('\n')) return '`' + v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
    return q(v);
  }
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => next + toJs(x, next)).join(',\n')},\n${ind}]` : '[]';
  const ks = Object.keys(v);
  if (!ks.length) return '{}';
  return `{\n${ks.map((k) => `${next}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : q(k)}: ${toJs(v[k], next)}`).join(',\n')},\n${ind}}`;
}

const pathFix = (text) => text
  .replace(/(chapters\/)(\d{3})(-[a-z0-9-]+)/g, (all, a, n) => (home[Number(n)] ? `${a}${home[Number(n)].folder}` : all))
  .replace(/(\.\.\/ch)(\d{3})(?=\/)/g, (all, a, n) => (home[Number(n)] ? `${a}${pad(home[Number(n)].n)}` : all));

for (const c of NEW) {
  const outDir = join(stage, c.folder);
  const outDiag = join(stageDiag, `ch${pad(c.n)}`);
  if (!dry) mkdirSync(outDir, { recursive: true });
  const parsed = c.src.map((s) => ({ ...s, ch: parseChapter(s.n) }));
  const cards = { prompts: {}, quiz: [], exercises: {}, examples: {} };
  const usedFiles = new Set();
  const usedIds = new Set();
  const imports = [];
  const bodies = [];
  const introduces = [];
  const uses = [];
  const sources = [];
  const objectives = [];
  for (const { n, remnant, ch } of parsed) {
    let body = ch.body;
    // Cards, renaming keys another source already used.
    const mod = await import(pathToFileURL(join(chaptersDir, ch.folder, 'cards.js')).href);
    for (const kind of ['prompts', 'exercises', 'examples']) {
      for (const [k, v] of Object.entries(mod[kind] ?? {})) {
        let key = k;
        if (key in cards[kind]) {
          key = `${k}-o${n}`;
          const re = new RegExp(`(['"])${k.replace(/[-]/g, '\\-')}\\1`, 'g');
          body = body.replace(/<(Prompts|Exercise|Run)\b[^>]*>/g, (tag) => tag.replace(re, `$1${key}$1`));
          if (kind === 'prompts' && !remnant) keyRenames[`${n}.${k}`] = key;
          log.push(`key  ${c.folder}: ${kind} ${k} (from ${n}) -> ${key}`);
        }
        cards[kind][key] = v;
      }
    }
    cards.quiz.push(...(mod.quiz ?? []));
    // Diagrams: copy the old chapter's folder, renaming files and names that clash.
    const dOld = join(diagramsDir, `ch${pad(n)}`);
    const fileMap = {};
    if (existsSync(dOld)) {
      for (const f of readdirSync(dOld)) {
        let to = f;
        if (usedFiles.has(f)) { to = f.replace(/(\.[a-z]+)$/, `_o${n}$1`); log.push(`file ${c.folder}: ${f} (from ${n}) -> ${to}`); }
        usedFiles.add(to);
        fileMap[f.replace(/\.[a-z]+$/, '')] = to.replace(/\.[a-z]+$/, '');
      }
      if (!dry) {
        mkdirSync(outDiag, { recursive: true });
        for (const f of readdirSync(dOld)) {
          let text = readFileSync(join(dOld, f), 'utf8');
          text = text.replace(/(from\s+['"]\.\/)([^'"]+)(['"])/g, (all, a, name, b) => `${a}${fileMap[name] ?? name}${b}`);
          text = pathFix(text);
          const to = fileMap[f.replace(/\.[a-z]+$/, '')] + (f.match(/\.[a-z]+$/)?.[0] ?? '');
          writeFileSync(join(outDiag, to), text);
        }
      }
    }
    for (let line of ch.imports) {
      line = line.replace(new RegExp(`(components/diagrams/)ch${pad(n)}/([^'"]+)`), (all, a, name) => `${a}ch${pad(c.n)}/${fileMap[name] ?? name}`);
      line = pathFix(line).replace(/(components\/diagrams\/)ch(\d{3})\//, (all, a, m) => (Number(m) === n ? all : home[Number(m)] ? `${a}ch${pad(home[Number(m)].n)}/` : all));
      const id = line.match(/^import\s+(\w+)\s+from/)?.[1];
      if (id && usedIds.has(id)) {
        const re = imports.find((x) => x === line);
        if (re) continue; // the very same import: keep one
        const nid = `${id}O${n}`;
        line = line.replace(new RegExp(`^import\\s+${id}\\b`), `import ${nid}`);
        body = body.replace(new RegExp(`<(/?)${id}\\b`, 'g'), `<$1${nid}`).replace(new RegExp(`\\{${id}\\}`, 'g'), `{${nid}}`);
        log.push(`name ${c.folder}: ${id} (from ${n}) -> ${nid}`);
      }
      if (id) usedIds.add(id);
      if (!imports.includes(line)) imports.push(line);
    }
    for (const k of ch.introduces) if (!introduces.includes(k)) introduces.push(k);
    for (const k of ch.uses) if (!uses.includes(k)) uses.push(k);
    for (const k of ch.sources) if (!sources.includes(k)) sources.push(k);
    for (const o of ch.objectives) if (!objectives.includes(o)) objectives.push(o);
    if (parsed.length > 1) body = `{/* ── merge: from old chapter ${n}${remnant ? ' (remnant: keep only what goes beyond the core)' : ''}, ${unquote(ch.title)} ── */}\n\n${body.trim()}\n`;
    else if (remnant) body = `{/* ── remnant of old chapter ${n}: keep only what goes beyond the core ── */}\n\n${body.trim()}\n`;
    bodies.push(body);
  }
  // A concept belongs to its first introducer in the new order.
  const own = introduces.filter((k) => { if (owner.has(k)) return false; owner.set(k, c.n); return true; });
  const usesAll = [...uses, ...introduces.filter((k) => !own.includes(k))].filter((k, i, a) => !own.includes(k) && a.indexOf(k) === i);
  // One quiz per chapter: keep the last <Quiz /> tag.
  let body = bodies.join('\n');
  const quizTags = [...body.matchAll(/^<Quiz\s*\/>\s*$/gm)];
  if (quizTags.length > 1) { let seen = 0; body = body.replace(/^<Quiz\s*\/>\s*$/gm, () => (++seen < quizTags.length ? '' : '<Quiz />')); }
  const first = parsed[0]?.ch;
  const fm = [
    '---',
    `n: ${c.n}`,
    `day: ${c.day}`,
    `part: ${c.part.id}`,
    `title: ${q(c.title)}`,
    `tagline: ${first ? first.tagline : q('TODO: one sentence on what this chapter gives the reader.')}`,
    'objectives:',
    ...(objectives.length >= 2 ? objectives : ['TODO: first objective.', 'TODO: second objective.']).map((o) => `  - ${o}`),
    `introduces: [${own.join(', ')}]`,
    `uses: [${usesAll.join(', ')}]`,
    `sources: [${sources.join(', ')}]`,
    '---',
  ].join('\n');
  const mdx = `${fm}\n${imports.join('\n')}${imports.length ? '\n' : ''}\n${pathFix(body).trim()}\n`;
  const cardsJs = `// Chapter ${c.n} cards: recall prompts, examples, exercises and quiz.\n// Keys are stable ids: renaming one would orphan readers' review history.\n${parsed.length > 1 ? `// Merged from old chapters ${parsed.map((p) => p.n).join(', ')}.\n` : ''}\n${['prompts', 'examples', 'exercises'].map((k) => `export const ${k} = ${toJs(cards[k])};\n`).join('\n')}\nexport const quiz = ${toJs(cards.quiz)};\n`;
  if (!dry) { writeFileSync(join(outDir, 'index.mdx'), mdx); writeFileSync(join(outDir, 'cards.js'), cardsJs); }
  c.introduces = Object.fromEntries(own.map((k) => [k, parsed.map((p) => oldIntro[p.n]?.[k]).find(Boolean) ?? k]));
}

// --- the outline --------------------------------------------------------------------
const outFiles = [];
PARTS.forEach((part, i) => {
  const chs = NEW.filter((c) => c.part === part);
  const days = [...new Set(chs.map((c) => c.day))];
  const lo = Math.min(...days), hi = Math.max(...days);
  const lines = chs.map((c) => {
    const intro = Object.entries(c.introduces);
    const body = intro.length ? `{\n${intro.map(([k, v]) => `      ${/^[a-z][a-z0-9]*$/.test(k) ? k : q(k)}: ${q(v)},`).join('\n')}\n    }` : '{}';
    return `    { n: ${c.n}, title: ${q(c.title)}, introduces: ${body} },`;
  });
  const file = `part${i + 1}.js`;
  outFiles.push(file);
  const text = `export default {\n  id: ${q(part.id)}, section: ${q(part.section)}, days: ${q(lo === hi ? `${lo}` : `${lo}–${hi}`)}, title: ${q(part.title)},\n  blurb: ${q(part.blurb)},\n  chapters: [\n${lines.join('\n')}\n  ],\n};\n`;
  if (!dry) writeFileSync(join(outlineDir, `${file}.new`), text);
});

// --- text references across the book and the docs ------------------------------------------
const OTHER_BOOK = /(Rust Programming Language|the Book\b(?! *[’']s)|Crafting Interpreters|Dragon|Engineering a Compiler|Modern Compiler|Types and Programming|Handbook|SSA-based|Muchnick|Rustonomicon|Nomicon|Appel|Aho|Cooper and Torczon|Hennessy|Patterson|Drepper|Knuth|Ullman)\b[^.]*$/;
const REF = /\b([Cc]hapters?)(\s+)(\d{1,3}(?:\s*(?:–|-|,|and|or|to|through)\s*\d{1,3})*)/g;
const refFix = (text, where) => text.replace(REF, (all, word, sp, nums, offset) => {
  const before = text.slice(Math.max(0, offset - 80), offset);
  if (OTHER_BOOK.test(before)) return all;
  const out = nums.replace(/\d{1,3}/g, (d) => (home[Number(d)] ? String(home[Number(d)].n) : d));
  if (out !== nums) log.push(`ref  ${where}: ${all} -> ${word}${sp}${out}`);
  return `${word}${sp}${out}`;
});
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
const EXTS = ['.mdx', '.md', '.js', '.mjs', '.ts', '.tsx', '.astro'];
const SKIP = (p) => p.startsWith(chaptersDir) || p.startsWith(diagramsDir) || p.startsWith(outlineDir) || /src\/data\/(renumbering|redirects|published)\.js$/.test(p);
const others = [...walk(join(root, 'src'), EXTS), ...walk(join(repo, 'website/src/content'), ['.md', '.mdx'])].filter((p) => !SKIP(p));
// The staged chapters and diagrams get the same treatment.
const staged = dry ? [] : [...walk(stage, EXTS), ...walk(stageDiag, EXTS)];
for (const p of [...others, ...staged]) {
  const s = readFileSync(p, 'utf8');
  const t = pathFix(refFix(s, relative(repo, p)));
  if (t !== s && !dry) writeFileSync(p, t);
}

// --- migration and redirects ------------------------------------------------------------------
const renumPath = join(root, 'src/data/renumbering.js');
const { RENUMBERINGS } = await import(pathToFileURL(renumPath).href);
const map = Object.fromEntries(Object.keys(home).map((n) => [n, home[n].n]));
const steps = [...RENUMBERINGS, { map, keys: keyRenames }];
const { REDIRECTS } = await import(pathToFileURL(join(root, 'src/data/redirects.js')).href);
const { PUBLISHED } = await import(pathToFileURL(join(root, 'src/data/published.js')).href);
const published = new Set(PUBLISHED);
try {
  const out = execFileSync('git', ['-C', repo, 'ls-tree', '--name-only', 'origin/main', 'book/src/content/chapters/'], { encoding: 'utf8' });
  for (const l of out.split('\n')) if (l.trim()) published.add(l.trim().split('/').pop());
} catch { /* the stored list is enough */ }
const slugNow = (slug) => { const n = Number(slug.slice(0, 3)); return home[n] && oldFolder[n] === slug ? home[n].folder : null; };
const redirects = {};
for (const [from, to] of Object.entries(REDIRECTS)) {
  const s = to.split('/')[2];
  redirects[from] = `/chapters/${slugNow(s) ?? s}/`;
}
for (const f of published) { const now = slugNow(f); if (now && now !== f) redirects[`/chapters/${f}/`] = `/chapters/${now}/`; }
const newFolders = new Set(NEW.map((c) => c.folder));
for (const from of Object.keys(redirects)) if (newFolders.has(from.split('/')[2])) delete redirects[from];
for (const [from, to] of Object.entries(redirects)) if (!newFolders.has(to.split('/')[2])) throw new Error(`redirect ${from} -> ${to} lands nowhere`);

// --- swap in ------------------------------------------------------------------
if (!dry) {
  for (const f of readdirSync(chaptersDir)) rmSync(join(chaptersDir, f), { recursive: true, force: true });
  for (const f of readdirSync(stage)) renameSync(join(stage, f), join(chaptersDir, f));
  rmSync(stage, { recursive: true, force: true });
  for (const f of readdirSync(diagramsDir).filter((x) => /^ch\d{3}/.test(x))) rmSync(join(diagramsDir, f), { recursive: true, force: true });
  for (const f of readdirSync(stageDiag)) renameSync(join(stageDiag, f), join(diagramsDir, f));
  rmSync(stageDiag, { recursive: true, force: true });
  for (const f of readdirSync(outlineDir).filter((x) => /^part\d+\.js$/.test(x))) rmSync(join(outlineDir, f));
  for (const f of outFiles) renameSync(join(outlineDir, `${f}.new`), join(outlineDir, f));
  writeFileSync(join(outlineDir, 'index.js'), `// The whole curriculum, one file per part, in reading order: the Prelude,\n// the 30-day Core, then the Deep dives (each part says its section).\n${outFiles.map((f, i) => `import p${i + 1} from './${f}';`).join('\n')}\nexport const PARTS = [${outFiles.map((_, i) => `p${i + 1}`).join(', ')}];\nexport const OUTLINE = PARTS.flatMap((p) => p.chapters.map((c) => ({ ...c, part: p.id, section: p.section, track: p.section })));\n`);
  const banner = (what) => `// Generated by scripts/renumber.mjs and scripts/restructure; do not edit by hand.\n// ${what}\n`;
  writeFileSync(renumPath, `${banner('Every renumbering so far, in order: a shift ({ after, by }) or an explicit map ({ map, keys }). src/lib/renumber.ts uses it to migrate saved progress.')}export const RENUMBERINGS = ${JSON.stringify(steps, null, 2)};\n`);
  writeFileSync(join(root, 'src/data/published.js'), `// Chapter folders that have been live at viscosity.dev/book (from origin/main).\n// Redirects are kept only for these.\nexport const PUBLISHED = ${JSON.stringify([...published].sort(), null, 2)};\n`);
  writeFileSync(join(root, 'src/data/redirects.js'), `${banner('Old chapter URLs (under the /book base) and where they live now. astro.config.mjs turns these into redirects.')}export const REDIRECTS = ${JSON.stringify(redirects, null, 2)};\n`);
}
writeFileSync(join(root, 'restructure-log.txt'), log.join('\n') + '\n');
const sections = NEW.reduce((a, c) => ({ ...a, [c.part.section]: (a[c.part.section] ?? 0) + 1 }), {});
console.log(`${dry ? '[dry run] ' : ''}${NEW.length} chapters ${JSON.stringify(sections)}; ${Object.keys(redirects).length} redirects; ${Object.keys(keyRenames).length} card keys renamed; ${log.filter((l) => l.startsWith('ref ')).length} text references rewritten.`);
