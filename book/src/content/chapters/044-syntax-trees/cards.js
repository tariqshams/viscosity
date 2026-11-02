// Chapter 44 cards. Keys are stable ids: never rename them.
//
// Trees in the exercises have the same shape as the companion’s Expr
// nodes (companion/ts/src/ast.ts). Operators are token objects; only
// their lexeme matters here, so tests build them as { lexeme: '+' }.

export const prompts = {
  'ast-what': {
    q: 'What is an abstract syntax tree (AST)?',
    a: 'A program stored as nested nodes, keeping only what affects its meaning.',
  },
  'ast-drops': {
    q: 'Name two things in the source of `print 1 + 2;` that its Drip AST does not store as nodes.',
    a: 'The `;`, and the helper rules of the grammar (like `item`). The `print` keyword becomes the node’s kind, not a token child.',
  },
  'node-what': {
    q: 'What does an AST node consist of?',
    a: 'A kind (such as binary or literal) plus its children: smaller nodes and tokens.',
  },
  'tag-narrows': {
    q: 'In TypeScript, why can code read `e.left` only after checking `e.kind === \'binary\'`?',
    a: '`Expr` is a discriminated union. The check narrows `e` to the binary variant, which is the one with `left`.',
  },
  'token-kept': {
    q: 'Why do Drip’s binary nodes hold the whole operator token, not just the string `\'+\'`?',
    a: 'The token carries its line number, so a later error can say where the operator was.',
  },
  'grouping-why': {
    q: 'The shape of the tree already says `(3 + 4)` happens first. Why does Drip still have a `grouping` node?',
    a: 'So a printed tree shows where the brackets were in the source. It isn’t needed for the meaning.',
  },
  'expr-or-stmt': {
    q: 'What is the difference between an expression and a statement?',
    a: 'An expression produces a value. A statement is run for its effect, such as printing or declaring a variable.',
  },
  'expression-statement': {
    q: 'In Drip, what is the line `f(1);`?',
    a: 'An expression statement: the call expression `f(1)`, run for its effect, with its value thrown away.',
  },
  'printer-why': {
    q: 'Why write a tree printer before writing the parser’s tests?',
    a: 'Expected trees become one short line of text, like `(+ 1 (* 2 3))`, instead of nested objects.',
  },
  'printer-output': {
    q: 'What does Drip’s `printExpr` print for the tree of `(1 + 2) * 3`?',
    a: '`(* (group (+ 1 2)) 3)`',
  },
  'printer-order': {
    q: 'When `printExpr` prints a binary node, which strings must it have first?',
    a: 'The strings of both children. It calls itself on them first, so children are finished before their parent.',
  },
};

export const examples = {
  byHand: {
    title: 'Building a tree by hand',
    code: `const lit = (value) =>
  ({ kind: 'literal', value });
const bin = (left, op, right) => ({
  kind: 'binary', left,
  operator: { lexeme: op }, right,
});

// 1 + 2 * 3, as the parser will
// build it: * is deeper, so it
// happens first.
const e = bin(lit(1), '+',
  bin(lit(2), '*', lit(3)));

console.log(e.kind);
console.log(e.left.value);
console.log(e.right.operator.lexeme);
console.log(e.right.right.value);

// Try: build (1 + 2) * 3 instead.`,
  },
};

const helpers = `const tLit = (value) =>
  ({ kind: 'literal', value });
const tOp = (lexeme) => ({ lexeme });
const tBin = (l, o, r) =>
  ({ kind: 'binary', left: l,
     operator: tOp(o), right: r });
const tNeg = (r) =>
  ({ kind: 'unary', operator: tOp('-'),
     right: r });
const tGrp = (e) =>
  ({ kind: 'grouping', expression: e });
`;

