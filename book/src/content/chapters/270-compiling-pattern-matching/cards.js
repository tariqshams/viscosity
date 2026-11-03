// Cards for Compiling pattern matching: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dt-what': {
    q: 'What does each inner node of a **decision tree** for a match do, and what is at each leaf?',
    a: 'Each inner node tests the constructor (tag) of one part of the value, with one branch per constructor; each leaf names the arm to run, or reports that none fits.',
  },
  'first-wins': {
    q: 'In a Rust, OCaml or Haskell `match`, two arms both fit a value. Which one runs?',
    a: 'The first one, top to bottom; any compiled form of the match must give the same answer.',
  },
  'spec-what': {
    q: 'In matrix-based match compilation, **specialising** the rows by `Some`, what becomes of the row `[Some(x), None]`?',
    a: '`[x, None]`: the constructor is opened up and its sub-pattern takes its place.',
  },
  'spec-wild': {
    q: 'In matrix-based match compilation, specialising by `Some` (one field), what becomes of the row `[_, None]`?',
    a: '`[_, None]`: the `_` becomes one wildcard per field of `Some`, here exactly one.',
  },
  'spec-drop': {
    q: 'In matrix-based match compilation, specialising by `Some`, what becomes of the row `[None, _]`?',
    a: 'It is dropped: a value whose tag is `Some` can never match `None`.',
  },
  'leaf-rules': {
    q: 'When does decision-tree match compilation by specialisation stop with a leaf, and what does the leaf say?',
    a: 'When the first row is all wildcards (that arm runs), or when no rows are left (a missing case).',
  },
  witness: {
    q: 'What is a **witness** in exhaustiveness checking?',
    a: 'An example value that no arm matches, such as rustc’s “`&Sh::Re(_, _)` not covered”.',
  },
  redundant: {
    q: 'Why does rustc warn that `(None, None)` is unreachable after `(None, _)`?',
    a: 'Every value it matches is already matched by the earlier arm, and the first match wins, so it can never run.',
  },
  'why-check': {
    q: 'Why must Rust reject a non-exhaustive `match`, rather than only warn?',
    a: 'A `match` is an expression that must produce a value for every input; for an unmatched value there would be nothing to produce.',
  },
};

export const examples = {
  'match-compiler': {
    title: 'A match compiler in forty lines',
    code: `// pattern: '_' or [ctor, ...subpats]
// row: [arm, p1, p2, ...]
const ARITY = { Some: 1, None: 0 };

function spec(m, c) {
  const out = [];
  for (const [arm, p, ...rest] of m) {
    if (p === '_') {
      const n = ARITY[c];
      const ws = Array(n).fill('_');
      out.push([arm, ...ws, ...rest]);
    } else if (p[0] === c) {
      const sub = p.slice(1);
      out.push([arm, ...sub, ...rest]);
    }
  }
  return out;
}

function drop(r) {
  return [r[0], ...r.slice(2)];
}

function compile(m, path) {
  if (m.length === 0) {
    return 'missing:' + path;
  }
  const [arm, ...ps] = m[0];
  if (ps.every((p) => p === '_')) {
    return 'arm ' + arm;
  }
  if (m.every((r) => r[1] === '_')) {
    const m2 = m.map(drop);
    return compile(m2, path + ' _');
  }
  const t = {};
  for (const c in ARITY) {
    const sub = spec(m, c);
    t[c] = compile(sub, path + ' ' + c);
  }
  return t;
}

function show(t, pad) {
  if (typeof t === 'string') {
    console.log(pad + t);
    return;
  }
  for (const c in t) {
    console.log(pad + c + ':');
    show(t[c], pad + '  ');
  }
}

const m = [
  [1, ['Some', '_'], ['Some', '_']],
  [2, ['None'], '_'],
  [3, '_', ['None']],
];
show(compile(m, ''), '');
console.log('--- without arm 3');
show(compile(m.slice(0, 2), ''), '');`,
  },
};

