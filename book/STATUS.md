# Status

Live: https://viscosity.dev/book/ (Vercel project `viscosity-book`,
team "Tariq Shams' projects", root `book/`, built with Astro
`base: '/book'`). The docs site for the compiler is the separate
`website/` project, served at https://viscosity.dev/ with the book
combined under `/book/` (previously https://viscosity-website-chi.vercel.app).

The curriculum is 458 chapters in 14 parts, 115 days at four chapters a
day, and every chapter is written and passes `scripts/check_chapters.mjs`.
The 2026-11 rewrite split chapters that ran past 18 minutes in two, so the
200 original chapters and the 86 added in the expansion became 458.

| Part | Chapters | Days | Subject |
|---|---|---|---|
| I | 1–47 | 1–12 | JavaScript for engine builders |
| II | 48–62 | 12–16 | How machines run code |
| III | 63–135 | 16–34 | Front ends: building Drip, and the theory behind it |
| IV | 136–163 | 34–41 | Drip, compiled: a virtual machine of our own |
| V | 164–184 | 41–46 | Inside real JavaScript engines |
| VI | 185–229 | 47–58 | The compiler middle-end |
| VII | 230–258 | 58–65 | A native back end |
| VIII | 259–284 | 65–71 | Building Viscosity |
| IX | 285–294 | 72–74 | Beyond JavaScript |
| X | 295–328 | 74–82 | Implementing language features |
| XI | 329–390 | 83–98 | Rust for TypeScript developers |
| XII | 391–415 | 98–104 | Drip in Rust |
| XIII | 416–453 | 104–114 | Viscosity in Rust |
| XIV | 454–458 | 114–115 | Shipping |


## The 2026-11 rewrite

Every chapter was rewritten, part by part, to
[PEDAGOGY.md](PEDAGOGY.md) (two or more analogies that say where they
break, two or more diagrams, three or more examples of every concept,
other-language comparisons in Part I, formal notation read aloud) and in
Tariq's voice ([STYLE.md](STYLE.md)). A part's rules are errors when its
id is in `STRICT_PARTS` in `src/data/pedagogy.js` (now every part).
[COVERAGE.md](COVERAGE.md) maps every chapter of eight standard compiler
texts to the chapters that teach it.

Every part is strict: the teaching rules are errors in all 14 parts.

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
