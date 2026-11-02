// Chapter 79 cards. Keys are stable ids: never rename them.

export const prompts = {
  'derivation-what': {
    q: 'What is a **derivation**?',
    a: 'A list of steps from the start symbol to a sentence, where each step replaces one nonterminal by the body of one of its rules.',
  },
  'sentential-form': {
    q: 'What is a **sentential form**?',
    a: 'Any row of symbols you can reach from the start symbol; it may still contain nonterminals. A sentence is one that contains none.',
  },
  'one-step': {
    q: 'Why is `expr ⇒ NUMBER` not a single derivation step in the adding grammar?',
    a: 'There is no rule `expr → NUMBER`. It takes two steps: `expr ⇒ item` and then `item ⇒ NUMBER`.',
  },
  'leftmost-what': {
    q: 'In a **leftmost** derivation, which nonterminal is rewritten at each step?',
    a: 'The one furthest to the left in the current sentential form.',
  },
  'parse-tree-what': {
    q: 'In a **parse tree**, what are the root, the inner nodes and the leaves?',
    a: 'The root is the start symbol; each inner node is a nonterminal whose children are the body of the rule used on it; the leaves are terminals (or ε).',
  },
  'tree-yield': {
    q: 'What do you get if you read a parse tree’s leaves from left to right?',
    a: 'The sentence it derives (its **yield**).',
  },
  'tree-forgets': {
    q: 'What does a parse tree forget about the derivation that drew it?',
    a: 'The order of the steps. It keeps which rule was used on which nonterminal, and nothing else.',
  },
  'epsilon-leaf': {
    q: 'How does a parse tree show a rule with an empty body, such as `elsePart → ε`?',
    a: 'The `elsePart` node gets a single leaf, `ε`, which adds nothing to the sentence.',
  },
};

export const examples = {
  rightmost: {
    title: 'A rightmost derivation, printed',
    code: `const rules = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};

// picks[k] says which body to use
// at step k (0 = the first one)
function rightmost(start, picks) {
  let form = [start];
  console.log(form.join(' '));
  for (const k of picks) {
    let i = form.length - 1;
    while (!(form[i] in rules)) i--;
    const body = rules[form[i]][k];
    const rule = form[i] + ' → ' +
      body.join(' ');
    form = [...form.slice(0, i),
            ...body,
            ...form.slice(i + 1)];
    console.log('⇒ ' + form.join(' ')
      + '   (' + rule + ')');
  }
}

rightmost('stmt', [0, 1, 0, 0, 0]);

// Try: picks [0, 1, 1, 0, 0, 0, 0]
// derives print 1 + 2 + 3;`,
  },
};

const G = `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const lst = { list: [['x', 'list'], []] };`;

