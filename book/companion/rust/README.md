# drip-rs

Drip's bytecode virtual machine in Rust: the port that Part X of
*Viscosity* builds chapter by chapter. It behaves exactly like the
TypeScript VM in `../ts/src/vm/` (Part IV): the same compiler, the same
error messages, the same output to the byte, and the same exit codes. It
uses only the standard library and no `unsafe` code.

## Build, run and test

```sh
cargo build --release
cargo run --release --bin drip-rs ../corpus/benchmark/fib.drip
./target/release/drip-rs --disassemble program.drip   # print the bytecode

cargo test                          # unit tests, the corpus, stress GC, CLI
cargo test --test corpus -- closure # just the corpus programs matching "closure"
cargo clippy --all-targets -- -D warnings
scripts/bench.sh                    # benchmarks; writes results/drip-rs-bench-<date>.*
```

`drip-rs <file>` prints the program's output on stdout and its errors on
stderr. It exits with 0, 65 after a compile error, 70 after a runtime
error, or 64 when used wrongly, like `drip --vm` and clox.

The tests:

- `tests/corpus.rs` runs every corpus program the VM is meant to run: 246
  of the 265, skipping the `scanning`, `expressions` and `benchmark` folders, the
  same skip list as `SKIP.vm` in `../ts/test/corpus.ts`. It checks each
  one with a port of `check()` from that file: expected output, compile
  errors with their line numbers, the runtime error message and its line,
  and the exit code. The VM is clox's twin, so `// [c line N]`
  expectations apply and `// [java line N]` ones are ignored. Freed heap
  slots are never reused in this suite, so a collector bug panics instead
  of quietly reading another object.
- `tests/stress_gc.rs` runs the 95 programs in `closure/`, `class/`,
  `inheritance/`, `string/`, `function/`, `super/`, `method/` and `field/`
  with a collection before every allocation.
- `tests/vm.rs` covers the collector, the disassembler and the binary.
- Unit tests in the modules cover the scanner, the opcodes, the arenas,
  the hash table, interning, and number formatting (compared with what
  Node prints for 42 doubles).

The two corpus suites bring their own `main` (`harness = false`), so they
print one line per program.

## Module map

The chapters of Part X follow the pipeline, source to output:

| module | what it is | TypeScript twin |
|---|---|---|
| `scanner.rs` | on-demand scanner; tokens borrow their text from the source | `scanner.ts` |
| `chunk.rs` | the `#[repr(u8)]` `OpCode` enum and `Chunk` (code, lines, constants) | `chunk.ts` |
| `value.rs` | `Value`, a `Copy` enum; printing, with JavaScript's number format | `object.ts` (values) |
| `object.rs` | the heap object structs, `Arena<T>`, and typed handles `Gc<T>` and `StrRef` | `object.ts` (objects) |
| `table.rs` | open-addressing hash table, struct-of-arrays, with tombstones | `table.ts` |
| `gc.rs` | the `Heap`, interning, and the mark-and-sweep collector | `heap.ts` |
| `compiler.rs` | single-pass Pratt compiler, panic-mode error recovery | `compiler.ts` |
| `vm.rs` | the interpreter loop, calls, upvalues, classes, runtime errors | `vm.ts` |
| `debug.rs` | the disassembler (same text as `disassembleChunk`) | `debug.ts` |
| `lib.rs`, `main.rs` | the library's front door, and the `drip-rs` binary | `index.ts`, `cli.ts` |

Some design choices the chapters explain:

- **Arenas and handles, not `Rc<RefCell<..>>`.** Every kind of object lives
  in its own `Arena<T>`, a `Vec` of slots. A reference to an object is a
  `Gc<T>`, a typed `u32` index, and `heap[handle]` reads the object. Rust's
  ownership rules stay simple because only the heap owns objects, and our
  own collector, not reference counting, decides when they die.
- **The roots are passed in.** Allocating never collects on its own,
  because the heap can't see the VM's stack. The VM (or the compiler) asks
  `Heap::should_collect` and then calls `Heap::collect` with its roots,
  given as `&dyn Trace` values.
- **Mark bits outside the objects.** Each collection builds a fresh mark
  bitmap. Marking writes bits and tracing reads objects, so the two never
  fight over a borrow.
- **Strings carry their hash.** `StrRef` holds the index and the hash. A
  `Value` is 16 bytes whatever it holds, so the hash costs nothing, and
  the table never visits the heap to hash a key.
- **Registers.** The running frame's `ip`, chunk and stack base are fields
  of the `Vm`, and each compiled chunk is frozen in an `Rc<Chunk>`. Reading
  a byte is then `self.chunk.code[self.ip]` rather than a walk through the
  frame list and the heap. On `fib` this made the VM about 1.4× faster.

## Behaviour notes

- Numbers print as JavaScript's `String(n)` does, as the TypeScript VM's
  `formatNumber` prints them: `1e+21`, `1.5e-7`, `0.30000000000000004`,
  `NaN`, `Infinity`, and `-0` for negative zero. Rust's `{:e}` already
  gives the shortest round-trip digits; `value::format_number` lays them
  out with JavaScript's thresholds (plain decimals for 1e-7 ≤ |n| < 1e21).
- String hashes are FNV-1a over UTF-8 bytes; the TypeScript VM hashes
  UTF-16 code units. They agree on ASCII strings, and nothing a program can
  see depends on the hash.
- A non-ASCII character outside a string is one "Unexpected character."
  error, as in the TypeScript VM. (The Rust scanner skips the whole UTF-8
  character, so the next token still starts on a character boundary.)
- The one-byte constant operand limits a chunk to 256 constants, as in
  clox and the TypeScript VM. So `benchmark/string_equality.drip` fails to
  compile in both VMs, with the same error.
- In "debug" and "stress" modes the arenas never reuse a freed slot, so a
  use after free panics. This does the job of the TypeScript heap's
  poisoning of freed objects.

## Benchmarks

`scripts/bench.sh` times each `../corpus/benchmark` program (the same set
as `../ts/scripts/bench.mjs`), best of three runs, each in a fresh process,
and puts them beside the TypeScript tree-walker and VM numbers from
`../ts/results/drip-bench-2026-10-31.json`. See `results/` for the
latest table. All the numbers come from the same shared cloud VM, so
allow for noise of tens of percent.

## Credits

Written by Tariq Shams for *Viscosity*. MIT licensed.

The compiler and VM follow clox from *Crafting Interpreters* by Robert
Nystrom. The test corpus in `../corpus` is adapted from that book's test
suite, which is MIT licensed, Copyright (c) 2015 Robert Nystrom; its
license is in `../corpus/LICENSE-craftinginterpreters`.
