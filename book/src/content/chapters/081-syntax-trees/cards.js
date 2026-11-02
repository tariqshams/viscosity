// Chapter 81 cards. Keys are stable ids: never rename them.
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
    a: 'The `;`, and the helper rules of the grammar (like `item`). The `print` keyword becomes the node’s kind, not a child.',
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
  'stmt-in-expr': {
    q: 'Why is `let x = print 1;` a syntax error in Drip?',
    a: 'After `=` the grammar needs an expression, something with a value, and `print 1` is a statement. The parser says “expected an expression, found \'print\'”.',
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

const helpers = `const lit = (value) =>
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
`;

const L = (v) => `{ kind: 'literal', value: ${v} }`;

export const exercises = {
  buildTree: {
    title: 'Build two trees by hand',
    prompt:
      'Using the helpers `lit`, `bin`, `neg` and `grp` (they make literal, binary, unary minus and grouping nodes), write `tree1()`, which returns the AST of `(1 + 2) * -3`, and `tree2()`, which returns the AST of `2 * 3 + 1`. Remember that the operation that happens first is deeper in the tree, and that brackets become a grouping node.',
    starter: `${helpers}
// (1 + 2) * -3
function tree1() {
  // your code here
}

// 2 * 3 + 1
function tree2() {
  // your code here
}

console.log(tree1());`,
    solution: `${helpers}
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
      left: ${L(1)}, right: ${L(2)},
    } },
    right: { kind: 'unary', operator: { lexeme: '-' }, right: ${L(3)} },
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
      left: ${L(2)}, right: ${L(3)},
    },
    right: ${L(1)},
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
        code: `${helpers}
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
        code: `${helpers}
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
    prompt:
      'Write `literals(e)`, which returns an array of every literal’s value in the tree, from left to right, for the kinds `literal`, `grouping`, `unary` and `binary`. Throw an `Error` for any other kind. For the tree of `-2 * (3 + 4)` the answer is `[2, 3, 4]`.',
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
    tests: `${helpers}
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
      { t: 'Nothing; it is only safe at runtime', why: 'The checker knows, before the program runs, that this `e` is the unary variant.' },
      { t: 'The `kind` check narrows the discriminated union to the unary variant, which has `right`', correct: true, why: 'Exactly the narrowing from the chapter on tagged unions.' },
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
    q: 'In the AST of `print -2 * (3 + 4);`, what happens to the two bracket tokens?',
    options: [
      { t: 'Each becomes a node of its own', why: 'Brackets are punctuation; neither is stored as a node.' },
      { t: 'Together they become one grouping node around the sum', correct: true, why: 'Drip keeps a grouping node so the brackets can be shown again; the tokens themselves are dropped.' },
      { t: 'They are stored as the `*` node’s operator', why: 'The `*` node’s operator is the `*` token.' },
      { t: 'They vanish and leave nothing behind', why: 'That is true of the `;`, but Drip keeps a grouping node where brackets were.' },
    ],
  },
  {
    q: 'What does Drip report for `let x = print 1;`?',
    options: [
      { t: 'Nothing: x becomes 1', why: '`print 1` is a statement, so it has no value to store.' },
      { t: '`runtime error: undefined variable \'print\'`', why: '`print` is a keyword, not a variable; the problem is found by the parser, before anything runs.' },
      { t: '`line 1: expected an expression, found \'print\'`', correct: true, why: 'After `=` the grammar needs an expression, and the parser finds the keyword of a statement instead.' },
    ],
  },
];
