// New references for chapter 303 (Trait objects and dispatch). Checked
// 2026-11-02 by reading the raw source of the Rust book from
// github.com/rust-lang/book (main). The listings and rustc messages in the
// chapter are real output of rustc 1.97.0 on this machine.
export default [
  {
    id: 'rust-book-trait-objects',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 18.2: Using Trait Objects to Abstract over Shared Behavior',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch18-02-trait-objects.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch18-02-trait-objects.md on 2026-11-02: an enum is a good solution when the interchangeable items are a fixed set of types known at compile time, and trait objects let library users extend the set; the code that results from monomorphization does static dispatch, while trait objects use dynamic dispatch, where at run time Rust uses the pointers inside the trait object to know which method to call; “This lookup incurs a runtime cost that doesn’t occur with static dispatch. Dynamic dispatch also prevents the compiler from choosing to inline a method’s code, which in turn prevents some optimizations”; the rules for where dynamic dispatch can be used are called dyn compatibility and are in the Reference.',
    shaped: 'Chapter 303: the cost of dynamic dispatch (lost inlining) and enums for closed sets of types.',
  },
];
