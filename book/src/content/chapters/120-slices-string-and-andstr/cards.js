// Chapter 188 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 120, 120.

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
  'string-owns': {
    q: 'Which owns its text and can grow: `String` or `&str`?',
    a: '`String`. A `&str` only borrows text that lives somewhere else.',
  },
  'literal-type': {
    q: 'What is the type of the literal `"print"`, and where do its bytes live?',
    a: '`&str`: a slice of text stored in the compiled program, which is why it cannot be changed.',
  },
  'str-param': {
    q: 'Why do Rust functions usually take `&str` rather than `&String`?',
    a: 'A `&str` parameter accepts literals, slices and (borrowed) `String`s alike.',
  },
  'to-owned': {
    q: 'How do you turn a `&str` into a `String`, and what does it cost?',
    a: '`String::from(x)` or `x.to_string()`. It copies the bytes into a new heap buffer.',
  },
  'return-string': {
    q: 'A function builds new text from its arguments. Why must it return a `String`, not a `&str`?',
    a: 'The new text must be owned by someone; a `&str` would point at text that is dropped when the function ends.',
  },
  'byte-len': {
    q: 'What does `"héllo".len()` return, and why?',
    a: '6. `len` counts UTF-8 bytes, and `é` takes two.',
  },
  'no-index': {
    q: 'Why does `s[0]` not compile when `s` is a `String`?',
    a: 'Strings cannot be indexed by a single number: in UTF-8 a byte index would not reliably give a character (E0277).',
  },
  'lexeme-borrow': {
    q: 'Why does the Rust Drip scanner make each lexeme a `&str` slice of the source?',
    a: 'A slice is a pointer and a length into text that already exists, so scanning allocates nothing.',
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
  sumColumn: {
    lang: 'rust',
    title: 'Sum part of a column',
    prompt: 'A struct-of-arrays layout keeps every particle’s `x` in one array. Write `sum_range(xs, from, to)`, which adds up the elements `from` (included) to `to` (left out) by **slicing first**, then summing the slice. An empty range sums to `0.0`.',
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
  takeIdent: {
    lang: 'rust',
    title: 'Cut an identifier out of the source',
    prompt: 'Write `take_ident(src)`, which returns the identifier at the very start of `src`: the longest run of ASCII letters, digits and `_` (use the `is_ident` helper). Return a **slice of `src`**, not a new `String`. If `src` starts with anything else, return an empty slice.',
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
    walkthrough: `**How to think about it.** This is the Rust scanner’s identifier rule in miniature. You need to find *where* the identifier ends, and then hand back a window onto the caller’s text up to that point. Finding the end is a walk: start at 0 and step forward while the byte under you belongs in a name. Since you return a slice of \`src\`, nothing new is made, which the last test checks by comparing addresses.

**The solution, line by line.**

- \`fn is_ident(c: u8) -> bool { ... }\` is given: true for an ASCII letter or digit (\`is_ascii_alphanumeric\`) or an underscore.
- \`fn take_ident(src: &str) -> &str {\` borrows some text and returns a borrow of (part of) the same text.
- \`let b = src.as_bytes();\` is a \`&[u8]\` view of the same bytes, also borrowed, also free. The companion scanner keeps exactly such a \`bytes\` field beside its \`source\`.
- \`let mut i = 0;\` is the position of the next byte to look at.
- \`while i < b.len() && is_ident(b[i])\` keeps going while there is a byte and it belongs in a name. \`&&\` stops early, so \`b[i]\` is only read while \`i\` is in range.
- \`{ i += 1; }\` steps forward.
- \`&src[..i]\` is the body’s last expression: a slice of the caller’s text from 0 up to (not including) \`i\`. If nothing matched, \`i\` is 0 and \`&src[..0]\` is the empty slice \`""\`.

The last test is the interesting one. \`w.as_ptr()\` is the address of the slice’s first byte, and it equals the address of \`s\`’s first byte: the result points into the source. A version that built a new \`String\` could not even return it as a \`&str\` here, because the new string would be dropped at the end of the function. And why must \`i\` stop on a character boundary? Slicing a \`&str\` in the middle of a multi-byte character panics; this loop only steps over ASCII bytes, so it always stops on one.

**Common wrong attempts.**

- Letters only (\`is_ascii_alphabetic\`): \`x_1\` is cut short to \`x\`, because identifiers may contain digits and \`_\` after the first character.
- \`while is_ident(b[i])\` without \`i < b.len()\`: when the whole string is an identifier, the loop reads past the end, and indexing out of bounds panics.`,
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
};

export const quiz = [
  {
    q: '`let a = [5, 6, 7, 8];` What is `&a[1..3]`?',
    options: [
      {
        t: 'The elements 6 and 7',
        correct: true,
        why: 'Index 1 up to, but not including, index 3.',
      },
      {
        t: 'The elements 6, 7 and 8',
        why: 'That would be `&a[1..]` or `&a[1..4]`: the end is left out.',
      },
      {
        t: 'A new array holding 6 and 7',
        why: 'A slice copies nothing. It is a view into `a`.',
      },
      {
        t: 'The elements 5, 6 and 7',
        why: 'Indices start at 0, so index 1 is 6.',
      },
    ],
  },
  {
    q: 'What is stored in a `&[i32]` slice value?',
    options: [
      {
        t: 'A copy of every element in the range',
        why: 'Slices never copy their elements.',
      },
      {
        t: 'Only a pointer to the first element',
        why: 'Without a length, nobody would know where the slice ends, or check accesses.',
      },
      {
        t: 'A pointer to the first element and a length',
        correct: true,
        why: 'That is why a slice is 16 bytes, twice the size of a plain reference.',
      },
      {
        t: 'The start and end indices, and the name of the array',
        why: 'A slice does not know which variable it came from; it holds an address and a length.',
      },
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
      {
        t: 'Yes, and it prints `[1, 2]`',
        why: '`part` borrows `v`, and pushing needs a mutable borrow while `part` is still used.',
      },
      {
        t: 'Yes, but it prints `[1, 2, 9]`',
        why: 'A slice is a fixed window, and anyway this does not compile.',
      },
      {
        t: 'No: it borrows `v` mutably while `part` still borrows it (E0502)',
        correct: true,
        why: 'Growing `v` could move its elements and leave `part` pointing at freed memory.',
      },
      {
        t: 'No: you cannot slice a `Vec`',
        why: 'You can; a `Vec` slices exactly like an array.',
      },
    ],
  },
  {
    q: 'What happens with `let a = [1, 2, 3]; let s = &a[1..5];`?',
    options: [
      {
        t: '`s` is `[2, 3]`, silently trimmed',
        why: 'Rust never trims a range for you.',
      },
      {
        t: 'The program panics: range end index 5 out of range for slice of length 3',
        correct: true,
        why: 'Slicing is bounds-checked, and an index past the end stops the program.',
      },
      {
        t: 'It reads whatever is in memory after the array',
        why: 'That is what C might do. Rust checks.',
      },
      {
        t: '`s` is empty',
        why: 'An out-of-range slice is an error, not an empty slice.',
      },
    ],
  },
  {
    q: '`fn zero(xs: &mut [i32])` sets every element of `xs` to 0. After `let mut a = [1, 2, 3, 4]; zero(&mut a[2..]);`, what is `a`?',
    options: [
      {
        t: '`[0, 0, 0, 0]`',
        why: 'Only the part that was lent can be changed.',
      },
      {
        t: '`[1, 2, 3, 4]`',
        why: 'The function changed the elements through the mutable slice.',
      },
      {
        t: '`[0, 0, 3, 4]`',
        why: '`2..` is from index 2 to the end, not the first two.',
      },
      {
        t: '`[1, 2, 0, 0]`',
        correct: true,
        why: 'The mutable slice covers indices 2 and 3, so only those become 0.',
      },
    ],
  },
  {
    q: 'Which function signature accepts `"lit"`, `&my_string` and `&my_string[2..]` all three?',
    options: [
      {
        t: '`fn f(s: String)`',
        why: 'That takes ownership of a `String`, and a literal is not one.',
      },
      {
        t: '`fn f(s: &String)`',
        why: 'A literal or a slice is a `&str`, not a `&String`.',
      },
      {
        t: '`fn f(s: &mut str)`',
        why: 'Literals are read-only, so you cannot get a `&mut` to one.',
      },
      {
        t: '`fn f(s: &str)`',
        correct: true,
        why: 'Literals and slices are `&str`, and a `&String` is turned into a `&str` for you.',
      },
    ],
  },
  {
    q: 'In `let lit = "print";`, where do the five bytes live?',
    options: [
      {
        t: 'On the heap, owned by `lit`',
        why: 'Only a `String` owns heap text. `lit` is a `&str`.',
      },
      {
        t: 'In the compiled program itself; `lit` borrows them',
        correct: true,
        why: 'String literals are slices of text stored in the program, which is why they cannot be changed.',
      },
      {
        t: 'They are copied into `lit` byte by byte',
        why: '`lit` holds a pointer and a length, not the bytes.',
      },
      {
        t: 'On the stack, inside `lit`',
        why: 'A `&str` is only a pointer and a length; the bytes are elsewhere.',
      },
    ],
  },
  {
    q: '`fn name() -> String { "drip" }` does not compile. Which fix is right?',
    options: [
      {
        t: 'Change the return type to `&String`',
        why: 'There is no `String` to borrow; the literal is a `&str`.',
      },
      {
        t: 'Write `"drip".to_string()`',
        correct: true,
        why: 'rustc’s help line suggests it: it copies the literal into a new, owned `String`.',
      },
      {
        t: 'Write `&"drip"`',
        why: 'That is a reference to a `&str`, still not a `String`.',
      },
      {
        t: 'Add `mut` to the function',
        why: 'Mutability has nothing to do with it; the types differ.',
      },
    ],
  },
  {
    q: 'What does `"héllo".len()` return?',
    options: [
      {
        t: '5',
        why: 'That is the number of characters (`chars().count()`). `len` counts bytes.',
      },
      {
        t: '6',
        correct: true,
        why: '`é` takes two bytes in UTF-8, and `len` counts bytes.',
      },
      {
        t: '10',
        why: 'UTF-8 does not use two bytes for every character; ASCII letters take one.',
      },
      {
        t: 'A compile error, because of the accent',
        why: 'Rust strings are UTF-8, so any character is allowed.',
      },
    ],
  },
  {
    q: 'Why does `let both = "tea" + "pot";` not compile, while `String::from("tea") + "pot"` does?',
    options: [
      {
        t: '`+` makes new text, which needs an owner; starting from a `String` gives it one to grow',
        correct: true,
        why: '`String + &str` appends to the owned `String`. Two borrowed pieces have nobody to own the result (E0369).',
      },
      {
        t: 'Rust has no `+` for text at all',
        why: 'It has one, for `String + &str`.',
      },
      {
        t: 'Literals must be declared `mut` first',
        why: 'Literals can never be changed; `mut` does not help.',
      },
      {
        t: 'The strings have different lengths',
        why: 'Lengths do not matter to `+`.',
      },
    ],
  },
];
