# Viscosity in Rust

The Rust port of the Viscosity compiler, which is taught in Part XI of
*Viscosity*. Viscosity rewrites JavaScript arrays of objects, and Python
lists of dataclass instances, into struct-of-arrays (or, for JavaScript,
AoSoA) layouts when it can prove the rewrite is safe and expects it to pay
off. It explains every decision.

The TypeScript implementation in [`../ts`](../ts) is the reference. This port
makes the same decisions and emits byte-identical JavaScript, Python and
explain text.
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
 .js ──► frontend-js: parse (oxc) ─► resolve scopes ─► lower ──┐
 .py ──► frontend-python: tokenize ─► parse ─► scopes ─► lower ─┴─► VIR (SSA)
                                                                     │
          core: cfg (dominators, loops) · analysis (collections, shapes,
                known functions, numeric fixpoint, escapes, bounds,
                access patterns, sizes)  ─► plan + explain
                                                                     │
 output ◄── frontend-js / frontend-python: emit (splice source ranges,
            container classes)  ◄────────────────────────────────────┘
```

A language plugin (`LanguagePlugin`) lowers its syntax to VIR and later
rewrites its own source from the plan. The core sees only VIR, so the
analyses and the planner have no language-specific syntax. Where JavaScript
and Python semantics differ (a Python `array('d')` column may only hold
floats, so ints are tracked apart; `/` always gives a float; `**` gives a
float only with an int exponent), the core switches on `Module.language`, as
the reference does.

## Crate map

| crate | path | what it holds |
|---|---|---|
| `viscosity-vir` | `crates/vir` | The IR. A `Module` owns arenas of functions, blocks, bindings and instructions, referred to by typed ids (`ValueId`, `BlockId`, `FuncId`, `BindingId`). Also use lists, a printer, and `js_number` (JavaScript's number formatting). |
| `viscosity-core` | `crates/core` | `builder`: on-the-fly SSA construction (Braun et al., CC 2013). `cfg`: reverse postorder, Cooper–Harvey–Kennedy dominators, natural loops. `analysis`: the layout analyses. `plan`: the cost model and `explain`. `plugin`: the `LanguagePlugin` trait. `compile`: the pipeline. |
| `viscosity-frontend-js` | `crates/frontend-js` | The JavaScript plugin: parse with oxc, `resolve` (scopes), `lower` (oxc AST → VIR), `emit` (range splicing, SoA/AoSoA container classes, bounds-check helper), and `@viscosity` annotations. |
| `viscosity-frontend-python` | `crates/frontend-python` | The Python plugin: `tokens` (INDENT/DEDENT, bracket depth), `parser` (the supported subset, as an arena AST), `lower` (scopes, cells, dataclasses → VIR), `emit` (container classes with `array('d')` or list columns, `_vsc_iter`, `_vsc_ix`), and `# @viscosity` annotations. No dependencies beyond the core. |
| `viscosity-cli` | `crates/cli` | The `viscosity` binary: `build`, `explain`, `profile`; `--mode`, `--bounds`, `--min-size`, `--profile`, `--python-auto`, `--explain`, `--frames`, `--jobs`, `-o`. `.py` files use the Python plugin. `build` and `explain` take several files and compile them in parallel (see [below](#several-files-in-parallel)). It also holds the parity, differential, multi-file and fuzz tests. |
| `viscosity-wasm` | `crates/wasm` | A wasm-bindgen wrapper: `compile(source) -> { code, explain }`, `compileWith(source, mode, bounds, minSize)` (both JavaScript), and `compileLanguage(language, source, mode, bounds, minSize, pythonAuto)` with `language` `"javascript"` or `"python"`. |

Each Rust module corresponds to one TypeScript file: `vir.ts` → `vir`,
`builder.ts` → `core::builder`, `cfg.ts` → `core::cfg`, `analysis.ts` →
`core::analysis`, `plan.ts` → `core::plan`, `plugin.ts` → `core::plugin`,
`resolve.ts` → `frontend_js::resolve`, `lower.ts` → `frontend_js::lower`,
`emit.ts` → `frontend_js::emit`, `index.ts` → `frontend_js` (lib), and
`cli.ts`/`profile.ts` → `viscosity-cli`. In `frontend-python`, `tokens.ts`,
`parser.ts`, `lower.ts` and `emit.ts` map to the modules of the same name,
and `index.ts` to the crate root.

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

### The Python plugin

The reference parses Python with its own tokenizer and recursive-descent
parser, so the port is a direct translation, with three differences of form:

- **Arena AST.** The reference builds plain objects and walks them
  generically (every key, in insertion order, skipping decorators). The port
  keeps nodes in an arena (`parser::Ast`, `NodeId`), and `Ast::children`
  lists each kind's children in the reference's key order, so every walk
  (scopes, cells, the names an unmodelled node reads, parents) visits the
  same nodes in the same order. `SourceRef.node` holds the `NodeId`.
- **Offsets.** The tokenizer works on UTF-8 bytes. Everything it inspects is
  ASCII (non-ASCII text can only appear in strings and comments), so byte
  offsets cut the source exactly where the reference's UTF-16 offsets do.
- **Fail closed.** Syntax outside the subset (comprehensions, `lambda`,
  `try`, slices, dict literals, base classes, default parameters, complex
  numbers, ...) is a `PySyntaxError`. As in the reference, the plugin then
  lowers an empty module: the file is left unchanged and `explain` reports
  nothing ("No arrays of objects found." from the CLI). The reason is kept in
  `PyExtra::unsupported`.

As in the reference, only dataclass defaults that are literals are modelled
(the emitter copies a default's text to each call site), columns are
`array('d')` only for fields proven to hold floats, element loops become
`for p in _vsc_iter(ps)`, unproven accesses go through `_vsc_ix`, and
container classes are named `_Vsc_<name>`, `_Vsc_<name>_2`, ... with
renamed columns that never clash. Python collections are transformed only
when annotated `# @viscosity soa`, or with `--python-auto`.

## Building and testing

```sh
cargo build --release                                        # target/release/viscosity
cargo test --workspace                                       # unit, parity and differential tests
cargo clippy --workspace --all-targets -- -D warnings
cargo build --target wasm32-unknown-unknown -p viscosity-wasm --release
wasm-bindgen --target web --out-dir pkg \
  target/wasm32-unknown-unknown/release/viscosity_wasm.wasm  # wasm-bindgen-cli 0.2.106
```

The npm package `@viscosity/wasm` (`packages/wasm`) wraps this:
`node packages/wasm/build.mjs` builds the nodejs and web targets (plus
`wasm-opt -O3` if binaryen is installed, and the third-party licence texts),
`node packages/wasm/smoke.mjs` packs and installs it and compares every
corpus program with the TS CLI, and `--book` copies the web build into the
book's Playground.

`.cargo/config.toml` turns debug info off for the `dev` and `test` profiles,
which keeps `target/` several times smaller.

The tests:

- **Unit tests** (`cargo test -p viscosity-core` and friends):
  - `crates/core/tests/core.rs` mirrors `core.test.ts`: SSA phis, aliases,
    dominators and nested loops, bounds proofs, interprocedural numeric
    inference, plain columns, size estimates and upper bounds, and explain.
  - The SSA builder and the CFG also have plugin-free tests on hand-built
    VIR, including the fail-closed fixpoint.
  - The JS plugin has tests for line counting, annotations, column naming and
    prelude placement.
  - The Python plugin has tests for INDENT/DEDENT and bracket depth, string
    prefixes, number literals (including one at the very end of the file),
    precedence, unsupported syntax, annotations, column naming and prelude
    placement, and the CPython default (keep objects unless annotated).
  - The wasm crate checks compiling Python by name.
- **Parity** (`crates/cli/tests/parity.rs`): every program compiled with
  default options and with `--bounds assume`, compared against the TS
  engine's output. The test also checks that the fixture set exactly matches
  the programs, that each corpus program's `// viscosity: name=layout` (or
  `# viscosity: name=layout`) header decision holds, and that the
  `viscosity` binary prints the same output.
- **Multi-file CLI** (`crates/cli/tests/multi_file.rs`): `explain a.js b.js`
  is each file's explain under a `== file ==` header, in order, whatever
  `--jobs` is; `build ... -o dir/` writes what single builds print; errors
  (no directory, two inputs with one name, a file that fails to compile)
  are reported; and the TypeScript CLI prints the same, frames included.
- **Fuzzing** (`crates/cli/tests/fuzz.rs`): a fixed-seed run of
  `scripts/fuzz.mjs` (200 programs) against this build. See
  [Fuzzing](#fuzzing).
- **Differential** (`crates/cli/tests/differential.rs`): runs each original
  and compiled JavaScript program with `node` and compares their behaviour.
  Corpus and extra programs run in an isolated VM context
  (`tests/run_isolated.cjs`, a copy of the TS runner) and must print the
  same output and throw the same errors. The benchmarks are compared by
  their checksums. Python programs run with `python3`, as in the TS Python
  differential test: the same stdout and the same exception (the last line
  of stderr); the Python benchmark is compared by its checksum. Each half is
  skipped, with a message, when its interpreter is not installed.

### Test programs and fixtures

- `../ts/packages/frontend-js/test/corpus/*.js`: the reference's corpus.
- `../ts/packages/bench/e2e/*.js`: the end-to-end benchmarks.
- `tests/extra/*.js`: programs written for the port. They cover what the
  corpus barely touches: closures, `switch`, labels, destructuring, classes,
  exports, directives and shebangs, parentheses, non-ASCII source,
  annotations, line breaks and upper-bound sizes.
- `../ts/packages/frontend-python/test/corpus/*.py`: the reference's Python
  corpus (suite `pycorpus`), and `../ts/packages/bench/e2e-py/particles.py`
  (suite `pye2e`). Like the TS Python differential test, they compile with
  `pythonAuto: true`.
- `tests/extra/*.py` (suite `pyextra`): Python programs written for the
  port: annotations under the default options, docstring and
  `from __future__` prelude placement, CRLF, tabs, backslash continuations,
  semicolons, adjacent strings, keyword and default arguments, `global`,
  closures, `break`/`continue`/early returns, renamed columns, numbered
  container classes, and a tokenizer error. A `# viscosity(no-auto):` header
  compiles without `pythonAuto`.
- `tests/expected/<suite>_<name>[.assume].js` (or `.py`) and `.explain.txt`:
  the TS engine's output, generated by `scripts/gen_expected.mjs`. For 13
  programs with refusals (the `FRAMES` list in that script), also
  `<name>.frames.txt`: `viscosity explain --frames`.

After the TypeScript reference changes, regenerate the fixtures with
`node scripts/gen_expected.mjs` (Node ≥ 22.18, which strips types natively),
then run `cargo test`.

## The parity guarantee

For every program in the six suites, and for both bounds modes, the Rust
engine's `code` and `explain` equal the TypeScript engine's, byte for byte.
Today that is 93 programs × 2 = 186 fixture pairs (66 JavaScript programs,
132 pairs; 27 Python programs, 54 pairs), and all 186 match, as do the 13
`--frames` fixtures. The
WebAssembly build reproduces all of them as well. The decisions match because
the analyses are ported step by step and visit things in the same order. That
order decides the order of the messages in `viscosity explain`, so the port
keeps the reference's insertion-ordered maps and sets, stable sorts, use
lists with duplicates, and Gauss–Seidel fixpoint order. Numbers in text are
formatted with JavaScript's algorithm (`vir::js_number`).

Failures are reported as a `CompileError`. JavaScript syntax errors come from
oxc rather than acorn, so their wording differs from the reference's. Python
source outside the subset is not an error (see above).

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

Porting the Python plugin turned up these. All are fixed in both engines,
each with a new program in the reference's Python corpus:

6. **A number literal at the very end of the file** (`tokens.ts`). Past the
   end, `src[i]` is `undefined`, and a regex tests `undefined` as the string
   `"undefined"`. So `/[eE]/` matched, and a file ending in `k = 1` (no line
   break) made `1` a float, which could change int/float decisions (an
   index stored there was no longer provably an int). A file ending in a hex
   literal (`k = 0x1`) hung: `/[0-9a-fA-F_]/` matches `"undefined"` forever.
   The tokenizer now reads with `charAt` (`eof_int_literal.py`,
   `eof_hex_literal.py`).
7. **f-string defaults** (`lower.ts`, `isLiteralDefault`). An f-string is a
   `Constant` node, so `tag: str = f"k={K}"` counted as a literal default.
   Python evaluates it once, at class definition, but the emitter copied it
   to every call site, so the compiled program printed `k=2.0` where the
   original printed `k=1.0` after `K` changed. That was a soundness bug.
   f-strings no longer count as literals (`fstring_default.py`).
8. **`global` of a name the module never assigns** (`lower.ts`). `def f():
   global g; g = 1` crashed the compiler ("Cannot read properties of null")
   because the module scope had no `g`. Such names now get a module binding
   (`global_undeclared.py`).
9. **`len()` of an element** (`lower.ts`, `analysis.ts`). `len(x)` lowers to
   `field.get length`, so for a dataclass with a field named `length`,
   `len(ps[i])` counted as a read of that field, and the emitter crashed
   ("Cannot read properties of undefined"). The read now carries the note
   `"len"`, which the analysis reports as "passed to len()"; the collection
   stays as objects, since the original raises a TypeError there
   (`len_of_element.py`).
10. **Rebound dataclass names** (`lower.ts`). After `P = Twice` (or a second
    `class P`), every `P(...)` call was still compiled as a record of the
    dataclass (the last definition winning), so a program printed `4.0`
    where the original printed `7.0`. That was a soundness bug. A dataclass
    is now modelled only when its class statement is the only module-level
    statement binding the name (a function's `global P` counts as one)
    (`rebound_class.py`).

The Rust core also lagged the reference on two Python rules, now ported: `**`
gives a float only with an int exponent (`(-1.0) ** 0.5` is complex), and
the bailouts for list literals and appends use the Python wording
(dataclass constructor calls, non-literal defaults).

Python quirks found but left as they are (in both engines):

- Raw strings do not skip escaped quotes, so `r'\''` ends early. That almost
  always becomes a syntax error, and so leaves the file unchanged.
- `ClassVar` annotations in a dataclass are treated as fields.

Two minor JavaScript quirks remain, kept for parity:

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
- **`--parser mini`**: there is one JavaScript parser (oxc), so the CLI
  rejects `--parser`. (Python is supported: `.py` files, `--python-auto`,
  and the reference's error for `profile` on Python.)
- **Python profiling**, as in the reference: `viscosity profile x.py` fails
  with "profile runs JavaScript programs only; Python profiling is not
  supported yet".
- **Plan options given as `undefined`** are ignored by the reference's
  `compile()`. Rust options are typed, so they cannot be undefined.
- **AoSoA block sizes of 2^64 and above** saturate in the port (they are
  stored as `u64`). The reference's JavaScript numbers do not. No block size
  that large is usable.

### Fuzzing

`scripts/fuzz.mjs` is a differential fuzzer for both engines. It generates
seeded random programs in the subset Viscosity cares about: arrays of
record literals pushed in loops (or written as literals, or pushed by a
function), field reads and writes in loops of every shape, compound and
logical assignments, updates, conditionals, `break`/`continue`/labels,
functions that take the array or an element, escapes (closures, returns,
`===`, method calls, storing elements elsewhere, destructuring, `delete`,
`in`), out-of-bounds accesses inside `try`/`catch` (and uncaught at the
end), right-hand sides that push, assign or throw, accesses nested in other
accesses, annotations, and number, string and mixed fields. Each program is
checked two ways:

1. **Behaviour**: the original and the compiled program, run with node in a
   fresh VM context, print the same output and throw the same error, with
   `--bounds check` and (for programs that never index out of bounds)
   `--bounds assume`.
2. **Parity**: the TypeScript and the Rust engine give the same code (both
   bounds modes), the same explain text (both modes) and the same
   `explain --frames` text, byte for byte.

```sh
cargo build -p viscosity-cli
node scripts/fuzz.mjs                          # 300 programs, seed 1 (a few seconds)
node scripts/fuzz.mjs --count 20000 --seed 7   # a long campaign
node scripts/fuzz.mjs --seed 7 --only 1234 --print   # show one program
node scripts/fuzz.mjs --count 5000 --reduce    # shrink failing programs
```

It is a node script, next to `gen_expected.mjs`, because two of its three
oracles are JavaScript: the TypeScript engine runs in-process, and so does
the VM that executes the programs. The Rust engine is reached through its
CLI, one call per batch of 250 files (`viscosity build a.js ... -o dir/`),
so it costs a few process starts per batch, not per program. About 100
programs a second.

### Bugs found by fuzzing

About 8,000 programs turned up five bugs, all in both engines (the
port mirrors the reference), all now fixed in both, each with a corpus
program. After the fixes, a further 42,000 programs (seeds 5 to 7 and 101
to 103, with the generator extended to the constructs that found the bugs)
found nothing:

11. **A checked write failed before its right-hand side ran**
    (`write_rhs_first.js`). `ps[i].x = rhs` became
    `ps.x[__vsc_bc(ps, i, 'x', true)] = rhs`, which checks the index first.
    The original evaluates `rhs` first: out of bounds, a read in `rhs`
    threw "Cannot read properties of undefined (reading 'y')" where the
    compiled program threw "Cannot set ...", and effects of `rhs` (an
    assignment, a call) were lost. A soundness bug in check mode.
12. **A write lost when its right-hand side grew the container**
    (`write_rhs_grows.js`). In `ps[3].x = (more(), 77)`, where `more`
    pushes, the compiled `ps.x[3] = ...` fetched the column before the push;
    if the push grew the container (new, larger typed columns), the store
    went into the old column and was lost. Also for `+=`, `||=` and AoSoA.
    A soundness bug.
13. **Rewrites inside a push or an array literal** (`nested_rewrites.js`).
    `ps.push({ x: qs[i].y })` with both collections transformed failed with
    "internal error: overlapping rewrites": the push was rewritten as one
    replacement of the whole object literal.
14. **Rewrites inside an index** (`nested_rewrites.js`). `ps[qs[i].k].x`
    failed the same way: the member was replaced as a whole.
15. **Sequence expressions as indexes** (`sequence_index.js`). An index
    `(k++, 7)` was copied without its parentheses into the bounds check
    (`__vsc_bc(ps, k++, 7, 'x', false)`, which shifts the arguments) or into
    a variable (`const p = k++, 9;`, a syntax error).

The fixes: the analysis now classifies what the rest of each field write can
do (`ElementAccess::rhs`: inert, may only throw, or may run code; an
assignment inside the right-hand side counts, though writes to SSA variables
leave no instruction, so the lowering marks such field writes `"assigns"`).
The emitter keeps the cheap `col[i] = rhs` form where the order cannot be
observed, and otherwise stores late, through `__vsc_set`/`__vsc_seta`,
deciding the bounds check before `rhs` (`__vsc_bk`) but storing after it,
into the column as it is then. Object literals, array literals and members
are now rewritten piece by piece around their values and indexes, so that
those can be rewritten too.

Two smaller observations, left as they are: a right-hand side that reads a
variable in its temporal dead zone counts as inert (so out of bounds the
compiled program reports the bounds error, not the `ReferenceError`), and
an index expression that pushes (`ps[grow()].x`) reads the column fetched
before the push.

### Several files in parallel

`viscosity build a.js b.js c.js -o outdir/` compiles each file into
`outdir/` under its own name (`-o` names a directory when there are several
files, or when it ends in `/` or is one). `viscosity explain a.js b.js`
prints each file's explanation under a `== a.js ==` header, with a blank
line between files. Files are independent, so the Rust CLI compiles them on
`std::thread::scope` threads (`--jobs N`, default one per CPU), each taking
the next file from a shared counter; the output is printed in the order the
files were given, so it does not depend on the number of threads. A file
that fails is reported as `viscosity: a.js: <error>` and the others still
compile; the exit status is then 1. The TypeScript CLI takes the same
arguments and compiles one file at a time. Measured speed-up: see
[`results/parallel-build-2026-10-31.md`](results/parallel-build-2026-10-31.md).

### Code frames

`viscosity explain --frames` prints, under each refusal (`unsafe: ...`),
the line of source it is about, with carets under the code:

```text
ps (line 1) {x, y} → kept as array of objects
  · unsafe: line 5: an element is used by push
    5 | 	if (ps[i].x > 3) keep.push(ps[i]);
      | 	                           ^^^^^
```

The default output is unchanged. Each bailout records the `SourceRef` of
the instruction it is about (`Collection::bailout_sites`, by message): the
element (`ps[i]`) or the name of the array (`ps`) for an escape, the record
literal for a shape mismatch, the index for a non-numeric index, and so on.
Both engines' `SourceRef`s already carried `start`/`end` (UTF-16 offsets in
the reference, UTF-8 byte offsets here) and `line`; the frame counts
columns in code points, so both print the same. The carets run to the end
of the span or of its first line; tabs before the code are kept in the
caret line so that it lines up.

### PGO

`viscosity profile <file>` instruments a JavaScript program and runs it with **`node`**,
exactly as the TS CLI does, so it needs Node.js on the `PATH`. Its JSON output
is byte-identical to the TS CLI's. `--profile profile.json` feeds the measured
sizes to the planner.

## Performance

See [`results/compile-speed-2026-10-31.md`](results/compile-speed-2026-10-31.md)
and, for many files at once, [`results/parallel-build-2026-10-31.md`](results/parallel-build-2026-10-31.md).
Warm and in-process, the Rust engine compiles the benchmark programs about 5
to 8 times faster than the JIT-warmed TS engine (roughly 75–120 µs against
350–820 µs). A whole CLI run is about 2 ms against about 200 ms, mostly
because Node takes much longer to start.

## License

MIT © Tariq Shams
