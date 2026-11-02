// Chapter 174 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cap-what': {
    q: 'What is a capstone, and what is its point?',
    a: 'The final piece of work that uses everything before it at once; the point is seeing how the parts fit, and which are solid.',
  },
  'cap-links': {
    q: 'Why does Viscosity have to prove safety, when the run-time research could transform arrays without proofs?',
    a: 'A JIT can speculate and deoptimize if it is wrong (Part V). Viscosity runs before the program and has no way back.',
  },
  'cap-pipeline': {
    q: 'Name Viscosity’s four pipeline stages, in order.',
    a: 'The plugin lowers source to VIR; the core analyzes; the planner decides layouts; the plugin emits rewritten source.',
  },
  'cap-proof': {
    q: 'What does Viscosity do with a collection it can’t prove safe to transform?',
    a: 'It leaves it as an array of objects (a bail-out) and says why in the explain report.',
  },
  'cap-vm-slow': {
    q: 'In the recorded run, on which two programs was the Drip VM slower than the tree-walker?',
    a: '`equality` and `instantiation`.',
  },
  'cap-limit': {
    q: 'Why does `string_equality` fail to compile on the Drip VM?',
    a: 'A chunk’s constant index is one byte, so a chunk holds at most 256 constants, and that program needs more.',
  },
  'cap-e2e': {
    q: 'Which end-to-end program gained least from Viscosity, and what is special about its loop?',
    a: '`nbody`: every body reads every field of the others, so columns save little.',
  },
  'cap-rough': {
    q: 'Name three things about Viscosity that are unfinished at the end of Track A.',
    a: 'Any three of: not on npm (it was published later, in chapter 286, as `@viscosity/cli`); no WebAssembly back end; many ordinary programs refused (sort, classes, varying shapes, exports); the cost model is a heuristic.',
  },
  'cap-trackb': {
    q: 'What two things does Track B rebuild in Rust?',
    a: 'Drip’s bytecode VM (`drip-rs`) and the Viscosity compiler.',
  },
  'cap-parity': {
    q: 'How is the Rust Viscosity checked against the TypeScript one?',
    a: 'The TypeScript engine’s compiled code and explain report for every corpus and benchmark program are stored as files; the Rust port must reproduce them byte for byte.',
  },
};

