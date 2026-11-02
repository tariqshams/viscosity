// Chapter 66 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 99, 99.

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
  'rc-why': {
    q: 'Why are records, collections and field accesses first-class instructions in VIR?',
    a: 'They are exactly what the layout analyses ask about, so the facts can be read directly instead of recognised from lower-level patterns.',
  },
  'vir-neutral': {
    q: 'Python’s `P(1.0, 2.0)` (a dataclass) and JavaScript’s `{ x: 1, vx: 2 }` both lower to which VIR op?',
    a: '`record.new`, with the field names in order.',
  },
  'rc-length': {
    q: 'How do both plugins lower `ps.length` (or Python’s `len(ps)`)?',
    a: 'As `field.get .length`, which the analyses recognise on a collection.',
  },
  'rc-intrinsic': {
    q: 'What does VIR’s `intrinsic` op promise about a function like `Math.sqrt`?',
    a: 'It returns a number and keeps no reference to its arguments, so passing a field value to it is harmless.',
  },
  'rc-touched': {
    q: 'In VIR, what makes a `field.get` count as a read of the collection’s field?',
    a: 'Its object (first argument) is an element: the result of an `index.get` on the collection.',
  },
  'op-what': {
    q: 'What does a VIR `opaque` instruction mean?',
    a: '“Might do anything with these arguments”: code the plugin does not model. Its arguments escape and its result is unknown.',
  },
  'op-args': {
    q: 'Which values does the JavaScript plugin give an `opaque` instruction as arguments?',
    a: 'Every local variable the unmodelled code mentions (not property names, not globals).',
  },
  'op-sound': {
    q: 'Why does treating `opaque` as the worst case keep Viscosity correct?',
    a: 'Uncertainty can only stop a rewrite, never cause a wrong one. A missed optimisation is safe; a wrong layout change is not.',
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
  touched: {
    title: 'Reads and writes, from VIR alone',
    code: `// loop body of ps[i].x += ps[i].vx
const body = [
  [18, 'load', 'ps'],
  [19, 'index.get', 18],
  [20, 'field.get', 19, 'x'],
  [21, 'load', 'ps'],
  [22, 'index.get', 21],
  [23, 'field.get', 22, 'vx'],
  [25, 'field.set', 19, 'x'],
];
const coll = new Set();
const els = new Set();
const reads = new Set();
const writes = new Set();
for (const [id, op, a, f] of body) {
  if (op === 'load' && a === 'ps')
    coll.add(id);
  if (op === 'index.get' && coll.has(a))
    els.add(id);
  if (op === 'field.get' && els.has(a))
    reads.add(f);
  if (op === 'field.set' && els.has(a))
    writes.add(f);
}
console.log([...reads], [...writes]);`,
  },
};

