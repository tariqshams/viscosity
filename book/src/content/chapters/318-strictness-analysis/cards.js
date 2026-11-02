// Chapter 317-b cards (staged second half of chapter 317). Keys are
// stable ids: never rename them.

export const prompts = {
  'sa-cost': {
    q: 'Name two costs of passing every argument lazily.',
    a: 'An allocation for each thunk (and a later force), and space leaks: chains of thunks kept alive until something forces them.',
  },
  'sa-leak': {
    q: 'Why does forcing a lazy accumulator built over a million passes overflow the stack?',
    a: 'Each thunk forces the one before it before adding, so forcing the last runs a million nested calls.',
  },
  'sa-bottom': {
    q: 'What does ⊥ ("bottom") stand for?',
    a: 'A computation that never produces a value: it loops forever or fails.',
  },
  'sa-strict': {
    q: 'When is a function **strict** in an argument?',
    a: 'When giving it ⊥ for that argument always makes the result ⊥: f(⊥) = ⊥. In practice, when every path evaluates the argument.',
  },
  'sa-safe': {
    q: 'Why may a compiler evaluate a strict argument before the call?',
    a: 'If the argument has a value, it was going to be computed anyway; if it is ⊥, the call would have been ⊥ too. Either way the answer is unchanged.',
  },
  'sa-domain': {
    q: 'In the two-point domain, what do 0 and 1 mean?',
    a: '0: surely no value (⊥). 1: may have a value. 1 is the safe, "don\'t know" answer.',
  },
  'sa-if': {
    q: 'What is the abstract version of `if c then t else e`?',
    a: '`c ∧ (t ∨ e)`: the test is always evaluated, and then one branch.',
  },
  'sa-rec': {
    q: 'How is the abstract version of a recursive function found?',
    a: 'By iteration from the guess "always 0": substitute the current guess into the body, and repeat until the table stops changing (a fixpoint).',
  },
  'sa-ghc': {
    q: 'What does GHC do with an argument its demand analysis finds strict?',
    a: 'It may pass it by value (no thunk), and often unboxed, using the worker/wrapper transformation; this runs with -O.',
  },
  'sa-bang': {
    q: 'What can a Haskell programmer write when the analysis cannot prove strictness?',
    a: 'A bang pattern such as `!acc` (BangPatterns), or `seq`, to ask for call-by-value at that point.',
  },
};

export const examples = {
  fixpoint: {
    title: 'Strictness by fixpoint',
    code: `// 0: surely no value. 1: maybe a value.
const add = (a, b) => a & b;
const cond = (c, t, e) => c & (t | e);

// Solve f# by iteration, as a table
// of all inputs, starting from 0s.
function fix(k, body) {
  let tbl = Array(2 ** k).fill(0);
  const at = (xs) =>
    xs.reduce((i, x) => i * 2 + x, 0);
  const args = (i) => Array.from(
    { length: k },
    (_, j) => (i >> (k - 1 - j)) & 1);
  for (let round = 1; ; round++) {
    const f = (...xs) => tbl[at(xs)];
    const next = tbl.map((_, i) =>
      body(f, ...args(i)));
    console.log('round', round,
      next.join(''));
    if (next.join() === tbl.join())
      return f;
    tbl = next;
  }
}

// sum(n, acc) = if n == 0 then acc
//   else sum(n - 1, acc + n)
const sum = fix(2, (f, n, acc) =>
  cond(n, acc, f(n, add(acc, n))));
console.log('strict in n:',
  sum(0, 1) === 0);
console.log('strict in acc:',
  sum(1, 0) === 0);

// pick(c, a, b) = if c then a else b
const pick = fix(3, (f, c, a, b) =>
  cond(c, a, b));
console.log('pick strict in a:',
  pick(1, 0, 1) === 0);`,
  },
};

