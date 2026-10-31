// Chapter 15 cards. Keys are stable ids: never rename them.

export const prompts = {
  'test-what': {
    q: 'What is a test?',
    a: 'Code that runs other code on chosen inputs and checks the results.',
  },
  'assertion-what': {
    q: 'What is an assertion?',
    a: 'One check that must be true, like `expect(max([3, 7, 2])).toBe(7)`.',
  },
  'assertion-throws': {
    q: 'How does a false assertion make its test fail?',
    a: 'It throws an error. The test runner catches it and marks that test as failed.',
  },
  'tobe-vs-toequal': {
    q: 'Why does `expect([1, 2]).toBe([1, 2])` fail, and what should you use instead?',
    a: '`toBe` uses `===`, and two separate arrays are never the same object. Use `toEqual`, which compares contents.',
  },
  'close-to': {
    q: 'When should you use `toBeCloseTo` instead of `toBe`?',
    a: 'For computed decimals, which can be off by a tiny amount (`0.1 + 0.2` is not exactly `0.3`).',
  },
  'edge-what': {
    q: 'What is an edge case?',
    a: 'An unusual input at the boundary of what a function handles: empty, one item, zero, negative, huge, duplicates.',
  },
  'edge-why': {
    q: 'A `max` that starts with `best = 0` passes `[3, 7, 2]`. Which edge case exposes its bug?',
    a: 'All-negative input, like `[-4, -2]`: it returns `0`, which isn’t even in the list.',
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
    q: 'Why can differential testing use thousands of random inputs, when ordinary tests can’t?',
    a: 'It needs no expected answers: you only check the two versions agree, so a computer can invent the inputs.',
  },
};

