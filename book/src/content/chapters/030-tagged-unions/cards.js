// Chapter 30 cards (tagged unions). Keys are
// stable ids: never rename them. As in chapter 27, the runner erases types
// without checking them, so runnable code here is valid once stripped.

export const prompts = {
  'tag-why': {
    q: 'Why can’t `typeof` tell a circle object from a rectangle object?',
    a: 'Both are objects, so `typeof` gives `\'object\'` for each. You need a tag property such as `kind`.',
  },
  'literal-type': {
    q: 'In `{ kind: \'circle\'; r: number }`, what values does the type `\'circle\'` allow?',
    a: 'Only the exact string `\'circle\'`. It is a literal type.',
  },
  'disc-narrow': {
    q: '`s` is a `Shape` (circle or rect). After `if (s.kind === \'circle\')`, what does the checker know inside the `if`?',
    a: 'That `s` is the circle variant, so `s.r` is allowed.',
  },
  'expr-self': {
    q: 'Why may the `Expr` type mention `Expr` inside its own definition?',
    a: 'Because an `add` or `mul` node holds smaller expressions as its children: a tree is made of trees.',
  },
  'never-what': {
    q: 'What values does the type `never` have?',
    a: 'None at all. It labels a place the program should never reach.',
  },
  'exhaustive-new-kind': {
    q: 'You add a `\'tri\'` variant to `Shape` but forget it in `area`, which ends with `return unreachable(s)`. What does the checker do?',
    a: 'It reports an error at `unreachable(s)`: `s` could still be a triangle, which is not assignable to `never`.',
  },
  'keep-throw': {
    q: 'If the checker proves every case is handled, why keep the `throw` inside `unreachable`?',
    a: 'Types are erased. Bad data can still arrive at run time, and the throw turns it into a clear error instead of a wrong answer.',
  },
  'never-accepts': {
    q: 'When is a call `unreachable(s)`, with parameter type `never`, accepted by the checker?',
    a: 'Only where narrowing has ruled out every variant, so that `s` itself is `never`.',
  },
};

export const examples = {
  shapes: {
    title: 'Read the tag, then the fields',
    lang: 'ts',
    code: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number;
      h: number };

function area(s: Shape): number {
  if (s.kind === 'circle') {
    return Math.PI * s.r * s.r;
  }
  return s.w * s.h;
}

const ss: Shape[] = [
  { kind: 'circle', r: 1 },
  { kind: 'rect', w: 2, h: 3 },
];
for (const s of ss) {
  console.log(s.kind, area(s));
}

// Try adding { kind: 'tri', b: 2 }.
// Why does area give NaN for it?`,
  },
};

