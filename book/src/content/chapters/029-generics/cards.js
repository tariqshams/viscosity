// Cards for the third part of chapter 27 (generics). Keys are stable
// ids: never rename them. The runner erases types without checking them.

export const prompts = {
  'generic-what': {
    q: 'In `function first<T>(xs: T[]): T | undefined`, what is `T`?',
    a: 'A type parameter: a blank that is filled in with a real type each time `first` is used.',
  },
  'generic-fill': {
    q: 'For `first<T>(xs: T[]): T | undefined`, what type does the checker give `first([\'a\', \'b\'])`?',
    a: '`string | undefined`. `T` is filled in as `string`; `undefined` covers an empty list.',
  },
  'generic-erased': {
    q: 'Can the body of `first<T>` ask, at run time, what `T` was for this call?',
    a: 'No. `T` exists only for the checker and is erased before the code runs.',
  },
  'generic-union': {
    q: 'What does the checker fill `T` with in `first([1, \'a\'])`?',
    a: 'The union `string | number`, so the result is `string | number | undefined`.',
  },
  'generic-type': {
    q: 'What is `Array<number>`, and how else is it written?',
    a: 'The generic type `Array<T>` with `number` in the blank; it is the same type as `number[]`.',
  },
  'result-generic': {
    q: 'With `type Result<T> = { ok: true; value: T } | { ok: false; error: string }`, what type is `value` in a `Result<string>`?',
    a: '`string`: the blank `T` is filled with `string`.',
  },
  'infer-callback': {
    q: 'In `firstWhere([3, 8, 12], (n) => n > 5)`, why does `n` need no type label?',
    a: 'The checker infers `T = number` from the list, and the callback’s parameter has type `T`, so `n` is a number.',
  },
  'generic-explicit': {
    q: 'How do you fill in `T` by hand instead of letting the checker infer it?',
    a: 'Write the type in angle brackets at the call: `first<number>(xs)`.',
  },
};

export const examples = {
  generics: {
    title: 'One definition, many types',
    lang: 'ts',
    code: `function first<T>(
  xs: T[],
): T | undefined {
  return xs[0];
}

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function parseAge(
  s: string,
): Result<number> {
  const n = Number(s);
  if (Number.isNaN(n)) {
    return {
      ok: false,
      error: 'not a number',
    };
  }
  return { ok: true, value: n };
}

console.log(first([10, 20]));
console.log(first(['a', 'b']));
console.log(first([]));
console.log(parseAge('42'));
console.log(parseAge('old'));`,
  },
};

