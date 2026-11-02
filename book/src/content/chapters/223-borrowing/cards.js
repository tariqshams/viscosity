// Chapter 223 cards. Keys are stable ids: never rename them.

export const prompts = {
  'borrow-what': {
    q: 'What does `&name` create, and who owns the value afterwards?',
    a: 'A reference that borrows `name`. `name` still owns the value.',
  },
  'borrow-drop': {
    q: 'When a reference goes out of scope, is the value it points at dropped?',
    a: 'No. A reference doesn’t own the value, so nothing is freed when it goes away.',
  },
  'amp-call': {
    q: 'Why does `count(&name)` leave `name` usable afterwards, when `count(name)` doesn’t?',
    a: '`&name` lends the value; `name` moves it into the function.',
  },
  'deref-star': {
    q: 'Inside `fn bump(n: &mut i32)`, how do you add 1 to the number `n` points at?',
    a: '`*n += 1;` The `*` follows the reference to the value.',
  },
  'mut-callsite': {
    q: 'Three things must say `mut` before `bump(&mut hits)` compiles. What are they?',
    a: 'The owner (`let mut hits`), the borrow (`&mut hits`) and the parameter type (`&mut i32`).',
  },
  'write-through-shared': {
    q: 'What happens if you try to change a value through a `&T` reference?',
    a: 'It doesn’t compile (error E0594): a shared reference is read-only.',
  },
  rule: {
    q: 'State the borrowing rule for one value at one moment.',
    a: 'Either any number of shared `&T` borrows, or exactly one `&mut T`. Never both.',
  },
  'last-use': {
    q: 'Where does a borrow end: at the closing brace, or somewhere else?',
    a: 'At its last use. After that, the value can be borrowed again in a different way.',
  },
  'checker-when': {
    q: 'When does the borrow checker run, and what does that cost the running program?',
    a: 'At compile time, so there is nothing left to check while the program runs.',
  },
  'e0502-fix': {
    q: 'E0502 says a value is borrowed as immutable while you borrow it as mutable. What is the usual fix?',
    a: 'Finish using the shared borrow before you make the mutable one, often by moving a line.',
  },
  noalias: {
    q: 'Viscosity needed alias analysis to know nothing else points at an object. Why can a Rust compiler skip that for `&mut T`?',
    a: 'The rules forbid any other live pointer to that memory, so the compiler may assume there is none.',
  },
};

export const examples = {
  'borrow-len': {
    lang: 'rust',
    title: 'Lend it, then use it again',
    code: `fn count(s: &String) -> usize {
    s.len()
}

fn bump(n: &mut i32) {
    *n += 1;
}

fn main() {
    let name = String::from("drip");
    let n = count(&name);
    println!("{name} has {n} bytes");

    let mut hits = 0;
    bump(&mut hits);
    bump(&mut hits);
    println!("hits: {hits}");
}`,
  },
  'borrow-clash': {
    lang: 'rust',
    expectError: true,
    title: 'A reader and a writer at once',
    code: `fn main() {
    let mut s = String::from("tea");
    let a = &s;
    let w = &mut s;
    w.push_str("pot");
    // a is still alive here: rejected.
    // Move this line above \`let w\`.
    println!("{a}");
}`,
  },
};

