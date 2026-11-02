# Writing a chapter of *Viscosity*

This guide is for anyone (human or AI) adding chapters. Read chapters
1–7 first: they are the reference template. Copy their structure, voice
and density.

## Files

```
src/content/chapters/NNN-slug/index.mdx    the chapter text
src/content/chapters/NNN-slug/cards.js     prompts, examples, exercises, quiz
src/components/diagrams/chNNN/*.tsx        the chapter's diagrams (React SVG)
src/data/refs-new/NNN-slug.js              NEW references (see "Citations")
```

`NNN` is the zero-padded chapter number. The title and the concepts the
chapter introduces are fixed by the outline in `src/data/outline/partN.js`.
Don't change the outline: if it is really wrong, say so in your report.

## Frontmatter

```yaml
---
n: 5
day: 2                 # ceil(n / 4)
part: I
title: 'Functions as values'          # exactly as in the outline
tagline: 'One or two sentences that make the reader want to read on.'
objectives:            # 3-4 "By the end you will be able to ..." items
  - ...
introduces: [first-class-function, callback, ...]   # exactly the outline's ids
uses: [function, array, ...]          # every earlier concept you rely on
sources: [mdn-functions, ...]         # bibliography ids you cite or rely on
---
```

`uses` may only list concepts from `ASSUMED` (in `src/data/concepts.js`)
or concepts that an **earlier** chapter introduces in the outline. If you need
something later, explain it informally without the jargon, or rethink the
example.

## Shape of a chapter (about 15 minutes)

1. A hook: a small, concrete problem the reader can feel.
2. For each new idea, in this order:
   1. an `<Callout kind="intuition">` with a casual, everyday picture
   2. a diagram: a `<Figure>`, or a step-through component with `client:visible`
   3. a tiny code example
   4. a `<Callout kind="definition">` with the precise version, terms in **bold**
   5. practice: a `<Run id="..."/>` example, and a `<Prompts ids={[...]}/>` group
3. A `<Callout kind="engine" label="Under the hood">` connecting the idea
   to engines, compilers or Viscosity. Engine facts must be cited.
4. `## Your turn` with `<Exercise id="..."/>`: one core exercise, plus
   optional extras marked `optional: true` in cards.js.
5. `## What you learned`: a bullet summary in bold key terms.
6. `<Quiz />` as the last line.

Components available in MDX without importing: `Callout`
(`kind`: intuition | definition | pitfall | engine), `Figure` (`caption`,
`takeaway`), `Prompts`, `Run`, `Exercise`, `Quiz`, `Cite`. Diagram
components are imported at the top of the MDX file:
`import X from '../../../components/diagrams/chNNN/X';`. Use
`<X client:visible />` for interactive ones, and a plain `<X />` inside a
`<Figure>` for static ones.

## Diagrams

- Build them with `src/components/viz/svg.tsx` (`Svg`, `Box`, `T`, `Arrow`,
  `tok`) and `src/components/viz/stepper.tsx` (`useSteps`, `StepFrame`,
  `CodeTrace`). See `diagrams/ch001/CallSteps.tsx` and
  `diagrams/ch007/RefSteps.tsx`.
- Use a 400-unit-wide viewBox, designed for a phone held upright.
- Colours always come from tokens (`tok('brand')`). Field colours are
  permanent: x = `f1`, y = `f2`, vx = `f3`, vy = `f4`, mass = `f5`,
  health = `f6`.
- Step-through diagrams never autoplay. Each step's `note` says what to
  notice now.
- At least one diagram per chapter. Most chapters should have a
  step-through one.

## cards.js

```js
export const prompts = {            // 8-15; keys are PERMANENT ids
  'key': { q: 'Question (markdown)', a: 'Short, atomic answer' },
};
export const examples = {           // runnable <Run id> blocks
  'key': { title: '...', code: `...` },
};
export const exercises = {
  'key': {
    title, prompt, starter, solution, tests,   // tests use test()/expect()
    hints: ['...', '...'],                     // progressive
    walkthrough: `...`,                        // detailed, explains WHY
    wrong: [{ code: `...`, why: '...' }],      // common wrong attempts
    optional: true,                            // extra practice only
  },
};
export const quiz = [                // 5-8 questions
  { q: '...', options: [ { t: '...', correct: true, why: '...' }, { t: '...', why: '...' } ] },
];
```

- `expect` supports `toBe`, `toEqual`, `toBeCloseTo`, `toBeTruthy`,
  `toBeFalsy` and `toThrow`.
- Every quiz option needs a `why`.
- Vary which position holds the correct answer.
- Prompts are atomic: one fact each, with a short answer. Include some
  "why" and "what happens if" prompts, not only "what".
- Each prompt key is placed exactly once in the text.

## Hard rules (enforced by `node scripts/check_chapters.mjs`)

- Static code lines are at most **44** characters. Runnable code (examples,
  starters, solutions, wrong attempts) is at most **40**. Prefer short names
  (`ps`, `xs`).
- 8–15 prompts, a 5–8 question quiz, and at least one exercise.
- Each solution passes its tests. Each starter and each wrong attempt fails
  them.
