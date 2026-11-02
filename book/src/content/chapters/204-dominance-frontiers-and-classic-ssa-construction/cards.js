// Chapter 204 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'df-what': {
    q: 'When is block Y in the dominance frontier of block X?',
    a: 'When X dominates some predecessor of Y but does not strictly dominate Y.',
  },
  'df-self': {
    q: 'Why is a loop header that dominates the source of its back edge in its own dominance frontier?',
    a: 'It dominates a predecessor of itself (the back edge’s source), and no block strictly dominates itself.',
  },
  'df-climb': {
    q: 'Given the dominator tree, how do you compute dominance frontiers by climbing from each join Y?',
    a: 'For each predecessor P of Y, walk up the tree from P to idom(Y), not including it, adding Y to the frontier of every block passed.',
  },
  frontier: {
    q: 'In Cytron et al.’s SSA construction, which blocks get a phi for a variable v?',
    a: 'The iterated dominance frontier of the blocks that assign v (the entry counting as an assignment).',
  },
  'phi-is-def': {
    q: 'In the worklist algorithm for placing phis, why does a block that receives a phi for v go on the worklist?',
    a: 'A phi is itself an assignment of v, so its own frontier may need phis too.',
  },
  'iterate-why': {
    q: 'What does the iterated dominance frontier DF⁺(S) add over the plain frontier DF(S)?',
    a: 'The frontiers of the blocks already added, repeated until no new block appears.',
  },
  'one-branch-phi': {
    q: '`x` is assigned before an `if`, again only in its then branch, and read after the join. Does SSA need a phi for `x` at the join?',
    a: 'Yes: the else path brings the old value, so two versions meet there (`x3 = φ(x2, x1)`).',
  },
  'stack-why': {
    q: 'In SSA renaming by a walk of the dominator tree, what does the top of a variable’s version stack hold?',
    a: 'The version of that variable that reaches the point the walk has got to.',
  },
  'tree-walk': {
    q: 'Why does classic SSA renaming walk the dominator tree rather than the CFG?',
    a: 'The versions that reach a block are the ones made in it and in its dominator-tree ancestors, which is exactly what the stacks hold on a walk down the tree.',
  },
  'pop-why': {
    q: 'In classic SSA renaming, why are a block’s versions popped when the walk leaves the block?',
    a: 'So that blocks it does not dominate, such as its siblings in the tree (the two branches of an `if`), never see its versions.',
  },
  pruned: {
    q: 'What is the difference between minimal SSA and pruned SSA?',
    a: 'Minimal SSA puts a phi wherever two versions of a variable meet; pruned SSA also leaves out phis where the variable is not live.',
  },
};

export const examples = {
  'rename-diamond': {
    title: 'Renaming with a stack',
    code: `// b0: x = ...; then b1 or b2; b3 joins.
// x is assigned again only in b1.
const code = {
  0: ['def'], 1: ['use', 'def'],
  2: [], 3: ['phi', 'use'],
};
const succ = { 0: [1, 2], 1: [3],
  2: [3], 3: [] };
const kids = { 0: [1, 2, 3], 1: [],
  2: [], 3: [] };
const args = []; // b3's phi operands
const stack = ['x0'];
let count = 1;
function search(b) {
  let pushed = 0;
  const out = [];
  for (const op of code[b]) {
    if (op === 'use') {
      out.push('use ' + stack.at(-1));
    } else {
      const v = 'x' + count++;
      stack.push(v);
      pushed++;
      out.push(op + ' ' + v);
    }
  }
  console.log('b' + b + ':',
    out.join(', '));
  if (succ[b].includes(3)) {
    const j = b === 1 ? 0 : 1;
    args[j] = stack.at(-1);
  }
  for (const k of kids[b]) search(k);
  stack.length -= pushed;
}
search(0);
console.log('phi operands:', args);`,
  },
};

