// Chapter 107 cards. Keys are stable ids: never rename them.

export const prompts = {
  'assign-no-inst': {
    q: 'What does VIR’s builder emit for the assignment `x = y` (both SSA locals)?',
    a: 'Nothing. It only records, in the current block’s table, that x now holds y’s value.',
  },
  'one-pred': {
    q: 'A sealed block with one predecessor has no definition of `x`. What does `readVariable` return?',
    a: 'Whatever `x` is at the end of that predecessor (it asks there).',
  },
  'phi-first': {
    q: 'Why does the builder record a new phi as the variable’s value *before* reading the operands?',
    a: 'In a loop the search can come back to this block. It then finds the phi and stops, instead of recursing forever.',
  },
  'cache': {
    q: 'Why does `readVariableRecursive` end with `writeVariable(v, block, val)`?',
    a: 'To cache the answer, so the next read of v in that block is a direct look-up.',
  },
  'sealed-what': {
    q: 'When is a block **sealed**?',
    a: 'Once all of its predecessors are known, so no more edges into it will be added.',
  },
  'unsealed-read': {
    q: 'What happens when you read a variable in an unsealed block that doesn’t define it?',
    a: 'The builder makes an empty, incomplete phi, remembers it, and fills in its operands when the block is sealed.',
  },
  'seal-when': {
    q: 'When does VIR’s front end seal a loop header?',
    a: 'Right after emitting the back edge from the end of the loop.',
  },
  'trivial-what': {
    q: 'What makes a phi **trivial**?',
    a: 'Apart from itself, all its operands are one value. It always means that value.',
  },
  'trivial-cascade': {
    q: 'After removing a trivial phi, why retry the phis that used it?',
    a: 'Replacing it may leave one of them with only one distinct value, so it becomes trivial too.',
  },
  'missing-id': {
    q: 'A VIR listing jumps from `%4` to `%6`. What probably happened to `%5`?',
    a: 'It was a trivial phi, removed during construction. Its id stays as a dead entry in the value list.',
  },
  'frontier': {
    q: 'In the classic algorithm, where are the phis for a variable defined in block B placed?',
    a: 'In B’s dominance frontier: the first blocks that B does not strictly dominate (and, repeatedly, the frontiers of those phis).',
  },
};

export const examples = {
  trivial: {
    title: 'Is this phi trivial?',
    code: `// Returns the one value the phi always
// means, or null if it really merges.
function trivial(id, args) {
  let same = null;
  for (const op of args) {
    if (op === same || op === id) {
      continue;
    }
    if (same !== null) return null;
    same = op;
  }
  return same;
}
const t = trivial;
console.log(t('%5', ['%2', '%2']));
console.log(t('%4', ['%0', '%4']));
console.log(t('%3', ['%2', '%10']));`,
  },
};

const T_HEAD = `// phis: { id: [operand, ...] }
// Return { id: replacement } for
// every phi (its own id if it stays).
function removeTrivial(phis) {`;

const R_HEAD = `// preds: { block: [pred, ...] }
// defs: { block: { name: value } }
function readVar(v, b, preds, defs) {`;

const SOL = `${T_HEAD}
  const rep = {};
  for (const p in phis) rep[p] = p;
  const find = (v) =>
    v in rep && rep[v] !== v
      ? find(rep[v]) : v;
  let changed = true;
  while (changed) {
    changed = false;
    for (const p in phis) {
      if (rep[p] !== p) continue;
      const ops = new Set(
        phis[p].map(find));
      ops.delete(p);
      if (ops.size > 1) continue;
      rep[p] = ops.size
        ? [...ops][0] : 'undef';
      changed = true;
    }
  }
  const out = {};
  for (const p in phis) {
    out[p] = find(p);
  }
  return out;
}`;

