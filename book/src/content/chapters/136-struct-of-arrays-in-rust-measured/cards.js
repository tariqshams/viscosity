// Chapter 72 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 136, 136, 136.

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
    a: 'Debug builds skip optimisation, so every `s.x[i]` pays an unoptimised bounds check (about 20 ns per particle here, against 1.3 with `-O`). Layout comparisons need a release build.',
  },
  'soa-small': {
    q: 'With 1,000 particles, SoA and AoS measured the same in Rust. Why?',
    a: '1,000 particles are 48 KB; after the first pass they stay in cache, so fetching wasted bytes from memory never happens.',
  },
  'debug-default': {
    q: 'Which profile does a plain `cargo build` or `cargo run` use, and at what `opt-level`?',
    a: 'The `dev` profile, with `opt-level = 0`: no optimisation.',
  },
  'release-what': {
    q: 'What does `--release` change, by default?',
    a: '`opt-level = 3`, and debug assertions and integer overflow checks turned off.',
  },
  'overflow-modes': {
    q: 'What does adding 1 to a `u8` holding 255 do in a debug build, and in a release build?',
    a: 'Debug: panics with “attempt to add with overflow”. Release: wraps around to 0.',
  },
  'runner-mode': {
    q: 'Which build mode does this book’s Run button use for Rust?',
    a: 'Debug, on the Rust Playground. Open the code in the Playground to switch to Release.',
  },
  'bb-why': {
    q: 'Why did a release-mode loop summing a million numbers 100 times “take” under 200 ns?',
    a: 'Its result was never used, so the optimiser deleted the work. Nothing was measured.',
  },
  'bb-what': {
    q: 'What does `std::hint::black_box(x)` do?',
    a: 'Returns `x` unchanged, while the compiler must assume the value is used in unknown ways, so it cannot delete or precompute the work around it.',
  },
  'bb-limit': {
    q: 'Name two limits of `black_box`.',
    a: 'It is best-effort (never rely on it for correctness), and it does not stop the optimiser rewriting the code between the hidden values, e.g. a loop into a formula.',
  },
  'whole-program': {
    q: 'Why does drip-rs’s `bench.sh` not need `black_box`?',
    a: 'It times whole programs in fresh processes, and each program prints its results: printing is a side effect the optimiser must keep.',
  },
  'crit-what': {
    q: 'What is criterion, and why do stable-Rust projects use it?',
    a: 'A statistical benchmarking crate run by `cargo bench`. The built-in `#[bench]` attribute is nightly-only, so the Cargo book points to crates like it.',
  },
  'crit-harness': {
    q: 'Why does a criterion benchmark need `harness = false` in `Cargo.toml`?',
    a: 'It tells Cargo the bench file brings its own `main` (written by `criterion_main!`) instead of using the built-in test harness.',
  },
  'crit-nightly': {
    q: 'Which profile does `cargo bench` build with?',
    a: '`bench`, which inherits from `release`: optimised, with overflow checks off.',
  },
  'crit-slope': {
    q: 'Criterion runs samples of d, 2d, 3d … iterations. What does it take as the time per iteration, and why not time one call?',
    a: 'The slope of the line fitted through (iterations, total time). One short call is below what the clock can measure well.',
  },
  'crit-ci': {
    q: 'How does criterion get the interval it prints, such as `[658.64 ns 665.74 ns 672.99 ns]`?',
    a: 'By bootstrapping: resample the samples with repeats many times, fit a line to each, and keep the middle 95 percent of the slopes. The middle number is the estimate.',
  },
  tukey: {
    q: 'When does criterion call a sample a severe outlier?',
    a: 'When it lies more than 3 interquartile ranges below the first quartile or above the third (1.5 makes it mild). It is reported, not dropped.',
  },
  'crit-change': {
    q: 'Criterion says “Performance has improved” (p = 0.00) but you changed nothing. Why?',
    a: 'The machine was quieter on that run. The test detects any real difference in the timings, including one caused by other programs.',
  },
  'crit-noise': {
    q: 'What two conditions must hold before criterion reports a change, by default?',
    a: 'The test must say the difference is unlikely to be chance (p < 0.05), and it must be bigger than the noise threshold, 1 percent.',
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
  'bb-play': {
    lang: 'rust',
    title: 'Plain and black-boxed timing',
    code: `use std::hint::black_box;
use std::time::Instant;

fn sum(xs: &[f64]) -> f64 {
    let mut s = 0.0;
    for x in xs {
        s += x;
    }
    s
}

fn main() {
    let xs: Vec<f64> = (0..1_000_000)
        .map(|i| i as f64)
        .collect();

    let t = Instant::now();
    for _ in 0..100 {
        sum(&xs);
    }
    let d = t.elapsed();
    println!("plain: {d:?}");

    let t = Instant::now();
    for _ in 0..100 {
        black_box(sum(black_box(&xs)));
    }
    let d = t.elapsed();
    println!("boxed: {d:?}");
}`,
  },
  'overflow-play': {
    lang: 'rust',
    title: 'Overflow in a debug build',
    expectError: true,
    code: `use std::hint::black_box;

fn main() {
    // black_box hides the 255, so the
    // check happens at run time.
    let x: u8 = black_box(255);
    let y = x + 1;
    println!("255 + 1 = {y}");
}`,
  },
  bootstrap: {
    lang: 'rust',
    title: 'A bootstrap by hand',
    code: `// A bootstrap by hand: how sure can we
// be of the mean of 12 noisy timings?
const A: u64 = 6364136223846793005;

fn mean(xs: &[f64]) -> f64 {
    let s: f64 = xs.iter().sum();
    s / xs.len() as f64
}

fn main() {
    let ts = [
        665.0, 671.0, 659.0, 702.0,
        668.0, 663.0, 690.0, 661.0,
        667.0, 735.0, 664.0, 670.0,
    ];
    let n = ts.len();
    // A tiny random number generator
    // (same numbers on every run).
    let mut seed: u64 = 42;
    let mut rand = move |k: usize| {
        seed = seed.wrapping_mul(A)
            .wrapping_add(1);
        (seed >> 33) as usize % k
    };
    let mut means = Vec::new();
    for _ in 0..10_000 {
        // n timings, with repeats
        let pick: Vec<f64> = (0..n)
            .map(|_| ts[rand(n)])
            .collect();
        means.push(mean(&pick));
    }
    means.sort_by(f64::total_cmp);
    let lo = means[250];
    let hi = means[9750];
    let m = mean(&ts);
    println!("mean {m:.1} ns");
    println!("95%: [{lo:.1}, {hi:.1}]");
}`,
  },
};

