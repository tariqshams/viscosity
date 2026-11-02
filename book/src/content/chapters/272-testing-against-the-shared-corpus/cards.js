// Chapter 272 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'sc-what': {
    q: 'Which suites read `book/companion/corpus`, and where are the expected results kept?',
    a: 'The tree-walker’s, the TypeScript VM’s and drip-rs’s `tests/corpus.rs`. The expectations are comments inside each program.',
  },
  'sc-origin': {
    q: 'Where do the 265 corpus programs come from, and under what licence?',
    a: 'They are adapted from *Crafting Interpreters*’ test suite, MIT-licensed, Copyright (c) 2015 Robert Nystrom; the licence is in `LICENSE-craftinginterpreters`.',
  },
  'sc-forms': {
    q: 'Name the comment forms that carry expectations in the corpus.',
    a: '`// expect: …`, `// expect runtime error: …`, `// Error …`, `// [line N] Error …`, and `// [c line N]` / `// [java line N]` variants.',
  },
  'sc-lang': {
    q: 'Which of `// [c line N]` and `// [java line N]` apply to drip-rs, and why?',
    a: 'Only `c`: the VM is clox’s twin. `java` lines are for jlox, whose twin is the tree-walker.',
  },
  'sc-no-regex': {
    q: 'Why does `tests/common/mod.rs` match comments by hand instead of with regexes?',
    a: 'drip-rs uses only the standard library, which has no regex engine. Each pattern is a small function, with the regex in its doc comment.',
  },
  'sc-check': {
    q: 'When a runtime error is expected, what two things must stderr show?',
    a: 'The message as its first line, and the comment’s line number as the first `[line N]` of the trace.',
  },
  'sc-common': {
    q: 'How do `tests/corpus.rs` and `tests/stress_gc.rs` share their runner?',
    a: 'Both say `mod common;`, which loads `tests/common/mod.rs`. Each file in `tests/` is its own crate.',
  },
  'sc-harness': {
    q: 'What does `harness = false` require of `tests/corpus.rs`, and what does drip-rs get for it?',
    a: 'The file must define its own `main`. In return it prints one line per program and filters by substring arguments.',
  },
  'sc-panic': {
    q: 'What happens to the corpus suite when one program panics the VM?',
    a: 'It is reported as FAILED (“panicked: …”) and the rest still run, because the hand-written runner wraps each program in `catch_unwind`; without that, one panic would end the whole run.',
  },
  'sc-skip': {
    q: 'Which folders does the VM suite skip, and how many programs are left?',
    a: '`scanning`, `expressions` and `benchmark`, leaving 246 of 265.',
  },
  'sc-stress': {
    q: 'What does the stress-GC suite run, and how?',
    a: 'The 95 programs in eight heap-heavy folders, with a collection before every allocation and no slot reuse.',
  },
  'sc-diff': {
    q: 'What did a diff of all 265 programs between drip-rs and the TypeScript VM find?',
    a: 'stderr and exit codes identical for all 265, stdout for 255. The ten others are benchmarks whose differing lines come from `clock()`.',
  },
};

export const examples = {};

const types = `#[derive(Debug, Default, PartialEq)]
struct Expect {
    output: Vec<String>,
    errors: Vec<String>,
    runtime: Option<(String, usize)>,
    exit: i32,
}

// The rest of \`line\` after the first
// \`marker\`, if it has one.
fn after<'a>(
    line: &'a str,
    marker: &str,
) -> Option<&'a str> {
    let i = line.find(marker)?;
    Some(&line[i + marker.len()..])
}
`;

const atLineSig = `
// \`// [line N] Error...\`, maybe with
// \`c \` or \`java \` before \`line\`. The
// line number and the error, if the
// expectation applies to \`lang\`.
fn at_line<'a>(
    line: &'a str,
    lang: &str,
) -> Option<(usize, &'a str)> {`;

const atLineBody = `
    let mut r = after(line, "// [")?;
    let (w, x) = r.split_once(' ')?;
    if w == "c" || w == "java" {
        if w != lang {
            return None;
        }
        r = x;
    }
    let r = r.strip_prefix("line ")?;
    let (n, err) = r.split_once("] ")?;
    if !err.starts_with("Error") {
        return None;
    }
    Some((n.parse().ok()?, err))
}
`;

