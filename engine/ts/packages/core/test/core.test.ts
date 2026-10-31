import { describe, expect, it } from 'vitest';
import { analyze, dominators, naturalLoops, printFunc, compile } from '../src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';

const lowerSrc = (src: string) => jsPlugin().lower(src).module;

describe('SSA construction', () => {
  it('creates a phi for a loop variable and removes trivial phis', () => {
    const m = lowerSrc('let s = 0; for (let i = 0; i < 10; i++) s = s + i; console.log(s);');
    const text = printFunc(m, m.functions[m.main]);
    expect(text.match(/phi/g)?.length).toBe(2); // s and i
  });
  it('turns a local alias into the same SSA value', () => {
    const m = lowerSrc('function f(a) { const b = a; const c = b; return c; }');
    const f = m.functions.find((x) => x.name === 'f')!;
    const ret = f.blocks.flatMap((b) => (b.term.kind === 'return' ? [b.term.value] : []))[0];
    expect(ret).toBe(f.params[0]);
  });
});

describe('CFG', () => {
  it('finds dominators and nested natural loops', () => {
    const m = lowerSrc('for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { console.log(i, j); } }');
    const f = m.functions[m.main];
    const idom = dominators(f);
    expect(idom.get(f.entry)).toBe(f.entry);
    const loops = naturalLoops(f, idom);
    expect(loops.length).toBe(2);
    expect(loops.map((l) => l.depth).sort()).toEqual([1, 2]);
  });
});

describe('analyses', () => {
  const coll = (src: string) => analyze(lowerSrc(src)).collections[0];
  it('proves bounds for counting loops, including outer-loop indexes and && guards', () => {
    const c = coll(`const b = []; for (let i = 0; i < 100; i++) b.push({ x: i });
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < i + 8 && j < b.length; j++) b[i].x += b[j].x;`);
    expect(c.indexGets.map((g) => g.boundsProven)).toEqual([true, true]);
  });
  it('does not prove bounds for arbitrary indexes', () => {
    const c = coll('const b = []; for (let i = 0; i < 100; i++) b.push({ x: i }); for (let i = 0; i < b.length; i++) b[i + 1].x = 0;');
    expect(c.indexGets[0].boundsProven).toBe(false);
  });
  it('infers numeric fields through parameters of known functions', () => {
    const c = coll('const b = []; function add(v) { b.push({ x: v * 2 }); } for (let i = 0; i < 9; i++) add(i); for (let i = 0; i < b.length; i++) b[i].x++;');
    expect(c.bailouts).toEqual([]);
  });
  it('gives a field a plain column when an unknown caller could pass a non-number', () => {
    const c = coll('const b = []; export function add(v) { b.push({ x: v, y: 1 }); } for (let i = 0; i < b.length; i++) b[i].y++;');
    expect(c.bailouts).toEqual([]);
    expect([...c.numericFields]).toEqual(['y']);
  });
  it('estimates sizes from constant loop bounds', () => {
    const c = coll('const b = []; for (let i = 0; i < 40; i++) for (let j = 0; j < 5; j++) b.push({ x: j });');
    expect(c.sizeEstimate).toBe(200);
  });
});

describe('explain', () => {
  it('says why a collection was kept', () => {
    const r = compile('const b = []; for (let i = 0; i < 100; i++) b.push({ x: i }); console.log(b[0]);', jsPlugin());
    expect(r.explain).toMatch(/kept as array of objects/);
    expect(r.explain).toMatch(/passed to a method call/);
  });
});
