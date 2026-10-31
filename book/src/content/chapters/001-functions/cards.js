// Chapter 1 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fn-what': {
    q: 'In one sentence: what is a function?',
    a: 'A named piece of work (a block of code) that you can run whenever you want by calling it.',
  },
  'param-vs-arg': {
    q: 'In `function double(n) { ... }` called as `double(3)`, which is the **parameter** and which is the **argument**?',
    a: '`n` is the parameter (the placeholder name in the definition). `3` is the argument (the actual value passed in this call).',
  },
  'define-vs-call': {
    q: 'Does writing `function double(n) { return n * 2; }` compute anything?',
    a: 'No. It only defines the function (puts the recipe on the shelf). Work happens when you call it, e.g. `double(3)`.',
  },
  'return-two-jobs': {
    q: 'What two things does `return` do?',
    a: 'It decides the value the call produces, and it stops the function immediately.',
  },
  'no-return': {
    q: 'What does a call produce if the function never reaches a `return`?',
    a: '`undefined`, JavaScript’s value for “nothing”.',
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
  'fn-calls-fn': {
    q: 'If `hypot` calls `square` twice, how many separate pages (sets of local variables) for `square` are created?',
    a: 'Two: one per call, each with its own `x`.',
  },
};

export const examples = {
  double: {
    title: 'A function that doubles',
    code: `function double(n) {
  return n * 2;
}

console.log(double(3));
console.log(double(10));
console.log(double(3) + 1);`,
  },
};

