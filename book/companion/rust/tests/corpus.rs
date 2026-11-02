//! Every corpus program but the benchmarks, checked against the
//! expectations written in its comments.
//!
//! Freed heap slots are never reused here (`debug_gc`), so a missed root
//! panics instead of reading a stranger's object.

mod common;

use drip::Options;

fn main() {
    let options = Options { debug_gc: true, ..Options::default() };
    common::run_suite("corpus", |t| !common::is_benchmark(t), options);
}
