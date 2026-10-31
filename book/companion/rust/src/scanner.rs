//! The scanner (book chapter 48, and the Rust port in Part X).
//!
//! Like clox's, this scanner works on demand: the compiler asks for one
//! token at a time, and nothing is stored up front. A token borrows its
//! lexeme straight out of the source text, so scanning never allocates.
//! Errors come back as `Error` tokens whose lexeme is the message.

/// Every kind of token Drip has.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenKind {
    // Single-character tokens.
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    Comma,
    Dot,
    Minus,
    Plus,
    Semicolon,
    Slash,
    Star,
    // One or two character tokens.
    Bang,
    BangEqual,
    Equal,
    EqualEqual,
    Greater,
    GreaterEqual,
    Less,
    LessEqual,
    // Literals.
    Identifier,
    String,
    Number,
    // Keywords.
    And,
    Class,
    Else,
    False,
    Fn,
    For,
    If,
    Let,
    Nil,
    Or,
    Print,
    Return,
    Super,
    This,
    True,
    While,
    // Bookkeeping.
    Error,
    Eof,
}

/// A token: its kind, the text it came from, and the line it ended on.
#[derive(Clone, Copy, Debug)]
pub struct Token<'src> {
    pub kind: TokenKind,
    pub lexeme: &'src str,
    pub line: usize,
}

impl<'src> Token<'src> {
    /// A token the compiler makes up, such as `this` or `super`.
    pub fn synthetic(lexeme: &'src str, line: usize) -> Self {
        Token { kind: TokenKind::Identifier, lexeme, line }
    }
}

pub struct Scanner<'src> {
    source: &'src str,
    /// The source as bytes: every character that matters to Drip is ASCII.
    bytes: &'src [u8],
    start: usize,
    current: usize,
    line: usize,
}

impl<'src> Scanner<'src> {
    pub fn new(source: &'src str) -> Self {
        Scanner { source, bytes: source.as_bytes(), start: 0, current: 0, line: 1 }
    }

    /// Scan and return the next token.
    pub fn scan_token(&mut self) -> Token<'src> {
        self.skip_whitespace();
        self.start = self.current;
        if self.at_end() {
            return self.make(TokenKind::Eof);
        }
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
            b';' => self.make(T::Semicolon),
            b',' => self.make(T::Comma),
            b'.' => self.make(T::Dot),
            b'-' => self.make(T::Minus),
            b'+' => self.make(T::Plus),
            b'/' => self.make(T::Slash),
            b'*' => self.make(T::Star),
            b'!' => self.make_if_equal(T::BangEqual, T::Bang),
            b'=' => self.make_if_equal(T::EqualEqual, T::Equal),
            b'<' => self.make_if_equal(T::LessEqual, T::Less),
            b'>' => self.make_if_equal(T::GreaterEqual, T::Greater),
            b'"' => self.string(),
            _ => {
                // Skip the rest of a multi-byte UTF-8 character, so the
                // next token starts on a character boundary.
                while is_continuation(self.peek()) {
                    self.current += 1;
                }
                self.error("Unexpected character.")
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
        Token { kind, lexeme: &self.source[self.start..self.current], line: self.line }
    }

    /// For `!=`, `==`, `<=` and `>=`: the long form if `=` follows.
    fn make_if_equal(&mut self, long: TokenKind, short: TokenKind) -> Token<'src> {
        if self.peek() == b'=' {
            self.current += 1;
            self.make(long)
        } else {
            self.make(short)
        }
    }

    fn error(&self, message: &'static str) -> Token<'src> {
        Token { kind: TokenKind::Error, lexeme: message, line: self.line }
    }

    fn skip_whitespace(&mut self) {
        loop {
            match self.peek() {
                b' ' | b'\r' | b'\t' => self.current += 1,
                b'\n' => {
                    self.line += 1;
                    self.current += 1;
                }
                b'/' if self.peek_next() == b'/' => {
                    // A comment runs to the end of the line.
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

    fn string(&mut self) -> Token<'src> {
        while self.peek() != b'"' && !self.at_end() {
            if self.peek() == b'\n' {
                self.line += 1;
            }
            self.current += 1;
        }
        if self.at_end() {
            return self.error("Unterminated string.");
        }
        self.current += 1; // the closing quote
        self.make(TokenKind::String)
    }
}

fn is_alpha(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_'
}

/// True for the second, third or fourth byte of a UTF-8 character.
fn is_continuation(c: u8) -> bool {
    c & 0b1100_0000 == 0b1000_0000
}

/// Drip's reserved words. A `match` on the text compiles to much the same
/// thing as clox's hand-written trie.
fn keyword(text: &str) -> Option<TokenKind> {
    use TokenKind as T;
    Some(match text {
        "and" => T::And,
        "class" => T::Class,
        "else" => T::Else,
        "false" => T::False,
        "fn" => T::Fn,
        "for" => T::For,
        "if" => T::If,
        "let" => T::Let,
        "nil" => T::Nil,
        "or" => T::Or,
        "print" => T::Print,
        "return" => T::Return,
        "super" => T::Super,
        "this" => T::This,
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
            kinds("let x = 1.5 >= fn_name; // comment"),
            [T::Let, T::Identifier, T::Equal, T::Number, T::GreaterEqual]
                .into_iter()
                .chain([T::Identifier, T::Semicolon, T::Eof])
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn reports_errors_as_tokens() {
        let mut scanner = Scanner::new("\"open\n");
        let t = scanner.scan_token();
        assert_eq!(t.kind, TokenKind::Error);
        assert_eq!(t.lexeme, "Unterminated string.");
        assert_eq!(t.line, 2);
        let mut scanner = Scanner::new("é");
        assert_eq!(scanner.scan_token().lexeme, "Unexpected character.");
        assert_eq!(scanner.scan_token().kind, TokenKind::Eof);
    }
}
