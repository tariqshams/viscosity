// Chapter 78 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 146, 146.

export const prompts = {
  'de-two-paths': {
    q: 'Where do drip-rs’s compile errors and runtime errors go, and with which exit codes?',
    a: 'Compile errors are pushed as `String`s into two `Vec`s and compiling carries on: exit 65. A runtime error writes its message and trace into the VM’s stderr lines and stops the program: exit 70.',
  },
  'de-stale': {
    q: 'Why does drip-rs’s `runtime_error` use `self.ip` for the innermost frame instead of that frame’s `ip` field?',
    a: 'The running frame’s ip lives in the `self.ip` register and is written back only when the frame makes a call, so the innermost frame’s own copy is stale.',
  },
  'de-unit': {
    q: 'Why does drip-rs’s `RuntimeError` carry no data?',
    a: 'By the time one exists, the message and stack trace are already in `self.stderr`, so there is nothing left to carry.',
  },
  'de-static': {
    q: 'A program has a syntax error on line 5 and a `break` outside a loop on line 3. What does drip-rs report?',
    a: 'Only the syntax error: static errors are reported only when there are no syntax errors.',
  },
  'sc-why': {
    q: 'Why check several implementations of one language against a shared corpus of programs, instead of against each other’s code?',
    a: 'They share almost no code, but they must share behaviour; writing the behaviour down once lets each one be checked on its own.',
  },
  'sc-markers': {
    q: 'Name the four expectation markers a Drip corpus program can use in its comments.',
    a: '`# expect:`, `# expect compile error:`, `# expect runtime error:` and `# expect trace:`.',
  },
  'sc-stress': {
    q: 'What does drip-rs’s `stress_gc: true` option do, and what bug does it catch?',
    a: 'It collects before every allocation and never reuses a freed slot, so a value that is not reachable from a root is freed at once and the next use of it panics.',
  },
  'sc-mangle': {
    q: 'What does drip-rs’s `compare_with_ts.mjs` do to a corpus program to “mangle” it, and what does it then compare?',
    a: 'Drops a token, replaces one with a random piece of Drip, or inserts one; then it compares drip-rs and the TypeScript VM on the result.',
  },
};

