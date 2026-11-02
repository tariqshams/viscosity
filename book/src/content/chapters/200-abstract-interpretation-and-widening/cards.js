// Cards for "Abstract interpretation and widening" (split from chapter
// 186). Keys are stable ids: never rename them.

export const prompts = {
  'ai-what': {
    q: 'What is **abstract interpretation**, in one sentence?',
    a: 'Running a program on abstract values (descriptions such as “positive”) to learn facts true of every run.',
  },
  'domain-what': {
    q: 'What does an **abstract domain** consist of?',
    a: 'A lattice of abstract values, an abstract version of each operation, and a join for merging paths.',
  },
  'join-up': {
    q: 'Where two paths meet, why does abstract interpretation take the **join** of the descriptions?',
    a: 'A value arriving from either path must fit, so it takes the lowest description covering both.',
  },
  'sound-what': {
    q: 'When is an abstract analysis **sound**?',
    a: 'When every concrete result of every run lies inside the abstract result it computes.',
  },
  'top-sound': {
    q: 'Answering ⊤ (“any number”) for every value is sound. What is wrong with it?',
    a: 'It is useless: it describes every number, so it proves nothing.',
  },
  'infinite-height': {
    q: 'Why can an interval analysis go on for ever on a counting loop?',
    a: 'Intervals have infinite height: the upper bound can grow by one every round, without end.',
  },
  'widen-what': {
    q: 'What does the interval **widening** `[a, b] ∇ [c, d]` do?',
    a: 'Any bound that moved outwards jumps to infinity (−∞ or +∞); bounds that held stay.',
  },
  'widen-sound': {
    q: 'Widening loses precision. Why is the result still sound?',
    a: 'Its result is above the join of both arguments, so it still covers every value that can arrive.',
  },
  'viscosity-domains': {
    q: 'Why does Viscosity never need widening?',
    a: 'Its domains are finite and tiny (number or maybe-not; non-negative integer or don’t know), so iteration always settles.',
  },
};

export const examples = {
  signs: {
    title: 'An abstract interpreter for signs',
    code: `// Abstract values: '-', '0', '+', 'T'
const sign = (n) =>
  n < 0 ? '-' : n === 0 ? '0' : '+';
const add = (a, b) =>
  a === '0' ? b : b === '0' ? a
    : a === b ? a : 'T';
const mul = (a, b) =>
  a === '0' || b === '0' ? '0'
    : a === 'T' || b === 'T' ? 'T'
    : a === b ? '+' : '-';
// x = -3; y = x * x; z = y + 1
const x = sign(-3);
const y = mul(x, x);
const z = add(y, sign(1));
console.log('x', x, 'y', y, 'z', z);`,
  },
};

const SOLVER = `// blocks: { b: { preds, code } }, in
// order. code: [v, k] is v = k, and
// [v, w, k] is v = w + k. heads: the
// loop headers. Returns IN for every
// block, or null if 50 rounds don't
// settle.
function analyse(blocks, heads) {
  const inn = {};
  const out = {};
  for (let r = 0; r < 50; r++) {
    let changed = false;
    for (const b in blocks) {
      const { preds, code } = blocks[b];
      let f = preds.length ? null : {};
      for (const p of preds) {
        const g = out[p];
        if (!g) continue;
        if (!f) f = { ...g };
        else for (const v in f) {
          f[v] = join(f[v], g[v]);
        }
      }
      if (!f) continue;
      const old = inn[b];
      if (heads.includes(b) && old) {
        for (const v in f) {
          if (!old[v]) continue;
          f[v] = widen(old[v], f[v]);
        }
      }
      inn[b] = f;
      const o = { ...f };
      for (const [v, w, k] of code) {
        o[v] = k === undefined ? [w, w]
          : [o[w][0] + k, o[w][1] + k];
      }
      if (!same(o, out[b])) {
        out[b] = o;
        changed = true;
      }
    }
    if (!changed) return inn;
  }
  return null;
}
function same(a, b) {
  if (!b) return false;
  return Object.keys(a).every((v) =>
    a[v][0] === b[v]?.[0] &&
    a[v][1] === b[v]?.[1]);
}`;

const SOL = `// Intervals are [lo, hi] arrays.
function join(a, b) {
  return [Math.min(a[0], b[0]),
    Math.max(a[1], b[1])];
}
function widen(old, nu) {
  const lo = nu[0] < old[0]
    ? -Infinity : old[0];
  const hi = nu[1] > old[1]
    ? Infinity : old[1];
  return [lo, hi];
}
${SOLVER}`;

