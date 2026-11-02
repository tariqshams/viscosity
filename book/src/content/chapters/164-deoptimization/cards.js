// Chapter 163b cards (split from 123). Keys are stable ids: never rename them.

export const prompts = {
  'deopt-what': {
    q: 'What is deoptimization?',
    a: 'Leaving optimized code when one of its assumptions fails, and continuing the same call in unoptimized code (the interpreter).',
  },
  'deopt-frame': {
    q: 'What extra information must optimized code keep so that it can deoptimize?',
    a: 'At every point that can deopt, a map from its own registers and stack to the interpreter’s frame, so that frame can be rebuilt.',
  },
  'deopt-same': {
    q: 'After a deopt, can the program’s result differ from a run that was never optimized?',
    a: 'No. The interpreter finishes the operation from the same point, so only the speed changes.',
  },
  'deopt-offset': {
    q: 'The deopt of `add(\'a\', \'b\')` resumed at bytecode offset 2 with `"b"` in the accumulator. Why there, and why `"b"`?',
    a: 'Offset 2 is `Add a0, [0]`, the add the optimized code could not do; `Ldar a1` at offset 0 had already put `b` in the accumulator.',
  },
  'deopt-widen': {
    q: 'After `add` deopts on strings, why won’t V8 make the same wrong guess when it optimizes `add` again?',
    a: 'The failed call went through the interpreter, which widened the feedback. The next compile reads the wider feedback.',
  },
  'deopt-loop': {
    q: 'What is a *deoptimization loop*?',
    a: 'Optimizing with the same assumptions again after they failed, so the code deopts, reoptimizes and deopts over and over.',
  },
  'deopt-unlink': {
    q: 'After a deopt, what happens to the optimized code?',
    a: 'It is no longer valid, so it is unlinked from the function, and the next call runs unoptimized code until the function is hot again.',
  },
  'deopt-cheap': {
    q: 'Why does a compiler that compiles fast (like Maglev) make speculation cheaper?',
    a: 'If a guess fails, throwing the code away and compiling again costs little, so V8 can afford to speculate earlier.',
  },
};

