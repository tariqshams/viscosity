// Chapter 65 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 87, 87, 87, 87.

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
  'ic-what': {
    q: 'What does an **inline cache** remember?',
    a: 'At one property access in the code: the shapes seen there, each with how to read the property for that shape (for example, “load slot 0”).',
  },
  'ic-hit': {
    q: 'What does a hit in an inline cache cost?',
    a: 'A check of the object’s shape plus the remembered load: no search through the shape’s descriptors.',
  },
  'ic-miss': {
    q: 'What happens on an inline cache miss?',
    a: 'The full, slow property lookup runs, and the cache records the new shape and its handler.',
  },
  'ic-per-site': {
    q: 'Why does `o.x` in `getX` have its own cache, separate from `p.x` in another function?',
    a: 'Each access in the code has its own feedback slot (its own IC), because different places usually see different shapes.',
  },
  'mono-what': {
    q: 'What does **monomorphic** mean for an inline cache?',
    a: 'Only one shape has been seen at that access.',
  },
  'maglev-mono': {
    q: 'What can Maglev do with a monomorphic `o.x`?',
    a: 'Emit one check that `o` still has that shape, then a plain load at a fixed offset, and skip later checks of the same object.',
  },
  'data-driven': {
    q: 'Since Ignition, where do V8’s inline caches keep the shapes they have seen?',
    a: 'In the function’s feedback vector, as data separate from the bytecode, rather than patched into machine code.',
  },
  'ic-shared-slot': {
    q: 'In V8 12.4, `p.x * p.x` contains two loads of `p.x`. How many inline caches do they use?',
    a: 'One: the bytecode gives both loads the same feedback slot, so `--log-ic` shows a single line for `x`.',
  },
  'poly-what': {
    q: 'What does **polymorphic** mean, and what was its limit in the V8 inside Node 22?',
    a: 'Several shapes have been seen at one site; up to four (max_valid_polymorphic_map_count defaults to 4).',
  },
  'mega-what': {
    q: 'What does a **megamorphic** access do instead of keeping its own entries?',
    a: 'It uses the stub cache, a table shared by all megamorphic loads that maps a shape and a name to a handler.',
  },
  'log-letters': {
    q: 'In `--log-ic` output, what do `0`, `1`, `P` and `N` mean?',
    a: 'Uninitialised, monomorphic, polymorphic and megamorphic.',
  },
  'count-shapes': {
    q: 'A site sees shape A a thousand times, then shape B once. What state is it in?',
    a: 'Polymorphic: the states count different shapes (two here), not accesses.',
  },
  'eight-calls': {
    q: 'Why did the experiments call `getX` ten times per shape rather than five?',
    a: 'In Node 22 a function gets its feedback vector only after about eight calls; shapes seen before that are never recorded.',
  },
  'stub-shared': {
    q: 'Why does a megamorphic site give Maglev or TurboFan nothing to specialise on?',
    a: 'It keeps no shapes of its own; the stub cache is shared by every megamorphic load, so it says nothing about what this site sees.',
  },
  'mixin-mega': {
    q: 'Why can a `super.m()` call inside a mixin become megamorphic?',
    a: 'Each use of the mixin creates a new class, so the one call site meets a new shape every time.',
  },
  'poly-ok': {
    q: 'Should you worry about a site that sees two or three shapes?',
    a: 'Usually not: it is polymorphic, not megamorphic. Worry about the hot loops, and keep those monomorphic.',
  },
  'ek-what': {
    q: 'What is an array’s *elements kind* in V8?',
    a: 'A label V8 keeps for each array saying what its indexed elements can hold: small integers, any numbers, or anything.',
  },
  'ek-three': {
    q: 'Name the three basic elements kinds, from most specific to most general.',
    a: 'SMI (small integers), DOUBLE (any number), ELEMENTS (any value).',
  },
  'ek-one-way': {
    q: 'An array of Smis gets `4.56` pushed, then that slot is overwritten with `4`. What is its elements kind now?',
    a: '`PACKED_DOUBLE_ELEMENTS`. Transitions only go towards more general kinds, never back.',
  },
  'ek-minus-zero': {
    q: 'Why does `push(-0)` move an array of small integers to a DOUBLE kind?',
    a: '`-0` is not a Smi: a Smi is an integer, and integers have no negative zero. Only a double can hold it.',
  },
  'ek-double-store': {
    q: 'How does a `PACKED_DOUBLE_ELEMENTS` array store its numbers?',
    a: 'As raw 64-bit doubles side by side in a FixedDoubleArray, not as pointers to boxed HeapNumbers.',
  },
  'ek-in-map': {
    q: 'Where does V8 record an array’s elements kind?',
    a: 'In its map (the shape). A kind change is a transition to another map, like adding a property.',
  },
  'ek-polymorphic': {
    q: 'A helper loops over arrays of Smis, doubles and strings. Why can it be slower than three helpers that each see one kind?',
    a: 'Its element loads see several kinds, so they must be ready for the most general one; the 2017 V8 post describes them as polymorphic, and in V8 12.4’s log the cache’s entry was replaced with each new kind.',
  },
  'ek-big-int': {
    q: 'In this Node build, which is the smallest positive integer that moves an array of Smis to DOUBLE?',
    a: '2³¹ (2147483648): a Smi here holds at most 2³¹ − 1.',
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
  'tiny-ic': {
    title: 'A one-entry cache you can watch',
    code: `// shape: the keys, joined
const shapeOf = (o) =>
  Object.keys(o).join();
let shape = null, slot = -1;
let hits = 0, misses = 0;
function getX(o) {
  const s = shapeOf(o);
  if (s === shape) {
    hits++;
  } else {
    misses++;
    shape = s;
    slot = Object.keys(o).indexOf('x');
  }
  return Object.values(o)[slot];
}
for (let i = 0; i < 1000; i++) {
  getX({ x: i, vx: 1 });
}
console.log({ hits, misses });
// Try { vx: 1, x: i } for half
// of them: what happens?`,
  },
  'mono-vs-mega': {
    title: 'One shape against twenty',
    code: `function sumA(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
function sumB(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
const one = [], many = [];
for (let i = 0; i < 1000; i++) {
  one.push({ x: i, k: 0 });
  const o = { x: i };
  o['k' + (i % 20)] = 0; // 20 shapes
  many.push(o);
}
function time(sum, xs) {
  const t = performance.now();
  for (let r = 0; r < 3000; r++) {
    sum(xs);
  }
  const ms = performance.now() - t;
  return ms.toFixed(1) + ' ms';
}
for (let k = 0; k < 2; k++) {
  console.log('1 shape: ',
    time(sumA, one));
  console.log('20 shapes:',
    time(sumB, many));
}
// The numbers are your device's.`,
  },
  'smi-test': {
    title: 'Which numbers are Smis?',
    code: `// The rule in this Node build: an
// integer, not -0, from -2**31 up
// to 2**31 - 1.
function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}
const vs = [7, -3, 0, -0, 0.5, NaN,
  Infinity, 2 ** 31 - 1, 2 ** 31,
  0 * -1, 6 / 2, 7 / 2];
for (const v of vs) {
  console.log(Object.is(v, -0)
    ? '-0' : v, isSmi(v));
}`,
  },
};

