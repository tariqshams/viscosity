// Chapter 22 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ieee-parts': {
    q: 'What are the three parts of an IEEE 754 double, and how many bits does each get?',
    a: 'Sign (1 bit), exponent (11 bits), mantissa (52 bits): 64 bits in all.',
  },
  'engine-free': {
    q: 'The language says every number is a double. Why may an engine store some numbers differently?',
    a: 'Only the behaviour is fixed. Any representation is allowed as long as no program can tell the difference.',
  },
  'smi-what': {
    q: 'What is a **Smi** in V8?',
    a: 'A small integer stored directly in a pointer-sized slot, marked by a tag bit of 0 instead of being boxed.',
  },
  'heapnumber-what': {
    q: 'What is a **HeapNumber**, and name one value that needs one.',
    a: 'A heap object holding one double, used for numbers that aren’t Smis, e.g. `4.2`, `-0`, `NaN` or a huge integer.',
  },
  'heapnumber-update': {
    q: 'What happens when you change a value that is stored as a HeapNumber?',
    a: 'HeapNumbers are immutable, so V8 allocates a new one and the old one becomes garbage.',
  },
  'header-what': {
    q: 'What does a V8 object header hold?',
    a: 'A pointer to the hidden class (the shape), then pointers to the properties store and the elements store.',
  },
  'rep-what': {
    q: 'What is a **field representation**?',
    a: 'How the engine has decided to store one field (Smi, Double, Tagged, ...), recorded in the hidden class.',
  },
  'double-in-place': {
    q: 'Why can a field with the Double representation be updated without allocating?',
    a: 'Its value lives in a box only that object can see, so V8 can overwrite the box in place.',
  },
  'ts-field-undefined': {
    q: 'With a modern target, what value does a TypeScript field `x: number;` hold before the constructor body runs?',
    a: '`undefined`. It compiles to a real class field with no initializer.',
  },
  'generalize-cost': {
    q: 'Why did generalizing `x` to the Tagged representation make `p.x += 0.1` slow?',
    a: 'A Tagged field keeps doubles as immutable HeapNumbers, so every update allocates a new one.',
  },
};

export const examples = {
  'field-undefined': {
    title: 'A class field exists before the constructor',
    code: `class P {
  x;
  constructor(x) {
    console.log('before:', this.x);
    console.log('has x?', 'x' in this);
    this.x = x;
  }
}
const p = new P(0.5);
console.log('after:', p.x);`,
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
      '`Number.isInteger(n)` is `false` for fractions, `NaN` and `Infinity`.',
      '`-0 === 0` is `true`, so `===` can’t spot `-0`. Use `Object.is(n, -0)`.',
      'The range is `-(2 ** 30)` up to `2 ** 30 - 1`, inclusive at both ends.',
    ],
    walkthrough: `Three checks, in order:

- **Is it a whole number?** \`Number.isInteger\` rejects \`4.2\`, \`NaN\` and \`Infinity\` in one go.
- **Is it -0?** A Smi is a plain integer, and integers have only one zero. JavaScript's \`-0\` must keep its sign, so V8 stores it as a HeapNumber. Because \`-0 === 0\` is true, you need \`Object.is\` to tell them apart.
- **Is it in range?** 31 bits including the sign means 30 bits of size: from \`-(2 ** 30)\` to \`2 ** 30 - 1\`. Two's complement ranges are lopsided, with one more negative value than positive.

On a 64-bit build without pointer compression the range is wider (32-bit payloads), but the three checks are the same.`,
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
      'Write `exponentBits(x)` that returns the 11 raw exponent bits of the double `x`, as a number from 0 to 2047. For example `exponentBits(1)` is `1023`. Put `x` in a `Float64Array` and look at the same 8 bytes through a `Uint32Array`. Assume a little-endian machine, as in chapter 16: the high 32 bits are element `[1]`.',
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
      'The high 32 bits are: 1 sign bit, then 11 exponent bits, then the top 20 mantissa bits.',
      'Shift right by 20 to drop the mantissa bits: `u[1] >>> 20`.',
      'That leaves sign + exponent (12 bits). Mask with `0x7ff` (eleven 1s) to drop the sign.',
    ],
    walkthrough: `The double's 64 bits are split across two 32-bit words. On a little-endian machine, \`u[0]\` is the low word (all mantissa) and \`u[1]\` is the high word.

- The high word holds, from the top: 1 sign bit, 11 exponent bits, 20 mantissa bits.
- \`u[1] >>> 20\` throws away the 20 mantissa bits, leaving 12 bits: sign then exponent.
- \`& 0x7ff\` keeps only the low 11 bits, the exponent.

The exponent is stored with a bias of 1023, which is why 1 (2 to the 0) gives 1023, 2 gives 1024 and 0.5 gives 1022. Zero is special: all its exponent bits are 0.`,
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
    q: 'A TypeScript class declares `x: number;` and its constructor stores doubles into `x`. Why can updates to `p.x` allocate?',
    options: [
      { t: 'TypeScript adds a type check to every assignment', why: 'Types are erased; no checks run.' },
      { t: 'Class instances are always slower than object literals', why: 'The constructor-only class was as fast as object literals.' },
      { t: 'The field starts as `undefined`, so storing a double generalizes it to Tagged, which keeps doubles as immutable HeapNumbers', correct: true, why: 'This is what `--trace-generalization` showed: `h{Any}` to `t{Any}`.' },
      { t: 'Doubles can never be stored in object fields', why: 'They can: the Double representation does exactly that.' },
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
