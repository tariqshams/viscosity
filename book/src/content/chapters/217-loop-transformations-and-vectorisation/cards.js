// Chapter 219 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'unroll-what': {
    q: 'What does unrolling a loop by 4 do?',
    a: 'Puts four copies of the body in each trip, for `i` to `i + 3`, and steps the counter by 4.',
  },
  remainder: {
    q: 'A loop of 10 trips is unrolled by 4. How many trips does the remainder loop run?',
    a: 'Two: `10 mod 4`, the trips for `i = 8` and `i = 9`.',
  },
  'unroll-cost': {
    q: 'What does unrolling cost?',
    a: 'Code size, and registers to hold the copies’ values; past a point the bigger body is slower, not faster.',
  },
  'unroll-legal': {
    q: 'Why is unrolling (with a remainder loop for leftover trips) always allowed, when vectorising is not?',
    a: 'Unrolling runs the same bodies in the same order; vectorising runs some of them at the same time.',
  },
  'autovec-what': {
    q: 'What is auto-vectorisation, in terms of unrolling?',
    a: 'Unrolling by the number of lanes, checking the copies may run at once, merging them into SIMD instructions, and adding a remainder loop.',
  },
  'lane-reads': {
    q: 'Why can `x[i] = x[i - 1] + 1` not run four lanes at once?',
    a: 'All lanes read at the same moment, so the lane for `i + 1` reads `x[i]` before the lane for `i` has written it.',
  },
  'distance-lanes': {
    q: 'Each trip of a loop reads the element 4 places back. How many lanes can run at once?',
    a: 'Up to 4: a group of 4 only reads elements the previous group wrote.',
  },
  'autovec-overlap': {
    q: 'What does LLVM’s loop vectoriser do when two arrays might overlap in memory?',
    a: 'Adds a check that runs while the program runs, and falls back to the plain loop if they overlap.',
  },
};

export const examples = {
  lanes: {
    title: 'Run a loop four lanes at a time',
    code: `function seq(xs, f) {
  const ys = [...xs];
  for (let i = 1; i < ys.length; i++) {
    ys[i] = f(ys, i);
  }
  return ys.join(' ');
}
// W lanes: all read, then all write
function lanes(xs, f, W) {
  const ys = [...xs];
  const n = ys.length;
  for (let i = 1; i < n; i += W) {
    const got = [];
    for (let l = 0; l < W; l++) {
      if (i + l < n) {
        got.push(f(ys, i + l));
      }
    }
    got.forEach((v, l) => {
      ys[i + l] = v;
    });
  }
  return ys.join(' ');
}
const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const dbl = (x, i) => x[i] * 2;
const prev = (x, i) => x[i - 1] + 1;
const zs = [0, 0, 0, 0, 0, 0, 0, 0, 0];
console.log(seq(xs, dbl));
console.log(lanes(xs, dbl, 4));
console.log(seq(zs, prev));
console.log(lanes(zs, prev, 4));`,
  },
};

