// New references for chapter 311 (closures) and its staged second half
// (311-b, "Iterators in Rust"). Checked 2026-11-02 by reading the raw
// sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/reference (master). Every rustc message and output
// in the chapters is real output of rustc 1.97.0.
export default [
  {
    id: 'rust-book-closures',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 13.1: Closures',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch13-01-closures.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch13-01-closures.md on 2026-11-02: closures are anonymous functions that can capture values from the scope in which they are defined; types of parameters and return value are usually inferred; “Closures can capture values from their environment in three ways, which directly map to the three ways a function can take a parameter: borrowing immutably, borrowing mutably, and taking ownership”, and the closure decides which based on what the body does; the move keyword forces the closure to take ownership, needed for example when the closure outlives the current scope; FnOnce applies to closures that can be called once, FnMut to closures that don’t move captured values out but may mutate them, Fn to closures that neither move nor mutate captured values; functions can implement all three Fn traits.',
    shaped: 'Chapter 311: closure syntax, capture modes, move, and the Fn traits.',
  },
  {
    id: 'rust-book-iterators',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 13.2: Processing a Series of Items with Iterators',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch13-02-iterators.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch13-02-iterators.md on 2026-11-02: “In Rust, iterators are lazy, meaning they have no effect until you call methods that consume the iterator to use it up”; the Iterator trait requires only the next method, which returns one item at a time wrapped in Some and None when iteration is over; type Item is an associated type; calling next needs a mutable iterator, and a for loop takes ownership of the iterator and makes it mutable behind the scenes; iter gives immutable references, into_iter owned values, iter_mut mutable references; methods that call next are consuming adapters (such as sum), methods that produce other iterators are iterator adapters (such as map), and the compiler warns that iterator adapters are lazy if the result is not consumed; collect gathers the results into a collection; closures passed to filter can capture their environment.',
    shaped: 'Chapter 311-b: the Iterator trait, adapters and consumers, laziness and for loops.',
  },
  {
    id: 'rustref-loop-expr',
    authors: ['The Rust Project Developers'],
    title: 'The Rust Reference: Loops and other breakable expressions',
    venue: 'The Rust Reference (rust-lang/reference on GitHub, rendered at doc.rust-lang.org/reference)',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/reference/expressions/loop-expr.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/reference/master/src/expressions/loop-expr.md on 2026-11-02: “A for expression is a syntactic construct for looping over elements provided by an implementation of std::iter::IntoIterator”; a for loop is equivalent to a loop containing a match: let result = match IntoIterator::into_iter(iter_expr) { mut iter => loop { match Iterator::next(&mut iter) { Option::Some(val) => next = val, Option::None => break } ... } }; IntoIterator, Iterator and Option are always the standard library items there.',
    shaped: 'Chapter 311-b: what a for loop expands to.',
  },
];
