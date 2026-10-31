---
title: How Viscosity decides
description: The safety rules and the cost model.
---

For every array that holds object literals, Viscosity answers three
questions, in order.

## 1. Is it a collection?

The array must be created **once** (`const xs = []` or an array literal of
object literals). Its records must be added with `push({...})` or appear in
the literal, and every record must have **the same fields in the same
order**.

## 2. Is it safe?

Every use of the array and of its elements must be one Viscosity can
rewrite:

| allowed | refused (with the reason shown in `explain`) |
|---|---|
| `xs.length`, `xs.push({...})` | other methods: `xs.map`, `xs.sort`, … |
| `xs[i].f`, `xs[i].f = v`, `xs[i].f += v` | an element passed to a function, stored, returned, or compared with `===` |
| `const p = xs[i]; p.f` | adding a property the records don't have |
| `for (const p of xs)` | the array passed to unknown code or exported |
| passing `xs` to a function whose every caller passes `xs` | the variable reassigned |

## 3. Will it pay off?

- At least one **loop** must read or write fields.
- The estimated (or [profiled](/guides/profiling/)) size must reach
  `--min-size` (default 64).
- Fields that provably always hold numbers become `Float64Array` columns.
  Other fields become plain array columns, which hold any value exactly as
  before. If no field is numeric, there is nothing to gain and the
  collection is left alone.

Accesses that a loop doesn't prove in bounds get a check that throws the
same `TypeError` the original code would have (see [Bounds](/guides/bounds/)).
