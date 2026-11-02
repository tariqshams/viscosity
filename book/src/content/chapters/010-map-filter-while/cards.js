// Chapter 10 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'map-length': {
    q: 'If `xs` has 5 items, how many items does `xs.map(f)` have?',
    a: 'Always 5: map makes one result per item.',
  },
  'filter-returns': {
    q: 'What does `xs.filter(f)` give back?',
    a: 'A new array holding only the items for which `f` returned `true` (or any other value an `if` treats as true), in order. `xs` itself is unchanged.',
  },
  'filter-same-objects': {
    q: '`const fast = ps.filter(f);` Is `fast[0]` a copy of a particle in `ps`?',
    a: 'No: the array is new, but its slots hold arrows to the same particle objects.',
  },
  'reduce-init': {
    q: 'Why is it safer to pass `reduce` a starting value, as in `xs.reduce(f, 0)`?',
    a: 'Without one, reduce starts from the first item, so on an empty array it throws a TypeError. With one, an empty array just gives the starting value.',
  },
  'reduce-steps': {
    q: 'What running values does `[2, 3, 4].reduce((t, n) => t + n, 10)` go through?',
    a: '10, then 12, 15 and 19; it returns 19.',
  },
  'while-check': {
    q: 'When does a `while` loop check its condition, and what if it is false the first time?',
    a: 'Before every pass. If it is false at the start, the body never runs at all.',
  },
  'break-continue': {
    q: 'What is the difference between `break` and `continue` in a loop?',
    a: '`break` leaves the loop entirely. `continue` skips the rest of this pass and goes on to the next one (in a `for` loop, after running its update step).',
  },
  'while-forever': {
    q: 'A `while` loop contains no `break`, `return` or `throw`. What must its body do for the loop to end?',
    a: 'Change something the condition depends on, so that it eventually becomes false (such as `i++`), on every path through the body, including before any `continue`.',
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
console.log(right[0] === ps[0]);

const mass = ps.reduce(
  (t, p) => t + p.mass,
  0,
);
console.log(mass);
console.log(ps.length);`,
  },
};

export const exercises = {
  sumBy: {
    title: 'Add up one field with reduce',
    prompt: 'Write `sumBy(ps, f)` using `reduce`. It returns the total of `f(p)` over every item `p` in `ps`. For example `sumBy(ps, (p) => p.mass)` is the total mass. An empty array must give `0`.',
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
      'reduce keeps a running total for you. What should the total be before any items have been seen?',
      '`reduce` takes two things: a callback `(t, p) => ...` that returns the next total, and the starting value, `0`.',
      'Each step, the new total is the old total plus `f(p)`: `ps.reduce((t, p) => t + f(p), 0)`.',
    ],
    walkthrough: `**How to think about it.** Write it first as a loop in your head: start a total at 0, and for each item add \`f(item)\`. That is exactly what \`reduce\` does, if you tell it two things: where the total starts (0, which is also the right answer for an empty array) and how to get from one total to the next (old total plus \`f\` of the current item). Try the first test by hand: the total goes 0, then 0 + 5 = 5, then 5 + 2 = 7.

**The solution, line by line.**

- \`function sumBy(ps, f) {\` takes the array and a callback \`f\` that turns one item into a number.
- \`  const add = (t, p) => t + f(p);\` is the step reduce will take for every item. \`t\` is the total so far and \`p\` is the current item; it calls the callback we were *given*, \`f\`, to get this item's number, and returns the new total. (Giving the arrow a name just makes the next line easier to read; writing it straight inside the call is equally right.)
- \`  return ps.reduce(add, 0);\` runs \`add\` once per item with the running total starting at 0, and returns the final total.
- \`}\` closes the body.

Two callbacks are at work: \`f\`, which the caller supplies, and \`add\`, which we hand to \`reduce\`. A higher-order function calling another higher-order function is completely normal, and you will see it all over compilers.

**Common wrong attempts.**

- \`ps.reduce((t, p) => t + f(p))\` forgets the start. reduce then begins from the first *item*, an object, so the "total" becomes text like \`"[object Object]2"\`, and an empty array throws a TypeError.
- \`ps.map(f)\` gives the array of numbers, \`[5, 2]\`, but never adds them up.
- \`ps.reduce((t, p) => t + p, 0)\` adds the items themselves rather than \`f(p)\`, so objects get glued into text again.`,
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
    prompt: 'Write `doublings(n)` with a `while` loop. Start from `1` and keep doubling. Return how many doublings it takes to reach **at least** `n`. So `doublings(1)` is `0`, `doublings(2)` is `1`, and `doublings(5)` is `3` (1 → 2 → 4 → 8).',
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
      'You cannot know the number of passes in advance, which is the sign that `while` is the right loop.',
      'You need two variables: the current value (starting at 1) and a count (starting at 0). Loop *while* the value is still too small, `v < n`.',
      'Inside the loop, double the value and add one to the count; after the loop, return the count.',
    ],
    walkthrough: `**How to think about it.** Do \`n = 5\` by hand: 1 is too small, double to 2 (one doubling); still too small, double to 4 (two); still too small, double to 8 (three); 8 is at least 5, so stop. The answer is 3. You kept asking "am I there yet?" before each doubling, and you could not have said beforehand how many times you would ask: that is exactly a \`while\` loop whose condition is "not there yet", \`v < n\`.

**The solution, line by line.**

- \`function doublings(n) {\` takes the target.
- \`  let v = 1;\` is the current value, and \`  let steps = 0;\` counts doublings. Both are \`let\` because both change.
- \`  while (v < n) {\` asks before every pass: still short of \`n\`? As soon as \`v\` reaches or passes \`n\`, the check fails and the loop ends.
- \`    v = v * 2;\` doubles the value, and \`    steps++;\` counts it. Both happen on every pass, so the loop always moves towards its end and cannot run forever.
- \`  }\` ends the loop, and \`  return steps;\` gives back the count.

For \`n = 1\`, the check \`1 < 1\` is false before the first pass, so the body never runs and the answer is 0: the "check before every pass" rule doing the work.

**Common wrong attempts.**

- \`while (v <= n)\` keeps going when \`v\` has already reached \`n\`, so \`doublings(2)\` gives 2 and \`doublings(1)\` gives 1.
- Forgetting \`v = v * 2\` leaves \`v\` at 1 for ever, so the loop never ends and the page stops responding.`,
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
    q: 'What is `[1, 2, 3].map((n) => { n * 2 })`?',
    options: [
      {
        t: '`[ 2, 4, 6 ]`',
        why: 'That would need `(n) => n * 2` without braces, or a `return`.',
      },
      {
        t: '`[ undefined, undefined, undefined ]`',
        correct: true,
        why: 'The braces make a statement body with no `return`, so each call returns `undefined`. map still makes one slot per item.',
      },
      {
        t: '`[]`',
        why: 'map always returns an array of the same length as the input.',
      },
      {
        t: '`undefined`',
        why: 'map always returns an array; it is the *items* that are `undefined`.',
      },
    ],
  },
  {
    q: 'What is `[2, 3, 4].reduce((t, n) => t + n, 10)`?',
    options: [
      {
        t: '`9`',
        why: 'That forgets the starting value, 10.',
      },
      {
        t: '`10`',
        why: 'That is only the starting value; each item is then added.',
      },
      {
        t: '`[ 12, 13, 14 ]`',
        why: 'reduce combines everything into one value; it doesn’t return an array here.',
      },
      {
        t: '`19`',
        correct: true,
        why: 'The running value starts at 10, then becomes 12, 15 and finally 19.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const ps = [{ vx: 2 }, { vx: -1 }];
const fast = ps.filter((p) => p.vx > 0);
fast[0].vx = 9;
console.log(ps[0].vx);
\`\`\``,
    options: [
      {
        t: '`9`',
        correct: true,
        why: '`filter` makes a new array, but its slot holds an arrow to the same particle, so the change shows in `ps`.',
      },
      {
        t: '`2`',
        why: 'That would be true if filter copied the objects. It copies only the arrows.',
      },
      {
        t: '`-1`',
        why: '`ps[0]` is the particle with `vx: 2`, which filter kept and the next line changed.',
      },
      {
        t: 'An error',
        why: 'Changing a property of a kept object is allowed.',
      },
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
      {
        t: 'Three times',
        why: '`i` starts at 10, not 0.',
      },
      {
        t: 'Once',
        why: 'A while loop checks *before* the first pass, not after it.',
      },
      {
        t: 'Zero times',
        correct: true,
        why: '`10 < 3` is false at the very first check, so the body never runs.',
      },
      {
        t: 'Forever',
        why: 'The condition is false at the start, so the loop ends at once.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const vs = [4, -2, 6, 20, 1];
let i = 0;
let t = 0;
while (i < vs.length) {
  const v = vs[i];
  i++;
  if (v < 0) continue;
  if (v > 10) break;
  t = t + v;
}
console.log(t);
\`\`\``,
    options: [
      {
        t: '`29`',
        why: 'That adds every non-negative value; `break` stops the loop at 20, so 20 and 1 are never added.',
      },
      {
        t: '`10`',
        correct: true,
        why: '4 is added, −2 is skipped by `continue`, 6 is added, and 20 triggers `break`: 4 + 6 = 10.',
      },
      {
        t: '`8`',
        why: '`continue` skips −2 rather than adding it.',
      },
      {
        t: '`11`',
        why: 'The 1 at the end is never reached, because `break` ends the loop at 20.',
      },
    ],
  },
];
