// Chapter 9 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rec-what': {
    q: 'What is a recursive function?',
    a: 'A function that calls itself, each time on a smaller version of the problem.',
  },
  'base-case': {
    q: 'What is the **base case** of a recursive function?',
    a: 'An input the function answers directly, without calling itself. It is where the recursion stops.',
  },
  smaller: {
    q: 'Why must every recursive call work on a *smaller* problem?',
    a: 'So the calls are guaranteed to reach the base case eventually, instead of going on forever.',
  },
  'frame-what': {
    q: 'What is a stack frame?',
    a: 'The page one unfinished call keeps for its own parameters and local variables.',
  },
  'stack-order': {
    q: 'Calls A, then B, then C are on the call stack. Which one finishes first, and why?',
    a: 'C. It was pushed last, so it is on top: the last call to start is the first to finish.',
  },
  paused: {
    q: 'While `sumTo(2)` is running inside `sumTo(3)`, what is the `sumTo(3)` frame doing?',
    a: 'Waiting, paused part-way through `3 + sumTo(2)`, with its own `n` still 3.',
  },
  'overflow-cause': {
    q: 'What causes a **stack overflow**?',
    a: 'Too many unfinished calls, usually recursion that never reaches its base case: frames keep being pushed until the stack runs out of space.',
  },
  'never-reached': {
    q: '`sumTo` has the base case `if (n === 0)`. What happens with `sumTo(-1)`?',
    a: 'It asks about -2, -3, … and never reaches 0, so it ends in a stack overflow.',
  },
  'tree-what': {
    q: 'What is a tree, as data?',
    a: 'Nodes that can hold child nodes, each of which is a smaller tree. The top node is the root.',
  },
  'leaf-base': {
    q: 'When a recursive function walks a tree, what is usually its base case?',
    a: 'A leaf: a node with no children.',
  },
};

