// Chapter 4 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'loop-start': {
    q: 'Why does the standard array loop start with `let i = 0`?',
    a: 'Because `0` is the index of the first slot.',
  },
  'loop-bound': {
    q: 'Why does the standard array loop test `i < arr.length` and not `i <= arr.length`?',
    a: 'The last valid index is `length - 1`. With `<=` the loop would read one slot past the end and get `undefined`.',
  },
  'loop-runs': {
    q: 'For an array of length 5, how many times does the body of `for (let i = 0; i < arr.length; i++)` run?',
    a: 'Five: once for each of the indexes 0, 1, 2, 3 and 4.',
  },
  accumulator: {
    q: 'In a loop that sums an array, why is `total` declared *outside* (before) the loop?',
    a: 'So it survives from one pass of the loop to the next and keeps collecting. Declared inside, it would restart every time.',
  },
  'nan-off-by-one': {
    q: 'A summing loop uses `i <= arr.length` by mistake. What does the total become, and why?',
    a: '`NaN`: the last pass reads `arr[arr.length]`, which is `undefined`, and a number plus `undefined` is `NaN`.',
  },
  'why-function': {
    q: 'Why put an array loop inside a function with the array as a parameter?',
    a: 'Then the same few lines work for any array of any length: each call passes a different array.',
  },
  'empty-array': {
    q: 'What does a summing loop return for an empty array `[]`, and why?',
    a: '`0`: the length is 0, so the test `0 < 0` fails at once, the body never runs, and `total` keeps its starting value.',
  },
  'write-in-loop': {
    q: 'What does `for (let i = 0; i < xs.length; i++) xs[i] = xs[i] + 1;` do to `xs`?',
    a: 'It adds 1 to every slot, changing the array itself rather than collecting an answer.',
  },
};

export const examples = {
  sum: {
    title: 'Summing any array',
    code: `function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total = total + arr[i];
  }
  return total;
}

console.log(sum([4, 8, 15]));
console.log(sum([1, 2]));
console.log(sum([]));`,
  },
};

