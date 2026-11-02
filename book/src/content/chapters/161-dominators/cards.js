// Chapter 161 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dom-what': {
    q: 'When does block A dominate block B?',
    a: 'When every path from the entry to B passes through A.',
  },
  'self-entry': {
    q: 'Which two blocks always dominate a reachable block B?',
    a: 'The entry, and B itself.',
  },
  'not-before': {
    q: 'In the Collatz CFG, b2 can run before b4 (the exit). Why doesn’t b2 dominate b4?',
    a: 'There is a path that skips it: if the loop test fails at once, b0 → b1 → b4.',
  },
  'start-all': {
    q: 'In the iterative algorithm, why does every non-entry set start as “all blocks”?',
    a: 'Sets only shrink, so starting as large as possible lets loops settle on the right answer instead of losing blocks too early.',
  },
  'only-shrink': {
    q: 'How does the iterative dominator algorithm know it is finished?',
    a: 'A whole pass over the blocks changes no set.',
  },
  'intersect-why': {
    q: 'Why does the dominator equation *intersect* the predecessors’ sets rather than joining them (union)?',
    a: 'A dominator must be on every way in. If a block is missing from even one predecessor’s set, the path through that predecessor avoids it.',
  },
  'why-rpo': {
    q: 'Why visit blocks in reverse postorder?',
    a: 'Each block then comes after its predecessors (except over back edges), so their sets are usually ready and few passes are needed.',
  },
  'back-edge-what': {
    q: 'In reverse postorder, which predecessors of a block can come *after* it?',
    a: 'Only those that reach it along a back edge, an edge that jumps back to the start of a loop.',
  },
};

export const examples = {
  'delete-and-search': {
    title: 'Delete a block, see what is cut off',
    code: `// A dominates B exactly when deleting A
// cuts B off from the entry.
const succ = [[1], [2, 4], [5, 6],
  [1], [], [7], [7], [3]];
function reach(gone) {
  const seen = new Set();
  const todo = [0];
  while (todo.length) {
    const b = todo.pop();
    if (b === gone) continue;
    if (seen.has(b)) continue;
    seen.add(b);
    todo.push(...succ[b]);
  }
  return seen;
}
for (let a = 0; a < 8; a++) {
  const r = reach(a);
  const doms = [];
  for (let b = 0; b < 8; b++)
    if (!r.has(b)) doms.push(b);
  console.log('b' + a, 'dominates',
    doms);
}`,
  },
};

const domTests = `test('a diamond', () => {
  expect(dominators([[1, 2], [3], [3], []]))
    .toEqual([[0], [0, 1], [0, 2], [0, 3]]);
});
test('a while loop', () => {
  expect(dominators([[1], [2, 3], [1], []]))
    .toEqual([[0], [0, 1], [0, 1, 2],
      [0, 1, 3]]);
});
test('the Collatz CFG', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(dominators(succ)).toEqual([
    [0], [0, 1], [0, 1, 2],
    [0, 1, 2, 3, 7], [0, 1, 4],
    [0, 1, 2, 5], [0, 1, 2, 6],
    [0, 1, 2, 7]]);
});
test('order needs a second pass', () => {
  expect(dominators([[2], [3], [1], []]))
    .toEqual([[0], [0, 1, 2], [0, 2],
      [0, 1, 2, 3]]);
});`;

const starter = `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  // dom[b]: b's dominators, sorted
  const dom = succ.map((_, b) => [b]);
  return dom;
}`;

const body = (loop) => `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  const n = succ.length;
  const all = succ.map((_, b) => b);
  const dom = all.map((b) =>
    b === 0 ? [0] : all);
${loop}
  return dom;
}`;

const pass = `    for (let b = 1; b < n; b++) {
      let d = dom[preds[b][0]];
      for (const p of preds[b]) {
        d = d.filter((x) =>
          dom[p].includes(x));
      }
      const nd = [...new Set([...d, b])]
        .sort((x, y) => x - y);
      if (nd.join() !== dom[b].join()) {
        dom[b] = nd;
        changed = true;
      }
    }`;

