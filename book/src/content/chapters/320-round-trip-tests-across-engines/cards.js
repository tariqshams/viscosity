// Chapter 320 cards. Keys are stable ids: never rename them.

const MSG = `// The message for differing line n.
fn line_msg(n: usize, w: &str, g: &str)
    -> String {
    format!("line {n}: {w:?} vs {g:?}")
}
`;

export const prompts = {
  'cross-what': {
    q: 'What is a **cross-implementation test**?',
    a: 'Running two implementations of the same thing on the same inputs and requiring the same outputs.',
  },
  'who-writes-fixtures': {
    q: 'Which engine writes the files in `engine/rust/tests/expected`, and with what?',
    a: 'The TypeScript engine, through `scripts/gen_expected.mjs`, run with Node.',
  },
  'two-variants': {
    q: 'Why is every program compiled twice for the fixtures?',
    a: 'Once with default options and once with `bounds: \'assume\'`, which takes the unchecked emit paths.',
  },
  'why-fixtures': {
    q: 'Why does the Rust test compare against committed files instead of running the TS engine itself?',
    a: '`cargo test` then needs no Node, and any change to the expected output shows up as a reviewable diff.',
  },
  stale: {
    q: 'What does `fixtures_match_the_programs_exactly` catch?',
    a: 'A program with no fixtures, or a fixture left over from a program that no longer exists.',
  },
  'agree-not-right': {
    q: 'Both engines produce the same bytes. What does that not prove?',
    a: 'That the output is correct: they could share a bug. The differential test runs the programs in node to check behaviour.',
  },
  'order-matters': {
    q: 'Why does the port use insertion-ordered maps (`IndexMap`) where the TS uses `Map`?',
    a: 'Iteration order decides the order of `explain` messages and edits. JS `Map` iterates in insertion order; a Rust `HashMap` doesn’t.',
  },
  'js-number': {
    q: 'Why does the port need `vir::js_number`?',
    a: 'Rust’s `{}` prints `1e21` as `1000000000000000000000`; JavaScript prints `1e+21`. Numbers in explain text and code must look like JavaScript’s.',
  },
  'found-bugs': {
    q: 'When the two engines disagree, which one is wrong?',
    a: 'Either, or both. The port turned up ten bugs in the TypeScript reference, including soundness bugs, and each was fixed in both engines.',
  },
  'wasm-too': {
    q: 'How is the WebAssembly build held to the same contract?',
    a: 'The same compile code runs in wasm; its output can be checked against the same fixtures (190 of 190 at the last check), and smoke.mjs compares the installed npm package with the TS CLI.',
  },
};

export const examples = {
  'numbers-play': {
    lang: 'rust',
    title: 'A tiny cross-implementation test',
    code: `fn main() {
    // JavaScript's String(x), captured
    // once from Node.
    let x3 = 0.1 + 0.2;
    let fixtures = [
        (x3, "0.30000000000000004"),
        (100.0, "100"),
        (1e21, "1e+21"),
        (1e-7, "1e-7"),
        (-0.0, "0"),
    ];
    let mut bad = 0;
    for (x, want) in fixtures {
        let got = format!("{}", x);
        if got != want {
            bad += 1;
            println!("{want} vs {got}");
        }
    }
    let n = fixtures.len();
    let ok = n - bad;
    println!("{ok} of {n} match");
}`,
  },
};

