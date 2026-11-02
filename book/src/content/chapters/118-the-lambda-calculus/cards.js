// Chapter 118 cards (the lambda calculus: terms, free and bound
// variables, substitution). Keys are stable ids.

export const prompts = {
  'lc-three-forms': {
    q: 'What are the three kinds of term in the lambda calculus?',
    a: 'A variable (`x`), a function or abstraction (`λx. t`), and an application (`t s`).',
  },
  'app-left': {
    q: 'How is `f a b` grouped?',
    a: 'As `(f a) b`: application groups to the left, so `f` is applied to `a`, and the result to `b`.',
  },
  'body-right': {
    q: 'Does `λx. x y` mean `λx. (x y)` or `(λx. x) y`?',
    a: '`λx. (x y)`: the body of a λ extends as far to the right as it can.',
  },
  'js-arrow': {
    q: 'Write `λx. λy. x` as a JavaScript arrow function.',
    a: '`x => y => x`: a function of x that returns a function of y, which returns x.',
  },
  'bound-free': {
    q: 'Which λ binds an occurrence of `x`?',
    a: 'The nearest enclosing `λx`. If there is none, that occurrence is free.',
  },
  'fv-of': {
    q: 'What is `FV((λx. x) x)`?',
    a: '`{x}`: the first x is bound by the λ, but the last x is outside the brackets, so it is free.',
  },
  'alpha-same': {
    q: 'Why are `λx. x` and `λy. y` the same function?',
    a: 'A bound name is only a placeholder; renaming it consistently (alpha-conversion) does not change what the function does.',
  },
  'capture-what': {
    q: 'What is variable capture, in substitution?',
    a: 'A free variable of the term being inserted ends up under a λ that binds the same name, so it suddenly means that λ’s parameter.',
  },
  'subst-bound-stop': {
    q: 'What is `[x ↦ s] (λx. t)`, and why?',
    a: '`λx. t`, unchanged: every x inside is bound by this λ, so none of them is a free x to replace.',
  },
};

export const examples = {
  'no-capture': {
    title: 'JavaScript does not capture either',
    code: `// (λx. λy. x) y should give
// [x ↦ y](λy. x): a function that
// ignores its argument and returns
// the OUTSIDE y.
const y = 'the outside y';
const f = ((x) => (y) => x)(y);
console.log(f('the argument'));

// The captured answer, λy. y, is a
// different function:
const g = (y) => y;
console.log(g('the argument'));`,
  },
};

const GIVEN = `// terms as data
const V = (name) =>
  ({ t: 'var', name });
const L = (param, body) =>
  ({ t: 'lam', param, body });
const A = (fn, arg) =>
  ({ t: 'app', fn, arg });
// fully bracketed, to check results
function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'lam') {
    const b = show(t.body);
    return \`(λ\${t.param}. \${b})\`;
  }
  const f = show(t.fn);
  return \`(\${f} \${show(t.arg)})\`;
}`;

