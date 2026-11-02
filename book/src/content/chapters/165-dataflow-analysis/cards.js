// Chapter 165 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dataflow-what': {
    q: 'What are the three parts of a **dataflow analysis**?',
    a: 'A fact per value (or point), a rule per kind of instruction, and a merge where paths meet.',
  },
  'merge-where': {
    q: 'In an SSA-based analysis, where does the merge of facts happen?',
    a: 'At phis: a phi’s rule combines the facts of its operands, one per incoming edge.',
  },
  'sparse': {
    q: 'What makes an analysis **sparse** rather than dense?',
    a: 'It keeps one fact per SSA value and follows def-use links, instead of a fact per block along CFG edges.',
  },
  'lattice-what': {
    q: 'What is a **lattice**, in a dataflow analysis?',
    a: 'An ordered set of facts in which any two facts have a merge: the highest fact below both.',
  },
  'merge-two': {
    q: 'Merge "number" with "maybe-not". What do you get?',
    a: '"maybe-not": if either side might not be a number, the result might not be.',
  },
  'finite-height': {
    q: 'Why must an analysis on a finite-height lattice stop, if facts only move one way?',
    a: 'Each fact can only change a bounded number of times, so eventually nothing changes.',
  },
  'fixpoint-what': {
    q: 'What is a **fixpoint**?',
    a: 'A state where applying every rule once more changes no fact.',
  },
  'why-optimistic': {
    q: 'A loop phi depends on its own back-edge value. Why does a pessimistic start fail to prove it a number?',
    a: 'Each value is "maybe-not" because the other one is: a consistent answer that never improves.',
  },
  'worklist-what': {
    q: 'What is a **worklist**?',
    a: 'The queue of values (or blocks) whose facts may be out of date and must be recomputed.',
  },
  'requeue': {
    q: 'A value’s fact just changed. What goes on the worklist?',
    a: 'The values that use it, since their rules read its fact.',
  },
  'viscosity-rounds': {
    q: 'How does Viscosity’s numeric inference iterate, instead of using a worklist?',
    a: 'In rounds: it reruns every rule each round until a round changes nothing (capped at 1000 rounds; if it never settles, it fails closed).',
  },
};