export const exercises = {
  average: {
    title: 'The average of two numbers',
    prompt:
      'Write a function `average(a, b)` that **returns** the average of its two arguments. For example `average(2, 4)` should return `3`.',
    starter: `function average(a, b) {
  // your code here
}

console.log(average(2, 4));`,
    solution: `function average(a, b) {
  return (a + b) / 2;
}`,
    tests: `test('average(2, 4) is 3', () => {
  expect(average(2, 4)).toBe(3);
});
test('average(1, 2) is 1.5', () => {
  expect(average(1, 2)).toBe(1.5);
});
test('works with negatives', () => {
  expect(average(-10, 10)).toBe(0);
});
test('returns, not just prints', () => {
  expect(typeof average(1, 1)).toBe('number');
});`,
    hints: [
      'The average of two numbers is their sum divided by 2.',
      'Make sure the value comes back to the caller: the body needs a `return`.',
      'Mind the order of operations: `a + b / 2` divides only `b`. Use parentheses.',
    ],
    walkthrough: `Start from the recipe in words: add the two numbers, then halve the total.

- **Add, then halve.** \`a + b\` gives the total, and \`/ 2\` halves it.
- **Parentheses matter.** Division happens before addition, just like in maths class. So \`a + b / 2\` would compute \`a + (b / 2)\`. Writing \`(a + b) / 2\` forces the addition first.
- **Return it.** The tests call \`average\` and look at the value it *produces*, so the result has to go out through \`return\`.`,
    wrong: [
      {
        code: `function average(a, b) {
  return a + b / 2;
}`,
        why: '`average(2, 4)` gives `4`, not `3`, because `b / 2` is worked out first. Add parentheses: `(a + b) / 2`.',
      },
      {
        code: `function average(a, b) {
  console.log((a + b) / 2);
}`,
        why: 'This *prints* the right number but *returns* `undefined`, so the tests fail. Printing is not returning.',
      },
    ],
  },
  clamp: {
    optional: true,
    title: 'Keep a number in range',
    prompt:
      'Write `clamp(x, lo, hi)`: it returns `lo` if `x` is below `lo`, returns `hi` if `x` is above `hi`, and otherwise returns `x` unchanged. Games use this all the time, for example to keep a player inside the screen.',
    starter: `function clamp(x, lo, hi) {
  // your code here
}

console.log(clamp(15, 0, 10));`,
    solution: `function clamp(x, lo, hi) {
  if (x < lo) {
    return lo;
  }
  if (x > hi) {
    return hi;
  }
  return x;
}`,
    tests: `test('below the range gives lo', () => {
  expect(clamp(-5, 0, 10)).toBe(0);
});
test('above the range gives hi', () => {
  expect(clamp(15, 0, 10)).toBe(10);
});
test('inside the range is unchanged', () => {
  expect(clamp(7, 0, 10)).toBe(7);
});
test('the edges are inside', () => {
  expect(clamp(0, 0, 10)).toBe(0);
  expect(clamp(10, 0, 10)).toBe(10);
});`,
    hints: [
      'There are three cases: too small, too big, and just right.',
      'Use an `if` for each of the first two cases, with a `return` inside it.',
      'Because `return` stops the function, the last line only runs when neither `if` matched.',
    ],
    walkthrough: `This exercise is about \`return\` *stopping* the function.

- **Too small?** \`if (x < lo) { return lo; }\`. If this runs, the function is finished, so nothing below it happens.
- **Too big?** \`if (x > hi) { return hi; }\`.
- **Otherwise** we only reach the last line when both checks failed, so \`x\` is already in range: \`return x;\`.

No \`else\` is needed, because each \`return\` exits early. This "early return" style is very common in compilers: check for the special cases first, get out, and leave the normal case for the end.`,
    wrong: [
      {
        code: `function clamp(x, lo, hi) {
  if (x < lo) {
    x = lo;
  }
  if (x > hi) {
    x = hi;
  }
}`,
        why: 'The logic is right, but nothing is returned, so every call gives `undefined`. Add `return x;` at the end.',
      },
      {
        code: `function clamp(x, lo, hi) {
  if (x <= lo) {
    return lo;
  }
  return x;
}`,
        why: 'This forgets the upper limit: `clamp(15, 0, 10)` returns `15`. (Using `<=` is fine here, since `x === lo` gives `lo` either way.)',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does this print?\n```\nfunction f(n) {\n  return n + 1;\n}\nconsole.log(f(f(1)));\n```',
    options: [
      { t: '`2`', why: 'That is `f(1)`. But that result is fed into `f` again.' },
      { t: '`3`', correct: true, why: 'The inner call runs first: `f(1)` is `2`. Then `f(2)` is `3`.' },
      { t: '`1`', why: 'Each call adds 1, and there are two calls.' },
      { t: '`undefined`', why: 'The function does return a value: `n + 1`.' },
    ],
  },
  {
    q: 'In `function greet(name) { ... }` called as `greet(\'Ada\')`, what is `\'Ada\'`?',
    options: [
      { t: 'The parameter', why: 'The parameter is `name`, the placeholder in the definition.' },
      { t: 'The return value', why: 'Nothing here says what `greet` returns.' },
      { t: 'The argument', correct: true, why: 'It is the actual value passed in this particular call.' },
      { t: 'A local variable of the caller', why: 'It is a value written directly in the call, not a variable.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function g(x) {
  if (x > 0) {
    return 'yes';
  }
  return 'no';
  console.log('done');
}
console.log(g(5));
\`\`\``,
    options: [
      { t: '`yes` then `done`', why: 'The `console.log(\'done\')` comes after a `return`, so it never runs.' },
      { t: '`yes`', correct: true, why: '`x > 0`, so `return \'yes\'` runs and the function stops immediately.' },
      { t: '`no`', why: '5 is greater than 0, so the first `return` runs.' },
      { t: '`undefined`', why: 'A `return` runs, so the call produces `\'yes\'`.' },
    ],
  },
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
    q: 'Why can two different functions both have a local variable called `total` without any conflict?',
    options: [
      { t: 'JavaScript renames one of them secretly', why: 'No renaming happens. Each call simply has its own page.' },
      { t: 'Each call keeps its local variables on its own private page', correct: true, why: 'Local variables live only in the call that created them, so they never collide.' },
      { t: 'The second one overwrites the first', why: 'They don’t share storage, so nothing is overwritten.' },
      { t: 'They can’t; it causes an error', why: 'It is completely normal and allowed.' },
    ],
  },
  {
    q: 'Which line **calls** a function (rather than defining it)?',
    options: [
      { t: '`function square(x) { return x * x; }`', why: 'That defines `square`; it computes nothing yet.' },
      { t: '`return x * x;`', why: 'That is a statement inside the body of a definition.' },
      { t: '`const s = square(4);`', correct: true, why: 'Name followed by parentheses with arguments: the function runs, and `s` becomes `16`.' },
      { t: '`square`', why: 'Just the name refers to the function without running it. You need the parentheses to call it.' },
    ],
  },
];