export const exercises = {
  printFunc: {
    title: 'Print a function',
    prompt: 'Write `printFunc(f)` for a tiny VIR. `f` has `name`, `params` (ids) and `blocks`; each block has `id`, `insts` and `term`. An instruction has `id`, `op`, `args` (ids) and, for some ops, `value`, `operator` or `field`. `term(t)` is written for you. Print like Viscosity’s listing: a header `func NAME(%0, %1):`, then for each block a line `  bN:`, then each instruction and the terminator indented by 4 spaces. Instructions print as: `%2 = const 0` (value via `JSON.stringify`), `%4 = binop > %1, %3`, `%2 = field.get %0 .x`, `field.set %0, %5 .x` (no id: it makes no value), and any other op as `%8 = phi %7, %2`.',
    starter: `function term(t) {
  if (t.kind === 'br')
    return 'br b' + t.target;
  if (t.kind === 'condbr')
    return 'condbr %' + t.cond + ', b' +
      t.then + ', b' + t.else;
  return t.value === null ? 'return'
    : 'return %' + t.value;
}

function printFunc(f) {
  // your code here
}`,
    solution: `function term(t) {
  if (t.kind === 'br')
    return 'br b' + t.target;
  if (t.kind === 'condbr')
    return 'condbr %' + t.cond + ', b' +
      t.then + ', b' + t.else;
  return t.value === null ? 'return'
    : 'return %' + t.value;
}

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
        code: `function term(t) {
  if (t.kind === 'br')
    return 'br b' + t.target;
  if (t.kind === 'condbr')
    return 'condbr %' + t.cond + ', b' +
      t.then + ', b' + t.else;
  return t.value === null ? 'return'
    : 'return %' + t.value;
}

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
    title: 'Which fields does the loop touch?',
    prompt: 'Using the same instruction shape, write `fieldsTouched(insts, arr)`. `arr` is the id of a collection value. Find every `index.get` whose first argument is `arr`; its result is an element. Return the sorted, de-duplicated names of the fields read (`field.get`) or written (`field.set`) **on those elements** (the element is the first argument). Ignore field accesses on anything else.',
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
    walkthrough: `**How to think about it.** Say in words what makes a field access count: it is a \`field.get\` or \`field.set\` whose *object* (its first argument) is an *element* of the collection, and an element is the result of an \`index.get\` whose first argument is the collection. That is two questions, so make two passes: first find the elements, then find the field accesses on them. A \`Set\` suits both, because you only care whether an id is an element (not how often), and each field name should appear once.

**The solution, line by line.**

- \`function fieldsTouched(insts, arr) {\` takes the instruction list and the id of the collection value.
- \`  const els = new Set();\` will hold the ids of elements.
- \`  for (const i of insts)\` / \`    if (i.op === 'index.get' &&\` / \`        i.args[0] === arr)\` / \`      els.add(i.id);\` is the first pass: an \`index.get\` whose array is \`arr\` makes an element, and the element *is* the instruction's own id (in SSA, an instruction and the value it makes are the same thing).
- \`  const fs = new Set();\` will hold field names.
- \`  for (const i of insts) {\` starts the second pass.
- \`    const f = i.op === 'field.get' ||\` / \`      i.op === 'field.set';\` asks whether this is a field access at all.
- \`    if (f && els.has(i.args[0]))\` / \`      fs.add(i.field);\` keeps it only if its object is one of our elements.
- \`  return [...fs].sort();\` turns the set into a sorted array, as the tests expect.

Trace the first test: \`%13\` is \`index.get %12, %7\`, so \`%13\` is an element; \`%16\` is an element of \`%15\`, a different collection. Then \`field.get %13 .x\` counts, \`field.get %16 .vx\` does not, \`field.get %99 .log\` does not, and \`field.set %13, %17 .x\` adds \`x\` again (the set ignores it). Answer: \`['x']\`.

**Common wrong attempts.**

- Collecting every \`field.get\` and \`field.set\` in the list includes \`console.log\`'s \`.log\` and other collections' fields.
- Checking \`i.args[0] === arr\` for the field access looks for fields on the *array*, not its elements, and finds nothing.

Two passes are enough because an \`index.get\` always comes before the accesses that use its result. The real analysis also follows elements through bindings and function parameters, and groups the accesses per loop using the natural loops of the chapter *Loops*, so the planner knows which loop touches what.`,
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
  escapes: {
    optional: true,
    title: 'Does an element escape?',
    prompt: 'Write `escapes(insts, arr)`. As before, the result of an `index.get` whose first argument is `arr` is an element. Return `true` if any element is an argument of an `opaque` or `call` instruction (anywhere in its `args`), and `false` otherwise. Field reads of an element (`field.get`) do not make it escape.',
    starter: `function escapes(insts, arr) {
  // your code here
  return false;
}`,
    solution: `function escapes(insts, arr) {
  const els = new Set();
  for (const i of insts)
    if (i.op === 'index.get' &&
        i.args[0] === arr)
      els.add(i.id);
  const bad = ['opaque', 'call'];
  return insts.some((i) =>
    bad.includes(i.op) &&
    i.args.some((a) => els.has(a)));
}`,
    tests: `test('a template literal takes an element', () => {
  expect(escapes([
    { id: 15, op: 'index.get', args: [13, 14] },
    { id: 16, op: 'opaque', args: [15], note: 'template' },
  ], 13)).toBe(true);
});
test('a call with an element', () => {
  expect(escapes([
    { id: 4, op: 'index.get', args: [2, 3] },
    { id: 6, op: 'call', args: [5, 4] },
  ], 2)).toBe(true);
});
test('field reads alone are fine', () => {
  expect(escapes([
    { id: 4, op: 'index.get', args: [2, 3] },
    { id: 5, op: 'field.get', args: [4], field: 'x' },
    { id: 6, op: 'call', args: [7, 5] },
  ], 2)).toBe(false);
});
test('another collection', () => {
  expect(escapes([
    { id: 4, op: 'index.get', args: [9, 3] },
    { id: 6, op: 'opaque', args: [4] },
  ], 2)).toBe(false);
});`,
    hints: [
      'Reuse the first pass of `fieldsTouched`: collect the element ids.',
      'Then look for an instruction whose `op` is `opaque` or `call` and whose `args` include an element id.',
      '`insts.some((i) => ...)` and `i.args.some((a) => els.has(a))` answer “is there one?” directly.',
    ],
    walkthrough: `**How to think about it.** An element escapes, for this exercise, when it is handed to code the analysis cannot see into: an \`opaque\` (anything not modelled) or a \`call\` (an unknown function). Reading a field from the element is fine, and passing that field's *value* (a number) to a call is fine too, because the element itself never leaves. So find the elements, then ask whether any of them appears in the arguments of a dangerous instruction.

**The solution, line by line.**

- \`const els = new Set();\` and the loop after it collect element ids, exactly as in \`fieldsTouched\`.
- \`const bad = ['opaque', 'call'];\` lists the operations that may keep or change what they are given.
- \`return insts.some((i) =>\` asks "is there at least one instruction such that…".
- \`bad.includes(i.op) &&\` it is opaque or a call, and
- \`i.args.some((a) => els.has(a)));\` one of its arguments is an element.

In the third test, \`%5\` is a field value, not an element, so \`call %7, %5\` does not count, and the answer is \`false\`.

**Common wrong attempts.**

- Checking only \`i.args[0]\` misses \`call %5, %4\`, where the callee is first and the element second.
- Treating every use of an element as an escape (including \`field.get\`) would refuse every collection, since reading fields is the whole point. The real analysis lists the uses it knows how to rewrite, and refuses on anything else.`,
    wrong: [
      {
        code: `function escapes(insts, arr) {
  const els = new Set();
  for (const i of insts)
    if (i.op === 'index.get' &&
        i.args[0] === arr)
      els.add(i.id);
  return insts.some((i) =>
    i.op === 'opaque' &&
    els.has(i.args[0]));
}`,
        why: 'Calls are dangerous too, and an element can be any argument, not only the first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In VIR, how does `let t = 0; for (…) t = t + v;` show up, if no closure captures `t`?',
    options: [
      {
        t: 'As `store t` and `load t` instructions',
        why: 'Those are for bindings. An uncaptured local becomes SSA values instead.',
      },
      {
        t: 'As an `opaque` instruction',
        why: 'Plain assignments are fully modelled.',
      },
      {
        t: 'As SSA values, joined by a phi at the loop header',
        correct: true,
        why: 'Each assignment defines a new value; the phi picks the right one on each path into the header.',
      },
      {
        t: 'It disappears completely',
        why: 'Its values are still there, just without the name `t`.',
      },
    ],
  },
  {
    q: 'In VIR, block `b3` has predecessors `b1 b2` and starts with `%4 = phi %2, %3`. What does that phi mean?',
    options: [
      {
        t: 'Add `%2` and `%3`',
        why: 'A phi does no arithmetic; it chooses.',
      },
      {
        t: '`%4` is `%2` when control came from `b1`, and `%3` when it came from `b2`',
        correct: true,
        why: 'Arguments are in predecessor order; the edge taken picks one.',
      },
      {
        t: '`%4` is whichever of the two was defined last',
        why: 'Both are defined once; which applies depends on the path, not on time.',
      },
      {
        t: 'Run both branches and keep the larger result',
        why: 'Only one branch runs; the phi names the value from the one that did.',
      },
    ],
  },
  {
    q: 'Which variable does the JavaScript plugin turn into a binding rather than SSA values?',
    options: [
      {
        t: 'A loop counter `i` used only in its loop',
        why: 'An uncaptured local: it becomes SSA, with a phi in the header.',
      },
      {
        t: '`n`, assigned inside an arrow function that is called in a loop',
        correct: true,
        why: 'A call to the closure can change `n` at any time, which phis can’t describe.',
      },
      {
        t: 'A parameter that is only read',
        why: 'It is a `param` value, used directly.',
      },
      {
        t: 'A temporary like `ps[i].x * 2`',
        why: 'Temporaries are always plain SSA values.',
      },
    ],
  },
  {
    q: 'Why does the JavaScript plugin make every variable initialised with an array a binding?',
    options: [
      {
        t: 'Arrays are too big for SSA',
        why: 'SSA values are references; size doesn’t matter.',
      },
      {
        t: 'So the analyses can see every read and write of a candidate collection as a `load` or `store`',
        correct: true,
        why: 'Collection discovery and safety analysis follow the binding’s loads and check its stores.',
      },
      {
        t: 'Because arrays are always captured',
        why: 'Many aren’t. The rule is about making uses visible.',
      },
      {
        t: 'Because JavaScript copies arrays on assignment',
        why: 'It doesn’t: arrays are references.',
      },
    ],
  },
  {
    q: 'What do VIR instructions keep in their `src` field, and why?',
    options: [
      {
        t: 'A copy of the whole program, for safety',
        why: 'The module stores the source once; instructions only point into it.',
      },
      {
        t: 'Nothing: VIR is independent of the source',
        why: 'Language-neutral doesn’t mean disconnected. Emit needs to know where to edit.',
      },
      {
        t: 'The plugin’s syntax node, offsets and line, so emit can replace that range and explain can name the line',
        correct: true,
        why: 'That is how a decision made on VIR turns into an edit of your text.',
      },
      {
        t: 'The generated machine code',
        why: 'Viscosity never generates machine code.',
      },
    ],
  },
  {
    q: 'Why does VIR have `field.get` and `index.get` instead of a general “load from memory”?',
    options: [
      {
        t: 'Because JavaScript has no memory addresses',
        why: 'True, but VIR is chosen for its analyses, not only to match JavaScript.',
      },
      {
        t: 'So the layout analyses can read “which element, which field” directly',
        correct: true,
        why: 'Those facts are the analyses’ whole subject. A lower-level IR would hide them behind patterns.',
      },
      {
        t: 'To make the program run faster',
        why: 'VIR is never run. It is only analysed.',
      },
      {
        t: 'Because SSA requires it',
        why: 'SSA is about how values are defined, not which operations exist.',
      },
    ],
  },
  {
    q: 'A program uses a template literal with an element, `` `${ps[0]}` ``. What happens?',
    options: [
      {
        t: 'Viscosity crashes: it cannot lower templates',
        why: 'It can lower anything: what it does not model becomes opaque.',
      },
      {
        t: 'The template is ignored, and `ps` becomes SoA',
        why: 'Ignoring a use would be unsound: it could observe the element.',
      },
      {
        t: 'It lowers to an `opaque` whose argument is the element, so `ps` is kept and explain says why',
        correct: true,
        why: 'An opaque takes every variable its code mentions, and its arguments are treated as escaping: conservative soundness.',
      },
      {
        t: 'Viscosity rewrites the template to use columns',
        why: 'It does not model templates, so it cannot rewrite them.',
      },
    ],
  },
  {
    q: 'A loop body’s VIR is `%5 = index.get %2, %1`, `%6 = field.get %5 .y`, `field.set %5, %6 .x`, where `%2` is a load of `ps`. Which fields of `ps` does it touch?',
    options: [
      {
        t: 'Reads `y`, writes `x`',
        correct: true,
        why: '`%5` is an element; `.y` is read from it and `.x` is written to it.',
      },
      {
        t: 'Reads `x` and `y`',
        why: '`field.set` is a write, not a read.',
      },
      {
        t: 'None: it never mentions `ps` by name',
        why: 'VIR never mentions names in instructions; `%2` is the load of `ps`.',
      },
      {
        t: 'Writes `y`',
        why: 'The written field is the one named on the `field.set`: `.x`.',
      },
    ],
  },
  {
    q: 'Which JavaScript expression does the plugin lower to an `intrinsic`?',
    options: [
      {
        t: '`console.log(x)`',
        why: 'That is a method call: `field.get .log` then `call`.',
      },
      {
        t: '`Math.sqrt(x)`, when `Math` is the global',
        correct: true,
        why: 'A known numeric function that keeps no reference to its argument.',
      },
      {
        t: '`ps.push(p)`',
        why: 'That is VIR’s own `push` instruction.',
      },
      {
        t: '`Math.sqrt(x)`, even if a local variable is named `Math`',
        why: 'A local `Math` could be anything, so it is an ordinary call.',
      },
    ],
  },
  {
    q: 'Opaque instructions treat all their arguments as escaping. What is the cost of that rule?',
    options: [
      {
        t: 'Sometimes wrong output',
        why: 'Never: assuming the worst can only stop a rewrite.',
      },
      {
        t: 'Slower compilation',
        why: 'The rule is cheap; it is one check per argument.',
      },
      {
        t: 'Some collections that would have been safe to change are kept as they were',
        correct: true,
        why: 'That is the price of soundness: a missed speed-up, explained by name, instead of a broken program.',
      },
      {
        t: 'Nothing at all',
        why: 'It does cost something: missed optimisations.',
      },
    ],
  },
];
