// Chapter 187 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bb-what': {
    q: 'What is a basic block?',
    a: 'A maximal run of instructions with one entry (the first) and one exit (the last).',
  },
  'leader-rules': {
    q: 'What are the three rules for finding leaders?',
    a: 'The first instruction, every jump target, and every instruction right after a jump (or a return).',
  },
  'all-or-nothing': {
    q: 'If the first instruction of a basic block runs, what do you know about the rest of it?',
    a: 'All of it runs, in order (barring an exception).',
  },
  maximal: {
    q: 'What does *maximal* mean in “a maximal run of instructions”?',
    a: 'The block is cut only at leaders, so it is as long as it can be; two blocks are never glued where nothing forces a cut.',
  },
  'twice-a-leader': {
    q: 'An instruction is both a jump target and the line after a jump. How many blocks does it start?',
    a: 'One. It is a leader for two reasons, but a leader is a leader; the set of leaders has no repeats.',
  },
  'collatz-blocks': {
    q: 'In the ten-line Collatz list, the leaders are 0, 2, 4, 7 and 9. Which lines make up the block that starts at 4?',
    a: 'Lines 4, 5 and 6: from the leader up to, but not including, the next leader (7).',
  },
  'call-no-end': {
    q: 'Does a function call in the middle of a block end the block?',
    a: 'No. The call comes back to the next instruction, so it is one step like any other. Only jumps, returns and throws end a block.',
  },
  'why-blocks': {
    q: 'Why do analyses start by studying each basic block on its own?',
    a: 'Inside a block, order is trivial (top to bottom, all or nothing), so a block can be summarised cheaply without thinking about paths.',
  },
};

