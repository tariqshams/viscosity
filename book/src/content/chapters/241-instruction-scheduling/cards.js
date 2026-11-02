// Chapter 236 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'latency-what': {
    q: 'What is the **latency** of an instruction?',
    a: 'The number of cycles from when it starts to when an instruction that uses its result can start (3 for a load or multiply on our toy machine, 1 for most others).',
  },
  'stall-what': {
    q: 'What is a **stall**?',
    a: 'A cycle in which no instruction starts, because the next one in order is still waiting for an operand.',
  },
  'sched-keeps': {
    q: 'Instruction scheduling may change the order of a block. What must it never change?',
    a: 'What the block computes: every value read must still be the value the original order would have read.',
  },
  'true-dep': {
    q: 'In `ld a3, 0(a0)` followed by `mul a3, a3, a3`, what kind of dependence is there, and what delay does it get?',
    a: 'A true dependence (mul reads the a3 that ld writes), with the load\'s latency as the delay: 3 cycles on our toy machine.',
  },
  'anti-dep': {
    q: 'Why may `addi a0, a0, 8` not move above `ld a3, 0(a0)`?',
    a: 'It is an anti dependence: the load must read the old a0, so the instruction that overwrites a0 has to come after it.',
  },
  'dag-acyclic': {
    q: 'Why can a block\'s dependence graph never contain a cycle?',
    a: 'Every edge goes from an earlier instruction to a later one in the original order, so you can never follow edges back to where you started.',
  },
  'critical-path': {
    q: 'What is the **critical path** of a dependence DAG, and why does it matter?',
    a: 'The longest path through it, adding up the delays. No schedule can finish sooner than that, however clever.',
  },
  'memory-edge': {
    q: 'When must a store and a later load keep their order?',
    a: 'Whenever their addresses might be the same; only if alias analysis proves they never overlap may they swap.',
  },
};

export const examples = {
  dag: {
    title: 'Building the DAG of the loop body',
    code: `const body = [
  ['ld', 'a3', ['a0']],
  ['mul', 'a3', ['a3']],
  ['add', 'a2', ['a3', 'a2']],
  ['addi', 'a0', ['a0']],
];
const lat = { ld: 3, mul: 3 };
const lastW = {};
const readers = {};
body.forEach(([op, dst, src], j) => {
  for (const r of src) {
    if (r in lastW) {
      const i = lastW[r];
      const d = lat[body[i][0]] ?? 1;
      console.log(body[i][0], '->', op,
        'true', d);
    }
  }
  for (const i of readers[dst] ?? []) {
    console.log(body[i][0], '->', op,
      'anti', 0);
  }
  const out = dst in lastW;
  if (out && !src.includes(dst)) {
    const i = lastW[dst];
    console.log(body[i][0], '->', op,
      'output', 1);
  }
  for (const r of src) {
    (readers[r] ??= []).push(j);
  }
  lastW[dst] = j;
  readers[dst] = [];
});`,
  },
};

