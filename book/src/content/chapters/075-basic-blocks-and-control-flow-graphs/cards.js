// Chapter 75 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bb-what': {
    q: 'What is a basic block?',
    a: 'A maximal run of instructions with one entry (the first) and one exit (the last).',
  },
  'leader-rules': {
    q: 'What are the three rules for finding leaders?',
    a: 'The first instruction, every jump target, and every instruction right after a jump.',
  },
  'all-or-nothing': {
    q: 'If the first instruction of a basic block runs, what do you know about the rest of it?',
    a: 'All of it runs, in order (barring an exception).',
  },
  'cfg-what': {
    q: 'What are the nodes and edges of a control-flow graph?',
    a: 'Nodes are basic blocks; an edge A → B means B can run immediately after A.',
  },
  'pred-succ': {
    q: 'If there is an edge A → B, which is the predecessor?',
    a: 'A is a predecessor of B; B is a successor of A.',
  },
  cycle: {
    q: 'What does a cycle in a CFG mean?',
    a: 'A loop: control can come back to a block it has already run.',
  },
  'one-terminator': {
    q: 'In VIR, which part of a block can jump?',
    a: 'Only its terminator (`br`, `condbr`, `return`, `throw` or `unreachable`), and each block has exactly one, at the end.',
  },
  'preds-filled': {
    q: 'When does Viscosity’s builder fill in a block’s `preds`?',
    a: 'When it sets the terminator of another block: it adds that block to each successor’s `preds`.',
  },
  'empty-blocks': {
    q: 'Why does VIR’s CFG for the Collatz loop have blocks holding nothing but `br`?',
    a: 'The lowering always makes a join block for an `if` and a continue block for a loop. It keeps lowering mechanical, and costs little.',
  },
  unreachable: {
    q: 'How can you tell from a CFG that a (non-entry) block can never run?',
    a: 'No path from the entry reaches it; for example, it has no predecessors.',
  },
};

export const examples = {
  'succ-preds': {
    title: 'The Collatz CFG, both directions',
    code: `// successors of b0..b7, from VIR
const succ = [[1], [2, 4], [5, 6],
  [1], [], [7], [7], [3]];
const preds = succ.map(() => []);
succ.forEach((ss, b) => {
  for (const s of ss) preds[s].push(b);
});
preds.forEach((ps, b) => {
  console.log('b' + b, 'preds', ps);
});`,
  },
};

const leaderTests = `const I = (op, to) => ({ op, to });
test('the Collatz loop', () => {
  const code = [I('calc'), I('ifnot', 9),
    I('calc'), I('ifnot', 7), I('calc'),
    I('calc'), I('goto', 0), I('calc'),
    I('goto', 0), I('return')];
  expect(leaders(code))
    .toEqual([0, 2, 4, 7, 9]);
});
test('straight-line code is one block', () => {
  const code = [I('calc'), I('calc'),
    I('return')];
  expect(leaders(code)).toEqual([0]);
});
test('code after a return starts a block', () => {
  const code = [I('calc'), I('return'),
    I('calc'), I('return')];
  expect(leaders(code)).toEqual([0, 2]);
});
test('sorted as numbers, no repeats', () => {
  const code = [I('calc'), I('ifnot', 10),
    I('goto', 2), I('calc'), I('calc'),
    I('calc'), I('calc'), I('calc'),
    I('calc'), I('calc'), I('calc'),
    I('goto', 10)];
  expect(leaders(code))
    .toEqual([0, 2, 3, 10]);
});`;

const predTests = `test('the Collatz CFG', () => {
  const succ = [[1], [2, 4], [5, 6],
    [1], [], [7], [7], [3]];
  expect(preds(succ)).toEqual([[], [0, 3],
    [1], [7], [1], [2], [2], [5, 6]]);
});
test('an unreachable block', () => {
  expect(preds([[], []]))
    .toEqual([[], []]);
});
test('a self-loop', () => {
  expect(preds([[1], [1, 2], []]))
    .toEqual([[], [0, 1], [1]]);
});`;

