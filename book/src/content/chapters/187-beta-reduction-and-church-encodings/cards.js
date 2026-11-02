// Chapter 89 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'beta-rule': {
    q: 'State the beta rule.',
    a: '`(λx. t) s → [x ↦ s] t`: a function applied to an argument steps to its body with the argument substituted for the parameter.',
  },
  'redex-what': {
    q: 'What is a redex?',
    a: 'A reducible expression: a λ applied to an argument, `(λx. t) s`.',
  },
  'normal-form': {
    q: 'When is a term in normal form?',
    a: 'When it contains no redex, so no beta step applies anywhere in it.',
  },
  omega: {
    q: 'What does `(λx. x x) (λx. x x)` reduce to?',
    a: 'To itself, in one step; so it has no normal form, and reducing it never ends.',
  },
  'church-rosser': {
    q: 'Can one term reach two different normal forms by choosing redexes differently?',
    a: 'No (the Church–Rosser theorem): the normal form, if there is one, is unique up to renaming bound variables.',
  },
  'normal-order': {
    q: 'Which redex does normal order reduce first, and what is its guarantee?',
    a: 'The leftmost, outermost one; if the term has a normal form, normal order reaches it.',
  },
  'cbv-js': {
    q: 'Why does `((x) => 1)(loop())` never return in JavaScript, when `loop` calls itself for ever?',
    a: 'JavaScript is call by value: it evaluates the argument before the call, so `loop()` runs first, and never finishes (here, until the stack overflows).',
  },
  'church-true': {
    q: 'What are the Church booleans `true` and `false`?',
    a: '`true = λt. λf. t` (keep the first of two) and `false = λt. λf. f` (keep the second).',
  },
  'church-num': {
    q: 'What does the Church numeral 3 do?',
    a: 'Given a function f and a start x, it applies f to x three times: `λf. λx. f (f (f x))`.',
  },
};

export const examples = {
  church: {
    title: 'Booleans, numbers and recursion from functions',
    code: `const tru = (t) => (f) => t;
const fls = (t) => (f) => f;
const iff = (b) => (x) => (y) =>
  b(x)(y);
const zero = (f) => (x) => x;
const succ = (n) => (f) => (x) =>
  f(n(f)(x));
const plus = (m) => (n) => (f) =>
  (x) => m(f)(n(f)(x));
// read a numeral: add one, n times
const toNum = (n) => n((k) => k + 1)(0);

const two = succ(succ(zero));
const three = succ(two);
console.log(toNum(two));
console.log(toNum(plus(two)(three)));
console.log(iff(tru)('yes')('no'));
console.log(iff(fls)('yes')('no'));

// Y for call by value: x x is
// wrapped as v => x(x)(v)
const Z = (g) =>
  ((x) => g((v) => x(x)(v)))(
    (x) => g((v) => x(x)(v)));
const fact = Z((self) => (n) =>
  n === 0 ? 1 : n * self(n - 1));
console.log(fact(5));`,
  },
};

