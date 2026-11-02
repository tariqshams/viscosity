// Chapter 97 cards. Keys are stable ids: never rename them.

export const prompts = {
  'self-opt-what': {
    q: 'What does a node in a **self-optimizing AST** interpreter do?',
    a: 'It records the values it sees and rewrites itself into a version specialized for them, generalizing when they stop holding.',
  },
  'rewrite-on': {
    q: 'In Truffle’s DSL, what does `rewriteOn = ArithmeticException.class` on an int `+` mean?',
    a: 'If the int case ever throws (on overflow), this node never uses it again and the next, more general case runs instead.',
  },
  'one-way': {
    q: 'Why do specialization rewrites only go from specific to general?',
    a: 'So a node settles: a node that could flip back and forth would keep invalidating and recompiling its code.',
  },
  'replace-invalidates': {
    q: 'What else happens when a Truffle node calls `replace` to swap itself out?',
    a: 'Compiled code that relied on the old node is invalidated, and execution continues in the interpreter.',
  },
  'pe-what': {
    q: 'What is **partial evaluation**?',
    a: 'Specializing a program for the inputs that are already known, leaving a simpler program of the remaining inputs.',
  },
  'residual': {
    q: 'What is the **residual program**?',
    a: 'What is left after partial evaluation: the part that still depends on the unknown (dynamic) inputs.',
  },
  'futamura': {
    q: 'What is the first Futamura projection?',
    a: 'Partially evaluating an interpreter with respect to one program, which gives a compiled version of that program.',
  },
  'pe-constants': {
    q: 'Name two things Truffle’s partial evaluator treats as constants.',
    a: 'The root node being compiled, `static final` fields, and stable fields of constants such as `final` fields and `@Child` nodes.',
  },
  'compilation-final': {
    q: 'How is a `@CompilationFinal` field different from a `final` one?',
    a: 'It can still be changed (so a node can record what it has seen), but compiled code treats its current value as a constant.',
  },
  'deopt-cycle': {
    q: 'What goes wrong if a node’s recorded state never stops changing?',
    a: 'A deoptimization cycle: the code is compiled, invalidated, recompiled, and invalidated again.',
  },
  'two-copies': {
    q: 'What duplication does Truffle avoid that a classic interpreter-plus-JIT engine has?',
    a: 'Writing the language’s semantics twice, once in the interpreter and once in the compiler.',
  },
};

export const examples = {
  'closure-pe': {
    title: 'Partial evaluation by hand, with closures',
    code: `// a tiny AST: (args[0] + 2) * args[1]
const t = { op: '*',
  l: { op: '+',
    l: { op: 'arg', i: 0 },
    r: { op: 'num', v: 2 } },
  r: { op: 'arg', i: 1 } };

// the interpreter: decides every time
function run(n, args) {
  switch (n.op) {
    case 'num': return n.v;
    case 'arg': return args[n.i];
    case '+': return run(n.l, args) +
      run(n.r, args);
    case '*': return run(n.l, args) *
      run(n.r, args);
  }
}

// specialize: decide once, return code
function spec(n) {
  switch (n.op) {
    case 'num': {
      const v = n.v;
      return () => v;
    }
    case 'arg': {
      const i = n.i;
      return (args) => args[i];
    }
    case '+': {
      const l = spec(n.l);
      const r = spec(n.r);
      return (a) => l(a) + r(a);
    }
    case '*': {
      const l = spec(n.l);
      const r = spec(n.r);
      return (a) => l(a) * r(a);
    }
  }
}

const f = spec(t); // the tree is gone
console.log(run(t, [1, 9]), f([1, 9]));
console.log(run(t, [5, 3]), f([5, 3]));`,
  },
};

const LEAVES = `const Lit = (v) =>
  ({ execute: () => v });
const Var = (k) =>
  ({ execute: (env) => env[k] });
const isInt = (x) => (x | 0) === x;
const isNum = (x) =>
  typeof x === 'number';
`;

