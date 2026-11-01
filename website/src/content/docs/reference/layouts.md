---
title: Layouts
description: The storage strategies.
---

| layout | storage | chosen |
|---|---|---|
| `aos` | the original array of objects | when unsafe, too small, or not worth it |
| `soa` | one column per field: `Float64Array` for numeric fields, plain arrays otherwise | automatically, when safe and profitable |
| `aosoa(N)` | blocks of N elements, field-major within a block, in one `Float64Array` | only with `// @viscosity aosoa(N)`; all fields numeric |

Generated container classes are named `__Vsc_<name>` (in Python,
`_Vsc_<name>`). They keep a `length` (in Python, `__len__`), so
`xs.length` (or `len(xs)`) keeps working unchanged.
