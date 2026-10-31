// End-to-end smoke test of the built site in Chromium, at iPhone 17 Pro Max
// size (440 x 956). Run after `npm run build`.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './lib/serve.mjs';
import { chromium, IPHONE } from './lib/playwright.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const { server, url } = await serve(dist);
const browser = await chromium.launch();
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? '✓' : '✗'} ${msg}`); };

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
const paths = ['/', '/front/preface/', '/front/how-to-use-this-book/', '/days/', '/review/', '/bibliography/', '/acknowledgements/',
  '/chapters/001-functions/', '/chapters/002-arrays/', '/chapters/003-objects/', '/chapters/004-references/'];
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

// 2. Chapter interactions.
{
  const { page, errors } = await newPage();
  await page.goto(url + '/chapters/004-references/', { waitUntil: 'networkidle' });

  // Runnable example
  const ex = page.locator('[data-runner="004-references/refs-play"]');
  await ex.scrollIntoViewIfNeeded();
  await ex.locator('.cm-content').waitFor();
  await ex.locator('[data-run]').click();
  await ex.locator('[data-output]').waitFor();
  await page.waitForTimeout(500);
  const out = await ex.locator('[data-output]').innerText();
  check(out.includes('99') && out.includes('true false') && out.includes('[ 1, 2, 3 ]'), `example output matches Node formatting: ${JSON.stringify(out)}`);

  // Key bar appears while editing, and inserts text.
  await ex.locator('.cm-content').click();
  await page.waitForTimeout(200);
  check(await ex.locator('.keybar').isVisible(), 'symbol key bar appears while editing');
  await ex.locator('.keybar button[aria-label="Insert {"]').click();
  check((await ex.locator('.cm-content').innerText()).includes('{'), 'key bar inserts a symbol');

  // Exercise: starter fails, typing the reference solution passes.
  const exr = page.locator('[data-runner="004-references/withX"]');
  await exr.scrollIntoViewIfNeeded();
  await exr.locator('.cm-content').waitFor();
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(800);
  check(/0\/4 tests passed|[0-3]\/4 tests passed/.test(await exr.innerText()), 'starter code fails the tests');
  await exr.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('function withX(p, x) {\nreturn { ...p, x: x };\n}', { delay: 2 });
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(800);
  check((await exr.innerText()).includes('4/4 tests passed'), 'typed solution passes all tests in the browser');
  check((await exr.innerText()).includes('solved'), 'exercise shows solved');

  // Infinite loop is stopped.
  await exr.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('while (true) {}');
  await exr.locator('[data-run]').click();
  await page.waitForTimeout(3600);
  check((await exr.innerText()).includes('Stopped after 3 seconds'), 'infinite loop is stopped by the time limit');

  // Recall prompt collects a card.
  const prompt = page.locator('[data-prompt="4.ref-what"]');
  await prompt.scrollIntoViewIfNeeded();
  await prompt.locator('[data-reveal]').click();
  await prompt.locator('[data-remembered]').click();
  const deck = await page.evaluate(() => JSON.parse(localStorage.getItem('viscosity:srs:v1')));
  check(deck?.cards?.['4.ref-what']?.reps === 1, 'answering a prompt adds it to the review deck');

  // Quiz scoring.
  const quiz = page.locator('[data-quiz]');
  await quiz.scrollIntoViewIfNeeded();
  const qs = await quiz.locator('[data-question]').count();
  for (let i = 0; i < qs; i++) await quiz.locator(`[data-question="${i}"] [data-option="0"]`).click();
  check(await quiz.locator('[data-quiz-score]').isVisible(), 'quiz shows a score when finished');

  // Stepper
  const st = page.locator('[data-stepper]').first();
  await st.scrollIntoViewIfNeeded();
  await st.locator('[data-next]').click();
  check((await st.innerText()).includes('2/7'), 'stepper advances');

  check(errors.length === 0, `chapter interactions: no console errors ${JSON.stringify(errors)}`);
  check(await noOverflow(page), 'chapter still fits 440px after interacting');

  // Review page: make the card due and review it.
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('viscosity:srs:v1'));
    d.cards['4.ref-what'].due = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem('viscosity:srs:v1', JSON.stringify(d));
  });
  await page.goto(url + '/review/', { waitUntil: 'networkidle' });
  await page.locator('[data-review-card]').waitFor();
  check((await page.locator('[data-review-card]').innerText()).includes('what does it actually hold'), 'due card appears on the review page');
  await page.locator('[data-review-card] [data-reveal]').click();
  await page.locator('[data-review-card] [data-remembered]').click();
  await page.locator('[data-review-empty]').waitFor();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('viscosity:srs:v1')));
  check(after.cards['4.ref-what'].reps === 2 && new Date(after.cards['4.ref-what'].due) > new Date(), 'reviewing reschedules the card into the future');
}

// 3. Dark mode and desktop layout.
{
  const { page, errors } = await newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await page.goto(url + '/chapters/003-objects/', { waitUntil: 'networkidle' });
  check(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'dark mode follows the system setting');
  check(await page.locator('#book-nav').isVisible(), 'sidebar visible on desktop');
  check(errors.length === 0, 'desktop dark: no console errors');
}

await browser.close();
server.close();
if (failures.length) { console.error(`\n${failures.length} smoke check(s) failed`); process.exit(1); }
console.log('\nsmoke: all checks passed');
