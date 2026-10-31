//! Tokenizing Python (book chapter 114). Python's blocks are made of
//! indentation, so the tokenizer turns changes in indentation into INDENT
//! and DEDENT tokens, and line ends into NEWLINE tokens, except inside
//! brackets, where lines join implicitly.
//!
//! Port of `tokens.ts`. Offsets are UTF-8 byte offsets; every character the
//! tokenizer looks at is ASCII, so they slice the source exactly as the
//! reference's UTF-16 offsets do.

use std::fmt;

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum TokType {
    Name,
    Num,
    Str,
    Op,
    Newline,
    Indent,
    Dedent,
    Eof,
}

#[derive(Clone, PartialEq, Debug)]
pub struct Tok {
    pub ty: TokType,
    pub value: String,
    pub start: u32,
    pub end: u32,
    pub line: u32,
    pub is_float: bool,
    pub fstring: bool,
}

/// Source outside the supported Python subset (the reference's
/// `PySyntaxError`). The plugin catches it and leaves the file unchanged.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct PySyntaxError(pub String);

impl fmt::Display for PySyntaxError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for PySyntaxError {}

/// Operators, longest first where it matters (the first match wins).
const OPS: &[&str] = &[
    "**=", "//=", ">>=", "<<=", "...", "->", "**", "//", "==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "&=",
    "|=", "^=", ":=", "(", ")", "[", "]", "{", "}", ",", ":", ".", ";", "@", "=", "+", "-", "*", "/", "%", "<", ">",
    "&", "|", "^", "~",
];

fn is_prefix(c: u8) -> bool {
    matches!(c, b'r' | b'R' | b'b' | b'B' | b'f' | b'F' | b'u' | b'U')
}

fn is_word(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_'
}

