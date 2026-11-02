// Chapter 353-b cards. Keys are stable ids: never rename them.

// The cut-down scanner shared by the examples. Its signatures are the
// ones in companion/rust/src/scanner.rs; the body splits on spaces.
const SCANNER = `#[derive(Clone, Copy, Debug)]
struct Token<'src> {
    lexeme: &'src str,
    line: usize,
}

struct Scanner<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Scanner<'src> {
    fn new(src: &'src str) -> Self {
        Scanner { src, pos: 0 }
    }

    // The token borrows the source,
    // not the scanner.
    fn next(&mut self) -> Token<'src> {
        let b = self.src.as_bytes();
        while self.pos < b.len()
            && b[self.pos] == b' '
        {
            self.pos += 1;
        }
        let at = self.pos;
        while self.pos < b.len()
            && b[self.pos] != b' '
        {
            self.pos += 1;
        }
        let s = &self.src[at..self.pos];
        Token { lexeme: s, line: 1 }
    }
}
`;

const WORDS_HEAD = `struct Words<'src> {
    src: &'src str,
    pos: usize,
}
`;

const WORDS_BODY = `        let b = self.src.as_bytes();
        while self.pos < b.len()
            && b[self.pos] == b' '
        {
            self.pos += 1;
        }
        let at = self.pos;
        while self.pos < b.len()
            && b[self.pos] != b' '
        {
            self.pos += 1;
        }
        if at == self.pos {
            return None;
        }
        Some(&self.src[at..self.pos])`;

const words = (sig, body) => `${WORDS_HEAD}
impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }

    ${sig} {
${body}
    }
}`;

const SPAN = `struct Span {
    start: usize,
    end: usize,
}
`;

export const prompts = {
  'ann-what': {
    q: 'What does the `\'src` in `struct Token<\'src> { lexeme: &\'src str }` say?',
    a: 'A token holds a borrow with some lifetime `\'src`, so a `Token<\'src>` can’t outlive the text its lexeme points into.',
  },
  'ann-struct': {
    q: 'Why does `struct Token { lexeme: &str }` fail with E0106?',
    a: 'A struct that holds a reference must name the reference’s lifetime as a parameter, so the compiler can stop a token outliving the text it borrows.',
  },
  'ann-longer': {
    q: 'Why does `fn longer(a: &str, b: &str) -> &str` fail with E0106?',
    a: 'The result borrows from `a` or `b`, and the signature doesn’t say which, so the compiler can’t check callers.',
  },
  'ann-no-extend': {
    q: 'Can adding a lifetime annotation make a value live longer?',
    a: 'No. Annotations only describe how lifetimes relate; owners still drop their values at the end of their scope.',
  },
  'elide-rules': {
    q: 'Name the three lifetime elision rules.',
    a: '1: each reference parameter gets its own lifetime. 2: one input lifetime goes to every output. 3: in a method with `&self` or `&mut self`, outputs get self’s lifetime.',
  },
  'elide-rule3': {
    q: 'Why does drip-rs write `fn scan_token(&mut self) -> Token<\'src>` instead of letting elision fill in the lifetime?',
    a: 'Elision (rule 3) would tie the token to the borrow of the scanner, so the scanner couldn’t be called again while a token is alive.',
  },
  'static-what': {
    q: 'What does `\'static` mean, and what has it?',
    a: 'Valid for the whole run of the program. String literals have it, because their text is stored in the program itself.',
  },
  'engine-two': {
    q: 'Why does drip-rs’s `Compiler<\'src, \'a>` have two lifetime parameters?',
    a: 'It holds two different loans: the source text (`\'src`, for tokens and local names) and the heap and GC roots it borrows from its caller (`\'a`).',
  },
};

export const examples = {
  'tokens-outlive': {
    lang: 'rust',
    title: 'Tokens outlive the scanner',
    code: `${SCANNER}
fn main() {
    let src = String::from("let x = 1");
    let mut toks = Vec::new();
    {
        let mut sc = Scanner::new(&src);
        for _ in 0..4 {
            toks.push(sc.next());
        }
    } // sc is dropped here
    // A &'static str fits in a Token.
    toks.push(Token {
        lexeme: "self",
        line: 0,
    });
    for t in &toks {
        println!("{:?}", t);
    }
}`,
  },
};

