// Chapter 195 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fresh-why': {
    q: 'Why does each unannotated parameter get a *fresh* type variable?',
    a: 'So that unrelated parameters are not forced to have the same type by accident.',
  },
  'call-unify': {
    q: 'In unification-based type inference, when inferring a call `f(a)`, what is unified with the type of `f`?',
    a: '`fn(type of a) -> \'r`, where `\'r` is a fresh variable that becomes the type of the call.',
  },
  'twice-type': {
    q: 'What type is inferred for `fn (f, x) { return f(f(x)); }`?',
    a: '`fn(fn(\'a) -> \'a, \'a) -> \'a`: `f` must return what it takes, and `x` is that type.',
  },
  'no-check-crash': {
    q: 'In a unifier that applies its substitution recursively, what happens without the occurs check when inferring `fn (x) { return x(x); }`?',
    a: '`\'a` is bound to `fn(\'a) -> \'b`, and applying the substitution recurses forever (a stack overflow).',
  },
  'occurs-what': {
    q: 'What does the occurs check test before binding `α ↦ T`?',
    a: 'That α does not appear anywhere inside T, after applying the bindings so far.',
  },
  'occurs-why': {
    q: 'Why does `\'a = [\'a]` have no solution?',
    a: 'Any finite type put in for `\'a` would have to be a list of itself, one bracket deeper than itself.',
  },
  'occurs-through': {
    q: 'With `\'b ↦ [\'a]` already in the substitution, why must binding `\'a ↦ \'b` be refused?',
    a: 'Looking through the binding, `\'b` is `[\'a]`, so it would mean `\'a = [\'a]`.',
  },
  'occurs-named': {
    q: 'TypeScript accepts `type Tree = { kids: Tree[] }`. Why is that not what the occurs check forbids?',
    a: 'The name `Tree` stops the unfolding; the check only refuses nameless types that would contain themselves.',
  },
};

