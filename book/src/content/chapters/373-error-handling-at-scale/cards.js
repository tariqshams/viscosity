// Chapter 373 cards. Keys are stable ids: never rename them.
// rustc messages are rustc 1.97.0's; drip-rs facts are from
// book/companion/rust/src (main.rs, vm.rs) and engine/rust facts from
// crates/core/src/plugin.rs and crates/cli/src/main.rs.

const HEAD = `const USAGE: &str = "usage: \\
    drip-rs [--disassemble] <file>";

#[derive(Debug, PartialEq)]
enum DripError {
    Usage,
    Io(String),
    Compile(Vec<String>),
    Runtime(String),
}
`;

const CODES = `
// 64 usage, 66 unreadable file,
// 65 compile error, 70 runtime error.
fn exit_code(e: &DripError) -> u8 {
    match e {
        DripError::Usage => 64,
        DripError::Io(_) => 66,
        DripError::Compile(_) => 65,
        DripError::Runtime(_) => 70,
    }
}
`;

const REPORT = `
// What drip-rs prints on stderr.
fn report(e: &DripError) -> String {
    match e {
        DripError::Usage => {
            USAGE.to_string()
        }
        DripError::Io(m) => {
            format!("cannot read {m}")
        }
        DripError::Compile(es) => {
            es.join("\\n")
        }
        DripError::Runtime(m) => {
            let p = "runtime error";
            format!("{p}: {m}")
        }
    }
}`;

const CFG = `use std::fmt;

// Every way reading "min=N" can fail.
#[derive(Debug)]
enum CfgErr {
    Missing,
    NotNum(String),
    Small(u32),
}
use CfgErr::*;

fn describe(e: &CfgErr) -> String {
    match e {
        Missing => "no min=".into(),
        NotNum(s) => {
            format!("not a number: {s}")
        }
        Small(n) => {
            format!("{n} is below 8")
        }
    }
}

impl fmt::Display for CfgErr {
    fn fmt(
        &self,
        f: &mut fmt::Formatter,
    ) -> fmt::Result {
        f.write_str(&describe(self))
    }
}

fn min_size(t: &str)
    -> Result<u32, CfgErr> {
    let v = t
        .strip_prefix("min=")
        .ok_or(Missing)?
        .trim();
    let bad = |_| NotNum(v.to_string());
    let n: u32 =
        v.parse().map_err(bad)?;
    if n < 8 {
        return Err(Small(n));
    }
    Ok(n)
}

fn main() {
    let ts = ["min=64", "max=9",
        "min=lots", "min=2"];
    for t in ts {
        let r = min_size(t);
        let code = match &r {
            Ok(_) => 0,
            Err(Missing) => 2,
            Err(_) => 1,
        };
        let msg = match r {
            Ok(n) => n.to_string(),
            Err(e) => e.to_string(),
        };
        println!("{t}: {msg} ({code})");
    }
}`;

export const prompts = {
  'enum-what': {
    q: 'What is an **error enum**?',
    a: 'One enum with a variant for each way a crate’s operations can fail, each holding its details, so callers get one error type and can match on it.',
  },
  'enum-why': {
    q: 'Why not return `Result<T, String>` everywhere?',
    a: 'A `String` can only be printed. Callers cannot tell kinds apart (to pick an exit code, retry, or underline a line) without parsing the text, which breaks when a message is reworded.',
  },
  'enum-exhaustive': {
    q: 'You add a `Timeout` variant to your error enum. What happens to a `match` that lists the old variants?',
    a: 'It stops compiling: error E0004, non-exhaustive patterns, `Timeout` not covered. (Unless it has a `_` arm, which hides the new case.)',
  },
  'map-err': {
    q: 'How do you turn a `ParseIntError` into your own `NotNum` variant before `?`?',
    a: 'With `map_err`: `v.parse().map_err(|_| NotNum(v.to_string()))?`. It converts the error inside a `Result` and leaves `Ok` alone.',
  },
  'display-msg': {
    q: 'What two traits does an error enum usually implement besides `Debug`?',
    a: '`Display`, for a message a person can read, and `std::error::Error`, the standard marker for error types.',
  },
  'drip-unit': {
    q: 'drip-rs’s `RuntimeError` is a struct with no fields. Why is that enough?',
    a: 'The message and stack trace are already in the VM’s stderr lines when it is made; it only has to stop the run loop, through `?`.',
  },
  'drip-codes': {
    q: 'What exit codes does `drip-rs` use?',
    a: '0 for success, 64 for bad usage, 66 if the file cannot be read, 65 for a compile error, 70 for a runtime error.',
  },
  'compile-error-newtype': {
    q: 'What is engine/rust’s `CompileError`, and why is that enough for it?',
    a: 'A newtype, `CompileError(pub String)`, with `Display` and `std::error::Error` impls. Every caller prints the message and stops, so one string loses nothing.',
  },
};

