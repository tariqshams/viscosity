// Chapter 222 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'kinds-lattice': {
    q: 'In a type analysis whose facts are sets of possible kinds, what is the join of two facts, and what is the optimistic starting fact?',
    a: 'The join is set union; the optimistic start is the empty set (no value seen yet), and the set of every kind means nothing is known.',
  },
  'plus-string': {
    q: 'In JavaScript, when is the result of `a + b` certainly a string?',
    a: 'When either operand is a string (after objects are converted to primitives, a string on either side means concatenation).',
  },
  'plus-object': {
    q: 'Why can `o + 1`, where `o` is an object, be either a number or a string in JavaScript?',
    a: 'The object is first converted to a primitive by its valueOf or toString; a number gives numeric addition, a string gives concatenation (`[] + 1` is `\'1\'`).',
  },
  'narrow-edges': {
    q: 'What does narrowing do to a value’s possible types at a test such as `typeof x === \'number\'`?',
    a: 'On the true edge it keeps only the types the test allows (here number); on the false edge it removes them.',
  },
  'narrow-copy': {
    q: 'Why does an SSA-based analysis insert a copy of `x` at the start of each branch of a test on `x` in order to narrow it?',
    a: 'An SSA value has one fact everywhere; a new name per branch gives each branch a place to hold its own, narrower fact.',
  },
  'narrow-null': {
    q: 'Which non-object value must an analysis keep on the true edge of `typeof x === \'object\'`?',
    a: '`null`, because `typeof null` is `\'object\'`.',
  },
  'narrow-field': {
    q: 'After `if (typeof p.x === \'number\')`, why may a compiler not assume `p.x` is still a number after a call to an unknown function?',
    a: 'The call might write p.x through another reference to the same object; only alias analysis showing it cannot write that field keeps the fact.',
  },
  'shape-join': {
    q: 'When a type checker joins two record shapes instead of rejecting them, what happens to a field only one of them has?',
    a: 'It becomes optional in the joined shape; fields both have stay, with their types joined.',
  },
  'ts-optional-undefined': {
    q: 'For `[{ x: 1 }, { x: 1, z: 2 }]`, what does TypeScript 6.0 add to the first object type in the inferred element type, and why?',
    a: '`z?: undefined`, so that reading `.z` from any element type-checks (as `number | undefined`).',
  },
};

export const examples = {
  plusKinds: {
    title: 'What + gives, kind by kind',
    code: `const kind = (v) =>
  v === null ? 'null' : typeof v;
const two = { valueOf() { return 2; } };
const cases = [
  ['1 + 2', 1 + 2],
  ["'a' + 1", 'a' + 1],
  ['true + 1', true + 1],
  ['null + 1', null + 1],
  ['undefined + 1', undefined + 1],
  ['[] + 1', [] + 1],
  ['({}) + 1', ({}) + 1],
  ['two + 1', two + 1],
];
for (const [text, value] of cases) {
  console.log(text, '=', value,
    kind(value));
}`,
  },
};

