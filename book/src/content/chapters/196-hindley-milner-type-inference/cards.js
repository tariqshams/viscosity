// Chapter 92 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'mono-fails': {
    q: 'Why does inference with one type per name reject `id(1)` followed by `id(true)`?',
    a: 'The first call settles id’s variable α as number for good, so the second call asks number = bool, and unification fails.',
  },
  'scheme-what': {
    q: 'What is a type scheme, and how is `∀α. α → α` read?',
    a: 'A type with some variables bound by ∀ in front; read “for all types alpha, a function from alpha to alpha”.',
  },
  'let-poly-what': {
    q: 'What does let-polymorphism allow?',
    a: 'A name bound by `let` gets a type scheme, so each use of the name may have a different type.',
  },
  'lambda-mono': {
    q: 'Why is `λf. if f true then f 1 else 2` rejected, while the same body with `let f = λx. x in` is accepted?',
    a: 'A parameter (λf) has one type, which `f true` and `f 1` cannot share; only let-bound names get schemes.',
  },
  'gen-what': {
    q: 'At which point in inference does generalisation happen?',
    a: 'At a `let`, right after the type of the definition (e₁) has been inferred, before the body (e₂) is checked.',
  },
  'gen-env': {
    q: 'Why must generalisation leave alone a type variable that is free in the environment?',
    a: 'Something outside the let (such as an enclosing parameter) still depends on it, so it is one type, not a blank each use may choose.',
  },
  'inst-what': {
    q: 'What does instantiation do to `∀α β. α → β → α`?',
    a: 'It replaces α and β with fresh type variables, giving an ordinary type such as γ → δ → γ.',
  },
  'inst-fresh': {
    q: 'Why must the variables made by instantiation be fresh?',
    a: 'So that unification at one use settles only that use’s copy, and two uses can never clash.',
  },
  'value-restriction': {
    q: 'What is the value restriction, and why is it needed?',
    a: 'Generalise a let only when its definition is a syntactic value (not a call); otherwise a mutable box could be written at one type and read at another.',
  },
};

export const examples = {
  'id-twice': {
    title: 'Drip runs id at two types',
    lang: 'drip',
    code: `let id = fn (x) { return x; };
print id(1);
print id(true);`,
  },
};

