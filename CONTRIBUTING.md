# Contributing

Thanks for your interest! A few house rules keep the project trustworthy.

## The engine (`engine/`)

- **Correctness first.** Every transform needs differential tests: the
  original program and the transformed program must produce identical output.
- **Performance claims need numbers.** Add or update a suite in
  `packages/bench` and commit the results JSON. One fresh process per case.

## The book (`book/`)

Every chapter must pass `npm run check:chapters`, which enforces the book's rules:

- **Nothing is used before it is introduced.** Declare `introduces` and `uses`
  in the frontmatter, using ids from `src/data/concepts.js`.
- **Phone-sized code.** Static code lines are at most 44 characters, and
  runnable or editable code at most 40.
- **8–15 recall prompts**, each placed exactly once in the text. Prompt keys
  are permanent: renaming one orphans readers' review history.
- **A 5–8 question quiz.** Each question has exactly one correct option, and
  every option has an explanation.
- **Exercises** need tests, hints, a worked solution and common wrong attempts.
  The checker runs the solution against the tests and makes sure the starter
  code and the wrong attempts fail them.
- **About 15 minutes** per chapter (12–18 by the estimator).
- **Citations** must be verified entries in `src/data/references.js`.
  Never add a reference from memory: check it against the publisher, the
  official site or the DOI, and record the page you used and the date.

Then build and run the end-to-end checks: `npm run build && npm run check && npm run smoke`.
