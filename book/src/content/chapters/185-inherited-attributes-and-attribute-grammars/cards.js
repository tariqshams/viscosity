// Chapter 89 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'inh-what': {
    q: 'What makes an attribute **inherited**?',
    a: 'Its value at a node is defined by the parent’s rule, from attributes of the parent and of the node’s siblings: it flows down (or across).',
  },
  'decl-stuck': {
    q: 'In `int a, b, c;`, why can the type of `c` not be a synthesised attribute of c’s leaf?',
    a: 'A leaf has no children to compute it from; the type is written elsewhere in the tree (at the front), so it has to be passed down.',
  },
  'param-return': {
    q: 'In a recursive-descent parser that computes attributes, what do inherited and synthesised attributes become?',
    a: 'Inherited attributes become parameters of the parse function; synthesised attributes become its return value.',
  },
  'binary-scale': {
    q: 'In Knuth’s binary-numeral example, which attribute of a digit is inherited, and why?',
    a: 'Its scale (the power of two for its position): the position is only known from above, not from the digit itself.',
  },
  'ag-what': {
    q: 'What is an attribute grammar?',
    a: 'A context-free grammar whose symbols have synthesised and inherited attributes, with semantic rules on each production defining them from other attributes in that production.',
  },
  circular: {
    q: 'When can an attribute grammar’s values not be computed in any order?',
    a: 'When its rules can make a cycle in the dependency graph: some value would depend, through others, on itself.',
  },
  'width-order': {
    q: 'In the type rules for `int[2][3]`, why does the result say `array(2, array(3, int))` and not the other way round?',
    a: 'The innermost C (the last brackets) wraps the base type first, and each outer C wraps the result of the one inside it: the first brackets end up outermost.',
  },
  'down-then-up': {
    q: 'For `int[2][3]`, in which direction do `b` and `w` travel?',
    a: '`b` (the base type) travels down the chain of C nodes; `w` (the width) is computed at the bottom and travels back up.',
  },
  'l-attributed': {
    q: 'What does L-attributed mean, and why is it useful?',
    a: 'Every inherited attribute uses only the parent and the siblings to its left, so all attributes can be computed in one left-to-right, depth-first pass.',
  },
};

export const examples = {
  binary: {
    title: 'Knuth’s binary numerals: scale down, value up',
    code: `// L gets its scale from above (an
// inherited attribute, a parameter)
// and returns its value (synthesised).
function L(bits, scale) {
  if (bits.length === 0) return 0;
  const last = bits[bits.length - 1];
  const rest = bits.slice(0, -1);
  // the digits to the left sit one
  // power of two higher
  return L(rest, scale + 1) +
    Number(last) * 2 ** scale;
}
function N(s) {
  const [whole, frac = ''] =
    s.split('.');
  return L(whole, 0) +
    L(frac, -frac.length);
}
console.log(N('1101'));
console.log(N('1101.01'));
console.log(N('0.1'));`,
  },
};

