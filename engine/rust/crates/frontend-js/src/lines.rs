//! Line numbers, counted the way acorn counts them.
//!
//! oxc reports spans as UTF-8 byte offsets and no line numbers, so the
//! plugin computes lines itself. Line breaks are `\r\n`, `\r`, `\n`, U+2028
//! and U+2029, as in ECMAScript (and acorn).

/// Maps byte offsets to 1-based line numbers.
#[derive(Clone, Debug)]
pub struct LineIndex {
    /// Byte offset of the start of every line.
    starts: Vec<u32>,
}

impl LineIndex {
    pub fn new(source: &str) -> Self {
        let mut starts = vec![0];
        let bytes = source.as_bytes();
        for (i, c) in source.char_indices() {
            let next = i + c.len_utf8();
            match c {
                '\n' => starts.push(next as u32),
                '\r' if bytes.get(next) != Some(&b'\n') => starts.push(next as u32),
                '\u{2028}' | '\u{2029}' => starts.push(next as u32),
                _ => {}
            }
        }
        LineIndex { starts }
    }

    /// The 1-based line containing byte `offset`.
    pub fn line(&self, offset: u32) -> u32 {
        self.starts.partition_point(|&s| s <= offset) as u32
    }

    /// acorn's position of byte `offset` in `source` (the text this index
    /// was built from): the 1-based line, and the 0-based column in UTF-16
    /// code units. An offset past the end, or inside a character, is moved
    /// back to the nearest character boundary.
    pub fn line_column(&self, source: &str, offset: u32) -> (u32, u32) {
        let mut at = (offset as usize).min(source.len());
        while !source.is_char_boundary(at) {
            at -= 1;
        }
        let line = self.line(at as u32);
        let start = self.starts[line as usize - 1] as usize;
        (line, source[start..at].encode_utf16().count() as u32)
    }
}

/// The lines of `source`, split at every ECMAScript line break (acorn's
/// `/\r\n?|\n|\u2028|\u2029/`), so `split_lines(s)[n - 1]` is line `n`.
pub fn split_lines(source: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut start = 0;
    let bytes = source.as_bytes();
    for (i, c) in source.char_indices() {
        let next = match c {
            '\r' if bytes.get(i + 1) == Some(&b'\n') => continue, // the '\n' ends the line
            '\n' | '\r' | '\u{2028}' | '\u{2029}' => i + c.len_utf8(),
            _ => continue,
        };
        let end = if c == '\n' && i > 0 && bytes[i - 1] == b'\r' { i - 1 } else { i };
        out.push(&source[start..end]);
        start = next;
    }
    out.push(&source[start..]);
    out
}

/// The UTF-16 offset (what JavaScript's `String.prototype.slice` counts)
/// of byte `offset` in `source`. Useful when handing spans to JavaScript
/// tools; the plugin itself slices by bytes.
pub fn utf16_offset(source: &str, offset: usize) -> usize {
    source[..offset].encode_utf16().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_all_line_terminators() {
        let src = "a\nb\r\nc\rd\u{2028}e";
        let idx = LineIndex::new(src);
        assert_eq!(idx.line(0), 1);
        assert_eq!(idx.line(2), 2);
        assert_eq!(idx.line(5), 3);
        assert_eq!(idx.line(7), 4);
        assert_eq!(idx.line(src.len() as u32 - 1), 5);
    }

    #[test]
    fn splits_at_the_same_breaks_it_counts() {
        let src = "a\nb\r\nc\rd\u{2028}e";
        assert_eq!(split_lines(src), vec!["a", "b", "c", "d", "e"]);
        assert_eq!(split_lines("x\n"), vec!["x", ""]);
        // Line n of the index is element n - 1 of the split.
        let idx = LineIndex::new(src);
        let lines = split_lines(src);
        for (offset, c) in src.char_indices().filter(|(_, c)| c.is_ascii_alphabetic()) {
            assert_eq!(lines[idx.line(offset as u32) as usize - 1], c.to_string());
        }
    }

    #[test]
    fn line_columns_count_utf16_units_from_the_line_start() {
        let src = "a\r\nb\u{2028}é😀x\ry";
        let idx = LineIndex::new(src);
        assert_eq!(idx.line_column(src, 0), (1, 0));
        assert_eq!(idx.line_column(src, src.find('b').unwrap() as u32), (2, 0));
        assert_eq!(idx.line_column(src, src.find('x').unwrap() as u32), (3, 3));
        assert_eq!(idx.line_column(src, src.find('y').unwrap() as u32), (4, 0));
        assert_eq!(idx.line_column(src, src.len() as u32 + 5), (4, 1));
    }

    #[test]
    fn utf16_offsets() {
        let src = "é😀x";
        assert_eq!(utf16_offset(src, src.find('x').unwrap()), 3);
    }
}