export const exercises = {
  firstDiff: {
    lang: 'rust',
    title: 'Where do they differ?',
    prompt:
      'A parity failure should say *where* the outputs differ. Write `first_difference(want, got)`: `None` if the texts are equal. Otherwise compare them line by line (`.lines()`) and, at the first differing line, return `line_msg(n, w, g)` with the 1-based line number. If every line they share is equal, the texts differ in length (a missing line, or only a final newline): return `"lengths: A vs B bytes"`.',
    starter: `${MSG}
fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    todo!()
}`,
    solution: `${MSG}
fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    if want == got {
        return None;
    }
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i + 1,
                w,
                g,
            ));
        }
    }
    Some(format!(
        "lengths: {} vs {} bytes",
        want.len(),
        got.len()
    ))
}`,
    tests: `#[test]
fn equal_texts_have_no_difference() {
    assert_eq!(first_difference("a\\nb", "a\\nb"), None);
}

#[test]
fn names_the_first_differing_line() {
    let want = "ps (line 3) {x}\\n  · aos\\n  · x";
    let got = "ps (line 3) {x}\\n  · soa\\n  · y";
    assert_eq!(
        first_difference(want, got).unwrap(),
        "line 2: \\"  · aos\\" vs \\"  · soa\\""
    );
}

#[test]
fn a_missing_last_line_is_a_length() {
    assert_eq!(
        first_difference("a\\nb\\nc", "a\\nb").unwrap(),
        "lengths: 5 vs 3 bytes"
    );
}

#[test]
fn a_final_newline_counts() {
    assert_eq!(
        first_difference("a\\n", "a").unwrap(),
        "lengths: 2 vs 1 bytes"
    );
}

#[test]
fn trailing_spaces_are_a_difference() {
    let d = first_difference("x = 1", "x = 1 ");
    assert_eq!(
        d.unwrap(),
        "line 1: \\"x = 1\\" vs \\"x = 1 \\""
    );
}`,
    hints: [
      'Start with `if want == got { return None; }`: everything after that knows the texts differ.',
      '`want.lines().zip(got.lines()).enumerate()` gives `(i, (w, g))`, stopping at the shorter text. The line number is `i + 1`.',
      'If the loop finishes, all shared lines were equal, so the difference is in length: format the two `.len()` values.',
    ],
    walkthrough: `This is \`first_difference\` from \`engine/rust/crates/cli/tests/parity.rs\`, returning an \`Option\` so it can also say “no difference”.

- **\`zip\`** stops at the shorter iterator, so a missing last line never shows up inside the loop. That is why the length message exists.
- **\`.lines()\`** drops the final newline, so \`"a\\n"\` and \`"a"\` have the same lines. Only the byte lengths tell them apart. A fixture that differs by one trailing newline is still a parity failure: the contract is byte for byte.
- **\`{:?}\`** in \`line_msg\` quotes the strings, so a trailing space, which would be invisible in \`{}\`, shows up as \`"x = 1 "\`.

The real test collects one such message per differing file and fails with all of them at once, like \`4 of 186 differ:\` followed by the list.`,
    wrong: [
      {
        code: `${MSG}
fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i + 1,
                w,
                g,
            ));
        }
    }
    None
}`,
        why: 'When every shared line is equal it returns `None`, so a missing line or a missing final newline passes as “equal”.',
      },
      {
        code: `${MSG}
fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    if want == got {
        return None;
    }
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i,
                w,
                g,
            ));
        }
    }
    Some(format!(
        "lengths: {} vs {} bytes",
        want.len(),
        got.len()
    ))
}`,
        why: '`enumerate` counts from 0, but line numbers (and editors) count from 1: the message points one line too early.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What exactly does `rust_output_equals_typescript_output` compare?',
    options: [
      { t: 'Whether both compiled programs print the same thing', why: 'That is the differential test.' },
      { t: 'The layout decision for each collection', why: 'Decisions are checked too, against corpus headers, but this test compares much more.' },
      { t: 'For every program and both bounds modes, the Rust engine’s code and explain text against the TS engine’s fixtures, byte for byte', correct: true, why: 'Two variants per program, two files per variant.' },
      { t: 'The VIR of both engines', why: 'VIR is internal; only the outputs are compared.' },
    ],
  },
  {
    q: 'Why are the fixtures generated by a Node script and committed, rather than produced by running the TS engine inside `cargo test`?',
    options: [
      { t: 'Cargo can’t run other programs', why: 'Cargo tests do run programs: the differential test runs `node`.' },
      { t: 'The Rust tests then don’t need Node, and every change to the expected output is a diff someone can review', correct: true, why: 'After the reference changes, you rerun `node scripts/gen_expected.mjs` and look at the diff.' },
      { t: 'The TS engine is too slow to run in tests', why: 'It compiles a program in under a millisecond once warm.' },
    ],
  },
  {
    q: 'One line was removed from the Rust builder (the `throw` case of trivial-phi removal). What did the tests report?',
    options: [
      { t: 'Nothing: the change was harmless', why: 'It changed a layout decision.' },
      { t: 'Only a compile error', why: 'It compiles fine; it is a logic change.' },
      { t: 'Parity failed on `corpus_throw_from_loop` (4 files), and the differential test showed the compiled program throwing a number', correct: true, why: 'The original printed `object 1`, the compiled one `number undefined`.' },
      { t: 'Every fixture failed', why: 'Only the one program with a `throw` inside a loop changed.' },
    ],
  },
  {
    q: 'Rust’s `format!("{}", 1e21)` gives `1000000000000000000000`. What does the port do about it?',
    options: [
      { t: 'Formats numbers with `vir::js_number`, which follows JavaScript’s Number-to-string algorithm', correct: true, why: 'Explain text and generated code interpolate numbers the way JS template literals do.' },
      { t: 'Avoids printing numbers', why: 'Sizes and block sizes appear in explain text and code.' },
      { t: 'Calls Node to format them', why: 'The port runs without Node, even in wasm.' },
    ],
  },
  {
    q: 'Why does the port keep the reference’s insertion-ordered maps, stable sorts and use lists with duplicates?',
    options: [
      { t: 'They are faster in Rust', why: 'Speed isn’t the reason; a `HashMap` would often be faster.' },
      { t: 'The Rust standard library has no other kinds', why: 'It has `HashMap`, `BTreeMap`, unstable sorts and more.' },
      { t: 'The order in which things are visited decides the order of explain messages and edits, so it must match exactly', correct: true, why: 'Same decisions in a different order would still fail byte-for-byte parity.' },
    ],
  },
  {
    q: 'The port disagreed with the TS engine on `def f(): global g; g = 1`. What happened next?',
    options: [
      { t: 'The port was changed to crash the same way', why: 'Parity isn’t bug-for-bug: crashes and miscompiles were fixed.' },
      { t: 'The TS engine had a bug (it crashed); it was fixed in both, and a corpus program now covers it', correct: true, why: 'Bug 8 in the README: such names now get a module binding (`global_undeclared.py`).' },
      { t: 'The program was removed from the corpus', why: 'The opposite: a program was added.' },
    ],
  },
];
