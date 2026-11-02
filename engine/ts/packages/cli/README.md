# @viscosity/cli

The `viscosity` command. Viscosity rewrites arrays of objects in
JavaScript and TypeScript (and Python lists of dataclass instances) into
struct-of-arrays layouts backed by typed arrays, when it can prove the
rewrite is safe and expects it to be faster, and it explains every
decision it makes. This package is the TypeScript reference engine; its
output is byte-for-byte identical to the Rust engine's (`viscosity-cli` on
crates.io, and `@viscosity/wasm` on npm).

- Docs: https://viscosity.dev
- The book about how it is built: https://viscosity.dev/book
- Source: https://github.com/tariqshams/viscosity

## Install

```sh
npm install -g @viscosity/cli     # the `viscosity` command (Node 18 or later)
viscosity --version
npx @viscosity/cli explain app.js # or run it without installing
```

## Example

`particles.js`, an ordinary array of objects:

```js
const ps = [];
for (let i = 0; i < 100000; i++) {
  ps.push({ x: i, y: 0, vx: 1, vy: 2 });
}
for (let t = 0; t < 10; t++) {
  for (let i = 0; i < ps.length; i++) {
    ps[i].x += ps[i].vx;
    ps[i].y += ps[i].vy;
  }
}
console.log(ps[5].x, ps[5].y);
```

`viscosity explain particles.js` says what it will do, and why:

```text
ps (line 1) {x, y, vx, vy} → struct of arrays
  · loop at line 6 in <module>() touches 4 of 4 fields (vy, y, vx, x)
  · typed Float64Array columns for all 4 fields
  · about 100000 elements
  · 4 of 6 element accesses proven in bounds
```

`viscosity build particles.js -o out.js` writes the rewritten program. The
loop becomes `ps.x[i] += ps.vx[i]` over `Float64Array` columns, and the two
accesses it could not prove in bounds keep a check that throws the same
`TypeError` the original would. Both programs print `15 20`.

## Commands

```text
viscosity build <file> [-o out.js] [options]   compile a file
viscosity build <file>... -o <dir> [options]   compile several files into dir/
viscosity explain <file>... [options]          show every decision and why
viscosity profile <file> [-o profile.json]     run the program and record collection sizes
viscosity --help | --version
```

## Options

```text
-o, --out <path>          build: the output file, or a directory (several
                          files, or a path ending in /)
--frames                  explain: show the source line under each refusal,
                          with carets under the code it is about
--mode auto|opt-in        auto (default) decides everything; opt-in only
                          transforms collections marked // @viscosity soa
--bounds check|assume     check (default) keeps out-of-bounds behaviour
                          identical; assume trusts the program
--min-size <n>            leave collections smaller than n alone (default 64)
--profile <profile.json>  use measured sizes from `viscosity profile`
--parser acorn|mini       JavaScript parser (default acorn)
--explain                 also print the explanation when building
--python-auto             Python: transform without annotations
--jobs <n>                accepted for parity with the Rust CLI (this CLI
                          compiles one file at a time)
```

`viscosity --help` prints the full list.

## Annotations

Put a comment on the line above a declaration to steer a decision:

```js
// @viscosity soa        transform (if safe), even if small or loop-free
// @viscosity aos        never transform this one
// @viscosity aosoa(8)   blocks of 8, field-major within a block
```

Annotations never override safety: a collection that is not provably safe
is left alone, and `explain` says why. In Python, write
`# @viscosity soa` above `xs = []`.

## How much faster?

Measured end to end, original against compiled, best of 9 fresh processes
on a shared 4-vCPU VM: a geometric mean of 2.54× on Node 22 and 1.74× on
Bun across the benchmark programs. The numbers, method and caveats are in
[`matrix-2026-10-31.md`](https://github.com/tariqshams/viscosity/blob/main/engine/ts/packages/bench/results/matrix-2026-10-31.md).
Viscosity is in early development (version 0.0.x): read `explain` before
trusting a rewrite.

## Licence

MIT © Tariq Shams. The bundled dependencies' licence texts are in
`THIRD_PARTY_LICENSES.txt`.
