// Chapter 209 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'linear-what': {
    q: 'What does a linear type promise about a variable?',
    a: 'It is used exactly once: never duplicated (used twice) and never discarded (left unused).',
  },
  'affine-what': {
    q: 'How do affine types differ from linear ones?',
    a: 'An affine value is used at most once: it may be dropped unused, but still never used twice.',
  },
  'rust-affine': {
    q: 'Why does rustc reject using `s` after `let t = s;` for a String?',
    a: 'The assignment moves the string to t, its new single owner, so s may no longer be used: error E0382, borrow of moved value.',
  },
  'linear-why': {
    q: 'Name one thing linear types make safe.',
    a: 'Closing a file handle exactly once, or updating a value in place when no one else can see the old version.',
  },
  'effect-what': {
    q: 'What does an effect system add to a typing judgement?',
    a: 'An effect: the set of things an expression may do when it runs, written Γ ⊢ e : T ! ε.',
  },
  'effect-union': {
    q: 'What are the effects of `e₁; e₂`?',
    a: 'The union of the effects of e₁ and of e₂.',
  },
  'pure-what': {
    q: 'In an effect system, what is a pure function?',
    a: 'One whose type records an empty set of effects.',
  },
  'java-effect': {
    q: 'In what sense are Java’s checked exceptions an effect system?',
    a: 'A method’s signature must declare the checked exceptions its body may throw (throws IOException), and callers must handle or declare them.',
  },
  'async-effect': {
    q: 'How does TypeScript show that an async function runs later?',
    a: 'Its return type is a Promise (Promise<number>), which cannot be used as a plain number.',
  },
};

export const examples = {};

