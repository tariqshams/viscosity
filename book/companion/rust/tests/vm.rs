//! The VM's own tests, beside the corpus: the collector, the
//! disassembler and the command-line program.

use std::process::Command;

use drip::compiler::compile;
use drip::debug::disassemble_function;
use drip::gc::Heap;
use drip::{Options, Vm};

#[test]
fn the_collector_frees_unreachable_objects_and_keeps_reachable_ones() {
    let mut vm = Vm::new(Options { debug_gc: true, ..Options::default() });
    let outcome = vm.interpret(
        r#"
        let keep = "kept";
        for i in 0..2000 { let s = "tmp" + str(i); let xs = [s, [s]]; }
        class A {}
        let a = new A();
        a.f = keep + "!";
        let list = [a, "in a list"];
        "#,
    );
    assert_eq!(outcome.exit_code, 0);
    let before = vm.heap.live_objects();
    vm.collect_garbage();
    assert!(vm.heap.freed > 0);
    assert!(vm.heap.live_objects() <= before);
    // Globals survive, and the next program can use them.
    assert_eq!(vm.interpret("print a.f; print list[1];").stdout, ["kept!", "in a list"]);
}

#[test]
fn programs_that_allocate_a_lot_trigger_collections() {
    let mut vm = Vm::default();
    let outcome = vm.interpret(
        r#"
        class Node { init(next) { self.next = next; } }
        for i in 0..100000 { new Node(new Node(none)); }
        print "done";
        "#,
    );
    assert_eq!(outcome.stdout, ["done"]);
    assert!(vm.heap.collections > 0);
}

#[test]
fn a_runtime_error_leaves_the_vm_usable() {
    let mut vm = Vm::default();
    let outcome = vm.interpret("let x = 1;\nfn f() { return -none; }\nf();");
    assert_eq!(outcome.exit_code, 70);
    assert_eq!(
        outcome.stderr,
        [
            "runtime error: cannot negate none",
            "  at line 2 in fn f",
            "  at line 3 in script"
        ]
    );
    assert_eq!(vm.interpret("print x;").stdout, ["1"]);
}

#[test]
fn the_disassembler_prints_readable_bytecode() {
    let mut heap = Heap::new();
    let source = "fn add(a, b) { return a + b; }\nprint add(1, 2);";
    let function = compile(source, &mut heap, &(), &mut Vec::new()).expect("compiles");
    let text = disassemble_function(&heap, function).join("\n");
    for expected in [
        "== <script> ==",
        "0000    1 closure             0 fn add",
        "define.global       1 'add'",
        "0006    2 load.global         2 'add'",
        "call                2",
        "== add ==",
        "0000    1 load.local          1",
        "add",
        "return",
    ] {
        assert!(text.contains(expected), "missing {expected:?} in\n{text}");
    }
}

/// Run the `drip-rs` binary on a program; return (stdout, stderr, code).
fn run_cli(name: &str, source: &str) -> (String, String, i32) {
    let path = std::env::temp_dir().join(format!("drip-rs-test-{name}.drip"));
    std::fs::write(&path, source).expect("write the program");
    let output = Command::new(env!("CARGO_BIN_EXE_drip-rs"))
        .arg(&path)
        .output()
        .expect("run drip-rs");
    let _ = std::fs::remove_file(&path);
    (
        String::from_utf8(output.stdout).expect("utf-8"),
        String::from_utf8(output.stderr).expect("utf-8"),
        output.status.code().expect("exit code"),
    )
}

#[test]
fn the_cli_exits_like_the_typescript_one() {
    assert_eq!(run_cli("ok", "print 1 + 2;"), ("3\n".into(), "".into(), 0));
    let compile_error = run_cli("compile", "print 1 +;");
    assert_eq!(compile_error.1, "line 1: expected an expression, found ';'\n");
    assert_eq!(compile_error.2, 65);
    let runtime_error = run_cli("runtime", "print 1;\nprint none + 1;");
    assert_eq!(runtime_error.0, "1\n");
    let message = "runtime error: cannot add none and a number\n  at line 2 in script\n";
    assert_eq!(runtime_error.1, message);
    assert_eq!(runtime_error.2, 70);
}

#[test]
fn the_cli_explains_its_usage() {
    let output = Command::new(env!("CARGO_BIN_EXE_drip-rs")).output().expect("run");
    assert_eq!(output.status.code(), Some(64));
    assert!(String::from_utf8_lossy(&output.stderr).starts_with("usage: drip-rs"));
    let missing = Command::new(env!("CARGO_BIN_EXE_drip-rs"))
        .arg("/no/such/file.drip")
        .output()
        .expect("run");
    assert_eq!(missing.status.code(), Some(66));
}
