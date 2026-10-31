# Viscosity

**An automatic data-layout optimizer for JavaScript and TypeScript, and an
interactive book about how to build it.** By Tariq Shams.

You write ordinary code: an array of objects. Viscosity analyses how your
program uses that data and, where it is provably safe and measurably faster,
rewrites the storage as a *struct of arrays* (SoA) or blocked *AoSoA* backed
by typed arrays. Your code keeps the same behaviour.

Status: **working, pre-release.** The TypeScript compiler (JavaScript,
TypeScript and Python front-ends), its Rust port (byte-for-byte identical
output, also built to WebAssembly) and both Drip implementations are built
and tested. It is not yet published to npm or crates.io.

Measured end to end on Node 22 (committed results in
[`engine/ts/packages/bench/results`](engine/ts/packages/bench/results)):
particles 4.3×, ledger 5.1×, heat 3.3×, boids 1.18×, n-body 1.09× faster.

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
| Next | Publish to npm and crates.io; a WebAssembly playground; more layouts | |

## Credits

Viscosity builds on other people's research and teaching. See
[ATTRIBUTION.md](ATTRIBUTION.md), and the book's
[acknowledgements](book/src/pages/acknowledgements.astro) and
[bibliography](book/src/data/references.js).

## License

[MIT](LICENSE) © Tariq Shams. Third-party material is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
