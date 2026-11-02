// Chapter 221 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ipa-what': {
    q: 'What does an interprocedural analysis do that an intraprocedural one cannot?',
    a: 'It follows facts across calls (into parameters, back out of returns) instead of assuming the worst at every call.',
  },
  'call-as-copy': {
    q: 'For points-to purposes, what two copies is the call `r = f(x)`?',
    a: 'The argument x is copied into f’s parameter, and f’s return value is copied into r.',
  },
  'cg-needs-pts': {
    q: 'Why must a JavaScript analysis build the call graph and the points-to sets together?',
    a: 'A callee is a value: the targets of `g(x)` are the function objects in pts(g), which the points-to analysis is still computing.',
  },
  unrealizable: {
    q: 'What impossible path does a context-insensitive analysis follow through `id`?',
    a: 'In at one call site and out to a different caller’s result; a real call always returns to where it came from.',
  },
  'call-string': {
    q: 'In a call-string context, what labels a function’s facts?',
    a: 'The chain of call sites that led to this call, usually the last k of them.',
  },
  'k-limit': {
    q: 'Why does `wrap(q) { return id(q); }` defeat a 1-call-site analysis of `id`?',
    a: 'Every call to id now comes from the one site inside wrap, so with k = 1 all callers of wrap share one context again.',
  },
  'object-sens': {
    q: 'What is the context in an object-sensitive analysis?',
    a: 'The allocation site of the receiver object (the object the method is called on), not the call site.',
  },
  cloning: {
    q: 'How can context sensitivity be pictured as cloning?',
    a: 'Copy each function once per context, then run a context-insensitive analysis on the larger program.',
  },
};

export const examples = {
  wrapper: {
    title: 'Two calls through a wrapper',
    code: `function id(p) { return p; }
function wrap(q) { return id(q); }
const a = wrap({ n: 1 });
const b = wrap({ n: 2 });
a.n = 10;
console.log(b.n); // still 2
console.log(a === b); // false`,
  },
};

