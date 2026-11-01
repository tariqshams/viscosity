---
title: Errors and validation
description: What Viscosity rejects, and how it reports it.
---

Every error is reported on standard error as a line starting with
`viscosity: `, and the exit status is 1. An error in the command line itself is followed
by the help text. Both CLIs reject the same things.

## Syntax errors and early errors

A JavaScript file that does not parse is an error, reported as
`<message> (line:column)`: a 1-based line and a 0-based column.

```text
$ viscosity explain bad.js        # const ps = [;
viscosity: Unexpected token (1:12)
```

ECMAScript's **early errors** count as syntax errors too, as they do in a
JavaScript engine: redeclared bindings (`let a; let a;`), `break` outside a
loop, duplicate labels, `export { undeclared }`, strict-mode rules such as
`delete x`, `with` or the legacy octal `010`, duplicate parameters or
constructors, a top-level `return`, and invalid regular expressions.
Viscosity refuses to compile such a file rather than rewrite a program
that could never run.

The TypeScript engine parses with acorn and the Rust engine with oxc. Both
reject the same programs and use the same form, but the message itself can
be worded differently, and for a few errors the position differs (oxc
points at the first declaration of a redeclared name, acorn at the second):

```text
TypeScript engine:  viscosity: Identifier 'a' has already been declared (2:4)
Rust engine:        viscosity: Identifier `a` has already been declared (1:4)
```

Python is different: source outside the supported subset is **not** an
error. The file is left exactly as it is, and `explain` reports
`No arrays of objects found.` (see [Python](/guides/python/)).

## Options

| input | error |
|---|---|
| `--min-size abc`, `--min-size -1` | `--min-size must be a non-negative number` |
| `--jobs 0`, `--jobs 1.5` | `--jobs must be a whole number of at least 1` |
| `--mode fast` | `--mode must be auto or opt-in` |
| `--bounds off` | `--bounds must be check or assume` |
| an option with no value | `--profile needs a value` (for example) |
| several files to `build` without `-o` | `several files need an output directory: -o <dir>` |

`--min-size` takes any non-negative number, written as JavaScript's
`Number()` reads it (`64`, `1e3`, `0x40`, `Infinity`).

## Profiles

A `--profile` file must be what `viscosity profile` writes: a JSON object
mapping collection names to objects whose `maxLength` is a non-negative
finite number. Other keys are ignored. Anything else is an error, with the
same message in both CLIs:

- `the profile must be a JSON object: { "name": { "maxLength": n }, ... }`
- `the profile entry "ps" must be an object whose maxLength is a non-negative number`
  (for example `{"ps": {"maxLength": "20"}}`, a string)
- `the profile p.json is not valid JSON`
- `cannot read the profile p.json`

If the profiled program itself fails (an uncaught exception or a non-zero
exit), `viscosity profile` reports `the profiled program failed (exit code N)`,
after the program's own error output, and writes no profile, since a
partial run's sizes could mislead the planner. Python programs cannot be
profiled yet.

## Annotations

An `aosoa(N)` annotation must give a block size that is a power of two
from 2 to 65536. Otherwise the collection is kept as an array of objects, and
`explain` quotes what was written:

```text
ps (line 2) {x, y} → kept as array of objects
  · annotated aosoa(12), but the block size must be a power of two (2, 4, 8, 16, ...)
```

```text
  · annotated aosoa(131072), but the block size must be at most 65536
```

`aosoa(1)`, `aosoa()`, `aosoa(-4)` and `aosoa(x)` are refused the same way. A plain
`aosoa`, without parentheses, means blocks of 8. See
[Annotations](/guides/annotations/).

## Input the Rust CLI does not take

- TypeScript files (`.ts`, `.mts`, `.tsx`) are refused with a message; use
  the TypeScript engine.
- `--parser` is an unknown option (there is one JavaScript parser).

File names that are not valid UTF-8 (which Linux allows) work in the Rust
CLI; in messages and `== file ==` headers each invalid byte shows as `�`.
