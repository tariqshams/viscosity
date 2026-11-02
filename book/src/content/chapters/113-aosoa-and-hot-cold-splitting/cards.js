// Chapter 71 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 113, 113.

export const prompts = {
  'ao-block-size': {
    q: 'What does the block size B of an AoSoA layout say?',
    a: 'How many elements one block holds. Each block stores B values of each field.',
  },
  'ao-slot': {
    q: 'With F = 3 and B = 8, which slot holds field 1 of element 10?',
    a: '(10 >> 3) × 24 + 1 × 8 + (10 & 7) = 24 + 8 + 2 = 34.',
  },
  'ao-pow2': {
    q: 'Why must Viscosity’s AoSoA block size be a power of two?',
    a: 'So the block and lane are a shift and a mask (`i >> s`, `i & (B-1)`) instead of a division and a remainder; with 6 there are no bits to read off.',
  },
  'ao-cap-blocks': {
    q: 'Why does the AoSoA container round its capacity up with `Math.ceil(cap / 8) * 8`?',
    a: 'So the array always holds whole blocks; doubling keeps it a multiple of 8.',
  },
  'ao-one-copy': {
    q: 'Why can AoSoA’s `grow()` copy everything with a single `set`?',
    a: 'Blocks don’t move when capacity grows: the new array is the old blocks followed by empty ones.',
  },
  'ao-helper': {
    q: 'When does the emitter call `__vsc_aosoa(...)` instead of writing the formula inline?',
    a: 'When the index isn’t a simple name or literal (for example wrapped in a bounds check), so it is evaluated only once.',
  },
  'ao-numeric': {
    q: 'Why does Viscosity refuse `aosoa` when a field may hold a string?',
    a: 'All fields share one `Float64Array`, which can only store numbers.',
  },
  'ao-why-not-auto': {
    q: 'Why does Viscosity’s cost model never choose AoSoA by itself?',
    a: 'In this book’s V8 measurements it rarely beat SoA, even with a hand-written block-by-block loop, and was slower at small sizes.',
  },
  'hc-why': {
    q: 'What does a hot loop gain from a hot/cold split?',
    a: 'Its cache lines carry only the fields it uses, not the cold ones.',
  },
  'hc-price': {
    q: 'What is the cost of a hot/cold split?',
    a: 'Code that needs a whole record must look in two places.',
  },
  'hc-affinity': {
    q: 'What does field affinity measure?',
    a: 'Which fields are used together (for example, by the same loop).',
  },
  'hc-hotness': {
    q: 'How do hotness and affinity differ?',
    a: 'Hotness counts uses of one field; affinity counts uses of a pair of fields together.',
  },
  'hc-weight': {
    q: 'Why weight each loop by how often it runs?',
    a: 'A loop that runs once a game shouldn’t count as much as one that runs every frame.',
  },
  'hc-zero': {
    q: 'In the diagram, why is the affinity of `vx` and `name` 0?',
    a: 'No loop uses both of them.',
  },
  'hc-packed': {
    q: 'Packed AoS has no headers or pointers. Why is it still slower than SoA at summing one field of six?',
    a: 'Its cache lines still carry the five unused fields; SoA’s carry only the one being summed.',
  },
  'hc-viscosity': {
    q: 'Does Viscosity build a separate hot struct and cold struct?',
    a: 'No. Every field gets its own column, the finest possible split.',
  },
  'hc-policy': {
    q: 'What decides whether a Viscosity column is a `Float64Array` or a plain array?',
    a: 'Whether the field is proven to always hold numbers.',
  },
  'hc-tag-hot': {
    q: 'In `mixed_columns.js`, `tag` is read in the hottest loop. Why is it still a plain array column?',
    a: 'It holds `null` or an object, which a `Float64Array` can’t store. The choice is by type, not heat.',
  },
};

