//! The corpus test runner, shared by `corpus.rs` and `stress_gc.rs`.
//!
//! A port of `check()` in the TypeScript `test/corpus.ts`, which mirrors
//! the Crafting Interpreters test runner (`tool/bin/test.dart`, MIT): it
//! checks expected stdout, compile errors with their line numbers, the
//! runtime error and its line, and the exit code. The patterns are
//! matched by hand, because this crate uses no dependencies.

// Each test binary uses its own part of this module.
#![allow(dead_code)]

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use drip::{Options, Outcome};

/// The corpus lives beside this crate, at `book/companion/corpus`.
pub fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../corpus")
}

/// Every `.drip` file under `dir`, as sorted paths relative to the corpus.
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

/// The VM's skip list, exactly `SKIP.vm` in corpus.ts: early-chapter
/// tests that aren't whole programs, and the (slow) benchmarks.
pub const SKIP_VM: &[&str] = &["scanning", "expressions", "benchmark"];

pub fn should_skip(test: &str, skip: &[&str]) -> bool {
    skip.iter().any(|p| test == format!("{p}.drip") || test.starts_with(&format!("{p}/")))
}

/// What the test's comments say should happen.
#[derive(Default)]
struct Expectations {
    output: Vec<String>,
    errors: BTreeSet<String>,
    runtime_error: Option<(String, usize)>,
    exit_code: i32,
}

/// `// expect: ?(.*)`: the text after `// expect:` and one optional space.
fn expect_output(line: &str) -> Option<&str> {
    let rest = after(line, "// expect:")?;
    Some(rest.strip_prefix(' ').unwrap_or(rest))
}

/// `// (Error.*)`
fn expect_error(line: &str) -> Option<&str> {
    let start = line.find("// Error")?;
    Some(&line[start + 3..])
}

/// `// \[((java|c) )?line (\d+)\] (Error.*)`: the language (if any), the
/// line number and the error. Tried at every `// [` in the line.
fn expect_error_at_line(line: &str) -> Option<(Option<&str>, usize, &str)> {
    let mut search = 0;
    while let Some(found) = line[search..].find("// [") {
        let start = search + found + 4;
        search = start;
        let mut rest = &line[start..];
        let mut language = None;
        for lang in ["java", "c"] {
            if let Some(r) = rest.strip_prefix(lang).and_then(|r| r.strip_prefix(' ')) {
                language = Some(lang);
                rest = r;
                break;
            }
        }
        let Some(rest) = rest.strip_prefix("line ") else { continue };
        let digits =
            rest.len() - rest.trim_start_matches(|c: char| c.is_ascii_digit()).len();
        if digits == 0 {
            continue;
        }
        let Some(error) = rest[digits..].strip_prefix("] ") else { continue };
        if !error.starts_with("Error") {
            continue;
        }
        let number = rest[..digits].parse().expect("digits");
        return Some((language, number, error));
    }
    None
}

/// `// expect runtime error: (.+)`
fn expect_runtime_error(line: &str) -> Option<&str> {
    after(line, "// expect runtime error: ").filter(|m| !m.is_empty())
}

/// The rest of `line` after the first `marker`, up to any `\r` (which
/// JavaScript's `.` would not match).
fn after<'a>(line: &'a str, marker: &str) -> Option<&'a str> {
    let rest = &line[line.find(marker)? + marker.len()..];
    Some(rest.split('\r').next().unwrap_or(""))
}

/// `\[.*line (\d+)\] (Error.+)` on a line of stderr: like the greedy
/// regex, prefer the last `line N] Error...` after the first `[`.
fn reported_error(line: &str) -> Option<(usize, &str)> {
    let open = line.find('[')?;
    let candidates: Vec<usize> =
        line[open + 1..].match_indices("line ").map(|(i, _)| open + 1 + i + 5).collect();
    for &start in candidates.iter().rev() {
        let rest = &line[start..];
        let digits =
            rest.len() - rest.trim_start_matches(|c: char| c.is_ascii_digit()).len();
        if digits == 0 {
            continue;
        }
        if let Some(error) = rest[digits..].strip_prefix("] ")
            && error.starts_with("Error")
            && error.len() > "Error".len()
        {
            return Some((rest[..digits].parse().expect("digits"), error));
        }
    }
    None
}

