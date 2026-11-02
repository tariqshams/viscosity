// Chapter 39 cards. Keys are stable ids: never rename them.
//
// Tests that use endless sequences pull from a guarded generator that
// throws after 50 values, so a solution that asks for too much fails
// quickly instead of looping for ever.

export const prompts = {
  'iter-next': {
    q: 'What does an iterator’s `next()` return?',
    a: 'An object `{ value, done }`: the next value with `done: false`, or `done: true` when there are no more.',
  },
  'iterable-vs-iterator': {
    q: 'What is the difference between an iterable and an iterator?',
    a: 'An iterable has a `[Symbol.iterator]()` method that makes a fresh iterator; the iterator has `next()` and remembers its position.',
  },
  'plain-object': {
    q: 'Why does `for (const k of { a: 1 })` throw “is not iterable”?',
    a: 'Plain objects have no `[Symbol.iterator]` method. Loop over `Object.keys(o)` (an array) instead.',
  },
  'gen-call': {
    q: '`function* g() { console.log(\'hi\'); yield 1; }`. Does `const it = g();` print anything?',
    a: 'No. Calling a generator function only makes a paused generator; the body starts at the first `next()`.',
  },
  'yield-what': {
    q: 'What does `yield v` do inside a generator?',
    a: 'It hands `v` out as `{ value: v, done: false }` and pauses the body until the next `next()`.',
  },
  'yield-star': {
    q: 'What is the difference between `yield xs` and `yield* xs`, when `xs` is an array?',
    a: '`yield xs` hands out the whole array as one value; `yield* xs` hands out each of its elements in turn.',
  },
  'lazy-what': {
    q: 'What makes a sequence lazy?',
    a: 'Each value is produced only when it is asked for, not all in advance.',
  },
  'infinite-safe': {
    q: 'Why is `while (true) yield n++;` inside a generator not an endless loop that freezes the program?',
    a: 'The body pauses at every `yield`, so each `next()` runs one turn of the loop and no more.',
  },
};

export const examples = {
  'lazy-order': {
    title: 'Made, used, made, used',
    code: `function* naturals() {
  let n = 0;
  while (true) {
    console.log('made', n);
    yield n++;
  }
}

function* take(it, n) {
  if (n <= 0) return;
  for (const x of it) {
    yield x;
    if (--n === 0) return;
  }
}

for (const x of take(naturals(), 3)) {
  console.log('used', x);
}`,
  },
};

