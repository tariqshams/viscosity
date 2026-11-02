// Chapter 232 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'regalloc-what': {
    q: 'What does **register allocation** decide?',
    a: 'Which physical register each virtual register gets, so that interfering values never share one; values that get none are kept in memory.',
  },
  'colouring-what': {
    q: 'What is a **k-colouring** of a graph?',
    a: 'A choice of one of k colours per node, so that the two ends of every edge have different colours.',
  },
  'k-is-registers': {
    q: 'How does colouring the interference graph give a register allocation?',
    a: 'Colours are registers (k = how many there are); no edge joins two same-coloured nodes, so no two interfering values share a register.',
  },
  'degree-safe': {
    q: 'Why can a node with fewer than k neighbours always be coloured last?',
    a: 'Its neighbours use at most k − 1 colours between them, so at least one of the k colours is free for it.',
  },
  'select-order': {
    q: 'In what order does select colour the nodes, and why?',
    a: 'In reverse of the order simplify removed them (popping the stack), so each node meets only neighbours that were still in the graph when it was removed, fewer than k of them.',
  },
  'simplify-helps': {
    q: 'Why does removing one low-degree node often make others removable?',
    a: 'Removing it lowers each neighbour’s degree by one, which can bring them below k.',
  },
  'stuck-what': {
    q: 'When is simplify **stuck**?',
    a: 'When every node left has k or more neighbours, so none is guaranteed a free colour.',
  },
  optimistic: {
    q: 'What does Briggs’s **optimistic colouring** do when simplify is stuck?',
    a: 'It pushes a node anyway and carries on; the value is spilled only if select later finds no free colour for it.',
  },
  triangle: {
    q: 'Why can a triangle (a–b, b–c, c–a) never be coloured with two registers?',
    a: 'All three values interfere with each other, so they need three different colours.',
  },
};

export const examples = {
  colour: {
    title: 'Simplify and select, optimistically',
    code: `// g maps each value to its neighbours.
// Returns { value: register }, or null
// if some value cannot be coloured.
function colour(g, k) {
  const deg = {};
  for (const v in g) {
    deg[v] = g[v].length;
  }
  const left = new Set(Object.keys(g));
  const stack = [];
  // Simplify: remove a node of degree
  // < k; if none, push one anyway.
  while (left.size > 0) {
    let v = [...left].find(
      (x) => deg[x] < k);
    if (v === undefined) {
      v = [...left][0];
    }
    left.delete(v);
    stack.push(v);
    for (const w of g[v]) deg[w] -= 1;
  }
  // Select: pop, take the lowest
  // register no neighbour has.
  const c = {};
  while (stack.length > 0) {
    const v = stack.pop();
    const used = new Set(
      g[v].map((w) => c[w]));
    let r = 0;
    while (used.has(r)) r += 1;
    if (r >= k) return null;
    c[v] = r;
  }
  return c;
}

const E = 'i0-n i0-s0 i0-s1 i1-n ' +
  'i1-s1 ' +
  'i1-s2 i1-t i2-n i2-s1 i2-s2 n-s0 ' +
  'n-s1 n-s2 n-t s1-t';
function graph(edges) {
  const g = {};
  for (const e of edges.split(' ')) {
    const [a, b] = e.split('-');
    (g[a] = g[a] || []).push(b);
    (g[b] = g[b] || []).push(a);
  }
  return g;
}
const sumsq = graph(E);
console.log(colour(sumsq, 4));
console.log(colour(sumsq, 3));
const square = graph('a-b b-c c-d d-a');
console.log(colour(square, 2));`,
  },
};

