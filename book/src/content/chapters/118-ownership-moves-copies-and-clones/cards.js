// Chapter 118 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 118, 118.

export const prompts = {
  'own-rules': {
    q: 'State Rust’s three ownership rules.',
    a: 'Each value has an owner. There is only one owner at a time. When the owner goes out of scope, the value is dropped.',
  },
  'own-string-parts': {
    q: 'A `String` has a stack part and a heap part. What is in each?',
    a: 'Stack: a pointer, a length and a capacity (24 bytes on a 64-bit machine). Heap: the text itself.',
  },
  'own-drop-order': {
    q: 'Three variables are declared in one scope: `x`, then `y`, then `z`. In what order are they dropped?',
    a: 'Reverse order of declaration: `z`, then `y`, then `x`.',
  },
  'own-drop-reassign': {
    q: '`let mut d = String::from("d1"); d = String::from("d2");` When is "d1" freed?',
    a: 'At the assignment: giving `d` a new value drops its old one first.',
  },
  'own-move-what': {
    q: 'When `let b = a;` moves a `String`, what is copied, and what is not?',
    a: 'The stack part (pointer, length, capacity) is copied. The text on the heap is not: `b` now owns the same heap text.',
  },
  'own-copy': {
    q: 'Why is `n` still usable after `let m = n;` when `n` is an `i32`?',
    a: '`i32` is a Copy type: assignment copies the value, so nothing is moved.',
  },
  'own-fn-move': {
    q: 'You call `eat(a)` where `eat` takes a `String`. Can you use `a` afterwards?',
    a: 'No. Passing it moved ownership into `eat`, which drops it when it returns.',
  },
};

export const examples = {
  drops: {
    title: 'Watching values drop',
    lang: 'rust',
    code: `struct Noisy(&'static str);

// Print a line when a Noisy is dropped.
// (impl and Drop: later chapters.)
impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

fn main() {
    let _a = Noisy("a");
    let _b = Noisy("b");
    {
        let _c = Noisy("c");
        println!("inner block ends");
    }
    let mut d = Noisy("d1");
    d = Noisy("d2");
    drop(_b);
    println!("main ends");
}`,
  },
  moves: {
    title: 'Moves, copies and clones',
    lang: 'rust',
    code: `fn take(s: String) -> usize {
    s.len()
} // s is dropped here

fn make() -> String {
    String::from("vm")
}

fn main() {
    let n = 7;
    let m = n; // copy: both usable
    println!("{n} {m}");

    let a = String::from("fib");
    let b = a; // move: a is gone
    let c = b.clone();
    println!("{b} {c}");

    let len = take(b); // b moves
    println!("{len}");

    let g = make(); // g owns it
    println!("{g}");
    // Try: println!("{a}");
}`,
  },
};

