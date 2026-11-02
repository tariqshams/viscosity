// Chapter 48 cards. Keys are stable ids: never rename them.

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
};

export const exercises = {
  tinyCpu: {
    title: 'A tiny CPU',
    prompt:
      'Build the fetch, decode, execute loop. A program is an array of instructions, each an array: `[\'load\', r, a]` sets register `r` to `mem[a]`; `[\'add\', r, s]` sets register `r` to register `r` plus register `s`; `[\'store\', r, a]` sets `mem[a]` to register `r`. Write `run(prog, mem)` with four registers, all starting at 0, that runs the instructions in order and returns `mem`.',
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
- Mixing up the two numbers in \`load\` (writing \`r[ins[2]] = mem[ins[1]]\`) reads the wrong address into the wrong register; in the first test it loads \`mem[0]\` into register 0 and then \`mem[0]\` again into register 1.
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
    prompt:
      'Imagine a cache big enough to keep a copy of everything it has ever fetched. Write `countTrips(addrs)` that returns how many of the reads in `addrs` have to go out to main memory: the first read of each address does, and every later read of it is served from the cache.',
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
    q: 'Which of these instructions does **not** touch memory?',
    options: [
      { t: '`load r1, [r2]`', why: 'A load reads memory into a register.' },
      { t: '`store [100], r0`', why: 'A store writes a register into memory.' },
      { t: '`add r0, r0, r1`', correct: true, why: 'Both numbers are already in registers, so the add happens entirely inside the CPU.' },
      { t: 'All of them touch memory', why: 'An add between registers never leaves the CPU; that is why registers exist.' },
    ],
  },
  {
    q: 'Why are caches small, rather than as big as main memory?',
    options: [
      { t: 'Small memories close to the CPU can be fast; big ones can’t', correct: true, why: 'That trade-off between size and speed is the reason caches exist at all.' },
      { t: 'Programs never use more than a few kilobytes', why: 'Programs often use gigabytes; that is exactly why some reads have to go to main memory.' },
      { t: 'JavaScript forbids larger caches', why: 'Caches are hardware; no language controls their size.' },
      { t: 'Caches only store instructions, not data', why: 'There are caches for data as well; this whole chapter is about data reads.' },
    ],
  },
  {
    q: 'With the toy cache from the chapter, reading addresses 8, 16, 8, 8, 16 in that order: how many reads go to main memory?',
    options: [
      { t: '5', why: 'Repeats are served from the cache.' },
      { t: '3', why: 'Only the first read of each address goes to memory, and there are two different addresses.' },
      { t: '1', why: 'Address 16 is new the first time it is read, so it is a trip too.' },
      { t: '2', correct: true, why: 'The first 8 and the first 16; the other three reads find copies in the cache.' },
    ],
  },
  {
    q: 'A program writes nothing about caches. How do its reads come to be served from one?',
    options: [
      { t: 'The engine inserts cache instructions before every read', why: 'There are no such instructions in ordinary code; the hardware checks the cache by itself.' },
      { t: 'The hardware checks the cache on every read and keeps copies of what it fetched', correct: true, why: 'Caching is automatic: the program only sees that some reads are faster than others.' },
      { t: 'They aren’t: only C programs use caches', why: 'Every program running on the CPU goes through its caches.' },
      { t: 'The operating system copies the program into the cache at start-up', why: 'The cache fills read by read, as the program runs.' },
    ],
  },
];