/// `\[line (\d+)\]`: the first line number in a stack trace.
fn first_line_number(text: &str) -> Option<usize> {
    let mut search = 0;
    while let Some(found) = text[search..].find("[line ") {
        let start = search + found + 6;
        search = start;
        let rest = &text[start..];
        let digits =
            rest.len() - rest.trim_start_matches(|c: char| c.is_ascii_digit()).len();
        if digits > 0 && rest[digits..].starts_with(']') {
            return rest[..digits].parse().ok();
        }
    }
    None
}

fn parse_expectations(source: &str, language: &str) -> Option<Expectations> {
    let mut e = Expectations::default();
    for (i, line) in source.split('\n').enumerate() {
        let n = i + 1;
        if line.contains("// nontest") {
            return None;
        }
        if let Some(text) = expect_output(line) {
            e.output.push(text.split('\r').next().unwrap_or("").to_string());
        } else if let Some(error) = expect_error(line) {
            e.errors.insert(format!("[line {n}] {}", error.trim_end_matches('\r')));
            e.exit_code = 65;
        } else if let Some((lang, number, error)) = expect_error_at_line(line) {
            if lang.is_none_or(|l| l == language) {
                e.errors
                    .insert(format!("[line {number}] {}", error.trim_end_matches('\r')));
                e.exit_code = 65;
            }
        } else if let Some(message) = expect_runtime_error(line) {
            e.runtime_error = Some((message.to_string(), n));
            e.exit_code = 70;
        }
    }
    Some(e)
}

/// Check one program's outcome against its expectations. Returns the
/// failures: an empty list means the test passed.
pub fn check(source: &str, o: &Outcome, language: &str) -> Vec<String> {
    let Some(expected) = parse_expectations(source, language) else {
        return vec![];
    };
    let mut fails = Vec::new();

    if let Some((message, line)) = &expected.runtime_error {
        if o.stderr.len() < 2 {
            fails.push(format!("expected runtime error \"{message}\" and got none"));
        } else {
            if &o.stderr[0] != message {
                fails.push(format!(
                    "expected runtime error \"{message}\", got \"{}\"",
                    o.stderr[0]
                ));
            }
            let trace = o.stderr[1..].join("\n");
            if first_line_number(&trace) != Some(*line) {
                let got = o.stderr[1..].join(" | ");
                fails.push(format!("expected runtime error on line {line}, got {got}"));
            }
        }
    } else {
        let mut found = BTreeSet::new();
        for l in &o.stderr {
            if let Some((number, error)) = reported_error(l) {
                let e = format!("[line {number}] {error}");
                if expected.errors.contains(&e) {
                    found.insert(e);
                } else {
                    fails.push(format!("unexpected error: {l}"));
                }
            } else if !l.is_empty() {
                fails.push(format!("unexpected output on stderr: {l}"));
            }
        }
        for e in expected.errors.difference(&found) {
            fails.push(format!("missing expected error: {e}"));
        }
    }

    if o.exit_code != expected.exit_code {
        let (want, got) = (expected.exit_code, o.exit_code);
        fails.push(format!("expected exit code {want}, got {got}"));
    }

    // stdout is compared line by line, as a terminal would split it.
    let stdout: Vec<&str> = o.stdout.iter().flat_map(|l| l.split('\n')).collect();
    let lines = stdout.len().max(expected.output.len());
    for i in 0..lines {
        let got = stdout.get(i).copied();
        let want = expected.output.get(i).map(String::as_str);
        if got != want {
            fails.push(format!("output line {}: expected {want:?}, got {got:?}", i + 1));
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
            Ok(outcome) => check(&source, &outcome, "c"),
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
