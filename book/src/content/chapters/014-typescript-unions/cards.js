// Chapter 14 cards. Keys are stable ids: never rename them.
//
// As in chapter 13: the runner erases types without checking them, and
// scripts/check_chapters.mjs runs code as plain JavaScript, so runnable
// code here is valid JavaScript. Exercises set lang: 'ts' so readers can
// write the types, and each walkthrough shows the typed solution.

export const prompts = {
  'union-what': {
    q: 'What does the type `number | string` mean?',
    a: 'The value may be a number or a string.',
  },
  'union-before-check': {
    q: '`id` is labelled `number | string`. Why does `id.toUpperCase()` fail to type-check?',
    a: 'If `id` is a number there is no `toUpperCase`. Before a check, only operations safe for both are allowed.',
  },
  'narrowing-what': {
    q: 'What is narrowing?',
    a: 'The checker working out a more exact type from a check in your code, such as `typeof id === \'string\'`.',
  },
  'narrow-after-return': {
    q: '`if (typeof id === \'string\') { return ...; }` and `id` is `number | string`. What is `id`’s type on the line after the `if`?',
    a: '`number`. Strings returned inside the `if`, so only numbers can reach the next line.',
  },
  'tag-why': {
    q: 'Why can’t `typeof` tell a circle object from a rectangle object?',
    a: 'Both are objects, so `typeof` gives `\'object\'` for each. You need a tag property such as `kind`.',
  },
  'literal-type': {
    q: 'In `{ kind: \'circle\'; r: number }`, what values does the type `\'circle\'` allow?',
    a: 'Only the exact string `\'circle\'`.',
  },
  'disc-narrow': {
    q: '`s` is a `Shape` (circle or rect). After `if (s.kind === \'circle\')`, what does the checker know inside the `if`?',
    a: 'That `s` is the circle variant, so `s.r` is allowed.',
  },
  'never-what': {
    q: 'What values does the type `never` have?',
    a: 'None at all. It labels a place the program should never reach.',
  },
  'exhaustive-new-kind': {
    q: 'You add a `\'tri\'` variant to `Shape` but forget it in `area`, which ends with `return unreachable(s)`. What does the checker do?',
    a: 'It reports an error at `unreachable(s)`: `s` could still be a triangle, which is not assignable to `never`.',
  },
  'keep-throw': {
    q: 'If the checker proves every case is handled, why keep the `throw` inside `unreachable`?',
    a: 'Types are erased. Bad data can still arrive at runtime, and the throw turns it into a clear error instead of a wrong answer.',
  },
  'generic-what': {
    q: 'In `function first<T>(xs: T[]): T | undefined`, what is `T`?',
    a: 'A type parameter: a blank that is filled in with a real type each time `first` is used.',
  },
  'generic-fill': {
    q: 'What type does the checker give `first([\'a\', \'b\'])`, for `first<T>(xs: T[]): T | undefined`?',
    a: '`string | undefined`. `T` is filled in as `string`; `undefined` covers an empty list.',
  },
};

export const examples = {
  shapes: {
    title: 'Read the tag, then the fields',
    lang: 'ts',
    code: `function area(s) {
  if (s.kind === 'circle') {
    return Math.PI * s.r * s.r;
  }
  return s.w * s.h;
}

const ss = [
  { kind: 'circle', r: 1 },
  { kind: 'rect', w: 2, h: 3 },
];
for (const s of ss) {
  console.log(s.kind, area(s));
}

// Try adding { kind: 'tri', b: 2 }.
// Why does area give NaN for it?`,
  },
};

