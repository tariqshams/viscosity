// Chapter 221 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'alloc-site-merge': {
    q: 'In a points-to analysis that names each object by its allocation site alone, what happens to two objects made by one helper function for two different callers?',
    a: 'They become one abstract object, so stores through either caller’s reference land in the same abstract fields (a false alias).',
  },
  'call-ctx-not-enough': {
    q: 'Why does analysing a factory function separately per call site not, by itself, separate the objects it returns?',
    a: 'Every context returns the same abstract object (the one allocation site); the call contexts separate the function’s variables, not the objects it creates.',
  },
  'heap-context': {
    q: 'What is a heap context in a points-to analysis?',
    a: 'A context attached to an abstract object: the object is named by its allocation site together with (a prefix of) the context of the function that allocated it.',
  },
  'heap-wrapper': {
    q: 'A factory `box()` is called only from inside `make()`, which has two callers. How many sites of heap context does it take to separate the two objects?',
    a: 'Two: with one site both objects are labelled by the call inside make; the second site names make’s caller.',
  },
  'ctx-growth': {
    q: 'What is an upper bound on the number of k-limited call-string contexts of one function, in terms of the number of call sites?',
    a: 'The number of call sites to the power k (and never more than the number of distinct call chains that reach it).',
  },
  'ctx-saturate': {
    q: 'In a program without recursion, why does raising k beyond the length of the longest call chain add no contexts?',
    a: 'Each context is a chain of real call sites; once k covers the whole chain there is nothing left to tell apart.',
  },
  'ctx-cost-twice': {
    q: 'Why do heap contexts make a context-sensitive analysis grow faster than call contexts alone?',
    a: 'Each extra context multiplies not only each function’s copies of its variables but also the abstract objects, and every points-to set and field can mention each of them.',
  },
  'ctx-column': {
    q: 'How is context sensitivity expressed in a Datalog points-to analysis?',
    a: 'As extra columns: relations such as Pts carry a context (and objects a heap context), and rules pass the context along so facts from different contexts never join.',
  },
  'records-finite': {
    q: 'Plain Datalog always terminates. What breaks that guarantee once rules can build record values such as a call string `[s, c]`, and what restores it?',
    a: 'Building records creates new values, so a recursive call could make ever longer call strings; cutting each context to k sites leaves finitely many values, so evaluation stops.',
  },
  'naive-cost': {
    q: 'What work does naive Datalog evaluation repeat in every round?',
    a: 'It matches every rule against all known facts again, re-deriving every fact found in earlier rounds.',
  },
  'semi-naive': {
    q: 'In semi-naive Datalog evaluation, which matches does a round (after the first) make?',
    a: 'Only those that use at least one fact derived in the previous round (the delta).',
  },
  'semi-naive-once': {
    q: 'In semi-naive evaluation of a rule with two derived atoms in its body, how is each match kept from being made twice in one round?',
    a: 'One version of the rule per atom: that atom against the new facts, the atoms before it against only the older facts, and the atoms after it against all facts.',
  },
};

export const examples = {
  contextCount: {
    title: 'How many contexts reach box',
    code: `// Each function calls the next one
// from two different sites.
const calls = [
  ['main', 'parse', 's1'],
  ['main', 'parse', 's2'],
  ['parse', 'node', 's3'],
  ['parse', 'node', 's4'],
  ['node', 'box', 's5'],
  ['node', 'box', 's6'],
];
function contexts(k) {
  // function -> its set of contexts
  const seen = new Map();
  const work = [['main', []]];
  while (work.length) {
    const [f, ctx] = work.pop();
    const key = ctx.join(',');
    if (!seen.has(f)) {
      seen.set(f, new Set());
    }
    if (seen.get(f).has(key)) continue;
    seen.get(f).add(key);
    for (const [from, to, s] of calls) {
      if (from !== f) continue;
      const c = [s, ...ctx].slice(0, k);
      work.push([to, c]);
    }
  }
  return seen.get('box').size;
}
for (let k = 0; k <= 4; k++) {
  console.log('k =', k, 'box:',
    contexts(k));
}`,
  },
};

