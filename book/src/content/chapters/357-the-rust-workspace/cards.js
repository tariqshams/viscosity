// Chapter 357 cards. Keys are stable ids: never rename them.

export const prompts = {
  'vrs-what': {
    q: 'What is viscosity-rs, and what must it match?',
    a: 'The Rust port of Viscosity in `engine/rust`, published at 0.0.1. For every test program it must produce the same code and `explain` text as the TypeScript engine, byte for byte.',
  },
  'vrs-crates': {
    q: 'Name the six crates of the Rust workspace.',
    a: '`vir`, `core`, `frontend-js`, `frontend-python`, `cli` and `wasm`.',
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
    walkthrough: `**How to think about it.** Start from what the test needs: a line number a person can jump to. Two texts are compared line by line, so walk both at once, pair by pair, and stop at the first pair that differs. The tricky case is when every pair matches but the texts are still different: one has extra lines, or only one ends in a line break. \`zip\` stops at the shorter text, so you must handle "ran out" yourself, after the loop.

**The solution, line by line.**

- \`if want == got {\` compares the whole strings first. That one comparison settles the \`None\` case, including two empty strings, and it means that after this line you *know* the texts differ.
- \`    return None;\` reports "no difference".
- \`let mut n = 0;\` is the count of line pairs seen so far.
- \`for (w, g) in want.lines().zip(got.lines())\` walks the two texts together: \`lines()\` splits at line breaks (and drops a final one), and \`zip\` pairs line 1 with line 1, line 2 with line 2, and stops as soon as either side runs out.
- \`    n += 1;\` counts this pair *before* comparing, so the first pair is line 1, not line 0.
- \`    if w != g { return Some(n); }\` reports the first pair that differs.
- \`Some(n + 1)\` runs only when every shared line matched. The texts differ anyway (the first check said so), so the difference is the line just after the shorter text. For \`"a\\n"\` against \`"a"\`, \`lines()\` gives \`["a"]\` for both, the loop finds nothing, and the answer is line 2.

**Common wrong attempts.**

- Returning \`None\` after the loop calls two different texts equal whenever one is a prefix of the other, which is exactly the failure a missing last line produces.
- Counting after the comparison, or using \`enumerate\` without adding 1, reports line 0 for a difference on the first line.

The real \`first_difference\` in \`crates/cli/tests/parity.rs\` has the same zip-and-compare loop; when every pair matches it reports the two lengths in bytes instead of a line number.`,
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
    q: 'The crates are published at 0.0.1. A project depends on `viscosity-core = "0.0.1"`. Will `cargo update` move it to 0.0.2 when that is released?',
    options: [
      { t: 'Yes: any 0.x version is compatible', why: 'Before 1.0 cargo is stricter, not looser.' },
      { t: 'No: `"0.0.1"` means at least 0.0.1 and below 0.0.2', correct: true, why: 'The leftmost non-zero number is the patch number, so every 0.0.z release counts as incompatible with every other. That is why the README calls 0.0.1 deliberate.' },
      { t: 'Yes, because only the patch number changed', why: 'That holds from 1.0 on; for 0.0.z the patch number is the one that must stay the same.' },
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
    q: 'You fix a bug in the TypeScript engine that changes one `explain` line. What happens next?',
    options: [
      { t: 'Nothing: the Rust tests don’t look at the TypeScript engine', why: 'They compare with fixtures the TypeScript engine generated.' },
      { t: 'After `node scripts/gen_expected.mjs`, the parity test fails until the Rust engine makes the same fix', correct: true, why: 'The fixtures now hold the new line, and the port still prints the old one.' },
      { t: 'cargo regenerates the fixtures automatically during `cargo test`', why: 'The fixtures are regenerated by hand, with Node, so a change to them is always deliberate.' },
    ],
  },
];
