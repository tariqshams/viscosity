// Chapter 200 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bidi-what': {
    q: 'What are the two judgements of bidirectional type checking?',
    a: 'Synthesis, Γ ⊢ e ⇒ T (find a type), and checking, Γ ⊢ e ⇐ T (confirm a given type).',
  },
  'synth-read': {
    q: 'How is `Γ ⊢ e ⇒ T` read?',
    a: '“In environment Γ, e synthesises type T”: the checker found T with no help.',
  },
  'check-read': {
    q: 'How is `Γ ⊢ e ⇐ T` read?',
    a: '“In environment Γ, e checks against type T”: T was given, and e was confirmed to have it.',
  },
  'lam-check': {
    q: 'In a basic bidirectional type system, why does an unannotated λ have a checking rule but no synthesis rule?',
    a: 'Only an expected arrow type tells it what its parameter’s type is; on its own it has nothing to go on.',
  },
  'app-modes': {
    q: 'In the usual bidirectional rule for an application `f a` (App⇒), which part is synthesised and which is checked?',
    a: 'f is synthesised (it must give an arrow A → B); a is checked against A; the application synthesises B.',
  },
  'sub-bridge': {
    q: 'In bidirectional typing, what does the mode-switching subsumption rule (Sub⇐) do?',
    a: 'Checks a term with no checking rule of its own: synthesise its type, then compare it with the expected one (equal, or a subtype).',
  },
  'anno-switch': {
    q: 'What does an annotation `(e : T)` do to the modes?',
    a: 'It switches from synthesis to checking: e is checked against T, and the annotated term then synthesises T.',
  },
  contextual: {
    q: 'Why does TypeScript accept `[1, 2].map((x) => x.toFixed(1))` without a type on x?',
    a: 'Contextual typing: map’s parameter type tells the arrow what x is, so the arrow is checked, not synthesised.',
  },
};

export const examples = {};

