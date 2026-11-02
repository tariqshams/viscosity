// Chapter 279 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ao-block-size': {
    q: 'What does the block size B of an AoSoA layout say?',
    a: 'How many elements one block holds. Each block stores B values of each field.',
  },
  'ao-slot': {
    q: 'With F = 3 and B = 8, which slot holds field 1 of element 10?',
    a: '(10 >> 3) × 24 + 1 × 8 + (10 & 7) = 24 + 8 + 2 = 34.',
  },
  'ao-pow2': {
    q: 'Why must Viscosity’s AoSoA block size be a power of two?',
    a: 'So the block and lane are a shift and a mask (`i >> s`, `i & (B-1)`) instead of a division and a remainder; with 6 there are no bits to read off.',
  },
  'ao-cap-blocks': {
    q: 'Why does the AoSoA container round its capacity up with `Math.ceil(cap / 8) * 8`?',
    a: 'So the array always holds whole blocks; doubling keeps it a multiple of 8.',
  },
  'ao-one-copy': {
    q: 'Why can AoSoA’s `grow()` copy everything with a single `set`?',
    a: 'Blocks don’t move when capacity grows: the new array is the old blocks followed by empty ones.',
  },
  'ao-helper': {
    q: 'When does the emitter call `__vsc_aosoa(...)` instead of writing the formula inline?',
    a: 'When the index isn’t a simple name or literal (for example wrapped in a bounds check), so it is evaluated only once.',
  },
  'ao-numeric': {
    q: 'Why does Viscosity refuse `aosoa` when a field may hold a string?',
    a: 'All fields share one `Float64Array`, which can only store numbers.',
  },
  'ao-why-not-auto': {
    q: 'Why does Viscosity’s cost model never choose AoSoA by itself?',
    a: 'In this book’s V8 measurements it rarely beat SoA, even with a hand-written block-by-block loop, and was slower at small sizes.',
  },
};

export const examples = {
  'aosoa-push': {
    title: 'A tiny AoSoA store (F = 2, B = 4)',
    code: `const F = 2, B = 4, S = 2;
const data = new Float64Array(16);
function slot(i, k) {
  return (i >> S) * F * B + k * B
    + (i & (B - 1));
}
for (let i = 0; i < 8; i++) {
  data[slot(i, 0)] = i;      // x
  data[slot(i, 1)] = 10 * i; // y
}
console.log(slot(5, 1));
console.log(data.join(' '));`,
  },
};

