// Chapter 209 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cd-what': {
    q: 'What does collection discovery look for?',
    a: 'Variables holding an array of same-shaped records: created from a fresh array literal, filled only with fresh object literals of one shape, never replaced.',
  },
  'cd-vir': {
    q: 'Why can collection discovery find every use of `ps` just by scanning loads?',
    a: 'The front-end lowers every array-initialized variable to a binding, so each read of it is an explicit loadBinding.',
  },
  'cd-candidate': {
    q: 'What makes a binding a candidate collection?',
    a: 'It is a const or let, and at least one of its stores stores an array.empty or array.new.',
  },
  'cd-var': {
    q: 'What happens to `var ps = []` filled with records?',
    a: 'Nothing: var bindings are skipped, so it is never a candidate, and explain reports no arrays of objects.',
  },
  'cd-reassigned': {
    q: 'Why does a second store to `ps` cause a bailout?',
    a: 'Then ps may not always hold this array, so code using ps can’t be rewritten for one layout.',
  },
  'cd-worklist': {
    q: 'Which uses of a collection’s load are accepted?',
    a: '`.length`, `push` of one fresh record, `ps[i]`, and passing it to a function whose every call site passes the same collection.',
  },
  'cd-push-fresh': {
    q: 'Why must `push` receive a fresh object literal?',
    a: 'Only a fresh `record.new` has known fields and can be taken apart into column values; any other value might be an object used elsewhere.',
  },
  'cd-other-use': {
    q: 'What happens if the program calls `ps.map(...)`?',
    a: 'A bailout: “uses .map on the array (only .length and .push are supported)”. The collection is kept as an array of objects.',
  },
  'cd-order': {
    q: 'Why are `{ x, y }` and `{ y, x }` different shapes for Viscosity?',
    a: 'The rewritten push passes field values by position in column order, so the field order is part of the shape.',
  },
  'cd-alias': {
    q: 'Why is a pushed record that is also used elsewhere a bailout?',
    a: 'After the change there is no object, only column slots; another reference to the record (like `r.x = 500` later) would no longer reach the element.',
  },
  'cd-empty': {
    q: 'What does discovery say about an array that never receives a record?',
    a: '“no records are ever added, so there is nothing to lay out”.',
  },
};

export const examples = {};

