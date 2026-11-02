// Chapter 73 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 138, 138.

export const prompts = {
  'kind-count': {
    q: 'How many variants does drip-rs’s `TokenKind` have, and how does that compare with the TypeScript `TokenType`?',
    a: 'Fifty-two, the same fifty-two kinds as the TypeScript union, in the same order.',
  },
  'kind-names': {
    q: 'Why is the TypeScript token type `\'(\'` called `LeftParen` in Rust?',
    a: 'An enum variant must be an identifier, and `(` isn’t one.',
  },
  'kind-derive': {
    q: 'Which derive gives `TokenKind` its `==`?',
    a: '`PartialEq` (with `Eq`). `Clone` and `Copy` let it be copied like an integer, and `Debug` prints its name.',
  },
  'kind-size': {
    q: 'How big is a `TokenKind`, and why?',
    a: '1 byte. It has 54 possible values (51 plain kinds plus `Error` with 3 `ScanError`s), and one byte can tell 256 apart.',
  },
  'error-data': {
    q: 'In drip-rs, what is the lexeme of an error token, and where does its message come from?',
    a: 'The offending text from the source (such as `@`). The `ScanError` in `Error(..)` says what went wrong, and the compiler builds the message with `error.message(lexeme)`.',
  },
  'lexeme-slice': {
    q: 'What is a drip-rs token’s `lexeme`, compared with the TypeScript VM’s?',
    a: 'A `&str` slice pointing into the source (pointer and length). The TypeScript lexeme is a new string made by `source.slice`.',
  },
  'describe-token': {
    q: 'How does `Token::describe` name an end-of-file token and a string token in an error message?',
    a: 'As `end of file` and `a string`; every other token as its lexeme in quotes, such as `\'}\'`.',
  },
  'kw-match': {
    q: 'How does drip-rs look up keywords, where the TypeScript scanner uses a `Map`?',
    a: 'With a `match` on the text, one string pattern per keyword, returning `Option<TokenKind>`.',
  },
  'kw-return-none': {
    q: 'In `Some(match text { ... _ => return None })`, why does the `_` arm type-check?',
    a: '`return None` leaves the function, so that arm never produces a value; every other arm yields a `TokenKind` for the `Some`.',
  },
  'no-index': {
    q: 'Why doesn’t `let c = source[0];` compile when `source` is a `&str`?',
    a: 'A `str` is UTF-8, where characters take 1 to 4 bytes, so Rust doesn’t offer integer indexing (E0277). You slice with byte ranges or read the bytes.',
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
    q: 'What happens in drip-rs if the scanner reports `é` outside a string without first skipping its continuation bytes?',
    a: 'It panics: the lexeme slice would end after the first byte of `é`, which is not a character boundary.',
  },
  'lone-amp': {
    q: 'How does drip-rs’s scanner report a lone `&`?',
    a: 'The `b\'&\'` arm has a guard, `if self.peek() == b\'&\'`, so a lone `&` falls through to the catch-all arm: `unexpected character \'&\'`.',
  },
  'std-boundary': {
    q: 'When does `str::is_char_boundary(i)` return true?',
    a: 'When byte `i` starts a character (it is not a continuation byte) or `i` is the length of the string.',
  },
};

