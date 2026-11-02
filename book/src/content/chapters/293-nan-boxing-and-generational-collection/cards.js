// Chapter 162 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'nan-room': {
    q: 'Why is there room inside the NaNs of a double to store other values?',
    a: 'Any double with an all-ones exponent and a non-zero fraction is a NaN, which is a vast number of bit patterns, and arithmetic only produces one or two of them.',
  },
  'nan-canonical': {
    q: 'Why must a NaN-boxing VM store every real NaN in one canonical form?',
    a: 'A NaN that happened to carry the “boxed” bits would be misread as none, a boolean or an object.',
  },
  'nan-js-payload': {
    q: 'A NaN-boxing VM written in JavaScript cannot put a pointer in a double. What would its object payload be instead?',
    a: 'An index into an array that holds the objects.',
  },
  'nan-test': {
    q: 'In this chapter’s scheme, how do you tell whether a slot holds a number?',
    a: 'Mask the high word with `BOX`: if the result is not `BOX`, it is a number.',
  },
  'gen-hypothesis': {
    q: 'What is the generational hypothesis?',
    a: 'Most objects die young: they become unreachable soon after they are allocated.',
  },
  'write-barrier': {
    q: 'Why does a generational collector need a write barrier?',
    a: 'A minor collection does not trace old objects, so it must be told which old objects point at young ones; the barrier records them, as extra roots.',
  },
  'trees-exception': {
    q: 'In the companion’s `trees` benchmark, about half the objects survive each collection. What does that mean for a generational collector?',
    a: 'Less benefit: many objects live long, get promoted, and the young generation is not mostly garbage. The hypothesis is about most programs, not all.',
  },
  'number-store': {
    q: 'Why does a write barrier ignore a store like `o.f = 3`?',
    a: 'A number is not a reference to an object, so it cannot create an old-to-young pointer.',
  },
};

export const examples = {
  'nan-box': {
    title: 'NaN-boxing with two views',
    code: `const f64 = new Float64Array(4);
const u32 = new Uint32Array(f64.buffer);
// quiet NaN + the "box" bit
const BOX = 0x7ffc0000;
const NONE = 1, TRUE = 3, OBJ = 4;

function box(i, tag, payload) {
  u32[2 * i] = payload; // low word
  u32[2 * i + 1] = BOX | tag; // high
}
function isNum(i) {
  return (u32[2 * i + 1] & BOX) !== BOX;
}
function show(i) {
  if (isNum(i)) return f64[i];
  const tag = u32[2 * i + 1] & 0xffff;
  const p = u32[2 * i];
  if (tag === NONE) return 'none';
  if (tag === TRUE) return 'true';
  return 'object #' + p;
}

f64[0] = 1.5;
box(1, NONE, 0);
box(2, OBJ, 7);
f64[3] = NaN;
for (let i = 0; i < 4; i++) {
  const hi = u32[2 * i + 1];
  console.log(hi.toString(16), show(i));
}
// a boxed value *is* a NaN:
console.log(Number.isNaN(f64[2]));`,
  },
};

