// Cards for "The dominator tree" (split from chapter 189). Keys are stable ids.

export const prompts = {
  'idom-what': {
    q: 'What is a block’s immediate dominator?',
    a: 'Its closest strict dominator: the one every other strict dominator of it also dominates.',
  },
  'tree-ancestor': {
    q: 'In the dominator tree, how do you read off all the dominators of B?',
    a: 'They are B and all its ancestors, up to the entry.',
  },
  'sets-nest': {
    q: 'Why is it enough to store one block (the idom) per block, rather than whole dominator sets?',
    a: 'The strict dominators of a block form a single chain, so each set is its idom’s set plus the block itself.',
  },
  'intersect-fingers': {
    q: 'In Viscosity’s `intersect(a, b)`, which finger moves up?',
    a: 'Whichever block is later in reverse postorder moves to its idom, until the two meet.',
  },
  'unreachable-none': {
    q: 'Why does an unreachable block never get an entry in Viscosity’s `idom` map?',
    a: 'It is never in the reverse postorder, and only predecessors that already have an idom are used.',
  },
  'back-edge': {
    q: 'How does `naturalLoops` recognise a back edge t → h?',
    a: 'h dominates t. Then h is a loop header.',
  },
  'df-what': {
    q: 'When is block Y in the dominance frontier of X?',
    a: 'When X dominates some predecessor of Y but does not strictly dominate Y.',
  },
  'df-self': {
    q: 'In the Collatz CFG, why is the loop header b1 in its own dominance frontier?',
    a: 'b1 dominates b3, a predecessor of b1 (the back edge), and no block strictly dominates itself.',
  },
};

export const examples = {
  rpo: {
    title: 'Immediate dominators, Viscosity’s way',
    code: `// the Collatz CFG
const preds = [[], [0, 3], [1], [7],
  [1], [2], [2], [5, 6]];
const rpo = [0, 1, 4, 2, 6, 5, 7, 3];
const at = new Map(
  rpo.map((b, i) => [b, i]));
const idom = new Map([[0, 0]]);
const meet = (a, b) => {
  while (a !== b) {
    while (at.get(a) > at.get(b))
      a = idom.get(a);
    while (at.get(b) > at.get(a))
      b = idom.get(b);
  }
  return a;
};
let changed = true, passes = 0;
while (changed) {
  changed = false;
  passes++;
  for (const b of rpo.slice(1)) {
    const ps = preds[b]
      .filter((p) => idom.has(p));
    let d = ps[0];
    for (const p of ps.slice(1))
      d = meet(p, d);
    if (idom.get(b) !== d) {
      idom.set(b, d);
      changed = true;
    }
  }
}
for (const [b, d] of idom)
  console.log(\`idom(b\${b}) = b\${d}\`);
console.log('passes:', passes);`,
  },
};

const idomTests = `test('the Collatz CFG', () => {
  const dom = [
    [0], [0, 1], [0, 1, 2],
    [0, 1, 2, 3, 7], [0, 1, 4],
    [0, 1, 2, 5], [0, 1, 2, 6],
    [0, 1, 2, 7]];
  expect(idoms(dom))
    .toEqual([0, 0, 1, 7, 1, 2, 2, 2]);
});
test('a chain', () => {
  expect(idoms([[0], [0, 1], [0, 1, 2]]))
    .toEqual([0, 0, 1]);
});
test('numbers say nothing about depth', () => {
  // 0 -> 2 -> 1 -> 3
  expect(idoms([[0], [0, 1, 2], [0, 2],
    [0, 1, 2, 3]])).toEqual([0, 2, 0, 1]);
});
test('a diamond', () => {
  expect(idoms([[0], [0, 1], [0, 2],
    [0, 3]])).toEqual([0, 0, 0, 0]);
});`;