export const examples = {
  tokens: {
    lang: 'rust',
    title: 'Kinds, tokens and keywords',
    code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum ScanError {
    UnexpectedCharacter,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum TokenKind {
    Identifier,
    Fn,
    Let,
    Error(ScanError),
}

#[derive(Clone, Copy, Debug)]
struct Token<'src> {
    kind: TokenKind,
    lexeme: &'src str,
    line: usize,
}

fn keyword(text: &str)
    -> Option<TokenKind> {
    use TokenKind as T;
    Some(match text {
        "fn" => T::Fn,
        "let" => T::Let,
        _ => return None,
    })
}

fn word(text: &str) -> Token {
    use TokenKind as T;
    let kind = keyword(text)
        .unwrap_or(T::Identifier);
    let line = 1;
    Token { kind, lexeme: text, line }
}

fn main() {
    let src = String::from("let fun @");
    let a = word(&src[0..3]);
    let b = word(&src[4..7]);
    println!("{:?}", a);
    println!("{:?}", b.kind);
    let t = TokenKind::Let;
    println!("{}", a.kind == t);

    // An error token: the lexeme is the
    // source text, the kind says why.
    use ScanError::UnexpectedCharacter;
    let e = Token {
        kind: TokenKind::Error(
            UnexpectedCharacter),
        lexeme: &src[8..9],
        line: 1,
    };
    let bad = matches!(
        e.kind, TokenKind::Error(_));
    println!("{bad}: {:?}", e);

    use std::mem::size_of;
    let k = size_of::<TokenKind>();
    let t = size_of::<Token>();
    println!("kind {k} B, token {t} B");
}`,
  },
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
        // the whole character
        let t = self.tok("Error");
        Some(t)
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
  keywordMatch: {
    lang: 'rust',
    title: 'All twenty keywords',
    prompt: 'Drip has twenty reserved words: `break class continue else extends false fn for if in init let new none print return self super true while`. Finish `keyword` so it returns the right `Kind` for each (the word `self` is `Kind::SelfKw`) and `None` for anything else; keywords are case-sensitive. Then write `word_kind`, which the scanner calls after reading a word: a keyword’s kind, or `Kind::Identifier`.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    Break, Class, Continue, Else,
    Extends, False, Fn, For, If, In,
    Init, Let, New, None, Print,
    Return, SelfKw, Super, True, While,
    Identifier,
}

fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
        "break" => K::Break,
        "class" => K::Class,
        // ...the other eighteen
        _ => return None,
    })
}

fn word_kind(text: &str) -> Kind {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    Break, Class, Continue, Else,
    Extends, False, Fn, For, If, In,
    Init, Let, New, None, Print,
    Return, SelfKw, Super, True, While,
    Identifier,
}

/// Drip's reserved word for \`text\`, if
/// it is one.
fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
        "break" => K::Break,
        "class" => K::Class,
        "continue" => K::Continue,
        "else" => K::Else,
        "extends" => K::Extends,
        "false" => K::False,
        "fn" => K::Fn,
        "for" => K::For,
        "if" => K::If,
        "in" => K::In,
        "init" => K::Init,
        "let" => K::Let,
        "new" => K::New,
        "none" => K::None,
        "print" => K::Print,
        "return" => K::Return,
        "self" => K::SelfKw,
        "super" => K::Super,
        "true" => K::True,
        "while" => K::While,
        _ => return None,
    })
}

/// The kind of a scanned word.
fn word_kind(text: &str) -> Kind {
    keyword(text)
        .unwrap_or(Kind::Identifier)
}`,
    tests: `#[test]
fn every_keyword() {
    use Kind as K;
    let all = [
        ("break", K::Break), ("class", K::Class),
        ("continue", K::Continue), ("else", K::Else),
        ("extends", K::Extends), ("false", K::False),
        ("fn", K::Fn), ("for", K::For),
        ("if", K::If), ("in", K::In),
        ("init", K::Init), ("let", K::Let),
        ("new", K::New), ("none", K::None),
        ("print", K::Print), ("return", K::Return),
        ("self", K::SelfKw), ("super", K::Super),
        ("true", K::True), ("while", K::While),
    ];
    for (text, kind) in all {
        assert_eq!(keyword(text), Some(kind), "{text}");
    }
}

#[test]
fn near_misses_are_not_keywords() {
    for text in ["classy", "fun", "f", "Fn", "LET", "", "iff", "nil", "this", "Self"] {
        assert_eq!(keyword(text), None, "{text:?}");
    }
}

#[test]
fn other_words_are_identifiers() {
    assert_eq!(word_kind("while"), Kind::While);
    assert_eq!(word_kind("whiles"), Kind::Identifier);
    assert_eq!(word_kind("_fn"), Kind::Identifier);
}`,
    hints: [
      'Each keyword is one more arm of the same shape as the two you are given: a string pattern, `=>`, and a variant. Keep the `_ => return None` arm last.',
      'Watch the one irregular name: the text `"self"` maps to `K::SelfKw`. String patterns match the whole text exactly, so `"classy"` and `"Fn"` already fall through to `_`.',
      '`word_kind` is one expression: `keyword(text)` is an `Option<Kind>`, and `.unwrap_or(Kind::Identifier)` supplies the default when it is `None`.',
    ],
    walkthrough: `**How to think about it.** The scanner has already read a whole word made of letters, digits and \`_\`; now it must decide whether the word is one of Drip’s twenty reserved words or an ordinary name. That is a lookup from text to kind, with "none of these" as a real answer, so the natural return type is \`Option<Kind>\`. In Rust, a \`match\` on a \`&str\` is the simplest lookup there is: it compares the whole text with each string pattern in turn.

**The solution, line by line.**

- \`fn keyword(text: &str) -> Option<Kind> {\` takes the word and may or may not find a kind.
- \`use Kind as K;\` gives the enum a one-letter local name, so each arm stays short.
- \`Some(match text {\` wraps whatever the \`match\` produces in \`Some\`. That saves writing \`Some(...)\` twenty times.
- \`"break" => K::Break,\` and the eighteen arms like it: a string pattern matches only the exact same text, with no prefix matching (\`classy\` is not \`class\`) and no case folding (\`Fn\` is not \`fn\`), exactly like the TypeScript \`KEYWORDS.get(text)\`.
- \`"self" => K::SelfKw,\` is the one arm whose variant name differs from its text: a variant called \`Self\` is not allowed, because Rust reserves that word.
- \`_ => return None,\` catches every other word. \`return\` leaves the function at once, so this arm never produces a \`Kind\` for the \`Some\` to wrap, and the types still line up.
- \`fn word_kind(text: &str) -> Kind { keyword(text).unwrap_or(Kind::Identifier) }\` turns "not a keyword" into "a name". In drip-rs this is the line \`self.make(keyword(text).unwrap_or(TokenKind::Identifier))\` in the scanner’s \`identifier\` method.

**Common wrong attempts.**

- Lowercasing the text first (\`text.to_lowercase()\`) makes \`Fn\` and \`LET\` keywords, which Drip says they are not, and allocates a \`String\` for every word.
- \`keyword(text).unwrap()\` panics on \`None\`, and most words in a program are not keywords.
- Leaving out a keyword: the \`every_keyword\` test names it.

Why not a \`HashMap\` built at startup, like the TypeScript \`Map\`? It would work, but it would have to be built and stored somewhere; the \`match\` needs no setup and allocates nothing.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    Break, Class, Continue, Else,
    Extends, False, Fn, For, If, In,
    Init, Let, New, None, Print,
    Return, SelfKw, Super, True, While,
    Identifier,
}

fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    let t = text.to_lowercase();
    Some(match t.as_str() {
        "break" => K::Break,
        "class" => K::Class,
        "continue" => K::Continue,
        "else" => K::Else,
        "extends" => K::Extends,
        "false" => K::False,
        "fn" => K::Fn,
        "for" => K::For,
        "if" => K::If,
        "in" => K::In,
        "init" => K::Init,
        "let" => K::Let,
        "new" => K::New,
        "none" => K::None,
        "print" => K::Print,
        "return" => K::Return,
        "self" => K::SelfKw,
        "super" => K::Super,
        "true" => K::True,
        "while" => K::While,
        _ => return None,
    })
}

fn word_kind(text: &str) -> Kind {
    keyword(text)
        .unwrap_or(Kind::Identifier)
}`,
        why: 'Drip’s keywords are case-sensitive: `Fn` and `LET` are ordinary identifiers. Lowercasing first turns them into keywords (and allocates a `String` for every word).',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    Break, Class, Continue, Else,
    Extends, False, Fn, For, If, In,
    Init, Let, New, None, Print,
    Return, SelfKw, Super, True, While,
    Identifier,
}

fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
        "break" => K::Break,
        "class" => K::Class,
        "continue" => K::Continue,
        "else" => K::Else,
        "extends" => K::Extends,
        "false" => K::False,
        "fn" => K::Fn,
        "for" => K::For,
        "if" => K::If,
        "in" => K::In,
        "init" => K::Init,
        "let" => K::Let,
        "new" => K::New,
        "none" => K::None,
        "print" => K::Print,
        "return" => K::Return,
        "self" => K::SelfKw,
        "super" => K::Super,
        "true" => K::True,
        "while" => K::While,
        _ => return None,
    })
}

