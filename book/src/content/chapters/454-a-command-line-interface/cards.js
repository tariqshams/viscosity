// Chapter 454 cards. Keys are stable ids: never rename them.

const PRE = `// The two kinds of failure, as in
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
};


export const exercises = {
  finish: {
    lang: 'rust',
    title: 'How main ends a run',
    prompt:
      'Write `finish`, the end of `main`. Given what `run` returned, return the text for stderr and the exit status. `Ok(true)`: nothing, status 0. `Ok(false)`: nothing more (the failed files were already reported), status 1. `Err(Usage(e))`: `viscosity: ` and the message, a blank line, then `HELP`, status 1. `Err(Other(e))`: `viscosity: ` and the message on one line, status 1.',
    starter: `${PRE}fn finish(
    r: Result<bool, CliError>,
) -> (String, u8) {
    todo!()
}`,
    solution: `${PRE}fn finish(
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
        code: `${PRE}fn finish(
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
        code: `${PRE}fn finish(
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
        code: `${PRE}fn finish(
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
};

export const quiz = [
  {
    q: 'You run `viscosity build app.js > out.js` and `app.js` has a syntax error. Where does the error message go?',
    options: [
      { t: 'Into `out.js`', why: 'Only stdout is redirected. Errors go to stderr, which still goes to the terminal.' },
      { t: 'To the terminal, on stderr', correct: true, why: 'That is the point of two streams: the results can go to a file while the errors stay visible.' },
      { t: 'Nowhere: the CLI exits silently', why: 'It prints `viscosity: Unexpected token (1:8)` or the like, a message and a position, and exits with status 1.' },
    ],
  },
  {
    q: 'Which command line makes the Rust CLI print its help text after the error?',
    options: [
      { t: '`viscosity explain missing.js` (no such file)', why: 'A missing file is `CliError::Other`: the command line was fine.' },
      { t: '`viscosity explain bad.js` (a syntax error)', why: 'Also `Other`. The help would not help.' },
      { t: '`viscosity --version`', why: 'That succeeds and prints `viscosity 0.0.1`, with status 0.' },
      { t: '`viscosity explain a.js --mode fast`', correct: true, why: 'An invalid flag value is a usage error, so the message is followed by a blank line and the help.' },
    ],
  },
  {
    q: '`viscosity build a.js b.js -o out/` succeeds for `a.js`, and `b.js` has a syntax error. What is the result?',
    options: [
      { t: '`out/a.js` is written, the error for `b.js` is printed, exit status 1', correct: true, why: 'That is `Ok(false)` from `run`: the run worked, one file did not.' },
      { t: 'Nothing is written, exit status 1', why: 'Files are independent: `out/a.js` is still written.' },
      { t: '`out/a.js` is written, exit status 0', why: 'A failed file makes the status 1, so a script notices.' },
      { t: 'The help is printed', why: 'The command line was fine, so this is not a usage error.' },
    ],
  },
  {
    q: 'Where does `viscosity --version` get `0.0.1` in the Rust CLI?',
    options: [
      { t: 'From `package.json`, read when it runs', why: 'That is how the TypeScript CLI does it.' },
      { t: 'From `Cargo.toml`, at compile time, through `env!("CARGO_PKG_VERSION")`', correct: true, why: 'Cargo sets that variable while compiling, so the version is baked into the binary.' },
      { t: 'From git, by asking for the latest tag', why: 'The CLI never looks at git; the number is compiled into it.' },
    ],
  },
  {
    q: 'A script runs `viscosity explain $f` and checks `$?`. Which run gives a status other than 1 or 0?',
    options: [
      { t: 'An unknown option', why: 'A usage error: status 1, with the help.' },
      { t: 'A missing file', why: 'Status 1, one line, no help.' },
      { t: 'None of them, in today’s CLI', correct: true, why: 'Every failure is `ExitCode::FAILURE`, 1. (Before `args_os`, a file name that was not UTF-8 made it panic with 101; that is fixed.)' },
    ],
  },
];