export const examples = {
  'cfg-error': {
    lang: 'rust',
    title: 'An error enum with a message',
    code: CFG,
  },
};

export const exercises = {
  report: {
    lang: 'rust',
    title: 'Exit codes and messages',
    prompt:
      '`DripError` is a design for one error type covering a whole Drip run. Write `exit_code`, which gives drip-rs’s exit code for each variant (64 for `Usage`, 66 for `Io`, 65 for `Compile`, 70 for `Runtime`), and `report`, which gives the text to print: `USAGE` for `Usage`, `"cannot read "` followed by the message for `Io`, every compile error on its own line (joined with `\\n`) for `Compile`, and `"runtime error: "` followed by the message for `Runtime`. Do not use a `_` arm.',
    starter: `${HEAD}
fn exit_code(e: &DripError) -> u8 {
    todo!()
}

fn report(e: &DripError) -> String {
    todo!()
}`,
    solution: `${HEAD}${CODES}${REPORT}`,
    tests: `#[test]
fn every_kind_has_its_code() {
    let io = DripError::Io("a".into());
    assert_eq!(exit_code(&DripError::Usage), 64);
    assert_eq!(exit_code(&io), 66);
    let c = DripError::Compile(vec![]);
    assert_eq!(exit_code(&c), 65);
    let r = DripError::Runtime("x".into());
    assert_eq!(exit_code(&r), 70);
}

#[test]
fn usage_prints_the_usage_line() {
    assert_eq!(report(&DripError::Usage), USAGE);
}

#[test]
fn io_names_the_file() {
    let e = DripError::Io("p.drip: gone".into());
    assert_eq!(report(&e), "cannot read p.drip: gone");
}

#[test]
fn every_compile_error_gets_a_line() {
    let e = DripError::Compile(vec![
        "line 1: unexpected character '@'".into(),
        "line 3: expected ';' after the value".into(),
    ]);
    assert_eq!(report(&e), "line 1: unexpected character '@'\nline 3: expected ';' after the value");
}

#[test]
fn runtime_errors_say_so() {
    let e = DripError::Runtime("cannot add a number and a string".into());
    assert_eq!(report(&e), "runtime error: cannot add a number and a string");
}`,
    hints: [
      'Both functions are one `match e { ... }` with one arm per variant: four arms each.',
      'In `exit_code` the arms ignore the details: `DripError::Io(_) => 66`. In `report` they bind them: `DripError::Io(m) => format!("cannot read {m}")`.',
      'For `Compile(es)`, `es` is a `&Vec<String>`; `es.join("\\n")` puts each error on its own line. `USAGE.to_string()` turns the constant into a `String`.',
    ],
    walkthrough: `**How to think about it.** An error enum is only useful if the code that *receives* it can act on each kind, and these two functions are that code: one answers "which exit code?", the other "what do I print?". Each is a \`match\` with one arm per variant. Writing every arm out (no \`_\`) is the point: if someone later adds a \`Timeout\` variant, both functions stop compiling until they decide what a timeout means here.

**The solution, line by line.**

- The given \`USAGE\` ends its first line with \`\\\`: inside a Rust string, a backslash at the end of a line skips the newline and the next line's leading spaces, so the constant is one line of text.
- \`fn exit_code(e: &DripError) -> u8 {\` borrows the error (it only needs to look) and returns a byte, the size of an exit code.
- \`    match e {\` matches on a reference; Rust lets the patterns be written as if \`e\` were the value itself.
- \`        DripError::Usage => 64,\` has no details to bind.
- \`        DripError::Io(_) => 66,\`, \`        DripError::Compile(_) => 65,\` and \`        DripError::Runtime(_) => 70,\` ignore their details with \`_\`: the code depends only on the kind. These are drip-rs's own codes.
- \`fn report(e: &DripError) -> String {\` builds the text to print.
- \`        DripError::Usage => { USAGE.to_string() }\` copies the constant into an owned \`String\`.
- \`        DripError::Io(m) => { format!("cannot read {m}") }\` binds the message as \`m\` (a \`&String\`) and puts it after the prefix, which is how drip-rs words an unreadable file.
- \`        DripError::Compile(es) => { es.join("\\n") }\` binds the list of messages and joins them with newlines, so each compile error gets its own line, as a Drip implementation prints every error it found.
- \`        DripError::Runtime(m) => { let p = "runtime error"; format!("{p}: {m}") }\` uses Drip's runtime-error prefix (split over two lines so it fits).

**Common wrong attempts.**

- \`_ => 70\` after the first three arms (or in place of them) compiles, but sends \`Usage\` to 70, and, worse, would silently give any future variant code 70. The first test catches the \`Usage\` case.
- \`es.join(", ")\` puts all compile errors on one line; a reader (or an editor looking for \`line N:\` at the start of each line) can no longer find them.
- \`format!("{m}")\` for \`Io\` drops the "cannot read" context, so the message no longer says what went wrong.`,
    wrong: [
      {
        code: `${HEAD}
fn exit_code(e: &DripError) -> u8 {
    match e {
        DripError::Compile(_) => 65,
        _ => 70,
    }
}
${REPORT}`,
        why: 'The `_` arm sends `Usage` and `Io` to 70, and would silently do the same to any variant added later.',
      },
      {
        code: `${HEAD}${CODES}
fn report(e: &DripError) -> String {
    match e {
        DripError::Usage => {
            USAGE.to_string()
        }
        DripError::Io(m) => {
            format!("cannot read {m}")
        }
        DripError::Compile(es) => {
            es.join(", ")
        }
        DripError::Runtime(m) => {
            let p = "runtime error";
            format!("{p}: {m}")
        }
    }
}`,
        why: 'All compile errors end up on one line, joined with commas, instead of one per line.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A caller must exit with 65 after a compile error and 70 after a runtime error. Why is `Result<T, String>` a poor fit?',
    options: [
      { t: 'Strings are slower than enums', why: 'Speed is not the issue; telling the kinds apart is.' },
      { t: 'Rust does not allow `String` as an error type', why: 'It does: `Result<T, String>` is common in small programs.' },
      { t: 'The caller would have to search the message text to find the kind, which breaks when a message is reworded', correct: true, why: 'An enum puts the kind in the type, so a `match` decides without reading.' },
    ],
  },
  {
    q: 'You add a variant to your error enum. Which code fails to compile?',
    options: [
      { t: 'Every `match` on the enum that lists variants but has no `_` arm', correct: true, why: 'Error E0004: non-exhaustive patterns. That is the compiler finding every place that must decide about the new kind.' },
      { t: 'Every function that returns the enum', why: 'Returning it is fine; only code that inspects every variant must change.' },
      { t: 'None: new variants are ignored until used', why: 'Exhaustiveness checking is exactly what makes an enum safer than a string.' },
    ],
  },
  {
    q: 'What does `"lots".parse::<u32>().map_err(|_| NotNum("lots".into()))` give?',
    options: [
      { t: '`Ok(0)`', why: 'A failed parse is not turned into a number.' },
      { t: '`Err(NotNum("lots"))`: the `ParseIntError` replaced by your own variant', correct: true, why: '`map_err` converts the error inside a `Result` and leaves an `Ok` untouched.' },
      { t: 'A panic', why: 'Nothing panics; `parse` returns an `Err`, and `map_err` changes its type.' },
    ],
  },
  {
    q: 'What exit code does `drip-rs` use when the file cannot be read?',
    options: [
      { t: '65', why: '65 is a compile error.' },
      { t: '70', why: '70 is a runtime error.' },
      { t: '74', why: 'Some tools use 74 for I/O errors; drip-rs’s `main.rs` returns 66 when `read_to_string` fails.' },
      { t: '66', correct: true, why: 'From `main.rs`: `cannot read {path}: {e}` on stderr, then `ExitCode::from(66)`.' },
    ],
  },
  {
    q: 'engine/rust’s `compile` returns `Result<_, CompileError>`, where `CompileError` is one `String`. Why is that a reasonable design?',
    options: [
      { t: 'Every caller prints the message and stops, so a kind would never be used', correct: true, why: 'Choose the error type by what callers need to tell apart; here they need nothing but the text.' },
      { t: 'Error enums do not work across crates', why: 'They work fine across crates; many libraries export one.' },
      { t: 'oxc requires it', why: 'The parser’s errors are converted to strings by engine/rust itself.' },
    ],
  },
];
