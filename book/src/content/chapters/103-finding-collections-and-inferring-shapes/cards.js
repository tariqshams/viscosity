// Chapter 103 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cd-what': {
    q: 'What does Viscosity’s collection discovery look for?',
    a: 'Variables holding an array of same-shaped records: created from a fresh array literal, filled only with fresh object literals of one shape, never replaced.',
  },
  'cd-dataflow': {
    q: 'In what sense is Viscosity’s collection discovery a dataflow problem?',
    a: 'Each value either refers to the collection or not; the fact starts at the loads and flows forward along def-use edges (and into parameters of known functions), and a worklist computes the smallest set of values that refer to it.',
  },
  'cd-worklist': {
    q: 'Which uses of a candidate collection does Viscosity’s discovery accept without a bailout?',
    a: '`.length`, `push` of one fresh record, `ps[i]`, and passing it to a function whose every call site passes the same collection.',
  },
  'ti-annotations': {
    q: 'Why doesn’t Viscosity rely on TypeScript annotations to prove a field is numeric?',
    a: 'They are erased before the code runs and never check or change what actually runs, so they prove nothing about real values.',
  },
  'ti-flow': {
    q: 'Why does giving facts to SSA values (rather than to variables) make them flow-sensitive?',
    a: 'Each assignment makes a new SSA value, so one variable can have a different fact at each point in the program.',
  },
  'ti-optimistic': {
    q: 'Why does an analysis that proves values numeric start the values on a loop’s cycle at “number” rather than “maybe not”?',
    a: 'On a loop each value waits for the other. Starting pessimistic, the cycle can never prove itself; starting optimistic, it can, and wrong guesses are knocked down.',
  },
  'si-order': {
    q: 'Name one reason the object literals `{ x, y }` and `{ y, x }` count as different shapes in Viscosity.',
    a: 'JavaScript can see the order (`Object.keys`, `JSON.stringify`); also Viscosity reads each column’s value from a fixed position in the literal.',
  },
};

export const examples = {
  order: {
    title: 'JavaScript can see field order',
    code: `const a = { x: 1, y: 2 };
const b = { y: 2, x: 1 };
console.log(Object.keys(a));
console.log(Object.keys(b));
console.log(JSON.stringify(a));
console.log(JSON.stringify(b));
// Same data, different text:
console.log(
  JSON.stringify(a) ===
  JSON.stringify(b));`,
  },
};

