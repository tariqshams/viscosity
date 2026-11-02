// Chapter 130 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

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
  'drip-unit': {
    q: 'drip-rs’s `RuntimeError` is a struct with no fields. Why is that enough?',
    a: 'The message and stack trace are already in the VM’s stderr lines when it is made; it only has to stop the run loop, through `?`.',
  },
  'q-from': {
    q: 'What does `?` do with an `Err(e)` whose type differs from the function’s error type?',
    a: 'Calls `From::from(e)` to convert it into the function’s error type, then returns the converted error.',
  },
  'from-impl': {
    q: 'What makes `fs::read_to_string(p)?` compile in a function returning `Result<u32, CliError>`?',
    a: 'An `impl From<io::Error> for CliError`. Without it, that `?` is error E0277.',
  },
  'into-free': {
    q: 'You wrote `impl From<Trap> for DripError`. What do you get for free?',
    a: '`Into<DripError>` for `Trap`, so `t.into()` works wherever a `DripError` is expected.',
  },
  'str-string': {
    q: 'Why does `.ok_or("not an object")?` compile in a function returning `Result<_, String>`?',
    a: 'The standard library has `impl From<&str> for String`, so `?` converts the message.',
  },
};

export const examples = {
  'cfg-error': {
    lang: 'rust',
    title: 'An error enum with a message',
    code: `use std::fmt;

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
}`,
  },
  'cli-error': {
    lang: 'rust',
    title: 'One error enum, two From impls',
    code: `use std::fs;
use std::io;
use std::num::ParseIntError;
use std::path::Path;

#[derive(Debug)]
enum CliError {
    Io(io::Error),
    Num(ParseIntError),
}

impl From<io::Error> for CliError {
    fn from(e: io::Error) -> Self {
        CliError::Io(e)
    }
}

impl From<ParseIntError> for CliError {
    fn from(e: ParseIntError) -> Self {
        CliError::Num(e)
    }
}

fn min_size(path: &Path)
    -> Result<u32, CliError> {
    let s = fs::read_to_string(path)?;
    let n = s.trim().parse::<u32>()?;
    Ok(n)
}

fn main() {
    let dir = std::env::temp_dir();
    let ok = dir.join("ok");
    fs::write(&ok, "64\\n").unwrap();
    let bad = dir.join("bad");
    fs::write(&bad, "lots\\n").unwrap();

    for f in ["ok", "bad", "gone"] {
        let r = min_size(&dir.join(f));
        let msg = match r {
            Ok(n) => n.to_string(),
            Err(CliError::Io(e)) => {
                format!("io: {e}")
            }
            Err(CliError::Num(e)) => {
                format!("num: {e}")
            }
        };
        println!("{f}: {msg}");
    }
}`,
  },
};

