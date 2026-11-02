// Chapter 294 cards. Keys are stable ids: never rename them.

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

  'cap-vm-slow': {
    q: 'Why was the Drip VM slower than the tree-walker on four programs (`fields`, `instantiation`, `strings`, `trees`)?',
    a: 'V8 compiles both engines, and the VM rebuilds in JavaScript (its own hash tables and collector) what the tree-walker borrows from V8.',
  },
  'cap-e2e': {
    q: 'Which end-to-end program gained least from Viscosity, and what is special about its loop?',
    a: '`nbody` (1.2× on Node, 0.97× on Bun in the benchmark matrix): every body reads every field of the others, so columns save little.',
  },
  'cap-rough': {
    q: 'Name three things about Viscosity that are unfinished at the end of Track A.',
    a: 'Any three of: no WebAssembly back end; many ordinary programs refused (sort, classes, varying shapes, exports); the cost model is a heuristic; Python has no profiling and no AoSoA.',
  },
  'cap-shipped': {
    q: 'Where can a stranger install Viscosity 0.0.1 from?',
    a: 'npm (`@viscosity/cli`, `@viscosity/wasm`) and crates.io (six crates, including `viscosity-cli`).',
  },
  'cap-trackb': {
    q: 'What two things does Track B rebuild in Rust?',
    a: 'Drip’s bytecode VM (`drip-rs`) and the Viscosity compiler.',
  },

};

