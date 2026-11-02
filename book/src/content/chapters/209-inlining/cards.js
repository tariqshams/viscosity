// Chapter 209 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'inline-what': {
    q: 'What does inlining do to a call?',
    a: 'Replaces it with a copy of the callee’s body, with the arguments in place of the parameters.',
  },
  'element-call': {
    q: 'Why does `move(ps[i])` keep `ps` as objects, while the same code pasted into the loop becomes struct of arrays?',
    a: 'Viscosity does not follow a single element into a call, so the call is a use it cannot see; inlined, every use is in view.',
  },
  'inline-rename': {
    q: 'Why does inlining give the callee’s locals fresh names?',
    a: 'So they cannot clash with, and silently take over, the caller’s variables of the same name.',
  },
  'inline-simultaneous': {
    q: 'Inline `sub(b, a)` where `sub(a, b)` is `a - b`, replacing one parameter at a time. What goes wrong?',
    a: '`a → b` gives `b - b`, then `b → a` gives `a - a`. Parameters must be replaced all at once, in the original body.',
  },
  'arg-once': {
    q: 'An argument has a side effect (say `next()`), and the parameter is used twice in the body. What must inlining do?',
    a: 'Evaluate the argument once into a fresh temporary before the body, and substitute the temporary, so the effect happens once, as in the call.',
  },
  'return-join': {
    q: 'When a callee with two `return`s is inlined into a CFG, what becomes of the call’s result?',
    a: 'Each return jumps to the block after the call, and a phi there picks whichever value was returned.',
  },
  'inline-enables': {
    q: 'What is inlining’s main benefit, beyond saving the cost of a call?',
    a: 'Caller and callee become one piece of code, so other passes (folding, DCE, value numbering, layout analysis) see across the old boundary.',
  },
  'inline-then-fold': {
    q: 'After inlining `sq(3)`, where `sq(v)` returns `v * v`, what can constant folding do?',
    a: 'Fold `3 * 3` to `9`: the call and the multiplication both disappear.',
  },
};

export const examples = {};

