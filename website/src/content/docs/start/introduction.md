---
title: Introduction
description: What Viscosity does and when it helps.
---

Most JavaScript keeps data as an **array of objects**:
`[{x, y, vx, vy}, …]`. It is the natural way to write code, but a loop that
only needs `x` and `vx` still drags every other field through the CPU cache.
A **struct of arrays**, with one typed array per field, keeps the values a
loop needs packed together, so the hardware can stream them.

Viscosity is a source-to-source compiler that makes that change for you:

1. It **finds collections**: arrays whose elements are object literals of
   one shape.
2. It **proves safety**: no element is aliased, stored elsewhere, passed to
   unknown code, compared by identity, or given new properties. Every
   field that becomes a typed column provably holds numbers.
3. It **decides** with a cost model: loops that touch fields, size
   estimates (or measured sizes from a profiling run).
4. It **rewrites only what it must**: everything else in your file stays
   byte-for-byte the same.

When it can't prove safety, it leaves the collection as it is and
explains why. Run `viscosity explain` to see its reasoning.

There are two engines with identical output: the TypeScript reference
(JavaScript, TypeScript and Python) and a faster Rust port (JavaScript and
Python), which also runs in the browser as WebAssembly. See
[Install](/start/install/).

Viscosity is by Tariq Shams. **How** it works, from first principles up,
is the subject of [the book](https://viscosity-book.vercel.app). These docs
are about **using** it.
