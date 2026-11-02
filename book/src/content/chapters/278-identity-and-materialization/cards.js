// Chapter 278 cards. Keys are stable ids: never rename them.

const H = `class H {
  constructor(c, i) {
    this.c = c;
    this.i = i;
  }
  get x() { return this.c.x[this.i]; }
  set x(v) { this.c.x[this.i] = v; }
}`;

export const prompts = {
  'im-snapshot': {
    q: 'After `const p = get(0)` returns a fresh copy built from the columns, what happens to `p.x = 42`?',
    a: 'It changes only the copy. The column, and every later read of element 0, still sees the old value.',
  },
  'im-two-bugs': {
    q: 'Name the two things a fresh copy per access gets wrong.',
    a: 'Aliasing (writes through one path aren’t seen through another) and identity (`===` is false).',
  },
  'im-handle': {
    q: 'What does a handle hold?',
    a: 'The collection and an index. Its fields are accessors that read and write the columns.',
  },
  'im-holds-container': {
    q: 'Why should a handle hold the container rather than the column `c.x`?',
    a: '`grow()` replaces columns with bigger ones; a saved column would go stale.',
  },
  'im-identity': {
    q: 'What does a handle design need so that `ps[0] === ps[0]` stays true?',
    a: 'A cache that hands out the same handle for the same index every time.',
  },
  'im-cache-cost': {
    q: 'Why does a handle cache eat into SoA’s gains?',
    a: 'It brings back one object per element handed out, and every field access becomes an accessor call.',
  },
  'im-index-handle': {
    q: 'What does Viscosity compile `const p = ps[i]` into when `p` is only used for field access?',
    a: '`const p = i`: the index itself serves as the handle.',
  },
  'im-refuse': {
    q: 'What does Viscosity do with a collection whose elements escape?',
    a: 'Keeps it as an array of objects and explains which line made an element escape.',
  },
};

export const examples = {
  copies: {
    title: 'Real objects vs copies',
    code: `// Original: real objects.
const ps = [];
for (let i = 0; i < 4; i++)
  ps.push({ x: i });
const k = [ps[0]];
k[0].x = 42;
console.log(ps[0].x, k[0] === ps[0]);

// SoA, materializing copies.
const s = { x: [0, 1, 2, 3] };
const get = (i) => ({ x: s.x[i] });
const k2 = [get(0)];
k2[0].x = 42;
console.log(s.x[0], k2[0] === get(0));`,
  },
  handles: {
    title: 'Cached handles',
    code: `${H}
const c = { x: [0, 1, 2, 3], hs: [] };
function at(i) {
  let h = c.hs[i];
  if (!h) h = c.hs[i] = new H(c, i);
  return h;
}
const k = [at(0)];
k[0].x = 42;
console.log(c.x[0], k[0] === at(0));
console.log(Object.keys(at(0)));
try {
  JSON.stringify(at(0));
} catch (e) {
  console.log(e.name);
}`,
  },
};

