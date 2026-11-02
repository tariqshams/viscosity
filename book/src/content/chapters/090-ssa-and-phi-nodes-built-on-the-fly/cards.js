// Chapter 175 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 90, 90, 90.

export const prompts = {
  'ssa-what': {
    q: 'What is **SSA form**?',
    a: 'Static single assignment: every variable is assigned in exactly one place in the program text, so every use refers to exactly one definition.',
  },
  'static-meaning': {
    q: 'An assignment sits inside a loop that runs 100 times. How many SSA names does it define?',
    a: 'One. "Static" counts places in the text, not executions.',
  },
  'read-before-write': {
    q: 'Renaming `x = x * 2` when the latest version is `x1`: what do you get, and why that order?',
    a: '`x2 = x1 * 2`. The right-hand side is read before the assignment makes the new version.',
  },
  'vir-no-names': {
    q: 'In VIR, what does `%4` name?',
    a: 'The value produced by instruction 4. A value is its defining instruction, so it is assigned exactly once.',
  },
  'one-table': {
    q: 'Filing definitions in a table by name works for SSA code but not for the original. Why?',
    a: 'In the original, a later assignment to the same name overwrites the entry; in SSA every name is defined once.',
  },
  'ssa-buys': {
    q: 'In SSA, `%1 = const 0`. What do you know about every use of `%1`?',
    a: 'It is 0. There is no other assignment that could change it.',
  },
  'captured-not-ssa': {
    q: 'Why does VIR keep a closure-captured variable out of SSA?',
    a: 'Another function can change it at a moment this function’s CFG cannot see, so it is a binding with load and store.',
  },
  'fields-not-ssa': {
    q: 'Does SSA give versions to object fields such as `p.x`?',
    a: 'No. Only plain local variables are renamed; fields are memory, read and written with instructions, because other names can reach the same object.',
  },
  'why-phi': {
    q: 'After an `if` whose branches define `x2` and `x3`, why can no single name go in `y = ? + 3`?',
    a: 'Which version is right depends on which branch ran, and that is only known at run time.',
  },
  'phi-what': {
    q: 'What does a **phi node** do?',
    a: 'At the start of a join block, it picks the value of the operand that matches the edge control arrived on.',
  },
  'phi-operands': {
    q: 'How many operands does a phi have?',
    a: 'One per predecessor of its block, in predecessor order.',
  },
  'phi-not-real': {
    q: 'Do phis survive into machine code?',
    a: 'No. Before code generation they are replaced by copies at the ends of the predecessor blocks.',
  },
  'vir-phi-order': {
    q: 'In VIR, `b3: ; preds b1 b2` begins with `%4 = phi %2, %3`. Which operand is used when control comes from b1?',
    a: '`%2`, the first: operands follow the order of the `preds` list.',
  },
  'loop-phi': {
    q: 'Why may a loop header’s phi use a value defined later in the listing?',
    a: 'That operand is only read when control arrives along the back edge, after the defining block has run.',
  },
  'phis-together': {
    q: 'A block starts with two phis. Can the second one see the first one’s new value?',
    a: 'No. All of a block’s phis take their values at the same moment, as control crosses the edge.',
  },
  'swap-copies': {
    q: 'Why is `p2 = q2; q2 = p2;` a wrong way to remove the phis `p2 = φ(…, q2)` and `q2 = φ(…, p2)`?',
    a: 'The second copy reads the new `p2`, so both end up equal; the phis meant “all at once”, so the copies must be ordered carefully or use a temporary.',
  },
  'assign-no-inst': {
    q: 'What does VIR’s builder emit for the assignment `x = y` (both SSA locals)?',
    a: 'Nothing. It only records, in the current block’s table, that x now holds y’s value.',
  },
  'one-pred': {
    q: 'A sealed block with one predecessor has no definition of `x`. What does `readVariable` return?',
    a: 'Whatever `x` is at the end of that predecessor (it asks there).',
  },
  'phi-first': {
    q: 'Why does the builder record a new phi as the variable’s value *before* reading the operands?',
    a: 'In a loop the search can come back to this block. It then finds the phi and stops, instead of recursing forever.',
  },
  'sealed-what': {
    q: 'When is a block **sealed**?',
    a: 'Once all of its predecessors are known, so no more edges into it will be added.',
  },
  'unsealed-read': {
    q: 'What happens when you read a variable in an unsealed block that doesn’t define it?',
    a: 'The builder makes an empty, incomplete phi, remembers it, and fills in its operands when the block is sealed.',
  },
  'seal-when': {
    q: 'When does VIR’s front end seal a loop header?',
    a: 'Right after emitting the back edge from the end of the loop.',
  },
  'trivial-what': {
    q: 'What makes a phi **trivial**?',
    a: 'Apart from itself, all its operands are one value. It always means that value.',
  },
  'trivial-cascade': {
    q: 'After removing a trivial phi, why retry the phis that used it?',
    a: 'Replacing it may leave one of them with only one distinct value, so it becomes trivial too.',
  },
};

