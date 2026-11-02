// Chapter 171 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rs-what': {
    q: 'What two things make up a record shape in Viscosity?',
    a: 'The fields, in order, and a column type for each field: a `Float64Array` if it provably always holds numbers, a plain array otherwise.',
  },
  'rs-plain': {
    q: 'One field of a collection sometimes holds a string. Does Viscosity bail out?',
    a: 'No. That field gets a plain array column; the numeric fields still get typed ones.',
  },
  'rs-first': {
    q: 'Where does Viscosity get a collection’s field list from?',
    a: 'From its object literals (`record.new` in VIR): the first one it meets sets the list, and every other one must match it.',
  },
  'rs-order': {
    q: 'Why must `{ x, y }` and `{ y, x }` count as different shapes?',
    a: 'The rewritten `push` is positional: slot k of the literal goes into column k. (And JavaScript itself can observe property order.)',
  },
  'rs-poison': {
    q: 'Which two kinds of value can make a column non-numeric?',
    a: 'The value in that field’s slot of any object literal, and the value stored by any `ps[i].f = v`.',
  },
  'rs-failclosed': {
    q: 'What happens if Viscosity’s numeric fixpoint hasn’t converged after 1000 rounds?',
    a: 'It fails closed: every “is a number” fact is set to false, so no column is typed.',
  },
  'ss-what': {
    q: 'What is shape stability?',
    a: 'Whether an object’s shape (its fields) can change after it is created.',
  },
  'ss-oneuse': {
    q: 'Why must the record in `ps.push({...})` have exactly one use?',
    a: 'Any other reference to it could change or observe the object later, behind the collection’s back: it would be aliased.',
  },
  'ss-addprop': {
    q: 'The records are `{x, y}`. What does Viscosity say about `ps[i].z = 1`?',
    a: '“adds a new property .z to an element”: a bailout, because there is no column for z.',
  },
  'ss-v8': {
    q: 'Why can V8 live with shapes that change, when Viscosity can’t?',
    a: 'V8 decides while the program runs and can move objects to new hidden classes later. Viscosity fixes one layout before the program runs.',
  },
};

export const examples = {
  coerce: {
    title: 'What a typed column does to a string',
    code: `const typed = new Float64Array(3);
typed[0] = 5;
typed[1] = 'far';
typed[2] = null;
console.log(typed[0], typed[1],
  typed[2]);

const plain = [5, 'far', null];
console.log(plain[1], plain[2]);
// The typed column changed the data.
// A field that may hold 'far' needs a
// plain array column.`,
  },
};

