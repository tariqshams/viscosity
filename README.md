# Viscosity

**An automatic data-layout optimizer for JavaScript and TypeScript, and an
interactive book about how to build it.** By Tariq Shams.

You write ordinary code: an array of objects. Viscosity analyses how your
program uses that data and, where it is provably safe and measurably faster,
rewrites the storage as a *struct of arrays* (SoA) or blocked *AoSoA* backed
by typed arrays. Your code keeps the same behaviour.

Status: **working, pre-release.** The TypeScript compiler (JavaScript,
TypeScript and Python front-ends) and its Rust port (JavaScript and Python;
byte-for-byte identical output on 190 fixture pairs, kept honest by a
differential fuzzer, also built to WebAssembly) are built and tested, as
are three Drip implementations (tree-walker, TS VM, drip-rs). The book's
200 chapters are written. Version 0.0.1 is published: the npm packages
(`npm install -g @viscosity/cli`, `npm install @viscosity/wasm`) and the
six Rust crates on crates.io (`cargo install viscosity-cli`).

Measured end to end, original vs compiled, best of 9 fresh processes on a
shared 4-vCPU VM
([`matrix-2026-10-31.md`](engine/ts/packages/bench/results/matrix-2026-10-31.md)):

| program | Node 22 (V8) | Bun 1.4 (JavaScriptCore) |
|---|---:|---:|
| particles | 4.37× | 3.0× |
| heat | 4.11× | 1.02× |
| ledger | 3.75× | 2.88× |
| boids | 1.31× | 1.85× |
| n-body | 1.2× | 0.97× |
| geometric mean | 2.54× | 1.74× |

## The monorepo

| Folder | What it is |
|---|---|
| [`engine/`](engine/) | The compiler. `engine/ts` is the TypeScript reference implementation; `engine/rust` is the Rust port. |
| [`book/`](book/) | *Viscosity: From a Little JavaScript to Engines and Compilers*: an interactive, mobile-first web book that teaches everything needed to build this, from `if` statements up. |
| [`website/`](website/) | viscosity.dev: the landing page and the user docs for the compiler. |

## Quick start

```bash
# Engine (TypeScript): tests, then try it
cd engine/ts && npm install && npm test
node packages/cli/src/cli.ts explain packages/frontend-js/test/corpus/basic_soa.js
```

```bash
# Engine (Rust): tests, including byte-for-byte parity with the TypeScript engine
cd engine/rust && cargo test --workspace
```

```bash
# The book's companion code: Drip in TypeScript (tree-walker + VM) and in Rust
(cd book/companion/ts && npm install && npm test)
(cd book/companion/rust && cargo test)
```

```bash
# Book: check the chapters, build the site, run the smoke tests
cd book && npm install && npm run check:chapters && npm run build && npm run check && npm run smoke
```

## Roadmap

| Milestone | What | Status |
|---|---|---|
| M0 | Benchmark harness and hand-written AoS / SoA / AoSoA baselines | ✅ ([findings](engine/ts/packages/bench/FINDINGS.md)) |
| M1 | Drip tree-walking interpreter (the book's teaching language) | ✅ `book/companion/ts` |
| M2 | Drip bytecode VM | ✅ `book/companion/ts/src/vm` (583 tests incl. the converted Crafting Interpreters suite) |
| M3 | Viscosity core: VIR (SSA IR), plugin API, JS front-end (acorn or hand-written parser), round-trip emit | ✅ |
| M4 | Opt-in SoA transform (`// @viscosity soa`) | ✅ |
| M5 | Automatic mode: shape, escape, alias and access-pattern analysis, bounds proofs, cost model, `explain` | ✅ |
| M6 | AoSoA, mixed typed/plain columns, profile-guided sizes | ✅ (hot/cold is split by type only) |
| M7 | Python front-end plugin (proves the multi-language architecture) | ✅ |
| Track B | drip-rs (Rust VM) and the Rust engine, compiled to WebAssembly | ✅ `book/companion/rust`, `engine/rust` |
| Tooling | Differential fuzzer, parallel multi-file builds, `explain --frames`, `@viscosity/wasm`, the book Playground on the Rust engine, CI | ✅ |
| Next | Publish to npm and crates.io (packages and crates are ready to pack); hot/cold splitting by access frequency; more layouts | |

## Credits

Viscosity builds on other people's research and teaching. See
[ATTRIBUTION.md](ATTRIBUTION.md), and the book's
[acknowledgements](book/src/pages/acknowledgements.astro) and
[bibliography](book/src/data/references.js).

## License

[MIT](LICENSE) © Tariq Shams. Third-party material is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
