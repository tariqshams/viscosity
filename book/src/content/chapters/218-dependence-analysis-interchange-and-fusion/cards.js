// Chapter 220 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dep-kinds': {
    q: 'Name the three kinds of dependence, by which access comes first.',
    a: 'Flow: write, then read. Anti: read, then write. Output: write, then write.',
  },
  'dep-distance': {
    q: 'Iteration `(i, j)` reads what iteration `(i - 1, j + 1)` wrote. What are the distance and direction vectors?',
    a: 'Distance `(1, -1)`, direction `(<, >)`.',
  },
  'dep-carried': {
    q: 'Which loop carries a dependence with direction vector `(=, <)`?',
    a: 'The inner loop: the outermost entry that is not `=` is the second one.',
  },
  'false-deps': {
    q: 'Why are anti and output dependences sometimes called false dependences?',
    a: 'They come from reusing the same memory, not from a value passing between trips, so copying or renaming can remove them.',
  },
  'gcd-test': {
    q: 'State the GCD test for a write to `x[a·i + b]` and a read of `x[c·i + d]`.',
    a: 'They can only meet if `gcd(a, c)` divides `d - b`; if it does not, there is no dependence.',
  },
  'gcd-maybe': {
    q: 'The GCD test says “maybe” for `a[i]` and `a[i + 100]` in a loop of 50 trips. Is there a dependence?',
    a: 'No: the test ignores the loop bounds, and every solution needs `i` to reach 100.',
  },
  'interchange-legal': {
    q: 'A nest has a dependence with direction `(<, >)`. May its two loops be swapped?',
    a: 'No: swapped it becomes `(>, <)`, which would run the reader before the writer.',
  },
  'fusion-legal': {
    q: 'Loop 1 writes `a[i]`; loop 2 reads `a[i + 1]`. Why can they not be fused?',
    a: 'Fused, trip `i` would read `a[i + 1]` before trip `i + 1` writes it.',
  },
};

export const examples = {};

