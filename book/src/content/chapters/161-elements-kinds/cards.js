// Chapter 161 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ek-what': {
    q: 'What is an array’s *elements kind* in V8?',
    a: 'A label V8 keeps for each array saying what its indexed elements can hold: small integers, any numbers, or anything.',
  },
  'ek-three': {
    q: 'Name the three basic elements kinds, from most specific to most general.',
    a: 'SMI (small integers), DOUBLE (any number), ELEMENTS (any value).',
  },
  'ek-one-way': {
    q: 'An array of Smis gets `4.56` pushed, then that slot is overwritten with `4`. What is its elements kind now?',
    a: '`PACKED_DOUBLE_ELEMENTS`. Transitions only go towards more general kinds, never back.',
  },
  'ek-minus-zero': {
    q: 'Why does `push(-0)` move an array of small integers to a DOUBLE kind?',
    a: '`-0` is not a Smi: a Smi is an integer, and integers have no negative zero. Only a double can hold it.',
  },
  'ek-double-store': {
    q: 'How does a `PACKED_DOUBLE_ELEMENTS` array store its numbers?',
    a: 'As raw 64-bit doubles side by side in a FixedDoubleArray, not as pointers to boxed HeapNumbers.',
  },
  'ek-in-map': {
    q: 'Where does V8 record an array’s elements kind?',
    a: 'In its map (the shape). A kind change is a transition to another map, like adding a property.',
  },
  'ek-polymorphic': {
    q: 'A helper loops over arrays of Smis, doubles and strings. Why can it be slower than three helpers that each see one kind?',
    a: 'Its element loads see several kinds, so they must be ready for the most general one; the 2017 V8 post describes them as polymorphic, and in V8 12.4’s log the cache’s entry was replaced with each new kind.',
  },
  'ek-big-int': {
    q: 'In this Node build, which is the smallest positive integer that moves an array of Smis to DOUBLE?',
    a: '2³¹ (2147483648): a Smi here holds at most 2³¹ − 1.',
  },
};

export const examples = {
  'smi-test': {
    title: 'Which numbers are Smis?',
    code: `// The rule in this Node build: an
// integer, not -0, from -2**31 up
// to 2**31 - 1.
function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}
const vs = [7, -3, 0, -0, 0.5, NaN,
  Infinity, 2 ** 31 - 1, 2 ** 31,
  0 * -1, 6 / 2, 7 / 2];
for (const v of vs) {
  console.log(Object.is(v, -0)
    ? '-0' : v, isSmi(v));
}`,
  },
};

