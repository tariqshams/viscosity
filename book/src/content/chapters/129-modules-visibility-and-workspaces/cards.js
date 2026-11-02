// Chapter 197 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 129, 129.

export const prompts = {
  'mod-file': {
    q: 'What does `mod scanner;` in `lib.rs` do?',
    a: 'Declares a child module `scanner` whose code is read from `scanner.rs` (or `scanner/mod.rs`). Without it, that file isn’t compiled.',
  },
  'mod-root': {
    q: 'What is the **crate root**, and which file is it usually?',
    a: 'The file the compiler starts from, the root of the module tree: `src/lib.rs` for a library crate, `src/main.rs` for a binary.',
  },
  'mod-inline': {
    q: 'What is the difference between `mod tests;` and `mod tests { ... }`?',
    a: 'Only where the code lives: the first reads it from `tests.rs`, the second has it inline. Both make the same child module.',
  },
  'mod-paths': {
    q: 'What do `crate::`, `super::` and `self::` mean at the start of a path?',
    a: 'Start from the crate root, from the parent module, or from the current module.',
  },
  'mod-use': {
    q: 'What does `use crate::gc::{Heap, Trace};` do?',
    a: 'Brings `Heap` and `Trace` from module `gc` into scope, so the code can write `Heap` instead of the full path.',
  },
  'mod-glob': {
    q: 'What does `use super::*;` bring into scope, and why is it used sparingly outside tests?',
    a: 'Every public name of the parent module (and, in a child, its private ones too). It hides where each name came from.',
  },
  'mod-use-scope': {
    q: 'A `use` line at the top of `compiler.rs`: does it also work inside `vm.rs`, or inside a child module of `compiler`?',
    a: 'No. A `use` makes a shortcut only in the module where it is written; every module needs its own.',
  },
  'mod-e0432': {
    q: 'Inside module `report`, why does `use geom::area;` fail with E0432 when `geom` is a module at the crate root?',
    a: 'A `use` path without `crate::` starts in the current module, and `report` has no child `geom`. Write `use crate::geom::area;`.',
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
  'modules-play': {
    lang: 'rust',
    title: 'Modules, paths and use',
    code: `mod scanner {
    pub fn is_digit(c: char) -> bool {
        c.is_ascii_digit()
    }

    pub mod tests {
        pub fn check() -> bool {
            // up to the parent, scanner
            super::is_digit('7')
        }
    }
}

mod compiler {
    // from the root, then down
    use crate::scanner::is_digit;

    pub fn digits(s: &str) -> usize {
        s.chars()
            .filter(|c| is_digit(*c))
            .count()
    }
}

fn main() {
    let a = scanner::is_digit('x');
    let b = scanner::tests::check();
    let n = compiler::digits("a1b22");
    println!("{a} {b} {n}");
}`,
  },
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
  wireTree: {
    lang: 'rust',
    title: 'Wire up the module tree',
    prompt: 'The crate has a `vec2` module (a 2D vector and its dot product) and a `physics` module with a nested `drag` module. As given, it does not compile: `physics` and `drag` use `V2` and `dot` without bringing them into scope, and two bodies are missing. Add one `use` line to `physics` and one to `drag` (use `super::` in the second), then write `speed2` (the vector dotted with itself) and `slowed` (each component multiplied by `k`). Leave `vec2` as it is.',
    starter: `mod vec2 {
    pub struct V2 {
        pub x: f64,
        pub y: f64,
    }

    pub fn dot(a: &V2, b: &V2) -> f64 {
        a.x * b.x + a.y * b.y
    }
}

mod physics {

    pub fn speed2(v: &V2) -> f64 {
        todo!()
    }

    pub mod drag {

        pub fn slowed(v: &V2, k: f64)
            -> V2 {
            todo!()
        }
    }
}`,
    solution: `mod vec2 {
    pub struct V2 {
        pub x: f64,
        pub y: f64,
    }

    pub fn dot(a: &V2, b: &V2) -> f64 {
        a.x * b.x + a.y * b.y
    }
}

mod physics {
    use crate::vec2::{dot, V2};
    pub fn speed2(v: &V2) -> f64 {
        dot(v, v)
    }

    pub mod drag {
        use super::V2;
        pub fn slowed(v: &V2, k: f64)
            -> V2 {
            V2 {
                x: v.x * k,
                y: v.y * k,
            }
        }
    }
}`,
    tests: `#[test]
fn speed_squared() {
    let v = vec2::V2 { x: 3.0, y: 4.0 };
    assert_eq!(physics::speed2(&v), 25.0);
}

#[test]
fn drag_scales_both_parts() {
    let v = vec2::V2 { x: 2.0, y: -6.0 };
    let w = physics::drag::slowed(&v, 0.5);
    assert_eq!((w.x, w.y), (1.0, -3.0));
}

#[test]
fn still_at_rest() {
    let v = vec2::V2 { x: 0.0, y: 0.0 };
    assert_eq!(physics::speed2(&v), 0.0);
}`,
    hints: [
      'Read the first error: rustc says it cannot find type `V2` in `physics`. Which module is `V2` really in, and how do you name that module from the root?',
      'In `physics`, write `use crate::vec2::{dot, V2};`. Inside `drag`, the parent is `physics`, which now has `V2` in scope, so `use super::V2;` works.',
      '`speed2` is `dot(v, v)`. `slowed` builds a new vector: `V2 { x: v.x * k, y: v.y * k }`.',
    ],
    walkthrough: `**How to think about it.** Draw the tree first: the root has two children, \`vec2\` and \`physics\`, and \`physics\` has a child \`drag\` (plus the hidden \`tests\` module the checker adds as another child of the root). \`V2\` and \`dot\` live in \`vec2\`. Every module that writes the bare name \`V2\` needs that name in *its own* scope, because a \`use\` covers only the module it is written in. So there are two places to fix, and each needs a path that starts somewhere sensible.

**The solution, line by line.**

- \`use crate::vec2::{dot, V2};\` (in \`physics\`): start at the root with \`crate::\`, go into \`vec2\`, and bring in two names at once with braces. Now \`physics\` can write \`V2\` and \`dot\`.
- \`pub fn speed2(v: &V2) -> f64 { dot(v, v) }\`: the squared speed is the vector dotted with itself, \`x*x + y*y\`; \`v\` is already a \`&V2\`, which is what \`dot\` takes.
- \`use super::V2;\` (in \`drag\`): \`super\` is \`physics\`, and \`V2\` is a name in \`physics\` thanks to its \`use\`, so this works. A child module may use its parent's names, even private ones such as that \`use\`. (\`use crate::vec2::V2;\` would work equally well.)
- \`V2 { x: v.x * k, y: v.y * k }\` builds a new vector with both parts scaled. Its fields are \`pub\`, so code outside \`vec2\` may name them.

**Common wrong attempts.**

- \`use vec2::{dot, V2};\` in \`physics\`: a \`use\` path without \`crate::\` starts in the current module, and \`physics\` has no child \`vec2\`, so rustc reports E0432, unresolved import, and suggests \`crate::vec2\`.
- Putting both names in the top \`use\` only and expecting \`drag\` to see them: \`drag\` is a separate module, and \`use\` does not reach into children, so \`V2\` is still unknown there: rustc 1.97 reports E0425, "cannot find type \`V2\` in this scope".
- \`use super::super::vec2::V2;\` in \`drag\` is correct but hard to read; prefer \`crate::\` for anything more than one step up.`,
    wrong: [
      {
        code: `mod vec2 {
    pub struct V2 {
        pub x: f64,
        pub y: f64,
    }

    pub fn dot(a: &V2, b: &V2) -> f64 {
        a.x * b.x + a.y * b.y
    }
}

mod physics {
    use vec2::{dot, V2};
    pub fn speed2(v: &V2) -> f64 {
        dot(v, v)
    }

    pub mod drag {
        use super::V2;
        pub fn slowed(v: &V2, k: f64)
            -> V2 {
            V2 {
                x: v.x * k,
                y: v.y * k,
            }
        }
    }
}`,
        why: 'A `use` path without `crate::` starts in `physics`, which has no child `vec2`: E0432, unresolved import.',
      },
      {
        code: `mod vec2 {
    pub struct V2 {
        pub x: f64,
        pub y: f64,
    }

    pub fn dot(a: &V2, b: &V2) -> f64 {
        a.x * b.x + a.y * b.y
    }
}

mod physics {
    use crate::vec2::{dot, V2};
    pub fn speed2(v: &V2) -> f64 {
        dot(v, v)
    }

    pub mod drag {

        pub fn slowed(v: &V2, k: f64)
            -> V2 {
            V2 {
                x: v.x * k,
                y: v.y * k,
            }
        }
    }
}`,
        why: '`drag` is its own module, and `physics`’s `use` does not reach into it, so `V2` is unknown inside `drag`.',
      },
    ],
  },
  particles: {
    lang: 'rust',
    title: 'A store that keeps its promise',
    prompt: 'The `soa` module holds particles as two columns, `xs` and `vxs`, that must always be the same length. As given, the tests can’t even compile: nothing is public. Make exactly the API public (the struct, `new`, `push`, `len`, `x` and `step`), and keep the columns private so no one outside can push to just one. Then fix `step`, which should move each particle by `vx * dt`.',
    starter: `mod soa {
    // Invariant: xs and vxs always
    // have the same length.
    struct Particles {
        xs: Vec<f64>,
        vxs: Vec<f64>,
    }

    impl Particles {
        fn new() -> Self {
            Particles {
                xs: Vec::new(),
                vxs: Vec::new(),
            }
        }

        fn push(&mut self, x: f64,
            vx: f64) {
            self.xs.push(x);
            self.vxs.push(vx);
        }

        fn len(&self) -> usize {
            self.xs.len()
        }

        fn x(&self, i: usize)
            -> f64 {
            self.xs[i]
        }

        fn step(&mut self,
            dt: f64) {
            let vs = &self.vxs;
            let xs = self.xs.iter_mut();
            for (x, v) in xs.zip(vs) {
                *x += v;
            }
        }
    }
}`,
    solution: `mod soa {
    // Invariant: xs and vxs always
    // have the same length.
    pub struct Particles {
        xs: Vec<f64>,
        vxs: Vec<f64>,
    }

    impl Particles {
        pub fn new() -> Self {
            Particles {
                xs: Vec::new(),
                vxs: Vec::new(),
            }
        }

        pub fn push(&mut self, x: f64,
            vx: f64) {
            self.xs.push(x);
            self.vxs.push(vx);
        }

        pub fn len(&self) -> usize {
            self.xs.len()
        }

        pub fn x(&self, i: usize)
            -> f64 {
            self.xs[i]
        }

        pub fn step(&mut self,
            dt: f64) {
            let vs = &self.vxs;
            let xs = self.xs.iter_mut();
            for (x, v) in xs.zip(vs) {
                *x += v * dt;
            }
        }
    }
}`,
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
        code: `mod soa {
    // Invariant: xs and vxs always
    // have the same length.
    pub struct Particles {
        xs: Vec<f64>,
        vxs: Vec<f64>,
    }

    impl Particles {
        pub fn new() -> Self {
            Particles {
                xs: Vec::new(),
                vxs: Vec::new(),
            }
        }

        pub fn push(&mut self, x: f64,
            vx: f64) {
            self.xs.push(x);
            self.vxs.push(vx);
        }

        pub fn len(&self) -> usize {
            self.xs.len()
        }

        pub fn x(&self, i: usize)
            -> f64 {
            self.xs[i]
        }

        fn step(&mut self,
            dt: f64) {
            let vs = &self.vxs;
            let xs = self.xs.iter_mut();
            for (x, v) in xs.zip(vs) {
                *x += v * dt;
            }
        }
    }
}`,
        why: '`step` has no `pub`, so the tests can’t call it: E0624, “method `step` is private”. Every method a user needs must be marked.',
      },
      {
        code: `mod soa {
    // Invariant: xs and vxs always
    // have the same length.
    pub struct Particles {
        xs: Vec<f64>,
        vxs: Vec<f64>,
    }

    impl Particles {
        pub fn new() -> Self {
            Particles {
                xs: Vec::new(),
                vxs: Vec::new(),
            }
        }

        pub fn push(&mut self, x: f64,
            vx: f64) {
            self.xs.push(x);
            self.vxs.push(vx);
        }

        pub fn len(&self) -> usize {
            self.xs.len()
        }

        pub fn x(&self, i: usize)
            -> f64 {
            self.xs[i]
        }

        pub fn step(&mut self,
            dt: f64) {
            let vs = &self.vxs;
            let xs = self.xs.iter_mut();
            for (x, v) in xs.zip(vs) {
                *x += v;
            }
        }
    }
}`,
        why: 'Everything is public in the right places, but `step` adds `v` instead of `v * dt`, so with `dt = 0.5` the particles move twice as far.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You add `src/table.rs` to a crate but never write `mod table;`. What happens?',
    options: [
      {
        t: 'Cargo compiles it anyway, like a JavaScript file in the project',
        why: 'Rust only compiles files that the module tree names.',
      },
      {
        t: 'It isn’t part of the crate, so its code is never compiled',
        correct: true,
        why: 'A parent must declare each module with `mod`.',
      },
      {
        t: 'It becomes a separate crate',
        why: 'Crates come from `Cargo.toml` targets, not from loose files.',
      },
    ],
  },
  {
    q: 'Inside `mod tests` in `scanner.rs`, what does `super::is_alpha` name?',
    options: [
      {
        t: 'A function `is_alpha` in the crate root',
        why: 'That would be `crate::is_alpha`.',
      },
      {
        t: 'A function `is_alpha` inside `tests` itself',
        why: 'That would be `self::is_alpha`, or plain `is_alpha`.',
      },
      {
        t: 'The function `is_alpha` in `scanner`, the parent of `tests`',
        correct: true,
        why: '`super::` starts one level up, like `..` in a file path.',
      },
    ],
  },
  {
    q: '`compiler.rs` has `use crate::gc::Heap;`. In `vm.rs`, can you write `Heap` without a `use`?',
    options: [
      {
        t: 'Yes: a `use` applies to the whole crate',
        why: 'A `use` only makes a shortcut in the module where it is written.',
      },
      {
        t: 'Only if `vm` is declared after `compiler` in `lib.rs`',
        why: 'Order of declaration does not matter; scope does.',
      },
      {
        t: 'No: `vm.rs` needs its own `use crate::gc::Heap;` or the full path',
        correct: true,
        why: 'Each module has its own list of shortcuts.',
      },
    ],
  },
  {
    q: 'Which declaration makes rustc read the module’s code from a file?',
    options: [
      {
        t: '`mod gc;`',
        correct: true,
        why: 'With a semicolon and no body, the code comes from `gc.rs` or `gc/mod.rs`.',
      },
      {
        t: '`mod gc { }`',
        why: 'That declares an inline module with an empty body.',
      },
      {
        t: '`use gc;`',
        why: '`use` only makes shortcuts to modules that already exist.',
      },
      {
        t: '`import gc from "./gc.rs";`',
        why: 'That is JavaScript’s syntax, not Rust’s.',
      },
    ],
  },
  {
    q: 'What does `use crate::chunk::{Chunk, OpCode};` do?',
    options: [
      {
        t: 'Copies the two types into the current file',
        why: 'Nothing is copied; it adds two shortcuts to the same items.',
      },
      {
        t: 'Makes `Chunk` and `OpCode` usable by their short names in this module',
        correct: true,
        why: 'Braces bring several names from one module at once.',
      },
      {
        t: 'Declares a new module called `chunk`',
        why: 'Only `mod chunk;` declares it; `use` refers to it.',
      },
      {
        t: 'Makes the two types public to other crates',
        why: 'That would need `pub use`, a re-export.',
      },
    ],
  },
  {
    q: 'In `pub struct Table { count: usize, pub keys: Vec<u32> }`, what can another module do?',
    options: [
      {
        t: 'Read and write both fields',
        why: '`count` has no `pub`, so it is private.',
      },
      {
        t: 'Use `keys`, but not `count`, and not build the struct with a literal',
        correct: true,
        why: 'Fields have their own visibility, and a literal needs every field (E0451).',
      },
      {
        t: 'Nothing: the struct’s fields are all hidden',
        why: '`keys` is marked `pub`.',
      },
      {
        t: 'Use `count` but not `keys`',
        why: 'It is the other way round.',
      },
    ],
  },
  {
    q: 'A private function is defined in module `a`. Where can it be called?',
    options: [
      {
        t: 'Anywhere in the same file',
        why: 'Visibility follows modules, not files: an inline sibling module in the same file can’t call it.',
      },
      {
        t: 'Anywhere in the crate',
        why: 'That is `pub(crate)`.',
      },
      {
        t: 'Only in `a` and modules inside `a`',
        correct: true,
        why: 'Private means: the defining module and its descendants.',
      },
      {
        t: 'Nowhere except the function itself',
        why: 'The rest of module `a` can call it.',
      },
    ],
  },
  {
    q: 'What does `pub use vm::{Options, Outcome, Vm};` in drip-rs’s `lib.rs` do?',
    options: [
      {
        t: 'Makes the whole `vm` module public',
        why: '`pub mod vm;` does that; `pub use` re-exports items.',
      },
      {
        t: 'Copies the three types into `lib.rs`',
        why: 'Nothing is copied; it adds a second path to the same items.',
      },
      {
        t: 'Imports the types for `lib.rs` only',
        why: 'That would be a plain `use`. The `pub` re-exports them.',
      },
      {
        t: 'Re-exports them, so users can write `drip::Vm` instead of `drip::vm::Vm`',
        correct: true,
        why: 'It shapes the crate’s public paths.',
      },
    ],
  },
  {
    q: 'What do the six crates in engine/rust’s workspace share?',
    options: [
      {
        t: 'One `Cargo.lock` and one `target/` folder',
        correct: true,
        why: 'That is what makes them a workspace; versions of dependencies agree across members.',
      },
      {
        t: 'Nothing: each is built entirely on its own',
        why: 'They share a lock file and an output folder.',
      },
      {
        t: 'One module tree, rooted at `crates/`',
        why: 'Each crate has its own module tree and its own `crate` root.',
      },
    ],
  },
  {
    q: '`viscosity-core`’s tests use `viscosity-frontend-js`, which depends on core. How is that allowed?',
    options: [
      {
        t: 'Cargo allows any cycle inside a workspace',
        why: 'It doesn’t: cargo reports “cyclic package dependency”.',
      },
      {
        t: 'The tests copy frontend-js’s source',
        why: 'They depend on the real crate, through the dev-dependency.',
      },
      {
        t: 'It is listed under `[dev-dependencies]`, used only to build core’s tests',
        correct: true,
        why: 'As a normal dependency it would be a cycle, which cargo rejects.',
      },
    ],
  },
];
