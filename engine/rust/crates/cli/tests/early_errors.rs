//! ECMAScript early errors. The TypeScript engine parses with acorn
//! (`sourceType: 'module'`, `ecmaVersion: 'latest'`), which reports them
//! while parsing. oxc's parser leaves many to semantic analysis, so the
//! port runs `oxc_semantic`'s syntax checks too. Both CLIs must reject
//! every program in `EARLY_ERRORS` and accept every one in `VALID`. The
//! wording of the errors may differ; the decision may not. Both end the
//! message with acorn's `(line:column)`; `POSITIONED` lists programs where
//! the two must point at the same place.

mod common;

use std::fs;
use std::path::PathBuf;
use std::process::{Command, Output};

use common::root;

/// Programs acorn rejects as module code: early errors, strict-mode rules,
/// and invalid regular expressions.
const EARLY_ERRORS: &[&str] = &[
    // Redeclarations.
    "let a = 1; let a = 2;",
    "let v; var v;",
    "const b = 1; var b;",
    "function g() {} let g;",
    "function g() {} var g;",
    "function f() {} function f() {}",
    "class A {} class A {}",
    "var A; class A {}",
    "let x; { var x; }",
    "{ let y; var y; }",
    "{ function f() {} function f() {} }",
    "let [a, a] = [];",
    "for (let i, i;;) {}",
    "for (let a of []) { var a; }",
    "try {} catch (e) { let e; }",
    "try {} catch ([e]) { var e; }",
    "import { a } from 'm'; let a;",
    "import { a } from 'x'; import { a } from 'y';",
    // Labels, break and continue.
    "x: x: ;",
    "label: { label: ; }",
    "break;",
    "continue;",
    "break foo;",
    "l: { continue l; }",
    "a: { for (;;) continue a; }",
    "x: while (1) { (() => { break x; })(); }",
    "a: while (0) { function f() { break a; } }",
    // Return, super, new.target, arguments, await.
    "return 1;",
    "new.target;",
    "var f = () => new.target;",
    "function f() { super.x; }",
    "class C { m() { super(); } }",
    "class A { constructor() { super(); } }",
    "var o = { m() { super(); } };",
    "class A { x = arguments; }",
    "class A { static { arguments; } }",
    "class A { static { await; } }",
    "class A { static { return; } }",
    "var await;",
    "var \\u0061wait = 1;",
    "async function g(a = await 1) {}",
    "function* g(a = yield) {}",
    "function* g() { yield = 1; }",
    // Strict mode (module code is strict).
    "delete y;",
    "var y; delete ((y));",
    "with (o) {}",
    "let c = 010;",
    "var n = 09;",
    "var s = \"\\08\";",
    "var s = \"\\1\";",
    "var s = `\\1`;",
    "function f(a, a) {}",
    "var f = (a, a) => 1;",
    "var f = async (a, a) => 1;",
    "var o = { m(a, a) {} };",
    "function f(a = 1) { \"use strict\"; }",
    "var yield;",
    "var implements = 1;",
    "var package = 1;",
    "let let = 1;",
    "for (let let of []) {}",
    "arguments = 1;",
    "eval = 1;",
    "function eval() {}",
    "function f(eval) {}",
    "try {} catch (eval) {}",
    "var [eval] = [];",
    "({ eval } = {});",
    "lbl: function lf() {}",
    "if (1) function iff() {}",
    // Classes.
    "class K { constructor() {} constructor() {} }",
    "class C { get constructor() {} }",
    "class A { static prototype() {} }",
    "class C { #a; #a; }",
    "class A { get #a() {} get #a() {} }",
    "class A { static get #a() {} set #a(v) {} }",
    "class C { m() { return this.#b; } }",
    "class A { #a; m() { delete this.#a; } }",
    // Modules.
    "export { zz };",
    "export { nope as \"b\" };",
    "var a, c; export { a as b, c as b };",
    "export default 1; export default 2;",
    "export default function () {} export default class {}",
    "let x = 1; export { x as default }; export default 2;",
    // Other syntax the parser leaves to semantic analysis, or checks itself.
    "const k;",
    "var o = ({ __proto__: 1, __proto__: 2 });",
    "var b; ({ b = 1 });",
    "var a, b, c; [...a, b] = c;",
    "a?.b = 1;",
    "var o = { get a(b) {} };",
    "var o = { set a(...b) {} };",
    "for (var x = 1 of []) {}",
    "for (async of []) {}",
    "l\\u0065t x = 1;",
    "var n = 01n;",
    "var n = 1__0;",
    "var s = \"\\u{110000}\";",
    "var s = `\\u`;",
    "var a; new a?.b();",
    // Regular expressions.
    "var r = /(?<a>.)(?<a>.)/;",
    "var r = /a{2,1}/;",
    "var r = /\\u{110000}/u;",
    "var r = /(/;",
    "var r = /[b-a]/;",
    "var r = /\\k<x>/u;",
    "var r = /\\p{Foo}/u;",
    "var r = /a**/;",
    "var r = /a/gg;",
];

