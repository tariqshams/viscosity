// Chapter 292 cards. Keys are stable ids: never rename them.

export const prompts = {
  'no-index': {
    q: 'Why doesn’t `let c = source[0];` compile when `source` is a `&str`?',
    a: 'A `str` is UTF-8, where characters take 1 to 4 bytes, so Rust doesn’t offer integer indexing (E0277). You slice with byte ranges or read the bytes.',
  },
  'as-bytes': {
    q: 'What does `source.as_bytes()` cost?',
    a: 'Nothing: it is the same memory viewed as a `&[u8]`. No copy is made.',
  },
  'byte-literal': {
    q: 'What is `b\'(\'`?',
    a: 'A byte literal: the `u8` with the ASCII code of `(`, which is 40.',
  },
  'peek-nul': {
    q: 'How does drip-rs’s `peek` handle the end of the source without an `at_end` check?',
    a: '`self.bytes.get(self.current)` is `None` past the end, and `.copied().unwrap_or(b\'\\0\')` turns that into the NUL byte.',
  },
  'utf8-ascii': {
    q: 'Why can comparing a byte of the source with `b\'"\'` never match part of `é`?',
    a: 'In UTF-8 every byte of a non-ASCII character is 128 or more, and every ASCII byte is below 128.',
  },
  'utf8-cont': {
    q: 'What bit pattern does a UTF-8 continuation byte have, and how does drip-rs test for it?',
    a: '`10xxxxxx`. The test is `c & 0b1100_0000 == 0b1000_0000`.',
  },
  'skip-why': {
    q: 'What would drip-rs’s scanner do with `é` outside a string if it didn’t skip continuation bytes?',
    a: 'Return two “Unexpected character.” tokens, one per byte, where the TypeScript scanner returns one.',
  },
  emoji: {
    q: 'The TypeScript scanner gives two error tokens for 😀 and drip-rs one. Why does the output still match?',
    a: 'After the first error the compiler is in panic mode and reports nothing more until the next statement, so both print one error.',
  },
  'std-boundary': {
    q: 'When does `str::is_char_boundary(i)` return true?',
    a: 'When byte `i` starts a character (it is not a continuation byte) or `i` is the length of the string.',
  },
};

export const examples = {
  'mini-scanner': {
    lang: 'rust',
    title: 'A byte scanner with the UTF-8 skip',
    code: `// A tiny byte scanner, adapted from
// drip-rs's scanner.rs.
struct Scan<'src> {
    src: &'src str,
    b: &'src [u8], // the same text
    st: usize,     // token start
    cur: usize,    // next byte
}

// The 2nd, 3rd or 4th byte of a UTF-8
// character looks like 10xxxxxx.
fn is_cont(c: u8) -> bool {
    c & 0b1100_0000 == 0b1000_0000
}

fn digit(c: u8) -> bool {
    c >= b'0' && c <= b'9'
}

impl<'src> Scan<'src> {
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    fn bump(&mut self) -> u8 {
        self.cur += 1;
        self.b[self.cur - 1]
    }

    fn tok(&self, k: &str) -> String {
        let r = self.st..self.cur;
        let t = &self.src[r];
        format!("{k} {t}")
    }

    fn digits(&mut self) {
        while digit(self.peek()) {
            self.cur += 1;
        }
    }

    fn next(&mut self)
        -> Option<String> {
        while self.peek() == b' ' {
            self.cur += 1;
        }
        self.st = self.cur;
        if self.cur >= self.b.len() {
            return None;
        }
        let c = self.bump();
        if digit(c) {
            self.digits();
            let t = self.tok("Num");
            return Some(t);
        }
        if c == b'"' {
            while self.peek() != b'"' {
                self.cur += 1;
            }
            self.cur += 1;
            let t = self.tok("Str");
            return Some(t);
        }
        while is_cont(self.peek()) {
            self.cur += 1;
        }
        let a = self.st;
        let z = self.cur;
        Some(format!("Error {a}..{z}"))
    }
}

fn main() {
    let src = "42 \\"é\\" é 7";
    println!("{:?}", src.as_bytes());
    let mut s = Scan {
        src,
        b: src.as_bytes(),
        st: 0,
        cur: 0,
    };
    while let Some(t) = s.next() {
        println!("{}", t);
    }
}`,
  },
};

