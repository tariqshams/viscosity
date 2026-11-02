// Chapter 192 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'typed-drip-what': {
    q: 'Typed Drip adds type annotations to dynamically typed Drip. Which annotations may a program leave out, and when are the rest checked?',
    a: 'All of them are optional (on `let`s, parameters and results); those written are checked by a pass that runs before the program does.',
  },
  'erase-runs-same': {
    q: 'In a language whose type annotations only feed a checker and are erased before running (typed Drip, TypeScript), what happens if you delete every annotation from a program?',
    a: 'You get an ordinary Drip program that runs exactly the same: the annotations only feed the checker.',
  },
  'strict-cond': {
    q: 'A type checker requires every `if` condition to have type `bool` (no truthiness). What does it say about `if count { ... }` with `count : number`, and what is the fix?',
    a: 'It is a type error, since the condition is a number, not a `bool`; write `if count > 0`.',
  },
  'checker-what': {
    q: 'What does a syntax-directed type checker do with each node of the syntax tree?',
    a: 'It applies the one typing rule for that kind of node, computing the node’s type from its children’s types, or reports an error.',
  },
  'like-evaluate': {
    q: 'How is a type checker’s `typeOf(e, env)` like a tree-walking interpreter’s `evaluate(e)`?',
    a: 'Same walk, children first, one case per kind of node; it returns a type instead of a value, and looks names up in Γ instead of the environment of values.',
  },
  'empty-list': {
    q: 'In a checker that computes types bottom-up only (no inference, no polymorphic types), why can `[]` not be given a type on its own?',
    a: 'The List rule takes the element type from the elements, and there are none; an annotation must say which list it is.',
  },
  'let-extends': {
    q: 'In a type checker, after checking `let x = e;`, what changes in the type environment Γ?',
    a: 'Γ gains `x` with the type of `e`, for the statements that follow.',
  },
  'block-copy': {
    q: 'Why does a type checker that keeps Γ in a Map check a block in a copy of that Map?',
    a: 'So names declared inside the block vanish at its closing brace, as they do when the program runs.',
  },
};

export const examples = {
  'check-program': {
    title: 'A checker for lets, prints and ifs',
    code: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}
function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable': {
      const t = env.get(e.name);
      if (!t) {
        fail("undefined variable '" +
          e.name + "'");
      }
      return t;
    }
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
  }
}

function checkBlock(body, env) {
  const inner = new Map(env);
  for (const s of body) check(s, inner);
}
function check(s, env) {
  if (s.kind === 'let') {
    const t = typeOf(s.init, env);
    env.set(s.name, t);
  } else if (s.kind === 'print') {
    typeOf(s.expr, env);
  } else {
    const c = typeOf(s.cond, env);
    if (c !== 'bool') {
      fail('the condition must be a ' +
        'bool, not ' + describe(c));
    }
    checkBlock(s.body, env);
    if (s.else) checkBlock(s.else, env);
  }
}
function checkProgram(prog) {
  const env = new Map();
  for (const s of prog) {
    try {
      check(s, env);
    } catch (e) {
      return 'line ' + s.line + ': ' +
        e.message;
    }
  }
  return 'ok: ' + [...env].map(
    ([x, t]) => x + ': ' + show(t))
    .join(', ');
}

// Tiny constructors for the trees.
const num = (value) =>
  ({ kind: 'literal', value });
const str = num;
const yes = num(true);
const v = (name) =>
  ({ kind: 'variable', name });
const bin = (op, left, right) =>
  ({ kind: 'binary', op, left, right });
const let_ = (line, name, init) =>
  ({ kind: 'let', line, name, init });
const print = (line, expr) =>
  ({ kind: 'print', line, expr });
const if_ = (line, cond, body) =>
  ({ kind: 'if', line, cond, body });

// let price = 4;
// let n = price * 2;
// if n > 5 { print "big"; }
console.log(checkProgram([
  let_(1, 'price', num(4)),
  let_(2, 'n', bin('*', v('price'),
    num(2))),
  if_(3, bin('>', v('n'), num(5)),
    [print(3, str('big'))]),
]));

