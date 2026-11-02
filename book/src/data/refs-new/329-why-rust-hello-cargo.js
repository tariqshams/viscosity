// New references for chapter 329 (Why Rust? Hello, cargo) and its staged
// second half (298-b, "Cargo, crates and packages"). Checked 2026-11-02 by
// reading the raw Markdown sources from github.com/rust-lang/book (main).
// Every cargo and rustc message quoted in the chapters is real output of
// cargo 1.97.0 and rustc 1.97.0 run in the writing session.
export default [
  {
    id: 'rust-book-hello-cargo',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 1.3: Hello, Cargo!',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch01-03-hello-cargo.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch01-03-hello-cargo.md on 2026-11-02: cargo new “has generated two files and one directory for us: a Cargo.toml file and a src directory with a main.rs file inside”, and “initialized a new Git repository along with a .gitignore file”; Cargo.toml is in TOML; cargo build “creates an executable file in target/debug/”; the first build makes Cargo.lock, which keeps track of the exact versions of dependencies; cargo run compiles and then runs; cargo check “quickly checks your code to make sure it compiles but doesn’t produce an executable” and “is much faster than cargo build”; cargo build --release compiles with optimizations into target/release. The output of cargo new, check, build, run and build --release was reproduced with cargo 1.97.0.',
    shaped: 'Chapter 329 and 329-b: what cargo new makes, and the everyday commands.',
  },
  {
    id: 'rust-book-packages-crates',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 7.1: Packages and Crates',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch07-01-packages-and-crates.md on 2026-11-02: “A crate is the smallest amount of code that the Rust compiler considers at a time”; a crate is a binary crate or a library crate; binary crates are programs you compile to an executable and must have a main function; library crates do not have a main function and do not compile to an executable; the crate root is the source file the compiler starts from; a package is a bundle of one or more crates with a Cargo.toml; “A package can contain as many binary crates as you like, but at most only one library crate.”',
    shaped: 'Chapter 329-b: crates, binary versus library, and packages, with drip-rs as the example.',
  },
];
