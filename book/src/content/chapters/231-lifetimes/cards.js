// Chapter 231 cards. Keys are stable ids: never rename them.

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
        if b.get(at) == Some(&b'@') {
            return self.error();
        }
        let s = &self.src[at..self.pos];
        Token { lexeme: s, line: 1 }
    }

    // A &'static str fits in a
    // Token<'src>: it lives longer.
    fn error(&self) -> Token<'src> {
        let m = "Unexpected character.";
        Token { lexeme: m, line: 1 }
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
  'lt-what': {
    q: 'What is a **lifetime** in Rust?',
    a: 'The stretch of the program during which a reference must stay valid. It has to fit inside the life of the value it points at.',
  },
  'lt-e0597': {
    q: 'What does error E0597, “`src` does not live long enough”, mean?',
    a: 'A borrow of `src` is still used after `src` is dropped: the reference would dangle.',
  },
  'ann-what': {
    q: 'What does the `\'src` in `struct Token<\'src> { lexeme: &\'src str }` say?',
    a: 'A token holds a borrow with some lifetime `\'src`, so a `Token<\'src>` can’t outlive the text its lexeme points into.',
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
    a: 'Valid for the whole run of the program. String literals have it, because their text is stored in the binary.',
  },
  'static-error': {
    q: 'How can drip-rs’s `error` put a message into a `Token<\'src>` that doesn’t come from the source?',
    a: 'The message is a `&\'static str`, which outlives any `\'src`, so it can be used where a `&\'src str` is wanted.',
  },
  'engine-two': {
    q: 'Why does drip-rs’s `Compiler<\'src, \'a>` have two lifetime parameters?',
    a: 'It holds two different loans: the source text (`\'src`, for tokens and local names) and the heap, roots and error list it borrows from its caller (`\'a`).',
  },
};

export const examples = {
  'tokens-outlive': {
    lang: 'rust',
    title: 'Tokens outlive the scanner',
    code: `${SCANNER}
fn main() {
    let src = String::from("let x @ 1");
    let mut toks = Vec::new();
    {
        let mut sc = Scanner::new(&src);
        for _ in 0..4 {
            toks.push(sc.next());
        }
    } // sc is dropped here
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
    walkthrough: `The body is a two-phase scan, like drip-rs’s \`skip_whitespace\` followed by \`identifier\`:

- skip spaces, so \`"let  x"\` with two spaces still gives \`"x"\`;
- note the start, \`at\`, and advance to the next space or the end;
- if \`at == self.pos\` nothing was read, so the source is used up: \`None\`.

The slice \`&self.src[at..self.pos]\` points into the original text, which the last test checks by comparing addresses.

The signature is the lifetime lesson. With \`-> Option<&str>\`, elision rule 3 gives the result the lifetime of \`&mut self\`. Then \`a\` keeps \`w\` mutably borrowed, the second call is E0499, and \`first\` can’t outlive \`w\`. Writing \`-> Option<&'src str>\` says the word borrows the *source*, which is what is actually true: \`self.src\` is a \`&'src str\`, and slicing it gives another one. That is exactly how drip-rs’s \`scan_token\` returns a \`Token<'src>\`.`,
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
    walkthrough: `**\`text\`.** Elision rule 3 says a method’s output borrows from \`self\`. Here that is false: the slice comes from \`src\`, whose lifetime is named \`'s\`. If you leave the output as \`&str\`, the body is rejected ("lifetime may not live long enough": it returns data with lifetime \`'s\` where \`self\`’s was promised). Writing \`-> &'s str\` tells the truth, and then the second test works even though the \`Span\` is a temporary dropped at the end of its statement.

**\`longer\`.** Two reference inputs, no \`self\`: rule 2 doesn’t apply, so the compiler can’t pick and reports E0106. \`<'a>\` on both inputs and the output says "the result is valid while both inputs are", which is the honest answer when it could be either one.`,
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
      { t: 'Structs can’t hold references in Rust', why: 'They can, as drip-rs’s `Token<\'src>` does; they just need a lifetime parameter.' },
      { t: 'A struct holding a reference needs a lifetime parameter, so the compiler can stop a token outliving the text it borrows', correct: true, why: 'E0106: the field’s borrow needs a named lifetime, declared on the struct.' },
      { t: '`&str` is not a real type', why: 'It is: a borrowed string slice (chapter 224).' },
      { t: 'The field should be `String` because Rust can’t store text', why: '`String` would work, but it copies the text. A `&\'src str` points into the source without allocating.' },
    ],
  },
  {
    q: 'A `Token` borrows from `src`, `src` is dropped at the end of a block, and the token is printed after the block. What happens?',
    options: [
      { t: 'It prints garbage from freed memory', why: 'That is what Rust exists to prevent; the program never runs.' },
      { t: 'It panics at run time', why: 'There is no run-time check: it is caught at compile time.' },
      { t: 'It works, because the garbage collector keeps `src` alive', why: 'Rust has no garbage collector to keep values alive.' },
      { t: 'It doesn’t compile: E0597, `src` does not live long enough', correct: true, why: 'The borrow is still used after its owner is dropped.' },
    ],
  },
  {
    q: 'What does adding `<\'a>` and `&\'a` to `fn longer` change at run time?',
    options: [
      { t: 'Nothing: it only tells the compiler how the result relates to the inputs', correct: true, why: 'Lifetimes are checked and then gone. The machine code is the same.' },
      { t: 'It keeps both inputs alive until the result is dropped', why: 'Annotations never extend a value’s life; they let the compiler reject callers that would need that.' },
      { t: 'It adds a check that the result is still valid', why: 'There is no run-time check.' },
    ],
  },
  {
    q: 'Which elision rule gives `fn get(&self, k: &str) -> &str` its output lifetime?',
    options: [
      { t: 'Rule 1: each parameter gets its own lifetime', why: 'Rule 1 only names the inputs; it doesn’t decide the output.' },
      { t: 'Rule 2: the single input lifetime goes to the output', why: 'There are two input lifetimes here, `self`’s and `k`’s.' },
      { t: 'Rule 3: in a method, outputs get the lifetime of `&self`', correct: true, why: 'So the result borrows from `self`, not from `k`.' },
      { t: 'None: this is E0106', why: 'Rule 3 resolves it, because one input is `&self`.' },
    ],
  },
  {
    q: 'A word splitter has `fn next_word(&mut self) -> Option<&str>`. Why does `let a = w.next_word(); let b = w.next_word();` fail when `a` is used later?',
    options: [
      { t: '`Option` can’t hold references', why: '`Option<&str>` is fine.' },
      { t: 'The elided output borrows `w` mutably for as long as `a` lives, so a second `&mut` call is E0499', correct: true, why: 'Rule 3 ties the word to `&mut self`. Returning `Option<&\'src str>` fixes it.' },
      { t: 'A `&mut self` method can only be called once', why: 'It can be called many times, just not while an earlier borrow is still in use.' },
    ],
  },
  {
    q: 'Why does drip-rs never allocate while scanning?',
    options: [
      { t: 'Each token’s lexeme is a `&\'src str` slice of the source, and the compiler’s local names are too', correct: true, why: 'Lifetimes let the tokens point into the source safely, instead of copying it.' },
      { t: 'The source is a `&\'static str`', why: 'It is any `&\'src str`; the corpus runner reads files into `String`s.' },
      { t: 'It scans everything into a `Vec<Token>` up front', why: 'It scans on demand, one token at a time, and a `Vec` would allocate.' },
      { t: 'Rust strings never allocate', why: '`String` allocates on the heap; a borrowed `&str` doesn’t.' },
    ],
  },
];
