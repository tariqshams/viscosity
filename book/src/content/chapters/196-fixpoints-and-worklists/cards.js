// Cards for "Fixpoints and worklists" (split from chapter 195). Keys are
// stable ids: never rename them.

export const prompts = {
  'loop-circle': {
    q: 'Why can’t a loop’s dataflow equations be solved in one pass, block after block?',
    a: 'The loop header’s IN needs the body’s OUT, which needs the header’s OUT: a circle with no first block.',
  },
  'fixpoint-what': {
    q: 'What is a **fixpoint** of a set of dataflow equations?',
    a: 'A choice of facts that applying every equation once more leaves unchanged.',
  },
  'start-top': {
    q: 'Why is it safe to start unknown facts at the top of the lattice?',
    a: 'The meet with the top changes nothing, and the equations then lower any fact that is contradicted.',
  },
  'why-optimistic': {
    q: 'A loop phi depends on its own back-edge value. Why does a pessimistic start fail to prove it a number?',
    a: 'Each value stays “maybe not” because the other one is: a consistent answer that never improves.',
  },
  'worklist-what': {
    q: 'What is a **worklist**?',
    a: 'The list of blocks (or values) whose facts may be out of date and must be recomputed.',
  },
  'requeue': {
    q: 'In a forward analysis, block b’s OUT just changed. What goes on the worklist?',
    a: 'b’s successors (unless already there), since their IN is computed from b’s OUT.',
  },
  'finite-height': {
    q: 'Why must a worklist solver on a finite-height lattice stop, if facts only move down?',
    a: 'Each fact can move down only a bounded number of times, and blocks are re-added only after such a move.',
  },
  'viscosity-rounds': {
    q: 'How does Viscosity’s numeric inference iterate, and what happens if it never settles?',
    a: 'In rounds, rerunning every rule until a round changes nothing; after 1000 rounds it gives up every fact (fails closed).',
  },
};

export const examples = {
  optimistic: {
    title: 'Two starting guesses for a loop',
    code: `// s = 0; loop: s = s + i (i: number)
// v2 = φ(v1, v3), v3 = v2 + i
// true means "is a number".
function solve(start) {
  let v2 = start;
  let v3 = start;
  for (let r = 0; r < 5; r++) {
    v2 = true && v3; // φ(v1, v3)
    v3 = v2 && true; // v2 + i
  }
  return v2;
}
console.log('optimistic', solve(true));
console.log('pessimistic',
  solve(false));`,
  },
};

const S_HEAD = `// p: { blocks, preds, succs, entry,
//   start, top, meet(a, b),
//   transfer(b, f), same(a, b) }
// Return { inn, out } at a fixpoint.
function solve(p) {`;

const S_SOL = `${S_HEAD}
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    out[b] = p.top;
  }
  const work = [...p.blocks];
  while (work.length > 0) {
    const b = work.shift();
    let f = b === p.entry
      ? p.start : p.top;
    for (const q of p.preds[b]) {
      f = p.meet(f, out[q]);
    }
    inn[b] = f;
    const o = p.transfer(b, f);
    if (p.same(o, out[b])) continue;
    out[b] = o;
    for (const s of p.succs[b]) {
      if (!work.includes(s)) {
        work.push(s);
      }
    }
  }
  return { inn, out };
}`;

const N_HEAD = `// insts: { id: { op, args } }
// op: 'num' | 'str' | 'add' | 'phi'
// Return { id: true if a number }.
function numeric(insts) {`;

const N_SOL = `${N_HEAD}
  const users = {};
  const fact = {};
  for (const id in insts) {
    const { op, args } = insts[id];
    fact[id] = op !== 'str';
    for (const a of args) {
      (users[a] ??= []).push(id);
    }
  }
  const work = Object.keys(insts);
  while (work.length) {
    const id = work.shift();
    const { op, args } = insts[id];
    if (op === 'num') continue;
    if (op === 'str') continue;
    const f = args.every(
      (a) => fact[a]);
    if (f === fact[id]) continue;
    fact[id] = f;
    for (const u of users[id] ?? []) {
      if (!work.includes(u)) {
        work.push(u);
      }
    }
  }
  return fact;
}`;

