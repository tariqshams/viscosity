// Chapter 410 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'de-two-paths': {
    q: 'Where do drip-rs’s compile errors and runtime errors go, and with which exit codes?',
    a: 'Compile errors are pushed as `String`s into two `Vec`s and compiling carries on: exit 65. A runtime error writes its message and trace into the VM’s stderr lines and stops the program: exit 70.',
  },
  'de-innermost': {
    q: 'In a drip-rs stack trace, which call comes first?',
    a: 'The innermost one, where the error happened; the script comes last.',
  },
  'de-stale': {
    q: 'Why does `runtime_error` use `self.ip` for the innermost frame instead of that frame’s `ip` field?',
    a: 'The running frame’s ip lives in the `self.ip` register and is written back only when the frame makes a call, so the innermost frame’s own copy is stale.',
  },
  'de-fields': {
    q: 'Why may `runtime_error` push to `self.stderr` inside `for ... in self.frames.iter()`?',
    a: 'They are different fields of `self`, and Rust lets one function borrow different fields separately: `self.frames` shared, `self.stderr` mutable.',
  },
  'de-unit': {
    q: 'Why does drip-rs’s `RuntimeError` carry no data?',
    a: 'By the time one exists, the message and stack trace are already in `self.stderr`, so there is nothing left to carry.',
  },
  'de-question': {
    q: 'What does the `?` in `let (a, b) = self.pop_numbers("*")?;` do on an error?',
    a: 'It returns the `Err(RuntimeError)` from the current function at once, so it travels up out of `run` to `interpret`.',
  },
  'de-reset': {
    q: 'What does `interpret` clear after a runtime error, and what does it keep?',
    a: 'It clears the stack, the frames, the chunk register and the open upvalues. The globals stay, so the same VM can run another program.',
  },
  'de-static': {
    q: 'A program has a syntax error on line 5 and a `break` outside a loop on line 3. What does drip-rs report?',
    a: 'Only the syntax error: static errors are reported only when there are no syntax errors.',
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
};

const head = `struct Frame {
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
    ) {`;

const tail = `
            let line = f.lines[ip - 1];
            let p = place(f);
            let l = line;
            let at = format!(
                "  at line {l} in {p}"
            );
            self.stderr.push(at);
        }
    }
}`;

const solution = `${head}
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
            };${tail}`;

export const exercises = {
  trace: {
    lang: 'rust',
    title: 'A stack trace',
    prompt: `Write \`runtime_error\` for this small VM, which keeps the running frame's ip in a register as drip-rs does.

1. Push \`runtime error: <m>\` onto \`stderr\`.
2. Then, for every frame from the innermost (the last in \`frames\`) to the outermost, push \`  at line N in <place>\` (two spaces first).
3. \`N\` is \`lines[ip - 1]\`, where \`ip\` is the register \`self.ip\` for the innermost frame and the frame's own \`ip\` for every other frame.
4. \`<place>\` is \`fn <name>\` for a named function, \`script\` for the script, and \`anonymous fn\` otherwise; the helper \`place(f)\` already works it out.

There is always at least one frame.`,
    starter: `${head}
        todo!()
    }
}`,
    solution,
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
        code: `${head}
        let first = format!("{RE}{m}");
        self.stderr.push(first);
        let fs = self.frames.iter();
        for f in fs.rev() {
            let ip = f.ip;${tail}`,
        why: 'Uses the saved `ip` for the innermost frame too. That copy is stale (0 here), so `ip - 1` overflows and the test panics.',
      },
      {
        code: `${head}
        let first = format!("{RE}{m}");
        self.stderr.push(first);
        let top = self.frames.len() - 1;
        let fs = self.frames.iter();
        for (d, f) in fs.enumerate() {
            let ip = if d == top {
                self.ip
            } else {
                f.ip
            };${tail}`,
        why: 'The lines are right but in the wrong order: without `.rev()` the script comes first, and a Drip trace is innermost first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the oven program, why is the second trace line `at line 2 in fn bake`?',
    options: [
      { t: 'Line 2 is where `bake` is defined', why: 'It happens to be, but the trace reports the line of the instruction the frame is on: the call to `heat`, which is also on line 2.' },
      { t: '`bake`’s saved ip points just past its call to `heat`, and that byte is on line 2', correct: true, why: '`lines[ip - 1]` for a frame that is waiting on a call is the line of the call.' },
      { t: 'The VM records the line of every call in a separate list', why: 'There is no such list; the line comes from the saved ip and the chunk’s `lines` array.' },
    ],
  },
  {
    q: 'What does drip-rs’s `runtime_error` return?',
    options: [
      { t: 'A `String` with the message', why: 'The message has already been pushed to `self.stderr`.' },
      { t: 'Nothing: it panics', why: 'A Drip runtime error is the program’s mistake, never a panic.' },
      { t: '`RuntimeError`, a unit struct, which the caller wraps in `Err` and `?` carries up', correct: true, why: 'Every fallible function returns `Run<T> = Result<T, RuntimeError>`.' },
    ],
  },
  {
    q: 'How does the TypeScript VM get a runtime error out of its loop?',
    options: [
      { t: 'It throws an exception, and `interpret` catches it', correct: true, why: 'Its `runtimeError` has return type `never` and ends with `throw`.' },
      { t: 'It returns a `Result` like drip-rs', why: 'TypeScript has no built-in `Result`; the VM throws.' },
      { t: 'It sets a flag that the loop checks after every instruction', why: 'That would cost a check per instruction; it throws instead.' },
    ],
  },
  {
    q: 'A program has a missing `;` on line 9 and `return` outside a function on line 2. What does drip-rs print?',
    options: [
      { t: 'Both errors, in source order', why: 'Static errors are only reported when there are no syntax errors.' },
      { t: 'Only the line 9 syntax error, and it exits with 65', correct: true, why: 'Syntax errors win; fixing it would reveal the line 2 error on the next run.' },
      { t: 'Only the line 2 error, because it comes first', why: 'It comes first in the file, but it is a static error, hidden by the syntax error.' },
    ],
  },
  {
    q: 'Which difference between the two command lines does the shared corpus not catch?',
    options: [
      { t: 'The wording of the message for a file that cannot be read', correct: true, why: 'drip-rs prints Rust’s “No such file or directory (os error 2)”, the TypeScript CLI Node’s “ENOENT”; the corpus only runs programs that exist.' },
      { t: 'The exit code of a runtime error', why: 'Both exit with 70, and the corpus checks it.' },
      { t: 'The order of the stack trace', why: 'The corpus pins traces with `# expect trace:` lines.' },
    ],
  },
];
