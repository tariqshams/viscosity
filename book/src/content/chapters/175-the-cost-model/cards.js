// Chapter 175 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cm-what': {
    q: 'What does a compiler’s cost model estimate?',
    a: 'Whether a (safe) transformation will pay off, so the compiler only makes the profitable ones.',
  },
  'cm-safe-vs-pay': {
    q: 'Why doesn’t Viscosity transform every collection it can prove safe?',
    a: 'A change has costs (generated code, rewritten accesses, harder debugging), and for small or rarely used collections nothing pays them back.',
  },
  'cm-order': {
    q: 'Which rule does `plan()` check first, and what can override it?',
    a: 'Safety: any bailout keeps the collection as objects. Nothing overrides it, not even an annotation.',
  },
  'cm-numeric': {
    q: 'Why does Viscosity keep a collection with no provably numeric field?',
    a: 'Every column would be a plain array, so there are no Float64Array columns, the typed storage that gives much of the measured win.',
  },
  'cm-loop': {
    q: 'Why does Viscosity keep a collection whose fields no loop reads or writes?',
    a: 'Only repeated work can repay the cost of changing the layout.',
  },
  'cm-threshold': {
    q: 'What is the planner’s default minimum size, and which flag changes it?',
    a: '64 elements; `--min-size`.',
  },
  'cm-small': {
    q: 'In this book’s benchmark run, why did SoA gain less at 1,000 elements than at 100,000?',
    a: 'At 1,000 elements the data already fits in cache, so the array of objects wastes less time per element.',
  },
  'cm-estimate': {
    q: 'How does the analysis estimate a collection’s size statically?',
    a: 'Literal elements, plus each push multiplied by the constant trip counts of the loops around it.',
  },
  'cm-unknown': {
    q: 'What happens to a collection whose size is unknown statically?',
    a: 'It passes the size rule: the planner assumes it may be large.',
  },
  'cm-pgo': {
    q: 'What does `--profile prof.json` change in the planner?',
    a: 'A measured size (maxLength) replaces the static estimate in the size rule.',
  },
  'cm-ignores': {
    q: 'Name two things Viscosity’s cost model does not consider.',
    a: 'Any two of: how hot a loop is, how many fields it touches, bounds-check and code costs, AoSoA, and differences between engines.',
  },
};

