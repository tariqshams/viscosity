//! The corpus test runner, shared by `corpus.rs` and `stress_gc.rs`: a
//! port of `check()` in the TypeScript `test/corpus.ts`. A program says
//! what it should do in comments:
//!
//! - `# expect: <line>`: a line of output, in order;
//! - `# expect runtime error: <message>`: it stops with this error, and
//!   the innermost `at` line names the line the comment is on...
//! - `# expect trace: at line N in <place>`: ...unless these pin the
//!   whole stack trace;
//! - `# expect compile error: line N: <message>`: the exact list of
//!   compile errors, in order.
//!
//! The patterns are matched by hand, because this crate uses no
//! dependencies.

// Each test binary uses its own part of this module.
#![allow(dead_code)]

use std::path::{Path, PathBuf};

use drip::{Options, Outcome};

/// The corpus lives beside this crate, at `book/companion/corpus`.
pub fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../corpus")
}

/// Every `.drip` file in the corpus, as sorted paths relative to it.
pub fn list_tests() -> Vec<String> {
    fn walk(dir: &Path, root: &Path, out: &mut Vec<String>) {
        let mut entries: Vec<_> = std::fs::read_dir(dir)
            .expect("corpus directory")
            .map(|e| e.expect("directory entry").path())
            .collect();
        entries.sort();
        for path in entries {
            if path.is_dir() {
                walk(&path, root, out);
            } else if path.extension().is_some_and(|e| e == "drip") {
                let relative = path.strip_prefix(root).expect("inside the corpus");
                out.push(relative.to_string_lossy().replace('\\', "/"));
            }
        }
    }
    let root = corpus_dir();
    let mut out = Vec::new();
    walk(&root, &root, &mut out);
    out
}

/// The benchmarks are long-running: `scripts/bench.sh` runs them.
pub fn is_benchmark(test: &str) -> bool {
    test.starts_with("benchmark/")
}

/// What the program's comments say should happen.
#[derive(Default)]
struct Expectations {
    output: Vec<String>,
    compile_errors: Vec<String>,
    runtime_error: Option<(String, usize)>,
    trace: Vec<String>,
    exit_code: i32,
}

/// The rest of `line` after the first `marker`.
fn after<'a>(line: &'a str, marker: &str) -> Option<&'a str> {
    Some(&line[line.find(marker)? + marker.len()..])
}

fn parse_expectations(source: &str) -> Expectations {
    let mut e = Expectations::default();
    for (i, line) in source.split('\n').enumerate() {
        let line = line.strip_suffix('\r').unwrap_or(line);
        if let Some(text) = after(line, "# expect:") {
            e.output.push(text.strip_prefix(' ').unwrap_or(text).to_string());
        } else if let Some(message) = after(line, "# expect runtime error: ") {
            e.runtime_error = Some((message.to_string(), i + 1));
            e.exit_code = 70;
        } else if let Some(trace) = after(line, "# expect trace: ") {
            e.trace.push(trace.to_string());
        } else if let Some(error) = after(line, "# expect compile error: ") {
            e.compile_errors.push(error.to_string());
            e.exit_code = 65;
        }
    }
    e
}

/// Check one program's outcome. Returns the failures: an empty list
/// means the test passed.
pub fn check(source: &str, o: &Outcome) -> Vec<String> {
    let want = parse_expectations(source);
    let mut fails = Vec::new();
    if o.exit_code != want.exit_code {
        fails.push(format!("expected exit code {}, got {}", want.exit_code, o.exit_code));
    }
    if want.exit_code == 65 {
        if o.stderr != want.compile_errors {
            let (expected, got) = (want.compile_errors.join("\n"), o.stderr.join("\n"));
            fails.push(format!("compile errors:\nexpected:\n{expected}\ngot:\n{got}"));
        }
    } else if let Some((message, line)) = &want.runtime_error {
        let first = o.stderr.first().map(String::as_str);
        if first != Some(&format!("runtime error: {message}")) {
            fails.push(format!("expected \"runtime error: {message}\", got {first:?}"));
        }
        let trace = o.stderr.get(1..).unwrap_or_default();
        if !want.trace.is_empty() {
            let expected: Vec<String> =
                want.trace.iter().map(|t| format!("  {t}")).collect();
            if trace != expected.as_slice() {
                let (expected, got) = (expected.join("\n"), trace.join("\n"));
                fails.push(format!("stack trace:\nexpected:\n{expected}\ngot:\n{got}"));
            }
        } else if !trace
            .first()
            .is_some_and(|t| t.starts_with(&format!("  at line {line} in ")))
        {
            fails.push(format!(
                "expected the error at line {line}, got {:?}",
                trace.join(" | ")
            ));
        }
    } else if !o.stderr.is_empty() {
        fails.push(format!("unexpected stderr: {}", o.stderr.join(" | ")));
    }

    // stdout is compared line by line, as a terminal would split it.
    let stdout: Vec<&str> = o.stdout.iter().flat_map(|l| l.split('\n')).collect();
    let lines = stdout.len().max(want.output.len());
    for i in 0..lines {
        let got = stdout.get(i).copied();
        let expected = want.output.get(i).map(String::as_str);
        if got != expected {
            fails.push(format!(
                "output line {}: expected {expected:?}, got {got:?}",
                i + 1
            ));
            break;
        }
    }
    fails
}

/// Run every test that `select` accepts with these options, print a line
/// per test, and exit with failure if any failed. Any command-line
/// argument that isn't a flag filters the tests by substring.
pub fn run_suite(suite: &str, select: impl Fn(&str) -> bool, options: Options) {
    let filter: Vec<String> =
        std::env::args().skip(1).filter(|a| !a.starts_with('-')).collect();
    let tests: Vec<String> = list_tests()
        .into_iter()
        .filter(|t| select(t))
        .filter(|t| filter.is_empty() || filter.iter().any(|f| t.contains(f.as_str())))
        .collect();
    println!("\nrunning {} {suite} tests", tests.len());
    let mut failed = Vec::new();
    for test in &tests {
        let source = std::fs::read_to_string(corpus_dir().join(test)).expect("test file");
        // A panic (e.g. a use-after-free caught by stress mode) fails this
        // program only, and says which program it was.
        let run = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            drip::run(&source, options)
        }));
        let fails = match run {
            Ok(outcome) => check(&source, &outcome),
            Err(payload) => {
                let msg = payload
                    .downcast_ref::<String>()
                    .map(String::as_str)
                    .or_else(|| payload.downcast_ref::<&str>().copied())
                    .unwrap_or("(non-string panic)");
                vec![format!("panicked: {msg}")]
            }
        };
        if fails.is_empty() {
            println!("test {test} ... ok");
        } else {
            println!("test {test} ... FAILED");
            failed.push((test, fails));
        }
    }
    for (test, fails) in &failed {
        println!("\n---- {test} ----");
        for f in fails {
            println!("  {f}");
        }
    }
    let passed = tests.len() - failed.len();
    let result = if failed.is_empty() { "ok" } else { "FAILED" };
    println!("\n{suite} result: {result}. {passed} passed; {} failed\n", failed.len());
    if !failed.is_empty() {
        std::process::exit(1);
    }
}
