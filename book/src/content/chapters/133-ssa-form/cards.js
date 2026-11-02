// Chapter 133 cards. Keys are stable ids: never rename them.

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
  'phis-together': {
    q: 'A block starts with two phis. Can the second one see the first one’s new value?',
    a: 'No. All of a block’s phis take their values at the same moment, as control crosses the edge.',
  },
  'vir-no-names': {
    q: 'In VIR, what does `%4` name?',
    a: 'The value produced by instruction 4. A value is its defining instruction, so it is assigned exactly once.',
  },
  'loop-phi': {
    q: 'Why may a loop header’s phi use a value defined later in the listing?',
    a: 'That operand is only read when control arrives along the back edge, after the defining block has run.',
  },
  'ssa-buys': {
    q: 'In SSA, `%1 = const 0`. What do you know about every use of `%1`?',
    a: 'It is 0. There is no other assignment that could change it.',
  },
  'captured-not-ssa': {
    q: 'Why does VIR keep a closure-captured variable out of SSA?',
    a: 'Another function can change it at a moment this function’s CFG cannot see, so it is a binding with load and store.',
  },
};

export const examples = {
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
};

const S_HEAD = `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {`;

const E_HEAD = `// phis: [[dst, [op0, op1, ...]], ...]
// env: name -> value. k: the edge.
function enter(phis, env, k) {`;