export const examples = {
  'drip-particles': {
    title: 'Particles in Drip, on your VM',
    lang: 'drip-vm',
    code: `# Particles, in the language you built.
class P {
  init(x, vx) {
    self.x = x;
    self.vx = vx;
  }
}
let ps = [];
for i in 0..1000 {
  push(ps, new P(i, 1));
}
for p in ps {
  p.x += p.vx;
}
print ps[3].x;
print len(ps);`,
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
    walkthrough: `**How to think about it.** This is Viscosity in miniature, done at run time from the data instead of ahead of time from the source, and it uses three ideas from Part VIII in order. First the **record shape**: the first record's field names, *in order*, are the shape every other record must match. Second the **bail-out**: at the first doubt (a different shape, a value that is not a number) give the original array back untouched, so the caller cannot tell anything was tried. Third **column storage**: only when every check has passed, build one \`Float64Array\` per field. Doing all the checks *before* building anything matters: half-built columns would be wasted work on every bail-out.

**The solution, line by line.**

- \`function optimize(ps) {\` takes an array of records.
- \`  if (ps.length === 0) return ps;\` leaves an empty array alone: there is no first record to take a shape from.
- \`  const fs = Object.keys(ps[0]);\` takes the first record's field names, in the order they were created.
- \`  const shape = fs.join(',');\` turns them into one string, so that comparing shapes compares both the names and their order.
- \`  for (const p of ps) {\` checks every record.
- \`    if (Object.keys(p).join(',') !==\` and \`        shape) {\` compare this record's shape with the first one;
- \`      return ps;\` bails out on any difference (a missing field, an extra one, or the same fields in another order).
- \`    for (const f of fs) {\` and \`      if (typeof p[f] !== 'number') {\` check every field holds a number;
- \`        return ps;\` bails out if one does not, because a \`Float64Array\` would quietly turn a string into \`NaN\` and change the program's behaviour.
- \`  const n = ps.length;\` is the number of records, and so the length of every column.
- \`  const cols = {};\` will map each field name to its column.
- \`  for (const f of fs) {\` makes one column per field:
- \`    const c = new Float64Array(n);\` allocates it,
- \`    for (let i = 0; i < n; i++) {\` and \`      c[i] = ps[i][f];\` copy field \`f\` of record \`i\` into slot \`i\`,
- \`    cols[f] = c;\` and stores the column under its field's name.
- \`  return { length: n, cols };\` returns the container: a length and the columns.

**Common wrong attempts.**

- Building the columns without checking: a record with a different field, or a string value, is silently turned into \`NaN\`, so the program's behaviour changes. Check first, then build.
- Sorting the keys before comparing: \`{x, y}\` and \`{y, x}\` then count as the same shape, but Viscosity treats a different field order as a different shape and refuses, because engines give the two different hidden classes (*Shapes in depth*).`,
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
    walkthrough: `**How to think about it.** This is the stack machine of Part IV from memory, with the three moving parts every bytecode VM has: an instruction pointer that walks the code, a stack that holds values, and a loop that reads one instruction at a time and does what it says. Two details need care. \`push\` carries an *operand*, the number that follows it in the code, so reading it moves the instruction pointer twice. And for \`sub\`, the order matters: the value on top of the stack is the one pushed *last*, which is the second operand.

**The solution, line by line.**

- \`function run(code) {\` takes the instruction list.
- \`  const st = [];\` is the value stack.
- \`  let ip = 0;\` is the instruction pointer, the position of the next instruction.
- \`  while (ip < code.length) {\` runs until the code ends.
- \`    const op = code[ip++];\` reads the opcode and moves past it in one step.
- \`    if (op === 'push') {\` handles the only instruction with an operand:
- \`      st.push(code[ip++]);\` reads the number after it, moves past that too, and pushes it.
- \`    } else {\` every other instruction takes two values:
- \`      const b = st.pop();\` pops the top, the value pushed last (the second operand);
- \`      const a = st.pop();\` pops the one under it (the first operand);
- \`      if (op === 'add') st.push(a + b);\`, \`      if (op === 'sub') st.push(a - b);\` and \`      if (op === 'mul') st.push(a * b);\` compute and push the result.
- \`  return st.pop();\` returns whatever is on top when the code runs out.

For \`['push', 2, 'push', 3, 'add', 'push', 4, 'mul']\` the stack goes \`[2]\`, \`[2, 3]\`, \`[5]\`, \`[5, 4]\`, \`[20]\`. WebAssembly's \`i32.add\`, from *WebAssembly as a target*, works exactly like \`add\` here: two pops and a push.

**Common wrong attempts.**

- Popping \`a\` before \`b\`: for \`10 - 4\` this computes \`4 - 10\` and gets \`-6\`.
- Treating every number in \`code\` as a push, without the instruction pointer: it happens to work for these opcodes, but it is no longer a VM that reads instructions, and it breaks the moment an instruction's operand means something other than "push me".`,
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
    q: 'In the particle program, which analysis decided that `ps` holds five fields in a stable order?',
    options: [
      { t: 'The cost model', why: 'The cost model weighs size and loops; it relies on the shape being known.' },
      { t: 'The access patterns', why: 'Those find which loops touch which fields.' },
      { t: 'The record shape analysis', correct: true, why: '*Record shapes*: every pushed record must have the same fields in the same order.' },
      { t: 'The differential test', why: 'That checks output after compiling; it decides nothing.' },
    ],
  },
  {
    q: 'Which part of the book does Viscosity’s numeric inference (is this value provably a float?) descend from most directly?',
    options: [
      { t: 'The type inference of Part III, run as a dataflow fixpoint from Part VI', correct: true, why: 'It infers a fact about every value from the facts about its inputs, and repeats until nothing changes.' },
      { t: 'The garbage collector of Part IV', why: 'The collector finds live objects; it says nothing about kinds of number.' },
      { t: 'The calling conventions of Part VII', why: 'Those say where arguments go in registers, not what they hold.' },
      { t: 'Semantic versioning', why: 'Versions are about releases, not values.' },
    ],
  },
  {
    q: 'The Drip VM was slower than the tree-walker on four of ten programs. What is the right conclusion?',
    options: [
      { t: 'Bytecode VMs are slower than tree-walkers', why: 'The VM won on six of the ten programs in the same run, and on a host without a JIT it would win comfortably.' },
      { t: 'A faster design isn’t faster at everything, and one run can only point at suspects', correct: true, why: 'Part IV measured why: V8 compiles both engines, and the VM rebuilds in JavaScript (hash tables, a collector) what the tree-walker borrows from V8.' },
      { t: 'The measurement must be wrong, so it should be dropped', why: 'Dropping inconvenient results is how benchmarks lie.' },
      { t: 'The tree-walker cheats by caching results', why: 'Nothing like that happens; it borrows V8’s built-ins.' },
    ],
  },
  {
    q: 'Which statement about the Rust port is true?',
    options: [
      { t: 'It uses acorn to parse JavaScript', why: 'The Rust workspace depends on oxc’s parser crates.' },
      { t: 'It doesn’t exist yet', why: 'A six-crate workspace exists in `engine/rust`, and all six crates are on crates.io at 0.0.1.' },
      { t: 'Its parity test reproduced the stored TypeScript outputs byte for byte', correct: true, why: 'All 190 fixture pairs in `tests/expected` (95 programs, both bounds modes) match.' },
      { t: 'It emits WebAssembly instead of JavaScript', why: 'It can be compiled to WebAssembly, but what it emits is JavaScript or Python, like the TypeScript engine.' },
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
