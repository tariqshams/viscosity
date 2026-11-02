// Chapter 48 cards. Keys are stable ids: never rename them.

export const prompts = {
  'memory-what': {
    q: 'What is a good one-line picture of a computer’s memory (RAM)?',
    a: 'One enormous array of bytes.',
  },
  'address-what': {
    q: 'What is an **address**?',
    a: 'The index of a byte in memory: its position in that giant array.',
  },
  'byte-holds': {
    q: 'How much does the byte at one address hold?',
    a: 'One whole number from 0 to 255 (8 bits). Bigger values take several neighbouring bytes.',
  },
  'contig-what': {
    q: 'What does it mean for values to be **contiguous**?',
    a: 'They are stored side by side in memory, with no gaps between them.',
  },
  'f64-addr': {
    q: 'A `Float64Array` starts at address 1000. At what address does element 3 start?',
    a: '1000 + 3 × 8 = 1024, because each element takes 8 bytes.',
  },
  'int32-addr': {
    q: 'An `Int32Array` starts at address 100. Where does element 5 start, and why is the step different from a `Float64Array`’s?',
    a: '100 + 5 × 4 = 120: each Int32 element takes 4 bytes, not 8.',
  },
  'why-instant': {
    q: 'Why does writing `xs[999999]` of a `Float64Array` take no longer than writing `xs[0]`?',
    a: 'The elements are contiguous, so the address is worked out with one multiply and one add; nothing is searched.',
  },
  'byteoffset': {
    q: 'What does a typed array’s `byteOffset` tell you?',
    a: 'The byte in its ArrayBuffer where its first element starts: the nearest thing to an address JavaScript shows you.',
  },
};

export const examples = {
  'columns-in-one-buffer': {
    title: 'Two columns in one buffer',
    code: `const n = 3;
const buf = new ArrayBuffer(2 * n * 8);
// x uses bytes 0..23, vx bytes 24..47
const x = new Float64Array(buf, 0, n);
const vx = new Float64Array(buf, 24, n);

function where(col, i) {
  const s = col.BYTES_PER_ELEMENT;
  return col.byteOffset + i * s;
}

for (let i = 0; i < n; i++) {
  console.log('x', i, where(x, i));
}
for (let i = 0; i < n; i++) {
  console.log('vx', i, where(vx, i));
}`,
  },
};

