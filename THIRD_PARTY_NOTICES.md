# Third-party notices

Viscosity's own code is MIT-licensed (see [LICENSE](LICENSE)). It uses or
adapts the following third-party works.

## Runtime and build dependencies (installed from npm, not vendored)

| Package | Used for | License |
|---|---|---|
| ts-fsrs (open-spaced-repetition) | Review scheduling in the book | MIT |
| Astro, @astrojs/mdx, @astrojs/react | Book site | MIT |
| React, React DOM | Interactive islands | MIT |
| CodeMirror 6 (@codemirror/*, @lezer/*) | In-browser code editor | MIT |
| sucrase | TypeScript → JavaScript in the browser runner and the engine's TypeScript input; bundled into the CLI | MIT |
| acorn, acorn-walk (Marijn Haverbeke and contributors) | The engine's default JavaScript parser; bundled into the CLI and the book's Playground | MIT |
| esbuild | Bundling the CLI and the Playground | MIT |
| Starlight (@astrojs/starlight) | The viscosity.dev docs site | MIT |
| Tailwind CSS | Styling | MIT |
| Pagefind | Search | MIT |
| Vitest, TypeScript | Tests and type checking | MIT / Apache-2.0 |

## Rust crates (Track B, from crates.io)

| Crate | Used for | License |
|---|---|---|
| oxc (oxc_allocator, oxc_ast, oxc_parser, …; Boshen and the oxc contributors) | The Rust engine's JavaScript parser | MIT |
| wasm-bindgen | The Rust engine's WebAssembly build | MIT OR Apache-2.0 |
| rustc-hash | Fast hash maps in the Rust engine | Apache-2.0 OR MIT |

drip-rs (`book/companion/rust`) has no dependencies.

Licences of the exact installed versions are in each package's `LICENSE`
file under `node_modules`.

## Adapted material

- **Interview Bootcamp site (Tariq Shams).** The cuboid-button style, the
  theme toggle, the mobile navigation and the stepper pattern were adapted
  from Tariq's own interview-bootcamp book site.
- **Crafting Interpreters test suite** (Robert Nystrom, MIT for `.lox`
  files). It will be adapted for the Drip language in milestone M1, with this
  notice and the original copyright kept:

  > Copyright (c) 2015 Robert Nystrom. Permission is hereby granted, free of
  > charge, … (MIT; full text in the craftinginterpreters repository LICENSE.)

  The prose and illustrations of Crafting Interpreters (CC BY-NC-ND 4.0) are
  **not** used.
