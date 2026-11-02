// Chapter 62 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ast-what': {
    q: 'What is an abstract syntax tree (AST)?',
    a: 'A program stored as nested nodes, keeping only what affects its meaning.',
  },
  'ast-drops': {
    q: 'Name two things in the source of `print 1 + 2;` that its Drip AST does not store as nodes.',
    a: 'The `;`, and the helper rules of the grammar (like `item`). The `print` keyword becomes the node’s kind, not a child.',
  },
  'tag-narrows': {
    q: 'In TypeScript, why can code read `e.left` only after checking `e.kind === \'binary\'`?',
    a: '`Expr` is a discriminated union. The check narrows `e` to the binary variant, which is the one with `left`.',
  },
  'expr-or-stmt': {
    q: 'What is the difference between an expression and a statement?',
    a: 'An expression produces a value. A statement is run for its effect, such as printing or declaring a variable.',
  },
  'expression-statement': {
    q: 'In Drip, what is the line `f(1);`?',
    a: 'An expression statement: the call expression `f(1)`, run for its effect, with its value thrown away.',
  },
  'printer-what': {
    q: 'What does a tree printer do?',
    a: 'It turns a tree back into text, so a person can check the tree’s shape.',
  },
  'printer-output': {
    q: 'What does Drip’s `printExpr` print for the tree of `(1 + 2) * 3`?',
    a: '`(* (group (+ 1 2)) 3)`',
  },
  'why-prefix': {
    q: 'Why does Drip’s printer put brackets and the operator first, rather than printing `1 + 2 * 3` as it was written?',
    a: 'Written plainly, two different trees can print as the same text. Bracketing every node makes each tree print differently.',
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

export const exercises = {
  buildTree: {
    optional: true,
    title: 'Build two trees by hand',
    prompt: 'Using the helpers `lit`, `bin`, `neg` and `grp` (they make literal, binary, unary minus and grouping nodes), write `tree1()`, which returns the AST of `(1 + 2) * -3`, and `tree2()`, which returns the AST of `2 * 3 + 1`. Remember that the operation that happens first is deeper in the tree, and that brackets become a grouping node.',
    starter: `const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const bin = (left, o, right) => ({
  kind: 'binary', left,
  operator: op(o), right,
});
const neg = (right) => ({
  kind: 'unary', operator: op('-'),
  right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

// (1 + 2) * -3
function tree1() {
  // your code here
}

// 2 * 3 + 1
function tree2() {
  // your code here
}

console.log(tree1());`,
    solution: `const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const bin = (left, o, right) => ({
  kind: 'binary', left,
  operator: op(o), right,
});
const neg = (right) => ({
  kind: 'unary', operator: op('-'),
  right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

function tree1() {
  const sum = bin(lit(1), '+', lit(2));
  return bin(grp(sum), '*',
    neg(lit(3)));
}

function tree2() {
  const prod = bin(lit(2), '*', lit(3));
  return bin(prod, '+', lit(1));
}`,
    tests: `test('tree1: the root is the *', () => {
  const t = tree1();
  expect(t.kind).toBe('binary');
  expect(t.operator.lexeme).toBe('*');
});
test('tree1: the whole tree', () => {
  expect(tree1()).toEqual({
    kind: 'binary', operator: { lexeme: '*' },
    left: { kind: 'grouping', expression: {
      kind: 'binary', operator: { lexeme: '+' },
      left: { kind: 'literal', value: 1 }, right: { kind: 'literal', value: 2 },
    } },
    right: { kind: 'unary', operator: { lexeme: '-' }, right: { kind: 'literal', value: 3 } },
  });
});
test('tree2: the root is the +', () => {
  expect(tree2().operator.lexeme).toBe('+');
});
test('tree2: the whole tree', () => {
  expect(tree2()).toEqual({
    kind: 'binary', operator: { lexeme: '+' },
    left: {
      kind: 'binary', operator: { lexeme: '*' },
      left: { kind: 'literal', value: 2 }, right: { kind: 'literal', value: 3 },
    },
    right: { kind: 'literal', value: 1 },
  });
});`,
    hints: [
      'Find the root first: it is the operation that happens *last*. In `(1 + 2) * -3` the sum and the minus are both worked out before the product, so the root is the `*`.',
      'Build from the inside out. For `tree1`, first make the sum, `bin(lit(1), \'+\', lit(2))`, then wrap it with `grp(...)` for the brackets, and make the right side with `neg(lit(3))`.',
      'For `tree2`, `*` happens before `+`, so the product `bin(lit(2), \'*\', lit(3))` is the *left child* of a `+` node whose right child is `lit(1)`. No brackets in the source means no `grp`.',
    ],
    walkthrough: `**How to think about it.** A tree is read from the top as "the last thing that happens", and from the bottom as "the first thing that happens". So the way to build one by hand is to ask, of the whole expression, *which operation happens last?* That is the root, and the pieces on either side of it are its children, which you build the same way. In \`(1 + 2) * -3\`, the brackets force the sum to happen before anything else, and the minus applies only to \`3\`, so the product happens last: the root is \`*\`. Its left child is the bracketed sum (wrapped in a grouping node, because there were brackets), and its right child is "minus 3". In \`2 * 3 + 1\`, multiplication happens before addition (as at school), so \`+\` happens last, and the product is its left child.

**The solution, line by line.**

- The helpers at the top are given: \`lit(v)\` makes \`{ kind: 'literal', value: v }\`; \`bin(l, o, r)\` makes a binary node whose operator is the token-like object \`{ lexeme: o }\`; \`neg(r)\` makes a unary minus node; \`grp(e)\` makes a grouping node around \`e\`.
- \`function tree1() {\` starts the first tree.
- \`  const sum = bin(lit(1), '+', lit(2));\` builds the innermost piece first: a binary \`+\` node with the literal 1 on the left and 2 on the right.
- \`  return bin(grp(sum), '*',\` builds the root: a \`*\` node whose left child is that sum wrapped in a grouping node, because the source had brackets there.
- \`    neg(lit(3)));\` is the root's right child: a unary minus node holding the literal 3.
- \`}\` closes it.
- \`function tree2() {\` starts the second.
- \`  const prod = bin(lit(2), '*', lit(3));\` builds the product, which happens first and so sits deeper.
- \`  return bin(prod, '+', lit(1));\` builds the root \`+\`, with the product on its left and the literal 1 on its right.
- \`}\` closes it.

Read the result of \`tree1()\` aloud from the top: "multiply (the group of (1 plus 2)) by (minus 3)", which is \`3 * -3\`, or \`-9\`, exactly what the source means.

**Common wrong attempts.**

- Leaving out \`grp\` in \`tree1\`: the shape and the value are right, but Drip keeps a grouping node for every pair of brackets, so the tree does not match what the parser builds.
- Building \`tree2\` in source order, \`bin(lit(2), '*', bin(lit(3), '+', lit(1)))\`: this puts the \`+\` deeper, so it means \`2 * (3 + 1)\`, which is \`8\` instead of \`7\`. The order of the tokens is not the shape of the tree.`,
    wrong: [
      {
        code: `const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const bin = (left, o, right) => ({
  kind: 'binary', left,
  operator: op(o), right,
});
const neg = (right) => ({
  kind: 'unary', operator: op('-'),
  right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

function tree1() {
  const sum = bin(lit(1), '+', lit(2));
  return bin(sum, '*', neg(lit(3)));
}

function tree2() {
  const prod = bin(lit(2), '*', lit(3));
  return bin(prod, '+', lit(1));
}`,
        why: 'The brackets in `(1 + 2)` need a grouping node: Drip keeps one for every pair, so the parser’s tree has `grouping` between the `*` and the `+`.',
      },
      {
        code: `const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const bin = (left, o, right) => ({
  kind: 'binary', left,
  operator: op(o), right,
});
const neg = (right) => ({
  kind: 'unary', operator: op('-'),
  right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

function tree1() {
  const sum = bin(lit(1), '+', lit(2));
  return bin(grp(sum), '*',
    neg(lit(3)));
}

function tree2() {
  const s = bin(lit(3), '+', lit(1));
  return bin(lit(2), '*', s);
}`,
        why: 'This puts `+` deeper than `*`, so the tree means `2 * (3 + 1)`. Multiplication happens first, so the product must be the deeper node.',
      },
    ],
  },
  literals: {
    optional: true,
    title: 'Collect the literals',
    prompt: 'Write `literals(e)`, which returns an array of every literal’s value in the tree, from left to right, for the kinds `literal`, `grouping`, `unary` and `binary`. Throw an `Error` for any other kind. For the tree of `-2 * (3 + 4)` the answer is `[2, 3, 4]`.',
    starter: `function literals(e) {
  // your code here
}

const t = {
  kind: 'binary',
  operator: { lexeme: '*' },
  left: { kind: 'literal', value: 6 },
  right: { kind: 'literal', value: 7 },
};
console.log(literals(t)); // [6, 7]`,
    solution: `function literals(e) {
  switch (e.kind) {
    case 'literal':
      return [e.value];
    case 'grouping':
      return literals(e.expression);
    case 'unary':
      return literals(e.right);
    case 'binary':
      return literals(e.left)
        .concat(literals(e.right));
  }
  throw new Error('unknown ' + e.kind);
}`,
    tests: `const lit = (value) =>
  ({ kind: 'literal', value });
const op = (lexeme) => ({ lexeme });
const bin = (left, o, right) => ({
  kind: 'binary', left,
  operator: op(o), right,
});
const neg = (right) => ({
  kind: 'unary', operator: op('-'),
  right,
});
const grp = (expression) =>
  ({ kind: 'grouping', expression });

test('a single literal', () => {
  expect(literals(lit(5))).toEqual([5]);
});
test('-2 * (3 + 4)', () => {
  const e = bin(neg(lit(2)), '*', grp(bin(lit(3), '+', lit(4))));
  expect(literals(e)).toEqual([2, 3, 4]);
});
test('left to right, not top to bottom', () => {
  const e = bin(bin(lit(1), '-', lit(2)), '-', lit(3));
  expect(literals(e)).toEqual([1, 2, 3]);
});
test('none is a literal too', () => {
  expect(literals(grp(lit(null)))).toEqual([null]);
});
test('an unknown kind throws', () => {
  expect(() => literals({ kind: 'mystery' })).toThrow();
});`,
    hints: [
      'Use a `switch (e.kind)` with one case per kind. A literal is the base case: its answer is an array holding just its value.',
      'A grouping or unary node has one child: its answer is its child’s answer, so call `literals` on that child.',
      'A binary node has two children: get the left child’s array, then the right child’s, and join them with `concat`. After the `switch`, `throw`.',
    ],
    walkthrough: `**How to think about it.** This is a walk over the tree, and every walk has the same plan: one case per kind of node, a base case for the leaves, and a call on each child for everything else. The question for each kind is "what is my answer, if I already know my children's answers?" A literal's answer is just its own value, in an array. A node with one child adds nothing of its own, so its answer is its child's answer. A binary node's answer is its left child's literals followed by its right child's, because the left side of the source comes first.

**The solution, line by line.**

- \`function literals(e) {\` takes any expression node.
- \`  switch (e.kind) {\` jumps to the case for this node's kind (in TypeScript this narrows \`e\` in each case).
- \`    case 'literal':\` and \`      return [e.value];\`: the base case, an array of one value. It works for \`null\` too.
- \`    case 'grouping':\` and \`      return literals(e.expression);\`: brackets hold no literal of their own, so ask the inner expression.
- \`    case 'unary':\` and \`      return literals(e.right);\`: the operator is not a literal, so ask the one child.
- \`    case 'binary':\` and \`      return literals(e.left)\` then \`        .concat(literals(e.right));\`: collect the left side's values, then join on the right side's; \`a.concat(b)\` returns a new array with \`b\`'s items after \`a\`'s.
- \`  }\` closes the \`switch\`.
- \`  throw new Error('unknown ' + e.kind);\` is reached only if no case matched, so a kind you forgot fails loudly instead of returning \`undefined\`.
- \`}\` closes the function.

For \`-2 * (3 + 4)\`: the root's left child is the unary node, whose answer is \`[2]\`; its right child is the grouping, whose answer is the sum's, \`[3, 4]\`; joined, \`[2, 3, 4]\`.

**Common wrong attempts.**

- Joining the right child's values before the left child's: the walk still visits every node, but \`1 - 2 - 3\` comes out as \`[3, 2, 1]\` (the right child of the root is the \`3\`).
- Leaving out the grouping case: any tree with brackets in it falls through to the \`throw\`.`,
    wrong: [
      {
        code: `function literals(e) {
  switch (e.kind) {
    case 'literal':
      return [e.value];
    case 'grouping':
      return literals(e.expression);
    case 'unary':
      return literals(e.right);
    case 'binary':
      return literals(e.right)
        .concat(literals(e.left));
  }
  throw new Error('unknown ' + e.kind);
}`,
        why: 'The right child’s values come first, so the order is reversed: `-2 * (3 + 4)` gives `[3, 4, 2]`.',
      },
      {
        code: `function literals(e) {
  switch (e.kind) {
    case 'literal':
      return [e.value];
    case 'unary':
      return literals(e.right);
    case 'binary':
      return literals(e.left)
        .concat(literals(e.right));
  }
  throw new Error('unknown ' + e.kind);
}`,
        why: 'The grouping case is missing, so any tree with brackets in it throws.',
      },
    ],
  },
  printTree: {
    title: 'Write the tree printer',
    prompt: 'Write `printExpr(e)` for four kinds of node: `literal` (`value`), `grouping` (`expression`), `unary` (`operator`, `right`) and `binary` (`left`, `operator`, `right`). Print like Drip: a literal as its value (`null` as `none`), and the others as `(group x)`, `(op x)` and `(op x y)`, using `operator.lexeme`. Throw an `Error` for any other kind.',
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
    tests: `const tLit = (value) =>
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
    prompt: 'A `printExpr` is given. Write `printStmt(s)` for four kinds of statement: `print` (`expression`) as `(print X)`; `expression` (`expression`) as `(; X)`; `let` (`name`, `initializer`) as `(let x X)`, or `(let x)` when the initialiser is `null`; and `block` (`statements`) as `(block S1 S2 ...)`, or `(block)` when empty. Use `name.lexeme` for the name. Throw for any other kind.',
    starter: `// given: prints literals and + - * /
function printExpr(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  return '(' + e.operator.lexeme +
    ' ' + printExpr(e.left) +
    ' ' + printExpr(e.right) + ')';
}

function printStmt(s) {
  // your code here
}

const one = {
  kind: 'literal', value: 1,
};
console.log(printStmt({
  kind: 'print', expression: one,
})); // (print 1)`,
    solution: `// given: prints literals and + - * /
function printExpr(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  return '(' + e.operator.lexeme +
    ' ' + printExpr(e.left) +
    ' ' + printExpr(e.right) + ')';
}

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
    tests: `const sLit = (value) => ({ kind: 'literal', value });
const sName = (lexeme) => ({ lexeme });
const sPrint = (e) => ({ kind: 'print', expression: e });
const sExpr = (e) => ({ kind: 'expression', expression: e });
const sLet = (n, e) => ({ kind: 'let', name: sName(n), initializer: e });
const sBlock = (...ss) => ({ kind: 'block', statements: ss });
const sAdd = (l, r) => ({ kind: 'binary', left: l, operator: { lexeme: '+' }, right: r });

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
        code: `// given: prints literals and + - * /
function printExpr(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  return '(' + e.operator.lexeme +
    ' ' + printExpr(e.left) +
    ' ' + printExpr(e.right) + ')';
}

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
    prompt: 'Write `evaluate(e)` for the four expression kinds. A literal gives its value; a grouping gives its inner expression’s value; a unary node (always `-` here) negates; a binary node applies `+`, `-`, `*` or `/` to its children’s values. Throw an `Error` for anything else.',
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
    tests: `const tLit = (value) =>
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

Notice that \`1 - 2 - 3\` gives \`-4\` only because the tree groups it to the left. The evaluator does no precedence work at all: the parser has already decided everything by the shape it built. *Running expressions: a tree that computes* grows this into Drip's real evaluator.

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
    q: 'Which statement about the AST of `print (1 + 2);` is true?',
    options: [
      {
        t: 'It has a node for the semicolon',
        why: 'The `;` only marks where the statement ends. Once the tree exists, its shape says that.',
      },
      {
        t: 'It is a print node holding a grouping node, which holds a binary + node with two literal children',
        correct: true,
        why: 'Drip keeps grouping nodes, and print holds the expression to print.',
      },
      {
        t: 'It is the same as the parse tree',
        why: 'A parse tree has a node for every rule and token; the AST keeps only what matters.',
      },
      {
        t: 'It is a flat list of seven tokens',
        why: 'That is what the scanner produces. The tree is nested.',
      },
    ],
  },
  {
    q: 'In Drip’s `Expr` type, what makes it safe to read `e.right` after `if (e.kind === \'unary\')`?',
    options: [
      {
        t: 'Every Expr has a `right` field',
        why: 'Literals and variables don’t.',
      },
      {
        t: 'Nothing; it is only safe at runtime',
        why: 'The checker knows, before the program runs, that this `e` is the unary variant.',
      },
      {
        t: 'The `kind` check narrows the discriminated union to the unary variant, which has `right`',
        correct: true,
        why: 'Exactly the narrowing of a discriminated union.',
      },
      {
        t: 'TypeScript doesn’t check property names',
        why: 'It does: reading a property a variant may not have is an error.',
      },
    ],
  },
  {
    q: 'Which of these is a statement in Drip, not an expression?',
    options: [
      {
        t: '`x + 1`',
        why: 'It produces a value.',
      },
      {
        t: '`"hi"`',
        why: 'A literal is an expression.',
      },
      {
        t: '`f(2)`',
        why: 'A call produces a value, so it is an expression. (With a `;` after it, it would become an expression statement.)',
      },
      {
        t: '`let x = 1;`',
        correct: true,
        why: 'It declares a variable: it does something rather than producing a value.',
      },
    ],
  },
  {
    q: 'What does Drip’s `printExpr` print for the tree of `-x * 3`?',
    options: [
      {
        t: '`(* (- x) 3)`',
        correct: true,
        why: 'The root is the multiplication; its left child is the unary minus.',
      },
      {
        t: '`(- (* x 3))`',
        why: 'That would mean “negate x * 3”. In Drip, unary minus binds tighter than `*`.',
      },
      {
        t: '`-x * 3`',
        why: 'The printer writes the tree’s shape with brackets, operator first.',
      },
      {
        t: '`((- x) * 3)`',
        why: 'Close in spirit, but Drip’s printer puts the operator first.',
      },
    ],
  },
  {
    q: 'A printer writes binary nodes as `left op right`, with no brackets. What goes wrong?',
    options: [
      {
        t: 'Nothing; it is just harder to read',
        why: 'Worse than that: different trees can print the same.',
      },
      {
        t: 'The trees of `(1 + 2) * 3` and `1 + (2 * 3)`, without grouping nodes, both print as `1 + 2 * 3`',
        correct: true,
        why: 'The printout no longer shows which tree was built, which is the one thing a printer is for.',
      },
      {
        t: 'It cannot print literals',
        why: 'Literals print the same either way.',
      },
    ],
  },
];
