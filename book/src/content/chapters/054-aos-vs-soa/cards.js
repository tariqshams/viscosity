// Chapter 52 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'aos-soa-tradeoff': {
    q: 'In one sentence: when does AoS suit a loop, and when does SoA?',
    a: 'AoS suits loops that use whole records; SoA suits loops that use a few fields of many records.',
  },
  'unused-bytes': {
    q: 'A loop reads 4 of 6 fields from packed AoS. Why does it still load the other 2?',
    a: 'Memory arrives in whole cache lines, and the unused fields sit in the same lines as the used ones.',
  },
  'c-packed': {
    q: 'Why is an array of structs in C already "packed AoS", while an array of objects in JavaScript is not?',
    a: 'C structs sit back to back with no headers or pointers; a JavaScript array holds references to separate objects, each with a header.',
  },
  'packed-vs-soa': {
    q: 'Packed AoS (one Float64Array) was already much faster than an array of objects. What did it remove?',
    a: 'Object headers, the pointer to each object, and boxed numbers: the data became raw doubles in one block.',
  },
  'random-access': {
    q: 'In shuffled order, packed AoS and SoA were almost level, far ahead of objects. Why?',
    a: 'The big cost was chasing a pointer to each object at an unpredictable place; both typed layouts remove that.',
  },
  'small-n': {
    q: 'Why did SoA help much less with 1,000 particles than with 100,000?',
    a: 'The whole data set already fits in cache, so there are few misses for a better layout to remove.',
  },
  'hot-cold': {
    q: 'What is a **hot/cold split**?',
    a: 'Moving often-used (hot) fields into their own columns, away from rarely used (cold) ones, so hot loops only stream hot data.',
  },
  'hot-cold-index': {
    q: 'After a hot/cold split, how do you find the cold fields of the particle whose `x` is `hot.x[i]`?',
    a: 'By the same index: `cold[i]` belongs to the same particle as `hot.x[i]`.',
  },
};

export const examples = {
  'hot-cold': {
    title: 'A hot/cold split',
    code: `const n = 4;
const hot = {
  x: new Float64Array(n),
  vx: new Float64Array([1, 2, 3, 4]),
};
const cold = [
  { name: 'ann', health: 100 },
  { name: 'bob', health: 90 },
  { name: 'cy', health: 80 },
  { name: 'di', health: 70 },
];
// every frame: hot columns only
for (let f = 0; f < 3; f++) {
  for (let i = 0; i < n; i++) {
    hot.x[i] += hot.vx[i];
  }
}
// the menu: one particle, rarely
const i = 2;
console.log(cold[i].name, hot.x[i]);`,
  },
};

