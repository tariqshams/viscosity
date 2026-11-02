// Chapter 176 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 91, 91, 91.

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
  'back-edge-o211': {
    q: 'What makes a CFG edge `t → h` a back edge?',
    a: 'Its target `h` dominates its source `t`.',
  },
  'natural-loop': {
    q: 'Which blocks belong to the natural loop of a back edge `t → h`?',
    a: '`h` plus every block that can reach `t` without passing through `h`.',
  },
  'walk-backwards': {
    q: 'Why does finding a natural loop walk *predecessors* from the latch, not successors from the header?',
    a: 'The loop is what leads back to the latch; walking forwards from the header would also collect the blocks after the loop.',
  },
  'dominance-not-order': {
    q: 'An edge goes from a block listed later to a block listed earlier. Is it a back edge?',
    a: 'Not necessarily: only if its target dominates its source. Listing order is an accident of how the CFG was built.',
  },
  'two-latches': {
    q: 'Two back edges, `a → h` and `b → h`, share the header `h`. How many natural loops is that?',
    a: 'One: their bodies are merged into a single loop with two latches.',
  },
  irreducible: {
    q: 'What is an irreducible cycle?',
    a: 'A cycle that can be entered at more than one block, so no block in it dominates the others and it has no back edge.',
  },
  'loop-depth': {
    q: 'What is a loop’s depth?',
    a: 'The number of loops that contain its header, itself included: 1 for an outermost loop.',
  },
  innermost: {
    q: 'A block is inside two nested loops. Which loop does Viscosity charge a field access in it to?',
    a: 'The innermost one: the smallest loop whose body contains the block.',
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
  'back-edges': {
    title: 'Find the back edges',
    code: `const succ = {
  b0: ['b1'], b1: ['b2', 'b3'],
  b2: ['b1'], b3: [],
};
// dom[b]: the blocks that dominate b
const dom = {
  b0: ['b0'], b1: ['b0', 'b1'],
  b2: ['b0', 'b1', 'b2'],
  b3: ['b0', 'b1', 'b3'],
};
for (const t in succ) {
  for (const h of succ[t]) {
    if (dom[t].includes(h)) {
      console.log(t + ' → ' + h);
    }
  }
}`,
  },
};

