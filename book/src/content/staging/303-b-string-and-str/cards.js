// Chapter 303-b cards (the second half of chapter 303). Keys are stable
// ids: never rename them.

export const prompts = {
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
    q: 'Which function signature accepts `"lit"`, `&my_string` and `&my_string[2..]` all three?',
    options: [
      { t: '`fn f(s: String)`', why: 'That takes ownership of a `String`, and a literal is not one.' },
      { t: '`fn f(s: &String)`', why: 'A literal or a slice is a `&str`, not a `&String`.' },
      { t: '`fn f(s: &mut str)`', why: 'Literals are read-only, so you cannot get a `&mut` to one.' },
      { t: '`fn f(s: &str)`', correct: true, why: 'Literals and slices are `&str`, and a `&String` is turned into a `&str` for you.' },
    ],
  },
  {
    q: 'In `let lit = "print";`, where do the five bytes live?',
    options: [
      { t: 'On the heap, owned by `lit`', why: 'Only a `String` owns heap text. `lit` is a `&str`.' },
      { t: 'In the compiled program itself; `lit` borrows them', correct: true, why: 'String literals are slices of text stored in the program, which is why they cannot be changed.' },
      { t: 'They are copied into `lit` byte by byte', why: '`lit` holds a pointer and a length, not the bytes.' },
      { t: 'On the stack, inside `lit`', why: 'A `&str` is only a pointer and a length; the bytes are elsewhere.' },
    ],
  },
  {
    q: '`fn name() -> String { "drip" }` does not compile. Which fix is right?',
    options: [
      { t: 'Change the return type to `&String`', why: 'There is no `String` to borrow; the literal is a `&str`.' },
      { t: 'Write `"drip".to_string()`', correct: true, why: 'rustc’s help line suggests it: it copies the literal into a new, owned `String`.' },
      { t: 'Write `&"drip"`', why: 'That is a reference to a `&str`, still not a `String`.' },
      { t: 'Add `mut` to the function', why: 'Mutability has nothing to do with it; the types differ.' },
    ],
  },
  {
    q: 'What does `"héllo".len()` return?',
    options: [
      { t: '5', why: 'That is the number of characters (`chars().count()`). `len` counts bytes.' },
      { t: '6', correct: true, why: '`é` takes two bytes in UTF-8, and `len` counts bytes.' },
      { t: '10', why: 'UTF-8 does not use two bytes for every character; ASCII letters take one.' },
      { t: 'A compile error, because of the accent', why: 'Rust strings are UTF-8, so any character is allowed.' },
    ],
  },
  {
    q: 'Why does `let both = "tea" + "pot";` not compile, while `String::from("tea") + "pot"` does?',
    options: [
      { t: '`+` makes new text, which needs an owner; starting from a `String` gives it one to grow', correct: true, why: '`String + &str` appends to the owned `String`. Two borrowed pieces have nobody to own the result (E0369).' },
      { t: 'Rust has no `+` for text at all', why: 'It has one, for `String + &str`.' },
      { t: 'Literals must be declared `mut` first', why: 'Literals can never be changed; `mut` does not help.' },
      { t: 'The strings have different lengths', why: 'Lengths do not matter to `+`.' },
    ],
  },
];
