// Chapter 59 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 67, 67, 67.

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
  'env-what': {
    q: 'What two things does a Drip environment hold?',
    a: 'A table (a `Map`) from names to values, and a reference to its enclosing (parent) environment.',
  },
  'env-parent': {
    q: 'Which environment has no parent?',
    a: 'The globals. Their `enclosing` is `null`.',
  },
  'define-current': {
    q: 'Where does `let x = 1;` put `x`?',
    a: 'In the current environment only. `define` never looks at parents.',
  },
  'lookup-order': {
    q: 'In what order does `get` look for a name?',
    a: 'The current environment first, then its parent, then that one’s parent, out to the globals. It stops at the first match.',
  },
  'undefined-end': {
    q: 'What happens when a lookup walks past the globals without finding the name?',
    a: 'It throws a runtime error: `runtime error: undefined variable \'name\'`',
  },
  'shadow-what': {
    q: 'What does it mean for an inner variable to *shadow* an outer one?',
    a: 'It has the same name, so lookups inside its block find it first and the outer one can’t be reached by name there.',
  },
  'assign-vs-let': {
    q: 'Inside a block, what is the difference between `n = 2;` and `let n = 2;` when an outer `n` exists?',
    a: '`n = 2;` walks out and changes the outer `n`. `let n = 2;` makes a new `n` in the block that shadows it.',
  },
  'block-new-env': {
    q: 'What is the parent of the environment a block statement creates?',
    a: 'Whatever environment was current when the block started.',
  },
  'finally-why': {
    q: 'Why does `executeBlock` restore the old environment in a `finally`?',
    a: 'So it is restored even when something is thrown out of the block, such as a runtime error.',
  },
  'if-truthy': {
    q: 'Does `if 0 { print "yes"; }` print anything in Drip? Why?',
    a: 'Yes, `yes`: `if` uses Drip’s truthiness, and only `none` and `false` are falsey.',
  },
  'else-if-nested': {
    q: 'How does the parser represent `if a { } else if b { } else { }`?',
    a: 'As an `if` whose `else` branch is a second `if` (with its own `else`). There is no separate else-if node.',
  },
  'completion-why': {
    q: 'Why does `execute` hand back a completion value (`NORMAL`, `BREAK`, `CONTINUE`, `RETURN`)?',
    a: 'So a `break` or `continue` buried inside ifs and blocks can stop each enclosing statement list on the way out, until the innermost loop handles it.',
  },
  'continue-skips': {
    q: 'In a `while` loop, what does `continue` skip, and what runs next?',
    a: 'It skips the rest of the body for this time round; next, the condition is tested again.',
  },
  'break-outside': {
    q: 'What happens with a `break;` that is not inside any loop?',
    a: 'A compile error, `\'break\' outside a loop`, so nothing runs (exit code 65).',
  },
  'desugar-what': {
    q: 'What is **desugaring**?',
    a: 'Rewriting a construct in terms of simpler constructs the language already has, so the rest of the implementation handles fewer kinds of node.',
  },
  'for-end-once': {
    q: 'In `for i in 0..n { n = 1; print i; }` with `n` at 3, how many times does the body run?',
    a: 'Three: the end of the range is evaluated once, before the loop starts, so changing `n` inside does not matter.',
  },
  'continue-trap': {
    q: 'Rewrite `for i in a..b` as a `while` with `k += 1` at the end of the body. What goes wrong if the body has a `continue`?',
    a: '`continue` jumps back to the test and skips `k += 1`, so `k` never grows and the loop never ends.',
  },
  'logical-not-binary': {
    q: 'Why can’t `&&` and `||` be ordinary binary nodes in the tree-walker?',
    a: 'A binary node evaluates both children first, but `&&` and `||` must skip the right side when the left already decides the answer.',
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
  shadow: {
    title: 'Assignment finds the nearest variable',
    lang: 'drip',
    code: `let x = "global";
{
  let x = "outer";
  {
    x = "changed";
    let y = x;
    print y;
  }
  print x;
}
print x;`,
  },
  loops: {
    title: 'for, continue and a running total',
    lang: 'drip',
    code: `let total = 0;
for i in 1..101 {
  if i % 3 == 0 {
    continue;
  }
  total += i;
}
print total;`,
  },
};

