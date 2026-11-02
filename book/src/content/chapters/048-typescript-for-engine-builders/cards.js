// Chapter 48 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'never-values': {
    q: 'In TypeScript, how many values does the type `never` have?',
    a: 'None. A call to a function whose parameter is `never` is accepted only where narrowing has ruled out every possibility.',
  },
  'never-error': {
    q: 'A `switch` over a tagged union ends with `default: return unreachable(e)`, where `unreachable(x: never)`. A new variant is added to the union with no `case`. What does TypeScript report?',
    a: 'A compile error at `unreachable(e)`: the new variant is not assignable to `never`, and the error names it.',
  },
  'keep-throw-48': {
    q: 'If the checker has proved a `switch` handles every variant, why should `unreachable(x: never)` still throw?',
    a: 'Types are erased, so data from outside the checked code can still arrive at run time; the throw turns it into a clear error rather than a wrong answer.',
  },
  'constraint-why': {
    q: 'In `function f<T extends { line: number }>(n: T)`, what does the constraint allow the body to do?',
    a: 'Read `n.line` as a number: every type that fills in `T` must have it.',
  },
  'generic-keeps': {
    q: 'Why return `Result<T>` from `f<T extends { line: number }>(n: T)` rather than `Result<{ line: number }>`?',
    a: 'So the caller gets back its own exact type, with every other field still typed, not just `line`.',
  },
  'brand-cost': {
    q: 'What does a TypeScript brand such as `number & { readonly __brand: \'NodeId\' }` cost at run time?',
    a: 'Nothing: the brand is a type, erased before the code runs, so the value is a plain number.',
  },
  'brand-why': {
    q: 'Why are two plain aliases `type NodeId = number` and `type SlotId = number` interchangeable, while two branded versions are not?',
    a: 'TypeScript compares types by structure; plain aliases are both just `number`, while the brands have different literal `__brand` types, so the shapes differ.',
  },
  'strict-null': {
    q: 'With `strictNullChecks` on (part of `"strict": true`), what changes about `null` and `undefined`?',
    a: 'They become separate types, so a `string` variable cannot hold them unless its type says `| null` or `| undefined`.',
  },
  'unchecked-index': {
    q: 'With `noUncheckedIndexedAccess` on, what type does reading `xs[i]` from a `number[]` have?',
    a: '`number | undefined`, because the index may be out of range.',
  },
};

export const examples = {};