export const exercises = {
  printTree: {
    title: 'Write the tree printer',
    prompt:
      'Write `printExpr(e)` for four kinds of node: `literal` (`value`), `grouping` (`expression`), `unary` (`operator`, `right`) and `binary` (`left`, `operator`, `right`). Print like Drip: a literal as its value (`null` as `nil`), and the others as `(group x)`, `(op x)` and `(op x y)`, using `operator.lexeme`. Throw an `Error` for any other kind.',
    starter: `function printExpr(e) {
  // your code here
}

// -2 * (3 + 4)
const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const t = {
  kind: 'binary', operator: op('*'),
  left: {
    kind: 'unary', operator: op('-'),
    right: lit(2),
  },
  right: {
    kind: 'grouping',
    expression: {
      kind: 'binary', operator: op('+'),
      left: lit(3), right: lit(4),
    },
  },
};
console.log(printExpr(t));`,
    solution: `function printExpr(e) {
  switch (e.kind) {
    case 'literal':
      return e.value === null
        ? 'nil' : String(e.value);
    case 'grouping':
      return '(group ' +
        printExpr(e.expression) + ')';
    case 'unary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.right) + ')';
    case 'binary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.left) +
        ' ' + printExpr(e.right) + ')';
  }
  throw new Error('unknown ' + e.kind);
}`,
    tests: `${helpers}
test('literals', () => {
  expect(printExpr(tLit(4))).toBe('4');
  expect(printExpr(tLit(true))).toBe('true');
  expect(printExpr(tLit('hi'))).toBe('hi');
});
test('nil', () => {
  expect(printExpr(tLit(null))).toBe('nil');
});
test('1 + 2', () => {
  expect(printExpr(tBin(tLit(1), '+', tLit(2)))).toBe('(+ 1 2)');
});
test('-2 * (3 + 4)', () => {
  const e = tBin(tNeg(tLit(2)), '*', tGrp(tBin(tLit(3), '+', tLit(4))));
  expect(printExpr(e)).toBe('(* (- 2) (group (+ 3 4)))');
});
test('1 - 2 - 3, grouped to the left', () => {
  const e = tBin(tBin(tLit(1), '-', tLit(2)), '-', tLit(3));
  expect(printExpr(e)).toBe('(- (- 1 2) 3)');
});
test('an unknown kind throws', () => {
  expect(() => printExpr({ kind: 'mystery' })).toThrow();
});`,
    hints: [
      'Use a `switch (e.kind)` (or a chain of `if`s) with one case per kind. A literal is the base case: return its value as a string, or `\'nil\'` for `null`.',
      'For a binary node, call `printExpr` on `e.left` and on `e.right`, and glue the pieces: `\'(\' + lexeme + \' \' + left + \' \' + right + \')\'`.',
      'Unary is the same with one child, `e.right`. Grouping prints `(group ` before its child. After the `switch`, throw.',
    ],
    walkthrough: `This is \`printExpr\` from \`companion/ts/src/ast.ts\`, cut down to four kinds.

- **One case per kind.** The tag tells you which fields exist. In TypeScript, the \`switch\` narrows \`e\` in each case.
- **Literal is the base case.** \`String(4)\` is \`'4'\`, \`String(true)\` is \`'true'\`, and a string stays as it is (no quotes are added). Drip’s \`nil\` is stored as \`null\`, which would print as \`'null'\`, so it gets its own check.
- **The other kinds recurse.** A child is a whole tree, and \`printExpr\` already knows how to print a whole tree. So each case calls itself on its children, then wraps the results in brackets with the operator first.
- **Brackets are the shape.** Because every non-literal node adds exactly one pair of brackets, \`(- (- 1 2) 3)\` tells you at a glance that the first subtraction is deeper in the tree, and so happens first.
- **The throw** catches a kind you forgot. In the real file, TypeScript catches it before the code runs.`,
    wrong: [
      {
        code: `function printExpr(e) {
  switch (e.kind) {
    case 'literal':
      return e.value === null
        ? 'nil' : String(e.value);
    case 'grouping':
      return '(' +
        printExpr(e.expression) + ')';
    case 'unary':
      return e.operator.lexeme +
        printExpr(e.right);
    case 'binary':
      return '(' + printExpr(e.left) +
        ' ' + e.operator.lexeme + ' ' +
        printExpr(e.right) + ')';
  }
  throw new Error('unknown ' + e.kind);
}`,
        why: 'This prints the familiar infix form, `((- 2) * ...)`. It is a fine printer, but not Drip’s: the tests expect the operator first, and `(group ...)` for brackets.',
      },
      {
        code: `function printExpr(e) {
  switch (e.kind) {
    case 'literal':
      return String(e.value);
    case 'grouping':
      return '(group ' +
        printExpr(e.expression) + ')';
    case 'unary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.right) + ')';
    case 'binary':
      return '(' + e.operator.lexeme +
        ' ' + printExpr(e.left) +
        ' ' + printExpr(e.right) + ')';
  }
  throw new Error('unknown ' + e.kind);
}`,
        why: 'Almost: `String(null)` is `\'null\'`, but Drip calls that value `nil`.',
      },
    ],
  },
  evalTree: {
    optional: true,
    title: 'Evaluate the tree',
    prompt:
      'Write `evaluate(e)` for the same four kinds. A literal gives its value; a grouping gives its inner expression’s value; a unary node (always `-` here) negates; a binary node applies `+`, `-`, `*` or `/` to its children’s values. Throw an `Error` for anything else.',
    starter: `function evaluate(e) {
  // your code here
}

const t = {
  kind: 'binary',
  operator: { lexeme: '*' },
  left: { kind: 'literal', value: 6 },
  right: { kind: 'literal', value: 7 },
};
console.log(evaluate(t));`,
    solution: `function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'grouping':
      return evaluate(e.expression);
    case 'unary':
      return -evaluate(e.right);
    case 'binary': {
      const a = evaluate(e.left);
      const b = evaluate(e.right);
      const o = e.operator.lexeme;
      if (o === '+') return a + b;
      if (o === '-') return a - b;
      if (o === '*') return a * b;
      if (o === '/') return a / b;
    }
  }
  throw new Error('cannot evaluate');
}`,
    tests: `${helpers}
test('a literal', () => {
  expect(evaluate(tLit(5))).toBe(5);
});
test('-2 * (3 + 4)', () => {
  const e = tBin(tNeg(tLit(2)), '*', tGrp(tBin(tLit(3), '+', tLit(4))));
  expect(evaluate(e)).toBe(-14);
});
test('1 - 2 - 3, grouped to the left', () => {
  const e = tBin(tBin(tLit(1), '-', tLit(2)), '-', tLit(3));
  expect(evaluate(e)).toBe(-4);
});
test('8 / 2 / 2', () => {
  const e = tBin(tBin(tLit(8), '/', tLit(2)), '/', tLit(2));
  expect(evaluate(e)).toBe(2);
});
test('an unknown operator throws', () => {
  expect(() => evaluate(tBin(tLit(2), '^', tLit(3)))).toThrow();
});`,
    hints: [
      'The shape is the same as `printExpr`: one case per kind, recursing into children.',
      'For a binary node, evaluate both children first, then look at `e.operator.lexeme` to decide what to do with the two values.',
      'If no operator matched, fall through to the `throw` at the end.',
    ],
    walkthrough: `Same walk, different result: numbers instead of strings.

- **Literal**: the value is already there.
- **Grouping**: brackets don’t change a value, so just evaluate what’s inside.
- **Unary**: evaluate the child, then negate.
- **Binary**: evaluate left, evaluate right, then pick the operation by the operator’s lexeme. An unknown operator falls out of the \`if\`s, out of the \`switch\`, and into the \`throw\`.

Notice that \`1 - 2 - 3\` gives \`-4\` only because the tree groups it to the left. The evaluator does no precedence work at all: the parser has already decided everything by the shape it built. Chapter 53 grows this into Drip’s real evaluator.`,
    wrong: [
      {
        code: `function evaluate(e) {
  switch (e.kind) {
    case 'literal':
      return e.value;
    case 'unary':
      return -evaluate(e.right);
    case 'binary': {
      const a = evaluate(e.left);
      const b = evaluate(e.right);
      const o = e.operator.lexeme;
      if (o === '+') return a + b;
      if (o === '-') return a - b;
      if (o === '*') return a * b;
      if (o === '/') return a / b;
    }
  }
  throw new Error('cannot evaluate');
}`,
        why: 'The grouping case is missing, so any tree with brackets in it throws.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which statement about the AST of `print (1 + 2);` is true?',
    options: [
      { t: 'It has a node for the semicolon', why: 'The `;` only marks where the statement ends. Once the tree exists, its shape says that.' },
      { t: 'It is a print node holding a grouping node, which holds a binary + node with two literal children', correct: true, why: 'Drip keeps grouping nodes, and print holds the expression to print.' },
      { t: 'It is the same as the parse tree', why: 'A parse tree has a node for every rule and token; the AST keeps only what matters.' },
      { t: 'It is a flat list of six tokens', why: 'That is what the scanner produces. The tree is nested.' },
    ],
  },
  {
    q: 'In Drip’s `Expr` type, what makes it safe to read `e.right` after `if (e.kind === \'unary\')`?',
    options: [
      { t: 'Every Expr has a `right` field', why: 'Literals and variables don’t.' },
      { t: 'Nothing; it is only safe at runtime', why: 'The checker knows, at compile time, that this `e` is the unary variant.' },
      { t: 'The `kind` check narrows the discriminated union to the unary variant, which has `right`', correct: true, why: 'Exactly the narrowing you learned in chapter 16.' },
      { t: 'TypeScript doesn’t check property names', why: 'It does: reading a property a variant may not have is an error.' },
    ],
  },
  {
    q: 'Which of these is a statement in Drip, not an expression?',
    options: [
      { t: '`x + 1`', why: 'It produces a value.' },
      { t: '`"hi"`', why: 'A literal is an expression.' },
      { t: '`f(2)`', why: 'A call produces a value, so it is an expression. (With a `;` after it, it would become an expression statement.)' },
      { t: '`let x = 1;`', correct: true, why: 'It declares a variable: it does something rather than producing a value.' },
    ],
  },
  {
    q: 'What does Drip’s `printExpr` print for the tree of `-x * 3`?',
    options: [
      { t: '`(* (- x) 3)`', correct: true, why: 'The root is the multiplication; its left child is the unary minus.' },
      { t: '`(- (* x 3))`', why: 'That would mean “negate x * 3”. In Drip, unary minus binds tighter than `*`.' },
      { t: '`-x * 3`', why: 'The printer writes the tree’s shape with brackets, operator first.' },
      { t: '`((- x) * 3)`', why: 'Close in spirit, but Drip’s printer puts the operator first.' },
    ],
  },
  {
    q: 'Why is a tree printer useful when testing a parser?',
    options: [
      { t: 'It makes the parser faster', why: 'The printer runs only when you ask for it.' },
      { t: 'It lets you write the expected tree as one short string and compare', correct: true, why: '`(+ 1 (* 2 3))` is far easier to write and read than nested objects.' },
      { t: 'It is needed to run the program', why: 'The interpreter walks the tree directly; printing is only for people.' },
      { t: 'It turns the tree back into the exact source text', why: 'It doesn’t: `"hi"` prints without quotes, and brackets become `group`.' },
    ],
  },
  {
    q: '`printExpr` is called on a binary node whose children are both binary nodes. In what order are the nodes finished?',
    options: [
      { t: 'The root first, then its children', why: 'The root can’t build its string until it has its children’s strings.' },
      { t: 'In the order the tokens appear in the source', why: 'The order follows the tree, not the token list.' },
      { t: 'In a random order', why: 'Recursion is completely predictable.' },
      { t: 'The left child’s subtree, then the right child’s subtree, then the root', correct: true, why: 'Each call finishes its children before itself, so parents finish last.' },
    ],
  },
];
