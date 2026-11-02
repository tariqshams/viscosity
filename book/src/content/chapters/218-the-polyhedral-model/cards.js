// Chapter 217-b cards (split from chapter 217). Keys are stable ids.

export const prompts = {
  'affine-what': {
    q: 'When is an array index affine in the loop counters?',
    a: 'When it is a constant times each counter, added up, plus a constant: like `2 * i + j - 1`.',
  },
  'affine-not': {
    q: 'Name two indexes that are not affine.',
    a: '`a[i * i]` (a counter times a counter) and `a[idx[i]]` (an index read from another array).',
  },
  'affine-matrix': {
    q: 'Write the access `a[i + 1][2 * j]` as a matrix and a vector.',
    a: 'Matrix `[1 0; 0 2]` times `(i, j)`, plus `(1, 0)`.',
  },
  'domain-what': {
    q: 'What is a loop nest’s iteration domain?',
    a: 'The set of whole-number points (one per iteration) that satisfy the loops’ bounds, written as linear inequalities.',
  },
  'schedule-what': {
    q: 'What does a schedule do, and what is the original nest’s schedule?',
    a: 'It gives each iteration a time (a vector, compared entry by entry); the original is `θ(i, j) = (i, j)`.',
  },
  'schedule-legal': {
    q: 'For a linear schedule `M` and a dependence distance `d`, when is the schedule legal for that dependence?',
    a: 'When `M · d` starts with a positive entry (its first non-zero entry is above zero).',
  },
  'skew-why': {
    q: 'What does skewing `(i, j) ↦ (i, i + j)` do to the distance `(1, -1)`, and why does it help?',
    a: 'It becomes `(1, 0)`: legal, and with no negative entry, so the skewed nest can be tiled.',
  },
  'viscosity-1d': {
    q: 'In polyhedral terms, what does Viscosity’s bounds proof show?',
    a: 'That the identity access maps the domain `0 ≤ i < ps.length` inside the array.',
  },
};

export const examples = {};

