//! TS ↔ Rust parity: for every corpus program, end-to-end benchmark and
//! extra test program, JavaScript and Python, the Rust engine's output code
//! and explain text must equal the TypeScript engine's, byte for byte.
//!
//! The expectations in `tests/expected/` are generated from the TypeScript
//! reference by `scripts/gen_expected.mjs`; regenerate them with
//! `node scripts/gen_expected.mjs` after changing the reference.

mod common;

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs;
use std::process::Command;

use common::{expected_dir, programs, Lang, Program, VARIANTS};
use viscosity_core::{compile, CompileOptions};
use viscosity_frontend_js::JsPlugin;
use viscosity_frontend_python::PyPlugin;

fn expected(p: &Program, name: &str) -> (String, String) {
    let dir = expected_dir();
    let read = |f: String| fs::read_to_string(dir.join(&f)).unwrap_or_else(|e| panic!("missing fixture {f}: {e}"));
    (read(format!("{name}.{}", p.ext())), read(format!("{name}.explain.txt")))
}

/// The first line where two texts differ, for readable failures.
fn first_difference(want: &str, got: &str) -> String {
    for (i, (w, g)) in want.lines().zip(got.lines()).enumerate() {
        if w != g {
            return format!("line {}:\n  want: {w}\n  got:  {g}", i + 1);
        }
    }
    format!("lengths differ ({} vs {} bytes)", want.len(), got.len())
}

#[test]
fn rust_output_equals_typescript_output() {
    let mut failures = Vec::new();
    let mut total = 0;
    for p in programs() {
        for (suffix, bounds) in VARIANTS {
            total += 1;
            let name = format!("{}{suffix}", p.name);
            let (want_code, want_explain) = expected(&p, &name);
            let r = p.compile(bounds);
            if r.code != want_code {
                failures.push(format!("{name}.{}: {}", p.ext(), first_difference(&want_code, &r.code)));
            }
            if r.explain != want_explain {
                failures.push(format!("{name}.explain.txt: {}", first_difference(&want_explain, &r.explain)));
            }
        }
    }
    assert!(total >= 66, "expected at least 33 programs x 2 variants, found {total}");
    let py = 2 * programs().iter().filter(|p| p.lang == Lang::Python).count();
    assert!(py >= 30, "expected at least 15 Python programs x 2 variants, found {py}");
    assert!(failures.is_empty(), "{} of {total} differ:\n{}", failures.len(), failures.join("\n"));
    println!("parity: {total}/{total} ({py} Python)");
}

/// The programs with a `--frames` fixture (`<name>.frames.txt`), which
/// `scripts/gen_expected.mjs` chooses.
fn frames_fixtures() -> Vec<(Program, String)> {
    programs()
        .into_iter()
        .filter_map(|p| {
            let f = expected_dir().join(format!("{}.frames.txt", p.name));
            fs::read_to_string(f).ok().map(|text| (p, text))
        })
        .collect()
}

#[test]
fn code_frames_equal_typescript_code_frames() {
    let fixtures = frames_fixtures();
    assert!(fixtures.len() >= 10, "expected at least 10 frames fixtures, found {}", fixtures.len());
    let bin = env!("CARGO_BIN_EXE_viscosity");
    for (p, want) in &fixtures {
        let src = &p.source;
        let r = p.compile(viscosity_core::Bounds::Check);
        let got = viscosity_core::explain_with_frames(&r.plan, src);
        assert_eq!(&got, want, "{}.frames.txt: {}", p.name, first_difference(want, &got));
        // The frames come under the plain explain lines, which stay unchanged.
        let plain: Vec<&str> = got.lines().filter(|l| !l.starts_with("    ")).collect();
        assert_eq!(plain.join("\n"), r.explain, "{}: frames must only add lines", p.name);
        let mut cmd = Command::new(bin);
        cmd.args(["explain", "--frames"]).arg(&p.path);
        if p.python_auto() {
            cmd.arg("--python-auto");
        }
        let out = cmd.output().expect("runs");
        assert!(out.status.success(), "{}: {}", p.name, String::from_utf8_lossy(&out.stderr));
        assert_eq!(String::from_utf8(out.stdout).expect("utf-8"), format!("{want}\n"), "{}: CLI", p.name);
    }
}

