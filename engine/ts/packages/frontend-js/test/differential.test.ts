// Differential tests: every corpus program must behave exactly the same
// before and after Viscosity, and Viscosity must make the expected layout
// decision for each collection (from the "// viscosity:" header).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../../core/src/index.ts';
import { jsPlugin } from '../src/index.ts';
import { runIsolated } from './run.ts';

const dir = join(import.meta.dirname, 'corpus');

describe('differential: original vs compiled', () => {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
    it(f, () => {
      const src = readFileSync(join(dir, f), 'utf8');
      const header = /\/\/ viscosity(\(opt-in\))?: (.*)/.exec(src)!;
      const r = compile(src, jsPlugin(), { mode: header[1] ? 'opt-in' : 'auto' });
      const want = Object.fromEntries(header[2].split(',').map((p) => p.trim().split('=')));
      const got = Object.fromEntries(r.plan.collections.map((c) => [c.collection.name, c.layout]));
      expect(got, r.explain).toEqual(want);
      const before = runIsolated(src);
      const after = runIsolated(r.code);
      expect(after, `compiled code:\n${r.code}`).toEqual(before);
    });
  }
});

describe('round trip', () => {
  it('leaves programs with nothing to transform byte-identical', () => {
    const src = 'const a = [1, 2, 3];\n// a comment\nconsole.log(a.length);\n';
    expect(compile(src, jsPlugin()).code).toBe(src);
  });
  it('handles export default class (named and anonymous)', () => {
    for (const src of ['export default class A { m() { return 1; } }\n', 'export default class {}\n']) {
      expect(compile(src, jsPlugin()).code).toBe(src);
    }
  });
});
