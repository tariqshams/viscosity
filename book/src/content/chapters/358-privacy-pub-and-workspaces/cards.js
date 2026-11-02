// Chapter 357-b cards. Keys are stable ids: never rename them.

// The particle store: two columns that must stay the same length.
const ps = ({ p = 'pub ', step = 'pub ', dt = ' * dt' } = {}) => `mod soa {
    // Invariant: xs and vxs always
    // have the same length.
    ${p}struct Particles {
        xs: Vec<f64>,
        vxs: Vec<f64>,
    }

    impl Particles {
        ${p}fn new() -> Self {
            Particles {
                xs: Vec::new(),
                vxs: Vec::new(),
            }
        }

        ${p}fn push(&mut self, x: f64,
            vx: f64) {
            self.xs.push(x);
            self.vxs.push(vx);
        }

        ${p}fn len(&self) -> usize {
            self.xs.len()
        }

        ${p}fn x(&self, i: usize)
            -> f64 {
            self.xs[i]
        }

        ${step}fn step(&mut self,
            dt: f64) {
            let vs = &self.vxs;
            let xs = self.xs.iter_mut();
            for (x, v) in xs.zip(vs) {
                *x += v${dt};
            }
        }
    }
}`;

export const prompts = {
  'vis-default': {
    q: 'What is the visibility of a function, struct field or method with no `pub`?',
    a: 'Private: usable only in the module where it is defined and that module’s descendants.',
  },
  'vis-field': {
    q: '`pub struct Table { count: usize }`. Can another module read `t.count`?',
    a: 'No (E0616): the struct is public but its field isn’t. Fields need their own `pub`.',
  },
  'vis-child': {
    q: 'Why can `mod tests` inside `table.rs` call `table`’s private functions?',
    a: 'Private items are visible in their module and its descendants, and `tests` is a child module.',
  },
  'vis-why': {
    q: 'Why does drip-rs keep `Table`’s `keys`, `values` and `count` private?',
    a: 'So only `table.rs` can change them, and the table’s invariants (equal column lengths, a correct count) can’t be broken from outside.',
  },
  'vis-reexport': {
    q: 'What does `pub use vm::{Options, Outcome, Vm};` in drip-rs’s `lib.rs` do?',
    a: 'Re-exports the three types, so users can write `drip::Vm` instead of `drip::vm::Vm`.',
  },
  'ws-what': {
    q: 'What do the members of a cargo **workspace** share?',
    a: 'One `Cargo.lock` (so one version of each dependency) and one `target/` output folder; they are built and tested together.',
  },
  'ws-cycle': {
    q: 'What does cargo do if two crates list each other under `[dependencies]`?',
    a: 'It refuses to build: “cyclic package dependency”.',
  },
  'ws-dev': {
    q: 'How do `viscosity-core`’s tests use the JavaScript plugin, which itself depends on core?',
    a: 'Through `[dev-dependencies]`, built only for tests, so the normal dependency graph has no cycle.',
  },
};

export const examples = {
  'privacy-play': {
    lang: 'rust',
    title: 'A store with a counter in front',
    code: `mod table {
    pub struct Table {
        count: usize, // private
    }

    impl Table {
        pub fn new() -> Table {
            Table { count: 0 }
        }
        pub fn add(&mut self) {
            self.grow();
        }
        pub fn len(&self) -> usize {
            self.count
        }
        // private: only table uses it
        fn grow(&mut self) {
            self.count += 1;
        }
    }
}

// A second, shorter public path.
pub use table::Table;

fn main() {
    let mut t = Table::new();
    t.add();
    t.add();
    println!("{} entries", t.len());
    // Uncomment one at a time:
    // println!("{}", t.count);
    // t.grow();
}`,
  },
};