export const exercises = {
  contexts: {
    title: 'k call sites of context',
    prompt:
      'Functions take one parameter. `fns` maps a name to its body: `[\'param\']` (returns its parameter), `[\'new\', site]` (returns a fresh object made at `site`) or `[\'call\', g, site]` (returns `g(param)`, called at `site`). `calls` lists top-level calls `[v, f, o, s]`: `v = f(new object at site o)`, at call site `s`. No function calls itself. Write `analyze(fns, calls, k)` returning, for each `v`, its sorted points-to set, using contexts of the last `k` call sites (`k = 0` is context-insensitive).',
    starter: `function analyze(fns, calls, k) {
  // your code here
  return {};
}

const fns = { id: ['param'] };
console.log(analyze(fns, [
  ['a', 'id', 'o1', 's1'],
  ['b', 'id', 'o2', 's2'],
], 1)); // a: ['o1'], b: ['o2']`,
    solution: `function analyze(fns, calls, k) {
  const pts = new Map();
  const get = (key) => {
    if (!pts.has(key)) {
      pts.set(key, new Set());
    }
    return pts.get(key);
  };
  let changed = true;
  const add = (key, o) => {
    const t = get(key);
    const n = t.size;
    t.add(o);
    if (t.size !== n) changed = true;
  };
  const flow = (from, to) => {
    for (const o of get(from)) {
      add(to, o);
    }
  };
  const visit = (f, s, ctx, arg) => {
    const c = [s, ...ctx].slice(0, k);
    const at = f + '@' + c.join(',');
    flow(arg, at + ':p');
    const body = fns[f];
    if (body[0] === 'param') {
      flow(at + ':p', at + ':r');
    } else if (body[0] === 'new') {
      add(at + ':r', body[1]);
    } else {
      const [, g, t] = body;
      const p = at + ':p';
      const r = visit(g, t, c, p);
      flow(r, at + ':r');
    }
    return at + ':r';
  };
  while (changed) {
    changed = false;
    for (const [v, f, o, s] of calls) {
      const arg = 'arg@' + s;
      add(arg, o);
      flow(visit(f, s, [], arg), v);
    }
  }
  const out = {};
  for (const [v] of calls) {
    out[v] = [...get(v)].sort();
  }
  return out;
}`,
    tests: `const fns = { id: ['param'], wrap: ['call', 'id', 's3'], mk: ['new', 'om'] };
const viaId = [['a', 'id', 'o1', 's1'], ['b', 'id', 'o2', 's2']];
const viaWrap = [['a', 'wrap', 'o1', 's1'], ['b', 'wrap', 'o2', 's2']];
test('k = 0 merges the two callers of id', () => {
  expect(analyze(fns, viaId, 0)).toEqual({ a: ['o1', 'o2'], b: ['o1', 'o2'] });
});
test('k = 1 keeps them apart', () => {
  expect(analyze(fns, viaId, 1)).toEqual({ a: ['o1'], b: ['o2'] });
});
test('a wrapper defeats k = 1', () => {
  expect(analyze(fns, viaWrap, 1)).toEqual({ a: ['o1', 'o2'], b: ['o1', 'o2'] });
});
test('k = 2 sees through the wrapper', () => {
  expect(analyze(fns, viaWrap, 2)).toEqual({ a: ['o1'], b: ['o2'] });
});
test('a fresh object does not depend on context', () => {
  const calls = [['a', 'mk', 'o1', 's1'], ['b', 'mk', 'o2', 's2']];
  expect(analyze(fns, calls, 0)).toEqual({ a: ['om'], b: ['om'] });
});`,
    hints: [
      'Name every set with a string key: `\'id@s1:p\'` for id’s parameter in context [s1], `\'id@s1:r\'` for its return value. With k = 0 the context part is empty, so every call shares `\'id@:p\'`.',
      'Write `visit(f, s, ctx, arg)`: build the callee context `[s, ...ctx].slice(0, k)`, flow the argument’s set into the parameter, handle the body (for `call`, visit `g` from inside, in the new context), and return the key of the return value’s set.',
      'Sets can still grow after a caller has read them (the second call to id adds to the shared return). Wrap the loop over `calls` in `while (changed)` and note growth inside one `add` helper.',
    ],
    walkthrough: `**How to think about it.** Everything here is Andersen's copy rule plus one new idea: the *name* of a set includes a context. A call is two copies (argument to parameter, return to result), so if we give "id's parameter in context c" its own key, the same flow helper handles every case, and choosing \`k\` simply decides how many call sites go into that key. With \`k = 0\` the context is empty and every call to \`id\` shares one parameter and one return, which is exactly the single shelf from the chapter.

**The solution, line by line.**

- \`pts\`, \`get\` and \`add\` are the familiar map of sets; \`add\` sets \`changed\` whenever a set really grows, so we know when to stop.
- \`flow(from, to)\` copies one set into another: the inclusion rule.
- \`visit(f, s, ctx, arg)\` analyses a call to \`f\` from site \`s\`, made while the caller ran in context \`ctx\`, whose argument is in the set \`arg\`.
- \`const c = [s, ...ctx].slice(0, k);\` builds the callee's context: this site in front of the caller's chain, cut to \`k\` sites. That one line is the whole of call-string sensitivity.
- \`const at = f + '@' + c.join(',');\` names this function-in-context, so \`at + ':p'\` is its parameter and \`at + ':r'\` its return value.
- \`flow(arg, at + ':p');\` is the first copy: argument into parameter.
- For \`['param']\`, the return value is the parameter: \`flow(at + ':p', at + ':r')\`.
- For \`['new', site]\`, the return value is that fresh site.
- For \`['call', g, t]\`, the body calls \`g\` at site \`t\` with our parameter, *from our context \`c\`*, so \`const r = visit(g, t, c, p);\` analyses that inner call, and \`flow(r, at + ':r')\` makes its return ours.
- \`return at + ':r';\` gives the caller the key of the return set.
- The \`while (changed)\` loop runs over the top-level calls: each puts its fresh object in an argument set, visits, and does the second copy, \`flow(..., v)\`, return into result.
- Finally each result variable's set is sorted.

**Why the loop is needed.** With \`k = 0\`, the first call reads \`id@:r\` when it holds only \`o1\`; the second call then adds \`o2\` to that very set. Without another round, \`a\` would wrongly stay at \`['o1']\` (wrongly *precise*, which for an analysis is the dangerous direction).

**Common wrong attempts.**

- One pass without \`while (changed)\`: \`a\` misses \`o2\` when \`k = 0\`.
- Using only the current site as the context (\`[s]\` instead of \`[s, ...ctx].slice(0, k)\`): then \`id\` is always analysed in context \`[s3]\` inside \`wrap\`, even with \`k = 2\`, and the last-but-one test fails. The caller's context has to be carried along.`,
    wrong: [
      {
        code: `function analyze(fns, calls, k) {
  const pts = new Map();
  const get = (key) => {
    if (!pts.has(key)) {
      pts.set(key, new Set());
    }
    return pts.get(key);
  };
  const flow = (from, to) => {
    for (const o of get(from)) {
      get(to).add(o);
    }
  };
  const visit = (f, s, ctx, arg) => {
    const c = [s, ...ctx].slice(0, k);
    const at = f + '@' + c.join(',');
    flow(arg, at + ':p');
    const body = fns[f];
    if (body[0] === 'param') {
      flow(at + ':p', at + ':r');
    } else if (body[0] === 'new') {
      get(at + ':r').add(body[1]);
    } else {
      const [, g, t] = body;
      const p = at + ':p';
      const r = visit(g, t, c, p);
      flow(r, at + ':r');
    }
    return at + ':r';
  };
  for (const [v, f, o, s] of calls) {
    const arg = 'arg@' + s;
    get(arg).add(o);
    flow(visit(f, s, [], arg), v);
  }
  const out = {};
  for (const [v] of calls) {
    out[v] = [...get(v)].sort();
  }
  return out;
}`,
        why: 'One pass only. With k = 0 the first call reads id’s shared return set before the second call adds o2 to it, so `a` misses o2.',
      },
      {
        code: `function analyze(fns, calls, k) {
  const pts = new Map();
  const get = (key) => {
    if (!pts.has(key)) {
      pts.set(key, new Set());
    }
    return pts.get(key);
  };
  let changed = true;
  const add = (key, o) => {
    const t = get(key);
    const n = t.size;
    t.add(o);
    if (t.size !== n) changed = true;
  };
  const flow = (from, to) => {
    for (const o of get(from)) {
      add(to, o);
    }
  };
  const visit = (f, s, arg) => {
    const c = [s].slice(0, k);
    const at = f + '@' + c.join(',');
    flow(arg, at + ':p');
    const body = fns[f];
    if (body[0] === 'param') {
      flow(at + ':p', at + ':r');
    } else if (body[0] === 'new') {
      add(at + ':r', body[1]);
    } else {
      const [, g, t] = body;
      const p = at + ':p';
      const r = visit(g, t, p);
      flow(r, at + ':r');
    }
    return at + ':r';
  };
  while (changed) {
    changed = false;
    for (const [v, f, o, s] of calls) {
      const arg = 'arg@' + s;
      add(arg, o);
      flow(visit(f, s, arg), v);
    }
  }
  const out = {};
  for (const [v] of calls) {
    out[v] = [...get(v)].sort();
  }
  return out;
}`,
        why: 'The context forgets the caller’s chain: id inside wrap is always just [s3], so even k = 2 merges the two calls to wrap.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'An intraprocedural analysis meets `const r = f(x);`. What must it assume?',
    options: [
      { t: 'That `r` is a copy of `x`', why: 'It cannot know that without looking inside `f`.' },
      { t: 'That `f` may store `x` anywhere and `r` may point at anything', correct: true, why: 'Without crossing the call, the worst case is the only safe one.' },
      { t: 'That `f` has no effect', why: 'That would be unsound: `f` might store `x` in a global.' },
    ],
  },
  {
    q: 'With `id(p) { return p; }` called as `a = id(o1)` and `b = id(o2)`, what does a context-insensitive points-to analysis give for `a`?',
    options: [
      { t: '`{o1}`', why: 'That is the precise answer, but with one shared parameter, `p` holds both objects.' },
      { t: '`{}`', why: 'The return copies something into `a`.' },
      { t: '`{o1, o2}`', correct: true, why: 'Both calls copy into the one `p`, and the return copies all of `p` back to every caller.' },
      { t: 'unknown: the call is a closed door', why: 'An interprocedural analysis follows the call; it just merges the callers.' },
    ],
  },
  {
    q: 'Why do analyses keep only the last k call sites of context, rather than the whole chain?',
    options: [
      { t: 'Recursion makes chains of call sites unboundedly long, so the set of contexts must be cut to stay finite', correct: true, why: 'With k sites there are finitely many contexts, so the fixpoint is still reached.' },
      { t: 'Because older call sites never matter', why: 'They can matter: the wrapper example needs two sites.' },
      { t: 'Because JavaScript has at most k nested calls', why: 'JavaScript allows deep call chains (up to the stack limit).' },
    ],
  },
  {
    q: '`put(b, v)` calls `b.set(v)` at one site; `put` is called with two different boxes. Which context separates the two calls to `set`?',
    options: [
      { t: '1 call site', why: 'Every call to `set` comes from the same site inside `put`.' },
      { t: 'Context-insensitive', why: 'That merges everything.' },
      { t: 'The function’s name', why: 'Every call is to the same function, `set`.' },
      { t: 'Object sensitivity: the receiver’s allocation site', correct: true, why: 'The receivers are two different boxes, so `set` gets two contexts.' },
    ],
  },
  {
    q: 'Why can’t a JavaScript points-to analysis first build the call graph and then compute points-to sets?',
    options: [
      { t: 'Because calls are rare in JavaScript', why: 'They are everywhere.' },
      { t: 'It can; the order does not matter', why: 'The call graph depends on the sets, so building it first would have to guess.' },
      { t: 'Because callees are values: the targets of `g(x)` are whatever function objects pts(g) holds', correct: true, why: 'Each new set can add call edges, and each edge adds copies, so both grow together to one fixpoint.' },
    ],
  },
];
