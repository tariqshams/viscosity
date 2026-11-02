// Chapter 79b cards (split from chapter 79). Keys are stable ids.

export const prompts = {
  'ambiguous-what': {
    q: 'When is a grammar **ambiguous**?',
    a: 'When some sentence has two different parse trees (equivalently, two different leftmost derivations).',
  },
  'levels-fix': {
    q: 'How does a grammar make `*` bind tighter than `+`?',
    a: 'It gives each level its own nonterminal (`term`, `factor`, `primary`), and `*` only joins `primary`s, so a product is always finished before a `+` sees it.',
  },
  'left-rec-assoc': {
    q: 'In `term → term "-" factor | factor`, why must `1 - 2 - 3` group as `(1 - 2) - 3`?',
    a: 'The right side of `-` is a `factor`, which cannot hold a `-`; so the only `-` that can sit lower in the tree is on the left.',
  },
  'dangling-what': {
    q: 'What is the **dangling else**?',
    a: 'In `if a if b s1 else s2` the grammar allows the `else` to belong to either `if`, giving two parse trees.',
  },
  'dangling-fix': {
    q: 'Name two ways languages remove the dangling else.',
    a: 'A rule that `else` belongs to the nearest `if` (as JavaScript says), or requiring braces round every branch (as Drip does).',
  },
  'grammar-not-language': {
    q: 'Is ambiguity a property of a grammar or of the language it describes?',
    a: 'Of the grammar: the same language of sums can have an ambiguous grammar and an unambiguous one.',
  },
  'chomsky-four': {
    q: 'Name the four levels of the Chomsky hierarchy, from smallest to largest.',
    a: 'Regular (type 3), context-free (type 2), context-sensitive (type 1), unrestricted (type 0).',
  },
  'cf-machine': {
    q: 'What does a context-free language need that a finite automaton lacks?',
    a: 'A stack (unbounded memory), to remember how many brackets are still open: a pushdown automaton.',
  },
  'declare-before-use': {
    q: 'Why does a compiler check “every name was declared” in a later pass, not in the grammar?',
    a: 'That rule is not context-free: a context-free grammar cannot make a later name match an earlier one.',
  },
};

export const examples = {
  allValues: {
    title: 'Every value an ambiguous grammar allows',
    code: `// expr → expr op expr | NUMBER
// Every tree has some operator as its
// root; try each one in turn.
function values(ts) {
  if (ts.length === 1) {
    return [Number(ts[0])];
  }
  const out = [];
  const n = ts.length;
  for (let i = 1; i < n; i += 2) {
    const op = ts[i];
    const ls = values(ts.slice(0, i));
    const rs = values(ts.slice(i + 1));
    for (const a of ls) {
      for (const b of rs) {
        if (op === '-') out.push(a - b);
        if (op === '+') out.push(a + b);
        if (op === '*') out.push(a * b);
      }
    }
  }
  return out;
}

const sp = (s) => s.split(' ');
console.log(values(sp('1 - 2 - 3')));
console.log(values(sp('1 + 2 * 3')));
console.log(
  values(sp('8 - 4 - 2 - 1')));`,
  },
};