export const exercises = {
  kindOfWrites: {
    title: 'Follow the lattice',
    prompt:
      'An array starts as `[]` (which V8 reports as `PACKED_SMI_ELEMENTS`) and the values in `vs` are pushed onto it, in order. Write `kindOfWrites(vs)`, which returns the elements kind V8 reports afterwards: `\'PACKED_SMI_ELEMENTS\'`, `\'PACKED_DOUBLE_ELEMENTS\'` or `\'PACKED_ELEMENTS\'`. `isSmi` is given. Remember that the kind never moves back.',
    starter: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}

function kindOfWrites(vs) {
  const last = vs[vs.length - 1];
  if (!vs.length || isSmi(last)) {
    return 'PACKED_SMI_ELEMENTS';
  }
  return 'PACKED_DOUBLE_ELEMENTS';
}`,
    solution: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}

const NAMES = ['SMI_', 'DOUBLE_', ''];
function baseOf(v) {
  if (isSmi(v)) return 0;
  if (typeof v === 'number') return 1;
  return 2;
}
function kindOfWrites(vs) {
  let base = 0;
  for (const v of vs) {
    base = Math.max(base, baseOf(v));
  }
  return 'PACKED_' + NAMES[base] +
    'ELEMENTS';
}`,
    tests: `test('an empty array is SMI', () => {
  expect(kindOfWrites([]))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('small integers stay SMI', () => {
  expect(kindOfWrites([1, 2, 3]))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('one double moves it down', () => {
  expect(kindOfWrites([1, 4.56]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('there is no way back', () => {
  expect(kindOfWrites([1, 4.56, 4]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('-0, NaN and 2 ** 31 are doubles', () => {
  for (const v of [-0, NaN, 2 ** 31]) {
    expect(kindOfWrites([1, v]))
      .toBe('PACKED_DOUBLE_ELEMENTS');
  }
});
test('anything else is ELEMENTS, for good', () => {
  expect(kindOfWrites([1, 'x', 2]))
    .toBe('PACKED_ELEMENTS');
  expect(kindOfWrites([{}, 1.5]))
    .toBe('PACKED_ELEMENTS');
});`,
    hints: [
      'The kind depends on every value ever written, not only the last one. What single number could summarize "the most general kind so far"?',
      'Give each value a level: 0 for a Smi, 1 for any other number, 2 for anything else. The array’s level is the largest level seen so far.',
      'Write `baseOf(v)` (test `isSmi` first, then `typeof v === \'number\'`), keep `base = Math.max(base, baseOf(v))` in a loop, and build the name from `[\'SMI_\', \'DOUBLE_\', \'\'][base]`.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box says the kind after each write is the *join* of the old kind and the new value's kind, and that a join never moves back up. If you number the kinds 0 (SMI), 1 (DOUBLE) and 2 (ELEMENTS), the join is just the larger number, so the whole lattice becomes \`Math.max\`. What the starter gets wrong is looking only at the last value: the array remembers its history.

**The solution, line by line.**

- \`function isSmi(v) {\` and its three lines are given: an integer, not \`-0\`, inside the 32-bit range.
- \`const NAMES = ['SMI_', 'DOUBLE_', ''];\` holds the middle part of each name; the general kind is spelled \`PACKED_ELEMENTS\`, hence the empty string.
- \`function baseOf(v) {\` gives each value its own most specific kind.
- \`  if (isSmi(v)) return 0;\` comes first, because every Smi is also a \`number\`; testing \`typeof\` first would call \`1\` a double.
- \`  if (typeof v === 'number') return 1;\` catches every other number: fractions, \`-0\`, \`NaN\`, \`Infinity\`, big integers.
- \`  return 2;\` is everything else: strings, objects, \`undefined\`.
- \`}\` closes \`baseOf\`.
- \`function kindOfWrites(vs) {\` starts from \`[]\`, which is SMI.
- \`  let base = 0;\` is that starting kind.
- \`  for (const v of vs) {\` visits each pushed value in order.
- \`    base = Math.max(base, baseOf(v));\` is the join: the more general of the array's kind and the value's. Because \`max\` never decreases, pushing \`4\` after \`4.56\` leaves it at 1.
- \`  }\` ends the loop.
- \`  return 'PACKED_' + NAMES[base] +\` and \`'ELEMENTS';\` build the name; nothing here makes holes, so it is always PACKED.

**Common wrong attempts.**

- Looking only at the last value, as the starter does: \`[1, 4.56, 4]\` then comes out SMI, but V8 says DOUBLE.
- Testing \`typeof v === 'number'\` before \`isSmi\`: every array of integers comes out DOUBLE.
- Treating \`-0\` as a Smi because \`-0 === 0\` is \`true\`: \`===\` cannot tell them apart, which is why \`isSmi\` uses \`Object.is\`.`,
    wrong: [
      {
        code: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}
const NAMES = ['SMI_', 'DOUBLE_', ''];
function baseOf(v) {
  if (typeof v === 'number') return 1;
  if (isSmi(v)) return 0;
  return 2;
}
function kindOfWrites(vs) {
  let base = 0;
  for (const v of vs) {
    base = Math.max(base, baseOf(v));
  }
  return 'PACKED_' + NAMES[base] +
    'ELEMENTS';
}`,
        why: 'The checks in `baseOf` are in the wrong order. Every Smi is also a `number`, so `[1, 2, 3]` comes out as DOUBLE. Test for the most specific kind first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which line moves `const a = [1, 2, 3]` from a SMI kind to a DOUBLE kind?',
    options: [
      { t: '`a.push(4)`', why: '4 is a small integer, so it is a Smi and the kind stays SMI.' },
      { t: '`a.push(-0)`', correct: true, why: 'Negative zero is not an integer value a Smi can hold, so the array needs doubles.' },
      { t: '`a[1] = 7`', why: 'Overwriting with another small integer changes nothing.' },
      { t: '`a.length`', why: 'Reading the length doesn’t change the elements at all.' },
    ],
  },
  {
    q: '`const a = [1.5, 2]`, then `a[0] = 1`. What does V8 report?',
    options: [
      { t: '`PACKED_SMI_ELEMENTS`, because every element is now an integer', why: 'Kinds never move back up the lattice, even when the values would allow it.' },
      { t: '`HOLEY_DOUBLE_ELEMENTS`', why: 'No index was skipped, so there are no holes.' },
      { t: '`PACKED_DOUBLE_ELEMENTS`', correct: true, why: 'The literal started as DOUBLE because of 1.5, and it stays DOUBLE.' },
      { t: '`PACKED_ELEMENTS`', why: 'Only numbers were ever stored, so it never needed the general kind.' },
    ],
  },
  {
    q: 'Which pushed value keeps `[1, 2]` at `PACKED_SMI_ELEMENTS` in this Node build?',
    options: [
      { t: '`2 ** 31`', why: 'That is one past the largest Smi here, so it needs a double.' },
      { t: '`Infinity`', why: 'Infinity is a double, not an integer a Smi can hold.' },
      { t: '`2 ** 31 - 1`', correct: true, why: 'The largest Smi in this build; `%DebugPrint` still reports SMI.' },
      { t: '`0 * -1`', why: 'That is `-0`, which is a double.' },
    ],
  },
  {
    q: 'In `%DebugPrint` output, an array’s kind appears inside its map: `<Map[32](PACKED_SMI_ELEMENTS)>`. What does that tell you?',
    options: [
      { t: 'The elements kind is part of the array’s shape, so changing kind means a map transition', correct: true, why: 'The same output lists `(transition to HOLEY_SMI_ELEMENTS)` among the map’s transitions, like the property transitions of the shapes chapter.' },
      { t: 'Each element has its own map', why: 'The map belongs to the array object. The elements are stored in a separate backing store.' },
      { t: 'The kind is stored in every element’s tag bits', why: 'Smis do have a tag bit, but the kind is a property of the whole array, recorded once.' },
      { t: 'Maps are only used for arrays', why: 'Every heap object has a map; the shapes chapter met them for ordinary objects.' },
    ],
  },
  {
    q: 'Viscosity stores struct-of-arrays columns as `Float64Array`s. What does that mean for elements kinds?',
    options: [
      { t: 'A column starts as SMI and moves to DOUBLE on the first fraction', why: 'That is how a plain array behaves. A typed array has its own fixed kind.' },
      { t: 'Columns become holey when the program deletes an element', why: 'A typed array can’t have holes: every index below its length holds a number.' },
      { t: 'A column has one fixed kind, `FLOAT64ELEMENTS`, and never transitions', correct: true, why: '`%DebugPrint` reports `FLOAT64ELEMENTS` for a `Float64Array`, and its elements are always raw doubles.' },
      { t: 'Typed arrays always use the general ELEMENTS kind', why: 'They can only hold numbers of one type, so they get their own specialized kinds.' },
    ],
  },
];
