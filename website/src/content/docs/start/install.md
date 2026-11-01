---
title: Install
description: Getting Viscosity running.
---

Viscosity is in early development and **not published** to npm or
crates.io yet. You build it from the repository. There are two engines,
which give the same output:

- the **TypeScript engine** (`engine/ts`), the reference, which reads
  JavaScript, TypeScript and Python;
- the **Rust engine** (`engine/rust`), a port that reads JavaScript and
  Python (not TypeScript) and starts and compiles much faster. It also
  builds to WebAssembly.

## From source (TypeScript)

```sh
git clone https://github.com/tariqshams/viscosity
cd viscosity/engine/ts
npm install
node packages/cli/src/cli.ts --help
```

This runs the TypeScript sources directly, so it needs **Node.js 22.18 or
newer**.

## As a packaged CLI

The CLI package bundles everything into one file with no runtime
dependencies, and runs on **Node.js 18 or newer**. Until it is published,
you can build the tarball yourself and install it:

```sh
cd viscosity/engine/ts/packages/cli
npm pack
npm install -g ./viscosity-cli-0.0.1.tgz
viscosity --version
```

## The Rust build

`engine/rust` is a port of the same compiler to Rust (1.97 or newer). On
every shared test program, its compiled code and its `explain` reports
are byte-for-byte identical to the TypeScript engine's, for JavaScript and
for Python, and a differential fuzzer keeps checking that (see
[Contributing and testing](/project/contributing/)).

```sh
cd viscosity/engine/rust
cargo build --release
./target/release/viscosity explain app.js
./target/release/viscosity explain --python-auto particles.py
```

It takes the same commands and options as the TypeScript CLI (`build`,
`explain`, `profile`, several files at once, `--frames`, `--profile`, ...),
with two exceptions:

- **No TypeScript input.** `.ts`, `.mts` and `.tsx` files are refused with
  a message; strip the types first, or use the TypeScript engine.
- **No `--parser`**: there is one JavaScript parser (oxc).

`viscosity profile` runs your program with `node`, as the TypeScript CLI
does, so it needs Node.js on the `PATH`.

The crates are set up so that `cargo package` works, but they are not on
crates.io; build from the repository.

## WebAssembly (`@viscosity/wasm`)

The Rust engine also compiles to WebAssembly, wrapped as the npm package
`@viscosity/wasm` in `engine/rust/packages/wasm`. It is **not published**:
you build and pack it yourself. It needs the `wasm32-unknown-unknown` Rust
target and `wasm-bindgen-cli` 0.2.106 (binaryen's `wasm-opt` is optional).

```sh
cd viscosity/engine/rust/packages/wasm
npm install          # binaryen, for the optional wasm-opt step
npm pack             # runs build.mjs (Node and browser targets), then packs
                     # viscosity-wasm-0.0.1.tgz, to install in your project
```

```js
import { compile, compileLanguage } from '@viscosity/wasm';

const { code, explain } = compile(source);   // JavaScript, default options
const py = compileLanguage('python', source, 'auto', 'check', 64, true);
```

In a browser, call the default export (`await init()`) first; it fetches
the `.wasm` file. Compile errors throw an `Error` whose message has the same
`<message> (line:column)` form as the CLI's.

The [book's](/book/) Playground uses this
build: its TS / Rust toggle switches to the Rust engine, whose `.wasm` file
is downloaded only when you pick it.
