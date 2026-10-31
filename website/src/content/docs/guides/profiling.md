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
