//! The scanner (book chapter 48, and the Rust port in Part X).
//!
//! It works on demand: the compiler asks for one token at a time, and
//! nothing is stored up front. A token borrows its lexeme straight out of
//! the source text, so scanning never allocates. A problem comes back as
//! an `Error` token that says what went wrong; the compiler reports it.
//! The tokens are exactly those of the TypeScript scanners.

/// Every kind of token Drip has.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenKind {
    // Punctuation.
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    Comma,
    Dot,
    DotDot,
    Semicolon,
    // Operators.
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Bang,
    BangEqual,
    Equal,
    EqualEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    AndAnd,
    OrOr,
    PlusEqual,
    MinusEqual,
    // Literals.
    Identifier,
    String,
    Number,
    // Keywords.
    Break,
    Class,
    Continue,
    Else,
    Extends,
    False,
    Fn,
    For,
    If,
    In,
    Init,
    Let,
    New,
    None,
    Print,
    Return,
    SelfKw,
    Super,
    True,
    While,
    // Bookkeeping.
    Error(ScanError),
    Eof,
}

/// What an `Error` token is about. Its lexeme is the offending text: the
/// character, or the letter after the backslash, or the opening quote.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ScanError {
    UnexpectedCharacter,
    UnknownEscape,
    UnterminatedString,
}

impl ScanError {
    /// The message the compiler reports, given the token's lexeme.
    pub fn message(self, lexeme: &str) -> String {
        match self {
            ScanError::UnexpectedCharacter => format!("unexpected character '{lexeme}'"),
            ScanError::UnknownEscape => {
                format!("unknown escape '\\{lexeme}' in a string")
            }
            ScanError::UnterminatedString => "unterminated string".to_string(),
        }
    }
}

/// A token: its kind, the text it came from, and the line it starts on.
#[derive(Clone, Copy, Debug)]
pub struct Token<'src> {
    pub kind: TokenKind,
    pub lexeme: &'src str,
    pub line: usize,
}

impl<'src> Token<'src> {
    /// A token the compiler makes up, such as `self` or `super`.
    pub fn synthetic(lexeme: &'src str, line: usize) -> Self {
        Token { kind: TokenKind::Identifier, lexeme, line }
    }

    /// How an error message names the token: `'}'`, `a string`, `end of file`.
    pub fn describe(&self) -> String {
        match self.kind {
            TokenKind::Eof => "end of file".to_string(),
            TokenKind::String => "a string".to_string(),
            _ => format!("'{}'", self.lexeme),
        }
    }
}

pub struct Scanner<'src> {
    source: &'src str,
    /// The source as bytes: every character that matters to Drip is ASCII.
    bytes: &'src [u8],
    start: usize,
    current: usize,
    line: usize,
    /// The line of the last non-blank character: where end of file is
    /// reported, rather than on the empty line after a final newline.
    last_line: usize,
}

impl<'src> Scanner<'src> {
    pub fn new(source: &'src str) -> Self {
        Scanner {
            source,
            bytes: source.as_bytes(),
            start: 0,
            current: 0,
            line: 1,
            last_line: 1,
        }
    }