export const exercises = {
  max: {
    title: 'The largest value',
    prompt: 'Write `max(arr)` that **returns** the largest number in a non-empty array. Don’t use any built-in helpers like `Math.max`: write the loop yourself.',
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
      'How would you find the biggest number on a long list by eye, if you could only look at one number at a time?',
      'Keep a variable `best` holding the largest value seen *so far*, and compare each slot with it. What should `best` start as? Not `0`: think about an array of negative numbers.',
      'Start with `let best = arr[0];`, loop over the other slots, and when `arr[i] > best`, set `best = arr[i]`. Return `best` after the loop.',
    ],
    walkthrough: `**How to think about it.** Picture going down a list of numbers with your finger, one at a time, remembering only "the biggest I have seen so far". Each new number either beats that champion (so it becomes the new champion) or it does not (so you move on). When you reach the end, the champion is the answer. That is the accumulator pattern with a twist: instead of adding to the accumulator, you *replace* it when something better comes along. The one real decision is what the champion should be before you have looked at anything, and the safe answer is "the first number in the list", because it is certainly a real value from the array.

**The solution, line by line.**

- \`function max(arr) {\` defines \`max\` with one parameter, the array.
- \`  let best = arr[0];\` makes the accumulator and starts it at the first slot: "so far, the first value is the biggest I have seen". It is \`let\`, not \`const\`, because it will change.
- \`  for (let i = 1; i < arr.length; i++) {\` visits every *other* slot. It starts at \`1\` because slot 0 is already the champion; starting at \`0\` would also work, and would only compare \`arr[0]\` with itself once.
- \`    if (arr[i] > best) {\` asks whether this slot beats the champion.
- \`      best = arr[i];\` makes it the new champion.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return best;\` sends the champion back, *after* the loop, once every slot has had its chance.
- \`}\` closes the body.

For \`[3, 9, 2]\`: \`best\` starts at 3; at \`i = 1\`, 9 > 3, so \`best\` becomes 9; at \`i = 2\`, 2 > 9 is false; the loop ends and 9 is returned. For \`[42]\`, the loop test \`1 < 1\` fails at once and 42 comes straight back.

**Common wrong attempts.**

- \`let best = 0;\` looks natural but fails for \`[-5, -2, -9]\`: nothing in it is bigger than 0, so the function returns 0, a number that is not even in the array.
- Writing \`return arr[i];\` inside the \`if\` instead of updating \`best\`: \`return\` ends the whole function at the *first* bigger value, so \`max([1, 2, 3, 4])\` returns 2.
- Putting \`return best;\` inside the loop: the function stops after the first pass.`,
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
      'This is the same shape as the summing loop; what is the accumulator now?',
      'Start a counter at 0 before the loop, and add 1 to it only when `arr[i] > limit`.',
      'Inside the loop: `if (arr[i] > limit) { count = count + 1; }`. Return `count` after the loop.',
    ],
    walkthrough: `**How to think about it.** Counting is summing in disguise: instead of adding each slot's *value* to the accumulator, you add *one* for each slot that passes a test, and nothing for the rest. "Strictly greater" means bigger and not equal, which is the \`>\` comparison.

**The solution, line by line.**

- \`function countAbove(arr, limit) {\` takes the array and the limit, matched by position.
- \`  let count = 0;\` is the accumulator: no values counted yet.
- \`  for (let i = 0; i < arr.length; i++) {\` visits every slot once.
- \`    if (arr[i] > limit) {\` tests the current slot.
- \`      count = count + 1;\` adds one for a slot that passed.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return count;\` hands back the count once every slot has been seen.
- \`}\` closes the body.

For \`[5, 12, 8, 20]\` with limit 10, only 12 and 20 pass, so the answer is 2. An empty array never enters the loop, and 0 comes back, which is correct.

**Common wrong attempts.**

- Using \`>=\`, which also counts values *equal* to the limit, so \`countAbove([10, 10], 10)\` gives 2 instead of 0.
- Declaring \`let count = 0;\` inside the loop: it would restart at 0 on every pass, and only exist inside the loop's body.`,
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
    q: 'Which loop visits every slot of `arr` exactly once?',
    options: [
      {
        t: '`for (let i = 1; i <= arr.length; i++)`',
        why: 'It skips slot 0 and reads one past the end.',
      },
      {
        t: '`for (let i = 0; i <= arr.length; i++)`',
        why: 'The last pass reads `arr[arr.length]`, which is `undefined`.',
      },
      {
        t: '`for (let i = 0; i < arr.length - 1; i++)`',
        why: 'It stops early and misses the last slot.',
      },
      {
        t: '`for (let i = 0; i < arr.length; i++)`',
        correct: true,
        why: 'From 0 up to `length - 1`: every slot, once.',
      },
    ],
  },
  {
    q: 'A summing loop runs over `[]`, the empty array. What does it return, if `total` starts at `0`?',
    options: [
      {
        t: '`0`',
        correct: true,
        why: 'The test `0 < 0` fails at once, the body never runs, and `total` keeps its starting value.',
      },
      {
        t: '`undefined`',
        why: 'Nothing is read from the array at all, so no `undefined` is ever added.',
      },
      {
        t: 'An error',
        why: 'Looping zero times is perfectly fine.',
      },
    ],
  },
  {
    q: `What is \`t\` after this?
\`\`\`
const xs = [1, 2];
let t = 0;
for (let i = 0; i <= xs.length; i++) {
  t = t + xs[i];
}
\`\`\``,
    options: [
      {
        t: '`3`',
        why: 'That would be right with `<`. Here there is one extra pass.',
      },
      {
        t: '`NaN`',
        correct: true,
        why: 'The last pass adds `xs[2]`, which is `undefined`, and `3 + undefined` is `NaN`.',
      },
      {
        t: 'An error',
        why: 'Reading past the end gives `undefined` quietly; no error stops the loop.',
      },
    ],
  },
  {
    q: `What does this return for \`[5, 6, 7]\`?
\`\`\`
function f(xs) {
  for (let i = 0; i < xs.length; i++) {
    let t = 0;
    t = t + xs[i];
  }
  return xs.length;
}
\`\`\``,
    options: [
      {
        t: '`18`',
        why: 'The function returns `xs.length`, not a total (and `t` restarts every pass anyway).',
      },
      {
        t: '`7`',
        why: 'That is the last value; the function returns the length.',
      },
      {
        t: '`3`',
        correct: true,
        why: 'It returns `xs.length`. The loop does nothing useful: `t` is made fresh inside each pass, so it never accumulates.',
      },
    ],
  },
  {
    q: 'In C, why does a function that sums an array usually take the length as a second parameter?',
    options: [
      {
        t: 'A C array passed to a function does not carry its length with it',
        correct: true,
        why: 'Unlike JavaScript and Java, there is no `.length` to ask, so the caller must say how many slots there are.',
      },
      {
        t: 'C loops must count down',
        why: 'C loops can count either way.',
      },
      {
        t: 'To make the loop faster',
        why: 'It is about knowing where to stop, not speed.',
      },
    ],
  },
];
