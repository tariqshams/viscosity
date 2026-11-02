// Cards for the second half of chapter 1 (split from 001-functions).
// Keys are stable ids: several moved here from chapter 1 unchanged, so
// readers keep their review history.

export const prompts = {
  'no-return': {
    q: 'What does a call produce if the function never reaches a `return`?',
    a: '`undefined`, JavaScript’s value for “nothing”.',
  },
  'bare-return': {
    q: 'What does a call produce when it runs `return;` with no value after it?',
    a: '`undefined`: the call ends there, with nothing handed back.',
  },
  'missing-arg': {
    q: 'A function has a parameter `name`, and you call it with no arguments. What does `name` hold?',
    a: '`undefined`. JavaScript fills a parameter that got no argument with `undefined` (Python and Java would refuse instead).',
  },
  'print-vs-return': {
    q: 'A function prints `6` with `console.log` but has no `return`. What is `x` after `const x = f();`?',
    a: '`undefined`. Printing shows a value to a human; only `return` hands it back to the calling code.',
  },
  'fresh-page': {
    q: 'What does each function call get for its parameters and local variables?',
    a: 'Its own fresh, private “page” (environment). Two calls never share local variables.',
  },
  'local-gone': {
    q: 'Why does reading a function’s local variable from outside, after the call, fail?',
    a: 'The call’s page (and every local variable on it) is thrown away when the call ends. Only the returned value survives.',
  },
  'same-name-locals': {
    q: 'Can two different functions each have a local variable called `t`?',
    a: 'Yes. Each call keeps its locals on its own page, so the two `t`s never meet.',
  },
  'tick-resets': {
    q: 'Why does a function that does `let count = 0; count = count + 1; return count;` return `1` on every call?',
    a: 'Each call gets a fresh page with a brand-new `count` starting at 0; nothing is remembered from the call before.',
  },
  'fn-calls-fn': {
    q: 'If `hypot` calls `square` twice, how many separate pages (sets of local variables) for `square` are created?',
    a: 'Two: one per call, each with its own `x`.',
  },
};

export const examples = {
  leftovers: {
    title: 'What comes back, and what is forgotten',
    code: `function hi(name) {
  console.log('Hello, ' + name);
}
const r = hi('Ada');
console.log(r);
console.log(hi());

function tick() {
  let count = 0;
  count = count + 1;
  return count;
}
console.log(tick(), tick());`,
  },
};