export const exercises = {
  report: {
    lang: 'rust',
    optional: true,
    title: 'Exit codes and messages',
    prompt: '`DripError` is a design for one error type covering a whole Drip run. Write `exit_code`, which gives drip-rs’s exit code for each variant (64 for `Usage`, 66 for `Io`, 65 for `Compile`, 70 for `Runtime`), and `report`, which gives the text to print: `USAGE` for `Usage`, `"cannot read "` followed by the message for `Io`, every compile error on its own line (joined with `\\n`) for `Compile`, and `"runtime error: "` followed by the message for `Runtime`. Do not use a `_` arm.',
    starter: `const USAGE: &str = "usage: \\
    drip-rs [--disassemble] <file>";

#[derive(Debug, PartialEq)]
enum DripError {
    Usage,
    Io(String),
    Compile(Vec<String>),
    Runtime(String),
}

fn exit_code(e: &DripError) -> u8 {
    todo!()
}

fn report(e: &DripError) -> String {
    todo!()
}`,
    solution: `const USAGE: &str = "usage: \\
    drip-rs [--disassemble] <file>";

#[derive(Debug, PartialEq)]
enum DripError {
    Usage,
    Io(String),
    Compile(Vec<String>),
    Runtime(String),
}

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
}`,
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
    assert_eq!(report(&e), "line 1: unexpected character '@'
line 3: expected ';' after the value");
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
        code: `const USAGE: &str = "usage: \\
    drip-rs [--disassemble] <file>";

#[derive(Debug, PartialEq)]
enum DripError {
    Usage,
    Io(String),
    Compile(Vec<String>),
    Runtime(String),
}

fn exit_code(e: &DripError) -> u8 {
    match e {
        DripError::Compile(_) => 65,
        _ => 70,
    }
}

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
}`,
        why: 'The `_` arm sends `Usage` and `Io` to 70, and would silently do the same to any variant added later.',
      },
      {
        code: `const USAGE: &str = "usage: \\
    drip-rs [--disassemble] <file>";

#[derive(Debug, PartialEq)]
enum DripError {
    Usage,
    Io(String),
    Compile(Vec<String>),
    Runtime(String),
}

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
  dripError: {
    lang: 'rust',
    title: 'One error type for a pipeline',
    prompt: 'A toy `compile` returns `CompileErrors` (every error it found), and a toy `execute` returns a `Trap`. Make `DripError` the error type of the whole pipeline: write `From<CompileErrors>` and `From<Trap>` for it, an `exit_code` method (65 for `Compile`, 70 for `Runtime`, as drip-rs uses), and `run`, which compiles and then executes, passing either error up with `?`.',
    starter: `// From the compiler: every error found.
#[derive(Debug, PartialEq)]
struct CompileErrors(Vec<String>);

// From the VM: the one that stopped it.
#[derive(Debug, PartialEq)]
struct Trap(String);

#[derive(Debug, PartialEq)]
enum DripError {
    Compile(Vec<String>),
    Runtime(String),
}

fn bad(w: &str) -> String {
    let e = "expected a number";
    format!("line 1: {e}, found '{w}'")
}

// A toy compiler: numbers only.
fn compile(src: &str)
    -> Result<Vec<f64>, CompileErrors> {
    let mut code = Vec::new();
    let mut errs = Vec::new();
    for w in src.split_whitespace() {
        match w.parse::<f64>() {
            Ok(n) => code.push(n),
            Err(_) => errs.push(bad(w)),
        }
    }
    if errs.is_empty() {
        Ok(code)
    } else {
        Err(CompileErrors(errs))
    }
}

// A toy VM with four stack slots.
fn execute(code: &[f64])
    -> Result<f64, Trap> {
    if code.len() > 4 {
        let m = "stack overflow";
        return Err(Trap(m.to_string()));
    }
    Ok(code.iter().sum())
}

impl From<CompileErrors> for DripError {
    fn from(e: CompileErrors) -> Self {
        todo!()
    }
}

impl From<Trap> for DripError {
    fn from(t: Trap) -> Self {
        todo!()
    }
}

impl DripError {
    fn exit_code(&self) -> u8 {
        todo!()
    }
}

fn run(src: &str)
    -> Result<f64, DripError> {
    todo!()
}`,
    solution: `// From the compiler: every error found.
#[derive(Debug, PartialEq)]
struct CompileErrors(Vec<String>);

// From the VM: the one that stopped it.
#[derive(Debug, PartialEq)]
struct Trap(String);

#[derive(Debug, PartialEq)]
enum DripError {
    Compile(Vec<String>),
    Runtime(String),
}

fn bad(w: &str) -> String {
    let e = "expected a number";
    format!("line 1: {e}, found '{w}'")
}

// A toy compiler: numbers only.
fn compile(src: &str)
    -> Result<Vec<f64>, CompileErrors> {
    let mut code = Vec::new();
    let mut errs = Vec::new();
    for w in src.split_whitespace() {
        match w.parse::<f64>() {
            Ok(n) => code.push(n),
            Err(_) => errs.push(bad(w)),
        }
    }
    if errs.is_empty() {
        Ok(code)
    } else {
        Err(CompileErrors(errs))
    }
}

// A toy VM with four stack slots.
fn execute(code: &[f64])
    -> Result<f64, Trap> {
    if code.len() > 4 {
        let m = "stack overflow";
        return Err(Trap(m.to_string()));
    }
    Ok(code.iter().sum())
}

impl From<CompileErrors> for DripError {
    fn from(e: CompileErrors) -> Self {
        DripError::Compile(e.0)
    }
}

impl From<Trap> for DripError {
    fn from(t: Trap) -> Self {
        DripError::Runtime(t.0)
    }
}

impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 65,
            DripError::Runtime(_) => 70,
        }
    }
}

fn run(src: &str)
    -> Result<f64, DripError> {
    let code = compile(src)?;
    let v = execute(&code)?;
    Ok(v)
}`,
    tests: `#[test]
fn a_good_program_runs() {
    assert_eq!(run("1 2 3"), Ok(6.0));
}

#[test]
fn compile_errors_are_all_kept() {
    let e = run("1 x y").unwrap_err();
    assert_eq!(e, DripError::Compile(vec![
        "line 1: expected a number, found 'x'".to_string(),
        "line 1: expected a number, found 'y'".to_string(),
    ]));
    assert_eq!(e.exit_code(), 65);
}

#[test]
fn a_trap_is_a_runtime_error() {
    let e = run("1 2 3 4 5").unwrap_err();
    assert_eq!(e, DripError::Runtime("stack overflow".to_string()));
    assert_eq!(e.exit_code(), 70);
}