export const exercises = {
  particles: {
    lang: 'rust',
    title: 'Columns by hand',
    prompt: 'Finish this struct of arrays. `push` adds a particle by writing every column, `len` counts particles, `step` moves every particle by `vx * dt`, and `get` rebuilds particle `i` as a `Particle` value.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
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
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
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

    fn push(&mut self, p: Particle) {
        self.x.push(p.x);
        self.vx.push(p.vx);
    }

    fn len(&self) -> usize {
        self.x.len()
    }

    // x += vx * dt, for every particle.
    fn step(&mut self, dt: f64) {
        for i in 0..self.x.len() {
            let v = self.vx[i];
            self.x[i] += v * dt;
        }
    }

    // Rebuild particle i: a copy.
    fn get(&self, i: usize)
        -> Particle {
        Particle {
            x: self.x[i],
            vx: self.vx[i],
        }
    }
}`,
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
- \`fn get(&self, i: usize) -> Particle {\` builds \`Particle { x: self.x[i], vx: self.vx[i] }\`: materialisation, as *Identity and materialization* called it. It returns a value, not a reference, because there is no \`Particle\` in memory to refer to. The last test shows the consequence: changing the copy changes nothing in the columns.

**Common wrong attempts.**

- Forgetting one column in \`push\` compiles (both columns are \`Vec<f64>\`, and nothing ties them together), but \`vx\` stays empty, so \`step\` and \`get\` index past its end and panic. In Part VIII the compiler wrote this code; by hand, tests are your safety net.
- Forgetting \`* dt\` in \`step\` moves each particle a whole \`vx\` per step; the test that compares with the plain AoS loop catches it.
- Writing \`step\` as \`for (i, x) in self.x.iter_mut().enumerate()\` with a helper method \`self.vx_at(i)\` inside fails with E0502: the method borrows all of \`self\` while the loop holds \`self.x\` mutably. Index the field directly.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
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

    fn push(&mut self, p: Particle) {
        self.x.push(p.x);
    }

    fn len(&self) -> usize {
        self.x.len()
    }

    // x += vx * dt, for every particle.
    fn step(&mut self, dt: f64) {
        for i in 0..self.x.len() {
            let v = self.vx[i];
            self.x[i] += v * dt;
        }
    }

    // Rebuild particle i: a copy.
    fn get(&self, i: usize)
        -> Particle {
        Particle {
            x: self.x[i],
            vx: self.vx[i],
        }
    }
}`,
        why: '`vx` is never filled. `len` still says 3, but `step` and `get` index past the end of the empty `vx` column and panic.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
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

    fn push(&mut self, p: Particle) {
        self.x.push(p.x);
        self.vx.push(p.vx);
    }

    fn len(&self) -> usize {
        self.x.len()
    }

    fn step(&mut self, dt: f64) {
        for i in 0..self.x.len() {
            self.x[i] += self.vx[i];
        }
    }

    // Rebuild particle i: a copy.
    fn get(&self, i: usize)
        -> Particle {
        Particle {
            x: self.x[i],
            vx: self.vx[i],
        }
    }
}`,
        why: 'This forgets `dt`: each step moves a particle by a whole `vx`, so it no longer matches the AoS loop.',
      },
    ],
  },
  convert: {
    lang: 'rust',
    optional: true,
    title: 'AoS to SoA and back',
    prompt: 'Write `from_aos`, which turns a slice of `Particle`s into columns, and `to_aos`, which rebuilds a `Vec<Particle>` from the columns. Iterators (from *Iterators in Rust*) make each one short.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
struct Particle {
    x: f64,
    vx: f64,
}

struct Particles {
    x: Vec<f64>,
    vx: Vec<f64>,
}

fn from_aos(ps: &[Particle])
    -> Particles {
    todo!()
}

fn to_aos(s: &Particles)
    -> Vec<Particle> {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
struct Particle {
    x: f64,
    vx: f64,
}

struct Particles {
    x: Vec<f64>,
    vx: Vec<f64>,
}

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
    walkthrough: `**How to think about it.** Converting AoS to SoA means building each column from one field of every particle; converting back means walking all the columns in step and gluing index \`i\` of each into a particle. Both are jobs for iterator chains from *Iterators in Rust*: \`map\` to pick a field, \`zip\` to walk two columns together, \`collect\` to build a \`Vec\`.

**The solution, line by line.**

- \`let x = ps.iter().map(|p| p.x);\` is a lazy iterator that yields each particle's \`x\`; nothing runs yet.
- \`let vx = ps.iter().map(|p| p.vx);\` is the same for \`vx\`: a second pass over the slice.
- \`Particles { x: x.collect(), vx: vx.collect() }\` runs both iterators, gathering each into a new \`Vec<f64>\` (the type comes from the struct's fields). This is the “construct” step of *AoS vs SoA, measured*, done eagerly.
- In \`to_aos\`, \`s.x.iter().zip(&s.vx)\` walks both columns at once, yielding pairs \`(&f64, &f64)\`; \`zip\` stops at the shorter one.
- \`.map(|(&x, &vx)| Particle { x, vx })\` takes each pair apart; the \`&\` in the pattern copies the numbers out of the references, and \`Particle { x, vx }\` is shorthand for \`Particle { x: x, vx: vx }\`.
- \`.collect()\` builds the \`Vec<Particle>\` the signature asks for. Building a whole \`Vec<Particle>\` like this is materialisation in bulk, the case *When SoA loses: materialization and AoSoA* measured as SoA's weak spot.

**Common wrong attempts.**

- Copy-pasting the first line and forgetting to change \`p.x\` to \`p.vx\` fills the \`vx\` column with positions. Both are \`Vec<f64>\`, so the compiler cannot see it; the first test does.
- \`ps.iter().map(|p| (p.x, p.vx)).collect()\` builds a \`Vec<(f64, f64)>\`, which is still an array of structs (of tuples), not two columns, and does not match the return type.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct Particle {
    x: f64,
    vx: f64,
}

struct Particles {
    x: Vec<f64>,
    vx: Vec<f64>,
}

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
  summary: {
    lang: 'rust',
    title: 'Summarise the samples',
    prompt: 'A timing harness collects one time per run, in any order. Write `summary(xs)`, which returns `(min, median, p95)`, taking the minimum and median the way engine/rust’s `compile_speed` does and adding a p95: sort a copy of the samples, then take the value at index `0`, at index `n / 2`, and at index `n * 95 / 100`. Do not change the caller’s slice. You may assume `xs` is not empty.',
    starter: `// (min, median, p95) of the samples.
