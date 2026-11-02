// Chapter 33 cards (edge cases and differential testing). Keys are
// stable ids: never rename them.

export const prompts = {
  'edge-what': {
    q: 'What is an edge case?',
    a: 'An unusual input at the boundary of what a function handles: empty, one item, zero, negative, huge, duplicates.',
  },
  'edge-why': {
    q: 'A `max` that starts with `best = 0` passes `[3, 7, 2]`. Which edge case exposes its bug?',
    a: 'All-negative input, like `[-4, -2]`: it returns `0`, which is not even in the list.',
  },
  'edge-decide': {
    q: 'Why does writing a test for `average([])` help, even before you run it?',
    a: 'It forces you to decide what the answer should be (0? an error?), instead of getting `NaN` by accident.',
  },
  'keep-old-tests': {
    q: 'After fixing a bug, why run the old, already-passing tests again too?',
    a: 'A fix can break something that used to work. Rerunning every test catches that at once.',
  },
  'diff-what': {
    q: 'What is differential testing?',
    a: 'Running two implementations of the same thing on the same inputs and checking that they agree.',
  },
  'diff-no-answers': {
    q: 'Why can differential testing use thousands of random inputs, when ordinary tests cannot?',
    a: 'It needs no expected answers: you only check the two versions agree, so a computer can invent the inputs.',
  },
  'diff-not-proof': {
    q: 'Two implementations agree on 10,000 random inputs. Are they both correct?',
    a: 'Not necessarily: they could share the same mistake, or disagree on an input not tried. Agreement is evidence, not proof.',
  },
  'diff-report-input': {
    q: 'When two versions disagree, what is the most useful thing to report?',
    a: 'The input that made them disagree, so the bug can be reproduced.',
  },
};

export const examples = {
  diff: {
    title: 'Differential testing with random lists',
    code: `function max(xs) {
  let best = 0;
  for (const x of xs) {
    if (x > best) best = x;
  }
  return best;
}

function maxSlow(xs) {
  for (const x of xs) {
    let beaten = false;
    for (const y of xs) {
      if (y > x) beaten = true;
    }
    if (!beaten) return x;
  }
  return -Infinity;
}

// rand(k): a random whole number
// from 0 to k - 1
function rand(k) {
  return Math.floor(Math.random() * k);
}
function randomList() {
  const xs = [];
  const n = rand(5);
  for (let i = 0; i < n; i++) {
    xs.push(rand(19) - 9);
  }
  return xs;
}

let t = 0;
while (t < 1000) {
  const xs = randomList();
  const a = max(xs);
  const b = maxSlow(xs);
  if (a !== b) {
    console.log('disagree on', xs);
    console.log('max', a, 'slow', b);
    break;
  }
  t++;
}
console.log(\`\${t} lists agreed\`);
// Fix max, then run it again.`,
  },
};

