// Chapter 326 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'op-sort': {
    q: 'Why is sorting hard for a struct-of-arrays layout?',
    a: 'Every column must be permuted in exactly the same way, and the comparator expects element objects that no longer exist.',
  },
  'op-nested': {
    q: 'Viscosity stores `ps.push({ pos: { x, y }, m })` as struct of arrays. Why is the result only half a win?',
    a: '`pos` becomes a plain column of objects, so reading `pos.x` still chases a pointer. Only `m` gets a typed column.',
  },
  'op-size': {
    q: 'In an ahead-of-time layout optimiser, what does it mean that a transformed collection’s size is unknown statically?',
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
    q: 'Why is laying out arrays of instances of a simple class (whose constructor always sets the same fields) as columns an engineering gap rather than an open problem?',
    a: 'Recognising the fields such a constructor creates, in order, is known technique (it is shape inference over the constructor); only the lowering, the analysis and the tests need writing.',
  },
  'op-proof': {
    q: 'Why can a JIT try layouts that Viscosity must refuse?',
    a: 'A JIT can speculate and deoptimise when it is wrong. Viscosity runs before the program and has no way back, so it must prove safety.',
  },
  'op-cost-why': {
    q: 'Why can a fixed element-count threshold not decide whether struct of arrays will pay?',
    a: 'The gain depends on more than size: on the engine (the same SoA program can gain about 4× on one JavaScript engine and nothing on another), on the language (CPython column reads build objects and lose time), and on how often whole records must be rebuilt.',
  },
  'op-who': {
    q: 'How does Odin’s `#soa` differ from an automatic layout optimiser such as Viscosity?',
    a: 'In Odin the programmer chooses SoA with a keyword; Viscosity chooses automatically (or checks an annotation) and must prove it safe.',
  },
  'op-measure': {
    q: 'How would you choose which refusal to work on first?',
    a: 'Run explain over a corpus of real programs and count the reasons; work on the one that blocks the most programs.',
  },
};

export const examples = {};

