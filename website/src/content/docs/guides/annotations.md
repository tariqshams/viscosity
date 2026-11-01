---
title: Annotations
description: Steering decisions with @viscosity comments.
---

Put an annotation comment on the line above the declaration:

```js
// @viscosity soa        transform (if safe), even if small or loop-free
const particles = [];

// @viscosity aos        never transform this one
const ui = [];

// @viscosity aosoa(8)   blocks of 8, field-major within a block
const grid = [];
```

Annotations never override **safety**: an annotated collection that isn't
provably safe is still left alone, with the reason. `aosoa` requires every
field to be numeric. Its block size must be a power of two from 2 to 65536
(a plain `aosoa`, without parentheses, means 8); any other size, such as
`aosoa(12)` or `aosoa(x)`, keeps the collection as objects, and `explain`
says why (see [Errors and validation](/reference/errors/#annotations)).

In `--mode opt-in`, only annotated collections are considered at all.

In Python, write `# @viscosity soa` on the line above `xs = []`.