#[test]
fn from_converts_each_kind() {
    let c = DripError::from(CompileErrors(vec!["e".to_string()]));
    assert_eq!(c, DripError::Compile(vec!["e".to_string()]));
    let r: DripError = Trap("t".to_string()).into();
    assert_eq!(r, DripError::Runtime("t".to_string()));
}`,
    hints: [
      'Each `from` takes the source error apart and builds a variant: the inner value of a tuple struct is `.0`, so `DripError::Compile(e.0)`.',
      '`exit_code` is a `match self` with two arms: `DripError::Compile(_) => 65` and `DripError::Runtime(_) => 70`.',
      'With both impls in place, `run` is three lines: `let code = compile(src)?;`, `let v = execute(&code)?;`, `Ok(v)`.',
    ],
    walkthrough: `**How to think about it.** The pipeline has two stages, and each stage has its own error type, because each knows only its own failures: the compiler returns all the errors it found, the VM the one that stopped it. \`run\` must return one type, \`DripError\`, so you need a rule for turning each stage's error into it. Write the two rules as \`From\` impls, and \`run\` itself needs no error handling at all beyond \`?\`.

**The solution, line by line.**

- \`impl From<CompileErrors> for DripError {\` says "here is how to make a \`DripError\` from a \`CompileErrors\`".
- \`    fn from(e: CompileErrors) -> Self { DripError::Compile(e.0) }\` takes the list out of the tuple struct (\`e.0\`, its first and only field) and puts it in the \`Compile\` variant. Nothing is lost: every message survives.
- \`impl From<Trap> for DripError { fn from(t: Trap) -> Self { DripError::Runtime(t.0) } }\` does the same for the VM's error.
- \`fn exit_code(&self) -> u8 { match self { DripError::Compile(_) => 65, DripError::Runtime(_) => 70 } }\` chooses drip-rs's codes by kind, ignoring the details with \`_\`.
- \`fn run(src: &str) -> Result<f64, DripError> {\` is the pipeline.
- \`    let code = compile(src)?;\`: on \`Ok\`, \`code\` is the compiled numbers; on \`Err(CompileErrors(..))\`, \`?\` calls \`From::from\`, which uses the \`From<CompileErrors>\` impl, and returns \`Err(DripError::Compile(..))\` at once, so \`execute\` never runs.
- \`    let v = execute(&code)?;\`: the same, with the \`Trap\` impl.
- \`    Ok(v)\` is the success value.

The last test shows both ways to call a conversion directly: \`DripError::from(...)\`, and \`.into()\`, which exists only because of the \`From\` impl.

**Common wrong attempts.**

- Keeping only the first message (\`DripError::Compile(vec![e.0[0].clone()])\`) throws away the other errors the compiler found; error recovery, from *Syntax errors and recovery*, exists so that all of them reach the user.
- Mapping the trap into \`Compile\` compiles happily (both variants hold strings), and gives the wrong exit code: an enum only helps if each conversion picks the right variant.
- Leaving out one impl makes that \`?\` in \`run\` fail with E0277, naming the missing \`From\`.`,
    wrong: [
      {
        code: `// From the compiler: every error found.
#[derive(Debug, PartialEq)]
struct CompileErrors(Vec<String>);

// From the VM: the one that stopped it.
#[derive(Debug, PartialEq)]
struct Trap(String);

#[derive(Debug, PartialEq)]
enum DripError {
    Compile(Vec<String>),
    Runtime(String),
}

fn bad(w: &str) -> String {
    let e = "expected a number";
    format!("line 1: {e}, found '{w}'")
}

// A toy compiler: numbers only.
fn compile(src: &str)
    -> Result<Vec<f64>, CompileErrors> {
    let mut code = Vec::new();
    let mut errs = Vec::new();
    for w in src.split_whitespace() {
        match w.parse::<f64>() {
            Ok(n) => code.push(n),
            Err(_) => errs.push(bad(w)),
        }
    }
    if errs.is_empty() {
        Ok(code)
    } else {
        Err(CompileErrors(errs))
    }
}

// A toy VM with four stack slots.
fn execute(code: &[f64])
    -> Result<f64, Trap> {
    if code.len() > 4 {
        let m = "stack overflow";
        return Err(Trap(m.to_string()));
    }
    Ok(code.iter().sum())
}

impl From<CompileErrors> for DripError {
    fn from(e: CompileErrors) -> Self {
        let first = e.0[0].clone();
        DripError::Compile(vec![first])
    }
}

impl From<Trap> for DripError {
    fn from(t: Trap) -> Self {
        DripError::Runtime(t.0)
    }
}

impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 65,
            DripError::Runtime(_) => 70,
        }
    }
}

fn run(src: &str)
    -> Result<f64, DripError> {
    let code = compile(src)?;
    let v = execute(&code)?;
    Ok(v)
}`,
        why: 'Only the first compile error survives. The compiler recovers precisely so that every error reaches the user.',
      },
      {
        code: `// From the compiler: every error found.
#[derive(Debug, PartialEq)]
struct CompileErrors(Vec<String>);

// From the VM: the one that stopped it.
#[derive(Debug, PartialEq)]
struct Trap(String);

#[derive(Debug, PartialEq)]
enum DripError {
    Compile(Vec<String>),
    Runtime(String),
}

fn bad(w: &str) -> String {
    let e = "expected a number";
    format!("line 1: {e}, found '{w}'")
}

// A toy compiler: numbers only.
fn compile(src: &str)
    -> Result<Vec<f64>, CompileErrors> {
    let mut code = Vec::new();
    let mut errs = Vec::new();
    for w in src.split_whitespace() {
        match w.parse::<f64>() {
            Ok(n) => code.push(n),
            Err(_) => errs.push(bad(w)),
        }
    }
    if errs.is_empty() {
        Ok(code)
    } else {
        Err(CompileErrors(errs))
    }
}

// A toy VM with four stack slots.
fn execute(code: &[f64])
    -> Result<f64, Trap> {
    if code.len() > 4 {
        let m = "stack overflow";
        return Err(Trap(m.to_string()));
    }
    Ok(code.iter().sum())
}

impl From<CompileErrors> for DripError {
    fn from(e: CompileErrors) -> Self {
        DripError::Compile(e.0)
    }
}

impl From<Trap> for DripError {
    fn from(t: Trap) -> Self {
        DripError::Compile(vec![t.0])
    }
}

impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 65,
            DripError::Runtime(_) => 70,
        }
    }
}

fn run(src: &str)
    -> Result<f64, DripError> {
    let code = compile(src)?;
    let v = execute(&code)?;
    Ok(v)
}`,
        why: 'The trap becomes a compile error, so the exit code is 65 instead of 70. The types allow it; only the tests catch it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A caller must exit with 65 after a compile error and 70 after a runtime error. Why is `Result<T, String>` a poor fit?',
    options: [
      {
        t: 'Strings are slower than enums',
        why: 'Speed is not the issue; telling the kinds apart is.',
      },
      {
        t: 'Rust does not allow `String` as an error type',
        why: 'It does: `Result<T, String>` is common in small programs.',
      },
      {
        t: 'The caller would have to search the message text to find the kind, which breaks when a message is reworded',
        correct: true,
        why: 'An enum puts the kind in the type, so a `match` decides without reading.',
      },
    ],
  },
  {
    q: 'You add a variant to your error enum. Which code fails to compile?',
    options: [
      {
        t: 'Every `match` on the enum that lists variants but has no `_` arm',
        correct: true,
        why: 'Error E0004: non-exhaustive patterns. That is the compiler finding every place that must decide about the new kind.',
      },
      {
        t: 'Every function that returns the enum',
        why: 'Returning it is fine; only code that inspects every variant must change.',
      },
      {
        t: 'None: new variants are ignored until used',
        why: 'Exhaustiveness checking is exactly what makes an enum safer than a string.',
      },
    ],
  },
  {
    q: 'In a function returning `Result<u32, CliError>`, what does `s.parse::<u32>()?` do when the parse fails?',
    options: [
      {
        t: 'Panics',
        why: '`?` never panics; it returns early.',
      },
      {
        t: 'Returns `Err(From::from(e))`, which needs `impl From<ParseIntError> for CliError`',
        correct: true,
        why: 'That is the rule the Reference gives for `?` on a `Result`.',
      },
      {
        t: 'Returns the `ParseIntError` unchanged',
        why: 'The function’s error type is `CliError`, so the error must be converted first.',
      },
    ],
  },
  {
    q: 'You write `impl From<io::Error> for CliError`. Which of these now also works?',
    options: [
      {
        t: '`let e: CliError = io_err.into();`',
        correct: true,
        why: 'Every `From<A> for B` gives `Into<B> for A` through the standard library’s blanket impl.',
      },
      {
        t: '`let e: io::Error = cli_err.into();`',
        why: 'Conversions go one way; this would need `From<CliError> for io::Error`.',
      },
      {
        t: '`?` on an `Option` in that function',
        why: '`?` on an `Option` needs the function to return an `Option`; `From` is about error types.',
      },
    ],
  },
];
