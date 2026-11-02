// Chapter 335-b cards (the second half of chapter 335): recall prompts,
// examples, exercises and quiz. Keys are stable ids: renaming one would
// orphan readers' review history.

export const prompts = {
  'own-move-what': {
    q: 'When `let b = a;` moves a `String`, what is copied, and what is not?',
    a: 'The stack part (pointer, length, capacity) is copied. The text on the heap is not: `b` now owns the same heap text.',
  },
  'own-after-move': {
    q: 'What happens if you use `a` after `let b = a;` where `a` is a `String`?',
    a: 'A compile error (E0382): `a` was moved, so it can no longer be used.',
  },
  'own-copy': {
    q: 'Why is `n` still usable after `let m = n;` when `n` is an `i32`?',
    a: '`i32` is a Copy type: assignment copies the value, so nothing is moved.',
  },
  'own-clone': {
    q: 'How do you get a second, independent `String` with the same text?',
    a: 'Call `clone()`: `let b = a.clone();` copies the heap text into a new allocation with its own owner.',
  },
  'own-fn-move': {
    q: 'You call `eat(a)` where `eat` takes a `String`. Can you use `a` afterwards?',
    a: 'No. Passing it moved ownership into `eat`, which drops it when it returns.',
  },
  'own-return': {
    q: 'A function builds a `String` and returns it. Why is the text not freed when the function ends?',
    a: 'Returning moves ownership to the caller, so the caller’s variable is the owner now.',
  },
  'own-loop-move': {
    q: 'Why does `let t = s;` inside a loop fail with “value moved here, in previous iteration of loop”?',
    a: 'The first time round moves `s` away, so on the second time there is nothing left to move.',
  },
  'own-ledger': {
    q: 'In *A borrow checker in miniature*, which part of the ledger matches Rust’s moves?',
    a: 'The list of moved names: a move crosses a name off, and any later use of a crossed-off name is an error.',
  },
};

