// Chapter 182 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ti-what': {
    q: 'What is type inference?',
    a: 'Deducing the types of values from how they are made and used, without annotations.',
  },
  'ti-annotations': {
    q: 'Why doesn’t Viscosity rely on TypeScript annotations to prove a field is numeric?',
    a: 'It strips them before analysis, and they are erased: they never change or check what actually runs.',
  },
  'ti-plus': {
    q: 'Why is `a + b` a number only when both `a` and `b` are numbers?',
    a: 'Because `+` joins strings: `1 + \'1\'` is `\'11\'`.',
  },
  'ti-param': {
    q: 'When can Viscosity prove a function parameter is a number?',
    a: 'When the function is known (every call site is visible) and every call site passes a number.',
  },
  'ti-optimistic': {
    q: 'Why does numeric inference start values on cycles at “number”, not “maybe not”?',
    a: 'On a loop, each value waits for the other. Starting pessimistic, the cycle can never prove itself; starting optimistic, it can.',
  },
  'ti-terminates': {
    q: 'Why must the optimistic fixpoint loop end?',
    a: 'Facts only fall (number → maybe not), and there are finitely many facts, so eventually a round changes nothing.',
  },
  'ti-poison': {
    q: 'Only `y` ever gets a string. Why does `ps[i].x += ps[i].y` make `x` non-numeric too?',
    a: 'It stores `x + y` into `x`, and with `y` maybe a string, that sum may be a string.',
  },
  'ti-plain': {
    q: 'What does Viscosity do with a field that may hold non-numbers?',
    a: 'Gives it a plain JavaScript array column. The numeric fields still get `Float64Array` columns.',
  },
  'si-what': {
    q: 'What is shape inference?',
    a: 'Deducing an object’s layout (its fields and their order) statically, from the code that creates the objects.',
  },
  'si-order': {
    q: 'Name one reason `{ x, y }` and `{ y, x }` count as different shapes.',
    a: 'JavaScript can see the order (`Object.keys`, `JSON.stringify`); also Viscosity reads each column’s value from a fixed position in the literal.',
  },
  'si-unify': {
    q: 'How does Viscosity combine the field lists of all the literals pushed into a collection?',
    a: 'The first list becomes the shape; every other list must be exactly equal, order included, or it bails out.',
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
  unifyShapes: {
    title: 'Unify the literals',
    prompt:
      'Each object literal pushed into a collection is given as an array of its field names, in order, e.g. `[\'x\', \'y\']`. Write `unifyShapes(lits)`, returning the collection’s shape (the field list) if **every** literal has exactly the same fields in the same order. Return `null` if any differs, or if there are no literals at all.',
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
      'With no literals, return `null` straight away. Otherwise the first literal is the candidate shape.',
      'Compare every literal with the candidate: first the lengths, then each position.',
      'Return `null` as soon as anything differs; after the loop, return the candidate.',
    ],
    walkthrough: `This is \`setShape\` from Viscosity’s analysis, minus the bailout messages.

- **The first literal decides.** There is no “expected shape” written anywhere, so the first record seen proposes one, and the rest must agree with it.
- **Equality, not similarity.** Comparing position by position checks names *and* order. \`['x', 'y']\` against \`['y', 'x']\` fails at position 0, which is what we want: JavaScript can observe the order, and the compiler reads column values by position.
- **Check the length.** Without it, \`['x', 'y']\` against \`['x', 'y', 'z']\` would compare only two positions and wrongly agree. Either an extra or a missing field must fail.
- **No literals is not a shape.** Viscosity says “no records are ever added, so there is nothing to lay out”.

A smarter compiler could unify more generously, for example by sorting fields or allowing optional ones. Each step in that direction needs more care in the code generator, so Viscosity starts with the strict rule.`,
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
    prompt:
      '`defs` maps SSA names to definitions: `{ op: \'const\', value }`, `{ op: \'add\', args: [a, b] }` or `{ op: \'phi\', args: [...] }`. Write `inferNumeric(defs)`, returning an object mapping each name to `true` if it is provably a number. A const is numeric if `typeof value === \'number\'`; an add or phi if all its args are. Start **every** name at `true` and repeat rounds until nothing changes.',
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
      'First set `num[k] = true` for every name: that is the optimistic start.',
      'One round: recompute every name from its rule, using the current `num`. Note whether anything changed.',
      'Repeat rounds while something changed. A name defined later may knock down one defined earlier, so one round is not enough.',
    ],
    walkthrough: `This is section 3 of Viscosity’s \`analyze\`, for three kinds of instruction.

- **Optimistic start.** Every name begins as \`true\`. For the loop, \`v1\` and \`v2\` depend on each other; starting them at \`true\` lets them confirm each other when everything they touch is numeric.
- **Rounds until stable.** Each round applies the rules to the current facts. A \`false\` can make other names \`false\` in later rounds, which is why the \`while (changed)\` loop is needed. In the last test, \`s\` falls in round 1, \`a\` in round 2 and \`b\` only in round 3.
- **Why it ends.** Rules only combine facts with “and”, so once a name is \`false\` it can never become \`true\` again. Each round either lowers at least one fact or stops.

Try starting every name at \`false\` instead: the numeric loop then proves nothing, which is the pessimistic failure from the diagram.`,
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
    q: 'Which of these does Viscosity prove to be a number?',
    options: [
      { t: '`a + b`, where `a` is a number and `b` is unknown', why: '`b` could be a string, and then `+` joins strings.' },
      { t: '`v1 = phi(0, v1 + 1)` in a counting loop', correct: true, why: 'The optimistic fixpoint guesses “number” for the cycle, and every rule confirms it.' },
      { t: 'A parameter of a function that is passed around as a callback', why: 'Not every call site is visible, so the parameter could be anything.' },
      { t: 'A field read from an object returned by an unknown call', why: 'Unknown operations fall to the default rule: not provably a number.' },
    ],
  },
  {
    q: 'Why would a pessimistic start fail on `v = v + 0.5` in a loop?',
    options: [
      { t: '0.5 is not an integer', why: 'Floating-point numbers are numbers; a Float64Array stores them fine.' },
      { t: 'Loops can’t be analysed statically', why: 'They can: that is what the fixpoint is for.' },
      { t: 'The phi waits for the add, the add waits for the phi, and neither can go first', correct: true, why: 'Starting from “maybe not”, the cycle stays “maybe not” forever, even though it is clearly numeric.' },
      { t: 'It wouldn’t fail', why: 'Step through the diagram: the pessimistic start loses the loop.' },
    ],
  },
  {
    q: '`add(5, \'far\')` is the only non-numeric call, and the hot loop is `ps[i].x *= 2`. What does Viscosity choose?',
    options: [
      { t: 'Keep the array of objects: one field is not numeric', why: 'A non-numeric field gets a plain array column instead; that isn’t a bailout.' },
      { t: 'Typed columns for both fields', why: '`y` may hold `\'far\'`, which a Float64Array would turn into NaN.' },
      { t: 'Struct of arrays with a typed column for `x` and a plain array column for `y`', correct: true, why: 'That is the real explain output: typed for x, plain for y.' },
      { t: 'A compile error', why: 'Viscosity never rejects a program; it only decides how to lay it out.' },
    ],
  },
  {
    q: 'The literals are `{ x: i, y: 1 }` and `{ y: 1, x: i }`. What does shape inference conclude?',
    options: [
      { t: 'Different shapes: field order differs, so Viscosity bails out', correct: true, why: 'The lists must match exactly. Order is visible in JavaScript and used by the code generator.' },
      { t: 'One shape, {x, y}', why: 'That would need sorting the fields, which throws away an observable difference.' },
      { t: 'One shape, but `y` becomes a plain column', why: 'Column kind is about types; this is a shape mismatch.' },
      { t: 'It depends on the values', why: 'Shape is about names and order, not values.' },
    ],
  },
  {
    q: 'Why does the optimistic fixpoint always finish?',
    options: [
      { t: 'Programs are short', why: 'Length doesn’t matter; the argument would hold for any finite program.' },
      { t: 'Viscosity times out after one second', why: 'There is a 100-round guard, but the loop ends on its own because of monotonicity.' },
      { t: 'Facts only ever fall from “number” to “maybe not”, and there are finitely many', correct: true, why: 'Each round either lowers some fact or changes nothing, and then it stops.' },
      { t: 'Each value is computed only once', why: 'Values are recomputed every round until nothing changes.' },
    ],
  },
  {
    q: 'How does V8 learn similar facts, and why can’t Viscosity do it the same way?',
    options: [
      { t: 'From TypeScript annotations', why: 'Types are erased before the engine ever sees the code.' },
      { t: 'By watching type feedback and speculating, with deoptimization as a way back; Viscosity has no way back, so it must prove', correct: true, why: 'A guess is fine if you can undo it. Ahead-of-time output must be right on every run.' },
      { t: 'By asking the programmer', why: 'Neither asks; both deduce.' },
      { t: 'It doesn’t: V8 treats every field as untyped', why: 'V8 tracks field representations and shapes, as Part V showed.' },
    ],
  },
];
