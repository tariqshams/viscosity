// New references for chapter 353 (Lifetimes) and its staged second half
// (310-b, "Lifetime annotations"). Checked 2026-11-02 by reading the raw
// source from github.com/rust-lang/book (main). Every rustc message in the
// chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-lifetimes',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 10.3: Validating References with Lifetimes',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch10-03-lifetime-syntax.md on 2026-11-02: “The main aim of lifetimes is to prevent dangling references”; the borrow checker compares scopes to decide whether all borrows are valid; “Lifetime annotations don’t change how long any of the references live”; in longest<\'a> the returned reference is valid for “the smaller of the lifetimes” of the inputs; a struct holding a reference needs a lifetime annotation on every reference in its definition; lifetimes on parameters are input lifetimes and on return values output lifetimes; the three elision rules (each reference parameter gets its own lifetime; one input lifetime is assigned to all outputs; with &self or &mut self, self’s lifetime is assigned to all outputs); string literals have the \'static lifetime, and a suggestion to use \'static usually comes from trying to make a dangling reference.',
    shaped: 'Chapters 353 and 353-b: what a lifetime is, annotations on functions and structs, elision and \'static.',
  },
];
