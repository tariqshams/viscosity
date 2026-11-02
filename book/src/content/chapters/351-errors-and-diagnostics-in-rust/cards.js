// Chapter 351 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'de-two-paths': {
    q: 'Where do drip-rs’s compile errors and runtime errors go, and with which exit codes?',
    a: 'Compile errors are pushed into a `Vec<String>` and compiling carries on: exit 65. A runtime error writes its message and trace to the VM’s stderr lines and stops the program: exit 70.',
  },
  'de-location': {
    q: 'What location does `error_at` print for an `Eof` token, an `Error` token and any other token?',
    a: '` at end`, nothing, and ` at \'lexeme\'`.',
  },
  'de-panic': {
    q: 'What does `panic_mode` do in drip-rs’s compiler?',
    a: 'After one error it drops further errors until `synchronize` reaches a statement boundary, so cascades of the first error aren’t reported.',
  },
  'de-into': {
    q: 'Why does `runtime_error` take `message: impl Into<String>`?',
    a: 'So callers can pass either a literal `&str` or a `String` from `format!`.',
  },
  'de-fields': {
    q: 'Why may `runtime_error` push to `self.stderr` inside `for frame in self.frames.iter()`, but not call a `&mut self` helper there?',
    a: 'Different fields can be borrowed separately in one function body. A `&mut self` call borrows all of `self` while `self.frames` is still borrowed: E0502.',
  },
  'de-stale': {
    q: 'What happened when a copy of drip-rs read `frame.ip` for the innermost frame too?',
    a: 'With a saved `ip` of 0 it panicked with “attempt to subtract with overflow” (debug build, exit 101). With an older saved `ip` it printed the wrong line, silently.',
  },
  'de-reset': {
    q: 'What does `interpret` clear after a runtime error, and what does it keep?',
    a: 'It clears the stack, the frames, the chunk register and the open upvalues. The globals stay, so the same VM can run another program.',
  },
  'de-codes': {
    q: 'What do drip-rs’s exit codes 64, 65, 70 and 74 mean?',
    a: '64: wrong usage. 65: compile error. 70: runtime error. 74: the file couldn’t be read.',
  },
  'de-ts-74': {
    q: 'What difference between the drip-rs and TypeScript command lines did this chapter find, and how did it end?',
    a: 'On a file that can’t be read, drip-rs printed “Could not read …” and exited with 74, while the TS CLI crashed with an uncaught exception (exit 1). The TS CLI was fixed to exit with 74 too.',
  },
  'de-same': {
    q: 'On the 265 corpus programs, how did drip-rs’s stderr and exit codes compare with the TypeScript VM’s?',
    a: 'Byte-identical stderr for all 265, and the same exit code for all 265.',
  },
};

export const examples = {};

const head = `#[derive(Clone, Copy, PartialEq)]
enum Kind {
    Ident,
    Eof,
    // Made by the scanner for a bad
    // character: the lexeme is the
    // message.
    Error,
}

#[derive(Clone, Copy)]
struct Token {
    kind: Kind,
    lexeme: &'static str,
    line: usize,
}

#[derive(Default)]
struct Reporter {
    errors: Vec<String>,
    had_error: bool,
    panic_mode: bool,
}

impl Reporter {
    // A statement boundary: errors may
    // be reported again.
    fn synchronize(&mut self) {
        self.panic_mode = false;
    }

    // Report one compile error, unless
    // one is already being reported.
    fn error_at(
        &mut self,
        t: Token,
        m: &str,
    ) {`;

const location = `
        let lx = t.lexeme;
        let at = match t.kind {
            Kind::Eof => {
                String::from(" at end")
            }
            Kind::Error => {
                String::new()
            }
            _ => format!(" at '{lx}'"),
        };
        let n = t.line;
        let e = format!(
            "[line {n}] Error{at}: {m}"
        );
        self.errors.push(e);
        self.had_error = true;
    }
}`;

