// Chapter 91 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cse-what': {
    q: 'What is a **common subexpression**, and what does CSE do with it?',
    a: 'A computation that gives a value the program already has; CSE reuses the earlier value instead of computing it again.',
  },
  'same-in-ssa': {
    q: 'Why are `%2 = binop * %0, %1` and `%3 = binop * %0, %1` certainly equal in SSA?',
    a: 'Same operation on the same two values, and SSA values are defined once, so `%0` and `%1` cannot change in between.',
  },
  'vn-key': {
    q: 'In local value numbering, what is the key of `%d = op %a, %b`?',
    a: 'The operation together with the value numbers of the operands: (op, VN(%a), VN(%b)).',
  },
  'vn-numbers': {
    q: 'Why is the key built from operands’ value numbers rather than their names?',
    a: 'So that redundancy is found in chains: once `%3` is known to be `%2`, `%3 + 2` has the same key as `%2 + 2`.',
  },
  commutative: {
    q: 'Why are the operand numbers sorted for `*` but not for `-`?',
    a: '`a * b` equals `b * a`, so both orders should share a key; `a - b` and `b - a` give different answers.',
  },
  'load-kill': {
    q: 'Two reads of `p.x` have a store to `p.x` between them. May value numbering reuse the first read for the second?',
    a: 'No. The store may change `p.x`, so it must remove that read’s key from the table (and the key of any read that may alias the stored field).',
  },
  'call-kill': {
    q: 'Why must local value numbering forget every remembered memory read at a call to an unknown function?',
    a: 'The callee runs code the compiler cannot see, which may write any memory the program can reach, including every location read before the call.',
  },
  'plus-twice': {
    q: 'Why may a JavaScript compiler not merge two identical `a + b` when `a` might be an object?',
    a: 'Each `+` calls `a.valueOf()`, so merging them would change how many times that method runs.',
  },
};

export const examples = {
  keys: {
    title: 'A value-numbering table',
    code: `const COMM = ['+', '*'];
const table = new Map();
const vn = {};
// [id, op, a, b]; a, b are ids
const block = [
  [2, '*', 0, 1], [3, '*', 1, 0],
  [5, '+', 2, 4], [6, '+', 3, 4],
  [7, '-', 0, 1], [8, '-', 1, 0],
];
for (const [id, op, a, b] of block) {
  let xs = [vn[a] ?? a, vn[b] ?? b];
  if (COMM.includes(op)) {
    xs = xs.sort((x, y) => x - y);
  }
  const key = op + ' ' + xs.join(' ');
  const old = table.get(key);
  vn[id] = old ?? id;
  if (old === undefined) {
    table.set(key, id);
  }
  const said = old === undefined
    ? 'new' : 'is %' + old;
  console.log('%' + id, key, said);
}`,
  },
};