export const exercises = {
  strictness: {
    title: 'A strictness analyser',
    prompt:
      'Write `abs(e, env)`, the abstract evaluator over the two-point domain, for expressions that are objects: `{ k: \'num\' }` (a number literal), `{ k: \'err\' }` (an error: never a value), `{ k: \'var\', name }`, `{ k: \'op\', a, b }` (any arithmetic or comparison on `a` and `b`) and `{ k: \'if\', c, t, e }`. `env` maps each variable name to `0` or `1`. Return `0` or `1`. Then write `strictIn(params, body, x)`: it returns `true` when a function with parameter names `params` and body `body` is provably strict in the parameter `x` (the body is `0` when `x` is `0` and every other parameter is `1`).',
    starter: `function abs(e, env) {
  return 1;
}
function strictIn(params, body, x) {
  return false;
}`,
    solution: `function abs(e, env) {
  switch (e.k) {
    case 'num': return 1;
    case 'err': return 0;
    case 'var': return env[e.name];
    case 'op':
      return abs(e.a, env) &
        abs(e.b, env);
    case 'if':
      return abs(e.c, env) &
        (abs(e.t, env) | abs(e.e, env));
  }
}
function strictIn(params, body, x) {
  const env = {};
  for (const p of params)
    env[p] = p === x ? 0 : 1;
  return abs(body, env) === 0;
}`,
    tests: `const v = (name) => ({ k: 'var', name });
const op = (a, b) => ({ k: 'op', a, b });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const num = { k: 'num' };
const err = { k: 'err' };
test('literals, errors and variables', () => {
  expect(abs(num, {})).toBe(1);
  expect(abs(err, {})).toBe(0);
  expect(abs(v('x'), { x: 0 })).toBe(0);
});
test('an operator needs both sides', () => {
  expect(abs(op(v('x'), num), { x: 0 })).toBe(0);
  expect(abs(op(v('x'), num), { x: 1 })).toBe(1);
});
test('x + y is strict in both', () => {
  const b = op(v('x'), v('y'));
  expect(strictIn(['x', 'y'], b, 'x')).toBe(true);
  expect(strictIn(['x', 'y'], b, 'y')).toBe(true);
});
test('pick is strict only in c', () => {
  const b = iff(v('c'), v('a'), v('b'));
  const ps = ['c', 'a', 'b'];
  expect(strictIn(ps, b, 'c')).toBe(true);
  expect(strictIn(ps, b, 'a')).toBe(false);
});
test('used on both branches is strict', () => {
  const b = iff(v('c'), v('a'), op(v('a'), num));
  expect(strictIn(['c', 'a'], b, 'a')).toBe(true);
});
test('an unused parameter is not strict', () => {
  expect(strictIn(['x', 'y'], v('x'), 'y')).toBe(false);
});`,
    hints: [
      'Ask, for each kind of node, "does this surely give no value?". A literal always gives a value (1); an error never does (0); a variable is whatever `env` says.',
      'An operator needs both operands, so it is `abs(a) & abs(b)` (with 0 and 1, `&` is "and" and `|` is "or"). An `if` evaluates its test and then one of its branches: `abs(c) & (abs(t) | abs(e))`.',
      'For `strictIn`, build an `env` where `x` is `0` and every other parameter is `1`, and check whether `abs(body, env) === 0`. A `switch (e.k)` keeps `abs` tidy.',
    ],
    walkthrough: `**How to think about it.** Strictness asks a question about every possible run: "if this argument never produces a value, can the function still produce one?" Running the function cannot answer that, so we run an *abstract* version instead, where every value is replaced by one bit: 0 for "surely no value" and 1 for "might have a value". Each construct then gets a rule saying how the bit of the whole depends on the bits of its parts, and the rules must err on the safe side: when in doubt, say 1, because 1 only stops an optimisation, while a wrong 0 would make the compiler evaluate something that might loop.

**The solution, line by line.**

- \`function abs(e, env) {\` and \`switch (e.k) {\` dispatch on the kind of node.
- \`case 'num': return 1;\` a literal is always a value.
- \`case 'err': return 0;\` an error never is; this is ⊥ written in the program.
- \`case 'var': return env[e.name];\` a variable is whatever the caller assumed about it.
- \`case 'op': return abs(e.a, env) & abs(e.b, env);\` (over two lines): \`a + b\` needs both, so it has a value only if both might; with bits, that is \`&\`.
- \`case 'if': return abs(e.c, env) & (abs(e.t, env) | abs(e.e, env));\` the test is always evaluated (so if it is 0, the whole is 0), and then one branch, which we cannot predict, so the whole might have a value if either branch might: \`|\`.
- \`function strictIn(params, body, x) {\` sets up the question for one parameter.
- The \`for\` loop builds \`env\` with \`x\` as 0 and every other parameter as 1 (the others are given the benefit of the doubt, so that only \`x\` can cause a 0).
- \`return abs(body, env) === 0;\` if the body surely has no value when \`x\` has none, the function is strict in \`x\`.

**Common wrong attempts.**

- Using \`|\` for operators: then \`x + y\` looks as if it can have a value without \`x\`, and nothing is ever found strict.
- Using \`&\` across both branches of an \`if\` (\`c & t & e\`): \`pick\` then looks strict in \`a\`, the compiler would evaluate \`a\` early, and \`pick(true, 1, loop())\` would hang. That is the dangerous direction.
- Setting every other parameter to 0 as well: a 0 might then come from another parameter, not \`x\`.`,
    wrong: [
      {
        code: `function abs(e, env) {
  switch (e.k) {
    case 'num': return 1;
    case 'err': return 0;
    case 'var': return env[e.name];
    case 'op':
      return abs(e.a, env) &
        abs(e.b, env);
    case 'if':
      return abs(e.c, env) &
        abs(e.t, env) & abs(e.e, env);
  }
}
function strictIn(params, body, x) {
  const env = {};
  for (const p of params)
    env[p] = p === x ? 0 : 1;
  return abs(body, env) === 0;
}`,
        why: 'An `if` evaluates only one branch, so `&` over both claims `pick` is strict in `a`: unsafe, since evaluating `a` early could loop.',
      },
      {
        code: `function abs(e, env) {
  switch (e.k) {
    case 'num': return 1;
    case 'err': return 0;
    case 'var': return env[e.name];
    case 'op':
      return abs(e.a, env) &
        abs(e.b, env);
    case 'if':
      return abs(e.c, env) &
        (abs(e.t, env) | abs(e.e, env));
  }
}
function strictIn(params, body, x) {
  const env = {};
  for (const p of params) env[p] = 0;
  return abs(body, env) === 0;
}`,
        why: 'Every parameter is 0, so a 0 can come from another parameter: `x` looks strict even when the body ignores it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which function is strict in `y`?',
    options: [
      { t: '`f(x, y) = x`', why: 'It never looks at `y`, so `f(1, ⊥)` is 1.' },
      { t: '`f(x, y) = if x then y else 0`', why: 'When `x` is false, `y` is not needed, so `f(false, ⊥)` is 0.' },
      { t: '`f(x, y) = if x then y else y + 1`', correct: true, why: 'Both branches use `y`, so `y` is evaluated on every path: f(x, ⊥) = ⊥.' },
    ],
  },
  {
    q: 'Why is it safe to compute a strict argument before the call?',
    options: [
      { t: 'Because strict arguments are always cheap', why: 'Strictness says nothing about cost.' },
      { t: 'Because the function would compute it on every path anyway, and if it loops, the call would loop too', correct: true, why: 'So the answer, including "never answers", is the same; only the thunk is saved.' },
      { t: 'Because Haskell has no side effects at all', why: 'Purity matters, but the key is that a strict argument is needed whatever happens.' },
    ],
  },
  {
    q: 'An analyser is unsure whether an argument is needed. What must it answer?',
    options: [
      { t: '1, "may have a value": not strict, keep the thunk', correct: true, why: 'Saying 1 only loses an optimisation; a wrong 0 could make the program hang or fail where it would not have.' },
      { t: '0, so the argument is evaluated early', why: 'That could evaluate something the program never needed, such as an infinite loop.' },
      { t: 'Either; both are safe', why: 'Only the 1 direction is safe.' },
    ],
  },
  {
    q: 'The fixpoint for `sum#` starts from the guess "always 0". Why that guess?',
    options: [
      { t: 'It is the least element; iterating upwards from it gives the least fixpoint, the most precise safe answer', correct: true, why: 'As in chapter 196: start at the bottom and grow until nothing changes.' },
      { t: 'Because recursive functions never return', why: 'They usually do; 0 is only the first guess, which the rounds correct.' },
      { t: 'It is arbitrary; any start gives the same answer', why: 'Starting from "always 1" stops at once with a useless answer: nothing strict.' },
    ],
  },
  {
    q: 'What does GHC\'s demand analysis do besides strictness?',
    options: [
      { t: 'It chooses register allocations', why: 'That is the back end\'s job.' },
      { t: 'Nothing; it only runs with -O0', why: 'It is off by default and enabled by -O.' },
      { t: 'Usage analysis: finding arguments used at most once (call-by-name is then enough) or not at all (absent)', correct: true, why: 'The user\'s guide describes both, and the worker/wrapper transformation acting on them.' },
    ],
  },
];