export const exercises = {
  legalSchedule: {
    title: 'Is this schedule legal?',
    prompt:
      'A linear schedule for a two-deep nest is a 2 × 2 matrix `M` (an array of two rows), mapping iteration `(i, j)` to time `M · (i, j)`. `deps` lists dependence distance vectors `[di, dj]`. Write `legalSchedule(M, deps)` returning `true` when, for every distance `d`, the vector `M · d` has a positive first non-zero entry. (A distance that `M` maps to `(0, 0)` puts two different iterations at the same time: treat that as **not** legal.)',
    starter: `function legalSchedule(M, deps) {
  // your code here
  return true;
}

const swap = [[0, 1], [1, 0]];
console.log(
  legalSchedule(swap, [[1, -1]]));
// false`,
    solution: `function legalSchedule(M, deps) {
  return deps.every(([di, dj]) => {
    const t = M.map(([p, q]) =>
      p * di + q * dj);
    const first = t.find(
      (x) => x !== 0);
    return first !== undefined &&
      first > 0;
  });
}`,
    tests: `const id = [[1, 0], [0, 1]];
const swap = [[0, 1], [1, 0]];
const skew = [[1, 0], [1, 1]];
test('the original order is legal', () => {
  expect(legalSchedule(id, [[1, -1], [0, 1]])).toBe(true);
});
test('interchange breaks (1, -1)', () => {
  expect(legalSchedule(swap, [[1, -1]])).toBe(false);
});
test('interchange is fine for (1, 0) and (0, 1)', () => {
  expect(legalSchedule(swap, [[1, 0], [0, 1]])).toBe(true);
});
test('skewing keeps (1, -1) legal', () => {
  expect(legalSchedule(skew, [[1, -1]])).toBe(true);
});
test('one bad dependence is enough', () => {
  expect(legalSchedule(swap, [[0, 1], [1, -1]])).toBe(false);
});
test('two iterations at the same time is not legal', () => {
  expect(legalSchedule([[1, 1], [1, 1]], [[1, -1]])).toBe(false);
});
test('no dependences: anything goes', () => {
  expect(legalSchedule(swap, [])).toBe(true);
});`,
    hints: [
      'Each row of `M` gives one entry of the time vector: row `[p, q]` gives `p * di + q * dj`.',
      'Compute the transformed distance `t` with `M.map(...)`, then find its first entry that is not 0.',
      'Legal for that dependence when such an entry exists and is positive; legal overall when every dependence passes (`every`).',
    ],
    walkthrough: `**How to think about it.** A schedule is legal when every dependence still goes from an earlier time to a later one. For a linear schedule the time difference between a dependence's two ends is \`M · t - M · s = M · (t - s) = M · d\`, so you never need the iterations themselves, only the distance vectors. "Later" means lexicographically later: the first entry where the two times differ must be bigger at the sink, which is "the first non-zero entry of \`M · d\` is positive". If every entry is zero, the two ends would get the same time, which is not "before", so that fails too.

**The solution, line by line.**

- \`return deps.every(([di, dj]) => {\` checks each distance, naming its entries.
- \`const t = M.map(([p, q]) => p * di + q * dj);\` (two lines) multiplies the matrix by the distance: one entry per row.
- \`const first = t.find((x) => x !== 0);\` finds the first entry that is not zero, or \`undefined\` if there is none.
- \`return first !== undefined && first > 0;\` passes the dependence only if that entry exists and is positive.

Check the skew: \`M = [[1, 0], [1, 1]]\` and \`d = [1, -1]\` give \`t = [1·1 + 0·(-1), 1·1 + 1·(-1)] = [1, 0]\`, first non-zero entry 1, legal. The swap gives \`[-1, 1]\`, first entry -1, illegal.

**Common wrong attempts.**

- Checking only the first entry of \`M · d\`: for interchange on \`(1, 0)\` that entry is 0, and the answer depends on the second.
- Requiring every entry to be non-negative: that is the stronger condition for *tiling*, not for a legal order.
- Accepting \`(0, 0)\`: two iterations at the same time is not an order at all.`,
    wrong: [
      {
        code: `function legalSchedule(M, deps) {
  return deps.every(([di, dj]) => {
    const [p, q] = M[0];
    return p * di + q * dj > 0;
  });
}`,
        why: 'Looks only at the first entry, so interchange on `(0, 1)` (first entry 1) passes but on `(1, 0)` (first entry 0, second 1) wrongly fails.',
      },
      {
        code: `function legalSchedule(M, deps) {
  return deps.every(([di, dj]) =>
    M.every(([p, q]) =>
      p * di + q * dj >= 0));
}`,
        why: 'Demands no negative entry at all, which is the tiling condition, and accepts `(0, 0)`; the identity order on `(1, -1)` is legal, but this says no.',
      },
    ],
  },
  domainPoints: {
    optional: true,
    title: 'Enumerate an iteration domain',
    prompt:
      'An iteration domain is given as a list of inequalities `[a, b, c]`, each meaning `a·i + b·j + c ≥ 0`. Write `domainPoints(ineqs, max)` returning every whole-number point `[i, j]` with `0 ≤ i, j ≤ max` that satisfies all of them, in the order a nest with `i` outside and `j` inside would visit them.',
    starter: `function domainPoints(ineqs, max) {
  // your code here
  return [];
}

// 0 <= j <= i <= 2: a triangle
const tri = [[0, 1, 0], [1, -1, 0],
  [-1, 0, 2]];
console.log(domainPoints(tri, 5));`,
    solution: `function domainPoints(ineqs, max) {
  const out = [];
  for (let i = 0; i <= max; i++) {
    for (let j = 0; j <= max; j++) {
      const holds = ([a, b, c]) =>
        a * i + b * j + c >= 0;
      const ok = ineqs.every(holds);
      if (ok) out.push([i, j]);
    }
  }
  return out;
}`,
    tests: `test('a triangle', () => {
  const tri = [[0, 1, 0], [1, -1, 0], [-1, 0, 2]];
  expect(domainPoints(tri, 5)).toEqual([[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]]);
});
test('a rectangle', () => {
  const rect = [[-1, 0, 1], [0, -1, 2]];
  expect(domainPoints(rect, 4)).toEqual([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]);
});
test('an empty domain', () => {
  expect(domainPoints([[1, 0, -10]], 3)).toEqual([]);
});
test('no inequalities: the whole box', () => {
  expect(domainPoints([], 1)).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]]);
});`,
    hints: [
      'Try every point in the box with two nested loops, `i` outside.',
      'A point is in the domain when every inequality holds: `ineqs.every(...)`.',
      'For `[a, b, c]`, the test is `a * i + b * j + c >= 0`.',
    ],
    walkthrough: `**How to think about it.** The domain is defined by its inequalities, so the plainest way to list its points is to try every point in a box that surely contains it and keep the ones that pass every test. (Real polyhedral tools do much better: they generate loops whose bounds visit exactly the points inside, with no testing; but the set they visit is the same.)

**The solution, line by line.**

- \`const out = [];\` collects the points.
- \`for (let i = 0; i <= max; i++) {\` and \`for (let j = 0; j <= max; j++) {\` walk the box with \`i\` outside, which gives the order the exercise asks for.
- \`const holds = ([a, b, c]) => a * i + b * j + c >= 0;\` (two lines) tests one inequality at this point, and \`const ok = ineqs.every(holds);\` checks them all.
- \`if (ok) out.push([i, j]);\` keeps the point.
- \`return out;\` hands back the list.

The triangle's three inequalities read \`j ≥ 0\`, \`i - j ≥ 0\` (so \`j ≤ i\`) and \`2 - i ≥ 0\` (so \`i ≤ 2\`).

**Common wrong attempts.**

- Using \`some\` instead of \`every\` keeps points that satisfy just one inequality.
- Swapping the loops lists the same points in a different order, which the tests reject.`,
    wrong: [
      {
        code: `function domainPoints(ineqs, max) {
  const out = [];
  for (let i = 0; i <= max; i++) {
    for (let j = 0; j <= max; j++) {
      const holds = ([a, b, c]) =>
        a * i + b * j + c >= 0;
      const ok = ineqs.some(holds);
      if (ok) out.push([i, j]);
    }
  }
  return out;
}`,
        why: '`some` keeps a point that satisfies any one inequality; a domain needs all of them.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which index is affine in the loop counters `i` and `j`?',
    options: [
      { t: '`a[i * j]`', why: 'A counter times a counter is not linear.' },
      { t: '`a[3 * i - j + 7]`', correct: true, why: 'Constants times counters, plus a constant.' },
      { t: '`a[idx[i]]`', why: 'The index comes from another array’s contents, which the model cannot see.' },
    ],
  },
  {
    q: 'What is the iteration domain of `for (i = 0; i < n; i++) for (j = i; j < n; j++)`?',
    options: [
      { t: 'All points with `0 ≤ i < n` and `0 ≤ j < n`', why: 'The inner loop starts at `i`, not 0.' },
      { t: 'All points with `0 ≤ j ≤ i < n`', why: 'That is the other triangle: here `j` starts at `i` and goes up.' },
      { t: 'All points with `0 ≤ i ≤ j < n`', correct: true, why: 'Each bound becomes an inequality: `0 ≤ i`, `i < n`, `i ≤ j`, `j < n`.' },
    ],
  },
  {
    q: 'A nest has the dependence distance `(1, -1)`. Which schedule is legal?',
    options: [
      { t: '`θ(i, j) = (j, i)`, interchange', why: '`(1, -1)` becomes `(-1, 1)`, which starts negative.' },
      { t: '`θ(i, j) = (i, i + j)`, skewing', correct: true, why: '`(1, -1)` becomes `(1, 0)`, which starts positive.' },
      { t: '`θ(i, j) = (i + j, i + j)`', why: '`(1, -1)` becomes `(0, 0)`: both ends at the same time.' },
    ],
  },
  {
    q: 'Why does skewing the nest `a[i][j] = a[i - 1][j + 1]` make it possible to tile?',
    options: [
      { t: 'Skewing removes the dependence', why: 'The same iterations still depend on each other; only their times change.' },
      { t: 'Skewing makes the loops shorter', why: 'The same number of iterations run.' },
      { t: 'The distance becomes `(1, 0)`, which has no negative entry, so the skewed loops are fully permutable', correct: true, why: 'That is the condition for tiling from the last chapter.' },
      { t: 'Tiling never needs legality checks after skewing', why: 'Legality is always checked; skewing is what makes the check pass.' },
    ],
  },
  {
    q: 'What does LLVM’s Polly use the polyhedral model for, according to its README?',
    options: [
      { t: 'Only for parsing C', why: 'Polly works on loops in LLVM’s IR, after parsing.' },
      { t: 'To represent and transform loops, for example for cache locality, parallelisation and vectorisation', correct: true, why: 'Its README lists those among the transformations.' },
      { t: 'To choose data layouts, as Viscosity does', why: 'Polly transforms loops; Viscosity changes data layouts.' },
    ],
  },
];