export const exercises = {
  optimize: {
    title: 'Viscosity in miniature',
    prompt:
      'Write `optimize(ps)`, a tiny run-time version of Viscosity. If `ps` is empty, or its records don’t all have **the same fields in the same order** as the first one, or any field value is not a number, bail out: return `ps` itself, unchanged. Otherwise return `{ length, cols }`, where `cols` has one `Float64Array` per field holding that field of every record, in order.',
    starter: `function optimize(ps) {
  return ps;
}`,
    solution: `function optimize(ps) {
  if (ps.length === 0) return ps;
  const fs = Object.keys(ps[0]);
  const shape = fs.join(',');
  for (const p of ps) {
    if (Object.keys(p).join(',') !==
        shape) {
      return ps;
    }
    for (const f of fs) {
      if (typeof p[f] !== 'number') {
        return ps;
      }
    }
  }
  const n = ps.length;
  const cols = {};
  for (const f of fs) {
    const c = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      c[i] = ps[i][f];
    }
    cols[f] = c;
  }
  return { length: n, cols };
}`,
    tests: `test('builds one column per field', () => {
  const r = optimize([{ x: 1, vx: 2 }, { x: 3, vx: 4 }]);
  expect(r.length).toBe(2);
  expect(Array.from(r.cols.x)).toEqual([1, 3]);
  expect(Array.from(r.cols.vx)).toEqual([2, 4]);
});
test('columns are Float64Arrays', () => {
  const r = optimize([{ x: 1 }]);
  expect(r.cols.x instanceof Float64Array).toBe(true);
});
test('a different field bails out', () => {
  const ps = [{ x: 1, vx: 2 }, { x: 3, tag: 4 }];
  expect(optimize(ps)).toBe(ps);
});
test('a different field order bails out', () => {
  const ps = [{ x: 1, y: 2 }, { y: 3, x: 4 }];
  expect(optimize(ps)).toBe(ps);
});
test('a non-number bails out', () => {
  const ps = [{ x: 1 }, { x: 2 }, { x: 'three' }];
  expect(optimize(ps)).toBe(ps);
});
test('an empty array is left alone', () => {
  const ps = [];
  expect(optimize(ps)).toBe(ps);
});`,
    hints: [
      'Use `Object.keys(ps[0])` as the shape, and compare every record’s keys with it, as one joined string so the order counts.',
      'Bail out with `return ps` the moment anything is wrong: a different shape, or a value whose `typeof` isn’t `\'number\'`.',
      'Only when every record passes, build the columns: one `new Float64Array(n)` per field, filled in a loop.',
    ],
    walkthrough: `Three ideas from Part VIII, in twenty lines.

- **Record shape (chapter 151).** The first record’s keys are the shape. Joining keys into a string compares names *and* order, so \`{x, y}\` and \`{y, x}\` differ, just as they do for Viscosity, which rejects a different field order.
- **Bail out (chapters 153–154).** At the first doubt, return the original array untouched. The caller can’t tell anything was tried. That is the safe default the whole compiler is built on.
- **Column storage (chapter 157).** One \`Float64Array\` per field, element \`i\` at index \`i\`. Only numbers are allowed, because a \`Float64Array\` would quietly turn anything else into a number (or \`NaN\`), which would change the program’s behaviour.

This version decides at run time, from the data, like the GraalJS research. Viscosity makes the same checks from the source, before the program runs.`,
    wrong: [
      {
        code: `function optimize(ps) {
  if (ps.length === 0) return ps;
  const fs = Object.keys(ps[0]);
  const n = ps.length;
  const cols = {};
  for (const f of fs) {
    const c = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      c[i] = ps[i][f];
    }
    cols[f] = c;
  }
  return { length: n, cols };
}`,
        why: 'It never checks. A record with a different field, or a string, is silently turned into numbers (`NaN`), so the program’s behaviour changes. Bail out first.',
      },
      {
        code: `function optimize(ps) {
  if (ps.length === 0) return ps;
  const fs = Object.keys(ps[0]);
  const shape = [...fs].sort().join();
  for (const p of ps) {
    const ks = Object.keys(p).sort();
    if (ks.join() !== shape) return ps;
    for (const f of fs) {
      if (typeof p[f] !== 'number') {
        return ps;
      }
    }
  }
  const n = ps.length;
  const cols = {};
  for (const f of fs) {
    const c = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      c[i] = ps[i][f];
    }
    cols[f] = c;
  }
  return { length: n, cols };
}`,
        why: 'Sorting the keys ignores field order, so `{x, y}` and `{y, x}` count as the same shape. Viscosity treats them as different shapes and refuses.',
      },
    ],
  },
  tinyVm: {
    optional: true,
    title: 'A bytecode VM in a dozen lines',
    prompt:
      'Write `run(code)`, a stack machine like Part IV’s. `code` is an array of instructions: `\'push\'` followed by a number pushes that number; `\'add\'`, `\'sub\'` and `\'mul\'` pop two values and push the result (for `sub`, the value pushed first minus the value pushed second). When the code ends, return the top of the stack.',
    starter: `function run(code) {
  const st = [];
  for (const op of code) {
    if (typeof op === 'number') {
      st.push(op);
    }
  }
  return st.pop();
}`,
    solution: `function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 'push') {
      st.push(code[ip++]);
    } else {
      const b = st.pop();
      const a = st.pop();
      if (op === 'add') st.push(a + b);
      if (op === 'sub') st.push(a - b);
      if (op === 'mul') st.push(a * b);
    }
  }
  return st.pop();
}`,
    tests: `test('2 + 3', () => {
  expect(run(['push', 2, 'push', 3, 'add'])).toBe(5);
});
test('10 - 4 keeps the order', () => {
  expect(run(['push', 10, 'push', 4, 'sub'])).toBe(6);
});
test('(2 + 3) * 4', () => {
  const code = ['push', 2, 'push', 3, 'add', 'push', 4, 'mul'];
  expect(run(code)).toBe(20);
});
test('a lone push', () => {
  expect(run(['push', 7])).toBe(7);
});`,
    hints: [
      'Keep an instruction pointer `ip`. Read the opcode at `code[ip]` and move on.',
      'After `push`, the number is the next element of `code`: read it and move `ip` past it too.',
      'The top of the stack is the *second* operand. Pop `b` first, then `a`, and compute `a - b`.',
    ],
    walkthrough: `Chapter 76’s machine, from memory.

- **The instruction pointer** walks the code. \`code[ip++]\` reads the opcode and advances in one step.
- **Operands live in the code.** \`push\` is followed by its number, so it reads a second element and advances again, like \`OP_CONSTANT\` reading its constant index.
- **Pop order matters.** The value pushed last is on top. For \`10 - 4\`, \`b\` is 4 and \`a\` is 10.

WebAssembly’s \`i32.add\` (chapter 171) works exactly like \`add\` here: two pops and a push.`,
    wrong: [
      {
        code: `function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 'push') {
      st.push(code[ip++]);
    } else {
      const a = st.pop();
      const b = st.pop();
      if (op === 'add') st.push(a + b);
      if (op === 'sub') st.push(a - b);
      if (op === 'mul') st.push(a * b);
    }
  }
  return st.pop();
}`,
        why: 'The first pop is the value pushed *last*, so this computes `4 - 10` and gets `-6`. Pop `b` first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which Part I idea became Viscosity’s storage for numeric fields?',
    options: [
      { t: 'Closures', why: 'Closures became Drip’s closures and upvalues, not storage.' },
      { t: 'Typed arrays', correct: true, why: 'Each numeric column is a `Float64Array`.' },
      { t: 'Map and Set', why: 'Those came back in hash tables and analyses, not columns.' },
      { t: 'Recursion', why: 'Recursion drives the parsers and tree-walker.' },
    ],
  },
  {
    q: 'In the particle program, which analysis decided that `ps` holds five fields in a stable order?',
    options: [
      { t: 'The cost model', why: 'The cost model weighs size and loops; it relies on the shape being known.' },
      { t: 'The access patterns', why: 'Those find which loops touch which fields.' },
      { t: 'The record shape analysis', correct: true, why: 'Chapter 151: every pushed record must have the same fields in the same order.' },
      { t: 'The differential test', why: 'That checks output after compiling; it decides nothing.' },
    ],
  },
  {
    q: 'Why is `zoo_batch` left out of the Drip chart?',
    options: [
      { t: 'The VM failed to compile it', why: 'That was `string_equality`.' },
      { t: 'It was too fast to measure', why: 'It runs for about ten seconds.' },
      { t: 'It isn’t a Drip program', why: 'It is one of the Drip benchmarks.' },
      { t: 'It runs for a fixed time, so its time says nothing about speed', correct: true, why: 'Both engines stop after about 10 seconds; the useful number would be the batch count.' },
    ],
  },
  {
    q: 'The Drip VM was slower than the tree-walker on two programs. What is the right conclusion?',
    options: [
      { t: 'Bytecode VMs are slower than tree-walkers', why: 'The VM won on most programs in the same run.' },
      { t: 'A faster design isn’t faster at everything, and one run can only point at suspects', correct: true, why: 'Part IV named suspects (its own heap and GC on top of V8’s, hand-written hash tables) without claiming more than one run can show.' },
      { t: 'The measurement must be wrong, so it should be dropped', why: 'Dropping inconvenient results is how benchmarks lie.' },
      { t: 'The tree-walker cheats by caching results', why: 'Nothing like that happens; it borrows V8’s built-ins.' },
    ],
  },
  {
    q: 'Which statement about the Rust port was true when this chapter was written?',
    options: [
      { t: 'It uses acorn to parse JavaScript', why: 'The Rust workspace depends on oxc’s parser crates.' },
      { t: 'It doesn’t exist yet', why: 'A five-crate workspace exists in `engine/rust`.' },
      { t: 'Its parity test reproduced the stored TypeScript outputs byte for byte', correct: true, why: 'The test compares every fixture in `tests/expected`, and it passed.' },
      { t: 'It emits WebAssembly instead of JavaScript', why: 'It can be compiled to WebAssembly, but what it emits is JavaScript, like the TypeScript engine.' },
    ],
  },
  {
    q: 'How can anyone check that the Rust Viscosity makes “the same decisions” as the TypeScript one?',
    options: [
      { t: 'Compare their outputs byte for byte with the stored TypeScript code and explain reports', correct: true, why: 'Every corpus and benchmark program’s outputs, in both bounds modes, are stored in `engine/rust/tests/expected`.' },
      { t: 'Compare their speed', why: 'Speed says nothing about whether the decisions match.' },
      { t: 'Read both sources side by side', why: 'Useful, but not a check anyone can run.' },
      { t: 'Run the Rust version only on the five benchmark programs', why: 'The fixtures cover the whole corpus too.' },
    ],
  },
];