export const exercises = {
  bidi: {
    title: 'A bidirectional type checker',
    prompt: 'Types are `NUM`, `BOOL` and `fn(from, to)`; `same(a, b)` compares two types. Terms are `n(1)`, `b(true)`, `v(x)`, `lam(x, body)` (no type on x), `app(f, a)`, `anno(t, type)`, `add(l, r)` and `ifE(c, t, f)`. Environments are `Map`s from names to types. Write `synth(env, e)`, which returns e’s type, and `check(env, e, type)`, which returns nothing, both calling `fail(message)` on a type error. Synthesise numbers, booleans, variables, annotations (check the term, return the annotation), applications (the function must synthesise an arrow; check the argument against its parameter), `add` (both sides check against NUM) and `if` (check the condition against BOOL, synthesise the then branch, check the else branch against it). A λ cannot be synthesised. Check a λ against an arrow, an `if` by checking both branches against the expected type, and anything else by synthesising and comparing with `same`.',
    starter: `const NUM = { k: 'num' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const same = (a, b) => a.k === b.k &&
  (a.k !== 'fn' || (same(a.from, b.from)
    && same(a.to, b.to)));
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const anno = (t, type) =>
  ({ e: 'anno', t, type });
const add = (l, r) =>
  ({ e: 'add', l, r });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });
const fail = (msg) => {
  throw new Error(msg);
};

function synth(env, e) {
  if (e.e === 'num') return NUM;
  fail('cannot synthesise ' + e.e);
}

function check(env, e, type) {
  if (!same(synth(env, e), type)) {
    fail('type mismatch');
  }
}`,
    solution: `const NUM = { k: 'num' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const same = (a, b) => a.k === b.k &&
  (a.k !== 'fn' || (same(a.from, b.from)
    && same(a.to, b.to)));
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const anno = (t, type) =>
  ({ e: 'anno', t, type });
const add = (l, r) =>
  ({ e: 'add', l, r });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });
const fail = (msg) => {
  throw new Error(msg);
};

function synth(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'anno') {
    check(env, e.t, e.type);
    return e.type;
  }
  if (e.e === 'app') {
    const tf = synth(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    check(env, e.a, tf.from);
    return tf.to;
  }
  if (e.e === 'add') {
    check(env, e.l, NUM);
    check(env, e.r, NUM);
    return NUM;
  }
  if (e.e === 'if') {
    check(env, e.c, BOOL);
    const t = synth(env, e.t);
    check(env, e.f, t);
    return t;
  }
  fail('cannot synthesise a type ' +
    'for a function: annotate it');
}

function check(env, e, type) {
  if (e.e === 'lam') {
    if (type.k !== 'fn') {
      fail('a function is not that');
    }
    const inner = new Map(env);
    inner.set(e.x, type.from);
    check(inner, e.body, type.to);
    return;
  }
  if (e.e === 'if') {
    check(env, e.c, BOOL);
    check(env, e.t, type);
    return check(env, e.f, type);
  }
  if (!same(synth(env, e), type)) {
    fail('type mismatch');
  }
}`,
    tests: `const NN = fn(NUM, NUM);
const inc = lam('x', add(v('x'), n(1)));
const ok = (e) => synth(new Map(), e);
test('literals and annotated functions synthesise', () => {
  expect(ok(n(1))).toEqual(NUM);
  expect(ok(anno(inc, NN))).toEqual(NN);
});
test('an annotated function applied', () => {
  expect(ok(app(anno(inc, NN), n(2)))).toEqual(NUM);
  const not = lam('x', ifE(v('x'), b(false), b(true)));
  expect(ok(app(anno(not, fn(BOOL, BOOL)), b(true)))).toEqual(BOOL);
});
test('a bare λ cannot synthesise', () => {
  expect(() => ok(inc)).toThrow();
  expect(() => ok(app(inc, n(2)))).toThrow();
});
test('the argument is checked against the parameter', () => {
  const callOne = lam('f', app(v('f'), n(1)));
  const outer = anno(callOne, fn(NN, NUM));
  expect(ok(app(outer, inc))).toEqual(NUM);
  expect(() => ok(app(anno(inc, NN), b(true)))).toThrow();
});
test('checking a λ against an arrow', () => {
  check(new Map(), inc, NN);
  check(new Map(), lam('x', v('x')), fn(BOOL, BOOL));
  expect(() => check(new Map(), inc, fn(BOOL, NUM))).toThrow();
  expect(() => check(new Map(), inc, NUM)).toThrow();
});
test('an if checks both branches', () => {
  const twoFns = ifE(b(true), inc, lam('y', v('y')));
  check(new Map(), twoFns, NN);
  expect(ok(ifE(b(true), n(1), n(2)))).toEqual(NUM);
  expect(() => ok(ifE(b(true), n(1), b(false)))).toThrow();
  expect(() => ok(ifE(n(0), n(1), n(2)))).toThrow();
});
test('type errors are reported', () => {
  expect(() => ok(add(n(1), b(true)))).toThrow();
  expect(() => ok(app(n(1), n(2)))).toThrow();
  expect(() => ok(v('nope'))).toThrow();
  expect(() => check(new Map(), n(1), BOOL)).toThrow();
});`,
    hints: [
      'Go through the chapter’s rules one at a time, and for each term ask: does its type come from somewhere (the environment, an annotation, a function), or must it be given? The first kind goes in `synth`, the second in `check`.',
      'In `synth`: a variable is `env.get(e.x)`; an annotation calls `check(env, e.t, e.type)` and returns `e.type`; an application synthesises the function, fails unless it is an arrow (`tf.k === \'fn\'`), checks the argument against `tf.from`, and returns `tf.to`. A λ reaching `synth` must fail.',
      'In `check`: a λ against `type` fails unless `type.k === \'fn\'`, then checks the body against `type.to` in a copy of the environment with `e.x` set to `type.from`. An `if` checks the condition against BOOL and both branches against `type`. Everything else: `if (!same(synth(env, e), type)) fail(...)`.',
    ],
    walkthrough: `**How to think about it.** The two functions call each other, and each rule of the chapter decides which one a kind of term lives in. Ask where the type information comes from. A number’s type is obvious; a variable’s is in the environment; an annotation’s is written on it; an application’s comes from the function. All of those can *synthesise*. A λ’s parameter type comes from nowhere unless someone hands the λ an expected arrow, so a λ can only be *checked*. When \`check\` meets a term with no special checking rule, it falls back on \`synth\` and compares (Sub⇐), and when \`synth\` needs to know a part has some type, it calls \`check\`.

**The solution, line by line.**

- \`if (e.e === 'num') return NUM;\` and the same for booleans: literals synthesise.
- \`const t = env.get(e.x); return t ?? fail('unbound ' + e.x);\` Var⇒: the environment gives the type, or the name is not in scope.
- \`check(env, e.t, e.type); return e.type;\` Anno⇒: switch into checking mode against what is written, then synthesise it.
- \`const tf = synth(env, e.f);\` App⇒: the function part must synthesise, and \`if (tf.k !== 'fn') fail(...)\` must give an arrow.
- \`check(env, e.a, tf.from); return tf.to;\` The argument is *checked* against the parameter type, which is what lets an unannotated λ be passed as an argument; the application synthesises the result type.
- \`check(env, e.l, NUM); check(env, e.r, NUM); return NUM;\` \`+\` wants two numbers and gives one.
- \`check(env, e.c, BOOL); const t = synth(env, e.t); check(env, e.f, t); return t;\` A synthesised if: the then branch decides the type and the else branch is checked against it.
- \`fail('cannot synthesise a type for a function: annotate it');\` Only a λ is left, and a λ has no synthesis rule: the message tells the reader what to do.
- In \`check\`, \`if (e.e === 'lam') { if (type.k !== 'fn') fail(...);\` Lam⇐ needs an expected arrow.
- \`const inner = new Map(env); inner.set(e.x, type.from); check(inner, e.body, type.to); return;\` The parameter takes the arrow’s parameter type, with no guessing, and the body is checked against the result type.
- \`check(env, e.c, BOOL); check(env, e.t, type); return check(env, e.f, type);\` A checked if pushes the expected type into both branches, so each can be an unannotated λ.
- \`if (!same(synth(env, e), type)) fail('type mismatch');\` Sub⇐: for everything else, synthesise and compare.

**Common wrong attempts.**

- Synthesising the argument of an application and comparing it with the parameter: then \`(λf. f 1 : ...) (λx. x + 1)\` fails, because the argument is a bare λ. Checking it is the whole point.
- Giving a λ a synthesis rule with a made-up parameter type (always NUM, say): \`(λx. x : bool → bool) true\` may still work by luck, but the checker silently accepts or rejects for the wrong reason.
- In checking mode, handling \`if\` with the Sub⇐ fallback: it then synthesises both branches, and an if whose branches are λs fails, though the expected type was right there.`,
    wrong: [
      {
        code: `const NUM = { k: 'num' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const same = (a, b) => a.k === b.k &&
  (a.k !== 'fn' || (same(a.from, b.from)
    && same(a.to, b.to)));
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const anno = (t, type) =>
  ({ e: 'anno', t, type });
const add = (l, r) =>
  ({ e: 'add', l, r });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });
const fail = (msg) => {
  throw new Error(msg);
};

function synth(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'anno') {
    check(env, e.t, e.type);
    return e.type;
  }
  if (e.e === 'app') {
    const tf = synth(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    const ta = synth(env, e.a);
    if (!same(ta, tf.from)) {
      fail('bad argument');
    }
    return tf.to;
  }
  if (e.e === 'add') {
    check(env, e.l, NUM);
    check(env, e.r, NUM);
    return NUM;
  }
  if (e.e === 'if') {
    check(env, e.c, BOOL);
    const t = synth(env, e.t);
    check(env, e.f, t);
    return t;
  }
  fail('cannot synthesise a λ');
}

function check(env, e, type) {
  if (e.e === 'lam') {
    if (type.k !== 'fn') fail('no');
    const inner = new Map(env);
    inner.set(e.x, type.from);
    check(inner, e.body, type.to);
    return;
  }
  if (e.e === 'if') {
    check(env, e.c, BOOL);
    check(env, e.t, type);
    return check(env, e.f, type);
  }
  if (!same(synth(env, e), type)) {
    fail('type mismatch');
  }
}`,
        why: 'The argument of an application is synthesised instead of checked, so an unannotated λ can no longer be passed to an annotated function.',
      },
      {
        code: `const NUM = { k: 'num' };
const BOOL = { k: 'bool' };
const fn = (from, to) =>
  ({ k: 'fn', from, to });
const same = (a, b) => a.k === b.k &&
  (a.k !== 'fn' || (same(a.from, b.from)
    && same(a.to, b.to)));
// terms
const n = (val) => ({ e: 'num', val });
const b = (val) => ({ e: 'bool', val });
const v = (x) => ({ e: 'var', x });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });
const anno = (t, type) =>
  ({ e: 'anno', t, type });
const add = (l, r) =>
  ({ e: 'add', l, r });
const ifE = (c, t, f) =>
  ({ e: 'if', c, t, f });
const fail = (msg) => {
  throw new Error(msg);
};

function synth(env, e) {
  if (e.e === 'num') return NUM;
  if (e.e === 'bool') return BOOL;
  if (e.e === 'var') {
    const t = env.get(e.x);
    return t ?? fail('unbound ' + e.x);
  }
  if (e.e === 'anno') {
    check(env, e.t, e.type);
    return e.type;
  }
  if (e.e === 'app') {
    const tf = synth(env, e.f);
    if (tf.k !== 'fn') {
      fail('not a function');
    }
    check(env, e.a, tf.from);
    return tf.to;
  }
  if (e.e === 'add') {
    check(env, e.l, NUM);
    check(env, e.r, NUM);
    return NUM;
  }
  if (e.e === 'if') {
    check(env, e.c, BOOL);
    const t = synth(env, e.t);
    check(env, e.f, t);
    return t;
  }
  fail('cannot synthesise a λ');
}

function check(env, e, type) {
  if (e.e === 'lam') {
    if (type.k !== 'fn') fail('no');
    const inner = new Map(env);
    inner.set(e.x, type.from);
    check(inner, e.body, type.to);
    return;
  }
  if (!same(synth(env, e), type)) {
    fail('type mismatch');
  }
}`,
        why: 'There is no checking rule for `if`, so an if whose branches are bare λs is synthesised, and fails, even when its expected type is known.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a basic bidirectional type system, which kind of term has a checking rule but no synthesis rule?',
    options: [
      {
        t: 'A variable',
        why: 'A variable synthesises the type the environment gives it.',
      },
      {
        t: 'An unannotated λ',
        correct: true,
        why: 'Only an expected arrow can tell it its parameter’s type.',
      },
      {
        t: 'An application',
        why: 'An application synthesises the result type of its function.',
      },
    ],
  },
  {
    q: 'In `(λf. f 1 : (number → number) → number) (λx. x + 1)`, why does the argument need no annotation?',
    options: [
      {
        t: 'Because App⇒ checks the argument against the parameter type number → number',
        correct: true,
        why: 'The function’s synthesised type passes the expected type down to the argument.',
      },
      {
        t: 'Because x + 1 tells the checker that x is a number',
        why: 'A bidirectional checker does not guess from uses; the type comes from the context.',
      },
      {
        t: 'It does need one; the program is rejected',
        why: 'It is accepted: the λ is checked, and checking needs no annotation.',
      },
    ],
  },
  {
    q: 'What does the bidirectional subsumption rule (Sub⇐) let a checker do?',
    options: [
      {
        t: 'Synthesise the type of a λ',
        why: 'λs are only checked; Sub⇐ applies to terms that can synthesise.',
      },
      {
        t: 'Turn a check into an inference with unification variables',
        why: 'Bidirectional checking needs no unification variables.',
      },
      {
        t: 'Check a term with no checking rule of its own, by synthesising its type and comparing',
        correct: true,
        why: 'It is the bridge from ⇒ back to ⇐; with subtyping, the comparison is <:.',
      },
    ],
  },
  {
    q: 'Why does TypeScript (in strict mode) reject `const f = (x) => x + 1;` but accept `const g: (x: number) => number = (x) => x + 1;`?',
    options: [
      {
        t: 'Because g is declared with const',
        why: 'Both are const; the difference is the annotation.',
      },
      {
        t: 'Because the declared type gives the arrow a context, so x is known to be a number',
        correct: true,
        why: 'Contextual typing: the arrow is checked against the declared type. With no context, x is an implicit any, which noImplicitAny rejects.',
      },
      {
        t: 'Because TypeScript runs Hindley–Milner inference on the second',
        why: 'TypeScript does not use Hindley–Milner; it propagates types locally.',
      },
    ],
  },
  {
    q: 'Pierce and Turner called this way of working local type inference. What is local about it?',
    options: [
      {
        t: 'Types travel only between neighbouring parts of the program, with no unification variables across it',
        correct: true,
        why: 'That is the contrast with algorithm W, whose unification variables can be settled anywhere in the program.',
      },
      {
        t: 'It only checks local variables, not globals',
        why: '“Local” refers to how information travels, not to which variables are checked.',
      },
      {
        t: 'It runs on your machine rather than on a server',
        why: 'Every type checker runs locally; the word is about the algorithm.',
      },
    ],
  },
];
