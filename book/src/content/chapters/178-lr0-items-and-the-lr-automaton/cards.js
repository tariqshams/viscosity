// Chapter 295 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'item-what': {
    q: 'What does the dot in the LR(0) item `E → E · + T` say?',
    a: 'The symbols before it (`E`) are on top of the stack; the symbols after it (`+ T`) are what the parser hopes to see next.',
  },
  'item-count': {
    q: 'How many LR(0) items does the rule `E → E + T` give?',
    a: 'Four: one for each place the dot can stand (before E, before +, before T, and at the end).',
  },
  'item-complete': {
    q: 'What does a **complete** item, like `T → n ·`, tell the parser?',
    a: 'The whole body (`n`) is on top of the stack, so it may be a handle: reducing it to `T` is a candidate move.',
  },
  'closure-why': {
    q: 'Why does the closure of `{ E → E + · T }` contain `T → · n`?',
    a: 'Waiting for a T means being at the very start of every T rule, and T → n is one of them; tokens arrive, never a T itself.',
  },
  'closure-stops': {
    q: 'The rule `E → E + T` starts with itself. Why does closure still stop?',
    a: 'Closure only adds items that are not already in the set; `E → · E + T` is added once, and adding it again changes nothing.',
  },
  'goto-what': {
    q: 'In words, what is `goto(I, X)`?',
    a: 'Take the items of I with X right after the dot, move the dot over X, then take the closure: where the parser is after X joins the stack.',
  },
  'dfa-reads-stack': {
    q: 'The LR(0) automaton is a DFA. What does it read: the input tokens or the stack?',
    a: 'The stack, from bottom to top, terminals and nonterminals alike; the state it ends in summarises what the stack holds.',
  },
  'goto-existing': {
    q: 'Building an LR(0) automaton, goto from some state gives an item set that is already a state. What do you do, and why?',
    a: 'Draw the arrow to the existing state: a state is its item set, so the same set is the same state, and adding it again would make the construction loop for ever.',
  },
};

export const examples = {
  'walk-stack': {
    title: 'Walking a stack through the automaton',
    code: `const go = {
  0: { E: 1, T: 2, n: 3, '(': 4 },
  1: { '+': 5 },
  4: { E: 6, T: 2, n: 3, '(': 4 },
  5: { T: 7, n: 3, '(': 4 },
  6: { ')': 8, '+': 5 },
};
const done = {
  1: 'S → E ·', 2: 'E → T ·',
  3: 'T → n ·', 7: 'E → E + T ·',
  8: 'T → ( E ) ·',
};
function walk(stack) {
  let q = 0;
  for (const x of stack) {
    q = go[q]?.[x];
    if (q === undefined) {
      return 'no arrow';
    }
  }
  return \`\${q}: \${done[q] ?? 'shift'}\`;
}
console.log(walk(['E', '+', 'T']));
console.log(walk(['E', '+']));
console.log(walk(['(', 'E']));
console.log(walk(['+']));`,
  },
};

