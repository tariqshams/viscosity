// Chapter 257 cards. Keys are stable ids: never rename them.

export const prompts = {
  'vrs-what': {
    q: 'What is viscosity-rs, and what must it match?',
    a: 'The Rust port of Viscosity in `engine/rust`. For every test program it must produce the same code and `explain` text as the TypeScript engine, byte for byte.',
  },
  'vrs-crates': {
    q: 'Name the six crates of the Rust workspace.',
    a: '`vir`, `core`, `frontend-js`, `frontend-python`, `cli` and `wasm`.',
  },
  'vrs-oracle': {
    q: 'Which part of the TypeScript `core` package became a crate of its own, and what does that crate depend on?',
    a: 'The IR, `vir.ts`, became the `vir` crate. It depends on nothing.',
  },
  'vrs-inherit': {
    q: 'The root has `[workspace.package] edition = "2021"`. What must a member write to use it?',
    a: '`edition.workspace = true`. Inheritance is opt-in, key by key.',
  },
  'vrs-caret': {
    q: 'Which oxc versions does the requirement `"0.156"` accept?',
    a: 'At least 0.156.0 and below 0.157.0. Before 1.0, cargo treats each minor version as incompatible.',
  },
  'vrs-exact': {
    q: 'Why is wasm-bindgen pinned with `"=0.2.106"` instead of `"0.2"`?',
    a: 'The wasm-bindgen CLI rejects a `.wasm` built with a library of a different schema version, so the library must match the CLI exactly.',
  },
  'vrs-order': {
    q: 'Why can’t the port use std’s `HashMap` wherever the TypeScript engine used a `Map`?',
    a: 'A JS `Map` iterates in insertion order and that order shows up in `explain`. `HashMap` iterates in an arbitrary, randomly seeded order. `IndexMap` keeps insertion order.',
  },
  'vrs-fx': {
    q: 'What does `FxHashMap` from rustc-hash give up, and why is that fine in a compiler?',
    a: 'Resistance to hash-flooding (denial-of-service) attacks, in exchange for a faster hash. A compiler doesn’t face that threat.',
  },
  'vrs-fixtures': {
    q: 'Who writes the files in `engine/rust/tests/expected`?',
    a: 'The TypeScript engine, run by `scripts/gen_expected.mjs`: its code and `explain` output for every program, with default options and with `--bounds assume`.',
  },
  'vrs-regen': {
    q: 'You change the TypeScript engine. What do you run before `cargo test`?',
    a: '`node scripts/gen_expected.mjs`, to regenerate the fixtures. Then the parity test shows where the port must follow.',
  },
};

export const examples = {
  'map-order': {
    lang: 'rust',
    title: 'Insertion order vs HashMap order',
    code: `use std::collections::HashMap;

fn main() {
    let names = ["ps", "qs", "rs",
        "ts", "us", "vs"];
    let mut m = HashMap::new();
    let mut order = Vec::new();
    for (i, n) in
        names.iter().enumerate()
    {
        m.insert(*n, i);
        order.push((*n, i));
    }
    // insertion order, like a JS Map
    for (n, i) in &order {
        print!("{n}={i} ");
    }
    println!();
    // HashMap: arbitrary order
    for (n, i) in &m {
        print!("{n}={i} ");
    }
    println!();
}`,
  },
};

const SIG = `fn first_diff(want: &str, got: &str)
    -> Option<usize> {`;

