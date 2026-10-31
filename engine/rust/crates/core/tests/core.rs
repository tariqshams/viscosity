//! Mirrors `engine/ts/packages/core/test/core.test.ts`: SSA construction,
//! the CFG utilities, the analyses and explain, on real JavaScript lowered by
//! the JS plugin.

use viscosity_core::vir::{print_func, Module, Terminator};
use viscosity_core::{analyze, compile, dominators, natural_loops, Collection, CompileOptions, LanguagePlugin};
use viscosity_frontend_js::JsPlugin;

fn lower(src: &str) -> Module {
    JsPlugin.lower(src).expect("lowers").module
}

fn coll(src: &str) -> Collection {
    analyze(&lower(src)).collections.remove(0)
}

// ---- SSA construction ---------------------------------------------------------

#[test]
fn creates_a_phi_for_a_loop_variable_and_removes_trivial_phis() {
    let m = lower("let s = 0; for (let i = 0; i < 10; i++) s = s + i; console.log(s);");
    let text = print_func(&m, m.func(m.main));
    assert_eq!(text.matches("phi").count(), 2, "s and i:\n{text}");
}

#[test]
fn turns_a_local_alias_into_the_same_ssa_value() {
    let m = lower("function f(a) { const b = a; const c = b; return c; }");
    let f = m.functions.iter().find(|f| f.name == "f").expect("f");
    let ret = f
        .blocks
        .iter()
        .find_map(|b| match b.term {
            Terminator::Return { value, .. } => Some(value),
            _ => None,
        })
        .flatten();
    assert_eq!(ret, Some(f.params[0]));
}

// ---- CFG ------------------------------------------------------------------------

#[test]
fn finds_dominators_and_nested_natural_loops() {
    let m = lower("for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { console.log(i, j); } }");
    let f = m.func(m.main);
    let idom = dominators(f);
    assert_eq!(idom.idom(f.entry), Some(f.entry));
    let loops = natural_loops(f, &idom);
    assert_eq!(loops.len(), 2);
    let mut depths: Vec<u32> = loops.iter().map(|l| l.depth).collect();
    depths.sort();
    assert_eq!(depths, vec![1, 2]);
}

// ---- analyses -------------------------------------------------------------------

#[test]
fn proves_bounds_for_counting_loops_including_outer_loop_indexes_and_guards() {
    let c = coll(
        "const b = []; for (let i = 0; i < 100; i++) b.push({ x: i });
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < i + 8 && j < b.length; j++) b[i].x += b[j].x;",
    );
    assert_eq!(c.index_gets.iter().map(|g| g.bounds_proven).collect::<Vec<_>>(), vec![true, true]);
}

#[test]
fn does_not_prove_bounds_for_arbitrary_indexes() {
    let c = coll("const b = []; for (let i = 0; i < 100; i++) b.push({ x: i }); for (let i = 0; i < b.length; i++) b[i + 1].x = 0;");
    assert!(!c.index_gets[0].bounds_proven);
}

#[test]
fn infers_numeric_fields_through_parameters_of_known_functions() {
    let c = coll("const b = []; function add(v) { b.push({ x: v * 2 }); } for (let i = 0; i < 9; i++) add(i); for (let i = 0; i < b.length; i++) b[i].x++;");
    assert!(c.bailouts.is_empty(), "{:?}", c.bailouts);
}

#[test]
fn gives_a_field_a_plain_column_when_an_unknown_caller_could_pass_a_non_number() {
    let c = coll(
        "const b = []; export function add(v) { b.push({ x: v, y: 1 }); } for (let i = 0; i < b.length; i++) b[i].y++;",
    );
    assert!(c.bailouts.is_empty(), "{:?}", c.bailouts);
    assert_eq!(c.numeric_fields.iter().collect::<Vec<_>>(), vec!["y"]);
}

#[test]
fn estimates_sizes_from_constant_loop_bounds() {
    let c = coll("const b = []; for (let i = 0; i < 40; i++) for (let j = 0; j < 5; j++) b.push({ x: j });");
    assert_eq!(c.size_estimate, Some(200.0));
    assert!(!c.size_is_upper_bound);
}

#[test]
fn marks_the_size_as_a_maximum_when_pushes_run_only_on_some_paths() {
    let c = coll("const b = []; for (let i = 0; i < 100; i++) { if (i % 2) b.push({ x: i }); else b.push({ x: 0 }); }");
    assert_eq!(c.size_estimate, Some(200.0));
    assert!(c.size_is_upper_bound);
}

// ---- explain --------------------------------------------------------------------

#[test]
fn says_why_a_collection_was_kept() {
    let r = compile(
        "const b = []; for (let i = 0; i < 100; i++) b.push({ x: i }); console.log(b[0]);",
        &JsPlugin,
        CompileOptions::default(),
    )
    .expect("compiles");
    assert!(r.explain.contains("kept as array of objects"), "{}", r.explain);
    assert!(r.explain.contains("passed to a method call"), "{}", r.explain);
}

// core.test.ts also tests TypeScript input, which the reference strips with
// sucrase before parsing. The Rust port does not support TypeScript input
// (see the README), so that case has no counterpart here.

#[test]
fn leaves_programs_with_nothing_to_transform_byte_identical() {
    let src = "const a = [1, 2, 3];\n// a comment\nconsole.log(a.length);\n";
    assert_eq!(compile(src, &JsPlugin, CompileOptions::default()).expect("compiles").code, src);
}