export const exercises = {
  evaluate: {
    lang: 'ts',
    title: 'Your first interpreter',
    prompt:
      'Write `evaluate(e)` that computes the value of an expression tree. An `Expr` is one of: `{ kind: \'num\', value }`, `{ kind: \'add\', left, right }`, `{ kind: \'mul\', left, right }` or `{ kind: \'neg\', arg }` (negation: minus its argument). For any other kind, throw an `Error`. (The runner erases types, so the tests check behaviour; the walkthrough shows the typed version with an exhaustiveness check.)',
    starter: `type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'neg'; arg: Expr }
  | { kind: 'add';
      left: Expr; right: Expr }
  | { kind: 'mul';
      left: Expr; right: Expr };

function evaluate(e: Expr): number {
  // your code here
}

// (1 + 2) * 4
const tree: Expr = {
  kind: 'mul',
  left: {
    kind: 'add',
    left: { kind: 'num', value: 1 },
    right: { kind: 'num', value: 2 },
  },
  right: { kind: 'num', value: 4 },
};
console.log(evaluate(tree));`,
    solution: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    const b = evaluate(e.right);
    return a + b;
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    const b = evaluate(e.right);
    return a * b;
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
  throw new Error('unknown kind');
}`,
    tests: `const num = (v) => ({ kind: 'num', value: v });
test('a number is its own value', () => {
  expect(evaluate(num(7))).toBe(7);
});
test('1 + 2', () => {
  const e = { kind: 'add', left: num(1), right: num(2) };
  expect(evaluate(e)).toBe(3);
});
test('(1 + 2) * 4', () => {
  const sum = { kind: 'add', left: num(1), right: num(2) };
  const e = { kind: 'mul', left: sum, right: num(4) };
  expect(evaluate(e)).toBe(12);
});
test('-(2 * 3)', () => {
  const m = { kind: 'mul', left: num(2), right: num(3) };
  expect(evaluate({ kind: 'neg', arg: m })).toBe(-6);
});
test('an unknown kind throws', () => {
  const e = { kind: 'pow', left: num(2), right: num(3) };
  expect(() => evaluate(e)).toThrow();
});`,
    hints: [
      'Check `e.kind` once for each variant. A `num` node is the base case: just return `e.value`.',
      'An `add` node’s value is the value of its left side plus the value of its right side. Those sides are whole `Expr` trees, so get their values by calling `evaluate` on them.',
      'For `neg`, return `-evaluate(e.arg)`. After all four checks, `throw new Error(...)`.',
    ],
    walkthrough: `This is a tree-walking interpreter: the same design as the one you’ll build in Part III, just smaller.

- **Read the tag first.** Every node has a \`kind\`, and checking it narrows \`e\` to one variant, so \`e.value\`, \`e.left\` or \`e.arg\` are allowed in the right places.
- **\`num\` is the base case.** A number needs no more work.
- **\`add\` and \`mul\` recurse.** Their children are whole trees, and \`evaluate\` already knows how to compute a tree, so call it on both sides and combine. The recursion stops because every path down the tree ends at a \`num\`.
- **\`neg\` recurses once**, on its single argument.
- **Anything else throws.** In typed code, that last line is the exhaustiveness check.

With types, it looks like this:

\`\`\`ts
function unreachable(x: never): never {
  throw new Error('unknown kind');
}

function evaluate(e: Expr): number {
  if (e.kind === 'num') return e.value;
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    return a + evaluate(e.right);
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    return a * evaluate(e.right);
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
  return unreachable(e);
}
\`\`\`

Delete the \`neg\` check and \`tsc\` reports that \`{ kind: "neg"; arg: Expr; }\` is not assignable to \`never\`. Delete the \`throw\`, and a \`pow\` node from outside would quietly give \`undefined\`.`,
    wrong: [
      {
        code: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    return e.left.value + e.right.value;
  }
  if (e.kind === 'mul') {
    return e.left.value * e.right.value;
  }
  if (e.kind === 'neg') {
    return -e.arg.value;
  }
  throw new Error('unknown kind');
}`,
        why: 'This only works when the children are `num` nodes. For `(1 + 2) * 4`, the left child is an `add` node, which has no `value`, so the answer is `NaN`. The children are trees: call `evaluate` on them.',
      },
      {
        code: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    return a + evaluate(e.right);
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    return a * evaluate(e.right);
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
}`,
        why: 'Every known kind works, but an unknown kind falls off the end and returns `undefined`. In TypeScript the checker would catch the missing return; at runtime only the `throw` protects you.',
      },
    ],
  },
  firstWhere: {
    optional: true,
    lang: 'ts',
    title: 'A generic search',
    prompt:
      'Write the generic function `firstWhere(xs, ok)`: it returns the first item of `xs` for which the callback `ok(x)` returns `true`, or `undefined` if there is none. Its type is `firstWhere<T>(xs: T[], ok: (x: T) => boolean): T | undefined`, where `(x: T) => boolean` is the type of a function that takes a `T` and returns a boolean.',
    starter: `function firstWhere<T>(
  xs: T[],
  ok: (x: T) => boolean,
): T | undefined {
  // your code here
}

const big = firstWhere([3, 8, 12],
  (n) => n > 5);
console.log(big);`,
    solution: `function firstWhere(xs, ok) {
  for (const x of xs) {
    if (ok(x)) {
      return x;
    }
  }
  return undefined;
}`,
    tests: `test('numbers', () => {
  const r = firstWhere([3, 8, 12], (n) => n > 5);
  expect(r).toBe(8);
});
test('strings', () => {
  const r = firstWhere(['ab', 'cde'], (s) => s.length === 3);
  expect(r).toBe('cde');
});
test('no match gives undefined', () => {
  expect(firstWhere([1, 2], (n) => n > 9)).toBe(undefined);
});
test('an empty list gives undefined', () => {
  expect(firstWhere([], () => true)).toBe(undefined);
});
test('finds the first, not the last', () => {
  const ps = [{ id: 1, hp: 0 }, { id: 2, hp: 0 }];
  expect(firstWhere(ps, (p) => p.hp === 0).id).toBe(1);
});`,
    hints: [
      'Loop over the items with `for (const x of xs)`.',
      'Call the callback on each item: `if (ok(x))`. If it says yes, return that item straight away.',
      'If the loop finishes, nothing matched: `return undefined`.',
    ],
    walkthrough: `The code is a plain search loop. The interesting part is the type.

- **Loop and ask.** For each item, call \`ok(x)\`. The first time it says \`true\`, return \`x\`. Returning inside the loop stops the search, so you get the *first* match.
- **No match.** After the loop, \`return undefined\`.
- **Why generic?** \`T\` connects the pieces: the items are \`T\`s, the callback is handed a \`T\`, and the result is a \`T\` (or \`undefined\`). Call it on numbers and the checker knows \`n\` in \`(n) => n > 5\` is a number, and that the result is \`number | undefined\`.

\`\`\`ts
function firstWhere<T>(
  xs: T[],
  ok: (x: T) => boolean,
): T | undefined {
  for (const x of xs) {
    if (ok(x)) return x;
  }
  return undefined;
}
\`\`\`

The \`| undefined\` in the result type is honest: the checker will make every caller deal with “not found” before using the answer.`,
    wrong: [
      {
        code: `function firstWhere(xs, ok) {
  let found;
  for (const x of xs) {
    if (ok(x)) {
      found = x;
    }
  }
  return found;
}`,
        why: 'This keeps overwriting `found`, so it returns the *last* match. Return as soon as you find one.',
      },
      {
        code: `function firstWhere(xs, ok) {
  for (const x of xs) {
    if (ok) {
      return x;
    }
  }
  return undefined;
}`,
        why: '`if (ok)` tests whether the callback exists (it always does), not what it says about `x`. You have to *call* it: `ok(x)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`function len(v: string | string[]) { return v.length; }` Does this type-check?',
    options: [
      { t: 'No: you must narrow `v` before using it', why: 'You only need to narrow before doing something that is *not* safe for every member.' },
      { t: 'Yes: both strings and arrays have `length`, so it is safe for every member', correct: true, why: 'Operations allowed on every member of a union are allowed without narrowing.' },
      { t: 'No: unions can’t contain array types', why: 'Any types can be combined in a union.' },
      { t: 'Only at runtime', why: 'Type checking always happens before running; at runtime the types are gone.' },
    ],
  },
  {
    q: `\`x\` is \`number | string\`. What is \`x\`’s type at the marked line?
\`\`\`
if (typeof x === 'number') {
  return x * 2;
}
// here
\`\`\``,
    options: [
      { t: '`number`', why: 'Numbers went into the `if` and returned, so they can’t reach this line.' },
      { t: '`number | string`', why: 'The checker follows the `return`: one member has been ruled out.' },
      { t: '`never`', why: 'Strings can still reach this line, so it isn’t `never`.' },
      { t: '`string`', correct: true, why: 'Every number returned inside the `if`, so only strings remain.' },
    ],
  },
  {
    q: 'What makes a union a **discriminated** union?',
    options: [
      { t: 'Every variant has a shared tag property, like `kind`, with a different exact value', correct: true, why: 'Checking that one property tells the checker (and you) which variant you have.' },
      { t: 'It has more than two members', why: 'Size doesn’t matter; the shared tag does.' },
      { t: 'Its members are classes', why: 'Plain object types are fine, and are the usual choice.' },
      { t: 'It uses `typeof` at runtime', why: '`typeof` can’t tell two kinds of object apart; that is why we add a tag.' },
    ],
  },
  {
    q: 'A function ends with `return unreachable(s)`, where `unreachable(x: never)`. Every kind is handled. What is the type of `s` on that line?',
    options: [
      { t: '`Shape`', why: 'Each check that returned removed one variant, so it is no longer the whole `Shape`.' },
      { t: '`undefined`', why: '`undefined` is a real value; here no value at all can arrive.' },
      { t: '`never`', correct: true, why: 'All variants have been narrowed away, so nothing is left. That is what lets the call type-check.' },
      { t: '`any`', why: 'Narrowing never turns a type into `any`.' },
    ],
  },
  {
    q: 'Why is the `throw` inside `unreachable` still useful, if the checker proved it can’t be reached?',
    options: [
      { t: 'It isn’t; you can always delete it', why: 'You can delete it only if no unchecked data ever reaches the function, and you rarely know that.' },
      { t: 'The checker needs it to see the `never` type', why: 'The `never` comes from the parameter type, not the throw.' },
      { t: 'It makes the code run faster', why: 'A throw that never runs has no effect on speed.' },
      { t: 'Types are erased, so data from outside the checked code can still have an unexpected kind at runtime', correct: true, why: 'The throw turns that into a clear error instead of a quiet wrong answer.' },
    ],
  },
  {
    q: 'For `function first<T>(xs: T[]): T | undefined`, what does the checker infer for `first([true, false])`?',
    options: [
      { t: '`boolean | undefined`', correct: true, why: '`T` is filled in as `boolean` from the argument, and `undefined` covers an empty list.' },
      { t: '`T`', why: '`T` is a blank; each call fills it in with a real type.' },
      { t: '`any`', why: 'Generics keep the real type; that is their whole point.' },
      { t: '`true`', why: 'The array holds `true` and `false`, so `T` is the type covering both: `boolean`.' },
    ],
  },
];
