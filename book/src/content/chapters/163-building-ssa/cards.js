// Chapter 163 cards. Keys are stable ids: never rename them.

export const prompts = {
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

const placeTests = `const DF = [[], [1], [1], [1], [],
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
});`;

const renameTests = `const collatz = {
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
});`;

const R_HEAD = `// g: { code, phi, succ, preds, kids }
function rename(g) {`;

const renameBody = (search) => `${R_HEAD}
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
${search}
  search(0);
  return { out, phis };
}`;

const goodSearch = `  const search = (b) => {
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
  };`;

export const exercises = {
  'place-phis': {
    title: 'Place the phis',
    prompt:
      'Write `placePhis(defs, df)`. `defs` lists the blocks that assign one variable, and `df[b]` is block `b`’s dominance frontier. Return the sorted list of blocks that need a phi for the variable: the iterated dominance frontier of `defs`.\n\nUse a worklist: start it with `defs`. Take a block off; every block in its frontier gets a phi (once); a block that gets a phi is an assignment too, so put it on the worklist if it has never been on it.',
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
    tests: placeTests,
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
    prompt:
      'Rename one variable, `x`, over a whole CFG. `g.code[b]` lists block `b`’s mentions of `x` in order, each `"def"` or `"use"`; `g.phi[b]` says whether `b` starts with a phi for `x`; `g.succ`, `g.preds` and `g.kids` (children in the dominator tree) describe the graph; block 0 is the entry.\n\nVersions are numbers: 0 is the value on entry, and each phi or `def` takes the next unused number, 1, 2, ... in the order the walk meets them. Return `{ out, phis }`: `out[b]` lists, for each mention in `b`, the version it defines or reads; `phis[b]` is `{ dst, args }` (args in predecessor order) or `null`.\n\nWalk the dominator tree from block 0 with a stack (starting as `[0]`): phi first, then the code; then fill your CFG successors’ phi operands with the top; then visit your tree children; then pop what you pushed.',
    starter: `${R_HEAD}
  return {
    out: g.code.map(() => []),
    phis: g.phi.map(() => null),
  };
}`,
    solution: renameBody(goodSearch),
    tests: renameTests,
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
        code: renameBody(goodSearch.replace('    stack.length = size;\n', '')),
        why: 'Nothing is popped, so b6 sees b5’s version (2) instead of b1’s (1). Restore the stack size when leaving a block.',
      },
      {
        code: renameBody(`  const search = (b) => {
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
  };`),
        why: 'The phi gets its version after the block’s code, so the loop test in b1 reads version 0 instead of the phi. A phi comes first in its block.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the Collatz loop, suppose `n` were assigned only in b5. Where would phis for `n` go? (DF(b5) = {b7}, DF(b7) = {b1}, DF(b1) = {b1}.)',
    options: [
      { t: 'Only b7', why: 'b7’s new phi is an assignment, and its frontier is {b1}, so b1 needs one too.' },
      { t: 'b7 and b1', correct: true, why: 'The iterated frontier: b7 from b5, then b1 from b7’s phi.' },
      { t: 'Every block with two predecessors, and nowhere else', why: 'That happens to be the same here, but in general many joins need no phi for a given variable.' },
      { t: 'b5 itself', why: 'b5 assigns n; it does not merge anything.' },
    ],
  },
  {
    q: 'A variable is assigned once, in the entry block, and used everywhere. How many phis does it need?',
    options: [
      { t: 'One per join', why: 'Only one version exists, so no join ever sees two.' },
      { t: 'One, at the loop header', why: 'The back edge brings the same version, so there is nothing to choose.' },
      { t: 'None', correct: true, why: 'The entry dominates every block, so its frontier is empty.' },
    ],
  },
  {
    q: 'While renaming the Collatz loop, why does b6 read `n1` and not `n2`, which b5 defined?',
    options: [
      { t: 'b6 is visited before b5', why: 'The order of siblings does not matter; either way, they never see each other’s versions.' },
      { t: 'b5’s versions were popped when the walk left b5, before it moved to its sibling b6', correct: true, why: 'Popping on the way out keeps each branch’s versions to itself.' },
      { t: 'b6 reads the oldest version on the stack', why: 'A use always reads the top of the stack.' },
      { t: 'n2 is a phi', why: 'n2 is b5’s ordinary assignment, 3 * n1 + 1.' },
    ],
  },
  {
    q: 'Which statement about phi placement at dominance frontiers is true?',
    options: [
      { t: 'It never places a phi that is not needed', why: 'It can place one for a variable nobody reads after the join; pruned SSA leaves those out.' },
      { t: 'It needs the dominator tree and frontiers of a finished CFG', correct: true, why: 'Which is why VIR’s builder, which has no finished CFG while lowering, uses a different method.' },
      { t: 'It places phis in the blocks that assign the variable', why: 'It places them at the frontiers of those blocks, where versions meet.' },
      { t: 'It works one block at a time, without looking at the graph', why: 'Frontiers are a property of the whole graph.' },
    ],
  },
  {
    q: 'In the renaming walk, block b3 has a CFG successor b1 with a phi. When is b1’s operand for b3 filled in, and with what?',
    options: [
      { t: 'When the walk is in b3, with the top of the stack after b3’s code', correct: true, why: 'That is the version that flows along the edge b3 → b1.' },
      { t: 'When the walk enters b1, with b1’s own phi version', why: 'b1 is visited long before b3; its operand for b3 is filled from b3’s side.' },
      { t: 'At the very end, with the newest version made anywhere', why: 'The newest version overall may be on a different path.' },
      { t: 'Never: back-edge operands stay empty', why: 'Every operand is filled; the back edge brings the version made inside the loop.' },
    ],
  },
];
