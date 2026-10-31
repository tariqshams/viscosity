// Chapter 121 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

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
    a: 'It is one port of one program on one shared machine, with the TypeScript side measured once. Other code, or a JIT that suits it better, could change the result.',
  },
  'rs-println-bang': {
    q: 'What does the `!` in `println!` tell you?',
    a: 'That `println!` is a macro (code that writes code at compile time), not a function.',
  },
  'rs-main': {
    q: 'Where does a Rust program start running?',
    a: 'In `fn main()`. Rust has no top-level statements like a JavaScript file.',
  },
  'cargo-files': {
    q: 'Which two files does `cargo new hello` create?',
    a: '`Cargo.toml` (the manifest, like `package.json`) and `src/main.rs` (the program).',
  },
  'cargo-check': {
    q: 'What does `cargo check` do that `cargo build` also does, and what does it skip?',
    a: 'It runs all the compiler’s checks, but skips producing a binary, so it is faster.',
  },
  'cargo-release': {
    q: 'Why should a Rust benchmark use `cargo build --release`?',
    a: 'Only release builds turn on the optimizer. Debug builds are for development and can be much slower.',
  },
  'crate-kinds': {
    q: 'What is the difference between a binary crate and a library crate?',
    a: 'A binary crate has a `main` and becomes a runnable program. A library crate has no `main`; other crates use its code.',
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
    println!("2 + 3 = {}", sum);
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
      'An hour has 60 minutes and a minute has 60 seconds.',
      'Rust has `return` too: `return something;` works exactly as in TypeScript.',
      'Every number in this function is an `i64`, a whole number. Write `60`, not `60.0`.',
    ],
    walkthrough: `Line up the two versions and they are nearly the same:

- \`function secondsIn\` becomes \`fn seconds_in\`. Rust names functions in snake_case.
- \`hours: number\` becomes \`hours: i64\`. The type still goes after a colon, but Rust has many number types, and this one is a 64-bit whole number.
- \`: number\` after the parentheses becomes \`-> i64\`: the type of value the function returns.

The body is the familiar \`return hours * 60 * 60;\`. Chapter 123 shows a shorter way to write it, without \`return\`.

The tests are \`#[test]\` functions that call yours. \`assert_eq!(a, b)\` fails the test if \`a\` and \`b\` differ, much like \`expect(a).toBe(b)\`.`,
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
        why: 'This does not compile. `3600.0` is a floating-point number, `hours` is an `i64`, and Rust never mixes the two silently. Chapter 122 explains why.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Your TypeScript Drip VM has its own mark-and-sweep collector. Why did it need one, even though V8 has a garbage collector?',
    options: [
      { t: 'V8’s collector is too slow for VMs', why: 'Speed wasn’t the reason. V8 could not tell which Drip objects were still in use.' },
      { t: 'Only the VM knows which Drip objects are still reachable; its object list keeps everything alive to V8', correct: true, why: 'Right. To V8, every object on the list is reachable, so it would never free one. Only the VM can trace from Drip’s own roots.' },
      { t: 'TypeScript turns V8’s collector off', why: 'TypeScript has no effect on the running engine: its types are erased.' },
      { t: 'It didn’t need one; chapter 58 was optional', why: 'Without it, the heap only grows: every string ever built stays alive.' },
    ],
  },
  {
    q: 'Which of these happens **while** a Rust binary runs?',
    options: [
      { t: 'Type checking', why: 'rustc checks types before producing the binary.' },
      { t: 'JIT compilation of hot functions', why: 'Rust is compiled ahead of time; the binary contains no JIT.' },
      { t: 'Tracing garbage collection', why: 'Rust has no garbage collector. Freeing is placed by the compiler.' },
      { t: 'The machine code rustc produced runs on the CPU', correct: true, why: 'That is all that’s left to do at run time. Everything else happened before.' },
    ],
  },
  {
    q: 'In this book’s run, drip-rs was 3.89× as fast as the TypeScript VM on `fib`. What is the fairest conclusion?',
    options: [
      { t: 'Rust is about 4× faster than JavaScript', why: 'One port of one program on one machine can’t support a claim about two whole languages.' },
      { t: 'This Rust port ran this program about 4× faster here, in a first look', correct: true, why: 'That’s what was measured: same machine, same day, one TypeScript run, best of three for drip-rs.' },
      { t: 'The TypeScript VM has a bug', why: 'Both VMs print the same output byte for byte; slower isn’t buggy.' },
      { t: 'Nothing: compile time was included', why: 'It was included for both, so the comparison is still meaningful, just not universal.' },
    ],
  },
  {
    q: 'You forget the `!` and write `println("hi");`. What happens?',
    options: [
      { t: 'It prints `hi` anyway', why: 'Without the `!`, Rust looks for a function called `println`, and there isn’t one.' },
      { t: 'A compile error: expected function, found macro', correct: true, why: 'rustc 1.97 reports E0423 and suggests adding the `!`.' },
      { t: 'It prints nothing and carries on', why: 'The program never compiles, so nothing runs.' },
      { t: 'A crash at run time', why: 'Rust finds this before running: it’s a compile error.' },
    ],
  },
  {
    q: 'Which cargo command would you run to measure how fast your program is?',
    options: [
      { t: '`cargo check`', why: '`check` doesn’t even produce a binary.' },
      { t: '`cargo run`', why: 'Plain `cargo run` makes a debug build, without the optimizer.' },
      { t: '`cargo build --release`, then run the binary', correct: true, why: 'Release builds turn on the optimizer, and land in `target/release/`.' },
      { t: '`cargo new`', why: 'That creates a new project.' },
    ],
  },
  {
    q: 'drip-rs’s `Cargo.toml` declares a crate `drip` with no `main`, and a crate `drip-rs` with one. What are they?',
    options: [
      { t: 'Two packages', why: 'One `Cargo.toml` is one package. It can hold several crates.' },
      { t: 'A library crate and a binary crate', correct: true, why: 'The library holds the VM; the binary is the small program that runs it on a file.' },
      { t: 'Two binary crates', why: 'A crate without `main` can’t be a binary.' },
      { t: 'Two modules of the same crate', why: 'Each is compiled as its own crate; the binary uses the library.' },
    ],
  },
];
