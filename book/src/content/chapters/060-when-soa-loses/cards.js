// Cards for "When SoA loses" (split from chapter 59). Keys are stable
// ids: never rename them.

export const prompts = {
  'materialize-what': {
    q: 'What is **materialisation**?',
    a: 'Rebuilding a whole object from its SoA columns.',
  },
  'identity-lost': {
    q: 'If `get(s, i)` builds an object from columns, what is `get(s, 0) === get(s, 0)`, and why?',
    a: '`false`. Each call allocates a new object, so the two have different identities.',
  },
  'copy-write': {
    q: '`const a = get(s, 0); a.x = 99;` Does `s.x[0]` change?',
    a: 'No. The materialised object is a copy; nothing links it back to the column.',
  },
  'materialize-cost': {
    q: 'Why was SoA far slower than AoS in the `materialize` suite?',
    a: 'Every element needed a fresh object allocation; AoS only copied references to objects that already existed.',
  },
  'escape-removed': {
    q: 'Why did SoA *not* lose in `get-objects`, where each element is passed to a small function as an object?',
    a: 'Most likely because the object did not escape: the harness notes say V8 inlined the function and removed the temporary object.',
  },
  'aosoa-what': {
    q: 'What is **AoSoA**?',
    a: 'Fixed-size blocks of records (e.g. 8), with SoA inside each block: 8 x values, then 8 y values, and so on.',
  },
  'aosoa-line': {
    q: 'Why are blocks of 8 a natural size for float64 AoSoA?',
    a: '8 doubles are 64 bytes: each field\'s run inside a block fills exactly one cache line.',
  },
  'aosoa-random': {
    q: 'Why was AoSoA slow at random access in this book\'s benchmark?',
    a: 'Every access must work out a block and a lane (a division and a remainder), which costs more than it saves without SIMD.',
  },
  'aosoa-small': {
    q: 'How does a sequential AoSoA loop avoid the division on every access?',
    a: 'It loops over blocks, then over the lanes inside each block, so slots come from additions only.',
  },
};

export const examples = {
  materialize: {
    title: 'Materialising from columns',
    code: `const s = {
  x: new Float64Array([1, 2]),
  y: new Float64Array([3, 4]),
};
function get(s, i) {
  return { x: s.x[i], y: s.y[i] };
}
const a = get(s, 0);
const b = get(s, 0);
console.log(a, b);
console.log(a === b);
a.x = 99;
console.log(s.x[0]);`,
  },
};

