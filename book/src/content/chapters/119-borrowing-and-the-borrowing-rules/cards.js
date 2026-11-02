// Chapter 187 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 119, 119.

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
  rule: {
    q: 'State the borrowing rule for one value at one moment.',
    a: 'Either any number of shared `&T` borrows, or exactly one `&mut T`. Never both.',
  },
  'last-use': {
    q: 'Where does a borrow end: at the closing brace, or somewhere else?',
    a: 'At its last use. After that, the value can be borrowed again in a different way.',
  },
  'grow-danger': {
    q: 'Why may you not `push` onto a `Vec` while holding `&xs[0]`?',
    a: 'Growing can move the elements to a new buffer and free the old one, leaving the reference pointing at freed memory. rustc rejects it (E0502).',
  },
  'checker-when': {
    q: 'When does the borrow checker run, and what does that cost the running program?',
    a: 'At compile time, so there is nothing left to check while the program runs.',
  },
  'e0502-fix': {
    q: 'E0502 says a value is borrowed as immutable while you borrow it as mutable. What is the usual fix?',
    a: 'Finish using the shared borrow before you make the mutable one, often by moving a line (or copy the value out instead of borrowing it).',
  },
  'e0499-what': {
    q: 'What does E0499 mean?',
    a: 'A value was borrowed as mutable more than once at a time: two live writers.',
  },
  'e0597-why': {
    q: 'What does E0597, “`s` does not live long enough”, protect against?',
    a: 'A reference that would outlive its value: `s` is dropped while something still borrows it, so the reference would dangle.',
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
    prompt: 'Write `order(a, b)` so that afterwards `*a <= *b`. It takes two **mutable borrows** and changes the caller’s variables in place: if `a` holds the bigger number, swap them. It returns nothing.',
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
    prompt: 'Write `append_twice(s, t)`, which adds `t` to the end of `s` twice. `s` is borrowed mutably and `t` is only read. `s.push_str(x)` appends `x` to a `String`.',
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
  pushGetFirst: {
    lang: 'rust',
    title: 'Grow the list, report the first',
    prompt: '`push_get_first(v, x)` should push `x` onto the end of `v` and return the value of `v`’s first element (you may assume `v` is not empty). The starter is the obvious version, and the borrow checker rejects it with E0502. Fix it so it compiles and passes, keeping the same signature.',
    starter: `fn push_get_first(
    v: &mut Vec<i32>,
    x: i32,
) -> i32 {
    let first = &v[0];
    v.push(x);
    *first
}`,
    solution: `fn push_get_first(
    v: &mut Vec<i32>,
    x: i32,
) -> i32 {
    let first = v[0];
    v.push(x);
    first
}`,
    tests: `#[test]
fn returns_the_first() {
    let mut v = vec![5];
    assert_eq!(push_get_first(&mut v, 7), 5);
}

#[test]
fn pushes_onto_the_end() {
    let mut v = vec![1, 2];
    push_get_first(&mut v, 3);
    assert_eq!(v, vec![1, 2, 3]);
}

#[test]
fn works_when_the_list_grows_a_lot() {
    let mut v = vec![9];
    let mut i = 0;
    while i < 100 {
        assert_eq!(push_get_first(&mut v, i), 9);
        i += 1;
    }
    assert_eq!(v.len(), 101);
}`,
    hints: [
      'Read the three labels of the error: where the shared borrow starts, where the `push` needs a mutable borrow, and where the shared borrow is used later.',
      'The function only needs the first element’s *value*, an `i32`, not a reference to it. An `i32` is Copy.',
      'Write `let first = v[0];` (no `&`): that copies the number out, so no borrow is alive during the `push`. Then return `first`.',
    ],
    walkthrough: `**How to think about it.** Start from the error’s three marks. \`let first = &v[0];\` starts a shared borrow of \`v\`’s storage; \`v.push(x)\` needs a mutable borrow of \`v\`; and \`*first\` on the last line uses the shared borrow again, so it is still live during the push. That overlap is exactly the dangerous case: if the push moves the elements to a bigger buffer, \`first\` would point at freed memory. To fix it you must make the marks stop overlapping, and there are two ways: end the shared borrow before the push, or never take one. Here the second is simplest, because what we want to return is a number, and numbers are Copy.

**The solution, line by line.**

- \`fn push_get_first(v: &mut Vec<i32>, x: i32) -> i32 {\` (split over lines to fit) is unchanged: \`v\` is lent for changing, \`x\` is a plain number.
- \`let first = v[0];\` reads the first element and *copies* it into \`first\`. Without the \`&\`, \`first\` is an \`i32\` of its own, not a reference into \`v\`, so no borrow of \`v\` stays alive after this line.
- \`v.push(x);\` takes the mutable borrow it needs; nothing else is borrowing \`v\` now, so the rule is satisfied, and the push may move the elements freely.
- \`first\` is the body’s last expression, so the copied number is returned.
- \`}\` closes the function.

The third test pushes a hundred times, so the \`Vec\` really does move its elements to bigger buffers several times; the copied number is unaffected.

A second correct answer is to push first and read afterwards, \`v.push(x); v[0]\`: the read then happens after the mutable borrow has ended.

**Common wrong attempts.**

- Cloning the whole \`Vec\` to read from the copy: it compiles, but copies every element on every call to fix a problem one \`i32\` copy solves.
- Leaving it as it is: E0502, “cannot borrow \`*v\` as mutable because it is also borrowed as immutable”.`,
    wrong: [
      {
        code: `fn push_get_first(
    v: &mut Vec<i32>,
    x: i32,
) -> i32 {
    let first = &v[0];
    v.push(x);
    *first
}`,
        why: 'This is the starter: `first` borrows `v` and is used after the `push`, so a reader and a writer overlap (E0502).',
      },
      {
        code: `fn push_get_first(
    v: &mut Vec<i32>,
    x: i32,
) -> i32 {
    v.push(x);
    v[v.len() - 1]
}`,
        why: 'This compiles, but returns the last element (the one just pushed), not the first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`fn show(s: &String)` is called as `show(&name)`. What happens to `name` when `show` returns?',
    options: [
      {
        t: 'It is dropped, because the function finished',
        why: 'Only the owner’s scope ending drops the value, and `main` still owns it.',
      },
      {
        t: 'Nothing: `name` still owns the string and can be used again',
        correct: true,
        why: 'The function only borrowed it. When the reference goes away, nothing is freed.',
      },
      {
        t: 'It is moved into `show` and back again',
        why: 'No move happens at all. That round trip is what borrowing saves you from.',
      },
      {
        t: 'It becomes empty',
        why: 'A shared borrow cannot change the value, let alone empty it.',
      },
    ],
  },
  {
    q: 'Compared with TypeScript, what does `&mut` at a call site, like `order(&mut x, &mut y)`, tell you?',
    options: [
      {
        t: 'Nothing new: in both languages any function may change what you pass',
        why: 'In Rust a function can only change your value if you hand it a `&mut`.',
      },
      {
        t: 'That `x` and `y` will be copied',
        why: '`&mut` lends; it never copies the value.',
      },
      {
        t: 'That the function may change `x` and `y`',
        correct: true,
        why: 'A `&mut` is permission to write, and you can see it at the call without reading the function.',
      },
      {
        t: 'That `x` and `y` are moved into the function',
        why: 'A move would be `order(x, y)`, and the caller would lose them.',
      },
    ],
  },
  {
    q: '`fn bump(n: &i32) { *n += 1; }` What does rustc say?',
    options: [
      {
        t: 'Nothing; it compiles and adds 1',
        why: 'A `&i32` is read-only.',
      },
      {
        t: 'E0594: cannot assign to `*n`, which is behind a `&` reference',
        correct: true,
        why: 'Writing needs a `&mut i32`, and the help line suggests exactly that.',
      },
      {
        t: 'E0382: use of moved value',
        why: 'Nothing was moved; the problem is writing through a shared reference.',
      },
      {
        t: 'It compiles but panics when run',
        why: 'This is caught at compile time.',
      },
    ],
  },
  {
    q: '`let hits = 0; bump(&mut hits);` (with `bump(n: &mut i32)`). Why does it fail?',
    options: [
      {
        t: '`bump` must be declared `mut`',
        why: 'Functions are never `mut`; the owner is.',
      },
      {
        t: 'Integers cannot be borrowed',
        why: 'Any value can be borrowed.',
      },
      {
        t: 'You cannot lend for changing something whose owner is not `mut` (E0596)',
        correct: true,
        why: 'Write `let mut hits = 0;`. The permission to change starts with the owner.',
      },
      {
        t: 'The `&mut` should be `mut&`',
        why: 'The syntax is `&mut hits`.',
      },
    ],
  },
  {
    q: 'Which of these can a function do with a value it was lent as `&mut String`?',
    options: [
      {
        t: 'Append to it',
        correct: true,
        why: 'A mutable borrow may read and change the value.',
      },
      {
        t: 'Drop it early with `drop`',
        why: 'Only the owner can drop it; `drop` needs ownership.',
      },
      {
        t: 'Move it into another variable',
        why: 'You cannot move out of a borrow: the owner still needs the value.',
      },
      {
        t: 'Keep it after the function returns',
        why: 'The borrow ends when the function does; the value goes back to its owner.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
let s = String::from("a");
let r1 = &s;
let r2 = &s;
println!("{r1}{r2}");
\`\`\``,
    options: [
      {
        t: 'Yes',
        correct: true,
        why: 'Any number of shared borrows may exist at once. Readers cannot disturb each other.',
      },
      {
        t: 'No: two references to one value',
        why: 'That is only a problem when one of them is `&mut`.',
      },
      {
        t: 'No: `s` was moved into `r1`',
        why: '`&s` borrows; it does not move.',
      },
      {
        t: 'No: `s` must be `mut` to be borrowed',
        why: 'Only a mutable borrow needs a `mut` owner.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
let mut n = 1;
let a = &mut n;
let b = &mut n;
*a += 1;
\`\`\``,
    options: [
      {
        t: 'Yes, `n` ends up as 2',
        why: 'Two mutable borrows overlap here, because `a` is used after `b` is made.',
      },
      {
        t: 'Yes, because `n` is `mut`',
        why: '`mut` on the owner is needed, but it does not lift the one-writer rule.',
      },
      {
        t: 'No: `a` is still alive when `b` is made, so there are two writers (E0499)',
        correct: true,
        why: 'Exactly one `&mut` at a time. `*a += 1` keeps `a` alive past the line that makes `b`.',
      },
      {
        t: 'No: you cannot add to an `i32` through a reference',
        why: '`*a += 1` is fine on its own; the problem is the second `&mut`.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
let mut s = String::from("tea");
let a = &s;
println!("{a}");
let w = &mut s;
w.push_str("pot");
\`\`\``,
    options: [
      {
        t: 'No: `a` lives until the end of the block',
        why: 'A borrow lasts until its last use, not until the closing brace.',
      },
      {
        t: 'No: a value that was borrowed can never be changed',
        why: 'It can, once the shared borrows have ended.',
      },
      {
        t: 'Yes: `a` was last used before `w` was made',
        correct: true,
        why: 'The shared borrow ended at the `println!`, so the mutable one does not overlap it.',
      },
      {
        t: 'Yes, but it prints `teapot`',
        why: 'It compiles, but `a` is printed before the push, so it prints `tea`.',
      },
    ],
  },
  {
    q: 'What does the borrow checker do?',
    options: [
      {
        t: 'It counts references while the program runs and stops it on a conflict',
        why: 'No running check happens. The checker works on the program at compile time.',
      },
      {
        t: 'It frees values when the last reference goes away',
        why: 'Owners free values (drop), and references never do.',
      },
      {
        t: 'It copies a value whenever two references would overlap',
        why: 'It never adds copies. It rejects the program instead.',
      },
      {
        t: 'It checks, at compile time, that no value is written, moved or dropped while another borrow of it is live',
        correct: true,
        why: 'That is its job, and the program it accepts needs no checks at run time.',
      },
    ],
  },
  {
    q: 'rustc says “`s` does not live long enough … `s` dropped here while still borrowed”. What is wrong?',
    options: [
      {
        t: 'A reference to `s` is used after `s`’s scope ended, so it would point at freed memory',
        correct: true,
        why: 'E0597: references must always point at a live value. Move the value to an outer scope, or stop using the reference sooner.',
      },
      {
        t: '`s` was moved twice',
        why: 'That would be E0382, use of a moved value.',
      },
      {
        t: 'There are two writers',
        why: 'That would be E0499.',
      },
      {
        t: '`s` needs to be `mut`',
        why: 'Mutability is not the problem; how long `s` lives is.',
      },
    ],
  },
];
