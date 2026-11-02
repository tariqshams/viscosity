// Chapter 51 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 51, 51, 51, 51.

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
  'load-store': {
    q: 'To add 1 to a number kept in memory, which three instructions does a simple CPU run?',
    a: 'Load it into a register, add 1 to the register, store the register back to memory.',
  },
  'cache-why': {
    q: 'Why do CPUs have caches at all?',
    a: 'Main memory is far slower than the CPU, so keeping copies of recently used data close by hides most of that wait.',
  },
  'cache-copy': {
    q: 'When a value is in the cache, where is the original?',
    a: 'Still in main memory: a cache holds copies.',
  },
  'cache-auto': {
    q: 'Who decides what is kept in a CPU cache?',
    a: 'The hardware, by itself, from what the program has recently read; no instruction asks for it.',
  },
  'second-read': {
    q: 'The CPU has just read `xs[0]` from main memory. It reads `xs[0]` again a moment later. Quick or slow, and why?',
    a: 'Most likely quick: the first read left a copy in the cache.',
  },
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
    a: 'Nothing has fetched it yet, so no cache can hold a copy of it. (The prefetcher, in a later chapter, can sometimes fetch it early.)',
  },
  'few-misses': {
    q: 'Hits cost 2 ns and misses 100 ns. Roughly how many times slower than all-hits is a 90% hit rate?',
    a: 'About 6 times: 0.9 × 2 + 0.1 × 100 = 11.8 ns, against 2 ns.',
  },
  'small-fits': {
    q: 'Why can the same loop cost less per element on 1,000 particles than on 1,000,000?',
    a: 'A thousand particles fit in the caches, so reads hit; a million don’t, so reads keep missing.',
  },
  'line-what': {
    q: 'What is a **cache line**, and how big is it on most mainstream processors?',
    a: 'The block that caches move as one unit: 64 bytes.',
  },
  'line-of': {
    q: 'With 64-byte lines, which line holds address 200?',
    a: 'Line 3, because Math.floor(200 / 64) = 3 (it covers addresses 192 to 255).',
  },
  'line-offset': {
    q: 'How can the hardware find an address’s line and offset without dividing?',
    a: 'Because 64 is 2⁶: `a >> 6` is the line and `a & 63` (the low 6 bits) is the offset.',
  },
  'eighth-why': {
    q: 'Why is touching every 8th element of a big Float64Array not 8 times faster than touching every element?',
    a: 'Eight float64s fill a 64-byte line, so both loops fetch every line of the array.',
  },
  'count-lines': {
    q: 'To estimate a loop’s memory cost, what should you count?',
    a: 'The distinct cache lines it touches, not the number of values it reads.',
  },
  'spatial-what': {
    q: 'What is **spatial locality**?',
    a: 'Using data near data you just used, so it is already in a fetched line.',
  },
  'stride-what': {
    q: 'What is the **stride** of reading one field from packed records of 6 fields, 8 bytes each?',
    a: '48 bytes: the distance from one record’s field to the next record’s.',
  },
  'stride-64': {
    q: 'Once a loop’s stride is 64 bytes or more, how many cache lines does each read cost?',
    a: 'A whole line each: no two reads share a line.',
  },
  'column-walk': {
    q: 'A big grid of float64s is stored row by row. Why is summing it column by column slower than row by row?',
    a: 'Down a column the stride is a whole row, so each read needs its own line; along a row, eight reads share each line.',
  },
  'temporal-what': {
    q: 'What is **temporal locality**?',
    a: 'Using the same data again soon, while it is still in a cache.',
  },
  'fuse-why': {
    q: 'Why can one loop that computes two sums beat two separate loops over a huge array?',
    a: 'It uses each value while its line is still cached, instead of fetching the whole array twice.',
  },
  'reuse-soon': {
    q: 'What decides whether data used again is still in the cache?',
    a: 'How much other data was touched in between: if it is more than the cache holds, the data has been thrown out.',
  },
  'bandwidth-what': {
    q: 'What is **bandwidth**?',
    a: 'How many bytes per second can flow from memory to the CPU.',
  },
  'latency-vs-bandwidth': {
    q: 'Latency or bandwidth: which one limits a loop that streams through a huge array in order?',
    a: 'Bandwidth: many line requests overlap, so the limit is how many bytes per second can arrive.',
  },
  'stream-floor': {
    q: 'Roughly how long must reading 8 MB once take, at a bandwidth of about 10 GB per second?',
    a: 'About 0.8 milliseconds: 8 × 10⁶ bytes ÷ (10 × 10⁹ bytes per second).',
  },
  'useful-share': {
    q: 'A loop reads one 8-byte field from packed records of 6 fields. What share of the fetched bytes does it use?',
    a: 'About one sixth: 8 useful bytes in every 48 that stream past.',
  },
  'soa-vs-packed': {
    q: 'Why is summing one field faster from a struct of arrays than from a packed buffer of 6-field records?',
    a: 'The struct of arrays fetches only that field’s bytes; the packed buffer drags five unused fields through the caches with every value.',
  },
};

