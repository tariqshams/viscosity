// Chapter 3 cards. Keys are stable ids: never rename them.

export const prompts = {
  'array-what': {
    q: 'What is an array?',
    a: 'An ordered list of values stored under one name, each in a numbered slot.',
  },
  'first-index': {
    q: 'What is the index of the first slot of an array, and why?',
    a: '`0`. The index counts how many steps from the start, and the first slot is zero steps away.',
  },
  'index-expr': {
    q: 'With `const i = 1;`, what does `xs[i + 1]` read?',
    a: 'Slot 2: the index can be any calculation, and it is worked out before the slot is read.',
  },
  'last-index': {
    q: 'An array has `length` 10. What is the index of its last slot?',
    a: '`9`: always `length - 1`.',
  },
  'past-end': {
    q: 'What do you get when you read `arr[arr.length]`?',
    a: '`undefined`: there is no slot there, and JavaScript gives “nothing” rather than an error.',
  },
  'why-fast': {
    q: 'Why does reading slot 2,000,000 of a packed array take no longer than reading slot 2?',
    a: 'Nothing is searched: the slot’s place is worked out directly as the start plus `index` steps.',
  },
  push: {
    q: 'What does `arr.push(x)` do to `arr` and its `length`?',
    a: 'It adds `x` in a new slot at the end; `length` grows by 1.',
  },
  'length-after-push': {
    q: 'After `const xs = []; xs.push(5); xs.push(6);`, what are `xs.length` and `xs[1]`?',
    a: '`2` and `6`: two pushes made slots 0 and 1, holding 5 and 6.',
  },
};

export const examples = {
  'arrays-basics': {
    title: 'Read, change, grow',
    code: `const scores = [90, 72, 85, 64];
console.log(scores[2]);

scores[1] = 75;
scores.push(100);

console.log(scores);
console.log(scores.length);
console.log(scores[scores.length - 1]);`,
  },
};

