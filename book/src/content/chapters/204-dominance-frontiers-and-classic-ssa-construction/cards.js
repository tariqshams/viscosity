// Chapter 210 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 91, 204.

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
  frontier: {
    q: 'In the classic algorithm, where are the phis for a variable assigned in block B placed?',
    a: 'In B’s dominance frontier: the first blocks that B does not strictly dominate (and, repeatedly, in the frontiers of those phis).',
  },
  'phi-is-def': {
    q: 'Why does a block that receives a phi for `v` go on the worklist?',
    a: 'A phi is itself an assignment of `v`, so its own frontier may need phis too.',
  },
  'iterate-why': {
    q: 'What does the “iterated” in iterated dominance frontier add over the plain frontier?',
    a: 'The frontiers of the phis just placed, repeated until no new block appears.',
  },
  'one-branch-phi': {
    q: '`x` is assigned before an `if` and again only in its left branch. Does the join need a phi for `x`?',
    a: 'Yes: the right-hand path brings the old value, so two versions meet there (`x3 = φ(x2, x1)`).',
  },
  'stack-why': {
    q: 'During renaming, what does the top of a variable’s stack mean?',
    a: 'The version of that variable that reaches the point the walk has got to.',
  },
  'tree-walk': {
    q: 'Why does renaming walk the dominator tree rather than the CFG?',
    a: 'The versions that reach a block are the ones made in it and in its dominator-tree ancestors, which is exactly what a stack holds on a walk down the tree.',
  },
  'pop-why': {
    q: 'Why does renaming pop a block’s versions when it leaves the block?',
    a: 'So that siblings in the tree (like the two branches of an `if`) never see each other’s versions.',
  },
  pruned: {
    q: 'What is the difference between minimal SSA (Cytron’s placement) and pruned SSA (LLVM’s `mem2reg`)?',
    a: 'Minimal puts a phi wherever two versions meet; pruned also leaves out phis for variables nobody reads after the join.',
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
    walkthrough: `**How to think about it.** Follow the steps from the chapter for one block at a time, and let recursion do the walk. When the walk is inside block \`b\`, the stack must hold exactly the versions made in \`b\`'s dominator-tree ancestors and in \`b\` so far; so push as you define, and when you leave \`b\`, cut the stack back to the size it had when you came in.

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
    q: 'In the Collatz loop, suppose `n` were assigned only in b5. Where would phis for `n` go? (DF(b5) = {b7}, DF(b7) = {b1}, DF(b1) = {b1}.)',
    options: [
      {
        t: 'Only b7',
        why: 'b7’s new phi is an assignment, and its frontier is {b1}, so b1 needs one too.',
      },
      {
        t: 'b7 and b1',
        correct: true,
        why: 'The iterated frontier: b7 from b5, then b1 from b7’s phi.',
      },
      {
        t: 'Every block with two predecessors, and nowhere else',
        why: 'That happens to be the same here, but in general many joins need no phi for a given variable.',
      },
      {
        t: 'b5 itself',
        why: 'b5 assigns n; it does not merge anything.',
      },
    ],
  },
  {
    q: 'A variable is assigned once, in the entry block, and used everywhere. How many phis does it need?',
    options: [
      {
        t: 'One per join',
        why: 'Only one version exists, so no join ever sees two.',
      },
      {
        t: 'One, at the loop header',
        why: 'The back edge brings the same version, so there is nothing to choose.',
      },
      {
        t: 'None',
        correct: true,
        why: 'The entry dominates every block, so its frontier is empty.',
      },
    ],
  },
  {
    q: 'While renaming the Collatz loop, why does b6 read `n1` and not `n2`, which b5 defined?',
    options: [
      {
        t: 'b6 is visited before b5',
        why: 'The order of siblings does not matter; either way, they never see each other’s versions.',
      },
      {
        t: 'b5’s versions were popped when the walk left b5, before it moved to its sibling b6',
        correct: true,
        why: 'Popping on the way out keeps each branch’s versions to itself.',
      },
      {
        t: 'b6 reads the oldest version on the stack',
        why: 'A use always reads the top of the stack.',
      },
      {
        t: 'n2 is a phi',
        why: 'n2 is b5’s ordinary assignment, 3 * n1 + 1.',
      },
    ],
  },
  {
    q: 'Which statement about phi placement at dominance frontiers is true?',
    options: [
      {
        t: 'It never places a phi that is not needed',
        why: 'It can place one for a variable nobody reads after the join; pruned SSA leaves those out.',
      },
      {
        t: 'It needs the dominator tree and frontiers of a finished CFG',
        correct: true,
        why: 'Which is why VIR’s builder, which has no finished CFG while lowering, uses a different method.',
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
    q: 'In the renaming walk, block b3 has a CFG successor b1 with a phi. When is b1’s operand for b3 filled in, and with what?',
    options: [
      {
        t: 'When the walk is in b3, with the top of the stack after b3’s code',
        correct: true,
        why: 'That is the version that flows along the edge b3 → b1.',
      },
      {
        t: 'When the walk enters b1, with b1’s own phi version',
        why: 'b1 is visited long before b3; its operand for b3 is filled from b3’s side.',
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
