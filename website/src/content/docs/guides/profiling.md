---
title: Profile-guided decisions
description: Using measured sizes instead of estimates.
---

Static analysis can't always tell how big a collection gets: the size may
depend on input or on how often a function is called. Profiling runs your
**original** program once with light instrumentation that records each
collection's final length:

```sh
viscosity profile app.js -o profile.json
viscosity build app.js --profile profile.json -o app.vsc.js
```

`explain` marks measured sizes `(measured)`. A collection measured below
`--min-size` is left as objects.

Two limits to know about:

- **JavaScript only.** `viscosity profile` runs the instrumented program
  with Node, so it profiles `.js`/`.ts` programs. It refuses `.py` files
  with a clear error; Python profiling isn't supported yet.
- **Keyed by variable name.** A profile records sizes per collection name,
  so two collections with the same name in different functions share one
  entry.
