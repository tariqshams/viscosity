// Chapter 205-b cards (staged split of 189): recall prompts, examples,
// exercises and quiz. Keys are stable ids: renaming one would orphan
// readers' review history.

export const prompts = {
  'gvn-why-dom': {
    q: 'Why may a value computed in block `d` be reused in block `b` when `d` dominates `b`?',
    a: '`d` is on every path from the entry to `b`, so the value has always been computed by then, and in SSA it cannot have changed.',
  },
  'sibling-no': {
    q: 'b1 and b2 are the two arms of an `if`. Why may b2 not reuse a value computed in b1?',
    a: 'On the path through b2, b1 never ran, so the value was never computed.',
  },
  'gvn-what': {
    q: 'What does **global value numbering** add to local value numbering?',
    a: 'It numbers a whole function at once, so a value computed in one block can make an instruction in another block redundant.',
  },
  'scoped-table': {
    q: 'In dominator-based value numbering, what happens to a block’s table entries when the walk leaves it?',
    a: 'They are thrown away (its scope is closed), so only the entries of the current block’s dominators are ever visible.',
  },
  'phi-same': {
    q: 'After numbering, a phi reads `phi %2, %2`. What is its value?',
    a: '`%2`: both edges bring the same value, so the phi is no choice at all.',
  },
  'gvn-misses': {
    q: '`a + b` is computed in both arms of an `if` and again after the join. Why does dominator-based GVN not remove the third one?',
    a: 'Neither earlier computation dominates the join, so neither is in the table there; the value is available on every path, but from different instructions.',
  },
  'loop-blind': {
    q: 'Why does a hashing walk fail to see that two lockstep counters `i` and `j` are equal?',
    a: 'It reaches their phis before the `i + 1` and `j + 1` they depend on have numbers, so the phis look different, and so then do the additions.',
  },
  'optimistic-vn': {
    q: 'How does Alpern, Wegman and Zadeck’s method find that `i` and `j` are equal?',
    a: 'It starts by assuming values computed the same way are equal, and splits them apart only when their operands are shown to differ.',
  },
};

export const examples = {
  scopes: {
    title: 'A table that follows the tree',
    code: `// each block's keys, and the
// dominator tree's children
const adds = { b0: ['a*b'],
  b1: ['a+b'], b2: [], b3: [] };
const kids = { b0: ['b1', 'b2', 'b3'],
  b1: [], b2: [], b3: [] };
function walk(b, outer) {
  const seen = [...outer];
  console.log(b, 'can reuse:', seen);
  const mine = [...seen, ...adds[b]];
  for (const c of kids[b]) {
    walk(c, mine);
  }
}
walk('b0', []);`,
  },
};

const G_HEAD = `// f.blocks[b].insts: { id, op, args }
//   op: 'param', 'phi', '+', '-', '*'
//   a phi's args follow b's preds.
// f.kids[b]: b's children in the
//   dominator tree; 0 is the root.
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function gvn(f) {`;

const G_SOL = `${G_HEAD}
  const rep = {};
  const vn = (a) => rep[a] ?? a;
  const walk = (b, outer) => {
    const table = new Map(outer);
    for (const i of f.blocks[b].insts) {
      if (i.op === 'param') continue;
      const args = i.args.map(vn);
      const same = args.every(
        (a) => a === args[0]);
      if (i.op === 'phi' && same) {
        rep[i.id] = args[0];
        continue;
      }
      const ks = COMM.includes(i.op)
        ? [...args].sort(byNum) : args;
      const where = i.op === 'phi'
        ? ' ' + b : '';
      const key = i.op + where + ' ' +
        ks.join(' ');
      if (table.has(key)) {
        rep[i.id] = table.get(key);
      } else {
        table.set(key, i.id);
      }
    }
    for (const c of f.kids[b]) {
      walk(c, table);
    }
  };
  walk(0, new Map());
  return rep;
}
`;

