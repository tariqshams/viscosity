// Chapter 60 cards. Keys are stable ids: never rename them.

export const prompts = {
  'poison-cost': {
    q: 'Why was poisoning freed objects so expensive in the VM?',
    a: 'Deleting every property pushed each dead object into V8’s slow dictionary mode, and allocation-heavy programs free millions of objects.',
  },
  'debug-only': {
    q: 'Poisoning is now debug-only. Why keep it at all?',
    a: 'Stress-mode tests use it to turn a missing GC root into an immediate “use after free” error.',
  },
  'measure-first': {
    q: 'What found the VM’s biggest slowdown: a guess or a measurement?',
    a: 'A profile. Nobody would have guessed a debugging aid was more than half the run time.',
  },
  'nan-room': {
    q: 'Why is there room inside the NaNs of a double to store other values?',
    a: 'Any double with an all-ones exponent and a non-zero fraction is a NaN, which gives a vast number of bit patterns, and arithmetic only produces one or two of them.',
  },
  'nan-canonical': {
    q: 'Why must a NaN-boxing VM store every real NaN in one canonical form?',
    a: 'A NaN that happened to carry the “boxed” bits would be misread as nil, a boolean or an object.',
  },
  'nan-js-payload': {
    q: 'A NaN-boxing VM written in JavaScript can’t put a pointer in a double. What would its object payload be instead?',
    a: 'An index into an array that holds the objects.',
  },
  'gen-hypothesis': {
    q: 'What is the generational hypothesis?',
    a: 'Most objects die young: they become unreachable soon after they are allocated.',
  },
  'write-barrier': {
    q: 'Why does a generational collector need a write barrier?',
    a: 'A minor collection doesn’t trace old objects, so it must be told which old objects point at young ones; the barrier records them as extra roots.',
  },
  'dispatch-cost': {
    q: 'What does a superinstruction save each time it runs?',
    a: 'The extra trips round the dispatch loop (fetch, branch, return) of the instructions it replaces, and the stack traffic between them.',
  },
  'super-jump': {
    q: 'Why must a jump never land inside a fused superinstruction?',
    a: 'The middle instructions no longer exist as separate opcodes, so there is nothing valid to land on.',
  },
};

