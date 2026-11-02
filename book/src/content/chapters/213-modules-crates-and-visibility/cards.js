// Chapter 213 cards. Keys are stable ids: never rename them.

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
  'mod-file': {
    q: 'What does `mod scanner;` in `lib.rs` do?',
    a: 'Declares a child module `scanner` whose code is read from `scanner.rs` (or `scanner/mod.rs`). Without it, that file isn’t compiled.',
  },
  'mod-paths': {
    q: 'What do `crate::`, `super::` and `self::` mean at the start of a path?',
    a: 'Start from the crate root, from the parent module, or from the current module.',
  },
  'mod-use': {
    q: 'What does `use crate::gc::{Heap, Trace};` do?',
    a: 'Brings `Heap` and `Trace` from module `gc` into scope, so the code can write `Heap` instead of the full path.',
  },
  'vis-default': {
    q: 'What is the visibility of a function, struct field or method with no `pub`?',
    a: 'Private: usable only in the module where it is defined and that module’s descendants.',
  },
  'vis-field': {
    q: '`pub struct Table { count: usize }`. Can another module read `t.count`?',
    a: 'No (E0616): the struct is public but its field isn’t. Fields need their own `pub`.',
  },
  'vis-child': {
    q: 'Why can `mod tests` inside `scanner.rs` call scanner’s private functions?',
    a: 'Private items are visible in their module and its descendants, and `tests` is a child module.',
  },
  'vis-why': {
    q: 'Why does drip-rs keep `Table`’s `keys`, `values` and `count` private?',
    a: 'So only `table.rs` can change them, and the table’s invariants (equal column lengths, a correct count) can’t be broken from outside.',
  },
  'ws-what': {
    q: 'What do the members of a cargo **workspace** share?',
    a: 'One `Cargo.lock` and one `target/` output folder; they are built and tested together.',
  },
  'ws-why': {
    q: 'How does engine/rust’s crate split keep JavaScript out of the analyses?',
    a: '`viscosity-core` doesn’t depend on `viscosity-frontend-js` or oxc, so its code can’t name them; it only sees VIR and its own plugin trait.',
  },
};

export const examples = {};

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
    walkthrough: `**What needs \`pub\`.** \`mod tests\` and \`mod soa\` are both children of the crate root. The tests can see \`soa\` itself (a private item of their parent, the root), but inside it they only see what \`soa\` marks \`pub\`. So the struct and the six methods need it, and nothing else does.

**What must stay private.** If \`xs\` were \`pub\`, any code could write \`ps.xs.push(1.0)\` and leave the columns different lengths; then \`step\`’s \`zip\` would silently skip particles, and a later \`x(i)\` might read the wrong one. With the fields private, \`push\` is the only way in, and it always pushes to both. The invariant is kept by one module, so one module is all you need to read to trust it. This is chapter 32’s struct of arrays with a lock on it.

**\`step\`.** \`xs.zip(vs)\` walks both columns side by side, giving \`&mut f64\` and \`&f64\`; \`*x += v * dt\` updates in place. \`vs\` borrows one field shared and \`xs\` the other mutably, which Rust allows because they are different fields.`,
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
    q: 'You add `src/table.rs` to a crate but never write `mod table;`. What happens?',
    options: [
      { t: 'Cargo compiles it anyway, like a JavaScript file in the project', why: 'Rust only compiles files that the module tree names.' },
      { t: 'It isn’t part of the crate, so its code is never compiled', correct: true, why: 'A parent must declare each module with `mod`.' },
      { t: 'It becomes a separate crate', why: 'Crates come from `Cargo.toml` targets, not from loose files.' },
    ],
  },
  {
    q: 'In `pub struct Table { count: usize, pub keys: Vec<u32> }`, what can another module do?',
    options: [
      { t: 'Read and write both fields', why: '`count` has no `pub`, so it is private.' },
      { t: 'Nothing: the struct’s fields are all hidden', why: '`keys` is marked `pub`.' },
      { t: 'Use `keys`, but not `count`, and not build the struct with a literal', correct: true, why: 'Fields have their own visibility, and a literal needs every field.' },
      { t: 'Use `count` but not `keys`', why: 'It is the other way round.' },
    ],
  },
  {
    q: 'A private function is defined in module `a`. Where can it be called?',
    options: [
      { t: 'Only in `a` and modules inside `a`', correct: true, why: 'Private means: the defining module and its descendants.' },
      { t: 'Anywhere in the same file', why: 'Visibility follows modules, not files: an inline sibling module in the same file can’t call it.' },
      { t: 'Anywhere in the crate', why: 'That is `pub(crate)`.' },
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
      { t: 'Nothing: each is built entirely on its own', why: 'They share a lock file and an output folder.' },
      { t: 'One `Cargo.lock` and one `target/` folder', correct: true, why: 'That is what makes them a workspace; versions of dependencies agree across members.' },
      { t: 'One module tree, rooted at `crates/`', why: 'Each crate has its own module tree and its own `crate` root.' },
    ],
  },
  {
    q: '`viscosity-core`’s tests use `viscosity-frontend-js`, which depends on core. How is that allowed?',
    options: [
      { t: 'It is listed under `[dev-dependencies]`, used only to build core’s tests', correct: true, why: 'As a normal dependency it would be a cycle, which cargo rejects.' },
      { t: 'Cargo allows any cycle inside a workspace', why: 'It doesn’t: cargo reports “cyclic package dependency”.' },
      { t: 'The tests copy frontend-js’s source', why: 'They depend on the real crate, through the dev-dependency.' },
    ],
  },
];
