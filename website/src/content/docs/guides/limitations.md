---
title: Limitations
description: What Viscosity does not do (yet).
---

- **Version 0.0.x.** Everything is published (npm at 0.0.2, crates.io at
  0.0.1; see [Install](/start/install/)), but it is an early release: under Cargo's
  rules every 0.0.z version is incompatible with the next.
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
