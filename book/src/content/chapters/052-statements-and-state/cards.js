// Chapter 52 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'program-list': {
    q: 'What does Drip’s parser hand to the interpreter for a whole program?',
    a: 'A list (array) of statement trees, in source order. The interpreter runs them one by one.',
  },
  'stop-midway': {
    q: 'Statement 5 of a 7-statement Drip program causes a runtime error. What happens to the output of statements 1 to 4, and to statements 6 and 7?',
    a: 'Output from 1 to 4 stays: those statements really ran. Statements 6 and 7 never run.',
  },
  'execute-void': {
    q: 'Why does `execute` return `void` while `evaluate` returns a `Value`?',
    a: 'Statements are run only for their side effects (output, variables), not for a value.',
  },
  'expr-stmt-drop': {
    q: 'What does the Drip statement `1 + 2;` do?',
    a: 'It evaluates `1 + 2` and throws the value away. Nothing visible happens.',
  },
  'global-what': {
    q: 'What is a **global variable** in Drip, and where does the tree-walker keep it?',
    a: 'A variable declared at the top level, outside any block. It lives in one table (a `Map` from names to values) shared by the whole program.',
  },
  'let-vs-assign': {
    q: 'In Drip, what is the difference between `let a = 1;` and `a = 1;` when `a` does not exist yet?',
    a: '`let` defines `a`. The assignment is a runtime error, `Undefined variable \'a\'.`: assignment only overwrites an existing variable.',
  },
  'assign-returns': {
    q: 'What does `print a = 3;` print (when `a` exists), and why?',
    a: '`3`. Assignment is an expression whose value is the value assigned.',
  },
  'use-before-let': {
    q: 'Why is `print a; let a = 1;` an error in Drip, and what kind?',
    a: 'A runtime error: when the `print` runs, the `let` has not run yet, so `a` is not in the table.',
  },
  'nil-default': {
    q: 'What value does `a` hold after `let a;`?',
    a: '`nil`.',
  },
  'block-table': {
    q: 'Where does a `let` inside a `{ … }` block put its variable?',
    a: 'In a separate table that belongs to the block, thrown away at the closing `}`. Not in the globals.',
  },
};

export const examples = {
  'running-total': {
    title: 'State that lasts',
    lang: 'drip',
    code: `let total = 0;
total = total + 5;
total = total + 7;
print total;
let b = total = 100;
print b;
print total = 3;`,
  },
  'block-peek': {
    title: 'A block’s own variable',
    lang: 'drip',
    code: `let a = "outer";
{
  let a = "inner";
  print a;
}
print a;`,
  },
};

const runTests = `const N = (value) => ({ kind: 'num', value });
const V = (name) => ({ kind: 'var', name });
const Add = (left, right) =>
  ({ kind: 'add', left, right });
const Set_ = (name, value) =>
  ({ kind: 'assign', name, value });
const Let = (name, init = null) =>
  ({ kind: 'let', name, init });
const P = (expr) => ({ kind: 'print', expr });
const E = (expr) => ({ kind: 'expr', expr });
const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('let, then print', () => {
  expect(run([Let('x', N(2)), P(V('x'))]))
    .toEqual([2]);
});
test('state carries between statements', () => {
  expect(run([
    Let('x', N(2)),
    E(Set_('x', Add(V('x'), N(10)))),
    P(Add(V('x'), N(1))),
  ])).toEqual([13]);
});
test('let with no initializer is nil', () => {
  expect(run([Let('y'), P(V('y'))]))
    .toEqual([null]);
});
test('assignment is an expression', () => {
  expect(run([
    Let('a', N(0)),
    P(Set_('a', N(3))),
    P(V('a')),
  ])).toEqual([3, 3]);
});
test('an expression statement prints nothing', () => {
  expect(run([E(Add(N(1), N(2)))]))
    .toEqual([]);
});
test('let may redefine a global', () => {
  expect(run([Let('a', N(1)), Let('a', N(2)),
    P(V('a'))])).toEqual([2]);
});
test('using an undefined name fails', () => {
  expect(msg(() => run([P(V('z'))])))
    .toBe("Undefined variable 'z'.");
});
test('use before let fails', () => {
  expect(msg(() =>
    run([P(V('a')), Let('a', N(1))])))
    .toBe("Undefined variable 'a'.");
});
test('assigning an undefined name fails', () => {
  expect(msg(() => run([E(Set_('b', N(1)))])))
    .toBe("Undefined variable 'b'.");
});`;

