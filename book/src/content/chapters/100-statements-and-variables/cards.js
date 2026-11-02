// Chapter 100 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'program-list': {
    q: 'What does Drip’s parser hand to the interpreter for a whole program?',
    a: 'A list (array) of statement trees, in source order. The interpreter runs them one by one.',
  },
  'stop-midway': {
    q: 'Statement 5 of a 7-statement Drip program causes a runtime error. What happens to the output of statements 1 to 4, and to statements 6 and 7?',
    a: 'Output from 1 to 4 stays, because those statements really ran. Statements 6 and 7 never run.',
  },
  'statement-no-value': {
    q: 'Why does no statement hand back a value, when every expression does?',
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
    a: '`let` defines `a`. The assignment is a runtime error, `undefined variable \'a\'`: assignment only overwrites an existing variable.',
  },
  'assign-returns': {
    q: 'What does `print a = 3;` print (when `a` exists), and why?',
    a: '`3`. Assignment is an expression whose value is the value assigned.',
  },
  'use-before-let': {
    q: 'Why is `print a; let a = 1;` an error in Drip, and what kind?',
    a: 'A runtime error: when the `print` runs, the `let` has not run yet, so `a` is not in the table.',
  },
  'none-default': {
    q: 'What value does `a` hold after `let a;`?',
    a: '`none` (held as `null` in the interpreter).',
  },
};

export const examples = {
  'running-total': {
    title: 'State that lasts',
    lang: 'drip',
    code: `let total = 0;
total += 5;
total = total + 7;
print total;
print total -= 2;
let total = "reset";
print total;`,
  },
};

const runTests = `const N = (value) => ({ kind: 'num', value });
const V = (name) => ({ kind: 'var', name });
const Add = (left, right) =>
  ({ kind: 'add', left, right });
const Set_ = (name, value, op = '=') =>
  ({ kind: 'assign', name, op, value });
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
test('x += e adds to the old value', () => {
  expect(run([
    Let('x', N(2)),
    E(Set_('x', N(5), '+=')),
    P(Set_('x', N(1), '+=')),
  ])).toEqual([8]);
});
test('let with no initialiser is none', () => {
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
    .toBe("undefined variable 'z'");
});
test('use before let fails', () => {
  expect(msg(() =>
    run([P(V('a')), Let('a', N(1))])))
    .toBe("undefined variable 'a'");
});
test('assigning an undefined name fails', () => {
  expect(msg(() => run([E(Set_('b', N(1)))])))
    .toBe("undefined variable 'b'");
  expect(msg(() =>
    run([E(Set_('c', N(1), '+='))])))
    .toBe("undefined variable 'c'");
});`;

const runSolution = `function run(prog) {
  const globals = new Map();
  const out = [];
  function check(name) {
    if (!globals.has(name)) {
      throw new Error(
        "undefined variable '" +
        name + "'");
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
        let v;
        if (e.op === '+=') {
          check(e.name);
          v = globals.get(e.name);
          v = v + evaluate(e.value);
        } else {
          v = evaluate(e.value);
          check(e.name);
        }
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
}`;

