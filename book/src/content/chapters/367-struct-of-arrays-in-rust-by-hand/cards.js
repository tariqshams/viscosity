// Chapter 367 cards. Keys are stable ids: never rename them.

const HEAD = `#[derive(Clone, Copy, Debug, PartialEq)]
struct Particle {
    x: f64,
    vx: f64,
}

// One Vec per field. Invariant:
// x and vx have the same length.
struct Particles {
    x: Vec<f64>,
    vx: Vec<f64>,
}

impl Particles {
    fn new() -> Self {
        Particles {
            x: Vec::new(),
            vx: Vec::new(),
        }
    }
`;

const LEN = `
    fn len(&self) -> usize {
        self.x.len()
    }
`;

const GET = `
    // Rebuild particle i: a copy.
    fn get(&self, i: usize)
        -> Particle {
        Particle {
            x: self.x[i],
            vx: self.vx[i],
        }
    }
}`;

const PUSH = `
    fn push(&mut self, p: Particle) {
        self.x.push(p.x);
        self.vx.push(p.vx);
    }
`;

const STEP = `
    // x += vx * dt, for every particle.
    fn step(&mut self, dt: f64) {
        for i in 0..self.x.len() {
            let v = self.vx[i];
            self.x[i] += v * dt;
        }
    }
`;

const BASE = `#[derive(Clone, Copy, Debug, PartialEq)]
struct Particle {
    x: f64,
    vx: f64,
}

struct Particles {
    x: Vec<f64>,
    vx: Vec<f64>,
}
`;

export const prompts = {
  'rust-aos-flat': {
    q: 'How does a Rust `Vec<Particle>` differ in memory from a JavaScript array of particle objects?',
    a: 'The structs sit back to back inside the `Vec`’s buffer, with no object headers and no pointer per element.',
  },
  'soa-what': {
    q: 'What does a struct-of-arrays `Particles` look like in Rust?',
    a: 'A struct with one `Vec<f64>` per field: `x: Vec<f64>`, `vx: Vec<f64>`, …, where particle `i` is index `i` of each.',
  },
  'soa-invariant': {
    q: 'What must every method of a hand-written SoA struct keep true?',
    a: 'All the columns have the same length, so index `i` means the same particle in each.',
  },
  'soa-private': {
    q: 'How can you stop other modules from pushing to only one column?',
    a: 'Keep the column fields private (no `pub`) and expose methods like `push` that write every column.',
  },
  'soa-borrow': {
    q: 'Inside `step(&mut self)`, while iterating `self.x.iter_mut()`, why does `self.vx[i]` compile but `self.vx_at(i)` (a `&self` method) fail with E0502?',
    a: '`self.vx[i]` borrows only the `vx` field, separate from `x`. A method call borrows all of `self`, including the `x` column already borrowed mutably.',
  },
  'soa-get': {
    q: 'Why does a SoA `get(i)` return a `Particle` and not a `&Particle`?',
    a: 'No `Particle` exists in memory to point at; `get` builds one from the columns. Changing that copy doesn’t change the storage.',
  },
  'debug-soa': {
    q: 'In a debug build the SoA loop was several times slower than the AoS loop. Why not trust that?',
    a: 'Debug builds skip optimization, so every `s.x[i]` pays an unoptimized bounds check (about 20 ns per particle here, against 1.3 with `-O`). Layout comparisons need a release build.',
  },
  'soa-small': {
    q: 'With 1,000 particles, SoA and AoS measured the same in Rust. Why?',
    a: '1,000 particles are 48 KB; after the first pass they stay in cache, so fetching wasted bytes from memory never happens.',
  },
};

export const examples = {
  'soa-bench': {
    lang: 'rust',
    title: 'update-xy: AoS against SoA',
    code: `use std::hint::black_box;
use std::time::Instant;

const DT: f64 = 0.016;
const N: usize = 1_000_000;

#[derive(Clone, Copy)]
struct Particle {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    mass: f64,
    health: f64,
}

struct Particles {
    x: Vec<f64>,
    y: Vec<f64>,
    vx: Vec<f64>,
    vy: Vec<f64>,
    mass: Vec<f64>,
    health: Vec<f64>,
}

fn step_aos(ps: &mut [Particle]) {
    for p in ps.iter_mut() {
        p.x += p.vx * DT;
        p.y += p.vy * DT;
    }
}

fn step_soa(s: &mut Particles) {
    for i in 0..s.x.len() {
        s.x[i] += s.vx[i] * DT;
        s.y[i] += s.vy[i] * DT;
    }
}

// Median ns per particle of 11 runs.
fn time(mut f: impl FnMut()) -> f64 {
    let mut ts = Vec::new();
    for _ in 0..11 {
        let t = Instant::now();
        f();
        let ns = t.elapsed().as_nanos();
        ts.push(ns as f64 / N as f64);
    }
    ts.sort_by(|a, b| a.total_cmp(b));
    ts[5]
}

fn main() {
    let p = Particle {
        x: 0.0, y: 0.0, vx: 1.0,
        vy: 0.5, mass: 1.0, health: 1.0,
    };
    let mut aos = vec![p; N];
    let col = |v: f64| vec![v; N];
    let mut soa = Particles {
        x: col(0.0), y: col(0.0),
        vx: col(1.0), vy: col(0.5),
        mass: col(1.0),
        health: col(1.0),
    };
    let a = time(|| {
        step_aos(black_box(&mut aos))
    });
    let s = time(|| {
        step_soa(black_box(&mut soa))
    });
    println!("aos {a:.2} ns/particle");
    println!("soa {s:.2} ns/particle");
    println!("same: {}",
        aos[7].x == soa.x[7]);
}`,
  },
};