export const exercises = {
  'mini-run': {
    title: 'A tiny interpreter with state',
    prompt: 'Finish `run(prog)`. `prog` is a list of statements: `{ kind: \'let\', name, init }` (`init` may be `null`), `{ kind: \'print\', expr }` and `{ kind: \'expr\', expr }`. Expressions are `num` and `add` (already done), `{ kind: \'var\', name }`, and `{ kind: \'assign\', name, op, value }` where `op` is `\'=\'` or `\'+=\'`. Keep globals in the `Map`, push each printed value onto `out`, and return `out`. Using or assigning a name that is not defined throws `Error("undefined variable \'NAME\'")`. Follow Drip: `let` without an initialiser gives `null` (Drip’s `none`), `let` may redefine a global, `x += e` adds to the old value, and an assignment returns the value it stored.',
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
}`,
    tests: `const N = (value) => ({ kind: 'num', value });
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
});`,
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
    prompt: 'Add statements between the `let`s and the `print`s so that the values of `a` and `b` are swapped. The program must print `right` and then `left`. Do not change the `let`s or the `print`s.',
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
  environment: {
    title: 'An environment with a parent',
    prompt: 'Finish the `Environment` class. `define(name, v)` stores a value in **this** environment. `get(name)` returns the value from the nearest environment that has the name, checking this one first and then each parent. `assign(name, v)` changes the value in the nearest environment that has the name. If no environment in the chain has the name, `get` and `assign` must throw an `Error` whose message is `undefined variable \'NAME\'` (with the real name).',
    starter: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    // your code here
  }
  get(name) {
    // your code here
  }
  assign(name, v) {
    // your code here
  }
}