export const examples = {
  anon: {
    lang: 'drip-vm',
    title: 'A trace through an anonymous function',
    code: `let apply = fn (f, x) {
  return f(x);
};
fn half(n) { return n / 2; }
print apply(half, 8);
# Remove the # below to see a trace:
# print apply(half, "8");`,
  },
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

export const exercises = {
  trace: {
    optional: true,
    lang: 'rust',
    title: 'A stack trace',
    prompt: `Write \`runtime_error\` for this small VM, which keeps the running frame's ip in a register as drip-rs does.

1. Push \`runtime error: <m>\` onto \`stderr\`.
2. Then, for every frame from the innermost (the last in \`frames\`) to the outermost, push \`  at line N in <place>\` (two spaces first).
3. \`N\` is \`lines[ip - 1]\`, where \`ip\` is the register \`self.ip\` for the innermost frame and the frame's own \`ip\` for every other frame.
4. \`<place>\` is \`fn <name>\` for a named function, \`script\` for the script, and \`anonymous fn\` otherwise; the helper \`place(f)\` already works it out.

There is always at least one frame.`,
    starter: `struct Frame {
    // None for the script and for
    // anonymous functions.
    name: Option<&'static str>,
    is_script: bool,
    // The saved ip: only right for
    // frames that have made a call.
    ip: usize,
    // The source line of each byte.
    lines: Vec<usize>,
}

struct Vm {
    frames: Vec<Frame>,
    // The running frame's ip.
    ip: usize,
    stderr: Vec<String>,
}

const RE: &str = "runtime error: ";

// "fn go", "script" or "anonymous fn".
fn place(f: &Frame) -> String {
    match f.name {
        Some(n) => format!("fn {n}"),
        None if f.is_script => {
            "script".to_string()
        }
        None => "anonymous fn".into(),
    }
}

impl Vm {
    // Push the message, then one
    // "  at line N in place" line per
    // frame, innermost first.
    fn runtime_error(
        &mut self,
        m: &str,
    ) {
        todo!()
    }
}`,
    solution: `struct Frame {
    // None for the script and for
    // anonymous functions.
    name: Option<&'static str>,
    is_script: bool,
    // The saved ip: only right for
    // frames that have made a call.
    ip: usize,
    // The source line of each byte.
    lines: Vec<usize>,
}

struct Vm {
    frames: Vec<Frame>,
    // The running frame's ip.
    ip: usize,
    stderr: Vec<String>,
}

const RE: &str = "runtime error: ";

// "fn go", "script" or "anonymous fn".
fn place(f: &Frame) -> String {
    match f.name {
        Some(n) => format!("fn {n}"),
        None if f.is_script => {
            "script".to_string()
        }
        None => "anonymous fn".into(),
    }
}

impl Vm {
    // Push the message, then one
    // "  at line N in place" line per
    // frame, innermost first.
    fn runtime_error(
        &mut self,
        m: &str,
    ) {
        let first = format!("{RE}{m}");
        self.stderr.push(first);
        let top = self.frames.len() - 1;
        let fs = self.frames.iter();
        let fs = fs.enumerate().rev();
        for (d, f) in fs {
            let ip = if d == top {
                self.ip
            } else {
                f.ip
            };
            let line = f.lines[ip - 1];
            let p = place(f);
            let l = line;
            let at = format!(
                "  at line {l} in {p}"
            );
            self.stderr.push(at);
        }
    }
}`,
    tests: `fn f(
    name: Option<&'static str>,
    script: bool,
    ip: usize,
    lines: &[usize],
) -> Frame {
    Frame {
        name,
        is_script: script,
        ip,
        lines: lines.to_vec(),
    }
}

// script calls go (at byte 1, line 8),
// go calls an anonymous fn (byte 2,
// line 6); it fails at byte 0, line 3.
// Its own saved ip is a stale 0.
fn vm() -> Vm {
    Vm {
        frames: vec![
            f(None, true, 2, &[7, 8]),
            f(Some("go"), false, 3,
              &[5, 5, 6]),
            f(None, false, 0, &[3, 3]),
        ],
        ip: 1,
        stderr: vec![],
    }
}

#[test]
fn the_message_comes_first() {
    let mut v = vm();
    v.runtime_error("stack overflow");
    assert_eq!(v.stderr[0],
        "runtime error: stack overflow");
}

#[test]
fn innermost_first_with_the_register() {
    let mut v = vm();
    v.runtime_error("x");
    assert_eq!(v.stderr[1..], [
        "  at line 3 in anonymous fn",
        "  at line 6 in fn go",
        "  at line 8 in script",
    ]);
}

#[test]
fn a_script_alone_uses_the_register() {
    let mut v = Vm {
        frames: vec![
            f(None, true, 0, &[1, 2, 2])],
        ip: 3,
        stderr: vec![],
    };
    v.runtime_error("y");
    assert_eq!(v.stderr, [
        "runtime error: y",
        "  at line 2 in script",
    ]);
}`,
    hints: [
      'Push the message first, then loop. `self.frames.iter().enumerate().rev()` gives `(index, frame)` pairs from the innermost out.',
      'The innermost frame is the one whose index is `self.frames.len() - 1`; for it use `self.ip`, for the rest `frame.ip`. The line is `lines[ip - 1]`, because ip is already past the instruction.',
      'The loop body is four lines: choose `ip` with `if d == top { self.ip } else { f.ip }`, take `f.lines[ip - 1]`, call `place(f)`, and push `format!("  at line {l} in {p}")`.',
    ],
    walkthrough: `**How to think about it.** A trace is "the message, then where each running call is", innermost first. The only real decision is which \`ip\` to trust. Every frame saves its \`ip\` when it makes a call, so for every frame *except the innermost* the saved \`ip\` points just past the call it is waiting on. The innermost frame has made no call since it started, so its field still holds whatever it held when the frame was pushed (here a stale 0); the live value is in the register \`self.ip\`. So the plan is: loop from the innermost out, and use the register for exactly one frame.

**The solution, line by line.**

- \`let first = format!("{RE}{m}");\` and \`self.stderr.push(first);\` put the message first, in Drip's format (\`RE\` is the \`"runtime error: "\` prefix).
- \`let top = self.frames.len() - 1;\` is the index of the innermost frame. (drip-rs uses \`saturating_sub(1)\`, which gives 0 instead of overflowing if there were no frames; the exercise promises at least one.)
- \`let fs = self.frames.iter();\` and \`let fs = fs.enumerate().rev();\` pair each frame with its index and walk them from the last (innermost) to the first (the script); \`for (d, f) in fs\` takes them one at a time.
- \`let ip = if d == top { self.ip } else { f.ip };\` is the key line: the register for the innermost frame, the saved value for the rest.
- \`let line = f.lines[ip - 1];\` finds the line of the byte *before* \`ip\`, because \`ip\` is always the index of the next byte to run.
- \`let p = place(f);\` names the place with the helper's \`match\`: a name gives \`fn go\`; no name and \`is_script\` gives \`script\` (the guard \`if f.is_script\` is checked only when the pattern \`None\` matches); any other \`None\` is \`anonymous fn\`.
- \`let l = line;\`, the \`format!\` and \`self.stderr.push(at);\` write one line (the short name \`l\` only keeps the line short). Pushing to \`self.stderr\` while \`self.frames\` is borrowed by the loop is fine: they are different fields.

**Common wrong attempts.**

- Using \`f.ip\` for every frame reads the stale 0 for the innermost frame, and \`0 - 1\` on a \`usize\` panics with "attempt to subtract with overflow" (the same crash a scratch copy of drip-rs had).
- Using \`lines[ip]\` instead of \`lines[ip - 1]\` names the line of the *next* instruction, which is usually right but wrong whenever the failing instruction is the last on its line.
- Looping without \`.rev()\` prints the script first, the opposite of Drip's order.`,
    wrong: [
      {
        code: `struct Frame {
    // None for the script and for
    // anonymous functions.
    name: Option<&'static str>,
    is_script: bool,
    // The saved ip: only right for
    // frames that have made a call.
    ip: usize,
    // The source line of each byte.
    lines: Vec<usize>,
}

struct Vm {
    frames: Vec<Frame>,
    // The running frame's ip.
    ip: usize,
    stderr: Vec<String>,
}

const RE: &str = "runtime error: ";

// "fn go", "script" or "anonymous fn".
fn place(f: &Frame) -> String {
    match f.name {
        Some(n) => format!("fn {n}"),
        None if f.is_script => {
            "script".to_string()
        }
        None => "anonymous fn".into(),
    }
}

impl Vm {
    // Push the message, then one
    // "  at line N in place" line per
    // frame, innermost first.
    fn runtime_error(
        &mut self,
        m: &str,
    ) {
        let first = format!("{RE}{m}");
        self.stderr.push(first);
        let fs = self.frames.iter();
        for f in fs.rev() {
            let ip = f.ip;
            let line = f.lines[ip - 1];
            let p = place(f);
            let l = line;
            let at = format!(
                "  at line {l} in {p}"
            );
            self.stderr.push(at);
        }
    }
}`,
        why: 'Uses the saved `ip` for the innermost frame too. That copy is stale (0 here), so `ip - 1` overflows and the test panics.',
      },
      {
        code: `struct Frame {
    // None for the script and for
    // anonymous functions.
    name: Option<&'static str>,
    is_script: bool,
    // The saved ip: only right for
    // frames that have made a call.
    ip: usize,
    // The source line of each byte.
    lines: Vec<usize>,
}

struct Vm {
    frames: Vec<Frame>,
    // The running frame's ip.
    ip: usize,
    stderr: Vec<String>,
}

const RE: &str = "runtime error: ";

// "fn go", "script" or "anonymous fn".
fn place(f: &Frame) -> String {
    match f.name {
        Some(n) => format!("fn {n}"),
        None if f.is_script => {
            "script".to_string()
        }
        None => "anonymous fn".into(),
    }
}

impl Vm {
    // Push the message, then one
    // "  at line N in place" line per
    // frame, innermost first.
    fn runtime_error(
        &mut self,
        m: &str,
    ) {
        let first = format!("{RE}{m}");
        self.stderr.push(first);
        let top = self.frames.len() - 1;
        let fs = self.frames.iter();
        for (d, f) in fs.enumerate() {
            let ip = if d == top {
                self.ip
            } else {
                f.ip
            };
            let line = f.lines[ip - 1];
            let p = place(f);
            let l = line;
            let at = format!(
                "  at line {l} in {p}"
            );
            self.stderr.push(at);
        }
    }
}`,
        why: 'The lines are right but in the wrong order: without `.rev()` the script comes first, and a Drip trace is innermost first.',
      },
    ],
  },
  parseExpect: {
    lang: 'rust',
    title: 'Parse the expectation comments',
    prompt: `Write \`parse\`, which reads a corpus program's expectations, as drip-rs's \`parse_expectations\` does. For each source line, numbered from 1, use the first of these that matches:

1. \`# expect:\`: the rest of the line, minus **one** optional leading space, is a line of expected output.
2. \`# expect runtime error: \`: store the message and this line's number in \`runtime\`, and set \`exit\` to 70.
3. \`# expect trace: \`: the rest is one expected trace line.
4. \`# expect compile error: \`: the rest is one expected compile error; set \`exit\` to 65.

A program with none of these expects exit code 0. \`after(line, marker)\` returns the rest of a line after a marker.`,
    starter: `#[derive(Debug, Default, PartialEq)]
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

fn parse(source: &str) -> Expect {
    todo!()
}`,
    solution: `#[derive(Debug, Default, PartialEq)]
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

fn parse(source: &str) -> Expect {
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
}`,
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
        code: `#[derive(Debug, Default, PartialEq)]
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

fn parse(source: &str) -> Expect {
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
        code: `#[derive(Debug, Default, PartialEq)]
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

fn parse(source: &str) -> Expect {
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
    q: 'In drip-rs, method `bake` (defined on line 2) calls `self.heat(n)` on line 2, and `heat` fails. Why does the trace line for `bake` say `at line 2 in fn bake`?',
    options: [
      {
        t: 'Line 2 is where `bake` is defined',
        why: 'It happens to be, but the trace reports the line of the instruction the frame is on: the call to `heat`, which is also on line 2.',
      },
      {
        t: '`bake`’s saved ip points just past its call to `heat`, and that byte is on line 2',
        correct: true,
        why: '`lines[ip - 1]` for a frame that is waiting on a call is the line of the call.',
      },
      {
        t: 'The VM records the line of every call in a separate list',
        why: 'There is no such list; the line comes from the saved ip and the chunk’s `lines` array.',
      },
    ],
  },
  {
    q: 'A program has a missing `;` on line 9 and `return` outside a function on line 2. What does drip-rs print?',
    options: [
      {
        t: 'Both errors, in source order',
        why: 'Static errors are only reported when there are no syntax errors.',
      },
      {
        t: 'Only the line 9 syntax error, and it exits with 65',
        correct: true,
        why: 'Syntax errors win; fixing it would reveal the line 2 error on the next run.',
      },
      {
        t: 'Only the line 2 error, because it comes first',
        why: 'It comes first in the file, but it is a static error, hidden by the syntax error.',
      },
    ],
  },
  {
    q: 'A corpus program ends with `# expect compile error: line 2: ...`. What must an implementation do to pass it?',
    options: [
      {
        t: 'Report exactly the listed compile errors, in order, and exit with 65 without running anything',
        correct: true,
        why: 'Compile-error expectations are the exact list, and they imply exit code 65.',
      },
      {
        t: 'Report at least that error; extra ones are fine',
        why: 'The list is exact, which is how the corpus pins error recovery.',
      },
      {
        t: 'Print the error on stdout',
        why: 'Errors go to stderr; stdout must be empty.',
      },
    ],
  },
  {
    q: 'Several implementations of a language all pass one shared corpus, and a differential comparison finds no differences between them on many mangled programs. What can neither check catch?',
    options: [
      {
        t: 'A wrong runtime-error message in drip-rs',
        why: 'The corpus pins messages exactly.',
      },
      {
        t: 'A mistake shared by every implementation and by the corpus’s comments',
        correct: true,
        why: 'Every check would agree with the mistake. People checking the corpus against DRIP.md are the defence.',
      },
      {
        t: 'A crash in the garbage collector',
        why: 'The stress-GC suite is built to find exactly that.',
      },
    ],
  },
];
