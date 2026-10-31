// Chapter 61 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tiering-what': {
    q: 'What is **tiering** in a JavaScript engine?',
    a: 'Running each function in one of several execution modes, starting with the cheapest, and moving it to faster but costlier ones as it gets hot.',
  },
  'jit-what': {
    q: 'What makes a compiler a **JIT** compiler?',
    a: 'It compiles while the program is running, just before the code is needed, instead of ahead of time.',
  },
  'why-not-all': {
    q: 'Why doesn’t V8 compile every function to its best machine code before running it?',
    a: 'Most code runs rarely or never, so the compile time and memory would be wasted. Effort is spent only on code that proves hot.',
  },
  'budget': {
    q: 'In the V8 inside Node 22, why can a function with a loop inside get hot after only a few calls?',
    a: 'The budget is used up by the bytecode actually run (on returns and loop back-jumps), so hotness tracks work done, not calls.',
  },
  'ignition-why': {
    q: 'What problem was Ignition originally built to solve?',
    a: 'Memory: its bytecode is a quarter to a half the size of the baseline machine code V8 used to generate.',
  },
  'accumulator': {
    q: 'In Ignition’s `Ldar a1; Add a0, [0]; Return`, where does the sum end up?',
    a: 'In the accumulator, the implicit register most bytecodes read and write. `Return` returns it.',
  },
  'feedback-slot': {
    q: 'What is the `[0]` in `Add a0, [0]`?',
    a: 'A feedback slot number: where the handler records what kinds of values this addition saw.',
  },
  'sparkplug-removes': {
    q: 'Sparkplug does no optimizations. What does it remove, then?',
    a: 'The interpreter’s overhead: decoding each instruction’s operands and dispatching to the next one.',
  },
  'speculate': {
    q: 'What does it mean that Maglev and TurboFan make **speculative** code?',
    a: 'The code assumes what the feedback saw will keep happening (for example, small integers) and checks that assumption, bailing out if it fails.',
  },
  'why-fall': {
    q: 'Why did `add` drop out of TurboFan at call 65,537?',
    a: 'The sum passed the largest Smi, so TurboFan’s assumption of small integers failed and its code was thrown away.',
  },
};

export const examples = {
  warmup: {
    title: 'Warm-up you can time',
    code: `function add(a, b) { return a + b; }
let s = 0;
for (let r = 0; r < 5; r++) {
  const t = performance.now();
  for (let i = 0; i < 2e5; i++) {
    s = add(s, 1);
  }
  const ms = performance.now() - t;
  console.log('round', r,
    ms.toFixed(2), 'ms');
}
// Your numbers are your device's.
// Often the first round is slowest.`,
  },
};

const tierTests = `const sq = (x) => x * x;
function setup(n) {
  const log = [];
  let compiles = 0;
  const slow = (x) => { log.push('slow'); return sq(x); };
  const compile = (f) => {
    compiles++;
    return (x) => { log.push('fast'); return sq(x); };
  };
  const run = tierUp(slow, compile, n);
  return { run, log, count: () => compiles };
}
test('answers never change', () => {
  const { run } = setup(2);
  const out = [1, 2, 3, 4, 5].map((x) => run(x));
  expect(out).toEqual([1, 4, 9, 16, 25]);
});
test('the first n calls are slow, the rest fast', () => {
  const { run, log } = setup(3);
  for (let i = 0; i < 5; i++) run(i);
  expect(log).toEqual(
    ['slow', 'slow', 'slow', 'fast', 'fast']);
});
test('compile happens exactly once', () => {
  const { run, count } = setup(2);
  for (let i = 0; i < 10; i++) run(i);
  expect(count()).toBe(1);
});
test('a cold function is never compiled', () => {
  const { run, count } = setup(5);
  run(1); run(2);
  expect(count()).toBe(0);
});`;

