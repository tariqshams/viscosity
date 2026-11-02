// Chapter 201-b cards (staged split of 187): recall prompts, examples,
// exercises and quiz. Keys are stable ids: renaming one would orphan
// readers' review history.

export const prompts = {
  'prop-what': {
    q: 'What is **constant propagation**?',
    a: 'Finding which values are the same constant on every run, across blocks and through phis, and replacing their uses with that constant.',
  },
  'fold-not-enough': {
    q: 'In `g`, folding turns `x > 0` into `true`. Why can folding alone still not find that `g` returns 20?',
    a: 'The result goes through a phi of 2 and 3, and folding only handles operations on constants; something has to notice that the branch giving 3 never runs.',
  },
  'top-what': {
    q: 'In the constant lattice, what does ⊤ mean, and what does ⊥ mean?',
    a: '⊤: no information yet (not worked out, or its block not reached). ⊥: varies, not a constant.',
  },
  'meet-rule': {
    q: 'Meet 2 with 3. Then meet 2 with ⊤.',
    a: '2 ⊓ 3 = ⊥ (two different constants vary). 2 ⊓ ⊤ = 2 (⊤ gives way).',
  },
  'loop-seven': {
    q: 'A loop header has `%5 = phi %1, %5` with `%1 = const 7`. Why must the analysis start `%5` at ⊤ to prove it is 7?',
    a: 'The phi uses itself. Starting at ⊤, 7 ⊓ ⊤ = 7, which is then consistent. Starting at ⊥, 7 ⊓ ⊥ = ⊥, which is also consistent, but useless.',
  },
  'counter': {
    q: 'What does constant propagation conclude about a loop counter `i = φ(0, i + 1)`?',
    a: '⊥: 0 arrives from the entry, then 1 round the back edge, and 0 ⊓ 1 varies.',
  },
  'sccp-edges': {
    q: 'What second kind of fact does SCCP track, besides a lattice value per SSA value?',
    a: 'Which CFG edges are executable (and so which blocks are reachable).',
  },
  'sccp-phi': {
    q: 'At a phi, which operands does SCCP meet?',
    a: 'Only the ones arriving along edges already proven executable; the others are ignored.',
  },
  'sccp-sparse': {
    q: 'What are SCCP’s two worklists?',
    a: 'CFG edges that just became executable (visit their target block) and SSA values whose fact just changed (revisit their users).',
  },
};

export const examples = {
  merges: {
    title: 'Merging facts at a phi',
    code: `const TOP = '⊤';
const BOT = '⊥';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT)
    return BOT;
  return Object.is(a, b) ? a : BOT;
}
const phi = (...xs) =>
  xs.reduce(meet, TOP);
console.log(phi(2, 2));
console.log(phi(7, TOP));
console.log(phi(0, 1));
console.log(phi(2, TOP, BOT));
console.log(phi(0, -0));`,
  },
};

const S_HEAD = `const TOP = 'top';
const BOT = 'varies';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}
const OPS = {
  '+': (a, b) => a + b,
  '*': (a, b) => a * b,
  '<': (a, b) => a < b,
};
// f.blocks[b] = { preds, insts, term }
// inst: { id, op, args, value }
// term: { kind: 'br', to }
//   | { kind: 'cond', c, t, e }
//   | { kind: 'ret', v }
function sccp(f) {`;

const S_SOL = `${S_HEAD}
  const val = new Map();
  const get = (id) =>
    val.has(id) ? val.get(id) : TOP;
  const live = new Set([0]);
  const exec = new Set();
  let changed = true;
  const mark = (a, b) => {
    const k = a + '>' + b;
    if (exec.has(k)) return;
    exec.add(k);
    live.add(b);
    changed = true;
  };
  const evaluate = (i, b) => {
    if (i.op === 'const')
      return i.value;
    if (i.op === 'param') return BOT;
    if (i.op === 'phi') {
      const ps = f.blocks[b].preds;
      let v = TOP;
      i.args.forEach((a, k) => {
        if (exec.has(ps[k] + '>' + b))
          v = meet(v, get(a));
      });
      return v;
    }
    const [x, y] = i.args.map(get);
    if (x === BOT || y === BOT)
      return BOT;
    if (x === TOP || y === TOP)
      return TOP;
    return OPS[i.op](x, y);
  };
  while (changed) {
    changed = false;
    f.blocks.forEach((blk, b) => {
      if (!live.has(b)) return;
      for (const i of blk.insts) {
        const v = evaluate(i, b);
        if (!Object.is(v, get(i.id))) {
          val.set(i.id, v);
          changed = true;
        }
      }
      const t = blk.term;
      if (t.kind === 'br')
        mark(b, t.to);
      if (t.kind !== 'cond') return;
      const c = get(t.c);
      if (c === true || c === BOT)
        mark(b, t.t);
      if (c === false || c === BOT)
        mark(b, t.e);
    });
  }
  return { val, live };
}
`;

