//! `--profile` files and `viscosity profile`, in both CLIs: one rule for
//! what a profile file may hold (an object of objects whose `maxLength` is a
//! non-negative finite number), the same errors, and no temporary
//! directories left behind, whether the profiled program succeeds or throws
//! (a program that throws is an error: no profile).

mod common;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use common::root;

fn temp_dir(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("vsc-profile-cli-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).expect("temp dir");
    d
}

fn node() -> bool {
    let ok = Command::new("node").arg("--version").output().is_ok();
    if !ok {
        eprintln!("skipping the TypeScript half: `node` is not installed");
    }
    ok
}

/// Runs both CLIs (the TypeScript one only if node is installed).
fn both(args: &[&str], tmp: Option<&Path>) -> Vec<(&'static str, Output)> {
    let mut rs = Command::new(env!("CARGO_BIN_EXE_viscosity"));
    rs.args(args);
    let mut out = vec![];
    let mut cmds = vec![("rust", rs)];
    if node() {
        let mut ts = Command::new("node");
        ts.arg(root().join("../ts/packages/cli/src/cli.ts")).args(args);
        cmds.push(("ts", ts));
    }
    for (name, mut c) in cmds {
        if let Some(t) = tmp {
            c.env("TMPDIR", t);
        }
        out.push((name, c.output().expect("runs")));
    }
    out
}

const PROGRAM: &str = "const ps = [];\nfor (let i = 0; i < 20; i++) ps.push({ x: i });\nfor (let i = 0; i < ps.length; i++) ps[i].x++;\nconsole.log(ps[3].x);\n";

#[test]
fn profile_files_are_validated_identically() {
    let dir = temp_dir("validate");
    let prog = dir.join("p.js");
    fs::write(&prog, PROGRAM).expect("writable");
    let entry = |name: &str| {
        format!("viscosity: the profile entry \"{name}\" must be an object whose maxLength is a non-negative number\n")
    };
    let object = "viscosity: the profile must be a JSON object: { \"name\": { \"maxLength\": n }, ... }\n".to_string();
    let cases: Vec<(&str, &str, Option<String>)> = vec![
        ("string", r#"{"ps":{"maxLength":"20"}}"#, Some(entry("ps"))),
        ("array", "[1]", Some(object.clone())),
        ("null", "null", Some(object.clone())),
        ("number", "5", Some(object)),
        ("bare", r#"{"ps":5}"#, Some(entry("ps"))),
        ("empty-entry", r#"{"qs":{}}"#, Some(entry("qs"))),
        ("negative", r#"{"ps":{"maxLength":-1}}"#, Some(entry("ps"))),
        ("nested-array", r#"{"ps":[10]}"#, Some(entry("ps"))),
        ("ok", r#"{"ps":{"maxLength":10,"fieldReads":{"x":3}}}"#, None),
        ("ok-large", r#"{"ps":{"maxLength":5000},"other":{"maxLength":0}}"#, None),
        ("ok-empty", "{}", None),
    ];
    for (tag, json, err) in cases {
        let path = dir.join(format!("{tag}.json"));
        fs::write(&path, json).expect("writable");
        let outs = both(&["explain", prog.to_str().expect("utf-8"), "--profile", path.to_str().expect("utf-8")], None);
        for (name, o) in &outs {
            let stderr = String::from_utf8_lossy(&o.stderr);
            match &err {
                Some(e) => {
                    assert_eq!(o.status.code(), Some(1), "{name} {tag}");
                    assert_eq!(&stderr, e, "{name} {tag}");
                }
                None => assert!(o.status.success(), "{name} {tag}: {stderr}"),
            }
        }
        if let [(_, rs), (_, ts)] = &outs[..] {
            assert_eq!(rs.stdout, ts.stdout, "{tag}: the same explain text");
        }
    }
    // A file that is not JSON, and one that does not exist.
    let bad = dir.join("bad.json");
    fs::write(&bad, "{ ps: 1 }").expect("writable");
    let missing = dir.join("missing.json");
    for (path, want) in [(&bad, "is not valid JSON"), (&missing, "")] {
        let p = path.to_str().expect("utf-8");
        let want = if want.is_empty() {
            format!("viscosity: cannot read the profile {p}\n")
        } else {
            format!("viscosity: the profile {p} {want}\n")
        };
        for (name, o) in both(&["explain", prog.to_str().expect("utf-8"), "--profile", p], None) {
            assert_eq!(o.status.code(), Some(1), "{name} {p}");
            assert_eq!(String::from_utf8_lossy(&o.stderr), want, "{name}");
        }
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn profiling_cleans_up_and_a_throwing_program_is_an_error() {
    let dir = temp_dir("run");
    let tmp = dir.join("tmp");
    fs::create_dir_all(&tmp).expect("temp dir");
    let good = dir.join("good.js");
    fs::write(&good, PROGRAM).expect("writable");
    let bad = dir.join("throws.js");
    fs::write(&bad, "const ps = [];\nfor (let i = 0; i < 5; i++) ps.push({ x: i });\nthrow new Error('boom');\n")
        .expect("writable");
    let outs = both(&["profile", good.to_str().expect("utf-8")], Some(&tmp));
    for (name, o) in &outs {
        assert!(o.status.success(), "{name}: {}", String::from_utf8_lossy(&o.stderr));
        assert_eq!(String::from_utf8_lossy(&o.stdout), "{\n  \"ps\": {\n    \"maxLength\": 20\n  }\n}\n", "{name}");
        assert_eq!(fs::read_dir(&tmp).expect("tmp").count(), 0, "{name}: no temporary directory left");
    }
    for (name, o) in both(&["profile", bad.to_str().expect("utf-8")], Some(&tmp)) {
        assert_eq!(o.status.code(), Some(1), "{name}");
        assert!(o.stdout.is_empty(), "{name}: no profile");
        let err = String::from_utf8_lossy(&o.stderr);
        assert!(err.ends_with("viscosity: the profiled program failed (exit code 1)\n"), "{name}: {err}");
        assert_eq!(fs::read_dir(&tmp).expect("tmp").count(), 0, "{name}: no temporary directory left");
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn profiling_a_missing_file_names_it_in_both_engines() {
    let dir = temp_dir("missing");
    let nope = dir.join("nope.js");
    let nope = nope.to_str().unwrap();
    for (engine, out) in both(&["profile", nope], None) {
        assert_eq!(out.status.code(), Some(1), "{engine}");
        let err = String::from_utf8_lossy(&out.stderr);
        let want = format!("viscosity: cannot read {nope}: ");
        assert!(err.starts_with(&want), "{engine}: {err}");
    }
}

#[test]
fn a_blank_min_size_is_a_usage_error_in_both_engines() {
    for v in ["", " "] {
        for (engine, out) in both(&["explain", "--min-size", v, "x.js"], None) {
            assert_eq!(out.status.code(), Some(1), "{engine}");
            let err = String::from_utf8_lossy(&out.stderr);
            assert!(err.starts_with("viscosity: --min-size must be a non-negative number\n"), "{engine}: {err}");
        }
    }
}