const g = new Environment();
g.define('a', 1);
const inner = new Environment(g);
console.log(inner.get('a'));`,
    solution: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    if (this.values.has(name)) {
      this.values.set(name, v);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, v);
      return;
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
}`,
    tests: `test('define then get', () => {
  const g = new Environment();
  g.define('a', 1);
  expect(g.get('a')).toBe(1);
});
test('get looks through parents', () => {
  const g = new Environment();
  g.define('a', 1);
  const b1 = new Environment(g);
  const b2 = new Environment(b1);
  expect(b2.get('a')).toBe(1);
});
test('inner shadows outer', () => {
  const g = new Environment();
  g.define('a', 'outer');
  const b = new Environment(g);
  b.define('a', 'inner');
  expect(b.get('a')).toBe('inner');
  expect(g.get('a')).toBe('outer');
});
test('assign changes the owner', () => {
  const g = new Environment();
  g.define('n', 1);
  const b = new Environment(g);
  b.assign('n', 2);
  expect(g.get('n')).toBe(2);
  expect(b.values.has('n')).toBe(false);
});
test('none (null) values are found', () => {
  const g = new Environment();
  g.define('z', null);
  const b = new Environment(g);
  expect(b.get('z')).toBe(null);
});
test('unknown names throw', () => {
  const b = new Environment(
    new Environment());
  let m1 = '';
  let m2 = '';
  try { b.get('q'); } catch (e) {
    m1 = e.message;
  }
  try { b.assign('q', 1); } catch (e) {
    m2 = e.message;
  }
  expect(m1).toBe("undefined variable 'q'");
  expect(m2).toBe("undefined variable 'q'");
});`,
    hints: [
      'Sort the methods first: which one must look only at this table, and which two must walk outwards to the parent?',
      '`define` is one line: put the pair in `this.values`.',
      '`get`: if `this.values.has(name)`, return the value. Otherwise, if there is a parent, return `this.parent.get(name)`. Otherwise throw.',
      '`assign` has the same shape as `get`, but sets the value where it finds the name instead of returning it.',
    ],
    walkthrough: `**How to think about it.** Sort the three methods into two kinds before writing any code. \`define\` is "here only": it is what \`let\` calls, and if it ever looked at a parent, an inner \`let\` could not shadow anything. \`get\` and \`assign\` are "walk the chain": check this table, and on a miss hand the same question to the parent. The parent runs the very same method, so the walk continues outwards by recursion, and only an environment with no parent (the globals) can reach the error.

**The solution, line by line.**

- \`constructor(parent = null) { this.values = new Map(); this.parent = parent; }\` is given: a table, and an arrow to the parent (\`null\` for the globals).
- \`define(name, v) { this.values.set(name, v); }\` writes into this table only. A second \`define\` of the same name in the same table replaces the old value, which is what Drip does for globals.
- \`if (this.values.has(name)) { return this.values.get(name); }\` in \`get\` asks "is the name *here*?" with \`has\`, not by testing the value, because a variable may hold \`null\` (Drip's \`none\`) or \`false\`.
- \`if (this.parent) { return this.parent.get(name); }\` passes the question outwards, and returns whatever the rest of the chain answers.
- The \`throw new Error(...)\` line is reached only when there is no parent left to ask, and uses Drip's exact message, \`undefined variable 'q'\` for the name \`q\`.
- \`assign\` has the same three steps, with \`this.values.set(name, v); return;\` where \`get\` returned the value: it writes into the first table that *has* the name, and never makes a new entry (the test "assign changes the owner" checks that the inner table stays empty).

**Common wrong attempts.**

- Writing \`assign\` as \`this.values.set(name, v)\`: that is \`define\` under another name. It makes a new variable in the inner table, so the outer \`n\` stays 1, and unknown names are silently created instead of throwing.
- Testing \`const v = this.values.get(name); if (v) return v;\`: a variable holding \`null\`, \`false\` or \`0\` looks missing, so the walk carries on past it and ends in a wrong error, or finds an outer variable with the same name.
- Forgetting the \`return\` before \`this.parent.get(name)\`: the method then falls through to the \`throw\` even when the parent found the name.`,
    wrong: [
      {
        code: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    this.values.set(name, v);
  }
}`,
        why: 'This `assign` is just `define`: it makes a new variable in the inner table instead of changing the outer one. The outer `n` stays 1, and unknown names are silently created instead of throwing.',
      },
      {
        code: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    const v = this.values.get(name);
    if (v) return v;
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    if (this.values.has(name)) {
      this.values.set(name, v);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, v);
      return;
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
}`,
        why: 'Testing `if (v)` treats a variable that holds `null` (or `false`, or `0`) as missing, so `get(\'z\')` throws. Use `this.values.has(name)` to ask whether the name exists.',
      },
    ],
  },
  shadowFix: {
    optional: true,
    lang: 'drip',
    title: 'Keep the outer variable',
    prompt: 'This Drip program prints `inner` twice, because the block changes the outer `x`. Change **one line** so that the block gets its own `x`: the program should print `inner` and then `outer`.',
    starter: `let x = "outer";
{
  x = "inner";
  print x;
}
print x;`,
    solution: `let x = "outer";
{
  let x = "inner";
  print x;
}
print x;`,
    tests: `inner
outer`,
    hints: [
      'Which statement creates a new variable in the current environment, and which one walks outward?',
      'Turn the assignment inside the block into a declaration, so the block has its own `x`.',
      'Put `let` in front of `x = "inner";`.',
    ],
    walkthrough: `**How to think about it.** Read the block's first line and ask which method it calls. \`x = "inner";\` is an assignment, so the interpreter walks the chain from the block's (empty) environment, finds \`x\` in the globals and overwrites it; after the \`}\` the global already says \`"inner"\`. To leave the global alone, the block needs an \`x\` of its own, and only \`let\` makes one.

**The solution, line by line.**

- \`let x = "outer";\` defines the global \`x\`.
- \`{\` starts a block: a new environment whose parent is the globals.
- \`let x = "inner";\` defines a second \`x\` in the block's environment. It is legal because it is in a different scope from the first.
- \`print x;\` looks \`x\` up starting in the block's environment, finds the inner one first (shadowing) and prints \`inner\`.
- \`}\` ends the block, and the interpreter switches back to the globals.
- \`print x;\` now finds the untouched global and prints \`outer\`.

**Common wrong attempts.**

- Changing the first line to \`let x = "inner";\` gives one \`x\` again, which never holds \`"outer"\`, so both lines print \`inner\`.
- Adding \`let x = x;\` at the top of the block, to "copy" the outer value in, is a compile error: \`cannot read 'x' in its own initialiser\`, because the inner \`x\` already exists while its initialiser runs.`,
    wrong: [
      {
        code: `let x = "inner";
{
  x = "inner";
  print x;
}
print x;`,
        why: 'Now there is only one `x` again, and it never holds "outer". The block still assigns to the global, so both lines print `inner`.',
      },
    ],
  },
  'mini-flow': {
    title: 'if, while, break, continue, && and ||',
    prompt: 'Finish this small interpreter. Expressions: `num`, `var`, `add`, `lt`, `eq` and `boom` (which throws) are done; add `{ kind: \'logical\', op, left, right }` with `op` `\'&&\'` or `\'||\'`, which short-circuits and returns an operand. Statements: `print` and `set` are done; add `{ kind: \'if\', cond, then, else }` (`then` is a list of statements, `else` a list or `null`), `{ kind: \'while\', cond, body }`, `{ kind: \'break\' }` and `{ kind: \'continue\' }`. Every `execute` returns a completion string, `\'normal\'`, `\'break\'` or `\'continue\'`, and `block(list)` runs a list, stopping at the first statement that does not finish normally and returning its completion. Use Drip truthiness (`truthy`).',
    starter: `function run(prog) {
  const vars = new Map();
  const out = [];
  const truthy = (v) =>
    v !== null && v !== false;
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'var':
        return vars.get(e.name);
      case 'add':
        return evaluate(e.left)
          + evaluate(e.right);
      case 'lt':
        return evaluate(e.left)
          < evaluate(e.right);
      case 'eq':
        return evaluate(e.left)
          === evaluate(e.right);
      case 'boom':
        throw new Error('boom');
      // 'logical'
    }
  }
  function block(list) {
    for (const s of list) {
      const c = execute(s);
      // stop early if c is not 'normal'
    }
    return 'normal';
  }
  function execute(s) {
    switch (s.kind) {
      case 'print':
        out.push(evaluate(s.expr));
        return 'normal';
      case 'set':
        vars.set(s.name,
          evaluate(s.value));
        return 'normal';
      // 'if', 'while', 'break',
      // 'continue'
    }
  }
  block(prog);
  return out;
}`,
    solution: `function run(prog) {
  const vars = new Map();
  const out = [];
  const truthy = (v) =>
    v !== null && v !== false;
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'var':
        return vars.get(e.name);
      case 'add':
        return evaluate(e.left)
          + evaluate(e.right);
      case 'lt':
        return evaluate(e.left)
          < evaluate(e.right);
      case 'eq':
        return evaluate(e.left)
          === evaluate(e.right);
      case 'boom':
        throw new Error('boom');
      case 'logical': {
        const l = evaluate(e.left);
        if (e.op === '||') {
          return truthy(l) ? l
            : evaluate(e.right);
        }
        return truthy(l)
          ? evaluate(e.right) : l;
      }
    }
  }
  function block(list) {
    for (const s of list) {
      const c = execute(s);
      if (c !== 'normal') return c;
    }
    return 'normal';
  }
  function execute(s) {
    switch (s.kind) {
      case 'print':
        out.push(evaluate(s.expr));
        return 'normal';
      case 'set':
        vars.set(s.name,
          evaluate(s.value));
        return 'normal';
      case 'if':
        if (truthy(evaluate(s.cond))) {
          return block(s.then);
        }
        if (s.else) {
          return block(s.else);
        }
        return 'normal';
      case 'while':
        while (truthy(
            evaluate(s.cond))) {
          const c = block(s.body);
          if (c === 'break') break;
        }
        return 'normal';
      case 'break':
        return 'break';
      case 'continue':
        return 'continue';
    }
  }
  block(prog);
  return out;
}`,
    tests: `const N = (value) => ({ kind: 'num', value });
const V = (name) => ({ kind: 'var', name });
const Add = (left, right) =>
  ({ kind: 'add', left, right });
const Lt = (left, right) =>
  ({ kind: 'lt', left, right });
const Eq = (left, right) =>
  ({ kind: 'eq', left, right });
const And = (left, right) =>
  ({ kind: 'logical', op: '&&', left, right });
const Or = (left, right) =>
  ({ kind: 'logical', op: '||', left, right });
const BOOM = { kind: 'boom' };
const P = (expr) => ({ kind: 'print', expr });
const S = (name, value) =>
  ({ kind: 'set', name, value });
const If = (cond, then, els = null) =>
  ({ kind: 'if', cond, then, else: els });
const W = (cond, body) =>
  ({ kind: 'while', cond, body });
const BR = { kind: 'break' };
const CO = { kind: 'continue' };
const inc = S('n', Add(V('n'), N(1)));
test('if picks a branch by truthiness', () => {
  expect(run([
    If(N(0), [P(N(1))], [P(N(2))]),
    If(N(null), [P(N(3))], [P(N(4))]),
    If(N(false), [P(N(5))]),
  ])).toEqual([1, 4]);
});
test('while counts', () => {
  expect(run([S('n', N(0)),
    W(Lt(V('n'), N(3)), [P(V('n')), inc]),
  ])).toEqual([0, 1, 2]);
});
test('break ends the loop', () => {
  expect(run([S('n', N(0)),
    W(N(true), [inc,
      If(Eq(V('n'), N(3)), [BR]),
      P(V('n'))]),
    P(N(99)),
  ])).toEqual([1, 2, 99]);
});
test('continue skips the rest', () => {
  expect(run([S('n', N(0)),
    W(Lt(V('n'), N(4)), [inc,
      If(Eq(V('n'), N(2)), [CO]),
      P(V('n'))]),
  ])).toEqual([1, 3, 4]);
});
test('&& and || return an operand', () => {
  expect(run([
    P(Or(N(null), N('d'))),
    P(And(N(1), N(2))),
    P(Or(N(0), N(5))),
  ])).toEqual(['d', 2, 0]);
});
test('they skip the right side', () => {
  expect(run([
    P(And(N(false), BOOM)),
    P(Or(N(1), BOOM)),
  ])).toEqual([false, 1]);
});`,
    hints: [
      'Start with `block`: if `c !== \'normal\'`, return `c` at once, so the rest of the list never runs. That one line is what carries a `break` out of an `if`.',
      '`break` and `continue` only `return` their own name. `if` evaluates the condition, then returns whatever `block(s.then)` (or `block(s.else)`) returns, so the completion keeps travelling outwards.',
      '`while`: loop while `truthy(evaluate(s.cond))`; inside, `const c = block(s.body); if (c === \'break\') break;` (a `continue` needs no code: the loop just goes round). For `logical`, evaluate the left side; for `||` return it if truthy, else evaluate the right; for `&&` the other way round.',
    ],
    walkthrough: `**How to think about it.** There are three separate jobs here, and it helps to do them in this order. First, the plumbing: a \`break\` deep inside an \`if\` inside a loop body must stop the \`if\`'s list, then the body's list, and only then reach the loop. The completion string is the message passed up, and \`block\` is the one place that must stop early when it sees a message that is not \`'normal'\`. Second, the statements themselves, which are short once the plumbing exists. Third, \`&&\` and \`||\`, which must not evaluate their right side when the left decides the answer; the \`boom\` tests check that by throwing if it ever runs.

**The solution, line by line.**

- \`case 'logical': { const l = evaluate(e.left); ... }\` always evaluates the left side first.
- \`if (e.op === '||') { return truthy(l) ? l : evaluate(e.right); }\`: a truthy left side decides an "or", so return it without touching the right; otherwise the answer is whatever the right side is.
- \`return truthy(l) ? evaluate(e.right) : l;\`: a falsey left side decides an "and", so return it; otherwise the right side is the answer. Either way the result is an operand, so \`none || 'd'\` is \`'d'\` and \`0 || 5\` is \`0\` (zero is truthy in Drip).
- In \`block\`, \`const c = execute(s); if (c !== 'normal') return c;\` stops the list at the first \`break\` or \`continue\` and passes it up; \`return 'normal';\` after the loop means the whole list finished.
- \`case 'if':\` evaluates the condition with \`truthy\`, and returns \`block(s.then)\`, or \`block(s.else)\` if there is an \`else\`, or \`'normal'\`. Returning the branch's completion (rather than always \`'normal'\`) is what lets a \`break\` inside the \`if\` reach the loop.
- \`case 'while':\` loops while the condition is truthy. \`const c = block(s.body);\` runs the body once; \`if (c === 'break') break;\` ends the JavaScript loop. A \`'continue'\` needs no line at all: the body's list has already stopped, so the loop goes straight back to its condition. The loop itself finishes normally, so it returns \`'normal'\`, and a \`break\` never escapes further than the innermost loop.
- \`case 'break': return 'break';\` and \`case 'continue': return 'continue';\` do nothing but report.
- \`block(prog); return out;\` runs the program, which is itself a list.

**Common wrong attempts.**

- Making \`if\` always return \`'normal'\` after running its branch: the \`break\` in \`If(Eq(V('n'), N(3)), [BR])\` is swallowed, and the loop runs for ever (the checker times it out).
- Returning \`c\` from \`while\` when it is \`'break'\`: the \`break\` then escapes the loop and stops the statements after it, so \`P(N(99))\` never prints.
- Writing \`logical\` as \`const r = evaluate(e.right)\` up front, like a binary operator: the \`boom\` tests fail because the right side ran.
- Returning \`truthy(l) || truthy(r)\`: that produces a boolean, but Drip returns the operand, so \`none || 'd'\` must be \`'d'\`, not \`true\`.`,
    wrong: [
      {
        code: `function run(prog) {
  const vars = new Map();
  const out = [];
  const truthy = (v) =>
    v !== null && v !== false;
  function evaluate(e) {
    switch (e.kind) {
      case 'num': return e.value;
      case 'var':
        return vars.get(e.name);
      case 'add':
        return evaluate(e.left)
          + evaluate(e.right);
      case 'lt':
        return evaluate(e.left)
          < evaluate(e.right);
      case 'eq':
        return evaluate(e.left)
          === evaluate(e.right);
      case 'boom':
        throw new Error('boom');
      case 'logical': {
        const l = evaluate(e.left);
        const r = evaluate(e.right);
        if (e.op === '||') {
          return truthy(l) ? l : r;
        }
        return truthy(l) ? r : l;
      }
    }
  }
  function block(list) {
    for (const s of list) {
      const c = execute(s);
      if (c !== 'normal') return c;
    }
    return 'normal';
  }
  function execute(s) {
    switch (s.kind) {
      case 'print':
        out.push(evaluate(s.expr));
        return 'normal';
      case 'set':
        vars.set(s.name,
          evaluate(s.value));
        return 'normal';
      case 'if':
        if (truthy(evaluate(s.cond))) {
          return block(s.then);
        }
        if (s.else) {
          return block(s.else);
        }
        return 'normal';
      case 'while':
        while (truthy(
            evaluate(s.cond))) {
          const c = block(s.body);
          if (c === 'break') break;
        }
        return 'normal';
      case 'break':
        return 'break';
      case 'continue':
        return 'continue';
    }
  }
  block(prog);
  return out;
}`,
        why: 'The statements are right, but `logical` evaluates its right side before looking at the left, so `false && boom` throws: there is no short circuit.',
      },
    ],
  },
  'skip-threes': {
    optional: true,
    lang: 'drip',
    title: 'Stop at the first big square',
    prompt: 'Using `for i in 1..100`, print each square `i * i` in order, but skip the squares of multiples of 3 (use `continue`), and stop the loop (use `break`) at the first square greater than 50, without printing it. Finally print `done`.',
    starter: `for i in 1..100 {
  print i * i;
}
print "done";`,
    solution: `for i in 1..100 {
  let sq = i * i;
  if sq > 50 {
    break;
  }
  if i % 3 == 0 {
    continue;
  }
  print sq;
}
print "done";`,
    tests: `1
4
16
25
49
done`,
    hints: [
      'Work out the expected output by hand first: the squares are 1, 4, 9, 16, 25, 36, 49, 64, ... Which are skipped, and where does it stop?',
      'Inside the body, keep the square in a variable, `let sq = i * i;`; then two `if`s decide whether to stop or to skip before the `print`.',
      'Check `sq > 50` first with `break`, then `i % 3 == 0` with `continue`, then `print sq;`.',
    ],
    walkthrough: `**How to think about it.** Write out what should happen for each \`i\`: 1 prints 1, 2 prints 4, 3 is a multiple of 3 so 9 is skipped, 4 prints 16, 5 prints 25, 6 is skipped (36), 7 prints 49, and 8 gives 64, the first square over 50, so the loop stops there. Two different exits: \`continue\` ends only this time round, \`break\` ends the whole loop. Both must come *before* the \`print\`, or the unwanted square is printed first.

**The solution, line by line.**

- \`for i in 1..100 {\` runs the body with \`i\` from 1 up to 99; it will be stopped long before that.
- \`let sq = i * i;\` keeps the square in a variable local to this time round (a fresh \`sq\` each time, in the body's own environment).
- \`if sq > 50 { break; }\` ends the loop at 64: the \`break\` statement hands back \`BREAK\`, the \`if\`'s block passes it up, and the loop stops.
- \`if i % 3 == 0 { continue; }\` skips 9 and 36: \`%\` is the remainder, so a remainder of 0 means a multiple of 3, and \`continue\` jumps to the next \`i\`.
- \`print sq;\` prints the squares that survived both tests.
- \`print "done";\` runs after the loop, however it ended.

**Common wrong attempts.**

- Testing \`i > 50\` instead of \`sq > 50\` stops far too late, printing squares up to 2500.
- Putting \`print sq;\` before the two \`if\`s prints 9, 36 and 64 too, because the tests come too late to stop them.
- Using \`break\` for the multiples of 3 ends the whole loop at 9, so only 1 and 4 are printed.`,
    wrong: [
      {
        code: `for i in 1..100 {
  let sq = i * i;
  if i % 3 == 0 {
    break;
  }
  if sq > 50 {
    break;
  }
  print sq;
}
print "done";`,
        why: '`break` on the multiples of 3 ends the whole loop at `i = 3`, so only `1` and `4` print. Skipping one time round is `continue`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this Drip program print?
\`\`\`
let x = 1;
x += 1;
print x;
x = x * 10;
\`\`\``,
    options: [
      {
        t: '`1`',
        why: '`x += 1;` runs before the `print`, so `x` is already 2.',
      },
      {
        t: '`2`',
        correct: true,
        why: 'Statements run in order. The `print` sees `x` after the first assignment, and the last line runs after the `print`.',
      },
      {
        t: '`20`',
        why: 'The `x * 10` assignment comes after the `print`, so it cannot affect what was printed.',
      },
      {
        t: 'Nothing: assignments make no output',
        why: 'The `print` statement does make output.',
      },
    ],
  },
  {
    q: 'What happens when Drip runs `count = 1;` and no `count` has been declared?',
    options: [
      {
        t: 'It creates a global `count`',
        why: 'Some languages do that. In Drip only `let` creates a variable.',
      },
      {
        t: 'A compile error, because `let` is missing',
        why: '`count = 1;` is a valid expression statement; the problem is only found when it runs.',
      },
      {
        t: 'Nothing happens',
        why: 'Drip does not silently ignore it.',
      },
      {
        t: 'A runtime error: `undefined variable \'count\'`',
        correct: true,
        why: 'Assignment needs the name to exist, and the table has no `count`. Exit code 70.',
      },
    ],
  },
  {
    q: 'Which statement has **no** visible side effect?',
    options: [
      {
        t: '`5 * 2;`',
        correct: true,
        why: 'An expression statement evaluates `5 * 2` and drops the 10. Nothing is printed and no variable changes.',
      },
      {
        t: '`print 5 * 2;`',
        why: 'It writes `10` to the output.',
      },
      {
        t: '`let n = 5 * 2;`',
        why: 'It creates the variable `n`.',
      },
      {
        t: '`n += 2;` (with `n` defined)',
        why: 'It changes the value of `n`.',
      },
    ],
  },
  {
    q: 'What does `let a = 1; let b = a = 7; print a; print b;` print?',
    options: [
      {
        t: '`1` then `7`',
        why: '`a = 7` really assigns `a` before its value is used for `b`.',
      },
      {
        t: 'A compile error',
        why: 'Assignment is an expression, so it can be an initialiser.',
      },
      {
        t: '`7` then `none`',
        why: 'The assignment expression has a value: the value assigned.',
      },
      {
        t: '`7` then `7`',
        correct: true,
        why: 'The assignment sets `a` to 7 and its value, 7, initialises `b`.',
      },
    ],
  },
  {
    q: 'A program prints two lines, then line 3 is `print zz;` where `zz` was never declared, then line 4 prints a third line. What is the output?',
    options: [
      {
        t: 'Only the error',
        why: 'That would be a compile error. Using an unknown name parses fine, so lines 1 and 2 run.',
      },
      {
        t: 'The two lines, then `runtime error: undefined variable \'zz\'` and `at line 3 in script`',
        correct: true,
        why: 'The statement list runs in order and stops at the runtime error. Line 4 never runs.',
      },
      {
        t: 'The two lines, `none`, and the third line',
        why: 'An unknown name is an error, not `none`; `none` is for a declared variable with no initialiser.',
      },
      {
        t: 'All three lines, plus a warning',
        why: 'Drip does not warn and carry on. The runtime error stops the program.',
      },
    ],
  },
  {
    q: `What does this Drip program print?
\`\`\`
let a = 1;
{
  let a = 2;
  print a;
}
print a;
\`\`\``,
    options: [
      {
        t: '`2` then `2`',
        why: 'That is what one global table would do. With environments, the inner `let` makes a separate `a`.',
      },
      {
        t: '`2` then `1`',
        correct: true,
        why: 'The inner `a` shadows the outer one inside the block and disappears at `}`.',
      },
      {
        t: '`1` then `1`',
        why: 'Inside the block, the lookup finds the inner `a` first, which is 2.',
      },
      {
        t: 'A compile error: `a` is declared twice',
        why: 'The two declarations are in different scopes, so there is no clash; only two `let a` in the same block are refused.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 1;
{
  n = n + 1;
}
print n;
\`\`\``,
    options: [
      {
        t: '`1`',
        why: 'There is no `let` in the block, so nothing new is defined there. The assignment changes the outer `n`.',
      },
      {
        t: 'A runtime error: `n` is not defined in the block',
        why: 'The lookup walks to the parent and finds the global `n`.',
      },
      {
        t: '`none`',
        why: '`n` holds a number the whole time.',
      },
      {
        t: '`2`',
        correct: true,
        why: '`assign` walks out of the block’s empty environment and updates the global `n`.',
      },
    ],
  },
  {
    q: 'Which environment does `define` write to?',
    options: [
      {
        t: 'The current environment, always',
        correct: true,
        why: '`define` never looks at parents. That is what lets an inner `let` shadow an outer variable.',
      },
      {
        t: 'The nearest environment that already has the name',
        why: 'That is `assign`.',
      },
      {
        t: 'The globals',
        why: 'Only when the globals are the current environment.',
      },
      {
        t: 'A new environment it creates',
        why: 'Environments are created by blocks (and later, calls), not by `define`.',
      },
    ],
  },
  {
    q: 'A lookup for `b` starts in block 2, whose parent is block 1, whose parent is the globals. Only the globals have `b`. How many tables are checked?',
    options: [
      {
        t: 'One',
        why: 'Block 2 doesn’t have `b`, so the walk must continue.',
      },
      {
        t: 'Two',
        why: 'Block 1 doesn’t have it either.',
      },
      {
        t: 'Three',
        correct: true,
        why: 'Block 2, block 1, then the globals, where it is found.',
      },
      {
        t: 'Every environment ever created',
        why: 'Only the chain of parents from the current one is searched. Discarded environments aren’t on it.',
      },
    ],
  },
  {
    q: 'Why does `executeBlock` use `try { ... } finally { this.env = previous; }`?',
    options: [
      {
        t: 'To catch runtime errors and print them',
        why: 'There is no catch. The error still travels on; `finally` only does clean-up on the way.',
      },
      {
        t: 'To make blocks run faster',
        why: '`finally` is about correctness, not speed.',
      },
      {
        t: 'Because JavaScript requires `try` around loops',
        why: 'It doesn’t.',
      },
      {
        t: 'So the previous environment is restored even if a statement throws',
        correct: true,
        why: 'Without it, a throw would leave `this.env` pointing at the inner block’s environment.',
      },
    ],
  },
  {
    q: 'In the program `{ let z = 1; } print z;` what happens?',
    options: [
      {
        t: 'It prints `1`',
        why: '`z` lived in the block’s environment, which is no longer on the chain.',
      },
      {
        t: 'It prints `none`',
        why: 'Drip does not make up a value for a missing name; it reports an error.',
      },
      {
        t: 'A runtime error: `undefined variable \'z\'`',
        correct: true,
        why: 'After the block, the current environment is the globals, and they have no `z`.',
      },
      {
        t: 'A compile error',
        why: 'The program parses and resolves fine: `z` outside the block is treated as a global. The problem only shows up when `print z` runs.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 0;
while n < 5 {
  n += 1;
  if n == 2 { continue; }
  if n == 4 { break; }
  print n;
}
\`\`\``,
    options: [
      {
        t: '`1`, `2`, `3`, `4`',
        why: '`continue` skips the `print` when `n` is 2, and `break` ends the loop before 4 is printed.',
      },
      {
        t: '`1`, `3`',
        correct: true,
        why: '1 prints; 2 is skipped by `continue`; 3 prints; at 4 the `break` ends the loop.',
      },
      {
        t: '`1`',
        why: '`continue` does not end the loop; it only skips the rest of this time round.',
      },
      {
        t: 'It never ends',
        why: '`n += 1` comes before the `continue`, so `n` still grows.',
      },
    ],
  },
  {
    q: 'How does a `break` inside an `if` inside a loop body reach the loop?',
    options: [
      {
        t: 'It throws a JavaScript exception that the loop catches',
        why: 'Some interpreters do that, but the companion returns a completion value instead.',
      },
      {
        t: 'The `if` checks whether it is inside a loop',
        why: 'The `if` knows nothing about loops; it only passes its branch’s completion up.',
      },
      {
        t: 'Each `execute` returns `BREAK`, and every enclosing statement list stops and passes it up until the loop handles it',
        correct: true,
        why: '`executeBlock` stops at the first completion that is not `NORMAL` and returns it, so the value climbs to the innermost loop.',
      },
      {
        t: 'The parser moves the `break` to the end of the loop',
        why: 'The parser leaves `break` where it is; the interpreter handles it while running.',
      },
    ],
  },
  {
    q: 'What does `print none || 0;` print in Drip?',
    options: [
      {
        t: '`true`',
        why: 'Drip’s `||` returns an operand, not a boolean.',
      },
      {
        t: '`none`',
        why: '`none` is falsey, so `||` moves on to the right side.',
      },
      {
        t: '`false`',
        why: 'Nothing here is converted to a boolean.',
      },
      {
        t: '`0`',
        correct: true,
        why: 'The left side is falsey, so the result is the right side, `0`.',
      },
    ],
  },
  {
    q: 'Why does the companion keep a real `for` node instead of desugaring `for i in a..b` into a `while` loop?',
    options: [
      {
        t: 'A naive rewrite gets `continue` wrong (it skips the counter step), needs hidden variables, and must still give each time round a fresh `i`',
        correct: true,
        why: 'Running `for` directly makes all three behaviours easy to get right.',
      },
      {
        t: 'Because `while` is slower than `for` in JavaScript',
        why: 'Speed is not the reason; correctness is.',
      },
      {
        t: 'Because desugaring is not allowed in a tree-walking interpreter',
        why: 'It is allowed: `else if` is desugared by the companion’s parser.',
      },
      {
        t: 'Because Drip has no `while` loop',
        why: 'It does; the rewrite would use it.',
      },
    ],
  },
  {
    q: 'What does `print false && missing;` do when `missing` was never declared?',
    options: [
      {
        t: 'A runtime error: `undefined variable \'missing\'`',
        why: 'The right side is never evaluated, so the name is never looked up.',
      },
      {
        t: 'Prints `false`',
        correct: true,
        why: '`&&` stops at the falsey left side and returns it.',
      },
      {
        t: 'A compile error',
        why: 'An unknown global is only noticed when it is looked up while running.',
      },
      {
        t: 'Prints `none`',
        why: 'The result is the left operand, `false`.',
      },
    ],
  },
];