export const examples = {
  'down-up': {
    title: 'Down the stack and back up',
    code: `function down(n) {
  if (n === 0) {
    console.log('bottom');
    return;
  }
  console.log('in ' + n);
  down(n - 1);
  console.log('out ' + n);
}

down(3);`,
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
    walkthrough: `The trick of recursion is to **trust the function you're writing**. Assume \`evaluate\` already works on smaller trees, and use it.

- **Base case.** A \`num\` node has no children. Its value is right there: \`return node.value;\`.
- **Recursive case.** An \`add\` or \`mul\` node has two children, and each child is a whole tree. You don't need to know how deep they go: \`evaluate(node.left)\` gives the left value and \`evaluate(node.right)\` gives the right value.
- **Combine.** Add them for \`add\`, multiply them for \`mul\`.

Trace \`(2 + 3) * 4\`: the \`mul\` frame asks for its left side and waits. The \`add\` frame asks for \`2\` (a base case), then \`3\` (another), and returns \`5\`. Back in \`mul\`, the right side is \`4\`, so the answer is \`20\`. At the deepest point there were three frames on the stack: \`mul\`, \`add\` and one \`num\`.

This is, in miniature, the tree-walking interpreter you'll build in Part III. The real one has more kinds of node, but the shape of the code stays exactly the same.`,
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
      'Write `depth(node)` for a folder tree like the one at the start of the chapter (every node has a `children` array). A node with no children has depth `1`. Otherwise its depth is one more than the deepest of its children. The `docs` tree has depth `4` (docs → pics → old → dog.png).',
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
    walkthrough: `This is \`count\` from the chapter with one change: instead of *adding* the children's answers, keep the *largest*.

- **Start at 0.** \`most\` holds the deepest child seen so far. Before looking at any child, that's 0.
- **Recurse on every child.** \`depth(c)\` is the depth of that whole subtree, however deep it is. Keep it if it beats \`most\`.
- **Add this level.** \`return most + 1;\` counts the current node.

For a leaf the loop runs zero times, so the function returns \`0 + 1 = 1\`. That's the base case, hiding inside the loop. Compilers ask this kind of question about syntax trees all the time, for example to find how deeply an expression nests.`,
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
    q: `What does this print?
\`\`\`
function f(n) {
  if (n === 1) {
    return 1;
  }
  return n * f(n - 1);
}
console.log(f(4));
\`\`\``,
    options: [
      { t: '`4`', why: 'That would be `f(4)` without the recursive call. Here `4` is multiplied by `f(3)`.' },
      { t: '`10`', why: 'That is 4 + 3 + 2 + 1. This function multiplies.' },
      { t: '`24`', correct: true, why: '4 × f(3) = 4 × 3 × f(2) = 4 × 3 × 2 × f(1) = 4 × 3 × 2 × 1 = 24.' },
      { t: 'A stack overflow', why: 'Each call uses a smaller `n`, so the calls reach the base case `n === 1`.' },
    ],
  },
  {
    q: 'In `sumTo(3)`, at the moment the base case `sumTo(0)` is running, how many `sumTo` frames are on the call stack?',
    options: [
      { t: '1', why: 'The earlier calls haven’t finished: each is waiting for the one above it.' },
      { t: '4', correct: true, why: '`sumTo(3)`, `sumTo(2)`, `sumTo(1)` and `sumTo(0)` have all started, and none has returned yet.' },
      { t: '3', why: 'Count `sumTo(0)` itself: it is on top of the other three.' },
      { t: '0', why: 'A running call always has a frame.' },
    ],
  },
  {
    q: 'What does `down(2)` print, in order?\n```\nfunction down(n) {\n  if (n === 0) { return; }\n  console.log(\'in \' + n);\n  down(n - 1);\n  console.log(\'out \' + n);\n}\n```',
    options: [
      { t: '`in 2, out 2, in 1, out 1`', why: 'The `out` line waits until the recursive call has finished, and that call prints its own lines first.' },
      { t: '`in 2, in 1, out 2, out 1`', why: 'The `out` lines come in reverse: the most recent call finishes first.' },
      { t: '`in 1, in 2, out 2, out 1`', why: 'The first call is `down(2)`, so `in 2` prints first.' },
      { t: '`in 2, in 1, out 1, out 2`', correct: true, why: 'Going down prints `in 2`, `in 1`. Then the frames pop in reverse order: `out 1`, then `out 2`.' },
    ],
  },
  {
    q: 'Which of these will cause a stack overflow?',
    options: [
      { t: '`function g(n) { if (n <= 0) return 0; return g(n - 1); }` called as `g(5)`', why: 'Each call gets closer to 0 and stops there.' },
      { t: '`function g(n) { if (n === 0) return 0; return g(n - 2); }` called as `g(5)`', correct: true, why: '5, 3, 1, -1, -3 … skips right past 0. The base case exists but is never reached.' },
      { t: '`function g(n) { return n * 2; }` called as `g(5)`', why: 'No recursion at all: one call, one frame.' },
      { t: '`function g(n) { if (n === 0) return 0; return g(n - 1); }` called as `g(5)`', why: 'Counting down by 1 from 5 lands exactly on 0.' },
    ],
  },
  {
    q: 'A recursive function walks a tree whose nodes have a `children` array. What is the natural base case?',
    options: [
      { t: 'A node with no children (a leaf)', correct: true, why: 'There is nothing smaller to recurse on, so the answer is known directly.' },
      { t: 'The root node', why: 'The root is where the walk starts, not where it stops.' },
      { t: 'A node with exactly two children', why: 'Such a node still has children to recurse on.' },
      { t: 'Trees don’t need a base case', why: 'Every recursion needs one; for trees it is usually hidden in a loop that runs zero times at a leaf.' },
    ],
  },
  {
    q: 'Why does a tree-walking interpreter for deeply nested programs risk a stack overflow?',
    options: [
      { t: 'Trees take up too much memory to store', why: 'Storing the tree is fine. The problem is the calls made while walking it.' },
      { t: 'Strings in the program are too long', why: 'String length doesn’t add frames.' },
      { t: 'Interpreters can’t use recursion', why: 'They can, and the one in this book does.' },
      { t: 'It recurses once per level of nesting, and every level adds a frame to the call stack', correct: true, why: 'Deep enough nesting means more unfinished calls than the stack can hold. A VM with its own frame array avoids relying on the host’s stack.' },
    ],
  },
];
