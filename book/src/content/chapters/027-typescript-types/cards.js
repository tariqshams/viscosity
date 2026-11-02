// Chapter 27 cards. Keys are stable ids: never rename them.
//
// The in-page runner erases TypeScript types (sucrase) and never checks
// them, and scripts/check_chapters.mjs runs code as plain JavaScript. So
// every example, solution and wrong attempt here is valid JavaScript, the
// exercises set lang: 'ts' so readers may add annotations, and the typed
// version of each solution is shown in its walkthrough.

export const prompts = {
  'ts-what': {
    q: 'What is TypeScript, in one sentence?',
    a: 'JavaScript plus syntax for types, and a checker (`tsc`) that reads your code before it runs.',
  },
  'tsc-what': {
    q: 'When `tsc` finds a problem, what does each line of its report tell you?',
    a: 'The file, the line and column, an error code and the reason, e.g. `rect.ts(4,11): error TS2345: Argument of type ...`.',
  },
  'runner-checks': {
    q: 'Does this book’s runnable box report TypeScript type errors?',
    a: 'No. It removes the types and runs the rest. Only `tsc` checks types.',
  },
  'annotation-syntax': {
    q: 'In `function f(n: number): string`, what do the two annotations label?',
    a: '`n: number` says the parameter holds a number; the `: string` after the parentheses says `f` returns a string.',
  },
  'array-label': {
    q: 'What does the annotation `xs: number[]` say?',
    a: '`xs` is an array, and every slot in it holds a number.',
  },
  'checker-when': {
    q: 'Does the type checker find mistakes before the program runs, or while it runs?',
    a: 'Before. It reads the whole program without running any of it.',
  },
  inference: {
    q: '`let n = 3;` then `n = \'three\';` with no annotation anywhere. Does TypeScript complain? Why?',
    a: 'Yes. It infers the type `number` from `3`, so assigning a string breaks that label.',
  },
  mismatch: {
    q: 'With `let n: number = \'3\';`, what does `tsc` report, and why?',
    a: '“Type \'string\' is not assignable to type \'number\'.”: `\'3\'` in quotes is a string, whatever it looks like.',
  },
};

export const examples = {
  unchecked: {
    title: 'The runner removes labels; it does not check them',
    lang: 'ts',
    code: `function perimeter(
  w: number,
  h: number,
): number {
  return 2 * (w + h);
}

console.log(perimeter(3, 4));
console.log(perimeter('3', 4));

// tsc would refuse perimeter('3', 4).
// The runner only deletes the types,
// so the second call runs: '3' + 4 is
// '34', and 2 * '34' is 68.`,
  },
};

