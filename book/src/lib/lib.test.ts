import { describe, expect, it } from 'vitest';
import { md } from './md.js';
import { formatValue, formatArgs } from './format.js';
import { runWithTests, runWithTestsAsync } from './minitest.js';

describe('md', () => {
  it('escapes HTML and renders inline code, bold and fences', () => {
    expect(md('a <b> `x<y` **bold**')).toBe('<p>a &lt;b&gt; <code>x&lt;y</code> <strong>bold</strong></p>');
    expect(md('before\n```\nlet a = 1;\n```\nafter')).toBe('<p>before</p><pre><code>let a = 1;</code></pre><p>after</p>');
    expect(md('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });
  it('only links http(s) and site-relative URLs', () => {
    expect(md('[x](javascript:alert(1))')).not.toContain('href');
    expect(md('[x](https://a.dev)')).toContain('href="https://a.dev"');
  });
});

describe('formatValue matches Node console.log style', () => {
  it('formats common values', () => {
    expect(formatArgs(['hi', 3])).toBe('hi 3');
    expect(formatValue([1, 'a'])).toBe("[ 1, 'a' ]");
    expect(formatValue({ x: 1, y: [2] })).toBe('{ x: 1, y: [ 2 ] }');
    expect(formatValue([])).toBe('[]');
    expect(formatValue({})).toBe('{}');
    expect(formatValue(undefined)).toBe('undefined');
    const o: Record<string, unknown> = {};
    o.self = o;
    expect(formatValue(o)).toBe('{ self: [Circular] }');
  });
});

describe('runWithTests', () => {
  it('reports passing and failing tests', () => {
    const r = runWithTests(
      'function add(a, b) { return a + b; }',
      "test('ok', () => expect(add(1, 2)).toBe(3)); test('bad', () => expect(add(1, 1)).toBe(3));",
      console,
    );
    expect(r.error).toBeNull();
    expect(r.results.map((t) => t.ok)).toEqual([true, false]);
    expect(r.results[1].message).toBe('expected 3, got 2');
  });
  it('reports syntax and runtime errors', () => {
    expect(runWithTests('let = ;', '', console).error).toMatch(/SyntaxError/);
    expect(runWithTests('nope()', '', console).error).toMatch(/ReferenceError/);
  });
});

describe('runWithTestsAsync', () => {
  it('waits for timers and promises, in event-loop order', async () => {
    const lines: string[] = [];
    const logger = { log: (...a: unknown[]) => lines.push(a.join(' ')) };
    const r = await runWithTestsAsync(
      "console.log('a'); setTimeout(() => console.log('d'), 10); Promise.resolve().then(() => console.log('c')); console.log('b');",
      '', logger);
    expect(r.error).toBeNull();
    expect(lines).toEqual(['a', 'b', 'c', 'd']);
  });
  it('awaits async tests and reports them in order', async () => {
    const r = await runWithTestsAsync(
      'const later = (v) => new Promise((ok) => setTimeout(() => ok(v), 5));',
      "test('one', async () => { expect(await later(1)).toBe(1); }); test('two', async () => { expect(await later(2)).toBe(3); }); test('sync', () => {});",
      console);
    expect(r.results.map((t) => [t.name, t.ok])).toEqual([['one', true], ['two', false], ['sync', true]]);
  });
  it('gives up on an interval nobody clears', async () => {
    const r = await runWithTestsAsync('setInterval(() => {}, 5);', '', console, { settleMs: 50 });
    expect(r.pending).toBe(1);
  });
});
