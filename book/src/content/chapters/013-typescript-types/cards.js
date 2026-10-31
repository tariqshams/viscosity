// Chapter 13 cards. Keys are stable ids: never rename them.
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
  'annotation-syntax': {
    q: 'In `function f(n: number): string`, what do the two annotations label?',
    a: '`n: number` says the parameter holds a number; the `: string` after the parentheses says `f` returns a string.',
  },
  inference: {
    q: '`let n = 3;` then `n = \'three\';` with no annotation anywhere. Does TypeScript complain? Why?',
    a: 'Yes. It infers the type `number` from `3`, so assigning a string breaks that label.',
  },
  'interface-what': {
    q: 'What does an interface describe?',
    a: 'The shape of an object: which properties it must have and the type of each one.',
  },
  'interface-typo': {
    q: '`p` is labelled `Particle`, which has a `vx` property. What happens when code reads `p.vX`?',
    a: 'The checker reports that `vX` does not exist on `Particle` (and suggests `vx`), before the program runs.',
  },
  'checker-when': {
    q: 'Does the type checker find mistakes before the program runs, or while it runs?',
    a: 'Before. It reads the whole program without running any of it.',
  },
  'emit-with-errors': {
    q: 'By default, if `tsc` finds a type error, does it still write the JavaScript file?',
    a: 'Yes. It reports the error and still emits JavaScript, unless you pass `--noEmitOnError`.',
  },
  'erasure-what': {
    q: 'What is type erasure?',
    a: 'Removing every type annotation and interface before the code runs, leaving plain JavaScript.',
  },
  'runtime-unchanged': {
    q: 'Can adding a type annotation change what a program prints? Why?',
    a: 'No. Annotations are erased before the program runs, so the engine runs the same JavaScript either way.',
  },
  'runner-checks': {
    q: 'Does this book’s runnable box report TypeScript type errors?',
    a: 'No. It erases the types and runs the rest. Only `tsc` checks types.',
  },
  'outside-data': {
    q: 'Why does a TypeScript program still need runtime checks on JSON it receives?',
    a: 'The checker only saw your code, never that data. Nothing checks the data unless you write the check.',
  },
  'any-off': {
    q: 'What does the type `any` do to checking?',
    a: 'It switches checking off for that value: the checker accepts anything you do with it.',
  },
};

export const examples = {
  erased: {
    title: 'What erasure leaves behind',
    lang: 'ts',
    code: `// The runner erases types and runs
// what is left. It never checks them.
function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
console.log(add('2', 3));

// Try: write a: number and b: number,
// then run again. Same output! tsc
// would flag add('2', 3) instead.`,
  },
};

