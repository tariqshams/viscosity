---
title: Limitations
description: What Viscosity does not do (yet).
---

- **Not on crates.io yet.** The npm packages (`@viscosity/cli`,
  `@viscosity/wasm`) are published, but the Rust crates must be built
  from the repository (see [Install](/start/install/)).
- **No TypeScript in the Rust engine.** TypeScript input needs the
  TypeScript engine.
- **One record shape per collection.** Records must have the same fields
  in the same order.
- **Element identity** isn't preserved for elements that escape. Viscosity
  refuses such collections rather than emulating objects.
- **Method calls** on the array other than `push` (`map`, `sort`,
  `splice`, …) make it refuse.
- **Per-file analysis.** Something exported is treated as escaping. Several
  files can be compiled in one command, but each is analysed on its own.
- AoSoA must be requested with an annotation. In V8 it rarely beat plain
  SoA in this project's measurements.
- The Python front-end covers a subset of Python and is opt-in (see
  [Python](/guides/python/)).
