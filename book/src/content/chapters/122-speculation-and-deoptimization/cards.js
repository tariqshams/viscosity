// Chapter 122 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tf-what': {
    q: 'What is *type feedback*?',
    a: 'What the unoptimized code observed while running, such as the shapes and types each operation saw, recorded for the optimizing compiler.',
  },
  'tf-slots': {
    q: '`add(a, b)` is called with integers, then with `1.5`, then with strings. What does the feedback slot for `+` say after each stage (V8 12.4)?',
    a: '`BinaryOp:SignedSmall`, then `BinaryOp:Number`, then `BinaryOp:Any`. It only ever widens.',
  },
  'spec-what': {
    q: 'What does it mean for an optimizing compiler to *speculate*?',
    a: 'It compiles code that is only correct if what it has seen so far stays true, and checks that assumption at run time.',
  },
  'spec-guard': {
    q: 'What does speculative code do before it relies on a guess, such as an object’s shape?',
    a: 'It runs a check (a guard, such as `CheckMaps`) and deoptimizes if the check fails.',
  },
  'spec-why': {
    q: 'Why is speculative code faster than Ignition’s generic `Add`?',
    a: 'Once the guards pass, it can skip every other case (strings, objects, conversions) and work on raw integers or doubles.',
  },
  'spec-deps': {
    q: 'How can optimized code rely on a global that never changes without checking it each time?',
    a: 'It registers a dependency. If the global is ever changed, V8 invalidates and deoptimizes that code.',
  },
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
  'deopt-widen': {
    q: 'After `add` deopts on strings, why won’t V8 make the same wrong guess when it optimizes `add` again?',
    a: 'The failed call went through the interpreter, which widened the feedback. The next compile reads the wider feedback.',
  },
  'deopt-loop': {
    q: 'What is a *deoptimization loop*?',
    a: 'Optimizing with the same assumptions again after they failed, so the code deopts, reoptimizes and deopts over and over.',
  },
};

export const examples = {};

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
    walkthrough: `This is a toy, but each line matches something V8 does.

\`\`\`js
if (st.mode === 'int') {
  if (ints) return a + b;
  st.deopts++;
  st.mode = 'interp';
  st.hot = 0;
}
\`\`\`

- **The guard and the fast path.** In \`'int'\` mode the function trusts its feedback after one check. In real optimized code that check is a machine instruction or two, and the add after it works on raw integers.
- **Deopting doesn't return.** The failing call isn't an error; it still has to produce \`'ab'\`. So it falls through to the interpreter, just as V8's deoptimizer rebuilds an interpreter frame and lets Ignition finish the operation.

\`\`\`js
if (!ints) st.feedback = 'any';
else if (st.feedback !== 'any') {
  st.feedback = 'int';
}
\`\`\`

- **Feedback only widens.** Once \`'any'\` has been seen, more integer calls don't narrow it again, like \`BinaryOp:SignedSmall → Number → Any\` in V8's feedback slot.
- **Widening is what stops a deopt loop.** Because the failed call ran in the interpreter, it recorded \`'any'\`. The next optimization reads that and picks \`'generic'\`, which has no guard to fail.

\`\`\`js
st.mode = st.feedback === 'int'
  ? 'int' : 'generic';
\`\`\`

- **Speculate only on clean feedback.** If the very first calls were mixed, the function is "optimized" straight to generic code and never deopts at all.`,
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
  feedbackLattice: {
    optional: true,
    title: 'Feedback that only widens',
    prompt:
      'Model the feedback slot for `+`. Write `widen(fb, a, b)`, which returns the new feedback after a call `a + b`, given the old feedback `fb`. The states, from narrowest to widest, are `\'None\'`, `\'SignedSmall\'`, `\'Number\'` and `\'Any\'`. A call where both arguments are integers counts as `\'SignedSmall\'`, both numbers as `\'Number\'`, anything else as `\'Any\'`. The result is the wider of the old state and the call’s. (V8’s real lattice has more states, for example for strings.)',
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
    walkthrough: `\`\`\`js
return ORDER[Math.max(i, seen(a, b))];
\`\`\`

- **The same shape as elements kinds.** A list of states, and every update takes the maximum, so the state can only move one way. Chapter 121's lattice works the same way.
- **Why it must never narrow.** Optimized code built from \`'SignedSmall'\` would deopt on the next float. If the slot could fall back after a few integer calls, the compiler would make that bad guess again, and again.`,
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
};

