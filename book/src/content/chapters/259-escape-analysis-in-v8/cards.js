// Chapter 98 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ea67-puzzle': {
    q: 'In this book’s benchmark run, why didn’t struct of arrays lose on `get-objects`, even though it builds an object per element?',
    a: 'V8 inlined the small consumer function and then removed the temporary object, so no allocation was left.',
  },
  'ea67-inline-first': {
    q: 'Why does V8 usually need to inline `consume(p)` before it can remove `p`?',
    a: 'Before inlining, `p` is passed to a call the compiler can’t see into, so as far as it knows, `p` escapes.',
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
    a: 'The deopt frame state describes the object by its field values, and the deoptimiser builds (materialises) it then.',
  },
  'ea67-materialize': {
    q: 'Why can’t V8 remove the allocations in the `materialize` suite?',
    a: 'Each object is stored into an array that outlives the loop: it escapes, and its identity can be observed.',
  },
  'ea67-viscosity': {
    q: 'Why must Viscosity be stricter than V8 about escapes?',
    a: 'It runs ahead of time, without deoptimisation to fall back on, so it must prove safety on the code as written.',
  },
};

export const examples = {};

export const exercises = {
  scalarReplace: {
    title: 'Scalar-replace a small object',
    prompt: `A tiny IR is a list of instructions:

- \`{ op: 'new', dst, fields }\`: \`dst = { ... }\`, where \`fields\` maps each name to a variable
- \`{ op: 'get', dst, obj, key }\`: \`dst = obj.key\`
- \`{ op: 'set', obj, key, src }\`: \`obj.key = src\`
- \`{ op: 'add', dst, a, b }\`, \`{ op: 'mov', dst, src }\`, \`{ op: 'call', fn, args }\`, \`{ op: 'ret', src }\`

Write \`scalarReplace(code)\`. An object made by \`new\` **escapes** if its variable is ever used as a *value*: a field value in a \`new\`, the \`src\` of a \`set\` or \`mov\`, an argument, an \`add\` operand, or returned. Being the \`obj\` of a \`get\` or \`set\` is fine. For each \`new\` that doesn’t escape, replace it with one \`mov\` per field into \`dst_key\` (in field order), turn its \`get\`s into \`mov\`s from \`obj_key\`, and its \`set\`s into \`mov\`s to \`obj_key\`. Leave everything else as it is, and don’t change the input.`,
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
    walkthrough: `**How to think about it.** This is the same two-step move TurboFan makes, on a toy IR (a list of simple instructions, like the ones a compiler keeps internally): first *decide* which objects escape, then *rewrite* the ones that do not. Do the deciding by hand on the first test before writing any code. \`p\` is made by \`new\`, then used by two \`get\`s; a \`get\` only reads a field, so \`p\` never leaves, and it can be replaced. In the "passing it to a call" test, \`p\` is an argument to \`f\`, and \`f\` could keep it, so it must stay. The rule to code up is: an object escapes if its variable is ever used *as a value*, and being the \`obj\` of a \`get\` or \`set\` is not using it as a value.

**The solution, line by line.**

- \`function valueUses(i) {\` starts a helper that answers one question: which variables does instruction \`i\` read *as values*?
- \`case 'new': return Object.values(i.fields);\` A \`new\` reads its field values; if one of them is another object, that object is now stored inside this one, which is an escape.
- \`case 'set': case 'mov': case 'ret': return [i.src];\` A \`set\` reads only its \`src\` (its \`obj\` is the target, which is fine); a \`mov\` copies \`src\` somewhere else; a \`ret\` hands \`src\` to the caller. All three make \`src\` reachable from somewhere new.
- \`case 'add': return [i.a, i.b];\` and \`case 'call': return i.args;\` An operand or an argument is a value use too.
- \`default: return [];\` covers \`get\`, which uses nothing as a value.
- \`const escapes = (v) => code.some((i) => valueUses(i).includes(v));\` An object escapes if *any* instruction uses it as a value.
- The first \`for\` loop puts the \`dst\` of every \`new\` that does not escape into the set \`virt\`: these are the virtual objects. Each allocation gets its own verdict, so \`p\` and \`q\` in the same code can be judged differently.
- \`const out = [];\` We build a new array rather than editing \`code\`, so the input is left alone (the last test checks this; a real compiler pass must not damage the IR it reads either).
- \`const f = (o, k) => o + '_' + k;\` names the variable that will hold field \`k\` of object \`o\`: \`p_x\`.
- A virtual \`new\` becomes one \`mov\` per field, in field order: \`p_x = a\`, \`p_y = b\`. This is scalar replacement: the object turns into separate local values.
- A \`get\` on a virtual object becomes \`mov dst, p_x\`: reading the field is now copying the variable.
- A \`set\` on a virtual object becomes \`mov p_x, src\`: writing the field is now assigning the variable.
- Everything else is pushed unchanged, and \`return out;\` hands back the rewritten list. After the rewrite nothing mentions \`p\` at all, so the allocation is gone.

**Common wrong attempts.**

- Replacing *every* \`new\`, without the escape check: if \`p\` is passed to \`f\` or returned, the caller now receives a variable that never held an object, and the program's behaviour changes. The escape check is the whole point.
- Treating only calls as escapes: returning the object, storing it into another object or copying it with \`mov\` also lets someone else hold the reference, so the "returning it escapes" and "storing it somewhere escapes" tests fail.
- Counting the \`obj\` of a \`get\` or \`set\` as a value use: then no object is ever replaced, because every object is used by its own field accesses, and the first test fails.`,
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
    prompt: 'After scalar replacement, a deopt frame state describes a removed object as `{ fields: { x: \'p_x\', ... } }`: each field names the variable holding its value. A field may also hold another description (an object that was inside it). Write `materialize(desc, env)`, which builds a real object from the description, reading variables from `env`.',
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
      'Inside the loop: `const v = desc.fields[k]; o[k] = typeof v === \'string\' ? env[v] : materialize(v, env);`, then `return o;` after it.',
    ],
    walkthrough: `**How to think about it.** This is what the deoptimiser does with an \`ObjectState\`: the description says which variable holds each field's value, so building the object is "make an empty object, then fill in each field from its variable". The only twist is that a field can hold a *description* instead of a variable name, when an object that was removed held another removed object; that inner object has to be rebuilt first. A structure that can contain itself is a hint to use recursion.

**The solution, line by line.**

- \`const o = {};\` makes the fresh object we are going to fill in.
- \`for (const k in desc.fields) {\` visits each field name, \`x\`, \`y\` and so on, in order.
- \`const v = desc.fields[k];\` is what the description says about field \`k\`: a variable name, or another description.
- \`o[k] = typeof v === 'string' ? env[v] : materialize(v, env);\` A string names a variable, so its value is looked up in \`env\`; anything else is a nested description, so we rebuild that object first (by calling ourselves) and store it in the field.
- \`return o;\` hands back the rebuilt object.

The third test checks that two calls give two *different* objects. That is right: the rebuilt object did not exist before the deopt, so it is a new allocation, and that is only safe because the original never escaped, so nothing outside could have kept its identity to compare.

**Common wrong attempts.**

- \`o[k] = env[desc.fields[k]];\` for every field: a nested description is not a variable name, so the lookup gives \`undefined\` and the inner object is lost.
- Caching the result and returning the same object every time: the third test fails, and in a real engine two deopts would wrongly share one object.`,
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
      {
        t: 'Remove the allocation, then inline `len2`',
        why: 'Before inlining, the object is passed to a call, so the analysis must assume it escapes.',
      },
      {
        t: 'Inline `len2`, see that `p` is only used by field reads, then replace those reads with the stored values',
        correct: true,
        why: 'On this book’s machine, `--trace-turbo-inlining` shows len2 being inlined, and turning off either inlining or escape analysis brings the allocations back.',
      },
      {
        t: 'Convert the loop to struct of arrays',
        why: 'That is Viscosity’s move, ahead of time. V8 doesn’t change the layout of your data.',
      },
      {
        t: 'Let the garbage collector free each object right after the call',
        why: 'That still allocates every object; the collector only cleans up afterwards.',
      },
    ],
  },
  {
    q: 'After scalar replacement, where do `p.x` and `p.y` live?',
    options: [
      {
        t: 'In a hidden object on the heap',
        why: 'There is no object left; that is what was removed.',
      },
      {
        t: 'In the feedback vector',
        why: 'Feedback describes what operations saw, not the program’s values.',
      },
      {
        t: 'In a `Float64Array` that V8 creates',
        why: 'V8 doesn’t create columns; scalar replacement works on single values.',
      },
      {
        t: 'As separate local values, like `p_x` and `p_y`, which can sit in registers',
        correct: true,
        why: 'Each field becomes its own value, and reads of the field become uses of that value.',
      },
    ],
  },
  {
    q: 'A guard fails inside the optimised loop, after `p` was removed. What happens?',
    options: [
      {
        t: 'The deoptimiser builds a real `p` from the field values recorded in the frame state',
        correct: true,
        why: 'TurboFan writes an `ObjectState` for each virtual object into the deopt information, and V8’s concurrent-marking post lists “materialization during deoptimization” among the operations that create objects.',
      },
      {
        t: 'The program crashes, because the interpreter expects an object',
        why: 'Removing an object would be unsafe without a way to rebuild it; the frame state provides one.',
      },
      {
        t: 'V8 re-runs the loop from the start with the object',
        why: 'Deoptimisation continues from the same point; re-running would repeat side effects.',
      },
      {
        t: 'The interpreter continues without `p`',
        why: 'The interpreter’s code still says `p.x`, so it needs a real `p`.',
      },
    ],
  },
  {
    q: 'In this book’s run, `materialize` was about 20 to 35 times slower for SoA (at 100,000 and a million elements), while `get-objects` wasn’t slower at all. Why?',
    options: [
      {
        t: 'V8 doesn’t optimise loops that write arrays',
        why: 'It optimises them fine; the allocations are the problem.',
      },
      {
        t: '`materialize` stores every object into an array that outlives the loop, so they escape and must exist',
        correct: true,
        why: 'Something outside can now read `out[i]` and compare identities. No analysis can remove those allocations.',
      },
      {
        t: '`materialize` uses six fields and `get-objects` uses two',
        why: 'Both build objects with all six fields.',
      },
      {
        t: 'The `materialize` objects are too big for the young generation',
        why: 'They are small objects; the cost is that each one must really be allocated.',
      },
    ],
  },
  {
    q: 'Viscosity, unlike V8, refuses to change the layout when an element is passed to `move(ps[i])`. Why is that the right choice for it?',
    options: [
      {
        t: 'Viscosity’s analysis is less accurate by mistake',
        why: 'It is cautious on purpose: it has different tools.',
      },
      {
        t: 'Function calls are always slow in JavaScript',
        why: 'Calls are cheap once inlined; the issue is what the callee might do with the object.',
      },
      {
        t: 'V8 forbids libraries from changing data layout',
        why: 'Nothing forbids it; Viscosity rewrites source code before V8 sees it.',
      },
      {
        t: 'It works ahead of time, with no inlining and no deoptimisation, so it must prove the object never escapes in the code as written',
        correct: true,
        why: 'V8 can inline, speculate and bail out. Viscosity’s only safe answer to “might escape” is to keep the objects.',
      },
    ],
  },
];
