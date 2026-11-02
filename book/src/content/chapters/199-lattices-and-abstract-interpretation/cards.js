// Chapter 199 cards. Keys are stable ids: never rename them.

export const prompts = {
  'partial-what': {
    q: 'What makes an order **partial** rather than total?',
    a: 'Some pairs need not be comparable: neither is below the other, like {a, b} and {b, c}.',
  },
  'meet-join': {
    q: 'In the lattice of subsets of {a, b, c}, what are the meet and the join of {a, b} and {b, c}?',
    a: 'Meet {b} (the highest set below both); join {a, b, c} (the lowest set above both).',
  },
  'height-what': {
    q: 'What is the **height** of a lattice?',
    a: 'The largest number of steps down from its top to its bottom.',
  },
  'wide-short': {
    q: 'The constant lattice has infinitely many facts. Why does an analysis on it still stop?',
    a: 'Its height is only 2, so each fact can move down at most twice.',
  },
  'monotone-what': {
    q: 'What does it mean for a transfer function to be **monotone**?',
    a: 'A higher input never gives a lower output: x ⊑ y implies f(x) ⊑ f(y).',
  },
  'genkill-monotone': {
    q: 'Why is `f(IN) = gen ∪ (IN − kill)` monotone (with ⊆ as the order)?',
    a: 'A bigger IN, minus the same kill and plus the same gen, still gives a set at least as big.',
  },
  'framework-what': {
    q: 'What are the three ingredients of a **monotone framework**?',
    a: 'A lattice of finite height, a meet, and monotone transfer functions.',
  },
  'greatest-fixpoint': {
    q: 'Iterating from the top reaches which fixpoint, and why is it the best one?',
    a: 'The greatest: every fixpoint is below the top, and monotone steps keep it below every step of the chain.',
  },
  'mop-what': {
    q: 'What is the **meet over all paths** answer?',
    a: 'Apply the transfer functions along each path separately, then meet the results of all the paths.',
  },
  'distributive-equal': {
    q: 'When does the iterative answer equal the meet over all paths?',
    a: 'When every transfer function is distributive: f(x ⊓ y) = f(x) ⊓ f(y).',
  },
};

export const examples = {
  mop: {
    title: 'Meet first, or add first?',
    code: `// A constant, or 'varies'.
const meet = (p, q) =>
  p === q ? p : 'varies';
const add = (p, q) =>
  p === 'varies' || q === 'varies'
    ? 'varies' : p + q;
// if c { a = 1; b = 2 }
// else { a = 2; b = 1 }
// x = a + b
const l = { a: 1, b: 2 };
const r = { a: 2, b: 1 };
// Each path on its own, then meet:
const mop = meet(add(l.a, l.b),
  add(r.a, r.b));
// Meet at the join, then add:
const a = meet(l.a, r.a);
const b = meet(l.b, r.b);
console.log('per path:', mop);
console.log('merged first:', add(a, b));`,
  },
};

const HEAD = `// points: every fact in the lattice
// leq(x, y): is x below or equal y?
// f: a function from facts to facts
// Return true if f is monotone.
function isMonotone(points, leq, f) {`;

const SOL = `${HEAD}
  for (const x of points) {
    for (const y of points) {
      if (!leq(x, y)) continue;
      const ok = leq(f(x), f(y));
      if (!ok) return false;
    }
  }
  return true;
}`;

