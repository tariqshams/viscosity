// Chapter 357 cards. Keys are stable ids: never rename them.

const VEC2 = `mod vec2 {
    pub struct V2 {
        pub x: f64,
        pub y: f64,
    }

    pub fn dot(a: &V2, b: &V2) -> f64 {
        a.x * b.x + a.y * b.y
    }
}
`;

const tree = ({ top = '', inner = '', speed = 'dot(v, v)', slow = 'V2 {\n                x: v.x * k,\n                y: v.y * k,\n            }' } = {}) => `${VEC2}
mod physics {
${top}
    pub fn speed2(v: &V2) -> f64 {
        ${speed}
    }

    pub mod drag {
${inner}
        pub fn slowed(v: &V2, k: f64)
            -> V2 {
            ${slow}
        }
    }
}`;

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
};

const TOP = '    use crate::vec2::{dot, V2};';
const INNER = '        use super::V2;';

export const exercises = {
  wireTree: {
    lang: 'rust',
    title: 'Wire up the module tree',
    prompt:
      'The crate has a `vec2` module (a 2D vector and its dot product) and a `physics` module with a nested `drag` module. As given, it does not compile: `physics` and `drag` use `V2` and `dot` without bringing them into scope, and two bodies are missing. Add one `use` line to `physics` and one to `drag` (use `super::` in the second), then write `speed2` (the vector dotted with itself) and `slowed` (each component multiplied by `k`). Leave `vec2` as it is.',
    starter: tree({ speed: 'todo!()', slow: 'todo!()' }),
    solution: tree({ top: TOP, inner: INNER }),
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
        code: tree({ top: '    use vec2::{dot, V2};', inner: INNER }),
        why: 'A `use` path without `crate::` starts in `physics`, which has no child `vec2`: E0432, unresolved import.',
      },
      {
        code: tree({ top: TOP }),
        why: '`drag` is its own module, and `physics`’s `use` does not reach into it, so `V2` is unknown inside `drag`.',
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
    q: 'Inside `mod tests` in `scanner.rs`, what does `super::is_alpha` name?',
    options: [
      { t: 'A function `is_alpha` in the crate root', why: 'That would be `crate::is_alpha`.' },
      { t: 'A function `is_alpha` inside `tests` itself', why: 'That would be `self::is_alpha`, or plain `is_alpha`.' },
      { t: 'The function `is_alpha` in `scanner`, the parent of `tests`', correct: true, why: '`super::` starts one level up, like `..` in a file path.' },
    ],
  },
  {
    q: '`compiler.rs` has `use crate::gc::Heap;`. In `vm.rs`, can you write `Heap` without a `use`?',
    options: [
      { t: 'Yes: a `use` applies to the whole crate', why: 'A `use` only makes a shortcut in the module where it is written.' },
      { t: 'Only if `vm` is declared after `compiler` in `lib.rs`', why: 'Order of declaration does not matter; scope does.' },
      { t: 'No: `vm.rs` needs its own `use crate::gc::Heap;` or the full path', correct: true, why: 'Each module has its own list of shortcuts.' },
    ],
  },
  {
    q: 'Which declaration makes rustc read the module’s code from a file?',
    options: [
      { t: '`mod gc;`', correct: true, why: 'With a semicolon and no body, the code comes from `gc.rs` or `gc/mod.rs`.' },
      { t: '`mod gc { }`', why: 'That declares an inline module with an empty body.' },
      { t: '`use gc;`', why: '`use` only makes shortcuts to modules that already exist.' },
      { t: '`import gc from "./gc.rs";`', why: 'That is JavaScript’s syntax, not Rust’s.' },
    ],
  },
  {
    q: 'What does `use crate::chunk::{Chunk, OpCode};` do?',
    options: [
      { t: 'Copies the two types into the current file', why: 'Nothing is copied; it adds two shortcuts to the same items.' },
      { t: 'Makes `Chunk` and `OpCode` usable by their short names in this module', correct: true, why: 'Braces bring several names from one module at once.' },
      { t: 'Declares a new module called `chunk`', why: 'Only `mod chunk;` declares it; `use` refers to it.' },
      { t: 'Makes the two types public to other crates', why: 'That would need `pub use`, a re-export.' },
    ],
  },
];
