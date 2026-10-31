---
title: Install
description: Getting Viscosity running.
---

Viscosity is in early development and **not yet published to npm**. There
are three ways to run it.

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
npm install -g ./viscosity-cli-0.1.0.tgz
viscosity --version
```

## The Rust build

`engine/rust` is a port of the same compiler to Rust. Its output and its
`explain` reports are byte-for-byte identical to the TypeScript version's
on the shared test programs, and it starts and compiles much faster.

```sh
cd viscosity/engine/rust
cargo build --release
./target/release/viscosity explain app.js
```

The Rust build reads JavaScript only. TypeScript and Python input need the
TypeScript build. It also compiles to WebAssembly (the `viscosity-wasm`
crate), so the same compiler can run in a browser.
