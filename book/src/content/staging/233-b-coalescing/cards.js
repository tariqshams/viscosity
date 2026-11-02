// Chapter 233-b cards (staged split of chapter 233): recall prompts,
// examples, exercises and quiz. Keys are stable ids.
// The LLVM listing is llc 18.1.3 -O2 -print-after=register-coalescer.

export const prompts = {
  'coalesce-what': {
    q: 'What is **coalescing**?',
    a: 'Merging the source and destination of a copy (which do not interfere) into one node, so they share a register and the copy is deleted.',
  },
  'why-possible': {
    q: 'Why can the two ends of a copy usually be merged at all?',
    a: 'The copy rule adds no edge between a copy’s source and destination, so unless something else joins them, they do not interfere.',
  },
  'merged-neighbours': {
    q: 'What are the neighbours of a merged node?',
    a: 'All the neighbours of both of the nodes that were merged.',
  },
  'aggressive-risk': {
    q: 'What can go wrong with **aggressive** coalescing?',
    a: 'The merged node has the neighbours of both, so a colourable graph can become one that needs a spill; a spill costs far more than the copy saved.',
  },
  'insignificant': {
    q: 'Why can a neighbour of degree less than k never block a colouring?',
    a: 'Simplify will remove it anyway, whatever else happens.',
  },
  'briggs-test': {
    q: 'State the **Briggs test** for merging a and b.',
    a: 'Merge only if the merged node would have fewer than k neighbours of degree k or more.',
  },
  'george-test': {
    q: 'State the **George test** for merging a into b.',
    a: 'Merge if every neighbour of a either already interferes with b or has degree less than k.',
  },
  'george-one-sided': {
    q: 'Why is the George test useful when b has a great many neighbours, like a fixed register?',
    a: 'It only looks at a’s neighbours, so b’s size does not matter, while the Briggs test would count b’s many neighbours.',
  },
};

export const examples = {
  coalesce: {
    title: 'Coalescing sumsq with the Briggs test',
    code: `// g maps each value to its neighbours;
// a and b do not interfere.
// Briggs: the merged node has fewer
// than k neighbours of degree >= k.
function briggs(g, a, b, k) {
  const nb = new Set(g[a].concat(g[b]));
  let big = 0;
  for (const t of nb) {
    let d = g[t].length;
    // t next to both: after merging,
    // it loses one neighbour.
    const both = g[t].includes(a) &&
      g[t].includes(b);
    if (both) d -= 1;
    if (d >= k) big += 1;
  }
  return big < k;
}
// George: every neighbour of a already
// touches b, or has degree < k.
function george(g, a, b, k) {
  return g[a].every((t) =>
    g[t].includes(b) ||
    g[t].length < k);
}

function graph(edges) {
  const g = {};
  for (const e of edges.split(' ')) {
    const [a, b] = e.split('-');
    (g[a] = g[a] || []).push(b);
    (g[b] = g[b] || []).push(a);
  }
  return g;
}
// Merge a and b into one node a+b.
function merge(g, a, b) {
  const m = a + '+' + b;
  const ren = (w) =>
    w === a || w === b ? m : w;
  const h = {};
  for (const v in g) {
    if (v === a || v === b) continue;
    h[v] = [...new Set(g[v].map(ren))];
  }
  const both = g[a].concat(g[b]);
  h[m] = [...new Set(both)];
  return h;
}

let g = graph('i0-n i0-s0 i0-s1 ' +
  'i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 ' +
  'i2-s2 n-s0 n-s1 n-s2 n-t s1-t');
const moves = [['s0', 's1'],
  ['i0', 'i1'], ['s1', 's2'],
  ['i1', 'i2']];
const now = {}; // old name -> merged
const find = (v) =>
  now[v] ? find(now[v]) : v;
for (const [x, y] of moves) {
  const a = find(x);
  const b = find(y);
  const ok = !g[a].includes(b) &&
    briggs(g, a, b, 4);
  const say = ok ? 'merge' : 'keep';
  console.log(a, '+', b, say);
  if (ok) {
    g = merge(g, a, b);
    now[a] = a + '+' + b;
    now[b] = a + '+' + b;
  }
}
console.log(Object.keys(g));`,
  },
};

