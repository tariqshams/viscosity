//! Differential test: every compiled program must behave exactly like the
//! original when run with Node.js (the book's chapter “Differential testing at scale”), and every compiled
//! Python program like the original when run with `python3`. Each half is
//! skipped, with a message, when its interpreter is not installed.
//!
//! Corpus and extra programs run in an isolated VM context
//! (`tests/run_isolated.cjs`, a copy of the TS test runner), comparing all
//! console output and any uncaught error. The end-to-end benchmarks time
//! themselves, so they run as plain node scripts and only their checksums
//! (`check` in their JSON output) are compared, as the TS benchmark does.
//!
//! Python programs run as plain `python3` scripts, as in the TS Python
//! differential test: their stdout and the last line of their stderr (the
//! exception, if any) must be the same. The Python benchmark is compared by
//! its checksum.

mod common;

use std::path::Path;
use std::process::Command;

use common::{programs, Lang, Program};
use viscosity_core::Bounds;

fn node_available() -> bool {
    Command::new("node").arg("--version").output().is_ok_and(|o| o.status.success())
}

fn node(args: &[&Path]) -> String {
    let out = Command::new("node").args(args).output().expect("node runs");
    assert!(out.status.success(), "node failed: {}", String::from_utf8_lossy(&out.stderr));
    String::from_utf8(out.stdout).expect("utf-8")
}

/// The `check` field of the last JSON line a benchmark prints.
fn checksum(stdout: &str) -> String {
    let last = stdout.trim().lines().last().expect("output");
    let v: serde_json::Value = serde_json::from_str(last).expect("JSON");
    v["check"].as_str().expect("a check field").to_string()
}

fn outcome(p: &Program, dir: &Path) -> (String, String) {
    let compiled = p.compile(Bounds::Check).code;
    let orig = dir.join(format!("{}.js", p.name));
    let comp = dir.join(format!("{}.vsc.js", p.name));
    std::fs::write(&orig, &p.source).expect("writable");
    std::fs::write(&comp, compiled).expect("writable");
    if p.suite == "e2e" {
        (checksum(&node(&[&orig])), checksum(&node(&[&comp])))
    } else {
        let runner = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/run_isolated.cjs");
        (node(&[&runner, &orig]), node(&[&runner, &comp]))
    }
}

#[test]
fn compiled_programs_behave_like_the_originals() {
    if !node_available() {
        eprintln!("skipping the differential test: `node` is not installed");
        return;
    }
    let dir = std::env::temp_dir().join(format!("vsc-diff-{}", std::process::id()));
    std::fs::create_dir_all(&dir).expect("temp dir");
    let progs: Vec<Program> = programs().into_iter().filter(|p| p.lang == Lang::Js).collect();
    // The benchmarks take a few seconds each: run programs in parallel.
    let results: Vec<(String, String, String)> = std::thread::scope(|s| {
        let handles: Vec<_> = progs
            .iter()
            .map(|p| {
                let dir = &dir;
                s.spawn(move || {
                    let (a, b) = outcome(p, dir);
                    (p.name.clone(), a, b)
                })
            })
            .collect();
        handles.into_iter().map(|h| h.join().expect("no panic")).collect()
    });
    let _ = std::fs::remove_dir_all(&dir);
    let failures: Vec<String> = results
        .iter()
        .filter(|(_, a, b)| a != b)
        .map(|(n, a, b)| format!("{n}:\n  original: {a}\n  compiled: {b}"))
        .collect();
    assert!(
        failures.is_empty(),
        "{} of {} programs behave differently:\n{}",
        failures.len(),
        results.len(),
        failures.join("\n")
    );
    println!("differential: {}/{} programs behave identically", results.len(), results.len());
}

fn python_available() -> bool {
    Command::new("python3").arg("--version").output().is_ok_and(|o| o.status.success())
}

/// stdout, and the last line of stderr if the program failed (like the TS
/// test's `{ out, err }`).
fn python(file: &Path) -> (String, Option<String>) {
    let out = Command::new("python3").arg(file).output().expect("python3 runs");
    let stdout = String::from_utf8(out.stdout).expect("utf-8");
    if out.status.success() {
        return (stdout, None);
    }
    let stderr = String::from_utf8_lossy(&out.stderr);
    (stdout, stderr.trim().lines().last().map(str::to_string))
}

#[test]
fn compiled_python_programs_behave_like_the_originals() {
    if !python_available() {
        eprintln!("skipping the Python differential test: `python3` is not installed");
        return;
    }
    let dir = std::env::temp_dir().join(format!("vsc-pydiff-{}", std::process::id()));
    std::fs::create_dir_all(&dir).expect("temp dir");
    let progs: Vec<Program> = programs().into_iter().filter(|p| p.lang == Lang::Python).collect();
    let results: Vec<(String, String, String)> = std::thread::scope(|s| {
        let handles: Vec<_> = progs
            .iter()
            .map(|p| {
                let dir = &dir;
                s.spawn(move || {
                    let compiled = p.compile(Bounds::Check).code;
                    let orig = dir.join(format!("{}.py", p.name));
                    let comp = dir.join(format!("{}.vsc.py", p.name));
                    std::fs::write(&orig, &p.source).expect("writable");
                    std::fs::write(&comp, &compiled).expect("writable");
                    let (a, b) = (python(&orig), python(&comp));
                    let show = |r: (String, Option<String>)| {
                        if p.suite == "pye2e" {
                            assert!(r.1.is_none(), "{}: {:?}", p.name, r.1);
                            checksum(&r.0)
                        } else {
                            format!("{:?}", r)
                        }
                    };
                    (p.name.clone(), show(a), show(b))
                })
            })
            .collect();
        handles.into_iter().map(|h| h.join().expect("no panic")).collect()
    });
    let _ = std::fs::remove_dir_all(&dir);
    let failures: Vec<String> = results
        .iter()
        .filter(|(_, a, b)| a != b)
        .map(|(n, a, b)| format!("{n}:\n  original: {a}\n  compiled: {b}"))
        .collect();
    assert!(
        failures.is_empty(),
        "{} of {} Python programs behave differently:\n{}",
        failures.len(),
        results.len(),
        failures.join("\n")
    );
    assert!(results.len() >= 15, "expected at least 15 Python programs, found {}", results.len());
    println!("python differential: {}/{} programs behave identically", results.len(), results.len());
}
