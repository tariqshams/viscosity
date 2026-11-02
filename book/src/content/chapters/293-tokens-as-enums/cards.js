// Chapter 293 cards. Keys are stable ids: never rename them.

const KW_HEAD = `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    And, Class, Else, False, Fn, For,
    If, Let, Nil, Or, Print, Return,
    Super, This, True, While,
    Identifier,
}
`;

const KW_ARMS = `        "and" => K::And,
        "class" => K::Class,
        "else" => K::Else,
        "false" => K::False,
        "fn" => K::Fn,
        "for" => K::For,
        "if" => K::If,
        "let" => K::Let,
        "nil" => K::Nil,
        "or" => K::Or,
        "print" => K::Print,
        "return" => K::Return,
        "super" => K::Super,
        "this" => K::This,
        "true" => K::True,
        "while" => K::While,
        _ => return None,`;

const KW_SOL = `${KW_HEAD}
/// Drip's reserved word for \`text\`, if
/// it is one.
fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
${KW_ARMS}
    })
}

/// The kind of a scanned word.
fn word_kind(text: &str) -> Kind {
    keyword(text)
        .unwrap_or(Kind::Identifier)
}`;

const TN_HEAD = `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    LeftParen, RightParen, Bang,
    BangEqual, Less, LessEqual,
    Identifier, Str, Number,
    Fn, Error, Eof,
}
`;

export const prompts = {
  'kind-forty': {
    q: 'drip-rs’s `TokenKind` has forty variants. Where does the fortieth, `Error`, come from in the TypeScript VM?',
    a: 'From `VmTokenType = TokenType | \'error\'`: the VM’s scanner extends the shared 39-member union with `\'error\'`.',
  },
  'kind-names': {
    q: 'Why is the TypeScript token type `\'(\'` called `LeftParen` in Rust?',
    a: 'An enum variant must be an identifier, and `(` isn’t one.',
  },
  'kind-derive': {
    q: 'Which derive gives `TokenKind` its `==`?',
    a: '`PartialEq` (with `Eq`). `Copy`/`Clone` let it be copied like an integer, and `Debug` prints its name.',
  },
  'kind-size': {
    q: 'How big is a `TokenKind`, and why?',
    a: '1 byte. Its variants carry no data, so a value is just a discriminant, and forty of them fit in a `u8`.',
  },
  'lexeme-slice': {
    q: 'What is a drip-rs token’s `lexeme`, compared with the TypeScript VM’s?',
    a: 'A `&str` slice pointing into the source (pointer and length). The TypeScript lexeme is a new string made by `source.slice`.',
  },
  'src-lifetime': {
    q: 'Why does drip-rs’s compiler never run into E0597 with its tokens?',
    a: 'The source outlives the whole compile: `Compiler<\'src, \'a>` borrows it for `\'src`, so every token it holds is valid until compiling ends.',
  },
  'error-static': {
    q: 'How does drip-rs’s compiler get an `Identifier` token for `this` when it compiles a method?',
    a: 'It makes one with `Token::synthetic("this", line)`: the lexeme is a `&\'static str` literal, which fits any `Token<\'src>`.',
  },
  'kw-match': {
    q: 'How does drip-rs look up keywords, where the TypeScript scanner uses a `Map`?',
    a: 'With a `match` on the text, one string pattern per keyword, returning `Option<TokenKind>`.',
  },
  'kw-return-none': {
    q: 'In `Some(match text { ... _ => return None })`, why does the `_` arm type-check?',
    a: '`return None` leaves the function, so that arm never produces a value; every other arm yields a `TokenKind` for the `Some`.',
  },
};

