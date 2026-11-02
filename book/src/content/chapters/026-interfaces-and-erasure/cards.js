// Chapter 26 cards (split from chapter 25). Keys are stable ids:
// never rename them.
//
// The in-page runner erases TypeScript types (sucrase) and never checks
// them, and scripts/check_chapters.mjs runs code as plain JavaScript. So
// every example, solution and wrong attempt here is valid JavaScript, the
// exercises set lang: 'ts' so readers may add annotations, and the typed
// version of each solution is shown in its walkthrough.

export const prompts = {
  'interface-what': {
    q: 'What does an interface describe?',
    a: 'The shape of an object: which properties it must have and the type of each one.',
  },
  'interface-typo': {
    q: '`p` is labelled `Particle`, which has a `vx` property. What happens when code reads `p.vX`?',
    a: 'The checker reports that `vX` does not exist on `Particle` (and suggests `vx`), before the program runs.',
  },
  'any-shape': {
    q: 'Does an object need to be made by a class, or in a special way, to fit an interface?',
    a: 'No. Any object with the right properties, of the right types, fits; only the shape matters.',
  },
  'erasure-what': {
    q: 'What is type erasure?',
    a: 'Removing every type annotation and interface before the code runs, leaving plain JavaScript.',
  },
  'emit-with-errors': {
    q: 'By default, if `tsc` finds a type error, does it still write the JavaScript file?',
    a: 'Yes. It reports the error and still emits JavaScript, unless you pass `--noEmitOnError`.',
  },
  'runtime-unchanged': {
    q: 'Can adding a type annotation change what a program prints? Why?',
    a: 'No. Annotations are erased before the program runs, so the engine runs the same JavaScript either way.',
  },
  'outside-data': {
    q: 'Why does a TypeScript program still need run-time checks on JSON it receives?',
    a: 'The checker only saw your code, never that data. Nothing checks the data unless you write the check.',
  },
  'any-off': {
    q: 'What does the type `any` do to checking?',
    a: 'It switches checking off for that value: the checker accepts anything you do with it.',
  },
  'typeof-null': {
    q: 'What is `typeof null`, and why does it matter when checking data?',
    a: '`\'object\'`, an old quirk. A check for “is an object” must also reject `null` separately.',
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
      'Turn the interface into questions you can ask while the program runs: is `v` an object? Is each of the four properties a number? Which question must come first, and why?',
      'Reject anything that isn’t an object first: `typeof v !== \'object\'`. Then reject `null` separately, because `typeof null` is `\'object\'`.',
      'Put the four property names in an array and loop over it with `for (const k of keys)`.',
      'Inside the loop, `v[k]` reads the property named by `k` (bracket access). If `typeof v[k] !== \'number\'`, return `false`. If the loop finishes, return `true`.',
    ],
    walkthrough: `**How to think about it.** This is the check that types cannot do for you, because they are gone by the time the data arrives. So turn the interface into questions you can ask a value while the program runs. "Is it a Particle?" becomes: is it an object at all, and not \`null\`? And for each of \`x\`, \`y\`, \`vx\` and \`vy\`: is that property a number? \`typeof\` answers every one of those questions. The order matters, though: you must know \`v\` is a real object before you read properties from it, because reading a property of \`null\` throws.

**The solution, line by line.**

- \`function isParticle(v) {\` takes any value at all (in TypeScript, \`v: any\`, because we do not know what arrived).
- \`  if (typeof v !== 'object') {\` rejects anything that is not an object: \`typeof 5\` is \`'number'\`, \`typeof 'hi'\` is \`'string'\`.
- \`    return false;\` answers at once for those.
- \`  }\` ends that check.
- \`  if (v === null) {\` handles JavaScript's oldest quirk: \`typeof null\` is \`'object'\`, so \`null\` got past the first check.
- \`    return false;\` rejects it before we try to read \`null['x']\`, which would throw a \`TypeError\`.
- \`  }\` ends that check.
- \`  const keys = ['x', 'y', 'vx', 'vy'];\` lists the properties the interface asks for.
- \`  for (const k of keys) {\` visits each name.
- \`    if (typeof v[k] !== 'number') {\` reads the property named by \`k\` with bracket access (the name is in a variable, so \`v.k\` would look for a property literally called \`k\`). A *missing* property reads as \`undefined\`, whose \`typeof\` is \`'undefined'\`, so this one test catches both "missing" and "wrong kind".
- \`      return false;\` one bad property is enough.
- \`    }\` and \`  }\` close the check and the loop.
- \`  return true;\` is reached only if all four were numbers. Extra properties were never asked about, so they pass, just as with an interface.
- \`}\` closes the function.

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

Next chapter you will see how checks like \`typeof v === 'object'\` teach the checker something: inside the \`if\`, it knows more about \`v\` than it did before.

**Common wrong attempts.**

- \`return v instanceof Particle;\`: \`Particle\` is an interface, and interfaces are erased, so at run time there is nothing called \`Particle\` and this throws a \`ReferenceError\` (\`tsc\` says "'Particle' only refers to a type, but is being used as a value here.").
- Forgetting the \`null\` check: \`null\` passes the \`typeof\` test, and the loop then throws on \`null['x']\`.
- Checking that the properties *exist* (\`v.x !== undefined\`) rather than that they are numbers: \`{ x: '0', ... }\` then passes.
`,
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
  sumNumbers: {
    optional: true,
    lang: 'ts',
    title: 'Add up only the numbers',
    prompt:
      'Data from outside often mixes kinds. Write `sumNumbers(xs)`: given an array of any values, return the sum of the ones that are numbers, skipping everything else (strings like `\'3\'` included). For an array with no numbers, return `0`.',
    starter: `function sumNumbers(xs: any[]): number {
  // your code here
}

console.log(sumNumbers([1, '2', 3]));`,
    solution: `function sumNumbers(xs) {
  let t = 0;
  for (const x of xs) {
    if (typeof x === 'number') {
      t = t + x;
    }
  }
  return t;
}`,
    tests: `test('numbers only', () => {
  expect(sumNumbers([1, 2, 3])).toBe(6);
});
test('skips strings, even digit ones', () => {
  expect(sumNumbers([1, '2', 3])).toBe(4);
});
test('skips null and objects', () => {
  expect(sumNumbers([null, { x: 1 }, 5])).toBe(5);
});
test('no numbers gives 0', () => {
  expect(sumNumbers(['a', true])).toBe(0);
});`,
    hints: [
      'Start a total at `0` and visit every value. For each one, decide: add it, or skip it?',
      'The deciding question is “is this a number?”, which `typeof` answers while the program runs.',
      'Inside the loop: `if (typeof x === \'number\') { t = t + x; }`. Return `t` after the loop.',
    ],
    walkthrough: `**How to think about it.** The array's label, \`any[]\`, admits that we do not know what is in it, so the checker cannot help; the question "is this one a number?" has to be asked of each value while the program runs, and \`typeof\` is the tool for that. Everything else is the familiar running total.

**The solution, line by line.**

- \`function sumNumbers(xs) {\` takes the array (typed: \`xs: any[]\`, returning \`number\`).
- \`  let t = 0;\` starts the total at the number zero, which is also the right answer when nothing is added.
- \`  for (const x of xs) {\` visits each value.
- \`    if (typeof x === 'number') {\` is true only for real numbers: \`typeof '2'\` is \`'string'\`, \`typeof null\` is \`'object'\`, \`typeof true\` is \`'boolean'\`.
- \`      t = t + x;\` adds it.
- \`    }\` and \`  }\` close the check and the loop.
- \`  return t;\` returns the total.
- \`}\` closes the function.

**Common wrong attempts.**

- Adding everything: \`1 + '2'\` is the string \`'12'\`, and from then on every \`+\` joins text, so the answer is a string.
- Checking \`x !== null\` or \`x !== undefined\` instead of the kind: strings and objects still get through.`,
    wrong: [
      {
        code: `function sumNumbers(xs) {
  let t = 0;
  for (const x of xs) {
    t = t + x;
  }
  return t;
}`,
        why: 'This adds everything: `1 + \'2\'` is the string `\'12\'`, so the result becomes text. Check `typeof x === \'number\'` first.',
      },
      {
        code: `function sumNumbers(xs) {
  let t = 0;
  for (const x of xs) {
    if (x !== null) {
      t = t + x;
    }
  }
  return t;
}`,
        why: 'Rejecting `null` is not enough: strings and objects still get added. Ask `typeof` for the kind you want.',
      },
    ],
  },
};