const G_TESTS = `const P = (id) =>
  ({ id, op: 'param', args: [] });
const O = (id, op, ...args) =>
  ({ id, op, args });
const diamond = { kids: [[1, 2, 3],
  [], [], []], blocks: [
  { insts: [P(0), P(1),
    O(2, '*', 0, 1)] },
  { insts: [O(4, '*', 0, 1),
    O(5, '+', 0, 1)] },
  { insts: [O(6, '+', 0, 1)] },
  { insts: [O(7, 'phi', 4, 2),
    O(8, 'phi', 5, 6),
    O(9, '*', 1, 0),
    O(10, '+', 0, 1)] },
] };
test('a dominating a * b is reused', () => {
  const r = gvn(diamond);
  expect(r[4]).toBe(2);
  expect(r[9]).toBe(2);
});
test('a sibling’s value is not', () => {
  const r = gvn(diamond);
  expect(r[6]).toBe(undefined);
  expect(r[10]).toBe(undefined);
});
test('a phi of one value is that value', () => {
  expect(gvn(diamond)[7]).toBe(2);
  expect(gvn(diamond)[8]).toBe(undefined);
});
test('chains across blocks', () => {
  const r = gvn({ kids: [[1], [2], []],
    blocks: [
      { insts: [P(0), P(1),
        O(2, '*', 0, 1)] },
      { insts: [O(3, '*', 0, 1),
        O(4, '+', 3, 0)] },
      { insts: [O(5, '+', 0, 2)] },
    ] });
  expect(r[3]).toBe(2);
  expect(r[5]).toBe(4);
});
test('two phis with the same args', () => {
  const r = gvn({ kids: [[1, 2, 3],
    [], [], []], blocks: [
    { insts: [P(0), P(1)] },
    { insts: [] }, { insts: [] },
    { insts: [O(7, 'phi', 0, 1),
      O(8, 'phi', 0, 1),
      O(9, 'phi', 1, 0)] },
  ] });
  expect(r[8]).toBe(7);
  expect(r[9]).toBe(undefined);
});
`;