export const exercises = {
  fixTotal: {
    lang: 'ts',
    title: 'The bug tsc would have caught',
    prompt:
      '`tsc` rejects this function with “Type \'string\' is not assignable to type \'number\'” on the `return` line. Run it first to see what goes wrong at runtime, then fix it so `total(xs)` returns the sum of the numbers in `xs`, and `0` for an empty array. (The runner removes types without checking them, so the tests check what the code *does*.)',
    starter: `function total(xs: number[]): number {
  let t = '0';
  for (const x of xs) {
    t = t + x;
  }
  return t;
}

console.log(total([1, 2]));`,
    solution: `function total(xs) {
  let t = 0;
  for (const x of xs) {
    t = t + x;
  }
  return t;
}`,
    tests: `test('adds the numbers', () => {
  expect(total([1, 2])).toBe(3);
});
test('an empty array totals 0', () => {
  expect(total([])).toBe(0);
});
test('works with decimals', () => {
  expect(total([0.5, 1.5])).toBe(2);
});`,
    hints: [
      'Run the starter. It prints `012`, not `3`. Where could a string have come from?',
      'Look at the first line of the body. What type does TypeScript infer for `t` from its starting value?',
      '`let t = \'0\'` makes `t` a string, so `+` joins text instead of adding. Start the total at the number `0`.',
    ],
    walkthrough: `**How to think about it.** Start from the error message, because it says exactly where the promise is broken: the function is labelled \`: number\`, and \`return t\` returns something that is not a number. So ask what type \`t\` has. It has no label, so TypeScript *inferred* one from its starting value, \`'0'\`, which is in quotes: a string. Everything else follows from that: with a string on the left, \`+\` joins rather than adds, so \`'0' + 1\` is \`'01'\` and then \`'012'\`. In plain JavaScript there is no return label, so nothing complains and the wrong text flows on.

**The solution, line by line.**

- \`function total(xs) {\` takes the array (in TypeScript, \`function total(xs: number[]): number {\`, as in the typed version below).
- \`  let t = 0;\` starts the total at the *number* zero, so TypeScript now infers \`t: number\`. This one change is the whole fix.
- \`  for (const x of xs) {\` visits each number in the array.
- \`    t = t + x;\` is now number plus number, which adds.
- \`  }\` ends the loop.
- \`  return t;\` returns a number, which matches the \`: number\` label, so \`tsc\` is satisfied. For \`[]\`, the loop never runs and \`0\` comes back.
- \`}\` closes the function.

The typed version, which \`tsc\` accepts without a word:

\`\`\`ts
function total(xs: number[]): number {
  let t = 0;
  for (const x of xs) {
    t = t + x;
  }
  return t;
}
\`\`\`

Notice that the label on the *return* is what caught a mistake made four lines earlier. Labelling what a function returns is cheap, and it catches a lot.

**Common wrong attempts.**

- Wrapping the result, \`return Number(t);\`: this silences the checker (the function now returns a number) but keeps the bug, because \`Number('012')\` is \`12\`, not \`3\`. Making the error message go away is not the same as fixing the code.
- \`let t;\` with no starting value: \`t\` starts as \`undefined\`, and \`undefined + 1\` is \`NaN\`. The total needs a starting value of \`0\`.`,
    wrong: [
      {
        code: `function total(xs) {
  let t = '0';
  for (const x of xs) {
    t = t + x;
  }
  return Number(t);
}`,
        why: 'This silences the checker (it now returns a number) but keeps the bug: `Number(\'012\')` is `12`, not `3`. Making the error message go away is not the same as fixing the code.',
      },
      {
        code: `function total(xs) {
  let t;
  for (const x of xs) {
    t = t + x;
  }
  return t;
}`,
        why: '`let t;` starts as `undefined`, and `undefined + 1` is `NaN`. The total needs a starting value of `0`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `function mul(a: number, b: number): number`, what happens to the line `mul(\'3\', 4);` when you run `tsc`?',
    options: [
      { t: 'It reports that a string is not assignable to a parameter of type number', correct: true, why: 'The argument `\'3\'` breaks the label `a: number`, and the checker finds it without running anything.' },
      { t: 'Nothing: `\'3\' * 4` is 12, so it works', why: 'At runtime JavaScript would happily turn `\'3\'` into 3. But `tsc` checks the labels, not the arithmetic.' },
      { t: 'It converts `\'3\'` to the number 3 for you', why: 'TypeScript never changes your values; it only reports problems.' },
      { t: 'The program crashes when it reaches that line', why: 'Type errors are reported before the program runs, by a separate step.' },
    ],
  },
  {
    q: '`let total = 0;` has no annotation. What type does the checker give `total`?',
    options: [
      { t: 'None: unlabelled names are never checked', why: 'Where you give a starting value, TypeScript works out a type from it.' },
      { t: '`string`', why: '`0` without quotes is a number.' },
      { t: '`number`, inferred from the starting value `0`', correct: true, why: 'That is inference: assigning a string to `total` later would be reported.' },
    ],
  },
  {
    q: 'A program takes an hour to run, and has a type error on its last line. When does `tsc` report it?',
    options: [
      { t: 'After an hour, when the line is reached', why: 'The checker does not run the program at all.' },
      { t: 'Straight away: it reads the whole file before anything runs', correct: true, why: 'Type checking compares types line by line without running any code.' },
      { t: 'Never: only lines that run are checked', why: 'Every line is checked, including ones that would never run.' },
    ],
  },
  {
    q: 'What does `function isDigit(c: string): boolean` promise?',
    options: [
      { t: 'It takes a boolean and returns a string', why: 'The label after `c` is the parameter’s type; the one after the parentheses is the result’s.' },
      { t: 'It takes a string and returns `true` or `false`', correct: true, why: '`c: string` labels the parameter, and `: boolean` labels the return value.' },
      { t: 'It checks at run time that `c` is a string', why: 'Annotations are checked by `tsc` before running, not by the program while it runs.' },
    ],
  },
  {
    q: 'In Python, `def mul(a: int, b: int) -> int` is called as `mul(\'3\', 4)`. What happens when the program runs?',
    options: [
      { t: 'Python refuses to run the call', why: 'Python itself ignores type hints; only a separate checker such as mypy would complain.' },
      { t: 'It returns 12', why: 'Python does not turn `\'3\'` into a number for `*`.' },
      { t: 'It returns `\'3333\'`: the hints are not enforced, and `\'3\' * 4` repeats the string', correct: true, why: 'That is a real difference from Java, which refuses to compile a call like this.' },
    ],
  },
];