const S_TESTS = `const K = (id, value) =>
  ({ id, op: 'const', args: [], value });
const O = (id, op, ...args) =>
  ({ id, op, args });
const at = (r, id) =>
  r.val.has(id) ? r.val.get(id) : TOP;
const diamond = (cond) => ({ blocks: [
  { preds: [], insts: [K(0, 1), K(2, 0),
    cond], term: { kind: 'cond', c: 3,
    t: 1, e: 2 } },
  { preds: [0], insts: [K(4, 2)],
    term: { kind: 'br', to: 3 } },
  { preds: [0], insts: [K(5, 3)],
    term: { kind: 'br', to: 3 } },
  { preds: [1, 2], insts: [
    O(6, 'phi', 4, 5), K(7, 10),
    O(8, '*', 6, 7)],
    term: { kind: 'ret', v: 8 } },
] });
test('a constant branch: z is 20', () => {
  const r = sccp(diamond(O(3, '<', 2, 0)));
  expect(at(r, 3)).toBe(true);
  expect(at(r, 6)).toBe(2);
  expect(at(r, 8)).toBe(20);
});
test('the dead block is never reached', () => {
  const r = sccp(diamond(O(3, '<', 2, 0)));
  expect(r.live.has(2)).toBe(false);
  expect(at(r, 5)).toBe(TOP);
  expect([...r.live].sort()).toEqual([0, 1, 3]);
});
test('an unknown branch: both sides', () => {
  const r = sccp(diamond(O(3, 'param')));
  expect(at(r, 6)).toBe(BOT);
  expect(at(r, 8)).toBe(BOT);
  expect(r.live.has(2)).toBe(true);
});
const loop = (step) => ({ blocks: [
  { preds: [], insts: [K(0, 7),
    O(1, 'param'), K(9, 1)],
    term: { kind: 'br', to: 1 } },
  { preds: [0, 2], insts: [
    O(2, 'phi', 0, step),
    O(3, '<', 2, 1)],
    term: { kind: 'cond', c: 3,
      t: 2, e: 3 } },
  { preds: [1], insts: [O(4, '+', 2, 9)],
    term: { kind: 'br', to: 1 } },
  { preds: [1], insts: [],
    term: { kind: 'ret', v: 2 } },
] });
test('a loop that never changes x', () => {
  const r = sccp(loop(2));
  expect(at(r, 2)).toBe(7);
});
test('a counter varies', () => {
  const r = sccp(loop(4));
  expect(at(r, 2)).toBe(BOT);
  expect(at(r, 4)).toBe(BOT);
});
`;

const M_HEAD = `const TOP = 'top';
const BOT = 'varies';
// a, b: TOP, BOT, or a constant.
function meet(a, b) {`;

