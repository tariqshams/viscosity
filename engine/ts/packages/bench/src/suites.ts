// The benchmark suites. Each suite asks the same question of every layout:
// "how fast is this access pattern when the data is stored like THAT?"
//
//   update-xy      hot loop touching 4 of 6 fields (x += vx*dt, y += vy*dt)
//                  -> the case SoA is supposed to win
//   sum-one-field  read a single field across the whole collection
//   read-all       read all 6 fields of every element
//                  -> AoS keeps each element's fields together
//   random-x       read x and vx at shuffled indices (cache-hostile)
//   get-objects    hand each element to a small function that wants an
//                  object. SoA must build one, but V8 can often inline the
//                  function and remove the allocation (escape analysis).
//   materialize    build an array holding a real object per element (the
//                  objects escape, so nothing can remove the allocations)
//                  -> the case where SoA genuinely loses
//   construct      build the whole collection from raw values

import {
  BLOCK,
  NFIELDS,
  aosoaIndex,
  makeAos,
  makeAosClass,
  makeAosCtor,
  makeAosoa,
  makePacked,
  makeSoa,
  particleValues,
  rng,
  type Particle,
} from './layouts.ts';
import type { Kernel } from './harness.ts';

export const LAYOUTS = ['aos', 'aos-class', 'aos-ctor', 'aos-packed', 'soa', 'aosoa8'] as const;
export type Layout = (typeof LAYOUTS)[number];

export const SUITES = [
  'update-xy',
  'sum-one-field',
  'read-all',
  'random-x',
  'get-objects',
  'materialize',
  'construct',
] as const;
export type Suite = (typeof SUITES)[number];

const DT = 0.016;

function shuffledIndices(n: number): Int32Array {
  const idx = new Int32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  const r = rng(7);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  return idx;
}

// Consumer for get-objects. Kept as a separate function that receives an
// object, like real code that calls `draw(particle)` or `serialize(p)`.
function consume(p: Particle): number {
  return p.x + p.y + p.vx + p.vy + p.mass + p.health;
}

