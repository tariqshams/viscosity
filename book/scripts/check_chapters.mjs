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
// 10. Teaching rules (src/data/pedagogy.js, PEDAGOGY.md): analogies that say
//     where they break, at least two diagrams (one steppable), several
//     examples of every concept introduced, other-language comparisons in
//     Part I. Errors in parts listed in STRICT_PARTS, warnings elsewhere.
// 11. No banned words and no em dashes in prose, anywhere.
//  9. Internal links in MDX (chapters and front matter) start with the base
//     path /book/, where the book is served (https://viscosity.dev/book/).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { ASSUMED, CONCEPTS, knownBefore } from '../src/data/concepts.js';
import { OUTLINE } from '../src/data/outline/index.js';
import { references, pending } from '../src/data/references.js';
import { runWithTests } from '../src/lib/minitest.js';
import { checkDripOutput } from '../src/lib/drip.js';
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync as writeFile } from 'node:fs';
import { tmpdir } from 'node:os';
import { compile as compileMdx, createProcessor } from '@mdx-js/mdx';
import { testCrate, parseTestOutput } from '../src/lib/rust.js';

// Rust is compiled locally with rustc (the browser uses the Rust Playground).
const rustDir = mkdtempSync(join(tmpdir(), 'book-rust-'));
// Compiled Rust binaries add up (hundreds of MB per run): remove them on exit.
process.on('exit', () => { try { rmSync(rustDir, { recursive: true, force: true }); } catch {} });
// ...also when interrupted (Ctrl-C, a killed CI job), which skips 'exit'.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(130));
let rustN = 0;
function runRust(code, tests) {
  const n = rustN++;
  const file = join(rustDir, `c${n}.rs`);
  const bin = join(rustDir, `c${n}`);
  writeFile(file, tests ? testCrate(code, tests) : code);
  try {
    execFileSync('rustc', ['--edition', '2021', ...(tests ? ['--test'] : []), '-A', 'dead_code', '-A', 'unused', '-o', bin, file], { stdio: 'pipe', timeout: 120000 });
  } catch (e) {
    return { results: [], error: `compile error: ${String(e.stderr ?? e).split('\n').slice(0, 6).join(' ')}` };
  }
  try {
    const out = execFileSync(bin, [], { encoding: 'utf8', stdio: 'pipe', timeout: 20000 });
    return { results: tests ? parseTestOutput(out) : [], error: null, stdout: out };
  } catch (e) {
    const out = String(e.stdout ?? '');
    return { results: tests ? parseTestOutput(out) : [], error: tests ? null : `runtime error: ${String(e.stderr ?? e).slice(0, 200)}`, stdout: out };
  }
}

// Drip programs run in a worker with a time limit, so an exercise that
// loops forever fails the check instead of hanging it.
const dripLib = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/drip.js')).href;
function runDrip(code, lang) {
  return new Promise((resolve) => {
    const w = new Worker(`import(${JSON.stringify(dripLib)}).then(async (m) => {
      const { parentPort, workerData } = await import('node:worker_threads');
      parentPort.postMessage(await m.runDrip(workerData.code, workerData.lang));
    });`, { eval: true, workerData: { code, lang } });
    const t = setTimeout(() => { w.terminate(); resolve({ stdout: [], stderr: ['timed out after 10 seconds'], exitCode: 70 }); }, 10000);
    w.on('message', (r) => { clearTimeout(t); w.terminate(); resolve(r); });
    w.on('error', (e) => { clearTimeout(t); resolve({ stdout: [], stderr: [String(e)], exitCode: 70 }); });
  });
}
import { transform as sucrase } from 'sucrase';

// TypeScript cards are stripped of types exactly as the browser runner does.
const stripTs = (code) => sucrase(code, { transforms: ['typescript'], disableESTransforms: true }).code;
import { estimateMinutesExact, proseWords, hardWordShare } from '../src/lib/minutes.js';
import { COVERAGE } from '../src/data/coverage.js';
import { STRICT_PARTS, MIN_ANALOGIES, MIN_DIAGRAMS, MIN_EXAMPLES, OTHER_LANGUAGE_PARTS, BANNED } from '../src/data/pedagogy.js';

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

