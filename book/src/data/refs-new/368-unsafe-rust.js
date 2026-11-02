// New references for chapter 135 (Unsafe Rust) and its staged second half
// (318-b, "Raw pointers"). Checked 2026-11-02 by reading the raw sources on
// raw.githubusercontent.com. Every rustc and Miri message quoted in the
// chapters is real output of rustc 1.97.0 (stable) or Miri on nightly
// 1.101.0 (2026-11-01), run while writing them.
export default [
  {
    id: 'nomicon-working-with-unsafe',
    authors: ['The Rust Project Developers'],
    title: 'The Rustonomicon: Working with Unsafe',
    venue: 'doc.rust-lang.org/nomicon',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/nomicon/working-with-unsafe.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/nomicon/master/src/working-with-unsafe.md on 2026-11-02: a function that checks `idx < arr.len()` and then calls `get_unchecked` is “safe and correct”, and a correct unsafely implemented function is called sound (safe code cannot cause Undefined Behavior through it); changing the `<` to `<=` makes it unsound although only safe code changed, so safety is non-local: the soundness of unsafe operations depends on state established by safe code; privacy (module boundaries) is what lets unsafe code rely on such state.',
    shaped: 'Chapter 135: soundness, and why a safe wrapper’s own check matters as much as its unsafe block.',
  },
  {
    id: 'miri-readme',
    authors: ['The Miri contributors'],
    title: 'Miri: an Undefined Behavior detection tool for Rust (README)',
    venue: 'github.com/rust-lang/miri',
    year: null,
    doi: null,
    url: 'https://github.com/rust-lang/miri',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/miri/master/README.md on 2026-11-02: “Miri is an Undefined Behavior detection tool for Rust. It can run binaries and test suites of cargo projects and detect unsafe code that fails to uphold its safety requirements”, listing out-of-bounds memory accesses and use-after-free, invalid use of uninitialized data, and violations of alignment and of aliasing rules (Stacked Borrows, or Tree Borrows as an option) among what it detects; it only detects UB in the executions it runs. Installed with `rustup +nightly component add miri` and run with `cargo +nightly miri run` / `cargo +nightly miri test` (both used for the chapters).',
    shaped: 'Chapters 135 and 135-b: what Miri is, and the Miri reports quoted for out-of-bounds, null, misaligned and dangling reads.',
  },
];
