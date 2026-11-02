// Chapter 278 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'own-rules': {
    q: 'State Rust’s three ownership rules.',
    a: 'Each value has an owner. There is only one owner at a time. When the owner goes out of scope, the value is dropped.',
  },
  'own-move-what': {
    q: 'When `let b = a;` moves a `String`, what is copied, and what isn’t?',
    a: 'The stack part (pointer, length, capacity) is copied. The text on the heap is not: b now owns the same heap box.',
  },
  'own-after-move': {
    q: 'What happens if you use `a` after `let b = a;` where `a` is a `String`?',
    a: 'A compile error (E0382): `a` was moved, so it can no longer be used.',
  },
  'own-clone': {
    q: 'How do you get a second, independent `String` with the same text?',
    a: 'Call `clone()`: `let b = a.clone();` copies the heap text into a new box with its own owner.',
  },
  'own-copy': {
    q: 'Why is `n` still usable after `let m = n;` when `n` is an `i32`?',
    a: '`i32` is a Copy type: assignment copies the value, so nothing is moved.',
  },
  'own-fn-move': {
    q: 'You call `eat(a)` where `eat` takes a `String`. Can you use `a` afterwards?',
    a: 'No. Passing it moved ownership into `eat`, which drops it when it returns.',
  },
  'own-return': {
    q: 'A function builds a `String` and returns it. Why isn’t the text freed when the function ends?',
    a: 'Returning moves ownership to the caller, so the caller’s variable is the owner now.',
  },
  'own-drop-order': {
    q: 'Three variables are declared in one scope: `x`, then `y`, then `z`. In what order are they dropped?',
    a: 'Reverse order of declaration: `z`, then `y`, then `x`.',
  },
  'own-gc-diff': {
    q: 'Your chapter 150 collector found garbage by tracing from the roots at run time. When does Rust decide where a value is freed?',
    a: 'At compile time: the drop point follows from the code’s structure (the owner’s scope), so nothing is traced while the program runs.',
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
    walkthrough: `The pair needs two \`String\`s, and each \`String\` has exactly one owner. You were handed one.

- **\`(s, s)\` fails.** The first \`s\` moves the string into the tuple, so the second \`s\` uses a moved value. rustc 1.97 says “use of moved value: \`s\`” and even suggests the fix.
- **\`clone\` makes the second one.** \`s.clone()\` builds a new heap box holding a copy of the text, with its own owner.
- **Then move the original.** In \`(s.clone(), s)\` the clone happens first, while \`s\` is still usable, and then \`s\` itself moves into the second slot. One allocation, not two.

\`(s.clone(), s.clone())\` also passes, but it makes an extra copy and then drops the original. Moving what you already own is free.

The independence test is chapter 7's lesson in reverse. In JavaScript, two names for one object see each other's changes. In Rust, two owners always mean two values.`,
    wrong: [
      {
        code: `fn duplicate(s: String)
    -> (String, String) {
    (s, s)
}`,
        why: 'Doesn’t compile: E0382, “use of moved value: `s`”. The first `s` moves the string, and there is nothing left for the second.',
      },
      {
        code: `fn duplicate(s: String)
    -> (String, String) {
    let t = s;
    (s.clone(), t)
}`,
        why: 'Doesn’t compile: `let t = s;` already moved the string out of `s`, so `s.clone()` is a borrow of a moved value. Clone before you move.',
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
      'Use an `if` expression as the whole body (chapter 277).',
      'Reading `a.len()` doesn’t move `a`; it only looks at it.',
      'Return `a` when `a.len() >= b.len()`, otherwise `b`. Whichever isn’t returned is dropped at the closing brace.',
    ],
    walkthrough: `The function owns both strings, so it can give either one back.

- **Compare without moving.** \`a.len()\` and \`b.len()\` just read the lengths. Both strings are still owned by the function afterwards.
- **Move one out.** The \`if\` expression produces either \`a\` or \`b\`, and that value moves out to the caller.
- **The other is dropped.** At the function's closing \`}\`, the parameter that wasn't moved out still owns its string, so it is dropped there and its memory freed. The returned one has a new owner.

Using \`>=\` gives \`a\` on a tie.`,
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
        why: 'Doesn’t compile: `let keep = b;` moved the string, so `b.len()` uses a moved value.',
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
      { t: 'Line 2', why: 'Moving `a` into `b` is allowed. It’s using `a` afterwards that isn’t.' },
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
      { t: 'Yes, but `x` is dropped first', why: 'It compiles, but not for that reason, and drop order isn’t the question.' },
    ],
  },
  {
    q: 'What does `let b = a;` copy when `a` is a `String` holding a million bytes?',
    options: [
      { t: 'All million bytes', why: 'That would be a deep copy, and Rust never does those automatically. Use `clone` for that.' },
      { t: 'Nothing at all', why: 'The stack part (pointer, length, capacity) is copied into `b`.' },
      { t: 'Only the pointer, the length and the capacity', correct: true, why: 'A move copies the small stack part, and ownership of the heap bytes goes with it.' },
      { t: 'Half the bytes, the rest are shared', why: 'There’s no such thing in Rust. The heap bytes stay where they are, with one owner.' },
    ],
  },
  {
    q: 'At the end of a scope holding `let p = ...; let q = ...;` (both `String`s, never moved), what happens?',
    options: [
      { t: '`q` is dropped, then `p`', correct: true, why: 'Variables drop in reverse order of declaration, and each frees its heap text.' },
      { t: '`p` is dropped, then `q`', why: 'It’s the reverse: the last declared is dropped first.' },
      { t: 'Nothing, until the garbage collector runs', why: 'Rust has no garbage collector. Dropping happens right there, at the `}`.' },
      { t: 'They are kept until the program exits', why: 'They are freed as soon as their owners go out of scope.' },
    ],
  },
  {
    q: 'You write `fn show(s: String)` and call `show(name)` twice in a row. What happens?',
    options: [
      { t: 'It prints twice', why: 'The first call moves `name` into `show`, so there is nothing left to pass the second time.' },
      { t: 'A run-time error on the second call', why: 'Rust catches this at compile time.' },
      { t: 'The second call gets an empty string', why: 'Rust doesn’t invent a value; it refuses to compile.' },
      { t: 'A compile error: use of moved value', correct: true, why: 'The first call takes ownership. Chapter 279’s borrowing is the fix.' },
    ],
  },
  {
    q: 'Why does drip-rs still need a garbage collector, when Rust has ownership?',
    options: [
      { t: 'Rust’s ownership is too slow for a VM', why: 'Speed isn’t the reason. Ownership costs nothing at run time.' },
      { t: 'Drip programs share objects freely, so the Drip heap can’t be expressed as one owner per object', correct: true, why: 'Many Drip values can point at one object, so reachability has to be traced, exactly as in chapter 150.' },
      { t: 'It doesn’t; drip-rs has no collector', why: 'It has one: `gc.rs`, a mark-and-sweep collector.' },
      { t: 'Because the TypeScript version had one', why: 'It’s needed for Drip’s own sharing, not for symmetry.' },
    ],
  },
];