export const quiz = [
  {
    q: 'Where does the type feedback that TurboFan and Maglev use come from?',
    options: [
      { t: 'From TypeScript type annotations', why: 'Types are erased before V8 runs anything (chapter 25). The engine learns by watching.' },
      { t: 'From running the code unoptimized and recording what each operation sees', correct: true, why: 'While unoptimized code runs, V8 tracks shapes and types, and the optimizing compilers read that feedback.' },
      { t: 'From a static analysis of the whole program before it starts', why: 'V8 compiles lazily and optimizes only hot functions, using what it observed.' },
      { t: 'From the CPU’s branch predictor', why: 'The branch predictor (chapter 52) is hardware that guesses jumps; V8 keeps its own records of what each operation saw.' },
    ],
  },
  {
    q: '`--trace-deopt` prints `bailout (kind: deopt-eager, reason: not a Smi)` for `add`. What happened?',
    options: [
      { t: 'V8 found a bug in `add` and stopped the program', why: 'Nothing was wrong with the program; only a guess was.' },
      { t: 'The garbage collector moved `add`', why: 'A bailout is about optimized code, not about the heap.' },
      { t: 'A guard in optimized `add` found a value that wasn’t a small integer, so execution moved back to the interpreter', correct: true, why: 'The optimized code had speculated on Smis. When the guard failed, the deoptimizer rebuilt the interpreter frame.' },
      { t: '`add` returned the wrong answer once', why: 'Deoptimization never changes a result: the interpreter finishes the operation.' },
    ],
  },
  {
    q: 'Why does optimized code need a frame state at each point that can deoptimize?',
    options: [
      { t: 'To rebuild the interpreter’s registers and stack exactly at that point', correct: true, why: 'Maglev, for example, attaches the interpreter frame state to nodes that can deopt; the deoptimizer uses it to put every value back where Ignition expects it.' },
      { t: 'To print better error messages', why: 'It is for continuing the program, not for reporting.' },
      { t: 'So the garbage collector can find the function', why: 'The function is reachable anyway; frame state describes the values live at that moment.' },
      { t: 'To re-run the function from its first line', why: 'Re-running could repeat side effects. The interpreter continues from the same bytecode offset instead.' },
    ],
  },
  {
    q: 'Maglev compiles about 10× faster than TurboFan. Why does that make speculation cheaper?',
    options: [
      { t: 'Maglev never deoptimizes', why: 'Maglev speculates and deoptimizes too, with the same mechanism as TurboFan.' },
      { t: 'Faster compiles make the guards free', why: 'Guards still run in the optimized code; compile time doesn’t change that.' },
      { t: 'Maglev doesn’t use feedback', why: 'It builds specialized nodes straight from feedback.' },
      { t: 'If the feedback turns out unstable, throwing the code away and recompiling costs little', correct: true, why: 'The Maglev post makes this point: it can be used earlier because a deopt and recompile is not a big loss.' },
    ],
  },
  {
    q: 'Why does `add` not deopt again on strings after it is optimized the second time?',
    options: [
      { t: 'V8 permanently refuses to optimize a function that deopted once', why: 'It can and does optimize it again; the trace shows a second compile.' },
      { t: 'Strings become Smis after the first deopt', why: 'Values don’t change type; the feedback does.' },
      { t: 'The failed call ran in the interpreter, which widened the feedback, so the new code makes no Smi guess', correct: true, why: 'The slot for `+` went to `BinaryOp:Any`, and code compiled from that feedback has no Smi guard to fail.' },
      { t: 'The second version has the same guards but checks them more slowly', why: 'Code that kept the same guard would fail the same way: that is a deopt loop.' },
    ],
  },
  {
    q: 'Which statement about speculation is **false**?',
    options: [
      { t: 'Some assumptions are checked at run time, others by registering a dependency that triggers a deopt', why: 'True: a shape check is a run-time guard; a de-facto constant global is a dependency.' },
      { t: 'Speculative code is only correct for the cases it has guards for', why: 'True: anything else must leave through a deopt.' },
      { t: 'Speculation can make a program print different output, which is why it is optional', correct: true, why: 'This is the false one. A guess that fails costs time, never correctness, because the interpreter takes over.' },
      { t: 'Crankshaft, an older V8 compiler, suffered from deoptimization loops', why: 'True, according to V8’s own account of why Crankshaft was replaced.' },
    ],
  },
];
