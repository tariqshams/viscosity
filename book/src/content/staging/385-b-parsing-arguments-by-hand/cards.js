// Chapter 385b cards ("Parsing arguments by hand"). Keys are stable ids.

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
    q: 'In `viscosity build a.js -o out/ b.js`, how many files will be compiled?',
    options: [
      { t: 'Three: `a.js`, `out/` and `b.js`', why: '`out/` is the value of `-o`: `next_os` takes it, so the loop never sees it as a word of its own.' },
      { t: 'Two: `a.js` and `b.js`', correct: true, why: 'Files and options can come in any order; `-o` consumes `out/`.' },
      { t: 'One: everything after `-o` is ignored', why: 'The loop carries on after an option’s value, so `b.js` is a file too.' },
    ],
  },
  {
    q: 'What does `viscosity explain a.js --mode` print?',
    options: [
      { t: '`viscosity: unknown option --mode`', why: '`--mode` is a known option; the problem is its missing value.' },
      { t: 'The explanation for `a.js`, in the default mode', why: 'A missing value is an error, not a default.' },
      { t: '`viscosity: --mode needs a value`, a blank line and the help', correct: true, why: '`next()` finds no word after `--mode`, so it returns that usage error, and `?` passes it up.' },
    ],
  },
  {
    q: 'Someone moves the final arm, `_ => return Err(CliError::Usage(...unknown option...))`, above the arm for files. What happens to `viscosity explain a.js`?',
    options: [
      { t: 'Nothing changes: the arms are independent', why: '`match` takes the first arm that fits, so order matters whenever two arms can fit the same word.' },
      { t: 'It fails with `viscosity: unknown option a.js`', correct: true, why: '`_` fits every word, so the files arm below it can never run.' },
      { t: 'Flags stop working', why: 'The real flags are matched by name in arms above both, so they still work.' },
    ],
  },
  {
    q: 'Why is a single `while` loop enough to parse a Viscosity command line?',
    options: [
      { t: 'Because the grammar is regular: a flat list of words, nothing nested', correct: true, why: 'Recursion (or a stack) is needed only for nesting, as with brackets in expressions.' },
      { t: 'Because Rust loops are faster than recursion', why: 'Speed is not the reason; the shape of the language is.' },
      { t: 'Because clap does the hard part', why: 'The Rust CLI does not use clap.' },
    ],
  },
  {
    q: 'A clap version of the CLI exited with status 2 on an unknown option. Why does that matter for Viscosity?',
    options: [
      { t: 'It doesn’t: any non-zero status means failure', why: 'Scripts and tests can compare exact statuses, and Viscosity’s tests compare the two CLIs’ statuses.' },
      { t: 'The TypeScript CLI exits 1, and the two CLIs are meant to behave the same', correct: true, why: 'Parity covers what users and scripts see: output, messages and exit statuses.' },
      { t: 'Status 2 means the program crashed', why: 'A Rust panic exits with 101. 2 is clap’s usage-error code, as in GNU `ls` and Python’s argparse.' },
    ],
  },
];
