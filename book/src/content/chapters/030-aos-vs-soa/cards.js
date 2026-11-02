// Chapter 30 cards. Keys are stable ids: never rename them.

export const prompts = {
  'aos-soa-tradeoff': {
    q: 'In one sentence: when does AoS suit a loop, and when does SoA?',
    a: 'AoS suits loops that use whole records; SoA suits loops that use a few fields of many records.',
  },
  'unused-bytes': {
    q: 'A loop reads 4 of 6 fields from packed AoS. Why does it still load the other 2?',
    a: 'Memory arrives in whole cache lines, and the unused fields sit in the same lines as the used ones.',
  },
  'aosoa-what': {
    q: 'What is **AoSoA**?',
    a: 'Fixed-size blocks of records (e.g. 8), with SoA inside each block: 8 x values, then 8 y values, and so on.',
  },
  'packed-vs-soa': {
    q: 'Packed AoS (one Float64Array) was already much faster than an array of objects. What did it remove?',
    a: 'Object headers, pointers to each object, and boxed numbers. The data became raw doubles in one block.',
  },
  'random-access': {
    q: 'Why does an array of objects suffer most when elements are visited in shuffled order?',
    a: 'Each element is a pointer to chase to an unpredictable place, so the prefetcher can’t help and misses pile up.',
  },
  'materialize-what': {
    q: 'What is **materialization**?',
    a: 'Rebuilding a whole object from its SoA columns.',
  },
  'materialize-cost': {
    q: 'Why was SoA far slower than AoS in the `materialize` suite?',
    a: 'Every element needed a fresh object allocation; AoS only copied references to objects that already existed.',
  },
  'escape-removed': {
    q: 'Why did SoA *not* lose in `get-objects`, where each element is passed to a small function as an object?',
    a: 'The object didn’t escape: V8 inlined the function and removed the temporary object.',
  },
  'identity-lost': {
    q: 'If `get(s, i)` builds an object from columns, what is `get(s, 0) === get(s, 0)`, and why?',
    a: '`false`. Each call allocates a new object, so the two have different identities.',
  },
  'small-n': {
    q: 'Why did SoA help much less with 1,000 particles than with 100,000?',
    a: 'The whole data set already fits in cache, so there are few misses for a better layout to remove.',
  },
  'aosoa-random': {
    q: 'Why was AoSoA slow at random access in this book’s benchmark?',
    a: 'Every access must compute a block and a lane (a division and a remainder), which costs more than it saves.',
  },
  'hot-cold': {
    q: 'What is a **hot/cold split**?',
    a: 'Moving often-used (hot) fields into their own storage, away from rarely used (cold) ones, so hot loops only stream hot data.',
  },
};

export const examples = {
  materialize: {
    title: 'Materializing from columns',
    code: `const s = {
  x: new Float64Array([1, 2]),
  y: new Float64Array([3, 4]),
};
function get(s, i) {
  return { x: s.x[i], y: s.y[i] };
}
const a = get(s, 0);
const b = get(s, 0);
console.log(a, b);
console.log(a === b);
a.x = 99;
console.log(s.x[0]);`,
  },
};