export const examples = {
  tokens: {
    lang: 'rust',
    title: 'Kinds, tokens and keywords',
    code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum TokenKind {
    LeftParen,
    Identifier,
    Number,
    Fn,
    Let,
    Error,
    Eof,
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

fn word<'s>(text: &'s str)
    -> Token<'s> {
    use TokenKind as T;
    let kind = keyword(text)
        .unwrap_or(T::Identifier);
    let line = 1;
    Token { kind, lexeme: text, line }
}

fn main() {
    let src = String::from("let fun");
    let a = word(&src[0..3]);
    let b = word(&src[4..7]);
    println!("{:?}", a);
    println!("{:?}", b.kind);
    let t = TokenKind::Let;
    println!("{}", a.kind == t);

    // An error token: its lexeme is a
    // &'static str message, not source.
    let e = Token {
        kind: TokenKind::Error,
        lexeme: "Unexpected character.",
        line: 3,
    };
    let (n, m) = (e.line, e.lexeme);
    println!("[line {n}] {m}");

    use std::mem::size_of;
    let k = size_of::<TokenKind>();
    let t = size_of::<Token>();
    println!("kind {k} B, token {t} B");
}`,
  },
};

export const exercises = {
  keywordMatch: {
    lang: 'rust',
    title: 'All sixteen keywords',
    prompt:
      'Drip has sixteen reserved words: `and class else false fn for if let nil or print return super this true while`. Finish `keyword` so it returns the right `Kind` for each and `None` for anything else (keywords are case-sensitive). Then write `word_kind`, which the scanner calls after reading a word: a keyword’s kind, or `Kind::Identifier`.',
    starter: `${KW_HEAD}
fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
        "and" => K::And,
        "class" => K::Class,
        // ...the other fourteen
        _ => return None,
    })
}

fn word_kind(text: &str) -> Kind {
    todo!()
}`,
    solution: KW_SOL,
    tests: `#[test]
fn every_keyword() {
    use Kind as K;
    let all = [
        ("and", K::And), ("class", K::Class),
        ("else", K::Else), ("false", K::False),
        ("fn", K::Fn), ("for", K::For),
        ("if", K::If), ("let", K::Let),
        ("nil", K::Nil), ("or", K::Or),
        ("print", K::Print), ("return", K::Return),
        ("super", K::Super), ("this", K::This),
        ("true", K::True), ("while", K::While),
    ];
    for (text, kind) in all {
        assert_eq!(keyword(text), Some(kind), "{text}");
    }
}

#[test]
fn near_misses_are_not_keywords() {
    for text in ["classy", "fun", "f", "Fn", "LET", "", "iff", "var"] {
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
      'Each keyword is one more arm of the same shape: `"else" => K::Else,`. Keep the `_ => return None` arm last.',
      'String patterns match the whole text exactly, so `"classy"` and `"Fn"` already fall through to `_`.',
      '`word_kind` is one expression: `keyword(text)` is an `Option<Kind>`, and `.unwrap_or(Kind::Identifier)` supplies the default.',
    ],
    walkthrough: `This is drip-rs’s \`keyword\` from \`scanner.rs\`, with a shorter enum name.

- **Sixteen arms.** A \`match\` on a \`&str\` compares the whole text with each string pattern. There is no prefix matching, so \`classy\` is not \`class\`, and no case folding, so \`Fn\` is not \`fn\`, exactly like the TypeScript \`KEYWORDS.get(text)\`.
- **\`Some(match ...)\`.** Every real arm produces a \`Kind\`, which \`Some\` wraps. The \`_\` arm doesn’t produce anything: \`return None\` leaves the function. That keeps the sixteen arms free of sixteen \`Some(...)\`s.
- **\`word_kind\`.** The scanner has already read a whole word made of letters, digits and \`_\`. If it’s reserved it gets that kind, otherwise it is an identifier. In drip-rs that line is \`keyword(text).unwrap_or(TokenKind::Identifier)\`.

Why not a \`HashMap\` built at startup, like the TypeScript \`Map\`? It would work, but it would have to be built and stored somewhere. The \`match\` needs no setup and no allocation.`,
    wrong: [
      {
        code: `${KW_HEAD}
fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    let t = text.to_lowercase();
    Some(match t.as_str() {
${KW_ARMS}
    })
}

fn word_kind(text: &str) -> Kind {
    keyword(text)
        .unwrap_or(Kind::Identifier)
}`,
        why: 'Drip’s keywords are case-sensitive: `Fn` and `LET` are ordinary identifiers. Lowercasing first turns them into keywords (and allocates a `String` for every word).',
      },
      {
        code: `${KW_HEAD}
fn keyword(text: &str) -> Option<Kind> {
    use Kind as K;
    Some(match text {
${KW_ARMS}
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
    prompt:
      'To compare drip-rs’s scanner with the TypeScript one token by token, you need each `Kind` written the TypeScript way. Write `ts_name`: punctuation is named by its own text (`LeftParen` is `"("`, `BangEqual` is `"!="`), and the others by a lowercase word (`Identifier` is `"identifier"`, `Str` is `"string"`, `Fn` is `"fn"`, `Error` is `"error"`, `Eof` is `"eof"`).',
    starter: `${TN_HEAD}
fn ts_name(k: Kind) -> &'static str {
    todo!()
}`,
    solution: `${TN_HEAD}
/// The TypeScript VM's name for a kind.
fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "(",
        K::RightParen => ")",
        K::Bang => "!",
        K::BangEqual => "!=",
        K::Less => "<",
        K::LessEqual => "<=",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        K::Fn => "fn",
        K::Error => "error",
        K::Eof => "eof",
    }
}`,
    tests: `#[test]
