---
title: Python
description: The Python subset and why it is opt-in.
---

Viscosity reads a numeric subset of Python:

- `@dataclass` classes with annotated fields
- lists built with `[]` and `.append(Record(...))`
- `for` loops over `range(...)` or over a list, `while` and `if`
- functions, `global`, arithmetic, `math.*`

Files outside the subset are left exactly as they are (this is not an
error).

Both engines read Python: the TypeScript CLI and the Rust CLI compile `.py`
files with the same results, byte for byte.

It lowers to the same IR and runs the same analyses as JavaScript. Typed
`array('d')` columns are used only for fields that provably always hold
**floats**: in Python an `int` would come back as a float and print
differently.

**Why it is opt-in:** in CPython, reading an `array('d')` element creates
a new float object each time, so columns measured *slower* per element than
dataclass objects (see [Benchmarks](/project/benchmarks/)). They used about
5× **less memory**. Annotate a list with `# @viscosity soa` when memory
matters, or pass `--python-auto` to transform every safe list.
