---
title: Contributing and testing
description: How the engines are tested, how to run the fuzzer, and what CI checks.
---

The repository holds two implementations of the compiler that must agree
byte for byte, the book, and this website:

| directory | what it is |
|---|---|
| `engine/ts` | the TypeScript reference engine (npm workspaces: core, the JavaScript and Python plugins, the CLI, the book's Playground bundle, benchmarks) |
| `engine/rust` | the Rust port (a cargo workspace: `vir`, `core`, `frontend-js`, `frontend-python`, `cli`, `wasm`), and `packages/wasm`, the `@viscosity/wasm` package |
| `book` | the book, which teaches how Viscosity works |
| `website` | these docs |

Two house rules: every transform needs a differential test (the original
and the compiled program must behave the same), and every performance
claim needs measured numbers committed with it. See `CONTRIBUTING.md` in
the repository for the book's own rules.

## The TypeScript engine

```sh
cd engine/ts
npm ci
npx tsc -p tsconfig.json --noEmit   # typecheck
npx vitest run                      # unit, corpus and differential tests
```

The Python plugin's differential tests run programs under `python3`.

## The Rust engine

```sh
cd engine/rust
cargo fmt --all --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

The test suite runs the TypeScript engine as its reference, so install
`engine/ts` first (`npm ci`). Tests that need `node` or `python3` are
skipped, with a message, when they are not installed. Beyond unit tests it
checks:

- **Parity**: every test program, compiled with default options and with
  `--bounds assume`, gives exactly the TypeScript engine's code and
  `explain` text (committed in `engine/rust/tests/expected`), as do the
  `--frames` and `--profile` fixtures. After changing the TypeScript
  engine, regenerate them with `node scripts/gen_expected.mjs`.
- **Differential**: each original and compiled program is run with `node`
  (or `python3`) and must print the same output and throw the same errors.
- **Early errors**: programs with an ECMAScript early error, which both
  CLIs must reject, and valid programs close to one, which both must
  accept, with the same error positions where the parsers agree.
- **Multi-file CLI**, **profiles** and **non-UTF-8 file names**.
- **Fuzzing**: a fixed-seed run of the fuzzer, below.

## The fuzzer

`engine/rust/scripts/fuzz.mjs` is a differential fuzzer for both engines.
It generates seeded random programs in the subset Viscosity cares about
(arrays of record literals, field reads and writes in loops of every shape,
escapes, out-of-bounds accesses, annotations, and now and then an early
error) and checks each one two ways:

1. **Behaviour**: the original and the compiled program print the same
   output and throw the same error, with `--bounds check` and, when no
   access is out of bounds, `--bounds assume`.
2. **Parity**: the TypeScript and the Rust engine give the same code, the
   same `explain` text and the same `explain --frames` text, also with a
   random profile. Programs with an early error must be rejected by both.

```sh
cd engine/rust
cargo build -p viscosity-cli
node scripts/fuzz.mjs                                 # 300 programs, seed 1 (a few seconds)
node scripts/fuzz.mjs --count 20000 --seed 7          # a long campaign
node scripts/fuzz.mjs --seed 7 --only 1234 --print    # show one program
node scripts/fuzz.mjs --count 5000 --reduce           # shrink failing programs
```

`cargo test` runs 200 programs with seed 1. The bugs the fuzzer has found
are listed, with the corpus program that covers each, in
`engine/rust/README.md`.

## Packaging

The npm packages are published (0.0.1) and the crates are not on
crates.io yet. All of them can be built from the repository:

- the CLI: `npm pack` in `engine/ts/packages/cli` (see [Install](/start/install/));
- `@viscosity/wasm`: `node packages/wasm/build.mjs` in `engine/rust`, and
  `node packages/wasm/smoke.mjs`, which packs and installs it and compares
  every corpus program with the TypeScript CLI;
- the crates: `cargo package --workspace --allow-dirty` in `engine/rust`
  packs and builds all six in dependency order (remove `target/package`
  afterwards).

## The website

```sh
cd website
npm ci
npm run gen                     # regenerate the CLI, benchmarks and credits pages
npm run build
node scripts/check_links.mjs    # every internal link resolves
```

The CLI reference is generated from the CLI's own `--help` text; don't edit
the generated pages by hand.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull
request:

| job | what it checks |
|---|---|
| engine (TypeScript) | typecheck, `vitest`, then packs the CLI, installs it into an empty directory and runs it |
| engine (Rust) | `cargo fmt --check`, `cargo test --workspace` (with Node, Python and the TypeScript engine installed, so parity, differential, fuzz and multi-file tests all run), `clippy -D warnings`, and a WebAssembly build |
| drip (book companion) | the book companion's TypeScript and Rust tests, and clippy |
| book | the chapter checker, tests, build, link check and a browser smoke test |
| website | build and link check |
