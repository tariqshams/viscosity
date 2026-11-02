// Chapter 197 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'w-what': {
    q: 'What does algorithm W take, and what does it return?',
    a: 'An environment and a term with no annotations; it returns a substitution together with the term’s most general type, or fails if the term has no type.',
  },
  'w-var': {
    q: 'What does W do when it reaches a variable?',
    a: 'Looks up the variable’s scheme in the environment and instantiates it with fresh type variables.',
  },
  'w-lam': {
    q: 'What does W do with `λx. e`?',
    a: 'Gives x a fresh type variable α (with no ∀), infers e with x : α, and returns α → (the type of e).',
  },
  'w-app': {
    q: 'Where do W’s equations come from in `e₁ e₂`?',
    a: 'It infers both sides, makes a fresh β for the result, and unifies e₁’s type with (e₂’s type) → β.',
  },
  'w-let': {
    q: 'What does W do with `let x = e₁ in e₂`?',
    a: 'Infers e₁, generalises its type in the current environment, and infers e₂ with x bound to that scheme.',
  },
  'w-if': {
    q: 'Which two unifications does W make for an `if`?',
    a: 'The condition’s type with bool, and the two branches’ types with each other.',
  },
  'principal-what': {
    q: 'What is a principal type?',
    a: 'A type of the term that has every other type of the term as an instance: the most general one.',
  },
  'instance-of': {
    q: 'Why is `(number → number) → number → number` an instance of `(a → a) → a → a`?',
    a: 'Substituting number for a in the second gives the first.',
  },
  'w-errors': {
    q: 'How does W report that a term has no type?',
    a: 'A unification fails: two different constructors (like bool and number), or the occurs check (like x x).',
  },
};

export const examples = {};

