//! Every corpus program the VM is meant to run (all but `SKIP_VM`),
//! checked against the expectations written in its comments. The VM is
//! clox's twin, so `// [c line N]` expectations apply and
//! `// [java line N]` ones don't.
//!
//! Freed heap slots are never reused here (`debug_gc`), so a missed root
//! panics instead of reading a stranger's object.

mod common;

use drip::Options;

fn main() {
    let options = Options { debug_gc: true, ..Options::default() };
    common::run_suite("corpus", |t| !common::should_skip(t, common::SKIP_VM), options);
}
