// Chapter 261 cards. Keys are stable ids: never rename them.

const TERM = `function term(t) {
  if (t.kind === 'br')
    return 'br b' + t.target;
  if (t.kind === 'condbr')
    return 'condbr %' + t.cond + ', b' +
      t.then + ', b' + t.else;
  return t.value === null ? 'return'
    : 'return %' + t.value;
}
`;

export const prompts = {
  'vir-func': {
    q: 'What is a VIR `Func`, structurally?',
    a: 'A control-flow graph: a list of basic blocks with an entry block. Each block holds instructions and ends in one terminator.',
  },
  'vir-term': {
    q: 'Name VIR’s five terminator kinds.',
    a: '`br`, `condbr`, `return`, `throw`, `unreachable`.',
  },
  'vir-src': {
    q: 'What is an instruction’s `src` for?',
    a: 'It points back to the source: the plugin’s syntax node, start and end offsets, and line. Emit uses it to rewrite; explain uses it for line numbers.',
  },
  'vir-what': {
    q: 'What kind of IR is VIR?',
    a: 'A language-neutral SSA IR: each function is a CFG of basic blocks, with phis joining values.',
  },
  'ssa-vs-binding': {
    q: 'Why does a variable that a closure assigns stay a binding instead of becoming SSA values?',
    a: 'A call to the closure may change it at any time, which a phi can’t describe. Explicit `load`/`store` keep every read and write visible.',
  },
  'binding-arrays': {
    q: 'Which variables does the JavaScript plugin always make bindings, besides captured ones?',
    a: 'Module-level variables used by inner functions, variables assigned in `try` blocks, and every variable initialised with an array.',
  },
  'phi-pick': {
    q: 'Block `b3` has preds `b1 b2` and starts with `%4 = phi %2, %3`. Control enters `b3` from `b2`. What is `%4`?',
    a: '`%3`: a phi’s arguments are in predecessor order, and it takes the one for the edge control came in by.',
  },
  'ssa-cheap': {
    q: 'In the VIR for `let t = 0; … t = t + v`, why is there no store for `t`?',
    a: '`t` is an uncaptured local, so it is SSA: each assignment is just a new value, and phis join them where paths meet.',
  },
};

export const examples = {
  'phi-by-hand': {
    title: 'A phi picks by the way you came in',
    code: `// function pick(c), as VIR:
// b0: condbr c, b1, b2
// b1: %2 = 1   b2: %3 = 2
// b3: %4 = phi %2, %3 (preds b1 b2)
function pick(c) {
  const v = {};
  let from;
  if (c) { v[2] = 1; from = 'b1'; }
  else { v[3] = 2; from = 'b2'; }
  v[4] = from === 'b1' ? v[2] : v[3];
  return v[4];
}
console.log(pick(true), pick(false));`,
  },
};

