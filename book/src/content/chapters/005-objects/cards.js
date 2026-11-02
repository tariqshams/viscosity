// Chapter 5 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'object-what': {
    q: 'What is an object made of?',
    a: 'Properties: each one is a key (a name) paired with a value. (Every object also has a hidden link to a prototype, met with classes.)',
  },
  'key-is-string': {
    q: 'In `{ x: 3 }`, what kind of value is the key `x`, and can the value be another object?',
    a: 'The key is a string (`\'x\'`); the value can be anything, another object included.',
  },
  'missing-prop': {
    q: 'What does reading a property that an object does not have give you?',
    a: '`undefined`, with no error.',
  },
  'add-prop': {
    q: '`const p = { x: 1 };` How do you add a property `y` with the value `2`?',
    a: '`p.y = 2;` (assigning to a new key adds it).',
  },
  'typo-nan': {
    q: 'In JavaScript, `p` has `x: 3` and `vx: 1`. Why is `p.x + p.vX` equal to `NaN` rather than an error?',
    a: '`vX` is a different key, so `p.vX` is `undefined` (reading a missing property is not an error), and `3 + undefined` is `NaN`.',
  },
  'dot-vs-bracket': {
    q: 'When do you need `obj[expr]` instead of `obj.name`?',
    a: 'When the key is worked out while the program runs (for example, held in a variable), or is not a valid name (such as `\'first name\'` or `\'2\'`).',
  },
  'p-dot-key': {
    q: '`const key = \'y\';` What is the difference between `p.key` and `p[key]`?',
    a: '`p.key` reads the property literally named “key”. `p[key]` reads the property named by the variable’s value, “y”.',
  },
  'bracket-space': {
    q: 'How do you read the property whose key is `\'first name\'` (with a space)?',
    a: 'With brackets: `o[\'first name\']`. A dot must be followed by a valid name, and a name cannot contain a space.',
  },
};

export const examples = {
  'objects-basics': {
    title: 'Pick a field by name',
    code: `function get(p, field) {
  return p[field];
}

const p = { x: 3, y: 4 };
console.log(get(p, 'x'));
console.log(get(p, 'y'));

p.color = 'red';
console.log(get(p, 'color'));
console.log(get(p, 'size'));

const field = 'y';
console.log(p.field);
console.log(p[field]);`,
  },
};

