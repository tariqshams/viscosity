// Cards for "Phi nodes" (split from chapter 163). Keys are stable ids.

export const prompts = {
  'why-phi': {
    q: 'After an `if` whose branches define `x2` and `x3`, why can no single name go in `y = ? + 3`?',
    a: 'Which version is right depends on which branch ran, and that is only known at run time.',
  },
  'phi-what': {
    q: 'What does a **phi node** do?',
    a: 'At the start of a join block, it picks the value of the operand that matches the edge control arrived on.',
  },
  'phi-operands': {
    q: 'How many operands does a phi have?',
    a: 'One per predecessor of its block, in predecessor order.',
  },
  'phi-not-real': {
    q: 'Do phis survive into machine code?',
    a: 'No. Before code generation they are replaced by copies at the ends of the predecessor blocks.',
  },
  'vir-phi-order': {
    q: 'In VIR, `b3: ; preds b1 b2` begins with `%4 = phi %2, %3`. Which operand is used when control comes from b1?',
    a: '`%2`, the first: operands follow the order of the `preds` list.',
  },
  'loop-phi': {
    q: 'Why may a loop header’s phi use a value defined later in the listing?',
    a: 'That operand is only read when control arrives along the back edge, after the defining block has run.',
  },
  'phis-together': {
    q: 'A block starts with two phis. Can the second one see the first one’s new value?',
    a: 'No. All of a block’s phis take their values at the same moment, as control crosses the edge.',
  },
  'swap-copies': {
    q: 'Why is `p2 = q2; q2 = p2;` a wrong way to remove the phis `p2 = φ(…, q2)` and `q2 = φ(…, p2)`?',
    a: 'The second copy reads the new `p2`, so both end up equal; the phis meant “all at once”, so the copies must be ordered carefully or use a temporary.',
  },
};

export const examples = {
  'phi-by-hand': {
    title: 'A phi, written by hand',
    code: `function f(a0) {
  const x1 = a0 + 1;
  let x2, x3, from;
  if (x1 > 5) {
    x2 = x1 * 2;
    from = 'B1';
  } else {
    x3 = 0;
    from = 'B2';
  }
  // x4 = φ(x2, x3): pick by edge
  const x4 = from === 'B1' ? x2 : x3;
  return x4 + 3;
}
console.log(f(9), f(1));`,
  },
};

const E_HEAD = `// phis: [[dst, [op0, op1, ...]], ...]
// env: name -> value. k: the edge.
function enter(phis, env, k) {`;

