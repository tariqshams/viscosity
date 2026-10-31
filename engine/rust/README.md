# Viscosity in Rust

The Rust port of the Viscosity compiler, which is taught in Part XI of
*Viscosity*. Viscosity rewrites JavaScript arrays of objects into
struct-of-arrays (or AoSoA) layouts when it can prove the rewrite is safe and
expects it to pay off. It explains every decision.

The TypeScript implementation in [`../ts`](../ts) is the reference. This port
makes the same decisions and emits byte-identical JavaScript and explain text.
The parity test checks this for every test program (see
[Parity](#the-parity-guarantee)).

```console
$ cargo run --release -p viscosity-cli -- explain ../ts/packages/bench/e2e/particles.js
ps (line 3) {x, y, vx, vy, mass, age, r, g} → struct of arrays
  · loop at line 8 in step() touches 4 of 8 fields (x, vx, y, vy)
  · loop at line 18 in <module>() touches 2 of 8 fields (x, y)
  · typed Float64Array columns for all 8 fields
  · about 200000 elements
  · 2 of 2 element accesses proven in bounds
```

## Architecture

```text
 source ──► frontend-js: parse (oxc) ─► resolve scopes ─► lower ──► VIR (SSA)
                                                                     │
          core: cfg (dominators, loops) · analysis (collections, shapes,
                known functions, numeric fixpoint, escapes, bounds,
                access patterns, sizes)  ─► plan + explain
                                                                     │
 output ◄── frontend-js: emit (splice source ranges, container classes) ◄┘
```

A language plugin (`LanguagePlugin`) lowers its syntax to VIR and later
rewrites its own source from the plan. The core sees only VIR, so the
analyses and the planner have no JavaScript-specific code. They include the
reference's Python semantics, so a Python front end could reuse them.

## Crate map

| crate | path | what it holds |
|---|---|---|
| `viscosity-vir` | `crates/vir` | The IR. A `Module` owns arenas of functions, blocks, bindings and instructions, referred to by typed ids (`ValueId`, `BlockId`, `FuncId`, `BindingId`). Also use lists, a printer, and `js_number` (JavaScript's number formatting). |
| `viscosity-core` | `crates/core` | `builder`: on-the-fly SSA construction (Braun et al., CC 2013). `cfg`: reverse postorder, Cooper–Harvey–Kennedy dominators, natural loops. `analysis`: the layout analyses. `plan`: the cost model and `explain`. `plugin`: the `LanguagePlugin` trait. `compile`: the pipeline. |
| `viscosity-frontend-js` | `crates/frontend-js` | The JavaScript plugin: parse with oxc, `resolve` (scopes), `lower` (oxc AST → VIR), `emit` (range splicing, SoA/AoSoA container classes, bounds-check helper), and `@viscosity` annotations. |
| `viscosity-cli` | `crates/cli` | The `viscosity` binary: `build`, `explain`, `profile`; `--mode`, `--bounds`, `--min-size`, `--profile`, `--explain`, `-o`. It also holds the parity and differential tests. |
| `viscosity-wasm` | `crates/wasm` | A wasm-bindgen wrapper: `compile(source) -> { code, explain }` and `compileWith(source, mode, bounds, minSize)`. |

Each Rust module corresponds to one TypeScript file: `vir.ts` → `vir`,
`builder.ts` → `core::builder`, `cfg.ts` → `core::cfg`, `analysis.ts` →
`core::analysis`, `plan.ts` → `core::plan`, `plugin.ts` → `core::plugin`,
`resolve.ts` → `frontend_js::resolve`, `lower.ts` → `frontend_js::lower`,
`emit.ts` → `frontend_js::emit`, `index.ts` → `frontend_js` (lib), and
`cli.ts`/`profile.ts` → `viscosity-cli`.

### From ESTree to oxc

The reference walks ESTree (from acorn). The port walks oxc's AST, which
differs in ways that matter for parity:

- **Generic traversal.** The reference often walks "all children" (to resolve
  names, or to collect the variables an unmodelled node mentions). The port
  uses `oxc_ast_visit::Visit` with overrides for the node kinds the reference
  handles specially. oxc's default traversal visits children in source order,
  as the reference's `children()` does.
- **Identifiers.** oxc separates references, declarations, property names and
  labels. ESTree uses `Identifier` for all four. Property names and labels
  never resolve in the reference, so the port handles only references and
  declarations.
- **Split node kinds.** Member expressions (computed, static, private),
  exports (with a declaration, with specifiers, re-exports), parameters
  (defaults live in `FormalParameter::initializer`) and directives (oxc keeps
  `"use strict"` apart from the statements) are each mapped back to the
  ESTree shape the reference expects. Comments in `lower.rs` name the ESTree
  case each oxc case mirrors.
- **No live AST after lowering.** The reference keeps ESTree nodes in
  `SourceRef.node`. In the port, `node` is a `NodeRef` index into a side table
  of `JsNode` facts. The table records exactly what the emitter needs: the
  object and index of `a[i]`, whether `a[i]` is itself the object of a member
  expression, the values of an object literal, and the parts of a `for...of`.
- **Offsets and lines.** oxc spans are UTF-8 byte offsets; acorn's are UTF-16
  code units. Every splice in the port uses byte offsets on the Rust `String`,
  so it cuts at the same characters as the reference does on its JavaScript
  string. `tests/extra/unicode_offsets.js` checks this with accented letters,
  emoji and U+2028 ahead of the rewritten code. Use `lines::utf16_offset` if
  you need JavaScript-style offsets. oxc reports no line numbers, so
  `lines::LineIndex` counts them as acorn does (`\r\n`, `\r`, `\n`, U+2028,
  U+2029).

## Building and testing

```sh
cargo build --release                                        # target/release/viscosity
cargo test --workspace                                       # unit, parity and differential tests
cargo clippy --workspace --all-targets -- -D warnings
cargo build --target wasm32-unknown-unknown -p viscosity-wasm --release
wasm-bindgen --target web --out-dir pkg \
  target/wasm32-unknown-unknown/release/viscosity_wasm.wasm  # wasm-bindgen-cli 0.2.106
```

The tests:

- **Unit tests** (`cargo test -p viscosity-core` and friends):
  - `crates/core/tests/core.rs` mirrors `core.test.ts`: SSA phis, aliases,
    dominators and nested loops, bounds proofs, interprocedural numeric
    inference, plain columns, size estimates and upper bounds, and explain.
  - The SSA builder and the CFG also have plugin-free tests on hand-built
    VIR, including the fail-closed fixpoint.
  - The JS plugin has tests for line counting, annotations, column naming and
    prelude placement.
- **Parity** (`crates/cli/tests/parity.rs`): every program compiled with
  default options and with `--bounds assume`, compared against the TS
  engine's output. The test also checks that the fixture set exactly matches
  the programs, that each corpus program's `// viscosity: name=layout` header
  decision holds, and that the `viscosity` binary prints the same output.
- **Differential** (`crates/cli/tests/differential.rs`): runs each original
  and compiled program with `node` and compares their behaviour. Corpus and
  extra programs run in an isolated VM context (`tests/run_isolated.cjs`, a
  copy of the TS runner) and must print the same output and throw the same
  errors. The benchmarks are compared by their checksums. The test is skipped,
  with a message, when `node` is not installed.

### Test programs and fixtures

- `../ts/packages/frontend-js/test/corpus/*.js`: the reference's corpus.
- `../ts/packages/bench/e2e/*.js`: the end-to-end benchmarks.
- `tests/extra/*.js`: programs written for the port. They cover what the
  corpus barely touches: closures, `switch`, labels, destructuring, classes,
  exports, directives and shebangs, parentheses, non-ASCII source,
  annotations, line breaks and upper-bound sizes.
- `tests/expected/<suite>_<name>[.assume].js` and `.explain.txt`: the TS
  engine's output, generated by `scripts/gen_expected.mjs`.

After the TypeScript reference changes, regenerate the fixtures with
`node scripts/gen_expected.mjs` (Node ≥ 22.18, which strips types natively),
then run `cargo test`.

## The parity guarantee

For every program in the three suites, and for both bounds modes, the Rust
engine's `code` and `explain` equal the TypeScript engine's, byte for byte.
Today that is 61 programs × 2 = 122 fixture pairs, and all 122 match. The
WebAssembly build reproduces all of them as well. The decisions match because
the analyses are ported step by step and visit things in the same order. That
order decides the order of the messages in `viscosity explain`, so the port
keeps the reference's insertion-ordered maps and sets, stable sorts, use
lists with duplicates, and Gauss–Seidel fixpoint order. Numbers in text are
formatted with JavaScript's algorithm (`vir::js_number`).

Failures are reported as a `CompileError`. Syntax errors come from oxc rather
than acorn, so their wording differs from the reference's.

### Reference bugs found while porting

The port turned up these bugs in the TypeScript reference. They are now fixed
in the reference (commit 16c7767), and the port mirrors the fixes. The new
corpus programs `throw_from_loop`, `sequence_value` and `comma_field_name`
cover the first three.

1. **`throw` of a removed phi** (`builder.ts`, `tryRemoveTrivialPhi`). Only
   `condbr` and `return` operands were rewritten, so an element thrown from
   inside a loop was not seen as escaping. That was a soundness bug: the
   compiled program threw an index instead of the object.
2. **Parenthesized sequence values** (`emit.ts`). In `push({ y: (a, b) })`,
   the value was spliced without its parentheses, so `y` received `a`.
   Values are now re-parenthesized, in `push(...)` and in `Name.of(...)`
   (`tests/extra/sequence_literal_init.js`).
3. **Shapes compared by joined names** (`analysis.ts`, `setShape`). `{'a,b'}`
   and `{a, b}` counted as the same shape. Field lists are now compared
   exactly.
4. **`export default function () {}`** crashed the resolver. The function is
   now lowered as `default`, and its closure escapes through an `export`
   opaque.
5. **Annotation line breaks** (`index.ts`). To decide whether a comment
   stands on its own line, the reference split the source at `\n` only. Its
   line numbers, like acorn's, also count `\r` and U+2028/U+2029. Both
   engines now split at every ECMAScript line break
   (`tests/extra/annotation_line_breaks.js`).

Two minor quirks remain, kept for parity:

- `p.#x` is treated as the public field `x` in assignment targets and method
  calls (`// NOTE` in `lower.rs`). This is observable only in programs that
  would throw a TypeError anyway, since object-literal records have no
  private fields.
- Hoisting looks into class static blocks.

### Not supported by the port

- **TypeScript input.** The reference strips types with sucrase before
  compiling and emits the stripped JavaScript. Reproducing sucrase's exact
  output is out of scope, so the CLI rejects `.ts`/`.mts`/`.tsx` with a clear
  message.
- **Python input** (the reference's `frontend-python`). The core keeps the
  Python semantics, but there is no Python plugin.
- **`--parser mini` and `--python-auto`**: there is one parser (oxc), and no
  Python plugin.
- **Plan options given as `undefined`** are ignored by the reference's
  `compile()`. Rust options are typed, so they cannot be undefined.
- **AoSoA block sizes of 2^64 and above** saturate in the port (they are
  stored as `u64`). The reference's JavaScript numbers do not. No block size
  that large is usable.

### PGO

`viscosity profile <file>` instruments the program and runs it with **`node`**,
exactly as the TS CLI does, so it needs Node.js on the `PATH`. Its JSON output
is byte-identical to the TS CLI's. `--profile profile.json` feeds the measured
sizes to the planner.

## Performance

See [`results/compile-speed-2026-10-31.md`](results/compile-speed-2026-10-31.md).
Warm and in-process, the Rust engine compiles the benchmark programs about 5
to 8 times faster than the JIT-warmed TS engine (roughly 75–120 µs against
350–820 µs). A whole CLI run is about 2 ms against about 200 ms, mostly
because Node takes much longer to start.

## License

MIT © Tariq Shams
