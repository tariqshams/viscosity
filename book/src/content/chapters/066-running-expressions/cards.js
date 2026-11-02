// Chapter 66 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'evaluate-what': {
    q: 'What does it mean to **evaluate** an expression?',
    a: 'To compute the value it stands for: the tree `(- (+ 1 (* 2 3)) 4)` evaluates to `3`.',
  },
  'children-first': {
    q: 'Why must a binary node evaluate both children before it applies its operator?',
    a: 'The operator needs both operand values, and those values are what the children return.',
  },
  'grouping-nothing': {
    q: 'In a tree-walking interpreter, what does evaluating a grouping (bracket) node do?',
    a: 'It evaluates the expression inside and returns that. The brackets already did their job by shaping the tree.',
  },
  'tree-walker-what': {
    q: 'What is a **tree-walking interpreter**?',
    a: 'An interpreter that runs a program by visiting the nodes of its syntax tree directly, with a recursive function, without turning the program into any other form first.',
  },
  'none-is-null': {
    q: 'Which JavaScript value does Drip’s TypeScript tree-walker use for Drip’s `none`?',
    a: '`null` (and `stringify` prints it as `none`).',
  },
  'truthy-zero': {
    q: 'What does `print !0;` print in Drip, and why?',
    a: '`false`. Only `none` and `false` are falsey in Drip, so `0` is truthy and `!0` is false. (In JavaScript `!0` is `true`.)',
  },
  'runtime-vs-syntax': {
    q: 'A runtime error exits with code 70, a compile error with 65. What is the difference between them?',
    a: 'A compile (syntax) error is found before anything runs; a runtime error is found while the program runs, for example an operator given the wrong types, after earlier lines have already printed.',
  },
  'token-for-line': {
    q: 'Why does a Drip `RuntimeError` carry the operator’s token?',
    a: 'The token knows its source line, so the error can say where it happened (`at line 2 in script`).',
  },
};

export const examples = {
  'type-error': {
    title: 'A runtime error',
    lang: 'drip',
    expectError: true,
    code: `print 1 + 2;
print "1" - 1;
print "never printed";`,
  },
};

