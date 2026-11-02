// Chapter 221 cards. Keys are stable ids: never rename them.

const LOOPS = `const loops = [
  { runs: 1000,
    fields: ['x', 'y', 'vx', 'vy'] },
  { runs: 100,
    fields: ['x', 'health'] },
  { runs: 1,
    fields: ['health', 'name'] },
];`;

export const prompts = {
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

export const examples = {};

export const exercises = {
  coAccess: {
    title: 'Count co-access',
    prompt:
      'Each loop is `{ runs, fields }`. Write `coAccess(loops)`: an object whose keys are pairs of field names, sorted alphabetically and joined with `+` (like `\'vx+x\'`), and whose values are the total `runs` of the loops that use both fields. Leave out pairs that are never used together.',
    starter: `function coAccess(loops) {
  const aff = {};
  // your code here
  return aff;
}

${LOOPS}
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
    tests: `${LOOPS}
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
    walkthrough: `This is the affinity half of the diagram.

- **Every pair, once.** With fields sorted, the inner loop starts at \`a + 1\`, so each unordered pair is visited exactly once per loop, and a field is never paired with itself.
- **A canonical key.** \`x\` and \`hp\` must give the same key whichever order a loop lists them in. Sorting first makes the key \`'hp+x'\` every time.
- **Weight by runs.** A loop that runs 1000 times contributes 1000 to each of its pairs. Counting 1 per loop would make a once-per-game report look as important as the per-frame movement loop.

The example has 6 pairs from \`move\`, 1 from \`damage\` and 1 from \`report\`: 8 keys. In a real compiler, the run counts would come from a profile or from the loop nesting, and the per-loop field lists from an access-pattern analysis like Viscosity’s.`,
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
    prompt:
      'Write `groupFields(fields, aff, t)`. Two fields belong to the same group if their affinity (from `coAccess`) is at least `t`, or if they are linked through other fields that way. Return the groups as arrays, in the order of `fields`, each group’s members also in that order.',
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
    walkthrough: `This is a tiny union-find. \`g\` maps each field to another field in its group, and following the links (\`find\`) ends at the group’s leader. Merging two groups is one assignment: point one leader at the other.

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
    q: 'A movement loop reads `x`, `y`, `vx`, `vy` of every entity; `health` and `name` are read once per game. What does a hot/cold split do?',
    options: [
      { t: 'Deletes the cold fields.', why: 'They are still needed, just rarely. They move, they don’t vanish.' },
      { t: 'Stores the four movement fields together and the other two separately, indexed by the same i.', correct: true, why: 'The hot loop then loads only hot data.' },
      { t: 'Makes every field a Float64Array.', why: 'That is about representation; `name` is a string and can’t be one.' },
      { t: 'Reorders the loops.', why: 'The split changes the data layout, not the code order.' },
    ],
  },
  {
    q: 'Loop A (runs 500 times) uses x and vx. Loop B (runs 20 times) uses x and hp. Loop C (runs 20 times) uses vx and x. What is the affinity of x and vx?',
    options: [
      { t: '2', why: 'That counts loops, not runs.' },
      { t: '540', why: 'Loop B doesn’t use vx.' },
      { t: '500', why: 'Loop C uses both too.' },
      { t: '520', correct: true, why: 'Loops A and C both use x and vx: 500 + 20.' },
    ],
  },
  {
    q: 'How does Viscosity split fields?',
    options: [
      { t: 'Into a hot struct of arrays and a cold array of objects, by profile.', why: 'There is no separate cold struct in the engine.' },
      { t: 'It groups fields by affinity into blocks.', why: 'Its access analysis records which fields each loop touches, but nothing groups them.' },
      { t: 'Every field gets its own column: typed if proven numeric, a plain array otherwise.', correct: true, why: 'That is the per-field policy in analysis.ts and plan.ts.' },
      { t: 'It never splits fields.', why: 'SoA is a split: each field is its own column.' },
    ],
  },
  {
    q: 'In `mixed_columns.js`, which fields get `Float64Array` columns?',
    options: [
      { t: '`hp` and `x`', correct: true, why: 'Only those are proven to always hold numbers.' },
      { t: '`x` and `tag`, the ones the hot loop reads', why: 'The choice is by type, not by heat; `tag` holds null or objects.' },
      { t: 'All four', why: '`id` holds strings and `tag` holds objects.' },
      { t: 'None, because one field is a string', why: 'One non-numeric field doesn’t stop SoA; it just gets a plain column. That rule is for AoSoA.' },
    ],
  },
  {
    q: 'Why is SoA called the finest possible hot/cold split?',
    options: [
      { t: 'Because it only works for hot fields.', why: 'SoA stores every field, hot or cold.' },
      { t: 'Because it sorts fields by hotness.', why: 'Column order doesn’t matter in SoA; each column is separate.' },
      { t: 'Because it always runs fastest.', why: 'Chapter 59 showed SoA losing at materialization.' },
      { t: 'Because each field is its own group, so a loop loads exactly the fields it touches.', correct: true, why: 'There is nothing left to split.' },
    ],
  },
  {
    q: 'Where would field affinity matter most for a layout?',
    options: [
      { t: 'When each field already has its own column.', why: 'Then a loop only loads what it uses; grouping has no effect.' },
      { t: 'When several fields share one array, as in packed AoS or AoSoA blocks.', correct: true, why: 'Then the grouping decides what each cache line carries.' },
      { t: 'Only for string fields.', why: 'Affinity is about access, not type.' },
      { t: 'Only in loops that run once.', why: 'Rare loops barely count; affinity is dominated by the frequent ones.' },
    ],
  },
];
