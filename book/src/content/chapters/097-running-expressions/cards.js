// Chapter 97 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'evaluate-what': {
    q: 'What does it mean to **evaluate** an expression?',
    a: 'To compute the value it stands for, e.g. `(- (+ 1 (* 2 3)) 4)` evaluates to `3`.',
  },
  'children-first': {
    q: 'When evaluating a binary node, why must both children be evaluated before the node itself?',
    a: 'The operator needs both operand values to compute anything, and those values are the children’s results.',
  },
  'grouping-nothing': {
    q: 'What does `evaluate` do with a grouping node `(group e)`?',
    a: 'It just evaluates `e`. The parentheses already did their job by shaping the tree.',
  },
  'tree-walker-what': {
    q: 'What is a **tree-walking interpreter**?',
    a: 'An interpreter that runs a program by visiting the nodes of its syntax tree directly, with a recursive function, without producing any other form of the program.',
  },
  'nil-is-null': {
    q: 'In Drip’s TypeScript interpreter, what runtime value represents Drip’s `nil`?',
    a: 'JavaScript’s `null`.',
  },
  'drip-type-check': {
    q: 'How does the interpreter check that a Drip value is a number?',
    a: 'With `typeof v === \'number\'`: Drip numbers are JavaScript numbers.',
  },
  'truthy-zero': {
    q: 'In Drip, what does `print !0;` print, and why?',
    a: '`false`. Only `nil` and `false` are falsey in Drip, so `0` is truthy and `!0` is false. (In JavaScript `!0` is `true`.)',
  },
  'runtime-vs-syntax': {
    q: 'What is the difference between a **runtime error** and a syntax error in Drip?',
    a: 'A syntax error is found while parsing, before anything runs (exit 65). A runtime error is found while running, e.g. a type mismatch (exit 70).',
  },
  'token-for-line': {
    q: 'Why does a Drip `RuntimeError` carry the operator’s token?',
    a: 'The token records its source line, so the error can say where it happened (`[line 2]`).',
  },
  'plus-rule': {
    q: 'Which operand types does Drip’s `+` accept?',
    a: 'Two numbers (adds them) or two strings (joins them). Anything else is a runtime error.',
  },
};

export const examples = {
  values: {
    title: 'Values and truthiness',
    lang: 'drip',
    code: `print 7;
print 10 / 4;
print "drip" + "!";
print nil;
print 2 < 3;
print !0;
print !nil;
print !"";`,
  },
  'type-error': {
    title: 'A runtime error',
    lang: 'drip',
    expectError: true,
    code: `print 1 + 2;
print "1" - 1;
print "never printed";`,
  },
};

const evalTests = `const L = (value) =>
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
    .toBe('Operand must be a number.');
});
test('"1" - 1 is a runtime error', () => {
  expect(msg(() =>
    evaluate(B('-', L('1'), L(1)))))
    .toBe('Operands must be numbers.');
});
test('"a" + 1 is a runtime error', () => {
  expect(msg(() =>
    evaluate(B('+', L('a'), L(1)))))
    .toBe('Operands must be two numbers'
      + ' or two strings.');
});`;

const evalSolution = `function isTruthy(v) {
  return v !== null && v !== false;
}

function nums(l, r) {
  if (typeof l !== 'number' ||
      typeof r !== 'number') {
    throw new Error(
      'Operands must be numbers.');
  }
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
        throw new Error(
          'Operand must be a number.');
      }
      return -r;
    }
    case 'binary': {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      if (e.op === '+') {
        const t = typeof l;
        if (t === typeof r &&
            (t === 'number' ||
             t === 'string')) {
          return l + r;
        }
        throw new Error(
          'Operands must be two ' +
          'numbers or two strings.');
      }
      nums(l, r);
      if (e.op === '-') return l - r;
      if (e.op === '*') return l * r;
      return l / r;
    }
  }
}`;

