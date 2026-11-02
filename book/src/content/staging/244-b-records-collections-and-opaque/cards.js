// Chapter 244b cards (split from 244). Keys are stable ids: never rename them.

export const prompts = {
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
    a: 'Uncertainty can only stop a rewrite, never cause a wrong one. A missed optimization is safe; a wrong layout change is not.',
  },
};

export const examples = {
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
  fieldsTouched: {
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
    prompt:
      'Write `escapes(insts, arr)`. As before, the result of an `index.get` whose first argument is `arr` is an element. Return `true` if any element is an argument of an `opaque` or `call` instruction (anywhere in its `args`), and `false` otherwise. Field reads of an element (`field.get`) do not make it escape.',
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
    q: 'Why does VIR have `field.get` and `index.get` instead of a general “load from memory”?',
    options: [
      { t: 'Because JavaScript has no memory addresses', why: 'True, but VIR is chosen for its analyses, not only to match JavaScript.' },
      { t: 'So the layout analyses can read “which element, which field” directly', correct: true, why: 'Those facts are the analyses’ whole subject. A lower-level IR would hide them behind patterns.' },
      { t: 'To make the program run faster', why: 'VIR is never run. It is only analysed.' },
      { t: 'Because SSA requires it', why: 'SSA is about how values are defined, not which operations exist.' },
    ],
  },
  {
    q: 'A program uses a template literal with an element, `` `${ps[0]}` ``. What happens?',
    options: [
      { t: 'Viscosity crashes: it cannot lower templates', why: 'It can lower anything: what it does not model becomes opaque.' },
      { t: 'The template is ignored, and `ps` becomes SoA', why: 'Ignoring a use would be unsound: it could observe the element.' },
      { t: 'It lowers to an `opaque` whose argument is the element, so `ps` is kept and explain says why', correct: true, why: 'An opaque takes every variable its code mentions, and its arguments are treated as escaping: conservative soundness.' },
      { t: 'Viscosity rewrites the template to use columns', why: 'It does not model templates, so it cannot rewrite them.' },
    ],
  },
  {
    q: 'A loop body’s VIR is `%5 = index.get %2, %1`, `%6 = field.get %5 .y`, `field.set %5, %6 .x`, where `%2` is a load of `ps`. Which fields of `ps` does it touch?',
    options: [
      { t: 'Reads `y`, writes `x`', correct: true, why: '`%5` is an element; `.y` is read from it and `.x` is written to it.' },
      { t: 'Reads `x` and `y`', why: '`field.set` is a write, not a read.' },
      { t: 'None: it never mentions `ps` by name', why: 'VIR never mentions names in instructions; `%2` is the load of `ps`.' },
      { t: 'Writes `y`', why: 'The written field is the one named on the `field.set`: `.x`.' },
    ],
  },
  {
    q: 'Which JavaScript expression does the plugin lower to an `intrinsic`?',
    options: [
      { t: '`console.log(x)`', why: 'That is a method call: `field.get .log` then `call`.' },
      { t: '`Math.sqrt(x)`, when `Math` is the global', correct: true, why: 'A known numeric function that keeps no reference to its argument.' },
      { t: '`ps.push(p)`', why: 'That is VIR’s own `push` instruction.' },
      { t: '`Math.sqrt(x)`, even if a local variable is named `Math`', why: 'A local `Math` could be anything, so it is an ordinary call.' },
    ],
  },
  {
    q: 'Opaque instructions treat all their arguments as escaping. What is the cost of that rule?',
    options: [
      { t: 'Sometimes wrong output', why: 'Never: assuming the worst can only stop a rewrite.' },
      { t: 'Slower compilation', why: 'The rule is cheap; it is one check per argument.' },
      { t: 'Some collections that would have been safe to change are kept as they were', correct: true, why: 'That is the price of soundness: a missed speed-up, explained by name, instead of a broken program.' },
      { t: 'Nothing at all', why: 'It does cost something: missed optimizations.' },
    ],
  },
];
