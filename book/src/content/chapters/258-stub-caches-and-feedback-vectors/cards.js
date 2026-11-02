// Chapter 253 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 87, 258.

export const prompts = {
  'poly-what': {
    q: 'What does **polymorphic** mean, and what was its limit in the V8 inside Node 22?',
    a: 'Several shapes have been seen at one site; up to four (max_valid_polymorphic_map_count defaults to 4).',
  },
  'mega-what': {
    q: 'What does a **megamorphic** access do instead of keeping its own entries?',
    a: 'It uses the stub cache, a table shared by all megamorphic loads that maps a shape and a name to a handler.',
  },
  'log-letters': {
    q: 'In `--log-ic` output, what do `0`, `1`, `P` and `N` mean?',
    a: 'Uninitialised, monomorphic, polymorphic and megamorphic.',
  },
  'count-shapes': {
    q: 'A site sees shape A a thousand times, then shape B once. What state is it in?',
    a: 'Polymorphic: the states count different shapes (two here), not accesses.',
  },
  'eight-calls': {
    q: 'Why did the experiments call `getX` ten times per shape rather than five?',
    a: 'In Node 22 a function gets its feedback vector only after about eight calls; shapes seen before that are never recorded.',
  },
  'stub-shared': {
    q: 'Why does a megamorphic site give Maglev or TurboFan nothing to specialise on?',
    a: 'It keeps no shapes of its own; the stub cache is shared by every megamorphic load, so it says nothing about what this site sees.',
  },
  'mixin-mega': {
    q: 'Why can a `super.m()` call inside a mixin become megamorphic?',
    a: 'Each use of the mixin creates a new class, so the one call site meets a new shape every time.',
  },
  'poly-ok': {
    q: 'Should you worry about a site that sees two or three shapes?',
    a: 'Usually not: it is polymorphic, not megamorphic. Worry about the hot loops, and keep those monomorphic.',
  },
  'holey-what': {
    q: 'What is a hole in an array?',
    a: 'An index below `length` that has no element of its own, such as `xs[1]` in `[0, , 2]`.',
  },
  'hole-not-undefined': {
    q: '`xs[1]` reads `undefined` both for `[0, , 2]` and for `[0, undefined, 2]`. What is different?',
    a: 'Only the second has an own element at 1 (`Object.hasOwn(xs, 1)` is true); the first has a hole, and its read went on to the prototype chain.',
  },
  'holey-why': {
    q: 'Why is reading from a holey array more work than from a packed one?',
    a: 'A hole is not `undefined`: the read has to continue to the prototype chain, so the engine needs extra checks for holes.',
  },
  'holey-new-array': {
    q: '`const a = new Array(3)`, then all three slots are filled with integers. What is the kind?',
    a: '`HOLEY_SMI_ELEMENTS`. It started holey, and an array stays holey even after every hole is filled.',
  },
  'holey-fill': {
    q: 'In Node 22 (V8 12.4), is `new Array(3).fill(0)` packed?',
    a: 'No: `%DebugPrint` reports `HOLEY_SMI_ELEMENTS`. The 2025 change that makes `fill` an exception is too recent for this version.',
  },
  'holey-avoid': {
    q: 'How do you build an array without ever making it holey?',
    a: 'Use a literal, or start from `[]` and `push` each value (or write each next index in order).',
  },
  'holey-one-way': {
    q: 'Which two one-way rules together decide an array’s elements kind?',
    a: 'The base only becomes more general (SMI → DOUBLE → ELEMENTS), and PACKED only becomes HOLEY.',
  },
  'holes-log': {
    q: 'What did `--log-ic` add to the line for a load that read a hole?',
    a: 'The modifier `.HOLES`: the cache records that this load may meet holes.',
  },
};

