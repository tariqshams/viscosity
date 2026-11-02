// Chapter 55 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ieee-parts': {
    q: 'What are the three parts of an IEEE 754 double, and how many bits does each get?',
    a: 'Sign (1 bit), exponent (11 bits), fraction or mantissa (52 bits): 64 bits in all.',
  },
  'engine-free': {
    q: 'The language says every number is a double. Why may an engine store some numbers differently?',
    a: 'Only the behaviour is fixed. Any storage is allowed as long as no program can tell the difference.',
  },
  'smi-what': {
    q: 'What is a **Smi** in V8?',
    a: 'A small integer stored directly in a pointer-sized slot, instead of being boxed on the heap.',
  },
  'tag-bit': {
    q: 'How does V8 tell a Smi from a pointer when it looks at a slot?',
    a: 'By the lowest bit: 0 means a Smi (the integer is in the slot), 1 means a pointer to a heap object.',
  },
  'heapnumber-what': {
    q: 'What is a **HeapNumber**? Name one value that needs one.',
    a: 'A heap object holding one double, used for numbers that are not Smis, e.g. `4.2`, `-0`, `NaN` or a huge integer.',
  },
  'heapnumber-update': {
    q: 'What happens when you change a number stored as a HeapNumber?',
    a: 'HeapNumbers are immutable, so V8 allocates a new one, and the old one becomes garbage.',
  },
  'header-what': {
    q: 'What does a V8 object header hold?',
    a: 'A pointer to the hidden class (the shape), then pointers to the properties store and the elements store.',
  },
  'shared-shape': {
    q: 'Two objects are built the same way, `{ x, n }`. What do they share, and what does each have its own copy of?',
    a: 'They share one hidden class (shape); each has its own header and its own field slots.',
  },
};

export const examples = {
  tag: {
    title: 'Tagging a small integer',
    code: `const tag = (n) => n << 1;
const isSmi = (s) => (s & 1) === 0;
const value = (s) => s >> 1;

const slot = tag(42);
console.log(slot);
console.log(isSmi(slot));
console.log(value(slot));
console.log(value(tag(-5)));
// a made-up pointer: odd
console.log(isSmi(4097));`,
  },
};