export const exercises = {
  leaders: {
    title: 'Find the leaders',
    prompt:
      'Each instruction is an object with an `op`. `{ op: "goto", to }` always jumps to index `to`; `{ op: "ifnot", to }` may jump there; `{ op: "return" }` leaves the function; anything else (like `{ op: "calc" }`) just falls through. Write `leaders(code)` that returns the indices of the leaders, sorted in increasing order, without repeats. Treat `return` like a jump: whatever follows it starts a new block.',
    starter: `function leaders(code) {
  const ls = new Set([0]);
  for (const ins of code) {
    if (ins.op === 'goto') {
      ls.add(ins.to);
    }
  }
  return [...ls];
}`,
    solution: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
    const next = i + 1;
    if (ENDS.includes(ins.op) &&
        next < code.length) {
      ls.add(next);
    }
  });
  return [...ls].sort((a, b) => a - b);
}`,
    tests: leaderTests,
    hints: [
      'Use a `Set` for the leaders (it removes repeats), starting with `0`.',
      'For each instruction at index `i`: if it has a target, add the target. If it is a `goto`, `ifnot` or `return`, add `i + 1`, as long as that is still inside the code.',
      'Finish with `[...ls].sort((a, b) => a - b)`. A plain `.sort()` compares as strings and puts 10 before 2.',
    ],
    walkthrough: `\`\`\`js
code.forEach((ins, i) => {
  const t = ins.to;
  if (t !== undefined) ls.add(t);
  const next = i + 1;
  if (ENDS.includes(ins.op) &&
      next < code.length) {
    ls.add(next);
  }
});
\`\`\`

Each rule is one line:

- **The first instruction**: the set starts as \`[0]\`.
- **Jump targets**: control can arrive there from somewhere other than the line above, so a block must start there. Both \`goto\` and \`ifnot\` have targets.
- **After a jump** (or a \`return\`): the jump might leave, so the next instruction can be reached only from elsewhere, or not at all. Either way it starts a fresh block. The bounds check stops a final \`return\` from adding an index past the end.

Then sort numerically. JavaScript’s default \`sort\` turns numbers into strings, so \`[0, 10, 2]\` would stay in that order.

Once you have the leaders, each block runs from one leader to just before the next. Viscosity never needs this function, because it builds blocks while lowering, but a compiler that starts from flat code, such as bytecode or machine code, has to do something like it first.`,
    wrong: [
      {
        code: `function leaders(code) {
  const ls = new Set([0]);
  for (const ins of code) {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
  }
  return [...ls].sort((a, b) => a - b);
}`,
        why: 'This finds the first instruction and the targets, but not the instructions after a jump. In the Collatz loop, 2 and 4 are missing.',
      },
      {
        code: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    const t = ins.to;
    if (t !== undefined) ls.add(t);
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort();
}`,
        why: 'The default `sort()` compares as strings, so 10 comes before 2. Pass `(a, b) => a - b`.',
      },
    ],
  },
  preds: {
    optional: true,
    title: 'Predecessors from successors',
    prompt:
      'A CFG is given as `succ`, an array where `succ[b]` lists block `b`’s successors. Write `preds(succ)` that returns the reverse: an array where entry `b` lists the predecessors of `b`, in increasing block order. Every block gets an entry, even if it is empty.',
    starter: `function preds(succ) {
  return succ;
}`,
    solution: `function preds(succ) {
  const ps = succ.map(() => []);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
    tests: predTests,
    hints: [
      'Start with an empty list for every block: `succ.map(() => [])`.',
      'Visit each block `b` in order, and for each successor `s`, push `b` onto `ps[s]`.',
    ],
    walkthrough: `\`\`\`js
const ps = succ.map(() => []);
succ.forEach((ss, b) => {
  for (const s of ss) ps[s].push(b);
});
\`\`\`

Every edge \`b → s\` is visited once and filed the other way round. Visiting blocks in increasing order means each list comes out sorted, without a sort.

\`succ.map(() => [])\` matters: \`new Array(n).fill([])\` would give every block the *same* array (chapter 4’s aliasing), and every push would land in all of them.

Viscosity does the same filing, but at the moment each edge is created: \`terminate\` pushes the current block onto each successor’s \`preds\`. For the Collatz CFG the result matches the \`; preds\` comments in the listing exactly.`,
    wrong: [
      {
        code: `function preds(succ) {
  const ps = new Array(succ.length)
    .fill([]);
  succ.forEach((ss, b) => {
    for (const s of ss) ps[s].push(b);
  });
  return ps;
}`,
        why: '`fill([])` puts the same array in every slot, so every block ends up with every predecessor. Make a new array per block with `map`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which instructions are leaders?',
    options: [
      { t: 'Every instruction that computes a value', why: 'Most instructions compute values; leaders are about control flow.' },
      { t: 'Only jump targets', why: 'Also the first instruction, and every instruction after a jump.' },
      { t: 'The first instruction, jump targets, and instructions right after jumps', correct: true, why: 'Those are exactly the places control can enter other than from the line above.' },
      { t: 'Every jump instruction', why: 'A jump ends a block; the instruction after it is the leader.' },
    ],
  },
  {
    q: 'Why can a compiler analyse one basic block in isolation so cheaply?',
    options: [
      { t: 'Its instructions always run all together, in order', correct: true, why: 'One entry, one exit: there is no other order to consider inside a block.' },
      { t: 'Basic blocks contain no variables', why: 'They contain plenty; it’s the control flow inside them that is trivial.' },
      { t: 'Each basic block is one instruction', why: 'A block can be long; it is “basic” because it has no internal branching.' },
      { t: 'Blocks are always small enough to fit in a cache line', why: 'Size is unrelated; it’s the single entry and exit that matter.' },
    ],
  },
  {
    q: 'In VIR, how many terminators does a block have, and where?',
    options: [
      { t: 'Any number, anywhere in `insts`', why: 'Ordinary instructions can’t jump in VIR; that’s the point of `term`.' },
      { t: 'Zero or one', why: 'Every block has one; an unfinished block has `unreachable` as its terminator.' },
      { t: 'Two: one for each successor', why: 'A single `condbr` names both successors.' },
      { t: 'Exactly one, in `term`, after all the instructions', correct: true, why: 'The type itself guarantees one exit per block.' },
    ],
  },
  {
    q: 'A block ends with `condbr %5, b5, b6`. What does `successors` return for it?',
    options: [
      { t: '`[5]`', why: 'Either branch can be taken, so both are successors.' },
      { t: '`[5, 6]`', correct: true, why: 'The then target first, then the else target.' },
      { t: '`[%5]`', why: '%5 is the condition value, not a block.' },
      { t: '`[]`', why: 'An empty list is for `return`, `throw` and `unreachable`.' },
    ],
  },
  {
    q: 'In the VIR CFG for the Collatz loop, block b1 has predecessors b0 and b3. What does that tell you?',
    options: [
      { t: 'b1 is unreachable', why: 'It has predecessors, and b0 is the entry.' },
      { t: 'b1 runs exactly twice', why: 'The CFG says which paths exist, not how many times each is taken.' },
      { t: 'b1 can be entered from the entry or from the back edge: it is the loop’s header', correct: true, why: 'b3 → b1 closes the cycle, so b1 is reached once from b0 and again each time round the loop.' },
      { t: 'b0 and b3 run at the same time', why: 'Only one path is taken each time; the edges are alternatives.' },
    ],
  },
  {
    q: 'What does Viscosity’s lowering do with `x = 2;` written after `return x;`?',
    options: [
      { t: 'Reports a syntax error', why: 'Code after a return is valid JavaScript.' },
      { t: 'Deletes it during parsing', why: 'The parser keeps it; the lowering deals with it.' },
      { t: 'Puts it at the end of the entry block', why: 'Then it would run after the return, which can’t happen. The return is the block’s terminator.' },
      { t: 'Lowers it into a fresh block with no predecessors, which is unreachable', correct: true, why: 'Nothing jumps to that block, and the CFG makes it visible: no path from the entry reaches it.' },
    ],
  },
];
