// Chapter 215 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'partial-what': {
    q: 'When is a computation **partially redundant**?',
    a: 'When the same expression is available on some, but not all, of the paths that reach it.',
  },
  'pre-what': {
    q: 'What does **partial redundancy elimination** do?',
    a: 'Inserts the expression on the paths where it is missing, so that the partially redundant computation becomes fully redundant, then replaces it with the value already computed.',
  },
  'no-path-slower': {
    q: 'After PRE inserts `a + b` at the end of `b2`, why is the path through `b2` no slower?',
    a: 'That path computed `a + b` in `b3` before; now it computes it in `b2` instead, and `b3` reuses it. The work moved; it did not grow.',
  },
  'ant-what': {
    q: 'When is an expression **anticipable** at a point?',
    a: 'When every path from that point computes it before any of its operands changes.',
  },
  'ant-intersect': {
    q: 'Anticipability merges successors by intersection. So what must the starting guess be, and why?',
    a: 'Full sets (everything anticipable), except at exits: intersection can only remove, so starting empty would leave loops empty forever.',
  },
  'ant-why-safe': {
    q: 'Why does PRE only insert an expression where it is anticipable?',
    a: 'There the program was certain to compute it anyway, so the copy adds no work and cannot add a new exception; elsewhere it could do both.',
  },
  'critical-what': {
    q: 'What is a **critical edge**?',
    a: 'An edge from a block with more than one successor to a block with more than one predecessor.',
  },
  'critical-split': {
    q: 'How does a compiler get a place to insert code on a critical edge?',
    a: 'It splits the edge: a new, empty block on it runs exactly when that edge is taken.',
  },
};

export const examples = {
  'where-insert': {
    title: 'Where should the copy go?',
    code: `// a + b at the start of b3: is it
// available at the end of each pred,
// and anticipable there?
const preds = ['b1', 'b2'];
const avOut = { b1: true, b2: false };
const antOut = { b1: true, b2: true };
const av = (p) => avOut[p];
const some = preds.some(av);
const all = preds.every(av);
if (all) {
  console.log('fully redundant');
} else if (!some) {
  console.log('not redundant at all');
} else {
  for (const p of preds) {
    if (!avOut[p] && antOut[p]) {
      console.log('insert in', p);
    }
  }
}`,
  },
};