export const exercises = {
  toSoa: {
    title: 'Convert to struct of arrays',
    prompt:
      'Write `toSoa(ps, fields)` that takes an array of objects and a list of field names, and returns an object with one **`Float64Array`** column per listed field. Fields that aren’t listed are left out (they stay cold).',
    starter: `function toSoa(ps, fields) {
  const s = {};
  // your code here
  return s;
}

const ps = [{ x: 1, y: 2 }];
console.log(toSoa(ps, ['x', 'y']));`,
    solution: `function toSoa(ps, fields) {
  const s = {};
  for (const f of fields) {
    s[f] = new Float64Array(ps.length);
  }
  for (let i = 0; i < ps.length; i++) {
    for (const f of fields) {
      s[f][i] = ps[i][f];
    }
  }
  return s;
}`,
    tests: `const ps = [
  { x: 1, y: 2, name: 'a' },
  { x: 3, y: 4, name: 'b' },
];
test('one column per field', () => {
  const s = toSoa(ps, ['x', 'y']);
  expect(Array.from(s.x)).toEqual([1, 3]);
  expect(Array.from(s.y)).toEqual([2, 4]);
});
test('columns are Float64Arrays', () => {
  const s = toSoa(ps, ['x']);
  expect(s.x instanceof Float64Array).toBe(true);
});
test('unlisted fields are left out', () => {
  expect(Object.keys(toSoa(ps, ['y'])))
    .toEqual(['y']);
});
test('an empty list gives empty columns', () => {
  expect(toSoa([], ['x']).x.length).toBe(0);
});`,
    hints: [
      'First make the columns: for each field name `f`, `s[f] = new Float64Array(ps.length)`.',
      'The field name is in a variable, so you need bracket access: `s[f]` and `ps[i][f]`, not `s.f`.',
      'Then loop over the objects and copy `ps[i][f]` into `s[f][i]`.',
    ],
    walkthrough: `This is the core of an AoS-to-SoA conversion, and it uses bracket access from chapter 3 throughout.

- **Allocate the columns.** One \`Float64Array\` per field, each as long as the input. Typed arrays store raw doubles side by side, which is the whole point.
- **Copy, transposing.** Element \`i\` of field \`f\` moves from \`ps[i][f]\` (record first) to \`s[f][i]\` (field first). Swapping the order of the two indexes is exactly what changes the layout.
- **Leave the rest.** Only the listed fields get columns: that is a hot/cold split, and the cold fields can stay in the original objects.

Viscosity generates code shaped like this, except it knows the field names at compile time, so it can write \`s.x[i] = p.x\` directly.`,
    wrong: [
      {
        code: `function toSoa(ps, fields) {
  const s = {};
  for (const f of fields) {
    s[f] = [];
    for (const p of ps) s[f].push(p[f]);
  }
  return s;
}`,
        why: 'This gives ordinary arrays, not `Float64Array`s. The values are right, but plain arrays don’t guarantee raw, unboxed doubles stored side by side.',
      },
      {
        code: `function toSoa(ps, fields) {
  const s = {};
  for (const f of fields) {
    s.f = new Float64Array(ps.length);
    for (let i = 0; i < ps.length; i++)
      s.f[i] = ps[i][f];
  }
  return s;
}`,
        why: '`s.f` means the property literally named "f", not the name stored in the variable `f`. Use `s[f]`.',
      },
    ],
  },
  aosoaAt: {
    optional: true,
    title: 'Find a field in AoSoA',
    prompt:
      'Particles have 6 fields and are stored in AoSoA blocks of 8: block `b` holds 8 values of field 0, then 8 of field 1, and so on (48 slots per block). Write `aosoaAt(i, f)` that returns the slot index of field `f` of particle `i`.',
    starter: `function aosoaAt(i, f) {
  // your code here
}

console.log(aosoaAt(10, 2));`,
    solution: `function aosoaAt(i, f) {
  const blk = Math.floor(i / 8);
  const lane = i % 8;
  return blk * 48 + f * 8 + lane;
}`,
    tests: `test('the first particle', () => {
  expect(aosoaAt(0, 0)).toBe(0);
  expect(aosoaAt(0, 1)).toBe(8);
});
test('neighbours in one field are adjacent', () => {
  expect(aosoaAt(1, 0)).toBe(1);
  expect(aosoaAt(7, 0)).toBe(7);
});
test('particle 8 starts the next block', () => {
  expect(aosoaAt(8, 0)).toBe(48);
});
test('somewhere in the middle', () => {
  expect(aosoaAt(10, 2)).toBe(66);
});`,
    hints: [
      'Which block? `Math.floor(i / 8)`. Which lane inside it? `i % 8`.',
      'A block is 6 × 8 = 48 slots. Inside it, field `f` starts at `f * 8`.',
    ],
    walkthrough: `Three pieces, added together:

- **Block start:** \`Math.floor(i / 8) * 48\`. Each block holds 8 particles × 6 fields.
- **Field start inside the block:** \`f * 8\`, because each field gets 8 slots.
- **Lane:** \`i % 8\`, the particle's position within its block.

That division and remainder on every random access is exactly the cost that made AoSoA slow in the \`random-x\` benchmark. In a sequential loop you can avoid it by looping over blocks and lanes separately, as the harness does.`,
    wrong: [
      {
        code: `function aosoaAt(i, f) {
  return i * 6 + f;
}`,
        why: 'That is the packed AoS index (stride 6). In AoSoA, neighbouring particles’ values of one field are adjacent.',
      },
      {
        code: `function aosoaAt(i, f) {
  return f * 8 + i;
}`,
        why: 'This forgets the blocks: it only works for the first 8 particles. Particle 8 belongs to block 1, at slot 48.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop reads only `mass` from every particle. Which layout should load the fewest unused bytes?',
    options: [
      { t: 'Array of objects', why: 'Each object’s header and other fields share mass’s cache lines.' },
      { t: 'Packed AoS (one Float64Array)', why: 'Five of every six doubles in each line are other fields.' },
      { t: 'Struct of arrays', correct: true, why: 'The mass column is contiguous, so every byte loaded is a mass value.' },
      { t: 'They are all the same: the loop reads the same values', why: 'The values are the same, but the bytes dragged in with them are not.' },
    ],
  },
  {
    q: 'In this book’s run, packed AoS was much faster than an array of objects even though both keep AoS order. Why?',
    options: [
      { t: 'Packed AoS has no headers, no pointers to chase and no boxed numbers', correct: true, why: 'Part of SoA’s advantage is just typed storage; packed AoS gets that part.' },
      { t: 'Packed AoS uses SIMD automatically', why: 'Nothing in the benchmark shows that, and JavaScript has no SIMD API.' },
      { t: 'Packed AoS skips the unused fields', why: 'It still loads them; that is the part only SoA removes.' },
      { t: 'Float64Array is compiled to WebAssembly', why: 'Typed arrays are ordinary JavaScript objects.' },
    ],
  },
  {
    q: 'Why was SoA 20–35 times slower than AoS in the `materialize` suite?',
    options: [
      { t: 'Typed arrays are slow to read', why: 'SoA reads were fast everywhere else.' },
      { t: 'SoA used more memory', why: 'SoA used less; the cost was building objects.' },
      { t: 'The benchmark was broken', why: 'It measures a real pattern: code that needs objects it can keep.' },
      { t: 'It had to allocate a new object for every element, while AoS just copied existing references', correct: true, why: 'That is materialization: rebuilding objects that escape.' },
    ],
  },
  {
    q: '`get(s, i)` builds `{ x: s.x[i], y: s.y[i] }`. Then `const a = get(s, 0); a.x = 99;`. What is `s.x[0]`?',
    options: [
      { t: 'Unchanged: `a` is a separate new object', correct: true, why: 'The materialized object is a copy. Writes to it don’t flow back to the columns, which an optimizer must account for.' },
      { t: '`99`, because `a` points into the column', why: 'Plain objects can’t point into a typed array slot; the value was copied.' },
      { t: 'An error is thrown', why: 'Writing a property of a fresh object is fine.' },
      { t: '`undefined`', why: 'The column still holds its original value.' },
    ],
  },
  {
    q: 'Why does AoSoA do badly on random access in plain JavaScript?',
    options: [
      { t: 'Its blocks don’t fit in cache lines', why: '8 doubles fill a 64-byte line exactly.' },
      { t: 'Each access must compute a block and a lane with a division and a remainder', correct: true, why: 'Without SIMD to pay it back, that arithmetic is pure cost.' },
      { t: 'It stores fields as objects', why: 'AoSoA here is one Float64Array.' },
      { t: 'It can only be read in order', why: 'It can be indexed at random; it just costs more.' },
    ],
  },
  {
    q: 'A game updates `x, y, vx, vy` every frame but reads `name` only on a menu screen. What is the sensible layout?',
    options: [
      { t: 'Keep everything in one array of objects', why: 'The hot loop would drag `name` and other cold fields through the cache every frame.' },
      { t: 'Put `name` in a Float64Array too', why: 'A name is a string; it doesn’t belong in a column of doubles.' },
      { t: 'Use AoSoA for everything, including names', why: 'Blocking doesn’t help a field that is rarely read.' },
      { t: 'A hot/cold split: the four hot fields in columns, the cold ones elsewhere', correct: true, why: 'Hot loops stream only hot data; cold data stays out of the way.' },
    ],
  },
];
