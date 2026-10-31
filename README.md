# Viscosity

**An automatic data-layout optimizer for JavaScript and TypeScript, and an
interactive book about how to build it.** By Tariq Shams.

You write ordinary code: an array of objects. Viscosity analyses how your
program uses that data and, where it is provably safe and measurably faster,
rewrites the storage as a *struct of arrays* (SoA) or blocked *AoSoA* backed
by typed arrays. Your code keeps the same behaviour.

Status: **early.** The benchmark harness (milestone M0) is done, and the
compiler itself is being built in stages. See the roadmap below.

## The monorepo

| Folder | What it is |
|---|---|
| [`engine/`](engine/) | The compiler. `engine/ts` is the TypeScript reference implementation. `engine/rust` (later) is the Rust rebuild. |
| [`book/`](book/) | *Viscosity: From a Little JavaScript to Engines and Compilers*: an interactive, mobile-first web book that teaches everything needed to build this, from `if` statements up. |
| [`website/`](website/) | viscosity.dev: the landing page and the user docs for the compiler. |

## Quick start

```bash
# Engine: run the tests and the baseline benchmarks
cd engine/ts && npm install && npm test && npm run bench
```

```bash
# Book: check the chapters, build the site, run the smoke tests
cd book && npm install && npm run check:chapters && npm run build && npm run check && npm run smoke
```

```bash
# Read the book locally
cd book && npm run dev
```

## Roadmap

| Milestone | What | Status |
|---|---|---|
| M0 | Benchmark harness and hand-written AoS / SoA / AoSoA baselines | ✅ ([findings](engine/ts/packages/bench/FINDINGS.md)) |
| M1 | Drip tree-walking interpreter (the book's teaching language) | next |
| M2 | Drip bytecode VM | |
| M3 | Viscosity core: VIR (IR), plugin API, JS front-end, round-trip emit | |
| M4 | Opt-in SoA transform | |
| M5 | Automatic mode: shape, escape, alias and access-pattern analysis, cost model | |
| M6 | AoSoA, hot/cold splitting, profile-guided optimization | |
| M7 | Python front-end plugin (proves the multi-language architecture) | |
| Track B | Rust rebuild of the VM and the engine, compiled to WebAssembly | |

## Credits

Viscosity builds on other people's research and teaching. See
[ATTRIBUTION.md](ATTRIBUTION.md), and the book's
[acknowledgements](book/src/pages/acknowledgements.astro) and
[bibliography](book/src/data/references.js).

## License

[MIT](LICENSE) © Tariq Shams. Third-party material is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
