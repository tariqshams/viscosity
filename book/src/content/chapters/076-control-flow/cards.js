// Chapter 76 cards. Keys are stable ids: never rename them.

export const prompts = {
  'if-one-branch': {
    q: 'When Drip runs `if (c) A else B`, how many of `A` and `B` are executed?',
    a: 'Exactly one (or none, if `c` is falsey and there’s no `else`). The other branch’s tree is never visited.',
  },
  'dangling-else': {
    q: 'In `if (a) if (b) x; else y;` which `if` does the `else` belong to?',
    a: 'The inner one, `if (b)`. The inner `if` takes the `else` before the outer one sees it.',
  },
  'control-flow-what': {
    q: 'What is *control flow*?',
    a: 'The order in which a program’s statements run.',
  },
  'while-reeval': {
    q: 'How often does a `while` loop evaluate its condition?',
    a: 'Before every trip round the loop, plus once more when it finally turns falsey.',
  },
  'desugar-what': {
    q: 'What does it mean to *desugar* a construct?',
    a: 'To rewrite it in terms of simpler constructs the language already has.',
  },
  'for-outer-block': {
    q: 'Why does the desugared `for` loop wrap the initializer and the `while` in a block?',
    a: 'So the loop variable gets its own environment: it exists only during the loop and can shadow an outer variable.',
  },
  'for-no-cond': {
    q: 'What condition does `for (;;) body` get after desugaring?',
    a: 'The literal `true`, so it loops forever.',
  },
  'for-free': {
    q: 'Why is desugaring `for` in the parser less work than adding a `for` case to the interpreter?',
    a: 'Every later pass over the tree (the interpreter, the resolver) only has to handle `while` and blocks, so `for` comes for free.',
  },
  'logical-not-binary': {
    q: 'Why can’t `and` and `or` use the same `binary` case as `+` and `<`?',
    a: 'The `binary` case evaluates both operands first. `and`/`or` must sometimes skip the right operand.',
  },
  'or-value': {
    q: 'What does `print nil or "default";` print in Drip?',
    a: '`default`. `or` returns an operand’s value, not a boolean.',
  },
  'and-skip': {
    q: 'In `false and (x = 1)`, does the assignment happen?',
    a: 'No. The left side is falsey, so `and` returns it without evaluating the right side.',
  },
};

export const examples = {
  shortCircuit: {
    title: 'and and or skip, and return values',
    lang: 'drip',
    code: `let calls = 0;
let ok = false and (calls = calls + 1);
print ok;
print calls;

print nil or "default";
print 1 and 2 and 3;
print 0 or "zero is truthy";`,
  },
};

const desugarStarter = `function desugarFor(f) {
  // f has init, cond, incr, body.
  // Return a block / while tree.
  return null;
}`;

const solution = `const block = (statements) =>
  ({ kind: 'block', statements });

function desugarFor(f) {
  let body = f.body;
  if (f.incr) {
    body = block([body, {
      kind: 'expression',
      expression: f.incr,
    }]);
  }
  const condition = f.cond ??
    { kind: 'literal', value: true };
  body = {
    kind: 'while', condition, body,
  };
  if (f.init) {
    body = block([f.init, body]);
  }
  return body;
}`;

