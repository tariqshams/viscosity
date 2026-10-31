# engine/

The Viscosity compiler.

- `ts/`: the TypeScript reference implementation (npm workspaces).
  - `packages/bench`: benchmark harness and baseline suites (M0). See
    [FINDINGS.md](ts/packages/bench/FINDINGS.md).
  - Coming next: `core` (VIR, pass manager, analyses, layout planner, plugin
    API), `frontend-js`, `backend-js`, `cli`, `playground`, and
    `frontend-python`.
- `rust/`: the Track B rebuild (cargo workspace, compiled to WebAssembly). Later.

## Architecture (planned)

```
 source ──► LanguagePlugin.parse ──► LanguagePlugin.lower ──► VIR
                (JS/TS, Python…)                              │
            analyses: shapes · collections · escape/alias · access patterns · cost model · (PGO profile)
                                                              ▼
                                         layout planner (aos | soa | aosoa<N> | hot/cold)
                                                              ▼
                              LanguagePlugin.emit ──► source with typed-array storage
```

Language front-ends and layout strategies are plugins, so new languages and
new layouts can be added without changing the core. Anything the analyses
cannot prove safe is left unchanged.