export const examples = {
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
  speculate: {
    title: 'A speculative add with a deopt counter',
    prompt:
      'Write `makeAdd()`. It returns a function `add(a, b)` that always returns `a + b`, plus a state object at `add.st`, starting as `{ mode: \'interp\', feedback: \'none\', hot: 0, deopts: 0 }`. Model three tiers:\n\n- **`\'interp\'`**: record feedback. If both arguments are integers (`Number.isInteger`) and the feedback isn’t already `\'any\'`, it becomes `\'int\'`; otherwise `\'any\'`. Add 1 to `hot`. When `hot` reaches 3, optimize: mode becomes `\'int\'` if the feedback is `\'int\'`, else `\'generic\'`.\n- **`\'int\'`**: the guard. If both are integers, return `a + b`. Otherwise **deopt**: add 1 to `deopts`, set mode to `\'interp\'` and `hot` to 0, then handle this same call as the interpreter would.\n- **`\'generic\'`**: just return `a + b`.',
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
    walkthrough: `**How to think about it.** This is a toy, but each part matches something V8 does. Before writing code, sort out what every call needs to know (are both arguments integers?) and then what each mode does with that: the interpreter records feedback and counts heat; the integer mode trusts the feedback after one check; the generic mode trusts nothing and needs no check. The one subtle part is the deopt: a call that fails the guard is not an error and must still return \`a + b\`, so instead of returning it *falls through* to the interpreter's code, which is what V8's deoptimizer does when it hands the rest of the call to Ignition.

**The solution, line by line.**

- \`const st = { mode: 'interp', feedback: 'none', hot: 0, deopts: 0 };\` (over several lines) is the function's state, like V8's per-function tier, feedback slot and budget.
- \`const isInt = Number.isInteger;\` is a short name for the check.
- \`function add(a, b) {\` is the function the tests call.
- \`  const ints = isInt(a) && isInt(b);\` works out once what every mode needs to know.
- \`  if (st.mode === 'int') {\` is the optimized, speculative tier.
- \`    if (ints) return a + b;\` is the guard and the fast path: one check, then the work.
- \`    st.deopts++;\` counts the bailout.
- \`    st.mode = 'interp';\` throws the optimized "code" away (unlinking it).
- \`    st.hot = 0;\` starts the heat count again.
- \`  }\` ends the optimized tier, *without returning* on a failed guard, so the same call carries on below.
- \`  if (st.mode === 'generic') {\` and \`return a + b;\` is code compiled from \`'any'\` feedback: nothing to check, nothing to fail.
- \`  if (!ints) st.feedback = 'any';\` is the interpreter recording what it saw; a non-integer call always widens to \`'any'\`.
- \`  else if (st.feedback !== 'any') {\` and \`st.feedback = 'int';\` record integers, but never narrow \`'any'\` back.
- \`  st.hot++;\` counts the call.
- \`  if (st.hot >= 3) {\` decides to optimize, and \`st.mode = st.feedback === 'int' ? 'int' : 'generic';\` picks the tier the feedback justifies: speculate only on clean feedback.
- \`  return a + b;\` the interpreter's answer, the same as every tier's.
- \`add.st = st;\` and \`return add;\` expose the state for the tests.

Trace the "it reoptimizes, generically" test: three integer calls optimize to \`'int'\`; \`add('a', 'b')\` fails the guard, deopts, and falls through to the interpreter, which records \`'any'\` and sets \`hot\` to 1; two more calls make \`hot\` 3, and the feedback says \`'any'\`, so the new mode is \`'generic'\`; the next string call needs no guard, so \`deopts\` stays 1. That is the d5.js trace from the chapter, in miniature.

**Common wrong attempts.**

- Returning nothing (or throwing) when the guard fails: the call that deopts must still produce \`'ab'\`, which the first test checks.
- Letting integer calls set the feedback back to \`'int'\` after \`'any'\`: the function then reoptimizes to \`'int'\` and deopts again on the next string, a deoptimization loop.
- Optimizing to \`'int'\` regardless of feedback: mixed early calls would then deopt, which the last test catches.`,
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
        why: 'The deopting call returns before the interpreter part runs, so it never records `\'any\'`. The feedback still says `\'int\'`, the function reoptimizes with the same guess, and the next string deopts again: a deoptimization loop.',
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
};

export const quiz = [
  {
    q: '`--trace-deopt` prints `bailout (kind: deopt-eager, reason: not a Smi)` for `add`. What happened?',
    options: [
      { t: 'V8 found a bug in `add` and stopped the program', why: 'Nothing was wrong with the program; only a guess was. It went on to print `ab`.' },
      { t: 'A guard in optimized `add` found a value that was not a small integer, so execution moved back to the interpreter', correct: true, why: 'The optimized code had speculated on Smis. When the guard failed, the deoptimizer rebuilt the interpreter frame.' },
      { t: 'The garbage collector moved `add`', why: 'A bailout is about optimized code, not about the heap.' },
      { t: '`add` returned the wrong answer once', why: 'Deoptimization never changes a result: the interpreter finishes the operation.' },
    ],
  },
  {
    q: 'Why does optimized code need a frame state at each point that can deoptimize?',
    options: [
      { t: 'To print better error messages', why: 'It is for continuing the program, not for reporting.' },
      { t: 'To re-run the function from its first line', why: 'Re-running could repeat side effects. The interpreter continues from the same bytecode offset instead.' },
      { t: 'To rebuild the interpreter’s registers and stack exactly at that point', correct: true, why: 'Maglev, for example, attaches the interpreter frame state to nodes that can deopt; the deoptimizer uses it to put every value back where Ignition expects it.' },
    ],
  },
  {
    q: 'The rebuilt frame for `add(\'a\', \'b\')` has bytecode offset 2. What does Ignition do first?',
    options: [
      { t: 'Run `Ldar a1` again', why: 'That is offset 0; it had already run, which is why `"b"` is in the accumulator.' },
      { t: 'Run `Add a0, [0]`, adding `"a"` to the accumulator’s `"b"`', correct: true, why: 'Offset 2 is the add the optimized code could not do; the result is `"ab"`.' },
      { t: 'Start `add` from its first line with fresh arguments', why: 'The call continues from where it was; nothing is repeated.' },
    ],
  },
  {
    q: 'Why does `add` not deopt again on strings after it is optimized the second time?',
    options: [
      { t: 'V8 permanently refuses to optimize a function that deopted once', why: 'It optimized it again; the trace shows a second compile.' },
      { t: 'The failed call ran in the interpreter, which widened the feedback, so the new code makes no Smi guess', correct: true, why: 'The slot for `+` went to `BinaryOp:Any`, and code compiled from that feedback has no Smi guard to fail.' },
      { t: 'Strings become Smis after the first deopt', why: 'Values do not change type; the feedback does.' },
      { t: 'The second version has the same guards but checks them more slowly', why: 'Code that kept the same guard would fail the same way: that is a deopt loop.' },
    ],
  },
  {
    q: 'Maglev compiles about 10× faster than TurboFan. Why does that make speculation cheaper?',
    options: [
      { t: 'Maglev never deoptimizes', why: 'Maglev speculates and deoptimizes too, with the same frame-state mechanism.' },
      { t: 'Faster compiles make the guards free', why: 'Guards still run in the optimized code; compile time does not change that.' },
      { t: 'If the feedback turns out unstable, throwing the code away and recompiling costs little', correct: true, why: 'The Maglev post makes this point: it can be used earlier because a deopt and recompile is not a big loss.' },
    ],
  },
];