export const exercises = {
  allResults: {
    lang: 'ts',
    title: 'All or the first error',
    prompt: 'A `Result<T>` is either `{ ok: true, value }` or `{ ok: false, error }`. Write `all(rs)` that takes an array of results and returns `{ ok: true, value: [...] }` holding every value in order when all of them are ok, or the **first** failed result itself when any is not. An empty array is all ok, with an empty list of values. (The runner erases types, so the tests check behaviour; the walkthrough explains the typed signature.)',
    starter: `type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function all<T>(
  rs: Result<T>[],
): Result<T[]> {
  // your code here
}

const a = { ok: true, value: 1 };
const b = { ok: false, error: 'bad' };
// { ok: false, error: 'bad' }:
console.log(all([a, b]));`,
    solution: `type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function all<T>(
  rs: Result<T>[],
): Result<T[]> {
  const out: T[] = [];
  for (const r of rs) {
    if (!r.ok) return r;
    out.push(r.value);
  }
  return { ok: true, value: out };
}`,
    tests: `const ok = (v) => ({ ok: true, value: v });
const no = (e) => ({ ok: false, error: e });
test('all ok gives the values in order', () => {
  expect(all([ok(1), ok(2), ok(3)]))
    .toEqual(ok([1, 2, 3]));
});
test('one failure is returned', () => {
  expect(all([ok(1), no('x'), ok(3)]))
    .toEqual(no('x'));
});
test('the first failure wins', () => {
  expect(all([no('a'), no('b')]))
    .toEqual(no('a'));
});
test('empty is ok with no values', () => {
  expect(all([])).toEqual(ok([]));
});
test('values may be any type', () => {
  expect(all([ok('a'), ok('b')]))
    .toEqual(ok(['a', 'b']));
});`,
    hints: [
      'Walk the array once, keeping a list of the values seen so far.',
      'The tag is `ok`: test `r.ok` first, and only read `r.value` on the branch where it is `true`.',
      'On the first result whose `ok` is `false`, return that result straight away; after the loop, return `{ ok: true, value: out }`.',
    ],
    walkthrough: `**How to think about it.** This is the shape every pass that can fail ends up needing: check each item, collect what succeeded, and stop at the first error. \`Result<T>\` is a tagged union whose tag is the boolean \`ok\`, so the whole job is one loop and one narrowing test. The signature says the rest: given a list of \`Result<T>\`, give back one \`Result<T[]>\`, so a list of results becomes a result of a list.

**The solution, line by line.**

- \`function all<T>(rs: Result<T>[]): Result<T[]> {\` has one type parameter, \`T\`, filled in from the argument: pass \`Result<number>[]\` and the return type is \`Result<number[]>\`.
- \`  const out: T[] = [];\` collects the values. The annotation matters: an empty array literal has no element type of its own to infer.
- \`  for (const r of rs) {\` visits each result in order.
- \`    if (!r.ok) return r;\` is the narrowing test. On this branch \`r\` is the failed variant, \`{ ok: false; error: string }\`, which is assignable to \`Result<T[]>\` as it is (the failed variant does not mention \`T\`), so the first failure is returned unchanged.
- \`    out.push(r.value);\` runs only after the test, where \`r\` has been narrowed to the ok variant, so \`r.value\` is a \`T\`. Reading \`r.value\` before the test would be a compile error, because the failed variant has no \`value\`.
- \`  }\` ends the loop.
- \`  return { ok: true, value: out };\` wraps the collected values. For an empty input the loop never runs and this returns \`{ ok: true, value: [] }\`.
- \`}\` closes the function.

**Common wrong attempts.**

- Pushing \`r.value\` for every result and testing \`ok\` afterwards collects \`undefined\` for the failures and never stops at the first one; with types checked, it is also a compile error.
- Returning \`{ ok: false, error: 'failed' }\` throws away the real error message; return the failed result itself.
- Returning the *last* failure (by carrying on through the loop) reports a later error caused by an earlier one, which is how error cascades start.`,
    wrong: [
      {
        code: `function all(rs) {
  const out = [];
  for (const r of rs) out.push(r.value);
  return { ok: true, value: out };
}`,
        why: 'This never looks at the tag, so a failed result is treated as ok and its missing value becomes `undefined`. Test `r.ok` before reading `r.value`.',
      },
      {
        code: `function all(rs) {
  const out = [];
  for (const r of rs) {
    if (!r.ok) {
      return { ok: false, error: '?' };
    }
    out.push(r.value);
  }
  return { ok: true, value: out };
}`,
        why: 'It stops at the right place but replaces the real error message with `?`; return the failed result itself.',
      },
      {
        code: `function all(rs) {
  const out = [];
  let bad = null;
  for (const r of rs) {
    if (!r.ok) bad = r;
    else out.push(r.value);
  }
  if (bad) return bad;
  return { ok: true, value: out };
}`,
        why: 'This keeps going after a failure and so returns the last one, not the first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `switch (e.kind)` covers every variant of a tagged union and ends with `default: return unreachable(e);`, where `unreachable(x: never): never`. What type does `e` have in the `default` branch?',
    options: [
      { t: '`Expr`, the whole union', why: 'Each `case` above has removed its variant, so the union has been narrowed, not kept whole.' },
      { t: '`never`', correct: true, why: 'Every variant has been handled, so no possibility remains; that is why the call to `unreachable` is accepted.' },
      { t: '`unknown`', why: '`unknown` holds any value; narrowing goes the other way, towards fewer possibilities.' },
      { t: 'The last variant listed in the union', why: 'That variant was handled by its own `case`, so it is ruled out in `default`.' },
    ],
  },
  {
    q: 'What does the constraint in `function f<T extends { line: number }>(n: T): T` allow?',
    options: [
      { t: 'It forces every caller to write the type argument explicitly', why: 'Type arguments are still inferred from the call; the constraint only limits what they may be.' },
      { t: 'It turns `T` into `{ line: number }`, dropping other fields', why: 'That is what a plain `{ line: number }` parameter would do; a constrained `T` keeps the caller\'s exact type.' },
      { t: 'It lets the body read `n.line`, and rejects arguments that lack it', correct: true, why: 'Every type filling `T` must have a numeric `line`, so the body may use it and calls without one are errors.' },
      { t: 'It checks at run time that `n` has a `line` field', why: 'Constraints are types and are erased; nothing is checked at run time.' },
    ],
  },
  {
    q: '`type NodeId = number & { readonly __brand: \'NodeId\' }`. What is a `NodeId` at run time?',
    options: [
      { t: 'An object with a `__brand` property', why: 'No such property is ever created; the brand exists only for the checker.' },
      { t: 'A plain number', correct: true, why: 'The brand is a type and is erased, so the value is the number it always was.' },
      { t: 'A number wrapped in a small object', why: 'Nothing wraps it; the `as NodeId` cast generates no code.' },
      { t: 'A string such as "NodeId:3"', why: 'The literal `\'NodeId\'` is a type, not part of the value.' },
    ],
  },
  {
    q: 'Why can a plain `type SlotId = number` not stop a `NodeId` being passed where a `SlotId` is wanted?',
    options: [
      { t: 'Because TypeScript compares types by structure, and both aliases are just `number`', correct: true, why: 'An alias is another name for the same type; only a structural difference, such as a brand, makes them distinct.' },
      { t: 'Because aliases are checked only at run time', why: 'Aliases, like all types, are checked before the code runs and then erased.' },
      { t: 'Because numbers cannot have types', why: 'Numbers have the type `number`; the problem is that both aliases are that same type.' },
      { t: 'Because `strict` is off by default', why: '`strict` does not change how aliases are compared; aliases of `number` are interchangeable in every mode.' },
    ],
  },
  {
    q: 'With `noUncheckedIndexedAccess` on, `const xs: number[] = [1]; const v = xs[3];` What is the type of `v`?',
    options: [
      { t: '`number`', why: 'That is the type without the option, which is how out-of-range reads slip through.' },
      { t: '`undefined`', why: 'The checker does not know the length, so it cannot say the read is always out of range; it says it might be.' },
      { t: 'A compile error on the read itself', why: 'The read is allowed; using `v` as a number without first checking it is what becomes an error.' },
      { t: '`number | undefined`', correct: true, why: 'Any index may be out of range, so every read by index includes `undefined`.' },
    ],
  },
];
