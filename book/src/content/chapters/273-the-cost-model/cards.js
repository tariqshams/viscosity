// Chapter 273 cards. Keys are stable ids: never rename them.

export const prompts = {
  'cm-what': {
    q: 'What does a compiler’s cost model estimate?',
    a: 'Whether a (safe) transformation will pay off, so the compiler only makes the profitable ones.',
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
    walkthrough: `**How to think about it.** The planner is a list of questions asked in a fixed order, where the first "yes" ends the conversation. In code, that shape is a chain of \`if\` statements, each one returning straight away; the only real decision is the order, so before writing anything, write the order down: unsafe, annotated, opt-in, no numeric field, no loop, too small, and otherwise soa. Then ask, for each rung, what data in \`c\` or \`opts\` answers it.

**The solution, line by line.**

- \`if (c.bailouts.length > 0) {\` asks the safety question first. Any bailout at all means the layout change could be noticed, so \`return ['aos', 'unsafe'];\` keeps the objects. Nothing later can undo this, which is the point of putting it first.
- \`if (c.ann) {\` comes second: \`null\` is falsy, so this is true only when there is an annotation. \`return [c.ann, 'annotated'];\` uses the annotated layout as it is, \`'aos'\` or \`'soa'\`, and skips every cost rule below. That is why the test with \`ann: 'soa', size: 3\` must come out as soa.
- \`if (opts.mode === 'opt-in') {\` keeps everything that reached this line, because every annotated collection has already returned; \`return ['aos', 'opt-in'];\`.
- \`if (c.numeric === 0) {\` is the first cost rule: no typed columns to gain, so \`return ['aos', 'no-numeric'];\`.
- \`if (c.loops === 0) {\` is the second: no repeated work to win back the cost, so \`return ['aos', 'no-loops'];\`.
- \`const size = c.measured ?? c.size;\` picks the size to judge by. \`??\` gives its left side unless that is \`null\` or \`undefined\`, so a measured size always wins when there is one, bigger or smaller than the estimate.
- \`if (size !== null && size < opts.minSize) {\` is the size rule, with a guard: an unknown size is \`null\` and must pass. \`return ['aos', 'small'];\` otherwise.
- \`return ['soa', 'soa'];\` is the bottom of the ladder: every answer was "no".

**Common wrong attempts.**

- Leaving out \`size !== null\`. In JavaScript \`null < 64\` is \`true\`, because the comparison turns \`null\` into \`0\`, so every collection of unknown size would be called tiny; the real planner has the same guard for the same reason.
- Checking the size before the annotation. Then \`// @viscosity soa\` on a small collection is ignored, which defeats the purpose of an annotation: overruling the cost model.
- Writing \`c.size ?? c.measured\`. That uses the measurement only when there is no estimate, so a profile that says 10 cannot overrule an estimate of 1000; a measurement must beat a guess both ways.`,
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
    walkthrough: `**How to think about it.** Picture each push and ask "how many times does this line run?". Outside any loop, once. Inside one loop of 1000 trips, 1000 times. Inside a loop of 20 trips holding a loop of 30, \`20 × 30\` times, because the inner loop runs all 30 trips on each outer trip. So each push contributes the *product* of its loops' trip counts, and the size is the literals plus the sum of those products. The two \`null\` cases are where you cannot answer the question: a loop bound that is not a constant, and a push inside a function (which runs once per call, and nobody has counted the calls).

**The solution, line by line.**

- \`let size = lits;\` starts from the elements written in the array literal.
- \`for (const p of pushes) {\` visits each push.
- \`if (p.inFunc) return null;\` gives up at once for a push in a function: the whole estimate is unknown, not just this push's share.
- \`let mult = 1;\` starts the product at 1, the value that changes nothing when you multiply by it; a push with no loops keeps it, and counts once.
- \`for (const t of p.trips) {\` goes through the loops around the push.
- \`if (t === null) return null;\` gives up on a loop whose bound is not a constant.
- \`mult *= t;\` multiplies in this loop's trips.
- \`size += mult;\` adds this push's share, and after the loop \`return size;\` hands back the total.

This is the rule in section 5 of \`core/src/analysis.ts\`, which also uses \`known = false\` for the same two cases; the planner then treats \`null\` as "may be large", which is why a profile helps.

**Common wrong attempts.**

- Multiplying without the \`null\` check. \`1 * null\` is \`0\`, so an unknown loop quietly counts as no pushes at all, and a collection that might hold a million elements is estimated at zero.
- Adding the trip counts instead of multiplying them: \`10 + 20\` for nested loops gives 30, when the push really runs 200 times.
- Starting \`mult\` at 0, which makes every product 0.`,
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
