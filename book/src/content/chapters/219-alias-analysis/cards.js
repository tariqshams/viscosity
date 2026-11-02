// Chapter 219 cards. Keys are stable ids: never rename them.

export const prompts = {
  'alias-what': {
    q: 'What question does alias analysis answer?',
    a: 'Whether two references must, may, or can never refer to the same object.',
  },
  'must-may-no': {
    q: 'Which alias answers can an optimizer act on?',
    a: '“Must” and “no”. “May” means both possibilities have to be kept.',
  },
  'wrong-no': {
    q: 'What happens if an alias analysis wrongly says “no alias”, and what if it wrongly says “may alias”?',
    a: 'A wrong “no” lets the compiler change what the program computes; a wrong “may” only costs an optimization (speed).',
  },
  'tbaa-what': {
    q: 'What does type-based alias analysis use to answer “no alias”?',
    a: 'The declared types: if no object can have both references’ types (a Point and a String), they cannot alias.',
  },
  'js-no-tbaa': {
    q: 'Why can’t a JavaScript compiler use TypeScript annotations for type-based alias analysis?',
    a: 'They are erased before the program runs and are unsound by design, so the program may not obey them.',
  },
  'element-not-object': {
    q: 'After `ps` becomes a struct of arrays, what is “element 3”?',
    a: 'A position, index 3, in each column. There is no object any more.',
  },
  'ssa-alias-ok': {
    q: 'Why can Viscosity rewrite `const p = ps[3]` as `const p = 3`?',
    a: '`p` is an SSA value that must alias element 3 of `ps` and nothing else, and every use of it is visible.',
  },
  'captured-var': {
    q: 'Why does `const peek = () => keep.x`, with `keep = ps[0]`, keep `ps` as objects?',
    a: '`keep` is captured, so it lives in memory, not as an SSA value; the closure can read the element at any time.',
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
};

export const exercises = {
  aliasKind: {
    title: 'Must, may or no, from the runs',
    prompt:
      'Imagine we could watch a program run several times and note, at one point in the code, which object each name refers to. `runs` is a list of such notes: each run is an object mapping a name to an object id, like `{ p: \'o1\', q: \'o2\' }`. Write `aliasKind(runs, p, q)` returning `\'must\'` if `p` and `q` refer to the same object in **every** run, `\'no\'` if they do in **no** run, and `\'may\'` otherwise. There is always at least one run.',
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
    prompt:
      'In a language with single inheritance, `parent` maps each class to its superclass (`null` for the root), e.g. `{ Object: null, Shape: \'Object\', Circle: \'Shape\', Str: \'Object\' }`. A reference of type `T` may point at an object of class `T` or any subclass. Write `typeMayAlias(parent, s, t)`: `true` if some object could have both types (one is the other or an ancestor of it), `false` otherwise.',
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
};

export const quiz = [
  {
    q: 'In `function f(a, b) { a.x = 1; b.x = 2; return a.x; }`, when may the compiler replace `return a.x` with `return 1`?',
    options: [
      { t: 'Always: `a.x` was just set to 1', why: 'Not when `a` and `b` are the same object: then `b.x = 2` overwrote it, and `f(o, o)` returns 2.' },
      { t: 'Only when it can prove `a` and `b` never alias', correct: true, why: 'A “no alias” answer means `b.x = 2` cannot touch `a.x`, so the read must give 1.' },
      { t: 'Only when `a` and `b` may alias', why: '“May” is the case where it must NOT make the change: the store through `b` might have overwritten `a.x`.' },
    ],
  },
  {
    q: 'An analysis is unsure whether `p` and `q` refer to the same object. Which answer must a sound analysis give?',
    options: [
      { t: '“No”, because most pairs do not alias', why: 'A wrong “no” lets the compiler break the program. Guessing is not allowed in that direction.' },
      { t: '“Must”, to be on the safe side', why: '“Must” is a strong claim too: acting on it (say, reusing a value read through `p` for `q`) would be wrong if they differ.' },
      { t: '“May”', correct: true, why: '“May” keeps both possibilities, so the compiler stays correct; it only gives up an optimization.' },
    ],
  },
  {
    q: 'Why does type-based alias analysis help a Java compiler much more than a JavaScript one?',
    options: [
      { t: 'Java has no objects on the heap', why: 'Java objects live on the heap, as JavaScript’s do.' },
      { t: 'Java’s declared types are checked and always true at run time; JavaScript has no declared types, and TypeScript’s are erased and unsound', correct: true, why: 'TBAA needs types the program is guaranteed to obey.' },
      { t: 'JavaScript objects cannot alias', why: 'They certainly can: aliasing is one of the first things chapter 7 shows.' },
      { t: 'Java has no closures', why: 'Closures make JavaScript harder in other ways, but they are not why type-based analysis helps Java.' },
    ],
  },
  {
    q: 'Which line, added after the `push` loop, still lets Viscosity turn `ps` into a struct of arrays?',
    options: [
      { t: '`console.log(ps[0] === ps[1]);`', why: '`===` compares identity, which does not exist for elements after the transformation.' },
      { t: '`const box = { p: ps[0] };`', why: 'The element is stored inside another object, out of sight.' },
      { t: '`const keep = ps[0]; const peek = () => keep.x;`', why: '`keep` is captured by a closure, so Viscosity cannot follow it.' },
      { t: '`const q = ps; q[0].x = 3;`', correct: true, why: '`q` is the same SSA value as the load of `ps`, a must-alias it can follow, and `.x = 3` is a field write it can rewrite.' },
    ],
  },
  {
    q: 'Suppose Viscosity wrongly decided `keep[0]` and `ps[3]` never alias in this chapter’s first big program, and transformed `ps`. What would happen?',
    options: [
      { t: 'Nothing: alias answers only affect speed', why: 'They affect correctness. A wrong “no” licenses a change that breaks the program.' },
      { t: 'The program would print a different answer: the 7 written through `keep[0]` would go to a copy, not to `ps`’s column', correct: true, why: 'That is the last step of the diagram. Alias analysis must be sound.' },
      { t: 'V8 would detect the alias and deoptimize', why: 'V8 runs the code Viscosity emitted. The rewritten program is simply a different program.' },
    ],
  },
];
