// End-to-end smoke test of the built site in Chromium, at iPhone 17 Pro Max
// size (440 x 956). Run after `npm run build`.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serve } from './lib/serve.mjs';
import { chromium, IPHONE } from './lib/playwright.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
// Chapters are found by slug, not number: numbers move when chapters are
// inserted (scripts/renumber.mjs), and exercises move when chapters split.
const chaptersDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/content/chapters');
const { readdirSync: ls } = await import('node:fs');
const chapterBySlug = (slug) => {
  const d = ls(chaptersDir).find((f) => f.slice(4) === slug);
  if (!d) throw new Error(`smoke: no chapter with slug ${slug}`);
  return d;
};
// The first chapter whose text contains a pattern (so checks survive renames).
const chapterWith = (re) => {
  const d = ls(chaptersDir).sort().find((f) => re.test(readFileSync(join(chaptersDir, f, 'index.mdx'), 'utf8')));
  if (!d) throw new Error(`smoke: no chapter matching ${re}`);
  return d;
};
const REFS = chapterBySlug('references');
const { BOOK } = await import('../src/data/book.js');
// What the refs-play example prints when the same harness runs it in Node:
// the browser runner must show exactly this.
const { runWithTestsAsync } = await import('../src/lib/minitest.js');
const { formatArgs } = await import('../src/lib/format.js');
const refsCards = await import(pathToFileURL(join(chaptersDir, REFS, 'cards.js')).href);
const [EX_ID, EX] = Object.entries(refsCards.exercises).find(([, e]) => !e.optional);
const REFS_PLAY_OUT = await (async () => {
  const lines = [];
  const log = (...a) => lines.push(formatArgs(a));
  await runWithTestsAsync(refsCards.examples['refs-play'].code, '', { log, info: log, warn: log, error: log, table: log });
  return lines.join('\n');
})();
const PROMPT_ID = `${Number(REFS.slice(0, 3))}.${Object.keys(refsCards.prompts)[0]}`;
// A plain-text piece of that prompt's question, to find it on the review page.
const PROMPT_Q = Object.values(refsCards.prompts)[0].q.split(/[`*_\[\]()]/).sort((a, b) => b.length - a.length)[0].trim().slice(0, 24);
// url is the book's root, under its base path: http://127.0.0.1:PORT/book
const { server, url: origin, base } = await serve(dist);
const url = origin + base.slice(0, -1);
const browser = await chromium.launch();
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? '✓' : '✗'} ${msg}`); };

// Extra material sits in closed <details> dropdowns (<More>, extra analogies,
// <OtherLanguages>, <Formal>); open any around an element before using it.
async function openDropdowns(loc) {
  await loc.evaluate((el) => { for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true; });
}
async function newPage(opts = IPHONE) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)|pagefind/.test(r.url())) errors.push(`request failed: ${r.url()}`); });
  return { ctx, page, errors };
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

// 1. Every page: no console errors, no sideways scrolling on a phone.
import { readdirSync, readFileSync } from 'node:fs';

// Islands hydrate when scrolled into view; on a busy machine that can lag
// behind the click. Wait until the enclosing <astro-island> has hydrated.
async function hydrated(loc) {
  await openDropdowns(loc);
  await loc.scrollIntoViewIfNeeded();
  const h = await loc.elementHandle();
  await h.evaluate((el) => new Promise((done) => {
    const isl = el.closest('astro-island');
    const ok = () => !isl || !isl.hasAttribute('ssr');
    if (ok()) return done();
    const t = setInterval(() => { if (ok()) { clearInterval(t); done(); } }, 50);
    setTimeout(() => { clearInterval(t); done(); }, 15000);
  }));
}
// Poll a condition for up to 5 s before giving up.
async function eventually(fn) {
  for (let i = 0; i < 50; i++) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 100)); }
  return false;
}
const chapterPaths = readdirSync(join(dist, 'chapters')).sort().map((d) => `/chapters/${d}/`);
const paths = ['/', '/front/preface/', '/front/how-to-use-this-book/', '/front/about-the-author/', '/days/', '/review/', '/bibliography/', '/acknowledgements/', ...chapterPaths];
{
  const { page, errors } = await newPage();
  for (const p of paths) {
    errors.length = 0;
    await page.goto(url + p, { waitUntil: 'networkidle' });
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(400);
    check(errors.length === 0, `${p}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`);
    check(await noOverflow(page), `${p}: no horizontal overflow at 440px`);
  }
}

