// Chapter 352 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'sc-what': {
    q: 'What is in `book/companion/corpus`?',
    a: '344 Drip programs in 25 folders (334 tests and 10 benchmarks), each saying in its comments what it should do.',
  },
  'sc-why': {
    q: 'Why check three implementations against one corpus instead of against each other’s code?',
    a: 'They share almost no code, but they must share behaviour; writing the behaviour down once lets each one be checked on its own.',
  },
  'sc-markers': {
    q: 'Name the four expectation markers.',
    a: '`# expect:`, `# expect compile error:`, `# expect runtime error:` and `# expect trace:`.',
  },
  'sc-trace-line': {
    q: 'Without any `# expect trace:` lines, which part of a runtime error’s trace is checked?',
    a: 'Only the innermost `at` line, which must name the line the runtime-error comment is on.',
  },
  'sc-harness': {
    q: 'Why do drip-rs’s two corpus suites set `harness = false`?',
    a: 'So they can bring their own `main` and print one line per program, like the TypeScript runner, instead of being one big test.',
  },
  'sc-stress': {
    q: 'What does `stress_gc: true` do, and what bug does it catch?',
    a: 'It collects before every allocation and never reuses a freed slot, so a value that is not reachable from a root is freed at once and the next use of it panics.',
  },
  'sc-mangle': {
    q: 'What does `compare_with_ts.mjs` do to a corpus program to “mangle” it?',
    a: 'Drops a token, replaces one with a random piece of Drip, or inserts one; then it compares drip-rs and the TypeScript VM on the result.',
  },
  'sc-clock': {
    q: 'Why did the comparison cover 343 programs and not all 344?',
    a: 'One program prints a value from `clock()`, which differs on every run, so it is skipped.',
  },
};

export const examples = {
  shared: {
    lang: 'drip-vm',
    title: 'A corpus program: lists are shared',
    code: `let a = [1, 2];
let b = a;
push(b, 3);
print a; # expect: [1, 2, 3]
fn fill(xs) {
  xs[0] = "changed";
}
fill(a);
print b[0]; # expect: changed`,
  },
};

const head = `#[derive(Debug, Default, PartialEq)]
struct Expect {
    output: Vec<String>,
    compile_errors: Vec<String>,
    // The message, and the line the
    // comment is on (from 1).
    runtime: Option<(String, usize)>,
    trace: Vec<String>,
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

fn parse(source: &str) -> Expect {`;

const body = `
    let mut e = Expect::default();
    let lines = source.split('\\n');
    for (i, line) in lines.enumerate() {
        if let Some(t) =
            after(line, "# expect:")
        {
            let t = t
                .strip_prefix(' ')
                .unwrap_or(t);
            let t = t.to_string();
            e.output.push(t);
        } else if let Some(m) = after(
            line,
            "# expect runtime error: ",
        ) {
            let m = m.to_string();
            let n = i + 1;
            e.runtime = Some((m, n));
            e.exit = 70;
        } else if let Some(t) = after(
            line,
            "# expect trace: ",
        ) {
            e.trace.push(t.to_string());
        } else if let Some(c) = after(
            line,
            "# expect compile error: ",
        ) {
            let c = c.to_string();
            e.compile_errors.push(c);
            e.exit = 65;
        }
    }
    e
}`;

