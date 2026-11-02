// Cards for "Control-flow graphs" (split from chapter 157). Keys are stable ids.

export const prompts = {
  'cfg-what': {
    q: 'What are the nodes and edges of a control-flow graph?',
    a: 'Nodes are basic blocks; an edge A → B means B can run immediately after A.',
  },
  'pred-succ': {
    q: 'If there is an edge A → B, which is the predecessor?',
    a: 'A is a predecessor of B; B is a successor of A.',
  },
  cycle: {
    q: 'What does a cycle in a CFG mean?',
    a: 'A loop: control can come back to a block it has already run.',
  },
  'one-terminator': {
    q: 'In VIR, which part of a block can jump?',
    a: 'Only its terminator (`br`, `condbr`, `return`, `throw` or `unreachable`), and each block has exactly one, at the end.',
  },
  'preds-filled': {
    q: 'When does Viscosity’s builder fill in a block’s `preds`?',
    a: 'When it sets the terminator of another block: `terminate` adds that block to each successor’s `preds`.',
  },
  'empty-blocks': {
    q: 'Why does VIR’s CFG for the Collatz loop have blocks holding nothing but `br`?',
    a: 'The lowering always makes a join block for an `if` and an end-of-pass block for a loop. It keeps lowering mechanical, and costs little.',
  },
  'header-two-preds': {
    q: 'Why does a loop’s test block have (at least) two predecessors?',
    a: 'Control reaches it once from before the loop, and again from the end of every pass, along the back edge.',
  },
  unreachable: {
    q: 'How can you tell from a CFG that a (non-entry) block can never run?',
    a: 'No path from the entry reaches it; for example, it has no predecessors.',
  },
  'unreachable-chain': {
    q: 'Can a block with predecessors still be unreachable?',
    a: 'Yes, if all its predecessors are unreachable too. The safe test is a search from the entry.',
  },
};

export const examples = {
  'succ-preds': {
    title: 'The Collatz CFG, both directions',
    code: `// successors of b0..b7, from VIR
const succ = [[1], [2, 4], [5, 6],
  [1], [], [7], [7], [3]];
const preds = succ.map(() => []);
succ.forEach((ss, b) => {
  for (const s of ss) preds[s].push(b);
});
preds.forEach((ps, b) => {
  console.log('b' + b, 'preds', ps);
});`,
  },
};

const predTests = `test('the Collatz CFG', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(preds(succ)).toEqual([[], [0, 3],
    [1], [7], [1], [2], [2], [5, 6]]);
});
test('an unreachable block', () => {
  expect(preds([[], []]))
    .toEqual([[], []]);
});
test('a self-loop', () => {
  expect(preds([[1], [1, 2], []]))
    .toEqual([[], [0, 1], [1]]);
});`;

const reachTests = `test('everything reachable', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(unreachable(succ)).toEqual([]);
});
test('code after a return', () => {
  expect(unreachable([[], []]))
    .toEqual([1]);
});
test('a dead chain', () => {
  const succ = [[3], [2], [3], []];
  expect(unreachable(succ))
    .toEqual([1, 2]);
});
test('a dead loop', () => {
  const succ = [[], [2], [1]];
  expect(unreachable(succ))
    .toEqual([1, 2]);
});`;