export const exercises = {
  frontiers: {
    optional: true,
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
  'place-phis': {
    title: 'Place the phis',
    prompt: `Write \`placePhis(defs, df)\`. \`defs\` lists the blocks that assign one variable, and \`df[b]\` is block \`b\`’s dominance frontier. Return the sorted list of blocks that need a phi for the variable: the iterated dominance frontier of \`defs\`.

Use a worklist: start it with \`defs\`. Take a block off; every block in its frontier gets a phi (once); a block that gets a phi is an assignment too, so put it on the worklist if it has never been on it.`,
    starter: `function placePhis(defs, df) {
  return [];
}`,
    solution: `function placePhis(defs, df) {
  const has = new Set();
  const seen = new Set(defs);
  const work = [...defs];
  while (work.length) {
    const x = work.pop();
    for (const y of df[x]) {
      if (has.has(y)) continue;
      has.add(y);
      if (!seen.has(y)) {
        seen.add(y);
        work.push(y);
      }
    }
  }
  return [...has].sort((a, b) => a - b);
}`,
    tests: `const DF = [[], [1], [1], [1], [],
  [7], [7], [1]];
test('n in the Collatz loop', () => {
  expect(placePhis([0, 5, 6], DF))
    .toEqual([1, 7]);
});
test('a phi can cause a phi', () => {
  expect(placePhis([5], DF))
    .toEqual([1, 7]);
});
test('assigned in the entry only', () => {
  expect(placePhis([0], DF)).toEqual([]);
});
test('a diamond', () => {
  const df = [[], [3], [3], []];
  expect(placePhis([0, 1], df))
    .toEqual([3]);
});`,
    hints: [
      'You need two sets: the blocks that already have a phi, and the blocks that have ever been on the worklist. They are not the same thing.',
      'Loop while the worklist is not empty: `const x = work.pop()`, then for each `y` of `df[x]`, give `y` a phi unless it already has one.',
      'Right after giving `y` a phi, push it onto the worklist if it is not in `seen` (and add it to `seen`). Return the phi set, sorted numerically.',
    ],
    walkthrough: `**How to think about it.** Placing a phi for one assignment is easy: its frontier is given. The catch is that each phi is a new assignment, whose own frontier may need phis, so you must keep going until no new block appears. A worklist does that naturally: it holds "assignments whose frontiers we have not handled yet", it starts with the real assignments, and each new phi adds one more entry. Two different questions need two different sets: "does this block already have a phi?" (so it gets one phi, not two) and "has this block already been on the worklist?" (so its frontier is handled once, and the loop ends).

**The solution, line by line.**

- \`const has = new Set();\` holds the blocks that have a phi; it is the answer.
- \`const seen = new Set(defs);\` holds every block that has ever been on the worklist, starting with the assigning blocks.
- \`const work = [...defs];\` is the worklist, a copy of \`defs\` (so the caller's array is not changed by \`pop\`).
- \`while (work.length) {\` runs until nothing is left to handle.
- \`const x = work.pop();\` takes one assignment block (the order does not change the answer).
- \`for (const y of df[x]) {\` looks at each block on its frontier.
- \`if (has.has(y)) continue;\` skips a block that already has its phi.
- \`has.add(y);\` places the phi.
- \`if (!seen.has(y)) { seen.add(y); work.push(y); }\` treats the new phi as an assignment: if \`y\` has never been on the worklist, it goes on now.
- \`return [...has].sort((a, b) => a - b);\` returns the blocks, sorted as numbers.

Trace the second test, where only b5 assigns: b5's frontier gives b7 a phi and puts b7 on the list; b7's frontier gives b1 a phi and puts b1 on the list; b1's frontier is {b1}, which already has one. The answer is [1, 7], the same as when b0 and b6 assign too.

**Common wrong attempts.**

- Taking the frontier of \`defs\` only, without the worklist: the second test then gives [7] and misses b1, whose phi is caused by b7's phi.
- Using one set for both jobs: if "has a phi" also means "has been on the worklist", a block that assigns the variable *and* sits on another's frontier (like b1 in a loop) is never given its phi, or a phi block is never handled.
- Forgetting \`continue\` and placing the phi again: harmless for the set, but with a list instead of a set the answer would contain repeats.`,
    wrong: [
      {
        code: `function placePhis(defs, df) {
  const has = new Set();
  for (const x of defs) {
    for (const y of df[x]) has.add(y);
  }
  return [...has].sort((a, b) => a - b);
}`,
        why: 'This is the plain frontier, not the iterated one. A phi is an assignment too, so its frontier needs phis: with only b5 assigning, b1 is missed.',
      },
    ],
  },
  rename: {
    optional: true,
    title: 'Rename with a stack',
    prompt: `Rename one variable, \`x\`, over a whole CFG. \`g.code[b]\` lists block \`b\`’s mentions of \`x\` in order, each \`"def"\` or \`"use"\`; \`g.phi[b]\` says whether \`b\` starts with a phi for \`x\`; \`g.succ\`, \`g.preds\` and \`g.kids\` (children in the dominator tree) describe the graph; block 0 is the entry.

Versions are numbers: 0 is the value on entry, and each phi or \`def\` takes the next unused number, 1, 2, ... in the order the walk meets them. Return \`{ out, phis }\`: \`out[b]\` lists, for each mention in \`b\`, the version it defines or reads; \`phis[b]\` is \`{ dst, args }\` (args in predecessor order) or \`null\`.

Walk the dominator tree from block 0 with a stack (starting as \`[0]\`): phi first, then the code; then fill your CFG successors’ phi operands with the top; then visit your tree children; then pop what you pushed.`,
    starter: `// g: { code, phi, succ, preds, kids }
function rename(g) {
  return {
    out: g.code.map(() => []),
    phis: g.phi.map(() => null),
  };
}`,
    solution: `// g: { code, phi, succ, preds, kids }
function rename(g) {
  const out = g.code.map(() => []);
  const phis = g.phi.map((p, b) =>
    p ? { dst: 0,
      args: g.preds[b].map(() => 0) }
      : null);
  const stack = [0];
  let count = 1;
  const push = () => {
    stack.push(count);
    return count++;
  };
  const search = (b) => {
    const size = stack.length;
    if (phis[b]) phis[b].dst = push();
    for (const op of g.code[b]) {
      const top = stack.at(-1);
      out[b].push(op === 'use'
        ? top : push());
    }
    for (const s of g.succ[b]) {
      if (!phis[s]) continue;
      const j = g.preds[s].indexOf(b);
      phis[s].args[j] = stack.at(-1);
    }
    for (const c of g.kids[b]) {
      search(c);
    }
    stack.length = size;
  };
  search(0);
  return { out, phis };
}`,
    tests: `const collatz = {
  code: [[], ['use'], ['use'], [],
    ['use'], ['use', 'def'],
    ['use', 'def'], []],
  phi: [false, true, false, false,
    false, false, false, true],
  succ: [[1], [2, 4], [5, 6], [1], [],
    [7], [7], [3]],
  preds: [[], [0, 3], [1], [7], [1],
    [2], [2], [5, 6]],
  kids: [[1], [2, 4], [5, 6, 7], [],
    [], [], [], [3]],
};
test('Collatz: the uses', () => {
  expect(rename(collatz).out).toEqual([
    [], [1], [1], [], [1], [1, 2],
    [1, 3], []]);
});
test('Collatz: the phis', () => {
  const { phis } = rename(collatz);
  expect(phis[1])
    .toEqual({ dst: 1, args: [0, 4] });
  expect(phis[7])
    .toEqual({ dst: 4, args: [2, 3] });
  expect(phis[0]).toBe(null);
});
test('the one-branch diamond', () => {
  const r = rename({
    code: [['def'], ['use', 'def'], [],
      ['use']],
    phi: [false, false, false, true],
    succ: [[1, 2], [3], [3], []],
    preds: [[], [0], [0], [1, 2]],
    kids: [[1, 2, 3], [], [], []],
  });
  expect(r.out)
    .toEqual([[1], [1, 2], [], [3]]);
  expect(r.phis[3])
    .toEqual({ dst: 3, args: [2, 1] });
});`,
    hints: [
      'Write a recursive `search(b)` that you call once, on block 0; it calls itself for each child in the dominator tree.',
      'Remember the stack size when you enter a block, and set `stack.length` back to it when you leave: that pops exactly what this block pushed.',
      'The operand of successor `s`’s phi that belongs to `b` is at position `g.preds[s].indexOf(b)`, and its value is the top of the stack after `b`’s own code has run.',
    ],
    walkthrough: `**How to think about it.** Follow the renaming steps for one block at a time, and let recursion do the walk. When the walk is inside block \`b\`, the stack must hold exactly the versions made in \`b\`'s dominator-tree ancestors and in \`b\` so far; so push as you define, and when you leave \`b\`, cut the stack back to the size it had when you came in.

**The solution, line by line.**

- \`const out = g.code.map(() => []);\` makes an empty result list per block.
- \`const phis = g.phi.map(...)\` makes, for each block with a phi, \`{ dst: 0, args: [0, 0, ...] }\` with one argument per predecessor (filled in later), and \`null\` for the others.
- \`const stack = [0];\` starts with version 0, the value on entry, and \`let count = 1;\` is the next unused version.
- \`const push = () => { stack.push(count); return count++; };\` makes a new version, puts it on top and returns it.
- \`const search = (b) => {\` handles one block.
- \`const size = stack.length;\` remembers the stack as it was on entry.
- \`if (phis[b]) phis[b].dst = push();\` gives the phi its version first: a phi sits at the very top of its block.
- \`for (const op of g.code[b]) { ... }\` goes through the mentions in order: a use records the top of the stack, a def records a fresh version (which \`push\` also puts on top).
- \`for (const s of g.succ[b]) { if (!phis[s]) continue; ... }\` looks at each CFG successor with a phi; \`g.preds[s].indexOf(b)\` finds which operand belongs to \`b\`, and it gets the current top.
- \`for (const c of g.kids[b]) { search(c); }\` visits the children in the dominator tree.
- \`stack.length = size;\` pops everything \`b\` pushed, so siblings do not see it.
- \`search(0); return { out, phis };\` starts at the entry and returns the result.

On the Collatz input this gives b1's phi version 1 with operands \`[0, 4]\` and b7's phi version 4 with \`[2, 3]\`, the same shape as VIR's \`%1 = phi %0, %12\` and \`%12 = phi %9, %11\`.

**Common wrong attempts.**

- Never popping: b6 then reads b5's version 2 instead of 1, as if the odd branch had run before the even one.
- Handling the phi *after* the block's code: b1's \`use\` then reads version 0, the value from before the loop, on every pass.
- Walking CFG successors instead of tree children: the walk follows the back edge into b1 again and never ends.`,
    wrong: [
      {
        code: `// g: { code, phi, succ, preds, kids }
function rename(g) {
  const out = g.code.map(() => []);
  const phis = g.phi.map((p, b) =>
    p ? { dst: 0,
      args: g.preds[b].map(() => 0) }
      : null);
  const stack = [0];
  let count = 1;
  const push = () => {
    stack.push(count);
    return count++;
  };
  const search = (b) => {
    const size = stack.length;
    if (phis[b]) phis[b].dst = push();
    for (const op of g.code[b]) {
      const top = stack.at(-1);
      out[b].push(op === 'use'
        ? top : push());
    }
    for (const s of g.succ[b]) {
      if (!phis[s]) continue;
      const j = g.preds[s].indexOf(b);
      phis[s].args[j] = stack.at(-1);
    }
    for (const c of g.kids[b]) {
      search(c);
    }
  };
  search(0);
  return { out, phis };
}`,
        why: 'Nothing is popped, so b6 sees b5’s version (2) instead of b1’s (1). Restore the stack size when leaving a block.',
      },
      {
        code: `// g: { code, phi, succ, preds, kids }
function rename(g) {
  const out = g.code.map(() => []);
  const phis = g.phi.map((p, b) =>
    p ? { dst: 0,
      args: g.preds[b].map(() => 0) }
      : null);
  const stack = [0];
  let count = 1;
  const push = () => {
    stack.push(count);
    return count++;
  };
  const search = (b) => {
    const size = stack.length;
    for (const op of g.code[b]) {
      const top = stack.at(-1);
      out[b].push(op === 'use'
        ? top : push());
    }
    if (phis[b]) phis[b].dst = push();
    for (const s of g.succ[b]) {
      if (!phis[s]) continue;
      const j = g.preds[s].indexOf(b);
      phis[s].args[j] = stack.at(-1);
    }
    for (const c of g.kids[b]) {
      search(c);
    }
    stack.length = size;
  };
  search(0);
  return { out, phis };
}`,
        why: 'The phi gets its version after the block’s code, so the loop test in b1 reads version 0 instead of the phi. A phi comes first in its block.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In an `if`/`else` diamond (b0 branches to b1 and b2, which both lead to b3), what is the dominance frontier of b1?',
    options: [
      {
        t: '{b3}: b1 dominates b3’s predecessor b1, but not b3',
        correct: true,
        why: 'b3 can also be reached through b2, so b1’s territory ends there.',
      },
      {
        t: '{} (empty)',
        why: 'b1 has a successor, b3, that it does not strictly dominate.',
      },
      {
        t: '{b0}',
        why: 'b0 is not a successor of anything b1 dominates.',
      },
      {
        t: '{b2, b3}',
        why: 'b2 is reached only from b0, which b1 does not dominate.',
      },
    ],
  },
  {
    q: 'A variable is assigned only in block B5, and DF(B5) = {B7}, DF(B7) = {B1}, DF(B1) = {B1}. Where does minimal SSA place its phis?',
    options: [
      {
        t: 'Only B7',
        why: 'B7’s new phi is an assignment, and its frontier is {B1}, so B1 needs one too.',
      },
      {
        t: 'B7 and B1',
        correct: true,
        why: 'The iterated frontier: B7 from B5, then B1 from B7’s phi.',
      },
      {
        t: 'Only B1',
        why: 'B5 dominates a predecessor of B7 but not B7, so B7 is in its frontier and needs a phi.',
      },
      {
        t: 'B5 itself',
        why: 'B5 assigns the variable; it does not merge anything.',
      },
    ],
  },
  {
    q: 'A variable is assigned once, in the entry block, and used everywhere. How many phis does minimal SSA give it?',
    options: [
      {
        t: 'One per join',
        why: 'Only one version exists, so no join ever sees two.',
      },
      {
        t: 'One at each loop header',
        why: 'The back edge brings the same version, so there is nothing to choose.',
      },
      {
        t: 'None',
        correct: true,
        why: 'The entry dominates every block, so its dominance frontier is empty.',
      },
    ],
  },
  {
    q: 'In classic SSA renaming, why does a use in the else branch of an `if` never read a version defined in the then branch?',
    options: [
      {
        t: 'The else branch is always visited first',
        why: 'The order of siblings does not matter; either way, they never see each other’s versions.',
      },
      {
        t: 'The then branch’s versions are popped when the walk leaves it, before it moves to its sibling',
        correct: true,
        why: 'Popping on the way out keeps each branch’s versions to itself.',
      },
      {
        t: 'A use reads the oldest version on the stack',
        why: 'A use always reads the top of the stack.',
      },
      {
        t: 'Each branch has its own copy of the stacks',
        why: 'There is one stack per variable, shared by the whole walk; popping is what keeps branches apart.',
      },
    ],
  },
  {
    q: 'Which statement about placing phis at iterated dominance frontiers (Cytron et al.) is true?',
    options: [
      {
        t: 'It never places a phi that is not needed',
        why: 'It can place one for a variable nobody reads after the join; pruned SSA leaves those out.',
      },
      {
        t: 'It needs the dominator tree and frontiers of a finished CFG',
        correct: true,
        why: 'Which is why a front end that builds SSA while still lowering uses an on-the-fly method (Braun et al.) instead.',
      },
      {
        t: 'It places phis in the blocks that assign the variable',
        why: 'It places them at the frontiers of those blocks, where versions meet.',
      },
      {
        t: 'It works one block at a time, without looking at the graph',
        why: 'Frontiers are a property of the whole graph.',
      },
    ],
  },
  {
    q: 'During classic SSA renaming, block L ends a loop with a back edge to the header H, which has a phi. When is that phi’s operand for L filled in, and with what?',
    options: [
      {
        t: 'When the walk is in L, with the top of the stack after L’s code',
        correct: true,
        why: 'That is the version that flows along the edge L → H.',
      },
      {
        t: 'When the walk enters H, with H’s own phi version',
        why: 'H is visited before L (it dominates it); its operand for L is filled from L’s side.',
      },
      {
        t: 'At the very end, with the newest version made anywhere',
        why: 'The newest version overall may be on a different path.',
      },
      {
        t: 'Never: back-edge operands stay empty',
        why: 'Every operand is filled; the back edge brings the version made inside the loop.',
      },
    ],
  },
];
