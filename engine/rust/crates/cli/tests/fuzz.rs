//! A fixed-seed run of the differential fuzzer (`scripts/fuzz.mjs`): 200
//! random programs, each checked for behaviour (original vs compiled, under
//! node, in both bounds modes) and for TS/Rust parity (code, explain and
//! code frames, byte for byte), against this build of the `viscosity`
//! binary. Skipped, with a message, when `node` is not installed. Long
//! campaigns: `node scripts/fuzz.mjs --count 20000 --seed 7`.

mod common;

use std::process::Command;

#[test]
fn a_fixed_seed_fuzz_run_finds_nothing() {
    if Command::new("node").arg("--version").output().is_err() {
        eprintln!("skipping the fuzz run: `node` is not installed");
        return;
    }
    let script = common::root().join("scripts/fuzz.mjs");
    let out = Command::new("node")
        .arg(&script)
        .args(["--count", "200", "--seed", "1", "--rust", env!("CARGO_BIN_EXE_viscosity")])
        .output()
        .expect("node runs");
    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(out.status.success(), "fuzz failures:\n{stdout}\n{}", String::from_utf8_lossy(&out.stderr));
    assert!(stdout.contains("fuzz: seed 1, 200 programs"), "{stdout}");
}
