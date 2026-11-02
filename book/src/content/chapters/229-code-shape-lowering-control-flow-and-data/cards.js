// Chapter 229 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Listings quoted in the chapter are clang 18.1.3 -O2 --target=riscv64
// -march=rv64im.

export const prompts = {
  'shape-what': {
    q: 'What is **code shape**?',
    a: 'The patterns a compiler uses to express each construct in machine instructions; shapes for one construct are equally correct but differ in cost.',
  },
  'invert-test': {
    q: 'Why does `if (a < b) f(); else g();` become `bge a0, a1, else`?',
    a: 'A RISC-V branch has one target and otherwise falls through, so the then part follows the test and the branch jumps away on the opposite condition.',
  },
  'andand-shape': {
    q: 'How is `if (a > 0 && b > 0) f();` shaped on RISC-V?',
    a: 'Two branches to the same exit, one per test (blez a0, blez a1); the second runs only if the first passed, with no boolean value computed.',
  },
  'rotate-why': {
    q: 'What does rotating a loop (testing at the bottom) save, and what does it cost?',
    a: 'It saves one branch per trip (a single bne tests and jumps back); it costs one extra copy of the test, as a guard before the loop.',
  },
  'tail-call': {
    q: 'What does `tail f` do, and when may a compiler use it?',
    a: 'It jumps to f without changing ra, so f returns straight to our caller; allowed when calling f is the last thing the function does.',
  },
  'addr-formula': {
    q: 'What is the address of `a[i]`?',
    a: 'base + i × size, where base is the address of a[0] and size is one element’s size in bytes.',
  },
  'shift-for-mul': {
    q: 'Why does clang compute `i * 8` with `slli a1, a1, 3`?',
    a: '8 is 2 to the 3rd, so shifting left by 3 multiplies by 8, more cheaply than mul.',
  },
  'field-offset': {
    q: 'In `ld a0, 8(a0)` for `ps[i].vx`, where does the 8 come from?',
    a: 'It is vx’s offset inside the 16-byte record, carried for free in the load’s 12-bit offset.',
  },
  'aos-soa-stride': {
    q: 'Reading `vx` of every particle: what is the stride in AoS (16-byte records) and in SoA?',
    a: '16 bytes in AoS (one whole record per step); 8 bytes in SoA, where the vx values are side by side.',
  },
};

export const examples = {
  addresses: {
    title: 'ps[i].vx in two layouts',
    code: `const SIZE = 16;          // one P
const off = { x: 0, vx: 8 };
const ps = 1000;          // AoS base
const vxs = 3000;         // SoA column
for (let i = 0; i < 3; i++) {
  const aos = ps + i * SIZE + off.vx;
  const soa = vxs + i * 8;
  console.log(i, aos, soa);
}`,
  },
};

