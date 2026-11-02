// Chapter 94 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ek-what': {
    q: 'What is an array’s *elements kind* in V8?',
    a: 'A label V8 keeps for each array saying what its indexed elements can hold (Smis, doubles or anything), and whether it may have holes.',
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
  'holey-what': {
    q: 'What is a hole in an array?',
    a: 'An index below `length` that has no element of its own, such as `xs[1]` in `[0, , 2]`.',
  },
  'holey-why': {
    q: 'Why is reading from a holey array more work than from a packed one?',
    a: 'A hole isn’t `undefined`: the read has to continue to the prototype chain, so the engine needs extra checks for holes.',
  },
  'holey-new-array': {
    q: '`const a = new Array(3)`, then all three slots are filled with integers. What is the kind?',
    a: '`HOLEY_SMI_ELEMENTS`. It started holey, and an array stays holey even after every hole is filled.',
  },
  'holey-avoid': {
    q: 'How do you build an array without ever making it holey?',
    a: 'Use a literal, or start from `[]` and `push` each value (or write each next index in order).',
  },
  'ek-polymorphic': {
    q: 'A helper loops over arrays of Smis, doubles and strings. Why can it be slower than three helpers that each see one kind?',
    a: 'Its element loads see several elements kinds, so they become polymorphic and must check which kind they have.',
  },
};

export const examples = {
  'hole-proto': {
    title: 'A hole reads through to the prototype',
    code: `const xs = [0, , 2];
console.log(xs.length);
console.log(Object.hasOwn(xs, 1));
console.log(xs[1]);

Array.prototype[1] = 'from proto';
console.log(xs[1]);
delete Array.prototype[1];`,
  },
};

