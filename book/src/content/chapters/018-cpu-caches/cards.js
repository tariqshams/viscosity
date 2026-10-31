// Chapter 18 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cpu-loop': {
    q: 'What three steps does a CPU repeat for every instruction?',
    a: 'Fetch it, decode it, execute it.',
  },
  'register-what': {
    q: 'What is a **register**?',
    a: 'One of a few tiny storage slots inside the CPU, holding a value it is working on right now.',
  },
  'register-why': {
    q: 'Why does the CPU keep the values it is working on in registers rather than in memory?',
    a: 'Registers are inside the CPU, so using them costs almost nothing; memory is far away and slow.',
  },
  'cache-why': {
    q: 'Why do CPUs have caches at all?',
    a: 'Main memory is far slower than the CPU, so keeping copies of recently used data close by hides most of that wait.',
  },
  'hierarchy-order': {
    q: 'Put these in order from fastest to slowest: L3, main memory, L1, L2.',
    a: 'L1, L2, L3, main memory. (Smallest to biggest, too.)',
  },
  'latency-what': {
    q: 'What is **latency**?',
    a: 'How long one access takes, from asking for the data to receiving it.',
  },
  'miss-what': {
    q: 'What is a **cache miss**?',
    a: 'The data the CPU needs isn’t in the cache it checked, so it must look further down the hierarchy.',
  },
  'hit-again': {
    q: 'The CPU has just read `a.x` from main memory. It reads `a.x` again a moment later. Hit or miss, and why?',
    a: 'Most likely a hit: the first read left a copy in the caches on the way back.',
  },
  'small-fits': {
    q: 'Why can the same loop cost less per element on 1,000 particles than on 1,000,000?',
    a: 'A thousand particles fit in the caches, so reads hit; a million don’t, so reads keep missing.',
  },
  'few-misses': {
    q: 'Hits cost 2 ns and misses 100 ns. Roughly how many times slower than all-hits is a 90% hit rate?',
    a: 'About 6 times: 0.9 × 2 + 0.1 × 100 = 11.8 ns, against 2 ns.',
  },
};

export const examples = {
  'human-scale': {
    title: 'If an L1 hit took one second',
    code: `// Rough 2021 latencies in ns (Slotin)
const levels = [
  { name: 'L1', ns: 2 },
  { name: 'L2', ns: 5 },
  { name: 'L3', ns: 20 },
  { name: 'RAM', ns: 100 },
];
for (const l of levels) {
  const secs = l.ns / 2;
  console.log(l.name, secs, 'seconds');
}`,
  },
};