export const examples = {
  optimistic: {
    title: 'Two starting guesses for a loop',
    code: `// s = 0; loop: s = s + i (i: number)
// v2 = φ(v1, v3), v3 = v2 + i
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

const R_HEAD = `// blocks: { b: { preds: [...],
//   defs: [[name, defId], ...] } }
// Return { b: sorted defIds that
//   reach the start of b }.
function reaching(blocks) {`;

const R_SOL = `${R_HEAD}
  const varOf = {};
  const out = {};
  const inn = {};
  for (const b in blocks) {
    out[b] = [];
    for (const [v, d] of blocks[b].defs)
      varOf[d] = v;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, defs } = blocks[b];
      const s = new Set();
      for (const p of preds)
        for (const d of out[p]) {
          s.add(d);
        }
      inn[b] = [...s].sort();
      const mine = new Set(
        defs.map(([v]) => v));
      const o = inn[b].filter(
        (d) => !mine.has(varOf[d]));
      for (const [, d] of defs) {
        o.push(d);
      }
      o.sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`;

export const exercises = {
  numeric: {
    title: 'An optimistic worklist solver',
    prompt: `Write \`numeric(insts)\`. Each instruction has an \`op\` and a list of \`args\` (ids of other instructions):

- \`'num'\` is a number constant, and \`'str'\` a string constant (no args);
- \`'add'\` is a number only if all its args are;
- \`'phi'\` is a number only if all its args are.

Start optimistic: every fact is \`true\` except \`'str'\`. Put every id on a worklist (a queue). Repeatedly take the first id, recompute its fact from its args, and if it changed, add its **users** to the end of the queue (unless already there). Return the facts when the worklist is empty. Loops are allowed: a phi may use a value defined later.`,
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
    walkthrough: `This is the diagram's solver, and the worklist version of Viscosity's rounds.

- **Optimistic start.** Every fact begins \`true\` except strings. In the counting loop, \`v2 = φ(v1, v4)\` and \`v4 = v2 + v3\` both start as numbers, and neither rule contradicts that, so they stay numbers. Start them at \`false\` and they would stay \`false\` forever, each blaming the other.
- **Users.** When \`v5\` drops to \`false\`, only the instructions that *read* \`v5\` can be affected. Those are the ones to requeue. In the last test the doubt travels \`v5 → v6 → v2 → v3\`, round the back edge.
- **Termination.** A fact only ever goes from \`true\` to \`false\`, never back (an \`every\` over facts that only drop can only drop). So each value changes at most once, and is requeued a bounded number of times.

\`\`\`js
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
\`\`\``,
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
  reaching: {
    optional: true,
    title: 'Reaching definitions',
    prompt: `A classic dense analysis. Each block has \`preds\` and \`defs\`: the assignments it makes, as \`[name, defId]\`, at most one per name. A definition **reaches** the start of block \`b\` if some path to \`b\` passes it and doesn't reassign its name afterwards.

Write \`reaching(blocks)\`, returning for every block the **sorted** list of defIds reaching its start. IN[b] is the union of OUT over b's preds; OUT[b] is IN[b] minus defs of names b assigns, plus b's own defs. Iterate until nothing changes.`,
    starter: `${R_HEAD}
  const inn = {};
  for (const b in blocks) inn[b] = [];
  return inn;
}`,
    solution: R_SOL,
    tests: `test('an if/else diamond', () => {
  expect(reaching({
    b0: { preds: [],
      defs: [['x', 'd1'], ['y', 'd2']] },
    b1: { preds: ['b0'],
      defs: [['x', 'd3']] },
    b2: { preds: ['b0'], defs: [] },
    b3: { preds: ['b1', 'b2'],
      defs: [] },
  })).toEqual({ b0: [],
    b1: ['d1', 'd2'], b2: ['d1', 'd2'],
    b3: ['d1', 'd2', 'd3'] });
});
test('a loop needs a second round', () => {
  expect(reaching({
    b0: { preds: [],
      defs: [['x', 'd1']] },
    b1: { preds: ['b0', 'b2'],
      defs: [] },
    b2: { preds: ['b1'],
      defs: [['x', 'd2']] },
    b3: { preds: ['b1'], defs: [] },
  })).toEqual({ b0: [],
    b1: ['d1', 'd2'], b2: ['d1', 'd2'],
    b3: ['d1', 'd2'] });
});`,
    hints: [
      'Keep OUT for every block, starting empty. Map each defId to its name so you can tell what a block kills.',
      'In each round, recompute IN and OUT for every block. Stop after a round where no OUT changed.',
    ],
    walkthrough: `Reaching definitions answers chapter 161's opening question, "which assignment is this?", without SSA. It is dense: a set of facts per block, flowing along CFG edges.

- **Lattice.** The facts are sets of definitions, ordered by inclusion, and the merge at a join is union. Sets only grow, and there are finitely many definitions, so iteration ends.
- **Transfer.** A block *kills* every incoming definition of a name it assigns, then adds its own (\`gen\`).
- **The loop.** In the first round b1 is visited before b2 has any OUT, so IN[b1] is just \`d1\`. The second round sees \`d2\` arrive along the back edge. A third round changes nothing: the fixpoint.

\`\`\`js
inn[b] = [...s].sort();
const mine = new Set(
  defs.map(([v]) => v));
const o = inn[b].filter(
  (d) => !mine.has(varOf[d]));
for (const [, d] of defs) {
  o.push(d);
}
\`\`\`

SSA makes this whole analysis unnecessary for local variables: each use already names its one definition, and phis mark the joins.`,
    wrong: [
      {
        code: R_SOL.replace('while (changed) {', 'if (changed) {'),
        why: 'One round is not enough with a loop: the definition from the loop body only reaches the header after the back edge has been processed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can’t Viscosity decide whether a loop’s running total is a number by visiting instructions once, in order?',
    options: [
      { t: 'The loop phi depends on a value computed from the phi itself.', correct: true, why: 'The phi needs the back-edge value’s fact, which needs the phi’s fact: a cycle with no first element.' },
      { t: 'Instructions in a loop have no order.', why: 'Instructions have an order in their blocks. The trouble is the dependency cycle through the back edge.' },
      { t: 'Numbers can turn into strings at run time.', why: 'That’s why the question matters, but not why a single pass can’t answer it.' },
    ],
  },
  {
    q: 'A phi has operands with facts "number", "number" and "maybe-not". What is its fact?',
    options: [
      { t: '"number", since most operands are numbers', why: 'Merging is not a vote. One path that may bring a non-number is enough.' },
      { t: 'Unknown until run time', why: 'The analysis must give an answer it can rely on now: the safe one.' },
      { t: '"maybe-not"', correct: true, why: 'The merge is the highest fact below all of them, and that is "maybe-not".' },
    ],
  },
  {
    q: 'What guarantees that the worklist solver for number/maybe-not stops?',
    options: [
      { t: 'The worklist never holds more than one item.', why: 'It can hold many. What matters is how often each value can change.' },
      { t: 'Programs have no infinite loops.', why: 'The analysis doesn’t run the program. It terminates even on programs that loop forever.' },
      { t: 'Each fact can only drop from "number" to "maybe-not", once, and values are only requeued when something changed.', correct: true, why: 'Finite height plus one-way movement bounds the number of changes, so the queue eventually empties.' },
      { t: 'The cap of 1000 rounds.', why: 'Viscosity’s round-based loop has a cap, but a worklist solver on this lattice ends without one.' },
    ],
  },
  {
    q: 'Starting pessimistic, a counting loop’s phi ends up "maybe-not". Starting optimistic, it ends up "number". Which is right?',
    options: [
      { t: 'Pessimistic: assuming less is always more correct.', why: 'Both are consistent, but the pessimistic one throws away a fact that is in fact true.' },
      { t: 'Optimistic: both are fixpoints, and the optimistic one is the most precise.', correct: true, why: 'No rule contradicts "number" for that loop, so the optimistic answer holds and tells you more.' },
      { t: 'Neither: the analysis didn’t reach a fixpoint.', why: 'Both are fixpoints: applying the rules again changes nothing in either.' },
    ],
  },
  {
    q: 'In a worklist solver, value v5’s fact just changed. What should be added to the worklist?',
    options: [
      { t: 'Every value in the program', why: 'That is the round-based approach. A worklist only adds what could be affected.' },
      { t: 'The operands of v5', why: 'Their facts don’t depend on v5. It’s the other way round.' },
      { t: 'Nothing: v5 has been processed', why: 'Values that read v5 may now be wrong, so they must be recomputed.' },
      { t: 'The values that use v5', correct: true, why: 'Only their rules read v5’s fact, so only they can change because of it.' },
    ],
  },
  {
    q: 'In Viscosity’s numeric inference, why does the `param` for `n` in an uncalled `sum(n)` come out "maybe-not"?',
    options: [
      { t: 'Parameters are never numbers.', why: 'Add the call `sum(3)` and the same parameter comes out "number".' },
      { t: 'The `param` rule needs a known call site for every call, and there are none.', correct: true, why: 'The rule checks the argument at every call site of a function only ever called directly. No call sites means no evidence.' },
      { t: 'It isn’t in SSA form.', why: 'Parameters are SSA values in VIR: `%0 = param`.' },
    ],
  },
];