export const exercises = {
  groupings: {
    title: 'Every tree, written out',
    prompt:
      'Under the ambiguous grammar `expr → expr op expr | NUMBER`, a row of tokens such as `[\'1\', \'-\', \'2\', \'-\', \'3\']` can have several parse trees. Write `groupings(ts)`, returning every tree as a fully bracketed string with no spaces: a single number stays as it is (`\'1\'`), and an operator node is `(left op right)`. List the trees by the position of the root operator, leftmost first, and within that in the order of the left side’s list, then the right side’s. So `groupings(\'1 - 2 - 3\'.split(\' \'))` is `[\'(1-(2-3))\', \'((1-2)-3)\']`.',
    starter: `function groupings(ts) {
  // your code here
  return [];
}

console.log(groupings(
  '1 - 2 - 3'.split(' ')));`,
    solution: `function groupings(ts) {
  if (ts.length === 1) return [ts[0]];
  const out = [];
  const n = ts.length;
  for (let i = 1; i < n; i += 2) {
    const op = ts[i];
    const ls = groupings(
      ts.slice(0, i));
    const rs = groupings(
      ts.slice(i + 1));
    for (const a of ls) {
      for (const b of rs) {
        out.push(\`(\${a}\${op}\${b})\`);
      }
    }
  }
  return out;
}`,
    tests: `const sp = (s) => s.split(' ');
test('one number', () => {
  expect(groupings(['7'])).toEqual(['7']);
});
test('one operator: one tree', () => {
  expect(groupings(sp('1 + 2'))).toEqual(['(1+2)']);
});
test('1 - 2 - 3 has two trees', () => {
  expect(groupings(sp('1 - 2 - 3')))
    .toEqual(['(1-(2-3))', '((1-2)-3)']);
});
test('1 + 2 * 3 has two trees', () => {
  expect(groupings(sp('1 + 2 * 3')))
    .toEqual(['(1+(2*3))', '((1+2)*3)']);
});
test('three operators: five trees', () => {
  expect(groupings(sp('1 - 2 - 3 - 4'))).toEqual([
    '(1-(2-(3-4)))', '(1-((2-3)-4))',
    '((1-2)-(3-4))',
    '((1-(2-3))-4)', '(((1-2)-3)-4)',
  ]);
});`,
    hints: [
      'Every tree of `expr op expr` has one operator at its root. Which positions in the token list can hold the root?',
      'Operators sit at the odd positions 1, 3, 5, …. For the root at position `i`, the left child is a tree of `ts.slice(0, i)` and the right child a tree of `ts.slice(i + 1)`, and those are smaller versions of the same problem.',
      'Recurse on both sides, then pair every left string with every right string in two nested loops: `\'(\' + a + ts[i] + b + \')\'`. A single number is the base case: return `[ts[0]]`.',
    ],
    walkthrough: `**How to think about it.** Do not try to list the trees directly; describe one tree instead. Under \`expr → expr op expr | NUMBER\`, a tree is either a single number, or one operator at the root with a whole tree on its left and a whole tree on its right. So to list *every* tree of a row, choose which operator is the root, list every tree of the tokens to its left, list every tree of the tokens to its right, and combine each left one with each right one. The lists for the two sides are the same problem on shorter rows, which is recursion, and a single number is the base case. This is exactly the shape of the runnable example, with strings in place of numbers.

**The solution, line by line.**

- \`if (ts.length === 1) return [ts[0]];\` is the base case: one token is one number, which has exactly one tree, written as the number itself.
- \`const out = [];\` collects the answers.
- \`const n = ts.length;\` and \`for (let i = 1; i < n; i += 2) {\` visit each operator. In a row like \`1 - 2 - 3\` the numbers are at the even positions and the operators at the odd ones, so start at 1 and step by 2.
- \`const op = ts[i];\` is the root operator. \`const ls = groupings(ts.slice(0, i));\` lists every tree of the left part (for the second \`-\` of \`1 - 2 - 3\`, that is \`1 - 2\`, with one tree, \`(1-2)\`).
- \`const rs = groupings(ts.slice(i + 1));\` lists every tree of the right part.
- The two nested \`for\` loops pair every left tree \`a\` with every right tree \`b\`, and \`\` out.push(\`(\${a}\${op}\${b})\`) \`\` writes the combined tree with the root operator between them, in brackets (a template literal, with each \`\${...}\` filled in).
- \`return out;\` returns them all; their order is root position first, then the left list, then the right list, as the exercise asks.

For \`1 - 2 - 3 - 4\` the root can be any of three operators: the first gives one left tree times two right trees, the middle one gives one times one, and the last gives two times one, five in all. The counts for 1, 2, 3, 4 operators are 1, 2, 5, 14, growing fast (they are the *Catalan numbers*), which is why an ambiguous grammar is no use to a compiler: it must pick one tree, and the grammar gives it no reason to.

**Common wrong attempts.**

- Looping over every position (\`i++\`) treats numbers as roots too, and slicing round a number gives rows that start or end with an operator, which crash or produce nonsense.
- Joining only the *first* tree of each side (\`ls[0]\`, \`rs[0]\`) finds one tree per root position and misses the rest: three trees for \`1 - 2 - 3 - 4\` rather than five.`,
    wrong: [
      {
        code: `function groupings(ts) {
  if (ts.length === 1) return [ts[0]];
  const out = [];
  const n = ts.length;
  for (let i = 1; i < n; i += 2) {
    const l = ts.slice(0, i);
    const r = ts.slice(i + 1);
    const a = groupings(l)[0];
    const b = groupings(r)[0];
    out.push('(' + a + ts[i] + b + ')');
  }
  return out;
}`,
        why: 'It keeps only the first tree of each side, so `1 - 2 - 3 - 4` gives three trees instead of five.',
      },
    ],
  },
  rightLinear: {
    optional: true,
    title: 'Is this grammar regular?',
    prompt:
      'A grammar (as data, with `[]` for ε) is **right-linear**, the regular kind at the bottom of the Chomsky hierarchy, when every body is empty, a single terminal, or a terminal followed by one nonterminal. Write `isRightLinear(rules)`, returning `true` or `false`.',
    starter: `function isRightLinear(rules) {
  // your code here
}

const num = {
  num: [['DIGIT', 'num'], ['DIGIT']],
};
console.log(isRightLinear(num));`,
    solution: `function isRightLinear(rules) {
  const nt = (s) => s in rules;
  for (const head in rules) {
    for (const b of rules[head]) {
      const ok = b.length === 0 ||
        (b.length === 1 && !nt(b[0])) ||
        (b.length === 2 && !nt(b[0]) &&
          nt(b[1]));
      if (!ok) return false;
    }
  }
  return true;
}`,
    tests: `test('numbers: regular', () => {
  expect(isRightLinear({ num: [['DIGIT', 'num'], ['DIGIT']] })).toBe(true);
});
test('a list with an empty body', () => {
  expect(isRightLinear({ xs: [['x', 'xs'], []] })).toBe(true);
});
test('two states', () => {
  expect(isRightLinear({
    a: [['x', 'b']], b: [['y', 'a'], ['y']],
  })).toBe(true);
});
test('brackets: not regular', () => {
  expect(isRightLinear({ p: [['(', 'p', ')'], []] })).toBe(false);
});
test('nonterminal first', () => {
  expect(isRightLinear({ xs: [['xs', 'x'], ['x']] })).toBe(false);
});
test('two nonterminals', () => {
  expect(isRightLinear({
    s: [['a', 's'], ['s', 's']],
  })).toBe(false);
});
test('terminal, terminal', () => {
  expect(isRightLinear({ s: [['a', 'b']] })).toBe(false);
});`,
    hints: [
      'Check every body of every head; one bad body makes the whole grammar not right-linear.',
      'A symbol is a nonterminal when it is a key of `rules`. There are three good shapes: length 0, length 1 with a terminal, length 2 with a terminal then a nonterminal.',
      'Loop with `for (const head in rules)` and `for (const b of rules[head])`; return `false` as soon as a body has none of the three shapes, and `true` after the loops.',
    ],
    walkthrough: `**How to think about it.** The definition is a list of allowed shapes for a body, so the code is a check of every body against that list. A grammar passes only if *every* body passes, which is the "search for a counter-example" pattern: loop, return \`false\` at the first bad body, and return \`true\` if the loop finishes.

**The solution, line by line.**

- \`const nt = (s) => s in rules;\` is a small helper: a symbol is a nonterminal when it is a key of the grammar.
- \`for (const head in rules) {\` visits each nonterminal (\`for...in\` gives an object's keys), and \`for (const b of rules[head]) {\` each of its bodies.
- \`const ok = b.length === 0 || ... ;\` is true when the body has one of the three shapes: empty (ε); one symbol that is a terminal; or two symbols, a terminal and then a nonterminal.
- \`if (!ok) return false;\` stops at the first body that fails.
- \`return true;\` is reached only when every body passed.

The bracket grammar \`p → "(" p ")" | ε\` fails because its first body has three symbols, with the nonterminal in the middle: that middle position is what lets it count brackets, and it is exactly what a regular grammar may not do. \`xs → xs "x"\` fails too, though it describes a regular language (rows of x): this check is about the *shape* of the rules, and a different, left-linear grammar can describe a regular language as well.

**Common wrong attempts.**

- Checking only that each body has at most one nonterminal lets \`p → "(" p ")"\` through, which is context-free but not regular.
- Returning \`true\` as soon as one body is fine answers "is some rule right-linear?", not "are all of them?".`,
    wrong: [
      {
        code: `function isRightLinear(rules) {
  for (const head in rules) {
    for (const b of rules[head]) {
      const n = b.filter(
        (s) => s in rules).length;
      if (n > 1) return false;
    }
  }
  return true;
}`,
        why: 'Counting nonterminals is not enough: `( p )` has only one, but in the middle, which makes it context-free, not regular.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these shows that a grammar is ambiguous?',
    options: [
      { t: 'A sentence with a leftmost and a rightmost derivation', why: 'Every sentence of a grammar has both, and the two can still draw one and the same tree.' },
      { t: 'A sentence that is very long', why: 'Length has nothing to do with it.' },
      { t: 'A sentence with two different parse trees', correct: true, why: 'That is the definition: two trees, so two possible meanings.' },
      { t: 'A rule that mentions itself', why: 'Recursive rules are normal; the layered grammar is recursive and unambiguous.' },
    ],
  },
  {
    q: 'Under `term → term "+" factor | factor`, `factor → factor "*" primary | primary`, `primary → NUMBER`, what is at the root of the tree for `1 + 2 * 3`?',
    options: [
      { t: 'The `+`', correct: true, why: '`*` can only join `primary`s inside a `factor`, so `2 * 3` is one `factor`, and the `+` joins `1` to it.' },
      { t: 'The `*`', why: 'That would need `1 + 2` to be a `primary`, and a `primary` here is only a number.' },
      { t: 'Either, since the grammar is ambiguous', why: 'This layered grammar has exactly one tree for every sentence.' },
    ],
  },
  {
    q: 'JavaScript’s specification resolves `if (a) if (b) s1; else s2;` how?',
    options: [
      { t: 'It is a syntax error', why: 'It is allowed; the specification says which `if` gets the `else`.' },
      { t: 'The `else` belongs to the outer `if`', why: 'That is the other reading, which JavaScript does not choose.' },
      { t: 'The engine chooses at run time', why: 'The grouping is fixed when the program is parsed.' },
      { t: 'The `else` belongs to the nearest (inner) `if`', correct: true, why: 'Its grammar has a note saying exactly this.' },
    ],
  },
  {
    q: 'Why does Drip have no dangling else?',
    options: [
      { t: 'Its parser tries both trees', why: 'A parser that tried both would still have to choose one.' },
      { t: 'Braces are required, so an inner `if` and its `else` are always inside `{ }`', correct: true, why: 'The braces show which `if` an `else` belongs to; there is only one tree.' },
      { t: 'Drip has no `else`', why: 'It does: `if c { ... } else { ... }`.' },
    ],
  },
  {
    q: 'Which machine recognises exactly the context-free languages?',
    options: [
      { t: 'A finite automaton', why: 'That recognises the regular languages, the level below.' },
      { t: 'A Turing machine', why: 'That reaches the top level, type 0.' },
      { t: 'A pushdown automaton: a finite automaton with a stack', correct: true, why: 'The stack is what remembers how many brackets are open.' },
      { t: 'A linear-bounded automaton', why: 'That recognises the context-sensitive languages, type 1.' },
    ],
  },
];
