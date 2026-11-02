// Chapter 32 cards. Keys are stable ids: never rename them.

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
  'test-can-be-wrong': {
    q: 'A test fails with `expected 1, got 0`. Does that prove the function is wrong?',
    a: 'No. It proves the two disagree: the test’s expected value may be the mistake.',
  },
  'tobe-vs-toequal': {
    q: 'Why does `expect([1, 2]).toBe([1, 2])` fail, and what should you use instead?',
    a: '`toBe` asks whether they are the same object, and two separate arrays never are. Use `toEqual`, which compares contents.',
  },
  'close-to': {
    q: 'When should you use `toBeCloseTo` instead of `toBe`?',
    a: 'For computed decimals, which can be off by a tiny amount (`0.1 + 0.2` is not exactly `0.3`).',
  },
  'node-test': {
    q: 'Outside the book, what command runs your test files with Node’s built-in runner?',
    a: '`node --test`.',
  },
  'keep-tests': {
    q: 'Why keep a test after it has passed once?',
    a: 'It runs again after every change, so it catches a change that breaks something that used to work.',
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
};

export const exercises = {
  check: {
    title: 'Write your own assertion',
    prompt:
      'Write `check(got, want)`, the heart of `toBe`. If `got === want`, return `true`. Otherwise **throw** an `Error` whose message is exactly `expected WANT, got GOT`, for example `expected 2, got 1`.',
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
test('strings work too', () => {
  expect(check('a', 'a')).toBe(true);
  expect(() => check('a', 'b')).toThrow();
});
test('uses === (identity) for objects', () => {
  expect(() => check([1], [1])).toThrow();
});`,
    hints: [
      'There are two outcomes: the values match, or they do not. What should each one do?',
      'Compare with `!==`. When they differ, `throw new Error(...)`; a thrown error is what makes a test fail. When they match, `return true`.',
      'Build the message with a template literal: `` throw new Error(`expected ${want}, got ${got}`); ``, and put `return true;` after the `if`.',
    ],
    walkthrough: `**How to think about it.** An assertion has one job: be silent when the fact holds, and make a noise that cannot be ignored when it does not. In JavaScript the noise that cannot be ignored is a thrown error, because a throw leaves every function it passes through until a \`catch\` stops it, and the test runner's \`catch\` is waiting. So the plan is: compare, and throw if they differ. The message matters too: “expected 2, got 1” tells the person reading the failure what went wrong without them opening any code.

**The solution, line by line.**

- \`function check(got, want) {\` takes the value the code produced and the value the test expects, in that order.
- \`  if (got !== want) {\` compares them with \`!==\`, which is exactly what \`toBe\` does (apart from the two odd cases \`NaN\` and \`-0\`). For two numbers or strings it compares values; for two objects it asks whether they are the same object, which is why \`check([1], [1])\` throws.
- \`    throw new Error(\` creates an \`Error\` object (whose \`.message\` holds the text) and throws it.
- \`      \\\`expected \${want}, got \${got}\\\`);\` is a template literal: \`\${want}\` and \`\${got}\` are replaced by the two values, giving \`'expected 2, got 1'\`. The line break after \`Error(\` is only there to fit the screen.
- \`  }\` ends the \`if\`.
- \`  return true;\` runs only when nothing was thrown, so the values matched.
- \`}\` closes the body.

**Common wrong attempts.**

- \`return got === want;\` returns \`false\` for a mismatch, but returning \`false\` stops nothing: the test that called \`check\` carries on and passes. An assertion has to throw.
- \`throw \\\`expected ...\\\`;\` throws a plain string. JavaScript allows that, but a string has no \`.message\` property, so the runner cannot show a proper message. Throw an \`Error\` object.
- Swapping the two in the message (\`expected \${got}, got \${want}\`): the test of the message fails, and in real life it would send you hunting for the wrong bug.`,
    wrong: [
      {
        code: `function check(got, want) {
  return got === want;
}`,
        why: 'Returning `false` does not stop anything: a test that calls this would still pass. An assertion has to **throw** when it fails.',
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
      {
        code: `function check(got, want) {
  if (got !== want) {
    throw new Error(
      \`expected \${got}, got \${want}\`);
  }
  return true;
}`,
        why: 'The two values are swapped in the message, so `check(1, 2)` says `expected 1, got 2`, the opposite of the truth.',
      },
    ],
  },
  sameItems: {
    optional: true,
    title: 'Your own toEqual for lists',
    prompt:
      'Write `sameItems(a, b)` for two arrays of numbers or strings. If they have the same length and `a[i] === b[i]` at every index, return `true`. Otherwise throw an `Error` with the message `different at index I`, where `I` is the first index that differs, or `different lengths` if the lengths differ.',
    starter: `function sameItems(a, b) {
  // your code here
}

console.log(sameItems([1, 2], [1, 2]));`,
    solution: `function sameItems(a, b) {
  if (a.length !== b.length) {
    throw new Error(
      'different lengths');
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(
        \`different at index \${i}\`);
    }
  }
  return true;
}`,
    tests: `function msg(f) {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
}
test('lookalike arrays are the same', () => {
  expect(sameItems([1, 2], [1, 2])).toBe(true);
});
test('two empty arrays are the same', () => {
  expect(sameItems([], [])).toBe(true);
});
test('the first difference is reported', () => {
  const m = msg(() => sameItems([1, 2, 3], [1, 9, 8]));
  expect(m).toBe('different at index 1');
});
test('lengths are checked first', () => {
  expect(msg(() => sameItems([1], [1, 2]))).toBe('different lengths');
});
test('strings', () => {
  expect(msg(() => sameItems(['a'], ['b']))).toBe('different at index 0');
});`,
    hints: [
      'Two lists are equal if they are the same length and match slot by slot. Which of those is quicker to check?',
      'Compare `a.length` with `b.length` first and throw if they differ. Then loop over the indexes with `for (let i = 0; i < a.length; i++)`.',
      'Inside the loop, `if (a[i] !== b[i]) { throw new Error(`different at index ${i}`); }`. If the loop finishes, `return true;`.',
    ],
    walkthrough: `**How to think about it.** \`toBe\` cannot compare two lists by contents, because it asks “same object?”. To compare contents we have to look inside, the way you would compare two shopping lists by hand: first check they have the same number of items (if not, they cannot be equal), then go down both lists together, item by item, and stop at the first mismatch. Reporting *where* they differ makes the failure easy to act on.

**The solution, line by line.**

- \`function sameItems(a, b) {\` takes the two arrays.
- \`  if (a.length !== b.length) {\` checks the cheap thing first. Doing it first also keeps the loop below safe: we never read past the end of \`b\`.
- \`    throw new Error(\` and \`      'different lengths');\` report it and stop.
- \`  }\` ends that check.
- \`  for (let i = 0; i < a.length; i++) {\` visits every index; the lengths are equal, so \`i\` is valid in both arrays.
- \`    if (a[i] !== b[i]) {\` compares one pair of items.
- \`      throw new Error(\` and \`        \\\`different at index \${i}\\\`);\` report the first index that differs, and stop: the throw leaves the loop and the function at once.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return true;\` runs only if every pair matched. Two empty arrays reach here straight away, which is right: they are equal.
- \`}\` closes the body.

**Common wrong attempts.**

- \`return a === b;\` asks whether they are the same array, so lookalike arrays fail, exactly the problem this function exists to solve.
- Skipping the length check: \`sameItems([1], [1, 2])\` compares only index 0, finds a match, and wrongly returns \`true\`.`,
    wrong: [
      {
        code: `function sameItems(a, b) {
  if (a !== b) {
    throw new Error('different');
  }
  return true;
}`,
        why: '`a !== b` asks whether they are different objects, so even `sameItems([1, 2], [1, 2])` throws. Compare the items, not the arrays.',
      },
      {
        code: `function sameItems(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(
        \`different at index \${i}\`);
    }
  }
  return true;
}`,
        why: 'Without a length check, `sameItems([1], [1, 2])` only looks at index 0 and returns `true`. Check the lengths first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A test calls `expect(add(2, 2)).toBe(5)` and `add` correctly returns `4`. What happens?',
    options: [
      { t: 'The test passes, because `add` works', why: 'The test checks for `5`, and `4` is not `5`, so the assertion fails. A test is only as right as its expected values.' },
      { t: 'The assertion throws, and the test is reported as failed', correct: true, why: '`toBe` throws when the values differ. Here the test is wrong, not `add`: fix the expected value.' },
      { t: 'JavaScript changes `add` to return `5`', why: 'Tests never change the code they check.' },
    ],
  },
  {
    q: 'Which assertion passes?',
    options: [
      { t: '`expect([1, 2]).toBe([1, 2])`', why: '`toBe` asks “same object?”, and these are two different arrays.' },
      { t: '`expect(0.1 + 0.2).toBe(0.3)`', why: '`0.1 + 0.2` is `0.30000000000000004`, which is not exactly `0.3`.' },
      { t: '`expect(\'7\').toBe(7)`', why: 'A string is never the same value as a number.' },
      { t: '`expect({ x: 1 }).toEqual({ x: 1 })`', correct: true, why: '`toEqual` compares contents, and both objects have `x: 1`.' },
    ],
  },
  {
    q: `In this book's tiny runner, what is printed?
\`\`\`
test('a', () => {
  expectBe(1, 1);
  expectBe(2, 3);
  expectBe(4, 4);
});
\`\`\``,
    options: [
      { t: '`pass: a`', why: 'The second assertion is false, and one false assertion fails the whole test.' },
      { t: '`FAIL: a`, then `expected 3, got 2`', correct: true, why: 'The second `expectBe` throws; the third never runs, and `catch` prints the failure and its message.' },
      { t: 'Two passes and one fail', why: 'The runner reports once per test, not once per assertion.' },
    ],
  },
  {
    q: 'What is `toThrow` handed, and when does it pass?',
    options: [
      { t: 'A function; it calls it, and passes only if the call throws', correct: true, why: 'That is why you write `expect(() => f(bad)).toThrow()`: the arrow function delays the call until `toThrow` makes it.' },
      { t: 'An error object; it passes if the object is an `Error`', why: '`toThrow` needs something to call, so it is handed a function.' },
      { t: 'Any value; it passes if the value is falsy', why: 'That would be `toBeFalsy`.' },
    ],
  },
  {
    q: 'What is a real difference between C’s `assert` and a test runner like `node --test`?',
    options: [
      { t: 'C’s `assert` cannot compare numbers', why: 'It checks any condition, such as `max(xs, 3) == 7`.' },
      { t: 'There is none: both report every failing test', why: 'C’s `assert` has no runner behind it.' },
      { t: 'A false C `assert` stops the whole program at once, so later checks never run', correct: true, why: 'A test runner catches each failure and carries on with the next test; C’s `assert` aborts.' },
    ],
  },
];
