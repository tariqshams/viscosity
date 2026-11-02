// Cards for the chapter 'Looking inside objects with natives syntax'
// (split from Watching the engine work). Keys are stable ids.

export const prompts = {
  'natives-flag': {
    q: 'What does `%DebugPrint(o)` do without `--allow-natives-syntax`?',
    a: 'Nothing: the `%` is a SyntaxError, because natives syntax isn’t JavaScript.',
  },
  'natives-not-js': {
    q: 'Why is `%DebugPrint(o)` not JavaScript?',
    a: 'It is V8’s private syntax for calling its own runtime functions; no other engine understands it, and V8 only accepts it with `--allow-natives-syntax`.',
  },
  'elements-debugprint': {
    q: '`%DebugPrint([1, 2, 3])` shows `PACKED_SMI_ELEMENTS`. What does it show after `push(1.5)`?',
    a: '`PACKED_DOUBLE_ELEMENTS`: the whole array moved to doubles, still with no holes.',
  },
  'fast-props': {
    q: '`%HasFastProperties(p)` turns from `true` to `false` after `delete p.x`. What happened?',
    a: '`p` fell back to dictionary mode: its properties are now kept in a hash table.',
  },
  'same-map': {
    q: 'Why is `%HaveSameMap({ x: 1, y: 2 }, { y: 1, x: 2 })` false?',
    a: 'A map records the order in which properties were added, so the same fields in a different order give a different map.',
  },
  'prepare-opt': {
    q: 'What does `%OptimizeFunctionOnNextCall(f)` let a test do?',
    a: 'Make V8 optimise `f` on its next call, rather than waiting for it to become hot, so the test can check the optimised code’s behaviour.',
  },
  'opt-status-bits': {
    q: 'In `%GetOptimizationStatus`, bit 6 is set and bit 7 is clear. What does that say about the function?',
    a: 'It is running TurboFan code (bit 6, TurboFanned) and is not interpreted (bit 7).',
  },
  'generalization': {
    q: 'What does `--trace-generalization` show for a class field declared as `x;` and then given doubles?',
    a: 'The field generalising from a heap-object field (it held `undefined`) to a generic tagged one, which boxes every double.',
  },
};

export const examples = {};

const BITS = `const BITS = [
  [0, 'function'],
  [3, 'maybe deopted'],
  [4, 'optimized'],
  [5, 'maglevved'],
  [6, 'turbofanned'],
  [7, 'interpreted'],
];
`;