export const exercises = {
  findMismatch: {
    title: 'A differential tester',
    prompt:
      'Write `findMismatch(f, g, inputs)`. `f` and `g` are two functions that should do the same thing. Call both on each input in order, and return the **first input** where their results differ (by `!==`). If they agree on every input, return `undefined`.',
    starter: `function findMismatch(f, g, inputs) {
  // your code here
}

const abs1 = (n) => Math.abs(n);
const abs2 = (n) => n; // forgot < 0
console.log(
  findMismatch(abs1, abs2, [3, 0, -2]));`,
    solution: `function findMismatch(f, g, inputs) {
  for (const x of inputs) {
    if (f(x) !== g(x)) {
      return x;
    }
  }
  return undefined;
}`,
    tests: `test('two versions that agree', () => {
  const f = (n) => n * 2;
  const g = (n) => n + n;
  expect(findMismatch(f, g, [0, 1, 5, -3])).toBe(undefined);
});
test('finds the first disagreement', () => {
  const f = (n) => Math.abs(n);
  const g = (n) => n;
  expect(findMismatch(f, g, [3, 0, -2, -7])).toBe(-2);
});
test('returns the input, not a result', () => {
  const f = (n) => n;
  const g = (n) => 0;
  expect(findMismatch(f, g, [0, 4])).toBe(4);
});
test('no inputs: nothing to disagree on', () => {
  expect(findMismatch((n) => n, (n) => 1, [])).toBe(undefined);
});
test('works on strings too', () => {
  const f = (s) => s.length;
  const g = (s) => 3;
  expect(findMismatch(f, g, ['abc', 'hi'])).toBe('hi');
});`,
    hints: [
      'You need to look at the inputs one at a time, in order, and stop at the first one where something goes wrong.',
      'Loop with `for (const x of inputs)`. For each `x`, call both functions, `f(x)` and `g(x)`, and compare the results with `!==`.',
      'Inside the loop: `if (f(x) !== g(x)) { return x; }`. After the loop, `return undefined;`.',
    ],
    walkthrough: `**How to think about it.** Picture doing it by hand: take the first input, feed it to both functions, compare the two answers; if they match, move on to the next input; the first time they do not match, stop and write down the input. That is a search loop, the same shape as finding the first item that passes a test, where the test is “do \`f\` and \`g\` disagree here?”. What to hand back matters: the *input* that caused the disagreement is what lets someone reproduce the bug, so return that, not either function's result.

**The solution, line by line.**

- \`function findMismatch(f, g, inputs) {\` takes two functions and a list. \`f\` and \`g\` are ordinary values that happen to hold functions (functions are values, from the chapter on functions as values), so calling them is ordinary too.
- \`  for (const x of inputs) {\` visits the inputs in order.
- \`    if (f(x) !== g(x)) {\` runs both versions on the same input and compares their answers.
- \`      return x;\` hands back this input and stops at once, so it is the *first* disagreement. The first one is usually the best one to debug, and stopping early saves running the rest.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return undefined;\` is reached only if every input agreed, including when there were no inputs at all.
- \`}\` closes the body.

In a real tester, \`inputs\` would be thousands of random values, like the \`diff\` example in the chapter, and once a disagreement is found you would usually try to make the failing input as small as possible before debugging it.

**Common wrong attempts.**

- Returning \`f(x)\` instead of \`x\`: you learn what one version said, but not which input to try again.
- Comparing \`f !== g\`: that compares the two *functions*, which are different objects, so it is always true and the first input is always returned.
- Remembering the mismatch in a variable and returning it after the loop: the variable keeps being overwritten, so you get the *last* disagreement instead of the first.`,
    wrong: [
      {
        code: `function findMismatch(f, g, inputs) {
  for (const x of inputs) {
    if (f(x) !== g(x)) {
      return f(x);
    }
  }
  return undefined;
}`,
        why: 'This returns one version’s *result*, not the input that caused the disagreement. To reproduce a bug you need the input.',
      },
      {
        code: `function findMismatch(f, g, inputs) {
  for (const x of inputs) {
    if (f !== g) {
      return x;
    }
  }
  return undefined;
}`,
        why: '`f !== g` compares the two *functions*, which are different objects, so it is always `true` and the first input is always returned. Compare their results: `f(x) !== g(x)`.',
      },
      {
        code: `function findMismatch(f, g, inputs) {
  let bad;
  for (const x of inputs) {
    if (f(x) !== g(x)) {
      bad = x;
    }
  }
  return bad;
}`,
        why: 'Without an early return, `bad` keeps being overwritten, so this reports the *last* disagreement instead of the first.',
      },
    ],
  },
  middle: {
    optional: true,
    title: 'The middle item, edges and all',
    prompt:
      'Write `middle(xs)`: it returns the middle item of the list. For an even length there are two middle items; return the **left** one, so `middle([1, 2, 3, 4])` is `2`. For an empty list, return `undefined`. The tests are mostly edge cases.',
    starter: `function middle(xs) {
  // your code here
}

console.log(middle([1, 2, 3]));`,
    solution: `function middle(xs) {
  if (xs.length === 0) {
    return undefined;
  }
  const i = Math.floor(
    (xs.length - 1) / 2);
  return xs[i];
}`,
    tests: `test('an odd length', () => {
  expect(middle([1, 2, 3])).toBe(2);
});
test('an even length gives the left middle', () => {
  expect(middle([1, 2, 3, 4])).toBe(2);
});
test('two items', () => {
  expect(middle([5, 6])).toBe(5);
});
test('one item', () => {
  expect(middle([7])).toBe(7);
});
test('empty', () => {
  expect(middle([])).toBe(undefined);
});`,
    hints: [
      'Work out the index by hand for lengths 1, 2, 3 and 4 first. Which formula gives 0, 0, 1 and 1?',
      'The last index is `xs.length - 1`. Halve it and round down with `Math.floor`.',
      '`const i = Math.floor((xs.length - 1) / 2); return xs[i];`, after an early `return undefined;` for an empty list.',
    ],
    walkthrough: `**How to think about it.** The way to get index arithmetic right is to stop guessing and make a small table of the edge cases first. Length 1: the only item, index 0. Length 2: two middles, indexes 0 and 1, and we want the left one, 0. Length 3: index 1. Length 4: middles at 1 and 2, so 1. The answers 0, 0, 1, 1 are the last index (0, 1, 2, 3) halved and rounded down. Length 0 has no middle at all, so it needs its own case.

**The solution, line by line.**

- \`function middle(xs) {\` takes the list.
- \`  if (xs.length === 0) {\` handles the empty edge first, before any arithmetic.
- \`    return undefined;\` says “there is no middle”. (Without this line the formula gives \`Math.floor(-0.5)\`, which is \`-1\`, and \`xs[-1]\` is \`undefined\` anyway; returning early says it on purpose rather than by luck.)
- \`  }\` ends that case.
- \`  const i = Math.floor(\` and \`    (xs.length - 1) / 2);\` work out the index: the last index, halved, rounded down. For length 4 that is \`Math.floor(3 / 2)\`, which is \`1\`.
- \`  return xs[i];\` reads that slot.
- \`}\` closes the body.

**Common wrong attempts.**

- \`xs[Math.floor(xs.length / 2)]\` is right for odd lengths but picks the *right* middle for even ones: \`[1, 2, 3, 4]\` gives \`3\`. Only the even-length tests catch it, which is why they are there.
- \`xs[(xs.length - 1) / 2]\` without rounding works for odd lengths, but for length 4 the index is \`1.5\`, and \`xs[1.5]\` is \`undefined\`.`,
    wrong: [
      {
        code: `function middle(xs) {
  return xs[Math.floor(xs.length / 2)];
}`,
        why: 'For even lengths this picks the right-hand middle: `middle([1, 2, 3, 4])` is `3`, and `middle([5, 6])` is `6`.',
      },
      {
        code: `function middle(xs) {
  return xs[(xs.length - 1) / 2];
}`,
        why: 'For even lengths the index is not a whole number (`1.5` for four items), and `xs[1.5]` is `undefined`. Round down with `Math.floor`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You are testing `average(xs)`. Which input is the best edge case to add to `[2, 4, 6]`?',
    options: [
      { t: '`[1, 3, 5]`', why: 'That is another ordinary list: it exercises exactly the same path as `[2, 4, 6]`.' },
      { t: '`[]`', correct: true, why: 'The empty list is a classic edge: dividing by a length of 0 gives `NaN`, so you have to decide what `average([])` should be.' },
      { t: '`[10, 20, 30]`', why: 'Bigger numbers, but still an ordinary case.' },
    ],
  },
  {
    q: '`isTeen(age)` should be true for ages 13 to 19. By the boundary rule, which set of inputs is best?',
    options: [
      { t: '`15, 16, 17`', why: 'All in the middle of the range: they cannot tell `<` from `<=` at either end.' },
      { t: '`0, 50, 100`', why: 'Far from both edges, so a slip at 13 or 19 goes unnoticed.' },
      { t: '`12, 13, 14, 18, 19, 20`', correct: true, why: 'Just below, at and just above each end: exactly where an off-by-one slip shows.' },
    ],
  },
  {
    q: 'What is the big advantage of differential testing?',
    options: [
      { t: 'It proves both implementations are correct', why: 'Both could share the same bug. Agreement is evidence, not proof.' },
      { t: 'It only needs one implementation', why: 'It needs two, compared against each other.' },
      { t: 'You do not need to know the right answers, so inputs can be random and plentiful', correct: true, why: 'You only check that the two versions agree, so a program can generate thousands of inputs.' },
    ],
  },
  {
    q: 'A fast `sumTo(n)` uses the formula `n * (n + 1) / 2`. What is a good reference to test it against?',
    options: [
      { t: 'A loop that adds 1, 2, …, n: slow, but obviously right', correct: true, why: 'A simple, clearly correct version is the ideal partner for a clever one.' },
      { t: 'The same formula, copied into a second function', why: 'A copy shares every bug of the original, so they always agree.' },
      { t: 'Nothing: formulas do not need tests', why: 'Formulas are easy to get subtly wrong (try `n * (n - 1) / 2`).' },
    ],
  },
  {
    q: 'How does this book’s repository check that Viscosity’s rewritten programs are correct?',
    options: [
      { t: 'By reading the generated code carefully', why: 'Reading helps, but it does not scale to thousands of programs.' },
      { t: 'It assumes a program is correct if it is faster', why: 'A faster program that gives a wrong answer is broken.' },
      { t: 'By running the original and the rewritten program and checking their output matches', correct: true, why: 'That is differential testing, in `frontend-js/test/differential.test.ts`.' },
    ],
  },
];