export const exercises = {
  evaluate: {
    lang: 'ts',
    title: 'An interpreter, typed',
    prompt:
      'Write `evaluate(e)` that computes the value of an expression tree. An `Expr` is one of: `{ kind: \'num\', value }`, `{ kind: \'add\', left, right }`, `{ kind: \'mul\', left, right }` or `{ kind: \'neg\', arg }` (negation: minus its argument). For any other kind, throw an `Error`. (The runner erases types, so the tests check behaviour; the walkthrough shows the typed version with an exhaustiveness check.)',
    starter: `type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'neg'; arg: Expr }
  | { kind: 'add';
      left: Expr; right: Expr }
  | { kind: 'mul';
      left: Expr; right: Expr };

function evaluate(e: Expr): number {
  // your code here
}

// (1 + 2) * 4
const tree: Expr = {
  kind: 'mul',
  left: {
    kind: 'add',
    left: { kind: 'num', value: 1 },
    right: { kind: 'num', value: 2 },
  },
  right: { kind: 'num', value: 4 },
};
console.log(evaluate(tree));`,
    solution: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    const b = evaluate(e.right);
    return a + b;
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    const b = evaluate(e.right);
    return a * b;
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
  throw new Error('unknown kind');
}`,
    tests: `const num = (v) => ({ kind: 'num', value: v });
test('a number is its own value', () => {
  expect(evaluate(num(7))).toBe(7);
});
test('1 + 2', () => {
  const e = { kind: 'add', left: num(1), right: num(2) };
  expect(evaluate(e)).toBe(3);
});
test('(1 + 2) * 4', () => {
  const sum = { kind: 'add', left: num(1), right: num(2) };
  const e = { kind: 'mul', left: sum, right: num(4) };
  expect(evaluate(e)).toBe(12);
});
test('-(2 * 3)', () => {
  const m = { kind: 'mul', left: num(2), right: num(3) };
  expect(evaluate({ kind: 'neg', arg: m })).toBe(-6);
});
test('an unknown kind throws', () => {
  const e = { kind: 'pow', left: num(2), right: num(3) };
  expect(() => evaluate(e)).toThrow();
});`,
    hints: [
      'Check `e.kind` once for each of the four variants. Which variant needs no further work at all?',
      'A `num` node is the base case: return `e.value`. An `add` node’s value is the value of its left side plus the value of its right side, and those sides are whole trees, so get their values by calling `evaluate` on them.',
      'For `add`: `return evaluate(e.left) + evaluate(e.right);`, and `mul` is the same with `*`. For `neg`, `return -evaluate(e.arg);`. After all four checks, `throw new Error(\'unknown kind\');`.',
    ],
    walkthrough: `**How to think about it.** Start from the smallest tree there is, a single \`num\` node: its value is written inside it, so there is nothing to compute. Now take \`1 + 2\`: an \`add\` node whose children are two \`num\` nodes. Its value is “the value of the left child plus the value of the right child”. The key step is noticing that the children are not always \`num\` nodes; in \`(1 + 2) * 4\` the left child of the \`mul\` is a whole \`add\` tree. So “the value of the left child” is the very same question we are answering, asked about a smaller tree, which means the function should call itself (recursion, from the recursion chapter). It stops because every path down the tree ends at a \`num\` node, the base case.

**The solution, line by line.**

- \`function evaluate(e) {\` takes one node, the root of the tree (or of a smaller tree, on a recursive call).
- \`  if (e.kind === 'num') {\` reads the tag. In typed code this narrows \`e\` to the \`num\` variant, so \`e.value\` is allowed.
- \`    return e.value;\` is the base case: no more calls.
- \`  }\` ends it.
- \`  if (e.kind === 'add') {\` narrows to the \`add\` variant, which has \`left\` and \`right\`.
- \`    const a = evaluate(e.left);\` works out the whole left subtree, however deep it is, and keeps its value.
- \`    const b = evaluate(e.right);\` does the same for the right subtree.
- \`    return a + b;\` combines the two values. For \`1 + 2\` that is \`1 + 2\`, which is \`3\`.
- \`  }\` ends the case.
- The \`mul\` case is the same four lines with \`*\` in place of \`+\`. For \`(1 + 2) * 4\`, its \`a\` is \`3\` (from the \`add\` case) and its \`b\` is \`4\`, so it returns \`12\`.
- \`  if (e.kind === 'neg') {\` is the variant with one child, called \`arg\`.
- \`    return -evaluate(e.arg);\` works out the child, then flips its sign: for \`-(2 * 3)\` that is \`-6\`.
- \`  throw new Error('unknown kind');\` runs only for a kind none of the checks matched, such as \`'pow'\` arriving from outside the checked code.
- \`}\` closes the body.

With types, the last line becomes the exhaustiveness check from the chapter:

\`\`\`ts
function unreachable(x: never): never {
  throw new Error('unknown kind');
}

function evaluate(e: Expr): number {
  if (e.kind === 'num') return e.value;
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    return a + evaluate(e.right);
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    return a * evaluate(e.right);
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
  return unreachable(e);
}
\`\`\`

Delete the \`neg\` check and \`tsc\` reports that \`{ kind: "neg"; arg: Expr; }\` is not assignable to \`never\`.

**Common wrong attempts.**

- Reading \`e.left.value\` instead of calling \`evaluate(e.left)\`. It works when both children happen to be \`num\` nodes, so \`1 + 2\` passes, but in \`(1 + 2) * 4\` the left child is an \`add\` node, which has no \`value\`; \`undefined * 4\` is \`NaN\`.
- Leaving out the final \`throw\`. Every known kind still works, but an unknown kind falls off the end of the function and returns \`undefined\`, a quiet wrong answer. In TypeScript the checker would also complain that not every path returns a number.`,
    wrong: [
      {
        code: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    return e.left.value + e.right.value;
  }
  if (e.kind === 'mul') {
    return e.left.value * e.right.value;
  }
  if (e.kind === 'neg') {
    return -e.arg.value;
  }
  throw new Error('unknown kind');
}`,
        why: 'This only works when the children are `num` nodes. For `(1 + 2) * 4`, the left child is an `add` node, which has no `value`, so the answer is `NaN`. The children are trees: call `evaluate` on them.',
      },
      {
        code: `function evaluate(e) {
  if (e.kind === 'num') {
    return e.value;
  }
  if (e.kind === 'add') {
    const a = evaluate(e.left);
    return a + evaluate(e.right);
  }
  if (e.kind === 'mul') {
    const a = evaluate(e.left);
    return a * evaluate(e.right);
  }
  if (e.kind === 'neg') {
    return -evaluate(e.arg);
  }
}`,
        why: 'Every known kind works, but an unknown kind falls off the end and returns `undefined`. In TypeScript the checker would catch the missing return; at run time only the `throw` protects you.',
      },
    ],
  },
  toText: {
    optional: true,
    lang: 'ts',
    title: 'Print a tree back as text',
    prompt:
      'Write `toText(e)` for the `Expr` type with `num`, `add` and `mul` nodes. A `num` becomes its number as text (`String(e.value)`); an `add` becomes `(` + left + ` + ` + right + `)`, and a `mul` the same with ` * `. So `(1 + 2) * 4` comes out as `((1 + 2) * 4)`. Throw an `Error` for any other kind. (A program that turns a tree back into code is called a printer; Part III has one.)',
    starter: `type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'add';
      left: Expr; right: Expr }
  | { kind: 'mul';
      left: Expr; right: Expr };