const parseSig = `
// Read a test's expectations from its
// comments. \`lang\` is "c" or "java".
fn parse(
    src: &str,
    lang: &str,
) -> Expect {`;

const parseBody = `
    let mut e = Expect::default();
    let lines = src.lines().enumerate();
    for (i, line) in lines {
        let n = i + 1;
        if let Some(t) =
            after(line, "// expect:")
        {
            let t = t
                .strip_prefix(' ')
                .unwrap_or(t);
            let t = t.to_string();
            e.output.push(t);
        } else if let Some(t) =
            after(line, "// Error")
        {
            e.errors.push(format!(
                "[line {n}] Error{t}"));
            e.exit = 65;
        } else if let Some((l, m)) =
            at_line(line, lang)
        {
            e.errors.push(format!(
                "[line {l}] {m}"));
            e.exit = 65;
        } else if let Some(m) = after(
            line,
            "// expect runtime error: ",
        ) {
            let m = m.to_string();
            e.runtime = Some((m, n));
            e.exit = 70;
        }
    }
    e
}`;

const parseTests = `fn s(xs: &[&str]) -> Vec<String> {
    xs.iter().map(|x| x.to_string()).collect()
}

#[test]
fn collects_expected_output() {
    let src = "print 1; // expect: 1\\n\\
        print \\"a\\"; // expect: a";
    let e = parse(src, "c");
    assert_eq!(e.output, s(&["1", "a"]));
    assert_eq!(e.exit, 0);
    assert_eq!(e.runtime, None);
}

#[test]
fn drops_only_one_space() {
    let src = "// expect:  x\\n// expect:y";
    let e = parse(src, "c");
    assert_eq!(e.output, s(&[" x", "y"]));
}

#[test]
fn a_compile_error_uses_its_own_line() {
    let src = "\\nlet = 1; // Error at '=': \\
        Expect variable name.";
    let e = parse(src, "c");
    assert_eq!(e.errors, s(&["[line 2] Error \\
        at '=': Expect variable name."]));
    assert_eq!(e.exit, 65);
}

#[test]
fn bracketed_line_numbers_by_language() {
    let src = "// [line 3] Error: Bad.\\n\\
        // [java line 3] Error at 'b': J.\\n\\
        // [c line 4] Error at end: C.";
    let c = parse(src, "c");
    assert_eq!(c.errors, s(&[
        "[line 3] Error: Bad.",
        "[line 4] Error at end: C.",
    ]));
    let j = parse(src, "java");
    assert_eq!(j.errors, s(&[
        "[line 3] Error: Bad.",
        "[line 3] Error at 'b': J.",
    ]));
    assert_eq!(c.exit, 65);
}

#[test]
fn a_runtime_error_records_its_line() {
    let src = "print 1; // expect: 1\\n\\
        nil(); // expect runtime error: \\
        Can only call functions and classes.";
    let e = parse(src, "c");
    let m = "Can only call functions and \\
        classes.";
    assert_eq!(e.runtime,
        Some((m.to_string(), 2)));
    assert_eq!(e.output, s(&["1"]));
    assert_eq!(e.exit, 70);
}`;

const atLineTests = `#[test]
fn a_plain_bracket_applies_to_both() {
    let l = "// [line 3] Error: Bad.";
    assert_eq!(at_line(l, "c"),
        Some((3, "Error: Bad.")));
    assert_eq!(at_line(l, "java"),
        Some((3, "Error: Bad.")));
}

#[test]
fn a_language_bracket_applies_to_one() {
    let l = "// [c line 12] Error at end: X.";
    assert_eq!(at_line(l, "c"),
        Some((12, "Error at end: X.")));
    assert_eq!(at_line(l, "java"), None);
}

#[test]
fn other_comments_are_not_expectations() {
    assert_eq!(at_line("x; // [note]", "c"),
        None);
    assert_eq!(
        at_line("// [line 2] Warning", "c"),
        None);
    assert_eq!(
        at_line("// [line x] Error", "c"),
        None);
    assert_eq!(at_line("print 1;", "c"),
        None);
}`;