export const exercises = {
  sumFields: {
    title: 'Add up the named fields',
    prompt: 'Write `sumFields(p, ks)`. `p` is an object whose values are numbers, and `ks` is an array of key names (strings; `ks` is short for "keys"). Return the **total** of the properties those keys name. For example `sumFields({ a: 1, b: 2, c: 3 }, [\'a\', \'c\'])` is `4`. An empty `ks` array gives `0`.',
    starter: `function sumFields(p, ks) {
  // your code here
}

const p = { a: 1, b: 2, c: 3 };
console.log(sumFields(p, ['a', 'c']));`,
    solution: `function sumFields(p, ks) {
  let total = 0;
  for (let i = 0; i < ks.length; i++) {
    total = total + p[ks[i]];
  }
  return total;
}`,
    tests: `test('two of three fields', () => {
  const p = { a: 1, b: 2, c: 3 };
  expect(sumFields(p, ['a', 'c'])).toBe(4);
});
test('every field', () => {
  const p = { x: 3, y: 4, vx: 1 };
  expect(sumFields(p, ['x', 'y', 'vx'])).toBe(8);
});
test('no ks gives 0', () => {
  expect(sumFields({ a: 5 }, [])).toBe(0);
});
test('a key with a space', () => {
  const p = { 'unit cost': 7, qty: 2 };
  expect(sumFields(p, ['unit cost'])).toBe(7);
});`,
    hints: [
      'You do not know the key names when you write the code; they arrive in an array. Which kind of access works with a name held in a variable?',
      'Loop over `ks` with the loop from *Visiting every slot*, keeping a `total` that starts at 0. In each pass, `ks[i]` is one key name, a string.',
      'Inside the loop, read the property with brackets: `p[ks[i]]`, and add it to the total. Return the total after the loop.',
    ],
    walkthrough: `**How to think about it.** Work one example by hand: for \`p = { a: 1, b: 2, c: 3 }\` and \`ks = ['a', 'c']\`, you look up \`'a'\` (1), then \`'c'\` (3), and add them to get 4. So the job is "for each key in the array, read that property and add it to a total": an accumulator loop from *Visiting every slot*, over \`ks\` rather than over \`p\`. The one decision is *how* to read the property. You cannot write \`p.a\`, because the names are not known until the function is called; they are strings sitting in an array, which is exactly the case brackets are for.

**The solution, line by line.**

- \`function sumFields(p, ks) {\` takes the object and the array of key names.
- \`  let total = 0;\` starts the running total at nothing. It is also the answer if \`ks\` is empty, because the loop will not run at all.
- \`  for (let i = 0; i < ks.length; i++) {\` visits every key name once.
- \`    total = total + p[ks[i]];\` is read from the inside out: \`ks[i]\` is the key name in slot \`i\` (the string \`'a'\` on the first pass), then \`p[...]\` looks up the property with that name (1), and that value is added to the total. On the example the total goes 1, then 4.
- \`  }\` ends the loop.
- \`  return total;\` hands back the finished total.
- \`}\` closes the body.

The last test uses the key \`'unit cost'\`, with a space in it. Brackets do not care, since they look up whatever string they are given.

**Common wrong attempts.**

- \`const k = ks[i]; total = total + p.k;\` is this chapter's classic bug: \`p.k\` asks for a property literally named \`k\`, there is none, so it gives \`undefined\` and the total becomes \`NaN\`. Write \`p[k]\`.
- \`total = total + ks[i];\` adds the key *names*, not the values, and since they are strings, \`+\` glues them together: \`0 + 'a'\` is \`'0a'\`.
- \`p.ks[i]\` asks \`p\` for a property called \`ks\`, which is \`undefined\`, and then asks \`undefined\` for slot \`i\`, which stops the program with a TypeError.`,
    wrong: [
      {
        code: `function sumFields(p, ks) {
  let total = 0;
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    total = total + p.k;
  }
  return total;
}`,
        why: '`p.k` reads the property literally named “k”, which is `undefined`, so the total becomes `NaN`. Use `p[k]` to look up the name the variable holds.',
      },
      {
        code: `function sumFields(p, ks) {
  let total = 0;
  for (let i = 0; i < ks.length; i++) {
    total = total + ks[i];
  }
  return total;
}`,
        why: 'This adds the key names, not the values they name, and `0 + \'a\'` glues them into the string `\'0a\'`. Read the property: `p[ks[i]]`.',
      },
    ],
  },
  pick: {
    optional: true,
    title: 'Keep only some properties',
    prompt: 'Write `pick(p, ks)` that returns a **new** object holding only the properties of `p` named in the array `ks`, with the same values. For example `pick({ x: 3, y: 4, vx: 1 }, [\'x\', \'vx\'])` returns `{ x: 3, vx: 1 }`.',
    starter: `function pick(p, ks) {
  // your code here
}

const p = { x: 3, y: 4, vx: 1 };
console.log(pick(p, ['x', 'vx']));`,
    solution: `function pick(p, ks) {
  const out = {};
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    out[k] = p[k];
  }
  return out;
}`,
    tests: `test('keeps two of three', () => {
  const p = { x: 3, y: 4, vx: 1 };
  expect(pick(p, ['x', 'vx'])).toEqual({ x: 3, vx: 1 });
});
test('no ks gives an empty object', () => {
  expect(pick({ x: 3 }, [])).toEqual({});
});
test('works for any names', () => {
  const t = { type: 'num', text: '42', line: 3 };
  expect(pick(t, ['text'])).toEqual({ text: '42' });
});`,
    hints: [
      'Start with an empty object, `{}`, and add one property to it per key.',
      'Adding a property is writing to it. When the name is in a variable, write with brackets: `out[k] = ...`.',
      'In the loop: `const k = ks[i]; out[k] = p[k];`. Return `out` after the loop.',
    ],
    walkthrough: `**How to think about it.** You are building an object whose property names you do not know in advance, so you cannot write it out with curly braces. Instead, start empty and add properties one at a time, the way *Arrays* built an array with \`push\`. Writing to a property that does not exist adds it, and brackets let the name come from a variable, on the left of \`=\` as well as on the right.

**The solution, line by line.**

- \`function pick(p, ks) {\` takes the original object and the names to keep.
- \`  const out = {};\` makes the new, empty object we will fill.
- \`  for (let i = 0; i < ks.length; i++) {\` visits each name.
- \`    const k = ks[i];\` gives the current name a short label, say \`'x'\`.
- \`    out[k] = p[k];\` reads property \`k\` of \`p\` (3) and writes it into property \`k\` of \`out\`, which adds it. Both sides use brackets, because both names are held in \`k\`.
- \`  }\` ends the loop, and \`  return out;\` hands back the new object.

**Common wrong attempts.**

- \`out.k = p[k];\` writes a property literally called \`k\` every time, so the result is \`{ k: 1 }\` (the last value) instead of \`{ x: 3, vx: 1 }\`.
- Deleting the unwanted properties from \`p\` itself changes the caller's object; the exercise asks for a new one, and *References* shows why changing the original can surprise whoever else is using it.`,
    wrong: [
      {
        code: `function pick(p, ks) {
  const out = {};
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    out.k = p[k];
  }
  return out;
}`,
        why: '`out.k` writes a property literally named “k” on every pass, so the result is `{ k: ... }`. Use `out[k]` so the name comes from the variable.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const p = { x: 1, y: 2 };` What is `p.z`?',
    options: [
      {
        t: 'An error',
        why: 'Reading a missing property is not an error in JavaScript (Python’s dictionaries would stop with a `KeyError`).',
      },
      {
        t: '`0`',
        why: 'Missing properties are not zero.',
      },
      {
        t: '`undefined`',
        correct: true,
        why: 'There is no property `z`, so you get `undefined`.',
      },
      {
        t: '`null`',
        why: 'JavaScript gives `undefined`, not `null`, for missing properties.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const p = { a: 1, b: 2 };
const k = 'b';
console.log(p[k]);
\`\`\``,
    options: [
      {
        t: '`2`',
        correct: true,
        why: '`k` holds the string `\'b\'`, so `p[k]` is `p.b`.',
      },
      {
        t: '`undefined`',
        why: 'That would be `p.k`, the property literally named “k”.',
      },
      {
        t: '`1`',
        why: 'That is `p.a`.',
      },
      {
        t: '`\'b\'`',
        why: 'That is the key, not the value stored under it.',
      },
    ],
  },
  {
    q: 'Which line is a common bug when the key is held in a variable `key`?',
    options: [
      {
        t: '`obj[key]`',
        why: 'That is the correct way: it looks up the key stored in the variable.',
      },
      {
        t: '`obj.key`',
        correct: true,
        why: 'This reads the property literally named “key”, ignoring the variable.',
      },
      {
        t: '`obj[\'x\']`',
        why: 'That is fine; it means the same as `obj.x`.',
      },
      {
        t: '`obj.x`',
        why: 'That is fine when the key is known in advance.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const p = { x: 1 };
p.x = 5;
p.y = p.x + 1;
console.log(p);
\`\`\``,
    options: [
      {
        t: '`{ x: 1 }`',
        why: 'Line 2 changed `x` and line 3 added `y`; an object can change after it is made, even under `const`.',
      },
      {
        t: '`{ x: 5, y: 6 }`',
        correct: true,
        why: '`x` was changed to 5, then a new property `y` was added holding `5 + 1`.',
      },
      {
        t: '`{ x: 5 }`',
        why: 'Assigning to a key that is not there adds it, so `y` now exists.',
      },
      {
        t: 'An error, because `y` does not exist yet',
        why: 'Writing to a missing property creates it; reading a property of `undefined` (or `null`) is what is an error.',
      },
    ],
  },
  {
    q: '`const p = { x: 3, vx: 1 };` What is `p.x + p.vX` (capital X)?',
    options: [
      {
        t: '`4`',
        why: 'Keys are exact strings: `vX` and `vx` are different keys, so `p.vX` is not 1.',
      },
      {
        t: 'A TypeError',
        why: 'Reading a missing property of an object is not an error; reading a property of `undefined` (or `null`) itself is.',
      },
      {
        t: '`3`',
        why: '`p.vX` is `undefined`, and adding `undefined` to a number does not leave the number alone.',
      },
      {
        t: '`NaN`',
        correct: true,
        why: '`p.vX` is `undefined`, and `3 + undefined` is `NaN` (“not a number”), with no warning.',
      },
    ],
  },
  {
    q: 'Why do engines like V8 give many objects a shared hidden “shape”?',
    options: [
      {
        t: 'To save the text of the source code',
        why: 'Shapes describe objects’ properties, not source text.',
      },
      {
        t: 'So a property like `x` can be found without searching by name every time',
        correct: true,
        why: 'Objects with the same properties in the same order share a shape, so the engine knows where `x` lives.',
      },
      {
        t: 'To stop properties from being added',
        why: 'You can still add properties; the object just moves to a new shape.',
      },
      {
        t: 'Because JavaScript requires classes',
        why: 'Plain object literals get shapes too.',
      },
    ],
  },
];
