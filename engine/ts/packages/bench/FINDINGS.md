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

## 6. Python (M7): columns save memory, not time, in CPython

`packages/bench/e2e-py/layouts.py` (CPython 3.13, 100,000 elements) gave these
results, saved in `results/python-layouts-*.json`:

| layout | ns per element (update loop) | memory |
|---|---:|---:|
| dataclass objects | 26.7 | 16.0 MB |
| list columns | 43.3 | — |
| `array('d')` columns | 72.7 | 3.3 MB |

CPython is an interpreter, and reading an `array('d')` element creates a new
float object each time, so the cache-friendlier layout loses on time. It wins
about **4.9×** on memory. So the Python plugin keeps objects by default and
explains why. `# @viscosity soa` (or `--python-auto`) opts in when memory
matters more. The JavaScript result is the opposite, because V8's optimizing
compiler reads Float64Array elements as raw doubles. The same IR and analyses
serve both languages; only the cost model's verdict differs.

## 7. Node (V8) vs Bun (JavaScriptCore): the gain depends on the engine

The benchmark matrix ([`results/matrix-2026-10-31.md`](results/matrix-2026-10-31.md),
generated from the `.json` next to it by `src/matrix.ts`) runs the five
end-to-end programs, original and compiled, on Node 22 (V8 12.4) and Bun
1.4.4 (JavaScriptCore). Each figure is the best of 9 fresh processes on a
shared VM. The checksums match on both runtimes.

- **Viscosity speeds up every program on V8 (2.5× geomean), but only about
  1.7× on JSC.** `ledger` (3.8× on Node, 2.9× on Bun) and `particles` (4.4×,
  3.0×) gain on both. `boids` gains more on Bun (1.9× against 1.3×).
- **`heat` gains 4× on V8 and nothing on JSC (1.02×, within the noise).**
  `nbody` gains little on either (1.2×, 0.97×). SoA was not clearly slower
  on JSC for any program, but it is not always faster either. (An earlier
  run the same day gave the same picture, within about 10%.)
- **The difference is in the originals.** Bun runs the original
  (array-of-objects) programs 1.7× faster than Node (geomean), and the
  compiled ones only 1.2× faster. On `heat` the original takes about 350 ms
  on Node and 96 ms on Bun; compiled, both take 85–95 ms.

A likely cause (not yet confirmed with engine traces): V8 keeps a double in
an object field as a separate heap number, so every `c[i].h` is one more
pointer chase. JSC stores the double inline in the object (NaN-boxing).
SoA's `Float64Array` columns hold raw doubles on both engines, so on V8 the
rewrite fixes the storage *and* the locality, while on JSC it only fixes the
locality. That fits section 5, where packed typed storage alone recovered
much of the gain on V8.

**For the cost model:** the size and access-pattern rules still hold, but
the expected gain depends on the target engine. A program that wins 4× on
Node may win nothing on Bun or Safari. The explain text says why a
collection was transformed, not how much it will gain, and that is the
right claim to make.
