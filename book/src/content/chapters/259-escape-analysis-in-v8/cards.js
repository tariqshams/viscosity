// Escape analysis in V8: cards.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ea-fixed-name': {
    q: 'In V8 12.4, a hot loop builds `{ x: xs[i], y: ys[i] }` and only reads `p.x` and `p.y`, or destructures it with `const { x, y } = …`. Does TurboFan allocate the object?',
    a: 'No: both forms read fields by fixed names, so escape analysis replaces the object with two values (about 6 scavenges for 50 million iterations, against 1710 with escape analysis off).',
  },
  'ea-computed-key': {
    q: 'Why does reading `p[c ? "x" : "y"]` keep a temporary object real in TurboFan (V8 12.4), when `p["x"]` does not?',
    a: 'The key is not known at compile time, so the load cannot be replaced by one field’s variable; the object must exist to be searched.',
  },
  'ea-phi': {
    q: 'In V8 12.4, `const p = c ? { x: a, y: b } : { x: b, y: a }; t += p.x + p.y;` in a hot loop. Is the object removed?',
    a: 'No: the two allocations meet at a phi, and a variable that may hold either of two allocations makes both real, even with the same shape.',
  },
  'ea-inline-budget': {
    q: 'In Node 22 (V8 12.4), why can passing a temporary object to a function with 554 bytes of bytecode make every object real?',
    a: 'The function is over the default `--max-inlined-bytecode-size` of 460, so it is not inlined, and the object escapes into the call.',
  },
  'ea-arrays': {
    q: 'In V8 12.4, rank these by how many temporary arrays a hot loop allocates: `p = [a, b]` read at constant indices, `const [x, y] = [a, b]`, and `for (const v of [a, b])`.',
    a: 'Constant indices fewest (about 7% of the no-escape-analysis count), destructuring next (about 15%), `for...of` nearly all (about 94%).',
  },
  'ea-closure': {
    q: 'In V8 12.4, does TurboFan remove an arrow function created on every iteration of a hot loop and called at once?',
    a: 'No: in a measured run every closure (and its context) was allocated, more scavenges even than objects with escape analysis off.',
  },
  'ea-captured': {
    q: 'In a V8 `--trace-deopt-verbose` listing, what is a **captured object**?',
    a: 'An object the optimised code never allocated, described in the frame state by its map and field values so the deoptimiser can allocate it.',
  },
  'ea-duplicated': {
    q: 'Why does V8’s frame state say “duplicated object #0” instead of describing the same removed object twice?',
    a: 'One object reached through two names must be rebuilt once, so that identity (`p === q`) still holds in the interpreter.',
  },
  'ea-heapnumber': {
    q: 'When V8 rebuilds a removed object whose fields were doubles, why are the fields themselves captured HeapNumbers read from `xmm` registers?',
    a: 'After scalar replacement the fields lived only as raw doubles in registers; the rebuilt object needs heap values, so each is boxed as it is rebuilt.',
  },
};

export const examples = {};