// let price = 4;
// let label = "total: " + price;
console.log(checkProgram([
  let_(1, 'price', num(4)),
  let_(2, 'label', bin('+',
    str('total: '), v('price'))),
]));

// let price = 4;
// if price { print price; }
console.log(checkProgram([
  let_(1, 'price', num(4)),
  if_(2, v('price'),
    [print(2, v('price'))]),
]));

// if true { let t = 1; }
// print t;
console.log(checkProgram([
  if_(1, yes, [let_(1, 't', num(1))]),
  print(2, v('t')),
]));`,
  },
};

export const exercises = {
  'type-of': {
    title: 'Types of variables, lists and indexing',
    prompt: 'Finish `typeOf(e, env)` for typed Drip expressions. Literals and binary operators are done (using `binaryType`, chapter 190’s exercise grown to every operator). Write the three missing cases. `{ kind: \'variable\', name }`: the type `env` (a `Map`) gives the name, or the error `undefined variable \'total\'`. `{ kind: \'list\', elements }`: a list type `{ list: T }` when every element has type `T`; an empty list fails with `an empty list needs a type annotation`, and mixed elements with `a list cannot mix a number and a string` (the first element’s type, then the first one that differs). `{ kind: \'index\', object, index }`: the element type; fails with `cannot index a number` if the object is not a list, and `a list index must be a number, not a string`. Use the helpers `show`, `describe`, `same` and `fail`.',
    starter: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}