export const exercises = {
  splitHotCold: {
    title: 'Split the hot fields out',
    prompt: 'Write `splitHotCold(ps, hot)`. It takes an array of objects `ps` and a list of hot field names `hot`, and returns `{ hot: cols, cold }`: `cols` has one **`Float64Array`** column per hot field, and `cold` is an array with one new object per particle, holding only that particle\'s other (cold) fields, at the same index. Do not change `ps`.',
    starter: `function splitHotCold(ps, hot) {
  const cols = {};
  const cold = [];
  // your code here
  return { hot: cols, cold };
}

const ps = [{ x: 1, name: 'a' }];
console.log(splitHotCold(ps, ['x']));`,
    solution: `function splitHotCold(ps, hot) {
  const n = ps.length;
  const cols = {};
  for (const f of hot) {
    cols[f] = new Float64Array(n);
  }
  const cold = [];
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const rest = {};
    for (const k of Object.keys(p)) {
      if (hot.includes(k)) {
        cols[k][i] = p[k];
      } else {
        rest[k] = p[k];
      }
    }
    cold.push(rest);
  }
  return { hot: cols, cold };
}`,
    tests: `const ps = [
  { x: 1, vx: 2, name: 'a' },
  { x: 3, vx: 4, name: 'b' },
];
test('hot fields become columns', () => {
  const r = splitHotCold(ps, ['x', 'vx']);
  expect(Array.from(r.hot.x)).toEqual([1, 3]);
  expect(Array.from(r.hot.vx)).toEqual([2, 4]);
});
test('columns are Float64Arrays', () => {
  const r = splitHotCold(ps, ['x']);
  expect(r.hot.x instanceof Float64Array)
    .toBe(true);
});
test('cold keeps only the other fields', () => {
  const r = splitHotCold(ps, ['x', 'vx']);
  expect(r.cold).toEqual(
    [{ name: 'a' }, { name: 'b' }]);
});
test('cold fields stay at the same index', () => {
  const r = splitHotCold(ps, ['x']);
  expect(r.cold[1]).toEqual({ vx: 4, name: 'b' });
});
test('empty input gives empty columns', () => {
  const r = splitHotCold([], ['x']);
  expect(r.hot.x.length).toBe(0);
  expect(r.cold).toEqual([]);
});
test('the input is not changed', () => {
  splitHotCold(ps, ['x']);
  expect(ps[0]).toEqual({ x: 1, vx: 2, name: 'a' });
});`,
    hints: [
      'Do it in two parts: first make an empty `Float64Array` of length `ps.length` for every hot field; then walk the particles and sort each field into "hot" or "cold".',
      'The field names are in variables, so use bracket access: `cols[f]`, `p[k]`. `Object.keys(p)` lists a particle\'s field names, and `hot.includes(k)` says whether one is hot.',
      'For particle `i`: make `const rest = {};`; for each key `k`, if it is hot do `cols[k][i] = p[k];`, otherwise `rest[k] = p[k];`; then `cold.push(rest);`.',
    ],
    walkthrough: `**How to think about it.** The output has two halves that are filled in different ways. The hot columns have a fixed length known up front (one slot per particle), so they can be made before the loop and filled by index. The cold objects are new, one per particle, built as we go. So the plan is: make the columns; then for each particle, look at each of its fields and send it to one side or the other. Because both sides are filled in particle order, \`cold[i]\` automatically lines up with \`cols.x[i]\`, which is the one promise a split must keep.

**The solution, line by line.**

- \`const n = ps.length;\` names the number of particles.
- \`const cols = {};\` will hold one column per hot field, named by the field.
- \`for (const f of hot) {\` and \`cols[f] = new Float64Array(n);\` make each column: \`n\` doubles, all zero for now. Bracket access, \`cols[f]\`, uses the name stored in \`f\` (from the chapter on objects); \`cols.f\` would make a property literally called "f".
- \`const cold = [];\` will hold the cold objects.
- \`for (let i = 0; i < ps.length; i++) {\` visits each particle by index, because the index is where its hot values go.
- \`const p = ps[i];\` gives the particle a short name.
- \`const rest = {};\` starts this particle's cold object, empty.
- \`for (const k of Object.keys(p)) {\` goes through the particle's field names, such as \`'x'\`, \`'vx'\`, \`'name'\`.
- \`if (hot.includes(k)) {\` asks whether this field is hot.
- \`cols[k][i] = p[k];\` copies a hot value into slot \`i\` of its column: record-first (\`p[k]\`) becomes field-first (\`cols[k][i]\`), which is the whole change of layout.
- \`rest[k] = p[k];\` otherwise copies the value into the cold object.
- \`cold.push(rest);\` adds the cold object at index \`i\`, since particles are pushed in order.
- \`return { hot: cols, cold };\` hands back both halves. \`ps\` was only read, never written, so the caller's objects are unchanged.

For the test data with hot fields \`['x', 'vx']\`, \`cols.x\` is \`[1, 3]\`, \`cols.vx\` is \`[2, 4]\`, and \`cold\` is \`[{ name: 'a' }, { name: 'b' }]\`.

**Common wrong attempts.**

- Pushing the whole particle into \`cold\` (\`cold.push(p)\`) is shorter, but the cold side then still carries the hot fields, so nothing has really been split, and any change to it would change the caller's objects too.
- Making ordinary arrays for the columns gives the right numbers but not the contiguous raw doubles a column is for, and the test checks for \`Float64Array\`.
- Deleting the hot fields from \`ps[i]\` "to make it cold" changes the caller's data, which the last test catches.`,
    wrong: [
      {
        code: `function splitHotCold(ps, hot) {
  const n = ps.length;
  const cols = {};
  for (const f of hot) {
    cols[f] = new Float64Array(n);
  }
  const cold = [];
  for (let i = 0; i < ps.length; i++) {
    for (const f of hot) {
      cols[f][i] = ps[i][f];
    }
    cold.push(ps[i]);
  }
  return { hot: cols, cold };
}`,
        why: 'The columns are right, but `cold` holds the whole original objects, hot fields included, so the cold side has not been split at all.',
      },
      {
        code: `function splitHotCold(ps, hot) {
  const cols = {};
  for (const f of hot) cols[f] = [];
  const cold = [];
  for (const p of ps) {
    const rest = {};
    for (const k of Object.keys(p)) {
      if (hot.includes(k)) {
        cols[k].push(p[k]);
      } else rest[k] = p[k];
    }
    cold.push(rest);
  }
  return { hot: cols, cold };
}`,
        why: 'The values are right, but the columns are ordinary arrays, not `Float64Array`s, so there is no guarantee of raw doubles side by side.',
      },
    ],
  },
  linesTouched: {
    optional: true,
    title: 'Count the cache lines',
    prompt: 'Each field is a float64 (8 bytes) and a cache line is 64 bytes. Write `linesTouched(n, F, k, layout)`: the number of cache lines a loop over `n` records brings in when it reads `k` of the `F` fields. For `\'packed\'` every field arrives, so it is `n * F * 8` bytes, rounded up to whole lines. For `\'soa\'` each of the `k` columns is `n * 8` bytes, rounded up to whole lines, and the loop reads `k` columns.',
    starter: `function linesTouched(n, F, k, layout) {
  // your code here
}

const r = linesTouched(16, 6, 4, 'soa');
console.log(r);`,
    solution: `function linesTouched(n, F, k, layout) {
  if (layout === 'packed') {
    return Math.ceil((n * F * 8) / 64);
  }
  return k * Math.ceil((n * 8) / 64);
}`,
    tests: `test('update-xy on 1,000 records', () => {
  expect(linesTouched(1000, 6, 4, 'packed'))
    .toBe(750);
  expect(linesTouched(1000, 6, 4, 'soa'))
    .toBe(500);
});
test('one field on 8 records', () => {
  expect(linesTouched(8, 6, 1, 'soa')).toBe(1);
  expect(linesTouched(8, 6, 1, 'packed'))
    .toBe(6);
});
test('partial lines round up', () => {
  expect(linesTouched(3, 6, 1, 'packed'))
    .toBe(3);
  expect(linesTouched(1, 6, 2, 'soa')).toBe(2);
});`,
    hints: [
      'Work out the bytes first, then divide by 64 for lines. A part-filled line still has to be fetched, so round up with `Math.ceil`.',
      'Packed: `Math.ceil((n * F * 8) / 64)`, and `k` does not matter, because every field arrives anyway.',
      'SoA: one column is `Math.ceil((n * 8) / 64)` lines, and there are `k` of them: multiply.',
    ],
    walkthrough: `**How to think about it.** This is the formula from the chapter, made exact. A cache line is the unit memory arrives in, so the question is "how many 64-byte blocks does the loop cover?". In packed AoS the loop walks the whole buffer, because the fields it does not want are interleaved with the ones it does; in SoA it walks only the columns it reads, each one separately.

**The solution, line by line.**

- \`if (layout === 'packed') {\` handles packed AoS.
- \`return Math.ceil((n * F * 8) / 64);\`: \`n\` records of \`F\` fields of 8 bytes is the whole buffer; divided by 64 it is the number of lines, and \`Math.ceil\` rounds a part-filled last line up to a whole one. \`k\` is not used: reading fewer fields does not fetch fewer lines.
- \`return k * Math.ceil((n * 8) / 64);\` handles SoA: one column of \`n\` doubles covers \`Math.ceil(n * 8 / 64)\` lines, and the loop reads \`k\` columns. The rounding is per column, because each column is its own array.

For update-xy on 1,000 particles: packed is 48,000 bytes, 750 lines; SoA is 4 columns of 125 lines, 500 lines, which is the two thirds from the chapter.

**Common wrong attempts.**

- Using \`k\` instead of \`F\` for packed AoS assumes the loop only fetches the fields it reads, which is exactly what interleaving prevents.
- Rounding once at the end for SoA (\`Math.ceil(k * n * 8 / 64)\`) undercounts when columns end mid-line: two one-element columns are two lines, not one.`,
    wrong: [
      {
        code: `function linesTouched(n, F, k, layout) {
  if (layout === 'packed') {
    return Math.ceil((n * k * 8) / 64);
  }
  return k * Math.ceil((n * 8) / 64);
}`,
        why: 'Packed AoS brings in every field, used or not, so the byte count must use `F`, not `k`.',
      },
      {
        code: `function linesTouched(n, F, k, layout) {
  if (layout === 'packed') {
    return Math.ceil((n * F * 8) / 64);
  }
  return Math.ceil((k * n * 8) / 64);
}`,
        why: 'Each column is a separate array, so each rounds up on its own: two one-element columns touch 2 lines, not 1.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop reads only `mass` from every particle. Which layout should load the fewest unused bytes?',
    options: [
      {
        t: 'Array of objects',
        why: 'Each object\'s header and other fields share mass\'s cache lines.',
      },
      {
        t: 'Packed AoS (one Float64Array)',
        why: 'Five of every six doubles it loads are other fields.',
      },
      {
        t: 'Struct of arrays',
        correct: true,
        why: 'The mass column is contiguous, so every byte loaded is a mass value.',
      },
      {
        t: 'They are all the same: the loop reads the same values',
        why: 'The values are the same, but the bytes dragged in with them are not.',
      },
    ],
  },
  {
    q: 'In this book\'s run, packed AoS was much faster than an array of objects, although both keep records together. Why?',
    options: [
      {
        t: 'Packed AoS has no headers, no pointers to chase and no boxed numbers',
        correct: true,
        why: 'That is the typed-storage part of SoA\'s advantage, and packed AoS gets it too.',
      },
      {
        t: 'Packed AoS uses SIMD automatically',
        why: 'Nothing in the benchmark shows that, and JavaScript has no SIMD API.',
      },
      {
        t: 'Packed AoS skips the unused fields',
        why: 'It still loads them; that is the part only SoA removes.',
      },
    ],
  },
  {
    q: 'With 1,000 particles, packed AoS was no faster than objects in this book\'s run. What is the best explanation?',
    options: [
      {
        t: 'Typed arrays are slow when they are small',
        why: 'Nothing suggests that; SoA was still ahead at this size.',
      },
      {
        t: 'The data fits in cache, so there are few misses for a layout change to remove',
        correct: true,
        why: 'Layout changes save memory traffic; small data has little traffic to save.',
      },
      {
        t: 'The benchmark was broken at small sizes',
        why: 'Small sizes are measured the same way; the result reflects the cache.',
      },
    ],
  },
  {
    q: 'A game updates `x, y, vx, vy` every frame but reads `name` only on a menu screen. What is the sensible layout?',
    options: [
      {
        t: 'Keep everything in one array of objects',
        why: 'The hot loop would drag `name` and the other cold fields through the cache every frame.',
      },
      {
        t: 'Put `name` in a Float64Array too',
        why: 'A name is a string; it does not belong in a column of doubles.',
      },
      {
        t: 'A hot/cold split: the four hot fields in columns, the cold ones in objects at the same index',
        correct: true,
        why: 'Hot loops stream only hot data; cold data stays out of the way.',
      },
    ],
  },
  {
    q: 'In C, `struct P { double x, vx; } ps[N];` is an array of structs. How does it differ from a JavaScript array of objects?',
    options: [
      {
        t: 'It does not: both are arrays of pointers',
        why: 'C structs in an array are stored inline, back to back.',
      },
      {
        t: 'C stores the structs back to back with no headers, so it is already packed AoS',
        correct: true,
        why: 'For C, moving to SoA changes only locality; in JavaScript it changes the storage too.',
      },
      {
        t: 'C cannot store doubles in a struct',
        why: 'It can; `double` fields are stored inline as raw 8-byte values.',
      },
      {
        t: 'C arrays must be SoA',
        why: 'C lets you choose either layout.',
      },
    ],
  },
];
