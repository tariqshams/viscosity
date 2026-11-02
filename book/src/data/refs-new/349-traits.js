// New references for chapter 349 (Traits) and its staged second half
// (308-b, "Trait objects and dyn"). Checked 2026-11-02 by reading the raw
// sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/reference (master). Every rustc message and printed
// size in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-traits',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 10.2: Defining Shared Behavior with Traits',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch10-02-traits.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch10-02-traits.md on 2026-11-02: a trait defines functionality a type has and can share with other types, similar to interfaces in other languages; a method signature ending in a semicolon must be implemented by each type, with impl Trait for Type; default implementations, which implementors may keep or override, and which can call other methods of the trait that have no default; the orphan rule (part of coherence): “we can’t implement external traits on external types”, e.g. Display on Vec<T>, while a local trait may be implemented on Vec<T>; traits as parameters with impl Trait, trait bound syntax <T: Summary>, + for several bounds, and where clauses. E0046 and E0277 (“the trait bound `Rb: Plugin` is not satisfied”) were reproduced with rustc 1.97.0.',
    shaped: 'Chapters 349 and 351: defining and implementing traits, default methods, the orphan rule, and trait bounds.',
  },
  {
    id: 'rustref-traits',
    authors: ['The Rust Reference contributors'],
    title: 'Traits',
    venue: 'The Rust Reference (src/items/traits.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/items/traits.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/items/traits.md on 2026-11-02: “A trait describes an abstract interface that types can implement”, made of associated functions, types and constants; all traits define an implicit type parameter Self; “Traits are implemented for specific types through separate implementations”; a trait function may omit its body with a semicolon, meaning implementations must define it, while a body “acts as a default for any implementation which does not override it”.',
    shaped: 'Chapter 349: the precise definition of a trait, required and default methods.',
  },
  {
    id: 'rust-book-trait-objects',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 18.2: Using Trait Objects to Abstract over Shared Behavior',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch18-02-trait-objects.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch18-02-trait-objects.md on 2026-11-02: a trait object points to both an instance of a type implementing a trait and a table used to look up that type’s trait methods at runtime; it is made by specifying a pointer such as & or Box<T>, then dyn, then the trait; a Vec<Box<dyn Draw>> can hold values of different types, unlike a generic type parameter, which can be substituted with only one concrete type at a time; static dispatch, where the compiler knows which method you are calling, versus dynamic dispatch, where “Rust uses the pointers inside the trait object to know which method to call”, which “incurs a runtime cost” and “prevents the compiler from choosing to inline a method’s code”; dyn compatibility. E0308 for a Vec of two different types and E0782 for a trait used as a type were reproduced with rustc 1.97.0, as were the sizes of &Js (8 bytes) and &dyn Plugin (16 bytes).',
    shaped: 'Chapter 349-b: trait objects, Vec<&dyn Trait> and Box<dyn Trait>, and dynamic dispatch.',
  },
];
