// Chapter 81b cards (split from chapter 81). Keys are stable ids.
//
// Trees in the exercises have the same shape as the companion’s Expr
// and Stmt nodes (companion/ts/src/ast.ts). Operators and names are
// token objects; only their lexeme matters here, so tests build them
// as { lexeme: '+' }.

export const prompts = {
  'json-why-not': {
    q: 'Why is `JSON.stringify` a poor way to look at a syntax tree?',
    a: 'It prints every field name and brace, so even `1 + 2` is over a hundred characters and the shape is hard to see.',
  },
  'printer-what': {
    q: 'What does a tree printer do?',
    a: 'It turns a tree back into text, so a person can check the tree’s shape.',
  },
  'printer-output': {
    q: 'What does Drip’s `printExpr` print for the tree of `(1 + 2) * 3`?',
    a: '`(* (group (+ 1 2)) 3)`',
  },
  'printer-order': {
    q: 'When `printExpr` prints a binary node, which strings must it have first?',
    a: 'The strings of both children. It calls itself on them first, so children are finished before their parent.',
  },
  'printer-source': {
    q: 'Does `printExpr` give back the original source text?',
    a: 'No: `x += 1` prints as `(+= x 1)`, and brackets come back as `group`. It shows the tree’s shape, not the spelling.',
  },
  'why-prefix': {
    q: 'Why does Drip’s printer put brackets and the operator first, rather than printing `1 + 2 * 3` as it was written?',
    a: 'Written plainly, two different trees can print as the same text. Bracketing every node makes each tree print differently.',
  },
  'no-default': {
    q: 'Why does the real `printExpr` have no `default:` case?',
    a: 'So that if a new node kind is added without a case, TypeScript reports that the function can end without returning a string.',
  },
  'printer-why': {
    q: 'How does a tree printer make parser tests easier to write?',
    a: 'The expected tree becomes one short line of text, like `(+ 1 (* 2 3))`, instead of a nest of objects.',
  },
};

