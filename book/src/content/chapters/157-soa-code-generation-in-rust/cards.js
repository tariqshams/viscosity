// Chapter 157 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cg-numbered': {
    q: 'Two collections called `ps` in different functions are both transformed. What are their container classes called?',
    a: '`__Vsc_ps` and `__Vsc_ps_2`. The emitter keeps a set of class names and counts up from 2 until the name is free.',
  },
  'cg-reserved': {
    q: 'Why can’t a field called `length` keep its name as a column?',
    a: 'Columns are properties of the container, and `this.length` is the container’s element count. It is in `RESERVED`, so the column becomes `f{i}_`.',
  },
  'cg-unique': {
    q: 'Fields `length` and `f0_`: what are the columns, and why?',
    a: '`f0__` and `f0_`. `length` is renamed to `f0_`, which the kept field `f0_` already uses, so `_` is appended until it is free.',
  },
  'cg-spec-order': {
    q: 'In what order does JavaScript evaluate `ps[i].x = rhs`?',
    a: 'The left-hand side to a reference (base `ps[i]`, name `x`), then `rhs`, then the store (`PutValue`), which is what throws on an `undefined` base.',
  },
  'cg-col-fetch': {
    q: 'Why could `ps.x[3] = (more(), 77)` lose the write when `more()` pushes?',
    a: 'Evaluating the left-hand side fetches the column first. If the push grows the container, `grow()` replaces `this.x`, and the store goes into the old column.',
  },
  'cg-rhs-effect': {
    q: 'What are the three values of `RhsEffect`, and what decides between them?',
    a: '`Inert`, `MayThrow` and `Effects`: the worst thing any instruction evaluated within the assignment (besides the element itself, and the old value of a compound write) can do.',
  },
};

export const examples = {
  'grow-borrow': {
    lang: 'rust',
    title: 'Hold a column, grow, store',
    expectError: true,
    code: `struct Soa {
    x: Vec<f64>,
}

impl Soa {
    // May move x to a bigger buffer.
    fn push(&mut self, v: f64) {
        self.x.push(v);
    }
}

fn main() {
    let x = vec![4.0; 4];
    let mut ps = Soa { x };
    // The old emitter's order for
    // ps[3].x = (more(), 77): take the
    // column, run the rhs, then store.
    let col = &mut ps.x;
    ps.push(0.0);
    col[3] = 77.0;
    println!("{}", ps.x[3]);
}
`,
  },
};