export const examples = {
  'block-counts': {
    title: 'Every line of a block runs equally often',
    code: `// The Collatz list, run for n = 6.
// count[i] = how often line i ran.
const count = new Array(10).fill(0);
let n = 6, pc = 0, t;
while (pc !== 10) {
  count[pc]++;
  switch (pc) {
    case 0: t = n > 1; pc = 1; break;
    case 1: pc = t ? 2 : 9; break;
    case 2: t = n % 2; pc = 3; break;
    case 3: pc = t ? 4 : 7; break;
    case 4: t = 3 * n; pc = 5; break;
    case 5: n = t + 1; pc = 6; break;
    case 6: pc = 0; break;
    case 7: n = n / 2; pc = 8; break;
    case 8: pc = 0; break;
    case 9: pc = 10; break;
  }
}
console.log(count.join(' '));
console.log('n is', n);`,
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

const blockTests = `const I = (op, to) => ({ op, to });
test('the Collatz loop', () => {
  const code = [I('calc'), I('ifnot', 9),
    I('calc'), I('ifnot', 7), I('calc'),
    I('calc'), I('goto', 0), I('calc'),
    I('goto', 0), I('return')];
  expect(blocks(code)).toEqual([[0, 1],
    [2, 3], [4, 6], [7, 8], [9, 9]]);
});
test('one block', () => {
  const code = [I('calc'), I('return')];
  expect(blocks(code)).toEqual([[0, 1]]);
});
test('absolute value', () => {
  const code = [I('calc'), I('ifnot', 4),
    I('calc'), I('goto', 4), I('return')];
  expect(blocks(code))
    .toEqual([[0, 1], [2, 3], [4, 4]]);
});
test('a jump to line 1', () => {
  const code = [I('calc'), I('calc'),
    I('ifnot', 1), I('return')];
  expect(blocks(code))
    .toEqual([[0, 0], [1, 2], [3, 3]]);
});`;

export const exercises = {
  leaders: {
    title: 'Find the leaders',
    prompt:
      'Each instruction is an object with an `op`. `{ op: "goto", to }` always jumps to index `to`; `{ op: "ifnot", to }` may jump there; `{ op: "return" }` leaves the function; anything else (like `{ op: "calc" }`) falls through to the next line. Write `leaders(code)` that returns the indices of the leaders, sorted in increasing order, without repeats. Treat `return` like a jump: whatever follows it starts a new block.',
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
      'There are three rules, so you need three kinds of `add`. Which data structure removes repeats for you?',
      'Start with a `Set` holding `0`. For each instruction at index `i`: if it has a target (`ins.to`), add the target; if it is a `goto`, `ifnot` or `return`, add `i + 1`.',
      'Only add `i + 1` while it is still inside the code (`i + 1 < code.length`), and finish with `[...ls].sort((a, b) => a - b)`: a plain `.sort()` compares as strings and puts 10 before 2.',
    ],
    walkthrough: `**How to think about it.** Each of the three leader rules says "this index starts a block", and an index may be named by more than one rule, so collect them in a \`Set\` (which keeps one copy of each) and sort at the end. Rule 1 is the starting value of the set. Rules 2 and 3 both come from looking at one instruction at a time, so one pass over the code is enough: when you see a jump, its target is a leader (control can arrive there from somewhere other than the line above), and the line after it is a leader too (control can only reach that line from elsewhere, or not at all).

**The solution, line by line.**

- \`const ENDS = ['goto', 'ifnot', 'return'];\` lists the instructions that end a block, so the line after any of them is a leader.
- \`function leaders(code) {\` takes the list of instructions.
- \`const ls = new Set([0]);\` is rule 1: the first instruction is always a leader.
- \`code.forEach((ins, i) => {\` visits each instruction with its index \`i\`.
- \`const t = ins.to;\` reads the target; only \`goto\` and \`ifnot\` have one, so for everything else it is \`undefined\`.
- \`if (t !== undefined) ls.add(t);\` is rule 2: every jump target is a leader. (Test \`!== undefined\` rather than \`if (t)\`, because a jump to line 0 has the target \`0\`, which counts as false.)
- \`const next = i + 1;\` is the line straight after this one.
- \`if (ENDS.includes(ins.op) && next < code.length) { ls.add(next); }\` is rule 3, with a bounds check so that a final \`return\` does not add an index past the end.
- \`return [...ls].sort((a, b) => a - b);\` turns the set into an array and sorts it as numbers: the comparison function returns a negative number when \`a\` should come first.

For the Collatz list: the set starts with 0; line 1 adds 9 and 2; line 3 adds 7 and 4; line 6 adds 0 (already there) and 7 (already there); line 8 adds 0 and 9; line 9 is a \`return\` at the very end, so nothing is added. Sorted, that is 0, 2, 4, 7, 9.

**Common wrong attempts.**

- Adding only the targets: you get 0, 7 and 9, and miss 2 and 4, the lines after the two \`ifnot\`s.
- Sorting with plain \`.sort()\`: JavaScript turns the numbers into strings first, so \`[0, 10, 2, 3]\` stays in that order, because "10" comes before "2" in dictionary order.
- Forgetting the bounds check: a \`return\` on the last line adds an index that is not an instruction.`,
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
  blocks: {
    optional: true,
    title: 'Cut the list into blocks',
    prompt:
      'Using the same instructions as the last exercise, write `blocks(code)` that returns every basic block as a pair `[first, last]` of instruction indices (both included), in order. Find the leaders first (you may copy your `leaders` function in), then cut: each block runs from one leader to just before the next, and the last block runs to the end of the code.',
    starter: `function blocks(code) {
  return [[0, code.length - 1]];
}`,
    solution: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    if (ins.to !== undefined) {
      ls.add(ins.to);
    }
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort((a, b) => a - b);
}

function blocks(code) {
  const ls = leaders(code);
  return ls.map((l, k) => {
    const end = k + 1 < ls.length
      ? ls[k + 1] : code.length;
    return [l, end - 1];
  });
}`,
    tests: blockTests,
    hints: [
      'Once you have the sorted leaders, each block is fully decided by its own leader and the next one.',
      'Use `ls.map((l, k) => ...)`: block `k` starts at `l`. Where does it end?',
      'It ends one before `ls[k + 1]`, or at `code.length - 1` for the last leader.',
    ],
    walkthrough: `**How to think about it.** Finding the leaders was the hard part; cutting is bookkeeping. Picture the sorted leaders as fence posts along the list: each block is the stretch between one post and the next, and the last block runs from the last post to the end. So you need, for each leader, the index of the next leader (or the end of the list).

**The solution, line by line.**

- \`ENDS\` and \`leaders(code)\` are the previous exercise's solution, written slightly more compactly.
- \`function blocks(code) {\` takes the list.
- \`const ls = leaders(code);\` gets the sorted leaders, for example \`[0, 2, 4, 7, 9]\`.
- \`return ls.map((l, k) => {\` makes one pair per leader; \`k\` is its position in \`ls\`.
- \`const end = k + 1 < ls.length ? ls[k + 1] : code.length;\` is the index just past the block: the next leader, or the length of the code for the last block.
- \`return [l, end - 1];\` gives the first and last index of the block, both included.

For the Collatz list that is \`[0, 1]\`, \`[2, 3]\`, \`[4, 6]\`, \`[7, 8]\` and \`[9, 9]\`: five blocks, the last holding only the \`return\`.

**Common wrong attempts.**

- Ending each block *at* the next leader (\`[l, ls[k + 1]]\`): then neighbouring blocks share a line, and every instruction would belong to two blocks.
- Forgetting the last block: looping only while \`k + 1 < ls.length\` drops the block that holds the \`return\`.
- Ending the last block at \`code.length\`: that index is one past the last instruction.`,
    wrong: [
      {
        code: `const ENDS = ['goto', 'ifnot',
  'return'];

function leaders(code) {
  const ls = new Set([0]);
  code.forEach((ins, i) => {
    if (ins.to !== undefined) {
      ls.add(ins.to);
    }
    if (ENDS.includes(ins.op) &&
        i + 1 < code.length) {
      ls.add(i + 1);
    }
  });
  return [...ls].sort((a, b) => a - b);
}

function blocks(code) {
  const ls = leaders(code);
  return ls.map((l, k) =>
    [l, ls[k + 1] ?? code.length]);
}`,
        why: 'Each block ends *at* the next leader instead of one before it, so neighbouring blocks overlap, and the last ends one past the code.',
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
      { t: 'Basic blocks contain no variables', why: 'They contain plenty; it is the control flow inside them that is trivial.' },
      { t: 'Each basic block is one instruction', why: 'A block can be long; it is “basic” because it has no internal branching.' },
      { t: 'Blocks are always small enough to fit in a cache line', why: 'Size is unrelated; it is the single entry and exit that matter.' },
    ],
  },
  {
    q: '`0 t = a < b`, `1 ifnot t goto 3`, `2 a = b`, `3 return a`. What are the blocks?',
    options: [
      { t: 'One block, lines 0–3', why: 'Line 1 is a jump, so line 2 starts a block, and line 3 is a jump target.' },
      { t: 'Lines 0–1, 2 and 3', correct: true, why: 'Leaders are 0 (first), 2 (after the jump) and 3 (the target).' },
      { t: 'Lines 0, 1, 2 and 3, one each', why: 'Lines 0 and 1 belong together: nothing jumps to line 1 and line 0 is not a jump.' },
      { t: 'Lines 0–2 and 3', why: 'Line 2 comes after the jump on line 1, so it must start a new block.' },
    ],
  },
  {
    q: 'Running the Collatz list for some n, line 4 ran 7 times. How many times did line 6 run?',
    options: [
      { t: 'It depends on n', why: 'Lines 4, 5 and 6 are one block; whenever line 4 runs, so do 5 and 6.' },
      { t: 'Fewer than 7', why: 'Nothing can leave the block between line 4 and line 6.' },
      { t: 'More than 7', why: 'Nothing can enter the block between line 4 and line 6 either.' },
      { t: 'Exactly 7', correct: true, why: 'All the lines of a basic block run together, so they run equally often.' },
    ],
  },
  {
    q: 'A block contains `t = f(x)`, a call to another function. Where does the block end?',
    options: [
      { t: 'Right after the call, because control leaves the function', why: 'The call returns to the very next instruction, so it does not end the block.' },
      { t: 'At its last instruction, as usual: a call does not end a block', correct: true, why: 'Only jumps, returns and throws end a block.' },
      { t: 'Right before the call', why: 'Nothing jumps to the call, so it is not a leader.' },
      { t: 'Calls are not allowed inside basic blocks', why: 'They are allowed; they are ordinary instructions from the caller’s point of view.' },
    ],
  },
];
