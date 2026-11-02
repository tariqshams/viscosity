// Chapter 235-b cards (staged split of 235): recall prompts, examples,
// exercises and quiz. Keys are stable ids.

export const prompts = {
  'ready-what': {
    q: 'When is an instruction **ready** in cycle c?',
    a: 'When every instruction it depends on has started, and each of their delays has passed by cycle c.',
  },
  'height-what': {
    q: 'What is the **height** of an instruction in a dependence DAG?',
    a: 'The longest chain of delays from it to the end of the block (0 for an instruction with nothing after it).',
  },
  'height-direction': {
    q: 'Why are heights computed from the bottom of the block upwards?',
    a: 'Each height is built from the heights of the instructions after it, so those must be known first.',
  },
  'greedy-final': {
    q: 'Does list scheduling ever undo a choice it made in an earlier cycle?',
    a: 'No. It is greedy: once an instruction is started in a cycle, that is final. That makes it fast, but not always optimal.',
  },
  'stall-when': {
    q: 'What does list scheduling do in a cycle where the ready list is empty?',
    a: 'Nothing starts: the cycle is a stall, and it moves on to the next cycle.',
  },
  'pressure-what': {
    q: 'What is **register pressure**?',
    a: 'The number of values alive at one point in the code, each of which needs a register.',
  },
  'before-after': {
    q: 'What is the risk of scheduling **before** register allocation?',
    a: 'The scheduler overlaps work freely and may keep more values alive than there are registers, forcing spills.',
  },
  'reuse-pins': {
    q: 'Why does scheduling **after** register allocation have less freedom?',
    a: 'Reusing a register adds anti and output dependences between unrelated values, which pin instructions in place.',
  },
};

export const examples = {
  heights: {
    title: 'Heights in one backwards pass',
    code: `// [from, to, delay] for two trips
const edges = [
  [0, 1, 3], [1, 2, 3], [3, 4, 3],
  [4, 5, 3], [2, 5, 1],
];
const names = ['ld a3', 'mul a3',
  'add a2', 'ld a4', 'mul a4',
  'add a2'];
const h = new Array(6).fill(0);
for (let i = 5; i >= 0; i--) {
  for (const [a, b, d] of edges) {
    if (a === i) {
      h[i] = Math.max(h[i], d + h[b]);
    }
  }
}
names.forEach((n, i) => {
  console.log(n, 'h =', h[i]);
});`,
  },
};

const helpers = `function heights(n, edges) {
  const h = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    for (const [a, b, d] of edges) {
      if (a === i) {
        h[i] = Math.max(h[i], d + h[b]);
      }
    }
  }
  return h;
}

// Can j start in cycle c?
function ready(j, c, start, edges) {
  for (const [a, b, d] of edges) {
    if (b !== j) continue;
    if (start[a] < 0) return false;
    if (start[a] + d > c) return false;
  }
  return true;
}
`;