export const exercises = {
  linear: {
    title: 'Is every parameter used once?',
    prompt: 'Terms are lambda-calculus terms: `v(x)`, `n(1)`, `lam(x, body)` and `app(f, a)`. Write `uses(e, x)`, the number of times the variable `x` occurs free in `e` (an inner `lam` with the same parameter name hides it), and then `isLinear(e)`, true when every λ in `e` uses its parameter exactly once in its body, and `isAffine(e)`, true when every λ uses its parameter at most once. Free variables (like a function `f` from outside) are not checked.',
    starter: `const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });

function uses(e, x) {
  return 0;
}

function isLinear(e) {
  return true;
}

function isAffine(e) {
  return true;
}`,
    solution: `const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });

function uses(e, x) {
  if (e.e === 'var') {
    return e.x === x ? 1 : 0;
  }
  if (e.e === 'num') return 0;
  if (e.e === 'lam') {
    if (e.x === x) return 0;
    return uses(e.body, x);
  }
  return uses(e.f, x) + uses(e.a, x);
}

// does every λ use its parameter
// a number of times that ok accepts?
function every(e, ok) {
  if (e.e === 'var') return true;
  if (e.e === 'num') return true;
  if (e.e === 'lam') {
    return ok(uses(e.body, e.x)) &&
      every(e.body, ok);
  }
  return every(e.f, ok) &&
    every(e.a, ok);
}

const isLinear = (e) =>
  every(e, (k) => k === 1);
const isAffine = (e) =>
  every(e, (k) => k <= 1);`,
    tests: `const f = v('f');
test('uses counts free occurrences', () => {
  expect(uses(app(app(f, v('x')), v('x')), 'x')).toBe(2);
  expect(uses(n(1), 'x')).toBe(0);
  expect(uses(lam('x', v('x')), 'x')).toBe(0);
  expect(uses(lam('y', v('x')), 'x')).toBe(1);
});
test('λx. x is linear', () => {
  expect(isLinear(lam('x', v('x')))).toBe(true);
  expect(isAffine(lam('x', v('x')))).toBe(true);
});
test('an unused parameter: affine, not linear', () => {
  const k = lam('x', lam('y', v('x')));
  expect(isLinear(k)).toBe(false);
  expect(isAffine(k)).toBe(true);
});
test('a parameter used twice: neither', () => {
  const dup = lam('x', app(app(f, v('x')), v('x')));
  expect(isLinear(dup)).toBe(false);
  expect(isAffine(dup)).toBe(false);
});
test('every λ is checked, however deep', () => {
  const ok = lam('g', lam('x', app(v('g'), v('x'))));
  expect(isLinear(ok)).toBe(true);
  const inner = app(f, lam('y', app(app(f, v('y')), v('y'))));
  expect(isLinear(inner)).toBe(false);
  expect(isAffine(app(f, lam('y', n(3))))).toBe(true);
});
test('shadowing: the inner x is a different variable', () => {
  expect(isLinear(lam('x', lam('x', v('x'))))).toBe(false);
  expect(isAffine(lam('x', lam('x', v('x'))))).toBe(true);
});`,
    hints: [
      '`uses` is a walk over the term, like `ftv` in chapter 196: a variable counts 1 if it is the one you want, a number counts 0, an application adds its two sides. The only care is a λ that binds the same name.',
      'For `lam`: if `e.x === x`, the inner λ hides the outer `x`, so return 0; otherwise count in the body. Then write one helper that walks the whole term and, at each λ, checks `uses(e.body, e.x)` against a condition.',
      'With a helper `every(e, ok)`: at a λ, return `ok(uses(e.body, e.x)) && every(e.body, ok)`; at an application, check both sides; variables and numbers are fine. Then `isLinear` is `every(e, (k) => k === 1)` and `isAffine` is `every(e, (k) => k <= 1)`.',
    ],
    walkthrough: `**How to think about it.** A linear type checker’s real work, splitting the environment so each variable goes to exactly one place, comes down to counting: how many times does each bound variable occur in its scope? So first write the counter, being careful with shadowing (a λ that rebinds the name starts a new variable, and its uses are not ours), and then walk the term once, checking each λ’s count. Linear and affine differ only in the test on the count, so one walker with the test passed in serves both.

**The solution, line by line.**

- \`if (e.e === 'var') { return e.x === x ? 1 : 0; }\` A variable is one use of x if it is x.
- \`if (e.e === 'num') return 0;\` Numbers use nothing.
- \`if (e.e === 'lam') { if (e.x === x) return 0; return uses(e.body, x); }\` A λ binding the same name hides x: occurrences inside belong to the inner variable. Otherwise count in its body.
- \`return uses(e.f, x) + uses(e.a, x);\` An application uses x as often as its two parts together: this sum is where “used twice” shows up.
- \`function every(e, ok)\` walks the whole term, \`ok\` being the test on a count.
- \`if (e.e === 'lam') { return ok(uses(e.body, e.x)) && every(e.body, ok); }\` At each λ, count its own parameter in its body and test the count, then go on checking λs inside the body.
- \`return every(e.f, ok) && every(e.a, ok);\` In an application, a λ may hide in either part (the argument, in \`f (λy. ...)\`).
- \`const isLinear = (e) => every(e, (k) => k === 1);\` exactly once; \`const isAffine = (e) => every(e, (k) => k <= 1);\` at most once.

**Common wrong attempts.**

- Ignoring shadowing in \`uses\`: in \`λx. λx. x\` the outer x would be counted once and look linear, though the only use belongs to the inner x.
- Checking only the outermost λ: \`f (λy. f y y)\` hides a parameter used twice inside an argument.
- Using \`k <= 1\` for linear: then an unused parameter (\`λx. λy. x\`) passes, which is affine, not linear.`,
    wrong: [
      {
        code: `const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });

function uses(e, x) {
  if (e.e === 'var') {
    return e.x === x ? 1 : 0;
  }
  if (e.e === 'num') return 0;
  if (e.e === 'lam') {
    return uses(e.body, x);
  }
  return uses(e.f, x) + uses(e.a, x);
}

// does every λ use its parameter
// a number of times that ok accepts?
function every(e, ok) {
  if (e.e === 'var') return true;
  if (e.e === 'num') return true;
  if (e.e === 'lam') {
    return ok(uses(e.body, e.x)) &&
      every(e.body, ok);
  }
  return every(e.f, ok) &&
    every(e.a, ok);
}

const isLinear = (e) =>
  every(e, (k) => k === 1);
const isAffine = (e) =>
  every(e, (k) => k <= 1);`,
        why: 'Shadowing is ignored, so in `λx. λx. x` the outer x seems to be used once.',
      },
      {
        code: `const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });

function uses(e, x) {
  if (e.e === 'var') {
    return e.x === x ? 1 : 0;
  }
  if (e.e === 'num') return 0;
  if (e.e === 'lam') {
    if (e.x === x) return 0;
    return uses(e.body, x);
  }
  return uses(e.f, x) + uses(e.a, x);
}

// does every λ use its parameter
// a number of times that ok accepts?
function every(e, ok) {
  if (e.e === 'var') return true;
  if (e.e === 'num') return true;
  if (e.e === 'lam') {
    return ok(uses(e.body, e.x)) &&
      every(e.body, ok);
  }
  return true;
}

const isLinear = (e) =>
  every(e, (k) => k === 1);
const isAffine = (e) =>
  every(e, (k) => k <= 1);`,
        why: 'λs inside an application are never checked, so `f (λy. f y y)` is wrongly linear.',
      },
      {
        code: `const v = (x) => ({ e: 'var', x });
const n = (val) => ({ e: 'num', val });
const lam = (x, body) =>
  ({ e: 'lam', x, body });
const app = (f, a) =>
  ({ e: 'app', f, a });

function uses(e, x) {
  if (e.e === 'var') {
    return e.x === x ? 1 : 0;
  }
  if (e.e === 'num') return 0;
  if (e.e === 'lam') {
    if (e.x === x) return 0;
    return uses(e.body, x);
  }
  return uses(e.f, x) + uses(e.a, x);
}

// does every λ use its parameter
// a number of times that ok accepts?
function every(e, ok) {
  if (e.e === 'var') return true;
  if (e.e === 'num') return true;
  if (e.e === 'lam') {
    return ok(uses(e.body, e.x)) &&
      every(e.body, ok);
  }
  return every(e.f, ok) &&
    every(e.a, ok);
}

const isLinear = (e) =>
  every(e, (k) => k <= 1);
const isAffine = (e) =>
  every(e, (k) => k <= 1);`,
        why: 'This is the affine test, so a parameter that is never used is accepted as linear.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these terms is linear?',
    options: [
      {
        t: '`λx. λy. x`',
        why: 'y is never used: affine, but not linear.',
      },
      {
        t: '`λf. λx. f x`',
        correct: true,
        why: 'f and x are each used exactly once.',
      },
      {
        t: '`λx. pair x x`',
        why: 'x is used twice.',
      },
    ],
  },
  {
    q: 'Rust lets you leave a String unused, but not use it after a move. Which kind of type system does that match?',
    options: [
      {
        t: 'Linear: exactly once',
        why: 'Linear would also forbid leaving it unused.',
      },
      {
        t: 'Dependent: the type mentions a value',
        why: 'Ownership is about how often a value is used, not about values in types.',
      },
      {
        t: 'Affine: at most once',
        correct: true,
        why: 'A moved-from variable cannot be used again, and dropping a value is allowed.',
      },
    ],
  },
  {
    q: 'If `e₁ : unit ! {io}` and `e₂ : number ! {throw}`, what is the type and effect of `e₁; e₂`?',
    options: [
      {
        t: '`number ! {io, throw}`',
        correct: true,
        why: 'The value is e₂’s, and the effects are the union of both.',
      },
      {
        t: '`number ! {throw}`',
        why: 'e₁ runs too, so its io effect must be included.',
      },
      {
        t: '`unit ! {io}`',
        why: 'The sequence produces e₂’s value, and both effects.',
      },
    ],
  },
  {
    q: 'Why does javac reject a method whose body may throw an IOException, when it has no `throws` clause?',
    options: [
      {
        t: 'Because IOException is not a real class',
        why: 'It is in java.io; the problem is the missing declaration.',
      },
      {
        t: 'Because a checked exception is an effect that the method’s signature must declare',
        correct: true,
        why: '“unreported exception IOException; must be caught or declared to be thrown”.',
      },
      {
        t: 'Because Java methods may not throw',
        why: 'They may, if they say so.',
      },
    ],
  },
  {
    q: 'What does `duplicate : (1 x : a) -> (a, a)` show in Idris 2?',
    options: [
      {
        t: 'A function that copies any value twice',
        why: 'Its type forbids exactly that: x must be used once.',
      },
      {
        t: 'A type error in the declaration',
        why: 'The type is fine; it is the definition that cannot exist.',
      },
      {
        t: 'A type that no definition can satisfy, since a pair of x needs x twice',
        correct: true,
        why: 'The quantity 1 says x is used exactly once at run time.',
      },
    ],
  },
];