export const exercises = {
  words: {
    lang: 'rust',
    title: 'A word splitter that never copies',
    prompt:
      'Write `next_word`, which returns the next space-separated word of the source, or `None` at the end. It must return a slice of the source, not a new `String`. The starter’s signature uses the elided form; the tests hold two words at once and keep a word after the `Words` value is gone, so you’ll need to fix the signature too.',
    starter: words(`fn next_word(&mut self)
        -> Option<&str>`, '        todo!()'),
    solution: words(`fn next_word(&mut self)
        -> Option<&'src str>`, WORDS_BODY),
    tests: `#[test]
fn splits_on_spaces() {
    let mut w = Words::new("let  x = 1");
    assert_eq!(w.next_word(), Some("let"));
    assert_eq!(w.next_word(), Some("x"));
    assert_eq!(w.next_word(), Some("="));
    assert_eq!(w.next_word(), Some("1"));
    assert_eq!(w.next_word(), None);
}

#[test]
fn empty_and_blank_sources() {
    assert_eq!(Words::new("").next_word(), None);
    assert_eq!(Words::new("   ").next_word(), None);
}

#[test]
fn two_words_at_once() {
    let mut w = Words::new("a bc");
    let a = w.next_word();
    let b = w.next_word();
    assert_eq!((a, b), (Some("a"), Some("bc")));
}

#[test]
fn words_outlive_the_splitter() {
    let src = String::from("fn main");
    let first;
    {
        let mut w = Words::new(&src);
        first = w.next_word();
    }
    assert_eq!(first, Some("fn"));
}

#[test]
fn words_point_into_the_source() {
    let src = "ab cd";
    let mut w = Words::new(src);
    w.next_word();
    let cd = w.next_word().unwrap();
    // the same bytes, not a copy
    assert_eq!(cd.as_ptr(), src[3..].as_ptr());
}`,
    hints: [
      'Work on `self.src.as_bytes()`. First move `self.pos` past any spaces, then remember where the word starts.',
      'Move `self.pos` on until a space or the end. If it didn’t move, there was no word: return `None`.',
      'Return `Some(&self.src[at..self.pos])`. For the signature, say the slice borrows the source: `-> Option<&\'src str>`.',
    ],
    walkthrough: `**How to think about it.** There are two separate jobs here: the *body* (finding the next word) and the *signature* (saying what the word borrows). Do the body first, the way you would with a finger on the text: skip any spaces, note where the word starts, move on until the next space or the end, and hand back what lies between. If your finger did not move, there was no word left.

The signature is the lifetime lesson. The starter says \`-> Option<&str>\`, and elision rule 3 fills that in as "borrows from \`&mut self\`". That is not what the code does: the word is a slice of \`self.src\`, which is a \`&'src str\` borrowed from the *caller's* text. Say so, and the tests that hold two words at once, or keep a word after the splitter is gone, start to compile.

**The solution, line by line.**

- \`fn next_word(&mut self) -> Option<&'src str> {\`: the method moves \`self.pos\`, so it needs \`&mut self\`; the result is \`Some(word)\` or \`None\`, and the word lives as long as the source, \`'src\`, not as long as this borrow of the splitter.
- \`let b = self.src.as_bytes();\` looks at the text as bytes, so we can compare with \`b' '\` (a byte literal, the space character). Every byte we stop at is ASCII, so slicing there is safe.
- \`while self.pos < b.len() && b[self.pos] == b' ' { self.pos += 1; }\` skips any run of spaces; the first test has two spaces between \`let\` and \`x\`.
- \`let at = self.pos;\` remembers where the word starts.
- \`while self.pos < b.len() && b[self.pos] != b' ' { self.pos += 1; }\` walks to the next space or the end of the text.
- \`if at == self.pos { return None; }\`: nothing was read, so the text is used up (or was all spaces).
- \`Some(&self.src[at..self.pos])\` slices the original text. Because \`self.src\` is a \`&'src str\`, the slice is one too, which is exactly what the signature promised. The last test checks it really is the same bytes, by comparing addresses.

**Common wrong attempts.**

- Keeping \`-> Option<&str>\`: the body is fine, but rule 3 ties each word to the \`&mut self\` borrow. Then \`let a = w.next_word(); let b = w.next_word();\` is E0499 while \`a\` is alive, and \`first\` cannot outlive the block that holds \`w\`. This is the same trap drip-rs avoids by writing \`Token<'src>\`.
- Eating exactly one space after each word instead of skipping spaces before it: two spaces in a row then produce an empty word \`""\`.
- Returning \`String\` with \`.to_string()\`: it works for the text, but copies, and the address test fails.`,
    wrong: [
      {
        code: words(`fn next_word(&mut self)
        -> Option<&str>`, WORDS_BODY),
        why: 'The body is right, but the elided lifetime ties each word to the `&mut self` borrow. Holding two words is E0499, and a word can’t outlive the splitter. Say `Option<&\'src str>`.',
      },
      {
        code: words(`fn next_word(&mut self)
        -> Option<&'src str>`, `        let b = self.src.as_bytes();
        let at = self.pos;
        while self.pos < b.len()
            && b[self.pos] != b' '
        {
            self.pos += 1;
        }
        let w = &self.src[at..self.pos];
        if self.pos < b.len() {
            self.pos += 1; // one space
        }
        if at == self.pos {
            return None;
        }
        Some(w)`),
        why: 'It eats exactly one space after each word, so two spaces in a row produce an empty word `""`. Skip all the spaces before the word starts.',
      },
    ],
  },
  spanText: {
    lang: 'rust',
    optional: true,
    title: 'Which input does it borrow?',
    prompt:
      'Fix both signatures and write both bodies. `Span::text` returns the part of `src` between `start` and `end`; the result must stay usable after the `Span` is gone. `longer` returns whichever of two strings is longer (the first if they tie).',
    starter: `${SPAN}
impl Span {
    fn text<'s>(&self, src: &'s str)
        -> &str {
        todo!()
    }
}

fn longer(a: &str, b: &str) -> &str {
    todo!()
}`,
    solution: `${SPAN}
impl Span {
    fn text<'s>(&self, src: &'s str)
        -> &'s str {
        &src[self.start..self.end]
    }
}

fn longer<'a>(a: &'a str, b: &'a str)
    -> &'a str {
    if a.len() >= b.len() {
        a
    } else {
        b
    }
}`,
    tests: `#[test]
fn text_is_a_slice_of_the_source() {
    let src = "print 42;";
    let s = Span { start: 6, end: 8 };
    assert_eq!(s.text(src), "42");
}

#[test]
fn text_outlives_the_span() {
    let src = String::from("let x = 1;");
    // the Span is a temporary, gone after this line
    let name = Span { start: 4, end: 5 }.text(&src);
    assert_eq!(name, "x");
}

#[test]
fn longer_picks_the_longer() {
    assert_eq!(longer("ab", "abc"), "abc");
    assert_eq!(longer("abcd", "abc"), "abcd");
    assert_eq!(longer("ab", "cd"), "ab");
}`,
    hints: [
      'With `&self` as an input, elision rule 3 gives `text`’s result the lifetime of the borrow of `self`. But the slice comes from `src`.',
      'Write `-> &\'s str` for `text`. For `longer`, declare `<\'a>` and put `\'a` on both inputs and the output.',
    ],
    walkthrough: `**How to think about it.** For each function, ask one question: *which input does the answer point into?* Then write a signature that says exactly that, and let the compiler check the body against it.

**\`text\`.** The answer is a slice of \`src\`, never of the \`Span\` (a \`Span\` holds two numbers, nothing to borrow). Elision rule 3, though, says a method's output borrows from \`self\`. Leave the output as \`&str\` and rustc 1.97 rejects the body with "lifetime may not live long enough ... method was supposed to return data with lifetime \`'1\` but it is returning data with lifetime \`'s\`", where \`'1\` is its name for the borrow of \`self\`. The fix is the one its help line gives: \`-> &'s str\`.

- \`fn text<'s>(&self, src: &'s str) -> &'s str {\` declares \`'s\`, gives it to \`src\`, and says the result lives as long as \`src\`.
- \`&src[self.start..self.end]\` is a slice of \`src\` from \`start\` up to (not including) \`end\`, a \`&'s str\`.

With that, the second test works even though its \`Span\` is a temporary, dropped at the end of its own statement: the name points into \`src\`, which lives on.

**\`longer\`.** Two reference inputs and no \`self\`, so rule 2 does not apply (it needs exactly one input lifetime) and neither does rule 3: E0106. The answer may be either input, so one name for all three is the honest signature.

- \`fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {\`: "the result is valid while both inputs are".
- \`if a.len() >= b.len() { a } else { b }\`: an \`if\` is an expression, so the chosen branch is the returned value. \`>=\` makes the first argument win a tie.

**Common wrong attempts.**

- Fixing only \`longer\` and leaving \`text\` returning \`&str\`: the body is rejected, as above.
- Using \`>\` in \`longer\`: a tie returns \`b\`, and the third test wants \`"ab"\`.
- Writing \`fn longer<'a, 'b>(a: &'a str, b: &'b str) -> &'a str\`: then returning \`b\` is an error, because \`b\` was not promised to live as long as \`'a\`.`,
    wrong: [
      {
        code: `${SPAN}
impl Span {
    fn text<'s>(&self, src: &'s str)
        -> &str {
        &src[self.start..self.end]
    }
}

fn longer<'a>(a: &'a str, b: &'a str)
    -> &'a str {
    if a.len() >= b.len() {
        a
    } else {
        b
    }
}`,
        why: 'The elided output of `text` gets `self`’s lifetime (rule 3), but the slice comes from `src`. The compiler rejects the body: the output must be `&\'s str`.',
      },
      {
        code: `${SPAN}
impl Span {
    fn text<'s>(&self, src: &'s str)
        -> &'s str {
        &src[self.start..self.end]
    }
}

fn longer<'a>(a: &'a str, b: &'a str)
    -> &'a str {
    if a.len() > b.len() {
        a
    } else {
        b
    }
}`,
        why: 'With `>` a tie returns `b`, but the first argument should win a tie. Use `>=`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does `struct Token { lexeme: &str }` fail to compile?',
    options: [
      { t: 'Structs can’t hold references in Rust', why: 'They can, as drip-rs’s `Token<\'src>` does; they need a lifetime parameter.' },
      { t: 'A struct holding a reference needs a lifetime parameter, so a token can’t outlive the text it borrows', correct: true, why: 'E0106: the field’s borrow needs a named lifetime, declared on the struct.' },
      { t: '`&str` is not a real type', why: 'It is: a borrowed string slice (*Slices and strings*).' },
      { t: 'Rust can only store text as `String`', why: '`String` would work, but it copies. A `&\'src str` points into the source without allocating.' },
    ],
  },
  {
    q: 'What does adding `<\'a>` and `&\'a` to `fn longer` change at run time?',
    options: [
      { t: 'It keeps both inputs alive until the result is dropped', why: 'Annotations never extend a value’s life; they let the compiler reject callers that would need that.' },
      { t: 'Nothing: it only tells the compiler how the result relates to the inputs', correct: true, why: 'Lifetimes are checked and then gone. The machine code is the same.' },
      { t: 'It adds a check that the result is still valid', why: 'There is no run-time check.' },
    ],
  },
  {
    q: 'Which elision rule gives `fn get(&self, k: &str) -> &str` its output lifetime?',
    options: [
      { t: 'Rule 1: each parameter gets its own lifetime', why: 'Rule 1 only names the inputs; it doesn’t decide the output.' },
      { t: 'Rule 2: the single input lifetime goes to the output', why: 'There are two input lifetimes here, `self`’s and `k`’s.' },
      { t: 'None: this is E0106', why: 'Rule 3 resolves it, because one input is `&self`.' },
      { t: 'Rule 3: in a method, outputs get the lifetime of `&self`', correct: true, why: 'So the result borrows from `self`, not from `k`.' },
    ],
  },
  {
    q: 'A word splitter has `fn next_word(&mut self) -> Option<&str>`. Why does `let a = w.next_word(); let b = w.next_word();` fail when `a` is used later?',
    options: [
      { t: 'The elided output borrows `w` mutably for as long as `a` lives, so a second `&mut` call is E0499', correct: true, why: 'Rule 3 ties the word to `&mut self`. Returning `Option<&\'src str>` fixes it.' },
      { t: '`Option` can’t hold references', why: '`Option<&str>` is fine.' },
      { t: 'A `&mut self` method can only be called once', why: 'It can be called many times, just not while an earlier borrow is still in use.' },
    ],
  },
  {
    q: 'How can drip-rs’s compiler put the text `"self"` into a `Token<\'src>` when `self` is not in the source?',
    options: [
      { t: 'It copies `"self"` into the source string first', why: 'The source is borrowed and never changed.' },
      { t: 'It uses `unsafe` code', why: 'drip-rs forbids `unsafe` code entirely.' },
      { t: 'A string literal is a `&\'static str`, which outlives any `\'src`, so it fits', correct: true, why: '`\'static` can be used wherever a shorter lifetime is wanted.' },
      { t: 'Tokens made by the compiler have no lifetime', why: 'Every `Token` has one; this one’s lexeme just happens to live forever.' },
    ],
  },
];
