// Chapter 100 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
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

const flowTests = `const N = (value) => ({ kind: 'num', value });
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
});`;

const starterHead = `function run(prog) {
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
        throw new Error('boom');`;

const flowSolution = starterHead + `
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
}`;

export const exercises = {
  'mini-flow': {
    title: 'if, while, break, continue, && and ||',
    prompt:
      'Finish this small interpreter. Expressions: `num`, `var`, `add`, `lt`, `eq` and `boom` (which throws) are done; add `{ kind: \'logical\', op, left, right }` with `op` `\'&&\'` or `\'||\'`, which short-circuits and returns an operand. Statements: `print` and `set` are done; add `{ kind: \'if\', cond, then, else }` (`then` is a list of statements, `else` a list or `null`), `{ kind: \'while\', cond, body }`, `{ kind: \'break\' }` and `{ kind: \'continue\' }`. Every `execute` returns a completion string, `\'normal\'`, `\'break\'` or `\'continue\'`, and `block(list)` runs a list, stopping at the first statement that does not finish normally and returning its completion. Use Drip truthiness (`truthy`).',
    starter: starterHead + `
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
    solution: flowSolution,
    tests: flowTests,
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
        code: starterHead + `
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
    prompt:
      'Using `for i in 1..100`, print each square `i * i` in order, but skip the squares of multiples of 3 (use `continue`), and stop the loop (use `break`) at the first square greater than 50, without printing it. Finally print `done`.',
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
    q: 'What does this print?\n```\nlet n = 0;\nwhile n < 5 {\n  n += 1;\n  if n == 2 { continue; }\n  if n == 4 { break; }\n  print n;\n}\n```',
    options: [
      { t: '`1`, `2`, `3`, `4`', why: '`continue` skips the `print` when `n` is 2, and `break` ends the loop before 4 is printed.' },
      { t: '`1`, `3`', correct: true, why: '1 prints; 2 is skipped by `continue`; 3 prints; at 4 the `break` ends the loop.' },
      { t: '`1`', why: '`continue` does not end the loop; it only skips the rest of this time round.' },
      { t: 'It never ends', why: '`n += 1` comes before the `continue`, so `n` still grows.' },
    ],
  },
  {
    q: 'How does a `break` inside an `if` inside a loop body reach the loop?',
    options: [
      { t: 'It throws a JavaScript exception that the loop catches', why: 'Some interpreters do that, but the companion returns a completion value instead.' },
      { t: 'The `if` checks whether it is inside a loop', why: 'The `if` knows nothing about loops; it only passes its branch’s completion up.' },
      { t: 'Each `execute` returns `BREAK`, and every enclosing statement list stops and passes it up until the loop handles it', correct: true, why: '`executeBlock` stops at the first completion that is not `NORMAL` and returns it, so the value climbs to the innermost loop.' },
      { t: 'The parser moves the `break` to the end of the loop', why: 'The parser leaves `break` where it is; the interpreter handles it while running.' },
    ],
  },
  {
    q: 'What does `print none || 0;` print in Drip?',
    options: [
      { t: '`true`', why: 'Drip’s `||` returns an operand, not a boolean.' },
      { t: '`none`', why: '`none` is falsey, so `||` moves on to the right side.' },
      { t: '`false`', why: 'Nothing here is converted to a boolean.' },
      { t: '`0`', correct: true, why: 'The left side is falsey, so the result is the right side, `0`.' },
    ],
  },
  {
    q: 'Why does the companion keep a real `for` node instead of desugaring `for i in a..b` into a `while` loop?',
    options: [
      { t: 'A naive rewrite gets `continue` wrong (it skips the counter step), needs hidden variables, and must still give each time round a fresh `i`', correct: true, why: 'Running `for` directly makes all three behaviours easy to get right.' },
      { t: 'Because `while` is slower than `for` in JavaScript', why: 'Speed is not the reason; correctness is.' },
      { t: 'Because desugaring is not allowed in a tree-walking interpreter', why: 'It is allowed: `else if` is desugared by the companion’s parser.' },
      { t: 'Because Drip has no `while` loop', why: 'It does; the rewrite would use it.' },
    ],
  },
  {
    q: 'What does `print false && missing;` do when `missing` was never declared?',
    options: [
      { t: 'A runtime error: `undefined variable \'missing\'`', why: 'The right side is never evaluated, so the name is never looked up.' },
      { t: 'Prints `false`', correct: true, why: '`&&` stops at the falsey left side and returns it.' },
      { t: 'A compile error', why: 'An unknown global is only noticed when it is looked up while running.' },
      { t: 'Prints `none`', why: 'The result is the left operand, `false`.' },
    ],
  },
];
