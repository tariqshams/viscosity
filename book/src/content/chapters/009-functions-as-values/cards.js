// Chapter 9 cards. Keys are stable ids: never rename them.

export const prompts = {
  'fn-is-value': {
    q: 'What does it mean that JavaScript functions are *first-class*?',
    a: 'A function is a value: it can be stored in variables, arrays and objects, passed as an argument and returned.',
  },
  'name-vs-call': {
    q: 'With `function double(n) { return n * 2; }`, what is the difference between `double` and `double(5)`?',
    a: '`double` is the function itself. `double(5)` calls it and is its result, `10`.',
  },
  'fn-in-table': {
    q: '`const byOp = { \'+\': add };` How do you call `add` through `byOp` with 2 and 3?',
    a: '`byOp[\'+\'](2, 3)`: brackets find the function, and `(2, 3)` calls it.',
  },
  'callback-what': {
    q: 'What is a callback?',
    a: 'A function passed to another function, which calls it when it needs to.',
  },
  'pass-not-call': {
    q: 'Why does `pluck(ps, getX())` go wrong, when `pluck(ps, getX)` works?',
    a: '`getX()` calls `getX` straight away and passes its result, not the function. `pluck` then tries to call a value that isn’t a function.',
  },
  'hof-what': {
    q: 'What makes a function *higher-order*?',
    a: 'It takes a function as an argument, or returns one (or both).',
  },
  'arrow-braces': {
    q: 'What does `((n) => { n * 2 })(4)` give, and why?',
    a: '`undefined`. With braces the body is statements, and nothing `return`s `n * 2`.',
  },
  'arrow-short': {
    q: 'Write `function add(a, b) { return a + b; }` as an arrow function.',
    a: '`const add = (a, b) => a + b;`',
  },
};

export const examples = {
  callbacks: {
    title: 'Functions in, functions out',
    code: `function pluck(xs, get) {
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    out.push(get(xs[i]));
  }
  return out;
}

const ps = [
  { x: 1, vx: 2 },
  { x: 4, vx: -1 },
];
console.log(pluck(ps, (p) => p.x));
console.log(pluck(ps, (p) => p.vx));

function times(k) {
  return (n) => n * k;
}
const triple = times(3);
console.log(triple(5));
console.log(pluck([1, 2], triple));`,
  },
};

