// Chapter 53 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ieee-parts': {
    q: 'What are the three parts of an IEEE 754 double, and how many bits does each get?',
    a: 'Sign (1 bit), exponent (11 bits), fraction or mantissa (52 bits): 64 bits in all.',
  },
  'tag-bit': {
    q: 'How does V8 tell a Smi from a pointer when it looks at a tagged slot?',
    a: 'By the lowest bit: 0 means a Smi (the integer is in the slot), 1 means a pointer to a heap object.',
  },
  'heapnumber-what': {
    q: 'In V8, what is a **HeapNumber**? Name one value that needs one.',
    a: 'A heap object holding one double, used for numbers that are not Smis, e.g. `4.2`, `-0`, `NaN` or a huge integer.',
  },
  'heapnumber-update': {
    q: 'In V8, what happens when you change a number stored as a HeapNumber?',
    a: 'HeapNumbers are immutable, so V8 allocates a new one, and the old one becomes garbage.',
  },
  'header-what': {
    q: 'What does a V8 object header hold?',
    a: 'A pointer to the hidden class (the shape), then pointers to the properties store and the elements store.',
  },
  'widen-only': {
    q: 'In V8, a field has the Double representation and then receives `7`. Does it go back to Smi?',
    a: 'No. A field only widens; `7` is stored as the double 7.0 and the field stays Double.',
  },
  'null-start': {
    q: 'In V8, why is `{ start: null }` a bad start for a field that will hold times from `performance.now()`?',
    a: '`null` makes it a heap-object field; the first double then widens it to Tagged, so every new time is a fresh HeapNumber.',
  },
  'ts-field-undefined': {
    q: 'With an ES2022 or later target, what does a TypeScript field `x: number;` hold before the constructor body runs?',
    a: '`undefined`. It compiles to a real class field with no starting value.',
  },
  'declare-emits': {
    q: 'What JavaScript does TypeScript emit for `declare x: number;` in a class?',
    a: 'Nothing. The field only appears when the constructor first assigns it.',
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
    optional: true,
    title: 'Would this be a Smi?',
    prompt: 'Assume V8 with pointer compression, where a Smi carries 31 bits including the sign: integers from −2^30 to 2^30 − 1. Write `smiFits(n)` that returns `true` if the number `n` could be stored as a Smi, and `false` if it would need a HeapNumber. Remember that `-0` is not a Smi.',
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
    prompt: 'Write `exponentBits(x)` that returns the 11 raw exponent bits of the double `x`, as a number from 0 to 2047. For example `exponentBits(1)` is `1023`. Put `x` in a `Float64Array` and look at the same 8 bytes through a `Uint32Array`. Assume the machine stores the low byte first, as most do (the chapter on floats and typed arrays; this order is called *little-endian*): the high 32 bits are element `[1]`.',
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
  track: {
    title: 'Climb the ladder',
    prompt: 'Model a field\'s representation. Write `track(vals)`, which is given the values stored into one field, in order, and returns where the field ends up: `\'none\'` (nothing stored yet), `\'smi\'`, `\'double\'`, `\'heap\'` or `\'tagged\'`. A value\'s kind is `\'smi\'` for a whole number from `-(2 ** 30)` to `2 ** 30 - 1` that is not `-0`; `\'double\'` for any other number; `\'heap\'` for anything that is not a number. Widening: `none` becomes the new kind; the same kind stays; `smi` with `double` gives `double`; every other mix gives `tagged`.',
    starter: `function track(vals) {
  let rep = 'none';
  // for each value: widen rep
  return rep;
}

console.log(track([1, 1.5]));`,
    solution: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  const small = Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 30) && v < 2 ** 30;
  return small ? 'smi' : 'double';
}
function widen(a, b) {
  if (a === 'none') return b;
  if (a === b) return a;
  const num = (r) =>
    r === 'smi' || r === 'double';
  if (num(a) && num(b)) return 'double';
  return 'tagged';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) {
    rep = widen(rep, kind(v));
  }
  return rep;
}`,
    tests: `test('nothing stored yet', () => {
  expect(track([])).toBe('none');
});
test('small integers stay Smi', () => {
  expect(track([1, 2, 3])).toBe('smi');
});
test('a fraction widens to double', () => {
  expect(track([1, 1.5, 7])).toBe('double');
});
test('-0 and 2 ** 30 are not Smis', () => {
  expect(track([-0])).toBe('double');
  expect(track([2 ** 30])).toBe('double');
});
test('non-numbers are heap objects', () => {
  expect(track([undefined])).toBe('heap');
  expect(track(['a', {}])).toBe('heap');
});
test('null then a double is tagged', () => {
  expect(track([null, 0.5])).toBe('tagged');
});
test('it never widens back down', () => {
  expect(track([0.5, undefined, 1]))
    .toBe('tagged');
});`,
    hints: [
      'Split it in two small helpers: `kind(v)`, the kind of one value, and `widen(a, b)`, where a field at rung `a` ends up after receiving a value of kind `b`. Then `track` is a loop.',
      '`kind`: `typeof v !== \'number\'` means `\'heap\'`. For a number, it is a Smi when `Number.isInteger(v)`, it is not `-0` (use `Object.is`), and it is in range; otherwise `\'double\'`.',
      '`widen`: if `a` is `\'none\'`, return `b`; if `a === b`, return `a`; if both are number kinds (`smi` or `double`), return `\'double\'`; otherwise `\'tagged\'`. Then `track` does `rep = widen(rep, kind(v))` for each value.',
    ],
    walkthrough: `**How to think about it.** The ladder in the chapter has two separate questions in it, and the exercise gets much easier if you answer them separately. First: what kind of value is this one? (That depends only on the value.) Second: given where the field already is, and the kind of the new value, where does the field go? (That depends only on the two rungs.) Write one small function for each, and \`track\` becomes a loop that keeps asking the second question. Try one by hand: \`[1, 1.5, 7]\` starts at none; \`1\` is a Smi, so the field is Smi; \`1.5\` is a double, and Smi with Double is Double; \`7\` is a Smi, and Double with Smi is still Double.

**The solution, line by line.**

- \`function kind(v) {\` answers the first question.
- \`if (typeof v !== 'number') {\` and \`return 'heap';\`: anything that is not a number (\`undefined\`, \`null\`, a string, an object) is a heap object.
- \`const small = Number.isInteger(v) &&\` starts the Smi test: it must be a whole number (this also rules out \`NaN\` and \`Infinity\`),
- \`!Object.is(v, -0) &&\` must not be minus zero (which \`===\` cannot spot, since \`-0 === 0\`),
- \`v >= -(2 ** 30) && v < 2 ** 30;\` and must fit in 31 bits with the sign. (\`v < 2 ** 30\` is the same as \`v <= 2 ** 30 - 1\` for whole numbers.)
- \`return small ? 'smi' : 'double';\` any number that fails the test is a double.
- \`function widen(a, b) {\` answers the second question.
- \`if (a === 'none') return b;\`: the first value decides the first rung.
- \`if (a === b) return a;\`: the same kind again changes nothing.
- \`const num = (r) =>\` and \`r === 'smi' || r === 'double';\` is a tiny helper: is this rung one of the two number rungs?
- \`if (num(a) && num(b)) return 'double';\`: two different number kinds meet at Double, whichever came first. That is the "never back down" rule: a Double field receiving a Smi stays Double.
- \`return 'tagged';\` covers every other mix: a number with a heap object, or anything with Tagged.
- \`function track(vals) {\`, \`let rep = 'none';\` start with nothing stored.
- \`for (const v of vals) {\` and \`rep = widen(rep, kind(v));\` move the field up the ladder, one value at a time.
- \`return rep;\` is where it ended up.

So \`track([null, 0.5])\` goes none, then heap (for \`null\`), then Tagged (heap with double), which is the \`{ start: null }\` story from the chapter; and \`track([0.5, undefined, 1])\` goes Double, then Tagged, and stays Tagged when \`1\` arrives.

**Common wrong attempts.**

- Setting \`rep = kind(v)\` without widening forgets the history: \`[1, 1.5, 7]\` would end at Smi because the last value is \`7\`. A representation describes *every* value the field has held, not the latest.
- Treating every integer as a Smi: \`-0\` and \`2 ** 30\` are integers by \`Number.isInteger\`, but neither is a Smi.
- Making Smi with heap give heap: a field that has held both a number and \`undefined\` can only be described by Tagged.`,
    wrong: [
      {
        code: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  return Number.isInteger(v)
    ? 'smi' : 'double';
}
function widen(a, b) {
  if (a === 'none') return b;
  if (a === b) return a;
  const num = (r) =>
    r === 'smi' || r === 'double';
  if (num(a) && num(b)) return 'double';
  return 'tagged';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) {
    rep = widen(rep, kind(v));
  }
  return rep;
}`,
        why: 'Every integer is called a Smi here, so `-0` and `2 ** 30` come out as `\'smi\'`. A Smi must also not be `-0` and must fit in 31 bits.',
      },
      {
        code: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  const small = Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 30) && v < 2 ** 30;
  return small ? 'smi' : 'double';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) rep = kind(v);
  return rep;
}`,
        why: 'This only remembers the last value. `[1, 1.5, 7]` ends at `\'smi\'`, but the field has held a fraction, so it must be `\'double\'`: a field never widens back down.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these values does V8 store as a HeapNumber, not a Smi?',
    options: [
      {
        t: '`0`',
        why: '`0` is a small integer, so it is a Smi.',
      },
      {
        t: '`-42`',
        why: 'Small negative integers are Smis too.',
      },
      {
        t: '`-0`',
        correct: true,
        why: 'Integers have only one zero; `-0` must remember its sign, so it is a HeapNumber.',
      },
      {
        t: '`1000`',
        why: 'Well inside the Smi range.',
      },
    ],
  },
  {
    q: 'What sits at the very start of every V8 object?',
    options: [
      {
        t: 'A pointer to its hidden class',
        correct: true,
        why: 'The first word points to the hidden class (shape), followed by the properties and elements pointers.',
      },
      {
        t: 'Its first property’s value',
        why: 'Properties come after the header.',
      },
      {
        t: 'Its length in bytes',
        why: 'Size information lives in the hidden class, not as the first word.',
      },
      {
        t: 'Nothing: objects are just their fields',
        why: 'Every object has a header before its fields.',
      },
    ],
  },
  {
    q: 'In V8, an object field has held `1`, then `2.5`, then `3`. Which representation does it have now?',
    options: [
      {
        t: 'Smi, because the last value is a small integer',
        why: 'A field does not go back down; it describes every value it has held.',
      },
      {
        t: 'Double',
        correct: true,
        why: '`2.5` widened it from Smi to Double, and `3` fits a Double field.',
      },
      {
        t: 'Tagged',
        why: 'Every value was a number, so Double covers them all; Tagged is for a mix with non-numbers.',
      },
    ],
  },
  {
    q: 'A TypeScript class compiled for ES2022 or later declares `x: number;`, and its constructor stores doubles into `x`. In V8, why can `p.x += 0.1` allocate?',
    options: [
      {
        t: 'TypeScript adds a type check to every assignment',
        why: 'Types are erased; no checks run at all.',
      },
      {
        t: 'Class instances are always slower than object literals',
        why: 'The constructor-only class was as fast as the object literals.',
      },
      {
        t: 'The field starts as `undefined`, so the first double widens it to Tagged, which keeps doubles as immutable HeapNumbers',
        correct: true,
        why: 'This is what `--trace-generalization` printed: `h{Any}` to `t{Any}`.',
      },
      {
        t: 'Doubles can never be stored in object fields',
        why: 'They can: that is what the Double representation is for.',
      },
    ],
  },
];