export const exercises = {
  'mini-eval': {
    title: 'An evaluator with Drip’s rules',
    prompt: 'Finish `evaluate(e)` for three kinds of node: `{ kind: \'literal\', value }`, `{ kind: \'unary\', op, right }` with `op` either `\'!\'` or `\'-\'`, and `{ kind: \'binary\', op, left, right }` with `op` one of `+ - * /`. Follow Drip: `!` uses Drip truthiness, `+` takes two numbers or two strings, and `- * /` take two numbers. On a mismatch, throw an `Error` with exactly Drip’s message, using the `describe` helper you are given: `cannot negate a string`, `cannot add a string and a number`, or `cannot use \'-\' on a string and a number`.',
    starter: `function isTruthy(v) {
  return v !== null && v !== false;
}

function describe(v) {
  if (v === null) return 'none';
  return 'a ' + typeof v;
}

function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'unary': {
      // '!' and '-'
      return undefined;
    }
    case 'binary': {
      // '+', '-', '*', '/'
      return undefined;
    }
  }
}`,
    solution: `function isTruthy(v) {
  return v !== null && v !== false;
}

function describe(v) {
  if (v === null) return 'none';
  return 'a ' + typeof v;
}

function binary(op, l, r) {
  const tl = typeof l;
  const tr = typeof r;
  const d = describe(l) + ' and '
    + describe(r);
  if (op === '+') {
    const ok = tl === 'number'
      || tl === 'string';
    if (tl === tr && ok) return l + r;
    throw new Error('cannot add ' + d);
  }
  if (tl !== 'number' ||
      tr !== 'number') {
    throw new Error("cannot use '" + op
      + "' on " + d);
  }
  if (op === '-') return l - r;
  if (op === '*') return l * r;
  return l / r;
}

function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'unary': {
      const r = evaluate(e.right);
      if (e.op === '!') {
        return !isTruthy(r);
      }
      if (typeof r !== 'number') {
        throw new Error('cannot negate '
          + describe(r));
      }
      return -r;
    }
    case 'binary': {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      return binary(e.op, l, r);
    }
  }
}`,
    tests: `const L = (value) =>
  ({ kind: 'literal', value });
const U = (op, right) =>
  ({ kind: 'unary', op, right });
const B = (op, left, right) =>
  ({ kind: 'binary', op, left, right });
const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('a literal is its value', () => {
  expect(evaluate(L(7))).toBe(7);
});
test('1 + 2 * 3 - 4 is 3', () => {
  const t = B('-', B('+', L(1),
    B('*', L(2), L(3))), L(4));
  expect(evaluate(t)).toBe(3);
});
test('+ joins two strings', () => {
  expect(evaluate(B('+', L('a'), L('b'))))
    .toBe('ab');
});
test('- negates, / divides', () => {
  expect(evaluate(U('-', B('/', L(5), L(2)))))
    .toBe(-2.5);
});
test('! uses Drip truthiness', () => {
  expect(evaluate(U('!', L(0)))).toBe(false);
  expect(evaluate(U('!', L(null)))).toBe(true);
  expect(evaluate(U('!', L('')))).toBe(false);
});
test('-"a" is a runtime error', () => {
  expect(msg(() => evaluate(U('-', L('a')))))
    .toBe('cannot negate a string');
});
test('"1" - 1 is a runtime error', () => {
  expect(msg(() =>
    evaluate(B('-', L('1'), L(1)))))
    .toBe("cannot use '-' on a string"
      + ' and a number');
});
test('"a" + 1 is a runtime error', () => {
  expect(msg(() =>
    evaluate(B('+', L('a'), L(1)))))
    .toBe('cannot add a string and a number');
});
test('none * 2 names none', () => {
  expect(msg(() =>
    evaluate(B('*', L(null), L(2)))))
    .toBe("cannot use '*' on none"
      + ' and a number');
});`,
    hints: [
      'Both unfinished cases start the same way as the companion: evaluate the children first (`evaluate(e.right)`, and for a binary node `evaluate(e.left)` before it).',
      'For `!`, return `!isTruthy(r)`, not `!r`: JavaScript’s own `!` treats `0` and `\'\'` as false. For `-`, check `typeof r === \'number\'` before negating, and throw `\'cannot negate \' + describe(r)` otherwise.',
      'For `+`, accept the operands only if both have the same `typeof` and it is `\'number\'` or `\'string\'`; otherwise throw `\'cannot add \' + describe(l) + \' and \' + describe(r)`. For `- * /`, throw `"cannot use \'" + e.op + "\' on " + ...` unless both are numbers, then compute.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`evaluate\` with the operator token replaced by a plain \`op\` string, and with only the error messages that this little language can hit. Before writing anything, decide the order of work for each node: a literal has no children, so it answers at once; a unary node needs its one child's value before it can do anything; a binary node needs both. Only after the values are in hand do we look at the operator, check the types, and either compute or throw. Do one by hand: for \`"1" - 1\` the left value is the string \`"1"\`, the right is the number \`1\`, the operator is \`-\`, and \`-\` needs two numbers, so the answer is the error \`cannot use '-' on a string and a number\`.

**The solution, line by line.**

- \`function isTruthy(v) { return v !== null && v !== false; }\` is Drip's rule, given to you: only \`none\` (held as \`null\`) and \`false\` are false.
- \`function describe(v)\` names a value's type the way the messages need it: \`null\` is \`none\`, and anything else is \`'a ' + typeof v\`, so \`a number\`, \`a string\` or \`a boolean\`. (The companion's \`describe\` also knows lists, classes and instances.)
- \`case 'literal': return e.value;\` hands back the value stored in the node.
- \`const r = evaluate(e.right);\` in the unary case evaluates the only child first.
- \`if (e.op === '!') { return !isTruthy(r); }\` uses Drip's truthiness, then JavaScript's \`!\` on the resulting true boolean, so \`!0\` is \`false\`.
- \`if (typeof r !== 'number') { throw new Error('cannot negate ' + describe(r)); }\` refuses to negate anything but a number; for \`-"a"\` the message is \`cannot negate a string\`.
- \`return -r;\` negates a number.
- \`const l = evaluate(e.left); const r = evaluate(e.right);\` in the binary case: left child, then right child, and only then \`return binary(e.op, l, r);\`, the same order as the companion. Moving the operator work into its own function \`binary\` keeps \`evaluate\` short, much as the companion hands it to \`arithmetic\`.
- In \`binary\`, \`const tl = typeof l; const tr = typeof r;\` and \`const d = describe(l) + ' and ' + describe(r);\` prepare the pieces every message needs, so they are written once.
- \`if (op === '+') { ... }\` accepts two values of the same type (\`tl === tr\`) when that type is number or string (\`ok\`); then \`l + r\` adds or joins. Anything else throws \`'cannot add ' + d\`, for example \`cannot add a string and a number\`.
- \`if (tl !== 'number' || tr !== 'number') { throw ... }\` is the shared check for \`- * /\`: the message puts the operator in quotes, \`cannot use '*' on none and a number\`.
- The last three lines compute \`-\`, \`*\`, and (for the only operator left, \`/\`) division.

**Common wrong attempts.**

- \`return !r;\` for \`!\`: JavaScript's truthiness, so \`!0\` and \`!''\` come out \`true\`, and the truthiness test fails.
- Checking only the left operand for \`+\` (\`typeof l === 'string'\`) lets \`"a" + 1\` through, and JavaScript happily returns \`"a1"\`, which is exactly the silent conversion Drip refuses.
- Evaluating the children inside each \`if\` (after looking at \`op\`) works for these tests but changes nothing for the better, and in the real interpreter it would make evaluation order depend on the operator; evaluate both first.
- Writing \`'cannot use ' + e.op + ' on '\` without the quotes gives \`cannot use - on a string and a number\`, which is not Drip's message; the corpus pins the wording byte for byte.`,
    wrong: [
      {
        code: `function isTruthy(v) {
  return v !== null && v !== false;
}

function describe(v) {
  if (v === null) return 'none';
  return 'a ' + typeof v;
}

function evaluate(e) {
  if (e.kind === 'literal') {
    return e.value;
  }
  const r = evaluate(e.right);
  if (e.kind === 'unary') {
    return e.op === '!' ? !r : -r;
  }
  const l = evaluate(e.left);
  if (e.op === '+') return l + r;
  if (e.op === '-') return l - r;
  if (e.op === '*') return l * r;
  return l / r;
}`,
        why: 'It borrows JavaScript’s rules: `!0` is `true`, `"a" + 1` becomes `"a1"`, and `-"a"` is `NaN` instead of an error.',
      },
    ],
  },
  'fix-total': {
    optional: true,
    lang: 'drip',
    title: 'Mend a runtime error',
    prompt: 'This program stops with `runtime error: cannot add a string and a number`. Change it so that it prints exactly `total: 12` and then `half: 6`, still computing the numbers with `*` and `/` (do not type 12 or 6 yourself). The built-in `str(x)` turns any value into the string `print` would show.',
    starter: `print "total: " + 3 * 4;
print "half: " + 12 / 2;`,
    solution: `print "total: " + str(3 * 4);
print "half: " + str(12 / 2);`,
    tests: `total: 12
half: 6`,
    hints: [
      'Read the message: `+` was given a string on the left and a number on the right. Which side needs to change type?',
      'Precedence makes `3 * 4` happen first, so the right side of `+` is the number `12`. Turn that number into a string before `+` sees it.',
      'Wrap each arithmetic part in `str(...)`: `"total: " + str(3 * 4)`.',
    ],
    walkthrough: `**How to think about it.** Evaluate the first line's tree by hand, children first. The \`*\` binds tighter than \`+\`, so the tree is \`(+ "total: " (* 3 4))\`; the right child evaluates to the number \`12\`, and then \`+\` sees a string and a number. Drip's \`+\` accepts two numbers or two strings and nothing else, so it stops. The cure is to make the right side a string, and \`str\` does exactly that.

**The solution, line by line.**

- \`print "total: " + str(3 * 4);\` evaluates \`3 * 4\` to \`12\`, then \`str(12)\` to the string \`"12"\` (whole numbers print without \`.0\`), then joins the two strings, and \`print\` shows \`total: 12\`.
- \`print "half: " + str(12 / 2);\` does the same with \`12 / 2\`, which is \`6\`, so it prints \`half: 6\`.

**Common wrong attempts.**

- \`print str("total: " + 3 * 4);\` puts \`str\` around the whole thing, but the failing \`+\` runs first, inside the brackets, so the error is the same.
- \`print "total: " + "3 * 4";\` joins the characters \`3 * 4\` and prints \`total: 3 * 4\`: the quotes made it a string, not a calculation.
- \`print "total: ", 3 * 4;\` is not Drip: \`print\` takes one expression, so this is a compile error.`,
    wrong: [
      {
        code: `print str("total: " + 3 * 4);
print str("half: " + 12 / 2);`,
        why: 'The `+` inside the brackets still sees a string and a number, so the same runtime error happens before `str` is ever called.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In what order does a tree-walking interpreter *finish* the nodes of `(+ 1 (* 2 3))`?',
    options: [
      {
        t: '`+`, then `1`, then `*`, then `2`, then `3`',
        why: 'That is the order the nodes are *entered*. The `+` cannot finish until both of its children have.',
      },
      {
        t: '`1`, `2`, `3`, `*`, `+`',
        correct: true,
        why: 'Children finish before their parent: `1`, then the `*` subtree (`2`, `3`, then `*` itself), and the `+` last.',
      },
      {
        t: '`*`, `2`, `3`, `+`, `1`',
        why: 'Precedence shaped the tree when it was parsed; evaluation walks it, left child first.',
      },
      {
        t: 'All at once',
        why: 'The interpreter makes one recursive call at a time, children before parents.',
      },
    ],
  },
  {
    q: 'Which line prints `true` in Drip?',
    options: [
      {
        t: '`print !1;`',
        why: '`1` is truthy, so `!1` is `false`.',
      },
      {
        t: '`print !"";`',
        why: 'The empty string is truthy in Drip, so this prints `false`.',
      },
      {
        t: '`print !none;`',
        correct: true,
        why: '`none` is one of Drip’s only two falsey values, so `!none` is `true`.',
      },
      {
        t: '`print !0;`',
        why: '`0` is truthy in Drip (unlike JavaScript), so this prints `false`.',
      },
    ],
  },
  {
    q: 'What happens when Drip runs `print "a" + 1;`?',
    options: [
      {
        t: 'It prints `a1`',
        why: 'That is JavaScript’s answer. Drip’s `+` refuses a string with a number.',
      },
      {
        t: 'A compile error, exit code 65',
        why: 'The program is valid Drip; the problem only shows up when `+` sees the two values.',
      },
      {
        t: 'It prints `none`',
        why: 'Drip never turns a failed operation into `none`; it stops with an error.',
      },
      {
        t: 'A runtime error, `cannot add a string and a number`, exit code 70',
        correct: true,
        why: 'The type check happens just before `+` is applied, while the program runs.',
      },
    ],
  },
  {
    q: 'How is the Drip value `"hi"` held while the interpreter runs?',
    options: [
      {
        t: 'As a JavaScript string',
        correct: true,
        why: 'The tree-walker reuses JavaScript values: strings are strings, so `+` can join them directly.',
      },
      {
        t: 'As an object `{ kind: "string", value: "hi" }`',
        why: 'That would work, but the companion uses the host’s own strings instead.',
      },
      {
        t: 'As a token',
        why: 'Tokens belong to the front end; while running there are only values.',
      },
      {
        t: 'As a list of character codes',
        why: 'No such encoding is needed: JavaScript strings do the job.',
      },
    ],
  },
  {
    q: 'A program prints three lines and then hits a runtime error on line 4. What does the reader see?',
    options: [
      {
        t: 'Only the error',
        why: 'That is what happens with a compile error, because nothing runs. Here the first lines already ran.',
      },
      {
        t: 'The three lines, the error, and then the rest of the program',
        why: 'A runtime error stops the program.',
      },
      {
        t: 'The three lines, then `runtime error: ...` and `at line 4 in script`',
        correct: true,
        why: 'The program runs until the error, and output already printed stays printed. The exit code is 70.',
      },
      {
        t: 'Nothing: runtime errors are silent',
        why: 'Drip always reports the message and where it happened.',
      },
    ],
  },
];
