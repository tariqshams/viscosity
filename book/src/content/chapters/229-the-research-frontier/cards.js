// Chapter 229 cards. Keys are stable ids: never rename them.

export const prompts = {
  'op-sort': {
    q: 'Why is sorting hard for a struct-of-arrays layout?',
    a: 'Every column must be permuted in exactly the same way, and the comparator expects element objects that no longer exist.',
  },
  'op-nested': {
    q: 'Viscosity transforms `ps.push({ pos: { x, y }, m })`. Why is the result only half a win?',
    a: '`pos` becomes a plain column of objects, so reading `pos.x` still chases a pointer. Only `m` gets a typed column.',
  },
  'op-size': {
    q: 'What does “size unknown statically” mean for a transformed collection?',
    a: 'The size depends on a run-time value (like a parameter `n`), so the transform is a bet; a profile can replace the guess with a measurement.',
  },
  'op-what': {
    q: 'What is an open problem?',
    a: 'A question nobody has a satisfying general answer to yet, as opposed to a gap where the technique is known and only the work is missing.',
  },
  'op-gap': {
    q: 'What does an engineering gap need, and what does an open problem need?',
    a: 'A gap needs time and work; an open problem needs a new idea (and often new evidence).',
  },
  'op-class': {
    q: 'Why is “arrays of class instances” a gap rather than an open problem for Viscosity?',
    a: 'Recognizing the fields a simple constructor creates is known technique; Viscosity just doesn’t lower classes yet.',
  },
  'op-proof': {
    q: 'Why can a JIT try layouts that Viscosity must refuse?',
    a: 'A JIT can speculate and deoptimize when it is wrong. Viscosity runs before the program and has no way back, so it must prove safety.',
  },
  'op-cost': {
    q: 'Name one measurement from this book that shows the cost model is still rough.',
    a: 'Any of: gains shrink to about 1.3–2.3× at 1,000 elements; AoSoA often loses there; nbody gains only 1.09× end to end; in CPython columns lose on time.',
  },
  'op-who': {
    q: 'How does Odin’s `#soa` differ from Viscosity’s approach?',
    a: 'In Odin the programmer chooses SoA with a keyword; Viscosity chooses automatically (or checks an annotation) and must prove it safe.',
  },
  'op-measure': {
    q: 'How would you choose which refusal to work on first?',
    a: 'Run explain over a corpus of real programs and count the reasons; work on the one that blocks the most programs.',
  },
};