export const exercises = {
  gvn: {
    title: 'Value numbering over the dominator tree',
    prompt: `Write \`gvn(f)\`. \`f.blocks[b].insts\` are block \`b\`'s instructions, each \`{ id, op, args }\` with \`op\` one of \`'param'\`, \`'phi'\` (its args follow the block's predecessors), \`'+'\`, \`'-'\` or \`'*'\`; \`f.kids[b]\` lists \`b\`'s children in the dominator tree, whose root is block 0.

Return an object mapping the id of every redundant instruction to the id that replaces it. Walk the dominator tree depth first; in each block, rename operands through the replacements found so far, then:

- a phi whose (renamed) args are all the same id is replaced by that id;
- otherwise build a key from the op and the renamed args (sorted numerically for \`+\` and \`*\`; a phi's key also includes its block number and keeps its args in order). If a block that dominates this one, or an earlier instruction in this block, already has that key, the instruction is redundant; if not, it becomes the entry for that key in this block and the blocks it dominates.

Parameters are never redundant.`,
    starter: `${G_HEAD}
  return {};
}`,
    solution: G_SOL,
    tests: G_TESTS,
    hints: [
      'Write a recursive `walk(b, outer)`, where `outer` is the table of keys from `b`’s dominators. Make a copy for `b` with `new Map(outer)`, number `b`’s instructions into the copy, then call `walk(c, table)` for each child `c`. Start with `walk(0, new Map())`.',
      'Keep the replacements in an object `rep`, and rename an operand with `rep[a] ?? a`. Inside a block, do exactly what local value numbering does: key, look up, and either record a replacement or add the key.',
      'Two details: check for a phi whose renamed args are all equal *before* building its key, and include the block number in a phi’s key (`\'phi 3 5 6\'`), because phis in different blocks choose between different edges.',
    ],
    walkthrough: `**How to think about it.** Inside one block this is the local value numbering of the last chapter, unchanged. The only new question is which keys a block may see, and the chapter's answer is "those of its dominators", which are exactly the blocks on the path from the root of the dominator tree down to it. A depth-first walk of the tree is always somewhere on such a path, so if each block starts from a copy of its parent's table, adds its own keys to the copy, and hands that copy to its children, every block sees its dominators' keys and nobody else's. Siblings get separate copies, so what \`b1\` adds can never leak into \`b2\`.

**The solution, line by line.**

- \`const COMM = ['+', '*'];\` and \`const byNum = ...\` are the commutative operations and a numeric sort, as before.
- \`const rep = {};\` collects the answer: redundant id to replacement id. It is shared by the whole walk, because a replacement found in \`b1\` must be used wherever \`b1\`'s value is used, including in phis further down.
- \`const vn = (a) => rep[a] ?? a;\` renames an operand to its value number.
- \`const walk = (b, outer) => {\` numbers block \`b\`, given the table \`outer\` built by its dominators.
- \`const table = new Map(outer);\` copies it, so that \`b\`'s additions are visible to \`b\`'s children but not to its siblings. (A real compiler avoids copying with a scoped table, an undo list popped on leaving the block; the copy is the same idea in fewer lines.)
- \`for (const i of f.blocks[b].insts) {\` visits the instructions in order.
- \`if (i.op === 'param') continue;\` parameters are unknown and never redundant.
- \`const args = i.args.map(vn);\` renames the operands first, so keys use value numbers.
- \`const same = args.every((a) => a === args[0]); if (i.op === 'phi' && same) { rep[i.id] = args[0]; continue; }\` a phi that brings the same value along every edge is that value.
- \`const ks = COMM.includes(i.op) ? [...args].sort(byNum) : args;\` sorts a copy for \`+\` and \`*\` only.
- \`const where = i.op === 'phi' ? ' ' + b : '';\` and \`const key = i.op + where + ' ' + ks.join(' ');\` build the key; a phi's includes its block, so \`phi 3 5 6\` only matches another phi in block 3.
- \`if (table.has(key)) { rep[i.id] = table.get(key); } else { table.set(key, i.id); }\` finds a redundant instruction, or makes this one the entry for its key.
- \`for (const c of f.kids[b]) { walk(c, table); }\` visits the children, each starting from this block's table.
- \`walk(0, new Map()); return rep;\` starts at the root with an empty table.

In the diamond, \`b1\` adds \`'+ 0 1'\` to *its* copy; \`b2\` starts again from \`b0\`'s table, so \`%6\` is new; and in \`b3\`, \`%7 = phi %4, %2\` is renamed to \`phi %2, %2\` and replaced by \`%2\`.

**Common wrong attempts.**

- Sharing one table for the whole walk (\`const table = outer;\`): \`b1\`'s \`a + b\` leaks into \`b2\`, and \`%6\` is wrongly replaced by \`%5\`, a value that was never computed on the path through \`b2\`.
- Forgetting the phi rule: \`phi %2, %2\` gets a key and becomes a new value, so \`%7\` is not replaced.
- Sorting a phi's args: \`phi %0, %1\` and \`phi %1, %0\` choose opposite values on the two edges and must stay different.`,
    wrong: [
      {
        code: `${G_HEAD}
  const rep = {};
  const vn = (a) => rep[a] ?? a;
  const walk = (b, outer) => {
    const table = outer;
    for (const i of f.blocks[b].insts) {
      if (i.op === 'param') continue;
      const args = i.args.map(vn);
      const same = args.every(
        (a) => a === args[0]);
      if (i.op === 'phi' && same) {
        rep[i.id] = args[0];
        continue;
      }
      const ks = COMM.includes(i.op)
        ? [...args].sort(byNum) : args;
      const where = i.op === 'phi'
        ? ' ' + b : '';
      const key = i.op + where + ' ' +
        ks.join(' ');
      if (table.has(key)) {
        rep[i.id] = table.get(key);
      } else {
        table.set(key, i.id);
      }
    }
    for (const c of f.kids[b]) {
      walk(c, table);
    }
  };
  walk(0, new Map());
  return rep;
}
`,
        why: 'One shared table: `a + b` from b1 is still in it when b2 is numbered, so `%6` is replaced by `%5`, which the path through b2 never computed.',
      },
      {
        code: `${G_HEAD}
  const rep = {};
  const vn = (a) => rep[a] ?? a;
  const walk = (b, outer) => {
    const table = new Map(outer);
    for (const i of f.blocks[b].insts) {
      if (i.op === 'param') continue;
      const args = i.args.map(vn);
      const ks = COMM.includes(i.op)
        ? [...args].sort(byNum) : args;
      const where = i.op === 'phi'
        ? ' ' + b : '';
      const key = i.op + where + ' ' +
        ks.join(' ');
      if (table.has(key)) {
        rep[i.id] = table.get(key);
      } else {
        table.set(key, i.id);
      }
    }
    for (const c of f.kids[b]) {
      walk(c, table);
    }
  };
  walk(0, new Map());
  return rep;
}
`,
        why: 'Without the phi rule, `phi %2, %2` gets a key of its own and `%7` is never recognised as `%2`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a diamond b0 → {b1, b2} → b3, which block’s values may b3 reuse?',
    options: [
      { t: 'b1’s and b2’s, since b3 comes after both', why: 'Only one of them runs on any path, so neither has certainly run.' },
      { t: 'b0’s', correct: true, why: 'b0 dominates b3: it runs on every path to b3.' },
      { t: 'None: values cannot cross blocks', why: 'That is local value numbering’s limit, which GVN removes.' },
    ],
  },
  {
    q: 'Why does dominator-based value numbering throw away a block’s table scope when the walk leaves it?',
    options: [
      { t: 'To save memory', why: 'It does save memory, but the reason is correctness.' },
      { t: 'Because the next block visited may be a sibling, which the left block does not dominate', correct: true, why: 'A sibling must not see values that its paths never computed.' },
      { t: 'Because SSA values die at the end of their block', why: 'SSA values live on; what changes is which later blocks are certain to have them.' },
      { t: 'Because phis need an empty table', why: 'Phis are numbered with the dominators’ entries like anything else.' },
    ],
  },
  {
    q: 'After renaming, a phi in b3 reads `phi %2, %2`. What does GVN do?',
    options: [
      { t: 'Replaces the phi by `%2`', correct: true, why: 'Both edges bring the same value, so there is nothing to choose.' },
      { t: 'Keeps it, because phis are never redundant', why: 'A phi of one value is the textbook trivial phi.' },
      { t: 'Deletes b3', why: 'The block still runs; only the phi goes.' },
    ],
  },
  {
    q: '`a + b` is computed in both arms of an `if` and again after the join. What does dominator-based GVN do with the third one?',
    options: [
      { t: 'Removes it, using the first arm’s value', why: 'The first arm’s value does not exist on the path through the second arm.' },
      { t: 'Removes it, using a phi of the two', why: 'That would work, but dominator-based GVN does not build it; that is the job of PRE.' },
      { t: 'Folds it to a constant', why: 'Nothing here is constant.' },
      { t: 'Keeps it: neither earlier computation dominates the join', correct: true, why: 'The value is available on every path, from different instructions, which is beyond this method.' },
    ],
  },
  {
    q: 'What makes Alpern, Wegman and Zadeck’s value numbering find equal loop counters that hashing misses?',
    options: [
      { t: 'It runs the loop a few times', why: 'It is a static analysis and runs nothing.' },
      { t: 'It hashes in a different order', why: 'Any order meets a phi before one of its operands, round a cycle.' },
      { t: 'It starts by assuming values computed the same way are equal, and splits them only when shown to differ', correct: true, why: 'An optimistic start, like SCCP’s ⊤, which is what lets self-dependent values be proved equal.' },
    ],
  },
];