export const examples = {
  'aosoa-push': {
    title: 'A tiny AoSoA store (F = 2, B = 4)',
    code: `const F = 2, B = 4, S = 2;
const data = new Float64Array(16);
function slot(i, k) {
  return (i >> S) * F * B + k * B
    + (i & (B - 1));
}
for (let i = 0; i < 8; i++) {
  data[slot(i, 0)] = i;      // x
  data[slot(i, 1)] = 10 * i; // y
}
console.log(slot(5, 1));
console.log(data.join(' '));`,
  },
  affinity: {
    title: 'Hotness and affinity, counted',
    code: `const loops = [
  { runs: 1000,
    fields: ['x', 'y', 'vx', 'vy'] },
  { runs: 100,
    fields: ['x', 'health'] },
  { runs: 1,
    fields: ['health', 'name'] },
];
function hot(f) {
  let n = 0;
  for (const l of loops)
    if (l.fields.includes(f))
      n += l.runs;
  return n;
}
function aff(f, g) {
  let n = 0;
  for (const l of loops)
    if (l.fields.includes(f) &&
        l.fields.includes(g))
      n += l.runs;
  return n;
}
console.log(hot('x'), hot('name'));
console.log(aff('x', 'health'));`,
  },
};

export const exercises = {
  aosoaSlot: {
    title: 'An AoSoA index function',
    prompt: 'Write `slot(i, k, F, B)`: the index in the shared `Float64Array` of field `k` of element `i`, for `F` fields in blocks of `B`. Use a shift and a mask, like Viscosity. Refuse what Viscosity refuses: if `B` is not a power of two of at least 2, throw an error.',
    starter: `function slot(i, k, F, B) {
  // your code here
  return 0;
}

console.log(slot(10, 1, 3, 8));`,
    solution: `function slot(i, k, F, B) {
  if (!(B >= 2 && (B & (B - 1)) === 0))
    throw new Error('bad block size');
  const sh = Math.log2(B);
  return (i >> sh) * F * B + k * B
    + (i & (B - 1));
}`,
    tests: `test('element 10, field y, F = 3, B = 8', () => {
  expect(slot(10, 1, 3, 8)).toBe(34);
});
test('the first block', () => {
  expect(slot(0, 0, 3, 8)).toBe(0);
  expect(slot(7, 2, 3, 8)).toBe(23);
});
test('element 8 starts block 1', () => {
  expect(slot(8, 0, 3, 8)).toBe(24);
});
test('blocks of 4, two fields', () => {
  expect(slot(5, 1, 2, 4)).toBe(13);
});
test('B = 1 is refused, like aosoa(1)', () => {
  expect(() => slot(5, 2, 3, 1)).toThrow();
});
test('B = 6 is refused', () => {
  expect(() => slot(1, 0, 3, 6)).toThrow();
});`,
    hints: [
      'Work out the three parts separately: where the block starts, where the field starts inside the block, and the lane.',
      'Block number: `i >> Math.log2(B)`; a block is `F * B` slots long. Inside it, field `k` starts at `k * B`. Lane: `i & (B - 1)`.',
      'A power of two has exactly one bit set, so `(B & (B - 1)) === 0` exactly when B is a power of two (for B > 0). Check `B >= 2` too, and throw before doing any arithmetic.',
    ],
    walkthrough: `**How to think about it.** This is the formula the emitter writes, with F and B as parameters instead of numbers baked in. Before writing code, do one case by hand, the one from the diagram: element 10, field 1 (y), three fields, blocks of 8. Block \`10 >> 3 = 1\`, and each block is \`3 * 8 = 24\` slots, so block 1 starts at 24; field 1 starts \`1 * 8 = 8\` slots into the block, at 32; the lane is \`10 & 7 = 2\`, so the answer is 34. Now turn each of those three steps into an expression, and add the check first, so that a bad B never reaches the arithmetic.

**The solution, line by line.**

- \`function slot(i, k, F, B) {\` takes the element, the field number, the number of fields and the block size.
- \`  if (!(B >= 2 && (B & (B - 1)) === 0))\` asks "is B at least 2 and a power of two?" and goes on only if the answer is no. \`B - 1\` flips the lowest set bit of B and every bit below it, so \`B & (B - 1)\` clears that lowest set bit; the result is 0 exactly when B had a single bit set. For 8 (\`1000\`) it is \`1000 & 0111 = 0\`; for 6 (\`110\`) it is \`110 & 101 = 100\`, which is not 0.
- \`    throw new Error('bad block size');\` refuses, as Viscosity's planner does for \`aosoa(6)\` and \`aosoa(1)\`.
- \`  const sh = Math.log2(B);\` is the shift: 3 for B = 8, 2 for B = 4. Because B passed the check, this is a whole number.
- \`  return (i >> sh) * F * B + k * B\` is the start of the block (block number times the slots per block) plus the start of field k inside it.
- \`    + (i & (B - 1));\` adds the lane: the low \`sh\` bits of i, which is \`i % B\`.
- \`}\` closes the function.

Check it against the tests: \`slot(5, 1, 2, 4)\` is block \`5 >> 2 = 1\`, starting at \`1 * 2 * 4 = 8\`, plus field offset \`1 * 4 = 4\`, plus lane \`5 & 3 = 1\`: 13.

**Common wrong attempts.**

- Adding \`k\` instead of \`k * B\` treats a block as if fields were interleaved; each field owns B slots per block, so field 1 starts B slots in, not 1.
- \`i * F + k\` is the packed AoS index (what B = 1 would give). In AoSoA, neighbouring elements' values of one field are neighbours in memory, which this formula never produces.
- \`Math.floor(i / B)\` and \`i % B\` give the right numbers, but without the check they accept B = 6. Worse, with the shift, \`Math.log2(6)\` is 2.58..., and \`i >> 2.58\` silently shifts by 2, giving blocks of 4: wrong answers with no error. That is why Viscosity refuses such a block size up front.`,
    wrong: [
      {
        code: `function slot(i, k, F, B) {
  const sh = Math.log2(B);
  return (i >> sh) * F * B + k
    + (i & (B - 1));
}`,
        why: 'The field offset inside a block is `k * B`, not `k`: each field has B slots. (It also accepts B = 6.)',
      },
      {
        code: `function slot(i, k, F, B) {
  return i * F + k;
}`,
        why: 'That is the packed AoS index. In AoSoA, neighbouring elements’ values of one field are adjacent.',
      },
      {
        code: `function slot(i, k, F, B) {
  const blk = Math.floor(i / B);
  return blk * F * B + k * B + i % B;
}`,
        why: 'The arithmetic is right, but it accepts B = 6 and B = 1. Viscosity refuses block sizes that are not powers of two of at least 2; so must you.',
      },
    ],
  },
  blockSum: {
    optional: true,
    title: 'Loop over blocks, not elements',
    prompt: 'The generated code works out a block and lane for every access. A hand-written loop (like the benchmark’s `aosoa8` kernels) can avoid that. Write `blockSum(data, n, k, F, B)`: the sum of field `k` over the first `n` elements, looping over blocks and then lanes. Careful: the last block may be only partly used, and its spare slots may hold anything.',
    starter: `function blockSum(data, n, k, F, B) {
  // your code here
  return 0;
}`,
    solution: `function blockSum(data, n, k, F, B) {
  let s = 0;
  for (let b = 0; b * B < n; b++) {
    const base = b * F * B + k * B;
    const m = Math.min(B, n - b * B);
    for (let l = 0; l < m; l++)
      s += data[base + l];
  }
  return s;
}`,
    tests: `function build(n, F, B) {
  const cap = Math.ceil(n / B) * B;
  const d = new Float64Array(cap * F).fill(1000);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < F; k++)
      d[Math.floor(i / B) * F * B + k * B + (i % B)] = i * 10 + k;
  return d;
}
test('whole blocks', () => {
  expect(blockSum(build(16, 3, 8), 16, 1, 3, 8)).toBe(1216);
});
test('a partial last block', () => {
  expect(blockSum(build(10, 3, 8), 10, 0, 3, 8)).toBe(450);
});
test('fewer elements than a block', () => {
  expect(blockSum(build(3, 2, 4), 3, 1, 2, 4)).toBe(33);
});
test('empty', () => {
  expect(blockSum(build(0, 2, 4), 0, 0, 2, 4)).toBe(0);
});`,
    hints: [
      'Two loops: an outer one over blocks, an inner one over the lanes of a block.',
      'Field k of block b starts at `b * F * B + k * B`, and its B values are consecutive. The outer loop runs while `b * B < n`.',
      'In the last block only `n - b * B` lanes are real: loop to `Math.min(B, n - b * B)`, never to B.',
    ],
    walkthrough: `**How to think about it.** Inside a block, field k is a run of B consecutive doubles, so once you know where that run starts, the inner loop is a plain scan, just like a SoA column. The block arithmetic then happens once per block instead of once per element. The trap is the end: capacity is whole blocks, so slots past \`n\` exist and hold whatever was there (the tests fill them with 1000 to make the bug visible).

**The solution, line by line.**

- \`let s = 0;\` is the running sum.
- \`for (let b = 0; b * B < n; b++) {\` visits each block that holds at least one real element: for n = 10 and B = 8 that is blocks 0 and 1.
- \`const base = b * F * B + k * B;\` is the slot of field k's first lane in block b.
- \`const m = Math.min(B, n - b * B);\` is how many lanes of this block are real: 8 for block 0, but only \`10 - 8 = 2\` for block 1.
- \`for (let l = 0; l < m; l++) s += data[base + l];\` adds those lanes, one after another in memory.
- \`return s;\` after the outer loop.

**Common wrong attempts.**

- Looping \`l < B\` in every block adds the spare slots of a partly used last block. This is the AoSoA version of the rule from *Growing collections*: compare with the length, never with the capacity.
- Looping \`b * B <= n\` visits one block too many when n is a multiple of B.

Viscosity's emitter does not restructure loops this way: it rewrites each access in place, which is far simpler to prove correct, and which is why its AoSoA code can only be slower than this loop.`,
    wrong: [
      {
        code: `function blockSum(data, n, k, F, B) {
  let s = 0;
  for (let b = 0; b * B < n; b++) {
    const base = b * F * B + k * B;
    for (let l = 0; l < B; l++)
      s += data[base + l];
  }
  return s;
}`,
        why: 'This always sums B lanes, including the spare slots of a partly used last block.',
      },
    ],
  },
  coAccess: {
    title: 'Count co-access',
    prompt: 'Each loop is `{ runs, fields }`. Write `coAccess(loops)`: an object whose keys are pairs of field names, sorted alphabetically and joined with `+` (like `\'vx+x\'`), and whose values are the total `runs` of the loops that use both fields. Leave out pairs that are never used together.',
    starter: `function coAccess(loops) {
  const aff = {};
  // your code here
  return aff;
}

const loops = [
  { runs: 1000,
    fields: ['x', 'y', 'vx', 'vy'] },
  { runs: 100,
    fields: ['x', 'health'] },
  { runs: 1,
    fields: ['health', 'name'] },
];
console.log(coAccess(loops));`,
    solution: `function coAccess(loops) {
  const aff = {};
  for (const l of loops) {
    const fs = [...l.fields].sort();
    const n = fs.length;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const k = fs[a] + '+' + fs[b];
        aff[k] = (aff[k] ?? 0) + l.runs;
      }
    }
  }
  return aff;
}`,
    tests: `const loops = [
  { runs: 1000,
    fields: ['x', 'y', 'vx', 'vy'] },
  { runs: 100,
    fields: ['x', 'health'] },
  { runs: 1,
    fields: ['health', 'name'] },
];
test('pairs inside the move loop', () => {
  const a = coAccess(loops);
  expect(a['vx+x']).toBe(1000);
  expect(a['vy+y']).toBe(1000);
});
test('weighted by runs', () => {
  const a = coAccess(loops);
  expect(a['health+x']).toBe(100);
  expect(a['health+name']).toBe(1);
});
test('never together: no key', () => {
  expect(coAccess(loops)['name+vx']).toBe(undefined);
});
test('order in the loop does not matter', () => {
  const a = coAccess([
    { runs: 5, fields: ['x', 'hp'] },
    { runs: 2, fields: ['hp', 'x'] },
  ]);
  expect(a).toEqual({ 'hp+x': 7 });
});
test('eight pairs in all', () => {
  expect(Object.keys(coAccess(loops)).length).toBe(8);
});`,
    hints: [
      'For each loop, look at every pair of its fields: two nested loops, the inner one starting after the outer.',
      'Sort a copy of the fields first, so that the same pair always gets the same key.',
      'Add `l.runs`, not 1: `aff[k] = (aff[k] ?? 0) + l.runs`.',
    ],
    walkthrough: `**How to think about it.** Affinity is a sum over loops, so the outer structure is "for each loop, add its runs to every pair of fields it uses". Two questions remain: how to visit every pair of a loop's fields exactly once, and how to name a pair so that \`x\` with \`hp\` and \`hp\` with \`x\` land on the same key. Try the first loop of the example by hand: fields \`x, y, vx, vy\` give six pairs (four fields choose two), each worth 1000.

**The solution, line by line.**

- \`const aff = {};\` is the result: one key per pair.
- \`for (const l of loops) {\` visits each loop.
- \`const fs = [...l.fields].sort();\` copies the field list (so the caller's array is not reordered) and sorts it, so a pair always comes out in alphabetical order: \`hp\` before \`x\`.
- \`const n = fs.length;\` and the two loops \`for (let a = 0; a < n; a++)\` and \`for (let b = a + 1; b < n; b++)\` visit each unordered pair once: \`b\` starts after \`a\`, so a field is never paired with itself and no pair is seen twice.
- \`const k = fs[a] + '+' + fs[b];\` builds the key, such as \`'vx+x'\`.
- \`aff[k] = (aff[k] ?? 0) + l.runs;\` adds the loop's run count; \`?? 0\` starts a missing key at 0.
- \`return aff;\` after both loops.

The example gives 6 pairs from \`move\`, 1 from \`damage\` and 1 from \`report\`: 8 keys, and pairs never used together, such as \`name+vx\`, never get a key at all.

**Common wrong attempts.**

- Skipping the sort makes \`x+hp\` and \`hp+x\` two keys for one pair, so the counts are split between them.
- Adding \`1\` instead of \`l.runs\` counts loops, not runs: the once-a-game report then weighs as much as the per-frame movement loop.
- Starting the inner loop at \`b = 0\` counts every pair twice and pairs each field with itself.

In a real compiler, the per-loop field lists come from an access-pattern analysis like Viscosity's, and the runs from loop trip counts or from a profile.`,
    wrong: [
      {
        code: `function coAccess(loops) {
  const aff = {};
  for (const l of loops) {
    const fs = l.fields;
    const n = fs.length;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const k = fs[a] + '+' + fs[b];
        aff[k] = (aff[k] ?? 0) + l.runs;
      }
    }
  }
  return aff;
}`,
        why: 'Without sorting, `x+hp` and `hp+x` become two different keys for the same pair.',
      },
      {
        code: `function coAccess(loops) {
  const aff = {};
  for (const l of loops) {
    const fs = [...l.fields].sort();
    const n = fs.length;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const k = fs[a] + '+' + fs[b];
        aff[k] = (aff[k] ?? 0) + 1;
      }
    }
  }
  return aff;
}`,
        why: 'This counts loops, not runs. The per-frame loop and the once-only loop end up with the same weight.',
      },
    ],
  },
  groupFields: {
    optional: true,
    title: 'Group fields by affinity',
    prompt: 'Write `groupFields(fields, aff, t)`. Two fields belong to the same group if their affinity (from `coAccess`) is at least `t`, or if they are linked through other fields that way. Return the groups as arrays, in the order of `fields`, each group’s members also in that order.',
    starter: `function groupFields(fields, aff, t) {
  // your code here
  return [fields];
}`,
    solution: `function groupFields(fields, aff, t) {
  const g = {};
  for (const f of fields) g[f] = f;
  const find = (f) =>
    g[f] === f ? f : find(g[f]);
  for (const k in aff) {
    if (aff[k] < t) continue;
    const [a, b] = k.split('+');
    g[find(a)] = find(b);
  }
  const out = new Map();
  for (const f of fields) {
    const r = find(f);
    if (!out.has(r)) out.set(r, []);
    out.get(r).push(f);
  }
  return [...out.values()];
}`,
    tests: `const fs = ['x', 'y', 'vx', 'vy', 'health', 'name'];
const aff = {
  'vx+vy': 1000, 'vx+x': 1000, 'vx+y': 1000, 'vy+x': 1000,
  'vy+y': 1000, 'x+y': 1000, 'health+x': 100, 'health+name': 1,
};
test('hot, warm, cold', () => {
  expect(groupFields(fs, aff, 500)).toEqual(
    [['x', 'y', 'vx', 'vy'], ['health'], ['name']]);
});
test('a lower threshold pulls health in', () => {
  expect(groupFields(fs, aff, 50)).toEqual(
    [['x', 'y', 'vx', 'vy', 'health'], ['name']]);
});
test('threshold 1: one group', () => {
  expect(groupFields(fs, aff, 1)).toEqual([fs]);
});
test('a later field links two groups', () => {
  const g = groupFields(['a', 'b', 'c'],
    { 'a+c': 5, 'b+c': 5 }, 5);
  expect(g).toEqual([['a', 'b', 'c']]);
});
test('a high threshold: every field alone', () => {
  expect(groupFields(fs, aff, 5000)).toEqual(fs.map((f) => [f]));
});`,
    hints: [
      'Start with every field in its own group: `g[f] = f` means “f leads its own group”.',
      'For each pair with affinity ≥ t, find the leader of each field and make one point to the other.',
      'At the end, collect fields by their leader with a Map, which keeps insertion order.',
    ],
    walkthrough: `**How to think about it.** Groups that can be joined through a chain of strong pairs are a classic job for a small **union-find**: each field points at another field of its group, following the pointers ends at the group's leader, and joining two groups is one assignment.

**The solution, in order.** \`g[f] = f\` makes every field the leader of its own group. \`find\` follows pointers until it reaches a field that points at itself. For each pair with affinity at least \`t\`, \`g[find(a)] = find(b)\` points one leader at the other, merging the groups. Finally a \`Map\` collects the fields by leader; a Map keeps insertion order, and we insert in the order of \`fields\`, so the groups come out in the order the tests want.

This is a tiny union-find. \`g\` maps each field to another field in its group, and following the links (\`find\`) ends at the group’s leader. Merging two groups is one assignment: point one leader at the other.

Linking matters: \`health\` and \`y\` are never used together, but at threshold 50 \`health\` joins via \`x\`. That is usually what you want, because a group is one storage unit, and \`x\` can only live in one.

The threshold is the knob. Lower it and groups grow until everything is one record (AoS). Raise it and every field stands alone (SoA). Hot/cold splitting lives in between, and Viscosity sits at the SoA end.`,
    wrong: [
      {
        code: `function groupFields(fields, aff, t) {
  const out = [];
  for (const f of fields) {
    const gr = out.find((g) => g.some(
      (h) => (aff[[f, h].sort()
        .join('+')] ?? 0) >= t));
    if (gr) gr.push(f);
    else out.push([f]);
  }
  return out;
}`,
        why: 'This joins a field to the first group it is linked to, but never merges two existing groups that a later field links together.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Three fields, blocks of 8. Where does block 2 start?',
    options: [
      {
        t: 'Slot 16',
        why: 'That would be 2 × 8, forgetting that each block holds all three fields.',
      },
      {
        t: 'Slot 6',
        why: 'That is 2 × 3, the packed AoS stride.',
      },
      {
        t: 'Slot 48',
        correct: true,
        why: 'Each block is F × B = 24 slots, so block 2 starts at 2 × 24.',
      },
      {
        t: 'Slot 24',
        why: 'That is where block 1 starts.',
      },
    ],
  },
  {
    q: 'What does Viscosity do with `// @viscosity aosoa(6)`?',
    options: [
      {
        t: 'Uses blocks of 6 with division and remainder.',
        why: 'The emitter only generates shifts and masks.',
      },
      {
        t: 'Rounds up to blocks of 8.',
        why: 'It doesn’t adjust the block size silently.',
      },
      {
        t: 'Falls back to SoA with an explanation.',
        why: 'It falls back to an array of objects, not SoA.',
      },
      {
        t: 'Keeps an array of objects: “the block size must be a power of two (2, 4, 8, 16, ...)”.',
        correct: true,
        why: 'The planner checks the block size and keeps the collection with a reason, so the compile goes on.',
      },
      {
        t: 'Stops the compile with an error.',
        why: 'It used to, from the emitter; now the planner refuses it first and the compile goes on.',
      },
    ],
  },
  {
    q: 'The AoSoA container grows from 16 to 32 elements. What does `grow()` do?',
    options: [
      {
        t: 'Moves each field’s values to new positions.',
        why: 'Blocks are self-contained, so the existing ones keep their positions.',
      },
      {
        t: 'Allocates one array twice the size and copies the old one into its start.',
        correct: true,
        why: 'The old blocks stay where they were; new empty blocks follow.',
      },
      {
        t: 'Allocates one new array per field.',
        why: 'That is SoA’s growth. AoSoA has a single `data` array.',
      },
      {
        t: 'Appends 16 elements to the existing Float64Array.',
        why: 'A Float64Array can’t grow in place.',
      },
    ],
  },
  {
    q: 'You annotate a collection whose records have a `name` string with `aosoa(8)`. What happens?',
    options: [
      {
        t: 'name gets a plain array column, the rest go in blocks.',
        why: 'That mixing is what SoA does; AoSoA has no plain columns.',
      },
      {
        t: 'The strings are stored as NaN.',
        why: 'Viscosity never changes values; it refuses instead.',
      },
      {
        t: 'It stays an array of objects: “annotated aosoa, but fields name may hold non-numbers”.',
        correct: true,
        why: 'One shared Float64Array can only hold numbers.',
      },
      {
        t: 'The compiler crashes.',
        why: 'This case gets a proper explanation in explain, as a bad block size does.',
      },
    ],
  },
  {
    q: 'What did this book’s V8 measurements show about AoSoA with blocks of 8?',
    options: [
      {
        t: 'It was the fastest layout at every size.',
        why: 'Plain SoA beat it in the update and random-access suites.',
      },
      {
        t: 'It was rarely better than SoA, and often slower than objects at 1,000 elements.',
        correct: true,
        why: 'With no SIMD lanes to fill, blocks bought little that plain columns did not already give, and at small sizes the extra work cost more than it saved.',
      },
      {
        t: 'It was identical to SoA.',
        why: 'It was measurably slower in most suites.',
      },
      {
        t: 'It wasn’t measured.',
        why: 'The `aosoa8` layout is in every suite of the benchmark run.',
      },
    ],
  },
  {
    q: 'A movement loop reads `x`, `y`, `vx`, `vy` of every entity; `health` and `name` are read once per game. What does a hot/cold split do?',
    options: [
      {
        t: 'Deletes the cold fields.',
        why: 'They are still needed, just rarely. They move, they don’t vanish.',
      },
      {
        t: 'Stores the four movement fields together and the other two separately, indexed by the same i.',
        correct: true,
        why: 'The hot loop then loads only hot data.',
      },
      {
        t: 'Makes every field a Float64Array.',
        why: 'That is about representation; `name` is a string and can’t be one.',
      },
      {
        t: 'Reorders the loops.',
        why: 'The split changes the data layout, not the code order.',
      },
    ],
  },
  {
    q: 'Loop A (runs 500 times) uses x and vx. Loop B (runs 20 times) uses x and hp. Loop C (runs 20 times) uses vx and x. What is the affinity of x and vx?',
    options: [
      {
        t: '2',
        why: 'That counts loops, not runs.',
      },
      {
        t: '540',
        why: 'Loop B doesn’t use vx.',
      },
      {
        t: '500',
        why: 'Loop C uses both too.',
      },
      {
        t: '520',
        correct: true,
        why: 'Loops A and C both use x and vx: 500 + 20.',
      },
    ],
  },
  {
    q: 'How does Viscosity split fields?',
    options: [
      {
        t: 'Into a hot struct of arrays and a cold array of objects, by profile.',
        why: 'There is no separate cold struct in the engine.',
      },
      {
        t: 'It groups fields by affinity into blocks.',
        why: 'Its access analysis records which fields each loop touches, but nothing groups them.',
      },
      {
        t: 'Every field gets its own column: typed if proven numeric, a plain array otherwise.',
        correct: true,
        why: 'That is the per-field policy in analysis.ts and plan.ts.',
      },
      {
        t: 'It never splits fields.',
        why: 'SoA is a split: each field is its own column.',
      },
    ],
  },
  {
    q: 'Why is SoA called the finest possible hot/cold split?',
    options: [
      {
        t: 'Because it only works for hot fields.',
        why: 'SoA stores every field, hot or cold.',
      },
      {
        t: 'Because it sorts fields by hotness.',
        why: 'Column order doesn’t matter in SoA; each column is separate.',
      },
      {
        t: 'Because it always runs fastest.',
        why: 'It does not: *When SoA loses: materialization and AoSoA* showed it losing badly.',
      },
      {
        t: 'Because each field is its own group, so a loop loads exactly the fields it touches.',
        correct: true,
        why: 'There is nothing left to split.',
      },
    ],
  },
  {
    q: 'Where would field affinity matter most for a layout?',
    options: [
      {
        t: 'When each field already has its own column.',
        why: 'Then a loop only loads what it uses; grouping has no effect.',
      },
      {
        t: 'When several fields share one array, as in packed AoS or AoSoA blocks.',
        correct: true,
        why: 'Then the grouping decides what each cache line carries.',
      },
      {
        t: 'Only for string fields.',
        why: 'Affinity is about access, not type.',
      },
      {
        t: 'Only in loops that run once.',
        why: 'Rare loops barely count; affinity is dominated by the frequent ones.',
      },
    ],
  },
];
