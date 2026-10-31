// The CLI: several files at once (`build a.js b.js -o dir/`, `explain a.js
// b.js`) and code frames (`explain --frames`).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codeFrame, compile, explain } from '../../core/src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';
import { HELP, outputName } from '../src/cli.ts';

const cli = join(import.meta.dirname, '..', 'src', 'cli.ts');
const corpus = join(import.meta.dirname, '..', '..', 'frontend-js', 'test', 'corpus');
const files = readdirSync(corpus).filter((f) => f.endsWith('.js')).sort().slice(0, 6).map((f) => join(corpus, f));
const run = (...args: string[]) => {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout, err: r.stderr };
};

describe('several files', () => {
  it('explain prints each file under a header, in order', () => {
    const want = files.map((f, k) => `${k ? '\n' : ''}== ${f} ==\n${run('explain', f).out}`).join('');
    expect(run('explain', ...files).out).toBe(want);
  });
  it('build -o dir writes one file per input, as single builds print it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vsc-cli-'));
    const r = run('build', ...files, '-o', dir, '--jobs', '2');
    expect(r.status).toBe(0);
    expect(r.out).toBe('');
    for (const f of files) expect(readFileSync(join(dir, f.split('/').pop()!), 'utf8')).toBe(run('build', f).out);
  });
  it('a single file goes into a directory given with a trailing slash', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vsc-cli-')) + '/sub/';
    expect(run('build', files[0], '-o', dir).status).toBe(0);
    expect(readFileSync(join(dir, files[0].split('/').pop()!), 'utf8')).toBe(run('build', files[0]).out);
  });
  it('reports usage errors', () => {
    expect(run('build', files[0], files[1]).err).toMatch(/^viscosity: several files need an output directory: -o <dir>\n/);
    const dir = mkdtempSync(join(tmpdir(), 'vsc-cli-'));
    expect(run('build', files[0], files[0], '-o', dir).err).toMatch(/would both be written to/);
    expect(run('profile', files[0], files[1]).err).toMatch(/^viscosity: profile takes one file\n/);
    expect(run('explain', '--jobs', '0', files[0]).err).toMatch(/^viscosity: --jobs must be a whole number of at least 1\n/);
  });
  it('a failing file does not stop the others', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vsc-cli-'));
    const bad = join(dir, 'bad.js');
    writeFileSync(bad, 'const = ;\n');
    const r = run('explain', files[0], bad);
    expect(r.status).toBe(1);
    expect(r.out).toBe(`== ${files[0]} ==\n${run('explain', files[0]).out}`);
    expect(r.err).toMatch(new RegExp(`^viscosity: ${bad}: `));
  });
  it('names TypeScript outputs .js', () => {
    expect([outputName('a/b.ts'), outputName('c.mts'), outputName('d.tsx'), outputName('e.js')]).toEqual(['b.js', 'c.mjs', 'd.jsx', 'e.js']);
  });
  it('documents the options', () => {
    for (const o of ['--frames', '--jobs', '<file>... -o <dir>']) expect(HELP).toContain(o);
  });
});

describe('code frames', () => {
  const src = 'const ps = [];\nfor (let i = 0; i < 100; i++) ps.push({ x: i });\nconst keep = [];\nfor (let i = 0; i < ps.length; i++) {\n\tif (ps[i].x > 3) keep.push(ps[i]);\n}\n';
  it('put the line and carets under each refusal', () => {
    const r = compile(src, jsPlugin());
    expect(explain(r.plan, { frames: src })).toBe([
      'ps (line 1) {x} → kept as array of objects',
      '  · unsafe: line 5: an element is used by push',
      '    5 | \tif (ps[i].x > 3) keep.push(ps[i]);',
      '      | \t                           ^^^^^',
      'keep (line 3) {} → kept as array of objects',
      '  · unsafe: line 5: pushes something that is not a fresh object literal',
      '    5 | \tif (ps[i].x > 3) keep.push(ps[i]);',
      '      | \t                           ^^^^^',
    ].join('\n'));
  });
  it('leave the default explain text alone', () => {
    const r = compile(src, jsPlugin());
    expect(explain(r.plan)).toBe(r.explain);
    expect(r.explain).not.toContain(' | ');
    expect(run('explain', files[0]).out).not.toContain(' | ');
  });
  it('count code points, stop at the line end and show at least one caret', () => {
    const s = 'let a = "é🎉"; f(xs,\n  y);\n';
    const at = (start: number, end: number) => ({ node: null, start, end, line: 1 });
    const x = s.indexOf('xs');
    // 16 code points before xs (é and 🎉 count once each, though 🎉 is two UTF-16 units).
    expect(codeFrame(s, at(x, x + 2))).toBe(`    1 | let a = "é🎉"; f(xs,\n      | ${' '.repeat(16)}^^`);
    expect(codeFrame(s, at(x - 2, s.length))).toBe(`    1 | let a = "é🎉"; f(xs,\n      | ${' '.repeat(14)}^^^^^`);
    expect(codeFrame(s, at(x, x), '')).toBe(`1 | let a = "é🎉"; f(xs,\n  | ${' '.repeat(16)}^`);
  });
});
