// Chapter 342 cards. Keys are stable ids: never rename them.

const PRE = `#[derive(Debug, PartialEq, Default)]
enum Mode {
    #[default]
    Auto,
    OptIn,
}

#[derive(Debug, PartialEq)]
enum CliError {
    Usage(String),
    Other(String),
}

#[derive(Debug, PartialEq, Default)]
struct Args {
    files: Vec<String>,
    out: String,
    frames: bool,
    mode: Mode,
}

// The CLI's own messages, as usage
// errors (printed with the help).
fn usage(m: &str) -> CliError {
    CliError::Usage(m.to_string())
}
fn needs(w: &str) -> CliError {
    usage(&format!(
        "{w} needs a value"
    ))
}
fn unknown(w: &str) -> CliError {
    usage(&format!(
        "unknown option {w}"
    ))
}
const BAD_MODE: &str =
    "--mode must be auto or opt-in";

// \`argv\`: the words after the command.
`;

export const prompts = {
  'cli-three-outputs': {
    q: 'Besides what it prints, what does a CLI hand back to whoever ran it?',
    a: 'An exit status: 0 for success, non-zero (1 in Viscosity) for failure. Scripts read it without parsing any text.',
  },
  'stderr-why': {
    q: 'Why do CLIs write errors to stderr instead of stdout?',
    a: 'So that a user can redirect the results (stdout) to a file and still see the errors on screen.',
  },
  'next-closure': {
    q: 'In `parse_args`, what does the `next` closure do?',
    a: 'Moves the index on by one and returns that word as the flag’s value, or a usage error “X needs a value” if there are no words left.',
  },
  positional: {
    q: 'How does `parse_args` decide that a word is a file?',
    a: 'It doesn’t start with `-` and isn’t the value of an option. So files and flags can come in any order.',
  },
  'usage-vs-other': {
    q: 'Which errors make the Viscosity CLI print its help text?',
    a: 'Only `CliError::Usage`: the command line itself was wrong (unknown option, missing value, no files). A missing file or a syntax error is `Other`, with no help.',
  },
  'exit-one': {
    q: 'What exit status does the Viscosity CLI use for a usage error, and for a compile error?',
    a: '1 for both (`ExitCode::FAILURE`). Success is 0.',
  },
  'version-source': {
    q: 'Where does the Rust CLI’s `--version` number come from?',
    a: '`env!("CARGO_PKG_VERSION")`, filled in at compile time from the workspace version in `Cargo.toml`. The TS CLI reads `package.json` at run time.',
  },
  'multi-fail': {
    q: 'With several files, one has a syntax error. What happens?',
    a: 'It is reported as `viscosity: bad.js: <error>` on stderr, the other files still compile and print, and the exit status is 1.',
  },
  'clap-diff': {
    q: 'Name two ways a clap-based Viscosity CLI would behave differently.',
    a: 'Different error messages and help layout; exit status 2 for usage errors; `--min-size 0x10` refused and `inf` accepted, unlike JavaScript’s `Number()`.',
  },
  'why-hand': {
    q: 'Why is a hand-written parser a reasonable choice for the Rust port of Viscosity?',
    a: 'The port must behave exactly like the TypeScript CLI (messages, number parsing, exit statuses), and tests compare the two. Hand-written code can copy that; clap would choose its own.',
  },
};