export const examples = {
  'toy-cache': {
    title: 'A toy cache',
    code: `const cache = new Set();

function read(addr) {
  if (cache.has(addr)) {
    return 'quick (cache)';
  }
  cache.add(addr); // keep a copy
  return 'slow (memory)';
}

const addrs = [16, 24, 16, 16, 32, 24];
for (const a of addrs) {
  console.log(a, read(a));
}`,
  },
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
  'every-eighth': {
    title: 'Every element vs every 8th',
    code: `const n = 1 << 23; // 8M doubles: 64 MB
const xs = new Float64Array(n);

function touch(step) {
  const t0 = performance.now();
  for (let i = 0; i < n; i += step) {
    xs[i] += 1;
  }
  return performance.now() - t0;
}

touch(1);
touch(8); // warm up first
// performance.now() is a clock in ms
const a = touch(1);
const b = touch(8);
console.log('all ms:', a.toFixed(1));
console.log('8th ms:', b.toFixed(1));
const r = (a / b).toFixed(1);
console.log('8th was', r, 'x faster');`,
  },
  'fuse-loops': {
    title: 'Two passes vs one',
    code: `const n = 1 << 23; // 8M doubles: 64 MB
const xs = new Float64Array(n);
for (let i = 0; i < n; i++) {
  xs[i] = i % 7;
}

function twoPasses() {
  let a = 0;
  let b = 0;
  for (const v of xs) a += v;
  for (const v of xs) b += v * v;
  return a + b;
}

function onePass() {
  let a = 0;
  let b = 0;
  for (const v of xs) {
    a += v;
    b += v * v;
  }
  return a + b;
}

function time(f) {
  const t0 = performance.now();
  f();
  return performance.now() - t0;
}

time(twoPasses);
time(onePass); // warm up first
const t2 = time(twoPasses).toFixed(1);
const t1 = time(onePass).toFixed(1);
console.log('two passes, ms:', t2);
console.log('one pass, ms:', t1);`,
  },
};

