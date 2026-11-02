// Chapter 348 cards. Keys are stable ids: never rename them.

// Shared by the exercise: column_name from emit.rs.
const SCAF = `use std::collections::HashSet;

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
`;

const SOL = `${SCAF}
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
}`;

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
  'cg-rust-borrow': {
    q: 'What does rustc say about holding `&mut ps.x`, calling `ps.push(...)`, then storing through the first reference?',
    a: 'Error E0499: cannot borrow `ps` as mutable more than once at a time.',
  },
  'cg-rhs-effect': {
    q: 'What are the three values of `RhsEffect`, and what decides between them?',
    a: '`Inert`, `MayThrow` and `Effects`: the worst thing any instruction evaluated within the assignment (besides the element itself, and the old value of a compound write) can do.',
  },
  'cg-bk-nan': {
    q: 'Why does `__vsc_bk` return `NaN` out of bounds instead of throwing?',
    a: 'So the check is decided before the right-hand side but the error comes after it: `__vsc_set` throws when it sees `i !== i`, as the original’s store would.',
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
    prompt:
      'Write `column_names`, as in `emit.rs`. Each field gets `column_name(f, i)`. A field whose column is its own name is *kept*. A renamed column gets `_` appended until it differs from every kept field name (earlier or later in the list) and from every column already chosen.',
    starter: `${SCAF}
fn column_names(
    fields: &[String],
) -> Vec<String> {
    todo!()
}`,
    solution: SOL,
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
      'First collect the kept names: the fields `f` (at index `i`) with `column_name(f, i) == *f`, into a `HashSet<&str>` (called `own` in the solution).',
      'Then walk the fields again with a second set, `used`, of columns chosen so far. Only a renamed column (`n != *f`) is ever extended.',
      'While `own.contains(n.as_str()) || used.contains(&n)`, push a `\'_\'` onto `n`. Then insert `n` into `used`.',
    ],
    walkthrough: `This is \`column_names\` from \`engine/rust/crates/frontend-js/src/emit.rs\`, and the fourth test is its own unit test, \`renamed_columns_never_clash\`.

- **Why look ahead.** In \`["length", "f0_"]\`, \`length\` is renamed to \`f0_\` before the loop has reached the real field \`f0_\`. Checking only the columns chosen so far would give two columns called \`f0_\`, and the second \`this.f0_ = …\` in the constructor would overwrite the first. So the kept names (\`own\`) are collected first, for the whole list.
- **Why only renamed columns grow.** A kept name is the field’s own name, and the rewritten accesses (\`ps.x[i]\`) rely on it. Field names in one record are distinct, so kept names never clash with each other.
- **Why \`used\` too.** It guards renamed columns against each other, as the reference does. With distinct \`f{i}_\` bases that can’t happen today, but the guard costs nothing and keeps the rule simple: a column differs from every other column.
- **Rust details.** \`own\` holds \`&str\` borrowed from \`fields\`, so nothing is copied. \`n.as_str()\` turns the \`String\` into the \`&str\` the set is keyed by.`,
    wrong: [
      {
        code: SOL.replace(`                own.contains(n.as_str())
                    || used.contains(n)`, `                used.contains(n)`),
        why: 'It only avoids columns already chosen. `length` becomes `f0_` before the real field `f0_` is reached, and two columns get the same name.',
      },
      {
        code: SOL.replace('        if n != *f {', '        if true {'),
        why: 'It extends kept names too. `x` is in `own`, so it becomes `x_`, and every rewritten access `ps.x[i]` would name a column that doesn’t exist.',
      },
      {
        code: `${SCAF}
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
};

export const quiz = [
  {
    q: 'Which field names keep their own column name?',
    options: [
      { t: 'Any name, since columns are only properties', why: 'A column called `length` or `push` would overwrite the container’s own members.' },
      { t: 'Plain ASCII identifiers that are not in `RESERVED`', correct: true, why: 'Anything else, such as `a-b`, `é` or `length`, becomes `f{i}_`.' },
      { t: 'Only names of one letter', why: 'Any plain identifier is kept, such as `vx` or `$a_1`.' },
    ],
  },
  {
    q: 'Out of bounds, the original `ps[100].x = (t = 5)` throws. When?',
    options: [
      { t: 'Before `t = 5`, when `ps[100]` turns out to be `undefined`', why: 'Reading `ps[100]` gives `undefined` without throwing. The left side is just a reference.' },
      { t: 'It never throws: it creates the element', why: 'Setting a property of `undefined` always throws a `TypeError`.' },
      { t: 'After `t = 5`, when the store tries to set `x` on `undefined`', correct: true, why: '`PutValue` runs after the right-hand side and throws there, so `t` is 5 in the `catch`.' },
    ],
  },
  {
    q: 'Why did the old output `ps.x[__vsc_bc(ps, 100, \'x\', true)] = (t = 5)` print `t` as 0?',
    options: [
      { t: 'The left-hand side, including the check, is evaluated before the right-hand side', correct: true, why: 'So `__vsc_bc` threw before `t = 5` ran.' },
      { t: '`__vsc_bc` resets `t`', why: 'It doesn’t touch anything but its arguments.' },
      { t: 'The typed column stored 5 as 0', why: 'Nothing was stored at all.' },
    ],
  },
  {
    q: 'A right-hand side calls a function that pushes onto `ps`. Why can the cheap `ps.x[i] = rhs` lose the write?',
    options: [
      { t: 'The push shifts every element up by one', why: 'A push appends; indices don’t move.' },
      { t: '`ps.x` was fetched before `rhs`; if the push grows the container, `grow()` replaces `this.x`, and the store goes into the old array', correct: true, why: 'This was bug 12 in the README, also for `+=`, `||=` and AoSoA’s `data`.' },
      { t: 'Float64Array is read-only while a push runs', why: 'Typed arrays can always be written.' },
    ],
  },
  {
    q: 'A write to a **plain** (non-typed) column, with a proven index and a right-hand side that calls a function. Which form does the emitter use?',
    options: [
      { t: '`__vsc_set`, because the right side runs code', why: 'Only typed columns are replaced by `grow()`, and a proven index can’t fail.' },
      { t: '`__vsc_bk` and `__vsc_set`, for safety', why: 'The order can’t be observed here, so the cheap form is kept.' },
      { t: 'The cheap `ps.col[i] = rhs`', correct: true, why: 'A plain column is an ordinary array that is never replaced, so fetching it early is fine.' },
    ],
  },
  {
    q: 'In `__vsc_set(c, col, i, v, f)`, what does the test `i !== i` check?',
    options: [
      { t: 'Whether `__vsc_bk` returned `NaN`, i.e. the index was out of bounds', correct: true, why: '`NaN` is the only value not equal to itself. The throw then happens after the right-hand side ran, as in the original.' },
      { t: 'Whether `i` is a string', why: 'A string equals itself.' },
      { t: 'Nothing: it is always false', why: 'It is true for `NaN`.' },
    ],
  },
];