const dfTests = `test('the Collatz CFG', () => {
  const preds = [[], [0, 3], [1], [7],
    [1], [2], [2], [5, 6]];
  const idom = [0, 0, 1, 7, 1, 2, 2, 2];
  expect(frontiers(preds, idom))
    .toEqual([[], [1], [1], [1], [],
      [7], [7], [1]]);
});
test('a diamond', () => {
  const preds = [[], [0], [0], [1, 2]];
  expect(frontiers(preds, [0, 0, 0, 0]))
    .toEqual([[], [3], [3], []]);
});
test('a while loop', () => {
  const preds = [[], [0, 2], [1], [1]];
  expect(frontiers(preds, [0, 0, 1, 1]))
    .toEqual([[], [1], [1], []]);
});
test('a chain has no frontiers', () => {
  const preds = [[], [0], [1]];
  expect(frontiers(preds, [0, 0, 1]))
    .toEqual([[], [], []]);
});`;

const dfSolution = `function frontiers(preds, idom) {
  const df = preds.map(() => new Set());
  preds.forEach((ps, y) => {
    if (ps.length < 2) return;
    for (const p of ps) {
      let r = p;
      while (r !== idom[y]) {
        df[r].add(y);
        r = idom[r];
      }
    }
  });
  return df.map((s) =>
    [...s].sort((a, b) => a - b));
}`;

