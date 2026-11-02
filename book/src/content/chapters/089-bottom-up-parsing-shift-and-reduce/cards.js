// Chapter 89 cards. Keys are stable ids: never rename them.
//
// Grammars are data: { head: [body, ...] }. An action is 's' (shift)
// or [head, k] (reduce by body number k of head).

export const prompts = {
  'bottom-up-what': {
    q: 'What does a **bottom-up** parser build first, and what last?',
    a: 'The leaves (the tokens) first, then the nodes above them; the root, the start symbol, last.',
  },
  'shift-what': {
    q: 'What does a **shift** do?',
    a: 'Moves the next input token onto the top of the stack.',
  },
  'reduce-what': {
    q: 'What does a **reduce** by `A → β` do?',
    a: 'Pops the symbols of β off the top of the stack and pushes `A` in their place, making a new tree node with them as children.',
  },
  accept: {
    q: 'When does a shift-reduce parser accept?',
    a: 'When the input is used up and the stack holds only the start symbol.',
  },
  'reverse-rightmost': {
    q: 'Read backwards, the reductions of a shift-reduce parse form what?',
    a: 'A rightmost derivation of the input.',
  },
  'left-rec-fine': {
    q: 'Why is `E → E "-" T` no problem for a shift-reduce parser?',
    a: 'It never has to choose the rule in advance: it reduces only once `E - T` is already on the stack.',
  },
  'top-only': {
    q: 'Where on the stack can a reduction happen?',
    a: 'Only at the top: the body being reduced is always the last few symbols pushed.',
  },
  'naive-fails': {
    q: 'Why is “reduce whenever the top of the stack matches some body” not a safe rule?',
    a: 'It can reduce too early: with `E - T` on the stack, reducing `T` to `E` by `E → T` leaves `E - E`, which no rule can reduce.',
  },
};

export const examples = {
  traceSR: {
    title: 'A shift-reduce parse, following orders',
    code: `const rules = {
  E: [['E', '-', 'T'], ['T']],
  T: [['n']],
};

// 's' = shift; [head, k] = reduce by
// body number k of head
function run(tokens, actions) {
  const stack = [];
  const input = [...tokens, '$'];
  for (const a of actions) {
    let what = 'shift';
    if (a === 's') {
      stack.push(input.shift());
    } else {
      const [head, k] = a;
      const body = rules[head][k];
      stack.length -= body.length;
      stack.push(head);
      what = head + ' → ' +
        body.join(' ');
    }
    console.log(
      stack.join(' ').padEnd(8),
      '|', input.join(' ').padEnd(12),
      '|', what);
  }
}

run(['n', '-', 'n', '-', 'n'], [
  's', ['T', 0], ['E', 1],
  's', 's', ['T', 0], ['E', 0],
  's', 's', ['T', 0], ['E', 0],
]);`,
  },
};

const G = `const g = {
  E: [['E', '-', 'T'], ['T']],
  T: [['n']],
};
const A3 = ['s', ['T', 0], ['E', 1],
  's', 's', ['T', 0], ['E', 0],
  's', 's', ['T', 0], ['E', 0]];
const N3 = ['n', '-', 'n', '-', 'n'];`;

