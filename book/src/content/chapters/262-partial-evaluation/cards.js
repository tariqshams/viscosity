// Chapter 99 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'pe-what': {
    q: 'What is **partial evaluation**?',
    a: 'Specialising a program for the inputs that are already known, leaving a simpler program of the remaining inputs.',
  },
  'pe-static-dynamic': {
    q: 'In partial evaluation, what is the difference between a **static** and a **dynamic** input?',
    a: 'A static input is known now, at specialisation time; a dynamic one only arrives when the residual program runs.',
  },
  residual: {
    q: 'What is the **residual program**?',
    a: 'What is left after partial evaluation: the part that still depends on the unknown (dynamic) inputs.',
  },
  futamura: {
    q: 'What is the first Futamura projection?',
    a: 'Partially evaluating an interpreter with respect to one program, which gives a compiled version of that program.',
  },
  'pe-closure': {
    q: 'In the closure example, why does `f` run without ever looking at a node’s `op`?',
    a: 'Because `spec` looked at each `op` once, while building the closures; `f` is made of closures that only do the arithmetic.',
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
    a: 'A deoptimisation cycle: the code is compiled, invalidated, recompiled, and invalidated again.',
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

export const exercises = {
  peString: {
    title: 'A partial evaluator that writes code',
    prompt: 'Write `pe(n)`, which turns a tree of `{ op: \'num\', v }`, `{ op: \'arg\', i }`, `{ op: \'+\', l, r }` and `{ op: \'*\', l, r }` into a JavaScript expression string over an array `args`. A `num` becomes its digits, an `arg` becomes `args[i]`, and an operator becomes `(L op R)`. But if **both** sides came out as numbers, fold them: return the computed number as a string instead.',
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
    walkthrough: `**How to think about it.** This is a partial evaluator for a tiny language, where everything is known except \`args\`. Work through \`(1 + 2) * args[0]\` by hand. The leaf \`1\` becomes \`'1'\`, the leaf \`2\` becomes \`'2'\`; the \`+\` sees two numbers, so it can do the sum now and becomes \`'3'\`. The leaf \`args[0]\` stays as the text \`'args[0]'\`, because its value only arrives later. The \`*\` sees \`'3'\` and \`'args[0]'\`; one side is unknown, so it cannot compute anything and writes \`'(3 * args[0])'\`. So the plan is: specialise the children first, then decide, at each operator, whether both of *the results* are numbers.

**The solution, line by line.**

- \`if (n.op === 'num') { return String(n.v); }\` A number is static: its residual code is just its digits.
- \`if (n.op === 'arg') { return 'args[' + n.i + ']'; }\` An argument is dynamic: we cannot know its value, so we write the code that will fetch it later.
- \`const l = pe(n.l);\` and \`const r = pe(n.r);\` specialise both children first (bottom-up), so anything foldable underneath has already been folded.
- \`const lit = (s) => !isNaN(Number(s));\` A child "came out as a number" if its string converts to a number; \`Number('args[1]')\` is \`NaN\`, so code that mentions \`args\` never counts.
- \`if (lit(l) && lit(r)) {\` Only when both sides are known numbers can the operator be done now.
- \`const x = Number(l), y = Number(r);\` turns the two strings back into numbers.
- \`return String(n.op === '+' ? x + y : x * y);\` computes the result and returns it as code: a known value folds into a literal.
- \`return '(' + l + ' ' + n.op + ' ' + r + ')';\` Otherwise, glue the two pieces of residual code together with the operator, in parentheses so that the order of operations is kept.

The string that comes out is the residual program; turning it into a function with \`new Function('args', 'return ' + code)\` is the "compile" step, and when that function runs, the tree and the \`switch\` no longer exist. Compared with Truffle, this specialiser knows the language; Truffle's partial evaluator knows nothing about any guest language, and specialises the interpreter's *own* Java code, with the tree as the constant input.

**Common wrong attempts.**

- Never folding (always gluing strings): the output is correct code, but \`2 + 3\` stays \`(2 + 3)\`; partial evaluation should compute everything that is already known.
- Folding only when both children are literally \`num\` nodes (\`n.l.op === 'num'\`): \`(1 + 2) * args[0]\` works, but \`(1 + 2) * 4\` keeps \`(3 * 4)\`, because the left child was an operator node whose *result* was a number. Look at the specialised children, not the original ones.`,
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
        why: 'It only folds when both children are literally `num` nodes, so `(1 + 2) * args[0]` keeps `(1 + 2)`. Look at the specialised children, not the original ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Partially evaluating `round(v, up)` with `up = true` known gives:',
    options: [
      {
        t: 'A function of `up` alone',
        why: 'It is `v` that is still unknown.',
      },
      {
        t: 'The number `Math.ceil(v)`, computed now',
        why: '`v` isn’t known yet, so nothing can be computed for it.',
      },
      {
        t: 'The same function, unchanged',
        why: 'The branch on `up` can be removed, which is the point.',
      },
      {
        t: 'A function of `v` that just calls `Math.ceil(v)`',
        correct: true,
        why: 'The known input removes the branch; the residual program depends only on `v`.',
      },
    ],
  },
  {
    q: 'Which of these is the first Futamura projection?',
    options: [
      {
        t: 'Compiling a compiler with itself',
        why: 'That is a different, later idea; the first projection is about one interpreter and one program.',
      },
      {
        t: 'Interpreting a program twice and comparing the results',
        why: 'Nothing is compared; a new program is produced.',
      },
      {
        t: 'Partially evaluating an interpreter with the guest program as its static input, giving that program compiled',
        correct: true,
        why: 'The residual program takes only the guest program’s input, and does what the interpreter would have done with it.',
      },
      {
        t: 'Turning a compiled program back into source code',
        why: 'That is decompiling, which has nothing to do with partial evaluation.',
      },
    ],
  },
  {
    q: 'In the step-through, why can the specialiser inline `prog.l.execute`?',
    options: [
      {
        t: '`prog` is constant and `l` is a stable field, so `prog.l` is a known `Arg` node',
        correct: true,
        why: 'Stable fields of a constant are constants too, so the call has exactly one possible target.',
      },
      {
        t: 'Because JavaScript inlines every method call',
        why: 'Engines inline only when they can tell which function will be called.',
      },
      {
        t: 'Because `Arg` has only one method',
        why: 'What matters is knowing the receiver’s class, not how many methods it has.',
      },
      {
        t: 'Because `args` is known',
        why: '`args` is the dynamic input: it stays unknown in the residual program.',
      },
    ],
  },
  {
    q: 'A `@CompilationFinal` field that compiled code depends on must change. What does Truffle require?',
    options: [
      {
        t: 'Nothing: compiled code reads the new value next time',
        why: 'Compiled code has folded the old value in as a constant.',
      },
      {
        t: 'Recompile immediately, before changing the field',
        why: 'First the old code must stop being used.',
      },
      {
        t: 'Invalidate the compiled code (e.g. `transferToInterpreterAndInvalidate`) and continue in the interpreter',
        correct: true,
        why: 'Then the node re-specialises, and the code may be compiled again later.',
      },
      {
        t: 'Restart the program',
        why: 'Deoptimisation is invisible to the program.',
      },
    ],
  },
  {
    q: 'What is the main trade-off of Truffle’s approach?',
    options: [
      {
        t: 'It can only run one language at a time',
        why: 'Truffle is designed for many languages; that isn’t its trade-off.',
      },
      {
        t: 'It has no interpreter, so start-up is slow',
        why: 'It is built around an interpreter.',
      },
      {
        t: 'It cannot speculate',
        why: 'Speculation and deoptimisation are central to it.',
      },
      {
        t: 'The interpreter must be written so partial evaluation can see what is stable, and speculations must settle',
        correct: true,
        why: 'Truffle’s own documentation says interpreter code must be PE-friendly and warns about deoptimisation cycles.',
      },
    ],
  },
];
