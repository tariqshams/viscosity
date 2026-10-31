---
title: Limitations
description: What Viscosity does not do (yet).
---

- **Not published to npm yet.** Run it from source.
- **One record shape per collection.** Records must have the same fields
  in the same order.
- **Element identity** isn't preserved for elements that escape. Viscosity
  refuses such collections rather than emulating objects.
- **Method calls** on the array other than `push` (`map`, `sort`,
  `splice`, …) make it refuse.
- **Per-file analysis.** Something exported is treated as escaping.
- AoSoA must be requested with an annotation. In V8 it rarely beat plain
  SoA in this project's measurements.
- The Python front-end covers a subset of Python and is opt-in (see
  [Python](/guides/python/)).
