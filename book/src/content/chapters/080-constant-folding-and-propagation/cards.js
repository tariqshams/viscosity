// Chapter 80 cards. Keys are stable ids: never rename them.

export const prompts = {
  'fold-what': {
    q: 'What is **constant folding**?',
    a: 'Computing an operation whose operands are all constants at compile time, and replacing it with the result.',
  },
  'fold-exact': {
    q: 'A compiler folds `0.1 + 0.2` to `0.3`. What went wrong?',
    a: 'It changed the program: at run time, 64-bit float addition gives 0.30000000000000004.',
  },
  'fold-never': {
    q: 'Name two kinds of operation a folder must not fold, even with constant operands.',
    a: 'Ones with side effects (like a call that prints) and ones that can throw.',
  },
  'prop-what': {
    q: 'What is **constant propagation**?',
    a: 'Replacing the uses of a value known to be constant with the constant itself.',
  },
  'ssa-helps': {
    q: 'Why is propagation easy in SSA?',
    a: 'A value is defined once, so if its definition is a constant, every use of it is that constant.',
  },
  'feed': {
    q: 'How do folding and propagation help each other?',
    a: 'Propagation gives instructions constant operands, so they can be folded, which makes new constants to propagate.',
  },
  'top-what': {
    q: 'In the constant lattice, what does ⊤ mean?',
    a: '"No information yet": the value hasn’t been worked out (or its block hasn’t been reached).',
  },
  'meet-rule': {
    q: 'Merge the constant 2 with the constant 3. Then merge 2 with ⊤.',
    a: '2 with 3 gives ⊥ (varies). 2 with ⊤ gives 2.',
  },
  'counter': {
    q: 'What does constant propagation conclude about a loop counter `i = φ(0, i + 1)`?',
    a: '⊥: the first round gives 0, then the back edge brings 1, and 0 merged with 1 varies.',
  },
  'sccp-edges': {
    q: 'What second kind of fact does SCCP track?',
    a: 'Which CFG edges (and so which blocks) are executable.',
  },
  'sccp-phi': {
    q: 'At a phi, which operands does SCCP merge?',
    a: 'Only those arriving along edges proven executable. The others are ignored.',
  },
};

export const examples = {
  corners: {
    title: 'Answers a folder must copy exactly',
    code: `console.log('1' + 2);
console.log(1 / 0);
console.log(0.1 + 0.2);
console.log(Object.is(0 * -1, -0));
console.log(2 ** 53 + 1);`,
  },
};

const F_HEAD = `// insts: [{ id, op, args, value }]
// op: 'const' | 'param' | 'add'
//   | 'sub' | 'mul'; args are ids
//   of earlier instructions.
const OPS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
};
function fold(insts) {`;

const F_SOL = `${F_HEAD}
  const k = {};
  return insts.map((i) => {
    if (i.op === 'const') {
      k[i.id] = i.value;
      return i;
    }
    const f = OPS[i.op];
    const known = i.args.every(
      (a) => a in k);
    if (!f || !known) return i;
    const v = f(...i.args.map(
      (a) => k[a]));
    k[i.id] = v;
    return { id: i.id, op: 'const',
      value: v };
  });
}`;

const M_HEAD = `const TOP = 'top';
const BOT = 'varies';
// a, b: TOP, BOT, or a constant.
function meet(a, b) {`;

