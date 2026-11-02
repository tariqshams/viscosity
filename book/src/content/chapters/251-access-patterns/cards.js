// Chapter 251 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ap-what': {
    q: 'What four things make up a loop’s access pattern in Viscosity?',
    a: 'The fields it reads, the fields it writes, its nesting depth, and its trip count (if known).',
  },
  'ap-why': {
    q: 'Why does the same collection benefit more from SoA in one loop than another?',
    a: 'SoA saves the most when a loop touches few of the fields: it then reads only those columns, not whole records.',
  },
  'ap-two': {
    q: 'How many element accesses is `ps[i].x += 1`?',
    a: 'Two: a read of x (field.get) and a write of x (field.set).',
  },
  'ap-innermost': {
    q: 'An access sits inside two nested loops. Which loop’s row is it filed under?',
    a: 'The innermost one: the smallest natural loop whose body contains the access.',
  },
  'ap-func': {
    q: 'Why does the access table key include the function as well as the loop header?',
    a: 'Blocks are numbered per function, and loops in different functions (like `drift()` and `centerOfMass()`) need separate rows.',
  },
  'ap-depth': {
    q: 'How does Viscosity compute a loop’s depth?',
    a: 'One plus the number of larger natural loops that contain its header. An access in no loop has depth 0.',
  },
  'ap-trips': {
    q: 'Why does `for (let i = 0; i < ps.length; i++)` get no trip count?',
    a: 'Viscosity only counts loops whose bound is a constant. `ps.length` isn’t a constant in the code.',
  },
  'ap-tripuse': {
    q: 'What does Viscosity use known trip counts for today?',
    a: 'The size estimate: a `push` inside loops with known trip counts adds their product to the collection’s estimated size.',
  },
  'hl-what': {
    q: 'What is a hot loop?',
    a: 'A loop where the program spends most of its time.',
  },
  'hl-proxy': {
    q: 'Without running the program, what does Viscosity accept as evidence that a layout change could pay off?',
    a: 'At least one field access inside a loop (depth > 0). With none, it keeps the array of objects.',
  },
};

