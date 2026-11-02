// Chapter 94 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 94, 94.

export const prompts = {
  'must-may-no': {
    q: 'Which alias answers can an optimiser act on?',
    a: '“Must” and “no”. “May” means both possibilities have to be kept.',
  },
  'wrong-no': {
    q: 'What happens if an alias analysis wrongly says “no alias”, and what if it wrongly says “may alias”?',
    a: 'A wrong “no” lets the compiler change what the program computes; a wrong “may” only costs an optimisation (speed).',
  },
  'element-not-object': {
    q: 'After `ps` becomes a struct of arrays, what is “element 3”?',
    a: 'A position, index 3, in each column. There is no object any more.',
  },
  'captured-var': {
    q: 'Why does `const peek = () => keep.x`, with `keep = ps[0]`, keep `ps` as objects?',
    a: '`keep` is captured, so it lives in memory, not as an SSA value; the closure can read the element at any time.',
  },
  'points-to-what': {
    q: 'What is a variable’s points-to set?',
    a: 'The set of abstract objects (usually allocation sites) it may point at.',
  },
  'alloc-site': {
    q: 'Why does a points-to analysis name objects by their allocation site?',
    a: 'A loop can create unboundedly many objects; naming them by the code that creates them keeps the sets finite.',
  },
  'site-not-must': {
    q: 'pts(p) = pts(q) = {o1}. Why does that not prove p and q must alias?',
    a: 'Site o1 may create many objects (say, in a loop), so p and q can be two different objects from the same site.',
  },
  'why-repeat': {
    q: 'Why does Andersen’s analysis go round the statements more than once?',
    a: 'It ignores order, so a set can grow after a copy that reads it was processed; it repeats until a round adds nothing (a fixpoint).',
  },
};

export const examples = {
  twoWays: {
    title: 'Same function, aliased or not',
    code: `function f(a, b) {
  a.x = 1;
  b.x = 2;
  return a.x;
}
const o = { x: 0 };
const p = { x: 0 };
console.log(f(o, p)); // two objects
console.log(f(o, o)); // one object`,
  },
  viaField: {
    title: 'An alias made through a field',
    code: `const a = {};
const b = { n: 2 };
a.f = b;
const c = a.f;
c.n = 99;
console.log(b.n); // 99: c is b
console.log(c === b);`,
  },
};

