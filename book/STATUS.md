# Status

Live: https://viscosity.dev/book/ (Vercel project `viscosity-book`,
team "Tariq Shams' projects", root `book/`, built with Astro
`base: '/book'`). The docs site for the compiler is the separate
`website/` project, served at https://viscosity.dev/ with the book
combined under `/book/` (previously https://viscosity-website-chi.vercel.app).

The curriculum is 286 chapters in 14 parts, 72 days at four chapters a
day. The original 200 chapters are written and pass
`scripts/check_chapters.mjs`; the 86 added in the 2026-11 expansion
(`scripts/expansion/plan.mjs`) are in the outline as planned chapters, and
the site lists them greyed out until they are written.

| Part | Chapters | Days | Subject |
|---|---|---|---|
| I | 1–23 | 1–6 | JavaScript and TypeScript for engine builders |
| II | 24–31 | 6–8 | How machines run code |
| III | 32–71 | 8–18 | A tree-walking interpreter, regular languages, parsing theory, meaning and types |
| IV | 72–87 | 18–22 | A bytecode virtual machine |
| V | 88–99 | 22–25 | Inside real JavaScript engines |
| VI | 100–124 | 25–31 | The compiler middle-end |
| VII | 125–140 | 32–35 | A native back end (RISC-V) |
| VIII | 141–164 | 36–41 | Building Viscosity |
| IX | 165–172 | 42–43 | Beyond JavaScript |
| X | 173–196 | 44–49 | Implementing language features |
| XI | 197–230 | 50–58 | Rust for TypeScript developers |
| XII | 231–254 | 58–64 | Drip in Rust |
| XIII | 255–282 | 64–71 | Viscosity in Rust |
| XIV | 283–286 | 71–72 | Shipping, and the capstone |

## The 2026-11 rewrite

Every chapter is being rewritten, part by part, to
[PEDAGOGY.md](PEDAGOGY.md) (two or more analogies that say where they
break, two or more diagrams, three or more examples of every concept,
other-language comparisons in Part I, formal notation read aloud) and in
Tariq's voice ([STYLE.md](STYLE.md)). A part's rules become errors when
its id is added to `STRICT_PARTS` in `src/data/pedagogy.js`; until then
the checker lists what is left as warnings.
[COVERAGE.md](COVERAGE.md) maps every chapter of eight standard compiler
texts to the chapters that teach it.

Strict so far: Part I (chapters 1–47) and Part II (46–60).

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
- **Chapter 171** summarises the two columnar-array papers (Makor et al. 2022; Kloibhofer et al. 2023) from their abstracts and publication lists, because the full texts were blocked. A callout in the chapter says so. Check the claims against the full papers.
- **Publishing:** done. Everything is on its registry at 0.0.1. On 2026-11-02 `@viscosity/cli@0.0.1` and `@viscosity/wasm@0.0.1` were published to npm with `scripts/release.sh --npm-only` and verified from the public registry (`npm install -g @viscosity/cli`; `viscosity --version` prints `viscosity 0.0.1`). Later the same day `scripts/release.sh --crates-only` published the six Rust crates to crates.io in dependency order: `viscosity-vir`, `viscosity-core`, `viscosity-frontend-js`, `viscosity-frontend-python`, `viscosity-cli` and `viscosity-wasm`. The first five went out in one run; `viscosity-wasm` hit crates.io's rate limit on new crates (HTTP 429, "published too many new crates in a short period") and went out about ten minutes later on a re-run, which skipped the five already published. Verified with `cargo install viscosity-cli`, whose `viscosity --version` prints `viscosity 0.0.1`. The viscosity.dev domain is still your decision. The release steps are in `engine/rust/README.md`, under Releasing.
- **Benchmarks** are from one shared cloud VM (4 vCPUs, noisy). Every number in the book comes from a committed results file; re-running on dedicated hardware would make them stronger.
