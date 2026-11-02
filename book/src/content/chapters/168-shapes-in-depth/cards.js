// Chapter 168 cards. Keys are stable ids: never rename them.

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
  'mixed-order': {
    q: 'Half the particles are built `{ x, vx }` and half `{ vx, x }`. How many maps do they have?',
    a: 'Two: the two orders walk two branches of the transition tree, so a loop over them sees two shapes.',
  },
  'back-pointer': {
    q: 'What does the **back pointer** in a V8 map point to?',
    a: 'The map it came from: its parent in the transition tree, one property fewer.',
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
    walkthrough: `**How to think about it.** The whole idea of a transition tree is "look before you create". When an object at some shape gains a property, there may already be a child shape for exactly that step, made by an earlier object that took the same step; if so, use it, and that reuse is what makes two objects share a shape. Only if there is none do you build a new child, and then you must *record* it on the parent, so the next object finds it.

**The solution, line by line.**

- \`function addProp(shape, key) {\` receives the current shape and the property being added.
- \`  let child = shape.next.get(key);\` looks for an existing edge labelled \`key\` out of this shape. It is \`undefined\` if no object has ever taken this step from here.
- \`  if (!child) {\` handles the first time.
- \`    child = {\` builds the new shape:
- \`      keys: [...shape.keys, key],\` copies the parent's keys and adds the new one at the end, so a property's slot is simply its position in the order of addition;
- \`      next: new Map(),\` gives the new shape its own, empty set of edges.
- \`    };\` ends the object.
- \`    shape.next.set(key, child);\` records the edge on the *parent*, so the next object that adds \`key\` here gets this same child.
- \`  }\` ends the first-time case.
- \`  return child;\` returns the shape, old or new.

Trace the second test: \`shapeOf(['x', 'y'])\` and \`shapeOf(['y', 'x'])\` both start at \`ROOT\`, but the first follows the \`x\` edge and the second the \`y\` edge, so they end at different objects, and \`===\` is \`false\`, just as \`%HaveSameMap(a, c)\` was.

**Common wrong attempts.**

- The starter makes a fresh shape every time: its *layout* is right, but no two objects ever share a shape, so the first test fails.
- One global cache keyed only by the property name: "add \`y\`" from \`{x}\` and "add \`y\`" from \`{}\` then return the same shape, which has the wrong keys for one of them. An edge belongs to its parent shape, which is why it lives in \`shape.next\`.`,
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
    walkthrough: `**How to think about it.** Two objects take the same branch of the transition tree only if they have the same keys *in the same order*. So you need two descriptions of each object: one that ignores order (to put objects with the same keys in one group) and one that keeps it (to see whether an object took the group's usual branch). Compare every object with the *first* of its group, since that is the shape most code will have met first.

**The solution, line by line.**

- \`const first = new Map();\` maps each set of keys to the first order seen for it.
- \`const out = [];\` collects the indexes of mismatches.
- \`objs.forEach((o, i) => {\` visits each object with its index.
- \`const ks = Object.keys(o);\` gets its keys in insertion order, the order the engine keeps.
- \`const set = [...ks].sort().join();\` sorts a *copy* (sorting \`ks\` itself would destroy the order) and joins it into a string such as \`"x,y"\`, the same for \`{x, y}\` and \`{y, x}\`.
- \`const order = ks.join();\` is the real order, such as \`"y,x"\`.
- \`const seen = first.get(set);\` looks up the group's first order.
- \`if (seen === undefined) { first.set(set, order); }\` makes this object the first of a new group.
- \`else if (seen !== order) { out.push(i); }\` flags an object with the group's keys in a different order.
- \`});\` and \`return out;\` finish.

The last test is the subtle one: objects 1 and 2 agree with each other but both differ from object 0, so both are flagged.

**Common wrong attempts.**

- Comparing each object with the previous one: different key sets get flagged, and two mismatches in a row hide each other.
- Sorting \`ks\` in place: \`order\` is then always sorted, and nothing is ever a mismatch.`,
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
    q: '`a = { x: 1, y: 2 }` and `d = {}; d.x = 1; d.y = 2;` have the same keys in the same order, but different maps. Why?',
    options: [
      { t: 'The values are different', why: 'They are the same values, 1 and 2, and values do not choose the map here anyway.' },
      { t: 'They have different layouts: the literal got exactly two in-object slots, while `{}` was given room for four', correct: true, why: '`%DebugPrint` shows `inobject properties: 2` against `4`; different layouts need different maps.' },
      { t: '`d` is in dictionary mode', why: '`%DebugPrint(d)` shows fast properties, with `x` and `y` in-object.' },
    ],
  },
  {
    q: 'A program builds half its particles as `{ x, vx }` and half as `{ vx, x }`. What does V8 see?',
    options: [
      { t: 'One shape, since the keys are the same', why: '`%HaveSameMap` said false for exactly this program: order is part of the shape.' },
      { t: 'A thousand shapes, one per object', why: 'Objects built the same way share; there are only two ways here.' },
      { t: 'Dictionary mode for all of them', why: 'Nothing here deletes or adds many computed keys; both shapes are fast.' },
      { t: 'Two shapes, one per branch of the transition tree', correct: true, why: 'And every loop over the array now meets two shapes instead of one.' },
    ],
  },
]