export const exercises = {
  desugarFor: {
    title: 'Desugar a for loop',
    prompt: `Write \`desugarFor(f)\`, the rewrite Drip's parser does. \`f\` has four parts: \`init\` (a statement or \`null\`), \`cond\` (an expression or \`null\`), \`incr\` (an expression or \`null\`) and \`body\` (a statement). Return the equivalent tree:

- If there is an \`incr\`, the body becomes \`{ kind: 'block', statements: [body, { kind: 'expression', expression: incr }] }\`.
- Wrap that in \`{ kind: 'while', condition, body }\`. A missing \`cond\` becomes \`{ kind: 'literal', value: true }\`.
- If there is an \`init\`, wrap everything in \`{ kind: 'block', statements: [init, theWhile] }\`.`,
    starter: desugarStarter,
    solution,
    tests: `const init = { kind: 'let', name: 'i' };
const cond = { kind: 'binary', op: '<' };
const incr = { kind: 'assign', name: 'i' };
const body = { kind: 'print' };
const T = { kind: 'literal', value: true };
test('all four parts', () => {
  expect(desugarFor({ init, cond, incr, body }))
    .toEqual({ kind: 'block', statements: [
      init,
      { kind: 'while', condition: cond,
        body: { kind: 'block', statements: [
          body,
          { kind: 'expression', expression: incr },
        ] } },
    ] });
});
test('no init: no outer block', () => {
  expect(desugarFor({ init: null, cond, incr, body }).kind)
    .toBe('while');
});
test('no incr: body left alone', () => {
  const w = desugarFor({ init: null, cond, incr: null, body });
  expect(w).toEqual({ kind: 'while', condition: cond, body });
});
test('no cond: loops on true', () => {
  const w = desugarFor({ init: null, cond: null, incr: null, body });
  expect(w.condition).toEqual(T);
});`,
    hints: [
      'Work from the inside out, the same order as the step-through: body and increment first, then the while, then the initializer.',
      'Keep one variable, `body`, and replace it with a bigger tree at each step.',
      'For the condition, `f.cond ?? { kind: \'literal\', value: true }` picks the default only when `cond` is `null` or `undefined`.',
    ],
    walkthrough: `The rewrite is three optional wrappers, applied from the inside out:

1. **Increment.** One trip round a \`for\` loop is "the body, then the increment". So if there is an increment, wrap both in a block, body first. The increment is an *expression*, so it needs an expression-statement node around it before it can sit in a list of statements.
2. **While.** Repeat that trip while the condition holds. An empty condition means "forever", so it becomes the literal \`true\`.
3. **Initializer.** Run it once, before the loop. Putting it in an outer block with the \`while\` does two jobs at once: it runs first, and it gets its own environment, so the loop variable doesn't leak out.

\`\`\`js
let body = f.body;
if (f.incr) body = block([body, exprStmt]);
body = { kind: 'while', condition, body };
if (f.init) body = block([f.init, body]);
\`\`\`

Compare this with \`forStatement\` in the companion's \`parser.ts\`: it is the same four lines, run on real parsed nodes.`,
    wrong: [
      {
        code: `const block = (statements) =>
  ({ kind: 'block', statements });

function desugarFor(f) {
  let body = f.body;
  if (f.incr) {
    body = block([{
      kind: 'expression',
      expression: f.incr,
    }, body]);
  }
  const condition = f.cond ??
    { kind: 'literal', value: true };
  body = {
    kind: 'while', condition, body,
  };
  if (f.init) {
    body = block([f.init, body]);
  }
  return body;
}`,
        why: 'The increment comes *before* the body here, so the first trip would run with `i` already bumped: `for (let i = 0; ...)` would start printing at 1. The body must come first.',
      },
      {
        code: `const block = (statements) =>
  ({ kind: 'block', statements });

function desugarFor(f) {
  let body = f.body;
  if (f.incr) {
    body = block([body, {
      kind: 'expression',
      expression: f.incr,
    }]);
  }
  body = {
    kind: 'while',
    condition: f.cond,
    body,
  };
  if (f.init) {
    body = block([f.init, body]);
  }
  return body;
}`,
        why: 'A missing condition stays `null`, and the interpreter would evaluate `null` as an expression and crash. `for (;;)` needs the literal `true`.',
      },
      {
        code: `const block = (statements) =>
  ({ kind: 'block', statements });

function desugarFor(f) {
  const parts = [f.body];
  if (f.incr) parts.push({
    kind: 'expression',
    expression: f.incr,
  });
  if (f.init) parts.unshift(f.init);
  return {
    kind: 'while',
    condition: f.cond,
    body: block(parts),
  };
}`,
        why: 'The initializer has moved *inside* the loop, so it would run on every trip and reset `i` each time: an endless loop. It must run once, before the `while`.',
      },
    ],
  },
  powersOfTwo: {
    optional: true,
    lang: 'drip',
    title: 'Powers of two',
    prompt:
      'Write a Drip `for` loop that prints every power of two below 100, one per line, starting from `1`: `1`, `2`, `4`, ... `64`.',
    starter: `// One for loop. Its increment
// doesn't have to add 1.
`,
    solution: `for (let p = 1; p < 100; p = p * 2) {
  print p;
}`,
    tests: `1
2
4
8
16
32
64`,
    hints: [
      'Start the loop variable at 1, and keep going while it is below 100.',
      'The increment can be any assignment: `p = p * 2`.',
    ],
    walkthrough: `\`for (let p = 1; p < 100; p = p * 2) print p;\` desugars to

\`\`\`js
{
  let p = 1;
  while (p < 100) {
    print p;
    p = p * 2;
  }
}
\`\`\`

The body runs before each doubling, so 1 is printed first. After printing 64, \`p\` becomes 128, the condition is false, and the loop ends without printing it.`,
    wrong: [
      {
        code: `for (let p = 1; p <= 128; p = p * 2) {
  print p;
}`,
        why: '`p <= 128` lets 128 through, which isn’t below 100. Stop at `p < 100`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
if (0) print "yes";
else print "no";
\`\`\``,
    options: [
      { t: '`no`', why: 'That would be JavaScript’s rule, where 0 is falsy. Drip only treats `nil` and `false` as falsey.' },
      { t: '`yes`', correct: true, why: '0 is a number, and every number is truthy in Drip.' },
      { t: 'Both lines', why: 'An `if` executes only one branch.' },
      { t: 'A runtime error: the condition must be a boolean', why: 'Any value can be a condition; truthiness decides.' },
    ],
  },
  {
    q: 'Which tree does Drip’s parser build for `for (let i = 0; i < 3; i = i + 1) print i;`?',
    options: [
      { t: 'A `for` node with four children', why: 'There is no `for` kind in Drip’s AST. The parser rewrites it.' },
      { t: '`while (i < 3) { let i = 0; print i; i = i + 1; }`', why: 'That puts the initializer inside the loop, resetting `i` every trip.' },
      { t: '`{ let i = 0; while (i < 3) { print i; i = i + 1; } }`', correct: true, why: 'Initializer once in an outer block, then a while whose body is the body followed by the increment.' },
      { t: '`{ let i = 0; while (i < 3) { i = i + 1; print i; } }`', why: 'The increment runs after the body, not before it.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let i = "out";
for (let i = 0; i < 2; i = i + 1) {}
print i;
\`\`\``,
    options: [
      { t: '`2`', why: 'That would need the loop’s `i` to be the same variable as the outer one.' },
      { t: '`out`', correct: true, why: 'The loop’s `i` lives in the outer block of the desugared loop, so it shadows the global `i` and vanishes after the loop.' },
      { t: '`0`', why: 'The loop’s `i` is not visible after the loop at all.' },
      { t: 'A runtime error', why: 'Both variables exist where they are used.' },
    ],
  },
  {
    q: '`print nil or false;` What is printed?',
    options: [
      { t: '`nil`', why: '`nil` is falsey, so `or` moves on and returns the right operand.' },
      { t: '`true`', why: 'Drip’s `or` returns one of its operands, never a fresh boolean.' },
      { t: 'Nothing: it is a runtime error', why: '`or` accepts any values.' },
      { t: '`false`', correct: true, why: 'The left side is falsey, so `or` evaluates and returns the right side, which is `false`.' },
    ],
  },
  {
    q: `After this runs, what is \`n\`?
\`\`\`
let n = 0;
true or (n = 1);
false and (n = 2);
\`\`\``,
    options: [
      { t: '`0`', correct: true, why: 'Both left sides decide the result (`true` for `or`, `false` for `and`), so neither assignment is evaluated.' },
      { t: '`1`', why: '`true or ...` never needs its right side.' },
      { t: '`2`', why: '`false and ...` never needs its right side.' },
      { t: '`nil`', why: '`n` starts at 0 and nothing changes it.' },
    ],
  },
  {
    q: 'Why does the tree-walker need hardly any code for `if` and `while`?',
    options: [
      { t: 'Because the parser removes them', why: 'Only `for` is rewritten. `if` and `while` reach the interpreter.' },
      { t: 'Because Drip compiles them to jumps', why: 'That is the bytecode VM, in Part IV. The tree-walker has no jumps.' },
      { t: 'Because it uses TypeScript’s own `if` and `while` to run them', correct: true, why: 'Each Drip decision becomes a TypeScript decision about which child to execute next.' },
      { t: 'Because conditions are always booleans', why: 'They aren’t; `isTruthy` handles every value.' },
    ],
  },
];
