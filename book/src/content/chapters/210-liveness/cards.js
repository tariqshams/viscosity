// Chapter 93 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'liveness-what': {
    q: 'When is a variable **live** at a point in the program?',
    a: 'When some path from that point reads it before it is overwritten.',
  },
  'dead-store': {
    q: 'In `x = 1; x = 2; y = x + 1; print y`, which line is a dead store, and why?',
    a: '`x = 1`: `x` is overwritten by `x = 2` before anything reads it, so it is not live after the first store.',
  },
  'order-matters': {
    q: 'Walking backwards over `x = x + 1`, why do you remove `x` from the live set *before* adding the uses?',
    a: 'So that `x` ends up live above the line: the line overwrites `x`, but it also reads the old value to compute the new one.',
  },
  'liveness-backward': {
    q: 'Which way do liveness facts flow along the CFG?',
    a: 'Backwards: from a block’s successors to the block, against the direction of the edges.',
  },
  'union-why': {
    q: 'Why does liveness merge successors by union rather than intersection?',
    a: 'A variable read on any one path is needed; deleting its store would break that path.',
  },
  'loop-round': {
    q: 'In the sum loop, why is `n` not yet live at the end of the body after the first round?',
    a: 'The body was worked out before the header, which reads `n`; the second round carries `n` round the back edge.',
  },
  'ssa-easier': {
    q: 'Why did DCE on SSA not need liveness?',
    a: 'Each value has one definition, so it is needed exactly when a live instruction uses it; there is no overwriting to reason about.',
  },
  'phi-use': {
    q: 'In `%3 = phi %2, %14`, where in the program is `%14` used, for liveness?',
    a: 'At the end of the predecessor that %14 arrives from (the loop body), not in the phi’s own block.',
  },
};

export const examples = {
  backwards: {
    title: 'Live sets, from the bottom up',
    code: `// [def, uses] for each line
const code = [
  ['x', []],     // x = 1
  ['x', []],     // x = 2
  ['y', ['x']],  // y = x + 1
  [null, ['y']], // print y
];
let live = new Set();
for (let k = code.length - 1;
  k >= 0; k--) {
  const [def, uses] = code[k];
  const dead = def && !live.has(def);
  console.log(k, [...live],
    dead ? 'dead store' : '');
  live.delete(def);
  for (const u of uses) live.add(u);
}`,
  },
};