export const quiz = [
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
    q: 'With a modern target setting, what does `tsc` output for the line `let n: number = 3;`?',
    options: [
      { t: '`let n: number = 3;` unchanged', why: 'Engines can’t run type syntax, so `tsc` must remove it.' },
      { t: '`let n = Number(3);`', why: 'Erasure deletes annotations; it doesn’t add conversions.' },
      { t: 'A run-time check that `n` is a number', why: 'TypeScript doesn’t insert run-time checks. All checking happens before the program runs.' },
      { t: '`let n = 3;`', correct: true, why: 'The annotation is erased and nothing else changes. (With no settings at all, `tsc` would also turn `let` into `var` for old engines, a separate job.)' },
    ],
  },
  {
    q: 'You run plain `tsc file.ts` (no flags) and it reports a type error. What about the JavaScript file?',
    options: [
      { t: 'No JavaScript is written until you fix the error', why: 'That only happens with the `--noEmitOnError` flag.' },
      { t: 'The JavaScript is written with the bad line deleted', why: '`tsc` never deletes your code; it only erases types.' },
      { t: 'The JavaScript is still written, because `tsc` emits even when it finds errors', correct: true, why: 'By default `tsc` reports the error and still emits. Use `--noEmitOnError` to stop that.' },
      { t: 'The JavaScript is written with a crash inserted at that line', why: 'TypeScript adds no run-time code for type errors.' },
    ],
  },
  {
    q: '`const p: Particle = JSON.parse(text);` type-checks fine. Why can `p.x` still be a string at run time?',
    options: [
      { t: 'It can’t: the label guarantees `p.x` is a number', why: 'Labels are promises about code. The checker never saw the text, and `JSON.parse` returns `any`, so nothing was checked.' },
      { t: 'Because `JSON.parse` turns every number into a string', why: '`JSON.parse` keeps numbers as numbers. The problem is that the text itself might contain a string.' },
      { t: 'The data came from outside the program, the checker never saw it, and types are erased before it arrives', correct: true, why: 'Only a run-time check, like `isParticle`, can inspect data that arrives while the program runs.' },
      { t: 'Because interfaces only work on classes', why: 'Interfaces describe any object with the right shape.' },
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
