// New references for chapter 128 (Associated types and the standard
// traits) and its staged second half (324-b, Operator traits and derive).
// Checked 2026-11-02 by reading the raw sources: the Rust book from
// github.com/rust-lang/book (main) and the standard library from
// github.com/rust-lang/rust (main). Every rustc message quoted in the
// chapters is real output of rustc 1.97.0 on this machine.
export default [
  {
    id: 'rust-book-advanced-traits',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 20.2: Advanced Traits',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch20-02-advanced-traits.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch20-02-advanced-traits.md on 2026-11-02: associated types connect a type placeholder with a trait so that method signatures can use it, and the implementor specifies the concrete type; Iterator’s associated type Item stands for the type of the values iterated over; with a generic parameter (a hypothetical Iterator<T>) a trait can be implemented for a type multiple times and each use of next would need annotations, while with an associated type “we can’t implement a trait on a type multiple times”; default generic type parameters (<PlaceholderType=ConcreteType>) and operator overloading, where Rust does not allow creating new operators or overloading arbitrary ones but the operations in std::ops can be overloaded by implementing their traits; Add has Rhs=Self and an associated type Output.',
    shaped: 'Chapter 128: why Iterator uses an associated type; chapter 128-b: Add’s Rhs default and Output.',
  },
  {
    id: 'rust-std-fmt',
    authors: ['The Rust Project Developers'],
    title: 'Traits std::fmt::Display and std::fmt::Debug (Rust standard library documentation)',
    venue: 'Rust standard library API documentation; source in library/core/src/fmt/mod.rs of github.com/rust-lang/rust',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/fmt/trait.Display.html',
    accessed: '2026-11-02',
    checkedAgainst: 'library/core/src/fmt/mod.rs on the main branch of github.com/rust-lang/rust, read raw on 2026-11-02: Display is the “Format trait for an empty format, {}”; implementing it automatically implements ToString, allowing .to_string(); “Display is for user-facing output, and so cannot be derived”. Debug is “? formatting”, for a programmer-facing, debugging context; it “can be used with #[derive] if all fields implement Debug”, and the derived form prints the struct name, then {, then each field’s name and Debug value separated by commas, then }.',
    shaped: 'Chapters 128 and 128-b: what Display and Debug unlock, and why only Debug can be derived.',
  },
  {
    id: 'rust-std-default',
    authors: ['The Rust Project Developers'],
    title: 'Trait std::default::Default (Rust standard library documentation)',
    venue: 'Rust standard library API documentation; source in library/core/src/default.rs of github.com/rust-lang/rust',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/default/trait.Default.html',
    accessed: '2026-11-02',
    checkedAgainst: 'library/core/src/default.rs on the main branch of github.com/rust-lang/rust, read raw on 2026-11-02: “A trait for giving a type a useful default value”, useful for structs that define a set of options; struct update syntax with ..Default::default() fills the remaining fields; “This trait can be used with #[derive] if all of the type’s fields implement Default”, using each field type’s default; deriving it on an enum needs a #[default] unit variant.',
    shaped: 'Chapters 128 and 128-b: Default, ..Default::default() and deriving it.',
  },
  {
    id: 'rust-book-derivable-traits',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, Appendix C: Derivable Traits',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/appendix-03-derivable-traits.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/appendix-03-derivable-traits.md on 2026-11-02: the derive attribute generates code implementing a trait with its own default implementation on the annotated struct or enum; the standard library traits usable with derive are Debug, PartialEq and Eq, PartialOrd and Ord, Clone and Copy, Hash and Default; Display cannot be derived because the compiler cannot know how to show a type to end users; deriving PartialEq on structs compares field by field, equal only if all fields are equal; derived PartialOrd on structs compares fields in the order they appear in the struct definition; Debug is required by assert_eq!; libraries can implement derive for their own traits with procedural macros.',
    shaped: 'Chapter 128-b: what #[derive] writes and which traits it can write.',
  },
  {
    id: 'rust-std-clone',
    authors: ['The Rust Project Developers'],
    title: 'Trait std::clone::Clone (Rust standard library documentation)',
    venue: 'Rust standard library API documentation; source in library/core/src/clone.rs of github.com/rust-lang/rust',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/std/clone/trait.Clone.html',
    accessed: '2026-11-02',
    checkedAgainst: 'library/core/src/clone.rs on the main branch of github.com/rust-lang/rust, read raw on 2026-11-02: Clone “can be used with #[derive] if all fields are Clone”, and the derived implementation calls clone on each field; “For a generic struct, #[derive] implements Clone conditionally by adding bound Clone on generic parameters”; for struct Generate<T>(fn() -> T), deriving Copy and Clone gives unnecessary T: Copy and T: Clone bounds, so such impls are written by hand (impl<T> Copy for Generate<T> {} and a clone that returns *self).',
    shaped: 'Chapter 128-b: the bounds derive adds on generic types, and why drip-rs writes Gc<T>’s impls by hand.',
  },
];
