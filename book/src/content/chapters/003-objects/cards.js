// Chapter 3 cards. Keys are stable ids: never rename them.

export const prompts = {
  'object-what': {
    q: 'What is an object made of?',
    a: 'Properties: each one is a key (a name) paired with a value.',
  },
  'missing-prop': {
    q: 'What does reading a property that doesn’t exist give you?',
    a: '`undefined`.',
  },
  'add-prop': {
    q: '`const p = { x: 1 };` How do you add a property `y` with the value `2`?',
    a: '`p.y = 2;` (assigning to a new key adds it).',
  },
  'dot-vs-bracket': {
    q: 'When do you need `obj[expr]` instead of `obj.name`?',
    a: 'When the key is computed at run time, for example held in a variable.',
  },
  'p-dot-key': {
    q: '`const key = \'y\';` What is the difference between `p.key` and `p[key]`?',
    a: '`p.key` reads the property literally named “key”. `p[key]` reads the property named by the variable’s value, “y”.',
  },
  'aos-what': {
    q: 'What does AoS (array of structs) mean?',
    a: 'An array whose slots each hold a whole record (an object with all its fields together).',
  },
  'soa-what': {
    q: 'What does SoA (struct of arrays) mean?',
    a: 'One array per property: all the `x` values together, all the `y` values together, and so on.',
  },
  'particles-i-x': {
    q: 'In an array of particle objects, how do you read the `x` of particle number 4?',
    a: '`particles[4].x`',
  },
};

export const examples = {
  'objects-basics': {
    title: 'Dots and brackets',
    code: `const p = { x: 3, y: 4 };
p.x = 10;
p.color = 'red';
console.log(p);

const key = 'y';
console.log(p[key]);
console.log(p.key);
console.log(p.size);`,
  },
};

