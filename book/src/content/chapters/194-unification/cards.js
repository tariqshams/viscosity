// Chapter 90 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'tv-what': {
    q: 'What is a type variable?',
    a: 'A placeholder for a type the checker does not know yet, such as α (written `\'a` in our code).',
  },
  'tv-equation': {
    q: 'Checking `x * 2` where `x` has type `\'a`, what does the checker write down instead of failing?',
    a: 'The equation `\'a = number`, because `*` needs a number.',
  },
  'tv-leftover': {
    q: 'Why does `fn same(x) { return x; }` keep a variable in its type, `fn(\'a) -> \'a`?',
    a: 'Nothing in the body constrains `x`, so it works for any type, like TypeScript’s `<T>(x: T) => T`.',
  },
  'subst-what': {
    q: 'What is a substitution, in type inference?',
    a: 'A table from type variables to types, such as `{ \'a ↦ number }`, which is the solution to type equations.',
  },
  'resolve-vs-apply': {
    q: 'With `{ \'a ↦ number, \'b ↦ [\'a] }`, what is `\'b` after applying the substitution fully?',
    a: '`[number]`: apply follows the chain into the list as well, not only the top-level binding.',
  },
  'unify-what': {
    q: 'What does unification compute?',
    a: 'A substitution that makes two types the same, or a report that none exists.',
  },
  'unify-order': {
    q: 'Why must each step of unification look through the bindings made by earlier steps?',
    a: 'An earlier step may already have fixed a variable (say `\'a ↦ number`); ignoring that could bind it again to something else.',
  },
  'unify-fail': {
    q: 'Why can `fn(\'a) -> \'a` not be unified with `fn(number) -> string`?',
    a: 'The parameters give `\'a ↦ number`, so the results become `number` against `string`, which differ.',
  },
};

