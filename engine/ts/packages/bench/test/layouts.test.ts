import { describe, expect, it } from 'vitest';
import { LAYOUTS, SUITES, makeKernel } from '../src/suites.ts';
import { aosoaIndex, makeAosoa, particleValues, NFIELDS } from '../src/layouts.ts';

describe('layouts hold identical data', () => {
  it('aosoa index maps every (particle, field) to a unique slot', () => {
    const n = 24;
    const seen = new Set<number>();
    for (let i = 0; i < n; i++) {
      for (let f = 0; f < NFIELDS; f++) seen.add(aosoaIndex(i, f));
    }
    expect(seen.size).toBe(n * NFIELDS);
    const v = particleValues(n);
    const a = makeAosoa(v, n);
    expect(a[aosoaIndex(13, 4)]).toBe(v[13 * NFIELDS + 4]);
  });

  // Read-only suites must give the same answer whatever the layout.
  for (const suite of ['sum-one-field', 'read-all', 'random-x', 'get-objects', 'materialize'] as const) {
    it(`${suite}: every layout computes the same result`, () => {
      const results = LAYOUTS.map((l) => makeKernel(suite, l, 1000).run());
      for (const r of results) expect(r).toBeCloseTo(results[0], 6);
    });
  }

  it('update-xy: every layout moves particle 0 the same way', () => {
    const results = LAYOUTS.map((l) => {
      const k = makeKernel('update-xy', l, 64);
      k.run();
      return k.run();
    });
    for (const r of results) expect(r).toBeCloseTo(results[0], 9);
  });

  it('every suite has a kernel for every layout', () => {
    for (const s of SUITES) for (const l of LAYOUTS) expect(() => makeKernel(s, l, 16)).not.toThrow();
  });
});
