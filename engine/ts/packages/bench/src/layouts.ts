// Hand-written baselines: the same particle data stored five ways.
// These are what Viscosity's generated code will be compared against.
//
//   aos         Array of plain object literals (what people normally write)
//   aos-class   Array of class instances with TypeScript-style field
//               declarations (`x: number;`). With modern targets these are
//               real class fields that start as `undefined`.
//   aos-ctor    Array of class instances whose fields are created only in
//               the constructor (`declare x: number;` emits no field).
//   aos-packed  One Float64Array, each particle's 6 fields side by side
//               (the AoS layout, but without object headers or pointers)
//   soa         One Float64Array per field (struct of arrays)
//   aosoa8      Blocks of 8 particles; inside a block, each field is
//               contiguous (array of structs of arrays, as in ISPC soa<8>)

export const FIELDS = ['x', 'y', 'vx', 'vy', 'mass', 'health'] as const;
export const NFIELDS = FIELDS.length;
export const BLOCK = 8;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  health: number;
}

export class ParticleC implements Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  health: number;
  constructor(x: number, y: number, vx: number, vy: number, mass: number, health: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.mass = mass;
    this.health = health;
  }
}

/** Same shape, but the fields only come into existence in the constructor. */
export class ParticleK implements Particle {
  declare x: number;
  declare y: number;
  declare vx: number;
  declare vy: number;
  declare mass: number;
  declare health: number;
  constructor(x: number, y: number, vx: number, vy: number, mass: number, health: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.mass = mass;
    this.health = health;
  }
}

export interface Soa {
  n: number;
  x: Float64Array;
  y: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
  mass: Float64Array;
  health: Float64Array;
}

/** mulberry32: a tiny deterministic PRNG, so every layout gets identical data. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function particleValues(n: number, seed = 42): Float64Array {
  const r = rng(seed);
  const out = new Float64Array(n * NFIELDS);
  for (let i = 0; i < n * NFIELDS; i++) out[i] = r() * 100;
  return out;
}

export function makeAos(v: Float64Array, n: number): Particle[] {
  const a: Particle[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * NFIELDS;
    a[i] = { x: v[o], y: v[o + 1], vx: v[o + 2], vy: v[o + 3], mass: v[o + 4], health: v[o + 5] };
  }
  return a;
}

export function makeAosClass(v: Float64Array, n: number): ParticleC[] {
  const a: ParticleC[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * NFIELDS;
    a[i] = new ParticleC(v[o], v[o + 1], v[o + 2], v[o + 3], v[o + 4], v[o + 5]);
  }
  return a;
}

export function makeAosCtor(v: Float64Array, n: number): ParticleK[] {
  const a: ParticleK[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * NFIELDS;
    a[i] = new ParticleK(v[o], v[o + 1], v[o + 2], v[o + 3], v[o + 4], v[o + 5]);
  }
  return a;
}

export function makePacked(v: Float64Array): Float64Array {
  return v.slice();
}

export function makeSoa(v: Float64Array, n: number): Soa {
  const s: Soa = {
    n,
    x: new Float64Array(n),
    y: new Float64Array(n),
    vx: new Float64Array(n),
    vy: new Float64Array(n),
    mass: new Float64Array(n),
    health: new Float64Array(n),
  };
  for (let i = 0; i < n; i++) {
    const o = i * NFIELDS;
    s.x[i] = v[o];
    s.y[i] = v[o + 1];
    s.vx[i] = v[o + 2];
    s.vy[i] = v[o + 3];
    s.mass[i] = v[o + 4];
    s.health[i] = v[o + 5];
  }
  return s;
}

/** AoSoA index of field f of particle i. */
export function aosoaIndex(i: number, f: number): number {
  const block = (i / BLOCK) | 0;
  return block * BLOCK * NFIELDS + f * BLOCK + (i % BLOCK);
}

export function makeAosoa(v: Float64Array, n: number): Float64Array {
  const blocks = Math.ceil(n / BLOCK);
  const out = new Float64Array(blocks * BLOCK * NFIELDS);
  for (let i = 0; i < n; i++) {
    for (let f = 0; f < NFIELDS; f++) out[aosoaIndex(i, f)] = v[i * NFIELDS + f];
  }
  return out;
}
