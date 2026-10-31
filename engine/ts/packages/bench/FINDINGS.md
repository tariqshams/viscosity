# Baseline findings (M0)

Measured with `npm run bench` on Node v22.23.4 (V8 12.4), on a shared cloud
VM. The full tables are in [`results/`](results/). Ratios are relative to an
array of plain object literals (`aos`). These are microbenchmarks, so read
them as *what the layout does to one loop*, not as whole-application speed-ups.

## 1. SoA wins when a loop touches a few fields of many elements

| suite (n = 100,000) | soa vs aos |
|---|---:|
| `update-xy` (reads 4 of 6 fields, writes 2) | **3.8×** faster |
| `sum-one-field` (reads 1 of 6 fields) | **8.5×** faster |
| `random-x` (2 fields, shuffled order) | **5.0×** faster |

## 2. SoA loses badly when real objects must be rebuilt and kept

`materialize` (build an array holding one real object per element):
**SoA is about 20–35× slower than AoS** at 100k–1M elements, because every
element needs a fresh allocation. AoS just copies existing references.

But `get-objects`, which passes each element to a small function that wants
an object, did **not** lose: V8 inlined the function and removed the
temporary object (escape analysis). So whether "materializing" costs
anything depends on whether the object escapes. That is exactly what
Viscosity's escape analysis has to decide.

## 3. Small collections barely benefit

At n = 1,000 the gains shrink to about 1.3–2.3×, and AoSoA<8> is often
*slower* than plain AoS. The data already fits in cache, and AoSoA's index
arithmetic costs more than it saves. The cost model must look at size.

## 4. TypeScript class fields can be 3–7× slower than object literals

`aos-class` uses TypeScript-style field declarations (`x: number;`). With
modern targets these become real class fields, initialized to `undefined`
before the constructor runs. In `update-xy` this layout was **about 3× slower at 100,000 elements and
5–7× slower at 1,000 and 1,000,000** than both object literals and the same
class without declarations (`aos-ctor`).

Cause, observed with `node --trace-generalization`: the field starts as a
heap-object (`undefined`) field, then storing a number generalizes it to a
generic *tagged* representation:

```
[generalizing]x:h{Any;const}->t{Any;mutable} (uninitialized field)
```

A tagged field holds numbers as separate heap objects, so every `p.x += ...`
allocates. In the constructor-only class, the field starts as a double and
keeps a double representation.

**Why it matters for Viscosity:** a TypeScript-aware layout pass can fix this
for free. SoA columns are `Float64Array`s, which store raw doubles whatever
the source declared.

## 5. Packed AoS (one Float64Array, stride 6) captures much of the win

`aos-packed` keeps AoS order but removes object headers and pointers. It is
2–3× faster than objects on most suites, while still loading every field. So
part of SoA's advantage is *typed storage*, and part is *access locality*.
The Part II chapters separate the two.