function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable':
      // look e.name up in env
      return undefined;
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
    case 'list':
      // e.elements: all one type
      return undefined;
    case 'index':
      // e.object[e.index]
      return undefined;
  }
}`,
    solution: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}

function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable': {
      const t = env.get(e.name);
      if (!t) {
        fail("undefined variable '" +
          e.name + "'");
      }
      return t;
    }
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
    case 'list': {
      if (e.elements.length === 0) {
        fail('an empty list needs ' +
          'a type annotation');
      }
      const ts = e.elements.map(
        (x) => typeOf(x, env));
      for (const t of ts) {
        if (!same(t, ts[0])) {
          fail('a list cannot mix ' +
            describe(ts[0]) + ' and ' +
            describe(t));
        }
      }
      return { list: ts[0] };
    }
    case 'index': {
      const o = typeOf(e.object, env);
      const i = typeOf(e.index, env);
      if (!o.list) {
        fail('cannot index ' +
          describe(o));
      }
      if (i !== 'number') {
        fail('a list index must be a ' +
          'number, not ' + describe(i));
      }
      return o.list;
    }
  }
}`,
    tests: `const L = (value) => ({ kind: 'literal', value });
const V = (name) => ({ kind: 'variable', name });
const B = (op, left, right) =>
  ({ kind: 'binary', op, left, right });
const List = (...elements) => ({ kind: 'list', elements });
const Ix = (object, index) => ({ kind: 'index', object, index });
const env = new Map([
  ['price', 'number'],
  ['name', 'string'],
  ['xs', { list: 'number' }],
]);
const ty = (e) => show(typeOf(e, env));
const msg = (e) => {
  try { typeOf(e, env); } catch (x) { return x.message; }
  return 'no error';
};
test('literals and operators (given)', () => {
  expect(ty(B('*', L(2), L(3)))).toBe('number');
  expect(msg(B('+', L('a'), L(1))))
    .toBe('cannot add a string and a number');
});
test('a variable has the type Γ gives it', () => {
  expect(ty(V('price'))).toBe('number');
  expect(ty(B('+', L('hi '), V('name')))).toBe('string');
});
test('price * 2 + "1" is a type error', () => {
  expect(msg(B('+', B('*', V('price'), L(2)), L('1'))))
    .toBe('cannot add a number and a string');
});
test('an undefined variable', () => {
  expect(msg(V('total'))).toBe("undefined variable 'total'");
});
test('a list of numbers', () => {
  expect(ty(List(L(1), L(2), V('price')))).toBe('[number]');
  expect(ty(List(List(L('a'))))).toBe('[[string]]');
});
test('a list cannot mix types', () => {
  expect(msg(List(L(1), L('two'))))
    .toBe('a list cannot mix a number and a string');
});
test('an empty list needs an annotation', () => {
  expect(msg(List())).toBe('an empty list needs a type annotation');
});
test('indexing gives the element type', () => {
  expect(ty(Ix(V('xs'), L(0)))).toBe('number');
  expect(ty(B('<', Ix(V('xs'), L(0)), L(9)))).toBe('bool');
});
test('only lists can be indexed', () => {
  expect(msg(Ix(V('price'), L(0)))).toBe('cannot index a number');
});
test('the index must be a number', () => {
  expect(msg(Ix(V('xs'), L('0'))))
    .toBe('a list index must be a number, not a string');
});`,
    hints: [
      'Each case is one rule. For a variable, rule T-Var: ask the Map. What does `Map.get` return for a name that is not there?',
      'For a list: fail first if there are no elements; otherwise compute every element’s type with `typeOf(x, env)`, and compare each one with the first using `same` (not `===`, because list types are objects). Return `{ list: firstType }`.',
      'For indexing: compute the object’s type `o` and the index’s type `i`. A list type is an object with a `list` property, so `!o.list` means “not a list”. Check the index is `\'number\'`, then return `o.list`, the element type.',
    ],
    walkthrough: `**How to think about it.** Write each rule from the chapter next to the case it becomes, and read it bottom-up: to know the type of the whole, get the types of the parts by calling \`typeOf\` on them, check what the rule demands, and return the type in the conclusion. The interpreter did the same with values; here, a list of three numbers is not \`[1, 2, 3]\` but the type \`[number]\`, written \`{ list: 'number' }\`. Try the list rule by hand on \`[1, "two"]\`: the element types are \`number\` and \`string\`, they differ, so there is no single T and the rule cannot apply.

**The solution, line by line.**

- \`case 'variable': {\` is T-Var. \`const t = env.get(e.name);\` asks Γ for the name's type.
- \`if (!t) { fail("undefined variable '" + e.name + "'"); }\` handles a name Γ does not hold: \`Map.get\` returns \`undefined\` for it. (No real type is ever falsy here: they are non-empty strings or objects.)
- \`return t;\` is the conclusion: the variable has the type Γ gives it.
- \`case 'list': {\` is the List rule. \`if (e.elements.length === 0) { fail(...) }\` comes first, because the rule needs at least one element to take T from.
- \`const ts = e.elements.map((x) => typeOf(x, env));\` computes every element's type, left to right; a nested error (say, an undefined variable inside the list) is thrown from in here, before we compare anything.
- \`for (const t of ts) { if (!same(t, ts[0])) { fail('a list cannot mix ' + describe(ts[0]) + ' and ' + describe(t)); } }\` compares every type with the first; \`same\` compares printed forms, so \`[string]\` equals another \`[string]\` although they are different objects.
- \`return { list: ts[0] };\` builds the list type from the shared element type.
- \`case 'index': {\` is the Index rule. \`const o = typeOf(e.object, env); const i = typeOf(e.index, env);\` gets both premises' types.
- \`if (!o.list) { fail('cannot index ' + describe(o)); }\`: a base type like \`'number'\` is a string, which has no \`list\` property, so this catches every non-list.
- \`if (i !== 'number') { fail(...) }\` checks the second premise, with the same wording as Drip's runtime error.
- \`return o.list;\` is the conclusion: indexing a \`[T]\` gives a \`T\`.

**Common wrong attempts.**

- \`return env.get(e.name);\` alone returns \`undefined\` for an unknown name, and the error appears later, somewhere confusing (or never).
- Comparing element types with \`===\`: two \`{ list: 'string' }\` objects are never \`===\`, so \`[["a"], ["b"]]\` would be wrongly rejected.
- Returning \`{ list: ts[0] }\` without comparing: \`[1, "two"]\` would be accepted as \`[number]\`, and \`xs[1] * 2\` could then multiply a string at run time, which a sound checker must never allow.
- Returning \`o\` from the index case: \`xs[0]\` would have type \`[number]\` instead of \`number\`, so \`xs[0] < 9\` would fail.`,
    wrong: [
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}

