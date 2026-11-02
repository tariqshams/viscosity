// Chapter 94 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'interchange-not-enough': {
    q: 'Why can loop interchange not fix a matrix transpose `b[j * n + i] = a[i * n + j]`?',
    a: 'Whichever loop is inside, one of the two arrays is walked down its columns; swapping only changes which one.',
  },
  'tile-what': {
    q: 'What does tiling a two-deep loop nest do?',
    a: 'Adds two outer loops that step from tile to tile by `T`, so the inner loops finish one `T × T` tile before moving on.',
  },
  'tile-reuse': {
    q: 'Inside one `T × T` tile of a transpose, how many cache lines of `b` are written, and how often is each used?',
    a: 'About `T` lines, each used about `T` times (for a tile that starts on a line boundary, with `T` numbers to a line).',
  },
  'tile-edges': {
    q: 'What handles the last, smaller tiles when `n` is not a multiple of `T`?',
    a: 'The inner loops stop at `Math.min(ii + T, n)` (and the same for `j`), so they never run past the grid.',
  },
  'strip-mine': {
    q: 'What is strip-mining, and why is it always legal?',
    a: 'Splitting one loop into a loop over chunks and a loop within a chunk; it visits the same iterations in the same order.',
  },
  'tile-legal': {
    q: 'When is tiling a loop nest legal?',
    a: 'When no dependence has a `>` in its direction vector, so the strip loops may be interchanged.',
  },
  'tile-size': {
    q: 'In this chapter’s run, which tile size made the 2048 × 2048 transpose fastest, and by how much?',
    a: '32: about 21.5 ms against 47.6 ms untiled, more than twice as fast.',
  },
  'aosoa-tile': {
    q: 'In Viscosity’s AoSoA layout with blocks of 8, what does `i >> 3` compute?',
    a: 'The block that element `i` lives in: `i` divided by 8, rounded down.',
  },
};

export const examples = {
  tiled: {
    title: 'Time a transpose, untiled and tiled',
    code: `const n = 1024;
const a = new Float64Array(n * n);
const b = new Float64Array(n * n);
for (let k = 0; k < n * n; k++) {
  a[k] = k;
}

function plain() {
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      b[j * n + i] = a[i * n + j];
}
function tiled(T) {
  for (let ii = 0; ii < n; ii += T)
  for (let jj = 0; jj < n; jj += T)
  for (let i = ii; i < ii + T; i++)
  for (let j = jj; j < jj + T; j++)
    b[j * n + i] = a[i * n + j];
}
function time(f) {
  let best = Infinity;
  for (let r = 0; r < 5; r++) {
    const t0 = performance.now();
    f();
    const t = performance.now() - t0;
    best = Math.min(best, t);
  }
  return best.toFixed(1) + ' ms';
}
console.log('plain', time(plain));
for (const T of [8, 32, 128]) {
  const f = () => tiled(T);
  console.log('T =', T, time(f));
}`,
  },
};

