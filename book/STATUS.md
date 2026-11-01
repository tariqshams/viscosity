# Status

Live: https://viscosity-book.vercel.app (Vercel project `viscosity-book`,
team "Tariq Shams' projects", root `book/`). The docs site for the
compiler is the separate `website/` project
(https://viscosity-website-chi.vercel.app until viscosity.dev is pointed at
it).

All 200 chapters are written and pass `scripts/check_chapters.mjs`.

| Part | Chapters | Days | Subject | Code it teaches |
|---|---|---|---|---|
| I | 1–16 | 1–4 | JavaScript for engine builders | — |
| II | 17–24 | 5–6 | How machines run code | `engine/ts/packages/bench` |
| III | 25–44 | 7–11 | A tree-walking interpreter (Drip) | `companion/ts/src` |
| IV | 45–60 | 12–15 | A bytecode VM | `companion/ts/src/vm` |
| V | 61–72 | 16–18 | Inside real JS engines | V8/JSC/SpiderMonkey sources, traces |
| VI | 73–88 | 19–22 | The compiler middle-end | `engine/ts/packages/core` |
| VII | 89–112 | 23–28 | Building Viscosity | `engine/ts/packages/*` |
| VIII | 113–120 | 29–30 | Beyond JS, and the Track A capstone | `frontend-python`, WebAssembly |
| IX | 121–144 | 31–36 | Rust for TypeScript developers | — |
| X | 145–168 | 37–42 | Drip in Rust | `companion/rust` (drip-rs) |
| XI | 169–196 | 43–49 | Viscosity in Rust | `engine/rust` |
| XII | 197–200 | 50 | Shipping, and the capstone | CLI, packages, CI, benchmarks |

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
- **Chapter 71** summarises the two columnar-array papers (Makor et al. 2022; Kloibhofer et al. 2023) from their abstracts and publication lists, because the full texts were blocked. A callout in the chapter says so. Check the claims against the full papers.
- **Publishing:** nothing is published. The npm packages (`@viscosity/cli`, `@viscosity/wasm`) pack and install cleanly, and the Rust crates `cargo package` cleanly, but publishing and the viscosity.dev domain are your decisions.
- **Benchmarks** are from one shared cloud VM (4 vCPUs, noisy). Every number in the book comes from a committed results file; re-running on dedicated hardware would make them stronger.
