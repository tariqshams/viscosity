---
title: Explain, frames and many files
description: Reading viscosity explain, showing the code behind each refusal, and compiling several files at once.
---

## Reading `explain`

`viscosity explain` prints one entry per collection: its name, its line,
its fields, the layout chosen, and the reasons.

```text
ps (line 3) {x, y, vx, vy, mass, age, r, g} → struct of arrays
  · loop at line 8 in step() touches 4 of 8 fields (x, vx, y, vy)
  · typed Float64Array columns for all 8 fields
  · about 200000 elements
  · 2 of 2 element accesses proven in bounds
```

A collection Viscosity refuses is `kept as array of objects`, and each
reason it is unsafe is a line starting with `unsafe:`. A file with no
candidate collections prints `No arrays of objects found.`

## Code frames: `--frames`

With `--frames`, every refusal is followed by the line of source it is
about, with carets under the code:

```text
ps (line 1) {x, y} → kept as array of objects
  · unsafe: line 5: an element is used by push
    5 | 	if (ps[i].x > 3) keep.push(ps[i]);
      | 	                           ^^^^^
```

The rest of the output is the same as without `--frames`. Columns are
counted in characters (code points), so the carets line up after
non-ASCII text too, and tabs before the code are kept in the caret line.

## Several files

`build` and `explain` take several files:

```sh
viscosity explain src/a.js src/b.js
viscosity build src/*.js -o dist/
```

- `explain` prints each file's explanation under a `== file ==` header,
  with a blank line between files, in the order the files were given.
- `build` writes each compiled file into the `-o` directory under its own
  name (the TypeScript CLI renames TypeScript inputs: `.ts` to `.js`, `.mts`
  to `.mjs`, `.tsx` to `.jsx`). `-o` is a directory when there are
  several files, when the path ends in `/`, or when it already is one.
  Building several files without `-o` is an error, and so are two inputs
  with the same name (they would overwrite each other).
- A file that fails is reported as `viscosity: <file>: <error>`; the other
  files are still compiled, and the exit status is 1.

Files are analysed independently (see [Limitations](/guides/limitations/)).
The Rust CLI compiles them in parallel, by default one thread per CPU
(`--jobs n` to choose); the output does not depend on the number of
threads. The TypeScript CLI accepts `--jobs` and compiles one file at a
time. Both print the same output, frames included.
