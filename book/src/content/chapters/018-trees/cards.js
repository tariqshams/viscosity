// Cards for the chapter 18 (trees).
// Keys are stable ids: never rename them.

export const prompts = {
  'tree-what': {
    q: 'What is a tree, as data?',
    a: 'Nodes that can hold child nodes, each of which is a smaller tree.',
  },
  'root-leaf': {
    q: 'In a tree, what are the **root** and the **leaves**?',
    a: 'The root is the node at the top; the leaves are the nodes with no children.',
  },
  'one-parent': {
    q: 'How many parents does each node of a tree have?',
    a: 'Exactly one, except the root, which has none. Branches never join up again.',
  },
  'count-base': {
    q: '`count` has no `if`. Where is its base case?',
    a: 'In the loop: a leaf has no children, so the loop runs zero times and `count` returns 1.',
  },
  'child-tree': {
    q: 'Why can `count` call itself on each child?',
    a: 'Each child is a whole tree itself (a subtree), so the same function answers the same question about it.',
  },
  'brackets-gone': {
    q: 'Why does the tree for `(2 + 3) * 4` need no brackets?',
    a: 'The addition is a child of the multiplication, so the shape of the tree already says it must be worked out first.',
  },
  'tree-why-recursion': {
    q: 'Why can a fixed number of nested loops not walk any folder tree?',
    a: 'The depth is unknown until the program runs; recursion goes as deep as the tree does.',
  },
  'leaf-base': {
    q: 'When a recursive function walks a tree, what is usually its base case?',
    a: 'A leaf: a node with no children.',
  },
};

export const examples = {
  'count-tree': {
    title: 'Counting a folder tree',
    code: `const docs = {
  name: 'docs',
  children: [
    { name: 'a.txt', children: [] },
    { name: 'pics', children: [
      { name: 'cat.png', children: [] },
    ] },
  ],
};

function count(node) {
  let total = 1;
  for (const c of node.children) {
    total = total + count(c);
  }
  return total;
}

console.log(count(docs));`,
  },
};

const evalTests = `const num = (v) => ({ kind: 'num', value: v });
test('a number is its own value', () => {
  expect(evaluate(num(7))).toBe(7);
});
test('adds two numbers', () => {
  const t = { kind: 'add', left: num(2), right: num(3) };
  expect(evaluate(t)).toBe(5);
});
test('multiplies two numbers', () => {
  const t = { kind: 'mul', left: num(6), right: num(7) };
  expect(evaluate(t)).toBe(42);
});
test('(2 + 3) * 4 is 20', () => {
  const t = {
    kind: 'mul',
    left: { kind: 'add', left: num(2), right: num(3) },
    right: num(4),
  };
  expect(evaluate(t)).toBe(20);
});
test('deep nesting: 1 + (2 + (3 + 4))', () => {
  const t = { kind: 'add', left: num(1), right: {
    kind: 'add', left: num(2), right: {
      kind: 'add', left: num(3), right: num(4) } } };
  expect(evaluate(t)).toBe(10);
});`;