export const exercises = {
  'gen-inst': {
    title: 'Generalise and instantiate',
    prompt: 'Types and schemes are data, as in the comment at the top; `fresh()` makes a new variable (`t1`, `t2`, ...), `show` and `showS` print a type and a scheme, and `subst(t, m)` replaces the variables named in the object `m`. Write three functions. `ftv(t)`: the names of the type variables in `t`, each once, in order of first appearance. `generalize(env, t)`: `env` is a `Map` from names to schemes; return the scheme whose `vars` are the variables of `t` (in `ftv` order) that are not free in any of the environment’s schemes (a scheme’s own `vars` are not free in it). `instantiate(s)`: return `s.type` with each of `s.vars` replaced by a fresh variable.',
    starter: `// types: { k: 'var', name },
// { k: 'con', name },
// { k: 'fn', from, to }
// schemes: { vars: [names], type }
const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
let count = 0;
const fresh = () => tv('t' + ++count);

function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
const showS = (s) => (s.vars.length
  ? '∀' + s.vars.join(' ') + '. '
  : '') + show(s.type);

// replace variables named in m
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}

function ftv(t) {
  return [];
}

function generalize(env, t) {
  return { vars: [], type: t };
}

function instantiate(s) {
  return s.type;
}`,
    solution: `// types: { k: 'var', name },
// { k: 'con', name },
// { k: 'fn', from, to }
// schemes: { vars: [names], type }
const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
let count = 0;
const fresh = () => tv('t' + ++count);

function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
const showS = (s) => (s.vars.length
  ? '∀' + s.vars.join(' ') + '. '
  : '') + show(s.type);

// replace variables named in m
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const v of ftv(t.to)) {
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function generalize(env, t) {
  const inEnv = [];
  for (const s of env.values()) {
    for (const v of ftv(s.type)) {
      if (!s.vars.includes(v)) {
        inEnv.push(v);
      }
    }
  }
  const vars = ftv(t)
    .filter((v) => !inEnv.includes(v));
  return { vars, type: t };
}

function instantiate(s) {
  const m = {};
  for (const v of s.vars) {
    m[v] = fresh();
  }
  return subst(s.type, m);
}`,
    tests: `const a = tv('a'), b = tv('b');
const num = con('number');
test('ftv lists each variable once, in order', () => {
  expect(ftv(fn(a, fn(b, a)))).toEqual(['a', 'b']);
  expect(ftv(fn(fn(b, num), a))).toEqual(['b', 'a']);
  expect(ftv(num)).toEqual([]);
});
test('an empty environment: every variable gets a ∀', () => {
  expect(showS(generalize(new Map(), fn(a, a)))).toBe('∀a. a → a');
  expect(showS(generalize(new Map(), fn(a, fn(b, a))))).toBe('∀a b. a → b → a');
});
test('a variable free in the environment stays shared', () => {
  const env = new Map([['x', { vars: [], type: a }]]);
  expect(showS(generalize(env, fn(b, a)))).toBe('∀b. b → a');
  expect(showS(generalize(env, a))).toBe('a');
});
test('a scheme’s own ∀ variables are not free in it', () => {
  const env = new Map([['f', { vars: ['a'], type: fn(a, a) }]]);
  expect(showS(generalize(env, fn(a, b)))).toBe('∀a b. a → b');
});
test('instantiate makes fresh copies each time', () => {
  count = 0;
  const s = { vars: ['a', 'b'], type: fn(a, fn(b, a)) };
  expect(show(instantiate(s))).toBe('t1 → t2 → t1');
  expect(show(instantiate(s))).toBe('t3 → t4 → t3');
});
test('instantiate leaves variables outside the ∀ alone', () => {
  count = 0;
  const s = { vars: ['b'], type: fn(b, fn(a, num)) };
  expect(show(instantiate(s))).toBe('t1 → a → number');
});`,
    hints: [
      '`ftv` is a walk over the type, like every function on trees in this book: a variable gives its own name, a constant gives nothing, and a function type combines its two sides.',
      'For `generalize`, first collect the variables that are free in the environment: for each scheme in `env.values()`, the names in `ftv(s.type)` that are not in `s.vars`. Then keep only the names of `ftv(t)` that are not in that collection.',
      '`instantiate` builds an object `m` with one fresh variable per name in `s.vars` (`m[v] = fresh()`), then returns `subst(s.type, m)`. In `ftv`, start from `ftv(t.from)` and push each name of `ftv(t.to)` only if it is not already there.',
    ],
    walkthrough: `**How to think about it.** All three functions follow the chapter’s definitions word for word. The free type variables of a type are found by walking it; generalisation is “the variables of τ minus the variables free in Γ”; instantiation is “substitute a fresh variable for each bound one”. The only subtle part is what “free in the environment” means: a scheme like \`∀a. a → a\` mentions \`a\`, but its \`a\` is a blank of its own, bound by its ∀, so it does not tie anything down. Only the variables a scheme does *not* bind count.

**The solution, line by line.**

- \`if (t.k === 'var') return [t.name];\` A type variable is its own only free variable.
- \`if (t.k === 'con') return [];\` \`number\` and \`bool\` have none.
- \`const out = ftv(t.from);\` For a function type, start with the variables of the parameter side, in order.
- \`for (const v of ftv(t.to)) { if (!out.includes(v)) out.push(v); }\` Then add those of the result side, skipping any already seen, so each name appears once and in order of first appearance (\`a → b → a\` gives \`['a', 'b']\`).
- In \`generalize\`, \`const inEnv = [];\` collects the variables the environment depends on.
- \`for (const s of env.values())\` visits each scheme in the Map; \`for (const v of ftv(s.type)) { if (!s.vars.includes(v)) inEnv.push(v); }\` keeps the variables of the scheme’s type that its own ∀ does not bind.
- \`const vars = ftv(t).filter((v) => !inEnv.includes(v));\` is ftv(τ) − ftv(Γ), keeping \`ftv\`’s order.
- \`return { vars, type: t };\` The scheme is the same type with those variables marked as blanks.
- In \`instantiate\`, \`const m = {};\` will map each bound name to its copy.
- \`for (const v of s.vars) { m[v] = fresh(); }\` One fresh variable per blank, so two calls never share one.
- \`return subst(s.type, m);\` replaces the blanks and leaves every other variable (one shared with the environment) as it is.

**Common wrong attempts.**

- Generalising every variable of the type, ignoring the environment: \`λx. let y = x in if y then y else 1\` would then be accepted, though \`y\` is \`x\` and cannot be both a bool and a number.
- Counting a scheme’s own ∀ variables as free in the environment: then a name like \`f : ∀a. a → a\` in scope would stop any later definition from generalising a variable that happens to be called \`a\`.
- Reusing the same variables in \`instantiate\` (returning \`s.type\` or making the copies once): two uses would share their blanks again, which is the problem we started with.`,
    wrong: [
      {
        code: `// types: { k: 'var', name },
// { k: 'con', name },
// { k: 'fn', from, to }
// schemes: { vars: [names], type }
const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
let count = 0;
const fresh = () => tv('t' + ++count);

function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
const showS = (s) => (s.vars.length
  ? '∀' + s.vars.join(' ') + '. '
  : '') + show(s.type);

// replace variables named in m
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const v of ftv(t.to)) {
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function generalize(env, t) {
  return { vars: ftv(t), type: t };
}

function instantiate(s) {
  const m = {};
  for (const v of s.vars) {
    m[v] = fresh();
  }
  return subst(s.type, m);
}`,
        why: 'This generalises every variable, even one free in the environment, so a variable shared with an enclosing parameter becomes a blank each use may fill differently.',
      },
      {
        code: `// types: { k: 'var', name },
// { k: 'con', name },
// { k: 'fn', from, to }
// schemes: { vars: [names], type }
const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
let count = 0;
const fresh = () => tv('t' + ++count);

function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
const showS = (s) => (s.vars.length
  ? '∀' + s.vars.join(' ') + '. '
  : '') + show(s.type);

// replace variables named in m
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  const out = ftv(t.from);
  for (const v of ftv(t.to)) {
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function generalize(env, t) {
  const inEnv = [];
  for (const s of env.values()) {
    inEnv.push(...ftv(s.type));
  }
  const vars = ftv(t)
    .filter((v) => !inEnv.includes(v));
  return { vars, type: t };
}

function instantiate(s) {
  const m = {};
  for (const v of s.vars) {
    m[v] = fresh();
  }
  return subst(s.type, m);
}`,
        why: 'This counts a scheme’s own ∀ variables as free in the environment, so `f : ∀a. a → a` in scope wrongly stops `a` being generalised elsewhere.',
      },
      {
        code: `// types: { k: 'var', name },
// { k: 'con', name },
// { k: 'fn', from, to }
// schemes: { vars: [names], type }
const tv = (name) =>
  ({ k: 'var', name });
const con = (name) =>
  ({ k: 'con', name });
const fn = (from, to) =>
  ({ k: 'fn', from, to });
let count = 0;
const fresh = () => tv('t' + ++count);

function show(t) {
  if (t.k !== 'fn') return t.name;
  const a = show(t.from);
  const l = t.from.k === 'fn'
    ? '(' + a + ')' : a;
  return l + ' → ' + show(t.to);
}
const showS = (s) => (s.vars.length
  ? '∀' + s.vars.join(' ') + '. '
  : '') + show(s.type);

// replace variables named in m
function subst(t, m) {
  if (t.k === 'var') {
    return m[t.name] ?? t;
  }
  if (t.k === 'con') return t;
  return fn(subst(t.from, m),
    subst(t.to, m));
}

function ftv(t) {
  if (t.k === 'var') return [t.name];
  if (t.k === 'con') return [];
  return [...ftv(t.from), ...ftv(t.to)];
}

function generalize(env, t) {
  const inEnv = [];
  for (const s of env.values()) {
    for (const v of ftv(s.type)) {
      if (!s.vars.includes(v)) {
        inEnv.push(v);
      }
    }
  }
  const vars = ftv(t)
    .filter((v) => !inEnv.includes(v));
  return { vars, type: t };
}

function instantiate(s) {
  const m = {};
  for (const v of s.vars) {
    m[v] = fresh();
  }
  return subst(s.type, m);
}`,
        why: 'This `ftv` lists a variable once per occurrence, so `a → b → a` gives `[a, b, a]` and the scheme reads `∀a b a. ...`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With one type per name (no schemes), what happens to `let id = λx. x in if id true then id 1 else 2`?',
    options: [
      {
        t: 'It is accepted, with type number',
        why: 'That is what Hindley–Milner says; without schemes, the first use fixes id’s type.',
      },
      {
        t: 'It is rejected: the uses need α = bool and α = number',
        correct: true,
        why: 'Both uses share the single variable α, and bool and number do not unify.',
      },
      {
        t: 'It is rejected because of the occurs check',
        why: 'No variable is unified with a type containing itself; the clash is bool against number.',
      },
    ],
  },
  {
    q: 'In the environment `{ x : α }`, what is the generalisation of `β → α`?',
    options: [
      {
        t: '`∀α β. β → α`',
        why: 'α is free in the environment (it is x’s type), so it must not be bound.',
      },
      {
        t: '`β → α`, with no ∀',
        why: 'β appears nowhere in the environment, so it can and should be generalised.',
      },
      {
        t: '`∀β. β → α`',
        correct: true,
        why: 'Only the variables of the type that are not free in the environment get a ∀.',
      },
    ],
  },
  {
    q: 'Which of these is accepted by Hindley–Milner inference?',
    options: [
      {
        t: '`let f = λx. x in if f true then f 1 else 2`',
        correct: true,
        why: 'f is let-bound, so it gets the scheme ∀α. α → α, and each use gets its own copy.',
      },
      {
        t: '`λf. if f true then f 1 else 2`',
        why: 'f is a parameter, so it has one type, and f true and f 1 need different ones.',
      },
      {
        t: '`λx. let y = x in if y then y else 1`',
        why: 'y’s type is x’s type, which is in the environment, so it is not generalised; y cannot be both bool and number.',
      },
    ],
  },
  {
    q: 'Instantiating `∀α. α → α` twice gives:',
    options: [
      {
        t: '`α → α` both times',
        why: 'Then the two uses would share α again, which is the problem schemes solve.',
      },
      {
        t: 'Two types with different fresh variables, like `β → β` and `γ → γ`',
        correct: true,
        why: 'Each use gets its own copy, settled separately.',
      },
      {
        t: '`number → number`, chosen at the definition',
        why: 'Instantiation does not pick a type; unification at the use fills in the fresh variable.',
      },
    ],
  },
  {
    q: 'Why do ML languages restrict generalisation to syntactic values?',
    options: [
      {
        t: 'Because inferring the type of a call is undecidable',
        why: 'Calls are inferred fine; the danger is generalising the type of what a call returns.',
      },
      {
        t: 'To make inference faster',
        why: 'It is a soundness rule, not a speed one.',
      },
      {
        t: 'So that a mutable box made by a call cannot be written at one type and read at another',
        correct: true,
        why: 'A generalised `Box α` would let each use pick its own α, and the program could crash.',
      },
    ],
  },
];