// median: the value at index n / 2 of
// the sorted samples; p95: the value at
// index n * 95 / 100.
fn summary(xs: &[f64])
    -> (f64, f64, f64) {
    todo!()
}`,
    solution: `// (min, median, p95) of the samples.
// median: the value at index n / 2 of
// the sorted samples; p95: the value at
// index n * 95 / 100.
fn summary(xs: &[f64])
    -> (f64, f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[0], s[n / 2], s[n * 95 / 100])
}`,
    tests: `#[test]
fn one_sample() {
    assert_eq!(summary(&[5.0]), (5.0, 5.0, 5.0));
}

#[test]
fn order_does_not_matter() {
    let xs = [3.0, 1.0, 2.0];
    assert_eq!(summary(&xs), (1.0, 2.0, 3.0));
}

#[test]
fn p95_of_a_hundred() {
    let xs: Vec<f64> =
        (1..=100).rev().map(|i| i as f64).collect();
    assert_eq!(summary(&xs), (1.0, 51.0, 96.0));
}

#[test]
fn one_slow_run_moves_only_the_tail() {
    let mut xs = vec![10.0; 99];
    xs.push(500.0);
    let (min, med, p95) = summary(&xs);
    assert_eq!((min, med, p95), (10.0, 10.0, 10.0));
    assert_eq!(xs[99], 500.0);
}`,
    hints: [
      'All three answers are positions in the *sorted* samples. You may not sort `xs` itself (it is borrowed, not yours), so make a copy with `to_vec()`.',
      '`f64` has no ordinary `sort()`, because NaN breaks ordering. Use `s.sort_by(f64::total_cmp)`, as `compile_speed` does.',
      'Then return `(s[0], s[n / 2], s[n * 95 / 100])`, where `n = s.len()`. Integer division rounds down, which keeps every index below `n`.',
    ],
    walkthrough: `**How to think about it.** *Noisy numbers: the median, p95 and a fresh process* explained why one timing is not enough and why the median and p95 describe a noisy set of samples better than the mean. Every one of those statistics is "the value at some position once the samples are sorted", so the work is: sort a copy, then index it three times. The only questions are which positions, and how to sort floating-point numbers in Rust.