- The estimated time is 12–18 minutes.
- `introduces` matches the outline, and `uses` contains only earlier concepts.
- Every `<Cite id>` and every `sources` id is a verified reference.
- Internal links are under the base path `/book/` (the book is served at
  https://viscosity.dev/book/, beside the docs site at `/`). In MDX write
  `[the plan](/book/days/)`, never `[the plan](/days/)`. In `.astro`,
  `.ts` and `.tsx` code, never hard-code a path: always build it with the
  helper, `href('/days/')` from `src/lib/url.ts` (or `chapterHref()` in
  `src/lib/chapters.ts`). `scripts/check_site.mjs` fails the build check on
  any internal URL outside `/book/`.

Run `node scripts/check_chapters.mjs` until it passes. Don't run `astro
build` (the maintainer does).

## Citations (accuracy is non-negotiable)

- Existing verified references are in `src/data/references.js`.
- To add one, **verify it yourself** with WebSearch / WebFetch against the
  publisher, official site, DOI page or the authors' own page. Never cite
  from memory.
- Put new references in `src/data/refs-new/NNN-slug.js` as
  `export default [ { id, authors, title, venue, year, doi, url, accessed, checkedAgainst, shaped } ]`,
  with the same fields as `references.js`.
- Any claim about how V8 or another engine behaves, or any number, must be
  cited, or must come from this repo's own benchmark results
  (`engine/ts/packages/bench/results`). When in doubt, say less.
- Never copy or closely paraphrase prose from *Crafting Interpreters* or
  any other book. Explanations and diagrams must be original.

## Voice

- Warm, plain and direct. Talk to the reader as "you".
- Short sentences, and concrete examples before abstractions.
- No hype and no filler.
- Spelling as in the existing chapters: "colour", "behaviour".

## Special components

**Benchmark charts (Part II onward).** Never type a performance number into
prose by hand. Show it from the committed results:

```mdx
import BenchBars from '../../../components/bench/BenchBars';

<BenchBars suite="update-xy" n={100000} title="Moving particles: x += vx"
  highlight={['soa']} layouts={['aos', 'aos-packed', 'soa']}
  caption="One takeaway sentence." />
```

- Suites: `update-xy`, `sum-one-field`, `read-all`, `random-x`,
  `get-objects`, `materialize`, `construct`.
- Layouts: `aos`, `aos-class`, `aos-ctor`, `aos-packed`, `soa`, `aosoa8`.
- Sizes: 1000, 100000, 1000000.
- Data: `src/data/bench/baseline-node-2026-10-31.json`. Engine findings:
  `../engine/ts/packages/bench/FINDINGS.md`.
- When prose quotes a number, say where it came from ("in this book's
  benchmark run").

**Measure on your own device:**

```mdx
import LiveBench from '../../../components/bench/LiveBench';

<LiveBench client:visible />
```

**Drip programs (Part III onward).** Examples and exercises can use
`lang: 'drip'` (the tree-walking interpreter) or `lang: 'drip-vm'` (the
bytecode VM). For a Drip exercise, `tests` is the exact expected output
(one line per `print`), and the checker runs it.

- Drip is the book's own language; DRIP.md is its specification. Its source is in `companion/ts/src`
  (tree-walker) and `companion/ts/src/vm` (VM).
- Chapters that build the interpreter should show and explain the real
  companion code, simplified where needed to fit the 44-character width.
  Exercises that build interpreter pieces (e.g. "write `isDigit`") are
  ordinary `js`/`ts` exercises.
- Benchmark results for Drip: `companion/ts/results/drip-bench-*.md`.

**The real compiler, in the page (Part VIII onward):**

```mdx
import Playground from '../../../components/playground/Playground';

<Playground client:visible title="Particles" initial={`const ps = [];
for (let i = 0; i < 1000; i++) ps.push({ x: i, vx: 1 });
for (const p of ps) p.x += p.vx;
console.log(ps[0].x);`} />
```

It shows Viscosity's decisions (explain), the compiled code, and "Run both",
which checks that both versions print the same thing. The engine source is
`../engine/ts/packages/{core,frontend-js}`; rebuild the bundle with
`node engine/ts/packages/playground/build.mjs`. End-to-end results:
`../engine/ts/packages/bench/results/e2e-node-*.md`.

The Playground has two engines with identical output (the parity
guarantee): the TypeScript reference, which is the default, and the Rust
port compiled to WebAssembly. Readers switch with the small **TS / Rust**
toggle in its header. Props:

- `engine="rust"` starts on the Rust engine (default `"ts"`). Use it only
  where the chapter is about the Rust port (Part XIII): the `.wasm` is about
  1.4 MB (0.5 MB gzipped), fetched the first time the Rust engine is used.
- `engineToggle={false}` hides the toggle.

```mdx
<Playground client:visible engine="rust" title="Same decisions, in Rust" initial={`...`} />
```

The Rust engine runs in a worker (`play.worker.ts`). Its glue is
`src/vendor/viscosity_wasm.js` and the module is
`public/wasm/viscosity_wasm_bg.wasm`, both committed so the book builds
without Rust. Rebuild them with
`node engine/rust/packages/wasm/build.mjs --book`. Syntax errors share the
form `<message> (line:col)`, but the message (and for some early errors
the position) comes from oxc rather than acorn; everything else matches, and
`scripts/smoke.mjs` checks one Playground on both engines.

**Rust (Track B).** Examples and exercises can use `lang: 'rust'`.

- In the browser the code is compiled and run by the official Rust
  Playground. An "Open in Rust Playground" link is always shown as a
  fallback.
- An example's `code` is a full program with `fn main()`.
- An exercise's `starter`/`solution` are library code (functions, structs,
  impls). Its `tests` are `#[test] fn ...` items, which are wrapped in a
  `mod tests { use super::*; ... }`. Test function names become the test
  labels (underscores turn into spaces).
- The checker compiles everything with the local `rustc --edition 2021`
  (`--test` for exercises). The solution must pass every test, and the
  starter and wrong attempts must fail at least one.
- Runnable Rust is held to the same 40-character limit. Use 4-space
  indentation and short names; split long signatures over lines.