export const exercises = {
  parseExpect: {
    lang: 'rust',
    title: 'Parse the expectation comments',
    prompt: `Write \`parse\`, which reads a corpus program's expectations, as drip-rs's \`parse_expectations\` does. For each source line, numbered from 1, use the first of these that matches:

1. \`# expect:\`: the rest of the line, minus **one** optional leading space, is a line of expected output.
2. \`# expect runtime error: \`: store the message and this line's number in \`runtime\`, and set \`exit\` to 70.
3. \`# expect trace: \`: the rest is one expected trace line.
4. \`# expect compile error: \`: the rest is one expected compile error; set \`exit\` to 65.

A program with none of these expects exit code 0. \`after(line, marker)\` returns the rest of a line after a marker.`,
    starter: `${head}
    todo!()
}`,
    solution: `${head}${body}`,
    tests: `#[test]
fn output_lines_in_order() {
    let e = parse(
        "print 1; # expect: 1\\n\\
         print 2; # expect: 2",
    );
    assert_eq!(e.output, ["1", "2"]);
    assert_eq!(e.exit, 0);
}

#[test]
fn only_one_space_is_dropped() {
    let e = parse("# expect:  x");
    assert_eq!(e.output, [" x"]);
    let e = parse("# expect:y");
    assert_eq!(e.output, ["y"]);
}

#[test]
fn a_runtime_error_and_its_line() {
    let e = parse(
        "let a = 1;\\n\\
         a(); # expect runtime error: \\
         cannot call a number",
    );
    let m = "cannot call a number";
    assert_eq!(
        e.runtime,
        Some((m.to_string(), 2))
    );
    assert_eq!(e.exit, 70);
}

#[test]
fn trace_lines() {
    let e = parse(
        "# expect trace: at line 1 in fn f\\n\\
         # expect trace: at line 2 in script",
    );
    assert_eq!(e.trace, [
        "at line 1 in fn f",
        "at line 2 in script",
    ]);
}

#[test]
fn compile_errors_set_65() {
    let e = parse(
        "x # expect compile error: \\
         line 1: oops",
    );
    assert_eq!(
        e.compile_errors,
        ["line 1: oops"]
    );
    assert_eq!(e.exit, 65);
    assert!(e.output.is_empty());
}`,
    hints: [
      'Loop with `for (i, line) in source.split(\'\\n\').enumerate()`; the line number is `i + 1`. Try the four markers in order with `if let Some(rest) = after(line, "...")` and `else if let`.',
      'For `# expect:`, drop at most one space: `rest.strip_prefix(\' \').unwrap_or(rest)`. `trim_start` would drop them all.',
      'A runtime error stores `Some((message.to_string(), i + 1))` and sets `exit = 70`; a compile error pushes its text and sets `exit = 65`; a trace line only pushes.',
    ],
    walkthrough: `**How to think about it.** Every expectation is a comment with a fixed marker, so the task is "for each line, find the first marker that appears, and take the rest of the line". There is no need for a regex: \`after\` (given) finds a marker with \`str::find\` and returns what follows it. The order of the checks matters only a little (no line has two markers), but checking \`# expect:\` first is how drip-rs does it, and note that \`"# expect:"\` is *not* a prefix of \`"# expect runtime error: "\`, because of the colon, so the first check never swallows the others.

**The solution, line by line.**

- \`let mut e = Expect::default();\` starts with nothing expected and exit code 0, thanks to \`#[derive(Default)]\`.
- \`for (i, line) in lines.enumerate()\` walks the source lines with their index; the line number is \`i + 1\`, because editors count from 1.
- \`if let Some(t) = after(line, "# expect:")\` finds an output expectation. \`t.strip_prefix(' ').unwrap_or(t)\` removes one space if there is one, so \`# expect:  x\` (two spaces) expects \` x\`, which matters for programs that print leading spaces. \`let t = t.to_string();\` and \`e.output.push(t);\` store an owned copy, because \`t\` borrows from \`source\`.
- \`else if let Some(m) = after(line, "# expect runtime error: ")\` records the message with this line's number and sets \`e.exit = 70\`.
- \`else if let Some(t) = after(line, "# expect trace: ")\` adds one trace line, without the two spaces the real trace has (the checker adds them when it compares).
- \`else if let Some(c) = after(line, "# expect compile error: ")\` adds one compile error and sets \`e.exit = 65\`.
- \`e\` at the end returns the expectations.

**Common wrong attempts.**

- \`t.trim_start()\` instead of \`strip_prefix(' ')\` drops every leading space, so an expected line that starts with a space can never match.
- Using \`i\` instead of \`i + 1\` for the runtime error's line is off by one: the checker would look for the error one line early.
- Forgetting to set \`exit\` makes a compile-error program look as if it should succeed.`,
    wrong: [
      {
        code: `${head}
    let mut e = Expect::default();
    let lines = source.split('\\n');
    for (i, line) in lines.enumerate() {
        if let Some(t) =
            after(line, "# expect:")
        {
            let t = t.trim_start();
            let t = t.to_string();
            e.output.push(t);
        } else if let Some(m) = after(
            line,
            "# expect runtime error: ",
        ) {
            let m = m.to_string();
            let n = i + 1;
            e.runtime = Some((m, n));
            e.exit = 70;
        } else if let Some(t) = after(
            line,
            "# expect trace: ",
        ) {
            e.trace.push(t.to_string());
        } else if let Some(c) = after(
            line,
            "# expect compile error: ",
        ) {
            let c = c.to_string();
            e.compile_errors.push(c);
            e.exit = 65;
        }
    }
    e
}`,
        why: '`trim_start` drops every leading space, so `# expect:  x` expects `x` instead of ` x`. Only one optional space belongs to the marker.',
      },
      {
        code: `${head}
    let mut e = Expect::default();
    let lines = source.split('\\n');
    for (i, line) in lines.enumerate() {
        if let Some(t) =
            after(line, "# expect:")
        {
            let t = t
                .strip_prefix(' ')
                .unwrap_or(t);
            let t = t.to_string();
            e.output.push(t);
        } else if let Some(m) = after(
            line,
            "# expect runtime error: ",
        ) {
            let m = m.to_string();
            e.runtime = Some((m, i));
            e.exit = 70;
        } else if let Some(t) = after(
            line,
            "# expect trace: ",
        ) {
            e.trace.push(t.to_string());
        } else if let Some(c) = after(
            line,
            "# expect compile error: ",
        ) {
            let c = c.to_string();
            e.compile_errors.push(c);
            e.exit = 65;
        }
    }
    e
}`,
        why: 'Stores the 0-based index as the line number, so every runtime error is expected one line too early.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A corpus program ends with `# expect compile error: line 2: ...`. What must an implementation do to pass it?',
    options: [
      { t: 'Report exactly the listed compile errors, in order, and exit with 65 without running anything', correct: true, why: 'Compile-error expectations are the exact list, and they imply exit code 65.' },
      { t: 'Report at least that error; extra ones are fine', why: 'The list is exact, which is how the corpus pins error recovery.' },
      { t: 'Print the error on stdout', why: 'Errors go to stderr; stdout must be empty.' },
    ],
  },
  {
    q: 'Why does `tests/corpus.rs` run programs with `debug_gc: true`?',
    options: [
      { t: 'To make the tests faster', why: 'It makes nothing faster; it only stops freed slots being reused.' },
      { t: 'So that a collector bug panics instead of quietly reading another object', correct: true, why: 'With slots never reused, a stale handle points at a freed slot and the read panics.' },
      { t: 'To print the bytecode of each program', why: 'That is `--disassemble`, a different thing.' },
    ],
  },
  {
    q: 'What does the stress-GC suite add over the plain corpus suite?',
    options: [
      { t: 'It runs the benchmarks', why: 'Neither suite runs the benchmarks; `scripts/bench.sh` does.' },
      { t: 'It compares drip-rs with the TypeScript VM', why: 'That is `compare_with_ts.mjs`.' },
      { t: 'A collection before every allocation, on the 165 programs that allocate most', correct: true, why: 'So a value missing from the roots is freed at the first chance.' },
    ],
  },
  {
    q: 'Both VMs passed the corpus. What extra does `compare_with_ts.mjs` check?',
    options: [
      { t: 'That their stdout, stderr and exit codes are identical byte for byte, including on 2,000 mangled programs', correct: true, why: 'It compares the two with each other, including on things no comment pins.' },
      { t: 'That they are equally fast', why: 'It compares output, not time.' },
      { t: 'That the corpus comments are correct', why: 'No program can check that; if both were wrong the same way, it would still say 0 differ.' },
    ],
  },
  {
    q: 'What can neither the corpus nor the comparison catch?',
    options: [
      { t: 'A wrong runtime-error message in drip-rs', why: 'The corpus pins messages exactly.' },
      { t: 'A mistake shared by every implementation and by the corpus’s comments', correct: true, why: 'Every check would agree with the mistake. People checking the corpus against DRIP.md are the defence.' },
      { t: 'A crash in the garbage collector', why: 'The stress-GC suite is built to find exactly that.' },
    ],
  },
];
