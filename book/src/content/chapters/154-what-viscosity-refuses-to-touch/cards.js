// Chapter 154 cards. Keys are stable ids: never rename them.

export const prompts = {
  'bo-what': {
    q: 'What is a bailout?',
    a: 'Leaving a collection unchanged because its safety can’t be proved.',
  },
  'bo-cost': {
    q: 'Why is a wrong refusal much cheaper than a wrong acceptance?',
    a: 'A wrong refusal only loses speed. A wrong acceptance changes what the program prints.',
  },
  'bo-identity': {
    q: 'Why can’t a struct of arrays support `keep[0] === ps[0]`?',
    a: 'It has no element objects. A built object is a new copy each time, and `===` compares identity, not contents.',
  },
  'bo-push': {
    q: 'In `aliasing_identity.js`, why must the write through `keep[0]` show up in `ps[0]`?',
    a: 'Both arrays hold references to the same object. A copy in `keep` would take the write and leave `ps` unchanged.',
  },
  'bo-closure': {
    q: 'How can you fix `const p = ps[3]; const f = () => p.x;` so Viscosity accepts it?',
    a: 'Keep the index instead of the element: `const k = 3; const f = () => ps[k].x;`.',
  },
  'bo-unknown': {
    q: 'Why does `console.log(ps[3])` make Viscosity refuse?',
    a: 'The element is passed to code Viscosity can’t see into, which needs (and here prints) a real object.',
  },
  'bo-map': {
    q: 'Which two members of the array does Viscosity model?',
    a: '`.length` and `.push`. Any other, like `.map`, is a bailout.',
  },
  'bo-reassign': {
    q: 'Why is a reassigned `let ps` a bailout?',
    a: 'After `ps = ...`, the name may hold a different array that wasn’t rewritten, so every `ps[i]` would have to work on both.',
  },
  'bo-string': {
    q: '`ps[\'5\']` returns element 5. Why does Viscosity still refuse a string index?',
    a: 'It only knows the index may not be a number, and a string like `\'length\'` reads a property instead of an element.',
  },
  'bo-notunsafe': {
    q: 'How can you tell a bailout from a cost decision in explain?',
    a: 'Bailout reasons start with `unsafe:`. Cost decisions (no numeric field, no loop, too small) don’t.',
  },
};

export const examples = {
  fake: {
    title: 'What columns would have to fake',
    code: `// Columns, and a way to build an
// element object on demand.
const soa = { x: [0, 1, 2] };
const get = (i) => ({ x: soa.x[i] });

const keep = [get(0)];
keep[0].x = 42;
console.log(soa.x[0]);
console.log(keep[0] === get(0));
// With real objects these would
// print 42 and true.`,
  },
};