export const exercises = {
  countIf: {
    title: 'Count the items that pass a test',
    prompt:
      'Write `countIf(xs, test)`. `test` is a callback that takes one item and returns `true` or `false`. Return **how many** items of `xs` make `test` return `true`. For example `countIf([1, 5, 8], (n) => n > 4)` is `2`.',
    starter: `function countIf(xs, test) {
  // your code here
}

const big = (n) => n > 4;
console.log(countIf([1, 5, 8], big));`,
    solution: `function countIf(xs, test) {
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    if (test(xs[i])) {
      n++;
    }
  }
  return n;
}`,
    tests: `test('counts numbers over 4', () => {
  expect(countIf([1, 5, 8], (n) => n > 4)).toBe(2);
});
test('an empty array gives 0', () => {
  expect(countIf([], (n) => true)).toBe(0);
});
test('works on objects', () => {
  const ps = [{ vx: 2 }, { vx: -1 }, { vx: 3 }];
  expect(countIf(ps, (p) => p.vx > 0)).toBe(2);
});
test('nothing passes', () => {
  expect(countIf([1, 2], (n) => n > 9)).toBe(0);
});`,
    hints: [
      'This is a counting loop from chapter 4. What changes is who decides whether an item counts.',
      'Start a counter at 0 and loop over every item. For each item, *call* the callback with it: `test(xs[i])`.',
      'If that call returns `true`, add one to the counter: `if (test(xs[i])) { n++; }`. Return the counter after the loop.',
    ],
    walkthrough: `**How to think about it.** Without callbacks you would write a counting loop with the question baked in: \`if (xs[i] > 4) n++\`. Here the question is not yours to write; it arrives as a function, \`test\`, and your loop only has to *ask* it about each item. So start from chapter 4's counting loop and replace the fixed condition with a call of the callback. Try one by hand: for \`[1, 5, 8]\` and \`(n) => n > 4\`, asking about 1 gives \`false\`, about 5 gives \`true\`, about 8 gives \`true\`, so the count is 2.

**The solution, line by line.**

- \`function countIf(xs, test) {\` takes the array and the callback. \`test\` is an ordinary parameter that happens to hold a function.
- \`  let n = 0;\` is the counter, before the loop.
- \`  for (let i = 0; i < xs.length; i++) {\` visits every item.
- \`    if (test(xs[i])) {\` calls the function you were handed, with the current item. Whatever it returns decides the \`if\`: \`true\` means "count this one".
- \`      n++;\` adds one to the counter (short for \`n = n + 1\`).
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return n;\` hands back the count. An empty array never enters the loop, so it gives 0.
- \`}\` closes the body.

Notice that \`countIf\` does not know or care what the items are: the same function counts big numbers and right-moving particles. That is the payoff of passing work in as a value. (Next chapter shows a one-line version built from \`filter\`.)

**Common wrong attempts.**

- \`if (test)\` asks "is there a function?", which is always yes, so every item is counted. You have to *call* it: \`test(xs[i])\`.
- \`if (test(xs))\` calls the callback once with the whole array rather than with one item, so \`(n) => n > 4\` compares an array with 4 and the answer is meaningless.
- \`if (test(xs[i])) { return n + 1; }\` stops at the first match, so the count is never more than 1.`,
    wrong: [
      {
        code: `function countIf(xs, test) {
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    if (test) {
      n++;
    }
  }
  return n;
}`,
        why: '`if (test)` asks "is there a function?", which is always yes, so every item is counted. You have to *call* it: `test(xs[i])`.',
      },
      {
        code: `function countIf(xs, test) {
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    if (test(xs[i])) {
      return n + 1;
    }
  }
  return n;
}`,
        why: '`return` stops the whole function at the first item that passes, so the answer is never more than 1. Count with `n++` and return after the loop.',
      },
    ],
  },
  applyN: {
    optional: true,
    title: 'Apply a function n times',
    prompt:
      'Write `applyN(f, n, x)` that calls `f` on `x`, then calls `f` on that result, and so on, `n` times in all, and returns the final value. So `applyN((v) => v * 2, 3, 1)` is `8` (1 → 2 → 4 → 8), and with `n` equal to 0 it returns `x` unchanged.',
    starter: `function applyN(f, n, x) {
  // your code here
}

const dbl = (v) => v * 2;
console.log(applyN(dbl, 3, 1));`,
    solution: `function applyN(f, n, x) {
  let v = x;
  for (let i = 0; i < n; i++) {
    v = f(v);
  }
  return v;
}`,
    tests: `test('doubling three times', () => {
  expect(applyN((v) => v * 2, 3, 1)).toBe(8);
});
test('zero times returns x', () => {
  expect(applyN((v) => v * 2, 0, 5)).toBe(5);
});
test('any function', () => {
  expect(applyN((v) => v + 10, 2, 1)).toBe(21);
});
test('works on strings', () => {
  expect(applyN((s) => s + '!', 3, 'hi')).toBe('hi!!!');
});`,
    hints: [
      'Keep a "current value" that starts as `x`.',
      'Loop `n` times. Each pass, replace the current value with `f` of it.',
      '`let v = x;` then `for (let i = 0; i < n; i++) { v = f(v); }`, then `return v;`.',
    ],
    walkthrough: `**How to think about it.** Trace the example: start at 1; after one call of \`f\` you have 2; after two, 4; after three, 8. Each call's output is the next call's input, so you need a variable that holds "the value so far" and is replaced on every pass. The number of passes is \`n\`, which a counting \`for\` loop gives you.

**The solution, line by line.**

- \`function applyN(f, n, x) {\` takes the callback, the count and the starting value.
- \`  let v = x;\` is the value so far. Before any calls, it is \`x\` itself, which is why \`n = 0\` returns \`x\` unchanged.
- \`  for (let i = 0; i < n; i++) {\` runs the body exactly \`n\` times.
- \`    v = f(v);\` calls the function you were handed with the current value and stores its result as the new current value: 1 becomes 2, then 4, then 8.
- \`  }\` ends the loop, and \`  return v;\` gives back the final value.

The last test passes a function on strings: \`applyN\` never looks at what the values are, so it works for anything \`f\` can handle.

**Common wrong attempts.**

- \`v = f(x);\` inside the loop calls \`f\` on the *original* value every time, so the answer is always \`f(x)\` (2 in the first test) however many passes you make.
- \`for (let i = 0; i <= n; i++)\` runs \`n + 1\` times, one call too many.`,
    wrong: [
      {
        code: `function applyN(f, n, x) {
  let v = x;
  for (let i = 0; i < n; i++) {
    v = f(x);
  }
  return v;
}`,
        why: '`f(x)` uses the original value on every pass, so the result is always just `f(x)`. Feed each result back in: `v = f(v)`.',
      },
      {
        code: `function applyN(f, n, x) {
  let v = x;
  for (let i = 0; i <= n; i++) {
    v = f(v);
  }
  return v;
}`,
        why: '`i <= n` runs the body `n + 1` times, so doubling 3 times from 1 gives 16.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
const half = (n) => n / 2;
const h = half;
console.log(h(10));
\`\`\``,
    options: [
      { t: '`5`', correct: true, why: '`h` is another name for the same function, so `h(10)` runs `10 / 2`.' },
      { t: '`10`', why: 'The function runs, so the number is halved.' },
      { t: '`undefined`', why: 'An arrow function without braces returns its expression.' },
      { t: 'An error, because `h` is not a function', why: '`const h = half` copies the function itself, so `h` is a function.' },
    ],
  },
  {
    q: '`run(f)` calls `f` three times. Which line hands it a **callback**?',
    options: [
      { t: '`run(hello())`', why: 'This calls `hello` first and passes its result, not the function.' },
      { t: '`run(\'hello\')`', why: 'That passes a string. You can’t call a string.' },
      { t: '`run(hello)`', correct: true, why: 'No brackets after `hello`: the function itself is passed, for `run` to call.' },
      { t: '`run()`', why: 'Nothing is passed at all, so `f` is `undefined`.' },
    ],
  },
  {
    q: 'What does `((n) => { n * 2 })(4)` give?',
    options: [
      { t: '`8`', why: 'That would need `(n) => n * 2` without braces, or a `return`.' },
      { t: '`4`', why: 'Nothing returns `n` either; the body only works out `n * 2` and throws it away.' },
      { t: '`undefined`', correct: true, why: 'The braces make a statement body with no `return`, so the call returns `undefined`.' },
      { t: 'An error', why: 'It is legal code; it just returns nothing.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function times(k) {
  return (n) => n * k;
}
console.log(times(2)(5));
\`\`\``,
    options: [
      { t: '`7`', why: 'The returned function multiplies; it does not add.' },
      { t: 'A function', why: '`times(2)` is a function, but the `(5)` after it calls that function.' },
      { t: '`10`', correct: true, why: '`times(2)` returns a function that doubles, and `(5)` calls it with 5.' },
      { t: 'An error: you cannot call a call', why: 'A call that returns a function can be called straight away.' },
    ],
  },
  {
    q: 'Which of these is a higher-order function?',
    options: [
      { t: '`(a, b) => a + b`', why: 'It takes numbers and returns a number. No functions involved.' },
      { t: '`(f) => f(f(1))`', correct: true, why: 'It takes a function as an argument, which is what makes it higher-order.' },
      { t: '`(p) => p.x`', why: 'It takes an object and returns a property. That makes a good callback, but it isn’t higher-order itself.' },
      { t: '`(xs) => xs.length`', why: 'It takes an array and returns a number.' },
    ],
  },
];
