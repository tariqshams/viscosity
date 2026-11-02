// Cards for "Spilling and linear scan": recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'spill-what': {
    q: 'In a Chaitin-style allocator, what does **spilling** a value mean?',
    a: 'Keeping it in a stack slot instead of a register for its whole life: a store after each definition, a load into a fresh name before each use.',
  },
  'spill-when': {
    q: 'When is spilling unavoidable?',
    a: 'When more values are alive at the same moment than there are registers; no colouring can fit them.',
  },
  'spill-code': {
    q: 'In a graph-colouring allocator, after spill code is inserted, what must the allocator do next?',
    a: 'Rebuild the interference graph (the spilled value is replaced by short-lived fresh names) and colour it again.',
  },
  'loop-weight': {
    q: 'Why is each load or store counted as 10 per enclosing loop when estimating spill cost?',
    a: 'Code inside a loop runs many times, so a load there costs far more than one outside; 10 per loop is a common rough estimate of how often it runs.',
  },
  'cost-over-degree': {
    q: 'Why does Chaitin divide spill cost by degree?',
    a: 'A value with many neighbours is in the way of many others, so spilling it frees the most; dividing favours cheap values that block a lot.',
  },
  'tiny-range': {
    q: 'Why is it pointless to spill a value that lives only from one instruction to the very next?',
    a: 'Its range is already as short as it gets; spilling would only replace it with equally short values around a store and a load.',
  },
  rebuild: {
    q: 'In a loop, n, s, i and t are all live just after `mul t, i, i`; n is read only by the loop test, before the mul. Once n is spilled (reloaded just before the test), why do three registers suffice?',
    a: 'The reloaded n lives only from its load to the test, where t is not live, so no point has more than three values alive at once.',
  },
  'o0-why': {
    q: 'Run through `llc -O0`, why is the code for a small loop full of loads and stores to stack slots?',
    a: 'The fast allocator works one basic block at a time, so every value alive across a block boundary is stored and reloaded.',
  },
};

export const examples = {
  costs: {
    title: 'Spill costs for sumsq',
    code: `// For each value: the loop depth of
// every load or store spilling it adds.
const refs = {
  n: [0, 1],          // sd at entry; ld
  s: [0, 1, 1, 0],    // li; add: ld
                      // and sd; mv
  i: [0, 1, 1, 1, 1], // li; bge; mul;
                      // addi ld+sd
  t: [1, 1],          // mul sd; add ld
};
const degree = {
  n: 3, s: 3, i: 3, t: 3 };
const tiny = new Set(['t']); // no help

let best = null;
for (const v in refs) {
  let cost = 0;
  for (const d of refs[v]) {
    cost += 10 ** d;
  }
  const score = tiny.has(v)
    ? Infinity : cost / degree[v];
  const shown = score.toFixed(1);
  console.log(v, cost, shown);
  if (!best || score < best.score) {
    best = { v, score };
  }
}
console.log('spill', best.v);`,
  },
};

