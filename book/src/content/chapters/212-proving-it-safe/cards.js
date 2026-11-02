// Chapter 212 cards. Keys are stable ids: never rename them.

export const prompts = {
  'sa-what': {
    q: 'What property does Viscosity’s safety analysis prove?',
    a: 'That no code in the program can observe the layout change.',
  },
  'sa-allow': {
    q: 'Why is the safety check an allow-list rather than a list of forbidden uses?',
    a: 'Anything not known to be rewritable might observe the layout. Listing the few safe uses is the only way to be sure nothing is missed.',
  },
  'sa-all': {
    q: 'Does Viscosity stop checking a collection at the first bailout reason?',
    a: 'No. It collects every reason (without duplicates), so explain can list everything to change.',
  },
  'sa-array': {
    q: 'Which four uses of the array itself are allowed?',
    a: '`.length`, `push` of one fresh object literal, `ps[i]`, and passing it to a known function whose every call passes it.',
  },
  'sa-why-length': {
    q: '`ps.reverse()` gives two reasons. What are they?',
    a: 'It reads a property other than `.length`/`.push` (“uses .reverse on the array”), and passes `ps` as the receiver of a method call.',
  },
  'sa-known': {
    q: 'What makes a function “known” to Viscosity?',
    a: 'It is declared once, and every reference to it is a direct call (not a method call, not stored or passed around), so all its call sites are visible.',
  },
  'sa-mixed': {
    q: '`total(a)` and `total(b)` are both called. Why do both collections bail out?',
    a: 'The parameter would point at two collections. Viscosity doesn’t make two copies of `total`, so “passed to total(), which is also called with other values”.',
  },
  'sa-export': {
    q: 'Why is an exported function never a known function?',
    a: 'Code in another module may call it with anything, so not every call site is visible.',
  },
  'sa-index': {
    q: 'Why must every index into the collection be provably a number?',
    a: 'A string index asks for a property: `ps[\'length\']` isn’t an element. After the rewrite, such accesses would mean something else.',
  },
  'sa-aot': {
    q: 'Why must a source-to-source compiler prove safety, where a run-time system could check as it goes?',
    a: 'Once its output runs, nothing of the compiler is left to notice a surprise and undo the change.',
  },
};

export const examples = {
  keys: {
    title: 'Strings that are (and aren’t) indexes',
    code: `const ps = [{ x: 1 }, { x: 2 }];
for (const k of [1, '1', 'length']) {
  console.log(k, ps[k]);
}
// '1' finds an element, but 'length'
// finds a property. With only a
// string in hand, Viscosity can't
// tell which you meant.`,
  },
};