export const exercises = {
  kindAfter: {
    title: 'Predict the elements kind',
    prompt:
      'Write `kindAfter(start, ops)`. `start` is the values of an array literal (no holes). `ops` is a list of steps: `[\'push\', v]` or `[\'set\', i, v]` (that is, `a[i] = v`). Return the elements kind V8 would report afterwards, as a string such as `\'PACKED_SMI_ELEMENTS\'`, `\'HOLEY_DOUBLE_ELEMENTS\'` or `\'PACKED_ELEMENTS\'`.\n\nRules: the kind only moves down the lattice SMI → DOUBLE → ELEMENTS, and once the array is holey it stays holey. A write to an index **greater** than the current length makes holes. `isSmi` is given: in Node’s 64-bit build a Smi is a 32-bit integer that isn’t `-0`.',
    starter: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}

function kindAfter(start, ops) {
  // track the base kind, holes, length
  return 'PACKED_SMI_ELEMENTS';
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

function kindAfter(start, ops) {
  let base = 0;
  for (const v of start) {
    base = Math.max(base, baseOf(v));
  }
  let holey = false;
  let len = start.length;
  for (const [op, a, b] of ops) {
    const i = op === 'push' ? len : a;
    const v = op === 'push' ? a : b;
    if (i > len) holey = true;
    len = Math.max(len, i + 1);
    base = Math.max(base, baseOf(v));
  }
  const p = holey
    ? 'HOLEY_' : 'PACKED_';
  return p + NAMES[base] + 'ELEMENTS';
}`,
    tests: `test('a literal of small ints', () => {
  expect(kindAfter([1, 2, 3], []))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('a double moves it down', () => {
  expect(kindAfter([1, 2, 3], [['push', 4.56]]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('there is no way back', () => {
  const ops = [['push', 4.56], ['set', 3, 4]];
  expect(kindAfter([1, 2, 3], ops))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('a string makes it general', () => {
  expect(kindAfter([1, 2], [['push', 'x']]))
    .toBe('PACKED_ELEMENTS');
  expect(kindAfter([1], [['set', 0, {}]]))
    .toBe('PACKED_ELEMENTS');
});
test('-0, NaN and big ints are doubles', () => {
  expect(kindAfter([3, 2, 1], [['push', -0]]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
  expect(kindAfter([1], [['push', NaN]]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
  expect(kindAfter([1, 2], [['push', 2 ** 31]]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('writing past the end makes holes', () => {
  expect(kindAfter([1, 2, 3], [['set', 9, 1]]))
    .toBe('HOLEY_SMI_ELEMENTS');
});
test('writing at the end does not', () => {
  const ops = [['set', 0, 1], ['set', 1, 2]];
  expect(kindAfter([], ops))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('filling the holes keeps it holey', () => {
  const ops = [['set', 5, 'a']];
  for (let i = 1; i < 5; i++) ops.push(['set', i, 1]);
  expect(kindAfter([1], ops))
    .toBe('HOLEY_ELEMENTS');
});
test('a double literal starts as DOUBLE', () => {
  expect(kindAfter([1.5], []))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});`,
    hints: [
      'Keep three things: the base kind as a number (0 = SMI, 1 = DOUBLE, 2 = ELEMENTS), a `holey` flag, and the current length.',
      'For each value, work out its own base (Smi, other number, anything else) and keep the **maximum** so far. Taking the maximum is what makes transitions one-way.',
      'For `push`, the index is the current length. For `set`, it is `i`. If the index is greater than the length, set `holey`. Either way the new length is `max(len, i + 1)`.',
    ],
    walkthrough: `Every case in the tests was checked against real V8: Node v22.23.4 (V8 12.4), \`%DebugPrint\`, the same operations.

\`\`\`js
function baseOf(v) {
  if (isSmi(v)) return 0;
  if (typeof v === 'number') return 1;
  return 2;
}
\`\`\`

- **Each value has a most specific kind it fits.** Smis fit everywhere, other numbers need at least DOUBLE, everything else needs ELEMENTS. The order matters: every Smi is also a number, so test \`isSmi\` first.

\`\`\`js
base = Math.max(base, baseOf(v));
\`\`\`

- **The lattice is a maximum.** The kind after a write is the more general of "what the array was" and "what the new value needs". Because \`max\` never goes down, overwriting \`4.56\` with \`4\` leaves the array DOUBLE, exactly as V8 does.

\`\`\`js
const i = op === 'push' ? len : a;
if (i > len) holey = true;
len = Math.max(len, i + 1);
\`\`\`

- **Holes come from skipping indices.** Writing at \`len\` (which is all \`push\` does) extends the array without a gap. Writing beyond it leaves the indices in between empty. \`holey\` is never reset, which is the second one-way rule.

\`\`\`js
const NAMES = ['SMI_', 'DOUBLE_', ''];
\`\`\`

- **The names.** The general kind is spelled \`PACKED_ELEMENTS\`, not \`PACKED__ELEMENTS\`, hence the empty string.`,
    wrong: [
      {
        code: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}
function baseOf(v) {
  if (isSmi(v)) return 'SMI_';
  if (typeof v === 'number') {
    return 'DOUBLE_';
  }
  return '';
}
function kindAfter(start, ops) {
  const all = [...start];
  for (const [op, a, b] of ops) {
    if (op === 'push') all.push(a);
    else all[a] = b;
  }
  let k = 'SMI_';
  for (const v of all) {
    if (v === undefined) continue;
    const b = baseOf(v);
    if (b !== 'SMI_') k = b;
  }
  const h = all.length > all.filter(
    (v) => v !== undefined).length;
  return (h ? 'HOLEY_' : 'PACKED_') +
    k + 'ELEMENTS';
}`,
        why: 'This looks at the values the array holds *now*. V8 remembers history: after `4.56` is overwritten with `4`, every value is a Smi, but the kind is still DOUBLE. Filling every hole doesn’t make it packed again either.',
      },
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
function kindAfter(start, ops) {
  let base = 0;
  for (const v of start) {
    base = Math.max(base, baseOf(v));
  }
  let holey = false;
  let len = start.length;
  for (const [op, a, b] of ops) {
    const i = op === 'push' ? len : a;
    const v = op === 'push' ? a : b;
    if (i > len) holey = true;
    len = Math.max(len, i + 1);
    base = Math.max(base, baseOf(v));
  }
  const p = holey
    ? 'HOLEY_' : 'PACKED_';
  return p + NAMES[base] + 'ELEMENTS';
}`,
        why: 'The checks in `baseOf` are in the wrong order. Every Smi is also a `number`, so `[1, 2, 3]` comes out as DOUBLE. Test for the most specific kind first.',
      },
    ],
  },
  joinKinds: {
    optional: true,
    title: 'The join of two kinds',
    prompt:
      'A function that sees arrays of two kinds needs code general enough for both. Write `join(a, b)`, which takes two kind names and returns the most specific kind both can move to: the more general base, holey if either is holey. For example `join(\'PACKED_SMI_ELEMENTS\', \'HOLEY_DOUBLE_ELEMENTS\')` is `\'HOLEY_DOUBLE_ELEMENTS\'`.',
    starter: `function join(a, b) {
  return a;
}`,
    solution: `const NAMES = ['SMI_', 'DOUBLE_', ''];
function parse(k) {
  const holey = k.startsWith('HOLEY');
  let base = 2;
  if (k.includes('SMI')) base = 0;
  if (k.includes('DOUBLE')) base = 1;
  return { holey, base };
}
function join(a, b) {
  const x = parse(a);
  const y = parse(b);
  const h = x.holey || y.holey;
  const base = Math.max(x.base, y.base);
  return (h ? 'HOLEY_' : 'PACKED_') +
    NAMES[base] + 'ELEMENTS';
}`,
    tests: `test('same kind joins to itself', () => {
  expect(join('PACKED_SMI_ELEMENTS',
    'PACKED_SMI_ELEMENTS'))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('the more general base wins', () => {
  expect(join('PACKED_SMI_ELEMENTS',
    'PACKED_DOUBLE_ELEMENTS'))
    .toBe('PACKED_DOUBLE_ELEMENTS');
  expect(join('PACKED_ELEMENTS',
    'PACKED_DOUBLE_ELEMENTS'))
    .toBe('PACKED_ELEMENTS');
});
test('holey wins', () => {
  expect(join('HOLEY_SMI_ELEMENTS',
    'PACKED_DOUBLE_ELEMENTS'))
    .toBe('HOLEY_DOUBLE_ELEMENTS');
  expect(join('PACKED_ELEMENTS',
    'HOLEY_SMI_ELEMENTS'))
    .toBe('HOLEY_ELEMENTS');
});
test('order does not matter', () => {
  expect(join('PACKED_DOUBLE_ELEMENTS',
    'HOLEY_SMI_ELEMENTS'))
    .toBe('HOLEY_DOUBLE_ELEMENTS');
});`,
    hints: [
      'Turn each name into `{ holey, base }`, with base 0, 1 or 2 as in the core exercise.',
      'Holey if either is holey; base is the maximum of the two. Then build the name again.',
    ],
    walkthrough: `In the lattice picture, the join is the first box you can reach from both starting boxes by following arrows (down and to the right).

\`\`\`js
const h = x.holey || y.holey;
const base = Math.max(x.base, y.base);
\`\`\`

- **Two independent one-way axes.** The base and the holeyness move separately, so the join takes the more general of each. That is why the grid has two directions.
- **\`parse\` checks \`DOUBLE\` after \`SMI\`** so that each name gets exactly one base; names with neither are the general ELEMENTS kinds.`,
    wrong: [
      {
        code: `function join(a, b) {
  return a > b ? a : b;
}`,
        why: 'Comparing the names as strings has nothing to do with the lattice. `\'PACKED_SMI_ELEMENTS\' > \'HOLEY_DOUBLE_ELEMENTS\'`, so this would drop both the holes and the doubles.',
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
    q: 'Why does V8 track packed and holey arrays separately?',
    options: [
      { t: 'Holey arrays use less memory, so V8 prefers them', why: 'A hole still takes a slot in the backing store. The distinction is about how reads behave.' },
      { t: 'Reading a hole has to continue to the prototype chain, so holey arrays need extra checks', correct: true, why: 'In a packed array every index below the length has its own element, so a read can skip those checks.' },
      { t: 'Holey arrays can only hold strings', why: 'Every base kind has a holey variant: SMI, DOUBLE and ELEMENTS.' },
      { t: 'Holes make the array’s length wrong', why: 'The length counts holes. `[0, , 2].length` is 3.' },
    ],
  },
  {
    q: 'Which way of building an array of three numbers ends up packed?',
    options: [
      { t: '`const a = new Array(3)`, then fill indices 0, 1, 2', why: '`new Array(3)` starts holey, and filling the holes doesn’t make it packed again.' },
      { t: '`const a = []`, then `a[2] = 3; a[1] = 2; a[0] = 1`', why: 'Writing index 2 first skips 0 and 1, which makes holes.' },
      { t: '`const a = []`, then `a[5] = 1` and `a.length = 3`', why: 'The write at 5 already made the array holey.' },
      { t: '`const a = []`, then three `push` calls', correct: true, why: 'Each push writes at the current length, so no index is ever skipped.' },
    ],
  },
  {
    q: 'In `%DebugPrint` output, an array’s kind appears inside its map: `<Map[32](PACKED_SMI_ELEMENTS)>`. What does that tell you?',
    options: [
      { t: 'The elements kind is part of the array’s shape, so changing kind means a map transition', correct: true, why: 'The same output lists `(transition to HOLEY_SMI_ELEMENTS)` among the map’s transitions, like the property transitions of chapter 92.' },
      { t: 'Each element has its own map', why: 'The map belongs to the array object. The elements are stored in a separate backing store.' },
      { t: 'The kind is stored in every element’s tag bits', why: 'Smis do have a tag bit, but the kind is a property of the whole array, recorded once.' },
      { t: 'Maps are only used for arrays', why: 'Every heap object has a map; chapter 92 met them as shapes of ordinary objects.' },
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
