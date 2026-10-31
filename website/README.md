# viscosity.dev

The landing page and user docs for Viscosity, by Tariq Shams. Built with
Astro + Starlight. **How** Viscosity works is the subject of the book
(`../book`); this site is about **using** it.

```sh
npm install
npm run gen     # regenerate the CLI reference, benchmark and credits pages from the code and data
npm run build && npm run check
```

The generated pages (`reference/cli.md`, `project/benchmarks.md`,
`project/credits.md`) come from the engine's `--help` text, the committed
benchmark results and the book's verified bibliography, so they can't drift
from the code. Re-run `npm run gen` after changing any of those.
