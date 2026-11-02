// Chapter 132 cards. Keys are stable ids: never rename them.

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
  'why-rpo': {
    q: 'Why visit blocks in reverse postorder?',
    a: 'Each block then comes after its predecessors (except over back edges), so their sets are usually ready and few passes are needed.',
  },
  'idom-what': {
    q: 'What is a block’s immediate dominator?',
    a: 'Its closest strict dominator: the one every other strict dominator of it also dominates.',
  },
  'tree-ancestor': {
    q: 'In the dominator tree, how do you read off all the dominators of B?',
    a: 'They are B and all its ancestors, up to the entry.',
  },
  'intersect-fingers': {
    q: 'In Viscosity’s `intersect(a, b)`, which finger moves up?',
    a: 'Whichever block is later in reverse postorder moves to its idom, until the two meet.',
  },
  'unreachable-none': {
    q: 'Why does an unreachable block never get an entry in Viscosity’s `idom` map?',
    a: 'Only predecessors that already have an idom are used, and no chain of those starts at the entry for an unreachable block. It is also never in the reverse postorder.',
  },
  'back-edge': {
    q: 'How does `naturalLoops` recognise a back edge t → h?',
    a: 'h dominates t. Then h is a loop header.',
  },
};

export const examples = {
  rpo: {
    title: 'Immediate dominators, Viscosity’s way',
    code: `// Collatz CFG from chapter 131
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
    walkthrough: `The heart is one line of the definition, turned into code:

\`\`\`js
let d = dom[preds[b][0]];
for (const p of preds[b]) {
  d = d.filter((x) =>
    dom[p].includes(x));
}
const nd = [...new Set([...d, b])]
  .sort((x, y) => x - y);
\`\`\`

- **Intersect the predecessors.** A block dominates \`b\` only if it dominates *every* way into \`b\`. \`filter\` keeps what each predecessor’s set agrees on. (Filtering against the first predecessor again is harmless.)
- **Add \`b\` itself**, since every block dominates itself. The \`Set\` removes a repeat when \`b\` was already there, which happens while sets are still “all”.
- **Repeat until stable.** The last test is the reason. With \`succ = [[2], [3], [1], []]\`, block 1’s only predecessor is block 2, which hasn’t been visited yet in the first pass, so block 1 keeps “all”. The second pass fixes it, and a third confirms nothing changes.

Starting from “all” is what makes loops work: a back edge’s source still says “all” in the first pass, so it doesn’t remove anything wrongly, and the sets shrink to the right answer.

Viscosity’s \`dominators\` computes the same thing more cleverly, storing only immediate dominators and visiting in reverse postorder, which is why it needs so few passes.`,
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
    walkthrough: `\`\`\`js
for (const d of ds) {
  if (d === b) continue;
  if (dom[d].length >
      dom[best].length) best = d;
}
\`\`\`

The strict dominators of a block are not a jumble: they lie on one chain from the entry, because they nest. Each one is dominated by all the ones above it, so the closer a dominator is to \`b\`, the bigger its own dominator set. Pick the biggest.

For b3 in the Collatz CFG, the strict dominators are 0, 1, 2 and 7, with sets of size 1, 2, 3 and 4. So idom(b3) = b7, the parent shown in the dominator tree.

This is why Viscosity never stores the sets: the \`idom\` array is all of them, folded into a tree.`,
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
      { t: 'No, never', why: 'Dominators do run before; it’s just not sufficient.' },
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
    q: 'What is the immediate dominator of a block?',
    options: [
      { t: 'Its first predecessor', why: 'A predecessor can be skipped, like b5 for b7.' },
      { t: 'The entry block', why: 'The entry dominates everything, but it is usually not the closest.' },
      { t: 'Its closest strict dominator, its parent in the dominator tree', correct: true, why: 'Every other strict dominator is an ancestor of it.' },
      { t: 'The block that most often runs just before it', why: 'Dominance is about paths in the graph, not how often they are taken.' },
    ],
  },
  {
    q: 'Viscosity’s `dominators` returns `idom`, a Map. How does `dominates(idom, a, b)` answer?',
    options: [
      { t: 'It looks `a` up in a stored set for `b`', why: 'No sets are stored; only immediate dominators.' },
      { t: 'It walks from `b` up the tree through `idom` until it finds `a` or reaches the entry', correct: true, why: 'A dominates B exactly when A is B or one of its ancestors.' },
      { t: 'It searches every path from the entry to `b`', why: 'There can be exponentially many paths; the tree avoids that.' },
      { t: 'It compares their positions in reverse postorder', why: 'Being earlier in that order is necessary but not sufficient.' },
    ],
  },
  {
    q: 'How does `naturalLoops` use dominators?',
    options: [
      { t: 'It finds edges t → h where h dominates t: back edges, with h the loop header', correct: true, why: 'You can only jump back to a block you must already have passed through, which is what a loop header is.' },
      { t: 'Every block with two predecessors is a loop', why: 'b7, the join of an `if`, has two predecessors and is not a loop header.' },
      { t: 'A block that dominates itself is in a loop', why: 'Every block dominates itself.' },
      { t: 'It doesn’t; loops are found from the source’s `while` and `for`', why: 'Working on the CFG means any loop is found, however it was written.' },
    ],
  },
];
