// New references for chapter 330b.
export default [
  {
    id: 'rustdoc-doctests',
    authors: ['The Rust Project Developers'],
    title: 'The rustdoc book: Documentation tests',
    venue: 'rust-lang/rust, src/doc/rustdoc/src/write-documentation/documentation-tests.md',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html',
    accessed: '2026-11-02',
    checkedAgainst: 'documentation-tests.md read raw from raw.githubusercontent.com/rust-lang/rust/master on 2026-11-02: code blocks in documentation are compiled and run as tests, and pass if they compile and do not panic; “Pre-processing examples”: common allow attributes are inserted, `extern crate <mycrate>;` is inserted unless present, and if the example does not contain fn main it is wrapped in `fn main() { your_code }`; “Hiding portions of the example”: lines that start with `# ` are hidden from the output but used when compiling. Behaviour checked with cargo 1.97.0.',
    shaped: 'Chapter 330b: how doc tests are built, hidden lines, and what passes.',
  },
  {
    id: 'clippy-readme',
    authors: ['The Clippy Developers'],
    title: 'Clippy: a collection of lints to catch common mistakes and improve your Rust code (README)',
    venue: 'rust-lang/rust-clippy',
    year: null,
    doi: null,
    url: 'https://github.com/rust-lang/rust-clippy',
    accessed: '2026-11-02',
    checkedAgainst: 'README.md read raw from raw.githubusercontent.com/rust-lang/rust-clippy/master on 2026-11-02: “There are over 800 lints included in this crate”; the category table (clippy::correctness deny; suspicious, style, complexity, perf warn; pedantic, restriction, nursery, cargo allow); “The restriction category should, emphatically, not be enabled as a whole”. Lint output checked with clippy 0.1.97.',
    shaped: 'Chapter 330b: what clippy is, its categories and their default levels.',
  },
];
