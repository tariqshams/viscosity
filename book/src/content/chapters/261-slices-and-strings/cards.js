// Chapter 261 cards. Keys are stable ids: never rename them.

export const prompts = {
  'slice-what': {
    q: 'What is a slice, in one line?',
    a: 'A borrowed view of a run of elements in someone else’s array or string.',
  },
  'slice-parts': {
    q: 'What two things does a slice hold?',
    a: 'A pointer to its first element and a length.',
  },
  'range-end': {
    q: 'Which elements does `&a[1..4]` cover?',
    a: 'Indices 1, 2 and 3. The end of a range is not included.',
  },
  'range-open': {
    q: 'What do `&a[..2]`, `&a[3..]` and `&a[..]` mean?',
    a: 'From the start to 2; from 3 to the end; the whole thing.',
  },
  'slice-bounds': {
    q: 'What happens if a slice range runs past the end, like `&a[2..9]` on six elements?',
    a: 'The program stops at run time with “range end index 9 out of range”. Slices are always bounds-checked.',
  },
  'slice-param': {
    q: 'Why write `fn sum(xs: &[i32])` rather than taking an array of a fixed size?',
    a: 'A `&[i32]` accepts a whole array or any part of one, of any length.',
  },
  'string-owns': {
    q: 'Which owns its text and can grow: `String` or `&str`?',
    a: '`String`. A `&str` only borrows text that lives somewhere else.',
  },
  'literal-type': {
    q: 'What is the type of the literal `"print"`?',
    a: '`&str`: a slice of text stored in the compiled program.',
  },
  'str-param': {
    q: 'Why do Rust functions usually take `&str` rather than `&String`?',
    a: 'A `&str` parameter accepts literals, slices and (borrowed) `String`s.',
  },
  'to-owned': {
    q: 'How do you turn a `&str` into a `String`, and what does it cost?',
    a: '`String::from(x)` or `x.to_string()`. It copies the bytes into a new allocation.',
  },
  'byte-len': {
    q: 'What does `"héllo".len()` return, and why?',
    a: '6. `len` counts UTF-8 bytes, and `é` takes two.',
  },
  'slice-clear': {
    q: 'You hold `let word = &s[0..3];` and call `s.clear()`, then use `word`. What happens?',
    a: 'It doesn’t compile: `clear` needs a mutable borrow of `s` while `word` still borrows it.',
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
}`,
  },
  lexemes: {
    lang: 'rust',
    title: 'Lexemes without copying',
    code: `fn lexeme(
    src: &str,
    start: usize,
    end: usize,
) -> &str {
    &src[start..end]
}

fn main() {
    let s = String::from("let x = 10;");
    let name = lexeme(&s, 4, 5);
    let num = lexeme(&s, 8, 10);
    println!("{name} and {num}");

    let lit = "print";
    println!("{}", lexeme(lit, 0, 2));

    let mut own = String::from(name);
    own.push_str("_2");
    println!("{own} {}", own.len());
}`,
  },
};

export const exercises = {
  takeIdent: {
    lang: 'rust',
    title: 'Cut an identifier out of the source',
    prompt:
      'Write `take_ident(src)`, which returns the identifier at the very start of `src`: the longest run of ASCII letters, digits and `_` (use the `is_ident` helper). Return a **slice of `src`**, not a new `String`. If `src` starts with anything else, return an empty slice.',
    starter: `fn is_ident(c: u8) -> bool {
    c.is_ascii_alphanumeric()
        || c == b'_'
}

fn take_ident(src: &str) -> &str {
    // your code here
    ""
}`,
    solution: `fn is_ident(c: u8) -> bool {
    c.is_ascii_alphanumeric()
        || c == b'_'
}

fn take_ident(src: &str) -> &str {
    let b = src.as_bytes();
    let mut i = 0;
    while i < b.len() && is_ident(b[i])
    {
        i += 1;
    }
    &src[..i]
}`,
    tests: `#[test]
fn stops_at_a_space() {
    assert_eq!(take_ident("count = 1"), "count");
}
#[test]
fn digits_and_underscores_count() {
    assert_eq!(take_ident("x_1+y"), "x_1");
}
#[test]
fn empty_when_no_identifier() {
    assert_eq!(take_ident("+1"), "");
    assert_eq!(take_ident(""), "");
}
#[test]
fn the_whole_string_can_match() {
    assert_eq!(take_ident("abc"), "abc");
}
#[test]
fn borrows_instead_of_copying() {
    let s = String::from("hi there");
    let w = take_ident(&s);
    assert_eq!(w.as_ptr(), s.as_ptr());
}`,
    hints: [
      '`src.as_bytes()` gives you the text as a `&[u8]`, so `b[i]` is one byte. Drip’s identifiers are ASCII, so a byte is a character.',
      'Walk an index `i` forward while `i < b.len()` and `is_ident(b[i])`. Check the length first, or `b[i]` runs off the end.',
      'When the loop stops, `i` is one past the last identifier byte. Return `&src[..i]`.',
    ],
    walkthrough: `This is the Rust scanner’s \`identifier()\` in miniature.

- **Look at bytes.** \`let b = src.as_bytes();\` is a \`&[u8]\` view of the same text, also borrowed, also free. The companion scanner keeps exactly such a \`bytes: &[u8]\` beside its \`source: &str\`.
- **Walk forward.** \`while i < b.len() && is_ident(b[i])\`. \`&&\` stops early, so \`b[i]\` is only read while \`i\` is in range.
- **Slice, don't copy.** \`&src[..i]\` is a window on the caller's text. If nothing matched, \`i\` is 0 and \`&src[..0]\` is the empty slice \`""\`.

The last test is the interesting one. \`w.as_ptr()\` is the address of the slice’s first byte, and it equals the address of \`s\`’s first byte: the result points into the source. A version that built a new \`String\` couldn’t even return it as \`&str\` here, because the new string would be dropped at the end of the function.

Why must \`i\` stop on a character boundary? Slicing \`&str\` in the middle of a multi-byte character stops the program. Since this loop only steps over ASCII bytes, it always stops on a boundary.`,
    wrong: [
      {
        code: `fn is_ident(c: u8) -> bool {
    c.is_ascii_alphabetic()
}

fn take_ident(src: &str) -> &str {
    let b = src.as_bytes();
    let mut i = 0;
    while i < b.len() && is_ident(b[i])
    {
        i += 1;
    }
    &src[..i]
}`,
        why: 'Letters only: `x_1` is cut short to `x`. Identifiers may contain digits and `_` after the first character.',
      },
      {
        code: `fn is_ident(c: u8) -> bool {
    c.is_ascii_alphanumeric()
        || c == b'_'
}

fn take_ident(src: &str) -> &str {
    let b = src.as_bytes();
    let mut i = 0;
    while is_ident(b[i]) {
        i += 1;
    }
    &src[..i]
}`,
        why: 'Without `i < b.len()` the loop reads past the end when the whole string is an identifier, and indexing out of bounds stops the program.',
      },
    ],
  },
  sumColumn: {
    lang: 'rust',
    optional: true,
    title: 'Sum part of a column',
    prompt:
      'A struct-of-arrays layout keeps every particle’s `x` in one array. Write `sum_range(xs, from, to)` that adds up `xs[from..to]` by **slicing first**, then summing the slice.',
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
      '`let part = &xs[from..to];` is the window you need.',
      'Loop `i` from 0 while `i < part.len()`, adding `part[i]`.',
    ],
    walkthrough: `Slicing first means the loop doesn't need to know about \`from\` and \`to\` at all. It just sums a slice, from 0 to \`part.len()\`. That's the usual Rust shape: cut out the part you want, then hand the slice to code that works on any slice.

A common slip is \`to + 1\` or \`<=\`. Ranges exclude their end, so \`&xs[1..3]\` is elements 1 and 2.`,
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
        why: 'For an empty range `part.len() - 1` underflows: `usize` can’t go below zero, so in a debug build the subtraction stops the program. Use `i < part.len()`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`let a = [5, 6, 7, 8];` What is `&a[1..3]`?',
    options: [
      { t: 'The elements 6 and 7', correct: true, why: 'Index 1 up to, but not including, index 3.' },
      { t: 'The elements 6, 7 and 8', why: 'That would be `&a[1..]` or `&a[1..4]`: the end is excluded.' },
      { t: 'A new array holding 6 and 7', why: 'A slice copies nothing. It is a view into `a`.' },
      { t: 'The elements 5, 6 and 7', why: 'Indices start at 0, so index 1 is 6.' },
    ],
  },
  {
    q: 'What is stored in a `&[i32]` slice value?',
    options: [
      { t: 'A copy of every element in the range', why: 'Slices never copy their elements.' },
      { t: 'Just a pointer to the first element', why: 'Without a length, nobody would know where the slice ends.' },
      { t: 'A pointer to the first element and a length', correct: true, why: 'That’s why a slice is twice the size of a plain reference.' },
    ],
  },
  {
    q: 'Which function signature accepts `"lit"`, `&my_string` and `&my_string[2..]` all three?',
    options: [
      { t: '`fn f(s: String)`', why: 'That takes ownership of a `String`, and a literal isn’t one.' },
      { t: '`fn f(s: &String)`', why: 'A literal or a slice is a `&str`, not a `&String`.' },
      { t: '`fn f(s: &mut str)`', why: 'Literals are read-only, so you can’t get a `&mut` to one.' },
      { t: '`fn f(s: &str)`', correct: true, why: 'Literals and slices are `&str`, and a `&String` is turned into a `&str` for you.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
let mut s = String::from("let x;");
let word = &s[0..3];
s.push_str(" y");
println!("{word}");
\`\`\``,
    options: [
      { t: 'Yes, and it prints `let`', why: '`word` borrows `s`, and pushing needs a mutable borrow while `word` is still used.' },
      { t: 'No: it borrows `s` mutably while `word` still borrows it', correct: true, why: 'This is E0502 from chapter 260. Growing `s` could move its bytes and leave `word` pointing at freed memory.' },
      { t: 'Yes, but it prints `let x; y`', why: '`word` is a fixed window of three bytes, and anyway this doesn’t compile.' },
    ],
  },
  {
    q: 'In `let lit = "print";`, where do the five bytes live?',
    options: [
      { t: 'On the heap, owned by `lit`', why: 'Only a `String` owns heap text. `lit` is a `&str`.' },
      { t: 'In the compiled program itself; `lit` borrows them', correct: true, why: 'String literals are slices of text stored in the binary, which is why they can’t be changed.' },
      { t: 'They are copied into `lit` byte by byte', why: '`lit` holds a pointer and a length, not the bytes.' },
    ],
  },
  {
    q: 'Why does the Rust Drip scanner make each lexeme a `&str` slice of the source?',
    options: [
      { t: 'Because Rust has no way to make new strings', why: '`String::from` makes one. It just costs an allocation.' },
      { t: 'So the tokens can be changed in place', why: 'A `&str` is read-only.' },
      { t: 'It makes scanning faster by skipping UTF-8 checks', why: 'The scanner still has to look at every byte.' },
      { t: 'A slice is a pointer and a length into text that already exists, so scanning allocates nothing', correct: true, why: 'The companion scanner’s own comment says scanning never allocates for this reason.' },
    ],
  },
];
