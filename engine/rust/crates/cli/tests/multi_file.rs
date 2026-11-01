//! The multi-file CLI: `viscosity build a.js b.js -o dir/` and
//! `viscosity explain a.js b.js`. Files are compiled in parallel; the output
//! must not depend on the number of threads, must equal compiling each file
//! on its own, and must equal the TypeScript CLI's.

mod common;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use common::{programs, root, Lang};

fn viscosity(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_viscosity")).args(args).output().expect("runs")
}

fn stdout(o: &Output) -> String {
    assert!(o.status.success(), "failed: {}", String::from_utf8_lossy(&o.stderr));
    String::from_utf8(o.stdout.clone()).expect("utf-8")
}

fn temp_dir(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("vsc-multi-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).expect("temp dir");
    d
}

/// Every JavaScript test program (they all have distinct file names except
/// across suites, so take the corpus and the e2e programs).
fn js_files() -> Vec<String> {
    programs()
        .into_iter()
        .filter(|p| p.lang == Lang::Js && (p.suite == "corpus" || p.suite == "e2e"))
        .map(|p| p.path.to_string_lossy().into_owned())
        .collect()
}

#[test]
fn explain_over_several_files_is_each_explain_in_order() {
    let files = js_files();
    let mut want = String::new();
    for (k, f) in files.iter().enumerate() {
        if k > 0 {
            want.push('\n');
        }
        want += &format!("== {f} ==\n{}", stdout(&viscosity(&["explain", f])));
    }
    for jobs in ["1", "3", "16"] {
        let mut args = vec!["explain", "--jobs", jobs];
        args.extend(files.iter().map(String::as_str));
        assert_eq!(stdout(&viscosity(&args)), want, "--jobs {jobs}");
    }
    // Frames too, and the default thread count.
    let mut frames: Vec<&str> = vec!["explain", "--frames"];
    frames.extend(files.iter().map(String::as_str));
    let one = stdout(&viscosity(&["explain", "--frames", &files[0]]));
    assert!(stdout(&viscosity(&frames)).starts_with(&format!("== {} ==\n{one}", files[0])));
}

#[test]
fn build_into_a_directory_writes_what_single_builds_print() {
    let files = js_files();
    for jobs in ["1", "4"] {
        let dir = temp_dir(&format!("build{jobs}"));
        let out = format!("{}/", dir.display());
        let mut args = vec!["build", "-o", &out, "--jobs", jobs];
        args.extend(files.iter().map(String::as_str));
        let o = viscosity(&args);
        assert_eq!(stdout(&o), "", "nothing on stdout");
        for f in &files {
            let name = Path::new(f).file_name().expect("a name");
            let got = fs::read_to_string(dir.join(name)).expect("written");
            assert_eq!(got, stdout(&viscosity(&["build", f])), "{f}");
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn single_file_into_a_directory_and_explain_on_stderr() {
    let f = js_files().remove(0);
    let dir = temp_dir("single");
    let o = viscosity(&["build", &f, "-o", &dir.to_string_lossy(), "--explain"]);
    assert!(o.status.success());
    let name = Path::new(&f).file_name().expect("a name");
    assert_eq!(fs::read_to_string(dir.join(name)).expect("written"), stdout(&viscosity(&["build", &f])));
    let explain = stdout(&viscosity(&["explain", &f]));
    assert_eq!(String::from_utf8_lossy(&o.stderr), explain, "--explain without a header for one file");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn several_files_need_a_directory_and_distinct_names() {
    let files = js_files();
    let o = viscosity(&["build", &files[0], &files[1]]);
    assert!(!o.status.success());
    assert!(
        String::from_utf8_lossy(&o.stderr).starts_with("viscosity: several files need an output directory: -o <dir>\n")
    );
    let dir = temp_dir("dup");
    let d = dir.to_string_lossy();
    let o = viscosity(&["build", &files[0], &files[0], "-o", &d]);
    let err = String::from_utf8_lossy(&o.stderr);
    assert!(!o.status.success() && err.contains("would both be written to"), "{err}");
    let o = viscosity(&["profile", &files[0], &files[1]]);
    assert!(String::from_utf8_lossy(&o.stderr).starts_with("viscosity: profile takes one file\n"));
    let o = viscosity(&["explain", "--jobs", "0", &files[0]]);
    assert!(String::from_utf8_lossy(&o.stderr).starts_with("viscosity: --jobs must be a whole number of at least 1\n"));
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_failing_file_does_not_stop_the_others() {
    let dir = temp_dir("fail");
    let bad = dir.join("bad.js");
    fs::write(&bad, "const = ;\n").expect("writable");
    let good = js_files().remove(0);
    let bad = bad.to_string_lossy();
    let o = viscosity(&["explain", &good, &bad, "--jobs", "2"]);
    assert!(!o.status.success(), "exit status 1");
    let out = String::from_utf8_lossy(&o.stdout);
    assert_eq!(out, format!("== {good} ==\n{}", stdout(&viscosity(&["explain", &good]))));
    let err = String::from_utf8_lossy(&o.stderr);
    assert!(err.starts_with(&format!("viscosity: {bad}: SyntaxError")), "{err}");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn the_typescript_cli_prints_the_same() {
    let cli = root().join("../ts/packages/cli/src/cli.ts");
    if Command::new("node").arg("--version").output().is_err() {
        eprintln!("skipping: `node` is not installed");
        return;
    }
    let mut files = js_files();
    files.truncate(12);
    files.push(root().join("tests/extra/frames_columns.js").to_string_lossy().into_owned());
    files.push(
        root().join("../ts/packages/frontend-python/test/corpus/escapes_print.py").to_string_lossy().into_owned(),
    );
    for extra in [&[][..], &["--frames"][..], &["--bounds", "assume", "--python-auto"][..]] {
        let mut args = vec!["explain"];
        args.extend(extra);
        args.extend(files.iter().map(String::as_str));
        let ts = Command::new("node").arg(&cli).args(&args).output().expect("node runs");
        assert_eq!(stdout(&viscosity(&args)), stdout(&ts), "{extra:?}");
    }
    let (dr, dt) = (temp_dir("rs"), temp_dir("ts"));
    let _ = stdout(
        &Command::new(env!("CARGO_BIN_EXE_viscosity"))
            .arg("build")
            .arg("-o")
            .arg(&dr)
            .args(&files)
            .output()
            .expect("runs"),
    );
    let _ = stdout(
        &Command::new("node").arg(&cli).arg("build").arg("-o").arg(&dt).args(&files).output().expect("node runs"),
    );
    for f in &files {
        let name = Path::new(f).file_name().expect("a name");
        assert_eq!(fs::read(dr.join(name)).expect("rust"), fs::read(dt.join(name)).expect("ts"), "{f}");
    }
    let _ = fs::remove_dir_all(&dr);
    let _ = fs::remove_dir_all(&dt);
}

#[test]
fn min_size_must_be_a_non_negative_number_in_both_clis() {
    let file = js_files().remove(0);
    let ts_cli = root().join("../ts/packages/cli/src/cli.ts");
    let node = Command::new("node").arg("--version").output().is_ok();
    for (v, ok) in
        [("abc", false), ("-1", false), ("NaN", false), ("1x", false), ("0", true), ("100", true), ("1e3", true)]
    {
        let rs = viscosity(&["explain", &file, "--min-size", v]);
        assert_eq!(rs.status.success(), ok, "rust --min-size {v}");
        let err = String::from_utf8_lossy(&rs.stderr);
        if !ok {
            assert!(err.starts_with("viscosity: --min-size must be a non-negative number\n"), "rust: {err}");
        }
        if node {
            let ts =
                Command::new("node").arg(&ts_cli).args(["explain", &file, "--min-size", v]).output().expect("node");
            assert_eq!(ts.status.code(), rs.status.code(), "ts --min-size {v}");
            if ok {
                assert_eq!(ts.stdout, rs.stdout, "--min-size {v}");
            } else {
                let err = String::from_utf8_lossy(&ts.stderr);
                assert!(err.starts_with("viscosity: --min-size must be a non-negative number\n"), "ts: {err}");
            }
        }
    }
}

/// A single file that cannot be read is named in the error, by both CLIs.
/// With several files the line already starts with the file's name.
#[test]
fn a_missing_file_is_named() {
    let dir = temp_dir("missing");
    let nope = dir.join("nope.js").to_string_lossy().into_owned();
    let ts_cli = root().join("../ts/packages/cli/src/cli.ts");
    let node = Command::new("node").arg("--version").output().is_ok();
    for cmd in ["explain", "build"] {
        let rs = viscosity(&[cmd, &nope]);
        assert_eq!(rs.status.code(), Some(1), "rust {cmd}");
        assert_eq!(
            String::from_utf8_lossy(&rs.stderr),
            format!("viscosity: cannot read {nope}: No such file or directory (os error 2)\n"),
            "rust {cmd}"
        );
        if node {
            let ts = Command::new("node").arg(&ts_cli).args([cmd, &nope]).output().expect("node runs");
            assert_eq!(ts.status.code(), Some(1), "ts {cmd}");
            assert_eq!(
                String::from_utf8_lossy(&ts.stderr),
                format!("viscosity: cannot read {nope}: ENOENT: no such file or directory, open '{nope}'\n"),
                "ts {cmd}"
            );
        }
    }
    let good = js_files().remove(0);
    let rs = viscosity(&["explain", &good, &nope]);
    let err = String::from_utf8_lossy(&rs.stderr);
    assert_eq!(err, format!("viscosity: {nope}: No such file or directory (os error 2)\n"), "rust, several files");
    let _ = fs::remove_dir_all(&dir);
}
