// Chapter 204 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'annot-what': {
    q: 'What does type annotation checking compare?',
    a: 'The type the programmer declared with the type the checker computes for the code, reporting both when they differ.',
  },
  'annot-compare': {
    q: 'For `let total: number = "3";`, which two types meet, and where does each come from?',
    a: '`number` from the annotation and `string` from `typeOf` on the value `"3"`; they differ, so it is an error.',
  },
  'annot-empty': {
    q: 'How does `let xs: [string] = [];` get past the rule that an empty list has no type?',
    a: 'The checker checks `[]` against the declared `[string]` instead of computing a type for it.',
  },
  'signature-what': {
    q: 'What is a function’s signature in typed Drip?',
    a: 'Its parameter types and result type, as a function type such as `fn(number, number) -> number`.',
  },
  'call-three-checks': {
    q: 'What three things does the checker test at a call `f(a, b)`?',
    a: 'That `f` has a function type, that the argument count matches, and that each argument has its parameter’s type.',
  },
  'sig-first': {
    q: 'Why does the checker add a function’s signature to Γ before checking its body?',
    a: 'So that the body can call the function itself (recursion).',
  },
  'every-path': {
    q: 'Why must a function declared to return a `number` return on every path?',
    a: 'Otherwise it could fall off the end and return `none` where a number was promised, breaking soundness.',
  },
  'body-env': {
    q: 'In which environment is a function body checked?',
    a: 'A copy of Γ (already holding the function’s signature) with each parameter added at its declared type.',
  },
};