export const exercises = {
  decodeStatus: {
    title: 'Decode an optimisation status',
    prompt:
      'V8 12.4’s `%GetOptimizationStatus(f)` returns a number whose bits each mean one fact; `BITS` lists six of them as `[bit, name]` pairs, in increasing bit order. Write `decodeStatus(s)`, which returns the names of the bits that are set in `s`, in the same order as `BITS`. Bits not in the table are ignored. For example, `decodeStatus(0b10000001)` is `[\'function\', \'interpreted\']`.',
    starter: `${BITS}
function decodeStatus(s) {
  return [];
}`,
    solution: `${BITS}
function decodeStatus(s) {
  const out = [];
  for (const [bit, name] of BITS) {
    if ((s >> bit) & 1) out.push(name);
  }
  return out;
}`,
    tests: `test('before optimizing', () => {
  expect(decodeStatus(0b10000001))
    .toEqual(['function', 'interpreted']);
});
test('after TurboFan', () => {
  expect(decodeStatus(0b1010001))
    .toEqual(['function', 'optimized',
      'turbofanned']);
});
test('nothing set', () => {
  expect(decodeStatus(0)).toEqual([]);
});
test('unknown bits are ignored', () => {
  expect(decodeStatus((1 << 11) | 1))
    .toEqual(['function']);
});`,
    hints: [
      'Go through `BITS` in order; for each `[bit, name]` pair, ask whether that bit of `s` is 1.',
      'To get bit `k` of `s` on its own, shift it down to the bottom and keep only the last bit: `(s >> k) & 1`.',
      'Start with `const out = [];`, loop `for (const [bit, name] of BITS)`, push `name` when `(s >> bit) & 1` is 1, and return `out`.',
    ],
    walkthrough: `**How to think about it.** A status is a *bit set*: one number in which each binary digit answers one yes-or-no question. Write the first example out: \`0b10000001\` has a 1 in position 0 (counting from the right, starting at 0) and a 1 in position 7, and the table says bit 0 is "function" and bit 7 is "interpreted". So the job is: for each row of the table, test one bit, and collect the names whose bit is 1. Going through \`BITS\` (rather than through the bits of \`s\`) gives the right order and ignores unknown bits for free.

**The solution, line by line.**

- \`const out = [];\` collects the names of the set bits.
- \`for (const [bit, name] of BITS) {\` visits each row of the table in order, unpacking it into the bit number and its name.
- \`if ((s >> bit) & 1) out.push(name);\` \`s >> bit\` shifts the number right by \`bit\` places, so the bit we care about lands in position 0; \`& 1\` keeps only that last bit, giving 1 or 0. If it is 1, the fact is true, so its name goes into the list. For \`0b1010001\` and bit 6: shifting right by 6 gives \`0b1\`, and \`1 & 1\` is 1, so "turbofanned" is added.
- \`return out;\` returns the names in table order.

Bit 11 in the last test is not in the table, so nothing ever looks at it, and only "function" comes out. This is the same arithmetic as the chapter's formula, \`bit(s, k) = (s >> k) & 1\`.

**Common wrong attempts.**

- \`if (s & bit)\`: this ands \`s\` with the bit's *number* rather than its mask. \`s & 0\` is always 0, so "function" is never found, and \`s & 3\` tests bits 0 and 1 together. The mask for bit \`k\` is \`1 << k\`, so \`s & (1 << bit)\` would also work.
- Reading \`s.toString(2)[bit]\`: the string is written with the *highest* bit first, so index 0 is the leftmost digit, not bit 0. It happens to work for \`10000001\`, which reads the same both ways, and fails for \`1010001\`.`,
    wrong: [
      {
        code: `${BITS}
function decodeStatus(s) {
  const out = [];
  for (const [bit, name] of BITS) {
    if (s & bit) out.push(name);
  }
  return out;
}`,
        why: '`s & bit` uses the bit number as a mask: `s & 0` is always 0, so `function` is never found. Use `(s >> bit) & 1`, or the mask `1 << bit`.',
      },
      {
        code: `${BITS}
function decodeStatus(s) {
  const b = s.toString(2);
  const out = [];
  for (const [bit, name] of BITS) {
    if (b[bit] === '1') out.push(name);
  }
  return out;
}`,
        why: 'The binary string starts with the highest bit, so `b[0]` is the leftmost digit, not bit 0. `1010001` decodes wrongly.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You call `%HasFastProperties(o)` in a normal `node file.js` run. What happens?',
    options: [
      { t: 'It returns `true` or `false`', why: 'Only with `--allow-natives-syntax`.' },
      { t: 'It returns `undefined`', why: 'It doesn’t get as far as running.' },
      { t: 'A warning is printed and the call is skipped', why: 'There is no such fallback.' },
      { t: 'A SyntaxError: `%` calls are not JavaScript', correct: true, why: 'Natives syntax is a V8 extension, enabled only by the flag.' },
    ],
  },
  {
    q: 'An array’s `%DebugPrint` changes from `PACKED_SMI_ELEMENTS` to `PACKED_DOUBLE_ELEMENTS`. What happened?',
    options: [
      { t: 'The array became a dictionary', why: 'Dictionary mode would show up differently; the elements kind only changed from small integers to doubles.' },
      { t: 'A double, such as 1.5, was stored in it, so all its elements are now kept as doubles', correct: true, why: 'Elements kinds only move towards more general kinds; it stays packed because there are still no holes.' },
      { t: 'An element was deleted', why: 'Deleting would leave a hole, making it HOLEY, not DOUBLE.' },
      { t: 'The garbage collector moved the array', why: 'Moving an array does not change its elements kind.' },
    ],
  },
  {
    q: 'Why does `%HaveSameMap({ x: 1, y: 2 }, { y: 1, x: 2 })` print `false`?',
    options: [
      { t: 'Because the values are different', why: 'Maps describe the layout, not the values; `{ x: 1, y: 2 }` and `{ x: 3, y: 4 }` share a map.' },
      { t: 'Because natives syntax always compares by identity', why: '`%HaveSameMap` compares the two objects’ maps, which can be shared.' },
      { t: 'Because the properties were added in a different order, and a map records that order', correct: true, why: 'Each order of adding properties is a different path through the transition tree.' },
      { t: 'Because one of the objects is in dictionary mode', why: 'Both are fresh object literals with fast properties.' },
    ],
  },
  {
    q: '`%GetOptimizationStatus(add).toString(2)` prints `1010001`. Which facts does it report, by V8 12.4’s bit names?',
    options: [
      { t: 'A function, optimised, by TurboFan', correct: true, why: 'Bits 0, 4 and 6 are set: is a function, optimised, TurboFanned.' },
      { t: 'A function, interpreted', why: 'That is `10000001`: bits 0 and 7.' },
      { t: 'Optimised by Maglev', why: 'Maglev is bit 5, which is clear here (and Maglev is off by default in Node 22).' },
      { t: 'Marked for deoptimisation', why: 'That is bit 14, far to the left of these digits.' },
    ],
  },
  {
    q: 'Why should natives syntax stay out of code you ship?',
    options: [
      { t: 'It makes every function slower', why: 'The cost is not the point; the point is that the code depends on one engine’s private interface.' },
      { t: 'It only works in browsers', why: 'It works in Node with the flag, and not in browsers at all.' },
      { t: 'It is deprecated JavaScript', why: 'It was never JavaScript: it is V8’s own syntax.' },
      { t: 'It is not JavaScript, needs a V8 flag, and its functions can change or vanish in any V8 version', correct: true, why: 'Other engines reject it outright, and V8 lists these functions for its own testing.' },
    ],
  },
];