export const exercises = {
  spill: {
    title: 'Write the spill code',
    prompt: 'Finish `spill(code, v, off)`. `code` is an array of instruction strings like `\'add s, s, t\'` (an operation, a space, then operands separated by `\', \'`; labels like `\'loop:\'` have no operands). Rewrite it so that value `v` lives in the stack slot `off(sp)`: in every instruction that mentions `v`, replace `v` by a fresh name (`v + 1`, `v + 2`, ... counting such instructions); if the instruction **reads** `v`, put `ld fresh, off(sp)` before it; if it **writes** `v`, put `sd fresh, off(sp)` after it. The first operand is written, except for the operations in `NODEF`, which only read. The starter already splits each line and skips the lines without `v`.',
    starter: `// Instructions whose first operand is
// read, not written.
const NODEF = new Set(['bge', 'blt',
  'beq', 'bne', 'j', 'ret']);

// Keep v in the stack slot off(sp):
// load before each use, store after
// each definition, using a fresh name
// each time (v1, v2, ...).
function spill(code, v, off) {
  const out = [];
  let n = 0;
  for (const line of code) {
    const parts = line.split(' ');
    const op = parts[0];
    const more = parts.slice(1);
    const args = more.length > 0
      ? more.join(' ').split(', ') : [];
    if (!args.includes(v)) {
      out.push(line);
      continue;
    }
    // TODO: rename v to a fresh name,
    // load it first if this line reads
    // v, store it after if it writes v.
    out.push(line);
  }
  return out;
}`,
    solution: `// Instructions whose first operand is
// read, not written.
const NODEF = new Set(['bge', 'blt',
  'beq', 'bne', 'j', 'ret']);

// Keep v in the stack slot off(sp):
// load before each use, store after
// each definition, using a fresh name
// each time (v1, v2, ...).
function spill(code, v, off) {
  const out = [];
  let n = 0;
  for (const line of code) {
    const parts = line.split(' ');
    const op = parts[0];
    const more = parts.slice(1);
    const args = more.length > 0
      ? more.join(' ').split(', ') : [];
    if (!args.includes(v)) {
      out.push(line);
      continue;
    }
    n += 1;
    const tmp = v + n;
    const def = !NODEF.has(op) &&
      args[0] === v;
    const use = args.some((a, k) =>
      a === v && (k > 0 || !def));
    if (use) {
      out.push(\`ld \${tmp}, \${off}(sp)\`);
    }
    const ren = args.map((a) =>
      a === v ? tmp : a);
    out.push(op + ' ' + ren.join(', '));
    if (def) {
      out.push(\`sd \${tmp}, \${off}(sp)\`);
    }
  }
  return out;
}`,
    tests: `const sumsq = [
  'mv n, a0',
  'li s, 0',
  'li i, 0',
  'loop:',
  'bge i, n, done',
  'mul t, i, i',
  'add s, s, t',
  'addi i, i, 1',
  'j loop',
  'done:',
  'mv a0, s',
  'ret',
];
test('spilling n: one store, one load', () => {
  expect(spill(sumsq, 'n', 8)).toEqual([
    'mv n1, a0', 'sd n1, 8(sp)',
    'li s, 0', 'li i, 0', 'loop:',
    'ld n2, 8(sp)', 'bge i, n2, done',
    'mul t, i, i', 'add s, s, t',
    'addi i, i, 1', 'j loop', 'done:',
    'mv a0, s', 'ret']);
});
test('spilling s: a load and a store in the loop', () => {
  const out = spill(sumsq, 's', 0);
  expect(out.slice(7, 10)).toEqual([
    'ld s2, 0(sp)', 'add s2, s2, t',
    'sd s2, 0(sp)']);
  expect(out[out.length - 3])
    .toBe('ld s3, 0(sp)');
});
test('a use twice in one line loads once', () => {
  expect(spill(['mul t, i, i'], 'i', 0))
    .toEqual(['ld i1, 0(sp)',
      'mul t, i1, i1']);
});
test('a pure definition only stores', () => {
  expect(spill(['li i, 0'], 'i', 16))
    .toEqual(['li i1, 0', 'sd i1, 16(sp)']);
});
test('lines without v are unchanged', () => {
  expect(spill(['j loop', 'ret'], 'n', 8))
    .toEqual(['j loop', 'ret']);
});`,
    hints: [
      'For each line that mentions `v`, work out two yes/no facts first: does it write `v`, and does it read `v`? Then emit up to three lines: a load, the renamed instruction, a store.',
      'It writes `v` if the operation is not in `NODEF` and `args[0] === v`. It reads `v` if `v` appears at any other position, or at position 0 of a `NODEF` operation.',
      'Use one fresh name per instruction: `n += 1; const tmp = v + n;`. Then `if (use) out.push(`ld ${tmp}, ${off}(sp)`);`, push the renamed line (`args.map((a) => a === v ? tmp : a)`), and `if (def) out.push(`sd ${tmp}, ${off}(sp)`);`.',
    ],
    walkthrough: `**How to think about it.** Spill code has one shape, applied to every instruction that touches the spilled value: get the value out of memory just before the instruction needs it, and put it back just after the instruction changes it. Between those two moments it sits in a fresh virtual register that lives for a single instruction, which is what makes the new graph easy to colour. So for each line, ask two questions (does it read \`v\`? does it write \`v\`?), and emit up to three lines.

**The solution, line by line** (the new part, after the lines without \`v\` have been skipped).

- \`n += 1; const tmp = v + n;\` makes a fresh name for this instruction: \`n1\`, \`n2\`, and so on. Fresh names matter: each tiny range interferes with very little, whereas reusing \`v\` would rebuild the long range we are trying to break.
- \`const def = !NODEF.has(op) && args[0] === v;\` the instruction writes \`v\` if it is an ordinary instruction whose first operand (its destination) is \`v\`. Branches and jumps write nothing.
- \`const use = args.some((a, k) => a === v && (k > 0 || !def));\` it reads \`v\` if \`v\` is any operand other than the destination, or if it is in the first position of an instruction that does not write it (\`bge n, ...\`).
- \`if (use) { out.push(\`ld \${tmp}, \${off}(sp)\`); }\` loads the value into the fresh name first.
- \`const ren = args.map((a) => a === v ? tmp : a);\` renames every mention, so \`mul t, i, i\` becomes \`mul t, i1, i1\` with one load for both.
- \`out.push(op + ' ' + ren.join(', '));\` writes the renamed instruction.
- \`if (def) { out.push(\`sd \${tmp}, \${off}(sp)\`); }\` stores the new value back.

Spilling \`n\` in \`sumsq\` gives \`mv n1, a0\` and \`sd n1, 8(sp)\` at the entry, then \`ld n2, 8(sp)\` before \`bge i, n2, done\`: one store, and one load per trip. Spilling \`s\` puts \`ld s2\`, \`add s2, s2, t\`, \`sd s2\` in the loop: a load and a store every trip, which is why its cost was twice \`n\`'s.

**Common wrong attempts.**

- Deciding "it reads \`v\`" as "it does not write \`v\`": \`add s, s, t\` both reads and writes \`s\`, and needs both the load and the store.
- Reusing the name \`v\` instead of fresh names: the code looks right, but \`v\` is still one long-lived value in the interference graph, so nothing has been gained.`,
    wrong: [
      {
        code: `// Instructions whose first operand is
// read, not written.
const NODEF = new Set(['bge', 'blt',
  'beq', 'bne', 'j', 'ret']);

// Keep v in the stack slot off(sp):
// load before each use, store after
// each definition, using a fresh name
// each time (v1, v2, ...).
function spill(code, v, off) {
  const out = [];
  let n = 0;
  for (const line of code) {
    const parts = line.split(' ');
    const op = parts[0];
    const more = parts.slice(1);
    const args = more.length > 0
      ? more.join(' ').split(', ') : [];
    if (!args.includes(v)) {
      out.push(line);
      continue;
    }
    n += 1;
    const tmp = v + n;
    const def = !NODEF.has(op) &&
      args[0] === v;
    const use = !def;
    if (use) {
      out.push(\`ld \${tmp}, \${off}(sp)\`);
    }
    const ren = args.map((a) =>
      a === v ? tmp : a);
    out.push(op + ' ' + ren.join(', '));
    if (def) {
      out.push(\`sd \${tmp}, \${off}(sp)\`);
    }
  }
  return out;
}`,
        why: 'This treats every instruction that writes v as not reading it, so `add s, s, t` loses its load and adds a stale register.',
      },
      {
        code: `// Instructions whose first operand is
// read, not written.
const NODEF = new Set(['bge', 'blt',
  'beq', 'bne', 'j', 'ret']);

// Keep v in the stack slot off(sp):
// load before each use, store after
// each definition, using a fresh name
// each time (v1, v2, ...).
function spill(code, v, off) {
  const out = [];
  let n = 0;
  for (const line of code) {
    const parts = line.split(' ');
    const op = parts[0];
    const more = parts.slice(1);
    const args = more.length > 0
      ? more.join(' ').split(', ') : [];
    if (!args.includes(v)) {
      out.push(line);
      continue;
    }
    const tmp = v;
    const def = !NODEF.has(op) &&
      args[0] === v;
    const use = args.some((a, k) =>
      a === v && (k > 0 || !def));
    if (use) {
      out.push(\`ld \${tmp}, \${off}(sp)\`);
    }
    const ren = args.map((a) =>
      a === v ? tmp : a);
    out.push(op + ' ' + ren.join(', '));
    if (def) {
      out.push(\`sd \${tmp}, \${off}(sp)\`);
    }
  }
  return out;
}`,
        why: 'This keeps the name v instead of a fresh one per instruction, so the spilled value is still one long live range.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Four values are alive at once in a loop and there are three registers. What must happen?',
    options: [
      {
        t: 'Coalescing will fix it',
        why: 'Coalescing merges values that do not interfere; these four all do.',
      },
      {
        t: 'One value is spilled: kept in a stack slot, loaded before uses and stored after definitions',
        correct: true,
        why: 'No colouring can put four interfering values in three registers.',
      },
      {
        t: 'The program cannot be compiled',
        why: 'Spilling always makes it possible, at the price of memory traffic.',
      },
    ],
  },
  {
    q: 'Spill costs weight each load or store by 10 per enclosing loop. In one loop, n is defined once before it and read once per trip; s is defined before it, read and written once per trip, and read once after it; both have degree 3. Why does Chaitin’s rule spill n rather than s?',
    options: [
      {
        t: 'n spilled costs one store outside and one load per trip (cost 11); s would cost a load and a store per trip and two outside (cost 22), with the same degree',
        correct: true,
        why: 'Smallest cost divided by degree wins.',
      },
      {
        t: 'n is a parameter, and parameters are always spilled',
        why: 'Parameters are spilled only when that is cheapest.',
      },
      {
        t: 'n has the most neighbours',
        why: 'Both have degree 3 here; cost decides.',
      },
    ],
  },
  {
    q: 'What does the spill code for `add s, s, t`, with s spilled to 0(sp), look like?',
    options: [
      {
        t: '`add s, s, t; sd s, 0(sp)`',
        why: 'The add reads s too, so it needs a load first, and a fresh name.',
      },
      {
        t: '`ld s1, 0(sp); add s1, s1, t`',
        why: 'The add also writes s, so the new value must be stored.',
      },
      {
        t: '`ld s1, 0(sp); add s1, s1, t; sd s1, 0(sp)`',
        correct: true,
        why: 'Load before the use, store after the definition, one fresh name.',
      },
    ],
  },
  {
    q: 'Why do Chaitin-style allocators give a value with a tiny live range an infinite spill cost?',
    options: [
      {
        t: 'Because spilling it does not shorten anything: it would become equally short values around a load and a store',
        correct: true,
        why: 'Spilling helps by breaking long ranges into short ones.',
      },
      {
        t: 'Because tiny values cannot be stored',
        why: 'Any value can be stored; it just does not help.',
      },
      {
        t: 'Because it is a constant',
        why: 'Constants are a different case: they can be rematerialised.',
      },
    ],
  },
  {
    q: 'What is **rematerialisation**?',
    options: [
      {
        t: 'Loading a spilled value twice',
        why: 'It avoids the load altogether.',
      },
      {
        t: 'Recomputing a cheap value (such as a constant) where it is needed, instead of reloading it from a stack slot',
        correct: true,
        why: 'An li needs no memory access and no slot.',
      },
      {
        t: 'Moving a value between two registers',
        why: 'That is a copy.',
      },
    ],
  },
];