export const exercises = {
  selfAdd: {
    title: 'A + node that specializes itself',
    prompt:
      'Write `AddNode`, a self-specializing `+` node. Its children `l` and `r` have an `execute(env)` method. `state` starts as `\'uninit\'`. In `execute(env)`, evaluate both children, then: in `\'uninit\'` or `\'int\'`, if both values and their sum are int32 (`isInt`), set `\'int\'` and return the sum. Otherwise, unless the state is `\'generic\'`, if both are numbers set `\'double\'`. Otherwise set `\'generic\'`. Always return `a + b`. A node must **never** move back to a more specific state.',
    starter: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    return a + b;
  }
}`,
    solution: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    const s = this.state;
    if (s === 'uninit' || s === 'int') {
      if (isInt(a) && isInt(b) &&
          isInt(a + b)) {
        this.state = 'int';
        return a + b;
      }
    }
    if (s !== 'generic' &&
        isNum(a) && isNum(b)) {
      this.state = 'double';
      return a + b;
    }
    this.state = 'generic';
    return a + b;
  }
}`,
    tests: `const add = () =>
  new AddNode(Var('a'), Var('b'));
test('starts uninitialized', () => {
  expect(add().state).toBe('uninit');
});
test('ints specialize to int', () => {
  const n = add();
  expect(n.execute({ a: 2, b: 3 })).toBe(5);
  expect(n.state).toBe('int');
});
test('overflow widens to double', () => {
  const n = add();
  n.execute({ a: 1, b: 2 });
  const big = 2 ** 31 - 1;
  expect(n.execute({ a: big, b: 1 }))
    .toBe(2 ** 31);
  expect(n.state).toBe('double');
});
test('never back to int', () => {
  const n = add();
  n.execute({ a: 0.5, b: 1 });
  expect(n.state).toBe('double');
  n.execute({ a: 1, b: 2 });
  expect(n.state).toBe('double');
});
test('strings go generic, and stay', () => {
  const n = add();
  expect(n.execute({ a: 'a', b: 'b' }))
    .toBe('ab');
  expect(n.state).toBe('generic');
  expect(n.execute({ a: 1, b: 2 })).toBe(3);
  expect(n.state).toBe('generic');
});
test('works with literals too', () => {
  const n = new AddNode(Lit(4), Lit(0.25));
  expect(n.execute({})).toBe(4.25);
  expect(n.state).toBe('double');
});`,
    hints: [
      'Read `this.state` into a local `s` first, so each rule looks at the state the node had when this call began.',
      'The int case applies only in `\'uninit\'` or `\'int\'`, and it needs `isInt(a + b)` too: that is the overflow check, like `Math.addExact`.',
      'The double case applies in every state except `\'generic\'`. Everything else falls through to `\'generic\'`.',
    ],
    walkthrough: `\`\`\`js
const s = this.state;
if (s === 'uninit' || s === 'int') {
  if (isInt(a) && isInt(b) &&
      isInt(a + b)) {
    this.state = 'int';
    return a + b;
  }
}
if (s !== 'generic' &&
    isNum(a) && isNum(b)) {
  this.state = 'double';
  return a + b;
}
this.state = 'generic';
return a + b;
\`\`\`

- **The order is the lattice.** Each rule is only reachable from states at least as specific as it. A \`'double'\` node skips the int rule, a \`'generic'\` node skips both, so the state can only widen.
- **\`isInt(a + b)\` is the overflow guard.** Two int32s can sum to something outside int32, such as \`2 ** 31\`. GraalJS's int case uses \`Math.addExact\`, which throws in that case, and \`rewriteOn\` moves the node on.
- **The answer is always right.** Every path returns \`a + b\` with JavaScript's own rules. Specialization only changes how much checking a compiled version would need; it must never change the result.
- **In Truffle**, the compiler would read \`state\` as a constant (it is \`@CompilationFinal\`-like), keep only the current case, and turn the fall-through into a deoptimization.`,
    wrong: [
      {
        code: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    if (isInt(a) && isInt(b) &&
        isInt(a + b)) {
      this.state = 'int';
    } else if (isNum(a) && isNum(b)) {
      this.state = 'double';
    } else {
      this.state = 'generic';
    }
    return a + b;
  }
}`,
        why: 'The state is recomputed from scratch on every call, so a node that saw a double goes back to `\'int\'` when ints come again. Real nodes only widen; otherwise they would keep invalidating their compiled code.',
      },
      {
        code: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    const s = this.state;
    if (s === 'uninit' || s === 'int') {
      if (isInt(a) && isInt(b)) {
        this.state = 'int';
        return a + b;
      }
    }
    if (s !== 'generic' &&
        isNum(a) && isNum(b)) {
      this.state = 'double';
      return a + b;
    }
    this.state = 'generic';
    return a + b;
  }
}`,
        why: 'There is no overflow check: `2 ** 31 - 1 + 1` stays in the int state although the result is not an int32. Check `isInt(a + b)` as well.',
      },
    ],
  },
  peString: {
    optional: true,
    title: 'A partial evaluator that writes code',
    prompt:
      'Write `pe(n)`, which turns a tree of `{ op: \'num\', v }`, `{ op: \'arg\', i }`, `{ op: \'+\', l, r }` and `{ op: \'*\', l, r }` into a JavaScript expression string over an array `args`. A `num` becomes its digits, an `arg` becomes `args[i]`, and an operator becomes `(L op R)`. But if **both** sides came out as numbers, fold them: return the computed number as a string instead.',
    starter: `function pe(n) {
  return '0';
}`,
    solution: `function pe(n) {
  if (n.op === 'num') {
    return String(n.v);
  }
  if (n.op === 'arg') {
    return 'args[' + n.i + ']';
  }
  const l = pe(n.l);
  const r = pe(n.r);
  const lit = (s) => !isNaN(Number(s));
  if (lit(l) && lit(r)) {
    const x = Number(l), y = Number(r);
    return String(n.op === '+'
      ? x + y : x * y);
  }
  return '(' + l + ' ' + n.op + ' ' +
    r + ')';
}`,
    tests: `const num = (v) => ({ op: 'num', v });
const arg = (i) => ({ op: 'arg', i });
const add = (l, r) => ({ op: '+', l, r });
const mul = (l, r) => ({ op: '*', l, r });
test('leaves', () => {
  expect(pe(num(7))).toBe('7');
  expect(pe(arg(2))).toBe('args[2]');
});
test('residual code for unknowns', () => {
  expect(pe(add(arg(1), arg(2))))
    .toBe('(args[1] + args[2])');
});
test('constants fold, even nested', () => {
  expect(pe(add(num(2), num(3)))).toBe('5');
  expect(pe(mul(add(num(1), num(2)),
    arg(0)))).toBe('(3 * args[0])');
  expect(pe(mul(add(num(1), num(2)),
    num(4)))).toBe('12');
});
test('the result really runs', () => {
  const t = mul(add(arg(0), num(2)),
    add(num(1), num(1)));
  const f = new Function('args',
    'return ' + pe(t));
  expect(f([4])).toBe(12);
});`,
    hints: [
      'Handle the two leaves first. For an operator, call `pe` on both children before deciding anything.',
      'A child "came out as a number" if its string converts to a number: `!isNaN(Number(s))`. `Number(\'args[1]\')` is `NaN`.',
      'Only when both are numbers, compute `x + y` or `x * y` and return `String(...)`. Otherwise glue the strings with parentheses.',
    ],
    walkthrough: `\`\`\`js
const l = pe(n.l);
const r = pe(n.r);
const lit = (s) => !isNaN(Number(s));
if (lit(l) && lit(r)) {
  const x = Number(l), y = Number(r);
  return String(n.op === '+'
    ? x + y : x * y);
}
return '(' + l + ' ' + n.op + ' ' +
  r + ')';
\`\`\`

- **Bottom-up folding.** Because the children are specialized first, \`(1 + 2) * args[0]\` folds the inner sum to \`3\` before the outer node looks at it. The static part of the tree disappears entirely.
- **The residual program** is the string. Turning it into a function with \`new Function\` is the "compile" step; the tree and the \`switch\` no longer exist when it runs.
- **Compared with Truffle.** Here the specializer knows the language. Truffle's partial evaluator knows nothing about any guest language: it specializes the interpreter's *own* Java code, with the tree as the constant input.`,
    wrong: [
      {
        code: `function pe(n) {
  if (n.op === 'num') {
    return String(n.v);
  }
  if (n.op === 'arg') {
    return 'args[' + n.i + ']';
  }
  const l = pe(n.l);
  const r = pe(n.r);
  return '(' + l + ' ' + n.op + ' ' +
    r + ')';
}`,
        why: 'It produces correct code but never folds: `2 + 3` stays `(2 + 3)`. Partial evaluation should compute everything that is already known.',
      },
      {
        code: `function pe(n) {
  if (n.op === 'num') {
    return String(n.v);
  }
  if (n.op === 'arg') {
    return 'args[' + n.i + ']';
  }
  const l = pe(n.l);
  const r = pe(n.r);
  if (n.l.op === 'num' &&
      n.r.op === 'num') {
    return String(n.op === '+'
      ? n.l.v + n.r.v : n.l.v * n.r.v);
  }
  return '(' + l + ' ' + n.op + ' ' +
    r + ')';
}`,
        why: 'It only folds when both children are literally `num` nodes, so `(1 + 2) * args[0]` keeps `(1 + 2)`. Look at the specialized children, not the original ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a Truffle language implementer mainly write?',
    options: [
      { t: 'A bytecode compiler and a separate optimizing JIT', why: 'That is the classic design Truffle avoids.' },
      { t: 'An AST interpreter whose nodes specialize themselves', correct: true, why: 'Truffle derives compiled code from that interpreter by partial evaluation with the Graal compiler.' },
      { t: 'Machine code for each processor', why: 'The Graal compiler produces the machine code.' },
      { t: 'A transpiler to Java source', why: 'Nothing is translated to Java source; the interpreter itself is Java.' },
    ],
  },
  {
    q: 'A `+` node in the int state receives `2 ** 31 - 1` and `1`. What should it do?',
    options: [
      { t: 'Return a wrapped-around negative number', why: 'JavaScript’s `+` never wraps; the answer must be 2147483648.' },
      { t: 'Throw a TypeError', why: 'The addition is perfectly valid JavaScript.' },
      { t: 'Return the right sum, widen to a more general state, and never use the int case again', correct: true, why: 'That is `rewriteOn = ArithmeticException.class` with `Math.addExact`.' },
      { t: 'Return the sum and stay in the int state', why: 'The result isn’t an int32, so the int specialization’s guess has failed.' },
    ],
  },
  {
    q: 'Partially evaluating `round(v, up)` with `up = true` known gives:',
    options: [
      { t: 'A function of `up` alone', why: 'It is `v` that is still unknown.' },
      { t: 'The number `Math.ceil(v)`, computed now', why: '`v` isn’t known yet, so nothing can be computed for it.' },
      { t: 'The same function, unchanged', why: 'The branch on `up` can be removed, which is the point.' },
      { t: 'A function of `v` that just calls `Math.ceil(v)`', correct: true, why: 'The known input removes the branch; the residual program depends only on `v`.' },
    ],
  },
  {
    q: 'In the step-through, why can the specializer inline `prog.l.execute`?',
    options: [
      { t: '`prog` is constant and `l` is a stable field, so `prog.l` is a known `Arg` node', correct: true, why: 'Stable fields of a constant are constants too, so the call has exactly one possible target.' },
      { t: 'Because JavaScript inlines every method call', why: 'Engines inline only when they can tell which function will be called.' },
      { t: 'Because `Arg` has only one method', why: 'What matters is knowing the receiver’s class, not how many methods it has.' },
      { t: 'Because `args` is known', why: '`args` is the dynamic input: it stays unknown in the residual program.' },
    ],
  },
  {
    q: 'A `@CompilationFinal` field that compiled code depends on must change. What does Truffle require?',
    options: [
      { t: 'Nothing: compiled code reads the new value next time', why: 'Compiled code has folded the old value in as a constant.' },
      { t: 'Recompile immediately, before changing the field', why: 'First the old code must stop being used.' },
      { t: 'Invalidate the compiled code (e.g. `transferToInterpreterAndInvalidate`) and continue in the interpreter', correct: true, why: 'Then the node re-specializes, and the code may be compiled again later.' },
      { t: 'Restart the program', why: 'Deoptimization is invisible to the program.' },
    ],
  },
  {
    q: 'What is the main trade-off of Truffle’s approach?',
    options: [
      { t: 'It can only run one language at a time', why: 'Truffle is designed for many languages; that isn’t its trade-off.' },
      { t: 'It has no interpreter, so start-up is slow', why: 'It is built around an interpreter.' },
      { t: 'It cannot speculate', why: 'Speculation and deoptimization are central to it.' },
      { t: 'The interpreter must be written so partial evaluation can see what is stable, and speculations must settle', correct: true, why: 'Truffle’s own documentation says interpreter code must be PE-friendly and warns about deoptimization cycles.' },
    ],
  },
];
