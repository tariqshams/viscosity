// Chapter 201 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fold-what': {
    q: 'What is **constant folding**?',
    a: 'Computing, at compile time, an instruction whose operands are all constants, and replacing it with a `const` holding the result.',
  },
  'fold-one-unknown': {
    q: 'In `%7 = binop < %3, %6`, `%6` is `const 100` but `%3` is a loop counter (a phi). Can `%7` be folded?',
    a: 'No. One operand that is not a known constant is enough to stop a fold; the answer changes each time round the loop.',
  },
  'fold-ssa-free': {
    q: 'After `%6` is folded to `const 100`, why does nothing need to be copied into the instructions that use `%6`?',
    a: 'In SSA they refer to `%6` itself, which is defined once and is now a constant, so every user sees the constant at once.',
  },
  'fold-exact': {
    q: 'A folder rewrites `0.1 + 0.2` as `const 0.3`. What went wrong?',
    a: 'It changed the program: at run time the float64 sum is 0.30000000000000004, and the folded answer must match it exactly.',
  },
  'fold-host': {
    q: 'Why does a folder written in C++ or Rust need more care than one written in JavaScript, when compiling JavaScript?',
    a: 'It must copy JavaScript’s rules (string `+`, `NaN`, `Infinity`, `-0`, float rounding) by hand; a JavaScript folder gets them by doing the same operation.',
  },
  'fold-never': {
    q: 'Name two kinds of instruction a folder must leave alone even when every operand is a constant.',
    a: 'Ones with side effects (a call that prints, a store) and ones that can throw (such as reading an index of something that may not be an array).',
  },
  'plus-object': {
    q: 'Why can `+` run code in JavaScript?',
    a: 'If an operand is an object, `+` first calls its `valueOf` (or `toString`) method, and that method can do anything.',
  },
  'algebra-trap': {
    q: 'Why is rewriting `x * 1` as `x` wrong in JavaScript unless `x` is known to be a number?',
    a: 'If `x` is the string `\'3\'`, `x * 1` is the number `3`, not the string; the rewrite would change the value’s type.',
  },
};

export const examples = {
  corners: {
    title: 'Answers a folder must copy exactly',
    code: `console.log('1' + 2);
console.log(1 / 0);
console.log(0 / 0);
console.log(0.1 + 0.2);
console.log(Object.is(0 * -1, -0));
console.log(1 / (0 * -1));
console.log(2 ** 53 + 1);`,
  },
};

const F_HEAD = `// An instruction: { id, op, args,
// value }. op is 'const' (with a
// value), 'param', 'call', or one of
// the keys of OPS (two args).
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '<': (a, b) => a < b,
};
function fold(insts) {`;

const F_SOL = `${F_HEAD}
  const known = new Map();
  const out = [];
  for (const i of insts) {
    if (i.op === 'const') {
      known.set(i.id, i.value);
      out.push(i);
      continue;
    }
    const f = OPS[i.op];
    const ok = f && i.args.every(
      (a) => known.has(a));
    if (!ok) {
      out.push(i);
      continue;
    }
    const [x, y] = i.args.map(
      (a) => known.get(a));
    const v = f(x, y);
    known.set(i.id, v);
    out.push({ id: i.id, op: 'const',
      value: v });
  }
  return out;
}`;