export const exercises = {
  listsched: {
    title: 'A list scheduler',
    prompt:
      'Write `listSchedule(n, edges)` for a machine that starts **one** instruction per cycle. Instructions are numbered `0` to `n - 1`; `edges` holds `[from, to, delay]` triples. Return an array of start cycles. In each cycle `c = 0, 1, 2, ...`, among the unscheduled instructions that are `ready(j, c, start, edges)`, start the one with the greatest height (ties: the lowest number); if none is ready, the cycle is a stall. Stop when every instruction has a start. The helpers `heights` and `ready` are written for you. For the loop body `[[0,1,3],[1,2,3],[0,3,0],[3,4,1],[2,4,1]]` the answer is `[0, 3, 6, 1, 7]`.',
    starter: helpers + `
function listSchedule(n, edges) {
  const h = heights(n, edges);
  const start = new Array(n).fill(-1);
  // your code here
  return start;
}`,
    solution: helpers + `
function listSchedule(n, edges) {
  const h = heights(n, edges);
  const start = new Array(n).fill(-1);
  let done = 0;
  for (let c = 0; done < n; c++) {
    let best = -1;
    for (let j = 0; j < n; j++) {
      if (start[j] >= 0) continue;
      if (!ready(j, c, start, edges)) {
        continue;
      }
      if (best < 0 || h[j] > h[best]) {
        best = j;
      }
    }
    if (best >= 0) {
      start[best] = c;
      done++;
    }
  }
  return start;
}`,
    tests: `test('the loop body', () => {
  expect(listSchedule(5, [[0, 1, 3],
    [1, 2, 3], [0, 3, 0], [3, 4, 1],
    [2, 4, 1]])).toEqual([0, 3, 6, 1, 7]);
});
test('two trips overlap', () => {
  expect(listSchedule(6, [[0, 1, 3],
    [1, 2, 3], [3, 4, 3], [4, 5, 3],
    [2, 5, 1]]))
    .toEqual([0, 3, 6, 1, 4, 7]);
});
test('the long wait goes first', () => {
  expect(listSchedule(3, [[1, 2, 3]]))
    .toEqual([1, 0, 3]);
});
test('ties go to the lower number', () => {
  expect(listSchedule(2, [])).toEqual([0, 1]);
});`,
    hints: [
      'You need two loops: an outer one over cycles `c`, which runs until every instruction is scheduled, and an inner one over the instructions, looking for the best ready one.',
      'Keep a counter `done` of scheduled instructions and loop `for (let c = 0; done < n; c++)`. In each cycle, start with `best = -1` and look at every `j` that is not yet scheduled (`start[j] < 0`) and is `ready(j, c, start, edges)`.',
      'Replace `best` when `best < 0 || h[j] > h[best]` (strictly greater, so ties keep the lower number). After the inner loop, if `best >= 0`, set `start[best] = c` and add one to `done`; otherwise the cycle is a stall and you do nothing.',
    ],
    walkthrough: `**How to think about it.** List scheduling is a simulation of the machine. Time moves forward one cycle at a time; in each cycle the machine can start one instruction, so the scheduler's whole job in that cycle is to choose which one (or none). "Which one" has two parts: it must be allowed now (ready: every predecessor started and its delay has passed), and among the allowed ones it should be the most urgent (largest height). The loop ends when everything has a start cycle. Because an instruction becomes ready only after its predecessors have started, and time keeps moving, the loop always finishes.

**The solution, line by line.**

- \`const h = heights(n, edges);\` computes every height once, before scheduling, with the backwards pass from the chapter.
- \`const start = new Array(n).fill(-1);\` marks every instruction as not yet scheduled; \`-1\` can never be a real cycle.
- \`let done = 0;\` counts how many instructions have a start.
- \`for (let c = 0; done < n; c++) {\` is the clock: cycle 0, 1, 2, ... until all are scheduled.
- \`let best = -1;\` means "nothing chosen yet in this cycle".
- \`for (let j = 0; j < n; j++) {\` looks at every instruction, in their original order (which is what makes ties go to the lower number).
- \`if (start[j] >= 0) continue;\` skips instructions that already started in an earlier cycle.
- \`if (!ready(j, c, start, edges)) { continue; }\` skips instructions whose predecessors have not started, or whose delays have not passed by cycle \`c\`.
- \`if (best < 0 || h[j] > h[best]) { best = j; }\` keeps the ready instruction with the greatest height so far. The \`>\` is strict, so an equal height later in the list does not replace an earlier one.
- \`if (best >= 0) { start[best] = c; done++; }\` starts the winner in this cycle. If \`best\` is still \`-1\`, nothing was ready: this is a stall, and the clock moves on.

On the test \`listSchedule(3, [[1, 2, 3]])\`, instruction 1 (a load, height 3) and instruction 0 (height 0) are both ready in cycle 0; the load wins, 0 fills cycle 1, and 2 starts in cycle 3: four cycles, where taking 0 first would give five.

**Common wrong attempts.**

- Starting the **first** ready instruction instead of the highest one. This is just the original order with stalls, and on the third test it gives \`[0, 1, 4]\`: the load starts a cycle late and everything after it waits.
- Checking only that the predecessors have started, not that their delays have passed. Then \`mul\` starts in the cycle after \`ld\`, before its value exists; the first test gives \`[0, 1, 2, 3, 4]\`, a schedule the machine cannot run correctly.`,
    wrong: [
      {
        code: helpers + `
function listSchedule(n, edges) {
  const start = new Array(n).fill(-1);
  let done = 0;
  for (let c = 0; done < n; c++) {
    for (let j = 0; j < n; j++) {
      if (start[j] >= 0) continue;
      if (ready(j, c, start, edges)) {
        start[j] = c;
        done++;
        break;
      }
    }
  }
  return start;
}`,
        why: 'This takes the first ready instruction, ignoring height, so the long-latency load in the third test starts a cycle late: `[0, 1, 4]`.',
      },
      {
        code: helpers + `
function listSchedule(n, edges) {
  const h = heights(n, edges);
  const start = new Array(n).fill(-1);
  let done = 0;
  for (let c = 0; done < n; c++) {
    let best = -1;
    for (let j = 0; j < n; j++) {
      if (start[j] >= 0) continue;
      const ok = edges.every(([a, b]) =>
        b !== j || start[a] >= 0);
      if (!ok) continue;
      if (best < 0 || h[j] > h[best]) {
        best = j;
      }
    }
    if (best >= 0) {
      start[best] = c;
      done++;
    }
  }
  return start;
}`,
        why: 'It forgets the delays: an instruction counts as ready as soon as its predecessors have started, so mul starts before the loaded value exists.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In one cycle, the ready list holds an `ld` with height 6 and an `addi` with height 1. On a machine that starts one instruction per cycle, which does list scheduling start?',
    options: [
      { t: 'The `addi`, because it is quicker', why: 'Being quick is a reason to put it later: it can fill a gap while the load waits.' },
      { t: 'The `ld`, because it has the greater height', correct: true, why: 'Height is the priority: the load has a long chain behind it, so starting it late would delay the whole block.' },
      { t: 'Neither: two ready instructions is a conflict', why: 'Having several ready instructions is the normal case; the priority decides between them.' },
    ],
  },
  {
    q: 'The heights of a block are 7, 4, 1, 6, 3 and 0. Which instruction has nothing after it in the DAG?',
    options: [
      { t: 'The one with height 7', why: 'That one has the longest chain after it.' },
      { t: 'The first one in the block', why: 'Position in the block does not decide the height; the chain after the instruction does.' },
      { t: 'The one with height 0', correct: true, why: 'Height 0 means no successors at all: nothing is waiting for it.' },
    ],
  },
  {
    q: 'Why do compilers use a greedy method like list scheduling rather than trying every order?',
    options: [
      { t: 'The number of orders grows like a factorial, far too many to try for real blocks', correct: true, why: 'Thirty instructions already have about 2.6 × 10³² orders; a greedy method is fast and usually close to the best.' },
      { t: 'Every order of a block runs in the same number of cycles', why: 'The chapter\'s two-trip block takes 14 cycles in one order and 8 in another.' },
      { t: 'List scheduling always finds the best order', why: 'It often does, but it never revisits a choice, so it can miss the best.' },
    ],
  },
  {
    q: 'A list schedule overlaps two loads so that their values are alive at the same time. What is the risk?',
    options: [
      { t: 'The program computes a different answer', why: 'The schedule respects every dependence, so the answer is the same.' },
      { t: 'The loads take longer', why: 'Their latency does not change.' },
      { t: 'More registers are needed, and if there are not enough, spills add loads and stores', correct: true, why: 'Overlap raises register pressure; past the number of registers, spilling can cost more than the stalls saved.' },
    ],
  },
  {
    q: 'What does LLVM\'s default machine scheduler do about the clash with register allocation?',
    options: [
      { t: 'It schedules only after register allocation', why: 'Its main run is before allocation; a post-allocation scheduler is an extra pass.' },
      { t: 'It schedules before allocation while tracking register pressure, and can schedule again after allocation', correct: true, why: 'Its comments say it drives list scheduling while updating register pressure, and it has both pre- and post-allocation modes.' },
      { t: 'It ignores register pressure, because RISC-V has enough registers', why: 'It tracks register pressure explicitly; 32 registers run out quickly in an unrolled loop.' },
    ],
  },
];