export const exercises = {
  rebuildFrame: {
    title: 'Rebuild objects from a frame state',
    prompt: 'Write `rebuild(inputs)`, a tiny deoptimiser. `inputs` is an array, and each entry is one of: `{ value: v }`, a plain value; `{ captured: id, fields: { name: entry, ... } }`, an object that was never allocated, whose fields are themselves entries; or `{ duplicated: id }`, the same object as the captured object with that `id`. Return an array of the rebuilt values, in order. Each captured object must be built exactly once, and every `duplicated` entry must give the very same object (so `===` holds), even when it appears inside the object’s own fields.',
    starter: `function rebuild(inputs) {
  // plain values as they are;
  // captured objects built once;
  // duplicated: the same object
  return inputs.map((e) => e.value);
}`,
    solution: `function rebuild(inputs) {
  const made = new Map();
  function one(e) {
    if ('value' in e) return e.value;
    if ('duplicated' in e)
      return made.get(e.duplicated);
    const o = {};
    made.set(e.captured, o);
    for (const [k, f] of
      Object.entries(e.fields))
      o[k] = one(f);
    return o;
  }
  return inputs.map(one);
}`,
    tests: `test('plain values pass through', () => {
  expect(rebuild([{ value: 1 }, { value: 'a' }]))
    .toEqual([1, 'a']);
});
test('a captured object gets its fields', () => {
  const [i, p] = rebuild([{ value: 1 },
    { captured: 0, fields: { x: { value: 1 }, y: { value: 2 } } }]);
  expect(i).toBe(1);
  expect(p).toEqual({ x: 1, y: 2 });
});
test('a duplicated object is the same object', () => {
  const r = rebuild([
    { captured: 0, fields: { x: { value: 1 } } },
    { duplicated: 0 }]);
  expect(r[0] === r[1]).toBe(true);
});
test('nested captured objects', () => {
  const [a] = rebuild([{ captured: 0, fields: {
    pos: { captured: 1, fields: { x: { value: 3 } } },
    w: { value: 2 } } }]);
  expect(a.pos.x).toBe(3);
  expect(a.w).toBe(2);
});
test('an object that refers to itself', () => {
  const [o] = rebuild([{ captured: 0,
    fields: { self: { duplicated: 0 } } }]);
  expect(o.self === o).toBe(true);
});`,
    hints: [
      'Handle one entry at a time with a helper, `one(e)`, that returns its value; the answer is `inputs.map(one)`.',
      'Keep a `Map` from captured ids to the objects you have made. A `duplicated` entry is then just a lookup.',
      'Make the empty object and record it in the map *before* filling in its fields, then fill each field with `one(field)`. That order is what lets a field refer back to the object itself.',
    ],
    walkthrough: `**How to think about it.** Each entry describes one value the interpreter needs. Plain values are easy; a captured object is a recipe (its fields), and the recipe may contain more recipes, so a recursive helper fits. The one rule that makes it correct is identity: the deoptimiser must not make two objects where the program had one, so every object you build is remembered by its id, and a duplicated entry hands back the remembered object. The subtle case is an object whose own field refers back to it: if you only record the object after filling its fields, the lookup inside happens too early and finds nothing.

**The solution, line by line.**

- \`const made = new Map();\` remembers each captured object by its id.
- \`function one(e) {\` rebuilds one entry.
- \`if ('value' in e) return e.value;\` passes a plain value through. (\`in\` is used rather than \`e.value !== undefined\`, so a plain \`undefined\` value still works.)
- \`if ('duplicated' in e) return made.get(e.duplicated);\` returns the object already built, the same one, so \`===\` holds.
- \`const o = {};\` allocates the object for real, the step the optimised code skipped.
- \`made.set(e.captured, o);\` records it *before* its fields, so a field can refer back to it.
- \`for (const [k, f] of Object.entries(e.fields)) o[k] = one(f);\` fills each field by rebuilding its entry, which may itself be a captured object.
- \`return o;\` hands back the new object.
- \`return inputs.map(one);\` rebuilds every input, in order.

Trace the self-reference test: \`one\` makes \`o\`, records it under 0, then rebuilds the field \`self\`, a duplicated entry for 0, which finds \`o\` in the map; so \`o.self === o\`.

**Common wrong attempts.**

- Building a fresh object for each duplicated entry (for example by keeping the captured description and rebuilding it): the values look the same, but \`r[0] === r[1]\` is false, which is exactly the identity the program could notice.
- Recording the object after filling its fields: everything works except the self-reference, where the lookup returns \`undefined\`.`,
    wrong: [
      {
        code: `function rebuild(inputs) {
  const recipes = new Map();
  function one(e) {
    if ('value' in e) return e.value;
    if ('duplicated' in e)
      return one(
        recipes.get(e.duplicated));
    recipes.set(e.captured, e);
    const o = {};
    for (const [k, f] of
      Object.entries(e.fields))
      o[k] = one(f);
    return o;
  }
  return inputs.map(one);
}`,
        why: 'A duplicated entry rebuilds the object again from its description, so it is a second object: `r[0] === r[1]` is false (and a self-reference recurses for ever).',
      },
      {
        code: `function rebuild(inputs) {
  const made = new Map();
  function one(e) {
    if ('value' in e) return e.value;
    if ('duplicated' in e)
      return made.get(e.duplicated);
    const o = {};
    for (const [k, f] of
      Object.entries(e.fields))
      o[k] = one(f);
    made.set(e.captured, o);
    return o;
  }
  return inputs.map(one);
}`,
        why: 'The object is recorded only after its fields are filled, so a field that refers back to it finds nothing: `o.self` is `undefined`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In V8 12.4, which hot-loop body lets TurboFan remove the temporary object?',
    options: [
      {
        t: '`const { x, y } = { x: xs[i], y: ys[i] }; t += x + y;`',
        correct: true,
        why: 'Right: destructuring an object literal is two field reads by fixed names, so the object is replaced by its two values.',
      },
      {
        t: '`const p = { x: xs[i], y: ys[i] }; t += p[i & 1 ? "x" : "y"];`',
        why: 'The key is computed at run time, so the object must exist to be searched.',
      },
      {
        t: '`for (const v of [xs[i], ys[i]]) t += v;`',
        why: 'In a measured run nearly every array was still allocated: `for...of` goes through the iteration protocol.',
      },
      {
        t: '`const f = () => xs[i] + ys[i]; t += f();`',
        why: 'The closure (and its context) was allocated on every iteration.',
      },
    ],
  },
  {
    q: 'A loop body is `const p = (i & 1) ? { x: a, y: b } : { x: b, y: a }; t += p.x + p.y;`. Why does V8 12.4 allocate every object?',
    options: [
      {
        t: 'The two objects have different shapes',
        why: 'They have the same keys in the same order, so the same shape; the problem is elsewhere.',
      },
      {
        t: 'The two allocations meet at a phi, and a variable that may hold either of two allocations makes both real',
        correct: true,
        why: 'Right: when each object is read inside its own branch instead, the objects vanish again.',
      },
      {
        t: 'Conditional expressions are never optimised',
        why: 'They are optimised like any other branch; this one merges two allocations into one variable.',
      },
    ],
  },
  {
    q: 'A temporary object is passed to a consumer with 554 bytes of bytecode, and every object is allocated. Which Node 22 flag made the objects vanish again in a test?',
    options: [
      {
        t: '`--max-inlined-bytecode-size=1000`',
        correct: true,
        why: 'Right: the default of 460 kept the consumer from being inlined; above its size, it was inlined and the object removed.',
      },
      {
        t: '`--no-turbo-escape`',
        why: 'That turns escape analysis off, which makes every temporary object real.',
      },
      {
        t: '`--turbo-inlining`',
        why: 'Inlining is already on by default; the consumer was over the size limit.',
      },
    ],
  },
  {
    q: 'In a V8 `--trace-deopt-verbose` listing, input 7 reads `duplicated object #0`. What does the deoptimiser do for it?',
    options: [
      {
        t: 'It allocates a second object with the same fields as captured object #0',
        why: 'That would make two objects where the program had one, so `p === q` would become false.',
      },
      {
        t: 'It writes the address of the object it built for captured object #0',
        correct: true,
        why: 'Right: the trace’s two Materialization lines give both slots the same address.',
      },
      {
        t: 'It leaves the slot empty, because the value was optimised out',
        why: 'Optimised-out values are printed as `(optimized out)`; a duplicated object is still needed.',
      },
    ],
  },
  {
    q: 'Why is a captured object’s field shown as a captured HeapNumber, read from an `xmm` register, in a V8 deopt trace?',
    options: [
      {
        t: 'The field was stored in the heap all along',
        why: 'Then it would be read from memory as an existing object; it is described as one still to be made.',
      },
      {
        t: 'The deoptimiser converts every number to a string first',
        why: 'Numbers stay numbers; the HeapNumber is a boxed double.',
      },
      {
        t: 'After scalar replacement the field was only a raw double in a register, and the rebuilt object needs a heap value',
        correct: true,
        why: 'Right: the deoptimiser boxes each such double as it rebuilds the object.',
      },
    ],
  },
];
