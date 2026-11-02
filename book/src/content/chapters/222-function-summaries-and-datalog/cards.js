// Chapter 221b cards (function summaries and Datalog). Keys are stable ids.

export const prompts = {
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
};

export const examples = {
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
};

export const exercises = {
  tinyDatalog: {
    title: 'A Datalog engine in forty lines',
    prompt:
      'A fact is an array like `[\'New\', \'a\', \'o1\']`. A rule is `{ head, body }`: `head` is one atom and `body` a list of atoms, where strings starting with `?` are variables, like `{ head: [\'Pts\', \'?v\', \'?h\'], body: [[\'New\', \'?v\', \'?h\']] }`. Write `solve(facts, rules)` that derives every fact the rules allow (repeat until nothing new) and returns all facts, input and derived, as sorted strings like `\'Pts(a,o1)\'`.',
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
    prompt:
      'Each function has one parameter `p` and a list of statements about it: `[\'store\']` (p is stored in a global), `[\'return\']` (p is returned), `[\'call\', g]` (p is passed to g, result ignored) or `[\'retcall\', g]` (returns `g(p)`). Functions may call each other and themselves. Write `paramTags(fns)` returning, for each function, `{ escapes, returned }`: whether p may end up in a global, and whether p may be returned.',
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
};

export const quiz = [
  {
    q: 'What is the main advantage of a function summary over analysing a function once per calling context?',
    options: [
      { t: 'It is more precise than any context-sensitive analysis', why: 'It can match one, but a summary must be safe for every input, which can cost precision.' },
      { t: 'The function is analysed once, yet each call still gets an answer for its own arguments', correct: true, why: 'The summary is a rule from inputs to outputs, applied per call.' },
      { t: 'It removes the need for a call graph', why: 'A call still needs to know which function’s summary to apply.' },
    ],
  },
  {
    q: 'Go reports `p does not escape` for `func read(p *P) float64`. What can it do with that at the call `read(&P{7, 8})`?',
    options: [
      { t: 'Nothing: escape analysis is only about one function', why: 'The point of the tag is to be used at call sites.' },
      { t: 'Inline `read`', why: 'The output was produced with inlining turned off (-l); the decision comes from the summary.' },
      { t: 'Remove the call', why: 'The call still computes p.x.' },
      { t: 'Allocate the new `P` on the stack, since the callee never keeps it', correct: true, why: 'Go printed `&P{...} does not escape` for that call.' },
    ],
  },
  {
    q: 'Facts: `New(a, o1)`, `Assign(a, b)`, `Assign(b, c)`. Rules: `Pts(v, h) :- New(v, h).` and `Pts(t, h) :- Assign(f, t), Pts(f, h).` How many rounds derive something new?',
    options: [
      { t: 'One', why: 'Round 1 only finds Pts(a, o1); R2 needs Pts facts to join with.' },
      { t: 'Three: Pts(a, o1), then Pts(b, o1), then Pts(c, o1)', correct: true, why: 'Each round extends the chain by one copy; the fourth round adds nothing.' },
      { t: 'It never stops, because rules can apply forever', why: 'Rules invent no values, so only finitely many facts exist.' },
    ],
  },
  {
    q: 'What makes `Assign(f, t), Pts(f, h)` a join?',
    options: [
      { t: 'The comma', why: 'The comma means “and”; the join comes from what the two parts share.' },
      { t: 'The variable `f` appears in both, so only rows that agree on `f` combine', correct: true, why: 'Without the shared variable it would pair every row with every row.' },
      { t: 'Both relations have two columns', why: 'Width only matters for matching an atom to a fact.' },
      { t: 'The head mentions `t` and `h`', why: 'The head says what to produce; the body’s shared variables do the joining.' },
    ],
  },
  {
    q: 'How does Doop make its rules consider only code the program can actually reach?',
    options: [
      { t: 'It deletes unreachable methods before running', why: 'Reachability is itself computed by the rules, together with the points-to sets.' },
      { t: 'It runs the program first', why: 'Doop is a static analysis; it never runs the program.' },
      { t: 'Its rules include a `Reachable(?method)` condition, and other rules derive `Reachable` and call-graph edges from the points-to sets', correct: true, why: 'So the call graph and the sets grow together to one fixpoint.' },
    ],
  },
];
