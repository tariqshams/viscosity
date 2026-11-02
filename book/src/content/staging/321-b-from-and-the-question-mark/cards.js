// Chapter 321-b cards (From and the question mark, split from chapter
// 321). Keys are stable ids: never rename them. rustc messages are
// rustc 1.97.0's.

const CLI = `use std::fs;
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
}`;

const BASE = `// From the compiler: every error found.
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
`;

const FROMS = `
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
`;

const CODE = `
impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 65,
            DripError::Runtime(_) => 70,
        }
    }
}
`;

const RUN = `
fn run(src: &str)
    -> Result<f64, DripError> {
    let code = compile(src)?;
    let v = execute(&code)?;
    Ok(v)
}`;

export const prompts = {
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
  e0277: {
    q: 'What does rustc’s E0277 message say when a `?` cannot convert an error?',
    a: '“`?` couldn’t convert the error to `CliError`”: the trait `From<ParseIntError>` is not implemented for `CliError`. It names the missing impl.',
  },
  'str-string': {
    q: 'Why does `.ok_or("not an object")?` compile in a function returning `Result<_, String>`?',
    a: 'The standard library has `impl From<&str> for String`, so `?` converts the message.',
  },
  'impl-into': {
    q: 'drip-rs’s `runtime_error` takes `message: impl Into<String>`. What can callers pass, and why?',
    a: 'A `&str` literal or a `String` (from `format!`): both implement `Into<String>`, thanks to the standard library’s `From` impls.',
  },
  'cli-from-string': {
    q: 'engine/rust’s CLI has `impl From<String> for CliError`. What does it let `?` do?',
    a: 'Lift the plain `String` errors of its helper functions into `CliError::Other` with a bare `?`.',
  },
  'map-err-once': {
    q: 'engine/rust’s CLI writes `let io = |e: std::io::Error| CliError::Other(e.to_string());`. What for?',
    a: 'To convert `io::Error`s by hand with `.map_err(io)?` where it has no `From<io::Error>` impl, writing the conversion once and reusing it.',
  },
};

export const examples = {
  'cli-error': {
    lang: 'rust',
    title: 'One error enum, two From impls',
    code: CLI,
  },
};

export const exercises = {
  dripError: {
    lang: 'rust',
    title: 'One error type for a pipeline',
    prompt:
      'A toy `compile` returns `CompileErrors` (every error it found), and a toy `execute` returns a `Trap`. Make `DripError` the error type of the whole pipeline: write `From<CompileErrors>` and `From<Trap>` for it, an `exit_code` method (65 for `Compile`, 70 for `Runtime`, as drip-rs uses), and `run`, which compiles and then executes, passing either error up with `?`.',
    starter: `${BASE}
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
    solution: `${BASE}${FROMS}${CODE}${RUN}`,
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
- \`    let code = compile(src)?;\`: on \`Ok\`, \`code\` is the compiled numbers; on \`Err(CompileErrors(..))\`, \`?\` calls \`From::from\`, which picks the first impl, and returns \`Err(DripError::Compile(..))\` at once, so \`execute\` never runs.
- \`    let v = execute(&code)?;\`: the same, with the \`Trap\` impl.
- \`    Ok(v)\` is the success value.

The last test shows both ways to call a conversion directly: \`DripError::from(...)\`, and \`.into()\`, which exists only because of the \`From\` impl.

**Common wrong attempts.**

- Keeping only the first message (\`DripError::Compile(vec![e.0[0].clone()])\`) throws away the other errors the compiler found; error recovery, from *Syntax errors and recovery*, exists so that all of them reach the user.
- Mapping the trap into \`Compile\` compiles happily (both variants hold strings), and gives the wrong exit code: an enum only helps if each conversion picks the right variant.
- Leaving out one impl makes that \`?\` in \`run\` fail with E0277, naming the missing \`From\`.`,
    wrong: [
      {
        code: `${BASE}
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
${CODE}${RUN}`,
        why: 'Only the first compile error survives. The compiler recovers precisely so that every error reaches the user.',
      },
      {
        code: `${BASE}
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
${CODE}${RUN}`,
        why: 'The trap becomes a compile error, so the exit code is 65 instead of 70. The types allow it; only the tests catch it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a function returning `Result<u32, CliError>`, what does `s.parse::<u32>()?` do when the parse fails?',
    options: [
      { t: 'Panics', why: '`?` never panics; it returns early.' },
      { t: 'Returns `Err(From::from(e))`, which needs `impl From<ParseIntError> for CliError`', correct: true, why: 'That is the rule the Reference gives for `?` on a `Result`.' },
      { t: 'Returns the `ParseIntError` unchanged', why: 'The function’s error type is `CliError`, so the error must be converted first.' },
    ],
  },
  {
    q: 'You write `impl From<io::Error> for CliError`. Which of these now also works?',
    options: [
      { t: '`let e: CliError = io_err.into();`', correct: true, why: 'Every `From<A> for B` gives `Into<B> for A` through the standard library’s blanket impl.' },
      { t: '`let e: io::Error = cli_err.into();`', why: 'Conversions go one way; this would need `From<CliError> for io::Error`.' },
      { t: '`?` on an `Option` in that function', why: '`?` on an `Option` needs the function to return an `Option`; `From` is about error types.' },
    ],
  },
  {
    q: 'The second `?` in `min_size` fails with E0277. What is the quickest correct fix?',
    options: [
      { t: 'Change the function to return `Result<u32, ParseIntError>`', why: 'Then the first `?`, on an `io::Error`, would fail instead.' },
      { t: 'Add `.unwrap()` before the `?`', why: 'That turns a bad file into a panic, and `unwrap` returns a `u32`, not a `Result`, so `?` no longer applies.' },
      { t: 'Add `impl From<ParseIntError> for CliError`, or convert that one call with `map_err`', correct: true, why: 'Either gives `?` an error of the right type; the impl helps every future `?` too.' },
    ],
  },
  {
    q: 'Why does `.ok_or("not an object")?` work in a function returning `Result<_, String>`?',
    options: [
      { t: '`?` turns any error into a `String`', why: 'Only types with a `From` impl into `String` convert.' },
      { t: '`ok_or` returns a `String` error', why: 'It returns `Err(&str)` here; the conversion happens in `?`.' },
      { t: 'The standard library implements `From<&str> for String`, and `?` uses it', correct: true, why: 'engine/rust’s `read_profile` relies on exactly this.' },
    ],
  },
  {
    q: 'drip-rs declares `fn runtime_error(&mut self, message: impl Into<String>)`. Which calls compile?',
    options: [
      { t: 'Only `self.runtime_error("stack overflow".to_string())`', why: 'A `&str` works too: `&str` implements `Into<String>`.' },
      { t: 'Only `self.runtime_error("stack overflow")`', why: 'A `String` works too: every type converts into itself.' },
      { t: 'Both, and so does a `format!(...)` result', correct: true, why: 'Anything with `Into<String>` is accepted, and the body calls `message.into()` once.' },
    ],
  },
];
