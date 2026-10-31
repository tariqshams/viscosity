---
title: Plugin API
description: Adding a language to Viscosity.
---

A language plugin turns source into **VIR**, Viscosity's language-neutral
SSA IR, and rewrites its own source from a layout plan. The core never sees
language syntax.

```ts
interface LanguagePlugin {
  id: string;                 // 'javascript', 'python', ...
  extensions: string[];       // ['.js', '.ts']
  lower(source: string): LoweredModule;   // parse + lower to VIR
  emit(source: string, lowered: LoweredModule, plan: Plan): string;
}
```

VIR has first-class operations for what layout analysis needs:

- `record.new` (fields)
- `array.empty` / `array.new`
- `push`
- `index.get` / `index.set`
- `field.get` / `field.set` (`field.get 'length'` is the length)
- `intrinsic` (pure maths)

Anything a plugin can't model becomes `opaque`, which makes everything it
touches escape, so plugins stay sound without understanding the whole
language.

Two plugins exist, JavaScript/TypeScript (`engine/ts/packages/frontend-js`)
and Python (`engine/ts/packages/frontend-python`), plus a Rust port of the
JavaScript plugin. The book's Part VIII builds the Python plugin step by
step.