export const examples = {
  'apply-subst': {
    title: 'Applying a substitution',
    code: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}
const V = (tv) => ({ tv });
const t = {
  params: [V('a'), V('b')],
  ret: V('b'),
};
// The substitution { 'a ↦ number,
//   'b ↦ ['a] } as a plain object:
const s = {
  a: 'number',
  b: { list: V('a') },
};
console.log(show(t));
console.log(show(resolve(V('b'), s)));
console.log(show(apply(V('b'), s)));
console.log(show(apply(t, s)));
// 'c is not in s, so it stays:
console.log(show(apply(V('c'), s)));`,
  },
};

export const exercises = {
  unify: {
    title: 'Write unify',
    prompt: 'Write `unify(a, b, s)`: it returns a substitution that extends `s` (a plain object such as `{ a: \'number\' }`, meaning `\'a ↦ number`) and makes `a` and `b` the same type, or throws using `fail(a, b, s)`, which writes messages such as `cannot unify number with string`. Types are `\'number\'`, `\'string\'`, `\'bool\'`, `\'none\'`, `{ tv: \'a\' }`, `{ list: T }` and `{ params: [...], ret }`. Do not change the object you are given: return a new one (`{ ...s, [name]: type }`) whenever you add a binding. The helpers `resolve`, `apply` and `show` are given.',
    starter: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}

function unify(a, b, s) {
  a = resolve(a, s);
  b = resolve(b, s);
  // one case per pair of shapes;
  // return the new substitution
  return s;
}`,
    solution: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}

function unify(a, b, s) {
  a = resolve(a, s);
  b = resolve(b, s);
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) return { ...s, [a.tv]: b };
  if (b.tv) return { ...s, [b.tv]: a };
  if (typeof a === 'string' ||
      typeof b === 'string') {
    if (a === b) return s;
    fail(a, b, s);
  }
  if (a.list && b.list) {
    return unify(a.list, b.list, s);
  }
  if (a.params && b.params &&
      a.params.length ===
        b.params.length) {
    for (let i = 0; i < a.params.length;
      i++) {
      s = unify(a.params[i],
        b.params[i], s);
    }
    return unify(a.ret, b.ret, s);
  }
  fail(a, b, s);
}`,
    tests: `const V = (tv) => ({ tv });
const Lst = (list) => ({ list });
const Fn = (params, ret) => ({ params, ret });
const subst = (s) => Object.keys(s).sort()
  .map((k) => "'" + k + ' = ' + show(apply(V(k), s))).join(', ');
const err = (f) => {
  try { f(); } catch (x) { return x.message; }
  return 'no error';
};
test('equal base types need no bindings', () => {
  expect(subst(unify('number', 'number', {}))).toBe('');
});
test('different base types fail', () => {
  expect(err(() => unify('number', 'string', {})))
    .toBe('cannot unify number with string');
});
test('a variable is bound, on either side', () => {
  expect(subst(unify(V('a'), 'number', {}))).toBe("'a = number");
  expect(subst(unify('bool', V('b'), {}))).toBe("'b = bool");
});
test('a variable with itself needs no binding', () => {
  expect(subst(unify(V('a'), V('a'), {}))).toBe('');
});
test('lists unify their element types', () => {
  expect(subst(unify(Lst(V('a')), Lst('string'), {})))
    .toBe("'a = string");
  expect(err(() => unify(Lst('number'), 'number', {})))
    .toBe('cannot unify [number] with number');
});
test('functions unify parameters, then results', () => {
  const s = unify(Fn([V('a'), Lst(V('a'))], V('b')),
    Fn(['number', V('c')], V('c')), {});
  expect(subst(s)).toBe("'a = number, 'b = [number], 'c = [number]");
});
test('functions with different numbers of parameters', () => {
  expect(err(() => unify(Fn(['number'], 'bool'),
    Fn(['number', 'number'], 'bool'), {})))
    .toBe('cannot unify fn(number) -> bool with fn(number, number) -> bool');
});
test('bindings already made are respected', () => {
  expect(err(() => unify(Fn([V('a')], V('a')),
    Fn(['number'], 'string'), {})))
    .toBe('cannot unify number with string');
});
test('a chain of variables is followed', () => {
  const s = unify(V('a'), V('b'), {});
  expect(subst(unify(V('a'), 'bool', s)))
    .toBe("'a = bool, 'b = bool");
});
test('the substitution passed in is not changed', () => {
  const s0 = {};
  unify(V('a'), 'number', s0);
  expect(Object.keys(s0).length).toBe(0);
});`,
    hints: [
      'Start, as the starter does, by looking through bindings with `resolve`. Then handle variables: the same variable on both sides needs nothing; a variable on either side gets bound to the other side.',
      'Bind with `return { ...s, [a.tv]: b };`, which copies `s` and adds one entry. Base types are strings: if either side is a string, they unify only if they are equal (`a === b`); otherwise call `fail(a, b, s)`.',
      'Two lists: `return unify(a.list, b.list, s);`. Two function types with the same number of parameters: loop over the parameters, doing `s = unify(a.params[i], b.params[i], s);` so each step sees the bindings before it, then `return unify(a.ret, b.ret, s);`. Anything else: `fail(a, b, s)`.',
    ],
    walkthrough: `**How to think about it.** Unification is a walk over two type trees at once, so its shape is the shape of a type: one case for variables, one for base types, one for lists and one for functions. Before looking at shapes, though, a variable that is already bound must be replaced by what it is bound to (otherwise \`'a\` could be bound to \`number\` in one place and to \`string\` in another). Try one by hand first: \`['a]\` with \`[string]\` are both lists, so unify their insides, \`'a\` with \`string\`, which binds \`'a ↦ string\`.

**The solution, line by line.**

- \`a = resolve(a, s); b = resolve(b, s);\` replaces a bound variable by its binding (following chains such as \`'a ↦ 'b ↦ bool\`), so the rest of the function only ever sees unbound variables.
- \`if (a.tv && a.tv === b.tv) return s;\`: the same variable on both sides is already equal; binding \`'a ↦ 'a\` would make \`resolve\` loop forever.
- \`if (a.tv) return { ...s, [a.tv]: b };\` binds an unbound variable on the left to the whole right side. The spread copies \`s\`, so the caller's substitution is untouched (the tests check this).
- \`if (b.tv) return { ...s, [b.tv]: a };\` is the same for a variable on the right.
- \`if (typeof a === 'string' || typeof b === 'string') { if (a === b) return s; fail(a, b, s); }\`: base types are strings, so if either side is one, the two agree only if they are the same string; \`number\` with \`[number]\` fails here too.
- \`if (a.list && b.list) { return unify(a.list, b.list, s); }\`: two lists agree when their element types do.
- \`if (a.params && b.params && a.params.length === b.params.length) {\` takes two function types with the same number of parameters.
- \`s = unify(a.params[i], b.params[i], s);\` inside the loop is the heart of it: each pair is unified with the substitution produced by the pair before, which is how \`fn('a) -> 'a\` against \`fn(number) -> string\` notices that \`'a\` is already \`number\` when it reaches the results.
- \`return unify(a.ret, b.ret, s);\` finishes with the result types.
- \`fail(a, b, s);\` covers every other pair: a list with a function, or functions with different numbers of parameters.

**Common wrong attempts.**

- Forgetting \`resolve\`: \`'a\` is bound to \`number\` by the first parameter, then bound a second time, to \`string\` by the result, so \`fn('a) -> 'a\` and \`fn(number) -> string\` wrongly unify.
- Writing \`unify(a.params[i], b.params[i], s);\` without \`s =\`: each step starts from the old substitution and its bindings are thrown away.
- Changing \`s\` in place (\`s[a.tv] = b\`): it seems to work, but a caller that tried one unification and then wanted the old substitution back would find it changed. The inference of the next chapters keeps substitutions as values that never change, so this one would break it.

(One case is still missing. Try \`unify({ tv: 'a' }, { list: { tv: 'a' } }, {})\` and then \`apply\` the result: the next chapter explains what goes wrong, and the one line that fixes it.)`,
    wrong: [
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}

function unify(a, b, s) {
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) return { ...s, [a.tv]: b };
  if (b.tv) return { ...s, [b.tv]: a };
  if (typeof a === 'string' ||
      typeof b === 'string') {
    if (a === b) return s;
    fail(a, b, s);
  }
  if (a.list && b.list) {
    return unify(a.list, b.list, s);
  }
  if (a.params && b.params &&
      a.params.length ===
        b.params.length) {
    for (let i = 0; i < a.params.length;
      i++) {
      s = unify(a.params[i],
        b.params[i], s);
    }
    return unify(a.ret, b.ret, s);
  }
  fail(a, b, s);
}`,
        why: 'Without `resolve`, a variable that is already bound gets bound again, so `fn(\'a) -> \'a` wrongly unifies with `fn(number) -> string`.',
      },
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}

