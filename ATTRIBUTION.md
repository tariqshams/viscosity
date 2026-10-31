# Attribution

Viscosity and its book are by **Tariq Shams**. They rest on the ideas of the
people below. The complete, source-checked list (with links, DOIs and the
date each source was checked) is the book's bibliography,
[`book/src/data/references.js`](book/src/data/references.js). It is the
single source of truth for citations in the book, the engine and the website.
Nothing in it was written from memory.

## Ideas the engine is built on

- **Automatic columnar transformation of JavaScript arrays.** Lukas Makor,
  Sebastian Kloibhofer, David Leopoldseder, Daniele Bonetta, Lukas Stadler
  and Hanspeter Mössenböck: *Automatic Array Transformation to Columnar
  Storage at Run Time* (MPLR 2022) and *Control Flow Duplication for Columnar
  Arrays in a Dynamic Compiler* (Programming 2023). These are the closest
  prior work. Viscosity explores doing the transformation ahead of time, as a
  source-to-source compiler, rather than inside a modified runtime.
- **SoA / AoSoA types in a language.** Matt Pharr and William R. Mark, ISPC
  (`soa<N>`).
- **SoA in TypeScript, and its trade-offs.** Bui Huy Giap (ziap), *Struct of
  Arrays (SoA) in TypeScript with metaprogramming* (2025).
- **Shapes and inline caches.** Mathias Bynens and Benedikt Meurer.
- **SSA construction.** Braun, Buchwald, Hack, Leißa, Mallon and Zwinkau (CC 2013).
- **Pass-manager design.** The LLVM project's new pass manager.
- **Compiler middle-end.** Keith D. Cooper and Linda Torczon, *Engineering a
  Compiler*.
- **Truffle / Graal.** Würthinger et al., *One VM to Rule Them All* (2013).

## Ideas the book is built on

- **Crafting Interpreters** by Robert Nystrom: the "build it twice" structure.
  Its code and test files are MIT-licensed. Its prose and illustrations are
  CC BY-NC-ND 4.0, so nothing of them is copied or adapted here.
- **The mnemonic medium** (*Quantum Country*) by Andy Matuschak and Michael
  Nielsen: review prompts embedded in the text.
- **FSRS** by Jarrett Ye and the open-spaced-repetition project, and the
  ts-fsrs library: review scheduling.
- **Retrieval practice** (Roediger & Karpicke, 2006) and **dual coding**
  (Paivio, 1986): why the book asks you to recall, and pairs words with
  pictures.
- **The Rust Programming Language** by Steve Klabnik, Carol Nichols and Chris
  Krycho: Track B.

Some influences (for example Mike Acton's data-oriented design talk, Ulrich
Drepper's memory paper, Odin's `#soa`, Vaughan Pratt's parser, and the SSA
and inline-cache papers) are listed as *pending* in the bibliography. They
will be credited here once each has been checked against its primary source.

## In the code

Source files that implement a published algorithm name it, and its source,
in a comment at the top of the file.