export const exercises = {
  kindsRules: {
    title: 'The rule for + and a typeof test',
    prompt: 'Kinds are the strings `\'number\'`, `\'string\'`, `\'boolean\'`, `\'undefined\'`, `\'null\'` and `\'object\'`; a fact is an array of kinds. Write `addKinds(a, b)`, the sorted kinds that `x + y` may have when `x` has a kind in `a` and `y` a kind in `b`, following JavaScript. Then write `narrow(kinds, tag, edge)`, the sorted kinds left on the true edge (`edge === true`) or false edge of the test `typeof x === tag`.',
    starter: `function addKinds(a, b) {
  // your code here
  return [];
}

function narrow(kinds, tag, edge) {
  // your code here
  return kinds;
}

console.log(addKinds(['number'],
  ['string'])); // ['string']
console.log(narrow(['number', 'string'],
  'number', false)); // ['string']`,
    solution: `function addKinds(a, b) {
  const out = new Set();
  for (const x of a) {
    for (const y of b) {
      const str = 'string';
      if (x === str || y === str) {
        out.add('string');
      } else if (x === 'object' ||
          y === 'object') {
        out.add('number');
        out.add('string');
      } else {
        out.add('number');
      }
    }
  }
  return [...out].sort();
}

function narrow(kinds, tag, edge) {
  // typeof null is 'object'
  const tagOf = (k) =>
    k === 'null' ? 'object' : k;
  return kinds
    .filter((k) =>
      (tagOf(k) === tag) === edge)
    .sort();
}`,
    tests: `const KINDS = ['boolean', 'null', 'number', 'object', 'string', 'undefined'];
const SAMPLES = {
  number: [1, NaN], string: ['a', ''], boolean: [true],
  undefined: [undefined], null: [null],
  object: [{}, [], { valueOf() { return 2; } }],
};
const kindOf = (v) => (v === null ? 'null' : typeof v);
test('number + number is a number', () => {
  expect(addKinds(['number'], ['number'])).toEqual(['number']);
});
test('a string on either side makes a string', () => {
  expect(addKinds(['number'], ['string'])).toEqual(['string']);
  expect(addKinds(['object'], ['string'])).toEqual(['string']);
});
test('an object may become a number or a string', () => {
  expect(addKinds(['object'], ['number'])).toEqual(['number', 'string']);
});
test('unions are taken pair by pair', () => {
  expect(addKinds(['number', 'string'], ['number'])).toEqual(['number', 'string']);
  expect(addKinds(['boolean', 'null'], ['undefined'])).toEqual(['number']);
});
test('no value in, no value out', () => {
  expect(addKinds([], ['number'])).toEqual([]);
});
test('agrees with JavaScript on every pair of kinds', () => {
  for (const a of KINDS) for (const b of KINDS) {
    const seen = new Set();
    for (const x of SAMPLES[a]) for (const y of SAMPLES[b]) seen.add(kindOf(x + y));
    for (const k of seen) expect(addKinds([a], [b]).includes(k)).toBe(true);
  }
});
test('narrow on the true edge keeps only the tested kind', () => {
  expect(narrow(['number', 'string'], 'number', true)).toEqual(['number']);
});
test('narrow on the false edge removes it', () => {
  expect(narrow(['number', 'string'], 'number', false)).toEqual(['string']);
});
test('a test that cannot succeed leaves nothing', () => {
  expect(narrow(['string'], 'number', true)).toEqual([]);
});
test('typeof null is object, so null survives an object test', () => {
  expect(narrow(['null', 'number', 'object'], 'object', true)).toEqual(['null', 'object']);
  expect(narrow(['null', 'number'], 'object', false)).toEqual(['number']);
});`,
    hints: [
      'A fact is a set of possibilities, so work pair by pair: for every kind `x` in `a` and every kind `y` in `b`, decide what `x + y` can be, and collect the union in a `Set`.',
      'Check for a string first (a string on either side always concatenates), then for an object (it may convert to a number or to a string), and only then fall back to number. Try `[] + 1` and `true + 1` in a console if in doubt.',
      'For `narrow`, a kind survives the true edge when its `typeof` equals the tag, and the false edge when it does not. Remember that `typeof null` is `\'object\'`.',
    ],
    walkthrough: `**How to think about it.** A fact is a set of kinds, so an operation on facts is the operation on every pair of possibilities, collected into one set; that is what makes it sound, since whichever kinds the operands really have at run time, their pair was considered. The rule for one pair comes straight from how JavaScript's \`+\` works: objects are converted to primitives first, and then a string on either side means concatenation. Narrowing is a filter, with one trap: the test compares \`typeof\`, not the kind.

**The solution, line by line.**

- \`const out = new Set();\` collects the union, so a kind produced by several pairs appears once.
- The two loops visit every pair \`(x, y)\`.
- \`if (x === str || y === str)\` comes first: a string on either side gives a string, even when the other side is an object (\`({}) + 'a'\` is \`'[object Object]a'\`).
- \`else if (x === 'object' || y === 'object')\` adds both \`number\` and \`string\`, because the object's \`valueOf\` or \`toString\` may produce either (\`[] + 1\` is \`'1'\`, an object whose \`valueOf\` returns 2 gives 3).
- Otherwise the result is a number: \`true + 1\` is 2, \`null + 1\` is 1 and \`undefined + 1\` is \`NaN\`, which is a number too.
- \`return [...out].sort();\` turns the set into the sorted array the tests compare; an empty \`a\` or \`b\` gives an empty result, which is right: no value in, no value out.
- In \`narrow\`, \`tagOf\` maps a kind to what \`typeof\` says for it, which is the kind itself except for \`null\`.
- \`(tagOf(k) === tag) === edge\` keeps a kind on the true edge when the test would succeed for it, and on the false edge when it would fail.

**Common wrong attempts.**

- Treating an object like any non-string, so \`object + number\` gives only \`number\`: the test that compares with real JavaScript fails on \`[] + 1\`.
- Comparing the kind itself with the tag in \`narrow\`: then \`null\` is dropped on the true edge of \`typeof x === 'object'\`, and an analysis built on it would wrongly prove that \`x\` cannot be \`null\` there.`,
    wrong: [
      {
        code: `function addKinds(a, b) {
  const out = new Set();
  for (const x of a) {
    for (const y of b) {
      const str = 'string';
      if (x === str || y === str) {
        out.add('string');
      } else {
        out.add('number');
      }
    }
  }
  return [...out].sort();
}

function narrow(kinds, tag, edge) {
  // typeof null is 'object'
  const tagOf = (k) =>
    k === 'null' ? 'object' : k;
  return kinds
    .filter((k) =>
      (tagOf(k) === tag) === edge)
    .sort();
}`,
        why: 'Objects are treated like any other non-string, so `object + number` gives only number; JavaScript converts the object first, and `[] + 1` is the string `\'1\'`.',
      },
      {
        code: `function addKinds(a, b) {
  const out = new Set();
  for (const x of a) {
    for (const y of b) {
      const str = 'string';
      if (x === str || y === str) {
        out.add('string');
      } else if (x === 'object' ||
          y === 'object') {
        out.add('number');
        out.add('string');
      } else {
        out.add('number');
      }
    }
  }
  return [...out].sort();
}

function narrow(kinds, tag, edge) {
  return kinds
    .filter((k) =>
      (k === tag) === edge)
    .sort();
}`,
        why: 'This compares the kind with the tag, but `typeof null` is `\'object\'`: on the true edge of an object test, null is wrongly removed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A value `x` may be a number or a string. Which kinds may `x + \'!\'` have?',
    options: [
      {
        t: 'number or string',
        why: 'A string on either side of + always concatenates, so a number is impossible here.',
      },
      {
        t: 'string',
        correct: true,
        why: 'Whatever x is, the right operand is a string, so the result is a string.',
      },
      {
        t: 'nothing can be said',
        why: 'The rule for + gives a precise answer here; this is what a lattice of kinds buys over "number or maybe not".',
      },
    ],
  },
  {
    q: 'Which of these JavaScript expressions has type string?',
    options: [
      {
        t: '`true + 1`',
        why: 'Neither side is a string or an object, so both are converted to numbers: the result is 2.',
      },
      {
        t: '`null + 1`',
        why: 'null converts to 0, so the result is the number 1.',
      },
      {
        t: '`[] + 1`',
        correct: true,
        why: 'The array converts to a primitive through toString, giving the empty string, so + concatenates: `\'1\'`.',
      },
    ],
  },
  {
    q: 'An analysis keeps one fact per SSA value and does not insert copies at branches. What does it learn about `x` inside `if (typeof x === \'number\') { ... }`?',
    options: [
      {
        t: 'Nothing beyond what it knew before the test',
        correct: true,
        why: 'x has a single fact everywhere, so there is no place to record a narrower one for the branch.',
      },
      {
        t: 'That x is a number',
        why: 'That needs a separate name for x in the branch (a copy at the start of it) to carry the narrower fact.',
      },
      {
        t: 'That x is not a number',
        why: 'That would be the false edge, and it also needs a name of its own to hold it.',
      },
    ],
  },
  {
    q: 'Why is narrowing an SSA value on the edges of a test sound, while narrowing an object field may not be?',
    options: [
      {
        t: 'Fields are always numbers',
        why: 'Fields can hold anything; that is why narrowing them would be useful.',
      },
      {
        t: 'A typeof test cannot be applied to a field',
        why: 'It can: `typeof p.x === \'number\'` is ordinary JavaScript.',
      },
      {
        t: 'An SSA value never changes after the test; a field can be overwritten by any call or store that reaches the same object',
        correct: true,
        why: 'So a field’s narrowed fact lasts only across code that alias analysis proves cannot write it.',
      },
    ],
  },
  {
    q: 'A type checker joins the shapes `{x, y}` and `{x, y, z}`. What does the joined shape say about `z`?',
    options: [
      {
        t: 'It is optional',
        correct: true,
        why: 'Some records have it and some do not, so reading it may give its type or undefined.',
      },
      {
        t: 'It is required',
        why: 'The first shape has no z, so the join cannot promise it.',
      },
      {
        t: 'It is removed',
        why: 'Dropping it would make reading `.z` on the records that have it a type error, which a join should not do.',
      },
    ],
  },
  {
    q: 'Why does a struct-of-arrays rewrite still require every record to have exactly the same fields, even though shapes can be joined?',
    options: [
      {
        t: 'Typed arrays cannot hold undefined',
        why: 'A plain array column can hold undefined; the problem is telling a missing field from a field set to undefined.',
      },
      {
        t: 'A missing field and a field holding undefined behave differently (`in`, `Object.keys`, `JSON.stringify`), so a column would need a per-row presence flag to preserve that',
        correct: true,
        why: 'The rewrite must change nothing the program can observe, and a joined shape describes only what may be read.',
      },
      {
        t: 'Joining shapes is undecidable',
        why: 'Joining two field lists is easy; it is the meaning of the result for a layout that is the problem.',
      },
    ],
  },
];
