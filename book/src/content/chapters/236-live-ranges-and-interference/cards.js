// Cards for "Live ranges and interference": recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'share-when': {
    q: 'When can two virtual registers share one real register?',
    a: 'When they are never both needed at the same moment, so one is always finished with before the other begins.',
  },
  'range-what': {
    q: 'What is a value’s **live range**?',
    a: 'The set of program points where it is live: from where some path still reaches a use of it without a new definition.',
  },
  'n-whole-loop': {
    q: 'A loop’s bound `n` is read only by the loop test at the top of the loop, and never reassigned. Why is `n` live throughout the loop body too?',
    a: 'Every trip comes back to the test, so from anywhere in the body some path still reaches a read of n.',
  },
  'range-pieces': {
    q: 'Must a live range be one unbroken stretch of code?',
    a: 'No: it can have gaps where nothing will read the current value, and it can run round loops.',
  },
  'interfere-what': {
    q: 'When do two values **interfere**?',
    a: 'When one is defined at a point where the other is live (and the definition is not a copy of the other), so they cannot share a register.',
  },
  'def-rule': {
    q: 'Building an interference graph by Chaitin’s rule: at an instruction defining `d`, which values get an edge to `d`?',
    a: 'Every value live just after the instruction, other than d itself (and other than the source, if it is a copy).',
  },
  'copy-rule': {
    q: 'Building an interference graph, why does the copy `mv d, s` itself add no edge between d and s?',
    a: 'Just after the copy they hold the same value, so one register can hold both (if they get it, the mv disappears); an edge can still come from a later definition of either while the other is live.',
  },
  'clique-needs': {
    q: 'In an interference graph, four values are all joined to one another. What does that say about the registers needed?',
    a: 'At least four: each of the four must be in a different register from the other three.',
  },
};

export const examples = {
  walk: {
    title: 'Walking backwards through the loop body',
    code: `// sumsq's loop body: [text, def, uses].
const b2 = [
  ['mul  t, i1, i1', 't', ['i1']],
  ['add  s2, s1, t', 's2', ['s1', 't']],
  ['addi i2, i1, 1', 'i2', ['i1']],
  ['mv   s1, s2', 's1', ['s2']],
  ['mv   i1, i2', 'i1', ['i2']],
  ['j    b1', null, []],
];
// Live out of b2 = live into b1.
const live = new Set(['i1', 'n', 's1']);
for (let k = b2.length - 1; k >= 0;
  k--) {
  const [text, def, uses] = b2[k];
  const after = [...live].sort();
  console.log(text.padEnd(15),
    'live after:', after.join(' '));
  if (def) live.delete(def);
  for (const u of uses) live.add(u);
}
const into = [...live].sort().join(' ');
console.log('live into b2:', into);`,
  },
};

