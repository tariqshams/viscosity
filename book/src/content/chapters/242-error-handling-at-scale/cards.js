// Chapter 242 cards. Keys are stable ids: never rename them.

const GIVEN = `// From the compiler: every error found.
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
    let at = format!("Error at '{w}'");
    format!("{at}: Expect number.")
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
        let m = "Stack overflow.";
        return Err(Trap(m.to_string()));
    }
    Ok(code.iter().sum())
}
`;

const FROMS = `impl From<CompileErrors> for DripError {
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

const CODES = `impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 65,
            DripError::Runtime(_) => 70,
        }
    }
}
`;

const RUN = `fn run(src: &str)
    -> Result<f64, DripError> {
    let code = compile(src)?;
    let v = execute(&code)?;
    Ok(v)
}`;

export const prompts = {
  'enum-what': {
    q: 'What is an **error enum**?',
    a: 'One enum with a variant for each way a crate’s operations can fail, so callers get one error type and can match on it.',
  },
  'enum-why': {
    q: 'Why not just return `Result<T, String>` everywhere?',
    a: 'A `String` can only be printed. Callers can’t tell kinds apart (to pick an exit code, retry, or recover) without parsing the text.',
  },
  'q-from': {
    q: 'What does `?` do with an `Err(e)` whose type differs from the function’s error type?',
    a: 'Calls `From::from(e)` to convert it, then returns the converted error.',
  },
  'from-impl': {
    q: 'What makes `fs::read_to_string(p)?` work in a function returning `Result<u32, CliError>`?',
    a: 'An `impl From<io::Error> for CliError`. Without it, the `?` is error E0277.',
  },
  'into-free': {
    q: 'You wrote `impl From<Trap> for DripError`. What do you get for free?',
    a: '`Into<DripError>` for `Trap`, so `t.into()` works too.',
  },
  'map-err': {
    q: 'When there is no `From` impl, how do you convert an error before `?`?',
    a: 'With `.map_err(...)`, as engine/rust’s CLI does with `.map_err(io)?`.',
  },
  'str-string': {
    q: 'Why does `.ok_or("not an object")?` compile in a function returning `Result<_, String>`?',
    a: 'The standard library has `impl From<&str> for String`, so `?` converts the message.',
  },
  'drip-unit': {
    q: 'drip-rs’s `RuntimeError` is a struct with no fields. Why is that enough?',
    a: 'The message and stack trace are already in the VM’s stderr lines when it is made; it only has to stop the run loop, through `?`.',
  },
  'drip-codes': {
    q: 'What exit codes does `drip-rs` use?',
    a: '0 for success, 64 for bad usage, 65 for a compile error, 70 for a runtime error, 74 if the file can’t be read.',
  },
  'compile-error-newtype': {
    q: 'What is engine/rust’s `CompileError`?',
    a: 'A newtype, `CompileError(pub String)`, with `Display` and `std::error::Error` impls. Every plugin failure is one message.',
  },
};

export const examples = {
  'cli-error': {
    lang: 'rust',
    title: 'Two kinds of failure, one error type',
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
  'no-from': {
    lang: 'rust',
    expectError: true,
    title: 'A ? with no From to call',
    code: `use std::fs;
use std::io;
use std::num::ParseIntError;

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

// No From<ParseIntError>: E0277.
fn min_size(path: &str)
    -> Result<u32, CliError> {
    let s = fs::read_to_string(path)?;
    let n = s.trim().parse::<u32>()?;
    Ok(n)
}