export const exercises = {
  fold: {
    title: 'A folder for one block',
    prompt: `Write \`fold(insts)\` for one block of SSA instructions, given in order. Each instruction is an object with an \`id\` and an \`op\`:

- \`'const'\` has a \`value\` (a number, string or boolean);
- \`'param'\` is an unknown value;
- \`'call'\` calls something (its \`args\` are ids) and may have side effects;
- \`'+'\`, \`'-'\`, \`'*'\`, \`'/'\` and \`'<'\` have two \`args\`, the ids of earlier instructions.

Return a **new list**, in the same order and the same length. An instruction whose op is in \`OPS\` and whose two args are both known constants (a \`'const'\`, or something you already folded) becomes \`{ id, op: 'const', value }\`, with the value computed by \`OPS\`. Everything else is returned unchanged. A \`'call'\` is never folded.`,
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
  const out = fold([C(1, 2), C(2, 50),
    B(3, '*', 1, 2)]);
  expect(out[2]).toEqual(C(3, 100));
});
test('a folded value feeds the next fold', () => {
  const out = fold([C(1, 60),
    B(2, '*', 1, 1), C(3, 24),
    B(4, '*', 2, 3)]);
  expect(out[3]).toEqual(C(4, 86400));
});
test('one unknown operand stops a fold', () => {
  const out = fold([P(1), C(2, 100),
    B(3, '<', 1, 2), C(4, 5),
    B(5, '-', 4, 4)]);
  expect(out[2]).toEqual(B(3, '<', 1, 2));
  expect(out[4]).toEqual(C(5, 0));
});
test('calls are never folded', () => {
  const call = { id: 2, op: 'call',
    args: [1] };
  const out = fold([C(1, 5), call]);
  expect(out[1]).toEqual(call);
});
test('JavaScript answers, exactly', () => {
  const out = fold([C(1, '1'), C(2, 2),
    B(3, '+', 1, 2), C(4, 0.1),
    C(5, 0.2), B(6, '+', 4, 5),
    C(7, 0), C(8, -1), B(9, '*', 7, 8),
    B(10, '/', 2, 7)]);
  expect(out[2].value).toBe('12');
  expect(out[5].value)
    .toBe(0.30000000000000004);
  expect(out[8].value).toBe(-0);
  expect(out[9].value).toBe(Infinity);
});
test('same length and order', () => {
  const out = fold([C(1, 2), P(2)]);
  expect(out.map((i) => i.id))
    .toEqual([1, 2]);
});`,
    hints: [
      'Walk the list once, from the top. Because the code is SSA and straight-line, every operand is defined above its use, so when you reach an instruction you already know everything you ever will about its operands.',
      'Keep a `Map` from id to known constant value. A `const` goes straight into it. An instruction can be folded if `OPS[i.op]` exists and both of its args are in the map (use `has`, not a truthiness test: `0` and `\'\'` are real constants).',
      'When you fold one, compute `OPS[i.op](x, y)`, push `{ id: i.id, op: \'const\', value: v }`, and also put `v` into the map under `i.id`, so that later instructions using it can fold too.',
    ],
    walkthrough: `**How to think about it.** Do the first test by hand: \`%1 = const 2\`, \`%2 = const 50\`, \`%3 = %1 * %2\`. When you reach \`%3\` you ask "do I know both operands?", look them up, find 2 and 50, multiply, and write \`const 100\`. So the whole job is: remember the value of every constant you pass, and, for each arithmetic instruction, look its operands up. The one subtle point is the second test: after folding \`%2 = %1 * %1\` into \`const 3600\`, the instruction \`%4 = %2 * %3\` must be able to fold too, so a folded result has to go into the same memory as an original \`const\`.

**The solution, line by line.**

- \`const known = new Map();\` remembers, for each id, the constant value it is known to hold.
- \`const out = [];\` is the new list we return; we never change the input.
- \`for (const i of insts) {\` visits the instructions in order, top to bottom.
- \`if (i.op === 'const') { known.set(i.id, i.value); out.push(i); continue; }\` handles a constant: record its value and keep it as it is.
- \`const f = OPS[i.op];\` looks up the operation. For \`'param'\` and \`'call'\` there is no entry, so \`f\` is \`undefined\`, which is how calls are kept safe: they are simply not in the table of things we know how to do early.
- \`const ok = f && i.args.every((a) => known.has(a));\` is true only if we know how to do the operation *and* both operands are known constants.
- \`if (!ok) { out.push(i); continue; }\` keeps any instruction we cannot fold, unchanged.
- \`const [x, y] = i.args.map((a) => known.get(a));\` fetches the two operand values.
- \`const v = f(x, y);\` does the operation now, with JavaScript's own \`+\`, \`*\` and so on, which is exactly why \`'1' + 2\` gives \`'12'\` and \`0 * -1\` gives \`-0\`, the same as at run time.
- \`known.set(i.id, v);\` records the result, so this folded value can feed later folds.
- \`out.push({ id: i.id, op: 'const', value: v });\` replaces the instruction with a constant of the same id; anything that used this id now uses the constant.
- \`return out;\` hands back the new list.

**Common wrong attempts.**

- Testing operands with \`k[a]\` (truthiness) instead of \`known.has(a)\`: the constant \`0\` (and \`''\` and \`false\`) looks "unknown", so \`0 * -1\` is never folded and the \`-0\` test fails.
- Remembering only the original \`const\` instructions: the first fold works, but its result is never recorded, so \`%4 = %2 * %3\` in the second test is left alone.
- Writing your own arithmetic, such as \`Number(x) + Number(y)\`, "to be safe": that turns \`'1' + 2\` into \`3\`, which is not what JavaScript computes.`,
    wrong: [
      {
        code: `${F_HEAD}
  const k = {};
  return insts.map((i) => {
    if (i.op === 'const') {
      k[i.id] = i.value;
      return i;
    }
    const f = OPS[i.op];
    if (!f || !i.args.every(
      (a) => k[a])) return i;
    const v = f(k[i.args[0]],
      k[i.args[1]]);
    k[i.id] = v;
    return { id: i.id, op: 'const',
      value: v };
  });
}`,
        why: '`k[a]` is a truthiness test, so a constant `0` counts as unknown and `0 * -1` is never folded. Ask whether the id is known (`has`, or `in`), not whether its value is truthy.',
      },
      {
        code: `${F_HEAD}
  const k = new Map();
  for (const i of insts) {
    if (i.op === 'const')
      k.set(i.id, i.value);
  }
  return insts.map((i) => {
    const f = OPS[i.op];
    if (!f || !i.args.every(
      (a) => k.has(a))) return i;
    return { id: i.id, op: 'const',
      value: f(k.get(i.args[0]),
        k.get(i.args[1])) };
  });
}`,
        why: 'Folded results are never added to the map, so a fold cannot feed the next one: `%4 = %2 * %3` stays unfolded in the second test.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these may a JavaScript compiler fold to a constant?',
    options: [
      { t: '`console.log(2 + 3)` into `5`', why: 'The `2 + 3` inside can be folded, but the call prints, and that side effect must stay.' },
      { t: '`0.1 + 0.2` into `0.3`', why: 'At run time the answer is 0.30000000000000004; a fold must give exactly that.' },
      { t: '`\'1\' + 2` into `\'12\'`', correct: true, why: 'Both operands are primitive constants and string joining has no side effects, so `\'12\'` is exactly what the program would compute.' },
      { t: '`1 / 0` into an error', why: 'In JavaScript `1 / 0` is `Infinity`, not an error, and a fold must keep that.' },
    ],
  },
  {
    q: '`%6 = binop * %4, %5` where `%4 = const 2` and `%5 = param`. What can a folder do with `%6`?',
    options: [
      { t: 'Nothing: `%5` is not a known constant', correct: true, why: 'Folding needs every operand to be a constant; a parameter is only known when the function runs.' },
      { t: 'Replace it with `const 2`', why: 'That would be guessing the parameter is 1.' },
      { t: 'Replace it with `%5`', why: 'That is an algebraic shortcut for `* 1`, and the constant here is 2.' },
    ],
  },
  {
    q: 'Why is `x + 0 → x` not a safe rewrite in JavaScript, even when `x` is known to be a number?',
    options: [
      { t: 'Because `+` is slower than a copy', why: 'Speed is the reason to do the rewrite, not a reason against it.' },
      { t: 'Because `x` might be `NaN`', why: '`NaN + 0` is `NaN`, the same as `x`, so `NaN` is not the problem.' },
      { t: 'Because `-0 + 0` is `+0`, a different value from `x`', correct: true, why: 'The two zeros differ (`1 / -0` is `-Infinity`), so the rewrite changes the value when `x` is `-0`.' },
    ],
  },
  {
    q: 'After folding `%6 = binop * %4, %5` into `%6 = const 100`, what has to happen to `%7 = binop < %3, %6`?',
    options: [
      { t: 'Its operand must be rewritten to the literal 100', why: 'In SSA, `%7` already refers to `%6`, which is now the constant; nothing needs copying.' },
      { t: 'Nothing: it now has a constant operand by referring to `%6`', correct: true, why: 'Each value is defined once, so changing the definition of `%6` changes what every user sees.' },
      { t: 'It must be folded too', why: 'Its other operand, `%3`, is a loop counter, so it cannot be folded.' },
      { t: 'It must be deleted', why: 'It is still needed: the branch tests it.' },
    ],
  },
  {
    q: 'Which instruction is **not** safe to fold, even with constant operands?',
    options: [
      { t: '`%3 = binop < %1, %2` with constants 1 and 0', why: 'A comparison of two numbers has no effects and always gives an answer: it folds to `false`.' },
      { t: '`%3 = binop / %1, %2` with constants 1 and 0', why: 'It gives `Infinity` and cannot throw, so it folds.' },
      { t: '`%3 = binop * %1, %2` with constants 0 and -1', why: 'It folds to `-0`; the folder just has to keep the sign.' },
      { t: '`%3 = call %1, %2` with constant arguments', correct: true, why: 'A call can have side effects (printing, changing state), which must still happen at run time.' },
    ],
  },
  {
    q: 'Viscosity has no folding pass. What does that change in its output for `for (let i = 0; i < 2 * 50; i++) ps.push(...)`?',
    options: [
      { t: 'It refuses to change the layout', why: 'It still chooses struct of arrays; folding affects only the size estimate here.' },
      { t: 'It reports "size unknown statically" instead of "about 100 elements"', correct: true, why: 'It counts loop trips only when the bound is a `const` instruction, and `2 * 50` stays a `binop`.' },
      { t: 'It makes the program print a different answer', why: 'Viscosity never changes what a program prints; folding or not, the output is the same.' },
    ],
  },
];
