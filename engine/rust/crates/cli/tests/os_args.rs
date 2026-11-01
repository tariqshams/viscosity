//! Command-line arguments that are not valid UTF-8. Linux file names are
//! bytes, so `viscosity explain $'\xff.js'` must work (or fail cleanly),
//! never panic: `std::env::args` would, with exit status 101.

#![cfg(unix)]

use std::ffi::OsString;
use std::fs;
use std::os::unix::ffi::OsStringExt;
use std::path::PathBuf;
use std::process::{Command, Output};

const PROGRAM: &str = "const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, y: i });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x;
";

fn viscosity(dir: &PathBuf, args: &[OsString]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_viscosity")).current_dir(dir).args(args).output().expect("runs")
}

fn os(bytes: &[u8]) -> OsString {
    OsString::from_vec(bytes.to_vec())
}

fn temp_dir(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("vsc-osargs-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).expect("temp dir");
    d
}

#[test]
fn a_file_name_that_is_not_utf8_compiles() {
    let dir = temp_dir("ok");
    let name = os(b"\xff.js");
    if fs::write(dir.join(&name), PROGRAM).is_err() {
        // Some file systems (not Linux's usual ones) refuse such names.
        eprintln!("skipped: the file system refuses non-UTF-8 names");
        return;
    }
    fs::write(dir.join("plain.js"), PROGRAM).expect("writable");
    let want = viscosity(&dir, &["explain".into(), "plain.js".into()]);
    assert!(want.status.success());

    let o = viscosity(&dir, &["explain".into(), name.clone()]);
    assert_eq!(o.status.code(), Some(0), "{}", String::from_utf8_lossy(&o.stderr));
    assert_eq!(o.stdout, want.stdout);

    // Several files: the header shows the name lossily.
    let o = viscosity(&dir, &["explain".into(), name.clone(), "plain.js".into(), "--jobs".into(), "2".into()]);
    assert_eq!(o.status.code(), Some(0));
    assert!(String::from_utf8_lossy(&o.stdout).starts_with("== \u{fffd}.js ==\n"));

    // build -o dir/ keeps the name's bytes.
    let o = viscosity(&dir, &["build".into(), name.clone(), "-o".into(), "out/".into()]);
    assert_eq!(o.status.code(), Some(0), "{}", String::from_utf8_lossy(&o.stderr));
    let built = viscosity(&dir, &["build".into(), "plain.js".into()]);
    assert_eq!(fs::read(dir.join("out").join(&name)).expect("written"), built.stdout);

    // And -o to a file name that is not UTF-8.
    let target = os(b"out-\xfe.js");
    let o = viscosity(&dir, &["build".into(), name, "-o".into(), target.clone()]);
    assert_eq!(o.status.code(), Some(0));
    assert_eq!(fs::read(dir.join(target)).expect("written"), built.stdout);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn bad_arguments_that_are_not_utf8_fail_cleanly() {
    let dir = temp_dir("bad");
    let err = |args: &[OsString]| {
        let o = viscosity(&dir, args);
        assert_eq!(o.status.code(), Some(1), "{args:?}: exit status 1, not a panic (101)");
        String::from_utf8_lossy(&o.stderr).lines().next().unwrap_or("").to_string()
    };
    // A missing file, a missing profile, an option and an option value.
    assert_eq!(
        err(&["explain".into(), os(b"\xff.js")]),
        "viscosity: cannot read \u{fffd}.js: No such file or directory (os error 2)"
    );
    fs::write(dir.join("plain.js"), PROGRAM).expect("writable");
    assert_eq!(
        err(&["explain".into(), "plain.js".into(), "--profile".into(), os(b"\xff.json")]),
        "viscosity: cannot read the profile \u{fffd}.json"
    );
    assert_eq!(err(&["explain".into(), "plain.js".into(), os(b"--\xff")]), "viscosity: unknown option --\u{fffd}");
    assert_eq!(
        err(&["explain".into(), "plain.js".into(), "--mode".into(), os(b"\xff")]),
        "viscosity: --mode must be auto or opt-in"
    );
    assert_eq!(err(&[os(b"\xff"), "plain.js".into()]), "viscosity: unknown command \"\u{fffd}\"");
    let _ = fs::remove_dir_all(&dir);
}
