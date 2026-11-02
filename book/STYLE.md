# How the book sounds: Tariq's voice

The book is written in Tariq Shams's voice. This guide describes that voice
from his own writing (the preface in `src/content/front/preface.mdx`, his
book-landing intro in `src/pages/index.astro`, and his blog post *Viscosity:
a compiler that rearranges your data, and the book I'm writing about it*), so
that every chapter, whoever drafts it, reads as one person talking to you.

Read [PEDAGOGY.md](PEDAGOGY.md) next: this file is about *how it sounds*;
that one is about *how it teaches*.

## The voice in one paragraph

Long, flowing sentences that carry a thought all the way through, joined by
commas, semicolons and words like *however*, *as such*, *additionally* and
*rather than*; asides in brackets (the way you would lean over and add a
detail while talking) rather than footnotes; plain, everyday words, with any
technical word explained the first time it appears; warm and direct, never
breathless or salesy; honest about what is hard, what is uncertain and what
is a choice; and always in service of the reader understanding the thing
deeply, not just getting it to work.

## The rules

1. **Long sentences are welcome; long words are not.** A sentence may run
   to forty or fifty words, joined by semicolons, as long as each clause
   holds one idea and uses ordinary words. Readability comes from plain
   vocabulary and a clear order of ideas, not from chopping everything into
   five-word sentences. (The checker reports a *hard-word share*, the share
   of words with four or more syllables, for exactly this reason; it does
   not measure sentence length.)
2. **Brackets for asides.** Use parentheses for the extra detail, the
   caveat, the "if you are curious" fact, or the small joke; keep the main
   sentence readable without them.
3. **Semicolons and colons, never em dashes.** Join related clauses with a
   semicolon; introduce a list, an example or an explanation with a colon.
   The em dash (U+2014) is not used anywhere in the book, and the checker
   rejects it in prose.
4. **"You" and "we".** Talk to the reader as *you*; when you are building
   something together, say *we* ("we will add a second pass"). Tariq speaks
   as *I* in the front matter and in the occasional personal aside ("I find
   it helps to picture...").
5. **Connective words that show the logic.** *However*, *as such*,
   *additionally*, *rather than*, *in other words*, *which means*, *so*:
   they tell the reader how this sentence relates to the last one.
6. **Honest and specific.** Say what is true, what is approximate and where
   a simplification is being made ("this is not quite how V8 does it, and
   chapter N comes back to the difference"). Every number comes from a
   committed result; every claim about a real system cites a source.
7. **No slang, no hype.** Never "cracked", "ninja", "rockstar", "10x",
   "blazingly", "magic" (as an explanation) or "simply"/"just" in front of
   something hard. The checker has a banned-words list
   (`src/data/pedagogy.js`).
8. **Warm, not cute.** Encouragement is welcome ("this is the hardest page
   in the part; it is fine to read it twice"); exclamation marks and jokes
   that delay the explanation are not.

## Before and after

> **Before (choppy, generic):** A lexer reads characters. It groups them
> into tokens. Tokens are the words of a program. This is called scanning.

> **After (Tariq's voice):** Before a compiler can understand a program, it
> has to do what you did when you first learned to read: notice where one
> word stops and the next begins. The part that does this is called the
> **scanner** (or *lexer*), and the words it produces are called
> **tokens**; as such, `let total = 3;` stops being nine characters and
> becomes five tokens (a keyword, a name, an equals sign, a number and a
> semicolon), which is a far easier thing for the rest of the compiler to
> work with.

> **Before:** Register allocation is NP-complete, so heuristics are used.

> **After:** Choosing which values live in the CPU's few registers turns
> out to be a genuinely hard problem (as hard as colouring a map with too
> few crayons, which is no accident: it *is* that problem, as we will see);
> however, the good news is that a simple, greedy strategy gets very close
> to the best answer on real programs, which is why every production
> compiler uses one.

## Words we use, and words we avoid

| Prefer | Avoid |
|---|---|
| use, need, show, check | utilise, necessitate, demonstrate, verify (in prose) |
| fast, faster | performant, blazingly fast |
| we will see, chapter N shows | it is trivially seen, obviously |
| (in brackets) | an em dash |
| a simple, greedy strategy | a heuristic approach (unless "heuristic" is being defined) |