export const exercises = {
  evaluate: {
    title: 'A tiny interpreter',
    prompt: `Write \`evaluate(node)\` that returns the value of an expression tree. A node is one of:

- \`{ kind: 'num', value: 5 }\`: a number;
- \`{ kind: 'add', left, right }\`: left plus right;
- \`{ kind: 'mul', left, right }\`: left times right.

\`left\` and \`right\` are nodes themselves, so they can be any of the three. The tree for \`(2 + 3) * 4\` should evaluate to \`20\`.`,
    starter: `function evaluate(node) {
  // your code here
}

const two = { kind: 'num', value: 2 };
const t = {
  kind: 'add', left: two, right: two,
};
console.log(evaluate(t));`,
    solution: `function evaluate(node) {
  if (node.kind === 'num') {
    return node.value;
  }
  const a = evaluate(node.left);
  const b = evaluate(node.right);
  if (node.kind === 'add') {
    return a + b;
  }
  return a * b;
}`,
    tests: evalTests,
    hints: [
      'Which kind of node can you answer without looking any deeper? That is your base case.',
      'For `add` and `mul`, you don’t know the values of `left` and `right` yet. But `evaluate` computes the value of *any* node…',
      'Call `evaluate(node.left)` and `evaluate(node.right)`, then combine the two results with `+` or `*` depending on `node.kind`.',
    ],
    walkthrough: `**How to think about it.** The trick of recursion is to **trust the function you are writing**: assume \`evaluate\` already works on any smaller tree, and use it. Then ask the two usual questions. Which node can be answered without looking any deeper? A \`num\` node: its value is right there. And for an \`add\` or \`mul\` node, if someone handed you the values of its two children, how would you finish? Add them or multiply them. The children are whole trees, of any depth, but that does not matter, because \`evaluate\` handles any tree.

**The solution, line by line.**

- \`function evaluate(node) {\` takes one node, which may be the root of a big tree or a single leaf.
- \`  if (node.kind === 'num') {\` checks for the base case, a leaf.
- \`    return node.value;\` answers it directly: a number's value is itself.
- \`  }\` ends the base case.
- \`  const a = evaluate(node.left);\` works out the whole left subtree, however deep, and keeps its value in \`a\`. This frame waits while that happens.
- \`  const b = evaluate(node.right);\` does the same for the right subtree.
- \`  if (node.kind === 'add') {\` and \`    return a + b;\` combine the two values for an addition.
- \`  }\` ends that case.
- \`  return a * b;\` handles the only kind left, \`mul\`.
- \`}\` ends the function.

Trace \`(2 + 3) * 4\`: the \`mul\` frame asks for its left side and waits. The \`add\` frame asks for \`2\` (a base case), then \`3\` (another), and returns \`5\`. Back in \`mul\`, the right side is \`4\`, so the answer is \`20\`. At the deepest point there were three frames on the stack: \`mul\`, \`add\` and one \`num\`.

This is, in miniature, the tree-walking interpreter you will build in Part III. The real one has more kinds of node, but the shape of the code stays exactly the same.

**Common wrong attempts.**

- Reading \`node.left.value\` directly works only when both children are numbers. For \`(2 + 3) * 4\`, \`node.left\` is an \`add\` node, which has no \`value\`, so \`a\` is \`undefined\` and the answer is \`NaN\`. Call \`evaluate\` on each child instead.
- Recursing before checking for \`num\`: a leaf has no \`left\`, so the function calls itself with \`undefined\` and crashes trying to read \`undefined.left\`. Handle the base case first.`,
    wrong: [
      {
        code: `function evaluate(node) {
  if (node.kind === 'num') {
    return node.value;
  }
  const a = node.left.value;
  const b = node.right.value;
  if (node.kind === 'add') {
    return a + b;
  }
  return a * b;
}`,
        why: 'This only works when both children are numbers. For `(2 + 3) * 4`, `node.left` is an `add` node, which has no `value`, so `a` is `undefined`. Call `evaluate` on each child instead.',
      },
      {
        code: `function evaluate(node) {
  const a = evaluate(node.left);
  const b = evaluate(node.right);
  if (node.kind === 'add') {
    return a + b;
  }
  return a * b;
}`,
        why: 'There is no base case. A `num` node has no `left`, so the function calls itself with `undefined` and crashes trying to read `undefined.left`. Handle `num` first, before recursing.',
      },
    ],
  },
  depth: {
    optional: true,
    title: 'How deep do the folders go?',
    prompt:
      'Write `depth(node)` for a folder tree like the one at the start of the chapter (every node has a `children` array). A node with no children has depth `1`. Otherwise its depth is one more than the deepest of its children. The chapter’s `docs` tree has depth `3` (docs → pics → cat.png).',
    starter: `function depth(node) {
  // your code here
}

const leaf = {
  name: 'a', children: [],
};
console.log(depth(leaf));`,
    solution: `function depth(node) {
  let most = 0;
  for (const c of node.children) {
    const d = depth(c);
    if (d > most) {
      most = d;
    }
  }
  return most + 1;
}`,
    tests: `const leaf = () => ({ name: 'f', children: [] });
const dir = (...cs) => ({ name: 'd', children: cs });
test('a leaf has depth 1', () => {
  expect(depth(leaf())).toBe(1);
});
test('one level of children', () => {
  expect(depth(dir(leaf(), leaf()))).toBe(2);
});
test('takes the deepest branch', () => {
  const t = dir(leaf(), dir(dir(leaf())));
  expect(depth(t)).toBe(4);
});
test('width does not count', () => {
  const t = dir(leaf(), leaf(), leaf(), leaf());
  expect(depth(t)).toBe(2);
});`,
    hints: [
      'A leaf’s `children` array is empty, so a loop over it runs zero times. That can be your base case.',
      'Loop over the children, call `depth` on each, and remember the biggest answer.',
      'The node itself adds one level: return the biggest child depth plus 1.',
    ],
    walkthrough: `**How to think about it.** This is \`count\` from the chapter with one change: instead of *adding* the children's answers, keep the *largest*. The depth of a node is "this level, plus the deepest branch below it", and the depth of each branch is the same question asked about a smaller tree.

**The solution, line by line.**

- \`function depth(node) {\` takes the root of a tree (or of a subtree).
- \`  let most = 0;\` holds the deepest child seen so far; before looking at any child, that is 0.
- \`  for (const c of node.children) {\` visits each child.
- \`    const d = depth(c);\` asks for the depth of that whole subtree, however deep it is.
- \`    if (d > most) {\` and \`      most = d;\` keep it if it beats the deepest so far.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return most + 1;\` adds one for this node's own level.
- \`}\` ends the function.

For a leaf the loop runs zero times, so it returns \`0 + 1\`, which is 1: the base case, hiding inside the loop. For the chapter's \`docs\` tree, \`a.txt\` gives 1, \`pics\` gives 2 (its child \`cat.png\` gives 1), so \`docs\` gives \`2 + 1\`, which is 3. Compilers ask this kind of question about syntax trees all the time, for example to find how deeply an expression nests.

**Common wrong attempts.**

- \`return node.children.length + 1;\` counts how many children the root has (its width), not how deep the tree goes; it never looks inside the children.
- Returning \`most\` without the \`+ 1\` forgets the node itself, so a leaf returns 0, its parent returns 0, and so does every node.`,
    wrong: [
      {
        code: `function depth(node) {
  return node.children.length + 1;
}`,
        why: 'This counts how many children the root has (its width), not how deep the tree goes. It never looks inside the children, so it needs a recursive call.',
      },
      {
        code: `function depth(node) {
  let most = 0;
  for (const c of node.children) {
    const d = depth(c);
    if (d > most) {
      most = d;
    }
  }
  return most;
}`,
        why: 'This forgets to count the node itself. A leaf returns 0, its parent returns 0, and so does every node. Return `most + 1`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A recursive function walks a tree whose nodes have a `children` array. What is the natural base case?',
    options: [
      { t: 'The root node', why: 'The root is where the walk starts, not where it stops.' },
      { t: 'A node with no children (a leaf)', correct: true, why: 'There is nothing smaller to recurse on, so the answer is known directly.' },
      { t: 'A node with exactly two children', why: 'Such a node still has children to recurse on.' },
      { t: 'Trees do not need a base case', why: 'Every recursion needs one; for trees it is often hidden in a loop that runs zero times at a leaf.' },
    ],
  },
  {
    q: 'A root has three children, and each of them is a leaf. What is `count(root)`?',
    options: [
      { t: '3', why: 'The root counts itself as well: `total` starts at 1.' },
      { t: '1', why: 'Each child adds its own count of 1.' },
      { t: '4', correct: true, why: '1 for the root, plus 1 for each of the three leaves.' },
      { t: '2', why: 'That would be the tree’s depth, not its number of nodes.' },
    ],
  },
  {
    q: 'In the tree for `(2 + 3) * 4`, which node is the root?',
    options: [
      { t: 'The `add` node', why: 'The addition is inside the multiplication, so it is a child.' },
      { t: 'The leaf `2`', why: 'Leaves are at the bottom.' },
      { t: 'The leaf `4`', why: '`4` is the right child of the root.' },
      { t: 'The `mul` node', correct: true, why: 'The multiplication is the last thing worked out, so it sits at the top, with the addition as its left child.' },
    ],
  },
  {
    q: 'What does `show` (from the chapter) return for the tree of `1 + (2 * 3)`?',
    options: [
      { t: "`'(1 + (2 * 3))'`", correct: true, why: 'Every operation gets its own brackets: the addition is the root, and the multiplication is its right child.' },
      { t: "`'1 + 2 * 3'`", why: '`show` always adds a pair of brackets around each operation.' },
      { t: "`'((1 + 2) * 3)'`", why: 'That is a different tree, with the addition inside the multiplication.' },
      { t: '`7`', why: '`show` turns the tree back into text; it does not work out its value.' },
    ],
  },
  {
    q: 'Why does a tree-walking interpreter for deeply nested programs risk a stack overflow?',
    options: [
      { t: 'Trees take up too much memory to store', why: 'Storing the tree is fine. The problem is the calls made while walking it.' },
      { t: 'It recurses once per level of nesting, and every level adds a frame to the call stack', correct: true, why: 'Deep enough nesting means more unfinished calls than the stack can hold.' },
      { t: 'Interpreters cannot use recursion', why: 'They can, and the one in this book does.' },
      { t: 'Strings in the program are too long', why: 'String length does not add frames.' },
    ],
  },
];
