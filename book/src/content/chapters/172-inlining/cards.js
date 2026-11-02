// Chapter 172 cards. Keys are stable ids: never rename them.

export const prompts = {
  'inline-what': {
    q: 'What does inlining do to a call?',
    a: 'Replaces it with a copy of the callee’s body, with the arguments in place of the parameters.',
  },
  'element-call': {
    q: 'Why does `move(ps[i])` keep `ps` as objects, while the same code pasted into the loop becomes SoA?',
    a: 'Viscosity doesn’t follow a single element into a call, so the call is a use it can’t see. Inline, every use is visible.',
  },
  'inline-rename': {
    q: 'Why does inlining give the callee’s locals fresh names?',
    a: 'So they can’t clash with (and silently capture) the caller’s variables of the same name.',
  },
  'inline-simultaneous': {
    q: 'Inline `sub(b, a)` where `sub(a, b)` is `a - b`, replacing one parameter at a time. What goes wrong?',
    a: '`a → b` gives `b - b`, then `b → a` gives `a - a`. Parameters must be replaced all at once, in the original body.',
  },
  'inline-enables': {
    q: 'What is inlining’s main benefit, beyond saving the cost of a call?',
    a: 'Caller and callee become one piece of code, so other optimizations (constant propagation, DCE, layout decisions) can see across the boundary.',
  },
  'inline-cost': {
    q: 'What does inlining cost?',
    a: 'Code size: the body is duplicated at each call site, so compile time and memory grow.',
  },
  'inline-recursion': {
    q: 'Why can’t a recursive function be inlined completely?',
    a: 'Each inlined copy contains another call to itself, so the expansion never ends.',
  },
  'call-graph-what': {
    q: 'What is a call graph?',
    a: 'One node per function, and an edge f → g when f contains a call that may reach g.',
  },
  'js-callee-unknown': {
    q: 'Why is a JavaScript call graph hard to build ahead of time?',
    a: 'Functions are values: `f(x)` calls whatever `f` holds, callbacks are called from elsewhere, and methods are found at run time.',
  },
  'known-fn': {
    q: 'When does Viscosity treat a function as “known”?',
    a: 'When it is declared once and its name is used only for direct calls: never passed, reassigned or called as a method.',
  },
  'param-alias': {
    q: 'When does Viscosity treat a parameter as another name for a collection?',
    a: 'When the function is known and every call site passes that same collection in that position.',
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
    walkthrough: `Two functions, two jobs.

- **\`subst(e, env)\`** walks the body and swaps each variable that is in \`env\` for its argument. Because every parameter is in the map at once, and the replacement expressions are never walked again by \`subst\`, an argument that happens to be called \`a\` can’t be mistaken for the parameter \`a\`. That is the simultaneous substitution that \`sub(b, a)\` needs.
- **\`inline(e, fns)\`** walks the caller’s tree. Binary nodes are rebuilt from their inlined children. A call first gets its arguments inlined (so \`sq(sq(z))\` works from the inside out). If the callee is unknown, the call stays. If it is known, the body is substituted and then inlined again, because the body may itself call \`sq\`.

Real inliners do the same on an IR instead of a tree. There, the renaming of callee *locals* is just as important: SSA values get fresh ids when the body is copied. In an expression tree without local variables, the parameters are the only names to worry about.

One thing this toy gets away with: an argument used twice (\`sq(1 + y)\`) is copied twice. That is fine for pure expressions. A real compiler binds each argument to a fresh temporary first, so side effects run once.`,
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
  recursiveFns: {
    optional: true,
    title: 'Which functions are recursive?',
    prompt:
      'Using the same trees, build the call graph of `fns` and return the names (sorted) of functions that can reach **themselves** through one or more calls. Those are the ones an inliner can’t expand completely. Calls to names not in `fns` lead nowhere.',
    starter: `function recursive(fns) {
  // your code here
  return [];
}

const fns = {
  f: { params: ['a'],
    body: { call: 'f',
      args: [{ v: 'a' }] } },
  g: { params: [], body: { n: 1 } },
};
console.log(recursive(fns)); // ['f']`,
    solution: `function calls(e, out) {
  if ('op' in e) {
    calls(e.l, out);
    calls(e.r, out);
  }
  if ('call' in e) {
    out.add(e.call);
    for (const a of e.args) {
      calls(a, out);
    }
  }
  return out;
}

function recursive(fns) {
  const graph = new Map();
  for (const name of Object.keys(fns)) {
    const body = fns[name].body;
    const out = calls(body, new Set());
    graph.set(name, out);
  }
  const reaches = (from, to) => {
    const seen = new Set();
    const stack = [...graph.get(from)];
    while (stack.length > 0) {
      const g = stack.pop();
      if (g === to) return true;
      if (seen.has(g)) continue;
      if (!graph.has(g)) continue;
      seen.add(g);
      stack.push(...graph.get(g));
    }
    return false;
  };
  return Object.keys(fns)
    .filter((f) => reaches(f, f))
    .sort();
}`,
    tests: `const V = (v) => ({ v });
const B = (op, l, r) => ({ op, l, r });
const C = (call, ...args) => ({ call, args });
test('a direct self-call', () => {
  expect(recursive({ f: { params: ['a'], body: C('f', V('a')) } })).toEqual(['f']);
});
test('mutual recursion counts for both', () => {
  const fns = {
    even: { params: ['n'], body: C('odd', V('n')) },
    odd: { params: ['n'], body: C('even', V('n')) },
    main: { params: [], body: C('even', V('k')) },
  };
  expect(recursive(fns)).toEqual(['even', 'odd']);
});
test('calls to unknown functions lead nowhere', () => {
  expect(recursive({ f: { params: [], body: C('log', V('x')) } })).toEqual([]);
});
test('a chain without cycles', () => {
  const fns = {
    sq: { params: ['a'], body: B('*', V('a'), V('a')) },
    quad: { params: ['a'], body: C('sq', C('sq', V('a'))) },
  };
  expect(recursive(fns)).toEqual([]);
});`,
    hints: [
      'First collect, for each function, the set of names its body calls (walk the tree, including call arguments).',
      'A function is recursive if a search starting from its callees ever arrives back at it.',
      'Keep a `seen` set so cycles that don’t include the starting function don’t loop forever.',
    ],
    walkthrough: `The call graph is a \`Map\` from each function to the set of names its body calls, found by a tree walk that also looks inside call arguments (\`sq(sq(a))\` calls \`sq\` twice, but the set keeps one).

“Can \`f\` reach itself?” is a graph search that starts from \`f\`’s callees, not from \`f\` itself; otherwise every function would trivially “reach” itself at step zero. The \`seen\` set handles cycles that don’t pass through \`f\`, and names missing from the graph (unknown functions) are dead ends.

A real inliner uses exactly this: functions on a cycle get a depth limit or are never inlined into each other.`,
    wrong: [
      {
        code: `function selfCalls(e, name) {
  if ('op' in e) {
    return selfCalls(e.l, name) ||
      selfCalls(e.r, name);
  }
  if ('call' in e) {
    return e.call === name ||
      e.args.some(
        (a) => selfCalls(a, name));
  }
  return false;
}

function recursive(fns) {
  return Object.keys(fns)
    .filter((f) =>
      selfCalls(fns[f].body, f))
    .sort();
}`,
        why: 'This only finds functions that call themselves directly. `even` and `odd` call each other, so each reaches itself in two steps, and this misses both.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You inline `twice(n)`, whose body is `const t = n + n; return t;`, at the call `const t = 1; const u = twice(t);`. Which result is correct?',
    options: [
      { t: '`const t = 1; const t = t + t; const u = t;`', why: 'The callee’s `t` wasn’t renamed, so it clashes with the caller’s `t` (and `t + t` would read the wrong one).' },
      { t: '`const t = 1; const t1 = t + t; const u = t1;`', correct: true, why: 'The callee local gets a fresh name, `n` is replaced by the argument `t`, and the return value becomes the value of the call.' },
      { t: '`const t = 1; const t1 = n + n; const u = t1;`', why: 'The local was renamed, but the parameter `n` was never replaced by its argument.' },
      { t: '`const u = twice(1);`', why: 'That is constant propagation into the call, not inlining: the call is still there.' },
    ],
  },
  {
    q: 'Why is inlining often called an “enabling” optimization?',
    options: [
      { t: 'Because it makes every program smaller', why: 'It usually makes code bigger: the body is copied.' },
      { t: 'Because the call instruction is the slowest instruction there is', why: 'A call has a cost, but that is rarely the main reason. The big win is what other passes can do afterwards.' },
      { t: 'Because it must run before parsing', why: 'Inlining runs on the IR, long after parsing.' },
      { t: 'Because once caller and callee are one piece of code, constant propagation, DCE and other analyses can work across the old boundary', correct: true, why: 'In `area(s, 5) + 1` the whole thing folds to `11` only after inlining.' },
    ],
  },
  {
    q: 'In a call graph, what does a cycle `f → g → f` tell an inliner?',
    options: [
      { t: '`f` and `g` are mutually recursive, so inlining them into each other can’t be done completely', correct: true, why: 'Each copy brings another call along the cycle. Inliners limit depth or refuse.' },
      { t: '`f` and `g` are dead code', why: 'A cycle says nothing about whether anything calls them from outside.' },
      { t: '`f` and `g` must be inlined first', why: 'Bottom-up inlining starts with leaves, and functions on a cycle have no bottom.' },
    ],
  },
  {
    q: 'What did the V8 team report about inlining and the Octane benchmark?',
    options: [
      { t: 'V8 had stopped inlining because of Octane', why: 'They didn’t stop inlining; V8 release notes describe TurboFan inlining things like `forEach`.' },
      { t: 'Octane couldn’t measure inlining at all', why: 'The opposite: it rewarded aggressive inlining.' },
      { t: 'Octane encouraged aggressive inlining, and inlining tuned to it caused real-world regressions through compile time and memory', correct: true, why: 'That is from the “Retiring Octane” post: a benchmark can push heuristics in a direction that hurts real code.' },
      { t: 'Inlining made Octane slower', why: 'The post says the inlining helped Octane scores; the regressions were in real-world use.' },
    ],
  },
  {
    q: 'Which use of `total` would stop Viscosity treating it as a known function?',
    options: [
      { t: 'Calling `total(ps)` twice', why: 'Two direct calls, both passing `ps`, are fine.' },
      { t: 'Passing it as a callback: `[1].map(total)`', correct: true, why: 'Now `total` may be called from inside `map`, at call sites Viscosity can’t see. In the engine, that makes the collection “passed to a function call”.' },
      { t: 'Declaring it with `function total(xs) { ... }`', why: 'That is exactly what a known function looks like.' },
      { t: 'Using a `for` loop inside it', why: 'What the body contains doesn’t affect whether the function is known.' },
    ],
  },
  {
    q: '`total(xs)` is called as `total(a)` and `total(b)`, with two different arrays. What does Viscosity do?',
    options: [
      { t: 'Inlines `total` twice, once for each array', why: 'Viscosity doesn’t inline. That would be one way to handle this, but it isn’t what the engine does.' },
      { t: 'Transforms both arrays and makes `total` handle either layout', why: 'It doesn’t generate code that works on two layouts. It needs `xs` to be exactly one collection.' },
      { t: 'Keeps both `a` and `b` as arrays of objects: `xs` could be either one', correct: true, why: 'The explain output says “passed to total(), which is also called with other values”.' },
    ],
  },
];