export const exercises = {
  transposeTiled: {
    title: 'A tiled transpose',
    prompt: '`a` is an `n × n` grid stored row by row in a flat array (element `(i, j)` is `a[i * n + j]`). Write `transposeTiled(a, n, T)` that returns a **new** array `b` with `b[j * n + i] = a[i * n + j]`, using **four** loops: two that step by `T` from tile to tile, and two inside a tile. It must work when `n` is not a multiple of `T`.',
    starter: `function transposeTiled(a, n, T) {
  const b = new Array(n * n);
  // your code here
  return b;
}

console.log(transposeTiled(
  [1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 2));
// [1, 4, 7, 2, 5, 8, 3, 6, 9]`,
    solution: `function transposeTiled(a, n, T) {
  const b = new Array(n * n);
  for (let ii = 0; ii < n; ii += T)
  for (let jj = 0; jj < n; jj += T) {
    const iEnd = Math.min(ii + T, n);
    const jEnd = Math.min(jj + T, n);
    for (let i = ii; i < iEnd; i++)
    for (let j = jj; j < jEnd; j++)
      b[j * n + i] = a[i * n + j];
  }
  return b;
}`,
    tests: `const plain = (a, n) => { const b = new Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) b[j * n + i] = a[i * n + j]; return b; };
const grid = (n) => Array.from({ length: n * n }, (_, k) => k);
test('3 × 3 with tiles of 2 (ragged edges)', () => {
  expect(transposeTiled([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 2)).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
});
test('8 × 8 with tiles of 4', () => {
  expect(transposeTiled(grid(8), 8, 4)).toEqual(plain(grid(8), 8));
});
test('7 × 7 with tiles of 3', () => {
  expect(transposeTiled(grid(7), 7, 3)).toEqual(plain(grid(7), 7));
});
test('a tile bigger than the grid', () => {
  expect(transposeTiled(grid(5), 5, 16)).toEqual(plain(grid(5), 5));
});
test('1 × 1', () => {
  expect(transposeTiled([42], 1, 4)).toEqual([42]);
});
test('it really uses four loops', () => {
  const loops = transposeTiled.toString().match(/for\\s*\\(/g) ?? [];
  expect(loops.length >= 4).toBe(true);
});`,
    hints: [
      'Start from the plain two-loop transpose; the body `b[j * n + i] = a[i * n + j]` does not change.',
      'Add two outer loops, `ii` and `jj`, each stepping by `T` from 0 while below `n`.',
      'The inner loops run `i` from `ii` to `Math.min(ii + T, n)` and `j` from `jj` to `Math.min(jj + T, n)`.',
    ],
    walkthrough: `**How to think about it.** Tiling never changes *what* is done, only the order, so begin from the plain transpose and keep its body exactly. Then cut each loop's range into chunks of \`T\`: an outer loop picks the chunk's starting point (\`ii\` or \`jj\`, stepping by \`T\`), and an inner loop runs through that chunk. With both loops cut, put the two chunk loops outside: they choose a tile, and the inner two fill it. The only subtle part is the edge: when \`n\` is not a multiple of \`T\`, the last chunk is shorter, and an inner loop that blindly ran to \`ii + T\` would read past the end of \`a\` (getting \`undefined\`) and write slots of \`b\` that do not belong to the grid.

**The solution, line by line.**

- \`const b = new Array(n * n);\` makes the result, the same size as \`a\`.
- \`for (let ii = 0; ii < n; ii += T)\` steps through the row chunks: 0, \`T\`, \`2T\`, ... (The four loops of a perfect nest are often written at the same indentation, as here, so that the line stays short; each loop's body is the next line.)
- \`for (let jj = 0; jj < n; jj += T) {\` steps through the column chunks, so the pair \`(ii, jj)\` names one tile.
- \`const iEnd = Math.min(ii + T, n);\` is where this tile's rows stop: a whole tile's worth, or the edge of the grid, whichever comes first. \`const jEnd = Math.min(jj + T, n);\` does the same for columns. (Working them out once per tile, rather than in every loop test, is a small piece of the last chapters' loop-invariant code motion.)
- \`for (let i = ii; i < iEnd; i++)\` and \`for (let j = jj; j < jEnd; j++)\` visit every \`(i, j)\` in the tile.
- \`b[j * n + i] = a[i * n + j];\` is the untouched original body.
- \`return b;\` hands back the transposed grid.

On the 3 × 3 test with \`T = 2\` there are four tiles: 2 × 2 at the top left, 2 × 1 and 1 × 2 along the edges, and 1 × 1 at the corner; together they cover all nine elements exactly once.

**Common wrong attempts.**

- Running the inner loops to \`ii + T\` without \`Math.min\` works only when \`T\` divides \`n\`; otherwise it writes extra slots past the end of \`b\` (so the arrays no longer match) and reads \`undefined\` from past the end of \`a\`.
- Writing into \`a\` itself while reading it: a transpose in place needs care, which is why the exercise asks for a new array.`,
    wrong: [
      {
        code: `function transposeTiled(a, n, T) {
  const b = new Array(n * n);
  for (let ii = 0; ii < n; ii += T)
  for (let jj = 0; jj < n; jj += T)
  for (let i = ii; i < ii + T; i++)
  for (let j = jj; j < jj + T; j++)
    b[j * n + i] = a[i * n + j];
  return b;
}`,
        why: 'No `Math.min`: when `T` does not divide `n`, the edge tiles run past the grid, writing extra slots into `b`.',
      },
      {
        code: `function transposeTiled(a, n, T) {
  const b = new Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      b[j * n + i] = a[i * n + j];
    }
  }
  return b;
}`,
        why: 'Correct values, but not tiled: it has two loops, not four, so every write of `b` still walks down a whole column.',
      },
    ],
  },
  lruMisses: {
    optional: true,
    title: 'Count cache misses',
    prompt: 'Simulate a tiny cache. `addrs` is a list of element numbers in the order a loop touches them; a cache line holds `line` consecutive elements (element `e` is in line `Math.floor(e / line)`); the cache holds `cap` lines and, when full, throws out the line used least recently. Write `lruMisses(addrs, line, cap)` returning how many accesses missed (their line was not in the cache).',
    starter: `function lruMisses(addrs, line, cap) {
  // your code here
  return 0;
}

console.log(lruMisses(
  [0, 1, 2, 3, 4, 0], 4, 1));
// 3`,
    solution: `function lruMisses(addrs, line, cap) {
  const cache = []; // oldest first
  let misses = 0;
  for (const e of addrs) {
    const l = Math.floor(e / line);
    const k = cache.indexOf(l);
    if (k >= 0) {
      cache.splice(k, 1);
    } else {
      misses++;
      if (cache.length === cap) {
        cache.shift();
      }
    }
    cache.push(l);
  }
  return misses;
}`,
    tests: `test('one line of room', () => {
  expect(lruMisses([0, 1, 2, 3, 4, 0], 4, 1)).toBe(3);
});
test('two lines of room keeps the first line', () => {
  expect(lruMisses([0, 1, 2, 3, 4, 0], 4, 2)).toBe(2);
});
test('least recently used goes first, not first loaded', () => {
  expect(lruMisses([0, 4, 0, 8, 0], 4, 2)).toBe(3);
});
test('a column walk misses every time; tiles do not', () => {
  const n = 8;
  const col = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) col.push(j * n + i);
  const tiled = [];
  for (let ii = 0; ii < n; ii += 4) for (let jj = 0; jj < n; jj += 4)
    for (let i = ii; i < ii + 4; i++) for (let j = jj; j < jj + 4; j++) tiled.push(j * n + i);
  expect(lruMisses(col, 4, 4)).toBe(64);
  expect(lruMisses(tiled, 4, 4)).toBe(16);
});`,
    hints: [
      'Keep the cache as an array of line numbers, least recently used at the front.',
      'On a hit, move the line to the back (remove it, then push it). On a miss, count it, and if the cache is full remove the front line first.',
      'Either way, finish by pushing the line to the back: it is now the most recently used.',
    ],
    walkthrough: `**How to think about it.** A cache needs two answers for every access: is the line already there (hit or miss), and, if a new line must come in, which old one goes. "Least recently used" means the line whose last use is furthest in the past, so if you keep the lines in order of last use, the victim is always at the front. A hit does not add anything, but it does change the order: that line has just been used, so it moves to the back.

**The solution, line by line.**

- \`const cache = [];\` holds line numbers, oldest use first.
- \`let misses = 0;\` counts misses.
- \`for (const e of addrs) {\` takes each access in order, and \`const l = Math.floor(e / line);\` works out its line.
- \`const k = cache.indexOf(l);\` looks for the line; \`-1\` means it is not there.
- On a hit (\`k >= 0\`), \`cache.splice(k, 1);\` takes it out of its old place.
- On a miss, \`misses++;\` counts it, and if the cache is already full, \`cache.shift();\` throws out the front line, the least recently used.
- \`cache.push(l);\` puts the line at the back in both cases.
- \`return misses;\` hands back the count.

The last test is the chapter's diagram in code: an 8 × 8 transpose writing \`b\` down its columns, with lines of 4 and room for 4 lines, misses on all 64 writes, while the same writes in 4 × 4 tiles miss only 16 times, once per line per tile.

**Common wrong attempts.**

- Not moving a line to the back on a hit gives "first in, first out" instead of "least recently used"; the third test tells them apart.
- Counting each new element rather than each new line forgets that a whole line comes in at once.`,
    wrong: [
      {
        code: `function lruMisses(addrs, line, cap) {
  const cache = [];
  let misses = 0;
  for (const e of addrs) {
    const l = Math.floor(e / line);
    if (cache.includes(l)) continue;
    misses++;
    if (cache.length === cap) {
      cache.shift();
    }
    cache.push(l);
  }
  return misses;
}`,
        why: 'A hit leaves the line where it was, so this throws out the line loaded first, not the one used least recently.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `b[j * n + i] = a[i * n + j]` with `i` outside and `j` inside, which array is walked against its layout?',
    options: [
      {
        t: '`a`',
        why: '`a[i * n + j]` with `j` inside walks along a row: stride one.',
      },
      {
        t: '`b`',
        correct: true,
        why: '`b[j * n + i]` jumps `n` elements per step of `j`: down a column.',
      },
      {
        t: 'Neither',
        why: 'One of them must go down a column: that is what a transpose is.',
      },
    ],
  },
  {
    q: 'Tiling turns a two-deep nest into how many loops?',
    options: [
      {
        t: 'Two, with a bigger step',
        why: 'That would skip iterations; tiling keeps every iteration.',
      },
      {
        t: 'Three',
        why: 'Each of the two loops is split into two.',
      },
      {
        t: 'Four: two that pick a tile and two that walk inside it',
        correct: true,
        why: 'Strip-mine both loops, then move the chunk loops outside.',
      },
      {
        t: 'One',
        why: 'That would be flattening, a different transformation.',
      },
    ],
  },
  {
    q: 'A nest has a dependence with direction `(<, >)`. Can it be tiled as it stands?',
    options: [
      {
        t: 'Yes: tiling is always legal',
        why: 'Only strip-mining is always legal; tiling also interchanges.',
      },
      {
        t: 'No: tiling includes an interchange, and `(<, >)` cannot be interchanged',
        correct: true,
        why: 'The loops are not fully permutable. (A compiler could first skew the nest, the subject of the next chapter.)',
      },
      {
        t: 'Only with tiles of size 1',
        why: 'Tiles of 1 are the original order; the point is that bigger tiles break the dependence.',
      },
    ],
  },
  {
    q: 'In this chapter’s run, why was a tile size of 128 slower than 32?',
    options: [
      {
        t: 'Because 128 does not divide 2048',
        why: 'It does: 2048 = 16 × 128.',
      },
      {
        t: 'Because bigger tiles do more arithmetic',
        why: 'Every size does the same 2048 × 2048 copies.',
      },
      {
        t: 'Because a 128 × 128 tile’s data no longer stays in the cache until the tile is done',
        correct: true,
        why: 'Past a point, a tile is as big as the problem it was meant to shrink.',
      },
    ],
  },
  {
    q: 'How does Viscosity’s AoSoA layout relate to tiling?',
    options: [
      {
        t: 'It tiles the data: blocks of B elements, each field’s B values together',
        correct: true,
        why: 'The index `(i >> 3) * 16 + field + (i & 7)` names a block and a place within it.',
      },
      {
        t: 'It tiles every loop that reads the collection',
        why: 'Viscosity keeps loops as written; only the layout changes.',
      },
      {
        t: 'It is chosen automatically whenever a loop is nested',
        why: 'Automatic mode chooses struct of arrays; AoSoA needs an annotation.',
      },
    ],
  },
];
