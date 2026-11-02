// Chapter 36 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'constraint-what': {
    q: 'What does `T extends { length: number }` mean in `function longest<T extends { length: number }>(...)`?',
    a: '`T` may be any type, as long as it has at least a `length` property holding a number.',
  },
  'constraint-error': {
    q: 'Without a constraint, why does `a.length` fail to type-check when `a: T`?',
    a: '`T` could be any type, including `number`, which has no `length`; the checker only allows what every possible `T` has.',
  },
  'constraint-keeps': {
    q: 'Why is `longest<T extends { length: number }>(a: T, b: T): T` better than `longer(a: { length: number }, b: { length: number })`?',
    a: 'The generic returns the exact type that filled `T` (a string stays a string); the plain version only returns “a thing with a length”.',
  },
  'infer-what': {
    q: 'What is generic inference?',
    a: 'The checker working out a call’s type arguments from the types of the arguments you pass.',
  },
  'infer-callback': {
    q: 'In `map([1, 2, 3], (n) => String(n))` with `map<A, B>(xs: A[], f: (x: A) => B): B[]`, what are `A`, `B` and the result?',
    a: '`A` is `number` (from the array), `B` is `string` (from the callback’s return), and the result is `string[]`.',
  },
  'infer-explicit': {
    q: 'With `combine<T>(a: T[], b: T[]): T[]`, the call `combine([1, 2], [\'a\'])` is an error. How do you tell the checker that mixing is intended?',
    a: 'Write the type argument yourself: `combine<number | string>([1, 2], [\'a\'])`.',
  },
  'infer-empty': {
    q: 'What type does `new Map()` get, and why is that a problem?',
    a: '`Map<any, any>`: there is nothing to infer from, and `any` switches checking off for that map. Write `new Map<string, number>()`.',
  },
  'default-what': {
    q: 'With `interface Token<V = string>`, what is `V` in a variable labelled just `Token`?',
    a: '`string`: when the type argument is left out, the default is used.',
  },
  'default-order': {
    q: 'Why is `type Pair<A = string, B> = [A, B]` an error?',
    a: 'A type parameter without a default may not follow one with a default, so `Pair<number>` can never be ambiguous.',
  },
};

export const examples = {
  longest: {
    title: 'One function, many types',
    lang: 'ts',
    code: `function longest<
  T extends { length: number },
>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

console.log(longest('ab', 'c'));
console.log(longest([1, 2], [1, 2, 3]));

// tsc rejects the next line, but the
// runner only erases types, so it runs:
// (10).length is undefined, the test
// undefined >= undefined is false,
// and b comes back. Types are promises.
console.log(longest(10, 100));`,
  },
};