export const exercises = {
  'lower-load': {
    title: 'Lower an element load',
    prompt: `Write \`lowerLoad(dst, base, idx, size, off)\`: return the RISC-V lines that load the 8-byte value at \`base + idx × size + off\` into register \`dst\`, where \`base\` and \`idx\` are registers that may be overwritten, as clang does:

1. multiply \`idx\` by \`size\` in place: if \`size\` is a power of two greater than 1, \`slli idx, idx, k\` (where \`size\` is 2 to the k); if it is 1, nothing; otherwise \`li t0, size\` then \`mul idx, idx, t0\`;
2. \`add base, base, idx\`;
3. \`ld dst, off(base)\`.

The offset must fit a load's 12-bit signed immediate: if \`off\` is outside -2048 to 2047, **throw**. Write lines with single spaces, like \`slli a1, a1, 4\`.`,
    starter: `function lowerLoad(dst, base, idx,
  size, off) {
  return [
    'add ' + base + ', ' + base +
      ', ' + idx,
    'ld ' + dst + ', ' + off +
      '(' + base + ')',
  ];
}`,
    solution: `function lowerLoad(dst, base, idx,
  size, off) {
  if (off < -2048 || off > 2047) {
    throw new Error('offset too big');
  }
  const out = [];
  const pow2 =
    (size & (size - 1)) === 0;
  if (!pow2) {
    out.push('li t0, ' + size);
    out.push('mul ' + idx + ', ' +
      idx + ', t0');
  } else if (size > 1) {
    const k = Math.log2(size);
    out.push('slli ' + idx + ', ' +
      idx + ', ' + k);
  }
  out.push('add ' + base + ', ' +
    base + ', ' + idx);
  out.push('ld ' + dst + ', ' + off +
    '(' + base + ')');
  return out;
}`,
    tests: `test('getsoa: vxs[i]', () => {
  expect(lowerLoad('a0', 'a0', 'a1', 8, 0))
    .toEqual(['slli a1, a1, 3',
      'add a0, a0, a1', 'ld a0, 0(a0)']);
});
test('getvx: ps[i].vx, 16-byte records', () => {
  expect(lowerLoad('a0', 'a0', 'a1', 16, 8))
    .toEqual(['slli a1, a1, 4',
      'add a0, a0, a1', 'ld a0, 8(a0)']);
});
test('a 24-byte record needs mul', () => {
  expect(lowerLoad('a2', 'a0', 'a1', 24, 16))
    .toEqual(['li t0, 24',
      'mul a1, a1, t0', 'add a0, a0, a1',
      'ld a2, 16(a0)']);
});
test('bytes: no scaling at all', () => {
  expect(lowerLoad('a0', 'a0', 'a1', 1, 0))
    .toEqual(['add a0, a0, a1',
      'ld a0, 0(a0)']);
});
test('an offset too big for 12 bits', () => {
  expect(() => lowerLoad('a0', 'a0', 'a1',
    8, 4096)).toThrow();
});`,
    hints: [
      'Follow the three steps in order and push one string per instruction onto an array.',
      'A number is a power of two exactly when `(size & (size - 1)) === 0`; then `Math.log2(size)` is the shift amount. Size 1 is a power of two whose shift is 0, and needs no instruction.',
      'Check the offset first and `throw` if it is outside -2048 to 2047; the field offset goes in the load itself: `"ld " + dst + ", " + off + "(" + base + ")"`.',
    ],
    walkthrough: `**How to think about it.** The formula is \`base + idx × size + off\`, and RISC-V can do the last \`+ off\` for free inside the load (its one addressing mode), so the work is: scale the index, add the base, load with the offset. The only decision is how to scale: a shift when the size is a power of two, a real multiply otherwise.

**The solution, line by line.**

- \`if (off < -2048 || off > 2047) throw ...\`: the load's offset is a 12-bit signed immediate; a field further away would need its offset added with separate instructions, and we refuse rather than emit a load the assembler would reject.
- \`const pow2 = (size & (size - 1)) === 0;\`: a power of two has exactly one bit set, and subtracting 1 clears it and sets the bits below, so the AND is 0 (for 16: \`10000 & 01111\`). For 24 (\`11000\`) it is not.
- \`if (!pow2) { li t0, size; mul idx, idx, t0 }\`: \`mul\` takes two registers, so the size is loaded into the temporary \`t0\` first (a caller-saved scratch register, free to use).
- \`else if (size > 1) { slli idx, idx, k }\`: \`Math.log2(16)\` is 4, so \`slli a1, a1, 4\` multiplies by 16. For size 1 the index is already a byte offset.
- \`add base, base, idx\` makes the record's address, and \`ld dst, off(base)\` adds the field offset and loads. With \`(a0, a0, a1, 16, 8)\` this is exactly clang's \`getvx\`.

**Common wrong attempts.**

- The starter forgets to scale, so it reads byte \`i\` instead of element \`i\`: correct only for size 1.
- Shifting by the size instead of its logarithm (\`slli a1, a1, 16\`) multiplies by 65536.
- Using \`slli\` for every size, with \`Math.log2(24)\` (about 4.58): not an instruction at all.`,
    wrong: [
      {
        code: `function lowerLoad(dst, base, idx,
  size, off) {
  if (off < -2048 || off > 2047) {
    throw new Error('offset too big');
  }
  return [
    'slli ' + idx + ', ' + idx + ', ' +
      size,
    'add ' + base + ', ' + base +
      ', ' + idx,
    'ld ' + dst + ', ' + off +
      '(' + base + ')',
  ];
}`,
        why: 'It shifts by the size itself rather than by log2 of the size, and never uses mul for sizes that are not powers of two.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop is rotated. How many branch instructions run for a loop that makes 10 trips?',
    options: [
      { t: '21: a test and a jump per trip, plus the final test', why: 'That is the top-tested shape: 2n + 1.' },
      { t: '11: the guard once, then one bne per trip', correct: true, why: 'n + 1: the rotated shape tests once at the bottom of each trip.' },
      { t: '10: one per trip, with no guard', why: 'Without the guard, a loop that should run zero times would run once.' },
    ],
  },
  {
    q: 'How does RISC-V code usually lower `if (x == 0) A; else B;`?',
    options: [
      { t: 'bnez x, else; A; j end; else: B; end:', correct: true, why: 'Branch away on the opposite condition, fall into A, and jump over B.' },
      { t: 'beqz x, then; B; then: A', why: 'This runs A after B whenever x is not zero: the then part is not skipped.' },
      { t: 'A single instruction with two targets', why: 'RISC-V branches have one target and otherwise fall through.' },
    ],
  },
  {
    q: '`struct P { long x, vx; }`. At what address is `ps[3].x`?',
    options: [
      { t: 'ps + 3 × 8', why: 'Each record is 16 bytes, not 8.' },
      { t: 'ps + 3 × 16 + 8', why: 'Offset 8 is vx; x is at offset 0.' },
      { t: 'ps + 3 × 16', correct: true, why: 'Base plus index times record size, plus x’s offset, which is 0: ps + 48.' },
    ],
  },
  {
    q: 'Why can clang fold the `+ 8` of `ps[i].vx` into the load?',
    options: [
      { t: 'RISC-V loads add a 12-bit constant offset to a base register', correct: true, why: 'Base plus offset is the addressing mode, so ld a0, 8(a0) does the last addition.' },
      { t: 'Because 8 is a power of two', why: 'Any offset from -2048 to 2047 can be folded this way.' },
      { t: 'The processor knows the layout of struct P', why: 'The processor knows nothing of records; the compiler computes the offset.' },
    ],
  },
  {
    q: 'In a summing loop over `xs`, clang emits `addi a0, a0, 8` each trip rather than `slli` and `add`. Why?',
    options: [
      { t: 'slli is slower than addi on every chip', why: 'Not the reason: the loop simply no longer needs i × 8 at all.' },
      { t: 'Strength reduction: it keeps a pointer to xs[i] and moves it 8 bytes per trip', correct: true, why: 'The address of xs[i+1] is the address of xs[i] plus 8, so one add replaces the multiply and add.' },
      { t: 'Because xs holds bytes', why: 'The step is 8 because the elements are 8-byte longs.' },
    ],
  },
];