export const exercises = {
  infer: {
    title: 'Hindley–Milner inference',
    prompt: 'Terms are data: `v(x)`, `n(1)`, `b(true)`, `lam(x, body)`, `app(f, a)`, `letE(x, def, body)` and `ifE(c, t, f)`. Types are as in the last chapter, and everything else is given: `fresh`, `unify` (which updates the shared substitution `S`, and throws if two types cannot be made equal), `resolve`, `generalize(env, t)` and `instantiate(s)`. Environments are `Map`s from names to schemes `{ vars, type }`. Write `infer(env, e)`, algorithm W: return the type of `e` (it need not be resolved), throwing an `Error` for an unbound variable. `typeOf(e)` runs it from an empty environment and prints the answer with variables renamed `a`, `b`, ...',
    starter: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  throw new Error('not yet: ' + e.e);
}`,
    solution: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const s = env.get(e.x);
    if (!s) {
      throw new Error('unbound ' + e.x);
    }
    return instantiate(s);
  }
  if (e.e === 'lam') {
    const a = fresh();
    const mono = { vars: [], type: a };
    const inner = new Map(env);
    inner.set(e.x, mono);
    return fn(a, infer(inner, e.body));
  }
  if (e.e === 'app') {
    const tf = infer(env, e.f);
    const ta = infer(env, e.a);
    const r = fresh();
    unify(tf, fn(ta, r));
    return r;
  }
  if (e.e === 'let') {
    const t1 = infer(env, e.def);
    const inner = new Map(env);
    inner.set(e.x, generalize(env, t1));
    return infer(inner, e.body);
  }
  // what is left is an if
  unify(infer(env, e.c), BOOL);
  const t = infer(env, e.t);
  unify(t, infer(env, e.f));
  return t;
}`,
    tests: `const id = lam('x', v('x'));
test('constants and the identity', () => {
  expect(typeOf(n(1))).toBe('number');
  expect(typeOf(b(true))).toBe('bool');
  expect(typeOf(id)).toBe('a → a');
});
test('two parameters keep separate variables', () => {
  expect(typeOf(lam('x', lam('y', v('x'))))).toBe('a → b → a');
});
test('twice: (a → a) → a → a', () => {
  const tw = lam('f', lam('x', app(v('f'), app(v('f'), v('x')))));
  expect(typeOf(tw)).toBe('(a → a) → a → a');
});
test('applying a function', () => {
  expect(typeOf(app(id, n(1)))).toBe('number');
  expect(typeOf(ifE(b(true), n(1), n(2)))).toBe('number');
});
test('let-polymorphism: id at bool and at number', () => {
  const e = letE('id', id, ifE(app(v('id'), b(true)), app(v('id'), n(1)), n(2)));
  expect(typeOf(e)).toBe('number');
  const k = lam('x', lam('y', v('x')));
  expect(typeOf(letE('k', k, app(app(v('k'), n(1)), b(true))))).toBe('number');
  expect(typeOf(letE('id', id, app(v('id'), v('id'))))).toBe('a → a');
});
test('a parameter has one type', () => {
  const e = lam('f', ifE(app(v('f'), b(true)), app(v('f'), n(1)), n(2)));
  expect(() => typeOf(e)).toThrow();
});
test('no generalising what the environment uses', () => {
  const e = lam('x', letE('y', v('x'), ifE(v('y'), v('y'), n(1))));
  expect(() => typeOf(e)).toThrow();
});
test('type errors are reported', () => {
  expect(() => typeOf(lam('x', app(v('x'), v('x'))))).toThrow();
  expect(() => typeOf(ifE(n(1), n(2), n(3)))).toThrow();
  expect(() => typeOf(ifE(b(true), n(1), b(false)))).toThrow();
  expect(() => typeOf(app(n(1), n(2)))).toThrow();
  expect(() => typeOf(v('nope'))).toThrow();
});`,
    hints: [
      'Write one case per kind of term, following the chapter’s table: num, bool, var, lam, app, let, if. A chain of `if (e.e === ...)` tests keeps them side by side.',
      'var: look the name up in `env` (throw if it is missing) and return `instantiate` of the scheme. lam: make `a = fresh()`, copy the environment with `new Map(env)`, bind the parameter to the scheme `{ vars: [], type: a }`, and return `fn(a, ...)` of the body’s type.',
      'app: infer the function and the argument, make `r = fresh()`, call `unify(tf, fn(ta, r))`, return `r`. let: infer the definition, then bind `generalize(env, t1)` in a copy of the environment and infer the body. if: `unify(infer(env, e.c), BOOL)`, infer both branches and unify them, and return one of them.',
    ],
    walkthrough: `**How to think about it.** W is a recursive walk over the term, and each case of the chapter’s table becomes a few lines. The work is shared out: unification does the solving, \`generalize\` and \`instantiate\` do the polymorphism, and \`infer\` only has to call them at the right moments. Two choices matter. A λ’s parameter is bound with an *empty* list of \`vars\`, because parameters are never polymorphic; and a \`let\` generalises in the environment *outside* the let (\`env\`), because that is the environment the definition was inferred in.

**The solution, line by line.**

- \`if (e.e === 'num') return NUM;\` and \`if (e.e === 'bool') return BOOL;\` Literals have fixed types; each later \`if (e.e === ...)\` picks one kind of term.
- \`const s = env.get(e.x);\` looks up a variable’s scheme; \`if (!s) { throw new Error('unbound ' + e.x); }\` reports a name that is not in scope.
- \`return instantiate(s);\` gives this use its own fresh copy: this is where \`id\` can be a bool function here and a number function there.
- \`const a = fresh();\` In a λ, the parameter’s type is unknown, so it gets a new variable.
- \`const mono = { vars: [], type: a };\` is a scheme with no blanks, and \`const inner = new Map(env); inner.set(e.x, mono);\` makes the body’s environment, without changing the outer one (the parameter is only in scope inside), and binds the parameter monomorphically.
- \`return fn(a, infer(inner, e.body));\` The λ’s type is “a to whatever the body is”; by the time anyone resolves it, the body’s uses of the parameter will have settled \`a\`.
- \`const tf = infer(env, e.f); const ta = infer(env, e.a);\` In an application, infer both sides first.
- \`const r = fresh(); unify(tf, fn(ta, r)); return r;\` The function must take the argument’s type to something; call that something \`r\`, unify, and the result is \`r\`. If \`e.f\` was a number, this unify throws.
- \`const t1 = infer(env, e.def);\` In a let, infer the definition.
- \`inner.set(e.x, generalize(env, t1));\` binds the name to its scheme in a copy of the environment; \`generalize\` resolves \`t1\` first, so the ∀ goes on the variables still open after unification.
- \`return infer(inner, e.body);\` The let’s type is its body’s type.
- \`unify(infer(env, e.c), BOOL);\` What is left is an if (the comment says so), and an if’s condition must be a bool.
- \`const t = infer(env, e.t); unify(t, infer(env, e.f)); return t;\` Both branches must agree, and the if has their type.

**Common wrong attempts.**

- Returning \`s.type\` for a variable instead of \`instantiate(s)\`: every use of \`id\` shares one copy again, so \`id true\` and \`id 1\` clash.
- Binding a let’s name to \`{ vars: [], type: t1 }\`: that is the inference of the chapter *Inferring types, and the occurs check*, with no polymorphism at all, and the same test fails.
- Generalising a λ’s parameter (\`generalize(env, a)\` instead of \`mono\`): then \`λf. if f true then f 1 else 2\` is accepted, though \`f\` cannot be both.
- Forgetting to unify the two branches of an if: \`if true then 1 else false\` would be accepted.`,
    wrong: [
      {
        code: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const s = env.get(e.x);
    if (!s) {
      throw new Error('unbound ' + e.x);
    }
    return s.type;
  }
  if (e.e === 'lam') {
    const a = fresh();
    const mono = { vars: [], type: a };
    const inner = new Map(env);
    inner.set(e.x, mono);
    return fn(a, infer(inner, e.body));
  }
  if (e.e === 'app') {
    const tf = infer(env, e.f);
    const ta = infer(env, e.a);
    const r = fresh();
    unify(tf, fn(ta, r));
    return r;
  }
  if (e.e === 'let') {
    const t1 = infer(env, e.def);
    const inner = new Map(env);
    inner.set(e.x, generalize(env, t1));
    return infer(inner, e.body);
  }
  // what is left is an if
  unify(infer(env, e.c), BOOL);
  const t = infer(env, e.t);
  unify(t, infer(env, e.f));
  return t;
}`,
        why: 'Without instantiation, every use of a let-bound name shares one copy of its type, so `id true` and `id 1` clash.',
      },
      {
        code: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const s = env.get(e.x);
    if (!s) {
      throw new Error('unbound ' + e.x);
    }
    return instantiate(s);
  }
  if (e.e === 'lam') {
    const a = fresh();
    const mono = { vars: [], type: a };
    const inner = new Map(env);
    inner.set(e.x, mono);
    return fn(a, infer(inner, e.body));
  }
  if (e.e === 'app') {
    const tf = infer(env, e.f);
    const ta = infer(env, e.a);
    const r = fresh();
    unify(tf, fn(ta, r));
    return r;
  }
  if (e.e === 'let') {
    const t1 = infer(env, e.def);
    const inner = new Map(env);
    inner.set(e.x,
      { vars: [], type: t1 });
    return infer(inner, e.body);
  }
  // what is left is an if
  unify(infer(env, e.c), BOOL);
  const t = infer(env, e.t);
  unify(t, infer(env, e.f));
  return t;
}`,
        why: 'The let never generalises, which is the inference of the chapter *Inferring types, and the occurs check*: no name can be used at two types.',
      },
      {
        code: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const s = env.get(e.x);
    if (!s) {
      throw new Error('unbound ' + e.x);
    }
    return instantiate(s);
  }
  if (e.e === 'lam') {
    const a = fresh();
    const mono = { vars: [], type: a };
    const inner = new Map(env);
    inner.set(e.x, generalize(env, a));
    return fn(a, infer(inner, e.body));
  }
  if (e.e === 'app') {
    const tf = infer(env, e.f);
    const ta = infer(env, e.a);
    const r = fresh();
    unify(tf, fn(ta, r));
    return r;
  }
  if (e.e === 'let') {
    const t1 = infer(env, e.def);
    const inner = new Map(env);
    inner.set(e.x, generalize(env, t1));
    return infer(inner, e.body);
  }
  // what is left is an if
  unify(infer(env, e.c), BOOL);
  const t = infer(env, e.t);
  unify(t, infer(env, e.f));
  return t;
}`,
        why: 'This generalises a λ’s parameter, so `λf. if f true then f 1 else 2` is wrongly accepted.',
      },
      {
        code: `const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const NUM = con('number');