export const exercises = {
  'dom-sets': {
    title: 'Iterative dominators',
    prompt: `A CFG is given as \`succ\`, where \`succ[b]\` lists block \`b\`’s successors. Block 0 is the entry, and every block is reachable from it. Write \`dominators(succ)\` that returns an array where entry \`b\` is the sorted list of blocks that dominate \`b\`.

Use the iterative algorithm: \`Dom(0) = [0]\`; every other set starts as all blocks; then repeat passes over blocks 1, 2, 3, ... setting \`Dom(b)\` to \`b\` plus the intersection of its predecessors’ sets, until a pass changes nothing. The starter builds the predecessor lists for you.`,
    starter: `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  // dom[b]: b's dominators, sorted
  const dom = succ.map((_, b) => [b]);
  return dom;
}`,
    solution: `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  const n = succ.length;
  const all = succ.map((_, b) => b);
  const dom = all.map((b) =>
    b === 0 ? [0] : all);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = 1; b < n; b++) {
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
    }
  }
  return dom;
}`,
    tests: `test('a diamond', () => {
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
});`,
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
- Starting every set empty: round a loop, the header is computed while its back-edge predecessor is still empty, so the intersection is empty and the entry drops out of its set; in the while-loop test, block 1 ends up as \`[1]\` instead of \`[0, 1]\`.`,
    wrong: [
      {
        code: `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  const n = succ.length;
  const all = succ.map((_, b) => b);
  const dom = all.map((b) =>
    b === 0 ? [0] : all);
  let changed = true;
  {
    for (let b = 1; b < n; b++) {
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
    }
  }
  return dom;
}`,
        why: 'One pass is not enough when a block is visited before its predecessor. In `[[2], [3], [1], []]`, block 1 is still “all” after the pass. Repeat until nothing changes.',
      },
      {
        code: `function dominators(succ) {
  const preds = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss)
      preds[s].push(b);
  });
  const n = succ.length;
  const all = succ.map((_, b) => b);
  const dom = all.map((b) =>
    b === 0 ? [0] : all);
  let changed = true;
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
  }
  return dom;
}`,
        why: 'That is the union of the predecessors’ sets: blocks on *some* path. Dominators must be on *every* path, so intersect.',
      },
    ],
  },
  frontiers: {
    title: 'Dominance frontiers',
    prompt: `A CFG is given by \`preds\` (\`preds[b]\` lists block \`b\`’s predecessors) and \`idom\` (\`idom[b]\` is \`b\`’s immediate dominator; the entry, block 0, is its own). Every block is reachable. Write \`frontiers(preds, idom)\` that returns an array whose entry \`b\` is the sorted list DF(b).

For each block \`y\` with two or more predecessors, and each predecessor \`p\` of \`y\`: start a runner at \`p\`, and until it reaches \`idom[y]\`, add \`y\` to the runner’s frontier and move the runner up to its own idom.`,
    starter: `function frontiers(preds, idom) {
  return preds.map(() => []);
}`,
    solution: `function frontiers(preds, idom) {
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
}`,
    tests: `test('the Collatz CFG', () => {
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
});`,
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
    prompt: 'Given `dom`, the dominator sets from the core exercise (sorted lists, `dom[0]` is `[0]`), write `idoms(dom)` that returns each block’s immediate dominator. Use `0` for the entry itself. Hint about nesting: the closest strict dominator of `b` is the one with the *largest* dominator set of its own.',
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
    tests: `test('the Collatz CFG', () => {
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
});`,
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
  findLoops: {
    title: 'Find natural loops from back edges',
    prompt: '`succ` maps each block to its successors; `dom` maps each block to the list of blocks that dominate it (itself included). Write `findLoops(succ, dom)` returning an object that maps each loop **header** to its loop body as a **sorted** array. Back edges with the same header make one loop. Return `{}` if there are none.',
    starter: `function findLoops(succ, dom) {
  // your code here
  return {};
}

const succ = {
  b0: ['b1'], b1: ['b2', 'b3'],
  b2: ['b1'], b3: [],
};
const dom = {
  b0: ['b0'], b1: ['b0', 'b1'],
  b2: ['b0', 'b1', 'b2'],
  b3: ['b0', 'b1', 'b3'],
};
console.log(findLoops(succ, dom));
// { b1: ['b1', 'b2'] }`,
    solution: `function findLoops(succ, dom) {
  const preds = {};
  for (const b of Object.keys(succ)) {
    preds[b] = preds[b] ?? [];
    for (const s of succ[b]) {
      preds[s] = preds[s] ?? [];
      preds[s].push(b);
    }
  }
  const loops = {};
  for (const t of Object.keys(succ)) {
    for (const h of succ[t]) {
      if (!dom[t].includes(h)) continue;
      const body = new Set(loops[h]);
      body.add(h);
      const stack = [t];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...preds[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
    tests: `test('the nested loops of sum()', () => {
  const succ = {
    b0: ['b1'], b1: ['b2', 'b4'], b2: ['b5'], b3: ['b1'], b4: [],
    b5: ['b6', 'b8'], b6: ['b7'], b7: ['b5'], b8: ['b3'],
  };
  const dom = {
    b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b1', 'b2'],
    b4: ['b0', 'b1', 'b4'], b5: ['b0', 'b1', 'b2', 'b5'],
    b6: ['b0', 'b1', 'b2', 'b5', 'b6'],
    b7: ['b0', 'b1', 'b2', 'b5', 'b6', 'b7'],
    b8: ['b0', 'b1', 'b2', 'b5', 'b8'],
    b3: ['b0', 'b1', 'b2', 'b5', 'b8', 'b3'],
  };
  expect(findLoops(succ, dom)).toEqual({
    b1: ['b1', 'b2', 'b3', 'b5', 'b6', 'b7', 'b8'],
    b5: ['b5', 'b6', 'b7'],
  });
});
test('two back edges to one header make one loop', () => {
  const succ = { e: ['h'], h: ['a', 'x'], a: ['b', 'h'], b: ['h'], x: [] };
  const dom = { e: ['e'], h: ['e', 'h'], a: ['e', 'h', 'a'], b: ['e', 'h', 'a', 'b'], x: ['e', 'h', 'x'] };
  expect(findLoops(succ, dom)).toEqual({ h: ['a', 'b', 'h'] });
});
test('a block that loops to itself', () => {
  const succ = { b0: ['b1'], b1: ['b1', 'b2'], b2: [] };
  const dom = { b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b1', 'b2'] };
  expect(findLoops(succ, dom)).toEqual({ b1: ['b1'] });
});
test('no back edges, no loops', () => {
  const succ = { b0: ['b1', 'b2'], b1: ['b3'], b2: ['b3'], b3: [] };
  const dom = { b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b2'], b3: ['b0', 'b3'] };
  expect(findLoops(succ, dom)).toEqual({});
});
test('a cycle with two entrances is not a natural loop', () => {
  const succ = { e: ['a', 'b'], a: ['b'], b: ['a'] };
  const dom = { e: ['e'], a: ['e', 'a'], b: ['e', 'b'] };
  expect(findLoops(succ, dom)).toEqual({});
});`,
    hints: [
      'You will walk backwards, so first build `preds` (each block’s predecessors) from `succ`.',
      'Look at every edge `t → h`. It is a back edge exactly when `dom[t]` includes `h`.',
      'For a back edge, start the body with the header (plus anything already found for that header), push `t` on a stack, and keep popping: skip blocks already in the body, otherwise add them and push their predecessors.',
    ],
    walkthrough: `**How to think about it.** The definition gives you the algorithm almost word for word. First find the back edges: an edge \`t → h\` where \`h\` dominates \`t\`, which with this data is the question "is \`h\` in \`dom[t]\`?". Then, for each back edge, collect every block that can reach \`t\` without going through \`h\`. "Can reach \`t\`" means following arrows *backwards* from \`t\`, so you need each block's predecessors, which the input does not give you directly. And "without going through \`h\`" means the walk must stop at \`h\`; the neat way to arrange that is to put \`h\` in the body before the walk starts, so the rule "stop at blocks already in the body" stops there too.

**The solution, line by line.**

- \`const preds = {};\` starts the reversed graph.
- \`for (const b of Object.keys(succ)) {\` visits every block once.
- \`preds[b] = preds[b] ?? [];\` makes sure every block has an entry, even one nothing jumps to (\`??\` keeps the existing list if there is one).
- \`for (const s of succ[b]) {\`, \`preds[s] = preds[s] ?? [];\` and \`preds[s].push(b);\` record, for each edge \`b → s\`, that \`b\` is a predecessor of \`s\`.
- \`const loops = {};\` will map each header to its body.
- \`for (const t of Object.keys(succ)) {\` and \`for (const h of succ[t]) {\` look at every edge \`t → h\`.
- \`if (!dom[t].includes(h)) continue;\` skips every edge that is not a back edge.
- \`const body = new Set(loops[h]);\` starts from whatever an earlier back edge to the same header already found (\`new Set(undefined)\` is an empty set), which is how two latches merge into one loop.
- \`body.add(h);\` puts the header in first: the fence.
- \`const stack = [t];\` begins the walk at the latch.
- \`while (stack.length > 0) {\` and \`const x = stack.pop();\` take the next block to look at.
- \`if (body.has(x)) continue;\` stops at blocks already in, including the header, so the walk never escapes through the loop's entrance.
- \`body.add(x);\` and \`stack.push(...preds[x]);\` add the block and queue everything that leads to it.
- \`loops[h] = [...body].sort();\` stores the body as a sorted array, the form the tests compare.
- \`return loops;\` hands back the map.

On the two-entrance test, the edges \`a → b\` and \`b → a\` both fail the dominance check (the entry can reach either without the other), so no walk starts and the answer is \`{}\`.

**Common wrong attempts.**

- Calling an edge a back edge because it points "up" the listing: block order is an accident of how the graph was built. This finds a fake loop in the two-entrance cycle, and gets \`sum()\` wrong, where \`b3\` is listed before \`b5\`.
- Walking *forwards* from the header: everything reachable from the header includes the blocks after the loop, such as the \`return\`.
- Forgetting to add \`h\` before the walk: the walk then continues through the header to the blocks before the loop.`,
    wrong: [
      {
        code: `function findLoops(succ, dom) {
  const order = Object.keys(succ);
  const preds = {};
  for (const b of order) {
    preds[b] = preds[b] ?? [];
    for (const s of succ[b]) {
      preds[s] = preds[s] ?? [];
      preds[s].push(b);
    }
  }
  const loops = {};
  for (const t of order) {
    for (const h of succ[t]) {
      const back = order.indexOf(h) <=
        order.indexOf(t);
      if (!back) continue;
      const body = new Set(loops[h]);
      body.add(h);
      const stack = [t];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...preds[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
        why: 'An edge that goes “up” the listing is not necessarily a back edge. This finds a fake loop in the two-entrance cycle and breaks on `sum()`, where `b3` is listed before `b5`.',
      },
      {
        code: `function findLoops(succ, dom) {
  const loops = {};
  for (const t of Object.keys(succ)) {
    for (const h of succ[t]) {
      if (!dom[t].includes(h)) continue;
      const body = new Set(loops[h]);
      const stack = [h];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...succ[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
        why: 'Walking *forwards* from the header collects everything reachable from it, including the blocks after the loop. The loop is what leads *to* the latch, so walk predecessors from `t`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a CFG, b5 and b6 are the two branches of an `if`, and both jump to b7. Which of these dominate b7?',
    options: [
      {
        t: 'b5 and b6',
        why: 'Each can be skipped by taking the other branch.',
      },
      {
        t: 'The block that branches to b5 and b6 (and its own dominators)',
        correct: true,
        why: 'Every path to b7 passes through the branch, whichever way it goes.',
      },
      {
        t: 'Only b7 itself',
        why: 'b7 dominates itself, but so does everything on every path to it, including the entry.',
      },
      {
        t: 'Every block in the function',
        why: 'Blocks after b7, or on the other side of a branch, are not on every path.',
      },
    ],
  },
  {
    q: 'A block A runs before block B on some path. Does A dominate B?',
    options: [
      {
        t: 'Yes, always',
        why: 'One path is not enough. b5 runs before b7 on one path but not on the other.',
      },
      {
        t: 'Only if A comes earlier in the listing',
        why: 'Listing order has nothing to do with dominance.',
      },
      {
        t: 'No, never',
        why: 'Dominators do run before; it is just not sufficient.',
      },
      {
        t: 'Not necessarily: A must be on every path from the entry to B',
        correct: true,
        why: 'Dominance is about all paths.',
      },
    ],
  },
  {
    q: 'In the iterative algorithm, why must you keep doing passes until nothing changes?',
    options: [
      {
        t: 'A block can be visited before a predecessor’s set is final, for example across a back edge',
        correct: true,
        why: 'Its set was computed from an unfinished input, so another pass is needed to see whether it shrinks.',
      },
      {
        t: 'Because sets grow each pass',
        why: 'They only ever shrink.',
      },
      {
        t: 'To randomise the order',
        why: 'The order is fixed; repetition is what reaches the answer.',
      },
      {
        t: 'Each pass handles one more loop iteration of the program',
        why: 'The analysis never runs the program; passes are over the graph.',
      },
    ],
  },
  {
    q: 'Block B has two predecessors, with Dom(P1) = {0, 1, 3} and Dom(P2) = {0, 1, 4}. What is Dom(B), if B is block 5?',
    options: [
      {
        t: '{0, 1, 3, 4, 5}',
        why: 'That is the union: the blocks on some path. Dominators must be on every path.',
      },
      {
        t: '{0, 1}',
        why: 'Close, but every block dominates itself, so 5 belongs too.',
      },
      {
        t: '{0, 1, 5}',
        correct: true,
        why: 'The intersection {0, 1}, plus B itself.',
      },
      {
        t: '{5}',
        why: 'Blocks 0 and 1 are in both predecessors’ sets, so every path to B passes them.',
      },
    ],
  },
  {
    q: 'You delete block A from a CFG, and block B can no longer be reached from the entry. What do you learn?',
    options: [
      {
        t: 'B is unreachable in the original program',
        why: 'B was reachable before the deletion; the deletion is only a thought experiment.',
      },
      {
        t: 'A runs immediately before B',
        why: 'A might be far above B; it only has to be on every path.',
      },
      {
        t: 'B dominates A',
        why: 'It is the other way round.',
      },
      {
        t: 'A dominates B: every path from the entry to B went through A',
        correct: true,
        why: 'If any path avoided A, it would still reach B after the deletion.',
      },
    ],
  },
  {
    q: 'What is the immediate dominator of a block?',
    options: [
      {
        t: 'Its first predecessor',
        why: 'A predecessor can be skipped, like b5 for b7.',
      },
      {
        t: 'The entry block',
        why: 'The entry dominates everything, but it is usually not the closest.',
      },
      {
        t: 'Its closest strict dominator, its parent in the dominator tree',
        correct: true,
        why: 'Every other strict dominator is an ancestor of it.',
      },
      {
        t: 'The block that most often runs just before it',
        why: 'Dominance is about paths in the graph, not how often they are taken.',
      },
    ],
  },
  {
    q: 'In an `if`/`else` diamond b0 → b1, b2 → b3, what is the parent of b3 in the dominator tree?',
    options: [
      {
        t: 'b1',
        why: 'The path through b2 avoids b1.',
      },
      {
        t: 'b0',
        correct: true,
        why: 'Neither branch dominates the join, so its nearest strict dominator is the entry: the tree is flat.',
      },
      {
        t: 'b2',
        why: 'The path through b1 avoids b2.',
      },
      {
        t: 'b3 has two parents, b1 and b2',
        why: 'A tree gives every block one parent; that is the point of the immediate dominator.',
      },
    ],
  },
  {
    q: 'Viscosity’s `dominators` returns `idom`, a Map. How does `dominates(idom, a, b)` answer?',
    options: [
      {
        t: 'It looks `a` up in a stored set for `b`',
        why: 'No sets are stored; only immediate dominators.',
      },
      {
        t: 'It searches every path from the entry to `b`',
        why: 'There can be very many paths; the tree avoids that.',
      },
      {
        t: 'It walks from `b` up the tree through `idom` until it finds `a` or reaches the entry',
        correct: true,
        why: 'A dominates B exactly when A is B or one of its ancestors.',
      },
      {
        t: 'It compares their positions in reverse postorder',
        why: 'Being earlier in that order is necessary but not sufficient.',
      },
    ],
  },
  {
    q: 'How does `naturalLoops` use dominators?',
    options: [
      {
        t: 'Every block with two predecessors is a loop',
        why: 'b7, the join of an `if`, has two predecessors and is not a loop header.',
      },
      {
        t: 'It finds edges t → h where h dominates t: back edges, with h the loop header',
        correct: true,
        why: 'You can only jump back to a block you must already have passed through, which is what a loop header is.',
      },
      {
        t: 'A block that dominates itself is in a loop',
        why: 'Every block dominates itself.',
      },
      {
        t: 'It does not; loops are found from the source’s `while` and `for`',
        why: 'Working on the CFG means any loop is found, however it was written.',
      },
    ],
  },
  {
    q: 'In the Collatz CFG, what is DF(b5), the frontier of the odd branch?',
    options: [
      {
        t: '{b7}: b5 dominates b7’s predecessor b5, but not b7',
        correct: true,
        why: 'The join can also be reached through b6, so b5’s territory ends there.',
      },
      {
        t: '{b1}',
        why: 'b5 does not dominate b3, the source of the back edge, because the even branch also reaches b3.',
      },
      {
        t: '{} (empty)',
        why: 'b5 has a successor, b7, that it does not strictly dominate.',
      },
      {
        t: '{b5, b7}',
        why: 'b5 does not lead back to itself without passing through b1, which it does not dominate.',
      },
    ],
  },
  {
    q: 'In a CFG, `b4 → b2` is an edge, and `b2` dominates `b4`. What do you know?',
    options: [
      {
        t: '`b4 → b2` is a back edge, and `b2` is the header of a natural loop containing `b4`',
        correct: true,
        why: 'That is the definition: an edge to a block that dominates its source.',
      },
      {
        t: '`b4` is unreachable',
        why: 'Dominance is about paths to reachable blocks; `b4` is reached, through `b2`.',
      },
      {
        t: '`b2` is inside a loop headed by `b4`',
        why: 'The other way round: the target of a back edge is the header.',
      },
      {
        t: 'Nothing, unless `b4` comes after `b2` in the block list',
        why: 'Block order is irrelevant; dominance decides.',
      },
    ],
  },
  {
    q: 'Why does finding a natural loop walk *predecessors* from the back edge’s source?',
    options: [
      {
        t: 'Because walking successors is slower',
        why: 'Speed is not the issue; walking forwards finds the wrong set.',
      },
      {
        t: 'Because predecessors are already sorted',
        why: 'Order does not matter for a set.',
      },
      {
        t: 'Because the loop is the set of blocks that lead to the latch without passing the header, and walking backwards finds exactly those',
        correct: true,
        why: 'Forwards from the header you would also collect the blocks after the loop.',
      },
    ],
  },
  {
    q: 'The entry `e` has edges to both `a` and `b`, and `a → b`, `b → a`. How many natural loops are there?',
    options: [
      {
        t: 'One, headed by `a`',
        why: '`a` does not dominate `b`: the path `e → b` avoids it. So `b → a` is not a back edge.',
      },
      {
        t: 'None: the cycle has two entrances, so it is irreducible',
        correct: true,
        why: 'Neither block dominates the other, so neither edge of the cycle is a back edge.',
      },
      {
        t: 'Two, one for each edge of the cycle',
        why: 'Neither edge is a back edge, since neither target dominates its source.',
      },
    ],
  },
  {
    q: 'In `sum`, the read `g[i].x` sits in a block that belongs to both the `i` loop and the `k` loop. Which loop does `viscosity explain` charge it to?',
    options: [
      {
        t: 'The `k` loop, the innermost loop around the block',
        correct: true,
        why: '`loopOf` picks the smallest loop whose body contains the block.',
      },
      {
        t: 'The `i` loop, because `i` is the index',
        why: 'Bounds proofs look for the loop that counts with the index; access patterns use the innermost loop.',
      },
      {
        t: 'Both, counted twice',
        why: 'Each access is charged to exactly one loop.',
      },
    ],
  },
  {
    q: 'What does Viscosity do with the loops it finds?',
    options: [
      {
        t: 'Moves loop-invariant code out of them',
        why: 'Viscosity moves no code; it keeps your loops exactly as written.',
      },
      {
        t: 'Unrolls them to make struct-of-arrays access faster',
        why: 'The rewritten program keeps the loops exactly as written.',
      },
      {
        t: 'Uses them to describe the program: fields touched per loop, trip counts and bounds proofs',
        correct: true,
        why: 'Those feed its layout decision and tell it where it can drop bounds checks.',
      },
    ],
  },
];