export const exercises = {
  particles: {
    lang: 'rust',
    title: 'A store that keeps its promise',
    prompt:
      'The `soa` module holds particles as two columns, `xs` and `vxs`, that must always be the same length. As given, the tests can’t even compile: nothing is public. Make exactly the API public (the struct, `new`, `push`, `len`, `x` and `step`), and keep the columns private so no one outside can push to just one. Then fix `step`, which should move each particle by `vx * dt`.',
    starter: ps({ p: '', step: '', dt: '' }),
    solution: ps(),
    tests: `#[test]
fn starts_empty() {
    let ps = soa::Particles::new();
    assert_eq!(ps.len(), 0);
}

#[test]
fn push_and_read() {
    let mut ps = soa::Particles::new();
    ps.push(1.0, 2.0);
    ps.push(5.0, -1.0);
    assert_eq!(ps.len(), 2);
    assert_eq!(ps.x(1), 5.0);
}

#[test]
fn step_moves_every_particle() {
    let mut ps = soa::Particles::new();
    ps.push(1.0, 2.0);
    ps.push(5.0, -1.0);
    ps.step(0.5);
    assert_eq!(ps.x(0), 2.0);
    assert_eq!(ps.x(1), 4.5);
}`,
    hints: [
      'The tests live in `mod tests`, a sibling of `soa`, not a child. To them, anything in `soa` without `pub` is invisible (E0603, E0624).',
      'Put `pub` on the struct and on each method in the `impl`. Leave `xs` and `vxs` without `pub`: that is what guards the invariant.',
      'In `step`, the update is `*x += v * dt`.',
    ],
    walkthrough: `**How to think about it.** Ask two questions of every item: *does code outside \`soa\` need it?* and *could code outside \`soa\` break something with it?* The tests need to make a store, push particles, ask the length, read a position and step, so those six things must be public. Nobody outside needs the columns themselves, and anybody who could touch them could break the promise that they have the same length, so they stay private.

**Where the tests stand.** \`mod tests\` (added by the checker) and \`mod soa\` are both children of the crate root, so they are siblings. The tests can see \`soa\` itself (a private item of their parent, the root, which they are inside), but inside \`soa\` they see only what \`soa\` marks \`pub\`. As given, nothing is, so every call fails with E0603 or E0624.

**The solution, line by line.**

- \`pub struct Particles {\` makes the type nameable from outside, so the tests can write \`soa::Particles\`.
- \`xs: Vec<f64>,\` and \`vxs: Vec<f64>,\` stay private: only code in \`soa\` can touch the columns.
- \`pub fn new() -> Self\` is the only way to build one from outside, because a struct literal would need the private fields (E0451).
- \`pub fn push(&mut self, x: f64, vx: f64)\` pushes onto *both* columns, so the lengths can never drift apart.
- \`pub fn len(&self) -> usize\` and \`pub fn x(&self, i: usize) -> f64\` read without exposing the vectors.
- \`pub fn step(&mut self, dt: f64)\`: \`let vs = &self.vxs;\` borrows one field shared, \`let xs = self.xs.iter_mut();\` borrows the other mutably (Rust allows borrowing two *different* fields this way), \`for (x, v) in xs.zip(vs)\` walks both columns side by side, and \`*x += v * dt;\` moves each particle by its velocity times the time step.

**Common wrong attempts.**

- Making \`xs\` and \`vxs\` \`pub\` as well: the tests pass, but now any code can write \`ps.xs.push(1.0)\` and leave the columns different lengths, after which \`zip\` silently skips particles. The exercise asks you to keep them private for exactly that reason.
- Forgetting \`pub\` on one method, such as \`step\`: E0624, "method \`step\` is private".
- \`*x += v;\`: everything compiles, but with \`dt = 0.5\` the particles move twice as far as they should.`,
    wrong: [
      {
        code: ps({ step: '' }),
        why: '`step` has no `pub`, so the tests can’t call it: E0624, “method `step` is private”. Every method a user needs must be marked.',
      },
      {
        code: ps({ dt: '' }),
        why: 'Everything is public in the right places, but `step` adds `v` instead of `v * dt`, so with `dt = 0.5` the particles move twice as far.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `pub struct Table { count: usize, pub keys: Vec<u32> }`, what can another module do?',
    options: [
      { t: 'Read and write both fields', why: '`count` has no `pub`, so it is private.' },
      { t: 'Use `keys`, but not `count`, and not build the struct with a literal', correct: true, why: 'Fields have their own visibility, and a literal needs every field (E0451).' },
      { t: 'Nothing: the struct’s fields are all hidden', why: '`keys` is marked `pub`.' },
      { t: 'Use `count` but not `keys`', why: 'It is the other way round.' },
    ],
  },
  {
    q: 'A private function is defined in module `a`. Where can it be called?',
    options: [
      { t: 'Anywhere in the same file', why: 'Visibility follows modules, not files: an inline sibling module in the same file can’t call it.' },
      { t: 'Anywhere in the crate', why: 'That is `pub(crate)`.' },
      { t: 'Only in `a` and modules inside `a`', correct: true, why: 'Private means: the defining module and its descendants.' },
      { t: 'Nowhere except the function itself', why: 'The rest of module `a` can call it.' },
    ],
  },
  {
    q: 'What does `pub use vm::{Options, Outcome, Vm};` in drip-rs’s `lib.rs` do?',
    options: [
      { t: 'Makes the whole `vm` module public', why: '`pub mod vm;` does that; `pub use` re-exports items.' },
      { t: 'Copies the three types into `lib.rs`', why: 'Nothing is copied; it adds a second path to the same items.' },
      { t: 'Imports the types for `lib.rs` only', why: 'That would be a plain `use`. The `pub` re-exports them.' },
      { t: 'Re-exports them, so users can write `drip::Vm` instead of `drip::vm::Vm`', correct: true, why: 'It shapes the crate’s public paths.' },
    ],
  },
  {
    q: 'What do the six crates in engine/rust’s workspace share?',
    options: [
      { t: 'One `Cargo.lock` and one `target/` folder', correct: true, why: 'That is what makes them a workspace; versions of dependencies agree across members.' },
      { t: 'Nothing: each is built entirely on its own', why: 'They share a lock file and an output folder.' },
      { t: 'One module tree, rooted at `crates/`', why: 'Each crate has its own module tree and its own `crate` root.' },
    ],
  },
  {
    q: '`viscosity-core`’s tests use `viscosity-frontend-js`, which depends on core. How is that allowed?',
    options: [
      { t: 'Cargo allows any cycle inside a workspace', why: 'It doesn’t: cargo reports “cyclic package dependency”.' },
      { t: 'The tests copy frontend-js’s source', why: 'They depend on the real crate, through the dev-dependency.' },
      { t: 'It is listed under `[dev-dependencies]`, used only to build core’s tests', correct: true, why: 'As a normal dependency it would be a cycle, which cargo rejects.' },
    ],
  },
];