export const exercises = {
  semiNaive: {
    title: 'A semi-naive Datalog engine',
    prompt: 'A fact is an array like `[\'Edge\', \'1\', \'2\']`. A rule is `{ head, body }`: `head` is one atom and `body` a list of atoms, where strings starting with `?` are variables. Write `solve(facts, rules)` that evaluates the rules semi-naively to the fixpoint and returns `{ facts, firings }`: every fact, input and derived, as sorted strings like `\'Path(1,2)\'`, and `firings`, the number of rule matches made (one each time a whole body matched, whether or not the head was new). In round 1 every input fact counts as new; in each later round, make only the matches that use at least one fact derived in the round before, and never the same match twice.',
    starter: `function solve(facts, rules) {
  // your code here
  return { facts: [], firings: 0 };
}

const pathRules = [
  { head: ['Path', '?x', '?y'],
    body: [['Edge', '?x', '?y']] },
  { head: ['Path', '?x', '?z'],
    body: [['Edge', '?x', '?y'],
      ['Path', '?y', '?z']] },
];
const edges = [
  ['Edge', '1', '2'],
  ['Edge', '2', '3'],
  ['Edge', '3', '4'],
  ['Edge', '4', '5'],
];
const out = solve(edges, pathRules);
console.log(out.firings); // 10`,
    solution: `function solve(facts, rules) {
  const key = (f) => f[0] + '(' +
    f.slice(1).join(',') + ')';
  const known = new Map();
  for (const f of facts) {
    known.set(key(f), f);
  }
  let delta = new Map(known);
  let old = new Map();
  let firings = 0;
  const match = (q, fact, env) => {
    if (q[0] !== fact[0]) return null;
    if (q.length !== fact.length) {
      return null;
    }
    const e = { ...env };
    for (let i = 1; i < q.length; i++) {
      const a = q[i];
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
  const extend = (envs, q, from) => {
    const next = [];
    for (const env of envs) {
      for (const f of from.values()) {
        const e = match(q, f, env);
        if (e) next.push(e);
      }
    }
    return next;
  };
  const fire = (r, envs, fresh) => {
    for (const env of envs) {
      firings++;
      const h = r.head.map((x, m) =>
        m > 0 && x.startsWith('?')
          ? env[x] : x);
      const k = key(h);
      if (!known.has(k)) {
        fresh.set(k, h);
      }
    }
  };
  while (delta.size > 0) {
    const fresh = new Map();
    for (const r of rules) {
      const n = r.body.length;
      for (let i = 0; i < n; i++) {
        let envs = [{}];
        r.body.forEach((q, j) => {
          const from = j < i ? old
            : j === i ? delta : known;
          envs = extend(envs, q, from);
        });
        fire(r, envs, fresh);
      }
    }
    old = new Map(known);
    for (const [k, f] of fresh) {
      known.set(k, f);
    }
    delta = fresh;
  }
  const out = [...known.keys()].sort();
  return { facts: out, firings };
}`,
    tests: `const pathRules = [
  { head: ['Path', '?x', '?y'], body: [['Edge', '?x', '?y']] },
  { head: ['Path', '?x', '?z'], body: [['Edge', '?x', '?y'], ['Path', '?y', '?z']] },
];
const chain = (n) => Array.from({ length: n - 1 }, (_, i) => ['Edge', String(i + 1), String(i + 2)]);
const only = (xs, p) => xs.filter((s) => s.startsWith(p));
test('the chain of five: ten paths', () => {
  expect(only(solve(chain(5), pathRules).facts, 'Path').length).toBe(10);
});
test('the chain of five: each match made once', () => {
  expect(solve(chain(5), pathRules).firings).toBe(10);
});
test('input facts are kept', () => {
  expect(only(solve(chain(3), pathRules).facts, 'Edge')).toEqual(['Edge(1,2)', 'Edge(2,3)']);
});
test('cycles stop', () => {
  const out = solve([['Edge', 'a', 'b'], ['Edge', 'b', 'a']], pathRules);
  expect(out.facts).toEqual(['Edge(a,b)', 'Edge(b,a)', 'Path(a,a)', 'Path(a,b)', 'Path(b,a)', 'Path(b,b)']);
  expect(out.firings).toBe(6);
});
test('two derived atoms in one body: no match counted twice', () => {
  const rules = [pathRules[0], { head: ['Path', '?x', '?z'], body: [['Path', '?x', '?y'], ['Path', '?y', '?z']] }];
  const out = solve(chain(5), rules);
  expect(only(out.facts, 'Path').length).toBe(10);
  expect(out.firings).toBe(14);
});`,
    hints: [
      'Keep three maps from a fact’s string to the fact: `known` (everything so far), `delta` (what was new last round; at the start, all the input facts) and `old` (what was known before last round; at the start, nothing). Stop when `delta` is empty.',
      'For each rule and each position `i` in its body, match the atoms one at a time, building up variable bindings: atom `i` against `delta`, atoms before `i` against `old`, atoms after `i` against `known`. Every binding that survives all the atoms is one firing.',
      'Collect new heads in a separate `fresh` map during the round, and only add them to `known` at the end, after setting `old` to a copy of `known`; otherwise a fact found in this round would be joined with in the same round, and some matches would be counted twice.',
    ],
    walkthrough: `**How to think about it.** A naive engine re-makes every match each round. The observation behind semi-naive evaluation is that any match whose facts are all old was already made in an earlier round, so a round only needs the matches that use at least one fact that was new last round. The care is in not counting a match twice when it uses *two* new facts: we decide that a match belongs to the *first* body position that holds a new fact. So, for position \`i\`, atom \`i\` must be new, every atom before it must be old (otherwise the match belongs to an earlier position), and the atoms after it may be anything.

**The solution, line by line.**

- \`key\` turns a fact into the string form the tests want, and \`known\` holds every fact by that key.
- \`let delta = new Map(known);\` makes all input facts new in round 1, and \`let old = new Map();\` says nothing is older than that.
- \`match(q, fact, env)\` is the usual unifier: same relation and arity, constants equal, a variable either bound to the same value already or bound now. It returns the extended bindings or \`null\`.
- \`while (delta.size > 0)\` is the fixpoint test: a round with nothing new to join with can find nothing.
- For each rule, the loop over \`i\` makes one version of the rule per body position.
- \`const from = j < i ? old : j === i ? delta : known;\` (split over two lines) is the whole idea: before \`i\`, old facts only; at \`i\`, new facts only; after \`i\`, anything.
- \`extend(envs, q, from)\` matches one atom against one map of facts, for every set of bindings so far, and keeps the bindings that still work.
- \`fire\` takes every binding that survived all the atoms: each is a firing, \`firings++\`, then the head is built by replacing its variables, and kept in \`fresh\` if it is not yet known.
- At the end of the round, \`old\` becomes a copy of \`known\` (everything before this round's additions), the fresh facts join \`known\`, and \`fresh\` becomes the next \`delta\`.

On the chain of five nodes this makes 4 matches in round 1 and then 3, 2, 1 and 0, ten in all, one per path fact; for \`Path(x, z) :- Path(x, y), Path(y, z)\` it makes 14, exactly the number of different ways the two body atoms can match at the fixpoint, because each match is made once, in the round after its newest fact appeared.

**Common wrong attempts.**

- Keeping the naive loop (every rule against all of \`known\` each round) gets the facts right but makes 40 matches on the chain instead of 10.
- Matching atom \`i\` against \`delta\` but *every* other atom against \`known\`: with two derived atoms, a match that uses two new facts is made once for each, 18 instead of 14.
- Matching every atom against \`delta\`: after round 1 the \`Edge\` facts are never new again, so the recursive rule finds nothing and most paths are missed.`,
    wrong: [
      {
        code: `function solve(facts, rules) {
  const key = (f) => f[0] + '(' +
    f.slice(1).join(',') + ')';
  const known = new Map();
  for (const f of facts) {
    known.set(key(f), f);
  }
  let firings = 0;
  const match = (q, fact, env) => {
    if (q[0] !== fact[0]) return null;
    if (q.length !== fact.length) {
      return null;
    }
    const e = { ...env };
    for (let i = 1; i < q.length; i++) {
      const a = q[i];
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
  const extend = (envs, q, from) => {
    const next = [];
    for (const env of envs) {
      for (const f of from.values()) {
        const e = match(q, f, env);
        if (e) next.push(e);
      }
    }
    return next;
  };
  const fire = (r, envs, fresh) => {
    for (const env of envs) {
      firings++;
      const h = r.head.map((x, m) =>
        m > 0 && x.startsWith('?')
          ? env[x] : x);
      const k = key(h);
      if (!known.has(k)) {
        fresh.set(k, h);
      }
    }
  };
  let changed = true;
  while (changed) {
    changed = false;
    const fresh = new Map();
    for (const r of rules) {
      let envs = [{}];
      for (const q of r.body) {
        envs = extend(envs, q, known);
      }
      fire(r, envs, fresh);
    }
    for (const [k, f] of fresh) {
      known.set(k, f);
    }
    if (fresh.size > 0) changed = true;
  }
  const out = [...known.keys()].sort();
  return { facts: out, firings };
}`,
        why: 'This is naive evaluation: every round matches every rule against all known facts, so the facts are right but the chain of five takes 40 matches instead of 10.',
      },
      {
        code: `function solve(facts, rules) {
  const key = (f) => f[0] + '(' +
    f.slice(1).join(',') + ')';
  const known = new Map();
  for (const f of facts) {
    known.set(key(f), f);
  }
  let delta = new Map(known);
  let firings = 0;
  const match = (q, fact, env) => {
    if (q[0] !== fact[0]) return null;
    if (q.length !== fact.length) {
      return null;
    }
    const e = { ...env };
    for (let i = 1; i < q.length; i++) {
      const a = q[i];
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
  const extend = (envs, q, from) => {
    const next = [];
    for (const env of envs) {
      for (const f of from.values()) {
        const e = match(q, f, env);
        if (e) next.push(e);
      }
    }
    return next;
  };
  const fire = (r, envs, fresh) => {
    for (const env of envs) {
      firings++;
      const h = r.head.map((x, m) =>
        m > 0 && x.startsWith('?')
          ? env[x] : x);
      const k = key(h);
      if (!known.has(k)) {
        fresh.set(k, h);
      }
    }
  };
  while (delta.size > 0) {
    const fresh = new Map();
    for (const r of rules) {
      const n = r.body.length;
      for (let i = 0; i < n; i++) {
        let envs = [{}];
        r.body.forEach((q, j) => {
          const from =
            j === i ? delta : known;
          envs = extend(envs, q, from);
        });
        fire(r, envs, fresh);
      }
    }
    for (const [k, f] of fresh) {
      known.set(k, f);
    }
    delta = fresh;
  }
  const out = [...known.keys()].sort();
  return { facts: out, firings };
}`,
        why: 'Only one atom is forced to be new, and all the others may be anything, so a match that uses two new facts is made twice: 18 matches instead of 14 for the rule with two Path atoms.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`function mk() { return {}; }` is called as `a = mk()` and `b = mk()`. A points-to analysis analyses `mk` separately per call site but names objects by allocation site only. What does it say about `a` and `b`?',
    options: [
      {
        t: 'They may alias',
        correct: true,
        why: 'Both point at the one abstract object for the site inside mk; call contexts separate mk’s variables, not the object it creates.',
      },
      {
        t: 'They never alias',
        why: 'That is true of every run, but proving it needs a heap context, so that the two allocations become two abstract objects.',
      },
      {
        t: 'Nothing: it cannot follow the call',
        why: 'A context-sensitive analysis is interprocedural; it follows the call and sees the allocation.',
      },
    ],
  },
  {
    q: 'In a k-limited call-string analysis of a program without recursion, what happens to the number of contexts of a function as k grows past the length of the longest call chain reaching it?',
    options: [
      {
        t: 'It keeps doubling',
        why: 'Doubling needs a new level of call sites to choose from; past the longest chain there is none.',
      },
      {
        t: 'It stays the same',
        correct: true,
        why: 'Every context is a real chain of call sites, and once k covers the whole chain there are no more sites to tell apart.',
      },
      {
        t: 'It drops to one',
        why: 'More context never merges contexts that a shorter context kept apart.',
      },
    ],
  },
  {
    q: 'A Datalog rule builds callee contexts as records, `Ctx(g, [s, c1]) :- Call(s, f, g), Ctx(f, [c1, c2]).` Why does evaluation still stop on a recursive program?',
    options: [
      {
        t: 'Because Datalog rules never create new values',
        why: 'Plain Datalog rules do not, but a record constructor such as [s, c1] does; that is exactly why the limit is needed.',
      },
      {
        t: 'Because recursive calls are skipped',
        why: 'Nothing in the rule skips them; a recursive call is a Call fact like any other.',
      },
      {
        t: 'Because the rule drops c2, so every context has at most two sites and there are finitely many',
        correct: true,
        why: 'k-limiting keeps the set of possible record values finite, so the fixpoint is reached.',
      },
    ],
  },
  {
    q: 'Naive and semi-naive evaluation are run on the same Datalog program. What differs in their results?',
    options: [
      {
        t: 'Semi-naive may miss facts that need old facts',
        why: 'A match can mix old and new facts; it is made as long as at least one fact is new, so nothing is missed.',
      },
      {
        t: 'Nothing: they derive the same facts, in the same number of rounds; semi-naive makes fewer matches',
        correct: true,
        why: 'Semi-naive skips only matches whose facts are all old, which were already made in an earlier round.',
      },
      {
        t: 'Semi-naive needs more rounds',
        why: 'Each round finds the same new facts as the naive round would, so the number of rounds is the same.',
      },
    ],
  },
  {
    q: 'In semi-naive evaluation of `Path(x, z) :- Path(x, y), Path(y, z)`, a match uses two facts that were both new in the last round. How many times should the round make it?',
    options: [
      {
        t: 'Never, since it was made in an earlier round',
        why: 'Both facts are new, so no earlier round could have made this match.',
      },
      {
        t: 'Twice, once per new fact',
        why: 'That is the bug of forcing only one atom to be new and letting the others match anything; it double-counts.',
      },
      {
        t: 'Once',
        correct: true,
        why: 'It belongs to the first position holding a new fact; the version for the second position requires the first atom to be old, so it skips this match.',
      },
    ],
  },
  {
    q: 'Why must a Datalog engine finish a relation before applying any rule that uses it under negation (`!Killed(x)`)?',
    options: [
      {
        t: 'A fact added to it later would make an earlier conclusion false, and a growing fixpoint never takes facts back',
        correct: true,
        why: 'So relations used under "not" are computed in an earlier layer (stratum) and are complete when the rule runs.',
      },
      {
        t: 'Negation is slower to evaluate',
        why: 'Speed is not the issue; without the ordering the answer itself can be wrong.',
      },
      {
        t: 'Negated atoms cannot share variables',
        why: 'They can and usually do; the variables must be bound by a positive atom, which is a different rule.',
      },
    ],
  },
];