// 1b. Served under /book/, the root redirects there, and the reading order
// is Preface, How to use this book, About the author, chapter 1.
{
  const { page, errors } = await newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  check(new URL(page.url()).pathname === base, `/ redirects to ${base} (${new URL(page.url()).pathname})`);
  const start = await page.locator('[data-start]').getAttribute('href');
  check(start === base + 'front/preface/', `landing page starts with the preface (${start})`);
  check(await page.title() === BOOK.subtitle, `landing page title (${await page.title()})`);
  const internal = await page.evaluate((b) => [...document.querySelectorAll('a[href^="/"], link[href^="/"], script[src^="/"]')]
    .map((e) => e.getAttribute('href') ?? e.getAttribute('src')).filter((h) => !h.startsWith(b)), base);
  check(internal.length === 0, `landing page: every internal URL is under ${base} ${JSON.stringify(internal.slice(0, 5))}`);
  const order = [];
  await page.goto(url + '/front/preface/', { waitUntil: 'networkidle' });
  check(await page.locator('[data-prev]').count() === 0, 'the preface has no Previous link');
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-next]').click();
    await page.waitForLoadState('networkidle');
    order.push(new URL(page.url()).pathname);
  }
  check(JSON.stringify(order) === JSON.stringify([base + 'front/how-to-use-this-book/', base + 'front/about-the-author/', base + 'chapters/001-functions/']), `Next follows the reading order: ${order.join(' → ')}`);
  const prev = await page.locator('[data-prev]').getAttribute('href');
  check(prev === base + 'front/about-the-author/', `chapter 1's Previous is About the author (${prev})`);
  check(errors.length === 0, `reading order: no console errors ${JSON.stringify(errors)}`);
}

// 1c. Search finds a chapter and links to it under /book/.
{
  const { page } = await newPage();
  await page.goto(url + '/', { waitUntil: 'networkidle' });
  await page.locator('#search-open').click();
  const input = page.locator('#search-ui input');
  await input.waitFor({ timeout: 10000 });
  await input.fill('bytecode');
  const first = page.locator('#search-ui .pagefind-ui__result-link').first();
  const ok = await first.waitFor({ timeout: 10000 }).then(() => true, () => false);
  const link = ok ? await first.getAttribute('href') : null;
  check(!!link && link.startsWith(base), `search results link under ${base} (${link})`);
}

