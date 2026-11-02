//! `drip-rs <file>`: run a Drip program.
//!
//! Output goes to stdout and errors to stderr. The exit code is 0, 65 for
//! a compile error, 70 for a runtime error, 66 if the file can't be read,
//! or 64 for bad usage, as with the TypeScript `drip` command.

use std::io::Write;
use std::process::ExitCode;

use drip::compiler::compile;
use drip::debug::disassemble_function;
use drip::gc::Heap;
use drip::{Options, Vm};

const USAGE: &str = "usage: drip-rs [--disassemble] <file>";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let disassemble = args.iter().any(|a| a == "--disassemble");
    let files: Vec<&String> = args.iter().filter(|a| !a.starts_with("--")).collect();
    let [path] = files.as_slice() else {
        eprintln!("{USAGE}");
        return ExitCode::from(64);
    };
    let source = match std::fs::read_to_string(path) {
        Ok(source) => source,
        Err(e) => {
            eprintln!("cannot read {path}: {e}");
            return ExitCode::from(66);
        }
    };

    if disassemble {
        return print_bytecode(&source);
    }

    let outcome = Vm::new(Options::default()).interpret(&source);
    let mut stdout = std::io::stdout().lock();
    for line in &outcome.stdout {
        let _ = writeln!(stdout, "{line}");
    }
    let _ = stdout.flush();
    for line in &outcome.stderr {
        eprintln!("{line}");
    }
    ExitCode::from(outcome.exit_code as u8)
}

/// `--disassemble`: compile only, and print the bytecode.
fn print_bytecode(source: &str) -> ExitCode {
    let mut heap = Heap::new();
    let mut errors = Vec::new();
    let Some(function) = compile(source, &mut heap, &(), &mut errors) else {
        for e in errors {
            eprintln!("{e}");
        }
        return ExitCode::from(65);
    };
    for line in disassemble_function(&heap, function) {
        println!("{line}");
    }
    ExitCode::SUCCESS
}