export const exercises = {
  scanNumber: {
    lang: 'rust',
    title: 'Scan a number',
    prompt:
      'Port the number scanner to bytes. `number` starts at `self.cur`: set `self.st` there, read the digits, then a fractional part **only** if a `.` is followed by a digit (so `1.` is the number `1` and a dot, as in the TypeScript scanner). Leave `cur` just past the number, and return the lexeme as a slice of `src`.',
    starter: `fn digit(c: u8) -> bool {
    c.is_ascii_digit()
}

struct Scan<'src> {
    src: &'src str,
    b: &'src [u8],
    st: usize,
    cur: usize,
}

impl<'src> Scan<'src> {
    fn new(src: &'src str) -> Self {
        let b = src.as_bytes();
        Scan { src, b, st: 0, cur: 0 }
    }

    /// The next byte (NUL at the end).
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    /// The byte after that, or NUL.
    fn peek_next(&self) -> u8 {
        let i = self.cur + 1;
        let x = self.b.get(i);
        x.copied().unwrap_or(b'\\0')
    }

    /// Scan the number at \`cur\`, and
    /// return its lexeme.
    fn number(&mut self) -> &'src str {
        todo!()
    }
}`,
    solution: `fn digit(c: u8) -> bool {
    c.is_ascii_digit()
}

struct Scan<'src> {
    src: &'src str,
    b: &'src [u8],
    st: usize,
    cur: usize,
}

impl<'src> Scan<'src> {
    fn new(src: &'src str) -> Self {
        let b = src.as_bytes();
        Scan { src, b, st: 0, cur: 0 }
    }

    /// The next byte (NUL at the end).
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    /// The byte after that, or NUL.
    fn peek_next(&self) -> u8 {
        let i = self.cur + 1;
        let x = self.b.get(i);
        x.copied().unwrap_or(b'\\0')
    }

    /// Scan the number at \`cur\`, and
    /// return its lexeme.
    fn number(&mut self) -> &'src str {
        self.st = self.cur;
        while digit(self.peek()) {
            self.cur += 1;
        }
        // \`1.\` is 1 and then a dot.
        if self.peek() == b'.'
            && digit(self.peek_next())
        {
            self.cur += 1;
            while digit(self.peek()) {
                self.cur += 1;
            }
        }
        &self.src[self.st..self.cur]
    }
}`,
    tests: `#[test]
fn whole_numbers() {
    let mut s = Scan::new("123;");
    assert_eq!(s.number(), "123");
    assert_eq!(s.cur, 3);
}

#[test]
fn a_fraction() {
    assert_eq!(Scan::new("1.5").number(), "1.5");
    assert_eq!(Scan::new("0.25)").number(), "0.25");
}

#[test]
fn a_dot_needs_a_digit_after_it() {
    let mut s = Scan::new("1.");
    assert_eq!(s.number(), "1");
    assert_eq!(s.cur, 1);
    assert_eq!(Scan::new("7.x").number(), "7");
}

#[test]
fn only_one_fraction() {
    assert_eq!(Scan::new("1.5.6").number(), "1.5");
}

#[test]
fn stops_at_letters_and_end() {
    assert_eq!(Scan::new("12abc").number(), "12");
    let mut s = Scan::new("x = 40");
    s.cur = 4;
    assert_eq!(s.number(), "40");
    assert_eq!(s.st, 4);
}`,
    hints: [
      'Start with `self.st = self.cur;`, then `while digit(self.peek()) { self.cur += 1; }`.',
      'The fraction needs two bytes of lookahead: `self.peek() == b\'.\'` and `digit(self.peek_next())`.',
      'If both hold, step over the dot and read digits again. Then return `&self.src[self.st..self.cur]`.',
    ],
    walkthrough: `This is drip-rs’s \`number\`, returning the lexeme instead of a whole token.

- **Mark the start.** \`self.st = self.cur\` records where the lexeme begins.
- **Whole part.** Each \`peek\` is one byte. \`digit\` is \`is_ascii_digit\`, the byte version of the TypeScript \`c >= '0' && c <= '9'\`.
- **Fraction, with two-byte lookahead.** A dot only belongs to the number if a digit follows it, which is why \`peek_next\` exists. \`1.\` stays \`1\` and a \`Dot\`, so \`1.foo\` can one day be a method call. And \`1.5.6\` stops after \`1.5\`: there is only one fraction.
- **Slice.** Every byte we stepped over was an ASCII digit or a dot, so both ends of \`st..cur\` are character boundaries and the slice can’t panic.

Compare it with the TypeScript: the shape is identical. Only the type of a “character” changed, from a one-letter string to a \`u8\`.`,
    wrong: [
      {
        code: `fn digit(c: u8) -> bool {
    c.is_ascii_digit()
}

struct Scan<'src> {
    src: &'src str,
    b: &'src [u8],
    st: usize,
    cur: usize,
}

impl<'src> Scan<'src> {
    fn new(src: &'src str) -> Self {
        let b = src.as_bytes();
        Scan { src, b, st: 0, cur: 0 }
    }

    /// The next byte (NUL at the end).
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    /// The byte after that, or NUL.
    fn peek_next(&self) -> u8 {
        let i = self.cur + 1;
        let x = self.b.get(i);
        x.copied().unwrap_or(b'\\0')
    }

    fn number(&mut self) -> &'src str {
        self.st = self.cur;
        while digit(self.peek()) {
            self.cur += 1;
        }
        if self.peek() == b'.' {
            self.cur += 1;
            while digit(self.peek()) {
                self.cur += 1;
            }
        }
        &self.src[self.st..self.cur]
    }
}`,
        why: 'This takes the dot whenever it appears, so `1.` scans as `"1."`. The fraction needs a digit after the dot: check `peek_next()` too.',
      },
      {
        code: `fn digit(c: u8) -> bool {
    c.is_ascii_digit()
}

struct Scan<'src> {
    src: &'src str,
    b: &'src [u8],
    st: usize,
    cur: usize,
}

impl<'src> Scan<'src> {
    fn new(src: &'src str) -> Self {
        let b = src.as_bytes();
        Scan { src, b, st: 0, cur: 0 }
    }

    /// The next byte (NUL at the end).
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    /// The byte after that, or NUL.
    fn peek_next(&self) -> u8 {
        let i = self.cur + 1;
        let x = self.b.get(i);
        x.copied().unwrap_or(b'\\0')
    }

    fn number(&mut self) -> &'src str {
        self.st = self.cur;
        while digit(self.peek())
            || self.peek() == b'.'
        {
            self.cur += 1;
        }
        &self.src[self.st..self.cur]
    }
}`,
        why: 'Treating dots like digits accepts `1.5.6` as one number, and `1.` too. A number has at most one fraction, and only with a digit after the dot.',
      },
      {
        code: `fn digit(c: u8) -> bool {
    c.is_ascii_digit()
}

struct Scan<'src> {
    src: &'src str,
    b: &'src [u8],
    st: usize,
    cur: usize,
}

impl<'src> Scan<'src> {
    fn new(src: &'src str) -> Self {
        let b = src.as_bytes();
        Scan { src, b, st: 0, cur: 0 }
    }

    /// The next byte (NUL at the end).
    fn peek(&self) -> u8 {
        let x = self.b.get(self.cur);
        x.copied().unwrap_or(b'\\0')
    }

    /// The byte after that, or NUL.
    fn peek_next(&self) -> u8 {
        let i = self.cur + 1;
        let x = self.b.get(i);
        x.copied().unwrap_or(b'\\0')
    }

    fn number(&mut self) -> &'src str {
        while digit(self.peek()) {
            self.cur += 1;
        }
        if self.peek() == b'.'
            && digit(self.peek_next())
        {
            self.cur += 1;
            while digit(self.peek()) {
                self.cur += 1;
            }
        }
        &self.src[self.st..self.cur]
    }
}`,
        why: 'This never sets `self.st`, so the lexeme starts wherever the last token did (here, 0). Mark the start first.',
      },
    ],
  },
  charEnd: {
    lang: 'rust',
    optional: true,
    title: 'Skip a whole character',
    prompt:
      'Write the scanner’s UTF-8 skip as two functions. `is_cont(c)` is true for a continuation byte (`10xxxxxx`). `char_end(b, i)`: byte `i` starts a character; return the index just past that character, by stepping over the continuation bytes after it.',
    starter: `/// Is \`c\` a continuation byte, the 2nd,
/// 3rd or 4th byte of a character?
fn is_cont(c: u8) -> bool {
    todo!()
}

/// The index just past the character
/// that starts at byte \`i\`.
fn char_end(b: &[u8], i: usize)
    -> usize {
    todo!()
}`,
    solution: `/// Is \`c\` a continuation byte, the 2nd,
/// 3rd or 4th byte of a character?
fn is_cont(c: u8) -> bool {
    c & 0b1100_0000 == 0b1000_0000
}

/// The index just past the character
/// that starts at byte \`i\`.
fn char_end(b: &[u8], i: usize)
    -> usize {
    let mut j = i + 1;
    while j < b.len() && is_cont(b[j]) {
        j += 1;
    }
    j
}`,
    tests: `#[test]
fn continuation_bytes() {
    assert!(is_cont(0b1010_1001)); // 169
    assert!(is_cont(0x80));
    assert!(is_cont(0xBF));
    assert!(!is_cont(b'a'));
    assert!(!is_cont(0xC3)); // a lead byte
    assert!(!is_cont(0xF0)); // a lead byte
}

#[test]
fn ascii_is_one_byte() {
    assert_eq!(char_end(b"ab", 0), 1);
}

#[test]
fn longer_characters() {
    let s = "aé老😀!";
    let b = s.as_bytes();
    assert_eq!(char_end(b, 1), 3);  // é: 2 bytes
    assert_eq!(char_end(b, 3), 6);  // 老: 3 bytes
    assert_eq!(char_end(b, 6), 10); // 😀: 4 bytes
    assert_eq!(char_end(b, 10), 11);
}

#[test]
fn stops_at_the_next_character() {
    let b = "éé".as_bytes();
    assert_eq!(char_end(b, 0), 2);
    assert!("éé".is_char_boundary(2));
}

#[test]
fn stops_at_the_end() {
    let b = "x😀".as_bytes();
    assert_eq!(char_end(b, 1), 5);
}`,
    hints: [
      'Mask off the top two bits with `c & 0b1100_0000` and compare with `0b1000_0000`.',
      'In `char_end`, start at `i + 1` and keep going while that byte is a continuation byte.',
      'Don’t read past the end: check `j < b.len()` before `b[j]`.',
    ],
    walkthrough: `**\`is_cont\`.** The two top bits decide: \`0x\` is ASCII, \`11\` a lead byte, \`10\` a continuation. Masking with \`0b1100_0000\` keeps just those two bits, and \`== 0b1000_0000\` asks for \`10\`. That is drip-rs’s \`is_continuation\`, and in numbers it says 128 to 191.

**\`char_end\`.** The byte at \`i\` begins a character, whatever its length. Everything after it that is a continuation byte belongs to the same character. The first byte that isn’t, or the end of the slice, is where the next character starts. So \`é\` (2 bytes), \`老\` (3) and \`😀\` (4) all come out right without ever decoding the lead byte.

The \`j < b.len()\` test comes first, so \`&&\` never evaluates \`b[j]\` past the end. drip-rs gets the same effect from \`peek\`, which returns NUL at the end, and NUL is not a continuation byte.`,
    wrong: [
      {
        code: `/// Is \`c\` a continuation byte, the 2nd,
/// 3rd or 4th byte of a character?
fn is_cont(c: u8) -> bool {
    c >= 128
}

/// The index just past the character
/// that starts at byte \`i\`.
fn char_end(b: &[u8], i: usize)
    -> usize {
    let mut j = i + 1;
    while j < b.len() && is_cont(b[j]) {
        j += 1;
    }
    j
}`,
        why: '`c >= 128` is true for lead bytes too. In `"éé"`, the second é’s lead byte 195 would be swallowed into the first character.',
      },
      {
        code: `fn is_cont(c: u8) -> bool {
    c & 0b1100_0000 == 0b1000_0000
}

fn char_end(b: &[u8], i: usize)
    -> usize {
    if b[i] < 128 {
        i + 1
    } else {
        i + 2
    }
}`,
        why: 'Not every non-ASCII character is two bytes: `老` is three and `😀` four. Follow the continuation bytes instead of guessing a length.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does drip-rs keep both `source: &str` and `bytes: &[u8]`?',
    options: [
      { t: 'The bytes are a copy, kept so the source can be freed', why: '`as_bytes()` copies nothing; both views share memory, and the source can’t be freed while tokens borrow it.' },
      { t: 'It reads `bytes` to recognise tokens, and slices `source` to make each lexeme a `&str`', correct: true, why: 'Bytes are cheap to compare; the `&str` slice is what a token stores.' },
      { t: 'The `&str` is for Windows and the bytes for Linux', why: 'Both are the same UTF-8 text on every platform.' },
    ],
  },
  {
    q: 'What is `"é".len()` in Rust?',
    options: [
      { t: '1', why: 'That is its length in TypeScript, in UTF-16 code units.' },
      { t: '4', why: 'é needs two bytes, not four. Some emoji need four.' },
      { t: '2', correct: true, why: '`len` counts UTF-8 bytes: 195 and 169.' },
    ],
  },
  {
    q: 'Which byte value can be part of a non-ASCII character in UTF-8?',
    options: [
      { t: '34, the code of `"`', why: 'All bytes of multi-byte characters are 128 or more, so 34 is always a real quote.' },
      { t: '10, the code of a newline', why: 'Below 128, so it is always a real newline.' },
      { t: '0, NUL', why: 'Also ASCII.' },
      { t: '169', correct: true, why: '169 is `10101001`, a continuation byte; it is the second byte of é.' },
    ],
  },
  {
    q: 'The scanner meets byte 195 outside a string. What does drip-rs do?',
    options: [
      { t: 'Panics, because 195 is not ASCII', why: 'It reports a compile error instead, like the TypeScript VM.' },
      { t: 'Skips the following continuation bytes and returns one “Unexpected character.” error token', correct: true, why: 'So the next token starts on a character boundary, and é gives one error.' },
      { t: 'Returns an error token for 195, then another for the next byte', why: 'That is what happens without the skip loop.' },
      { t: 'Treats it as part of an identifier', why: 'Identifiers are ASCII letters, digits and `_` only.' },
    ],
  },
  {
    q: 'How does `peek()` behave at the end of the source?',
    options: [
      { t: 'It panics with an index out of bounds', why: 'That is what `self.bytes[self.current]` would do. `get` returns `None` instead.' },
      { t: 'It returns `None`', why: 'Its return type is `u8`. The `Option` is unwrapped with a default.' },
      { t: 'It returns `b\'\\0\'`, through `get(..).copied().unwrap_or(b\'\\0\')`', correct: true, why: 'The same convention as the TypeScript scanner’s `\'\\0\'`.' },
    ],
  },
  {
    q: 'How does drip-rs scan `1.`?',
    options: [
      { t: 'As the number `1.`', why: 'A fraction needs a digit after the dot.' },
      { t: 'As a `Number` token `1`, then a `Dot`', correct: true, why: 'Exactly as the TypeScript scanner does, thanks to `peek_next`.' },
      { t: 'As an error', why: 'Both tokens are valid; whether the grammar accepts them is the compiler’s business.' },
    ],
  },
];
