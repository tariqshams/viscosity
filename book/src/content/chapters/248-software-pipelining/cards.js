// Chapter 248 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'why-not-one-trip': {
    q: 'Why can no order of one trip\'s five instructions remove the stalls in the sum-of-squares loop?',
    a: 'Its critical path, ld then mul then add, is longer than the trip has instructions to fill it with; the gaps can only be filled from other trips.',
  },
  'kernel-what': {
    q: 'In a software-pipelined loop, what is the **kernel**?',
    a: 'The new loop body, run again and again, in which every stage is busy, each on a different trip of the old loop.',
  },
  'pro-epi': {
    q: 'What do the **prologue** and the **epilogue** do?',
    a: 'The prologue starts the first trips to fill the pipeline before the kernel; the epilogue finishes the last trips to drain it after.',
  },
  'kernel-order': {
    q: 'In the kernel `add a2, a2, a5` / `mul a5, a4, a4` / `ld a4, 0(a0)`, why must add come before mul?',
    a: 'add must read the square from the previous pass before mul overwrites a5 with the next one (an anti dependence between trips).',
  },
  'ii-what': {
    q: 'What is the **initiation interval** of a pipelined loop?',
    a: 'The number of cycles between the starts of consecutive trips: the length of one pass of the kernel (5 in the chapter\'s loop).',
  },
  'cost-registers': {
    q: 'Why does software pipelining raise register pressure?',
    a: 'Several trips are in flight at once, and each needs its own registers for its half-finished values.',
  },
  'short-loops': {
    q: 'What must a compiler do for a pipelined loop that may run fewer times than it has stages?',
    a: 'Add a guard that sends short loops to a plain, unpipelined copy, since they never reach the kernel.',
  },
  'pipeliner-when': {
    q: 'When does LLVM\'s software pipeliner run?',
    a: 'Just before register allocation, while the machine code is still in SSA form.',
  },
};

export const examples = {
  piped: {
    title: 'The pipelined loop, in JavaScript',
    code: `function plain(xs) {
  let s = 0;
  for (const x of xs) s += x * x;
  return s;
}

function piped(xs) {
  let s = 0;
  let x = xs[0];       // load x0
  let sq = x * x;      // square x0
  x = xs[1];           // load x1
  for (let i = 2; i < xs.length; i++) {
    s += sq;           // add
    sq = x * x;        // square
    x = xs[i];         // load
  }
  s += sq;             // drain
  sq = x * x;
  s += sq;
  return s;
}

const xs = [1, 2, 3, 4];
console.log(plain(xs), piped(xs));`,
  },
};

