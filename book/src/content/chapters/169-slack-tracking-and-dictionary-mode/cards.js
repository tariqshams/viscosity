// Chapter 169 cards. Keys are stable ids: never rename them.

export const prompts = {
  'slack': {
    q: 'What does **slack tracking** do for objects made by a constructor?',
    a: 'Gives them extra in-object space at first, then, after a few constructions, shrinks the shape to the space actually used.',
  },
  'slack-why': {
    q: 'Why does V8 give a constructor’s first objects spare room at all?',
    a: 'It cannot know in advance how many properties the objects will get; room to spare avoids moving properties out of the object, and trimming later avoids wasting it.',
  },
  'dict-what': {
    q: 'What is **dictionary mode**?',
    a: 'An object storing its named properties in its own hash table instead of using a shared shape.',
  },
  'delete-cost': {
    q: 'What happened when the chapter’s run did `delete p.z`?',
    a: '`p` went into dictionary mode: `%HasFastProperties(p)` became false.',
  },
  'undefined-not-delete': {
    q: 'You want to “clear” a field on many objects of one kind. What keeps their shape?',
    a: 'Setting the field to `undefined` (or a flag) instead of using `delete`.',
  },
  'dict-20': {
    q: 'In V8 12.4, at how many properties added under computed names (`o["k" + i]`) did an object become a dictionary, and should you rely on that number?',
    a: 'At 20; and no, it is an engine detail that can change between versions.',
  },
  'dict-read': {
    q: 'Why is reading `p.x` slower once `p` is a dictionary?',
    a: 'The name has to be hashed and searched for in the object’s own table, instead of loading a value at an offset the shared shape fixes.',
  },
  'map-for-churn': {
    q: 'What should you use for data whose keys are added and removed all the time?',
    a: 'A `Map`, which is built for changing keys and has no shapes to lose.',
  },
};

export const examples = {
  'delete-vs-undefined': {
    title: 'delete and undefined are not the same',
    code: `const p = { x: 1, y: 2, z: 3 };
const q = { x: 1, y: 2, z: 3 };
p.z = undefined;
delete q.z;
console.log(p.z, q.z);
console.log('z' in p, 'z' in q);
console.log(Object.keys(p));
console.log(Object.keys(q));
// Same value read back, but q has
// lost the key itself: that is what
// costs q its shape in V8.`,
  },
};

