// Chapter 51 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 52, 52, 52.

export const prompts = {
  'prefetch-what': {
    q: 'What does the hardware **prefetcher** do?',
    a: 'It watches which lines a program reads and fetches the ones it predicts come next, before they are asked for.',
  },
  'prefetch-patterns': {
    q: 'Which access patterns can a prefetcher follow?',
    a: 'Simple ones: forwards or backwards, through a few arrays at once, with a small or medium steady stride.',
  },
  'backwards-ok': {
    q: 'Can the prefetcher help a loop that walks an array from the last element to the first?',
    a: 'Yes: a steady negative stride is still a simple pattern.',
  },
  'shuffle-why': {
    q: 'Two loops read the same million elements, one in order and one shuffled. Why is the shuffled one slower?',
    a: 'The prefetcher can’t predict a shuffled order, so misses are no longer fetched ahead of time.',
  },
  'chase-what': {
    q: 'What is **pointer chasing**?',
    a: 'Following a chain of pointers, where each load needs the address that the previous load produced.',
  },
  'chase-why': {
    q: 'Why can’t the CPU start the next step of a pointer chase early?',
    a: 'The next address is stored inside the data it is still waiting for.',
  },
  'overlap-why': {
    q: 'A shuffled loop reads `x[idx[i]]` from a Float64Array. Why can its misses still overlap?',
    a: 'Each address comes straight from `idx[i]`, which is known without waiting, so the CPU can send several reads at once.',
  },
  'tree-chase': {
    q: 'Why is walking a tree of objects (like a syntax tree) pointer chasing?',
    a: 'Each child is reached through a pointer stored in its parent, so you must load the parent before you know where the child is.',
  },
  'pipeline-what': {
    q: 'What is a CPU **pipeline**?',
    a: 'Splitting instructions into stages and working on several at once, each in a different stage, like an assembly line.',
  },
  'stage-ticks': {
    q: 'With a 4-stage pipeline and nothing waiting, how many ticks do 100 instructions take, and how many without a pipeline?',
    a: '103 with it (4 + 99); 400 without (100 × 4).',
  },
  'dependent-wait': {
    q: 'Why does `d = a + 1` straight after `a = b + c` leave a gap in the pipeline?',
    a: 'It needs the value of `a`, so it cannot execute until the instruction before it has finished.',
  },
  'why-guess': {
    q: 'Why must a pipelined CPU guess which way an `if` will go?',
    a: 'The answer comes late, at execute; to keep the pipeline full it must fetch the next instructions before then.',
  },
  'mispredict-cost': {
    q: 'What happens when a branch prediction turns out wrong?',
    a: 'The work done on the wrong path is thrown away, and the pipeline refills from the right one.',
  },
  'sorted-why': {
    q: 'Why does `if (v < 50)` predict better over sorted data than over random data?',
    a: 'Sorted data gives a long run of trues then a long run of falses: one switch. Random data switches unpredictably.',
  },
  'rare-branch': {
    q: 'Why does a check that almost never fails, like an error check, cost almost nothing?',
    a: 'The predictor learns it goes the same way every time, so its guess is almost always right.',
  },
  'loop-branch': {
    q: 'How often is a loop’s own test `i < n` mispredicted, over a long loop?',
    a: 'About once: at the very end, when it finally comes out false.',
  },
  'simd-what': {
    q: 'What does **SIMD** stand for, and what does it mean?',
    a: 'Single instruction, multiple data: one instruction applies the same operation to several values at once.',
  },
  'lane-what': {
    q: 'What is a **lane**?',
    a: 'One slot of a SIMD (vector) register, holding one of the values the instruction works on.',
  },
  'lanes-128': {
    q: 'How many 64-bit doubles fit in the lanes of a 128-bit register?',
    a: 'Two (128 ÷ 64). Four 32-bit floats would fit.',
  },
  'vectorize-what': {
    q: 'What does a compiler do when it **vectorises** a loop?',
    a: 'Rewrites it so each step handles several iterations at once with SIMD instructions, one element per lane.',
  },
  'float-order': {
    q: 'Why can’t a compiler freely vectorise a floating-point sum?',
    a: 'Lane-wise summing regroups the additions, and floating-point addition isn’t associative, so the result could change.',
  },
  overlap: {
    q: 'What happens if the arrays a vectorised loop reads and writes might overlap in memory?',
    a: 'The compiler must check for overlap (LLVM does it at run time) and use the plain loop when they overlap.',
  },
  gather: {
    q: 'Why does filling a SIMD register with `x` values from an array of structs need a *gather*?',
    a: 'The x values aren’t side by side: other fields sit between them (a stride), so each must be read separately.',
  },
  'js-simd': {
    q: 'Where can web code use explicit SIMD instructions today?',
    a: 'In WebAssembly (fixed-width 128-bit SIMD). JavaScript has no SIMD API: SIMD.js was withdrawn.',
  },
};