function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable': {
      const t = env.get(e.name);
      if (!t) {
        fail("undefined variable '" +
          e.name + "'");
      }
      return t;
    }
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
    case 'list': {
      if (e.elements.length === 0) {
        fail('an empty list needs ' +
          'a type annotation');
      }
      const ts = e.elements.map(
        (x) => typeOf(x, env));
      return { list: ts[0] };
    }
    case 'index': {
      const o = typeOf(e.object, env);
      const i = typeOf(e.index, env);
      if (!o.list) {
        fail('cannot index ' +
          describe(o));
      }
      if (i !== 'number') {
        fail('a list index must be a ' +
          'number, not ' + describe(i));
      }
      return o.list;
    }
  }
}`,
        why: 'The elements’ types are never compared, so `[1, "two"]` is accepted as a `[number]`.',
      },
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}

function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable': {
      const t = env.get(e.name);
      if (!t) {
        fail("undefined variable '" +
          e.name + "'");
      }
      return t;
    }
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
    case 'list': {
      if (e.elements.length === 0) {
        fail('an empty list needs ' +
          'a type annotation');
      }
      const ts = e.elements.map(
        (x) => typeOf(x, env));
      for (const t of ts) {
        if (!same(t, ts[0])) {
          fail('a list cannot mix ' +
            describe(ts[0]) + ' and ' +
            describe(t));
        }
      }
      return { list: ts[0] };
    }
    case 'index': {
      const o = typeOf(e.object, env);
      const i = typeOf(e.index, env);
      if (!o.list) {
        fail('cannot index ' +
          describe(o));
      }
      if (i !== 'number') {
        fail('a list index must be a ' +
          'number, not ' + describe(i));
      }
      return o;
    }
  }
}`,
        why: 'Indexing returns the list’s type rather than its element type, so `xs[0]` would be a `[number]`.',
      },
      {
        code: `// Types: 'number', 'string', 'bool',
// 'none', { list: T }, { params, ret }.
function show(t) {
  if (typeof t === 'string') return t;
  if (t.list) {
    return '[' + show(t.list) + ']';
  }
  return 'fn(' + t.params.map(show)
    .join(', ') + ') -> ' + show(t.ret);
}
function describe(t) {
  return t === 'none' ? 'none'
    : 'a ' + show(t);
}
function same(a, b) {
  return show(a) === show(b);
}
function fail(msg) {
  throw new Error(msg);
}
const ARITH = ['-', '*', '/', '%'];
function binaryType(op, l, r) {
  const d = describe(l) + ' and ' +
    describe(r);
  const num = l === 'number' &&
    r === 'number';
  if (op === '+') {
    const ok = same(l, r) &&
      (num || l === 'string');
    if (!ok) fail('cannot add ' + d);
    return l;
  }
  if (op === '==' || op === '!=') {
    if (same(l, r)) return 'bool';
    fail('cannot compare ' + d +
      " with '" + op + "'");
  }
  if (ARITH.includes(op)) {
    if (num) return 'number';
    fail("cannot use '" + op +
      "' on " + d);
  }
  if (num) return 'bool';
  fail('cannot compare ' + d +
    " with '" + op + "'");
}

function typeOf(e, env) {
  switch (e.kind) {
    case 'literal': {
      const v = e.value;
      if (v === null) return 'none';
      if (typeof v === 'boolean') {
        return 'bool';
      }
      return typeof v;
    }
    case 'variable': {
      return env.get(e.name);
    }
    case 'binary':
      return binaryType(e.op,
        typeOf(e.left, env),
        typeOf(e.right, env));
    case 'list': {
      if (e.elements.length === 0) {
        fail('an empty list needs ' +
          'a type annotation');
      }
      const ts = e.elements.map(
        (x) => typeOf(x, env));
      for (const t of ts) {
        if (!same(t, ts[0])) {
          fail('a list cannot mix ' +
            describe(ts[0]) + ' and ' +
            describe(t));
        }
      }
      return { list: ts[0] };
    }
    case 'index': {
      const o = typeOf(e.object, env);
      const i = typeOf(e.index, env);
      if (!o.list) {
        fail('cannot index ' +
          describe(o));
      }
      if (i !== 'number') {
        fail('a list index must be a ' +
          'number, not ' + describe(i));
      }
      return o.list;
    }
  }
}`,
        why: 'An unknown name gives `undefined` instead of the error `undefined variable \'total\'`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A checker requires `bool` conditions, lists whose elements share one type, and an annotation on an empty list; `str` returns a string. Which line does it accept?',
    options: [
      {
        t: '`let n = 3; if n { print n; }`',
        why: 'Typed Drip needs a `bool` condition; `n` is a number.',
      },
      {
        t: '`let xs = [1, "two"];`',
        why: 'A list’s elements must all have one type.',
      },
      {
        t: '`let s = "n: " + str(3);`',
        correct: true,
        why: '`str` returns a string, so `+` joins two strings and `s` is a `string`.',
      },
      {
        t: '`let xs = [];`',
        why: 'An empty list has no element to take its type from; it needs an annotation.',
      },
    ],
  },
  {
    q: 'With `xs : [number]` in Γ, what is the type of `xs[0] + 1`?',
    options: [
      {
        t: '`[number]`',
        why: 'Indexing gives the element type, not the list type.',
      },
      {
        t: '`number`',
        correct: true,
        why: 'Index gives `xs[0] : number`, and `+` on two numbers gives `number`.',
      },
      {
        t: 'It depends on what is in `xs` when the program runs',
        why: 'The checker never looks at values; the type `[number]` already says every element is a number.',
      },
    ],
  },
  {
    q: 'In a checker with block scope, why does `if true { let t = 1; } print t;` fail to check?',
    options: [
      {
        t: '`t` was declared in the block, whose copy of Γ is thrown away at the closing brace',
        correct: true,
        why: 'The outer Γ never gained `t`, so `print t` meets an undefined variable.',
      },
      {
        t: '`1` is not a `bool`',
        why: 'Only the condition must be a `bool`, and it is `true`.',
      },
      {
        t: 'It checks fine, because the block always runs',
        why: 'Scope is about where a name is visible, not whether the block runs; `t` is not visible after the brace.',
      },
    ],
  },
  {
    q: 'In what order does a bottom-up, left-to-right type checker visit the nodes of `price * 2 + "1"`?',
    options: [
      {
        t: 'The `+` first, deciding its type before looking at the operands',
        why: 'The rule for `+` needs its operands’ types first.',
      },
      {
        t: '`"1"`, then `price`, then `2`',
        why: 'It goes left to right: the left operand (`price * 2`) first.',
      },
      {
        t: '`price`, `2`, then `*`, then `"1"`, then `+`',
        correct: true,
        why: 'Children before parents, left to right, exactly as the interpreter evaluates.',
      },
    ],
  },
  {
    q: 'A type checker in JavaScript represents list and function types as objects. Why does it compare types with a structural `same(a, b)` instead of `a === b`?',
    options: [
      {
        t: 'List and function types are objects, and two equal-looking objects are not `===`',
        correct: true,
        why: '`same` compares the printed forms, so two separate `{ list: \'number\' }` objects count as the same type.',
      },
      {
        t: '`===` is slower',
        why: 'Speed is not the reason; `===` would give wrong answers for compound types.',
      },
      {
        t: 'Strings cannot be compared with `===`',
        why: 'They can; base types work with `===`, but compound types do not.',
      },
    ],
  },
];
