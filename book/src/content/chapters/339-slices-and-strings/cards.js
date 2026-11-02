// Chapter 339 cards. Keys are stable ids: never rename them.

export const prompts = {
  'slice-what': {
    q: 'What is a slice, in one line?',
    a: 'A borrowed view of a run of elements in someone else’s array, `Vec` or string.',
  },
  'slice-parts': {
    q: 'What two things does a slice hold?',
    a: 'A pointer to its first element and a length (16 bytes on a 64-bit machine).',
  },
  'range-end': {
    q: 'Which elements does `&a[1..4]` cover? And `&a[1..=4]`?',
    a: '`1..4`: indices 1, 2 and 3 (the end is left out). `1..=4`: indices 1 to 4, end included.',
  },
  'range-open': {
    q: 'What do `&a[..2]`, `&a[3..]` and `&a[..]` mean?',
    a: 'From the start to 2; from 3 to the end; the whole thing.',
  },
  'slice-param': {
    q: 'Why write `fn sum(xs: &[i32])` rather than taking an array of a fixed size?',
    a: 'A `&[i32]` accepts a whole array, a `Vec`, or any part of either, of any length.',
  },
  'slice-mut': {
    q: 'What does passing `&mut a[1..3]` to a function let it do?',
    a: 'Change elements 1 and 2 of `a`, and nothing else.',
  },
  'slice-bounds': {
    q: 'What happens if a slice range runs past the end, like `&a[2..9]` on six elements?',
    a: 'The program panics while running: “range end index 9 out of range for slice of length 6”.',
  },
  'slice-amp': {
    q: 'Why does `let s = a[0..2];` (no `&`) not compile?',
    a: 'A slice on its own has no size known at compile time, so it can only be reached through a reference: `&a[0..2]` (E0277).',
  },
  'slice-borrow': {
    q: 'You hold `let part = &v[..2];` and call `v.push(9)`, then use `part`. What happens?',
    a: 'It does not compile (E0502): `push` needs a mutable borrow of `v` while `part` still borrows it.',
  },
};

export const examples = {
  'slice-sum': {
    lang: 'rust',
    title: 'One function, many windows',
    code: `fn sum(xs: &[i32]) -> i32 {
    let mut total = 0;
    let mut i = 0;
    while i < xs.len() {
        total += xs[i];
        i += 1;
    }
    total
}

fn main() {
    let a = [10, 20, 30, 40, 50, 60];
    let mid = &a[1..4];
    println!("len {}", mid.len());
    println!("mid {}", sum(mid));
    println!("all {}", sum(&a));
    println!("tail {}", sum(&a[3..]));
    let v = vec![1, 2, 3];
    println!("vec {}", sum(&v));
}`,
  },
};