fn punctuation_is_named_by_its_lexeme() {
    assert_eq!(ts_name(Kind::LeftParen), "(");
    assert_eq!(ts_name(Kind::RightParen), ")");
    assert_eq!(ts_name(Kind::Bang), "!");
    assert_eq!(ts_name(Kind::BangEqual), "!=");
    assert_eq!(ts_name(Kind::Less), "<");
    assert_eq!(ts_name(Kind::LessEqual), "<=");
}

#[test]
fn literals_have_word_names() {
    assert_eq!(ts_name(Kind::Identifier), "identifier");
    assert_eq!(ts_name(Kind::Str), "string");
    assert_eq!(ts_name(Kind::Number), "number");
}

#[test]
fn keywords_and_bookkeeping() {
    assert_eq!(ts_name(Kind::Fn), "fn");
    assert_eq!(ts_name(Kind::Error), "error");
    assert_eq!(ts_name(Kind::Eof), "eof");
}`,
    hints: [
      'One `match` arm per variant, each returning a string literal.',
      'String literals are `&\'static str`, which is exactly the return type.',
      'List every variant instead of using `_`, so the compiler tells you if one is missing.',
    ],
    walkthrough: `The function is a \`match\` with one arm per variant, returning literals. They are \`&'static str\`, so nothing is allocated, and the return type can say \`'static\` because the strings live in the program itself.

Listing every variant, with no \`_\`, is the habit from chapter 265: if someone adds a kind, this \`match\` stops compiling until it gets a name. A catch-all arm would quietly give the new kind the wrong one.

The reverse direction is the interesting part of the port. TypeScript could use \`'('\` as both the lexeme and the type, because its types were strings. Rust needed names, and this table is the bridge between the two.`,
    wrong: [
      {
        code: `${TN_HEAD}
fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "left_paren",
        K::RightParen => "right_paren",
        K::Bang => "bang",
        K::BangEqual => "bang_equal",
        K::Less => "less",
        K::LessEqual => "less_equal",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        K::Fn => "fn",
        K::Error => "error",
        K::Eof => "eof",
    }
}`,
        why: 'The TypeScript VM names punctuation by its own text: the type of `(` is `\'(\'`. Only Rust needed word names for it.',
      },
      {
        code: `${TN_HEAD}
fn ts_name(k: Kind) -> &'static str {
    use Kind as K;
    match k {
        K::LeftParen => "(",
        K::RightParen => ")",
        K::Bang => "!",
        K::BangEqual => "!=",
        K::Less => "<",
        K::LessEqual => "<=",
        K::Identifier => "identifier",
        K::Str => "string",
        K::Number => "number",
        _ => "identifier",
    }
}`,
        why: 'The `_` arm swallows `Fn`, `Error` and `Eof` and calls them identifiers. Name every variant, and the compiler checks you missed none.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How does drip-rs represent the TypeScript token type `\'>=\'`?',
    options: [
      { t: 'As the string `">="`', why: 'Rust has no string literal types; drip-rs uses an enum.' },
      { t: 'As the variant `TokenKind::GreaterEqual`', correct: true, why: 'Each TypeScript token type becomes a fieldless variant with an identifier name.' },
      { t: 'As the byte `b\'>\'` followed by `b\'=\'`', why: 'Those are the source bytes. The token records its kind as an enum value and points at the bytes.' },
    ],
  },
  {
    q: 'What is `size_of::<TokenKind>()` in drip-rs?',
    options: [
      { t: '40, one byte per variant', why: 'A value is one variant at a time; it only needs to say which.' },
      { t: '8, like a pointer', why: 'Nothing is pointed at. The value is just a discriminant.' },
      { t: '1', correct: true, why: 'Forty fieldless variants fit in one byte. Measured with rustc 1.97.' },
      { t: '32', why: 'That is a whole `Token`: kind, lexeme slice, line and padding.' },
    ],
  },
  {
    q: 'Why does the compiler’s `check(kind)` compile as `self.current.kind == kind`?',
    options: [
      { t: 'Because `TokenKind` derives `PartialEq`', correct: true, why: 'The derive writes the `==` impl.' },
      { t: 'Because all enums support `==` automatically', why: 'They don’t; without `PartialEq`, `==` is a compile error.' },
      { t: 'Because `TokenKind` is `Copy`', why: '`Copy` lets it be copied; it doesn’t give `==`.' },
    ],
  },
  {
    q: 'drip-rs’s `Token` is 32 bytes. Where do they go?',
    options: [
      { t: '1 byte of kind, a 16-byte `&str` (pointer and length), an 8-byte line, and padding up to a multiple of 8', correct: true, why: '1 + 16 + 8 = 25, rounded up to 32 by the 8-byte alignment (chapter 276). Measured with rustc 1.97.' },
      { t: 'A copy of the lexeme’s text, up to 32 characters', why: 'The lexeme is a slice into the source; no text is copied.' },
      { t: 'An 8-byte `TokenKind` plus three 8-byte fields', why: 'A `TokenKind` is 1 byte; the rest of its 8-byte slot is padding.' },
    ],
  },
  {
    q: 'To compile `this` inside a method, drip-rs needs an `Identifier` token whose text isn’t at that spot in the source. How does it get one?',
    options: [
      { t: 'It scans the word `this` again from the source', why: 'There may be no `this` at that point; the compiler makes the token itself.' },
      { t: 'It allocates a `String` and keeps it in the compiler', why: 'A token’s lexeme is a `&str`, and nothing needs to allocate.' },
      { t: '`Token::synthetic("this", line)`, whose lexeme is a `&\'static str` literal', correct: true, why: 'A literal outlives any `\'src`, so it fits in a `Token<\'src>`, as error messages do.' },
    ],
  },
  {
    q: 'What does `keyword("Class")` return in drip-rs?',
    options: [
      { t: '`None`, so the scanner makes an `Identifier`', correct: true, why: 'String patterns match exactly; keywords are lowercase.' },
      { t: '`Some(TokenKind::Class)`', why: 'Matching is case-sensitive.' },
      { t: 'It panics', why: 'The `_` arm returns `None` for every other text.' },
    ],
  },
];
