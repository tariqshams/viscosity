// Chapter 34 cards. Keys are stable ids: never rename them.

export const prompts = {
  'binary-what': {
    q: 'In binary, what are the place values, from the right?',
    a: '1, 2, 4, 8, 16, …: each place is worth double the one to its right.',
  },
  'bit-byte': {
    q: 'What is a bit, and how many bits make a byte?',
    a: 'A bit is a single 0 or 1. A byte is 8 bits.',
  },
  'byte-range': {
    q: 'What range of whole numbers can one byte hold, and why?',
    a: '0 to 255. Eight bits have 2⁸ = 256 different patterns.',
  },
  'and-or': {
    q: 'What are `5 & 3` and `5 | 3`? (5 is `101`, 3 is `011`.)',
    a: '`5 & 3` is `1` (`001`: only where both are on). `5 | 3` is `7` (`111`: where either is on).',
  },
  'xor-flip': {
    q: 'What does `x ^ 1` do to the last bit of `x`, and what happens if you do it twice?',
    a: 'It flips the last bit; doing it twice flips it back, so `x ^ 1 ^ 1` is `x`.',
  },
  'shift-left': {
    q: 'Why does `x << 1` double a small whole number `x`?',
    a: 'Every bit moves one place left, where each place is worth twice as much.',
  },
  'ops-32bit': {
    q: 'What do the bitwise operators do to a number like `3.7` before they work?',
    a: 'Convert it to a 32-bit integer, dropping the fraction: `3.7 | 0` is `3`.',
  },
  'flags-brackets': {
    q: 'Why must you write `(flags & VISIBLE) !== 0` with brackets?',
    a: '`!==` is worked out before `&`, so without brackets it means `flags & (VISIBLE !== 0)`, a different calculation.',
  },
};

export const examples = {
  bits: {
    title: 'Bits, masks and shifts',
    code: `console.log((13).toString(2));
console.log(13 & 6, 13 | 6, 13 ^ 6);
console.log(1 << 3, 13 >> 1);

// Bitwise ops work on 32-bit ints:
console.log(3.7 | 0);
console.log(2 ** 32 | 0);
console.log(-1 >>> 0);

// Flags, one bit each:
const ALIVE = 1;
const VISIBLE = 2;
let flags = ALIVE | VISIBLE;
console.log((flags & VISIBLE) !== 0);
flags = flags ^ VISIBLE;
console.log((flags & VISIBLE) !== 0);
// Try removing the brackets.`,
  },
};

