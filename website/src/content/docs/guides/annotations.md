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
field to be numeric.

In `--mode opt-in`, only annotated collections are considered at all.

In Python, write `# @viscosity soa` on the line above `xs = []`.