export const exercises = {
  sumUnrolled: {
    title: 'Sum, unrolled by four',
    prompt: 'Write `sumUnrolled(a)` that returns the sum of the numbers in `a`, using a main loop **unrolled by 4** (four elements per trip, stepping with `i += 4`) and a remainder loop for the elements left over. It must work for any length, including 0. (One test checks that your code steps by 4.)',
    starter: `function sumUnrolled(a) {
  let s = 0;
  // your code here
  return s;
}

const xs = [1, 2, 3, 4, 5];
console.log(sumUnrolled(xs)); // 15`,
    solution: `function sumUnrolled(a) {
  let s = 0;
  let i = 0;
  for (; i + 4 <= a.length; i += 4) {
    s += a[i] + a[i + 1]
      + a[i + 2] + a[i + 3];
  }
  for (; i < a.length; i++) {
    s += a[i];
  }
  return s;
}`,
    tests: `test('a multiple of four', () => {
  expect(sumUnrolled([1, 2, 3, 4, 5, 6, 7, 8])).toBe(36);
});
test('one left over', () => {
  expect(sumUnrolled([1, 2, 3, 4, 5])).toBe(15);
});
test('three left over', () => {
  expect(sumUnrolled([10, 20, 30, 40, 1, 2, 3])).toBe(106);
});
test('fewer than four', () => {
  expect(sumUnrolled([7, 8])).toBe(15);
});
test('empty', () => {
  expect(sumUnrolled([])).toBe(0);
});
test('a long array', () => {
  const a = Array.from({ length: 1001 }, (_, k) => k);
  expect(sumUnrolled(a)).toBe(500500);
});
test('the main loop steps by 4', () => {
  expect(/\\+=\\s*4/.test(sumUnrolled.toString())).toBe(true);
});`,
    hints: [
      'Declare `i` before the loops, so the remainder loop can carry on from wherever the main loop stopped.',
      'The main loop should run only while a whole group of four still fits: `i + 4 <= a.length`.',
      'Main loop: add `a[i]` to `a[i + 3]`, then `i += 4`. Remainder: `for (; i < a.length; i++) s += a[i];`.',
    ],
    walkthrough: `**How to think about it.** Unrolling has two parts, and the exercise is mostly about getting the boundary between them right. The main loop handles whole groups of four, so it must stop as soon as fewer than four elements remain; the test for that is \`i + 4 <= a.length\` ("is there room for elements \`i\` to \`i + 3\`?"). Whatever is left, between zero and three elements, goes to a remainder loop that starts where the main loop stopped. That is why \`i\` is declared once, outside both loops: the second loop needs to know where the first one finished.

**The solution, line by line.**

- \`let s = 0;\` is the running total.
- \`let i = 0;\` is the counter, shared by both loops.
- \`for (; i + 4 <= a.length; i += 4) {\` is the unrolled loop: the empty first part means "\`i\` is already set up", the test asks whether a whole group fits, and the step jumps four elements.
- \`s += a[i] + a[i + 1] + a[i + 2] + a[i + 3];\` (two lines) is the four copies of the body, one per element.
- \`for (; i < a.length; i++) {\` is the remainder loop, carrying on from the same \`i\`.
- \`s += a[i];\` handles one leftover element per trip.
- \`return s;\` hands back the total.

For seven elements the main loop runs once (\`i\` = 0, then 4, and \`4 + 4 <= 7\` is false), and the remainder loop runs for \`i\` = 4, 5 and 6. For an empty array neither loop runs, and the answer is 0.

**Common wrong attempts.**

- Testing \`i < a.length\` in the main loop reads past the end when the length is not a multiple of four: \`a[i + 3]\` is \`undefined\`, and adding \`undefined\` makes the sum \`NaN\`.
- Leaving out the remainder loop silently drops up to three elements.
- Declaring \`let i\` inside each \`for\` starts the remainder loop at 0 again, counting the first elements twice.`,
    wrong: [
      {
        code: `function sumUnrolled(a) {
  let s = 0;
  const n = a.length;
  for (let i = 0; i < n; i += 4) {
    s += a[i] + a[i + 1]
      + a[i + 2] + a[i + 3];
  }
  return s;
}`,
        why: 'When the length is not a multiple of 4, the last group reads past the end; `undefined` makes the sum `NaN`.',
      },
      {
        code: `function sumUnrolled(a) {
  let s = 0;
  let i = 0;
  for (; i + 4 <= a.length; i += 4) {
    s += a[i] + a[i + 1]
      + a[i + 2] + a[i + 3];
  }
  return s;
}`,
        why: 'No remainder loop: the last `length mod 4` elements are never added.',
      },
    ],
  },
  canVectorize: {
    optional: true,
    title: 'How many lanes are safe?',
    prompt: 'A loop runs `a[i] = f(a[i - d])` for increasing `i`, where `d` is a whole number (it may be 0 or negative: a negative `d` reads ahead). Write `canVectorize(d, W)` that returns `true` when running `W` trips at a time (all lanes read, then all lanes write) gives the same result as the ordinary loop. Hint from the chapter: trouble comes only when a lane reads an element that another lane **in the same group** writes **earlier in the ordinary order**.',
    starter: `function canVectorize(d, W) {
  // your code here
  return true;
}

// expect false, then true:
console.log(canVectorize(1, 4));
console.log(canVectorize(4, 4));`,
    solution: `function canVectorize(d, W) {
  if (d <= 0) return true;
  return d >= W;
}`,
    tests: `test('reading the element just before', () => {
  expect(canVectorize(1, 4)).toBe(false);
});
test('reading exactly one group back', () => {
  expect(canVectorize(4, 4)).toBe(true);
});
test('four back is not enough for eight lanes', () => {
  expect(canVectorize(4, 8)).toBe(false);
});
test('reading far back', () => {
  expect(canVectorize(16, 8)).toBe(true);
});
test('reading its own element', () => {
  expect(canVectorize(0, 4)).toBe(true);
});
test('reading ahead', () => {
  expect(canVectorize(-1, 4)).toBe(true);
});
test('one lane is always the ordinary loop', () => {
  expect(canVectorize(1, 1)).toBe(true);
});`,
    hints: [
      'Try small cases with the chapter’s `lanes` function: d = 1 and d = 4 with W = 4.',
      'If `d` is 0 or negative, the element a trip reads has not been written by any earlier trip in the ordinary loop either.',
      'For a positive `d`, the read is from `d` trips earlier. That trip is in an earlier group exactly when `d >= W`.',
    ],
    walkthrough: `**How to think about it.** In the ordinary loop, trip \`i\` reads \`a[i - d]\`. Ask which trip wrote that element: trip \`i - d\`. If \`d\` is positive, that trip ran earlier, so the ordinary loop reads the *new* value. In lanes, all trips of a group read before any of them writes, so the read sees the new value only if trip \`i - d\` was in an *earlier* group, which is guaranteed exactly when \`d >= W\`. If \`d\` is 0 or negative, trip \`i - d\` is the same trip or a later one, so the ordinary loop reads the *old* value, and so do the lanes: no problem at any width.

**The solution, line by line.**

- \`if (d <= 0) return true;\` covers reading your own element or reading ahead: both versions see old values.
- \`return d >= W;\` covers reading behind: safe only when the writer is at least a whole group earlier.

This "distance at least the number of lanes" rule is a first taste of the next chapter's dependence distances.

**Common wrong attempts.**

- \`return d >= W;\` alone rejects \`d = 0\` and negative \`d\`, which are always safe.
- \`return d !== 1;\` only catches the most obvious case; \`d = 4\` with eight lanes still breaks.`,
    wrong: [
      {
        code: `function canVectorize(d, W) {
  return d >= W;
}`,
        why: 'Reading your own element (d = 0) or reading ahead (d < 0) is always safe, but this says no.',
      },
      {
        code: `function canVectorize(d, W) {
  return d !== 1;
}`,
        why: 'Any distance from 1 up to W - 1 is a problem, not only 1: d = 4 with 8 lanes fails.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop of 13 trips is unrolled by 4. How many times does the main loop run, and how many trips are left for the remainder loop?',
    options: [
      {
        t: '3 times, 1 left over',
        correct: true,
        why: '3 groups of 4 cover 12 trips; `13 mod 4 = 1` is left.',
      },
      {
        t: '4 times, 0 left over',
        why: 'A fourth group would need trips 12 to 15, but there are only 13.',
      },
      {
        t: '3 times, 4 left over',
        why: 'The remainder is always less than the factor.',
      },
    ],
  },
  {
    q: 'Which statement about unrolling is true?',
    options: [
      {
        t: 'It is only allowed when the trips are independent',
        why: 'That is vectorising; unrolling keeps the original order, so it is always allowed.',
      },
      {
        t: 'It always makes a loop faster, the more the better',
        why: 'Copies cost code size and registers; past a point it gets slower.',
      },
      {
        t: 'It runs the same bodies in the same order, with fewer tests and jumps',
        correct: true,
        why: 'Nothing is reordered, so the result cannot change.',
      },
      {
        t: 'It removes the need for a remainder loop',
        why: 'Unless the trip count is a multiple of the factor, the leftover trips need one.',
      },
    ],
  },
  {
    q: 'What does auto-vectorisation add on top of unrolling by the lane count?',
    options: [
      {
        t: 'A check that the copies may run at once, and merging them into SIMD instructions',
        correct: true,
        why: 'Unrolling alone still runs the copies one after another.',
      },
      {
        t: 'Nothing: they are the same thing',
        why: 'Unrolled code still does one element per instruction.',
      },
      {
        t: 'A second copy of the whole program',
        why: 'Only the loop gets a vector version (plus a remainder loop).',
      },
    ],
  },
  {
    q: 'Which loop can be vectorised with 4 lanes as written?',
    options: [
      {
        t: '`x[i] = x[i - 1] + 1`',
        why: 'Each trip needs the value the previous trip writes, which is in the same group.',
      },
      {
        t: '`a[i] = a[i - 2] * 3`',
        why: 'A distance of 2 is less than 4 lanes: the lane for `i + 2` needs what the lane for `i` writes.',
      },
      {
        t: '`a[i] = a[i - 4] * 2`',
        correct: true,
        why: 'Every read is from the previous group of four, which has already been written.',
      },
      {
        t: 'None of them: loops that write arrays never vectorise',
        why: '`c[i] = a[i] + b[i]` is the standard example of one that does.',
      },
    ],
  },
  {
    q: 'Why does a struct-of-arrays layout suit a vectoriser better than an array of objects?',
    options: [
      {
        t: 'Because typed arrays are always vectorised by JavaScript engines',
        why: 'Whether an engine vectorises is up to the engine; what the layout changes is whether one vector load can fill the lanes.',
      },
      {
        t: 'Because each field’s values sit next to each other, so one vector load fills all the lanes',
        correct: true,
        why: 'In an array of objects, the same field of neighbouring elements is spread apart and needs a gather.',
      },
      {
        t: 'Because the loop over a struct of arrays runs fewer trips',
        why: 'The number of trips is the same; only where each field’s values sit in memory changes.',
      },
    ],
  },
];