const BOOL = con('bool');
let count = 0;
const fresh = () => tv('t' + ++count);
function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}

// terms
const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const letE = (x, def, body) =>
  ({ e: 'let', x, def, body });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });

// the substitution: name -> type
let S = new Map();
function resolve(t) {
  if (t.k === 'var') {
    const u = S.get(t.name);
    return u ? resolve(u) : t;
  }
  if (t.k === 'con') return t;
  return fn(resolve(t.from),
    resolve(t.to));
}
function occurs(x, t) {
  if (t.k === 'var') {
    return t.name === x;
  }
  if (t.k === 'con') return false;
  return occurs(x, t.from) ||
    occurs(x, t.to);
}
function unify(a, b) {
  a = resolve(a);
  b = resolve(b);
  if (a.k === 'var') {
    if (b.k === 'var' &&
      b.name === a.name) return;
    if (occurs(a.name, b)) {
      throw new Error('occurs check: ' +
        show(a) + ' in ' + show(b));
    }
    S.set(a.name, b);
    return;
  }
  if (b.k === 'var') return unify(b, a);
  if (a.k === 'fn' && b.k === 'fn') {
    unify(a.from, b.from);
    unify(a.to, b.to);
    return;
  }
  if (a.k === 'con' && b.k === 'con' &&
    a.name === b.name) return;
  throw new Error('cannot unify ' +
    show(a) + ' with ' + show(b));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const x of ftv(t.to)) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}