export function makeKernel(suite: Suite, layout: Layout, n: number): Kernel {
  const v = particleValues(n);
  const idx = suite === 'random-x' ? shuffledIndices(n) : null;

  if (suite === 'construct') {
    const build: Record<Layout, () => number> = {
      aos: () => makeAos(v, n).length,
      'aos-class': () => makeAosClass(v, n).length,
      'aos-ctor': () => makeAosCtor(v, n).length,
      'aos-packed': () => makePacked(v).length,
      soa: () => makeSoa(v, n).n,
      aosoa8: () => makeAosoa(v, n).length,
    };
    return { run: build[layout], elements: n };
  }

  switch (layout) {
    case 'aos':
    case 'aos-class':
    case 'aos-ctor': {
      const a: Particle[] =
        layout === 'aos'
          ? makeAos(v, n)
          : layout === 'aos-class'
            ? makeAosClass(v, n)
            : makeAosCtor(v, n);
      switch (suite) {
        case 'update-xy':
          return {
            elements: n,
            run() {
              for (let i = 0; i < a.length; i++) {
                const p = a[i];
                p.x += p.vx * DT;
                p.y += p.vy * DT;
              }
              return a[0].x;
            },
          };
        case 'sum-one-field':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let i = 0; i < a.length; i++) s += a[i].mass;
              return s;
            },
          };
        case 'read-all':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let i = 0; i < a.length; i++) {
                const p = a[i];
                s += p.x + p.y + p.vx + p.vy + p.mass + p.health;
              }
              return s;
            },
          };
        case 'random-x':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let i = 0; i < idx!.length; i++) {
                const p = a[idx![i]];
                s += p.x + p.vx;
              }
              return s;
            },
          };
        case 'materialize':
          return {
            elements: n,
            run() {
              // The objects already exist: copying references is all it takes.
              const out: Particle[] = new Array(n);
              for (let i = 0; i < n; i++) out[i] = a[i];
              return out[n - 1].x;
            },
          };
        case 'get-objects':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let i = 0; i < a.length; i++) s += consume(a[i]);
              return s;
            },
          };
      }
      break;
    }
    case 'aos-packed': {
      const f = makePacked(v);
      switch (suite) {
        case 'update-xy':
          return {
            elements: n,
            run() {
              for (let o = 0; o < f.length; o += NFIELDS) {
                f[o] += f[o + 2] * DT;
                f[o + 1] += f[o + 3] * DT;
              }
              return f[0];
            },
          };
        case 'sum-one-field':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let o = 4; o < f.length; o += NFIELDS) s += f[o];
              return s;
            },
          };
        case 'read-all':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let o = 0; o < f.length; o += NFIELDS) {
                s += f[o] + f[o + 1] + f[o + 2] + f[o + 3] + f[o + 4] + f[o + 5];
              }
              return s;
            },
          };
        case 'random-x':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let i = 0; i < idx!.length; i++) {
                const o = idx![i] * NFIELDS;
                s += f[o] + f[o + 2];
              }
              return s;
            },
          };
        case 'materialize':
          return {
            elements: n,
            run() {
              const out: Particle[] = new Array(n);
              for (let i = 0, o = 0; i < n; i++, o += NFIELDS) {
                out[i] = {
                  x: f[o],
                  y: f[o + 1],
                  vx: f[o + 2],
                  vy: f[o + 3],
                  mass: f[o + 4],
                  health: f[o + 5],
                };
              }
              return out[n - 1].x;
            },
          };
        case 'get-objects':
          return {
            elements: n,
            run() {
              let s = 0;
              for (let o = 0; o < f.length; o += NFIELDS) {
                s += consume({
                  x: f[o],
                  y: f[o + 1],
                  vx: f[o + 2],
                  vy: f[o + 3],
                  mass: f[o + 4],
                  health: f[o + 5],
                });
              }
              return s;
            },
          };
      }
      break;
    }
    case 'soa': {
      const s = makeSoa(v, n);
      const { x, y, vx, vy, mass, health } = s;
      switch (suite) {
        case 'update-xy':
          return {
            elements: n,
            run() {
              for (let i = 0; i < n; i++) {
                x[i] += vx[i] * DT;
                y[i] += vy[i] * DT;
              }
              return x[0];
            },
          };
        case 'sum-one-field':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let i = 0; i < n; i++) t += mass[i];
              return t;
            },
          };
        case 'read-all':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let i = 0; i < n; i++) {
                t += x[i] + y[i] + vx[i] + vy[i] + mass[i] + health[i];
              }
              return t;
            },
          };
        case 'random-x':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let i = 0; i < idx!.length; i++) {
                const j = idx![i];
                t += x[j] + vx[j];
              }
              return t;
            },
          };
        case 'materialize':
          return {
            elements: n,
            run() {
              const out: Particle[] = new Array(n);
              for (let i = 0; i < n; i++) {
                out[i] = {
                  x: x[i],
                  y: y[i],
                  vx: vx[i],
                  vy: vy[i],
                  mass: mass[i],
                  health: health[i],
                };
              }
              return out[n - 1].x;
            },
          };
        case 'get-objects':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let i = 0; i < n; i++) {
                t += consume({
                  x: x[i],
                  y: y[i],
                  vx: vx[i],
                  vy: vy[i],
                  mass: mass[i],
                  health: health[i],
                });
              }
              return t;
            },
          };
      }
      break;
    }
    case 'aosoa8': {
      const f = makeAosoa(v, n);
      const stride = BLOCK * NFIELDS;
      switch (suite) {
        case 'update-xy':
          return {
            elements: n,
            run() {
              for (let b = 0; b < f.length; b += stride) {
                for (let l = 0; l < BLOCK; l++) {
                  f[b + l] += f[b + 2 * BLOCK + l] * DT;
                  f[b + BLOCK + l] += f[b + 3 * BLOCK + l] * DT;
                }
              }
              return f[0];
            },
          };
        case 'sum-one-field':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let b = 0; b < f.length; b += stride) {
                for (let l = 0; l < BLOCK; l++) t += f[b + 4 * BLOCK + l];
              }
              return t;
            },
          };
        case 'read-all':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let b = 0; b < f.length; b += stride) {
                for (let l = 0; l < BLOCK; l++) {
                  t +=
                    f[b + l] +
                    f[b + BLOCK + l] +
                    f[b + 2 * BLOCK + l] +
                    f[b + 3 * BLOCK + l] +
                    f[b + 4 * BLOCK + l] +
                    f[b + 5 * BLOCK + l];
                }
              }
              return t;
            },
          };
        case 'random-x':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let i = 0; i < idx!.length; i++) {
                const j = idx![i];
                t += f[aosoaIndex(j, 0)] + f[aosoaIndex(j, 2)];
              }
              return t;
            },
          };
        case 'materialize':
          return {
            elements: n,
            run() {
              const out: Particle[] = new Array(n);
              let i = 0;
              for (let b = 0; b < f.length; b += stride) {
                for (let l = 0; l < BLOCK; l++) {
                  out[i++] = {
                    x: f[b + l],
                    y: f[b + BLOCK + l],
                    vx: f[b + 2 * BLOCK + l],
                    vy: f[b + 3 * BLOCK + l],
                    mass: f[b + 4 * BLOCK + l],
                    health: f[b + 5 * BLOCK + l],
                  };
                }
              }
              return out[n - 1].x;
            },
          };
        case 'get-objects':
          return {
            elements: n,
            run() {
              let t = 0;
              for (let b = 0; b < f.length; b += stride) {
                for (let l = 0; l < BLOCK; l++) {
                  t += consume({
                    x: f[b + l],
                    y: f[b + BLOCK + l],
                    vx: f[b + 2 * BLOCK + l],
                    vy: f[b + 3 * BLOCK + l],
                    mass: f[b + 4 * BLOCK + l],
                    health: f[b + 5 * BLOCK + l],
                  });
                }
              }
              return t;
            },
          };
      }
      break;
    }
  }
  throw new Error(`no kernel for ${suite}/${layout}`);
}