export const examples = {
  dispatch: {
    lang: 'rust',
    title: 'Two kinds of error, one exit status',
    code: `// A sketch of main in crates/cli: two
// kinds of error, one exit status.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

fn run(
    argv: &[&str],
) -> Result<String, CliError> {
    if argv.len() < 2 {
        return Err(Usage(
            "missing <file>".into(),
        ));
    }
    if argv[0] != "explain" {
        return Err(Usage(format!(
            "unknown command \\"{}\\"",
            argv[0]
        )));
    }
    let f = argv[1];
    if f.starts_with('-') {
        return Err(Usage(format!(
            "unknown option {f}"
        )));
    }
    if f == "gone.js" {
        let e = "No such file or \\
            directory (os error 2)";
        return Err(Other(format!(
            "cannot read {f}: {e}"
        )));
    }
    Ok(format!("{f}: no arrays found"))
}

// What main prints; its exit status.
fn report(argv: &[&str]) -> u8 {
    let e = match run(argv) {
        Ok(out) => {
            println!("out| {out}");
            return 0;
        }
        Err(e) => e,
    };
    let (msg, usage) = match e {
        Usage(m) => (m, true),
        Other(m) => (m, false),
    };
    println!("err| viscosity: {msg}");
    if usage {
        println!("err|");
        println!("err| (help text)");
    }
    1
}

fn main() {
    let tries: [&[&str]; 5] = [
        &["explain", "a.js"],
        &["explian", "a.js"],
        &["explain", "--fast"],
        &["explain"],
        &["explain", "gone.js"],
    ];
    for argv in tries {
        let line = argv.join(" ");
        println!("$ viscosity {line}");
        let code = report(argv);
        println!("exit {code}\\n");
    }
}
`,
  },
};

