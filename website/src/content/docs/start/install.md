---
title: Install
description: Getting Viscosity running.
---

Viscosity is in early development and **not yet published to npm**. Run it
from source:

```sh
git clone https://github.com/tariqshams/viscosity
cd viscosity/engine/ts
npm install
node packages/cli/src/cli.ts --help
```

It needs **Node.js 22.18 or newer**, which runs the TypeScript sources
directly.

A Rust build of the same compiler, giving identical decisions and output,
lives in `engine/rust` (`cargo build --release`), and it also compiles to
WebAssembly.