export const exercises = {
  tally: {
    title: 'Count what blocks Viscosity',
    prompt: 'Write `tally(report)`. `report` is the text of a `viscosity explain` report. Return `{ soa, aosoa, kept, unsafe }`: how many collections were turned into struct of arrays, how many into AoSoA, how many were kept, and how many `unsafe:` reasons there are. A verdict line contains ` → ` followed by `struct of arrays`, `AoSoA, blocks of N` or `kept as array of objects`. An unsafe reason line starts with two spaces, `·`, a space and `unsafe:`.',
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
    walkthrough: `**How to think about it.** This is the first tool a researcher would write: run explain over many programs, then count. Look at a report before writing code and notice that every line is one of two kinds. A **verdict** line names a collection and contains \` → \` followed by its fate. A **reason** line starts with two spaces and \`·\`. Only some reason lines are safety refusals (those that continue \`unsafe:\`); the others are either cost decisions ("no field is provably numeric") or the evidence for a transformed collection ("about 300 elements"). So one pass over the lines is enough, as long as each line is classified carefully. And the three verdicts start with different letters (\`s\`truct of arrays, \`A\`oSoA, \`k\`ept), so the first character after the arrow tells them apart.

**The solution, line by line.**

- \`function tally(report) {\` takes the whole report as one string.
- \`  const t = { soa: 0, aosoa: 0,\` and \`    kept: 0, unsafe: 0 };\` start every count at zero, so a report with no collections returns all zeros.
- \`  for (const l of report.split('\\n')) {\` looks at each line once.
- \`    if (l.startsWith('  · unsafe:')) {\` and \`      t.unsafe++;\` count only the safety refusals, by their exact prefix.
- \`    const i = l.indexOf(' → ');\` finds the arrow, or \`-1\` on a reason line.
- \`    if (i >= 0) {\` handles verdict lines only.
- \`      const v = l.slice(i + 3);\` keeps what comes after the arrow and its two spaces (three characters in all).
- \`      if (v[0] === 's') t.soa++;\` counts \`struct of arrays\`;
- \`      else if (v[0] === 'A') {\` and \`        t.aosoa++;\` count \`AoSoA, blocks of N\`;
- \`      } else t.kept++;\` counts the rest, which can only be \`kept as array of objects\`.
- \`  return t;\` returns the four counts.

Run it over a whole corpus, add the counts, then group the unsafe reasons by their wording, and you have a ranked list of edges to work on.

**Common wrong attempts.**

- Counting every \`  · \` line as unsafe: a transformed collection's evidence lines ("about 300 elements") become refusals, so the first test of a transformed collection fails.
- Checking only for \`struct of\` and treating every other verdict as kept: AoSoA verdicts land in \`kept\`. There are three verdicts, so check for all three.`,
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
    prompt: 'The run-time research handles arrays whose layout can differ by checking which one it has and picking a loop. Write `sumX(ps)`, which returns the sum of the `x` fields. `ps` is either an ordinary array of objects, or a SoA container `{ length, x }` whose `x` is a `Float64Array`. The container’s column may be longer than `length` (spare capacity): only the first `length` entries are elements.',
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
    walkthrough: `**How to think about it.** This is control-flow duplication from the run-time research, in miniature: one check that decides which layout you were given, then a loop written for that layout. So the first question is what test tells the two apart. An ordinary array of objects has no property called \`x\` at all (\`ps.x\` is \`undefined\`), while the container's \`x\` is a \`Float64Array\`, so \`ps.x instanceof Float64Array\` is a reliable guard. The second question is where the container's elements end: the prompt warns that the column may be longer than \`length\`, because containers keep spare capacity, so the loop must stop at \`ps.length\`, not at the end of the column.

**The solution, line by line.**

- \`function sumX(ps) {\` takes either layout.
- \`  let s = 0;\` is the running total.
- \`  if (ps.x instanceof Float64Array) {\` is the guard: true only for the container.
- \`    const n = ps.length;\` is the number of real elements, not the column's capacity.
- \`    for (let i = 0; i < n; i++) {\` and \`      s += ps.x[i];\` walk one typed column, which is the fast, cache-friendly loop.
- \`  } else {\` handles an array of objects;
- \`    for (const p of ps) s += p.x;\` is the original loop, unchanged.
- \`  return s;\` returns the total from whichever loop ran.

With \`{ length: 2, x: [1, 2, 99, 99] }\` the loop stops after two elements, so the answer is 3.

**Common wrong attempts.**

- Looping over the whole column (\`for (const v of ps.x)\`): the spare capacity is summed too, so the example gives 201. Containers that double their capacity as they grow, as in *Rewriting field accesses and growing collections*, are almost always longer than their contents.
- Testing \`Array.isArray(ps)\` the other way round works too, but testing for the layout you want to be fast keeps the fast path first, which is how a JIT orders its guards. Ahead of time, Viscosity would have to emit both loops for every hot loop, which is the code-size cost the chapter mentions.`,
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
    q: 'An ahead-of-time struct-of-arrays rewriter refuses arrays that are sorted with `ps.sort(...)`. Which kind of edge is that?',
    options: [
      {
        t: 'A bug: sorting is always safe to rewrite',
        why: 'Sorting permutes every column and hands element objects to a comparator; a correct rewrite needs a real idea.',
      },
      {
        t: 'An open problem: reordering columns together, with a comparator that wants objects',
        correct: true,
        why: 'There is no simple known way to do it with no observable difference.',
      },
      {
        t: 'A cost decision: sorting makes SoA slower',
        why: 'The reason given is “unsafe”, a safety refusal, not a cost one.',
      },
      {
        t: 'A missing annotation',
        why: 'Annotations can’t make an unsafe use safe; safety comes first.',
      },
    ],
  },
  {
    q: 'Why is transforming arrays of instances of simple classes an engineering gap, not an open problem?',
    options: [
      {
        t: 'Classes can never be transformed',
        why: 'Simple constructors that always set the same fields are well understood.',
      },
      {
        t: 'Classes are rare in JavaScript',
        why: 'They’re common, which is why it is worth closing the gap.',
      },
      {
        t: 'Gaps are problems V8 has solved',
        why: 'Whether V8 solved something isn’t the test.',
      },
      {
        t: 'The technique is known; what is missing is the work of writing the lowering and its tests',
        correct: true,
        why: 'Seeing which fields a constructor sets, in which order, is the same shape inference engines and compilers already do.',
      },
    ],
  },
  {
    q: 'What can a run-time transformation inside a JIT do that Viscosity can’t?',
    options: [
      {
        t: 'Explain every decision before the program runs',
        why: 'That is Viscosity’s advantage, not the JIT’s.',
      },
      {
        t: 'Run in any JavaScript engine',
        why: 'It needs a modified engine; Viscosity’s output is plain JavaScript.',
      },
      {
        t: 'Guess a layout and deoptimise if the guess turns out wrong',
        correct: true,
        why: 'Speculation with a way back, which an ahead-of-time compiler lacks.',
      },
      {
        t: 'Avoid the cost of the conversion',
        why: 'The run-time version pays for converting; Viscosity allocates columns from the start.',
      },
    ],
  },
  {
    q: 'Which of these measured results shows that an element-count threshold alone cannot decide whether a layout pays?',
    options: [
      {
        t: 'At 1,000 elements, AoSoA was often slower than plain objects in V8 microbenchmarks',
        correct: true,
        why: 'Size, layout and engine interact in ways a fixed threshold doesn’t capture.',
      },
      {
        t: 'SoA always wins by 3.8×',
        why: 'The win depends heavily on the suite and size; it is not a constant.',
      },
      {
        t: 'Python and JavaScript gave the same verdict',
        why: 'They gave opposite verdicts: CPython columns lost on time.',
      },
      {
        t: 'Every end-to-end program gained at least 3×',
        why: 'Measured gains were far smaller for some programs: nbody gained 1.2× on Node and 0.97× on Bun.',
      },
    ],
  },
  {
    q: 'For `ps[0] = ps[1]`, an optimiser keeps `ps` as objects and explains “the array is stored into an array”, although `ps` is the target of the store, not the value stored. What kind of problem is that?',
    options: [
      {
        t: 'A soundness bug: the program will behave differently',
        why: 'The array was kept as it was, so the program behaves exactly as written.',
      },
      {
        t: 'A wording bug: the decision is right and the explanation is misleading',
        correct: true,
        why: 'The reason names the wrong operand; a clearer one is “the array is written with an index store”.',
      },
      {
        t: 'An open problem',
        why: 'Saying which operand of a store the array is needs no new idea, only a better sentence.',
      },
      {
        t: 'A cost-model error',
        why: 'The refusal is a safety decision, not a cost one.',
      },
    ],
  },
  {
    q: 'How does a language like Odin approach SoA?',
    options: [
      {
        t: 'It analyses your program and chooses automatically',
        why: 'That is what an automatic optimiser such as Viscosity does.',
      },
      {
        t: 'It converts arrays at run time',
        why: 'That is what the GraalJS research did inside a JIT.',
      },
      {
        t: 'It has no SoA support',
        why: 'It has the `#soa` directive.',
      },
      {
        t: 'You mark the array `#soa` and keep the ordinary indexing syntax',
        correct: true,
        why: '`v_soa[0].x` works on an `#soa` array, and `v_soa.x[0]` reaches the column.',
      },
    ],
  },
];
