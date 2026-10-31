# The Drip test corpus

265 test programs adapted from the test suite of *Crafting Interpreters* by
Robert Nystrom (https://github.com/munificent/craftinginterpreters). The
`.lox` test files are MIT-licensed (see LICENSE-craftinginterpreters, which
also covers this adaptation): "Copyright (c) 2015 Robert Nystrom".

The only changes: Drip spells `fun` as `fn` and `var` as `let`, and
identifiers that would clash with those keywords are renamed. Expectations are
written in comments: `// expect: <output>`, `// expect runtime error: <msg>`
and `// [line N] Error ...` / `// Error ...` for static errors.
Regenerate with `npm run corpus:import` in book/companion/ts.