export const exercises = {
  liveness: {
    title: 'Liveness on a control-flow graph',
    prompt: `Write \`liveness(blocks)\`. Each block is \`{ succ, use, def }\`: \`succ\` lists its successor block numbers, \`use\` the variables it reads before writing them, and \`def\` the variables it writes (all arrays). Return \`{ in, out }\`, two arrays with one entry per block: the variables live on entry to and on exit from that block, each as a **sorted** array.

Use the equations from the chapter: \`out(b)\` is the union of \`in(s)\` over the successors \`s\`, and \`in(b)\` is \`use(b)\` plus the variables of \`out(b)\` that are not in \`def(b)\`. Start every set empty and repeat rounds (visiting blocks from last to first) until a round changes nothing.`,
    starter: `// blocks[b] = { succ, use, def }:
// succ lists b's successors; use is
// what b reads before writing it;
// def is what b writes.
function liveness(blocks) {
  const e = blocks.map(() => []);
  return { in: e, out: e };
}`,
    solution: `// blocks[b] = { succ, use, def }:
// succ lists b's successors; use is
// what b reads before writing it;
// def is what b writes.
function liveness(blocks) {
  const n = blocks.length;
  const empty = () => new Set();
  let ins = blocks.map(empty);
  let outs = blocks.map(empty);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, def } =
        blocks[b];
      const out = new Set();
      for (const s of succ) {
        for (const v of ins[s]) {
          out.add(v);
        }
      }
      const inn = new Set(use);
      for (const v of out) {
        if (!def.includes(v)) {
          inn.add(v);
        }
      }
      if (inn.size !== ins[b].size) {
        changed = true;
      }
      ins[b] = inn;
      outs[b] = out;
    }
  }
  const sorted = (s) => [...s].sort();
  return { in: ins.map(sorted),
    out: outs.map(sorted) };
}`,
    tests: `const B = (succ, use, def) =>
  ({ succ, use, def });
test('straight line', () => {
  const r = liveness([
    B([1], ['p'], ['a']),
    B([], ['a'], [])]);
  expect(r.in).toEqual([['p'], ['a']]);
  expect(r.out).toEqual([['a'], []]);
});
test('a branch merges by union', () => {
  const r = liveness([
    B([1, 2], ['c', 'p'], ['t']),
    B([], ['t'], []),
    B([], [], [])]);
  expect(r.out[0]).toEqual(['t']);
  expect(r.in[0]).toEqual(['c', 'p']);
});
test('the sum loop', () => {
  const r = liveness([
    B([1], [], ['i', 's']),
    B([2, 3], ['i', 'n'], ['t']),
    B([1], ['i', 's'], ['i', 's']),
    B([], ['s'], [])]);
  expect(r.in).toEqual([['n'],
    ['i', 'n', 's'], ['i', 'n', 's'],
    ['s']]);
  expect(r.out).toEqual([
    ['i', 'n', 's'], ['i', 'n', 's'],
    ['i', 'n', 's'], []]);
});
test('a value read only after a loop', () => {
  const r = liveness([
    B([1], [], ['k']),
    B([1, 2], ['c'], []),
    B([], ['k'], [])]);
  expect(r.in[1]).toEqual(['c', 'k']);
  expect(r.out[1]).toEqual(['c', 'k']);
});`,
    hints: [
      'Keep two arrays of `Set`s, `ins` and `outs`, one per block, all empty to begin with. Wrap the work in `let changed = true; while (changed) { changed = false; ... }`.',
      'For block `b`: build `out` by adding every variable of `ins[s]` for each successor `s`. Then `inn` starts as `new Set(use)`, and every variable of `out` that is not in `def` is added to it.',
      'Sets only ever grow here, so you can tell whether `in(b)` changed by comparing sizes. Visit `b` from `blocks.length - 1` down to `0`. At the end, turn each set into a sorted array with `[...s].sort()`.',
    ],
    walkthrough: `**How to think about it.** The two equations already say how to compute one block, if you know its successors' \`in\` sets. The difficulty is the loop: the header's \`in\` depends on the body's, and the body's on the header's. The dataflow way out is to start from a guess that can only be too small (every set empty, "nothing is live"), apply the equations to every block, and repeat. Each round can only add variables (a union of bigger sets is bigger; subtracting the same \`def\` keeps that true), there are only so many variables, so the sets stop growing, and when a whole round adds nothing, the equations hold everywhere: that is the fixpoint. Visiting blocks from last to first is not needed for the right answer, but liveness flows backwards, so it usually needs fewer rounds.

**The solution, line by line.**

- \`const n = blocks.length;\` the number of blocks.
- \`let ins = blocks.map(() => new Set());\` and \`let outs = ...\` give every block an empty \`in\` and \`out\` set: the starting guess.
- \`let changed = true; while (changed) { changed = false;\` repeats rounds until one changes nothing.
- \`for (let b = n - 1; b >= 0; b--) {\` visits the blocks from last to first.
- \`const { succ, use, def } = blocks[b];\` unpacks the block.
- \`const out = new Set(); for (const s of succ) { for (const v of ins[s]) out.add(v); }\` is the second equation: everything live on entry to *any* successor is live on exit from \`b\`. A block with no successors gets an empty \`out\`, as the equations say.
- \`const inn = new Set(use);\` starts \`in(b)\` with what the block reads before writing.
- \`for (const v of out) { if (!def.includes(v)) inn.add(v); }\` adds whatever is live afterwards and not overwritten here: the first equation, \`use ∪ (out − def)\`. (The name \`inn\` avoids \`in\`, which is a JavaScript keyword.)
- \`if (inn.size !== ins[b].size) { changed = true; }\` notices a change; because sets only grow, a change in contents always shows as a change in size.
- \`ins[b] = inn; outs[b] = out;\` stores the new sets.
- \`const sorted = (s) => [...s].sort();\` and the \`return\` turn the sets into sorted arrays, as the tests expect.

On the sum loop, round one visits b3 (\`in = {s}\`), b2 (its successor b1 is still empty, so \`in = {i, s}\`), b1 (\`out = {i, s} ∪ {s}\`, \`in = {i, n, s}\`) and b0 (\`in = {n}\`). Round two finds b2's successor b1 now holds \`n\`, so b2's \`in\` grows to \`{i, n, s}\`; round three changes nothing.

**Common wrong attempts.**

- Doing a single round: right for code without loops, but in the sum loop \`n\` never reaches the body.
- Merging successors by intersection: in the branch test, \`t\` is read on only one path, so intersection says it is dead on exit from block 0, and a dead store pass would delete the line that computes it.
- Computing \`in\` as \`(use ∪ out) − def\`: a block that reads and then writes a variable (\`i = i + 1\`) would lose it from its \`in\` set, though it reads the old value.`,
    wrong: [
      {
        code: `// blocks[b] = { succ, use, def }:
// succ lists b's successors; use is
// what b reads before writing it;
// def is what b writes.
function liveness(blocks) {
  const n = blocks.length;
  const empty = () => new Set();
  let ins = blocks.map(empty);
  let outs = blocks.map(empty);
  let changed = true;
  {
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, def } =
        blocks[b];
      const out = new Set();
      for (const s of succ) {
        for (const v of ins[s]) {
          out.add(v);
        }
      }
      const inn = new Set(use);
      for (const v of out) {
        if (!def.includes(v)) {
          inn.add(v);
        }
      }
      if (inn.size !== ins[b].size) {
        changed = true;
      }
      ins[b] = inn;
      outs[b] = out;
    }
  }
  const sorted = (s) => [...s].sort();
  return { in: ins.map(sorted),
    out: outs.map(sorted) };
}`,
        why: 'One round is not enough with a loop: in the sum loop, the body is worked out before the header has learned that it reads `n`, so `n` is missing from the body’s sets.',
      },
      {
        code: `// blocks[b] = { succ, use, def }:
// succ lists b's successors; use is
// what b reads before writing it;
// def is what b writes.
function liveness(blocks) {
  const n = blocks.length;
  const empty = () => new Set();
  let ins = blocks.map(empty);
  let outs = blocks.map(empty);
  let changed = true;
  while (changed) {
    changed = false;
    for (let b = n - 1; b >= 0; b--) {
      const { succ, use, def } =
        blocks[b];
      const first = succ.length
        ? ins[succ[0]] : [];
      const out = new Set(first);
      for (const v of [...out]) {
        const all = succ.every(
          (s) => ins[s].has(v));
        if (!all) out.delete(v);
      }
      const inn = new Set(use);
      for (const v of out) {
        if (!def.includes(v)) {
          inn.add(v);
        }
      }
      if (inn.size !== ins[b].size) {
        changed = true;
      }
      ins[b] = inn;
      outs[b] = out;
    }
  }
  const sorted = (s) => [...s].sort();
  return { in: ins.map(sorted),
    out: outs.map(sorted) };
}`,
        why: 'This is the intersection of the successors: a variable read on only one path is called dead. In the branch test, `t` disappears from `out(0)`.',
      },
    ],
  },
  deadStores: {
    optional: true,
    title: 'Find dead stores in straight-line code',
    prompt: 'Straight-line code with ordinary variables: each instruction is `{ def, uses, effect }`, where `def` is the variable it assigns (or `null`), `uses` the variables it reads, and `effect` is `true` for things like `print`. Write `deadStores(code)` returning the indexes (ascending) of instructions that assign a variable which is not live afterwards and have no effect. Treat a dead instruction’s reads as not happening.',
    starter: `// code[k] = { def, uses, effect }
function deadStores(code) {
  // your code here
  return [];
}`,
    solution: `// code[k] = { def, uses, effect }
function deadStores(code) {
  const live = new Set();
  const dead = [];
  const n = code.length;
  for (let k = n - 1; k >= 0; k--) {
    const ins = code[k];
    if (ins.def && !ins.effect &&
        !live.has(ins.def)) {
      dead.push(k);
      continue;
    }
    if (ins.def) live.delete(ins.def);
    for (const u of ins.uses) {
      live.add(u);
    }
  }
  return dead.reverse();
}`,
    tests: `const S = (def, uses = []) =>
  ({ def, uses, effect: false });
const P = (...uses) =>
  ({ def: null, uses, effect: true });
test('an overwritten store is dead', () => {
  expect(deadStores([S('x'), S('x'),
    S('y', ['x']), P('y')])).toEqual([0]);
});
test('a dead chain is found in one walk', () => {
  expect(deadStores([S('t', ['a']),
    S('u', ['t']), P('a')])).toEqual([0, 1]);
});
test('a store after the last read', () => {
  expect(deadStores([S('x'), P('x'),
    S('x')])).toEqual([2]);
});
test('effects are never dead', () => {
  expect(deadStores([{ def: 'x',
    uses: [], effect: true }])).toEqual([]);
});
test('x = x + 1 keeps x live', () => {
  expect(deadStores([S('x'),
    S('x', ['x']), P('x')])).toEqual([]);
});`,
    hints: [
      'Walk from the last instruction to the first, keeping a `Set` of the variables that will be read later. At the very end nothing is live.',
      'An instruction is dead if it has a `def`, no effect, and its `def` is not in the live set. Record its index and skip the rest of it: its reads never happen.',
      'For a live instruction, first `delete` its `def` from the set, then `add` its `uses`. Collect dead indexes as you go and `reverse()` them at the end, since you walked backwards.',
    ],
    walkthrough: `**How to think about it.** This is the backward walk from the chapter's figure, written as code. Liveness is about the future, so we go from the end, carrying the set of variables that something below will read. A store is dead exactly when the variable it writes is not in that set, and it has no effect of its own.

**The solution, line by line.**

- \`const live = new Set();\` the variables some later instruction will read; empty at the end of the code.
- \`const dead = [];\` the indexes we find, in the order we find them (last first).
- \`for (let k = n - 1; k >= 0; k--) {\` walks backwards.
- \`if (ins.def && !ins.effect && !live.has(ins.def)) { dead.push(k); continue; }\` a store with no effect to a variable nobody will read: dead. The \`continue\` skips adding its \`uses\`, because once it is deleted its reads never happen; that is what lets one walk catch the chain \`t = a; u = t\`, where \`u\` is dead, so \`t\` is never read, so \`t = a\` is dead too.
- \`if (ins.def) live.delete(ins.def);\` above this line, the old value of the variable it writes is not needed (it is about to be overwritten).
- \`for (const u of ins.uses) { live.add(u); }\` above this line, everything it reads is needed. Deleting before adding is what keeps \`x\` live for \`x = x + 1\`.
- \`return dead.reverse();\` the indexes in ascending order.

**Common wrong attempts.**

- Asking "is the variable read anywhere?" instead of "is it read after this point, before being overwritten?": in \`x = 1; x = 2; y = x\` the first store survives, because \`x\` is read somewhere.
- Adding the uses before deleting the def: \`x = x + 1\` then removes \`x\` from the live set, and the store above it is wrongly called dead.`,
    wrong: [
      {
        code: `// code[k] = { def, uses, effect }
function deadStores(code) {
  const read = new Set();
  for (const ins of code) {
    for (const u of ins.uses) {
      read.add(u);
    }
  }
  const dead = [];
  code.forEach((ins, k) => {
    if (ins.def && !ins.effect &&
        !read.has(ins.def)) {
      dead.push(k);
    }
  });
  return dead;
}`,
        why: 'This asks whether the variable is ever read *anywhere*, not after this point. In `x = 1; x = 2; y = x` it keeps the first store.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Walking backwards over `a = b + c` with `{a, d}` live after it, what is live before it?',
    options: [
      {
        t: '`{a, b, c, d}`',
        why: '`a` is overwritten by this line, so its old value is not needed above it.',
      },
      {
        t: '`{b, c, d}`',
        correct: true,
        why: 'Remove the def `a`, then add the uses `b` and `c`; `d` passes through untouched.',
      },
      {
        t: '`{b, c}`',
        why: '`d` is live after the line and this line does not write it, so it is live before it too.',
      },
    ],
  },
  {
    q: 'How is liveness merged at a branch where one successor reads `x` and the other does not?',
    options: [
      {
        t: '`x` is dead at the end of the block, since one path doesn’t read it',
        why: 'That would be intersection; deleting the store would break the path that reads it.',
      },
      {
        t: 'It depends on which successor is listed first',
        why: 'The merge is a set union, which does not care about order.',
      },
      {
        t: '`x` is live at the end of the block',
        correct: true,
        why: 'Liveness merges by union: one path that may read `x` before overwriting it is enough.',
      },
    ],
  },
  {
    q: 'Why does liveness on a loop need more than one round?',
    options: [
      {
        t: 'Because the body’s sets depend on the header’s and the header’s on the body’s, round the back edge',
        correct: true,
        why: 'Whatever order you pick, some block is computed before a block it depends on; later rounds carry the facts round the cycle.',
      },
      {
        t: 'Because sets can shrink and must be checked again',
        why: 'Starting from empty sets, liveness sets only grow.',
      },
      {
        t: 'Because the loop might run many times',
        why: 'The analysis never runs the program; the number of iterations is irrelevant.',
      },
    ],
  },
  {
    q: 'In `%3 = phi %2, %14`, where `%2` comes from the entry and `%14` from the loop body, where is `%14` used?',
    options: [
      {
        t: 'At the top of the phi’s block, like any operand',
        why: 'A phi picks its operand according to the edge taken, so each operand is used on its own edge.',
      },
      {
        t: 'Nowhere: phis are not real uses',
        why: 'They are uses; they just happen at the end of the predecessor.',
      },
      {
        t: 'At the end of the loop body, the predecessor it arrives from',
        correct: true,
        why: 'So `%14` is live at the end of the body, and not on the edge from the entry.',
      },
    ],
  },
  {
    q: 'Which of these is a dead store?',
    options: [
      {
        t: '`x = 5` followed by `print x`',
        why: '`x` is read before being overwritten, so it is live.',
      },
      {
        t: '`x = 5` followed by `x = 6` and then `print x`',
        correct: true,
        why: 'The 5 is overwritten before anything reads it.',
      },
      {
        t: '`x = x + 1` followed by `print x`',
        why: 'The new `x` is printed, so the store is live.',
      },
      {
        t: '`print(5)`',
        why: 'It assigns nothing, and it has an effect.',
      },
    ],
  },
  {
    q: 'Why does Viscosity not compute liveness?',
    options: [
      {
        t: 'Its IR is not a CFG',
        why: 'VIR is a CFG of basic blocks in SSA form.',
      },
      {
        t: 'It emits JavaScript, so it never assigns registers; the engine that runs the output does its own',
        correct: true,
        why: 'Register allocation is the main client of liveness, and Viscosity never gets that far down.',
      },
      {
        t: 'Its programs have no loops',
        why: 'Loops over collections are exactly what Viscosity cares about.',
      },
    ],
  },
];
