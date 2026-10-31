//! Drip's bytecode virtual machine, in Rust: the port taught in Part X of
//! *Viscosity*. It behaves exactly like the TypeScript VM of Part IV.
//!
//! The pipeline is source → [`scanner`] → [`compiler`] → bytecode in a
//! [`chunk`] → [`vm`]. Values ([`value`]) refer to objects ([`object`])
//! that live in a garbage-collected heap ([`gc`]); classes, instances and
//! globals use the hash [`table`]. [`debug`] prints bytecode.

#![forbid(unsafe_code)]

pub mod chunk;
pub mod compiler;
pub mod debug;
pub mod gc;
pub mod object;
pub mod scanner;
pub mod table;
pub mod value;
pub mod vm;

pub use vm::{Options, Outcome, Vm};

/// Compile and run a program in a fresh VM.
pub fn run(source: &str, options: Options) -> Outcome {
    Vm::new(options).interpret(source)
}
