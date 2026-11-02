---
title: TypeScript
description: Compiling .ts files.
---

The TypeScript engine accepts `.ts`, `.mts` and `.tsx` files. Types are
stripped first (with sucrase), then the JavaScript is analysed and
rewritten, so the output is JavaScript. With several files and `-o dir/`,
the outputs are named `.js`, `.mjs` and `.jsx`.

The Rust engine does not take TypeScript: it refuses these files with a
message. Use the TypeScript CLI for them, or strip the types first.

Viscosity doesn't rely on type annotations for safety: `x: number`
doesn't stop a caller passing a string at run time. It proves numeric-ness
from the program itself.

A related measured finding: TypeScript class field declarations
(`x: number;`) become real class fields that start as `undefined`, which
made a hot update loop 3–7× slower in V8 than object literals. The book's
chapter 57 explains why.