export const exercises = {
  'mini-eval': {
    title: 'An evaluator with Drip’s rules',
    prompt:
      'Finish `evaluate(e)` for three kinds of node: `{ kind: \'literal\', value }`, `{ kind: \'unary\', op, right }` with `op` `\'!\'` or `\'-\'`, and `{ kind: \'binary\', op, left, right }` with `op` one of `+ - * /`. Follow Drip: `!` uses Drip truthiness, `+` takes two numbers or two strings, and the others take numbers only. On a type mismatch, throw an `Error` with exactly Drip’s message: `Operand must be a number.` (unary), `Operands must be numbers.`, or `Operands must be two numbers or two strings.`',
    starter: `function isTruthy(v) {
  return v !== null && v !== false;
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
    solution: evalSolution,
    tests: evalTests,
    hints: [
      'Both non-literal cases start the same way: evaluate the children first (`evaluate(e.right)`, and for binary also `evaluate(e.left)`).',
      'For `!`, return `!isTruthy(r)`, not `!r`: JavaScript’s own `!` treats `0` and `\'\'` as false.',
      'For `+`, accept the operands only if `typeof l === typeof r` and that type is `\'number\'` or `\'string\'`. For `- * /`, check both are numbers first, then compute.',
    ],
    walkthrough: `This is Drip's \`evaluate\` with the operator token replaced by a plain \`op\` string.

- **Children first.** A unary node evaluates \`right\`; a binary node evaluates \`left\` then \`right\`. Only then does it look at the operator. That order is what makes values flow up the tree.
- **\`!\` and truthiness.** \`!isTruthy(r)\` gives Drip's answer. Writing \`!r\` would borrow JavaScript's rule, and \`!0\` would come out \`true\`.
- **Unary \`-\`.** Check \`typeof r === 'number'\` before negating. In JavaScript \`-'a'\` is \`NaN\`, which is exactly the silent nonsense Drip refuses.
- **\`+\` is special.** It is the one operator with two meanings, so it gets its own check: same type on both sides, and that type is number or string. Then JavaScript's \`+\` does the right thing for both.
- **The rest.** \`nums(l, r)\` throws unless both are numbers, so the arithmetic after it is safe.

In the real interpreter these are \`RuntimeError\`s carrying the operator's token, so Drip can print the line.`,
    wrong: [
      {
        code: `function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'unary': {
      const r = evaluate(e.right);
      if (e.op === '!') return !r;
      return -r;
    }
    case 'binary': {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      if (e.op === '+') return l + r;
      if (e.op === '-') return l - r;
      if (e.op === '*') return l * r;
      return l / r;
    }
  }
}`,
        why: 'This borrows JavaScript’s rules wholesale: `!0` is `true`, `-"a"` is `NaN`, `"1" - 1` is `0` and `"a" + 1` is `"a1"`. Drip checks types and uses its own truthiness.',
      },
      {
        code: `function isTruthy(v) {
  return v !== null && v !== false;
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
      return -r;
    }
    case 'binary': {
      const l = evaluate(e.left);
      const r = evaluate(e.right);
      if (e.op === '+') return l + r;
      if (e.op === '-') return l - r;
      if (e.op === '*') return l * r;
      return l / r;
    }
  }
}`,
        why: 'Truthiness is right now, but no operator checks its operand types, so every type mismatch silently produces a JavaScript answer instead of a runtime error.',
      },
    ],
  },
  stringify: {
    optional: true,
    title: 'How print shows a value',
    prompt:
      'Write `stringify(v)`, which turns a Drip runtime value into the text `print` shows. `null` (Drip’s `nil`) shows as `nil`, and negative zero shows as `-0`. Everything else shows as JavaScript’s `String(v)` would show it.',
    starter: `function stringify(v) {
  return String(v);
}`,
    solution: `function stringify(v) {
  if (v === null) return 'nil';
  if (Object.is(v, -0)) return '-0';
  return String(v);
}`,
    tests: `test('nil', () => {
  expect(stringify(null)).toBe('nil');
});
test('booleans', () => {
  expect(stringify(true)).toBe('true');
});
test('whole numbers have no decimal point', () => {
  expect(stringify(7)).toBe('7');
  expect(stringify(2.5)).toBe('2.5');
});
test('negative zero keeps its sign', () => {
  expect(stringify(-0)).toBe('-0');
  expect(stringify(0)).toBe('0');
});
test('strings print without quotes', () => {
  expect(stringify('hi')).toBe('hi');
});`,
    hints: [
      '`String(null)` is `\'null\'`, so `nil` needs its own check.',
      '`String(-0)` is `\'0\'`, and `-0 === 0` is `true`. `Object.is(v, -0)` tells them apart.',
    ],
    walkthrough: `Drip's \`stringify\` (in \`runtime.ts\`) is these three lines.

- **\`nil\`.** The runtime value is JavaScript's \`null\`, but Drip programs should see Drip's name for it.
- **\`-0\`.** IEEE 754 doubles have a negative zero, and \`print -0;\` should say so. \`===\` can't see the difference (\`-0 === 0\` is \`true\`), but \`Object.is\` can.
- **Everything else.** \`String\` already prints \`7\` (not \`7.0\`), \`2.5\`, \`true\` and strings without quotes, which is exactly what Drip wants.`,
    wrong: [
      {
        code: `function stringify(v) {
  if (v === null) return 'nil';
  if (v === -0) return '-0';
  return String(v);
}`,
        why: '`v === -0` is also true for ordinary `0`, so `stringify(0)` wrongly gives `-0`. Use `Object.is`.',
      },
      {
        code: `function stringify(v) {
  if (!v) return 'nil';
  return String(v);
}`,
        why: '`!v` is JavaScript truthiness: `false`, `0` and `\'\'` would all print as `nil`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In what order does the tree-walker finish the nodes of `(+ 1 (* 2 3))`?',
    options: [
      { t: '`+`, then `1`, then `*`, then `2`, then `3`', why: 'That is the order the nodes are *entered*. The `+` can’t finish until both children have.' },
      { t: '`1`, `2`, `3`, `*`, `+`', correct: true, why: 'Children finish before their parent: `1`, then the `*` subtree (`2`, `3`, then `*` itself), then `+` last.' },
      { t: '`*`, `2`, `3`, `+`, `1`', why: 'Precedence shaped the tree. Evaluation just walks it, left child first.' },
      { t: 'All at once', why: 'One recursive call at a time, children before parents.' },
    ],
  },
  {
    q: 'Which line prints `true` in Drip?',
    options: [
      { t: '`print !1;`', why: '`1` is truthy, so `!1` is `false`.' },
      { t: '`print !"";`', why: 'The empty string is truthy in Drip, so this prints `false`.' },
      { t: '`print !0;`', why: '`0` is truthy in Drip (unlike JavaScript), so this prints `false`.' },
      { t: '`print !nil;`', correct: true, why: '`nil` is one of Drip’s only two falsey values, so `!nil` is `true`.' },
    ],
  },
  {
    q: 'What happens when Drip runs `print "a" + 1;`?',
    options: [
      { t: 'It prints `a1`', why: 'That is JavaScript’s answer. Drip’s `+` refuses a string with a number.' },
      { t: 'A syntax error: exit code 65', why: 'The program is valid Drip. The problem only shows up when `+` sees the values.' },
      { t: 'A runtime error, `Operands must be two numbers or two strings.`, with exit code 70', correct: true, why: 'The type check happens just before `+` is applied, while the program runs.' },
      { t: 'It prints `nil`', why: 'Drip never turns a failed operation into `nil`. It stops with an error.' },
    ],
  },
  {
    q: 'How is the Drip value `"hi"` represented while the interpreter runs?',
    options: [
      { t: 'As a JavaScript string', correct: true, why: 'The tree-walker reuses JavaScript values: strings are strings, so `+` can join them directly.' },
      { t: 'As an object `{ kind: "string", value: "hi" }`', why: 'That would work, but Drip’s interpreter uses the host’s own strings instead.' },
      { t: 'As a token', why: 'Tokens belong to the front end. At runtime there are only values.' },
      { t: 'As an array of character codes', why: 'No such encoding is needed: JavaScript strings do the job.' },
    ],
  },
  {
    q: 'A program prints three lines and then hits a runtime error on line 4. What does the reader see?',
    options: [
      { t: 'Only the error', why: 'That is what happens with a *syntax* error, because nothing runs. Here the first lines already ran.' },
      { t: 'The three lines, then the error message and `[line 4]`', correct: true, why: 'The program runs until the error, and output already printed stays printed. Exit code 70.' },
      { t: 'The three lines, the error, and then the rest of the program', why: 'A runtime error stops the program.' },
      { t: 'Nothing: runtime errors are silent', why: 'Drip reports the message and the line.' },
    ],
  },
  {
    q: 'Why does a `grouping` node exist in the tree at all, if `evaluate` just evaluates its inner expression?',
    options: [
      { t: 'It makes evaluation faster', why: 'It costs an extra call, if anything.' },
      { t: 'Because `evaluate` changes the order of operations at grouping nodes', why: 'The order was fixed when the tree was shaped. Grouping adds nothing at runtime.' },
      { t: 'To store the result of the inner expression', why: 'Nodes don’t store results. Values are returned up the call stack.' },
      { t: 'It records the parentheses from the source, which matters for tools like the tree printer and for checking assignment targets', correct: true, why: '`(a) = 1` must be rejected, which needs to know the parentheses were there. At runtime the node does nothing of its own.' },
    ],
  },
];