export const exercises = {
  findCollections: {
    title: 'Find arrays of same-shaped records',
    prompt: `Instructions are objects in program order:

- \`{ id, op: 'empty' }\` makes \`[]\`
- \`{ id, op: 'record', fields }\` makes an object literal
- \`{ id, op: 'store', name, value }\` stores value \`value\` into variable \`name\`
- \`{ op: 'push', name, value }\` pushes value \`value\` onto the array in \`name\`

Write \`findCollections(insts)\`. A **candidate** is a name that is stored an \`empty\` at least once. Return an object mapping each candidate to its fields, or to \`null\` if it must be rejected because: it is stored more than once; a push value is not a \`record\`; a record’s fields differ from the first record’s (same names, **same order**); or no record is ever pushed. Names that are not candidates don’t appear.`,
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
    prompt: 'Now each instruction has `args`, the ids of the values it uses: `{ id, op: \'record\', args: [] }`, `{ op: \'push\', args: [arr, rec] }`, `{ op: \'set\', args: [obj, val] }` and so on. Write `aliased(insts)`: return the ids of the `record` instructions that are **pushed** somewhere but used **more than once** in total, in increasing order.',
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
  unifyShapes: {
    optional: true,
    title: 'Unify the literals',
    prompt: 'Each object literal pushed into a collection is given as an array of its field names, in order, e.g. `[\'x\', \'y\']`. Write `unifyShapes(lits)`, returning the collection’s shape (the field list) if **every** literal has exactly the same fields in the same order. Return `null` if any differs, or if there are no literals at all.',
    starter: `function unifyShapes(lits) {
  // your code here
}

console.log(unifyShapes([
  ['x', 'y'], ['x', 'y'],
]));
console.log(unifyShapes([
  ['x', 'y'], ['y', 'x'],
]));`,
    solution: `function unifyShapes(lits) {
  if (lits.length === 0) return null;
  const shape = lits[0];
  for (const fs of lits) {
    if (fs.length !== shape.length) {
      return null;
    }
    for (let i = 0; i < fs.length; i++)
      if (fs[i] !== shape[i])
        return null;
  }
  return shape;
}`,
    tests: `test('all the same', () => {
  expect(unifyShapes([['x', 'y'], ['x', 'y'], ['x', 'y']]))
    .toEqual(['x', 'y']);
});
test('order differs', () => {
  expect(unifyShapes([['x', 'y'], ['y', 'x']])).toBe(null);
});
test('an extra field', () => {
  expect(unifyShapes([['x', 'y'], ['x', 'y', 'z']])).toBe(null);
});
test('a missing field', () => {
  expect(unifyShapes([['x', 'y', 'z'], ['x', 'y']])).toBe(null);
});
test('one literal is its own shape', () => {
  expect(unifyShapes([['hp']])).toEqual(['hp']);
});
test('no literals: no shape', () => {
  expect(unifyShapes([])).toBe(null);
});`,
    hints: [
      'There is no “expected shape” written anywhere. Which literal could propose one?',
      'Take the first literal as the candidate, then compare every literal with it: what two things must match for two lists to be equal?',
      'With no literals, return `null` at once. Otherwise compare lengths, then each position with `!==`, returning `null` at the first difference; after the loop, return the candidate.',
    ],
    walkthrough: `**How to think about it.** This is \`setShape\` from Viscosity’s analysis without the bailout messages. Nobody declares the shape of a collection, so the first literal *proposes* one and every other literal must *agree* with it. "Agree" has to mean exactly equal: the same names, in the same order, and no more or fewer of them. Two lists are equal when they have the same length and the same element at every position, so the check has two parts.

**The solution, line by line.**

- \`if (lits.length === 0) return null;\` handles the empty case first. With no literals there is no shape at all (Viscosity says "no records are ever added, so there is nothing to lay out"), and \`lits[0]\` would be \`undefined\`.
- \`const shape = lits[0];\` makes the first literal the candidate shape.
- \`for (const fs of lits) {\` visits every literal, including the first (comparing it with itself is harmless and keeps the loop simple).
- \`if (fs.length !== shape.length) { return null; }\` rejects an extra or a missing field before looking at names.
- \`for (let i = 0; i < fs.length; i++)\` walks the positions; because the lengths are now equal, \`shape[i]\` exists for every \`i\`.
- \`if (fs[i] !== shape[i]) return null;\` rejects the first position where the names differ, which catches both a different name and a different order: \`['y', 'x']\` fails at position 0.
- \`return shape;\` runs only if every literal survived every check.

**Common wrong attempts.**

- Leaving out the length check: \`['x', 'y']\` against \`['x', 'y', 'z']\` compares only the literal’s own two positions and wrongly agrees.
- Sorting the names before comparing: \`{x, y}\` and \`{y, x}\` then look identical, but order is visible in JavaScript and the code generator reads values by position, so they must stay different.
- Comparing with \`fs.join(',') === shape.join(',')\`: a field named \`'a,b'\` then matches the two fields \`a\` and \`b\`. (An earlier version of Viscosity had exactly this bug; it now compares the lists with \`JSON.stringify\`.)`,
    wrong: [
      {
        code: `function unifyShapes(lits) {
  if (lits.length === 0) return null;
  const shape = lits[0];
  for (const fs of lits) {
    for (let i = 0; i < fs.length; i++)
      if (fs[i] !== shape[i])
        return null;
  }
  return shape;
}`,
        why: 'It never compares lengths. A literal that is missing a field, like `[\'x\', \'y\']` against `[\'x\', \'y\', \'z\']`, passes because only its own positions are checked.',
      },
      {
        code: `function unifyShapes(lits) {
  if (lits.length === 0) return null;
  const key = (fs) =>
    [...fs].sort().join(',');
  const k = key(lits[0]);
  for (const fs of lits) {
    if (key(fs) !== k) return null;
  }
  return lits[0];
}`,
        why: 'Sorting the names first throws away order, so `{x, y}` and `{y, x}` wrongly unify. Order is part of the shape.',
      },
    ],
  },
  inferNumeric: {
    optional: true,
    title: 'An optimistic fixpoint',
    prompt: '`defs` maps SSA names to definitions: `{ op: \'const\', value }`, `{ op: \'add\', args: [a, b] }` or `{ op: \'phi\', args: [...] }`. Write `inferNumeric(defs)`, returning an object mapping each name to `true` if it is provably a number. A const is numeric if `typeof value === \'number\'`; an add or phi if all its args are. Start **every** name at `true` and repeat rounds until nothing changes.',
    starter: `function inferNumeric(defs) {
  const num = {};
  // your code here
  return num;
}

console.log(inferNumeric({
  v0: { op: 'const', value: 0 },
  c: { op: 'const', value: 0.5 },
  v1: { op: 'phi', args: ['v0', 'v2'] },
  v2: { op: 'add', args: ['v1', 'c'] },
}));`,
    solution: `function inferNumeric(defs) {
  const num = {};
  for (const k in defs) num[k] = true;
  const rule = (d) => d.op === 'const'
    ? typeof d.value === 'number'
    : d.args.every((a) => num[a]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const k in defs) {
      const nv = rule(defs[k]);
      if (nv !== num[k]) {
        num[k] = nv;
        changed = true;
      }
    }
  }
  return num;
}`,
    tests: `const loop = (step) => ({
  v0: { op: 'const', value: 0 },
  c: { op: 'const', value: step },
  v1: { op: 'phi', args: ['v0', 'v2'] },
  v2: { op: 'add', args: ['v1', 'c'] },
});
test('a numeric loop is proven', () => {
  expect(inferNumeric(loop(0.5))).toEqual(
    { v0: true, c: true, v1: true, v2: true });
});
test('a string knocks the cycle down', () => {
  expect(inferNumeric(loop('!'))).toEqual(
    { v0: true, c: false, v1: false, v2: false });
});
test('order does not matter', () => {
  expect(inferNumeric({
    b: { op: 'add', args: ['a', 'a'] },
    a: { op: 'phi', args: ['s'] },
    s: { op: 'const', value: 'x' },
  })).toEqual({ b: false, a: false, s: false });
});`,
    hints: [
      'What does “optimistic” mean for the starting value of every name?',
      'One round recomputes every name from its rule, reading the current facts in `num`, and notes whether anything changed.',
      'Wrap the round in `while (changed)`: a name defined later in `defs` can knock down one defined earlier, so one round is not enough.',
    ],
    walkthrough: `**How to think about it.** This is section 3 of Viscosity’s \`analyze\`, for three kinds of instruction. The loop \`v1 = phi(v0, v2)\`, \`v2 = v1 + c\` is circular: to know \`v1\` you need \`v2\`, and to know \`v2\` you need \`v1\`. The way out is to guess for everything at once, then check the guesses with the rules, again and again, until the checks stop changing anything. Since the rules only ever say "number" when all inputs are numbers, a guess can only be knocked down, never raised, which is what makes the repetition end.

**The solution, line by line.**

- \`const num = {};\` holds the current fact for each name.
- \`for (const k in defs) num[k] = true;\` is the optimistic start: every name is guessed to be a number.
- \`const rule = (d) => d.op === 'const' ? typeof d.value === 'number' : d.args.every((a) => num[a]);\` is the rule for one definition. A constant is a number if its \`typeof\` says so; an add or a phi is a number if every argument currently is.
- \`let changed = true;\` makes the loop run at least once.
- \`while (changed) {\` repeats whole rounds.
- \`changed = false;\` starts each round assuming nothing will change.
- \`for (const k in defs) {\` recomputes every name in the round.
- \`const nv = rule(defs[k]);\` is the new fact, from the current facts of its inputs.
- \`if (nv !== num[k]) { num[k] = nv; changed = true; }\` stores a changed fact and remembers that the round did something, so another round will run.
- \`return num;\` runs after a round in which nothing changed: the fixpoint.

In the numeric loop, round 1 confirms every guess and round 2 changes nothing. With \`c = '!'\`, round 1 knocks down \`c\` and \`v2\`, round 2 knocks down \`v1\`, and round 3 changes nothing. In the last test, \`s\` falls in round 1, \`a\` in round 2 and \`b\` in round 3.

**Common wrong attempts.**

- Starting every name at \`false\` is the pessimistic start: \`v1\` waits for \`v2\`, which waits for \`v1\`, so a perfectly numeric loop is never proven.
- Running only one round: a fact that falls late in the round never reaches names computed earlier in it.`,
    wrong: [
      {
        code: `function inferNumeric(defs) {
  const num = {};
  for (const k in defs) num[k] = false;
  const rule = (d) => d.op === 'const'
    ? typeof d.value === 'number'
    : d.args.every((a) => num[a]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const k in defs) {
      const nv = rule(defs[k]);
      if (nv !== num[k]) {
        num[k] = nv;
        changed = true;
      }
    }
  }
  return num;
}`,
        why: 'This is the pessimistic start. `v1` waits for `v2`, which waits for `v1`, so the numeric loop is never proven.',
      },
      {
        code: `function inferNumeric(defs) {
  const num = {};
  for (const k in defs) num[k] = true;
  for (const k in defs) {
    const d = defs[k];
    num[k] = d.op === 'const'
      ? typeof d.value === 'number'
      : d.args.every((a) => num[a]);
  }
  return num;
}`,
        why: 'Only one round. `s` falls after `a` and `b` were computed, so they never hear about it and stay `true`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these does Viscosity’s collection discovery treat as a candidate collection?',
    options: [
      {
        t: '`var ps = [];` filled with `{ x: i }`',
        why: 'var bindings are skipped outright.',
      },
      {
        t: '`let ps = [];` filled with `{ x: i }`',
        correct: true,
        why: 'A let given a fresh array literal is a candidate; it is a collection if nothing rejects it.',
      },
      {
        t: '`const ps = make();`',
        why: 'Only stores of array.empty or array.new create candidates.',
      },
      {
        t: '`const o = { x: 1 };`',
        why: 'An object literal is a record, not an array.',
      },
    ],
  },
  {
    q: 'Which use of a candidate collection does Viscosity’s discovery NOT accept?',
    options: [
      {
        t: '`ps.length`',
        why: 'Recorded as a length read.',
      },
      {
        t: '`ps[i]`',
        why: 'An index.get; its element is checked later.',
      },
      {
        t: '`ps.push({ x: i })`',
        why: 'One fresh record: accepted, and shape-checked.',
      },
      {
        t: '`ps.map((p) => p.x)`',
        correct: true,
        why: 'Only .length and .push are supported as fields of the array.',
      },
    ],
  },
  {
    q: 'An analysis proves values numeric with rules such as “a + b is a number if a and b are”. Why would a pessimistic start (everything “maybe not”) fail to prove `v` numeric in a loop doing `v = v + 0.5`?',
    options: [
      {
        t: '0.5 is not an integer',
        why: 'Fractions are numbers; a Float64Array stores them fine.',
      },
      {
        t: 'Loops can’t be analysed statically',
        why: 'They can: that is what the fixpoint is for.',
      },
      {
        t: 'The phi waits for the add, the add waits for the phi, and neither can go first',
        correct: true,
        why: 'Starting from “maybe not”, the cycle stays “maybe not” forever, even though it is clearly numeric.',
      },
      {
        t: 'It wouldn’t fail',
        why: 'Starting from “maybe not”, the phi can never be proven: its back-edge input waits on it.',
      },
    ],
  },
  {
    q: 'A collection is filled with the literals `{ x: i, y: 1 }` and `{ y: 1, x: i }`. What does Viscosity’s shape inference conclude?',
    options: [
      {
        t: 'One shape, {x, y}',
        why: 'That would need sorting the fields, which throws away an observable difference.',
      },
      {
        t: 'Different shapes: field order differs, so Viscosity keeps the array of objects',
        correct: true,
        why: 'The lists must match exactly. Order is visible in JavaScript and used by the code generator.',
      },
      {
        t: 'One shape, but `y` becomes a plain column',
        why: 'Column kind is about types; this is a shape mismatch.',
      },
      {
        t: 'It depends on the values',
        why: 'Shape is about names and order, not values.',
      },
    ],
  },
];