**The solution, line by line.**

- \`fn summary(xs: &[f64]) -> (f64, f64, f64) {\` borrows the samples and returns three numbers as a tuple.
- \`    let mut s = xs.to_vec();\` copies them into a \`Vec\` this function owns, so it may reorder it; the caller's slice is untouched, which the last test checks.
- \`    s.sort_by(f64::total_cmp);\` sorts ascending. \`f64\` only has a partial order (NaN is not less than, equal to or greater than anything), so \`sort()\` does not exist for it; \`total_cmp\` is a total order that puts NaN at the end, and passing the function itself as the comparator is the same trick engine/rust uses.
- \`    let n = s.len();\` names the count.
- \`    (s[0], s[n / 2], s[n * 95 / 100])\` picks the smallest, the middle and the 95th-percentile sample. With 100 samples sorted 1 to 100 those indices are 0, 50 and 95, so the values are 1, 51 and 96. With one sample every index is 0. Integer division rounds down, so \`n * 95 / 100\` is always below \`n\` and the indexing can never panic for a non-empty slice.

The last test is the point of reporting more than one number: one slow run in a hundred (a hiccup on a shared VM) changes neither the minimum nor the median nor, here, the p95; only a mean would be dragged up by it.

**Common wrong attempts.**

- \`xs.sort()\` fails twice: \`xs\` is a shared borrow, so it cannot be sorted in place, and \`[f64]\` has no \`sort\` at all (\`f64\` is not \`Ord\`).
- Forgetting to sort returns positions in the order the samples arrived: the "minimum" of \`[3.0, 1.0, 2.0]\` would be 3.
- \`s[n * 95 / 100 - 1]\` (an off-by-one "fix") gives 95 instead of 96 for the hundred samples, and panics for one sample.`,
    wrong: [
      {
        code: `// (min, median, p95) of the samples.
// median: the value at index n / 2 of
// the sorted samples; p95: the value at
// index n * 95 / 100.
fn summary(xs: &[f64])
    -> (f64, f64, f64) {
    let n = xs.len();
    (xs[0], xs[n / 2], xs[n * 95 / 100])
}`,
        why: 'Without sorting, positions mean nothing: `[3.0, 1.0, 2.0]` gives a “minimum” of 3.',
      },
      {
        code: `// (min, median, p95) of the samples.
// median: the value at index n / 2 of
// the sorted samples; p95: the value at
// index n * 95 / 100.
fn summary(xs: &[f64])
    -> (f64, f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[0], s[n / 2], s[n - 1])
}`,
        why: 'The last element is the maximum, not the p95: the one slow run (500) becomes the reported tail.',
      },
    ],
  },
  measure: {
    lang: 'rust',
    optional: true,
    title: 'A timing loop that keeps its work',
    prompt: 'Write `measure(runs, f)`, which calls the closure `f` exactly `runs` times, timing each call with `Instant`, and returns the times in microseconds. Pass each result of `f` through `black_box`, so an optimised build cannot delete the calls.',
    starter: `use std::hint::black_box;
use std::time::Instant;

// Call f \`runs\` times; return each
// call's time in microseconds.
fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    todo!()
}`,
    solution: `use std::hint::black_box;
use std::time::Instant;

// Call f \`runs\` times; return each
// call's time in microseconds.
fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    let mut us = Vec::new();
    for _ in 0..runs {
        let t = Instant::now();
        black_box(f());
        let d = t.elapsed();
        us.push(d.as_secs_f64() * 1e6);
    }
    us
}`,
    tests: `#[test]
fn one_time_per_run() {
    let ts = measure(7, || 1 + 1);
    assert_eq!(ts.len(), 7);
}

#[test]
fn calls_f_exactly_runs_times() {
    let mut calls = 0;
    measure(5, || calls += 1);
    assert_eq!(calls, 5);
}

#[test]
fn times_are_not_negative() {
    let ts = measure(3, || {
        (0..1000).sum::<u64>()
    });
    assert!(ts.iter().all(|&t| t >= 0.0));
}`,
    hints: [
      'Start an empty `Vec<f64>`, and loop `for _ in 0..runs`.',
      'Inside: `let t = Instant::now();`, call `f()`, then `t.elapsed()` gives a `Duration`.',
      'Write the call as `black_box(f());`, and push `t.elapsed().as_secs_f64() * 1e6`.',
    ],
    walkthrough: `**How to think about it.** This is the core of engine/rust's \`compile_speed\` example, without the warm-up: a loop that times one call at a time and keeps the result alive. Two details matter: \`f\` is \`FnMut\`, so it may change things it captured (the second test counts calls that way), and the result must flow into \`black_box\` or a release build may skip the call.

**The solution, line by line.**

- \`fn measure<T>(runs: usize, mut f: impl FnMut() -> T) -> Vec<f64> {\` accepts any closure returning any type \`T\`. \`mut f\` because calling an \`FnMut\` needs mutable access to it.
- \`    let mut us = Vec::new();\` collects microseconds.
- \`    for _ in 0..runs {\` runs exactly \`runs\` times.
- \`        let t = Instant::now();\` starts a clock just before the call.
- \`        black_box(f());\` calls the closure and hands its result to \`black_box\`, so the compiler must assume it is used.
- \`        let d = t.elapsed();\` reads the elapsed time as a \`Duration\`.
- \`        us.push(d.as_secs_f64() * 1e6);\` turns it into seconds as an \`f64\`, then microseconds, and stores it.
- \`    us\` returns the samples, ready for \`summary\`.

**Common wrong attempts.**

- Timing the whole loop once and dividing by \`runs\` gives an average, not samples; you lose the spread that the median and p95 describe, and the test expecting \`runs\` values fails.
- Calling \`f()\` without \`black_box\` passes these tests (they run in debug), but in a release build the calls may vanish, which is exactly the trap in the chapter.`,
    wrong: [
      {
        code: `use std::hint::black_box;
use std::time::Instant;

fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    let t = Instant::now();
    for _ in 0..runs {
        black_box(f());
    }
    let d = t.elapsed().as_secs_f64();
    vec![d * 1e6 / runs as f64]
}`,
        why: 'One averaged number, not one sample per run: the spread is lost, and the length test fails.',
      },
    ],
  },
  tukey: {
    lang: 'rust',
    title: 'Outliers the way criterion counts them',
    prompt: '`quartiles` is given. Write `fences(xs, k)`, which returns `(q1 - k·iqr, q3 + k·iqr)` where `iqr = q3 - q1`. Then write `outliers(xs)`, which returns `(mild, severe)`: a sample is **severe** if it lies outside the `k = 3.0` fences, and **mild** if it lies outside the `k = 1.5` fences but not outside the `3.0` ones. Count both low and high samples.',
    starter: `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    todo!()
}

// (mild, severe), as criterion counts.
fn outliers(xs: &[f64])
    -> (usize, usize) {
    todo!()
}`,
    solution: `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    let iqr = q3 - q1;
    (q1 - k * iqr, q3 + k * iqr)
}

// (mild, severe), as criterion counts.
fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < vlo || x > vhi {
            severe += 1;
        } else if x < lo || x > hi {
            mild += 1;
        }
    }
    (mild, severe)
}`,
    tests: `#[test]
fn fences_from_quartiles() {
    // sorted: 10 10 11 12 12 13 14 14
    let xs = [10.0, 14.0, 12.0, 11.0, 13.0, 10.0, 14.0, 12.0];
    assert_eq!(quartiles(&xs), (11.0, 14.0));
    assert_eq!(fences(&xs, 1.5), (6.5, 18.5));
    assert_eq!(fences(&xs, 3.0), (2.0, 23.0));
}

#[test]
fn quiet_samples_have_no_outliers() {
    let xs = [600.0, 601.0, 598.0, 603.0, 599.0, 602.0, 600.0, 597.0];
    assert_eq!(outliers(&xs), (0, 0));
}

#[test]
fn one_mild_one_severe() {
    // q1 = 101, q3 = 104, iqr = 3
    let xs = [100.0, 101.0, 102.0, 103.0, 104.0, 100.0, 102.0, 104.0, 112.0, 130.0];
    assert_eq!(fences(&xs, 1.5), (96.5, 108.5));
    assert_eq!(outliers(&xs), (1, 1));
}

#[test]
fn low_outliers_count_too() {
    let xs = [50.0, 51.0, 52.0, 53.0, 50.0, 51.0, 52.0, 53.0, 1.0];
    assert_eq!(outliers(&xs), (0, 1));
}`,
    hints: [
      'Start with `fences`. It is three lines: get `(q1, q3)` from `quartiles`, compute `iqr = q3 - q1`, and return the pair of fences.',
      'In `outliers`, compute both pairs of fences once, before the loop: `fences(xs, 1.5)` and `fences(xs, 3.0)`. Then visit every sample with `for &x in xs`.',
      'Test the severe fences first, and use `else if` for the mild ones, so a severe sample is not counted twice.',
    ],
    walkthrough: `**How to think about it.** This is the first step of criterion's analysis: Tukey's method, with an extra, wider pair of fences for severe outliers. Draw the figure from the chapter: the middle half of the data is the box from Q1 to Q3, its width is the IQR, and the fences sit 1.5 and 3 box-widths outside it. So \`fences\` is arithmetic on the two quartiles, and \`outliers\` puts each sample into one of three buckets (inside, mild, severe) by comparing it with the fences. The one trap is that the buckets overlap: anything outside the 3.0 fences is also outside the 1.5 ones.

**The solution, line by line.**

- \`fn fences(xs: &[f64], k: f64) -> (f64, f64) {\` takes the samples and how many IQRs wide the fence should be.
- \`    let (q1, q3) = quartiles(xs);\` gets the first and third quartiles (the given function sorts a copy and picks the values a quarter and three quarters of the way along).
- \`    let iqr = q3 - q1;\` is the width of the middle half. For the first test's samples, 11 and 14, so 3.
- \`    (q1 - k * iqr, q3 + k * iqr)\` places the fences: for \`k = 1.5\`, 11 − 4.5 = 6.5 and 14 + 4.5 = 18.5.
- \`fn outliers(xs: &[f64]) -> (usize, usize) {\` returns two counts.
- \`    let (lo, hi) = fences(xs, 1.5);\` and \`    let (vlo, vhi) = fences(xs, 3.0);\` compute both pairs once, outside the loop (each call sorts a copy, so doing it per sample would be wasteful).
- \`    let mut mild = 0;\` and \`    let mut severe = 0;\` start the counts.
- \`    for &x in xs {\` visits every sample, copying each \`f64\` out of the slice.
- \`        if x < vlo || x > vhi { severe += 1; }\` checks the wide fences first, low side and high side.
- \`        else if x < lo || x > hi { mild += 1; }\` only runs for samples inside the wide fences, so a sample lands in at most one bucket.
- \`    (mild, severe)\` returns both counts.

Two details match criterion's own output. Outliers are only counted, not removed: criterion keeps every sample and warns that the benchmark may be less reliable. And they come in low and high kinds; on a shared machine they are nearly always high, because other programs can only make yours slower. The interquartile range is used, rather than a mean and standard deviation, because it is not pulled about by the very outliers it is looking for.

**Common wrong attempts.**

- Two separate \`if\`s count a severe outlier as mild too: \`one_mild_one_severe\` then gets \`(2, 1)\`.
- \`q1 - k * q1\` measures the fence in multiples of the quartile itself instead of the IQR; the fences end up far too wide and nothing is flagged.
- Only checking the high side (\`x > hi\`) misses the low outlier in the last test.`,
    wrong: [
      {
        code: `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    let iqr = q3 - q1;
    (q1 - k * iqr, q3 + k * iqr)
}

fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < lo || x > hi {
            mild += 1;
        }
        if x < vlo || x > vhi {
            severe += 1;
        }
    }
    (mild, severe)
}`,
        why: 'A severe outlier is also outside the 1.5 fences, so this counts it as mild too: `one_mild_one_severe` gets `(2, 1)`. Check severe first, then `else if` mild.',
      },
      {
        code: `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    (q1 - k * q1, q3 + k * q3)
}

fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < vlo || x > vhi {
            severe += 1;
        } else if x < lo || x > hi {
            mild += 1;
        }
    }
    (mild, severe)
}`,
        why: 'The fences are measured in interquartile ranges, `q3 - q1`, not in multiples of the quartiles themselves. These fences are far too wide.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why is SoA’s advantage smaller in Rust than in the book’s JavaScript runs?',
    options: [
      {
        t: 'Rust doesn’t have cache lines',
        why: 'Cache lines belong to the hardware, not the language.',
      },
      {
        t: 'Rust’s `Vec<Particle>` is already flat: no headers, no pointers, no boxed numbers, so the AoS baseline is much faster',
        correct: true,
        why: 'Both layouts are contiguous `f64`s in Rust; SoA only saves the unused fields.',
      },
      {
        t: 'Rust automatically turns `Vec<Particle>` into SoA',
        why: 'It doesn’t. A `Vec<Particle>` stays an array of structs.',
      },
    ],
  },
  {
    q: 'A loop sums only `mass` over a million `Particle`s (six `f64` fields). Roughly what fraction of the bytes it fetches does it use, in AoS?',
    options: [
      {
        t: 'About a sixth',
        correct: true,
        why: '8 useful bytes of every 48. In SoA the mass column is all useful.',
      },
      {
        t: 'All of them',
        why: 'Lines bring in the other five fields too.',
      },
      {
        t: 'Half',
        why: 'That would be 24 of 48 bytes; the loop needs only 8.',
      },
      {
        t: 'None: the prefetcher skips the other fields',
        why: 'The prefetcher fetches whole lines; it can’t pick fields out of them.',
      },
    ],
  },
  {
    q: 'You time the SoA and AoS loops in the Rust Playground’s default mode and SoA is slower. What should you conclude?',
    options: [
      {
        t: 'SoA is slower in Rust',
        why: 'This chapter’s release build measured the opposite at a million particles.',
      },
      {
        t: 'The Playground’s CPU has no cache',
        why: 'It has; the build mode is the issue.',
      },
      {
        t: 'Probably nothing: it is a debug build, with unoptimised indexing. Measure with `--release`',
        correct: true,
        why: 'On this book’s machine the debug build made SoA two to five times slower than AoS; the `-O` build made it almost twice as fast.',
      },
    ],
  },
  {
    q: 'In a SoA `Particles`, which of these is rejected by the borrow checker?',
    options: [
      {
        t: '`let xs = &mut s.x; let vs = &s.vx;` used together',
        why: 'Different fields are separate borrows: allowed.',
      },
      {
        t: 'Calling a `&self` method inside a loop over `self.x.iter_mut()`',
        correct: true,
        why: 'The method borrows all of `self`, including the `x` column the loop already borrows mutably: E0502.',
      },
      {
        t: '`s.x[i] += s.vx[i] * dt;`',
        why: 'This is the hot loop; it compiles.',
      },
    ],
  },
  {
    q: 'What does Viscosity give you that a hand-written Rust SoA doesn’t?',
    options: [
      {
        t: 'Faster columns: a `Float64Array` beats a `Vec<f64>`',
        why: 'Both are contiguous doubles; that isn’t the difference.',
      },
      {
        t: 'A guarantee that `Vec` never reallocates',
        why: 'Neither promises that; both grow.',
      },
      {
        t: 'The rewrite done for you, with a safety analysis that every access was rewritten and the columns stay in step',
        correct: true,
        why: 'By hand, keeping every column in sync is your job, and tests are your check.',
      },
    ],
  },
  {
    q: 'You time a function with `cargo run` and get 300 ms. What should you do before believing it?',
    options: [
      {
        t: 'Nothing: Rust is compiled, so it is already fast',
        why: 'A plain `cargo run` builds the `dev` profile, `opt-level = 0`.',
      },
      {
        t: 'Rebuild with `--release`, and make sure the result is used',
        correct: true,
        why: 'In this chapter, the same loop took 317–513 ms in debug, 75–78 ms in release, and almost nothing in release when its result was unused.',
      },
      {
        t: 'Run it twice more and take the average',
        why: 'More runs do not fix an unoptimised build.',
      },
    ],
  },
  {
    q: 'In a release build, a loop summing a million `f64`s 100 times reports 157 ns. What is the best explanation?',
    options: [
      {
        t: 'SIMD made it that fast',
        why: 'That would be hundreds of additions per nanosecond on one core. Vector units are fast, not that fast.',
      },
      {
        t: 'The clock is broken in release mode',
        why: '`Instant` works the same in both builds.',
      },
      {
        t: 'The values were cached after the first iteration',
        why: 'Caches make memory faster; they do not make additions disappear.',
      },
      {
        t: 'The sum was never used, so the compiler removed the loop',
        correct: true,
        why: 'Dead code elimination. With `black_box` on the input and result, the real work came back: about 75 ms here.',
      },
    ],
  },
  {
    q: 'What does `black_box(sum(black_box(&xs)))` achieve?',
    options: [
      {
        t: 'It turns off all optimisation inside `sum`',
        why: '`sum` is still optimised. Only what flows in and out is hidden.',
      },
      {
        t: 'The inner call hides `xs` from the optimiser, and the outer one keeps the result “used”',
        correct: true,
        why: 'So the compiler can neither precompute the sum nor throw it away.',
      },
      {
        t: 'It guarantees the benchmark measures exactly what production does',
        why: 'It is best-effort, and production code may be optimised differently anyway.',
      },
    ],
  },
  {
    q: 'A `u8` holding 255 has 1 added to it. What happens?',
    options: [
      {
        t: 'It becomes 256 in both builds',
        why: 'A `u8` cannot hold 256.',
      },
      {
        t: 'Debug build: a panic, “attempt to add with overflow”; release build: it wraps to 0',
        correct: true,
        why: 'overflow-checks is on in `dev` and off in `release`; both outcomes were observed with rustc 1.97.',
      },
      {
        t: 'A compile error in both builds',
        why: 'With the 255 hidden behind `black_box`, the compiler cannot see the overflow coming.',
      },
    ],
  },
  {
    q: 'engine/rust’s compile-speed file gives each figure as “median / min” over three rounds. Why report both?',
    options: [
      {
        t: 'The median is always the true time',
        why: 'On a noisy machine the median moves with the other tenants’ load.',
      },
      {
        t: 'The minimum includes JIT warm-up',
        why: 'Rust has no JIT. The TypeScript engine was warmed up before timing.',
      },
      {
        t: 'The minimum is the most stable on a shared VM; the median shows how much the runs spread',
        correct: true,
        why: 'That is what its notes say; even so, one round can shift: `ledger`’s Rust minimum was 74, 73, then 109 µs.',
      },
    ],
  },
  {
    q: 'Criterion reported `time: [658.64 ns 665.74 ns 672.99 ns]`. What are the three numbers?',
    options: [
      {
        t: 'Fastest, median and slowest sample',
        why: 'They come from bootstrapping the fitted slope, not from single samples.',
      },
      {
        t: 'The low end, the estimate and the high end of a confidence interval for the time per iteration',
        correct: true,
        why: 'Criterion fits a line to the samples, then resamples them many times to see how much the slope could vary.',
      },
      {
        t: 'Three separate runs',
        why: 'It is one run of 100 samples.',
      },
    ],
  },
  {
    q: 'Can the book’s Run button run a criterion benchmark?',
    options: [
      {
        t: 'No: examples are single files built in debug mode, with no crates, so you need `cargo bench` on your own machine',
        correct: true,
        why: 'This chapter’s criterion runs used cargo 1.97, which fetched criterion 0.5.1.',
      },
      {
        t: 'Yes, any crate works',
        why: 'Criterion needs Cargo to fetch it and `cargo bench` to build it.',
      },
      {
        t: 'Only in release mode',
        why: 'The runner always builds in debug mode, and has no crates either way.',
      },
    ],
  },
  {
    q: 'Why does criterion time samples of many iterations instead of single calls?',
    options: [
      {
        t: 'To warm up the JIT',
        why: 'Rust has no JIT; warm-up is a separate phase, for caches and the CPU.',
      },
      {
        t: 'Because one call is too short to time accurately; the slope through many samples gives the time per call',
        correct: true,
        why: 'A sum of a thousand numbers took well under a microsecond here.',
      },
      {
        t: 'To make the benchmark take exactly 5 seconds',
        why: 'The 5 seconds is a budget for collecting samples, not the goal.',
      },
    ],
  },
  {
    q: 'Of 100 samples, 8 were “high mild” and 2 “high severe”. What did criterion do with them?',
    options: [
      {
        t: 'Dropped them before computing the estimate',
        why: 'Criterion reports outliers and keeps every sample.',
      },
      {
        t: 'Re-ran just those samples',
        why: 'It does not re-run samples.',
      },
      {
        t: 'Reported them; they stay in the analysis',
        correct: true,
        why: 'They are a warning that the run was noisy, nearly always from other programs slowing yours.',
      },
    ],
  },
  {
    q: 'Run 6 said “Performance has improved” by about 3 percent, run 8 “has regressed” by about 4, and the code never changed. What is the right reading?',
    options: [
      {
        t: 'The compiler made different code each time',
        why: 'The same build was reused; nothing was recompiled between runs.',
      },
      {
        t: 'Criterion is broken',
        why: 'Its test correctly found that the timings differed; the cause was outside the code.',
      },
      {
        t: 'The machine’s load changed between runs; on a shared VM, differences of a few percent need repeated, alternating comparisons before you believe them',
        correct: true,
        why: 'The default 1 percent noise threshold is too small for this machine.',
      },
    ],
  },
];
