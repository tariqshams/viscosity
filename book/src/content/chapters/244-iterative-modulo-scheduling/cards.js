// Cards for "Iterative modulo scheduling": recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'mod-row': {
    q: 'In a modulo schedule with interval II, which row of the reservation table does an instruction at time t use, and why?',
    a: 'Row t mod II: a new trip starts every II cycles with the same schedule, so times that differ by a multiple of II land in the same cycle of the running loop.',
  },
  resmii: {
    q: 'In modulo scheduling, a kind of fully pipelined unit is used 3 times per trip, and the machine has 2 such units. What does that say about II?',
    a: 'II ≥ ⌈3 ÷ 2⌉ = 2: two units give 2 × II cells, and 3 uses must fit.',
  },
  recmii: {
    q: 'In a modulo-scheduled loop, a multiply with delay 3 feeds itself in the next trip. What lower bound does that set on II?',
    a: 'II ≥ 3 (RecMII = ⌈3 ÷ 1⌉): each trip must wait for the previous trip\'s product, however many multipliers there are.',
  },
  'mii-max': {
    q: 'How is the minimum initiation interval MII worked out from ResMII and RecMII?',
    a: 'MII = max(ResMII, RecMII): both are lower bounds, so II must meet the larger one.',
  },
  distance: {
    q: 'What is the **distance** of a loop-carried edge?',
    a: 'How many trips ahead it reaches: 1 if the value is used by the very next trip.',
  },
  evict: {
    q: 'What does Rau\'s iterative modulo scheduling do when an instruction will not fit at the current II?',
    a: 'It places it anyway and evicts the instructions it collides with, to be placed again, within a budget; only when the budget runs out does it try II + 1.',
  },
  'stage-calc': {
    q: 'In a modulo schedule with II = 3, an instruction is scheduled at t = 7. Which stage is it in, and which row of the reservation table?',
    a: 'Stage ⌊7 ÷ 3⌋ = 2, row 7 mod 3 = 1.',
  },
  'raise-ii': {
    q: 'Why can a modulo scheduler always succeed eventually by raising II?',
    a: 'With a large enough II, trips barely overlap and every instruction gets its own slot, so the schedule degrades towards the plain loop.',
  },
};

export const examples = {
  mii: {
    title: 'The minimum initiation interval',
    code: `// uses per trip, and units per cycle
const uses = { MEM: 1, MUL: 1, ALU: 3 };
const units = { MEM: 1, MUL: 1,
  ALU: 1 };
let res = 0;
for (const u in uses) {
  const need = uses[u] / units[u];
  res = Math.max(res, Math.ceil(need));
}
// recurrences: [total delay, distance]
const recs = [[1, 1], [1, 1]];
let rec = 0;
for (const [d, n] of recs) {
  rec = Math.max(rec, Math.ceil(d / n));
}
console.log('ResMII', res);
console.log('RecMII', rec);
console.log('MII', Math.max(res, rec));`,
  },
};

