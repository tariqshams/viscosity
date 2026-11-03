# Status

Live: https://viscosity.dev/book/ (Vercel project `viscosity-book`,
team "Tariq Shams' projects", root `book/`, built with Astro
`base: '/book'`). The docs site for the compiler is the separate
`website/` project, served at https://viscosity.dev/ with the book
combined under `/book/` (previously https://viscosity-website-chi.vercel.app).

The book is 326 chapters in 18 parts and three sections, read in order: the
Prelude (47 chapters, about 12 days) for readers new to programming; the
Core (120 chapters, 30 days at four a day, about an hour a day), the path for
experienced engineers that builds Drip, its VM, Viscosity, Rust and both Rust
ports; and the Deep dives (159 chapters) for afterwards. Days count within
a section (scripts/sync_days.mjs). The 2026-11 restructure merged the old
458 chapters into this shape (scripts/restructure/map.js).

| Part | Section | Chapters | Days | Subject |
|---|---|---|---|---|
| I | Prelude | 1–47 | 1–12 | Prelude: programming from scratch, in JavaScript and TypeScript |
| II | Core | 48–56 | 1–3 | Core 1: the machine under JavaScript |
| III | Core | 57–71 | 3–6 | Core 2: building Drip |
| IV | Core | 72–86 | 7–10 | Core 3: a bytecode virtual machine |
| V | Core | 87–97 | 10–13 | Core 4: compiler essentials for Viscosity |
| VI | Core | 98–115 | 13–17 | Core 5: building Viscosity |
| VII | Core | 116–136 | 18–23 | Core 6: Rust for TypeScript engineers |
| VIII | Core | 137–147 | 23–25 | Core 7: Drip in Rust |
| IX | Core | 148–167 | 26–30 | Core 8: Viscosity in Rust, and shipping it |
| X | Deep dive | 168–185 | 1–5 | Deep dive: parsing and automata theory |
| XI | Deep dive | 186–203 | 5–9 | Deep dive: semantics and type theory |
| XII | Deep dive | 204–224 | 10–15 | Deep dive: the middle end in depth |
| XIII | Deep dive | 225–253 | 15–22 | Deep dive: a native back end on RISC-V |
| XIV | Deep dive | 254–264 | 22–25 | Deep dive: inside real JavaScript engines |
| XV | Deep dive | 265–292 | 25–32 | Deep dive: implementing language features |
| XVI | Deep dive | 293–301 | 32–34 | Deep dive: garbage collection in depth |
| XVII | Deep dive | 302–316 | 34–38 | Deep dive: Rust beyond the core |
| XVIII | Deep dive | 317–326 | 38–40 | Deep dive: Viscosity and Drip extras |


## The 2026-11 rewrite

Every chapter was rewritten, part by part, to
[PEDAGOGY.md](PEDAGOGY.md) (two or more analogies that say where they
break, two or more diagrams, three or more examples of every concept,
other-language comparisons in Part I, formal notation read aloud) and in
Tariq's voice ([STYLE.md](STYLE.md)). A part's rules are errors when its
id is in `STRICT_PARTS` in `src/data/pedagogy.js` (now every part).
[COVERAGE.md](COVERAGE.md) maps every chapter of eight standard compiler
texts to the chapters that teach it.

Every part is strict: the teaching rules are errors in all 18 parts. Core chapters have an open reading time of 9–15 minutes; extra analogies, examples, comparisons and formal notation sit in closed dropdowns.

## How the book is checked

- `scripts/check_chapters.mjs`:
  - frontmatter, concept order (nothing used before it's introduced) and verified citations;
  - code lines ≤44 characters (runnable ≤40);
  - 8–15 prompts, 5–8 quiz questions with every option explained, and a 12–18 minute estimate;
  - every exercise proven: the solution passes its tests, and starters and wrong attempts fail (JS/TS in Node, Drip in the companion VM, Rust with local rustc);
  - MDX compiles.
- `scripts/clean_check.sh /tmp/bk`: in a clean worktree, runs the checker, merges references (as the Vercel prebuild does), builds, runs `check_site` (links and anchors), then `smoke.mjs`:
  - every page at 440 px with no overflow;
  - runner, quiz, SRS prompts and steppers;
  - the Playground on both engines, which must give identical output.
- `.github/workflows/ci.yml` runs all of the above, plus the engine and companion tests.

## Open items for Tariq

- **Voice.** The prose is a draft for you to rewrite in your own voice. The preface is written in your voice already; check it says what you want.
- **References still pending** (in `src/data/references.js`, each with a note on what was tried; they aren't cited until verified):
  - Matuschak and Nielsen, Quantum Country / "How can we develop transformative tools for thought?";
  - Sweller (1988) and Sweller and Cooper (1985);
  - Drepper (2007);
  - Deutsch and Schiffman (1984);
  - Cooper, Harvey and Kennedy (2001).
  Their hosts were unreachable from the build environment.
- **Chapter 182** summarises the two columnar-array papers (Makor et al. 2022; Kloibhofer et al. 2023) from their abstracts and publication lists, because the full texts were blocked. A callout in the chapter says so. Check the claims against the full papers.
- **Publishing:** done. Everything is on its registry at 0.0.1. On 2026-11-02 `@viscosity/cli@0.0.1` and `@viscosity/wasm@0.0.1` were published to npm with `scripts/release.sh --npm-only` and verified from the public registry (`npm install -g @viscosity/cli`; `viscosity --version` prints `viscosity 0.0.1`). Later the same day `scripts/release.sh --crates-only` published the six Rust crates to crates.io in dependency order: `viscosity-vir`, `viscosity-core`, `viscosity-frontend-js`, `viscosity-frontend-python`, `viscosity-cli` and `viscosity-wasm`. The first five went out in one run; `viscosity-wasm` hit crates.io's rate limit on new crates (HTTP 429, "published too many new crates in a short period") and went out about ten minutes later on a re-run, which skipped the five already published. Verified with `cargo install viscosity-cli`, whose `viscosity --version` prints `viscosity 0.0.1`. The viscosity.dev domain is still your decision. The release steps are in `engine/rust/README.md`, under Releasing.
- **Benchmarks** are from one shared cloud VM (4 vCPUs, noisy). Every number in the book comes from a committed results file; re-running on dedicated hardware would make them stronger.