function unify(a, b, s) {
  a = resolve(a, s);
  b = resolve(b, s);
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) return { ...s, [a.tv]: b };
  if (b.tv) return { ...s, [b.tv]: a };
  if (typeof a === 'string' ||
      typeof b === 'string') {
    if (a === b) return s;
    fail(a, b, s);
  }
  if (a.list && b.list) {
    return unify(a.list, b.list, s);
  }
  if (a.params && b.params &&
      a.params.length ===
        b.params.length) {
    for (let i = 0; i < a.params.length;
      i++) {
      unify(a.params[i],
        b.params[i], s);
    }
    return unify(a.ret, b.ret, s);
  }
  fail(a, b, s);
}`,
        why: 'The parameters’ bindings are thrown away, because the loop never stores what `unify` returns.',
      },
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { tv: 'a' } (a variable),
// { list: T }, { params: [...], ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.tv) return "'" + t.tv;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
// Follow a variable's bindings.
function resolve(t, s) {
  while (t.tv && s[t.tv]) t = s[t.tv];
  return t;
}
// Apply substitution s all through t.
function apply(t, s) {
  t = resolve(t, s);
  if (typeof t === 'string' || t.tv) {
    return t;
  }
  if (t.list) {
    return { list: apply(t.list, s) };
  }
  return {
    params: t.params.map(
      (p) => apply(p, s)),
    ret: apply(t.ret, s),
  };
}
function fail(a, b, s) {
  throw new Error('cannot unify ' +
    show(apply(a, s)) + ' with ' +
    show(apply(b, s)));
}

function unify(a, b, s) {
  a = resolve(a, s);
  b = resolve(b, s);
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) {
    s[a.tv] = b;
    return s;
  }
  if (b.tv) return { ...s, [b.tv]: a };
  if (typeof a === 'string' ||
      typeof b === 'string') {
    if (a === b) return s;
    fail(a, b, s);
  }
  if (a.list && b.list) {
    return unify(a.list, b.list, s);
  }
  if (a.params && b.params &&
      a.params.length ===
        b.params.length) {
    for (let i = 0; i < a.params.length;
      i++) {
      s = unify(a.params[i],
        b.params[i], s);
    }
    return unify(a.ret, b.ret, s);
  }
  fail(a, b, s);
}`,
        why: 'It changes the substitution it was given instead of returning a new one.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `fn double(x) { return x * 2; }` tell the checker about `x`, whose type is `\'a`?',
    options: [
      {
        t: 'Nothing, since `x` has no annotation',
        why: 'The body uses `x` with `*`, which is a strong clue.',
      },
      {
        t: '`\'a = number`, because `*` takes only numbers',
        correct: true,
        why: 'Each use of `x` adds an equation; this one is solved at once.',
      },
      {
        t: 'That `double` works for any type',
        why: 'That would be true only if nothing in the body constrained `x`.',
      },
    ],
  },
  {
    q: 'Apply `{ \'a ↦ string }` to `fn(\'a, \'b) -> [\'a]`. What do you get?',
    options: [
      {
        t: '`fn(string, \'b) -> [string]`',
        correct: true,
        why: 'Every `\'a` is replaced, including the one inside the list; `\'b` is not in the table, so it stays.',
      },
      {
        t: '`fn(string, string) -> [string]`',
        why: '`\'b` has no entry, so it is not replaced.',
      },
      {
        t: '`fn(string, \'b) -> [\'a]`',
        why: 'Applying a substitution reaches inside list types too.',
      },
    ],
  },
  {
    q: 'Which pair cannot be unified?',
    options: [
      {
        t: '`\'a` and `[number]`',
        why: 'Bind `\'a ↦ [number]`.',
      },
      {
        t: '`[\'a]` and `[\'b]`',
        why: 'Their elements unify: `\'a ↦ \'b`.',
      },
      {
        t: '`[number]` and `fn(number) -> number`',
        correct: true,
        why: 'A list and a function have different shapes, so no substitution can make them equal.',
      },
      {
        t: '`fn(\'a) -> bool` and `fn(string) -> \'b`',
        why: '`\'a ↦ string` and `\'b ↦ bool`.',
      },
    ],
  },
  {
    q: 'Unifying `fn(\'a, \'a) -> none` with `fn(number, string) -> none`, what happens?',
    options: [
      {
        t: 'It succeeds with `\'a ↦ number`',
        why: 'The second parameter then needs `number` to equal `string`.',
      },
      {
        t: 'It succeeds with `\'a ↦ string`',
        why: 'The first parameter already bound `\'a` to `number`.',
      },
      {
        t: 'It fails: after `\'a ↦ number`, the second parameters are `number` and `string`',
        correct: true,
        why: 'The same variable in two places must be the same type in both.',
      },
    ],
  },
  {
    q: 'Why is applying a type substitution simpler than chapter 186’s substitution in λ-terms?',
    options: [
      {
        t: 'Types have no λ that binds variables, so nothing can be captured and nothing needs renaming',
        correct: true,
        why: 'Capture only happens under a binder, and these types have none.',
      },
      {
        t: 'Types are shorter',
        why: 'Length has nothing to do with it; the difference is binders.',
      },
      {
        t: 'It is not simpler: it also renames variables',
        why: 'No renaming is needed, because there is nothing to capture a variable.',
      },
    ],
  },
];