export const examples = {
  'check-functions': {
    title: 'Checking functions and their returns',
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

// Does this block return on every path?
function returns(body) {
  const last = body[body.length - 1];
  if (!last) return false;
  if (last.kind === 'return') {
    return true;
  }
  return last.kind === 'if' &&
    last.else !== null &&
    returns(last.body) &&
    returns(last.else);
}

// fn: the function we are inside
function check(s, env, fn) {
  try {
    checkOne(s, env, fn);
  } catch (e) {
    // keep the innermost line
    e.line = e.line || s.line;
    throw e;
  }
}
function checkOne(s, env, fn) {
  if (s.kind === 'if') {
    const c = typeOf(s.cond, env);
    if (c !== 'bool') {
      fail('the condition must be a ' +
        'bool, not ' + describe(c));
    }
    checkBlock(s.body, env, fn);
    if (s.else) {
      checkBlock(s.else, env, fn);
    }
  } else if (s.kind === 'return') {
    const t = s.value
      ? typeOf(s.value, env) : 'none';
    if (!same(t, fn.ret)) {
      fail(fn.name + '() must return ' +
        describe(fn.ret) + ', not ' +
        describe(t));
    }
  } else if (s.kind === 'fn') {
    checkFn(s, env);
  }
}
function checkBlock(body, env, fn) {
  const inner = new Map(env);
  for (const s of body) {
    check(s, inner, fn);
  }
}
function checkFn(s, env) {
  const ret = s.ret || 'none';
  const params = s.params.map(
    (p) => p.type);
  // Signature first, so the body
  // may call the function itself.
  env.set(s.name, { params, ret });
  const inner = new Map(env);
  for (const p of s.params) {
    inner.set(p.name, p.type);
  }
  checkBlock(s.body, inner,
    { name: s.name, ret });
  if (ret !== 'none' &&
      !returns(s.body)) {
    fail(s.name + '() must return ' +
      describe(ret) +
      ' on every path');
  }
}
function checkProgram(prog) {
  const env = new Map();
  for (const s of prog) {
    try {
      check(s, env, null);
    } catch (e) {
      return 'line ' + e.line + ': ' +
        e.message;
    }
  }
  return 'ok: ' + [...env].map(
    ([x, t]) => x + ': ' + show(t))
    .join(', ');
}

// Constructors for the trees.
const lit = (value) =>
  ({ kind: 'literal', value });
const v = (name) =>
  ({ kind: 'variable', name });
const bin = (op, left, right) =>
  ({ kind: 'binary', op, left, right });
const ret = (line, value) =>
  ({ kind: 'return', line, value });
const if_ = (cond, body, els) =>
  ({ kind: 'if', cond, body,
    else: els || null });
const fn = (line, name, params, r,
  body) => ({ kind: 'fn', line, name,
  params: params.map(([n, t]) =>
    ({ name: n, type: t })),
  ret: r, body });
const wh = [['w', 'number'],
  ['h', 'number']];

// fn area(w: number, h: number): number
//   { return w * h; }
console.log(checkProgram([
  fn(1, 'area', wh, 'number',
    [ret(2, bin('*', v('w'), v('h')))]),
]));
// ... { return "big"; }
console.log(checkProgram([
  fn(1, 'area', wh, 'number',
    [ret(2, lit('big'))]),
]));
// ... { return; }
console.log(checkProgram([
  fn(1, 'area', wh, 'number',
    [ret(2, null)]),
]));
// fn sign(n: number): string {
//   if n < 0 { return "-"; }
// }
console.log(checkProgram([
  fn(1, 'sign', [['n', 'number']],
    'string', [if_(bin('<', v('n'),
      lit(0)), [ret(2, lit('-'))])]),
]));
// fn sign(n: number): string {
//   if n < 0 { return "-"; }
//   else { return "+"; }
// }
console.log(checkProgram([
  fn(1, 'sign', [['n', 'number']],
    'string', [if_(bin('<', v('n'),
      lit(0)), [ret(2, lit('-'))],
      [ret(3, lit('+'))])]),
]));`,
  },
};

export const exercises = {
  'let-and-call': {
    title: 'Check annotated lets and calls',
    prompt: 'Write two functions. `checkLet(s, env)` checks `{ kind: \'let\', name, type, init }`, where `type` is the annotation or `null`: compute the value’s type, compare it with the annotation if there is one, and add the name to `env` (a `Map`) with its type. An empty list `[]` with a list annotation takes the annotation’s type. On a mismatch fail with `\'total\' is declared as number, but its value is a string` (the annotation printed with `show`, the value with `describe`). `checkCall(e, env)` checks `{ kind: \'call\', callee, args }` (the callee is always a variable here) and returns the result type, failing with `cannot call a number`, `area() takes 2 arguments but got 1` (use `plural`), or `argument 2 of area() must be a number, not a string`. `typeOf` already sends calls to `checkCall`.',
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
function plural(n, word) {
  return n + ' ' + word +
    (n === 1 ? '' : 's');
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
    case 'call':
      return checkCall(e, env);
  }
}


function checkLet(s, env) {
  // s.name, s.type (or null), s.init
  env.set(s.name, typeOf(s.init, env));
}

function checkCall(e, env) {
  // e.callee, e.args
  return undefined;
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
function plural(n, word) {
  return n + ' ' + word +
    (n === 1 ? '' : 's');
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
    case 'call':
      return checkCall(e, env);
  }
}

function checkLet(s, env) {
  const want = s.type;
  const empty = s.init.kind === 'list'
    && s.init.elements.length === 0;
  let got;
  if (want && want.list && empty) {
    got = want;
  } else {
    got = typeOf(s.init, env);
  }
  if (want && !same(want, got)) {
    fail("'" + s.name +
      "' is declared as " + show(want) +
      ', but its value is ' +
      describe(got));
  }
  env.set(s.name, want || got);
}

function checkCall(e, env) {
  const f = typeOf(e.callee, env);
  const name = e.callee.name + '()';
  if (!f.params) {
    fail('cannot call ' + describe(f));
  }
  const n = f.params.length;
  if (e.args.length !== n) {
    fail(name + ' takes ' +
      plural(n, 'argument') +
      ' but got ' + e.args.length);
  }
  e.args.forEach((a, i) => {
    const t = typeOf(a, env);
    const p = f.params[i];
    if (!same(t, p)) {
      fail('argument ' + (i + 1) +
        ' of ' + name + ' must be ' +
        describe(p) + ', not ' +
        describe(t));
    }
  });
  return f.ret;
}`,
    tests: `const L = (value) => ({ kind: 'literal', value });
const V = (name) => ({ kind: 'variable', name });
const B = (op, left, right) =>
  ({ kind: 'binary', op, left, right });
const List = (...elements) => ({ kind: 'list', elements });
const Call = (name, ...args) =>
  ({ kind: 'call', callee: V(name), args });
const Let = (name, type, init) =>
  ({ kind: 'let', name, type, init });
const fnT = (params, ret) => ({ params, ret });
const base = () => new Map([
  ['price', 'number'],
  ['area', fnT(['number', 'number'], 'number')],
  ['shout', fnT(['string'], 'string')],
  ['sum', fnT([{ list: 'number' }], 'number')],
]);
const err = (f) => {
  try { f(); } catch (x) { return x.message; }
  return 'no error';
};
test('let with a matching annotation', () => {
  const env = base();
  checkLet(Let('n', 'number', B('*', V('price'), L(2))), env);
  expect(show(env.get('n'))).toBe('number');
});
test('let without an annotation takes the value’s type', () => {
  const env = base();
  checkLet(Let('s', null, L('hi')), env);
  expect(show(env.get('s'))).toBe('string');
});
test('let with a mismatched annotation', () => {
  expect(err(() => checkLet(Let('total', 'number', L('3')), base())))
    .toBe("'total' is declared as number, but its value is a string");
});
test('an empty list takes its annotation', () => {
  const env = base();
  checkLet(Let('xs', { list: 'string' }, List()), env);
  expect(show(env.get('xs'))).toBe('[string]');
  expect(err(() => checkLet(Let('ys', null, List()), base())))
    .toBe('an empty list needs a type annotation');
});
test('a list annotation is still checked', () => {
  expect(err(() => checkLet(
    Let('xs', { list: 'string' }, List(L(1))), base())))
    .toBe("'xs' is declared as [string], but its value is a [number]");
});
test('a call has the function’s result type', () => {
  expect(show(typeOf(Call('area', L(2), V('price')), base())))
    .toBe('number');
  expect(show(typeOf(Call('sum', List(L(1), L(2))), base())))
    .toBe('number');
});
test('wrong number of arguments', () => {
  expect(err(() => typeOf(Call('area', L(2)), base())))
    .toBe('area() takes 2 arguments but got 1');
  expect(err(() => typeOf(Call('shout'), base())))
    .toBe('shout() takes 1 argument but got 0');
});
test('an argument of the wrong type', () => {
  expect(err(() => typeOf(Call('area', L(2), L('3')), base())))
    .toBe('argument 2 of area() must be a number, not a string');
});
test('calling something that is not a function', () => {
  expect(err(() => typeOf(Call('price'), base())))
    .toBe('cannot call a number');
});
test('an annotated let holding a call', () => {
  expect(err(() => checkLet(
    Let('n', 'number', Call('shout', L('hi'))), base())))
    .toBe("'n' is declared as number, but its value is a string");
});`,
    hints: [
      'In `checkLet`, there are two types: `want` (the annotation, maybe `null`) and `got` (from `typeOf`). Only compare them when there is an annotation. Which type goes into `env`?',
      'The empty list is special: when `s.init` is a list with no elements and the annotation is a list type (`want.list`), skip `typeOf` (it would fail) and use `want` as `got`. In `checkCall`, start with `const f = typeOf(e.callee, env);` and check that `f.params` exists.',
      'Then compare `e.args.length` with `f.params.length`, and finally loop over the arguments with `forEach((a, i) => ...)`, comparing `typeOf(a, env)` with `f.params[i]` using `same`; number the argument in the message as `i + 1`. Return `f.ret`.',
    ],
    walkthrough: `**How to think about it.** Both functions are the same move: two opinions about one thing, compared. In \`checkLet\` the opinions are the annotation and the value's computed type; in \`checkCall\` they are each parameter's declared type and the matching argument's computed type. So each function is: get the declared type, compute the actual type, compare with \`same\`, and either fail naming both or carry on. The only twist is the empty list, where the declared type is used *instead of* computing one, because the List rule cannot type \`[]\` at all.

**The solution, line by line.**

- \`const want = s.type;\` is the annotation, or \`null\` when there is none.
- \`const empty = s.init.kind === 'list' && s.init.elements.length === 0;\` spots the one value whose type must come from outside.
- \`if (want && want.list && empty) { got = want; }\`: an annotated empty list is checked against its annotation (any list annotation fits \`[]\`) rather than computed.
- \`else { got = typeOf(s.init, env); }\` computes the value's type in every other case; an unannotated \`[]\` reaches \`typeOf\` and fails there with \`an empty list needs a type annotation\`.
- \`if (want && !same(want, got)) { fail(...) }\` compares only when there is something to compare with, and names the declared type with \`show\` (\`number\`) and the computed one with \`describe\` (\`a string\`).
- \`env.set(s.name, want || got);\` records the name; when both exist they are the same type, so either would do.
- In \`checkCall\`, \`const f = typeOf(e.callee, env);\` is the first premise of the Call rule: what is the callee's type?
- \`const name = e.callee.name + '()';\` prepares \`area()\` for the messages.
- \`if (!f.params) { fail('cannot call ' + describe(f)); }\`: only function types have \`params\`, so a number or a list stops here.
- \`if (e.args.length !== n) { fail(...) }\` checks the count with Drip's own wording, \`takes 2 arguments but got 1\` (\`plural\` writes \`1 argument\` for one).
- \`e.args.forEach((a, i) => { ... })\` checks the remaining premises, one per argument: \`typeOf(a, env)\` against \`f.params[i]\`, failing with \`argument 2 of area() must be a number, not a string\` (humans count from 1, so \`i + 1\`).
- \`return f.ret;\` is the conclusion: the call has the signature's result type.

**Common wrong attempts.**

- Always calling \`typeOf(s.init, env)\`: \`let xs: [string] = [];\` then fails, although the annotation says exactly which list it is.
- Putting \`got\` into \`env\` without comparing: \`let total: number = "3";\` is accepted and \`total\` silently becomes a string, so the annotation means nothing.
- Checking the arguments without checking the count first: \`area(2)\` compares only one argument, finds it fine, and the call is accepted, though at run time it would fail with the arity error.
- Comparing \`f.params[i] === t\`: works for base types but rejects a correct \`sum([1, 2])\`, because two \`{ list: 'number' }\` objects are never \`===\`.`,
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
function plural(n, word) {
  return n + ' ' + word +
    (n === 1 ? '' : 's');
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
    case 'call':
      return checkCall(e, env);
  }
}

function checkLet(s, env) {
  const want = s.type;
  const empty = s.init.kind === 'list'
    && s.init.elements.length === 0;
  let got;
  got = typeOf(s.init, env);
  if (want && !same(want, got)) {
    fail("'" + s.name +
      "' is declared as " + show(want) +
      ', but its value is ' +
      describe(got));
  }
  env.set(s.name, want || got);
}

function checkCall(e, env) {
  const f = typeOf(e.callee, env);
  const name = e.callee.name + '()';
  if (!f.params) {
    fail('cannot call ' + describe(f));
  }
  const n = f.params.length;
  if (e.args.length !== n) {
    fail(name + ' takes ' +
      plural(n, 'argument') +
      ' but got ' + e.args.length);
  }
  e.args.forEach((a, i) => {
    const t = typeOf(a, env);
    const p = f.params[i];
    if (!same(t, p)) {
      fail('argument ' + (i + 1) +
        ' of ' + name + ' must be ' +
        describe(p) + ', not ' +
        describe(t));
    }
  });
  return f.ret;
}`,
        why: 'An annotated empty list goes to `typeOf`, which cannot type `[]`, so `let xs: [string] = [];` fails.',
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
function plural(n, word) {
  return n + ' ' + word +
    (n === 1 ? '' : 's');
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
    case 'call':
      return checkCall(e, env);
  }
}

function checkLet(s, env) {
  const want = s.type;
  const empty = s.init.kind === 'list'
    && s.init.elements.length === 0;
  let got;
  if (want && want.list && empty) {
    got = want;
  } else {
    got = typeOf(s.init, env);
  }
  if (want && !same(want, got)) {
    fail("'" + s.name +
      "' is declared as " + show(want) +
      ', but its value is ' +
      describe(got));
  }
  env.set(s.name, want || got);
}

function checkCall(e, env) {
  const f = typeOf(e.callee, env);
  const name = e.callee.name + '()';
  if (!f.params) {
    fail('cannot call ' + describe(f));
  }
  e.args.forEach((a, i) => {
    const t = typeOf(a, env);
    const p = f.params[i];
    if (!same(t, p)) {
      fail('argument ' + (i + 1) +
        ' of ' + name + ' must be ' +
        describe(p) + ', not ' +
        describe(t));
    }
  });
  return f.ret;
}`,
        why: 'The argument count is never checked, so `area(2)` is accepted.',
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
function plural(n, word) {
  return n + ' ' + word +
    (n === 1 ? '' : 's');
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
    case 'call':
      return checkCall(e, env);
  }
}

