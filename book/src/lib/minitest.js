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
