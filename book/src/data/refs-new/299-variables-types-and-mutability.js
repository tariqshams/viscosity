// New references for chapter 299 (Variables, types and mutability) and its
// staged second half (299-b, "Rust's number types"). Checked 2026-11-02
// by reading the raw sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/reference (master). Every rustc message and every
// printed value in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-variables',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 3.1: Variables and Mutability',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch03-01-variables-and-mutability.md on 2026-11-02: variables are immutable by default; mut makes one mutable and “conveys intent to future readers”; constants use const, may never be mut, must have their type annotated, “can be declared in any scope, including the global scope”, may be set only to a constant expression, and are named in all uppercase with underscores by convention; shadowing with a second let “is different from marking a variable as mut”, because “we’re effectively creating a new variable when we use the let keyword again, we can change the type of the value but reuse the same name”, whereas assigning a value of another type to a mut variable is a compile-time error. E0384 and E0308 for those cases were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 299: let, let mut, shadowing and const.',
  },
  {
    id: 'rust-book-data-types',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 3.2: Data Types',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch03-02-data-types.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch03-02-data-types.md on 2026-11-02: the four scalar types are integers, floating-point numbers, Booleans and characters; the integer types i8 to i128, u8 to u128, isize and usize, whose size depends on the architecture; “Integer types default to i32”; “The default type is f64”; “Integer division truncates toward zero to the nearest integer”; in debug mode Rust includes checks that make an overflowing program panic, in release mode it performs two’s complement wrapping, and “Relying on integer overflow’s wrapping behavior is considered an error”; the wrapping_*, checked_*, overflowing_* and saturating_* method families; char literals use single quotes, and Rust’s char type “is four bytes in size and represents a Unicode scalar value”.',
    shaped: 'Chapter 299-b: Rust’s scalar types, their defaults, integer division and overflow.',
  },
  {
    id: 'rustref-int-overflow',
    authors: ['The Rust Reference contributors'],
    title: 'Behavior not considered unsafe: Integer overflow',
    venue: 'The Rust Reference (src/behavior-not-considered-unsafe.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/behavior-not-considered-unsafe.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/behavior-not-considered-unsafe.md on 2026-11-02: “If a program contains arithmetic overflow, the programmer has made an error”; when debug assertions are enabled (for example in a non-optimized build) “implementations must insert dynamic checks that panic on overflow. Other kinds of builds may result in panics or silently wrapped values on overflow, at the implementation’s discretion”; implicit wrapping must use two’s complement; i32::wrapping_add provides wrapping addition. The panic message “attempt to add with overflow” was reproduced with rustc 1.97.0.',
    shaped: 'Chapter 299-b: overflow is an error, checked in debug builds.',
  },
  {
    id: 'rustref-operator-expr',
    authors: ['The Rust Reference contributors'],
    title: 'Operator expressions (arithmetic, overflow and type casts)',
    venue: 'The Rust Reference (src/expressions/operator-expr.md)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/operator-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/operator-expr.md on 2026-11-02: “Integer operators will panic when they overflow when compiled in debug mode”; the remainder uses truncating division, so it has the sign of the dividend; casts with as: “Casting from a larger integer to a smaller integer (e.g. u32 -> u8) will truncate”, same-size casts are no-ops in two’s complement, and “Casting from a float to an integer will round the float towards zero”, with NaN giving 0 and out-of-range values saturating to the integer type’s maximum or minimum. The values printed in the chapter (3.9 as i32 is 3, 300 as u8 is 44, -1 as u8 is 255, 1e10 as i32 is 2147483647, NaN as i32 is 0) were reproduced with rustc 1.97.0.',
    shaped: 'Chapter 299-b: what as does to a number, and what integer division and remainder give.',
  },
];
