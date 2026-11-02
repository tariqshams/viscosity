// Chapter 298 cards: recall prompts, examples, exercises and quiz.
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
};

export const quiz = [
  {
    q: 'Your TypeScript Drip VM has its own mark-and-sweep collector. Why did it need one, even though V8 has a garbage collector?',
    options: [
      { t: 'V8’s collector is too slow for VMs', why: 'Speed was not the reason. V8 could not tell which Drip objects were still in use.' },
      { t: 'Only the VM knows which Drip objects are still reachable; its object list keeps everything alive to V8', correct: true, why: 'Right. To V8, every object on the list is reachable, so it would never free one. Only the VM can trace from Drip’s own roots.' },
      { t: 'TypeScript turns V8’s collector off', why: 'TypeScript has no effect on the running engine: its types are erased.' },
      { t: 'It didn’t need one; the collector was optional', why: 'Without it, the Drip heap only grows: every string ever built stays alive.' },
    ],
  },
  {
    q: 'Which of these happens **while** a Rust binary runs?',
    options: [
      { t: 'Type checking', why: 'rustc checks types before producing the binary.' },
      { t: 'JIT compilation of hot functions', why: 'Rust is compiled ahead of time; the binary contains no JIT.' },
      { t: 'Tracing garbage collection', why: 'Rust has no garbage collector. Freeing is placed by the compiler.' },
      { t: 'The machine code rustc produced runs on the CPU', correct: true, why: 'That is all that is left to do at run time. Everything else happened before.' },
    ],
  },
  {
    q: 'In this book’s run, drip-rs was 4.69× as fast as the TypeScript VM on `fib`. What is the fairest conclusion?',
    options: [
      { t: 'Rust is about 5× faster than JavaScript', why: 'One port of one program on one machine cannot support a claim about two whole languages.' },
      { t: 'The TypeScript VM has a bug', why: 'Both VMs print the same output byte for byte; slower is not buggy.' },
      { t: 'This Rust port ran this program about 4.7× as fast here, on this machine and day', correct: true, why: 'That is what was measured: same machine, same day, best of three for both.' },
      { t: 'Nothing, because compile time was included', why: 'It was included for both, so the comparison is still meaningful, just not universal.' },
    ],
  },
  {
    q: 'You forget the `!` and write `println("hi");`. What happens?',
    options: [
      { t: 'A compile error: expected function, found macro', correct: true, why: 'rustc 1.97 reports E0423 and its help line suggests adding the `!`.' },
      { t: 'It prints `hi` anyway', why: 'Without the `!`, Rust looks for a function called `println`, and there is none.' },
      { t: 'It prints nothing and carries on', why: 'The program never compiles, so nothing runs.' },
      { t: 'A crash at run time', why: 'Rust finds this before running: it is a compile error.' },
    ],
  },
  {
    q: 'A file holds `fn start() { println!("hi"); }` and nothing else. What does rustc say?',
    options: [
      { t: 'It compiles and prints `hi`', why: 'Nothing calls `start`, and a program needs somewhere to begin.' },
      { t: 'It compiles and prints nothing', why: 'rustc refuses to build a program with no entry point.' },
      { t: 'error[E0601]: `main` function not found', correct: true, why: 'Every Rust program starts in `fn main()`; a function with another name is never run on its own.' },
      { t: 'error: `start` is a reserved word', why: '`start` is an ordinary name. The problem is the missing `main`.' },
    ],
  },
];
