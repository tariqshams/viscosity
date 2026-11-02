// Chapter 432 cards. Keys are stable ids: never rename them.

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
  'cg-edits': {
    q: 'What is an edit, in `emit.rs`?',
    a: 'A byte range of the original source and the text that replaces it (an insertion when the range is empty).',
  },
  'cg-back-to-front': {
    q: 'Why are the edits applied in order of start, largest first?',
    a: 'An edit changes the length of the text after it. Applied from the end, no edit still waiting has moved, so no offset needs fixing.',
  },
  'cg-copy-through': {
    q: 'Why does the compiled program keep the programmer’s comments and spacing?',
    a: 'The emitter only replaces the byte ranges it must; everything else is copied through from the original text.',
  },
  'cg-push-args': {
    q: 'What does `ps.push({ x: i, vx: 1 })` become, and why in that order?',
    a: '`ps.push(i, 1)`: the object literal is removed and its values become arguments in field order, which is the order of the container’s `push(v0, v1)`.',
  },
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
  'cg-bc-shift': {
    q: 'In `__vsc_bc`, what does `i >>> 0 === i` check?',
    a: 'That `i` is a whole number from 0 to 2³² − 1: `>>> 0` converts to an unsigned 32-bit integer, which changes anything else (`-1`, `1.5`, `"3"`).',
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
    q: 'Why does the emitter apply its edits from the end of the source towards the start?',
    options: [
      { t: 'So that no edit moves the offsets of the edits still to come', correct: true, why: 'Each replacement only changes the text after it, and everything after it is already done.' },
      { t: 'Because Rust strings can only be changed at the end', why: '`replace_range` changes any range.' },
      { t: 'So that the prelude ends up at the top', why: 'The prelude is added separately, after all the edits.' },
    ],
  },
  {
    q: '`const p = ps[i]; p.x += 1;` is in a proven loop. What does the emitter write?',
    options: [
      { t: '`const p = ps[i]; p.x += 1;`, unchanged', why: 'The collection is transformed, so there are no element objects left to hold.' },
      { t: '`const p = { x: ps.x[i] }; p.x += 1;`', why: 'That would make a copy, and the write would be lost.' },
      { t: '`const p = i; ps.x[p] += 1;`', correct: true, why: 'The variable now holds the element’s index, and every field access through it indexes a column.' },
    ],
  },
  {
    q: 'Which accesses get `__vsc_bc` around their index?',
    options: [
      { t: 'Every access to a transformed collection', why: 'Proven accesses get a bare index, like `ps.x[i]`.' },
      { t: 'Accesses not proven in bounds, unless compiled with `--bounds assume`', correct: true, why: '`--bounds assume` trusts the program, so no check is added at all.' },
      { t: 'Only writes', why: 'Reads get it too, as `ps[99].x` does; the flag `w` picks the wording.' },
    ],
  },
  {
    q: 'Out of range, what does `__vsc_bc(ps, 99, \'x\', false)` do?',
    options: [
      { t: 'Returns `undefined`', why: 'It never returns out of range; it throws.' },
      { t: 'Returns 0, so the read is harmless', why: 'That would change what the program prints.' },
      { t: 'Throws `TypeError: Cannot read properties of undefined (reading \'x\')`, the original’s error', correct: true, why: 'The compiled program must fail exactly where and how the original fails.' },
    ],
  },
];