export const exercises = {
  normalize: {
    title: 'A normal-order reducer',
    prompt: 'Terms are data as in the last chapter, and `subst` (capture-avoiding) is given. Write `step(t)`, which performs **one** beta step in normal order (the leftmost, outermost redex first, also inside λ bodies) and returns the new term, or returns `null` if `t` is in normal form. Then write `normalize(t, max)`, which keeps stepping and returns the normal form, or returns `null` if it has not reached one after `max` steps.',
    starter: `const V = (name) =>
  ({ t: 'var', name });
const L = (param, body) =>
  ({ t: 'lam', param, body });
const A = (fn, arg) =>
  ({ t: 'app', fn, arg });
function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'lam') {
    const b = show(t.body);
    return \`(λ\${t.param}. \${b})\`;
  }
  const f = show(t.fn);
  return \`(\${f} \${show(t.arg)})\`;
}
function freeVars(t) {
  if (t.t === 'var') {
    return new Set([t.name]);
  }
  if (t.t === 'app') {
    return new Set([
      ...freeVars(t.fn),
      ...freeVars(t.arg),
    ]);
  }
  const fv = freeVars(t.body);
  fv.delete(t.param);
  return fv;
}
// [x ↦ s] t, renaming to avoid capture
function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  if (t.param === x) return t;
  const fvS = freeVars(s);
  if (!fvS.has(t.param)) {
    return L(t.param,
      subst(t.body, x, s));
  }
  const avoid = new Set([...fvS,
    ...freeVars(t.body), x]);
  let z = t.param + "'";
  while (avoid.has(z)) z += "'";
  const body =
    subst(t.body, t.param, V(z));
  return L(z, subst(body, x, s));
}

function step(t) {
  return null;
}

function normalize(t, max) {
  return t;
}`,
    solution: `const V = (name) =>
  ({ t: 'var', name });
const L = (param, body) =>
  ({ t: 'lam', param, body });
const A = (fn, arg) =>
  ({ t: 'app', fn, arg });
function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'lam') {
    const b = show(t.body);
    return \`(λ\${t.param}. \${b})\`;
  }
  const f = show(t.fn);
  return \`(\${f} \${show(t.arg)})\`;
}
function freeVars(t) {
  if (t.t === 'var') {
    return new Set([t.name]);
  }
  if (t.t === 'app') {
    return new Set([
      ...freeVars(t.fn),
      ...freeVars(t.arg),
    ]);
  }
  const fv = freeVars(t.body);
  fv.delete(t.param);
  return fv;
}
// [x ↦ s] t, renaming to avoid capture
function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  if (t.param === x) return t;
  const fvS = freeVars(s);
  if (!fvS.has(t.param)) {
    return L(t.param,
      subst(t.body, x, s));
  }
  const avoid = new Set([...fvS,
    ...freeVars(t.body), x]);
  let z = t.param + "'";
  while (avoid.has(z)) z += "'";
  const body =
    subst(t.body, t.param, V(z));
  return L(z, subst(body, x, s));
}

function step(t) {
  if (t.t === 'var') return null;
  if (t.t === 'lam') {
    const b = step(t.body);
    return b && L(t.param, b);
  }
  // an application: a redex itself?
  if (t.fn.t === 'lam') {
    const { param, body } = t.fn;
    return subst(body, param, t.arg);
  }
  const f = step(t.fn);
  if (f) return A(f, t.arg);
  const a = step(t.arg);
  return a && A(t.fn, a);
}

function normalize(t, max) {
  for (let i = 0; i < max; i++) {
    const next = step(t);
    if (next === null) return t;
    t = next;
  }
  return null;
}`,
    tests: `const I = L('x', V('x'));
const w = L('x', A(V('x'), V('x')));
const omega = A(w, w);
const one = L('f', L('x', A(V('f'), V('x'))));
const succ = L('n', L('f', L('x',
  A(V('f'), A(A(V('n'), V('f')), V('x'))))));
test('one step of the identity', () => {
  expect(show(step(A(I, V('a'))))).toBe('a');
});
test('a normal form gives null', () => {
  expect(step(V('a'))).toBe(null);
  expect(step(L('x', A(V('x'), V('y'))))).toBe(null);
});
test('outermost first', () => {
  const t = A(I, A(L('y', V('y')), V('z')));
  expect(show(step(t))).toBe('((λy. y) z)');
});
test('two arguments, left to right', () => {
  const K = L('x', L('y', V('x')));
  expect(show(normalize(A(A(K, V('a')), V('b')), 10))).toBe('a');
});
test('inside a λ body', () => {
  expect(show(step(L('y', A(I, V('y')))))).toBe('(λy. y)');
});
test('succ 1 is 2', () => {
  expect(show(normalize(A(succ, one), 10))).toBe('(λf. (λx. (f (f x))))');
});
test('an unused omega is never run', () => {
  expect(show(normalize(A(L('x', V('z')), omega), 10))).toBe('z');
});
test('omega gives up after max steps', () => {
  expect(normalize(omega, 50)).toBe(null);
});`,
    hints: [
      'Handle the three kinds of term. A variable has no redex. A λ has a redex only if its body does. An application is either a redex itself (its `fn` is a λ) or has one inside.',
      'For an application whose `fn` is a λ, the step is `subst(fn.body, fn.param, arg)`. Otherwise try to step `fn` first (it is further left); only if `fn` is in normal form, try `arg`. Each time, rebuild the application around the part that changed.',
      'For `normalize`, loop up to `max` times: `const next = step(t)`; if it is `null`, `t` is the answer; otherwise `t = next`. After the loop, return `null`.',
    ],
    walkthrough: `**How to think about it.** Normal order is a rule about *where* to look: the outermost redex, and among those the leftmost. In a tree, “outermost” means “check this node before its children”, and “leftmost” means “check the function part before the argument”. So \`step\` asks, at each node: am I a redex? If so, reduce me. If not, look in my left part, and only if that has nothing, in my right part. Returning \`null\` for “nothing to do here” lets the caller try the next place.

**The solution, line by line.**

- \`if (t.t === 'var') return null;\` A variable is always a normal form.
- \`if (t.t === 'lam') { const b = step(t.body); return b && L(t.param, b); }\` A λ is not a redex itself; normal order reduces inside its body. If the body stepped, rebuild the λ around the new body; if not, \`b\` is \`null\` and \`b && ...\` returns that \`null\`.
- \`if (t.fn.t === 'lam') { const { param, body } = t.fn; return subst(body, param, t.arg); }\` This application is a redex, and being the outermost, it goes first. The argument is passed *unreduced*: that is the difference from call by value.
- \`const f = step(t.fn); if (f) return A(f, t.arg);\` Not a redex here, so look left first, and rebuild if the function part stepped.
- \`const a = step(t.arg); return a && A(t.fn, a);\` Only if the left part is in normal form, look right.
- In \`normalize\`, the \`for\` loop allows at most \`max\` steps; \`step\` returning \`null\` means a normal form, which is returned; if the loop runs out, the term may have no normal form (like Ω) or need more steps, and \`null\` says “gave up”.

For \`(λx. z) Ω\`, the outer application is a redex, so the first step substitutes Ω for \`x\` in \`z\`, where there is no \`x\`: the result is \`z\`, and Ω never ran.

**Common wrong attempts.**

- Reducing the argument before the call (call by value): \`(λx. x) ((λy. y) z)\` steps to \`(λx. x) z\` instead of \`(λy. y) z\`, and \`(λx. z) Ω\` never finishes, because Ω is reduced for ever.
- Not looking inside λ bodies: that is fine for JavaScript, but \`succ 1\` then stops at \`λf. λx. f ((λf. λx. f x) f x)\`, which has redexes left, so it is not a normal form.`,
    wrong: [
      {
        code: `const V = (name) =>
  ({ t: 'var', name });
const L = (param, body) =>
  ({ t: 'lam', param, body });
const A = (fn, arg) =>
  ({ t: 'app', fn, arg });
function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'lam') {
    const b = show(t.body);
    return \`(λ\${t.param}. \${b})\`;
  }
  const f = show(t.fn);
  return \`(\${f} \${show(t.arg)})\`;
}
function freeVars(t) {
  if (t.t === 'var') {
    return new Set([t.name]);
  }
  if (t.t === 'app') {
    return new Set([
      ...freeVars(t.fn),
      ...freeVars(t.arg),
    ]);
  }
  const fv = freeVars(t.body);
  fv.delete(t.param);
  return fv;
}
// [x ↦ s] t, renaming to avoid capture
function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  if (t.param === x) return t;
  const fvS = freeVars(s);
  if (!fvS.has(t.param)) {
    return L(t.param,
      subst(t.body, x, s));
  }
  const avoid = new Set([...fvS,
    ...freeVars(t.body), x]);
  let z = t.param + "'";
  while (avoid.has(z)) z += "'";
  const body =
    subst(t.body, t.param, V(z));
  return L(z, subst(body, x, s));
}

function step(t) {
  if (t.t === 'var') return null;
  if (t.t === 'lam') {
    const b = step(t.body);
    return b && L(t.param, b);
  }
  const a = step(t.arg);
  if (a) return A(t.fn, a);
  if (t.fn.t === 'lam') {
    const { param, body } = t.fn;
    return subst(body, param, t.arg);
  }
  const f = step(t.fn);
  return f && A(f, t.arg);
}

function normalize(t, max) {
  for (let i = 0; i < max; i++) {
    const next = step(t);
    if (next === null) return t;
    t = next;
  }
  return null;
}`,
        why: 'This reduces the argument first, like call by value: `(λx. z) Ω` reduces Ω for ever and never reaches `z`.',
      },
      {
        code: `const V = (name) =>
  ({ t: 'var', name });
const L = (param, body) =>
  ({ t: 'lam', param, body });
const A = (fn, arg) =>
  ({ t: 'app', fn, arg });
function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'lam') {
    const b = show(t.body);
    return \`(λ\${t.param}. \${b})\`;
  }
  const f = show(t.fn);
  return \`(\${f} \${show(t.arg)})\`;
}
function freeVars(t) {
  if (t.t === 'var') {
    return new Set([t.name]);
  }
  if (t.t === 'app') {
    return new Set([
      ...freeVars(t.fn),
      ...freeVars(t.arg),
    ]);
  }
  const fv = freeVars(t.body);
  fv.delete(t.param);
  return fv;
}
// [x ↦ s] t, renaming to avoid capture
function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  if (t.param === x) return t;
  const fvS = freeVars(s);
  if (!fvS.has(t.param)) {
    return L(t.param,
      subst(t.body, x, s));
  }
  const avoid = new Set([...fvS,
    ...freeVars(t.body), x]);
  let z = t.param + "'";
  while (avoid.has(z)) z += "'";
  const body =
    subst(t.body, t.param, V(z));
  return L(z, subst(body, x, s));
}

function step(t) {
  if (t.t !== 'app') return null;
  if (t.fn.t === 'lam') {
    const { param, body } = t.fn;
    return subst(body, param, t.arg);
  }
  const f = step(t.fn);
  if (f) return A(f, t.arg);
  const a = step(t.arg);
  return a && A(t.fn, a);
}

function normalize(t, max) {
  for (let i = 0; i < max; i++) {
    const next = step(t);
    if (next === null) return t;
    t = next;
  }
  return null;
}`,
        why: 'It never looks inside a λ body, so `succ 1` stops with redexes still inside the λs: not a normal form.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the normal form of `(λx. λy. y x) a (λz. z)`?',
    options: [
      {
        t: '`a`',
        correct: true,
        why: 'First `(λy. y a)` (x became a), then `(λz. z) a`, then `a`.',
      },
      {
        t: '`λz. z`',
        why: 'The second argument is a function, but it is applied to `a`, not returned.',
      },
      {
        t: '`(λz. z) a`',
        why: 'That still has a redex: the identity applied to `a`.',
      },
    ],
  },
  {
    q: 'Which term has no normal form?',
    options: [
      {
        t: '`(λx. z) ((λx. x x) (λx. x x))`',
        why: 'Normal order reduces the outer redex first and gets `z`.',
      },
      {
        t: '`(λx. x x) (λx. x x)`',
        correct: true,
        why: 'It reduces to itself for ever, so no reduction order can end.',
      },
      {
        t: '`λx. x x`',
        why: 'It has no redex at all (x x is a variable applied to a variable), so it is already a normal form.',
      },
    ],
  },
  {
    q: 'Using the Church booleans, what is `true a b`?',
    options: [
      {
        t: '`b`',
        why: 'That is what `false` keeps.',
      },
      {
        t: '`true`',
        why: '`true` is applied to two arguments, so it steps.',
      },
      {
        t: '`a`',
        correct: true,
        why: '`true = λt. λf. t` keeps its first argument.',
      },
    ],
  },
  {
    q: 'Which strategy does JavaScript use for function calls?',
    options: [
      {
        t: 'Normal order',
        why: 'JavaScript evaluates arguments before the call and never runs code inside a function body until it is called.',
      },
      {
        t: 'Call by value',
        correct: true,
        why: 'Arguments are evaluated to values first, and function bodies are not evaluated until called.',
      },
      {
        t: 'Call by name',
        why: 'Call by name would pass `loop()` unevaluated; JavaScript runs it first.',
      },
    ],
  },
  {
    q: 'What does `plus 1 2` reduce to, with Church numerals?',
    options: [
      {
        t: '`λf. λx. f (f (f x))`, the numeral 3',
        correct: true,
        why: 'plus applies f once (from 1) on top of twice (from 2).',
      },
      {
        t: '`λf. λx. f (f x)`, the numeral 2',
        why: 'That forgets the 1: plus applies f m times on top of n times.',
      },
      {
        t: 'It has no normal form',
        why: 'Unlike Ω, it finishes: a few beta steps reach the numeral 3, which has no redex left.',
      },
    ],
  },
];
