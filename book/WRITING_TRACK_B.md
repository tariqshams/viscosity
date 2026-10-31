# Brief for Track B chapter writers (*Viscosity*, by Tariq Shams)

Monorepo: /home/user/viscosity. Book: book/. Track A (chapters 1–120) took a
reader who knew only `if`/`for` in JavaScript to building, in TypeScript, a
Drip tree-walking interpreter and bytecode VM (book/companion/ts) and the
Viscosity AoS→SoA layout optimizer (engine/ts). Track B (121–200) teaches
Rust from scratch, then rebuilds the VM and Viscosity in Rust, the way
Crafting Interpreters goes from Java to C.

The real Rust code exists and is the source of truth:
- book/companion/rust: drip-rs, the Drip bytecode VM in Rust. It is std-only
  with `#![forbid(unsafe_code)]`, typed arena handles (`Gc<T>`), mark-sweep GC
  with explicit roots, and an SoA hash table. It passes the 246-program corpus
  and 95 stress-GC programs. Its README explains the design. The benchmarks
  are in results/drip-rs-bench-2026-10-31.{json,md}.
- engine/rust: the Viscosity port (crates vir, core, frontend-js on oxc
  0.156, cli, wasm). It has 122/122 byte-identical parity fixtures with the
  TS engine. See README.md and results/compile-speed-2026-10-31.md.
- The TS versions, for comparisons: book/companion/ts/src/vm, engine/ts/packages/*.

## Read first
1. book/AUTHORING.md: the full writer guide. Its "Rust (Track B)" section covers
   `lang: 'rust'` examples (full programs with `fn main()`) and exercises (library
   code plus `#[test]` fns; the checker compiles them with local
   `rustc --edition 2021`; the solution must pass while the starter and wrong
   attempts fail). Follow it exactly.
2. The outline: book/src/data/outline/part9.js … part12.js. It fixes your titles
   and introduced concepts.
3. Two finished Track B chapters, for voice and density: 124-ownership and
   131-traits (book/src/content/chapters/).
4. The chapters just before yours, so you don't re-teach what they cover. If
   they are still being written, follow the outline.

## Accuracy
- Every compiler error, output, size or timing you show must come from what you
  actually ran: the local rustc/cargo 1.97 (say so), or committed results files.
  Trim each line to 44 characters or fewer. Never invent numbers. If you measure
  something, say how and where (a shared cloud VM, so it is noisy).
- When you quote or adapt drip-rs or engine/rust code, simplify it to fit the
  line limits and say where it's adapted from. Describe only what exists; label
  anything else as design.
- Primary sources: The Rust Programming Language (github.com/rust-lang/book
  src/*.md), the Rust Reference (rust-lang/reference), std sources
  (rust-lang/rust library/), and the Cargo book (rust-lang/cargo src/doc), all via
  raw.githubusercontent.com. Many other hosts are blocked. Check
  book/src/data/references.js first: `klabnik2026` is the Rust book, and many
  `rust-*` and `rustref-*` ids exist. Put new references in
  book/src/data/refs-new/NNN-slug.js, verified against what you fetched, or leave
  them out.

## Rules (the checker enforces most of them)
- Static code lines ≤44 characters, runnable lines ≤40, 4-space Rust indentation.
- 8–15 SRS prompts, each placed exactly once. 5–8 quiz questions, every option
  explained. A 12–18 minute estimate. At least one steppable diagram per chapter
  in book/src/components/diagrams/chNNN/, using the viz kit in
  src/components/viz and the book's colour tokens. Explicit text colours now
  render.
- Only use concepts introduced earlier (`uses` is checked). If you must touch a
  later idea, explain it in one informal sentence and point forward.
- MDX: escape literal braces in prose as \{ \}; `<` in prose as &lt;.
- `expectError` examples must really fail; the checker now verifies this.
- Create only your own chapter folders, diagram folders and refs-new files.
  Don't edit shared files and don't run git. Other writers work in parallel, so
  the checker's overall result may show their errors, but yours must be clean.

Done means `cd book && node scripts/check_chapters.mjs` shows no errors for your
chapters. Report: the checker lines, a short summary per chapter, new
references, and any bugs or inaccuracies you found in drip-rs, engine/rust or
the book tooling (each with a minimal reproduction). Don't fix code outside your
files.