fn word_kind(text: &str) -> Kind {
    keyword(text).unwrap()
}`,
        why: '`unwrap` panics on `None`, and most words in a program are not keywords. `unwrap_or(Kind::Identifier)` gives the default instead.',
      },
    ],
  },
  tsName: {
    lang: 'rust',
    optional: true,
    title: 'Back to TypeScript names',
    prompt: 'To compare drip-rs’s scanner with the TypeScript one token by token, you need each `Kind` written the TypeScript way. Write `ts_name`: punctuation and operators are named by their own text (`LeftParen` is `"("`, `BangEqual` is `"!="`, `AndAnd` is `"&&"`, `DotDot` is `".."`), and the others by a lowercase word (`Identifier` is `"identifier"`, `Str` is `"string"`, `SelfKw` is `"self"`, every `Error(..)` is `"error"`, `Eof` is `"eof"`).',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum ScanError {
    UnexpectedCharacter,
    UnterminatedString,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    LeftParen, RightParen, Bang,
    BangEqual, AndAnd, DotDot,
    Identifier, Str, Number,
    Fn, SelfKw,
    Error(ScanError), Eof,
}

fn ts_name(k: Kind) -> &'static str {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum ScanError {
    UnexpectedCharacter,
    UnterminatedString,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    LeftParen, RightParen, Bang,
    BangEqual, AndAnd, DotDot,
    Identifier, Str, Number,
    Fn, SelfKw,
    Error(ScanError), Eof,
}

/// The TypeScript VM's name for a kind.
fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "(",
        K::RightParen => ")",
        K::Bang => "!",
        K::BangEqual => "!=",
        K::AndAnd => "&&",
        K::DotDot => "..",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        K::Fn => "fn",
        K::SelfKw => "self",
        K::Error(_) => "error",
        K::Eof => "eof",
    }
}`,
    tests: `#[test]
fn punctuation_is_named_by_its_lexeme() {
    assert_eq!(ts_name(Kind::LeftParen), "(");
    assert_eq!(ts_name(Kind::RightParen), ")");
    assert_eq!(ts_name(Kind::Bang), "!");
    assert_eq!(ts_name(Kind::BangEqual), "!=");
    assert_eq!(ts_name(Kind::AndAnd), "&&");
    assert_eq!(ts_name(Kind::DotDot), "..");
}

#[test]
fn literals_have_word_names() {
    assert_eq!(ts_name(Kind::Identifier), "identifier");
    assert_eq!(ts_name(Kind::Str), "string");
    assert_eq!(ts_name(Kind::Number), "number");
}

#[test]
fn keywords_and_bookkeeping() {
    use ScanError::*;
    assert_eq!(ts_name(Kind::Fn), "fn");
    assert_eq!(ts_name(Kind::SelfKw), "self");
    let a = Kind::Error(UnexpectedCharacter);
    let b = Kind::Error(UnterminatedString);
    assert_eq!(ts_name(a), "error");
    assert_eq!(ts_name(b), "error");
    assert_eq!(ts_name(Kind::Eof), "eof");
}`,
    hints: [
      'One `match` arm per variant, each returning a string literal.',
      'String literals are `&\'static str`, which is exactly the return type. For the error variant, the pattern `K::Error(_)` matches every `ScanError`.',
      'List every variant rather than using `_`, so the compiler tells you if one is missing.',
    ],
    walkthrough: `**How to think about it.** This is a translation table, from Rust’s names back to TypeScript’s, and a \`match\` with one arm per variant is the clearest way to write a table in Rust. The only arm that needs thought is \`Error\`, because it carries a \`ScanError\` and TypeScript has a single \`'error'\` for all of them.

**The solution, line by line.**

- \`fn ts_name(k: Kind) -> &'static str {\` returns a string literal. Literals live inside the compiled program for as long as it runs, which is what \`'static\` means, so nothing is allocated.
- \`use Kind as K;\` shortens the arms.
- \`K::LeftParen => "(",\` and the other punctuation arms give the token’s own text, because TypeScript used the text itself as the type.
- \`K::Identifier => "identifier",\`, \`K::Str => "string",\`, \`K::Number => "number",\` give the literal kinds their word names.
- \`K::SelfKw => "self",\` undoes the one rename Rust forced.
- \`K::Error(_) => "error",\` matches an error token whatever its \`ScanError\`; the \`_\` ignores the payload.
- \`K::Eof => "eof",\` ends the table.

Listing every variant, with no catch-all \`_\` arm, is the habit from the chapter *Enums and match*: if someone adds a kind, this \`match\` stops compiling until it gets a name.

**Common wrong attempts.**

- Word names for punctuation (\`"left_paren"\`): the TypeScript VM names punctuation by its own text.
- A catch-all \`_ => "identifier"\` arm: it quietly calls \`Fn\`, \`SelfKw\`, \`Error\` and \`Eof\` identifiers, and the compiler can no longer warn you.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum ScanError {
    UnexpectedCharacter,
    UnterminatedString,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    LeftParen, RightParen, Bang,
    BangEqual, AndAnd, DotDot,
    Identifier, Str, Number,
    Fn, SelfKw,
    Error(ScanError), Eof,
}

fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "left_paren",
        K::RightParen => "right_paren",
        K::Bang => "bang",
        K::BangEqual => "bang_equal",
        K::AndAnd => "and_and",
        K::DotDot => "dot_dot",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        K::Fn => "fn",
        K::SelfKw => "self",
        K::Error(_) => "error",
        K::Eof => "eof",
    }
}`,
        why: 'The TypeScript VM names punctuation by its own text: the type of `(` is `\'(\'`. Only Rust needed word names for it.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum ScanError {
    UnexpectedCharacter,
    UnterminatedString,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    LeftParen, RightParen, Bang,
    BangEqual, AndAnd, DotDot,
    Identifier, Str, Number,
    Fn, SelfKw,
    Error(ScanError), Eof,
}

fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "(",
        K::RightParen => ")",
        K::Bang => "!",
        K::BangEqual => "!=",
        K::AndAnd => "&&",
        K::DotDot => "..",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        _ => "identifier",
    }
}`,
        why: 'The `_` arm swallows `Fn`, `SelfKw`, `Error` and `Eof` and calls them identifiers. Name every variant, and the compiler checks you missed none.',
      },
    ],
  },
  scanNumber: {
    lang: 'rust',
    title: 'Scan a number',
    prompt: 'Port the number scanner to bytes. `number` starts at `self.cur`: set `self.st` there, read the digits, then a fractional part **only** if a `.` is followed by a digit (so `1.` is the number `1` and a dot, as in the TypeScript scanner). Leave `cur` just past the number, and return the lexeme as a slice of `src`.',
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
    walkthrough: `**How to think about it.** Say the rule in words before writing code: a number is one or more digits, and then, *if* a dot is followed by a digit, the dot and more digits. The word "if" is doing a lot: the scanner must look two bytes ahead (the dot, and what comes after it) before deciding to take the dot, because \`1.\` must stay the number \`1\` followed by a \`Dot\`. That is what \`peek_next\` is for. Everything else is "keep stepping while the next byte is a digit".

**The solution, line by line.**

- \`self.st = self.cur;\` marks where the lexeme begins. Without it, the slice at the end would start wherever the previous token did.
- \`while digit(self.peek()) { self.cur += 1; }\` steps over the whole part. \`peek\` returns one byte (NUL at the end, which is not a digit, so the loop always stops), and \`digit\` is \`is_ascii_digit\`, the byte version of the TypeScript \`isDigit\`.
- \`if self.peek() == b'.' && digit(self.peek_next())\` is the two-byte lookahead: a dot, *and* a digit after it. \`&&\` only looks at the second byte if the first test passed.
- \`self.cur += 1;\` steps over the dot.
- \`while digit(self.peek()) { self.cur += 1; }\` steps over the fractional digits. There is no second \`if\`, so \`1.5.6\` stops after \`1.5\`: a number has at most one fraction.
- \`&self.src[self.st..self.cur]\` returns the lexeme as a slice of the source. Every byte stepped over was an ASCII digit or a dot, so both ends are character boundaries and the slice cannot panic. The return type \`&'src str\` says the lexeme borrows from the source, not from the scanner.

Put it beside the TypeScript and the shape is identical; only the type of a "character" changed, from a one-letter string to a \`u8\`.

**Common wrong attempts.**

- Taking the dot whenever it appears: \`1.\` then scans as \`"1."\`.
- Treating dots like digits in one loop: \`1.5.6\` becomes one number.
- Forgetting \`self.st = self.cur\`: the lexeme then starts at an old position (the last test starts at 4 and catches this).
`,
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
    prompt: 'Write the scanner’s UTF-8 skip as two functions. `is_cont(c)` is true for a continuation byte (`10xxxxxx`). `char_end(b, i)`: byte `i` starts a character; return the index just past that character, by stepping over the continuation bytes after it.',
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
    walkthrough: `**How to think about it.** You do not need to decode a character to find its end. The byte at \`i\` starts a character, whatever its length; every byte after it that is a continuation byte belongs to the same character; and the first byte that is not one (or the end of the slice) is where the next character starts. So the whole job is one bit test and one loop.

**The solution, line by line.**

- \`fn is_cont(c: u8) -> bool { c & 0b1100_0000 == 0b1000_0000 }\`: the mask keeps only the top two bits, and the comparison asks whether they are \`10\`. In numbers that is 128 to 191. This is drip-rs’s \`is_continuation\`.
- \`let mut j = i + 1;\` starts just after the first byte, which begins the character and so is never a continuation byte.
- \`while j < b.len() && is_cont(b[j]) { j += 1; }\` steps over the continuation bytes. The length test comes first, so \`&&\` never reads \`b[j]\` past the end. (drip-rs gets the same safety from \`peek\`, which returns NUL at the end, and NUL is not a continuation byte.)
- \`j\` is returned: the index just past the character. \`é\` (2 bytes), \`老\` (3) and \`😀\` (4) all come out right.

**Common wrong attempts.**

- \`c >= 128\` is true for lead bytes too, so in \`"éé"\` the second é’s lead byte 195 is swallowed into the first character.
- Guessing a length from the first byte (\`i + 2\` for anything non-ASCII) breaks on three- and four-byte characters.
`,
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
    q: 'How does drip-rs represent the TypeScript token type `\'>=\'`?',
    options: [
      {
        t: 'As the string `">="`',
        why: 'Rust has no string literal types; drip-rs uses an enum.',
      },
      {
        t: 'As the variant `TokenKind::GreaterEqual`',
        correct: true,
        why: 'Each TypeScript token type becomes a variant with an identifier for a name.',
      },
      {
        t: 'As the byte `b\'>\'` followed by `b\'=\'`',
        why: 'Those are the source bytes. The token records its kind as an enum value and points at the bytes.',
      },
    ],
  },
  {
    q: 'Why does `kind == TokenKind::Error` fail to compile in drip-rs?',
    options: [
      {
        t: 'Because `TokenKind` doesn’t derive `PartialEq`',
        why: 'It does; `kind == TokenKind::Comma` compiles.',
      },
      {
        t: 'Because `Error` carries a `ScanError`, so `TokenKind::Error` on its own is a constructor, not a kind',
        correct: true,
        why: 'rustc says “expected `TokenKind`, found enum constructor”. Ask with `matches!(kind, TokenKind::Error(_))`.',
      },
      {
        t: 'Because enums can never be compared with `==`',
        why: 'They can, once they derive (or implement) `PartialEq`.',
      },
    ],
  },
  {
    q: 'drip-rs scans `@`. What is in the error token?',
    options: [
      {
        t: 'Kind `Error(UnexpectedCharacter)` and lexeme `"@"`',
        correct: true,
        why: 'The lexeme is source text; the compiler builds `unexpected character \'@\'` from the two.',
      },
      {
        t: 'Kind `Error` and lexeme `"unexpected character \'@\'"`',
        why: 'That is the TypeScript VM’s error token. drip-rs keeps the lexeme as source text.',
      },
      {
        t: 'Nothing: the scanner panics',
        why: 'Scanning errors are tokens, so the compiler can report them and keep going.',
      },
    ],
  },
  {
    q: 'drip-rs’s `Token` is 32 bytes. Where do they go?',
    options: [
      {
        t: 'A copy of the lexeme’s text, up to 32 characters',
        why: 'The lexeme is a slice into the source; no text is copied.',
      },
      {
        t: 'An 8-byte `TokenKind` plus three 8-byte fields',
        why: 'A `TokenKind` is 1 byte; the rest of its 8-byte slot is padding.',
      },
      {
        t: '1 byte of kind, a 16-byte `&str` (pointer and length), an 8-byte line, and padding up to a multiple of 8',
        correct: true,
        why: '1 + 16 + 8 = 25, rounded up to 32 by the 8-byte alignment. Measured with rustc 1.97.',
      },
    ],
  },
  {
    q: 'What does `keyword("Class")` return in drip-rs?',
    options: [
      {
        t: '`Some(TokenKind::Class)`',
        why: 'Matching is case-sensitive.',
      },
      {
        t: 'It panics',
        why: 'The `_` arm returns `None` for every other text.',
      },
      {
        t: '`None`, so the scanner makes an `Identifier`',
        correct: true,
        why: 'String patterns match exactly, and keywords are lowercase.',
      },
    ],
  },
  {
    q: 'Why does drip-rs keep both `source: &str` and `bytes: &[u8]`?',
    options: [
      {
        t: 'The bytes are a copy, kept so the source can be freed',
        why: '`as_bytes()` copies nothing; both views share memory, and the source can’t be freed while tokens borrow it.',
      },
      {
        t: 'It reads `bytes` to recognise tokens, and slices `source` to make each lexeme a `&str`',
        correct: true,
        why: 'Bytes are cheap to compare; the `&str` slice is what a token stores.',
      },
      {
        t: 'The `&str` is for Windows and the bytes for Linux',
        why: 'Both are the same UTF-8 text on every platform.',
      },
    ],
  },
  {
    q: 'What is `"é".len()` in Rust?',
    options: [
      {
        t: '1',
        why: 'That is its length in TypeScript, in UTF-16 code units.',
      },
      {
        t: '4',
        why: 'é needs two bytes, not four. Some emoji need four.',
      },
      {
        t: '2',
        correct: true,
        why: '`len` counts UTF-8 bytes: 195 and 169.',
      },
    ],
  },
  {
    q: 'Which byte value can be part of a non-ASCII character in UTF-8?',
    options: [
      {
        t: '34, the code of `"`',
        why: 'All bytes of multi-byte characters are 128 or more, so 34 is always a real quote.',
      },
      {
        t: '10, the code of a newline',
        why: 'Below 128, so it is always a real newline.',
      },
      {
        t: '0, NUL',
        why: 'Also ASCII.',
      },
      {
        t: '169',
        correct: true,
        why: '169 is `10101001`, a continuation byte; it is the second byte of é.',
      },
    ],
  },
  {
    q: 'The scanner meets byte 195 (the first byte of `é`) outside a string. What does drip-rs do?',
    options: [
      {
        t: 'Panics, because 195 is not ASCII',
        why: 'It reports a compile error instead, like the TypeScript VM. (Without the skip loop it *would* panic, slicing inside `é`.)',
      },
      {
        t: 'Skips the following continuation bytes and returns one `Error(UnexpectedCharacter)` token whose lexeme is the whole `é`',
        correct: true,
        why: 'So the message names `é`, and the next token starts on a character boundary.',
      },
      {
        t: 'Returns an error token for 195, then another for the next byte',
        why: 'The skip loop takes both bytes into one token.',
      },
      {
        t: 'Treats it as part of an identifier',
        why: 'Identifiers are ASCII letters, digits and `_` only.',
      },
    ],
  },
  {
    q: 'How does drip-rs scan `1.`?',
    options: [
      {
        t: 'As the number `1.`',
        why: 'A fraction needs a digit after the dot.',
      },
      {
        t: 'As a `Number` token `1`, then a `Dot`',
        correct: true,
        why: 'Exactly as the TypeScript scanner does, thanks to `peek_next`.',
      },
      {
        t: 'As an error',
        why: 'Both tokens are valid; whether the grammar accepts them is the compiler’s business.',
      },
    ],
  },
];