export const exercises = {
  toyCache: {
    title: 'A toy cache',
    prompt:
      'Write `countMisses(addrs, n)` for a toy cache with `n` slots. An address `a` may only live in slot `a % n`. Go through `addrs` in order. If slot `a % n` already holds `a`, that is a hit. Otherwise it is a miss, and the slot now holds `a` (whatever was there is thrown out). Return the number of misses.',
    starter: `function countMisses(addrs, n) {
  // your code here
}

// expect 1:
console.log(countMisses([5, 5, 5], 4));`,
    solution: `function countMisses(addrs, n) {
  const slots = [];
  let misses = 0;
  for (const a of addrs) {
    const k = a % n;
    if (slots[k] !== a) {
      misses++;
      slots[k] = a;
    }
  }
  return misses;
}`,
    tests: `test('the first touch is always a miss', () => {
  expect(countMisses([5, 5, 5], 4)).toBe(1);
});
test('no addresses, no misses', () => {
  expect(countMisses([], 4)).toBe(0);
});
test('everything fits: second pass hits', () => {
  const xs = [0, 1, 2, 3, 0, 1, 2, 3];
  expect(countMisses(xs, 4)).toBe(4);
});
test('too small: second pass misses', () => {
  const xs = [0, 1, 2, 3, 0, 1, 2, 3];
  expect(countMisses(xs, 2)).toBe(8);
});
test('two addresses fighting over a slot', () => {
  expect(countMisses([0, 4, 0, 4], 4)).toBe(4);
});`,
    hints: [
      'Keep an array `slots`, starting empty, and a `misses` counter.',
      'For each address `a`, work out its slot `k = a % n`. If `slots[k] === a` it is a hit: do nothing.',
      'Otherwise count a miss and store `a` in `slots[k]`, replacing what was there.',
    ],
    walkthrough: `This is a real (if tiny) cache design: each address has exactly one place it may live.

- **The slot.** \`a % n\` picks the slot, so the lookup is instant: there is only one place to check.
- **Hit.** If that slot already holds \`a\`, the data is close by. Nothing to do.
- **Miss.** Otherwise the data must come from further away. Count it, and leave the copy in the slot for next time, throwing out whatever lived there.

The tests show the three lessons of this chapter. A first touch always misses. Data that fits in the cache hits on the second pass. Data that doesn’t fit (or that fights over the same slot, like 0 and 4 here) keeps missing. Real caches have smarter rules about where data may go and what to throw out, but they face the same three cases.`,
    wrong: [
      {
        code: `function countMisses(addrs, n) {
  const slots = [];
  let misses = 0;
  for (const a of addrs) {
    const k = a % n;
    if (slots[k] === undefined) {
      misses++;
      slots[k] = a;
    }
  }
  return misses;
}`,
        why: 'This treats any full slot as a hit, even when it holds a *different* address. Then 0 and 4 seem to share one copy. Check that the slot holds this exact address: `slots[k] !== a`.',
      },
      {
        code: `function countMisses(addrs, n) {
  const slots = [];
  let misses = 0;
  for (const a of addrs) {
    if (slots[a % n] !== a) {
      misses++;
    }
  }
  return misses;
}`,
        why: 'This never stores anything, so the cache stays empty and every read misses. After a miss, put the address in its slot.',
      },
    ],
  },
  avgTime: {
    optional: true,
    title: 'The cost of a few misses',
    prompt:
      'Write `avgTime(rate, hit, miss)` that returns the average time of one read, when a fraction `rate` (between 0 and 1) of reads hit and cost `hit` nanoseconds each, and the rest miss and cost `miss` nanoseconds each.',
    starter: `function avgTime(rate, hit, miss) {
  // your code here
}

// expect 11.8:
console.log(avgTime(0.9, 2, 100));`,
    solution: `function avgTime(rate, hit, miss) {
  return rate * hit + (1 - rate) * miss;
}`,
    tests: `test('all hits', () => {
  expect(avgTime(1, 2, 100)).toBeCloseTo(2);
});
test('all misses', () => {
  expect(avgTime(0, 2, 100)).toBeCloseTo(100);
});
test('90% hits', () => {
  expect(avgTime(0.9, 2, 100)).toBeCloseTo(11.8);
});
test('99% hits', () => {
  expect(avgTime(0.99, 2, 100)).toBeCloseTo(2.98);
});`,
    hints: [
      'The fraction of reads that miss is `1 - rate`.',
      'Weight each cost by how often it happens, and add: `rate * hit + (1 - rate) * miss`.',
    ],
    walkthrough: `An average weighted by how often each case happens.

- A fraction \`rate\` of reads cost \`hit\`, so they contribute \`rate * hit\`.
- The rest, \`1 - rate\`, cost \`miss\` each.
- Add the two.

Try a few values. Going from 99% to 90% hits makes the average read about four times slower. When misses cost fifty times more than hits, the miss rate is what you have to watch.`,
    wrong: [
      {
        code: `function avgTime(rate, hit, miss) {
  return (hit + miss) / 2;
}`,
        why: 'This treats hits and misses as equally common. Weight each cost by how often it happens.',
      },
      {
        code: `function avgTime(rate, hit, miss) {
  return (1 - rate) * hit + rate * miss;
}`,
        why: 'The rates are swapped: this charges the miss cost to the hits. With `rate` 1 it returns 100 instead of 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a CPU repeatedly do to run a program?',
    options: [
      { t: 'Read the whole program at once, then output the answer', why: 'It works one instruction at a time (at least in this simple picture).' },
      { t: 'Fetch an instruction, decode it, execute it', correct: true, why: 'That loop, repeated billions of times a second, is what running a program means.' },
      { t: 'Translate the JavaScript source into English', why: 'The CPU only understands machine instructions; engines produce those.' },
      { t: 'Wait for each cache to empty', why: 'Caches fill and get replaced continually; the CPU doesn’t wait for them to empty.' },
    ],
  },
  {
    q: 'Which list goes from fastest to slowest?',
    options: [
      { t: 'Main memory, L3, L2, L1', why: 'That is slowest to fastest.' },
      { t: 'L1, main memory, L2, L3', why: 'Main memory is the slowest level here, not the second fastest.' },
      { t: 'L3, L2, L1, main memory', why: 'L3 is the slowest cache, not the fastest.' },
      { t: 'Registers, L1, L2, L3, main memory', correct: true, why: 'Each step down is bigger and slower.' },
    ],
  },
  {
    q: 'Why are caches small, rather than as big as main memory?',
    options: [
      { t: 'Small memories close to the CPU can be fast; big ones can’t', correct: true, why: 'That trade-off between size and speed is why there is a hierarchy at all.' },
      { t: 'Programs never use more than a few kilobytes', why: 'Programs often use gigabytes; that is exactly why misses happen.' },
      { t: 'JavaScript forbids larger caches', why: 'Caches are hardware; no language controls their size.' },
      { t: 'Caches only store instructions, not data', why: 'There are caches for data as well; this whole chapter is about data reads.' },
    ],
  },
  {
    q: 'A loop reads the same small array 100 times. Where do most of its reads come from after the first pass?',
    options: [
      { t: 'Main memory, every time', why: 'The first pass left copies in the caches.' },
      { t: 'The caches: the data was used recently, and it fits', correct: true, why: 'Small, recently used data stays cached, so reads hit.' },
      { t: 'The registers, all 100 times', why: 'Registers hold only a handful of values, not a whole array.' },
      { t: 'The disk', why: 'An array in a running program lives in memory, not on disk.' },
    ],
  },
  {
    q: 'Hits cost 2 ns and misses cost 100 ns. What is the average cost per read at a 90% hit rate?',
    options: [
      { t: '2 ns', why: 'That would be a 100% hit rate.' },
      { t: '51 ns', why: 'That is the plain average of the two costs, ignoring how often each happens.' },
      { t: '11.8 ns', correct: true, why: '0.9 × 2 + 0.1 × 100 = 1.8 + 10 = 11.8.' },
      { t: '90 ns', why: 'That mixes up the hit rate with a time.' },
    ],
  },
  {
    q: 'In the benchmark, summing `mass` cost more per particle at 1,000,000 particles than at 1,000. What is the best explanation?',
    options: [
      { t: 'The loop does more work per particle when there are more of them', why: 'The work per particle is identical: one read, one add.' },
      { t: 'JavaScript slows down as arrays get longer', why: 'Indexing an array costs the same whatever its length.' },
      { t: 'The CPU runs at a lower speed for big loops', why: 'Nothing in the code tells the CPU to slow down; memory is the bottleneck.' },
      { t: 'A million particles don’t fit in the caches, so many more reads miss', correct: true, why: 'A thousand particles fit; tens of megabytes don’t, so reads keep going out to main memory.' },
    ],
  },
];