export const exercises = {
  'array-width': {
    title: 'The type and width of an array declaration',
    prompt: 'Write the attribute grammar for `T → B C` (from the chapter) as two functions. `arrayType(c, b, bw)` gets a C chain `c` (either `null`, for `C → ε`, or `{ n, rest }`, for `C → [ n ] rest`) and the inherited base type `b` and base width `bw`; it returns the synthesised `{ t, w }`, where `t` is a string such as `\'array(2, array(3, int))\'` and `w` is the width in bytes. `declType(base, c)` looks up the base width in `WIDTH` and returns the same `{ t, w }` for the whole declaration. `dims(2, 3)` builds the chain for `[2][3]`.',
    starter: `const WIDTH =
  { int: 4, float: 8, char: 1 };
// dims(2, 3) is the C chain for [2][3]
const dims = (...ns) => ns.reduceRight(
  (rest, n) => ({ n, rest }), null);

function arrayType(c, b, bw) {
  return { t: b, w: bw };
}

function declType(base, c) {
  // your code here
}`,
    solution: `const WIDTH =
  { int: 4, float: 8, char: 1 };
// dims(2, 3) is the C chain for [2][3]
const dims = (...ns) => ns.reduceRight(
  (rest, n) => ({ n, rest }), null);

function arrayType(c, b, bw) {
  if (c === null) {
    return { t: b, w: bw };
  }
  const inner =
    arrayType(c.rest, b, bw);
  return {
    t: \`array(\${c.n}, \${inner.t})\`,
    w: c.n * inner.w,
  };
}

function declType(base, c) {
  return arrayType(c, base,
    WIDTH[base]);
}`,
    tests: `test('no brackets: the base type', () => {
  expect(declType('int', null)).toEqual({ t: 'int', w: 4 });
});
test('int[3]', () => {
  expect(declType('int', dims(3))).toEqual({ t: 'array(3, int)', w: 12 });
});
test('int[2][3]: the first brackets are outermost', () => {
  expect(declType('int', dims(2, 3))).toEqual({ t: 'array(2, array(3, int))', w: 24 });
});
test('float[2][10]', () => {
  expect(declType('float', dims(2, 10))).toEqual({ t: 'array(2, array(10, float))', w: 160 });
});
test('char[2][2][2]', () => {
  expect(declType('char', dims(2, 2, 2)).w).toBe(8);
});
test('arrayType passes the base down', () => {
  expect(arrayType(dims(5), 'T', 7)).toEqual({ t: 'array(5, T)', w: 35 });
});`,
    hints: [
      'Follow the two rules for C. If the chain is empty (`C → ε`), the answer is the inherited base itself. Otherwise you need the answer for the rest of the chain first.',
      'For `{ n, rest }`: call `arrayType(c.rest, b, bw)` with the same inherited `b` and `bw` (that is `C₁.b = C.b`), then wrap its result: the type becomes `array(n, inner type)` and the width `n × inner width`.',
      'Build the type with a template literal: `` `array(${c.n}, ${inner.t})` ``. `declType` is one line: `return arrayType(c, base, WIDTH[base]);`.',
    ],
    walkthrough: `**How to think about it.** Translate the rules, one production at a time, keeping the two directions straight. The inherited attributes \`b\` and \`bw\` come *in*, so they are parameters; the synthesised \`t\` and \`w\` go *out*, so they are the return value. The production \`C → [ n ] C₁\` says three things: \`C₁\` inherits the same base (so the recursive call gets the same \`b\` and \`bw\`), and \`C\`’s own type and width are built from \`C₁\`’s (so they can only be computed after the call returns). That is the “down, then up” of the stepper, written as a recursive function.

**The solution, line by line.**

- \`function arrayType(c, b, bw) {\` takes the chain and the two inherited values.
- \`  if (c === null) {\` / \`return { t: b, w: bw };\` is \`C → ε\`: no brackets left, so the type is the base type and the width is the base width (\`C.t = C.b; C.w = C.bw\`).
- \`  const inner =\` / \`arrayType(c.rest, b, bw);\` is \`C₁.b = C.b; C₁.bw = C.bw\` (pass the inherited values down unchanged) followed by evaluating \`C₁\`’s synthesised attributes.
- \`  return {\` builds this node’s synthesised attributes from the child’s.
- \`    t: \\\`array(\${c.n}, \${inner.t})\\\`,\` is \`C.t = array(num, C₁.t)\`: this pair of brackets wraps whatever the rest of the chain produced.
- \`    w: c.n * inner.w,\` is \`C.w = num × C₁.w\`: n copies of the inner thing.
- \`function declType(base, c) {\` is \`T → B C\`: \`B\` synthesises the base type and width (the name and \`WIDTH[base]\`), and the rule hands them across to \`C\` as its inherited values; \`T\` copies \`C\`’s results, so the call’s result is returned as it is.

For \`int[2][3]\`: the call for \`[2]\` calls the one for \`[3]\`, which calls the one for \`null\`, which returns \`{ t: 'int', w: 4 }\`; the \`[3]\` call returns \`array(3, int)\` and 12; the \`[2]\` call returns \`array(2, array(3, int))\` and 24.

**Common wrong attempts.**

- A loop over the chain from the front, wrapping as it goes, builds the type inside out: \`array(3, array(2, int))\`. The width happens to be right (multiplication does not care about order), which makes this mistake easy to miss; the rule \`C.t = array(num, C₁.t)\` needs the *inner* result first, which is why it is recursive.
- Adding the widths (\`c.n + inner.w\`) instead of multiplying: an array of 3 ints is 3 × 4 bytes, not 3 + 4.`,
    wrong: [
      {
        code: `const WIDTH =
  { int: 4, float: 8, char: 1 };
// dims(2, 3) is the C chain for [2][3]
const dims = (...ns) => ns.reduceRight(
  (rest, n) => ({ n, rest }), null);

function arrayType(c, b, bw) {
  let t = b;
  let w = bw;
  for (let d = c; d; d = d.rest) {
    t = \`array(\${d.n}, \${t})\`;
    w = d.n * w;
  }
  return { t, w };
}

function declType(base, c) {
  return arrayType(c, base,
    WIDTH[base]);
}`,
        why: 'Wrapping from the front builds the type inside out: `int[2][3]` becomes `array(3, array(2, int))`. The width is still 24, which hides the bug.',
      },
      {
        code: `const WIDTH =
  { int: 4, float: 8, char: 1 };
// dims(2, 3) is the C chain for [2][3]
const dims = (...ns) => ns.reduceRight(
  (rest, n) => ({ n, rest }), null);

function arrayType(c, b, bw) {
  if (c === null) {
    return { t: b, w: bw };
  }
  const inner =
    arrayType(c.rest, b, bw);
  return {
    t: \`array(\${c.n}, \${inner.t})\`,
    w: c.n + inner.w,
  };
}

function declType(base, c) {
  return arrayType(c, base,
    WIDTH[base]);
}`,
        why: 'The width must multiply: `int[3]` is 3 × 4 = 12 bytes, not 3 + 4 = 7.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is naturally an **inherited** attribute?',
    options: [
      {
        t: 'The value of `2 + 3`',
        why: 'That is computed from the children’s values: synthesised.',
      },
      {
        t: 'The number of nodes below a node',
        why: 'Counted from the children: synthesised.',
      },
      {
        t: 'The scope a name is looked up in',
        correct: true,
        why: 'The scope comes from the enclosing blocks, above the name, and is passed down to it.',
      },
    ],
  },
  {
    q: 'With the chapter’s rules, what are the type and width of `int[4][2]`?',
    options: [
      {
        t: '`array(4, array(2, int))`, 32 bytes',
        correct: true,
        why: 'The inner chain `[2]` gives `array(2, int)` and 8; the outer `[4]` wraps it: 4 × 8 = 32.',
      },
      {
        t: '`array(2, array(4, int))`, 32 bytes',
        why: 'The first brackets end up outermost, so the 4 is on the outside.',
      },
      {
        t: '`array(4, array(2, int))`, 10 bytes',
        why: 'Widths multiply: 4 × 2 × 4 bytes, not 4 + 2 + 4.',
      },
    ],
  },
  {
    q: 'An attribute grammar has the rules `A.x = B.y` and `B.y = A.x + 1` on the same production. What is wrong?',
    options: [
      {
        t: 'Nothing: the evaluator computes A.x first',
        why: 'A.x needs B.y, which needs A.x: neither can go first.',
      },
      {
        t: 'B.y is not allowed to be inherited',
        why: 'Inherited attributes are fine; the problem is the cycle.',
      },
      {
        t: 'It is circular: the two values depend on each other, so no order works',
        correct: true,
        why: 'The dependency graph has a cycle, so there is no topological order to compute them in.',
      },
    ],
  },
  {
    q: 'In recursive descent, how is an L-attributed definition usually computed?',
    options: [
      {
        t: 'In a separate pass after parsing, right to left',
        why: 'L-attributed definitions are designed for one left-to-right pass, which is the order recursive descent already works in.',
      },
      {
        t: 'Inherited attributes as parameters, synthesised ones as return values, during the parse',
        correct: true,
        why: 'A parse function receives what comes down and returns what goes up.',
      },
      {
        t: 'Only synthesised attributes can be computed',
        why: 'Inherited attributes become parameters, so they are computed too.',
      },
    ],
  },
  {
    q: 'What does `N(\'10.1\')` return, using Knuth’s binary-numeral rules?',
    options: [
      {
        t: '`2.5`',
        correct: true,
        why: '`10` is 2 (the 1 has scale 1); the fraction `1` has scale −1, worth a half: 2.5.',
      },
      {
        t: '`10.1`',
        why: 'The digits are binary, so `10` means two.',
      },
      {
        t: '`5`',
        why: 'That reads `101` with no point; the point puts the last 1 at scale −1.',
      },
    ],
  },
];