export const exercises = {
  tests: {
    title: 'The Briggs and George tests',
    prompt:
      'Write `briggs(g, a, b, k)` and `george(g, a, b, k)`. `g` maps each value to the array of its neighbours; `a` and `b` are the two ends of a copy and do not interfere; `k` is the number of registers. `briggs` returns `true` if the merged node would have **fewer than k** neighbours of degree at least `k`, counting each neighbour’s degree *after* the merge (a neighbour of both `a` and `b` loses one). `george` returns `true` if **every** neighbour of `a` is already a neighbour of `b` or has degree less than `k`. The starters always say yes, which is aggressive coalescing.',
    starter: `// g maps each value to its neighbours;
// a and b do not interfere.
// Briggs: the merged node has fewer
// than k neighbours of degree >= k.
function briggs(g, a, b, k) {
  return true; // aggressive: always
}
// George: every neighbour of a already
// touches b, or has degree < k.
function george(g, a, b, k) {
  return true; // aggressive: always
}`,
    solution: `// g maps each value to its neighbours;
// a and b do not interfere.
// Briggs: the merged node has fewer
// than k neighbours of degree >= k.
function briggs(g, a, b, k) {
  const nb = new Set(g[a].concat(g[b]));
  let big = 0;
  for (const t of nb) {
    let d = g[t].length;
    // t next to both: after merging,
    // it loses one neighbour.
    const both = g[t].includes(a) &&
      g[t].includes(b);
    if (both) d -= 1;
    if (d >= k) big += 1;
  }
  return big < k;
}
// George: every neighbour of a already
// touches b, or has degree < k.
function george(g, a, b, k) {
  return g[a].every((t) =>
    g[t].includes(b) ||
    g[t].length < k);
}`,
    tests: `function graph(edges) {
  const g = {};
  for (const e of edges.split(' ')) {
    const [a, b] = e.split('-');
    (g[a] = g[a] || []).push(b);
    (g[b] = g[b] || []).push(a);
  }
  return g;
}
const sumsq = graph('i0-n i0-s0 i0-s1 ' +
  'i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 ' +
  'i2-s2 n-s0 n-s1 n-s2 n-t s1-t');
test('a merge that would need 3 colours', () => {
  const g = graph('a-x b-y x-y');
  expect(briggs(g, 'a', 'b', 2)).toBe(false);
  expect(george(g, 'a', 'b', 2)).toBe(false);
});
test('neighbours of degree < k are harmless', () => {
  const g = graph('a-x b-y');
  expect(briggs(g, 'a', 'b', 2)).toBe(true);
  expect(george(g, 'a', 'b', 2)).toBe(true);
});
test('shared neighbours lose a degree', () => {
  const g = graph('a-t b-t a-u b-u');
  expect(briggs(g, 'a', 'b', 2)).toBe(true);
  expect(george(g, 'a', 'b', 2)).toBe(true);
});
test('sumsq: s0 and s1 pass both tests', () => {
  expect(briggs(sumsq, 's0', 's1', 4))
    .toBe(true);
  expect(george(sumsq, 's0', 's1', 4))
    .toBe(true);
});
test('George is one-sided: s1 into s0 fails', () => {
  expect(george(sumsq, 's1', 's0', 4))
    .toBe(false);
});`,
    hints: [
      'For Briggs, collect the neighbours of the merged node: everything next to `a` or `b`, once each (a `Set` does that). Count how many are significant.',
      'A neighbour `t`’s degree is `g[t].length`, minus one if `t` is next to both `a` and `b`, because those two edges become one. Compare the count with `k` using `<`.',
      'George is one line: `g[a].every((t) => g[t].includes(b) || g[t].length < k)`.',
    ],
    walkthrough: `**How to think about it.** Both tests ask one question: could this merge turn a node that simplify would have removed into one it cannot? Simplify only ever gets stuck on nodes with k or more neighbours, so a neighbour with fewer than k is never the problem. Briggs counts the dangerous neighbours of the merged node: if there are fewer than k, then after simplify removes the harmless ones, the merged node has fewer than k neighbours left and is removable itself. George reasons from \`a\`'s side: if each of \`a\`'s neighbours is harmless or was already \`b\`'s neighbour, then merging gives \`b\` no new dangerous neighbour at all.

**The solution, line by line.**

- \`const nb = new Set(g[a].concat(g[b]));\` is the merged node's neighbourhood, each neighbour once.
- \`let big = 0;\` counts significant neighbours.
- \`for (const t of nb) {\` looks at each.
- \`let d = g[t].length;\` is its degree now.
- \`const both = g[t].includes(a) && g[t].includes(b); if (both) d -= 1;\` corrects for the merge: a neighbour of both had two edges, to \`a\` and to \`b\`, and will have one, to the merged node.
- \`if (d >= k) big += 1;\` counts it if it is significant.
- \`return big < k;\` is the test.
- \`return g[a].every((t) => g[t].includes(b) || g[t].length < k);\` is George: \`every\` is true only if the condition holds for every neighbour of \`a\`.

In the first test, \`a-x b-y x-y\` with k = 2, merging makes \`ab\` a neighbour of \`x\` and \`y\`, each of degree 2: two significant neighbours, which is not fewer than 2, so Briggs says no; George says no too, because \`x\` is not next to \`b\` and has degree 2. In "shared neighbours lose a degree", \`t\` and \`u\` are each next to both \`a\` and \`b\` (degree 2), but after the merge each has degree 1, so nothing is significant and the merge is safe: the corrected count is what lets Briggs see it. For \`sumsq\`, merging \`s0\` into \`s1\` passes George, since both of \`s0\`'s neighbours (\`n\` and \`i0\`) already touch \`s1\`; merging \`s1\` into \`s0\` fails it, because \`s1\`'s neighbour \`i1\` does not touch \`s0\` and has degree 4.

**Common wrong attempts.**

- Counting degrees before the merge: a neighbour of both looks one degree bigger than it will be, and Briggs refuses safe merges, like the one in the third test.
- Checking \`b\`'s neighbours in George instead of \`a\`'s: the test is one-sided, and swapping the roles answers a different question.`,
    wrong: [
      {
        code: `// g maps each value to its neighbours;
// a and b do not interfere.
// Briggs: the merged node has fewer
// than k neighbours of degree >= k.
function briggs(g, a, b, k) {
  const nb = new Set(g[a].concat(g[b]));
  let big = 0;
  for (const t of nb) {
    let d = g[t].length;
    // t next to both: after merging,
    // it loses one neighbour.
    const both = g[t].includes(a) &&
      g[t].includes(b);
    if (d >= k) big += 1;
  }
  return big < k;
}
// George: every neighbour of a already
// touches b, or has degree < k.
function george(g, a, b, k) {
  return g[a].every((t) =>
    g[t].includes(b) ||
    g[t].length < k);
}`,
        why: 'This counts degrees before the merge, so neighbours of both a and b look significant when they will not be; the shared-neighbour merge is wrongly refused.',
      },
      {
        code: `// g maps each value to its neighbours;
// a and b do not interfere.
// Briggs: the merged node has fewer
// than k neighbours of degree >= k.
function briggs(g, a, b, k) {
  const nb = new Set(g[a].concat(g[b]));
  let big = 0;
  for (const t of nb) {
    let d = g[t].length;
    // t next to both: after merging,
    // it loses one neighbour.
    const both = g[t].includes(a) &&
      g[t].includes(b);
    if (both) d -= 1;
    if (d >= k) big += 1;
  }
  return big < k;
}
// George: every neighbour of a already
// touches b, or has degree < k.
function george(g, a, b, k) {
  return g[b].every((t) =>
    g[t].includes(a) ||
    g[t].length < k);
}`,
        why: 'George looks at a’s neighbours; this looks at b’s, so merging s1 into s0 wrongly passes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does merging the two ends of a copy delete the copy?',
    options: [
      { t: 'Because the merged node is spilled', why: 'Merging has nothing to do with spilling.' },
      { t: 'Because both ends then get the same register, so the copy copies a register to itself', correct: true, why: 'A move from a register to itself does nothing, and is removed.' },
      { t: 'Because copies never cost anything', why: 'They cost an instruction each, which is why removing them is worth it.' },
    ],
  },
  {
    q: 'With k = 2, a–x, b–y and x–y, and a copy between a and b: what happens if we coalesce a and b?',
    options: [
      { t: 'Nothing changes: they did not interfere', why: 'They did not interfere with each other, but the merged node inherits both their neighbours.' },
      { t: 'ab, x and y form a triangle, which needs 3 registers: a spill', correct: true, why: 'That is why aggressive coalescing is dangerous, and why Briggs refuses here.' },
      { t: 'x and y no longer interfere', why: 'Merging a and b does not remove other edges.' },
    ],
  },
  {
    q: 'k = 4. Merging a and b would give a node whose neighbours have degrees (after the merge) 6, 4, 3, 2 and 3. Does the Briggs test allow it?',
    options: [
      { t: 'No: there are 5 neighbours, more than 4', why: 'Only significant neighbours (degree ≥ 4) count.' },
      { t: 'Yes: only 2 neighbours have degree 4 or more, fewer than 4', correct: true, why: 'This is the first merge of sumsq, s0 with s1.' },
      { t: 'Only if George also allows it', why: 'Either test alone is enough to make a merge safe.' },
    ],
  },
  {
    q: 'What does the George test check, for merging a into b?',
    options: [
      { t: 'That every neighbour of a already interferes with b or has degree less than k', correct: true, why: 'Then the merge gives b no new neighbour that could block simplify.' },
      { t: 'That a and b have the same degree', why: 'Degrees of a and b themselves are not compared.' },
      { t: 'That the merged node has fewer than k neighbours', why: 'That is stricter than either test, and not what George checks.' },
    ],
  },
  {
    q: 'In iterated register coalescing, what does **freezing** a copy mean?',
    options: [
      { t: 'Spilling both ends of it', why: 'Freezing comes before any spill is considered.' },
      { t: 'Merging it without any test', why: 'That would be aggressive coalescing.' },
      { t: 'Giving up on merging it, so its nodes can be simplified like any others', correct: true, why: 'When neither simplify nor coalesce can move, freezing lets simplify continue.' },
    ],
  },
];
