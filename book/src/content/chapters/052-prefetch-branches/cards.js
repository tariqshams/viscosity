// Chapter 52 cards. Keys are stable ids: never rename them.

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
};

export const exercises = {
  findStride: {
    title: 'Be the prefetcher',
    prompt:
      'Write `findStride(xs)`, where `xs` is a list of addresses in the order they were read. If every gap between consecutive addresses is the same, return that gap (it may be negative: the reads go backwards). Otherwise, or if there are fewer than two addresses, return `null`: no pattern to follow.',
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
    prompt:
      'Nodes are stored in slots 0, 1, 2, … and `next[i]` is the slot of the node that comes after node `i`, or `-1` if node `i` is the last. Write `visitOrder(next, head)` that returns the slots in the order a walk starting at `head` visits them. (Then pass the result, times 64, to `findStride`, and see whether a prefetcher could follow it.)',
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
};

export const quiz = [
  {
    q: 'Which loop is the prefetcher most likely to help?',
    options: [
      { t: 'Walking a linked list of nodes scattered around memory', why: 'Each address is only known after the previous load: pointer chasing.' },
      { t: 'Reading a Float64Array from the last element to the first', correct: true, why: 'Backwards with a steady stride is a simple pattern prefetchers follow.' },
      { t: 'Reading elements at random indices', why: 'There is no pattern to predict.' },
      { t: 'None: prefetchers only work on strings', why: 'Prefetchers see addresses, not types; they work on any data.' },
    ],
  },
  {
    q: 'Why is following `ps[j].x` for a random `j` worse than reading `x[j]` from a Float64Array?',
    options: [
      { t: 'Objects store x as text', why: 'Numbers in objects are still numbers; the issue is where they are and how you reach them.' },
      { t: 'Float64Arrays are always fully cached', why: 'A big Float64Array doesn’t fit in cache either; random reads still miss.' },
      { t: 'There is no difference', why: 'The benchmark shows a large one at a million elements.' },
      { t: 'The object’s address must first be loaded from memory, so each read waits on another read', correct: true, why: 'That is pointer chasing. With a typed array, the address comes straight from `j`.' },
    ],
  },
  {
    q: 'Which of these is pointer chasing?',
    options: [
      { t: '`for (let p = head; p; p = p.next) s += p.v;`', correct: true, why: 'Each step loads `p.next` to find out where the next node is.' },
      { t: '`for (let i = 0; i < n; i++) s += x[i];`', why: 'The address of `x[i]` comes from `i` by arithmetic: no pointers to follow.' },
      { t: '`for (const j of idx) s += x[j];`', why: 'Shuffled, but every address comes from `idx`, which is read in order; nothing waits on a previous read of `x`.' },
      { t: '`s = a + b + c;`', why: 'No memory addresses are followed at all.' },
    ],
  },
  {
    q: 'Four reads each miss and take about 100 ns. Roughly how long do they take as a pointer chase, and with their addresses known up front?',
    options: [
      { t: '100 ns either way', why: 'A chase cannot overlap its reads, so it pays all four trips.' },
      { t: 'About 400 ns chased; a little over 100 ns overlapped', correct: true, why: 'Chased reads wait for each other; independent ones can be in flight together.' },
      { t: 'About 400 ns either way', why: 'Independent reads can overlap, so they need not pay four full trips.' },
      { t: 'About 25 ns overlapped', why: 'Overlap cannot make one trip shorter than a trip: each read still takes about 100 ns.' },
    ],
  },
  {
    q: 'In the benchmark, shuffling the order slowed every layout, but the array of objects by far the most. Why?',
    options: [
      { t: 'Objects are bigger, so shuffling them takes longer', why: 'Nothing is moved: only the order of the reads changes.' },
      { t: 'The prefetcher only works for objects', why: 'It is the other way round: it follows the simple patterns of typed arrays.' },
      { t: 'With objects, each field read first waits for a pointer, so the misses cannot overlap', correct: true, why: 'Typed arrays lose the prefetcher but keep the overlap; objects lose both.' },
      { t: 'Typed arrays are sorted automatically', why: 'Typed arrays keep whatever order you store values in.' },
    ],
  },
];