export const exercises = {
  monotone: {
    title: 'Is this rule monotone?',
    prompt: `Write \`isMonotone(points, leq, f)\`. \`points\` lists every fact of a small lattice, \`leq(x, y)\` says whether \`x\` is below or equal to \`y\`, and \`f\` maps facts to facts.

Return \`true\` if \`f\` is monotone (for every pair with \`x ⊑ y\`, also \`f(x) ⊑ f(y)\`) and \`false\` otherwise. The tests use the two-point lattice \`'number'\` above \`'maybe'\`, and sets of variables (sorted arrays) ordered by “contains”.`,
    starter: `${HEAD}
  return true;
}`,
    solution: SOL,
    tests: `const two = ['maybe', 'number'];
const le2 = (x, y) =>
  x === y || x === 'maybe';
const sets = [[], ['a'], ['b'],
  ['a', 'b']];
const sub = (x, y) =>
  x.every((v) => y.includes(v));
test('the identity is monotone', () => {
  expect(isMonotone(two, le2,
    (x) => x)).toBe(true);
});
test('swapping is not', () => {
  expect(isMonotone(two, le2,
    (x) => x === 'number'
      ? 'maybe' : 'number'))
    .toBe(false);
});
test('a constant rule is monotone', () => {
  expect(isMonotone(two, le2,
    () => 'maybe')).toBe(true);
});
test('gen/kill is monotone', () => {
  const f = (s) => [...new Set(['b',
    ...s.filter((v) => v !== 'a')])]
    .sort();
  expect(isMonotone(sets, sub, f))
    .toBe(true);
});
test('“if empty, add a” is not', () => {
  const f = (s) =>
    s.length === 0 ? ['a'] : [];
  expect(isMonotone(sets, sub, f))
    .toBe(false);
});`,
    hints: [
      'The definition talks about every pair of facts, so loop over every `x` and, inside, every `y`.',
      'Skip the pairs where `x` is not below or equal to `y`: the definition says nothing about them.',
      'For the others, check `leq(f(x), f(y))`. One failure is enough to return `false`; if no pair fails, return `true`.',
    ],
    walkthrough: `**How to think about it.** Monotone is a statement about every pair: "whenever x ⊑ y, f(x) ⊑ f(y)". On a small lattice you can check it directly by trying all the pairs. There are two traps: checking only pairs where the condition holds (pairs that are not ordered tell you nothing), and checking the conclusion the wrong way round.

**The solution, line by line.**

- \`for (const x of points) {\` and \`for (const y of points) {\` try every ordered pair of facts, including a fact with itself (which always passes).
- \`if (!leq(x, y)) continue;\` skips pairs where x is not below y: the rule only promises something about ordered pairs. For sets this skips, for example, \`['a']\` against \`['b']\`.
- \`const ok = leq(f(x), f(y));\` checks the promise: the output for the lower input must be below or equal to the output for the higher one.
- \`if (!ok) return false;\` One broken pair is enough: the function is not monotone.
- \`return true;\` No pair broke the promise.

For the "if empty, add a" rule, the pair \`x = []\`, \`y = ['a']\` has \`x ⊑ y\`, but \`f(x) = ['a']\` and \`f(y) = []\`, and \`['a']\` is not contained in \`[]\`: a bigger input gave a smaller output. For swapping, \`'maybe' ⊑ 'number'\`, but the outputs are \`'number'\` and \`'maybe'\`, the wrong way round. The gen/kill rule (remove \`a\`, add \`b\`) passes every pair, as the chapter argued it must.

**Common wrong attempts.**

- Checking \`leq(f(y), f(x))\`, the conclusion turned round: that tests whether \`f\` turns the order upside down, which swapping does, so swapping would wrongly pass.
- Checking only \`leq(f(x), x)\` ("the rule never goes up"): a rule can go up and still be monotone (the constant rule "always number" goes up from \`'maybe'\`), and a rule can never go up and still not be monotone (swapping's result for \`'number'\` goes down, yet it fails).
- Returning \`true\` as soon as one pair passes: monotone needs *every* ordered pair to pass.`,
    wrong: [
      {
        code: SOL.replace('const ok = leq(f(x), f(y));', 'const ok = leq(f(y), f(x));'),
        why: 'This checks the order turned upside down: swapping number and maybe passes it, though it is not monotone.',
      },
      {
        code: SOL.replace('      if (!leq(x, y)) continue;\n', ''),
        why: 'Without skipping unordered pairs, even the identity fails (for x = number, y = maybe), though it is monotone.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the lattice of sets ordered by “contains”, which is true of {a} and {b}?',
    options: [
      { t: '{a} is below {b}, because a comes before b.', why: 'The order is containment, not the alphabet; neither set contains the other.' },
      { t: 'Neither is below the other; their meet is { } and their join is {a, b}.', correct: true, why: 'They are incomparable, which a partial order allows, and the lattice still gives a meet and a join.' },
      { t: 'They have no meet, so this is not a lattice.', why: 'The empty set is below both, and it is the highest such set.' },
    ],
  },
  {
    q: 'The constant lattice has a fact for every number. What is its height?',
    options: [
      { t: 'Infinite, like its width', why: 'Width and height are different: any path from top to bottom has only two steps.' },
      { t: '1', why: 'There are two steps: from “no info” to a constant, and from a constant to “varies”.' },
      { t: '2', correct: true, why: '“no info” above every constant, every constant above “varies”.' },
    ],
  },
  {
    q: 'Which rule is NOT monotone on sets ordered by “contains”?',
    options: [
      { t: 'f(S) = S ∪ {x}', why: 'A bigger S gives a bigger result.' },
      { t: 'f(S) = S − {y}', why: 'Removing the same element from both keeps the order.' },
      { t: 'f(S) = {x} if S is empty, otherwise { }', correct: true, why: 'Going from { } to a bigger set shrinks the output from {x} to { }.' },
      { t: 'f(S) = {z}, whatever S is', why: 'A constant rule never breaks the order.' },
    ],
  },
  {
    q: 'Why does iterating a monotone framework from the top always stop?',
    options: [
      { t: 'Every step goes down or stays, and finite height allows only so many steps down.', correct: true, why: 'Monotone rules started at the top give a descending chain, and its length is bounded by the height.' },
      { t: 'Because programs are finite.', why: 'A finite program still has infinitely many paths; the argument is about the lattice.' },
      { t: 'Because the worklist is a queue.', why: 'The order of visits affects speed, not whether it stops.' },
    ],
  },
  {
    q: '`if c { a = 1; b = 2 } else { a = 2; b = 1 }; x = a + b`. What does iterative constant propagation say about x, and why?',
    options: [
      { t: 'x = 3, because it is 3 on both paths.', why: 'That is the meet-over-all-paths answer; iteration meets a and b at the join first.' },
      { t: 'Nothing: constant propagation can’t handle if/else.', why: 'It handles it; it is just not as precise here.' },
      { t: 'x varies, because a and b each vary at the join, and varies + varies is varies.', correct: true, why: 'The rule for + is monotone but not distributive, so meeting first loses information.' },
    ],
  },
];
