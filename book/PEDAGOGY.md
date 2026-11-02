# How the book teaches

Every chapter follows this contract. [AUTHORING.md](AUTHORING.md) covers
the files and the mechanics (frontmatter, cards, exercises, citations);
[STYLE.md](STYLE.md) covers the voice. This file covers the teaching, and
`scripts/check_chapters.mjs` enforces the parts of it a program can check
(see `src/data/pedagogy.js`).

## Who the reader is

Two readers, one book, read in three sections:

- **The Prelude** (Part I) is for someone who has written `if` statements
  and loops in some language and nothing more. It teaches JavaScript and
  TypeScript from the ground up.
- **The Core** (Parts II–IX) is the 30-day path, about an hour and four
  chapters a day, for an engineer who already knows TypeScript well. It
  starts with a short refresher, then builds Drip, its VM, Viscosity, Rust,
  and both Rust ports, and ships them. A Prelude reader continues straight
  into it.
- **The Deep dives** (Parts X–XVIII) come after the core: parsing and type
  theory, the rest of the middle end, a native back end, real engines,
  language features, garbage collection, more Rust, and extras. They build
  on the core and never repeat it.

By the end, a reader should be able to read any compiler paper, work on a
production compiler, design and build a language of their own, and write
confident, idiomatic TypeScript and Rust. Nothing is left out because it
is "advanced", but depth that the main path does not need waits, either in
a dropdown or in a deep dive.

## The shape of every core idea

Each idea a chapter `introduces` is taught in this order. Everything marked
*main path* is open; everything else sits in a closed dropdown
(`<More title="...">`, `<Analogy extra>`, `<OtherLanguages>`, `<Formal>`),
so a reader who wants the essentials gets them without wading, and a reader
who wants more opens it.

1. **A problem first** (main path). A small, concrete situation where the
   idea is needed.
2. **One analogy** (main path), in an `<Analogy>` box with a
   `<span slot="breaks">` saying where the picture stops being true. Not
   every idea needs several pictures; any further analogy is welcome, but
   as `<Analogy extra>`.
3. **A diagram.** At least two per chapter, at least one of them steppable
   (built on `src/components/viz/stepper.tsx`).
4. **One strong example** (main path), in an `<Examples of="concept-id">`
   block, explained line by line. More examples (a varied one, a realistic
   one, a "spot the difference" pair) go in a `<More>` after it. At least
   one example in the chapter is runnable (`<Run>`).
5. **The precise definition** (a `<Callout kind="definition">`, main path).
   Formal notation goes in a `<Formal>` block (closed by default) with a
   `<span slot="read">` reading it aloud. Deeper theory goes in a `<More>`
   or, when it is a topic of its own, in a deep dive.
6. **Practice.** Recall prompts woven through the text, the quiz, and one
   meaningful exercise (a second one at most on the core path; any others
   are `optional: true`, shown as extra practice).

## Coming from another language

Prelude chapters have at least one `<OtherLanguages>` box (closed by
default): the same snippet in JavaScript, Python, Java and C (and Rust,
where it helps), as tabs. Point out where the languages genuinely differ.

## Review cards are exact

The review deck brings cards back for months, long after the chapter, and
next to cards from much later chapters. So every recall prompt and quiz
question must:

- **be true in general**, not only inside the chapter's simplified model.
  A chapter may simplify; its cards may not teach the simplification as
  fact. "Why can the code outside a function not read its local `a`?" is
  answered by *scope* (the name exists only inside the function's body),
  not by "the locals are thrown away when the call ends", which closures
  contradict;
- **state its scope** where it depends on one ("in a function that creates
  no closures, ..."; "in V8 12, ...");
- **never ask for an answer a later chapter contradicts.** When a later
  chapter refines an idea, the earlier card asks only what stays true;
- **stand alone**: an expert who has never read the book can answer it,
  and agrees there is one right answer. No "this chapter", "the book",
  "above", "our scanner" in a question (the checker flags these);
- **ask one thing**, with an answer that is short, specific and checkable.

## No reteaching

A concept is introduced once, in the first chapter that needs it, and
every later chapter builds on it. A deep dive that goes further opens with
a pointer back ("You met X in *T*; this chapter goes further") and teaches
only what is new. Pointers name chapters by title, never by number.

## The rules a program checks

| Rule | Where |
|---|---|
| exactly one open analogy, each analogy with a non-empty `slot="breaks"` | every chapter |
| at least 2 diagrams, at least one steppable | every chapter |
| every `introduces` concept appears in some `<Examples of>` (one example is enough) | every chapter |
| open reading time 9–15 minutes; at most 2 required exercises; recall prompts never in a dropdown | core chapters |
| open reading time 9–18 minutes | every other chapter |
| no concept used before it is introduced, in book order | every chapter |
| no card question leaning on the book's context | every card |
| an `<OtherLanguages>` box | the Prelude |
| every `<Formal>` has a `slot="read"` | every chapter |
| no banned words; no em dashes in prose | everywhere, including cards and front matter |

## Everything explained in detail

- **Exercises** come with a full worked solution in their `walkthrough`:
  the reasoning first, then the solution line by line, each line quoted and
  explained, then the common wrong attempts and why they fail. Hints build
  up gradually.
- **Examples** are explained, never just shown: what each line does, what
  it prints and why.
- **Concepts** are explained until they are easy.

## The time budget

Reading time counts only what is open: prose, code, prompts, quiz, required
exercises and open runnable examples (`src/lib/minutes.js`). Core chapters
are 9 to 15 open minutes, so four fit in an hour with reviews; other
chapters are 9 to 18. When a chapter will not fit, move depth into a
dropdown or a deep dive first; split it only when its main path alone is
too long.

## Components

~~~mdx
<Analogy title="a vending machine">
You put coins in (the arguments), press a button (the call) and a can
comes out (the return value)...
<span slot="breaks">A vending machine runs out of cans; a function can
be called as many times as you like.</span>
</Analogy>

<Analogy extra title="a recipe">
...a second picture, shown in a closed dropdown...
<span slot="breaks">...where it stops working...</span>
</Analogy>

<Examples of="parameter argument">
```js
...the one strong example, explained line by line...
```
</Examples>

<More title="Two more examples">
```js
...varied...
```
<Run id="realistic" />
</More>

<OtherLanguages>
```js
for (let i = 0; i < 3; i++) console.log(i);
```
```python
for i in range(3): print(i)
```
</OtherLanguages>

<Formal title="The typing rule for +">
```text
Γ ⊢ a : number    Γ ⊢ b : number
───────────────────────────────
      Γ ⊢ a + b : number
```
<span slot="read">If, in the current scope, a is a number and b is a
number, then a + b is a number.</span>
</Formal>
~~~