export const exercises = {
  firstWhere: {
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
    solution: `function firstWhere<T>(
  xs: T[],
  ok: (x: T) => boolean,
): T | undefined {
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
      'This is a search: look at each item in turn, and stop at the first one that passes.',
      'Loop with `for (const x of xs)`, and ask the callback about each item by calling it: `ok(x)`.',
      'Inside the loop, `if (ok(x)) { return x; }`. After the loop, nothing matched, so `return undefined;`.',
    ],
    walkthrough: `**How to think about it.** Forget the types for a moment: this is the plain search loop you have written before, except that the question “is this the one?” is not written inside the function but handed in as a callback, \`ok\`. The types then say how the pieces connect: the items are \`T\`s, the callback is handed a \`T\`, and the answer is a \`T\` or \`undefined\`. One \`T\` ties all three together, so whatever kind of item goes in, the same kind comes out.

**The solution, line by line.**

- \`function firstWhere<T>(\` declares the function and its type parameter \`T\`.
- \`  xs: T[],\` the list to search, a list of \`T\`.
- \`  ok: (x: T) => boolean,\` the callback: a function that takes a \`T\` and answers \`true\` or \`false\`.
- \`): T | undefined {\` the result: one of the items, or \`undefined\` when nothing matched.
- \`  for (const x of xs) {\` visits the items in order, first to last.
- \`    if (ok(x)) {\` *calls* the callback on this item and tests its answer.
- \`      return x;\` hands back this item and stops the search at once, which is what makes it the *first* match.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return undefined;\` is reached only if the loop finished without returning, so nothing matched (an empty list lands here straight away).
- \`}\` closes the body.

Because of \`T\`, a call like \`firstWhere([3, 8, 12], (n) => n > 5)\` lets the checker fill \`T\` with \`number\`, so it knows \`n\` is a number inside the arrow function and that the result is \`number | undefined\`. The \`| undefined\` is honest: every caller must deal with “not found” (by narrowing) before using the answer.

**Common wrong attempts.**

- Remembering the match in a variable and returning it after the loop: the loop keeps going and overwrites it, so you get the *last* match.
- Writing \`if (ok)\` instead of \`if (ok(x))\`: that tests whether the callback exists (it always does), so the first item is always returned.`,
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
  lastOr: {
    optional: true,
    lang: 'ts',
    title: 'The last item, or a fallback',
    prompt:
      'Write the generic function `lastOr(xs, fallback)`, with type `lastOr<T>(xs: T[], fallback: T): T`. It returns the last item of `xs`, or `fallback` if the list is empty. Because the result is always a `T`, callers never have to deal with `undefined`.',
    starter: `function lastOr<T>(
  xs: T[],
  fallback: T,
): T {
  // your code here
}

console.log(lastOr([1, 2, 3], 0));
console.log(lastOr([], 'none'));`,
    solution: `function lastOr<T>(
  xs: T[],
  fallback: T,
): T {
  if (xs.length === 0) {
    return fallback;
  }
  return xs[xs.length - 1];
}`,
    tests: `test('numbers', () => {
  expect(lastOr([1, 2, 3], 0)).toBe(3);
});
test('strings', () => {
  expect(lastOr(['a', 'b'], 'z')).toBe('b');
});
test('an empty list gives the fallback', () => {
  expect(lastOr([], 'none')).toBe('none');
});
test('a real 0 at the end is not the fallback', () => {
  expect(lastOr([5, 0], 9)).toBe(0);
});
test('undefined never comes back', () => {
  expect(lastOr([], 7)).toBe(7);
});`,
    hints: [
      'There are two cases: the list is empty, or it is not. How can you tell which?',
      'Check `xs.length === 0` and return `fallback` straight away. Otherwise, the last slot is at index `xs.length - 1`.',
      'Write `if (xs.length === 0) { return fallback; }` and then `return xs[xs.length - 1];`.',
    ],
    walkthrough: `**How to think about it.** \`last<T>\` from the chapter returns \`T | undefined\`, which is honest but makes every caller narrow. Here the caller supplies an answer for the empty case up front, so the function can always return a real \`T\`. The one thing to be careful about is *how* you detect the empty case: by looking at the length, not at the value you read, because the last item may legitimately be \`0\`, \`''\` or \`false\`.

**The solution, line by line.**

- \`function lastOr<T>(\` declares the function and its blank \`T\`.
- \`  xs: T[],\` is a list of \`T\`, and \`  fallback: T,\` is one more \`T\`: the same blank, so a list of numbers needs a number fallback.
- \`): T {\` promises a \`T\`, never \`undefined\`.
- \`  if (xs.length === 0) {\` asks whether there is a last item at all.
- \`    return fallback;\` answers for the empty list.
- \`  }\` ends that case.
- \`  return xs[xs.length - 1];\` reads the last slot; for \`[1, 2, 3]\` the length is 3, so it reads index 2, which is \`3\`.
- \`}\` closes the body.

Because \`xs\` and \`fallback\` share the blank \`T\`, a call such as \`lastOr([1, 2], 'none')\` fills \`T\` with \`number | string\`, and the result is labelled that way too, so the checker will not let you treat it as a plain number by accident.

**Common wrong attempts.**

- Reading first and checking the value: \`const v = xs[xs.length - 1]; return v ? v : fallback;\`. A last item of \`0\` is falsy, so \`lastOr([5, 0], 9)\` wrongly gives \`9\`.
- Reading \`xs[xs.length]\`: that is one past the end, so it is always \`undefined\`.`,
    wrong: [
      {
        code: `function lastOr(xs, fallback) {
  const v = xs[xs.length - 1];
  return v ? v : fallback;
}`,
        why: 'A last item of `0` is falsy, so `lastOr([5, 0], 9)` gives `9`. Decide by the length, not by the value.',
      },
      {
        code: `function lastOr(xs, fallback) {
  if (xs.length === 0) {
    return fallback;
  }
  return xs[xs.length];
}`,
        why: '`xs[xs.length]` is one past the end, so it is `undefined`. The last index is `xs.length - 1`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'For `function first<T>(xs: T[]): T | undefined`, what does the checker infer for `first([true, false])`?',
    options: [
      { t: '`boolean | undefined`', correct: true, why: '`T` is filled in as `boolean` from the argument, and `undefined` covers an empty list.' },
      { t: '`T`', why: '`T` is a blank; each call fills it in with a real type.' },
      { t: '`true`', why: 'The array holds `true` and `false`, so `T` is the type covering both: `boolean`.' },
      { t: '`boolean`', why: 'The result type also includes `undefined`, for an empty list.' },
    ],
  },
  {
    q: '`type Result<T> = { ok: true; value: T } | { ok: false; error: string }`. Which of these is a valid `Result<number>`?',
    options: [
      { t: '`{ ok: true, value: \'42\' }`', why: 'The blank is filled with `number`, so `value` must be a number, not a string.' },
      { t: '`{ ok: false, value: 42 }`', why: 'The failed variant has an `error`, not a `value`.' },
      { t: '`{ ok: true, value: 42 }`', correct: true, why: 'The `ok: true` variant with a number `value`.' },
    ],
  },
  {
    q: 'In `firstWhere([\'ab\', \'cde\'], (s) => s.length === 3)`, what type does the checker give `s`?',
    options: [
      { t: '`string`', correct: true, why: '`T` is inferred as `string` from the list, and the callback’s parameter has type `T`.' },
      { t: '`T`', why: '`T` is filled in at the call; inside the callback it is a real type.' },
      { t: 'No type: it needs a label like `(s: string)`', why: 'Inference gives `s` its type; a label is allowed but not needed.' },
    ],
  },
  {
    q: 'What happens to `<T>` when `tsc` turns `first<T>` into JavaScript?',
    options: [
      { t: 'It becomes a hidden extra argument', why: 'Nothing is passed at run time; the function has the same parameters as before.' },
      { t: 'One copy of the function is made per type', why: 'TypeScript emits a single function for every caller.' },
      { t: 'It is erased, like every other type', correct: true, why: 'Only `function first(xs) { return xs[0]; }` remains.' },
    ],
  },
  {
    q: 'Which language’s usual stand-in for generics throws the type away, so the compiler can no longer catch a mix-up?',
    options: [
      { t: 'Java, with `List<T>`', why: 'Java checks `List<T>` at compile time (and then erases it, like TypeScript).' },
      { t: 'C, with `void *`', correct: true, why: '`void *` is a pointer to anything; once a value is stored as one, its real type is forgotten.' },
      { t: 'Python, with `list[T]`', why: 'Python’s hint keeps the type for a checker, though nothing enforces it at run time.' },
    ],
  },
];
