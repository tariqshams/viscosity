// New references for chapter 309 (Generics and trait bounds) and its staged
// second half (309-b, "One copy per type: monomorphization"). Checked
// 2026-11-02 by reading the raw sources from github.com/rust-lang/book
// (main) and github.com/rust-lang/reference (master). Every rustc message
// and nm listing in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-generics',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 10.1: Generic Data Types',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch10-01-syntax.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch10-01-syntax.md on 2026-11-02: type parameters are declared in angle brackets after a function’s name and used in its signature; the largest<T> function fails with E0369 (“binary operation `>` cannot be applied to type `&T`”) until T is restricted to types implementing std::cmp::PartialOrd; generic structs, enums (Option<T>, Result<T, E>) and methods, with impl<T> Point<T> declaring T after impl; “using generic types won’t make your program run any slower than it would with concrete types”, because Rust performs monomorphization, “the process of turning generic code into specific code by filling in the concrete types that are used when compiled”, generating code for each concrete type the generic code is called with (the Option_i32 / Option_f64 illustration). E0369 and E0277 (“can’t compare `P` with `P`”) were reproduced with rustc 1.97.0.',
    shaped: 'Chapters 309 and 309-b: generic functions, types and impls, and monomorphization.',
  },
  {
    id: 'rustref-trait-bounds',
    authors: ['The Rust Reference contributors'],
    title: 'Trait and lifetime bounds',
    venue: 'The Rust Reference (src/trait-bounds.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/trait-bounds.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/trait-bounds.md on 2026-11-02: bounds “provide a way for generic items to restrict which types and lifetimes are used as their parameters”; they can be given in a where clause, and fn f<A: Copy>() {} is the same as fn f<A>() where A: Copy {}; several bounds are joined with +; “Bounds on an item must be satisfied when using the item”, and in the body of a generic function, given Ty: Trait, methods from Trait can be called on Ty values.',
    shaped: 'Chapter 309: the precise meaning of a trait bound, + and where.',
  },
];
