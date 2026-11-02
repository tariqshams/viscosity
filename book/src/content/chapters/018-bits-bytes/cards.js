// Chapter 18 cards. Keys are stable ids: never rename them.

export const prompts = {
  'binary-what': {
    q: 'In binary, what are the place values, from the right?',
    a: '1, 2, 4, 8, 16, …: each place is worth double the one to its right.',
  },
  'bit-byte': {
    q: 'What is a bit, and how many bits make a byte?',
    a: 'A bit is a single 0 or 1. A byte is 8 bits.',
  },
  'byte-range': {
    q: 'What range of whole numbers can one byte hold, and why?',
    a: '0 to 255. Eight bits have 2⁸ = 256 different patterns.',
  },
  'and-or': {
    q: 'What are `5 & 3` and `5 | 3`? (5 is `101`, 3 is `011`.)',
    a: '`5 & 3` is `1` (`001`: only where both are on). `5 | 3` is `7` (`111`: where either is on).',
  },
  'shift-left': {
    q: 'Why does `x << 1` double a small whole number `x`?',
    a: 'Every bit moves one place left, where each place is worth twice as much.',
  },
  'ops-32bit': {
    q: 'What do the bitwise operators do to a number like `3.7` before they work?',
    a: 'Convert it to a 32-bit integer, dropping the fraction: `3.7 | 0` is `3`.',
  },
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
};

export const examples = {
  bits: {
    title: 'Bits, shifts and float surprises',
    code: `console.log((13).toString(2));
console.log(13 & 6, 13 | 6, 13 ^ 6);
console.log(1 << 3, 13 >> 1);

// Bitwise ops work on 32-bit ints:
console.log(3.7 | 0);
console.log(2 ** 32 | 0);
console.log(-1 >>> 0);

// float64 surprises:
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
      'A typed array’s length is fixed, so create each column at its final size first: `new Float64Array(ps.length)`.',
      'Loop over the particles by index. Slot `i` of the `x` column gets `ps[i].x`.',
      'Return an object holding both columns: `{ x: x, y: y }`.',
    ],
    walkthrough: `This turns an array of structs into a struct of arrays: the transformation at the heart of Viscosity, done by hand.

- **Size first.** Typed arrays can’t grow, so make each column exactly \`ps.length\` long. New typed arrays start full of zeros.
- **Copy field by field.** Slot \`i\` of every column belongs to particle \`i\`. That shared index is what holds a “particle” together now that there is no particle object.
- **Return the columns.** The result is one small object holding two blocks of float64s, each 8 bytes per particle, packed side by side.

Notice what was lost: there is no object for particle 1 any more. Code that held a reference to \`ps[1]\` and changed it would no longer affect the columns. That is the aliasing problem from chapter 6, and it is why Viscosity must prove no such references exist before it makes this change for you.`,
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
  countBits: {
    optional: true,
    title: 'Count the switches that are on',
    prompt:
      'Write `countBits(n)`: how many bits are 1 in the 32-bit pattern of `n`? For example, `13` is `1101`, so `countBits(13)` is `3`. Use `&` and `>>>`. (For `-1`, all 32 bits are on.)',
    starter: `function countBits(n) {
  // your code here
}

console.log(countBits(13));`,
    solution: `function countBits(n) {
  let count = 0;
  let v = n >>> 0;
  while (v !== 0) {
    count = count + (v & 1);
    v = v >>> 1;
  }
  return count;
}`,
    tests: `test('zero has no bits on', () => {
  expect(countBits(0)).toBe(0);
});
test('13 is 1101', () => {
  expect(countBits(13)).toBe(3);
});
test('a full byte', () => {
  expect(countBits(255)).toBe(8);
});
test('a power of two has one bit', () => {
  expect(countBits(1024)).toBe(1);
});
test('-1 has all 32 bits on', () => {
  expect(countBits(-1)).toBe(32);
});`,
    hints: [
      '`v & 1` is `1` if the rightmost bit of `v` is on, and `0` otherwise.',
      'After looking at the rightmost bit, slide everything right with `v >>> 1` and look again. Stop when `v` is `0`.',
      'Use `>>>`, not `>>`. For a negative number, `>>` keeps copying the sign bit in from the left, so `v` would never reach `0`.',
    ],
    walkthrough: `Look at the rightmost bit, count it, slide it away, repeat.

- **\`v & 1\`** keeps only the rightmost bit: \`1101 & 0001\` is \`0001\`. Adding it to \`count\` counts one bit.
- **\`v >>> 1\`** slides every bit one place right, so the next bit becomes the rightmost. The \`>>>\` shift fills from the left with **zeros**, so after at most 32 slides, \`v\` is \`0\` and the \`while\` loop stops.
- **\`n >>> 0\` first** turns \`n\` into its unsigned 32-bit pattern, so \`-1\` becomes \`4294967295\`: 32 ones.

Why not \`>>\`? It shifts right but copies the sign bit back in. \`-1 >> 1\` is still \`-1\`, so the loop would run forever. That edge case (a negative number) is exactly what the last test is for.`,
    wrong: [
      {
        code: `function countBits(n) {
  let count = 0;
  let v = n;
  while (v > 0) {
    count = count + (v & 1);
    v = v >>> 1;
  }
  return count;
}`,
        why: 'For `-1`, `v > 0` is false straight away, so this returns `0`. Convert to the unsigned pattern first (`n >>> 0`), or test `v !== 0`.',
      },
      {
        code: `function countBits(n) {
  let count = 0;
  let v = n;
  while (v >= 1) {
    count = count + (v % 2);
    v = v / 2;
  }
  return count;
}`,
        why: '`v / 2` is ordinary division, so `13 / 2` is `6.5`, not `6`, and `6.5 % 2` is `0.5`. The fractions pile up into a wrong count. Use the bit operators, which work on whole 32-bit patterns.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the binary number `1011` in decimal?',
    options: [
      { t: '`1011`', why: 'That is the same digits read as decimal. In binary the places are 8, 4, 2, 1.' },
      { t: '`7`', why: '`7` is `0111`. `1011` has the 8 on.' },
      { t: '`11`', correct: true, why: '8 + 0 + 2 + 1 = 11.' },
      { t: '`13`', why: '`13` is `1101`: the middle bits are swapped.' },
    ],
  },
  {
    q: 'What is `12 & 10`? (12 is `1100`, 10 is `1010`.)',
    options: [
      { t: '`8`', correct: true, why: 'Only the 8s place is on in both: `1000`.' },
      { t: '`14`', why: '`14` (`1110`) is `12 | 10`: on in either.' },
      { t: '`6`', why: '`6` (`0110`) is `12 ^ 10`: on in exactly one.' },
      { t: '`22`', why: 'That is `12 + 10`. `&` works bit by bit and never carries.' },
    ],
  },
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
      { t: 'It throws an error', why: 'Typed arrays quietly convert values rather than throwing.' },
    ],
  },
  {
    q: 'Why does Viscosity use one `Float64Array` per field, instead of an array of objects?',
    options: [
      { t: 'Objects can’t hold numbers', why: 'They can. The point is how the numbers are laid out in memory.' },
      { t: 'Typed arrays can be resized as needed', why: 'The opposite: their length is fixed.' },
      { t: 'It is always faster, for every program', why: 'Not always: this repository’s benchmark shows columns losing badly when every particle must become a real object.' },
      { t: 'Each field becomes one packed block of 8-byte numbers, which is fast for loops that touch a few fields of many particles', correct: true, why: 'That is the struct-of-arrays layout. Whether it wins depends on how the program uses the data, which is what Viscosity analyses.' },
    ],
  },
];