export const exercises = {
  sccp: {
    title: 'Sparse conditional constant propagation',
    prompt: `Write \`sccp(f)\` for a small function in SSA. \`f.blocks\` is a list of blocks; block 0 is the entry. Each block has \`preds\` (its predecessor block numbers), \`insts\` and a terminator \`term\`:

- an instruction is \`{ id, op, args, value }\`, where \`op\` is \`'const'\` (with a \`value\`), \`'param'\` (unknown), \`'phi'\` (its \`args\` line up with the block's \`preds\`: the k-th arg comes from the k-th predecessor), or one of the keys of \`OPS\`;
- \`term\` is \`{ kind: 'br', to }\`, \`{ kind: 'cond', c, t, e }\` (go to block \`t\` if value \`c\` is true, else to \`e\`) or \`{ kind: 'ret', v }\`.

Return \`{ val, live }\`: \`val\` is a \`Map\` from instruction id to its lattice value (a constant or \`BOT\`; ids you never set count as \`TOP\`), and \`live\` is the \`Set\` of reachable blocks. Start optimistic about everything. You may repeat rounds over all reachable blocks until nothing changes (the worklists of the chapter are a faster way to the same answer). \`meet\` and \`OPS\` are given.`,
    starter: `${S_HEAD}
  // your code here
  return { val: new Map(),
    live: new Set([0]) };
}`,
    solution: S_SOL,
    tests: S_TESTS,
    hints: [
      'You need three pieces of state: `val` (id to lattice value), `live` (reachable blocks, starting with block 0) and `exec`, the set of executable edges (a string such as `\'0>1\'` makes a good key). Wrap everything in `while (changed) { changed = false; ... }`.',
      'Write a helper `evaluate(i, b)` for one instruction: a `const` gives its value, a `param` gives `BOT`, an operator gives `BOT` if an operand is `BOT`, `TOP` if an operand is still `TOP`, and otherwise `OPS[i.op](x, y)`.',
      'For a phi in block `b`, start at `TOP` and `meet` in arg `k` only if the edge from `preds[k]` to `b` is in `exec`. For a terminator: `br` marks its edge; `cond` marks the `t` edge when the condition is `true` or `BOT`, and the `e` edge when it is `false` or `BOT`. Marking a new edge adds its target to `live` and sets `changed`.',
    ],
    walkthrough: `**How to think about it.** SCCP keeps two kinds of fact and is optimistic about both: every value starts at ⊤ ("nothing known yet") and every edge starts not executable. Only facts that the code *forces* are added: a constant gets its value, a branch on \`true\` opens its then edge, and so on. Because values only move down the ladder (⊤, then a constant, then ⊥) and edges only ever get opened, never closed, repeating the same rules until a whole round changes nothing must stop, and the place it stops is the most precise consistent answer. The worklists in the chapter are a way to avoid revisiting instructions whose inputs did not change; repeating rounds reaches exactly the same fixpoint, only more slowly, so we use rounds to keep the code short.

**The solution, line by line.**

- \`const val = new Map();\` holds the lattice value of each instruction we have evaluated.
- \`const get = (id) => val.has(id) ? val.get(id) : TOP;\` reads a value, treating anything not yet set as ⊤. This *is* the optimistic start: we never write ⊤ down, we just assume it.
- \`const live = new Set([0]);\` says the entry block is reachable; nothing else is, yet.
- \`const exec = new Set();\` holds the executable edges, as strings like \`'0>1'\`.
- \`let changed = true;\` drives the outer loop.
- \`const mark = (a, b) => { ... }\` opens the edge from block \`a\` to block \`b\`: if it is already open it returns; otherwise it records the edge, makes \`b\` reachable and sets \`changed\`, because a new edge can change a phi in \`b\` or make a whole new block worth visiting.
- \`const evaluate = (i, b) => { ... }\` gives one instruction's value from its operands' current values:
  - \`if (i.op === 'const') return i.value;\` a constant is itself;
  - \`if (i.op === 'param') return BOT;\` a parameter could be anything;
  - for a \`'phi'\`, \`const ps = f.blocks[b].preds;\` fetches the block's predecessors, \`let v = TOP;\` starts the merge, and the \`forEach\` meets in the k-th argument only when the edge \`ps[k] + '>' + b\` is executable; arguments from edges nobody has opened are ignored, which is the heart of SCCP;
  - for an operator, \`const [x, y] = i.args.map(get);\` reads both operands; if either is ⊥ the answer varies, if either is still ⊤ we do not know yet, and otherwise \`OPS[i.op](x, y)\` folds it, exactly as in the last chapter.
- \`while (changed) { changed = false;\` repeats rounds until one changes nothing.
- \`f.blocks.forEach((blk, b) => { if (!live.has(b)) return;\` visits only reachable blocks: an unreachable block's instructions stay at ⊤.
- The inner \`for\` evaluates each instruction and, if its value differs from the stored one (\`Object.is\`, so that \`0\` and \`-0\` count as different and \`NaN\` as equal to itself), stores it and sets \`changed\`.
- \`if (t.kind === 'br') mark(b, t.to);\` an unconditional jump opens its one edge.
- \`const c = get(t.c);\` reads the branch condition. \`if (c === true || c === BOT) mark(b, t.t);\` and \`if (c === false || c === BOT) mark(b, t.e);\` open the edges the condition allows: one for a constant, both when it varies, and neither while it is still ⊤ (a later round will decide).
- \`return { val, live };\` hands back both kinds of fact.

On the diamond, round one: block 0 gives \`%3 = (0 < 1) = true\`, so only edge 0>1 opens; block 1 gives \`%4 = 2\` and opens 1>3; block 3's phi meets only \`%4\` (edge 2>3 is closed), so \`%6 = 2\` and \`%8 = 20\`. Round two changes nothing, and block 2 was never visited. In the loop test, the header phi first meets only \`7\` (the back edge is closed), and when the back edge opens it brings \`%2\` itself, still 7, so it stays 7.

**Common wrong attempts.**

- Meeting every phi argument whether or not its edge is open: on its own this still gives 2 on the diamond, because the dead block is never visited and its \`%5\` stays ⊤, which gives way. Combine it with opening both edges of every \`cond\` (the wrong attempt below, which is plain constant propagation) and the dead block is visited, \`%5\` becomes 3, and \`%6\` falls to ⊥.
- Treating an operand that is still ⊤ as ⊥ ("I don't know, so assume it varies"): that is a pessimistic start, and the loop that never changes \`x\` comes out as ⊥, because its phi meets 7 with its own not-yet-known value.
- Opening both edges of every \`cond\` but keeping the edge check in phis: the dead block becomes reachable, its edge to the join opens, and its 3 spoils the phi just the same.`,
    wrong: [
      {
        code: `${S_HEAD}
  const val = new Map();
  const get = (id) =>
    val.has(id) ? val.get(id) : TOP;
  const live = new Set([0]);
  const exec = new Set();
  let changed = true;
  const mark = (a, b) => {
    const k = a + '>' + b;
    if (exec.has(k)) return;
    exec.add(k);
    live.add(b);
    changed = true;
  };
  const evaluate = (i, b) => {
    if (i.op === 'const')
      return i.value;
    if (i.op === 'param') return BOT;
    if (i.op === 'phi') {
      const ps = f.blocks[b].preds;
      let v = TOP;
      i.args.forEach((a, k) => {
        v = meet(v, get(a));
      });
      return v;
    }
    const [x, y] = i.args.map(get);
    if (x === BOT || y === BOT)
      return BOT;
    if (x === TOP || y === TOP)
      return TOP;
    return OPS[i.op](x, y);
  };
  while (changed) {
    changed = false;
    f.blocks.forEach((blk, b) => {
      if (!live.has(b)) return;
      for (const i of blk.insts) {
        const v = evaluate(i, b);
        if (!Object.is(v, get(i.id))) {
          val.set(i.id, v);
          changed = true;
        }
      }
      const t = blk.term;
      if (t.kind === 'br')
        mark(b, t.to);
      if (t.kind !== 'cond') return;
      const c = get(t.c);
      mark(b, t.t);
      mark(b, t.e);
    });
  }
  return { val, live };
}
`,
        why: 'Every branch opens both edges and every phi meets all its arguments, so the dead `else` block is visited and its 3 meets the 2: `%6` comes out ⊥, not 2. That is plain propagation, not conditional.',
      },
    ],
  },
  meet: {
    optional: true,
    title: 'The constant lattice',
    prompt: `Write \`meet(a, b)\` for the three-level constant lattice. \`TOP\` means "no information yet", \`BOT\` means "varies", and anything else is a constant. Meeting \`TOP\` with \`x\` gives \`x\`; \`BOT\` with anything gives \`BOT\`; two constants give that constant if they are the **same value** in JavaScript's strictest sense (so \`0\` and \`-0\` differ, and \`NaN\` is the same as \`NaN\`), and \`BOT\` otherwise.`,
    starter: `${M_HEAD}
  return a;
}`,
    solution: `${M_HEAD}
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}`,
    tests: `const phi = (...xs) =>
  xs.reduce(meet, TOP);
test('top gives way', () => {
  expect(meet(TOP, 4)).toBe(4);
  expect(meet(4, TOP)).toBe(4);
  expect(meet(TOP, TOP)).toBe(TOP);
});
test('equal constants stay', () => {
  expect(phi(2, 2, 2)).toBe(2);
});
test('different constants vary', () => {
  expect(phi(2, 3)).toBe(BOT);
});
test('bottom wins', () => {
  expect(meet(BOT, 2)).toBe(BOT);
  expect(phi(2, TOP, BOT)).toBe(BOT);
});
test('0 and -0 differ', () => {
  expect(meet(0, -0)).toBe(BOT);
});
test('NaN is the same as NaN', () => {
  expect(meet(NaN, NaN)).toBe(NaN);
});`,
    hints: [
      'Read the lattice from the top: handle `TOP` first, since it gives way to the other side.',
      'Then `BOT`: if either side varies, so does the merge. Only after that compare two real constants.',
      'Compare with `Object.is(a, b)`, not `===`: it says `0` and `-0` differ and that `NaN` is the same as `NaN`.',
    ],
    walkthrough: `**How to think about it.** The order of the checks *is* the lattice, read from top to bottom: first the top, which gives way; then the bottom, which wins; and only when both sides are real constants do you compare them.

**The solution, line by line.**

- \`if (a === TOP) return b;\` a value nobody has worked out yet must not spoil the merge; this is the optimism that lets a loop phi \`φ(7, itself)\` stay 7.
- \`if (b === TOP) return a;\` the same from the other side, so \`meet\` does not care about the order of its arguments.
- \`if (a === BOT || b === BOT) { return BOT; }\` once one side varies, the merge varies.
- \`return Object.is(a, b) ? a : BOT;\` two constants: the same one stays, different ones vary.

**Common wrong attempts.**

- Using \`a === b\` for the last test: \`0 === -0\` is true, yet \`1 / 0\` and \`1 / -0\` differ, so merging the two zeros into one constant would change a program; and \`NaN === NaN\` is false, which would turn a phi of two \`NaN\`s into ⊥ for no reason.
- Checking \`BOT\` before \`TOP\`: it happens to give the same answers here, because \`TOP ⊓ BOT\` is \`BOT\` either way, but reading the lattice from the top keeps the code matching the picture.`,
    wrong: [
      {
        code: `${M_HEAD}
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return a === b ? a : BOT;
}`,
        why: 'With `===`, `0` and `-0` look equal, though `1 / 0` and `1 / -0` differ; and `NaN` never equals itself, so two `NaN`s would vary.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the constant lattice, what is `⊤ ⊓ 5`?',
    options: [
      { t: '⊤', why: '⊤ means "no information yet", so it gives way to real information.' },
      { t: '5', correct: true, why: 'Meeting ⊤ with anything gives the other side; that is what lets loops keep their constants.' },
      { t: '⊥', why: 'Nothing contradicts 5 yet, so there is no reason to give up.' },
    ],
  },
  {
    q: '`x = 1; if (x > 0) y = 2; else y = 3; z = y * 10;` What does **plain** constant propagation (no edge tracking) conclude about `z`?',
    options: [
      { t: '`z` is 20', why: 'That needs SCCP: plain propagation still counts the else edge.' },
      { t: '`z` is not a constant', correct: true, why: 'It meets 2 and 3 at the phi, gets ⊥, and so `y * 10` varies too, even though the else block can never run.' },
      { t: '`z` is 30', why: 'Nothing would pick the else branch’s value on its own.' },
      { t: 'It cannot run on code with an `if`', why: 'It runs fine; the `if` only limits what it can prove.' },
    ],
  },
  {
    q: 'What does SCCP conclude about a loop counter `i = φ(0, i + 1)`?',
    options: [
      { t: '0, because that is the first value', why: 'The back edge brings 1, and 0 ⊓ 1 = ⊥.' },
      { t: '⊤, because the loop might not run', why: 'The header is reachable from the entry, so the phi gets at least 0.' },
      { t: '⊥: it varies', correct: true, why: 'The entry brings 0 and the back edge 1; two different constants meet to ⊥.' },
    ],
  },
  {
    q: 'In SCCP, a `condbr` whose condition is still ⊤ marks which edges executable?',
    options: [
      { t: 'Both', why: 'That is the rule for ⊥. With ⊤ nothing is known yet.' },
      { t: 'Only the then edge', why: 'That is the rule for the constant `true`.' },
      { t: 'Neither, for now', correct: true, why: 'Being optimistic, it waits: a later visit, once the condition has a value, decides.' },
      { t: 'Only the else edge', why: 'That is the rule for the constant `false`.' },
    ],
  },
  {
    q: 'After SCCP finishes, some values are still ⊤. What does that tell you?',
    options: [
      { t: 'They are in blocks that never run', correct: true, why: 'Every value in a reachable block is evaluated at least once, so only values in unreachable blocks keep ⊤.' },
      { t: 'They are constants that could not be computed', why: 'A constant that was computed would hold its value, not ⊤.' },
      { t: 'The analysis did not finish', why: 'It finishes when both worklists are empty, which they are.' },
    ],
  },
  {
    q: 'What does Viscosity’s numeric inference share with SCCP?',
    options: [
      { t: 'Tracking which CFG edges are executable', why: 'It does not track edges, so values from impossible branches still count.' },
      { t: 'The three-level constant lattice', why: 'Its lattice has two levels: number and maybe not.' },
      { t: 'A pass that replaces your arithmetic with constants', why: 'Viscosity rewrites data layouts, not arithmetic.' },
      { t: 'An optimistic fixpoint over SSA values', correct: true, why: 'It starts optimistic and repeats its rules until nothing changes: the same machine on a smaller lattice.' },
    ],
  },
];
