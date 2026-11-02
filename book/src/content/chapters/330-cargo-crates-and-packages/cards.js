// Chapter 330 cards (continuing chapter 329): recall prompts,
// exercises and quiz. Keys are stable ids: renaming one would orphan
// readers' review history.

export const prompts = {
  'cargo-files': {
    q: 'Which two files does `cargo new hello` create inside `hello/` (besides `.gitignore`)?',
    a: '`Cargo.toml` (the manifest, like `package.json`) and `src/main.rs` (the program).',
  },
  'cargo-check': {
    q: 'What does `cargo check` do, and what does it skip?',
    a: 'It runs all the compiler’s checks but skips producing a program, so it is much faster than `cargo build`.',
  },
  'cargo-release': {
    q: 'Why should a Rust benchmark use `cargo build --release`?',
    a: 'Only release builds turn on the optimiser. Debug builds are for development and can be much slower.',
  },
  'cargo-lock': {
    q: 'What does `Cargo.lock` record?',
    a: 'The exact version of every dependency the build used, so the next build uses the same ones.',
  },
  'cargo-version': {
    q: 'In `Cargo.toml`, `time = "0.1.12"` accepts which versions?',
    a: '0.1.12 and any later 0.1 release, but not 0.2: the left-most non-zero number must stay the same.',
  },
  'crate-kinds': {
    q: 'What is the difference between a binary crate and a library crate?',
    a: 'A binary crate has a `main` and becomes a runnable program. A library crate has no `main`; other crates use its code.',
  },
  'crate-root': {
    q: 'What is a crate’s root?',
    a: 'The file rustc starts compiling the crate from, such as `src/main.rs` or `src/lib.rs`.',
  },
  'package-limit': {
    q: 'How many library crates and how many binary crates can one package hold?',
    a: 'At most one library crate, and any number of binary crates.',
  },
};

export const examples = {};