export const exercises = {
  refusal: {
    title: 'Print the refusal',
    prompt:
      'A collection is `{ name, line, fields, bailouts }`. Write `refusal(c)`, returning the lines `viscosity explain` prints when it bails out, as an array of strings: first `NAME (line L) {F1, F2} → kept as array of objects`, then one line `\'  · unsafe: \' + reason` per reason, in order, **without duplicates**. If there are no bailouts, return `null` (the collection is safe, and other questions decide its layout).',
    starter: `function refusal(c) {
  // your code here
  return null;
}

console.log(refusal({
  name: 'ps', line: 2, fields: ['x'],
  bailouts: ['"ps" is reassigned'],
}));`,
    solution: `function refusal(c) {
  if (c.bailouts.length === 0)
    return null;
  const head = c.name + ' (line ' +
    c.line + ') {' +
    c.fields.join(', ') +
    '} → kept as array of objects';
  const rs = [...new Set(c.bailouts)];
  const lines = rs.map(
    (b) => '  · unsafe: ' + b);
  return [head, ...lines];
}`,
    tests: `test('one reason', () => {
  expect(refusal({ name: 'ps', line: 2, fields: ['x'],
    bailouts: ['line 4: an element is stored in another variable (p)'] }))
    .toEqual([
      'ps (line 2) {x} → kept as array of objects',
      '  · unsafe: line 4: an element is stored in another variable (p)',
    ]);
});
test('several fields, two reasons', () => {
  expect(refusal({ name: 'ps', line: 2, fields: ['x', 'y'],
    bailouts: ['a', 'b'] }))
    .toEqual([
      'ps (line 2) {x, y} → kept as array of objects',
      '  · unsafe: a',
      '  · unsafe: b',
    ]);
});
test('duplicates are removed, order kept', () => {
  expect(refusal({ name: 'a', line: 2, fields: ['x'],
    bailouts: ['b', 'a', 'b'] }))
    .toEqual([
      'a (line 2) {x} → kept as array of objects',
      '  · unsafe: b',
      '  · unsafe: a',
    ]);
});
test('no fields at all', () => {
  expect(refusal({ name: 'keep', line: 4, fields: [],
    bailouts: ['r'] })[0])
    .toBe('keep (line 4) {} → kept as array of objects');
});
test('no bailouts: not a refusal', () => {
  expect(refusal({ name: 'ps', line: 2, fields: ['x'], bailouts: [] }))
    .toBe(null);
});`,
    hints: [
      'Return `null` straight away when there are no bailouts.',
      'Build the header from its parts; `fields.join(\', \')` gives `x, y`.',
      '`[...new Set(list)]` removes duplicates and keeps the first-seen order.',
    ],
    walkthrough: `This is the bailout branch of \`plan.ts\` together with \`explain\`.

- **Bailouts first.** \`plan\` asks “are there any bailouts?” before anything else, and a yes ends the decision: \`keep(...c.bailouts.map((b) => \\\`unsafe: \${b}\\\`))\`. No cost is weighed.
- **Every reason, once.** The analysis keeps checking after the first failure, so one cause can be reported more than once (two \`index.get\`s on the same line, say). \`analyze\` ends with \`c.bailouts = [...new Set(c.bailouts)]\`. A \`Set\` keeps insertion order, which is why the first-seen order survives.
- **An empty field list is normal** for a collection that never received a fresh literal, like \`keep\` in \`aliasing_identity.js\`: \`keep (line 4) {}\`.

Returning \`null\` for a safe collection matters: “safe” is not the same as “transformed”. The cost model still has its say.`,
    wrong: [
      {
        code: `function refusal(c) {
  if (c.bailouts.length === 0)
    return null;
  const head = c.name + ' (line ' +
    c.line + ') {' +
    c.fields.join(', ') +
    '} → kept as array of objects';
  return [head, ...c.bailouts.map(
    (b) => '  · unsafe: ' + b)];
}`,
        why: 'Duplicate reasons are printed twice. The analysis can produce the same message from two uses, so it removes duplicates.',
      },
      {
        code: `function refusal(c) {
  const head = c.name + ' (line ' +
    c.line + ') {' + c.fields +
    '} → kept as array of objects';
  const rs = [...new Set(c.bailouts)];
  return [head, ...rs.map(
    (b) => '  · unsafe: ' + b)];
}`,
        why: 'Two problems: a safe collection is reported as kept, and `c.fields` turns into `x,y` without the space.',
      },
    ],
  },
  lesson: {
    optional: true,
    title: 'Which lesson is it?',
    prompt:
      'Write `lesson(reason)` that sorts a real bailout reason into a lesson. Return `\'identity\'` if it mentions `"==="` or `stored in another variable`; `\'unknown code\'` if it mentions `method call`, `function call` or `on the array`; `\'shape\'` if it mentions `field order` or `referenced elsewhere`; `\'type\'` if it mentions `may not be a number`; otherwise `\'other\'`. Check them in that order.',
    starter: `function lesson(reason) {
  // your code here
}

console.log(lesson('line 6: indexes ' +
  'the array with something that ' +
  'may not be a number'));`,
    solution: `const LESSONS = [
  ['identity', ['"==="',
    'stored in another variable']],
  ['unknown code', ['method call',
    'function call', 'on the array']],
  ['shape', ['field order',
    'referenced elsewhere']],
  ['type', ['may not be a number']],
];

function lesson(reason) {
  for (const [name, keys] of LESSONS)
    if (keys.some((k) =>
      reason.includes(k))) return name;
  return 'other';
}`,
    tests: `test('===', () => {
  expect(lesson('line 7: an element is compared or combined with "==="')).toBe('identity');
});
test('a second name', () => {
  expect(lesson('line 4: an element is stored in another variable (p)')).toBe('identity');
});
test('console.log', () => {
  expect(lesson('line 5: an element is passed to a method call')).toBe('unknown code');
});
test('.map', () => {
  expect(lesson('line 5: uses .map on the array (only .length and .push are supported)')).toBe('unknown code');
});
test('field order', () => {
  expect(lesson('line 4: records with different fields or field order ({x, y} vs {y, x})')).toBe('shape');
});
test('string index', () => {
  expect(lesson('line 6: indexes the array with something that may not be a number')).toBe('type');
});
test('reassigned', () => {
  expect(lesson('"ps" is reassigned (line 5), so it may not always hold this array')).toBe('other');
});`,
    hints: [
      'A table of `[lesson, keywords]` pairs keeps this short.',
      'Check the lessons in the order given, and use `includes` for each keyword.',
    ],
    walkthrough: `Sorting reasons by lesson is how you read explain output in practice: the wording names the *use*, and the lesson tells you what the use would have observed. Identity reasons need real objects; unknown-code reasons hand something to code Viscosity can’t see; shape reasons break the record shape or its stability; type reasons fail a numeric proof.

The order matters for one real message: “indexes the array with something that may not be a number” contains “the array” but not “on the array”, so it falls through to type. A keyword like \`array\` alone would have sorted it wrongly.`,
    wrong: [
      {
        code: `function lesson(reason) {
  if (reason.includes('==='))
    return 'identity';
  if (reason.includes('array'))
    return 'unknown code';
  if (reason.includes('field'))
    return 'shape';
  if (reason.includes('number'))
    return 'type';
  return 'other';
}`,
        why: 'The keywords are too loose: the string-index reason contains “array” and is sorted as unknown code, and a second name (“stored in another variable”) is missed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'explain says `ps … → kept as array of objects · no loop reads or writes its fields`. Is this a bailout?',
    options: [
      { t: 'Yes: every “kept” is a bailout', why: 'Bailouts are about safety; this is about payoff.' },
      { t: 'Yes, because it can’t prove the loops are hot', why: 'Hotness is a cost question, not a safety one.' },
      { t: 'No: there is no `unsafe:`, so it is safe but judged not worth changing', correct: true, why: 'Cost decisions never carry the `unsafe:` prefix.' },
      { t: 'No, it is a compiler error', why: 'It is a normal decision, with a reason.' },
    ],
  },
  {
    q: 'Why does `keep.push(ps[i])` make `ps` unsafe?',
    options: [
      { t: '`keep` is too small', why: 'Size doesn’t matter here.' },
      { t: '`push` is slow', why: 'Speed is not what bailouts are about.' },
      { t: '`keep` would need real element objects shared with `ps`, so writes through one show up in the other', correct: true, why: 'Columns have no element objects, and a copy breaks the sharing.' },
      { t: 'It isn’t: only `keep` bails out', why: 'Both do; `ps` reports “an element is used by push”.' },
    ],
  },
  {
    q: 'Which change lets Viscosity accept `closure_alias.js`, with the same output?',
    options: [
      { t: 'Change `const p` to `let p`', why: 'The element is still stored under another name.' },
      { t: 'Keep the index: `const k = 3; const f = () => ps[k].x;`', correct: true, why: 'Now the closure reads through the collection, a field read Viscosity can rewrite.' },
      { t: 'Copy the value: `const v = ps[3].x; const f = () => v;`', why: 'That is accepted, but it prints 3 instead of 4: it changes the program.' },
      { t: 'Wrap the loop in a function', why: 'The problem is the second name `p`, not where the loop is.' },
    ],
  },
  {
    q: 'Why is `ps.map(f)` a bailout even if `f` only reads `p.x`?',
    options: [
      { t: 'Viscosity models only `.length` and `.push` on the array, and doesn’t look inside `map`', correct: true, why: '`map` hands real elements to a callback and builds a new array; it is code Viscosity can’t see into.' },
      { t: 'Arrow functions are not supported', why: 'Arrow functions are fine elsewhere; the problem is the array method.' },
      { t: 'Because `map` returns a new array', why: 'That is part of it, but even `forEach` bails out: any member other than length and push.' },
      { t: 'It isn’t, if `f` is short', why: 'Viscosity doesn’t inline callbacks, whatever their size.' },
    ],
  },
  {
    q: 'A program has `let ps = []`, fills it, and later does `ps = []`. Why does Viscosity refuse?',
    options: [
      { t: 'The second array is empty', why: 'Being empty isn’t the problem; being a different array is.' },
      { t: '`let` is never allowed', why: '`let` is fine if it is assigned once.' },
      { t: 'It runs out of memory', why: 'Nothing to do with memory.' },
      { t: 'The name may hold an array Viscosity didn’t rewrite, so `ps[i]` would have to work for both', correct: true, why: '“"ps" is reassigned (line 5), so it may not always hold this array”.' },
    ],
  },
  {
    q: 'How do Viscosity’s bailouts differ from V8’s deoptimizations?',
    options: [
      { t: 'They are the same thing', why: 'Both give up on an optimization, but at different times and with different costs.' },
      { t: 'Viscosity’s happen before the program runs and last the whole run; V8’s happen at run time when a speculation fails', correct: true, why: 'V8 can try again later; a source rewrite can’t.' },
      { t: 'V8 never bails out', why: 'It deoptimizes whenever a speculation turns out wrong.' },
      { t: 'Viscosity’s bailouts make the program slower than before', why: 'A bailout leaves the code exactly as it was.' },
    ],
  },
];