export const examples = {
  'nan-box': {
    title: 'NaN-boxing with two views',
    code: `const f64 = new Float64Array(4);
const u32 = new Uint32Array(f64.buffer);
// quiet NaN + the "box" bit
const BOX = 0x7ffc0000;
const NIL = 1, TRUE = 3, OBJ = 4;

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
  if (tag === NIL) return 'nil';
  if (tag === TRUE) return 'true';
  return 'object #' + p;
}

f64[0] = 1.5;
box(1, NIL, 0);
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

const NAN_SETUP = `const f64 = new Float64Array(8);
const u32 = new Uint32Array(f64.buffer);
const BOX = 0x7ffc0000;
const NIL = 1, FALSE = 2, TRUE = 3;
`;

export const exercises = {
  nanBox: {
    title: 'Box and unbox',
    prompt:
      'Slot `i` of `f64` is one value; its high 32-bit word is `u32[2 * i + 1]` and its low word `u32[2 * i]`. Write `setValue(i, v)` for a number, `null`, `true` or `false`: store numbers as doubles, but store **every** NaN as the canonical bits (high `0x7ff80000`, low 0); store the others with low word 0 and high word `BOX | tag`. Write `getValue(i)` to turn the bits back into the same JavaScript value.',
    starter: `${NAN_SETUP}
function setValue(i, v) {
  f64[i] = v;
}

function getValue(i) {
  return f64[i];
}`,
    solution: `${NAN_SETUP}
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
  const tag = v === null ? NIL
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NIL) return null;
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
test('nil and booleans round-trip', () => {
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
  // a NaN whose bits look like nil
  const t = new Float64Array(1);
  new Uint32Array(t.buffer)[1] = BOX | NIL;
  setValue(6, t[0]);
  expect(Number.isNaN(getValue(6)))
    .toBe(true);
  expect(u32[13]).toBe(0x7ff80000);
});`,
    hints: [
      'In `getValue`, a slot is a number unless all the `BOX` bits are set in its high word: `(hi & BOX) !== BOX`.',
      'In `setValue`, handle numbers first. `v !== v` is true only for NaN: write the canonical bits through `u32` instead of `f64[i] = v`.',
      'For the rest, pick the tag (`null` → `NIL`, `true` → `TRUE`, `false` → `FALSE`), write 0 to the low word and `BOX | tag` to the high word.',
    ],
    walkthrough: `\`\`\`js
function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NIL) return null;
  return tag === TRUE;
}
\`\`\`

- **The number test is one mask.** \`BOX\` is the all-ones exponent, the quiet bit and the box bit. Every finite double, both infinities and the canonical NaN lack at least one of those bits, so they read as numbers.
- **The tag** sits in the low 16 bits of the high word. \`nil\` and the booleans need no payload.

\`\`\`js
if (v !== v) { // NaN
  u32[2 * i] = 0;
  u32[2 * i + 1] = 0x7ff80000;
}
\`\`\`

- **Canonicalize NaNs.** A NaN can arrive with any bit pattern, including one that looks boxed, as the last test builds on purpose. ECMAScript lets an engine pick a NaN's bits when it writes one into a typed array, so \`f64[i] = v\` might keep those bits. Writing the canonical pattern yourself makes the encoding safe on every engine.
- **Endianness.** \`u32[2 * i + 1]\` is the high word only on a little-endian machine. That covers almost every device, but a careful VM would check once at start-up.`,
    wrong: [
      {
        code: `${NAN_SETUP}
function setValue(i, v) {
  if (typeof v === 'number') {
    f64[i] = v;
    return;
  }
  const tag = v === null ? NIL
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  const hi = u32[2 * i + 1];
  if ((hi & BOX) !== BOX) return f64[i];
  const tag = hi & 0xffff;
  if (tag === NIL) return null;
  return tag === TRUE;
}`,
        why: 'NaNs aren’t canonicalized. A NaN whose bits happen to look boxed is stored as is and read back as `nil`. Write the canonical NaN bits yourself.',
      },
      {
        code: `${NAN_SETUP}
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
  const tag = v === null ? NIL
    : v ? TRUE : FALSE;
  u32[2 * i] = 0;
  u32[2 * i + 1] = BOX | tag;
}

function getValue(i) {
  if (!Number.isNaN(f64[i])) {
    return f64[i];
  }
  const tag = u32[2 * i + 1] & 0xffff;
  if (tag === NIL) return null;
  return tag === TRUE;
}`,
        why: 'Every boxed value is a NaN, but so is the number NaN. Testing `Number.isNaN` turns a stored NaN into `false` (tag 0). Test the `BOX` bits instead.',
      },
    ],
  },
  fusePairs: {
    optional: true,
    title: 'Fuse a superinstruction',
    prompt:
      'Instructions are objects like `{ op: \'GET_LOCAL\', a: 1 }`. Write `fuse(code, targets)`: return a **new** array where each pair of adjacent `GET_LOCAL`s becomes `{ op: \'GET_LOCAL2\', a: first.a, b: second.a }` followed by `{ op: \'NOP\' }` (so positions don’t move). Don’t fuse if the second instruction’s index is in the `Set` `targets` (a jump lands there). Don’t change `code`.',
    starter: `function fuse(code, targets) {
  const out = code.slice();
  // fuse GET_LOCAL, GET_LOCAL pairs
  return out;
}`,
    solution: `function fuse(code, targets) {
  const out = code.slice();
  const n = out.length;
  for (let i = 0; i < n - 1; i++) {
    const x = out[i];
    const y = out[i + 1];
    if (x.op === 'GET_LOCAL' &&
        y.op === 'GET_LOCAL' &&
        !targets.has(i + 1)) {
      out[i] = {
        op: 'GET_LOCAL2',
        a: x.a,
        b: y.a,
      };
      out[i + 1] = { op: 'NOP' };
      i++;
    }
  }
  return out;
}`,
    tests: `const L = (a) => ({ op: 'GET_LOCAL', a });
const ADD = { op: 'ADD' };
test('a pair is fused', () => {
  expect(fuse([L(1), L(2), ADD], new Set()))
    .toEqual([
      { op: 'GET_LOCAL2', a: 1, b: 2 },
      { op: 'NOP' },
      ADD,
    ]);
});
test('three in a row: fuse two', () => {
  const out = fuse([L(1), L(2), L(3)],
    new Set());
  expect(out[0].op).toBe('GET_LOCAL2');
  expect(out[1].op).toBe('NOP');
  expect(out[2]).toEqual(L(3));
});
test('never fuse over a jump target', () => {
  const code = [L(1), L(2)];
  expect(fuse(code, new Set([1])))
    .toEqual([L(1), L(2)]);
});
test('the input is not changed', () => {
  const code = [L(1), L(2)];
  fuse(code, new Set());
  expect(code[0].op).toBe('GET_LOCAL');
  expect(code.length).toBe(2);
});`,
    hints: [
      'Loop over index `i`, looking at `out[i]` and `out[i + 1]`.',
      'Fuse only when both are `GET_LOCAL` and `!targets.has(i + 1)`: a jump to index `i + 1` must still find a real instruction there.',
      'After fusing, skip the `NOP` with `i++`, and write into `out` (a copy), never into `code`.',
    ],
    walkthrough: `\`\`\`js
if (x.op === 'GET_LOCAL' &&
    y.op === 'GET_LOCAL' &&
    !targets.has(i + 1)) {
  out[i] = {
    op: 'GET_LOCAL2', a: x.a, b: y.a,
  };
  out[i + 1] = { op: 'NOP' };
  i++;
}
\`\`\`

- **The NOP keeps positions.** Every later instruction stays at its index, so no jump offset needs fixing. CPython's compiler uses the same trick when it makes \`LOAD_FAST_LOAD_FAST\`. A real VM would then remove the NOPs in a later pass that does fix offsets, or simply skip over them.
- **Jump targets.** If some jump lands on the second \`GET_LOCAL\`, fusing would make it land on a NOP and skip the load. So that pair must stay as it is.
- **\`i++\`** moves past the NOP. With three \`GET_LOCAL\`s in a row, the first two fuse and the third is left alone, because its partner is gone.
- **A copy.** \`code.slice()\` makes a new array, and the fused instructions are new objects, so the caller's code is untouched.`,
    wrong: [
      {
        code: `function fuse(code, targets) {
  const out = code.slice();
  const n = out.length;
  for (let i = 0; i < n - 1; i++) {
    const x = out[i];
    const y = out[i + 1];
    if (x.op === 'GET_LOCAL' &&
        y.op === 'GET_LOCAL') {
      out[i] = {
        op: 'GET_LOCAL2',
        a: x.a,
        b: y.a,
      };
      out[i + 1] = { op: 'NOP' };
      i++;
    }
  }
  return out;
}`,
        why: 'It ignores `targets`. A jump to the second load would land on a NOP, and that path would never push the second local.',
      },
      {
        code: `function fuse(code, targets) {
  const out = code;
  const n = out.length;
  for (let i = 0; i < n - 1; i++) {
    const x = out[i];
    const y = out[i + 1];
    if (x.op === 'GET_LOCAL' &&
        y.op === 'GET_LOCAL' &&
        !targets.has(i + 1)) {
      out[i] = {
        op: 'GET_LOCAL2',
        a: x.a,
        b: y.a,
      };
      out[i + 1] = { op: 'NOP' };
      i++;
    }
  }
  return out;
}`,
        why: '`const out = code` is the same array, not a copy, so the caller’s code is rewritten too. Use `code.slice()`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What made the `instantiation` benchmark several times faster?',
    options: [
      { t: 'Making GC poisoning run only in stress and debug mode', correct: true, why: 'The commit records 19.4 s before and 3.6 s after. Poisoning had been pushing millions of dead objects into V8’s dictionary mode.' },
      { t: 'NaN-boxing the VM’s values', why: 'The companion doesn’t NaN-box. That is one of this chapter’s ideas to try.' },
      { t: 'A generational collector', why: 'The companion’s collector is a plain mark-sweep.' },
      { t: 'Superinstructions for method calls', why: 'The companion has none. `OP_INVOKE` (chapter 59) fuses a property read and a call, but it existed before this change.' },
    ],
  },
  {
    q: 'In this chapter’s scheme, how do you tell whether a 64-bit slot holds a number?',
    options: [
      { t: 'Call `Number.isNaN` on it', why: 'Every boxed value is a NaN, but so is the number NaN, so that test can’t tell them apart.' },
      { t: 'Check whether the low word is zero', why: 'Plenty of numbers have a zero low word, 1.5 for one.' },
      { t: 'Check whether all the `BOX` bits are set in the high word; if not, it’s a number', correct: true, why: 'Only boxed values have the all-ones exponent, the quiet bit and the box bit together.' },
      { t: 'Look up its type in a side table', why: 'The point of NaN-boxing is that the value carries its own type.' },
    ],
  },
  {
    q: 'Why does NaN-boxing require canonical NaNs?',
    options: [
      { t: 'Because NaN !== NaN', why: 'That is true of every NaN, canonical or not. The issue is bit patterns.' },
      { t: 'To save memory', why: 'Every value is 8 bytes either way.' },
      { t: 'Because the CPU rejects other NaNs', why: 'CPUs handle many NaN patterns. The VM is the one that gives some of them meaning.' },
      { t: 'A real NaN with the “boxed” bits set would be read as a non-number value', correct: true, why: 'Storing every NaN as one known pattern guarantees numbers never collide with boxed values.' },
    ],
  },
  {
    q: 'What does the generational hypothesis say?',
    options: [
      { t: 'Old objects are more likely to be garbage', why: 'The reverse: objects that have survived tend to keep surviving.' },
      { t: 'Most objects die young', correct: true, why: 'So collecting just the young generation, often, frees most garbage for little work.' },
      { t: 'Objects should be allocated in order of size', why: 'The hypothesis is about lifetimes, not sizes.' },
      { t: 'Each generation of hardware doubles GC speed', why: 'It is about object lifetimes in programs.' },
    ],
  },
  {
    q: 'A minor collection traces only young objects. What else must it treat as roots?',
    options: [
      { t: 'Nothing else: the stack and globals are enough', why: 'An old object can be the only thing keeping a young one alive.' },
      { t: 'Every old object', why: 'That would mean tracing the old generation, which is what a minor collection avoids.' },
      { t: 'Old objects recorded by the write barrier as pointing at young ones', correct: true, why: 'The barrier records old-to-young references as they are made, so the minor collection can use them as extra roots.' },
      { t: 'The string table', why: 'The string table is weak; it never keeps strings alive.' },
    ],
  },
  {
    q: 'In `fib(20)`, `GET_LOCAL` is followed by `CONSTANT` 43,781 times. What does a superinstruction for that pair save?',
    options: [
      { t: 'One trip round the dispatch loop each time the pair runs', correct: true, why: 'One opcode instead of two: one fetch, one branch, one return to the loop.' },
      { t: 'The constant pool', why: 'The constant is still read from the pool, as an operand.' },
      { t: 'All type checks in the function', why: 'The values still have to be checked where an operator uses them.' },
      { t: 'The function call itself', why: 'Calls are separate instructions; this pair is inside the body.' },
    ],
  },
];