export const exercises = {
  printFunc: {
    title: 'Print a function',
    prompt:
      'Write `printFunc(f)` for a tiny VIR. `f` has `name`, `params` (ids) and `blocks`; each block has `id`, `insts` and `term`. An instruction has `id`, `op`, `args` (ids) and, for some ops, `value`, `operator` or `field`. `term(t)` is written for you. Print like Viscosity’s listing: a header `func NAME(%0, %1):`, then for each block a line `  bN:`, then each instruction and the terminator indented by 4 spaces. Instructions print as: `%2 = const 0` (value via `JSON.stringify`), `%4 = binop > %1, %3`, `%2 = field.get %0 .x`, `field.set %0, %5 .x` (no id: it makes no value), and any other op as `%8 = phi %7, %2`.',
    starter: TERM + `
function printFunc(f) {
  // your code here
}`,
    solution: TERM + `
function fmt(i) {
  const a = i.args.map((x) => '%' + x)
    .join(', ');
  const d = '%' + i.id + ' = ';
  switch (i.op) {
    case 'const':
      return d + 'const ' +
        JSON.stringify(i.value);
    case 'binop':
      return d + 'binop ' +
        i.operator + ' ' + a;
    case 'field.get':
      return d + 'field.get ' + a +
        ' .' + i.field;
    case 'field.set':
      return 'field.set ' + a + ' .' +
        i.field;
    default:
      return d + i.op + ' ' + a;
  }
}
function printFunc(f) {
  const ps = f.params.map(
    (p) => '%' + p);
  const out = ['func ' + f.name + '(' +
    ps.join(', ') + '):'];
  for (const b of f.blocks) {
    out.push('  b' + b.id + ':');
    for (const i of b.insts)
      out.push('    ' + fmt(i));
    out.push('    ' + term(b.term));
  }
  return out.join('\\n');
}`,
    tests: `const step = { name: 'step', params: [0, 1], blocks: [
  { id: 0, insts: [
    { id: 2, op: 'field.get', args: [0], field: 'x' },
    { id: 3, op: 'const', args: [], value: 0 },
    { id: 4, op: 'binop', args: [1, 3], operator: '>' },
  ], term: { kind: 'condbr', cond: 4, then: 1, else: 2 } },
  { id: 1, insts: [
    { id: 5, op: 'field.get', args: [0], field: 'vx' },
    { id: 6, op: 'binop', args: [5, 1], operator: '*' },
    { id: 7, op: 'binop', args: [2, 6], operator: '+' },
  ], term: { kind: 'br', target: 3 } },
  { id: 2, insts: [], term: { kind: 'br', target: 3 } },
  { id: 3, insts: [
    { id: 8, op: 'phi', args: [7, 2] },
  ], term: { kind: 'return', value: 8 } },
] };
test('prints the step function', () => {
  expect(printFunc(step)).toBe([
    'func step(%0, %1):',
    '  b0:',
    '    %2 = field.get %0 .x',
    '    %3 = const 0',
    '    %4 = binop > %1, %3',
    '    condbr %4, b1, b2',
    '  b1:',
    '    %5 = field.get %0 .vx',
    '    %6 = binop * %5, %1',
    '    %7 = binop + %2, %6',
    '    br b3',
    '  b2:',
    '    br b3',
    '  b3:',
    '    %8 = phi %7, %2',
    '    return %8',
  ].join('\\n'));
});
test('field.set has no id, strings are quoted', () => {
  const f = { name: 'f', params: [0], blocks: [
    { id: 0, insts: [
      { id: 1, op: 'const', args: [], value: 'hi' },
      { id: 2, op: 'field.set', args: [0, 1], field: 'tag' },
    ], term: { kind: 'return', value: null } },
  ] };
  expect(printFunc(f)).toBe([
    'func f(%0):', '  b0:',
    '    %1 = const "hi"',
    '    field.set %0, %1 .tag',
    '    return',
  ].join('\\n'));
});`,
    hints: [
      'Write a helper `fmt(i)` for one instruction. Build the operand text once: `i.args.map((x) => \'%\' + x).join(\', \')`.',
      'Switch on `i.op`. Only `field.set` leaves out the `%id = ` prefix; `const`, `binop` and the field ops each add one extra piece (`value`, `operator`, `.field`).',
      'In `printFunc`, collect lines in an array: the header, then for each block its label, its instructions and `term(b.term)`, each indented. Join with `\\n` at the end.',
    ],
    walkthrough: `**How to think about it.** A printer is the first tool anyone writes for a new IR, because you cannot debug what you cannot see, and Viscosity's own \`printFunc\` in \`vir.ts\` is this function with a few more cases. Split the job in two: one small function, \`fmt\`, that turns *one instruction* into one line, and a loop in \`printFunc\` that walks blocks and lays the lines out. Most instructions print the same way, \`%id = op args\`; only a few carry an extra field, so a \`switch\` with a \`default\` is the natural shape.

**The solution, line by line.**

- \`function fmt(i) {\` formats one instruction \`i\`.
- \`  const a = i.args.map((x) => '%' + x)\` / \`    .join(', ');\` turns the argument ids \`[1, 3]\` into the text \`%1, %3\`, used by almost every case.
- \`  const d = '%' + i.id + ' = ';\` is the "defines a value" prefix, for example \`%4 = \`.
- \`    case 'const':\` / \`      return d + 'const ' +\` / \`        JSON.stringify(i.value);\` prints the constant; \`JSON.stringify\` puts quotes round strings, so \`const "hi"\` cannot be confused with a name, and prints \`0\` as \`0\`.
- \`    case 'binop':\` / \`      return d + 'binop ' +\` / \`        i.operator + ' ' + a;\` adds the operator before the operands: \`%4 = binop > %1, %3\`.
- \`    case 'field.get':\` / \`      return d + 'field.get ' + a +\` / \`        ' .' + i.field;\` adds the field name after the object: \`%2 = field.get %0 .x\`.
- \`    case 'field.set':\` / \`      return 'field.set ' + a + ' .' +\` / \`        i.field;\` has **no** \`d\`: a store makes no value that anything could use, so printing \`%6 =\` would suggest otherwise (the real printer does the same for \`store\`, which is why ids in real listings seem to skip).
- \`    default:\` / \`      return d + i.op + ' ' + a;\` covers \`phi\`, \`index.get\` and the rest.
- \`function printFunc(f) {\` starts the listing.
- \`  const ps = f.params.map(\` / \`    (p) => '%' + p);\` names the parameters, and \`  const out = ['func ' + f.name + '(' +\` / \`    ps.join(', ') + '):'];\` makes the header line.
- \`  for (const b of f.blocks) {\` visits blocks in order; \`    out.push('  b' + b.id + ':');\` writes the label with two spaces.
- \`    for (const i of b.insts)\` / \`      out.push('    ' + fmt(i));\` writes each instruction indented by four spaces.
- \`    out.push('    ' + term(b.term));\` writes the terminator last, because every block ends in exactly one.
- \`  return out.join('\\n');\` joins the lines.

**Common wrong attempts.**

- Printing \`%id = \` in front of \`field.set\` gives \`%6 = field.set %0, %5 .x\`, which the tests reject and which misleads a reader into looking for uses of \`%6\`.
- Forgetting the terminator leaves blocks that seem to fall off their end; in a CFG nothing falls through, every block says where it goes.
- Printing \`String(i.value)\` instead of \`JSON.stringify\` makes the string \`"x"\` look like a name \`x\`.

The real printer also writes each block's predecessors as a comment, \`; preds b0 b3\`, which helps when reading phis, since a phi's arguments are in predecessor order.`,
    wrong: [
      {
        code: TERM + `
function printFunc(f) {
  const out = ['func ' + f.name + ':'];
  for (const b of f.blocks) {
    out.push('  b' + b.id + ':');
    for (const i of b.insts) {
      const a = i.args
        .map((x) => '%' + x).join(', ');
      out.push('    %' + i.id + ' = ' +
        i.op + ' ' + a);
    }
    out.push('    ' + term(b.term));
  }
  return out.join('\\n');
}`,
        why: 'This prints every op the same way, so it loses the constant’s value, the operator and the field name, and gives `field.set` an id. It also drops the parameters from the header.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In VIR, how does `let t = 0; for (…) t = t + v;` show up, if no closure captures `t`?',
    options: [
      { t: 'As `store t` and `load t` instructions', why: 'Those are for bindings. An uncaptured local becomes SSA values instead.' },
      { t: 'As an `opaque` instruction', why: 'Plain assignments are fully modelled.' },
      { t: 'As SSA values, joined by a phi at the loop header', correct: true, why: 'Each assignment defines a new value; the phi picks the right one on each path into the header.' },
      { t: 'It disappears completely', why: 'Its values are still there, just without the name `t`.' },
    ],
  },
  {
    q: 'In VIR, block `b3` has predecessors `b1 b2` and starts with `%4 = phi %2, %3`. What does that phi mean?',
    options: [
      { t: 'Add `%2` and `%3`', why: 'A phi does no arithmetic; it chooses.' },
      { t: '`%4` is `%2` when control came from `b1`, and `%3` when it came from `b2`', correct: true, why: 'Arguments are in predecessor order; the edge taken picks one.' },
      { t: '`%4` is whichever of the two was defined last', why: 'Both are defined once; which applies depends on the path, not on time.' },
      { t: 'Run both branches and keep the larger result', why: 'Only one branch runs; the phi names the value from the one that did.' },
    ],
  },
  {
    q: 'Which variable does the JavaScript plugin turn into a binding rather than SSA values?',
    options: [
      { t: 'A loop counter `i` used only in its loop', why: 'An uncaptured local: it becomes SSA, with a phi in the header.' },
      { t: '`n`, assigned inside an arrow function that is called in a loop', correct: true, why: 'A call to the closure can change `n` at any time, which phis can’t describe.' },
      { t: 'A parameter that is only read', why: 'It is a `param` value, used directly.' },
      { t: 'A temporary like `ps[i].x * 2`', why: 'Temporaries are always plain SSA values.' },
    ],
  },
  {
    q: 'Why does the JavaScript plugin make every variable initialised with an array a binding?',
    options: [
      { t: 'Arrays are too big for SSA', why: 'SSA values are references; size doesn’t matter.' },
      { t: 'So the analyses can see every read and write of a candidate collection as a `load` or `store`', correct: true, why: 'Collection discovery and safety analysis follow the binding’s loads and check its stores.' },
      { t: 'Because arrays are always captured', why: 'Many aren’t. The rule is about making uses visible.' },
      { t: 'Because JavaScript copies arrays on assignment', why: 'It doesn’t: arrays are references.' },
    ],
  },
  {
    q: 'What do VIR instructions keep in their `src` field, and why?',
    options: [
      { t: 'A copy of the whole program, for safety', why: 'The module stores the source once; instructions only point into it.' },
      { t: 'Nothing: VIR is independent of the source', why: 'Language-neutral doesn’t mean disconnected. Emit needs to know where to edit.' },
      { t: 'The plugin’s syntax node, offsets and line, so emit can replace that range and explain can name the line', correct: true, why: 'That is how a decision made on VIR turns into an edit of your text.' },
      { t: 'The generated machine code', why: 'Viscosity never generates machine code.' },
    ],
  },
];
