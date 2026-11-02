// Chapter 92 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'sysf-what': {
    q: 'What does System F add to the typed lambda calculus?',
    a: 'Type abstraction (Λα. e, a term that takes a type) and type application (e [T], passing one), with ∀ allowed anywhere in a type.',
  },
  'tabs-tapp': {
    q: 'If `e : ∀α. α → α`, what is the type of `e [bool]`?',
    a: '`bool → bool`: TApp substitutes bool for α.',
  },
  rank2: {
    q: 'What is a rank-2 type, and what does it allow that Hindley–Milner does not?',
    a: 'A type with a ∀ to the left of an arrow, like (∀α. α → α) → number; a parameter can then be used at several types.',
  },
  'sysf-ts': {
    q: 'In TypeScript, what corresponds to System F’s Λα and e [T]?',
    a: 'A generic’s type parameter `<T>` is the abstraction; `id<number>(5)` is the type application (usually inferred).',
  },
  'sysf-cost': {
    q: 'What does System F give up compared with Hindley–Milner?',
    a: 'Full type inference: for System F, whether an unannotated term has a type is undecidable, so annotations are needed.',
  },
  'dep-what': {
    q: 'What is a dependent type?',
    a: 'A type that mentions a value, such as Vect n a, whose length n is part of the type.',
  },
  'vect-read': {
    q: 'How is `(n : Nat) → Vect n a` read?',
    a: '“For each natural number n, a vector of n elements of type a”: the result type depends on the argument.',
  },
  'dep-check': {
    q: 'Why can checking dependent types require working out values?',
    a: 'Types contain expressions such as n + m, so deciding whether two types are equal may mean computing or proving that two values are equal.',
  },
  'ts-tuples': {
    q: 'What part of dependent types does TypeScript have?',
    a: 'Tuple types with a fixed length, such as [number, number]; the length must be written in the type, not computed by the program.',
  },
};

export const examples = {};

