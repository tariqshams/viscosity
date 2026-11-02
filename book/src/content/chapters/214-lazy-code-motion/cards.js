// Chapter 216 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'lcm-why-late': {
    q: 'Why place an inserted computation as late as possible rather than as early as possible?',
    a: 'Its result then lives for the shortest time, so it holds a register for less of the program; the number of computations on each path is the same.',
  },
  'busy-cost': {
    q: 'In the chapter’s example, what is wrong with computing `a + b` once in `b0`?',
    a: 'Nothing for correctness, but the value must be kept alive from `b0` to `b4`, across the whole function.',
  },
  'earliest-what': {
    q: 'What are the **earliest** points for an expression?',
    a: 'Blocks where it is anticipated on entry but would not already be available there.',
  },
  'postpone-what': {
    q: 'When can a copy be postponed into block `b`?',
    a: 'When every predecessor of `b` is an earliest point or postponable itself, and does not use the expression.',
  },
  'latest-what': {
    q: 'What makes a block a **latest** point?',
    a: 'A copy may sit there, and it cannot slide further: the block uses the expression, or some successor could not take the copy.',
  },
  'one-at-a-time': {
    q: 'The chapter computes lazy code motion for one expression at a time. How do compilers handle all expressions together?',
    a: 'They give each expression one bit and solve the same equations on bit vectors, so every expression is handled at once.',
  },
  'dowhile-hoist': {
    q: 'In the `do`-`while` example, why does the copy of `a + b` stop in the block before the loop instead of sliding into the body?',
    a: 'The body uses `a + b`, so the copy cannot be postponed past it; and putting it inside would compute it on every trip.',
  },
  'used-why': {
    q: 'Why does lazy code motion check whether an inserted copy is used after its block?',
    a: 'A copy used only by its own block’s computation saves nothing; the original instruction is left as it is.',
  },
};

export const examples = {
  slide: {
    title: 'Sliding a copy down a chain',
    code: `// b0 -> b1 -> b2 -> b3, and only
// the blocks marked true use a + b
const use = [false, false, false, true];
const n = use.length;
// anticipated everywhere, available
// nowhere: the earliest point is b0
const early = use.map(
  (_, b) => b === 0);
const post = [false];
for (let b = 1; b < n; b++) {
  const p = b - 1;
  post[b] = (early[p] || post[p])
    && !use[p];
}
const ok = (b) => early[b] || post[b];
for (let b = 0; b < n; b++) {
  const stop = b + 1 === n ||
    !ok(b + 1);
  const late = ok(b) &&
    (use[b] || stop);
  console.log('b' + b, 'early',
    early[b], 'post', post[b],
    'late', late);
}`,
  },
};

