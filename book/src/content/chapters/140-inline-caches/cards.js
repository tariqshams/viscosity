// Chapter 140 cards. Keys are stable ids: never rename them.

export const prompts = {
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
};

export const examples = {
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
};

const OBJS = `// Simulated objects: { shape, vals }.
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
}`;

export const exercises = {
  monoIC: {
    title: 'A monomorphic inline cache',
    prompt:
      'Objects here are `{ shape, vals }`, made by `make(keys, vals)`, and objects with the same keys share one `shape` object. `slowLookup(o, key)` finds a key’s slot the slow way. Write `makeIC(key)`: it returns a function `ic(o)` that returns the value of `key` in `o`. It remembers one shape and its slot. If `o.shape` is the remembered shape, read `o.vals[slot]` directly and add 1 to `ic.hits`. Otherwise call `slowLookup`, remember the new shape and slot, add 1 to `ic.misses`, and return the value.',
    starter: `${OBJS}

function makeIC(key) {
  const ic = (o) => {
    ic.misses++;
    return o.vals[slowLookup(o, key)];
  };
  ic.hits = 0;
  ic.misses = 0;
  return ic;
}`,
    solution: `${OBJS}

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
        code: `${OBJS}

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
};

export const quiz = [
  {
    q: 'An inline cache at `o.x` is monomorphic for shape A. An object of shape A arrives. What does the access cost?',
    options: [
      { t: 'A search of A’s descriptors for `x`', why: 'That search happened once, on the first miss. Now its result is remembered.' },
      { t: 'A hash-table lookup of `"x"`', why: 'That would be a dictionary-mode object or a megamorphic site.' },
      { t: 'A shape check and a load from the remembered slot', correct: true, why: 'That is the whole fast path.' },
      { t: 'Nothing: the value itself is cached', why: 'The cache remembers *where* `x` lives for a shape, not its value, which differs per object.' },
    ],
  },
  {
    q: 'Why is it safe for a cache to reuse a slot number once the shape matches?',
    options: [
      { t: 'A shape fixes where each property lives, so the same shape means the same slot', correct: true, why: 'That is what a shape is: a shared description of the layout.' },
      { t: 'Property slots never change in JavaScript', why: 'They do differ between shapes, as `{ x, y }` and `{ y, x }` showed.' },
      { t: 'V8 re-checks the property name on every hit', why: 'Skipping that is the point of the cache. The shape check makes it unnecessary.' },
      { t: 'All objects store `x` in slot 0', why: 'Only objects whose shape puts it there.' },
    ],
  },
  {
    q: 'A function is called a million times, always with objects made by one constructor in the same way. Its `p.x` is…',
    options: [
      { t: 'megamorphic, because it ran so many times', why: 'The states count different shapes, not calls.' },
      { t: 'monomorphic', correct: true, why: 'One way of building the objects means one shape at that site.' },
      { t: 'polymorphic, because each object is different', why: 'The objects hold different values but share one shape.' },
      { t: 'uninitialized', why: 'It has run, so it has seen at least one shape.' },
    ],
  },
  {
    q: '`function len(p) { return p.x * p.x + p.y * p.y; }` logged only two `LoadIC` lines. Why not four?',
    options: [
      { t: 'Two of the loads never ran', why: 'All four run on every call; the multiplications need them.' },
      { t: 'In V8 12.4 the two loads of `p.x` share one feedback slot, and so do the two of `p.y`', correct: true, why: 'The bytecode shows slot `[2]` twice and `[5]` twice: two caches, each logged once when it became monomorphic.' },
      { t: '`--log-ic` only logs the first two caches of a function', why: 'It logs every state change; the third example logged three lines for one function.' },
    ],
  },
  {
    q: 'What made V8’s inline caches “data-driven” after Ignition?',
    options: [
      { t: 'The remembered shapes live in feedback vectors, separate from the bytecode, instead of being patched into machine code', correct: true, why: 'The 2018 code-caching post credits this separation for being able to cache bytecode after a script has run.' },
      { t: 'They are stored in a database', why: 'Data-driven here means they live in ordinary V8 heap data, the feedback vector.' },
      { t: 'They are written in JavaScript', why: 'The language of the implementation isn’t what the term means.' },
      { t: 'They learn from many users’ browsers', why: 'Feedback is collected per function, in one running program.' },
    ],
  },
];