export const examples = {
  'which-def': {
    title: 'Which line defines this?',
    code: `function report(code) {
  const def = new Map();
  code.forEach(([d], i) =>
    def.set(d, i));
  code.forEach(([d, rhs], i) => {
    const ns = rhs.match(/[a-z]\\d*/g);
    for (const n of ns ?? []) {
      if (!def.has(n)) continue;
      const at = def.get(n);
      console.log('line ' + i, 'uses',
        n, 'from line', at);
    }
  });
}
report([['x1', 'a0 + 1'],
  ['x2', 'x1 * 2'],
  ['y1', 'x2 + 3'], ['x3', '0']]);
console.log('--- without SSA:');
report([['x', 'a + 1'], ['x', 'x * 2'],
  ['y', 'x + 3'], ['x', '0']]);`,
  },
  'phi-by-hand': {
    title: 'A phi, written by hand',
    code: `function f(a0) {
  const x1 = a0 + 1;
  let x2, x3, from;
  if (x1 > 5) {
    x2 = x1 * 2;
    from = 'B1';
  } else {
    x3 = 0;
    from = 'B2';
  }
  // x4 = φ(x2, x3): pick by edge
  const x4 = from === 'B1' ? x2 : x3;
  return x4 + 3;
}
console.log(f(9), f(1));`,
  },
  trivial: {
    title: 'Is this phi trivial?',
    code: `// Returns the one value the phi always
// means, or null if it really merges.
function trivial(id, args) {
  let same = null;
  for (const op of args) {
    if (op === same || op === id) {
      continue;
    }
    if (same !== null) return null;
    same = op;
  }
  return same;
}
const t = trivial;
console.log(t('%5', ['%2', '%2']));
console.log(t('%4', ['%0', '%4']));
console.log(t('%3', ['%2', '%10']));`,
  },
};