const skipSig = `// The VM's skip list: folders, or
// single files without ".drip".
const SKIP_VM: &[&str] = &[
    "scanning",
    "expressions",
    "benchmark",
];

// Skip \`test\` ("for/x.drip", say) if
// it is \`p.drip\` or is inside \`p/\`
// for some \`p\` in \`skip\`.
fn should_skip(
    test: &str,
    skip: &[&str],
) -> bool {`;

export const exercises = {
  parseExpect: {
    lang: 'rust',
    title: 'Parse the expectation comments',
    prompt: `Write \`parse\`, which reads a corpus program's expectations, as drip-rs's \`parse_expectations\` does. For each source line, numbered from 1, check in this order and use the first that matches:

1. \`// expect:\`: the rest of the line, minus **one** optional leading space, is a line of expected output.
2. \`// Error\`: an expected compile error on **this** line: push \`"[line N] Error..."\` and set \`exit\` to 65.
3. \`at_line(line, lang)\` (given): a bracketed error for another line, if it applies to \`lang\`: push \`"[line N] Error..."\`, exit 65.
4. \`// expect runtime error: \`: store the message and this line's number, exit 70.

\`after(line, marker)\` (given) returns the rest of a line after a marker.`,
    starter: `${types}${atLineSig}${atLineBody}${parseSig}
    todo!()
}`,
    solution: `${types}${atLineSig}${atLineBody}${parseSig}${parseBody}`,
    tests: parseTests,
    hints: [
      'Loop with `for (i, line) in src.lines().enumerate()`, and remember the line number is `i + 1`.',
      'For output: `if let Some(t) = after(line, "// expect:")`, then `t.strip_prefix(\' \').unwrap_or(t)`, which drops at most one space.',
      'Use one `if let ... else if let ...` chain in the order given, setting `e.exit` to 65 for both error forms and 70 for the runtime error.',
    ],
    walkthrough: `**One chain, in order.** Each line can be at most one kind of expectation, so an \`if let ... else if let\` chain says exactly that. The order matches drip-rs and the TypeScript runner.

**One optional space.** The regex in the TypeScript runner is \`// expect: ?(.*)\`, so \`// expect:  x\` expects \` x\`, with a space. \`strip_prefix(' ').unwrap_or(t)\` removes one space if there is one; \`trim_start\` would remove them all and break tests that print leading spaces.

**Whose line?** \`// Error\` describes the line it is on, so the number is \`i + 1\`. A bracketed one names its own line, because some errors are reported on a line where a comment can't go, like the end of the file. \`at_line\` returns that number.

**The exit code follows the expectation.** A test with no error comments must exit with 0, one with a compile error with 65, and one with a runtime error with 70. drip-rs checks the code separately from the messages.`,
    wrong: [
      {
        code: `${types}${atLineSig}${atLineBody}${parseSig}${parseBody.replace(`            let t = t
                .strip_prefix(' ')
                .unwrap_or(t);`, `            let t = t.trim_start();`)}`,
        why: 'Trims every leading space, so `// expect:  x` expects `x` instead of ` x`. The pattern allows exactly one optional space.',
      },
      {
        code: `${types}${atLineSig}${atLineBody}${parseSig}${parseBody.replace('let n = i + 1;', 'let n = i;')}`,
        why: '`enumerate` counts from 0, but source lines are numbered from 1. Every `// Error` and runtime-error line comes out one too low.',
      },
      {
        code: `${types}${atLineSig}${atLineBody}${parseSig}${parseBody.replace(/\n            e\.exit = \d+;/g, '')}`,
        why: 'Never sets the exit code, so every test would expect 0. A program that fails to compile would pass as long as it printed the right errors.',
      },
    ],
  },
  atLine: {
    lang: 'rust',
    optional: true,
    title: 'Bracketed error expectations',
    prompt: `Write \`at_line\`. A line such as \`// [line 3] Error: Bad.\` expects \`Error: Bad.\` on line 3, for every implementation. \`// [c line 4] ...\` and \`// [java line 4] ...\` apply only when \`lang\` is \`"c"\` or \`"java"\`. Return \`Some((line, error))\` when the expectation applies, and \`None\` otherwise, including when the text after \`] \` doesn't start with \`Error\`.

\`split_once\` and \`strip_prefix\` with \`?\` keep it short.`,
    starter: `${types}${atLineSig}
    todo!()
}`,
    solution: `${types}${atLineSig}${atLineBody}`,
    tests: atLineTests,
    hints: [
      'Start with `let mut r = after(line, "// [")?;`.',
      'Split off the first word with `r.split_once(\' \')?`. If it is `"c"` or `"java"`, return `None` unless it equals `lang`, and continue with the rest.',
      'Then `strip_prefix("line ")?`, `split_once("] ")?`, check `starts_with("Error")`, and parse the number with `.parse().ok()?`.',
    ],
    walkthrough: `**Every step can fail, so every step ends in \`?\`.** No \`// [\`, no space, no \`line \`, no \`] \`, a number that won't parse: each means "not an expectation", which is \`None\`. \`?\` on an \`Option\` returns \`None\` early, so the happy path reads straight down.

**The language word is optional.** \`split_once(' ')\` gives \`("c", "line 4] ...")\` or \`("line", "3] ...")\`. Only in the first case is there a word to compare with \`lang\`, and to skip.

**Check the \`Error\`.** drip-rs's version requires it too, so a stray \`// [line 2] Warning\` isn't mistaken for a compile error.`,
    wrong: [
      {
        code: `${types}${atLineSig}
    let mut r = after(line, "// [")?;
    let (w, x) = r.split_once(' ')?;
    if w == "c" || w == "java" {
        r = x;
    }
    let r = r.strip_prefix("line ")?;
    let (n, err) = r.split_once("] ")?;
    if !err.starts_with("Error") {
        return None;
    }
    Some((n.parse().ok()?, err))
}`,
        why: 'Skips the language word without checking it, so a `[java line N]` expectation would be applied to the VM too.',
      },
    ],
  },
  shouldSkip: {
    lang: 'rust',
    optional: true,
    title: 'The skip list',
    prompt: `Write \`should_skip\`. A test path is skipped when, for some entry \`p\` in \`skip\`, it is exactly \`p.drip\` or it starts with \`p/\`. Watch out for names that merely start with an entry.`,
    starter: `${skipSig}
    todo!()
}`,
    solution: `${skipSig}
    skip.iter().any(|p| {
        test == format!("{p}.drip")
            || test.starts_with(
                &format!("{p}/"))
    })
}`,
    tests: `#[test]
fn skips_whole_folders() {
    assert!(should_skip(
        "benchmark/fib.drip", SKIP_VM));
    assert!(!should_skip(
        "for/syntax.drip", SKIP_VM));
}

#[test]
fn skips_single_files() {
    let skip = ["limit/stack_overflow"];
    assert!(should_skip(
        "limit/stack_overflow.drip", &skip));
    assert!(!should_skip(
        "limit/too_many_locals.drip", &skip));
}

#[test]
fn a_prefix_is_not_enough() {
    let skip = ["for"];
    assert!(!should_skip(
        "format/x.drip", &skip));
    assert!(should_skip("for/x.drip", &skip));
    assert!(!should_skip("for.drip.bak",
        &skip));
}`,
    hints: [
      '`skip.iter().any(|p| ...)` is true if any entry matches.',
      'Compare `test == format!("{p}.drip")`, or check `test.starts_with(&format!("{p}/"))`.',
    ],
    walkthrough: `**The slash matters.** \`starts_with(p)\` alone would skip \`format/x.drip\` for the entry \`for\`. Adding the \`/\` makes the entry a whole folder name. The \`.drip\` form lets the list name one file, as the tree-walker's list names six \`limit/\` programs.

**Same rule in both runners.** drip-rs's \`should_skip\` is this, and so is TypeScript's \`shouldSkip\`, so a skip list means the same thing in each language.`,
    wrong: [
      {
        code: `${skipSig}
    skip.iter()
        .any(|p| test.starts_with(p))
}`,
        why: 'A bare prefix: `for` skips `format/x.drip`, and `limit/stack_overflow` would skip a file named `limit/stack_overflow_2.drip`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A corpus line reads `// [java line 3] Error at \'b\': Expect \')\' after arguments.` What does drip-rs’s suite do with it?',
    options: [
      { t: 'Expects that error on line 3', why: 'Only for `java`, the tree-walker’s twin. drip-rs passes `"c"`.' },
      { t: 'Ignores it', correct: true, why: 'The VM is clox’s twin, so only unlabelled and `c` expectations apply.' },
      { t: 'Fails the test, because the comment is malformed', why: 'It is well formed; it just isn’t for the VM.' },
      { t: 'Expects it on line 4, the line after the comment', why: 'Bracketed expectations name their own line.' },
    ],
  },
  {
    q: 'A program’s expected runtime error is on line 10, and its trace is `[line 10] in foo()`, `[line 14] in script`. Which line number does `check` compare?',
    options: [
      { t: 'The last one, 14', why: 'The outermost frame isn’t where the error happened.' },
      { t: 'Every line in the trace', why: 'Only one is compared.' },
      { t: 'The first `[line N]` in the trace, 10', correct: true, why: 'The innermost frame, which is where the comment sits.' },
      { t: 'None: only the message is compared', why: 'The line is compared as well as the message.' },
    ],
  },
  {
    q: 'Why does drip-rs’s `Cargo.toml` say `harness = false` for the corpus suites?',
    options: [
      { t: 'libtest can’t run integration tests', why: 'It runs them by default; `tests/vm.rs` uses it.' },
      { t: 'To run the programs in parallel', why: 'The hand-written `main` runs them one after another.' },
      { t: 'Because the suite needs nightly Rust', why: 'Everything here is stable Rust 1.97.' },
      { t: 'So the file’s own `main` can print one line per program and filter by substring', correct: true, why: 'With libtest, the whole corpus would be one `#[test]`.' },
    ],
  },
  {
    q: 'One corpus program makes drip-rs panic. What does the corpus suite report?',
    options: [
      { t: 'That program as FAILED with the panic message, then the rest as usual', correct: true, why: 'The runner wraps each program in `catch_unwind`, as libtest would. The first version didn’t, and stopped after eight `ok`s.' },
      { t: 'The `ok` lines so far, then the panic, and nothing for the remaining programs', why: 'That was the first version of the runner, before it caught panics with `catch_unwind`.' },
      { t: 'Nothing at all', why: 'Lines are printed as each program finishes.' },
      { t: 'It retries the program without `debug_gc`', why: 'There is no retry.' },
    ],
  },
  {
    q: 'How many corpus programs does drip-rs’s VM suite run, and why not all 265?',
    options: [
      { t: '246: it skips `scanning`, `expressions` and `benchmark`', correct: true, why: 'Early-chapter tests that aren’t whole programs, and the slow benchmarks: 6 + 2 + 11 = 19.' },
      { t: '265: the VM runs everything', why: 'The skip list is the same as the TypeScript VM’s `SKIP.vm`.' },
      { t: '95: only the heap-heavy folders', why: 'That is the stress-GC suite.' },
      { t: '240: it also skips six `limit/` programs', why: 'That is the tree-walker’s list; the VM has clox’s limits and runs those tests.' },
    ],
  },
  {
    q: 'Running all 265 programs through both VMs and comparing with `cmp`, stdout differed for ten. Why?',
    options: [
      { t: 'Number formatting differs between Rust and JavaScript', why: '`value.rs` reproduces JavaScript’s format; the other 255 match.' },
      { t: 'String hashes differ', why: 'Nothing printed depends on a hash.' },
      { t: 'They are benchmarks, and the differing lines come from `clock()`', correct: true, why: 'Elapsed times, or in `zoo_batch` the work done in ten seconds. Every other line matched.' },
      { t: 'drip-rs has bugs the corpus doesn’t catch', why: 'stderr and exit codes matched for all 265, and every non-clock line matched.' },
    ],
  },
];
