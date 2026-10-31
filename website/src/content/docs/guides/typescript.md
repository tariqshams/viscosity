---
title: TypeScript
description: Compiling .ts files.
---

`.ts` and `.mts` files are accepted. Types are stripped first (with
sucrase), then the JavaScript is analysed and rewritten, so the output is
JavaScript.

Viscosity doesn't rely on type annotations for safety: `x: number`
doesn't stop a caller passing a string at run time. It proves numeric-ness
from the program itself.

A related measured finding: TypeScript class field declarations
(`x: number;`) become real class fields that start as `undefined`, which
made a hot update loop 3–7× slower in V8 than object literals. The book's
chapter 22 explains why.