function toText(e: Expr): string {
  // your code here
}`,
    solution: `function toText(e) {
  if (e.kind === 'num') {
    return String(e.value);
  }
  if (e.kind === 'add') {
    const l = toText(e.left);
    const r = toText(e.right);
    return '(' + l + ' + ' + r + ')';
  }
  if (e.kind === 'mul') {
    const l = toText(e.left);
    const r = toText(e.right);
    return '(' + l + ' * ' + r + ')';
  }
  throw new Error('unknown kind');
}`,
    tests: `const num = (v) => ({ kind: 'num', value: v });
test('a number', () => {
  expect(toText(num(7))).toBe('7');
});
test('1 + 2', () => {
  const e = { kind: 'add', left: num(1), right: num(2) };
  expect(toText(e)).toBe('(1 + 2)');
});
test('(1 + 2) * 4 keeps its brackets', () => {
  const sum = { kind: 'add', left: num(1), right: num(2) };
  const e = { kind: 'mul', left: sum, right: num(4) };
  expect(toText(e)).toBe('((1 + 2) * 4)');
});
test('an unknown kind throws', () => {
  expect(() => toText({ kind: 'pow' })).toThrow();
});`,
    hints: [
      'This has the same shape as `evaluate`: one case per kind, and the `num` case is the base case.',
      'For `add`, turn each child into text by calling `toText` on it, then glue the pieces together with `+`.',
      'For `add`: `return \'(\' + toText(e.left) + \' + \' + toText(e.right) + \')\';`. `mul` is the same with `\' * \'`. End with a `throw`.',
    ],
    walkthrough: `**How to think about it.** This is \`evaluate\` again with a different answer type: instead of combining the children's *numbers* with \`+\` or \`*\`, we combine the children's *text* with the right symbol between them. The same tag checks pick the case, and the same recursion handles children of any depth. The brackets are the subtle part: without them, the tree for \`(1 + 2) * 4\` would print as \`1 + 2 * 4\`, which a reader (and a parser) would understand as \`1 + (2 * 4)\`, a different tree with a different value. Putting brackets round every \`add\` and \`mul\` is the simplest way to make sure the text means exactly the tree.

**The solution, line by line.**

- \`function toText(e) {\` takes one node.
- \`  if (e.kind === 'num') {\` and \`    return String(e.value);\` handle the base case: \`String(7)\` is \`'7'\`.
- \`  if (e.kind === 'add') {\` picks the addition case.
- \`    const l = toText(e.left);\` turns the whole left subtree into text, however deep it is.
- \`    const r = toText(e.right);\` does the same for the right.
- \`    return '(' + l + ' + ' + r + ')';\` glues it together. Here \`+\` joins strings, because every piece is a string.
- The \`mul\` case is identical except for \`' * '\`.
- \`  throw new Error('unknown kind');\` guards against data the checker never saw.

For \`(1 + 2) * 4\`: the inner \`add\` gives \`'(1 + 2)'\`, the \`4\` gives \`'4'\`, and the \`mul\` glues them into \`'((1 + 2) * 4)'\`.

**Common wrong attempts.**

- Leaving the brackets out: \`(1 + 2) * 4\` prints as \`1 + 2 * 4\`, which reads as a different expression.
- Forgetting the recursion and writing \`e.left.value\`: the inner \`add\` node has no \`value\`, so the text contains \`undefined\`.`,
    wrong: [
      {
        code: `function toText(e) {
  if (e.kind === 'num') {
    return String(e.value);
  }
  const l = toText(e.left);
  const r = toText(e.right);
  if (e.kind === 'add') {
    return l + ' + ' + r;
  }
  if (e.kind === 'mul') {
    return l + ' * ' + r;
  }
  throw new Error('unknown kind');
}`,
        why: 'Without brackets, `(1 + 2) * 4` prints as `1 + 2 * 4`, which means `1 + (2 * 4)`: a different tree. (It also recurses before checking the kind, so an unknown kind crashes with a `TypeError` rather than a clear error.)',
      },
      {
        code: `function toText(e) {
  if (e.kind === 'num') {
    return String(e.value);
  }
  const l = e.left.value;
  const r = e.right.value;
  if (e.kind === 'add') {
    return '(' + l + ' + ' + r + ')';
  }
  if (e.kind === 'mul') {
    return '(' + l + ' * ' + r + ')';
  }
  throw new Error('unknown kind');
}`,
        why: 'This reads the children’s `value` directly, so an `add` node inside a `mul` prints as `undefined`. Call `toText` on each child.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What makes a union a **discriminated** union?',
    options: [
      { t: 'Every variant has a shared tag property, like `kind`, with a different literal type', correct: true, why: 'Checking that one property tells the checker (and you) which variant you have.' },
      { t: 'It has more than two members', why: 'Size does not matter; the shared tag does.' },
      { t: 'It uses `typeof` at run time', why: '`typeof` cannot tell two kinds of object apart; that is why we add a tag.' },
    ],
  },
  {
    q: '`s` is a `Shape`: circle (`r`) or rect (`w`, `h`). Inside `if (s.kind === \'rect\') { ... }`, which access does the checker allow?',
    options: [
      { t: '`s.r`', why: 'Inside this `if`, `s` has been narrowed to the rect variant, which has no `r`.' },
      { t: '`s.w`', correct: true, why: 'The tag check narrowed `s` to the rect variant, which has `w` and `h`.' },
      { t: 'Neither, until you also check `typeof s`', why: '`typeof s` is `\'object\'` for both; the tag check is what narrows.' },
    ],
  },
  {
    q: 'A function ends with `return unreachable(s)`, where `unreachable(x: never)`. Every kind is handled above it. What is the type of `s` on that line?',
    options: [
      { t: '`Shape`', why: 'Each check that returned removed one variant, so it is no longer the whole `Shape`.' },
      { t: '`undefined`', why: '`undefined` is a real value; here no value at all can arrive.' },
      { t: '`never`', correct: true, why: 'All variants have been narrowed away, so nothing is left. That is what lets the call type-check.' },
    ],
  },
  {
    q: 'Why is the `throw` inside `unreachable` still useful, if the checker proved it cannot be reached?',
    options: [
      { t: 'It is not; you can always delete it', why: 'You can delete it only if no unchecked data ever reaches the function, and you rarely know that.' },
      { t: 'The checker needs it to see the `never` type', why: 'The `never` comes from the parameter type, not the throw.' },
      { t: 'Types are erased, so data from outside the checked code can still have an unexpected kind at run time', correct: true, why: 'The throw turns that into a clear error instead of a quiet wrong answer.' },
    ],
  },
  {
    q: 'How many times is `evaluate` called, in total, to evaluate the tree for `(1 + 2) * 4`?',
    options: [
      { t: '1', why: 'The first call on the root makes more calls for its children.' },
      { t: '3', why: 'That counts only the `num` nodes; the `add` and `mul` nodes are evaluated too.' },
      { t: '5', correct: true, why: 'Once per node: `mul`, `add`, and the three `num` nodes `1`, `2` and `4`.' },
      { t: '12', why: '12 is the value of the tree, not the number of calls.' },
    ],
  },
];
