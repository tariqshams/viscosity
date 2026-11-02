// Chapter 389 cards. Keys are stable ids: never rename them.
// Every cargo, rustdoc and clippy message quoted here was produced with
// cargo 1.97.0 and clippy 0.1.97 on x86-64 Linux, in scratch crates.

const L = (...xs) => xs.join('\n');

export const prompts = {
  'doctest-what': {
    q: 'What is a **doc test**?',
    a: 'A Rust code block in a doc comment, which `cargo test` compiles and runs; if it fails, the tests fail.',
  },
  'hidden-line': {
    q: 'What does a line starting with `# ` inside a doc example do?',
    a: 'It is compiled and run as part of the test, but hidden from the rendered documentation.',
  },
  'inner-doc': {
    q: 'What is the difference between `///` and `//!`?',
    a: '`///` documents the item that follows; `//!` documents the item it is inside, such as the whole crate at the top of `lib.rs`.',
  },
  'doc-sections': {
    q: 'Which doc sections do the API Guidelines ask for, besides examples?',
    a: '`# Errors` (when it returns an error), `# Panics` (when it panics) and, for an `unsafe fn`, `# Safety` (what the caller must promise).',
  },
  'clippy-what': {
    q: 'What is **Clippy**?',
    a: 'Rust’s official linter, run with `cargo clippy`: several hundred extra checks for mistakes and unidiomatic code, each with a suggested fix.',
  },
  'deny-default': {
    q: 'Which clippy group is `deny` by default, so that its lints stop the build?',
    a: '`clippy::correctness`: code that is outright wrong or useless, such as `x < 0` on a `u32`.',
  },
  pedantic: {
    q: 'How do you turn on clippy’s stricter `pedantic` lints for a whole crate?',
    a: 'Put `#![warn(clippy::pedantic)]` at the top of the crate root (or pass `-W clippy::pedantic`).',
  },
  'allow-reason': {
    q: 'How do you silence one clippy lint on one function, and leave a note why?',
    a: '`#[allow(clippy::lint_name, reason = "...")]` on that function.',
  },
};

export const examples = {
  totals: {
    lang: 'rust',
    title: 'Before and after clippy',
    code: String.raw`// What clippy flagged...
pub fn total_old(xs: &Vec<i32>) -> i32 {
    let mut sum = 0;
    for i in 0..xs.len() {
        sum = sum + xs[i];
    }
    return sum;
}

// ...and the version with every
// suggestion taken.
pub fn total(xs: &[i32]) -> i32 {
    xs.iter().sum()
}

fn main() {
    let v = vec![3, 4, 5];
    println!("{}", total_old(&v));
    println!("{}", total(&v));
    // a slice of an array works too
    println!("{}", total(&[1, 2][..]));
}`,
  },
};

