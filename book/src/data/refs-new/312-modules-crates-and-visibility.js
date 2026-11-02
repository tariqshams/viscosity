// New references for chapter 312 (modules) and its staged second half
// (312-b, "Privacy, pub and workspaces"). Checked 2026-11-02 by reading the
// raw sources from github.com/rust-lang/book (main) and
// github.com/rust-lang/cargo (master, src/doc). Every rustc and cargo
// message in the chapters is real output of rustc/cargo 1.97.0.
export default [
  {
    id: 'rust-book-modules',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 7: Packages, Crates, and Modules',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch07-01 to ch07-05 on 2026-11-02: the crate root is the source file the compiler starts from (src/main.rs for a binary crate, src/lib.rs for a library); a module declared with mod garden; is looked for inline, in src/garden.rs, or in src/garden/mod.rs; code within a module is private from its parent modules by default, and pub makes it public; an absolute path starts from the crate root with crate, a relative path starts from the current module with self, super or an identifier; super goes to the parent module, like .. in a file system; “use only creates the shortcut for the particular scope in which the use occurs”; the as keyword renames; pub use re-exports a name so outside code can use the new path; the glob operator * brings all public items into scope and is often used in tests; making a struct pub leaves its fields private unless each is marked pub, while all variants of a pub enum are public; items in a parent module cannot use the private items inside child modules, but items in child modules can use the items in their ancestor modules.',
    shaped: 'Chapters 312 and 312-b: the module tree, paths, use, and privacy.',
  },
  {
    id: 'rust-book-workspaces',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 14.3: Cargo Workspaces',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch14-03-cargo-workspaces.md on 2026-11-02: “A workspace is a set of packages that share the same Cargo.lock and output directory”; the top-level Cargo.toml has a [workspace] section listing members; the workspace has one target directory at the top level, so crates do not rebuild each other; one Cargo.lock at the top level ensures all crates use the same version of every dependency; path dependencies connect members; cargo run -p and cargo test -p choose a package. The cyclic-dependency error and the dev-dependency escape were reproduced with cargo 1.97.0 in a two-member scratch workspace.',
    shaped: 'Chapter 312-b: what a workspace is and what its members share.',
  },
];