/// Valid module code that is close to an early error.
const VALID: &[&str] = &[
    "var a = 1; var a = 2;",
    "var x; { let x; }",
    "function f() { var x; { let x; } }",
    "function o() { function g() {} var g; }",
    "function f() { let x; } function g() { let x; }",
    "try {} catch (e) { var e; }",
    "try {} catch (e) { { let e; } }",
    "let x = 1; { let x = 2; }",
    "switch (1) { case 1: let z = 1; break; default: }",
    "x: { break x; }",
    "x: for (;;) { y: for (;;) { continue x; } }",
    "a: b: ;",
    "a: ; a: ;",
    "a: { b: { c: { break b; } } }",
    "function f() { l: { break l; } l: { break l; } }",
    "function f() { return 1; }",
    "(function () { return new.target; });",
    "class A { constructor() { new.target; } }",
    "export { q }; var q;",
    "export { h }; function h() {}",
    "export { C }; class C {}",
    "var a; export { a as \"b c\" };",
    "export default function () {}",
    "export default class {}",
    "export * as ns from 'm';",
    "export { \"string name\" as x } from 'm';",
    "export const e1 = 1, e2 = 2; export function e3() {} export class E4 {}",
    "export let z; z = 1;",
    "import x, * as y from 'm';",
    "import { default as d } from 'm';",
    "import { a } from 'm'; import { a as b } from 'n';",
    "var m = import.meta;",
    "await 1;",
    "var o = ({ a: 1, a: 2 });",
    "var o = ({ __proto__: 1, [\"__proto__\"]: 2 });",
    "var __proto__ = 1; var o = ({ __proto__: 1, __proto__ });",
    "var o; ({ __proto__: o, __proto__: o } = {});",
    "var b; ({ b = 1 } = {});",
    "var o = { eval: 1, arguments: 2, if: 3, class: 4, let: 5, yield: 6, await: 7 };",
    "var o = {}; o.eval = 1; o.arguments = 2;",
    "var o = { m() { return super.toString(); } };",
    "var o = { async *m() { yield* []; await 1; } };",
    "var o = { get a() { return 1; }, set a(v) {} };",
    "class C { get x() { return 1; } set x(v) {} }",
    "class C { #a; get #b() { return 1; } set #b(v) {} }",
    "class C { static #a = 1; static m() { return C.#a; } }",
    "class C { constructor() {} [\"constructor\"]() {} }",
    "class A { constructor() {} static constructor() {} }",
    "class A { static async *#m() {} }",
    "class A { #x; static has(o) { return #x in o; } }",
    "class P {} class D extends P { constructor() { super(); super.x; } }",
    "class A { x = () => super.y; }",
    "class A { a = 1; b = this.a; static c = 1; static { this.c = 2; } }",
    "function f() { class A { [arguments] = 1; } }",
    "function f() { return arguments; }",
    "function f(a, b = a) {}",
    "var f = (a, b) => { \"use strict\"; return a; };",
    "async function a() { for await (const x of []) {} }",
    "var y1 = 1; function* g() { yield y1; }",
    "if (globalThis.a) { function ff() {} }",
    "var NaN; var Infinity;",
    "var y; typeof y;",
    "var n = [0.5, 0x1F, 0o7, 0b1, 1_000, 1n, 0];",
    "var s = \"\\0\\u{1F600}\\x41\";",
    "var t = String.raw`\\1\\u`;",
    "var r = /(?<a>x)|(?<a>y)/;",
    "var r = /(?<a>x)\\k<a>/;",
    "var r = /\\k<a>/;",
    "var r = /[\\p{L}--[a-z]]/v;",
    "var r = /(?i:a)/;",
    "var r = /[/]/, n = 1 / 2 / 3;",
    "var ar = [, , 1, ...[2]];",
    "try { throw 1; } catch { }",
    "debugger;",
    "#!/usr/bin/env node\nvar x = 1;",
    // Annex B allows a `var` named like a simple catch parameter, and
    // `undefined` is not a reserved word.
    "try {} catch (e) { for (var e of []) {} }",
    "let undefined;",
];

