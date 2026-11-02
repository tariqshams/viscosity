// Chapter 6 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'particles-i-x': {
    q: 'In an array of particle objects, how do you read the `x` of the particle in slot 4?',
    a: '`particles[4].x`: slot 4 first, then its `x`.',
  },
  'aos-what': {
    q: 'What does AoS (array of structs) mean?',
    a: 'An array whose slots each hold a whole record (an object with all its fields together).',
  },
  'ps-dot-x': {
    q: '`ps` is an array of particle objects. What is `ps.x`, and why?',
    a: '`undefined`: the array itself has no property `x`. Pick a slot first: `ps[0].x`.',
  },
  'loop-p-name': {
    q: '`ps[i]` holds an object. After `const p = ps[i];`, does `p.x = 1` change the object inside the array?',
    a: 'Yes: `p` reaches the very object in slot `i`, not a copy of it.',
  },
  'past-end-record': {
    q: '`ps` has 3 records. What happens on `ps[3].x`?',
    a: 'A `TypeError` is thrown: `ps[3]` is `undefined`, and reading a property of `undefined` is an error.',
  },
  'soa-what': {
    q: 'What does SoA (struct of arrays) mean?',
    a: 'One array per property: all the `x` values together, all the `y` values together, and so on.',
  },
  'soa-read': {
    q: 'In a struct of arrays `soa`, how do you read particle 2’s `x`, and which step comes first?',
    a: '`soa.x[2]`: the field (`x`, an array) first, then slot 2 of it.',
  },
  'record-push': {
    q: 'How do you add a new particle `{ x: 1, vx: 0 }` to the end of `ps`?',
    a: '`ps.push({ x: 1, vx: 0 });` and the length grows by one.',
  },
};

export const examples = {
  records: {
    title: 'Fastest particle, and how many move right',
    code: `const ps = [
  { x: 0, vx: 1 },
  { x: 5, vx: -1 },
  { x: 9, vx: 3 },
];

let best = ps[0];
let right = 0;
for (let i = 0; i < ps.length; i++) {
  const p = ps[i];
  if (p.vx > best.vx) best = p;
  if (p.vx > 0) right = right + 1;
}
console.log(best);
console.log(right);`,
  },
};

