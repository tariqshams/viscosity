// Chapter 123 cards. Keys are stable ids: never rename them.

export const prompts = {
  'judgment-read': {
    q: 'Read `Γ ⊢ e : T` aloud.',
    a: '“In the context Γ, e has type T”: if the names in scope have the types Γ gives them, e has type T.',
  },
  'gamma-what': {
    q: 'What does the type environment Γ hold?',
    a: 'The variables in scope, each with its type, such as `x : Num, f : Num → Bool`.',
  },
  'shadow-in-gamma': {
    q: 'Γ is `x : Num, x : Bool`. What type does `x` have, and why?',
    a: '`Bool`: the later (rightmost) entry hides the earlier one, as an inner scope shadows an outer one.',
  },
  'rule-read': {
    q: 'How do you read an inference rule aloud?',
    a: '“If all the premises above the line hold, then the conclusion below the line holds.”',
  },
  'axiom-what': {
    q: 'What is an axiom, in a set of typing rules?',
    a: 'A rule with no premises, so its conclusion always holds (for example, any number literal is a `Num`).',
  },
  'abs-extends': {
    q: 'In T-Abs, in which environment is the body of `λx:T₁. e` checked?',
    a: 'In `Γ, x : T₁`: the outer environment extended with the parameter and its declared type.',
  },
  'if-same': {
    q: 'Why does T-If require both branches to have the same type?',
    a: 'The checker cannot know which branch will run, so the `if` can only promise a type that both branches have.',
  },
  'derivation-what': {
    q: 'What is a typing derivation?',
    a: 'A tree of rule uses, with the judgment to show at the root, in which every branch ends in an axiom or a lookup in Γ.',
  },
  'no-derivation': {
    q: 'In the language of typing rules, what is a type error?',
    a: 'A judgment for which no derivation exists: some goal matches no rule’s conclusion.',
  },
};

export const examples = {
  derive: {
    title: 'Print a derivation',
    code: `const num = (n) => ({ k: 'num', n });
const v = (x) => ({ k: 'var', x });
const plus = (l, r) =>
  ({ k: 'plus', l, r });
const lam = (x, ty, body) =>
  ({ k: 'lam', x, ty, body });
const app = (f, a) =>
  ({ k: 'app', f, a });

function show(t) {
  if (typeof t === 'string') return t;
  const a = show(t.from);
  const f = typeof t.from === 'string'
    ? a : '(' + a + ')';
  return f + ' → ' + show(t.to);
}
function src(e) {
  if (e.k === 'num') return String(e.n);
  if (e.k === 'var') return e.x;
  if (e.k === 'plus') {
    return src(e.l) + ' + ' + src(e.r);
  }
  if (e.k === 'lam') {
    return 'λ' + e.x + ':' +
      show(e.ty) + '. ' + src(e.body);
  }
  return '(' + src(e.f) + ') ' +
    src(e.a);
}

const lines = [];
function derive(e, env, d) {
  const at = lines.push('') - 1;
  let rule;
  let t;
  if (e.k === 'num') {
    rule = 'Num';
    t = 'Num';
  } else if (e.k === 'var') {
    rule = 'Var';
    t = env.get(e.x);
  } else if (e.k === 'plus') {
    rule = 'Plus';
    derive(e.l, env, d + 1);
    derive(e.r, env, d + 1);
    t = 'Num';
  } else if (e.k === 'lam') {
    rule = 'Abs';
    const inner = new Map(env);
    inner.set(e.x, e.ty);
    const b = derive(e.body, inner,
      d + 1);
    t = { from: e.ty, to: b };
  } else {
    rule = 'App';
    const f = derive(e.f, env, d + 1);
    derive(e.a, env, d + 1);
    t = f.to;
  }
  const g = [...env].map(([x, ty]) =>
    x + ':' + show(ty)).join(', ');
  const pad = '  '.repeat(d);
  lines[at] = pad + rule + '  ' +
    (g ? g + ' ' : '') + '⊢ ' +
    src(e) + ' : ' + show(t);
  return t;
}

const prog = app(
  lam('x', 'Num', plus(v('x'), num(1))),
  num(2));
derive(prog, new Map(), 0);
for (const l of lines) console.log(l);`,
  },
};

