# Compile speed: TypeScript engine vs Rust port (2026-10-31)

Both engines compiled the five end-to-end benchmark programs in
`engine/ts/packages/bench/e2e/` (`boids`, `heat`, `ledger`, `nbody`,
`particles`: 23 to 31 lines each) with default options. Both produced
byte-identical output, which the parity test checks.

**Machine.** A shared cloud VM: 4 vCPUs, Intel Xeon @ 2.10 GHz. Node
v22.23.4 (V8, with native type stripping). rustc 1.97.0, release profile
(`lto = "thin"`, `codegen-units = 1`). Other tenants share the VM, so
individual timings vary by up to about 2x between runs. The minimums are the
most stable figures; the medians are listed to show the spread.

## 1. In-process: one `compile()` call, warm

This measures the engine alone: parse, resolve, lower, analyze, plan and emit.
Each file is compiled 100 times as warm-up (so V8 has optimized the TS
engine), then 500 timed calls.

- TS: `node scripts/compile_speed.mjs`
- Rust: `cargo run --release -p viscosity-cli --example compile_speed`

Results in microseconds per compile. Each column shows median / min. The
three rounds were run back to back, alternating engines.

| program   | TS round 1  | TS round 2  | TS round 3   | Rust round 1 | Rust round 2 | Rust round 3 |
|-----------|------------:|------------:|-------------:|-------------:|-------------:|-------------:|
| boids     | 1526 / 820  | 1098 / 818  | 1070 / 817   | 120 / 107    | 138 / 109    | 125 / 106    |
| heat      |  773 / 584  |  881 / 592  |  838 / 568   | 116 / 101    | 128 / 114    | 168 / 102    |
| ledger    |  543 / 420  |  593 / 412  |  545 / 386   |  83 / 74     |  86 / 73     | 138 / 109    |
| nbody     |  776 / 642  |  733 / 629  | 1079 / 648   | 179 / 121    | 143 / 120    | 162 / 122    |
| particles |  491 / 353  |  451 / 345  |  670 / 355   | 134 / 95     |  83 / 74     | 135 / 74     |

**Summary.** On best-case (minimum) times the Rust engine is **about 5x to 8x
faster** than the warm, JIT-optimized TS engine: 73–122 µs against 345–820 µs
per program. On medians the ratio is about 4x to 9x.

Where the Rust time goes (callgrind profile of `nbody.js`; the timing harness
was removed afterwards): parsing with oxc takes about 10–17 µs. Scope
resolution plus lowering take about 80 µs, analysis about 35 µs, and plan plus
emit about 25 µs. No single phase dominates. The largest costs are small heap
allocations (strings in the IR, per-block maps) and hashing. Switching the
internal maps from SipHash to FxHash (`rustc-hash`) cut about 10–40%. I did not
optimize further. The port is a faithful translation of the reference, and I
kept it that way rather than restructuring it for speed.

## 2. Whole process: one CLI invocation

This is what a user waits for: `viscosity build <file>`, timed from process
start to exit, output discarded. Each figure is the median (and minimum) of 20
runs.

- TS: `node engine/ts/packages/cli/src/cli.ts build <file>`
- Rust: `engine/rust/target/release/viscosity build <file>`

| program   | TS (ms)  | TS min | Rust (ms) | Rust min | ratio (medians) |
|-----------|---------:|-------:|----------:|---------:|----------------:|
| boids     | 200.5    | 165.3  | 2.22      | 1.83     | ~90x            |
| heat      | 198.5    | 168.3  | 1.70      | 1.52     | ~117x           |
| ledger    | 174.9    | 163.2  | 2.16      | 1.68     | ~81x            |
| nbody     | 207.1    | 176.8  | 2.35      | 2.04     | ~88x            |
| particles | 227.3    | 168.9  | 2.09      | 1.69     | ~109x           |

**Summary.** About **80x to 120x faster** end to end. This gap is almost
entirely start-up cost, not compiler speed. The TS CLI pays for starting Node,
loading and type-stripping the TypeScript sources, loading acorn and sucrase,
and running cold (unoptimized) code. The Rust binary starts in about 1 ms. For
one-off builds and editor integrations, this is the number that matters. For
compiling many files in one long-running process, section 1 is the fair
comparison.

## Caveats

- These are small programs (under 1 KB of source each), so fixed per-compile
  costs such as allocator warm-up and line-index construction weigh more than
  they would on large inputs. I did not measure scaling on large inputs.
- The TS engine's in-process numbers depend on JIT warm-up. The first
  `compile()` call in a fresh process took 22 ms (`boids`) and 27 ms
  (`nbody`), about 25x its warm time.
- The WebAssembly build (`viscosity_wasm.wasm`, 1.25 MB before
  `wasm-bindgen` and before `wasm-opt`) was checked for correctness (114/114
  fixtures from Node) but not benchmarked.

## Note (2026-11-01)

Added later; the measurements above are unchanged. The WebAssembly build has
since been timed in process: see
[`matrix-2026-10-31`](../../ts/packages/bench/results/matrix-2026-10-31.md),
section (b), which compares the TS engine with `@viscosity/wasm` (nodejs
target) on the same Node over the 40-program JavaScript corpus (not the five
programs above). The current size of the wasm module is in the
[`packages/wasm` README](../packages/wasm/README.md): about 1.3 MB, 0.5 MB
gzipped, for the module `packages/wasm/build.mjs` builds (after
`wasm-bindgen`).