export const exercises = {
  lvn: {
    title: 'Local value numbering',
    prompt: `Write \`lvn(insts)\` for one block of SSA instructions, in order. Each is \`{ id, op, args, value, name }\`, where \`args\` are ids of earlier instructions and \`op\` is one of:

- \`'param'\` or \`'const'\`: never redundant here;
- \`'+'\`, \`'-'\`, \`'*'\`: pure arithmetic (\`+\` and \`*\` are commutative);
- \`'load'\`: reads the variable \`name\`; \`'store'\`: writes \`args[0]\` into \`name\`;
- \`'call'\`: calls unknown code; \`'ret'\`: returns \`args[0]\`.

Return a new list without the redundant instructions, in order, where every remaining instruction's \`args\` have been renamed to the instruction that was kept. Arithmetic is redundant when an earlier instruction had the same op on the same (renamed) operands, in either order for \`+\` and \`*\`. A load is redundant when the same \`name\` was loaded earlier with no store to that name, and no call, in between. Stores, calls and returns are never redundant.`,
    starter: `// An instruction: { id, op, args,
// value, name }. op is 'param',
// 'const', '+', '-', '*', 'load'
// (reads variable name), 'store'
// (writes args[0] to name), 'call'
// or 'ret'. args are ids.
const PURE = ['+', '-', '*'];
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function lvn(insts) {
  return insts;
}`,
    solution: `// An instruction: { id, op, args,
// value, name }. op is 'param',
// 'const', '+', '-', '*', 'load'
// (reads variable name), 'store'
// (writes args[0] to name), 'call'
// or 'ret'. args are ids.
const PURE = ['+', '-', '*'];
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function lvn(insts) {
  const table = new Map();
  const rep = new Map();
  const vn = (a) => rep.get(a) ?? a;
  const out = [];
  for (const i of insts) {
    const args = i.args.map(vn);
    let key = null;
    if (PURE.includes(i.op)) {
      const ks = COMM.includes(i.op)
        ? [...args].sort(byNum) : args;
      key = i.op + ' ' + ks.join(' ');
    }
    if (i.op === 'load') {
      key = 'load ' + i.name;
    }
    if (i.op === 'store') {
      table.delete('load ' + i.name);
    }
    if (i.op === 'call') {
      for (const k of [...table.keys()])
        if (k.startsWith('load '))
          table.delete(k);
    }
    if (key !== null &&
        table.has(key)) {
      rep.set(i.id, table.get(key));
      continue;
    }
    if (key !== null) {
      table.set(key, i.id);
    }
    out.push({ ...i, args });
  }
  return out;
}
`,
    tests: `const P = (id) =>
  ({ id, op: 'param', args: [] });
const K = (id, value) =>
  ({ id, op: 'const', args: [], value });
const O = (id, op, ...args) =>
  ({ id, op, args });
const L = (id, name) =>
  ({ id, op: 'load', args: [], name });
const ids = (xs) => xs.map((i) => i.id);
test('a * b twice', () => {
  const out = lvn([P(0), P(1),
    O(2, '*', 0, 1), O(3, '*', 0, 1),
    O(4, '+', 2, 3), O(5, 'ret', 4)]);
  expect(ids(out)).toEqual([0, 1, 2, 4, 5]);
  expect(out[3].args).toEqual([2, 2]);
});
test('b * a is a * b', () => {
  const out = lvn([P(0), P(1),
    O(2, '*', 0, 1), O(3, '*', 1, 0),
    O(4, 'ret', 3)]);
  expect(ids(out)).toEqual([0, 1, 2, 4]);
  expect(out[3].args).toEqual([2]);
});
test('a - b is not b - a', () => {
  const out = lvn([P(0), P(1),
    O(2, '-', 0, 1), O(3, '-', 1, 0)]);
  expect(ids(out)).toEqual([0, 1, 2, 3]);
});
test('chains are found', () => {
  const out = lvn([P(0), P(1),
    O(2, '*', 0, 1), O(3, '*', 0, 1),
    K(4, 2), O(5, '+', 2, 4),
    O(6, '+', 3, 4), O(7, 'ret', 6)]);
  expect(ids(out))
    .toEqual([0, 1, 2, 4, 5, 7]);
  expect(out[5].args).toEqual([5]);
});
test('a load is reused until a store', () => {
  const st = { id: 3, op: 'store',
    args: [0], name: 'x' };
  const out = lvn([P(0), L(1, 'x'),
    L(2, 'x'), st, L(4, 'x'),
    O(5, '+', 2, 4)]);
  expect(ids(out)).toEqual([0, 1, 3, 4, 5]);
  expect(out[4].args).toEqual([1, 4]);
});
test('a call forgets every load', () => {
  const out = lvn([L(0, 'f'),
    O(1, 'call', 0), L(2, 'f'),
    O(3, 'call', 2)]);
  expect(ids(out)).toEqual([0, 1, 2, 3]);
});
test('calls are never merged', () => {
  const out = lvn([P(0),
    O(1, 'call', 0), O(2, 'call', 0)]);
  expect(ids(out)).toEqual([0, 1, 2]);
});
`,
    hints: [
      'Walk the list once with two maps: `table`, from a key string to the id of the first instruction that computed it, and `rep`, from a removed id to the id that replaces it. Rename every instruction’s args through `rep` before doing anything else.',
      'Build the key from the op and the *renamed* args, joined into a string such as `\'* 0 1\'`; for `+` and `*`, sort a copy of the args numerically first. A load’s key is `\'load \' + i.name`. If the key is already in `table`, record the replacement in `rep` and skip the instruction; otherwise add it.',
      'A `store` must delete the key `\'load \' + i.name`; a `call` must delete every key that starts with `\'load \'`. Do this before the lookup, and push every kept instruction as `{ ...i, args }` so the renamed args are used.',
    ],
    walkthrough: `**How to think about it.** Do the first test by hand: \`%2 = %0 * %1\`, then \`%3 = %0 * %1\`. When you meet \`%3\` you want to ask "have I seen *this computation* before?", so you need a description of the computation that is the same for both: the operation and the operands, written as a string like \`'* 0 1'\`, makes a perfect key for a \`Map\`. The first time a key appears, remember who computed it; the second time, the instruction is redundant, so drop it and remember that anything which used it should use the first one instead. Two refinements follow from the chapter: operands are renamed *before* building keys (that is what catches chains), and loads are only valid until something might write the memory they read.

**The solution, line by line.**

- \`const PURE = ['+', '-', '*'];\` and \`const COMM = ['+', '*'];\` list the arithmetic, and the part of it where order does not matter. \`const byNum = (x, y) => x - y;\` sorts numbers numerically (a plain \`sort()\` would compare them as text).
- \`const table = new Map();\` maps a key to the id of the first instruction that computed it.
- \`const rep = new Map();\` maps the id of a removed instruction to the id that replaces it.
- \`const vn = (a) => rep.get(a) ?? a;\` gives an operand's value number: its replacement if it was removed, otherwise itself. (A replacement is always a kept instruction, so one lookup is enough.)
- \`const out = [];\` collects the instructions we keep.
- \`const args = i.args.map(vn);\` renames the operands first, so every later step sees value numbers, not the original ids.
- \`let key = null;\` most instructions (params, constants, stores, calls, returns) get no key and so can never be redundant.
- \`if (PURE.includes(i.op)) { ... }\` builds an arithmetic key: \`COMM.includes(i.op) ? [...args].sort(byNum) : args\` sorts a *copy* of the operands for \`+\` and \`*\` (sorting \`args\` itself would reorder the instruction's real operands, which matters for \`-\`), and \`key = i.op + ' ' + ks.join(' ')\` makes a string such as \`'* 0 1'\`.
- \`if (i.op === 'load') { key = 'load ' + i.name; }\` a load's key is the name it reads.
- \`if (i.op === 'store') { table.delete('load ' + i.name); }\` a store forgets the load of the name it writes, so the next load of that name is a new value.
- \`if (i.op === 'call') { ... table.delete(k); }\` an unknown call might write anything, so every key starting \`'load '\` is forgotten. (Copying the keys with \`[...table.keys()]\` first is the safe way to delete while looping.)
- \`if (key !== null && table.has(key)) { rep.set(i.id, table.get(key)); continue; }\` a redundant instruction: remember its replacement and do not keep it.
- \`if (key !== null) { table.set(key, i.id); }\` a new computation: it becomes the one later instructions will find.
- \`out.push({ ...i, args });\` keeps the instruction, with its renamed operands.

In the chain test, \`%3\` is removed with \`rep\` saying 3 → 2; then \`%6 = %3 + %4\` is renamed to \`%2 + %4\`, whose key \`'+ 2 4'\` was entered by \`%5\`, so \`%6\` goes too, and the return is renamed to use \`%5\`.

**Common wrong attempts.**

- Not sorting for \`+\` and \`*\`: \`b * a\` gets the key \`'* 1 0'\` and is not found.
- Building the key from the original \`i.args\` rather than the renamed ones: the first redundancy is found, but the chain is not, because \`%3 + %4\` and \`%2 + %4\` look different.
- Never forgetting loads: the load after the store is merged with the one before it, and the program reads a stale value.`,
    wrong: [
      {
        code: `// An instruction: { id, op, args,
// value, name }. op is 'param',
// 'const', '+', '-', '*', 'load'
// (reads variable name), 'store'
// (writes args[0] to name), 'call'
// or 'ret'. args are ids.
const PURE = ['+', '-', '*'];
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function lvn(insts) {
  const table = new Map();
  const rep = new Map();
  const vn = (a) => rep.get(a) ?? a;
  const out = [];
  for (const i of insts) {
    const args = i.args.map(vn);
    let key = null;
    if (PURE.includes(i.op)) {
      key = i.op + ' ' + args.join(' ');
    }
    if (i.op === 'load') {
      key = 'load ' + i.name;
    }
    if (i.op === 'store') {
      table.delete('load ' + i.name);
    }
    if (i.op === 'call') {
      for (const k of [...table.keys()])
        if (k.startsWith('load '))
          table.delete(k);
    }
    if (key !== null &&
        table.has(key)) {
      rep.set(i.id, table.get(key));
      continue;
    }
    if (key !== null) {
      table.set(key, i.id);
    }
    out.push({ ...i, args });
  }
  return out;
}
`,
        why: 'Operands are never sorted for `+` and `*`, so `b * a` (key `* 1 0`) is not found as `a * b` (key `* 0 1`).',
      },
      {
        code: `// An instruction: { id, op, args,
// value, name }. op is 'param',
// 'const', '+', '-', '*', 'load'
// (reads variable name), 'store'
// (writes args[0] to name), 'call'
// or 'ret'. args are ids.
const PURE = ['+', '-', '*'];
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function lvn(insts) {
  const table = new Map();
  const rep = new Map();
  const vn = (a) => rep.get(a) ?? a;
  const out = [];
  for (const i of insts) {
    const args = i.args.map(vn);
    let key = null;
    if (PURE.includes(i.op)) {
      const ks = COMM.includes(i.op)
        ? [...i.args].sort(byNum)
        : i.args;
      key = i.op + ' ' +
        i.args.join(' ');
    }
    if (i.op === 'load') {
      key = 'load ' + i.name;
    }
    if (i.op === 'store') {
      table.delete('load ' + i.name);
    }
    if (i.op === 'call') {
      for (const k of [...table.keys()])
        if (k.startsWith('load '))
          table.delete(k);
    }
    if (key !== null &&
        table.has(key)) {
      rep.set(i.id, table.get(key));
      continue;
    }
    if (key !== null) {
      table.set(key, i.id);
    }
    out.push({ ...i, args });
  }
  return out;
}
`,
        why: 'The key uses the original ids, not the value numbers, so chains are missed: `%3 + %4` never finds `%2 + %4`.',
      },
      {
        code: `// An instruction: { id, op, args,
// value, name }. op is 'param',
// 'const', '+', '-', '*', 'load'
// (reads variable name), 'store'
// (writes args[0] to name), 'call'
// or 'ret'. args are ids.
const PURE = ['+', '-', '*'];
const COMM = ['+', '*'];
const byNum = (x, y) => x - y;
function lvn(insts) {
  const table = new Map();
  const rep = new Map();
  const vn = (a) => rep.get(a) ?? a;
  const out = [];
  for (const i of insts) {
    const args = i.args.map(vn);
    let key = null;
    if (PURE.includes(i.op)) {
      const ks = COMM.includes(i.op)
        ? [...args].sort(byNum) : args;
      key = i.op + ' ' + ks.join(' ');
    }
    if (i.op === 'load') {
      key = 'load ' + i.name;
    }
    if (key !== null &&
        table.has(key)) {
      rep.set(i.id, table.get(key));
      continue;
    }
    if (key !== null) {
      table.set(key, i.id);
    }
    out.push({ ...i, args });
  }
  return out;
}
`,
        why: 'Loads are never forgotten, so the load after the store reuses the value from before it: a stale read.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Local value numbering meets `%3 = binop * %1, %0` after `%2 = binop * %0, %1`. What happens?',
    options: [
      {
        t: '`%3` gets a new number, because its operands are in a different order',
        why: 'For a commutative operation the operand numbers are sorted before the key is built.',
      },
      {
        t: '`%3` gets `%2`’s number, and its uses can use `%2`',
        correct: true,
        why: 'Sorted, both keys are (*, 0, 1); multiplication of numbers does not care about order.',
      },
      {
        t: '`%3` is folded to a constant',
        why: 'Neither operand is a constant; this is value numbering, not folding.',
      },
    ],
  },
  {
    q: 'Which pair can value numbering prove equal?',
    options: [
      {
        t: '`%4 = binop - %0, %1` and `%5 = binop - %1, %0`',
        why: 'Subtraction is not commutative: `a - b` and `b - a` differ.',
      },
      {
        t: 'Two `call %9` instructions',
        why: 'A call can have side effects, so two calls are never merged.',
      },
      {
        t: 'Two `field.get %0 .x` with a `field.set %0, %3 .x` between them',
        why: 'The store changed `p.x`, so the second read may give a different value.',
      },
      {
        t: '`%5 = binop + %2, %4` and `%6 = binop + %3, %4`, where `%3` has `%2`’s number',
        correct: true,
        why: 'Both keys are (+, 2, 4), because keys use value numbers, not names.',
      },
    ],
  },
  {
    q: 'What does CSE do with a redundant instruction once value numbering has found it?',
    options: [
      {
        t: 'Points its uses at the earlier instruction, leaving it unused for DCE to delete',
        correct: true,
        why: 'CSE and DCE split the work: one reroutes the uses, the other sweeps what is left.',
      },
      {
        t: 'Moves it to the start of the block',
        why: 'Nothing is moved; the earlier instruction is already in the right place.',
      },
      {
        t: 'Turns it into a call to the earlier instruction',
        why: 'Instructions are not called; its uses simply refer to the earlier value.',
      },
    ],
  },
  {
    q: 'In `sq(p) + sq(3)`, the global `sq` is read once before each call. Why may the second read not reuse the first?',
    options: [
      {
        t: 'Reads of globals are never numbered',
        why: 'They can be; two reads with no possible write between them give the same value.',
      },
      {
        t: 'Loads are never equal',
        why: 'Two loads with no possible write between them are equal; here there is one.',
      },
      {
        t: 'The call between them could assign a new value to `sq`',
        correct: true,
        why: 'An unknown call may write any memory, so value numbering forgets every load at a call.',
      },
    ],
  },
  {
    q: 'Why does JavaScript make merging two identical `a + b` risky?',
    options: [
      {
        t: 'Addition of floats is not exact',
        why: 'It is not exact, but it is deterministic: the same inputs give the same answer.',
      },
      {
        t: 'If `a` is an object, each `+` calls its `valueOf`, so merging changes how often that runs',
        correct: true,
        why: 'Only once `a` and `b` are known to be primitives is `+` pure.',
      },
      {
        t: 'Variables in JavaScript can be reassigned',
        why: 'In SSA every value is defined once; the danger is the hidden method call.',
      },
    ],
  },
  {
    q: 'What redundancy does local value numbering, run on one basic block at a time, miss?',
    options: [
      {
        t: 'A computation repeated later in the same block',
        why: 'That is exactly what it finds.',
      },
      {
        t: 'A computation already made in an earlier block that every path to this one passes through',
        correct: true,
        why: 'Its table starts empty in each block; finding these needs a global method that knows which blocks dominate which.',
      },
      {
        t: 'Two multiplications with their operands in different orders',
        why: 'Sorting the operands of commutative operations handles that within a block.',
      },
    ],
  },
];