export const exercises = {
  inlineTree: {
    title: 'Inline calls in an expression tree',
    prompt:
      'Expressions are trees: `{ n: 3 }` is a number, `{ v: \'x\' }` a variable, `{ op, l, r }` a binary operation and `{ call, args }` a call. `fns` maps a function name to `{ params, body }`. Write `inline(e, fns)` that returns a new tree with every call to a function in `fns` replaced by its body, with the (inlined) arguments put in place of the parameters **simultaneously**. Calls to other names stay, but their arguments are inlined. Bodies may call other functions in `fns`; there is no recursion.',
    starter: `function inline(e, fns) {
  // your code here
  return e;
}

const fns = {
  sq: {
    params: ['a'],
    body: { op: '*', l: { v: 'a' },
      r: { v: 'a' } },
  },
};
const e = { call: 'sq',
  args: [{ v: 'x' }] };
const out = inline(e, fns);
console.log(JSON.stringify(out));`,
    solution: `function subst(e, env) {
  if ('v' in e) {
    const x = env.get(e.v);
    return x === undefined ? e : x;
  }
  if ('op' in e) {
    const l = subst(e.l, env);
    const r = subst(e.r, env);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => subst(a, env));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  const env = new Map();
  f.params.forEach((p, i) => {
    env.set(p, args[i]);
  });
  const body = subst(f.body, env);
  return inline(body, fns);
}`,
    tests: `const N = (n) => ({ n });
const V = (v) => ({ v });
const B = (op, l, r) => ({ op, l, r });
const C = (call, ...args) => ({ call, args });
const fns = {
  sq: { params: ['a'], body: B('*', V('a'), V('a')) },
  sub: { params: ['a', 'b'], body: B('-', V('a'), V('b')) },
  quad: { params: ['a'], body: C('sq', C('sq', V('a'))) },
};
test('inlines a simple call', () => {
  expect(inline(C('sq', V('x')), fns)).toEqual(B('*', V('x'), V('x')));
});
test('arguments can be expressions', () => {
  const arg = B('+', N(1), V('y'));
  expect(inline(C('sq', arg), fns)).toEqual(B('*', arg, arg));
});
test('substitutes all parameters at once', () => {
  expect(inline(C('sub', V('b'), V('a')), fns)).toEqual(B('-', V('b'), V('a')));
});
test('unknown calls stay, with inlined arguments', () => {
  expect(inline(C('log', C('sq', V('y'))), fns)).toEqual(C('log', B('*', V('y'), V('y'))));
});
test('calls inside an inlined body are inlined too', () => {
  const zz = B('*', V('z'), V('z'));
  expect(inline(C('quad', V('z')), fns)).toEqual(B('*', zz, zz));
});
test('trees without calls are unchanged', () => {
  expect(inline(B('+', V('x'), N(2)), fns)).toEqual(B('+', V('x'), N(2)));
});`,
    hints: [
      'Write a helper `subst(e, env)` that replaces variables found in a `Map` from parameter name to expression, and copies everything else.',
      'In `inline`, handle a call by first inlining its arguments, then building the map `param → argument` and calling `subst` on the body once, with all parameters in the map.',
      'The substituted body may itself contain calls to functions in `fns`: run `inline` on the result.',
    ],
    walkthrough: `**How to think about it.** Inline the first test by hand: the call \`sq(x)\`, where \`sq\`'s body is \`a * a\`. You look up \`sq\`, take its body, and write \`x\` wherever \`a\` appears: \`x * x\`. So there are two separate jobs. One is *substitution*: walk a body and swap each parameter for its argument. The other is *finding the calls*: walk the caller's tree, and at each call to a known function, do the substitution. Splitting them into two functions keeps each one simple. Two details from the chapter decide how they fit together: every parameter must be swapped in one pass over the original body (so a \`Map\` holding all of them is the natural tool), and the result of a substitution may contain calls of its own (\`quad\` calls \`sq\`), so it has to be inlined again.

**The solution, line by line.**

- \`function subst(e, env) {\` replaces variables using \`env\`, a \`Map\` from parameter name to argument tree.
- \`if ('v' in e) { const x = env.get(e.v); return x === undefined ? e : x; }\` a variable that is a parameter becomes its argument; any other variable stays. The argument is returned *as it is* and never walked again, which is what makes the substitution simultaneous: in \`sub(b, a)\` the \`b\` put in for \`a\` is never looked at by the replacement for \`b\`.
- \`if ('op' in e) { ... return { op: e.op, l, r }; }\` rebuilds a binary node from its substituted children.
- \`if ('call' in e) { ... return { call: e.call, args }; }\` keeps a call, substituting inside its arguments.
- \`return e;\` a number is unchanged.
- \`function inline(e, fns) {\` walks the caller's tree.
- \`if ('op' in e) { ... }\` rebuilds a binary node from its inlined children.
- \`if (!('call' in e)) return e;\` numbers and variables have nothing to inline.
- \`const args = e.args.map((a) => inline(a, fns));\` inlines inside the arguments first, so \`sq(sq(z))\` works from the inside out.
- \`const f = fns[e.call]; if (!f) return { call: e.call, args };\` a call to an unknown function stays, with its arguments inlined.
- \`const env = new Map(); f.params.forEach((p, i) => { env.set(p, args[i]); });\` pairs every parameter with its argument, by position, before any replacing happens.
- \`const body = subst(f.body, env);\` makes the substituted copy of the body, in one pass.
- \`return inline(body, fns);\` inlines any calls the body itself contains (\`quad\` becomes \`sq(sq(z))\`, which becomes \`(z * z) * (z * z)\`). This cannot loop forever because the task promises no recursion; the next chapter is about what to do when there is.

**Common wrong attempts.**

- Replacing one parameter at a time (\`body = rep(body, p, args[i])\` in a loop): for \`sub(b, a)\` the first step gives \`b - b\` and the second \`a - a\`.
- Returning the substituted body without inlining it again: \`quad(z)\` comes out as \`sq(sq(z))\`, with the calls inside the body never inlined.

This toy copies an argument wherever its parameter appears (\`sq(1 + y)\` becomes \`(1 + y) * (1 + y)\`). That is fine for pure expressions; a real compiler first evaluates each argument once into a fresh temporary, so side effects happen once, and in an IR the callee's locals and SSA values get fresh names as they are copied.`,
    wrong: [
      {
        code: `function rep(e, name, by) {
  if ('v' in e) {
    return e.v === name ? by : e;
  }
  if ('op' in e) {
    const l = rep(e.l, name, by);
    const r = rep(e.r, name, by);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => rep(a, name, by));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  let body = f.body;
  f.params.forEach((p, i) => {
    body = rep(body, p, args[i]);
  });
  return inline(body, fns);
}`,
        why: 'Replacing one parameter at a time lets a later replacement rewrite an argument that an earlier one put in. `sub(b, a)` becomes `b - b` and then `a - a`.',
      },
      {
        code: `function subst(e, env) {
  if ('v' in e) {
    const x = env.get(e.v);
    return x === undefined ? e : x;
  }
  if ('op' in e) {
    const l = subst(e.l, env);
    const r = subst(e.r, env);
    return { op: e.op, l, r };
  }
  if ('call' in e) {
    const args = e.args.map(
      (a) => subst(a, env));
    return { call: e.call, args };
  }
  return e;
}

function inline(e, fns) {
  if ('op' in e) {
    const l = inline(e.l, fns);
    const r = inline(e.r, fns);
    return { op: e.op, l, r };
  }
  if (!('call' in e)) return e;
  const args = e.args.map(
    (a) => inline(a, fns));
  const f = fns[e.call];
  if (!f) return { call: e.call, args };
  const env = new Map();
  f.params.forEach((p, i) => {
    env.set(p, args[i]);
  });
  return subst(f.body, env);
}`,
        why: 'The substituted body is returned as it is, so calls *inside* the body (like the two `sq` calls in `quad`) are never inlined.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Inline `sub(b, a)`, where `function sub(a, b) { return a - b; }`. What is the result?',
    options: [
      { t: '`a - b`', why: 'That is the body before any substitution.' },
      { t: '`b - a`', correct: true, why: 'Replace both parameters at once in the original body: `a` becomes `b` and `b` becomes `a`.' },
      { t: '`a - a`', why: 'That is what replacing one parameter at a time gives: the second replacement rewrites the first one’s result.' },
      { t: '`b - b`', why: 'That is the halfway point of the one-at-a-time mistake.' },
    ],
  },
  {
    q: 'Why does inlining rename the callee’s local variables?',
    options: [
      { t: 'Shorter names make the code faster', why: 'Names have no effect on speed; the issue is clashes.' },
      { t: 'JavaScript forbids two variables with the same name in one program', why: 'It allows them in different scopes; inlining merges two scopes into one.' },
      { t: 'So a callee local cannot clash with a caller variable of the same name', correct: true, why: 'Without fresh names, the copy could overwrite or read the caller’s variable by accident.' },
    ],
  },
  {
    q: 'A function with two `return` statements is inlined into a CFG. How is the call’s value produced?',
    options: [
      { t: 'By a phi in the block after the call, with one operand per return', correct: true, why: 'Each return becomes a jump to that block, carrying its value as a phi operand.' },
      { t: 'By keeping only the first return', why: 'Either return may be the one that runs.' },
      { t: 'By a new call to the original function', why: 'That would undo the inlining.' },
    ],
  },
  {
    q: 'What is the main reason compilers inline small functions?',
    options: [
      { t: 'Calls are very slow on modern hardware', why: 'A call costs a few instructions; that is rarely the main gain.' },
      { t: 'Other optimisations can then work across the old call boundary', correct: true, why: 'Constants meet operations, dead results become visible, and analyses see every use.' },
      { t: 'It makes the program smaller', why: 'It usually makes it bigger, which is its main cost.' },
    ],
  },
  {
    q: 'Viscosity keeps `ps` as an array of objects when the loop calls `move(ps[i])`. What happens if you inline `move` by hand?',
    options: [
      { t: 'Nothing changes: Viscosity follows calls anyway', why: 'It does not follow a single element into a call, which is why it refused.' },
      { t: 'It switches to struct of arrays, because every use of the element is now in view', correct: true, why: 'The real explanation changes to “struct of arrays” with typed columns for x and vx.' },
      { t: 'The program prints a different answer', why: 'Inlining by hand does not change what the program does.' },
    ],
  },
  {
    q: 'What does inlining cost?',
    options: [
      { t: 'Correctness: inlined code can behave differently', why: 'Done right (simultaneous substitution, fresh names, arguments evaluated once) it behaves exactly the same.' },
      { t: 'Nothing; it is always a win', why: 'Every copy adds code, which costs compile time and memory, and can crowd the instruction cache.' },
      { t: 'Code size, and so compile time and memory', correct: true, why: 'The body is copied at every inlined call site.' },
    ],
  },
];
