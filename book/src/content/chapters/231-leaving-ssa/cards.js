// Chapter 231 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// The LLVM listing in the chapter is llc 18.1.3 -O2 -mtriple=riscv64
// -mattr=+m, printed with -print-after=phi-node-elimination.

export const prompts = {
  'destroy-what': {
    q: 'What does **SSA destruction** do with a phi `x = φ(a1, ..., an)`?',
    a: 'It puts a copy `x = ak` at the end of each predecessor Pk (before its branch) and deletes the phi.',
  },
  'where-copies': {
    q: 'In sumsq, `s1 = φ(s0, s2)` sits in b1 with predecessors b0 and b2. Where do the copies go?',
    a: '`s1 = s0` at the end of b0, and `s1 = s2` at the end of b2, before its jump back to b1.',
  },
  'not-ssa-after': {
    q: 'Why is the code no longer in SSA form after the phis are removed?',
    a: 'The phi’s result is now assigned once in each predecessor, so it has several definitions.',
  },
  'critical-copy': {
    q: 'Why can a phi’s copy not go at the end of a predecessor that also branches elsewhere?',
    a: 'The copy would run on the other path too. The edge is critical, so it must be split with a new block that holds the copy.',
  },
  'lost-copy-what': {
    q: 'What is the **lost-copy problem**?',
    a: 'A naive phi copy placed on a critical (usually back) edge overwrites the phi’s old value while it is still live, so a later use reads the new value.',
  },
  'copy-prop-cause': {
    q: 'In the lost-copy loop, what did copy propagation change that made the naive translation wrong?',
    a: 'It replaced `return y1` by `return x2`, so x2 became live after the loop, at the same time as x3.',
  },
  'fresh-copies': {
    q: 'How can phi copies be made always correct without splitting edges?',
    a: 'Copy each operand into a fresh name at the end of its predecessor, and the phi’s result out of a fresh name at the top of its block, so the names never overlap.',
  },
  'then-coalesce': {
    q: 'Inserting copies everywhere makes code correct but slow. What removes the extra copies?',
    a: 'Coalescing: merging a copy’s source and destination when they never need to be alive at once, so the copy disappears.',
  },
};

export const examples = {
  'lost-copy': {
    title: 'The lost copy, run three ways',
    code: `// The loop before SSA: returns y.
function original() {
  let x = 1;
  let y;
  do {
    y = x;
    x = x + 1;
  } while (x < 3);
  return y;
}

// Naive: the copy x2 = x3 sits at the
// end of b1, before the branch.
function naive() {
  let x2 = 1; // b0: x2 = x1
  let x3;
  while (true) {
    x3 = x2 + 1;
    x2 = x3; // runs on BOTH edges
    if (!(x3 < 3)) break;
  }
  return x2;
}

// Split: the copy is on the back edge.
function split() {
  let x2 = 1;
  let x3;
  while (true) {
    x3 = x2 + 1;
    if (!(x3 < 3)) break;
    x2 = x3; // block b5
  }
  return x2;
}

console.log(original(), naive(),
  split());`,
  },
};

