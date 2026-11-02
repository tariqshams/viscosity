// Cards for "Cache levels, latency and misses" (split from chapter 48).
// Keys are stable ids: never rename them.

export const prompts = {
  'hierarchy-order': {
    q: 'Put these in order from fastest to slowest: L3, main memory, L1, L2.',
    a: 'L1, L2, L3, main memory. (Smallest to biggest, too.)',
  },
  'latency-what': {
    q: 'What is **latency**?',
    a: 'How long one access takes, from asking for the data to receiving it.',
  },
  'core-what': {
    q: 'What is a **core**, and where does the L1 cache sit?',
    a: 'One complete processor on a chip that has several; each core has its own L1 cache inside it.',
  },
  'miss-what': {
    q: 'What is a **cache miss**?',
    a: 'The data the CPU needs isn’t in the cache it checked, so it must look further down the hierarchy.',
  },
  'hit-again': {
    q: 'The CPU has just read `a.x` from main memory. It reads `a.x` again a moment later. Hit or miss, and why?',
    a: 'Most likely a hit: the first read left a copy in the caches on the way back.',
  },
  'first-touch': {
    q: 'Why is the very first read of any data always a miss?',
    a: 'Nothing has fetched it yet, so no cache can hold a copy of it.',
  },
  'few-misses': {
    q: 'Hits cost 2 ns and misses 100 ns. Roughly how many times slower than all-hits is a 90% hit rate?',
    a: 'About 6 times: 0.9 × 2 + 0.1 × 100 = 11.8 ns, against 2 ns.',
  },
  'small-fits': {
    q: 'Why can the same loop cost less per element on 1,000 particles than on 1,000,000?',
    a: 'A thousand particles fit in the caches, so reads hit; a million don’t, so reads keep missing.',
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
      'The cache is an array `slots`, starting empty, where `slots[k]` is the address held in slot `k`. You also need a `misses` counter.',
      'For each address `a`, work out its slot `k = a % n`. If `slots[k] === a` it is a hit, and there is nothing to do.',
      'Otherwise count a miss and store `a` in `slots[k]`, replacing what was there. Return the counter at the end.',
    ],
    walkthrough: `**How to think about it.** Run the last test by hand with a cache of 4 slots, numbered 0 to 3. Address 0 may only go in slot \`0 % 4\`, which is 0; the slot is empty, so it is a miss, and slot 0 now holds 0. Address 4 may only go in slot \`4 % 4\`, which is also 0; slot 0 holds 0, not 4, so it is a miss, and 4 throws 0 out. Then 0 comes back and finds 4 in its slot: a miss again, and so on, four misses for four reads. So the cache needs to remember, for each slot, *which* address it holds, and a read is a hit only when its slot holds exactly that address. This is a real (if tiny) cache design: each address has exactly one place it may live, so a lookup only ever checks one slot.

**The solution, line by line.**

- \`function countMisses(addrs, n) {\` takes the reads, in order, and the number of slots.
- \`  const slots = [];\` is the cache. An empty array reads \`undefined\` in every slot, which never equals a real address, so an empty slot counts as a miss without any special case.
- \`  let misses = 0;\` counts misses.
- \`  for (const a of addrs) {\` handles each read in turn.
- \`    const k = a % n;\` is the one slot this address may use.
- \`    if (slots[k] !== a) {\` asks: does that slot hold some other address, or nothing? Then it is a miss.
- \`      misses++;\` counts it.
- \`      slots[k] = a;\` leaves a copy for next time, throwing out whatever lived there.
- \`    }\` and \`  }\` close the \`if\` and the loop. A hit needs no code at all.
- \`  return misses;\` hands back the count.
- \`}\` closes the function.

The tests are this chapter's three lessons. A first touch always misses. Data that fits in the cache hits on the second pass (four addresses, four slots). Data that does not fit, or that fights over the same slot like 0 and 4, keeps missing. Real caches have smarter rules about where data may go and what to throw out, but they face the same three cases.

**Common wrong attempts.**

- Treating any full slot as a hit (\`slots[k] === undefined\` as the miss test) makes 0 and 4 seem to share one copy.
- Counting the miss but never storing \`a\` leaves the cache empty, so every read misses.
- Using \`slots.includes(a)\` lets an address live in any slot, which is a different (and much more expensive to build) cache; it gets the "two addresses fighting" test wrong.`,
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
      'If a fraction `rate` of reads hit, what fraction miss?',
      'The fraction that miss is `1 - rate`. Weight each cost by how often it happens.',
      'Add the two weighted costs: `rate * hit + (1 - rate) * miss`.',
    ],
    walkthrough: `**How to think about it.** Imagine 10 reads at a 90% hit rate: 9 hits at 2 ns and 1 miss at 100 ns take 118 ns in all, which is 11.8 ns per read. Dividing by 10 at the end is the same as weighting each cost by its share first: 0.9 of the reads cost 2, and 0.1 of them cost 100. That is the formula from the chapter.

**The solution, line by line.**

- \`function avgTime(rate, hit, miss) {\` takes the hit rate and the two costs.
- \`  return rate * hit + (1 - rate) * miss;\`: \`rate * hit\` is what the hits contribute, \`1 - rate\` is the share of reads that miss, and \`(1 - rate) * miss\` is what they contribute. Their sum is the average.
- \`}\` closes the function.

Try a few values. Going from 99% hits (2.98 ns) to 90% (11.8 ns) makes the average read about four times slower. When misses cost fifty times more than hits, the miss rate is what you have to watch.

**Common wrong attempts.**

- \`(hit + miss) / 2\` treats hits and misses as equally common, whatever the rate.
- \`(1 - rate) * hit + rate * miss\` swaps the shares, charging the miss cost to the hits; with \`rate\` 1 it returns 100 instead of 2.`,
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
    q: 'Which list goes from fastest to slowest?',
    options: [
      { t: 'Main memory, L3, L2, L1', why: 'That is slowest to fastest.' },
      { t: 'L1, main memory, L2, L3', why: 'Main memory is the slowest level here, not the second fastest.' },
      { t: 'L3, L2, L1, main memory', why: 'L3 is the slowest cache, not the fastest.' },
      { t: 'Registers, L1, L2, L3, main memory', correct: true, why: 'Each step down is bigger and slower.' },
    ],
  },
  {
    q: 'What does **latency** measure?',
    options: [
      { t: 'How long one access takes, from asking to receiving', correct: true, why: 'That is the definition: the wait for one read.' },
      { t: 'How many bytes a cache can hold', why: 'That is the cache’s size, a different number.' },
      { t: 'How many instructions the CPU runs per second', why: 'That is about the CPU’s speed, not about one access.' },
      { t: 'How often reads hit', why: 'That is the hit rate.' },
    ],
  },
  {
    q: 'A loop reads the same small array 100 times. Where do most of its reads come from after the first pass?',
    options: [
      { t: 'Main memory, every time', why: 'The first pass left copies in the caches.' },
      { t: 'The registers, all 100 times', why: 'Registers hold only a handful of values, not a whole array.' },
      { t: 'The caches: the data was used recently, and it fits', correct: true, why: 'Small, recently used data stays cached, so reads hit.' },
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