export const exercises = {
  sumColumn: {
    lang: 'rust',
    title: 'Sum part of a column',
    prompt:
      'A struct-of-arrays layout keeps every particle’s `x` in one array. Write `sum_range(xs, from, to)`, which adds up the elements `from` (included) to `to` (left out) by **slicing first**, then summing the slice. An empty range sums to `0.0`.',
    starter: `fn sum_range(
    xs: &[f64],
    from: usize,
    to: usize,
) -> f64 {
    0.0
}`,
    solution: `fn sum_range(
    xs: &[f64],
    from: usize,
    to: usize,
) -> f64 {
    let part = &xs[from..to];
    let mut t = 0.0;
    let mut i = 0;
    while i < part.len() {
        t += part[i];
        i += 1;
    }
    t
}`,
    tests: `#[test]
fn sums_the_middle() {
    let xs = [1.0, 2.0, 3.0, 4.0];
    assert_eq!(sum_range(&xs, 1, 3), 5.0);
}
#[test]
fn empty_range_is_zero() {
    let xs = [1.0, 2.0];
    assert_eq!(sum_range(&xs, 1, 1), 0.0);
}
#[test]
fn whole_column() {
    let xs = [0.5, 0.25, 0.25];
    assert_eq!(sum_range(&xs, 0, 3), 1.0);
}`,
    hints: [
      'Cut out the window first: `let part = &xs[from..to];`. Now the rest of the function only needs to sum a slice.',
      'Loop `i` from 0 while `i < part.len()`, adding `part[i]` to a running total that starts at `0.0`.',
      'The total must be an `f64`, so start it at `0.0`, not `0`. End the function with the total and no semicolon.',
    ],
    walkthrough: `**How to think about it.** Split the job in two: first choose *which* elements (that is what a slice is for), then add them up (a loop that works on any slice). Once you have \`part = &xs[from..to]\`, the loop never needs to know about \`from\` and \`to\` at all; it just sums \`part\` from index 0 to \`part.len()\`. That is the usual Rust shape: cut out the part you want, then hand the slice to code that works on any slice.

**The solution, line by line.**

- \`fn sum_range(xs: &[f64], from: usize, to: usize) -> f64 {\` (split over lines to fit) borrows a column of floats and takes two indices, which are \`usize\` like every index.
- \`let part = &xs[from..to];\` makes a view of the elements \`from\` up to, but not including, \`to\`. Nothing is copied: \`part\` is a pointer and a length into the caller’s array. For \`sum_range(&xs, 1, 3)\` it covers \`xs[1]\` and \`xs[2]\`, which are 2.0 and 3.0.
- \`let mut t = 0.0;\` starts the total. The \`.0\` makes it an \`f64\`; a plain \`0\` would be an integer, and \`t += part[i]\` would then add an \`f64\` to an integer, which Rust refuses.
- \`let mut i = 0;\` is the index into \`part\`, inferred as \`usize\` because it is compared with \`part.len()\` and used to index.
- \`while i < part.len() {\` repeats once per element. For the empty range \`1..1\`, \`part.len()\` is 0 and the body never runs.
- \`t += part[i];\` adds the element; every access is bounds-checked, and the loop condition keeps \`i\` in range.
- \`i += 1;\` moves on.
- \`}\` closes the loop.
- \`t\` with no semicolon is the body’s last expression, so it is returned: 5.0 for the first test.

**Common wrong attempts.**

- \`while i <= part.len() - 1\`: for an empty range \`part.len() - 1\` would be \`0 - 1\`, and \`usize\` cannot go below zero, so in a debug build the subtraction panics with “attempt to subtract with overflow”. Use \`i < part.len()\`.
- \`&xs[from..to + 1]\`: ranges already leave the end out, so this adds one element too many (and panics when \`to\` is the length).
- \`let mut t = 0;\`: an integer total, so \`t += part[i]\` does not compile (“cannot add-assign \`f64\` to \`{integer}\`”).`,
    wrong: [
      {
        code: `fn sum_range(
    xs: &[f64],
    from: usize,
    to: usize,
) -> f64 {
    let part = &xs[from..to];
    let mut t = 0.0;
    let mut i = 0;
    while i <= part.len() - 1 {
        t += part[i];
        i += 1;
    }
    t
}`,
        why: 'For an empty range `part.len() - 1` underflows: `usize` cannot go below zero, so in a debug build the subtraction stops the program. Use `i < part.len()`.',
      },
      {
        code: `fn sum_range(
    xs: &[f64],
    from: usize,
    to: usize,
) -> f64 {
    let part = &xs[from..to + 1];
    let mut t = 0.0;
    let mut i = 0;
    while i < part.len() {
        t += part[i];
        i += 1;
    }
    t
}`,
        why: 'Ranges already leave out their end, so `to + 1` adds one element too many (and panics when `to` is the length).',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`let a = [5, 6, 7, 8];` What is `&a[1..3]`?',
    options: [
      { t: 'The elements 6 and 7', correct: true, why: 'Index 1 up to, but not including, index 3.' },
      { t: 'The elements 6, 7 and 8', why: 'That would be `&a[1..]` or `&a[1..4]`: the end is left out.' },
      { t: 'A new array holding 6 and 7', why: 'A slice copies nothing. It is a view into `a`.' },
      { t: 'The elements 5, 6 and 7', why: 'Indices start at 0, so index 1 is 6.' },
    ],
  },
  {
    q: 'What is stored in a `&[i32]` slice value?',
    options: [
      { t: 'A copy of every element in the range', why: 'Slices never copy their elements.' },
      { t: 'Only a pointer to the first element', why: 'Without a length, nobody would know where the slice ends, or check accesses.' },
      { t: 'A pointer to the first element and a length', correct: true, why: 'That is why a slice is 16 bytes, twice the size of a plain reference.' },
      { t: 'The start and end indices, and the name of the array', why: 'A slice does not know which variable it came from; it holds an address and a length.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`rust
let mut v = vec![1, 2, 3];
let part = &v[..2];
v.push(9);
println!("{:?}", part);
\`\`\``,
    options: [
      { t: 'Yes, and it prints `[1, 2]`', why: '`part` borrows `v`, and pushing needs a mutable borrow while `part` is still used.' },
      { t: 'Yes, but it prints `[1, 2, 9]`', why: 'A slice is a fixed window, and anyway this does not compile.' },
      { t: 'No: it borrows `v` mutably while `part` still borrows it (E0502)', correct: true, why: 'Growing `v` could move its elements and leave `part` pointing at freed memory.' },
      { t: 'No: you cannot slice a `Vec`', why: 'You can; a `Vec` slices exactly like an array.' },
    ],
  },
  {
    q: 'What happens with `let a = [1, 2, 3]; let s = &a[1..5];`?',
    options: [
      { t: '`s` is `[2, 3]`, silently trimmed', why: 'Rust never trims a range for you.' },
      { t: 'The program panics: range end index 5 out of range for slice of length 3', correct: true, why: 'Slicing is bounds-checked, and an index past the end stops the program.' },
      { t: 'It reads whatever is in memory after the array', why: 'That is what C might do. Rust checks.' },
      { t: '`s` is empty', why: 'An out-of-range slice is an error, not an empty slice.' },
    ],
  },
  {
    q: '`fn zero(xs: &mut [i32])` sets every element of `xs` to 0. After `let mut a = [1, 2, 3, 4]; zero(&mut a[2..]);`, what is `a`?',
    options: [
      { t: '`[0, 0, 0, 0]`', why: 'Only the part that was lent can be changed.' },
      { t: '`[1, 2, 3, 4]`', why: 'The function changed the elements through the mutable slice.' },
      { t: '`[0, 0, 3, 4]`', why: '`2..` is from index 2 to the end, not the first two.' },
      { t: '`[1, 2, 0, 0]`', correct: true, why: 'The mutable slice covers indices 2 and 3, so only those become 0.' },
    ],
  },
];