export const examples = {
  infer: {
    title: 'Inferring five functions (no occurs check yet)',
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
  if (a.tv) return bindVar(a, b, s);
  if (b.tv) return bindVar(b, a, s);
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
}
function bindVar(v, t, s) {
  return { ...s, [v.tv]: t };
}
// Inference: fresh variables, unify.
let S = {};
let count = 0;
function fresh() {
  return { tv: 't' + count++ };
}
function infer(e, env) {
  switch (e.kind) {
    case 'literal':
      return typeof e.value;
    case 'variable':
      return env.get(e.name);
    case 'binary': {
      for (const x of [e.left,
        e.right]) {
        S = unify(infer(x, env),
          'number', S);
      }
      return e.op === '<'
        ? 'bool' : 'number';
    }
    case 'fn': {
      const inner = new Map(env);
      const ps = e.params.map((p) => {
        const t = fresh();
        inner.set(p, t);
        return t;
      });
      const r = infer(e.body, inner);
      return { params: ps, ret: r };
    }
    case 'call': {
      const f = infer(e.callee, env);
      const args = e.args.map(
        (a) => infer(a, env));
      const r = fresh();
      S = unify(f,
        { params: args, ret: r }, S);
      return r;
    }
  }
}
// Rename variables 'a, 'b, ... in the
// order they first appear.
function tidy(t, names) {
  if (typeof t === 'string') return t;
  if (t.tv) {
    if (!names.has(t.tv)) {
      const c = 97 + names.size;
      names.set(t.tv,
        String.fromCharCode(c));
    }
    return { tv: names.get(t.tv) };
  }
  if (t.list) {
    return {
      list: tidy(t.list, names),
    };
  }
  return {
    params: t.params.map(
      (p) => tidy(p, names)),
    ret: tidy(t.ret, names),
  };
}
function typeOfFn(e) {
  S = {};
  count = 0;
  const t = infer(e, new Map());
  return show(tidy(apply(t, S),
    new Map()));
}
// fn (x) { return ...; } as a tree:
const fn = (params, body) =>
  ({ kind: 'fn', params, body });
const v = (name) =>
  ({ kind: 'variable', name });
const call = (callee, ...args) =>
  ({ kind: 'call', callee, args });
const num = (value) =>
  ({ kind: 'literal', value });
const bin = (op, left, right) =>
  ({ kind: 'binary', op, left, right });

const tries = [
  // fn (x) { return x * 2; }
  fn(['x'], bin('*', v('x'), num(2))),
  // fn (x) { return x; }
  fn(['x'], v('x')),
  // fn (f) { return f(1) < 2; }
  fn(['f'], bin('<',
    call(v('f'), num(1)), num(2))),
  // fn (f, x) { return f(f(x)); }
  fn(['f', 'x'], call(v('f'),
    call(v('f'), v('x')))),
  // fn (x) { return x(x); }
  fn(['x'], call(v('x'), v('x'))),
];
for (const e of tries) {
  try {
    console.log(typeOfFn(e));
  } catch (err) {
    console.log(err.name + ': ' +
      err.message);
  }
}`,
  },
};

export const exercises = {
  occurs: {
    title: 'Add the occurs check',
    prompt: 'Here is the whole inference engine: `unify` from the last chapter, now calling `bindVar(v, t, s)` whenever it binds a variable, and `typeOfFn` from the runnable example. Write `occurs(name, t, s)`, which says whether the type variable called `name` appears anywhere in `t` (looking through the bindings in `s`), and change `bindVar` so it throws an `Error` with the message `cannot unify \'a with [\'a]: \'a would contain itself` (the variable with `show`, the type with `show(apply(t, s))`) instead of making such a binding.',
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
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) return bindVar(a, b, s);
  if (b.tv) return bindVar(b, a, s);
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
}
// Inference: fresh variables, unify.
let S = {};
let count = 0;
function fresh() {
  return { tv: 't' + count++ };
}
function infer(e, env) {
  switch (e.kind) {
    case 'literal':
      return typeof e.value;
    case 'variable':
      return env.get(e.name);
    case 'binary': {
      for (const x of [e.left,
        e.right]) {
        S = unify(infer(x, env),
          'number', S);
      }
      return e.op === '<'
        ? 'bool' : 'number';
    }
    case 'fn': {
      const inner = new Map(env);
      const ps = e.params.map((p) => {
        const t = fresh();
        inner.set(p, t);
        return t;
      });
      const r = infer(e.body, inner);
      return { params: ps, ret: r };
    }
    case 'call': {
      const f = infer(e.callee, env);
      const args = e.args.map(
        (a) => infer(a, env));
      const r = fresh();
      S = unify(f,
        { params: args, ret: r }, S);
      return r;
    }
  }
}
// Rename variables 'a, 'b, ... in the
// order they first appear.
function tidy(t, names) {
  if (typeof t === 'string') return t;
  if (t.tv) {
    if (!names.has(t.tv)) {
      const c = 97 + names.size;
      names.set(t.tv,
        String.fromCharCode(c));
    }
    return { tv: names.get(t.tv) };
  }
  if (t.list) {
    return {
      list: tidy(t.list, names),
    };
  }
  return {
    params: t.params.map(
      (p) => tidy(p, names)),
    ret: tidy(t.ret, names),
  };
}
function typeOfFn(e) {
  S = {};
  count = 0;
  const t = infer(e, new Map());
  return show(tidy(apply(t, S),
    new Map()));
}