export const exercises = {
  'closure-goto': {
    title: 'closure and goto, for real',
    prompt: 'The grammar `G` is given as data: rule `r` is `G[r]`, a pair of a head and a body (an array of symbols). An item is a pair `[r, d]`: rule `r` with the dot before body position `d`, so `[1, 2]` is `E → E + · T`. Write `closure(items)`, which returns the items plus every item closure adds, and `goto(items, x)`, which moves the dot over `x` in every item that has `x` after its dot and returns the closure of the result (an empty array if none does). The order of the items in your answers does not matter.',
    starter: `// rule = [head, body]
const G = [
  ['S', ['E']],
  ['E', ['E', '+', 'T']],
  ['E', ['T']],
  ['T', ['n']],
  ['T', ['(', 'E', ')']],
];
// item: [rule number, dot position]
// the symbol after an item's dot:
const next = ([r, d]) => G[r][1][d];

function closure(items) {
  return items;
}

function goto(items, x) {
  return [];
}`,
    solution: `// rule = [head, body]
const G = [
  ['S', ['E']],
  ['E', ['E', '+', 'T']],
  ['E', ['T']],
  ['T', ['n']],
  ['T', ['(', 'E', ')']],
];
// item: [rule number, dot position]
// the symbol after an item's dot:
const next = ([r, d]) => G[r][1][d];

function closure(items) {
  const out = [...items];
  for (let i = 0; i < out.length; i++) {
    const x = next(out[i]);
    G.forEach(([head], j) => {
      const there = out.some(
        ([r, d]) => r === j && d === 0);
      if (head === x && !there) {
        out.push([j, 0]);
      }
    });
  }
  return out;
}

function goto(items, x) {
  const moved = items
    .filter((it) => next(it) === x)
    .map(([r, d]) => [r, d + 1]);
  return closure(moved);
}`,
    tests: `const key = (I) =>
  I.map(([r, d]) => r + '.' + d).sort();
const I0 = closure([[0, 0]]);
test('closure of S → · E is state 0', () => {
  expect(key(I0)).toEqual(['0.0', '1.0', '2.0', '3.0', '4.0']);
});
test('closure adds T rules after E + ·', () => {
  expect(key(closure([[1, 2]]))).toEqual(['1.2', '3.0', '4.0']);
});
test('closure of a complete item adds nothing', () => {
  expect(key(closure([[3, 1]]))).toEqual(['3.1']);
});
test('goto(I0, E) is state 1', () => {
  expect(key(goto(I0, 'E'))).toEqual(['0.1', '1.1']);
});
test('goto(I0, "(") is state 4', () => {
  expect(key(goto(I0, '('))).toEqual(['1.0', '2.0', '3.0', '4.0', '4.1']);
});
test('goto(state 1, +) is state 5', () => {
  expect(key(goto(goto(I0, 'E'), '+'))).toEqual(['1.2', '3.0', '4.0']);
});
test('goto on a symbol nobody waits for is empty', () => {
  expect(goto(I0, '+')).toEqual([]);
  expect(goto(I0, ')')).toEqual([]);
});`,
    hints: [
      'Start with `goto`, the easier one: it is a `filter` (which items have `x` right after the dot?) and a `map` (move the dot one place), followed by a call to `closure`.',
      'The symbol after the dot of item `[r, d]` is `next([r, d])`, which is `G[r][1][d]`; at the end of the body that is `undefined`, which matches no head, so complete items need no special case.',
      'For `closure`, copy the items into a new array `out` and walk it with an index `i` that runs while `i < out.length`, so items you push are visited too. For each, look at every rule `j` whose head is the symbol after the dot, and push `[j, 0]` unless `out` already has it (that check is what stops `E → · E + T` being added forever).',
    ],
    walkthrough: `**How to think about it.** Both operations are in the chapter as sentences; the work is turning each sentence into a loop over the data. An item \`[r, d]\` is a rule number and a dot position, so "the symbol after the dot" is element \`d\` of rule \`r\`'s body, \`G[r][1][d]\` (the helper \`next\` given with the grammar does exactly that). Do \`goto\` first: it is only "pick, move, close". \`closure\` is the one that needs care, because its new items can produce further new items (the dot before \`E\` brings in \`E → · T\`, whose dot before \`T\` brings in the \`T\` rules), and because a left-recursive rule would bring itself in forever if you did not check for repeats.

**The solution, line by line.**

- \`function closure(items) {\` takes an array of \`[r, d]\` pairs.
- \`  const out = [...items];\` copies them, so we never change the caller's array; \`out\` will grow.
- \`  for (let i = 0; i < out.length; i++) {\` walks \`out\` by index. Because the condition reads \`out.length\` again on every round, items pushed during the loop are visited later: this one line is what makes closure repeat "until nothing new is added".
- \`    const x = next(out[i]);\` uses the helper given with the grammar, \`next([r, d])\`, which is \`G[r][1][d]\`: the symbol right after the item's dot. It is \`'E'\` for \`[0, 0]\`, \`'+'\` for \`[1, 1]\`, and \`undefined\` for a complete item.
- \`    G.forEach(([head], j) => {\` looks at every rule \`j\`, keeping only its head.
- \`      const there = out.some(\` / \`        ([r, d]) => r === j && d === 0);\` asks whether the item "rule \`j\` with the dot at the front" is already in \`out\`.
- \`      if (head === x && !there) {\` is true when rule \`j\` is a rule for the nonterminal we are waiting for and its start item is new. A terminal such as \`'+'\` is never a head, and nor is \`undefined\`, so they add nothing, exactly as the definition says.
- \`        out.push([j, 0]);\` adds \`B → · γ\`; the outer loop will reach it later and close it in turn.
- \`  return out;\` returns the finished set.
- \`function goto(items, x) {\` takes a set and a symbol.
- \`  const moved = items\` / \`    .filter((it) => next(it) === x)\` keeps only the items whose dot stands right before \`x\`.
- \`    .map(([r, d]) => [r, d + 1]);\` moves each dot one place to the right, making brand new pairs.
- \`  return closure(moved);\` closes them. If nothing had \`x\` after its dot, \`moved\` is \`[]\` and the closure of nothing is \`[]\`, which is how "no arrow" (a syntax error) shows up.

For \`goto(I0, '(')\`, only \`[4, 0]\` (\`T → · ( E )\`) passes the filter, it becomes \`[4, 1]\`, and closure sees \`E\` after its dot, adds \`[1, 0]\` and \`[2, 0]\`, then reaches \`[2, 0]\`, sees \`T\`, and adds \`[3, 0]\` and \`[4, 0]\`: five items, state 4.

**Common wrong attempts.**

- Looping over \`items\` instead of \`out\` (or using the length from before the loop) adds one layer only: from \`S → · E\` you get the \`E\` rules but never the \`T\` rules they lead to.
- Forgetting the closure in \`goto\` returns only the kernel, so \`goto(I0, '(')\` is the single item \`T → ( · E )\`, and the parser would not know that a number may come next.
- Dropping the "already there" check makes \`E → · E + T\` add itself again and again, so the loop never ends.`,
    wrong: [
      {
        code: `// rule = [head, body]
const G = [
  ['S', ['E']],
  ['E', ['E', '+', 'T']],
  ['E', ['T']],
  ['T', ['n']],
  ['T', ['(', 'E', ')']],
];
// item: [rule number, dot position]
// the symbol after an item's dot:
const next = ([r, d]) => G[r][1][d];

function closure(items) {
  const out = [...items];
  for (const it of items) {
    const x = next(it);
    G.forEach(([head], j) => {
      if (head === x) out.push([j, 0]);
    });
  }
  return out;
}

function goto(items, x) {
  const moved = items
    .filter((it) => next(it) === x)
    .map(([r, d]) => [r, d + 1]);
  return closure(moved);
}`,
        why: 'This visits only the original items, so it adds one layer: the closure of `S → · E` gets the E rules but not the T rules they lead to.',
      },
      {
        code: `// rule = [head, body]
const G = [
  ['S', ['E']],
  ['E', ['E', '+', 'T']],
  ['E', ['T']],
  ['T', ['n']],
  ['T', ['(', 'E', ')']],
];
// item: [rule number, dot position]
// the symbol after an item's dot:
const next = ([r, d]) => G[r][1][d];

function closure(items) {
  const out = [...items];
  for (let i = 0; i < out.length; i++) {
    const x = next(out[i]);
    G.forEach(([head], j) => {
      const there = out.some(
        ([r, d]) => r === j && d === 0);
      if (head === x && !there) {
        out.push([j, 0]);
      }
    });
  }
  return out;
}

function goto(items, x) {
  return items
    .filter((it) => next(it) === x)
    .map(([r, d]) => [r, d + 1]);
}`,
        why: '`closure` is right, but `goto` forgets to close its result, so `goto(I0, "(")` is only `T → ( · E )` and misses the four items that say what may come next.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which item says "the parser has seen `( E` and now hopes for `)`"?',
    options: [
      {
        t: '`T → · ( E )`',
        why: 'Here nothing has been seen yet; the dot is before the bracket.',
      },
      {
        t: '`T → ( E · )`',
        correct: true,
        why: 'Before the dot: `( E`, which is on the stack. After it: `)`, which is what comes next.',
      },
      {
        t: '`T → ( E ) ·`',
        why: 'This one has seen the closing bracket too; it is complete, ready to reduce.',
      },
    ],
  },
  {
    q: 'In the grammar `E → E + T | T`, `T → n | ( E )`, what is `closure({ T → ( · E ) })`?',
    options: [
      {
        t: 'Just `T → ( · E )`',
        why: 'The dot is before E, a nonterminal, so closure must add the E rules.',
      },
      {
        t: '`T → ( · E )`, `E → · E + T`, `E → · T`',
        why: 'Closure keeps going: `E → · T` has its dot before T, so the T rules join too.',
      },
      {
        t: '`T → ( · E )`, `E → · E + T`, `E → · T`, `T → · n`, `T → · ( E )`',
        correct: true,
        why: 'The E rules come in for the dot before E, then the T rules for the dot before T. This is state 4.',
      },
    ],
  },
  {
    q: 'In the grammar `S → E`, `E → E + T | T`, `T → n | ( E )`, let I be the closure of `{ S → · E }`. What is `goto(I, +)`?',
    options: [
      {
        t: 'The empty set',
        correct: true,
        why: 'No item in state 0 has `+` right after its dot, so there is no arrow: a program cannot start with `+`.',
      },
      {
        t: '`{ E → E + · T }`',
        why: 'That needs `E → E · + T` in the set, which is in state 1, after an E has been seen.',
      },
      {
        t: 'State 0 again',
        why: 'goto never stays put by default; with nothing to move, the result is empty.',
      },
    ],
  },
  {
    q: 'What does the LR(0) automaton read?',
    options: [
      {
        t: 'The characters of the source code',
        why: 'That is the scanner’s DFA. This one works on grammar symbols.',
      },
      {
        t: 'Only the input tokens, left to right',
        why: 'Its arrows are labelled with nonterminals too, which never appear in the input; they appear on the stack after a reduction.',
      },
      {
        t: 'The symbols on the parser’s stack, bottom to top',
        correct: true,
        why: 'Running it over the stack ends in a state whose items fit what is there, including any complete item that marks a handle.',
      },
    ],
  },
  {
    q: 'Running the LR(0) automaton over the stack `E + T` ends in a state whose only item is `E → E + T ·`. What should the parser do?',
    options: [
      {
        t: 'Shift the next token',
        why: 'There is a complete item, and nothing in state 7 waits for a token.',
      },
      {
        t: 'Reduce `E + T` to `E`',
        correct: true,
        why: 'The complete item says the top three symbols are the body of `E → E + T`: a handle.',
      },
      {
        t: 'Report a syntax error',
        why: 'An error is when there is no arrow at all; here every step had one.',
      },
    ],
  },
];
