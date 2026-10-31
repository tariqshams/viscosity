// The book's rules, enforced. Run: node scripts/check_chapters.mjs
//
//  1. Frontmatter is complete and chapter numbers / days are consistent.
//  2. Nothing is used before it is introduced (concept registry).
//  3. Code fits a phone: static code lines <= 44 chars, runnable/editable
//     code (examples, exercises, solutions) <= 40 chars.
//  4. 8–15 recall prompts per chapter, each used exactly once in the text.
//  5. Quiz: 5–8 questions, exactly one correct option each, an explanation
//     on every option, and the correct answer is not always in one position.
//  6. Every exercise's reference solution passes its own tests, and the
//     starter code does NOT (so the exercise actually asks for something).
//  7. Citations: every <Cite> and source is a verified bibliography entry.
//  8. The 15-minute budget: estimated time between 12 and 18 minutes.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { ASSUMED, CONCEPTS, knownBefore } from '../src/data/concepts.js';
import { OUTLINE } from '../src/data/outline/index.js';
import { references, pending } from '../src/data/references.js';
import { runWithTests } from '../src/lib/minitest.js';
import { runDrip, checkDripOutput } from '../src/lib/drip.js';
import { estimateMinutesExact, proseWords } from '../src/lib/minutes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content/chapters');
const STATIC_MAX = 44;
const RUN_MAX = 40;
const errors = [];
// Verified references: the main bibliography plus not-yet-merged files in
// src/data/refs-new/ (one per chapter, written by chapter authors).
const newRefs = [];
const newDir = join(root, 'src/data/refs-new');
if (existsSync(newDir)) {
  for (const f of readdirSync(newDir).filter((f) => f.endsWith('.js'))) {
    const m = await import(pathToFileURL(join(newDir, f)).href);
    for (const r of m.default ?? []) {
      for (const k of ['id', 'authors', 'title', 'url', 'accessed', 'checkedAgainst', 'shaped']) {
        if (!r[k]) errors.push(`refs-new/${f}: reference ${r.id ?? '?'} is missing "${k}"`);
      }
      newRefs.push(r);
    }
  }
}
const refIds = new Set([...references, ...newRefs].map((r) => r.id));
const pendingIds = new Set(pending.map((r) => r.id));

const warn = [];
const err = (ch, msg) => errors.push(`${ch}: ${msg}`);

const silent = { log() {}, info() {}, warn() {}, error() {}, table() {} };

