import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CORPUS, check, isBenchmark, listTests } from './corpus.ts';
import { runVm, VM, compile, Heap, disassembleFunction } from '../src/vm/index.ts';
import { Scanner, type VmToken } from '../src/vm/scanner.ts';
import { scan } from '../src/scanner.ts';
import { run } from '../src/drip.ts';

const programs = listTests().filter((t) => !isBenchmark(t));
const source = (t: string) => readFileSync(join(CORPUS, t), 'utf8');

describe('the bytecode VM passes the Drip corpus', () => {
  for (const t of programs) {
    it(t, () => {
      const src = source(t);
      expect(check(src, runVm(src, { debugGC: true }))).toEqual([]);
    });
  }
});

describe('the two implementations agree', () => {
  it('the scanners produce the same tokens on every corpus program', () => {
    for (const t of listTests()) {
      const src = source(t);
      const tree = scan(src).map((k) => `${k.type} ${k.type === 'string' ? k.literal : k.lexeme} ${k.line}`);
      const s = new Scanner(src);
      const vm: string[] = [];
      for (let k: VmToken = s.scanToken(); ; k = s.scanToken()) {
        vm.push(`${k.type} ${k.type === 'string' ? k.value : k.lexeme} ${k.line}`);
        if (k.type === 'eof') break;
      }
      expect(vm, t).toEqual(tree);
    }
  });

  it('the tree-walker and the VM print the same, byte for byte', () => {
    for (const t of programs) {
      const src = source(t);
      const a = run(src);
      const b = runVm(src);
      expect({ ...b, stdout: b.stdout.filter((l) => !l.startsWith('clock')) }, t).toEqual({ ...a, stdout: a.stdout.filter((l) => !l.startsWith('clock')) });
    }
  });
});

describe('the garbage collector', () => {
  // Stress mode collects on EVERY allocation and poisons freed objects, so a
  // missing root shows up as a thrown "use after free".
  const sample = ['closures', 'classes', 'inheritance', 'strings', 'functions', 'lists', 'methods', 'fields', 'for', 'programs'];
  for (const t of programs.filter((t) => sample.some((s) => t.startsWith(s + '/')))) {
    it(`stress GC: ${t}`, () => {
      const src = source(t);
      expect(check(src, runVm(src, { stressGC: true }))).toEqual([]);
    });
  }

  it('frees unreachable objects and keeps reachable ones', () => {
    const vm = new VM();
    vm.interpret(`
      let keep = "kept";
      for i in 0..2000 { let s = "tmp" + str(i); let xs = [s, [s]]; }
      class A {}
      let a = new A();
      a.f = keep + "!";
      let list = [a, "in a list"];
    `);
    const before = vm.heap.liveObjects();
    vm.heap.collect();
    expect(vm.heap.freed).toBeGreaterThan(0);
    expect(vm.heap.liveObjects()).toBeLessThanOrEqual(before);
    expect(vm.interpret('print a.f; print list[1];').stdout).toEqual(['kept!', 'in a list']);
  });

  it('collects garbage while a program allocates', () => {
    const vm = new VM();
    const r = vm.interpret(`
      class Node { init(next) { self.next = next; } }
      for i in 0..50000 { new Node(new Node(none)); }
      print "done";
    `);
    expect(r.stdout).toEqual(['done']);
    expect(vm.heap.collections).toBeGreaterThan(0);
  });
});

describe('the disassembler', () => {
  it('prints readable bytecode', () => {
    const heap = new Heap();
    const fn = compile('fn add(a, b) { return a + b; }\nprint add(1, 2);', heap, [])!;
    const text = disassembleFunction(fn).join('\n');
    for (const expected of [
      '== <script> ==',
      '0000    1 closure             0 fn add',
      'define.global       1 \'add\'',
      '0006    2 load.global         2 \'add\'',
      'call                2',
      '== add ==',
      '0000    1 load.local          1',
      'add',
      'return',
    ]) {
      expect(text).toContain(expected);
    }
  });
});

describe('the VM as a REPL', () => {
  it('keeps globals after a runtime error', () => {
    const vm = new VM();
    const r = vm.interpret('let x = 1;\nfn f() { return -none; }\nf();');
    expect(r.exitCode).toBe(70);
    expect(r.stderr).toEqual(['runtime error: cannot negate none', '  at line 2 in fn f', '  at line 3 in script']);
    expect(vm.interpret('print x;').stdout).toEqual(['1']);
  });
});