export const exercises = {
  preds: {
    title: 'Predecessors from successors',
    prompt:
      'A CFG is given as `succ`, an array where `succ[b]` lists block `b`’s successors. Write `preds(succ)` that returns the reverse: an array where entry `b` lists the predecessors of `b`, in increasing block order. Every block gets an entry, even if it is empty.',
    starter: `function preds(succ) {
  return succ;
}`,
    solution: `function preds(succ) {
  const ps = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
    tests: predTests,
    hints: [
      'Every edge `b → s` appears once in `succ`, under `b`. Where should it appear in the answer?',
      'Under `s`: so visit every block `b`, and for each successor `s`, push `b` onto the list for `s`.',
      'Start with an empty list for every block: `succ.map(() => [])`. Visiting blocks in increasing order keeps each list sorted for free.',
    ],
    walkthrough: `**How to think about it.** Successors and predecessors are the same edges, read from opposite ends; an edge \`b → s\` says "s is a successor of b" and, at the same time, "b is a predecessor of s". So the job is to visit every edge once and file it under its other end, which is the same filing trick as \`buildUses\` in Three-address code.

**The solution, line by line.**

- \`function preds(succ) {\` takes the successor lists.
- \`const ps = succ.map(() => []);\` makes one new, empty list per block. \`map\` calls the arrow function once per block, so each block gets its *own* array.
- \`succ.forEach((ss, b) => {\` visits block \`b\` and its successor list \`ss\`, in increasing order of \`b\`.
- \`for (const s of ss) ps[s].push(b);\` files the edge \`b → s\` under \`s\`. Because \`b\` only grows, each list comes out sorted without a sort.
- \`});\` and \`return ps;\` finish the pass and hand back the lists.

For the Collatz CFG the result is \`[[], [0, 3], [1], [7], [1], [2], [2], [5, 6]]\`, which matches the \`; preds\` comments in the VIR listing exactly. Viscosity does the same filing, but at the moment each edge is created: \`terminate\` pushes the current block onto each successor's \`preds\`.

**Common wrong attempts.**

- \`new Array(n).fill([])\` puts the *same* array in every slot (the aliasing from References: two names, one object), so every push lands in all of them and every block appears to have every predecessor.
- Returning \`succ\` itself, or pushing \`s\` instead of \`b\`: that files the edge under the wrong end.`,
    wrong: [
      {
        code: `function preds(succ) {
  const ps = new Array(succ.length)
    .fill([]);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
        why: '`fill([])` puts the same array in every slot, so every block ends up with every predecessor. Make a new array per block with `map`.',
      },
      {
        code: `function preds(succ) {
  const ps = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[b].push(s);
  });
  return ps;
}`,
        why: 'This files each edge under its own start, which rebuilds the successors. Push `b` onto `ps[s]`.',
      },
    ],
  },
  reachable: {
    optional: true,
    title: 'Find the unreachable blocks',
    prompt:
      'Block 0 is the entry. Write `unreachable(succ)` that returns, in increasing order, every block that no path from block 0 reaches. Search from the entry: keep a list of blocks still to visit, and a `Set` of blocks already seen.',
    starter: `function unreachable(succ) {
  const out = [];
  succ.forEach((ss, b) => {
    if (b !== 0 && ss.length === 0) {
      out.push(b);
    }
  });
  return out;
}`,
    solution: `function unreachable(succ) {
  const seen = new Set([0]);
  const todo = [0];
  while (todo.length) {
    const b = todo.pop();
    for (const s of succ[b]) {
      if (!seen.has(s)) {
        seen.add(s);
        todo.push(s);
      }
    }
  }
  return succ.map((_, b) => b)
    .filter((b) => !seen.has(b));
}`,
    tests: reachTests,
    hints: [
      'Turn it round: find every block that *is* reachable, and the answer is all the others.',
      'Start with `seen = new Set([0])` and `todo = [0]`. While `todo` is not empty, take a block out and look at its successors.',
      'Each successor not yet in `seen` goes into `seen` and onto `todo`. At the end, keep the block numbers not in `seen`.',
    ],
    walkthrough: `**How to think about it.** "No path from the entry reaches it" is hard to check directly, because there are many possible paths; the other side of the question is easy, though. Start at the entry and spread outwards along the edges, marking every block you touch; anything never marked is unreachable. This is a graph search, and the order you explore in does not matter for the answer.

**The solution, line by line.**

- \`const seen = new Set([0]);\` marks the entry as reached.
- \`const todo = [0];\` holds blocks whose successors we have not looked at yet.
- \`while (todo.length) {\` keeps going until there is nothing left to explore (an empty array has length 0, which counts as false).
- \`const b = todo.pop();\` takes a block out.
- \`for (const s of succ[b]) {\` looks at each of its successors.
- \`if (!seen.has(s)) { seen.add(s); todo.push(s); }\` marks a newly found block and queues it. Marking *before* exploring is what stops a loop from being explored forever.
- \`return succ.map((_, b) => b).filter((b) => !seen.has(b));\` lists every block number (\`map\` with the index) and keeps the unmarked ones, already in increasing order.

**Common wrong attempts.**

- "A non-entry block with no predecessors is unreachable" is true, but not the whole story: in the test \`[[3], [2], [3], []]\`, block 2 has a predecessor (block 1), yet neither is reachable, and in the dead loop 1 and 2 are each other's predecessors.
- Looking at *successors* to decide (as the starter does) answers a different question: a block with no successors is one that returns, not one that never runs.
- Forgetting the \`seen\` check: a loop in the graph would then be pushed onto \`todo\` forever.`,
    wrong: [
      {
        code: `function unreachable(succ) {
  const has = succ.map(() => false);
  succ.forEach((ss) => {
    for (const s of ss) has[s] = true;
  });
  return succ.map((_, b) => b)
    .filter((b) => b !== 0 && !has[b]);
}`,
        why: 'This finds blocks with no predecessors, but misses dead chains and dead loops, whose blocks have predecessors that are unreachable themselves.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In VIR, how many terminators does a block have, and where?',
    options: [
      { t: 'Any number, anywhere in `insts`', why: 'Ordinary instructions cannot jump in VIR; that is the point of `term`.' },
      { t: 'Zero or one', why: 'Every block has one; an unfinished block has `unreachable` as its terminator.' },
      { t: 'Two: one for each successor', why: 'A single `condbr` names both successors.' },
      { t: 'Exactly one, in `term`, after all the instructions', correct: true, why: 'The type itself guarantees one exit per block.' },
    ],
  },
  {
    q: 'A block ends with `condbr %5, b5, b6`. What does `successors` return for it?',
    options: [
      { t: '`[5]`', why: 'Either branch can be taken, so both are successors.' },
      { t: '`[5, 6]`', correct: true, why: 'The then target first, then the else target.' },
      { t: '`[%5]`', why: '%5 is the condition value, not a block.' },
      { t: '`[]`', why: 'An empty list is for `return`, `throw` and `unreachable`.' },
    ],
  },
  {
    q: 'In the VIR CFG for the Collatz loop, block b1 has predecessors b0 and b3. What does that tell you?',
    options: [
      { t: 'b1 is unreachable', why: 'It has predecessors, and b0 is the entry.' },
      { t: 'b1 runs exactly twice', why: 'The CFG says which paths exist, not how many times each is taken.' },
      { t: 'b1 can be entered from the entry or from the back edge: it is the loop’s header', correct: true, why: 'b3 → b1 closes the cycle, so b1 is reached once from b0 and again each time round the loop.' },
      { t: 'b0 and b3 run at the same time', why: 'Only one path is taken each time; the edges are alternatives.' },
    ],
  },
  {
    q: 'In VIR for `function abs(x) { if (x < 0) return -x; return x; }`, how many predecessors does the block holding `return x` have?',
    options: [
      { t: 'One: the empty else block', correct: true, why: 'The then branch returns, so it never reaches the code after the if; only b2 jumps to b3.' },
      { t: 'Two: both branches of the if', why: 'The then branch ends with its own return, so it has no edge to the code after the if.' },
      { t: 'None', why: 'Then the second return could never run, but it runs whenever x is not negative.' },
      { t: 'Three', why: 'There are only two ways out of the test, and one of them returns.' },
    ],
  },
  {
    q: 'What does Viscosity’s lowering do with `x = 2;` written after `return x;`?',
    options: [
      { t: 'Reports a syntax error', why: 'Code after a return is valid JavaScript.' },
      { t: 'Deletes it during parsing', why: 'The parser keeps it; the lowering deals with it.' },
      { t: 'Puts it at the end of the entry block', why: 'Then it would run after the return, which cannot happen. The return is the block’s terminator.' },
      { t: 'Lowers it into a fresh block with no predecessors, which is unreachable', correct: true, why: 'Nothing jumps to that block, and the CFG makes it visible: no path from the entry reaches it.' },
    ],
  },
];