fn main() {
    println!("{:?}", min_size("x"));
}`,
  },
};

export const exercises = {
  dripError: {
    lang: 'rust',
    title: 'One error type for drip',
    prompt:
      'A toy `compile` returns `CompileErrors` (every error it found), and a toy `execute` returns a `Trap`. Make `DripError` work as the error type of the whole pipeline: write `From<CompileErrors>` and `From<Trap>` for it, an `exit_code` method (65 for `Compile`, 70 for `Runtime`, as drip-rs uses), and `run`, which compiles and then executes, passing either error up with `?`.',
    starter: `${GIVEN}
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
    solution: `${GIVEN}
${FROMS}
${CODES}
${RUN}`,
    tests: `#[test]
fn a_good_program_runs() {
    assert_eq!(run("1 2 3"), Ok(6.0));
}

#[test]
fn compile_errors_are_all_kept() {
    let e = run("1 x y").unwrap_err();
    assert_eq!(e, DripError::Compile(vec![
        "Error at 'x': Expect number.".to_string(),
        "Error at 'y': Expect number.".to_string(),
    ]));
    assert_eq!(e.exit_code(), 65);
}

#[test]
fn a_trap_is_a_runtime_error() {
    let e = run("1 2 3 4 5").unwrap_err();
    assert_eq!(e, DripError::Runtime("Stack overflow.".to_string()));
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
      'Each `from` builds one variant from the wrapped value: `CompileErrors` holds its `Vec` in `.0`, and `Trap` its `String`.',
      '`exit_code` is a `match self` with one arm per variant; `_` ignores the data inside.',
      'With both `From` impls in place, `run` is three lines: `let code = compile(src)?;`, `let v = execute(&code)?;`, `Ok(v)`.',
    ],
    walkthrough: `Each stage keeps the error type that suits it: the compiler collects *every* error (panic-mode recovery, chapter 67), the VM stops at the first. \`DripError\` is the one type the outside world sees.

\`\`\`rust
impl From<Trap> for DripError {
    fn from(t: Trap) -> Self {
        DripError::Runtime(t.0)
    }
}
\`\`\`

With the two impls, \`run\` contains no conversion code at all:

\`\`\`rust
let code = compile(src)?;
let v = execute(&code)?;
Ok(v)
\`\`\`

The first \`?\` sees a \`Result<_, CompileErrors>\` in a function returning \`Result<_, DripError>\`, so it calls \`DripError::from\`, and the compiler picks the \`CompileErrors\` impl by type. The second \`?\` picks the \`Trap\` one. And because you wrote \`From\`, the standard library gives you \`Into\` as well, which \`from_converts_each_kind\` uses.

\`exit_code\` puts the policy in one place. drip-rs makes the same choice in \`vm.rs\` (\`EXIT_COMPILE_ERROR = 65\`, \`EXIT_RUNTIME_ERROR = 70\`), though it returns the code inside an \`Outcome\` rather than an enum, since its messages are already written out by then.`,
    wrong: [
      {
        code: `${GIVEN}
${FROMS}
impl DripError {
    fn exit_code(&self) -> u8 {
        match self {
            DripError::Compile(_) => 70,
            DripError::Runtime(_) => 65,
        }
    }
}

${RUN}`,
        why: 'The codes are swapped. In the `sysexits.h` convention drip-rs and clox follow, 65 means bad input data (a compile error) and 70 an internal software error (a runtime error).',
      },
      {
        code: `${GIVEN}
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

${CODES}
${RUN}`,
        why: 'This throws away every compile error but the first. The compiler worked to find them all; keep the whole `Vec`.',
      },
      {
        code: `${GIVEN}
${CODES}
${RUN}`,
        why: 'Without the `From` impls, neither `?` can turn its error into a `DripError`, so this doesn’t compile (E0277: `?` couldn’t convert the error).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A function returns `Result<u32, CliError>` and calls `s.parse::<u32>()?`, but `CliError` has no `From<ParseIntError>`. What happens?',
    options: [
      { t: 'The error is converted to a string automatically', why: 'Nothing is converted unless a `From` impl says how.' },
      { t: 'It compiles, and panics if the parse fails', why: 'The type mismatch is found at compile time.' },
      { t: 'Compile error E0277: `?` couldn’t convert the error to `CliError`', correct: true, why: 'Rust 1.97 adds that `CliError` needs to implement `From<ParseIntError>`.' },
    ],
  },
  {
    q: 'What does `?` do with `Ok(v)`?',
    options: [
      { t: 'Evaluates to `v`, and the function carries on', correct: true, why: 'Only an `Err` makes it return early.' },
      { t: 'Returns `Ok(v)` from the function', why: 'That would end the function on success. `?` unwraps the `Ok` instead.' },
      { t: 'Calls `From::from(v)`', why: '`From` is called on the error, not the success value.' },
    ],
  },
  {
    q: 'Why does drip-rs’s `RuntimeError` carry no message?',
    options: [
      { t: 'Rust enums can’t hold strings', why: 'They can; `DripError::Runtime(String)` does.' },
      { t: 'It is a bug', why: 'It is a choice: like the TypeScript VM, drip-rs records the message and trace at the moment of the error.' },
      { t: 'By the time it exists, `runtime_error` has already pushed the message and stack trace into the VM’s stderr lines, so it only signals “stop”', correct: true, why: 'The run loop returns it through `?`, and `interpret` turns it into exit code 70.' },
      { t: 'So it fits in a register', why: 'Speed isn’t the reason; it is about where the message already went.' },
    ],
  },
  {
    q: 'engine/rust’s `CompileError` is a single `String`, and the CLI’s helpers return `String` errors too. When is that a reasonable design?',
    options: [
      { t: 'When the only thing a caller does with an error is print it and exit with failure', correct: true, why: 'That is all `main` does with most of them. The CLI adds a two-variant `CliError` only because usage errors also print the help text.' },
      { t: 'Never: an error enum is always better', why: 'An enum costs code. If nobody matches on it, a message is enough.' },
      { t: 'Only in WebAssembly', why: 'The CLI is a native binary. The wasm crate turns `CompileError` into `JsError` instead.' },
    ],
  },
  {
    q: 'You write `impl From<Trap> for DripError`. Which line now also compiles?',
    options: [
      { t: '`let t: Trap = drip_error.into();`', why: 'That is the reverse conversion, which you didn’t write.' },
      { t: '`let e: DripError = trap.into();`', correct: true, why: 'The standard library implements `Into` for you whenever `From` exists in the other direction.' },
      { t: '`let s: String = trap.into();`', why: 'Nothing converts a `Trap` into a `String`.' },
      { t: 'None: `Into` must be written separately', why: 'The std docs advise implementing `From` precisely because `Into` comes free.' },
    ],
  },
  {
    q: 'Which exit code does `drip-rs` give a program with a syntax error?',
    options: [
      { t: '1', why: 'drip-rs follows the `sysexits.h` codes, like clox.' },
      { t: '70', why: '70 is for runtime errors.' },
      { t: '64', why: '64 is for bad command-line usage.' },
      { t: '65', correct: true, why: '`EXIT_COMPILE_ERROR` in `vm.rs`.' },
    ],
  },
];