function generalize(env, t) {
  t = resolve(t);
  const inEnv = [];
  for (const s of env.values()) {
    const ty = resolve(s.type);
    for (const x of ftv(ty)) {
      if (!s.vars.includes(x)) {
        inEnv.push(x);
      }
    }
  }
  const vars = ftv(t)
    .filter((x) => !inEnv.includes(x));
  return { vars, type: t };
}
function instantiate(s) {
  const m = {};
  for (const x of s.vars) {
    m[x] = fresh();
  }
  return subst(s.type, m);
}

// infer from an empty environment,
// and name the variables a, b, c
function typeOf(e) {
  count = 0;
  S = new Map();
  const t0 = infer(new Map(), e);
  const t = resolve(t0);
  const m = {};
  ftv(t).forEach((x, i) => {
    m[x] = tv('abcdef'[i]);
  });
  return show(subst(t, m));
}

function infer(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const s = env.get(e.x);
    if (!s) {
      throw new Error('unbound ' + e.x);
    }
    return instantiate(s);
  }
  if (e.e === 'lam') {
    const a = fresh();
    const mono = { vars: [], type: a };
    const inner = new Map(env);
    inner.set(e.x, mono);
    return fn(a, infer(inner, e.body));
  }
  if (e.e === 'app') {
    const tf = infer(env, e.f);
    const ta = infer(env, e.a);
    const r = fresh();
    unify(tf, fn(ta, r));
    return r;
  }
  if (e.e === 'let') {
    const t1 = infer(env, e.def);
    const inner = new Map(env);
    inner.set(e.x, generalize(env, t1));
    return infer(inner, e.body);
  }
  // what is left is an if
  unify(infer(env, e.c), BOOL);
  const t = infer(env, e.t);
  infer(env, e.f);
  return t;
}`,
        why: 'The branches of an if are never compared, so `if true then 1 else false` is accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In algorithm W for a language with variables, literals, λ, application, `let` and `if`, which kinds of term add equations through unification?',
    options: [
      {
        t: 'Applications and ifs',
        correct: true,
        why: 'An application unifies the function’s type with argument → result; an if unifies its condition with bool and its branches.',
      },
      {
        t: 'Variables and λs',
        why: 'Variables only instantiate, and λs only make fresh variables.',
      },
      {
        t: 'Every kind of term',
        why: 'Literals, variables, λs and lets add no equations of their own.',
      },
    ],
  },
  {
    q: 'What is the principal type of `λx. λy. y`?',
    options: [
      {
        t: '`a → a → a`',
        why: 'That is an instance (put a for b), but x and y never meet, so nothing forces them to be the same type.',
      },
      {
        t: '`number → bool → bool`',
        why: 'Also an instance, but not the most general type.',
      },
      {
        t: '`a → b → b`',
        correct: true,
        why: 'x is never used, so its variable stays separate; the function returns y, so the result is y’s type.',
      },
    ],
  },
  {
    q: 'Why does W reject `λx. x x`?',
    options: [
      {
        t: 'Because x is not let-bound, so it cannot be applied',
        why: 'Parameters can be applied (twice applies f); the problem is applying x to itself.',
      },
      {
        t: 'The occurs check: x’s type a would have to equal a → b',
        correct: true,
        why: 'a would have to contain itself, and the occurs check refuses that equation.',
      },
      {
        t: 'It does not: its type is a → a',
        why: 'x x needs x to be a function that takes itself, which no finite type is.',
      },
    ],
  },
  {
    q: 'In `let id = λx. x in id id`, why is the program accepted?',
    options: [
      {
        t: 'Because id is generalised, and each use gets its own fresh copy',
        correct: true,
        why: 'The first copy is used at (c → c) → c → c and the second at c → c; they never share a variable.',
      },
      {
        t: 'Because W skips type checking inside a let',
        why: 'W checks the definition and the body fully.',
      },
      {
        t: 'Because id id has no type, so nothing can go wrong',
        why: 'It has the type a → a.',
      },
    ],
  },
  {
    q: 'What did Damas and Milner prove about W?',
    options: [
      {
        t: 'That it is the fastest possible inference algorithm',
        why: 'The theorem is about the answers, not the speed.',
      },
      {
        t: 'That it accepts every program that runs without crashing',
        why: 'It rejects λf. if f true then f 1 else 2, which never crashes when f is the identity.',
      },
      {
        t: 'That if a term has any type, W succeeds with a type of which every type of the term is an instance',
        correct: true,
        why: 'That is principality: W finds the most general type whenever one exists.',
      },
    ],
  },
];