// 2. Chapter interactions.
{
  const { page, errors } = await newPage();
  await page.goto(url + `/chapters/${REFS}/`, { waitUntil: 'networkidle' });

  // Runnable example
  const ex = page.locator(`[data-runner="${REFS}/refs-play"]`);
  await openDropdowns(ex);
  await ex.scrollIntoViewIfNeeded();
  await ex.locator('.cm-content').waitFor();
  await ex.locator('[data-run]').click();
  await ex.locator('[data-output]').waitFor();
  await page.waitForTimeout(500);
  const out = await ex.locator('[data-output]').innerText();
  check(out.trim() === REFS_PLAY_OUT.trim(), `example output matches Node formatting: ${JSON.stringify(out)} vs ${JSON.stringify(REFS_PLAY_OUT)}`);

  // Key bar appears while editing, and inserts text.
  await ex.locator('.cm-content').click();
  await page.waitForTimeout(200);
  check(await ex.locator('.keybar').isVisible(), 'symbol key bar appears while editing');
  await ex.locator('.keybar button[aria-label="Insert {"]').click();
  check((await ex.locator('.cm-content').innerText()).includes('{'), 'key bar inserts a symbol');

  // Exercise: starter fails, typing the reference solution passes.
  const exr = page.locator(`[data-runner="${REFS}/${EX_ID}"]`);
  await openDropdowns(exr);
  await exr.scrollIntoViewIfNeeded();
  await exr.locator('.cm-content').waitFor();
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(800);
  const passed = (t) => { const m = t.match(/(\d+)\/(\d+) tests passed/); return m && { got: +m[1], of: +m[2] }; };
  const st0 = passed(await exr.innerText());
  check(!!st0 && st0.got < st0.of, 'starter code fails the tests');
  await exr.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(EX.solution);
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(800);
  const st1 = passed(await exr.innerText());
  check(!!st1 && st1.got === st1.of, 'typed solution passes all tests in the browser');
  check((await exr.innerText()).includes('solved'), 'exercise shows solved');

  // Infinite loop is stopped.
  await exr.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('while (true) {}');
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(3600);
  check((await exr.innerText()).includes('Stopped after 3 seconds'), 'infinite loop is stopped by the time limit');

  // Recall prompt collects a card.
  const prompt = page.locator(`[data-prompt="${PROMPT_ID}"]`);
  await hydrated(prompt);
  await prompt.locator('[data-reveal]').click();
  await prompt.locator('[data-remembered]').click();
  const deck = await page.evaluate(() => JSON.parse(localStorage.getItem('viscosity:srs:v1')));
  await eventually(() => page.evaluate(() => !!localStorage.getItem('viscosity:srs:v1')));
  const deck2 = await page.evaluate(() => JSON.parse(localStorage.getItem('viscosity:srs:v1')));
  check((deck2 ?? deck)?.cards?.[PROMPT_ID]?.reps === 1, 'answering a prompt adds it to the review deck');

  // Quiz scoring.
  const quiz = page.locator('[data-quiz]');
  await hydrated(quiz);
  const qs = await quiz.locator('[data-question]').count();
  for (let i = 0; i < qs; i++) await quiz.locator(`[data-question="${i}"] [data-option="0"]`).click();
  check(await eventually(() => quiz.locator('[data-quiz-score]').isVisible()), 'quiz shows a score when finished');

  // Stepper
  const st = page.locator('[data-stepper]').first();
  await hydrated(st);
  await st.locator('[data-next]').click();
  check(await eventually(async () => /\b2\/\d+\b/.test(await st.innerText())), 'stepper advances');

  check(errors.length === 0, `chapter interactions: no console errors ${JSON.stringify(errors)}`);
  check(await noOverflow(page), 'chapter still fits 440px after interacting');

  // Review page: make the card due and review it.
  await page.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem('viscosity:srs:v1'));
    d.cards[id].due = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem('viscosity:srs:v1', JSON.stringify(d));
  }, PROMPT_ID);
  await page.goto(url + '/review/', { waitUntil: 'networkidle' });
  await page.locator('[data-review-card]').waitFor();
  check((await page.locator('[data-review-card]').innerText()).includes(PROMPT_Q), 'due card appears on the review page');
  await page.locator('[data-review-card] [data-reveal]').click();
  await page.locator('[data-review-card] [data-remembered]').click();
  await page.locator('[data-review-empty]').waitFor();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('viscosity:srs:v1')));
  check(after.cards[PROMPT_ID].reps === 2 && new Date(after.cards[PROMPT_ID].due) > new Date(), 'reviewing reschedules the card into the future');
}