    /// Scan and return the next token.
    pub fn scan_token(&mut self) -> Token<'src> {
        self.skip_whitespace();
        self.start = self.current;
        if self.at_end() {
            return self.make_at(TokenKind::Eof, self.last_line);
        }
        self.last_line = self.line;
        let c = self.advance();
        if is_alpha(c) {
            return self.identifier();
        }
        if c.is_ascii_digit() {
            return self.number();
        }
        use TokenKind as T;
        match c {
            b'(' => self.make(T::LeftParen),
            b')' => self.make(T::RightParen),
            b'{' => self.make(T::LeftBrace),
            b'}' => self.make(T::RightBrace),
            b'[' => self.make(T::LeftBracket),
            b']' => self.make(T::RightBracket),
            b',' => self.make(T::Comma),
            b';' => self.make(T::Semicolon),
            b'*' => self.make(T::Star),
            b'/' => self.make(T::Slash),
            b'%' => self.make(T::Percent),
            b'.' => self.make_if(b'.', T::DotDot, T::Dot),
            b'+' => self.make_if(b'=', T::PlusEqual, T::Plus),
            b'-' => self.make_if(b'=', T::MinusEqual, T::Minus),
            b'!' => self.make_if(b'=', T::BangEqual, T::Bang),
            b'=' => self.make_if(b'=', T::EqualEqual, T::Equal),
            b'<' => self.make_if(b'=', T::LessEqual, T::Less),
            b'>' => self.make_if(b'=', T::GreaterEqual, T::Greater),
            b'&' if self.peek() == b'&' => {
                self.current += 1;
                self.make(T::AndAnd)
            }
            b'|' if self.peek() == b'|' => {
                self.current += 1;
                self.make(T::OrOr)
            }
            b'"' => self.string(),
            _ => {
                // Take the whole UTF-8 character, so the error names it and
                // the next token starts on a character boundary.
                while is_continuation(self.peek()) {
                    self.current += 1;
                }
                self.make(T::Error(ScanError::UnexpectedCharacter))
            }
        }
    }

    fn at_end(&self) -> bool {
        self.current >= self.bytes.len()
    }

    fn advance(&mut self) -> u8 {
        self.current += 1;
        self.bytes[self.current - 1]
    }

    /// The next byte, or NUL at the end of the source.
    fn peek(&self) -> u8 {
        self.bytes.get(self.current).copied().unwrap_or(b'\0')
    }

    fn peek_next(&self) -> u8 {
        self.bytes.get(self.current + 1).copied().unwrap_or(b'\0')
    }

    fn make(&self, kind: TokenKind) -> Token<'src> {
        self.make_at(kind, self.line)
    }

    fn make_at(&self, kind: TokenKind, line: usize) -> Token<'src> {
        Token { kind, lexeme: &self.source[self.start..self.current], line }
    }

    /// For two-character tokens: the long form if `next` follows.
    fn make_if(&mut self, next: u8, long: TokenKind, short: TokenKind) -> Token<'src> {
        if self.peek() == next {
            self.current += 1;
            self.make(long)
        } else {
            self.make(short)
        }
    }

    fn skip_whitespace(&mut self) {
        loop {
            match self.peek() {
                b' ' | b'\r' | b'\t' => self.current += 1,
                b'\n' => {
                    self.line += 1;
                    self.current += 1;
                }
                b'#' => {
                    // A comment runs to the end of the line.
                    self.last_line = self.line;
                    while self.peek() != b'\n' && !self.at_end() {
                        self.current += 1;
                    }
                }
                _ => return,
            }
        }
    }

    fn identifier(&mut self) -> Token<'src> {
        while is_alpha(self.peek()) || self.peek().is_ascii_digit() {
            self.current += 1;
        }
        let text = &self.source[self.start..self.current];
        self.make(keyword(text).unwrap_or(TokenKind::Identifier))
    }

    fn number(&mut self) -> Token<'src> {
        while self.peek().is_ascii_digit() {
            self.current += 1;
        }
        // A fractional part needs a digit after the dot: `1.` is `1` `.`.
        if self.peek() == b'.' && self.peek_next().is_ascii_digit() {
            self.current += 1;
            while self.peek().is_ascii_digit() {
                self.current += 1;
            }
        }
        self.make(TokenKind::Number)
    }

    /// A string literal. Its lexeme keeps the quotes and the escapes as
    /// written; [`unescape`] decodes them.
    fn string(&mut self) -> Token<'src> {
        let start_line = self.line;
        // The first unknown escape: where its letter is, and its line.
        let mut bad_escape: Option<(usize, usize)> = None;
        while self.peek() != b'"' && !self.at_end() {
            let c = self.advance();
            if c == b'\n' {
                self.line += 1;
            }
            if c == b'\\' && !self.at_end() {
                let at = self.current;
                let e = self.advance();
                if e == b'\n' {
                    self.line += 1;
                }
                if !matches!(e, b'n' | b't' | b'"' | b'\\') && bad_escape.is_none() {
                    bad_escape = Some((at, self.line));
                }
                while is_continuation(self.peek()) {
                    self.current += 1;
                }
            }
        }
        self.last_line = self.line;
        if self.at_end() {
            return self
                .make_at(TokenKind::Error(ScanError::UnterminatedString), start_line);
        }
        self.current += 1; // the closing quote
        if let Some((at, line)) = bad_escape {
            let len = self.source[at..].chars().next().map_or(1, char::len_utf8);
            let lexeme = &self.source[at..at + len];
            return Token {
                kind: TokenKind::Error(ScanError::UnknownEscape),
                lexeme,
                line,
            };
        }
        self.make_at(TokenKind::String, start_line)
    }
}

