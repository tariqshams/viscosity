// Chapter 337-b cards (the second half of chapter 337). Keys are stable
// ids: never rename them.

export const prompts = {
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
  pushGetFirst: {
    lang: 'rust',
    title: 'Grow the list, report the first',
    prompt: `\`push_get_first(v, x)\` should push \`x\` onto the end of \`v\` and return the value of \`v\`’s first element (you may assume \`v\` is not empty). The starter is the obvious version, and the borrow checker rejects it with E0502. Fix it so it compiles and passes, keeping the same signature.`,
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
    q: `Does this compile?
\`\`\`rust
let s = String::from("a");
let r1 = &s;
let r2 = &s;
println!("{r1}{r2}");
\`\`\``,
    options: [
      { t: 'Yes', correct: true, why: 'Any number of shared borrows may exist at once. Readers cannot disturb each other.' },
      { t: 'No: two references to one value', why: 'That is only a problem when one of them is `&mut`.' },
      { t: 'No: `s` was moved into `r1`', why: '`&s` borrows; it does not move.' },
      { t: 'No: `s` must be `mut` to be borrowed', why: 'Only a mutable borrow needs a `mut` owner.' },
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
      { t: 'Yes, `n` ends up as 2', why: 'Two mutable borrows overlap here, because `a` is used after `b` is made.' },
      { t: 'Yes, because `n` is `mut`', why: '`mut` on the owner is needed, but it does not lift the one-writer rule.' },
      { t: 'No: `a` is still alive when `b` is made, so there are two writers (E0499)', correct: true, why: 'Exactly one `&mut` at a time. `*a += 1` keeps `a` alive past the line that makes `b`.' },
      { t: 'No: you cannot add to an `i32` through a reference', why: '`*a += 1` is fine on its own; the problem is the second `&mut`.' },
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
      { t: 'No: `a` lives until the end of the block', why: 'A borrow lasts until its last use, not until the closing brace.' },
      { t: 'No: a value that was borrowed can never be changed', why: 'It can, once the shared borrows have ended.' },
      { t: 'Yes: `a` was last used before `w` was made', correct: true, why: 'The shared borrow ended at the `println!`, so the mutable one does not overlap it.' },
      { t: 'Yes, but it prints `teapot`', why: 'It compiles, but `a` is printed before the push, so it prints `tea`.' },
    ],
  },
  {
    q: 'What does the borrow checker do?',
    options: [
      { t: 'It counts references while the program runs and stops it on a conflict', why: 'No running check happens. The checker works on the program at compile time.' },
      { t: 'It frees values when the last reference goes away', why: 'Owners free values (drop), and references never do.' },
      { t: 'It copies a value whenever two references would overlap', why: 'It never adds copies. It rejects the program instead.' },
      { t: 'It checks, at compile time, that no value is written, moved or dropped while another borrow of it is live', correct: true, why: 'That is its job, and the program it accepts needs no checks at run time.' },
    ],
  },
  {
    q: 'rustc says “`s` does not live long enough … `s` dropped here while still borrowed”. What is wrong?',
    options: [
      { t: 'A reference to `s` is used after `s`’s scope ended, so it would point at freed memory', correct: true, why: 'E0597: references must always point at a live value. Move the value to an outer scope, or stop using the reference sooner.' },
      { t: '`s` was moved twice', why: 'That would be E0382, use of a moved value.' },
      { t: 'There are two writers', why: 'That would be E0499.' },
      { t: '`s` needs to be `mut`', why: 'Mutability is not the problem; how long `s` lives is.' },
    ],
  },
];
