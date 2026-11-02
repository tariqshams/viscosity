// Chapter 88 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'tiering-what': {
    q: 'What is **tiering** in a JavaScript engine?',
    a: 'Running each function in one of several ways of executing it, starting with the cheapest, and moving it to faster but costlier ones as it gets hot.',
  },
  'feedback-slot': {
    q: 'In V8’s Ignition bytecode `Add a0, [0]`, what is the `[0]`?',
    a: 'A feedback slot number: where this addition records what kinds of values it saw, for the optimising tiers to read.',
  },
  'tf-slots': {
    q: '`add(a, b)` is called with integers, then with `1.5`, then with strings. What does the feedback slot for `+` say after each stage (V8 12.4)?',
    a: '`BinaryOp:SignedSmall`, then `BinaryOp:Number`, then `BinaryOp:Any`. It only ever widens.',
  },
  'spec-guard': {
    q: 'What does speculative code do before it relies on a guess, such as an object’s shape?',
    a: 'It runs a check (a guard, such as a map check) and deoptimises if the check fails.',
  },
  'deopt-frame': {
    q: 'What extra information must optimised code keep so that it can deoptimise?',
    a: 'At every point that can deopt, a frame state: where each interpreter register’s value lives in its own registers and stack, so the interpreter frame can be rebuilt.',
  },
  'deopt-same': {
    q: 'After a deopt, can the program’s result differ from a run that was never optimised?',
    a: 'No. The interpreter finishes the operation from the same point, so only the speed changes.',
  },
  'deopt-widen': {
    q: 'In V8, after an optimised `add` deoptimises on strings, why does the next optimised version not make the same guess?',
    a: 'The failed call went through the interpreter, which widened the feedback; the next compile reads the wider feedback.',
  },
  'flags-internal': {
    q: 'Why should you label any V8 trace you save with the Node and V8 version?',
    a: 'The flags are V8-internal: their names, output and defaults can change in any release.',
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
  guarded: {
    title: 'A guess, a guard and a way out',
    code: `let fast = 0, slow = 0;
const isSmi = (v) => Number.isInteger(v)
  && !Object.is(v, -0)
  && v >= -(2 ** 31) && v < 2 ** 31;
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
    optional: true,
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
  feedbackLattice: {
    optional: true,
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
    tests: `test('the integers, 1.5, strings run', () => {
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
    walkthrough: `**How to think about it.** This is the feedback lattice in code. Two things are needed: a way to compare states (put them in an array, narrowest first, so a state's position is its width), and a way to classify one call (integers, other numbers, anything else). Then the new state is whichever is wider, the old one or the call's, which, with positions, is \`Math.max\`. It is the same pattern as an array's elements kind.

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
    optional: true,
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

This parser fits V8 12.4's format. Nothing promises that format will last, which is why every trace should be labelled with its version.

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
};

export const quiz = [
  {
    q: 'Why does V8 start every function in its interpreter rather than compiling it to optimised machine code first?',
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
    q: 'In V8 12.4, the feedback slot for the `+` in `add(a, b)` says `BinaryOp:Number`. Then `add(1, 2)` is called a thousand times. What does the slot say now?',
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
    q: 'Which statement about speculative optimisation in a JIT such as V8 is **false**?',
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
];
