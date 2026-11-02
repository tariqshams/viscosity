// Chapter 114 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rep-why': {
    q: 'Why does an optimiser that rewrites programs need a second output besides the code?',
    a: 'Without it you can’t tell whether it found nothing, gave up, or changed the wrong thing, short of reading the generated code.',
  },
  'rep-verdict': {
    q: 'In a `viscosity explain` report, what does the first line of a collection’s entry contain?',
    a: 'The variable, the line that created it, its fields in shape order, and the layout chosen.',
  },
  'rep-loops': {
    q: 'A loop on line 5 that reads fields of `es` sits inside a loop on line 4 that touches no field itself. Why does `viscosity explain` list only the line-5 loop?',
    a: 'Loops are listed by where the field accesses are. The outer loop touches no field itself.',
  },
  'rep-bounds': {
    q: 'A `viscosity explain` report says “4 of 9 element accesses proven in bounds”. What does that tell you about the compiled code?',
    a: 'The other 5 accesses get a bounds check, so they throw the same TypeError the original would.',
  },
  'rep-what': {
    q: 'What is an optimisation report?',
    a: 'A compiler output that explains every decision it made, changed or kept, with the evidence for each.',
  },
  'rep-same-data': {
    q: 'Why does Viscosity’s `explain()` print reasons the planner recorded, instead of working them out itself?',
    a: 'So the explanation can’t drift from the decision: it is the same data.',
  },
  'rep-order': {
    q: 'A safe, unannotated collection has no numeric field and also only 2 elements. Which reason does its `viscosity explain` report give?',
    a: '“no field is provably numeric”: the planner reports the first check that fails, and the numeric check comes before the size.',
  },
  'rep-act': {
    q: '`viscosity explain` says “line 5: an element is passed to a method call” for `console.log(ps[3])`. What change lets Viscosity transform `ps`?',
    a: 'Print fields instead of the element, e.g. `console.log(ps[3].x)`, so no real element object is needed.',
  },
};

export const examples = {
  'mini-planner': {
    title: 'A planner that says why',
    code: `// Decide, and say why, in one step.
function plan(c) {
  const out = { name: c.name };
  const keep = (why) => {
    out.verdict = 'kept as objects';
    out.reasons = [why];
    return out;
  };
  if (c.unsafe)
    return keep('unsafe: ' + c.unsafe);
  if (c.numeric === 0)
    return keep('no numeric field');
  if (c.size < 64)
    return keep('about ' + c.size +
      ' elements: below 64');
  out.verdict = 'struct of arrays';
  out.reasons = ['about ' + c.size +
    ' elements'];
  return out;
}
const cs = [
  { name: 'ps', unsafe: '',
    numeric: 2, size: 1000 },
  { name: 'log', unsafe: 'escapes',
    numeric: 1, size: 5000 },
  { name: 'pts', unsafe: '',
    numeric: 2, size: 2 },
];
for (const c of cs) {
  const p = plan(c);
  console.log(p.name + ' → ' +
    p.verdict);
  for (const r of p.reasons)
    console.log('  · ' + r);
}`,
  },
};