export const exercises = {
  greetOrStranger: {
    title: 'Hello, stranger',
    prompt:
      'Write `greet(name)` that **returns** `\'Hello, Ada!\'` when called as `greet(\'Ada\')`, and returns `\'Hello, stranger!\'` when called with no argument at all, as `greet()`.',
    starter: `function greet(name) {
  // your code here
}

console.log(greet('Ada'));
console.log(greet());`,
    solution: `function greet(name) {
  if (name === undefined) {
    return 'Hello, stranger!';
  }
  return 'Hello, ' + name + '!';
}`,
    tests: `test('greets by name', () => {
  expect(greet('Ada')).toBe('Hello, Ada!');
});
test('another name', () => {
  expect(greet('Alan')).toBe('Hello, Alan!');
});
test('no argument: a stranger', () => {
  expect(greet()).toBe('Hello, stranger!');
});`,
    hints: [
      'What does the parameter `name` hold when the call is `greet()`, with nothing in the parentheses?',
      'It holds `undefined`. You can test for that with `name === undefined`, inside an `if`.',
      'Inside the `if`, `return \'Hello, stranger!\';`. After it, `return \'Hello, \' + name + \'!\';` handles everyone with a name.',
    ],
    walkthrough: `**How to think about it.** There are two kinds of call: one with a name and one without. Start by asking what the function actually *sees* in each case. For \`greet('Ada')\`, the parameter \`name\` holds \`'Ada'\`. For \`greet()\`, no argument was passed, so JavaScript fills \`name\` with \`undefined\`. So the function needs to tell those two apart, and \`=== undefined\` is exactly that test. Deal with the special case first and leave early; then the ordinary case is all that remains.

**The solution, line by line.**

- \`function greet(name) {\` defines \`greet\` with one parameter, \`name\`.
- \`  if (name === undefined) {\` asks "was I given no name?". \`===\` compares two values and is \`true\` only when they are the same, so this is true exactly for \`greet()\`.
- \`    return 'Hello, stranger!';\` sends back the stranger greeting and ends the call, so the next lines never run for a nameless call.
- \`  }\` closes the \`if\`.
- \`  return 'Hello, ' + name + '!';\` is only reached when a name was given. \`+\` joins strings, so for \`'Ada'\` this builds \`'Hello, Ada!'\` and returns it.
- \`}\` closes the body.

**Common wrong attempts.**

- Leaving out the check and writing only \`return 'Hello, ' + name + '!';\`. For \`greet()\` that joins \`undefined\` onto the string and returns \`'Hello, undefined!'\`, with no error to warn you.
- Checking for an empty string, \`if (name === '')\`. An empty string \`''\` is a real string with no letters in it, which is not the same thing as "no value at all", so \`greet()\` still slips through.
- Printing the greetings with \`console.log\` instead of returning them: they appear on screen, but every call produces \`undefined\`, so the tests (and any code using \`greet\`) get nothing.`,
    wrong: [
      {
        code: `function greet(name) {
  return 'Hello, ' + name + '!';
}`,
        why: 'For `greet()` this returns `\'Hello, undefined!\'`: the missing argument is `undefined`, and `+` turns it into the word.',
      },
      {
        code: `function greet(name) {
  if (name === '') {
    return 'Hello, stranger!';
  }
  return 'Hello, ' + name + '!';
}`,
        why: 'A missing argument is `undefined`, not the empty string `\'\'`, so the check never matches for `greet()`.',
      },
      {
        code: `function greet(name) {
  if (name === undefined) {
    console.log('Hello, stranger!');
  }
  console.log('Hello, ' + name + '!');
}`,
        why: 'This prints instead of returning, so every call produces `undefined`.',
      },
    ],
  },
  distance: {
    optional: true,
    title: 'The distance between two points',
    prompt:
      'Using the given `square`, write `distance(x1, y1, x2, y2)` that returns the straight-line distance between the points (x1, y1) and (x2, y2): the square root of `square(x2 - x1) + square(y2 - y1)`.',
    starter: `function square(x) {
  return x * x;
}
function distance(x1, y1, x2, y2) {
  // your code here
}

console.log(distance(0, 0, 3, 4));`,
    solution: `function square(x) {
  return x * x;
}
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d2 = square(dx) + square(dy);
  return Math.sqrt(d2);
}`,
    tests: `test('a 3-4-5 triangle', () => {
  expect(distance(0, 0, 3, 4)).toBe(5);
});
test('same point', () => {
  expect(distance(2, 2, 2, 2)).toBe(0);
});
test('negative coordinates', () => {
  expect(distance(-1, 0, 2, 4)).toBe(5);
});`,
    hints: [
      'First work out how far apart the points are across (x) and how far apart they are up and down (y).',
      'Keep those in two local variables, `dx = x2 - x1` and `dy = y2 - y1`.',
      'Add `square(dx) + square(dy)`, then return the square root of that sum with `Math.sqrt(...)`.',
    ],
    walkthrough: `**How to think about it.** This is the \`hypot\` idea from the chapter, with one extra step in front: the two sides of the triangle are not given directly, so work them out first. Across, the points are \`x2 - x1\` apart; up and down they are \`y2 - y1\` apart. Pythagoras says the straight-line distance is the square root of the sum of the squares of those two sides.

**The solution, line by line.**

- \`function square(x) { return x * x; }\` (given) multiplies a number by itself.
- \`function distance(x1, y1, x2, y2) {\` takes four parameters, the coordinates of the two points, matched by position.
- \`  const dx = x2 - x1;\` is a local variable holding the distance across. For \`distance(0, 0, 3, 4)\` it is \`3\`.
- \`  const dy = y2 - y1;\` holds the distance up and down: \`4\`.
- \`  const d2 = square(dx) + square(dy);\` calls \`square\` twice (each call on its own page, with its own \`x\`) and adds the answers: \`9 + 16\`, so \`d2\` is \`25\`, the distance *squared*.
- \`  return Math.sqrt(d2);\` takes the square root with the built-in \`Math.sqrt\` (\`5\`) and returns it. \`dx\`, \`dy\` and \`d2\` vanish when the call ends.

A negative side is fine: for \`distance(-1, 0, 2, 4)\`, \`dx\` is \`3\`, and even if you had subtracted the other way round and got \`-3\`, squaring gives \`9\` either way.

**Common wrong attempts.**

- Squaring the coordinates instead of the differences, \`square(x2) - square(x1)\`: for (0, 0) to (3, 4) this happens to work, but for (-1, 0) to (2, 4) it gives \`Math.sqrt(3 + 16)\`, which is not 5.
- Forgetting \`Math.sqrt\`: you get \`25\`, the *squared* distance.`,
    wrong: [
      {
        code: `function square(x) {
  return x * x;
}
function distance(x1, y1, x2, y2) {
  const a = square(x2) - square(x1);
  const b = square(y2) - square(y1);
  return Math.sqrt(a + b);
}`,
        why: 'Squares the coordinates rather than their differences, so `distance(-1, 0, 2, 4)` is wrong.',
      },
      {
        code: `function square(x) {
  return x * x;
}
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return square(dx) + square(dy);
}`,
        why: 'Returns the squared distance (`25` instead of `5`): the square root is missing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A function prints a number with `console.log` but has no `return`. You write `const r = f();`. What is `r`?',
    options: [
      { t: 'The printed number', why: 'Printing does not hand a value back to the caller.' },
      { t: '`undefined`', correct: true, why: 'With no `return`, every call produces `undefined`.' },
      { t: '`null`', why: 'JavaScript uses `undefined` (not `null`) for “no return value”.' },
      { t: 'An error', why: 'It is perfectly legal; `r` just ends up `undefined`.' },
    ],
  },
  {
    q: 'With `function greet(name) { return \'Hi \' + name; }`, what is `greet()`?',
    options: [
      { t: 'An error: an argument is missing', why: 'JavaScript does not complain about missing arguments (Python and Java would).' },
      { t: '`\'Hi \'`', why: 'The missing argument is not the empty string; it is `undefined`.' },
      { t: '`\'Hi undefined\'`', correct: true, why: '`name` holds `undefined`, and `+` turns it into the word “undefined”.' },
    ],
  },
  {
    q: 'Why can two different functions both have a local variable called `total` without any conflict?',
    options: [
      { t: 'Each call keeps its local variables on its own private page', correct: true, why: 'Local variables live only in the call that created them, so they never collide.' },
      { t: 'JavaScript renames one of them secretly', why: 'No renaming happens. Each call simply has its own page.' },
      { t: 'The second one overwrites the first', why: 'They don’t share storage, so nothing is overwritten.' },
      { t: 'They can’t; it causes an error', why: 'It is completely normal and allowed.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function tick() {
  let count = 0;
  count = count + 1;
  return count;
}
tick();
console.log(tick());
\`\`\``,
    options: [
      { t: '`2`', why: 'The first call’s `count` was thrown away with its page; the second call starts again from 0.' },
      { t: '`0`', why: 'Each call adds one before returning.' },
      { t: '`1`', correct: true, why: 'Every call makes a fresh `count = 0`, adds one, and returns `1`.' },
    ],
  },
  {
    q: `What happens here?
\`\`\`
function area(w, h) {
  const a = w * h;
  return a;
}
area(3, 4);
console.log(a);
\`\`\``,
    options: [
      { t: 'It prints `12`', why: '`a` lived only on the call’s page, which is gone by the last line.' },
      { t: 'It prints `undefined`', why: 'There is no variable `a` at all out here, which is an error rather than `undefined`.' },
      { t: 'It stops with `ReferenceError: a is not defined`', correct: true, why: 'The outside code cannot see a finished call’s local variables.' },
    ],
  },
];