export const exercises = {
  'remove-trivial': {
    title: 'Remove trivial phis',
    prompt: `Write \`removeTrivial(phis)\`. \`phis\` maps each phi's id to its list of operands; an operand is either another phi's id or some other value (any string). A phi is **trivial** when, apart from itself, its operands are all one value. Replace trivial phis by that value, repeatedly, until no phi is trivial. A phi whose only operand is itself becomes \`'undef'\`.

Return an object giving, for every phi, what it finally stands for: a non-phi value, \`'undef'\`, or its own id if it really merges two values. Operands must be looked up through earlier replacements.`,
    starter: `${T_HEAD}
  const out = {};
  for (const p in phis) out[p] = p;
  return out;
}`,
    solution: SOL,
    tests: `test('same value twice', () => {
  expect(removeTrivial({
    p1: ['x', 'x'],
  })).toEqual({ p1: 'x' });
});
test('itself and one value', () => {
  expect(removeTrivial({
    p1: ['x', 'p1'],
  })).toEqual({ p1: 'x' });
});
test('a real merge stays', () => {
  expect(removeTrivial({
    p1: ['x', 'y'],
  })).toEqual({ p1: 'p1' });
});
test('a cascade, in any order', () => {
  expect(removeTrivial({
    p2: ['p1', 'x'],
    p1: ['x', 'p1'],
  })).toEqual({ p1: 'x', p2: 'x' });
});
test('a cycle of phis', () => {
  expect(removeTrivial({
    p1: ['x', 'p2'],
    p2: ['p1', 'p1'],
  })).toEqual({ p1: 'x', p2: 'x' });
});
test('only itself', () => {
  expect(removeTrivial({
    p1: ['p1'],
  })).toEqual({ p1: 'undef' });
});`,
    hints: [
      'Keep `rep`: what each phi has been replaced by (initially itself). Write a `find(v)` that follows `rep` until it reaches something that maps to itself, or isn’t a phi.',
      'For a live phi, collect its operands through `find` into a Set and delete the phi’s own id. Size 0 means `undef`; size 1 means trivial.',
      'One sweep isn’t enough: a phi checked early may become trivial after a later one is removed. Repeat until a sweep changes nothing.',
    ],
    walkthrough: `This is \`tryRemoveTrivialPhi\` from \`builder.ts\`, with the IR replaced by a table.

- **\`rep\` and \`find\`.** Instead of rewriting every use of a removed phi, record what it was replaced by, and look operands up through that record. \`find\` follows chains: in the cascade, \`p2\` sees \`p1\`, which now means \`x\`.
- **Ignore yourself.** \`p1 = φ(x, p1)\` is a loop header phi for a variable the loop never changes. Coming round the back edge it gets its own value back, so it is always \`x\`.
- **Repeat.** In the cascade test \`p2\` is checked first, when it still merges \`p1\` and \`x\`. Only after \`p1\` is replaced does \`p2\` turn out to be \`φ(x, x)\`. The real builder handles this by retrying the users of each removed phi; repeating whole sweeps until nothing changes reaches the same answer.
- **\`'undef'\`.** A phi with no operand but itself is in code where the variable was never given a value. The builder turns it into \`const undefined\`.

\`\`\`js
while (changed) {
  changed = false;
  for (const p in phis) {
    if (rep[p] !== p) continue;
    const ops = new Set(
      phis[p].map(find));
    ops.delete(p);
    if (ops.size > 1) continue;
    rep[p] = ops.size
      ? [...ops][0] : 'undef';
    changed = true;
  }
}
\`\`\`

The loop must end: every pass that sets \`changed\` removes a phi for good, and there are only so many phis.`,
    wrong: [
      {
        code: SOL.replace('while (changed) {', 'if (changed) {'),
        why: 'One sweep misses cascades: `p2` is checked while `p1` still looks like a real value, and is never looked at again.',
      },
      {
        code: SOL.replace(`      const ops = new Set(
        phis[p].map(find));`, `      const ops = new Set(phis[p]);`),
        why: 'The operands are not looked up through earlier replacements, so `p2` keeps seeing `p1` as a separate value from `x`.',
      },
    ],
  },
  'read-var': {
    optional: true,
    title: 'readVariable on a finished CFG',
    prompt: `Write \`readVar(v, b, preds, defs)\` for an **acyclic** CFG whose blocks are all sealed. If block \`b\` defines \`v\` in \`defs[b]\`, return that value. Otherwise, with no predecessors, return \`'undef'\`; with one, ask it; with several, ask each one in order. If they all give the same answer, return it (no phi needed); if not, return the string \`'phi(' + answers.join(',') + ')'\`.`,
    starter: `${R_HEAD}
  return defs[b][v];
}`,
    solution: `${R_HEAD}
  if (v in defs[b]) return defs[b][v];
  const ps = preds[b];
  if (ps.length === 0) return 'undef';
  const vals = ps.map((p) =>
    readVar(v, p, preds, defs));
  if (vals.every((x) => x === vals[0]))
    return vals[0];
  return 'phi(' + vals.join(',') + ')';
}`,
    tests: `const preds = {
  b0: [], b1: ['b0'], b2: ['b0'],
  b3: ['b1', 'b2'],
};
const defs = {
  b0: { x: '1', y: '5' },
  b1: { x: '2' }, b2: {}, b3: {},
};
test('defined here', () => {
  expect(readVar('x', 'b0', preds, defs))
    .toBe('1');
});
test('through one predecessor', () => {
  expect(readVar('y', 'b1', preds, defs))
    .toBe('5');
});
test('a join that disagrees', () => {
  expect(readVar('x', 'b3', preds, defs))
    .toBe('phi(2,1)');
});
test('a join that agrees', () => {
  expect(readVar('y', 'b3', preds, defs))
    .toBe('5');
});
test('never assigned', () => {
  expect(readVar('z', 'b3', preds, defs))
    .toBe('undef');
});`,
    hints: [
      'Check `defs[b]` first. If `v` isn’t there, look at `preds[b]`.',
      'Recurse into every predecessor with `map`. Compare all the answers with the first one.',
    ],
    walkthrough: `This is \`readVariableRecursive\` for the easy case: every block sealed, and no loops, so the recursion always reaches the entry.

- The **one-predecessor** case is just the general case with a single answer, which always "agrees".
- The **agree** test is trivial-phi removal done on the spot: y's phi at the join would be \`φ(5, 5)\`, so you return \`5\` and never make it. This is the \`%5\` that vanished from the chapter's VIR.
- With loops you'd also need the "record the phi first" trick, or \`readVar\` would chase the back edge forever.

\`\`\`js
if (v in defs[b]) return defs[b][v];
const ps = preds[b];
if (ps.length === 0) return 'undef';
const vals = ps.map((p) =>
  readVar(v, p, preds, defs));
if (vals.every((x) => x === vals[0]))
  return vals[0];
return 'phi(' + vals.join(',') + ')';
\`\`\``,
    wrong: [
      {
        code: `${R_HEAD}
  if (v in defs[b]) return defs[b][v];
  const ps = preds[b];
  if (ps.length === 0) return 'undef';
  if (ps.length === 1)
    return readVar(
      v, ps[0], preds, defs);
  const vals = ps.map((p) =>
    readVar(v, p, preds, defs));
  return 'phi(' + vals.join(',') + ')';
}`,
        why: 'This always makes a phi at a join, even when both sides give 5. That is exactly the trivial phi the builder removes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'While lowering `x = 2;`, what does VIR’s builder do for the assignment itself?',
    options: [
      { t: 'Emits a `store x` instruction', why: '`store` is only for bindings (captured variables). An SSA local has no storage to write to.' },
      { t: 'Records in the current block’s table that `x` is the `const 2`', correct: true, why: '`writeVariable` only updates the table. The `const 2` is the only instruction.' },
      { t: 'Creates a phi for `x`', why: 'Phis are made by reads at joins, not by writes.' },
    ],
  },
  {
    q: 'Why is a loop header unsealed while the builder lowers the loop test?',
    options: [
      { t: 'Its only predecessor is the entry block.', why: 'If that were all, it could be sealed. The point is that one more predecessor is still coming.' },
      { t: 'Phis may not be placed in loop headers.', why: 'Loop headers are exactly where loop phis go.' },
      { t: 'The test contains a comparison.', why: 'What’s inside the block doesn’t matter. Sealing is about knowing all the incoming edges.' },
      { t: 'The back edge from the end of the body hasn’t been built yet.', correct: true, why: 'Until the body is lowered, the header doesn’t know all its predecessors, so reads there make incomplete phis.' },
    ],
  },
  {
    q: 'What does `seal(b)` do with b’s incomplete phis?',
    options: [
      { t: 'Reads the variable at the end of each predecessor to fill in the operands, then tries to remove the phi as trivial', correct: true, why: 'That is `addPhiOperands`: one read per predecessor, then `tryRemoveTrivialPhi`.' },
      { t: 'Deletes them, since the block is finished', why: 'Many of them are needed: the loop counter’s phi survives sealing.' },
      { t: 'Turns them into `const undefined`', why: 'Only a phi with no operand except itself becomes `undefined`.' },
    ],
  },
  {
    q: 'Which of these phis is trivial?',
    options: [
      { t: '`%3 = φ(%2, %10)`', why: 'Two different values: this is a real merge (a loop counter).' },
      { t: '`%6 = φ(%1, %7)`', why: 'Also a real merge: the starting sum and the updated sum.' },
      { t: '`%4 = φ(%0, %4)`', correct: true, why: 'Apart from itself it only ever has `%0`, so it always means `%0`.' },
      { t: 'None: a phi with two operands is never trivial', why: 'The number of operands doesn’t matter. What counts is how many distinct values besides the phi itself.' },
    ],
  },
  {
    q: 'Why does the builder record a new phi as the variable’s value before reading its operands?',
    options: [
      { t: 'So that printing the IR shows the phi first', why: 'The order of the printout is unrelated. This is about the recursive search.' },
      { t: 'So a search that comes round a loop back to this block stops at the phi', correct: true, why: 'Otherwise reading round a cycle would recurse forever. Recording it first breaks the cycle.' },
      { t: 'So the phi is never removed as trivial', why: 'Recording it doesn’t protect it: a trivial phi is still removed afterwards.' },
    ],
  },
  {
    q: 'How does the dominance-frontier approach differ from Braun’s?',
    options: [
      { t: 'It produces programs that are not in SSA form.', why: 'Both produce SSA. They differ in how they get there.' },
      { t: 'It never places phis in loop headers.', why: 'Loop headers are in the dominance frontier of blocks in the loop body, so they get phis.' },
      { t: 'It needs no dominator tree.', why: 'It is the one that does: the frontiers come from dominators.' },
      { t: 'It works on a finished CFG, placing phis from the dominator tree, then renames in a second walk.', correct: true, why: 'Braun’s method works while the IR is still being generated, with no dominator tree.' },
    ],
  },
];