export const exercises = {
  aosoaSlot: {
    title: 'An AoSoA index function',
    prompt:
      'Write `slot(i, k, F, B)`: the index in the shared `Float64Array` of field `k` of element `i`, for `F` fields in blocks of `B`. Use a shift and a mask, like Viscosity. Refuse what Viscosity refuses: if `B` is not a power of two of at least 2, throw an error.',
    starter: `function slot(i, k, F, B) {
  // your code here
  return 0;
}

console.log(slot(10, 1, 3, 8));`,
    solution: `function slot(i, k, F, B) {
  if (!(B >= 2 && (B & (B - 1)) === 0))
    throw new Error('bad block size');
  const sh = Math.log2(B);
  return (i >> sh) * F * B + k * B
    + (i & (B - 1));
}`,
    tests: `test('element 10, field y, F = 3, B = 8', () => {
  expect(slot(10, 1, 3, 8)).toBe(34);
});
test('the first block', () => {
  expect(slot(0, 0, 3, 8)).toBe(0);
  expect(slot(7, 2, 3, 8)).toBe(23);
});
test('element 8 starts block 1', () => {
  expect(slot(8, 0, 3, 8)).toBe(24);
});
test('blocks of 4, two fields', () => {
  expect(slot(5, 1, 2, 4)).toBe(13);
});
test('B = 1 is refused, like aosoa(1)', () => {
  expect(() => slot(5, 2, 3, 1)).toThrow();
});
test('B = 6 is refused', () => {
  expect(() => slot(1, 0, 3, 6)).toThrow();
});`,
    hints: [
      'Work out the three parts separately: where the block starts, where the field starts inside the block, and the lane.',
      'Block number: `i >> Math.log2(B)`; a block is `F * B` slots long. Inside it, field `k` starts at `k * B`. Lane: `i & (B - 1)`.',
      'A power of two has exactly one bit set, so `(B & (B - 1)) === 0` exactly when B is a power of two (for B > 0). Check `B >= 2` too, and throw before doing any arithmetic.',
    ],
    walkthrough: `**How to think about it.** This is the formula the emitter writes, with F and B as parameters instead of numbers baked in. Before writing code, do one case by hand, the one from the diagram: element 10, field 1 (y), three fields, blocks of 8. Block \`10 >> 3 = 1\`, and each block is \`3 * 8 = 24\` slots, so block 1 starts at 24; field 1 starts \`1 * 8 = 8\` slots into the block, at 32; the lane is \`10 & 7 = 2\`, so the answer is 34. Now turn each of those three steps into an expression, and add the check first, so that a bad B never reaches the arithmetic.

**The solution, line by line.**

- \`function slot(i, k, F, B) {\` takes the element, the field number, the number of fields and the block size.
- \`  if (!(B >= 2 && (B & (B - 1)) === 0))\` asks "is B at least 2 and a power of two?" and goes on only if the answer is no. \`B - 1\` flips the lowest set bit of B and every bit below it, so \`B & (B - 1)\` clears that lowest set bit; the result is 0 exactly when B had a single bit set. For 8 (\`1000\`) it is \`1000 & 0111 = 0\`; for 6 (\`110\`) it is \`110 & 101 = 100\`, which is not 0.
- \`    throw new Error('bad block size');\` refuses, as Viscosity's planner does for \`aosoa(6)\` and \`aosoa(1)\`.
- \`  const sh = Math.log2(B);\` is the shift: 3 for B = 8, 2 for B = 4. Because B passed the check, this is a whole number.
- \`  return (i >> sh) * F * B + k * B\` is the start of the block (block number times the slots per block) plus the start of field k inside it.
- \`    + (i & (B - 1));\` adds the lane: the low \`sh\` bits of i, which is \`i % B\`.
- \`}\` closes the function.

Check it against the tests: \`slot(5, 1, 2, 4)\` is block \`5 >> 2 = 1\`, starting at \`1 * 2 * 4 = 8\`, plus field offset \`1 * 4 = 4\`, plus lane \`5 & 3 = 1\`: 13.

**Common wrong attempts.**

- Adding \`k\` instead of \`k * B\` treats a block as if fields were interleaved; each field owns B slots per block, so field 1 starts B slots in, not 1.
- \`i * F + k\` is the packed AoS index (what B = 1 would give). In AoSoA, neighbouring elements' values of one field are neighbours in memory, which this formula never produces.
- \`Math.floor(i / B)\` and \`i % B\` give the right numbers, but without the check they accept B = 6. Worse, with the shift, \`Math.log2(6)\` is 2.58..., and \`i >> 2.58\` silently shifts by 2, giving blocks of 4: wrong answers with no error. That is why Viscosity refuses such a block size up front.`,
    wrong: [
      {
        code: `function slot(i, k, F, B) {
  const sh = Math.log2(B);
  return (i >> sh) * F * B + k
    + (i & (B - 1));
}`,
        why: 'The field offset inside a block is `k * B`, not `k`: each field has B slots. (It also accepts B = 6.)',
      },
      {
        code: `function slot(i, k, F, B) {
  return i * F + k;
}`,
        why: 'That is the packed AoS index. In AoSoA, neighbouring elements’ values of one field are adjacent.',
      },
      {
        code: `function slot(i, k, F, B) {
  const blk = Math.floor(i / B);
  return blk * F * B + k * B + i % B;
}`,
        why: 'The arithmetic is right, but it accepts B = 6 and B = 1. Viscosity refuses block sizes that are not powers of two of at least 2; so must you.',
      },
    ],
  },
  blockSum: {
    optional: true,
    title: 'Loop over blocks, not elements',
    prompt:
      'The generated code works out a block and lane for every access. A hand-written loop (like the benchmark’s `aosoa8` kernels) can avoid that. Write `blockSum(data, n, k, F, B)`: the sum of field `k` over the first `n` elements, looping over blocks and then lanes. Careful: the last block may be only partly used, and its spare slots may hold anything.',
    starter: `function blockSum(data, n, k, F, B) {
  // your code here
  return 0;
}`,
    solution: `function blockSum(data, n, k, F, B) {
  let s = 0;
  for (let b = 0; b * B < n; b++) {
    const base = b * F * B + k * B;
    const m = Math.min(B, n - b * B);
    for (let l = 0; l < m; l++)
      s += data[base + l];
  }
  return s;
}`,
    tests: `function build(n, F, B) {
  const cap = Math.ceil(n / B) * B;
  const d = new Float64Array(cap * F).fill(1000);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < F; k++)
      d[Math.floor(i / B) * F * B + k * B + (i % B)] = i * 10 + k;
  return d;
}
test('whole blocks', () => {
  expect(blockSum(build(16, 3, 8), 16, 1, 3, 8)).toBe(1216);
});
test('a partial last block', () => {
  expect(blockSum(build(10, 3, 8), 10, 0, 3, 8)).toBe(450);
});
test('fewer elements than a block', () => {
  expect(blockSum(build(3, 2, 4), 3, 1, 2, 4)).toBe(33);
});
test('empty', () => {
  expect(blockSum(build(0, 2, 4), 0, 0, 2, 4)).toBe(0);
});`,
    hints: [
      'Two loops: an outer one over blocks, an inner one over the lanes of a block.',
      'Field k of block b starts at `b * F * B + k * B`, and its B values are consecutive. The outer loop runs while `b * B < n`.',
      'In the last block only `n - b * B` lanes are real: loop to `Math.min(B, n - b * B)`, never to B.',
    ],
    walkthrough: `**How to think about it.** Inside a block, field k is a run of B consecutive doubles, so once you know where that run starts, the inner loop is a plain scan, just like a SoA column. The block arithmetic then happens once per block instead of once per element. The trap is the end: capacity is whole blocks, so slots past \`n\` exist and hold whatever was there (the tests fill them with 1000 to make the bug visible).

**The solution, line by line.**

- \`let s = 0;\` is the running sum.
- \`for (let b = 0; b * B < n; b++) {\` visits each block that holds at least one real element: for n = 10 and B = 8 that is blocks 0 and 1.
- \`const base = b * F * B + k * B;\` is the slot of field k's first lane in block b.
- \`const m = Math.min(B, n - b * B);\` is how many lanes of this block are real: 8 for block 0, but only \`10 - 8 = 2\` for block 1.
- \`for (let l = 0; l < m; l++) s += data[base + l];\` adds those lanes, one after another in memory.
- \`return s;\` after the outer loop.

**Common wrong attempts.**

- Looping \`l < B\` in every block adds the spare slots of a partly used last block. This is the AoSoA version of the rule from *Growing collections*: compare with the length, never with the capacity.
- Looping \`b * B <= n\` visits one block too many when n is a multiple of B.

Viscosity's emitter does not restructure loops this way: it rewrites each access in place, which is far simpler to prove correct, and which is why its AoSoA code can only be slower than this loop.`,
    wrong: [
      {
        code: `function blockSum(data, n, k, F, B) {
  let s = 0;
  for (let b = 0; b * B < n; b++) {
    const base = b * F * B + k * B;
    for (let l = 0; l < B; l++)
      s += data[base + l];
  }
  return s;
}`,
        why: 'This always sums B lanes, including the spare slots of a partly used last block.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Three fields, blocks of 8. Where does block 2 start?',
    options: [
      { t: 'Slot 16', why: 'That would be 2 × 8, forgetting that each block holds all three fields.' },
      { t: 'Slot 6', why: 'That is 2 × 3, the packed AoS stride.' },
      { t: 'Slot 48', correct: true, why: 'Each block is F × B = 24 slots, so block 2 starts at 2 × 24.' },
      { t: 'Slot 24', why: 'That is where block 1 starts.' },
    ],
  },
  {
    q: 'What does Viscosity do with `// @viscosity aosoa(6)`?',
    options: [
      { t: 'Uses blocks of 6 with division and remainder.', why: 'The emitter only generates shifts and masks.' },
      { t: 'Rounds up to blocks of 8.', why: 'It doesn’t adjust the block size silently.' },
      { t: 'Falls back to SoA with an explanation.', why: 'It falls back to an array of objects, not SoA.' },
      { t: 'Keeps an array of objects: “the block size must be a power of two (2, 4, 8, 16, ...)”.', correct: true, why: 'The planner checks the block size and keeps the collection with a reason, so the compile goes on.' },
      { t: 'Stops the compile with an error.', why: 'It used to, from the emitter; now the planner refuses it first and the compile goes on.' },
    ],
  },
  {
    q: 'The AoSoA container grows from 16 to 32 elements. What does `grow()` do?',
    options: [
      { t: 'Moves each field’s values to new positions.', why: 'Blocks are self-contained, so the existing ones keep their positions.' },
      { t: 'Allocates one array twice the size and copies the old one into its start.', correct: true, why: 'The old blocks stay where they were; new empty blocks follow.' },
      { t: 'Allocates one new array per field.', why: 'That is SoA’s growth. AoSoA has a single `data` array.' },
      { t: 'Appends 16 elements to the existing Float64Array.', why: 'A Float64Array can’t grow in place.' },
    ],
  },
  {
    q: 'You annotate a collection whose records have a `name` string with `aosoa(8)`. What happens?',
    options: [
      { t: 'name gets a plain array column, the rest go in blocks.', why: 'That mixing is what SoA does; AoSoA has no plain columns.' },
      { t: 'The strings are stored as NaN.', why: 'Viscosity never changes values; it refuses instead.' },
      { t: 'It stays an array of objects: “annotated aosoa, but fields name may hold non-numbers”.', correct: true, why: 'One shared Float64Array can only hold numbers.' },
      { t: 'The compiler crashes.', why: 'This case gets a proper explanation in explain, as a bad block size does.' },
    ],
  },
  {
    q: 'What did this book’s V8 measurements show about AoSoA with blocks of 8?',
    options: [
      { t: 'It was the fastest layout at every size.', why: 'Plain SoA beat it in the update and random-access suites.' },
      { t: 'It was rarely better than SoA, and often slower than objects at 1,000 elements.', correct: true, why: 'With no SIMD lanes to fill, blocks bought little that plain columns did not already give, and at small sizes the extra work cost more than it saved.' },
      { t: 'It was identical to SoA.', why: 'It was measurably slower in most suites.' },
      { t: 'It wasn’t measured.', why: 'The `aosoa8` layout is in every suite of the benchmark run.' },
    ],
  },
];