export const exercises = {
  gcdTest: {
    title: 'The GCD test',
    prompt: 'A loop writes `x[a * i + b]` and reads `x[c * i + d]`, with whole numbers `a`, `b`, `c`, `d` (any of them may be 0 or negative). Write `gcdTest(a, b, c, d)` that returns `\'independent\'` when the GCD test proves the two never touch the same element, and `\'maybe\'` otherwise. When `a` and `c` are both 0, both accesses are fixed slots: they meet exactly when `b === d`.',
    starter: `function gcdTest(a, b, c, d) {
  // your code here
  return 'maybe';
}

console.log(gcdTest(2, 0, 2, 1));
// 'independent'`,
    solution: `function gcd(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function gcdTest(a, b, c, d) {
  const g = gcd(a, c);
  if (g === 0) {
    return b === d
      ? 'maybe' : 'independent';
  }
  return (d - b) % g === 0
    ? 'maybe' : 'independent';
}`,
    tests: `test('even slots against odd slots', () => {
  expect(gcdTest(2, 0, 2, 1)).toBe('independent');
});
test('a[4i] and a[6i + 2] may meet', () => {
  expect(gcdTest(4, 0, 6, 2)).toBe('maybe');
});
test('stride 1 always gives maybe', () => {
  expect(gcdTest(1, 0, 1, 100)).toBe('maybe');
});
test('multiples of 3 against one more', () => {
  expect(gcdTest(3, 0, 3, 1)).toBe('independent');
});
test('offsets on both sides', () => {
  expect(gcdTest(6, 1, 4, 3)).toBe('maybe');
  expect(gcdTest(6, 1, 4, 4)).toBe('independent');
});
test('a negative coefficient', () => {
  expect(gcdTest(-2, 0, 4, 1)).toBe('independent');
});
test('two fixed slots', () => {
  expect(gcdTest(0, 5, 0, 5)).toBe('maybe');
  expect(gcdTest(0, 5, 0, 6)).toBe('independent');
});
test('one fixed slot against a stride', () => {
  expect(gcdTest(0, 7, 2, 0)).toBe('independent');
  expect(gcdTest(0, 8, 2, 0)).toBe('maybe');
});`,
    hints: [
      'The two touch the same element when `a·i₁ + b = c·i₂ + d`, that is `a·i₁ - c·i₂ = d - b`.',
      'Write a `gcd(x, y)` using Euclid’s method: replace `(x, y)` by `(y, x % y)` until `y` is 0. Use `Math.abs` first.',
      'If `gcd(a, c)` divides `d - b` (the remainder is 0), answer `\'maybe\'`, otherwise `\'independent\'`. Handle a gcd of 0 separately.',
    ],
    walkthrough: `**How to think about it.** Two accesses touch the same element when some iteration \`i₁\` of the write and some iteration \`i₂\` of the read give the same index: \`a·i₁ + b = c·i₂ + d\`, or \`a·i₁ - c·i₂ = d - b\`. Whatever whole numbers you pick for \`i₁\` and \`i₂\`, the left side is always a multiple of \`g = gcd(a, c)\` (both terms are), so if \`d - b\` is not a multiple of \`g\` there is no solution at all, and so no dependence. If it is a multiple, a solution exists, but maybe only outside the loop's bounds, so all we can say is "maybe". The one special case is \`a = c = 0\`: then \`g\` is 0, the accesses are two fixed slots, and they meet exactly when \`b === d\`.

**The solution, line by line.**

- \`function gcd(x, y) {\` is Euclid's method. \`x = Math.abs(x);\` and \`y = Math.abs(y);\` drop the signs, which do not change which numbers divide.
- \`while (y !== 0) [x, y] = [y, x % y];\` repeatedly replaces the pair by (the smaller, the remainder), which keeps the same common divisors; when \`y\` reaches 0, \`x\` is the gcd. (\`gcd(0, 0)\` comes out as 0.)
- \`const g = gcd(a, c);\` in \`gcdTest\` computes the divisor.
- \`if (g === 0) { return b === d ? 'maybe' : 'independent'; }\` handles two fixed slots.
- \`return (d - b) % g === 0 ? 'maybe' : 'independent';\` is the test itself: remainder 0 means \`g\` divides \`d - b\`.

Check it on \`a[4i]\` and \`a[6i + 2]\`: \`g = 2\`, \`d - b = 2\`, remainder 0, so "maybe", and indeed \`i₁ = 2\`, \`i₂ = 1\` both reach slot 8. When only one of \`a\`, \`c\` is 0, the gcd is the other one, and the formula still works: slot 7 against \`a[2i]\` needs \`2·i₂ = 7\`, impossible.

**Common wrong attempts.**

- Comparing only the offsets (\`b === d\`) misses \`a[4i]\` and \`a[6i + 2]\`, which really do meet.
- Dividing by \`a\` alone, rather than by \`gcd(a, c)\`, says "independent" for \`a[4i]\` against \`a[6i + 2]\` (2 is not a multiple of 4), which is wrong.`,
    wrong: [
      {
        code: `function gcdTest(a, b, c, d) {
  return b === d
    ? 'maybe' : 'independent';
}`,
        why: 'Only compares offsets: `a[4i]` and `a[6i + 2]` do meet (slot 8), but this says independent.',
      },
      {
        code: `function gcdTest(a, b, c, d) {
  if (a === 0) {
    return b === d
      ? 'maybe' : 'independent';
  }
  return (d - b) % a === 0
    ? 'maybe' : 'independent';
}`,
        why: 'Divides by `a` instead of `gcd(a, c)`: for `a[4i]` and `a[6i + 2]` it says independent, but they meet.',
      },
    ],
  },
  interchangeLegal: {
    optional: true,
    title: 'May these two loops be swapped?',
    prompt: '`dirs` lists the direction vectors of every dependence in a two-deep loop nest, each as two strings from `\'<\'`, `\'=\'` and `\'>\'` (outer loop first). Write `interchangeLegal(dirs)` returning `true` when swapping the two loops is legal: after swapping the two entries of every vector, the first entry that is not `\'=\'` must be `\'<\'` (a vector of all `\'=\'` is always fine).',
    starter: `function interchangeLegal(dirs) {
  // your code here
  return true;
}

console.log(interchangeLegal([
  ['<', '>'],
])); // false`,
    solution: `function interchangeLegal(dirs) {
  return dirs.every(([out, inn]) => {
    const swapped = [inn, out];
    const first = swapped.find(
      (x) => x !== '=');
    return first === undefined ||
      first === '<';
  });
}`,
    tests: `test('(<, >) cannot be swapped', () => {
  expect(interchangeLegal([['<', '>']])).toBe(false);
});
test('(<, =) and (=, <) can', () => {
  expect(interchangeLegal([['<', '='], ['=', '<']])).toBe(true);
});
test('(<, <) can', () => {
  expect(interchangeLegal([['<', '<']])).toBe(true);
});
test('one bad vector is enough to forbid it', () => {
  expect(interchangeLegal([['<', '='], ['<', '>']])).toBe(false);
});
test('no dependences at all', () => {
  expect(interchangeLegal([])).toBe(true);
});
test('a loop-independent dependence', () => {
  expect(interchangeLegal([['=', '=']])).toBe(true);
});`,
    hints: [
      'Every vector must pass, so `every` is a good fit.',
      'Swap the two entries, then find the first one that is not `\'=\'`.',
      'Legal if there is no such entry, or if it is `\'<\'`.',
    ],
    walkthrough: `**How to think about it.** A dependence must always point forwards in time: its source has to run before its sink. In the original nest that is guaranteed, because the first entry of every direction vector that is not \`=\` is \`<\`. Swapping the loops swaps the entries of each vector, so we only need to check that the property still holds for every swapped vector. A single vector that now starts with \`>\` means some reader would run before its writer.

**The solution, line by line.**

- \`return dirs.every(([out, inn]) => {\` checks every vector, naming its two entries (outer, inner).
- \`const swapped = [inn, out];\` is the vector after interchange.
- \`const first = swapped.find((x) => x !== '=');\` (two lines) finds the first entry that is not \`=\`, or \`undefined\` if both are \`=\`.
- \`return first === undefined || first === '<';\` accepts a loop-independent dependence, or one that still points forwards.

**Common wrong attempts.**

- Checking the vectors without swapping them: every original vector is fine by construction, so that always says yes.
- Rejecting any vector containing \`>\`: \`(=, >)\` cannot occur in a valid nest, but \`(<, >)\` is the case the rule exists for, and the mistake is to look only for \`>\` rather than at which entry comes first after the swap.`,
    wrong: [
      {
        code: `function interchangeLegal(dirs) {
  return dirs.every(([out, inn]) => {
    const first = [out, inn].find(
      (x) => x !== '=');
    return first === undefined ||
      first === '<';
  });
}`,
        why: 'Checks the original vectors, which always start with `<`; the check must be on the swapped ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `for (i...) b[i] = b[i + 1];`, what kind of dependence ties trip `i` to trip `i + 1`?',
    options: [
      {
        t: 'Flow: trip `i + 1` needs a value trip `i` computed',
        why: 'Trip `i` writes `b[i]`, which trip `i + 1` never reads.',
      },
      {
        t: 'Anti: trip `i` reads `b[i + 1]` before trip `i + 1` overwrites it',
        correct: true,
        why: 'Read first, write later: an anti dependence.',
      },
      {
        t: 'Output: both trips write `b[i + 1]`',
        why: 'Each trip writes a different element.',
      },
      {
        t: 'None',
        why: 'They share the element `b[i + 1]`, and one of them writes it.',
      },
    ],
  },
  {
    q: 'A dependence has distance vector `(0, 2)`. Which loop carries it?',
    options: [
      {
        t: 'The outer loop',
        why: 'Its entry is 0: source and sink are in the same outer trip.',
      },
      {
        t: 'Neither: it is loop-independent',
        why: 'Loop-independent means every entry is 0.',
      },
      {
        t: 'The inner loop',
        correct: true,
        why: 'The outermost entry that is not 0 belongs to the inner loop.',
      },
    ],
  },
  {
    q: 'What does the GCD test say about a write to `a[3 * i]` and a read of `a[3 * i + 2]`?',
    options: [
      {
        t: 'Independent: gcd(3, 3) = 3 does not divide 2',
        correct: true,
        why: 'One only touches multiples of 3, the other never does.',
      },
      {
        t: 'Maybe: they are in the same array',
        why: 'Being in the same array is not enough; the slots must be able to coincide.',
      },
      {
        t: 'Dependent, with distance 2',
        why: 'There is no pair of iterations reaching the same slot.',
      },
    ],
  },
  {
    q: 'Why does swapping the loops of a column-by-column walk over a grid stored row by row usually make it faster?',
    options: [
      {
        t: 'It does fewer additions',
        why: 'It does exactly the same additions, in a different order.',
      },
      {
        t: 'The inner loop then walks along a row, stride one, so each cache line fetched is used in full',
        correct: true,
        why: 'Column order jumps a whole row per step, so most of each cache line fetched goes unused.',
      },
      {
        t: 'It removes the bounds checks',
        why: 'Interchange does not affect checks.',
      },
    ],
  },
  {
    q: 'Loop 1 writes `a[i]` for all `i`; loop 2 then reads `a[i - 1]` at trip `i`. Can they be fused?',
    options: [
      {
        t: 'No: a loop that writes can never be fused',
        why: 'Fusion is fine whenever no trip of the second loop needs a later write of the first.',
      },
      {
        t: 'Only if they are unrolled first',
        why: 'Unrolling does not change which trip needs which.',
      },
      {
        t: 'Yes: trip `i` of the fused loop reads `a[i - 1]`, written at the earlier trip `i - 1`',
        correct: true,
        why: 'The write still comes first. It is reading `a[i + 1]` that would prevent fusion.',
      },
    ],
  },
];
