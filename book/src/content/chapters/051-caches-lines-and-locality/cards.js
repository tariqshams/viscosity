// Chapter 51 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'register-why': {
    q: 'Why does a CPU keep the values it is working on in registers rather than in memory?',
    a: 'Registers are inside the CPU, so using them costs almost nothing; memory is far away and slow.',
  },
  'hierarchy-order': {
    q: 'Put these in order from fastest to slowest: L3, main memory, L1, L2.',
    a: 'L1, L2, L3, main memory. (Smallest to biggest, too.)',
  },
  'few-misses': {
    q: 'Hits cost 2 ns and misses 100 ns. Roughly how many times slower than all-hits is a 90% hit rate?',
    a: 'About 6 times: 0.9 × 2 + 0.1 × 100 = 11.8 ns, against 2 ns.',
  },
  'small-fits': {
    q: 'Why can a loop that sums one field of every particle object cost less per particle with 1,000 particles than with 1,000,000?',
    a: 'A thousand particles fit in the caches, so after the first touch reads hit; a million do not, so reads keep missing.',
  },
  'line-what': {
    q: 'What is a **cache line**, and how big is it on most mainstream processors?',
    a: 'The block that caches move as one unit: 64 bytes (some chips also use 128).',
  },
  'eighth-why': {
    q: 'With 64-byte cache lines, why is touching every 8th element of a big `Float64Array` not 8 times faster than touching every element?',
    a: 'Eight float64s fill a 64-byte line, so both loops fetch every line of the array, and the fetching is most of the cost.',
  },
  'stride-64': {
    q: 'With 64-byte cache lines, once a loop’s stride is 64 bytes or more, how many of its reads share a line?',
    a: 'None: every read lands in a line of its own.',
  },
  'column-walk': {
    q: 'A big grid of float64s is stored row by row. Why is summing it column by column slower than row by row?',
    a: 'Down a column the stride is a whole row, so each read needs its own line; along a row, eight reads share each line.',
  },
  'fuse-why': {
    q: 'Why can one loop that computes two sums beat two separate loops over an array far bigger than the caches?',
    a: 'It uses each value while its line is still cached, instead of fetching the whole array twice.',
  },
  'latency-vs-bandwidth': {
    q: 'Latency or bandwidth: which one limits a loop that streams through a huge array in order?',
    a: 'Bandwidth: many line requests overlap, so the limit is how many bytes per second can arrive.',
  },
};

export const examples = {
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
    optional: true,
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

Notice which instructions are cheap and which are not, on a real machine: \`add\` stays inside the CPU, while \`load\` and \`store\` reach out to memory, which is why caches matter.

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
  toyCache: {
    optional: true,
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

The tests are three lessons about caches. A first touch always misses. Data that fits in the cache hits on the second pass (four addresses, four slots). Data that does not fit, or that fights over the same slot like 0 and 4, keeps missing. Real caches have smarter rules about where data may go and what to throw out, but they face the same three cases.

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
  countLines: {
    optional: true,
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
};

export const quiz = [
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
];