export const exercises = {
  destroy: {
    title: 'Leave SSA, splitting critical edges',
    prompt:
      'Write `destroy(f)`. `f` maps each block name to `{ succs, preds, phis }`: its successors, its predecessors in the same order as the phi operands, and its phis, each an array `[dst, operand1, operand2, ...]`. Return an object mapping a place to the list of copies to put there, each a string like `\'s1 = s0\'`. A copy for operand k of a phi in block `b` goes at the end of predecessor `p = preds[k]`, unless the edge `p → b` is **critical** (p has more than one successor *and* b has more than one predecessor); then it goes in a new block named `p + \'>\' + b`. The starter always uses `p`.',
    starter: `// f maps each block to its succs, its
// preds (in phi-operand order) and its
// phis, each [dst, operand1, ...].
function destroy(f) {
  const at = {};
  for (const b in f) {
    const preds = f[b].preds || [];
    const phis = f[b].phis || [];
    preds.forEach((p, k) => {
      // If p -> b is critical, the copy
      // belongs in a new block named
      // p + '>' + b instead.
      const w = p;
      for (const [d, ...args] of phis) {
        const c = d + ' = ' + args[k];
        if (!at[w]) at[w] = [];
        at[w].push(c);
      }
    });
  }
  return at;
}`,
    solution: `// f maps each block to its succs, its
// preds (in phi-operand order) and its
// phis, each [dst, operand1, ...].
function destroy(f) {
  const at = {};
  for (const b in f) {
    const preds = f[b].preds || [];
    const phis = f[b].phis || [];
    preds.forEach((p, k) => {
      const out = f[p].succs.length;
      const many = preds.length > 1;
      const crit = many && out > 1;
      const w = crit ? p + '>' + b : p;
      for (const [d, ...args] of phis) {
        const c = d + ' = ' + args[k];
        if (!at[w]) at[w] = [];
        at[w].push(c);
      }
    });
  }
  return at;
}`,
    tests: `const sumsq = {
  b0: { succs: ['b1'] },
  b1: { succs: ['b2', 'b4'],
    preds: ['b0', 'b2'],
    phis: [['s1', 's0', 's2'],
      ['i1', 'i0', 'i2']] },
  b2: { succs: ['b1'], preds: ['b1'] },
  b4: { succs: [], preds: ['b1'] },
};
const loop = {
  b0: { succs: ['b1'] },
  b1: { succs: ['b1', 'b2'],
    preds: ['b0', 'b1'],
    phis: [['x2', 'x1', 'x3']] },
  b2: { succs: [], preds: ['b1'] },
};
const diamond = {
  b0: { succs: ['b1', 'b2'] },
  b1: { succs: ['b3'], preds: ['b0'] },
  b2: { succs: ['b3'], preds: ['b0'] },
  b3: { succs: [], preds: ['b1', 'b2'],
    phis: [['x', 'a', 'b']] },
};
test('sumsq: copies at the ends of b0 and b2', () => {
  expect(destroy(sumsq)).toEqual({
    b0: ['s1 = s0', 'i1 = i0'],
    b2: ['s1 = s2', 'i1 = i2'],
  });
});
test('a diamond: one copy in each arm', () => {
  expect(destroy(diamond)).toEqual({
    b1: ['x = a'], b2: ['x = b'],
  });
});
test('the lost-copy loop: split b1 -> b1', () => {
  expect(destroy(loop)).toEqual({
    b0: ['x2 = x1'], 'b1>b1': ['x2 = x3'],
  });
});
test('one predecessor is never critical', () => {
  const f = {
    b0: { succs: ['b1', 'b2'] },
    b1: { succs: [], preds: ['b0'],
      phis: [['y', 'z']] },
    b2: { succs: [], preds: ['b0'] },
  };
  expect(destroy(f)).toEqual({ b0: ['y = z'] });
});`,
    hints: [
      'Only the choice of place changes. Before you push a copy, decide whether the edge from p to b is critical.',
      'An edge is critical when its source has several successors (`f[p].succs.length > 1`) and its target several predecessors (`preds.length > 1`). Both must hold.',
      'Compute `const crit = preds.length > 1 && f[p].succs.length > 1;` and then `const w = crit ? p + \'>\' + b : p;`.',
    ],
    walkthrough: `**How to think about it.** Leaving SSA has two parts: *what* to copy (for operand k of each phi in \`b\`, the copy \`dst = operand k\`) and *where* (the end of the k-th predecessor). The starter already gets the what right, and the where right whenever the edge is not critical, which is why the sumsq and diamond tests pass. What is missing is the one rule of this chapter: a copy may sit at the end of \`p\` only if \`p\` always goes to \`b\`; otherwise the edge needs a block of its own. So the exercise is to recognise a critical edge and name the new block.

**The solution, line by line.**

- \`const at = {};\` will map a place (a block name) to its list of copies.
- \`for (const b in f) {\` visits every block; only blocks with phis will add anything.
- \`const preds = f[b].preds || [];\` and \`const phis = f[b].phis || [];\` default the missing fields to empty arrays, so the entry block, which has neither, is no special case.
- \`preds.forEach((p, k) => {\` walks the predecessors with their position k, which is also the position of the matching operand in every phi of \`b\`.
- \`const out = f[p].succs.length;\` counts where \`p\` can go.
- \`const many = preds.length > 1;\` asks whether \`b\` is a join.
- \`const crit = many && out > 1;\` is the definition of a critical edge: both conditions.
- \`const w = crit ? p + '>' + b : p;\` chooses the place: the end of \`p\`, or a new block on the edge. For the lost-copy loop, the back edge from b1 to b1 is critical (b1 has successors b1 and b2, predecessors b0 and b1), so its copy goes to \`'b1>b1'\`, while the entry edge's copy stays in b0.
- \`for (const [d, ...args] of phis) {\` takes each phi apart into its destination \`d\` and its operands \`args\` (the \`...\` collects the rest of the array).
- \`const c = d + ' = ' + args[k];\` builds the copy for this predecessor.
- \`if (!at[w]) at[w] = [];\` and \`at[w].push(c);\` add it to that place's list, in phi order.

The last test checks the other half of the definition: b0 has two successors, but b1 has only one predecessor, so the edge is not critical and the copy can go at the end of b0. (A block with one predecessor rarely has a phi at all; it is there to make sure both conditions are checked.)

**Common wrong attempts.**

- Testing only the source (\`out > 1\`): every branch out of a block with two successors gets split, even when its target has a single predecessor and the copy was safe; the last test fails.
- Putting the copy at the start of \`b\` instead of on the edge: then it runs on *every* arrival, including from the entry, and the copy for the back edge would overwrite the entry value.`,
    wrong: [
      {
        code: `// f maps each block to its succs, its
// preds (in phi-operand order) and its
// phis, each [dst, operand1, ...].
function destroy(f) {
  const at = {};
  for (const b in f) {
    const preds = f[b].preds || [];
    const phis = f[b].phis || [];
    preds.forEach((p, k) => {
      const out = f[p].succs.length;
      const many = preds.length > 1;
      const crit = out > 1;
      const w = crit ? p + '>' + b : p;
      for (const [d, ...args] of phis) {
        const c = d + ' = ' + args[k];
        if (!at[w]) at[w] = [];
        at[w].push(c);
      }
    });
  }
  return at;
}`,
        why: 'This splits every edge leaving a block with two successors, even when the target has only one predecessor; the last test expects the copy at the end of b0.',
      },
      {
        code: `// f maps each block to its succs, its
// preds (in phi-operand order) and its
// phis, each [dst, operand1, ...].
function destroy(f) {
  const at = {};
  for (const b in f) {
    const preds = f[b].preds || [];
    const phis = f[b].phis || [];
    preds.forEach((p, k) => {
      const out = f[p].succs.length;
      const many = preds.length > 1;
      const crit = many && out > 1;
      const w = crit ? b : p;
      for (const [d, ...args] of phis) {
        const c = d + ' = ' + args[k];
        if (!at[w]) at[w] = [];
        at[w].push(c);
      }
    });
  }
  return at;
}`,
        why: 'This puts the copy for a critical edge in the join block itself, where it would run on every arrival, not only along that edge.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A block b3 has predecessors b1 and b2 (in that order) and starts with `x = φ(a, b)`. Each of b1 and b2 has one successor. After leaving SSA:',
    options: [
      { t: '`x = a` at the start of b3', why: 'b3 cannot tell which way control came in; that is why the copies go in the predecessors.' },
      { t: '`x = a` at the end of b1 and `x = b` at the end of b2', correct: true, why: 'One copy per predecessor, using the operand that belongs to it.' },
      { t: '`x = b` at the end of b1 and `x = a` at the end of b2', why: 'The k-th operand belongs to the k-th predecessor: a to b1, b to b2.' },
    ],
  },
  {
    q: 'When must an edge be split before a phi copy can be placed on it?',
    options: [
      { t: 'When its source has several successors and its target several predecessors', correct: true, why: 'That is a critical edge: no existing block runs exactly when the edge is taken.' },
      { t: 'Whenever its target has a phi', why: 'sumsq’s b1 has phis, but its incoming edges are not critical, and the copies go at the ends of b0 and b2.' },
      { t: 'When it is a back edge', why: 'A back edge from a block with one successor (like sumsq’s b2 → b1) is not critical and needs no splitting.' },
    ],
  },
  {
    q: 'In the lost-copy loop, the naive translation returns 3 instead of 2. Why?',
    options: [
      { t: 'The loop runs one time too many', why: 'Both versions run the loop twice; the difference is in what x2 holds when it exits.' },
      { t: 'The copy for the entry edge is wrong', why: 'x2 = x1 = 1 is correct in both versions.' },
      { t: 'The back-edge copy x2 = x3 also runs on the way out, overwriting the x2 that is returned', correct: true, why: 'It sits at the end of b1, which leads both back to b1 and out to b2.' },
    ],
  },
  {
    q: 'What role did copy propagation play in the lost-copy problem?',
    options: [
      { t: 'It created the phi', why: 'The phi comes from SSA construction; copy propagation came later.' },
      { t: 'It made x2 live after the loop, by replacing `return y1` with `return x2`', correct: true, why: 'Before it, x2 died inside the loop and the naive copy did no harm.' },
      { t: 'None: the bug happens without any optimisation', why: 'Briggs et al. point out exactly that naive destruction is safe only before such optimisations.' },
    ],
  },
  {
    q: 'LLVM’s phi elimination for sumsq writes `%8 = COPY %2` at the end of the loop body and `%0 = COPY %8` at the top of the header. Why two copies where one would do?',
    options: [
      { t: 'Because RISC-V cannot copy a register in one instruction', why: 'mv is one instruction; the reason is about correctness, not the machine.' },
      { t: 'It is a bug', why: 'It is deliberate: copies through fresh names are always correct, and coalescing removes the extras.' },
      { t: 'Copying through a fresh name keeps the phi’s names from overlapping, so the translation is always correct; the register coalescer then removes the copies', correct: true, why: 'The final code has no mv in the loop: correctness first, tidying later.' },
    ],
  },
];