export const exercises = {
  'dom-sets': {
    title: 'Iterative dominators',
    prompt:
      'A CFG is given as `succ`, where `succ[b]` lists block `b`’s successors. Block 0 is the entry, and every block is reachable from it. Write `dominators(succ)` that returns an array where entry `b` is the sorted list of blocks that dominate `b`.\n\nUse the iterative algorithm: `Dom(0) = [0]`; every other set starts as all blocks; then repeat passes over blocks 1, 2, 3, ... setting `Dom(b)` to `b` plus the intersection of its predecessors’ sets, until a pass changes nothing. The starter builds the predecessor lists for you.',
    starter,
    solution: body(`  let changed = true;
  while (changed) {
    changed = false;
${pass}
  }`),
    tests: domTests,
    hints: [
      'Start with `all = [0, 1, ..., n-1]` and `dom[b] = b === 0 ? [0] : all`.',
      'For one block: take the first predecessor’s set, then `filter` it against each other predecessor’s set. Add `b`, remove repeats, sort numerically.',
      'Wrap the pass in `let changed = true; while (changed) { changed = false; ... }`, and set `changed = true` whenever a block’s new set differs from the old one (compare with `join()`).',
    ],
    walkthrough: `**How to think about it.** The equation already tells you what to compute for one block: \`b\` itself, plus whatever every predecessor's set agrees on. The only difficulty is that the sets depend on each other round loops, so you cannot compute them in one go. The trick from the chapter handles that: start every set (except the entry's) as "all blocks", which can only be too big, never too small, and keep recomputing every block until a whole pass changes nothing. Because sets only shrink and there are finitely many blocks, this always stops.

**The solution, line by line.**

- The first five lines (from the starter) build \`preds\`, the predecessor lists, by filing every edge under its target, as in Control-flow graphs.
- \`const n = succ.length;\` is the number of blocks.
- \`const all = succ.map((_, b) => b);\` is \`[0, 1, ..., n - 1]\`, the set of all blocks.
- \`const dom = all.map((b) => b === 0 ? [0] : all);\` sets up the starting point: the entry is dominated only by itself, everything else starts as "all". (Every block shares the same \`all\` array at first, which is safe here, because the code below replaces a set with a new array rather than changing it.)
- \`let changed = true; while (changed) { changed = false;\` repeats passes until one changes nothing.
- \`for (let b = 1; b < n; b++) {\` visits every block except the entry, in number order.
- \`let d = dom[preds[b][0]];\` starts the intersection from the first predecessor's set (every block is reachable, so every non-entry block has a predecessor).
- \`for (const p of preds[b]) { d = d.filter((x) => dom[p].includes(x)); }\` keeps only the blocks that are also in each predecessor's set, which is the intersection. (Filtering against the first predecessor again is harmless.)
- \`const nd = [...new Set([...d, b])].sort((x, y) => x - y);\` adds \`b\` itself, removes a repeat if \`b\` was already there (it is, while the set is still "all"), and sorts numerically.
- \`if (nd.join() !== dom[b].join()) { dom[b] = nd; changed = true; }\` compares the new set with the old one as text (\`join()\` turns \`[0, 1]\` into \`"0,1"\`), and if it shrank, stores it and asks for another pass.
- \`return dom;\` hands back the final sets.

The last test shows why the loop is needed. With \`succ = [[2], [3], [1], []]\` (a path 0 → 2 → 1 → 3), block 1's only predecessor is block 2, which in number order comes *after* it; so in the first pass block 1 is computed from block 2's starting set, "all", and stays "all". The second pass fixes it, and a third confirms that nothing changes. Viscosity avoids most of these extra passes by visiting in reverse postorder instead of number order.

**Common wrong attempts.**

- Doing one pass only: it works on graphs where every block comes after its predecessors in number order, and fails the last test.
- Taking the *union* of the predecessors' sets: that gives the blocks on *some* path into \`b\`, not on every path, so in a diamond both branches would wrongly dominate the join.
- Starting every set empty: the intersections then stay empty, and every block ends up dominated by nothing but itself.`,
    wrong: [
      {
        code: body(`  let changed = true;
  {
${pass}
  }`),
        why: 'One pass is not enough when a block is visited before its predecessor. In `[[2], [3], [1], []]`, block 1 is still “all” after the pass. Repeat until nothing changes.',
      },
      {
        code: body(`  let changed = true;
  while (changed) {
    changed = false;
    for (let b = 1; b < n; b++) {
      const d = new Set([b]);
      for (const p of preds[b]) {
        for (const x of dom[p])
          d.add(x);
      }
      const nd = [...d]
        .sort((x, y) => x - y);
      if (nd.join() !== dom[b].join()) {
        dom[b] = nd;
        changed = true;
      }
    }
  }`),
        why: 'That is the union of the predecessors’ sets: blocks on *some* path. Dominators must be on *every* path, so intersect.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a CFG, b5 and b6 are the two branches of an `if`, and both jump to b7. Which of these dominate b7?',
    options: [
      { t: 'b5 and b6', why: 'Each can be skipped by taking the other branch.' },
      { t: 'The block that branches to b5 and b6 (and its own dominators)', correct: true, why: 'Every path to b7 passes through the branch, whichever way it goes.' },
      { t: 'Only b7 itself', why: 'b7 dominates itself, but so does everything on every path to it, including the entry.' },
      { t: 'Every block in the function', why: 'Blocks after b7, or on the other side of a branch, are not on every path.' },
    ],
  },
  {
    q: 'A block A runs before block B on some path. Does A dominate B?',
    options: [
      { t: 'Yes, always', why: 'One path is not enough. b5 runs before b7 on one path but not on the other.' },
      { t: 'Only if A comes earlier in the listing', why: 'Listing order has nothing to do with dominance.' },
      { t: 'No, never', why: 'Dominators do run before; it is just not sufficient.' },
      { t: 'Not necessarily: A must be on every path from the entry to B', correct: true, why: 'Dominance is about all paths.' },
    ],
  },
  {
    q: 'In the iterative algorithm, why must you keep doing passes until nothing changes?',
    options: [
      { t: 'A block can be visited before a predecessor’s set is final, for example across a back edge', correct: true, why: 'Its set was computed from an unfinished input, so another pass is needed to see whether it shrinks.' },
      { t: 'Because sets grow each pass', why: 'They only ever shrink.' },
      { t: 'To randomise the order', why: 'The order is fixed; repetition is what reaches the answer.' },
      { t: 'Each pass handles one more loop iteration of the program', why: 'The analysis never runs the program; passes are over the graph.' },
    ],
  },
  {
    q: 'Block B has two predecessors, with Dom(P1) = {0, 1, 3} and Dom(P2) = {0, 1, 4}. What is Dom(B), if B is block 5?',
    options: [
      { t: '{0, 1, 3, 4, 5}', why: 'That is the union: the blocks on some path. Dominators must be on every path.' },
      { t: '{0, 1}', why: 'Close, but every block dominates itself, so 5 belongs too.' },
      { t: '{0, 1, 5}', correct: true, why: 'The intersection {0, 1}, plus B itself.' },
      { t: '{5}', why: 'Blocks 0 and 1 are in both predecessors’ sets, so every path to B passes them.' },
    ],
  },
  {
    q: 'You delete block A from a CFG, and block B can no longer be reached from the entry. What do you learn?',
    options: [
      { t: 'B is unreachable in the original program', why: 'B was reachable before the deletion; the deletion is only a thought experiment.' },
      { t: 'A runs immediately before B', why: 'A might be far above B; it only has to be on every path.' },
      { t: 'B dominates A', why: 'It is the other way round.' },
      { t: 'A dominates B: every path from the entry to B went through A', correct: true, why: 'If any path avoided A, it would still reach B after the deletion.' },
    ],
  },
];