export const exercises = {
  interfere: {
    title: 'Find the interference edges of a block',
    prompt: 'Finish `interfere(code, liveOut)`. `code` is a block as an array of instructions `{ def, uses, copy }` (`def` may be missing, as for a jump; `copy: true` marks a `mv` whose source is `uses[0]`), and `liveOut` is the list of values live at the end of the block. The starter already walks backwards and keeps the live set. Add the edges: at each instruction that defines `def`, add an edge between `def` and every value live just after it, except `def` itself and, for a copy, its source. Use the helper `edge(a, b)`. The function returns the edges sorted, each as `\'a-b\'` with the two names in alphabetical order.',
    starter: `// Each instruction is { def, uses,
// copy }. Returns one block's edges as
// sorted strings like 'a-b'.
function interfere(code, liveOut) {
  const live = new Set(liveOut);
  const edges = new Set();
  const edge = (a, b) =>
    edges.add([a, b].sort().join('-'));
  for (let k = code.length - 1; k >= 0;
    k--) {
    const { def, uses, copy } = code[k];
    if (def) {
      // TODO: def interferes with each
      // value live after this line but
      // itself and a copy's source.
      live.delete(def);
    }
    for (const u of uses) live.add(u);
  }
  return [...edges].sort();
}`,
    solution: `// Each instruction is { def, uses,
// copy }. Returns one block's edges as
// sorted strings like 'a-b'.
function interfere(code, liveOut) {
  const live = new Set(liveOut);
  const edges = new Set();
  const edge = (a, b) =>
    edges.add([a, b].sort().join('-'));
  for (let k = code.length - 1; k >= 0;
    k--) {
    const { def, uses, copy } = code[k];
    if (def) {
      for (const x of live) {
        if (x === def) continue;
        if (copy && x === uses[0]) {
          continue;
        }
        edge(def, x);
      }
      live.delete(def);
    }
    for (const u of uses) live.add(u);
  }
  return [...edges].sort();
}`,
    tests: `const b2 = [
  { def: 't', uses: ['i1', 'i1'] },
  { def: 's2', uses: ['s1', 't'] },
  { def: 'i2', uses: ['i1'] },
  { def: 's1', uses: ['s2'], copy: true },
  { def: 'i1', uses: ['i2'], copy: true },
  { uses: [] },
];
test('sumsq b2 has eleven edges', () => {
  expect(interfere(b2, ['i1', 'n', 's1']))
    .toEqual(['i1-n', 'i1-s1', 'i1-s2',
      'i1-t', 'i2-n', 'i2-s1', 'i2-s2',
      'n-s1', 'n-s2', 'n-t', 's1-t']);
});
test('a value dying at a def: no edge', () => {
  const c = [{ def: 'b', uses: ['a'] }];
  expect(interfere(c, ['b'])).toEqual([]);
});
test('a copy does not join source and dest', () => {
  const c = [
    { def: 'b', uses: ['a'], copy: true },
  ];
  expect(interfere(c, ['a', 'b']))
    .toEqual([]);
});
test('an add that is not a copy does', () => {
  const c = [{ def: 'b', uses: ['a'] }];
  expect(interfere(c, ['a', 'b']))
    .toEqual(['a-b']);
});
test('a dead definition still interferes', () => {
  const c = [{ def: 'x', uses: [] }];
  expect(interfere(c, ['y'])).toEqual(['x-y']);
});`,
    hints: [
      'The edges must be added *before* `live.delete(def)` and before the uses are added, because they are about what is live just after this instruction.',
      'Loop over `live`. Skip `x === def`. If the instruction is a copy, also skip `x === uses[0]`. Call `edge(def, x)` for the rest.',
      'Inside `if (def) {`: `for (const x of live) { if (x === def) continue; if (copy && x === uses[0]) continue; edge(def, x); }`.',
    ],
    walkthrough: `**How to think about it.** The walk is the liveness walk of *Liveness*, run backwards through one block: at the bottom, the live set is \`liveOut\`; above each instruction, remove what it defines and add what it reads. At the moment we are *at* an instruction, before updating, \`live\` holds exactly the values live just after it. Those are the values that must survive while this instruction writes its result, so the result's register must differ from all of theirs: one edge each. The copy rule removes one edge, and that is all.

**The solution, line by line.**

- \`const live = new Set(liveOut);\` starts the walk at the bottom of the block.
- \`const edges = new Set();\` holds edges as strings, so adding the same edge twice keeps one; \`edge(a, b)\` sorts the two names, so \`t-i1\` and \`i1-t\` are the same string.
- \`for (let k = code.length - 1; k >= 0; k--) {\` walks from the last instruction to the first.
- \`const { def, uses, copy } = code[k];\` takes the instruction apart.
- \`if (def) {\` only a definition creates edges.
- \`for (const x of live) {\` looks at everything live just after this instruction (we have not updated \`live\` yet).
- \`if (x === def) continue;\` a value does not interfere with itself.
- \`if (copy && x === uses[0]) { continue; }\` is the copy rule: after \`mv d, s\`, \`d\` and \`s\` are equal, so no edge.
- \`edge(def, x);\` records the interference.
- \`live.delete(def);\` above the instruction, \`def\` is no longer live (this line made it).
- \`for (const u of uses) live.add(u);\` and what it reads is live above it.
- \`return [...edges].sort();\` turns the set into a sorted list.

For sumsq's b2, walking up from \`{i1, n, s1}\` gives the eleven edges of the stepper. Two of the small tests are worth a look. In "a value dying at a def", \`b\` is computed from \`a\` and \`a\` is not live afterwards, so no edge: \`b\` may even reuse \`a\`'s register. In "a dead definition still interferes", \`x\` is never used, but writing it still destroys whatever its register held, so it must not share with the live \`y\`: the edge comes from the definition, not from \`x\` being live.

**Common wrong attempts.**

- Leaving out the copy rule: every \`mv\` then joins its source and destination, and the allocator could never make a copy disappear; the sumsq test gains \`i1-i2\` and \`s1-s2\`.
- Adding the uses to \`live\` before looking for edges: that uses the live set *before* the instruction instead of after, and wrongly joins \`b\` with \`a\` in \`b = a * 2\`.`,
    wrong: [
      {
        code: `// Each instruction is { def, uses,
// copy }. Returns one block's edges as
// sorted strings like 'a-b'.
function interfere(code, liveOut) {
  const live = new Set(liveOut);
  const edges = new Set();
  const edge = (a, b) =>
    edges.add([a, b].sort().join('-'));
  for (let k = code.length - 1; k >= 0;
    k--) {
    const { def, uses, copy } = code[k];
    if (def) {
      for (const x of live) {
        if (x === def) continue;
        edge(def, x);
      }
      live.delete(def);
    }
    for (const u of uses) live.add(u);
  }
  return [...edges].sort();
}`,
        why: 'This forgets the copy rule, so each mv joins its source and destination (i1-i2 and s1-s2 appear for sumsq).',
      },
      {
        code: `// Each instruction is { def, uses,
// copy }. Returns one block's edges as
// sorted strings like 'a-b'.
function interfere(code, liveOut) {
  const live = new Set(liveOut);
  const edges = new Set();
  const edge = (a, b) =>
    edges.add([a, b].sort().join('-'));
  for (let k = code.length - 1; k >= 0;
    k--) {
    const { def, uses, copy } = code[k];
    for (const u of uses) live.add(u);
    if (def) {
      for (const x of live) {
        if (x === def) continue;
        if (copy && x === uses[0]) {
          continue;
        }
        edge(def, x);
      }
      live.delete(def);
    }
    for (const u of uses) live.add(u);
  }
  return [...edges].sort();
}`,
        why: 'This adds the uses before looking for edges, so it compares the definition with what is live *before* the instruction: in `b = a * 2`, b wrongly interferes with a.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `a = p + 1; b = a * 2; return b`, do a and b interfere?',
    options: [
      {
        t: 'Yes: they are in neighbouring lines',
        why: 'Being near each other is not enough; one must be live where the other is defined.',
      },
      {
        t: 'No: a is dead after the line that defines b',
        correct: true,
        why: 'Live after `b = a * 2` is only b, so no edge; b may even reuse a’s register.',
      },
      {
        t: 'Only if they are both used by return',
        why: 'return reads only b.',
      },
    ],
  },
  {
    q: 'A loop body is `add s2, s1, t; addi i2, i1, 1; mv s1, s2; mv i1, i2; j b1`. Why is there no interference edge between s1 and s2, although both appear in `mv s1, s2`?',
    options: [
      {
        t: 'Because a copy makes its source and destination equal, so the copy rule adds no edge',
        correct: true,
        why: 'They may share a register, and then the mv is a copy of a register to itself.',
      },
      {
        t: 'Because s2 is dead before the mv',
        why: 's2 is read by the mv, so it is live just before it.',
      },
      {
        t: 'Because they are versions of the same source variable',
        why: 'Names do not matter; i1 and i2 are also versions of i, and i2 and s1 interfere.',
      },
    ],
  },
  {
    q: 'A loop is `b1: bge i1, n, b4`, `b2: mul t, i1, i1; add s2, s1, t; addi i2, i1, 1; mv s1, s2; mv i1, i2; j b1`, and s1 is read after the loop. How many registers does it need at the very least?',
    options: [
      {
        t: 'Three: s, i and n',
        why: 'Just after the mul, t is live as well.',
      },
      {
        t: 'Six, one per virtual register in the loop',
        why: 'Values whose ranges never overlap can share; that is the whole point.',
      },
      {
        t: 'Four',
        correct: true,
        why: 'n, s1, i1 and t are all live at once, and all four interfere with one another.',
      },
    ],
  },
  {
    q: 'Under Chaitin’s rule, an instruction defines x, but x is never used. Does x interfere with the values live after it?',
    options: [
      {
        t: 'No, because x is never live',
        why: 'Writing x still overwrites its register, so the values live there must be elsewhere.',
      },
      {
        t: 'Yes: interference comes from the definition, so x gets an edge to each value live after it',
        correct: true,
        why: 'That is why Chaitin’s rule looks at definitions, not only at overlapping live sets.',
      },
      {
        t: 'Only if x is a copy',
        why: 'The copy rule removes an edge; it never adds one.',
      },
    ],
  },
  {
    q: 'Building an interference graph by walking a block backwards with a live set, when are a definition’s edges added?',
    options: [
      {
        t: 'Before updating the live set at that instruction, so it still holds the values live just after it',
        correct: true,
        why: 'Those are the values that must survive while the result is written.',
      },
      {
        t: 'After adding the instruction’s uses',
        why: 'Then the set describes the point before the instruction, and adds wrong edges.',
      },
      {
        t: 'Only at the top of the block',
        why: 'Each definition is handled where it is, on the way up.',
      },
    ],
  },
];
