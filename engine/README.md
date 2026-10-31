# engine/

The Viscosity compiler, in two implementations that must agree byte for
byte.

- [`ts/`](ts/): the TypeScript reference implementation (npm workspaces).
  - `packages/core`: VIR (an SSA IR built with Braun et al.'s algorithm),
    CFG utilities (dominators, natural loops), the analyses (collections,
    shapes, escape and alias, numeric kinds, bounds proofs, access patterns,
    size estimates), the layout planner, `explain`, and the `LanguagePlugin`
    interface.
  - `packages/frontend-js`: JavaScript and TypeScript (acorn, or the book's
    hand-written parser; TypeScript is stripped with sucrase) and the
    range-splicing emitter.
  - `packages/frontend-python`: a Python-subset plugin (dataclass records,
    `array('d')` columns).
  - `packages/cli`: `viscosity build | explain | profile`, bundled for npm.
  - `packages/playground`: the browser bundle used by the book.
  - `packages/bench`: the benchmark harness, suites, end-to-end programs and
    committed results. See [FINDINGS.md](ts/packages/bench/FINDINGS.md).
- [`rust/`](rust/): the Rust port (cargo workspace: `vir`, `core`,
  `frontend-js` on oxc, `frontend-python`, `cli`, `wasm`). JavaScript and
  Python input (no TypeScript); 186/186 parity fixtures identical to the
  TypeScript engine, checked further by a differential fuzzer
  (`rust/scripts/fuzz.mjs`). See its [README](rust/README.md).

## Architecture

```
 source ──► LanguagePlugin.lower (parse + lower) ──► VIR (SSA, CFG)
            (JavaScript/TypeScript, Python)            │
     analyses: collections · shapes · escape/alias · numeric kinds ·
               bounds proofs · access patterns · size (or a PGO profile)
                                                       ▼
                       layout planner: aos | soa | aosoa(N), with reasons
                                                       ▼
            LanguagePlugin.emit ──► the same source, with only the
                                    necessary ranges rewritten
```

Language front-ends are plugins, so a new language doesn't touch the core.
The layouts are implemented by each front-end's emitter. Anything the
analyses can't prove safe is left unchanged, and `viscosity explain` says
why.
