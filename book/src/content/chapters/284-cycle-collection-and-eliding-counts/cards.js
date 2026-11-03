// Cards for Cycle collection and eliding counts: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cy-leak': {
    q: 'Two objects refer only to each other, and nothing else refers to either. Why does reference counting never free them?',
    a: 'Each still has one reference (from the other), so neither count ever reaches zero.',
  },
  'cy-weak': {
    q: 'How does a weak reference break a cycle?',
    a: 'It does not add to the count, so the object it points to can still reach zero and be freed (Rust’s `Weak`, Swift’s `weak`).',
  },
  'cy-gray': {
    q: 'In Bacon and Rajan’s trial deletion, what does the "mark grey" step do to the counts?',
    a: 'It walks everything reachable from the candidates and subtracts one for each reference between those objects, as if the internal references were deleted.',
  },
  'cy-black': {
    q: 'In Bacon and Rajan’s trial deletion, once mark grey has subtracted the internal references, an object’s count is still greater than zero. What does that mean, and what happens to it?',
    a: 'Something outside the walked objects refers to it, so it is alive: scan black restores the counts of it and everything it reaches.',
  },
  'el-what': {
    q: 'What is reference-count elision?',
    a: 'Removing count updates a compiler can prove are unnecessary, such as an increment and a later decrement that cancel out.',
  },
  'el-pair': {
    q: 'When may a compiler delete `inc x … dec x`?',
    a: 'When nothing between them can drop another reference to `x` (no decrement of anything, no call that might), so `x` stays alive anyway.',
  },
  'el-borrow': {
    q: 'What does a borrowed parameter save, in Lean or Swift-style reference counting?',
    a: 'The caller promises to keep the object alive for the call, so neither side increments or decrements for the argument.',
  },
  'el-atomic': {
    q: 'Why can rustc -O cancel the paired increment and decrement of a Rust `Rc` clone, while clang -O2 keeps those of a C++ `std::shared_ptr` copy?',
    a: '`Rc`’s counts are plain memory, which the optimiser can reason about; `shared_ptr`’s are atomic operations other threads may see, which it leaves alone.',
  },
};

export const examples = {
  elide: {
    title: 'Removing paired count updates',
    code: `// ops a compiler inserted, in order
const ops = [
  'inc r', 'load r', 'dec r',
  'inc s', 'call g s', 'dec s',
];
// may this op drop a reference?
const mayFree = (op) =>
  op.startsWith('dec ')
  || op.startsWith('call ');
function partner(out, i, x) {
  for (const [j, op] of out.entries()) {
    if (j <= i) continue;
    if (op === 'dec ' + x) return j;
    if (mayFree(op)) return -1;
  }
  return -1;
}
function elide(ops) {
  const out = [...ops];
  let i = 0;
  while (i < out.length) {
    const [k, x] = out[i].split(' ');
    const j = k === 'inc'
      ? partner(out, i, x) : -1;
    if (j < 0) {
      i++;
      continue;
    }
    out.splice(j, 1);
    out.splice(i, 1);
  }
  return out;
}
console.log(elide(ops).join('; '));`,
  },
};