function occurs(name, t, s) {
  // does variable name appear in t?
  return false;
}
function bindVar(v, t, s) {
  return { ...s, [v.tv]: t };
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
  if (a.tv) return bindVar(a, b, s);
  if (b.tv) return bindVar(b, a, s);
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
}
// Inference: fresh variables, unify.
let S = {};
let count = 0;
function fresh() {
  return { tv: 't' + count++ };
}
function infer(e, env) {
  switch (e.kind) {
    case 'literal':
      return typeof e.value;
    case 'variable':
      return env.get(e.name);
    case 'binary': {
      for (const x of [e.left,
        e.right]) {
        S = unify(infer(x, env),
          'number', S);
      }
      return e.op === '<'
        ? 'bool' : 'number';
    }
    case 'fn': {
      const inner = new Map(env);
      const ps = e.params.map((p) => {
        const t = fresh();
        inner.set(p, t);
        return t;
      });
      const r = infer(e.body, inner);
      return { params: ps, ret: r };
    }
    case 'call': {
      const f = infer(e.callee, env);
      const args = e.args.map(
        (a) => infer(a, env));
      const r = fresh();
      S = unify(f,
        { params: args, ret: r }, S);
      return r;
    }
  }
}
// Rename variables 'a, 'b, ... in the
// order they first appear.
function tidy(t, names) {
  if (typeof t === 'string') return t;
  if (t.tv) {
    if (!names.has(t.tv)) {
      const c = 97 + names.size;
      names.set(t.tv,
        String.fromCharCode(c));
    }
    return { tv: names.get(t.tv) };
  }
  if (t.list) {
    return {
      list: tidy(t.list, names),
    };
  }
  return {
    params: t.params.map(
      (p) => tidy(p, names)),
    ret: tidy(t.ret, names),
  };
}
function typeOfFn(e) {
  S = {};
  count = 0;
  const t = infer(e, new Map());
  return show(tidy(apply(t, S),
    new Map()));
}

function occurs(name, t, s) {
  t = resolve(t, s);
  if (typeof t === 'string') {
    return false;
  }
  if (t.tv) return t.tv === name;
  if (t.list) {
    return occurs(name, t.list, s);
  }
  return t.params.some(
    (p) => occurs(name, p, s)) ||
    occurs(name, t.ret, s);
}
function bindVar(v, t, s) {
  if (occurs(v.tv, t, s)) {
    const n = show(v);
    throw new Error('cannot unify ' +
      n + ' with ' + show(apply(t, s)) +
      ': ' + n + ' would contain ' +
      'itself');
  }
  return { ...s, [v.tv]: t };
}`,
    tests: `const V = (tv) => ({ tv });