export const exercises = {
  'to-ssa': {
    title: 'Rename into SSA',
    prompt: `Write \`toSSA(code)\` for straight-line code. Each instruction is \`[dst, op, a, b]\`, where \`a\` and \`b\` are variable names (strings) or numbers. Return a new list in which:

- the *n*-th assignment to a name \`v\` defines \`v\` + *n* (\`x1\`, \`x2\`, ...);
- each name used is replaced by its latest version, or version \`0\` if it has not been assigned yet (\`a0\`);
- numbers and \`op\` are unchanged.

So \`[['x', '+', 'a', 1], ['x', '*', 'x', 2]]\` becomes \`[['x1', '+', 'a0', 1], ['x2', '*', 'x1', 2]]\`.`,
    starter: `${S_HEAD}
  // your code here
}`,
    solution: `${S_HEAD}
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
    walkthrough: `The whole algorithm is one table: the latest version of each name.

- **Uses first.** In \`x = x * 2\` the \`x\` on the right is the *old* value. If you bumped \`ver.x\` first, you'd produce \`x2 = x2 * 2\`: a value defined in terms of itself, which is nonsense in straight-line code. Real SSA builders keep the same order: read the operands, then record the new definition.
- **Version 0** stands for "whatever came in": parameters, globals, anything assigned before this code. It lets every use have a name even when there is no definition in sight.
- **Numbers pass through.** Constants aren't variables, so they need no version.

\`\`\`js
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
\`\`\`

Why is this enough here, when the chapter needed phis? Straight-line code has a single path, so "the latest version" is always one name. Phis are needed only where two paths join, each with its own latest version.`,
    wrong: [
      {
        code: `${S_HEAD}
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
        code: `${S_HEAD}
  let n = 0;
  return code.map(([d, op, a, b]) =>
    [d + ++n, op, a, b]);
}`,
        why: 'Fresh destination names alone are not SSA: the uses must be renamed too, or `y = x + 3` no longer says which `x` it means.',
      },
    ],
  },
  'enter-block': {
    optional: true,
    title: 'All phis at once',
    prompt: `Write \`enter(phis, env, k)\`: control enters a block along predecessor edge \`k\`. \`phis\` is the block's list of \`[dst, operands]\`, and \`env\` maps names to current values. Return a **new** env in which every phi's \`dst\` holds the value of its \`k\`-th operand. All phis must read the env as it was *before* any of them ran. Don't change \`env\`.`,
    starter: `${E_HEAD}
  return env;
}`,
    solution: `${E_HEAD}
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
    ['a2', ['a1', 'b2']],
    ['b2', ['b1', 'a2']],
  ];
  const env = { a2: 1, b2: 2 };
  const out = enter(ps, env, 1);
  expect(out.a2).toBe(2);
  expect(out.b2).toBe(1);
});
test('env is not changed', () => {
  const ps = [['x4', ['x2', 'x3']]];
  const env = { x2: 20, x3: 0 };
  enter(ps, env, 0);
  expect(env.x4).toBe(undefined);
});`,
    hints: [
      'Copy `env` into a new object `out` first.',
      'Read every operand from the old `env`, and write every result into `out`.',
    ],
    walkthrough: `The swap test is the point. In a loop like \`[a, b] = [b, a]\`, the header holds \`a2 = φ(a1, b2)\` and \`b2 = φ(b1, a2)\`. Along the back edge (k = 1), \`a2\` must get the *old* \`b2\` and \`b2\` the *old* \`a2\`.

If you update in place, one phi at a time, the first phi overwrites \`a2\` before the second reads it, and both end up as 2: the classic "lost copy" when phis are turned into plain copies in the wrong order. Reading everything from the old env and writing into a new one is exactly "all phis take their values at the same moment".

\`\`\`js
const out = { ...env };
for (const [d, ops] of phis) {
  out[d] = env[ops[k]];
}
return out;
\`\`\``,
    wrong: [
      {
        code: `${E_HEAD}
  for (const [d, ops] of phis) {
    env[d] = env[ops[k]];
  }
  return env;
}`,
        why: 'Updating in place lets the second phi read the first phi’s new value. In the swap, both end up as 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'After renaming `x = 1; x = x + 1; y = x;` into SSA, what does `y` read?',
    options: [
      { t: '`x1`', why: '`x1` is the first value. The second line made a newer version, and `y` reads the latest.' },
      { t: '`x2`', correct: true, why: 'Line 2 defines `x2 = x1 + 1`, and line 3 reads the latest version, `x2`.' },
      { t: '`x`', why: 'In SSA every use names one specific version. A bare `x` would leave the question "which one?" open.' },
      { t: 'A phi of `x1` and `x2`', why: 'There is only one path through straight-line code, so no phi is needed.' },
    ],
  },
  {
    q: 'What does the "static" in static single assignment mean?',
    options: [
      { t: 'Each variable is assigned at most once while the program runs.', why: 'An assignment in a loop runs many times. SSA only limits how many places in the text assign it.' },
      { t: 'The variables are allocated statically, not on the stack.', why: 'SSA says nothing about where values are stored.' },
      { t: 'Each variable is assigned in exactly one place in the program text.', correct: true, why: 'That is the rule: one definition site per name, however often it executes.' },
    ],
  },
  {
    q: 'A join block has three predecessors. How many operands does each of its phis have?',
    options: [
      { t: 'Two', why: 'Phis are not limited to two. They have one operand per incoming edge.' },
      { t: 'As many as there are different values', why: 'Even if two operands are the same name, there is still one per predecessor, in predecessor order.' },
      { t: 'One', why: 'A phi with one operand would just be a copy. Each edge needs its own operand.' },
      { t: 'Three', correct: true, why: 'One operand per predecessor, so the phi knows what to pick for each edge.' },
    ],
  },
  {
    q: 'In VIR, `b3` has `; preds b1 b2` and starts with `%4 = phi %2, %3`. Control arrives from `b2`. What is `%4`?',
    options: [
      { t: 'The value of `%3`', correct: true, why: 'Operands follow predecessor order: `b1` gives `%2`, `b2` gives `%3`.' },
      { t: 'The value of `%2`', why: 'That would be the case for control arriving from `b1`, the first predecessor.' },
      { t: 'Whichever of `%2` and `%3` was computed last', why: 'A phi chooses by edge, not by time. Only one of the two branches ran anyway.' },
    ],
  },
  {
    q: 'A loop header holds `%3 = phi %2, %10`, but `%10` is defined further down the listing. Is that a bug?',
    options: [
      { t: 'Yes: a value must be defined before it is used.', why: 'For ordinary uses, yes. A phi operand only has to be available at the end of its predecessor.' },
      { t: 'No: `%10` arrives along the back edge, so its block has always run by then.', correct: true, why: 'On the first entry the phi takes `%2`. It only reads `%10` when coming round from the end of the loop body.' },
      { t: 'No: phis are evaluated after the whole loop finishes.', why: 'A header phi is evaluated every time control enters the header.' },
    ],
  },
  {
    q: 'Which JavaScript local does VIR keep as a binding, with `load` and `store`, instead of SSA values?',
    options: [
      { t: 'A `let` counter used only in its own loop', why: 'That is the easy case: it becomes SSA values with a phi in the loop header.' },
      { t: 'A parameter that is reassigned in an `if`', why: 'Reassignment is fine in SSA. The phi at the join handles it.' },
      { t: 'A `const` holding a number', why: 'A constant local is the easiest SSA value of all: one definition.' },
      { t: 'A local that an inner function captures and changes', correct: true, why: 'Another function can change it whenever it is called, and this function’s CFG can’t see when that happens.' },
    ],
  },
];
