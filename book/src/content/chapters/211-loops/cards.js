// Chapter 211 cards. Keys are stable ids: never rename them.

export const prompts = {
  'back-edge': {
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
  findLoops: {
    title: 'Find natural loops from back edges',
    prompt:
      '`succ` maps each block to its successors; `dom` maps each block to the list of blocks that dominate it (itself included). Write `findLoops(succ, dom)` returning an object that maps each loop **header** to its loop body as a **sorted** array. Back edges with the same header make one loop. Return `{}` if there are none.',
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
    q: 'In a CFG, `b4 → b2` is an edge, and `b2` dominates `b4`. What do you know?',
    options: [
      { t: '`b4 → b2` is a back edge, and `b2` is the header of a natural loop containing `b4`', correct: true, why: 'That is the definition: an edge to a block that dominates its source.' },
      { t: '`b4` is unreachable', why: 'Dominance is about paths to reachable blocks; `b4` is reached, through `b2`.' },
      { t: '`b2` is inside a loop headed by `b4`', why: 'The other way round: the target of a back edge is the header.' },
      { t: 'Nothing, unless `b4` comes after `b2` in the block list', why: 'Block order is irrelevant; dominance decides.' },
    ],
  },
  {
    q: 'Why does finding a natural loop walk *predecessors* from the back edge’s source?',
    options: [
      { t: 'Because walking successors is slower', why: 'Speed is not the issue; walking forwards finds the wrong set.' },
      { t: 'Because predecessors are already sorted', why: 'Order does not matter for a set.' },
      { t: 'Because the loop is the set of blocks that lead to the latch without passing the header, and walking backwards finds exactly those', correct: true, why: 'Forwards from the header you would also collect the blocks after the loop.' },
    ],
  },
  {
    q: 'The entry `e` has edges to both `a` and `b`, and `a → b`, `b → a`. How many natural loops are there?',
    options: [
      { t: 'One, headed by `a`', why: '`a` does not dominate `b`: the path `e → b` avoids it. So `b → a` is not a back edge.' },
      { t: 'None: the cycle has two entrances, so it is irreducible', correct: true, why: 'Neither block dominates the other, so neither edge of the cycle is a back edge.' },
      { t: 'Two, one for each edge of the cycle', why: 'Neither edge is a back edge, since neither target dominates its source.' },
    ],
  },
  {
    q: 'In `sum`, the read `g[i].x` sits in a block that belongs to both the `i` loop and the `k` loop. Which loop does `viscosity explain` charge it to?',
    options: [
      { t: 'The `k` loop, the innermost loop around the block', correct: true, why: '`loopOf` picks the smallest loop whose body contains the block.' },
      { t: 'The `i` loop, because `i` is the index', why: 'Bounds proofs look for the loop that counts with the index; access patterns use the innermost loop.' },
      { t: 'Both, counted twice', why: 'Each access is charged to exactly one loop.' },
    ],
  },
  {
    q: 'What does Viscosity do with the loops it finds?',
    options: [
      { t: 'Moves loop-invariant code out of them', why: 'Viscosity moves no code; it keeps your loops exactly as written.' },
      { t: 'Unrolls them to make struct-of-arrays access faster', why: 'The rewritten program keeps the loops exactly as written.' },
      { t: 'Uses them to describe the program: fields touched per loop, trip counts and bounds proofs', correct: true, why: 'Those feed its layout decision and tell it where it can drop bounds checks.' },
    ],
  },
];
