// New references for chapter 120 (Slices and strings) and its staged
// second half (303-b, "String and &str"). Checked 2026-11-02 by reading
// the raw sources from github.com/rust-lang/book (main). Every rustc
// message and panic in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-slices',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 4.3: The Slice Type',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch04-03-slices.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch04-03-slices.md on 2026-11-02: slices let you reference a contiguous sequence of elements in a collection, and a slice is a kind of reference, so it does not have ownership; a slice stores a reference to the first element and a length; in [starting_index..ending_index] the ending index is one more than the last position, and either end may be dropped; “String slice range indices must occur at valid UTF-8 character boundaries”; the first_word example where s.clear() while a slice is alive is a compile error; string literals are slices: “The type of s here is &str: It’s a slice pointing to that specific point of the binary. This is also why string literals are immutable”; taking &str rather than &String as a parameter makes a function work on both, by deref coercion; array slices have type &[i32].',
    shaped: 'Chapters 120 and 120-b: slices of arrays and strings, and &str parameters.',
  },
  {
    id: 'rust-book-strings',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 8.2: Storing UTF-8 Encoded Text with Strings',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch08-02-strings.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch08-02-strings.md on 2026-11-02: the core language has one string type, the string slice str usually seen borrowed as &str; the String type “is a growable, mutable, owned, UTF-8 encoded string type”; to_string and String::from both make a String from a string literal; push_str appends a string slice; + takes ownership of its left String and borrows its right operand; “Rust strings don’t support indexing”, because a String is a wrapper over a Vec<u8> and one character can take more than one byte. E0277 (“the type `str` cannot be indexed by `{integer}`”) and E0369 (“cannot add `&str` to `&str`”) were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 120-b: String versus &str, building strings, and why strings are not indexed by number.',
  },
];
