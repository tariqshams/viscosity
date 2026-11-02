// New references for chapter 341 (Structs and impl) and its staged second
// half (304-b, "Methods and self"). Checked 2026-11-02 by reading the raw
// sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/reference (master). Every rustc message and every
// printed value in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-structs',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 5.1: Defining and Instantiating Structs',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch05-01-defining-structs.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch05-01-defining-structs.md on 2026-11-02: a struct names each piece of data (field) and its type; an instance gives concrete values for each field; values are read and written with dot notation; “the entire instance must be mutable; Rust doesn’t allow us to mark only certain fields as mutable”; field init shorthand when a parameter has the same name as a field; struct update syntax, where “the ..user1 must come last” and “uses = like an assignment; this is because it moves the data”; tuple structs have “the added meaning the struct name provides but don’t have names associated with their fields”, and each struct is its own type; unit-like structs have no fields. E0063 (missing field), E0594 (assigning to a field of an immutable binding), E0382 (use after move) and E0599 (calling an associated function as a method) were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 341: defining, building and changing structs, and the three kinds of struct.',
  },
  {
    id: 'rust-book-methods',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 5.3: Methods',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch05-03-method-syntax.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch05-03-method-syntax.md on 2026-11-02: methods are defined in an impl block and their first parameter is always self; “The &self is actually short for self: &Self. Within an impl block, the type Self is an alias for the type that the impl block is for”; methods can take ownership of self, borrow self immutably, or borrow self mutably; taking ownership with just self is rare and “usually used when the method transforms self into something else and you want to prevent the caller from using the original instance after the transformation”; automatic referencing and dereferencing: “Rust automatically adds in &, &mut, or * so object matches the signature of the method”, so p1.distance(&p2) and (&p1).distance(&p2) are the same; “All functions defined within an impl block are called associated functions”, and those without self are not methods and are called with :: (often constructors named new, which “isn’t a special name”); each struct may have multiple impl blocks. E0596 and the E0382 note “takes ownership of the receiver `self`, which moves” were reproduced with rustc 1.97.0.',
    shaped: 'Chapters 341 and 341-b: impl blocks, associated functions, methods and the three self receivers.',
  },
  {
    id: 'rustref-method-call',
    authors: ['The Rust Reference contributors'],
    title: 'Method-call expressions',
    venue: 'The Rust Reference (src/expressions/method-call-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/method-call-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/method-call-expr.md on 2026-11-02: a method call is a dot, a path segment and arguments; when looking up a method call, “the receiver may be automatically dereferenced or borrowed in order to call a method”; the candidate receiver types are built by repeatedly dereferencing the receiver and, for each candidate T, adding &T and &mut T immediately after it.',
    shaped: 'Chapter 341-b: why p.step(1.0) borrows p mutably without an & at the call.',
  },
];