export const examples = {
  'mono-vs-mega': {
    title: 'One shape against twenty',
    code: `function sumA(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
function sumB(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
const one = [], many = [];
for (let i = 0; i < 1000; i++) {
  one.push({ x: i, k: 0 });
  const o = { x: i };
  o['k' + (i % 20)] = 0; // 20 shapes
  many.push(o);
}
function time(sum, xs) {
  const t = performance.now();
  for (let r = 0; r < 3000; r++) {
    sum(xs);
  }
  const ms = performance.now() - t;
  return ms.toFixed(1) + ' ms';
}
for (let k = 0; k < 2; k++) {
  console.log('1 shape: ',
    time(sumA, one));
  console.log('20 shapes:',
    time(sumB, many));
}
// The numbers are your device's.`,
  },
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
  icStates: {
    title: 'From monomorphic to megamorphic',
    prompt: 'Simulate V8’s IC states. `icStates(seq)` gets the shapes reaching one access site, in order (for example `["A", "A", "B"]`). Return the state after each access: `"1"` if one shape has been seen, `"P"` for two to four, and `"N"` once a fifth different shape arrives. Once `"N"`, it stays `"N"`.',
    starter: `function icStates(seq) {
  const seen = new Set();
  return seq.map((s) => {
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    solution: `function icStates(seq) {
  const seen = new Set();
  let mega = false;
  return seq.map((s) => {
    if (mega) return 'N';
    const fresh = !seen.has(s);
    if (fresh && seen.size === 4) {
      mega = true;
      return 'N';
    }
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    tests: `test('one shape stays monomorphic', () => {
  expect(icStates(['A', 'A', 'A']))
    .toEqual(['1', '1', '1']);
});
test('the chapter run: five shapes', () => {
  const out = icStates(['A', 'B', 'C', 'D', 'E']);
  expect(out).toEqual(['1', 'P', 'P', 'P', 'N']);
});
test('old shapes do not count twice', () => {
  const seq = ['A', 'B', 'A', 'C', 'B', 'D', 'A'];
  expect(icStates(seq)).toEqual(
    ['1', 'P', 'P', 'P', 'P', 'P', 'P']);
});
test('megamorphic is for good', () => {
  const seq = ['A', 'B', 'C', 'D', 'E', 'A', 'A'];
  expect(icStates(seq).slice(4))
    .toEqual(['N', 'N', 'N']);
});`,
    hints: [
      'Keep a `Set` of the shapes seen so far, and a flag for “gone megamorphic”.',
      'A shape already in the set changes nothing. A *new* shape when the set already holds four is the fifth: go megamorphic.',
      'Once the flag is set, return `"N"` straight away for every later access.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box is the whole specification: the state depends on how many *different* shapes have arrived, and once a fifth arrives the site is megamorphic for good. So you need to remember two things between accesses: the set of shapes seen so far, and whether the site has already given up. Then each access is a short series of questions, asked in the right order.

**The solution, line by line.**

- \`const seen = new Set();\` holds the different shapes seen; a \`Set\` ignores repeats, which is exactly "different shapes".
- \`let mega = false;\` records whether the site has given up.
- \`return seq.map((s) => {\` turns each arriving shape into the state after it.
- \`if (mega) return 'N';\` comes first: once megamorphic, nothing else matters.
- \`const fresh = !seen.has(s);\` asks whether this shape is new to the site.
- \`if (fresh && seen.size === 4) {\` catches the fifth different shape: four are already listed, and this is a new one.
- \`mega = true;\` and \`return 'N';\` give up, for good. Notice the fifth shape is never added to \`seen\`: a megamorphic site keeps no list at all.
- \`}\` ends that case.
- \`seen.add(s);\` records the shape (adding one already there changes nothing).
- \`return seen.size === 1 ? '1' : 'P';\` gives monomorphic for one shape, polymorphic for two to four.
- \`});\` ends the \`map\`.

Trace the second test: A gives \`1\`; B, C and D each give \`P\` (two, three, four shapes); E finds four already listed and is new, so \`N\`, which is the real \`--log-ic\` run's \`1, P, P, P, N\`.

**Common wrong attempts.**

- Counting accesses instead of different shapes: a site that sees shape A a hundred times would wrongly turn megamorphic, which the first and third tests catch.
- Checking \`seen.size > 4\` *after* adding: that works for the fifth shape, but forgetting the \`mega\` flag means a later access with an old shape (A again) drops back to \`P\`, which the last test catches.`,
    wrong: [
      {
        code: `function icStates(seq) {
  let n = 0;
  return seq.map(() => {
    n++;
    if (n === 1) return '1';
    return n <= 4 ? 'P' : 'N';
  });
}`,
        why: 'This counts accesses, not different shapes. A site that sees shape A a hundred times is still monomorphic.',
      },
    ],
  },
  kindAfter: {
    title: 'Predict the elements kind',
    prompt: `Write \`kindAfter(start, ops)\`. \`start\` is the values of an array literal (no holes). \`ops\` is a list of steps: \`['push', v]\` or \`['set', i, v]\` (that is, \`a[i] = v\`). Return the elements kind V8 would report afterwards, as a string such as \`'PACKED_SMI_ELEMENTS'\`, \`'HOLEY_DOUBLE_ELEMENTS'\` or \`'PACKED_ELEMENTS'\`.

Rules: the kind only moves down the lattice SMI → DOUBLE → ELEMENTS, and once the array is holey it stays holey. A write to an index **greater** than the current length makes holes. \`isSmi\` is given: in Node’s 64-bit build a Smi is a 32-bit integer that isn’t \`-0\`.`,
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
    walkthrough: `**How to think about it.** There are two one-way rules, and they are independent: the *base* (SMI, DOUBLE, ELEMENTS) only becomes more general, and *holey* only goes from false to true. So keep three things as you replay the operations: the base as a number (0, 1, 2, so that "more general" is \`Math.max\`), a \`holey\` flag that is never reset, and the current length, because a write makes holes exactly when it lands *beyond* the length. Every case in the tests was checked against real V8 (Node v22.23.4, V8 12.4, \`%DebugPrint\`, the same operations).

**The solution, line by line.**

- \`function isSmi(v) {\` and its body are given: an integer, not \`-0\`, inside the 32-bit range.
- \`const NAMES = ['SMI_', 'DOUBLE_', ''];\` is the middle part of each name (the general kind is \`PACKED_ELEMENTS\`, hence the empty string).
- \`function baseOf(v) {\` gives each value its most specific base: \`if (isSmi(v)) return 0;\` first, because every Smi is also a \`number\`; then \`if (typeof v === 'number') return 1;\`; then \`return 2;\` for anything else.
- \`function kindAfter(start, ops) {\` replays the history.
- \`  let base = 0;\` and the loop \`for (const v of start) { base = Math.max(base, baseOf(v)); }\` give the literal its starting base: \`[1.5]\` starts as DOUBLE.
- \`  let holey = false;\` because a literal without holes starts packed.
- \`  let len = start.length;\` tracks the length.
- \`  for (const [op, a, b] of ops) {\` replays each step, split into its name and operands.
- \`    const i = op === 'push' ? len : a;\` works out the index written: \`push\` always writes at the current length.
- \`    const v = op === 'push' ? a : b;\` and the value.
- \`    if (i > len) holey = true;\` is the hole rule: writing past the end skips the indices in between. Writing *at* \`len\` does not.
- \`    len = Math.max(len, i + 1);\` grows the length if the write was at or past the end.
- \`    base = Math.max(base, baseOf(v));\` is the lattice rule.
- \`  }\` ends the loop.
- \`  const p = holey ? 'HOLEY_' : 'PACKED_';\` (over two lines) and \`return p + NAMES[base] + 'ELEMENTS';\` build the name.

**Common wrong attempts.**

- Looking at the values the array holds *now*: after \`4.56\` is overwritten with \`4\` every value is a Smi, but the kind is still DOUBLE, and filling every hole does not make the array packed again. V8 remembers history.
- Testing \`typeof v === 'number'\` before \`isSmi\`: \`[1, 2, 3]\` then comes out DOUBLE.
- Treating \`i >= len\` as a hole: then every \`push\` would make one.`,
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
    prompt: 'A function that sees arrays of two kinds needs code general enough for both. Write `join(a, b)`, which takes two kind names and returns the most specific kind both can move to: the more general base, holey if either is holey. For example `join(\'PACKED_SMI_ELEMENTS\', \'HOLEY_DOUBLE_ELEMENTS\')` is `\'HOLEY_DOUBLE_ELEMENTS\'`.',
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
    walkthrough: `**How to think about it.** In the six-kinds grid, the join of two kinds is the first box you can reach from both by following arrows (down, or to the right). The two directions are independent, so take the more general of each: the larger base, and holey if either is holey. The only work is turning names into numbers and back.

**The solution, line by line.**

- \`const NAMES = ['SMI_', 'DOUBLE_', ''];\` as before.
- \`function parse(k) {\` turns a name into \`{ holey, base }\`.
- \`  const holey = k.startsWith('HOLEY');\` reads the first half of the name.
- \`  let base = 2;\` assumes the general kind, then \`if (k.includes('SMI')) base = 0;\` and \`if (k.includes('DOUBLE')) base = 1;\` correct it; a name contains at most one of the two.
- \`  return { holey, base };\` and \`}\`.
- \`function join(a, b) {\` parses both names into \`x\` and \`y\`.
- \`  const h = x.holey || y.holey;\` holey wins.
- \`  const base = Math.max(x.base, y.base);\` the more general base wins.
- \`  return (h ? 'HOLEY_' : 'PACKED_') + NAMES[base] + 'ELEMENTS';\` rebuilds the name.

**Common wrong attempts.**

- Comparing the names as strings (\`a > b ? a : b\`): alphabetical order has nothing to do with the lattice, and \`'PACKED_SMI_ELEMENTS' > 'HOLEY_DOUBLE_ELEMENTS'\` would lose both the holes and the doubles.
- Taking the holeyness from one argument and the base from the other: the test with \`HOLEY_SMI\` and \`PACKED_DOUBLE\` needs both.`,
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
    q: 'In the five-shape `--log-ic` run, which line shows the access becoming megamorphic?',
    options: [
      {
        t: '`LoadIC 1:29 0 1 x`',
        why: 'That is the first shape: uninitialised to monomorphic.',
      },
      {
        t: '`LoadIC 1:29 1 P x`',
        why: 'That is the second shape: monomorphic to polymorphic.',
      },
      {
        t: '`LoadIC 1:29 P N x`',
        correct: true,
        why: 'The fifth shape exceeded the limit of four, so the state went from P to N.',
      },
      {
        t: '`LoadIC 1:29 P P x`',
        why: 'Still polymorphic: a third or fourth shape was added to the list.',
      },
    ],
  },
  {
    q: 'What does a megamorphic access use instead of its own list of shapes?',
    options: [
      {
        t: 'The object’s dictionary',
        why: 'The object is still a fast object; it is the access site that gave up.',
      },
      {
        t: 'The stub cache, shared by all megamorphic loads, keyed by shape and name',
        correct: true,
        why: 'V8’s source describes the stub cache as mapping a map and a name to a handler.',
      },
      {
        t: 'The constant pool',
        why: 'The constant pool holds the name `"x"`, not shapes or handlers.',
      },
    ],
  },
  {
    q: 'Five AST node classes all set `this.type` first. Why is `n.type` in `kindOf` megamorphic?',
    options: [
      {
        t: 'Because `type` is at a different offset in each class',
        why: 'It is field 0 in all of them; the offset is not the issue.',
      },
      {
        t: 'Because objects of different classes have different maps, so the site sees five shapes',
        correct: true,
        why: 'And five is more than the limit of four.',
      },
      {
        t: 'Because `kindOf` is an arrow function',
        why: 'Arrow functions get inline caches like any other function.',
      },
      {
        t: 'Because strings are slow to read',
        why: 'The value being a string has nothing to do with the state of the load.',
      },
    ],
  },
  {
    q: 'A site sees shapes A, B, A, C, B, D, A, in that order. What state is it in at the end?',
    options: [
      {
        t: 'Megamorphic: seven accesses',
        why: 'The states count different shapes, not accesses.',
      },
      {
        t: 'Monomorphic: A came most often',
        why: 'Any second shape makes it polymorphic.',
      },
      {
        t: 'Polymorphic: four different shapes',
        correct: true,
        why: 'A, B, C and D: exactly the limit, not past it.',
      },
    ],
  },
  {
    q: 'Which change is most worth making for speed?',
    options: [
      {
        t: 'A helper used in three places, seeing three shapes, rewritten into three copies',
        why: 'Three shapes is polymorphic, which is fine unless it is very hot.',
      },
      {
        t: 'A hot particle loop whose objects are built in two places in two key orders, changed to build them one way',
        correct: true,
        why: 'The loop is hot, and one way of building gives every access in it one shape.',
      },
      {
        t: 'Every object in the program given the same keys',
        why: 'Unnecessary and unreadable; only the hot code’s sites matter.',
      },
    ],
  },
  {
    q: 'Why does V8 track packed and holey arrays separately?',
    options: [
      {
        t: 'Holey arrays use less memory, so V8 prefers them',
        why: 'A hole still takes a slot in the backing store. The distinction is about how reads behave.',
      },
      {
        t: 'Reading a hole has to continue to the prototype chain, so holey arrays need extra checks',
        correct: true,
        why: 'In a packed array every index below the length has its own element, so a read can skip those checks.',
      },
      {
        t: 'Holey arrays can only hold strings',
        why: 'Every base kind has a holey variant: SMI, DOUBLE and ELEMENTS.',
      },
      {
        t: 'Holes make the array’s length wrong',
        why: 'The length counts holes. `[0, , 2].length` is 3.',
      },
    ],
  },
  {
    q: 'Which way of building an array of three numbers ends up packed?',
    options: [
      {
        t: '`const a = new Array(3)`, then fill indices 0, 1, 2',
        why: '`new Array(3)` starts holey, and filling the holes does not make it packed again.',
      },
      {
        t: '`const a = []`, then `a[2] = 3; a[1] = 2; a[0] = 1`',
        why: 'Writing index 2 first skips 0 and 1, which makes holes.',
      },
      {
        t: '`const a = []`, then three `push` calls',
        correct: true,
        why: 'Each push writes at the current length, so no index is ever skipped.',
      },
      {
        t: '`new Array(3).fill(0)`',
        why: 'In V8 12.4 that is still `HOLEY_SMI_ELEMENTS`.',
      },
    ],
  },
  {
    q: 'After `Array.prototype[1] = \'p\'`, what does `[0, , 2][1]` read?',
    options: [
      {
        t: '`undefined`, because the array has nothing at 1',
        why: 'It has no *own* element there, so the read continues to the prototype, which now has one.',
      },
      {
        t: '`\'p\'`',
        correct: true,
        why: 'The hole sends the read along the prototype chain, and `Array.prototype` has an element 1.',
      },
      {
        t: 'A TypeError',
        why: 'Reading a missing index is never an error in JavaScript.',
      },
    ],
  },
  {
    q: '`const a = [1.5, 2]`, then `a[5] = \'x\'`. What does V8 report?',
    options: [
      {
        t: '`PACKED_ELEMENTS`',
        why: 'Index 5 is past the length of 2, so indices 2 to 4 are holes.',
      },
      {
        t: '`HOLEY_DOUBLE_ELEMENTS`',
        why: 'A string needs the general base, ELEMENTS.',
      },
      {
        t: '`HOLEY_ELEMENTS`',
        correct: true,
        why: 'Both rules fire: the string moves the base to ELEMENTS, and the skipped indices make it holey.',
      },
    ],
  },
  {
    q: 'Viscosity stores struct-of-arrays columns as `Float64Array`s. What does that mean for holes?',
    options: [
      {
        t: 'A column becomes holey when an element is deleted',
        why: 'A typed array cannot have holes: every index below its length holds a number.',
      },
      {
        t: 'There are none: a typed array has a fixed kind, such as `FLOAT64ELEMENTS`, and every index holds a number',
        correct: true,
        why: 'So a loop over a column never needs hole checks.',
      },
      {
        t: 'Columns start holey and are packed once filled',
        why: 'That is not how plain arrays behave in V8 12.4 either, and typed arrays have no holes at all.',
      },
    ],
  },
];
