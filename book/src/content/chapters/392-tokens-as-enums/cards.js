// Chapter 392 cards. Keys are stable ids: never rename them.

const KW_HEAD = `#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    Break, Class, Continue, Else,
    Extends, False, Fn, For, If, In,
    Init, Let, New, None, Print,
    Return, SelfKw, Super, True, While,
    Identifier,
}
`;

const KW_ARMS = `        "break" => K::Break,
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
`;

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
};

export const exercises = {
  keywordMatch: {
    lang: 'rust',
    title: 'All twenty keywords',
    prompt:
      'Drip has twenty reserved words: `break class continue else extends false fn for if in init let new none print return self super true while`. Finish `keyword` so it returns the right `Kind` for each (the word `self` is `Kind::SelfKw`) and `None` for anything else; keywords are case-sensitive. Then write `word_kind`, which the scanner calls after reading a word: a keyword’s kind, or `Kind::Identifier`.',
    starter: `${KW_HEAD}
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
    solution: KW_SOL,
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
      'To compare drip-rs’s scanner with the TypeScript one token by token, you need each `Kind` written the TypeScript way. Write `ts_name`: punctuation and operators are named by their own text (`LeftParen` is `"("`, `BangEqual` is `"!="`, `AndAnd` is `"&&"`, `DotDot` is `".."`), and the others by a lowercase word (`Identifier` is `"identifier"`, `Str` is `"string"`, `SelfKw` is `"self"`, every `Error(..)` is `"error"`, `Eof` is `"eof"`).',
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
        code: `${TN_HEAD}
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
        code: `${TN_HEAD}
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
};

export const quiz = [
  {
    q: 'How does drip-rs represent the TypeScript token type `\'>=\'`?',
    options: [
      { t: 'As the string `">="`', why: 'Rust has no string literal types; drip-rs uses an enum.' },
      { t: 'As the variant `TokenKind::GreaterEqual`', correct: true, why: 'Each TypeScript token type becomes a variant with an identifier for a name.' },
      { t: 'As the byte `b\'>\'` followed by `b\'=\'`', why: 'Those are the source bytes. The token records its kind as an enum value and points at the bytes.' },
    ],
  },
  {
    q: 'Why does `kind == TokenKind::Error` fail to compile in drip-rs?',
    options: [
      { t: 'Because `TokenKind` doesn’t derive `PartialEq`', why: 'It does; `kind == TokenKind::Comma` compiles.' },
      { t: 'Because `Error` carries a `ScanError`, so `TokenKind::Error` on its own is a constructor, not a kind', correct: true, why: 'rustc says “expected `TokenKind`, found enum constructor”. Ask with `matches!(kind, TokenKind::Error(_))`.' },
      { t: 'Because enums can never be compared with `==`', why: 'They can, once they derive (or implement) `PartialEq`.' },
    ],
  },
  {
    q: 'drip-rs scans `@`. What is in the error token?',
    options: [
      { t: 'Kind `Error(UnexpectedCharacter)` and lexeme `"@"`', correct: true, why: 'The lexeme is source text; the compiler builds `unexpected character \'@\'` from the two.' },
      { t: 'Kind `Error` and lexeme `"unexpected character \'@\'"`', why: 'That is the TypeScript VM’s error token. drip-rs keeps the lexeme as source text.' },
      { t: 'Nothing: the scanner panics', why: 'Scanning errors are tokens, so the compiler can report them and keep going.' },
    ],
  },
  {
    q: 'drip-rs’s `Token` is 32 bytes. Where do they go?',
    options: [
      { t: 'A copy of the lexeme’s text, up to 32 characters', why: 'The lexeme is a slice into the source; no text is copied.' },
      { t: 'An 8-byte `TokenKind` plus three 8-byte fields', why: 'A `TokenKind` is 1 byte; the rest of its 8-byte slot is padding.' },
      { t: '1 byte of kind, a 16-byte `&str` (pointer and length), an 8-byte line, and padding up to a multiple of 8', correct: true, why: '1 + 16 + 8 = 25, rounded up to 32 by the 8-byte alignment. Measured with rustc 1.97.' },
    ],
  },
  {
    q: 'What does `keyword("Class")` return in drip-rs?',
    options: [
      { t: '`Some(TokenKind::Class)`', why: 'Matching is case-sensitive.' },
      { t: 'It panics', why: 'The `_` arm returns `None` for every other text.' },
      { t: '`None`, so the scanner makes an `Identifier`', correct: true, why: 'String patterns match exactly, and keywords are lowercase.' },
    ],
  },
];