// 9. A root-relative link must be under the base path, or it 404s in
// production: write [x](/book/days/), not [x](/days/).
const LINK_BASE = '/book/';
function checkLinks(where, body) {
  const prose = body.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
  for (const m of prose.matchAll(/\]\((\/[^)\s]*)|\bhref=["'{`]+(\/[^"'`}\s]*)/g)) {
    const link = m[1] ?? m[2];
    if (!link.startsWith('//') && !link.startsWith(LINK_BASE)) err(where, `link ${link} is outside the base path: write ${LINK_BASE}${link.replace(/^\/+/, '')}`);
  }
}
// 11. Words the book never uses, and no em dashes outside code.
const proseOnly = (text) => text.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
function checkWords(where, text) {
  for (const re of BANNED) if (re.test(text)) err(where, `uses the banned word or phrase ${re}`);
  if (proseOnly(text).includes('\u2014')) err(where, 'has an em dash in prose: use a comma, semicolon, colon or brackets instead');
}
for (const f of readdirSync(join(root, 'src/content/front')).filter((f) => f.endsWith('.mdx'))) {
  const text = readFileSync(join(root, 'src/content/front', f), 'utf8');
  checkLinks(`front/${f}`, text);
  checkWords(`front/${f}`, text);
}
const diagramsDir = join(root, 'src/components/diagrams');

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

  // Prose like {B} is a JS expression in MDX: it renders "B is not defined".
  {
    const tree = createProcessor().parse(body);
    const declared = new Set([...body.matchAll(/^(?:import|export)\s[^\n]*?\b([A-Za-z_$][\w$]*)\b/gm)].map((x) => x[1]));
    for (const m of body.matchAll(/^import\s+\{?([^}\n]*?)\}?\s+from/gm)) for (const n of m[1].split(/[\s,]+/)) if (n) declared.add(n);
    const walk = (n) => {
      if ((n.type === 'mdxTextExpression' || n.type === 'mdxFlowExpression') && /^\s*[A-Za-z_$][\w$.]*\s*$/.test(n.value) && !declared.has(n.value.trim().split('.')[0])) {
        err(folder, `prose {${n.value.trim()}} near line ${n.position.start.line} is a JS expression, not text: escape it as \\{${n.value.trim()}\\}`);
      }
      for (const c of n.children ?? []) walk(c);
    };
    walk(tree);
  }
  checkLinks(folder, body);
  // MDX must compile (stray { } or < in prose break the build).
  try { await compileMdx(body); }
  catch (e) {
    const ln = (e.place?.start?.line ?? e.place?.line ?? e.line ?? 0) + (mdx.match(/^---[\s\S]*?---/)[0].split('\n').length - 1);
    err(folder, `MDX does not compile near line ${ln}: ${String(e.reason ?? e.message).split('\n')[0]} (escape literal braces as \\{ \\} and < as &lt;)`);
  }

  // 0. frontmatter types (what Astro's schema will demand)
  if (Array.isArray(fm.sources) && fm.sources.length === 0) err(folder, 'frontmatter "sources" must list at least one reference (the content schema requires it)');
  for (const k of ['objectives', 'introduces', 'uses', 'sources']) {
    if (!Array.isArray(fm[k]) || fm[k].some((x) => typeof x !== 'string')) err(folder, `frontmatter "${k}" must be a list of plain strings (quote items containing ": ")`);
  }
  for (const k of ['title', 'tagline', 'part']) if (typeof fm[k] !== 'string') err(folder, `frontmatter "${k}" must be a string`);

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
    const runEx = async (code) => e.lang === 'rust'
      ? runRust(code, e.tests)
      : isDrip
      ? { results: checkDripOutput(await runDrip(code, e.lang), e.tests), error: null }
      : runWithTests(e.lang === 'ts' ? stripTs(code) : code, e.tests, silent);
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
    if (ex.lang === 'rust') {
      const r = runRust(ex.code, null);
      if (r.error && !ex.expectError) err(folder, `Rust example "${k}" fails: ${r.error}`);
      if (!r.error && ex.expectError) err(folder, `Rust example "${k}" is marked expectError but compiles and runs`);
    } else if (ex.lang === 'drip' || ex.lang === 'drip-vm') {
      const r = await runDrip(ex.code, ex.lang);
      if (r.exitCode !== 0 && !ex.expectError) err(folder, `Drip example "${k}" fails: ${r.stderr.join(' ')}`);
      if (r.exitCode === 0 && ex.expectError) err(folder, `Drip example "${k}" is marked expectError but succeeds`);
    } else {
      const r = runWithTests(ex.lang === 'ts' ? stripTs(ex.code) : ex.code, '', silent);
      if (r.error && !ex.expectError) err(folder, `example "${k}" throws: ${r.error}`);
      if (!r.error && ex.expectError) err(folder, `example "${k}" is marked expectError but runs without an error`);
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

  // 10. teaching rules
  {
    const strict = STRICT_PARTS.has(fm.part);
    const teach = (msg) => (strict ? err(folder, msg) : warn.push(`${folder}: ${msg}`));
    const analogies = [...body.matchAll(/<Analogy\b[^>]*>([\s\S]*?)<\/Analogy>/g)];
    const honest = analogies.filter((a) => /<span slot="breaks">\s*\S[\s\S]*?<\/span>/.test(a[1]));
    if (honest.length < analogies.length) err(folder, `${analogies.length - honest.length} <Analogy> block(s) without a non-empty <span slot="breaks">`);
    if (honest.length < MIN_ANALOGIES) teach(`${honest.length} analogies (want at least ${MIN_ANALOGIES}, each saying where it breaks)`);
    const diagrams = [...body.matchAll(/^import\s+\w+\s+from\s+'[^']*components\/diagrams\/([^']+)'/gm)].map((m) => m[1]);
    if (diagrams.length < MIN_DIAGRAMS) teach(`${diagrams.length} diagram(s) (want at least ${MIN_DIAGRAMS})`);
    const steppable = diagrams.some((d) => {
      const f = [join(diagramsDir, `${d}.tsx`), join(diagramsDir, `${d}.ts`), join(diagramsDir, d)].find((x) => existsSync(x) && x.match(/\.tsx?$/));
      return f && /viz\/stepper|useStepper|<Stepper/.test(readFileSync(f, 'utf8'));
    });
    if (!steppable) teach('no steppable diagram (one diagram should use components/viz/stepper)');
    const blocks = [...body.matchAll(/<Examples\s+of="([^"]+)"[^>]*>([\s\S]*?)<\/Examples>/g)];
    const covered = new Set();
    for (const [, of, inner] of blocks) {
      const n = (inner.match(/^```/gm) ?? []).length / 2 + (inner.match(/<Run\s/g) ?? []).length;
      if (n < MIN_EXAMPLES) teach(`<Examples of="${of}"> has ${n} example(s) (want at least ${MIN_EXAMPLES})`);
      for (const c of of.split(/\s+/)) {
        if (!(fm.introduces ?? []).includes(c) && !(c in CONCEPTS) && !(c in ASSUMED)) err(folder, `<Examples of="${of}"> names unknown concept "${c}"`);
        covered.add(c);
      }
    }
    const uncovered = (fm.introduces ?? []).filter((c) => !covered.has(c));
    if (uncovered.length) teach(`no <Examples> for: ${uncovered.join(', ')}`);
    if (OTHER_LANGUAGE_PARTS.has(fm.part) && !/<OtherLanguages\b/.test(body)) teach('no <OtherLanguages> comparison');
    for (const m of body.matchAll(/<Formal\b[^>]*>([\s\S]*?)<\/Formal>/g)) {
      if (!/<span slot="read">\s*\S/.test(m[1])) err(folder, '<Formal> without a plain-words <span slot="read">');
    }
  }
  checkWords(folder, body);
  for (const t of [...Object.values(cards.prompts).flatMap((p) => [p.q, p.a]), ...cards.quiz.flatMap((q) => [q.q, ...q.options.flatMap((o) => [o.t, o.why])])]) {
    for (const re of BANNED) if (re.test(t)) err(folder, `a card uses the banned word or phrase ${re}`);
  }

  // 8. time budget
  const minutes = estimateMinutesExact(mdx, cards);
  if (minutes < 12 || minutes > 18) err(folder, `estimated ${minutes.toFixed(1)} minutes (want 12–18)`);
  summary.push(`${folder.padEnd(28)} ${minutes.toFixed(1).padStart(5)} min · ${proseWords(mdx)} words · ${(hardWordShare(mdx) * 100).toFixed(1).padStart(4)}% hard words · ${promptKeys.length} prompts · ${quiz.length} quiz · ${exKeys.length} exercises`);
}

// 12. Coverage: every concept the textbook map (src/data/coverage.js) names
// must be taught by some chapter of the outline.
{
  const written = new Set(folders.map((f) => Number(f.slice(0, 3))));
  let done = 0;
  for (const [book, ch, title, concepts] of COVERAGE) {
    const missing = concepts.filter((c) => !(c in CONCEPTS));
    if (missing.length) err(`coverage ${book} ${ch}`, `"${title}" names concepts no chapter introduces: ${missing.join(', ')}`);
    else if (concepts.every((c) => written.has(CONCEPTS[c].n))) done++;
  }
  summary.push(`\nCoverage: ${done} of ${COVERAGE.length} textbook chapters are fully taught by chapters already written.`);
}

console.log(summary.join('\n'));
for (const w of warn) console.log(`warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAll ${folders.length} chapters follow the book's rules.`);