export const exercises = {
  loopTable: {
    title: 'Build the access table',
    prompt:
      'Each element access is `{ loop, field, kind }`: `loop` is the innermost loop’s name (or `null` if it is in no loop), and `kind` is `\'read\'` or `\'write\'`. Write `loopTable(accs)`, returning an object with one entry per loop (use the key `\'none\'` for `null`). Each entry is `{ reads, writes }`: arrays of field names in the order first seen, with no duplicates.',
    starter: `function loopTable(accs) {
  const table = {};
  // your code here
  return table;
}

console.log(loopTable([
  { loop: 'L5', field: 'x',
    kind: 'read' },
  { loop: 'L5', field: 'x',
    kind: 'write' },
]));`,
    solution: `function loopTable(accs) {
  const table = {};
  for (const a of accs) {
    const key = a.loop ?? 'none';
    if (!table[key])
      table[key] = {
        reads: [], writes: [] };
    const list = a.kind === 'read'
      ? table[key].reads
      : table[key].writes;
    if (!list.includes(a.field))
      list.push(a.field);
  }
  return table;
}`,
    tests: `test('x += vx in one loop', () => {
  expect(loopTable([
    { loop: 'L5', field: 'x', kind: 'read' },
    { loop: 'L5', field: 'vx', kind: 'read' },
    { loop: 'L5', field: 'x', kind: 'write' },
  ])).toEqual({ L5: { reads: ['x', 'vx'], writes: ['x'] } });
});
test('two loops get two rows', () => {
  expect(loopTable([
    { loop: 'L5', field: 'y', kind: 'write' },
    { loop: 'L11', field: 'x', kind: 'read' },
  ])).toEqual({
    L5: { reads: [], writes: ['y'] },
    L11: { reads: ['x'], writes: [] },
  });
});
test('no duplicates', () => {
  expect(loopTable([
    { loop: 'L2', field: 'x', kind: 'read' },
    { loop: 'L2', field: 'x', kind: 'read' },
  ])).toEqual({ L2: { reads: ['x'], writes: [] } });
});
test('accesses outside loops go under none', () => {
  expect(loopTable([
    { loop: null, field: 'y', kind: 'read' },
  ])).toEqual({ none: { reads: ['y'], writes: [] } });
});
test('no accesses, no rows', () => {
  expect(loopTable([])).toEqual({});
});`,
    hints: [
      'Turn `null` into `\'none\'` with `a.loop ?? \'none\'`, and create the row the first time you see a key.',
      'Pick the reads list or the writes list from `a.kind`, then push the field only if it isn’t there yet.',
    ],
    walkthrough: `This is Viscosity’s \`byLoop\` map in miniature.

- **One row per loop.** The row is created lazily, the first time an access in that loop turns up. Using the innermost loop as the key means two accesses in the same loop always land in the same row, even if they are on different lines.
- **Reads and writes are kept apart.** \`x += vx\` puts x in both lists. Keeping them separate matters later: a loop that only reads a column can’t invalidate anything, and a hot/cold split (chapter 261) cares which fields are used together.
- **Sets, not counts.** Viscosity uses \`Set\`; arrays plus \`includes\` give the same result here with a predictable order for the tests. The row says *which* fields, not how often: \`ps[i].x\` twice on one line is still just x.
- **Nothing is dropped yet.** Accesses outside every loop still get a \`none\` row. It is the planner that later ignores depth-0 rows.`,
    wrong: [
      {
        code: `function loopTable(accs) {
  const table = {};
  for (const a of accs) {
    const key = a.loop ?? 'none';
    if (!table[key])
      table[key] = {
        reads: [], writes: [] };
    const t = table[key];
    if (a.kind === 'read')
      t.reads.push(a.field);
    else t.writes.push(a.field);
  }
  return table;
}`,
        why: 'Fields are pushed every time they are seen, so a field read twice appears twice. The row is a set of fields.',
      },
      {
        code: `function loopTable(accs) {
  const table = {};
  for (const a of accs) {
    if (a.loop === null) continue;
    const t = table[a.loop] ??=
      { reads: [], writes: [] };
    const l = a.kind === 'read'
      ? t.reads : t.writes;
    if (!l.includes(a.field))
      l.push(a.field);
  }
  return table;
}`,
        why: 'Accesses outside loops are dropped here. The table should keep them under `none`; deciding they don’t matter is the planner’s job, not the analysis’s.',
      },
    ],
  },
  describeLoop: {
    optional: true,
    title: 'Describe a loop like explain does',
    prompt:
      'A row is `{ func, line, depth, reads, writes }` (arrays of field names). Write `describeLoop(row, F)`, where `F` is the number of fields in the shape. Return `null` for a row with depth 0. Otherwise return the explain line `\'loop at line L in FUNC() touches K of F fields (A, B)\'`, where the list is the reads followed by any writes not already listed, and K is its length.',
    starter: `function describeLoop(row, F) {
  // your code here
}

console.log(describeLoop({
  func: 'drift', line: 11, depth: 1,
  reads: ['x'], writes: ['x'],
}, 3));`,
    solution: `function describeLoop(row, F) {
  if (row.depth === 0) return null;
  const { reads, writes } = row;
  const fs = [
    ...new Set([...reads, ...writes]),
  ];
  return 'loop at line ' + row.line +
    ' in ' + row.func + '() touches ' +
    fs.length + ' of ' + F +
    ' fields (' + fs.join(', ') + ')';
}`,
    tests: `test('read and write of the same field', () => {
  expect(describeLoop({ func: 'drift', line: 11, depth: 1, reads: ['x'], writes: ['x'] }, 3))
    .toBe('loop at line 11 in drift() touches 1 of 3 fields (x)');
});
test('reads then new writes', () => {
  expect(describeLoop({ func: '<module>', line: 5, depth: 2, reads: ['vy', 'y'], writes: ['y', 'x'] }, 4))
    .toBe('loop at line 5 in <module>() touches 3 of 4 fields (vy, y, x)');
});
test('depth 0 is not reported', () => {
  expect(describeLoop({ func: '<module>', line: 12, depth: 0, reads: ['y'], writes: [] }, 4))
    .toBe(null);
});`,
    hints: [
      'A `Set` built from reads then writes keeps first-seen order and drops duplicates.',
      'Build the string from its parts; check depth 0 first.',
    ],
    walkthrough: `This is the first line of \`describe\` in \`plan.ts\`: \`new Set([...l.reads, ...l.writes])\`, so a field that is read and written counts once. “Touches k of F” is the number the cost model cares about: the smaller the fraction, the fewer bytes a struct of arrays needs to stream through the cache for that loop. Depth-0 rows are filtered out before \`describe\` ever sees them.`,
    wrong: [
      {
        code: `function describeLoop(row, F) {
  if (row.depth === 0) return null;
  const { reads, writes } = row;
  const fs = [...reads, ...writes];
  return 'loop at line ' + row.line +
    ' in ' + row.func + '() touches ' +
    fs.length + ' of ' + F +
    ' fields (' + fs.join(', ') + ')';
}`,
        why: 'A field that is both read and written is counted twice, so `x += 1` would “touch 2 of 3 fields (x, x)”.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A loop runs `ps[i].x += ps[i].vx`. What is its row in the access table?',
    options: [
      { t: 'reads {x}, writes {vx}', why: 'vx is only read; x is the one assigned.' },
      { t: 'reads {x, vx}, writes {x}', correct: true, why: '`+=` reads x before writing it, and vx is read.' },
      { t: 'reads {vx}, writes {x}', why: '`x += …` is `x = x + …`, so x is read too.' },
      { t: 'reads {x, vx}, writes {x, vx}', why: 'Nothing is stored into vx.' },
    ],
  },
  {
    q: 'An access is inside an inner loop, which is inside an outer loop. How is it recorded?',
    options: [
      { t: 'Under both loops', why: 'Each access is filed once, under one loop.' },
      { t: 'Under the outer loop, with depth 1', why: 'The outer loop is not the innermost one containing the access.' },
      { t: 'Under the inner loop, with depth 2', correct: true, why: '`loopOf` picks the smallest enclosing loop; depth counts the loops around it.' },
      { t: 'It isn’t: only top-level loops count', why: 'Nested loops are where most work happens; they are recorded like any other.' },
    ],
  },
  {
    q: 'Which loop gets a known trip count from Viscosity?',
    options: [
      { t: '`for (let i = 0; i < ps.length; i++)`', why: '`ps.length` isn’t a constant in the code.' },
      { t: '`for (let i = 0; i < 64 * 64; i++)`', why: 'The bound is an expression; `tripCount` wants a constant.' },
      { t: '`for (let i = 10; i > 0; i--)`', why: 'Only counting up from 0 by 1 with `<` or `<=` is recognized.' },
      { t: '`for (let i = 0; i <= 9; i++)`', correct: true, why: 'Counting from 0 by 1 up to a constant with `<=`: 9 + 1 = 10 trips.' },
    ],
  },
  {
    q: 'A program fills `ps` in a loop, then only reads `ps[0].x` and `ps.length`. What does Viscosity decide?',
    options: [
      { t: 'Keeps the array of objects: no loop reads or writes its fields', correct: true, why: 'The only field access has depth 0, and depth-0 rows don’t count.' },
      { t: 'Struct of arrays, because the push is in a loop', why: 'Pushes aren’t field accesses. The question is whether some loop uses the fields.' },
      { t: 'Bails out as unsafe', why: 'Nothing here is unsafe. It is a judgment that the change can’t pay off.' },
      { t: 'AoSoA', why: 'AoSoA is only chosen when annotated.' },
    ],
  },
  {
    q: 'Why does Viscosity use “inside a loop” rather than measured time to judge hotness?',
    options: [
      { t: 'Measuring is impossible in JavaScript', why: 'It isn’t; V8 does it constantly, and chapter 262 does it for Viscosity.' },
      { t: 'Loops are always hot', why: 'They aren’t: a loop of ten trips is cheap. It is a weak sign, but one that can be checked statically.' },
      { t: 'It compiles before the program has run, so it can only read hotness off the code', correct: true, why: 'Unlike V8, which watches the running program.' },
      { t: 'Depth is the same as time', why: 'Depth is a hint, not a measurement. Viscosity records it but doesn’t yet weigh loops with it.' },
    ],
  },
  {
    q: 'What does a known trip count change in Viscosity today?',
    options: [
      { t: 'It ranks loops by hotness', why: 'The planner doesn’t yet weigh loops against each other.' },
      { t: 'It proves accesses in bounds', why: 'Bounds come from a separate check: `i < ps.length` guarding the access.' },
      { t: 'Nothing: it is computed and discarded', why: 'It is used, for one thing.' },
      { t: 'The size estimate, when a `push` runs inside loops with known trips', correct: true, why: 'For example 1000 pushes in `i < 1000` give “about 1000 elements”.' },
    ],
  },
];
