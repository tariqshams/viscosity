// Chapter 225 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ti-what': {
    q: 'What is type inference?',
    a: 'Deducing the types of values from how they are made and used, without annotations.',
  },
  'ti-annotations': {
    q: 'Why doesn’t Viscosity rely on TypeScript annotations to prove a field is numeric?',
    a: 'They are erased before the code runs and never check or change what actually runs, so they prove nothing about real values.',
  },
  'ti-flow': {
    q: 'Why does giving facts to SSA values (rather than to variables) make them flow-sensitive?',
    a: 'Each assignment makes a new SSA value, so one variable can have a different fact at each point in the program.',
  },
  'ti-union': {
    q: '`x` is `1` on one path and `\'one\'` on the other. What is the fact for the phi where the paths meet, and what does Viscosity record?',
    a: 'A union, number or string; Viscosity’s two-level lattice records it as “maybe not a number”.',
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
    a: 'On a loop each value waits for the other. Starting pessimistic, the cycle can never prove itself; starting optimistic, it can, and wrong guesses are knocked down.',
  },
  'ti-terminates': {
    q: 'Why must the optimistic fixpoint end, and what does Viscosity do if it somehow doesn’t within 1000 rounds?',
    a: 'Facts only fall (number → maybe not) and there are finitely many; if it hasn’t settled it fails closed, treating nothing as proven.',
  },
  'si-what': {
    q: 'What is shape inference?',
    a: 'Deducing an object’s layout (its fields and their order) statically, from the code that creates the objects.',
  },
  'si-order': {
    q: 'Name one reason `{ x, y }` and `{ y, x }` count as different shapes.',
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
      { t: '0.5 is not an integer', why: 'Fractions are numbers; a Float64Array stores them fine.' },
      { t: 'Loops can’t be analysed statically', why: 'They can: that is what the fixpoint is for.' },
      { t: 'The phi waits for the add, the add waits for the phi, and neither can go first', correct: true, why: 'Starting from “maybe not”, the cycle stays “maybe not” forever, even though it is clearly numeric.' },
      { t: 'It wouldn’t fail', why: 'Step through the diagram: the pessimistic start loses the loop.' },
    ],
  },
  {
    q: '`let x = 1; if (c) x = \'one\';` What does Viscosity know about `x` after the `if`?',
    options: [
      { t: 'It is a number, because it started as one', why: 'Facts belong to SSA values; after the `if`, `x` is the phi, not the first value.' },
      { t: 'It is a string, because that was the last assignment', why: 'The assignment only happens on one path.' },
      { t: 'The phi is number or string, a union, which Viscosity records as “maybe not”', correct: true, why: 'A join of number and string is a union; the two-level lattice cannot say more.' },
      { t: 'Nothing: inference stops at branches', why: 'Phis are exactly how facts cross branches.' },
    ],
  },
  {
    q: 'The literals are `{ x: i, y: 1 }` and `{ y: 1, x: i }`. What does shape inference conclude?',
    options: [
      { t: 'One shape, {x, y}', why: 'That would need sorting the fields, which throws away an observable difference.' },
      { t: 'Different shapes: field order differs, so Viscosity keeps the array of objects', correct: true, why: 'The lists must match exactly. Order is visible in JavaScript and used by the code generator.' },
      { t: 'One shape, but `y` becomes a plain column', why: 'Column kind is about types; this is a shape mismatch.' },
      { t: 'It depends on the values', why: 'Shape is about names and order, not values.' },
    ],
  },
  {
    q: 'How does V8 learn similar facts, and why can’t Viscosity do it the same way?',
    options: [
      { t: 'From TypeScript annotations', why: 'Types are erased before the engine ever sees the code.' },
      { t: 'By asking the programmer', why: 'Neither asks; both deduce.' },
      { t: 'It doesn’t: V8 treats every field as untyped', why: 'V8 tracks field representations and shapes, as Part V showed.' },
      { t: 'By watching type feedback and speculating, with deoptimization as a way back; Viscosity has no way back, so it must prove', correct: true, why: 'A guess is fine if you can undo it. Ahead-of-time output must be right on every run.' },
    ],
  },
];