export const exercises = {
  centerX: {
    title: 'The average x position',
    prompt:
      'Write `centerX(ps)` that returns the **average** of the `x` properties of all the particle objects in the array `ps`. You can assume the array is not empty.',
    starter: `function centerX(ps) {
  // your code here
}

const ps = [
  { x: 2 },
  { x: 4 },
  { x: 9 },
];
console.log(centerX(ps));`,
    solution: `function centerX(ps) {
  let total = 0;
  for (let i = 0; i < ps.length; i++) {
    total = total + ps[i].x;
  }
  return total / ps.length;
}`,
    tests: `test('three particles', () => {
  const ps = [{ x: 2 }, { x: 4 }, { x: 9 }];
  expect(centerX(ps)).toBe(5);
});
test('ignores other properties', () => {
  const ps = [{ x: 1, y: 100 }, { x: 3, y: -7 }];
  expect(centerX(ps)).toBe(2);
});
test('a single particle', () => {
  expect(centerX([{ x: -4 }])).toBe(-4);
});`,
    hints: [
      'It’s the `sum` loop from chapter 2, but each slot is an object.',
      'Add up `ps[i].x`, not `ps[i]`.',
      'Divide the total by how many particles there are: `ps.length`.',
    ],
    walkthrough: `Two ideas from two chapters, combined:

- **The accumulator loop** from chapter 2: \`let total = 0\`, visit every slot, add.
- **Dot access** from this chapter: each slot holds an object, so the number we want is \`ps[i].x\`.

Then divide by \`ps.length\` *after* the loop. Notice the loop only reads one property out of every object, even though each object may carry many more. Keep that in mind: it’s exactly the kind of loop SoA makes faster.`,
    wrong: [
      {
        code: `function centerX(ps) {
  let total = 0;
  for (let i = 0; i < ps.length; i++) {
    total = total + ps[i];
  }
  return total / ps.length;
}`,
        why: '`ps[i]` is a whole object, not a number. Adding an object to a number gives a string like `"0[object Object]"`, and the result is `NaN`. Read the property: `ps[i].x`.',
      },
    ],
  },
  step: {
    optional: true,
    title: 'Move every particle',
    prompt:
      'Write `step(ps)` that moves every particle by its velocity: `x` grows by `vx`, and `y` grows by `vy`. Change the objects themselves; the function doesn’t need to return anything.',
    starter: `function step(ps) {
  // your code here
}

const ps = [
  { x: 0, y: 0, vx: 1, vy: 2 },
];
step(ps);
console.log(ps[0]);`,
    solution: `function step(ps) {
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    p.x = p.x + p.vx;
    p.y = p.y + p.vy;
  }
}`,
    tests: `test('moves one particle', () => {
  const ps = [{ x: 0, y: 0, vx: 1, vy: 2 }];
  step(ps);
  expect(ps[0]).toEqual({ x: 1, y: 2, vx: 1, vy: 2 });
});
test('moves every particle', () => {
  const ps = [
    { x: 5, y: 5, vx: -1, vy: 0 },
    { x: 9, y: 1, vx: 0, vy: 3 },
  ];
  step(ps);
  expect(ps[0].x).toBe(4);
  expect(ps[1].y).toBe(4);
});
test('velocity is unchanged', () => {
  const ps = [{ x: 0, y: 0, vx: 7, vy: 7 }];
  step(ps);
  step(ps);
  expect(ps[0].vx).toBe(7);
  expect(ps[0].x).toBe(14);
});`,
    hints: [
      'Loop over every slot; each slot is a particle object.',
      'For each particle `p`, set `p.x = p.x + p.vx` and do the same for `y`.',
    ],
    walkthrough: `This is the hot loop of every particle system, and the running example of this whole book.

- \`const p = ps[i];\` gives the current particle a short name.
- \`p.x = p.x + p.vx;\` reads two properties and writes one.
- No \`return\` is needed: we changed the objects that the caller’s array holds. Exactly *why* changing \`p\` changes the caller’s data is the subject of the next chapter.`,
    wrong: [
      {
        code: `function step(ps) {
  for (let i = 0; i < ps.length; i++) {
    let x = ps[i].x;
    x = x + ps[i].vx;
  }
}`,
        why: '`x` is a copy of the number. Changing that local variable doesn’t touch the object. Write to the property: `ps[i].x = ...`. (The `y` update is missing too.)',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const p = { x: 1, y: 2 };` What is `p.z`?',
    options: [
      { t: 'An error', why: 'Reading a missing property is not an error in JavaScript.' },
      { t: '`0`', why: 'Missing properties are not zero.' },
      { t: '`undefined`', correct: true, why: 'There is no property `z`, so you get `undefined`.' },
      { t: '`null`', why: 'JavaScript gives `undefined`, not `null`, for missing properties.' },
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
      { t: '`2`', correct: true, why: '`k` holds the string `\'b\'`, so `p[k]` is `p.b`.' },
      { t: '`undefined`', why: 'That would be `p.k`, the property literally named “k”.' },
      { t: '`1`', why: 'That is `p.a`.' },
      { t: '`\'b\'`', why: 'That is the key, not the value stored under it.' },
    ],
  },
  {
    q: 'Which line is a common bug when the key is held in a variable `key`?',
    options: [
      { t: '`obj[key]`', why: 'That is the correct way: it looks up the key stored in the variable.' },
      { t: '`obj.key`', correct: true, why: 'This reads the property literally named “key”, ignoring the variable.' },
      { t: '`obj[\'x\']`', why: 'That is fine; it means the same as `obj.x`.' },
      { t: '`obj.x`', why: 'That is fine when the key is known in advance.' },
    ],
  },
  {
    q: 'In an array of particle objects, which expression is the `vy` of the first particle?',
    options: [
      { t: '`particles.vy[0]`', why: 'That would be SoA-style, a `vy` array. Here each slot holds an object.' },
      { t: '`particles[1].vy`', why: 'Index 1 is the second particle.' },
      { t: '`particles.vy`', why: 'The array itself has no `vy` property.' },
      { t: '`particles[0].vy`', correct: true, why: 'Slot 0 holds the first particle object; `.vy` reads its property.' },
    ],
  },
  {
    q: 'What is the difference between AoS and SoA?',
    options: [
      { t: 'AoS keeps each record’s fields together; SoA keeps each field’s values together', correct: true, why: 'Same data, two arrangements: by record, or by field.' },
      { t: 'AoS is for numbers and SoA is for strings', why: 'Both can hold any kind of field.' },
      { t: 'SoA stores fewer values', why: 'Both store exactly the same values, just arranged differently.' },
      { t: 'They are two names for the same layout', why: 'They are different layouts: one groups by record, the other by field.' },
    ],
  },
  {
    q: 'Why do engines like V8 give many objects a shared hidden “shape”?',
    options: [
      { t: 'To save the text of the source code', why: 'Shapes describe objects’ properties, not source text.' },
      { t: 'So a property like `x` can be found without searching by name every time', correct: true, why: 'Objects with the same properties in the same order share a shape, so the engine knows where `x` lives.' },
      { t: 'To stop properties from being added', why: 'You can still add properties; the object just moves to a new shape.' },
      { t: 'Because JavaScript requires classes', why: 'Plain object literals get shapes too.' },
    ],
  },
];