/// The programs with a profile (`tests/profiles/<name>.json`), with the
/// profile's path and its sizes (`{ name: { maxLength } }`, as the CLI reads
/// it). `scripts/gen_expected.mjs` writes `<name>.profile.*` for each.
fn profiled_programs() -> Vec<(Program, std::path::PathBuf, HashMap<String, f64>)> {
    let dir = common::root().join("tests/profiles");
    let mut out = Vec::new();
    for p in programs() {
        let path = dir.join(format!("{}.json", p.name));
        let Ok(text) = fs::read_to_string(&path) else {
            continue;
        };
        let json: serde_json::Value = serde_json::from_str(&text).expect("a JSON profile");
        let sizes = json
            .as_object()
            .expect("an object")
            .iter()
            .filter_map(|(name, v)| v.get("maxLength").and_then(serde_json::Value::as_f64).map(|n| (name.clone(), n)))
            .collect();
        out.push((p, path, sizes));
    }
    out
}

#[test]
fn profiled_output_equals_typescript_output() {
    let profiled = profiled_programs();
    assert!(profiled.len() >= 4, "expected at least 4 profiles, found {}", profiled.len());
    let bin = env!("CARGO_BIN_EXE_viscosity");
    for (p, path, sizes) in &profiled {
        let name = format!("{}.profile", p.name);
        let (want_code, want_explain) = expected(p, &name);
        let opts = CompileOptions {
            mode: p.mode(),
            python_auto: p.python_auto(),
            profile: Some(sizes.clone()),
            ..CompileOptions::default()
        };
        let r = match p.lang {
            Lang::Js => compile(&p.source, &JsPlugin, opts),
            Lang::Python => compile(&p.source, &PyPlugin, opts),
        }
        .unwrap_or_else(|e| panic!("{name}: {e}"));
        assert_eq!(r.code, want_code, "{name}.{}: {}", p.ext(), first_difference(&want_code, &r.code));
        assert_eq!(r.explain, want_explain, "{name}.explain.txt: {}", first_difference(&want_explain, &r.explain));
        // And through the CLI's `--profile`.
        let mut cmd = Command::new(bin);
        cmd.arg("explain").arg(&p.path).arg("--profile").arg(path);
        if p.python_auto() {
            cmd.arg("--python-auto");
        }
        if p.mode() == viscosity_core::Mode::OptIn {
            cmd.args(["--mode", "opt-in"]);
        }
        let out = cmd.output().expect("runs");
        assert!(out.status.success(), "{name}: {}", String::from_utf8_lossy(&out.stderr));
        assert_eq!(String::from_utf8(out.stdout).expect("utf-8"), format!("{want_explain}\n"), "{name}: CLI");
    }
}

#[test]
fn fixtures_match_the_programs_exactly() {
    // Every program has fixtures, and no fixture is stale.
    let mut want = BTreeSet::new();
    for (p, _) in frames_fixtures() {
        want.insert(format!("{}.frames.txt", p.name));
    }
    for (p, _, _) in profiled_programs() {
        want.insert(format!("{}.profile.{}", p.name, p.ext()));
        want.insert(format!("{}.profile.explain.txt", p.name));
    }
    for p in programs() {
        for (suffix, _) in VARIANTS {
            want.insert(format!("{}{suffix}.{}", p.name, p.ext()));
            want.insert(format!("{}{suffix}.explain.txt", p.name));
        }
    }
    let have: BTreeSet<String> = fs::read_dir(expected_dir())
        .expect("fixtures")
        .map(|e| e.expect("entry").file_name().to_string_lossy().into())
        .collect();
    let missing: Vec<_> = want.difference(&have).collect();
    let stale: Vec<_> = have.difference(&want).collect();
    assert!(
        missing.is_empty() && stale.is_empty(),
        "run `node scripts/gen_expected.mjs`; missing {missing:?}, stale {stale:?}"
    );
}

#[test]
fn corpus_layout_decisions_match_their_headers() {
    // The `// viscosity: ps=soa, keep=aos` header of each corpus program
    // states the expected decision, as in the TS differential test.
    for p in programs().into_iter().filter(|p| p.suite == "corpus") {
        let header = p.source.lines().find(|l| l.starts_with("// viscosity")).expect("a header");
        let spec = header.split_once(": ").expect("name=layout list").1;
        // Like `Object.fromEntries` in the TS test: one entry per name, the
        // last one winning (two collections may share a name).
        let want: BTreeMap<String, String> = spec
            .split(',')
            .map(|kv| {
                let (k, v) = kv.trim().split_once('=').expect("name=layout");
                (k.to_string(), v.to_string())
            })
            .collect();
        let r = p.compile(viscosity_core::Bounds::Check);
        let got: BTreeMap<String, String> =
            r.plan.collections.iter().map(|c| (c.collection.name.clone(), c.layout.as_str().to_string())).collect();
        assert_eq!(got, want, "{}:\n{}", p.name, r.explain);
    }
}