export const exercises = {
  fieldAddr: {
    title: 'Address of a field in a packed buffer',
    prompt:
      'Particles are packed into one `Float64Array` that starts at address `base`. Each particle has 6 fields (`x, y, vx, vy, mass, health`, numbered 0 to 5), stored one particle after another, 8 bytes per field. Write `fieldAddr(base, i, f)` that returns the address of field `f` of particle `i`.',
    starter: `function fieldAddr(base, i, f) {
  // your code here
}

// mass (field 4) of particle 2:
console.log(fieldAddr(0, 2, 4)); // 128`,
    solution: `function fieldAddr(base, i, f) {
  const k = i * 6 + f;
  return base + k * 8;
}`,
    tests: `test('first field of the first particle', () => {
  expect(fieldAddr(1000, 0, 0)).toBe(1000);
});
test('y of particle 0', () => {
  expect(fieldAddr(0, 0, 1)).toBe(8);
});
test('x of particle 1 comes after 6 fields', () => {
  expect(fieldAddr(0, 1, 0)).toBe(48);
});
test('mass of particle 2', () => {
  expect(fieldAddr(0, 2, 4)).toBe(128);
});
test('base is added once', () => {
  expect(fieldAddr(64, 3, 5)).toBe(64 + 23 * 8);
});`,
    hints: [
      'Do it in two steps: first find which *element* of the array you want, then turn that into a byte address.',
      'Particle `i` starts at element `i * 6`, because every particle before it took 6 elements; field `f` is `f` elements further on.',
      'Multiply that element number by 8 (bytes per element), then add `base` once, at the end.',
    ],
    walkthrough: `**How to think about it.** Picture the array as a long row of 8-byte elements, and count before you calculate. Particle 0 takes elements 0 to 5, particle 1 takes 6 to 11, particle 2 takes 12 to 17, so particle \`i\` starts at element \`i * 6\`. Inside a particle the fields come in order, so field \`f\` is \`f\` elements past the particle's start. That gives an *element number*; the question asks for an *address*, which counts bytes, so finish with the formula from the chapter: base plus element number times element size.

**The solution, line by line.**

- \`function fieldAddr(base, i, f) {\` takes the start address, the particle number and the field number.
- \`  const k = i * 6 + f;\` is the element number. For particle 2's mass (field 4) it is \`2 * 6 + 4 = 16\`: twelve elements for the two particles before it, then four more.
- \`  return base + k * 8;\` turns elements into bytes (16 × 8 = 128) and adds where the array starts. With \`base\` 0 that is 128, the answer the starter prints.
- \`}\` closes the function.

Check the last test by hand: particle 3, field 5 is element \`3 * 6 + 5 = 23\`, so its address is \`64 + 23 * 8\`, which is what the test expects.

This layout has a name in the book's benchmark, \`aos-packed\`: the same order as an array of objects, but with no objects and no arrows, only numbers in a row. You will meet it again when we count which bytes a loop really fetches.

**Common wrong attempts.**

- \`base + i * 6 + f\` forgets that addresses count bytes: it is the element number plus the base, eight times too small (particle 1's \`x\` comes out as 6 instead of 48).
- \`(base + i * 6 + f) * 8\` multiplies the base too. The base is already a byte address, so only the element number is scaled; with \`base\` 1000 this gives 8000 for the very first field.
- \`base + (i + f) * 8\` adds the field to the particle number as if each particle took one element; it ignores that every particle is 6 elements long.`,
    wrong: [
      {
        code: `function fieldAddr(base, i, f) {
  return base + i * 6 + f;
}`,
        why: 'This is the element number plus the base, but addresses count *bytes*. Each element is 8 bytes, so multiply `(i * 6 + f)` by 8.',
      },
      {
        code: `function fieldAddr(base, i, f) {
  return (base + i * 6 + f) * 8;
}`,
        why: 'The base is already a byte address, so it must not be multiplied by 8. Only the element number is.',
      },
      {
        code: `function fieldAddr(base, i, f) {
  return base + (i + f) * 8;
}`,
        why: 'Each particle is 6 elements long, not 1, so particle `i` starts at element `i * 6`.',
      },
    ],
  },
  elemAt: {
    optional: true,
    title: 'Which element is at this address?',
    prompt:
      'Work the formula backwards. A typed array starts at address `base`, and each element takes `size` bytes. Write `elemAt(base, size, a)` that returns the index of the element whose bytes include address `a`. (You may assume `a` is inside the array.)',
    starter: `function elemAt(base, size, a) {
  // your code here
}

// Float64Array at 1000; byte 1029:
// 3:
console.log(elemAt(1000, 8, 1029));`,
    solution: `function elemAt(base, size, a) {
  const into = a - base;
  return Math.floor(into / size);
}`,
    tests: `test('the first byte is element 0', () => {
  expect(elemAt(1000, 8, 1000)).toBe(0);
});
test('the start of element 3', () => {
  expect(elemAt(1000, 8, 1024)).toBe(3);
});
test('a byte inside element 3', () => {
  expect(elemAt(1000, 8, 1031)).toBe(3);
});
test('4-byte elements', () => {
  expect(elemAt(100, 4, 121)).toBe(5);
});
test('one-byte elements', () => {
  expect(elemAt(0, 1, 37)).toBe(37);
});`,
    hints: [
      'First work out how many bytes `a` is past the start of the array.',
      'That distance is some whole number of elements plus a few leftover bytes. Dividing by `size` tells you how many whole elements fit.',
      '`Math.floor((a - base) / size)` drops the leftover part.',
    ],
    walkthrough: `**How to think about it.** The chapter's formula goes from an index to an address: \`a = base + i * size\`. Here you have the address and want the index, so undo each step in reverse order: first take away the \`base\`, then divide by \`size\`. The only twist is that \`a\` may land in the *middle* of an element (byte 1029 is five bytes into element 3, which covers 1024 to 1031), so the division will not always come out whole, and you want to round down to the element it falls in.

**The solution, line by line.**

- \`function elemAt(base, size, a) {\` takes the start, the element size and the address.
- \`  const into = a - base;\` is how far into the array the address is, in bytes. For 1029 with a base of 1000 that is 29.
- \`  return Math.floor(into / size);\` divides by the element size (29 / 8 = 3.625) and rounds down to 3, because bytes 24 to 31 of the array all belong to element 3.
- \`}\` closes the function.

With one-byte elements (\`size\` 1) the answer is the distance itself, which is how a \`Uint8Array\` works: index and byte offset are the same number.

**Common wrong attempts.**

- \`Math.floor(a / size)\` forgets to take away the base, so it answers "which element would this be if the array started at address 0" (125 instead of 3).
- \`Math.round(into / size)\` rounds 3.625 *up* to 4, putting the last bytes of each element in the next one.`,
    wrong: [
      {
        code: `function elemAt(base, size, a) {
  return Math.floor(a / size);
}`,
        why: 'This forgets to subtract `base` first, so it measures from address 0 instead of from the start of the array.',
      },
      {
        code: `function elemAt(base, size, a) {
  const into = a - base;
  return Math.round(into / size);
}`,
        why: 'Rounding to the nearest whole number sends the second half of each element to the next index; round down with `Math.floor`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `Float64Array` starts at address 200. Where does element 5 start?',
    options: [
      { t: '205', why: 'That steps one byte per element, but each element of a Float64Array takes 8 bytes.' },
      { t: '240', correct: true, why: '200 + 5 × 8 = 240. Contiguous 8-byte elements make this a multiply and an add.' },
      { t: '1640', why: 'That is (200 + 5) × 8: it multiplies the start address too. Only the index is scaled by the element size.' },
      { t: 'You can’t know without searching the array', why: 'Typed array elements are contiguous, so the position can be computed directly.' },
    ],
  },
  {
    q: 'What does one address in memory name?',
    options: [
      { t: 'One variable, whatever its size', why: 'A variable can take many bytes; it is found by the address of its first byte.' },
      { t: 'One bit', why: 'Addresses count bytes, groups of 8 bits, not single bits.' },
      { t: 'One byte, holding a number from 0 to 255', correct: true, why: 'Memory is an array of bytes, and an address is an index into it.' },
      { t: 'One object', why: 'Objects take many bytes, and most addresses are in the middle of something.' },
    ],
  },
  {
    q: 'Which word describes how a Float64Array’s elements are stored?',
    options: [
      { t: 'Contiguous', correct: true, why: 'The elements sit side by side in one block, with no gaps.' },
      { t: 'Scattered', why: 'That describes objects created one at a time, which can end up anywhere.' },
      { t: 'Aliased', why: 'Aliasing is about two names for one object, not about layout.' },
      { t: 'Sorted', why: 'Sorting is about the values; contiguous is about where they are stored.' },
    ],
  },
  {
    q: 'An `Int32Array` (4 bytes per element) starts at address 100. Which element contains address 113?',
    options: [
      { t: 'Element 13', why: 'That would be true for one-byte elements starting at 100.' },
      { t: 'Element 28', why: 'That divides the whole address by 4 without taking away the start.' },
      { t: 'Element 4', why: 'Element 4 starts at 116, after address 113.' },
      { t: 'Element 3', correct: true, why: '113 − 100 = 13 bytes in; 13 / 4 is 3 and a bit, so it is inside element 3 (bytes 112 to 115).' },
    ],
  },
  {
    q: 'Why is reading element 999,999 of a big `Float64Array` as fast as reading element 0?',
    options: [
      { t: 'The engine remembers where every element is in a list', why: 'No list is needed: the address is computed from the index.' },
      { t: 'The address is start + index × 8, one multiply and one add', correct: true, why: 'Contiguous, equal-sized elements make the position a sum.' },
      { t: 'Typed arrays are stored on disk', why: 'They live in memory like everything else a running program uses.' },
      { t: 'It is not: the engine counts along from element 0', why: 'Counting along would make long arrays slow; nothing is counted.' },
    ],
  },
];
