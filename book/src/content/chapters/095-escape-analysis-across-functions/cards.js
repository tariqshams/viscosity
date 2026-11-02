// Chapter 180 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 95, 95, 95, 95.

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
  'summary-what': {
    q: 'What does a function summary record?',
    a: 'What the function does with what flows in (parameters returned, stored, passed on; fields read and written), computed once.',
  },
  'summary-precise': {
    q: 'Why does applying `id`’s summary give `a = id(o1)` the answer {o1}, not {o1, o2}?',
    a: 'The summary is a rule (“result gets the parameter’s set”) applied to each call’s own argument, so callers never share facts.',
  },
  'go-tags': {
    q: 'What does Go’s compiler call its per-function escape summaries, and where are they used?',
    a: '“Parameter tags”; they are used at static call sites to decide whether the arguments escape.',
  },
  'summary-recursion': {
    q: 'How is a recursive function summarised, when its summary depends on itself?',
    a: 'Start every summary at “does nothing”, recompute them all, and repeat until none changes (a fixpoint).',
  },
  'datalog-parts': {
    q: 'In Datalog, what is a fact and what is a rule?',
    a: 'A fact is a row of a relation, like `Assign(a, c)`; a rule `head :- body` derives new rows when its body holds.',
  },
  'datalog-join': {
    q: 'In `Pts(t, h) :- Assign(f, t), Pts(f, h).`, what does the shared variable `f` do?',
    a: 'It joins the two tables: an Assign row and a Pts row combine only when they agree on f.',
  },
  'datalog-stops': {
    q: 'Why is Datalog evaluation guaranteed to stop?',
    a: 'Rules never invent new values, so only finitely many facts are possible, and each round must add one or stop.',
  },
  'datalog-why': {
    q: 'What does writing an analysis in Datalog save the analysis writer?',
    a: 'Writing and debugging the fixpoint loops and joins by hand: the engine evaluates the rules, so the rules are the whole analysis.',
  },
  'ea-what': {
    q: 'What question does escape analysis answer?',
    a: 'Can a reference to an object made here be used outside this region of code (after it ends, or by code outside it)?',
  },
  'ea-region': {
    q: '“Escapes” is always relative to what?',
    a: 'A region of code: a function, a loop, or a thread. Leaving that region is escaping.',
  },
  'ea-conservative': {
    q: 'When escape analysis cannot tell whether an object escapes, what must it assume, and why?',
    a: 'That it escapes. Wrongly saying “stays inside” could free or take apart an object someone still uses; wrongly saying “escapes” only costs speed.',
  },
  'cg-nodes': {
    q: 'What are the three kinds of node in a connection graph?',
    a: 'Objects (one per allocation site), local variables, and fields of objects.',
  },
  'deferred-edge': {
    q: 'What does a deferred edge x ⇢ y mean, and what happens to it after the graph is built?',
    a: '“x holds whatever y holds”; it is bypassed, so x points directly at y’s objects.',
  },
  'three-states': {
    q: 'Name the three escape states, from most local to least.',
    a: 'NoEscape, ArgEscape, GlobalEscape.',
  },
  'reach-escape': {
    q: '`p.next = q`, and q’s object escapes. Does p’s object escape?',
    a: 'No. Pointing at an escaping object is harmless; an object escapes only if something escaping can reach it.',
  },
  'ea-uses': {
    q: 'What can a compiler do with a NoEscape object, and with one that does not escape its thread?',
    a: 'NoEscape: allocate it on the stack or replace it with its fields (scalars). Thread-local: remove its locks.',
  },
  'ea67-puzzle': {
    q: 'In this book’s benchmark run, why didn’t struct of arrays lose on `get-objects`, even though it builds an object per element?',
    a: 'V8 inlined the small consumer function and then removed the temporary object, so no allocation was left.',
  },
  'ea67-inline-first': {
    q: 'Why does V8 usually need to inline `consume(p)` before it can remove `p`?',
    a: 'Before inlining, `p` is passed to a call the compiler can’t see into, so as far as it knows, `p` escapes.',
  },
  'scalar-what': {
    q: 'What is *scalar replacement*?',
    a: 'Replacing an object that doesn’t escape with its fields as separate local values, so field reads become plain values.',
  },
  'sink-what': {
    q: 'What is *allocation sinking*?',
    a: 'Moving an allocation to the only places that need a real object, such as a deopt exit, and removing it from the fast path.',
  },
  'ea67-escaped': {
    q: 'According to V8’s source, an object counts as escaped when what happens to it?',
    a: 'It reaches memory the analysis doesn’t track, or it is used by an operation that needs it to really exist.',
  },
  'ea67-deopt': {
    q: 'A guard fails in a loop whose temporary object was removed. How does the interpreter get its object?',
    a: 'The deopt frame state describes the object by its field values, and the deoptimiser builds (materialises) it then.',
  },
  'ea67-materialize': {
    q: 'Why can’t V8 remove the allocations in the `materialize` suite?',
    a: 'Each object is stored into an array that outlives the loop: it escapes, and its identity can be observed.',
  },
  'ea67-viscosity': {
    q: 'Why must Viscosity be stricter than V8 about escapes?',
    a: 'It runs ahead of time, without deoptimisation to fall back on, so it must prove safety on the code as written.',
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
  pathRounds: {
    title: 'Two path rules, run by hand',
    code: `// Path(x, y) :- Edge(x, y).
// Path(x,z) :- Edge(x,y), Path(y,z).
const edge = [[1, 2], [2, 3], [3, 4]];
const path = new Set();
const add = (x, y) => {
  const k = x + '>' + y;
  if (path.has(k)) return false;
  path.add(k);
  return true;
};
let round = 0;
let grew = true;
while (grew) {
  round++;
  const old = [...path];
  grew = false;
  for (const [x, y] of edge) {
    if (add(x, y)) grew = true;
    for (const p of old) {
      const [y2, z] = p.split('>');
      if (String(y) !== y2) continue;
      if (add(x, z)) grew = true;
    }
  }
  const all = [...path].join(' ');
  console.log(round, all);
}`,
  },
  outlives: {
    title: 'An object that outlives its call',
    code: `let saved = null;
function make(x) {
  const p = { x };
  saved = p;      // escapes: a global
  return p.x * 2; // make's frame ends
}
make(1);
make(2);
console.log(saved.x); // 2: still alive
saved.x = 5;
console.log(saved.x);`,
  },
};