#[test]
fn python_corpus_layout_decisions_match_their_headers() {
    // `# viscosity: ps=soa` (possibly empty), as in the TS Python
    // differential test, which compiles with `pythonAuto: true`.
    for p in programs().into_iter().filter(|p| p.suite == "pycorpus") {
        let at = p.source.find("# viscosity: ").expect("a header");
        let spec = p.source[at + "# viscosity: ".len()..].lines().next().unwrap_or("");
        let want: BTreeMap<String, String> = spec
            .split(',')
            .filter(|kv| !kv.trim().is_empty())
            .map(|kv| {
                let mut parts = kv.trim().split('=');
                (parts.next().unwrap_or("").to_string(), parts.next().unwrap_or("").to_string())
            })
            .collect();
        let r = p.compile(viscosity_core::Bounds::Check);
        let got: BTreeMap<String, String> =
            r.plan.collections.iter().map(|c| (c.collection.name.clone(), c.layout.as_str().to_string())).collect();
        assert_eq!(got, want, "{}:\n{}", p.name, r.explain);
    }
}

#[test]
fn the_cli_binary_gives_the_same_output() {
    let bin = env!("CARGO_BIN_EXE_viscosity");
    for p in programs() {
        for (suffix, bounds) in VARIANTS {
            let name = format!("{}{suffix}", p.name);
            let (want_code, want_explain) = expected(&p, &name);
            let mut args = vec![p.path.to_string_lossy().to_string()];
            if p.python_auto() {
                args.push("--python-auto".into());
            }
            if p.mode() == viscosity_core::Mode::OptIn {
                args.extend(["--mode".into(), "opt-in".into()]);
            }
            if bounds == viscosity_core::Bounds::Assume {
                args.extend(["--bounds".into(), "assume".into()]);
            }
            let run = |cmd: &str| {
                let out = Command::new(bin).arg(cmd).args(&args).output().expect("runs");
                assert!(out.status.success(), "{name}: {}", String::from_utf8_lossy(&out.stderr));
                String::from_utf8(out.stdout).expect("utf-8")
            };
            assert_eq!(run("build"), want_code, "{name}: build");
            let explain =
                if want_explain.is_empty() { "No arrays of objects found.".to_string() } else { want_explain };
            assert_eq!(run("explain"), explain + "\n", "{name}: explain");
        }
    }
}

#[test]
fn syntax_errors_are_reported() {
    let err = compile("const = ;", &JsPlugin, CompileOptions::default()).expect_err("fails").to_string();
    // `<message> (line:column)`, as acorn words it (no `SyntaxError: `).
    assert_eq!(err, "Unexpected token (1:6)");
}

#[test]
fn export_default_class_and_function_round_trip() {
    // Mirrors the TS round-trip test (named and anonymous).
    use viscosity_core::{compile, CompileOptions};
    use viscosity_frontend_js::JsPlugin;
    for src in [
        "export default class A { m() { return 1; } }\n",
        "export default class {}\n",
        "export default function () { return 1; }\n",
    ] {
        assert_eq!(compile(src, &JsPlugin, CompileOptions::default()).expect("compiles").code, src);
    }
}

#[test]
fn python_cli_flags_and_errors_match_the_typescript_cli() {
    let bin = env!("CARGO_BIN_EXE_viscosity");
    let file = common::root().join("../ts/packages/frontend-python/test/corpus/particles.py");
    let run = |args: &[&str]| Command::new(bin).args(args).arg(&file).output().expect("runs");
    // `profile` rejects Python with the reference's message, without the
    // usage text (it is not a usage error).
    let out = run(&["profile"]);
    assert!(!out.status.success());
    assert_eq!(
        String::from_utf8_lossy(&out.stderr),
        "viscosity: profile runs JavaScript programs only; Python profiling is not supported yet\n"
    );
    // Without --python-auto, CPython keeps objects; with it, ps becomes columns.
    let plain = String::from_utf8(run(&["explain"]).stdout).expect("utf-8");
    assert!(plain.contains("kept as array of objects") && plain.contains("CPython"), "{plain}");
    let auto = String::from_utf8(run(&["build", "--python-auto"]).stdout).expect("utf-8");
    assert!(auto.contains("ps = _Vsc_ps()"), "{auto}");
}