export const exercises = {
  order: {
    lang: 'rust',
    title: 'Put two numbers in order, in place',
    prompt:
      'Write `order(a, b)` so that afterwards `*a <= *b`. It takes two **mutable borrows** and changes the caller’s variables in place: if `a` holds the bigger number, swap them. It returns nothing.',
    starter: `fn order(a: &mut i32, b: &mut i32) {
    // your code here
}`,
    solution: `fn order(a: &mut i32, b: &mut i32) {
    if *a > *b {
        let t = *a;
        *a = *b;
        *b = t;
    }
}`,
    tests: `#[test]
fn swaps_when_out_of_order() {
    let mut x = 5;
    let mut y = 2;
    order(&mut x, &mut y);
    assert_eq!(x, 2);
    assert_eq!(y, 5);
}
#[test]
fn leaves_ordered_pairs_alone() {
    let mut x = 1;
    let mut y = 9;
    order(&mut x, &mut y);
    assert_eq!(x, 1);
    assert_eq!(y, 9);
}
#[test]
fn equal_numbers_stay_equal() {
    let mut x = 4;
    let mut y = 4;
    order(&mut x, &mut y);
    assert_eq!(x, 4);
    assert_eq!(y, 4);
}`,
    hints: [
      '`a` and `b` are references. Compare the numbers they point at with `*a > *b`.',
      'Writing `*a = *b;` first loses the old `*a`. Save it in a local first: `let t = *a;`.',
      'Then `*a = *b;` and `*b = t;`. An `i32` is copied out by `*a`, so `t` is a plain number, not a borrow.',
    ],
    walkthrough: `Two mutable borrows, each of a *different* variable, so the borrowing rule is happy: one writer per value.

- **Compare through the references.** \`*a > *b\` reads the two numbers. Without the \`*\` you'd be comparing references, which Rust also allows, but it's clearer to say what you mean.
- **Save before you overwrite.** \`let t = *a;\` copies the number out. \`i32\` is a scalar, so this is a copy, not a move (chapter 222).
- **Write back.** \`*a = *b;\` then \`*b = t;\`.

Notice the caller had to write \`order(&mut x, &mut y)\`. In TypeScript a function you pass an object to might change it, and you'd only know by reading its body. In Rust the \`&mut\` at the call site says so.

The tests use \`assert_eq!\`, which checks that two values are equal. Chapter 234 covers it properly.`,
    wrong: [
      {
        code: `fn order(a: &mut i32, b: &mut i32) {
    if *a > *b {
        *a = *b;
        *b = *a;
    }
}`,
        why: 'After `*a = *b;` the old value of `*a` is gone, so `*b = *a;` copies the small number back. Both end up as 2. Save the old value first.',
      },
      {
        code: `fn order(mut a: i32, mut b: i32) {
    if a > b {
        let t = a;
        a = b;
        b = t;
    }
}`,
        why: 'This swaps the function’s own copies. The caller’s variables never change, and the tests don’t even compile: they pass `&mut x`, which isn’t an `i32`.',
      },
    ],
  },
  appendTwice: {
    lang: 'rust',
    optional: true,
    title: 'One writer, one reader',
    prompt:
      'Write `append_twice(s, t)`, which adds `t` to the end of `s` twice. `s` is borrowed mutably and `t` is only read. `s.push_str(x)` appends `x` to a `String`.',
    starter: `fn append_twice(
    s: &mut String,
    t: &String,
) {
    // your code here
}`,
    solution: `fn append_twice(
    s: &mut String,
    t: &String,
) {
    s.push_str(t);
    s.push_str(t);
}`,
    tests: `#[test]
fn adds_t_twice() {
    let mut s = String::from("ab");
    let t = String::from("c");
    append_twice(&mut s, &t);
    assert_eq!(s, "abcc");
}
#[test]
fn t_is_unchanged_and_still_usable() {
    let mut s = String::from("");
    let t = String::from("tea");
    append_twice(&mut s, &t);
    assert_eq!(t, "tea");
    assert_eq!(s, "teatea");
}`,
    hints: [
      '`s` is already a `&mut String`, so you can call `s.push_str(...)` on it directly.',
      'Pass `t` straight to `push_str`. It only needs to read it.',
    ],
    walkthrough: `\`s.push_str(t)\` changes the string \`s\` points at. Rust follows the reference for you when you call a method, so you don't write \`*s\` here.

Why is this allowed when the chapter's clash wasn't? \`s\` and \`t\` borrow **different** strings. The rule is per value: one writer for the first string, one reader for the second. Try calling \`append_twice(&mut s, &s)\` in the Playground: now one string would have a writer and a reader at once, and the borrow checker refuses.`,
    wrong: [
      {
        code: `fn append_twice(
    s: &mut String,
    t: &String,
) {
    s.push_str(t);
}`,
        why: 'This appends `t` only once.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Does this compile?
\`\`\`
let mut s = String::from("a");
let r1 = &s;
let r2 = &s;
println!("{r1}{r2}");
\`\`\``,
    options: [
      { t: 'Yes', correct: true, why: 'Any number of shared borrows may exist at once. Readers can’t disturb each other.' },
      { t: 'No: two references to one value', why: 'That is only a problem when one of them is `&mut`.' },
      { t: 'No: `s` was moved into `r1`', why: '`&s` borrows; it doesn’t move.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
let mut n = 1;
let a = &mut n;
let b = &mut n;
*a += 1;
\`\`\``,
    options: [
      { t: 'Yes, `n` ends up as 2', why: 'Two mutable borrows overlap here, because `a` is used after `b` is made.' },
      { t: 'Yes, because `n` is `mut`', why: '`mut` on the owner is needed, but it doesn’t lift the one-writer rule.' },
      { t: 'No: `a` is still alive when `b` is made, so there are two writers (E0499)', correct: true, why: 'Exactly one `&mut` at a time. `*a += 1` keeps `a` alive past the line that makes `b`.' },
      { t: 'No: you can’t add to an `i32` through a reference', why: '`*a += 1` is fine on its own; the problem is the second `&mut`.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
let mut s = String::from("tea");
let a = &s;
println!("{a}");
let w = &mut s;
w.push_str("pot");
\`\`\``,
    options: [
      { t: 'No: `a` lives until the end of the block', why: 'A borrow lasts until its last use, not until the closing brace.' },
      { t: 'Yes: `a` was last used before `w` was made', correct: true, why: 'The shared borrow ended at the `println!`, so the mutable one doesn’t overlap it.' },
      { t: 'No: a value that was borrowed can never be changed', why: 'It can, once the shared borrows have ended.' },
    ],
  },
  {
    q: 'What does the borrow checker do?',
    options: [
      { t: 'It counts references while the program runs and stops it on a conflict', why: 'No running check happens. The checker works on the source, at compile time.' },
      { t: 'It frees values when the last reference goes away', why: 'Owners free values (drop), and references never do.' },
      { t: 'It copies a value whenever two references would overlap', why: 'It never adds copies. It rejects the program instead.' },
      { t: 'It checks, at compile time, that no value has a writer and any other borrow at once', correct: true, why: 'That is its job, and the program it accepts needs no checks at run time.' },
    ],
  },
  {
    q: '`fn show(s: &String)` is called as `show(&name)`. What happens to `name` when `show` returns?',
    options: [
      { t: 'It is dropped, because the function finished', why: 'Only the owner’s scope ending drops the value, and `main` still owns it.' },
      { t: 'Nothing: `name` still owns the string and can be used again', correct: true, why: 'The function only borrowed it. When the reference goes away, nothing is freed.' },
      { t: 'It is moved into `show` and back again', why: 'No move happens at all. That round trip is what borrowing saves you from.' },
    ],
  },
  {
    q: 'Compared with TypeScript, what does `&mut` at a call site, like `order(&mut x, &mut y)`, tell you?',
    options: [
      { t: 'Nothing new: in both languages any function may change what you pass', why: 'In Rust a function can only change your value if you hand it a `&mut`.' },
      { t: 'That `x` and `y` will be copied', why: '`&mut` lends; it never copies the value.' },
      { t: 'That the function may change `x` and `y`, and nothing else can touch them during the call', correct: true, why: 'A `&mut` is both permission to write and a promise that it is the only way in.' },
      { t: 'That `x` and `y` are moved into the function', why: 'A move would be `order(x, y)`, and the caller would lose them.' },
    ],
  },
];
