// New references for chapter 359 (Testing in Rust) and its staged second
// half (313-b, "Assertions and test suites"). Checked 2026-11-02 by
// reading the raw sources from github.com/rust-lang/book (main). Every
// rustc and cargo output in the chapters is real output of rustc/cargo
// 1.97.0, run on book/companion/rust and on small programs.
export default [
  {
    id: 'rust-book-testing',
    authors: ['Steve Klabnik', 'Carol Nichols', 'Chris Krycho', 'and contributors'],
    title: 'The Rust Programming Language, chapter 11: Writing Automated Tests',
    venue: 'doc.rust-lang.org',
    year: null,
    doi: null,
    url: 'https://doc.rust-lang.org/book/ch11-00-testing.html',
    accessed: '2026-11-02',
    checkedAgainst: 'Read raw from raw.githubusercontent.com/rust-lang/book/main/src/ch11-01-writing-tests.md, ch11-02-running-tests.md and ch11-03-test-organization.md on 2026-11-02: a test is a function annotated with the test attribute; “Tests fail when something in the test function panics. Each test is run in a new thread, and when the main thread sees that a test thread has died, the test is marked as failed”; assert! panics when its argument is false; assert_eq! and assert_ne! print both values when they fail, so the values must implement PartialEq and Debug, usually with #[derive(PartialEq, Debug)]; custom failure messages are passed to format!; should_panic makes a test pass if the code panics, and expected checks that the message contains the given text; tests can return Result<(), String> and use ?; by default tests run in parallel using threads and output is captured; a name argument filters tests; #[cfg(test)] compiles and runs the test code only with cargo test; Rust’s privacy rules allow testing private functions; each file in tests/ is compiled as its own crate; shared helpers go in tests/common/mod.rs so they are not treated as a test file.',
    shaped: 'Chapters 359 and 359-b: unit and integration tests, the harness, and the assert macros.',
  },
];