export const exercises = {
  errorAt: {
    lang: 'rust',
    title: 'error_at with panic mode',
    prompt: `Write \`error_at\`, the compiler's error reporter, as drip-rs has it:

- If \`panic_mode\` is set, report nothing. Otherwise set it.
- Push \`[line N] Error{at}: {message}\`, where \`{at}\` is \` at end\` for an \`Eof\` token, empty for an \`Error\` token, and \` at 'lexeme'\` otherwise.
- Set \`had_error\`.

\`synchronize\` clears \`panic_mode\` at the next statement. \`had_error\` is never cleared: one error anywhere means the program doesn't run.`,
    starter: `${head}
        todo!()
    }
}`,
    solution: `${head}
        if self.panic_mode {
            return;
        }
        self.panic_mode = true;${location}`,
    tests: `fn tok(
    kind: Kind,
    lexeme: &'static str,
    line: usize,
) -> Token {
    Token { kind, lexeme, line }
}

#[test]
fn an_identifier_is_quoted() {
    let mut r = Reporter::default();
    let t = tok(Kind::Ident, "x", 3);
    r.error_at(t, "Expect ';'.");
    assert_eq!(r.errors,
        ["[line 3] Error at 'x': Expect ';'."]);
    assert!(r.had_error);
}

#[test]
fn the_end_of_the_file_says_at_end() {
    let mut r = Reporter::default();
    let t = tok(Kind::Eof, "", 9);
    r.error_at(t, "Expect '}' after block.");
    assert_eq!(r.errors, ["[line 9] Error \\
        at end: Expect '}' after block."]);
}

#[test]
fn a_scanner_error_has_no_location() {
    let mut r = Reporter::default();
    let t = tok(Kind::Error,
        "Unexpected character.", 2);
    r.error_at(t, t.lexeme);
    assert_eq!(r.errors,
        ["[line 2] Error: Unexpected character."]);
}

#[test]
fn one_error_until_the_next_statement() {
    let mut r = Reporter::default();
    let a = tok(Kind::Ident, ";", 1);
    let b = tok(Kind::Ident, ")", 1);
    r.error_at(a, "Expect expression.");
    r.error_at(b, "Expect expression.");
    assert_eq!(r.errors.len(), 1);
    r.synchronize();
    let c = tok(Kind::Eof, "", 3);
    r.error_at(c, "Expect ';' after value.");
    assert_eq!(r.errors.len(), 2);
    assert!(r.errors[1]
        .starts_with("[line 3] Error at end"));
}

#[test]
fn had_error_survives_synchronize() {
    let mut r = Reporter::default();
    let t = tok(Kind::Ident, "=", 2);
    r.error_at(t, "Expect variable name.");
    r.synchronize();
    assert!(r.had_error);
    assert!(!r.panic_mode);
}`,
    hints: [
      'Start with the guard: `if self.panic_mode { return; }`, then `self.panic_mode = true;`.',
      'Build the location with `match t.kind { Kind::Eof => ..., Kind::Error => ..., _ => ... }`, each arm giving a `String`.',
      'Then `format!("[line {n}] Error{at}: {m}")`, push it, and set `had_error`.',
    ],
    walkthrough: `**The guard first.** In panic mode the compiler has already reported the error that matters in this statement; whatever it finds next is probably a consequence. So \`error_at\` returns before formatting anything, and the second \`Expect expression.\` on line 1 is never seen. \`synchronize\`, called when the parser reaches a statement boundary, turns reporting back on.

**The location comes from the token's kind.** \`match\` must cover every \`Kind\`, so the end-of-file case and the scanner-error case can't be forgotten. For \`Error\` tokens the lexeme *is* the message, so printing it again as a location would say it twice.

**\`had_error\` is separate from \`panic_mode\`.** \`panic_mode\` is about reporting, and is reset at every statement. \`had_error\` is about the result, and is never reset. In drip-rs it decides whether \`compile\` returns \`Some(function)\` or \`None\`, and so whether the exit code is 65.

**Byte for byte.** The corpus compares these strings exactly, so \`Error at 'x':\` with single quotes and one space each side of \`at\` is not a detail. It is what the TypeScript VM and clox print.`,
    wrong: [
      {
        code: `${head}
        self.panic_mode = true;${location}`,
        why: 'Forgets the guard, so every cascade error is reported: two `Expect expression.` errors for one bad statement.',
      },
      {
        code: `${head}
        if self.panic_mode {
            return;
        }
        self.panic_mode = true;
        let lx = t.lexeme;
        let n = t.line;
        let e = format!(
            "[line {n}] Error at \\
             '{lx}': {m}"
        );
        self.errors.push(e);
        self.had_error = true;
    }
}`,
        why: 'Treats every token alike. The end of the file prints `Error at \'\'` instead of `Error at end`, and a scanner error repeats its message as a location.',
      },
      {
        code: `${head}
        if self.panic_mode {
            return;
        }
        self.panic_mode = true;
        let lx = t.lexeme;
        let at = match t.kind {
            Kind::Eof => {
                String::from(" at end")
            }
            Kind::Error => {
                String::new()
            }
            _ => format!(" at '{lx}'"),
        };
        let n = t.line;
        let e = format!(
            "[line {n}] Error{at}: {m}"
        );
        self.errors.push(e);
    }
}`,
        why: 'Reports the error but never sets `had_error`, so the compiler would run a program it knows is broken.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`print (1 + ;) * ;` is one statement with two problems. How many errors does drip-rs report for it?',
    options: [
      { t: 'Two, one per problem', why: 'The second is dropped: the compiler is in panic mode until the next statement.' },
      { t: 'One: `[line 1] Error at \';\': Expect expression.`', correct: true, why: 'Panic mode keeps the first and drops the cascade. The TypeScript VM prints the same.' },
      { t: 'None, because compiling stops at the first error', why: 'Compiling carries on to find errors in later statements; only reporting pauses.' },
      { t: 'It depends on the exit code', why: 'The exit code is 65 either way.' },
    ],
  },
  {
    q: 'Why does an `Error` token get no location in the message?',
    options: [
      { t: 'Its line number is unknown', why: 'Every token has a line. The location is the part after `Error`.' },
      { t: 'Its lexeme is the message, so a location would repeat it', correct: true, why: 'The scanner stores “Unexpected character.” as the token’s lexeme.' },
      { t: 'Scanner errors are only warnings', why: 'They set `had_error` like any other error: exit code 65.' },
      { t: 'The TypeScript VM omits it and drip-rs copies the bug', why: 'It is the clox format, and deliberate.' },
    ],
  },
  {
    q: 'A copy of drip-rs reads `frame.ip` for every frame in the trace. The script calls `f()` on line 2, then fails on line 3. What does the trace say?',
    options: [
      { t: '`[line 3] in script`, as it should', why: 'That needs the register. The saved field still holds the ip from the call.' },
      { t: 'It panics with a subtraction overflow', why: 'That happens when the saved ip is 0, i.e. the frame never made a call. Here it did.' },
      { t: 'Nothing: the trace is skipped', why: 'The loop still runs for every frame.' },
      { t: '`[line 2] in script`: a wrong line, with no warning', correct: true, why: 'The ip saved when `f()` was called points into line 2. I ran exactly this.' },
    ],
  },
  {
    q: 'Inside `for frame in self.frames.iter().rev()`, which line compiles?',
    options: [
      { t: '`self.stderr.push(line)`', correct: true, why: 'A different field from `self.frames`, so the two borrows don’t overlap.' },
      { t: '`self.say(line)`, where `say` takes `&mut self`', why: 'That borrows all of `self` mutably while `self.frames` is borrowed: E0502.' },
      { t: '`self.frames.clear()`', why: 'Mutating the `Vec` being iterated is a conflict too.' },
      { t: 'None of them: no `&mut` access is possible in the loop', why: 'Disjoint fields can be borrowed separately.' },
    ],
  },
  {
    q: 'What does drip-rs’s `main` return for a program with a runtime error?',
    options: [
      { t: '`Err(RuntimeError)`', why: '`main` returns an `ExitCode`. The `Err` was turned into `exit_code: 70` inside `interpret`.' },
      { t: '`ExitCode::FAILURE`', why: 'That is a platform’s generic failure code, not 70.' },
      { t: '`ExitCode::from(70)`, after printing stdout and then stderr', correct: true, why: '`ExitCode::from(outcome.exit_code as u8)`.' },
      { t: 'It calls `std::process::exit(70)` from inside the VM', why: 'The VM never exits the process; it returns an `Outcome`.' },
    ],
  },
  {
    q: 'I compared both VMs on all 265 corpus programs. What matched?',
    options: [
      { t: 'Only the exit codes', why: 'stderr matched too, byte for byte.' },
      { t: 'stderr and the exit code, for every program', correct: true, why: 'All 265 of each. stdout is chapter 352.' },
      { t: 'stderr for the 128 that print errors; the rest weren’t compared', why: 'All 265 were compared. Empty stderr has to match too.' },
      { t: 'Nothing exactly: the hash functions differ', why: 'The hashes differ, but nothing a program prints depends on them.' },
    ],
  },
];