export const exercises = {
  smiFits: {
    title: 'Would this be a Smi?',
    prompt:
      'Assume V8 with pointer compression, where a Smi carries 31 bits including the sign: integers from −2^30 to 2^30 − 1. Write `smiFits(n)` that returns `true` if the number `n` could be stored as a Smi, and `false` if it would need a HeapNumber. Remember that `-0` is not a Smi.',
    starter: `function smiFits(n) {
  // your code here
}

console.log(smiFits(42), smiFits(4.2));`,
    solution: `function smiFits(n) {
  if (!Number.isInteger(n)) {
    return false;
  }
  if (Object.is(n, -0)) return false;
  const lo = -(2 ** 30);
  const hi = 2 ** 30 - 1;
  return n >= lo && n <= hi;
}`,
    tests: `test('small integers fit', () => {
  expect(smiFits(42)).toBe(true);
  expect(smiFits(0)).toBe(true);
  expect(smiFits(-42)).toBe(true);
});
test('fractions do not', () => {
  expect(smiFits(4.2)).toBe(false);
});
test('the edges of the range', () => {
  expect(smiFits(2 ** 30 - 1)).toBe(true);
  expect(smiFits(2 ** 30)).toBe(false);
  expect(smiFits(-(2 ** 30))).toBe(true);
  expect(smiFits(-(2 ** 30) - 1)).toBe(false);
});
test('-0, NaN and Infinity do not', () => {
  expect(smiFits(-0)).toBe(false);
  expect(smiFits(NaN)).toBe(false);
  expect(smiFits(Infinity)).toBe(false);
});`,
    hints: [
      'There are three ways to miss: not a whole number, minus zero, and too big or too small. Which built-in tells you a number is whole?',
      '`Number.isInteger(n)` is `false` for fractions, `NaN` and `Infinity`. For minus zero, `-0 === 0` is `true`, so use `Object.is(n, -0)` instead.',
      'The range is from `-(2 ** 30)` up to `2 ** 30 - 1`, both ends included: `return n >= lo && n <= hi;`.',
    ],
    walkthrough: `**How to think about it.** A Smi is a whole number that fits in 31 bits, sign included, and the chapter gave three ways for a number to miss: it has a fraction (or is \`NaN\` or \`Infinity\`), it is \`-0\`, or it is outside the range. So the function is three checks, each of which can say "no" early, and if all three pass the answer is "yes". Before writing it, work out the range: 31 bits with the sign leaves 30 bits for the size, so the smallest is \`-(2 ** 30)\` and the largest is \`2 ** 30 - 1\` (one fewer, because zero takes one of the non-negative patterns, the same lopsidedness as the signed integers in the chapter on bits and bytes).

**The solution, line by line.**

- \`if (!Number.isInteger(n)) {\` asks "is this not a whole number?". \`Number.isInteger\` is \`false\` for \`4.2\`, and also for \`NaN\` and \`Infinity\`, so one check handles all three.
- \`return false;\` such a number needs a HeapNumber.
- \`if (Object.is(n, -0)) return false;\` catches minus zero. It passed the first check (\`-0\` counts as an integer), but an integer has only one zero, so \`-0\` must keep its sign bit in a HeapNumber. \`===\` cannot spot it, because \`-0 === 0\` is \`true\`; \`Object.is\` compares the exact value.
- \`const lo = -(2 ** 30);\` and \`const hi = 2 ** 30 - 1;\` name the two ends of the range, so the last line reads clearly.
- \`return n >= lo && n <= hi;\` is \`true\` exactly when \`n\` is inside, both ends included.

So \`smiFits(42)\` is \`true\`, \`smiFits(4.2)\` is \`false\` at the first check, \`smiFits(-0)\` is \`false\` at the second, and \`smiFits(2 ** 30)\` is \`false\` at the last. On a 64-bit build without pointer compression the range is wider (32-bit payloads), but the three checks are the same.

**Common wrong attempts.**

- Leaving out the \`-0\` check: \`-0\` passes \`Number.isInteger\` and the range test, so the function wrongly says \`true\`.
- A symmetric check, \`Math.abs(n) <= 2 ** 30\`, gets the top edge wrong: \`2 ** 30\` itself is one too big, while \`-(2 ** 30)\` fits.
- Testing \`n === -0\`: it is also \`true\` for ordinary \`0\`, so \`0\` would be rejected.`,
    wrong: [
      {
        code: `function smiFits(n) {
  if (!Number.isInteger(n)) {
    return false;
  }
  return n >= -(2 ** 30) &&
    n <= 2 ** 30 - 1;
}`,
        why: 'This forgets `-0`. It passes `Number.isInteger` and the range check, but it can’t be a Smi: integers have no negative zero.',
      },
      {
        code: `function smiFits(n) {
  if (!Number.isInteger(n)) {
    return false;
  }
  if (Object.is(n, -0)) return false;
  return Math.abs(n) <= 2 ** 30;
}`,
        why: 'The range is lopsided: `2 ** 30` itself is one too big, while `-(2 ** 30)` fits. A symmetric `Math.abs` check gets the top edge wrong.',
      },
    ],
  },
  exponentBits: {
    optional: true,
    title: 'Read a double’s exponent bits',
    prompt:
      'Write `exponentBits(x)` that returns the 11 raw exponent bits of the double `x`, as a number from 0 to 2047. For example `exponentBits(1)` is `1023`. Put `x` in a `Float64Array` and look at the same 8 bytes through a `Uint32Array`. Assume a little-endian machine, as in chapter 32: the high 32 bits are element `[1]`.',
    starter: `function exponentBits(x) {
  const f = new Float64Array([x]);
  const u = new Uint32Array(f.buffer);
  // your code here
}

console.log(exponentBits(1));`,
    solution: `function exponentBits(x) {
  const f = new Float64Array([x]);
  const u = new Uint32Array(f.buffer);
  return (u[1] >>> 20) & 0x7ff;
}`,
    tests: `test('1 has exponent 1023', () => {
  expect(exponentBits(1)).toBe(1023);
});
test('powers of two step the exponent', () => {
  expect(exponentBits(2)).toBe(1024);
  expect(exponentBits(0.5)).toBe(1022);
});
test('the sign bit is not included', () => {
  expect(exponentBits(-1)).toBe(1023);
});
test('zero has exponent bits 0', () => {
  expect(exponentBits(0)).toBe(0);
});
test('1.5 has the same exponent as 1', () => {
  expect(exponentBits(1.5)).toBe(1023);
});`,
    hints: [
      'Look at the high 32 bits, `u[1]`. From the top they hold 1 sign bit, then the 11 exponent bits, then 20 fraction bits.',
      'Shifting right by 20 (`u[1] >>> 20`) drops the 20 fraction bits, leaving the sign and the exponent.',
      'Mask with `0x7ff` (eleven 1 bits) to keep only the exponent: `return (u[1] >>> 20) & 0x7ff;`.',
    ],
    walkthrough: `**How to think about it.** A double's 64 bits are too many for JavaScript's 32-bit bit operators, so we look at them as two 32-bit halves: a \`Float64Array\` and a \`Uint32Array\` over the same buffer (the two views from the chapter on typed arrays). On a little-endian machine the low half comes first, so \`u[0]\` is all fraction bits and \`u[1]\` is the high half: sign, exponent, then the top 20 fraction bits. From there it is the shift-and-mask pattern from the chapter on bits: shift the wanted bits down to the bottom, then mask off everything above them.

**The solution, line by line.**

- \`const f = new Float64Array([x]);\` puts \`x\` into 8 bytes of a fresh buffer.
- \`const u = new Uint32Array(f.buffer);\` lays a second view over the same 8 bytes, as two unsigned 32-bit numbers. Nothing is copied.
- \`return (u[1] >>> 20) & 0x7ff;\` first shifts the high half right by 20, which throws away the 20 fraction bits and leaves 12 bits (the sign on top, the exponent below it). \`>>>\` is the unsigned shift, so the sign bit does not spread. Then \`& 0x7ff\` keeps only the lowest 11 bits, the exponent, and drops the sign.

The exponent is stored with 1023 added, which is why 1 (two to the power 0) gives 1023, 2 gives 1024 and 0.5 gives 1022. \`-1\` gives 1023 too, because the sign is not part of the exponent, and zero is the special case with all exponent bits 0.

**Common wrong attempts.**

- Leaving off the mask: the sign bit comes along, so \`-1\` gives 3071 (1023 plus 2048) instead of 1023.
- Reading \`u[0]\`: on a little-endian machine that is the low half, which holds only fraction bits, all zero for these test values.`,
    wrong: [
      {
        code: `function exponentBits(x) {
  const f = new Float64Array([x]);
  const u = new Uint32Array(f.buffer);
  return u[1] >>> 20;
}`,
        why: 'Without the mask, the sign bit comes along: `-1` gives 3071 instead of 1023.',
      },
      {
        code: `function exponentBits(x) {
  const f = new Float64Array([x]);
  const u = new Uint32Array(f.buffer);
  return (u[0] >>> 20) & 0x7ff;
}`,
        why: '`u[0]` is the low word on a little-endian machine: it holds only mantissa bits, which are all 0 for these test values.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In V8, how is the number `42` most likely stored in a variable?',
    options: [
      { t: 'As a HeapNumber on the heap, with the variable holding its address', why: 'That is for numbers that aren’t Smis, like `4.2`.' },
      { t: 'As a Smi, directly in the slot, with a tag bit of 0', correct: true, why: 'Small integers fit in the slot itself, so nothing needs allocating.' },
      { t: 'As a string, converted back when needed', why: 'Numbers are never stored as text.' },
      { t: 'As four separate bytes in an ArrayBuffer', why: 'Plain variables don’t live in ArrayBuffers.' },
    ],
  },
  {
    q: 'Which of these values does V8 store as a HeapNumber, not a Smi?',
    options: [
      { t: '`0`', why: '`0` is a small integer, so it is a Smi.' },
      { t: '`-42`', why: 'Small negative integers are Smis too.' },
      { t: '`-0`', correct: true, why: 'Integers have only one zero; `-0` must remember its sign, so it is a HeapNumber.' },
      { t: '`1000`', why: 'Well inside the Smi range.' },
    ],
  },
  {
    q: '`let b = 4.2; b = b + 1;` What happens to the HeapNumber holding `4.2`?',
    options: [
      { t: 'It is overwritten in place with `5.2`', why: 'HeapNumbers are immutable, so they can’t be overwritten.' },
      { t: 'It becomes a Smi', why: '`5.2` isn’t an integer either.' },
      { t: 'Nothing: `b + 1` is never computed', why: 'It is computed; the question is where the result goes.' },
      { t: 'A new HeapNumber holding `5.2` is allocated; the old one becomes garbage', correct: true, why: 'Every change to an immutable box means a new box.' },
    ],
  },
  {
    q: 'What sits at the very start of every V8 object?',
    options: [
      { t: 'A pointer to its hidden class', correct: true, why: 'The first word points to the hidden class (shape), followed by the properties and elements pointers.' },
      { t: 'Its first property’s value', why: 'Properties come after the header.' },
      { t: 'Its length in bytes', why: 'Size information lives in the hidden class, not as the first word.' },
      { t: 'Nothing: objects are just their fields', why: 'Every object has a header before its fields.' },
    ],
  },
  {
    q: 'Why don’t `Float64Array` columns suffer from any of these representation problems?',
    options: [
      { t: 'They are converted to Smis', why: 'A Float64Array stores doubles, not Smis.' },
      { t: 'They store raw 64-bit doubles side by side, with no tags, boxes or per-element headers', correct: true, why: 'There is no per-element representation to generalize.' },
      { t: 'They are slower, so the problem doesn’t show', why: 'They are the fast option.' },
      { t: 'V8 copies them to WebAssembly', why: 'Typed arrays are ordinary JavaScript objects.' },
    ],
  },
];