export const exercises = {
  columnNames: {
    lang: 'rust',
    title: 'Columns that never clash',
    prompt: 'Write `column_names`, as in `emit.rs`. Each field gets `column_name(f, i)`. A field whose column is its own name is *kept*. A renamed column gets `_` appended until it differs from every kept field name (earlier or later in the list) and from every column already chosen.',
    starter: `use std::collections::HashSet;

const RESERVED: &[&str] = &[
    "length", "push", "grow", "of",
    "constructor", "prototype", "get",
    "cap", "data",
];

// Field i's column: its own name if
// that is a plain identifier and not
// reserved, else f{i}_.
fn column_name(
    f: &str,
    i: usize,
) -> String {
    let hd = |c: char| {
        c.is_ascii_alphabetic()
            || c == '_'
            || c == '$'
    };
    let rest = |c: char| {
        c.is_ascii_alphanumeric()
            || c == '_'
            || c == '$'
    };
    let mut cs = f.chars();
    let a = cs.next().is_some_and(hd);
    let ok = a && cs.all(rest);
    if ok && !RESERVED.contains(&f) {
        f.to_string()
    } else {
        format!("f{i}_")
    }
}

fn column_names(
    fields: &[String],
) -> Vec<String> {
    todo!()
}`,
    solution: `use std::collections::HashSet;

const RESERVED: &[&str] = &[
    "length", "push", "grow", "of",
    "constructor", "prototype", "get",
    "cap", "data",
];

// Field i's column: its own name if
// that is a plain identifier and not
// reserved, else f{i}_.
fn column_name(
    f: &str,
    i: usize,
) -> String {
    let hd = |c: char| {
        c.is_ascii_alphabetic()
            || c == '_'
            || c == '$'
    };
    let rest = |c: char| {
        c.is_ascii_alphanumeric()
            || c == '_'
            || c == '$'
    };
    let mut cs = f.chars();
    let a = cs.next().is_some_and(hd);
    let ok = a && cs.all(rest);
    if ok && !RESERVED.contains(&f) {
        f.to_string()
    } else {
        format!("f{i}_")
    }
}

fn column_names(
    fields: &[String],
) -> Vec<String> {
    // Fields that keep their own name.
    let own: HashSet<&str> = fields
        .iter()
        .enumerate()
        .filter(|(i, f)| {
            column_name(f, *i) == **f
        })
        .map(|(_, f)| f.as_str())
        .collect();
    let mut used = HashSet::new();
    let mut out = vec![];
    let it = fields.iter().enumerate();
    for (i, f) in it {
        let mut n = column_name(f, i);
        if n != *f {
            let taken = |n: &String| {
                own.contains(n.as_str())
                    || used.contains(n)
            };
            while taken(&n) {
                n.push('_');
            }
        }
        used.insert(n.clone());
        out.push(n);
    }
    out
}`,
    tests: `fn names(fs: &[&str]) -> Vec<String> {
    let v: Vec<String> =
        fs.iter().map(|s| s.to_string()).collect();
    column_names(&v)
}

#[test]
fn plain_names_are_kept() {
    assert_eq!(names(&["x", "vx", "$a_1"]),
        vec!["x", "vx", "$a_1"]);
}

#[test]
fn reserved_and_odd_names_are_renamed() {
    assert_eq!(names(&["length", "a-b", "é"]),
        vec!["f0_", "f1_", "f2_"]);
}

#[test]
fn a_rename_avoids_a_later_field() {
    assert_eq!(names(&["length", "f0_"]),
        vec!["f0__", "f0_"]);
}

#[test]
fn the_unit_test_in_emit_rs() {
    let got = names(&["length", "f0_", "f0__", "x"]);
    assert_eq!(got,
        vec!["f0___", "f0_", "f0__", "x"]);
}

#[test]
fn columns_are_unique() {
    let got = names(&["push", "f0_", "f0__", "of"]);
    let set: HashSet<&String> = got.iter().collect();
    assert_eq!(set.len(), 4, "{got:?}");
}
`,
    hints: [
      'Do it in two passes. First, collect the fields that keep their own name: the `f` at index `i` with `column_name(f, i) == *f`, into a `HashSet<&str>` (`own` in the solution).',
      'Second pass: for each field, start from `column_name(f, i)`. Only a renamed column (`n != *f`) is ever changed. Keep a second set, `used`, of the columns chosen so far.',
      'While `own.contains(n.as_str()) || used.contains(&n)`, push a `\'_\'` onto `n`. Then insert `n` into `used` and push it onto the result.',
    ],
    walkthrough: `**How to think about it.** This is \`column_names\` from \`engine/rust/crates/frontend-js/src/emit.rs\`; the fourth test is its own unit test, \`renamed_columns_never_clash\`. Start with the troublesome case, \`["length", "f0_"]\`. \`column_name\` turns \`length\` (field 0) into \`f0_\`, and leaves \`f0_\` alone, so renaming alone gives two columns called \`f0_\`, and the second \`this.f0_ = …\` in the constructor would overwrite the first. A renamed column must therefore avoid every name a field keeps, **including fields later in the list**, which the loop hasn't reached yet. That means collecting the kept names first, in a pass of their own, before choosing any column.

**The solution, line by line.**

- \`let own: HashSet<&str> = fields.iter().enumerate()\` walks the fields with their indexes; \`.filter(|(i, f)| column_name(f, *i) == **f)\` keeps those whose column is their own name (\`f\` is a \`&&String\` inside the closure, hence \`**f\`; \`*i\` copies the index); \`.map(|(_, f)| f.as_str())\` keeps only the name, borrowed from \`fields\` so nothing is copied; \`.collect()\` builds the set.
- \`let mut used = HashSet::new();\` will hold every column chosen so far, and \`let mut out = vec![];\` the answer.
- \`for (i, f) in it {\` (with \`it = fields.iter().enumerate()\`) visits each field with its index.
- \`let mut n = column_name(f, i);\` starts from the safe name: the field's own, or \`f{i}_\`.
- \`if n != *f {\`: only a renamed column is ever extended. A kept name must stay exactly the field's name, because the rewritten accesses (\`ps.x[i]\`) use it, and field names in one record are already distinct.
- \`let taken = |n: &String| own.contains(n.as_str()) || used.contains(n);\` asks "is this name a kept field, or a column already chosen?". \`n.as_str()\` turns the \`String\` into the \`&str\` that \`own\` holds.
- \`while taken(&n) { n.push('_'); }\` appends underscores until the name is free: \`f0_\` is kept, so \`f0__\`.
- \`used.insert(n.clone()); out.push(n);\` records the column (the set needs its own copy) and adds it to the result, in field order.
- \`out\` is returned.

**Common wrong attempts.**

- Checking only \`used\`: \`length\` becomes \`f0_\` before the loop reaches the real \`f0_\`, so both columns are called \`f0_\`.
- Extending every column, not only renamed ones: \`x\` is in \`own\`, so it becomes \`x_\`, and every rewritten \`ps.x[i]\` names a column that doesn't exist.
- Mapping each field through \`column_name\` and stopping there: \`["length", "f0_"]\` gives \`f0_\` twice.`,
    wrong: [
      {
        code: `use std::collections::HashSet;

const RESERVED: &[&str] = &[
    "length", "push", "grow", "of",
    "constructor", "prototype", "get",
    "cap", "data",
];

// Field i's column: its own name if
// that is a plain identifier and not
// reserved, else f{i}_.
fn column_name(
    f: &str,
    i: usize,
) -> String {
    let hd = |c: char| {
        c.is_ascii_alphabetic()
            || c == '_'
            || c == '$'
    };
    let rest = |c: char| {
        c.is_ascii_alphanumeric()
            || c == '_'
            || c == '$'
    };
    let mut cs = f.chars();
    let a = cs.next().is_some_and(hd);
    let ok = a && cs.all(rest);
    if ok && !RESERVED.contains(&f) {
        f.to_string()
    } else {
        format!("f{i}_")
    }
}

fn column_names(
    fields: &[String],
) -> Vec<String> {
    // Fields that keep their own name.
    let own: HashSet<&str> = fields
        .iter()
        .enumerate()
        .filter(|(i, f)| {
            column_name(f, *i) == **f
        })
        .map(|(_, f)| f.as_str())
        .collect();
    let mut used = HashSet::new();
    let mut out = vec![];
    let it = fields.iter().enumerate();
    for (i, f) in it {
        let mut n = column_name(f, i);
        if n != *f {
            let taken = |n: &String| {
                used.contains(n)
            };
            while taken(&n) {
                n.push('_');
            }
        }
        used.insert(n.clone());
        out.push(n);
    }
    out
}`,
        why: 'It only avoids columns already chosen. `length` becomes `f0_` before the real field `f0_` is reached, and two columns get the same name.',
      },
      {
        code: `use std::collections::HashSet;

const RESERVED: &[&str] = &[
    "length", "push", "grow", "of",
    "constructor", "prototype", "get",
    "cap", "data",
];

// Field i's column: its own name if
// that is a plain identifier and not
// reserved, else f{i}_.
fn column_name(
    f: &str,
    i: usize,
) -> String {
    let hd = |c: char| {
        c.is_ascii_alphabetic()
            || c == '_'
            || c == '$'
    };
    let rest = |c: char| {
        c.is_ascii_alphanumeric()
            || c == '_'
            || c == '$'
    };
    let mut cs = f.chars();
    let a = cs.next().is_some_and(hd);
    let ok = a && cs.all(rest);
    if ok && !RESERVED.contains(&f) {
        f.to_string()
    } else {
        format!("f{i}_")
    }
}

fn column_names(
    fields: &[String],
) -> Vec<String> {
    // Fields that keep their own name.
    let own: HashSet<&str> = fields
        .iter()
        .enumerate()
        .filter(|(i, f)| {
            column_name(f, *i) == **f
        })
        .map(|(_, f)| f.as_str())
        .collect();
    let mut used = HashSet::new();
    let mut out = vec![];
    let it = fields.iter().enumerate();
    for (i, f) in it {
        let mut n = column_name(f, i);
        if true {
            let taken = |n: &String| {
                own.contains(n.as_str())
                    || used.contains(n)
            };
            while taken(&n) {
                n.push('_');
            }
        }
        used.insert(n.clone());
        out.push(n);
    }
    out
}`,
        why: 'It extends kept names too. `x` is in `own`, so it becomes `x_`, and every rewritten access `ps.x[i]` would name a column that doesn’t exist.',
      },
      {
        code: `use std::collections::HashSet;

const RESERVED: &[&str] = &[
    "length", "push", "grow", "of",
    "constructor", "prototype", "get",
    "cap", "data",
];

// Field i's column: its own name if
// that is a plain identifier and not
// reserved, else f{i}_.
fn column_name(
    f: &str,
    i: usize,
) -> String {
    let hd = |c: char| {
        c.is_ascii_alphabetic()
            || c == '_'
            || c == '$'
    };
    let rest = |c: char| {
        c.is_ascii_alphanumeric()
            || c == '_'
            || c == '$'
    };
    let mut cs = f.chars();
    let a = cs.next().is_some_and(hd);
    let ok = a && cs.all(rest);
    if ok && !RESERVED.contains(&f) {
        f.to_string()
    } else {
        format!("f{i}_")
    }
}

fn column_names(
    fields: &[String],
) -> Vec<String> {
    fields
        .iter()
        .enumerate()
        .map(|(i, f)| column_name(f, i))
        .collect()
}`,
        why: 'Renaming alone isn’t enough: `["length", "f0_"]` gives `f0_` twice.',
      },
    ],
  },
  storeLate: {
    optional: true,
    lang: 'rust',
    title: 'When to store late',
    prompt: 'Write the two pieces of the late-store decision. `worst(xs)` returns the worst `Effect` in `xs` (`Inert` for an empty slice), using the derived order `Inert < MayThrow < Effects`. `store_late(op, ok, typed, rhs)` returns `true` exactly when the emitter must store late: either `op` is `"="`, the index is not `ok`, and `rhs` is not `Inert`; or the column is `typed` and `rhs` is `Effects`.',
    starter: `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;

// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {
    todo!()
}

// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {
    todo!()
}`,
    solution: `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;

// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {
    let mut w = Inert;
    for &x in xs {
        w = w.max(x);
    }
    w
}

// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {
    let plain_eq = op == "="
        && !ok
        && rhs != Inert;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`,
    tests: `#[test]
fn worst_of_nothing_is_inert() {
    assert_eq!(worst(&[]), Inert);
}

#[test]
fn worst_takes_the_maximum() {
    let xs = [MayThrow, Inert, MayThrow];
    assert_eq!(worst(&xs), MayThrow);
    let ys = [Inert, Effects, MayThrow];
    assert_eq!(worst(&ys), Effects);
}

#[test]
fn proven_typed_late_only_for_effects() {
    assert!(!store_late("=", true, true,
        MayThrow));
    assert!(store_late("=", true, true,
        Effects));
}

#[test]
fn proven_plain_is_never_late() {
    for e in [Inert, MayThrow, Effects] {
        assert!(!store_late("=", true,
            false, e));
    }
}

#[test]
fn unproven_assignment_with_a_live_rhs() {
    assert!(!store_late("=", false,
        false, Inert));
    assert!(store_late("=", false,
        false, MayThrow));
    assert!(store_late("=", false,
        false, Effects));
}

#[test]
fn compound_writes_read_first() {
    assert!(!store_late("+=", false,
        false, MayThrow));
    assert!(!store_late("+=", false,
        false, Effects));
    assert!(store_late("+=", false,
        true, Effects));
}
`,
    hints: [
      '`worst` is a running maximum: start at `Inert` (the least) and replace it with `w.max(x)` for each `x`. `max` exists because the enum derives `Ord`.',
      '`store_late` is the condition from `emit.rs` with the leading `write &&` dropped. It has two parts joined by `||`; write each as its own `let` with a name.',
      'Part one: `op == "=" && !ok && rhs != Inert`. Part two: `typed && rhs == Effects`. Return `plain_eq || grows`.',
    ],
    walkthrough: `**How to think about it.** Ask, for each kind of write, "could a program tell the difference between checking and storing early and doing it in JavaScript's order?" Two things can give the order away. A check that throws: that only matters for a plain \`=\` (a compound \`+=\` reads the element first in the original too, so its error comes first either way), only when the index isn't proven, and only when the right side can do something before the store, even if it is only throw its own error. And a column that is replaced: only a typed column (or AoSoA's \`data\`) is ever replaced, by \`grow()\`, and only a right side that runs code can make it grow. Those two sentences are the two halves of the condition in \`engine/rust/crates/frontend-js/src/emit.rs\`; \`worst\` is how the analysis in \`analysis.rs\` reduces a whole right-hand side to one \`RhsEffect\`.

**The solution, line by line.**

- \`let mut w = Inert;\` starts at the least effect, so an empty right side (nothing to evaluate) is \`Inert\`.
- \`for &x in xs { w = w.max(x); }\`: \`&x\` copies each \`Effect\` out of the slice (it derives \`Copy\`), and \`max\` keeps the larger of two values in the derived order. The real code writes \`worst = worst.max(effect(x))\`.
- \`w\` is returned.
- \`let plain_eq = op == "=" && !ok && rhs != Inert;\` is the first reason to store late: an unproven plain assignment whose right side could act or throw before the store. \`op == "="\` compares a \`&str\` with a string literal, which Rust allows directly.
- \`let grows = typed && rhs == Effects;\` is the second: a typed column that the right side could replace by pushing.
- \`plain_eq || grows\` is the answer.

**Common wrong attempts.**

- Storing late whenever \`!ok\`: an inert right side can't reveal the order, so \`ps.x[__vsc_bc(...)] = 5\` is fine and cheaper, and \`unproven_assignment_with_a_live_rhs\` fails.
- Forgetting \`op == "="\`: a compound write would then store late for a right side that only may throw, although its own read of the old value throws first in both versions; \`compound_writes_read_first\` fails.
- Writing \`typed && rhs != Inert\`: a right side that may only throw can't push, so it can't replace the column; \`proven_typed_late_only_for_effects\` fails.`,
    wrong: [
      {
        code: `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;

// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {
    let mut w = Inert;
    for &x in xs {
        w = w.max(x);
    }
    w
}

// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {
    let plain_eq = op == "=" && !ok;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`,
        why: 'An unproven write with an inert right side can keep the cheap checked form: nothing on the right can reveal when the check ran.',
      },
      {
        code: `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;

// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {
    let mut w = Inert;
    for &x in xs {
        w = w.max(x);
    }
    w
}

// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {
    let plain_eq = !ok && rhs != Inert;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`,
        why: 'A compound write such as `+=` reads the element first in the original too, so a right side that may throw doesn’t need a late store; only `=` does.',
      },
      {
        code: `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;

// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {
    let mut w = Inert;
    for &x in xs {
        w = w.max(x);
    }
    w
}

// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {
    let plain_eq = op == "="
        && !ok
        && rhs != Inert;
    let grows = typed && rhs != Inert;
    plain_eq || grows
}`,
        why: 'A right side that may only throw can’t push, so it can’t make `grow()` replace the column. Only `Effects` can.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which field names keep their own column name?',
    options: [
      {
        t: 'Any name, since columns are only properties',
        why: 'A column called `length` or `push` would overwrite the container’s own members.',
      },
      {
        t: 'Plain ASCII identifiers that are not in `RESERVED`',
        correct: true,
        why: 'Anything else, such as `a-b`, `é` or `length`, becomes `f{i}_`.',
      },
      {
        t: 'Only names of one letter',
        why: 'Any plain identifier is kept, such as `vx` or `$a_1`.',
      },
    ],
  },
  {
    q: '`const p = ps[i]; p.x += 1;` is in a proven loop. What does the emitter write?',
    options: [
      {
        t: '`const p = ps[i]; p.x += 1;`, unchanged',
        why: 'The collection is transformed, so there are no element objects left to hold.',
      },
      {
        t: '`const p = { x: ps.x[i] }; p.x += 1;`',
        why: 'That would make a copy, and the write would be lost.',
      },
      {
        t: '`const p = i; ps.x[p] += 1;`',
        correct: true,
        why: 'The variable now holds the element’s index, and every field access through it indexes a column.',
      },
    ],
  },
  {
    q: 'Out of bounds, the original `ps[100].x = (t = 5)` throws. When?',
    options: [
      {
        t: 'Before `t = 5`, when `ps[100]` turns out to be `undefined`',
        why: 'Reading `ps[100]` gives `undefined` without throwing. The left side is just a reference.',
      },
      {
        t: 'It never throws: it creates the element',
        why: 'Setting a property of `undefined` always throws a `TypeError`.',
      },
      {
        t: 'After `t = 5`, when the store tries to set `x` on `undefined`',
        correct: true,
        why: '`PutValue` runs after the right-hand side and throws there, so `t` is 5 in the `catch`.',
      },
    ],
  },
  {
    q: 'A right-hand side calls a function that pushes onto `ps`. Why can the cheap `ps.x[i] = rhs` lose the write?',
    options: [
      {
        t: 'The push shifts every element up by one',
        why: 'A push appends; indices don’t move.',
      },
      {
        t: '`ps.x` was fetched before `rhs`; if the push grows the container, `grow()` replaces `this.x`, and the store goes into the old array',
        correct: true,
        why: 'This was bug 12 in the README, also for `+=`, `||=` and AoSoA’s `data`.',
      },
      {
        t: 'Float64Array is read-only while a push runs',
        why: 'Typed arrays can always be written.',
      },
    ],
  },
];