export const exercises = {
  findCollections: {
    title: 'Find arrays of same-shaped records',
    prompt:
      'Instructions are objects in program order:\n\n- `{ id, op: \'empty\' }` makes `[]`\n- `{ id, op: \'record\', fields }` makes an object literal\n- `{ id, op: \'store\', name, value }` stores value `value` into variable `name`\n- `{ op: \'push\', name, value }` pushes value `value` onto the array in `name`\n\nWrite `findCollections(insts)`. A **candidate** is a name that is stored an `empty` at least once. Return an object mapping each candidate to its fields, or to `null` if it must be rejected because: it is stored more than once; a push value is not a `record`; a record’s fields differ from the first record’s (same names, **same order**); or no record is ever pushed. Names that are not candidates don’t appear.',
    starter: `function findCollections(insts) {
  const out = {};
  for (const i of insts) {
    if (i.op === 'store') {
      out[i.name] = [];
    }
  }
  return out;
}`,
    solution: `function findCollections(insts) {
  const byId = new Map();
  for (const i of insts) {
    if (i.id === undefined) continue;
    byId.set(i.id, i);
  }
  const op = (v) => byId.get(v)?.op;
  const stores = {};
  for (const i of insts) {
    if (i.op !== 'store') continue;
    (stores[i.name] ??= []).push(i);
  }
  const out = {};
  for (const [name, st] of
      Object.entries(stores)) {
    const isArr = (s) =>
      op(s.value) === 'empty';
    if (!st.some(isArr)) continue;
    let fields = null;
    let ok = st.length === 1;
    for (const i of insts) {
      if (i.op !== 'push') continue;
      if (i.name !== name) continue;
      const r = byId.get(i.value);
      if (!r || r.op !== 'record') {
        ok = false;
      } else if (fields === null) {
        fields = r.fields;
      } else if (fields.join()
          !== r.fields.join()) {
        ok = false;
      }
    }
    out[name] = ok && fields
      ? fields : null;
  }
  return out;
}`,
    tests: `const E = (id) => ({ id, op: 'empty' });
const R = (id, ...fields) => ({ id, op: 'record', fields });
const S = (name, value) => ({ op: 'store', name, value });
const P = (name, value) => ({ op: 'push', name, value });
test('one good collection', () => {
  expect(findCollections([
    E(0), S('ps', 0), R(1, 'x', 'y'), P('ps', 1), R(2, 'x', 'y'), P('ps', 2),
  ])).toEqual({ ps: ['x', 'y'] });
});
test('field order matters', () => {
  expect(findCollections([
    E(0), S('ps', 0), R(1, 'x', 'y'), P('ps', 1), R(2, 'y', 'x'), P('ps', 2),
  ])).toEqual({ ps: null });
});
test('reassigned', () => {
  expect(findCollections([
    E(0), S('ps', 0), R(1, 'x'), P('ps', 1), E(2), S('ps', 2),
  ])).toEqual({ ps: null });
});
test('pushing a non-record', () => {
  expect(findCollections([
    E(0), S('ps', 0), E(1), P('ps', 1),
  ])).toEqual({ ps: null });
});
test('no records ever', () => {
  expect(findCollections([E(0), S('ps', 0)])).toEqual({ ps: null });
});
test('only arrays are candidates', () => {
  expect(findCollections([
    R(0, 'x'), S('o', 0), E(1), S('qs', 1), R(2, 'id'), P('qs', 2),
  ])).toEqual({ qs: ['id'] });
});`,
    hints: [
      'Index instructions by `id` first, so a store’s or push’s `value` can be looked up.',
      'Group stores by name. A name is a candidate if one of its stored values is an `empty`; more than one store means reject.',
      'Walk the pushes for that name: the first record sets the fields, every later one must match `fields.join()` exactly, and a non-record rejects.',
    ],
    walkthrough: `This is sections 1 and 2 of \`analysis.ts\`, with the worklist replaced by a plain scan.

- **Candidates come from stores.** Only a variable that is given a fresh array can be a collection; a variable stored an object literal (\`o\` in the last test) is not even considered.
- **One store only.** A second store, even of another \`[]\`, means the variable may hold different arrays at different times. Viscosity rejects it rather than reason about which one a use sees.
- **Fresh records only.** A push of anything but a \`record\` might add an object the program also uses elsewhere, or something that isn’t an object at all.
- **Order is part of the shape.** Comparing \`fields.join()\` makes \`['x', 'y']\` and \`['y', 'x']\` different, as \`setShape\` does: the rewritten \`push(a, b)\` passes values by position.
- **Nothing pushed, nothing to do.** With no record, there are no fields to make columns from.

The real analysis also checks that each record has exactly one use, and follows loads through \`ps[i]\`, \`.length\` and function calls.`,
    wrong: [
      {
        code: `function findCollections(insts) {
  const byId = new Map();
  for (const i of insts) {
    if (i.id === undefined) continue;
    byId.set(i.id, i);
  }
  const out = {};
  for (const i of insts) {
    if (i.op === 'store' &&
      byId.get(i.value).op
        === 'empty') {
      out[i.name] = null;
    }
    if (i.op === 'push') {
      const r = byId.get(i.value);
      if (r.op !== 'record') {
        out[i.name] = null;
      } else if (out[i.name] === null) {
        out[i.name] = r.fields;
      }
    }
  }
  return out;
}`,
        why: 'It never compares shapes and ignores reassignment: the first record wins, a later `{y, x}` is accepted, and a second `[]` just resets the name.',
      },
      {
        code: `function findCollections(insts) {
  const byId = new Map();
  for (const i of insts) {
    if (i.id === undefined) continue;
    byId.set(i.id, i);
  }
  const op = (v) => byId.get(v)?.op;
  const stores = {};
  for (const i of insts) {
    if (i.op !== 'store') continue;
    (stores[i.name] ??= []).push(i);
  }
  const out = {};
  for (const [name, st] of
      Object.entries(stores)) {
    const isArr = (s) =>
      op(s.value) === 'empty';
    if (!st.some(isArr)) continue;
    let fields = null;
    let ok = st.length === 1;
    for (const i of insts) {
      if (i.op !== 'push') continue;
      if (i.name !== name) continue;
      const r = byId.get(i.value);
      if (!r || r.op !== 'record') {
        ok = false;
      } else if (fields === null) {
        fields = r.fields;
      } else if (
        [...fields].sort().join() !==
        [...r.fields].sort().join()) {
        ok = false;
      }
    }
    out[name] = ok && fields
      ? fields : null;
  }
  return out;
}`,
        why: 'Sorting the fields treats `{x, y}` and `{y, x}` as one shape. The rewritten push passes values by position, so order must match.',
      },
    ],
  },
  aliased: {
    optional: true,
    title: 'Records that could be aliased',
    prompt:
      'Now each instruction has `args`, the ids of the values it uses: `{ id, op: \'record\', args: [] }`, `{ op: \'push\', args: [arr, rec] }`, `{ op: \'set\', args: [obj, val] }` and so on. Write `aliased(insts)`: return the ids of the `record` instructions that are **pushed** somewhere but used **more than once** in total, in increasing order.',
    starter: `function aliased(insts) {
  return [];
}`,
    solution: `function aliased(insts) {
  const uses = new Map();
  const pushed = new Set();
  for (const i of insts) {
    for (const a of i.args) {
      const n = uses.get(a) ?? 0;
      uses.set(a, n + 1);
    }
    if (i.op === 'push') {
      pushed.add(i.args[1]);
    }
  }
  return insts
    .filter((i) => i.op === 'record')
    .map((i) => i.id)
    .filter((id) => pushed.has(id)
      && uses.get(id) > 1)
    .sort((a, b) => a - b);
}`,
    tests: `const rec = (id) => ({ id, op: 'record', args: [] });
test('a record used only by its push', () => {
  expect(aliased([rec(1), { op: 'push', args: [0, 1] }])).toEqual([]);
});
test('pushed, then written through another use', () => {
  expect(aliased([
    rec(1), { op: 'push', args: [0, 1] }, { op: 'set', args: [1, 7] },
  ])).toEqual([1]);
});
test('pushed twice', () => {
  expect(aliased([
    rec(2), { op: 'push', args: [0, 2] }, { op: 'push', args: [0, 2] },
    rec(3), { op: 'push', args: [0, 3] },
  ])).toEqual([2]);
});
test('used twice but never pushed', () => {
  expect(aliased([
    rec(4), { op: 'set', args: [4, 1] }, { op: 'get', args: [4] },
  ])).toEqual([]);
});`,
    hints: [
      'Count how many times each id appears in any instruction’s `args`.',
      'Remember which ids appear as the second argument of a `push`.',
      'Keep record ids that are pushed and counted more than once.',
    ],
    walkthrough: `This is the second half of \`setShape\`: \`usesOf(r.id).length !== 1\` means the record is referenced by something besides its push.

- **Why count uses.** In SSA, \`const r = { x: i }; ps.push(r); r.x = 500;\` has one \`record.new\` used twice: once by \`push\`, once by \`field.set\`. After the layout change the element lives in columns, and the \`field.set\` would update an object nobody reads any more.
- **Pushing twice is aliasing too.** Two elements that are the same object must stay the same object: change one, and the other changes. Two column slots can’t do that.
- **Not pushed, not our business.** A record that never enters a collection can be used as often as it likes.`,
    wrong: [
      {
        code: `function aliased(insts) {
  const uses = new Map();
  for (const i of insts) {
    if (i.op !== 'push') continue;
    const r = i.args[1];
    uses.set(r, (uses.get(r) ?? 0) + 1);
  }
  return [...uses.keys()]
    .filter((id) => uses.get(id) > 1)
    .sort((a, b) => a - b);
}`,
        why: 'It counts only pushes, so a record pushed once and then written through another use (`r.x = 500`) looks safe.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a candidate collection?',
    options: [
      { t: '`var ps = [];` filled with `{ x: i }`', why: 'var bindings are skipped outright.' },
      { t: '`let ps = [];` filled with `{ x: i }`', correct: true, why: 'A let given a fresh array literal is a candidate; it is a collection if nothing rejects it.' },
      { t: '`const ps = make();`', why: 'Only stores of array.empty or array.new create candidates.' },
      { t: '`const o = { x: 1 };`', why: 'An object literal is a record, not an array.' },
    ],
  },
  {
    q: '`ps.push({ x: 1, y: 2 })` on line 2, `ps.push({ y: 3, x: 4 })` on line 3. What does explain say?',
    options: [
      { t: 'Nothing: they have the same fields', why: 'Same names, different order: a different shape.' },
      { t: 'line 3: records with different fields or field order', why: 'The worklist pops the last load first, so line 3 sets the shape and line 2 is blamed.' },
      { t: 'line 2: records with different fields or field order ({x, y} vs {y, x})', correct: true, why: 'Line 3’s {y, x} was seen first and set the shape.' },
      { t: 'ps is reassigned', why: 'There is only one store.' },
    ],
  },
  {
    q: 'Why does `const r = { x: i }; ps.push(r); r.x = 500;` cause a bailout?',
    options: [
      { t: 'The record has two uses, the push and the field.set, so it could be aliased', correct: true, why: 'After the change, r.x = 500 would update an object that no longer holds the element.' },
      { t: 'r is a const', why: 'Being const doesn’t stop its object from being mutated; the extra use is the problem.' },
      { t: 'push takes a variable instead of a literal', why: 'r is an SSA value, so the push’s argument is still the record.new.' },
      { t: '500 is not a valid x', why: 'Any number is fine.' },
    ],
  },
  {
    q: 'Which use of a collection is NOT accepted by discovery?',
    options: [
      { t: '`ps.length`', why: 'Recorded as a length read.' },
      { t: '`ps[i]`', why: 'An index.get; its element is checked later.' },
      { t: '`ps.push({ x: i })`', why: 'One fresh record: accepted, and shape-checked.' },
      { t: '`ps.map((p) => p.x)`', correct: true, why: 'Only .length and .push are supported as fields of the array.' },
    ],
  },
  {
    q: 'Why does discovery depend on the front-end lowering array variables to bindings?',
    options: [
      { t: 'Bindings are faster', why: 'Speed is not the reason.' },
      { t: 'Only bindings can be pushed to', why: 'push works on any value.' },
      { t: 'Every use then appears as a load, so the worklist can find them all', correct: true, why: 'With SSA values it would have to chase phis and copies instead.' },
      { t: 'The emitter needs bindings', why: 'The emitter works from source ranges.' },
    ],
  },
  {
    q: 'What does a successful discovery NOT establish?',
    options: [
      { t: 'The collection’s fields', why: 'It records them via setShape.' },
      { t: 'That changing its layout is safe and worth it', correct: true, why: 'Safety (chapter 212) and the cost model (chapter 214) come later.' },
      { t: 'Where it is pushed to', why: 'It collects the pushes.' },
      { t: 'That it is stored only once', why: 'A second store is a bailout here.' },
    ],
  },
];