/// A string literal's characters: the lexeme without its quotes, with its
/// escapes decoded. The scanner has already rejected unknown escapes.
pub fn unescape(lexeme: &str) -> String {
    let inner = &lexeme[1..lexeme.len() - 1];
    let mut out = String::with_capacity(inner.len());
    let mut chars = inner.chars();
    while let Some(c) = chars.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('t') => out.push('\t'),
            Some(other) => out.push(other), // `\"` and `\\`
            None => {}
        }
    }
    out
}

fn is_alpha(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_'
}

/// True for the second, third or fourth byte of a UTF-8 character.
fn is_continuation(c: u8) -> bool {
    c & 0b1100_0000 == 0b1000_0000
}

/// Drip's reserved words.
fn keyword(text: &str) -> Option<TokenKind> {
    use TokenKind as T;
    Some(match text {
        "break" => T::Break,
        "class" => T::Class,
        "continue" => T::Continue,
        "else" => T::Else,
        "extends" => T::Extends,
        "false" => T::False,
        "fn" => T::Fn,
        "for" => T::For,
        "if" => T::If,
        "in" => T::In,
        "init" => T::Init,
        "let" => T::Let,
        "new" => T::New,
        "none" => T::None,
        "print" => T::Print,
        "return" => T::Return,
        "self" => T::SelfKw,
        "super" => T::Super,
        "true" => T::True,
        "while" => T::While,
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kinds(source: &str) -> Vec<TokenKind> {
        let mut scanner = Scanner::new(source);
        let mut out = Vec::new();
        loop {
            let t = scanner.scan_token();
            out.push(t.kind);
            if t.kind == TokenKind::Eof {
                return out;
            }
        }
    }

    #[test]
    fn scans_keywords_numbers_and_operators() {
        use TokenKind as T;
        assert_eq!(
            kinds("let x = 1.5 >= fn_name; # comment"),
            [T::Let, T::Identifier, T::Equal, T::Number, T::GreaterEqual]
                .into_iter()
                .chain([T::Identifier, T::Semicolon, T::Eof])
                .collect::<Vec<_>>()
        );
        assert_eq!(
            kinds("0..3 x += [1] && y || z % 2"),
            [T::Number, T::DotDot, T::Number, T::Identifier, T::PlusEqual]
                .into_iter()
                .chain([
                    T::LeftBracket,
                    T::Number,
                    T::RightBracket,
                    T::AndAnd,
                    T::Identifier
                ])
                .chain([T::OrOr, T::Identifier, T::Percent, T::Number, T::Eof])
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn reports_errors_as_tokens() {
        let mut scanner = Scanner::new("\"open\n");
        let t = scanner.scan_token();
        assert_eq!(t.kind, TokenKind::Error(ScanError::UnterminatedString));
        assert_eq!(t.line, 1);
        let mut scanner = Scanner::new("é");
        let t = scanner.scan_token();
        assert_eq!(
            ScanError::UnexpectedCharacter.message(t.lexeme),
            "unexpected character 'é'"
        );
        assert_eq!(scanner.scan_token().kind, TokenKind::Eof);
        let mut scanner = Scanner::new("\"a\nb\\q\"");
        let t = scanner.scan_token();
        assert_eq!(t.line, 2);
        assert_eq!(
            ScanError::UnknownEscape.message(t.lexeme),
            "unknown escape '\\q' in a string"
        );
    }

    #[test]
    fn decodes_escapes() {
        assert_eq!(unescape(r#""a\nb\t\"\\""#), "a\nb\t\"\\");
    }
}
