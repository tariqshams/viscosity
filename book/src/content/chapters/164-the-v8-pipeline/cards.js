// Chapter 164 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tiering-what': {
    q: 'What is **tiering** in a JavaScript engine?',
    a: 'Running each function in one of several ways of executing it, starting with the cheapest, and moving it to faster but costlier ones as it gets hot.',
  },
  'why-not-all': {
    q: 'Why doesn’t V8 compile every function to its best machine code before running it?',
    a: 'Most code runs rarely or never, so the compile time and memory would be wasted, and the page would start later. Effort is spent only on code that proves hot.',
  },
  'budget': {
    q: 'In the V8 inside Node 22, why does a function with a loop inside get hot after far fewer calls than `add`?',
    a: 'Hotness is a budget used up by the bytecode actually run (on returns and loop back-jumps), so it measures work done, not calls.',
  },
  'cold-never': {
    q: 'In the particles program, why did `--trace-opt` print nothing at all for `make`?',
    a: 'It ran once, so it never used up its budget; V8 never spends effort optimising code that is not hot.',
  },
  'jit-what': {
    q: 'What makes a compiler a **JIT** compiler?',
    a: 'It compiles while the program is running, shortly before the code is needed, instead of ahead of time.',
  },
  'jit-knows': {
    q: 'What can a JIT compiler know that an ahead-of-time compiler cannot?',
    a: 'What the program has actually done so far: which functions are hot, and which kinds of values they have seen.',
  },
  'jit-background': {
    q: 'In the trace, what does `ConcurrencyMode::kConcurrent` tell you about TurboFan’s compiling?',
    a: 'It happens on another thread, while the program keeps running on its current code.',
  },
  'jitless': {
    q: 'What does `node --jitless` leave running, and why was the same loop so much slower with it?',
    a: 'Only the interpreter: every compiler to machine code is off, so every call pays the interpreter’s cost.',
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
      'The function you return has to remember things between calls. What two things does it need to remember?',
      'It needs a call counter and the compiled function (or `null` while there is none yet). Declare both with `let` inside `tierUp`, before the `return`, so the returned function keeps them (a closure).',
      'Inside the returned function: if `fast` is set, return `fast(x)` straight away. Otherwise add one to the counter, run `slow(x)` and keep its answer, and if the counter now equals `n`, set `fast = compile(slow)`. Return the answer you kept.',
    ],
    walkthrough: `**How to think about it.** This is tiering in miniature. A real engine keeps, for each function, a little state that survives between calls (V8 keeps a budget and, once it has some, the optimised code); here the state is two variables, a counter and the compiled version, and the function \`tierUp\` returns is the only thing that can see them. Start by writing down what every call must do, in order: if there is already a fast version, use it and stop; otherwise run the slow version, count the call, and, if that was call number \`n\`, compile now so the *next* call is fast.

**The solution, line by line.**

- \`function tierUp(slow, compile, n) {\` receives the slow function, a function that makes a fast version of it, and how many calls make it hot.
- \`  let calls = 0;\` is the counter. It lives in \`tierUp\`'s scope, so the function returned below keeps it alive between calls: a closure, exactly as V8's per-function budget belongs to one function.
- \`  let fast = null;\` holds the compiled version; \`null\` means "not compiled yet".
- \`  return (x) => {\` returns the function the tests call as \`run\`.
- \`    if (fast) return fast(x);\` is the fast path: once compiled, every call is one check and one call, and the counter is never touched again.
- \`    calls++;\` counts a slow call.
- \`    const r = slow(x);\` runs the slow tier and keeps its answer.
- \`    if (calls === n) {\` asks whether this call was the one that made the function hot.
- \`      fast = compile(slow);\` compiles, once. Because this runs *after* \`slow(x)\`, call number \`n\` is still a slow call, which is what the second test checks.
- \`    }\` ends the \`if\`.
- \`    return r;\` returns the slow tier's answer.
- \`  };\` and \`}\` close the two functions.

Notice the guarantee the first test checks: both tiers compute \`x * x\`. A real engine promises the same; switching tiers may change speed, never meaning. And notice the last test: a function called fewer than \`n\` times never pays for \`compile\` at all, which is the whole point of starting cheap.

**Common wrong attempts.**

- Calling \`compile(slow)(x)\` on every call after the \`n\`-th: the answers are right, but compiling (the expensive step) happens again and again; it must happen once, and its result must be kept.
- Compiling *before* running the slow version on call \`n\`: then the \`n\`-th call already runs fast, and only \`n - 1\` calls are slow (an off-by-one the second test catches).`,
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
      'In the V8 inside Node 22, a function’s TurboFan budget is `count * len`, where `len` is its bytecode length, and running bytecode uses the budget up. Write `hotAt(len, count, ran)`. `ran[i]` is how many bytes of bytecode call `i + 1` executed. Return the (1-based) number of the call that uses up the budget (total ≥ budget), or `-1` if it never does.',
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
  // each call runs a loop: 60 bytes
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
      'This is the Formal box from the chapter, turned into code. What is the budget, and what do you add up?',
      'Compute the budget once, `count * len`, then walk through `ran`, adding each call’s bytes to a running total.',
      'Return `i + 1` (calls are numbered from 1) as soon as the total is `>=` the budget; if the loop ends first, return `-1`.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box says it all: the budget is \`length × count\`, what a function has spent is the sum of the bytecode it has run, and it is hot once spent reaches budget. So this is a running total against a fixed target, and the only care needed is in the numbering (calls start at 1) and the comparison (reaching the budget exactly counts).

