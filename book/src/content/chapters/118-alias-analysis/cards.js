// Chapter 118 cards. Keys are stable ids: never rename them.

export const prompts = {
  'alias-what': {
    q: 'What question does alias analysis answer?',
    a: 'Whether two references must, may, or can never point at the same object.',
  },
  'points-to-what': {
    q: 'What is a reference’s points-to set?',
    a: 'The set of (abstract) objects it may point at.',
  },
  'alloc-site': {
    q: 'Why does a points-to analysis name objects by their allocation site?',
    a: 'A loop can create unboundedly many objects; naming them by the line that creates them keeps the sets finite.',
  },
  'may-alias-test': {
    q: 'Given points-to sets, when may two references alias?',
    a: 'When their sets intersect.',
  },
  'must-may-no': {
    q: 'Which alias answers can an optimizer act on?',
    a: '“Must” and “no”. “May” means both possibilities have to be kept.',
  },
  'element-not-object': {
    q: 'After `ps` becomes a struct of arrays, what is “element 3”?',
    a: 'A position, index 3, in each column. There is no object any more.',
  },
  'ssa-alias-ok': {
    q: 'Why can Viscosity rewrite `const p = ps[3]` as `const p = 3`?',
    a: '`p` is an SSA value known to be exactly element 3 of `ps` (a must-alias), and every use of it is visible.',
  },
  'captured-var': {
    q: 'Why does `const peek = () => keep.x`, with `keep = ps[0]`, keep `ps` as objects?',
    a: '`keep` is captured, so it lives in memory, not as an SSA value; the closure can read the element at any time.',
  },
  'identity-use': {
    q: 'Why does `ps[0] === ps[1]` stop the layout change?',
    a: '`===` compares object identity, and after the transformation there are no element objects to compare.',
  },
  'two-arrays': {
    q: 'In points-to terms, why do `total(a)` and `total(b)` block both arrays?',
    a: 'The parameter’s points-to set is {a, b}; Viscosity needs it to be exactly one array.',
  },
};

export const examples = {};