export const exercises = {
  'mini-run': {
    title: 'A tiny interpreter with state',
    prompt:
      'Finish `run(prog)`. `prog` is a list of statements: `{ kind: \'let\', name, init }` (`init` may be `null`), `{ kind: \'print\', expr }` and `{ kind: \'expr\', expr }`. Expressions are `num` and `add` (already done), `{ kind: \'var\', name }`, and `{ kind: \'assign\', name, op, value }` where `op` is `\'=\'` or `\'+=\'`. Keep globals in the `Map`, push each printed value onto `out`, and return `out`. Using or assigning a name that is not defined throws `Error("undefined variable \'NAME\'")`. Follow Drip: `let` without an initialiser gives `null` (Drip’s `none`), `let` may redefine a global, `x += e` adds to the old value, and an assignment returns the value it stored.',
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
    solution: runSolution,
    tests: runTests,
    hints: [
      'Start with `execute`, the easy half: `let` always `set`s (no check), `print` pushes the value onto `out`, and `expr` evaluates and does nothing with the result.',
      'A `var` node is a lookup that can fail: check the name is in `globals`, then `globals.get(name)`. Write one small helper that throws the error, because `assign` needs it too.',
      'For `assign` with `op === \'=\'`: evaluate the value, check the name, `set`, and **return** the value. For `+=`: check the name, read the old value, add the evaluated value to it, then `set` and return the sum.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`execute\` plus the global-variable part of \`evaluate\`, shrunk to about forty lines. Split it into the two questions the chapter asked. What does each *statement* change? (\`let\` changes the table, \`print\` changes the output, an expression statement changes nothing by itself.) And which *expressions* touch the table? (A name reads it; an assignment writes it.) Then decide where a missing name must be caught: everywhere the table is read or overwritten, but not in \`let\`, whose whole job is to create.

**The solution, line by line.**

- \`const globals = new Map(); const out = [];\` are the two things a program can change: its variables and its output.
- \`function check(name) { if (!globals.has(name)) { throw new Error("undefined variable '" + name + "'"); } }\` turns a missing name into Drip's runtime error, with Drip's exact wording. It is written once and used in two places.
- \`case 'var': check(e.name); return globals.get(e.name);\` reads a variable: check first, then look up.
- \`case 'assign': { let v; ... }\` handles both kinds of assignment. For \`+=\`, \`check(e.name)\` comes first, then \`v = globals.get(e.name);\` reads the old value, then \`v = v + evaluate(e.value);\` adds the right side: the old value is read once, before the right side, as in the companion. For \`=\`, \`v = evaluate(e.value);\` comes first and the check after, also as in the companion. Either way \`globals.set(e.name, v); return v;\` overwrites the entry and hands the value back, which is what lets \`print a = 3\` print \`3\`.
- \`case 'let': globals.set(s.name, s.init ? evaluate(s.init) : null); return;\` always defines, with no check, so a second top-level \`let a\` replaces the first; no initialiser means \`null\`, Drip's \`none\`.
- \`case 'print': out.push(evaluate(s.expr)); return;\` is the only statement that adds output.
- \`case 'expr': evaluate(s.expr); return;\` evaluates for any side effect the expression has (an assignment, say) and drops the value.
- \`for (const s of prog) execute(s); return out;\` is the whole interpreter loop: the program is a list, run in order. If a statement throws, the loop stops there.

**Common wrong attempts.**

- Leaving out \`check\`: an unknown name reads as \`undefined\`, and assigning one quietly creates it, so a typo in a name goes unnoticed. Drip makes both runtime errors.
- Treating \`expr\` like \`print\` (pushing its value): \`1 + 2;\` must print nothing.
- Writing \`+=\` as \`globals.get(e.name) + evaluate(e.value)\` without \`check\`: for a missing name that computes \`undefined + 1\`, which is \`NaN\` in JavaScript, and stores it.`,
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
        let v = evaluate(e.value);
        if (e.op === '+=') {
          v = globals.get(e.name) + v;
        }
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
        "undefined variable '" +
        name + "'");
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
        why: 'Two slips: `+=` is treated like `=` (the old value is ignored), and an expression statement is treated like `print`, so `1 + 2;` prints `3` when it must print nothing.',
      },
    ],
  },
  swap: {
    optional: true,
    lang: 'drip',
    title: 'Swap two variables',
    prompt:
      'Add statements between the `let`s and the `print`s so that the values of `a` and `b` are swapped. The program must print `right` and then `left`. Do not change the `let`s or the `print`s.',
    starter: `let a = "left";
let b = "right";
# swap a and b here

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
      'Try `a = b; b = a;` in your head and predict what it prints before you run it.',
      'The first assignment destroys the old value of `a`, because statements run in order and each sees what the last one did.',
      'Save the old value of `a` in a third global first: `let t = a;`, then `a = b;`, then `b = t;`.',
    ],
    walkthrough: `**How to think about it.** Statements run in order, and each one sees the table exactly as the earlier ones left it; that is exactly why the obvious attempt fails. Write the table down after each line: after \`a = b;\` it says \`a: "right", b: "right"\`, and \`"left"\` is gone for good. So before overwriting \`a\`, its value has to be kept somewhere else.

**The solution, line by line.**

- \`let t = a;\` defines a third global holding \`"left"\`, a copy that survives what comes next.
- \`a = b;\` overwrites \`a\` with \`"right"\`; the expression statement drops the assignment's value and keeps its side effect.
- \`b = t;\` overwrites \`b\` with the saved \`"left"\`.
- The two \`print\`s then show \`right\` and \`left\`.

**Common wrong attempts.**

- \`a = b; b = a;\` prints \`right\` twice: after the first line the old \`a\` is gone, so the second copies \`"right"\` back.
- The right three statements in the wrong order (\`let t = a; b = t; a = b;\`) print \`left\` twice: \`b\` becomes \`"left"\` first, and then \`a\` copies it.`,
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
    q: 'What does this Drip program print?\n```\nlet x = 1;\nx += 1;\nprint x;\nx = x * 10;\n```',
    options: [
      { t: '`1`', why: '`x += 1;` runs before the `print`, so `x` is already 2.' },
      { t: '`2`', correct: true, why: 'Statements run in order. The `print` sees `x` after the first assignment, and the last line runs after the `print`.' },
      { t: '`20`', why: 'The `x * 10` assignment comes after the `print`, so it cannot affect what was printed.' },
      { t: 'Nothing: assignments make no output', why: 'The `print` statement does make output.' },
    ],
  },
  {
    q: 'What happens when Drip runs `count = 1;` and no `count` has been declared?',
    options: [
      { t: 'It creates a global `count`', why: 'Some languages do that. In Drip only `let` creates a variable.' },
      { t: 'A compile error, because `let` is missing', why: '`count = 1;` is a valid expression statement; the problem is only found when it runs.' },
      { t: 'Nothing happens', why: 'Drip does not silently ignore it.' },
      { t: 'A runtime error: `undefined variable \'count\'`', correct: true, why: 'Assignment needs the name to exist, and the table has no `count`. Exit code 70.' },
    ],
  },
  {
    q: 'Which statement has **no** visible side effect?',
    options: [
      { t: '`5 * 2;`', correct: true, why: 'An expression statement evaluates `5 * 2` and drops the 10. Nothing is printed and no variable changes.' },
      { t: '`print 5 * 2;`', why: 'It writes `10` to the output.' },
      { t: '`let n = 5 * 2;`', why: 'It creates the variable `n`.' },
      { t: '`n += 2;` (with `n` defined)', why: 'It changes the value of `n`.' },
    ],
  },
  {
    q: 'What does `let a = 1; let b = a = 7; print a; print b;` print?',
    options: [
      { t: '`1` then `7`', why: '`a = 7` really assigns `a` before its value is used for `b`.' },
      { t: 'A compile error', why: 'Assignment is an expression, so it can be an initialiser.' },
      { t: '`7` then `none`', why: 'The assignment expression has a value: the value assigned.' },
      { t: '`7` then `7`', correct: true, why: 'The assignment sets `a` to 7 and its value, 7, initialises `b`.' },
    ],
  },
  {
    q: 'A program prints two lines, then line 3 is `print zz;` where `zz` was never declared, then line 4 prints a third line. What is the output?',
    options: [
      { t: 'Only the error', why: 'That would be a compile error. Using an unknown name parses fine, so lines 1 and 2 run.' },
      { t: 'The two lines, then `runtime error: undefined variable \'zz\'` and `at line 3 in script`', correct: true, why: 'The statement list runs in order and stops at the runtime error. Line 4 never runs.' },
      { t: 'The two lines, `none`, and the third line', why: 'An unknown name is an error, not `none`; `none` is for a declared variable with no initialiser.' },
      { t: 'All three lines, plus a warning', why: 'Drip does not warn and carry on. The runtime error stops the program.' },
    ],
  },
];