export const exercises = {
  intervals: {
    title: 'Interval analysis with widening',
    prompt: `The code below is a complete interval analysis over a CFG given as data, except for two functions. Write them:

- \`join(a, b)\`: the smallest interval covering both \`a\` and \`b\` (intervals are \`[lo, hi]\` arrays);
- \`widen(old, nu)\`: start from \`old\`; if \`nu\`’s lower bound is below \`old\`’s, the lower bound becomes \`-Infinity\`, and if \`nu\`’s upper bound is above \`old\`’s, the upper bound becomes \`Infinity\`.

\`analyse\` joins the facts arriving at each block, widens at loop headers (\`heads\`), and runs rounds until nothing changes, giving up with \`null\` after 50 rounds. Read it, but you should not need to change it.`,
    starter: `// Intervals are [lo, hi] arrays.
function join(a, b) {
  return a; // fix me
}
function widen(old, nu) {
  return nu; // fix me
}
${SOLVER}`,
    solution: SOL,
    tests: `test('join covers both', () => {
  expect(join([0, 2], [5, 6]))
    .toEqual([0, 6]);
  expect(join([3, 3], [1, 4]))
    .toEqual([1, 4]);
});
test('widen jumps moving bounds', () => {
  expect(widen([0, 0], [0, 1]))
    .toEqual([0, Infinity]);
  expect(widen([3, 8], [2, 8]))
    .toEqual([-Infinity, 8]);
  expect(widen([3, 8], [4, 6]))
    .toEqual([3, 8]);
});
test('an if/else needs only join', () => {
  const r = analyse({
    b0: { preds: [], code: [] },
    b1: { preds: ['b0'],
      code: [['x', 1]] },
    b2: { preds: ['b0'],
      code: [['x', 5]] },
    b3: { preds: ['b1', 'b2'],
      code: [['y', 'x', 1]] },
    b4: { preds: ['b3'], code: [] },
  }, []);
  expect(r.b4).toEqual({
    x: [1, 5], y: [2, 6] });
});
test('a counting loop settles', () => {
  const r = analyse({
    b0: { preds: [],
      code: [['i', 0]] },
    b1: { preds: ['b0', 'b2'],
      code: [] },
    b2: { preds: ['b1'],
      code: [['i', 'i', 1]] },
    b3: { preds: ['b1'], code: [] },
  }, ['b1']);
  expect(r.b1.i).toEqual([0, Infinity]);
  expect(r.b3.i).toEqual([0, Infinity]);
});`,
    hints: [
      '`join` takes the smaller of the two lower bounds and the larger of the two upper bounds: `Math.min` and `Math.max`.',
      '`widen` looks at each bound on its own. Compare `nu[0]` with `old[0]`: if it went down, the answer’s lower bound is `-Infinity`; otherwise keep `old[0]`.',
      'Do the same for the upper bound with `Infinity`, and return `[lo, hi]`. Never return a bound from `nu` itself: that is what lets the climb go on.',
    ],
    walkthrough: `**How to think about it.** The solver is already there, and it is the solver of the dataflow chapters with intervals as facts: join at every block, the abstract versions of \`v = k\` and \`v = w + k\`, rounds until nothing changes. Two things are missing. The join must give the smallest interval that covers both incoming ones, since a value arriving from either path must fit. And at a loop header the solver calls \`widen(old, nu)\` with what the header held last round and what arrives now; that is where the endless climb \`[0, 0]\`, \`[0, 1]\`, \`[0, 2]\` must be cut short. The rule: any bound that moved outwards jumps to infinity; a bound that held stays exactly as it was.

**The solution, line by line.**

- \`function join(a, b) {\` takes two intervals.
- \`return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];\` The lower bound is the lower of the two, the upper bound the higher: \`[0, 2]\` and \`[5, 6]\` give \`[0, 6]\`, which also covers the gap between them (intervals can't have holes).
- \`function widen(old, nu) {\` takes last round's interval and this round's.
- \`const lo = nu[0] < old[0] ? -Infinity : old[0];\` If the lower bound went down, it may go on going down, so jump to minus infinity; otherwise keep the old bound.
- \`const hi = nu[1] > old[1] ? Infinity : old[1];\` The same for the upper bound, upwards.
- \`return [lo, hi];\`

Trace the counting loop. Round 1: the header b1 gets \`[0, 0]\` from b0 (b2 has no OUT yet), and b2 sends back \`[1, 1]\`. Round 2: the header joins \`[0, 0]\` and \`[1, 1]\` into \`[0, 1]\`, then widens: \`widen([0, 0], [0, 1])\` keeps 0 and jumps the upper bound, \`[0, Infinity]\`. b2 sends back \`[1, Infinity]\`. Round 3: the join is \`[0, Infinity]\`, widening keeps it, and nothing changes: the fixpoint, sound, since every real \`i\` is at least 0.

**Common wrong attempts.**

- No widening (\`return nu\`): the header's upper bound grows by one every round, and after 50 rounds the solver gives up with \`null\`.
- Widening that keeps \`nu\`'s bounds when they moved (\`[nu[0], nu[1]]\`): the same endless climb, only described differently.
- Joining with \`Math.max\` for the lower bound: the result no longer covers both intervals, which is unsound; on the if/else, \`x\` would be claimed to be exactly 5.`,
    wrong: [
      {
        code: SOL.replace(`  const lo = nu[0] < old[0]
    ? -Infinity : old[0];
  const hi = nu[1] > old[1]
    ? Infinity : old[1];
  return [lo, hi];`, `  return nu;`),
        why: 'Without widening, the loop header’s interval grows by one each round, and the solver gives up after 50 rounds.',
      },
      {
        code: SOL.replace('return [Math.min(a[0], b[0]),', 'return [Math.max(a[0], b[0]),'),
        why: 'This “join” does not cover both intervals: on the if/else it claims x is exactly 5, which is unsound.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the signs domain, what is `−` plus `+`?',
    options: [
      { t: '`0`', why: 'Only if the two numbers happen to be equal in size; −5 + 2 is negative.' },
      { t: '`⊤`, any number', correct: true, why: 'A negative plus a positive can be negative, zero or positive, so the sound answer is ⊤.' },
      { t: '`+`', why: '−5 + 2 is −3: claiming + would be unsound.' },
    ],
  },
  {
    q: 'An analysis says `x` is in `[0, 10]`, and on some run `x` is 12. What went wrong?',
    options: [
      { t: 'The analysis is unsound: a real value lies outside its answer.', correct: true, why: 'Soundness means every concrete value is inside the abstract one.' },
      { t: 'Nothing: abstract answers are only estimates.', why: 'A sound analysis may be imprecise (too wide), never too narrow.' },
      { t: 'The analysis needed widening.', why: 'Widening makes answers wider so loops stop; it doesn’t fix a wrong transfer function.' },
    ],
  },
  {
    q: 'At a loop header, the old interval was `[0, 4]` and the new one is `[0, 5]`. What does widening give?',
    options: [
      { t: '`[0, 5]`', why: 'That is the join; the next round would give [0, 6], and so on.' },
      { t: '`[−∞, +∞]`', why: 'The lower bound held, so it stays 0.' },
      { t: '`[0, +∞]`', correct: true, why: 'Only the upper bound moved, so only it jumps to infinity.' },
    ],
  },
  {
    q: 'Why do intervals need widening when signs do not?',
    options: [
      { t: 'Intervals are not a lattice.', why: 'They are a lattice, with join; it is their height that is the problem.' },
      { t: 'The interval lattice has infinite height, so a loop can climb for ever; signs has height 2.', correct: true, why: 'With finite height, every climb stops by itself.' },
      { t: 'Signs are always exact.', why: 'Signs lose lots of information (− + + is ⊤); they just can’t climb for ever.' },
      { t: 'Intervals are only used for loops.', why: 'They are used everywhere; loops are where they fail to settle.' },
    ],
  },
  {
    q: 'Viscosity’s `nonNegInt` returns true when it meets a phi it is already checking. What does that amount to?',
    options: [
      { t: 'A bug: it should return false to be safe.', why: 'Returning false there would make every loop counter “don’t know”, like a pessimistic start.' },
      { t: 'An optimistic assumption round a cycle, which the other operands then confirm or refute.', correct: true, why: 'Like starting a loop phi at the top: the phi’s answer is decided by its non-cyclic operands.' },
      { t: 'Widening.', why: 'Nothing jumps to infinity; the domain is finite.' },
    ],
  },
];