export const exercises = {
  solver: {
    title: 'A worklist solver for any forward analysis',
    prompt: `Write \`solve(p)\`, a worklist solver for a **forward** dataflow analysis. \`p\` describes the CFG and the analysis:

- \`blocks\` (all block names), \`preds\` and \`succs\` (each maps a block to a list of blocks), and \`entry\`;
- \`start\`, the fact at the start of the entry, and \`top\`, the starting guess for every OUT (the meet leaves it alone);
- \`meet(a, b)\`, \`transfer(b, f)\` (block b’s OUT, given its IN \`f\`) and \`same(a, b)\` (are two facts equal?).

Put every block on a worklist. Take blocks off the front: IN is the meet of the predecessors’ OUT (starting from \`start\` for the entry and \`top\` otherwise), OUT is the transfer of IN. Only if OUT changed, store it and add the block’s successors to the back of the list (unless already there). Return \`{ inn, out }\`.`,
    starter: `${S_HEAD}
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    inn[b] = p.top;
    out[b] = p.top;
  }
  return { inn, out };
}`,
    solution: S_SOL,
    tests: `const uni = (a, b) =>
  [...new Set([...a, ...b])].sort();
const inter = (a, b) =>
  a.filter((v) => b.includes(v));
const A = { b0: ['i', 'x'], b1: [],
  b2: ['i', 'x', 'y'], b3: [] };
const loop = (meet, top) => ({
  blocks: ['b0', 'b1', 'b2', 'b3'],
  preds: { b0: [], b1: ['b0', 'b2'],
    b2: ['b1'], b3: ['b1'] },
  succs: { b0: ['b1'],
    b1: ['b2', 'b3'], b2: ['b1'],
    b3: [] },
  entry: 'b0', start: [], top, meet,
  transfer: (b, f) => uni(f, A[b]),
  same: (a, b) => a.join() === b.join(),
});
test('definitely assigned (must)', () => {
  const r = solve(loop(inter,
    ['i', 'x', 'y']));
  expect(r.inn.b3).toEqual(['i', 'x']);
  expect(r.inn.b1).toEqual(['i', 'x']);
});
test('maybe assigned (may)', () => {
  const r = solve(loop(uni, []));
  expect(r.inn.b1)
    .toEqual(['i', 'x', 'y']);
  expect(r.inn.b3)
    .toEqual(['i', 'x', 'y']);
});
test('a straight line', () => {
  const r = solve({
    blocks: ['a', 'b'],
    preds: { a: [], b: ['a'] },
    succs: { a: ['b'], b: [] },
    entry: 'a', start: 0, top: 99,
    meet: Math.min,
    transfer: (b, f) => f + 1,
    same: (x, y) => x === y,
  });
  expect(r.out).toEqual({ a: 1, b: 2 });
});`,
    hints: [
      'Start every `out[b]` at `p.top` and put every block on the list: `const work = [...p.blocks];`. Loop while the list is not empty, taking blocks off with `work.shift()`.',
      'For IN, start from `p.start` if the block is the entry and `p.top` otherwise, then fold in each predecessor with `f = p.meet(f, out[q])`.',
      'Compute `o = p.transfer(b, f)`. If `p.same(o, out[b])`, nothing downstream can change: `continue`. Otherwise store it and push each successor that is not already on the list.',
    ],
    walkthrough: `**How to think about it.** The solver does not know or care what the facts are: sets of variables, numbers, anything. All it needs is the CFG, a starting guess (\`top\`), and the three operations. So write the loop from the chapter, and call \`p.meet\`, \`p.transfer\` and \`p.same\` wherever the chapter's code did a set operation. The tests run it twice on the same loop: once as a "must" analysis (meet is intersection, top is every variable) and once as a "may" analysis (meet is union, top is the empty set, which union leaves alone). The may version is the one that needs the back edge: b1 only learns that \`y\` may be assigned after b2 has been processed, so b1 must go back on the list.

**The solution, line by line.**

- \`const inn = {}; const out = {};\` hold the facts by block name.
- \`for (const b of p.blocks) { out[b] = p.top; }\` is the optimistic guess: every OUT starts at the top.
- \`const work = [...p.blocks];\` puts every block on the worklist (a copy, so we don't change \`p.blocks\`).
- \`while (work.length > 0) {\` runs until the list is empty, which is when we are at a fixpoint.
- \`const b = work.shift();\` takes the first block off the front.
- \`let f = b === p.entry ? p.start : p.top;\` starts the meet: the entry has its own starting fact, and every other block starts from the top, which the meet leaves alone.
- \`for (const q of p.preds[b]) { f = p.meet(f, out[q]); }\` folds in each predecessor's OUT; in the must test, at b1 this is \`['i','x']\` met with the guess \`['i','x','y']\`.
- \`inn[b] = f;\` records IN.
- \`const o = p.transfer(b, f);\` computes the new OUT.
- \`if (p.same(o, out[b])) continue;\` If OUT did not change, no successor can be affected, so move on. This line is what makes the loop end.
- \`out[b] = o;\` stores the new OUT.
- \`for (const s of p.succs[b]) { if (!work.includes(s)) { work.push(s); } }\` puts every successor back on the list (once), because their IN is computed from this OUT.
- \`return { inn, out };\` returns the fixpoint.

In the may test, the first visit to b1 gives IN \`['i','x']\`. Then b2 changes its OUT from \`[]\` to \`['i','x','y']\` and puts b1 back on the list; b1's second visit gives \`['i','x','y']\`, which puts b2 and b3 back; b2 doesn't change, and b3 picks up \`y\`.

**Common wrong attempts.**

- Never putting successors back on the list: each block is visited once, and in the may test b1 never hears about b2's \`y\`.
- Comparing facts with \`===\` instead of \`p.same\`: two arrays with the same contents are different objects, so every block always looks changed and the successors are re-added for ever (or until something else stops it).
- Starting IN from \`out[preds[0]]\` and ignoring \`p.start\`: the entry has no predecessors, and \`undefined\` reaches the transfer function.`,
    wrong: [
      {
        code: S_SOL.replace(`    for (const s of p.succs[b]) {
      if (!work.includes(s)) {
        work.push(s);
      }
    }
`, ''),
        why: 'Each block is visited once. In the may test, b1 was visited before b2, so it never learns that y may arrive along the back edge.',
      },
      {
        code: S_SOL.replace(`    let f = b === p.entry
      ? p.start : p.top;`, `    let f = p.top;`),
        why: 'The entry starts from the top instead of `start`. In the must test, that claims i, x and y are all assigned before the function has run.',
      },
    ],
  },
  numeric: {
    optional: true,
    title: 'An optimistic worklist over SSA values',
    prompt: `The sparse version: facts belong to SSA values, and a changed value puts its **users** back on the list. Write \`numeric(insts)\`. Each instruction has an \`op\` and a list of \`args\` (ids of other instructions):

- \`'num'\` is a number constant, and \`'str'\` a string constant (no args);
- \`'add'\` is a number only if all its args are;
- \`'phi'\` is a number only if all its args are.

Start optimistic: every fact is \`true\` except \`'str'\`. Put every id on a worklist. Repeatedly take the first id, recompute its fact from its args, and if it changed, add its users to the end of the list (unless already there). Return the facts. Loops are allowed: a phi may use a value defined later.`,
    starter: `${N_HEAD}
  const fact = {};
  for (const id in insts) {
    fact[id] = insts[id].op === 'num';
  }
  return fact;
}`,
    solution: N_SOL,
    tests: `const I = (op, ...args) =>
  ({ op, args });
test('straight-line', () => {
  expect(numeric({
    a: I('num'), b: I('num'),
    c: I('add', 'a', 'b'),
  })).toEqual({ a: true, b: true,
    c: true });
});
test('a string poisons a sum', () => {
  expect(numeric({
    a: I('num'), s: I('str'),
    c: I('add', 'a', 's'),
  }).c).toBe(false);
});
test('a counting loop', () => {
  const f = numeric({
    v1: I('num'),
    v2: I('phi', 'v1', 'v4'),
    v3: I('num'),
    v4: I('add', 'v2', 'v3'),
  });
  expect(f.v2).toBe(true);
  expect(f.v4).toBe(true);
});
test('doubt goes round the loop', () => {
  const f = numeric({
    v1: I('num'),
    v2: I('phi', 'v1', 'v6'),
    v3: I('add', 'v2', 'v1'),
    v4: I('str'),
    v5: I('phi', 'v3', 'v4'),
    v6: I('add', 'v5', 'v1'),
  });
  expect(f).toEqual({ v1: true,
    v2: false, v3: false, v4: false,
    v5: false, v6: false });
});`,
    hints: [
      'First build `users`: for every instruction and every arg `a`, record that this instruction uses `a`.',
      'The worklist is an array: `work.shift()` takes from the front, `work.push(u)` adds to the back.',
      'Only when a fact actually changes do you push its users. That is what makes the loop end.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's sparse stepper as code, and the worklist version of Viscosity's rounds. Three ideas carry it. Start optimistic, so that a loop whose values only feed each other stays "number" unless something contradicts it. Record, for every value, which instructions *use* it, because those are the only ones whose facts can change when it changes. And only requeue after a real change, so the list runs dry.

**The solution, line by line.**

- \`const users = {}; const fact = {};\` hold, for each id, who reads it, and its current fact.
- \`for (const id in insts) {\` visits every instruction once to set things up.
- \`const { op, args } = insts[id];\` takes out its kind and operands.
- \`fact[id] = op !== 'str';\` is the optimistic start: everything is a number except a string constant.
- \`for (const a of args) { (users[a] ??= []).push(id); }\` records that \`id\` uses each of its operands (\`??=\` creates the list the first time).
- \`const work = Object.keys(insts);\` puts every id on the worklist.
- \`while (work.length) {\` runs until it is empty.
- \`const id = work.shift();\` takes the first id.
- \`if (op === 'num') continue; if (op === 'str') continue;\` Constants never change.
- \`const f = args.every((a) => fact[a]);\` is the rule for both \`add\` and \`phi\`: a number only if every operand is.
- \`if (f === fact[id]) continue;\` No change, nothing to tell anyone.
- \`fact[id] = f;\` stores the new fact.
- \`for (const u of users[id] ?? []) { if (!work.includes(u)) { work.push(u); } }\` puts every user back on the list, once.
- \`return fact;\`

In the last test the doubt travels \`v5 → v6 → v2 → v3\`, round the back edge. A fact only ever goes from \`true\` to \`false\`, never back, so each value changes at most once, and the list must empty.

**Common wrong attempts.**

- Starting pessimistic (only constants are numbers): in the counting loop, the phi and the sum each wait for the other, and neither is ever proven a number.
- Not requeueing users: when v6 changes, the loop phi v2 has already been processed and stays wrongly \`true\`.`,
    wrong: [
      {
        code: N_SOL.replace("fact[id] = op !== 'str';", "fact[id] = op === 'num';"),
        why: 'This starts pessimistic: the loop phi and the sum each wait for the other to become a number, so the counting loop is never proven numeric.',
      },
      {
        code: N_SOL.replace(`    for (const u of users[id] ?? []) {
      if (!work.includes(u)) {
        work.push(u);
      }
    }
`, ''),
        why: 'Without requeueing users, each value is visited once. When v6 changes, the loop phi v2 has already been processed and stays wrongly `true`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can’t “definitely assigned” be solved in a single pass on a CFG with a loop?',
    options: [
      { t: 'Loops have no basic blocks.', why: 'A loop is made of ordinary blocks; the trouble is how they depend on each other.' },
      { t: 'The loop header’s IN depends on the body’s OUT, which depends on the header’s OUT.', correct: true, why: 'The back edge makes a cycle, so no order visits every block after all its predecessors.' },
      { t: 'The loop might run for ever.', why: 'The analysis never runs the loop. It stops even when the program would not.' },
    ],
  },
  {
    q: 'Starting pessimistic, a counting loop’s phi ends up “maybe not a number”. Starting optimistic, it ends up “number”. Which is right?',
    options: [
      { t: 'Pessimistic: assuming less is always more correct.', why: 'Both are consistent, but the pessimistic one throws away a fact that is in fact true.' },
      { t: 'Neither: the analysis didn’t reach a fixpoint.', why: 'Both are fixpoints: applying the rules again changes nothing in either.' },
      { t: 'Optimistic: both are fixpoints, and the optimistic one is the most precise.', correct: true, why: 'No rule contradicts “number” for that loop, so the optimistic answer holds and tells you more.' },
    ],
  },
  {
    q: 'In a forward worklist solver, block b’s OUT just changed. What should be added to the worklist?',
    options: [
      { t: 'b’s successors', correct: true, why: 'Their IN is the meet of their predecessors’ OUT, which now includes b’s new fact.' },
      { t: 'b’s predecessors', why: 'Their facts don’t depend on b in a forward analysis; that is the backward case.' },
      { t: 'Every block in the function', why: 'That is the round-based approach. A worklist adds only what could be affected.' },
      { t: 'Nothing: b has been processed', why: 'Blocks that read b’s OUT may now be wrong, so they must be recomputed.' },
    ],
  },
  {
    q: 'What guarantees that a worklist solver for “definitely assigned” stops?',
    options: [
      { t: 'The worklist never holds more than one block.', why: 'It can hold many. What matters is how often each fact can change.' },
      { t: 'Programs have no infinite loops.', why: 'The analysis doesn’t run the program; it ends even on programs that loop for ever.' },
      { t: 'The cap of 1000 rounds.', why: 'That cap is Viscosity’s safety net for its round-based loop; a worklist on this lattice ends without one.' },
      { t: 'Sets only lose variables, there are finitely many variables, and blocks are re-added only after a change.', correct: true, why: 'Finite height plus one-way movement bounds the number of changes, so the list empties.' },
    ],
  },
  {
    q: 'What does Viscosity do if its numeric inference has not settled after 1000 rounds?',
    options: [
      { t: 'Keeps the facts from the last round.', why: 'An unsettled answer might still contain a wrong optimistic guess.' },
      { t: 'Runs another 1000 rounds.', why: 'It stops at the cap.' },
      { t: 'Marks every fact as not proven, so nothing is transformed on its strength.', correct: true, why: 'It fails closed: a missed optimization is slow, a wrong one is a bug.' },
    ],
  },
];