export const exercises = {
  bar: {
    optional: true,
    lang: 'rust',
    title: 'A bar for a bar chart',
    prompt: `Benchmark charts like the one in *Why Rust, and cargo* can be drawn in a terminal with rows of \`#\`. Write \`bar(n)\`, which **builds and returns** a new \`String\` holding \`n\` hash signs: \`bar(3)\` is \`"###"\`, and \`bar(0)\` is \`""\`.

\`String::new()\` makes an empty \`String\`, \`s.push(c)\` adds the \`char\` \`c\` to the end of \`s\` (which must be \`mut\`), and \`s.len()\` is its length in bytes.`,
    starter: `fn bar(n: usize) -> String {
    todo!()
}`,
    solution: `fn bar(n: usize) -> String {
    let mut s = String::new();
    while s.len() < n {
        s.push('#');
    }
    return s;
}`,
    tests: `#[test]
fn three_hashes() {
    assert_eq!(bar(3), "###");
}

#[test]
fn zero_is_empty() {
    assert_eq!(bar(0), "");
}

#[test]
fn a_long_bar() {
    assert_eq!(bar(40).len(), 40);
}`,
    hints: [
      'Start with an empty `String` that your function owns, and add one `#` at a time until it is long enough.',
      '`let mut s = String::new();` then `while s.len() < n { ... }`. The string must be `mut`, because `push` changes it.',
      'Inside the loop, `s.push(\'#\');` (single quotes: a `char`). After the loop, `return s;` hands the string to the caller.',
    ],
    walkthrough: `**How to think about it.** The function must *make* something on the heap and give it to whoever called. Ask the ownership questions as you go: who owns the new text while it is being built (a local variable, \`s\`), and who owns it afterwards (the caller, because the function hands it over). The length is the stopping rule: keep adding a \`#\` while the text is shorter than \`n\`. Each \`#\` is one byte, so \`s.len()\` counts them exactly.

**The solution, line by line.**

- \`fn bar(n: usize) -> String {\` takes a count (\`usize\`, the type for lengths) and promises to give back an owned \`String\`.
- \`let mut s = String::new();\` makes an empty \`String\`; \`s\` is its owner. It is \`mut\` because we are about to change it.
- \`while s.len() < n {\` repeats while there are fewer than \`n\` signs. For \`n = 0\` the loop never runs.
- \`s.push('#');\` adds one \`char\` to the end, growing the heap text (the \`String\` asks the heap for more room when it needs it).
- \`}\` closes the loop.
- \`return s;\` hands \`s\`, and with it ownership of the heap text, to the caller. That is why the text is *not* freed at the closing brace below: \`s\` no longer owns anything when the function ends. (This is a **move**; and, as *Rust basics: variables, numbers, functions and blocks* showed, the last line could just as well be the tail expression \`s\`, without \`return\`.)
- \`}\` closes the function.

**Common wrong attempts.**

- \`let s = String::new();\` without \`mut\`: \`s.push('#')\` changes \`s\`, so rustc reports E0596, “cannot borrow \`s\` as mutable, as it is not declared as mutable”.
- \`s.push("#")\` with double quotes: \`"#"\` is a piece of text (\`&str\`), not a \`char\`, so rustc says “expected \`char\`, found \`&str\`”. (\`s.push_str("#")\` would work, as *Slices, String and &str* explains.)
- \`while s.len() <= n\` adds one sign too many: \`bar(3)\` would be \`"####"\`.`,
    wrong: [
      {
        code: `fn bar(n: usize) -> String {
    let s = String::new();
    while s.len() < n {
        s.push('#');
    }
    return s;
}`,
        why: '`push` changes `s`, so `s` must be `mut`: rustc reports E0596, “cannot borrow `s` as mutable”.',
      },
      {
        code: `fn bar(n: usize) -> String {
    let mut s = String::new();
    while s.len() <= n {
        s.push('#');
    }
    return s;
}`,
        why: 'With `<=` the loop runs once more, so `bar(3)` is `"####"` and `bar(0)` is `"#"`.',
      },
    ],
  },
  duplicate: {
    lang: 'rust',
    title: 'Two owners need two copies',
    prompt: 'Write `duplicate(s)`, which takes ownership of a `String` and returns **two** `String`s with the same text, as a tuple. (A tuple type `(String, String)` is a fixed pair, like TypeScript’s `[string, string]`. You build one with `(x, y)`.) The two must be independent: changing one must not change the other.',
    starter: `fn duplicate(s: String)
    -> (String, String) {
    todo!()
}`,
    solution: `fn duplicate(s: String)
    -> (String, String) {
    (s.clone(), s)
}`,
    tests: `#[test]
fn both_hold_the_text() {
    let (a, b) = duplicate(String::from("vm"));
    assert_eq!(a, "vm");
    assert_eq!(b, "vm");
}

#[test]
fn works_for_empty_text() {
    let (a, b) = duplicate(String::new());
    assert_eq!(a, "");
    assert_eq!(b, "");
}

#[test]
fn the_copies_are_independent() {
    let s = String::from("fib");
    let (mut a, b) = duplicate(s);
    a.push('!');
    assert_eq!(a, "fib!");
    assert_eq!(b, "fib");
}`,
    hints: [
      'Try `(s, s)` first and read the compiler error carefully.',
      'Each half of the pair needs its own owner, so you need a second heap copy of the text.',
      'Clone once and move the original: `(s.clone(), s)`. The order matters: the clone must happen before `s` is moved.',
    ],
    walkthrough: `**How to think about it.** Count owners. The pair holds two \`String\`s, each \`String\` has exactly one owner, and you were handed one. So you need one more \`String\`, which means one more heap copy of the text; there is no way to make two owners of the same text. Then ask which of the two can be the original: you already own \`s\`, so moving it into the pair costs nothing, and only the second one has to be made.

**The solution, line by line.**

- \`fn duplicate(s: String)\` takes ownership of a \`String\`; the caller’s variable was moved into \`s\`.
- \`    -> (String, String) {\` promises a pair of owned strings (the signature is split over two lines to fit).
- \`    (s.clone(), s)\` builds the pair, left to right. First \`s.clone()\` makes a new heap copy of the text, while \`s\` is still usable; then \`s\` itself moves into the second slot. The tuple is the body’s last expression, so it is returned, and the caller becomes the owner of both strings.
- \`}\` closes the function. Nothing is dropped here, because \`s\` was moved out.

The independence test is the lesson of *References: two names, one object* in reverse: in JavaScript, two names for one object see each other’s changes; in Rust, two owners always mean two values.

**Common wrong attempts.**

- \`(s, s)\`: the first \`s\` moves the string into the tuple, so the second \`s\` uses a moved value, and rustc reports E0382, “use of moved value: \`s\`”.
- \`let t = s;\` followed by \`(s.clone(), t)\`: \`let t = s;\` already moved the string, so \`s.clone()\` is a “borrow of moved value”. Clone before you move.
- \`(s.clone(), s.clone())\` passes the tests, but it makes an extra copy and then drops the original at the closing brace: twice the work for the same result. Moving what you already own is free.`,
    wrong: [
      {
        code: `fn duplicate(s: String)
    -> (String, String) {
    (s, s)
}`,
        why: 'Does not compile: E0382, “use of moved value: `s`”. The first `s` moves the string, and there is nothing left for the second.',
      },
      {
        code: `fn duplicate(s: String)
    -> (String, String) {
    let t = s;
    (s.clone(), t)
}`,
        why: 'Does not compile: `let t = s;` already moved the string out of `s`, so `s.clone()` is a borrow of a moved value. Clone before you move.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'At the end of a scope holding `let p = ...; let q = ...;` (both `String`s), what happens?',
    options: [
      {
        t: '`q` is dropped, then `p`',
        correct: true,
        why: 'Variables drop in reverse order of declaration, and each frees its heap text.',
      },
      {
        t: '`p` is dropped, then `q`',
        why: 'It is the reverse: the last declared is dropped first.',
      },
      {
        t: 'Nothing, until the garbage collector runs',
        why: 'Rust has no garbage collector. Dropping happens right there, at the `}`.',
      },
      {
        t: 'They are kept until the program exits',
        why: 'They are freed as soon as their owners go out of scope.',
      },
    ],
  },
  {
    q: `Which line fails to compile?
\`\`\`rust
let a = String::from("x"); // 1
let b = a;                 // 2
let c = b.clone();         // 3
println!("{a}");           // 4
\`\`\``,
    options: [
      {
        t: 'Line 2',
        why: 'Moving `a` into `b` is allowed. It is using `a` afterwards that is not.',
      },
      {
        t: 'Line 3',
        why: '`b` owns the string, so cloning it is fine.',
      },
      {
        t: 'Line 4',
        correct: true,
        why: '`a` was moved on line 2, so reading it is E0382, “borrow of moved value”.',
      },
      {
        t: 'None of them',
        why: 'In TypeScript this would run, but Rust tracks the move.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
let x = 5;
let y = x;
println!("{x} {y}");
\`\`\``,
    options: [
      {
        t: 'No: `x` was moved into `y`',
        why: 'Integers are Copy, so nothing moves.',
      },
      {
        t: 'Yes: `i32` is Copy, so `x` and `y` are separate 5s',
        correct: true,
        why: 'Copy types are duplicated on assignment, and both stay usable.',
      },
      {
        t: 'No: `x` must be `mut`',
        why: 'Nothing changes `x`, so it needs no `mut`.',
      },
      {
        t: 'Yes, but `x` is dropped first',
        why: 'It compiles, but not for that reason, and drop order is not the question.',
      },
    ],
  },
  {
    q: 'You write `fn show(s: String)` and call `show(name)` twice in a row. What happens?',
    options: [
      {
        t: 'It prints twice',
        why: 'The first call moves `name` into `show`, so there is nothing left to pass the second time.',
      },
      {
        t: 'A run-time error on the second call',
        why: 'Rust catches this at compile time.',
      },
      {
        t: 'The second call gets an empty string',
        why: 'Rust does not invent a value; it refuses to compile.',
      },
      {
        t: 'A compile error: use of moved value',
        correct: true,
        why: 'The first call takes ownership. Borrowing the string instead is the fix.',
      },
    ],
  },
  {
    q: 'A `String` is moved from `a` to `b`, and both go out of scope at the same brace. How many times is the text freed?',
    options: [
      {
        t: 'Twice, once for each name',
        why: 'That would be a double free; Rust prevents it.',
      },
      {
        t: 'Once, when `b` is dropped; a moved-from variable owns nothing',
        correct: true,
        why: 'Only the owner drops the value, and after the move that is `b` alone.',
      },
      {
        t: 'Never: moved values leak',
        why: 'The new owner frees it as usual.',
      },
      {
        t: 'Once, when `a` is dropped',
        why: '`a` gave up ownership at the move.',
      },
    ],
  },
];