export const exercises = {
  'parse-rgb': {
    lang: 'rust',
    title: 'Implement a function from its documentation',
    prompt:
      'The doc comment of `parse_rgb` is its specification: read it, then write the body. `"#ff8800"` gives `Ok((255, 136, 0))`; text that is not `#` followed by exactly six characters is `Err(BadShape)`; otherwise the first character that is not a hex digit is reported as `Err(BadDigit(c))`. Upper- and lower-case hex digits are both fine, and the function must never panic, whatever text it is given.',
    starter: String.raw`use ColorError::{BadDigit, BadShape};

type Rgb = (u8, u8, u8);

/// Why a colour could not be parsed.
#[derive(Debug, PartialEq)]
pub enum ColorError {
    /// Not 7 characters starting ${"`"}#${"`"}.
    BadShape,
    /// A character is not hex.
    BadDigit(char),
}

/// Parses a colour written ${"`"}#rrggbb${"`"}.
///
/// # Examples
///
/// ${"`"}${"`"}${"`"}
/// # use colors::*;
/// let c = parse_rgb("#ff8800");
/// assert_eq!(c, Ok((255, 136, 0)));
/// ${"`"}${"`"}${"`"}
///
/// # Errors
///
/// [${"`"}ColorError::BadShape${"`"}] if ${"`"}s${"`"} is
/// not ${"`"}#${"`"} and six characters, and
/// [${"`"}ColorError::BadDigit${"`"}] with the
/// first character that is not a hex
/// digit.
pub fn parse_rgb(s: &str)
    -> Result<Rgb, ColorError> {
    todo!()
}`,
    solution: String.raw`use ColorError::{BadDigit, BadShape};

type Rgb = (u8, u8, u8);

/// Why a colour could not be parsed.
#[derive(Debug, PartialEq)]
pub enum ColorError {
    /// Not 7 characters starting ${"`"}#${"`"}.
    BadShape,
    /// A character is not hex.
    BadDigit(char),
}

/// Parses a colour written ${"`"}#rrggbb${"`"}.
///
/// # Examples
///
/// ${"`"}${"`"}${"`"}
/// # use colors::*;
/// let c = parse_rgb("#ff8800");
/// assert_eq!(c, Ok((255, 136, 0)));
/// ${"`"}${"`"}${"`"}
///
/// # Errors
///
/// [${"`"}ColorError::BadShape${"`"}] if ${"`"}s${"`"} is
/// not ${"`"}#${"`"} and six characters, and
/// [${"`"}ColorError::BadDigit${"`"}] with the
/// first character that is not a hex
/// digit.
pub fn parse_rgb(s: &str)
    -> Result<Rgb, ColorError> {
    let hex = s.strip_prefix('#')
        .ok_or(BadShape)?;
    if hex.chars().count() != 6 {
        return Err(BadShape);
    }
    if let Some(c) =
        hex.chars().find(not_hex)
    {
        return Err(BadDigit(c));
    }
    let byte = |i: usize| {
        let two = &hex[i..i + 2];
        u8::from_str_radix(two, 16)
            .unwrap()
    };
    Ok((byte(0), byte(2), byte(4)))
}

fn not_hex(c: &char) -> bool {
    !c.is_ascii_hexdigit()
}`,
    tests: String.raw`#[test]
fn the_doc_example() {
    assert_eq!(parse_rgb("#ff8800"), Ok((255, 136, 0)));
}

#[test]
fn upper_and_lower_case() {
    assert_eq!(parse_rgb("#00FFaa"), Ok((0, 255, 170)));
    assert_eq!(parse_rgb("#000000"), Ok((0, 0, 0)));
}

#[test]
fn wrong_shape() {
    assert_eq!(parse_rgb("ff8800"), Err(ColorError::BadShape));
    assert_eq!(parse_rgb("#ff880"), Err(ColorError::BadShape));
    assert_eq!(parse_rgb("#ff88000"), Err(ColorError::BadShape));
    assert_eq!(parse_rgb(""), Err(ColorError::BadShape));
}

#[test]
fn reports_the_first_bad_digit() {
    assert_eq!(parse_rgb("#ffg8z0"), Err(ColorError::BadDigit('g')));
    assert_eq!(parse_rgb("#12345x"), Err(ColorError::BadDigit('x')));
}

#[test]
fn never_panics_on_odd_text() {
    assert_eq!(parse_rgb("#ééé"), Err(ColorError::BadShape));
    assert_eq!(parse_rgb("#ab+cde"), Err(ColorError::BadDigit('+')));
    assert_eq!(parse_rgb("#ééé000"), Err(ColorError::BadDigit('é')));
}`,
    hints: [
      'Follow the doc comment’s order: first the shape (a `#`, then six characters), then the digits, then the conversion. Each failure returns early.',
      '`s.strip_prefix(\'#\')` gives `Some(rest)` or `None`; `.ok_or(BadShape)?` turns `None` into the error. Count *characters* with `.chars().count()`, not bytes with `.len()`.',
      'Find the first bad character with `hex.chars().find(not_hex)`. Once every character is a hex digit, they are all ASCII, so slicing `&hex[0..2]` is safe, and `u8::from_str_radix(two, 16)` cannot fail.',
    ],
    walkthrough: L(
      '**How to think about it.** Treat the documentation as the contract, which is what it is for a user. It names three outcomes: a good colour, a bad shape, a bad digit, and it orders them: shape first, then the first bad digit. So the body checks in that order and returns as soon as something fails; what is left at the end is a well-formed string, which can be converted without any further worry. The promise “never panics” is the part to watch: string slicing panics if it cuts a multi-byte character in half, so we must only slice once we know every character is a single byte.',
      '',
      '**The solution, line by line.**',
      '',
      '- `let hex = s.strip_prefix(\'#\').ok_or(BadShape)?;` removes a leading `#`. `strip_prefix` gives `None` when there is none; `ok_or` turns that into `Err(BadShape)` and `?` returns it. `BadShape` and `BadDigit` are usable without the `ColorError::` prefix because of the `use` at the top.',
      '- `if hex.chars().count() != 6 { return Err(BadShape); }` checks the length in *characters*, so `"#ééé"` (three characters, six bytes) is a bad shape, as the doc says.',
      '- `if let Some(c) = hex.chars().find(not_hex) { return Err(BadDigit(c)); }` finds the first character that is not a hex digit, using the small helper `not_hex`, and reports it.',
      '- `let byte = |i: usize| { let two = &hex[i..i + 2]; u8::from_str_radix(two, 16).unwrap() };` is a closure that reads two hex digits starting at byte `i`. Both the slice and the `unwrap` are safe here, and only here: every character is an ASCII hex digit, so each is one byte, and any two of them form a valid number from 0 to 255.',
      '- `Ok((byte(0), byte(2), byte(4)))` returns the three channels.',
      '- `fn not_hex(c: &char) -> bool { !c.is_ascii_hexdigit() }` takes `&char` because that is what `find` passes. `is_ascii_hexdigit` accepts `0-9`, `a-f` and `A-F`.',
      '',
      'This body passes clippy 0.1.97 with no warnings, and the doc example in the comment passes `cargo test --doc` in a crate called `colors`, which is why it begins with the hidden line `# use colors::*;`.',
      '',
      '**Common wrong attempts.**',
      '',
      '- `if hex.len() != 6` counts bytes. `"#ééé"` is six bytes, so it gets past the shape check and is reported as `BadDigit(\'é\')`, which is not what the documentation promises. (Without the digit check, slicing it would even panic.)',
      '- Converting first and checking later, with `from_str_radix(..).unwrap_or(0)`. Bad digits become zeros instead of errors, so `"#ffg8z0"` returns a colour.',
      '- Checking the digits before the shape. `"#ab+cde"` happens to work either way, but `"#ff880g0"` would be reported as a bad digit when the documentation says its shape comes first.',
    ),
    wrong: [
      {
        code: String.raw`use ColorError::{BadDigit, BadShape};

type Rgb = (u8, u8, u8);

/// Why a colour could not be parsed.
#[derive(Debug, PartialEq)]
pub enum ColorError {
    /// Not 7 characters starting ${"`"}#${"`"}.
    BadShape,
    /// A character is not hex.
    BadDigit(char),
}

/// Parses a colour written ${"`"}#rrggbb${"`"}.
///
/// # Examples
///
/// ${"`"}${"`"}${"`"}
/// # use colors::*;
/// let c = parse_rgb("#ff8800");
/// assert_eq!(c, Ok((255, 136, 0)));
/// ${"`"}${"`"}${"`"}
///
/// # Errors
///
/// [${"`"}ColorError::BadShape${"`"}] if ${"`"}s${"`"} is
/// not ${"`"}#${"`"} and six characters, and
/// [${"`"}ColorError::BadDigit${"`"}] with the
/// first character that is not a hex
/// digit.
pub fn parse_rgb(s: &str)
    -> Result<Rgb, ColorError> {
    let hex = s.strip_prefix('#')
        .ok_or(BadShape)?;
    if hex.len() != 6 {
        return Err(BadShape);
    }
    if let Some(c) =
        hex.chars().find(not_hex)
    {
        return Err(BadDigit(c));
    }
    let byte = |i: usize| {
        let two = &hex[i..i + 2];
        u8::from_str_radix(two, 16)
            .unwrap()
    };
    Ok((byte(0), byte(2), byte(4)))
}

fn not_hex(c: &char) -> bool {
    !c.is_ascii_hexdigit()
}`,
        why: 'Counts bytes, not characters: `"#ééé"` passes the shape check and is reported as `BadDigit(\'é\')` instead of `BadShape`.',
      },
      {
        code: String.raw`use ColorError::{BadDigit, BadShape};

type Rgb = (u8, u8, u8);

/// Why a colour could not be parsed.
#[derive(Debug, PartialEq)]
pub enum ColorError {
    /// Not 7 characters starting ${"`"}#${"`"}.
    BadShape,
    /// A character is not hex.
    BadDigit(char),
}

/// Parses a colour written ${"`"}#rrggbb${"`"}.
///
/// # Examples
///
/// ${"`"}${"`"}${"`"}
/// # use colors::*;
/// let c = parse_rgb("#ff8800");
/// assert_eq!(c, Ok((255, 136, 0)));
/// ${"`"}${"`"}${"`"}
///
/// # Errors
///
/// [${"`"}ColorError::BadShape${"`"}] if ${"`"}s${"`"} is
/// not ${"`"}#${"`"} and six characters, and
/// [${"`"}ColorError::BadDigit${"`"}] with the
/// first character that is not a hex
/// digit.
pub fn parse_rgb(s: &str)
    -> Result<Rgb, ColorError> {
    let hex = s.strip_prefix('#')
        .ok_or(BadShape)?;
    if hex.chars().count() != 6 {
        return Err(BadShape);
    }
    let byte = |i: usize| {
        let two = &hex[i..i + 2];
        u8::from_str_radix(two, 16)
            .unwrap_or(0)
    };
    Ok((byte(0), byte(2), byte(4)))
}

fn not_hex(c: &char) -> bool {
    !c.is_ascii_hexdigit()
}`,
        why: 'Never checks the digits: bad ones silently become 0, so `"#ffg8z0"` is accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A doc comment’s example uses `assert_eq!(inc(1), 3);` but `inc(1)` is 2. When is this noticed?',
    options: [
      { t: 'Never: comments are not compiled', why: 'Rust code blocks in doc comments are doc tests.' },
      { t: 'When `cargo doc` builds the pages', why: '`cargo doc` renders the docs; it does not run the examples.' },
      { t: 'When `cargo test` runs, which fails the doc test with “assertion `left == right` failed”', correct: true, why: 'That is what happened to the broken `to_f` example under cargo 1.97.' },
    ],
  },
  {
    q: 'Why does a doc example usually need a `use` line for the crate’s own items?',
    options: [
      { t: 'It is compiled as a separate program that links your crate, and sees only its public API', correct: true, why: 'rustdoc adds `extern crate yourcrate;` but not the `use`; a hidden `# use ...` line is the usual fix.' },
      { t: 'Because doc comments are in a different module of the crate', why: 'They are not compiled as part of your crate at all.' },
      { t: 'It does not: doc tests can see private items', why: 'They cannot; that is exactly what makes them good tests of the public API.' },
    ],
  },
  {
    q: 'Clippy reports `x < 0` on a `u32` as an *error*, but `v.len() == 0` as a *warning*. Why the difference?',
    options: [
      { t: 'Errors are for code that cannot compile', why: 'Both compile; the error comes from clippy’s lint level.' },
      { t: 'The first is a correctness lint (default deny), the second a style lint (default warn)', correct: true, why: 'A u32 is never below zero, so that comparison is a bug.' },
      { t: 'Because clippy treats integer comparisons as unsafe', why: 'Nothing here is about unsafety.' },
    ],
  },
  {
    q: 'Which would clippy’s README tell you not to do?',
    options: [
      { t: 'Turn on `clippy::pedantic` for a crate', why: 'That is allowed; pedantic lints are strict but often useful.' },
      { t: 'Allow one lint on one function with a reason', why: 'That is the recommended way to record a deliberate exception.' },
      { t: 'Enable the whole `clippy::restriction` group', correct: true, why: 'It “should, emphatically, not be enabled as a whole”: pick restriction lints one by one.' },
    ],
  },
  {
    q: 'What does a TypeScript `@example` in a JSDoc comment have in common with a Rust doc example, and how do they differ?',
    options: [
      { t: 'Both show usage in the documentation; only Rust’s is compiled and run as a test by default', correct: true, why: 'A JSDoc example is text unless another tool is set up to run it.' },
      { t: 'Both are run by their language’s test command', why: 'Only `cargo test` runs examples by default.' },
      { t: 'Neither is shown in generated documentation', why: 'Both are; that is what they are for.' },
    ],
  },
];
