// Chapter 123 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ea67-puzzle': {
    q: 'In this book’s benchmark run, why didn’t struct of arrays lose on `get-objects`, even though it builds an object per element?',
    a: 'V8 inlined the small consumer function and then removed the temporary object, so no allocation was left.',
  },
  'ea67-inline-first': {
    q: 'Why does V8 usually need to inline `consume(p)` before it can remove `p`?',
    a: 'Before inlining, `p` is passed to a call the compiler can’t see into, so as far as it knows, `p` escapes.',
  },
  'ea67-virtual': {
    q: 'In TurboFan’s escape analysis, what is a *virtual object*?',
    a: 'An allocation the analysis tracks without assuming it exists, with each field followed as a variable.',
  },
  'scalar-what': {
    q: 'What is *scalar replacement*?',
    a: 'Replacing an object that doesn’t escape with its fields as separate local values, so field reads become plain values.',
  },
  'sink-what': {
    q: 'What is *allocation sinking*?',
    a: 'Moving an allocation to the only places that need a real object, such as a deopt exit, and removing it from the fast path.',
  },
  'ea67-escaped': {
    q: 'According to V8’s source, an object counts as escaped when what happens to it?',
    a: 'It reaches memory the analysis doesn’t track, or it is used by an operation that needs it to really exist.',
  },
  'ea67-deopt': {
    q: 'A guard fails in a loop whose temporary object was removed. How does the interpreter get its object?',
    a: 'The deopt frame state describes the object by its field values, and the deoptimizer builds (materializes) it then.',
  },
  'ea67-materialize': {
    q: 'Why can’t V8 remove the allocations in the `materialize` suite?',
    a: 'Each object is stored into an array that outlives the loop: it escapes, and its identity can be observed.',
  },
  'ea67-evidence': {
    q: 'On this book’s machine, what changed when the loop with `len2({...})` was run with `--no-turbo-escape`?',
    a: 'Young-generation collections went from a handful to about 1700, because every temporary object was really allocated.',
  },
  'ea67-late': {
    q: 'What does Turboshaft’s late escape analysis remove?',
    a: 'Allocations whose only uses are the stores that initialize the object.',
  },
  'ea67-viscosity': {
    q: 'Why must Viscosity be stricter than V8 about escapes?',
    a: 'It runs ahead of time, without deoptimization to fall back on, so it must prove safety on the code as written.',
  },
};

export const examples = {};