export const exercises = {
  frontiers: {
    title: 'Dominance frontiers',
    prompt:
      'A CFG is given by `preds` (`preds[b]` lists block `b`’s predecessors) and `idom` (`idom[b]` is `b`’s immediate dominator; the entry, block 0, is its own). Every block is reachable. Write `frontiers(preds, idom)` that returns an array whose entry `b` is the sorted list DF(b).\n\nFor each block `y` with two or more predecessors, and each predecessor `p` of `y`: start a runner at `p`, and until it reaches `idom[y]`, add `y` to the runner’s frontier and move the runner up to its own idom.',
    starter: `function frontiers(preds, idom) {
  return preds.map(() => []);
}`,
    solution: dfSolution,
    tests: dfTests,
    hints: [
      'Frontiers end at joins, so only blocks with two or more predecessors can be in anyone’s frontier. Start from those.',
      'For a join `y` and one predecessor `p`: every block on the climb from `p` up to (not including) `idom[y]` dominates `p` but not `y`, so `y` belongs in its frontier.',
      'Keep a `Set` per block so a block added twice appears once: `let r = p; while (r !== idom[y]) { df[r].add(y); r = idom[r]; }`. Sort each set at the end.',
    ],
    walkthrough: `**How to think about it.** The definition says Y is in DF(X) when X dominates a predecessor of Y but not Y itself. Checking that for every pair of blocks would work, but it is slow and fiddly; turn it round and start from Y. Which blocks dominate a predecessor P of Y? Exactly P and its ancestors in the dominator tree. Which of those strictly dominate Y? Exactly idom(Y) and *its* ancestors (and idom(Y) dominates every predecessor of Y, so the climb from P is sure to reach it). So the blocks that qualify are the ones on the climb from P that come *before* idom(Y): add Y to each of their frontiers.

**The solution, line by line.**

- \`function frontiers(preds, idom) {\` takes the predecessors and the tree.
- \`const df = preds.map(() => new Set());\` makes an empty set per block; a \`Set\` because two climbs towards the same join can pass the same block (when the join has three or more predecessors, say), and it should appear once.
- \`preds.forEach((ps, y) => {\` visits each block \`y\` with its predecessor list \`ps\`.
- \`if (ps.length < 2) return;\` skips blocks with fewer than two predecessors. (This is only a shortcut: with one predecessor \`p\`, \`idom[y]\` is \`p\` itself, so the climb would stop at once anyway.)
- \`for (const p of ps) {\` tries each way into \`y\`.
- \`let r = p;\` puts the runner on the predecessor.
- \`while (r !== idom[y]) {\` climbs until the runner reaches the first block that strictly dominates \`y\`.
- \`df[r].add(y);\` records that \`r\` dominates a predecessor of \`y\` but not \`y\` itself.
- \`r = idom[r];\` moves the runner one step up the tree.
- \`return df.map((s) => [...s].sort((a, b) => a - b));\` turns each set into a sorted array.

Trace it on the Collatz CFG. b7 has predecessors b5 and b6 and idom b2: from b5 the runner adds 7 to DF(b5) and then steps to b2 and stops; the same for b6. b1 has predecessors b0 and b3 and idom b0: from b0 the runner is already at the stop; from b3 it adds 1 to DF(b3), DF(b7), DF(b2) and DF(b1) as it climbs b3, b7, b2, b1, then stops at b0. That is the whole answer.

**Common wrong attempts.**

- Adding \`y\` only to the predecessors themselves, without climbing: Collatz then gives DF(b3) = [1] but misses b7, b2 and b1, which also dominate b3.
- Climbing all the way to the entry instead of stopping at \`idom[y]\`: then blocks that strictly dominate \`y\` (like b0 for b1) wrongly get \`y\` in their frontier.
- Stopping when the runner reaches \`y\` itself: in a loop the runner can pass through \`y\` on its way up (b1 is in its own frontier), so the stop must be \`idom[y]\`.`,
    wrong: [
      {
        code: `function frontiers(preds, idom) {
  const df = preds.map(() => new Set());
  preds.forEach((ps, y) => {
    if (ps.length < 2) return;
    for (const p of ps) {
      if (p !== idom[y]) df[p].add(y);
    }
  });
  return df.map((s) =>
    [...s].sort((a, b) => a - b));
}`,
        why: 'Only the predecessors themselves get `y`. Their tree ancestors below `idom[y]` also dominate a predecessor of `y`, so the runner has to climb.',
      },
      {
        code: `function frontiers(preds, idom) {
  const df = preds.map(() => new Set());
  preds.forEach((ps, y) => {
    if (ps.length < 2) return;
    for (const p of ps) {
      let r = p;
      while (r !== 0) {
        df[r].add(y);
        r = idom[r];
      }
    }
  });
  return df.map((s) =>
    [...s].sort((a, b) => a - b));
}`,
        why: 'Climbing to the entry adds `y` to blocks that strictly dominate it, such as idom(y) and its ancestors. Stop at `idom[y]`.',
      },
    ],
  },
  idoms: {
    optional: true,
    title: 'From sets to the tree',
    prompt:
      'Given `dom`, the dominator sets from the core exercise (sorted lists, `dom[0]` is `[0]`), write `idoms(dom)` that returns each block’s immediate dominator. Use `0` for the entry itself. Hint about nesting: the closest strict dominator of `b` is the one with the *largest* dominator set of its own.',
    starter: `function idoms(dom) {
  return dom.map(() => 0);
}`,
    solution: `function idoms(dom) {
  return dom.map((ds, b) => {
    let best = 0;
    for (const d of ds) {
      if (d === b) continue;
      if (dom[d].length >
          dom[best].length) best = d;
    }
    return best;
  });
}`,
    tests: idomTests,
    hints: [
      'For each block, look only at its *strict* dominators: skip `b` itself.',
      'Strict dominators form a chain from the entry down to `b`. The one deepest in that chain has the most dominators of its own.',
    ],
    walkthrough: `**How to think about it.** The strict dominators of a block are not a jumble: they lie on one chain from the entry down to the block, each dominated by all the ones above it. So the closer a dominator is to \`b\`, the more dominators it has of its own, and the nearest one (the idom) is the strict dominator with the biggest dominator set.

**The solution, line by line.**

- \`return dom.map((ds, b) => {\` works out one answer per block; \`ds\` is block \`b\`'s dominator set.
- \`let best = 0;\` starts with the entry, which dominates everything (and is the answer for the entry itself).
- \`for (const d of ds) {\` looks at every dominator of \`b\`.
- \`if (d === b) continue;\` skips \`b\` itself: the idom is a *strict* dominator.
- \`if (dom[d].length > dom[best].length) best = d;\` keeps the dominator with the largest set of its own, which is the deepest one in the chain.
- \`return best;\` gives that block.

For b3 in the Collatz CFG, the strict dominators are 0, 1, 2 and 7, with sets of size 1, 2, 3 and 4, so idom(b3) = b7, its parent in the tree. This is why Viscosity never stores the sets: the \`idom\` map is all of them, folded into a tree.

**Common wrong attempts.**

- Taking the largest block *number*: it happens to work for the Collatz CFG, but block numbers say nothing about depth, and in the chain 0 → 2 → 1 → 3 it picks 2 for b3, whose idom is 1.
- Forgetting to skip \`b\` itself: every block's own set is the largest, so every block would be its own idom.`,
    wrong: [
      {
        code: `function idoms(dom) {
  return dom.map((ds, b) => {
    const strict = ds.filter(
      (d) => d !== b);
    return strict.length
      ? Math.max(...strict) : 0;
  });
}`,
        why: 'The largest block *number* is not the closest dominator. It happens to work for the Collatz CFG, but in a chain 0 → 2 → 1 → 3 it picks 2 for b3, whose idom is 1. Compare set sizes instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the immediate dominator of a block?',
    options: [
      { t: 'Its first predecessor', why: 'A predecessor can be skipped, like b5 for b7.' },
      { t: 'The entry block', why: 'The entry dominates everything, but it is usually not the closest.' },
      { t: 'Its closest strict dominator, its parent in the dominator tree', correct: true, why: 'Every other strict dominator is an ancestor of it.' },
      { t: 'The block that most often runs just before it', why: 'Dominance is about paths in the graph, not how often they are taken.' },
    ],
  },
  {
    q: 'In an `if`/`else` diamond b0 → b1, b2 → b3, what is the parent of b3 in the dominator tree?',
    options: [
      { t: 'b1', why: 'The path through b2 avoids b1.' },
      { t: 'b0', correct: true, why: 'Neither branch dominates the join, so its nearest strict dominator is the entry: the tree is flat.' },
      { t: 'b2', why: 'The path through b1 avoids b2.' },
      { t: 'b3 has two parents, b1 and b2', why: 'A tree gives every block one parent; that is the point of the immediate dominator.' },
    ],
  },
  {
    q: 'Viscosity’s `dominators` returns `idom`, a Map. How does `dominates(idom, a, b)` answer?',
    options: [
      { t: 'It looks `a` up in a stored set for `b`', why: 'No sets are stored; only immediate dominators.' },
      { t: 'It searches every path from the entry to `b`', why: 'There can be very many paths; the tree avoids that.' },
      { t: 'It walks from `b` up the tree through `idom` until it finds `a` or reaches the entry', correct: true, why: 'A dominates B exactly when A is B or one of its ancestors.' },
      { t: 'It compares their positions in reverse postorder', why: 'Being earlier in that order is necessary but not sufficient.' },
    ],
  },
  {
    q: 'How does `naturalLoops` use dominators?',
    options: [
      { t: 'Every block with two predecessors is a loop', why: 'b7, the join of an `if`, has two predecessors and is not a loop header.' },
      { t: 'It finds edges t → h where h dominates t: back edges, with h the loop header', correct: true, why: 'You can only jump back to a block you must already have passed through, which is what a loop header is.' },
      { t: 'A block that dominates itself is in a loop', why: 'Every block dominates itself.' },
      { t: 'It does not; loops are found from the source’s `while` and `for`', why: 'Working on the CFG means any loop is found, however it was written.' },
    ],
  },
  {
    q: 'In the Collatz CFG, what is DF(b5), the frontier of the odd branch?',
    options: [
      { t: '{b7}: b5 dominates b7’s predecessor b5, but not b7', correct: true, why: 'The join can also be reached through b6, so b5’s territory ends there.' },
      { t: '{b1}', why: 'b5 does not dominate b3, the source of the back edge, because the even branch also reaches b3.' },
      { t: '{} (empty)', why: 'b5 has a successor, b7, that it does not strictly dominate.' },
      { t: '{b5, b7}', why: 'b5 does not lead back to itself without passing through b1, which it does not dominate.' },
    ],
  },
];