export const examples = {
  harness: {
    title: 'A test harness in 15 lines',
    code: `function expectBe(got, want) {
  if (got !== want) {
    throw new Error(
      \`expected \${want}, got \${got}\`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log('pass: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name);
    console.log('  ' + e.message);
  }
}

function double(n) {
  return n + n;
}

test('double 3', () => {
  expectBe(double(3), 6);
});
test('double 0', () => {
  expectBe(double(0), 1);
});
// The second test is wrong on purpose.
// Fix the test, not the function.`,
  },
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
      'Loop over `inputs` with `for (const x of inputs)`.',
      'For each `x`, call both functions: `f(x)` and `g(x)`. If the results differ, you’ve found it.',
      'Return `x` itself (the input), straight away. After the loop, return `undefined`.',
    ],
    walkthrough: `This is the core of every differential tester, including the ones you’ll later aim at your own interpreter and compiler.

- **Same input, both versions.** For each \`x\`, call \`f(x)\` and \`g(x)\`. \`f\` and \`g\` are just values holding functions, so calling them is ordinary.
- **Return the input.** When they disagree, the useful thing to report is *which input* caused it, so you can reproduce the bug. The results alone don’t tell you that.
- **Stop at the first.** \`return\` inside the loop stops at once. The first failing input is usually the one to debug.
- **Agreement is \`undefined\`.** If the loop finishes, nothing disagreed.

In a real tester, \`inputs\` would be thousands of random values, like the \`diff\` example above. Then you’d usually make the failing input as small as possible before debugging it.`,
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
  check: {
    optional: true,
    title: 'Write your own assertion',
    prompt:
      'Write `check(got, want)`. If `got === want`, return `true`. Otherwise **throw** an `Error` whose message is exactly `expected WANT, got GOT`, for example `expected 2, got 1`.',
    starter: `function check(got, want) {
  // your code here
}

console.log(check(1 + 1, 2));
check(1, 2); // should throw`,
    solution: `function check(got, want) {
  if (got !== want) {
    throw new Error(
      \`expected \${want}, got \${got}\`);
  }
  return true;
}`,
    tests: `test('equal values pass', () => {
  expect(check(2, 2)).toBe(true);
});
test('different values throw', () => {
  expect(() => check(1, 2)).toThrow();
});
test('the message says what happened', () => {
  let msg = '';
  try { check(1, 2); } catch (e) { msg = e.message; }
  expect(msg).toBe('expected 2, got 1');
});
test('uses === (identity) for objects', () => {
  expect(() => check([1], [1])).toThrow();
});`,
    hints: [
      'Compare with `===` (or `!==`). If they match, `return true`.',
      'If they don’t match, `throw new Error(...)`. A thrown error is what makes a test fail.',
      'Build the message with a template literal: `` `expected ${want}, got ${got}` ``.',
    ],
    walkthrough: `You’ve just written the heart of \`expect(...).toBe(...)\`.

- **Compare with \`===\`.** That is exactly what \`toBe\` does, which is why two lookalike arrays don’t pass: they are different objects.
- **Throw, don’t return \`false\`.** A test fails when something inside it throws. If \`check\` only returned \`false\`, the test would carry on and pass. Throwing is what makes an assertion impossible to ignore.
- **Throw an \`Error\`, with a clear message.** “expected 2, got 1” tells you what went wrong without opening a debugger. An \`Error\` object carries that text in \`.message\`.`,
    wrong: [
      {
        code: `function check(got, want) {
  return got === want;
}`,
        why: 'Returning `false` doesn’t stop anything: a test that calls this would still pass. An assertion has to **throw** when it fails.',
      },
      {
        code: `function check(got, want) {
  if (got !== want) {
    throw (
      \`expected \${want}, got \${got}\`);
  }
  return true;
}`,
        why: 'This throws a plain string, not an `Error` object, so there is no `.message` property and the message test fails. Use `throw new Error(...)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A test calls `expect(add(2, 2)).toBe(5)` and `add` correctly returns `4`. What happens?',
    options: [
      { t: 'The test passes, because `add` works', why: 'The test checks for `5`, and `4 !== 5`, so the assertion fails. A test is only as right as its expected values.' },
      { t: 'The assertion throws, and the test is reported as failed', correct: true, why: '`toBe` throws when the values differ. Here the test is wrong, not `add`: fix the expected value.' },
      { t: 'JavaScript changes `add` to return `5`', why: 'Tests never change the code they check.' },
      { t: 'Nothing: tests only print warnings', why: 'A false assertion throws, and the runner records the failure.' },
    ],
  },
  {
    q: 'Which assertion passes?',
    options: [
      { t: '`expect([1, 2]).toBe([1, 2])`', why: '`toBe` is `===`, and these are two different arrays.' },
      { t: '`expect(0.1 + 0.2).toBe(0.3)`', why: '`0.1 + 0.2` is `0.30000000000000004`, which is not `===` to `0.3`.' },
      { t: '`expect({ x: 1 }).toEqual({ x: 1 })`', correct: true, why: '`toEqual` compares contents, and both objects have `x: 1`.' },
      { t: '`expect(\'7\').toBe(7)`', why: 'A string is never `===` to a number.' },
    ],
  },
  {
    q: 'You are testing `average(xs)`. Which input is the best edge case to add to `[2, 4, 6]`?',
    options: [
      { t: '`[1, 3, 5]`', why: 'That is another ordinary list: it exercises exactly the same path as `[2, 4, 6]`.' },
      { t: '`[10, 20, 30]`', why: 'Bigger numbers, but still an ordinary case.' },
      { t: '`[2, 4, 6, 8]`', why: 'One more item doesn’t probe a boundary.' },
      { t: '`[]`', correct: true, why: 'The empty list is a classic edge: dividing by a length of 0 gives `NaN`, so you have to decide what `average([])` should be.' },
    ],
  },
  {
    q: 'What is the big advantage of differential testing?',
    options: [
      { t: 'It proves both implementations are correct', why: 'Both could share the same bug. Agreement is evidence, not proof.' },
      { t: 'You don’t need to know the right answers, so inputs can be random and plentiful', correct: true, why: 'You only check that the two versions agree, so a program can generate thousands of inputs.' },
      { t: 'It makes the code faster', why: 'Testing finds bugs; it doesn’t change speed.' },
      { t: 'It only needs one implementation', why: 'It needs two, compared against each other.' },
    ],
  },
  {
    q: 'A fast `sumTo(n)` uses the formula `n * (n + 1) / 2`. What is a good reference to test it against?',
    options: [
      { t: 'A loop that adds 1, 2, …, n: slow, but obviously right', correct: true, why: 'A simple, clearly correct version is the ideal partner for a clever one.' },
      { t: 'The same formula, copied into a second function', why: 'A copy shares every bug of the original, so they always agree.' },
      { t: 'Nothing: formulas don’t need tests', why: 'Formulas are easy to get subtly wrong (try `n * (n - 1) / 2`).' },
      { t: 'A function that always returns 0', why: 'They would disagree, but the reference would be the one that’s wrong.' },
    ],
  },
  {
    q: 'How will this book check that Viscosity’s optimized output is correct?',
    options: [
      { t: 'By reading the generated code carefully', why: 'Reading helps, but it doesn’t scale to thousands of programs.' },
      { t: 'It assumes it’s correct if it is faster', why: 'A faster program that gives a wrong answer is broken.' },
      { t: 'By running the original and the optimized program on the same inputs and checking they agree', correct: true, why: 'That is differential testing, the same idea as the benchmark tests that check every layout computes the same result.' },
      { t: 'By using TypeScript types', why: 'Types catch some mistakes, but they can’t check that two programs compute the same numbers.' },
    ],
  },
];