export const examples = {
  showTrees: {
    title: 'JSON versus a tree printer',
    code: `const lit = (value) =>
  ({ kind: 'literal', value });
const bin = (left, op, right) => ({
  kind: 'binary', left,
  operator: { lexeme: op }, right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

function show(e) {
  switch (e.kind) {
    case 'literal':
      return e.value === null
        ? 'none' : String(e.value);
    case 'grouping':
      return '(group ' +
        show(e.expression) + ')';
    case 'binary':
      return '(' + e.operator.lexeme +
        ' ' + show(e.left) +
        ' ' + show(e.right) + ')';
  }
  throw new Error('no case: ' + e.kind);
}

const a = bin(lit(1), '+', lit(2));
console.log(JSON.stringify(a));
console.log(show(a));

const b = bin(grp(a), '*', lit(3));
console.log(show(b));
console.log(show(bin(lit(1), '+',
  bin(lit(2), '*', lit(3)))));

// Try: show(lit(null)), or a tree
// of your own.`,
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

const given = `// given: prints literals and + - * /
function printExpr(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  return '(' + e.operator.lexeme +
    ' ' + printExpr(e.left) +
    ' ' + printExpr(e.right) + ')';
}
`;

const stmtHelpers = `const sLit = (value) => ({ kind: 'literal', value });
const sName = (lexeme) => ({ lexeme });
const sPrint = (e) => ({ kind: 'print', expression: e });
const sExpr = (e) => ({ kind: 'expression', expression: e });
const sLet = (n, e) => ({ kind: 'let', name: sName(n), initializer: e });
const sBlock = (...ss) => ({ kind: 'block', statements: ss });
const sAdd = (l, r) => ({ kind: 'binary', left: l, operator: { lexeme: '+' }, right: r });
`;

export const exercises = {
  printTree: {
    title: 'Write the tree printer',
    prompt:
      'Write `printExpr(e)` for four kinds of node: `literal` (`value`), `grouping` (`expression`), `unary` (`operator`, `right`) and `binary` (`left`, `operator`, `right`). Print like Drip: a literal as its value (`null` as `none`), and the others as `(group x)`, `(op x)` and `(op x y)`, using `operator.lexeme`. Throw an `Error` for any other kind.',
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
        ? 'none' : String(e.value);
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
test('none', () => {
  expect(printExpr(tLit(null))).toBe('none');
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
      'Use a `switch (e.kind)` with one case per kind. A literal is the base case: return its value as a string, or `\'none\'` for `null`.',
      'For a binary node, call `printExpr` on `e.left` and on `e.right`, and glue the pieces: `\'(\' + lexeme + \' \' + left + \' \' + right + \')\'`.',
      'Unary is the same with one child, `e.right`. Grouping prints `(group ` before its child and `)` after. After the `switch`, throw.',
    ],
    walkthrough: `**How to think about it.** Every tree walk has one case per kind of node. For each kind, ask: "if I already had my children's strings, how would I build mine?" A literal has no children, so it is the base case, and its string is just its value. Every other kind wraps its children's strings in one pair of brackets, with the operator (or the word \`group\`) first. You get the children's strings by calling the same function on them, because each child is a whole tree; recursion does the rest. Get the base case right first, then the binary case (the most common), then the two one-child kinds.

**The solution, line by line.**

- \`function printExpr(e) {\` takes any expression node.
- \`  switch (e.kind) {\` jumps to the case matching the node's tag (in TypeScript, each case also narrows \`e\` to that variant, so \`e.left\` is allowed in the binary case).
- \`    case 'literal':\` is the base case.
- \`      return e.value === null\` checks for Drip's \`none\`, which is stored as \`null\`...
- \`        ? 'none' : String(e.value);\` ...and prints it as \`none\`; anything else goes through \`String\`, so \`4\` becomes \`'4'\`, \`true\` becomes \`'true'\`, and a string stays as it is, with no quotes added.
- \`    case 'grouping':\` and \`      return '(group ' +\` start the bracket and the word \`group\`...
- \`        printExpr(e.expression) + ')';\` ...then the printed child and the closing bracket.
- \`    case 'unary':\` and \`      return '(' + e.operator.lexeme +\`: a bracket and the operator's text, such as \`-\`...
- \`        ' ' + printExpr(e.right) + ')';\` ...a space, the one child, and the closing bracket.
- \`    case 'binary':\` and \`      return '(' + e.operator.lexeme +\`: a bracket and the operator...
- \`        ' ' + printExpr(e.left) +\` and \`        ' ' + printExpr(e.right) + ')';\` ...then each child after a space, and the closing bracket.
- \`  }\` closes the \`switch\`.
- \`  throw new Error('unknown ' + e.kind);\` is reached only when no case returned, so a kind you forgot fails loudly. (In the real TypeScript file there is no throw; the type checker catches a missing kind before the code runs.)
- \`}\` closes the function.

Because every non-literal node adds exactly one pair of brackets, \`(- (- 1 2) 3)\` tells you at a glance that the first subtraction is deeper in the tree, and so happens first.

**Common wrong attempts.**

- Printing the familiar infix form, \`((- 2) * ...)\`: a fine printer, but not Drip's, and the tests (like the companion's) expect the operator first and \`(group ...)\` for brackets.
- Using \`String(e.value)\` for every literal: \`String(null)\` is \`'null'\`, but Drip calls that value \`none\`.`,
    wrong: [
      {
        code: `function printExpr(e) {
  switch (e.kind) {
    case 'literal':
      return e.value === null
        ? 'none' : String(e.value);
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
        why: 'Almost: `String(null)` is `\'null\'`, but Drip calls that value `none`.',
      },
    ],
  },
  printStmt: {
    optional: true,
    title: 'Print statements too',
    prompt:
      'A `printExpr` is given. Write `printStmt(s)` for four kinds of statement: `print` (`expression`) as `(print X)`; `expression` (`expression`) as `(; X)`; `let` (`name`, `initializer`) as `(let x X)`, or `(let x)` when the initialiser is `null`; and `block` (`statements`) as `(block S1 S2 ...)`, or `(block)` when empty. Use `name.lexeme` for the name. Throw for any other kind.',
    starter: `${given}
function printStmt(s) {
  // your code here
}

const one = {
  kind: 'literal', value: 1,
};
console.log(printStmt({
  kind: 'print', expression: one,
})); // (print 1)`,
    solution: `${given}
function printStmt(s) {
  switch (s.kind) {
    case 'print':
      return '(print ' +
        printExpr(s.expression) + ')';
    case 'expression':
      return '(; ' +
        printExpr(s.expression) + ')';
    case 'let': {
      const n = s.name.lexeme;
      if (s.initializer === null) {
        return '(let ' + n + ')';
      }
      return '(let ' + n + ' ' +
        printExpr(s.initializer) + ')';
    }
    case 'block':
      return '(block' + s.statements
        .map((t) => ' ' + printStmt(t))
        .join('') + ')';
  }
  throw new Error('unknown ' + s.kind);
}`,
    tests: `${stmtHelpers}
test('print', () => {
  expect(printStmt(sPrint(sAdd(sLit(1), sLit(2))))).toBe('(print (+ 1 2))');
});
test('an expression statement', () => {
  expect(printStmt(sExpr(sLit(7)))).toBe('(; 7)');
});
test('let, with and without a value', () => {
  expect(printStmt(sLet('x', sLit(1)))).toBe('(let x 1)');
  expect(printStmt(sLet('y', null))).toBe('(let y)');
});
test('a block holds statements', () => {
  const b = sBlock(sPrint(sLit(1)), sLet('z', null));
  expect(printStmt(b)).toBe('(block (print 1) (let z))');
});
test('blocks nest, and may be empty', () => {
  expect(printStmt(sBlock(sBlock()))).toBe('(block (block))');
});
test('an unknown kind throws', () => {
  expect(() => printStmt({ kind: 'mystery' })).toThrow();
});`,
    hints: [
      'One case per statement kind. A print statement and an expression statement each hold one expression: print it with the given `printExpr` and wrap it.',
      'For `let`, read the name with `s.name.lexeme`, then check `s.initializer === null` to choose between the two forms.',
      'A block holds statements, so it calls `printStmt` on each one: `s.statements.map((t) => \' \' + printStmt(t)).join(\'\')` gives every child with a space in front, ready to put between `(block` and `)`.',
    ],
    walkthrough: `**How to think about it.** Statements are a second union, with the same plan as expressions: one case per kind, and each case builds its string from its parts. The parts come in two families, which is the point of this exercise: a print, expression or let statement holds an *expression*, so it calls \`printExpr\`; a block holds *statements*, so it calls \`printStmt\`, itself. Two details need care: a \`let\` may have no initialiser (\`null\`, meaning "not there"), and a block may hold any number of statements, including none, so it needs \`map\` and \`join\` rather than a fixed number of pieces.

**The solution, line by line.**

- The given \`printExpr\` prints literals and binary nodes, enough for these tests.
- \`function printStmt(s) {\` takes any statement node.
- \`  switch (s.kind) {\` picks the case by tag.
- \`    case 'print':\`, \`      return '(print ' +\` and \`        printExpr(s.expression) + ')';\`: the word \`print\`, the printed expression, and a closing bracket.
- \`    case 'expression':\` and the two lines after it do the same with \`;\` as the label, since an expression statement is "an expression, then a semicolon".
- \`    case 'let': {\` opens a case with its own braces, so it may declare a \`const\`.
- \`      const n = s.name.lexeme;\` reads the variable's name from its token.
- \`      if (s.initializer === null) {\` and \`        return '(let ' + n + ')';\`: no initialiser, so just the name.
- \`      }\` closes the \`if\`.
- \`      return '(let ' + n + ' ' +\` and \`        printExpr(s.initializer) + ')';\`: otherwise the name, a space and the printed initialiser.
- \`    }\` closes the case.
- \`    case 'block':\` and \`      return '(block' + s.statements\` start the block's string...
- \`        .map((t) => ' ' + printStmt(t))\` ...turn each inner statement into a space plus its own printed form (this is the recursion: statements inside statements)...
- \`        .join('') + ')';\` ...and glue them all together and close the bracket. An empty block maps to an empty array, which joins to \`''\`, giving \`(block)\`.
- \`  }\` and \`  throw new Error('unknown ' + s.kind);\`: a kind with no case fails loudly.
- \`}\` closes the function.

**Common wrong attempts.**

- Calling \`printExpr\` on a block's statements: they are statements, which have no \`operator\`, so the given printer crashes or prints nonsense. Each family needs its own printer.
- Printing \`(let x null)\` for a missing initializer: \`null\` means "there is no expression", which should print nothing, not the word \`null\`.`,
    wrong: [
      {
        code: `${given}
function printStmt(s) {
  switch (s.kind) {
    case 'print':
      return '(print ' +
        printExpr(s.expression) + ')';
    case 'expression':
      return '(; ' +
        printExpr(s.expression) + ')';
    case 'let':
      return '(let ' + s.name.lexeme +
        ' ' + s.initializer + ')';
    case 'block':
      return '(block' + s.statements
        .map((t) => ' ' + printStmt(t))
        .join('') + ')';
  }
  throw new Error('unknown ' + s.kind);
}`,
        why: 'The initialiser is glued on as it is, so `let y;` prints `(let y null)` and `let x = 1;` prints `(let x [object Object])`. It must be printed with `printExpr`, or left out when it is `null`.',
      },
    ],
  },
  evalTree: {
    optional: true,
    title: 'Evaluate the tree',
    prompt:
      'Write `evaluate(e)` for the four expression kinds. A literal gives its value; a grouping gives its inner expression’s value; a unary node (always `-` here) negates; a binary node applies `+`, `-`, `*` or `/` to its children’s values. Throw an `Error` for anything else.',
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
      'The shape is the same as `printExpr`: one case per kind, calling itself on the children. Only the result changes, numbers instead of strings.',
      'For a binary node, evaluate both children first, then look at `e.operator.lexeme` to decide what to do with the two values.',
      'If no operator matched, let the code fall out of the `switch` to a `throw` at the end.',
    ],
    walkthrough: `**How to think about it.** This is the printer again with a different answer for each kind: where the printer asks "what is my string, given my children's strings?", the evaluator asks "what is my value, given my children's values?" A literal already holds its value. Brackets change nothing about a value, so a grouping is worth whatever its inside is worth. A unary minus negates its child's value. A binary node works out both children and then combines them according to its operator.

**The solution, line by line.**

- \`function evaluate(e) {\` takes any expression node.
- \`  switch (e.kind) {\` picks the case by tag.
- \`    case 'literal':\` and \`      return e.value;\`: the base case.
- \`    case 'grouping':\` and \`      return evaluate(e.expression);\`: the value of what is inside.
- \`    case 'unary':\` and \`      return -evaluate(e.right);\`: the negated value of the one child.
- \`    case 'binary': {\` opens a case with its own braces, so it can declare constants.
- \`      const a = evaluate(e.left);\` and \`      const b = evaluate(e.right);\` work out both children first; each may be a whole tree.
- \`      const o = e.operator.lexeme;\` reads the operator's text.
- The four \`if\` lines return \`a + b\`, \`a - b\`, \`a * b\` or \`a / b\` for the matching operator.
- \`    }\` and \`  }\` close the case and the \`switch\`. An operator none of the \`if\`s matched (such as \`^\`) runs off the end of the case, out of the \`switch\`...
- \`  throw new Error('cannot evaluate');\` ...and lands here, as does any unknown kind.
- \`}\` closes the function.

Notice that \`1 - 2 - 3\` gives \`-4\` only because the tree groups it to the left. The evaluator does no precedence work at all: the parser has already decided everything by the shape it built. The chapter "Running expressions: a tree that computes" grows this into Drip's real evaluator.

**Common wrong attempt.** Leaving out the grouping case: any tree with brackets in it falls through to the \`throw\`, even though brackets do not change the value.`,
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
      { t: 'It turns the tree back into the exact source text', why: 'It doesn’t: `x += 1` prints as `(+= x 1)`, and brackets become `group`.' },
    ],
  },
  {
    q: '`printExpr` is called on a binary node whose children are both binary nodes. In what order are the nodes finished?',
    options: [
      { t: 'The root first, then its children', why: 'The root can’t build its string until it has its children’s strings.' },
      { t: 'In the order the tokens appear in the source', why: 'The order follows the tree, not the token list.' },
      { t: 'The left child’s subtree, then the right child’s subtree, then the root', correct: true, why: 'Each call finishes its children before itself, so parents finish last.' },
    ],
  },
  {
    q: 'A printer writes binary nodes as `left op right`, with no brackets. What goes wrong?',
    options: [
      { t: 'Nothing; it is just harder to read', why: 'Worse than that: different trees can print the same.' },
      { t: 'The trees of `(1 + 2) * 3` and `1 + (2 * 3)`, without grouping nodes, both print as `1 + 2 * 3`', correct: true, why: 'The printout no longer shows which tree was built, which is the one thing a printer is for.' },
      { t: 'It cannot print literals', why: 'Literals print the same either way.' },
    ],
  },
  {
    q: 'You add a `ternary` kind to `Expr` but no case for it in `printExpr`, which has no `default`. What happens?',
    options: [
      { t: 'The program crashes the first time it prints anything', why: 'The mistake is found before the program runs at all.' },
      { t: 'Ternary nodes print as an empty string', why: 'TypeScript does not let it get that far.' },
      { t: 'TypeScript reports that the function lacks an ending return statement (error TS2366)', correct: true, why: 'With one kind unhandled, the `switch` can finish without returning a string: the exhaustiveness check.' },
      { t: 'TypeScript adds the missing case for you', why: 'It reports the gap; you write the case.' },
    ],
  },
];