export const exercises = {
  pointsTo: {
    title: 'Points-to sets for simple assignments',
    prompt:
      'Statements are `[\'new\', a, site]` (`a = {}` at allocation site `site`) or `[\'copy\', a, b]` (`a = b`). Order doesn’t matter (the analysis is flow-insensitive). Write `pointsTo(stmts)` returning an object mapping **every variable mentioned** to its sorted points-to set, and `mayAlias(pts, x, y)`.',
    starter: `function pointsTo(stmts) {
  // your code here
  return {};
}

function mayAlias(pts, x, y) {
  // your code here
  return false;
}

const pts = pointsTo([
  ['new', 'a', 'o1'],
  ['new', 'b', 'o2'],
  ['copy', 'c', 'a'],
  ['copy', 'c', 'b'],
]);
console.log(pts.c); // ['o1', 'o2']`,
    solution: `function pointsTo(stmts) {
  const pts = new Map();
  const get = (v) => {
    if (!pts.has(v)) {
      pts.set(v, new Set());
    }
    return pts.get(v);
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const [kind, a, b] of stmts) {
      const to = get(a);
      const n = to.size;
      if (kind === 'new') {
        to.add(b);
      } else {
        for (const o of get(b)) {
          to.add(o);
        }
      }
      if (to.size !== n) changed = true;
    }
  }
  const out = {};
  for (const [v, set] of pts) {
    out[v] = [...set].sort();
  }
  return out;
}

function mayAlias(pts, x, y) {
  return pts[x].some(
    (o) => pts[y].includes(o));
}`,
    tests: `test('a copy shares the object', () => {
  const pts = pointsTo([['new', 'a', 'o1'], ['copy', 'b', 'a']]);
  expect(pts).toEqual({ a: ['o1'], b: ['o1'] });
});
test('order does not matter', () => {
  const pts = pointsTo([['copy', 'c', 'b'], ['copy', 'b', 'a'], ['new', 'a', 'o1']]);
  expect(pts.c).toEqual(['o1']);
});
test('a variable assigned twice may point at both', () => {
  const pts = pointsTo([['new', 'a', 'o1'], ['new', 'b', 'o2'], ['copy', 'c', 'a'], ['copy', 'c', 'b']]);
  expect(pts.c).toEqual(['o1', 'o2']);
  expect(mayAlias(pts, 'c', 'a')).toBe(true);
  expect(mayAlias(pts, 'a', 'b')).toBe(false);
});
test('a copy flows one way only', () => {
  const pts = pointsTo([['new', 'a', 'o1'], ['copy', 'b', 'a'], ['new', 'b', 'o2']]);
  expect(pts.a).toEqual(['o1']);
  expect(pts.b).toEqual(['o1', 'o2']);
});
test('cycles of copies terminate', () => {
  const pts = pointsTo([['copy', 'a', 'b'], ['copy', 'b', 'a'], ['new', 'a', 'o1']]);
  expect(pts).toEqual({ a: ['o1'], b: ['o1'] });
});`,
    hints: [
      'Keep a `Map` from variable to a `Set` of sites, creating empty sets on demand, so every variable mentioned gets an entry.',
      '`new` adds a site; `copy a b` adds everything in `b`’s set to `a`’s set (not the other way round).',
      'One pass is not enough when a copy comes before its source gets objects. Repeat the pass until no set grows.',
    ],
    walkthrough: `This is the classic subset-based (Andersen-style) analysis, restricted to two statement kinds.

- **Sets that only grow.** \`new\` adds one site; \`copy a b\` makes \`pts(a)\` a superset of \`pts(b)\`. Nothing is ever removed, and there are finitely many sites, so repeating must stop: a fixpoint, exactly like the dataflow analyses of chapter 106. The lattice is “sets of sites”, ordered by inclusion.
- **Why repeat.** Because the analysis ignores order, \`c = b\` may be processed before \`b = a\` has given \`b\` anything. The \`changed\` flag reruns the pass until a whole round adds nothing. Cycles of copies are harmless: once both sets hold the same sites, nothing grows.
- **Direction.** \`b = a\` doesn’t make \`a\` point at what \`b\` later points at. Merging the two sets into one would be simpler (that is how unification-based analyses work) but less precise: it would say \`a\` may point at \`o2\`.

\`mayAlias\` is then just “do the sets intersect?”. A “no” from it is a proof: no execution can make \`a\` and \`b\` the same object.`,
    wrong: [
      {
        code: `function pointsTo(stmts) {
  const pts = new Map();
  const get = (v) => {
    if (!pts.has(v)) {
      pts.set(v, new Set());
    }
    return pts.get(v);
  };
  for (const [kind, a, b] of stmts) {
    const to = get(a);
    if (kind === 'new') {
      to.add(b);
    } else {
      for (const o of get(b)) {
        to.add(o);
      }
    }
  }
  const out = {};
  for (const [v, set] of pts) {
    out[v] = [...set].sort();
  }
  return out;
}

function mayAlias(pts, x, y) {
  return pts[x].some(
    (o) => pts[y].includes(o));
}`,
        why: 'A single pass misses objects that arrive at `b` after `c = b` was processed. Flow-insensitive analysis needs a fixpoint.',
      },
      {
        code: `function pointsTo(stmts) {
  const pts = new Map();
  const get = (v) => {
    if (!pts.has(v)) {
      pts.set(v, new Set());
    }
    return pts.get(v);
  };
  for (const [kind, a, b] of stmts) {
    if (kind === 'copy') {
      pts.set(a, get(b));
    }
  }
  for (const [kind, a, b] of stmts) {
    if (kind === 'new') get(a).add(b);
  }
  const out = {};
  for (const [v, set] of pts) {
    out[v] = [...set].sort();
  }
  return out;
}

function mayAlias(pts, x, y) {
  return pts[x].some(
    (o) => pts[y].includes(o));
}`,
        why: 'Making `a` share `b`’s set object means anything later added to either shows up in both: `b = a; b = {}` would wrongly make `a` point at the new object too. Copies flow one way.',
      },
    ],
  },
  fieldPointsTo: {
    optional: true,
    title: 'Points-to through fields',
    prompt:
      'Add two statements: `[\'store\', a, f, b]` for `a.f = b` and `[\'load\', c, a, f]` for `c = a.f`. Track a points-to set for each heap cell `site.f` (for example `\'o1.f\'`). Write `fieldPointsTo(stmts)` returning an object mapping each **variable** (not heap cell) to its sorted set.',
    starter: `function fieldPointsTo(stmts) {
  // your code here
  return {};
}

const pts = fieldPointsTo([
  ['new', 'a', 'o1'],
  ['new', 'b', 'o2'],
  ['store', 'a', 'f', 'b'],
  ['load', 'c', 'a', 'f'],
]);
console.log(pts.c); // ['o2']`,
    solution: `function fieldPointsTo(stmts) {
  const pts = new Map();
  const get = (k) => {
    if (!pts.has(k)) {
      pts.set(k, new Set());
    }
    return pts.get(k);
  };
  let changed = false;
  const flow = (from, to) => {
    const t = get(to);
    const n = t.size;
    for (const o of get(from)) t.add(o);
    if (t.size !== n) changed = true;
  };
  do {
    changed = false;
    for (const s of stmts) {
      const [kind, a, b, c] = s;
      if (kind === 'new') {
        const t = get(a);
        const n = t.size;
        t.add(b);
        if (t.size !== n) {
          changed = true;
        }
      } else if (kind === 'copy') {
        flow(b, a);
      } else if (kind === 'store') {
        for (const o of get(a)) {
          flow(c, o + '.' + b);
        }
      } else if (kind === 'load') {
        for (const o of get(b)) {
          flow(o + '.' + c, a);
        }
      }
    }
  } while (changed);
  const out = {};
  for (const [k, set] of pts) {
    if (!k.includes('.')) {
      out[k] = [...set].sort();
    }
  }
  return out;
}`,
    tests: `test('a value stored in a field comes back out', () => {
  const pts = fieldPointsTo([['new', 'a', 'o1'], ['new', 'b', 'o2'], ['store', 'a', 'f', 'b'], ['load', 'c', 'a', 'f']]);
  expect(pts.c).toEqual(['o2']);
});
test('a store through an alias is seen by a load through the original', () => {
  const pts = fieldPointsTo([
    ['new', 'a', 'o1'], ['copy', 'd', 'a'], ['new', 'e', 'o3'],
    ['store', 'd', 'f', 'e'], ['load', 'c', 'a', 'f'],
  ]);
  expect(pts.c).toEqual(['o3']);
});
test('different fields are kept apart', () => {
  const pts = fieldPointsTo([
    ['new', 'a', 'o1'], ['new', 'b', 'o2'], ['new', 'e', 'o3'],
    ['store', 'a', 'f', 'b'], ['store', 'a', 'g', 'e'], ['load', 'c', 'a', 'g'],
  ]);
  expect(pts.c).toEqual(['o3']);
});
test('order does not matter', () => {
  const pts = fieldPointsTo([['load', 'c', 'a', 'f'], ['store', 'a', 'f', 'b'], ['new', 'b', 'o2'], ['new', 'a', 'o1']]);
  expect(pts.c).toEqual(['o2']);
});
test('heap cells are not reported as variables', () => {
  const pts = fieldPointsTo([['new', 'a', 'o1'], ['store', 'a', 'f', 'a']]);
  expect(pts).toEqual({ a: ['o1'] });
});`,
    hints: [
      'Use one `Map` for both variables and heap cells: a heap cell is just a key like `\'o1.f\'`.',
      'A helper `flow(from, to)` that adds everything in `from`’s set to `to`’s set, and notes whether anything grew, makes all four statements one-liners.',
      'For `a.f = b`, flow `b` into `o.f` for each `o` in `pts(a)`. For `c = a.f`, flow `o.f` into `c`. Repeat until nothing changes, then report only keys without a dot.',
    ],
    walkthrough: `Fields add one level of indirection, and that is all.

- A heap cell \`o1.f\` is a place that can hold arrows, just like a variable, so it gets its own points-to set.
- \`a.f = b\` writes into *every* object \`a\` may point at: for each \`o\` in \`pts(a)\`, \`pts(o.f)\` must include \`pts(b)\`. This is why a store through an alias (\`d.f = e\` with \`d = a\`) is visible to a load through the original (\`a.f\`): both resolve to the same cell \`o1.f\`.
- \`c = a.f\` reads from every object \`a\` may point at.

Because stores and loads depend on sets that may still grow, the loop must run to a fixpoint. Keeping \`f\` and \`g\` as separate cells is what makes this analysis *field-sensitive*. Viscosity sidesteps all of this: an element stored into any field is already a reason to bail out.`,
    wrong: [
      {
        code: `function fieldPointsTo(stmts) {
  const pts = new Map();
  const get = (k) => {
    if (!pts.has(k)) {
      pts.set(k, new Set());
    }
    return pts.get(k);
  };
  const flow = (from, to) => {
    for (const o of get(from)) {
      get(to).add(o);
    }
  };
  for (const [kind, a, b, c] of stmts) {
    if (kind === 'new') get(a).add(b);
    if (kind === 'copy') flow(b, a);
    if (kind === 'store') {
      flow(c, a + '.' + b);
    }
    if (kind === 'load') {
      flow(b + '.' + c, a);
    }
  }
  const out = {};
  for (const [k, set] of pts) {
    if (!k.includes('.')) {
      out[k] = [...set].sort();
    }
  }
  return out;
}`,
        why: 'This keys heap cells by *variable* (`a.f`) instead of by object (`o1.f`), so a store through the alias `d` lands in `d.f` and a load through `a` never sees it. It also makes only one pass.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'An analysis finds `pts(p) = {o1, o2}` and `pts(q) = {o2, o3}`. What can it say about `p` and `q`?',
    options: [
      { t: 'They must alias', why: '“Must” would need both to point at one and the same object on every run. Each has two possibilities.' },
      { t: 'They may alias', correct: true, why: 'The sets share `o2`, so some run may make them the same object.' },
      { t: 'They never alias', why: 'That needs disjoint sets, and these share `o2`.' },
    ],
  },
  {
    q: 'Which line, added after the `push` loop, still lets Viscosity turn `ps` into a struct of arrays?',
    options: [
      { t: '`console.log(ps[0]);`', why: 'The element is passed to code Viscosity doesn’t model.' },
      { t: '`const box = { p: ps[0] };`', why: 'The element is stored inside another object, out of sight.' },
      { t: '`const q = ps; q[0].x = 3;`', correct: true, why: '`q` is the same SSA value as the load of `ps`, a must-alias the analysis can follow, and `.x = 3` is a field write it can rewrite.' },
      { t: '`if (ps[0] === ps[1]) {}`', why: '`===` compares identity, which doesn’t exist for elements after the transformation.' },
    ],
  },
  {
    q: 'A flow-insensitive points-to analysis sees `c = a;` and later `c = b;`, with `a` and `b` pointing at sites `o1` and `o2`. What is `pts(c)`?',
    options: [
      { t: '`{o2}`, because the second assignment wins', why: 'That is what happens at run time *after* the second line. A flow-insensitive analysis ignores order and gives one set for the whole program.' },
      { t: '`{}`, because the assignments cancel out', why: 'Points-to sets only grow.' },
      { t: '`{o1}`', why: 'The second assignment adds `o2` as well.' },
      { t: '`{o1, o2}`', correct: true, why: 'Each copy adds its source’s set. Ignoring order, `c` may point at either object.' },
    ],
  },
  {
    q: 'Suppose an analysis wrongly answered “no alias” for `keep[0]` and `ps[3]` in this chapter’s first program, and Viscosity transformed `ps`. What would happen?',
    options: [
      { t: 'Nothing: alias answers only affect speed', why: 'They affect correctness. A wrong “no” licenses a change that breaks the program.' },
      { t: 'The program would print a different answer: the `7` written through `keep[0]` would go to a copy, not to `ps`’s column', correct: true, why: 'That is the last step of the diagram. Alias analysis must be sound: it may say “may” too often, but never “no” wrongly.' },
      { t: 'V8 would detect the alias and deoptimize', why: 'V8 runs the code Viscosity emitted. The rewritten program is simply a different program.' },
    ],
  },
  {
    q: 'Why does `let p = ps[0]; if (c) p = ps[5]; p.x = 1;` keep `ps` as objects?',
    options: [
      { t: '`p` is a phi of two element references, and Viscosity doesn’t track a reference that could be either element', correct: true, why: 'The explain output says an element is “merged with other values”. A smarter analysis could merge the two indexes instead; Viscosity chooses the simple, safe answer.' },
      { t: 'Because `let` variables can never be analyzed', why: 'The loop counters in this book are `let` variables, and they are analyzed fine.' },
      { t: 'Because `ps[5]` might be out of bounds', why: 'Out-of-bounds accesses get a bounds check; they don’t stop the transformation.' },
      { t: 'Because `if` statements disable the analysis', why: 'Branches are normal CFG edges; the problem is the merge of two different elements.' },
    ],
  },
  {
    q: 'What is the trade-off in Viscosity’s all-or-nothing rule (one unexplained use and the array keeps its layout)?',
    options: [
      { t: 'It sometimes produces wrong output in exchange for speed', why: 'The opposite: it is built so that it is never wrong in the direction that matters.' },
      { t: 'It needs whole-program points-to sets, which are slow to compute', why: 'It avoids general points-to sets altogether; it checks the uses of each candidate array.' },
      { t: 'It gives up some programs a cleverer analysis could transform, and in exchange is simple to check and safe', correct: true, why: 'A phi of two indexes or an element passed to a small function could be handled with more machinery. Viscosity declines instead.' },
    ],
  },
];