export const exercises = {
  leftmost: {
    title: 'Run a leftmost derivation',
    prompt:
      'A grammar is stored as data, as in the chapter on grammars: an object whose keys are the nonterminals, each holding a list of bodies (an empty array `[]` is the body ε). Write `leftmost(rules, start, picks)`. Start from the form `[start]`; for each number `k` in `picks`, replace the **leftmost** nonterminal with its body number `k`. Return every form along the way, each joined into a string with spaces, starting with the start symbol. If a pick comes when no nonterminal is left, throw an error.',
    starter: `function leftmost(rules, start, picks) {
  const out = [start];
  // your code here
  return out;
}

const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
console.log(
  leftmost(g, 'stmt', [0, 1, 0, 0, 0]));`,
    solution: `function leftmost(rules, start, picks) {
  let form = [start];
  const out = [form.join(' ')];
  for (const k of picks) {
    const i = form.findIndex(
      (s) => s in rules);
    if (i === -1) {
      throw new Error('no nonterminal');
    }
    const body = rules[form[i]][k];
    form = [...form.slice(0, i),
            ...body,
            ...form.slice(i + 1)];
    out.push(form.join(' '));
  }
  return out;
}`,
    tests: `${G}
test('print 1 + 2;', () => {
  expect(leftmost(g, 'stmt', [0, 1, 0, 0, 0])).toEqual([
    'stmt',
    'print expr ;',
    'print expr + item ;',
    'print item + item ;',
    'print NUMBER + item ;',
    'print NUMBER + NUMBER ;',
  ]);
});
test('brackets: print (1);', () => {
  expect(leftmost(g, 'stmt', [0, 0, 1, 0, 0]).at(-1))
    .toBe('print ( NUMBER ) ;');
});
test('an empty body', () => {
  expect(leftmost(lst, 'list', [0, 0, 1]))
    .toEqual(['list', 'x list', 'x x list', 'x x']);
});
test('no picks', () => {
  expect(leftmost(g, 'expr', [])).toEqual(['expr']);
});
test('too many picks throws', () => {
  expect(() => leftmost(lst, 'list', [1, 0])).toThrow();
});`,
    hints: [
      'Keep the current form as an **array** of symbols, and only join it into a string when you store it in the output.',
      'A symbol is a nonterminal exactly when it is a key of `rules`; `s in rules` asks that. `form.findIndex(test)` gives the position of the first symbol that passes a test, or `-1`.',
      'The new form is three pieces glued together: everything before position `i`, then the body `rules[form[i]][k]`, then everything after `i`. Spread each piece with `...` into a new array.',
    ],
    walkthrough: `**How to think about it.** Do one step by hand first. The form is \`['print', 'expr', ';']\` and the pick is \`1\`. Which symbol is the leftmost nonterminal? Scan from the left: \`print\` is not a key of \`rules\`, so it is a terminal; \`expr\` is, so that is the one, at position 1. Body number 1 of \`expr\` is \`['expr', '+', 'item']\`. The new form is what came before position 1 (\`print\`), then that body, then what came after (\`;\`): \`['print', 'expr', '+', 'item', ';']\`. A derivation is that step repeated once per pick, so the whole solution is a loop around it, plus a list of results.

Keep the form as an array rather than a string: you need to look at symbols one at a time and replace one of them, which is easy with an array and fiddly with a string (\`NUMBER\` is one symbol, not six letters). Join it into a string only for the output.

**The solution, line by line.**

- \`function leftmost(rules, start, picks) {\` takes the grammar, the start symbol and the list of choices.
- \`  let form = [start];\` is the first sentential form: the start symbol on its own. It is \`let\` because each step makes a new array.
- \`  const out = [form.join(' ')];\` starts the answer with that first form as a string, \`'stmt'\`.
- \`  for (const k of picks) {\` does one derivation step per pick; \`k\` is the number of the body to use.
- \`    const i = form.findIndex((s) => s in rules);\` finds the leftmost nonterminal. \`findIndex\` calls the little arrow function on each symbol from the left and returns the position of the first one for which it is true; \`s in rules\` is true when \`s\` is a key of the grammar object, that is, a nonterminal.
- \`    if (i === -1) { throw new Error('no nonterminal'); }\`: \`findIndex\` returns \`-1\` when nothing passes, which means the form is already a sentence, so a further pick is a mistake.
- \`    const body = rules[form[i]][k];\` looks up the nonterminal's list of bodies and takes number \`k\`.
- \`    form = [...form.slice(0, i), ...body, ...form.slice(i + 1)];\` builds the next form: \`slice(0, i)\` is everything before position \`i\`, \`slice(i + 1)\` everything after it, and spreading the three pieces into one new array leaves the body where the nonterminal was. An empty body \`[]\` spreads to nothing, so the nonterminal simply disappears, which is exactly what ε means.
- \`    out.push(form.join(' '));\` records the new form as a string.
- \`  return out;\` hands back the whole derivation.

For the first test the forms are \`stmt\`, \`print expr ;\`, \`print expr + item ;\`, \`print item + item ;\` (the leftmost of \`expr\` and \`item\` was \`expr\`), \`print NUMBER + item ;\` and \`print NUMBER + NUMBER ;\`: the same five rules as the step-through diagram.

**Common wrong attempts.**

- Searching from the right (\`findLastIndex\`, or a loop that counts down) gives a *rightmost* derivation: a perfectly good derivation, but not the one asked for; in the first test, step 3 becomes \`print expr + NUMBER ;\`.
- \`form.splice(i, 1, body)\` without spreading puts the whole body array inside the form as one item, so the joined string comes out as \`print expr,+,item ;\`.
- Forgetting the \`-1\` check lets a pick through when the form is finished: \`form[-1]\` is \`undefined\`, and the code fails later with a confusing message, or not at all.`,
    wrong: [
      {
        code: `function leftmost(rules, start, picks) {
  let form = [start];
  const out = [form.join(' ')];
  for (const k of picks) {
    let i = form.length - 1;
    while (i >= 0 &&
           !(form[i] in rules)) i--;
    if (i < 0) throw new Error('done');
    const body = rules[form[i]][k];
    form = [...form.slice(0, i),
            ...body,
            ...form.slice(i + 1)];
    out.push(form.join(' '));
  }
  return out;
}`,
        why: 'This searches from the right, so it builds a rightmost derivation: step 3 rewrites `item` before `expr`.',
      },
      {
        code: `function leftmost(rules, start, picks) {
  const form = [start];
  const out = [form.join(' ')];
  for (const k of picks) {
    const i = form.findIndex(
      (s) => s in rules);
    if (i < 0) throw new Error('done');
    const body = rules[form[i]][k];
    form.splice(i, 1, body);
    out.push(form.join(' '));
  }
  return out;
}`,
        why: '`splice` puts the body in as one nested array, so the next search sees an array, not its symbols, and the strings come out with commas.',
      },
    ],
  },
  toTree: {
    optional: true,
    title: 'From picks to a parse tree',
    prompt:
      'Using the same picks as a **leftmost** derivation, build the parse tree. Write `toTree(rules, start, picks)`, returning a terminal as its plain string and a nonterminal node as an array: its name first, then its children, so `item → NUMBER` becomes `[\'item\', \'NUMBER\']`. A node built from an empty body is just `[name]`.',
    starter: `function toTree(rules, start, picks) {
  // your code here
}

const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
console.log(JSON.stringify(
  toTree(g, 'stmt', [0, 1, 0, 0, 0])));`,
    solution: `function toTree(rules, start, picks) {
  let p = 0;
  function grow(sym) {
    if (!(sym in rules)) return sym;
    const body = rules[sym][picks[p]];
    p++;
    return [sym, ...body.map(grow)];
  }
  return grow(start);
}`,
    tests: `${G}
test('print 1 + 2;', () => {
  expect(toTree(g, 'stmt', [0, 1, 0, 0, 0])).toEqual(
    ['stmt', 'print',
      ['expr', ['expr', ['item', 'NUMBER']], '+',
        ['item', 'NUMBER']],
      ';']);
});
test('brackets', () => {
  expect(toTree(g, 'item', [1, 0, 0])).toEqual(
    ['item', '(', ['expr', ['item', 'NUMBER']], ')']);
});
test('an empty body', () => {
  expect(toTree(lst, 'list', [0, 1]))
    .toEqual(['list', 'x', ['list']]);
});`,
    hints: [
      'Write a recursive function `grow(sym)` that builds the tree for one symbol. What should it return for a terminal?',
      'For a nonterminal, take the next pick (keep a counter outside `grow`), look up that body, and grow each symbol of the body, from left to right.',
      '`body.map(grow)` grows the children left to right, which uses the picks in exactly leftmost order. Return `[sym, ...children]`.',
    ],
    walkthrough: `**How to think about it.** A parse tree for a nonterminal is "its name, then a tree for each symbol of the body that was chosen for it"; a tree for a terminal is just the terminal. That is a recursive description, so write a recursive function. The only question is which pick goes with which node. In a leftmost derivation, the next nonterminal rewritten is always the leftmost one still unfinished; if you build the children of a node from left to right, finishing each child completely before starting the next, you meet the nonterminals in exactly that order. So one counter, moving forward each time a nonterminal takes a pick, is enough.

**The solution, line by line.**

- \`let p = 0;\` is the position of the next unused pick, shared by every call of \`grow\` (it is a closure over this variable).
- \`function grow(sym) {\` builds the tree for one symbol.
- \`if (!(sym in rules)) return sym;\` handles a terminal: it is a leaf, its own string, and uses no pick.
- \`const body = rules[sym][picks[p]];\` takes the next pick for this nonterminal; \`p++;\` moves past it before the children are grown, because the children come later in the derivation.
- \`return [sym, ...body.map(grow)];\` grows every symbol of the body, left to right (\`map\` visits an array in order), and puts the node's name in front. An empty body maps to nothing, giving \`[sym]\`.
- \`return grow(start);\` builds the whole tree from the start symbol.

For \`print 1 + 2;\`, \`stmt\` takes pick 0; \`print\` is a leaf; \`expr\` takes pick 1 (\`expr + item\`); its first child \`expr\` takes pick 0 (\`item\`), whose \`item\` takes pick 0 (\`NUMBER\`); then \`+\`; then the second \`item\` takes the last pick. That order, parent before children and left before right, is called *preorder*, and it is the leftmost derivation.

**Common wrong attempts.**

- Moving \`p++\` after the \`map\` gives every child the same pick as its parent, because the counter has not moved when the children are grown.
- Using a rightmost derivation's picks with this function builds the wrong tree, because the picks are matched to nonterminals in a different order; a rightmost derivation matches a right-to-left build instead.`,
    wrong: [
      {
        code: `function toTree(rules, start, picks) {
  let p = 0;
  function grow(sym) {
    if (!(sym in rules)) return sym;
    const body = rules[sym][picks[p]];
    const kids = body.map(grow);
    p++;
    return [sym, ...kids];
  }
  return grow(start);
}`,
        why: 'The counter moves only after the children are grown, so the children reuse their parent’s pick.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `expr → expr "+" item | item` and `item → NUMBER`, which of these is a single derivation step?',
    options: [
      { t: '`expr + item ⇒ NUMBER + item`', why: 'That needs two steps: `expr ⇒ item` and then `item ⇒ NUMBER`.' },
      { t: '`expr + item ⇒ expr + NUMBER`', correct: true, why: 'One nonterminal, `item`, is replaced by the body of one of its rules, `NUMBER`.' },
      { t: '`expr + item ⇒ item + NUMBER`', why: 'Two nonterminals changed at once; a step replaces exactly one.' },
      { t: '`expr + item ⇒ expr - item`', why: 'Terminals are never replaced, and there is no `-` in this grammar.' },
    ],
  },
  {
    q: 'The form is `print expr + item ;`. In a **rightmost** derivation, what is rewritten next?',
    options: [
      { t: '`;`', why: '`;` is a terminal: it is never rewritten.' },
      { t: '`expr`', why: 'That would be next in a leftmost derivation.' },
      { t: '`item`', correct: true, why: 'Of the two nonterminals, `item` is further right.' },
      { t: 'Either; a rightmost derivation may choose', why: 'The order is fixed: always the rightmost nonterminal.' },
    ],
  },
  {
    q: 'What is the **yield** of a parse tree?',
    options: [
      { t: 'The number of rules used', why: 'That is the number of inner nodes, not the yield.' },
      { t: 'Its leaves read from left to right: the sentence it derives', correct: true, why: 'Reading the leaves in order gives back the row of tokens.' },
      { t: 'The start symbol at its root', why: 'The root is where the derivation begins; the yield is where it ends.' },
      { t: 'Its rightmost derivation', why: 'A tree corresponds to a derivation, but its yield is the sentence.' },
    ],
  },
  {
    q: 'Two derivations of one sentence use the same rules on the same nonterminals, in a different order. What can you say about their parse trees?',
    options: [
      { t: 'They are the same tree', correct: true, why: 'A parse tree records which rule was used on which nonterminal, and forgets the order of the steps.' },
      { t: 'One leans left, the other right', why: 'The shape comes from the rules used, not from the order of the steps.' },
      { t: 'The leftmost one has more nodes', why: 'Both use the same rules, so both have the same nodes.' },
    ],
  },
  {
    q: 'In a parse tree, a node `elsePart` was rewritten with `elsePart → ε`. What are its children?',
    options: [
      { t: 'None, and the node is removed', why: 'The node stays, to show the rule was used.' },
      { t: 'The next token in the sentence', why: 'ε means the empty row: the rule produces no tokens.' },
      { t: 'A copy of `elsePart`', why: 'That would be a rule `elsePart → elsePart`, which is different.' },
      { t: 'One leaf, `ε`, which adds nothing to the sentence', correct: true, why: 'The leaf records the empty body, and the yield skips it.' },
    ],
  },
];