**The solution, line by line.**

- \`const budget = count * len;\` works the budget out once.
- \`let spent = 0;\` starts the running total.
- \`for (let i = 0; i < ran.length; i++) {\` visits each call in order.
- \`  spent += ran[i];\` charges this call's bytecode to the budget.
- \`  if (spent >= budget) return i + 1;\` stops at the first call that reaches the budget; index \`i\` is call number \`i + 1\`.
- \`}\` ends the loop.
- \`return -1;\` is reached only if no call ever used the budget up.

The second test is the interesting one: a function whose every call runs a loop spends 60 bytes per call, so with a budget of \`20 * 6 = 120\` it is hot after two calls. Counting calls alone would call it cold, and that is exactly why V8 measures work instead: a function called rarely but looping a lot is still where the time goes. (V8 also has on-stack replacement for a single long loop, which the chapter's third example showed as "OSR".)

**Common wrong attempts.**

- Using \`>\` instead of \`>=\`: the call that uses the budget up exactly is missed, which the last test catches.
- Counting calls (\`ran.length >= count\`), as the starter does: that is the very idea the chapter argued against.`,
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
      { t: 'The interpreter produces the fastest code', why: 'It is the slowest tier at running code. Its advantage is that it starts almost at once and uses little memory.' },
      { t: 'Most code runs too rarely to repay the cost of compiling it to fast machine code', correct: true, why: 'Starting cheap and compiling only the hot code puts the effort where the time is actually spent.' },
      { t: 'JavaScript cannot be compiled to machine code', why: 'Sparkplug and TurboFan both do exactly that.' },
      { t: 'The interpreter is needed to check syntax', why: 'Syntax is checked by the parser, before any tier runs.' },
    ],
  },
  {
    q: '`total(1000)` loops a thousand times per call; `add(a, b)` does one addition. In the chapter’s runs, which reached TurboFan after fewer calls, and why?',
    options: [
      { t: '`add`, because it is smaller and quicker to compile', why: 'Size of the code is not what makes a function hot. It took thousands of calls.' },
      { t: 'Both after the same number of calls, since V8 counts calls', why: 'V8 counts bytecode run, not calls; that is the point of the budget.' },
      { t: '`total`, because each call runs far more bytecode and uses up the budget faster', correct: true, why: 'Its budget ran out during call 4, where `--trace-opt` marked it, against thousands of calls for `add`.' },
    ],
  },
  {
    q: 'Which of these is a JIT compiler?',
    options: [
      { t: 'Drip’s bytecode compiler, which compiles the whole program before the VM runs it', why: 'That compiles ahead of time: all of it finishes before the program starts.' },
      { t: 'TurboFan, which compiles a function after watching it run', correct: true, why: 'It compiles during the run, using what the run has shown it.' },
      { t: 'Viscosity, which rewrites source before V8 sees it', why: 'Viscosity is an ahead-of-time compiler; its output then goes through V8’s JIT like any other JavaScript.' },
    ],
  },
  {
    q: 'You time a function once, on its first ten calls, to compare two versions. What is wrong with that?',
    options: [
      { t: 'Nothing; the first calls are the most representative', why: 'For hot code, almost all of the running happens after warm-up.' },
      { t: 'Those calls run before the JIT has compiled anything, so you measure warm-up, not the compiled code', correct: true, why: 'That is why the warm-up example times several rounds, and why the first is often slowest.' },
      { t: 'Ten calls are too many to time', why: 'The issue is which calls are timed, not how many.' },
    ],
  },
  {
    q: 'In V8 12.4, `add` has 6 bytes of bytecode and the TurboFan count is 3000. What is its TurboFan budget, and what uses it up?',
    options: [
      { t: '3000 calls; each call uses one', why: 'The budget is measured in bytecode, not calls; that is why a loop-heavy function gets hot sooner.' },
      { t: '18,000 bytes of bytecode, used up by the bytecode `add` runs (charged on returns and loop back-jumps)', correct: true, why: '6 × 3000 = 18,000, and each run of `add` spends the bytecode it went through.' },
      { t: '6 calls, one per byte', why: 'The count multiplies the length; it does not replace it.' },
    ],
  },
];