const Lst = (list) => ({ list });
const Fn = (params, ret) => ({ params, ret });
const err = (f) => {
  try { f(); } catch (x) { return x.message; }
  return 'no error';
};
const fn = (params, body) => ({ kind: 'fn', params, body });
const v = (name) => ({ kind: 'variable', name });
const call = (callee, ...args) => ({ kind: 'call', callee, args });
const num = (value) => ({ kind: 'literal', value });
const bin = (op, left, right) => ({ kind: 'binary', op, left, right });
test('occurs: a variable occurs in itself', () => {
  expect(occurs('a', V('a'), {})).toBe(true);
  expect(occurs('a', V('b'), {})).toBe(false);
  expect(occurs('a', 'number', {})).toBe(false);
});
test('occurs: inside lists and functions', () => {
  expect(occurs('a', Lst(Lst(V('a'))), {})).toBe(true);
  expect(occurs('a', Fn(['number'], V('a')), {})).toBe(true);
  expect(occurs('a', Fn([V('b')], V('c')), {})).toBe(false);
});
test('occurs: looks through bindings', () => {
  expect(occurs('a', V('b'), { b: Lst(V('a')) })).toBe(true);
});
test("'a with ['a] is refused", () => {
  expect(err(() => unify(V('a'), Lst(V('a')), {})))
    .toBe("cannot unify 'a with ['a]: 'a would contain itself");
});
test("'a with fn('a) -> 'b is refused, on either side", () => {
  expect(err(() => unify(Fn([V('a')], V('b')), V('a'), {})))
    .toBe("cannot unify 'a with fn('a) -> 'b: 'a would contain itself");
});
test('an occurrence hidden behind a binding', () => {
  expect(err(() => unify(V('a'), V('b'), { b: Lst(V('a')) })))
    .toBe("cannot unify 'a with ['a]: 'a would contain itself");
});
test('ordinary bindings still work', () => {
  const s = unify(V('a'), Lst(V('b')), {});
  expect(show(apply(V('a'), s))).toBe("['b]");
  expect(Object.keys(unify(V('a'), V('a'), {})).length).toBe(0);
});
test('inference still works', () => {
  expect(typeOfFn(fn(['x'], bin('*', v('x'), num(2)))))
    .toBe('fn(number) -> number');
  expect(typeOfFn(fn(['f', 'x'],
    call(v('f'), call(v('f'), v('x'))))))
    .toBe("fn(fn('a) -> 'a, 'a) -> 'a");
});
test('fn (x) { return x(x); } is refused', () => {
  expect(err(() => typeOfFn(fn(['x'], call(v('x'), v('x'))))))
    .toBe("cannot unify 't0 with fn('t0) -> 't1: 't0 would contain itself");
});`,
    hints: [
      '`occurs` is a walk over a type, with one case per shape, like `show` or `apply`. Start by looking through bindings with `resolve(t, s)`, so a bound variable is replaced by what it stands for.',
      'After resolving: a base type (a string) contains no variables; a variable occurs only if it is the very one we are looking for (`t.tv === name`); a list contains it if its element type does.',
      'A function type contains it if any parameter does (`t.params.some(...)`) or its result does. In `bindVar`, call `occurs(v.tv, t, s)` before returning `{ ...s, [v.tv]: t }`, and throw if it is true.',
    ],
    walkthrough: `**How to think about it.** The question is "does this variable appear inside this type?", which is a search through a tree, so it has the same shape as every other function over types here: a case for base types, variables, lists and function types. The one subtle part is the substitution: a variable inside \`t\` may already be bound, and what it is bound to may contain our variable (the \`'b ↦ ['a]\` case), so every variable must be looked through with \`resolve\` before it is compared. Try it by hand: does \`'a\` occur in \`fn(number) -> ['a]\`? Not in the parameter, \`number\`; in the result, a list, whose element is \`'a\` itself: yes.

**The solution, line by line.**

- \`function occurs(name, t, s) {\` takes the variable's name (such as \`'a'\`), a type and the substitution.
- \`t = resolve(t, s);\` replaces a bound variable by its binding, following chains, so the cases below see what the variable really stands for.
- \`if (typeof t === 'string') { return false; }\`: a base type such as \`'number'\` contains no variables.
- \`if (t.tv) return t.tv === name;\`: an unbound variable contains exactly itself.
- \`if (t.list) { return occurs(name, t.list, s); }\`: a list contains the variable if its element type does.
- \`return t.params.some((p) => occurs(name, p, s)) || occurs(name, t.ret, s);\`: a function type contains it if any parameter type or the result type does.
- In \`bindVar\`, \`if (occurs(v.tv, t, s)) { ... throw new Error(...) }\` refuses the binding, with a message that names the variable and the type it would have to equal; \`show(apply(t, s))\` is safe to call here, because the bad binding has not been made.
- \`return { ...s, [v.tv]: t };\` is the old binding, reached only when the check passes.

Why does \`unify('a, 'a)\` not trip the check? Because \`unify\` returns early when both sides are the same variable, so \`bindVar\` is never asked to bind a variable to itself. (The message in the last test names \`'t0\` and \`'t1\`: those are the engine's own fresh variables, before the tidying rename.)

**Common wrong attempts.**

- Not calling \`resolve\` inside \`occurs\`: the check misses an occurrence hidden behind a binding, and \`'a\` with \`'b\` (where \`'b ↦ ['a]\`) builds the infinite type anyway.
- Checking only whether \`t\` is the variable itself, without looking inside lists and functions: \`'a\` with \`['a]\` is the commonest case, and it slips through.
- Putting the check in \`unify\` only for the left-hand variable: \`unify(fn('a) -> 'b, 'a)\` binds from the right side and is missed; checking inside \`bindVar\` covers both.`,
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
  a = resolve(a, s);
  b = resolve(b, s);
  if (a.tv && a.tv === b.tv) return s;
  if (a.tv) return bindVar(a, b, s);
  if (b.tv) return bindVar(b, a, s);
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
}
// Inference: fresh variables, unify.
let S = {};
let count = 0;
function fresh() {
  return { tv: 't' + count++ };
}
function infer(e, env) {
  switch (e.kind) {
    case 'literal':
      return typeof e.value;
    case 'variable':
      return env.get(e.name);
    case 'binary': {
      for (const x of [e.left,
        e.right]) {
        S = unify(infer(x, env),
          'number', S);
      }
      return e.op === '<'
        ? 'bool' : 'number';
    }
    case 'fn': {
      const inner = new Map(env);
      const ps = e.params.map((p) => {
        const t = fresh();
        inner.set(p, t);
        return t;
      });
      const r = infer(e.body, inner);
      return { params: ps, ret: r };
    }
    case 'call': {
      const f = infer(e.callee, env);
      const args = e.args.map(
        (a) => infer(a, env));
      const r = fresh();
      S = unify(f,
        { params: args, ret: r }, S);
      return r;
    }
  }
}
// Rename variables 'a, 'b, ... in the
// order they first appear.
function tidy(t, names) {
  if (typeof t === 'string') return t;
  if (t.tv) {
    if (!names.has(t.tv)) {
      const c = 97 + names.size;
      names.set(t.tv,
        String.fromCharCode(c));
    }
    return { tv: names.get(t.tv) };
  }
  if (t.list) {
    return {
      list: tidy(t.list, names),
    };
  }
  return {
    params: t.params.map(
      (p) => tidy(p, names)),
    ret: tidy(t.ret, names),
  };
}
function typeOfFn(e) {
  S = {};
  count = 0;
  const t = infer(e, new Map());
  return show(tidy(apply(t, S),
    new Map()));
}