export const exercises = {
  anticipable: {
    title: 'Anticipable expressions',
    prompt: `Write \`anticipable(blocks, exprs)\`. Each block is \`{ succ, use, kill }\`: \`succ\` lists its successors, \`use\` the expressions (strings such as \`'a+b'\`) it computes before changing any of their operands, and \`kill\` those whose operands it changes. \`exprs\` lists every expression.

Return, for each block, the **sorted** array of expressions anticipable on entry to it, using the chapter's equations: \`ANTout(b)\` is the intersection of \`ANTin\` over \`b\`'s successors (empty if it has none), and \`ANTin(b)\` is \`use(b)\` plus whatever of \`ANTout(b)\` is not in \`kill(b)\`. Start every set full and repeat rounds, visiting blocks from last to first, until nothing changes.`,
    starter: `// blocks[b] = { succ, use, kill }:
// use: expressions b computes before
//   changing their operands; kill:
//   expressions whose operands b
//   changes. exprs: every expression.
function anticipable(blocks, exprs) {
  return blocks.map(() => []);
}`,
    solution: `// blocks[b] = { succ, use, kill }:
// use: expressions b computes before
//   changing their operands; kill:
//   expressions whose operands b
//   changes. exprs: every expression.
function anticipable(blocks, exprs) {
  const n = blocks.length;
  const full = () => new Set(exprs);
  const ant = blocks.map(full);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, kill } =
        blocks[b];
      const inAll = (e) => succ.every(
        (s) => ant[s].has(e));
      const out = succ.length === 0
        ? [] : exprs.filter(inAll);
      const inn = new Set(use);
      for (const e of out) {
        if (!kill.includes(e)) {
          inn.add(e);
        }
      }
      if (inn.size !== ant[b].size) {
        changed = true;
      }
      ant[b] = inn;
    }
  }
  return ant.map((s) => [...s].sort());
}
`,
    tests: `const B = (succ, use = [], kill = []) =>
  ({ succ, use, kill });
const E = ['a+b', 'a*c'];
test('both arms compute it', () => {
  const r = anticipable([B([1, 2]),
    B([3], ['a+b']), B([3], ['a+b']),
    B([])], E);
  expect(r[0]).toEqual(['a+b']);
});
test('one arm never computes it', () => {
  const r = anticipable([B([1, 2]),
    B([3], ['a+b']), B([3]), B([])], E);
  expect(r[0]).toEqual([]);
  expect(r[1]).toEqual(['a+b']);
});
test('the PRE example', () => {
  const r = anticipable([B([1, 2]),
    B([3], ['a+b']), B([3]),
    B([], ['a+b'])], E);
  expect(r).toEqual([['a+b'], ['a+b'],
    ['a+b'], ['a+b']]);
});
test('a kill stops it', () => {
  const r = anticipable([B([1]),
    B([2], [], ['a+b']),
    B([], ['a+b', 'a*c'])], E);
  expect(r[0]).toEqual(['a*c']);
  expect(r[1]).toEqual(['a*c']);
});
test('a loop computed on the way out', () => {
  const r = anticipable([B([1]),
    B([2, 3]), B([1]),
    B([], ['a+b'])], E);
  expect(r[1]).toEqual(['a+b']);
  expect(r[2]).toEqual(['a+b']);
});
test('a while loop body may not run', () => {
  const r = anticipable([B([1]),
    B([2, 3]), B([1], ['a+b']),
    B([])], E);
  expect(r[1]).toEqual([]);
  expect(r[2]).toEqual(['a+b']);
});
`,
    hints: [
      'This is the liveness exercise with two changes: successors are merged by intersection (an expression counts only if *every* successor has it), and every set starts full, `new Set(exprs)`, rather than empty.',
      'For one block: if it has no successors, `out` is empty; otherwise `out` is the expressions `e` for which `succ.every((s) => ant[s].has(e))`. Then `in` starts as `new Set(use)`, and each `e` of `out` that is not in `kill` is added.',
      'Sets only shrink here, so a change shows as a change in size. Repeat rounds with `while (changed)`, visiting `b` from `n - 1` down to `0`, and finish with `ant.map((s) => [...s].sort())`.',
    ],
    walkthrough: `**How to think about it.** Write down what "anticipable on entry to \`b\`" means in two cases. If \`b\` computes the expression before touching its operands, then yes, at once. Otherwise, it is anticipable if \`b\` leaves the operands alone *and* the expression is anticipable at the start of every block \`b\` can go to next. That is the pair of equations. As with liveness the sets depend on each other round loops, so we iterate; but because the merge is an intersection, the iteration must start from the most generous guess, "everything is anticipable everywhere", and let the equations take away what is not true. Starting from empty sets would be wrong: an intersection with an empty set is empty, so a loop could never get anything back. The difference matters in the test where the loop computes \`a + b\` only on the way out: every path that *leaves* the loop computes it, so the most generous consistent answer says yes, while starting empty says no.

**The solution, line by line.**

- \`const n = blocks.length;\` the number of blocks.
- \`const full = () => new Set(exprs);\` makes a set holding every expression, and \`const ant = blocks.map(full);\` gives every block one as its starting \`ANTin\`.
- \`let changed = true; while (changed) { changed = false;\` repeats rounds until one changes nothing.
- \`for (let b = n - 1; b >= 0; b--) {\` visits the blocks from last to first, since facts flow backwards.
- \`const { succ, use, kill } = blocks[b];\` unpacks the block.
- \`const inAll = (e) => succ.every((s) => ant[s].has(e));\` asks whether \`e\` is anticipable at the start of every successor.
- \`const out = succ.length === 0 ? [] : exprs.filter(inAll);\` is \`ANTout(b)\`: nothing after an exit, otherwise the expressions every successor anticipates. (The check for no successors matters: \`every\` on an empty list is \`true\`, which would make every expression anticipable after a return.)
- \`const inn = new Set(use);\` starts \`ANTin(b)\` with what \`b\` computes itself.
- \`for (const e of out) { if (!kill.includes(e)) { inn.add(e); } }\` adds what is anticipable afterwards, unless \`b\` changes its operands.
- \`if (inn.size !== ant[b].size) { changed = true; }\` notices a change (sets only shrink, so a change shows in the size), and \`ant[b] = inn;\` stores it.
- \`return ant.map((s) => [...s].sort());\` gives sorted arrays.

**Common wrong attempts.**

- Starting every set empty: the iteration then finds the *smallest* consistent answer, and in the loop test \`a + b\` is never anticipable in the loop.
- Merging with \`some\` instead of \`every\`: that asks whether *some* path computes it, and would let PRE insert \`a + b\` on paths that never needed it (in the second test, before a branch to \`return 0\`).
- Forgetting \`kill\`: in the third test, \`a + b\` would be called anticipable before \`a = 7\`, and a copy there would compute it with the old \`a\`.`,
    wrong: [
      {
        code: `// blocks[b] = { succ, use, kill }:
// use: expressions b computes before
//   changing their operands; kill:
//   expressions whose operands b
//   changes. exprs: every expression.
function anticipable(blocks, exprs) {
  const n = blocks.length;
  const full = () => new Set(exprs);
  const ant = blocks.map(
    () => new Set());
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, kill } =
        blocks[b];
      const inAll = (e) => succ.every(
        (s) => ant[s].has(e));
      const out = succ.length === 0
        ? [] : exprs.filter(inAll);
      const inn = new Set(use);
      for (const e of out) {
        if (!kill.includes(e)) {
          inn.add(e);
        }
      }
      if (inn.size !== ant[b].size) {
        changed = true;
      }
      ant[b] = inn;
    }
  }
  return ant.map((s) => [...s].sort());
}
`,
        why: 'Starting from empty sets finds the smallest consistent answer: in the loop that computes `a + b` only on the way out, the intersection round the back edge stays empty forever.',
      },
      {
        code: `// blocks[b] = { succ, use, kill }:
// use: expressions b computes before
//   changing their operands; kill:
//   expressions whose operands b
//   changes. exprs: every expression.
function anticipable(blocks, exprs) {
  const n = blocks.length;
  const full = () => new Set(exprs);
  const ant = blocks.map(full);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, kill } =
        blocks[b];
      const inAll = (e) => succ.some(
        (s) => ant[s].has(e));
      const out = succ.length === 0
        ? [] : exprs.filter(inAll);
      const inn = new Set(use);
      for (const e of out) {
        if (!kill.includes(e)) {
          inn.add(e);
        }
      }
      if (inn.size !== ant[b].size) {
        changed = true;
      }
      ant[b] = inn;
    }
  }
  return ant.map((s) => [...s].sort());
}
`,
        why: '`some` asks whether any successor anticipates the expression, so `a + b` looks anticipable before a branch where one arm never computes it.',
      },
      {
        code: `// blocks[b] = { succ, use, kill }:
// use: expressions b computes before
//   changing their operands; kill:
//   expressions whose operands b
//   changes. exprs: every expression.
function anticipable(blocks, exprs) {
  const n = blocks.length;
  const full = () => new Set(exprs);
  const ant = blocks.map(full);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, kill } =
        blocks[b];
      const inAll = (e) => succ.every(
        (s) => ant[s].has(e));
      const out = succ.length === 0
        ? [] : exprs.filter(inAll);
      const inn = new Set(use);
      for (const e of out) {
        inn.add(e);
      }
      if (inn.size !== ant[b].size) {
        changed = true;
      }
      ant[b] = inn;
    }
  }
  return ant.map((s) => [...s].sort());
}
`,
        why: 'Ignoring `kill` makes `a + b` anticipable before the block that changes `a`, where a copy would compute it with the wrong `a`.',
      },
    ],
  },
  splitCritical: {
    optional: true,
    title: 'Split the critical edges',
    prompt: 'Write `splitCritical(succ)`, where `succ[b]` lists block `b`\'s successors. Return a **new** array in which every critical edge `a → b` (`a` has more than one successor and `b` more than one predecessor) is replaced by `a → m` and `m → b`, where `m` is a new block. New blocks are numbered from `succ.length` upwards, in the order their edges are met (by source block, then by position in its successor list), and each new block\'s successor list is `[b]`. The input must not change.',
    starter: `// succ[b]: b's successors. New blocks
// get the next free numbers, in the
// order the critical edges are met.
function splitCritical(succ) {
  return succ;
}`,
    solution: `// succ[b]: b's successors. New blocks
// get the next free numbers, in the
// order the critical edges are met.
function splitCritical(succ) {
  const npred = succ.map(() => 0);
  for (const ss of succ) {
    for (const s of ss) npred[s]++;
  }
  const out = succ.map((ss) => [...ss]);
  succ.forEach((ss, a) => {
    if (ss.length < 2) return;
    ss.forEach((b, k) => {
      if (npred[b] < 2) return;
      out[a][k] = out.length;
      out.push([b]);
    });
  });
  return out;
}
`,
    tests: `test('a diamond has none', () => {
  const g = [[1, 2], [3], [3], []];
  expect(splitCritical(g)).toEqual(g);
});
test('one critical edge', () => {
  expect(splitCritical(
    [[1, 2], [3], [3, 4], [], []]))
    .toEqual([[1, 2], [3], [5, 4],
      [], [], [3]]);
});
test('a loop entry that can be skipped', () => {
  expect(splitCritical(
    [[1, 3], [2, 3], [1], []]))
    .toEqual([[4, 5], [2, 6], [1], [],
      [1], [3], [3]]);
});
test('does not change its input', () => {
  const g = [[1, 2], [2], []];
  splitCritical(g);
  expect(g).toEqual([[1, 2], [2], []]);
});
`,
    hints: [
      'First count each block’s predecessors: loop over every successor list and add one to `npred[s]` for each `s`.',
      'Copy the graph with `succ.map((ss) => [...ss])` so the input is untouched. Then, for each block `a` with at least two successors, look at each successor `b` (with its position `k`).',
      'If `npred[b]` is at least 2, the edge is critical: the new block’s number is the current `out.length`; set `out[a][k]` to it and `out.push([b])`.',
    ],
    walkthrough: `**How to think about it.** An edge is critical because of a fact about each end: its source has several ways out, and its target several ways in. Both facts can be read off the graph before changing anything, so count predecessors first, then look at every edge once. Splitting an edge does not change which edges are critical elsewhere (the new block has one predecessor and one successor), so one pass is enough.

**The solution, line by line.**

- \`const npred = succ.map(() => 0); for (...) for (const s of ss) npred[s]++;\` counts each block's predecessors, from the original graph.
- \`const out = succ.map((ss) => [...ss]);\` copies every successor list, so changes go to the copy and the input stays as it was.
- \`succ.forEach((ss, a) => { if (ss.length < 2) return;\` looks only at blocks with several successors; an edge out of a single-exit block is never critical.
- \`ss.forEach((b, k) => { if (npred[b] < 2) return;\` skips edges into single-entry blocks.
- \`out[a][k] = out.length;\` redirects the edge to the block about to be created, whose number is the next free index, and \`out.push([b]);\` creates it, with \`b\` as its only successor.
- \`return out;\` hands back the new graph.

**Common wrong attempts.**

- Splitting every edge into a join, whatever its source: correct code, but it adds blocks that are not needed (in a diamond, two), and the tests expect only critical edges to be split.
- Modifying \`succ\` in place: the caller's graph changes under it.`,
    wrong: [
      {
        code: `// succ[b]: b's successors. New blocks
// get the next free numbers, in the
// order the critical edges are met.
function splitCritical(succ) {
  const npred = succ.map(() => 0);
  for (const ss of succ) {
    for (const s of ss) npred[s]++;
  }
  const out = succ.map((ss) => [...ss]);
  succ.forEach((ss, a) => {
    ss.forEach((b, k) => {
      if (npred[b] < 2) return;
      out[a][k] = out.length;
      out.push([b]);
    });
  });
  return out;
}
`,
        why: 'This splits every edge into a block with two predecessors, even from a block with a single successor; in a diamond that adds two needless blocks.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`a + b` is computed in b1 (one arm of an `if`) and again in b3, after the join. What is the computation in b3?',
    options: [
      {
        t: 'Fully redundant',
        why: 'On the path through b2 nothing computed `a + b` before b3.',
      },
      {
        t: 'Partially redundant',
        correct: true,
        why: 'It repeats work on the path through b1, but not on the path through b2.',
      },
      {
        t: 'Dead',
        why: 'Its result may well be used; redundancy is about repeating work, not about being unused.',
      },
    ],
  },
  {
    q: 'How does PRE remove that partial redundancy?',
    options: [
      {
        t: 'Deletes the computation in b3',
        why: 'The path through b2 needs it; deleting it would leave that path without a value.',
      },
      {
        t: 'Moves the computation from b1 into b0',
        why: 'That is legal too (the next chapter calls it busy code motion), but it is not this chapter’s method, which inserts only in the predecessor where the value is missing.',
      },
      {
        t: 'Inserts `a + b` at the end of b2, then replaces b3’s computation with a phi of the two copies',
        correct: true,
        why: 'Now it is available on every path, so b3’s computation is fully redundant.',
      },
    ],
  },
  {
    q: 'Why must PRE insert only where an expression is anticipable?',
    options: [
      {
        t: 'Otherwise the copy may run on a path that never computed the expression, adding work or even a new exception',
        correct: true,
        why: 'Anticipable means every path from there computes it anyway, so the copy is free and safe.',
      },
      {
        t: 'Because SSA forbids instructions in other blocks',
        why: 'Instructions can go in any block, as long as their operands are defined there.',
      },
      {
        t: 'Because anticipable expressions are constants',
        why: 'Anticipability says nothing about being constant.',
      },
    ],
  },
  {
    q: 'Anticipability is a backward problem merged by intersection. What should every set start as?',
    options: [
      {
        t: 'Empty',
        why: 'With intersection, empty sets can never grow, so loops would be wrongly empty.',
      },
      {
        t: 'Full, every expression (exits get only what they use)',
        correct: true,
        why: 'The iteration then removes only what the equations contradict, finding the largest consistent answer.',
      },
      {
        t: 'The block’s own use set',
        why: 'That is the right answer only for exit blocks.',
      },
    ],
  },
  {
    q: 'Which edge is critical?',
    options: [
      {
        t: 'b0 → b1, where b0 has one successor',
        why: 'A single-exit source runs exactly when the edge is taken, so code can go at its end.',
      },
      {
        t: 'b1 → b3, where b3 has one predecessor',
        why: 'A single-entry target runs exactly when the edge is taken.',
      },
      {
        t: 'b2 → b3, where b2 has two successors and b3 has two predecessors',
        correct: true,
        why: 'Neither the end of b2 nor the start of b3 runs only on that edge, so it needs a block of its own.',
      },
    ],
  },
  {
    q: 'In `while (c) { x = a + b; }`, with `a` and `b` unchanged in the loop, PRE leaves `a + b` inside. Why?',
    options: [
      {
        t: 'The body may run zero times, so `a + b` is not anticipable before the loop',
        correct: true,
        why: 'A copy before the loop would compute it on a path that never did; for a `do`-`while` it would be safe.',
      },
      {
        t: 'PRE never moves code out of loops',
        why: 'It does, when the loop is certain to compute the expression, as in a `do`-`while`.',
      },
      {
        t: '`a + b` changes on every trip',
        why: 'Its operands do not change in the loop, so it does not.',
      },
    ],
  },
];