export const exercises = {
  compatible: {
    lang: 'rust',
    title: 'Does this version satisfy the requirement?',
    prompt: `Cargo reads \`time = "1.2"\` as “1.2.0 or later, but below 2.0.0”, and \`time = "0.2"\` as “0.2.0 or later, but below 0.3.0”: the left-most **non-zero** number must match, and the number after it may only go up.

Write \`compatible(req_major, req_minor, major, minor)\`, which returns \`true\` when version \`major.minor\` satisfies the requirement \`req_major.req_minor\` (ignore the third number). Use \`if\`, \`return\`, \`==\`, \`>=\` and \`&&\` as in TypeScript.`,
    starter: `fn compatible(
    req_major: i64,
    req_minor: i64,
    major: i64,
    minor: i64,
) -> bool {
    todo!()
}`,
    solution: `fn compatible(
    req_major: i64,
    req_minor: i64,
    major: i64,
    minor: i64,
) -> bool {
    if req_major == 0 {
        return major == 0
            && minor == req_minor;
    }
    return major == req_major
        && minor >= req_minor;
}`,
    tests: `#[test]
fn same_version_is_fine() {
    assert!(compatible(1, 2, 1, 2));
}

#[test]
fn a_later_minor_is_fine() {
    assert!(compatible(1, 2, 1, 9));
}

#[test]
fn an_older_minor_is_not() {
    assert!(!compatible(1, 2, 1, 1));
}

#[test]
fn a_new_major_is_not() {
    assert!(!compatible(1, 2, 2, 0));
}

#[test]
fn below_one_the_minor_must_match() {
    assert!(compatible(0, 2, 0, 2));
    assert!(!compatible(0, 2, 0, 3));
    assert!(!compatible(0, 2, 1, 2));
}`,
    hints: [
      'There are two cases, decided by whether the requirement’s major number is 0. Which number is “the left-most non-zero one” in each case?',
      'If `req_major` is 0, the minor number is the one that must match exactly (and the major must still be 0). Otherwise the major must match, and the minor may be equal or higher.',
      'Handle the zero case first with `if req_major == 0 { return major == 0 && minor == req_minor; }`, then `return major == req_major && minor >= req_minor;`.',
    ],
    walkthrough: `**How to think about it.** Cargo’s rule is about which number is allowed to grow. For \`1.2\`, the left-most non-zero number is the major, \`1\`; it must stay \`1\`, and the minor may be \`2\` or anything above (new features, nothing removed). For \`0.2\`, the major is zero, so the left-most non-zero number is the minor, \`2\`; *it* is the one that must stay put, because before 1.0 every minor release may break things. So the function has two cases, and the question that picks the case is “is \`req_major\` zero?”.

**The solution, line by line.**

- \`fn compatible(\` ... \`) -> bool {\` declares four whole-number parameters and promises a \`bool\` back; the signature is split over lines to fit the page, which Rust allows anywhere spaces are allowed.
- \`if req_major == 0 {\` picks the pre-1.0 case. \`==\` compares two numbers, as in TypeScript (Rust has no \`===\`; there is nothing loose to be strict about).
- \`return major == 0 && minor == req_minor;\` says both things that must be true: the version is also pre-1.0, and its minor number is exactly the required one. \`&&\` is “and”, and it stops early, as in TypeScript. The \`return\` leaves the function at once, so the line after the \`if\` never runs in this case.
- \`}\` closes the \`if\`.
- \`return major == req_major && minor >= req_minor;\` handles everything else: the same major, and a minor at least as high. For \`compatible(1, 2, 1, 9)\` that is \`1 == 1 && 9 >= 2\`, so \`true\`; for \`compatible(1, 2, 2, 0)\` the major differs, so \`false\`.

The tests use \`assert!(x)\`, which fails unless \`x\` is \`true\`, and \`assert!(!x)\` for the cases that must be \`false\` (\`!\` is “not”).

**Common wrong attempts.**

- Forgetting the zero case: \`return major == req_major && minor >= req_minor;\` alone says \`0.3\` satisfies \`0.2\`, which cargo would refuse, so the last test fails.
- \`minor > req_minor\` instead of \`>=\`: then the very version you asked for, \`1.2\`, does not satisfy \`1.2\`.
- Writing \`major = 0\` with one \`=\`: that is an assignment, not a comparison, and rustc rejects it with a type error (E0308, “mismatched types”), because an assignment does not produce a \`bool\`.`,
    wrong: [
      {
        code: `fn compatible(
    req_major: i64,
    req_minor: i64,
    major: i64,
    minor: i64,
) -> bool {
    return major == req_major
        && minor >= req_minor;
}`,
        why: 'This forgets the pre-1.0 rule: it says 0.3 satisfies 0.2, but below 1.0 the minor number must match exactly.',
      },
      {
        code: `fn compatible(
    req_major: i64,
    req_minor: i64,
    major: i64,
    minor: i64,
) -> bool {
    if req_major == 0 {
        return major == 0
            && minor == req_minor;
    }
    return major == req_major
        && minor > req_minor;
}`,
        why: 'With `>`, the exact version you asked for (1.2 for "1.2") is rejected. A minor number equal to the requirement is fine: use `>=`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which cargo command would you run to measure how fast your program is?',
    options: [
      { t: '`cargo check`', why: '`check` does not even produce a program.' },
      { t: '`cargo run`', why: 'Plain `cargo run` makes a debug build, without the optimiser.' },
      { t: '`cargo new`', why: 'That creates a new project.' },
      { t: '`cargo build --release`, then run the program', correct: true, why: 'Release builds turn on the optimiser, and land in `target/release/`.' },
    ],
  },
  {
    q: 'drip-rs’s `Cargo.toml` declares a crate `drip` with no `main`, and a crate `drip-rs` with one. What are they?',
    options: [
      { t: 'Two packages', why: 'One `Cargo.toml` is one package. It can hold several crates.' },
      { t: 'A library crate and a binary crate', correct: true, why: 'The library holds the VM; the binary is the small program that runs it on a file.' },
      { t: 'Two binary crates', why: 'A crate without `main` cannot be a binary.' },
      { t: 'Two modules of the same crate', why: 'Each is compiled as its own crate; the binary uses the library.' },
    ],
  },
  {
    q: 'You are fixing type errors and want the quickest feedback. Which command?',
    options: [
      { t: '`cargo check`', correct: true, why: 'It runs every check the compiler has and skips making a program, so it is the fastest way to see errors.' },
      { t: '`cargo build --release`', why: 'That runs the optimiser too, which is the slowest build of all.' },
      { t: '`cargo run`', why: 'It builds a whole debug program and runs it; more work than you need to see errors.' },
      { t: '`cargo fmt`', why: '`fmt` only lays out your code; it reports no type errors.' },
    ],
  },
  {
    q: 'A `Cargo.toml` says `time = "0.1.12"`. Which version may cargo pick?',
    options: [
      { t: '0.2.0', why: 'Below 1.0, the minor number is the left-most non-zero one, so it must stay 1.' },
      { t: '0.1.20', correct: true, why: 'Any 0.1 release from 0.1.12 up is accepted.' },
      { t: '1.0.0', why: 'A new major version is never picked for you.' },
      { t: 'Only exactly 0.1.12', why: 'That would be written `= 0.1.12`. The plain form allows compatible later releases.' },
    ],
  },
  {
    q: 'In a package made with `cargo new --lib`, you type `cargo run`. What happens?',
    options: [
      { t: 'It runs the library’s first function', why: 'A library has no starting point; there is nothing to run.' },
      { t: 'It builds and prints nothing', why: 'cargo stops before building anything.' },
      { t: 'An error: a bin target must be available for `cargo run`', correct: true, why: 'A library crate has no `main`. Run its tests with `cargo test`, or use it from a binary crate.' },
      { t: 'It runs the tests instead', why: 'That is what `cargo test` is for; `cargo run` does not fall back to it.' },
    ],
  },
];