function occurs(name, t, s) {
  if (typeof t === 'string') {
    return false;
  }
  if (t.tv) return t.tv === name;
  if (t.list) {
    return occurs(name, t.list, s);
  }
  return t.params.some(
    (p) => occurs(name, p, s)) ||
    occurs(name, t.ret, s);
}
function bindVar(v, t, s) {
  if (occurs(v.tv, t, s)) {
    const n = show(v);
    throw new Error('cannot unify ' +
      n + ' with ' + show(apply(t, s)) +
      ': ' + n + ' would contain ' +
      'itself');
  }
  return { ...s, [v.tv]: t };
}`,
        why: 'Without `resolve`, an occurrence behind a binding is missed, so `\'a` with `\'b` (where `\'b ↦ [\'a]`) is accepted.',
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
  if (a.tv) return bindVar(a, b, s);
  if (b.tv) return bindVar(b, a, s);
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
}
// Inference: fresh variables, unify.
let S = {};
let count = 0;
function fresh() {
  return { tv: 't' + count++ };
}
function infer(e, env) {
  switch (e.kind) {
    case 'literal':
      return typeof e.value;
    case 'variable':
      return env.get(e.name);
    case 'binary': {
      for (const x of [e.left,
        e.right]) {
        S = unify(infer(x, env),
          'number', S);
      }
      return e.op === '<'
        ? 'bool' : 'number';
    }
    case 'fn': {
      const inner = new Map(env);
      const ps = e.params.map((p) => {
        const t = fresh();
        inner.set(p, t);
        return t;
      });
      const r = infer(e.body, inner);
      return { params: ps, ret: r };
    }
    case 'call': {
      const f = infer(e.callee, env);
      const args = e.args.map(
        (a) => infer(a, env));
      const r = fresh();
      S = unify(f,
        { params: args, ret: r }, S);
      return r;
    }
  }
}
// Rename variables 'a, 'b, ... in the
// order they first appear.
function tidy(t, names) {
  if (typeof t === 'string') return t;
  if (t.tv) {
    if (!names.has(t.tv)) {
      const c = 97 + names.size;
      names.set(t.tv,
        String.fromCharCode(c));
    }
    return { tv: names.get(t.tv) };
  }
  if (t.list) {
    return {
      list: tidy(t.list, names),
    };
  }
  return {
    params: t.params.map(
      (p) => tidy(p, names)),
    ret: tidy(t.ret, names),
  };
}
function typeOfFn(e) {
  S = {};
  count = 0;
  const t = infer(e, new Map());
  return show(tidy(apply(t, S),
    new Map()));
}

