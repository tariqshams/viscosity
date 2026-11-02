// Chapter 184 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 116, 116.

export const prompts = {
  'rs-no-gc': {
    q: 'Rust has no garbage collector. So who decides when memory is freed?',
    a: 'The compiler. It works out, from ownership rules, the exact point where each value is freed, and builds that into the program.',
  },
  'rs-when-compile': {
    q: 'When is a Rust program compiled to machine code: before it runs, or while it runs?',
    a: 'Before it runs (ahead of time). The binary that runs has no parser and no JIT.',
  },
  'rs-cost': {
    q: 'Name one real cost of choosing Rust over TypeScript.',
    a: 'Any of: the compiler rejects programs TypeScript would run; you wait for a compile before each run; designs where many objects point at each other take more thought.',
  },
  'rs-bench-fair': {
    q: 'Why doesn’t the drip-rs benchmark prove that “Rust is 4× faster than JavaScript”?',
    a: 'It is one port, on one shared machine, measured on one day. Other code, or a JIT that suits it better, could change the result, and even here one program barely moved.',
  },
  'rs-println-bang': {
    q: 'What does the `!` in `println!` tell you?',
    a: 'That `println!` is a macro (code that writes code at compile time), not a function.',
  },
  'rs-main': {
    q: 'Where does a Rust program start running?',
    a: 'In `fn main()`. Rust has no top-level statements like a JavaScript file.',
  },
  'rs-gap': {
    q: 'With `let n = 3;`, what do `println!("{}", n)` and `println!("{n}")` print?',
    a: 'Both print `3`: `{}` is filled by the next argument, `{n}` by the variable called `n`.',
  },
  'rs-help-line': {
    q: 'A rustc error ends with a `help:` line. Why read it?',
    a: 'It often holds the fix, such as “use `!` to invoke the macro”.',
  },
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

export const examples = {
  hello: {
    title: 'Hello, Rust',
    lang: 'rust',
    code: `fn main() {
    println!("Hello, Drip!");
    let n = 35;
    println!("fib({}) is slow", n);
    let sum = 2 + 3;
    println!("2 + 3 = {sum}");
}`,
  },
};

export const exercises = {
  'seconds-in': {
    lang: 'rust',
    title: 'Translate a function from TypeScript',
    prompt: `Here is a TypeScript function:

\`\`\`ts
function secondsIn(hours: number): number {
  return hours * 60 * 60;
}
\`\`\`

The Rust version is already declared for you. Replace \`todo!()\` with a body that **returns** the number of seconds in \`hours\` hours. The shape is the same as in TypeScript, down to \`return\` and the semicolon.`,
    starter: `fn seconds_in(hours: i64) -> i64 {
    todo!()
}`,
    solution: `fn seconds_in(hours: i64) -> i64 {
    return hours * 60 * 60;
}`,
    tests: `#[test]
fn one_hour_is_3600_seconds() {
    assert_eq!(seconds_in(1), 3600);
}

#[test]
fn zero_hours_is_zero() {
    assert_eq!(seconds_in(0), 0);
}

#[test]
fn a_day_is_86400_seconds() {
    assert_eq!(seconds_in(24), 86400);
}`,
    hints: [
      'Work one out by hand first: how many seconds are in one hour?',
      'An hour has 60 minutes and a minute has 60 seconds, so multiply by 60 twice. Rust has `return` too, and it works exactly as in TypeScript.',
      'Every number in this function is an `i64`, a whole number, so write `60`, not `60.0`: `return hours * 60 * 60;`.',
    ],
    walkthrough: `**How to think about it.** Do one by hand before writing anything: one hour is 60 minutes, and each minute is 60 seconds, so one hour is 60 × 60 = 3600 seconds, and \`hours\` hours is \`hours\` times that. The TypeScript version already says exactly this, so the job is a translation, not a new idea. Line the two signatures up and almost everything matches:

- \`function secondsIn\` becomes \`fn seconds_in\`; Rust names functions in snake_case (words joined by underscores).
- \`hours: number\` becomes \`hours: i64\`; the type still comes after a colon, but Rust has many number types, and this one is a 64-bit whole number.
- \`: number\` after the brackets becomes \`-> i64\`, the type of value the function returns.

**The solution, line by line.**

- \`fn seconds_in(hours: i64) -> i64 {\` is given: a function named \`seconds_in\` that takes one \`i64\`, called \`hours\`, and promises to give back an \`i64\`.
- \`    return hours * 60 * 60;\` multiplies from left to right (\`hours * 60\` gives minutes, then \`* 60\` gives seconds) and sends the answer back to the caller. For \`seconds_in(24)\` that is 24 × 60 × 60 = 86400. The semicolon ends the statement, as in TypeScript.
- \`}\` closes the body.

The tests are \`#[test]\` functions that call yours; \`assert_eq!(a, b)\` fails the test if \`a\` and \`b\` differ, much like \`expect(a).toBe(b)\`. The chapter *Functions and expressions* shows a shorter way to write the body, without \`return\`.

**Common wrong attempts.**

- \`return hours * 60;\` gives minutes, not seconds, so \`seconds_in(1)\` is \`60\` and the first test fails.
- \`return hours * 3600.0;\` does not even compile: \`3600.0\` is a floating-point number, \`hours\` is an \`i64\`, and Rust never mixes the two silently (rustc says “cannot multiply \`i64\` by \`{float}\`”). The chapter on number types explains why.
- Leaving \`todo!()\` in place compiles, but the program stops with “not yet implemented” the moment a test calls it.`,
    wrong: [
      {
        code: `fn seconds_in(hours: i64) -> i64 {
    return hours * 60;
}`,
        why: 'That gives minutes, not seconds: `seconds_in(1)` is `60`. Multiply by 60 twice.',
      },
      {
        code: `fn seconds_in(hours: i64) -> i64 {
    return hours * 3600.0;
}`,
        why: 'This does not compile. `3600.0` is a floating-point number, `hours` is an `i64`, and Rust never mixes the two silently.',
      },
    ],
  },
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
    q: 'Your TypeScript Drip VM has its own mark-and-sweep collector. Why did it need one, even though V8 has a garbage collector?',
    options: [
      {
        t: 'V8’s collector is too slow for VMs',
        why: 'Speed was not the reason. V8 could not tell which Drip objects were still in use.',
      },
      {
        t: 'Only the VM knows which Drip objects are still reachable; its object list keeps everything alive to V8',
        correct: true,
        why: 'Right. To V8, every object on the list is reachable, so it would never free one. Only the VM can trace from Drip’s own roots.',
      },
      {
        t: 'TypeScript turns V8’s collector off',
        why: 'TypeScript has no effect on the running engine: its types are erased.',
      },
      {
        t: 'It didn’t need one; the collector was optional',
        why: 'Without it, the Drip heap only grows: every string ever built stays alive.',
      },
    ],
  },
  {
    q: 'Which of these happens **while** a Rust binary runs?',
    options: [
      {
        t: 'Type checking',
        why: 'rustc checks types before producing the binary.',
      },
      {
        t: 'JIT compilation of hot functions',
        why: 'Rust is compiled ahead of time; the binary contains no JIT.',
      },
      {
        t: 'Tracing garbage collection',
        why: 'Rust has no garbage collector. Freeing is placed by the compiler.',
      },
      {
        t: 'The machine code rustc produced runs on the CPU',
        correct: true,
        why: 'That is all that is left to do at run time. Everything else happened before.',
      },
    ],
  },
  {
    q: 'In this book’s run, drip-rs was 4.69× as fast as the TypeScript VM on `fib`. What is the fairest conclusion?',
    options: [
      {
        t: 'Rust is about 5× faster than JavaScript',
        why: 'One port of one program on one machine cannot support a claim about two whole languages.',
      },
      {
        t: 'The TypeScript VM has a bug',
        why: 'Both VMs print the same output byte for byte; slower is not buggy.',
      },
      {
        t: 'This Rust port ran this program about 4.7× as fast here, on this machine and day',
        correct: true,
        why: 'That is what was measured: same machine, same day, best of three for both.',
      },
      {
        t: 'Nothing, because compile time was included',
        why: 'It was included for both, so the comparison is still meaningful, just not universal.',
      },
    ],
  },
  {
    q: 'You forget the `!` and write `println("hi");`. What happens?',
    options: [
      {
        t: 'A compile error: expected function, found macro',
        correct: true,
        why: 'rustc 1.97 reports E0423 and its help line suggests adding the `!`.',
      },
      {
        t: 'It prints `hi` anyway',
        why: 'Without the `!`, Rust looks for a function called `println`, and there is none.',
      },
      {
        t: 'It prints nothing and carries on',
        why: 'The program never compiles, so nothing runs.',
      },
      {
        t: 'A crash at run time',
        why: 'Rust finds this before running: it is a compile error.',
      },
    ],
  },
  {
    q: 'A file holds `fn start() { println!("hi"); }` and nothing else. What does rustc say?',
    options: [
      {
        t: 'It compiles and prints `hi`',
        why: 'Nothing calls `start`, and a program needs somewhere to begin.',
      },
      {
        t: 'It compiles and prints nothing',
        why: 'rustc refuses to build a program with no entry point.',
      },
      {
        t: 'error[E0601]: `main` function not found',
        correct: true,
        why: 'Every Rust program starts in `fn main()`; a function with another name is never run on its own.',
      },
      {
        t: 'error: `start` is a reserved word',
        why: '`start` is an ordinary name. The problem is the missing `main`.',
      },
    ],
  },
  {
    q: 'Which cargo command would you run to measure how fast your program is?',
    options: [
      {
        t: '`cargo check`',
        why: '`check` does not even produce a program.',
      },
      {
        t: '`cargo run`',
        why: 'Plain `cargo run` makes a debug build, without the optimiser.',
      },
      {
        t: '`cargo new`',
        why: 'That creates a new project.',
      },
      {
        t: '`cargo build --release`, then run the program',
        correct: true,
        why: 'Release builds turn on the optimiser, and land in `target/release/`.',
      },
    ],
  },
  {
    q: 'drip-rs’s `Cargo.toml` declares a crate `drip` with no `main`, and a crate `drip-rs` with one. What are they?',
    options: [
      {
        t: 'Two packages',
        why: 'One `Cargo.toml` is one package. It can hold several crates.',
      },
      {
        t: 'A library crate and a binary crate',
        correct: true,
        why: 'The library holds the VM; the binary is the small program that runs it on a file.',
      },
      {
        t: 'Two binary crates',
        why: 'A crate without `main` cannot be a binary.',
      },
      {
        t: 'Two modules of the same crate',
        why: 'Each is compiled as its own crate; the binary uses the library.',
      },
    ],
  },
  {
    q: 'You are fixing type errors and want the quickest feedback. Which command?',
    options: [
      {
        t: '`cargo check`',
        correct: true,
        why: 'It runs every check the compiler has and skips making a program, so it is the fastest way to see errors.',
      },
      {
        t: '`cargo build --release`',
        why: 'That runs the optimiser too, which is the slowest build of all.',
      },
      {
        t: '`cargo run`',
        why: 'It builds a whole debug program and runs it; more work than you need to see errors.',
      },
      {
        t: '`cargo fmt`',
        why: '`fmt` only lays out your code; it reports no type errors.',
      },
    ],
  },
  {
    q: 'A `Cargo.toml` says `time = "0.1.12"`. Which version may cargo pick?',
    options: [
      {
        t: '0.2.0',
        why: 'Below 1.0, the minor number is the left-most non-zero one, so it must stay 1.',
      },
      {
        t: '0.1.20',
        correct: true,
        why: 'Any 0.1 release from 0.1.12 up is accepted.',
      },
      {
        t: '1.0.0',
        why: 'A new major version is never picked for you.',
      },
      {
        t: 'Only exactly 0.1.12',
        why: 'That would be written `= 0.1.12`. The plain form allows compatible later releases.',
      },
    ],
  },
  {
    q: 'In a package made with `cargo new --lib`, you type `cargo run`. What happens?',
    options: [
      {
        t: 'It runs the library’s first function',
        why: 'A library has no starting point; there is nothing to run.',
      },
      {
        t: 'It builds and prints nothing',
        why: 'cargo stops before building anything.',
      },
      {
        t: 'An error: a bin target must be available for `cargo run`',
        correct: true,
        why: 'A library crate has no `main`. Run its tests with `cargo test`, or use it from a binary crate.',
      },
      {
        t: 'It runs the tests instead',
        why: 'That is what `cargo test` is for; `cargo run` does not fall back to it.',
      },
    ],
  },
];