export const exercises = {
  range: {
    title: 'A range generator',
    prompt:
      'Write a generator `range(lo, hi, step)` that yields `lo`, `lo + step`, `lo + 2 * step` and so on, for as long as the number is **below** `hi`. `step` is 1 when it is left out (write `step = 1` in the parameter list for a default value). So `[...range(0, 4)]` is `[0, 1, 2, 3]` and `[...range(1, 10, 3)]` is `[1, 4, 7]`. You may assume `step` is positive.',
    starter: `function* range(lo, hi, step = 1) {
  // your code here
}

console.log([...range(0, 4)]);
console.log([...range(1, 10, 3)]);`,
    solution: `function* range(lo, hi, step = 1) {
  for (let i = lo; i < hi; i += step) {
    yield i;
  }
}`,
    tests: `test('0 up to 4', () => {
  expect([...range(0, 4)]).toEqual([0, 1, 2, 3]);
});
test('a step of 3', () => {
  expect([...range(1, 10, 3)]).toEqual([1, 4, 7]);
});
test('hi itself is left out', () => {
  expect([...range(0, 6, 2)]).toEqual([0, 2, 4]);
});
test('an empty range', () => {
  expect([...range(5, 5)]).toEqual([]);
  expect([...range(5, 1)]).toEqual([]);
});
test('works with for...of', () => {
  let sum = 0;
  for (const i of range(1, 4)) sum += i;
  expect(sum).toBe(6);
});
test('it is lazy: values come one at a time', () => {
  const it = range(0, 1e6);
  expect(it.next().value).toBe(0);
  expect(it.next().value).toBe(1);
});`,
    hints: [
      'Write the plain `for` loop that would print the numbers. A generator is that loop with `yield` where the printing would go.',
      'The loop variable starts at `lo`, keeps going while it is below `hi`, and grows by `step` each turn.',
      'Inside the generator: `for (let i = lo; i < hi; i += step) { yield i; }`. Nothing needs to be returned.',
    ],
    walkthrough: `**How to think about it.** Forget generators for a moment: how would you *print* 1, 4, 7 for \`lo = 1\`, \`hi = 10\`, \`step = 3\`? A \`for\` loop that starts at \`lo\`, runs while below \`hi\` and adds \`step\` each time. A generator is exactly that loop, with \`yield\` handing each number to whoever asked, instead of printing it. Because the body pauses at each \`yield\`, the loop only runs as far as the caller wants, which is why even \`range(0, Infinity)\` is safe as long as you ask for only a few values.

**The solution, line by line.**

- \`function* range(lo, hi, step = 1) {\` the \`*\` makes this a generator function: calling it runs nothing and returns a paused generator. \`step = 1\` is a **default parameter value**: if the caller leaves \`step\` out, it is \`1\`.
- \`  for (let i = lo; i < hi; i += step) {\` an ordinary counting loop: start at \`lo\`, stop as soon as \`i\` reaches or passes \`hi\` (so \`hi\` itself is never included), and add \`step\` after each turn.
- \`    yield i;\` hand \`i\` out and pause. The next \`next()\` resumes right here, so the loop does \`i += step\` and checks \`i < hi\` again.
- \`  }\` and \`}\` close the loop and the generator. When the loop ends, the body ends, and \`next()\` returns \`{ done: true }\`, which ends any \`for...of\` or spread.

For \`range(5, 1)\` the condition \`5 < 1\` is false at once, so nothing is yielded and the result is an empty array.

**Common wrong attempts.**

- Building an array and returning it (\`const out = []; ... return out;\`) from a generator: \`return\` in a generator sets the final \`value\` that \`for...of\` and spread ignore, so the result is \`[]\`. (And without the \`*\`, an array-building \`range(0, Infinity)\` would never finish.)
- Using \`i <= hi\`: \`hi\` itself sneaks in, so \`range(0, 4)\` gives five numbers.`,
    wrong: [
      {
        code: `function* range(lo, hi, step = 1) {
  const out = [];
  for (let i = lo; i < hi; i += step) {
    out.push(i);
  }
  return out;
}`,
        why: 'A generator’s `return` value is ignored by spread and `for...of`, so `[...range(0, 4)]` is `[]`. Use `yield`.',
      },
      {
        code: `function* range(lo, hi, step = 1) {
  for (let i = lo; i <= hi; i += step) {
    yield i;
  }
}`,
        why: 'With `<=`, `hi` itself is included: `range(0, 4)` gives `[0, 1, 2, 3, 4]`.',
      },
    ],
  },
  takeWhile: {
    optional: true,
    title: 'Take while it holds',
    prompt:
      'Write a generator `takeWhile(it, ok)` that yields the values of the iterable `it` for as long as `ok(value)` is true, and stops at the **first** value for which it is false (without yielding that value, and without asking for any more). It must work on endless sequences.',
    starter: `function* takeWhile(it, ok) {
  // your code here
}

function* naturals() {
  let n = 0;
  while (true) yield n++;
}
const small = takeWhile(
  naturals(), (n) => n < 4);
console.log([...small]);`,
    solution: `function* takeWhile(it, ok) {
  for (const x of it) {
    if (!ok(x)) return;
    yield x;
  }
}`,
    tests: `function* nat() {
  let n = 0;
  while (true) {
    if (n > 50) throw new Error('pulled too far');
    yield n++;
  }
}
test('from an endless sequence', () => {
  const xs = [...takeWhile(nat(), (n) => n < 3)];
  expect(xs).toEqual([0, 1, 2]);
});
test('stops at the first failure', () => {
  const xs = [1, 2, 5, 1];
  expect([...takeWhile(xs, (x) => x < 3)]).toEqual([1, 2]);
});
test('asks for one value past the last kept', () => {
  let pulled = 0;
  function* counted() {
    for (const x of [1, 2, 9, 3, 4]) { pulled++; yield x; }
  }
  [...takeWhile(counted(), (x) => x < 5)];
  expect(pulled).toBe(3);
});
test('all pass: everything comes through', () => {
  expect([...takeWhile([1, 2], () => true)]).toEqual([1, 2]);
});
test('none pass: nothing comes through', () => {
  expect([...takeWhile([1, 2], () => false)]).toEqual([]);
});`,
    hints: [
      'Loop over `it` with `for...of`. For each value there are two cases: it passes `ok`, or it does not.',
      'A value that passes is yielded. The first value that fails ends the generator, and `return` ends a generator.',
      '`for (const x of it) { if (!ok(x)) return; yield x; }`. Leaving the loop with `return` also tells `it` to stop.',
    ],
    walkthrough: `**How to think about it.** This is a filter that gives up at the first failure, rather than skipping it. That difference is what makes it safe on an endless sequence: a filter would keep asking for values for ever, hoping for more matches, while \`takeWhile\` stops at the first one that fails. Laziness does the rest: values are pulled one at a time, so the generator asks for exactly one value past the last one it keeps (it has to see that value to know it fails).

**The solution, line by line.**

- \`function* takeWhile(it, ok) {\` a generator taking any iterable and a test function (a callback).
- \`  for (const x of it) {\` pulls values from \`it\` one at a time, only when \`takeWhile\` itself is asked for its next value.
- \`    if (!ok(x)) return;\` the first value that fails the test ends the generator. \`return\` inside a \`for...of\` also leaves the loop early, which tells the source iterator it is finished (its \`return()\` method), so an endless generator is closed cleanly.
- \`    yield x;\` a value that passes is handed out, and the generator pauses until the next request.
- \`  }\` and \`}\` close the loop and the function. If \`it\` runs out first, the loop ends normally and so does the generator.

**Common wrong attempts.**

- Yielding only the values that pass, but never stopping (a filter): on \`[1, 2, 5, 1]\` it gives \`[1, 2, 1]\`, and on an endless sequence it never finishes (the tests' guarded \`nat\` throws "pulled too far" instead).
- Yielding the failing value before returning: the result includes one value too many.`,
    wrong: [
      {
        code: `function* takeWhile(it, ok) {
  for (const x of it) {
    if (ok(x)) yield x;
  }
}`,
        why: 'This is a filter: it skips failures instead of stopping, so `[1, 2, 5, 1]` gives `[1, 2, 1]` and an endless input is never finished.',
      },
      {
        code: `function* takeWhile(it, ok) {
  for (const x of it) {
    yield x;
    if (!ok(x)) return;
  }
}`,
        why: 'The failing value is yielded before stopping, so the result has one value too many.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does this print?\n```js\nconst it = [\'a\'][Symbol.iterator]();\nit.next();\nconsole.log(it.next().done);\n```',
    options: [
      { t: '`false`', why: 'The first `next()` already handed out `\'a\'`; there is nothing left.' },
      { t: '`true`', correct: true, why: 'The second call finds no more values, so it returns `{ value: undefined, done: true }`.' },
      { t: '`undefined`', why: '`done` is always present on an array iterator’s results; it is `true` here.' },
    ],
  },
  {
    q: 'In what order are the lines printed?\n```js\nfunction* g() {\n  console.log(\'B\');\n  yield 1;\n}\nconst it = g();\nconsole.log(\'A\');\nit.next();\n```',
    options: [
      { t: 'B, then A', why: 'Calling `g()` runs none of the body, so `B` cannot come first.' },
      { t: 'A only', why: 'The `next()` call does run the body up to `yield 1`, which prints `B`.' },
      { t: 'A, then B', correct: true, why: '`g()` only makes the paused generator; the body (and `B`) runs at the first `next()`.' },
    ],
  },
  {
    q: 'Which of these can `for...of` loop over directly?',
    options: [
      { t: 'A `Map`, a `Set`, a string and a generator', correct: true, why: 'All of them have a `[Symbol.iterator]()` method.' },
      { t: 'Any object at all', why: 'Plain objects have no `[Symbol.iterator]`: “o is not iterable”.' },
      { t: 'Only arrays', why: 'Strings, Maps, Sets, typed arrays and generators are iterable too.' },
    ],
  },
  {
    q: '`function* f() { yield* [1, 2]; yield [3, 4]; }`. What is `[...f()]`?',
    options: [
      { t: '`[1, 2, 3, 4]`', why: 'Only `yield*` spreads an iterable out; plain `yield [3, 4]` hands out the array as one value.' },
      { t: '`[1, 2, [3, 4]]`', correct: true, why: '`yield*` hands out 1 and 2 one by one; `yield [3, 4]` hands out one array.' },
      { t: '`[[1, 2], [3, 4]]`', why: '`yield*` does not hand out the array as one value; it hands out its elements.' },
    ],
  },
  {
    q: 'Why is `take(naturals(), 3)` fine but `[...naturals()]` never finishes?',
    options: [
      { t: 'Because `naturals` runs faster inside `take`', why: 'Speed is not the issue: one is finite and one is not.' },
      { t: 'Because spread makes a copy first', why: 'Spread does make an array, but the problem is that it never gets to the end of the values.' },
      { t: 'Because the sequence is lazy: `take` asks for three values and stops, while spread asks for every value', correct: true, why: 'Values are made only when asked for, so asking for a finite number of them is safe.' },
    ],
  },
];