export const exercises = {
  'enter-block': {
    title: 'All phis at once',
    prompt: `Write \`enter(phis, env, k)\`: control enters a block along predecessor edge \`k\`. \`phis\` is the block's list of \`[dst, operands]\`, and \`env\` maps names to current values. Return a **new** env in which every phi's \`dst\` holds the value of its \`k\`-th operand. All phis must read the env as it was *before* any of them ran. Don't change \`env\`.`,
    starter: `${E_HEAD}
  return env;
}`,
    solution: `${E_HEAD}
  const out = { ...env };
  for (const [d, ops] of phis) {
    out[d] = env[ops[k]];
  }
  return out;
}`,
    tests: `test('one phi, each edge', () => {
  const ps = [['x4', ['x2', 'x3']]];
  const env = { x2: 20, x3: 0 };
  expect(enter(ps, env, 0).x4)
    .toBe(20);
  expect(enter(ps, env, 1).x4)
    .toBe(0);
});
test('a swap in a loop header', () => {
  const ps = [
    ['p2', ['p0', 'q2']],
    ['q2', ['q0', 'p2']],
  ];
  const env = { p2: 1, q2: 2 };
  const out = enter(ps, env, 1);
  expect(out.p2).toBe(2);
  expect(out.q2).toBe(1);
});
test('env is not changed', () => {
  const ps = [['x4', ['x2', 'x3']]];
  const env = { x2: 20, x3: 0 };
  enter(ps, env, 0);
  expect(env.x4).toBe(undefined);
});`,
    hints: [
      'Start from the swap test: what must `p2` and `q2` hold after entering along edge 1? Which values must be read before anything is written?',
      'Keep two objects: the old `env`, which you only read, and a new `out`, which you only write. `{ ...env }` makes the copy.',
      'For each `[d, ops]` in `phis`, set `out[d] = env[ops[k]]`: the k-th operand, read from the old env.',
    ],
    walkthrough: `**How to think about it.** Entering a block along edge \`k\` means: every phi picks its \`k\`-th operand. The only subtle part is *when* each phi reads its operand, and the swap test settles it. With \`p2 = φ(p0, q2)\` and \`q2 = φ(q0, p2)\` and the old values \`p2 = 1\`, \`q2 = 2\`, entering along edge 1 must give \`p2 = 2\` (the old \`q2\`) and \`q2 = 1\` (the old \`p2\`). If the phis ran one after the other, writing as they go, the second would read the first one's *new* value. So read everything from the old state, and write everything into a new one.

**The solution, line by line.**

- \`function enter(phis, env, k) {\` takes the block's phis, the current values and the edge number.
- \`const out = { ...env };\` makes a new object with all of \`env\`'s entries (\`...\` spreads them in), so values the phis do not touch carry over, and \`env\` itself is never changed.
- \`for (const [d, ops] of phis) {\` visits each phi, unpacking its destination \`d\` and its operand list \`ops\`.
- \`out[d] = env[ops[k]];\` picks the \`k\`-th operand's *name*, looks its value up in the **old** \`env\`, and writes it into the **new** \`out\`. Because every read goes to \`env\` and every write to \`out\`, no phi can see another's new value.
- \`return out;\` hands back the state after the edge has been crossed.

This is exactly "all phis take their values at the same moment". It is also the classic "lost copy" when phis are turned into plain copies in the wrong order, which a compiler leaving SSA has to avoid.

**Common wrong attempts.**

- Writing into \`env\` as you go: the first phi overwrites \`p2\` with 2, and the second then copies that 2 into \`q2\`, so both end up as 2.
- Building \`out\` as an empty object \`{}\`: the phis' values are right, but every other variable is lost.
- Changing \`env\` and returning it: the result looks right for one phi, but the caller's \`env\` has changed, and the last test checks that it has not.`,
    wrong: [
      {
        code: `${E_HEAD}
  for (const [d, ops] of phis) {
    env[d] = env[ops[k]];
  }
  return env;
}`,
        why: 'Updating in place lets the second phi read the first phi’s new value. In the swap, both end up as 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A join block has three predecessors. How many operands does each of its phis have?',
    options: [
      { t: 'Two', why: 'Phis are not limited to two. They have one operand per incoming edge.' },
      { t: 'As many as there are different values', why: 'Even if two operands are the same name, there is still one per predecessor, in predecessor order.' },
      { t: 'One', why: 'A phi with one operand would just be a copy. Each edge needs its own operand.' },
      { t: 'Three', correct: true, why: 'One operand per predecessor, so the phi knows what to pick for each edge.' },
    ],
  },
  {
    q: 'In VIR, `b3` has `; preds b1 b2` and starts with `%4 = phi %2, %3`. Control arrives from `b2`. What is `%4`?',
    options: [
      { t: 'The value of `%3`', correct: true, why: 'Operands follow predecessor order: `b1` gives `%2`, `b2` gives `%3`.' },
      { t: 'The value of `%2`', why: 'That would be the case for control arriving from `b1`, the first predecessor.' },
      { t: 'Whichever of `%2` and `%3` was computed last', why: 'A phi chooses by edge, not by time. Only one of the two branches ran anyway.' },
    ],
  },
  {
    q: 'A loop header holds `%3 = phi %2, %10`, but `%10` is defined further down the listing. Is that a bug?',
    options: [
      { t: 'Yes: a value must be defined before it is used.', why: 'For ordinary uses, yes. A phi operand only has to be available at the end of its predecessor.' },
      { t: 'No: `%10` arrives along the back edge, so its block has always run by then.', correct: true, why: 'On the first entry the phi takes `%2`. It only reads `%10` when coming round from the end of the loop body.' },
      { t: 'No: phis are evaluated after the whole loop finishes.', why: 'A header phi is evaluated every time control enters the header.' },
    ],
  },
  {
    q: 'A loop header has `p2 = φ(p0, q2)` and `q2 = φ(q0, p2)`, with `p2 = 1` and `q2 = 2`. Control arrives along the back edge (the second operand). What do they hold now?',
    options: [
      { t: '`p2 = 2`, `q2 = 2`', why: 'That is what you get running the phis one after the other. Phis all read before any of them writes.' },
      { t: '`p2 = 1`, `q2 = 2`', why: 'The phis do pick new values: the second operands, read from before the edge was crossed.' },
      { t: '`p2 = 2`, `q2 = 1`', correct: true, why: 'Each takes the old value of the other: a swap.' },
      { t: '`p2 = 1`, `q2 = 1`', why: 'That would be the in-order bug the other way round; neither phi sees the other’s new value.' },
    ],
  },
  {
    q: 'What does a compiler do with phis before it emits machine code?',
    options: [
      { t: 'Emits a special phi instruction the CPU understands', why: 'CPUs have no such instruction; a phi depends on which edge was taken, which the CPU does not track.' },
      { t: 'Replaces them with copies at the ends of the predecessor blocks, ordered so that “all at once” is kept', correct: true, why: 'Each predecessor copies the operand that belongs to it into the phi’s destination.' },
      { t: 'Deletes them, since they compute nothing', why: 'They choose a value; deleting them would lose it.' },
      { t: 'Keeps only the first operand', why: 'That would be wrong whenever control arrived from any other predecessor.' },
    ],
  },
];