export const exercises = {
  'system-f': {
    title: 'A type checker for System F',
    prompt: 'Types are `NUM`, `BOOL`, type variables `tv(\'a\')`, `fn(from, to)` and `all(\'a\', body)` for ∀a. body; `same(s, t)` compares two types and `substT(t, a, s)` computes [a ↦ s] t. Terms are `n(5)`, `b(true)`, `v(x)`, `lam(x, type, body)` (the parameter’s type is written), `app(f, a)`, `tlam(\'a\', body)` for Λa. body, and `tapp(f, type)` for f [type]. Write `typeOf(env, e)` (env is a `Map` from names to types) using the chapter’s rules, calling `fail(message)` on a type error. You may assume every Λ uses a different type variable name.',
    starter: `// types
const tv = (name) =>
  ({ k: 'var', name });
const NUM = { k: 'number' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const all = (a, body) =>
  ({ k: 'all', a, body });
function show(t) {
  if (t.k === 'var') return t.name;
  if (t.k === 'all') {
    return '∀' + t.a + '. ' +
      show(t.body);
  }
  if (t.k !== 'fn') return t.k;
  const a = show(t.from);
  const wrap = t.from.k === 'fn' ||
    t.from.k === 'all';
  const l = wrap ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
function same(s, t) {
  if (s.k !== t.k) return false;
  if (s.k === 'var') {
    return s.name === t.name;
  }
  if (s.k === 'fn') {
    return same(s.from, t.from) &&
      same(s.to, t.to);
  }
  if (s.k === 'all') {
    return s.a === t.a &&
      same(s.body, t.body);
  }
  return true;
}
// [a ↦ s] t
function substT(t, a, s) {
  if (t.k === 'var') {
    return t.name === a ? s : t;
  }
  if (t.k === 'fn') {
    return fn(substT(t.from, a, s),
      substT(t.to, a, s));
  }
  if (t.k === 'all') {
    if (t.a === a) return t;
    return all(t.a,
      substT(t.body, a, s));
  }
  return t;
}
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, type, body) =>
  ({ e: 'lam', x, type, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const tlam = (a, body) =>
  ({ e: 'tlam', a, body });
const tapp = (f, type) =>
  ({ e: 'tapp', f, type });
const fail = (msg) => {
  throw new Error(msg);
};

function typeOf(env, e) {
  if (e.e === 'num') return NUM;
  fail('not yet: ' + e.e);
}`,
    solution: `// types
const tv = (name) =>
  ({ k: 'var', name });
const NUM = { k: 'number' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const all = (a, body) =>
  ({ k: 'all', a, body });
function show(t) {
  if (t.k === 'var') return t.name;
  if (t.k === 'all') {
    return '∀' + t.a + '. ' +
      show(t.body);
  }
  if (t.k !== 'fn') return t.k;
  const a = show(t.from);
  const wrap = t.from.k === 'fn' ||
    t.from.k === 'all';
  const l = wrap ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
function same(s, t) {
  if (s.k !== t.k) return false;
  if (s.k === 'var') {
    return s.name === t.name;
  }
  if (s.k === 'fn') {
    return same(s.from, t.from) &&
      same(s.to, t.to);
  }
  if (s.k === 'all') {
    return s.a === t.a &&
      same(s.body, t.body);
  }
  return true;
}
// [a ↦ s] t
function substT(t, a, s) {
  if (t.k === 'var') {
    return t.name === a ? s : t;
  }
  if (t.k === 'fn') {
    return fn(substT(t.from, a, s),
      substT(t.to, a, s));
  }
  if (t.k === 'all') {
    if (t.a === a) return t;
    return all(t.a,
      substT(t.body, a, s));
  }
  return t;
}
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, type, body) =>
  ({ e: 'lam', x, type, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const tlam = (a, body) =>
  ({ e: 'tlam', a, body });
const tapp = (f, type) =>
  ({ e: 'tapp', f, type });
const fail = (msg) => {
  throw new Error(msg);
};

function typeOf(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'lam') {
    const inner = new Map(env);
    inner.set(e.x, e.type);
    const r = typeOf(inner, e.body);
    return fn(e.type, r);
  }
  if (e.e === 'app') {
    const tf = typeOf(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    const ta = typeOf(env, e.a);
    if (!same(ta, tf.from)) {
      fail('wrong argument type');
    }
    return tf.to;
  }
  if (e.e === 'tlam') {
    const r = typeOf(env, e.body);
    return all(e.a, r);
  }
  // what is left: a type application
  const t = typeOf(env, e.f);
  if (t.k !== 'all') {
    fail('not polymorphic');
  }
  return substT(t.body, t.a, e.type);
}`,
    tests: `const a = tv('a'), bb = tv('b');
const ty = (e) => show(typeOf(new Map(), e));
const id = tlam('a', lam('x', a, v('x')));
test('the polymorphic identity', () => {
  expect(ty(id)).toBe('∀a. a → a');
});
test('type application substitutes', () => {
  expect(ty(tapp(id, NUM))).toBe('number → number');
  expect(ty(app(tapp(id, NUM), n(5)))).toBe('number');
  expect(ty(app(tapp(id, BOOL), b(true)))).toBe('bool');
});
test('nothing is inferred: apply to a type first', () => {
  expect(() => ty(app(id, n(5)))).toThrow();
  expect(() => ty(app(tapp(id, BOOL), n(5)))).toThrow();
  expect(() => ty(tapp(n(1), NUM))).toThrow();
});
test('two type parameters', () => {
  const k = tlam('a', tlam('b', lam('x', a, lam('y', bb, v('x')))));
  expect(ty(k)).toBe('∀a. ∀b. a → b → a');
  expect(ty(tapp(tapp(k, NUM), BOOL))).toBe('number → bool → number');
});
test('rank 2: a polymorphic parameter', () => {
  const pid = all('c', fn(tv('c'), tv('c')));
  const useF = lam('f', pid, app(tapp(v('f'), BOOL), app(tapp(v('f'), BOOL), b(true))));
  expect(ty(useF)).toBe('(∀c. c → c) → bool');
  const id2 = tlam('c', lam('z', tv('c'), v('z')));
  expect(ty(app(useF, id2))).toBe('bool');
  expect(() => ty(app(useF, lam('z', NUM, v('z'))))).toThrow();
});
test('errors', () => {
  expect(() => ty(app(n(1), n(2)))).toThrow();
  expect(() => ty(v('nope'))).toThrow();
});`,
    hints: [
      'Five of the cases are the simply typed lambda calculus you know: literals, variables, λ (the parameter’s type is written on it) and application (the argument’s type must be `same` as the parameter’s). Then add the two new rules.',
      'TAbs: a `tlam` has type `all(e.a, ...)` of its body’s type. TApp: the function part must have a type with `k === \'all\'`; otherwise fail.',
      'For a type application, return `substT(t.body, t.a, e.type)`: the body of the ∀ type with the type argument put in place of its variable. For a λ, return `fn(e.type, typeOf(inner, e.body))`, where `inner` is a copy of `env` with the parameter set to `e.type`.',
    ],
    walkthrough: `**How to think about it.** System F is the simply typed lambda calculus plus two rules, and with every type written in the program, the checker never has to guess: each case reads off types and compares them. That is the point of the exercise: compare this with algorithm W, where the λ case had to invent a variable and wait for unification. Here a λ says its parameter’s type, and a use of a polymorphic value says which type it wants.

**The solution, line by line.**

- \`if (e.e === 'num') return NUM;\` and the same for booleans.
- \`const t = env.get(e.x); return t ?? fail('unbound ' + e.x);\` A variable has the type the environment gives it, which may be a ∀ type (as for \`f\` in the rank-2 test).
- \`const inner = new Map(env); inner.set(e.x, e.type);\` A λ’s parameter has its written type.
- \`const r = typeOf(inner, e.body); return fn(e.type, r);\` and the λ’s type is an arrow from it to the body’s type.
- \`const tf = typeOf(env, e.f); if (tf.k !== 'fn') fail(...)\` An application needs a function; note that a ∀ type is *not* a function type, so applying \`id\` to a value before giving it a type fails here.
- \`const ta = typeOf(env, e.a); if (!same(ta, tf.from)) fail(...); return tf.to;\` The argument must have the parameter type exactly.
- \`const r = typeOf(env, e.body); return all(e.a, r);\` TAbs: the body’s type, with ∀ in front for the type parameter.
- \`const t = typeOf(env, e.f); if (t.k !== 'all') fail('not polymorphic');\` TApp: only a polymorphic value can be given a type argument.
- \`return substT(t.body, t.a, e.type);\` and the result is the ∀’s body with the type argument substituted for its variable.

**Common wrong attempts.**

- Returning \`t.body\` for a type application without substituting: \`id [number]\` would have type \`a → a\`, and the following application to 5 fails, since \`a\` is not \`number\`.
- Returning the body’s type for a \`tlam\` without the ∀: then \`id\` has type \`a → a\`, the type application fails (not polymorphic), and the type variable leaks out unbound.
- Skipping the argument check in an application: \`id [bool] 5\` would be accepted, with type bool, though 5 is a number.`,
    wrong: [
      {
        code: `// types
const tv = (name) =>
  ({ k: 'var', name });
const NUM = { k: 'number' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const all = (a, body) =>
  ({ k: 'all', a, body });
function show(t) {
  if (t.k === 'var') return t.name;
  if (t.k === 'all') {
    return '∀' + t.a + '. ' +
      show(t.body);
  }
  if (t.k !== 'fn') return t.k;
  const a = show(t.from);
  const wrap = t.from.k === 'fn' ||
    t.from.k === 'all';
  const l = wrap ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
function same(s, t) {
  if (s.k !== t.k) return false;
  if (s.k === 'var') {
    return s.name === t.name;
  }
  if (s.k === 'fn') {
    return same(s.from, t.from) &&
      same(s.to, t.to);
  }
  if (s.k === 'all') {
    return s.a === t.a &&
      same(s.body, t.body);
  }
  return true;
}
// [a ↦ s] t
function substT(t, a, s) {
  if (t.k === 'var') {
    return t.name === a ? s : t;
  }
  if (t.k === 'fn') {
    return fn(substT(t.from, a, s),
      substT(t.to, a, s));
  }
  if (t.k === 'all') {
    if (t.a === a) return t;
    return all(t.a,
      substT(t.body, a, s));
  }
  return t;
}
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, type, body) =>
  ({ e: 'lam', x, type, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const tlam = (a, body) =>
  ({ e: 'tlam', a, body });
const tapp = (f, type) =>
  ({ e: 'tapp', f, type });
const fail = (msg) => {
  throw new Error(msg);
};

function typeOf(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'lam') {
    const inner = new Map(env);
    inner.set(e.x, e.type);
    const r = typeOf(inner, e.body);
    return fn(e.type, r);
  }
  if (e.e === 'app') {
    const tf = typeOf(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    const ta = typeOf(env, e.a);
    if (!same(ta, tf.from)) {
      fail('wrong argument type');
    }
    return tf.to;
  }
  if (e.e === 'tlam') {
    const r = typeOf(env, e.body);
    return all(e.a, r);
  }
  // what is left: a type application
  const t = typeOf(env, e.f);
  if (t.k !== 'all') {
    fail('not polymorphic');
  }
  return t.body;
}`,
        why: 'The type argument is never substituted, so `id [number]` has type `a → a` instead of `number → number`.',
      },
      {
        code: `// types
const tv = (name) =>
  ({ k: 'var', name });
const NUM = { k: 'number' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const all = (a, body) =>
  ({ k: 'all', a, body });
function show(t) {
  if (t.k === 'var') return t.name;
  if (t.k === 'all') {
    return '∀' + t.a + '. ' +
      show(t.body);
  }
  if (t.k !== 'fn') return t.k;
  const a = show(t.from);
  const wrap = t.from.k === 'fn' ||
    t.from.k === 'all';
  const l = wrap ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
function same(s, t) {
  if (s.k !== t.k) return false;
  if (s.k === 'var') {
    return s.name === t.name;
  }
  if (s.k === 'fn') {
    return same(s.from, t.from) &&
      same(s.to, t.to);
  }
  if (s.k === 'all') {
    return s.a === t.a &&
      same(s.body, t.body);
  }
  return true;
}
// [a ↦ s] t
function substT(t, a, s) {
  if (t.k === 'var') {
    return t.name === a ? s : t;
  }
  if (t.k === 'fn') {
    return fn(substT(t.from, a, s),
      substT(t.to, a, s));
  }
  if (t.k === 'all') {
    if (t.a === a) return t;
    return all(t.a,
      substT(t.body, a, s));
  }
  return t;
}
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, type, body) =>
  ({ e: 'lam', x, type, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const tlam = (a, body) =>
  ({ e: 'tlam', a, body });
const tapp = (f, type) =>
  ({ e: 'tapp', f, type });
const fail = (msg) => {
  throw new Error(msg);
};

function typeOf(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'lam') {
    const inner = new Map(env);
    inner.set(e.x, e.type);
    const r = typeOf(inner, e.body);
    return fn(e.type, r);
  }
  if (e.e === 'app') {
    const tf = typeOf(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    const ta = typeOf(env, e.a);
    if (!same(ta, tf.from)) {
      fail('wrong argument type');
    }
    return tf.to;
  }
  if (e.e === 'tlam') {
    const r = typeOf(env, e.body);
    return r;
  }
  // what is left: a type application
  const t = typeOf(env, e.f);
  if (t.k !== 'all') {
    fail('not polymorphic');
  }
  return substT(t.body, t.a, e.type);
}`,
        why: 'Λ does not add a ∀, so `id` has type `a → a` and cannot be given a type argument.',
      },
      {
        code: `// types
const tv = (name) =>
  ({ k: 'var', name });
const NUM = { k: 'number' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const all = (a, body) =>
  ({ k: 'all', a, body });
function show(t) {
  if (t.k === 'var') return t.name;
  if (t.k === 'all') {
    return '∀' + t.a + '. ' +
      show(t.body);
  }
  if (t.k !== 'fn') return t.k;
  const a = show(t.from);
  const wrap = t.from.k === 'fn' ||
    t.from.k === 'all';
  const l = wrap ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
function same(s, t) {
  if (s.k !== t.k) return false;
  if (s.k === 'var') {
    return s.name === t.name;
  }
  if (s.k === 'fn') {
    return same(s.from, t.from) &&
      same(s.to, t.to);
  }
  if (s.k === 'all') {
    return s.a === t.a &&
      same(s.body, t.body);
  }
  return true;
}
// [a ↦ s] t
function substT(t, a, s) {
  if (t.k === 'var') {
    return t.name === a ? s : t;
  }
  if (t.k === 'fn') {
    return fn(substT(t.from, a, s),
      substT(t.to, a, s));
  }
  if (t.k === 'all') {
    if (t.a === a) return t;
    return all(t.a,
      substT(t.body, a, s));
  }
  return t;
}
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, type, body) =>
  ({ e: 'lam', x, type, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const tlam = (a, body) =>
  ({ e: 'tlam', a, body });
const tapp = (f, type) =>
  ({ e: 'tapp', f, type });
const fail = (msg) => {
  throw new Error(msg);
};

function typeOf(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'lam') {
    const inner = new Map(env);
    inner.set(e.x, e.type);
    const r = typeOf(inner, e.body);
    return fn(e.type, r);
  }
  if (e.e === 'app') {
    const tf = typeOf(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    const ta = typeOf(env, e.a);
    return tf.to;
  }
  if (e.e === 'tlam') {
    const r = typeOf(env, e.body);
    return all(e.a, r);
  }
  // what is left: a type application
  const t = typeOf(env, e.f);
  if (t.k !== 'all') {
    fail('not polymorphic');
  }
  return substT(t.body, t.a, e.type);
}`,
        why: 'The argument’s type is never compared with the parameter’s, so `id [bool] 5` is accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In System F, what is the type of `(Λα. λx:α. x) [bool]`?',
    options: [
      {
        t: '`∀α. α → α`',
        why: 'That is the type before the type application.',
      },
      {
        t: '`bool → bool`',
        correct: true,
        why: 'TApp substitutes bool for α in α → α.',
      },
      {
        t: '`bool`',
        why: 'No value has been passed yet; the result is still a function.',
      },
    ],
  },
  {
    q: 'Why can System F type `λf:(∀α. α → α). if f [bool] true then f [number] 1 else 2`, when Hindley–Milner cannot type the same program without annotations?',
    options: [
      {
        t: 'Because System F runs the program first',
        why: 'Neither runs the program; System F reads the type written on f.',
      },
      {
        t: 'Because System F has no booleans',
        why: 'Both languages here have booleans.',
      },
      {
        t: 'Because f’s annotated type has a ∀ to the left of the arrow (rank 2), so f can be applied at two types',
        correct: true,
        why: 'Hindley–Milner only puts ∀ on let-bound names; System F allows it anywhere, if you write it.',
      },
    ],
  },
  {
    q: 'Which TypeScript line is a type application, in System F’s sense?',
    options: [
      {
        t: '`id<number>(5)`',
        correct: true,
        why: 'The explicit type argument <number> is passed to the generic id.',
      },
      {
        t: '`function id<T>(x: T): T`',
        why: 'That declares a type parameter: it is the type abstraction.',
      },
      {
        t: '`const n: number = 5`',
        why: 'An ordinary annotation, with no type argument.',
      },
    ],
  },
  {
    q: 'In Idris, why is the definition of `++` that appends `xs` to itself rejected?',
    options: [
      {
        t: 'Because it loops forever',
        why: 'It terminates; the problem is the length.',
      },
      {
        t: 'Because Idris does not allow recursion',
        why: 'The correct definition is recursive too.',
      },
      {
        t: 'Because its type promises length n + m, and the broken body produces a different length',
        correct: true,
        why: 'Lengths are part of the types, so the mismatch is a type error.',
      },
    ],
  },
  {
    q: 'What does `type Vec2 = [number, number]` show about TypeScript?',
    options: [
      {
        t: 'That it has full dependent types',
        why: 'The length must be a literal in the type; it cannot depend on a value computed at run time.',
      },
      {
        t: 'That it can put a fixed length into a type, so `[1, 2, 3]` is not a Vec2',
        correct: true,
        why: 'Tuple types are a small piece of the dependent-types idea.',
      },
      {
        t: 'That arrays are always fixed-length',
        why: '`number[]` has no fixed length; only tuple types do.',
      },
    ],
  },
];
