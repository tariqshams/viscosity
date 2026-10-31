// Python differential tests: run the original and the compiled program with
// python3 and require identical stdout, and identical exceptions.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../../core/src/index.ts';
import { pythonPlugin } from '../src/index.ts';

const dir = join(import.meta.dirname, 'corpus');
const tmp = mkdtempSync(join(tmpdir(), 'vsc-py-'));
const run = (file: string) => {
  try {
    return { out: execFileSync('python3', [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: null };
  } catch (e) {
    const x = e as { stdout: string; stderr: string };
    return { out: x.stdout, err: x.stderr.trim().split('\n').pop() };
  }
};

describe('python differential: original vs compiled', () => {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.py')).sort()) {
    it(f, () => {
      const src = readFileSync(join(dir, f), 'utf8');
      const header = /# viscosity: (.*)/.exec(src)!;
      const r = compile(src, pythonPlugin(), { pythonAuto: true });
      const want = Object.fromEntries(header[1].split(',').filter((p) => p.trim()).map((p) => p.trim().split('=')));
      const got = Object.fromEntries(r.plan.collections.map((c) => [c.collection.name, c.layout]));
      expect(got, r.explain).toEqual(want);
      const a = join(tmp, f);
      const b = join(tmp, f.replace('.py', '.vsc.py'));
      writeFileSync(a, src);
      writeFileSync(b, r.code);
      expect(run(b), `compiled:\n${r.code}`).toEqual(run(a));
    });
  }
});

describe('python defaults', () => {
  it('keeps objects unless annotated, and explains why', () => {
    const src = readFileSync(join(dir, 'particles.py'), 'utf8');
    expect(compile(src, pythonPlugin()).plan.collections[0].layout).toBe('aos');
    expect(compile(src, pythonPlugin()).explain).toMatch(/CPython/);
    const annotated = src.replace('ps = []', '# @viscosity soa\nps = []');
    expect(compile(annotated, pythonPlugin()).plan.collections[0].layout).toBe('soa');
  });
});