export const exercises = {
  lcm: {
    title: 'Lazy code motion for one expression',
    prompt: `Finish \`lcm(blocks)\` for a single expression \`e\`. Each block is \`{ succ, use, kill }\` (booleans for \`use\` and \`kill\`, as in the chapter); block 0 is the entry and critical edges are already split. The starter computes \`preds\`, gives you \`solve(init, step)\`, which repeats \`v[b] = step(b, v)\` over all blocks until nothing changes, and computes \`ant\` (anticipated on entry).

Compute, in order: \`av\` (will be available on entry: false for block 0; otherwise every predecessor \`p\` has \`(ant[p] || av[p]) && !kill(p)\`), \`early\` (\`ant && !av\`), \`post\` (postponable on entry: false for block 0; otherwise every predecessor has \`(early[p] || post[p]) && !use(p)\`), \`late\` (\`early || post\`, and either the block uses \`e\` or some successor is neither early nor postponable), and \`used\` (on entry: \`!late[b] && (use(b) || some successor is used)\`, starting from false).

Return \`{ insert, replace }\`: the blocks (ascending) where \`t = e\` is inserted (\`late\` and used on exit) and those whose own computation of \`e\` is replaced by \`t\` (they use \`e\`, and are not a latest point whose copy is unused on exit).`,
    starter: `// One expression e, say a + b.
// blocks[b] = { succ, use, kill }:
// use: b computes e before changing
//   its operands; kill: b changes an
//   operand. Block 0 is the entry, and
//   critical edges are already split.
// solve(init, step): repeat
//   v[b] = step(b, v) until stable.
function lcm(blocks) {
  const n = blocks.length;
  const preds = blocks.map(() => []);
  blocks.forEach((bl, b) => {
    for (const s of bl.succ) {
      preds[s].push(b);
    }
  });
  const solve = (init, step) => {
    const v = blocks.map(init);
    let changed = true;
    while (changed) {
      changed = false;
      for (let b = 0; b < n; b++) {
        const x = step(b, v);
        if (x !== v[b]) {
          v[b] = x;
          changed = true;
        }
      }
    }
    return v;
  };
  const use = (b) => blocks[b].use;
  const kill = (b) => blocks[b].kill;
  const succ = (b) => blocks[b].succ;
  // 1. anticipated on entry
  const ant = solve(() => true,
    (b, v) => use(b) || (!kill(b) &&
      succ(b).length > 0 &&
      succ(b).every((s) => v[s])));
  // your code here
  return { insert: [], replace: [] };
}`,
    solution: `// One expression e, say a + b.
// blocks[b] = { succ, use, kill }:
// use: b computes e before changing
//   its operands; kill: b changes an
//   operand. Block 0 is the entry, and
//   critical edges are already split.
// solve(init, step): repeat
//   v[b] = step(b, v) until stable.
function lcm(blocks) {
  const n = blocks.length;
  const preds = blocks.map(() => []);
  blocks.forEach((bl, b) => {
    for (const s of bl.succ) {
      preds[s].push(b);
    }
  });
  const solve = (init, step) => {
    const v = blocks.map(init);
    let changed = true;
    while (changed) {
      changed = false;
      for (let b = 0; b < n; b++) {
        const x = step(b, v);
        if (x !== v[b]) {
          v[b] = x;
          changed = true;
        }
      }
    }
    return v;
  };
  const use = (b) => blocks[b].use;
  const kill = (b) => blocks[b].kill;
  const succ = (b) => blocks[b].succ;
  // 1. anticipated on entry
  const ant = solve(() => true,
    (b, v) => use(b) || (!kill(b) &&
      succ(b).length > 0 &&
      succ(b).every((s) => v[s])));
  // 2. will be available on entry
  const av = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (ant[p] || v[p]) && !kill(p)));
  // 3. earliest
  const early = blocks.map(
    (_, b) => ant[b] && !av[b]);
  // 4. postponable on entry
  const post = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (early[p] || v[p]) && !use(p)));
  // 5. latest
  const ok = (b) => early[b] || post[b];
  const late = blocks.map((_, b) =>
    ok(b) && (use(b) ||
      succ(b).some((s) => !ok(s))));
  // 6. used later, on entry
  const used = solve(() => false,
    (b, v) => !late[b] && (use(b) ||
      succ(b).some((s) => v[s])));
  const usedOut = (b) =>
    succ(b).some((s) => used[s]);
  // 7. the rewrite
  const insert = [];
  const replace = [];
  for (let b = 0; b < n; b++) {
    if (late[b] && usedOut(b)) {
      insert.push(b);
    }
    const alone = late[b] &&
      !usedOut(b);
    if (use(b) && !alone) {
      replace.push(b);
    }
  }
  return { insert, replace };
}
`,
    tests: `const B = (succ, use = false,
  kill = false) => ({ succ, use, kill });
test('as late as possible', () => {
  expect(lcm([B([1]), B([2, 3]),
    B([4], true), B([4]), B([], true)]))
    .toEqual({ insert: [2, 3],
      replace: [2, 4] });
});
test('a partial redundancy', () => {
  expect(lcm([B([1, 2]), B([3], true),
    B([3]), B([], true)]))
    .toEqual({ insert: [1, 2],
      replace: [1, 3] });
});
test('nothing redundant: no change', () => {
  expect(lcm([B([1, 2]), B([3], true),
    B([3]), B([])]))
    .toEqual({ insert: [], replace: [] });
});
test('a do-while: hoist before it', () => {
  expect(lcm([B([1]), B([2]),
    B([3], true), B([5, 4]), B([]),
    B([2])]))
    .toEqual({ insert: [1],
      replace: [2] });
});
test('a while loop: leave it', () => {
  expect(lcm([B([1]), B([2]),
    B([3, 4]), B([2], true), B([])]))
    .toEqual({ insert: [], replace: [] });
});
test('a kill in between', () => {
  expect(lcm([B([1], true),
    B([2], false, true), B([], true)]))
    .toEqual({ insert: [], replace: [] });
});
`,
    hints: [
      'Each fact is one call to `solve` (or a `map`). For `av` and `post`, the initial value is `(b) => b !== 0`, and the step starts with `b !== 0 &&` and then checks every predecessor with `preds[b].every(...)`.',
      'Write a helper `ok = (b) => early[b] || post[b]`. Then `late[b]` is `ok(b) && (use(b) || succ(b).some((s) => !ok(s)))`.',
      '`used` is solved from `() => false` with step `!late[b] && (use(b) || succ(b).some((s) => v[s]))`; then `usedOut(b)` is `succ(b).some((s) => used[s])`. Finally loop over the blocks: insert where `late[b] && usedOut(b)`; replace where `use(b)` and not `(late[b] && !usedOut(b))`.',
    ],
    walkthrough: `**How to think about it.** The chapter's six steps are each "one yes or no per block", and each is either a direct formula over facts already computed (\`early\`, \`late\`) or a dataflow problem that \`solve\` iterates to a fixpoint (\`av\`, \`post\`, \`used\`). So the work is translating each sentence of the chapter into one line, in order, because each step reads the ones before it. Two things decide the starting values: \`av\` and \`post\` are "for all predecessors" problems, so they start optimistic (true) except at the entry, which has no predecessors and must be false; \`used\` is a "for some successor" problem, so it starts false.

**The solution, line by line.**

- \`const av = solve((b) => b !== 0, (b, v) => b !== 0 && preds[b].every((p) => (ant[p] || v[p]) && !kill(p)));\` is "will be available on entry": on every path in, the expression was anticipated (so an earliest copy would be at or before that predecessor) or already available, and the predecessor did not kill it. The entry block is always false.
- \`const early = blocks.map((_, b) => ant[b] && !av[b]);\` the earliest points: needed from here on, not yet there.
- \`const post = solve((b) => b !== 0, (b, v) => b !== 0 && preds[b].every((p) => (early[p] || v[p]) && !use(p)));\` a copy may slide into \`b\` if every predecessor had one sitting at its start (earliest or postponed) and did not need it itself.
- \`const ok = (b) => early[b] || post[b];\` names "a copy may sit at the start of \`b\`".
- \`const late = blocks.map((_, b) => ok(b) && (use(b) || succ(b).some((s) => !ok(s))));\` the copy stops here if this block needs it, or if it cannot go on into every successor.
- \`const used = solve(() => false, (b, v) => !late[b] && (use(b) || succ(b).some((s) => v[s])));\` "on entry to \`b\`, is the temporary still needed?": yes if \`b\` uses the expression or some successor needs it, unless \`b\` is a latest point (a fresh copy is computed there, so older ones are not needed).
- \`const usedOut = (b) => succ(b).some((s) => used[s]);\` needed after \`b\`.
- The loop builds the answer: \`if (late[b] && usedOut(b)) insert.push(b);\` and \`const alone = late[b] && !usedOut(b); if (use(b) && !alone) replace.push(b);\` In a latest block whose copy nobody after it needs (\`alone\`), inserting would only feed the block's own computation, so the original stays as it is.
- \`return { insert, replace };\` as asked.

On the first test this reproduces the stepper: \`early\` is only \`b0\`, \`post\` is \`b1\`, \`b2\` and \`b3\`, \`late\` is \`b2\` and \`b3\`, both used on exit, so we insert in \`b2\` and \`b3\`, and replace in \`b2\` and \`b4\`.

**Common wrong attempts.**

- Inserting at the earliest points (busy code motion): \`insert: [0]\`. It removes the redundancy, but the tests ask for the lazy placement.
- Inserting at every latest point without the \`used\` check: in the last test, where \`b1\` changes an operand between two uses, \`b0\` and \`b2\` are latest points whose copies would only feed themselves, so \`insert\` should be empty.`,
    wrong: [
      {
        code: `// One expression e, say a + b.
// blocks[b] = { succ, use, kill }:
// use: b computes e before changing
//   its operands; kill: b changes an
//   operand. Block 0 is the entry, and
//   critical edges are already split.
// solve(init, step): repeat
//   v[b] = step(b, v) until stable.
function lcm(blocks) {
  const n = blocks.length;
  const preds = blocks.map(() => []);
  blocks.forEach((bl, b) => {
    for (const s of bl.succ) {
      preds[s].push(b);
    }
  });
  const solve = (init, step) => {
    const v = blocks.map(init);
    let changed = true;
    while (changed) {
      changed = false;
      for (let b = 0; b < n; b++) {
        const x = step(b, v);
        if (x !== v[b]) {
          v[b] = x;
          changed = true;
        }
      }
    }
    return v;
  };
  const use = (b) => blocks[b].use;
  const kill = (b) => blocks[b].kill;
  const succ = (b) => blocks[b].succ;
  // 1. anticipated on entry
  const ant = solve(() => true,
    (b, v) => use(b) || (!kill(b) &&
      succ(b).length > 0 &&
      succ(b).every((s) => v[s])));
  // 2. will be available on entry
  const av = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (ant[p] || v[p]) && !kill(p)));
  // 3. earliest
  const early = blocks.map(
    (_, b) => ant[b] && !av[b]);
  // 4. postponable on entry
  const post = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (early[p] || v[p]) && !use(p)));
  // 5. latest
  const ok = (b) => early[b] || post[b];
  const late = blocks.map((_, b) =>
    ok(b) && (use(b) ||
      succ(b).some((s) => !ok(s))));
  // 6. used later, on entry
  const used = solve(() => false,
    (b, v) => !late[b] && (use(b) ||
      succ(b).some((s) => v[s])));
  const usedOut = (b) =>
    succ(b).some((s) => used[s]);
  // 7. the rewrite
  const insert = [];
  const replace = [];
  for (let b = 0; b < n; b++) {
    if (early[b]) insert.push(b);
    if (use(b)) replace.push(b);
  }
  return { insert, replace };
}
`,
        why: 'This places copies at the earliest points (busy code motion): one copy in `b0` for the first test, alive across the whole function.',
      },
      {
        code: `// One expression e, say a + b.
// blocks[b] = { succ, use, kill }:
// use: b computes e before changing
//   its operands; kill: b changes an
//   operand. Block 0 is the entry, and
//   critical edges are already split.
// solve(init, step): repeat
//   v[b] = step(b, v) until stable.
function lcm(blocks) {
  const n = blocks.length;
  const preds = blocks.map(() => []);
  blocks.forEach((bl, b) => {
    for (const s of bl.succ) {
      preds[s].push(b);
    }
  });
  const solve = (init, step) => {
    const v = blocks.map(init);
    let changed = true;
    while (changed) {
      changed = false;
      for (let b = 0; b < n; b++) {
        const x = step(b, v);
        if (x !== v[b]) {
          v[b] = x;
          changed = true;
        }
      }
    }
    return v;
  };
  const use = (b) => blocks[b].use;
  const kill = (b) => blocks[b].kill;
  const succ = (b) => blocks[b].succ;
  // 1. anticipated on entry
  const ant = solve(() => true,
    (b, v) => use(b) || (!kill(b) &&
      succ(b).length > 0 &&
      succ(b).every((s) => v[s])));
  // 2. will be available on entry
  const av = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (ant[p] || v[p]) && !kill(p)));
  // 3. earliest
  const early = blocks.map(
    (_, b) => ant[b] && !av[b]);
  // 4. postponable on entry
  const post = solve((b) => b !== 0,
    (b, v) => b !== 0 &&
      preds[b].every((p) =>
        (early[p] || v[p]) && !use(p)));
  // 5. latest
  const ok = (b) => early[b] || post[b];
  const late = blocks.map((_, b) =>
    ok(b) && (use(b) ||
      succ(b).some((s) => !ok(s))));
  // 6. used later, on entry
  const used = solve(() => false,
    (b, v) => !late[b] && (use(b) ||
      succ(b).some((s) => v[s])));
  const usedOut = (b) =>
    succ(b).some((s) => used[s]);
  // 7. the rewrite
  const insert = [];
  const replace = [];
  for (let b = 0; b < n; b++) {
    if (late[b]) insert.push(b);
    if (use(b)) replace.push(b);
  }
  return { insert, replace };
}
`,
        why: 'Without the `used` check, a latest block whose copy only feeds itself gets a pointless insertion: in the kill test, blocks 0 and 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Busy and lazy code motion compute `a + b` the same number of times on every path. What does lazy placement gain?',
    options: [
      {
        t: 'Fewer instructions in total, always',
        why: 'Here it even inserts two copies where busy inserts one; the number per path is what is equal.',
      },
      {
        t: 'Shorter lifetimes for the temporaries, so less pressure on registers',
        correct: true,
        why: 'Each value is computed just before it is needed and lives no longer than necessary.',
      },
      {
        t: 'It works without dataflow analysis',
        why: 'It needs more dataflow problems than busy code motion, not fewer.',
      },
    ],
  },
  {
    q: 'Which blocks are the **earliest** points for an expression?',
    options: [
      {
        t: 'Those where it is anticipated on entry and would not already be available',
        correct: true,
        why: 'Needed from here on, not yet computed: the first moment a copy is both safe and useful.',
      },
      {
        t: 'Those where it is first written in the source',
        why: 'Earliest is about safety and usefulness, not where the programmer wrote it.',
      },
      {
        t: 'The entry block, always',
        why: 'Only if the expression is anticipated there and its operands are set; a kill in between moves it.',
      },
    ],
  },
  {
    q: 'Why can a copy not be postponed into a block whose predecessor uses the expression?',
    options: [
      {
        t: 'Because uses are not allowed in predecessors',
        why: 'Uses can be anywhere; the problem is the order.',
      },
      {
        t: 'Because that predecessor needs the value before the copy would be computed',
        correct: true,
        why: 'Postponing past a use would leave the use without its value.',
      },
      {
        t: 'Because postponing only works in loops',
        why: 'It works on any CFG.',
      },
    ],
  },
  {
    q: 'In a `while` loop whose body computes a loop-invariant `a + b`, what does lazy code motion do?',
    options: [
      {
        t: 'Hoists it before the loop',
        why: 'The body may run zero times, so `a + b` is not anticipated before the loop.',
      },
      {
        t: 'Moves it after the loop',
        why: 'After the loop it is not needed at all.',
      },
      {
        t: 'Leaves it in the body',
        correct: true,
        why: 'Hoisting would compute it on a path that never did; turning the loop into a guarded `do`-`while` first is what lets it move.',
      },
    ],
  },
  {
    q: 'What does the final `used` analysis prevent?',
    options: [
      {
        t: 'Inserting a copy whose result only its own block would use',
        correct: true,
        why: 'Such a copy saves nothing; the original computation is kept instead.',
      },
      {
        t: 'Deleting a computation that is still needed',
        why: 'Correctness is guaranteed by the earlier steps; `used` removes pointless insertions.',
      },
      {
        t: 'Infinite loops in the analysis',
        why: 'Every analysis here terminates on its own; `used` is about the rewrite.',
      },
      {
        t: 'Inserting into critical edges',
        why: 'Critical edges were split before the analysis started.',
      },
    ],
  },
];