export const examples = {
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
  duplicate: {
    lang: 'rust',
    title: 'Two owners need two copies',
    prompt: `Write \`duplicate(s)\`, which takes ownership of a \`String\` and returns **two** \`String\`s with the same text, as a tuple. (A tuple type \`(String, String)\` is a fixed pair, like TypeScript’s \`[string, string]\`. You build one with \`(x, y)\`.) The two must be independent: changing one must not change the other.`,
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
  longer: {
    optional: true,
    lang: 'rust',
    title: 'Keep the longer one',
    prompt: `Write \`longer(a, b)\`, which takes ownership of two \`String\`s and returns the one with more bytes (\`.len()\`). On a tie, return \`a\`. The other string is dropped when the function ends.`,
    starter: `fn longer(a: String, b: String)
    -> String {
    todo!()
}`,
    solution: `fn longer(a: String, b: String)
    -> String {
    if a.len() >= b.len() {
        a
    } else {
        b
    }
}`,
    tests: `#[test]
fn picks_the_longer_first() {
    let a = String::from("closure");
    let b = String::from("vm");
    assert_eq!(longer(a, b), "closure");
}

#[test]
fn picks_the_longer_second() {
    let a = String::from("gc");
    let b = String::from("upvalue");
    assert_eq!(longer(a, b), "upvalue");
}

#[test]
fn a_tie_keeps_the_first() {
    let a = String::from("abc");
    let b = String::from("xyz");
    assert_eq!(longer(a, b), "abc");
}`,
    hints: [
      'Use an `if` expression as the whole body.',
      'Reading `a.len()` does not move `a`; it only looks at it.',
      'Return `a` when `a.len() >= b.len()`, otherwise `b`. Whichever is not returned is dropped at the closing brace.',
    ],
    walkthrough: `**How to think about it.** The function owns both strings, so it may give either one back. Comparing them must not move them, and it does not: \`len()\` only looks. Then one of the two moves out to the caller, and the other is still owned by the function when it ends, so it is dropped there.

**The solution, line by line.**

- \`fn longer(a: String, b: String)\` takes ownership of two strings.
- \`    -> String {\` promises one owned string back.
- \`    if a.len() >= b.len() {\` compares the lengths; both strings are still owned by the function afterwards. \`>=\` makes a tie go to \`a\`.
- \`        a\` is the first branch’s value, so \`a\` moves out as the return value.
- \`    } else {\` and \`        b\` move \`b\` out instead.
- \`    }\` ends the \`if\`, which is the body’s last expression, so its value is returned.
- \`}\` ends the function, where the parameter that was *not* moved out is dropped and its text freed.

**Common wrong attempts.**

- \`>\` instead of \`>=\`: on a tie this returns \`b\`, but the exercise asks for \`a\`.
- \`let keep = b;\` before the comparison: that moves \`b\`, so \`b.len()\` is then a use of a moved value.`,
    wrong: [
      {
        code: `fn longer(a: String, b: String)
    -> String {
    if a.len() > b.len() {
        a
    } else {
        b
    }
}`,
        why: 'On a tie this returns `b`, but the exercise asks for `a`. Use `>=`.',
      },
      {
        code: `fn longer(a: String, b: String)
    -> String {
    let keep = b;
    if a.len() >= b.len() {
        a
    } else {
        keep
    }
}`,
        why: 'Does not compile: `let keep = b;` moved the string, so `b.len()` uses a moved value.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Which line fails to compile?
\`\`\`rust
let a = String::from("x"); // 1
let b = a;                 // 2
let c = b.clone();         // 3
println!("{a}");           // 4
\`\`\``,
    options: [
      { t: 'Line 2', why: 'Moving `a` into `b` is allowed. It is using `a` afterwards that is not.' },
      { t: 'Line 3', why: '`b` owns the string, so cloning it is fine.' },
      { t: 'Line 4', correct: true, why: '`a` was moved on line 2, so reading it is E0382, “borrow of moved value”.' },
      { t: 'None of them', why: 'In TypeScript this would run, but Rust tracks the move.' },
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
      { t: 'No: `x` was moved into `y`', why: 'Integers are Copy, so nothing moves.' },
      { t: 'Yes: `i32` is Copy, so `x` and `y` are separate 5s', correct: true, why: 'Copy types are duplicated on assignment, and both stay usable.' },
      { t: 'No: `x` must be `mut`', why: 'Nothing changes `x`, so it needs no `mut`.' },
      { t: 'Yes, but `x` is dropped first', why: 'It compiles, but not for that reason, and drop order is not the question.' },
    ],
  },
  {
    q: 'What does `let b = a;` copy when `a` is a `String` holding a million bytes?',
    options: [
      { t: 'All million bytes', why: 'That would be a deep copy, and Rust never does those automatically. Use `clone` for that.' },
      { t: 'Nothing at all', why: 'The stack part (pointer, length, capacity) is copied into `b`.' },
      { t: 'Only the pointer, the length and the capacity', correct: true, why: 'A move copies the small stack part, and ownership of the heap bytes goes with it.' },
      { t: 'Half the bytes; the rest are shared', why: 'There is no such thing in Rust. The heap bytes stay where they are, with one owner.' },
    ],
  },
  {
    q: 'You write `fn show(s: String)` and call `show(name)` twice in a row. What happens?',
    options: [
      { t: 'It prints twice', why: 'The first call moves `name` into `show`, so there is nothing left to pass the second time.' },
      { t: 'A run-time error on the second call', why: 'Rust catches this at compile time.' },
      { t: 'The second call gets an empty string', why: 'Rust does not invent a value; it refuses to compile.' },
      { t: 'A compile error: use of moved value', correct: true, why: 'The first call takes ownership. The next chapter’s borrowing is the fix.' },
    ],
  },
  {
    q: 'A `String` is moved from `a` to `b`, and both go out of scope at the same brace. How many times is the text freed?',
    options: [
      { t: 'Twice, once for each name', why: 'That would be a double free; Rust prevents it.' },
      { t: 'Once, when `b` is dropped; a moved-from variable owns nothing', correct: true, why: 'Only the owner drops the value, and after the move that is `b` alone.' },
      { t: 'Never: moved values leak', why: 'The new owner frees it as usual.' },
      { t: 'Once, when `a` is dropped', why: '`a` gave up ownership at the move.' },
    ],
  },
];
