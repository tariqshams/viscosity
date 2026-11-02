// Chapter 65 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 88, 88, 88, 88, 88.

export const prompts = {
  'tiering-what': {
    q: 'What is **tiering** in a JavaScript engine?',
    a: 'Running each function in one of several ways of executing it, starting with the cheapest, and moving it to faster but costlier ones as it gets hot.',
  },
  'why-not-all': {
    q: 'Why doesn’t V8 compile every function to its best machine code before running it?',
    a: 'Most code runs rarely or never, so the compile time and memory would be wasted, and the page would start later. Effort is spent only on code that proves hot.',
  },
  budget: {
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
  jitless: {
    q: 'What does `node --jitless` leave running, and why was the same loop so much slower with it?',
    a: 'Only the interpreter: every compiler to machine code is off, so every call pays the interpreter’s cost.',
  },
  'ignition-why': {
    q: 'What problem was Ignition originally built to solve?',
    a: 'Memory: its bytecode is a quarter to a half the size of the baseline machine code V8 used to generate.',
  },
  accumulator: {
    q: 'In Ignition’s `Ldar a1; Add a0, [0]; Return`, where does the sum end up?',
    a: 'In the accumulator, the implicit register most bytecodes read and write. `Return` returns it.',
  },
  'feedback-slot': {
    q: 'What is the `[0]` in `Add a0, [0]`?',
    a: 'A feedback slot number: where the handler records what kinds of values this addition saw.',
  },
  'sparkplug-removes': {
    q: 'Sparkplug does no optimisations. What does it remove, then?',
    a: 'The interpreter’s overhead: decoding each instruction’s operands and dispatching to the next one.',
  },
  speculate: {
    q: 'What does it mean that Maglev and TurboFan make **speculative** code?',
    a: 'The code assumes what the feedback saw will keep happening (for example, small integers) and checks that assumption, bailing out if it fails.',
  },
  'sparkplug-batch': {
    q: 'In Node 22, does Sparkplug compile each warm function the moment it is warm?',
    a: 'No: it queues them and compiles a whole batch once their estimated size passes a threshold (4096), on the main thread.',
  },
  'maglev-node': {
    q: 'Why did the tier-watching run never show Maglev?',
    a: 'In this Node 22 build Maglev is not enabled (even `--maglev` reports “Maglev is not enabled.”), so code goes from Sparkplug to TurboFan.',
  },
  'why-fall': {
    q: 'Why did `add` drop out of TurboFan near call 65,536?',
    a: 'The running sum passed the largest Smi (2³¹ − 1), so TurboFan’s assumption of small integers failed and its code was thrown away.',
  },
  'tf-what': {
    q: 'What is *type feedback*?',
    a: 'What the unoptimised code observed while running, such as the shapes and types each operation saw, recorded for the optimising compiler.',
  },
  'tf-slots': {
    q: '`add(a, b)` is called with integers, then with `1.5`, then with strings. What does the feedback slot for `+` say after each stage (V8 12.4)?',
    a: '`BinaryOp:SignedSmall`, then `BinaryOp:Number`, then `BinaryOp:Any`. It only ever widens.',
  },
  'spec-what': {
    q: 'What does it mean for an optimising compiler to *speculate*?',
    a: 'It compiles code that is only correct if what it has seen so far stays true, and checks that assumption at run time.',
  },
  'spec-guard': {
    q: 'What does speculative code do before it relies on a guess, such as an object’s shape?',
    a: 'It runs a check (a guard, such as `CheckMaps`) and deoptimises if the check fails.',
  },
  'spec-why': {
    q: 'Why is speculative code faster than Ignition’s generic `Add`?',
    a: 'Once the guards pass, it can skip every other case (strings, objects, conversions) and work on raw integers or doubles.',
  },
  'spec-deps': {
    q: 'How can optimised code rely on a global that never changes without checking it each time?',
    a: 'It registers a dependency. If the global is ever changed, V8 invalidates and deoptimises that code.',
  },
  'tf-kinds': {
    q: 'Name three kinds of thing V8’s feedback records, one for each kind of operation in the chapter.',
    a: 'Operand kinds at an `Add` (e.g. SignedSmall), maps at a property load (its inline cache), and the target function at a call site.',
  },
  'tf-widen': {
    q: 'Why must a feedback slot never narrow again?',
    a: 'If it narrowed after a few integer calls, the compiler would repeat a guess already shown to fail, and the code would keep deoptimising.',
  },
  'deopt-what': {
    q: 'What is deoptimisation?',
    a: 'Leaving optimised code when one of its assumptions fails, and continuing the same call in unoptimised code (the interpreter).',
  },
  'deopt-frame': {
    q: 'What extra information must optimised code keep so that it can deoptimise?',
    a: 'At every point that can deopt, a map from its own registers and stack to the interpreter’s frame, so that frame can be rebuilt.',
  },
  'deopt-same': {
    q: 'After a deopt, can the program’s result differ from a run that was never optimised?',
    a: 'No. The interpreter finishes the operation from the same point, so only the speed changes.',
  },
  'deopt-offset': {
    q: 'The deopt of `add(\'a\', \'b\')` resumed at bytecode offset 2 with `"b"` in the accumulator. Why there, and why `"b"`?',
    a: 'Offset 2 is `Add a0, [0]`, the add the optimised code could not do; `Ldar a1` at offset 0 had already put `b` in the accumulator.',
  },
  'deopt-widen': {
    q: 'After `add` deopts on strings, why won’t V8 make the same wrong guess when it optimises `add` again?',
    a: 'The failed call went through the interpreter, which widened the feedback. The next compile reads the wider feedback.',
  },
  'deopt-loop': {
    q: 'What is a *deoptimisation loop*?',
    a: 'Optimising with the same assumptions again after they failed, so the code deopts, reoptimises and deopts over and over.',
  },
  'deopt-unlink': {
    q: 'After a deopt, what happens to the optimised code?',
    a: 'It is no longer valid, so it is unlinked from the function, and the next call runs unoptimised code until the function is hot again.',
  },
  'deopt-cheap': {
    q: 'Why does a compiler that compiles fast (like Maglev) make speculation cheaper?',
    a: 'If a guess fails, throwing the code away and compiling again costs little, so V8 can afford to speculate earlier.',
  },
  'flags-internal': {
    q: 'Why should you label any V8 trace you save with the Node and V8 version?',
    a: 'The flags are V8-internal: their names, output and defaults can change in any release.',
  },
  'bc-filter': {
    q: 'What does `--print-bytecode-filter=add` do?',
    a: 'Prints bytecode only for functions named `add`, instead of for every function, Node’s own included.',
  },
  'feedback-slot-o183': {
    q: 'In `Add a0, [0]`, what is `[0]`?',
    a: 'A feedback slot: where this `+` records the types it has seen, for the optimising tiers.',
  },
  osr: {
    q: 'Why is the top-level script optimised with “OSR”?',
    a: 'Its loop never returns, so V8 uses on-stack replacement to switch the running loop to optimised code.',
  },
  'eager-lazy': {
    q: 'What is the difference between an eager and a lazy deopt in V8?',
    a: 'Eager: a check failed inside the optimised code, which deoptimises at once. Lazy: an assumption broke elsewhere, and the code deoptimises next time it runs.',
  },
  'deopt-offset-o183': {
    q: 'A deopt line says `bytecode offset 2`. How do you find out which operation failed?',
    a: 'Print the function’s bytecode with `--print-bytecode` and look at the instruction at `@ 2`.',
  },
  'overflow-deopt': {
    q: 'Why did `function sq(x) { return x * x; }` deoptimise with reason `overflow` when it was only ever given integers?',
    a: 'Its optimised code guessed the result would stay a small integer; once the squares grew past what a Smi holds (from 46341 on, on this build), the guess failed.',
  },
  'gc-line': {
    q: 'A scavenge line reads `166.9 (185.5) -> 166.9 (201.5) MB`. What does it tell you?',
    a: 'The young-generation collection freed nothing: every object it looked at was still reachable.',
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
  acc: {
    title: 'a + b + c on a stack and in an accumulator',
    code: `const a = 1, b = 2, c = 3;
// Drip-style: a stack of values
const st = [];
st.push(a);
st.push(b);
st.push(st.pop() + st.pop());
st.push(c);
st.push(st.pop() + st.pop());
console.log('stack:', st.pop());
// Ignition-style: one accumulator
let acc = c;    // Ldar c
acc = b + acc;  // Add b
acc = a + acc;  // Add a
console.log('accumulator:', acc);
// Same answer; count the steps.`,
  },
  guarded: {
    title: 'A guess, a guard and a way out',
    code: `let fast = 0, slow = 0;
const isSmi = (v) => Number.isInteger(v)
  && Math.abs(v) < 2 ** 31;
function add(a, b) {
  if (isSmi(a) && isSmi(b)) {
    fast++;          // the bet holds
    return a + b;
  }
  slow++;            // the way out
  return a + b;      // same answer
}
for (let i = 0; i < 1000; i++) {
  add(i, 1);
}
console.log(add('a', 'b'));
console.log({ fast, slow });`,
  },
  'deopt-cost': {
    title: 'What one deopt costs',
    code: `function add(a, b) { return a + b; }
function run() {
  let s = 0;
  for (let i = 0; i < 1e6; i++) {
    s = add(s, 1) % 1000;
  }
  return s;
}
function time(label) {
  const t = performance.now();
  run();
  const ms = performance.now() - t;
  console.log(label, ms.toFixed(1));
}
time('warm-up:');
time('optimized:');
add('a', 'b'); // fails the guard
time('after deopt:');
time('again:');
// On my machine the times barely
// moved: one deopt is cheap, and it
// never changes the answer. What
// hurts is deopting again and again.`,
  },
};

export const exercises = {
  tierUp: {
    title: 'A two-tier function',
    prompt: 'Write `tierUp(slow, compile, n)`. It returns a function `run` that behaves exactly like `slow`. For the first `n` calls, `run` calls `slow`. Right after the `n`-th call, it calls `compile(slow)` **once**, keeps the result, and uses that faster function for every later call.',
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
    tests: `const sq = (x) => x * x;
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
});`,
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
    prompt: 'In the V8 inside Node 22, a function’s TurboFan budget is `count * len`, where `len` is its bytecode length, and running bytecode uses the budget up. Write `hotAt(len, count, ran)`. `ran[i]` is how many bytes of bytecode call `i + 1` executed. Return the (1-based) number of the call that uses up the budget (total ≥ budget), or `-1` if it never does.',
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
  runAcc: {
    title: 'A tiny accumulator machine',
    prompt: 'Write `runAcc(code, regs, fb)`, an interpreter for five Ignition-style instructions. `code` is an array of instructions such as `[\'Ldar\', \'a1\']`. `regs` is an object of registers, like `{ a0: 2, a1: 3 }`, and `fb` is an array of feedback slots. The instructions are: `[\'LdaSmi\', n]` puts the number `n` in the accumulator; `[\'Ldar\', r]` copies register `r` into the accumulator; `[\'Star\', r]` copies the accumulator into register `r`; `[\'Add\', r, k]` sets the accumulator to `regs[r] + acc` (in that order) and sets `fb[k]` to `\'number\'` if both operands were numbers, or `\'any\'` otherwise; `[\'Return\']` returns the accumulator.',
    starter: `function runAcc(code, regs, fb) {
  let acc;
  return acc;
}`,
    solution: `function runAcc(code, regs, fb) {
  let acc;
  for (const [op, x, k] of code) {
    if (op === 'LdaSmi') acc = x;
    if (op === 'Ldar') acc = regs[x];
    if (op === 'Star') regs[x] = acc;
    if (op === 'Add') {
      const r = regs[x];
      const num = typeof r === 'number'
        && typeof acc === 'number';
      fb[k] = num ? 'number' : 'any';
      acc = r + acc;
    }
    if (op === 'Return') return acc;
  }
}`,
    tests: `const ADD = [['Ldar', 'a1'], ['Add', 'a0', 0],
  ['Return']];
test('add(2, 3) is 5', () => {
  expect(runAcc(ADD, { a0: 2, a1: 3 }, [])).toBe(5);
});
test('Add records number feedback', () => {
  const fb = [];
  runAcc(ADD, { a0: 2, a1: 3 }, fb);
  expect(fb[0]).toBe('number');
});
test('strings: a0 comes first, feedback is any', () => {
  const fb = [];
  const r = runAcc(ADD, { a0: 'a', a1: 'b' }, fb);
  expect(r).toBe('ab');
  expect(fb[0]).toBe('any');
});
test('LdaSmi and Star', () => {
  const regs = { a0: 10 };
  const code = [['LdaSmi', 5], ['Star', 'r0'],
    ['Ldar', 'a0'], ['Add', 'r0', 1], ['Return']];
  expect(runAcc(code, regs, [])).toBe(15);
  expect(regs.r0).toBe(5);
});`,
    hints: [
      'Your Drip VM had a loop that read one instruction at a time and did what it said. This is the same loop, with one variable, `acc`, instead of a stack.',
      'Loop over `code` with `for (const [op, x, k] of code)`, so each instruction is split into its name and operands. Then one `if` per instruction name (an instruction has only one name, so at most one of them runs).',
      'For `Add`: read `const r = regs[x]`, set `fb[k]` by checking `typeof r === \'number\' && typeof acc === \'number\'`, then `acc = r + acc` (register first, as Ignition does). `Return` is `return acc;`.',
    ],
    walkthrough: `**How to think about it.** You have already built a dispatch loop for Drip: read an instruction, decide what it is, do it, move on. An accumulator machine is the same loop with a different place to keep values: instead of a stack, one variable (\`acc\`) that most instructions read or write, plus named registers in \`regs\`. Write down, for each of the five instructions, what it does to \`acc\`, \`regs\` and \`fb\`, and the code follows almost word for word. The one detail to watch is the order in \`Add\`: Ignition's \`Add a0\` computes \`a0 + acc\`, which matters for strings.

**The solution, line by line.**

- \`function runAcc(code, regs, fb) {\` receives the instructions, the registers and the feedback slots.
- \`  let acc;\` is the accumulator; it starts empty (\`undefined\`).
- \`  for (const [op, x, k] of code) {\` is the dispatch loop. Each instruction is an array, and destructuring splits it into the instruction's name \`op\` and up to two operands, \`x\` and \`k\` (missing ones are \`undefined\`).
- \`    if (op === 'LdaSmi') acc = x;\` loads a constant: the operand itself is the value.
- \`    if (op === 'Ldar') acc = regs[x];\` loads a register into the accumulator; \`x\` is the register's name.
- \`    if (op === 'Star') regs[x] = acc;\` goes the other way, storing the accumulator into a register, so it survives later instructions.
- \`    if (op === 'Add') {\` begins the one instruction with feedback. (Separate \`if\`s are fine here: each instruction has one name, so only one of them matches.)
- \`      const r = regs[x];\` reads the register operand.
- \`      const num = typeof r === 'number'\` and the next line, \`&& typeof acc === 'number';\`, ask whether both operands were numbers.
- \`      fb[k] = num ? 'number' : 'any';\` writes what was seen into slot \`k\`: this is the note Ignition leaves for the compilers above.
- \`      acc = r + acc;\` does the work, register first.
- \`    }\` ends the \`Add\` case.
- \`    if (op === 'Return') return acc;\` ends the run with the accumulator's value.
- The closing braces end the loop and the function.

Trace the first test: \`Ldar a1\` makes \`acc\` 3; \`Add a0, 0\` reads \`r = 2\`, sees two numbers, records \`'number'\` in \`fb[0]\` and makes \`acc\` 5; \`Return\` returns 5. Three instructions, no stack.

**Common wrong attempts.**

- Writing \`acc = acc + r\`: for numbers it gives the same answer, but for strings \`'b' + 'a'\` is \`'ba'\`, not \`'ab'\`; the order of \`+\` matters in JavaScript.
- Forgetting \`Star\`: the last test stores 5 into \`r0\` first, then adds through it, so a machine that ignores \`Star\` reads \`undefined\` and returns \`NaN\`.
- Recording feedback from the result instead of the operands: \`'a' + 'b'\` is a string either way, but \`1 + '1'\` shows why the operands, not the result, are what an optimising compiler needs to know.`,
    wrong: [
      {
        code: `function runAcc(code, regs, fb) {
  let acc;
  for (const [op, x, k] of code) {
    if (op === 'Ldar') acc = regs[x];
    else if (op === 'Add') {
      fb[k] = 'number';
      acc = acc + regs[x];
    } else if (op === 'Return') {
      return acc;
    }
  }
}`,
        why: 'Three mistakes: no `LdaSmi` or `Star`, feedback always says `number`, and `acc + regs[x]` puts the operands in the wrong order, so the string test gives `\'ba\'`.',
      },
    ],
  },
  feedbackLattice: {
    title: 'Feedback that only widens',
    prompt: 'Model the feedback slot for `+`. Write `widen(fb, a, b)`, which returns the new feedback after a call `a + b`, given the old feedback `fb`. The states, from narrowest to widest, are `\'None\'`, `\'SignedSmall\'`, `\'Number\'` and `\'Any\'`. A call where both arguments are integers counts as `\'SignedSmall\'`, both numbers as `\'Number\'`, anything else as `\'Any\'`. The result is the wider of the old state and the call’s. (V8’s real lattice has more states, for example for strings.)',
    starter: `function widen(fb, a, b) {
  return fb;
}`,
    solution: `const ORDER = [
  'None', 'SignedSmall',
  'Number', 'Any',
];
function seen(a, b) {
  const num = (v) =>
    typeof v === 'number';
  if (Number.isInteger(a) &&
      Number.isInteger(b)) return 1;
  if (num(a) && num(b)) return 2;
  return 3;
}
function widen(fb, a, b) {
  const i = ORDER.indexOf(fb);
  return ORDER[Math.max(i, seen(a, b))];
}`,
    tests: `test('the run from this chapter', () => {
  let fb = 'None';
  fb = widen(fb, 1, 2);
  expect(fb).toBe('SignedSmall');
  fb = widen(fb, 1.5, 2);
  expect(fb).toBe('Number');
  fb = widen(fb, 'a', 'b');
  expect(fb).toBe('Any');
});
test('it never narrows', () => {
  expect(widen('Number', 1, 2))
    .toBe('Number');
  expect(widen('Any', 1, 2)).toBe('Any');
});
test('mixed arguments are Any', () => {
  expect(widen('None', 1, 'x')).toBe('Any');
});`,
    hints: [
      'Give each state a position in an array, narrowest first.',
      'Classify the call, then return the state at the larger of the two positions.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's Formal box in code. Two things are needed: a way to compare states (put them in an array, narrowest first, so a state's position is its width), and a way to classify one call (integers, other numbers, anything else). Then the new state is whichever is wider, the old one or the call's, which, with positions, is \`Math.max\`. It is the same pattern as an array's elements kind.

**The solution, line by line.**

- \`const ORDER = [\` with \`'None', 'SignedSmall',\` and \`'Number', 'Any',\` lists the states from narrowest to widest; a state's index is its width.
- \`function seen(a, b) {\` classifies one call by the index of the state it needs.
- \`  const num = (v) =>\` and \`typeof v === 'number';\` is a small helper.
- \`  if (Number.isInteger(a) &&\` and \`Number.isInteger(b)) return 1;\` is the narrowest case, two integers, checked first, because every integer is also a number.
- \`  if (num(a) && num(b)) return 2;\` is two numbers, at least one not an integer.
- \`  return 3;\` is everything else: strings, a mix, objects.
- \`}\` ends \`seen\`.
- \`function widen(fb, a, b) {\` combines the old state with this call.
- \`  const i = ORDER.indexOf(fb);\` turns the old state's name into its width.
- \`  return ORDER[Math.max(i, seen(a, b))];\` takes the wider of the two and turns it back into a name. Because \`max\` never decreases, \`widen('Any', 1, 2)\` stays \`'Any'\`.
- \`}\` closes the function.

**Common wrong attempts.**

- Ignoring \`fb\` and describing only the latest call: the slot then narrows back to \`'SignedSmall'\` after a float, exactly what feedback must not do, since the compiler would make the failed guess again.
- Testing \`num\` before \`Number.isInteger\`: two integers would be classified as \`'Number'\`, too wide, and the compiler would miss the chance to use integer arithmetic.`,
    wrong: [
      {
        code: `const ORDER = [
  'None', 'SignedSmall',
  'Number', 'Any',
];
function widen(fb, a, b) {
  if (Number.isInteger(a) &&
      Number.isInteger(b)) {
    return 'SignedSmall';
  }
  if (typeof a === 'number' &&
      typeof b === 'number') {
    return 'Number';
  }
  return 'Any';
}`,
        why: 'This ignores `fb`, so it only describes the latest call. The slot narrows back to `\'SignedSmall\'` after a float, which is exactly what feedback must not do.',
      },
    ],
  },
  speculate: {
    title: 'A speculative add with a deopt counter',
    prompt: `Write \`makeAdd()\`. It returns a function \`add(a, b)\` that always returns \`a + b\`, plus a state object at \`add.st\`, starting as \`{ mode: 'interp', feedback: 'none', hot: 0, deopts: 0 }\`. Model three tiers:

- **\`'interp'\`**: record feedback. If both arguments are integers (\`Number.isInteger\`) and the feedback isn’t already \`'any'\`, it becomes \`'int'\`; otherwise \`'any'\`. Add 1 to \`hot\`. When \`hot\` reaches 3, optimise: mode becomes \`'int'\` if the feedback is \`'int'\`, else \`'generic'\`.
- **\`'int'\`**: the guard. If both are integers, return \`a + b\`. Otherwise **deopt**: add 1 to \`deopts\`, set mode to \`'interp'\` and \`hot\` to 0, then handle this same call as the interpreter would.
- **\`'generic'\`**: just return \`a + b\`.`,
    starter: `function makeAdd() {
  const st = {
    mode: 'interp',
    feedback: 'none',
    hot: 0,
    deopts: 0,
  };
  function add(a, b) {
    return a + b;
  }
  add.st = st;
  return add;
}`,
    solution: `function makeAdd() {
  const st = {
    mode: 'interp',
    feedback: 'none',
    hot: 0,
    deopts: 0,
  };
  const isInt = Number.isInteger;
  function add(a, b) {
    const ints = isInt(a) && isInt(b);
    if (st.mode === 'int') {
      if (ints) return a + b;
      st.deopts++;
      st.mode = 'interp';
      st.hot = 0;
    }
    if (st.mode === 'generic') {
      return a + b;
    }
    if (!ints) st.feedback = 'any';
    else if (st.feedback !== 'any') {
      st.feedback = 'int';
    }
    st.hot++;
    if (st.hot >= 3) {
      st.mode = st.feedback === 'int'
        ? 'int' : 'generic';
    }
    return a + b;
  }
  add.st = st;
  return add;
}`,
    tests: `test('results never change', () => {
  const add = makeAdd();
  expect(add(1, 2)).toBe(3);
  expect(add(1.5, 1)).toBe(2.5);
  expect(add('a', 'b')).toBe('ab');
  for (let i = 0; i < 5; i++) add(i, 1);
  expect(add('x', 1)).toBe('x1');
});
test('three integer calls optimize', () => {
  const add = makeAdd();
  add(1, 2);
  add(3, 4);
  expect(add.st.mode).toBe('interp');
  add(5, 6);
  expect(add.st.mode).toBe('int');
  expect(add.st.feedback).toBe('int');
});
test('a string call deopts', () => {
  const add = makeAdd();
  for (let i = 0; i < 3; i++) add(i, 1);
  expect(add('a', 'b')).toBe('ab');
  expect(add.st.deopts).toBe(1);
  expect(add.st.mode).toBe('interp');
  expect(add.st.feedback).toBe('any');
  expect(add.st.hot).toBe(1);
});
test('a float fails the guard too', () => {
  const add = makeAdd();
  for (let i = 0; i < 3; i++) add(i, 1);
  expect(add(1.5, 1)).toBe(2.5);
  expect(add.st.deopts).toBe(1);
});
test('it reoptimizes, generically', () => {
  const add = makeAdd();
  for (let i = 0; i < 3; i++) add(i, 1);
  add('a', 'b');
  add(1, 2);
  add(3, 4);
  expect(add.st.mode).toBe('generic');
  add('c', 'd');
  add(1, 2);
  expect(add.st.deopts).toBe(1);
});
test('mixed feedback never speculates', () => {
  const add = makeAdd();
  add(1, 2);
  add('a', 'b');
  add(3, 4);
  expect(add.st.mode).toBe('generic');
  add('x', 'y');
  expect(add.st.deopts).toBe(0);
});`,
    hints: [
      'Work out `ints` (both arguments are integers) once, at the top of `add`. Every tier needs it.',
      'In mode `\'int\'`, return early if `ints`. If not, update the counters and switch to `\'interp\'`, but **don’t return**: let the call fall through to the interpreter code below.',
      'In the interpreter part, a non-integer call always makes the feedback `\'any\'`, and `\'any\'` never goes back to `\'int\'`. Only then count `hot` and maybe pick the next mode.',
    ],
    walkthrough: `**How to think about it.** This is a toy, but each part matches something V8 does. Before writing code, sort out what every call needs to know (are both arguments integers?) and then what each mode does with that: the interpreter records feedback and counts heat; the integer mode trusts the feedback after one check; the generic mode trusts nothing and needs no check. The one subtle part is the deopt: a call that fails the guard is not an error and must still return \`a + b\`, so instead of returning it *falls through* to the interpreter's code, which is what V8's deoptimiser does when it hands the rest of the call to Ignition.

**The solution, line by line.**

- \`const st = { mode: 'interp', feedback: 'none', hot: 0, deopts: 0 };\` (over several lines) is the function's state, like V8's per-function tier, feedback slot and budget.
- \`const isInt = Number.isInteger;\` is a short name for the check.
- \`function add(a, b) {\` is the function the tests call.
- \`  const ints = isInt(a) && isInt(b);\` works out once what every mode needs to know.
- \`  if (st.mode === 'int') {\` is the optimised, speculative tier.
- \`    if (ints) return a + b;\` is the guard and the fast path: one check, then the work.
- \`    st.deopts++;\` counts the bailout.
- \`    st.mode = 'interp';\` throws the optimised "code" away (unlinking it).
- \`    st.hot = 0;\` starts the heat count again.
- \`  }\` ends the optimised tier, *without returning* on a failed guard, so the same call carries on below.
- \`  if (st.mode === 'generic') {\` and \`return a + b;\` is code compiled from \`'any'\` feedback: nothing to check, nothing to fail.
- \`  if (!ints) st.feedback = 'any';\` is the interpreter recording what it saw; a non-integer call always widens to \`'any'\`.
- \`  else if (st.feedback !== 'any') {\` and \`st.feedback = 'int';\` record integers, but never narrow \`'any'\` back.
- \`  st.hot++;\` counts the call.
- \`  if (st.hot >= 3) {\` decides to optimise, and \`st.mode = st.feedback === 'int' ? 'int' : 'generic';\` picks the tier the feedback justifies: speculate only on clean feedback.
- \`  return a + b;\` the interpreter's answer, the same as every tier's.
- \`add.st = st;\` and \`return add;\` expose the state for the tests.

Trace the "it reoptimizes, generically" test: three integer calls optimise to \`'int'\`; \`add('a', 'b')\` fails the guard, deopts, and falls through to the interpreter, which records \`'any'\` and sets \`hot\` to 1; two more calls make \`hot\` 3, and the feedback says \`'any'\`, so the new mode is \`'generic'\`; the next string call needs no guard, so \`deopts\` stays 1. That is the d5.js trace from the chapter, in miniature.

**Common wrong attempts.**

- Returning nothing (or throwing) when the guard fails: the call that deopts must still produce \`'ab'\`, which the first test checks.
- Letting integer calls set the feedback back to \`'int'\` after \`'any'\`: the function then reoptimises to \`'int'\` and deopts again on the next string, a deoptimisation loop.
- Optimising to \`'int'\` regardless of feedback: mixed early calls would then deopt, which the last test catches.`,
    wrong: [
      {
        code: `function makeAdd() {
  const st = {
    mode: 'interp',
    feedback: 'none',
    hot: 0,
    deopts: 0,
  };
  const isInt = Number.isInteger;
  function add(a, b) {
    const ints = isInt(a) && isInt(b);
    if (st.mode === 'int') {
      if (ints) return a + b;
      st.deopts++;
      st.mode = 'interp';
      st.hot = 0;
      return a + b;
    }
    if (st.mode === 'generic') {
      return a + b;
    }
    if (!ints) st.feedback = 'any';
    else if (st.feedback !== 'any') {
      st.feedback = 'int';
    }
    st.hot++;
    if (st.hot >= 3) {
      st.mode = st.feedback === 'int'
        ? 'int' : 'generic';
    }
    return a + b;
  }
  add.st = st;
  return add;
}`,
        why: 'The deopting call returns before the interpreter part runs, so it never records `\'any\'`. The feedback still says `\'int\'`, the function reoptimises with the same guess, and the next string deopts again: a deoptimisation loop.',
      },
      {
        code: `function makeAdd() {
  const st = {
    mode: 'interp',
    feedback: 'none',
    hot: 0,
    deopts: 0,
  };
  const isInt = Number.isInteger;
  function add(a, b) {
    const ints = isInt(a) && isInt(b);
    if (st.mode === 'int') {
      if (ints) return a + b;
      st.deopts++;
      st.mode = 'interp';
      st.hot = 0;
    }
    if (st.mode === 'generic') {
      return a + b;
    }
    st.feedback = ints ? 'int' : 'any';
    st.hot++;
    if (st.hot >= 3) {
      st.mode = st.feedback === 'int'
        ? 'int' : 'generic';
    }
    return a + b;
  }
  add.st = st;
  return add;
}`,
        why: 'Feedback that only remembers the last call can narrow again. After `1, \'a\', 3` it says `\'int\'`, so the function speculates on integers it has already seen fail.',
      },
    ],
  },
  parseDeopt: {
    title: 'Parse a --trace-deopt line',
    prompt: 'Write `parseDeopt(line)`. If `line` is a V8 bailout line (it contains `(kind: ` and `reason: `), return `{ kind, reason, fn, tier, offset }`: the kind (e.g. `\'deopt-eager\'`), the reason text up to its closing `)`, the function name after `<JSFunction ` (`\'\'` for the nameless top-level script), the tier in `<Code …>` (e.g. `\'TURBOFAN\'`), and the bytecode offset as a **number**. For any other line return `null`. Regular expressions with `line.match(/…(…)…/)` are the easiest tool: the part in brackets is captured as `m[1]`.',
    starter: `function parseDeopt(line) {
  return null;
}`,
    solution: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
    tests: `// real lines from Node v22.23.4,
// V8 12.4.254.21 (split for width)
const SMI = [
  '[bailout (kind: deopt-eager, ',
  'reason: not a Smi): begin. ',
  'deoptimizing 0x207bb9a23eb1 ',
  '<JSFunction add (sfi = ',
  '0x1a9fac5db7e1)>, 0x083907e81fa9 ',
  '<Code TURBOFAN>, opt id 0, ',
  'bytecode offset 2, deopt exit 0, ',
  'FP to SP delta 32, caller SP ',
  '0x7ffffc8cc8d0, pc 0x7f12c0005d75]',
].join('');
const CALL = [
  '[bailout (kind: deopt-eager, ',
  'reason: Insufficient type feedback ',
  'for call): begin. deoptimizing ',
  '0x207bb9a23629 <JSFunction ',
  '(sfi = 0x1a9fac5db779)>, ',
  '0x083907e82251 <Code TURBOFAN>, ',
  'opt id 1, bytecode offset 41, ',
  'deopt exit 4, FP to SP delta 104]',
].join('');
const MARK = [
  '[marking 0x207bb9a23eb1 <JSFunction ',
  'add (sfi = 0x1a9fac5db7e1)> for ',
  'optimization to TURBOFAN, ',
  'ConcurrencyMode::kConcurrent, ',
  'reason: hot and stable]',
].join('');
test('a named function', () => {
  expect(parseDeopt(SMI)).toEqual({
    kind: 'deopt-eager',
    reason: 'not a Smi',
    fn: 'add',
    tier: 'TURBOFAN',
    offset: 2,
  });
});
test('the nameless top-level script', () => {
  const d = parseDeopt(CALL);
  expect(d.fn).toBe('');
  expect(d.reason).toBe(
    'Insufficient type feedback for call');
  expect(d.offset).toBe(41);
});
test('other lines are not deopts', () => {
  expect(parseDeopt(MARK)).toBe(null);
  expect(parseDeopt('ab')).toBe(null);
});`,
    hints: [
      'Test for the bailout first: if `line.match(/\\(kind: ([^,]+),/)` is `null`, return `null`. A `--trace-opt` line has `reason:` but no `(kind:`.',
      'For the reason, `[^)]*` means “any characters except `)`”, so the match stops at the reason’s own closing bracket instead of running to the last `)` on the line.',
      'The name after `<JSFunction ` may be missing, so allow an optional space and an empty name: `/<JSFunction ?([^ (]*)/`. Convert the offset with `Number(...)`.',
    ],
    walkthrough: `**How to think about it.** A trace line is text with landmarks: \`(kind: \`, \`reason: \`, \`<JSFunction \`, \`<Code \`, \`bytecode offset \`. Rather than one giant pattern for the whole line, find each landmark separately and capture what follows it; if V8 adds a field in the middle one day, the others still parse. Decide first whether the line is a bailout at all: a \`--trace-opt\` line also contains \`reason:\`, but never \`(kind:\`, so both landmarks must be present. Then look at the awkward cases in the tests: the top-level script has no name after \`<JSFunction\`, and the reason contains spaces and stops at a \`)\`.

**The solution, line by line.**

- \`const KIND = /\\(kind: ([^,]+),/;\` finds \`(kind: \` and captures everything up to the next comma: \`deopt-eager\`. (\`[^,]\` means "any character except a comma"; the \`\\(\` is a literal bracket.)
- \`const REASON = /reason: ([^)]*)\\)/;\` captures the reason up to its own closing bracket. \`[^)]*\` cannot cross a \`)\`, so the match stops at the right place instead of running to the last \`)\` on the line.
- \`const FN = /<JSFunction ?([^ (]*)/;\` allows an optional space after \`<JSFunction\`, then captures characters that are neither a space nor \`(\`. For \`<JSFunction add (sfi\` that is \`add\`; for the nameless \`<JSFunction (sfi\` it is the empty string.
- \`const CODE = /<Code (\\w+)>/;\` captures the tier inside \`<Code …>\`: \`TURBOFAN\`.
- \`const OFF = /bytecode offset (\\d+)/;\` captures the offset's digits.
- \`const k = line.match(KIND); const r = line.match(REASON);\` and \`if (!k || !r) return null;\` A line without both landmarks is not a bailout.
- The next three \`match\` calls find the optional fields.
- \`kind: k[1], reason: r[1],\` take the captured text (\`m[1]\` is the part in the first brackets).
- \`fn: f ? f[1] : '', tier: c ? c[1] : '',\` fall back to empty strings if a landmark is missing.
- \`offset: o ? Number(o[1]) : -1,\` turns the digits \`'2'\` into the number \`2\`, so you can look it up in a \`--print-bytecode\` listing or sort by it.

This parser fits V8 12.4's format. Nothing promises that format will last, which is why the chapter labels every trace with its version.

**Common wrong attempts.**

- Leaving the offset as a string: \`'2'\` is not \`2\`, so the first test fails. Convert with \`Number(...)\`.
- A greedy reason pattern, \`reason: (.*)\\)\`: \`.*\` runs to the *last* \`)\` on the line and swallows \`begin. deoptimizing …\` into the reason.
- \`/<JSFunction (\\w+)/\` for the name: it needs a word after the space, so on the nameless script line it finds nothing, or (worse, with other patterns) captures \`(sfi\`.
- Checking only for \`reason: \`: the \`--trace-opt\` "marking" line also has one, so it would wrongly be parsed as a deopt.`,
    wrong: [
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? o[1] : -1,
  };
}`,
        why: 'The offset stays a string, `\'2\'`, which isn’t `2`. Convert it with `Number(...)`.',
      },
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: (.*)\\)/;
const FN = /<JSFunction ?([^ (]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
        why: '`(.*)` is greedy: it runs to the last `)` on the line, so the reason swallows `begin. deoptimizing …`. Use `[^)]*`.',
      },
      {
        code: `const KIND = /\\(kind: ([^,]+),/;
const REASON = /reason: ([^)]*)\\)/;
const FN = /<JSFunction ([^ ]*)/;
const CODE = /<Code (\\w+)>/;
const OFF = /bytecode offset (\\d+)/;

function parseDeopt(line) {
  const k = line.match(KIND);
  const r = line.match(REASON);
  if (!k || !r) return null;
  const f = line.match(FN);
  const c = line.match(CODE);
  const o = line.match(OFF);
  return {
    kind: k[1],
    reason: r[1],
    fn: f ? f[1] : '',
    tier: c ? c[1] : '',
    offset: o ? Number(o[1]) : -1,
  };
}`,
        why: 'For the nameless top-level script, `<JSFunction (sfi = …)>` has no name, so `([^ ]*)` captures `(sfi`. Allow the space to be missing and stop at `(`: `/<JSFunction ?([^ (]*)/`.',
      },
    ],
  },
  parseGc: {
    optional: true,
    title: 'Parse a --trace-gc line',
    prompt: 'Write `parseGc(line)` for one line of V8 12.4’s `--trace-gc` output. Return `{ ms, type, before, after, pause }`: the time since start (the number before ` ms: `), the collector (`\'Scavenge\'` or `\'Mark-Compact\'`), the object size before and after in MB (the numbers outside the brackets, around `->`), and the pause in ms (the first number after `MB, pooled: … MB, `). All numbers must be numbers. Return `null` for any other line.',
    starter: `function parseGc(line) {
  return null;
}`,
    solution: `function parseGc(line) {
  const m = line.match(
    /(\\d+) ms: ([\\w-]+) ([\\d.]+) /);
  const a = line.match(/-> ([\\d.]+) /);
  const p = line.match(
    /MB, ([\\d.]+) \\//);
  if (!m || !a || !p) return null;
  return {
    ms: Number(m[1]),
    type: m[2],
    before: Number(m[3]),
    after: Number(a[1]),
    pause: Number(p[1]),
  };
}`,
    tests: `// real lines: Node v22.23.4, V8 12.4
const SC = '[27248:0x31074000]       ' +
  '24 ms: Scavenge 4.4 (5.1) -> 3.9 ' +
  '(6.1) MB, pooled: 0 MB, 1.03 / ' +
  '0.00 ms  (average mu = 1.000, ' +
  'current mu = 1.000) allocation ' +
  'failure; ';
const MC = '[27248:0x31074000]      ' +
  '214 ms: Mark-Compact 53.7 (86.2) ' +
  '-> 41.0 (74.2) MB, pooled: 0 MB, ' +
  '44.16 / 0.00 ms  (+ 0.2 ms in 0 ' +
  'steps since start of marking) ' +
  'GC in old space requested';
test('a scavenge', () => {
  expect(parseGc(SC)).toEqual({ ms: 24,
    type: 'Scavenge', before: 4.4,
    after: 3.9, pause: 1.03 });
});
test('a mark-compact', () => {
  const g = parseGc(MC);
  expect(g.type).toBe('Mark-Compact');
  expect(g.before - g.after)
    .toBeCloseTo(12.7);
  expect(g.pause).toBe(44.16);
});
test('other lines', () => {
  expect(parseGc('3000000')).toBe(null);
});`,
    hints: [
      'Use one regular expression per landmark: `ms: ` then the collector and the first size; `-> ` then the size after; `MB, ` then a number then ` /` for the pause.',
      'The collector name contains a hyphen, so use `[\\w-]+`, not `\\w+`.',
      'Convert every captured number with `Number(...)`.',
    ],
    walkthrough: `**How to think about it.** The format of a \`--trace-gc\` line comes from one \`printf\` in V8's \`gc-tracer.cc\`: the time, the collector, the object size (memory size) \`->\` object size (memory size), then the pause. Reading the source tells you what each number is; the regular expressions only have to follow it. Pick one landmark per number: \` ms: \` comes right before the collector and the first size; \`-> \` comes right before the size after; and the pause is the first number after \`MB, \` that is followed by \` /\`.

**The solution, line by line.**

- \`const m = line.match(/(\\d+) ms: ([\\w-]+) ([\\d.]+) /);\` captures three things at once: the digits before \` ms: \` (the time), the collector's name (letters and hyphens, because \`Mark-Compact\` has one), and the first size, digits and dots.
- \`const a = line.match(/-> ([\\d.]+) /);\` captures the size after the arrow.
- \`const p = line.match(/MB, ([\\d.]+) \\//);\` looks for \`MB, \`, a number and \` /\`. It first tries at \`MB, pooled\` and fails (a letter is not a digit), then matches at \`0 MB, 1.03 /\`, which is the pause.
- \`if (!m || !a || !p) return null;\` Any other line is not a GC line.
- The returned object converts every capture with \`Number(...)\`, because the tests compare numbers, not strings.

\`before - after\` is what the collection freed; for the scavenge at 577 ms in the chapter it is zero, because everything survived.

**Common wrong attempts.**

- \`(\\w+)\` for the collector: \`\\w\` does not include \`-\`, so \`Mark-Compact\` is captured as \`Mark\` and the rest of the pattern no longer lines up.
- Forgetting \`Number(...)\`: \`'4.4'\` is not \`4.4\`, and the tests fail even though the text is right.
- Taking the first number after \`MB, \` without the \` /\` after it: on these lines that finds the \`0\` of \`pooled: 0 MB\`, not the pause.`,
    wrong: [
      {
        code: `function parseGc(line) {
  const m = line.match(
    /(\\d+) ms: (\\w+) ([\\d.]+) /);
  const a = line.match(/-> ([\\d.]+) /);
  const p = line.match(
    /MB, ([\\d.]+) \\//);
  if (!m || !a || !p) return null;
  return {
    ms: Number(m[1]),
    type: m[2],
    before: Number(m[3]),
    after: Number(a[1]),
    pause: Number(p[1]),
  };
}`,
        why: 'With `\\w+` the collector of a mark-compact is read as `Mark`, and the rest of the pattern no longer matches. Allow hyphens: `[\\w-]+`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does V8 start every function in an interpreter?',
    options: [
      {
        t: 'The interpreter produces the fastest code',
        why: 'It is the slowest tier at running code. Its advantage is that it starts almost at once and uses little memory.',
      },
      {
        t: 'Most code runs too rarely to repay the cost of compiling it to fast machine code',
        correct: true,
        why: 'Starting cheap and compiling only the hot code puts the effort where the time is actually spent.',
      },
      {
        t: 'JavaScript cannot be compiled to machine code',
        why: 'Sparkplug and TurboFan both do exactly that.',
      },
      {
        t: 'The interpreter is needed to check syntax',
        why: 'Syntax is checked by the parser, before any tier runs.',
      },
    ],
  },
  {
    q: '`total(1000)` loops a thousand times per call; `add(a, b)` does one addition. In the chapter’s runs, which reached TurboFan after fewer calls, and why?',
    options: [
      {
        t: '`add`, because it is smaller and quicker to compile',
        why: 'Size of the code is not what makes a function hot. It took thousands of calls.',
      },
      {
        t: 'Both after the same number of calls, since V8 counts calls',
        why: 'V8 counts bytecode run, not calls; that is the point of the budget.',
      },
      {
        t: '`total`, because each call runs far more bytecode and uses up the budget faster',
        correct: true,
        why: 'Its budget ran out during call 4, where `--trace-opt` marked it, against thousands of calls for `add`.',
      },
    ],
  },
  {
    q: 'Which of these is a JIT compiler?',
    options: [
      {
        t: 'Drip’s bytecode compiler, which compiles the whole program before the VM runs it',
        why: 'That compiles ahead of time: all of it finishes before the program starts.',
      },
      {
        t: 'TurboFan, which compiles a function after watching it run',
        correct: true,
        why: 'It compiles during the run, using what the run has shown it.',
      },
      {
        t: 'Viscosity, which rewrites source before V8 sees it',
        why: 'Viscosity is an ahead-of-time compiler; its output then goes through V8’s JIT like any other JavaScript.',
      },
    ],
  },
  {
    q: 'You time a function once, on its first ten calls, to compare two versions. What is wrong with that?',
    options: [
      {
        t: 'Nothing; the first calls are the most representative',
        why: 'For hot code, almost all of the running happens after warm-up.',
      },
      {
        t: 'Those calls run before the JIT has compiled anything, so you measure warm-up, not the compiled code',
        correct: true,
        why: 'That is why the warm-up example times several rounds, and why the first is often slowest.',
      },
      {
        t: 'Ten calls are too many to time',
        why: 'The issue is which calls are timed, not how many.',
      },
    ],
  },
  {
    q: 'In V8 12.4, `add` has 6 bytes of bytecode and the TurboFan count is 3000. What is its TurboFan budget, and what uses it up?',
    options: [
      {
        t: '3000 calls; each call uses one',
        why: 'The budget is measured in bytecode, not calls; that is why a loop-heavy function gets hot sooner.',
      },
      {
        t: '18,000 bytes of bytecode, used up by the bytecode `add` runs (charged on returns and loop back-jumps)',
        correct: true,
        why: '6 × 3000 = 18,000, and each run of `add` spends the bytecode it went through.',
      },
      {
        t: '6 calls, one per byte',
        why: 'The count multiplies the length; it does not replace it.',
      },
    ],
  },
  {
    q: 'Drip’s VM needs `load.local, load.local, add` where Ignition needs `Ldar, Add`. Why?',
    options: [
      {
        t: 'Ignition skips reading one of the parameters',
        why: 'Both are read: one by `Ldar`, one as `Add`’s register operand.',
      },
      {
        t: 'Ignition is a register machine whose accumulator is an implicit operand',
        correct: true,
        why: '`Add a0` adds a register to the accumulator directly, so nothing needs pushing first.',
      },
      {
        t: 'Drip’s VM is badly written',
        why: 'It is a faithful stack machine. Stack machines need explicit pushes.',
      },
    ],
  },
  {
    q: 'In `Add a0, [0]`, what is `[0]`?',
    options: [
      {
        t: 'The constant 0 being added',
        why: 'The value added is in register `a0`. The bracketed operand is something else.',
      },
      {
        t: 'The address of the result',
        why: 'The result goes into the accumulator, implicitly.',
      },
      {
        t: 'The line number',
        why: 'Source positions are stored in a separate table, not as operands.',
      },
      {
        t: 'A feedback slot where Ignition records what kinds of values it saw',
        correct: true,
        why: 'The optimising tiers later read this feedback to decide what to specialise for.',
      },
    ],
  },
  {
    q: 'What does Sparkplug remove, if it does no optimisations?',
    options: [
      {
        t: 'The cost of decoding bytecode and dispatching to the next instruction',
        correct: true,
        why: 'Its machine code does the same work as the interpreter, minus the dispatch loop.',
      },
      {
        t: 'The need for feedback',
        why: 'Sparkplug calls the same helpers as the interpreter and keeps the same frame layout; feedback is still collected.',
      },
      {
        t: 'Parsing',
        why: 'Sparkplug starts from bytecode, which parsing already produced.',
      },
    ],
  },
  {
    q: 'In the chapter’s Node 22 runs, why did `add` never use Maglev?',
    options: [
      {
        t: 'Maglev was removed from V8 in 2023',
        why: 'It was introduced in 2023, in Chrome M117.',
      },
      {
        t: '`add` was not hot enough',
        why: 'It was hot enough for TurboFan, the tier above Maglev.',
      },
      {
        t: 'This Node build does not enable Maglev; even `--maglev` reports “Maglev is not enabled.”',
        correct: true,
        why: 'So the run went Ignition, Sparkplug, TurboFan. Defaults differ between builds and versions.',
      },
    ],
  },
  {
    q: 'Near call 65,536, `add` left TurboFan. What failed?',
    options: [
      {
        t: 'The guess that `a` and `b` are small integers: the sum passed 2³¹ − 1, the largest Smi',
        correct: true,
        why: '`--trace-deopt` reports `reason: not a Smi`. The program carried on, correctly, in a slower tier.',
      },
      {
        t: 'TurboFan ran out of memory',
        why: 'The trace names the reason, and it is about the value, not memory.',
      },
      {
        t: 'JavaScript numbers overflowed',
        why: 'JavaScript numbers go far beyond 2³¹; only the engine’s small-integer form has that limit.',
      },
      {
        t: 'The feedback slot was full',
        why: 'A slot does not fill up; it records kinds of value, and widens.',
      },
    ],
  },
  {
    q: 'Where does the type feedback that TurboFan and Maglev use come from?',
    options: [
      {
        t: 'From TypeScript type annotations',
        why: 'Types are erased before V8 runs anything. The engine learns by watching.',
      },
      {
        t: 'From running the code unoptimised and recording what each operation sees',
        correct: true,
        why: 'While unoptimised code runs, V8 tracks shapes and types, and the optimising compilers read that feedback.',
      },
      {
        t: 'From a static analysis of the whole program before it starts',
        why: 'V8 compiles lazily and optimises only hot functions, using what it observed.',
      },
      {
        t: 'From the CPU’s branch predictor',
        why: 'The branch predictor is hardware that guesses jumps; V8 keeps its own records of what each operation saw.',
      },
    ],
  },
  {
    q: 'The slot for `+` says `BinaryOp:Number`. Then `add(1, 2)` is called a thousand times. What does it say now?',
    options: [
      {
        t: '`BinaryOp:SignedSmall`, since only integers came lately',
        why: 'Feedback never narrows; the earlier non-integer call is still covered.',
      },
      {
        t: '`BinaryOp:Number`',
        correct: true,
        why: 'The join of Number and SignedSmall is Number.',
      },
      {
        t: '`BinaryOp:Any`',
        why: 'Nothing but numbers was ever seen, so it never needed Any.',
      },
    ],
  },
  {
    q: '`--trace-deopt` prints `reason: wrong map` for `getX`. Which guess failed?',
    options: [
      {
        t: 'That `o` would always have the one shape (map) the feedback had seen',
        correct: true,
        why: 'The optimised load checked the map before loading at a fixed offset, and an object built in the other key order failed that check.',
      },
      {
        t: 'That `o.x` would be a small integer',
        why: 'That guard fails with a different reason, such as `not a Smi`.',
      },
      {
        t: 'That `getX` would not be called again',
        why: 'Optimised code is made because a function is called a lot.',
      },
    ],
  },
  {
    q: 'How can Maglev rely on a global that never changes without checking it on every call?',
    options: [
      {
        t: 'It cannot; every assumption needs a run-time check',
        why: 'The Maglev post describes the alternative: a dependency.',
      },
      {
        t: 'By copying the global into a constant and registering a dependency that invalidates the code if the global changes',
        correct: true,
        why: 'No check runs in the fast code; the runtime deoptimises it if the global is ever written.',
      },
      {
        t: 'By making the global read-only',
        why: 'The program can still change it; V8 does not alter the program’s meaning.',
      },
    ],
  },
  {
    q: 'Which statement about speculation is **false**?',
    options: [
      {
        t: 'Some assumptions are checked at run time, others by registering a dependency',
        why: 'True: a shape check is a run-time guard; a de-facto constant global is a dependency.',
      },
      {
        t: 'Speculative code is only correct for the cases it has guards for',
        why: 'True: anything else must leave through a deopt.',
      },
      {
        t: 'Speculation can make a program print different output, which is why it is optional',
        correct: true,
        why: 'This is the false one. A guess that fails costs time, never correctness, because the interpreter takes over.',
      },
    ],
  },
  {
    q: '`--trace-deopt` prints `bailout (kind: deopt-eager, reason: not a Smi)` for `add`. What happened?',
    options: [
      {
        t: 'V8 found a bug in `add` and stopped the program',
        why: 'Nothing was wrong with the program; only a guess was. It went on to print `ab`.',
      },
      {
        t: 'A guard in optimised `add` found a value that was not a small integer, so execution moved back to the interpreter',
        correct: true,
        why: 'The optimised code had speculated on Smis. When the guard failed, the deoptimiser rebuilt the interpreter frame.',
      },
      {
        t: 'The garbage collector moved `add`',
        why: 'A bailout is about optimised code, not about the heap.',
      },
      {
        t: '`add` returned the wrong answer once',
        why: 'Deoptimisation never changes a result: the interpreter finishes the operation.',
      },
    ],
  },
  {
    q: 'Why does optimised code need a frame state at each point that can deoptimise?',
    options: [
      {
        t: 'To print better error messages',
        why: 'It is for continuing the program, not for reporting.',
      },
      {
        t: 'To re-run the function from its first line',
        why: 'Re-running could repeat side effects. The interpreter continues from the same bytecode offset instead.',
      },
      {
        t: 'To rebuild the interpreter’s registers and stack exactly at that point',
        correct: true,
        why: 'Maglev, for example, attaches the interpreter frame state to nodes that can deopt; the deoptimiser uses it to put every value back where Ignition expects it.',
      },
    ],
  },
  {
    q: 'The rebuilt frame for `add(\'a\', \'b\')` has bytecode offset 2. What does Ignition do first?',
    options: [
      {
        t: 'Run `Ldar a1` again',
        why: 'That is offset 0; it had already run, which is why `"b"` is in the accumulator.',
      },
      {
        t: 'Run `Add a0, [0]`, adding `"a"` to the accumulator’s `"b"`',
        correct: true,
        why: 'Offset 2 is the add the optimised code could not do; the result is `"ab"`.',
      },
      {
        t: 'Start `add` from its first line with fresh arguments',
        why: 'The call continues from where it was; nothing is repeated.',
      },
    ],
  },
  {
    q: 'Why does `add` not deopt again on strings after it is optimised the second time?',
    options: [
      {
        t: 'V8 permanently refuses to optimise a function that deopted once',
        why: 'It optimised it again; the trace shows a second compile.',
      },
      {
        t: 'The failed call ran in the interpreter, which widened the feedback, so the new code makes no Smi guess',
        correct: true,
        why: 'The slot for `+` went to `BinaryOp:Any`, and code compiled from that feedback has no Smi guard to fail.',
      },
      {
        t: 'Strings become Smis after the first deopt',
        why: 'Values do not change type; the feedback does.',
      },
      {
        t: 'The second version has the same guards but checks them more slowly',
        why: 'Code that kept the same guard would fail the same way: that is a deopt loop.',
      },
    ],
  },
  {
    q: 'Maglev compiles about 10× faster than TurboFan. Why does that make speculation cheaper?',
    options: [
      {
        t: 'Maglev never deoptimises',
        why: 'Maglev speculates and deoptimises too, with the same frame-state mechanism.',
      },
      {
        t: 'Faster compiles make the guards free',
        why: 'Guards still run in the optimised code; compile time does not change that.',
      },
      {
        t: 'If the feedback turns out unstable, throwing the code away and recompiling costs little',
        correct: true,
        why: 'The Maglev post makes this point: it can be used earlier because a deopt and recompile is not a big loss.',
      },
    ],
  },
  {
    q: 'Which flag shows a function’s Ignition bytecode?',
    options: [
      {
        t: '`--trace-opt`',
        why: 'That traces optimised compilation: marking and compiling.',
      },
      {
        t: '`--print-bytecode`, ideally with `--print-bytecode-filter`',
        correct: true,
        why: 'Without the filter, you also get the bytecode of every function Node itself runs.',
      },
      {
        t: '`--trace-deopt`',
        why: 'That traces deoptimisations, though it does give a bytecode offset.',
      },
      {
        t: '`%DebugPrint(fn)` without any flag',
        why: 'Natives need `--allow-natives-syntax`, and DebugPrint shows objects, not a bytecode listing.',
      },
    ],
  },
  {
    q: '`add` was optimised for integers and then called with `0.5`. Which reason does `--trace-deopt` give?',
    options: [
      {
        t: '`hot and stable`',
        why: 'That is the reason `--trace-opt` gives for *marking* it for optimisation.',
      },
      {
        t: '`Insufficient type feedback for call`',
        why: 'That one was the top-level script reaching a call that had never run.',
      },
      {
        t: '`not a Smi`',
        correct: true,
        why: 'The optimised code checked that the argument was a small integer, and `0.5` isn’t one.',
      },
      {
        t: '`overflow`',
        why: 'That appears when an integer result outgrows the Smi range, not for a double argument.',
      },
    ],
  },
  {
    q: 'What does `kind: deopt-eager` mean?',
    options: [
      {
        t: 'A check failed in the optimised code itself, and it deoptimised immediately',
        correct: true,
        why: 'That is V8’s own definition of an eager deopt.',
      },
      {
        t: 'V8 deoptimised before the function was ever optimised',
        why: 'Only optimised code can be deoptimised.',
      },
      {
        t: 'The function will be re-optimised eagerly',
        why: 'The kind says how the deopt happened, not what comes next.',
      },
      {
        t: 'An assumption broke elsewhere and the code will deopt next time it runs',
        why: 'That describes a lazy deopt.',
      },
    ],
  },
  {
    q: 'In a `--trace-gc` line, what is the difference between Scavenge and Mark-Compact?',
    options: [
      {
        t: 'Scavenge collects the young generation; Mark-Compact the whole heap, old generation included',
        correct: true,
        why: 'As V8’s garbage collector explained: a cheap, frequent young collection and a rarer full one.',
      },
      {
        t: 'Scavenge frees memory; Mark-Compact only measures it',
        why: 'Both collect garbage.',
      },
      {
        t: 'They are two names for the same collector',
        why: 'They are different collectors, with different costs.',
      },
      {
        t: 'Mark-Compact runs only when the program ends',
        why: 'In the trace, one ran at 214 ms, while the program was still building its array.',
      },
    ],
  },
  {
    q: 'Why should a tool not depend on parsing V8’s trace output?',
    options: [
      {
        t: 'Because the output is encrypted',
        why: 'It is plain text.',
      },
      {
        t: 'Because it is only printed in debug builds',
        why: 'Everything in this chapter came from a normal Node release.',
      },
      {
        t: 'Because the flags are V8-internal, and their output can change in any version',
        correct: true,
        why: 'They are defined for V8’s developers, version by version. Good for diagnosis; fragile as an interface.',
      },
      {
        t: 'Because Node strips it out',
        why: 'Node passes the flags straight through to V8.',
      },
    ],
  },
];