export const exercises = {
  firstDiff: {
    lang: 'rust',
    title: 'Where do two outputs differ?',
    prompt:
      'Write `first_diff`, the helper that makes parity failures readable. Return `None` when `want == got`. Otherwise return the 1-based number of the first line where they differ, comparing `.lines()` pair by pair. If every line they both have is equal (one is a prefix of the other, or only a final line break differs), return the line just after the shorter one: its number of lines plus 1.',
    starter: `${SIG}
    todo!()
}`,
    solution: `${SIG}
    if want == got {
        return None;
    }
    let mut n = 0;
    for (w, g) in
        want.lines().zip(got.lines())
    {
        n += 1;
        if w != g {
            return Some(n);
        }
    }
    Some(n + 1)
}`,
    tests: `#[test]
fn equal_texts_have_no_difference() {
    let t = "a\\nb\\n";
    assert_eq!(first_diff(t, t), None);
    assert_eq!(first_diff("", ""), None);
}

#[test]
fn reports_the_first_differing_line() {
    let want = "ps (line 3)\\n  · soa\\n  · x\\n";
    let got = "ps (line 3)\\n  · aos\\n  · y\\n";
    assert_eq!(first_diff(want, got), Some(2));
}

#[test]
fn line_numbers_start_at_one() {
    assert_eq!(first_diff("a", "b"), Some(1));
}

#[test]
fn a_missing_line_counts() {
    let d = first_diff("a\\nb\\n", "a\\n");
    assert_eq!(d, Some(2));
    assert_eq!(first_diff("", "x"), Some(1));
}

#[test]
fn a_missing_final_newline_counts() {
    assert_eq!(first_diff("a\\n", "a"), Some(2));
}`,
    hints: [
      'Deal with the easy case first: if the two strings are equal, return `None`.',
      '`want.lines().zip(got.lines())` gives pairs of lines and stops at the end of the shorter text. Count the pairs as you go.',
      'If the loop finishes without finding a differing pair, the texts still differ (you checked that first), so the difference is just past the shorter one: `Some(count + 1)`.',
    ],
    walkthrough: `The real \`first_difference\` in \`crates/cli/tests/parity.rs\` has the same shape: zip the lines, report the first pair that differs, and fall back to something else when every pair matches.

- **Equal first.** Comparing whole strings is one call, and it settles the \`None\` case, including two empty strings.
- **Zip the lines.** \`zip\` pairs line 1 with line 1, line 2 with line 2, and stops as soon as either side runs out. Counting with \`n += 1\` before the comparison makes the number 1-based.
- **The prefix case.** If the loop ends, every shared line matched, but the texts are different, so one has extra lines or a different final line break. \`lines()\` drops a final \`\\n\`, so \`"a\\n"\` and \`"a"\` both give \`["a"]\`; the answer is then line 2, the first line the shorter text doesn't have.

A parity failure that says "line 2" of an \`explain\` text usually points straight at one decision. That is why the real test prints the two lines next to each other.`,
    wrong: [
      {
        code: `${SIG}
    let pairs =
        want.lines().zip(got.lines());
    for (i, (w, g)) in
        pairs.enumerate()
    {
        if w != g {
            return Some(i + 1);
        }
    }
    None
}`,
        why: '`zip` stops at the shorter text, so when one output is missing its last lines (or its last line break) no pair differs and this returns `None`, calling different texts equal.',
      },
      {
        code: `${SIG}
    if want == got {
        return None;
    }
    let mut n = 0;
    for (w, g) in
        want.lines().zip(got.lines())
    {
        if w != g {
            return Some(n);
        }
        n += 1;
    }
    Some(n)
}`,
        why: 'This counts from 0. Editors and the parity test number lines from 1, so a difference on the first line must be `Some(1)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does the Rust engine have to match for each test program?',
    options: [
      { t: 'The TypeScript engine’s decisions, but the wording of `explain` may differ', why: 'The `explain` text is compared byte for byte too.' },
      { t: 'The TypeScript engine’s rewritten code and `explain` text, byte for byte', correct: true, why: 'That is the parity contract, checked by `parity.rs` against fixtures the TypeScript engine wrote.' },
      { t: 'Only that the rewritten program prints the same output when run', why: 'That is the differential test, a separate check. Parity is stricter: identical text.' },
      { t: 'Hand-written expected output in comments inside each program', why: 'That is how drip-rs’s corpus works. Here the TypeScript engine produces the expectations.' },
    ],
  },
  {
    q: 'In `Cargo.toml`, `oxc_parser = "0.156"`. Which version may cargo pick?',
    options: [
      { t: 'Exactly 0.156.0', why: 'That would be `"=0.156.0"`.' },
      { t: 'Any 0.x version from 0.156 on', why: 'Before 1.0, a new minor version counts as incompatible, so 0.157 is excluded.' },
      { t: 'Any version at least 0.156.0 and below 0.157.0', correct: true, why: 'The leftmost non-zero component, 156, must stay the same.' },
    ],
  },
  {
    q: 'A workspace root sets `rust-version = "1.85"` under `[workspace.package]`, and no member writes `rust-version.workspace = true` (engine/rust’s first manifest). What minimum Rust version do the members declare?',
    options: [
      { t: 'None: no member writes `rust-version.workspace = true`', correct: true, why: 'Inheritance is opt-in per key; `cargo metadata` showed no `rust_version` for any member. Today every member opts in and declares 1.97.' },
      { t: '1.85, inherited automatically', why: 'Workspace keys are inherited only by members that ask for them.' },
      { t: '1.97, because oxc requires it', why: 'oxc’s manifest does ask for 1.97.0, but that is oxc’s field, not the members’.' },
    ],
  },
  {
    q: 'You run `cargo build --manifest-path engine/rust/Cargo.toml` from the repository root. Is `engine/rust/.cargo/config.toml` read?',
    options: [
      { t: 'Yes, cargo always reads the config next to the manifest', why: 'The Cargo book says config files are probed in the current directory and its parents.' },
      { t: 'No: cargo looks in the directory it runs in and that directory’s parents, and `engine/rust` is neither', correct: true, why: 'Run cargo from inside `engine/rust` to get `debug = 0`.' },
      { t: 'Only for release builds', why: 'Where cargo looks for config doesn’t depend on the profile.' },
    ],
  },
  {
    q: 'Why does the port use `IndexMap` where the TypeScript engine used `Map`?',
    options: [
      { t: 'IndexMap is always faster than HashMap', why: 'Speed is what FxHashMap is for. IndexMap is chosen for its order.' },
      { t: 'HashMap can’t store string keys', why: 'It can; the run above uses `&str` keys.' },
      { t: 'Only IndexMap compiles to WebAssembly', why: 'std’s HashMap works in WebAssembly too.' },
      { t: 'Both IndexMap and `Map` iterate in insertion order, and that order decides the order of the `explain` lines', correct: true, why: 'With HashMap’s arbitrary order, the messages could come out in a different order from the TypeScript engine’s.' },
    ],
  },
  {
    q: 'You fix a bug in the TypeScript engine that changes one `explain` line. What happens next?',
    options: [
      { t: 'Nothing: the Rust tests don’t look at the TypeScript engine', why: 'They compare with fixtures the TypeScript engine generated.' },
      { t: 'After `node scripts/gen_expected.mjs`, the parity test fails until the Rust engine makes the same fix', correct: true, why: 'The fixtures now hold the new line, and the port still prints the old one.' },
      { t: 'cargo regenerates the fixtures automatically during `cargo test`', why: 'The fixtures are regenerated by hand, with Node, so a change to them is always deliberate.' },
    ],
  },
];