export const exercises = {
  centerX: {
    title: 'The average x position',
    prompt: 'Write `centerX(ps)` that returns the **average** of the `x` properties of all the particle objects in the array `ps`. You can assume the array is not empty.',
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
      'An average is the total divided by how many there are. Which loop from *Visiting every slot* builds a total?',
      'It is the `sum` loop from *Visiting every slot*, but each slot holds an object rather than a number. Which part of the object do you add?',
      'Add `ps[i].x` (not `ps[i]`) to a `total` that starts at 0, then after the loop return `total / ps.length`.',
    ],
    walkthrough: `**How to think about it.** Do one by hand first: for \`[{ x: 2 }, { x: 4 }, { x: 9 }]\` the x values are 2, 4 and 9, their total is 15, and there are 3 of them, so the average is 15 / 3 = 5. That is two jobs: build a total, then divide by the count. Building a total over an array is the accumulator loop from *Visiting every slot*; the only new thing is that each slot is an object, so you must reach inside it for the number. The count is the array's own \`length\`.

**The solution, line by line.**

- \`function centerX(ps) {\` defines the function, with one parameter: the array of particles.
- \`  let total = 0;\` is the accumulator, the running total, starting at nothing. It is a \`let\` because it will change.
- \`  for (let i = 0; i < ps.length; i++) {\` visits every slot once, from index 0 to the last index.
- \`    total = total + ps[i].x;\` reads it left to right: \`ps[i]\` is the particle object in slot \`i\`, \`.x\` is its x property (a number), and that number is added to the total. On the example the total goes 2, then 6, then 15.
- \`  }\` ends the loop.
- \`  return total / ps.length;\` divides once, *after* the loop, by the number of particles: 15 / 3 is 5.
- \`}\` closes the body.

The second test gives each particle a \`y\` as well; the loop never reads it, so it cannot affect the answer. Keep that in mind: a loop that reads one property out of records that carry several is exactly the kind of loop a struct of arrays makes faster.

**Common wrong attempts.**

- \`total = total + ps[i];\` adds the whole object rather than its \`x\`. Adding an object to a number turns both into text (\`"0[object Object]"\`), and dividing text gives \`NaN\`.
- Dividing inside the loop (\`total = (total + ps[i].x) / ps.length\`) divides the running total over and over, so the answer comes out far too small.
- \`return total / 3;\` works for the first test only; use \`ps.length\` so it fits any number of particles.`,
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
      {
        code: `function centerX(ps) {
  let total = 0;
  for (let i = 0; i < ps.length; i++) {
    total = total + ps[i].x;
  }
  return total / 3;
}`,
        why: 'Dividing by `3` only fits arrays of three particles. Divide by `ps.length`.',
      },
    ],
  },
  step: {
    optional: true,
    title: 'Move every particle',
    prompt: 'Write `step(ps)` that moves every particle by its velocity: `x` grows by `vx`, and `y` grows by `vy`. Change the objects themselves; the function doesn’t need to return anything.',
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
      'You need to visit every particle, so start with the loop from *Visiting every slot*.',
      'Each slot is a particle object. Give it a short name: `const p = ps[i];`.',
      'Write to the properties: `p.x = p.x + p.vx;` and the same for `y` with `vy`.',
    ],
    walkthrough: `**How to think about it.** This is the hot loop of every particle system, and the running example of this whole book. Every particle needs the same two changes, so a loop over the array is the frame; inside it, you read two properties and write one, twice. Nothing has to be returned, because the job is to change the objects the array already holds.

**The solution, line by line.**

- \`function step(ps) {\` takes the array of particles.
- \`  for (let i = 0; i < ps.length; i++) {\` visits every slot once.
- \`    const p = ps[i];\` gives the current particle a short name. \`p\` is not a copy: it reaches the very same object that sits in slot \`i\` (*References* explains exactly why).
- \`    p.x = p.x + p.vx;\` reads \`x\` and \`vx\`, adds them, and writes the answer back into \`x\`.
- \`    p.y = p.y + p.vy;\` does the same for \`y\`.
- \`  }\` and \`}\` close the loop and the function. There is no \`return\`; the caller's array now holds moved particles.

The third test calls \`step\` twice and checks that \`x\` moved twice (to 14) while \`vx\` stayed 7: only positions change.

**Common wrong attempts.**

- \`let x = ps[i].x; x = x + ps[i].vx;\` changes a local *number*, a copy of the value, and the object is never touched. Write to the property itself.
- \`p.vx = p.x + p.vx;\` writes into the wrong property, so the speed changes and the position does not.`,
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
  toSoA: {
    optional: true,
    title: 'Turn the table sideways',
    prompt: 'Write `toSoA(ps)`. `ps` is an array of objects, each with an `x` and a `vx`. Return **one object** with two arrays: `x`, holding every particle’s `x` in order, and `vx`, holding every `vx`. For example `toSoA([{ x: 0, vx: 1 }, { x: 5, vx: -1 }])` returns `{ x: [0, 5], vx: [1, -1] }`.',
    starter: `function toSoA(ps) {
  // your code here
}

const ps = [
  { x: 0, vx: 1 },
  { x: 5, vx: -1 },
];
console.log(toSoA(ps));`,
    solution: `function toSoA(ps) {
  const soa = { x: [], vx: [] };
  for (let i = 0; i < ps.length; i++) {
    soa.x.push(ps[i].x);
    soa.vx.push(ps[i].vx);
  }
  return soa;
}`,
    tests: `test('two particles', () => {
  const ps = [{ x: 0, vx: 1 }, { x: 5, vx: -1 }];
  expect(toSoA(ps)).toEqual({ x: [0, 5], vx: [1, -1] });
});
test('keeps the order', () => {
  const ps = [{ x: 9, vx: 0 }, { x: 1, vx: 2 }, { x: 4, vx: 4 }];
  expect(toSoA(ps).x).toEqual([9, 1, 4]);
});
test('no particles gives empty arrays', () => {
  expect(toSoA([])).toEqual({ x: [], vx: [] });
});`,
    hints: [
      'The answer is an object whose properties are arrays. Start by making it, with both arrays empty.',
      'Visit every particle with a loop. For each one, add its `x` to the end of the `x` array, and its `vx` to the `vx` array.',
      '`soa.x.push(ps[i].x)` reads: the property `x` of `soa` (an array), then push particle `i`’s `x` onto it.',
    ],
    walkthrough: `**How to think about it.** Draw both shapes for two particles. Going in: \`[{ x: 0, vx: 1 }, { x: 5, vx: -1 }]\`, one record per slot. Coming out: \`{ x: [0, 5], vx: [1, -1] }\`, one array per field. Slot \`i\` of each output array must hold particle \`i\`'s value, so if you visit the particles in order and add each value to the *end* of the right array, the order looks after itself. That is a loop with two \`push\`es.

**The solution, line by line.**

- \`function toSoA(ps) {\` takes the array of records.
- \`  const soa = { x: [], vx: [] };\` makes the answer: an object with two properties, each an empty array. Objects can hold arrays as values, just as arrays can hold objects.
- \`  for (let i = 0; i < ps.length; i++) {\` visits every particle in order.
- \`    soa.x.push(ps[i].x);\` is read in two halves. On the right, \`ps[i].x\` is particle \`i\`'s x (slot first, then field). On the left, \`soa.x\` is the array of x values (field first), and \`.push(...)\` adds the number at its end.
- \`    soa.vx.push(ps[i].vx);\` does the same for \`vx\`.
- \`  }\` ends the loop, and \`  return soa;\` hands back the finished columns.

For an empty \`ps\` the loop never runs and you get \`{ x: [], vx: [] }\`, which is right. This is, in miniature, the rewrite Viscosity makes; the hard part (which *References* starts to show) is doing it without breaking any other code that still holds the old records.

**Common wrong attempts.**

- \`soa.x = ps[i].x;\` replaces the whole array with one number on every pass, so you end with \`{ x: 5, vx: -1 }\`, only the last particle.
- \`const soa = {};\` followed by \`soa.x.push(...)\` fails at once: \`soa.x\` is \`undefined\`, and \`undefined\` has no \`push\` (a TypeError). Make the arrays first.`,
    wrong: [
      {
        code: `function toSoA(ps) {
  const soa = { x: [], vx: [] };
  for (let i = 0; i < ps.length; i++) {
    soa.x = ps[i].x;
    soa.vx = ps[i].vx;
  }
  return soa;
}`,
        why: 'Assigning replaces the array with a single number on every pass, so only the last particle survives. Add to the arrays with `push`.',
      },
      {
        code: `function toSoA(ps) {
  const soa = {};
  for (let i = 0; i < ps.length; i++) {
    soa.x.push(ps[i].x);
    soa.vx.push(ps[i].vx);
  }
  return soa;
}`,
        why: '`soa.x` is `undefined` because the arrays were never made, so `push` throws a TypeError. Start from `{ x: [], vx: [] }`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In an array of particle objects, which expression is the `vy` of the first particle?',
    options: [
      {
        t: '`particles.vy[0]`',
        why: 'That would be SoA-style, a `vy` array. Here each slot holds an object.',
      },
      {
        t: '`particles[1].vy`',
        why: 'Index 1 is the second particle.',
      },
      {
        t: '`particles.vy`',
        why: 'The array itself has no `vy` property, so this is `undefined`.',
      },
      {
        t: '`particles[0].vy`',
        correct: true,
        why: 'Slot 0 holds the first particle object; `.vy` reads its property.',
      },
    ],
  },
  {
    q: `\`ps\` holds 2 particles. What happens?
\`\`\`
console.log(ps[2].x);
\`\`\``,
    options: [
      {
        t: 'It prints `undefined`',
        why: 'That would be `ps[2]` alone. Here the code goes on to ask `undefined` for a property.',
      },
      {
        t: 'A TypeError: Cannot read properties of undefined',
        correct: true,
        why: '`ps[2]` is past the end, so it is `undefined`, and reading `.x` of `undefined` stops the program.',
      },
      {
        t: 'It prints the last particle’s x',
        why: 'Index 2 is one past the last index (1); JavaScript does not wrap round.',
      },
      {
        t: 'It prints `0`',
        why: 'Nothing gives a default of 0 for a missing slot.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const ps = [{ x: 1 }, { x: 2 }];
for (let i = 0; i < ps.length; i++) {
  const p = ps[i];
  p.x = p.x * 10;
}
console.log(ps[1].x);
\`\`\``,
    options: [
      {
        t: '`2`',
        why: '`p` is not a copy: it reaches the object in the slot, so writing `p.x` changes the array’s particle.',
      },
      {
        t: '`10`',
        why: 'That is the first particle’s new x. Slot 1 held 2, which became 20.',
      },
      {
        t: '`20`',
        correct: true,
        why: 'Each pass names the record in the slot `p` and multiplies its own `x` by 10, so slot 1 goes from 2 to 20.',
      },
      {
        t: 'An error, because `p` is `const`',
        why: '`const` stops `p` being given a different record; changing a property of the record is allowed.',
      },
    ],
  },
  {
    q: 'What is the difference between AoS and SoA?',
    options: [
      {
        t: 'AoS keeps each record’s fields together; SoA keeps each field’s values together',
        correct: true,
        why: 'Same data, two arrangements: by record (row), or by field (column).',
      },
      {
        t: 'AoS is for numbers and SoA is for strings',
        why: 'Both can hold any kind of field.',
      },
      {
        t: 'SoA stores fewer values',
        why: 'Both store exactly the same values, just arranged differently.',
      },
      {
        t: 'They are two names for the same layout',
        why: 'They are different layouts: one groups by record, the other by field.',
      },
    ],
  },
  {
    q: 'With `const soa = { x: [0, 5, 9], vx: [1, -1, 0] };`, which reads particle 2’s `vx`?',
    options: [
      {
        t: '`soa[2].vx`',
        why: '`soa` is an object, not an array of records, so `soa[2]` is `undefined`.',
      },
      {
        t: '`soa.vx[2]`',
        correct: true,
        why: 'In a struct of arrays you pick the field first (`vx`, an array), then the slot.',
      },
      {
        t: '`soa.vx.2`',
        why: 'A dot must be followed by a name; slots of an array are read with brackets.',
      },
      {
        t: '`soa[vx][2]`',
        why: 'Without quotes, `vx` is a variable name, and no variable `vx` exists here. `soa[\'vx\'][2]` would work.',
      },
    ],
  },
  {
    q: 'In which language is an array of records stored with the records packed one after another, with no arrows?',
    options: [
      {
        t: 'Python, in a list of dictionaries',
        why: 'A Python list holds references to its dictionaries, which live elsewhere.',
      },
      {
        t: 'Java, in an array of objects',
        why: 'A Java array of objects holds references, much like JavaScript.',
      },
      {
        t: 'JavaScript, in an array of objects',
        why: 'The array usually holds arrows to separate objects; this is what Viscosity changes.',
      },
      {
        t: 'C, in an array of structs',
        correct: true,
        why: '`struct P ps[2]` lays the structs out side by side in memory.',
      },
    ],
  },
];
