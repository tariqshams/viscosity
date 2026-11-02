// Chapter 302 cards. Keys are stable ids: never rename them.

export const prompts = {
  'borrow-what': {
    q: 'What does `&name` create, and who owns the value afterwards?',
    a: 'A reference that borrows `name`. `name` still owns the value.',
  },
  'borrow-drop': {
    q: 'When a reference goes out of scope, is the value it points at dropped?',
    a: 'No. A reference does not own the value, so nothing is freed when it goes away.',
  },
  'amp-call': {
    q: 'Why does `count(&name)` leave `name` usable afterwards, when `count(name)` does not?',
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
    a: 'It does not compile (error E0594): a shared reference is read-only.',
  },
  'ref-no-drop': {
    q: 'Can a function that was lent a `&mut String` drop it or move it away?',
    a: 'No. A mutable borrow may read and change the value, but only the owner can move or drop it.',
  },
  'ref-runtime': {
    q: 'What is a Rust reference at run time?',
    a: 'Just an address (eight bytes on a 64-bit machine), like a C pointer. All the checking happened at compile time.',
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
    walkthrough: `**How to think about it.** The function does not own \`x\` and \`y\`; it was lent the right to change them, and each change must go *through* a reference with \`*\`. Swapping two values in place is the classic three-step dance with a spare: put one aside, overwrite it with the other, then put the spare in the other’s place. Without the spare, the first write destroys a value you still need.

**The solution, line by line.**

- \`fn order(a: &mut i32, b: &mut i32) {\` takes two mutable borrows, each of a *different* variable, and returns nothing (no arrow, so \`()\`).
- \`if *a > *b {\` follows both references and compares the numbers. Without the \`*\` you would be comparing the references themselves, which Rust also allows (it compares what they point at), but saying \`*\` says what you mean.
- \`let t = *a;\` copies the first number out into a plain local. \`i32\` is a Copy type, so this is a copy, not a move, and \`t\` is an ordinary number, not a borrow.
- \`*a = *b;\` writes the second number into the caller’s first variable.
- \`*b = t;\` writes the saved number into the caller’s second variable.
- \`}\` closes the \`if\`; when the pair is already in order, nothing is written.
- \`}\` closes the function. The borrows end here, and the caller can use \`x\` and \`y\` again.

Notice that the caller had to write \`order(&mut x, &mut y)\`: you can see from the call alone that \`order\` may change both. The tests use \`assert_eq!\`, which the chapter *Testing in Rust* covers properly.

**Common wrong attempts.**

- Skipping the spare: \`*a = *b; *b = *a;\` copies the small number into \`a\`, then copies it straight back into \`b\`, so both end up as 2.
- Taking the numbers by value, \`fn order(mut a: i32, mut b: i32)\`: this swaps the function’s own copies, the caller’s variables never change, and the tests do not even compile, because they pass \`&mut x\`, which is not an \`i32\`.`,
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
        why: 'This swaps the function’s own copies. The caller’s variables never change, and the tests do not even compile: they pass `&mut x`, which is not an `i32`.',
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
      'Pass `t` straight to `push_str`; it only needs to read it. Do it twice.',
    ],
    walkthrough: `**How to think about it.** One parameter may be changed and the other may only be read, and the types say which: \`s: &mut String\` and \`t: &String\`. Appending is a method on \`String\`, and method calls follow references for you.

**The solution, line by line.**

- \`fn append_twice(s: &mut String, t: &String) {\` (split over lines to fit) borrows the first string for changing and the second for reading.
- \`s.push_str(t);\` follows \`s\` to the caller’s string and appends the text \`t\` points at. No \`*\` is needed: a method call follows the reference.
- \`s.push_str(t);\` does it again.
- \`}\` ends both borrows; the caller’s \`t\` is untouched and still usable.

**Common wrong attempts.**

- Appending once: the first test wants \`"abcc"\` and gets \`"abc"\`.
- Trying \`append_twice(&mut s, &s)\` in a test of your own: one string would then have a writer and a reader at once, and the borrow checker refuses, as the next chapter explains.`,
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
    q: '`fn show(s: &String)` is called as `show(&name)`. What happens to `name` when `show` returns?',
    options: [
      { t: 'It is dropped, because the function finished', why: 'Only the owner’s scope ending drops the value, and `main` still owns it.' },
      { t: 'Nothing: `name` still owns the string and can be used again', correct: true, why: 'The function only borrowed it. When the reference goes away, nothing is freed.' },
      { t: 'It is moved into `show` and back again', why: 'No move happens at all. That round trip is what borrowing saves you from.' },
      { t: 'It becomes empty', why: 'A shared borrow cannot change the value, let alone empty it.' },
    ],
  },
  {
    q: 'Compared with TypeScript, what does `&mut` at a call site, like `order(&mut x, &mut y)`, tell you?',
    options: [
      { t: 'Nothing new: in both languages any function may change what you pass', why: 'In Rust a function can only change your value if you hand it a `&mut`.' },
      { t: 'That `x` and `y` will be copied', why: '`&mut` lends; it never copies the value.' },
      { t: 'That the function may change `x` and `y`', correct: true, why: 'A `&mut` is permission to write, and you can see it at the call without reading the function.' },
      { t: 'That `x` and `y` are moved into the function', why: 'A move would be `order(x, y)`, and the caller would lose them.' },
    ],
  },
  {
    q: '`fn bump(n: &i32) { *n += 1; }` What does rustc say?',
    options: [
      { t: 'Nothing; it compiles and adds 1', why: 'A `&i32` is read-only.' },
      { t: 'E0594: cannot assign to `*n`, which is behind a `&` reference', correct: true, why: 'Writing needs a `&mut i32`, and the help line suggests exactly that.' },
      { t: 'E0382: use of moved value', why: 'Nothing was moved; the problem is writing through a shared reference.' },
      { t: 'It compiles but panics when run', why: 'This is caught at compile time.' },
    ],
  },
  {
    q: '`let hits = 0; bump(&mut hits);` (with `bump(n: &mut i32)`). Why does it fail?',
    options: [
      { t: '`bump` must be declared `mut`', why: 'Functions are never `mut`; the owner is.' },
      { t: 'Integers cannot be borrowed', why: 'Any value can be borrowed.' },
      { t: 'You cannot lend for changing something whose owner is not `mut` (E0596)', correct: true, why: 'Write `let mut hits = 0;`. The permission to change starts with the owner.' },
      { t: 'The `&mut` should be `mut&`', why: 'The syntax is `&mut hits`.' },
    ],
  },
  {
    q: 'Which of these can a function do with a value it was lent as `&mut String`?',
    options: [
      { t: 'Append to it', correct: true, why: 'A mutable borrow may read and change the value.' },
      { t: 'Drop it early with `drop`', why: 'Only the owner can drop it; `drop` needs ownership.' },
      { t: 'Move it into another variable', why: 'You cannot move out of a borrow: the owner still needs the value.' },
      { t: 'Keep it after the function returns', why: 'The borrow ends when the function does; the value goes back to its owner.' },
    ],
  },
];
