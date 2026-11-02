// Chapter 88 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 164, 164.

export const prompts = {
  'cli-three-outputs': {
    q: 'Besides what it prints, what does a CLI hand back to whoever ran it?',
    a: 'An exit status: 0 for success, non-zero (1 in Viscosity) for failure. Scripts read it without parsing any text.',
  },
  'stderr-why': {
    q: 'Why do CLIs write errors to stderr instead of stdout?',
    a: 'So that a user can redirect the results (stdout) to a file and still see the errors on screen.',
  },
  'dollar-q': {
    q: 'In a shell, what does `$?` hold right after a command finishes?',
    a: 'That command’s exit status: `0` if it succeeded, something else if it failed.',
  },
  'usage-vs-other': {
    q: 'Which errors make the Viscosity CLI print its help text?',
    a: 'Only `CliError::Usage`: the command line itself was wrong (unknown option, missing value, no files). A missing file or a syntax error is `Other`, with no help.',
  },
  'exit-one': {
    q: 'What exit status does the Viscosity CLI use for a usage error, and for a compile error?',
    a: '1 for both (`ExitCode::FAILURE`). Success is 0. Only the printed text differs.',
  },
  okfalse: {
    q: 'What does it mean when `run` returns `Ok(false)`?',
    a: 'The run itself worked, but at least one of several files failed: its error was printed, the others compiled, and the status is 1.',
  },
  'version-source': {
    q: 'Where does the Rust CLI’s `--version` number come from?',
    a: '`env!("CARGO_PKG_VERSION")`, filled in at compile time from the workspace version in `Cargo.toml`. The TS CLI reads `package.json` at run time.',
  },
  'multi-fail': {
    q: 'With several files, one has a syntax error. What happens?',
    a: 'It is reported as `viscosity: bad.js: <error>` on stderr, the other files still compile and print, and the exit status is 1.',
  },
  'flag-vs-option': {
    q: 'What is the difference between a flag like `--frames` and an option like `-o`?',
    a: 'A flag is a switch, on if present. An option takes the next word as its value.',
  },
  'regular-grammar': {
    q: 'Why can one simple loop read a whole Viscosity command line?',
    a: 'Its grammar is regular: a flat sequence of words with nothing nested, so looking at one word at a time (plus the next, for an option’s value) is enough.',
  },
  'next-closure': {
    q: 'In `parse_args`, what does the `next_os` closure do?',
    a: 'Moves the index on by one and returns that word as the option’s value, or a usage error “X needs a value” if there are no words left.',
  },
  positional: {
    q: 'How does `parse_args` decide that a word is a file?',
    a: 'It doesn’t start with `-` and isn’t the value of an option. So files and flags can come in any order.',
  },
  'arm-order': {
    q: 'Why must the arm `_ if !a.starts_with(\'-\')` come after the real flags and before the final `_`?',
    a: '`match` tries arms top to bottom. Earlier, it would never see a flag; without it, every file would be an “unknown option”; after the final `_`, it would never run.',
  },
  'js-number': {
    q: 'Why does the Rust CLI read `--min-size` with `js_to_number` instead of `str::parse`?',
    a: 'To match the TypeScript CLI, which uses JavaScript’s `Number()`: it accepts `0x10` (16) and `" 12 "`, and refuses `inf`, unlike Rust’s parser.',
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
    Ok("No arrays of objects found."
        .to_string())
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
  numbers: {
    lang: 'rust',
    title: 'Number() is not str::parse',
    code: `// A cut-down js_to_number from the
// CLI (the real one also reads 0o, 0b
// and Infinity): JavaScript's Number().
fn js_to_number(s: &str) -> f64 {
    let t = s.trim();
    if t.is_empty() {
        return 0.0;
    }
    let hex = t.strip_prefix("0x");
    if let Some(h) = hex {
        let v =
            u64::from_str_radix(h, 16);
        return match v {
            Ok(v) => v as f64,
            Err(_) => f64::NAN,
        };
    }
    let ok = t.chars().all(|c| {
        c.is_ascii_digit()
            || ".eE+-".contains(c)
    });
    if ok {
        t.parse().unwrap_or(f64::NAN)
    } else {
        f64::NAN
    }
}

fn main() {
    let tries = [
        "64", " 12 ", "", "1e3",
        "0x10", "inf", "abc",
    ];
    for s in tries {
        let rs: Result<f64, _> =
            s.parse();
        println!(
            "{:>6}  js {:<5} rust {:?}",
            format!("{s:?}"),
            js_to_number(s),
            rs.ok()
        );
    }
}
`,
  },
};

export const exercises = {
  finish: {
    lang: 'rust',
    title: 'How main ends a run',
    prompt: 'Write `finish`, the end of `main`. Given what `run` returned, return the text for stderr and the exit status. `Ok(true)`: nothing, status 0. `Ok(false)`: nothing more (the failed files were already reported), status 1. `Err(Usage(e))`: `viscosity: ` and the message, a blank line, then `HELP`, status 1. `Err(Other(e))`: `viscosity: ` and the message on one line, status 1.',
    starter: `// The two kinds of failure, as in
// engine/rust/crates/cli/src/main.rs.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

// Stands in for the real 27-line help.
const HELP: &str = "(the help text)\\n";

// What run() returned. finish gives
// the text for stderr and the status.
fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    todo!()
}`,
    solution: `// The two kinds of failure, as in
// engine/rust/crates/cli/src/main.rs.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

// Stands in for the real 27-line help.
const HELP: &str = "(the help text)\\n";

// What run() returned. finish gives
// the text for stderr and the status.
fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    match r {
        Ok(true) => (String::new(), 0),
        Ok(false) => (String::new(), 1),
        Err(Usage(e)) => {
            let t = format!(
              "viscosity: {e}\\n\\n{HELP}"
            );
            (t, 1)
        }
        Err(Other(e)) => {
            let t = format!(
                "viscosity: {e}\\n"
            );
            (t, 1)
        }
    }
}`,
    tests: `#[test]
fn success_is_silent_and_zero() {
    let (t, c) = finish(Ok(true));
    assert_eq!(t, "");
    assert_eq!(c, 0);
}

#[test]
fn a_failed_file_is_status_one() {
    let (t, c) = finish(Ok(false));
    assert_eq!(t, "");
    assert_eq!(c, 1);
}

#[test]
fn a_usage_error_shows_the_help() {
    let e = Usage("missing <file>".into());
    let (t, c) = finish(Err(e));
    assert_eq!(
        t,
        "viscosity: missing <file>\\n\\n\\
         (the help text)\\n"
    );
    assert_eq!(c, 1);
}

#[test]
fn other_errors_are_one_line() {
    let e = Other("no such file".into());
    let (t, c) = finish(Err(e));
    assert_eq!(t, "viscosity: no such file\\n");
    assert_eq!(c, 1);
}
`,
    hints: [
      'There are exactly four cases, and `match` can name all four: `Ok(true)`, `Ok(false)`, `Err(Usage(e))` and `Err(Other(e))`. Patterns can reach inside a `Result` and an enum at once.',
      'Every case returns a pair `(String, u8)`. Only the first has status 0. The two `Ok` cases print nothing new, so their text is `String::new()`.',
      'For the two errors, build the text with `format!`: `"viscosity: {e}\\n\\n{HELP}"` for a usage error (two newlines make one blank line) and `"viscosity: {e}\\n"` for any other.',
    ],
    walkthrough: `**How to think about it.** Start from the chapter's step-through: there were four ways a run could end once \`run\` had returned, and each one decided two things, the text written to stderr and the number handed back to the shell. So the answer is a table with four rows, and in Rust a table of cases over an enum is a \`match\`. Write the four patterns first, and only then fill in what each returns.

It also helps to notice what the four rows share. Three of them end with status 1; only success is 0. Two of them write nothing at all (for \`Ok(false)\`, the failed files were already reported, one line each, by \`run\` itself). The two errors both begin with \`viscosity: \`, and differ only in what comes after the message.

**The solution, line by line.**

- \`fn finish(r: Result<bool, CliError>) -> (String, u8) {\` takes the result by value (we are done with it, so taking ownership is fine) and returns a tuple: the stderr text and the status. A \`u8\` holds 0 to 255, exactly the range of an exit status.
- \`match r {\` looks at the result once and picks the first arm whose pattern fits.
- \`Ok(true) => (String::new(), 0),\` is success: an empty string, status 0. \`String::new()\` makes an empty \`String\` without allocating.
- \`Ok(false) => (String::new(), 1),\` is "the run worked, a file did not": nothing new to say, status 1.
- \`Err(Usage(e)) => {\` reaches two levels in at once: the \`Err\` of the \`Result\`, then the \`Usage\` variant of \`CliError\`, binding its message to \`e\`. (\`use CliError::*;\` in the preamble is what lets us write \`Usage\` rather than \`CliError::Usage\`.)
- \`let t = format!("viscosity: {e}\\\\n\\\\n{HELP}");\` builds the text. \`{e}\` and \`{HELP}\` are filled in from the variables of those names; the two \`\\\\n\` give the line break after the message and then one empty line.
- \`(t, 1)\` returns the pair.
- \`Err(Other(e)) => { ... }\` is the same shape with \`"viscosity: {e}\\\\n"\`: one line, no help.
- The closing braces end the \`match\` and the function. Because \`match\` is an expression in Rust, its value is the function's result, with no \`return\` needed.

Rust checks that the four arms cover every possibility: if you forgot \`Ok(false)\`, the compiler would refuse with "non-exhaustive patterns: \`Ok(false)\` not covered". That is one reason the real CLI's \`main\` is a single \`match\`: the compiler guarantees that no way of ending is forgotten.

**Common wrong attempts.**

- Printing the help for every error. It is tempting to treat all errors alike, but the help would then bury "cannot read gone.js", which is the only line the user needs. The \`other_errors_are_one_line\` test catches it.
- Returning 0 for \`Ok(false)\`. The run "worked", so 0 feels natural; however, a script that runs \`viscosity build\` over many files must be able to tell that one failed, and the exit status is the only thing it reads.
- Writing \`"viscosity: {e}\\\\n{HELP}"\` with one newline. The help then starts on the very next line, with no blank line between, which is not what either CLI prints; the usage test compares the exact text.`,
    wrong: [
      {
        code: `// The two kinds of failure, as in
// engine/rust/crates/cli/src/main.rs.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

// Stands in for the real 27-line help.
const HELP: &str = "(the help text)\\n";

// What run() returned. finish gives
// the text for stderr and the status.
fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    match r {
        Ok(true) => (String::new(), 0),
        Ok(false) => (String::new(), 1),
        Err(Usage(e) | Other(e)) => {
            let t = format!(
              "viscosity: {e}\\n\\n{HELP}"
            );
            (t, 1)
        }
    }
}`,
        why: 'Every error gets the help, so a missing file’s one useful line is buried under it. Only a usage error should show the help.',
      },
      {
        code: `// The two kinds of failure, as in
// engine/rust/crates/cli/src/main.rs.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

// Stands in for the real 27-line help.
const HELP: &str = "(the help text)\\n";

// What run() returned. finish gives
// the text for stderr and the status.
fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    match r {
        Ok(_) => (String::new(), 0),
        Err(Usage(e)) => {
            let t = format!(
              "viscosity: {e}\\n\\n{HELP}"
            );
            (t, 1)
        }
        Err(Other(e)) => {
            let t = format!(
                "viscosity: {e}\\n"
            );
            (t, 1)
        }
    }
}`,
        why: '`Ok(false)` exits 0, so a script cannot tell that one of its files failed. Only `Ok(true)` is success.',
      },
      {
        code: `// The two kinds of failure, as in
// engine/rust/crates/cli/src/main.rs.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}
use CliError::*;

// Stands in for the real 27-line help.
const HELP: &str = "(the help text)\\n";

// What run() returned. finish gives
// the text for stderr and the status.
fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    match r {
        Ok(true) => (String::new(), 0),
        Ok(false) => (String::new(), 1),
        Err(Usage(e)) => {
            let t = format!(
              "viscosity: {e}\\n{HELP}"
            );
            (t, 1)
        }
        Err(Other(e)) => {
            let t = format!(
                "viscosity: {e}\\n"
            );
            (t, 1)
        }
    }
}`,
        why: 'One newline leaves no blank line between the message and the help; both CLIs print `\\n\\n`.',
      },
    ],
  },
  parse: {
    lang: 'rust',
    title: 'A small argument parser',
    prompt: 'Write `parse`, which turns the words after the command into `Args`. A word without a leading `-` is a file. `-o` and `--out` take the next word as `out`; `--frames` sets `frames`; `--mode` takes `auto` or `opt-in`, and anything else is `usage(BAD_MODE)`. A flag whose value is missing is `needs(flag)`, and any other word starting with `-` is `unknown(word)`. Stop at the first error.',
    starter: `#[derive(Debug, PartialEq, Default)]
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
fn parse(
    argv: &[&str],
) -> Result<Args, CliError> {
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq, Default)]
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
fn mode(
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
    walkthrough: `**How to think about it.** Before writing any code, sort the words of one test by hand. In \`["a.js", "-o", "out/", "b.js", "--frames"]\`, \`a.js\` is a file, \`-o\` is an option that *consumes* the next word, so \`out/\` is its value and must never be looked at as a word of its own, \`b.js\` is a file again, and \`--frames\` is a switch. So the loop needs two abilities: look at the current word, and, for an option, take the next one. An iterator gives you both, because calling \`it.next()\` inside the loop takes a word away from the same sequence the loop reads. (The real \`parse_args\` does the same with an index \`i\` that its \`next_os\` closure increments.)

Then decide how to report each mistake. Everything that can go wrong here is the command line's fault, so every error is a \`CliError::Usage\` built by the given helpers, and \`?\` passes it straight out of \`parse\`.

**The solution, line by line.**

- \`fn mode(v: &str) -> Result<Mode, CliError> {\` is a small helper for \`--mode\`'s value, so that the main loop stays short.
- \`match v { "auto" => Ok(Mode::Auto), "opt-in" => Ok(Mode::OptIn), _ => Err(usage(BAD_MODE)) }\` accepts exactly the two spellings and refuses anything else with the CLI's own message.
- \`fn parse(argv: &[&str]) -> Result<Args, CliError> {\` takes the words after the command.
- \`let mut a = Args::default();\` starts from the defaults: no files, an empty \`out\`, \`frames\` off, \`Mode::Auto\` (the \`#[default]\` variant).
- \`let mut it = argv.iter();\` makes the iterator; it is \`mut\` because taking a word changes where it is.
- \`while let Some(&w) = it.next() {\` takes one word per turn and stops when \`next\` gives \`None\`. The pattern \`&w\` copies the \`&str\` out of the \`&&str\` the iterator yields.
- \`let mut next = || { it.next().map(|v| v.to_string()).ok_or_else(|| needs(w)) };\` is the closure: take the following word as a \`String\`, or, if there is none, the error "w needs a value". It borrows \`it\` mutably, which is why it is \`let mut\`.
- \`"-o" | "--out" => { a.out = next()?; }\` stores the value, or returns the error through \`?\`.
- \`"--frames" => { a.frames = true; }\` flips the switch.
- \`"--mode" => { let v = next()?; a.mode = mode(&v)?; }\` takes the value, then checks it; either step can fail.
- \`_ if w.starts_with('-') => { return Err(unknown(w)); }\` catches every other dash word. It must come after the real flags, or \`--frames\` would land here.
- \`_ => a.files.push(w.into()),\` makes every remaining word a file.
- \`Ok(a)\` returns the filled-in \`Args\` once the words run out.

Why does the borrow checker allow \`next\` to borrow \`it\` while the \`while let\` also uses \`it\`? Because the closure is created fresh inside each turn and its last use is inside the \`match\`; by the time the loop calls \`it.next()\` again, the closure's borrow has ended.

**Common wrong attempts.**

- \`it.next().unwrap()\` in the closure. It works until a flag is the last word, and then the program panics instead of saying "-o needs a value" and exiting with status 1.
- Leaving out the \`starts_with('-')\` arm. Then \`--fast\` is taken as a file name, and the user learns about the typo only later, as "cannot read --fast".
- A \`for i in 0..argv.len()\` loop that peeks at \`argv[i + 1]\`. It finds the value, but the loop still visits that word on its next turn, so \`out/\` becomes a file as well.`,
    wrong: [
      {
        code: `#[derive(Debug, PartialEq, Default)]
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
fn mode(
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
        code: `#[derive(Debug, PartialEq, Default)]
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
fn mode(
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
        code: `#[derive(Debug, PartialEq, Default)]
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
fn mode(
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
      {
        t: 'Into `out.js`',
        why: 'Only stdout is redirected. Errors go to stderr, which still goes to the terminal.',
      },
      {
        t: 'To the terminal, on stderr',
        correct: true,
        why: 'That is the point of two streams: the results can go to a file while the errors stay visible.',
      },
      {
        t: 'Nowhere: the CLI exits silently',
        why: 'It prints `viscosity: Unexpected token (1:8)` or the like, a message and a position, and exits with status 1.',
      },
    ],
  },
  {
    q: 'Which command line makes the Rust CLI print its help text after the error?',
    options: [
      {
        t: '`viscosity explain missing.js` (no such file)',
        why: 'A missing file is `CliError::Other`: the command line was fine.',
      },
      {
        t: '`viscosity explain bad.js` (a syntax error)',
        why: 'Also `Other`. The help would not help.',
      },
      {
        t: '`viscosity --version`',
        why: 'That succeeds and prints `viscosity 0.0.1`, with status 0.',
      },
      {
        t: '`viscosity explain a.js --mode fast`',
        correct: true,
        why: 'An invalid flag value is a usage error, so the message is followed by a blank line and the help.',
      },
    ],
  },
  {
    q: '`viscosity build a.js b.js -o out/` succeeds for `a.js`, and `b.js` has a syntax error. What is the result?',
    options: [
      {
        t: '`out/a.js` is written, the error for `b.js` is printed, exit status 1',
        correct: true,
        why: 'That is `Ok(false)` from `run`: the run worked, one file did not.',
      },
      {
        t: 'Nothing is written, exit status 1',
        why: 'Files are independent: `out/a.js` is still written.',
      },
      {
        t: '`out/a.js` is written, exit status 0',
        why: 'A failed file makes the status 1, so a script notices.',
      },
      {
        t: 'The help is printed',
        why: 'The command line was fine, so this is not a usage error.',
      },
    ],
  },
  {
    q: 'Where does `viscosity --version` get `0.0.1` in the Rust CLI?',
    options: [
      {
        t: 'From `package.json`, read when it runs',
        why: 'That is how the TypeScript CLI does it.',
      },
      {
        t: 'From `Cargo.toml`, at compile time, through `env!("CARGO_PKG_VERSION")`',
        correct: true,
        why: 'Cargo sets that variable while compiling, so the version is baked into the binary.',
      },
      {
        t: 'From git, by asking for the latest tag',
        why: 'The CLI never looks at git; the number is compiled into it.',
      },
    ],
  },
  {
    q: 'A script runs `viscosity explain $f` and checks `$?`. Which run gives a status other than 1 or 0?',
    options: [
      {
        t: 'An unknown option',
        why: 'A usage error: status 1, with the help.',
      },
      {
        t: 'A missing file',
        why: 'Status 1, one line, no help.',
      },
      {
        t: 'None of them, in today’s CLI',
        correct: true,
        why: 'Every failure is `ExitCode::FAILURE`, 1. (Before `args_os`, a file name that was not UTF-8 made it panic with 101; that is fixed.)',
      },
    ],
  },
  {
    q: 'In `viscosity build a.js -o out/ b.js`, how many files will be compiled?',
    options: [
      {
        t: 'Three: `a.js`, `out/` and `b.js`',
        why: '`out/` is the value of `-o`: `next_os` takes it, so the loop never sees it as a word of its own.',
      },
      {
        t: 'Two: `a.js` and `b.js`',
        correct: true,
        why: 'Files and options can come in any order; `-o` consumes `out/`.',
      },
      {
        t: 'One: everything after `-o` is ignored',
        why: 'The loop carries on after an option’s value, so `b.js` is a file too.',
      },
    ],
  },
  {
    q: 'What does `viscosity explain a.js --mode` print?',
    options: [
      {
        t: '`viscosity: unknown option --mode`',
        why: '`--mode` is a known option; the problem is its missing value.',
      },
      {
        t: 'The explanation for `a.js`, in the default mode',
        why: 'A missing value is an error, not a default.',
      },
      {
        t: '`viscosity: --mode needs a value`, a blank line and the help',
        correct: true,
        why: '`next()` finds no word after `--mode`, so it returns that usage error, and `?` passes it up.',
      },
    ],
  },
  {
    q: 'Someone moves the final arm, `_ => return Err(CliError::Usage(...unknown option...))`, above the arm for files. What happens to `viscosity explain a.js`?',
    options: [
      {
        t: 'Nothing changes: the arms are independent',
        why: '`match` takes the first arm that fits, so order matters whenever two arms can fit the same word.',
      },
      {
        t: 'It fails with `viscosity: unknown option a.js`',
        correct: true,
        why: '`_` fits every word, so the files arm below it can never run.',
      },
      {
        t: 'Flags stop working',
        why: 'The real flags are matched by name in arms above both, so they still work.',
      },
    ],
  },
  {
    q: 'Why is a single `while` loop enough to parse a Viscosity command line?',
    options: [
      {
        t: 'Because the grammar is regular: a flat list of words, nothing nested',
        correct: true,
        why: 'Recursion (or a stack) is needed only for nesting, as with brackets in expressions.',
      },
      {
        t: 'Because Rust loops are faster than recursion',
        why: 'Speed is not the reason; the shape of the language is.',
      },
      {
        t: 'Because clap does the hard part',
        why: 'The Rust CLI does not use clap.',
      },
    ],
  },
  {
    q: 'A clap version of the CLI exited with status 2 on an unknown option. Why does that matter for Viscosity?',
    options: [
      {
        t: 'It doesn’t: any non-zero status means failure',
        why: 'Scripts and tests can compare exact statuses, and Viscosity’s tests compare the two CLIs’ statuses.',
      },
      {
        t: 'The TypeScript CLI exits 1, and the two CLIs are meant to behave the same',
        correct: true,
        why: 'Parity covers what users and scripts see: output, messages and exit statuses.',
      },
      {
        t: 'Status 2 means the program crashed',
        why: 'A Rust panic exits with 101. 2 is clap’s usage-error code, as in GNU `ls` and Python’s argparse.',
      },
    ],
  },
];
