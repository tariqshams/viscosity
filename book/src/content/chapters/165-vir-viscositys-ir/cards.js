// Chapter 165 cards. Keys are stable ids: never rename them.

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
  'vir-neutral': {
    q: 'Python’s `P(1.0, 2.0)` (a dataclass) and JavaScript’s `{ x: 1, vx: 2 }` both lower to which VIR op?',
    a: '`record.new`, with the field names in order.',
  },
  'rc-why': {
    q: 'Why are records, collections and field accesses first-class instructions in VIR?',
    a: 'They are exactly what the layout analyses ask about, so the facts can be read directly instead of recognised from lower-level patterns.',
  },
  'rc-length': {
    q: 'How do both plugins lower `ps.length` (or Python’s `len(ps)`)?',
    a: 'As `field.get .length`, which the analyses recognise on a collection.',
  },
  'op-what': {
    q: 'What does a VIR `opaque` instruction mean?',
    a: '“Might do anything with these arguments”: something the plugin doesn’t model. Its arguments escape and its result is unknown.',
  },
  'op-sound': {
    q: 'Why does treating `opaque` as the worst case keep Viscosity correct?',
    a: 'Uncertainty can only stop a rewrite, never cause a wrong one. A missed optimization is safe; a wrong layout change is not.',
  },
  'ssa-vs-binding': {
    q: 'Why does a variable that a closure assigns stay a binding instead of becoming SSA values?',
    a: 'A call to the closure may change it at any time, which a phi can’t describe. Explicit `load`/`store` keep every read and write visible.',
  },
  'binding-arrays': {
    q: 'Which variables does the JavaScript plugin always make bindings, besides captured ones?',
    a: 'Module-level variables used by inner functions, variables assigned in `try` blocks, and every variable initialized with an array.',
  },
  'ssa-cheap': {
    q: 'In the VIR for `let t = 0; … t = t + v`, why is there no store for `t`?',
    a: '`t` is an uncaptured local, so it is SSA: each assignment is just a new value, and phis join them where paths meet.',
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
    walkthrough: `A printer is the first tool anyone writes for a new IR, because you can’t debug what you can’t see. Viscosity’s \`printFunc\` in \`vir.ts\` is this function with a few more cases.

- **One case per op shape.** Most ops print as \`%id = op args\`. A few carry an extra field: \`const\` its value, \`binop\` its operator, the field ops their field name. \`JSON.stringify\` quotes strings, so \`const "hi"\` can’t be confused with a name.
- **No id for field.set.** Every instruction has an id, but a store produces no value that anything could use. Printing \`%2 =\` would suggest otherwise. (The real printer does the same for \`store\`, which is why ids seem to skip.)
- **The terminator last.** Each block ends in exactly one terminator, so print it after the instructions. The real printer also prints each block’s predecessors as a comment, \`; preds b0 b3\`, which helps when reading phis: a phi’s arguments are in predecessor order.`,
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
  fieldsTouched: {
    optional: true,
    title: 'Which fields does the loop touch?',
    prompt:
      'Using the same instruction shape, write `fieldsTouched(insts, arr)`. `arr` is the id of a collection value. Find every `index.get` whose first argument is `arr`; its result is an element. Return the sorted, de-duplicated names of the fields read (`field.get`) or written (`field.set`) **on those elements** (the element is the first argument). Ignore field accesses on anything else.',
    starter: `function fieldsTouched(insts, arr) {
  // your code here
  return [];
}`,
    solution: `function fieldsTouched(insts, arr) {
  const els = new Set();
  for (const i of insts)
    if (i.op === 'index.get' &&
        i.args[0] === arr)
      els.add(i.id);
  const fs = new Set();
  for (const i of insts) {
    const f = i.op === 'field.get' ||
      i.op === 'field.set';
    if (f && els.has(i.args[0]))
      fs.add(i.field);
  }
  return [...fs].sort();
}`,
    tests: `const insts = [
  { id: 13, op: 'index.get', args: [12, 7] },
  { id: 14, op: 'field.get', args: [13], field: 'x' },
  { id: 16, op: 'index.get', args: [15, 7] },
  { id: 17, op: 'field.get', args: [16], field: 'vx' },
  { id: 18, op: 'field.get', args: [99], field: 'log' },
  { id: 19, op: 'field.set', args: [13, 17], field: 'x' },
];
test('fields of elements of %12', () => {
  expect(fieldsTouched(insts, 12)).toEqual(['x']);
});
test('another collection', () => {
  expect(fieldsTouched(insts, 15)).toEqual(['vx']);
});
test('not a collection', () => {
  expect(fieldsTouched(insts, 99)).toEqual([]);
});`,
    hints: [
      'Two passes: first collect the ids of elements (`index.get` on `arr`), then look at field accesses.',
      'A field access counts only if its first argument is one of those element ids. Use a `Set` for both the elements and the field names.',
    ],
    walkthrough: `This is the core of Viscosity’s access-pattern analysis, made tiny, and it is only this short because VIR has first-class collection nodes. An element is “the result of an \`index.get\` on the collection”, and a field access is “a \`field.get\` or \`field.set\` whose object is an element”. No patterns to recognise, no syntax to look at.

Two passes are enough here because an \`index.get\` always comes before the field accesses that use its result. The real analysis also follows elements through bindings and function parameters, and records the accesses per loop, using the natural loops of chapter 136, so the planner knows which loop touches what.`,
    wrong: [
      {
        code: `function fieldsTouched(insts, arr) {
  const fs = new Set();
  for (const i of insts)
    if (i.op === 'field.get' ||
        i.op === 'field.set')
      fs.add(i.field);
  return [...fs].sort();
}`,
        why: 'This collects every field access in the function, including `console.log` and other collections’ fields. Only accesses on elements of `arr` count.',
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
    q: 'Why does VIR have `field.get` and `index.get` instead of a general “load from memory”?',
    options: [
      { t: 'So the layout analyses can read “which element, which field” directly', correct: true, why: 'Those facts are the analyses’ whole subject. A lower-level IR would hide them behind patterns.' },
      { t: 'Because JavaScript has no memory addresses', why: 'True, but VIR is chosen for its analyses, not only to match JavaScript.' },
      { t: 'To make the program run faster', why: 'VIR is never run. It is only analysed.' },
      { t: 'Because SSA requires it', why: 'SSA is about how values are defined, not which operations exist.' },
    ],
  },
  {
    q: 'A program uses a tagged template with an element: ``tag`${ps[0]}` ``. What happens?',
    options: [
      { t: 'Viscosity crashes: it can’t lower templates', why: 'It can lower anything: what it doesn’t model becomes opaque.' },
      { t: 'The template is ignored, and `ps` becomes SoA', why: 'Ignoring a use would be unsound: it could observe the element.' },
      { t: 'Viscosity rewrites the template to use columns', why: 'It doesn’t model templates, so it can’t rewrite them.' },
      { t: 'It lowers to an `opaque` whose arguments include `ps`, so `ps` is kept and explain says why', correct: true, why: 'An opaque takes every variable its code mentions, and its arguments are treated as escaping: conservative soundness.' },
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
    q: 'Why does the JavaScript plugin make every array-holding variable a binding?',
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
