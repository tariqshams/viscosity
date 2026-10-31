---
title: Bounds and errors
description: How out-of-range accesses behave after compilation.
---

Reading `xs[i].x` with a bad `i` throws a `TypeError` in plain JavaScript
(`xs[i]` is `undefined`). A typed array would quietly return `undefined`
instead, so Viscosity keeps the original behaviour.

- **Proven accesses** (inside `for (let i = 0; i < xs.length; i++)`,
  `for (const p of xs)`, and similar loops, including outer-loop indexes and
  `&&` conditions) compile to a plain `xs.x[i]`.
- **Other accesses** compile to `xs.x[__vsc_bc(xs, i, 'x', false)]`. The
  helper returns `i` when it is in range and otherwise throws
  `TypeError: Cannot read properties of undefined (reading 'x')`, the same
  message V8 gives.

`--bounds assume` drops the checks. Use it only when you are sure every
index is valid.
