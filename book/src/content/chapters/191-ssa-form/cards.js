// Chapter 191 cards. Keys are stable ids: never rename them.

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
};

const S_HEAD = `// code: [[dst, op, a, b], ...]
// a and b are names or numbers.
function toSSA(code) {`;

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
    q: 'Which JavaScript local does VIR keep as a binding, with `load` and `store`, instead of SSA values?',
    options: [
      { t: 'A `let` counter used only in its own loop', why: 'That is the easy case: it becomes SSA values with a phi in the loop header.' },
      { t: 'A parameter that is reassigned in an `if`', why: 'Reassignment is fine in SSA. The phi at the join handles it.' },
      { t: 'A `const` holding a number', why: 'A constant local is the easiest SSA value of all: one definition.' },
      { t: 'A local that an inner function captures and changes', correct: true, why: 'Another function can change it whenever it is called, and this function’s CFG can’t see when that happens.' },
    ],
  },
  {
    q: 'In SSA, the program does `p.x = 1; p.x = 2;`. How many versions of `p.x` does VIR make?',
    options: [
      { t: 'Two, `x1` and `x2`', why: 'Fields are not renamed: another variable could hold the same object, so VIR keeps two `field.set` instructions.' },
      { t: 'None: SSA renames plain local variables, and these stay two `field.set` instructions', correct: true, why: 'Only locals get versions; memory such as object fields is read and written with instructions.' },
      { t: 'One, because the first write is dead', why: 'Deleting the first write is a later optimisation, not part of SSA.' },
    ],
  },
  {
    q: 'Why can an analysis file SSA definitions in a table keyed by name, and trust the table?',
    options: [
      { t: 'Because SSA programs have no loops', why: 'They have loops; a loop’s values meet in phis.' },
      { t: 'Because each name is defined in exactly one place, so no entry is ever overwritten', correct: true, why: 'In the original code a later assignment overwrites the entry for x, and uses get the wrong line.' },
      { t: 'Because SSA names are numbers', why: 'In VIR they are numbers, but the reason is single assignment, not the spelling.' },
    ],
  },
];