fn temp_dir(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("vsc-early-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).expect("temp dir");
    d
}

/// Writes each program to its own file, returning the paths.
fn write_programs(dir: &std::path::Path, programs: &[&str]) -> Vec<String> {
    programs
        .iter()
        .enumerate()
        .map(|(i, src)| {
            let path = dir.join(format!("p{i:03}.js"));
            fs::write(&path, format!("{src}\n")).expect("writable");
            path.to_string_lossy().into_owned()
        })
        .collect()
}

/// For each file, did `explain` (given all the files at once) reject it?
/// A rejected file is reported on stderr as `viscosity: <file>: <error>`.
fn rejected(out: &Output, files: &[String]) -> Vec<bool> {
    let err = String::from_utf8_lossy(&out.stderr);
    files.iter().map(|f| err.lines().any(|l| l.starts_with(&format!("viscosity: {f}: ")))).collect()
}

fn rust_cli() -> Command {
    Command::new(env!("CARGO_BIN_EXE_viscosity"))
}

fn ts_cli() -> Option<Command> {
    if Command::new("node").arg("--version").output().is_err() {
        eprintln!("skipping the TypeScript half: `node` is not installed");
        return None;
    }
    let mut c = Command::new("node");
    c.arg(root().join("../ts/packages/cli/src/cli.ts"));
    Some(c)
}

/// Runs both CLIs over `programs` and checks that each rejects exactly the
/// programs `reject` says.
fn check(tag: &str, programs: &[&str], reject: bool) {
    let dir = temp_dir(tag);
    let files = write_programs(&dir, programs);
    let mut engines = vec![("rust", rust_cli())];
    engines.extend(ts_cli().map(|c| ("ts", c)));
    for (name, mut cli) in engines {
        let out = cli.arg("explain").args(&files).output().expect("the CLI runs");
        assert_eq!(out.status.success(), !reject, "{name}: exit status");
        let bad: Vec<String> = rejected(&out, &files)
            .into_iter()
            .zip(programs)
            .filter(|&(r, _)| r != reject)
            .map(|(_, p)| format!("  {p}"))
            .collect();
        let verb = if reject { "accepts" } else { "rejects" };
        assert!(
            bad.is_empty(),
            "{name} {verb} {} program(s):\n{}\n{}",
            bad.len(),
            bad.join("\n"),
            String::from_utf8_lossy(&out.stderr)
        );
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn both_engines_reject_early_errors() {
    check("reject", EARLY_ERRORS, true);
}

#[test]
fn both_engines_accept_valid_tricky_programs() {
    check("accept", VALID, false);
}

/// One early error on its own: exit status 1 and one `viscosity: ` line,
/// as for any syntax error, in both CLIs.
#[test]
fn an_early_error_is_reported_like_a_syntax_error() {
    let dir = temp_dir("single");
    let file = dir.join("dup.js");
    fs::write(&file, "let a = 1;\nlet a = 2;\n").expect("writable");
    for build in [false, true] {
        let cmd = if build { "build" } else { "explain" };
        let rs = rust_cli().arg(cmd).arg(&file).output().expect("runs");
        assert_eq!(rs.status.code(), Some(1), "rust {cmd}");
        assert!(rs.stdout.is_empty(), "rust {cmd}: no output");
        let err = String::from_utf8_lossy(&rs.stderr);
        assert!(err.starts_with("viscosity: ") && !err.contains("SyntaxError"), "rust {cmd}: {err}");
        assert!(err.trim_end().ends_with(')') && err.lines().count() == 1, "rust {cmd}: {err}");
        if let Some(mut ts) = ts_cli() {
            let ts = ts.arg(cmd).arg(&file).output().expect("node runs");
            assert_eq!(ts.status.code(), Some(1), "ts {cmd}");
            assert!(ts.stdout.is_empty(), "ts {cmd}: no output");
            let err = String::from_utf8_lossy(&ts.stderr);
            assert!(err.starts_with("viscosity: ") && err.lines().count() == 1, "ts {cmd}: {err}");
        }
    }
    let _ = fs::remove_dir_all(&dir);
}

/// Syntax errors and early errors where acorn and the port point at the
/// same place. Line breaks of every kind (`\r\n`, `\r`, `\n`, U+2028,
/// U+2029, also inside comments and template literals) and non-ASCII text
/// (accented letters, astral characters, which count as two UTF-16 code
/// units) come before the error, so they shift its line and column.
const POSITIONED: &[&str] = &[
    // Syntax errors.
    "const ps = [;",
    "x = 1 +;",
    "let x = 1;\nlet y = ;",
    "let x = 1;\r\nlet y = ;",
    "let x = 1;\rlet y = ;",
    "let x = 1;\r\n\r\n\rlet y = ;",
    "var s = 'é';  x = (;",
    "var s = '😀😀'; x = (;",
    "// 😀 \u{2028} x = (;",
    "var t = `a\nb\r\nc`; var = 1;",
    "\tvar a = [1, 2;",
    "var é = 1;\nvar 😀 = 2;",
    "é\u{2028}😀;",
    "function f() {\n  return (\n}",
    "var a = 'unterminated;",
    "var x = 0b12;",
    "/* never closed",
    // Early errors, some reported by oxc's parser and some by oxc_semantic.
    "var s = '\u{2028}'; break;",
    "/* \u{2029} */ continue;",
    "var s = '😀';\r\nreturn 1;",
    "var f = () => new.target;",
    "function f() { super.x; }",
    "class A { constructor() { super(); } }",
    "class A { x = arguments; }",
    "class A { static { return; } }",
    "var \\u0061wait = 1;",
    "async function g(a = await 1) {}",
    "function* g() { yield = 1; }",
    "with (o) {}",
    "let c = 010;",
    "var s = `\\1`;",
    "var implements = 1;",
    "let let = 1;",
    "function f(eval) {}",
    "({ eval } = {});",
    "if (1) function iff() {}",
    "class C { get constructor() {} }",
    "/* é */ class C { m() { return this.#b; } }",
    "var é = 1;\nexport { zz };",
    "a?.b = 1;",
    "var o = { set a(...b) {} };",
    "for (var x = 1 of []) {}",
    "var n = 1__0;",
    "var a; new a?.b();",
    "var r = /(/;",
    "var r = /\\k<x>/u;",
];

/// The `(line:column)` at the end of each file's error line, if any.
fn positions(out: &Output, files: &[String]) -> Vec<Option<String>> {
    let err = String::from_utf8_lossy(&out.stderr);
    files
        .iter()
        .map(|f| {
            let line = err.lines().find(|l| l.starts_with(&format!("viscosity: {f}: ")))?;
            let pos = line.strip_suffix(')')?.rsplit_once(" (")?.1;
            let (l, c) = pos.split_once(':')?;
            let num = |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit());
            (num(l) && num(c)).then(|| pos.to_string())
        })
        .collect()
}

/// Both CLIs end a syntax error with acorn's `(line:column)`: a 1-based
/// line and a 0-based column in UTF-16 code units.
#[test]
fn both_engines_report_the_same_error_positions() {
    let dir = temp_dir("pos");
    let files = write_programs(&dir, POSITIONED);
    let rs = positions(&rust_cli().arg("explain").args(&files).output().expect("runs"), &files);
    let Some(mut ts) = ts_cli() else {
        assert!(rs.iter().all(Option::is_some), "rust: an error without a position: {rs:?}");
        return;
    };
    let ts = positions(&ts.arg("explain").args(&files).output().expect("node runs"), &files);
    let bad: Vec<String> = POSITIONED
        .iter()
        .zip(rs.iter().zip(&ts))
        .filter(|(_, (r, t))| r.is_none() || t.is_none() || r != t)
        .map(|(p, (r, t))| format!("  {p:?}: rust {r:?}, ts {t:?}"))
        .collect();
    assert!(bad.is_empty(), "positions differ:\n{}", bad.join("\n"));
    let _ = fs::remove_dir_all(&dir);
}

/// Every early error the port reports carries a position, whether oxc's
/// parser or oxc_semantic found it. (Where acorn and oxc blame different
/// tokens, e.g. a redeclaration, which oxc labels at the first
/// declaration, the positions may differ; `POSITIONED` lists programs where
/// they agree.)
#[test]
fn every_early_error_has_a_position() {
    let dir = temp_dir("haspos");
    let files = write_programs(&dir, EARLY_ERRORS);
    let rs = positions(&rust_cli().arg("explain").args(&files).output().expect("runs"), &files);
    let missing: Vec<&&str> = EARLY_ERRORS.iter().zip(&rs).filter(|(_, p)| p.is_none()).map(|(p, _)| p).collect();
    assert!(missing.is_empty(), "no position for {missing:?}");
    let _ = fs::remove_dir_all(&dir);
}

/// A single file's syntax error, exactly as both CLIs print it.
#[test]
fn a_single_syntax_error_ends_with_its_position() {
    let dir = temp_dir("onepos");
    let file = dir.join("ps.js");
    fs::write(&file, "const ps = [;\n").expect("writable");
    let rs = rust_cli().arg("explain").arg(&file).output().expect("runs");
    assert_eq!(String::from_utf8_lossy(&rs.stderr), "viscosity: Unexpected token (1:12)\n");
    if let Some(mut ts) = ts_cli() {
        let ts = ts.arg("explain").arg(&file).output().expect("node runs");
        assert_eq!(String::from_utf8_lossy(&ts.stderr), "viscosity: Unexpected token (1:12)\n");
    }
    let _ = fs::remove_dir_all(&dir);
}