export const exercises = {
  earliest: {
    title: 'The earliest start of every instruction',
    prompt: 'Write `earliest(n, edges)`. There are `n` instructions, numbered `0` to `n - 1` in their original order, and `edges` is a list of `[from, to, delay]` triples (always `from < to`), in **any** order. Return an array giving, for each instruction, the earliest cycle it could start if the machine could start any number of instructions at once: `0` for an instruction with no edges into it, and otherwise the largest `start[from] + delay` over the edges into it. For the loop body `ld, mul, add, addi, bne` with edges `[[0,1,3],[1,2,3],[0,3,0],[3,4,1],[2,4,1]]` the answer is `[0, 3, 6, 0, 7]`.',
    starter: `function earliest(n, edges) {
  const start = new Array(n).fill(0);
  // your code here
  return start;
}

console.log(earliest(5, [[0, 1, 3],
  [1, 2, 3], [0, 3, 0], [3, 4, 1],
  [2, 4, 1]]));`,
    solution: `function earliest(n, edges) {
  const start = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (const [a, b, d] of edges) {
      if (b === j) {
        start[j] = Math.max(start[j],
          start[a] + d);
      }
    }
  }
  return start;
}`,
    tests: `test('the loop body', () => {
  expect(earliest(5, [[0, 1, 3], [1, 2, 3],
    [0, 3, 0], [3, 4, 1], [2, 4, 1]]))
    .toEqual([0, 3, 6, 0, 7]);
});
test('no edges: everything at 0', () => {
  expect(earliest(3, [])).toEqual([0, 0, 0]);
});
test('a diamond takes the longer side', () => {
  expect(earliest(4, [[0, 1, 1], [0, 2, 4],
    [1, 3, 1], [2, 3, 1]]))
    .toEqual([0, 1, 4, 5]);
});
test('edges listed in reverse order', () => {
  expect(earliest(3, [[1, 2, 3], [0, 1, 3]]))
    .toEqual([0, 3, 6]);
});`,
    hints: [
      'An instruction can start once **every** instruction with an edge into it has started and its delay has passed. Which of those matters most?',
      'The one that finishes waiting last: take the **maximum** of `start[from] + delay` over the edges into it. To use `start[from]`, it must already be final.',
      'Because every edge has `from < to`, visiting the instructions in order `j = 0, 1, 2, ...` guarantees every predecessor is done. For each `j`, loop over all edges and keep those with `to === j`.',
    ],
    walkthrough: `**How to think about it.** Picture the DAG with every instruction waiting at a gate. The gate for instruction B opens only when, for every arrow A → B, A has started and d(A, B) more cycles have passed; so B's earliest start is the latest of those moments, a maximum, not a sum. That is the formal rule \`S(B) ≥ S(A) + d(A, B)\` from the chapter, taken with equality for the tightest edge. The one trap is order: to compute B's start we need the final start of every A that points into it. Since edges always point forwards (\`from < to\`), going through the instructions in their original order is enough.

**The solution, line by line.**

- \`const start = new Array(n).fill(0);\` gives every instruction a start of 0, which is right for any instruction with no edges into it.
- \`for (let j = 0; j < n; j++) {\` visits the instructions in their original order, so when we reach \`j\` every instruction before it already has its final start.
- \`for (const [a, b, d] of edges) {\` looks at every edge, unpacking it into its source \`a\`, target \`b\` and delay \`d\`.
- \`if (b === j) {\` keeps only the edges that point into the instruction we are working on.
- \`start[j] = Math.max(start[j], start[a] + d);\` says "j cannot start before a has started and d cycles have passed", and keeps the largest such bound seen so far.
- \`return start;\` hands back the whole array. For the loop body: ld 0; mul 0 + 3 = 3; add 3 + 3 = 6; addi 0 + 0 = 0; bne is max(0 + 1, 6 + 1) = 7.

Looping over every edge for every instruction does \`n\` times the number of edges in work; a real compiler would first group the edges by target, but for a block of a few dozen instructions this is fine.

**Common wrong attempts.**

- Walking the edges once, in the order given, and updating \`start[b]\` from \`start[a]\`: if an edge into \`a\` comes later in the list, \`start[a]\` was still 0 when it was used. The test with reversed edges gives \`[0, 3, 3]\` instead of \`[0, 3, 6]\`.
- Adding up the delays of all incoming edges instead of taking the largest: two edges into one instruction are waited for at the same time, not one after the other, so the diamond comes out as \`[0, 1, 4, 7]\` instead of \`[0, 1, 4, 5]\`.`,
    wrong: [
      {
        code: `function earliest(n, edges) {
  const start = new Array(n).fill(0);
  for (const [a, b, d] of edges) {
    start[b] = Math.max(start[b],
      start[a] + d);
  }
  return start;
}`,
        why: 'One pass in the given order uses `start[a]` before it is final when the edges are not sorted; the reversed test gives `[0, 3, 3]`.',
      },
      {
        code: `function earliest(n, edges) {
  const start = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (const [a, b, d] of edges) {
      if (b === j) {
        start[j] += start[a] + d;
      }
    }
  }
  return start;
}`,
        why: 'Waiting for two predecessors takes as long as the slower one, not their sum; the diamond gives `[0, 1, 4, 7]`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'On the toy machine (one instruction per cycle, in order; load and multiply take 3 cycles, others 1), `ld a3, 0(a0)` starts in cycle 0. In which cycle does the next instruction, `mul a3, a3, a3`, start?',
    options: [
      {
        t: 'Cycle 1',
        why: 'That would be true if the loaded value were ready on the very next cycle; it takes 3.',
      },
      {
        t: 'Cycle 3',
        correct: true,
        why: 'The value of a3 is ready 3 cycles after the load starts, so mul waits through two stalls (cycles 1 and 2) and starts in cycle 3.',
      },
      {
        t: 'Cycle 6',
        why: 'That adds the multiply\'s own latency as well, but the multiply only waits for the load.',
      },
    ],
  },
  {
    q: 'Which reordering of the loop body is **not** allowed?',
    options: [
      {
        t: 'Moving `addi a0, a0, 8` to just after `mul`',
        why: 'Allowed: addi only has to come after the ld that reads a0, and it still does. This is the order clang chose.',
      },
      {
        t: 'Moving `addi a0, a0, 8` above `ld a3, 0(a0)`',
        correct: true,
        why: 'Not allowed as written: the load would read the new pointer and fetch the wrong element (an anti dependence is broken).',
      },
      {
        t: 'Leaving the order exactly as it is',
        why: 'Always allowed: the original order respects every dependence. It is only slower.',
      },
    ],
  },
  {
    q: 'What is the delay on a true dependence edge from A to B?',
    options: [
      {
        t: 'Always 1',
        why: 'That is the delay of a simple ALU instruction, not of every instruction.',
      },
      {
        t: 'The latency of B',
        why: 'It is A\'s result that B waits for, so it is A\'s latency that counts.',
      },
      {
        t: 'The latency of A',
        correct: true,
        why: 'B reads what A writes, so B waits until A\'s result is ready: A\'s latency.',
      },
    ],
  },
  {
    q: 'The critical path of a block\'s DAG has length 7. What can you say about any schedule of it?',
    options: [
      {
        t: 'Its last instruction starts no earlier than cycle 7',
        correct: true,
        why: 'Along that path each instruction must wait for the one before, so the last one cannot start before the sum of the delays.',
      },
      {
        t: 'It takes exactly 7 cycles',
        why: 'The critical path is a lower bound; a machine that runs out of issue slots can take longer.',
      },
      {
        t: 'It has 7 instructions',
        why: 'The length is a sum of delays, not a count of instructions.',
      },
    ],
  },
  {
    q: 'Why do small in-order RISC-V cores benefit more from scheduling than big out-of-order cores?',
    options: [
      {
        t: 'In-order cores have no latency',
        why: 'They have latency all the same; what they lack is a way to work around it.',
      },
      {
        t: 'An in-order core runs instructions in exactly the given order, so a stall the compiler leaves in stays in',
        correct: true,
        why: 'Out-of-order cores reorder within a window in hardware; an in-order core relies entirely on the compiler\'s order.',
      },
      {
        t: 'Out-of-order cores cannot run RISC-V',
        why: 'Many RISC-V cores are out of order; the instruction set does not decide that.',
      },
    ],
  },
];