pub fn tokenize(src: &str) -> Result<Vec<Tok>, PySyntaxError> {
    let s = src.as_bytes();
    let len = s.len();
    // `src.charAt(k)`: past the end there is no character (0 matches none
    // of the classes below).
    let at = |k: usize| -> u8 { s.get(k).copied().unwrap_or(0) };
    let mut toks: Vec<Tok> = Vec::new();
    let mut indents: Vec<u32> = vec![0];
    let mut i = 0usize;
    let mut line = 1u32;
    let mut depth = 0i64;
    let mut at_line_start = true;
    let err = |m: &str, line: u32| PySyntaxError(format!("{m} (line {line})"));
    let push = |toks: &mut Vec<Tok>, ty: TokType, value: &str, start: usize, end: usize, line: u32| {
        toks.push(Tok {
            ty,
            value: value.to_string(),
            start: start as u32,
            end: end as u32,
            line,
            is_float: false,
            fstring: false,
        });
    };
    while i < len {
        if at_line_start && depth == 0 {
            // Measure indentation; skip blank and comment-only lines.
            let mut col = 0u32;
            let mut j = i;
            while j < len && (s[j] == b' ' || s[j] == b'\t') {
                col += if s[j] == b'\t' { 8 - (col % 8) } else { 1 };
                j += 1;
            }
            if j >= len || s[j] == b'\n' || s[j] == b'#' || s[j] == b'\r' {
                while j < len && s[j] != b'\n' {
                    j += 1;
                }
                i = j + 1;
                line += 1;
                continue;
            }
            i = j;
            at_line_start = false;
            let top = *indents.last().expect("non-empty");
            if col > top {
                indents.push(col);
                push(&mut toks, TokType::Indent, "", i, i, line);
            } else {
                while col < *indents.last().expect("non-empty") {
                    indents.pop();
                    push(&mut toks, TokType::Dedent, "", i, i, line);
                }
                if col != *indents.last().expect("non-empty") {
                    return Err(err("inconsistent indentation", line));
                }
            }
        }
        let c = s[i];
        if c == b'\n' {
            if depth == 0 {
                push(&mut toks, TokType::Newline, "", i, i, line);
            }
            line += 1;
            i += 1;
            if depth == 0 {
                at_line_start = true; // inside brackets, a newline is just whitespace
            }
            continue;
        }
        if c == b' ' || c == b'\t' || c == b'\r' {
            i += 1;
            continue;
        }
        if c == b'#' {
            while i < len && s[i] != b'\n' {
                i += 1;
            }
            continue;
        }
        if c == b'\\' && at(i + 1) == b'\n' {
            i += 2;
            line += 1;
            continue;
        }
        let start = i;
        // Strings, with optional prefixes (f, r, b, rb, ...):
        // `/^([rRbBfFuU]{0,2})(['"])/`.
        let mut plen = 0;
        while plen < 2 && is_prefix(at(i + plen)) {
            plen += 1;
        }
        let quote = at(i + plen);
        if quote == b'\'' || quote == b'"' {
            let prefix = &s[i..i + plen];
            let is_f = prefix.iter().any(|&c| c == b'f' || c == b'F');
            let raw = prefix.iter().any(|&c| c == b'r' || c == b'R');
            i += plen;
            let triple = [quote; 3];
            let q: &[u8] = if s[i..].starts_with(&triple) { &triple } else { &triple[..1] };
            i += q.len();
            while i < len && !s[i..].starts_with(q) {
                if s[i] == b'\\' && !raw {
                    i += 1;
                } else if s[i] == b'\n' {
                    if q.len() == 1 {
                        return Err(err("unterminated string", line));
                    }
                    line += 1;
                }
                i += 1;
            }
            if i >= len {
                return Err(err("unterminated string", line));
            }
            i += q.len();
            toks.push(Tok {
                ty: TokType::Str,
                value: src[start..i].to_string(),
                start: start as u32,
                end: i as u32,
                line,
                is_float: false,
                fstring: is_f,
            });
            continue;
        }
        if c.is_ascii_digit() || (c == b'.' && at(i + 1).is_ascii_digit()) {
            let mut is_float = false;
            if c == b'0' && matches!(at(i + 1), b'x' | b'X' | b'o' | b'O' | b'b' | b'B') {
                i += 2;
                while at(i).is_ascii_hexdigit() || at(i) == b'_' {
                    i += 1;
                }
            } else {
                while at(i).is_ascii_digit() || at(i) == b'_' {
                    i += 1;
                }
                if at(i) == b'.' {
                    is_float = true;
                    i += 1;
                    while at(i).is_ascii_digit() || at(i) == b'_' {
                        i += 1;
                    }
                }
                if matches!(at(i), b'e' | b'E') {
                    is_float = true;
                    i += 1;
                    if matches!(at(i), b'+' | b'-') {
                        i += 1;
                    }
                    while at(i).is_ascii_digit() {
                        i += 1;
                    }
                }
                if matches!(at(i), b'j' | b'J') {
                    return Err(err("complex numbers are not supported", line));
                }
            }
            toks.push(Tok {
                ty: TokType::Num,
                value: src[start..i].to_string(),
                start: start as u32,
                end: i as u32,
                line,
                is_float,
                fstring: false,
            });
            continue;
        }
        if c.is_ascii_alphabetic() || c == b'_' {
            while i < len && is_word(s[i]) {
                i += 1;
            }
            push(&mut toks, TokType::Name, &src[start..i], start, i, line);
            continue;
        }
        let Some(op) = OPS.iter().find(|o| s[i..].starts_with(o.as_bytes())) else {
            let ch = src[i..].chars().next().unwrap_or('\u{fffd}');
            return Err(err(&format!("unexpected character '{ch}'"), line));
        };
        match *op {
            "(" | "[" | "{" => depth += 1,
            ")" | "]" | "}" => depth -= 1,
            _ => {}
        }
        i += op.len();
        push(&mut toks, TokType::Op, op, start, i, line);
    }
    if toks.last().is_some_and(|t| t.ty != TokType::Newline) {
        push(&mut toks, TokType::Newline, "", i, i, line);
    }
    while indents.len() > 1 {
        indents.pop();
        push(&mut toks, TokType::Dedent, "", i, i, line);
    }
    push(&mut toks, TokType::Eof, "", i, i, line);
    Ok(toks)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kinds(src: &str) -> Vec<TokType> {
        tokenize(src).expect("tokenizes").iter().map(|t| t.ty).collect()
    }

    #[test]
    fn indentation_becomes_indent_and_dedent() {
        use TokType::*;
        assert_eq!(
            kinds("if x:\n    y\nz\n"),
            vec![Name, Name, Op, Newline, Indent, Name, Newline, Dedent, Name, Newline, Eof]
        );
    }

    #[test]
    fn newlines_inside_brackets_join_lines() {
        use TokType::*;
        assert_eq!(kinds("f(a,\n  b)\n"), vec![Name, Op, Name, Op, Name, Op, Newline, Eof]);
    }

    #[test]
    fn numbers_at_the_end_of_the_source() {
        // A literal that ends the file is still an int, and a hex literal
        // there terminates (the reference used to read past the end).
        let t = tokenize("k = 1").expect("tokenizes");
        assert_eq!((t[2].value.as_str(), t[2].is_float, t[2].end), ("1", false, 5));
        let t = tokenize("k = 0x1F").expect("tokenizes");
        assert_eq!((t[2].value.as_str(), t[2].is_float), ("0x1F", false));
        assert!(tokenize("k = 1.5").expect("tokenizes")[2].is_float);
    }

    #[test]
    fn strings_and_prefixes() {
        let t = tokenize("x = rb'a\\' + f\"{y}\" + '''a\nb'''\n").expect("tokenizes");
        let strs: Vec<_> = t.iter().filter(|t| t.ty == TokType::Str).map(|t| (t.value.as_str(), t.fstring)).collect();
        assert_eq!(strs, vec![("rb'a\\'", false), ("f\"{y}\"", true), ("'''a\nb'''", false)]);
        assert!(tokenize("x = 'a\nb'").is_err());
        assert!(tokenize("x = 1j\n").is_err());
    }
}