export const exercises = {
  scalarReplace: {
    title: 'Scalar-replace a small object',
    prompt:
      'A tiny IR is a list of instructions:\n\n- `{ op: \'new\', dst, fields }`: `dst = { ... }`, where `fields` maps each name to a variable\n- `{ op: \'get\', dst, obj, key }`: `dst = obj.key`\n- `{ op: \'set\', obj, key, src }`: `obj.key = src`\n- `{ op: \'add\', dst, a, b }`, `{ op: \'mov\', dst, src }`, `{ op: \'call\', fn, args }`, `{ op: \'ret\', src }`\n\nWrite `scalarReplace(code)`. An object made by `new` **escapes** if its variable is ever used as a *value*: a field value in a `new`, the `src` of a `set` or `mov`, an argument, an `add` operand, or returned. Being the `obj` of a `get` or `set` is fine. For each `new` that doesn’t escape, replace it with one `mov` per field into `dst_key` (in field order), turn its `get`s into `mov`s from `obj_key`, and its `set`s into `mov`s to `obj_key`. Leave everything else as it is, and don’t change the input.',
    starter: `function scalarReplace(code) {
  // 1. find objects that never escape
  // 2. rewrite new / get / set on them
  return code;
}`,
    solution: `function valueUses(i) {
  switch (i.op) {
    case 'new':
      return Object.values(i.fields);
    case 'set': case 'mov': case 'ret':
      return [i.src];
    case 'add': return [i.a, i.b];
    case 'call': return i.args;
    default: return [];
  }
}

function scalarReplace(code) {
  const escapes = (v) => code.some(
    (i) => valueUses(i).includes(v));
  const virt = new Set();
  for (const i of code) {
    const n = i.op === 'new';
    if (n && !escapes(i.dst)) {
      virt.add(i.dst);
    }
  }
  const out = [];
  for (const i of code) {
    const f = (o, k) => o + '_' + k;
    if (i.op === 'new' &&
        virt.has(i.dst)) {
      for (const k in i.fields) {
        out.push({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] });
      }
    } else if (i.op === 'get' &&
        virt.has(i.obj)) {
      out.push({ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) });
    } else if (i.op === 'set' &&
        virt.has(i.obj)) {
      out.push({ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src });
    } else {
      out.push(i);
    }
  }
  return out;
}`,
    tests: `const N = (dst, fields) =>
  ({ op: 'new', dst, fields });
const G = (dst, obj, key) =>
  ({ op: 'get', dst, obj, key });
const S = (obj, key, src) =>
  ({ op: 'set', obj, key, src });
const M = (dst, src) =>
  ({ op: 'mov', dst, src });
const R = (src) => ({ op: 'ret', src });
test('a non-escaping object vanishes', () => {
  const code = [
    N('p', { x: 'a', y: 'b' }),
    G('t', 'p', 'x'), G('u', 'p', 'y'),
    { op: 'add', dst: 's', a: 't', b: 'u' },
    R('s'),
  ];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), M('p_y', 'b'),
    M('t', 'p_x'), M('u', 'p_y'),
    { op: 'add', dst: 's', a: 't', b: 'u' },
    R('s'),
  ]);
});
test('writes become moves too', () => {
  const code = [N('p', { x: 'a' }),
    S('p', 'x', 'b'), G('t', 'p', 'x'),
    R('t')];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), M('p_x', 'b'),
    M('t', 'p_x'), R('t')]);
});
test('passing it to a call escapes', () => {
  const code = [N('p', { x: 'a' }),
    { op: 'call', fn: 'f', args: ['p'] },
    G('t', 'p', 'x'), R('t')];
  expect(scalarReplace(code)).toEqual(code);
});
test('returning it escapes', () => {
  const code = [N('p', { x: 'a' }), R('p')];
  expect(scalarReplace(code)).toEqual(code);
});
test('storing it somewhere escapes', () => {
  const code = [N('p', { x: 'a' }),
    S('out', 'last', 'p'), R('a')];
  expect(scalarReplace(code)).toEqual(code);
  const nested = [N('p', { x: 'a' }),
    N('q', { inner: 'p' }),
    G('t', 'q', 'inner'), R('t')];
  const r = scalarReplace(nested);
  expect(r[0]).toEqual(N('p', { x: 'a' }));
});
test('each object is judged alone', () => {
  const code = [N('p', { x: 'a' }),
    N('q', { x: 'b' }),
    G('t', 'p', 'x'), R('q')];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), N('q', { x: 'b' }),
    M('t', 'p_x'), R('q')]);
});
test('the input is left alone', () => {
  const code = [N('p', { x: 'a' }),
    G('t', 'p', 'x'), R('t')];
  const copy = JSON.stringify(code);
  scalarReplace(code);
  expect(JSON.stringify(code)).toBe(copy);
});`,
    hints: [
      'Write `valueUses(i)`: the variables instruction `i` reads *as values*. For `get` that is nothing (its `obj` is fine); for `set` it is only `src`.',
      'An object escapes if any instruction lists it in `valueUses`. Put the `dst` of every `new` that doesn’t escape into a set.',
      'Then build a new array: a virtual `new` becomes one `mov` per field, a `get` or `set` on a virtual object becomes a `mov` from or to `obj + \'_\' + key`, and everything else is copied across.',
    ],
    walkthrough: `This is the same two-step move TurboFan makes, on a toy IR: decide, then rewrite.

\`\`\`js
case 'set': case 'mov': case 'ret':
  return [i.src];
\`\`\`

- **Where can a reference leak?** Only where the object is used as a *value*: stored into something, copied, passed, returned or put inside another object. Using it as the target of \`.x\` is safe, because that only touches its fields. TurboFan's escape analysis makes the same distinction: a field store into a tracked object is recorded and deleted, while a use it can't follow marks the object as escaped.

\`\`\`js
const n = i.op === 'new';
if (n && !escapes(i.dst)) {
  virt.add(i.dst);
}
\`\`\`

- **Decide first, for each allocation separately.** \`p\` and \`q\` in the same code can get different verdicts.

\`\`\`js
out.push({ op: 'mov', dst: i.dst,
  src: f(i.obj, i.key) });
\`\`\`

- **Scalar replacement.** Each field becomes its own variable, \`p_x\`. A read of \`p.x\` becomes a copy of \`p_x\`, a write becomes an assignment to it. After this, nothing mentions \`p\`, and the allocation is gone.
- **New objects, new array.** Building \`out\` instead of editing \`code\` keeps the input intact, which the last test checks. A real compiler pass must not corrupt the IR it reads either.`,
    wrong: [
      {
        code: `function scalarReplace(code) {
  const virt = new Set(code
    .filter((i) => i.op === 'new')
    .map((i) => i.dst));
  const f = (o, k) => o + '_' + k;
  return code.flatMap((i) => {
    if (i.op === 'new') {
      return Object.keys(i.fields).map(
        (k) => ({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] }));
    }
    if (i.op === 'get' &&
        virt.has(i.obj)) {
      return [{ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) }];
    }
    if (i.op === 'set' &&
        virt.has(i.obj)) {
      return [{ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src }];
    }
    return [i];
  });
}`,
        why: 'This replaces every object, escaping or not. If `p` is passed to `f` or returned, the caller gets a variable that no longer holds an object: the program’s behaviour changes. The escape check is the whole point.',
      },
      {
        code: `function scalarReplace(code) {
  const escapes = (v) => code.some(
    (i) => i.op === 'call' &&
      i.args.includes(v));
  const virt = new Set();
  for (const i of code) {
    if (i.op === 'new' &&
        !escapes(i.dst)) {
      virt.add(i.dst);
    }
  }
  const f = (o, k) => o + '_' + k;
  return code.flatMap((i) => {
    if (i.op === 'new' &&
        virt.has(i.dst)) {
      return Object.keys(i.fields).map(
        (k) => ({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] }));
    }
    if (i.op === 'get' &&
        virt.has(i.obj)) {
      return [{ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) }];
    }
    if (i.op === 'set' &&
        virt.has(i.obj)) {
      return [{ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src }];
    }
    return [i];
  });
}`,
        why: 'Calls are only one escape site. Returning the object, or storing it into another object, also lets someone else hold the reference.',
      },
    ],
  },
  rematerialize: {
    optional: true,
    title: 'Rebuild the object on deopt',
    prompt:
      'After scalar replacement, a deopt frame state describes a removed object as `{ fields: { x: \'p_x\', ... } }`: each field names the variable holding its value. A field may also hold another description (an object that was inside it). Write `materialize(desc, env)`, which builds a real object from the description, reading variables from `env`.',
    starter: `function materialize(desc, env) {
  return {};
}`,
    solution: `function materialize(desc, env) {
  const o = {};
  for (const k in desc.fields) {
    const v = desc.fields[k];
    o[k] = typeof v === 'string'
      ? env[v]
      : materialize(v, env);
  }
  return o;
}`,
    tests: `test('fields come from the variables', () => {
  const d = { fields: { x: 'p_x', y: 'p_y' } };
  expect(materialize(d, { p_x: 1, p_y: 2 }))
    .toEqual({ x: 1, y: 2 });
});
test('nested objects are rebuilt too', () => {
  const d = { fields: {
    pos: { fields: { x: 'a' } },
    m: 'b',
  } };
  expect(materialize(d, { a: 3, b: 4 }))
    .toEqual({ pos: { x: 3 }, m: 4 });
});
test('each deopt makes a fresh object', () => {
  const d = { fields: { x: 'p_x' } };
  const env = { p_x: 1 };
  const a = materialize(d, env);
  const b = materialize(d, env);
  expect(a === b).toBe(false);
});`,
    hints: [
      'Make an empty object and loop over the field names in `desc.fields`.',
      'A string names a variable: look it up in `env`. Anything else is another description: call `materialize` on it.',
    ],
    walkthrough: `TurboFan's escape-analysis reducer does a version of this when it writes the deopt information: for a virtual object it records an \`ObjectState\` with one input per field, and those inputs can themselves be virtual objects.

\`\`\`js
o[k] = typeof v === 'string'
  ? env[v]
  : materialize(v, env);
\`\`\`

- **Recursion follows the nesting.** An object that held another removed object needs both rebuilt, in the right shape.
- **Fresh every time.** The rebuilt object didn't exist before the deopt, so it is a new allocation. That is fine here, because the object never escaped: nothing outside could have kept its identity.`,
    wrong: [
      {
        code: `function materialize(desc, env) {
  const o = {};
  for (const k in desc.fields) {
    o[k] = env[desc.fields[k]];
  }
  return o;
}`,
        why: 'A nested description isn’t a variable name, so `env[...]` gives `undefined` and the inner object is lost.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which order of steps lets TurboFan remove the object in `t += len2({ x: xs[i], y: ys[i] })`?',
    options: [
      { t: 'Remove the allocation, then inline `len2`', why: 'Before inlining, the object is passed to a call, so the analysis must assume it escapes.' },
      { t: 'Inline `len2`, see that `p` is only used by field reads, then replace those reads with the stored values', correct: true, why: 'On this book’s machine, `--trace-turbo-inlining` shows len2 being inlined, and turning off either inlining or escape analysis brings the allocations back.' },
      { t: 'Convert the loop to struct of arrays', why: 'That is Viscosity’s move, ahead of time. V8 doesn’t change the layout of your data.' },
      { t: 'Let the garbage collector free each object right after the call', why: 'That still allocates every object; the collector only cleans up afterwards.' },
    ],
  },
  {
    q: 'After scalar replacement, where do `p.x` and `p.y` live?',
    options: [
      { t: 'In a hidden object on the heap', why: 'There is no object left; that is what was removed.' },
      { t: 'In the feedback vector', why: 'Feedback describes what operations saw, not the program’s values.' },
      { t: 'In a `Float64Array` that V8 creates', why: 'V8 doesn’t create columns; scalar replacement works on single values.' },
      { t: 'As separate local values, like `p_x` and `p_y`, which can sit in registers', correct: true, why: 'Each field becomes its own value, and reads of the field become uses of that value.' },
    ],
  },
  {
    q: 'A guard fails inside the optimized loop, after `p` was removed. What happens?',
    options: [
      { t: 'The deoptimizer builds a real `p` from the field values recorded in the frame state', correct: true, why: 'TurboFan writes an `ObjectState` for each virtual object into the deopt information, and V8’s concurrent-marking post lists “materialization during deoptimization” among the operations that create objects.' },
      { t: 'The program crashes, because the interpreter expects an object', why: 'Removing an object would be unsafe without a way to rebuild it; the frame state provides one.' },
      { t: 'V8 re-runs the loop from the start with the object', why: 'Deoptimization continues from the same point; re-running would repeat side effects.' },
      { t: 'The interpreter continues without `p`', why: 'The interpreter’s code still says `p.x`, so it needs a real `p`.' },
    ],
  },
  {
    q: 'In this book’s run, `materialize` was about 20–35× slower for SoA, while `get-objects` wasn’t slower at all. Why?',
    options: [
      { t: 'V8 doesn’t optimize loops that write arrays', why: 'It optimizes them fine; the allocations are the problem.' },
      { t: '`materialize` stores every object into an array that outlives the loop, so they escape and must exist', correct: true, why: 'Something outside can now read `out[i]` and compare identities. No analysis can remove those allocations.' },
      { t: '`materialize` uses six fields and `get-objects` uses two', why: 'Both build objects with all six fields.' },
      { t: 'The `materialize` objects are too big for the young generation', why: 'They are small objects; the cost is that each one must really be allocated.' },
    ],
  },
  {
    q: 'In V8 12.4 (Node 22), which statement matches `node --v8-options`?',
    options: [
      { t: 'Escape analysis is off unless you pass `--turbo-escape`', why: 'The help text says `default: --turbo-escape`: it is on.' },
      { t: 'Maglev’s escape analysis is on by default', why: '`--maglev-escape-analysis` defaults to off in this version, and Maglev itself is off in Node 22.' },
      { t: 'TurboFan’s escape analysis is on by default, and `--no-turbo-escape` turns it off', correct: true, why: 'That is why the default run of the `len2` loop needed only a handful of young collections.' },
      { t: 'V8 has no flag for escape analysis', why: 'It has several: `--turbo-escape`, `--trace-turbo-escape` and `--maglev-escape-analysis`.' },
    ],
  },
  {
    q: 'Viscosity, unlike V8, refuses to change the layout when an element is passed to `move(ps[i])`. Why is that the right choice for it?',
    options: [
      { t: 'Viscosity’s analysis is less accurate by mistake', why: 'It is cautious on purpose: it has different tools.' },
      { t: 'Function calls are always slow in JavaScript', why: 'Calls are cheap once inlined; the issue is what the callee might do with the object.' },
      { t: 'V8 forbids libraries from changing data layout', why: 'Nothing forbids it; Viscosity rewrites source code before V8 sees it.' },
      { t: 'It works ahead of time, with no inlining and no deoptimization, so it must prove the object never escapes in the code as written', correct: true, why: 'V8 can inline, speculate and bail out. Viscosity’s only safe answer to “might escape” is to keep the objects.' },
    ],
  },
];
