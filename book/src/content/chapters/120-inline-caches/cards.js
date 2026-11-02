// Chapter 120 cards. Keys are stable ids: never rename them.

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
    a: 'Each access site has its own feedback slot, because different sites usually see different shapes.',
  },
  'mono-what': {
    q: 'What does **monomorphic** mean for an inline cache?',
    a: 'Only one shape has been seen at that access.',
  },
  'poly-what': {
    q: 'What does **polymorphic** mean, and what was its limit in the V8 inside Node 22?',
    a: 'Several shapes have been seen; up to four (max_valid_polymorphic_map_count defaults to 4).',
  },
  'mega-what': {
    q: 'What does a **megamorphic** access do instead of keeping its own entries?',
    a: 'It uses the stub cache, a table shared by all megamorphic loads that maps a shape and a name to a handler.',
  },
  'log-letters': {
    q: 'In `--log-ic` output, what do `0`, `1`, `P` and `N` mean?',
    a: 'Uninitialized, monomorphic, polymorphic and megamorphic.',
  },
  'maglev-mono': {
    q: 'What can Maglev do with a monomorphic `o.x`?',
    a: 'Emit one check that `o` still has that shape, then a plain load at a fixed offset, and skip later checks of the same object.',
  },
  'data-driven': {
    q: 'Since Ignition, where do V8’s inline caches keep the shapes they have seen?',
    a: 'In the function’s feedback vector, as data separate from the bytecode, rather than patched into machine code.',
  },
};

export const examples = {
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
    walkthrough: `The fast path is one comparison and one array read:

\`\`\`js
if (o.shape === shape) {
  ic.hits++;
  return o.vals[slot];
}
ic.misses++;
slot = slowLookup(o, key);
shape = o.shape;
return o.vals[slot];
\`\`\`

- **Why identity works.** Because shapes are shared (last chapter’s transition tree), “same layout” is “same shape object”, and checking that is a single pointer comparison. No looking at keys at all.
- **Why the slot can be cached.** A shape fixes where each key lives. If the shape is the same, \`x\` is in the same slot as last time, guaranteed.
- **What a miss costs.** The slow lookup, plus updating the cache. In the last test, alternating between two shapes makes almost every access miss: a one-entry cache *thrashes*. That is exactly why V8 lets a site become polymorphic and remember several shapes, up to four in the V8 inside Node 22.

This is the same check Maglev emits for a monomorphic \`o.x\`, except there it is compiled into machine code: compare the map, then load at a fixed offset.`,
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
  icStates: {
    optional: true,
    title: 'From monomorphic to megamorphic',
    prompt:
      'Simulate V8’s IC states. `icStates(seq)` gets the shapes reaching one access site, in order (for example `["A", "A", "B"]`). Return the state after each access: `"1"` if one shape has been seen, `"P"` for two to four, and `"N"` once a fifth different shape arrives. Once `"N"`, it stays `"N"`.',
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
    walkthrough: `The states form a one-way ladder:

\`\`\`js
if (mega) return 'N';
const fresh = !seen.has(s);
if (fresh && seen.size === 4) {
  mega = true;
  return 'N';
}
seen.add(s);
return seen.size === 1 ? '1' : 'P';
\`\`\`

- **The limit is on different shapes**, not accesses: the third test sees seven accesses but only four shapes, and stays polymorphic.
- **There is no way back down here.** The second test reproduces the real \`--log-ic\` run: \`1, P, P, P, N\`. In this simulation a megamorphic site never recovers, even if only shape A arrives afterwards. (V8’s real ICs have more states than these four, such as one for recomputing a handler, which this model leaves out.)
- **Why give up at all?** A list that grew forever would make every access search a longer and longer list. Past a small limit, a shared hash table keyed by shape and name is the better deal.`,
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
    q: 'In the `--log-ic` run, which line shows the access becoming megamorphic?',
    options: [
      { t: '`LoadIC 1:29 0 1 x`', why: 'That is the first shape: uninitialized to monomorphic.' },
      { t: '`LoadIC 1:29 1 P x`', why: 'That is the second shape: monomorphic to polymorphic.' },
      { t: '`LoadIC 1:29 P P x`', why: 'Still polymorphic: a third or fourth shape was added to the list.' },
      { t: '`LoadIC 1:29 P N x`', correct: true, why: 'The fifth shape exceeded the limit of four, so the state went from P to N.' },
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
    q: 'What does a megamorphic access use instead of its own list of shapes?',
    options: [
      { t: 'The object’s dictionary', why: 'The object is still a fast object; it is the access site that gave up.' },
      { t: 'TurboFan code', why: 'Megamorphic feedback gives TurboFan nothing specific to build on.' },
      { t: 'The stub cache, shared by all megamorphic loads, keyed by shape and name', correct: true, why: 'V8’s source describes the stub cache as mapping (map, name, type) to handlers.' },
      { t: 'The constant pool', why: 'The constant pool holds the name `"x"`, not shapes or handlers.' },
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
