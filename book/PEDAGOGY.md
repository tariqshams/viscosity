# How the book teaches

Every chapter follows this contract. [AUTHORING.md](AUTHORING.md) covers
the files and the mechanics (frontmatter, cards, exercises, citations);
[STYLE.md](STYLE.md) covers the voice. This file covers the teaching, and
`scripts/check_chapters.mjs` enforces the parts of it a program can check
(see `src/data/pedagogy.js`).

## Who the reader is

Someone who has written `if` statements and loops in **some** language
(Python, Java, C, C#, Go, JavaScript, a school course, anything) and
nothing more. They may never have seen JavaScript, a type system, a
pointer or a grammar. By the end of the book they should be able to read
any compiler paper, work on any production compiler, design and build a
language of their own, and write confident, idiomatic TypeScript and Rust;
as such, nothing is left out because it is "advanced". Instead, every idea
is taught from the ground up, in plain words, until it is easy.

## The shape of every core idea

Each idea a chapter `introduces` is taught in this order:

1. **A problem first.** A small, concrete situation where the idea is
   needed ("this loop computes the same thing a million times; can the
   compiler notice?").
2. **Two or more analogies, from different everyday domains**, each in an
   `<Analogy>` box with a `<span slot="breaks">` saying where the picture
   stops being true. Two different pictures stop the reader over-fitting
   to one of them; the "breaks" note keeps the analogy honest.
3. **A diagram.** At least two per chapter, at least one of them
   steppable (built on `src/components/viz/stepper.tsx`), so the reader can
   watch the idea happen one step at a time.
4. **At least three examples**, in an `<Examples of="concept-id">` block:
   the simplest possible case, then a varied one, then a realistic one
   (from Drip, Viscosity or a real engine). At least one example in the
   chapter is runnable (`<Run>`), so the reader can change it and see what
   happens. Where a mistake is common, add a **spot the difference** pair:
   the broken version next to the working one, with the exact error it
   produces.
5. **The precise definition** (a `<Callout kind="definition">`), and then,
   if the idea has one, the **formal notation** in a `<Formal>` block, with
   a `<span slot="read">` that reads the symbols aloud in plain words.
   Formal notation is never skipped; it is introduced gently.
6. **Practice.** Recall prompts woven through the text, the quiz and the
   exercises (see AUTHORING.md).

## Coming from another language

Part I teaches JavaScript and TypeScript to someone who may know a
different language. Each chapter there has at least one `<OtherLanguages>`
box: the same snippet in JavaScript, Python, Java and C (and Rust, where
it helps), shown as tabs, so the reader can map what they already know
onto the new syntax. Point out where the languages genuinely differ
(integer division, references versus values, `null` versus `None`).

## The rules a program checks

| Rule | Where |
|---|---|
| at least 2 analogies, each with a non-empty `slot="breaks"` | every chapter |
| at least 2 diagrams, at least one steppable | every chapter |
| every `introduces` concept appears in some `<Examples of>`; each block has at least 3 examples | every chapter |
| an `<OtherLanguages>` box | Part I |
| every `<Formal>` has a `slot="read"` | every chapter |
| no banned words; no em dashes in prose | everywhere, including cards and front matter |

These are errors in the parts listed in `STRICT_PARTS` (in
`src/data/pedagogy.js`) and warnings elsewhere; a part is added to
`STRICT_PARTS` when its rewrite lands.

## Everything explained in detail

- **Exercises** come with a full worked solution in their `walkthrough`:
  the reasoning first (how to think about the problem, what to try, and
  why), then the solution line by line, each line quoted and explained in
  plain words, then the common wrong attempts and why they fail. Hints
  build up gradually, from a nudge to nearly the answer.
- **Examples** are explained, never just shown: what each line does, what
  it prints and why. Longer examples are walked through line by line.
- **Concepts** are explained until they are easy; nothing is left for the
  reader to decode alone.

## The time budget still holds; the book grows instead

A chapter is still 12 to 18 minutes. Thoroughness wins over brevity: if a
chapter cannot teach its ideas fully inside the budget, it is **split**
into two chapters (`scripts/renumber.mjs` makes room), never crammed and
never cut short. Walkthroughs are read after an exercise is attempted and
do not count towards the minutes. Examples stay short: a one-line example
is a fine example, as long as it is explained.

## Components

~~~mdx
<Analogy title="a vending machine">
You put coins in (the arguments), press a button (the call) and a can
comes out (the return value)...
<span slot="breaks">A vending machine runs out of cans; a function can
be called as many times as you like.</span>
</Analogy>

<Examples of="parameter argument">
```js
...simplest...
```
```js
...varied...
```
<Run id="realistic" />
</Examples>

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