// 2b. A Drip program runs on the real interpreter in the page.
{
  const { page, errors } = await newPage();
  await page.goto(url + `/chapters/${chapterBySlug('meet-drip')}/`, { waitUntil: 'networkidle' });
  const r = page.locator('[data-runner]').first();
  await openDropdowns(r);
  await r.scrollIntoViewIfNeeded();
  await r.locator('.cm-content').waitFor();
  await r.locator('[data-run]').click();
  await r.locator('[data-output]').waitFor();
  await page.waitForTimeout(800);
  const out = await r.locator('[data-output]').innerText();
  check(out.trim().length > 0 && !/Error/.test(out), `Drip example runs in the page: ${JSON.stringify(out.slice(0, 60))}`);
  check(errors.length === 0, 'Drip runner: no console errors');
}

// 2c. The Playground's two engines (TypeScript, and Rust as WebAssembly)
// give identical decisions and code (the parity guarantee), and the .wasm is
// fetched only when the Rust engine is chosen.
{
  const { page, errors } = await newPage();
  const wasmRequests = [];
  page.on('request', (r) => { if (r.url().endsWith('.wasm')) wasmRequests.push(r.url()); });
  await page.goto(url + `/chapters/${chapterWith(/<Playground\b/)}/`, { waitUntil: 'networkidle' });
  const pg = page.locator('[data-playground]').first();
  await hydrated(pg);
  const status = pg.locator('[data-engine-status]');
  const read = async (eng) => {
    await eventually(async () => (await status.getAttribute('data-engine-status')) === eng && /compiled in/.test(await status.innerText()));
    await pg.getByRole('button', { name: 'Decisions' }).click();
    const explain = await pg.locator('[data-explain]').innerText();
    await pg.getByRole('button', { name: 'Compiled code' }).click();
    const code = await pg.locator('[data-code]').innerText();
    return { explain, code };
  };
  const ts = await read('ts');
  check(wasmRequests.length === 0, 'Playground: no .wasm fetched while the TS engine is in use');
  const btn = pg.locator('[data-engine="rust"]');
  const box = await btn.boundingBox();
  check(box && box.height >= 44 && box.width >= 44, `Playground engine toggle is a 44px tap target (${box && `${box.width.toFixed(0)}x${box.height.toFixed(0)}`})`);
  await btn.click();
  const rs = await read('rust');
  check(wasmRequests.length === 1 && new URL(wasmRequests[0]).pathname === base + 'wasm/viscosity_wasm_bg.wasm', `Playground: the Rust engine loads ${base}wasm/viscosity_wasm_bg.wasm once (${wasmRequests.length})`);
  check(ts.code.length > 0 && ts.code === rs.code, `Playground: TS and Rust engines emit identical code (${ts.code.length} chars)`);
  check(ts.explain.length > 0 && ts.explain === rs.explain, `Playground: TS and Rust engines give identical decisions: ${JSON.stringify(rs.explain.split('\n')[0])}`);
  await pg.locator('[data-run-both]').click();
  check(await eventually(async () => (await pg.locator('[data-runs]').count()) > 0 && (await pg.locator('[data-runs]').innerText()).includes('Same output')), 'Playground: Run both on the Rust engine\'s output prints the same thing');
  await pg.locator('[data-engine="ts"]').click();
  const back = await read('ts');
  check(back.code === ts.code, 'Playground: switching back to the TS engine works');
  check(errors.length === 0, `Playground engines: no console errors ${JSON.stringify(errors)}`);
  check(await noOverflow(page), 'Playground with the engine toggle fits 440px');
}

// 3. Dark mode and desktop layout.
{
  const { page, errors } = await newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await page.goto(url + `/chapters/${chapterBySlug('objects')}/`, { waitUntil: 'networkidle' });
  check(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'dark mode follows the system setting');
  check(await page.locator('#book-nav').isVisible(), 'sidebar visible on desktop');
  check(errors.length === 0, 'desktop dark: no console errors');
}

await browser.close();
server.close();
if (failures.length) { console.error(`\n${failures.length} smoke check(s) failed`); process.exit(1); }
console.log('\nsmoke: all checks passed');
