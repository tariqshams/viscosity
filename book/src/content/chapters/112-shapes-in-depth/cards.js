// Chapter 112 cards. Keys are stable ids: never rename them.

export const prompts = {
  'shape-what': {
    q: 'What does a **shape** (a V8 map) describe?',
    a: 'An object’s layout: which named properties it has, in what order, and where each value is stored.',
  },
  'shape-names': {
    q: 'In V8, where are an object’s property *names* stored?',
    a: 'In its map’s descriptor array, shared by every object with that map. The object stores only the values.',
  },
  'drip-vs-v8': {
    q: 'Why do 10,000 Drip particles cost more memory for names than 10,000 V8 objects with one shape?',
    a: 'Each Drip instance has its own field hash table holding the names; V8 objects share one map that holds them once.',
  },
  'tree-what': {
    q: 'What is a **transition tree**?',
    a: 'The tree of shapes linked by “add property” edges, starting from the empty shape. Adding a property follows an existing edge or creates a new shape.',
  },
  'order-matters': {
    q: 'Why do `{ x: 1, y: 2 }` and `{ y: 2, x: 1 }` have different shapes?',
    a: 'Their properties were added in a different order, so they took different branches of the transition tree.',
  },
  'literal-vs-built': {
    q: 'Why did `{ x: 1, y: 2 }` and `{}` plus `d.x = 1; d.y = 2` get different maps in the chapter’s run?',
    a: 'They had different layouts: the literal had two in-object slots, the empty object had four.',
  },
  'slack': {
    q: 'What does **slack tracking** do for objects made by a constructor?',
    a: 'Gives them extra in-object space at first, then, after a few constructions, shrinks the shape to the space actually used.',
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
};

export const examples = {
  'order-visible': {
    title: 'Order is part of an object',
    code: `const a = { x: 1, y: 2 };
const c = { y: 2, x: 1 };
console.log(Object.keys(a));
console.log(Object.keys(c));
console.log(JSON.stringify(a));
console.log(JSON.stringify(c));
// Code can see the order, so an
// engine must remember it: that is
// why order is part of a shape.`,
  },
};

const ROOT = `const ROOT = {
  keys: [], next: new Map(),
};`;
const HELPERS = `function shapeOf(keys) {
  let s = ROOT;
  for (const k of keys) {
    s = addProp(s, k);
  }
  return s;
}
function slotOf(shape, key) {
  return shape.keys.indexOf(key);
}`;

export const exercises = {
  shapeTree: {
    title: 'Simulate a transition tree',
    prompt:
      'A shape is `{ keys, next }`: `keys` lists property names in order, and `next` is a `Map` from a property name to the child shape. Write `addProp(shape, key)`, which returns the shape after adding `key`. If `shape` already has a transition for `key`, return that child; otherwise create it, record it in `shape.next`, and return it. `shapeOf` and `slotOf` are given.',
    starter: `${ROOT}

function addProp(shape, key) {
  return {
    keys: [...shape.keys, key],
    next: new Map(),
  };
}

${HELPERS}`,
    solution: `${ROOT}

function addProp(shape, key) {
  let child = shape.next.get(key);
  if (!child) {
    child = {
      keys: [...shape.keys, key],
      next: new Map(),
    };
    shape.next.set(key, child);
  }
  return child;
}

${HELPERS}`,
    tests: `function count(s) {
  let n = 1;
  for (const c of s.next.values()) n += count(c);
  return n;
}
test('same keys, same order: the same shape', () => {
  expect(shapeOf(['x', 'y']) === shapeOf(['x', 'y']))
    .toBe(true);
});
test('a different order: a different shape', () => {
  expect(shapeOf(['x', 'y']) === shapeOf(['y', 'x']))
    .toBe(false);
});
test('slots follow the order of addition', () => {
  expect(slotOf(shapeOf(['y', 'x']), 'x')).toBe(1);
  expect(slotOf(shapeOf(['x', 'y']), 'x')).toBe(0);
});
test('shapes are shared along the way', () => {
  const xy = shapeOf(['x', 'y']);
  expect(addProp(shapeOf(['x']), 'y') === xy)
    .toBe(true);
});
test('the tree has no duplicates', () => {
  shapeOf(['p', 'q']); shapeOf(['p', 'q']);
  shapeOf(['q', 'p']);
  // root, x, x.y, y, y.x, p, p.q, q, q.p
  expect(count(ROOT)).toBe(9);
});`,
    hints: [
      'Before creating anything, look in `shape.next` for an existing child under `key`.',
      'If there is none, build `{ keys: [...shape.keys, key], next: new Map() }`.',
      'Store the new child with `shape.next.set(key, child)` before returning it, so the next object finds it.',
    ],
    walkthrough: `The whole idea of a transition tree is “look before you create”:

\`\`\`js
let child = shape.next.get(key);
if (!child) {
  child = {
    keys: [...shape.keys, key],
    next: new Map(),
  };
  shape.next.set(key, child);
}
return child;
\`\`\`

- **Sharing comes from the lookup.** The second object to add \`x\` to the empty shape finds the edge the first one made, so both end at the *same* shape object. That identity (\`===\`) is what V8’s \`%HaveSameMap\` checks.
- **The edge belongs to the parent.** The cache is per shape, not global: “add \`y\`” from \`{x}\` and “add \`y\`” from \`{}\` are different transitions leading to different shapes.
- **Order falls out for free.** \`keys\` is copied and extended, so a property’s slot is simply when it was added. \`['y', 'x']\` puts \`x\` in slot 1.

The starter made a fresh shape every time, which is correct about *layout* but loses all sharing: no two objects would ever have the same shape, and nothing that learned one object’s layout could reuse it for another.`,
    wrong: [
      {
        code: `${ROOT}
const made = new Map();

function addProp(shape, key) {
  if (!made.has(key)) {
    made.set(key, {
      keys: [...shape.keys, key],
      next: new Map(),
    });
  }
  return made.get(key);
}

${HELPERS}`,
        why: 'One global cache keyed only by the property name: adding `y` to `{x}` and adding `y` to `{}` return the same shape. A transition belongs to its parent shape, so the cache must live in `shape.next`.',
      },
    ],
  },
  orderMismatches: {
    optional: true,
    title: 'Detect property-order mismatches',
    prompt:
      'Write `orderMismatches(objs)`. For each object, look at its keys (`Object.keys`). If an *earlier* object had the same set of keys in a different order, the object is a mismatch. Return the indexes of all mismatches, in order. Objects with different sets of keys never mismatch each other.',
    starter: `function orderMismatches(objs) {
  return [];
}`,
    solution: `function orderMismatches(objs) {
  const first = new Map();
  const out = [];
  objs.forEach((o, i) => {
    const ks = Object.keys(o);
    const set = [...ks].sort().join();
    const order = ks.join();
    const seen = first.get(set);
    if (seen === undefined) {
      first.set(set, order);
    } else if (seen !== order) {
      out.push(i);
    }
  });
  return out;
}`,
    tests: `test('one object built in the other order', () => {
  const os = [{ x: 1, y: 2 }, { x: 3, y: 4 },
    { y: 5, x: 6 }];
  expect(orderMismatches(os)).toEqual([2]);
});
test('different key sets are not mismatches', () => {
  expect(orderMismatches([{ x: 1 }, { x: 1, y: 2 }]))
    .toEqual([]);
});
test('several groups at once', () => {
  const os = [{ x: 1, y: 2 }, { a: 1, b: 2 },
    { y: 1, x: 2 }, { b: 1, a: 2 }, { a: 0, b: 0 }];
  expect(orderMismatches(os)).toEqual([2, 3]);
});
test('compared with the first, not the previous', () => {
  const os = [{ x: 1, y: 2 }, { y: 1, x: 2 },
    { y: 3, x: 4 }];
  expect(orderMismatches(os)).toEqual([1, 2]);
});`,
    hints: [
      'Two strings per object: the keys in their real order (`ks.join()`), and the keys sorted (the *set*), which ignores order.',
      'Use a `Map` from the sorted set to the first order you saw for it.',
      'If the set is new, remember its order. Otherwise compare: a different order is a mismatch.',
    ],
    walkthrough: `Group by the *set* of keys, compare by the *order*:

\`\`\`js
const set = [...ks].sort().join();
const order = ks.join();
const seen = first.get(set);
if (seen === undefined) {
  first.set(set, order);
} else if (seen !== order) {
  out.push(i);
}
\`\`\`

Sorting a copy gives a key that is the same for \`{x, y}\` and \`{y, x}\`, so both land in one group. The real order then tells you whether the object took the same branch of the transition tree as the first one. Comparing with the *first* object of the group (not the previous one) matters: in the last test, objects 1 and 2 agree with each other but both differ from object 0, so both get their own shape, different from the one most code will have learned. A lint rule built on this would point at the line that builds an object “the other way round”.`,
    wrong: [
      {
        code: `function orderMismatches(objs) {
  const out = [];
  const n = objs.length;
  for (let i = 1; i < n; i++) {
    const a = Object.keys(objs[i - 1]);
    const b = Object.keys(objs[i]);
    if (a.join() !== b.join()) {
      out.push(i);
    }
  }
  return out;
}`,
        why: 'This compares each object with the previous one, and flags any difference, even different key sets. Group objects by their set of keys and compare each with the first of its group.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a V8 object store itself, and what does its map store?',
    options: [
      { t: 'The object stores names and values; the map stores only the prototype', why: 'The names are exactly what the map shares, in its descriptor array.' },
      { t: 'The object stores its values; the map stores the names, their order and where each value lives', correct: true, why: 'That is how thousands of objects can share one description of their layout.' },
      { t: 'Both store everything, for speed', why: 'Storing the names in every object is what V8 avoids. It is how Drip instances work.' },
      { t: 'The map stores the values; the object stores a pointer to them', why: 'Values belong to each object. The map is shared, so it can’t hold them.' },
    ],
  },
  {
    q: '`const a = {}; a.x = 1; a.y = 2;` and then `const b = {}; b.x = 3; b.y = 4;`. How many new shapes does `b` create?',
    options: [
      { t: 'Two', why: 'Those transitions already exist from building `a`; `b` follows them.' },
      { t: 'One', why: 'Neither step is new: `{} → {x}` and `{x} → {x, y}` were both made for `a`.' },
      { t: 'None: it follows the transitions `a` created and ends at `a`’s shape', correct: true, why: 'The transition tree is what makes the shapes shared.' },
      { t: 'It depends on the values 3 and 4', why: 'The values don’t choose the shape here: both are small integers, like 1 and 2.' },
    ],
  },
  {
    q: 'Why does the order of property additions matter to V8?',
    options: [
      { t: 'Each addition follows an edge from the current shape, so a different order walks a different branch', correct: true, why: 'And code can observe the order (`Object.keys`), so the engine must keep it anyway.' },
      { t: 'V8 sorts properties alphabetically', why: 'It doesn’t: insertion order is kept, as `Object.keys` shows.' },
      { t: 'It doesn’t: only the set of keys matters', why: '`%HaveSameMap(a, c)` was false for `{x, y}` against `{y, x}`.' },
      { t: 'Properties added later are stored in a dictionary', why: 'Later properties still get fast slots; dictionary mode is a separate decision.' },
    ],
  },
  {
    q: 'In the chapter’s run, the first `new P(1, 2)` had 10 in-object slots and a later one had 2. Why?',
    options: [
      { t: 'The garbage collector compacted the object', why: 'This is about the shape’s size, not about moving objects.' },
      { t: 'The second object had fewer properties', why: 'Both had exactly `x` and `y`.' },
      { t: 'TurboFan optimized the constructor', why: 'The change comes from slack tracking, which happens without any optimizing tier.' },
      { t: 'Slack tracking started with the expected properties plus eight spare slots, then shrank to what was used', correct: true, why: 'Two expected plus eight is ten; after a few constructions the map was trimmed to two.' },
    ],
  },
  {
    q: 'What is dictionary mode?',
    options: [
      { t: 'An object storing named properties in its own hash table instead of a shared shape', correct: true, why: 'Adding and removing is cheap; reading is slower, and inline caches don’t apply.' },
      { t: 'Using a `Map` instead of an object', why: 'A `Map` is a different kind of object. Dictionary mode is how V8 stores an ordinary object’s properties.' },
      { t: 'An object with more than four properties', why: 'Objects with many properties can still be fast.' },
      { t: 'A frozen object', why: 'Freezing is unrelated to how properties are stored here.' },
    ],
  },
  {
    q: 'You have 100,000 particle objects and want to mark some as dead. Which keeps them fast?',
    options: [
      { t: '`delete p.health`', why: 'In the chapter’s run, `delete` put the object into dictionary mode.' },
      { t: 'Adding a `dead` property only to dead particles', why: 'That gives dead particles a different shape from live ones, so code sees two shapes.' },
      { t: 'Giving every particle a `dead` field from the start and setting it to `true`', correct: true, why: 'Every particle keeps one shape, built the same way in the same order.' },
      { t: 'Rebuilding dead particles with their keys in a different order', why: 'A different order is a different shape, the opposite of what you want.' },
    ],
  },
];
