import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CORPUS, check, listTests, shouldSkip } from './corpus.ts';
import { runVm, VM, compile, Heap, disassembleChunk } from '../src/vm/index.ts';

describe('bytecode VM passes the Drip corpus (clox expectations)', () => {
  for (const t of listTests()) {
    if (shouldSkip(t, 'vm')) continue;
    it(t, () => {
      const src = readFileSync(join(CORPUS, t), 'utf8');
      expect(check(t, src, runVm(src, { debugGC: true }), 'c')).toEqual([]);
    });
  }
});

describe('the garbage collector', () => {
  // Stress mode collects on EVERY allocation and poisons freed objects, so a
  // missing root shows up as a thrown "use after free".
  const sample = ['closure', 'class', 'inheritance', 'string', 'function', 'super', 'method', 'field'];
  for (const t of listTests().filter((t) => sample.some((s) => t.startsWith(s + '/')))) {
    it(`stress GC: ${t}`, () => {
      const src = readFileSync(join(CORPUS, t), 'utf8');
      expect(check(t, src, runVm(src, { stressGC: true }), 'c')).toEqual([]);
    });
  }

  it('frees unreachable objects and keeps reachable ones', () => {
    const vm = new VM();
    vm.interpret(`
      let keep = "kept";
      for (let i = 0; i < 2000; i = i + 1) { let s = "tmp" + "x"; }
      class A {} let a = A(); a.f = keep + "!";
    `);
    const before = vm.heap.liveObjects();
    vm.heap.collect();
    expect(vm.heap.freed).toBeGreaterThan(0);
    expect(vm.heap.liveObjects()).toBeLessThanOrEqual(before);
    const r = vm.interpret('print a.f;');
    expect(r.stdout).toEqual(['kept!']);
  });
});

describe('the disassembler', () => {
  it('prints readable bytecode', () => {
    const heap = new Heap();
    const fn = compile('print 1 + 2;', heap, [])!;
    const text = disassembleChunk(fn.chunk, '<script>').join('\n');
    expect(text).toContain('OP_CONSTANT');
    expect(text).toContain('OP_ADD');
    expect(text).toContain('OP_PRINT');
  });
});