export const exercises = {
  countBits: {
    title: 'Count the switches that are on',
    prompt:
      'Write `countBits(n)`: how many bits are 1 in the 32-bit pattern of `n`? For example, `13` is `1101`, so `countBits(13)` is `3`. Use `&` and `>>>`. (For `-1`, all 32 bits are on.)',
    starter: `function countBits(n) {
  // your code here
}

console.log(countBits(13));`,
    solution: `function countBits(n) {
  let count = 0;
  let v = n >>> 0;
  while (v !== 0) {
    count = count + (v & 1);
    v = v >>> 1;
  }
  return count;
}`,
    tests: `test('zero has no bits on', () => {
  expect(countBits(0)).toBe(0);
});
test('13 is 1101', () => {
  expect(countBits(13)).toBe(3);
});
test('a full byte', () => {
  expect(countBits(255)).toBe(8);
});
test('a power of two has one bit', () => {
  expect(countBits(1024)).toBe(1);
});
test('-1 has all 32 bits on', () => {
  expect(countBits(-1)).toBe(32);
});`,
    hints: [
      'You can only look at one bit easily: the rightmost. How could you bring each of the others there, one at a time?',
      '`v & 1` is `1` if the rightmost bit of `v` is on, and `0` otherwise. After counting it, slide everything right with `v >>> 1` and look again; stop when `v` is `0`.',
      'Start with `let v = n >>> 0;` (the unsigned pattern), then `while (v !== 0) { count = count + (v & 1); v = v >>> 1; }`. Use `>>>`, not `>>`: for a negative number, `>>` keeps copying the sign bit in from the left, so `v` would never reach `0`.',
    ],
    walkthrough: `**How to think about it.** Picture the 32 switches in a row. Looking at all of them at once is hard, but the rightmost one is easy: \`v & 1\` masks away every bit except the last, leaving \`1\` if it is on and \`0\` if it is off. So count that one, then slide the whole row one place to the right so the next switch becomes the rightmost, and repeat. When every remaining switch is off, \`v\` is \`0\` and we can stop. The edge case to think about before writing a line is a negative number, because the way it is stored (two's complement) has its leftmost bit on.

**The solution, line by line.**

- \`function countBits(n) {\` takes the number.
- \`  let count = 0;\` will hold the number of 1 bits seen so far.
- \`  let v = n >>> 0;\` turns \`n\` into its 32-bit pattern read *without a sign*. For positive numbers nothing changes; for \`-1\` it gives \`4294967295\`, which is 32 ones, so the loop below sees the same bits but as a positive number.
- \`  while (v !== 0) {\` keeps going while any switch is still on.
- \`    count = count + (v & 1);\` adds the rightmost bit: \`1101 & 0001\` is \`0001\`, so \`1\` is added; for \`1100\` it would be \`0\`.
- \`    v = v >>> 1;\` slides every bit one place right; the bit just counted falls off the end, and a \`0\` comes in on the left. That inflow of zeros is what guarantees the loop ends after at most 32 slides.
- \`  }\` ends the loop.
- \`  return count;\` hands back the total.
- \`}\` closes the body.

For \`13\`: \`1101\` adds 1, \`110\` adds 0, \`11\` adds 1, \`1\` adds 1, then \`v\` is \`0\`: the answer is 3.

**Common wrong attempts.**

- Testing \`while (v > 0)\` without the \`>>> 0\` first: \`-1\` is not greater than 0, so the loop never runs and the answer is \`0\`.
- Using \`>>\` to slide: it copies the sign bit back in from the left, so \`-1 >> 1\` is still \`-1\` and the loop never ends. The last test is exactly that edge case.
- Using ordinary division, \`v / 2\`, instead of a shift: \`13 / 2\` is \`6.5\`, not \`6\`, and the fractions pile up into a wrong count.`,
    wrong: [
      {
        code: `function countBits(n) {
  let count = 0;
  let v = n;
  while (v > 0) {
    count = count + (v & 1);
    v = v >>> 1;
  }
  return count;
}`,
        why: 'For `-1`, `v > 0` is false straight away, so this returns `0`. Convert to the unsigned pattern first (`n >>> 0`), or test `v !== 0`.',
      },
      {
        code: `function countBits(n) {
  let count = 0;
  let v = n;
  while (v >= 1) {
    count = count + (v % 2);
    v = v / 2;
  }
  return count;
}`,
        why: '`v / 2` is ordinary division, so `13 / 2` is `6.5`, not `6`, and `6.5 % 2` is `0.5`. The fractions pile up into a wrong count. Use the bit operators, which work on whole 32-bit patterns.',
      },
    ],
  },
  isPowerOfTwo: {
    optional: true,
    title: 'Is it a power of two?',
    prompt:
      'Write `isPowerOfTwo(n)` for a whole number `n` from 0 up to 2³⁰: return `true` if `n` is 1, 2, 4, 8, … (exactly one bit on), and `false` otherwise. Use the trick that `n & (n - 1)` turns off the lowest 1 bit of `n`.',
    starter: `function isPowerOfTwo(n) {
  // your code here
}

console.log(isPowerOfTwo(8));`,
    solution: `function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,
    tests: `test('powers of two', () => {
  expect(isPowerOfTwo(1)).toBe(true);
  expect(isPowerOfTwo(8)).toBe(true);
  expect(isPowerOfTwo(1024)).toBe(true);
});
test('others are not', () => {
  expect(isPowerOfTwo(6)).toBe(false);
  expect(isPowerOfTwo(12)).toBe(false);
});
test('zero is not a power of two', () => {
  expect(isPowerOfTwo(0)).toBe(false);
});`,
    hints: [
      'Write a few powers of two in binary: 1, 10, 100, 1000. What do they all have in common?',
      'A power of two has exactly one bit on. `n - 1` turns that bit off and every bit below it on (`1000 - 1` is `0111`), so `n & (n - 1)` is `0` exactly for powers of two.',
      'Return `(n & (n - 1)) === 0`, with brackets, but also check `n > 0` first, because `0 & -1` is `0` too.',
    ],
    walkthrough: `**How to think about it.** In binary, the powers of two are the numbers with exactly one switch on: 1 is \`1\`, 2 is \`10\`, 4 is \`100\`, 8 is \`1000\`. Subtracting 1 from such a number borrows all the way along: \`1000 - 1\` is \`0111\`, the one bit off and everything below it on. So a power of two and the number just below it share no bits at all, and \`&\` gives \`0\`. Any other number has a second 1 bit higher up, which \`n - 1\` leaves alone, so \`&\` keeps it and the answer is not \`0\`: for 12, \`1100 & 1011\` is \`1000\`. The edge case is \`0\`: it has no bits on, so it is not a power of two, yet \`0 & -1\` is \`0\` too.

**The solution, line by line.**

- \`function isPowerOfTwo(n) {\` takes the number.
- \`  return n > 0 && (n & (n - 1)) === 0;\` first rules out \`0\` (and \`&&\` stops there if \`n > 0\` is false), then checks that turning off the lowest 1 bit leaves nothing. The brackets round \`n & (n - 1)\` matter, because \`===\` would otherwise be worked out before \`&\`, the same slip as with flags.
- \`}\` closes the body.

**Common wrong attempts.**

- Leaving out \`n > 0\`: \`isPowerOfTwo(0)\` returns \`true\`, because \`0 & -1\` is \`0\`. The edge-case test catches it.
- Leaving out the brackets: \`n & (n - 1) === 0\` means \`n & ((n - 1) === 0)\`, which is \`n & false\` (always \`0\`) for every \`n\` except 1, where it is \`1 & true\`, which is \`1\` rather than \`true\`; either way, no test passes.`,
    wrong: [
      {
        code: `function isPowerOfTwo(n) {
  return (n & (n - 1)) === 0;
}`,
        why: 'This says `0` is a power of two, because `0 & -1` is `0`. Rule out `n <= 0` first.',
      },
      {
        code: `function isPowerOfTwo(n) {
  return n > 0 && n & (n - 1) === 0;
}`,
        why: 'Without brackets, `===` runs before `&`, so this computes `n & ((n - 1) === 0)`: `0` for every number except 1, which gives `1`, and never `true`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the binary number `1011` in decimal?',
    options: [
      { t: '`1011`', why: 'That is the same digits read as decimal. In binary the places are 8, 4, 2, 1.' },
      { t: '`7`', why: '`7` is `0111`. `1011` has the 8 on.' },
      { t: '`11`', correct: true, why: '8 + 0 + 2 + 1 = 11.' },
      { t: '`13`', why: '`13` is `1101`: the middle bits are swapped.' },
    ],
  },
  {
    q: 'What is `12 & 10`? (12 is `1100`, 10 is `1010`.)',
    options: [
      { t: '`8`', correct: true, why: 'Only the 8s place is on in both: `1000`.' },
      { t: '`14`', why: '`14` (`1110`) is `12 | 10`: on in either.' },
      { t: '`6`', why: '`6` (`0110`) is `12 ^ 10`: on in exactly one.' },
      { t: '`22`', why: 'That is `12 + 10`. `&` works bit by bit and never carries.' },
    ],
  },
  {
    q: 'How many different patterns can 4 bits make?',
    options: [
      { t: '4', why: 'That is the number of bits, not the number of patterns.' },
      { t: '8', why: 'Each extra bit doubles the count: 2, 4, 8, 16 for 1, 2, 3, 4 bits.' },
      { t: '16', correct: true, why: '2⁴ = 16 patterns, so 4 bits can count from 0 to 15.' },
    ],
  },
  {
    q: '`flags` is `1` (only `ALIVE`), and `VISIBLE` is `2`. What is `flags & VISIBLE !== 0`?',
    options: [
      { t: '`false`, because the particle is not visible', why: 'That is what `(flags & VISIBLE) !== 0` gives. Without brackets the line means something else.' },
      { t: '`1`', correct: true, why: '`!==` runs first: `VISIBLE !== 0` is `true`, and `1 & true` is `1 & 1`, which is `1`: truthy, the wrong answer.' },
      { t: 'A `TypeError`', why: 'JavaScript quietly converts `true` to `1`; no error is reported.' },
    ],
  },
  {
    q: 'What is `2 ** 32 | 0`?',
    options: [
      { t: '`4294967296`', why: 'That is `2 ** 32` itself, but `|` first converts to 32 bits.' },
      { t: '`-1`', why: '`-1` is all 32 bits on. `2 ** 32` has only bit 32 on, which does not fit.' },
      { t: '`0`', correct: true, why: '`2 ** 32` is a 1 followed by 32 zeros; the conversion keeps only the low 32 bits, all zero.' },
    ],
  },
];