export const exercises = {
  shiftReduce: {
    title: 'Build the tree, shift by reduce',
    prompt:
      'Write `shiftReduce(rules, tokens, actions)`. Keep a stack of **trees**: a token is a tree on its own (its string), and a node is an array `[head, ...children]`, as in the chapter on derivations. For `\'s\'`, move the next token onto the stack (throw if there is none). For `[head, k]`, the top symbols of the stack must be exactly the body `rules[head][k]` (a tree’s symbol is the string itself, or its first item); pop them and push `[head, ...thoseTrees]`, or throw if they do not match. At the end, throw unless the input is used up and the stack holds one tree; return that tree.',
    starter: `function shiftReduce(
  rules, tokens, actions) {
  const input = [...tokens];
  const stack = [];
  // your code here
  return stack[0];
}

const g = {
  E: [['E', '-', 'T'], ['T']],
  T: [['n']],
};
console.log(JSON.stringify(
  shiftReduce(g, ['n'],
    ['s', ['T', 0], ['E', 1]])));`,
    solution: `function shiftReduce(
  rules, tokens, actions) {
  const input = [...tokens];
  const stack = [];
  const sym = (t) =>
    typeof t === 'string' ? t : t[0];
  for (const a of actions) {
    if (a === 's') {
      if (input.length === 0) {
        throw new Error('no token');
      }
      stack.push(input.shift());
      continue;
    }
    const [head, k] = a;
    const body = rules[head][k];
    const m = body.length;
    const from = stack.length - m;
    const kids = from < 0
      ? [] : stack.slice(from);
    const ok = from >= 0 && kids.every(
      (t, i) => sym(t) === body[i]);
    if (!ok) {
      throw new Error('no ' + head);
    }
    stack.length = from;
    stack.push([head, ...kids]);
  }
  const done = input.length === 0
    && stack.length === 1;
  if (!done) {
    throw new Error('not finished');
  }
  return stack[0];
}`,
    tests: `${G}
test('one number', () => {
  expect(shiftReduce(g, ['n'], ['s', ['T', 0], ['E', 1]]))
    .toEqual(['E', ['T', 'n']]);
});
test('1 - 2 - 3 leans left', () => {
  expect(shiftReduce(g, N3, A3)).toEqual(
    ['E',
      ['E', ['E', ['T', 'n']], '-', ['T', 'n']],
      '-', ['T', 'n']]);
});
test('a reduction that does not match throws', () => {
  expect(() => shiftReduce(g, ['n'], ['s', ['E', 1]]))
    .toThrow();
});
test('reducing E → E - T with too little on the stack', () => {
  expect(() => shiftReduce(g, ['n'],
    ['s', ['T', 0], ['E', 0]])).toThrow();
});
test('shifting past the end throws', () => {
  expect(() => shiftReduce(g, ['n'], ['s', 's'])).toThrow();
});
test('an unfinished parse throws', () => {
  expect(() => shiftReduce(g, N3, A3.slice(0, -1))).toThrow();
});`,
    hints: [
      'Shifting is `stack.push(input.shift())`. Reducing is the interesting part: how many items come off the stack?',
      'For a body of length `m`, the candidates are the last `m` items: `stack.slice(stack.length - m)`. Compare each one’s symbol with the body, position by position; a node’s symbol is `t[0]`, a token’s is `t` itself.',
      'If they match, set `stack.length` to `stack.length - m` (which drops them) and push `[head, ...kids]`. Watch out for a stack shorter than the body: then the reduction is wrong too.',
    ],
    walkthrough: `**How to think about it.** The runnable example already does the shifting and the reducing; it only trusts its orders blindly and keeps symbols, not trees. Two changes make it a real parser's core. First, keep trees on the stack: a shifted token is a leaf, and a reduction gathers the trees it pops into one new node, so by the end the stack holds the whole parse tree. Second, check every reduction: a rule may only be used if its body is exactly what is on top of the stack, which is the definition of a reduce.

**The solution, line by line.**

- \`const input = [...tokens]; const stack = [];\` copy the tokens (so the caller's array is not changed by \`shift\`) and start with an empty stack.
- \`const sym = (t) => typeof t === 'string' ? t : t[0];\` gives a tree's grammar symbol: a leaf is its own symbol, and a node \`['E', ...]\` is an \`E\`.
- \`for (const a of actions) {\` follows the orders.
- \`if (a === 's') { ... stack.push(input.shift()); continue; }\` shifts: \`shift()\` removes and returns the first token, and \`push\` puts it on top of the stack. Shifting with no tokens left is a mistake, so it throws.
- \`const [head, k] = a; const body = rules[head][k];\` unpacks a reduce order and finds the body.
- \`const m = body.length; const from = stack.length - m;\`: \`from\` is where the body would have to start on the stack; if it is negative, the stack is too short.
- \`const kids = from < 0 ? [] : stack.slice(from);\` takes the top \`body.length\` trees.
- \`const ok = from >= 0 && kids.every((t, i) => sym(t) === body[i]);\` checks that the stack is long enough and that each tree's symbol is the body's symbol at the same position.
- \`if (!ok) throw ...\` rejects a reduction that does not match.
- \`stack.length = from;\` cuts the body off the stack (setting an array's length shorter drops its last items), and \`stack.push([head, ...kids]);\` pushes the new node, with the popped trees, in order, as its children.
- The final check, \`done\`, throws unless every token was used and exactly one tree is left; then \`return stack[0];\`.

For \`n - n - n\`, the first three orders build \`['E', ['T', 'n']]\`; the next four push \`-\` and a second \`['T', 'n']\` and reduce all three into an \`E\`, which already holds the first subtraction; the last four do the same again around it. The left-recursive rule simply wraps what is already on the stack, which is why the tree leans left without any rewriting.

**Common wrong attempts.**

- Comparing \`kids[i] === body[i]\` directly fails as soon as a child is a node: \`['T', 'n']\` is an array, not the string \`'T'\`. Use the symbol of each tree.
- Checking only the *last* symbol (does the top match the end of the body?) accepts \`['E', 0]\` with just \`T\` on the stack, building a broken node.
- Forgetting the final check returns a half-built tree for an unfinished parse.`,
    wrong: [
      {
        code: `function shiftReduce(
  rules, tokens, actions) {
  const input = [...tokens];
  const stack = [];
  for (const a of actions) {
    if (a === 's') {
      stack.push(input.shift());
      continue;
    }
    const [head, k] = a;
    const m = rules[head][k].length;
    const kids = stack.splice(-m, m);
    stack.push([head, ...kids]);
  }
  return stack[0];
}`,
        why: 'It never checks that the popped trees match the body, so wrong orders build wrong trees instead of failing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `E → E "-" T | T` and `T → NUMBER`, the stack is `E - 2` and the next token is `-`. What should happen next?',
    options: [
      { t: 'Shift the `-`', why: 'Then `E - 2 -` could never be finished: the 2 must become a `T` first.' },
      { t: 'Reduce the 2 by `T → NUMBER`', correct: true, why: 'Its body is on top, and the `T` is needed for `E - T`.' },
      { t: 'Reduce `E - 2` by `E → E - T`', why: 'The body is `E - T`; the 2 is still a NUMBER, not a `T`.' },
      { t: 'Accept', why: 'Tokens are left, so the parse is not finished.' },
    ],
  },
  {
    q: 'In what order does a shift-reduce parser create the nodes of the tree?',
    options: [
      { t: 'Root first, then left to right downwards', why: 'That is the top-down order.' },
      { t: 'All the leaves first, then the inner nodes', why: 'Inner nodes are built as soon as their body is complete, between shifts.' },
      { t: 'Each node after all of its children, with the root last', correct: true, why: 'A reduction needs its whole body on the stack, so children always come first.' },
    ],
  },
  {
    q: 'The reductions of a parse were `T → n`, `E → T`, `T → n`, `E → E - T`. Read backwards, what is the first step of the derivation they form?',
    options: [
      { t: '`E ⇒ T`', why: '`E → T` was used, but early in the parse; the first derivation step comes from the *last* reduction.' },
      { t: '`E ⇒ E - T`', correct: true, why: 'The last reduction made is the first derivation step, and the steps that follow rewrite the rightmost nonterminal each time.' },
      { t: '`n ⇒ T`', why: 'Derivation steps go from a nonterminal to a body, not the other way.' },
      { t: '`T ⇒ n`', why: 'That is the first reduction, so it is the *last* derivation step.' },
    ],
  },
  {
    q: 'Why can a bottom-up parser use `E → E "-" T` as it is, while a top-down one must rewrite it?',
    options: [
      { t: 'Bottom-up parsers have more lookahead', why: 'Lookahead is not the issue; the order of decisions is.' },
      { t: 'Bottom-up parsers ignore left recursion', why: 'They use the rule exactly as written.' },
      { t: 'It decides on the rule after seeing all of its body, so it never has to predict `E` before reading anything', correct: true, why: 'The top-down parser must pick `E → E - T` first and then parse an `E`, forever.' },
      { t: 'Left recursion is only a problem for JavaScript', why: 'It is a problem for every top-down parser, in any language.' },
    ],
  },
  {
    q: 'A naive parser reduces whenever the top of the stack matches any rule body. With the stack `E - T`, what goes wrong?',
    options: [
      { t: 'It might reduce `T` alone by `E → T`, leaving `E - E`, which no rule can reduce', correct: true, why: 'Matching a body is not enough; the parser must reduce the right body at the right time.' },
      { t: 'Nothing: `E → E - T` is the only rule that matches', why: '`E → T` matches the top symbol too.' },
      { t: 'It would shift too early', why: 'The danger here is reducing at the wrong place, not shifting.' },
    ],
  },
];