function checkLet(s, env) {
  const want = s.type;
  const empty = s.init.kind === 'list'
    && s.init.elements.length === 0;
  let got;
  if (want && want.list && empty) {
    got = want;
  } else {
    got = typeOf(s.init, env);
  }
  env.set(s.name, want || got);
}

function checkCall(e, env) {
  const f = typeOf(e.callee, env);
  const name = e.callee.name + '()';
  if (!f.params) {
    fail('cannot call ' + describe(f));
  }
  const n = f.params.length;
  if (e.args.length !== n) {
    fail(name + ' takes ' +
      plural(n, 'argument') +
      ' but got ' + e.args.length);
  }
  e.args.forEach((a, i) => {
    const t = typeOf(a, env);
    const p = f.params[i];
    if (!same(t, p)) {
      fail('argument ' + (i + 1) +
        ' of ' + name + ' must be ' +
        describe(p) + ', not ' +
        describe(t));
    }
  });
  return f.ret;
}`,
        why: 'The annotation is never compared with the value, so `let total: number = "3";` is accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which line does the checker reject?',
    options: [
      {
        t: '`let n: number = 6 * 7;`',
        why: '`6 * 7` is a number, which matches.',
      },
      {
        t: '`let s = "hi";`',
        why: 'No annotation, so there is nothing to compare; `s` becomes a `string`.',
      },
      {
        t: '`let names: [string] = [];`',
        why: 'The annotation supplies the empty list’s type.',
      },
      {
        t: '`let ok: bool = 1 < "2";`',
        correct: true,
        why: 'The value itself has no type: `<` needs two numbers, so the checker fails with a comparison error before it even reaches the annotation.',
      },
    ],
  },
  {
    q: '`area : fn(number, number) -> number`. What is wrong with `let a: string = area(3, 4);`?',
    options: [
      {
        t: 'Nothing',
        why: 'The call is fine, but its type is `number`, and the annotation says `string`.',
      },
      {
        t: '`\'a\' is declared as string, but its value is a number`',
        correct: true,
        why: 'The Call rule gives the call the signature’s result type, `number`, which differs from the annotation.',
      },
      {
        t: '`argument 1 of area() must be a string`',
        why: 'The arguments match the parameters; the result type is what disagrees.',
      },
    ],
  },
  {
    q: 'When the checker checks a call to `area`, does it look at `area`’s body?',
    options: [
      {
        t: 'Yes, to see what it returns',
        why: 'The signature already says what it returns; the body was checked against it once, at the declaration.',
      },
      {
        t: 'No: it checks the call against the signature only',
        correct: true,
        why: 'That is what makes a signature a contract: callers and body are checked against it separately.',
      },
      {
        t: 'Only if `area` is recursive',
        why: 'Recursion is why the signature goes into Γ before the body, but calls still use only the signature.',
      },
    ],
  },
  {
    q: '`fn sign(n: number): string { if n < 0 { return "-"; } }`. Why is it rejected?',
    options: [
      {
        t: '`n < 0` is not a `bool`',
        why: '`<` on two numbers gives a `bool`.',
      },
      {
        t: '`"-"` is not a string',
        why: 'It is a string, which matches the result type.',
      },
      {
        t: 'When `n` is not negative it falls off the end and returns `none`, not a string',
        correct: true,
        why: 'A function with a result type other than `none` must return on every path.',
      },
    ],
  },
  {
    q: 'Why must the checker add `fact`’s signature to Γ before checking the body of `fn fact(n: number): number { ... fact(n - 1) ... }`?',
    options: [
      {
        t: 'Because the body calls `fact`, and that call must be checked against the signature',
        correct: true,
        why: 'Without the signature in Γ, the recursive call would be an undefined variable.',
      },
      {
        t: 'Because Γ must be sorted',
        why: 'Order in Γ matters only for shadowing, not sorting.',
      },
      {
        t: 'It need not: the body could be checked first',
        why: 'Then `fact(n - 1)` would meet a name Γ does not hold.',
      },
    ],
  },
];