export const exercises = {
  aosoaAt: {
    title: 'Find a field in AoSoA',
    prompt:
      'Particles have 6 fields and are stored in AoSoA blocks of 8: block `b` holds 8 values of field 0, then 8 of field 1, and so on (48 slots per block). Write `aosoaAt(i, f)` that returns the slot index of field `f` of particle `i`.',
    starter: `function aosoaAt(i, f) {
  // your code here
}

console.log(aosoaAt(10, 2));`,
    solution: `function aosoaAt(i, f) {
  const blk = Math.floor(i / 8);
  const lane = i % 8;
  return blk * 48 + f * 8 + lane;
}`,
    tests: `test('the first particle', () => {
  expect(aosoaAt(0, 0)).toBe(0);
  expect(aosoaAt(0, 1)).toBe(8);
});
test('neighbours in one field are adjacent', () => {
  expect(aosoaAt(1, 0)).toBe(1);
  expect(aosoaAt(7, 0)).toBe(7);
});
test('particle 8 starts the next block', () => {
  expect(aosoaAt(8, 0)).toBe(48);
});
test('somewhere in the middle', () => {
  expect(aosoaAt(10, 2)).toBe(66);
});
test('the last slot of block 0', () => {
  expect(aosoaAt(7, 5)).toBe(47);
});`,
    hints: [
      'Answer two questions about particle `i` first: which block is it in, and which lane (position) inside that block?',
      'Block: `Math.floor(i / 8)`. Lane: `i % 8`. A block is 6 × 8 = 48 slots.',
      'Inside a block, field `f` starts `f * 8` slots in. Add the three parts: `blk * 48 + f * 8 + lane`.',
    ],
    walkthrough: `**How to think about it.** This is the formula from the chapter, and the safest way to get it right is to build the slot number from three distances, each answering one question. How far from the start of memory is the particle's block? How far into the block does its field's row start? How far along that row is the particle? Try one by hand with the figure: particle 10 is in block 1 (particles 8 to 15), its lane is 2 (the third of that block), and field 2 (\`vx\`) is the third row. Block 1 starts at 48, the third row starts 16 further on, and lane 2 is 2 further: 66.

**The solution, line by line.**

- \`const blk = Math.floor(i / 8);\` works out the block. Dividing by the block size and rounding down gives 0 for particles 0 to 7, 1 for 8 to 15, and so on.
- \`const lane = i % 8;\` works out the lane: the remainder after dividing by 8, which counts 0 to 7 inside each block.
- \`return blk * 48 + f * 8 + lane;\` adds the three distances. Each block is 6 fields × 8 lanes = 48 slots, so block \`blk\` starts at \`blk * 48\`; inside it, each field's row is 8 slots, so field \`f\` starts \`f * 8\` further on; and the particle is \`lane\` slots along its row.

Check the tests against the picture: \`aosoaAt(0, 1)\` is the first \`y\`, right after the 8 \`x\` values, at 8; \`aosoaAt(8, 0)\` is the first slot of block 1, at 48; \`aosoaAt(7, 5)\` is the last slot of block 0, at 47.

That division and remainder on every random access is the likeliest reason AoSoA was slow in the \`random-x\` benchmark. A sequential loop avoids it by looping over blocks and lanes separately.

**Common wrong attempts.**

- \`i * 6 + f\` is the packed AoS index (stride 6): in AoSoA, neighbouring particles' values of one field sit next to each other, not six apart.
- \`f * 8 + i\` forgets the blocks; it happens to work for the first 8 particles, but particle 8 belongs to block 1, at slot 48, not at slot 8.
- Using \`i / 8\` without \`Math.floor\` gives a fraction, such as 1.25 for particle 10, and a slot number that is not a whole number.`,
    wrong: [
      {
        code: `function aosoaAt(i, f) {
  return i * 6 + f;
}`,
        why: 'That is the packed AoS index (stride 6). In AoSoA, neighbouring particles\' values of one field are adjacent.',
      },
      {
        code: `function aosoaAt(i, f) {
  return f * 8 + i;
}`,
        why: 'This forgets the blocks: it only works for the first 8 particles. Particle 8 belongs to block 1, at slot 48.',
      },
    ],
  },
  getFields: {
    optional: true,
    title: 'Materialise any fields',
    prompt:
      'Columns are stored as an object of `Float64Array`s, such as `{ x, y, vx }`. Write `getFields(s, i, fields)` that materialises element `i`: it returns a **new** object with one property per name in `fields`, taken from slot `i` of that column.',
    starter: `function getFields(s, i, fields) {
  // your code here
}

const s = {
  x: new Float64Array([1, 2]),
  y: new Float64Array([3, 4]),
};
const o = getFields(s, 1, ['x', 'y']);
console.log(o);`,
    solution: `function getFields(s, i, fields) {
  const o = {};
  for (const f of fields) {
    o[f] = s[f][i];
  }
  return o;
}`,
    tests: `const s = {
  x: new Float64Array([1, 2]),
  y: new Float64Array([3, 4]),
  vx: new Float64Array([5, 6]),
};
test('builds the requested fields', () => {
  expect(getFields(s, 1, ['x', 'y']))
    .toEqual({ x: 2, y: 4 });
});
test('only the requested fields', () => {
  expect(getFields(s, 0, ['vx']))
    .toEqual({ vx: 5 });
});
test('a new object every call', () => {
  const a = getFields(s, 0, ['x']);
  const b = getFields(s, 0, ['x']);
  expect(a === b).toBe(false);
});
test('writes do not reach the columns', () => {
  const a = getFields(s, 0, ['x']);
  a.x = 99;
  expect(s.x[0]).toBe(1);
});`,
    hints: [
      'Start from an empty object, then add one property per field name.',
      'The field name is in a variable `f`, so you need bracket access twice: `s[f]` is the column, and `o[f]` is the new property.',
      'Inside a loop over `fields`: `o[f] = s[f][i];`. Return `o` at the end.',
    ],
    walkthrough: `**How to think about it.** Materialising is the reverse of the split in the last chapter: there we went from \`p[k]\` (record first) to \`cols[k][i]\` (field first); here we go from \`s[f][i]\` back to \`o[f]\`. The names are only known when the function runs, so everything uses bracket access.

**The solution, line by line.**

- \`const o = {};\` is the new object; this is the allocation that materialisation always costs.
- \`for (const f of fields) {\` visits each requested field name.
- \`o[f] = s[f][i];\` reads slot \`i\` of column \`s[f]\` and stores it as property \`f\` of the new object. Because a number is copied, \`o\` has no link back to the column.
- \`return o;\` hands back the new object.

Because \`o\` is created inside the function, every call returns a different object (so \`a === b\` is \`false\`), and writing \`a.x = 99\` changes only that object, which are the two differences an optimiser must never let a program notice.

**Common wrong attempts.**

- \`o.f = s.f[i]\` uses the property literally named "f", not the name stored in \`f\`.
- Reusing one shared object for every call (making \`o\` outside the function) avoids the allocation, but then two calls return the *same* object, and the second call overwrites what the first returned.`,
    wrong: [
      {
        code: `const shared = {};
function getFields(s, i, fields) {
  for (const f of fields) {
    shared[f] = s[f][i];
  }
  return shared;
}`,
        why: 'Every call returns the same shared object, so `a === b` is `true` and the second call overwrites the first one\'s values.',
      },
      {
        code: `function getFields(s, i, fields) {
  const o = {};
  for (const f of fields) {
    o.f = s.f[i];
  }
  return o;
}`,
        why: '`s.f` and `o.f` mean the property literally named "f", not the name stored in the variable `f`. Use `s[f]` and `o[f]`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why was SoA 20 to 35 times slower than AoS in the `materialize` suite?',
    options: [
      { t: 'Typed arrays are slow to read', why: 'SoA reads were fast in every other suite.' },
      { t: 'It had to allocate a new object for every element, while AoS copied references it already had', correct: true, why: 'That is materialisation of objects that are kept.' },
      { t: 'SoA used more memory', why: 'SoA used less; the cost was building objects.' },
    ],
  },
  {
    q: '`get(s, i)` builds `{ x: s.x[i], y: s.y[i] }`. Then `const a = get(s, 0); a.x = 99;`. What is `s.x[0]`?',
    options: [
      { t: '`99`, because `a` points into the column', why: 'A plain object cannot point into a typed array slot; the value was copied.' },
      { t: 'An error is thrown', why: 'Writing a property of a fresh object is fine.' },
      { t: 'Unchanged: `a` is a separate new object', correct: true, why: 'The materialised object is a copy; writes to it do not flow back.' },
    ],
  },
  {
    q: 'In `get-objects`, each element is materialised and passed to `consume(p)`, which does not keep it. Why did SoA not lose?',
    options: [
      { t: 'Most likely, the object did not escape, so V8 inlined `consume` and removed the temporary object', correct: true, why: 'That is the explanation in the harness’s own notes: with no object to allocate, the loop reads the columns directly.' },
      { t: 'V8 caches every object it has built before', why: 'There is no such cache; the object was removed, not reused.' },
      { t: '`consume` was never called', why: 'It was called for every element; only the object was optimised away.' },
      { t: 'Objects are free in V8', why: 'The `materialize` suite shows that kept objects are far from free.' },
    ],
  },
  {
    q: 'In AoSoA with blocks of 8 and 6 fields, where is field 1 of particle 9?',
    options: [
      { t: 'Slot 55', why: 'That is 9 × 6 + 1, the packed AoS index.' },
      { t: 'Slot 57', correct: true, why: 'Block 1 starts at 48, field 1 is 8 further, and particle 9 is lane 1: 48 + 8 + 1.' },
      { t: 'Slot 17', why: 'That forgets the block: 1 × 8 + 9.' },
      { t: 'Slot 49', why: 'That is field 0 of particle 9.' },
    ],
  },
  {
    q: 'Why does AoSoA do badly on random access in plain JavaScript?',
    options: [
      { t: 'Its blocks do not fit in cache lines', why: '8 doubles fill a 64-byte line exactly.' },
      { t: 'It can only be read in order', why: 'It can be indexed at random; it just costs more.' },
      { t: 'Each access must work out a block and a lane, with a division and a remainder', correct: true, why: 'Without SIMD to pay it back, that arithmetic is pure cost.' },
    ],
  },
];