export const exercises = {
  planFor: {
    title: 'The planner’s ladder',
    prompt:
      'Write `planFor(c, opts)` for a collection summary `c` with `bailouts` (an array of strings), `ann` (`null`, `\'aos\'` or `\'soa\'`), `numeric` (how many fields are provably numeric), `loops` (how many loops touch a field), `size` (the static estimate, or `null` if unknown) and maybe `measured` (a profiled size). `opts` has `mode` (`\'auto\'` or `\'opt-in\'`) and `minSize`. Check the rules in Viscosity’s order and return `[layout, rule]`, where rule is one of `\'unsafe\'`, `\'annotated\'`, `\'opt-in\'`, `\'no-numeric\'`, `\'no-loops\'`, `\'small\'` or `\'soa\'`.',
    starter: `function planFor(c, opts) {
  // Check the rules in order.
  // The first one that matches wins.
  return ['soa', 'soa'];
}`,
    solution: `function planFor(c, opts) {
  if (c.bailouts.length > 0) {
    return ['aos', 'unsafe'];
  }
  if (c.ann) {
    return [c.ann, 'annotated'];
  }
  if (opts.mode === 'opt-in') {
    return ['aos', 'opt-in'];
  }
  if (c.numeric === 0) {
    return ['aos', 'no-numeric'];
  }
  if (c.loops === 0) {
    return ['aos', 'no-loops'];
  }
  const size = c.measured ?? c.size;
  if (size !== null
      && size < opts.minSize) {
    return ['aos', 'small'];
  }
  return ['soa', 'soa'];
}`,
    tests: `const auto = { mode: 'auto', minSize: 64 };
const base = { bailouts: [], ann: null,
  numeric: 2, loops: 1, size: 1000 };
const w = (o) => ({ ...base, ...o });
test('a big, used, numeric one is soa', () => {
  expect(planFor(base, auto))
    .toEqual(['soa', 'soa']);
});
test('a bailout keeps it, annotated or not', () => {
  const c = w({ bailouts: ['x'],
    ann: 'soa' });
  expect(planFor(c, auto))
    .toEqual(['aos', 'unsafe']);
});
test('an annotation beats the size rule', () => {
  const c = w({ ann: 'soa', size: 3 });
  expect(planFor(c, auto))
    .toEqual(['soa', 'annotated']);
});
test('@viscosity aos keeps it', () => {
  expect(planFor(w({ ann: 'aos' }), auto))
    .toEqual(['aos', 'annotated']);
});
test('opt-in keeps unannotated ones', () => {
  const o = { mode: 'opt-in', minSize: 64 };
  expect(planFor(base, o))
    .toEqual(['aos', 'opt-in']);
});
test('no numeric field', () => {
  expect(planFor(w({ numeric: 0 }), auto))
    .toEqual(['aos', 'no-numeric']);
});
test('no loop touches a field', () => {
  expect(planFor(w({ loops: 0 }), auto))
    .toEqual(['aos', 'no-loops']);
});
test('too small', () => {
  expect(planFor(w({ size: 2 }), auto))
    .toEqual(['aos', 'small']);
});
test('an unknown size passes', () => {
  expect(planFor(w({ size: null }), auto))
    .toEqual(['soa', 'soa']);
});
test('a measured size wins', () => {
  const c = w({ size: null, measured: 10 });
  expect(planFor(c, auto))
    .toEqual(['aos', 'small']);
  const d = w({ size: 5, measured: 900 });
  expect(planFor(d, auto))
    .toEqual(['soa', 'soa']);
});`,
    hints: [
      'Write one `if` per rung, in the order of the ladder: bailouts, annotation, opt-in, numeric, loops, size.',
      'For the size, prefer the measured value: `c.measured ?? c.size`.',
      'In JavaScript, `null < 64` is `true`, because `null` becomes `0`. Check for `null` before comparing.',
    ],
    walkthrough: `The ladder is a chain of early returns, and the order is the whole design.

Bailouts come first because safety is not negotiable: an annotation saying soa on an unsafe collection would change what the program does. The annotation comes next because it is the programmer overruling the model, so none of the cost rules may see an annotated collection. That is why an annotated three-element collection is still soa.

Opt-in mode only lets annotated collections through, and they have already returned, so anything reaching that line is kept.

Then the three cost rules. The size rule has two traps. First, \`c.measured ?? c.size\` prefers a profiled size whenever there is one, even if it is larger than the estimate: a measurement beats a guess both ways. Second, an unknown size is \`null\`, and \`null < 64\` is \`true\` in JavaScript, because the comparison turns \`null\` into \`0\`. The real planner writes \`size !== null && size < opts.minSize\` for exactly this reason: an unknown size must pass, not count as zero.`,
    wrong: [
      {
        code: `function planFor(c, opts) {
  if (c.bailouts.length > 0) {
    return ['aos', 'unsafe'];
  }
  if (c.ann) {
    return [c.ann, 'annotated'];
  }
  if (opts.mode === 'opt-in') {
    return ['aos', 'opt-in'];
  }
  if (c.numeric === 0) {
    return ['aos', 'no-numeric'];
  }
  if (c.loops === 0) {
    return ['aos', 'no-loops'];
  }
  const size = c.measured ?? c.size;
  if (size < opts.minSize) {
    return ['aos', 'small'];
  }
  return ['soa', 'soa'];
}`,
        why: 'An unknown size is `null`, and `null < 64` is `true`, so every collection of unknown size is wrongly treated as tiny.',
      },
      {
        code: `function planFor(c, opts) {
  const size = c.measured ?? c.size;
  if (size !== null
      && size < opts.minSize) {
    return ['aos', 'small'];
  }
  if (c.bailouts.length > 0) {
    return ['aos', 'unsafe'];
  }
  if (c.ann) {
    return [c.ann, 'annotated'];
  }
  if (opts.mode === 'opt-in') {
    return ['aos', 'opt-in'];
  }
  if (c.numeric === 0) {
    return ['aos', 'no-numeric'];
  }
  if (c.loops === 0) {
    return ['aos', 'no-loops'];
  }
  return ['soa', 'soa'];
}`,
        why: 'The size rule runs before the annotation, so `// @viscosity soa` on a small collection is ignored. Annotations must come before every cost rule.',
      },
      {
        code: `function planFor(c, opts) {
  if (c.bailouts.length > 0) {
    return ['aos', 'unsafe'];
  }
  if (c.ann) {
    return [c.ann, 'annotated'];
  }
  if (opts.mode === 'opt-in') {
    return ['aos', 'opt-in'];
  }
  if (c.numeric === 0) {
    return ['aos', 'no-numeric'];
  }
  if (c.loops === 0) {
    return ['aos', 'no-loops'];
  }
  const size = c.size ?? c.measured;
  if (size !== null
      && size < opts.minSize) {
    return ['aos', 'small'];
  }
  return ['soa', 'soa'];
}`,
        why: 'This only uses the measurement when there is no estimate. A profile must replace the estimate whenever it exists.',
      },
    ],
  },
  estimate: {
    optional: true,
    title: 'Estimating a size',
    prompt:
      'Write `estimate(lits, pushes)`. `lits` is the number of literal elements. Each push is `{ trips, inFunc }`: `trips` lists the trip count of every loop around it (outermost first), each a number or `null` if not constant, and `inFunc` says whether the push is inside a function. Return the literal count plus, for each push, the product of its trip counts. Return `null` if any trip count is `null` or any push is in a function.',
    starter: `function estimate(lits, pushes) {
  return lits + pushes.length;
}`,
    solution: `function estimate(lits, pushes) {
  let size = lits;
  for (const p of pushes) {
    if (p.inFunc) return null;
    let mult = 1;
    for (const t of p.trips) {
      if (t === null) return null;
      mult *= t;
    }
    size += mult;
  }
  return size;
}`,
    tests: `test('literals only', () => {
  expect(estimate(3, [])).toBe(3);
});
test('a push in one loop', () => {
  const p = { trips: [1000], inFunc: false };
  expect(estimate(0, [p])).toBe(1000);
});
test('nested loops multiply', () => {
  const p = { trips: [10, 20],
    inFunc: false };
  expect(estimate(2, [p])).toBe(202);
});
test('a push outside any loop counts 1', () => {
  const p = { trips: [], inFunc: false };
  expect(estimate(0, [p, p])).toBe(2);
});
test('an unknown bound', () => {
  const p = { trips: [null],
    inFunc: false };
  expect(estimate(5, [p])).toBe(null);
});
test('a push in a function', () => {
  const p = { trips: [10], inFunc: true };
  expect(estimate(0, [p])).toBe(null);
});`,
    hints: [
      'Start from `lits` and add one product per push.',
      'A push with no loops around it has an empty `trips` list: its product is 1.',
      'Return `null` as soon as anything is unknown.',
    ],
    walkthrough: `This is the same rule as the size estimate in \`core/src/analysis.ts\`: a push contributes one element per iteration of every loop around it, so nested trip counts multiply, and a push with no loop contributes exactly one.

The two \`null\` cases are where the estimate gives up. A loop bound that is not a constant could be anything. A push inside a function runs once per call, and the analysis doesn't count calls. The planner treats \`null\` as “may be large”, which is the optimistic choice described in the chapter, and the reason a profile helps.`,
    wrong: [
      {
        code: `function estimate(lits, pushes) {
  let size = lits;
  for (const p of pushes) {
    let mult = 1;
    for (const t of p.trips) {
      mult *= t;
    }
    size += mult;
  }
  return size;
}`,
        why: '`null` in a multiplication becomes `0`, so an unknown loop silently counts as zero pushes instead of making the size unknown.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A collection is safe to transform, has numeric fields, and a loop reads them. Static analysis estimates 20 elements. With default options, what does Viscosity do?',
    options: [
      { t: 'Transforms it to SoA, because it is safe.', why: 'Safe only means it may. The size rule comes after safety.' },
      { t: 'Keeps it as an array of objects, below the 64-element threshold.', correct: true, why: 'Right: 20 < 64, so the size rule keeps it and explain says “about 20 elements: below the 64-element threshold”.' },
      { t: 'Chooses AoSoA, the compromise for small collections.', why: 'The planner never chooses AoSoA by itself; only an annotation can.' },
      { t: 'Reports an error asking for an annotation.', why: 'Nothing is an error here; the planner records a reason and moves on.' },
    ],
  },
  {
    q: 'A collection has a bailout and is annotated `// @viscosity soa`. What happens?',
    options: [
      { t: 'It is kept, with an “unsafe: …” reason.', correct: true, why: 'Safety is the first rung, checked before annotations, so even an explicit request cannot make an unsafe change.' },
      { t: 'It becomes SoA, because the programmer asked.', why: 'An annotation overrides the cost model, not the safety analysis. Transforming it could change what the program does.' },
      { t: 'It becomes SoA with extra bounds checks.', why: 'Bounds checks protect proven-safe transforms from out-of-range indexes. They don’t make an unsafe use safe.' },
    ],
  },
  {
    q: 'Why does a collection with only string fields stay an array of objects?',
    options: [
      { t: 'Strings cannot be stored in arrays.', why: 'They can: Viscosity does use plain-array columns for non-numeric fields when it transforms.' },
      { t: 'The safety analysis forbids strings.', why: 'Strings are safe. The reason is the cost rule, “no field is provably numeric”.' },
      { t: 'There would be no typed Float64Array columns, which give much of the measured win.', correct: true, why: 'Yes. With plain-array columns only, the planner expects too little gain: “no typed columns to gain”.' },
    ],
  },
  {
    q: 'The static size of a collection is unknown, because its pushes are inside a function. What does the size rule do?',
    options: [
      { t: 'Treats it as 0 and keeps the collection.', why: 'That is the bug the real code avoids by checking `size !== null` first.' },
      { t: 'Asks the user to run the profiler.', why: 'Nothing is asked. A profile is optional input.' },
      { t: 'Refuses to plan the collection at all.', why: 'Unknown size isn’t a bailout; the collection still gets a plan.' },
      { t: 'Lets it pass, assuming it may be large.', correct: true, why: 'Right: an unknown size passes the threshold, and explain says “size unknown statically”.' },
    ],
  },
  {
    q: 'What does the 64-element default rest on?',
    options: [
      { t: 'A measured crossover point below which SoA is slower.', why: 'The benchmark never measured below 1,000 elements, where SoA still won.' },
      { t: 'A conservative judgment that tiny collections fit in cache and finish too fast to matter.', correct: true, why: 'Yes. The benchmarks show the gain shrinking with size, but 64 itself is a judgment, adjustable with --min-size.' },
      { t: 'The size of one cache line.', why: 'A cache line is 64 bytes, not 64 elements. The same number is a coincidence.' },
    ],
  },
  {
    q: 'Which of these does the current cost model weigh?',
    options: [
      { t: 'How many times the loop that reads the fields runs.', why: 'Trip counts are recorded but not used by the planner: any loop counts.' },
      { t: 'How many of the fields each loop touches.', why: 'Explain prints it (“touches 1 of 2 fields”), but the planner doesn’t use it.' },
      { t: 'Whether any field is provably numeric.', correct: true, why: 'Yes, that is one of its three rules, with “a loop touches a field” and the size threshold.' },
      { t: 'The cost of the bounds checks it will insert.', why: 'Bounds checks don’t enter the model.' },
    ],
  },
];