export const exercises = {
  nanBox: {
    title: 'Box and unbox',
    prompt: 'Slot `i` of `f64` is one value; its high 32-bit word is `u32[2 * i + 1]` and its low word `u32[2 * i]`. Write `setValue(i, v)` for a number, `null`, `true` or `false`: store numbers as doubles, but store **every** NaN as the canonical bits (high `0x7ff80000`, low 0); store the others with low word 0 and high word `BOX | tag`. Write `getValue(i)` to turn the bits back into the same JavaScript value.',
    starter: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  f64[i] = v;
}

function getValue(i) {
  return f64[i];
}`,
    solution: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    if (v !== v) { // NaN
      u32[2 * i] = 0;
      u32[2 * i + 1] = 0x7ff80000;
    } else {
      f64[i] = v;
    }
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
    tests: `test('numbers round-trip', () => {
  for (const x of [1.5, -2, 0, 1e300]) {
    setValue(0, x);
    expect(getValue(0)).toBe(x);
  }
  setValue(1, -0);
  expect(Object.is(getValue(1), -0))
    .toBe(true);
  setValue(1, -Infinity);
  expect(getValue(1)).toBe(-Infinity);
});
test('none and booleans round-trip', () => {
  setValue(2, null);
  setValue(3, true);
  setValue(4, false);
  expect(getValue(2)).toBe(null);
  expect(getValue(3)).toBe(true);
  expect(getValue(4)).toBe(false);
});
test('boxed bits are as specified', () => {
  setValue(5, true);
  expect(u32[11]).toBe(BOX | TRUE);
  expect(u32[10]).toBe(0);
});
test('every NaN stays a number', () => {
  // a NaN whose bits look like none
  const t = new Float64Array(1);
  new Uint32Array(t.buffer)[1] = BOX | NONE;
  setValue(6, t[0]);
  expect(Number.isNaN(getValue(6)))
    .toBe(true);
  expect(u32[13]).toBe(0x7ff80000);
});`,
    hints: [
      'In `getValue`, a slot is a number unless all the `BOX` bits are set in its high word: `(hi & BOX) !== BOX`.',
      'In `setValue`, handle numbers first. `v !== v` is true only for NaN: write the canonical bits through `u32` instead of `f64[i] = v`.',
      'For the rest, pick the tag (`null` → `NONE`, `true` → `TRUE`, `false` → `FALSE`), write 0 to the low word and `BOX | tag` to the high word.',
    ],
    walkthrough: `**How to think about it.** Do \`getValue\` first, because it fixes the encoding: a slot is a number unless all the \`BOX\` bits are set in its high word, and if they are, the low 16 bits of the high word are the tag. \`setValue\` then has to produce exactly what \`getValue\` expects. Numbers can go straight in through \`f64\`, with one exception: a NaN, which might arrive with bits that look boxed (the last test builds one on purpose). So NaN gets the canonical bits written by hand, and everything else gets a tag.

**The solution, line by line.**

- \`if (typeof v === 'number') {\` handles every number, NaN included.
- \`if (v !== v) {\` is true only for NaN, the one value not equal to itself.
- \`u32[2 * i] = 0; u32[2 * i + 1] = 0x7ff80000;\` writes the canonical NaN through the integer view, so the engine cannot choose the bits: exponent all ones and the quiet bit, but not the box bit.
- \`f64[i] = v;\` stores any other number as itself; \`-0\` and the infinities survive unchanged (the first test).
- \`const tag = v === null ? NONE : v ? TRUE : FALSE;\` picks the tag for \`none\` and the booleans.
- \`u32[2 * i] = 0; u32[2 * i + 1] = BOX | tag;\` writes the boxed value: no payload, and the box pattern plus the tag on top (the third test checks the exact bits).
- In \`getValue\`, \`const hi = u32[2 * i + 1];\` reads the high word, and \`if ((hi & BOX) !== BOX) return f64[i];\` returns numbers: every finite double, both infinities and the canonical NaN lack at least one \`BOX\` bit.
- \`const tag = hi & 0xffff;\` reads the tag; \`if (tag === NONE) return null;\` and \`return tag === TRUE;\` turn it back into a value.

**Common wrong attempts.**

- Storing NaN with \`f64[i] = v\` like any other number usually works, which is what makes it dangerous: a NaN whose bits happen to look boxed is read back as \`none\`.
- Testing \`Number.isNaN(f64[i])\` to tell boxed values from numbers fails because every boxed value *is* a NaN, and so is the number NaN: a stored NaN comes back as \`false\`.
- On a big-endian machine the two words are the other way round; a careful VM checks the byte order once at start-up.`,
    wrong: [
      {
        code: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    f64[i] = v;
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
        why: 'NaNs are not made canonical. A NaN whose bits happen to look boxed is stored as it is and read back as `none`. Write the canonical NaN bits yourself.',
      },
      {
        code: `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NONE = 1, FALSE = 2, TRUE = 3;

function setValue(i, v) {
  if (typeof v === 'number') {
    if (v !== v) {
      u32[2 * i] = 0;
      u32[2 * i + 1] = 0x7ff80000;
    } else {
      f64[i] = v;
    }
    return;
  }
  const tag = v === null ? NONE
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  if (!Number.isNaN(f64[i])) {
    return f64[i];
  }
  const tag = u32[2 * i + 1] & 0xffff;
  if (tag === NONE) return null;
  return tag === TRUE;
}`,
        why: 'Every boxed value is a NaN, but so is the number NaN. Testing `Number.isNaN` turns a stored NaN into `false` (tag 0). Test the `BOX` bits instead.',
      },
    ],
  },
  barrier: {
    optional: true,
    title: 'A write barrier',
    prompt: 'Objects are `{ old, refs }`, where `old` says which generation the object is in and `refs` is an array of references. Write `store(owner, i, v, rem)`, where `rem` is the remembered set: set `owner.refs[i] = v`, and if `owner` is old and `v` is a young object (an object with `old` false; numbers and `null` are not objects), add `owner` to `rem`.',
    starter: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
}`,
    solution: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
  const young = typeof v === 'object' &&
    v !== null && !v.old;
  if (owner.old && young) {
    rem.add(owner);
  }
}`,
    tests: `const obj = (old) => ({ old, refs: [] });
test('old to young is remembered', () => {
  const r = new Set();
  const o = obj(true);
  store(o, 0, obj(false), r);
  expect(r.has(o)).toBe(true);
  expect(o.refs.length).toBe(1);
});
test('young to young is not', () => {
  const r = new Set();
  store(obj(false), 0, obj(false), r);
  expect(r.size).toBe(0);
});
test('old to old is not', () => {
  const r = new Set();
  store(obj(true), 0, obj(true), r);
  expect(r.size).toBe(0);
});
test('numbers and null are not', () => {
  const r = new Set();
  const o = obj(true);
  store(o, 0, 3, r);
  store(o, 1, null, r);
  expect(r.size).toBe(0);
  expect(o.refs).toEqual([3, null]);
});`,
    hints: [
      'The store itself always happens. The barrier only decides whether to *also* remember the owner.',
      'Remember the owner only when it is old and the value is a young object. Check “is an object” first: `typeof v === \'object\' && v !== null`.',
      'Then `!v.old` makes it young, and `rem.add(owner)` records it (a `Set` ignores duplicates).',
    ],
    walkthrough: `**How to think about it.** A minor collection traces only the young generation, starting from the roots. A young object reachable only through an old one would be missed, so every store that could create such a reference must leave a note. Of the four combinations of old and young, only one creates the problem: an old owner gaining a reference to a young value. Everything else (and every store of a non-object) needs nothing.

**The solution, line by line.**

- \`owner.refs[i] = v;\` is the store the program asked for; the barrier never changes it.
- \`const young = typeof v === 'object' && v !== null && !v.old;\` decides whether the value is a young object. Numbers and \`null\` are not references at all (the last test); \`typeof null\` is \`'object'\` in JavaScript, hence the second check.
- \`if (owner.old && young) { rem.add(owner); }\` records the old owner. At the next minor collection, every object in \`rem\` is treated as a root, so whatever young objects it points at are kept.

**Common wrong attempts.**

- Remembering on every store makes the remembered set as big as the heap, and the minor collection is no longer cheap.
- Checking \`!v.old\` without first checking that \`v\` is an object treats the number 3 as a young object (since \`(3).old\` is \`undefined\`), and remembers the owner for nothing.
- Remembering the *value* instead of the owner keeps the young object alive once, but misses later changes: it is the old object's references that the minor collection must read.`,
    wrong: [
      {
        code: `function store(owner, i, v, rem) {
  owner.refs[i] = v;
  if (owner.old && !v?.old) {
    rem.add(owner);
  }
}`,
        why: 'Without the object check, storing the number 3 or `null` into an old object counts as old-to-young, and the owner is remembered for nothing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In this chapter’s scheme, how do you tell whether a 64-bit slot holds a number?',
    options: [
      {
        t: 'Call `Number.isNaN` on it',
        why: 'Every boxed value is a NaN, but so is the number NaN, so that test cannot tell them apart.',
      },
      {
        t: 'Check whether all the `BOX` bits are set in the high word; if not, it is a number',
        correct: true,
        why: 'Only boxed values have the all-ones exponent, the quiet bit and the box bit together.',
      },
      {
        t: 'Check whether the low word is zero',
        why: 'Plenty of numbers have a zero low word, 1.5 for one.',
      },
      {
        t: 'Look up its type in a side table',
        why: 'The point of NaN-boxing is that the value carries its own type.',
      },
    ],
  },
  {
    q: 'Why does NaN-boxing require canonical NaNs?',
    options: [
      {
        t: 'Because NaN is not equal to NaN',
        why: 'That is true of every NaN, canonical or not; the issue is bit patterns.',
      },
      {
        t: 'To save memory',
        why: 'Every value is 8 bytes either way.',
      },
      {
        t: 'A real NaN with the “boxed” bits set would be read as a value that is not a number',
        correct: true,
        why: 'Storing every NaN as one known pattern means numbers never collide with boxed values.',
      },
      {
        t: 'Because the CPU rejects other NaNs',
        why: 'CPUs handle many NaN patterns; it is the VM that gives some of them meaning.',
      },
    ],
  },
  {
    q: 'In counts made for this chapter, `instantiation` kept 0.1% of the objects at each collection and `trees` kept 54%. What does that say?',
    options: [
      {
        t: 'The collector is broken on `trees`',
        why: '`trees` really does keep its trees alive; the collector is right to keep them.',
      },
      {
        t: 'Generational collection would help `trees` most',
        why: 'It helps most where objects die young; `trees` keeps half of them.',
      },
      {
        t: 'All programs keep about the same share',
        why: 'The two differ by a factor of hundreds.',
      },
      {
        t: 'Most objects die young in `instantiation`, as the generational hypothesis says, while `trees` is an exception',
        correct: true,
        why: 'The hypothesis describes most programs, not every one.',
      },
    ],
  },
  {
    q: 'Which store needs a write barrier to record something?',
    options: [
      {
        t: 'Storing a young list into a field of an old instance',
        correct: true,
        why: 'That creates an old-to-young reference, which a minor collection would otherwise miss.',
      },
      {
        t: 'Storing a number into a field of an old instance',
        why: 'A number is not a reference, so there is nothing to miss.',
      },
      {
        t: 'Storing a young list into a field of a young instance',
        why: 'A minor collection traces the young instance, so it finds the list anyway.',
      },
      {
        t: 'Storing an old object into a global',
        why: 'Globals are roots, and an old object is not collected by a minor collection anyway.',
      },
    ],
  },
  {
    q: 'What does a minor collection treat as its roots?',
    options: [
      {
        t: 'Only the stack',
        why: 'It also needs the other roots, and the remembered old objects.',
      },
      {
        t: 'Every old object',
        why: 'That would make it as costly as a full collection.',
      },
      {
        t: 'The usual roots, plus the old objects in the remembered set',
        correct: true,
        why: 'Those are exactly the old objects that might keep a young one alive.',
      },
      {
        t: 'Nothing: it frees every young object',
        why: 'Young objects that are still reachable must survive, and be promoted later.',
      },
    ],
  },
];