export const exercises = {
  byId: {
    lang: 'ts',
    title: 'An index by id',
    prompt: 'Write `byId(xs)` that takes an array of records, each with a numeric `id`, and **returns** a `Map` from each id to its record. If two records share an id, the later one wins. Its type is `byId<T extends { id: number }>(xs: T[]): Map<number, T>`. (The runner erases types, so the tests check behaviour; the walkthrough explains what the types buy you.)',
    starter: `function byId<T extends { id: number }>(
  xs: T[],
): Map<number, T> {
  // your code here
}

const ps = [
  { id: 1, x: 0 },
  { id: 2, x: 5 },
];
console.log(byId(ps).get(2));`,
    solution: `function byId<T extends { id: number }>(
  xs: T[],
): Map<number, T> {
  const m = new Map<number, T>();
  for (const x of xs) {
    m.set(x.id, x);
  }
  return m;
}`,
    tests: `const ps = [
  { id: 1, x: 0 },
  { id: 2, x: 5 },
];
test('returns a Map', () => {
  expect(byId(ps) instanceof Map).toBe(true);
});
test('finds a record by its id', () => {
  expect(byId(ps).get(2)).toBe(ps[1]);
  expect(byId(ps).get(1)).toBe(ps[0]);
});
test('one entry per record', () => {
  expect(byId(ps).size).toBe(2);
});
test('an empty array gives an empty map', () => {
  expect(byId([]).size).toBe(0);
});
test('a later record with the same id wins', () => {
  const a = { id: 7, n: 'a' };
  const b = { id: 7, n: 'b' };
  expect(byId([a, b]).get(7)).toBe(b);
});`,
    hints: [
      'Start with an empty `Map`, then visit every record once. What should you store for each one?',
      'For each record `x`, the key is `x.id` and the value is the whole record `x`. `Map` has a method that stores a key and a value.',
      'Make `const m = new Map<number, T>();`, loop with `for (const x of xs) { m.set(x.id, x); }`, and `return m;` after the loop.',
    ],
    walkthrough: `**How to think about it.** An index is a lookup table: give it an id, get the record. A \`Map\` (from *Map and Set*) is exactly that, so the job is to make an empty map and put every record into it, keyed by its \`id\`. Because \`set\` on an existing key replaces the old value, "the later one wins" comes for free if you visit the records in order. The types describe the promise: every record must *have* a numeric \`id\` (the constraint), and the map gives back the records' full type \`T\`, not just \`{ id: number }\`.

**The solution, line by line.**

- \`function byId<T extends { id: number }>(\` declares the blank \`T\` and limits it: whatever fills it must have an \`id\` that is a number. That constraint is what makes \`x.id\` allowed below.
- \`  xs: T[],\` the parameter is an array of those records.
- \`): Map<number, T> {\` the function returns a map whose keys are numbers and whose values are the *same* type \`T\`, so \`byId(ps).get(1)\` is labelled as a full particle, with its \`x\` and everything else.
- \`  const m = new Map<number, T>();\` makes an empty map. The type arguments are written by hand because \`new Map()\` with no arguments has nothing to infer from and would become \`Map<any, any>\`, which switches checking off.
- \`  for (const x of xs) {\` visits each record in order.
- \`    m.set(x.id, x);\` stores the record under its id. If that id is already there, the new record replaces the old one, which is the rule the prompt asks for.
- \`  }\` ends the loop.
- \`  return m;\` hands back the finished index.
- \`}\` closes the function.

**What the types buy you.** With the constraint, \`byId([{ name: 'a' }])\` is rejected by \`tsc\` before the program runs ("Object literal may only specify known properties, and 'name' does not exist in type '{ id: number; }'"), and \`byId(ps).get(2)?.x\` is known to be a number. With a plain annotation \`xs: { id: number }[]\` instead, the first would still be caught, but the second would not: the map's values would only be "things with an id".

**Common wrong attempts.**

- Building the map but forgetting \`return m;\`: the call produces \`undefined\`, so \`.get\` fails.
- Storing \`m.set(x, x.id)\`, the key and value the wrong way round: \`get(2)\` then looks for the number 2 among the keys, which are records, and finds nothing.`,
    wrong: [
      {
        code: `function byId(xs) {
  const m = new Map();
  for (const x of xs) {
    m.set(x.id, x);
  }
}`,
        why: 'The map is built and then dropped: with no `return`, every call produces `undefined`.',
      },
      {
        code: `function byId(xs) {
  const m = new Map();
  for (const x of xs) {
    m.set(x, x.id);
  }
  return m;
}`,
        why: 'Key and value are swapped, so the keys are the records and `get(2)` finds nothing.',
      },
    ],
  },
  maxBy: {
    optional: true,
    lang: 'ts',
    title: 'The best item by a score',
    prompt: 'Write `maxBy(xs, score)`: it calls `score` on each item and **returns** the item with the highest score (the first one, if several tie), or `undefined` for an empty array. Its type is `maxBy<T>(xs: T[], score: (x: T) => number): T | undefined`, so in `maxBy(ps, (p) => p.x)` inference makes `p` a particle without a label.',
    starter: `function maxBy<T>(
  xs: T[],
  score: (x: T) => number,
): T | undefined {
  // your code here
}

const ws = ['a', 'ccc', 'bb'];
console.log(maxBy(ws, (w) => w.length));`,
    solution: `function maxBy<T>(
  xs: T[],
  score: (x: T) => number,
): T | undefined {
  let best: T | undefined = undefined;
  let top = -Infinity;
  for (const x of xs) {
    const s = score(x);
    if (s > top) {
      best = x;
      top = s;
    }
  }
  return best;
}`,
    tests: `test('longest word', () => {
  const ws = ['a', 'ccc', 'bb'];
  expect(maxBy(ws, (w) => w.length)).toBe('ccc');
});
test('records by a field', () => {
  const ps = [{ x: 1 }, { x: 9 }, { x: 3 }];
  expect(maxBy(ps, (p) => p.x)).toBe(ps[1]);
});
test('the first wins a tie', () => {
  const ws = ['ab', 'cd'];
  expect(maxBy(ws, (w) => w.length)).toBe('ab');
});
test('negative scores', () => {
  const ns = [-5, -2, -9];
  expect(maxBy(ns, (n) => n)).toBe(-2);
});
test('empty gives undefined', () => {
  expect(maxBy([], (n) => n)).toBe(undefined);
});`,
    hints: [
      'Walk the array once, remembering the best item so far and its score.',
      'Start the best score at `-Infinity`, a number smaller than every other, so the first item always beats it. Use `>` rather than `>=`, so a tie keeps the earlier item.',
      'Inside `for (const x of xs)`, compute `const s = score(x);`; if `s > top`, set `best = x` and `top = s`. Return `best` after the loop: it is still `undefined` if the array was empty.',
    ],
    walkthrough: `**How to think about it.** This is the "best so far" loop from *Visiting every slot: the array loop*, with one change: instead of comparing the items themselves, you compare a number that the callback works out for each one. Two pieces of state are enough: the best item so far, and its score. The type is where inference shines: \`T\` appears in \`xs\` and in the callback's parameter, so once the checker reads \`xs\` it knows what the callback receives.

**The solution, line by line.**

- \`function maxBy<T>(\` declares one blank. It needs no constraint, because \`maxBy\` itself never looks inside an item; only the callback does.
- \`  xs: T[],\` the items.
- \`  score: (x: T) => number,\` a callback that takes one item and returns a number. Because its parameter is \`T\`, the reader's \`(p) => p.x\` gets \`p\` labelled as the item type without writing it.
- \`): T | undefined {\` an item, or \`undefined\` when there is none.
- \`  let best: T | undefined = undefined;\` nothing found yet.
- \`  let top = -Infinity;\` the best score so far starts below every real number, so the first item always replaces it, even if every score is negative.
- \`  for (const x of xs) {\` visits each item.
- \`    const s = score(x);\` asks the callback for this item's score, once.
- \`    if (s > top) {\` a strictly higher score wins; with \`>\`, a tie keeps the earlier item.
- \`      best = x;\` and \`      top = s;\` remember the new leader and its score.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return best;\` the winner, or \`undefined\` if the loop never ran.

**Common wrong attempts.**

- Starting \`top\` at \`0\`: when every score is negative, nothing beats 0, and the answer is \`undefined\` instead of the largest negative item.
- Using \`>=\`: a later item with the same score replaces the earlier one, so a tie returns the last, not the first.`,
    wrong: [
      {
        code: `function maxBy(xs, score) {
  let best = undefined;
  let top = 0;
  for (const x of xs) {
    const s = score(x);
    if (s > top) {
      best = x;
      top = s;
    }
  }
  return best;
}`,
        why: 'With `top` starting at 0, all-negative scores never win, so `[-5, -2, -9]` gives `undefined` instead of `-2`.',
      },
      {
        code: `function maxBy(xs, score) {
  let best = undefined;
  let top = -Infinity;
  for (const x of xs) {
    const s = score(x);
    if (s >= top) {
      best = x;
      top = s;
    }
  }
  return best;
}`,
        why: '`>=` lets a later tie replace the leader, so `[\'ab\', \'cd\']` gives `\'cd\'`, not the first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `longest<T extends { length: number }>(a: T, b: T): T`, what type does `longest(\'ab\', \'c\')` have?',
    options: [
      {
        t: '`string`',
        correct: true,
        why: 'Inference fills `T` with `string`, and the function returns `T`, so string methods are allowed on the result.',
      },
      {
        t: '`{ length: number }`',
        why: 'That would be the type with a plain annotation. A constraint keeps the exact type that filled the blank.',
      },
      {
        t: '`any`',
        why: 'There is plenty to infer from: both arguments are strings.',
      },
    ],
  },
  {
    q: '`map<A, B>(xs: A[], f: (x: A) => B): B[]` is called as `map([\'a\', \'bb\'], (s) => s.length)`. What is the result type?',
    options: [
      {
        t: '`string[]`',
        why: 'That is `A[]`, the input. The result is `B[]`, and `B` comes from what the callback returns.',
      },
      {
        t: '`number[]`',
        correct: true,
        why: '`A` is `string` from the array, so `s` is a string, `s.length` is a number, so `B` is `number`.',
      },
      {
        t: 'An error: `s` has no label',
        why: 'Inference labels `s` as `A`, which is `string`, so no label is needed.',
      },
    ],
  },
  {
    q: 'When do you need to write type arguments yourself, as in `f<string>(...)`?',
    options: [
      {
        t: 'On every call to a generic function',
        why: 'Most calls infer their type arguments from the arguments.',
      },
      {
        t: 'Only for generic classes',
        why: 'Inference works for functions and for `new` alike; `new Map([[1, \'a\']])` infers both blanks.',
      },
      {
        t: 'When there is nothing to infer from, or the clues disagree',
        correct: true,
        why: 'For example `new Map()` (no arguments) or `combine([1], [\'a\'])` (number versus string).',
      },
    ],
  },
  {
    q: 'Given `function make<T = string>(): T[]`, what is the type of `make()`?',
    options: [
      {
        t: '`unknown[]`',
        why: 'With no default, an uninferable blank becomes `unknown` here; but this blank has a default.',
      },
      {
        t: '`any[]`',
        why: 'The default is used before anything falls back to `any`.',
      },
      {
        t: '`string[]`',
        correct: true,
        why: 'There are no arguments to infer `T` from, so the default `string` fills it.',
      },
    ],
  },
  {
    q: 'Which is a real difference between TypeScript generics and Python’s `def longest[T: Sized](a: T, b: T) -> T`?',
    options: [
      {
        t: 'Python checks the constraint while the program runs',
        why: 'Python itself ignores the annotations; a separate checker such as mypy checks them, much as `tsc` does.',
      },
      {
        t: 'They differ in spelling (`extends` versus `:`), and TypeScript accepts any object shape as a constraint',
        correct: true,
        why: 'TypeScript constraints can be written as a shape like `{ length: number }`; Python uses a named type such as `Sized`.',
      },
      {
        t: 'TypeScript keeps the type parameters when the program runs',
        why: 'TypeScript erases them before running, like Java.',
      },
    ],
  },
];