export const exercises = {
  colour: {
    title: 'A colouring register allocator',
    prompt: 'Finish `colour(g, k)`. `g` maps each value to the array of its neighbours in the interference graph, and `k` is the number of registers. Return an object giving each value a register number from `0` to `k - 1`, with no two neighbours the same, or `null` if that fails. The starter has the simplify loop, but it gives up when stuck, and its select does nothing. Make two changes: when no node has degree below `k`, push one anyway (optimism; any remaining node will do); and write **select**, popping the stack and giving each value the lowest number none of its already-coloured neighbours has, returning `null` if there is none below `k`.',
    starter: `// g maps each value to its neighbours.
// Returns { value: register }, or null
// if some value cannot be coloured.
function colour(g, k) {
  const deg = {};
  for (const v in g) {
    deg[v] = g[v].length;
  }
  const left = new Set(Object.keys(g));
  const stack = [];
  // Simplify: remove a node of degree
  // < k. TODO: if there is none,
  // push one anyway (optimism).
  while (left.size > 0) {
    let v = [...left].find(
      (x) => deg[x] < k);
    // Stuck: no node has degree < k.
    if (v === undefined) return null;
    left.delete(v);
    stack.push(v);
    for (const w of g[v]) deg[w] -= 1;
  }
  // Select: TODO. Pop each value and
  // give it the lowest register number
  // that none of its neighbours has.
  const c = {};
  return c;
}`,
    solution: `// g maps each value to its neighbours.
// Returns { value: register }, or null
// if some value cannot be coloured.
function colour(g, k) {
  const deg = {};
  for (const v in g) {
    deg[v] = g[v].length;
  }
  const left = new Set(Object.keys(g));
  const stack = [];
  // Simplify: remove a node of degree
  // < k; if none, push one anyway.
  while (left.size > 0) {
    let v = [...left].find(
      (x) => deg[x] < k);
    if (v === undefined) {
      v = [...left][0];
    }
    left.delete(v);
    stack.push(v);
    for (const w of g[v]) deg[w] -= 1;
  }
  // Select: pop, take the lowest
  // register no neighbour has.
  const c = {};
  while (stack.length > 0) {
    const v = stack.pop();
    const used = new Set(
      g[v].map((w) => c[w]));
    let r = 0;
    while (used.has(r)) r += 1;
    if (r >= k) return null;
    c[v] = r;
  }
  return c;
}`,
    tests: `function graph(edges) {
  const g = {};
  for (const e of edges.split(' ')) {
    const [a, b] = e.split('-');
    (g[a] = g[a] || []).push(b);
    (g[b] = g[b] || []).push(a);
  }
  return g;
}
function proper(g, c, k) {
  for (const v in g) {
    expect(c[v] >= 0 && c[v] < k).toBe(true);
    for (const w of g[v]) {
      expect(c[v] !== c[w]).toBe(true);
    }
  }
}
const sumsq = graph('i0-n i0-s0 i0-s1 ' +
  'i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 ' +
  'i2-s2 n-s0 n-s1 n-s2 n-t s1-t');
test('sumsq colours with 4 registers', () => {
  const c = colour(sumsq, 4);
  proper(sumsq, c, 4);
});
test('sumsq cannot colour with 3', () => {
  expect(colour(sumsq, 3)).toBe(null);
});
test('a triangle needs 3', () => {
  const g = graph('a-b b-c c-a');
  expect(colour(g, 2)).toBe(null);
  proper(g, colour(g, 3), 3);
});
test('a square fits in 2 (optimism)', () => {
  const g = graph('a-b b-c c-d d-a');
  proper(g, colour(g, 2), 2);
});
test('a path colours with 2', () => {
  const g = graph('a-b b-c c-d');
  proper(g, colour(g, 2), 2);
});
test('a small tree colours with 2', () => {
  const g = graph('a-b a-e b-c b-d');
  proper(g, colour(g, 2), 2);
});`,
    hints: [
      'For optimism, replace the `return null` in simplify: if `find` gave `undefined`, choose any node still in `left`, for example `[...left][0]`.',
      'Select pops: `while (stack.length > 0) { const v = stack.pop(); ... }`. The colours of its neighbours are `g[v].map((w) => c[w])` (uncoloured ones give `undefined`, which is harmless in a Set).',
      'Start at `r = 0` and count up while the neighbours’ Set has `r`. If `r` reaches `k`, return `null`; otherwise set `c[v] = r`. After the loop, return `c`.',
    ],
    walkthrough: `**How to think about it.** Simplify and select is two loops. The first takes the graph apart, always removing something that is guaranteed to be easy later; the second puts it back together in reverse, colouring as it goes. Reversal is the heart of it: a node is coloured when exactly the nodes that were still in the graph at its removal (fewer than k of them, if it was removed honestly) have been coloured, so a free colour is guaranteed. Optimism weakens the guarantee on purpose: when stuck, push a node anyway, because its neighbours may yet share colours; select will tell us.

**The solution, line by line.**

- \`const deg = {}; for (const v in g) { deg[v] = g[v].length; }\` records each node's degree.
- \`const left = new Set(Object.keys(g));\` is the graph that remains, and \`const stack = [];\` the removed nodes, in order.
- \`let v = [...left].find((x) => deg[x] < k);\` looks for a node with fewer than k remaining neighbours.
- \`if (v === undefined) { v = [...left][0]; }\` is optimism: stuck, so pick one anyway. (A real allocator picks the node it would least mind spilling, using the spill cost of the next chapter.)
- \`left.delete(v); stack.push(v);\` removes it and remembers the order.
- \`for (const w of g[v]) deg[w] -= 1;\` lowers each neighbour's degree; it also lowers already-removed neighbours, which does no harm, since they are never looked at again.
- \`const c = {};\` will hold the colours.
- \`while (stack.length > 0) { const v = stack.pop();\` takes the nodes back last-removed first.
- \`const used = new Set(g[v].map((w) => c[w]));\` collects the colours of its neighbours that are already coloured.
- \`let r = 0; while (used.has(r)) r += 1;\` finds the lowest free colour.
- \`if (r >= k) return null;\` means even optimism failed: this value would have to be spilled (the next chapter).
- \`c[v] = r;\` colours it, and \`return c;\` returns the allocation.

On the square \`a-b b-c c-d d-a\` with k = 2, every degree is 2 and simplify is stuck at once; optimism pushes \`a\`, after which \`b\` and \`d\` have degree 1 and the rest unravels. Select colours \`a\` last, and its two neighbours \`b\` and \`d\` have ended up with the same colour, so \`a\` finds the other. On \`sumsq\` with k = 3, optimism pushes nodes too, but select meets a value whose neighbours already use all three registers, so the result is \`null\`: four values really are live at once.

**Common wrong attempts.**

- Keeping \`return null\` when stuck: correct for graphs that never get stuck, but it gives up on the square, which two registers can hold.
- Colouring in the order nodes were pushed (\`for (const v of stack)\`) instead of popping: a node is then coloured before the neighbours it was counted against, and the guarantee is gone; the small tree in the tests fails with two registers.`,
    wrong: [
      {
        code: `// g maps each value to its neighbours.
// Returns { value: register }, or null
// if some value cannot be coloured.
function colour(g, k) {
  const deg = {};
  for (const v in g) {
    deg[v] = g[v].length;
  }
  const left = new Set(Object.keys(g));
  const stack = [];
  // Simplify: remove a node of degree
  // < k; if none, push one anyway.
  while (left.size > 0) {
    let v = [...left].find(
      (x) => deg[x] < k);
    if (v === undefined) return null;
    left.delete(v);
    stack.push(v);
    for (const w of g[v]) deg[w] -= 1;
  }
  // Select: pop, take the lowest
  // register no neighbour has.
  const c = {};
  while (stack.length > 0) {
    const v = stack.pop();
    const used = new Set(
      g[v].map((w) => c[w]));
    let r = 0;
    while (used.has(r)) r += 1;
    if (r >= k) return null;
    c[v] = r;
  }
  return c;
}`,
        why: 'Without optimism it gives up on the square a–b–c–d, which two registers can hold.',
      },
      {
        code: `// g maps each value to its neighbours.
// Returns { value: register }, or null
// if some value cannot be coloured.
function colour(g, k) {
  const deg = {};
  for (const v in g) {
    deg[v] = g[v].length;
  }
  const left = new Set(Object.keys(g));
  const stack = [];
  // Simplify: remove a node of degree
  // < k; if none, push one anyway.
  while (left.size > 0) {
    let v = [...left].find(
      (x) => deg[x] < k);
    if (v === undefined) {
      v = [...left][0];
    }
    left.delete(v);
    stack.push(v);
    for (const w of g[v]) deg[w] -= 1;
  }
  // Select: pop, take the lowest
  // register no neighbour has.
  const c = {};
  for (const v of stack) {
    const used = new Set(
      g[v].map((w) => c[w]));
    let r = 0;
    while (used.has(r)) r += 1;
    if (r >= k) return null;
    c[v] = r;
  }
  return c;
}`,
        why: 'This colours nodes in the order they were pushed, not in reverse, so the guarantee that fewer than k neighbours are coloured first is lost; the small tree fails with k = 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With k = 3 registers, which node can simplify always remove?',
    options: [
      {
        t: 'One with exactly 3 neighbours',
        why: '3 neighbours could use all three colours.',
      },
      {
        t: 'One with 2 neighbours',
        correct: true,
        why: 'Two neighbours use at most two colours, so one of the three is always free.',
      },
      {
        t: 'The one with the most neighbours',
        why: 'That is the hardest to colour; simplify removes easy nodes first.',
      },
    ],
  },
  {
    q: 'Simplify pushed s0, then i0, then t. Which of the three does select colour first?',
    options: [
      {
        t: 't',
        correct: true,
        why: 'Select pops the stack: last pushed, first coloured.',
      },
      {
        t: 's0',
        why: 's0 was pushed first, so it is popped last.',
      },
      {
        t: 'Whichever has most neighbours',
        why: 'The order is fixed by the stack, not by degree.',
      },
    ],
  },
  {
    q: 'Simplify is stuck on a cycle of four values with k = 2. What does optimistic colouring do?',
    options: [
      {
        t: 'Spills one value at once',
        why: 'That is Chaitin’s original rule; Briggs’s improvement waits for select.',
      },
      {
        t: 'Adds a register',
        why: 'The machine’s registers are fixed.',
      },
      {
        t: 'Pushes a node anyway, and spills only if select finds no free colour; here select succeeds',
        correct: true,
        why: 'The node’s two neighbours end up with the same colour, leaving the other one free.',
      },
    ],
  },
  {
    q: 'Why is a triangle of interfering values impossible with two registers?',
    options: [
      {
        t: 'Because simplify gets stuck',
        why: 'Getting stuck alone does not prove failure; the square gets stuck and still fits.',
      },
      {
        t: 'Because each value interferes with both others, so all three need different registers',
        correct: true,
        why: 'Three mutually interfering values need three colours.',
      },
      {
        t: 'Because triangles always need four',
        why: 'Three registers are enough.',
      },
    ],
  },
  {
    q: 'How is deciding k-colourability, for k of 3 or more, usually described?',
    options: [
      {
        t: 'Easy: simplify always answers it exactly',
        why: 'Simplify can get stuck on colourable graphs; it is a fast method that usually works, not an exact one.',
      },
      {
        t: 'As one of the classic hard problems: no fast method is known that always gets it right',
        correct: true,
        why: 'Which is why allocators use simplify and select, which is fast and works well on real programs.',
      },
      {
        t: 'Impossible for computers',
        why: 'It can always be decided by trying every colouring, only slowly.',
      },
    ],
  },
  {
    q: 'In sumsq, n arrives in a0. How does a colouring allocator respect that?',
    options: [
      {
        t: 'By treating n’s node as precoloured, with its register fixed in advance',
        correct: true,
        why: 'Precoloured nodes take part in the graph with their colour already chosen.',
      },
      {
        t: 'It cannot; a mv is always needed',
        why: 'If n can stay in a0 without conflict, no mv is needed, as LLVM’s output shows.',
      },
      {
        t: 'By giving n the highest degree',
        why: 'Degree comes from interference, not from the calling convention.',
      },
    ],
  },
];