export const exercises = {
  firstBailout: {
    title: 'A tiny safety checker',
    prompt:
      'A collection with fields `fields` has a list of uses, each `{ on, op, line }` plus extras. `on` is `\'array\'` or `\'element\'`. Write `firstBailout(fields, uses)`, returning the first reason as `\'line N: \' + reason`, or `null` if all are safe.\n\n- Array uses: `\'length\'` is safe; `\'push\'` is safe if `fresh` is `true`; `\'index\'` is safe if `num` is `true`, otherwise the reason is `\'index may not be a number\'`. Anything else: `\'array used by OP\'`.\n- Element uses: `\'get\'` and `\'set\'` are safe if `field` is in `fields`, otherwise the reason is `\'unknown field .F\'`. Anything else: `\'element used by OP\'`.',
    starter: `function firstBailout(fields, uses) {
  // your code here
  return null;
}

console.log(firstBailout(['x'], [
  { on: 'array', op: 'length',
    line: 3 },
  { on: 'array', op: 'sort',
    line: 4 },
]));`,
    solution: `function firstBailout(fields, uses) {
  for (const u of uses) {
    const r = reason(fields, u);
    if (r) return 'line ' + u.line +
      ': ' + r;
  }
  return null;
}

function reason(fields, u) {
  if (u.on === 'array') {
    if (u.op === 'length') return null;
    if (u.op === 'push' && u.fresh)
      return null;
    if (u.op === 'index')
      return u.num ? null
        : 'index may not be a number';
    return 'array used by ' + u.op;
  }
  if (u.op === 'get' || u.op === 'set')
    return fields.includes(u.field)
      ? null
      : 'unknown field .' + u.field;
  return 'element used by ' + u.op;
}`,
    tests: `test('a safe collection', () => {
  expect(firstBailout(['x', 'vx'], [
    { on: 'array', op: 'push', fresh: true, line: 2 },
    { on: 'array', op: 'length', line: 4 },
    { on: 'array', op: 'index', num: true, line: 5 },
    { on: 'element', op: 'get', field: 'vx', line: 5 },
    { on: 'element', op: 'set', field: 'x', line: 5 },
  ])).toBe(null);
});
test('an array method', () => {
  expect(firstBailout(['x'], [
    { on: 'array', op: 'length', line: 3 },
    { on: 'array', op: 'sort', line: 4 },
  ])).toBe('line 4: array used by sort');
});
test('pushing something that is not a fresh literal', () => {
  expect(firstBailout(['x'], [
    { on: 'array', op: 'push', fresh: false, line: 6 },
  ])).toBe('line 6: array used by push');
});
test('a string index', () => {
  expect(firstBailout(['x'], [
    { on: 'array', op: 'index', num: false, line: 6 },
  ])).toBe('line 6: index may not be a number');
});
test('an element compared with ===', () => {
  expect(firstBailout(['x'], [
    { on: 'element', op: 'get', field: 'x', line: 4 },
    { on: 'element', op: '===', line: 7 },
  ])).toBe('line 7: element used by ===');
});
test('a field outside the shape', () => {
  expect(firstBailout(['x'], [
    { on: 'element', op: 'set', field: 'z', line: 5 },
  ])).toBe('line 5: unknown field .z');
});
test('the first reason wins', () => {
  expect(firstBailout(['x'], [
    { on: 'element', op: 'call', line: 2 },
    { on: 'array', op: 'map', line: 3 },
  ])).toBe('line 2: element used by call');
});`,
    hints: [
      'Write a helper that returns a reason string for one use, or `null` if it is safe. Then the main function is a loop.',
      'Handle `on === \'array\'` and `on === \'element\'` separately. Each has a short list of safe ops; everything else falls through to a generic reason.',
      'The generic reasons use the op itself: `\'array used by \' + u.op`.',
    ],
    walkthrough: `This is the shape of Viscosity’s check, with the worklist flattened into a list.

- **Allow-list, then a catch-all.** Each branch first returns \`null\` for the few uses that can be rewritten, then ends with a reason that names the op. Nothing new can slip through: an op nobody thought of (\`sort\`, \`===\`, \`for-in key\`) lands in the catch-all automatically.
- **Some uses are safe only with a condition.** \`push\` must add a fresh literal (otherwise the record might have another name, chapter 210). \`index\` must use a number. \`get\`/\`set\` must name a field of the shape.
- **Reasons, not just a verdict.** Returning the reason with its line is what lets \`viscosity explain\` say what to change. The real engine keeps *all* the reasons rather than the first; the first is enough to make the decision.`,
    wrong: [
      {
        code: `function firstBailout(fields, uses) {
  const bad = ['sort', 'map', 'call'];
  for (const u of uses) {
    if (bad.includes(u.op))
      return 'line ' + u.line + ': ' +
        u.on + ' used by ' + u.op;
  }
  return null;
}`,
        why: 'A block-list only catches the uses you thought of. `===`, a string index, an unknown field and a non-fresh push all slip through and the collection is called safe.',
      },
      {
        code: `function firstBailout(fields, uses) {
  for (const u of uses) {
    const ok = ['length', 'push',
      'index', 'get', 'set'];
    if (!ok.includes(u.op))
      return 'line ' + u.line + ': ' +
        u.on + ' used by ' + u.op;
  }
  return null;
}`,
        why: 'The ops are right but their conditions are ignored: a push of a shared record, a string index and a write to a new field are all accepted.',
      },
    ],
  },
  followParam: {
    optional: true,
    title: 'Can Viscosity follow the call?',
    prompt:
      'A function is `{ stores, refs }`: `stores` is how many times its name is assigned (a declaration counts as one), and each ref is `{ call: true, args: [...] }` for a direct call or `{ call: false }` for any other use. Write `followParam(fn, k, name)` for a call that passes the collection `name` as argument `k`. Return `\'unknown\'` if the function isn’t known (`stores !== 1`, or any ref isn’t a direct call). Otherwise return `\'follow\'` if every call passes `name` at position `k`, and `\'mixed\'` if not.',
    starter: `function followParam(fn, k, name) {
  // your code here
}

console.log(followParam({
  stores: 1,
  refs: [{ call: true, args: ['ps'] }],
}, 0, 'ps'));`,
    solution: `function followParam(fn, k, name) {
  if (fn.stores !== 1) return 'unknown';
  if (fn.refs.some((r) => !r.call))
    return 'unknown';
  const all = fn.refs.every(
    (r) => r.args[k] === name);
  return all ? 'follow' : 'mixed';
}`,
    tests: `test('drift(bodies, 0.5); drift(bodies, -0.25)', () => {
  expect(followParam({ stores: 1, refs: [
    { call: true, args: ['bodies', '0.5'] },
    { call: true, args: ['bodies', '-0.25'] },
  ] }, 0, 'bodies')).toBe('follow');
});
test('total(a); total(b)', () => {
  expect(followParam({ stores: 1, refs: [
    { call: true, args: ['a'] },
    { call: true, args: ['b'] },
  ] }, 0, 'a')).toBe('mixed');
});
test('const go = step: not only direct calls', () => {
  expect(followParam({ stores: 1, refs: [
    { call: true, args: ['ps'] },
    { call: false },
  ] }, 0, 'ps')).toBe('unknown');
});
test('reassigned function', () => {
  expect(followParam({ stores: 2, refs: [
    { call: true, args: ['ps'] },
  ] }, 0, 'ps')).toBe('unknown');
});
test('a missing argument is not the collection', () => {
  expect(followParam({ stores: 1, refs: [
    { call: true, args: ['ps'] },
    { call: true, args: [] },
  ] }, 0, 'ps')).toBe('mixed');
});`,
    hints: [
      'First decide whether the function is known at all: one store, and every ref a direct call.',
      'Then check position `k` of every call’s `args`.',
    ],
    walkthrough: `These are the two steps of Viscosity’s interprocedural rule. **Known** means the call graph is complete for this function: one definition, and no reference that could hand the function to someone else, who could then call it with anything. **Follow** means the parameter has exactly one possible collection, so it can be treated as another name for it. The two failures give different explain messages: an unknown function is just an escape (“passed to a function call”), while a known function with mixed callers gets “which is also called with other values”.

One case in the real engine is subtler than this model: an alias like \`const go = step\` that the front-end keeps as an SSA value isn’t a separate reference at all, so \`go(ps)\` counts as a direct call. That is why the tests describe refs, not source text.`,
    wrong: [
      {
        code: `function followParam(fn, k, name) {
  if (fn.stores !== 1) return 'unknown';
  const all = fn.refs.every((r) =>
    !r.call || r.args[k] === name);
  return all ? 'follow' : 'mixed';
}`,
        why: 'A reference that isn’t a direct call is skipped instead of making the function unknown. Whoever receives the function could call it with any argument.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does Viscosity do with a use of the collection that isn’t on its allow-list?',
    options: [
      { t: 'Ignores it, if it looks harmless', why: 'Nothing is ignored. Unknown means unsafe.' },
      { t: 'Inserts a run-time check', why: 'Viscosity doesn’t guard unknown uses; it leaves the collection alone.' },
      { t: 'Records a bailout reason and keeps checking', correct: true, why: 'Every reason is collected, then the planner keeps the array of objects.' },
      { t: 'Rewrites it into a call to a helper', why: 'That would only be possible for uses it knows how to rewrite, which is what the allow-list is.' },
    ],
  },
  {
    q: 'Which use of `ps` is on the allow-list?',
    options: [
      { t: '`ps.forEach(f)`', why: 'Only `.length` and `.push` may be read off the array.' },
      { t: '`ps.push({ x: 1, y: 2 })`', correct: true, why: 'A push of one fresh literal becomes `ps.push(1, 2)` on the columns.' },
      { t: '`console.log(ps)`', why: 'Passing the array to a method call is an escape.' },
      { t: '`return ps`', why: 'Returning hands it to code Viscosity doesn’t control: “returned or branched on”.' },
    ],
  },
  {
    q: '`function step(qs)` is declared once and called as `step(ps)` twice. What does Viscosity do?',
    options: [
      { t: 'Bails out: any call is an escape', why: 'Not for known functions: here every call site is visible.' },
      { t: 'Inlines `step` at both calls', why: 'Viscosity doesn’t inline. It follows the parameter.' },
      { t: 'Bails out because `step` is called twice', why: 'The number of calls doesn’t matter; what they pass does.' },
      { t: 'Treats `qs` as another name for `ps` and checks its uses inside `step`', correct: true, why: 'Every call passes `ps` at that position, so `qs` can only be `ps`.' },
    ],
  },
  {
    q: 'The same program, but `step` is `export function step(qs)`. What changes?',
    options: [
      { t: 'Nothing; `export` is only about modules', why: 'Modules are exactly the point: another module can call it.' },
      { t: '`step` is no longer known, so passing `ps` to it is an escape', correct: true, why: 'Not every call site is visible, so explain says “passed to a function call”.' },
      { t: 'Viscosity rewrites the other modules too', why: 'It compiles one file and can’t see who imports it.' },
      { t: 'The collection becomes AoSoA', why: 'Unsafe collections are never transformed.' },
    ],
  },
  {
    q: 'Why does `const k = \'3\'; ps[k].x` make Viscosity bail out, even though it reads element 3?',
    options: [
      { t: 'Strings are slower indexes', why: 'Speed isn’t the issue.' },
      { t: 'The value 3 is out of bounds', why: 'Bounds are a separate question, with their own checks.' },
      { t: 'Viscosity only proves that `k` may not be a number, and a string index could name a property such as `length`', correct: true, why: 'It doesn’t reason about which strings happen to look like indexes; it requires a number.' },
      { t: 'Only constants may be indexes', why: 'Any value proven to be a number is fine, including `i` and parameters of known functions.' },
    ],
  },
  {
    q: 'A collection has two bailout reasons. What is the first thing the planner does?',
    options: [
      { t: 'Keeps the array of objects and prints each reason after “unsafe:”', correct: true, why: 'The bailout check comes before every cost question in `plan.ts`.' },
      { t: 'Checks whether it is big enough to be worth it', why: 'Cost is only considered for safe collections.' },
      { t: 'Fixes the first reason and tries again', why: 'Viscosity never changes your program to make it safe; explain tells you what to change.' },
      { t: 'Transforms it if an annotation asks', why: 'An annotation can’t override safety. Bailouts are checked first.' },
    ],
  },
];