export const exercises = {
  stagetable: {
    title: 'The stage table',
    prompt:
      'Write `stages(names, n)`. `names` lists the stages of one trip in order (for example `[\'L\', \'M\', \'A\']`) and `n` is the number of trips. Return the rows of the pipelined loop, each row an array of strings: row `t` holds `names[s] + (t - s)` for every stage `s`, in stage order, whenever trip `t - s` exists (`0 <= t - s < n`). There are `n + names.length - 1` rows. For example `stages([\'L\', \'M\', \'A\'], 2)` is `[[\'L0\'], [\'L1\', \'M0\'], [\'M1\', \'A0\'], [\'A1\']]`.',
    starter: `function stages(names, n) {
  const rows = [];
  // your code here
  return rows;
}

console.log(stages(['L', 'M', 'A'], 4));`,
    solution: `function stages(names, n) {
  const rows = [];
  const S = names.length;
  for (let t = 0; t < n + S - 1; t++) {
    const row = [];
    for (let s = 0; s < S; s++) {
      const i = t - s;
      if (i >= 0 && i < n) {
        row.push(names[s] + i);
      }
    }
    rows.push(row);
  }
  return rows;
}`,
    tests: `test('three stages, four trips', () => {
  expect(stages(['L', 'M', 'A'], 4)).toEqual([
    ['L0'], ['L1', 'M0'], ['L2', 'M1', 'A0'],
    ['L3', 'M2', 'A1'], ['M3', 'A2'], ['A3'],
  ]);
});
test('one trip: no overlap at all', () => {
  expect(stages(['L', 'M', 'A'], 1))
    .toEqual([['L0'], ['M0'], ['A0']]);
});
test('a two-stage copy loop', () => {
  expect(stages(['ld', 'sd'], 3)).toEqual([
    ['ld0'], ['ld1', 'sd0'], ['ld2', 'sd1'],
    ['sd2'],
  ]);
});
test('n + S - 1 rows', () => {
  expect(stages(['a', 'b', 'c', 'd'], 10)
    .length).toBe(13);
});`,
    hints: [
      'Go row by row. In row `t`, which trip is at stage 0? Which trip is at stage 1, one step behind it?',
      'Stage `s` in row `t` belongs to trip `t - s`: the trip that started `s` rows ago. That trip only exists if `0 <= t - s < n`.',
      'Loop `t` from `0` to `n + S - 2` (where `S = names.length`); inside, loop `s` from `0` to `S - 1`, and push `names[s] + (t - s)` when the trip exists. Push each row onto `rows`.',
    ],
    walkthrough: `**How to think about it.** Picture the table from the chapter. Trip i starts (enters stage 0) in row i, and moves one stage further each row, so in row t it is at stage t − i. Turn that round: in row t, stage s is being run by trip t − s. Trips are numbered 0 to n − 1, so a cell is filled only when t − s is in that range; at the top of the table the later stages have no trip yet (the prologue), and at the bottom the earlier stages have run out of trips (the epilogue). The last trip, n − 1, reaches the last stage, S − 1, in row n − 1 + S − 1, so there are n + S − 1 rows.

**The solution, line by line.**

- \`const rows = [];\` will collect one array per row.
- \`const S = names.length;\` is the number of stages.
- \`for (let t = 0; t < n + S - 1; t++) {\` visits every row, from the first load to the last add.
- \`const row = [];\` starts an empty row.
- \`for (let s = 0; s < S; s++) {\` visits the stages in order, so each row lists them in stage order.
- \`const i = t - s;\` is the trip at stage \`s\` in row \`t\`: it started \`s\` rows ago.
- \`if (i >= 0 && i < n) { row.push(names[s] + i); }\` adds a cell only for a trip that exists; \`names[s] + i\` joins the stage name and the trip number into a string such as \`'M1'\`.
- \`rows.push(row);\` finishes the row, and after the loop \`return rows;\` hands the table back.

For three stages and four trips, row 2 is the first where all three stages are busy (\`L2, M1, A0\`): the kernel. Rows 0 and 1 are the prologue and rows 4 and 5 the epilogue, which is what the steppable diagram showed.

**Common wrong attempts.**

- Stopping after \`n\` rows. That keeps the prologue and the kernel but forgets the epilogue, so the last trips never finish: for four trips you get four rows and \`A2\` and \`A3\` never happen.
- Using \`t + s\` instead of \`t - s\`. That puts the *later* trips in the later stages, as if trip 1 were ahead of trip 0, and the first row comes out as \`['L0', 'M1', 'A2']\`: squaring element 1 before it has been loaded.`,
    wrong: [
      {
        code: `function stages(names, n) {
  const rows = [];
  const S = names.length;
  for (let t = 0; t < n; t++) {
    const row = [];
    for (let s = 0; s < S; s++) {
      if (t - s >= 0) {
        row.push(names[s] + (t - s));
      }
    }
    rows.push(row);
  }
  return rows;
}`,
        why: 'Only `n` rows: the epilogue is missing, so the last trips are never finished.',
      },
      {
        code: `function stages(names, n) {
  const rows = [];
  const S = names.length;
  for (let t = 0; t < n + S - 1; t++) {
    const row = [];
    for (let s = 0; s < S; s++) {
      const i = t + s;
      if (i < n) row.push(names[s] + i);
    }
    rows.push(row);
  }
  return rows;
}`,
        why: '`t + s` runs later trips in later stages, so element 1 is squared before it is loaded; the first row is `[\'L0\', \'M1\', \'A2\']`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the pipelined kernel, `add`, `mul` and `ld` work on elements i, i + 1 and i + 2. Why does the kernel\'s `mul` never stall?',
    options: [
      { t: 'Multiplies are faster in a kernel', why: 'The multiply\'s latency does not change; what changes is when its input was loaded.' },
      { t: 'The element it squares was loaded in the previous pass, 4 cycles earlier, which is more than the load\'s 3', correct: true, why: 'Starting the load a whole pass early hides its latency completely.' },
      { t: 'The kernel has no dependences', why: 'It has the same true dependences; they now cross from one pass to the next.' },
    ],
  },
  {
    q: 'A pipelined loop has 3 stages and runs over 10 elements. How many rows (passes) does its stage table have?',
    options: [
      { t: '10', why: 'That counts only one row per element, leaving out the prologue and epilogue.' },
      { t: '30', why: 'That counts every stage of every trip as a separate row, as if nothing overlapped.' },
      { t: '12', correct: true, why: 'n + S − 1 = 10 + 3 − 1: two rows of prologue, eight of kernel and two of epilogue.' },
    ],
  },
  {
    q: 'Which statement about software pipelining is true?',
    options: [
      { t: 'It overlaps different trips of a loop, so each pass of the new body works on several elements at different stages', correct: true, why: 'That is the definition: the kernel runs stage s of trip t − s for every stage.' },
      { t: 'It copies the loop body several times, like unrolling, with no prologue or epilogue', why: 'Unrolling copies the body; pipelining overlaps trips and needs a prologue and epilogue.' },
      { t: 'It only reorders the instructions inside one trip', why: 'That is ordinary scheduling, which the chapter showed cannot remove these stalls.' },
    ],
  },
  {
    q: 'What is a real cost of software pipelining?',
    options: [
      { t: 'The loop computes a slightly different answer', why: 'It computes exactly the same answer; the runnable example checks that.' },
      { t: 'It needs more registers, because several trips\' values are alive at once', correct: true, why: 'a4 and a5 hold values of two different trips; on a bigger loop this can force spills.' },
      { t: 'It makes every loop slower for long lists', why: 'For long lists it is faster: 5 cycles an element instead of 8 in the chapter.' },
    ],
  },
  {
    q: 'In the kernel, why must `mul a5, a4, a4` come before `ld a4, 0(a0)`?',
    options: [
      { t: 'Because loads are slow and should go last', why: 'Latency would argue for putting the load first; the order is forced by the shared register.' },
      { t: 'It does not matter; they are independent', why: 'They share a4: one reads it and the other writes it.' },
      { t: 'mul must read the element loaded in the previous pass before ld overwrites a4 with the next one', correct: true, why: 'An anti dependence between trips: reading the old value must come before writing the new one.' },
    ],
  },
];