function occurs(name, t, s) {
  t = resolve(t, s);
  if (typeof t === 'string') {
    return false;
  }
  if (t.tv) return t.tv === name;
  return false;
}
function bindVar(v, t, s) {
  if (occurs(v.tv, t, s)) {
    const n = show(v);
    throw new Error('cannot unify ' +
      n + ' with ' + show(apply(t, s)) +
      ': ' + n + ' would contain ' +
      'itself');
  }
  return { ...s, [v.tv]: t };
}`,
        why: 'It never looks inside lists or function types, so `\'a` with `[\'a]` is accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'If `*` takes only numbers, what type does unification-based inference give `fn (x) { return x * 2; }`?',
    options: [
      {
        t: '`fn(\'a) -> \'a`',
        why: 'The `*` forces `\'a = number`.',
      },
      {
        t: '`fn(number) -> number`',
        correct: true,
        why: '`x` starts as `\'a`, `*` unifies it with `number`, and `*` gives a number.',
      },
      {
        t: 'None: `x` has no annotation',
        why: 'Inference works out what the annotation would have said.',
      },
    ],
  },
  {
    q: 'Inferring `f(1)` with `f : \'a`, which equation is solved?',
    options: [
      {
        t: '`\'a = number`',
        why: '`1` is the argument, not `f` itself.',
      },
      {
        t: '`\'a = fn(number) -> \'r`, with `\'r` fresh',
        correct: true,
        why: 'A call needs `f` to be a function from the argument’s type to some result type.',
      },
      {
        t: '`\'r = number`',
        why: 'Nothing says what `f` returns.',
      },
    ],
  },
  {
    q: 'Which unification does the occurs check refuse?',
    options: [
      {
        t: '`\'a` with `\'a`',
        why: 'That needs no binding at all; `unify` returns at once.',
      },
      {
        t: '`\'a` with `[\'b]`',
        why: '`\'a` does not occur in `[\'b]`, so `\'a ↦ [\'b]` is fine.',
      },
      {
        t: '`\'b` with `fn(number) -> \'b`',
        correct: true,
        why: '`\'b` occurs in the function type, so the binding would make an infinite type.',
      },
      {
        t: '`[\'a]` with `[number]`',
        why: 'This binds `\'a ↦ number`; no variable meets a type containing itself.',
      },
    ],
  },
  {
    q: 'In a unifier that applies its substitution recursively, what does inferring `fn (x) { return x(x); }` do without the occurs check?',
    options: [
      {
        t: 'It infers `fn(\'a) -> \'b`',
        why: 'The binding `\'a ↦ fn(\'a) -> \'b` makes applying the substitution go on forever.',
      },
      {
        t: 'It reports a type error',
        why: 'Only the occurs check would report it; without it there is no error, only a binding that never stops unfolding.',
      },
      {
        t: 'It recurses until the stack runs out',
        correct: true,
        why: 'Applying the self-containing binding replaces `\'a` by a type containing `\'a`, forever.',
      },
    ],
  },
  {
    q: 'Why must the occurs check look through the substitution?',
    options: [
      {
        t: 'A variable inside the type may be bound to something that contains the variable being bound',
        correct: true,
        why: 'With `\'b ↦ [\'a]`, binding `\'a ↦ \'b` is really `\'a = [\'a]`.',
      },
      {
        t: 'To make it faster',
        why: 'Looking through bindings makes it slower, but it is needed for correctness.',
      },
      {
        t: 'It need not: looking at the type as written is enough',
        why: 'Then a self-reference hidden behind a binding would be missed.',
      },
    ],
  },
];