const folders = readdirSync(dir).filter((d) => /^\d{3}-/.test(d)).sort();
let expectN = 1;
let prevN = 0;
const summary = [];
for (const folder of folders) {
  const mdxPath = join(dir, folder, 'index.mdx');
  const cardsPath = join(dir, folder, 'cards.js');
  if (!existsSync(mdxPath)) { err(folder, 'missing index.mdx'); continue; }
  if (!existsSync(cardsPath)) { err(folder, 'missing cards.js'); continue; }
  const mdx = readFileSync(mdxPath, 'utf8');
  const fm = parseYaml(mdx.match(/^---\n([\s\S]*?)\n---/)[1]);
  const body = mdx.replace(/^---[\s\S]*?---/, '');
  const cards = await import(pathToFileURL(cardsPath).href);

  // 1. numbering
  if (fm.n <= prevN) err(folder, `chapter number ${fm.n} is not after ${prevN}`);
  prevN = fm.n;
  if (Number(folder.slice(0, 3)) !== fm.n) err(folder, `folder number does not match n=${fm.n}`);
  if (fm.day !== Math.ceil(fm.n / 4)) err(folder, `day ${fm.day} should be ${Math.ceil(fm.n / 4)}`);
  expectN++;

  // 2. concepts: introduces must match the outline; uses must be known.
  const plan = OUTLINE.find((c) => c.n === fm.n);
  if (!plan) err(folder, `chapter ${fm.n} is not in the outline`);
  else {
    if (plan.title !== fm.title) err(folder, `title "${fm.title}" differs from the outline ("${plan.title}")`);
    const want = Object.keys(plan.introduces).sort().join(',');
    const got = [...(fm.introduces ?? [])].sort().join(',');
    if (want !== got) err(folder, `introduces [${got}] must match the outline [${want}]`);
  }
  const known = knownBefore(fm.n);
  for (const c of fm.uses ?? []) {
    if (!(c in ASSUMED) && !(c in CONCEPTS)) err(folder, `uses unknown concept "${c}"`);
    else if (!known.has(c)) err(folder, `uses "${c}" before it is introduced (chapter ${CONCEPTS[c]?.n})`);
  }

  // 3. code width
  const fences = body.match(/```[^\n]*\n[\s\S]*?```/g) ?? [];
  for (const f of fences) {
    for (const line of f.split('\n').slice(1, -1)) {
      if ([...line].length > STATIC_MAX) err(folder, `static code line longer than ${STATIC_MAX}: "${line}"`);
    }
  }
  const runnable = [];
  for (const [k, e] of Object.entries(cards.examples ?? {})) runnable.push([`example ${k}`, e.code]);
  for (const [k, e] of Object.entries(cards.exercises ?? {})) {
    runnable.push([`exercise ${k} starter`, e.starter], [`exercise ${k} solution`, e.solution]);
    for (const w of e.wrong ?? []) if (w.code) runnable.push([`exercise ${k} wrong attempt`, w.code]);
  }
  for (const [what, code] of runnable) {
    for (const line of code.split('\n')) {
      if ([...line].length > RUN_MAX) err(folder, `${what}: line longer than ${RUN_MAX}: "${line}"`);
    }
  }
  const mdCode = [...Object.values(cards.prompts).flatMap((p) => [p.q, p.a]), ...cards.quiz.map((q) => q.q)];
  for (const text of mdCode) {
    for (const block of text.match(/```[\s\S]*?```/g) ?? []) {
      for (const line of block.split('\n').slice(1, -1)) {
        if ([...line].length > STATIC_MAX) err(folder, `code in a card longer than ${STATIC_MAX}: "${line}"`);
      }
    }
  }

  // 4. prompts
  const promptKeys = Object.keys(cards.prompts);
  if (promptKeys.length < 8 || promptKeys.length > 15) err(folder, `${promptKeys.length} recall prompts (want 8–15)`);
  const used = [...body.matchAll(/<Prompts\s+ids=\{\[([^\]]*)\]\}/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  for (const k of promptKeys) {
    const count = used.filter((u) => u === k).length;
    if (count !== 1) err(folder, `prompt "${k}" is placed ${count} times in the text (want exactly 1)`);
  }
  for (const u of used) if (!promptKeys.includes(u)) err(folder, `<Prompts> names unknown prompt "${u}"`);
  for (const [k, p] of Object.entries(cards.prompts)) {
    if (!p.q?.trim() || !p.a?.trim()) err(folder, `prompt "${k}" needs both q and a`);
    if (p.a.length > 260) warn.push(`${folder}: prompt "${k}" answer is long (${p.a.length} chars); prompts should be atomic`);
  }

  // 5. quiz
  const quiz = cards.quiz;
  if (quiz.length < 5 || quiz.length > 8) err(folder, `${quiz.length} quiz questions (want 5–8)`);
  const positions = new Set();
  quiz.forEach((q, i) => {
    const correct = q.options.filter((o) => o.correct);
    if (correct.length !== 1) err(folder, `quiz ${i + 1}: ${correct.length} correct options (want exactly 1)`);
    q.options.forEach((o, j) => { if (!o.why?.trim()) err(folder, `quiz ${i + 1} option ${j + 1} has no explanation`); });
    if (q.options.length < 3) err(folder, `quiz ${i + 1}: fewer than 3 options`);
    positions.add(q.options.findIndex((o) => o.correct));
  });
  if (quiz.length >= 4 && positions.size < 2) err(folder, 'the correct quiz answer is always in the same position');
  if (!/<Quiz\s*\/>/.test(body)) err(folder, 'no <Quiz /> in the text');

  // 6. exercises
  const exKeys = Object.keys(cards.exercises ?? {});
  if (exKeys.length < 1) err(folder, 'no exercises');
  for (const [k, e] of Object.entries(cards.exercises ?? {})) {
    for (const f of ['title', 'prompt', 'starter', 'solution', 'tests', 'walkthrough']) if (!e[f]) err(folder, `exercise ${k} has no ${f}`);
    if (!e.hints?.length) err(folder, `exercise ${k} has no hints`);
    const isDrip = e.lang === 'drip' || e.lang === 'drip-vm';
    const runEx = async (code) => isDrip
      ? { results: checkDripOutput(await runDrip(code, e.lang), e.tests), error: null }
      : runWithTests(code, e.tests, silent);
    const sol = await runEx(e.solution);
    if (sol.error || !sol.results.length || sol.results.some((r) => !r.ok)) {
      err(folder, `exercise ${k}: reference solution fails its tests: ${sol.error ?? JSON.stringify(sol.results.filter((r) => !r.ok))}`);
    }
    const st = await runEx(e.starter);
    if (!st.error && st.results.length && st.results.every((r) => r.ok)) err(folder, `exercise ${k}: the starter code already passes every test`);
    for (const w of e.wrong ?? []) {
      if (!w.code) continue;
      const r = await runEx(w.code);
      if (!r.error && r.results.every((t) => t.ok)) err(folder, `exercise ${k}: a "wrong attempt" passes all tests, so it isn't wrong`);
    }
    if (!body.includes(`<Exercise id="${k}"`)) err(folder, `exercise "${k}" is never placed in the text`);
  }
  for (const k of Object.keys(cards.examples ?? {})) {
    if (!body.includes(`<Run id="${k}"`)) err(folder, `example "${k}" is never placed in the text`);
    const ex = cards.examples[k];
    if (ex.lang === 'drip' || ex.lang === 'drip-vm') {
      const r = await runDrip(ex.code, ex.lang);
      if (r.exitCode !== 0 && !ex.expectError) err(folder, `Drip example "${k}" fails: ${r.stderr.join(' ')}`);
    } else if (ex.lang !== 'ts') {
      const r = runWithTests(ex.code, '', silent);
      if (r.error && !ex.expectError) err(folder, `example "${k}" throws: ${r.error}`);
    }
  }

  // 7. citations
  for (const s of fm.sources) {
    if (pendingIds.has(s)) err(folder, `source "${s}" is still unverified (in pending)`);
    else if (!refIds.has(s)) err(folder, `source "${s}" is not in the bibliography`);
  }
  for (const m of body.matchAll(/<Cite id="([^"]+)"/g)) {
    if (!fm.sources.includes(m[1])) err(folder, `<Cite id="${m[1]}"> is not listed in this chapter's sources`);
  }
  if (!/<Figure|client:visible/.test(body)) err(folder, 'no diagram');

  // 8. time budget
  const minutes = estimateMinutesExact(mdx, cards);
  if (minutes < 12 || minutes > 18) err(folder, `estimated ${minutes.toFixed(1)} minutes (want 12–18)`);
  summary.push(`${folder.padEnd(28)} ${minutes.toFixed(1).padStart(5)} min · ${proseWords(mdx)} words · ${promptKeys.length} prompts · ${quiz.length} quiz · ${exKeys.length} exercises`);
}

console.log(summary.join('\n'));
for (const w of warn) console.log(`warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAll ${folders.length} chapters follow the book's rules.`);
