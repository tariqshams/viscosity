// Chapter 127 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'lt-what': {
    q: 'What is a **lifetime** in Rust?',
    a: 'The stretch of code during which a reference must stay valid: from where it is made to its last use. It must fit inside the life of the value it points at.',
  },
  'lt-e0597': {
    q: 'Error E0597 says “`text` does not live long enough”. Which three places does it point at?',
    a: 'Where the borrow was made, where the owner `text` was dropped, and where the borrow was still used after that.',
  },
  'lt-last-use': {
    q: 'Does a borrow last until the closing brace of its scope?',
    a: 'No. It lasts until the reference’s last use, so after that point the value may be borrowed mutably again.',
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
  'static-what': {
    q: 'What does `\'static` mean, and what has it?',
    a: 'Valid for the whole run of the program. String literals have it, because their text is stored in the program itself.',
  },
};

export const examples = {
  'lifetime-play': {
    lang: 'rust',
    title: 'An owner that lives long enough',
    code: `fn main() {
    let text = String::from("let x");
    let r;
    {
        let n = text.len();
        r = &text[0..3];
        println!("n is {n}");
    }
    // text is still alive here, so r is
    // safe to use.
    println!("r is {r}");
    // Try: move \`let text = ...\` into
    // the block, and run it again.
}`,
  },
  'tokens-outlive': {
    lang: 'rust',
    title: 'Tokens outlive the scanner',
    code: `#[derive(Clone, Copy, Debug)]
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
  longestLine: {
    lang: 'rust',
    optional: true,
    title: 'The longest line, without copying',
    prompt: 'Write `longest_line`, which returns the longest line of `src` (the first one, if several tie, and `""` for an empty source). Return a **slice of `src`**, not a new `String`: the tests check that the answer points into the original text, and that it can be used for as long as the source is alive. `src.lines()` hands out each line in turn as a `&str` that borrows from `src`.',
    starter: `fn longest_line(src: &str) -> &str {
    todo!()
}`,
    solution: `fn longest_line(src: &str) -> &str {
    let mut best = "";
    for line in src.lines() {
        if line.len() > best.len() {
            best = line;
        }
    }
    best
}`,
    tests: `#[test]
fn picks_the_longest() {
    assert_eq!(longest_line("a\\nbbb\\ncc"), "bbb");
    assert_eq!(longest_line("one line"), "one line");
}

#[test]
fn first_one_wins_a_tie() {
    assert_eq!(longest_line("ab\\ncd\\ne"), "ab");
}

#[test]
fn empty_source_gives_empty_line() {
    assert_eq!(longest_line(""), "");
}

#[test]
fn points_into_the_source() {
    let src = "x\\nlet y = 2;\\nz";
    let l = longest_line(src);
    // the same bytes, not a copy
    assert_eq!(l.as_ptr(), src[2..].as_ptr());
}

#[test]
fn lives_as_long_as_the_source() {
    let src = String::from("fn\\nmain\\n{}");
    let l;
    {
        let view: &str = &src;
        l = longest_line(view);
    }
    assert_eq!(l, "main");
}`,
    hints: [
      'Keep the best line so far in a variable that starts as the empty string `""`, and look at every line in turn.',
      '`for line in src.lines()` gives each line as a `&str`. If `line.len()` is bigger than `best.len()`, make `line` the new best.',
      'Use `>` rather than `>=`, so a later line of the same length does not replace the first one. Return `best` as the last line of the function, with no semicolon.',
    ],
    walkthrough: `**How to think about it.** On paper you would read the lines one by one, keeping your finger on the longest so far, and move your finger only when you find a strictly longer one. That is the whole algorithm. The lifetime part is about *what* you keep your finger on: not a copy of the line, but a slice that points into \`src\`, so the function allocates nothing.

**Why no lifetime annotations are needed.** The signature \`fn longest_line(src: &str) -> &str\` has exactly one reference going in and one coming out, so Rust assumes the answer borrows from \`src\` (the second elision rule). That assumption is true here: every \`line\` is a slice of \`src\`, and so is \`""\`, which is a string literal that lives for the whole program and can stand in for any shorter borrow.

**The solution, line by line.**

- \`fn longest_line(src: &str) -> &str {\` borrows the source and promises a slice that lives as long as that borrow.
- \`let mut best = "";\` is the best line so far, the empty string, so an empty source gives \`""\`. It needs \`mut\` because we will point it at other lines.
- \`for line in src.lines() {\` walks the lines. \`lines\` splits on \`\\n\` and gives each line, without the newline, as a \`&str\` into \`src\`.
- \`if line.len() > best.len() {\` asks "strictly longer?". With \`>\`, a tie keeps the earlier line.
- \`best = line;\` moves your finger: \`best\` now points at this line. Nothing is copied; both are just an address and a length.
- \`best\` on the last line, with no semicolon, is the value the function returns (the tail expression from *Functions and expressions*).

The last test shows the lifetime at work: \`view\` is a borrow made inside a block, but the answer borrows from \`src\` itself (through \`view\`), and \`src\` lives to the end of the test, so \`l\` may be used after the block.

**Common wrong attempts.**

- Returning \`String\` and writing \`best.to_string()\`: it gives the right text, but it copies, and the pointer test fails because the copy lives somewhere else on the heap. It also changes the signature, which is the real tell: a function that only *picks* part of its input should return a slice of it.
- Writing \`>=\`: on a tie the later line wins, so \`"ab\\ncd\\ne"\` gives \`"cd"\`.
- Making \`best\` a \`&String\` or building a \`Vec\` of lines first: more work than needed, and a \`Vec\` allocates.`,
    wrong: [
      {
        code: `fn longest_line(src: &str) -> String {
    let mut best = "";
    for line in src.lines() {
        if line.len() > best.len() {
            best = line;
        }
    }
    best.to_string()
}`,
        why: 'The text is right, but it is a copy: the pointer test fails, because the answer no longer points into `src`.',
      },
      {
        code: `fn longest_line(src: &str) -> &str {
    let mut best = "";
    for line in src.lines() {
        if line.len() >= best.len() {
            best = line;
        }
    }
    best
}`,
        why: 'With `>=` a later line of the same length replaces the first, so a tie returns the wrong line.',
      },
    ],
  },
  words: {
    lang: 'rust',
    optional: true,
    title: 'A word splitter that never copies',
    prompt: 'Write `next_word`, which returns the next space-separated word of the source, or `None` at the end. It must return a slice of the source, not a new `String`. The starter’s signature uses the elided form; the tests hold two words at once and keep a word after the `Words` value is gone, so you’ll need to fix the signature too.',
    starter: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }

    fn next_word(&mut self)
        -> Option<&str> {
        todo!()
    }
}`,
    solution: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }

    fn next_word(&mut self)
        -> Option<&'src str> {
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
        if at == self.pos {
            return None;
        }
        Some(&self.src[at..self.pos])
    }
}`,
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
        code: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }

    fn next_word(&mut self)
        -> Option<&str> {
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
        if at == self.pos {
            return None;
        }
        Some(&self.src[at..self.pos])
    }
}`,
        why: 'The body is right, but the elided lifetime ties each word to the `&mut self` borrow. Holding two words is E0499, and a word can’t outlive the splitter. Say `Option<&\'src str>`.',
      },
      {
        code: `struct Words<'src> {
    src: &'src str,
    pos: usize,
}

impl<'src> Words<'src> {
    fn new(src: &'src str) -> Self {
        Words { src, pos: 0 }
    }

    fn next_word(&mut self)
        -> Option<&'src str> {
        let b = self.src.as_bytes();
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
        Some(w)
    }
}`,
        why: 'It eats exactly one space after each word, so two spaces in a row produce an empty word `""`. Skip all the spaces before the word starts.',
      },
    ],
  },
  spanText: {
    lang: 'rust',
    title: 'Which input does it borrow?',
    prompt: 'Fix both signatures and write both bodies. `Span::text` returns the part of `src` between `start` and `end`; the result must stay usable after the `Span` is gone. `longer` returns whichever of two strings is longer (the first if they tie).',
    starter: `struct Span {
    start: usize,
    end: usize,
}

impl Span {
    fn text<'s>(&self, src: &'s str)
        -> &str {
        todo!()
    }
}

fn longer(a: &str, b: &str) -> &str {
    todo!()
}`,
    solution: `struct Span {
    start: usize,
    end: usize,
}

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
        code: `struct Span {
    start: usize,
    end: usize,
}

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
        code: `struct Span {
    start: usize,
    end: usize,
}

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
    q: 'Which is the best fix for `fn make() -> &String { let s = String::from("hi"); &s }`?',
    options: [
      {
        t: '`fn make() -> String { String::from("hi") }`',
        correct: true,
        why: 'Return the owned value and move it to the caller; nothing is borrowed, so nothing can dangle.',
      },
      {
        t: '`fn make() -> &\'static String`',
        why: 'The compiler mentions it, but `s` does not live for the whole program, so this still fails.',
      },
      {
        t: 'Declare `s` with `let mut`',
        why: 'Mutability has nothing to do with how long `s` lives.',
      },
      {
        t: 'Add `drop(s)` after the reference is taken',
        why: 'That frees `s` even sooner, which is the opposite of the fix.',
      },
    ],
  },
  {
    q: '`let first = &v[0]; println!("{first}"); v.push(4);` compiles. Why?',
    options: [
      {
        t: '`push` does not really change `v`',
        why: 'It does, and it may even move the elements to a new buffer.',
      },
      {
        t: 'Rust copies `v[0]` into `first`',
        why: '`&v[0]` is a reference, not a copy.',
      },
      {
        t: 'The borrow of `first` ends at its last use, before `push`',
        correct: true,
        why: 'Lifetimes are about uses, not braces, so the mutable borrow for `push` meets no live shared borrow.',
      },
    ],
  },
  {
    q: 'What does adding `<\'a>` and `&\'a` to `fn longer` change at run time?',
    options: [
      {
        t: 'It keeps both inputs alive until the result is dropped',
        why: 'Annotations never extend a value’s life; they let the compiler reject callers that would need that.',
      },
      {
        t: 'Nothing: it only tells the compiler how the result relates to the inputs',
        correct: true,
        why: 'Lifetimes are checked and then gone. The machine code is the same.',
      },
      {
        t: 'It adds a check that the result is still valid',
        why: 'There is no run-time check.',
      },
    ],
  },
  {
    q: 'A word splitter has `fn next_word(&mut self) -> Option<&str>`. Why does `let a = w.next_word(); let b = w.next_word();` fail when `a` is used later?',
    options: [
      {
        t: 'The elided output borrows `w` mutably for as long as `a` lives, so a second `&mut` call is E0499',
        correct: true,
        why: 'Rule 3 ties the word to `&mut self`. Returning `Option<&\'src str>` fixes it.',
      },
      {
        t: '`Option` can’t hold references',
        why: '`Option<&str>` is fine.',
      },
      {
        t: 'A `&mut self` method can only be called once',
        why: 'It can be called many times, just not while an earlier borrow is still in use.',
      },
    ],
  },
];
