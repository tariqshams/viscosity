// Chapter 91 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dom-what': {
    q: 'In a CFG, when does block A dominate block B?',
    a: 'When every path from the entry to B passes through A.',
  },
  'not-before': {
    q: 'In a CFG, block b2 is the first block of a `while` loop’s body and b4 is the block after the loop. b2 can run before b4. Why doesn’t b2 dominate b4?',
    a: 'There is a path that skips it: if the loop test fails the first time, control goes from the test straight to b4.',
  },
  'idom-what': {
    q: 'In a CFG, what is a block’s immediate dominator?',
    a: 'Its closest strict dominator: the one every other strict dominator of it also dominates.',
  },
  'intersect-fingers': {
    q: 'In Cooper, Harvey and Kennedy’s dominator algorithm, `intersect(a, b)` moves two fingers up the dominator tree until they meet. Which finger moves at each step?',
    a: 'Whichever block is later in reverse postorder moves to its idom, until the two meet.',
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
  irreducible: {
    q: 'What is an irreducible cycle?',
    a: 'A cycle that can be entered at more than one block, so no block in it dominates the others and it has no back edge.',
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
    optional: true,
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

- The first five lines (from the starter) build \`preds\`, the predecessor lists, by filing every edge under its target, as a VIR builder does.
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
    q: 'A compiler stores dominance only as `idom`, a map from each block to its immediate dominator. How can it answer “does a dominate b?”',
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
    q: 'A field read sits in a block that belongs to two nested natural loops. Which loop does Viscosity charge the access to, when it reports which fields each loop touches?',
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
];