export const exercises = {
  handleCache: {
    title: 'A handle cache that preserves identity',
    prompt:
      'A container `c` has a column `c.x` and an empty array `c.hs`. The class `H` is a handle. Write `at(c, i)` so that it returns a handle for element `i`, and returns the **same** handle every time it is asked for the same element of the same container. Writes through a handle must reach the column.',
    starter: `${H}

function at(c, i) {
  // your code here
  return new H(c, i);
}

const c = { x: [5, 6, 7], hs: [] };
console.log(at(c, 0) === at(c, 0));`,
    solution: `${H}

function at(c, i) {
  let h = c.hs[i];
  if (!h) {
    h = new H(c, i);
    c.hs[i] = h;
  }
  return h;
}`,
    tests: `const mk = () => ({ x: [5, 6, 7, 8], hs: [] });
test('same element, same handle', () => {
  const c = mk();
  expect(at(c, 1) === at(c, 1)).toBe(true);
});
test('different elements, different handles', () => {
  const c = mk();
  expect(at(c, 1) === at(c, 2)).toBe(false);
});
test('writes reach the column', () => {
  const c = mk();
  const keep = [at(c, 2)];
  keep[0].x = 42;
  expect(c.x[2]).toBe(42);
  expect(at(c, 2).x).toBe(42);
});
test('two containers do not share handles', () => {
  const a = mk();
  const b = mk();
  b.x[0] = 99;
  at(a, 0);
  expect(at(b, 0).x).toBe(99);
});
test('still right after the column grows', () => {
  const c = mk();
  const h = at(c, 3);
  c.x = [...c.x, 9, 10];
  c.x[3] = 1;
  expect(h.x).toBe(1);
  expect(at(c, 4).x).toBe(9);
});`,
    hints: [
      'Look in `c.hs[i]` first. If there is a handle there, return it.',
      'Otherwise make `new H(c, i)`, store it in `c.hs[i]`, and return it.',
      'Keep the cache on the container, not in a variable outside: two containers both have an element 0.',
    ],
    walkthrough: `**How to think about it.** The handle class already keeps **aliasing** right: its accessors read and write \`c.x[i]\`, so the value lives only in the column. What it cannot do alone is keep **identity** right, because calling \`new H(c, 0)\` twice makes two different objects, and \`===\` compares objects by reference. So the job is "make a handle only the first time; every later time, give back the one you made". That is a cache, and the questions are where to keep it and what to key it by. Key it by the index, and keep it on the container, because element 0 of one container and element 0 of another are different elements.

**The solution, line by line.**

- \`function at(c, i) {\` takes the container and the index.
- \`let h = c.hs[i];\` looks in this container's cache; for an index never asked for, the slot is empty and \`h\` is \`undefined\`.
- \`if (!h) {\` runs only the first time element \`i\` is asked for.
- \`h = new H(c, i);\` makes the handle: it holds the container and the index, and nothing else.
- \`c.hs[i] = h;\` remembers it, so every later call finds it.
- \`return h;\` gives back the one handle for element \`i\`, new or cached.

Why it survives growth: the handle holds \`c\`, not \`c.x\`, so when the column is replaced by a bigger one (the last test does exactly that), the accessors look up \`this.c.x\` again and find the new column.

Notice the price: after a loop that hands out every element, \`c.hs\` holds one object per element. That is the array of objects we set out to remove, plus an accessor call on every field access, and that trade is why Viscosity refuses instead.

**Common wrong attempts.**

- One cache for every container (a \`hs\` array outside the function): element 0 of the second container gets the handle made for the first, which reads the wrong column.
- Caching a snapshot, \`{ x: c.x[i] }\`: \`===\` now works, but a write changes the copy, not \`c.x[i]\`, so aliasing is broken.
- No cache at all (the starter): aliasing works, but \`at(c, 0) === at(c, 0)\` is \`false\`.`,
    wrong: [
      {
        code: `${H}

const hs = [];
function at(c, i) {
  if (!hs[i]) hs[i] = new H(c, i);
  return hs[i];
}`,
        why: 'One cache for every container. Element 0 of the second container gets the handle made for the first, which reads the wrong column.',
      },
      {
        code: `${H}

function at(c, i) {
  if (!c.hs[i]) {
    c.hs[i] = { x: c.x[i] };
  }
  return c.hs[i];
}`,
        why: 'This caches a snapshot. `===` works, but a write changes the copy, not `c.x[i]`, so aliasing is broken.',
      },
    ],
  },
  countHandles: {
    optional: true,
    title: 'Handles on demand',
    prompt:
      'Most elements may never be handed out. Write `at(c, i)` with a **Map** cache in `c.hs` (so untouched indexes cost nothing), and count every handle you create in `c.made`.',
    starter: `${H}

function at(c, i) {
  // your code here
}

const c = {
  x: [1, 2, 3], hs: new Map(), made: 0,
};
at(c, 0); at(c, 0); at(c, 2);
console.log(c.made);`,
    solution: `${H}

function at(c, i) {
  let h = c.hs.get(i);
  if (!h) {
    h = new H(c, i);
    c.hs.set(i, h);
    c.made++;
  }
  return h;
}`,
    tests: `const mk = (n) => ({
  x: new Array(n).fill(0), hs: new Map(), made: 0,
});
test('one handle per distinct index', () => {
  const c = mk(10);
  for (const i of [0, 1, 0, 2, 1, 0]) at(c, i);
  expect(c.made).toBe(3);
});
test('identity holds', () => {
  const c = mk(10);
  expect(at(c, 7) === at(c, 7)).toBe(true);
});
test('a big collection, few handles', () => {
  const c = mk(1000000);
  at(c, 5);
  at(c, 999999);
  expect(c.hs.size).toBe(2);
});
test('writes reach the column', () => {
  const c = mk(4);
  at(c, 3).x = 8;
  expect(c.x[3]).toBe(8);
});`,
    hints: [
      '`c.hs.get(i)` returns `undefined` when there is no handle yet.',
      'Only when you create a handle: `c.hs.set(i, h)` and `c.made++`.',
    ],
    walkthrough: `**How to think about it.** An array cache with one slot per index is fine for a small collection, but most elements of a big one may never be handed out as objects. A \`Map\` holds only the keys that were set, so it costs nothing for untouched indexes. Counting the handles you create shows the real price of identity preservation: one allocation per *distinct* element handed out.

**The solution, line by line.**

- \`let h = c.hs.get(i);\` asks the map; \`get\` returns \`undefined\` for a key never set.
- \`if (!h) {\` runs the first time only.
- \`h = new H(c, i);\` makes the handle, \`c.hs.set(i, h);\` stores it under its index, and \`c.made++;\` counts one allocation.
- \`return h;\` returns the cached or new handle.

A million-element collection that hands out two elements stores two handles, not a million slots; but a loop that touches every element as an object still pays for all of them.

**Common wrong attempts.**

- Incrementing \`c.made\` on every call counts requests, not handles; the count must sit inside the branch that creates one.
- Using an object \`{}\` as the cache works for indexes, but a \`Map\` says what it is for and has \`get\`, \`set\` and \`size\`.`,
    wrong: [
      {
        code: `${H}

function at(c, i) {
  c.made++;
  if (!c.hs.has(i)) {
    c.hs.set(i, new H(c, i));
  }
  return c.hs.get(i);
}`,
        why: 'This counts every request, not every handle created. Count inside the branch that makes a new handle.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A SoA rewrite makes `ps[i]` return `{ x: ps.x[i] }`, a fresh object. Which original behaviour breaks?',
    options: [
      { t: 'Only `===` between elements.', why: 'Writes through the copy also stop reaching the column, so aliasing breaks too.' },
      { t: 'Both aliasing and identity.', correct: true, why: 'Writes hit the copy, and every access makes a new object.' },
      { t: 'Neither, as long as fields are numbers.', why: 'The field types don’t matter; the copy is a different object.' },
      { t: 'Only reading `x`.', why: 'Reading works: the copy has the current value at the moment it is made.' },
    ],
  },
  {
    q: 'Why does `keep[0].x = 42` reach the column when `keep[0]` is a handle?',
    options: [
      { t: 'The handle copies its value back when it is garbage collected.', why: 'Nothing is copied back. The setter writes the column immediately.' },
      { t: 'Handles are frozen, so the write is redirected.', why: 'Freezing would make the write fail. It’s an accessor that does the work.' },
      { t: 'The engine rewrites the assignment.', why: 'The engine runs ordinary JavaScript; the redirect is the handle’s own code.' },
      { t: 'Assigning `x` calls the handle’s setter, which writes `c.x[i]`.', correct: true, why: 'The value lives only in the column, so every path sees the write.' },
    ],
  },
  {
    q: 'A handle class saves `this.col = c.x` in its constructor. What goes wrong?',
    options: [
      { t: 'After `grow()` replaces the column, the handle reads and writes the old one.', correct: true, why: 'The container moved to a bigger array; the handle kept a reference to the abandoned one.' },
      { t: 'Nothing; it is just faster.', why: 'It is faster until the first grow, then silently wrong.' },
      { t: 'It breaks `===`.', why: 'Identity is about the handle objects, not what they store.' },
      { t: 'It uses more memory than holding the container.', why: 'Both are one reference. The problem is correctness after growth.' },
    ],
  },
  {
    q: '`viscosity explain` says “line 8: an element is compared or combined with "==="”. What did Viscosity do?',
    options: [
      { t: 'Generated cached handles for `ps`.', why: 'Viscosity has no handle mode.' },
      { t: 'Kept `ps` as an array of objects.', correct: true, why: 'An escaping element is a bailout; the explanation names the line.' },
      { t: 'Materialised a copy for each comparison.', why: 'That would make `===` false, which changes the program.' },
      { t: 'Converted `===` into an index comparison.', why: 'That would be a handle-like trick that it doesn’t do for compared elements.' },
    ],
  },
  {
    q: 'In this book’s benchmark run, `get-objects` didn’t lose with SoA, but `materialize` lost badly. Why?',
    options: [
      { t: '`get-objects` uses fewer elements.', why: 'Both were measured at the same sizes.' },
      { t: '`materialize` reads more fields.', why: 'Both read every field; the difference is what happens to the object afterwards.' },
      { t: 'V8 caches handles in `get-objects`.', why: 'V8 doesn’t make handles; it removed the object entirely.' },
      { t: 'In `get-objects` the object doesn’t escape `consume`, so V8 removed it; in `materialize` the objects are kept.', correct: true, why: 'Escape decides the cost, which is why Viscosity’s rule is about escape too.' },
    ],
  },
];