export const exercises = {
  toDict: {
    title: 'Delete, the V8 12.4 way',
    prompt:
      'Model an object as either **fast**, `{ keys: [\'x\', \'y\'], vals: [1, 2] }` (names in a shared order, values in matching places), or a **dictionary**, `{ dict: new Map([[\'x\', 1], [\'y\', 2]]) }`. Write `del(o, key)`, which deletes `key` the way the chapter saw V8 12.4 do it: it returns a **new dictionary** `{ dict }` holding every other property of `o`, in the same order. It must work whether `o` is fast or already a dictionary, and must not change `o`.',
    starter: `function del(o, key) {
  return o;
}`,
    solution: `function del(o, key) {
  const { keys, vals, dict } = o;
  const pairs = dict
    ? [...dict]
    : keys.map((k, i) => [k, vals[i]]);
  const out = new Map();
  for (const [k, v] of pairs) {
    if (k !== key) out.set(k, v);
  }
  return { dict: out };
}`,
    tests: `const fast = () => ({
  keys: ['x', 'y', 'z'], vals: [1, 2, 3] });
test('deleting from a fast object gives a dictionary', () => {
  const r = del(fast(), 'z');
  expect(r.dict instanceof Map).toBe(true);
  expect(r.dict.get('x')).toBe(1);
  expect(r.dict.has('z')).toBe(false);
});
test('the other properties keep their order', () => {
  const r = del(fast(), 'x');
  expect([...r.dict.keys()]).toEqual(['y', 'z']);
});
test('a dictionary stays a dictionary', () => {
  const r = del(del(fast(), 'x'), 'y');
  expect([...r.dict]).toEqual([['z', 3]]);
});
test('the original is not changed', () => {
  const o = fast();
  del(o, 'y');
  expect(o.keys).toEqual(['x', 'y', 'z']);
  expect(o.vals).toEqual([1, 2, 3]);
});`,
    hints: [
      'Whatever `o` is, it is a list of name-and-value pairs in order. Can you turn both kinds into that list first?',
      'For a dictionary, `[...dict]` gives `[name, value]` pairs. For a fast object, pair each key with the value in the same place: `keys.map((k, i) => [k, vals[i]])`.',
      'Then make a new `Map`, copy every pair whose name is not `key`, and return `{ dict: thatMap }`. A `Map` keeps insertion order, so the order comes for free.',
    ],
    walkthrough: `**How to think about it.** Two very different layouts hold the same information: a list of (name, value) pairs in order. A fast object splits each pair across two places (the name in the shared \`keys\`, the value at the same position in \`vals\`), exactly as a V8 object keeps names in its map and values in itself; a dictionary keeps each pair together, in a \`Map\`. So the plan is: turn either layout into a list of pairs, drop the one being deleted, and build a fresh \`Map\` from the rest. Building a *new* object, rather than editing \`o\`, keeps the original intact, which the last test checks.

**The solution, line by line.**

- \`function del(o, key) {\` receives the object model and the name to delete.
- \`  const { keys, vals, dict } = o;\` pulls out whichever fields exist; for a fast object \`dict\` is \`undefined\`, for a dictionary \`keys\` and \`vals\` are.
- \`  const pairs = dict\` asks which kind \`o\` is.
- \`    ? [...dict]\` turns a dictionary's \`Map\` into an array of \`[name, value]\` pairs, in insertion order.
- \`    : keys.map((k, i) => [k, vals[i]]);\` rebuilds the pairs of a fast object: the name at position \`i\` belongs with the value at position \`i\`, which is the whole idea of a shape.
- \`  const out = new Map();\` is the new dictionary.
- \`  for (const [k, v] of pairs) {\` walks the pairs in order.
- \`    if (k !== key) out.set(k, v);\` copies every pair except the deleted one; a \`Map\` remembers insertion order, so the remaining properties stay in order.
- \`  }\` ends the loop.
- \`  return { dict: out };\` returns a dictionary-mode object, whatever \`o\` was.
- \`}\` closes the function.

**Common wrong attempts.**

- Removing the key from \`o.keys\` and \`o.vals\` with \`splice\`: that changes the original (the last test fails), and in V8 terms it pretends the object can keep a fast layout, which is not what V8 12.4 did.
- Returning \`o\` unchanged when it is already a dictionary, without removing \`key\`: the third test then still finds \`y\`.`,
    wrong: [
      {
        code: `function del(o, key) {
  const i = o.keys.indexOf(key);
  o.keys.splice(i, 1);
  o.vals.splice(i, 1);
  return o;
}`,
        why: 'This edits the original object, never produces a dictionary, and crashes on an object that is already a dictionary (it has no `keys`).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the chapter’s run, the first `new P(1, 2)` had 10 in-object slots and the twelfth had 2. Why?',
    options: [
      { t: 'The garbage collector compacted the object', why: 'This is about the shape’s size, not about moving objects.' },
      { t: 'Slack tracking started with the expected properties plus eight spare slots, then shrank to what was used', correct: true, why: 'Two expected plus eight is ten; after a few constructions the map was trimmed to two.' },
      { t: 'The twelfth object had fewer properties', why: 'Both had exactly `x` and `y`.' },
      { t: 'TurboFan optimised the constructor', why: 'The change comes from slack tracking, which happens without any optimising tier.' },
    ],
  },
  {
    q: 'What is dictionary mode?',
    options: [
      { t: 'Using a `Map` instead of an object', why: 'A `Map` is a different kind of object. Dictionary mode is how V8 stores an ordinary object’s properties.' },
      { t: 'An object with more than four properties', why: 'Objects with many properties can still be fast.' },
      { t: 'An object storing named properties in its own hash table instead of a shared shape', correct: true, why: 'Adding and removing is cheap; reading is slower, and inline caches do not apply.' },
    ],
  },
  {
    q: '`p.z = undefined` against `delete p.z`: which statement is true in V8 12.4?',
    options: [
      { t: 'Both keep `p` fast, since `p.z` reads `undefined` either way', why: '`%HasFastProperties(p)` became false after `delete`.' },
      { t: 'Both put `p` into dictionary mode', why: 'Setting a value keeps the keys and the shape; it stayed true.' },
      { t: 'Only `delete` changes the shape: it removes the key, and sent `p` into dictionary mode', correct: true, why: 'And it is visible to code too: `\'z\' in p` is `false` only after `delete`.' },
    ],
  },
  {
    q: 'You have 100,000 particle objects and want to mark some as dead. Which keeps them fast?',
    options: [
      { t: '`delete p.health`', why: 'In the chapter’s run, `delete` put the object into dictionary mode.' },
      { t: 'Adding a `dead` property only to dead particles', why: 'That gives dead particles a different shape from live ones, so code sees two shapes.' },
      { t: 'Rebuilding dead particles with their keys in a different order', why: 'A different order is a different shape, the opposite of what you want.' },
      { t: 'Giving every particle a `dead` field from the start and setting it to `true`', correct: true, why: 'Every particle keeps one shape, built the same way in the same order.' },
    ],
  },
  {
    q: 'A program counts how often each word appears, adding and removing words all the time. What should hold the counts?',
    options: [
      { t: 'A `Map`', correct: true, why: 'It is built for keys that come and go, and has no shapes to lose.' },
      { t: 'A plain object, with `delete` for removed words', why: 'That is the pattern that sends objects into dictionary mode; a `Map` says what you mean.' },
      { t: 'One class with a field per possible word', why: 'The words are not known in advance, so there is no fixed set of fields.' },
    ],
  },
];
