// Chapter 2 cards. Keys are stable ids: never rename them.

export const prompts = {
  'array-what': {
    q: 'What is an array?',
    a: 'An ordered list of values stored under one name, each in a numbered slot.',
  },
  'first-index': {
    q: 'What is the index of the first slot of an array, and why?',
    a: '`0`. The index counts how many steps from the start, and the first slot is zero steps away.',
  },
  'last-index': {
    q: 'An array has `length` 10. What is the index of its last slot?',
    a: '`9`: always `length - 1`.',
  },
  'past-end': {
    q: 'What do you get when you read `arr[arr.length]`?',
    a: '`undefined`: there is no slot there.',
  },
  push: {
    q: 'What does `arr.push(x)` do to `arr` and its `length`?',
    a: 'It adds `x` in a new slot at the end; `length` grows by 1.',
  },
  'loop-bound': {
    q: 'Why does the standard array loop test `i < arr.length` and not `i <= arr.length`?',
    a: 'The last valid index is `length - 1`. With `<=` the loop would read one slot past the end and get `undefined`.',
  },
  accumulator: {
    q: 'In a loop that sums an array, why is `total` declared *outside* (before) the loop?',
    a: 'So it survives from one pass of the loop to the next and keeps collecting. Declared inside, it would restart every time.',
  },
  'empty-array': {
    q: 'What does a summing loop return for an empty array `[]`, and why?',
    a: '`0`: the length is 0, so the test `0 < 0` fails at once, the body never runs, and `total` keeps its starting value.',
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
  max: {
    title: 'The largest value',
    prompt:
      'Write `max(arr)` that **returns** the largest number in a non-empty array. Don’t use any built-in helpers like `Math.max`: write the loop yourself.',
    starter: `function max(arr) {
  // your code here
}

console.log(max([3, 9, 2]));`,
    solution: `function max(arr) {
  let best = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > best) {
      best = arr[i];
    }
  }
  return best;
}`,
    tests: `test('finds the max in the middle', () => {
  expect(max([3, 9, 2])).toBe(9);
});
test('max at the end', () => {
  expect(max([1, 2, 3, 4])).toBe(4);
});
test('max at the start', () => {
  expect(max([7, 1, 1])).toBe(7);
});
test('all negative numbers', () => {
  expect(max([-5, -2, -9])).toBe(-2);
});
test('a single value', () => {
  expect(max([42])).toBe(42);
});`,
    hints: [
      'Keep a variable `best` holding the largest value seen *so far*.',
      'What should `best` start as? Not `0`: think about an array of negative numbers.',
      'Start `best` at `arr[0]`, then loop over the rest. If a slot is bigger than `best`, replace `best`.',
    ],
    walkthrough: `This is the accumulator pattern with a twist: instead of adding, we *keep the winner*.

- **Start with a real candidate.** \`let best = arr[0];\` says “so far, the first value is the biggest I’ve seen.” This is the key decision.
- **Challenge it with every other slot.** The loop starts at \`i = 1\` because slot 0 is already the champion. Starting at 0 would also work; it just compares \`arr[0]\` with itself once.
- **Replace on a win.** \`if (arr[i] > best) best = arr[i];\`
- **Return** the champion after the loop, not inside it.

Why not \`let best = 0\`? Because for \`[-5, -2, -9]\` nothing is bigger than 0, and you’d wrongly return 0, a number that isn’t even in the array.`,
    wrong: [
      {
        code: `function max(arr) {
  let best = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > best) {
      best = arr[i];
    }
  }
  return best;
}`,
        why: 'Starting at `0` fails for all-negative arrays: `max([-5, -2, -9])` returns `0`. Start from a value that is really in the array.',
      },
      {
        code: `function max(arr) {
  let best = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > best) {
      return arr[i];
    }
  }
  return best;
}`,
        why: '`return` stops the function at the *first* bigger value. For `[1, 2, 3, 4]` it returns `2`. Update `best` instead, and return after the loop.',
      },
    ],
  },
  countAbove: {
    optional: true,
    title: 'Count the big ones',
    prompt: 'Write `countAbove(arr, limit)` that returns **how many** values in `arr` are strictly greater than `limit`.',
    starter: `function countAbove(arr, limit) {
  // your code here
}

console.log(countAbove([5, 12, 8], 10));`,
    solution: `function countAbove(arr, limit) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > limit) {
      count = count + 1;
    }
  }
  return count;
}`,
    tests: `test('two values above 10', () => {
  expect(countAbove([5, 12, 8, 20], 10)).toBe(2);
});
test('equal is not above', () => {
  expect(countAbove([10, 10], 10)).toBe(0);
});
test('empty array', () => {
  expect(countAbove([], 3)).toBe(0);
});`,
    hints: [
      'Start a counter at 0 before the loop.',
      'Inside the loop, add 1 to the counter only when `arr[i] > limit`.',
    ],
    walkthrough: `Same accumulator shape as \`sum\`, but the accumulator counts instead of adds.

- \`let count = 0;\` before the loop.
- For each slot, \`if (arr[i] > limit)\` then \`count = count + 1\`.
- “Strictly greater” means \`>\`, not \`>=\`, so values equal to \`limit\` don’t count.
- An empty array never enters the loop and returns \`0\`, which is correct.`,
    wrong: [
      {
        code: `function countAbove(arr, limit) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= limit) {
      count = count + 1;
    }
  }
  return count;
}`,
        why: '`>=` also counts values *equal* to the limit, so `countAbove([10, 10], 10)` gives `2` instead of `0`.',
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
      { t: 'An error, because `a` is `const`', why: '`const` stops the name being reassigned, not the array being changed.' },
    ],
  },
  {
    q: 'Which loop visits every slot of `arr` exactly once?',
    options: [
      { t: '`for (let i = 1; i <= arr.length; i++)`', why: 'It skips slot 0 and reads one past the end.' },
      { t: '`for (let i = 0; i <= arr.length; i++)`', why: 'The last pass reads `arr[arr.length]`, which is `undefined`.' },
      { t: '`for (let i = 0; i < arr.length - 1; i++)`', why: 'It stops early and misses the last slot.' },
      { t: '`for (let i = 0; i < arr.length; i++)`', correct: true, why: 'From 0 up to `length - 1`: every slot, once.' },
    ],
  },
  {
    q: 'What is `[5, 6][2]`?',
    options: [
      { t: '`6`', why: '`6` is at index 1.' },
      { t: '`undefined`', correct: true, why: 'The array has slots 0 and 1 only; index 2 is past the end.' },
      { t: 'An error', why: 'JavaScript does not throw for reading past the end; it gives `undefined`.' },
      { t: '`5`', why: '`5` is at index 0.' },
    ],
  },
  {
    q: 'Why does reading a slot by index take the same time for index 2 or index 2,000,000?',
    options: [
      { t: 'The engine searches from the start but very quickly', why: 'No searching is needed at all.' },
      { t: 'The slot’s position is computed directly: start of the array plus index steps', correct: true, why: 'That is exactly why indexes count steps from the start, beginning at 0.' },
      { t: 'Arrays are always sorted', why: 'Arrays keep whatever order you put things in; sorting is unrelated.' },
      { t: 'It doesn’t: bigger indexes are slower', why: 'Reading any slot by index is equally quick.' },
    ],
  },
];
