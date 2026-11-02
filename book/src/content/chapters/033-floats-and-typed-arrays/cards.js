// Chapter 33 cards (floats and typed arrays).
// Keys are stable ids: never rename them.

export const prompts = {
  'float64-what': {
    q: 'How is every ordinary JavaScript number stored?',
    a: 'As a float64: a 64-bit (8-byte) IEEE 754 double-precision floating-point number.',
  },
  'why-point-one': {
    q: 'Why is `0.1 + 0.2` not exactly `0.3` in JavaScript?',
    a: '0.1 goes on forever in binary (like 1/3 in decimal), so only the nearest 64-bit value is stored.',
  },
  'safe-int': {
    q: 'Up to what size are whole numbers stored exactly in a float64?',
    a: '2⁵³ − 1, which is `Number.MAX_SAFE_INTEGER`.',
  },
  'float-gaps': {
    q: 'Why is `2 ** 53 + 1 === 2 ** 53` true?',
    a: 'Above 2⁵³ the float64 values are 2 apart, so 2⁵³ + 1 falls between two of them and is moved to the nearest, 2⁵³.',
  },
  'buffer-what': {
    q: 'What is an `ArrayBuffer`, and how do you read it?',
    a: 'A fixed-size block of raw bytes, all zero at first. You read and write it through a view, such as a typed array.',
  },
  'shared-bytes': {
    q: 'A `Float64Array` and an `Int32Array` view the same buffer. You write through one. Does the other see the change?',
    a: 'Yes. Both are views of the same bytes, so they alias each other, though they read those bytes differently.',
  },
  'no-push': {
    q: 'Why doesn’t `Float64Array` have `push`?',
    a: 'Its length is fixed: it is a view over a buffer of a set number of bytes.',
  },
  'typed-convert': {
    q: 'What does a `Uint8Array` store if you write `256` into it, and why?',
    a: '`0`. A `Uint8Array` element is one byte (0 to 255), so only the low 8 bits of 256 (all zero) are kept.',
  },
};

export const examples = {
  views: {
    title: 'One buffer, two views',
    code: `const buf = new ArrayBuffer(16);
const f64 = new Float64Array(buf);
const i32 = new Int32Array(buf);
console.log(f64.length, i32.length);

i32[2] = 5;
console.log(f64[1]); // a tiny float

f64[0] = 1;
console.log(i32[0], i32[1]);

const u8 = new Uint8Array(2);
u8[0] = 256;
u8[1] = 300;
console.log(u8[0], u8[1]);

console.log(0.1 + 0.2);
console.log(2 ** 53 + 1 === 2 ** 53);`,
  },
};