export const exercises = {
  shapeTree: {
    title: 'Simulate a transition tree',
    prompt: 'A shape is `{ keys, next }`: `keys` lists property names in order, and `next` is a `Map` from a property name to the child shape. Write `addProp(shape, key)`, which returns the shape after adding `key`. If `shape` already has a transition for `key`, return that child; otherwise create it, record it in `shape.next`, and return it. `shapeOf` and `slotOf` are given.',
    starter: `const ROOT = {
  keys: [], next: new Map(),
};

function addProp(shape, key) {
  return {
    keys: [...shape.keys, key],
    next: new Map(),
  };
}

function shapeOf(keys) {
  let s = ROOT;
  for (const k of keys) {
    s = addProp(s, k);
  }
  return s;
}
function slotOf(shape, key) {
  return shape.keys.indexOf(key);
}`,
    solution: `const ROOT = {
  keys: [], next: new Map(),
};

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

function shapeOf(keys) {
  let s = ROOT;
  for (const k of keys) {
    s = addProp(s, k);
  }
  return s;
}
function slotOf(shape, key) {
  return shape.keys.indexOf(key);
}`,
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
        code: `const ROOT = {
  keys: [], next: new Map(),
};
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

function shapeOf(keys) {
  let s = ROOT;
  for (const k of keys) {
    s = addProp(s, k);
  }
  return s;
}
function slotOf(shape, key) {
  return shape.keys.indexOf(key);
}`,
        why: 'One global cache keyed only by the property name: adding `y` to `{x}` and adding `y` to `{}` return the same shape. A transition belongs to its parent shape, so the cache must live in `shape.next`.',
      },
    ],
  },
  orderMismatches: {
    optional: true,
    title: 'Detect property-order mismatches',
    prompt: 'Write `orderMismatches(objs)`. For each object, look at its keys (`Object.keys`). If an *earlier* object had the same set of keys in a different order, the object is a mismatch. Return the indexes of all mismatches, in order. Objects with different sets of keys never mismatch each other.',
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
  monoIC: {
    title: 'A monomorphic inline cache',
    prompt: 'Objects here are `{ shape, vals }`, made by `make(keys, vals)`, and objects with the same keys share one `shape` object. `slowLookup(o, key)` finds a key’s slot the slow way. Write `makeIC(key)`: it returns a function `ic(o)` that returns the value of `key` in `o`. It remembers one shape and its slot. If `o.shape` is the remembered shape, read `o.vals[slot]` directly and add 1 to `ic.hits`. Otherwise call `slowLookup`, remember the new shape and slot, add 1 to `ic.misses`, and return the value.',
    starter: `// Simulated objects: { shape, vals }.
const shapes = new Map();
function make(keys, vals) {
  const id = keys.join();
  if (!shapes.has(id)) {
    shapes.set(id, { keys });
  }
  const shape = shapes.get(id);
  return { shape, vals };
}
let lookups = 0;
function slowLookup(o, key) {
  lookups++;
  return o.shape.keys.indexOf(key);
}

function makeIC(key) {
  const ic = (o) => {
    ic.misses++;
    return o.vals[slowLookup(o, key)];
  };
  ic.hits = 0;
  ic.misses = 0;
  return ic;
}`,
    solution: `// Simulated objects: { shape, vals }.
const shapes = new Map();
function make(keys, vals) {
  const id = keys.join();
  if (!shapes.has(id)) {
    shapes.set(id, { keys });
  }
  const shape = shapes.get(id);
  return { shape, vals };
}
let lookups = 0;
function slowLookup(o, key) {
  lookups++;
  return o.shape.keys.indexOf(key);
}

function makeIC(key) {
  let shape = null;
  let slot = -1;
  const ic = (o) => {
    if (o.shape === shape) {
      ic.hits++;
      return o.vals[slot];
    }
    ic.misses++;
    slot = slowLookup(o, key);
    shape = o.shape;
    return o.vals[slot];
  };
  ic.hits = 0;
  ic.misses = 0;
  return ic;
}`,
    tests: `test('it reads the right value', () => {
  const ic = makeIC('y');
  expect(ic(make(['x', 'y'], [1, 2]))).toBe(2);
  expect(ic(make(['y', 'x'], [3, 4]))).toBe(3);
});
test('one shape: one miss, then hits', () => {
  const ic = makeIC('x');
  for (let i = 0; i < 5; i++) {
    ic(make(['x', 'y'], [i, 0]));
  }
  expect(ic.misses).toBe(1);
  expect(ic.hits).toBe(4);
});
test('hits skip the slow lookup', () => {
  const ic = makeIC('x');
  const before = lookups;
  for (let i = 0; i < 10; i++) {
    ic(make(['x'], [i]));
  }
  expect(lookups - before).toBe(1);
});
test('a new shape replaces the old one', () => {
  const ic = makeIC('x');
  const a = make(['x', 'y'], [1, 2]);
  const b = make(['y', 'x'], [3, 4]);
  expect([ic(a), ic(b), ic(b), ic(a)])
    .toEqual([1, 4, 4, 1]);
  expect(ic.misses).toBe(3);
  expect(ic.hits).toBe(1);
});`,
    hints: [
      'Keep two variables in the closure: the remembered `shape` (start with `null`) and its `slot`.',
      'The check is identity: `o.shape === shape`. Shapes are shared objects, so the same layout means the very same shape object.',
      'On a miss, call `slowLookup`, store both the slot and `o.shape`, and count the miss.',
    ],
    walkthrough: `**How to think about it.** A cache that remembers only a slot number is dangerous: slot 0 holds \`x\` for one shape and \`y\` for another. What makes a remembered slot trustworthy is the shape it was found for. So the cache remembers a *pair*, shape and slot, and on every call asks one question first: is this object's shape the one I remember? Because objects with the same keys share one shape object, that question is a single identity comparison, \`===\`, with no looking at keys at all.

**The solution, line by line.**

- \`function makeIC(key) {\` makes one cache for one property name, as V8 makes one per access in the code.
- \`  let shape = null;\` is the remembered shape; \`null\` means "nothing seen yet", which no object's shape equals, so the first call is a miss.
- \`  let slot = -1;\` is the slot found for that shape.
- \`  const ic = (o) => {\` is the access itself.
- \`    if (o.shape === shape) {\` is the check: the same shape object means the same layout, so the slot is still right.
- \`      ic.hits++;\` counts the hit.
- \`      return o.vals[slot];\` is the fast path: one array read.
- \`    }\` ends the hit case.
- \`    ic.misses++;\` counts a miss.
- \`    slot = slowLookup(o, key);\` does the slow search for this shape.
- \`    shape = o.shape;\` remembers the shape *together with* the slot just found.
- \`    return o.vals[slot];\` returns the value.
- \`  };\`, then \`ic.hits = 0;\` and \`ic.misses = 0;\` start the counters (a function is an object, so it can carry them), and \`return ic;\` hands the cache back.

**Common wrong attempts.**

- Caching the slot without the shape: the first object's slot is then used for every later object, and \`{ y, x }\` gets its \`y\` read as \`x\`.
- Comparing keys (\`o.shape.keys.join() === ...\`) instead of identity: the answers are right, but every hit now does the slow work the cache exists to avoid.

Notice the last test: alternating between two shapes makes almost every access miss, because a one-entry cache *thrashes*. That is exactly why V8 lets a site remember several shapes, which is the next chapter.`,
    wrong: [
      {
        code: `// Simulated objects: { shape, vals }.
const shapes = new Map();
function make(keys, vals) {
  const id = keys.join();
  if (!shapes.has(id)) {
    shapes.set(id, { keys });
  }
  const shape = shapes.get(id);
  return { shape, vals };
}
let lookups = 0;
function slowLookup(o, key) {
  lookups++;
  return o.shape.keys.indexOf(key);
}

function makeIC(key) {
  let slot = -1;
  const ic = (o) => {
    if (slot !== -1) {
      ic.hits++;
      return o.vals[slot];
    }
    ic.misses++;
    slot = slowLookup(o, key);
    return o.vals[slot];
  };
  ic.hits = 0;
  ic.misses = 0;
  return ic;
}`,
        why: 'This caches the slot without the shape it belongs to. When an object with a different shape arrives, it reads the wrong slot. The cached slot is only valid together with the shape check.',
      },
    ],
  },
  icStates: {
    title: 'From monomorphic to megamorphic',
    prompt: 'Simulate V8’s IC states. `icStates(seq)` gets the shapes reaching one access site, in order (for example `["A", "A", "B"]`). Return the state after each access: `"1"` if one shape has been seen, `"P"` for two to four, and `"N"` once a fifth different shape arrives. Once `"N"`, it stays `"N"`.',
    starter: `function icStates(seq) {
  const seen = new Set();
  return seq.map((s) => {
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    solution: `function icStates(seq) {
  const seen = new Set();
  let mega = false;
  return seq.map((s) => {
    if (mega) return 'N';
    const fresh = !seen.has(s);
    if (fresh && seen.size === 4) {
      mega = true;
      return 'N';
    }
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    tests: `test('one shape stays monomorphic', () => {
  expect(icStates(['A', 'A', 'A']))
    .toEqual(['1', '1', '1']);
});
test('the chapter run: five shapes', () => {
  const out = icStates(['A', 'B', 'C', 'D', 'E']);
  expect(out).toEqual(['1', 'P', 'P', 'P', 'N']);
});
test('old shapes do not count twice', () => {
  const seq = ['A', 'B', 'A', 'C', 'B', 'D', 'A'];
  expect(icStates(seq)).toEqual(
    ['1', 'P', 'P', 'P', 'P', 'P', 'P']);
});
test('megamorphic is for good', () => {
  const seq = ['A', 'B', 'C', 'D', 'E', 'A', 'A'];
  expect(icStates(seq).slice(4))
    .toEqual(['N', 'N', 'N']);
});`,
    hints: [
      'Keep a `Set` of the shapes seen so far, and a flag for “gone megamorphic”.',
      'A shape already in the set changes nothing. A *new* shape when the set already holds four is the fifth: go megamorphic.',
      'Once the flag is set, return `"N"` straight away for every later access.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box is the whole specification: the state depends on how many *different* shapes have arrived, and once a fifth arrives the site is megamorphic for good. So you need to remember two things between accesses: the set of shapes seen so far, and whether the site has already given up. Then each access is a short series of questions, asked in the right order.

**The solution, line by line.**

- \`const seen = new Set();\` holds the different shapes seen; a \`Set\` ignores repeats, which is exactly "different shapes".
- \`let mega = false;\` records whether the site has given up.
- \`return seq.map((s) => {\` turns each arriving shape into the state after it.
- \`if (mega) return 'N';\` comes first: once megamorphic, nothing else matters.
- \`const fresh = !seen.has(s);\` asks whether this shape is new to the site.
- \`if (fresh && seen.size === 4) {\` catches the fifth different shape: four are already listed, and this is a new one.
- \`mega = true;\` and \`return 'N';\` give up, for good. Notice the fifth shape is never added to \`seen\`: a megamorphic site keeps no list at all.
- \`}\` ends that case.
- \`seen.add(s);\` records the shape (adding one already there changes nothing).
- \`return seen.size === 1 ? '1' : 'P';\` gives monomorphic for one shape, polymorphic for two to four.
- \`});\` ends the \`map\`.

Trace the second test: A gives \`1\`; B, C and D each give \`P\` (two, three, four shapes); E finds four already listed and is new, so \`N\`, which is the real \`--log-ic\` run's \`1, P, P, P, N\`.

**Common wrong attempts.**

- Counting accesses instead of different shapes: a site that sees shape A a hundred times would wrongly turn megamorphic, which the first and third tests catch.
- Checking \`seen.size > 4\` *after* adding: that works for the fifth shape, but forgetting the \`mega\` flag means a later access with an old shape (A again) drops back to \`P\`, which the last test catches.`,
    wrong: [
      {
        code: `function icStates(seq) {
  let n = 0;
  return seq.map(() => {
    n++;
    if (n === 1) return '1';
    return n <= 4 ? 'P' : 'N';
  });
}`,
        why: 'This counts accesses, not different shapes. A site that sees shape A a hundred times is still monomorphic.',
      },
    ],
  },
  kindOfWrites: {
    title: 'Follow the lattice',
    prompt: 'An array starts as `[]` (which V8 reports as `PACKED_SMI_ELEMENTS`) and the values in `vs` are pushed onto it, in order. Write `kindOfWrites(vs)`, which returns the elements kind V8 reports afterwards: `\'PACKED_SMI_ELEMENTS\'`, `\'PACKED_DOUBLE_ELEMENTS\'` or `\'PACKED_ELEMENTS\'`. `isSmi` is given. Remember that the kind never moves back.',
    starter: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}

function kindOfWrites(vs) {
  const last = vs[vs.length - 1];
  if (!vs.length || isSmi(last)) {
    return 'PACKED_SMI_ELEMENTS';
  }
  return 'PACKED_DOUBLE_ELEMENTS';
}`,
    solution: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}

const NAMES = ['SMI_', 'DOUBLE_', ''];
function baseOf(v) {
  if (isSmi(v)) return 0;
  if (typeof v === 'number') return 1;
  return 2;
}
function kindOfWrites(vs) {
  let base = 0;
  for (const v of vs) {
    base = Math.max(base, baseOf(v));
  }
  return 'PACKED_' + NAMES[base] +
    'ELEMENTS';
}`,
    tests: `test('an empty array is SMI', () => {
  expect(kindOfWrites([]))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('small integers stay SMI', () => {
  expect(kindOfWrites([1, 2, 3]))
    .toBe('PACKED_SMI_ELEMENTS');
});
test('one double moves it down', () => {
  expect(kindOfWrites([1, 4.56]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('there is no way back', () => {
  expect(kindOfWrites([1, 4.56, 4]))
    .toBe('PACKED_DOUBLE_ELEMENTS');
});
test('-0, NaN and 2 ** 31 are doubles', () => {
  for (const v of [-0, NaN, 2 ** 31]) {
    expect(kindOfWrites([1, v]))
      .toBe('PACKED_DOUBLE_ELEMENTS');
  }
});
test('anything else is ELEMENTS, for good', () => {
  expect(kindOfWrites([1, 'x', 2]))
    .toBe('PACKED_ELEMENTS');
  expect(kindOfWrites([{}, 1.5]))
    .toBe('PACKED_ELEMENTS');
});`,
    hints: [
      'The kind depends on every value ever written, not only the last one. What single number could summarise "the most general kind so far"?',
      'Give each value a level: 0 for a Smi, 1 for any other number, 2 for anything else. The array’s level is the largest level seen so far.',
      'Write `baseOf(v)` (test `isSmi` first, then `typeof v === \'number\'`), keep `base = Math.max(base, baseOf(v))` in a loop, and build the name from `[\'SMI_\', \'DOUBLE_\', \'\'][base]`.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box says the kind after each write is the *join* of the old kind and the new value's kind, and that a join never moves back up. If you number the kinds 0 (SMI), 1 (DOUBLE) and 2 (ELEMENTS), the join is just the larger number, so the whole lattice becomes \`Math.max\`. What the starter gets wrong is looking only at the last value: the array remembers its history.

**The solution, line by line.**

- \`function isSmi(v) {\` and its three lines are given: an integer, not \`-0\`, inside the 32-bit range.
- \`const NAMES = ['SMI_', 'DOUBLE_', ''];\` holds the middle part of each name; the general kind is spelled \`PACKED_ELEMENTS\`, hence the empty string.
- \`function baseOf(v) {\` gives each value its own most specific kind.
- \`  if (isSmi(v)) return 0;\` comes first, because every Smi is also a \`number\`; testing \`typeof\` first would call \`1\` a double.
- \`  if (typeof v === 'number') return 1;\` catches every other number: fractions, \`-0\`, \`NaN\`, \`Infinity\`, big integers.
- \`  return 2;\` is everything else: strings, objects, \`undefined\`.
- \`}\` closes \`baseOf\`.
- \`function kindOfWrites(vs) {\` starts from \`[]\`, which is SMI.
- \`  let base = 0;\` is that starting kind.
- \`  for (const v of vs) {\` visits each pushed value in order.
- \`    base = Math.max(base, baseOf(v));\` is the join: the more general of the array's kind and the value's. Because \`max\` never decreases, pushing \`4\` after \`4.56\` leaves it at 1.
- \`  }\` ends the loop.
- \`  return 'PACKED_' + NAMES[base] +\` and \`'ELEMENTS';\` build the name; nothing here makes holes, so it is always PACKED.

**Common wrong attempts.**

- Looking only at the last value, as the starter does: \`[1, 4.56, 4]\` then comes out SMI, but V8 says DOUBLE.
- Testing \`typeof v === 'number'\` before \`isSmi\`: every array of integers comes out DOUBLE.
- Treating \`-0\` as a Smi because \`-0 === 0\` is \`true\`: \`===\` cannot tell them apart, which is why \`isSmi\` uses \`Object.is\`.`,
    wrong: [
      {
        code: `function isSmi(v) {
  return Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 31) && v < 2 ** 31;
}
const NAMES = ['SMI_', 'DOUBLE_', ''];
function baseOf(v) {
  if (typeof v === 'number') return 1;
  if (isSmi(v)) return 0;
  return 2;
}
function kindOfWrites(vs) {
  let base = 0;
  for (const v of vs) {
    base = Math.max(base, baseOf(v));
  }
  return 'PACKED_' + NAMES[base] +
    'ELEMENTS';
}`,
        why: 'The checks in `baseOf` are in the wrong order. Every Smi is also a `number`, so `[1, 2, 3]` comes out as DOUBLE. Test for the most specific kind first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a V8 object store itself, and what does its map store?',
    options: [
      {
        t: 'The object stores names and values; the map stores only the prototype',
        why: 'The names are exactly what the map shares, in its descriptor array.',
      },
      {
        t: 'The object stores its values; the map stores the names, their order and where each value lives',
        correct: true,
        why: 'That is how thousands of objects can share one description of their layout.',
      },
      {
        t: 'Both store everything, for speed',
        why: 'Storing the names in every object is what V8 avoids. It is how Drip instances work.',
      },
      {
        t: 'The map stores the values; the object stores a pointer to them',
        why: 'Values belong to each object. The map is shared, so it can’t hold them.',
      },
    ],
  },
  {
    q: '`const a = {}; a.x = 1; a.y = 2;` and then `const b = {}; b.x = 3; b.y = 4;`. How many new shapes does `b` create?',
    options: [
      {
        t: 'Two',
        why: 'Those transitions already exist from building `a`; `b` follows them.',
      },
      {
        t: 'One',
        why: 'Neither step is new: `{} → {x}` and `{x} → {x, y}` were both made for `a`.',
      },
      {
        t: 'None: it follows the transitions `a` created and ends at `a`’s shape',
        correct: true,
        why: 'The transition tree is what makes the shapes shared.',
      },
      {
        t: 'It depends on the values 3 and 4',
        why: 'The values don’t choose the shape here: both are small integers, like 1 and 2.',
      },
    ],
  },
  {
    q: 'Why does the order of property additions matter to V8?',
    options: [
      {
        t: 'Each addition follows an edge from the current shape, so a different order walks a different branch',
        correct: true,
        why: 'And code can observe the order (`Object.keys`), so the engine must keep it anyway.',
      },
      {
        t: 'V8 sorts properties alphabetically',
        why: 'It doesn’t: insertion order is kept, as `Object.keys` shows.',
      },
      {
        t: 'It doesn’t: only the set of keys matters',
        why: '`%HaveSameMap(a, c)` was false for `{x, y}` against `{y, x}`.',
      },
      {
        t: 'Properties added later are stored in a dictionary',
        why: 'Later properties still get fast slots; dictionary mode is a separate decision.',
      },
    ],
  },
  {
    q: '`a = { x: 1, y: 2 }` and `d = {}; d.x = 1; d.y = 2;` have the same keys in the same order, but different maps. Why?',
    options: [
      {
        t: 'The values are different',
        why: 'They are the same values, 1 and 2, and values do not choose the map here anyway.',
      },
      {
        t: 'They have different layouts: the literal got exactly two in-object slots, while `{}` was given room for four',
        correct: true,
        why: '`%DebugPrint` shows `inobject properties: 2` against `4`; different layouts need different maps.',
      },
      {
        t: '`d` is in dictionary mode',
        why: '`%DebugPrint(d)` shows fast properties, with `x` and `y` in-object.',
      },
    ],
  },
  {
    q: 'A program builds half its particles as `{ x, vx }` and half as `{ vx, x }`. What does V8 see?',
    options: [
      {
        t: 'One shape, since the keys are the same',
        why: '`%HaveSameMap` said false for exactly this program: order is part of the shape.',
      },
      {
        t: 'A thousand shapes, one per object',
        why: 'Objects built the same way share; there are only two ways here.',
      },
      {
        t: 'Dictionary mode for all of them',
        why: 'Nothing here deletes or adds many computed keys; both shapes are fast.',
      },
      {
        t: 'Two shapes, one per branch of the transition tree',
        correct: true,
        why: 'And every loop over the array now meets two shapes instead of one.',
      },
    ],
  },
  {
    q: 'An inline cache at `o.x` is monomorphic for shape A. An object of shape A arrives. What does the access cost?',
    options: [
      {
        t: 'A search of A’s descriptors for `x`',
        why: 'That search happened once, on the first miss. Now its result is remembered.',
      },
      {
        t: 'A hash-table lookup of `"x"`',
        why: 'That would be a dictionary-mode object or a megamorphic site.',
      },
      {
        t: 'A shape check and a load from the remembered slot',
        correct: true,
        why: 'That is the whole fast path.',
      },
      {
        t: 'Nothing: the value itself is cached',
        why: 'The cache remembers *where* `x` lives for a shape, not its value, which differs per object.',
      },
    ],
  },
  {
    q: 'Why is it safe for a cache to reuse a slot number once the shape matches?',
    options: [
      {
        t: 'A shape fixes where each property lives, so the same shape means the same slot',
        correct: true,
        why: 'That is what a shape is: a shared description of the layout.',
      },
      {
        t: 'Property slots never change in JavaScript',
        why: 'They do differ between shapes, as `{ x, y }` and `{ y, x }` showed.',
      },
      {
        t: 'V8 re-checks the property name on every hit',
        why: 'Skipping that is the point of the cache. The shape check makes it unnecessary.',
      },
      {
        t: 'All objects store `x` in slot 0',
        why: 'Only objects whose shape puts it there.',
      },
    ],
  },
  {
    q: 'A function is called a million times, always with objects made by one constructor in the same way. Its `p.x` is…',
    options: [
      {
        t: 'megamorphic, because it ran so many times',
        why: 'The states count different shapes, not calls.',
      },
      {
        t: 'monomorphic',
        correct: true,
        why: 'One way of building the objects means one shape at that site.',
      },
      {
        t: 'polymorphic, because each object is different',
        why: 'The objects hold different values but share one shape.',
      },
      {
        t: 'uninitialised',
        why: 'It has run, so it has seen at least one shape.',
      },
    ],
  },
  {
    q: '`function len(p) { return p.x * p.x + p.y * p.y; }` logged only two `LoadIC` lines. Why not four?',
    options: [
      {
        t: 'Two of the loads never ran',
        why: 'All four run on every call; the multiplications need them.',
      },
      {
        t: 'In V8 12.4 the two loads of `p.x` share one feedback slot, and so do the two of `p.y`',
        correct: true,
        why: 'The bytecode shows slot `[2]` twice and `[5]` twice: two caches, each logged once when it became monomorphic.',
      },
      {
        t: '`--log-ic` only logs the first two caches of a function',
        why: 'It logs every state change; the third example logged three lines for one function.',
      },
    ],
  },
  {
    q: 'What made V8’s inline caches “data-driven” after Ignition?',
    options: [
      {
        t: 'The remembered shapes live in feedback vectors, separate from the bytecode, instead of being patched into machine code',
        correct: true,
        why: 'The 2018 code-caching post credits this separation for being able to cache bytecode after a script has run.',
      },
      {
        t: 'They are stored in a database',
        why: 'Data-driven here means they live in ordinary V8 heap data, the feedback vector.',
      },
      {
        t: 'They are written in JavaScript',
        why: 'The language of the implementation isn’t what the term means.',
      },
      {
        t: 'They learn from many users’ browsers',
        why: 'Feedback is collected per function, in one running program.',
      },
    ],
  },
  {
    q: 'In the five-shape `--log-ic` run, which line shows the access becoming megamorphic?',
    options: [
      {
        t: '`LoadIC 1:29 0 1 x`',
        why: 'That is the first shape: uninitialised to monomorphic.',
      },
      {
        t: '`LoadIC 1:29 1 P x`',
        why: 'That is the second shape: monomorphic to polymorphic.',
      },
      {
        t: '`LoadIC 1:29 P N x`',
        correct: true,
        why: 'The fifth shape exceeded the limit of four, so the state went from P to N.',
      },
      {
        t: '`LoadIC 1:29 P P x`',
        why: 'Still polymorphic: a third or fourth shape was added to the list.',
      },
    ],
  },
  {
    q: 'What does a megamorphic access use instead of its own list of shapes?',
    options: [
      {
        t: 'The object’s dictionary',
        why: 'The object is still a fast object; it is the access site that gave up.',
      },
      {
        t: 'The stub cache, shared by all megamorphic loads, keyed by shape and name',
        correct: true,
        why: 'V8’s source describes the stub cache as mapping a map and a name to a handler.',
      },
      {
        t: 'The constant pool',
        why: 'The constant pool holds the name `"x"`, not shapes or handlers.',
      },
    ],
  },
  {
    q: 'Five AST node classes all set `this.type` first. Why is `n.type` in `kindOf` megamorphic?',
    options: [
      {
        t: 'Because `type` is at a different offset in each class',
        why: 'It is field 0 in all of them; the offset is not the issue.',
      },
      {
        t: 'Because objects of different classes have different maps, so the site sees five shapes',
        correct: true,
        why: 'And five is more than the limit of four.',
      },
      {
        t: 'Because `kindOf` is an arrow function',
        why: 'Arrow functions get inline caches like any other function.',
      },
      {
        t: 'Because strings are slow to read',
        why: 'The value being a string has nothing to do with the state of the load.',
      },
    ],
  },
  {
    q: 'A site sees shapes A, B, A, C, B, D, A, in that order. What state is it in at the end?',
    options: [
      {
        t: 'Megamorphic: seven accesses',
        why: 'The states count different shapes, not accesses.',
      },
      {
        t: 'Monomorphic: A came most often',
        why: 'Any second shape makes it polymorphic.',
      },
      {
        t: 'Polymorphic: four different shapes',
        correct: true,
        why: 'A, B, C and D: exactly the limit, not past it.',
      },
    ],
  },
  {
    q: 'Which change is most worth making for speed?',
    options: [
      {
        t: 'A helper used in three places, seeing three shapes, rewritten into three copies',
        why: 'Three shapes is polymorphic, which is fine unless it is very hot.',
      },
      {
        t: 'A hot particle loop whose objects are built in two places in two key orders, changed to build them one way',
        correct: true,
        why: 'The loop is hot, and one way of building gives every access in it one shape.',
      },
      {
        t: 'Every object in the program given the same keys',
        why: 'Unnecessary and unreadable; only the hot code’s sites matter.',
      },
    ],
  },
  {
    q: 'Which line moves `const a = [1, 2, 3]` from a SMI kind to a DOUBLE kind?',
    options: [
      {
        t: '`a.push(4)`',
        why: '4 is a small integer, so it is a Smi and the kind stays SMI.',
      },
      {
        t: '`a.push(-0)`',
        correct: true,
        why: 'Negative zero is not an integer value a Smi can hold, so the array needs doubles.',
      },
      {
        t: '`a[1] = 7`',
        why: 'Overwriting with another small integer changes nothing.',
      },
      {
        t: '`a.length`',
        why: 'Reading the length doesn’t change the elements at all.',
      },
    ],
  },
  {
    q: '`const a = [1.5, 2]`, then `a[0] = 1`. What does V8 report?',
    options: [
      {
        t: '`PACKED_SMI_ELEMENTS`, because every element is now an integer',
        why: 'Kinds never move back up the lattice, even when the values would allow it.',
      },
      {
        t: '`HOLEY_DOUBLE_ELEMENTS`',
        why: 'No index was skipped, so there are no holes.',
      },
      {
        t: '`PACKED_DOUBLE_ELEMENTS`',
        correct: true,
        why: 'The literal started as DOUBLE because of 1.5, and it stays DOUBLE.',
      },
      {
        t: '`PACKED_ELEMENTS`',
        why: 'Only numbers were ever stored, so it never needed the general kind.',
      },
    ],
  },
  {
    q: 'Which pushed value keeps `[1, 2]` at `PACKED_SMI_ELEMENTS` in this Node build?',
    options: [
      {
        t: '`2 ** 31`',
        why: 'That is one past the largest Smi here, so it needs a double.',
      },
      {
        t: '`Infinity`',
        why: 'Infinity is a double, not an integer a Smi can hold.',
      },
      {
        t: '`2 ** 31 - 1`',
        correct: true,
        why: 'The largest Smi in this build; `%DebugPrint` still reports SMI.',
      },
      {
        t: '`0 * -1`',
        why: 'That is `-0`, which is a double.',
      },
    ],
  },
  {
    q: 'In `%DebugPrint` output, an array’s kind appears inside its map: `<Map[32](PACKED_SMI_ELEMENTS)>`. What does that tell you?',
    options: [
      {
        t: 'The elements kind is part of the array’s shape, so changing kind means a map transition',
        correct: true,
        why: 'The same output lists `(transition to HOLEY_SMI_ELEMENTS)` among the map’s transitions, like the property transitions of the shapes chapter.',
      },
      {
        t: 'Each element has its own map',
        why: 'The map belongs to the array object. The elements are stored in a separate backing store.',
      },
      {
        t: 'The kind is stored in every element’s tag bits',
        why: 'Smis do have a tag bit, but the kind is a property of the whole array, recorded once.',
      },
      {
        t: 'Maps are only used for arrays',
        why: 'Every heap object has a map; the shapes chapter met them for ordinary objects.',
      },
    ],
  },
  {
    q: 'Viscosity stores struct-of-arrays columns as `Float64Array`s. What does that mean for elements kinds?',
    options: [
      {
        t: 'A column starts as SMI and moves to DOUBLE on the first fraction',
        why: 'That is how a plain array behaves. A typed array has its own fixed kind.',
      },
      {
        t: 'Columns become holey when the program deletes an element',
        why: 'A typed array can’t have holes: every index below its length holds a number.',
      },
      {
        t: 'A column has one fixed kind, `FLOAT64ELEMENTS`, and never transitions',
        correct: true,
        why: '`%DebugPrint` reports `FLOAT64ELEMENTS` for a `Float64Array`, and its elements are always raw doubles.',
      },
      {
        t: 'Typed arrays always use the general ELEMENTS kind',
        why: 'They can only hold numbers of one type, so they get their own specialised kinds.',
      },
    ],
  },
];
