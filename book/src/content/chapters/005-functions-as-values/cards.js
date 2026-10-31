// Chapter 5 cards. Keys are stable ids: never rename them.

export const prompts = {
  'fn-is-value': {
    q: 'What does it mean that JavaScript functions are *first-class*?',
    a: 'A function is a value: it can be stored in variables, arrays and objects, passed as an argument and returned.',
  },
  'name-vs-call': {
    q: 'With `function double(n) { return n * 2; }`, what is the difference between `double` and `double(5)`?',
    a: '`double` is the function itself. `double(5)` calls it and is its result, `10`.',
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
  'map-length': {
    q: 'If `xs` has 5 items, how many items does `xs.map(f)` have?',
    a: 'Always 5: map makes one result per item.',
  },
  'filter-returns': {
    q: 'What does `xs.filter(f)` give back?',
    a: 'A new array holding only the items for which `f` returned `true`. `xs` itself is unchanged.',
  },
  'reduce-init': {
    q: 'Why should you always pass `reduce` a starting value, as in `xs.reduce(f, 0)`?',
    a: 'Without one, reduce starts from the first item, so on an empty array it throws a TypeError. With one, an empty array just gives the starting value.',
  },
  'while-check': {
    q: 'When does a `while` loop check its condition, and what if it is false the first time?',
    a: 'Before every pass. If it is false at the start, the body never runs at all.',
  },
  'break-continue': {
    q: 'What is the difference between `break` and `continue` in a loop?',
    a: '`break` leaves the loop entirely. `continue` skips the rest of this pass and goes on to the next check.',
  },
};

export const examples = {
  pipeline: {
    title: 'map, filter and reduce on particles',
    code: `const ps = [
  { x: 1, vx: 2, mass: 5 },
  { x: 4, vx: -1, mass: 2 },
  { x: 9, vx: 3, mass: 1 },
];

const xs = ps.map((p) => p.x);
console.log(xs);

const right = ps.filter(
  (p) => p.vx > 0,
);
console.log(right.length);

const mass = ps.reduce(
  (t, p) => t + p.mass,
  0,
);
console.log(mass);
console.log(ps.length);`,
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
      'Start a counter at 0 and loop over every item.',
      'For each item, *call* the callback with it: `test(xs[i])`.',
      'If that call returns `true`, add one to the counter. Return the counter at the end.',
      'There is also a one-line answer using `filter` and `length`.',
    ],
    walkthrough: `This is the counting loop from chapter 2, with one change: the question "does this item count?" isn't written into the loop. It arrives as a function.

- **Counter.** \`let n = 0;\` before the loop.
- **Ask the callback.** \`test(xs[i])\` calls the function you were handed, with the current item. Whatever it returns decides whether to count it.
- **Count.** \`if (test(xs[i])) { n++; }\`.
- **Return** \`n\` after the loop. An empty array never enters the loop, so it gives \`0\` for free.

The short version is \`return xs.filter(test).length;\`: filter builds the array of items that pass, and its length is the count. Both are correct. The loop version builds no extra array, which matters when the array is huge.

Notice that \`countIf\` doesn't know or care what the items are. The same function counts big numbers and right-moving particles. That is the payoff of passing work in as a value.`,
    wrong: [
      {
        code: `function countIf(xs, test) {
  return xs.filter(test);
}`,
        why: 'This returns the array of passing items, `[5, 8]`, not how many there are. Add `.length`.',
      },
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
    ],
  },
  sumBy: {
    optional: true,
    title: 'Add up one field with reduce',
    prompt:
      'Write `sumBy(ps, f)` using `reduce`. It returns the total of `f(p)` over every item `p` in `ps`. For example `sumBy(ps, (p) => p.mass)` is the total mass. An empty array must give `0`.',
    starter: `function sumBy(ps, f) {
  // your code here
}

const ps = [{ mass: 5 }, { mass: 2 }];
console.log(sumBy(ps, (p) => p.mass));`,
    solution: `function sumBy(ps, f) {
  const add = (t, p) => t + f(p);
  return ps.reduce(add, 0);
}`,
    tests: `test('total mass', () => {
  const ps = [{ mass: 5 }, { mass: 2 }];
  expect(sumBy(ps, (p) => p.mass)).toBe(7);
});
test('any callback works', () => {
  const ps = [{ x: 1 }, { x: 4 }];
  expect(sumBy(ps, (p) => p.x * 10)).toBe(50);
});
test('an empty array gives 0', () => {
  expect(sumBy([], (p) => p.mass)).toBe(0);
});`,
    hints: [
      '`reduce` takes two things: a callback `(t, p) => ...` and a starting value.',
      'The running total starts at `0`.',
      'Each step, the new total is the old total plus `f(p)`.',
    ],
    walkthrough: `reduce is exactly "keep a running total", so the whole function is one call.

- **Start value \`0\`.** That's the total before any items, and it is also the right answer for an empty array.
- **Callback \`add = (t, p) => t + f(p)\`.** \`t\` is the total so far and \`p\` is the current item. We call the callback we were *given*, \`f\`, to get the number to add from this item.
- **The result** of \`reduce\` is the final total, so we return it directly.

Two callbacks are at work here: \`f\`, which the caller supplies, and the little arrow we give to \`reduce\`. A higher-order function calling another higher-order function is completely normal, and you'll see it all over compilers.`,
    wrong: [
      {
        code: `function sumBy(ps, f) {
  return ps.reduce((t, p) => t + f(p));
}`,
        why: 'With no starting value, reduce uses the first *object* as the start, so the total is wrong, and an empty array throws a TypeError. Pass `0`.',
      },
      {
        code: `function sumBy(ps, f) {
  return ps.map(f);
}`,
        why: 'map gives the array of values, `[5, 2]`, but never adds them up.',
      },
    ],
  },
  doublings: {
    optional: true,
    title: 'How many doublings?',
    prompt:
      'Write `doublings(n)` with a `while` loop. Start from `1` and keep doubling. Return how many doublings it takes to reach **at least** `n`. So `doublings(1)` is `0`, `doublings(2)` is `1`, and `doublings(5)` is `3` (1 → 2 → 4 → 8).',
    starter: `function doublings(n) {
  // your code here
}

console.log(doublings(5));`,
    solution: `function doublings(n) {
  let v = 1;
  let steps = 0;
  while (v < n) {
    v = v * 2;
    steps++;
  }
  return steps;
}`,
    tests: `test('1 needs no doublings', () => {
  expect(doublings(1)).toBe(0);
});
test('2 needs one', () => {
  expect(doublings(2)).toBe(1);
});
test('5 needs three', () => {
  expect(doublings(5)).toBe(3);
});
test('1000 needs ten', () => {
  expect(doublings(1000)).toBe(10);
});`,
    hints: [
      'You need two variables: the current value (starting at 1) and a count (starting at 0).',
      'Loop *while* the value is still too small, `v < n`.',
      'Inside, double the value and add one to the count.',
    ],
    walkthrough: `You can't know in advance how many passes you need, which is exactly when \`while\` is the right loop.

- **State.** \`v\` starts at 1, \`steps\` at 0.
- **Condition.** Keep going *while* \`v < n\`: "not there yet". As soon as \`v\` reaches or passes \`n\`, the check fails and the loop ends.
- **Body.** Double \`v\`, count the step. Both happen every pass, so the loop always makes progress and can't run forever.
- **Edge case.** For \`n = 1\`, \`1 < 1\` is false at the start, the body never runs, and the answer is 0. That is the "check before every pass" rule doing the work.`,
    wrong: [
      {
        code: `function doublings(n) {
  let v = 1;
  let steps = 0;
  while (v <= n) {
    v = v * 2;
    steps++;
  }
  return steps;
}`,
        why: '`<=` keeps going when `v` has already reached `n`, so `doublings(2)` gives 2 and `doublings(1)` gives 1. Use `v < n`: stop once you are at least `n`.',
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
      { t: '`run(hello)`', correct: true, why: 'No parentheses after `hello`: the function itself is passed, for `run` to call.' },
      { t: '`run()`', why: 'Nothing is passed at all, so `f` is `undefined`.' },
    ],
  },
  {
    q: 'What is `[1, 2, 3].map((n) => { n * 2 })`?',
    options: [
      { t: '`[ 2, 4, 6 ]`', why: 'That would need `(n) => n * 2` without braces, or a `return`.' },
      { t: '`[ undefined, undefined, undefined ]`', correct: true, why: 'The braces make a statement body with no `return`, so each call returns `undefined`. map still makes one slot per item.' },
      { t: '`[]`', why: 'map always returns an array of the same length as the input.' },
      { t: '`undefined`', why: 'map always returns an array; it is the *items* that are `undefined`.' },
    ],
  },
  {
    q: 'What is `[2, 3, 4].reduce((t, n) => t + n, 10)`?',
    options: [
      { t: '`9`', why: 'That forgets the starting value, 10.' },
      { t: '`10`', why: 'That is only the starting value; each item is then added.' },
      { t: '`[ 12, 13, 14 ]`', why: 'reduce combines everything into one value; it doesn’t return an array here.' },
      { t: '`19`', correct: true, why: 'The running value starts at 10, then becomes 12, 15 and finally 19.' },
    ],
  },
  {
    q: `How many times does the body run?
\`\`\`
let i = 10;
while (i < 3) {
  i++;
}
\`\`\``,
    options: [
      { t: 'Three times', why: '`i` starts at 10, not 0.' },
      { t: 'Once', why: 'A while loop checks *before* the first pass, not after it.' },
      { t: 'Zero times', correct: true, why: '`10 < 3` is false at the very first check, so the body never runs.' },
      { t: 'Forever', why: 'The condition is false at the start, so the loop ends at once.' },
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