export const exercises = {
  toSoa: {
    title: 'From objects to columns',
    prompt:
      'Write `toSoa(ps)`. `ps` is an array of objects like `{ x: 1, y: 2 }`. Return an object `{ x, y }` where `x` is a `Float64Array` holding every particle’s `x` in order, and `y` a `Float64Array` holding every `y`. This is the layout change Viscosity makes.',
    starter: `function toSoa(ps) {
  // your code here
}

const ps = [
  { x: 1, y: 2 },
  { x: 3, y: 4 },
];
console.log(toSoa(ps));`,
    solution: `function toSoa(ps) {
  const n = ps.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = ps[i].x;
    y[i] = ps[i].y;
  }
  return { x: x, y: y };
}`,
    tests: `const ps = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
test('the columns are Float64Arrays', () => {
  const s = toSoa(ps);
  expect(s.x instanceof Float64Array).toBe(true);
  expect(s.y instanceof Float64Array).toBe(true);
});
test('one slot per particle', () => {
  const s = toSoa(ps);
  expect(s.x.length).toBe(3);
  expect(s.y.length).toBe(3);
});
test('the values, in order', () => {
  const s = toSoa(ps);
  expect(Array.from(s.x)).toEqual([1, 3, 5]);
  expect(Array.from(s.y)).toEqual([2, 4, 6]);
});
test('decimals survive', () => {
  const s = toSoa([{ x: 0.5, y: -2.25 }]);
  expect(s.x[0]).toBe(0.5);
  expect(s.y[0]).toBe(-2.25);
});
test('no particles: empty columns', () => {
  const s = toSoa([]);
  expect(s.x.length).toBe(0);
});`,
    hints: [
      'A typed array cannot grow, so you need to know its final size before you create it. How many slots does each column need?',
      'Create each column at its final size, `new Float64Array(ps.length)`, then loop over the particles by index: slot `i` of the `x` column gets `ps[i].x`.',
      'After the loop, return an object holding both columns: `return { x: x, y: y };`.',
    ],
    walkthrough: `**How to think about it.** Picture the input as a table with one row per particle and one column per field. The array of objects stores it row by row: each object is a row. We want it stored column by column: one solid block for all the \`x\` values, one for all the \`y\` values. Because a typed array has a fixed length, the order of work is forced: first find out how many rows there are, then make each column that long, then copy the values across.

**The solution, line by line.**

- \`function toSoa(ps) {\` takes the array of particle objects.
- \`  const n = ps.length;\` counts the particles once; every column will have exactly \`n\` slots.
- \`  const x = new Float64Array(n);\` makes the \`x\` column: \`n\` float64s, 8 bytes each, all starting at \`0\`.
- \`  const y = new Float64Array(n);\` makes the \`y\` column the same way.
- \`  for (let i = 0; i < n; i++) {\` visits each particle by its index, which is the important part: slot \`i\` of every column belongs to particle \`i\`.
- \`    x[i] = ps[i].x;\` copies particle \`i\`'s \`x\` into slot \`i\` of the \`x\` column.
- \`    y[i] = ps[i].y;\` does the same for \`y\`.
- \`  }\` ends the loop.
- \`  return { x: x, y: y };\` hands back one small object holding the two columns.
- \`}\` closes the body.

Notice what was lost: there is no object for particle 1 any more; a particle is now just an index shared by the columns. Code that kept a reference to \`ps[1]\` and changed it would no longer affect the columns. That is the aliasing problem from the chapter on references, and it is why Viscosity must prove no such references exist before it makes this change for you.

**Common wrong attempts.**

- Creating empty typed arrays and calling \`push\`: typed arrays have no \`push\`, so this stops with \`TypeError: x.push is not a function\`.
- Using ordinary arrays (\`[]\` and \`push\`): the values come out right, but these are not \`Float64Array\`s, so there is no promise that they are packed blocks of float64s, and the \`instanceof\` test fails.`,
    wrong: [
      {
        code: `function toSoa(ps) {
  const x = new Float64Array();
  const y = new Float64Array();
  for (const p of ps) {
    x.push(p.x);
    y.push(p.y);
  }
  return { x: x, y: y };
}`,
        why: 'Typed arrays have a fixed length and no `push`, so this throws a `TypeError`. Create them at the right size, then assign by index.',
      },
      {
        code: `function toSoa(ps) {
  const x = [];
  const y = [];
  for (const p of ps) {
    x.push(p.x);
    y.push(p.y);
  }
  return { x: x, y: y };
}`,
        why: 'The values are right, but these are ordinary arrays, not `Float64Array`s. Ordinary arrays can hold anything; a `Float64Array` is guaranteed to be a packed block of float64s.',
      },
    ],
  },
  grow: {
    optional: true,
    title: 'Growing a column',
    prompt:
      'A `Float64Array` cannot grow, so to add more particles you make a bigger one and copy. Write `grow(col)`: return a **new** `Float64Array` twice as long as `col` (or of length 1 if `col` is empty), with `col`’s values copied into the first slots and zeros after them. Do not change `col`.',
    starter: `function grow(col) {
  // your code here
}

const c = new Float64Array([1, 2]);
console.log(grow(c));`,
    solution: `function grow(col) {
  const n = Math.max(1, col.length * 2);
  const out = new Float64Array(n);
  for (let i = 0; i < col.length; i++) {
    out[i] = col[i];
  }
  return out;
}`,
    tests: `test('twice as long', () => {
  const g = grow(new Float64Array([1, 2]));
  expect(g.length).toBe(4);
});
test('old values first, then zeros', () => {
  const g = grow(new Float64Array([1, 2]));
  expect(Array.from(g)).toEqual([1, 2, 0, 0]);
});
test('a new array, the old one untouched', () => {
  const c = new Float64Array([5]);
  const g = grow(c);
  g[0] = 9;
  expect(c[0]).toBe(5);
  expect(c.length).toBe(1);
});
test('an empty column grows to 1', () => {
  expect(grow(new Float64Array(0)).length).toBe(1);
});
test('still a Float64Array', () => {
  expect(grow(new Float64Array(2)) instanceof Float64Array).toBe(true);
});`,
    hints: [
      'You cannot make `col` longer, so the answer is a different, bigger typed array. How long should it be, including for an empty column?',
      'Make it with `new Float64Array(n)`, where `n` is `col.length * 2`, but at least 1 (`Math.max(1, ...)`). New typed arrays start full of zeros.',
      'Copy slot by slot: `for (let i = 0; i < col.length; i++) { out[i] = col[i]; }`, then `return out;`.',
    ],
    walkthrough: `**How to think about it.** This is how every growable list works underneath, including JavaScript's own arrays: when the storage is full, allocate a bigger block and copy the old values across. Doubling (rather than adding one slot) means copies are rare: a column that grows to a million slots is copied only about twenty times. The edge case is the empty column, because twice zero is still zero, so it needs a minimum size.

**The solution, line by line.**

- \`function grow(col) {\` takes the old column.
- \`  const n = Math.max(1, col.length * 2);\` picks the new length: double the old one, but never less than 1, so an empty column becomes length 1.
- \`  const out = new Float64Array(n);\` makes the new, bigger column, already full of zeros, so the slots after the copied values need no work.
- \`  for (let i = 0; i < col.length; i++) {\` visits every old slot (not every new one: there are only \`col.length\` values to copy).
- \`    out[i] = col[i];\` copies one value across.
- \`  }\` ends the loop.
- \`  return out;\` hands back the new column; \`col\` itself was only read, never written, so it is unchanged.
- \`}\` closes the body.

**Common wrong attempts.**

- Calling \`col.push(...)\` to make room: typed arrays have no \`push\`.
- Making the new array with \`new Float64Array(col.buffer)\`: that is a second *view* of the same bytes, the same length as before, and writing through it changes \`col\` too.
- Forgetting the minimum: \`grow\` of an empty column gives another empty column, so a program that grows when full would never get any room.`,
    wrong: [
      {
        code: `function grow(col) {
  const out = new Float64Array(
    col.length * 2);
  for (let i = 0; i < col.length; i++) {
    out[i] = col[i];
  }
  return out;
}`,
        why: 'An empty column has length 0, and twice 0 is 0, so it never gets any room. Use at least 1.',
      },
      {
        code: `function grow(col) {
  return new Float64Array(col.buffer);
}`,
        why: 'This is a second view of the same bytes: it is no longer, and writing to it changes `col`. Make a new array and copy the values.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many bytes does one element of a `Float64Array` take?',
    options: [
      { t: '1', why: 'One byte is a `Uint8Array` element.' },
      { t: '4', why: 'Four bytes is an `Int32Array` element.' },
      { t: '64', why: 'It is 64 *bits*. Divide by 8 to get bytes.' },
      { t: '8', correct: true, why: '64 bits ÷ 8 bits per byte = 8 bytes, the same size as any JavaScript number.' },
    ],
  },
  {
    q: '`const b = new ArrayBuffer(8); const f = new Float64Array(b); const u = new Uint8Array(b);` What are `f.length` and `u.length`?',
    options: [
      { t: '`8` and `8`', why: 'The buffer has 8 bytes, but a float64 uses all 8 of them.' },
      { t: '`1` and `8`', correct: true, why: 'One 8-byte float fits in 8 bytes; eight 1-byte integers do too. Both views share the same bytes.' },
      { t: '`8` and `1`', why: 'That is the wrong way round: Uint8 elements are the small ones.' },
      { t: 'An error: a buffer can only have one view', why: 'A buffer can have any number of views, all seeing the same bytes.' },
    ],
  },
  {
    q: 'You write `const a = new Int32Array(1); a[0] = 2.9;`. What is `a[0]`?',
    options: [
      { t: '`2.9`', why: 'An `Int32Array` can only hold 32-bit integers; values are converted to fit.' },
      { t: '`3`', why: 'The conversion drops the fraction rather than rounding.' },
      { t: '`2`', correct: true, why: 'The fraction is dropped to fit a 32-bit integer.' },
    ],
  },
  {
    q: 'Which of these is exactly true in JavaScript?',
    options: [
      { t: '`0.1 + 0.2 === 0.3`', why: '`0.1 + 0.2` is `0.30000000000000004`.' },
      { t: '`0.5 + 0.25 === 0.75`', correct: true, why: '0.5 and 0.25 are 2⁻¹ and 2⁻², exact in binary, and so is their sum.' },
      { t: '`2 ** 53 + 1 > 2 ** 53`', why: '2⁵³ + 1 cannot be stored; it becomes 2⁵³ itself, so the two sides are equal and `>` is false.' },
    ],
  },
  {
    q: 'Why does Viscosity use one `Float64Array` per field, instead of an array of objects?',
    options: [
      { t: 'Typed arrays can be resized as needed', why: 'The opposite: their length is fixed.' },
      { t: 'It is always faster, for every program', why: 'Not always: this repository’s benchmark shows columns losing badly when every particle must become a real object.' },
      { t: 'Each field becomes one packed block of 8-byte numbers, which is fast for loops that touch a few fields of many particles', correct: true, why: 'That is the struct-of-arrays layout. Whether it wins depends on how the program uses the data, which is what Viscosity analyses.' },
    ],
  },
];