export const exercises = {
  modsched: {
    title: 'A modulo scheduler',
    prompt: 'Write `modSched(ops, II)`. `ops` is a list of instructions in priority order; each is `{ unit, preds }`, where `preds` holds `[p, d, n]` triples: an edge from `ops[p]` with delay `d` and distance `n`. Place the instructions one by one. For each, its earliest time is the largest `t[p] + d - n * II` over the preds **already placed** (and at least 0); try that time and the next `II - 1` times, taking the first whose row `t % II` of its `unit` is free. If none is free, return `null`. At the end, check **every** edge, `t[k] >= t[p] + d - n * II`, and return `null` if any fails (that catches recurrences that are too tight). Otherwise return the times. For the chapter\'s loop at II = 3 the answer is `[0, 3, 6, 1, 2]`.',
    starter: `function modSched(ops, II) {
  const t = new Array(ops.length)
    .fill(null);
  // your code here
  return t;
}`,
    solution: `function modSched(ops, II) {
  const t = new Array(ops.length)
    .fill(null);
  const used = new Set();
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    let e = 0;
    for (const [p, d, n] of op.preds) {
      if (t[p] === null) continue;
      const lo = t[p] + d - n * II;
      e = Math.max(e, lo);
    }
    for (let x = e; x < e + II; x++) {
      const cell = op.unit + (x % II);
      if (!used.has(cell)) {
        used.add(cell);
        t[k] = x;
        break;
      }
    }
    if (t[k] === null) return null;
  }
  for (let k = 0; k < ops.length; k++) {
    const ps = ops[k].preds;
    for (const [p, d, n] of ps) {
      if (t[k] < t[p] + d - n * II) {
        return null;
      }
    }
  }
  return t;
}`,
    tests: `// ld, mul, add, addi, bne
const loop = [
  { unit: 'MEM', preds: [[3, 1, 1]] },
  { unit: 'MUL', preds: [[0, 3, 0]] },
  { unit: 'ALU', preds: [[1, 3, 0],
    [2, 1, 1]] },
  { unit: 'ALU', preds: [[0, 0, 0],
    [3, 1, 1]] },
  { unit: 'ALU', preds: [[3, 1, 0]] },
];
test('the loop at II = 3', () => {
  expect(modSched(loop, 3))
    .toEqual([0, 3, 6, 1, 2]);
});
test('II = 2 is too small for 3 ALU ops', () => {
  expect(modSched(loop, 2)).toBe(null);
});
const rec = [
  { unit: 'MUL', preds: [[0, 3, 1]] },
];
test('a recurrence rejects II = 2', () => {
  expect(modSched(rec, 2)).toBe(null);
});
test('and accepts II = 3', () => {
  expect(modSched(rec, 3)).toEqual([0]);
});`,
    hints: [
      'Keep a set of used cells, one per unit and row, for example the string `\'ALU1\'` for row 1 of the ALU. Place the instructions in the order given.',
      'For each instruction: start from `e = 0`, raise it to `t[p] + d - n * II` for each pred already placed, then loop `x` from `e` to `e + II - 1` looking for a free cell `unit + (x % II)`. If the loop ends without placing it, return `null`.',
      'After placing everything, loop over every instruction and every pred again, including ones that were not placed yet when the instruction was placed (and an instruction\'s edge to itself), and return `null` if `t[k] < t[p] + d - n * II`.',
    ],
    walkthrough: `**How to think about it.** This is list scheduling with two changes. First, time wraps: an instruction at time x uses row x mod II of its unit, because every trip uses the same schedule and a new one starts every II cycles. Second, edges can reach across trips: an edge with distance \`n\` lets the later instruction start \`n * II\` cycles "earlier" in its own trip's clock, because its trip started that much later. While placing, we can only respect edges from instructions already placed; edges that come back round the loop (including an instruction feeding itself) are checked at the end. Trying only II consecutive times is enough, because after II tries every row has been seen once; if none is free, this II cannot work this way.

**The solution, line by line.**

- \`const t = new Array(ops.length).fill(null);\` marks every instruction as unplaced.
- \`const used = new Set();\` holds the occupied cells of the reservation table, as strings like \`'MEM0'\`.
- \`for (let k = 0; k < ops.length; k++) {\` places the instructions in priority order.
- \`const op = ops[k];\` names the instruction being placed; \`let e = 0;\` and the loop over \`op.preds\` compute the earliest legal time: for each pred \`p\` already placed, \`t[p] + d - n * II\`. Unplaced preds are skipped with \`continue\`.
- \`for (let x = e; x < e + II; x++) {\` tries II consecutive times, which between them cover every row once.
- \`const cell = op.unit + (x % II);\` names the cell this time would use; if it is free, we take it, record the time and stop looking.
- \`if (t[k] === null) return null;\` gives up when every row of this unit is taken.
- The last double loop checks every edge with the final times. For the recurrence \`x = x * c\` at II = 2, the multiply is placed at 0, and its edge to itself needs \`0 >= 0 + 3 - 1 * 2\`, that is \`0 >= 1\`: false, so II = 2 is rejected, while at II = 3 it needs \`0 >= 0\`, which holds.

For the loop at II = 3: ld at 0 (MEM0); mul at 3 (MUL0); add at 6 (ALU0); addi's earliest is 0, but ALU0 is taken, so 1 (ALU1); bne's earliest is 1 + 1 = 2 (ALU2). The final check passes: for example the next trip's ld needs \`0 >= 1 + 1 - 3\`.

**Common wrong attempts.**

- Forgetting the \`% II\` and marking cells by the time itself. Then no two instructions ever clash (every time is different), so II = 2 is accepted for three ALU instructions, which the machine cannot run.
- Skipping the final check. The recurrence test then accepts II = 2 for a multiply that needs 3 cycles to feed itself: the next trip would use the product before it exists.`,
    wrong: [
      {
        code: `function modSched(ops, II) {
  const t = new Array(ops.length)
    .fill(null);
  const used = new Set();
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    let e = 0;
    for (const [p, d, n] of op.preds) {
      if (t[p] === null) continue;
      const lo = t[p] + d - n * II;
      e = Math.max(e, lo);
    }
    let x = e;
    while (used.has(op.unit + x)) x++;
    used.add(op.unit + x);
    t[k] = x;
  }
  return t;
}`,
        why: 'Cells are keyed by the time, not the time mod II, so clashes between trips are never seen; II = 2 is wrongly accepted.',
      },
      {
        code: `function modSched(ops, II) {
  const t = new Array(ops.length)
    .fill(null);
  const used = new Set();
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    let e = 0;
    for (const [p, d, n] of op.preds) {
      if (t[p] === null) continue;
      const lo = t[p] + d - n * II;
      e = Math.max(e, lo);
    }
    for (let x = e; x < e + II; x++) {
      const cell = op.unit + (x % II);
      if (!used.has(cell)) {
        used.add(cell);
        t[k] = x;
        break;
      }
    }
    if (t[k] === null) return null;
  }
  return t;
}`,
        why: 'No final check, so an edge back round the loop is never tested: the recurrence is accepted at II = 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a modulo schedule with II = 4, instruction a is at t = 1 and instruction b, on the same single unit, at t = 9. Do they clash?',
    options: [
      {
        t: 'No, they are 8 cycles apart',
        why: 'They are in different trips\' clocks; what matters is the remainder after dividing by II.',
      },
      {
        t: 'Yes: 1 mod 4 = 9 mod 4 = 1, so the running loop needs the unit for both in the same cycle',
        correct: true,
        why: 'Times equal modulo II land in the same row of the reservation table.',
      },
      {
        t: 'Only if they are in the same trip',
        why: 'The clash is between different trips that are in flight at the same moment.',
      },
    ],
  },
  {
    q: 'A loop uses the single memory unit 4 times per trip and the single ALU twice. It has no recurrences. What is MII?',
    options: [
      {
        t: '2',
        why: 'That is the ALU\'s bound; the memory unit needs more.',
      },
      {
        t: '6',
        why: 'Different units work in parallel, so their uses are not added together.',
      },
      {
        t: '4',
        correct: true,
        why: 'ResMII is the largest per-unit bound, ⌈4 ÷ 1⌉ = 4; RecMII is 0 or 1; the maximum is 4.',
      },
    ],
  },
  {
    q: 'A loop computes `x = x * c` with a 3-cycle multiply. Adding a second multiplier to the machine changes MII how?',
    options: [
      {
        t: 'Not at all: RecMII = 3 still holds, because each multiply needs the previous one\'s result',
        correct: true,
        why: 'A recurrence is a chain of waiting, not a shortage of units.',
      },
      {
        t: 'It halves MII',
        why: 'More units lower ResMII, but this loop is limited by its recurrence.',
      },
      {
        t: 'It makes MII 1',
        why: 'The multiply still takes 3 cycles to produce the value the next trip needs.',
      },
    ],
  },
  {
    q: 'What does an edge with distance 1 and delay 3 from a to b require, at interval II?',
    options: [
      {
        t: 't(b) ≥ t(a) + 3',
        why: 'That ignores the fact that b\'s trip starts II cycles after a\'s.',
      },
      {
        t: 't(b) ≥ t(a) + 3 − II',
        correct: true,
        why: 'b belongs to the next trip, which starts II cycles later, so in its own clock it can be II cycles earlier.',
      },
      {
        t: 't(b) = t(a) + 3',
        why: 'It is a lower bound, not an equality: b may start later.',
      },
    ],
  },
  {
    q: 'What does "iterative" add in Rau\'s iterative modulo scheduling?',
    options: [
      {
        t: 'It schedules the loop again after every trip',
        why: 'Scheduling happens once, at compile time.',
      },
      {
        t: 'It unrolls the loop before scheduling it',
        why: 'Unrolling is a different technique; modulo scheduling works on one copy of the body.',
      },
      {
        t: 'When an instruction does not fit, it places it anyway, evicts what it collides with, and retries them, within a budget, before raising II',
        correct: true,
        why: 'That limited backtracking is what lets it reach MII on loops where plain greedy placement fails.',
      },
    ],
  },
];