export const exercises = {
  formatReport: {
    title: 'Format an explain report',
    prompt: 'Write `formatReport(ds)`. `ds` is a list of decisions `{ name, line, fields, layout, blockSize, reasons }`. For each, print a verdict line `NAME (line LINE) {F1, F2} → VERDICT`, where VERDICT is `kept as array of objects` for `aos`, `struct of arrays` for `soa`, and `AoSoA, blocks of N` for `aosoa` (N is `blockSize`). Then one line per reason: two spaces, `·`, a space, the reason. Join all lines with `\\n`.',
    starter: `function formatReport(ds) {
  const lines = [];
  for (const d of ds) {
    lines.push(d.name + ' ' + d.layout);
  }
  return lines.join('\\n');
}`,
    solution: `function verdict(d) {
  if (d.layout === 'aos') {
    return 'kept as array of objects';
  }
  if (d.layout === 'soa') {
    return 'struct of arrays';
  }
  return 'AoSoA, blocks of ' +
    d.blockSize;
}

function formatReport(ds) {
  const lines = [];
  for (const d of ds) {
    const fs = d.fields.join(', ');
    lines.push(d.name + ' (line ' +
      d.line + ') {' + fs + '} → ' +
      verdict(d));
    for (const r of d.reasons) {
      lines.push('  · ' + r);
    }
  }
  return lines.join('\\n');
}`,
    tests: `const kept = { name: 'ps', line: 2, fields: ['x', 'y'], layout: 'aos', blockSize: 0, reasons: ['no loop reads or writes its fields'] };
const soa = { name: 'es', line: 5, fields: ['hp', 'x'], layout: 'soa', blockSize: 0, reasons: ['about 300 elements', '4 of 9 element accesses proven in bounds'] };
test('a kept collection', () => {
  expect(formatReport([kept])).toBe('ps (line 2) {x, y} → kept as array of objects\\n  · no loop reads or writes its fields');
});
test('a transformed collection, two reasons', () => {
  expect(formatReport([soa])).toBe('es (line 5) {hp, x} → struct of arrays\\n  · about 300 elements\\n  · 4 of 9 element accesses proven in bounds');
});
test('AoSoA shows its block size', () => {
  const d = { name: 'ps', line: 3, fields: ['x'], layout: 'aosoa', blockSize: 8, reasons: [] };
  expect(formatReport([d])).toBe('ps (line 3) {x} → AoSoA, blocks of 8');
});
test('several collections, in order', () => {
  expect(formatReport([kept, soa]).split('\\n').length).toBe(5);
  expect(formatReport([kept, soa]).split('\\n')[2]).toBe('es (line 5) {hp, x} → struct of arrays');
});
test('nothing found', () => {
  expect(formatReport([])).toBe('');
});`,
    hints: [
      'Write a small helper `verdict(d)` that turns `d.layout` (and `d.blockSize`) into the words after the arrow.',
      'The verdict line is `name + \' (line \' + line + \') {\' + fields.join(\', \') + \'} → \' + verdict`.',
      'Then push `\'  · \' + r` for each reason, and join everything with `\\n` once at the end.',
    ],
    walkthrough: `**How to think about it.** This is \`explain()\` from \`core/src/plan.ts\`, written with \`+\` instead of template literals. Notice first what it does *not* do: it decides nothing. All the judgement happened in the planner, which stored its reasons in the decision; this function only turns data into text. So start from the output you want for one decision, \`ps (line 2) {x, y} → kept as array of objects\` followed by \`  · no loop reads or writes its fields\`, and build it piece by piece.

**The solution, line by line.**

- \`function verdict(d) {\` is a helper for the words after the arrow, so the main loop stays readable.
- \`if (d.layout === 'aos') return 'kept as array of objects';\` and \`if (d.layout === 'soa') return 'struct of arrays';\` translate the planner's internal names into words a reader understands.
- \`return 'AoSoA, blocks of ' + d.blockSize;\` is the only verdict with a number in it.
- \`function formatReport(ds) {\` and \`const lines = [];\` start an array of output lines.
- \`for (const d of ds) {\` visits each decision, in the order the planner made them.
- \`const fs = d.fields.join(', ');\` gives \`x, y\`, with a space after each comma (an array turned into a string directly would give \`x,y\`).
- \`lines.push(d.name + ' (line ' + d.line + ') {' + fs + '} → ' + verdict(d));\` is the verdict line.
- \`for (const r of d.reasons) lines.push('  · ' + r);\` adds one indented line per stored reason.
- \`return lines.join('\\n');\` joins once at the end: no trailing newline, and an empty list gives \`''\` for free (the CLI then prints "No arrays of objects found.").

**Common wrong attempts.**

- Building one string with \`+= ... + '\\n'\` leaves a stray newline at the end, which a byte-for-byte test catches at once.
- A two-way \`aos ? ... : 'struct of arrays'\` reports an AoSoA collection as a struct of arrays and loses its block size.
- Printing \`d.layout\` itself shows \`aos\`, the internal name, and \`'{' + d.fields\` prints \`x,y\` without the space.`,
    wrong: [
      {
        code: `function formatReport(ds) {
  let out = '';
  for (const d of ds) {
    const fs = d.fields.join(', ');
    out += d.name + ' (line ' + d.line +
      ') {' + fs + '} → ' +
      (d.layout === 'aos'
        ? 'kept as array of objects'
        : 'struct of arrays') + '\\n';
    for (const r of d.reasons) {
      out += '  · ' + r + '\\n';
    }
  }
  return out;
}`,
        why: 'Two problems: every report ends with a stray newline, and an AoSoA collection is reported as a struct of arrays, without its block size.',
      },
      {
        code: `function formatReport(ds) {
  const lines = [];
  for (const d of ds) {
    lines.push(d.name + ' (line ' +
      d.line + ') {' + d.fields +
      '} → ' + d.layout);
    for (const r of d.reasons) {
      lines.push('  · ' + r);
    }
  }
  return lines.join('\\n');
}`,
        why: 'It prints the internal layout name (`aos`) instead of the words a reader understands, and `{` + an array gives `x,y` without the space.',
      },
    ],
  },
  whyKept: {
    optional: true,
    title: 'Why was it kept?',
    prompt: 'Write `whyKept(c, min)`, a mini planner. `c` is `{ unsafe, numeric, loops, size }`: a list of unsafe uses (strings), the number of numeric fields, the number of loops over its fields, and the size (a number or `null`). Return the list of reasons to keep it, or `null` to transform it. Check in order, stopping at the first that applies: any unsafe uses give `\'unsafe: \' + u` for **each** one; no numeric field gives `[\'no numeric field\']`; no loops gives `[\'no loop over its fields\']`; a known size below `min` gives `[\'too small: SIZE < MIN\']`.',
    starter: `function whyKept(c, min) {
  if (c.size < min) {
    return ['too small: ' + c.size +
      ' < ' + min];
  }
  return null;
}`,
    solution: `function whyKept(c, min) {
  if (c.unsafe.length > 0) {
    return c.unsafe.map(
      (u) => 'unsafe: ' + u);
  }
  if (c.numeric === 0) {
    return ['no numeric field'];
  }
  if (c.loops === 0) {
    return ['no loop over its fields'];
  }
  if (c.size !== null && c.size < min) {
    return ['too small: ' + c.size +
      ' < ' + min];
  }
  return null;
}`,
    tests: `const ok = { unsafe: [], numeric: 2, loops: 1, size: 1000 };
test('transform when nothing stops it', () => {
  expect(whyKept(ok, 64)).toBe(null);
});
test('every unsafe use is listed', () => {
  const c = { ...ok, unsafe: ['escapes at line 5', 'pop at line 7'] };
  expect(whyKept(c, 64)).toEqual(['unsafe: escapes at line 5', 'unsafe: pop at line 7']);
});
test('safety before everything else', () => {
  const c = { unsafe: ['escapes'], numeric: 0, loops: 0, size: 2 };
  expect(whyKept(c, 64)).toEqual(['unsafe: escapes']);
});
test('numeric before loops before size', () => {
  expect(whyKept({ ...ok, numeric: 0, size: 2 }, 64)).toEqual(['no numeric field']);
  expect(whyKept({ ...ok, loops: 0, size: 2 }, 64)).toEqual(['no loop over its fields']);
  expect(whyKept({ ...ok, size: 2 }, 64)).toEqual(['too small: 2 < 64']);
});
test('unknown size does not stop it', () => {
  expect(whyKept({ ...ok, size: null }, 64)).toBe(null);
});`,
    hints: [
      'Use a chain of `if`s that each `return`, in the order given: unsafe, numeric, loops, size.',
      'For unsafe uses, `map` every one to `\'unsafe: \' + u`, so the reader sees all of them.',
      'A `null` size means unknown: the threshold can’t apply, so it doesn’t stop the transform.',
    ],
    walkthrough: `**How to think about it.** This is the shape of \`plan()\` in \`core/src/plan.ts\`, without annotations and modes. The order of the checks is the policy: safety first, because nothing may override it; then the checks that say "no gain is possible" (no numeric field, no loop); and last the size, which is a judgement call and the only place a profile matters. Each check that fails returns at once, with its reason, so a collection can never be kept silently.

**The solution, line by line.**

- \`if (c.unsafe.length > 0) return c.unsafe.map((u) => 'unsafe: ' + u);\` lists *every* unsafe use, because they are usually separate problems the programmer will want to fix together.
- \`if (c.numeric === 0) return ['no numeric field'];\` stops at the first "no gain" reason: once there is nothing to put in a typed column, it does not matter that there is also no loop.
- \`if (c.loops === 0) return ['no loop over its fields'];\` comes next.
- \`if (c.size !== null && c.size < min) return ['too small: ' + c.size + ' < ' + min];\` applies the threshold only to a known size.
- \`return null;\` means nothing stopped it: transform.

**Common wrong attempts.**

- Collecting every failed check gives a tiny, loop-free, unsafe collection four reasons; only the unsafe uses are listed in full.
- Comparing \`c.size < min\` without the \`null\` test reports an unknown size as "too small: null < 64", because \`null < 64\` is \`true\` in JavaScript (\`null\` becomes 0 in a comparison).`,
    wrong: [
      {
        code: `function whyKept(c, min) {
  const r = [];
  for (const u of c.unsafe) {
    r.push('unsafe: ' + u);
  }
  if (c.numeric === 0) {
    r.push('no numeric field');
  }
  if (c.loops === 0) {
    r.push('no loop over its fields');
  }
  if (c.size !== null && c.size < min) {
    r.push('too small: ' + c.size +
      ' < ' + min);
  }
  return r.length ? r : null;
}`,
        why: 'It lists every failed check, not the first: a tiny, loop-free, unsafe collection gets four reasons. Only the unsafe uses are listed in full; after that the first failure is the verdict.',
      },
      {
        code: `function whyKept(c, min) {
  if (c.unsafe.length > 0) {
    return c.unsafe.map(
      (u) => 'unsafe: ' + u);
  }
  if (c.numeric === 0) {
    return ['no numeric field'];
  }
  if (c.loops === 0) {
    return ['no loop over its fields'];
  }
  if (c.size < min) {
    return ['too small: ' + c.size +
      ' < ' + min];
  }
  return null;
}`,
        why: '`null < 64` is `true`, so an unknown size is reported as “too small: null < 64”. Check for `null` before comparing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does Viscosity’s `explain()` function (in `core/src/plan.ts`) compute?',
    options: [
      {
        t: 'It re-runs the safety analysis to justify each decision',
        why: 'It analyses nothing; that would be a second copy of the logic.',
      },
      {
        t: 'It only formats the reasons the planner already recorded',
        correct: true,
        why: 'Verdict line from the plan, then one `·` line per stored reason.',
      },
      {
        t: 'It compares the compiled code against the original',
        why: 'That is the differential test.',
      },
      {
        t: 'It measures each loop',
        why: 'Nothing is measured; profiling is a separate command.',
      },
    ],
  },
  {
    q: 'A `viscosity explain` report says `· 7 of 9 element accesses proven in bounds` (with the default `--bounds check`). What follows?',
    options: [
      {
        t: '2 accesses may be out of bounds, so Viscosity refused to transform',
        why: 'Unproven accesses don’t block the transform; they get checks.',
      },
      {
        t: 'The program has 2 bugs',
        why: 'The accesses may be perfectly fine; they just weren’t proven.',
      },
      {
        t: 'The compiled code checks 2 accesses so they fail exactly as the original would',
        correct: true,
        why: 'A check throws the same TypeError reading past the end of an array of objects throws.',
      },
      {
        t: 'Those 2 accesses read 0',
        why: 'Only with `--bounds assume`, which the report would not call proven either.',
      },
    ],
  },
  {
    q: 'A collection is passed to `console.log` and also has fewer elements than the size threshold. What does its `viscosity explain` report say?',
    options: [
      {
        t: 'Only that it is too small',
        why: 'Size is the last check; safety comes first.',
      },
      {
        t: 'Both reasons',
        why: 'After the unsafe uses, the planner stops: it reports every unsafe use, not every failed check.',
      },
      {
        t: 'Nothing: kept collections aren’t reported',
        why: 'Every collection gets a verdict line and a reason.',
      },
      {
        t: 'The unsafe use only',
        correct: true,
        why: 'Safety is checked first, and the planner stops at the first kind of failure.',
      },
    ],
  },
  {
    q: 'In Viscosity’s planner, why is it valuable that `keep(...)` always receives the reason?',
    options: [
      {
        t: 'A collection can never be kept without the report saying why',
        correct: true,
        why: 'The decision and its explanation are created by the same line of code.',
      },
      {
        t: 'It makes the planner faster',
        why: 'Speed isn’t the point.',
      },
      {
        t: 'It lets the CLI skip the explain step',
        why: 'The explain step is just formatting either way.',
      },
      {
        t: 'It hides internal details from users',
        why: 'The opposite: it exposes the evidence.',
      },
    ],
  },
];