export const exercises = {
  'match-report': {
    title: 'Missing cases and unused arms',
    prompt: 'The starter has the match compiler from the chapter: `compile(m, path)` returns a tree whose leaves are strings, either `\'arm N\'` or `\'missing:\'` followed by the path. Write `report(m)`, which returns `{ missing, unused }`: `missing` is the list of every `missing:` leaf in the tree of `compile(m, \'\')` (in the order a left-to-right walk meets them), and `unused` is the list of arm numbers, in row order, that appear in no leaf. (`{ missing, unused }` is short for `{ missing: missing, unused: unused }`.)',
    starter: `// pattern: '_' or [ctor, ...subpats]
// row: [arm, p1, p2, ...]
const ARITY = { Some: 1, None: 0 };

function spec(m, c) {
  const out = [];
  for (const [arm, p, ...rest] of m) {
    if (p === '_') {
      const n = ARITY[c];
      const ws = Array(n).fill('_');
      out.push([arm, ...ws, ...rest]);
    } else if (p[0] === c) {
      const sub = p.slice(1);
      out.push([arm, ...sub, ...rest]);
    }
  }
  return out;
}

function drop(r) {
  return [r[0], ...r.slice(2)];
}

function compile(m, path) {
  if (m.length === 0) {
    return 'missing:' + path;
  }
  const [arm, ...ps] = m[0];
  if (ps.every((p) => p === '_')) {
    return 'arm ' + arm;
  }
  if (m.every((r) => r[1] === '_')) {
    const m2 = m.map(drop);
    return compile(m2, path + ' _');
  }
  const t = {};
  for (const c in ARITY) {
    const sub = spec(m, c);
    t[c] = compile(sub, path + ' ' + c);
  }
  return t;
}

function report(m) {
  // collect the leaves of the tree
  return { missing: [], unused: [] };
}`,
    solution: `// pattern: '_' or [ctor, ...subpats]
// row: [arm, p1, p2, ...]
const ARITY = { Some: 1, None: 0 };

function spec(m, c) {
  const out = [];
  for (const [arm, p, ...rest] of m) {
    if (p === '_') {
      const n = ARITY[c];
      const ws = Array(n).fill('_');
      out.push([arm, ...ws, ...rest]);
    } else if (p[0] === c) {
      const sub = p.slice(1);
      out.push([arm, ...sub, ...rest]);
    }
  }
  return out;
}

function drop(r) {
  return [r[0], ...r.slice(2)];
}

function compile(m, path) {
  if (m.length === 0) {
    return 'missing:' + path;
  }
  const [arm, ...ps] = m[0];
  if (ps.every((p) => p === '_')) {
    return 'arm ' + arm;
  }
  if (m.every((r) => r[1] === '_')) {
    const m2 = m.map(drop);
    return compile(m2, path + ' _');
  }
  const t = {};
  for (const c in ARITY) {
    const sub = spec(m, c);
    t[c] = compile(sub, path + ' ' + c);
  }
  return t;
}

function leaves(t, out) {
  if (typeof t === 'string') {
    out.push(t);
    return out;
  }
  for (const c in t) leaves(t[c], out);
  return out;
}

function report(m) {
  const ls = leaves(compile(m, ''), []);
  const missing = ls.filter((l) =>
    l.startsWith('missing:'));
  const unused = [];
  for (const r of m) {
    if (!ls.includes('arm ' + r[0])) {
      unused.push(r[0]);
    }
  }
  return { missing, unused };
}`,
    tests: `const full = [
  [1, ['Some', '_'], ['Some', '_']],
  [2, ['None'], '_'],
  [3, '_', ['None']],
];
test('a complete match has no problems', () => {
  expect(report(full)).toEqual({ missing: [], unused: [] });
});
test('a missing case is reported with its path', () => {
  expect(report(full.slice(0, 2)).missing).toEqual(['missing: Some _ None']);
});
test('an arm hidden by an earlier one is unused', () => {
  const m = [[1, ['None'], '_'], [2, ['None'], ['None']], [3, '_', '_']];
  expect(report(m)).toEqual({ missing: [], unused: [2] });
});
test('everything after a catch-all is unused', () => {
  const m = [[1, '_', '_'], [2, ['None'], '_'], [3, ['Some', '_'], '_']];
  expect(report(m)).toEqual({ missing: [], unused: [2, 3] });
});
test('no arms at all: one missing case', () => {
  expect(report([])).toEqual({ missing: ['missing:'], unused: [] });
});`,
    hints: [
      'Everything you need is in the leaves of the tree. Can you first collect all the leaf strings into one list?',
      'A tree is either a string (a leaf) or an object whose values are trees. That is a recursive shape, so write a recursive `leaves(t, out)`: a string is pushed onto `out`; an object has `leaves` called on each of its values.',
      'With the list `ls` of leaves, `missing` is `ls.filter((l) => l.startsWith(\'missing:\'))`, and an arm `r[0]` is unused when `ls.includes(\'arm \' + r[0])` is false.',
    ],
    walkthrough: `**How to think about it.** The chapter says the decision tree gives both checks for free, so the job is only to read the tree. A missing case is a leaf that says \`missing:\`; an unused arm is an arm whose \`arm N\` leaf never appears anywhere. Both questions are about *all* the leaves, so the natural first step is to collect them into one flat list, and that needs a walk over the whole tree. The tree has a recursive shape (a leaf is a string, any other node is an object of subtrees), so the walk is recursive too: the base case is a string, and the recursive case visits each child.

**The solution, line by line.**

- \`function leaves(t, out) {\` collects the leaves of tree \`t\` into the array \`out\`, and returns \`out\` so a caller can write \`leaves(tree, [])\`.
- \`if (typeof t === 'string') { out.push(t); return out; }\` is the base case: a leaf is a string such as \`'arm 2'\` or \`'missing: Some _ None'\`, so add it and stop.
- \`for (const c in t) leaves(t[c], out);\` is the recursive case: \`t\` is an object like \`{ Some: ..., None: ... }\`, and \`for ... in\` visits its keys in the order they were added (Some, then None), which gives the left-to-right order the tests expect. Every child adds its own leaves to the same \`out\`.
- \`return out;\` hands back the filled list.
- \`const ls = leaves(compile(m, ''), []);\` builds the tree for the whole match (with an empty path) and flattens it.
- \`const missing = ls.filter((l) => l.startsWith('missing:'));\` keeps exactly the missing-case leaves, path included.
- \`const unused = [];\` and the loop over \`m\` look at each row in order; \`r[0]\` is its arm number, and \`if (!ls.includes('arm ' + r[0]))\` asks whether that arm reached any leaf. If not, it is pushed.
- \`return { missing, unused };\` returns both lists.

Try the third test by hand: specialised by \`Some\`, only row 3 survives (\`arm 3\`); specialised by \`None\`, rows 1, 2 and 3 survive, but row 1 is all wildcards, so it wins (\`arm 1\`). The leaves are \`['arm 3', 'arm 1']\`, so arm 2 is unused, exactly rustc’s “unreachable pattern”.

**Common wrong attempts.**

- Looking only at the root’s children (\`for (const c in t) ls.push(t[c])\`) collects subtrees as well as strings, and misses every leaf more than one level down; \`startsWith\` then fails on an object.
- Testing \`ls.includes(r[0])\` compares the number 2 with strings like \`'arm 2'\`, which never match, so every arm looks unused.`,
    wrong: [
      {
        code: `// pattern: '_' or [ctor, ...subpats]
// row: [arm, p1, p2, ...]
const ARITY = { Some: 1, None: 0 };

function spec(m, c) {
  const out = [];
  for (const [arm, p, ...rest] of m) {
    if (p === '_') {
      const n = ARITY[c];
      const ws = Array(n).fill('_');
      out.push([arm, ...ws, ...rest]);
    } else if (p[0] === c) {
      const sub = p.slice(1);
      out.push([arm, ...sub, ...rest]);
    }
  }
  return out;
}

function drop(r) {
  return [r[0], ...r.slice(2)];
}

function compile(m, path) {
  if (m.length === 0) {
    return 'missing:' + path;
  }
  const [arm, ...ps] = m[0];
  if (ps.every((p) => p === '_')) {
    return 'arm ' + arm;
  }
  if (m.every((r) => r[1] === '_')) {
    const m2 = m.map(drop);
    return compile(m2, path + ' _');
  }
  const t = {};
  for (const c in ARITY) {
    const sub = spec(m, c);
    t[c] = compile(sub, path + ' ' + c);
  }
  return t;
}

function report(m) {
  const t = compile(m, '');
  const ls = [];
  for (const c in t) ls.push(t[c]);
  const missing = ls.filter((l) =>
    l.startsWith('missing:'));
  const unused = [];
  for (const r of m) {
    if (!ls.includes('arm ' + r[0])) {
      unused.push(r[0]);
    }
  }
  return { missing, unused };
}`,
        why: 'It only looks one level down, so deeper leaves are missed and the subtrees it collects are objects, which have no `startsWith`.',
      },
      {
        code: `// pattern: '_' or [ctor, ...subpats]
// row: [arm, p1, p2, ...]
const ARITY = { Some: 1, None: 0 };

function spec(m, c) {
  const out = [];
  for (const [arm, p, ...rest] of m) {
    if (p === '_') {
      const n = ARITY[c];
      const ws = Array(n).fill('_');
      out.push([arm, ...ws, ...rest]);
    } else if (p[0] === c) {
      const sub = p.slice(1);
      out.push([arm, ...sub, ...rest]);
    }
  }
  return out;
}

function drop(r) {
  return [r[0], ...r.slice(2)];
}

function compile(m, path) {
  if (m.length === 0) {
    return 'missing:' + path;
  }
  const [arm, ...ps] = m[0];
  if (ps.every((p) => p === '_')) {
    return 'arm ' + arm;
  }
  if (m.every((r) => r[1] === '_')) {
    const m2 = m.map(drop);
    return compile(m2, path + ' _');
  }
  const t = {};
  for (const c in ARITY) {
    const sub = spec(m, c);
    t[c] = compile(sub, path + ' ' + c);
  }
  return t;
}

function leaves(t, out) {
  if (typeof t === 'string') {
    out.push(t);
    return out;
  }
  for (const c in t) leaves(t[c], out);
  return out;
}

function report(m) {
  const ls = leaves(compile(m, ''), []);
  const missing = ls.filter((l) =>
    l.startsWith('missing:'));
  const unused = [];
  for (const r of m) {
    if (!ls.includes(r[0])) {
      unused.push(r[0]);
    }
  }
  return { missing, unused };
}`,
        why: 'The leaves are strings like `\'arm 2\'`, so `ls.includes(2)` is always false and every arm is reported unused.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `match (a, b)` with arms `(Some(x), Some(y))`, `(None, _)` and `(_, None)` is compiled to a decision tree. On any one path, how many times is the tag of `a` tested?',
    options: [
      {
        t: 'Up to three times, once per arm',
        why: 'That is trying the arms one by one; the tree avoids it.',
      },
      {
        t: 'At most once',
        correct: true,
        why: 'A decision tree tests each part of the value at most once on any path from the root.',
      },
      {
        t: 'Never, since `_` appears in its column',
        why: 'Rows 1 and 2 have constructors in column a, so it must be tested.',
      },
    ],
  },
  {
    q: 'During match compilation, a branch is left with no rows at all. What does that mean?',
    options: [
      {
        t: 'The last arm runs',
        why: 'No rows means no arm can match here; nothing runs.',
      },
      {
        t: 'The compiler made a mistake',
        why: 'It is the expected way of discovering a missing case.',
      },
      {
        t: 'Some value reaches this point and matches no arm: the match is not exhaustive',
        correct: true,
        why: 'The path to this leaf describes a witness, such as `(Some(_), None)`.',
      },
    ],
  },
  {
    q: 'Rows `1: (None, _)`, `2: (None, None)`, `3: (_, _)`. What does specialising by `None` (no fields) give?',
    options: [
      {
        t: '`1: (_)`, `2: (None)`, `3: (_)`',
        correct: true,
        why: 'Each row loses its first column: `None` opens to nothing, and `_` becomes zero wildcards.',
      },
      {
        t: '`3: (_)` only',
        why: 'That is specialising by `Some`, which drops the rows starting with `None`.',
      },
      {
        t: '`1: (_)` only, since the first match wins',
        why: 'Specialisation keeps every row that can still match; choosing the first comes later, at the leaf.',
      },
    ],
  },
  {
    q: 'What does Java 21’s `typeSwitch` bootstrap method return for a pattern `switch`?',
    options: [
      {
        t: 'The value of the matching case',
        why: 'It only chooses; the case bodies are ordinary bytecode reached through `lookupswitch`.',
      },
      {
        t: 'The index of the first case label that fits the value',
        correct: true,
        why: 'The `lookupswitch` then jumps on that index, with a `default` that throws `MatchException`.',
      },
      {
        t: 'A boolean: whether the switch is exhaustive',
        why: 'Exhaustiveness is checked by `javac` at compile time, not at run time.',
      },
    ],
  },
  {
    q: 'What is the classic trade-off between decision trees and backtracking automata?',
    options: [
      {
        t: 'Trees are smaller; automata are faster',
        why: 'It is the other way round.',
      },
      {
        t: 'Only automata can check exhaustiveness',
        why: 'Maranget notes the opposite: decision trees are easier to analyse, since they have no dead code.',
      },
      {
        t: 'Trees never test anything twice but can grow large; automata stay small but may test something twice',
        correct: true,
        why: 'Copying `_` rows into every branch is what makes trees grow.',
      },
    ],
  },
];
