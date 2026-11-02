// Chapter 260 cards. Keys are stable ids: never rename them.

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
    a: 'So the block and lane are a shift and a mask (`i >> s`, `i & (B-1)`) instead of a division and a remainder.',
  },
  'ao-lane-mask': {
    q: 'For B = 8, what does `i & 7` compute?',
    a: 'The lane: `i % 8`, the element’s position inside its block.',
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
    a: 'In this book’s V8 measurements it rarely beat SoA, and was slower at small sizes.',
  },
  'ao-ispc': {
    q: 'Where does a block of 8 pay off, as in ISPC’s `soa<8>`?',
    a: 'When the block matches SIMD lanes, so one vector load fills a register with 8 values of a field.',
  },
};

export const examples = {};

export const exercises = {
  aosoaSlot: {
    title: 'An AoSoA index function',
    prompt:
      'Write `slot(i, k, F, B)`: the index in the shared `Float64Array` of field `k` of element `i`, for `F` fields in blocks of `B`. Use a shift and a mask, like Viscosity. If `B` is not a power of two, throw an error.',
    starter: `function slot(i, k, F, B) {
  // your code here
  return 0;
}

console.log(slot(10, 1, 3, 8));`,
    solution: `function slot(i, k, F, B) {
  if (!(B > 0 && (B & (B - 1)) === 0))
    throw new Error('B must be 2^n');
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
test('B = 1 is packed AoS', () => {
  expect(slot(5, 2, 3, 1)).toBe(17);
});
test('B = 6 is refused', () => {
  expect(() => slot(1, 0, 3, 6)).toThrow();
});`,
    hints: [
      'Block number: `i >> Math.log2(B)`. Lane: `i & (B - 1)`.',
      'A block is `F * B` slots; inside it, field `k` starts at `k * B`.',
      'A power of two has exactly one bit set, so `(B & (B - 1)) === 0`.',
    ],
    walkthrough: `This is the formula the emitter writes, with F and B as parameters instead of constants.

- **Block start:** \`(i >> sh) * F * B\`. Shifting right by \`log2(B)\` drops the lane bits, which is \`Math.floor(i / B)\` for non-negative \`i\`. Each block has \`F * B\` slots.
- **Field start inside the block:** \`k * B\`, because each field has B slots per block.
- **Lane:** \`i & (B - 1)\` keeps the low bits, which is \`i % B\`.
- **The power-of-two check.** For B = 6, \`i >> log2(6)\` would shift by 2.58…, which JavaScript truncates to 2, giving blocks of 4: silently wrong. So refuse, like Viscosity does. \`B & (B - 1)\` clears the lowest set bit; it is 0 only when B has a single bit set.
- **B = 1** gives \`i * F + k\`: packed AoS, a block per element. And with B at least the length, AoSoA becomes SoA. AoSoA sits between the two.`,
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
        why: 'The arithmetic is right, but it accepts B = 6. Viscosity refuses block sizes that aren’t powers of two; so must you.',
      },
    ],
  },
  blockSum: {
    optional: true,
    title: 'Loop over blocks, not elements',
    prompt:
      'The generated code works out a block and lane for every access. A hand-written loop can avoid that. Write `blockSum(data, n, k, F, B)`: the sum of field `k` over the first `n` elements, looping over blocks and then lanes. Careful: the last block may be only partly used, and its spare slots may hold anything.',
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
      'Outer loop over blocks: `for (let b = 0; b * B < n; b++)`.',
      'Field k of block b starts at `b * F * B + k * B`; its B values are consecutive.',
      'In the last block only `n - b * B` lanes are real: use `Math.min(B, n - b * B)`.',
    ],
    walkthrough: `Inside a block, field k is a run of B consecutive doubles, so the inner loop is a plain sequential scan, just like a SoA column. The block arithmetic happens once per block instead of once per element.

The partial block is the trap. Capacity is whole blocks, so slots past \`n\` exist and hold whatever was there (here 1000, to make the bug visible). Stopping at \`Math.min(B, n - b * B)\` is the AoSoA version of chapter 258’s rule: compare with length, never with capacity.

Viscosity’s emitter doesn’t restructure loops this way: it rewrites each access in place, which is simpler to prove correct.`,
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
    q: 'Why does `ps[1002].z` compile to a call to `__vsc_aosoa(...)` instead of the inline formula?',
    options: [
      { t: 'Its index is wrapped in a bounds check, and the helper evaluates it once.', correct: true, why: 'The formula uses the index twice; an expression like `__vsc_bc(...)` shouldn’t run twice.' },
      { t: '1002 is not a multiple of 8.', why: 'Any index works with the formula; the block and lane handle it.' },
      { t: 'The z field is stored in a separate array.', why: 'All fields share one `data` array in AoSoA.' },
      { t: 'Literals can’t be shifted.', why: '`1002 >> 3` is perfectly valid JavaScript.' },
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
      { t: 'It was rarely better than SoA, and often slower than objects at 1,000 elements.', correct: true, why: 'Index arithmetic costs more than it saves when there are no SIMD lanes to fill.' },
      { t: 'It was identical to SoA.', why: 'It was measurably slower in most suites.' },
      { t: 'It wasn’t measured.', why: 'The `aosoa8` layout is in every suite of the benchmark run.' },
    ],
  },
];