export const exercises = {
  last: {
    title: 'The last value',
    prompt:
      'Write `last(arr)` that **returns** the value in the last slot of `arr`, whatever its length. For an empty array it should return `undefined` (there is no last value).',
    starter: `function last(arr) {
  // your code here
}

console.log(last([3, 9, 2]));`,
    solution: `function last(arr) {
  return arr[arr.length - 1];
}`,
    tests: `test('three values', () => {
  expect(last([3, 9, 2])).toBe(2);
});
test('a longer array', () => {
  expect(last([1, 2, 3, 4, 5])).toBe(5);
});
test('one value', () => {
  expect(last(['a'])).toBe('a');
});
test('empty array', () => {
  expect(last([])).toBe(undefined);
});`,
    hints: [
      'Which index does the last slot have, for an array of 3? Of 5? Is there a pattern?',
      'The last index is always one less than the length, because indexes start at 0.',
      'Read the slot at `arr.length - 1`, and `return` it.',
    ],
    walkthrough: `**How to think about it.** Try a few arrays by hand before writing anything. \`[3, 9, 2]\` has length 3 and its last value sits at index 2; \`[1, 2, 3, 4, 5]\` has length 5 and its last value sits at index 4. Every time, the last index is the length minus one, because counting starts at 0. You cannot write a fixed number like \`2\`, since the function must work for an array of any length, so use the array's own \`length\`.

**The solution, line by line.**

- \`function last(arr) {\` defines \`last\` with one parameter, the array.
- \`  return arr[arr.length - 1];\` works from the inside out: \`arr.length\` is the number of slots (3 for \`[3, 9, 2]\`), minus 1 gives the last index (2), \`arr[2]\` reads that slot (\`2\`), and \`return\` sends it back.
- \`}\` closes the body.

What about \`[]\`? Its length is 0, so the index is \`0 - 1\`, which is \`-1\`, and there is no slot -1, so \`arr[-1]\` is \`undefined\`: exactly the answer we want, with no special case.

**Common wrong attempts.**

- \`return arr[arr.length];\` is one step too far: index 3 of a three-slot array does not exist, so this always returns \`undefined\`.
- \`return arr[2];\` works for the first test only, because it is tied to one particular length.`,
    wrong: [
      {
        code: `function last(arr) {
  return arr[arr.length];
}`,
        why: 'Index `arr.length` is one past the end, so this always returns `undefined`.',
      },
      {
        code: `function last(arr) {
  return arr[2];
}`,
        why: 'Works only for arrays of length 3. Use `arr.length - 1` so it fits any length.',
      },
    ],
  },
  countdown: {
    optional: true,
    title: 'Build a countdown',
    prompt:
      'Write `countdown(n)` that **returns a new array** `[n, n - 1, ..., 1]`. For example `countdown(3)` returns `[3, 2, 1]`, and `countdown(0)` returns `[]`.',
    starter: `function countdown(n) {
  // your code here
}

console.log(countdown(3));`,
    solution: `function countdown(n) {
  const out = [];
  for (let i = n; i >= 1; i--) {
    out.push(i);
  }
  return out;
}`,
    tests: `test('from 3', () => {
  expect(countdown(3)).toEqual([3, 2, 1]);
});
test('from 1', () => {
  expect(countdown(1)).toEqual([1]);
});
test('from 0 is empty', () => {
  expect(countdown(0)).toEqual([]);
});`,
    hints: [
      'Start with an empty array, and add one number at a time.',
      'A `for` loop can count down: start at `n`, keep going while the counter is at least 1, and subtract 1 each time (`i--`).',
      'Inside the loop, `out.push(i)`. After the loop, `return out`.',
    ],
    walkthrough: `**How to think about it.** You do not know in advance how many numbers there will be, so you cannot write the array out with square brackets. Instead, start with an empty array and \`push\` the numbers in, in the order they should appear: \`n\` first, then \`n - 1\`, down to \`1\`. A loop that counts down produces exactly that order.

**The solution, line by line.**

- \`function countdown(n) {\` takes the starting number.
- \`  const out = [];\` makes an empty array, length 0, to fill.
- \`  for (let i = n; i >= 1; i--) {\` is a loop that counts *down*: \`i\` starts at \`n\`, the loop runs while \`i\` is at least 1, and \`i--\` takes 1 off \`i\` after each pass (it is short for \`i = i - 1\`). For \`n = 3\`, \`i\` is 3, then 2, then 1, then 0, where the test fails and the loop stops.
- \`    out.push(i);\` adds the current number at the end. After three passes, \`out\` is \`[3, 2, 1]\`.
- \`  }\` closes the loop.
- \`  return out;\` hands the finished array back.
- \`}\` closes the body.

For \`countdown(0)\`, \`i\` starts at 0, the test \`0 >= 1\` fails at once, the loop body never runs, and the empty array comes back.

**Common wrong attempts.**

- Counting up (\`for (let i = 1; i <= n; i++)\`) produces \`[1, 2, 3]\`: the right numbers in the wrong order.
- Writing \`i > 1\` as the test stops one step early and leaves out the final \`1\`.`,
    wrong: [
      {
        code: `function countdown(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(i);
  }
  return out;
}`,
        why: 'Counts up, so `countdown(3)` is `[1, 2, 3]` rather than `[3, 2, 1]`.',
      },
      {
        code: `function countdown(n) {
  const out = [];
  for (let i = n; i > 1; i--) {
    out.push(i);
  }
  return out;
}`,
        why: 'The test `i > 1` stops before pushing `1`, so `countdown(3)` is `[3, 2]`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const a = [10, 20, 30];` What is `a[1]`?',
    options: [
      { t: '`10`', why: 'That is `a[0]`. Indexes start at 0.' },
      { t: '`20`', correct: true, why: 'Index 1 is the second slot.' },
      { t: '`30`', why: 'That is `a[2]`, the last slot.' },
      { t: '`undefined`', why: 'Index 1 exists: the array has slots 0, 1 and 2.' },
    ],
  },
  {
    q: 'An array has 7 values. What is the index of the last one?',
    options: [
      { t: '`7`', why: 'Index 7 would be the 8th slot, one past the end.' },
      { t: '`8`', why: 'That is two past the end.' },
      { t: '`6`', correct: true, why: 'The last index is always `length - 1`.' },
      { t: 'It depends on the values', why: 'Indexes depend only on the number of slots, not on what is in them.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const a = [1, 2, 3];
a.push(4);
console.log(a.length);
\`\`\``,
    options: [
      { t: '`3`', why: '`push` added a slot, so the length grew.' },
      { t: '`4`', correct: true, why: 'Three slots plus one pushed value gives a length of 4.' },
      { t: '`[1, 2, 3, 4]`', why: 'That is `a` itself; the code prints `a.length`.' },
      { t: 'An error, because `a` is `const`', why: '`const` stops the name being pointed at another array, not the array being changed.' },
    ],
  },
  {
    q: 'What is `[5, 6][2]`?',
    options: [
      { t: '`6`', why: '`6` is at index 1.' },
      { t: '`undefined`', correct: true, why: 'The array has slots 0 and 1 only; index 2 is past the end.' },
      { t: 'An error', why: 'JavaScript does not stop for reading past the end; it gives `undefined`. (Python and Java would stop with an error.)' },
      { t: '`5`', why: '`5` is at index 0.' },
    ],
  },
  {
    q: 'Why does reading a slot by index take the same time for index 2 or index 2,000,000?',
    options: [
      { t: 'The engine searches from the start, but very quickly', why: 'No searching is needed at all.' },
      { t: 'The slot’s place is worked out directly: the start of the array plus index steps', correct: true, why: 'That is exactly why indexes count steps from the start, beginning at 0.' },
      { t: 'Arrays are always sorted', why: 'Arrays keep whatever order you put things in; sorting is unrelated.' },
    ],
  },
  {
    q: 'In Python, `[4, 8, 15][-1]` is `15`. What is `[4, 8, 15][-1]` in JavaScript?',
    options: [
      { t: '`15`', why: 'That is Python’s rule; JavaScript has no slot -1. (JavaScript’s `xs.at(-1)` does read the last item.)' },
      { t: 'An error', why: 'JavaScript does not stop for a missing slot.' },
      { t: '`4`', why: 'Index -1 does not wrap round to the first slot either.' },
      { t: '`undefined`', correct: true, why: 'There is no slot -1, so you get `undefined`, just as for reading past the end.' },
    ],
  },
];
