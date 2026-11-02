// Chapter 264 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'sdt-what': {
    q: 'What is syntax-directed translation, in one sentence?',
    a: 'Translating or evaluating a program by attaching a rule to each grammar production, so each node’s result is built from its parts’ results.',
  },
  'semantic-rule': {
    q: 'In `E → E₁ + T   E.val = E₁.val + T.val`, what is the part after the production called, and what does it say?',
    a: 'A semantic rule: when a node was built by this production, its val is the left child’s val plus the right child’s.',
  },
  'subscript-one': {
    q: 'Why is the first E on the right of `E → E₁ + T` written `E₁`?',
    a: 'Only to tell it apart from the E on the left: it is the same nonterminal, in a different place in the tree.',
  },
  'parser-is-sdt': {
    q: 'Why is a recursive-descent parser that returns syntax-tree nodes doing syntax-directed translation?',
    a: 'Each parse function builds its node from what the functions it called returned: the attribute is “the tree for this part”.',
  },
  'synth-what': {
    q: 'What makes an attribute **synthesised**?',
    a: 'Its value at a node is computed only from attributes of that node’s children (and of the node itself).',
  },
  'synth-order': {
    q: 'In what order must the nodes be visited to compute a synthesised attribute?',
    a: 'Children before parents, for example a post-order walk.',
  },
  'reduce-time': {
    q: 'When does an LR parser run a production’s semantic rule for a synthesised attribute?',
    a: 'At the reduce by that production: the children’s values are on top of its value stack, and the result is pushed in their place.',
  },
  'plus-no-val': {
    q: 'In a syntax-directed definition that computes `val` for arithmetic (as in `E → E₁ + T`, `E.val = E₁.val + T.val`), why do the `+` token and the brackets have no `val`?',
    a: 'They carry no value of their own; they only decide which production was used, and so how the tree is shaped.',
  },
  'annotated-tree': {
    q: 'What is an annotated parse tree?',
    a: 'A parse tree with the attribute values written on its nodes.',
  },
};

export const examples = {
  'two-translations': {
    title: 'One tree, two translations',
    code: `// a node: its production and its kids
// (tokens are left out: no values)
const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
// 3 * (4 + 5)
const tree =
  N('E→T',
    N('T→T*F',
      N('T→F', num(3)),
      N('F→(E)',
        N('E→E+T',
          N('E→T', N('T→F', num(4))),
          N('T→F', num(5))))));

// kids first, then this node's rule
function synth(n, rules) {
  const vals = n.kids.map(
    (k) => synth(k, rules));
  return rules[n.rule](vals, n);
}

const val = {
  'E→E+T': ([a, b]) => a + b,
  'E→T': ([a]) => a,
  'T→T*F': ([a, b]) => a * b,
  'T→F': ([a]) => a,
  'F→(E)': ([a]) => a,
  'F→num': (_, n) => n.v,
};
const code = {
  ...val, // keep the copy rules
  'E→E+T': ([a, b]) => \`\${a} \${b} +\`,
  'T→T*F': ([a, b]) => \`\${a} \${b} *\`,
  'F→num': (_, n) => String(n.v),
};
console.log(synth(tree, val));
console.log(synth(tree, code));`,
  },
};