export const exercises = {
  parse: {
    lang: 'rust',
    title: 'A small argument parser',
    prompt:
      'Write `parse`, which turns the words after the command into `Args`. A word without a leading `-` is a file. `-o` and `--out` take the next word as `out`; `--frames` sets `frames`; `--mode` takes `auto` or `opt-in`, and anything else is `usage(BAD_MODE)`. A flag whose value is missing is `needs(flag)`, and any other word starting with `-` is `unknown(word)`. Stop at the first error.',
    starter: `${PRE}fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    todo!()
}`,
    solution: `${PRE}fn mode(
    v: &str,
) -> Result<Mode, CliError> {
    match v {
        "auto" => Ok(Mode::Auto),
        "opt-in" => Ok(Mode::OptIn),
        _ => Err(usage(BAD_MODE)),
    }
}

fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    let mut a = Args::default();
    let mut it = argv.iter();
    while let Some(&w) = it.next() {
        let mut next = || {
            it.next()
                .map(|v| v.to_string())
                .ok_or_else(|| needs(w))
        };
        match w {
            "-o" | "--out" => {
                a.out = next()?;
            }
            "--frames" => {
                a.frames = true;
            }
            "--mode" => {
                let v = next()?;
                a.mode = mode(&v)?;
            }
            _ if w.starts_with('-') => {
                return Err(unknown(w));
            }
            _ => a.files.push(w.into()),
        }
    }
    Ok(a)
}`,
    tests: `fn strs(xs: &[&str]) -> Vec<String> {
    xs.iter().map(|x| x.to_string())
        .collect()
}

#[test]
fn files_and_flags_in_any_order() {
    let a = parse(&[
        "a.js", "-o", "out/",
        "b.js", "--frames",
    ])
    .unwrap();
    let want = strs(&["a.js", "b.js"]);
    assert_eq!(a.files, want);
    assert_eq!(a.out, "out/");
    assert!(a.frames);
    assert_eq!(a.mode, Mode::Auto);
}

#[test]
fn mode_takes_one_of_two_values() {
    let a = ["--mode", "opt-in"];
    let a = parse(&a).unwrap();
    assert_eq!(a.mode, Mode::OptIn);
    let b = ["x.js", "--mode", "fast"];
    let e = parse(&b).unwrap_err();
    assert_eq!(e, usage(BAD_MODE));
}

#[test]
fn a_missing_value_is_a_usage_error() {
    let e = parse(&["x.js", "-o"]);
    assert_eq!(e, Err(needs("-o")));
    let e = parse(&["x.js", "--mode"]);
    assert_eq!(e, Err(needs("--mode")));
}

#[test]
fn unknown_options_are_refused() {
    let e = parse(&["--fast", "x.js"]);
    let want = unknown("--fast");
    assert_eq!(e, Err(want));
}

#[test]
fn no_words_is_no_files() {
    let a = parse(&[]).unwrap();
    assert_eq!(a, Args::default());
}
`,
    hints: [
      'Keep an iterator, `let mut it = argv.iter();`, and loop with `while let Some(&w) = it.next()`. Then the value of `-o` is just one more `it.next()`, and the loop never sees it as a word of its own.',
      'A missing value is `None` from `it.next()`. `.ok_or_else(|| needs(w))` turns it into an `Err`, and `?` returns it. A small closure `next` saves writing that twice.',
      'Order the `match` arms: the exact flags first, then `_ if w.starts_with(\'-\')` for unknown options, then `_` for files. Put the `--mode` value check in a helper `fn mode(v: &str) -> Result<Mode, CliError>`.',
    ],
    walkthrough: `This is \`parse_args\` from \`engine/rust/crates/cli/src/main.rs\`, cut down to four flags.

- **Why an iterator.** An option *consumes* the next word. With \`it.next()\` inside the loop, the value is taken from the same iterator the \`while let\` reads, so it can’t come round again as a file. The real code does the same with an index \`i\` that its \`next\` closure increments.
- **Why a closure.** \`next\` captures \`it\` (mutably) and \`w\` (for the message). Each call either gives the value or a ready-made usage error, so \`a.out = next()?;\` is one line per option.
- **Why usage errors.** Everything here is the command line’s fault, so it is \`CliError::Usage\`, and \`main\` will print the help under it. A missing *file* would be found later, in \`run\`, and be \`Other\`.
- **Why the arm order.** \`match\` tries arms top to bottom. The guard arm \`_ if w.starts_with('-')\` must come after the real flags and before the catch-all, or \`--frames\` would be an unknown option, or \`--fast\` a file.`,
    wrong: [
      {
        code: `${PRE}fn mode(
    v: &str,
) -> Result<Mode, CliError> {
    match v {
        "auto" => Ok(Mode::Auto),
        "opt-in" => Ok(Mode::OptIn),
        _ => Err(usage(BAD_MODE)),
    }
}

fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    let mut a = Args::default();
    let mut it = argv.iter();
    while let Some(&w) = it.next() {
        let mut next = || {
            let v = it.next().unwrap();
            v.to_string()
        };
        match w {
            "-o" | "--out" => {
                a.out = next();
            }
            "--frames" => {
                a.frames = true;
            }
            "--mode" => {
                let v = next();
                a.mode = mode(&v)?;
            }
            _ if w.starts_with('-') => {
                return Err(unknown(w));
            }
            _ => a.files.push(w.into()),
        }
    }
    Ok(a)
}`,
        why: '`unwrap()` panics when a flag is the last word. A CLI should report “-o needs a value” and exit 1, not crash.',
      },
      {
        code: `${PRE}fn mode(
    v: &str,
) -> Result<Mode, CliError> {
    match v {
        "auto" => Ok(Mode::Auto),
        "opt-in" => Ok(Mode::OptIn),
        _ => Err(usage(BAD_MODE)),
    }
}

fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    let mut a = Args::default();
    let mut it = argv.iter();
    while let Some(&w) = it.next() {
        let mut next = || {
            it.next()
                .map(|v| v.to_string())
                .ok_or_else(|| needs(w))
        };
        match w {
            "-o" | "--out" => {
                a.out = next()?;
            }
            "--frames" => {
                a.frames = true;
            }
            "--mode" => {
                let v = next()?;
                a.mode = mode(&v)?;
            }
            _ => a.files.push(w.into()),
        }
    }
    Ok(a)
}`,
        why: 'Without the `starts_with(\'-\')` arm, `--fast` is taken as a file name. A typo in a flag should be an error, not a missing file later on.',
      },
      {
        code: `${PRE}fn mode(
    v: &str,
) -> Result<Mode, CliError> {
    match v {
        "auto" => Ok(Mode::Auto),
        "opt-in" => Ok(Mode::OptIn),
        _ => Err(usage(BAD_MODE)),
    }
}

fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    let mut a = Args::default();
    for i in 0..argv.len() {
        let w = argv[i];
        let next = || {
            argv.get(i + 1)
                .map(|v| v.to_string())
                .ok_or_else(|| needs(w))
        };
        match w {
            "-o" | "--out" => {
                a.out = next()?;
            }
            "--frames" => {
                a.frames = true;
            }
            "--mode" => {
                let v = next()?;
                a.mode = mode(&v)?;
            }
            _ if w.starts_with('-') => {
                return Err(unknown(w));
            }
            _ => a.files.push(w.into()),
        }
    }
    Ok(a)
}`,
        why: 'Peeking at `argv[i + 1]` reads the value but doesn’t skip it, so the loop comes back and adds `out/` to the files too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You run `viscosity build app.js > out.js` and `app.js` has a syntax error. Where does the error message go?',
    options: [
      { t: 'Into `out.js`', why: 'Only stdout is redirected. Errors go to stderr, which still goes to the terminal.' },
      { t: 'To the terminal, on stderr', correct: true, why: 'That is the point of two streams: the results can go to a file while the errors stay visible.' },
      { t: 'Nowhere: the CLI exits silently', why: 'It prints `viscosity: Unexpected token (1:6)` or the like, a message and a position, and exits with status 1.' },
    ],
  },
  {
    q: 'Which command line makes the Rust CLI print its help text after the error?',
    options: [
      { t: '`viscosity explain missing.js` (no such file)', why: 'A missing file is `CliError::Other`: the command line was fine.' },
      { t: '`viscosity explain bad.js` (a syntax error)', why: 'Also `Other`. The help wouldn’t help.' },
      { t: '`viscosity explain a.js --mode fast`', correct: true, why: 'An invalid flag value is a usage error, so the message is followed by a blank line and the help.' },
      { t: '`viscosity --version`', why: 'That succeeds and prints `viscosity 0.0.1`.' },
    ],
  },
  {
    q: '`viscosity build a.js b.js -o out/` succeeds for `a.js`, and `b.js` has a syntax error. What is the result?',
    options: [
      { t: 'Nothing is written, exit status 1', why: 'Files are independent: `out/a.js` is still written.' },
      { t: '`out/a.js` is written, the error for `b.js` is printed, exit status 1', correct: true, why: 'That is `Ok(false)` from `run`: the run worked, one file didn’t.' },
      { t: '`out/a.js` is written, exit status 0', why: 'A failed file makes the status 1, so a script notices.' },
      { t: 'The help is printed', why: 'The command line was fine, so this is not a usage error.' },
    ],
  },
  {
    q: 'Where does `viscosity --version` get `0.0.1` in the Rust CLI?',
    options: [
      { t: 'From `Cargo.toml`, at compile time, through `env!("CARGO_PKG_VERSION")`', correct: true, why: 'Cargo sets that variable while compiling, so the version is baked into the binary.' },
      { t: 'From `package.json`, read when it runs', why: 'That is how the TypeScript CLI does it.' },
      { t: 'From the latest git tag', why: 'The repository has no tags, and the CLI never looks at git.' },
    ],
  },
  {
    q: 'A clap version of the CLI, built for this chapter, exited with status 2 on an unknown option. Why does that matter for Viscosity?',
    options: [
      { t: 'It doesn’t: any non-zero status means failure', why: 'Scripts and tests can compare exact statuses, and Viscosity’s tests compare the two CLIs’ statuses.' },
      { t: 'Status 2 means the program crashed', why: 'A Rust panic gave 101 in this chapter’s run. 2 is clap’s usage-error code.' },
      { t: 'The TypeScript CLI exits 1, and the two CLIs are meant to behave the same', correct: true, why: 'Parity covers what users and scripts see: output, messages and exit statuses.' },
    ],
  },
];