export const exercises = {
  'collect-cycles': {
    title: 'Trial deletion',
    prompt: 'The heap is an object mapping names to `{ rc, refs }`: `rc` is the reference count and `refs` the names this object points to. Write `collectCycles(heap, roots)`, which runs trial deletion from the candidate names `roots` and returns the sorted names of the garbage. Work on copies of the counts (the heap must not change). The steps: **mark grey** each candidate (colour it grey, and for every reference it holds, subtract one from the target’s count and mark the target grey, unless it already is); then **scan** each candidate (a grey object with count above 0 is **scanned black**: coloured black, and every reference it holds adds one back to its target, scanning the target black too unless it is already black; a grey object with count 0 turns white, and its targets are scanned); white objects are the garbage.',
    starter: `function collectCycles(heap, roots) {
  return [];
}`,
    solution: `function collectCycles(heap, roots) {
  const rc = {};
  const color = {};
  for (const n in heap) {
    rc[n] = heap[n].rc;
    color[n] = 'black';
  }
  const refs = (n) => heap[n].refs;
  function markGray(n) {
    if (color[n] === 'gray') return;
    color[n] = 'gray';
    for (const m of refs(n)) {
      rc[m]--;
      markGray(m);
    }
  }
  function scanBlack(n) {
    color[n] = 'black';
    for (const m of refs(n)) {
      rc[m]++;
      if (color[m] !== 'black') {
        scanBlack(m);
      }
    }
  }
  function scan(n) {
    if (color[n] !== 'gray') return;
    if (rc[n] > 0) {
      scanBlack(n);
      return;
    }
    color[n] = 'white';
    for (const m of refs(n)) scan(m);
  }
  roots.forEach((n) => markGray(n));
  roots.forEach((n) => scan(n));
  return Object.keys(color)
    .filter((n) => color[n] === 'white')
    .sort();
}`,
    tests: `const twoCycles = () => ({
  A: { rc: 1, refs: ['B'] },
  B: { rc: 1, refs: ['A'] },
  C: { rc: 2, refs: ['D'] },
  D: { rc: 1, refs: ['C'] },
});
test('the chapter\\'s two cycles', () => {
  expect(collectCycles(twoCycles(), ['A', 'C']))
    .toEqual(['A', 'B']);
});
test('the heap is not changed', () => {
  const h = twoCycles();
  collectCycles(h, ['A', 'C']);
  expect([h.A.rc, h.C.rc, h.D.rc])
    .toEqual([1, 2, 1]);
});
test('an object pointing at itself', () => {
  const h = { S: { rc: 1, refs: ['S'] } };
  expect(collectCycles(h, ['S'])).toEqual(['S']);
});
test('what only a garbage cycle holds', () => {
  const h = {
    A: { rc: 1, refs: ['B'] },
    B: { rc: 1, refs: ['A', 'T'] },
    T: { rc: 1, refs: [] },
  };
  expect(collectCycles(h, ['A']))
    .toEqual(['A', 'B', 'T']);
});
test('an object also held from outside', () => {
  const h = {
    A: { rc: 1, refs: ['B'] },
    B: { rc: 1, refs: ['A', 'E'] },
    E: { rc: 2, refs: [] },
  };
  expect(collectCycles(h, ['A'])).toEqual(['A', 'B']);
});
test('a live cycle, entered from inside', () => {
  const h = twoCycles();
  expect(collectCycles(h, ['D'])).toEqual([]);
});
test('a live object that is no cycle', () => {
  const h = { X: { rc: 1, refs: [] } };
  expect(collectCycles(h, ['X'])).toEqual([]);
});`,
    hints: [
      'Copy every count into your own object `rc`, and keep a `color` for every name, starting black. Then write the three walks as recursive functions: `markGray`, `scan` and `scanBlack`.',
      '`markGray(n)`: stop if `n` is already grey; otherwise colour it grey and, for each `m` in its `refs`, do `rc[m]--` and `markGray(m)`. `scanBlack(n)`: colour it black and, for each `m`, do `rc[m]++` and `scanBlack(m)` unless `m` is black.',
      '`scan(n)`: only for grey objects. If `rc[n] > 0` call `scanBlack(n)`; otherwise colour it white and `scan` each target. Run `markGray` on every root, then `scan` on every root, then return the white names, sorted.',
    ],
    walkthrough: `**How to think about it.** The question is "which of these objects are referenced only by each other?". A count mixes two kinds of reference, from inside the group and from outside, and we want to separate them. Subtracting every inside reference does exactly that: what remains of each count is the number of outside references. That is the grey walk. Then any object with an outside reference is alive, *and so is everything it reaches*, which means the inside references from it were real after all and must be put back; that is the black walk. Whatever is still at zero is garbage. Two phases, then, both over the same small part of the heap, and the colours stop each walk from visiting an object twice.

**The solution, line by line.**

- \`const rc = {}; const color = {};\` hold the trial counts and the colours; copying the counts (the \`for ... in\` loop) leaves the real heap untouched, as the second test checks. Everything starts black (not under suspicion).
- \`const refs = (n) => heap[n].refs;\` is a short name for an object's outgoing references.
- \`function markGray(n) {\`: \`if (color[n] === 'gray') return;\` visits each object once, which also stops the walk going round a cycle forever. Then \`color[n] = 'gray';\` and, \`for (const m of refs(n)) { rc[m]--; markGray(m); }\`: each reference from a walked object is subtracted from its target. Note that the subtraction happens for *every reference*, even to an object already grey: \`B → A\` must lower \`A\`'s count although \`A\` was the starting point.
- \`function scanBlack(n) {\` marks \`n\` alive: \`color[n] = 'black';\` and, for each target, \`rc[m]++\` undoes the subtraction made for that reference, then continues to targets that are not black yet. In the live-cycle test this is what rescues \`D\`, which had already turned white before \`C\` was found to be alive.
- \`function scan(n) {\`: \`if (color[n] !== 'gray') return;\` handles each grey object once. \`if (rc[n] > 0) { scanBlack(n); return; }\`: an outside reference exists, so it lives. Otherwise \`color[n] = 'white';\` (tentatively garbage) and \`for (const m of refs(n)) scan(m);\` continues to the objects it points to.
- \`roots.forEach((n) => markGray(n)); roots.forEach((n) => scan(n));\` all grey marking happens before any scanning, so the counts are fully adjusted when scanning reads them.
- \`return Object.keys(color).filter((n) => color[n] === 'white').sort();\` lists the garbage.

On the chapter's example, \`A\` and \`B\` drop to 0 and turn white, \`C\` keeps 1 for the variable \`v\`, and scanning it black restores \`D\`: the answer is \`['A', 'B']\`, as in the diagram.

**Common wrong attempts.**

- Colouring a live object black without restoring the counts of what it reaches: in the live-cycle test, \`D\` was already white and stays white, so a live object is freed.
- Marking grey without subtracting: no count ever reaches zero, and no cycle is ever found.
- Subtracting only when first visiting an object: the reference that closes the cycle (\`B → A\`) is never subtracted, so \`A\` keeps a count of 1 and looks alive.`,
    wrong: [
      {
        code: `function collectCycles(heap, roots) {
  const rc = {};
  const color = {};
  for (const n in heap) {
    rc[n] = heap[n].rc;
    color[n] = 'black';
  }
  const refs = (n) => heap[n].refs;
  function markGray(n) {
    if (color[n] === 'gray') return;
    color[n] = 'gray';
    for (const m of refs(n)) {
      rc[m]--;
      markGray(m);
    }
  }
  function scan(n) {
    if (color[n] !== 'gray') return;
    if (rc[n] > 0) {
      color[n] = 'black';
      return;
    }
    color[n] = 'white';
    for (const m of refs(n)) scan(m);
  }
  roots.forEach((n) => markGray(n));
  roots.forEach((n) => scan(n));
  return Object.keys(color)
    .filter((n) => color[n] === 'white')
    .sort();
}`,
        why: 'There is no scan black: a live object is coloured black but what it reaches keeps its lowered count, so the live cycle entered from `D` loses `D`.',
      },
      {
        code: `function collectCycles(heap, roots) {
  const rc = {};
  const color = {};
  for (const n in heap) {
    rc[n] = heap[n].rc;
    color[n] = 'black';
  }
  function markGray(n) {
    if (color[n] === 'gray') return;
    color[n] = 'gray';
    for (const m of heap[n].refs) {
      markGray(m);
    }
  }
  roots.forEach((n) => markGray(n));
  return Object.keys(color)
    .filter((n) => color[n] === 'gray'
      && rc[n] === 0)
    .sort();
}`,
        why: 'It never subtracts the internal references, so no count reaches zero and no garbage cycle is ever found.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'After `del b, c` for two Python objects that refer to each other, when are they freed?',
    options: [
      {
        t: 'Immediately, by reference counting',
        why: 'Each still has a count of 1 from the other.',
      },
      {
        t: 'When CPython’s cycle collector runs, for example on `gc.collect()`',
        correct: true,
        why: 'The collector supplements reference counting for exactly this; `gc.collect()` frees both and returns the number of unreachable objects it found.',
      },
      {
        t: 'Never',
        why: 'That is true of Rust’s `Rc` cycles, but CPython has a cycle collector.',
      },
    ],
  },
  {
    q: 'In trial deletion, why is an object whose count is decremented to **zero** not a candidate?',
    options: [
      {
        t: 'It is freed at once anyway, by ordinary counting',
        correct: true,
        why: 'Only a decrement to a non-zero count can leave a cycle alive but unreachable.',
      },
      {
        t: 'Objects with count zero cannot be in a heap',
        why: 'They can, briefly; but they are freed immediately, so there is nothing to find.',
      },
      {
        t: 'Because it might be referenced from outside',
        why: 'A zero count means nothing refers to it at all.',
      },
    ],
  },
  {
    q: 'In trial deletion, after mark grey, object C has a trial count of 1 and D has 0, where C → D and D → C. What is the outcome?',
    options: [
      {
        t: 'Both are freed, since D reached zero',
        why: 'D is reachable from C, which is alive.',
      },
      {
        t: 'Only D is freed',
        why: 'C keeps D alive; scan black restores D’s count.',
      },
      {
        t: 'Neither is freed: C is held from outside, and scan black restores and keeps D',
        correct: true,
        why: 'Whatever an alive object reaches is alive too.',
      },
      {
        t: 'Only C is freed',
        why: 'C has an outside reference; it is the one most clearly alive.',
      },
    ],
  },
  {
    q: 'Which pair can a compiler safely delete from `inc x; S; dec x`?',
    options: [
      {
        t: 'Any pair, always',
        why: 'If S can drop the last other reference to x, x would be freed while still in use.',
      },
      {
        t: 'Only when S contains a function call',
        why: 'A call is exactly the kind of thing that might release a reference.',
      },
      {
        t: 'When S only reads x and frees nothing',
        correct: true,
        why: 'Then x stays alive through its other references, and the two updates cancel.',
      },
    ],
  },
  {
    q: 'Why does a borrowed parameter save count updates?',
    options: [
      {
        t: 'Borrowed objects have no reference count',
        why: 'They do; it just does not need to change for this call.',
      },
      {
        t: 'The caller keeps the object alive for the whole call, so the callee need not own a reference',
        correct: true,
        why: 'Lean’s InferBorrow pass marks such parameters, so the caller does not increment before the call.',
      },
      {
        t: 'The callee frees the object instead',
        why: 'A borrowed parameter is precisely one the callee may not release.',
      },
      {
        t: 'Borrowing copies the object',
        why: 'Nothing is copied; only the count bookkeeping is skipped.',
      },
    ],
  },
];
