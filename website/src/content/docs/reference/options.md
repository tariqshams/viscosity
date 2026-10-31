---
title: Options
description: Planner options for the CLI and the API.
---

| CLI | API (`compile(src, plugin, opts)`) | default | meaning |
|---|---|---|---|
| `--mode auto\|opt-in` | `mode` | `auto` | decide everything, or only annotated collections |
| `--bounds check\|assume` | `bounds` | `check` | keep the original out-of-range errors, or trust the indexes |
| `--min-size n` | `minSize` | `64` | leave smaller collections as objects |
| `--profile file` | `profile` | none | measured sizes from `viscosity profile` |
| `--python-auto` | `pythonAuto` | off | Python: transform without annotations |
| `--parser acorn\|mini` | `jsPlugin({ parser })` | `acorn` | JavaScript parser (the "mini" parser is the book's) |