export const exercises = {
  particles: {
    lang: 'rust',
    title: 'Columns by hand',
    prompt:
      'Finish this struct of arrays. `push` adds a particle by writing every column, `len` counts particles, `step` moves every particle by `vx * dt`, and `get` rebuilds particle `i` as a `Particle` value.',
    starter: `${HEAD}
    fn push(&mut self, p: Particle) {
        todo!()
    }

    fn len(&self) -> usize {
        todo!()
    }

    // x += vx * dt, for every particle.
    fn step(&mut self, dt: f64) {
        todo!()
    }

    // Rebuild particle i: a copy.
    fn get(&self, i: usize)
        -> Particle {
        todo!()
    }
}`,
    solution: `${HEAD}${PUSH}${LEN}${STEP}${GET}`,
    tests: `fn three() -> Particles {
    let mut ps = Particles::new();
    for i in 0..3 {
        let f = i as f64;
        ps.push(Particle { x: f, vx: 10.0 * f });
    }
    ps
}

#[test]
fn push_fills_every_column() {
    let ps = three();
    assert_eq!(ps.len(), 3);
    assert_eq!(ps.x, vec![0.0, 1.0, 2.0]);
    assert_eq!(ps.vx, vec![0.0, 10.0, 20.0]);
}

#[test]
fn get_rebuilds_a_particle() {
    let ps = three();
    assert_eq!(ps.get(2), Particle { x: 2.0, vx: 20.0 });
}

#[test]
fn step_matches_the_aos_loop() {
    let mut ps = three();
    let mut aos: Vec<Particle> =
        (0..3).map(|i| ps.get(i)).collect();
    for p in aos.iter_mut() {
        p.x += p.vx * 0.5;
    }
    ps.step(0.5);
    for i in 0..3 {
        assert_eq!(ps.get(i), aos[i]);
    }
}

#[test]
fn a_copy_is_not_the_storage() {
    let ps = three();
    let mut p = ps.get(1);
    p.x = 99.0;
    assert_eq!(ps.get(1).x, 1.0);
}`,
    hints: [
      '`push` takes the particle apart: `self.x.push(p.x)` and the same for `vx`.',
      'Every column has the same length, so `len` can ask any one of them.',
      'In `step`, loop `for i in 0..self.x.len()` and update `self.x[i]` from `self.vx[i]`.',
      '`get` builds a new `Particle { x: self.x[i], vx: self.vx[i] }`.',
    ],
    walkthrough: `**How to think about it.** This is the container *Generating SoA storage* had Viscosity write, done by hand. Hold the diagram in mind: particle \`i\` is index \`i\` of every column. So every method answers one question: which index of which columns does it touch? \`push\` touches the *new* index of every column, \`len\` asks any one column, \`step\` touches every index of \`x\` and \`vx\`, and \`get\` reads index \`i\` of every column. Write them in that order, since \`len\` and \`get\` are what the tests use to check \`push\`.

**The solution, line by line.**

- \`fn push(&mut self, p: Particle) {\` takes \`&mut self\` because it changes the columns, and takes the particle by value (it is \`Copy\`).
- \`    self.x.push(p.x);\` and \`    self.vx.push(p.vx);\` append each field to its own column. Both lines must be there: after them, both columns are one longer, so the invariant (equal lengths) still holds.
- \`fn len(&self) -> usize { self.x.len() }\` asks one column. That is only correct because of the invariant, which is why the fields should stay private to the module that owns this type.
- \`fn step(&mut self, dt: f64) {\` is the hot loop. \`for i in 0..self.x.len() {\` visits every index.
- \`    let v = self.vx[i];\` copies the speed out (an \`f64\` is \`Copy\`), and \`    self.x[i] += v * dt;\` moves the particle. Written as one statement, \`self.x[i] += self.vx[i] * dt\`, it borrows two different fields at once, which is also allowed. The loop streams through two \`Vec<f64>\`s and nothing else.
- \`fn get(&self, i: usize) -> Particle {\` builds \`Particle { x: self.x[i], vx: self.vx[i] }\`: materialization, as *Identity and materialization* called it. It returns a value, not a reference, because there is no \`Particle\` in memory to refer to. The last test shows the consequence: changing the copy changes nothing in the columns.

**Common wrong attempts.**

- Forgetting one column in \`push\` compiles (both columns are \`Vec<f64>\`, and nothing ties them together), but \`vx\` stays empty, so \`step\` and \`get\` index past its end and panic. In Part VIII the compiler wrote this code; by hand, tests are your safety net.
- Forgetting \`* dt\` in \`step\` moves each particle a whole \`vx\` per step; the test that compares with the plain AoS loop catches it.
- Writing \`step\` as \`for (i, x) in self.x.iter_mut().enumerate()\` with a helper method \`self.vx_at(i)\` inside fails with E0502: the method borrows all of \`self\` while the loop holds \`self.x\` mutably. Index the field directly.`,
    wrong: [
      {
        code: `${HEAD}
    fn push(&mut self, p: Particle) {
        self.x.push(p.x);
    }
${LEN}${STEP}${GET}`,
        why: '`vx` is never filled. `len` still says 3, but `step` and `get` index past the end of the empty `vx` column and panic.',
      },
      {
        code: `${HEAD}${PUSH}${LEN}
    fn step(&mut self, dt: f64) {
        for i in 0..self.x.len() {
            self.x[i] += self.vx[i];
        }
    }
${GET}`,
        why: 'This forgets `dt`: each step moves a particle by a whole `vx`, so it no longer matches the AoS loop.',
      },
    ],
  },
  convert: {
    lang: 'rust',
    optional: true,
    title: 'AoS to SoA and back',
    prompt:
      'Write `from_aos`, which turns a slice of `Particle`s into columns, and `to_aos`, which rebuilds a `Vec<Particle>` from the columns. Iterators (from *Iterators and closures in Rust*) make each one short.',
    starter: `${BASE}
fn from_aos(ps: &[Particle])
    -> Particles {
    todo!()
}

fn to_aos(s: &Particles)
    -> Vec<Particle> {
    todo!()
}`,
    solution: `${BASE}
fn from_aos(ps: &[Particle])
    -> Particles {
    let x = ps.iter().map(|p| p.x);
    let vx = ps.iter().map(|p| p.vx);
    Particles {
        x: x.collect(),
        vx: vx.collect(),
    }
}

fn to_aos(s: &Particles)
    -> Vec<Particle> {
    s.x.iter()
        .zip(&s.vx)
        .map(|(&x, &vx)| {
            Particle { x, vx }
        })
        .collect()
}`,
    tests: `fn sample() -> Vec<Particle> {
    vec![
        Particle { x: 1.0, vx: 0.5 },
        Particle { x: 2.0, vx: -1.0 },
    ]
}

#[test]
fn columns_hold_each_field() {
    let s = from_aos(&sample());
    assert_eq!(s.x, vec![1.0, 2.0]);
    assert_eq!(s.vx, vec![0.5, -1.0]);
}

#[test]
fn round_trip() {
    let ps = sample();
    assert_eq!(to_aos(&from_aos(&ps)), ps);
}

#[test]
fn empty() {
    let s = from_aos(&[]);
    assert!(to_aos(&s).is_empty());
}`,
    hints: [
      'One column is `ps.iter().map(|p| p.x)`, collected into a `Vec`.',
      'For `to_aos`, `s.x.iter().zip(&s.vx)` walks both columns in step and gives you pairs of references.',
      'The closure `|(&x, &vx)| Particle { x, vx }` takes each pair apart and builds a particle.',
    ],
    walkthrough: `**How to think about it.** Converting AoS to SoA means building each column from one field of every particle; converting back means walking all the columns in step and gluing index \`i\` of each into a particle. Both are jobs for iterator chains from *Iterators and closures in Rust*: \`map\` to pick a field, \`zip\` to walk two columns together, \`collect\` to build a \`Vec\`.

**The solution, line by line.**

- \`let x = ps.iter().map(|p| p.x);\` is a lazy iterator that yields each particle's \`x\`; nothing runs yet.
- \`let vx = ps.iter().map(|p| p.vx);\` is the same for \`vx\`: a second pass over the slice.
- \`Particles { x: x.collect(), vx: vx.collect() }\` runs both iterators, gathering each into a new \`Vec<f64>\` (the type comes from the struct's fields). This is the “construct” step of *AoS vs SoA, measured*, done eagerly.
- In \`to_aos\`, \`s.x.iter().zip(&s.vx)\` walks both columns at once, yielding pairs \`(&f64, &f64)\`; \`zip\` stops at the shorter one.
- \`.map(|(&x, &vx)| Particle { x, vx })\` takes each pair apart; the \`&\` in the pattern copies the numbers out of the references, and \`Particle { x, vx }\` is shorthand for \`Particle { x: x, vx: vx }\`.
- \`.collect()\` builds the \`Vec<Particle>\` the signature asks for. Building a whole \`Vec<Particle>\` like this is materialization in bulk, the case *When SoA loses: materialization and AoSoA* measured as SoA's weak spot.

**Common wrong attempts.**

- Copy-pasting the first line and forgetting to change \`p.x\` to \`p.vx\` fills the \`vx\` column with positions. Both are \`Vec<f64>\`, so the compiler cannot see it; the first test does.
- \`ps.iter().map(|p| (p.x, p.vx)).collect()\` builds a \`Vec<(f64, f64)>\`, which is still an array of structs (of tuples), not two columns, and does not match the return type.`,
    wrong: [
      {
        code: `${BASE}
fn from_aos(ps: &[Particle])
    -> Particles {
    let x = ps.iter().map(|p| p.x);
    let vx = ps.iter().map(|p| p.x);
    Particles {
        x: x.collect(),
        vx: vx.collect(),
    }
}

fn to_aos(s: &Particles)
    -> Vec<Particle> {
    s.x.iter()
        .zip(&s.vx)
        .map(|(&x, &vx)| {
            Particle { x, vx }
        })
        .collect()
}`,
        why: 'Both columns are built from `p.x`, so `vx` holds positions. A copy-pasted column is the classic SoA bug, and the compiler can’t see it: both are `Vec<f64>`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why is SoA’s advantage smaller in Rust than in the book’s JavaScript runs?',
    options: [
      { t: 'Rust doesn’t have cache lines', why: 'Cache lines belong to the hardware, not the language.' },
      { t: 'Rust’s `Vec<Particle>` is already flat: no headers, no pointers, no boxed numbers, so the AoS baseline is much faster', correct: true, why: 'Both layouts are contiguous `f64`s in Rust; SoA only saves the unused fields.' },
      { t: 'Rust automatically turns `Vec<Particle>` into SoA', why: 'It doesn’t. A `Vec<Particle>` stays an array of structs.' },
    ],
  },
  {
    q: 'A loop sums only `mass` over a million `Particle`s (six `f64` fields). Roughly what fraction of the bytes it fetches does it use, in AoS?',
    options: [
      { t: 'About a sixth', correct: true, why: '8 useful bytes of every 48. In SoA the mass column is all useful.' },
      { t: 'All of them', why: 'Lines bring in the other five fields too.' },
      { t: 'Half', why: 'That would be 24 of 48 bytes; the loop needs only 8.' },
      { t: 'None: the prefetcher skips the other fields', why: 'The prefetcher fetches whole lines; it can’t pick fields out of them.' },
    ],
  },
  {
    q: 'You time the SoA and AoS loops in the Rust Playground’s default mode and SoA is slower. What should you conclude?',
    options: [
      { t: 'SoA is slower in Rust', why: 'This chapter’s release build measured the opposite at a million particles.' },
      { t: 'The Playground’s CPU has no cache', why: 'It has; the build mode is the issue.' },
      { t: 'Probably nothing: it is a debug build, with unoptimized indexing. Measure with `--release`', correct: true, why: 'On this book’s machine the debug build made SoA two to five times slower than AoS; the `-O` build made it almost twice as fast.' },
    ],
  },
  {
    q: 'In a SoA `Particles`, which of these is rejected by the borrow checker?',
    options: [
      { t: '`let xs = &mut s.x; let vs = &s.vx;` used together', why: 'Different fields are separate borrows: allowed.' },
      { t: 'Calling a `&self` method inside a loop over `self.x.iter_mut()`', correct: true, why: 'The method borrows all of `self`, including the `x` column the loop already borrows mutably: E0502.' },
      { t: '`s.x[i] += s.vx[i] * dt;`', why: 'This is the hot loop; it compiles.' },
    ],
  },
  {
    q: 'What does Viscosity give you that a hand-written Rust SoA doesn’t?',
    options: [
      { t: 'Faster columns: a `Float64Array` beats a `Vec<f64>`', why: 'Both are contiguous doubles; that isn’t the difference.' },
      { t: 'A guarantee that `Vec` never reallocates', why: 'Neither promises that; both grow.' },
      { t: 'The rewrite done for you, with a safety analysis that every access was rewritten and the columns stay in step', correct: true, why: 'By hand, keeping every column in sync is your job, and tests are your check.' },
    ],
  },
];