export const exercises = {
  'to-ssa': {
    title: 'Rename into SSA',
    prompt: `Write \`toSSA(code)\` for straight-line code. Each instruction is \`[dst, op, a, b]\`, where \`a\` and \`b\` are variable names (strings) or numbers. Return a new list in which:

- the *n*-th assignment to a name \`v\` defines \`v\` + *n* (\`x1\`, \`x2\`, ...);
- each name used is replaced by its latest version, or version \`0\` if it has not been assigned yet (\`a0\`);
- numbers and \`op\` are unchanged.

So \`[['x', '+', 'a', 1], ['x', '*', 'x', 2]]\` becomes \`[['x1', '+', 'a0', 1], ['x2', '*', 'x1', 2]]\`.`,
    starter: `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {
  // your code here
}`,
    solution: `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {
  const ver = {};
  const use = (a) =>
    typeof a === 'number'
      ? a
      : a + (ver[a] ?? 0);
  return code.map(([d, op, a, b]) => {
    const ua = use(a);
    const ub = use(b);
    ver[d] = (ver[d] ?? 0) + 1;
    return [d + ver[d], op, ua, ub];
  });
}`,
    tests: `test('one line', () => {
  expect(toSSA([['x', '+', 'a', 1]]))
    .toEqual([['x1', '+', 'a0', 1]]);
});
test('reads before it writes', () => {
  expect(toSSA([
    ['x', '+', 'a', 1],
    ['x', '*', 'x', 2],
  ])).toEqual([
    ['x1', '+', 'a0', 1],
    ['x2', '*', 'x1', 2],
  ]);
});
test('several names', () => {
  expect(toSSA([
    ['x', '+', 'a', 1],
    ['y', '+', 'x', 3],
    ['x', '-', 'y', 'x'],
    ['y', '*', 'x', 'a'],
  ])).toEqual([
    ['x1', '+', 'a0', 1],
    ['y1', '+', 'x1', 3],
    ['x2', '-', 'y1', 'x1'],
    ['y2', '*', 'x2', 'a0'],
  ]);
});
test('numbers stay numbers', () => {
  expect(toSSA([['z', '+', 0, 5]]))
    .toEqual([['z1', '+', 0, 5]]);
});`,
    hints: [
      'Keep an object `ver` from each name to its latest version number. A missing entry means version 0.',
      'For each instruction, rename `a` and `b` first, using the versions as they are *before* this line.',
      'Then add 1 to `ver[dst]` and build the new destination name from it.',
    ],
    walkthrough: `**How to think about it.** Do the example by hand and notice what you keep in your head: for each name, "what is its latest version?". That is the whole state of the algorithm, one small table. Each line then needs two things in a fixed order: rename the operands using the table *as it is before this line*, and only then give the destination a new version and write it into the table. The order matters because of lines like \`x = x * 2\`, whose right side means the old \`x\`.

**The solution, line by line.**

- \`const ver = {};\` is the table from each name to its latest version number; a name not in it has version 0 ("whatever came in from outside", such as a parameter).
- \`const use = (a) => typeof a === 'number' ? a : a + (ver[a] ?? 0);\` renames one operand: numbers pass through untouched (constants are not variables), and a name gets its current version glued on, so \`'a'\` becomes \`'a0'\` and \`'x'\` becomes \`'x1'\` once \`x\` has been assigned once. (\`??\` gives 0 when the name is missing from the table.)
- \`return code.map(([d, op, a, b]) => {\` builds one new instruction per old one; the square brackets unpack the four parts.
- \`const ua = use(a);\` and \`const ub = use(b);\` rename both operands *first*, with the table still as it was before this line.
- \`ver[d] = (ver[d] ?? 0) + 1;\` then makes the next version of the destination: 1 for its first assignment, 2 for its second, and so on.
- \`return [d + ver[d], op, ua, ub];\` builds the renamed instruction, such as \`['x2', '*', 'x1', 2]\`.

Why is this enough, when the next chapter needs phis? Straight-line code has a single path, so "the latest version" is always one name. Phis are needed only where two paths join, each with its own latest version.

**Common wrong attempts.**

- Bumping the version before renaming the operands: \`x = x * 2\` then becomes \`x2 = x2 * 2\`, a value defined in terms of itself.
- Giving fresh names to destinations but leaving uses alone: every line is assigned once, but \`y = x + 3\` still does not say which \`x\` it means, so nothing has been gained.
- Starting versions at 0 for the first assignment: then the first assigned \`x\` would be \`x0\`, the same name as the incoming value.`,
    wrong: [
      {
        code: `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {
  const ver = {};
  const use = (a) =>
    typeof a === 'number'
      ? a
      : a + (ver[a] ?? 0);
  return code.map(([d, op, a, b]) => {
    ver[d] = (ver[d] ?? 0) + 1;
    return [d + ver[d], op,
      use(a), use(b)];
  });
}`,
        why: 'This bumps the version before renaming the operands, so `x = x * 2` becomes `x2 = x2 * 2`. The right-hand side must read the version from before this line.',
      },
      {
        code: `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {
  let n = 0;
  return code.map(([d, op, a, b]) =>
    [d + ++n, op, a, b]);
}`,
        why: 'Fresh destination names alone are not SSA: the uses must be renamed too, or `y = x + 3` no longer says which `x` it means.',
      },
    ],
  },
  'enter-block': {
    title: 'All phis at once',
    prompt: 'Write `enter(phis, env, k)`: control enters a block along predecessor edge `k`. `phis` is the block\'s list of `[dst, operands]`, and `env` maps names to current values. Return a **new** env in which every phi\'s `dst` holds the value of its `k`-th operand. All phis must read the env as it was *before* any of them ran. Don\'t change `env`.',
    starter: `// phis: [[dst, [op0, op1, ...]], ...]
// env: name -> value. k: the edge.
function enter(phis, env, k) {
  return env;
}`,
    solution: `// phis: [[dst, [op0, op1, ...]], ...]
// env: name -> value. k: the edge.
function enter(phis, env, k) {
  const out = { ...env };
  for (const [d, ops] of phis) {
    out[d] = env[ops[k]];
  }
  return out;
}`,
    tests: `test('one phi, each edge', () => {
  const ps = [['x4', ['x2', 'x3']]];
  const env = { x2: 20, x3: 0 };
  expect(enter(ps, env, 0).x4)
    .toBe(20);
  expect(enter(ps, env, 1).x4)
    .toBe(0);
});
test('a swap in a loop header', () => {
  const ps = [
    ['p2', ['p0', 'q2']],
    ['q2', ['q0', 'p2']],
  ];
  const env = { p2: 1, q2: 2 };
  const out = enter(ps, env, 1);
  expect(out.p2).toBe(2);
  expect(out.q2).toBe(1);
});
test('env is not changed', () => {
  const ps = [['x4', ['x2', 'x3']]];
  const env = { x2: 20, x3: 0 };
  enter(ps, env, 0);
  expect(env.x4).toBe(undefined);
});`,
    hints: [
      'Start from the swap test: what must `p2` and `q2` hold after entering along edge 1? Which values must be read before anything is written?',
      'Keep two objects: the old `env`, which you only read, and a new `out`, which you only write. `{ ...env }` makes the copy.',
      'For each `[d, ops]` in `phis`, set `out[d] = env[ops[k]]`: the k-th operand, read from the old env.',
    ],
    walkthrough: `**How to think about it.** Entering a block along edge \`k\` means: every phi picks its \`k\`-th operand. The only subtle part is *when* each phi reads its operand, and the swap test settles it. With \`p2 = φ(p0, q2)\` and \`q2 = φ(q0, p2)\` and the old values \`p2 = 1\`, \`q2 = 2\`, entering along edge 1 must give \`p2 = 2\` (the old \`q2\`) and \`q2 = 1\` (the old \`p2\`). If the phis ran one after the other, writing as they go, the second would read the first one's *new* value. So read everything from the old state, and write everything into a new one.

**The solution, line by line.**

- \`function enter(phis, env, k) {\` takes the block's phis, the current values and the edge number.
- \`const out = { ...env };\` makes a new object with all of \`env\`'s entries (\`...\` spreads them in), so values the phis do not touch carry over, and \`env\` itself is never changed.
- \`for (const [d, ops] of phis) {\` visits each phi, unpacking its destination \`d\` and its operand list \`ops\`.
- \`out[d] = env[ops[k]];\` picks the \`k\`-th operand's *name*, looks its value up in the **old** \`env\`, and writes it into the **new** \`out\`. Because every read goes to \`env\` and every write to \`out\`, no phi can see another's new value.
- \`return out;\` hands back the state after the edge has been crossed.

This is exactly "all phis take their values at the same moment". Getting it wrong when phis are turned into plain copies is the classic *swap problem*, which a compiler leaving SSA has to avoid (Parallel copies and the swap problem comes back to it).

**Common wrong attempts.**

- Writing into \`env\` as you go: the first phi overwrites \`p2\` with 2, and the second then copies that 2 into \`q2\`, so both end up as 2.
- Building \`out\` as an empty object \`{}\`: the phis' values are right, but every other variable is lost.
- Changing \`env\` and returning it: the result looks right for one phi, but the caller's \`env\` has changed, and the last test checks that it has not.`,
    wrong: [
      {
        code: `// phis: [[dst, [op0, op1, ...]], ...]
// env: name -> value. k: the edge.
function enter(phis, env, k) {
  for (const [d, ops] of phis) {
    env[d] = env[ops[k]];
  }
  return env;
}`,
        why: 'Updating in place lets the second phi read the first phi’s new value. In the swap, both end up as 2.',
      },
    ],
  },
  'remove-trivial': {
    title: 'Remove trivial phis',
    prompt: `Write \`removeTrivial(phis)\`. \`phis\` maps each phi's id to its list of operands; an operand is either another phi's id or some other value (any string). A phi is **trivial** when, apart from itself, its operands are all one value. Replace trivial phis by that value, repeatedly, until no phi is trivial. A phi whose only operand is itself becomes \`'undef'\`.

Return an object giving, for every phi, what it finally stands for: a non-phi value, \`'undef'\`, or its own id if it really merges two values. Operands must be looked up through earlier replacements.`,
    starter: `// phis: { id: [operand, ...] }
// Return { id: replacement } for
// every phi (its own id if it stays).
function removeTrivial(phis) {
  const out = {};
  for (const p in phis) out[p] = p;
  return out;
}`,
    solution: `// phis: { id: [operand, ...] }
// Return { id: replacement } for
// every phi (its own id if it stays).
function removeTrivial(phis) {
  const rep = {};
  for (const p in phis) rep[p] = p;
  const find = (v) =>
    v in rep && rep[v] !== v
      ? find(rep[v]) : v;
  let changed = true;
  while (changed) {
    changed = false;
    for (const p in phis) {
      if (rep[p] !== p) continue;
      const ops = new Set(
        phis[p].map(find));
      ops.delete(p);
      if (ops.size > 1) continue;
      rep[p] = ops.size
        ? [...ops][0] : 'undef';
      changed = true;
    }
  }
  const out = {};
  for (const p in phis) {
    out[p] = find(p);
  }
  return out;
}`,
    tests: `test('same value twice', () => {
  expect(removeTrivial({
    p1: ['x', 'x'],
  })).toEqual({ p1: 'x' });
});
test('itself and one value', () => {
  expect(removeTrivial({
    p1: ['x', 'p1'],
  })).toEqual({ p1: 'x' });
});
test('a real merge stays', () => {
  expect(removeTrivial({
    p1: ['x', 'y'],
  })).toEqual({ p1: 'p1' });
});
test('a cascade, in any order', () => {
  expect(removeTrivial({
    p2: ['p1', 'x'],
    p1: ['x', 'p1'],
  })).toEqual({ p1: 'x', p2: 'x' });
});
test('a cycle of phis', () => {
  expect(removeTrivial({
    p1: ['x', 'p2'],
    p2: ['p1', 'p1'],
  })).toEqual({ p1: 'x', p2: 'x' });
});
test('only itself', () => {
  expect(removeTrivial({
    p1: ['p1'],
  })).toEqual({ p1: 'undef' });
});`,
    hints: [
      'Keep `rep`: what each phi has been replaced by (initially itself). Write a `find(v)` that follows `rep` until it reaches something that maps to itself, or isn’t a phi.',
      'For a live phi, collect its operands through `find` into a Set and delete the phi’s own id. Size 0 means `undef`; size 1 means trivial.',
      'One sweep isn’t enough: a phi checked early may become trivial after a later one is removed. Repeat until a sweep changes nothing.',
    ],
    walkthrough: `**How to think about it.** This is \`tryRemoveTrivialPhi\` from \`builder.ts\`, with the IR replaced by a table. Two ideas make it manageable. First, rather than rewriting every use of a removed phi, *record* what it was replaced by (a table \`rep\`), and look every operand up through that record; then a chain of replacements (p2 used p1, which became x) is followed automatically. Second, removing one phi can make another trivial, so keep sweeping over the phis until a whole sweep removes nothing.

**The solution, line by line.**

- \`const rep = {}; for (const p in phis) rep[p] = p;\` starts with every phi standing for itself.
- \`const find = (v) => v in rep && rep[v] !== v ? find(rep[v]) : v;\` follows replacements: if \`v\` is a phi that has been replaced, look up what replaced it, and so on, until reaching a live phi or a plain value.
- \`let changed = true; while (changed) { changed = false;\` repeats sweeps until one changes nothing.
- \`for (const p in phis) {\` visits each phi.
- \`if (rep[p] !== p) continue;\` skips phis already removed.
- \`const ops = new Set(phis[p].map(find));\` collects the phi's operands *after* replacements, without repeats.
- \`ops.delete(p);\` ignores the phi itself: \`p1 = φ(x, p1)\` gets its own value back round a loop, which adds nothing.
- \`if (ops.size > 1) continue;\` keeps a phi that really merges two values.
- \`rep[p] = ops.size ? [...ops][0] : 'undef';\` replaces a trivial phi by its one other value, or by \`'undef'\` if it had none (a variable never given a value; the builder turns this into \`const undefined\`).
- \`changed = true;\` asks for another sweep.
- The last loop builds the answer: for each phi, \`find(p)\` gives what it finally stands for.

The loop must end, because every sweep that sets \`changed\` removes a phi for good, and there are only so many phis. The real builder reaches the same answer differently: instead of whole sweeps, it retries just the phis that used each removed one.

**Common wrong attempts.**

- One sweep only: in the cascade test \`p2\` is checked first, while \`p1\` still looks like a separate value, and is never looked at again.
- Comparing raw operands instead of looking them up through \`find\`: \`p2\` keeps seeing \`p1\` and \`x\` as two different values, even after \`p1\` has become \`x\`.
- Forgetting to ignore the phi's own id: \`p1 = φ(x, p1)\` then looks like a merge of two values and is never removed.`,
    wrong: [
      {
        code: `// phis: { id: [operand, ...] }
// Return { id: replacement } for
// every phi (its own id if it stays).
function removeTrivial(phis) {
  const rep = {};
  for (const p in phis) rep[p] = p;
  const find = (v) =>
    v in rep && rep[v] !== v
      ? find(rep[v]) : v;
  let changed = true;
  if (changed) {
    changed = false;
    for (const p in phis) {
      if (rep[p] !== p) continue;
      const ops = new Set(
        phis[p].map(find));
      ops.delete(p);
      if (ops.size > 1) continue;
      rep[p] = ops.size
        ? [...ops][0] : 'undef';
      changed = true;
    }
  }
  const out = {};
  for (const p in phis) {
    out[p] = find(p);
  }
  return out;
}`,
        why: 'One sweep misses cascades: `p2` is checked while `p1` still looks like a real value, and is never looked at again.',
      },
      {
        code: `// phis: { id: [operand, ...] }
// Return { id: replacement } for
// every phi (its own id if it stays).
function removeTrivial(phis) {
  const rep = {};
  for (const p in phis) rep[p] = p;
  const find = (v) =>
    v in rep && rep[v] !== v
      ? find(rep[v]) : v;
  let changed = true;
  while (changed) {
    changed = false;
    for (const p in phis) {
      if (rep[p] !== p) continue;
      const ops = new Set(phis[p]);
      ops.delete(p);
      if (ops.size > 1) continue;
      rep[p] = ops.size
        ? [...ops][0] : 'undef';
      changed = true;
    }
  }
  const out = {};
  for (const p in phis) {
    out[p] = find(p);
  }
  return out;
}`,
        why: 'The operands are not looked up through earlier replacements, so `p2` keeps seeing `p1` as a separate value from `x`.',
      },
    ],
  },
  'read-var': {
    optional: true,
    title: 'readVariable on a finished CFG',
    prompt: 'Write `readVar(v, b, preds, defs)` for an **acyclic** CFG whose blocks are all sealed. If block `b` defines `v` in `defs[b]`, return that value. Otherwise, with no predecessors, return `\'undef\'`; with one, ask it; with several, ask each one in order. If they all give the same answer, return it (no phi needed); if not, return the string `\'phi(\' + answers.join(\',\') + \')\'`.',
    starter: `// preds: { block: [pred, ...] }
// defs: { block: { name: value } }
function readVar(v, b, preds, defs) {
  return defs[b][v];
}`,
    solution: `// preds: { block: [pred, ...] }
// defs: { block: { name: value } }
function readVar(v, b, preds, defs) {
  if (v in defs[b]) return defs[b][v];
  const ps = preds[b];
  if (ps.length === 0) return 'undef';
  const vals = ps.map((p) =>
    readVar(v, p, preds, defs));
  if (vals.every((x) => x === vals[0]))
    return vals[0];
  return 'phi(' + vals.join(',') + ')';
}`,
    tests: `const preds = {
  b0: [], b1: ['b0'], b2: ['b0'],
  b3: ['b1', 'b2'],
};
const defs = {
  b0: { x: '1', y: '5' },
  b1: { x: '2' }, b2: {}, b3: {},
};
test('defined here', () => {
  expect(readVar('x', 'b0', preds, defs))
    .toBe('1');
});
test('through one predecessor', () => {
  expect(readVar('y', 'b1', preds, defs))
    .toBe('5');
});
test('a join that disagrees', () => {
  expect(readVar('x', 'b3', preds, defs))
    .toBe('phi(2,1)');
});
test('a join that agrees', () => {
  expect(readVar('y', 'b3', preds, defs))
    .toBe('5');
});
test('never assigned', () => {
  expect(readVar('z', 'b3', preds, defs))
    .toBe('undef');
});`,
    hints: [
      'Check `defs[b]` first. If `v` isn’t there, look at `preds[b]`.',
      'Recurse into every predecessor with `map`. Compare all the answers with the first one.',
    ],
    walkthrough: `**How to think about it.** This is \`readVariableRecursive\` for the easy case: every block sealed, and no loops, so asking predecessors always ends at the entry. Write the three rules from the chapter's Formal block as three \`if\`s, and add the trivial-phi check on the spot: if every predecessor gives the same answer, no phi is needed.

**The solution, line by line.**

- \`if (v in defs[b]) return defs[b][v];\` answers from the block's own table if it can.
- \`const ps = preds[b];\` gets the blocks that lead here.
- \`if (ps.length === 0) return 'undef';\` handles the entry (or any block nothing leads to): the variable was never given a value on this path.
- \`const vals = ps.map((p) => readVar(v, p, preds, defs));\` asks every predecessor, in order. One predecessor is just the case where this list has one answer.
- \`if (vals.every((x) => x === vals[0])) return vals[0];\` returns the common answer when they all agree, which is trivial-phi removal done before the phi is ever made.
- \`return 'phi(' + vals.join(',') + ')';\` otherwise describes the phi that would be made, with one operand per predecessor.

The "agree" test is the \`%5\` that vanished from the chapter's VIR: \`y\`'s phi at the join would have been \`φ(5, 5)\`. With loops you would also need the "record the phi first" trick, or the recursion would chase the back edge forever.

**Common wrong attempts.**

- Always making a phi at a join: when both sides give 5, that is exactly the trivial phi the builder removes.
- Returning \`defs[b][v]\` without checking: a block that never wrote \`v\` gives \`undefined\` instead of asking its predecessors.`,
    wrong: [
      {
        code: `// preds: { block: [pred, ...] }
// defs: { block: { name: value } }
function readVar(v, b, preds, defs) {
  if (v in defs[b]) return defs[b][v];
  const ps = preds[b];
  if (ps.length === 0) return 'undef';
  if (ps.length === 1)
    return readVar(
      v, ps[0], preds, defs);
  const vals = ps.map((p) =>
    readVar(v, p, preds, defs));
  return 'phi(' + vals.join(',') + ')';
}`,
        why: 'This always makes a phi at a join, even when both sides give 5. That is exactly the trivial phi the builder removes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'After renaming `x = 1; x = x + 1; y = x;` into SSA, what does `y` read?',
    options: [
      {
        t: '`x1`',
        why: '`x1` is the first value. The second line made a newer version, and `y` reads the latest.',
      },
      {
        t: '`x2`',
        correct: true,
        why: 'Line 2 defines `x2 = x1 + 1`, and line 3 reads the latest version, `x2`.',
      },
      {
        t: '`x`',
        why: 'In SSA every use names one specific version. A bare `x` would leave the question "which one?" open.',
      },
      {
        t: 'A phi of `x1` and `x2`',
        why: 'There is only one path through straight-line code, so no phi is needed.',
      },
    ],
  },
  {
    q: 'What does the "static" in static single assignment mean?',
    options: [
      {
        t: 'Each variable is assigned at most once while the program runs.',
        why: 'An assignment in a loop runs many times. SSA only limits how many places in the text assign it.',
      },
      {
        t: 'The variables are allocated statically, not on the stack.',
        why: 'SSA says nothing about where values are stored.',
      },
      {
        t: 'Each variable is assigned in exactly one place in the program text.',
        correct: true,
        why: 'That is the rule: one definition site per name, however often it executes.',
      },
    ],
  },
  {
    q: 'Which JavaScript local does VIR keep as a binding, with `load` and `store`, instead of SSA values?',
    options: [
      {
        t: 'A `let` counter used only in its own loop',
        why: 'That is the easy case: it becomes SSA values with a phi in the loop header.',
      },
      {
        t: 'A parameter that is reassigned in an `if`',
        why: 'Reassignment is fine in SSA. The phi at the join handles it.',
      },
      {
        t: 'A `const` holding a number',
        why: 'A constant local is the easiest SSA value of all: one definition.',
      },
      {
        t: 'A local that an inner function captures and changes',
        correct: true,
        why: 'Another function can change it whenever it is called, and this function’s CFG can’t see when that happens.',
      },
    ],
  },
  {
    q: 'In SSA, the program does `p.x = 1; p.x = 2;`. How many versions of `p.x` does VIR make?',
    options: [
      {
        t: 'Two, `x1` and `x2`',
        why: 'Fields are not renamed: another variable could hold the same object, so VIR keeps two `field.set` instructions.',
      },
      {
        t: 'None: SSA renames plain local variables, and these stay two `field.set` instructions',
        correct: true,
        why: 'Only locals get versions; memory such as object fields is read and written with instructions.',
      },
      {
        t: 'One, because the first write is dead',
        why: 'Deleting the first write is a later optimisation, not part of SSA.',
      },
    ],
  },
  {
    q: 'Why can an analysis file SSA definitions in a table keyed by name, and trust the table?',
    options: [
      {
        t: 'Because SSA programs have no loops',
        why: 'They have loops; a loop’s values meet in phis.',
      },
      {
        t: 'Because each name is defined in exactly one place, so no entry is ever overwritten',
        correct: true,
        why: 'In the original code a later assignment overwrites the entry for x, and uses get the wrong line.',
      },
      {
        t: 'Because SSA names are numbers',
        why: 'In VIR they are numbers, but the reason is single assignment, not the spelling.',
      },
    ],
  },
  {
    q: 'A join block has three predecessors. How many operands does each of its phis have?',
    options: [
      {
        t: 'Two',
        why: 'Phis are not limited to two. They have one operand per incoming edge.',
      },
      {
        t: 'As many as there are different values',
        why: 'Even if two operands are the same name, there is still one per predecessor, in predecessor order.',
      },
      {
        t: 'One',
        why: 'A phi with one operand would just be a copy. Each edge needs its own operand.',
      },
      {
        t: 'Three',
        correct: true,
        why: 'One operand per predecessor, so the phi knows what to pick for each edge.',
      },
    ],
  },
  {
    q: 'In VIR, `b3` has `; preds b1 b2` and starts with `%4 = phi %2, %3`. Control arrives from `b2`. What is `%4`?',
    options: [
      {
        t: 'The value of `%3`',
        correct: true,
        why: 'Operands follow predecessor order: `b1` gives `%2`, `b2` gives `%3`.',
      },
      {
        t: 'The value of `%2`',
        why: 'That would be the case for control arriving from `b1`, the first predecessor.',
      },
      {
        t: 'Whichever of `%2` and `%3` was computed last',
        why: 'A phi chooses by edge, not by time. Only one of the two branches ran anyway.',
      },
    ],
  },
  {
    q: 'A loop header holds `%3 = phi %2, %10`, but `%10` is defined further down the listing. Is that a bug?',
    options: [
      {
        t: 'Yes: a value must be defined before it is used.',
        why: 'For ordinary uses, yes. A phi operand only has to be available at the end of its predecessor.',
      },
      {
        t: 'No: `%10` arrives along the back edge, so its block has always run by then.',
        correct: true,
        why: 'On the first entry the phi takes `%2`. It only reads `%10` when coming round from the end of the loop body.',
      },
      {
        t: 'No: phis are evaluated after the whole loop finishes.',
        why: 'A header phi is evaluated every time control enters the header.',
      },
    ],
  },
  {
    q: 'A loop header has `p2 = φ(p0, q2)` and `q2 = φ(q0, p2)`, with `p2 = 1` and `q2 = 2`. Control arrives along the back edge (the second operand). What do they hold now?',
    options: [
      {
        t: '`p2 = 2`, `q2 = 2`',
        why: 'That is what you get running the phis one after the other. Phis all read before any of them writes.',
      },
      {
        t: '`p2 = 1`, `q2 = 2`',
        why: 'The phis do pick new values: the second operands, read from before the edge was crossed.',
      },
      {
        t: '`p2 = 2`, `q2 = 1`',
        correct: true,
        why: 'Each takes the old value of the other: a swap.',
      },
      {
        t: '`p2 = 1`, `q2 = 1`',
        why: 'That would be the in-order bug the other way round; neither phi sees the other’s new value.',
      },
    ],
  },
  {
    q: 'What does a compiler do with phis before it emits machine code?',
    options: [
      {
        t: 'Emits a special phi instruction the CPU understands',
        why: 'CPUs have no such instruction; a phi depends on which edge was taken, which the CPU does not track.',
      },
      {
        t: 'Replaces them with copies at the ends of the predecessor blocks, ordered so that “all at once” is kept',
        correct: true,
        why: 'Each predecessor copies the operand that belongs to it into the phi’s destination.',
      },
      {
        t: 'Deletes them, since they compute nothing',
        why: 'They choose a value; deleting them would lose it.',
      },
      {
        t: 'Keeps only the first operand',
        why: 'That would be wrong whenever control arrived from any other predecessor.',
      },
    ],
  },
  {
    q: 'While lowering `x = 2;`, what does VIR’s builder do for the assignment itself?',
    options: [
      {
        t: 'Emits a `store x` instruction',
        why: '`store` is only for bindings (captured variables). An SSA local has no storage to write to.',
      },
      {
        t: 'Records in the current block’s table that `x` is the `const 2`',
        correct: true,
        why: '`writeVariable` only updates the table. The `const 2` is the only instruction.',
      },
      {
        t: 'Creates a phi for `x`',
        why: 'Phis are made by reads at joins, not by writes.',
      },
    ],
  },
  {
    q: 'Why is a loop header unsealed while the builder lowers the loop test?',
    options: [
      {
        t: 'Its only predecessor is the entry block.',
        why: 'If that were all, it could be sealed. The point is that one more predecessor is still coming.',
      },
      {
        t: 'Phis may not be placed in loop headers.',
        why: 'Loop headers are exactly where loop phis go.',
      },
      {
        t: 'The test contains a comparison.',
        why: 'What’s inside the block doesn’t matter. Sealing is about knowing all the incoming edges.',
      },
      {
        t: 'The back edge from the end of the body hasn’t been built yet.',
        correct: true,
        why: 'Until the body is lowered, the header doesn’t know all its predecessors, so reads there make incomplete phis.',
      },
    ],
  },
  {
    q: 'What does `seal(b)` do with b’s incomplete phis?',
    options: [
      {
        t: 'Reads the variable at the end of each predecessor to fill in the operands, then tries to remove the phi as trivial',
        correct: true,
        why: 'That is `addPhiOperands`: one read per predecessor, then `tryRemoveTrivialPhi`.',
      },
      {
        t: 'Deletes them, since the block is finished',
        why: 'Many of them are needed: the loop counter’s phi survives sealing.',
      },
      {
        t: 'Turns them into `const undefined`',
        why: 'Only a phi with no operand except itself becomes `undefined`.',
      },
    ],
  },
  {
    q: 'Which of these phis is trivial?',
    options: [
      {
        t: '`%3 = φ(%2, %10)`',
        why: 'Two different values: this is a real merge (a loop counter).',
      },
      {
        t: '`%6 = φ(%1, %7)`',
        why: 'Also a real merge: the starting sum and the updated sum.',
      },
      {
        t: '`%4 = φ(%0, %4)`',
        correct: true,
        why: 'Apart from itself it only ever has `%0`, so it always means `%0`.',
      },
      {
        t: 'None: a phi with two operands is never trivial',
        why: 'The number of operands doesn’t matter. What counts is how many distinct values besides the phi itself.',
      },
    ],
  },
  {
    q: 'How does placing phis at dominance frontiers (Building SSA) differ from Braun’s method?',
    options: [
      {
        t: 'It produces programs that are not in SSA form.',
        why: 'Both produce SSA. They differ in how they get there.',
      },
      {
        t: 'It never places phis in loop headers.',
        why: 'Loop headers are in the dominance frontier of blocks in the loop body, so they get phis.',
      },
      {
        t: 'It needs no dominator tree.',
        why: 'It is the one that does: the frontiers come from dominators.',
      },
      {
        t: 'It works on a finished CFG, placing phis from the dominator tree, then renames in a second walk.',
        correct: true,
        why: 'Braun’s method works while the IR is still being generated, with no dominator tree.',
      },
    ],
  },
];
