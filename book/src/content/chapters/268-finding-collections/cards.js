// Chapter 268 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cd-what': {
    q: 'What does collection discovery look for?',
    a: 'Variables holding an array of same-shaped records: created from a fresh array literal, filled only with fresh object literals of one shape, never replaced.',
  },
  'cd-vir': {
    q: 'Why can collection discovery find every use of `ps` just by scanning loads?',
    a: 'The front-end lowers every array-initialised variable to a binding, so each read of it is an explicit loadBinding.',
  },
  'cd-var': {
    q: 'What happens to `var ps = []` filled with records?',
    a: 'Nothing: var bindings are skipped, so it is never a candidate, and explain reports no arrays of objects.',
  },
  'cd-reassigned': {
    q: 'Why does a second store to `ps` cause a bailout?',
    a: 'Then ps may not always hold this array, so code using ps can’t be rewritten for one layout.',
  },
  'cd-dataflow': {
    q: 'In what sense is collection discovery a dataflow problem?',
    a: 'Each value either refers to the collection or not; the fact starts at the loads and flows forward along def-use edges (and into parameters of known functions), and a worklist computes the smallest set of values that refer to it.',
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
    walkthrough: `**How to think about it.** This is sections 1 and 2 of \`analysis.ts\` with the worklist replaced by a plain scan, because here every push names its array directly. Work in the same order Viscosity does: first find the *candidates* (names that are ever given a fresh \`[]\`), then, for each one, look at everything pushed into it and reject it at the first broken rule. Since stores and pushes refer to other instructions by \`id\`, the very first job is a way to look an instruction up by its id.

**The solution, line by line.**

- \`const byId = new Map(); for (const i of insts) { if (i.id === undefined) continue; byId.set(i.id, i); }\` indexes every instruction that has an id (stores and pushes have none, since they produce no value).
- \`const op = (v) => byId.get(v)?.op;\` is a small helper: the kind of instruction that made value \`v\`. The \`?.\` makes it \`undefined\` instead of a crash if \`v\` is unknown.
- \`const stores = {}; for (...) { if (i.op !== 'store') continue; (stores[i.name] ??= []).push(i); }\` groups the stores by variable name. \`??=\` creates the list the first time a name is seen.
- \`for (const [name, st] of Object.entries(stores)) {\` visits each stored-to name with its list of stores.
- \`const isArr = (s) => op(s.value) === 'empty'; if (!st.some(isArr)) continue;\` skips names that are never given a fresh array: in the last test, \`o\` is only stored a record, so it is not a candidate and does not appear in the answer.
- \`let fields = null; let ok = st.length === 1;\` starts with no shape yet, and already rejects a name with a second store (the reassignment rule).
- The inner \`for\` loop visits every \`push\` into this name. \`const r = byId.get(i.value);\` is the pushed value. If it is missing or not a \`record\`, \`ok = false\`. Otherwise, if \`fields\` is still \`null\`, this is the first record and it sets the shape; if not, \`fields.join() !== r.fields.join()\` compares the two field lists as strings, order included, and a difference rejects.
- \`out[name] = ok && fields ? fields : null;\` records the shape only if nothing was rejected **and** at least one record was pushed; with no records, \`fields\` is still \`null\`, so the answer is \`null\` (the "no records are ever added" rule).

**Common wrong attempts.**

- Letting the first record win and never comparing the later ones: a later \`{y, x}\` is then accepted, and a second \`[]\` simply overwrites the name's entry instead of rejecting it.
- Sorting the field lists before comparing them: that treats \`{x, y}\` and \`{y, x}\` as one shape, but the rewritten \`push(a, b)\` passes values by position, so the order must match.
- Returning \`[]\` for a candidate with no records: an empty field list is not a shape, and the tests expect \`null\`, as Viscosity's bailout does.

The real analysis also checks that each record has exactly one use (the extra exercise) and follows loads through \`ps[i]\`, \`.length\` and calls of known functions.`,
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
    walkthrough: `**How to think about it.** This is the second half of \`setShape\`: \`usesOf(r.id).length !== 1\` means a record is referenced by something besides its push. So two facts are needed for each record: how many times its id appears as an argument anywhere, and whether it is ever pushed. One pass over the instructions can collect both.

**The solution, line by line.**

- \`const uses = new Map(); const pushed = new Set();\` will hold the use count per id and the ids that are pushed.
- \`for (const i of insts) { for (const a of i.args) { const n = uses.get(a) ?? 0; uses.set(a, n + 1); }\` counts every argument of every instruction: a use is an appearance in some \`args\` list, whatever the instruction is.
- \`if (i.op === 'push') pushed.add(i.args[1]);\` remembers the value pushed (argument 0 is the array, argument 1 the pushed value).
- \`return insts.filter((i) => i.op === 'record').map((i) => i.id)\` takes the ids of all records, in program order...
- \`.filter((id) => pushed.has(id) && uses.get(id) > 1)\` keeps those that are pushed and used more than once...
- \`.sort((a, b) => a - b);\` and sorts them as numbers (without the comparison function, \`sort\` would compare them as strings, putting \`10\` before \`9\`).

**Why each case is aliasing.** \`const r = { x: i }; ps.push(r); r.x = 500;\` has one \`record.new\` used twice: by \`push\` and by \`field.set\`. After the layout change the element lives in columns, and the \`field.set\` would update an object nobody reads any more. Pushing the same record twice is aliasing as well: the two elements are one object, so changing one changes the other, which two column slots cannot do. A record that is never pushed is no business of the collection's, however often it is used.

**Common wrong attempts.**

- Counting only pushes: a record pushed once and then written through another use (\`r.x = 500\`) looks safe, which is exactly the case the corpus file \`record_shared.js\` tests.
- Counting all uses but forgetting the "is pushed" condition: a record used twice that never enters a collection is reported, though Viscosity would not care about it.`,
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
    q: 'What does a successful discovery NOT establish?',
    options: [
      { t: 'The collection’s fields', why: 'It records them via setShape.' },
      { t: 'That changing its layout is safe and worth it', correct: true, why: 'Safety (Proving it safe) and the cost model (The cost model) come later.' },
      { t: 'Where it is pushed to', why: 'It collects the pushes.' },
      { t: 'That it is stored only once', why: 'A second store is a bailout here.' },
    ],
  },
];