export const exercises = {
  'mini-run': {
    title: 'A tiny interpreter with state',
    prompt:
      'Finish `run(prog)`. `prog` is a list of statements: `{ kind: \'let\', name, init }` (`init` may be `null`), `{ kind: \'print\', expr }` and `{ kind: \'expr\', expr }`. Expressions are `num`, `add` (already done), `{ kind: \'var\', name }` and `{ kind: \'assign\', name, value }`. Keep globals in the `Map`, push each printed value onto `out`, and return `out`. Using or assigning a name that is not defined throws `Error("Undefined variable \'NAME\'.")`. Follow Drip: `let` without an initializer gives `null`, `let` may redefine a name, and assignment returns its value.',
    starter: `function run(prog) {
  const globals = new Map();
  const out = [];
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'add':
        return evaluate(e.left) +
          evaluate(e.right);
      // 'var' and 'assign'
    }
  }
  function execute(s) {
    // 'let', 'print' and 'expr'
  }
  for (const s of prog) execute(s);
  return out;
}`,
    solution: `function run(prog) {
  const globals = new Map();
  const out = [];
  function check(name) {
    if (!globals.has(name)) {
      throw new Error(
        "Undefined variable '" +
        name + "'.");
    }
  }
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'add':
        return evaluate(e.left) +
          evaluate(e.right);
      case 'var':
        check(e.name);
        return globals.get(e.name);
      case 'assign': {
        const v = evaluate(e.value);
        check(e.name);
        globals.set(e.name, v);
        return v;
      }
    }
  }
  function execute(s) {
    switch (s.kind) {
      case 'let':
        globals.set(s.name, s.init
          ? evaluate(s.init) : null);
        return;
      case 'print':
        out.push(evaluate(s.expr));
        return;
      case 'expr':
        evaluate(s.expr);
        return;
    }
  }
  for (const s of prog) execute(s);
  return out;
}`,
    tests: runTests,
    hints: [
      'A `var` node is a lookup: check the name is in `globals`, then `globals.get(name)`. Write one small helper that throws the error, and use it in two places.',
      'An `assign` node evaluates its value first, then checks the name exists, then `set`s it, and finally **returns** the value.',
      'In `execute`: `let` always `set`s (no check), `print` pushes the value onto `out`, and `expr` evaluates and does nothing with the result.',
    ],
    walkthrough: `This is Drip's \`execute\` plus the globals part of \`evaluate\`, in about forty lines.

- **The program is a list.** The \`for...of\` at the bottom is the whole interpreter loop. If a statement throws, the loop stops there.
- **Lookups can fail.** \`check\` turns a missing name into Drip's runtime error. Both a use (\`var\`) and an assignment need it; \`let\` does not, because its job is to create.
- **Assignment overwrites, and returns.** Evaluating the right side first matches Drip. Returning \`v\` is what lets \`print a = 3\` print \`3\`.
- **\`let\` defines, always.** No check, so a second \`let a\` simply replaces the first, as in Drip. A missing initializer gives \`null\`, which is Drip's \`nil\`.
- **Side effects only.** \`execute\` returns nothing. \`print\` affects \`out\`; \`let\` affects \`globals\`; \`expr\` evaluates for any effect the expression has (like an assignment) and drops the value.`,
    wrong: [
      {
        code: `function run(prog) {
  const globals = new Map();
  const out = [];
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'add':
        return evaluate(e.left) +
          evaluate(e.right);
      case 'var':
        return globals.get(e.name);
      case 'assign': {
        const v = evaluate(e.value);
        globals.set(e.name, v);
        return v;
      }
    }
  }
  function execute(s) {
    switch (s.kind) {
      case 'let':
        globals.set(s.name, s.init
          ? evaluate(s.init) : null);
        return;
      case 'print':
        out.push(evaluate(s.expr));
        return;
      case 'expr':
        evaluate(s.expr);
        return;
    }
  }
  for (const s of prog) execute(s);
  return out;
}`,
        why: 'Nothing checks that a name exists. An undefined variable reads as `undefined`, and assigning one silently creates it, so typos in names go unnoticed. Drip makes both runtime errors.',
      },
      {
        code: `function run(prog) {
  const globals = new Map();
  const out = [];
  function check(name) {
    if (!globals.has(name)) {
      throw new Error(
        "Undefined variable '" +
        name + "'.");
    }
  }
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'add':
        return evaluate(e.left) +
          evaluate(e.right);
      case 'var':
        check(e.name);
        return globals.get(e.name);
      case 'assign': {
        const v = evaluate(e.value);
        check(e.name);
        globals.set(e.name, v);
        return v;
      }
    }
  }
  function execute(s) {
    switch (s.kind) {
      case 'let':
        globals.set(s.name, s.init
          ? evaluate(s.init) : null);
        return;
      default:
        out.push(evaluate(s.expr));
    }
  }
  for (const s of prog) execute(s);
  return out;
}`,
        why: 'This treats an expression statement like `print`. The whole point of an expression statement is that its value is dropped: `1 + 2;` must print nothing.',
      },
    ],
  },
  swap: {
    optional: true,
    lang: 'drip',
    title: 'Swap two variables',
    prompt:
      'Add statements between the `let`s and the `print`s so that the values of `a` and `b` are swapped. The program must print `right` and then `left`. Don’t change the `let`s or the `print`s.',
    starter: `let a = "left";
let b = "right";
// swap a and b here

print a;
print b;`,
    solution: `let a = "left";
let b = "right";
let t = a;
a = b;
b = t;
print a;
print b;`,
    tests: `right
left`,
    hints: [
      'Try `a = b; b = a;` and predict what it prints before you run it.',
      'The first assignment destroys the old value of `a`. Save it in a third variable first.',
    ],
    walkthrough: `Statements run in order, and each one sees what the earlier ones did. That is exactly why the obvious attempt fails.

- \`a = b;\` overwrites \`a\` with \`"right"\`. The old \`"left"\` is gone from the table.
- \`b = a;\` then copies the *new* \`a\`, so both print \`right\`.

The fix is a third global: \`let t = a;\` keeps \`"left"\` safe, then \`a = b;\` and \`b = t;\` finish the swap. Three statements, three side effects on the globals table, in an order that matters.`,
    wrong: [
      {
        code: `let a = "left";
let b = "right";
a = b;
b = a;
print a;
print b;`,
        why: 'Prints `right` twice. After `a = b;` the old value of `a` is gone, so `b = a;` copies `"right"` back.',
      },
      {
        code: `let a = "left";
let b = "right";
let t = a;
b = t;
a = b;
print a;
print b;`,
        why: 'The right three statements in the wrong order: `b` becomes `"left"` first, and then `a` copies it. Prints `left` twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does this Drip program print?\n```\nlet x = 1;\nx = x + 1;\nprint x;\nx = x * 10;\n```',
    options: [
      { t: '`1`', why: '`x = x + 1;` runs before the `print`, so `x` is already 2.' },
      { t: '`2`', correct: true, why: 'Statements run in order. The `print` sees `x` after the first assignment, and the last line runs after the `print`.' },
      { t: '`20`', why: 'The `x * 10` assignment comes after the `print`, so it can’t affect what was printed.' },
      { t: 'Nothing: assignments make no output', why: 'The `print` statement does make output.' },
    ],
  },
  {
    q: 'What happens when Drip runs `count = 1;` and no `count` has been declared?',
    options: [
      { t: 'It creates a global `count`', why: 'Some languages do that. In Drip only `let` creates a variable.' },
      { t: 'A syntax error, because `let` is missing', why: '`count = 1;` is a valid expression statement. The problem is only found when it runs.' },
      { t: 'Nothing happens', why: 'Drip does not silently ignore it.' },
      { t: 'A runtime error: `Undefined variable \'count\'.`', correct: true, why: 'Assignment looks the name up first, and the table has no `count`. Exit code 70.' },
    ],
  },
  {
    q: 'Which statement has **no** visible side effect?',
    options: [
      { t: '`5 * 2;`', correct: true, why: 'An expression statement evaluates `5 * 2` and drops the 10. Nothing is printed and no variable changes.' },
      { t: '`print 5 * 2;`', why: 'It writes `10` to the output.' },
      { t: '`let n = 5 * 2;`', why: 'It creates the variable `n`.' },
      { t: '`n = 5 * 2;` (with `n` defined)', why: 'It changes the value of `n`.' },
    ],
  },
  {
    q: 'What does `let a = 1; let b = a = 7; print a; print b;` print?',
    options: [
      { t: '`1` then `7`', why: '`a = 7` really assigns `a` before its value is used for `b`.' },
      { t: 'A syntax error', why: 'Assignment is an expression, so it can be an initializer.' },
      { t: '`7` then `7`', correct: true, why: 'The assignment sets `a` to 7 and its value, 7, initializes `b`.' },
      { t: '`7` then `nil`', why: 'The assignment expression has a value: the value assigned.' },
    ],
  },
  {
    q: 'A program prints two lines, then line 3 is `print zz;` where `zz` was never declared, then line 4 prints a third line. What is the output?',
    options: [
      { t: 'Only the error', why: 'That would be a syntax error. Using an unknown name parses fine, so lines 1 and 2 run.' },
      { t: 'All three lines, plus a warning', why: 'Drip does not warn and carry on. The runtime error stops the program.' },
      { t: 'The two lines, `nil`, and the third line', why: 'An unknown name is an error, not `nil`. `nil` is for a declared variable with no initializer.' },
      { t: 'The two lines, then `Undefined variable \'zz\'.` and `[line 3]`', correct: true, why: 'The statement list runs in order and stops at the runtime error. Line 4 never runs.' },
    ],
  },
  {
    q: 'Why can’t the parser report `print a; let a = 1;` as an error?',
    options: [
      { t: 'Because globals are put into the table as the program runs, so `a` only exists once its `let` has run', correct: true, why: 'Whether the name exists depends on what has run so far. It is checked at the moment of use, as a runtime error.' },
      { t: 'Because the parser doesn’t know what `let` means', why: 'The parser parses `let` declarations fine. It just doesn’t track which globals exist when.' },
      { t: 'Because it is not an error: it prints `nil`', why: 'It is an error: `Undefined variable \'a\'.`' },
      { t: 'Because the parser reads the program bottom to top', why: 'It reads top to bottom, and so does the interpreter.' },
    ],
  },
];