export const exercises = {
  'synth-eval': {
    title: 'An attribute evaluator, and a rule table',
    prompt: 'A parse-tree node is `{ rule, kids }`, where `rule` names its production (such as `\'E→E+T\'`) and `kids` holds its nonterminal children; `num(v)` and `id(name)` make leaves. A rule table maps each production to a function `(vals, node)` that gets the children’s values in order and returns this node’s value. Write `annotate(n, rules, attr)`: it evaluates the attribute bottom-up, stores each node’s value on the node as `node[attr]`, and returns the root’s value; if a node’s production has no rule, it throws an `Error` with the message `no rule for ` followed by the production. Then fill in the table `isConst`, for the productions `E→E+T`, `E→T`, `T→T*F`, `T→F`, `F→(E)`, `F→num` and `F→id`, so that an expression’s value is `true` exactly when it contains no names.',
    starter: `const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
const id = (name) =>
  ({ rule: 'F→id', name, kids: [] });

function annotate(n, rules, attr) {
  // your code here
}

const isConst = {
};`,
    solution: `const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
const id = (name) =>
  ({ rule: 'F→id', name, kids: [] });

function annotate(n, rules, attr) {
  const rule = rules[n.rule];
  if (!rule) {
    const msg = 'no rule for ' + n.rule;
    throw new Error(msg);
  }
  const vals = n.kids.map(
    (k) => annotate(k, rules, attr));
  n[attr] = rule(vals, n);
  return n[attr];
}

const isConst = {
  'E→E+T': ([a, b]) => a && b,
  'E→T': ([a]) => a,
  'T→T*F': ([a, b]) => a && b,
  'T→F': ([a]) => a,
  'F→(E)': ([a]) => a,
  'F→num': () => true,
  'F→id': () => false,
};`,
    tests: `const val = {
  'E→E+T': ([a, b]) => a + b,
  'E→T': ([a]) => a,
  'T→T*F': ([a, b]) => a * b,
  'T→F': ([a]) => a,
  'F→(E)': ([a]) => a,
  'F→num': (_, n) => n.v,
};
const leaf = (x) => N('E→T', N('T→F', x));
// 3 * (k + 5), where k is a number or a name
const make = (k) => N('E→T',
  N('T→T*F', N('T→F', num(3)),
    N('F→(E)', N('E→E+T', leaf(k),
      N('T→F', num(5))))));
test('the root value comes back', () => {
  expect(annotate(make(num(4)), val, 'val')).toBe(27);
});
test('every node keeps its value', () => {
  const t = make(num(4));
  annotate(t, val, 'val');
  expect(t.val).toBe(27);
  const inner = t.kids[0].kids[1].kids[0];
  expect(inner.rule).toBe('E→E+T');
  expect(inner.val).toBe(9);
  expect(t.kids[0].kids[0].kids[0].val).toBe(3);
});
test('children are done before their parent', () => {
  const seen = [];
  const log = {};
  for (const r of Object.keys(val)) {
    log[r] = (vs, n) => { seen.push(r); return 0; };
  }
  annotate(N('E→E+T', leaf(num(1)), N('T→F', num(2))), log, 'x');
  expect(seen.join(' ')).toBe('F→num T→F E→T F→num T→F E→E+T');
});
test('a missing rule is reported by name', () => {
  const { ['T→F']: _, ...broken } = val;
  let msg = '';
  try { annotate(make(num(4)), broken, 'val'); }
  catch (e) { msg = e.message; }
  expect(msg).toBe('no rule for T→F');
});
test('isConst: all numbers is constant', () => {
  expect(annotate(make(num(4)), isConst, 'c')).toBe(true);
});
test('isConst: a name anywhere is not', () => {
  expect(annotate(make(id('x')), isConst, 'c')).toBe(false);
  expect(annotate(leaf(id('y')), isConst, 'c')).toBe(false);
});`,
    hints: [
      'Start from `synth` in the chapter’s runnable example: it already evaluates the children first and then runs the node’s rule. Three things are new: storing the value, the error, and the new table.',
      'Look the rule up first, `const rule = rules[n.rule]`, and throw `new Error(\'no rule for \' + n.rule)` if it is missing. Then work out the children’s values with `n.kids.map(...)`, calling `annotate` on each, and store the result of the rule as `n[attr]` before returning it.',
      'For `isConst`: a number is constant (`() => true`), a name is not (`() => false`), a sum or a product is constant when both parts are (`([a, b]) => a && b`), and every copy production passes its one child’s value up unchanged (`([a]) => a`).',
    ],
    walkthrough: `**How to think about it.** A synthesised attribute only ever needs the children’s values, so the evaluator is a post-order walk: ask each child for its value (which, recursively, asks its children), then run this node’s rule on the answers. The evaluator knows nothing about arithmetic, or constants, or code: everything about *meaning* lives in the rule table, which is why the same function can compute \`val\`, postfix code or constness. The two new requirements are bookkeeping: the value must be written onto the node (that is what makes an *annotated* tree, which later passes can read), and a missing rule must be reported clearly instead of crashing deep inside with a vague \`TypeError\`.

**The solution, line by line.**

- \`function annotate(n, rules, attr) {\` takes a node, a rule table and the name to store the value under (\`'val'\`, \`'c'\`, anything).
- \`  const rule = rules[n.rule];\` finds the semantic rule for the production that built this node.
- \`  if (!rule) {\` and the two lines inside it build the message \`'no rule for ' + n.rule\` and throw it as an \`Error\`, which reports a missing rule by name, before any work is done. Checking first, rather than after the children, means the error names the *highest* node without a rule.
- \`  const vals = n.kids.map(\` / \`(k) => annotate(k, rules, attr));\` evaluates every child first, in order, each one storing its own value on itself. For a leaf, \`kids\` is empty, so \`vals\` is \`[]\`.
- \`  n[attr] = rule(vals, n);\` runs this node’s rule on the children’s values (and on the node itself, which is how \`F→num\` reads its number) and stores the result on the node. The bracket form \`n[attr]\` is needed because the property’s name is in a variable.
- \`  return n[attr];\` hands the value to the parent, which is waiting for it in its own \`map\`.
- In \`isConst\`, \`'F→num': () => true\` and \`'F→id': () => false\` are the base cases; \`'E→E+T': ([a, b]) => a && b\` says a sum is constant only if both operands are (the array pattern \`[a, b]\` names the two children’s values); the same for \`T→T*F\`; and the three copy productions pass their one value up.

For \`3 * (x + 5)\`: \`x\` gives \`false\`, \`5\` gives \`true\`, the sum gives \`false && true\`, which is \`false\`, the brackets pass it up, and the product gives \`true && false\`: not constant.

**Common wrong attempts.**

- Returning the value without storing it: the root’s answer is right, but the tree is not annotated, so a later pass that reads \`node.val\` finds nothing.
- Leaving out the copy rules (\`E→T\`, \`T→F\`, \`F→(E)\`) in \`isConst\`, because they “do nothing”: almost every tree uses them, and the evaluator stops with \`no rule for E→T\`.
- Using \`a || b\` for a sum: \`x + 5\` would count as constant because \`5\` is.`,
    wrong: [
      {
        code: `const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
const id = (name) =>
  ({ rule: 'F→id', name, kids: [] });

function annotate(n, rules, attr) {
  const rule = rules[n.rule];
  if (!rule) {
    const msg = 'no rule for ' + n.rule;
    throw new Error(msg);
  }
  const vals = n.kids.map(
    (k) => annotate(k, rules, attr));
  return rule(vals, n);
}

const isConst = {
  'E→E+T': ([a, b]) => a && b,
  'E→T': ([a]) => a,
  'T→T*F': ([a, b]) => a && b,
  'T→F': ([a]) => a,
  'F→(E)': ([a]) => a,
  'F→num': () => true,
  'F→id': () => false,
};`,
        why: 'The values are computed but never stored on the nodes, so the tree is not annotated: `t.val` is `undefined`.',
      },
      {
        code: `const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
const id = (name) =>
  ({ rule: 'F→id', name, kids: [] });

function annotate(n, rules, attr) {
  const rule = rules[n.rule];
  if (!rule) {
    const msg = 'no rule for ' + n.rule;
    throw new Error(msg);
  }
  const vals = n.kids.map(
    (k) => annotate(k, rules, attr));
  n[attr] = rule(vals, n);
  return n[attr];
}

const isConst = {
  'E→E+T': ([a, b]) => a || b,
  'E→T': ([a]) => a,
  'T→T*F': ([a, b]) => a || b,
  'T→F': ([a]) => a,
  'F→(E)': ([a]) => a,
  'F→num': () => true,
  'F→id': () => false,
};`,
        why: 'With `||`, one constant operand is enough, so `3 * (x + 5)` counts as constant. Both operands must be constant: `&&`.',
      },
      {
        code: `const N = (rule, ...kids) =>
  ({ rule, kids });
const num = (v) =>
  ({ rule: 'F→num', v, kids: [] });
const id = (name) =>
  ({ rule: 'F→id', name, kids: [] });

function annotate(n, rules, attr) {
  const vals = n.kids.map(
    (k) => annotate(k, rules, attr));
  n[attr] = rules[n.rule](vals, n);
  return n[attr];
}

const isConst = {
  'E→E+T': ([a, b]) => a && b,
  'T→T*F': ([a, b]) => a && b,
  'F→num': () => true,
  'F→id': () => false,
};`,
        why: 'Without the check, a missing rule crashes with `rules[n.rule] is not a function` instead of naming the production; and `isConst` leaves out the copy rules, which nearly every tree needs.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With the rules `E.val = E₁.val + T.val` and `T.val = T₁.val × F.val`, what is `val` at the root of the tree for `2 + 3 * 4`?',
    options: [
      {
        t: '`20`',
        why: 'That would be `(2 + 3) * 4`. The grammar makes `*` bind tighter, so `3 * 4` is one T below the +.',
      },
      {
        t: '`14`',
        correct: true,
        why: 'The T for `3 * 4` gets 12 first; then E → E₁ + T gives 2 + 12 = 14.',
      },
      {
        t: '`9`',
        why: 'That adds all three numbers; the * production multiplies.',
      },
    ],
  },
  {
    q: 'Which of these is a synthesised attribute?',
    options: [
      {
        t: 'The type a declaration gives to the names listed after it',
        why: 'That information comes from a sibling and the parent, flowing down the list: that is an inherited attribute.',
      },
      {
        t: 'The number of statements inside a block, counted from its children',
        correct: true,
        why: 'It is computed from the children only, so it is synthesised.',
      },
      {
        t: 'How deep a node sits below the root',
        why: 'Depth comes from the parent (one more than the parent’s), so it flows down, not up.',
      },
    ],
  },
  {
    q: 'Using the postfix rules (`E.code = E₁.code ++ T.code ++ "+"`, and the same for `*`), what is the code for `(1 + 2) * 3`?',
    options: [
      {
        t: '`1 2 3 + *`',
        why: 'That is the code for `1 * (2 + 3)`, where the sum is the right operand. Here the sum is the left operand of `*`, so its code comes first.',
      },
      {
        t: '`* + 1 2 3`',
        why: 'Operators come after their operands in postfix, not before.',
      },
      {
        t: '`1 2 + 3 *`',
        correct: true,
        why: 'The left operand of `*` is the sum, whose code is `1 2 +`; then comes `3`, then `*`.',
      },
    ],
  },
  {
    q: 'An LR parser computes a synthesised `val` while it parses. When does it run the rule for `E → E₁ + T`?',
    options: [
      {
        t: 'When it shifts the `+`',
        why: 'At that point the right operand has not been read yet, so its value is not known.',
      },
      {
        t: 'When it reduces by `E → E₁ + T`',
        correct: true,
        why: 'Then the values of E₁ and T are on top of the value stack; the rule replaces them with E’s value.',
      },
      {
        t: 'After the whole input is parsed',
        why: 'It does not need to wait: every value it needs is ready at the reduce.',
      },
    ],
  },
  {
    q: 'In a syntax-directed definition for arithmetic, why does the production `E → T` need the rule `E.val = T.val`, which seems to do nothing?',
    options: [
      {
        t: 'Every production needs a rule, or the nodes built by it get no value',
        correct: true,
        why: 'Copy rules pass a value up through a chain of single-child nodes; without one, the walk reaches a node with no rule.',
      },
      {
        t: 'It does not: copy rules can always be left out',
        why: 'Leave it out and every E built by `E → T` has no `val`, so an evaluator that runs one rule per node finds no rule to run there.',
      },
      {
        t: 'It converts the number to a string',
        why: 'It copies the value unchanged.',
      },
    ],
  },
];