export const examples = {
  'order-matters': {
    title: 'Same reads, different order',
    code: `const n = 1 << 22; // 4M doubles: 32 MB
const x = new Float64Array(n);
const inOrder = new Int32Array(n);
for (let i = 0; i < n; i++) {
  inOrder[i] = i;
}

// shuffle a copy (Fisher-Yates)
const shuffled = inOrder.slice();
for (let i = n - 1; i > 0; i--) {
  const r = Math.random() * (i + 1);
  const j = Math.floor(r);
  const t = shuffled[i];
  shuffled[i] = shuffled[j];
  shuffled[j] = t;
}

function sum(order) {
  const t0 = performance.now();
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += x[order[i]];
  }
  return performance.now() - t0;
}

sum(inOrder);
sum(shuffled); // warm up
const a = sum(inOrder).toFixed(1);
const b = sum(shuffled).toFixed(1);
console.log('in order, ms:', a);
console.log('shuffled, ms:', b);`,
  },
  'sorted-branch': {
    title: 'Random vs sorted, in JavaScript',
    code: `const n = 1 << 20;
const xs = new Float64Array(n);
for (let i = 0; i < n; i++) {
  const r = Math.random() * 100;
  xs[i] = Math.floor(r);
}
const ys = xs.slice().sort();

function sumBelow(a) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] < 50) s += a[i];
  }
  return s;
}

function time(a) {
  const t0 = performance.now();
  sumBelow(a);
  return performance.now() - t0;
}

for (let k = 0; k < 3; k++) {
  time(xs);
  time(ys); // warm up
}
const a = time(xs).toFixed(2);
const b = time(ys).toFixed(2);
console.log('random, ms:', a);
console.log('sorted, ms:', b);
// same answer either way:
const s1 = sumBelow(xs);
const s2 = sumBelow(ys);
console.log('same sum:', s1 === s2);`,
  },
  'by-four': {
    title: 'A loop shaped like SIMD',
    code: `const a = [1, 2, 3, 4, 5, 6];
const b = [10, 20, 30, 40, 50, 60];
const c = [];
const W = 4; // lanes per step
let i = 0;
// full steps of W lanes
for (; i + W <= a.length; i += W) {
  for (let l = 0; l < W; l++) {
    c[i + l] = a[i + l] + b[i + l];
  }
}
// the tail that doesn't fill W lanes
for (; i < a.length; i++) {
  c[i] = a[i] + b[i];
}
console.log(c);`,
  },
};