export const exercises = {
  tierUp: {
    title: 'A two-tier function',
    prompt:
      'Write `tierUp(slow, compile, n)`. It returns a function `run` that behaves exactly like `slow`. For the first `n` calls, `run` calls `slow`. Right after the `n`-th call, it calls `compile(slow)` **once**, keeps the result, and uses that faster function for every later call.',
    starter: `function tierUp(slow, compile, n) {
  return (x) => slow(x);
}`,
    solution: `function tierUp(slow, compile, n) {
  let calls = 0;
  let fast = null;
  return (x) => {
    if (fast) return fast(x);
    calls++;
    const r = slow(x);
    if (calls === n) {
      fast = compile(slow);
    }
    return r;
  };
}`,
    tests: tierTests,
    hints: [
      'You need two pieces of state that survive between calls: a call counter and the compiled function (or `null`). A closure holds them.',
      'At the start of each call, if you already have the fast version, use it and stop.',
      'Otherwise count the call, run `slow`, and if this was call number `n`, set `fast = compile(slow)`.',
    ],
    walkthrough: `This is tiering in miniature:

\`\`\`js
return (x) => {
  if (fast) return fast(x);
  calls++;
  const r = slow(x);
  if (calls === n) {
    fast = compile(slow);
  }
  return r;
};
\`\`\`

- **The counter lives in a closure.** Like V8’s per-function budget, it belongs to this one function and survives between calls.
- **Compile once, then reuse.** Compiling is the expensive part, so it must happen exactly once. After that the fast check is a single \`if\`.
- **Cold code is never compiled.** A function called fewer than \`n\` times never pays for \`compile\` at all. That is the whole point: most code isn’t hot.
- **Same answers in every tier.** Both versions compute \`x * x\`. A real engine must guarantee the same: switching tiers may change speed, never meaning.

V8’s real version differs in two ways: it counts bytecode run rather than calls, and it can also throw the fast version away again when an assumption fails.`,
    wrong: [
      {
        code: `function tierUp(slow, compile, n) {
  let calls = 0;
  return (x) => {
    calls++;
    if (calls > n) {
      return compile(slow)(x);
    }
    return slow(x);
  };
}`,
        why: 'This calls `compile` on every call after the `n`-th. Compiling is the expensive step; it must happen once, and its result must be kept.',
      },
      {
        code: `function tierUp(slow, compile, n) {
  let calls = 0;
  let fast = null;
  return (x) => {
    calls++;
    if (calls === n) {
      fast = compile(slow);
    }
    if (fast) return fast(x);
    return slow(x);
  };
}`,
        why: 'Off by one: the `n`-th call already runs the fast version, so only `n - 1` calls are slow.',
      },
    ],
  },
  budgetTier: {
    optional: true,
    title: 'Hot by budget, not by calls',
    prompt:
      'In the V8 inside Node 22, a function’s TurboFan budget is `count * len`, where `len` is its bytecode length, and running bytecode uses the budget up. Write `hotAt(len, count, ran)`. `ran[i]` is how many bytecodes call `i + 1` executed. Return the (1-based) number of the call that uses up the budget (total ≥ budget), or `-1` if it never does.',
    starter: `function hotAt(len, count, ran) {
  return ran.length >= count
    ? count : -1;
}`,
    solution: `function hotAt(len, count, ran) {
  const budget = count * len;
  let spent = 0;
  for (let i = 0; i < ran.length; i++) {
    spent += ran[i];
    if (spent >= budget) return i + 1;
  }
  return -1;
}`,
    tests: `test('straight-line code: one budget per call', () => {
  const ran = Array(10).fill(6);
  expect(hotAt(6, 4, ran)).toBe(4);
});
test('a loop makes a call count for more', () => {
  // each call runs a loop: 60 bytecodes
  const ran = Array(10).fill(60);
  expect(hotAt(6, 20, ran)).toBe(2);
});
test('never hot enough', () => {
  expect(hotAt(10, 100, [5, 5])).toBe(-1);
});
test('exactly at the budget counts', () => {
  expect(hotAt(5, 2, [4, 6, 1])).toBe(2);
});`,
    hints: [
      'Compute the budget once: `count * len`.',
      'Walk through `ran`, adding each call’s bytecodes to a running total.',
      'Return `i + 1` as soon as the total reaches the budget; after the loop, return `-1`.',
    ],
    walkthrough: `A running total against a fixed budget:

\`\`\`js
const budget = count * len;
let spent = 0;
for (let i = 0; i < ran.length; i++) {
  spent += ran[i];
  if (spent >= budget) return i + 1;
}
return -1;
\`\`\`

The second test is the interesting one. A function with a loop inside runs many bytecodes per call, so it uses its budget up after only two calls. Counting calls alone would wrongly call it cold. That’s why V8 measures work done: a function that is called rarely but loops a lot is still where the time goes. (V8 has a separate mechanism for long loops, on-stack replacement, which the Sparkplug post mentions.)`,
    wrong: [
      {
        code: `function hotAt(len, count, ran) {
  const budget = count * len;
  let spent = 0;
  for (let i = 0; i < ran.length; i++) {
    spent += ran[i];
    if (spent > budget) return i + 1;
  }
  return -1;
}`,
        why: 'Using `>` instead of `>=` misses the call that uses the budget up exactly.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does V8 start every function in an interpreter?',
    options: [
      { t: 'The interpreter produces the fastest code', why: 'It’s the slowest tier at running code. Its advantage is that it starts almost immediately and uses little memory.' },
      { t: 'Most code runs too rarely to repay the cost of compiling it to fast machine code', correct: true, why: 'Starting cheap and compiling only the hot code puts the effort where the time is actually spent.' },
      { t: 'JavaScript can’t be compiled to machine code', why: 'Sparkplug, Maglev and TurboFan all do exactly that.' },
      { t: 'The interpreter is needed to check syntax', why: 'Syntax is checked by the parser, before any tier runs.' },
    ],
  },
  {
    q: 'In `Add a0, [0]`, what is `[0]`?',
    options: [
      { t: 'The constant 0 being added', why: 'The value added is in register `a0`. The bracketed operand is something else.' },
      { t: 'The address of the result', why: 'The result goes into the accumulator, implicitly.' },
      { t: 'A feedback slot where Ignition records what kinds of values it saw', correct: true, why: 'The handler is `BinaryOpWithFeedback`; the optimizing tiers later read this feedback.' },
      { t: 'The line number', why: 'Source positions are stored in a separate table, not as operands.' },
    ],
  },
  {
    q: 'Drip’s VM needs `GET_LOCAL, GET_LOCAL, ADD` where Ignition needs `Ldar, Add`. Why?',
    options: [
      { t: 'Ignition skips reading one of the parameters', why: 'Both are read: one by `Ldar`, one as `Add`’s register operand.' },
      { t: 'Ignition has a bigger instruction set', why: 'It does, but that isn’t why this sequence is shorter.' },
      { t: 'Drip’s VM is badly written', why: 'It’s a faithful stack machine. Stack machines simply need explicit pushes.' },
      { t: 'Ignition is a register machine whose accumulator is an implicit operand', correct: true, why: '`Add a0` adds a register to the accumulator directly, so nothing needs pushing first.' },
    ],
  },
  {
    q: 'What does Sparkplug remove, if it does no optimizations?',
    options: [
      { t: 'The cost of decoding bytecode and dispatching to the next instruction', correct: true, why: 'Its machine code does the same work as the interpreter, minus the dispatch loop.' },
      { t: 'The need for feedback', why: 'Sparkplug calls the same builtins as the interpreter and even keeps the feedback vector in its stack frame.' },
      { t: 'Garbage collection', why: 'Unrelated: every tier allocates and relies on the collector.' },
      { t: 'Parsing', why: 'Sparkplug starts from bytecode, which parsing already produced.' },
    ],
  },
  {
    q: 'In the chapter’s run, why did `add` never use Maglev?',
    options: [
      { t: 'Maglev was removed from V8 in 2023', why: 'It was introduced in 2023, in Chrome M117.' },
      { t: '`add` wasn’t hot enough', why: 'It was hot enough for TurboFan, the tier above Maglev.' },
      { t: 'In this Node 22 build, `--v8-options` lists Maglev as off by default', correct: true, why: 'So the run went Ignition, Sparkplug, TurboFan. Defaults differ between builds and versions.' },
      { t: 'Maglev only compiles loops', why: 'The 2023 post describes Maglev compiling whole functions from their bytecode.' },
    ],
  },
  {
    q: 'After TurboFan’s code for `add` was thrown away, what happened to the program?',
    options: [
      { t: 'It crashed with an overflow error', why: 'JavaScript numbers don’t overflow at 2³¹. The program kept running and printed correct results.' },
      { t: 'It carried on correctly in a lower tier, and later re-optimized', correct: true, why: 'Falling back costs only time. The output showed Sparkplug, then TurboFan again.' },
      { t: 'It restarted from the first call', why: 'Execution continued from where it was; only the optimized code was discarded.' },
      { t: 'It stayed in Ignition forever', why: 'The run shows it reaching TurboFan again about ten thousand calls later.' },
    ],
  },
];