export const exercises = {
  tally: {
    title: 'Count what blocks Viscosity',
    prompt:
      'Write `tally(report)`. `report` is the text of a `viscosity explain` report. Return `{ soa, aosoa, kept, unsafe }`: how many collections were turned into struct of arrays, how many into AoSoA, how many were kept, and how many `unsafe:` reasons there are. A verdict line contains ` → ` followed by `struct of arrays`, `AoSoA, blocks of N` or `kept as array of objects`. An unsafe reason line starts with two spaces, `·`, a space and `unsafe:`.',
    starter: `function tally(report) {
  const t = { soa: 0, aosoa: 0,
    kept: 0, unsafe: 0 };
  for (const l of report.split('\\n')) {
    if (l.includes('struct')) t.soa++;
  }
  return t;
}`,
    solution: `function tally(report) {
  const t = { soa: 0, aosoa: 0,
    kept: 0, unsafe: 0 };
  for (const l of report.split('\\n')) {
    if (l.startsWith('  · unsafe:')) {
      t.unsafe++;
    }
    const i = l.indexOf(' → ');
    if (i >= 0) {
      const v = l.slice(i + 3);
      if (v[0] === 's') t.soa++;
      else if (v[0] === 'A') {
        t.aosoa++;
      } else t.kept++;
    }
  }
  return t;
}`,
    tests: `const kept2 = [
  'ps (line 2) {x} → kept as array of objects',
  '  · unsafe: line 7: an element is compared or combined with "==="',
  '  · unsafe: line 5: an element is used by push',
  'keep (line 4) {} → kept as array of objects',
  '  · unsafe: line 5: pushes something that is not a fresh object literal',
  '  · unsafe: line 7: an element is compared or combined with "==="',
  '  · unsafe: line 6: adds a new property .x to an element',
].join('\\n');
const soa1 = [
  'es (line 2) {id, hp, x, tag} → struct of arrays',
  '  · loop at line 5 in <module>() touches 3 of 4 fields (hp, tag, x)',
  '  · loop at line 12 in <module>() touches 2 of 4 fields (hp, x)',
  '  · typed Float64Array columns for hp, x; plain array columns for id, tag (may hold non-numbers)',
  '  · about 300 elements',
  '  · 4 of 9 element accesses proven in bounds',
].join('\\n');
const blocked = [
  'ps (line 3) {x, y, z} → AoSoA, blocks of 8',
  '  · annotated @viscosity aosoa(8) at line 2',
  'ws (line 2) {word} → kept as array of objects',
  '  · no field is provably numeric, so there are no typed columns to gain',
].join('\\n');
test('two kept collections, five unsafe uses', () => {
  expect(tally(kept2)).toEqual({ soa: 0, aosoa: 0, kept: 2, unsafe: 5 });
});
test('a transformed collection has no unsafe reasons', () => {
  expect(tally(soa1)).toEqual({ soa: 1, aosoa: 0, kept: 0, unsafe: 0 });
});
test('AoSoA is not counted as kept', () => {
  expect(tally(blocked)).toEqual({ soa: 0, aosoa: 1, kept: 1, unsafe: 0 });
});
test('a file with no collections', () => {
  const r = 'No arrays of objects found.';
  expect(tally(r)).toEqual({ soa: 0, aosoa: 0, kept: 0, unsafe: 0 });
});`,
    hints: [
      'Split the report into lines with `split(\'\\n\')` and look at each line once.',
      'Only verdict lines contain ` → `. Use `indexOf` to find it, and look at what comes after.',
      'Not every `·` line is a refusal: transformed collections have `·` lines too. Count only lines starting with `  · unsafe:`.',
    ],
    walkthrough: `This is the first tool a researcher would write: run explain over many programs, then count.

- **Two kinds of line.** A verdict line has \` → \` and the layout after it. A reason line starts with \`  · \`. Each line is one or the other, so one pass over the lines is enough.
- **The verdict.** Slice off everything after the arrow. The three verdicts start with different letters, so the first character is enough: \`s\` for \`struct of arrays\`, \`A\` for \`AoSoA\`, and otherwise it is \`kept\`.
- **The refusals.** Only reasons that start with \`unsafe:\` are safety refusals. The other kind of keep reason (“no field is provably numeric”) is a cost decision, and a transformed collection’s reasons are evidence, not refusals.

Run it over a whole corpus, add the counts, and group the unsafe reasons by their wording, and you have a ranked list of edges to work on.`,
    wrong: [
      {
        code: `function tally(report) {
  const t = { soa: 0, aosoa: 0,
    kept: 0, unsafe: 0 };
  for (const l of report.split('\\n')) {
    if (l.startsWith('  · ')) {
      t.unsafe++;
    }
    const i = l.indexOf(' → ');
    if (i >= 0) {
      const v = l.slice(i + 3);
      if (v[0] === 's') t.soa++;
      else if (v[0] === 'A') {
        t.aosoa++;
      } else t.kept++;
    }
  }
  return t;
}`,
        why: 'Every reason line is counted as unsafe, including the evidence lines of a transformed collection (“about 300 elements”). Only `  · unsafe:` lines are refusals.',
      },
      {
        code: `function tally(report) {
  const t = { soa: 0, aosoa: 0,
    kept: 0, unsafe: 0 };
  for (const l of report.split('\\n')) {
    if (l.startsWith('  · unsafe:')) {
      t.unsafe++;
    }
    if (l.includes('struct of')) {
      t.soa++;
    } else if (l.includes(' → ')) {
      t.kept++;
    }
  }
  return t;
}`,
        why: 'AoSoA verdicts land in `kept`. There are three verdicts, so check for all three.',
      },
    ],
  },
  sumBoth: {
    optional: true,
    title: 'One function, two layouts',
    prompt:
      'The run-time research handles arrays whose layout can differ by checking which one it has and picking a loop. Write `sumX(ps)`, which returns the sum of the `x` fields. `ps` is either an ordinary array of objects, or a SoA container `{ length, x }` whose `x` is a `Float64Array`. The container’s column may be longer than `length` (spare capacity): only the first `length` entries are elements.',
    starter: `function sumX(ps) {
  let s = 0;
  for (const p of ps) s += p.x;
  return s;
}`,
    solution: `function sumX(ps) {
  let s = 0;
  if (ps.x instanceof Float64Array) {
    const n = ps.length;
    for (let i = 0; i < n; i++) {
      s += ps.x[i];
    }
  } else {
    for (const p of ps) s += p.x;
  }
  return s;
}`,
    tests: `test('an array of objects', () => {
  expect(sumX([{ x: 1 }, { x: 2 }])).toBe(3);
});
test('a SoA container', () => {
  const c = { length: 3, x: Float64Array.of(1, 2, 3) };
  expect(sumX(c)).toBe(6);
});
test('spare capacity is not summed', () => {
  const c = { length: 2, x: Float64Array.of(1, 2, 99, 99) };
  expect(sumX(c)).toBe(3);
});
test('empty in both layouts', () => {
  expect(sumX([])).toBe(0);
  expect(sumX({ length: 0, x: new Float64Array(16) })).toBe(0);
});`,
    hints: [
      'First decide which layout you have: is `ps.x` a `Float64Array`?',
      'An ordinary array has no `x` property, so the check is false for it.',
      'For the container, loop to `ps.length`, not `ps.x.length`: the column has spare room.',
    ],
    walkthrough: `This is control-flow duplication in miniature: one check, then a loop specialized for each layout.

- **The guard.** \`ps.x instanceof Float64Array\` is true only for the container. An array of objects has no \`x\` property at all.
- **The column loop** reads one typed array, and stops at \`length\`. Chapter 216’s containers double their capacity, so the column is usually longer than the collection.
- **The object loop** is the original code, unchanged.

Inside a JIT, the guard is cheap and the engine can compile each loop for its own layout. Ahead of time, Viscosity would have to emit both loops for every hot loop, which is the code-size cost the chapter mentions.`,
    wrong: [
      {
        code: `function sumX(ps) {
  let s = 0;
  if (ps.x instanceof Float64Array) {
    for (const v of ps.x) s += v;
  } else {
    for (const p of ps) s += p.x;
  }
  return s;
}`,
        why: 'This sums the whole column, spare capacity included, so `{ length: 2, x: [1, 2, 99, 99] }` gives 201. Stop at `ps.length`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Viscosity refuses `ps.sort(...)`. Which kind of edge is that?',
    options: [
      { t: 'A bug: sorting is always safe to rewrite', why: 'Sorting permutes every column and hands element objects to a comparator; a correct rewrite needs a real idea.' },
      { t: 'An open problem: reordering columns together, with a comparator that wants objects', correct: true, why: 'There is no simple known way to do it with no observable difference.' },
      { t: 'A cost decision: sorting makes SoA slower', why: 'The reason given is “unsafe”, a safety refusal, not a cost one.' },
      { t: 'A missing annotation', why: 'Annotations can’t make an unsafe use safe; safety comes first.' },
    ],
  },
  {
    q: 'Arrays of class instances are refused today. Why does the chapter call that a gap, not an open problem?',
    options: [
      { t: 'Classes can never be transformed', why: 'Simple constructors that always set the same fields are well understood.' },
      { t: 'Classes are rare in JavaScript', why: 'They’re common, which is why it is worth closing the gap.' },
      { t: 'Gaps are problems V8 has solved', why: 'Whether V8 solved something isn’t the test.' },
      { t: 'The technique is known; the lowering just hasn’t been written', correct: true, why: 'Today the JS lowering treats a class declaration as code it doesn’t model.' },
    ],
  },
  {
    q: 'What can a run-time transformation inside a JIT do that Viscosity can’t?',
    options: [
      { t: 'Explain every decision before the program runs', why: 'That is Viscosity’s advantage, not the JIT’s.' },
      { t: 'Run in any JavaScript engine', why: 'It needs a modified engine; Viscosity’s output is plain JavaScript.' },
      { t: 'Guess a layout and deoptimize if the guess turns out wrong', correct: true, why: 'Speculation with a way back, which an ahead-of-time compiler lacks.' },
      { t: 'Avoid the cost of the conversion', why: 'The run-time version pays for converting; Viscosity allocates columns from the start.' },
    ],
  },
  {
    q: 'Which observation from this book’s measurements shows the cost model is still a heuristic?',
    options: [
      { t: 'At 1,000 elements AoSoA was often slower than plain objects', correct: true, why: 'FINDINGS.md section 3. Size and layout interact in ways a fixed threshold doesn’t capture.' },
      { t: 'SoA always wins by 3.8×', why: 'The win depends heavily on the suite and size; it is not a constant.' },
      { t: 'Python and JavaScript gave the same verdict', why: 'They gave opposite verdicts: CPython columns lost on time.' },
      { t: 'Every end-to-end program gained at least 3×', why: 'nbody gained 1.09× and boids 1.18× in the recorded run.' },
    ],
  },
  {
    q: 'For `ps[0] = ps[1]`, explain used to say “the array is stored into an array at line 5”. That was…',
    options: [
      { t: 'Accurate: ps is copied into itself', why: 'Nothing copies the array; an element is stored into it.' },
      { t: 'A correct refusal with a misleading sentence: ps is the target of the store', correct: true, why: 'The message didn’t say which operand of the store the array was. Now it does: “the array is written with an index store at line 5”.' },
      { t: 'A sign Viscosity would have transformed it incorrectly', why: 'It refused, which is the safe outcome.' },
      { t: 'Output from the Python plugin', why: 'This is the JavaScript front-end on a JavaScript program.' },
    ],
  },
  {
    q: 'How does a language like Odin approach SoA?',
    options: [
      { t: 'It analyzes your program and chooses automatically', why: 'That’s Viscosity’s approach.' },
      { t: 'It converts arrays at run time', why: 'That’s the GraalJS research.' },
      { t: 'It has no SoA support', why: 'It has the `#soa` directive.' },
      { t: 'You mark the array `#soa` and keep the ordinary indexing syntax', correct: true, why: '`v_soa[0].x` works on an `#soa` array, and `v_soa.x[0]` reaches the column.' },
    ],
  },
];