export const exercises = {
  aliasKind: {
    optional: true,
    title: 'Must, may or no, from the runs',
    prompt: 'Imagine we could watch a program run several times and note, at one point in the code, which object each name refers to. `runs` is a list of such notes: each run is an object mapping a name to an object id, like `{ p: \'o1\', q: \'o2\' }`. Write `aliasKind(runs, p, q)` returning `\'must\'` if `p` and `q` refer to the same object in **every** run, `\'no\'` if they do in **no** run, and `\'may\'` otherwise. There is always at least one run.',
    starter: `function aliasKind(runs, p, q) {
  // your code here
  return 'may';
}

console.log(aliasKind([
  { a: 'o1', b: 'o1' },
  { a: 'o1', b: 'o2' },
], 'a', 'b')); // 'may'`,
    solution: `function aliasKind(runs, p, q) {
  let same = 0;
  for (const run of runs) {
    if (run[p] === run[q]) same++;
  }
  if (same === runs.length) {
    return 'must';
  }
  if (same === 0) return 'no';
  return 'may';
}`,
    tests: `test('same object on every run: must', () => {
  expect(aliasKind([{ a: 'o1', b: 'o1' }, { a: 'o2', b: 'o2' }], 'a', 'b')).toBe('must');
});
test('never the same: no', () => {
  expect(aliasKind([{ a: 'o1', b: 'o2' }, { a: 'o1', b: 'o3' }], 'a', 'b')).toBe('no');
});
test('sometimes the same: may', () => {
  expect(aliasKind([{ a: 'o1', b: 'o1' }, { a: 'o1', b: 'o2' }], 'a', 'b')).toBe('may');
});
test('a later run decides it', () => {
  expect(aliasKind([{ a: 'o1', b: 'o2' }, { a: 'o1', b: 'o2' }, { a: 'o3', b: 'o3' }], 'a', 'b')).toBe('may');
});
test('a single run is must or no', () => {
  expect(aliasKind([{ x: 'o1', y: 'o1' }], 'x', 'y')).toBe('must');
  expect(aliasKind([{ x: 'o1', y: 'o2' }], 'x', 'y')).toBe('no');
});`,
    hints: [
      'Go back to the definitions: must is “in every run”, no is “in no run”. What would you count?',
      'Count the runs in which `run[p] === run[q]`. Compare that count with `runs.length` and with 0.',
      'All runs the same means `\'must\'`; none the same means `\'no\'`; anything in between is `\'may\'`.',
    ],
    walkthrough: `**How to think about it.** The three answers are statements about *all* runs: "must" says "in every run", "no" says "in no run", and "may" covers everything else. So the natural thing to do is to look at every run and count how many of them have \`p\` and \`q\` on the same object. A real analysis cannot list the runs (there can be infinitely many), which is why it approximates; however, writing the exact version once makes the definitions concrete, and it shows what the approximation is trying to stay faithful to.

**The solution, line by line.**

- \`let same = 0;\` starts a counter of runs where the two names share an object.
- \`for (const run of runs) {\` visits each run. A run is an object such as \`{ a: 'o1', b: 'o2' }\`, so \`run[p]\` is the object id that name \`p\` refers to in that run (bracket access, because the name is in a variable).
- \`if (run[p] === run[q]) same++;\` adds one when both names refer to the same object id.
- \`if (same === runs.length) { return 'must'; }\` : every run had them on one object, so they must alias.
- \`if (same === 0) return 'no';\` : no run did, so they never alias.
- \`return 'may';\` : some runs did and some did not.

**Common wrong attempts.**

- Looking only at the first run (\`runs[0][p] === runs[0][q] ? 'must' : 'no'\`) answers "must" or "no" from one observation. That is exactly the mistake a compiler must never make: the second run might differ, and then a "no" would be a lie.
- Returning \`'must'\` as soon as *one* run matches confuses "there is a run" with "every run"; that is the definition of "may", not "must".
- Returning \`'may'\` for everything is *safe* (it is never wrong in the dangerous direction), but it is useless, and the tests check that you get the precise answer.`,
    wrong: [
      {
        code: `function aliasKind(runs, p, q) {
  const r = runs[0];
  return r[p] === r[q] ? 'must' : 'no';
}`,
        why: 'One run is not every run. When a later run differs, the answer should be `\'may\'`.',
      },
      {
        code: `function aliasKind(runs, p, q) {
  for (const r of runs) {
    if (r[p] === r[q]) return 'must';
  }
  return 'no';
}`,
        why: 'One matching run only shows that they *may* alias. “Must” needs every run to match.',
      },
    ],
  },
  typeMayAlias: {
    optional: true,
    title: 'Type-based alias analysis on a class tree',
    prompt: 'In a language with single inheritance, `parent` maps each class to its superclass (`null` for the root), e.g. `{ Object: null, Shape: \'Object\', Circle: \'Shape\', Str: \'Object\' }`. A reference of type `T` may point at an object of class `T` or any subclass. Write `typeMayAlias(parent, s, t)`: `true` if some object could have both types (one is the other or an ancestor of it), `false` otherwise.',
    starter: `function typeMayAlias(parent, s, t) {
  // your code here
  return true;
}

const parent = {
  Object: null, Shape: 'Object',
  Circle: 'Shape', Str: 'Object',
};
const ans = typeMayAlias(
  parent, 'Circle', 'Str');
console.log(ans);`,
    solution: `function isAncestor(parent, a, b) {
  // is a equal to b, or above it?
  for (let c = b; c !== null;
       c = parent[c]) {
    if (c === a) return true;
  }
  return false;
}

function typeMayAlias(parent, s, t) {
  return isAncestor(parent, s, t)
    || isAncestor(parent, t, s);
}`,
    tests: `const parent = { Object: null, Shape: 'Object', Circle: 'Shape', Square: 'Shape', Str: 'Object' };
test('a class and its subclass may alias', () => {
  expect(typeMayAlias(parent, 'Shape', 'Circle')).toBe(true);
  expect(typeMayAlias(parent, 'Circle', 'Shape')).toBe(true);
});
test('unrelated classes never alias', () => {
  expect(typeMayAlias(parent, 'Circle', 'Str')).toBe(false);
});
test('siblings never alias', () => {
  expect(typeMayAlias(parent, 'Circle', 'Square')).toBe(false);
});
test('the root may alias anything', () => {
  expect(typeMayAlias(parent, 'Object', 'Square')).toBe(true);
});
test('a type with itself', () => {
  expect(typeMayAlias(parent, 'Str', 'Str')).toBe(true);
});`,
    hints: [
      'An object of class Circle is also a Shape and an Object. Which types can describe one object at once?',
      'With single inheritance, two types share an object exactly when one of them is on the other’s chain of superclasses (or they are equal).',
      'Write a helper that walks `c = parent[c]` up from one type until `null`, checking for the other; try it both ways round.',
    ],
    walkthrough: `**How to think about it.** A reference typed \`Shape\` can point at a Shape, a Circle or a Square; a reference typed \`Str\` can point only at strings. Two references may alias when some single object could be pointed at by both, which means the object's class is a subclass of both types. In a tree (single inheritance) that happens exactly when one type is an ancestor of the other, or they are the same type: then the lower one's objects fit both. If neither is above the other, their subtrees never meet, so no object has both types, and the answer is a safe "no".

**The solution, line by line.**

- \`function isAncestor(parent, a, b) {\` asks "is \`a\` equal to \`b\` or above it?".
- \`for (let c = b; c !== null; c = parent[c]) {\` climbs from \`b\` to the root, one superclass at a time; the root's parent is \`null\`, which ends the loop.
- \`if (c === a) return true;\` : we met \`a\` on the way up, so \`a\` is \`b\` or one of its ancestors.
- \`return false;\` : we reached the root without meeting \`a\`.
- \`typeMayAlias\` tries both directions with \`||\`, because we do not know which of the two types is the higher one.

**Common wrong attempts.**

- Checking only one direction (\`isAncestor(parent, s, t)\`) says \`Circle\` and \`Shape\` do not alias, because \`Circle\` is not above \`Shape\`. That is a wrong "no", the dangerous kind.
- Saying two types alias when they share *any* ancestor makes \`Circle\` and \`Square\` (both Shapes, both Objects) "may alias", which is safe but throws away exactly the precision type-based analysis exists for. In Java, every pair of classes shares \`Object\`, so this would answer "may" for everything.`,
    wrong: [
      {
        code: `function typeMayAlias(parent, s, t) {
  for (let c = t; c !== null;
       c = parent[c]) {
    if (c === s) return true;
  }
  return false;
}`,
        why: 'This only checks whether `s` is above `t`. With `s = Circle, t = Shape` it says false, a wrong “no”.',
      },
      {
        code: `function typeMayAlias(parent, s, t) {
  return parent[s] === parent[t]
    || s === t;
}`,
        why: 'Sharing a parent makes siblings like Circle and Square “may alias”, and misses Shape with Circle, whose parents differ.',
      },
    ],
  },
  pointsTo: {
    title: 'Andersen for copies and allocations',
    prompt: 'Statements are `[\'new\', a, site]` (`a = {}` at allocation site `site`) or `[\'copy\', a, b]` (`a = b`). Order doesn’t matter (the analysis is flow-insensitive). Write `pointsTo(stmts)` returning an object mapping **every variable mentioned** to its sorted points-to set, and `mayAlias(pts, x, y)`.',
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
      'Keep a `Map` from variable to a `Set` of sites, creating an empty set the first time a name is seen, so every variable mentioned gets an entry.',
      '`new` adds a site to `a`’s set; `copy a b` adds everything in `b`’s set to `a`’s set (not the other way round).',
      'One pass is not enough when a copy comes before its source gets objects. Wrap the pass in a loop that repeats until no set grew.',
    ],
    walkthrough: `**How to think about it.** This is Andersen's analysis restricted to two kinds of statement. Start from the rules: \`new\` puts one site into a set, and \`copy a b\` makes \`pts(a)\` include \`pts(b)\`. Nothing is ever removed and there are finitely many sites, so if we keep applying the rules until nothing changes, we must stop, and what we stop at is the answer (a fixpoint, as in the dataflow chapters). The only real decision is how to know when to stop: keep a flag that records whether anything grew during a pass.

**The solution, line by line.**

- \`const pts = new Map();\` maps each variable name to a \`Set\` of site names.
- \`const get = (v) => { ... }\` returns \`v\`'s set, creating an empty one the first time. Using it for both sides of every statement is what makes every variable mentioned appear in the result, even one that ends up empty.
- \`let changed = true; while (changed) {\` : run at least one pass, and keep going while the last pass changed something.
- \`changed = false;\` : assume this pass will change nothing until we see otherwise.
- \`for (const [kind, a, b] of stmts) {\` takes each statement apart: its kind, the variable written (\`a\`), and either a site (for \`new\`) or the variable read (for \`copy\`).
- \`const to = get(a); const n = to.size;\` : remember how big the destination set was.
- \`if (kind === 'new') { to.add(b); }\` adds the site.
- \`else { for (const o of get(b)) { to.add(o); } }\` adds every site the source may point at. A \`Set\` ignores sites it already has.
- \`if (to.size !== n) changed = true;\` : if the set grew, another pass is needed.
- After the loop, \`out[v] = [...set].sort();\` turns each set into a sorted array so the tests can compare them.
- \`mayAlias\` returns whether some site in \`x\`'s set is also in \`y\`'s: \`some\` plus \`includes\` is "the sets intersect".

**Common wrong attempts.**

- A single pass (no \`while\`) misses objects that arrive at \`b\` after \`c = b\` was processed. The second test, with its statements in reverse order, catches this.
- Making \`a\` share \`b\`'s \`Set\` object (\`pts.set(a, get(b))\`) seems neat, but then anything later added to either name shows up in both, so \`b = a; b = {}\` would make \`a\` point at the new object. That is closer to Steensgaard's merging than to Andersen's inclusion, and the fourth test catches it.`,
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
        why: 'A single pass misses objects that reach `b` after `c = b` was processed. A flow-insensitive analysis needs a fixpoint.',
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
        why: 'Sharing one `Set` between `a` and `b` makes copies flow both ways: `b = a; b = {}` wrongly makes `a` point at the new object.',
      },
    ],
  },
  unifyPointsTo: {
    optional: true,
    title: 'Steensgaard with union-find',
    prompt: 'Same statements as before (`new` and `copy`), but now write Steensgaard’s analysis. Each variable points at one box; `copy a b` merges the boxes of `a` and `b` (union-find). `new a site` adds the site to `a`’s box. Return each variable’s sorted sites. One pass is enough.',
    starter: `function unifyPointsTo(stmts) {
  // your code here
  return {};
}

console.log(unifyPointsTo([
  ['new', 'a', 'o1'],
  ['new', 'b', 'o2'],
  ['copy', 'c', 'a'],
  ['copy', 'c', 'b'],
]).a); // ['o1', 'o2']`,
    solution: `function unifyPointsTo(stmts) {
  const up = new Map();    // parent
  const sites = new Map(); // at roots
  const box = new Map();   // var: box
  let next = 0;
  const find = (x) => {
    while (up.get(x) !== x) {
      x = up.get(x);
    }
    return x;
  };
  const boxOf = (v) => {
    if (!box.has(v)) {
      const b = next++;
      up.set(b, b);
      sites.set(b, new Set());
      box.set(v, b);
    }
    return find(box.get(v));
  };
  for (const [kind, a, b] of stmts) {
    const x = boxOf(a);
    if (kind === 'new') {
      sites.get(x).add(b);
      continue;
    }
    const y = boxOf(b);
    if (x === y) continue;
    up.set(y, x);
    for (const s of sites.get(y)) {
      sites.get(x).add(s);
    }
  }
  const out = {};
  for (const v of box.keys()) {
    out[v] = [...sites.get(boxOf(v))]
      .sort();
  }
  return out;
}`,
    tests: `test('a copy shares the box', () => {
  expect(unifyPointsTo([['new', 'a', 'o1'], ['copy', 'b', 'a']])).toEqual({ a: ['o1'], b: ['o1'] });
});
test('merging smears both ways', () => {
  const p = unifyPointsTo([['new', 'a', 'o1'], ['new', 'b', 'o2'], ['copy', 'c', 'a'], ['copy', 'c', 'b']]);
  expect(p.a).toEqual(['o1', 'o2']);
  expect(p.b).toEqual(['o1', 'o2']);
});
test('order does not matter', () => {
  const p = unifyPointsTo([['copy', 'c', 'b'], ['copy', 'b', 'a'], ['new', 'a', 'o1']]);
  expect(p.c).toEqual(['o1']);
});
test('separate names stay separate', () => {
  const p = unifyPointsTo([['new', 'a', 'o1'], ['new', 'b', 'o2']]);
  expect(p).toEqual({ a: ['o1'], b: ['o2'] });
});`,
    hints: [
      'Give each variable a box number the first time you see it. A box either is its own root or points `up` to another box.',
      '`find(x)` follows `up` until it reaches a box whose `up` is itself: the root. Keep the sites only on roots.',
      'For a copy, find both roots; if they differ, point one root at the other and move its sites across. A `new` adds to the root of `a`’s box.',
    ],
    walkthrough: `**How to think about it.** Steensgaard replaces "a includes b" with "a and b are the same", and "the same" is an equivalence that only ever merges, so union-find is the natural structure: each box points \`up\` to another, and following \`up\` reaches a root that stands for the whole group. Because merging is symmetric and permanent, the order of statements no longer matters and one pass suffices: a site added before or after a merge ends up in the same root either way.

**The solution, line by line.**

- \`up\`, \`sites\` and \`box\` hold, respectively, each box's parent, the sites stored at each root, and each variable's (original) box.
- \`find(x)\` climbs \`up\` until a box is its own parent.
- \`boxOf(v)\` creates a new root box for a new variable (its own parent, with an empty set) and returns the root of \`v\`'s box.
- For \`new\`: add the site to the root of \`a\`'s box.
- For \`copy\`: find both roots; if they are already one, nothing to do; otherwise \`up.set(y, x)\` hangs \`y\` under \`x\`, and its sites move into \`x\`'s set.
- At the end, each variable reports the sites of its box's root.

**Common wrong attempts.** Copying sets instead of merging (that is Andersen, which would need repeated passes); and storing sites on non-root boxes, so that a site added to an old box after a merge is never seen through the new root. Real implementations also add path compression and union by size, which is where "almost linear" comes from; they do not change the answer.`,
    wrong: [
      {
        code: `function unifyPointsTo(stmts) {
  const pts = new Map();
  const get = (v) => {
    if (!pts.has(v)) {
      pts.set(v, new Set());
    }
    return pts.get(v);
  };
  for (const [kind, a, b] of stmts) {
    if (kind === 'new') get(a).add(b);
    else for (const o of get(b)) {
      get(a).add(o);
    }
  }
  const out = {};
  for (const [v, s] of pts) {
    out[v] = [...s].sort();
  }
  return out;
}`,
        why: 'This copies one way, once, like a single pass of Andersen: it never merges boxes, so `a` stays at `[\'o1\']`, and reversed statements lose objects.',
      },
    ],
  },
  fieldPointsTo: {
    optional: true,
    title: 'Points-to through fields',
    prompt: 'Add two statements to Andersen’s: `[\'store\', a, f, b]` for `a.f = b` and `[\'load\', c, a, f]` for `c = a.f`. Track a points-to set for each heap cell `site.f` (for example `\'o1.f\'`). Write `fieldPointsTo(stmts)` returning an object mapping each **variable** (not heap cell) to its sorted set.',
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
      'Use one `Map` for both variables and heap cells: a heap cell is a key like `\'o1.f\'`.',
      'A helper `flow(from, to)` that adds everything in `from`’s set to `to`’s set, and notes whether anything grew, makes the four statements one-liners.',
      'For `a.f = b`, flow `b` into `o.f` for each `o` in `pts(a)`. For `c = a.f`, flow `o.f` into `c`. Repeat until nothing changes, then report only keys without a dot.',
    ],
    walkthrough: `**How to think about it.** Fields add one level of indirection and nothing else: a heap cell \`o1.f\` is a place that can hold arrows, exactly like a variable, so it gets its own set. The store and load rules then say which cells to read and write, and they depend on \`pts(a)\`, which may still be growing, so the whole thing runs to a fixpoint.

**The solution, line by line.**

- One \`Map\` and one \`get\` serve variables and cells alike.
- \`flow(from, to)\` copies a set along one inclusion and sets \`changed\` if the destination grew; it is the \`copy\` rule as a helper.
- \`do { ... } while (changed);\` runs passes until one changes nothing.
- \`new\` adds a site (and records growth by hand).
- \`copy\` is \`flow(b, a)\`.
- \`store\`: for each object \`o\` that \`a\` may point at, flow \`c\` (the stored variable; the statement is \`[kind, a, f, b]\`, destructured as \`[kind, a, b, c]\`) into the cell \`o.f\`.
- \`load\`: for each object \`o\` that \`b\` (the base variable) may point at, flow the cell \`o.f\` into \`a\`.
- At the end, keys containing a dot are cells, so they are left out.

**Common wrong attempts.** Keying cells by *variable* (\`a.f\`) instead of by *object* (\`o1.f\`): then a store through the alias \`d\` lands in \`d.f\` and a load through \`a\` never sees it, which is precisely the aliasing the analysis exists to find. And, as before, a single pass. Keeping \`f\` and \`g\` apart is what makes this analysis *field-sensitive*.`,
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
        why: 'This keys heap cells by variable (`a.f`) instead of by object (`o1.f`), so a store through the alias `d` is never seen through `a`. It also makes only one pass.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `function f(a, b) { a.x = 1; b.x = 2; return a.x; }`, when may the compiler replace `return a.x` with `return 1`?',
    options: [
      {
        t: 'Always: `a.x` was just set to 1',
        why: 'Not when `a` and `b` are the same object: then `b.x = 2` overwrote it, and `f(o, o)` returns 2.',
      },
      {
        t: 'Only when it can prove `a` and `b` never alias',
        correct: true,
        why: 'A “no alias” answer means `b.x = 2` cannot touch `a.x`, so the read must give 1.',
      },
      {
        t: 'Only when `a` and `b` may alias',
        why: '“May” is the case where it must NOT make the change: the store through `b` might have overwritten `a.x`.',
      },
    ],
  },
  {
    q: 'An analysis is unsure whether `p` and `q` refer to the same object. Which answer must a sound analysis give?',
    options: [
      {
        t: '“No”, because most pairs do not alias',
        why: 'A wrong “no” lets the compiler break the program. Guessing is not allowed in that direction.',
      },
      {
        t: '“Must”, to be on the safe side',
        why: '“Must” is a strong claim too: acting on it (say, reusing a value read through `p` for `q`) would be wrong if they differ.',
      },
      {
        t: '“May”',
        correct: true,
        why: '“May” keeps both possibilities, so the compiler stays correct; it only gives up an optimisation.',
      },
    ],
  },
  {
    q: 'Which line, added after the `push` loop, still lets Viscosity turn `ps` into a struct of arrays?',
    options: [
      {
        t: '`console.log(ps[0] === ps[1]);`',
        why: '`===` compares identity, which does not exist for elements after the transformation.',
      },
      {
        t: '`const box = { p: ps[0] };`',
        why: 'The element is stored inside another object, out of sight.',
      },
      {
        t: '`const keep = ps[0]; const peek = () => keep.x;`',
        why: '`keep` is captured by a closure, so Viscosity cannot follow it.',
      },
      {
        t: '`const q = ps; q[0].x = 3;`',
        correct: true,
        why: '`q` is the same SSA value as the load of `ps`, a must-alias it can follow, and `.x = 3` is a field write it can rewrite.',
      },
    ],
  },
  {
    q: 'An analysis finds `pts(p) = {o1, o2}` and `pts(q) = {o2, o3}`. What can it say about `p` and `q`?',
    options: [
      {
        t: 'They must alias',
        why: '“Must” would need both to be one and the same object on every run. Each has two possibilities.',
      },
      {
        t: 'They may alias',
        correct: true,
        why: 'The sets share `o2`, so some run may make them the same object.',
      },
      {
        t: 'They never alias',
        why: 'That needs disjoint sets, and these share `o2`.',
      },
    ],
  },
  {
    q: 'A flow-insensitive analysis sees `c = a;` and later `c = b;`, with `a` and `b` pointing at sites `o1` and `o2`. What is `pts(c)`?',
    options: [
      {
        t: '`{o2}`, because the second assignment wins',
        why: 'That is true at run time after the second line. A flow-insensitive analysis gives one set for the whole program.',
      },
      {
        t: '`{}`, because the assignments cancel out',
        why: 'Points-to sets only grow.',
      },
      {
        t: '`{o1, o2}`',
        correct: true,
        why: 'Each copy adds its source’s set; ignoring order, `c` may point at either object.',
      },
      {
        t: '`{o1}`',
        why: 'The second assignment adds `o2` as well.',
      },
    ],
  },
];