export const exercises = {
  contexts: {
    title: 'k call sites of context',
    prompt: 'Functions take one parameter. `fns` maps a name to its body: `[\'param\']` (returns its parameter), `[\'new\', site]` (returns a fresh object made at `site`) or `[\'call\', g, site]` (returns `g(param)`, called at `site`). `calls` lists top-level calls `[v, f, o, s]`: `v = f(new object at site o)`, at call site `s`. No function calls itself. Write `analyze(fns, calls, k)` returning, for each `v`, its sorted points-to set, using contexts of the last `k` call sites (`k = 0` is context-insensitive).',
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
  tinyDatalog: {
    title: 'A Datalog engine in forty lines',
    prompt: 'A fact is an array like `[\'New\', \'a\', \'o1\']`. A rule is `{ head, body }`: `head` is one atom and `body` a list of atoms, where strings starting with `?` are variables, like `{ head: [\'Pts\', \'?v\', \'?h\'], body: [[\'New\', \'?v\', \'?h\']] }`. Write `solve(facts, rules)` that derives every fact the rules allow (repeat until nothing new) and returns all facts, input and derived, as sorted strings like `\'Pts(a,o1)\'`.',
    starter: `function solve(facts, rules) {
  // your code here
  return [];
}

const out = solve(
  [['New', 'a', 'o1']],
  [{ head: ['Pts', '?v', '?h'],
     body: [['New', '?v', '?h']] }]);
console.log(out); // has 'Pts(a,o1)'`,
    solution: `function solve(facts, rules) {
  const known = new Map();
  const key = (f) => f[0] + '(' +
    f.slice(1).join(',') + ')';
  for (const f of facts) {
    known.set(key(f), f);
  }
  const match = (at, fact, env) => {
    if (at[0] !== fact[0]) return null;
    const n = at.length;
    if (n !== fact.length) return null;
    const e = { ...env };
    for (let i = 1; i < n; i++) {
      const a = at[i];
      if (!a.startsWith('?')) {
        if (a !== fact[i]) return null;
      } else if (a in e) {
        if (e[a] !== fact[i]) {
          return null;
        }
      } else {
        e[a] = fact[i];
      }
    }
    return e;
  };
  const extend = (envs, at) => {
    const next = [];
    for (const env of envs) {
      for (const f of known.values()) {
        const e = match(at, f, env);
        if (e) next.push(e);
      }
    }
    return next;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of rules) {
      let envs = [{}];
      for (const at of r.body) {
        envs = extend(envs, at);
      }
      for (const env of envs) {
        const h = r.head.map((x, i) =>
          i > 0 && x.startsWith('?')
            ? env[x] : x);
        if (!known.has(key(h))) {
          known.set(key(h), h);
          changed = true;
        }
      }
    }
  }
  return [...known.keys()].sort();
}`,
    tests: `const pts = [
  { head: ['Pts', '?v', '?h'], body: [['New', '?v', '?h']] },
  { head: ['Pts', '?t', '?h'], body: [['Assign', '?f', '?t'], ['Pts', '?f', '?h']] },
];
const only = (xs, p) => xs.filter((s) => s.startsWith(p));
test('one rule, one fact', () => {
  expect(only(solve([['New', 'a', 'o1']], pts), 'Pts')).toEqual(['Pts(a,o1)']);
});
test('input facts are kept', () => {
  expect(solve([['New', 'a', 'o1']], pts)).toEqual(['New(a,o1)', 'Pts(a,o1)']);
});
test('a join on the shared variable', () => {
  const facts = [['New', 'a', 'o1'], ['New', 'b', 'o2'], ['Assign', 'a', 'c']];
  expect(only(solve(facts, pts), 'Pts')).toEqual(['Pts(a,o1)', 'Pts(b,o2)', 'Pts(c,o1)']);
});
test('chains need several rounds', () => {
  const facts = [['Assign', 'c', 'd'], ['Assign', 'b', 'c'], ['Assign', 'a', 'b'], ['New', 'a', 'o1']];
  expect(only(solve(facts, pts), 'Pts(d')).toEqual(['Pts(d,o1)']);
});
test('cycles stop', () => {
  const facts = [['Assign', 'a', 'b'], ['Assign', 'b', 'a'], ['New', 'a', 'o1']];
  expect(only(solve(facts, pts), 'Pts')).toEqual(['Pts(a,o1)', 'Pts(b,o1)']);
});
test('a recursive rule on paths', () => {
  const rules = [
    { head: ['Path', '?x', '?y'], body: [['Edge', '?x', '?y']] },
    { head: ['Path', '?x', '?z'], body: [['Edge', '?x', '?y'], ['Path', '?y', '?z']] },
  ];
  const out = solve([['Edge', '1', '2'], ['Edge', '2', '3']], rules);
  expect(only(out, 'Path')).toEqual(['Path(1,2)', 'Path(1,3)', 'Path(2,3)']);
});`,
    hints: [
      'Keep every known fact in a `Map` from its string form (`\'Pts(a,o1)\'`) to the array, so “is this new?” is one lookup. Start it with the input facts.',
      'Write `match(at, fact, env)` for an atom `at`: it returns a new set of variable bindings if the fact fits the atom under the bindings `env` already has, or `null`. A constant must equal the fact’s value; a variable already bound must equal it too; an unbound variable gets bound.',
      'For each rule, start with one empty binding `[{}]` and, atom by atom, replace the list with every way of extending each binding by a matching fact. Fill the head from each final binding, add it if new, and repeat all the rules while anything was added.',
    ],
    walkthrough: `**How to think about it.** A rule says "for every way of choosing facts that fit the body, the head is a fact". So evaluating one rule means enumerating those ways, and each way is a *binding*: which value each variable stands for. Build the bindings one body atom at a time: start with the empty binding, and for each atom, extend every binding you have by every known fact that fits the atom without contradicting it. Whatever bindings survive all the atoms each give one head fact. Then the fixpoint: repeat all the rules until a round adds nothing. It stops because the heads only use values that already appear in facts, so there are finitely many possible facts.

**The solution, line by line.**

- \`const known = new Map();\` holds every fact, keyed by a string such as \`Pts(a,o1)\`; \`key(f)\` builds that string. Starting it with the input facts means they appear in the output too.
- \`match(at, fact, env)\` (\`at\` is the atom) first checks the relation name and the number of columns; a \`New\` atom can only match a \`New\` fact of the same width.
- \`const e = { ...env };\` copies the bindings (with the spread syntax from chapter 8), so a failed match never spoils the binding we started from.
- In the loop over columns: a constant (no \`?\`) must equal the fact's value; a variable already in \`e\` must equal it too (this is what makes a shared variable a *join*); a new variable is bound to the fact's value.
- \`return e;\` : the fact fits, under these bindings.
- \`while (changed) {\` : the fixpoint loop.
- \`let envs = [{}];\` : one way so far, binding nothing.
- \`extend(envs, at)\` returns every extension of every binding in \`envs\` by every fact that matches the atom \`at\`. Applying it to each body atom in turn leaves \`envs\` holding every complete way to satisfy the body.
- \`r.head.map(...)\` fills in the head: column 0 is the relation name, and any \`?\` variable is replaced by its bound value.
- \`if (!known.has(key(h))) { ...; changed = true; }\` adds a genuinely new fact and asks for another round.
- Finally all keys are returned sorted.

**Common wrong attempts.**

- Running the rules once: a chain \`a → b → c → d\` needs one round per step, so \`Pts(d,o1)\` is missed.
- Binding a variable without checking an earlier binding (always \`e[a] = fact[i]\`): then \`Assign(?f, ?t), Pts(?f, ?h)\` pairs *every* Assign with *every* Pts, and \`c\` gets objects it was never assigned. The join is the whole point of shared variables.
- Matching against facts added during the same rule's enumeration is not wrong (it only speeds things up); what matters is that the outer loop keeps going until nothing is new. This is the simple "naive" evaluation; real engines only join against facts that are new since the last round ("semi-naive"), which gives the same answer much faster.`,
    wrong: [
      {
        code: `function solve(facts, rules) {
  const known = new Map();
  const key = (f) => f[0] + '(' +
    f.slice(1).join(',') + ')';
  for (const f of facts) {
    known.set(key(f), f);
  }
  const match = (at, fact, env) => {
    if (at[0] !== fact[0]) return null;
    const e = { ...env };
    const n = at.length;
    for (let i = 1; i < n; i++) {
      const a = at[i];
      if (!a.startsWith('?')) {
        if (a !== fact[i]) return null;
      } else {
        e[a] = fact[i];
      }
    }
    return e;
  };
  for (const r of rules) {
    let envs = [{}];
    for (const at of r.body) {
      const next = [];
      const fs = [...known.values()];
      for (const env of envs) {
        for (const f of fs) {
          const e = match(at, f, env);
          if (e) next.push(e);
        }
      }
      envs = next;
    }
    for (const env of envs) {
      const h = r.head.map((x, i) =>
        i > 0 && x.startsWith('?')
          ? env[x] : x);
      known.set(key(h), h);
    }
  }
  return [...known.keys()].sort();
}`,
        why: 'Two mistakes: a variable is rebound without checking its earlier value, so joins become cross products, and the rules run only once, so chains are not followed to the end.',
      },
    ],
  },
  paramTags: {
    optional: true,
    title: 'Escape summaries for functions',
    prompt: 'Each function has one parameter `p` and a list of statements about it: `[\'store\']` (p is stored in a global), `[\'return\']` (p is returned), `[\'call\', g]` (p is passed to g, result ignored) or `[\'retcall\', g]` (returns `g(p)`). Functions may call each other and themselves. Write `paramTags(fns)` returning, for each function, `{ escapes, returned }`: whether p may end up in a global, and whether p may be returned.',
    starter: `function paramTags(fns) {
  // your code here
  return {};
}

console.log(paramTags({
  keep: [['store']],
  pass: [['call', 'keep']],
}).pass); // { escapes: true, ... }`,
    solution: `function paramTags(fns) {
  const tag = {};
  for (const f in fns) {
    tag[f] = {
      escapes: false, returned: false };
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const f in fns) {
      let esc = false;
      let ret = false;
      for (const [op, g] of fns[f]) {
        if (op === 'store') esc = true;
        if (op === 'return') ret = true;
        const calls = op === 'call' ||
          op === 'retcall';
        if (calls && tag[g].escapes) {
          esc = true;
        }
        if (op === 'retcall' &&
            tag[g].returned) ret = true;
      }
      const t = tag[f];
      if (esc !== t.escapes ||
          ret !== t.returned) {
        tag[f] = {
          escapes: esc, returned: ret };
        changed = true;
      }
    }
  }
  return tag;
}`,
    tests: `test('direct store and return', () => {
  expect(paramTags({ keep: [['store']], id: [['return']] })).toEqual({
    keep: { escapes: true, returned: false },
    id: { escapes: false, returned: true },
  });
});
test('a summary is used at a call', () => {
  const t = paramTags({ keep: [['store']], pass: [['call', 'keep']] });
  expect(t.pass).toEqual({ escapes: true, returned: false });
});
test('returning a call that returns p', () => {
  const t = paramTags({ id: [['return']], wrap: [['retcall', 'id']] });
  expect(t.wrap).toEqual({ escapes: false, returned: true });
});
test('order of functions does not matter', () => {
  const t = paramTags({ a: [['call', 'b']], b: [['call', 'c']], c: [['store']] });
  expect(t.a.escapes).toBe(true);
});
test('recursion reaches a fixpoint', () => {
  const t = paramTags({ loop: [['call', 'loop'], ['retcall', 'loop']] });
  expect(t.loop).toEqual({ escapes: false, returned: false });
});`,
    hints: [
      'Start every function’s tag at `{ escapes: false, returned: false }`: the optimistic “does nothing” summary.',
      'Recompute each function’s tag from its statements, reading the *current* tags of the functions it calls.',
      'Repeat the whole recomputation until no tag changes. A function that only calls itself never becomes true.',
    ],
    walkthrough: `**How to think about it.** This is the functional approach in miniature, and it is how Go's parameter tags work in spirit: each function gets a summary of what happens to its parameter, and a call reads the callee's summary instead of its body. A function's summary depends on its callees' summaries, perhaps including its own, so we start every summary at the most optimistic value ("does nothing with p") and recompute until nothing changes. Starting optimistic and only ever moving towards "escapes" or "returned" gives the least fixpoint, the most precise safe answer.

**The solution, line by line.**

- The first loop gives every function the "does nothing" tag.
- \`while (changed)\` repeats rounds until a round changes no tag.
- For each function, \`esc\` and \`ret\` are recomputed from scratch from its statements.
- \`store\` makes p escape; \`return\` makes p returned.
- For \`call\` and \`retcall\`, p escapes if the callee's current tag says its parameter escapes.
- For \`retcall\` only, p is returned if the callee returns its parameter (we return what it returns); a plain \`call\` ignores the result.
- If the new tag differs from the old, it is stored and another round is requested.

**Common wrong attempts.** Computing each function once, in order, fails when a function calls one defined after it (the fourth test). Starting pessimistic (everything \`true\`) and never lowering gives a safe but useless answer. Recursing into callees without memory loops forever on \`loop\`.`,
    wrong: [
      {
        code: `function paramTags(fns) {
  const tag = {};
  for (const f in fns) {
    tag[f] = {
      escapes: false, returned: false };
  }
  for (const f in fns) {
    for (const [op, g] of fns[f]) {
      if (op === 'store') {
        tag[f].escapes = true;
      }
      if (op === 'return') {
        tag[f].returned = true;
      }
      if (op === 'call' &&
          tag[g].escapes) {
        tag[f].escapes = true;
      }
      if (op === 'retcall' &&
          tag[g].returned) {
        tag[f].returned = true;
      }
    }
  }
  return tag;
}`,
        why: 'One pass in order: `a` reads `b`’s tag before `b` has read `c`’s, so `a` wrongly does not escape. Summaries need a fixpoint.',
      },
    ],
  },
  escapeStates: {
    title: 'Colour a connection graph',
    prompt: 'A connection graph with its deferred edges already bypassed is a list of `edges`, each `[from, to]`. `start` gives the starting state of some nodes: `\'global\'` or `\'arg\'`. Every other node starts as `\'no\'` (NoEscape). States are ordered `no < arg < global`, and each node’s state spreads along edges to everything it can reach. Write `escapeStates(edges, start)` returning an object with the final state of every node that appears.',
    starter: `function escapeStates(edges, start) {
  // your code here
  return {};
}

console.log(escapeStates(
  [['G', 'o2'], ['p', 'o1']],
  { G: 'global' })); // o2: global`,
    solution: `function escapeStates(edges, start) {
  const rank = { no: 0, arg: 1,
    global: 2 };
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  const work = Object.keys(start);
  while (work.length) {
    const n = work.pop();
    for (const [a, b] of edges) {
      if (a !== n) continue;
      if (rank[st[n]] > rank[st[b]]) {
        st[b] = st[n];
        work.push(b);
      }
    }
  }
  return st;
}`,
    tests: `const graph = [['p', 'o1'], ['q', 'o2'], ['r', 'o3'], ['o1', 'next'], ['next', 'o2'], ['arg', 'o3'], ['G', 'o2']];
test('the graph from the stepper', () => {
  const s = escapeStates(graph, { G: 'global', arg: 'arg' });
  expect([s.o1, s.o2, s.o3]).toEqual(['no', 'global', 'arg']);
});
test('pointing out does not escape', () => {
  const s = escapeStates([['o1', 'f'], ['f', 'o2'], ['G', 'o2']], { G: 'global' });
  expect(s.o1).toBe('no');
  expect(s.o2).toBe('global');
});
test('states spread along chains', () => {
  const s = escapeStates([['G', 'a'], ['a', 'b'], ['b', 'c']], { G: 'global' });
  expect(s.c).toBe('global');
});
test('the larger state wins', () => {
  const s = escapeStates([['arg', 'o'], ['G', 'o']], { arg: 'arg', G: 'global' });
  expect(s.o).toBe('global');
});
test('cycles stop, and unreached nodes stay no', () => {
  const s = escapeStates([['arg', 'a'], ['a', 'b'], ['b', 'a'], ['x', 'y']], { arg: 'arg' });
  expect([s.a, s.b, s.y]).toEqual(['arg', 'arg', 'no']);
});`,
    hints: [
      'Give every node that appears in `edges` the state `\'no\'`, then overwrite the ones in `start`.',
      'Use a worklist, starting with the nodes in `start`. Taking a node off the list, look at every edge leaving it.',
      'Give the edge’s target this node’s state if that is larger (rank `no` 0, `arg` 1, `global` 2), and put the target on the worklist, since its own successors may now need raising.',
    ],
    walkthrough: `**How to think about it.** The rule is "an object's state is the largest starting state of anything that can reach it". "Can reach" means following edges any number of steps, so this is a reachability problem, and the tool is the worklist from the dataflow chapters: when a node's state goes up, the nodes it points at may need to go up too, so they go on the list. Each node can only rise twice (no to arg, arg to global), so the loop must end, even with cycles. The direction matters: states flow *along* edges, from whoever holds a reference to what is referenced, never backwards.

**The solution, line by line.**

- \`const rank = { no: 0, arg: 1, global: 2 };\` turns the order of the states into numbers we can compare.
- The loop over \`edges\` gives every node that appears the state \`'no'\`.
- \`Object.assign(st, start);\` then overwrites the starting states, such as \`G: 'global'\`.
- \`const work = Object.keys(start);\` : only these nodes have anything to spread at first.
- \`const n = work.pop();\` takes a node to spread from.
- \`for (const [a, b] of edges) { if (a !== n) continue;\` visits each edge leaving \`n\`.
- \`if (rank[st[n]] > rank[st[b]]) { st[b] = st[n]; work.push(b); }\` raises the target when \`n\`'s state is larger, and schedules the target so its own successors are visited. If the target is already as large, nothing changes, which is exactly what stops cycles.
- \`return st;\`

**Common wrong attempts.**

- Spreading one step only (no worklist): \`G → a → b → c\` would leave \`c\` at \`'no'\`, a wrong "does not escape", the dangerous kind.
- Spreading backwards (from \`b\` to \`a\`): then \`o1\`, which merely *points at* an escaping object, would be marked as escaping. That is safe but needlessly pessimistic: nothing outside can follow \`o1.next\` back to \`o1\`.
- Setting \`st[b] = st[n]\` without comparing would let an \`'arg'\` overwrite a \`'global'\`, depending on the order of the worklist.`,
    wrong: [
      {
        code: `function escapeStates(edges, start) {
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  for (const [a, b] of edges) {
    if (a in start) st[b] = start[a];
  }
  return st;
}`,
        why: 'One step only: an object reached through a chain (G → a → b → c) keeps `\'no\'`, a wrong “does not escape”.',
      },
      {
        code: `function escapeStates(edges, start) {
  const rank = { no: 0, arg: 1,
    global: 2 };
  const st = {};
  for (const [a, b] of edges) {
    st[a] = 'no';
    st[b] = 'no';
  }
  Object.assign(st, start);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of edges) {
      for (const [x, y] of [[a, b],
          [b, a]]) {
        if (rank[st[x]] > rank[st[y]]) {
          st[y] = st[x];
          changed = true;
        }
      }
    }
  }
  return st;
}`,
        why: 'This spreads states both ways along each edge, so an object that only points at an escaping one is marked as escaping too.',
      },
    ],
  },
  scalarReplace: {
    title: 'Scalar-replace a small object',
    prompt: `A tiny IR is a list of instructions:

- \`{ op: 'new', dst, fields }\`: \`dst = { ... }\`, where \`fields\` maps each name to a variable
- \`{ op: 'get', dst, obj, key }\`: \`dst = obj.key\`
- \`{ op: 'set', obj, key, src }\`: \`obj.key = src\`
- \`{ op: 'add', dst, a, b }\`, \`{ op: 'mov', dst, src }\`, \`{ op: 'call', fn, args }\`, \`{ op: 'ret', src }\`

Write \`scalarReplace(code)\`. An object made by \`new\` **escapes** if its variable is ever used as a *value*: a field value in a \`new\`, the \`src\` of a \`set\` or \`mov\`, an argument, an \`add\` operand, or returned. Being the \`obj\` of a \`get\` or \`set\` is fine. For each \`new\` that doesn’t escape, replace it with one \`mov\` per field into \`dst_key\` (in field order), turn its \`get\`s into \`mov\`s from \`obj_key\`, and its \`set\`s into \`mov\`s to \`obj_key\`. Leave everything else as it is, and don’t change the input.`,
    starter: `function scalarReplace(code) {
  // 1. find objects that never escape
  // 2. rewrite new / get / set on them
  return code;
}`,
    solution: `function valueUses(i) {
  switch (i.op) {
    case 'new':
      return Object.values(i.fields);
    case 'set': case 'mov': case 'ret':
      return [i.src];
    case 'add': return [i.a, i.b];
    case 'call': return i.args;
    default: return [];
  }
}

function scalarReplace(code) {
  const escapes = (v) => code.some(
    (i) => valueUses(i).includes(v));
  const virt = new Set();
  for (const i of code) {
    const n = i.op === 'new';
    if (n && !escapes(i.dst)) {
      virt.add(i.dst);
    }
  }
  const out = [];
  for (const i of code) {
    const f = (o, k) => o + '_' + k;
    if (i.op === 'new' &&
        virt.has(i.dst)) {
      for (const k in i.fields) {
        out.push({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] });
      }
    } else if (i.op === 'get' &&
        virt.has(i.obj)) {
      out.push({ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) });
    } else if (i.op === 'set' &&
        virt.has(i.obj)) {
      out.push({ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src });
    } else {
      out.push(i);
    }
  }
  return out;
}`,
    tests: `const N = (dst, fields) =>
  ({ op: 'new', dst, fields });
const G = (dst, obj, key) =>
  ({ op: 'get', dst, obj, key });
const S = (obj, key, src) =>
  ({ op: 'set', obj, key, src });
const M = (dst, src) =>
  ({ op: 'mov', dst, src });
const R = (src) => ({ op: 'ret', src });
test('a non-escaping object vanishes', () => {
  const code = [
    N('p', { x: 'a', y: 'b' }),
    G('t', 'p', 'x'), G('u', 'p', 'y'),
    { op: 'add', dst: 's', a: 't', b: 'u' },
    R('s'),
  ];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), M('p_y', 'b'),
    M('t', 'p_x'), M('u', 'p_y'),
    { op: 'add', dst: 's', a: 't', b: 'u' },
    R('s'),
  ]);
});
test('writes become moves too', () => {
  const code = [N('p', { x: 'a' }),
    S('p', 'x', 'b'), G('t', 'p', 'x'),
    R('t')];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), M('p_x', 'b'),
    M('t', 'p_x'), R('t')]);
});
test('passing it to a call escapes', () => {
  const code = [N('p', { x: 'a' }),
    { op: 'call', fn: 'f', args: ['p'] },
    G('t', 'p', 'x'), R('t')];
  expect(scalarReplace(code)).toEqual(code);
});
test('returning it escapes', () => {
  const code = [N('p', { x: 'a' }), R('p')];
  expect(scalarReplace(code)).toEqual(code);
});
test('storing it somewhere escapes', () => {
  const code = [N('p', { x: 'a' }),
    S('out', 'last', 'p'), R('a')];
  expect(scalarReplace(code)).toEqual(code);
  const nested = [N('p', { x: 'a' }),
    N('q', { inner: 'p' }),
    G('t', 'q', 'inner'), R('t')];
  const r = scalarReplace(nested);
  expect(r[0]).toEqual(N('p', { x: 'a' }));
});
test('each object is judged alone', () => {
  const code = [N('p', { x: 'a' }),
    N('q', { x: 'b' }),
    G('t', 'p', 'x'), R('q')];
  expect(scalarReplace(code)).toEqual([
    M('p_x', 'a'), N('q', { x: 'b' }),
    M('t', 'p_x'), R('q')]);
});
test('the input is left alone', () => {
  const code = [N('p', { x: 'a' }),
    G('t', 'p', 'x'), R('t')];
  const copy = JSON.stringify(code);
  scalarReplace(code);
  expect(JSON.stringify(code)).toBe(copy);
});`,
    hints: [
      'Write `valueUses(i)`: the variables instruction `i` reads *as values*. For `get` that is nothing (its `obj` is fine); for `set` it is only `src`.',
      'An object escapes if any instruction lists it in `valueUses`. Put the `dst` of every `new` that doesn’t escape into a set.',
      'Then build a new array: a virtual `new` becomes one `mov` per field, a `get` or `set` on a virtual object becomes a `mov` from or to `obj + \'_\' + key`, and everything else is copied across.',
    ],
    walkthrough: `**How to think about it.** This is the same two-step move TurboFan makes, on a toy IR (a list of simple instructions, like the ones a compiler keeps internally): first *decide* which objects escape, then *rewrite* the ones that do not. Do the deciding by hand on the first test before writing any code. \`p\` is made by \`new\`, then used by two \`get\`s; a \`get\` only reads a field, so \`p\` never leaves, and it can be replaced. In the "passing it to a call" test, \`p\` is an argument to \`f\`, and \`f\` could keep it, so it must stay. The rule to code up is: an object escapes if its variable is ever used *as a value*, and being the \`obj\` of a \`get\` or \`set\` is not using it as a value.

**The solution, line by line.**

- \`function valueUses(i) {\` starts a helper that answers one question: which variables does instruction \`i\` read *as values*?
- \`case 'new': return Object.values(i.fields);\` A \`new\` reads its field values; if one of them is another object, that object is now stored inside this one, which is an escape.
- \`case 'set': case 'mov': case 'ret': return [i.src];\` A \`set\` reads only its \`src\` (its \`obj\` is the target, which is fine); a \`mov\` copies \`src\` somewhere else; a \`ret\` hands \`src\` to the caller. All three make \`src\` reachable from somewhere new.
- \`case 'add': return [i.a, i.b];\` and \`case 'call': return i.args;\` An operand or an argument is a value use too.
- \`default: return [];\` covers \`get\`, which uses nothing as a value.
- \`const escapes = (v) => code.some((i) => valueUses(i).includes(v));\` An object escapes if *any* instruction uses it as a value.
- The first \`for\` loop puts the \`dst\` of every \`new\` that does not escape into the set \`virt\`: these are the virtual objects. Each allocation gets its own verdict, so \`p\` and \`q\` in the same code can be judged differently.
- \`const out = [];\` We build a new array rather than editing \`code\`, so the input is left alone (the last test checks this; a real compiler pass must not damage the IR it reads either).
- \`const f = (o, k) => o + '_' + k;\` names the variable that will hold field \`k\` of object \`o\`: \`p_x\`.
- A virtual \`new\` becomes one \`mov\` per field, in field order: \`p_x = a\`, \`p_y = b\`. This is scalar replacement: the object turns into separate local values.
- A \`get\` on a virtual object becomes \`mov dst, p_x\`: reading the field is now copying the variable.
- A \`set\` on a virtual object becomes \`mov p_x, src\`: writing the field is now assigning the variable.
- Everything else is pushed unchanged, and \`return out;\` hands back the rewritten list. After the rewrite nothing mentions \`p\` at all, so the allocation is gone.

**Common wrong attempts.**

- Replacing *every* \`new\`, without the escape check: if \`p\` is passed to \`f\` or returned, the caller now receives a variable that never held an object, and the program's behaviour changes. The escape check is the whole point.
- Treating only calls as escapes: returning the object, storing it into another object or copying it with \`mov\` also lets someone else hold the reference, so the "returning it escapes" and "storing it somewhere escapes" tests fail.
- Counting the \`obj\` of a \`get\` or \`set\` as a value use: then no object is ever replaced, because every object is used by its own field accesses, and the first test fails.`,
    wrong: [
      {
        code: `function scalarReplace(code) {
  const virt = new Set(code
    .filter((i) => i.op === 'new')
    .map((i) => i.dst));
  const f = (o, k) => o + '_' + k;
  return code.flatMap((i) => {
    if (i.op === 'new') {
      return Object.keys(i.fields).map(
        (k) => ({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] }));
    }
    if (i.op === 'get' &&
        virt.has(i.obj)) {
      return [{ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) }];
    }
    if (i.op === 'set' &&
        virt.has(i.obj)) {
      return [{ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src }];
    }
    return [i];
  });
}`,
        why: 'This replaces every object, escaping or not. If `p` is passed to `f` or returned, the caller gets a variable that no longer holds an object: the program’s behaviour changes. The escape check is the whole point.',
      },
      {
        code: `function scalarReplace(code) {
  const escapes = (v) => code.some(
    (i) => i.op === 'call' &&
      i.args.includes(v));
  const virt = new Set();
  for (const i of code) {
    if (i.op === 'new' &&
        !escapes(i.dst)) {
      virt.add(i.dst);
    }
  }
  const f = (o, k) => o + '_' + k;
  return code.flatMap((i) => {
    if (i.op === 'new' &&
        virt.has(i.dst)) {
      return Object.keys(i.fields).map(
        (k) => ({ op: 'mov',
          dst: f(i.dst, k),
          src: i.fields[k] }));
    }
    if (i.op === 'get' &&
        virt.has(i.obj)) {
      return [{ op: 'mov', dst: i.dst,
        src: f(i.obj, i.key) }];
    }
    if (i.op === 'set' &&
        virt.has(i.obj)) {
      return [{ op: 'mov',
        dst: f(i.obj, i.key),
        src: i.src }];
    }
    return [i];
  });
}`,
        why: 'Calls are only one escape site. Returning the object, or storing it into another object, also lets someone else hold the reference.',
      },
    ],
  },
  rematerialize: {
    optional: true,
    title: 'Rebuild the object on deopt',
    prompt: 'After scalar replacement, a deopt frame state describes a removed object as `{ fields: { x: \'p_x\', ... } }`: each field names the variable holding its value. A field may also hold another description (an object that was inside it). Write `materialize(desc, env)`, which builds a real object from the description, reading variables from `env`.',
    starter: `function materialize(desc, env) {
  return {};
}`,
    solution: `function materialize(desc, env) {
  const o = {};
  for (const k in desc.fields) {
    const v = desc.fields[k];
    o[k] = typeof v === 'string'
      ? env[v]
      : materialize(v, env);
  }
  return o;
}`,
    tests: `test('fields come from the variables', () => {
  const d = { fields: { x: 'p_x', y: 'p_y' } };
  expect(materialize(d, { p_x: 1, p_y: 2 }))
    .toEqual({ x: 1, y: 2 });
});
test('nested objects are rebuilt too', () => {
  const d = { fields: {
    pos: { fields: { x: 'a' } },
    m: 'b',
  } };
  expect(materialize(d, { a: 3, b: 4 }))
    .toEqual({ pos: { x: 3 }, m: 4 });
});
test('each deopt makes a fresh object', () => {
  const d = { fields: { x: 'p_x' } };
  const env = { p_x: 1 };
  const a = materialize(d, env);
  const b = materialize(d, env);
  expect(a === b).toBe(false);
});`,
    hints: [
      'Make an empty object and loop over the field names in `desc.fields`.',
      'A string names a variable: look it up in `env`. Anything else is another description: call `materialize` on it.',
      'Inside the loop: `const v = desc.fields[k]; o[k] = typeof v === \'string\' ? env[v] : materialize(v, env);`, then `return o;` after it.',
    ],
    walkthrough: `**How to think about it.** This is what the deoptimiser does with an \`ObjectState\`: the description says which variable holds each field's value, so building the object is "make an empty object, then fill in each field from its variable". The only twist is that a field can hold a *description* instead of a variable name, when an object that was removed held another removed object; that inner object has to be rebuilt first. A structure that can contain itself is a hint to use recursion.

**The solution, line by line.**

- \`const o = {};\` makes the fresh object we are going to fill in.
- \`for (const k in desc.fields) {\` visits each field name, \`x\`, \`y\` and so on, in order.
- \`const v = desc.fields[k];\` is what the description says about field \`k\`: a variable name, or another description.
- \`o[k] = typeof v === 'string' ? env[v] : materialize(v, env);\` A string names a variable, so its value is looked up in \`env\`; anything else is a nested description, so we rebuild that object first (by calling ourselves) and store it in the field.
- \`return o;\` hands back the rebuilt object.

The third test checks that two calls give two *different* objects. That is right: the rebuilt object did not exist before the deopt, so it is a new allocation, and that is only safe because the original never escaped, so nothing outside could have kept its identity to compare.

**Common wrong attempts.**

- \`o[k] = env[desc.fields[k]];\` for every field: a nested description is not a variable name, so the lookup gives \`undefined\` and the inner object is lost.
- Caching the result and returning the same object every time: the third test fails, and in a real engine two deopts would wrongly share one object.`,
    wrong: [
      {
        code: `function materialize(desc, env) {
  const o = {};
  for (const k in desc.fields) {
    o[k] = env[desc.fields[k]];
  }
  return o;
}`,
        why: 'A nested description isn’t a variable name, so `env[...]` gives `undefined` and the inner object is lost.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'An intraprocedural analysis meets `const r = f(x);`. What must it assume?',
    options: [
      {
        t: 'That `r` is a copy of `x`',
        why: 'It cannot know that without looking inside `f`.',
      },
      {
        t: 'That `f` may store `x` anywhere and `r` may point at anything',
        correct: true,
        why: 'Without crossing the call, the worst case is the only safe one.',
      },
      {
        t: 'That `f` has no effect',
        why: 'That would be unsound: `f` might store `x` in a global.',
      },
    ],
  },
  {
    q: 'With `id(p) { return p; }` called as `a = id(o1)` and `b = id(o2)`, what does a context-insensitive points-to analysis give for `a`?',
    options: [
      {
        t: '`{o1}`',
        why: 'That is the precise answer, but with one shared parameter, `p` holds both objects.',
      },
      {
        t: '`{}`',
        why: 'The return copies something into `a`.',
      },
      {
        t: '`{o1, o2}`',
        correct: true,
        why: 'Both calls copy into the one `p`, and the return copies all of `p` back to every caller.',
      },
      {
        t: 'unknown: the call is a closed door',
        why: 'An interprocedural analysis follows the call; it just merges the callers.',
      },
    ],
  },
  {
    q: 'Why do analyses keep only the last k call sites of context, rather than the whole chain?',
    options: [
      {
        t: 'Recursion makes chains of call sites unboundedly long, so the set of contexts must be cut to stay finite',
        correct: true,
        why: 'With k sites there are finitely many contexts, so the fixpoint is still reached.',
      },
      {
        t: 'Because older call sites never matter',
        why: 'They can matter: the wrapper example needs two sites.',
      },
      {
        t: 'Because JavaScript has at most k nested calls',
        why: 'JavaScript allows deep call chains (up to the stack limit).',
      },
    ],
  },
  {
    q: '`put(b, v)` calls `b.set(v)` at one site; `put` is called with two different boxes. Which context separates the two calls to `set`?',
    options: [
      {
        t: '1 call site',
        why: 'Every call to `set` comes from the same site inside `put`.',
      },
      {
        t: 'Context-insensitive',
        why: 'That merges everything.',
      },
      {
        t: 'The function’s name',
        why: 'Every call is to the same function, `set`.',
      },
      {
        t: 'Object sensitivity: the receiver’s allocation site',
        correct: true,
        why: 'The receivers are two different boxes, so `set` gets two contexts.',
      },
    ],
  },
  {
    q: 'Why can’t a JavaScript points-to analysis first build the call graph and then compute points-to sets?',
    options: [
      {
        t: 'Because calls are rare in JavaScript',
        why: 'They are everywhere.',
      },
      {
        t: 'It can; the order does not matter',
        why: 'The call graph depends on the sets, so building it first would have to guess.',
      },
      {
        t: 'Because callees are values: the targets of `g(x)` are whatever function objects pts(g) holds',
        correct: true,
        why: 'Each new set can add call edges, and each edge adds copies, so both grow together to one fixpoint.',
      },
    ],
  },
  {
    q: 'What is the main advantage of a function summary over analysing a function once per calling context?',
    options: [
      {
        t: 'It is more precise than any context-sensitive analysis',
        why: 'It can match one, but a summary must be safe for every input, which can cost precision.',
      },
      {
        t: 'The function is analysed once, yet each call still gets an answer for its own arguments',
        correct: true,
        why: 'The summary is a rule from inputs to outputs, applied per call.',
      },
      {
        t: 'It removes the need for a call graph',
        why: 'A call still needs to know which function’s summary to apply.',
      },
    ],
  },
  {
    q: 'Go reports `p does not escape` for `func read(p *P) float64`. What can it do with that at the call `read(&P{7, 8})`?',
    options: [
      {
        t: 'Nothing: escape analysis is only about one function',
        why: 'The point of the tag is to be used at call sites.',
      },
      {
        t: 'Inline `read`',
        why: 'The output was produced with inlining turned off (-l); the decision comes from the summary.',
      },
      {
        t: 'Remove the call',
        why: 'The call still computes p.x.',
      },
      {
        t: 'Allocate the new `P` on the stack, since the callee never keeps it',
        correct: true,
        why: 'Go printed `&P{...} does not escape` for that call.',
      },
    ],
  },
  {
    q: 'Facts: `New(a, o1)`, `Assign(a, b)`, `Assign(b, c)`. Rules: `Pts(v, h) :- New(v, h).` and `Pts(t, h) :- Assign(f, t), Pts(f, h).` How many rounds derive something new?',
    options: [
      {
        t: 'One',
        why: 'Round 1 only finds Pts(a, o1); R2 needs Pts facts to join with.',
      },
      {
        t: 'Three: Pts(a, o1), then Pts(b, o1), then Pts(c, o1)',
        correct: true,
        why: 'Each round extends the chain by one copy; the fourth round adds nothing.',
      },
      {
        t: 'It never stops, because rules can apply forever',
        why: 'Rules invent no values, so only finitely many facts exist.',
      },
    ],
  },
  {
    q: 'What makes `Assign(f, t), Pts(f, h)` a join?',
    options: [
      {
        t: 'The comma',
        why: 'The comma means “and”; the join comes from what the two parts share.',
      },
      {
        t: 'The variable `f` appears in both, so only rows that agree on `f` combine',
        correct: true,
        why: 'Without the shared variable it would pair every row with every row.',
      },
      {
        t: 'Both relations have two columns',
        why: 'Width only matters for matching an atom to a fact.',
      },
      {
        t: 'The head mentions `t` and `h`',
        why: 'The head says what to produce; the body’s shared variables do the joining.',
      },
    ],
  },
  {
    q: 'How does Doop make its rules consider only code the program can actually reach?',
    options: [
      {
        t: 'It deletes unreachable methods before running',
        why: 'Reachability is itself computed by the rules, together with the points-to sets.',
      },
      {
        t: 'It runs the program first',
        why: 'Doop is a static analysis; it never runs the program.',
      },
      {
        t: 'Its rules include a `Reachable(?method)` condition, and other rules derive `Reachable` and call-graph edges from the points-to sets',
        correct: true,
        why: 'So the call graph and the sets grow together to one fixpoint.',
      },
    ],
  },
  {
    q: 'In `function dist(x, y) { const p = { x, y }; return Math.sqrt(p.x * p.x + p.y * p.y); }`, does `p` escape?',
    options: [
      {
        t: 'Yes: every object is on the heap',
        why: 'That is where the language says it lives; escape analysis asks whether it has to.',
      },
      {
        t: 'Yes: it is used in a call to Math.sqrt',
        why: 'Only numbers read from it are passed, not the object.',
      },
      {
        t: 'No: only its fields are read, and no reference to it leaves `dist`',
        correct: true,
        why: 'So it could live on the stack, or be replaced by two numbers.',
      },
    ],
  },
  {
    q: '`p.next = q`, where `q`’s object is stored in a global. What is the state of `p`’s object, if nothing else touches it?',
    options: [
      {
        t: 'NoEscape',
        correct: true,
        why: 'States spread along edges to what is pointed at; p’s object points at q’s, not the other way round.',
      },
      {
        t: 'GlobalEscape, because it is connected to a global object',
        why: 'Connected in the wrong direction: nobody outside can follow `next` backwards.',
      },
      {
        t: 'ArgEscape',
        why: 'No argument reaches p’s object.',
      },
    ],
  },
  {
    q: 'What does a deferred edge in a connection graph stand for?',
    options: [
      {
        t: 'A call that has not been analysed yet',
        why: 'Calls are handled separately; a deferred edge comes from an assignment.',
      },
      {
        t: 'An object that will be allocated later',
        why: 'Objects are nodes; edges connect them.',
      },
      {
        t: '“Holds whatever that holds”, from a copy like `p = q` or a field store; it is bypassed after the graph is built',
        correct: true,
        why: 'Bypassing gives p direct points-to edges to q’s objects.',
      },
      {
        t: 'An edge that may be ignored',
        why: 'Ignoring it would lose the flow of references, and with it, escapes.',
      },
    ],
  },
  {
    q: 'Go reports `moved to heap: p` for `func make1() *P { p := P{3, 4}; return &p }`. Why?',
    options: [
      {
        t: 'Because P has two fields',
        why: 'Size is not the reason; a P that is only read can stay on the stack.',
      },
      {
        t: 'Because inlining was turned off',
        why: 'Even without inlining, a value that is only read stays on the stack.',
      },
      {
        t: 'Because Go puts every struct on the heap',
        why: 'It puts values on the stack whenever escape analysis allows.',
      },
      {
        t: 'A pointer to p is returned, so p must outlive the frame of make1',
        correct: true,
        why: 'Go’s rule: pointers to a stack object cannot outlive that object.',
      },
    ],
  },
  {
    q: 'Which optimisation needs only that an object does not escape its thread, rather than its method?',
    options: [
      {
        t: 'Stack allocation',
        why: 'The stack frame dies when the method returns, so the object must not outlive the method.',
      },
      {
        t: 'Removing the locks taken on it',
        correct: true,
        why: 'No other thread can ever see it, so locking it protects nothing.',
      },
      {
        t: 'Scalar replacement',
        why: 'Taking the object apart needs every use in view, inside the method.',
      },
    ],
  },
  {
    q: 'Which order of steps lets TurboFan remove the object in `t += len2({ x: xs[i], y: ys[i] })`?',
    options: [
      {
        t: 'Remove the allocation, then inline `len2`',
        why: 'Before inlining, the object is passed to a call, so the analysis must assume it escapes.',
      },
      {
        t: 'Inline `len2`, see that `p` is only used by field reads, then replace those reads with the stored values',
        correct: true,
        why: 'On this book’s machine, `--trace-turbo-inlining` shows len2 being inlined, and turning off either inlining or escape analysis brings the allocations back.',
      },
      {
        t: 'Convert the loop to struct of arrays',
        why: 'That is Viscosity’s move, ahead of time. V8 doesn’t change the layout of your data.',
      },
      {
        t: 'Let the garbage collector free each object right after the call',
        why: 'That still allocates every object; the collector only cleans up afterwards.',
      },
    ],
  },
  {
    q: 'After scalar replacement, where do `p.x` and `p.y` live?',
    options: [
      {
        t: 'In a hidden object on the heap',
        why: 'There is no object left; that is what was removed.',
      },
      {
        t: 'In the feedback vector',
        why: 'Feedback describes what operations saw, not the program’s values.',
      },
      {
        t: 'In a `Float64Array` that V8 creates',
        why: 'V8 doesn’t create columns; scalar replacement works on single values.',
      },
      {
        t: 'As separate local values, like `p_x` and `p_y`, which can sit in registers',
        correct: true,
        why: 'Each field becomes its own value, and reads of the field become uses of that value.',
      },
    ],
  },
  {
    q: 'A guard fails inside the optimised loop, after `p` was removed. What happens?',
    options: [
      {
        t: 'The deoptimiser builds a real `p` from the field values recorded in the frame state',
        correct: true,
        why: 'TurboFan writes an `ObjectState` for each virtual object into the deopt information, and V8’s concurrent-marking post lists “materialization during deoptimization” among the operations that create objects.',
      },
      {
        t: 'The program crashes, because the interpreter expects an object',
        why: 'Removing an object would be unsafe without a way to rebuild it; the frame state provides one.',
      },
      {
        t: 'V8 re-runs the loop from the start with the object',
        why: 'Deoptimisation continues from the same point; re-running would repeat side effects.',
      },
      {
        t: 'The interpreter continues without `p`',
        why: 'The interpreter’s code still says `p.x`, so it needs a real `p`.',
      },
    ],
  },
  {
    q: 'In this book’s run, `materialize` was about 20 to 35 times slower for SoA (at 100,000 and a million elements), while `get-objects` wasn’t slower at all. Why?',
    options: [
      {
        t: 'V8 doesn’t optimise loops that write arrays',
        why: 'It optimises them fine; the allocations are the problem.',
      },
      {
        t: '`materialize` stores every object into an array that outlives the loop, so they escape and must exist',
        correct: true,
        why: 'Something outside can now read `out[i]` and compare identities. No analysis can remove those allocations.',
      },
      {
        t: '`materialize` uses six fields and `get-objects` uses two',
        why: 'Both build objects with all six fields.',
      },
      {
        t: 'The `materialize` objects are too big for the young generation',
        why: 'They are small objects; the cost is that each one must really be allocated.',
      },
    ],
  },
  {
    q: 'Viscosity, unlike V8, refuses to change the layout when an element is passed to `move(ps[i])`. Why is that the right choice for it?',
    options: [
      {
        t: 'Viscosity’s analysis is less accurate by mistake',
        why: 'It is cautious on purpose: it has different tools.',
      },
      {
        t: 'Function calls are always slow in JavaScript',
        why: 'Calls are cheap once inlined; the issue is what the callee might do with the object.',
      },
      {
        t: 'V8 forbids libraries from changing data layout',
        why: 'Nothing forbids it; Viscosity rewrites source code before V8 sees it.',
      },
      {
        t: 'It works ahead of time, with no inlining and no deoptimisation, so it must prove the object never escapes in the code as written',
        correct: true,
        why: 'V8 can inline, speculate and bail out. Viscosity’s only safe answer to “might escape” is to keep the objects.',
      },
    ],
  },
];