const helpers = `// Types: 'Num', 'Bool' or { from, to }
function show(t) {
  if (typeof t === 'string') return t;
  const a = show(t.from);
  const f = typeof t.from === 'string'
    ? a : '(' + a + ')';
  return f + ' → ' + show(t.to);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
`;

export const exercises = {
  stlc: {
    title: 'A checker for the simply typed lambda calculus',
    prompt:
      'Finish `typeOf(e, env)` by adding the three rules this chapter read aloud. Terms are objects: `{ k: \'num\' }`, `{ k: \'bool\' }`, `{ k: \'var\', x }`, `{ k: \'plus\', l, r }` (done for you), and the ones to write: `{ k: \'lam\', x, ty, body }` (T-Abs), `{ k: \'app\', f, a }` (T-App) and `{ k: \'if\', c, a, b }` (T-If). Types are `\'Num\'`, `\'Bool\'` or `{ from, to }`; `env` is a `Map` from names to types. Use the helpers `show`, `same` and `fail`, and these exact messages: `cannot call a Num` (calling something that is not a function), `the argument must be Num, not Bool`, `the condition must be Bool, not Num`, and `the branches differ: Num and Bool`.',
    starter: helpers + `
function typeOf(e, env) {
  switch (e.k) {
    case 'num': return 'Num';
    case 'bool': return 'Bool';
    case 'var': {
      if (!env.has(e.x)) {
        fail('unknown variable ' + e.x);
      }
      return env.get(e.x);
    }
    case 'plus': {
      for (const s of [e.l, e.r]) {
        const t = typeOf(s, env);
        if (t !== 'Num') {
          fail('+ needs Num, not ' +
            show(t));
        }
      }
      return 'Num';
    }
    case 'lam': {
      // T-Abs: e.x, e.ty, e.body
      return undefined;
    }
    case 'app': {
      // T-App: e.f, e.a
      return undefined;
    }
    case 'if': {
      // T-If: e.c, e.a, e.b
      return undefined;
    }
  }
}`,
    solution: helpers + `
function typeOf(e, env) {
  switch (e.k) {
    case 'num': return 'Num';
    case 'bool': return 'Bool';
    case 'var': {
      if (!env.has(e.x)) {
        fail('unknown variable ' + e.x);
      }
      return env.get(e.x);
    }
    case 'plus': {
      for (const s of [e.l, e.r]) {
        const t = typeOf(s, env);
        if (t !== 'Num') {
          fail('+ needs Num, not ' +
            show(t));
        }
      }
      return 'Num';
    }
    case 'lam': {
      const inner = new Map(env);
      inner.set(e.x, e.ty);
      const b = typeOf(e.body, inner);
      return { from: e.ty, to: b };
    }
    case 'app': {
      const f = typeOf(e.f, env);
      const a = typeOf(e.a, env);
      if (typeof f === 'string') {
        fail('cannot call a ' + f);
      }
      if (!same(f.from, a)) {
        fail('the argument must be ' +
          show(f.from) + ', not ' +
          show(a));
      }
      return f.to;
    }
    case 'if': {
      const c = typeOf(e.c, env);
      if (c !== 'Bool') {
        fail('the condition must be ' +
          'Bool, not ' + show(c));
      }
      const a = typeOf(e.a, env);
      const b = typeOf(e.b, env);
      if (!same(a, b)) {
        fail('the branches differ: ' +
          show(a) + ' and ' + show(b));
      }
      return a;
    }
  }
}`,
    tests: `const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const v = (x) => ({ k: 'var', x });
const plus = (l, r) => ({ k: 'plus', l, r });
const lam = (x, ty, body) =>
  ({ k: 'lam', x, ty, body });
const app = (f, a) => ({ k: 'app', f, a });
const iff = (c, a, b) => ({ k: 'if', c, a, b });
const N = 'Num';
const B = 'Bool';
const fn = (from, to) => ({ from, to });
const ty = (e) => show(typeOf(e, new Map()));
const msg = (e) => {
  try { typeOf(e, new Map()); } catch (x) { return x.message; }
  return 'no error';
};
const inc = lam('x', N, plus(v('x'), num(1)));
test('the given cases still work', () => {
  expect(ty(plus(num(1), num(2)))).toBe('Num');
  expect(msg(plus(num(1), bool(true))))
    .toBe('+ needs Num, not Bool');
});
test('T-Abs: λx:Num. x + 1 is Num → Num', () => {
  expect(ty(inc)).toBe('Num → Num');
});
test('T-Abs extends Γ, and the inner x shadows', () => {
  const t = lam('x', N, lam('x', B, v('x')));
  expect(ty(t)).toBe('Num → Bool → Bool');
});
test('T-App: (λx:Num. x + 1) 2 is Num', () => {
  expect(ty(app(inc, num(2)))).toBe('Num');
});
test('T-App: a function argument', () => {
  const twice = lam('f', fn(N, N),
    lam('x', N, app(v('f'), app(v('f'), v('x')))));
  expect(ty(twice)).toBe('(Num → Num) → Num → Num');
  expect(ty(app(app(twice, inc), num(3)))).toBe('Num');
});
test('T-App: wrong argument type', () => {
  expect(msg(app(inc, bool(true))))
    .toBe('the argument must be Num, not Bool');
});
test('T-App: calling a number', () => {
  expect(msg(app(num(1), num(2))))
    .toBe('cannot call a Num');
});
test('T-If: same branch types', () => {
  expect(ty(iff(bool(true), num(1), num(2)))).toBe('Num');
});
test('T-If: the condition must be Bool', () => {
  expect(msg(iff(num(0), num(1), num(2))))
    .toBe('the condition must be Bool, not Num');
});
test('T-If: branches must agree', () => {
  expect(msg(iff(bool(true), num(1), bool(false))))
    .toBe('the branches differ: Num and Bool');
});
test('a free variable has no type', () => {
  expect(msg(v('y'))).toBe('unknown variable y');
});`,
    hints: [
      'Each case is one rule, read from the bottom up: to find the conclusion’s type, compute the premises’ types first. Start with T-Abs, which has one premise.',
      'For T-Abs, make the extended environment with `new Map(env)` and `.set(e.x, e.ty)`, check the body in it, and return `{ from: e.ty, to: bodyType }`. For T-App, compute both types; if the function’s type is a string it is not a function; otherwise compare `f.from` with the argument’s type using `same`.',
      'For T-If: the condition’s type must be exactly `\'Bool\'`; then compute both branch types, fail if `!same(a, b)`, and return `a`. Copying the Map (rather than calling `env.set`) matters: the parameter must not leak into the environment outside the λ.',
    ],
    walkthrough: `**How to think about it.** Put the rule next to the code it becomes. Every rule has the same shape, premises above and a conclusion below, and a checker reads it *upwards*: given an expression whose shape matches the conclusion, it works out the premises (by calling itself on the parts) and, if they hold, returns the type the conclusion names. So each \`case\` is: recurse on the parts, check what the premises demand, return the conclusion's type. The \`plus\` case you were given is T-Plus exactly: check both parts are \`Num\`, return \`Num\`.

**The solution, line by line.**

- \`case 'lam': {\` is T-Abs, whose conclusion is \`Γ ⊢ λx:T₁. e : T₁ → T₂\`.
- \`const inner = new Map(env); inner.set(e.x, e.ty);\` builds \`Γ, x : T₁\`: a copy of the environment with the parameter added. Because a \`Map\` keeps one entry per key, \`set\` replaces an outer \`x\`, which is shadowing, exactly as the rightmost entry wins in Γ.
- \`const b = typeOf(e.body, inner);\` is the premise \`Γ, x : T₁ ⊢ e : T₂\`: it gives us T₂.
- \`return { from: e.ty, to: b };\` is the conclusion's type, \`T₁ → T₂\`.
- \`case 'app': {\` is T-App. \`const f = typeOf(e.f, env); const a = typeOf(e.a, env);\` computes the types in both premises.
- \`if (typeof f === 'string') { fail('cannot call a ' + f); }\`: the first premise needs f to have a function type; \`'Num'\` and \`'Bool'\` are strings, so no rule applies.
- \`if (!same(f.from, a)) { fail(...) }\` checks that the argument's type is the very T₁ in the function's type; \`same\` compares types by their printed form, which works for nested function types too.
- \`return f.to;\` is the conclusion: the call has the function's result type, T₂.
- \`case 'if': {\` is T-If. The condition's type \`c\` must be \`'Bool'\`, or we fail with \`the condition must be Bool, not Num\`.
- \`const a = typeOf(e.a, env); const b = typeOf(e.b, env);\` computes both branch types, and \`if (!same(a, b))\` fails with \`the branches differ: Num and Bool\` when they disagree.
- \`return a;\` is the shared type T.

**Common wrong attempts.**

- Checking the body in \`env\` itself, without adding the parameter: every λ body that uses its parameter fails with \`unknown variable x\`.
- Calling \`env.set(e.x, e.ty)\` on the original Map: it works for one λ, but the parameter then stays in the environment after the λ, so a later \`x\` outside it would wrongly have a type.
- Returning \`f.to\` without comparing \`f.from\` with the argument's type: \`(λx:Num. x + 1) true\` would be accepted, and the \`+\` inside would meet a boolean at run time, which is the very stuck state the type system exists to prevent.
- Returning the type of the first branch without comparing it to the second: then the type of an \`if\` would depend on which branch the checker happened to look at, not on what the program can do.`,
    wrong: [
      {
        code: helpers + `
function typeOf(e, env) {
  switch (e.k) {
    case 'num': return 'Num';
    case 'bool': return 'Bool';
    case 'var': {
      if (!env.has(e.x)) {
        fail('unknown variable ' + e.x);
      }
      return env.get(e.x);
    }
    case 'plus': {
      for (const s of [e.l, e.r]) {
        const t = typeOf(s, env);
        if (t !== 'Num') {
          fail('+ needs Num, not ' +
            show(t));
        }
      }
      return 'Num';
    }
    case 'lam': {
      const b = typeOf(e.body, env);
      return { from: e.ty, to: b };
    }
    case 'app': {
      const f = typeOf(e.f, env);
      const a = typeOf(e.a, env);
      if (typeof f === 'string') {
        fail('cannot call a ' + f);
      }
      if (!same(f.from, a)) {
        fail('the argument must be ' +
          show(f.from) + ', not ' +
          show(a));
      }
      return f.to;
    }
    case 'if': {
      const c = typeOf(e.c, env);
      if (c !== 'Bool') {
        fail('the condition must be ' +
          'Bool, not ' + show(c));
      }
      const a = typeOf(e.a, env);
      const b = typeOf(e.b, env);
      if (!same(a, b)) {
        fail('the branches differ: ' +
          show(a) + ' and ' + show(b));
      }
      return a;
    }
  }
}`,
        why: 'The body is checked without the parameter in the environment, so `λx:Num. x + 1` fails with `unknown variable x`.',
      },
      {
        code: helpers + `
function typeOf(e, env) {
  switch (e.k) {
    case 'num': return 'Num';
    case 'bool': return 'Bool';
    case 'var': {
      if (!env.has(e.x)) {
        fail('unknown variable ' + e.x);
      }
      return env.get(e.x);
    }
    case 'plus': {
      for (const s of [e.l, e.r]) {
        const t = typeOf(s, env);
        if (t !== 'Num') {
          fail('+ needs Num, not ' +
            show(t));
        }
      }
      return 'Num';
    }
    case 'lam': {
      const inner = new Map(env);
      inner.set(e.x, e.ty);
      const b = typeOf(e.body, inner);
      return { from: e.ty, to: b };
    }
    case 'app': {
      const f = typeOf(e.f, env);
      const a = typeOf(e.a, env);
      if (typeof f === 'string') {
        fail('cannot call a ' + f);
      }
      return f.to;
    }
    case 'if': {
      const c = typeOf(e.c, env);
      if (c !== 'Bool') {
        fail('the condition must be ' +
          'Bool, not ' + show(c));
      }
      const a = typeOf(e.a, env);
      const b = typeOf(e.b, env);
      if (!same(a, b)) {
        fail('the branches differ: ' +
          show(a) + ' and ' + show(b));
      }
      return a;
    }
  }
}`,
        why: 'T-App never compares the argument’s type with the parameter’s, so `(λx:Num. x + 1) true` is accepted.',
      },
      {
        code: helpers + `
function typeOf(e, env) {
  switch (e.k) {
    case 'num': return 'Num';
    case 'bool': return 'Bool';
    case 'var': {
      if (!env.has(e.x)) {
        fail('unknown variable ' + e.x);
      }
      return env.get(e.x);
    }
    case 'plus': {
      for (const s of [e.l, e.r]) {
        const t = typeOf(s, env);
        if (t !== 'Num') {
          fail('+ needs Num, not ' +
            show(t));
        }
      }
      return 'Num';
    }
    case 'lam': {
      const inner = new Map(env);
      inner.set(e.x, e.ty);
      const b = typeOf(e.body, inner);
      return { from: e.ty, to: b };
    }
    case 'app': {
      const f = typeOf(e.f, env);
      const a = typeOf(e.a, env);
      if (typeof f === 'string') {
        fail('cannot call a ' + f);
      }
      if (!same(f.from, a)) {
        fail('the argument must be ' +
          show(f.from) + ', not ' +
          show(a));
      }
      return f.to;
    }
    case 'if': {
      const c = typeOf(e.c, env);
      if (c !== 'Bool') {
        fail('the condition must be ' +
          'Bool, not ' + show(c));
      }
      const a = typeOf(e.a, env);
      const b = typeOf(e.b, env);
      return a;
    }
  }
}`,
        why: 'T-If never compares the branches, so `if true then 1 else false` is given type `Num`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which judgment is true?',
    options: [
      { t: '`x : Bool ⊢ x + 1 : Num`', why: 'T-Plus needs `x : Num`, but Γ says `x` is a `Bool`, so no derivation exists.' },
      { t: '`⊢ x : Num`', why: 'The environment is empty, so T-Var has nothing to look `x` up in.' },
      { t: '`x : Num ⊢ x + 1 : Num`', correct: true, why: 'T-Var gives `x : Num`, T-Num gives `1 : Num`, and T-Plus gives the sum `Num`.' },
    ],
  },
  {
    q: 'What does the rule T-Abs need above its line to conclude `Γ ⊢ λx:Num. x : Num → Num`?',
    options: [
      { t: '`Γ, x : Num ⊢ x : Num`', correct: true, why: 'The body is checked in Γ extended with the parameter and its declared type.' },
      { t: '`Γ ⊢ x : Num`', why: 'The body is not checked in Γ alone: the parameter must be added first.' },
      { t: 'Nothing: it is an axiom', why: 'T-Abs has one premise, about the body.' },
    ],
  },
  {
    q: 'What type does `λf:Num → Num. f 3` have?',
    options: [
      { t: '`Num`', why: 'That is the type of the body, `f 3`; the λ itself is a function.' },
      { t: '`Num → Num`', why: 'That is the type of the parameter `f`.' },
      { t: '`(Num → Num) → Num`', correct: true, why: 'T-Abs: the parameter has type `Num → Num` and the body `f 3` has type `Num` by T-App, so the function is `(Num → Num) → Num`.' },
      { t: 'It has no type', why: 'Every premise can be shown: `f` is in Γ, `3` is a `Num`, and `f` takes a `Num`.' },
    ],
  },
  {
    q: 'Why is there no derivation of `⊢ if true then 1 else false : Num`?',
    options: [
      { t: 'The condition is not a `Bool`', why: '`true` is a `Bool`, so that premise holds.' },
      { t: 'T-If needs both branches to have the same type T, and `1` and `false` do not', correct: true, why: 'With different branch types there is no single T to put in the conclusion.' },
      { t: 'There is a derivation: an `if` takes the type of the branch that runs', why: 'The checker does not run the program, so it cannot know which branch will run.' },
    ],
  },
  {
    q: 'A checker meets `⊢ 1 2 : ?` (calling the number 1 with 2). What happens?',
    options: [
      { t: 'T-App gives `Num`', why: 'T-App needs the function to have a type `T₁ → T₂`, and `1` has type `Num`.' },
      { t: 'It returns `?`', why: 'A checker either finds a derivation or reports that none exists.' },
      { t: 'No rule’s conclusion matches, so there is no derivation: a type error', correct: true, why: 'Only T-App concludes about an application, and its first premise cannot hold.' },
    ],
  },
];
