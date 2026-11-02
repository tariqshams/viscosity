//! The garbage collector under stress: collect before every allocation,
//! and never reuse a freed slot. A missing root then shows up at once as
//! a "use after free" panic, or as wrong output.

mod common;

use drip::Options;

/// The folders that exercise the heap hardest, as in the TypeScript suite.
const FOLDERS: &[&str] = &[
    "closures",
    "classes",
    "inheritance",
    "strings",
    "functions",
    "lists",
    "methods",
    "fields",
    "for",
    "programs",
];

fn main() {
    let options = Options { stress_gc: true, ..Options::default() };
    let in_sample = |t: &str| FOLDERS.iter().any(|f| t.starts_with(&format!("{f}/")));
    common::run_suite("stress GC", in_sample, options);
}
