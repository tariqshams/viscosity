// A tiny test harness shared by the in-browser runner and the Node build
// check (scripts/check_chapters.mjs), so an exercise's reference solution is
// proven against exactly the tests the reader's code faces.
//
//   test('adds', () => { expect(add(2, 3)).toBe(5); });

import { formatValue } from './format.js';

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

export class AssertionError extends Error {}

export function expect(actual) {
  const fail = (msg) => { throw new AssertionError(msg); };
  const show = (v) => formatValue(v, 1);
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) fail(`expected ${show(expected)}, got ${show(actual)}`);
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) fail(`expected ${show(expected)}, got ${show(actual)}`);
    },
    toBeCloseTo(expected, digits = 6) {
      if (!(Math.abs(actual - expected) < 10 ** -digits / 2)) fail(`expected about ${expected}, got ${show(actual)}`);
    },
    toBeTruthy() { if (!actual) fail(`expected a truthy value, got ${show(actual)}`); },
    toBeFalsy() { if (actual) fail(`expected a falsy value, got ${show(actual)}`); },
    toThrow() {
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) fail('expected the function to throw, but it did not');
    },
  };
}

/**
 * Run `code` (the reader's program) followed by `tests`, with `console`
 * replaced by `logger`. Returns { results: [{name, ok, message}], error }.
 */
export function runWithTests(code, tests, logger) {
  const results = [];
  const test = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  };
  try {
    // A syntax error is thrown here, while the code is compiled.
    const fn = new Function('console', 'test', 'expect', `${code}\n;\n${tests ?? ''}`);
    fn(logger, test, expect);
    return { results, error: null };
  } catch (e) {
    return { results, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

/**
 * Like runWithTests, but for code that does things later: it waits for the
 * program's timers (setTimeout, setInterval) and for async tests
 * (`test('x', async () => { ... await ... })`) before reporting, so promise
 * and timer output is not lost. It gives up waiting after `settleMs`; a
 * timer still pending then (an interval nobody cleared) is reported in
 * `pending`. Synchronous code behaves exactly as with runWithTests.
 */
export async function runWithTestsAsync(code, tests, logger, { settleMs = 2500 } = {}) {
  const slots = [];
  const running = [];
  const test = (name, fn) => {
    const i = slots.push(null) - 1;
    const record = (ok, e) => { slots[i] = ok ? { name, ok: true } : { name, ok: false, message: e instanceof Error ? e.message : String(e) }; };
    try {
      const r = fn();
      if (r && typeof r.then === 'function') running.push(Promise.resolve(r).then(() => record(true), (e) => record(false, e)));
      else record(true);
    } catch (e) {
      record(false, e);
    }
  };
  // Timers the program starts are counted, so we know when it has finished.
  const live = new Set();
  const timers = {
    setTimeout: (f, ms, ...a) => { const id = setTimeout(() => { live.delete(id); f(...a); }, ms); live.add(id); return id; },
    clearTimeout: (id) => { live.delete(id); clearTimeout(id); },
    setInterval: (f, ms, ...a) => { const id = setInterval(f, ms, ...a); live.add(id); return id; },
    clearInterval: (id) => { live.delete(id); clearInterval(id); },
  };
  let error = null;
  const fail = (e) => { if (!error) error = e instanceof Error ? `${e.name}: ${e.message}` : String(e); };
  try {
    const fn = new Function('console', 'test', 'expect', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', `${code}\n;\n${tests ?? ''}`);
    fn(logger, test, expect, timers.setTimeout, timers.clearTimeout, timers.setInterval, timers.clearInterval);
  } catch (e) {
    fail(e);
  }
  const deadline = Date.now() + settleMs;
  const tick = () => new Promise((r) => setTimeout(r, 5));
  // Let promise callbacks run, then wait while timers or async tests remain.
  await tick();
  while ((live.size || slots.includes(null)) && Date.now() < deadline) {
    await Promise.race([Promise.all(running), tick()]);
    await tick();
  }
  for (const id of live) { clearTimeout(id); clearInterval(id); }
  const results = slots.map((s, i) => s ?? { name: `test ${i + 1}`, ok: false, message: `did not finish within ${settleMs / 1000} seconds` });
  return { results, error, pending: live.size };
}