export const exercises = {
  fold: {
    title: 'Fold and propagate',
    prompt: `Write \`fold(insts)\` for straight-line SSA code. Each instruction has an \`id\` and an \`op\`: \`'const'\` (with a \`value\`), \`'param'\` (unknown), or one of \`'add'\`, \`'sub'\`, \`'mul'\` with two \`args\`, the ids of earlier instructions.

Return a new list, in the same order. Any arithmetic instruction whose args are all known constants, either a \`'const'\` or something you have already folded, becomes \`{ id, op: 'const', value }\` with the result. Everything else is returned unchanged. Use \`OPS\` to compute.`,
    starter: `${F_HEAD}
  return insts;
}`,
    solution: F_SOL,
    tests: `const C = (id, value) =>
  ({ id, op: 'const', value });
const B = (id, op, a, b) =>
  ({ id, op, args: [a, b] });
const P = (id) =>
  ({ id, op: 'param', args: [] });
test('one fold', () => {
  expect(fold([C(1, 60),
    B(2, 'mul', 1, 1)])[1])
    .toEqual(C(2, 3600));
});
test('folds feed folds', () => {
  const out = fold([C(1, 60),
    B(2, 'mul', 1, 1), C(3, 24),
    B(4, 'mul', 2, 3)]);
  expect(out[3]).toEqual(C(4, 86400));
});
test('unknowns stay', () => {
  const out = fold([P(1), C(2, 1),
    B(3, 'add', 1, 2), C(4, 5),
    B(5, 'sub', 4, 2),
    B(6, 'mul', 3, 5)]);
  expect(out[2]).toEqual(
    B(3, 'add', 1, 2));
  expect(out[4]).toEqual(C(5, 4));
  expect(out[5]).toEqual(
    B(6, 'mul', 3, 5));
});
test('same length and order', () => {
  const out = fold([C(1, 2), P(2)]);
  expect(out.map((i) => i.id))
    .toEqual([1, 2]);
});`,
    hints: [
      'Walk the list once, keeping an object `k` from id to known constant value.',
      'A `const` goes into `k` as it is. An arithmetic instruction can be folded if every arg is in `k`.',
      'When you fold one, put its result into `k` too: that is propagation, and it lets later instructions fold.',
    ],
    walkthrough: `One pass is enough here because the code is straight-line SSA: every arg is defined earlier in the list, so by the time you reach an instruction, all you will ever know about its args is already in \`k\`.

- **Folding** is the \`OPS[i.op](...)\` call: do the arithmetic now.
- **Propagation** is \`k[i.id] = v\`: the folded result becomes a known constant that later instructions can use. Without it, \`%4 = %2 * %3\` can't fold, because \`%2\` *was* a \`mul\` in the original list.
- **Unknowns** stop the chain. \`%3 = param + 1\` stays as it is, and so does anything using \`%3\`. But \`%5 = 5 - 1\` still folds.

\`\`\`js
const f = OPS[i.op];
const known = i.args.every(
  (a) => a in k);
if (!f || !known) return i;
const v = f(...i.args.map(
  (a) => k[a]));
k[i.id] = v;
return { id: i.id, op: 'const',
  value: v };
\`\`\`

With loops and phis, one pass is no longer enough. You'd need the lattice from the chapter and a worklist, as in SCCP.`,
    wrong: [
      {
        code: `${F_HEAD}
  const isC = {};
  for (const i of insts) {
    if (i.op === 'const')
      isC[i.id] = i.value;
  }
  return insts.map((i) => {
    const f = OPS[i.op];
    if (!f) return i;
    if (!i.args.every((a) => a in isC))
      return i;
    const v = f(...i.args.map(
      (a) => isC[a]));
    return { id: i.id, op: 'const',
      value: v };
  });
}`,
        why: 'This folds, but never propagates: a folded result isn’t recorded as a constant, so `%4 = %2 * %3` stays unfolded.',
      },
    ],
  },
  meet: {
    optional: true,
    title: 'The constant lattice',
    prompt: `Write \`meet(a, b)\` for the three-level constant lattice. \`TOP\` means "no information yet", \`BOT\` means "varies", and anything else is a constant. Merging \`TOP\` with \`x\` gives \`x\`; \`BOT\` with anything gives \`BOT\`; two constants give that constant if they are the **same value** in JavaScript's strictest sense (so \`0\` and \`-0\` differ), and \`BOT\` otherwise.`,
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
test('top is neutral', () => {
  expect(meet(TOP, 4)).toBe(4);
  expect(meet(4, TOP)).toBe(4);
  expect(meet(TOP, TOP)).toBe(TOP);
});
test('equal constants', () => {
  expect(phi(2, 2, 2)).toBe(2);
});
test('different constants', () => {
  expect(phi(2, 3)).toBe(BOT);
});
test('bottom wins', () => {
  expect(meet(BOT, 2)).toBe(BOT);
  expect(phi(2, TOP, BOT)).toBe(BOT);
});
test('0 and -0 differ', () => {
  expect(meet(0, -0)).toBe(BOT);
});
test('NaN equals NaN here', () => {
  expect(meet(NaN, NaN)).toBe(NaN);
});`,
    hints: [
      'Handle `TOP` first: it gives way to the other side.',
      'Then `BOT`. Only after that compare two real constants.',
      'Use `Object.is`, not `===`: it says `0` and `-0` differ and `NaN` equals `NaN`.',
    ],
    walkthrough: `The order of the checks is the lattice, read from top to bottom.

- **⊤ gives way.** A value nobody has computed yet shouldn't spoil a merge. That is the optimism that lets a loop phi \`φ(7, itself)\` stay 7 on the first round.
- **⊥ wins.** Once one operand varies, so does the phi.
- **Same constant.** \`===\` is the wrong test. \`0 === -0\` is true, but \`1 / 0\` and \`1 / -0\` differ, so merging them into one "0" would change a program. And \`NaN === NaN\` is false, which would turn a phi of two NaNs into ⊥ for no reason. \`Object.is\` gets both right.

\`\`\`js
if (a === TOP) return b;
if (b === TOP) return a;
if (a === BOT || b === BOT) {
  return BOT;
}
return Object.is(a, b) ? a : BOT;
\`\`\``,
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
        why: 'With `===`, `0` and `-0` look equal, though `1 / 0` and `1 / -0` differ; and `NaN` never equals itself.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these may a JavaScript compiler fold to a constant?',
    options: [
      { t: '`console.log(2 + 3)` into `5`', why: 'The `2 + 3` can be folded, but the call prints: a side effect that must stay.' },
      { t: '`0.1 + 0.2` into `0.3`', why: 'At run time the answer is 0.30000000000000004. Folding must give exactly that.' },
      { t: '`\'1\' + 2` into `\'12\'`', correct: true, why: 'Both operands are constants and string concatenation has no side effects, so the result `\'12\'` is exactly what the program would compute.' },
      { t: '`1 / 0` into an error', why: 'In JavaScript `1 / 0` is `Infinity`, not an error. A folder must keep that.' },
    ],
  },
  {
    q: 'In SSA, `%2 = const 3600`. Why can every use of `%2` be replaced by 3600 without further checks?',
    options: [
      { t: 'Constants are always stored in registers.', why: 'Where values live is irrelevant here.' },
      { t: '`%2` is defined exactly once, so no other assignment can reach any use.', correct: true, why: 'That is SSA’s promise. Without it, you would need reaching definitions first.' },
      { t: 'The optimizer runs before the program has any branches.', why: 'Branches are in the IR from the start. SSA is what makes this safe even with them.' },
    ],
  },
  {
    q: 'In the three-level constant lattice, what is `merge(⊤, 5)`?',
    options: [
      { t: '⊤', why: '⊤ means "no information yet", so it gives way to real information.' },
      { t: '⊥', why: 'Nothing contradicts 5 yet, so there’s no reason to give up.' },
      { t: '5', correct: true, why: 'Merging ⊤ with anything gives the other side. That is what lets loops keep constants.' },
    ],
  },
  {
    q: '`x = 1; if (x > 0) y = 2; else y = 3; z = y * 10;` What does plain constant propagation (without edge tracking) conclude about `z`?',
    options: [
      { t: '`z` is 20.', why: 'That needs SCCP: plain propagation still counts the else edge.' },
      { t: '`z` is 30.', why: 'Nothing would pick the else branch’s value alone.' },
      { t: '`z` is not a constant.', correct: true, why: 'It merges 2 and 3 at the phi, gets ⊥, and so `y * 10` varies too, even though the else branch can never run.' },
      { t: 'It can’t run on this code because of the `if`.', why: 'It runs fine. The `if` just limits what it can prove.' },
    ],
  },
  {
    q: 'What makes SCCP find more constants than plain propagation?',
    options: [
      { t: 'It assumes blocks are unreachable until an executable edge reaches them, and phis ignore operands on other edges.', correct: true, why: 'A branch on a constant marks only one edge, so values from the dead side never get merged.' },
      { t: 'It runs the program once to see which branches are taken.', why: 'SCCP is a static analysis. It never runs the program.' },
      { t: 'It uses a taller lattice with ranges of numbers.', why: 'SCCP uses the same three-level lattice. The gain comes from tracking executable edges.' },
    ],
  },
  {
    q: 'What does Viscosity share with SCCP?',
    options: [
      { t: 'A constant folding pass that rewrites arithmetic in your code', why: 'Viscosity has no constant folding pass. It changes data layouts, not arithmetic.' },
      { t: 'Tracking which CFG edges are executable', why: 'Viscosity’s numeric inference doesn’t track edges.' },
      { t: 'The three-level constant lattice', why: 'Its lattice has two levels: number and maybe-not.' },
      { t: 'An optimistic fixpoint over SSA values', correct: true, why: 'Its numeric inference starts optimistic and iterates until nothing changes, the same machinery on a different lattice.' },
    ],
  },
];