export const exercises = {
  isParticle: {
    lang: 'ts',
    title: 'Check a particle at runtime',
    prompt:
      'Types are erased, so data from outside the program is never checked for you. Write `isParticle(v)` that returns `true` only when `v` is an object (not `null`) whose `x`, `y`, `vx` and `vy` properties are all numbers, and `false` otherwise. Extra properties are fine. (The runner erases types, so the tests check behaviour. The walkthrough shows the typed version.)',
    starter: `interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function isParticle(v: any): boolean {
  // your code here
}

const ok = { x: 0, y: 0, vx: 1, vy: 1 };
console.log(isParticle(ok));`,
    solution: `function isParticle(v) {
  if (typeof v !== 'object') {
    return false;
  }
  if (v === null) {
    return false;
  }
  const keys = ['x', 'y', 'vx', 'vy'];
  for (const k of keys) {
    if (typeof v[k] !== 'number') {
      return false;
    }
  }
  return true;
}`,
    tests: `test('a real particle', () => {
  const p = { x: 0, y: 0, vx: 1, vy: 1 };
  expect(isParticle(p)).toBe(true);
});
test('extra properties are fine', () => {
  const p = { x: 1, y: 2, vx: 3, vy: 4, id: 7 };
  expect(isParticle(p)).toBe(true);
});
test('a missing property', () => {
  expect(isParticle({ x: 0, y: 0, vx: 1 })).toBe(false);
});
test('a number written as a string', () => {
  const p = { x: '0', y: 0, vx: 1, vy: 1 };
  expect(isParticle(p)).toBe(false);
});
test('null is not a particle', () => {
  expect(isParticle(null)).toBe(false);
});
test('a plain number is not a particle', () => {
  expect(isParticle(5)).toBe(false);
});`,
    hints: [
      'Start by rejecting anything that isn’t an object: `typeof v !== \'object\'`. Then reject `null` separately, because `typeof null` is `\'object\'`.',
      'Put the four property names in an array and loop over it with `for (const k of keys)`.',
      'Inside the loop, `v[k]` reads the property named by `k` (bracket access). If `typeof v[k] !== \'number\'`, return `false`. If the loop finishes, return `true`.',
    ],
    walkthrough: `This is the check that types can’t do for you, because they’re gone by the time data arrives.

- **Is it an object at all?** \`typeof 5\` is \`'number'\`, so a plain number is rejected first.
- **Reject \`null\` separately.** JavaScript’s oldest quirk: \`typeof null\` is \`'object'\`. Without this line, the loop would try \`null['x']\` and throw.
- **Check every field.** Loop over the four names and use bracket access, \`v[k]\`, because the name is in a variable. A missing property reads as \`undefined\`, whose \`typeof\` is \`'undefined'\`, so one test covers “missing” and “wrong kind”.
- **Extra properties pass.** Like an interface, we only ask for the properties we need.

With the types written in, the function looks like this:

\`\`\`ts
function isParticle(v: any): boolean {
  if (typeof v !== 'object') return false;
  if (v === null) return false;
  const keys = ['x', 'y', 'vx', 'vy'];
  for (const k of keys) {
    if (typeof v[k] !== 'number') {
      return false;
    }
  }
  return true;
}
\`\`\`

Next chapter you’ll see how checks like \`typeof v === 'object'\` teach the checker something: inside the \`if\`, it knows more about \`v\` than it did before.`,
    wrong: [
      {
        code: `function isParticle(v) {
  return v instanceof Particle;
}`,
        why: '`Particle` is an interface, and interfaces are erased: at runtime there is nothing called `Particle`, so this throws a `ReferenceError`. `tsc` would say “`Particle` only refers to a type, but is being used as a value here.”',
      },
      {
        code: `function isParticle(v) {
  if (typeof v !== 'object') {
    return false;
  }
  const keys = ['x', 'y', 'vx', 'vy'];
  for (const k of keys) {
    if (typeof v[k] !== 'number') {
      return false;
    }
  }
  return true;
}`,
        why: 'Almost. But `typeof null` is `\'object\'`, so `null` gets past the first check and `null[\'x\']` throws a `TypeError`. Reject `null` explicitly.',
      },
      {
        code: `function isParticle(v) {
  if (typeof v !== 'object') {
    return false;
  }
  if (v === null) {
    return false;
  }
  return v.x !== undefined &&
    v.y !== undefined &&
    v.vx !== undefined &&
    v.vy !== undefined;
}`,
        why: 'This checks that the properties *exist*, not that they hold numbers, so `{ x: \'0\', ... }` passes. Check `typeof v.x === \'number\'` instead.',
      },
    ],
  },
  fixTotal: {
    optional: true,
    lang: 'ts',
    title: 'The bug tsc would have caught',
    prompt:
      '`tsc` rejects this function with “Type \'string\' is not assignable to type \'number\'” on the `return` line. Run it first to see what goes wrong at runtime, then fix it so `totalX(ms)` returns the sum of the `x` values, and `0` for an empty list.',
    starter: `interface Mover {
  x: number;
  vx: number;
}

function totalX(ms: Mover[]): number {
  let t = '0';
  for (const m of ms) {
    t = t + m.x;
  }
  return t;
}

const ms = [
  { x: 1, vx: 0 },
  { x: 2, vx: 0 },
];
console.log(totalX(ms));`,
    solution: `function totalX(ms) {
  let t = 0;
  for (const m of ms) {
    t = t + m.x;
  }
  return t;
}`,
    tests: `test('adds the x values', () => {
  const ms = [{ x: 1, vx: 0 }, { x: 2, vx: 0 }];
  expect(totalX(ms)).toBe(3);
});
test('an empty list totals 0', () => {
  expect(totalX([])).toBe(0);
});
test('works with decimals', () => {
  const ms = [{ x: 0.5, vx: 9 }, { x: 1.5, vx: 9 }];
  expect(totalX(ms)).toBe(2);
});`,
    hints: [
      'Run the starter. It prints `012`, not `3`. Where did a string come from?',
      '`let t = \'0\'` makes `t` a string, so `+` joins text instead of adding. TypeScript infers `t: string`, and the `: number` return label is what exposes it.',
      'Start the total at the number `0`, not the string `\'0\'`.',
    ],
    walkthrough: `The whole bug is two quote marks.

- \`let t = '0'\` starts the total as a **string**. TypeScript infers the label \`string\` for \`t\`.
- \`t + m.x\` with a string on the left is *joining*, not adding: \`'0' + 1\` is \`'01'\`, then \`'012'\`.
- The function promises \`: number\`, and \`return t\` returns a string. That broken promise is exactly the error \`tsc\` reports. In plain JavaScript there is no promise, so nothing complains.

The fix is \`let t = 0;\`. The typed version:

\`\`\`ts
function totalX(ms: Mover[]): number {
  let t = 0;
  for (const m of ms) {
    t = t + m.x;
  }
  return t;
}
\`\`\`

Notice that the label on the *return* is what caught a mistake made three lines earlier. Labelling what a function returns is cheap, and it catches a lot.`,
    wrong: [
      {
        code: `function totalX(ms) {
  let t = '0';
  for (const m of ms) {
    t = t + m.x;
  }
  return Number(t);
}`,
        why: 'This silences the checker (it now returns a number) but keeps the bug: `Number(\'012\')` is `12`, not `3`. Making the error message go away is not the same as fixing the code.',
      },
      {
        code: `function totalX(ms) {
  let t;
  for (const m of ms) {
    t = t + m.x;
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
      { t: 'The program crashes when it reaches that line', why: 'Type errors are reported before the program runs, and the erased JavaScript wouldn’t crash anyway.' },
    ],
  },
  {
    q: 'What does `tsc` output for the line `let n: number = 3;`?',
    options: [
      { t: '`let n: number = 3;` unchanged', why: 'Engines can’t run type syntax, so `tsc` must remove it.' },
      { t: '`let n = Number(3);`', why: 'Erasure deletes annotations; it doesn’t add conversions.' },
      { t: 'A runtime check that `n` is a number', why: 'TypeScript doesn’t insert runtime checks. All checking happens before the program runs.' },
      { t: '`let n = 3;`', correct: true, why: 'The annotation is erased and nothing else changes.' },
    ],
  },
  {
    q: 'Which object fits `interface Point { x: number; y: number }`?',
    options: [
      { t: '`{ x: 1 }`', why: 'It is missing `y`, so the checker reports “Property \'y\' is missing”.' },
      { t: '`{ x: 1, y: 2 }`', correct: true, why: 'Both properties are present and both are numbers.' },
      { t: '`{ x: \'1\', y: 2 }`', why: '`x` holds a string, but the interface says `x: number`.' },
      { t: '`{ X: 1, Y: 2 }`', why: 'Property names are case-sensitive: `X` is not `x`.' },
    ],
  },
  {
    q: 'You run plain `tsc file.ts` (no flags) and it reports a type error. What about the JavaScript file?',
    options: [
      { t: 'No JavaScript is written until you fix the error', why: 'That only happens with the `--noEmitOnError` flag.' },
      { t: 'The JavaScript is written with the bad line deleted', why: '`tsc` never deletes your code; it only erases types.' },
      { t: 'The JavaScript is still written, because `tsc` emits even when it finds errors', correct: true, why: 'By default `tsc` reports the error and still emits. Use `--noEmitOnError` to stop that.' },
      { t: 'The JavaScript is written with a crash inserted at that line', why: 'TypeScript adds no runtime code for type errors.' },
    ],
  },
  {
    q: '`const p: Particle = JSON.parse(text);` type-checks fine. Why can `p.x` still be a string at runtime?',
    options: [
      { t: 'It can’t: the label guarantees `p.x` is a number', why: 'Labels are promises about code. The checker never saw the text, and `JSON.parse` returns `any`, so nothing was checked.' },
      { t: 'Because `JSON.parse` turns every number into a string', why: '`JSON.parse` keeps numbers as numbers. The problem is that the text itself might contain a string.' },
      { t: 'Because interfaces only work on classes', why: 'Interfaces describe any object with the right shape.' },
      { t: 'The data came from outside the program, the checker never saw it, and types are erased before it arrives', correct: true, why: 'Only a runtime check, like `isParticle`, can inspect data that arrives while the program runs.' },
    ],
  },
  {
    q: 'Why can’t V8 use your TypeScript interfaces to speed up your program?',
    options: [
      { t: 'V8 ignores interfaces on purpose because they are often wrong', why: 'V8 never gets the chance to ignore them: they are gone before it sees the code.' },
      { t: 'They have been erased: V8 only ever receives plain JavaScript', correct: true, why: 'Erasure happens before the engine runs anything, so the engine works out object shapes for itself as the program runs.' },
      { t: 'Interfaces are only for strings', why: 'Interfaces describe object shapes of any kind.' },
      { t: 'It does use them, as long as you run `tsc` first', why: 'Running `tsc` is exactly what removes them.' },
    ],
  },
];