export const exercises = {
  findStride: {
    title: 'Be the prefetcher',
    prompt: 'Write `findStride(xs)`, where `xs` is a list of addresses in the order they were read. If every gap between consecutive addresses is the same, return that gap (it may be negative: the reads go backwards). Otherwise, or if there are fewer than two addresses, return `null`: no pattern to follow.',
    starter: `function findStride(xs) {
  // your code here
}

console.log(findStride([0, 8, 16, 24]));`,
    solution: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  const d = xs[1] - xs[0];
  for (let i = 2; i < xs.length; i++) {
    if (xs[i] - xs[i - 1] !== d) {
      return null;
    }
  }
  return d;
}`,
    tests: `test('a typed array, in order', () => {
  expect(findStride([0, 8, 16, 24])).toBe(8);
});
test('one field of packed records', () => {
  expect(findStride([32, 80, 128])).toBe(48);
});
test('backwards', () => {
  expect(findStride([100, 52, 4])).toBe(-48);
});
test('pointer chasing: no pattern', () => {
  expect(findStride([0, 64, 8, 512])).toBe(null);
});
test('a pattern that breaks at the end', () => {
  expect(findStride([0, 8, 16, 99])).toBe(null);
});
test('too few reads to tell', () => {
  expect(findStride([5])).toBe(null);
  expect(findStride([])).toBe(null);
});`,
    hints: [
      'With fewer than two addresses there is no gap at all, so there is nothing to follow: return `null`.',
      'Take the first gap, `xs[1] - xs[0]`, as the candidate stride. Keep its sign.',
      'Check every later gap, `xs[i] - xs[i - 1]` for `i` from 2, against it. Any mismatch means `null`; if they all match, return the stride.',
    ],
    walkthrough: `**How to think about it.** Look at the gaps, not the addresses. For \`[0, 8, 16, 24]\` the gaps are 8, 8, 8: one steady stride, so a prefetcher could guess 32 next. For \`[100, 52, 4]\` the gaps are −48 and −48: still steady, just backwards, and the answer must keep the minus sign. For \`[0, 64, 8, 512]\` the gaps are 64, −56, 504: no pattern. So the plan is: take the first gap as the guess, then check that every other gap agrees. The gap between element \`i - 1\` and element \`i\` is \`xs[i] - xs[i - 1]\`, and the first gap is the \`i = 1\` case, so the checking loop can start at \`i = 2\`.

**The solution, line by line.**

- \`function findStride(xs) {\` takes the addresses in the order they were read.
- \`  if (xs.length < 2) {\` handles zero or one address: there is no gap to measure.
- \`    return null;\` says "no pattern".
- \`  }\` closes that case.
- \`  const d = xs[1] - xs[0];\` is the candidate stride, sign included.
- \`  for (let i = 2; i < xs.length; i++) {\` visits every later gap.
- \`    if (xs[i] - xs[i - 1] !== d) {\` compares this gap with the candidate.
- \`      return null;\` gives up at the first mismatch: one odd gap breaks the pattern.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return d;\` is reached only when every gap matched.
- \`}\` closes the function.

Run it on addresses from a pointer chase and you get \`null\`: that is this chapter's point in one line. Real prefetchers are more forgiving than this (they keep watching and lock onto a pattern once it settles), but random addresses beat them too.

**Common wrong attempts.**

- Returning \`xs[1] - xs[0]\` without checking the rest trusts the first gap, so it "finds" a stride of 64 in a random pointer chase.
- Taking \`Math.abs\` of the gaps loses the direction: a backwards walk reports +48 instead of −48, and a zig-zag like 0, 8, 0 would count as a stride.
- Starting the check loop at \`i = 0\` reads \`xs[-1]\`, which is \`undefined\`, so the very first comparison fails and every list returns \`null\`.`,
    wrong: [
      {
        code: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  return xs[1] - xs[0];
}`,
        why: 'This trusts the first gap without checking the rest, so it “finds” a stride of 64 in a random pointer chase.',
      },
      {
        code: `function findStride(xs) {
  if (xs.length < 2) {
    return null;
  }
  const d = Math.abs(xs[1] - xs[0]);
  for (let i = 2; i < xs.length; i++) {
    const g = xs[i] - xs[i - 1];
    if (Math.abs(g) !== d) {
      return null;
    }
  }
  return d;
}`,
        why: 'Taking the absolute value loses the direction: a backwards walk reports +48 instead of −48, and a zig-zag like 0, 8, 0 would count as a stride. Keep the sign.',
      },
    ],
  },
  visitOrder: {
    optional: true,
    title: 'Where does the chase go?',
    prompt: 'Nodes are stored in slots 0, 1, 2, … and `next[i]` is the slot of the node that comes after node `i`, or `-1` if node `i` is the last. Write `visitOrder(next, head)` that returns the slots in the order a walk starting at `head` visits them. (Then pass the result, times 64, to `findStride`, and see whether a prefetcher could follow it.)',
    starter: `function visitOrder(next, head) {
  // your code here
}

// expect [2, 0, 3, 1]:
const next = [3, -1, 0, 1];
console.log(visitOrder(next, 2));`,
    solution: `function visitOrder(next, head) {
  const out = [];
  let p = head;
  while (p !== -1) {
    out.push(p);
    p = next[p];
  }
  return out;
}`,
    tests: `test('a shuffled chain', () => {
  const next = [3, -1, 0, 1];
  expect(visitOrder(next, 2)).toEqual([2, 0, 3, 1]);
});
test('nodes stored in order', () => {
  const next = [1, 2, 3, -1];
  expect(visitOrder(next, 0)).toEqual([0, 1, 2, 3]);
});
test('a single node', () => {
  expect(visitOrder([-1], 0)).toEqual([0]);
});
test('an empty list', () => {
  expect(visitOrder([0, 1], -1)).toEqual([]);
});`,
    hints: [
      'This is the linked-list walk again, with `-1` instead of `null` for “no next node”.',
      'Keep a variable `p` for the slot you are at, starting at `head`, and an empty array for the answer.',
      'While `p` is not `-1`: push `p`, then follow the pointer with `p = next[p]`.',
    ],
    walkthrough: `**How to think about it.** Follow the starter by hand. Start at slot 2; \`next[2]\` is 0, so slot 0 comes next; \`next[0]\` is 3; \`next[3]\` is 1; \`next[1]\` is −1, the end. The order is 2, 0, 3, 1. Notice that you could not have written down the third slot without first reading \`next[0]\`, which is the whole problem with pointer chasing, now in a few lines of code.

**The solution, line by line.**

- \`function visitOrder(next, head) {\` takes the "next" table and the first slot.
- \`  const out = [];\` collects the slots in visiting order.
- \`  let p = head;\` is the pointer: where we are now.
- \`  while (p !== -1) {\` keeps walking until the end marker; an empty list (\`head\` is −1) never enters the loop.
- \`    out.push(p);\` records this node.
- \`    p = next[p];\` follows the pointer to the next node.
- \`  }\` closes the loop.
- \`  return out;\` hands back the order.
- \`}\` closes the function.

If each node took one 64-byte line, the addresses read would be \`[128, 0, 192, 64]\`, and \`findStride\` returns \`null\` for them; for nodes stored in order, \`[0, 64, 128, 192]\`, it returns 64. The same data, linked two ways, is easy or impossible for the prefetcher.

**Common wrong attempts.**

- Looping \`for (let i = 0; i < next.length; i++)\` visits slots in storage order, not list order.
- Pushing \`next[p]\` instead of \`p\` records each node's successor, so the head is missing and a final −1 sneaks in.`,
    wrong: [
      {
        code: `function visitOrder(next, head) {
  const out = [];
  const n = next.length;
  for (let i = 0; i < n; i++) {
    out.push(i);
  }
  return out;
}`,
        why: 'This lists the slots in storage order. The list order comes from following `next`, starting at `head`.',
      },
      {
        code: `function visitOrder(next, head) {
  const out = [];
  let p = head;
  while (p !== -1) {
    p = next[p];
    out.push(p);
  }
  return out;
}`,
        why: 'This moves on before recording, so the head is never pushed and the end marker −1 is pushed at the end.',
      },
    ],
  },
  mispredicts: {
    title: 'Count the wrong guesses',
    prompt: 'A toy branch predictor guesses that each `if` will go the same way it went last time. Its very first guess is `false`. Write `mispredicts(outs)`, where `outs` is an array of booleans (what the `if` actually did each time), that returns how many guesses were wrong.',
    starter: `function mispredicts(outs) {
  // your code here
}

const xs = [12, 30, 71, 5, 88];
const outs = xs.map((v) => v < 50);
console.log(mispredicts(outs));`,
    solution: `function mispredicts(outs) {
  let guess = false;
  let wrong = 0;
  for (const o of outs) {
    if (o !== guess) {
      wrong++;
    }
    guess = o;
  }
  return wrong;
}`,
    tests: `test('no branches, no mistakes', () => {
  expect(mispredicts([])).toBe(0);
});
test('always false: never wrong', () => {
  expect(mispredicts([false, false])).toBe(0);
});
test('always true: wrong only at first', () => {
  expect(mispredicts([true, true, true])).toBe(1);
});
test('alternating: wrong every time', () => {
  const o = [true, false, true, false];
  expect(mispredicts(o)).toBe(4);
});
test('the unsorted values from the diagram', () => {
  const xs = [12, 30, 71, 5, 88, 64, 47, 93];
  const o = xs.map((v) => v < 50);
  expect(mispredicts(o)).toBe(6);
});
test('the same values, sorted', () => {
  const xs = [5, 12, 30, 47, 64, 71, 88, 93];
  const o = xs.map((v) => v < 50);
  expect(mispredicts(o)).toBe(2);
});`,
    hints: [
      'The predictor’s whole memory is one boolean: what happened last time. Keep it in a variable `guess`, starting at `false`, with a counter `wrong`.',
      'For each outcome `o`: if it differs from `guess`, count a mistake.',
      'Then update the guess for next time: `guess = o`. Do this whether the guess was right or not.',
    ],
    walkthrough: `**How to think about it.** Run the starter by hand. The values 12, 30, 71, 5, 88 give the outcomes true, true, false, true, false for \`v < 50\`. The first guess is false and the outcome is true: wrong (1). Now the guess is true, and the outcome is true: right. Guess true, outcome false: wrong (2). Guess false, outcome true: wrong (3). Guess true, outcome false: wrong (4). So four mistakes. What you did at each step was compare, then *learn*: whatever just happened becomes the next guess, whether or not the guess was right.

**The solution, line by line.**

- \`function mispredicts(outs) {\` takes the outcomes in order.
- \`  let guess = false;\` is the predictor's memory, starting at false.
- \`  let wrong = 0;\` counts mistakes.
- \`  for (const o of outs) {\` handles each time the branch runs.
- \`    if (o !== guess) {\` compares the real outcome with the guess.
- \`      wrong++;\` counts a misprediction.
- \`    }\` closes the \`if\`.
- \`    guess = o;\` is the predictor's "learning": remember this outcome as the next guess.
- \`  }\` closes the loop.
- \`  return wrong;\` hands back the count.
- \`}\` closes the function.

The last two tests are the diagram: the same eight values cost 6 mistakes unsorted and 2 sorted (one at the very start, one at the switch). Real predictors remember longer histories and spot patterns this one can't, but no predictor can guess random data.

**Common wrong attempts.**

- Never updating the guess (always comparing with \`false\`) counts every true, so a long run of trues costs a mistake every time instead of once.
- Starting with \`guess = true\` makes an all-false run cost a mistake it should not.
- Updating the guess *before* comparing (\`guess = o\` first) compares each outcome with itself, so it never finds a mistake.`,
    wrong: [
      {
        code: `function mispredicts(outs) {
  let wrong = 0;
  for (const o of outs) {
    if (o !== false) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'This always guesses `false`: it never learns. It counts the trues, so a long run of trues costs a mistake every time instead of just once. Update the guess after each branch.',
      },
      {
        code: `function mispredicts(outs) {
  let guess = true;
  let wrong = 0;
  for (const o of outs) {
    if (o !== guess) {
      wrong++;
    }
    guess = o;
  }
  return wrong;
}`,
        why: 'The learning is right, but the very first guess must be `false`. Starting from `true` makes an all-false run cost one mistake.',
      },
      {
        code: `function mispredicts(outs) {
  let guess = false;
  let wrong = 0;
  for (const o of outs) {
    guess = o;
    if (o !== guess) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'The guess is replaced by the outcome before the comparison, so every outcome is compared with itself and no mistake is ever counted.',
      },
    ],
  },
  twoBit: {
    optional: true,
    title: 'A predictor that is harder to fool',
    prompt: 'A better toy predictor keeps a counter from 0 to 3, starting at 0. It guesses `true` when the counter is 2 or 3, and `false` when it is 0 or 1. After each branch, the counter goes up by 1 if the outcome was `true` (but not above 3), and down by 1 if it was `false` (but not below 0). Write `twoBit(outs)` that returns how many guesses were wrong.',
    starter: `function twoBit(outs) {
  // your code here
}

// a loop of 3 that runs 5 times:
const o = [];
for (let k = 0; k < 5; k++) {
  o.push(true, true, true, false);
}
console.log(twoBit(o)); // 7`,
    solution: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    const guess = c >= 2;
    if (o !== guess) {
      wrong++;
    }
    if (o) {
      c = Math.min(3, c + 1);
    } else {
      c = Math.max(0, c - 1);
    }
  }
  return wrong;
}`,
    tests: `test('no branches', () => {
  expect(twoBit([])).toBe(0);
});
test('always false: never wrong', () => {
  expect(twoBit([false, false])).toBe(0);
});
test('always true: two mistakes to learn', () => {
  expect(twoBit([true, true, true])).toBe(2);
});
test('an inner loop, run 5 times', () => {
  const o = [];
  for (let k = 0; k < 5; k++) {
    o.push(true, true, true, false);
  }
  expect(twoBit(o)).toBe(7);
});
test('the counter stops at 3', () => {
  const t = true;
  const f = false;
  const o = [t, t, t, t, f, f, t];
  expect(twoBit(o)).toBe(5);
});`,
    hints: [
      'Keep a counter `c`, starting at 0, and a mistake counter. The guess is `c >= 2`.',
      'Compare the outcome with the guess and count a mistake if they differ, as before.',
      'Then move the counter: up by 1 for `true`, down by 1 for `false`, using `Math.min(3, c + 1)` and `Math.max(0, c - 1)` to keep it between 0 and 3.',
    ],
    walkthrough: `**How to think about it.** The "same as last time" predictor changes its mind after a single surprise, so in an inner loop (true, true, true, false, over and over) it is wrong twice per run: at the false that ends the loop, and again at the true that starts the next one. The counter gives the predictor a little inertia: one surprise moves it from 3 to 2, which still guesses true, so a single false does not make it forget that the branch is usually true. Trace the starter: the first two trues are wrong while the counter climbs from 0 to 2; after that each run of the inner loop costs one mistake, at its false. That is 2 + 5 = 7, against 10 for the one-bit predictor on the same outcomes.

**The solution, line by line.**

- \`function twoBit(outs) {\` takes the outcomes.
- \`  let c = 0;\` is the counter, starting at "strongly false".
- \`  let wrong = 0;\` counts mistakes.
- \`  for (const o of outs) {\` handles each branch.
- \`    const guess = c >= 2;\` is the prediction: true for 2 or 3.
- \`    if (o !== guess) {\` and \`      wrong++;\` count a misprediction.
- \`    }\` closes it.
- \`    if (o) {\` handles a true outcome.
- \`      c = Math.min(3, c + 1);\` moves up, but never past 3.
- \`    } else {\` handles a false one.
- \`      c = Math.max(0, c - 1);\` moves down, but never below 0.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return wrong;\` hands back the count.
- \`}\` closes the function.

The last test shows why the limit matters: without it, four trues would push the counter to 4, two falses would only bring it down to 2, and the predictor would still be guessing true when the branch had just gone false twice in a row.

**Common wrong attempts.**

- Letting the counter grow without a limit makes the predictor slower and slower to change its mind after a long run of trues.
- Moving the counter before making the guess uses the outcome to predict itself, so it counts too few mistakes.`,
    wrong: [
      {
        code: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    if (o !== c >= 2) {
      wrong++;
    }
    c = o ? c + 1 : c - 1;
  }
  return wrong;
}`,
        why: 'The counter has no limits, so after four trues it reaches 4 and a single false leaves it at 3, still guessing true. Keep it between 0 and 3.',
      },
      {
        code: `function twoBit(outs) {
  let c = 0;
  let wrong = 0;
  for (const o of outs) {
    if (o) {
      c = Math.min(3, c + 1);
    } else {
      c = Math.max(0, c - 1);
    }
    if (o !== c >= 2) {
      wrong++;
    }
  }
  return wrong;
}`,
        why: 'The counter is updated before the guess is made, so each outcome partly predicts itself. Guess first, then update.',
      },
    ],
  },
  sumLanes: {
    title: 'Sum the way SIMD does',
    prompt: 'Write `sumLanes(xs, W)` that sums `xs` using `W` lane accumulators, like a vectorised sum. Element `i` goes into lane `i % W`. Return `{ lanes, total }`: `lanes` is the array of `W` lane sums, and `total` is the lanes added together.',
    starter: `function sumLanes(xs, W) {
  const lanes = [];
  // your code here
}

const r = sumLanes([1, 2, 3, 4, 5], 2);
console.log(r);`,
    solution: `function sumLanes(xs, W) {
  const lanes = [];
  for (let l = 0; l < W; l++) {
    lanes.push(0);
  }
  for (let i = 0; i < xs.length; i++) {
    lanes[i % W] += xs[i];
  }
  let total = 0;
  for (let l = 0; l < W; l++) {
    total += lanes[l];
  }
  return { lanes, total };
}`,
    tests: `test('ten numbers in four lanes', () => {
  const r = sumLanes([1,2,3,4,5,6,7,8,9,10], 4);
  expect(r.lanes).toEqual([15, 18, 10, 12]);
  expect(r.total).toBe(55);
});
test('one lane is the plain sum', () => {
  expect(sumLanes([3, 4, 5], 1).total).toBe(12);
});
test('the tail is not forgotten', () => {
  const r = sumLanes([1, 1, 1, 1, 1], 4);
  expect(r.lanes).toEqual([2, 1, 1, 1]);
  expect(r.total).toBe(5);
});
test('empty input gives zero lanes', () => {
  expect(sumLanes([], 2)).toEqual({ lanes: [0, 0], total: 0 });
});`,
    hints: [
      'Picture the register as an array of `W` running totals. What should each total start at?',
      'Element `i` belongs to lane `i % W` (the remainder after dividing by `W`), so one plain loop over every element can do `lanes[i % W] += xs[i]`; that also handles the tail for free.',
      'After the loop, add the `W` lane totals together into `total`, and `return { lanes, total };`.',
    ],
    walkthrough: `**How to think about it.** A vectorised sum keeps one running total per lane, like the four-lane register you stepped through in the chapter: lane 0 collects elements 0, 4, 8, ..., lane 1 collects 1, 5, 9, ..., and so on. So the question for each element is only "which lane is this?", and the remainder \`i % W\` answers it: 0, 1, 2, 3, 0, 1, 2, 3, ... as \`i\` counts up. Once every element is in its lane, the lanes are added together (compilers call this the *horizontal* step). Try it by hand first with \`[1, 2, 3, 4, 5]\` and \`W = 2\`: lane 0 gets 1 + 3 + 5 = 9, lane 1 gets 2 + 4 = 6, and the total is 15.

**The solution, line by line.**

- \`const lanes = [];\` is the pretend register.
- \`for (let l = 0; l < W; l++) {\` and \`lanes.push(0);\` put \`W\` zeros in it, one starting total per lane. (Without them, \`lanes[0] += ...\` would add to \`undefined\` and give \`NaN\`.)
- \`for (let i = 0; i < xs.length; i++) {\` visits every element once, tail included.
- \`lanes[i % W] += xs[i];\` adds element \`i\` into its lane. On real hardware, one instruction does this for a whole chunk of \`W\` elements at once; here we do it one at a time, but into the same lanes.
- \`let total = 0;\` starts the horizontal step.
- \`for (let l = 0; l < W; l++) {\` and \`total += lanes[l];\` add the lanes together.
- \`return { lanes, total };\` hands back both, so the tests can check the lanes as well as the answer.

For ten numbers 1 to 10 with \`W = 4\`, the lanes are \`[1+5+9, 2+6+10, 3+7, 4+8]\`, which is \`[15, 18, 10, 12]\`, and the total is 55.

Notice the additions now happen in a different *grouping* from a plain left-to-right sum. For whole numbers that does not matter; for floats it can change the last digit, which is exactly why a compiler will not do this to a floating-point sum unless you allow it.

**Common wrong attempts.**

- Looping only over full chunks (\`i + W <= xs.length\`) forgets the tail: with five elements and \`W = 4\`, element 4 is silently dropped. Real vectorised loops always add a tail loop for this reason.
- Summing everything into one total gets the right \`total\` but not the lanes; the exercise is about spreading the work across \`W\` lanes.
- Forgetting the starting zeros gives \`NaN\` in every lane.`,
    wrong: [
      {
        code: `function sumLanes(xs, W) {
  const lanes = [];
  for (let l = 0; l < W; l++) {
    lanes.push(0);
  }
  for (let i = 0; i + W <= xs.length;
       i += W) {
    for (let l = 0; l < W; l++) {
      lanes[l] += xs[i + l];
    }
  }
  let total = 0;
  for (const s of lanes) total += s;
  return { lanes, total };
}`,
        why: 'This only processes full chunks of `W`. When the length isn’t a multiple of `W`, the last few elements (the tail) are silently dropped.',
      },
      {
        code: `function sumLanes(xs, W) {
  let total = 0;
  for (const x of xs) total += x;
  return { lanes: [total], total };
}`,
        why: 'The total is right, but everything went into one lane. The point is to spread elements across `W` lanes by `i % W`.',
      },
    ],
  },
  column: {
    optional: true,
    title: 'Gather a column',
    prompt: 'Records are packed into one array, `nf` numbers per record (packed AoS). Write `column(packed, nf, f)` that returns a **new `Float64Array`** holding field `f` of every record, in order. This is the gather that AoS forces on SIMD code.',
    starter: `function column(packed, nf, f) {
  // your code here
}

const p = [1, 2, 3, 4, 5, 6];
console.log(column(p, 3, 1));`,
    solution: `function column(packed, nf, f) {
  const n = packed.length / nf;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = packed[i * nf + f];
  }
  return out;
}`,
    tests: `test('field 1 of two 3-field records', () => {
  const c = column([1, 2, 3, 4, 5, 6], 3, 1);
  expect(Array.from(c)).toEqual([2, 5]);
});
test('returns a Float64Array', () => {
  const c = column([1, 2], 2, 0);
  expect(c instanceof Float64Array).toBe(true);
});
test('field 0 with stride 2', () => {
  const c = column([7, 0, 8, 0, 9, 0], 2, 0);
  expect(Array.from(c)).toEqual([7, 8, 9]);
});`,
    hints: [
      'How many records are there? Each one takes `nf` slots.',
      'Record `i` starts at slot `i * nf`, so its field number `f` is at `i * nf + f`.',
      'Make `const out = new Float64Array(n);`, then in a loop set `out[i] = packed[i * nf + f];` and return `out`.',
    ],
    walkthrough: `**How to think about it.** In packed AoS the records sit one after another, \`nf\` numbers each, so field \`f\` of consecutive records is \`nf\` slots apart: that distance is the stride. To build a column we jump through the array by that stride, picking one number per record. Do one by hand: in \`[1, 2, 3, 4, 5, 6]\` with \`nf = 3\`, record 0 is \`1, 2, 3\` and record 1 is \`4, 5, 6\`; field 1 of each is \`2\` and \`5\`.

**The solution, line by line.**

- \`const n = packed.length / nf;\` counts the records: six slots of three numbers is two records.
- \`const out = new Float64Array(n);\` makes the column: \`n\` doubles side by side, all zero to begin with.
- \`for (let i = 0; i < n; i++) {\` visits each record.
- \`out[i] = packed[i * nf + f];\` finds record \`i\`'s start (\`i * nf\`), steps \`f\` slots into it, and copies that number into the column.
- \`return out;\` hands back the new column.

Gathering costs one separate read per element, which is exactly what SIMD hardware has to do with an array of structs; once the column exists, though, a vector load can fill a register from it in one go.

**Common wrong attempts.**

- \`packed[i + f]\` forgets the stride and reads neighbouring slots, which mixes fields from the same record.
- Returning an ordinary array (\`[]\` with \`push\`) gives the right numbers but not a contiguous column of raw doubles, and the test checks for a \`Float64Array\`.`,
    wrong: [
      {
        code: `function column(packed, nf, f) {
  const out = new Float64Array(
    packed.length / nf);
  for (let i = 0; i < out.length; i++) {
    out[i] = packed[i + f];
  }
  return out;
}`,
        why: 'This forgets the stride: `packed[i + f]` reads neighbouring slots, mixing different fields. Record `i` starts at `i * nf`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which loop is the prefetcher most likely to help?',
    options: [
      {
        t: 'Walking a linked list of nodes scattered around memory',
        why: 'Each address is only known after the previous load: pointer chasing.',
      },
      {
        t: 'Reading a Float64Array from the last element to the first',
        correct: true,
        why: 'Backwards with a steady stride is a simple pattern prefetchers follow.',
      },
      {
        t: 'Reading elements at random indices',
        why: 'There is no pattern to predict.',
      },
      {
        t: 'None: prefetchers only work on strings',
        why: 'Prefetchers see addresses, not types; they work on any data.',
      },
    ],
  },
  {
    q: 'Why is following `ps[j].x` for a random `j` worse than reading `x[j]` from a Float64Array?',
    options: [
      {
        t: 'Objects store x as text',
        why: 'Numbers in objects are still numbers; the issue is where they are and how you reach them.',
      },
      {
        t: 'Float64Arrays are always fully cached',
        why: 'A big Float64Array doesn’t fit in cache either; random reads still miss.',
      },
      {
        t: 'There is no difference',
        why: 'The benchmark shows a large one at a million elements.',
      },
      {
        t: 'The object’s address must first be loaded from memory, so each read waits on another read',
        correct: true,
        why: 'That is pointer chasing. With a typed array, the address comes straight from `j`.',
      },
    ],
  },
  {
    q: 'Which of these is pointer chasing?',
    options: [
      {
        t: '`for (let p = head; p; p = p.next) s += p.v;`',
        correct: true,
        why: 'Each step loads `p.next` to find out where the next node is.',
      },
      {
        t: '`for (let i = 0; i < n; i++) s += x[i];`',
        why: 'The address of `x[i]` comes from `i` by arithmetic: no pointers to follow.',
      },
      {
        t: '`for (const j of idx) s += x[j];`',
        why: 'Shuffled, but every address comes from `idx`, which is read in order; nothing waits on a previous read of `x`.',
      },
      {
        t: '`s = a + b + c;`',
        why: 'No memory addresses are followed at all.',
      },
    ],
  },
  {
    q: 'Four reads each miss and take about 100 ns. Roughly how long do they take as a pointer chase, and with their addresses known up front?',
    options: [
      {
        t: '100 ns either way',
        why: 'A chase cannot overlap its reads, so it pays all four trips.',
      },
      {
        t: 'About 400 ns chased; a little over 100 ns overlapped',
        correct: true,
        why: 'Chased reads wait for each other; independent ones can be in flight together.',
      },
      {
        t: 'About 400 ns either way',
        why: 'Independent reads can overlap, so they need not pay four full trips.',
      },
      {
        t: 'About 25 ns overlapped',
        why: 'Overlap cannot make one trip shorter than a trip: each read still takes about 100 ns.',
      },
    ],
  },
  {
    q: 'In the benchmark, shuffling the order slowed every layout, but the array of objects by far the most. Why?',
    options: [
      {
        t: 'Objects are bigger, so shuffling them takes longer',
        why: 'Nothing is moved: only the order of the reads changes.',
      },
      {
        t: 'The prefetcher only works for objects',
        why: 'It is the other way round: it follows the simple patterns of typed arrays.',
      },
      {
        t: 'With objects, each field read first waits for a pointer load, so every visit is two misses, one after the other',
        correct: true,
        why: 'Typed arrays lose the prefetcher but each read can start at once; with objects, half of every pair must wait for the other.',
      },
      {
        t: 'Typed arrays are sorted automatically',
        why: 'Typed arrays keep whatever order you store values in.',
      },
    ],
  },
  {
    q: 'What is the main benefit of a pipeline?',
    options: [
      {
        t: 'Each instruction finishes in fewer stages',
        why: 'Each instruction still goes through every stage.',
      },
      {
        t: 'It makes caches bigger',
        why: 'Pipelining is about instructions, not cache size.',
      },
      {
        t: 'Several instructions are in progress at once, so one can finish nearly every tick',
        correct: true,
        why: 'Like an assembly line: the stages are kept busy.',
      },
      {
        t: 'It removes the need for branches',
        why: 'Branches still exist; in fact they are what makes pipelines guess.',
      },
    ],
  },
  {
    q: 'Which pair of instructions can follow each other through the pipeline without a gap?',
    options: [
      {
        t: '`a = b + c` then `d = e + f`',
        correct: true,
        why: 'The second does not use `a`, so it need not wait for the first.',
      },
      {
        t: '`a = b + c` then `d = a + 1`',
        why: 'The second needs `a`, so it waits for the first to finish.',
      },
      {
        t: '`s = s + x` then `s = s + y`',
        why: 'The second needs the `s` the first produces.',
      },
      {
        t: 'None: every instruction waits for the one before',
        why: 'Only instructions that need an earlier result have to wait.',
      },
    ],
  },
  {
    q: 'The toy predictor (“same as last time”, first guess false) sees: true, true, false, false. How many wrong guesses?',
    options: [
      {
        t: '0',
        why: 'The first guess is false, so the first true is already a mistake.',
      },
      {
        t: '4',
        why: 'Repeated outcomes are guessed right by “same as last time”.',
      },
      {
        t: '2',
        correct: true,
        why: 'Wrong at the first true (guessed false) and at the first false (guessed true). The repeats are guessed right.',
      },
      {
        t: '1',
        why: 'There are two switches the predictor can’t see coming: the start and the change.',
      },
    ],
  },
  {
    q: 'What happens to instructions fetched after a branch that was mispredicted?',
    options: [
      {
        t: 'They are kept and run anyway',
        why: 'They belong to the wrong path; running them would give wrong results.',
      },
      {
        t: 'They are moved into the L1 cache',
        why: 'Caches hold memory contents; this is about instructions in flight.',
      },
      {
        t: 'The program crashes',
        why: 'Mispredictions are normal and invisible to the program, apart from the time they cost.',
      },
      {
        t: 'They are thrown away and the right path is fetched instead',
        correct: true,
        why: 'That wasted work is the cost of a misprediction.',
      },
    ],
  },
  {
    q: 'Which change is most likely to make `if (v < 50)` cheaper inside a loop over many random numbers?',
    options: [
      {
        t: 'Renaming `v` to something shorter',
        why: 'Names don’t exist at the machine level.',
      },
      {
        t: 'Sorting the numbers first, if order doesn’t matter',
        correct: true,
        why: 'Sorted data makes the branch predictable: one switch from true to false.',
      },
      {
        t: 'Changing 50 to 51',
        why: 'The outcomes would still be random.',
      },
      {
        t: 'Adding a second, unrelated if',
        why: 'That adds a branch; it doesn’t make the first one predictable.',
      },
    ],
  },
  {
    q: 'A SIMD add instruction works on two registers of four lanes each. What does it produce?',
    options: [
      {
        t: 'One number: the sum of all eight values',
        why: 'That would mix lanes, and a SIMD add keeps lanes separate.',
      },
      {
        t: 'Four sums: lane 0 + lane 0, lane 1 + lane 1, and so on',
        correct: true,
        why: 'The same operation, applied lane by lane, in one instruction.',
      },
      {
        t: 'Four sums, worked out one after another by four instructions',
        why: 'The point of SIMD is that one instruction does all four.',
      },
    ],
  },
  {
    q: 'JavaScript numbers are 64-bit doubles. How many fit in the lanes of a 128-bit register?',
    options: [
      {
        t: '4',
        why: 'Four lanes fit when each value is 32 bits, as in `f32x4`.',
      },
      {
        t: '1',
        why: 'One double uses only 64 of the 128 bits.',
      },
      {
        t: '2',
        correct: true,
        why: '128 ÷ 64 = 2. WebAssembly calls this shape `f64x2`.',
      },
      {
        t: '8',
        why: 'Eight lanes would need 16-bit values in 128 bits, or a 512-bit register for doubles.',
      },
    ],
  },
  {
    q: 'Why might a compiler refuse to vectorise `s += xs[i]` over an array of floats, unless told it may?',
    options: [
      {
        t: 'Lane-wise summing regroups the additions, and a different grouping can round differently',
        correct: true,
        why: '`(0.1 + 0.2) + 0.3` and `0.1 + (0.2 + 0.3)` differ, so the answer could change. LLVM only reorders when you allow it.',
      },
      {
        t: 'SIMD cannot add floating-point numbers',
        why: 'There are float SIMD instructions, such as `f64x2.add`.',
      },
      {
        t: 'The loop has a tail',
        why: 'Tails are normal; a separate loop handles them.',
      },
      {
        t: 'Sums always need an if',
        why: 'This loop has no branch in its body.',
      },
    ],
  },
  {
    q: 'Particles are an array of structs, 6 numbers each. A SIMD loop wants four `x` values in one register. What has to happen?',
    options: [
      {
        t: 'One vector load of the next four slots',
        why: 'The next four slots are x, y, vx and vy of one particle, not four x values.',
      },
      {
        t: 'A gather: four separate reads, 6 slots apart',
        correct: true,
        why: 'The x values have a stride of 6. In a struct of arrays they would be side by side, and one load would do.',
      },
      {
        t: 'Nothing: the CPU rearranges memory by itself',
        why: 'Hardware does not change your data layout.',
      },
    ],
  },
  {
    q: 'Which statement about SIMD and JavaScript is accurate?',
    options: [
      {
        t: 'Browsers ship the SIMD.js API',
        why: 'SIMD.js was removed from Stage 3, and browsers are not implementing it.',
      },
      {
        t: 'V8 is documented to vectorise every loop',
        why: 'None of the sources checked for this book says that, so do not assume it.',
      },
      {
        t: 'SIMD is impossible on the web',
        why: 'WebAssembly has 128-bit SIMD.',
      },
      {
        t: 'WebAssembly has fixed-width 128-bit SIMD; JavaScript has no SIMD API',
        correct: true,
        why: 'The `v128` type and instructions like `f64x2.add` are part of WebAssembly 2.0.',
      },
    ],
  },
];