export const exercises = {
  subst: {
    title: 'Free variables and capture-avoiding substitution',
    prompt:
      'Terms are data: `V(name)`, `L(param, body)` and `A(fn, arg)`, and `show` prints them with every bracket. Write `freeVars(t)`, which returns a `Set` of the names free in `t`, and `subst(t, x, s)`, which returns `[x ↦ s] t` following the chapter’s rules. When a λ’s parameter `y` is free in `s`, rename it first: try `y` with a prime added (`y\'`), then two primes, and so on, and use the first name that is not free in `s`, not free in the λ’s body, and not `x`. Do not change the input terms; build new ones.',
    starter: `${GIVEN}

function freeVars(t) {
  return new Set();
}

function subst(t, x, s) {
  return t;
}`,
    solution: `${GIVEN}

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
}`,
    tests: `const fv = (t) => [...freeVars(t)].sort().join(' ');
test('free variables of simple terms', () => {
  expect(fv(V('x'))).toBe('x');
  expect(fv(L('x', V('x')))).toBe('');
  expect(fv(L('x', A(V('x'), V('y'))))).toBe('y');
});
test('the same name bound and free', () => {
  expect(fv(A(L('x', V('x')), V('x')))).toBe('x');
});
test('substituting into variables and applications', () => {
  expect(show(subst(A(V('x'), V('x')), 'x', V('z')))).toBe('(z z)');
  expect(show(subst(V('w'), 'x', V('z')))).toBe('w');
});
test('a bound x is left alone', () => {
  expect(show(subst(L('x', V('x')), 'x', V('y')))).toBe('(λx. x)');
});
test('going under a λ when it is safe', () => {
  expect(show(subst(L('y', V('x')), 'x', V('z')))).toBe('(λy. z)');
});
test('no capture: rename the bound y', () => {
  expect(show(subst(L('y', V('x')), 'x', V('y')))).toBe("(λy'. y)");
  expect(show(subst(L('y', A(V('x'), V('y'))), 'x', V('y')))).toBe("(λy'. (y y'))");
});
test('the fresh name avoids names already used', () => {
  const t = L('y', A(V('x'), V("y'")));
  expect(show(subst(t, 'x', V('y')))).toBe("(λy''. (y y'))");
});
test('the input term is not changed', () => {
  const t = L('y', A(V('x'), V('y')));
  subst(t, 'x', V('y'));
  expect(show(t)).toBe('(λy. (x y))');
});`,
    hints: [
      'Both functions look at `t.t` and handle three cases, calling themselves on the parts: that is the Formal box, one line per case.',
      '`freeVars`: a variable gives a set with its name; an application gives the union of its two parts’ sets (spread both into `new Set([...a, ...b])`); a λ gives its body’s set with the parameter deleted. `subst`: a variable becomes `s` if its name is `x`; an application substitutes in both parts; a λ whose parameter is `x` is returned as it is.',
      'For a λ with another parameter `y`: if `y` is not in `freeVars(s)`, return `L(y, subst(body, x, s))`. Otherwise pick `z` by adding primes until it is in none of `freeVars(s)`, `freeVars(body)` and `x`; rename with `subst(body, y, V(z))`; then substitute `x` in that renamed body and wrap it in `L(z, ...)`.',
    ],
    walkthrough: `**How to think about it.** Terms are trees, so both functions are recursive over the three kinds of node, and each case is one line of the chapter’s definitions. The only hard case is substitution into a λ whose parameter is some other name \`y\`. Ask: could going inside capture anything? Only if \`y\` is free in \`s\` (the thing being inserted). If not, go in. If so, rename the λ first, which is allowed because a bound name is only a placeholder, and renaming is itself a substitution, of a fresh variable for the old name.

**The solution, line by line.**

- \`if (t.t === 'var') { return new Set([t.name]); }\` is \`FV(x) = {x}\`.
- \`if (t.t === 'app') { return new Set([...freeVars(t.fn), ...freeVars(t.arg)]); }\` is the union: spread both sets into one array, and \`new Set\` drops the duplicates.
- \`const fv = freeVars(t.body); fv.delete(t.param); return fv;\` is \`FV(λx. t) = FV(t) minus {x}\`. Deleting from \`fv\` is safe because \`freeVars\` always builds a new set.
- \`if (t.t === 'var') { return t.name === x ? s : t; }\` is the two variable rules: the variable being replaced becomes \`s\`; any other stays.
- \`if (t.t === 'app') { return A(subst(t.fn, x, s), subst(t.arg, x, s)); }\` substitutes in both parts and builds a new application.
- \`if (t.param === x) return t;\` is \`[x ↦ s](λx. t) = λx. t\`: every \`x\` inside belongs to this λ.
- \`const fvS = freeVars(s);\` and \`if (!fvS.has(t.param)) { return L(t.param, subst(t.body, x, s)); }\` is the safe case: the parameter cannot capture anything from \`s\`, so go inside.
- \`const avoid = new Set([...fvS, ...freeVars(t.body), x]);\` lists the names the fresh one must not be: free in \`s\` (or it would capture again), free in the body (or renaming would capture *those*), or \`x\` itself.
- \`let z = t.param + "'"; while (avoid.has(z)) z += "'";\` adds primes until the name is new.
- \`const body = subst(t.body, t.param, V(z));\` renames the parameter’s occurrences in the body (the alpha step); \`return L(z, subst(body, x, s));\` then does the real substitution, now safe, under the renamed λ.

For \`[x ↦ y](λy. x y)\`: \`y\` is free in \`V('y')\`, so the λ is renamed to \`y'\`, giving \`λy'. x y'\`, and then \`x\` becomes \`y\`: \`(λy'. (y y'))\`, the stepper’s answer with \`y'\` in place of \`z\`.

**Common wrong attempts.**

- Leaving out the rename: \`[x ↦ y](λy. x)\` comes out as \`λy. y\`, the identity, which is the capture the chapter warns about.
- Forgetting the \`t.param === x\` case: \`[x ↦ y](λx. x)\` becomes \`λx. y\`, replacing a bound variable.
- In \`freeVars\`, forgetting to remove the parameter: \`λx. x\` would wrongly have \`x\` free.`,
    wrong: [
      {
        code: `${GIVEN}

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

function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  if (t.param === x) return t;
  return L(t.param,
    subst(t.body, x, s));
}`,
        why: 'No renaming, so a free variable of `s` can be captured: `[x ↦ y](λy. x)` gives `(λy. y)`, the identity.',
      },
      {
        code: `${GIVEN}

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
  return freeVars(t.body);
}

function subst(t, x, s) {
  if (t.t === 'var') {
    return t.name === x ? s : t;
  }
  if (t.t === 'app') {
    return A(subst(t.fn, x, s),
      subst(t.arg, x, s));
  }
  return L(t.param,
    subst(t.body, x, s));
}`,
        why: '`freeVars` forgets that a λ binds its parameter (so `λx. x` has `x` free), and `subst` replaces bound variables too: `[x ↦ y](λx. x)` gives `(λx. y)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which variables are free in `λx. x (λy. y z)`?',
    options: [
      { t: '`x` and `z`', why: '`x` is bound by the outer λx.' },
      { t: '`z` only', correct: true, why: '`x` is bound by λx and `y` by λy; nothing binds `z`.' },
      { t: 'none', why: 'There is no λz anywhere, so `z` is free.' },
    ],
  },
  {
    q: 'What is `[x ↦ y] (λy. x)`?',
    options: [
      { t: '`λy. y`', why: 'That is the captured answer: the inserted y would now mean the parameter, turning the function into the identity.' },
      { t: '`λy. x`', why: 'x is free in `λy. x`, so it must be replaced.' },
      { t: '`λz. y` (or the same with any other fresh name)', correct: true, why: 'The bound y is renamed first, because y is free in what we are inserting; then x becomes y.' },
    ],
  },
  {
    q: 'Which pair is alpha-equivalent?',
    options: [
      { t: '`λx. λy. x` and `λa. λb. a`', correct: true, why: 'Both return their first argument; only the bound names differ.' },
      { t: '`λx. x y` and `λx. x z`', why: '`y` and `z` are free, so they are different outside names: renaming free variables changes the meaning.' },
      { t: '`λx. λy. x` and `λx. λy. y`', why: 'The first returns the first argument, the second the second: different functions.' },
    ],
  },
  {
    q: 'How is `λf. λx. f x y` grouped?',
    options: [
      { t: '`λf. λx. f (x y)`', why: 'Application groups to the left, so `f x` comes first.' },
      { t: '`(λf. λx. f) x y`', why: 'The body of a λ extends as far right as it can, so it takes in `f x y`.' },
      { t: '`λf. (λx. ((f x) y))`', correct: true, why: 'Both bodies run to the end, and the applications group to the left.' },
    ],
  },
  {
    q: 'In JavaScript, `const add = (a) => a + n;`. In lambda-calculus terms, what is `n`?',
    options: [
      { t: 'A free variable of the function, so the closure must find it in its environment', correct: true, why: 'Nothing in the function binds `n`; its meaning comes from outside, which is what a closure’s captured environment provides.' },
      { t: 'A bound variable', why: 'Only `a` is bound, by the parameter list.' },
      { t: 'An application', why: '`n` is a single name, a variable.' },
    ],
  },
];