export const exercises = {
  tinyCpu: {
    title: 'A tiny CPU',
    prompt: 'Build the fetch, decode, execute loop. A program is an array of instructions, each an array: `[\'load\', r, a]` sets register `r` to `mem[a]`; `[\'add\', r, s]` sets register `r` to register `r` plus register `s`; `[\'store\', r, a]` sets `mem[a]` to register `r`. Write `run(prog, mem)` with four registers, all starting at 0, that runs the instructions in order and returns `mem`.',
    starter: `function run(prog, mem) {
  // your code here
}

const prog = [
  ['load', 0, 0],
  ['load', 1, 1],
  ['add', 0, 1],
  ['store', 0, 2],
];
// [3, 4, 7]:
console.log(run(prog, [3, 4, 0]));`,
    solution: `function run(prog, mem) {
  const r = [0, 0, 0, 0];
  let pc = 0;
  while (pc < prog.length) {
    const ins = prog[pc];
    const op = ins[0];
    if (op === 'load') {
      r[ins[1]] = mem[ins[2]];
    } else if (op === 'add') {
      r[ins[1]] = r[ins[1]] + r[ins[2]];
    } else if (op === 'store') {
      mem[ins[2]] = r[ins[1]];
    }
    pc++;
  }
  return mem;
}`,
    tests: `test('add two numbers from memory', () => {
  const prog = [
    ['load', 0, 0],
    ['load', 1, 1],
    ['add', 0, 1],
    ['store', 0, 2],
  ];
  expect(run(prog, [3, 4, 0])).toEqual([3, 4, 7]);
});
test('an empty program changes nothing', () => {
  expect(run([], [1, 2])).toEqual([1, 2]);
});
test('registers start at zero', () => {
  const prog = [['store', 3, 0]];
  expect(run(prog, [9])).toEqual([0]);
});
test('double a number', () => {
  const prog = [
    ['load', 2, 1],
    ['add', 2, 2],
    ['store', 2, 1],
  ];
  expect(run(prog, [0, 21])).toEqual([0, 42]);
});
test('instructions run in order', () => {
  const prog = [
    ['load', 0, 0],
    ['store', 0, 1],
    ['load', 0, 2],
    ['store', 0, 0],
  ];
  expect(run(prog, [1, 0, 5])).toEqual([5, 1, 5]);
});`,
    hints: [
      'You need two pieces of state besides `mem`: an array of four registers, and a program counter `pc` saying which instruction is next.',
      'Loop while `pc` is less than the program’s length. Fetch with `const ins = prog[pc];`, decode by looking at `ins[0]`, and remember to move on with `pc++`.',
      'For `load`, `r[ins[1]] = mem[ins[2]]`; for `add`, `r[ins[1]] = r[ins[1]] + r[ins[2]]`; for `store`, `mem[ins[2]] = r[ins[1]]`. Return `mem` after the loop.',
    ],
    walkthrough: `**How to think about it.** Before writing code, run the starter program by hand, the way the CPU would, keeping track of two things on paper: the four registers, and which instruction you are on. Start with registers \`[0, 0, 0, 0]\` and memory \`[3, 4, 0]\`. Instruction 0, \`['load', 0, 0]\`, copies \`mem[0]\` (3) into register 0. Instruction 1 copies \`mem[1]\` (4) into register 1. Instruction 2, \`['add', 0, 1]\`, makes register 0 equal to 3 + 4 = 7. Instruction 3, \`['store', 0, 2]\`, copies register 0 into \`mem[2]\`. Memory is now \`[3, 4, 7]\`. What you did each time was fetch the instruction, decide what kind it was by its first item, and do it; that is the whole loop.

**The solution, line by line.**

- \`function run(prog, mem) {\` takes the program and the memory.
- \`  const r = [0, 0, 0, 0];\` is the register file: four boxes inside our CPU, all starting at 0.
- \`  let pc = 0;\` is the program counter: the index of the next instruction.
- \`  while (pc < prog.length) {\` keeps going until we run off the end of the program. An empty program never enters the loop.
- \`    const ins = prog[pc];\` is the **fetch**: read the instruction at \`pc\`.
- \`    const op = ins[0];\` begins the **decode**: the first item says what kind of instruction it is.
- \`    if (op === 'load') {\` and the line after it **execute** a load: register number \`ins[1]\` gets the memory value at address \`ins[2]\`.
- \`    } else if (op === 'add') {\` and the line after: register \`ins[1]\` gets its own value plus register \`ins[2]\`'s. Nothing here touches memory.
- \`    } else if (op === 'store') {\` and the line after: memory at address \`ins[2]\` gets register \`ins[1]\`'s value.
- \`    }\` ends the choice.
- \`    pc++;\` moves the program counter on to the next instruction.
- \`  }\` closes the loop.
- \`  return mem;\` hands back memory, changed by the stores.
- \`}\` closes the function.

Notice which instructions are cheap and which are not, on a real machine: \`add\` stays inside the CPU, while \`load\` and \`store\` reach out to memory, which is why the cache in this chapter matters.

**Common wrong attempts.**

- Forgetting \`pc++\` leaves \`pc\` at 0 for ever, so the first instruction runs again and again and the loop never ends.
- Mixing up the two numbers in \`load\` (writing \`r[ins[2]] = mem[ins[1]]\`) reads the wrong address into the wrong register. The first test cannot catch it, because each of its loads uses the same number for both; in the "double a number" test, \`['load', 2, 1]\` reads \`mem[2]\`, which does not exist, into register 1.
- Storing into \`mem[ins[1]]\` writes to the address with the *register's* number rather than the address in the instruction.`,
    wrong: [
      {
        code: `function run(prog, mem) {
  const r = [0, 0, 0, 0];
  for (const ins of prog) {
    if (ins[0] === 'load') {
      r[ins[2]] = mem[ins[1]];
    } else if (ins[0] === 'add') {
      r[ins[1]] = r[ins[1]] + r[ins[2]];
    } else {
      mem[ins[2]] = r[ins[1]];
    }
  }
  return mem;
}`,
        why: 'The load swaps register and address: it writes `mem[ins[1]]` into register `ins[2]`. In `[\'load\', r, a]` the register comes first and the address second.',
      },
      {
        code: `function run(prog, mem) {
  const r = [0, 0, 0, 0];
  for (const ins of prog) {
    if (ins[0] === 'load') {
      r[ins[1]] = mem[ins[2]];
    } else if (ins[0] === 'add') {
      r[ins[1]] = r[ins[1]] + r[ins[2]];
    } else {
      mem[ins[1]] = r[ins[1]];
    }
  }
  return mem;
}`,
        why: 'The store writes to `mem[ins[1]]`, the register’s number, instead of the address `ins[2]`.',
      },
    ],
  },
  countTrips: {
    optional: true,
    title: 'Trips to main memory',
    prompt: 'Imagine a cache big enough to keep a copy of everything it has ever fetched. Write `countTrips(addrs)` that returns how many of the reads in `addrs` have to go out to main memory: the first read of each address does, and every later read of it is served from the cache.',
    starter: `function countTrips(addrs) {
  // your code here
}

// expect 3:
const xs = [16, 24, 16, 32, 24];
console.log(countTrips(xs));`,
    solution: `function countTrips(addrs) {
  const cache = new Set();
  let trips = 0;
  for (const a of addrs) {
    if (!cache.has(a)) {
      trips++;
      cache.add(a);
    }
  }
  return trips;
}`,
    tests: `test('repeats are served from the cache', () => {
  expect(countTrips([16, 24, 16, 32, 24])).toBe(3);
});
test('no reads, no trips', () => {
  expect(countTrips([])).toBe(0);
});
test('the same address over and over', () => {
  expect(countTrips([8, 8, 8, 8])).toBe(1);
});
test('every address new', () => {
  expect(countTrips([0, 8, 16, 24])).toBe(4);
});`,
    hints: [
      'Use the toy cache from the chapter: a `Set` of addresses you have already fetched.',
      'For each address, if the cache does not have it, count a trip and add it to the cache. If it does, do nothing.',
    ],
    walkthrough: `**How to think about it.** With a cache that never throws anything away, a read goes to memory only the first time its address appears; after that, the copy is always there. So the number of trips is the number of *different* addresses in the list, and the runnable toy cache from the chapter already does the bookkeeping.

**The solution, line by line.**

- \`function countTrips(addrs) {\` takes the list of addresses, in the order they are read.
- \`  const cache = new Set();\` is the cache, empty at the start.
- \`  let trips = 0;\` counts trips to main memory.
- \`  for (const a of addrs) {\` visits each read in order.
- \`    if (!cache.has(a)) {\` asks whether a copy is already there; \`!\` means "not".
- \`      trips++;\` counts the trip to memory.
- \`      cache.add(a);\` leaves a copy for next time.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return trips;\` hands back the count.
- \`}\` closes the function.

(An even shorter answer is \`new Set(addrs).size\`, the number of different addresses; the loop version is worth writing once, because the next chapter's exercise is the same loop with a cache that *does* run out of room.)

**Common wrong attempts.**

- Returning \`addrs.length\` counts every read as a trip, as if there were no cache.
- Checking the cache but forgetting \`cache.add(a)\` leaves the cache empty, so every read is a trip.`,
    wrong: [
      {
        code: `function countTrips(addrs) {
  return addrs.length;
}`,
        why: 'This counts every read as a trip to memory, as if there were no cache at all.',
      },
      {
        code: `function countTrips(addrs) {
  const cache = new Set();
  let trips = 0;
  for (const a of addrs) {
    if (!cache.has(a)) {
      trips++;
    }
  }
  return trips;
}`,
        why: 'Nothing is ever added to the cache, so it stays empty and every read is counted as a trip.',
      },
    ],
  },
  toyCache: {
    title: 'A toy cache',
    prompt: 'Write `countMisses(addrs, n)` for a toy cache with `n` slots. An address `a` may only live in slot `a % n`. Go through `addrs` in order. If slot `a % n` already holds `a`, that is a hit. Otherwise it is a miss, and the slot now holds `a` (whatever was there is thrown out). Return the number of misses.',
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
    prompt: 'Write `avgTime(rate, hit, miss)` that returns the average time of one read, when a fraction `rate` (between 0 and 1) of reads hit and cost `hit` nanoseconds each, and the rest miss and cost `miss` nanoseconds each.',
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
  countLines: {
    title: 'How many lines?',
    prompt: 'Write `countLines(addrs)` that returns how many **different** 64-byte cache lines the byte addresses in `addrs` fall in. Address `a` is in line `Math.floor(a / 64)`.',
    starter: `function countLines(addrs) {
  // your code here
}

// expect 2:
console.log(countLines([0, 8, 63, 64]));`,
    solution: `function countLines(addrs) {
  const lines = new Set();
  for (const a of addrs) {
    lines.add(Math.floor(a / 64));
  }
  return lines.size;
}`,
    tests: `test('one line', () => {
  expect(countLines([0, 8, 16, 63])).toBe(1);
});
test('64 starts a new line', () => {
  expect(countLines([0, 8, 63, 64])).toBe(2);
});
test('no addresses', () => {
  expect(countLines([])).toBe(0);
});
test('order and repeats do not matter', () => {
  expect(countLines([300, 0, 300, 5])).toBe(2);
});
test('stride 48, eight reads', () => {
  const xs = [];
  for (let i = 0; i < 8; i++) xs.push(32 + i * 48);
  expect(countLines(xs)).toBe(6);
});`,
    hints: [
      'Two steps: turn each address into its line number, then count how many *different* line numbers there are.',
      'The line of `a` is `Math.floor(a / 64)`. For “how many different”, a `Set` (from *Map and Set*) ignores duplicates for you.',
      'Add every line number to a Set, then return its `size`.',
    ],
    walkthrough: `**How to think about it.** Do the starter by hand. Addresses 0, 8 and 63 are all between 0 and 63, so they are all in line 0; address 64 is the first byte of line 1. That is two lines, even though there are four addresses, because reading three values in one line costs one fetch, not three. So the question is really "how many different line numbers do these addresses give?", and "how many different" is exactly what a \`Set\` is for: it keeps each value once, whatever order they arrive in and however often they repeat.

**The solution, line by line.**

- \`function countLines(addrs) {\` takes the byte addresses a loop reads.
- \`  const lines = new Set();\` will hold each line number once.
- \`  for (const a of addrs) {\` visits every address.
- \`    lines.add(Math.floor(a / 64));\` turns the address into its line number and adds it; adding a number that is already there changes nothing.
- \`  }\` closes the loop.
- \`  return lines.size;\` is the number of different lines.
- \`}\` closes the function.

The last test is the packed layout from the stride diagram: eight reads of \`mass\`, 48 bytes apart starting at 32, land in six lines. You have just built the measuring tool a layout cost model uses.

**Common wrong attempts.**

- Adding up the line *numbers* (\`n += Math.floor(a / 64)\`) gives a sum, not a count: address 300 alone would count as 4.
- \`new Set(addrs).size\` counts different *addresses*. Addresses 0 and 8 are different, but they share one line, so convert each address to its line first.
- \`Math.ceil(a / 64)\` puts address 0 in line 0 but 1 to 64 all in line 1, shifting every boundary by one byte.`,
    wrong: [
      {
        code: `function countLines(addrs) {
  let n = 0;
  for (const a of addrs) {
    n += Math.floor(a / 64);
  }
  return n;
}`,
        why: 'This adds up line *numbers* instead of counting distinct lines. Address 300 alone would count as 4 lines.',
      },
      {
        code: `function countLines(addrs) {
  const lines = new Set(addrs);
  return lines.size;
}`,
        why: 'This counts distinct *addresses*. Addresses 0 and 8 are different, but they share one line. Convert each address to its line number first.',
      },
      {
        code: `function countLines(addrs) {
  const lines = new Set();
  for (const a of addrs) {
    lines.add(Math.ceil(a / 64));
  }
  return lines.size;
}`,
        why: 'Rounding up moves every boundary: 0 lands in line 0 but 8 and 63 in line 1. Lines start at multiples of 64, so round down.',
      },
    ],
  },
  fieldLines: {
    optional: true,
    title: 'Lines for one field',
    prompt: 'Records are packed from address 0, each with `k` fields of 8 bytes. A loop reads field 0 of records `0` to `n - 1`. Write `fieldLines(n, k)` that returns how many different 64-byte lines that loop touches.',
    starter: `function fieldLines(n, k) {
  // your code here
}

// expect 6:
console.log(fieldLines(8, 6));`,
    solution: `function fieldLines(n, k) {
  const lines = new Set();
  for (let i = 0; i < n; i++) {
    const addr = i * k * 8;
    lines.add(Math.floor(addr / 64));
  }
  return lines.size;
}`,
    tests: `test('one field per record: a typed array', () => {
  expect(fieldLines(8, 1)).toBe(1);
  expect(fieldLines(16, 1)).toBe(2);
});
test('six fields: stride 48', () => {
  expect(fieldLines(8, 6)).toBe(6);
});
test('eight fields: one line per record', () => {
  expect(fieldLines(8, 8)).toBe(8);
});
test('sixteen fields: still one per record', () => {
  expect(fieldLines(5, 16)).toBe(5);
});
test('no records', () => {
  expect(fieldLines(0, 6)).toBe(0);
});`,
    hints: [
      'First work out the address the loop reads for record `i`.',
      'Record `i` starts at element `i * k`, which is byte `i * k * 8`, and field 0 is right there.',
      'Turn each of those addresses into a line number and count the distinct ones, as in the last exercise.',
    ],
    walkthrough: `**How to think about it.** This is the last exercise again, except that you work out the addresses yourself. Each record takes \`k\` elements of 8 bytes, so record \`i\` starts \`i * k * 8\` bytes in, and that is where its field 0 is; the stride is \`k * 8\`. With \`k = 6\` the reads are at 0, 48, 96, 144, …, and counting their lines by hand for eight records gives lines 0, 0, 1, 2, 3, 3, 4, 5: six different lines.

**The solution, line by line.**

- \`function fieldLines(n, k) {\` takes the number of records and fields per record.
- \`  const lines = new Set();\` collects distinct line numbers.
- \`  for (let i = 0; i < n; i++) {\` visits each record.
- \`    const addr = i * k * 8;\` is the byte address of record \`i\`'s field 0.
- \`    lines.add(Math.floor(addr / 64));\` records its line.
- \`  }\` closes the loop.
- \`  return lines.size;\` counts them.
- \`}\` closes the function.

Notice the pattern in the tests. With \`k = 1\` (a plain typed array), eight reads share each line. With \`k = 6\`, eight reads touch six lines. From \`k = 8\` up, every record costs its own line, and a bigger record does not make this loop any worse, because it is already paying a full line per read.

**Common wrong attempts.**

- \`Math.ceil(n * k * 8 / 64)\` counts every line of the whole buffer. Once the stride passes 64 bytes the loop skips lines entirely: 5 records of 16 fields span 10 lines, but the loop touches only 5.
- Returning \`n\` assumes one line per read, which is only true once the stride is 64 bytes or more.`,
    wrong: [
      {
        code: `function fieldLines(n, k) {
  return Math.ceil(n * k * 8 / 64);
}`,
        why: 'This counts every line in the whole buffer. Once the stride passes 64 bytes the loop skips lines entirely: 5 records of 16 fields span 10 lines but the loop touches only 5.',
      },
      {
        code: `function fieldLines(n, k) {
  return n;
}`,
        why: 'One line per read is only true once the stride is 64 bytes or more. With small strides, several reads share a line.',
      },
    ],
  },
  countFetches: {
    title: 'A cache that forgets',
    prompt: 'Simulate the toy cache from the diagram. `lines` is the list of cache lines a loop touches, in order; the cache holds at most `cap` lines, and when it is full and a new line arrives, it throws out the line **used longest ago**. Write `countFetches(lines, cap)` that returns how many lines had to be fetched (a line not in the cache when it is used). Using a line that is in the cache makes it the most recently used.',
    starter: `function countFetches(lines, cap) {
  // your code here
}

const two = [0, 1, 2, 0, 1, 2];
console.log(countFetches(two, 2)); // 6`,
    solution: `function countFetches(lines, cap) {
  const cache = []; // oldest first
  let fetches = 0;
  for (const l of lines) {
    const k = cache.indexOf(l);
    if (k >= 0) {
      cache.splice(k, 1);
    } else {
      fetches++;
      if (cache.length === cap) {
        cache.shift();
      }
    }
    cache.push(l);
  }
  return fetches;
}`,
    tests: `test('two passes over 3 lines, cache of 2', () => {
  const two = [0, 1, 2, 0, 1, 2];
  expect(countFetches(two, 2)).toBe(6);
});
test('the same two passes, cache of 3', () => {
  const two = [0, 1, 2, 0, 1, 2];
  expect(countFetches(two, 3)).toBe(3);
});
test('fused: each line used twice in a row', () => {
  const one = [0, 0, 1, 1, 2, 2];
  expect(countFetches(one, 2)).toBe(3);
});
test('using a line keeps it', () => {
  // 0 is used again before 2 arrives,
  // so 1 is the oldest and goes
  expect(countFetches([0, 1, 0, 2, 0], 2)).toBe(3);
});
test('nothing touched', () => {
  expect(countFetches([], 2)).toBe(0);
});`,
    hints: [
      'Keep the cache as an array in order of use: oldest at the front, most recent at the back. Three array methods help: `xs.indexOf(v)` gives the index of `v` (or `-1` if it is not there), `xs.splice(k, 1)` removes the item at index `k`, and `xs.shift()` removes the first item.',
      'For each line: if it is in the cache, take it out of its place (it will go to the back). If it is not, count a fetch, and if the cache is full, throw out the front item.',
      'Either way, finish by pushing the line onto the back: it is now the most recently used. Return the count at the end.',
    ],
    walkthrough: `**How to think about it.** Play the first test by hand with a cache of 2, writing the cache oldest first. Line 0: not there, fetch (1), cache \`[0]\`. Line 1: fetch (2), \`[0, 1]\`. Line 2: fetch (3); the cache is full, so the oldest, 0, goes: \`[1, 2]\`. Line 0 again: it was thrown out, so fetch (4), and 1 goes: \`[2, 0]\`. Line 1: fetch (5), \`[0, 1]\`. Line 2: fetch (6). Six fetches for three lines: the two-pass loop from the diagram. Now notice the bookkeeping you did: the cache is a list kept in order of use, the front is "used longest ago", and a line that is used goes to the back. The fourth test checks the last part: in \`[0, 1, 0, 2, 0]\`, using 0 a second time moves it to the back, so when 2 arrives it is 1 that is thrown out, and the final 0 is a hit.

**The solution, line by line.**

- \`function countFetches(lines, cap) {\` takes the lines in order and the cache size.
- \`  const cache = []; // oldest first\` is the cache, in order of use.
- \`  let fetches = 0;\` counts fetches.
- \`  for (const l of lines) {\` handles each use of a line.
- \`    const k = cache.indexOf(l);\` looks for the line: \`k\` is its position, or \`-1\` if it is not cached.
- \`    if (k >= 0) {\` means a hit.
- \`      cache.splice(k, 1);\` takes it out of its old position, so that it can go to the back below.
- \`    } else {\` means a miss.
- \`      fetches++;\` counts the fetch.
- \`      if (cache.length === cap) {\` checks whether the cache is full.
- \`        cache.shift();\` throws out the front item, the line used longest ago.
- \`      }\` and \`    }\` close the two \`if\`s.
- \`    cache.push(l);\` puts the line at the back: whether it was a hit or a fetch, it is now the most recently used.
- \`  }\` closes the loop.
- \`  return fetches;\` hands back the count.
- \`}\` closes the function.

Compare the first and third tests: the same six uses of three lines cost 6 fetches as two passes and 3 when fused. Then compare the first and second: with room for all three lines, even two passes cost only 3. Temporal locality is about whether the reuse comes before the cache runs out of room.

**Common wrong attempts.**

- Leaving a hit where it is (not moving it to the back) turns the rule into "throw out the line *fetched* longest ago", which gets the fourth test wrong: it throws out 0, which was just used.
- Counting a fetch on every use and only skipping the push for hits counts hits as fetches too.
- Throwing out the *back* item (\`cache.pop()\`) throws out the newest line instead of the oldest.`,
    wrong: [
      {
        code: `function countFetches(lines, cap) {
  const cache = [];
  let fetches = 0;
  for (const l of lines) {
    if (cache.indexOf(l) < 0) {
      fetches++;
      if (cache.length === cap) {
        cache.shift();
      }
      cache.push(l);
    }
  }
  return fetches;
}`,
        why: 'A hit is left in its old place, so the cache throws out the line fetched longest ago, not the one used longest ago. In [0, 1, 0, 2, 0] it throws out 0 just after using it.',
      },
      {
        code: `function countFetches(lines, cap) {
  const cache = [];
  let fetches = 0;
  for (const l of lines) {
    const k = cache.indexOf(l);
    if (k >= 0) {
      cache.splice(k, 1);
    } else {
      fetches++;
      if (cache.length === cap) {
        cache.pop();
      }
    }
    cache.push(l);
  }
  return fetches;
}`,
        why: '`pop` removes the *last* item, the most recently used line. The line to throw out is the oldest, at the front: use `shift`.',
      },
    ],
  },
  usefulShare: {
    optional: true,
    title: 'What share is useful?',
    prompt: 'A long loop reads one 8-byte field from packed records of `k` fields (8 bytes each), with 64-byte lines. Write `usefulShare(k)` that returns the share of the fetched bytes that the loop uses, as a number between 0 and 1.',
    starter: `function usefulShare(k) {
  // your code here
}

// about 0.1667:
console.log(usefulShare(6));`,
    solution: `function usefulShare(k) {
  if (k <= 8) {
    return 1 / k;
  }
  return 8 / 64;
}`,
    tests: `test('one field: every byte used', () => {
  expect(usefulShare(1)).toBeCloseTo(1);
});
test('two fields: half', () => {
  expect(usefulShare(2)).toBeCloseTo(0.5);
});
test('six fields: one sixth', () => {
  expect(usefulShare(6)).toBeCloseTo(1 / 6);
});
test('eight fields: one line per read', () => {
  expect(usefulShare(8)).toBeCloseTo(1 / 8);
});
test('sixteen fields: still one eighth', () => {
  expect(usefulShare(16)).toBeCloseTo(1 / 8);
});`,
    hints: [
      'Think about two cases: records smaller than a line, and records of a line or more.',
      'While a record fits in a line (`k <= 8`), the whole record streams past for each read, and 8 of its `8 * k` bytes are used.',
      'Once the stride reaches 64 bytes, each read fetches one whole line of its own and uses 8 of its 64 bytes; lines in between are skipped.',
    ],
    walkthrough: `**How to think about it.** Use the stride. With \`k\` fields of 8 bytes, consecutive reads are \`8 * k\` bytes apart. If that is less than a line, the loop eventually fetches every line of the buffer, so all \`8 * k\` bytes of each record stream past and 8 of them are used: a share of \`8 / (8 * k)\`, which is \`1 / k\`. If the stride is a line or more, the loop fetches one line per read and skips the rest, so the share is 8 of 64 bytes, one eighth, however big the records get. At exactly \`k = 8\` both rules give one eighth, so it does not matter which case it falls in.

**The solution, line by line.**

- \`function usefulShare(k) {\` takes the number of fields per record.
- \`  if (k <= 8) {\` is the case where a record fits in a line.
- \`    return 1 / k;\` is 8 useful bytes out of \`8 * k\`.
- \`  }\` closes it.
- \`  return 8 / 64;\` is the case of a stride of a line or more: 8 useful bytes in each 64-byte line fetched.
- \`}\` closes the function.

(A one-line version is \`Math.max(1 / k, 1 / 8)\`: the share never drops below one eighth.)

**Common wrong attempts.**

- \`return 1 / k;\` on its own is right for small records but keeps shrinking for big ones; with 16 fields it gives one sixteenth, though the loop never fetches the lines it skips.
- \`return 8 / 64;\` on its own treats every layout as one line per read, which is wrong for a plain typed array (\`k = 1\`), where every byte is used.`,
    wrong: [
      {
        code: `function usefulShare(k) {
  return 1 / k;
}`,
        why: 'For records bigger than a line the loop skips whole lines, so the share stops at one eighth: with 16 fields it is 1/8, not 1/16.',
      },
      {
        code: `function usefulShare(k) {
  return 8 / 64;
}`,
        why: 'Small records share lines: a plain typed array (k = 1) uses every byte it fetches.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a CPU repeatedly do to run a program?',
    options: [
      {
        t: 'Read the whole program at once, then output the answer',
        why: 'It works one instruction at a time (at least in this simple picture).',
      },
      {
        t: 'Fetch an instruction, decode it, execute it',
        correct: true,
        why: 'That loop, repeated billions of times a second, is what running a program means.',
      },
      {
        t: 'Translate the JavaScript source into English',
        why: 'The CPU only understands machine instructions; engines produce those.',
      },
      {
        t: 'Wait for each cache to empty',
        why: 'Caches fill and get replaced continually; the CPU doesn’t wait for them to empty.',
      },
    ],
  },
  {
    q: 'Which of these instructions does **not** touch memory?',
    options: [
      {
        t: '`load r1, [r2]`',
        why: 'A load reads memory into a register.',
      },
      {
        t: '`store [100], r0`',
        why: 'A store writes a register into memory.',
      },
      {
        t: '`add r0, r0, r1`',
        correct: true,
        why: 'Both numbers are already in registers, so the add happens entirely inside the CPU.',
      },
      {
        t: 'All of them touch memory',
        why: 'An add between registers never leaves the CPU; that is why registers exist.',
      },
    ],
  },
  {
    q: 'Why are caches small, rather than as big as main memory?',
    options: [
      {
        t: 'Small memories close to the CPU can be fast; big ones can’t',
        correct: true,
        why: 'That trade-off between size and speed is the reason caches exist at all.',
      },
      {
        t: 'Programs never use more than a few kilobytes',
        why: 'Programs often use gigabytes; that is exactly why some reads have to go to main memory.',
      },
      {
        t: 'JavaScript forbids larger caches',
        why: 'Caches are hardware; no language controls their size.',
      },
      {
        t: 'Caches only store instructions, not data',
        why: 'There are caches for data as well; this whole chapter is about data reads.',
      },
    ],
  },
  {
    q: 'With the toy cache from the chapter, reading addresses 8, 16, 8, 8, 16 in that order: how many reads go to main memory?',
    options: [
      {
        t: '5',
        why: 'Repeats are served from the cache.',
      },
      {
        t: '3',
        why: 'Only the first read of each address goes to memory, and there are two different addresses.',
      },
      {
        t: '1',
        why: 'Address 16 is new the first time it is read, so it is a trip too.',
      },
      {
        t: '2',
        correct: true,
        why: 'The first 8 and the first 16; the other three reads find copies in the cache.',
      },
    ],
  },
  {
    q: 'A program writes nothing about caches. How do its reads come to be served from one?',
    options: [
      {
        t: 'The engine inserts cache instructions before every read',
        why: 'There are no such instructions in ordinary code; the hardware checks the cache by itself.',
      },
      {
        t: 'The hardware checks the cache on every read and keeps copies of what it fetched',
        correct: true,
        why: 'Caching is automatic: the program only sees that some reads are faster than others.',
      },
      {
        t: 'They aren’t: only C programs use caches',
        why: 'Every program running on the CPU goes through its caches.',
      },
      {
        t: 'The operating system copies the program into the cache at start-up',
        why: 'The cache fills read by read, as the program runs.',
      },
    ],
  },
  {
    q: 'Which list goes from fastest to slowest?',
    options: [
      {
        t: 'Main memory, L3, L2, L1',
        why: 'That is slowest to fastest.',
      },
      {
        t: 'L1, main memory, L2, L3',
        why: 'Main memory is the slowest level here, not the second fastest.',
      },
      {
        t: 'L3, L2, L1, main memory',
        why: 'L3 is the slowest cache, not the fastest.',
      },
      {
        t: 'Registers, L1, L2, L3, main memory',
        correct: true,
        why: 'Each step down is bigger and slower.',
      },
    ],
  },
  {
    q: 'What does **latency** measure?',
    options: [
      {
        t: 'How long one access takes, from asking to receiving',
        correct: true,
        why: 'That is the definition: the wait for one read.',
      },
      {
        t: 'How many bytes a cache can hold',
        why: 'That is the cache’s size, a different number.',
      },
      {
        t: 'How many instructions the CPU runs per second',
        why: 'That is about the CPU’s speed, not about one access.',
      },
      {
        t: 'How often reads hit',
        why: 'That is the hit rate.',
      },
    ],
  },
  {
    q: 'A loop reads the same small array 100 times. Where do most of its reads come from after the first pass?',
    options: [
      {
        t: 'Main memory, every time',
        why: 'The first pass left copies in the caches.',
      },
      {
        t: 'The registers, all 100 times',
        why: 'Registers hold only a handful of values, not a whole array.',
      },
      {
        t: 'The caches: the data was used recently, and it fits',
        correct: true,
        why: 'Small, recently used data stays cached, so reads hit.',
      },
      {
        t: 'The disk',
        why: 'An array in a running program lives in memory, not on disk.',
      },
    ],
  },
  {
    q: 'Hits cost 2 ns and misses cost 100 ns. What is the average cost per read at a 90% hit rate?',
    options: [
      {
        t: '2 ns',
        why: 'That would be a 100% hit rate.',
      },
      {
        t: '51 ns',
        why: 'That is the plain average of the two costs, ignoring how often each happens.',
      },
      {
        t: '11.8 ns',
        correct: true,
        why: '0.9 × 2 + 0.1 × 100 = 1.8 + 10 = 11.8.',
      },
      {
        t: '90 ns',
        why: 'That mixes up the hit rate with a time.',
      },
    ],
  },
  {
    q: 'In the benchmark, summing `mass` cost more per particle at 1,000,000 particles than at 1,000. What is the best explanation?',
    options: [
      {
        t: 'The loop does more work per particle when there are more of them',
        why: 'The work per particle is identical: one read, one add.',
      },
      {
        t: 'JavaScript slows down as arrays get longer',
        why: 'Indexing an array costs the same whatever its length.',
      },
      {
        t: 'The CPU runs at a lower speed for big loops',
        why: 'Nothing in the code tells the CPU to slow down; memory is the bottleneck.',
      },
      {
        t: 'A million particles don’t fit in the caches, so many more reads miss',
        correct: true,
        why: 'A thousand particles fit; tens of megabytes don’t, so reads keep going out to main memory.',
      },
    ],
  },
  {
    q: 'With 64-byte cache lines, which pair of addresses is in the same line?',
    options: [
      {
        t: '63 and 64',
        why: '63 is the last byte of line 0; 64 is the first byte of line 1.',
      },
      {
        t: '64 and 127',
        correct: true,
        why: 'Both give Math.floor(a / 64) = 1.',
      },
      {
        t: '0 and 64',
        why: 'Those are the first bytes of lines 0 and 1.',
      },
      {
        t: '100 and 200',
        why: '100 is in line 1, 200 in line 3.',
      },
    ],
  },
  {
    q: 'You read one 8-byte number that isn’t cached. How many bytes come from memory?',
    options: [
      {
        t: '1',
        why: 'Caches don’t move single bytes.',
      },
      {
        t: '8',
        why: 'Even an 8-byte read brings in its whole line.',
      },
      {
        t: 'The whole array',
        why: 'Only the line containing the number is fetched by that read.',
      },
      {
        t: '64: the whole cache line',
        correct: true,
        why: 'The line is the unit of transfer, so its other 56 bytes come along.',
      },
    ],
  },
  {
    q: 'A loop sums one field from records of 6 float64 fields packed together. What is its stride?',
    options: [
      {
        t: '6 bytes',
        why: 'Stride is measured in bytes, and each field is 8 bytes.',
      },
      {
        t: '8 bytes',
        why: 'That would be reading consecutive fields, or a typed array of just that field.',
      },
      {
        t: '48 bytes',
        correct: true,
        why: '6 fields × 8 bytes: from one record’s field to the next record’s.',
      },
      {
        t: '64 bytes',
        why: 'The records are 48 bytes long, not 64.',
      },
    ],
  },
  {
    q: 'Which loop has the best **spatial** locality?',
    options: [
      {
        t: 'Reading xs[0], xs[1], xs[2], … of a Float64Array in order',
        correct: true,
        why: 'Each read is right next to the last, so every byte of every fetched line is used.',
      },
      {
        t: 'Reading every 16th element of a Float64Array',
        why: 'The stride is 128 bytes, so each read needs its own line and uses 8 bytes of it.',
      },
      {
        t: 'Reading the same element a thousand times',
        why: 'That is reuse of the same data, the other kind of locality; it uses only 8 bytes of one line.',
      },
      {
        t: 'Reading elements at random indices',
        why: 'Random reads land in random lines, so nearby bytes are rarely used.',
      },
    ],
  },
  {
    q: 'A grid with 1,000 columns of float64s is stored row by row. Summing one column, what is the stride?',
    options: [
      {
        t: '8 bytes',
        why: 'That is the stride along a row, where neighbours are next to each other.',
      },
      {
        t: '1,000 bytes',
        why: 'Each step skips 1,000 *elements*, and each element is 8 bytes.',
      },
      {
        t: '64 bytes',
        why: 'The stride is fixed by the layout, not by the line size.',
      },
      {
        t: '8,000 bytes',
        correct: true,
        why: 'Going down one row skips a whole row of 1,000 elements × 8 bytes, so every read needs its own line.',
      },
    ],
  },
  {
    q: 'Which is an example of **temporal** locality?',
    options: [
      {
        t: 'Reading xs[0], then xs[1], then xs[2]',
        why: 'That is spatial locality: nearby data.',
      },
      {
        t: 'Storing x and y in separate arrays',
        why: 'That is a layout decision, not a reuse pattern.',
      },
      {
        t: 'Using a value twice within one loop iteration, while it is still cached',
        correct: true,
        why: 'Same data again, soon: that is temporal locality.',
      },
      {
        t: 'Following a pointer to an object',
        why: 'That says nothing about reusing data soon.',
      },
    ],
  },
  {
    q: 'An array is far bigger than the caches. Why can two separate loops over it cost about twice as much memory traffic as one fused loop?',
    options: [
      {
        t: 'The second loop finds the early lines long gone and fetches the whole array again',
        correct: true,
        why: 'By the end of the first pass, the start of the array has been thrown out to make room.',
      },
      {
        t: 'Two loops do twice as many additions',
        why: 'Both versions do the same arithmetic; the difference is in fetching.',
      },
      {
        t: 'Loops cannot read typed arrays twice',
        why: 'They can; the second read just has to fetch the data again.',
      },
      {
        t: 'The fused loop has a smaller stride',
        why: 'Both read every element in order, with stride 8.',
      },
    ],
  },
  {
    q: 'What does **bandwidth** measure?',
    options: [
      {
        t: 'How long a single read takes',
        why: 'That is latency.',
      },
      {
        t: 'How many bytes per second can flow from memory to the CPU',
        correct: true,
        why: 'Latency is how long one access takes; bandwidth is how much can flow per second.',
      },
      {
        t: 'How many bytes a cache line holds',
        why: 'That is the line size, 64 bytes on most processors.',
      },
      {
        t: 'How many registers a CPU has',
        why: 'Registers have nothing to do with memory bandwidth.',
      },
    ],
  },
  {
    q: 'In the benchmark, summing `mass` was faster from a struct of arrays than from the packed Float64Array buffer. Why?',
    options: [
      {
        t: 'The packed buffer contains objects and pointers',
        why: 'It doesn’t: it is one Float64Array. That is why it beats the objects.',
      },
      {
        t: 'The struct of arrays uses fewer bytes per number',
        why: 'Both store each number in 8 bytes.',
      },
      {
        t: 'The packed buffer is read backwards',
        why: 'Both are read in increasing order.',
      },
      {
        t: 'With stride 8, every byte of each line is a mass; with stride 48, most of each line is other fields',
        correct: true,
        why: 'Fewer bytes fetched for the same masses means less waiting and less bandwidth used.',
      },
    ],
  },
  {
    q: 'At about 10 GB per second, what is the least time it can take to read a 64 MB array once?',
    options: [
      {
        t: 'About 6.4 microseconds',
        why: 'That is a thousand times too small: 64 × 10⁶ ÷ (10 × 10⁹) is 0.0064 seconds.',
      },
      {
        t: 'About 6.4 milliseconds',
        correct: true,
        why: '64 million bytes ÷ 10 billion bytes per second = 0.0064 s.',
      },
      {
        t: 'About 6.4 seconds',
        why: 'That is a thousand times too large.',
      },
      {
        t: 'No time at all, if the loop is in order',
        why: 'Order helps the hardware keep the flow going, but the bytes still have to arrive.',
      },
    ],
  },
];