export const exercises = {
  unifyRecords: {
    title: 'Unify record shapes',
    prompt:
      'Each object literal is given as an array of `[field, value]` pairs, in order: `{ x: 1, y: \'a\' }` is `[[\'x\', 1], [\'y\', \'a\']]`. Write `unifyRecords(recs)`. If every literal has exactly the same fields in the same order, return `{ fields, typed }`: `fields` is the field list, and `typed` lists, in field order, the fields whose value is a number (`typeof v === \'number\'`) in **every** literal. Return `null` if any literal differs, or if there are none.',
    starter: `function unifyRecords(recs) {
  // your code here
  return null;
}

console.log(unifyRecords([
  [['x', 1], ['y', 'a']],
  [['x', 2], ['y', 3]],
]));`,
    solution: `function unifyRecords(recs) {
  if (recs.length === 0) return null;
  const fields = recs[0].map(p => p[0]);
  const num = fields.map(() => true);
  for (const r of recs) {
    if (r.length !== fields.length)
      return null;
    for (let k = 0; k < r.length; k++) {
      const [f, v] = r[k];
      if (f !== fields[k]) return null;
      if (typeof v !== 'number')
        num[k] = false;
    }
  }
  const typed =
    fields.filter((f, k) => num[k]);
  return { fields, typed };
}`,
    tests: `test('all numbers: every field typed', () => {
  expect(unifyRecords([
    [['x', 1], ['y', 2]],
    [['x', 3], ['y', 4]],
  ])).toEqual({ fields: ['x', 'y'], typed: ['x', 'y'] });
});
test('one string makes that field plain', () => {
  expect(unifyRecords([
    [['x', 1], ['y', 2]],
    [['x', 5], ['y', 'far']],
  ])).toEqual({ fields: ['x', 'y'], typed: ['x'] });
});
test('field order differs', () => {
  expect(unifyRecords([
    [['x', 1], ['y', 2]],
    [['y', 1], ['x', 2]],
  ])).toBe(null);
});
test('an extra field', () => {
  expect(unifyRecords([
    [['x', 1]],
    [['x', 1], ['z', 2]],
  ])).toBe(null);
});
test('a missing field', () => {
  expect(unifyRecords([
    [['x', 1], ['z', 2]],
    [['x', 1]],
  ])).toBe(null);
});
test('null is not a number', () => {
  expect(unifyRecords([
    [['tag', null]],
  ])).toEqual({ fields: ['tag'], typed: [] });
});
test('no literals: no shape', () => {
  expect(unifyRecords([])).toBe(null);
});`,
    hints: [
      'With no literals, return `null`. Otherwise the first literal’s field names are the shape.',
      'Keep one flag per field, starting at `true`, that means “every value so far was a number”.',
      'For each literal: check the length, then each position’s name. Clear the flag when a value isn’t a number. Build `typed` at the end with `filter`.',
    ],
    walkthrough: `This is \`setShape\` plus the column half of the numeric fixpoint, without the fixpoint.

- **The first literal sets the shape.** Its field names, in order, are the candidate list. Every other literal must match it exactly, so you compare lengths first (an extra or missing field) and then the name at each position (a different field, or the same fields in another order).
- **Types are per field and can only fall.** Each flag starts optimistic (“number”) and is cleared by the first value that isn’t one. One \`'far'\` is enough. Nothing ever sets a flag back to \`true\`. This is the two-level lattice from chapter 128 again.
- **A string doesn’t break the shape.** The answer for \`[x: 5, y: 'far']\` is still a shape; \`y\` just isn’t in \`typed\`, so it would get a plain array column.
- **Why \`null\` isn’t typed:** a \`Float64Array\` would store \`null\` as \`0\`, which is a different value.

The real analysis has one more complication: a value can be a variable or an expression, not a constant, so “is it a number?” is itself a fact computed by the fixpoint. Here \`typeof\` stands in for that.`,
    wrong: [
      {
        code: `function unifyRecords(recs) {
  if (recs.length === 0) return null;
  const fields = recs[0].map(p => p[0]);
  const want = [...fields].sort();
  for (const r of recs) {
    const fs = r.map(p => p[0]).sort();
    if (fs.join() !== want.join())
      return null;
  }
  return { fields, typed: fields };
}`,
        why: 'Sorting the names accepts `{y, x}` as the same shape as `{x, y}`, but the positional `push` would put values in the wrong columns. It also never looks at the values, so a string field is reported as typed.',
      },
      {
        code: `function unifyRecords(recs) {
  if (recs.length === 0) return null;
  const fields = recs[0].map(p => p[0]);
  for (const r of recs)
    for (let k = 0; k < r.length; k++)
      if (r[k][0] !== fields[k])
        return null;
  const typed = fields.filter((f, k) =>
    typeof recs[0][k][1] === 'number');
  return { fields, typed };
}`,
        why: 'Two mistakes: a literal that is a prefix of the shape (a missing field) passes, because the loop only runs over that literal’s own slots; and the types come from the first literal only. A later string must make the field plain.',
      },
    ],
  },
  stableUses: {
    optional: true,
    title: 'Keep the shape stable',
    prompt:
      'An element’s uses are a list of `{ op, field, line }`, where `op` is `\'get\'`, `\'set\'` or `\'delete\'`. Write `stableUses(fields, uses)`, returning the first use that could change or step outside the shape: a `get` of a field not in `fields` gives `\'line N: reads .f\'`, a `set` of one gives `\'line N: adds .f\'`, and any `delete` gives `\'line N: deletes .f\'`. Return `null` if every use is a read or write of a known field.',
    starter: `function stableUses(fields, uses) {
  // your code here
  return null;
}

console.log(stableUses(['x', 'y'], [
  { op: 'set', field: 'z', line: 5 },
]));`,
    solution: `function stableUses(fields, uses) {
  for (const u of uses) {
    const at = 'line ' + u.line + ': ';
    const ok = fields.includes(u.field);
    if (u.op === 'delete')
      return at + 'deletes .' + u.field;
    if (ok) continue;
    if (u.op === 'get')
      return at + 'reads .' + u.field;
    return at + 'adds .' + u.field;
  }
  return null;
}`,
    tests: `test('reads and writes of known fields are fine', () => {
  expect(stableUses(['x', 'y'], [
    { op: 'get', field: 'x', line: 4 },
    { op: 'set', field: 'y', line: 4 },
  ])).toBe(null);
});
test('writing a new field adds a property', () => {
  expect(stableUses(['x', 'y'], [
    { op: 'get', field: 'x', line: 4 },
    { op: 'set', field: 'z', line: 5 },
  ])).toBe('line 5: adds .z');
});
test('reading a missing field', () => {
  expect(stableUses(['x'], [
    { op: 'get', field: 'hp', line: 7 },
  ])).toBe('line 7: reads .hp');
});
test('deleting even a known field', () => {
  expect(stableUses(['x', 'y'], [
    { op: 'delete', field: 'y', line: 3 },
  ])).toBe('line 3: deletes .y');
});
test('the first problem wins', () => {
  expect(stableUses(['x'], [
    { op: 'set', field: 'a', line: 2 },
    { op: 'get', field: 'b', line: 3 },
  ])).toBe('line 2: adds .a');
});`,
    hints: [
      'Check `delete` before anything else: removing a known field changes the shape too.',
      'For `get` and `set`, a field in `fields` is fine. Otherwise build the message from the op.',
    ],
    walkthrough: `Viscosity’s rule for elements is an allow-list: a read of a known field and a write of a known field. Everything else either changes the shape (adding or deleting a property) or needs a column that doesn’t exist (reading a missing field).

The order of the checks matters for \`delete\`: deleting \`y\` names a field that *is* in the shape, so a solution that skips known fields first would let it through. In the real engine \`delete\` isn’t modelled at all; it becomes an \`opaque\` instruction, and every operand of an opaque instruction is assumed to escape.`,
    wrong: [
      {
        code: `function stableUses(fields, uses) {
  for (const u of uses) {
    const ok = fields.includes(u.field);
    if (ok) continue;
    const at = 'line ' + u.line + ': ';
    if (u.op === 'get')
      return at + 'reads .' + u.field;
    if (u.op === 'set')
      return at + 'adds .' + u.field;
    return at + 'deletes .' + u.field;
  }
  return null;
}`,
        why: 'Deleting a field the shape has is skipped as “known”. `delete ps[i].y` changes the shape just as much as adding a field does.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Every literal pushed into `ps` is `{ x: number, label: string }`. What does Viscosity do about the shape?',
    options: [
      { t: 'Bails out, because not every field is a number', why: 'Mixed types are fine. Only the fields must agree.' },
      { t: 'Unifies it as `{x, label}`, with a typed column for x and a plain one for label', correct: true, why: 'The shape is fields plus column types; `label` simply isn’t numeric.' },
      { t: 'Drops the label field', why: 'Viscosity never drops data. Every field gets a column.' },
      { t: 'Converts the labels to numbers', why: 'That would change the program. Typed arrays are only used where every value is already a number.' },
    ],
  },
  {
    q: 'Why does Viscosity reject `{ x: 1, y: 2 }` and `{ y: 3, x: 4 }` in the same collection?',
    options: [
      { t: 'The values are different', why: 'Values never need to match; only the field lists do.' },
      { t: 'Objects with two fields are too small', why: 'Size doesn’t matter for shape unification.' },
      { t: 'It compares field lists in order, and the rewritten `push` copies slot k into column k', correct: true, why: 'Accepting the second literal blindly would put 3 into the x column.' },
      { t: 'V8 would deoptimize', why: 'This is Viscosity’s own rule about its own rewrite, not a V8 behaviour.' },
    ],
  },
  {
    q: '`shape_mismatch.js` pushes `{x, y}` on line 4 and `{y, x}` on line 5. Why does explain say the shape is `{y, x}`?',
    options: [
      { t: 'It sorts fields in reverse', why: 'Fields are never sorted; order is part of the shape.' },
      { t: 'Its worklist takes the last use of `ps` first, so it meets line 5’s literal first', correct: true, why: 'The verdict doesn’t depend on which literal comes first, only the wording of the message does.' },
      { t: 'Line 5 runs more often', why: 'The analysis doesn’t count executions.' },
      { t: 'The later literal always wins', why: 'No literal “wins”: any disagreement is a bailout.' },
    ],
  },
  {
    q: 'The numeric fixpoint is cut off after 1000 rounds without converging. What does Viscosity conclude?',
    options: [
      { t: 'Whatever facts it had at round 1000', why: 'Those are partly unchecked guesses from an optimistic start, not proofs.' },
      { t: 'That every field is numeric', why: 'That is the optimistic starting point, the least proven state of all.' },
      { t: 'It reports an internal error and stops compiling', why: 'It carries on, just without any typed columns.' },
      { t: 'Nothing is proven numeric: it fails closed', correct: true, why: 'The safe direction for an unfinished proof is “not proven”.' },
    ],
  },
  {
    q: 'Which of these keeps every element’s shape stable?',
    options: [
      { t: '`ps[i].x = ps[i].x * 2`, where x is a field', correct: true, why: 'A write to a known field changes a value, not the shape.' },
      { t: '`ps[i].seen = true`, where seen is not a field', why: 'That adds a property: “adds a new property .seen to an element”.' },
      { t: '`delete ps[i].x`', why: 'Removing a property changes the shape. Viscosity doesn’t model `delete` at all.' },
      { t: '`const r = { x: 1 }; ps.push(r); r.x = 2;`', why: 'The record has a second reference, `r`, so it could be changed behind the collection’s back.' },
    ],
  },
  {
    q: 'Why is shape stability something Viscosity must prove, while V8 can merely react to shape changes?',
    options: [
      { t: 'V8 forbids adding properties to objects', why: 'It doesn’t: it moves the object to a new hidden class.' },
      { t: 'Viscosity is slower than V8', why: 'Speed isn’t the point. The difference is when each one decides.' },
      { t: 'Viscosity fixes the layout before the program runs and can’t revise it', correct: true, why: 'V8 decides while running and can change its mind. A source rewrite can’t.' },
      { t: 'Only TypeScript objects have stable shapes', why: 'Type annotations are stripped and never trusted; Viscosity proves stability from the code.' },
    ],
  },
];
