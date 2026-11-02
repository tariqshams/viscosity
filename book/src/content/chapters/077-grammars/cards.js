// Chapter 77 cards. Keys are stable ids: never rename them.
//
// Exercises use token types as plain strings, as Drip’s scanner names
// them: 'number', 'identifier', '+', '(' and so on.

export const prompts = {
  'grammar-what': {
    q: 'What does a grammar describe?',
    a: 'Which rows (sequences) of tokens are valid programs in the language.',
  },
  'scanner-cant': {
    q: 'Why can’t the scanner reject `print + ; 3 (`?',
    a: 'Every token in it is spelled correctly. The problem is their order, and the scanner looks at one token at a time.',
  },
  'arrow-read': {
    q: 'How do you read the rule `stmt → "print" expr ";"` aloud?',
    a: '“A stmt is made of the keyword print, then an expr, then a semicolon.”',
  },
  'terminal-what': {
    q: 'In a grammar, what is a terminal?',
    a: 'A symbol that stands for a token, such as `"print"` or `NUMBER`. It is never replaced.',
  },
  'nonterminal-what': {
    q: 'In a grammar, what is a nonterminal?',
    a: 'The name of one or more rules, such as `expr`: a blank still to be filled in.',
  },
  'quoted-name': {
    q: 'What goes wrong with the rule `stmt → "print" "expr" ";"`?',
    a: 'The quotes make `"expr"` a terminal: it only matches a token spelled `expr`, instead of any expression.',
  },
  'recursive-rule': {
    q: 'How can five rules describe endlessly many programs?',
    a: 'Some rules mention themselves (like `expr → expr "+" item`), so they can be used again and again.',
  },
  'no-way-out': {
    q: 'What if the only rule for `expr` were `expr → expr "+" item`?',
    a: 'Every use would leave another `expr` behind, so no row of tokens could ever be finished. A recursive rule needs a non-recursive alternative, like a base case.',
  },
};

export const examples = {
  randomSentences: {
    title: 'A grammar that writes sentences',
    code: `const rules = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
const pick = (n) =>
  Math.floor(Math.random() * n);

function make(sym, depth) {
  const bodies = rules[sym];
  if (!bodies) {
    // a terminal: write it out
    return sym === 'NUMBER'
      ? String(pick(10)) : sym;
  }
  // a nonterminal: choose a body
  const k = depth > 3
    ? 0 : pick(bodies.length);
  return bodies[k]
    .map((s) => make(s, depth + 1))
    .join(' ');
}

for (let n = 0; n < 5; n++) {
  console.log(make('stmt', 0));
}

// Try: add a rule item → '-' item,
// or change 3 to 6 for longer ones.`,
  },
};

const G = `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const hi = {
  greeting: [['hello', 'name']],
  name: [['Ada'], ['Alan']],
};
const xs = { list: [['x'], ['x', 'list']] };
`;

export const exercises = {
  sortSymbols: {
    title: 'Sort a grammar’s symbols',
    prompt:
      'A grammar is stored as data, as in the runnable example: an object whose keys are the nonterminals, each holding a list of bodies, where a body is an array of symbols. Write `sortSymbols(rules)`, which returns `{ nonterminals, terminals }`: the nonterminals in the order of the keys, and every terminal **once**, in the order it is first met (reading the rules top to bottom, each body left to right).',
    starter: `function sortSymbols(rules) {
  // your code here
  return {
    nonterminals: [], terminals: [],
  };
}

const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
console.log(sortSymbols(g));`,
    solution: `function sortSymbols(rules) {
  const nonterminals =
    Object.keys(rules);
  const terminals = [];
  for (const head of nonterminals) {
    for (const body of rules[head]) {
      for (const s of body) {
        const nt =
          nonterminals.includes(s);
        if (!nt &&
            !terminals.includes(s)) {
          terminals.push(s);
        }
      }
    }
  }
  return { nonterminals, terminals };
}`,
    tests: `${G}
test('the adding grammar', () => {
  expect(sortSymbols(g)).toEqual({
    nonterminals: ['stmt', 'expr', 'item'],
    terminals: ['print', ';', '+', 'NUMBER', '(', ')'],
  });
});
test('the greeting grammar', () => {
  expect(sortSymbols(hi)).toEqual({
    nonterminals: ['greeting', 'name'],
    terminals: ['hello', 'Ada', 'Alan'],
  });
});
test('each terminal is listed once', () => {
  expect(sortSymbols(xs).terminals).toEqual(['x']);
});
test('an empty body adds nothing', () => {
  const r = { more: [['+', 'more'], []] };
  expect(sortSymbols(r)).toEqual({
    nonterminals: ['more'], terminals: ['+'],
  });
});`,
    hints: [
      'A symbol is a nonterminal exactly when it has rules of its own, which here means it is one of the object’s keys. `Object.keys(rules)` gives you those keys as an array, in order.',
      'Every other symbol in a body is a terminal. You need three loops, one inside the other: over the heads, over each head’s bodies, and over the symbols in each body.',
      'For each symbol `s`, push it onto `terminals` only if `!nonterminals.includes(s)` and it is not already in `terminals` (`!terminals.includes(s)`).',
    ],
    walkthrough: `**How to think about it.** The definition does all the work: a nonterminal is the name of some rules, and a terminal is any symbol that is not. In the data form, "has rules" means "is a key of the object", so the nonterminals are simply the keys. The terminals are whatever else turns up inside the bodies, which means visiting every symbol of every body of every rule; that is three loops, one inside the other, because the data is three levels deep (an object of lists of arrays). The only wrinkle is "once": \`+\` or \`x\` may appear in several bodies, so before adding a symbol we check it is not already there.

**The solution, line by line.**

- \`function sortSymbols(rules) {\` takes the grammar object.
- \`  const nonterminals =\` and \`    Object.keys(rules);\`: \`Object.keys\` returns an object's keys as an array, in the order they were written, so for the adding grammar this is \`['stmt', 'expr', 'item']\`. These are exactly the nonterminals.
- \`  const terminals = [];\` starts an empty list to fill.
- \`  for (const head of nonterminals) {\` visits each rule's head in turn.
- \`    for (const body of rules[head]) {\` visits each of that head's bodies; \`rules.expr\` has two, \`['item']\` and \`['expr', '+', 'item']\`.
- \`      for (const s of body) {\` visits each symbol of the body, left to right.
- \`        const nt =\` and \`          nonterminals.includes(s);\` ask whether \`s\` has rules of its own.
- \`        if (!nt &&\` and \`            !terminals.includes(s)) {\`: a symbol is added only if it is a terminal *and* not already listed.
- \`          terminals.push(s);\` adds it at the end, so the list keeps the order of first appearance.
- The closing braces end the \`if\` and the three loops.
- \`  return { nonterminals, terminals };\` returns both lists in one object (\`{ nonterminals }\` is short for \`{ nonterminals: nonterminals }\`).
- \`}\` closes the function.

For the adding grammar the walk meets \`print\` (new terminal), \`expr\` (a key, so skipped), \`;\` (new), then \`item\` (skipped), \`expr\`, \`+\` (new), \`item\`, then \`NUMBER\` (new), \`(\` (new), \`expr\` and \`)\` (new), which gives \`['print', ';', '+', 'NUMBER', '(', ')']\`. An empty body has no symbols, so the innermost loop does not run for it.

**Common wrong attempts.**

- Calling a symbol a terminal when it differs from *its own rule's* head: then \`expr\`, sitting in \`stmt\`'s body, is counted as a terminal. Whether a symbol is a blank depends on the whole grammar, not on the rule it appears in.
- Forgetting the "once" check: \`x\` is then listed twice for \`list → "x"\` and \`list → "x" list\`.`,
    wrong: [
      {
        code: `function sortSymbols(rules) {
  const nonterminals =
    Object.keys(rules);
  const terminals = [];
  for (const head of nonterminals) {
    for (const body of rules[head]) {
      for (const s of body) {
        if (s !== head &&
            !terminals.includes(s)) {
          terminals.push(s);
        }
      }
    }
  }
  return { nonterminals, terminals };
}`,
        why: 'This only compares a symbol with the head of the rule it sits in, so `expr` inside `stmt`’s body is wrongly counted as a terminal. A symbol is a nonterminal if it is *any* key.',
      },
      {
        code: `function sortSymbols(rules) {
  const nonterminals =
    Object.keys(rules);
  const terminals = [];
  for (const head of nonterminals) {
    for (const body of rules[head]) {
      for (const s of body) {
        if (!nonterminals.includes(s)) {
          terminals.push(s);
        }
      }
    }
  }
  return { nonterminals, terminals };
}`,
        why: 'The terminals are right, but a terminal used in two bodies is listed twice: `xs` gives `[\'x\', \'x\']`.',
      },
    ],
  },
  selfRules: {
    optional: true,
    title: 'Which rules mention themselves?',
    prompt:
      'Write `selfRules(rules)`, which returns the heads (in key order) that have at least one body containing the head itself, such as `expr` in `expr → expr "+" item`. These are the rules that make a grammar describe endlessly many rows.',
    starter: `function selfRules(rules) {
  // your code here
}

const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'],
         ['expr', '+', 'item']],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
console.log(selfRules(g)); // ['expr']`,
    solution: `function selfRules(rules) {
  const out = [];
  const heads = Object.keys(rules);
  for (const head of heads) {
    const bodies = rules[head];
    if (bodies.some((b) =>
        b.includes(head))) {
      out.push(head);
    }
  }
  return out;
}`,
    tests: `${G}
test('only expr mentions itself', () => {
  expect(selfRules(g)).toEqual(['expr']);
});
test('no recursion at all', () => {
  expect(selfRules(hi)).toEqual([]);
});
test('a list of x', () => {
  expect(selfRules(xs)).toEqual(['list']);
});
test('several heads', () => {
  const r = {
    a: [['a', 'b'], ['b']],
    b: [['c']],
    c: [['(', 'c', ')'], ['0']],
  };
  expect(selfRules(r)).toEqual(['a', 'c']);
});`,
    hints: [
      'Go through the heads one at a time with `Object.keys(rules)`. For each head, the question is about its own bodies only.',
      'An array method answers “does at least one item pass this test?”: `bodies.some((b) => ...)`.',
      'The test for one body `b` is `b.includes(head)`. If any body passes, push the head onto the result.',
    ],
    walkthrough: `**How to think about it.** "A rule that mentions itself" means: the head appears somewhere in one of its own bodies. So for each head we look only at that head's bodies, and ask whether at least one of them contains the head. Note that \`item\` is *not* one of these in the adding grammar, even though \`item → "(" expr ")"\` leads, through \`expr\`, back round to \`item\`; that is recursion through another rule, and this exercise only asks about the direct kind.

**The solution, line by line.**

- \`function selfRules(rules) {\` takes the grammar.
- \`  const out = [];\` will collect the answer.
- \`  const heads = Object.keys(rules);\` lists the heads, in the order the keys were written.
- \`  for (const head of heads) {\` visits each one.
- \`    const bodies = rules[head];\` gets that head's list of bodies.
- \`    if (bodies.some((b) =>\` and \`        b.includes(head))) {\`: \`some\` calls the arrow function on each body and is \`true\` as soon as one call returns \`true\`; \`b.includes(head)\` asks whether this body contains the head.
- \`      out.push(head);\` records the head.
- \`    }\`, \`  }\` close the \`if\` and the loop.
- \`  return out;\` returns the heads found, in key order.
- \`}\` closes the function.

**Common wrong attempt.** Asking whether the head appears in *any* body of *any* rule: then \`item\` counts (it is in \`expr\`'s bodies), and so does every nonterminal that is used anywhere, which is nearly all of them.`,
    wrong: [
      {
        code: `function selfRules(rules) {
  const out = [];
  const heads = Object.keys(rules);
  for (const head of heads) {
    for (const h of heads) {
      if (rules[h].some((b) =>
          b.includes(head))) {
        out.push(head);
        break;
      }
    }
  }
  return out;
}`,
        why: 'This looks in every rule’s bodies, not just the head’s own, so it finds every nonterminal that is used anywhere: the adding grammar gives `[\'expr\', \'item\']`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which problem can a grammar catch that a scanner can’t?',
    options: [
      { t: 'A character that isn’t allowed anywhere, like `@`', why: 'That is a scanning error: no token starts with `@`.' },
      { t: 'A string with no closing quote', why: 'The scanner catches that, because it happens inside one token.' },
      { t: 'Tokens in an order that makes no sense, like `print + ;`', correct: true, why: 'Each token is fine on its own. Only rules about order reject it.' },
      { t: 'A misspelled keyword, like `whlie`', why: '`whlie` is a perfectly good identifier. A grammar might reject where it appears, but nothing knows it was meant to be `while`.' },
    ],
  },
  {
    q: 'In `item → "(" expr ")"`, which symbols are terminals?',
    options: [
      { t: '`"("` and `")"`', correct: true, why: 'They are in quotes: each stands for exactly one token. `item` and `expr` are names of rules.' },
      { t: '`item` and `expr`', why: 'Those are nonterminals: blanks to be filled by their own rules.' },
      { t: 'All four', why: '`item` and `expr` still have to be filled in, so they are not terminals.' },
      { t: 'Only `expr`, because it is in the middle', why: 'Position doesn’t matter; what matters is whether it stands for a token or names a rule.' },
    ],
  },
  {
    q: `Which of these token rows fits this grammar, starting from \`stmt\`?
\`\`\`
stmt → "print" expr ";"
expr → expr "+" item
expr → item
item → NUMBER
item → "(" expr ")"
\`\`\``,
    options: [
      { t: '`print 1 +;`', why: 'Every `+` must be followed by an item.' },
      { t: '`print;`', why: 'An expr must contain at least one item.' },
      { t: '`print (1 + 2;`', why: 'An opening bracket must be matched by `)`.' },
      { t: '`print (1) + 2;`', correct: true, why: 'The expr is two items joined by `+`: the first is `( expr )` holding the number 1, the second is the number 2.' },
    ],
  },
  {
    q: 'A grammar has `list → "x" list` and no other rule for `list`. Which rows of tokens does `list` describe?',
    options: [
      { t: 'One or more `x`', why: 'To stop at some number of `x`, there would need to be a rule with no `list` in its body.' },
      { t: 'None at all: every use leaves another `list`, so no row can be finished', correct: true, why: 'A recursive rule needs a non-recursive alternative, like a base case.' },
      { t: 'Endlessly many: x, xx, xxx, …', why: 'Each of those would need the blanks to run out, and they never can.' },
      { t: 'Just `x`', why: 'After one use you have `"x" list`, which still has a blank in it.' },
    ],
  },
  {
    q: 'A grammar has the rules `stmt → "print" NUMBER ";"` and `stmt → "print" "(" NUMBER ")" ";"`. What is its start symbol, and how many terminals does it use?',
    options: [
      { t: 'The start symbol is `print`; there are 4 terminals', why: '`print` is in quotes, so it is a terminal; the start symbol is a nonterminal.' },
      { t: 'The start symbol is `stmt`; there are 5 terminals: print, NUMBER, ;, ( and )', correct: true, why: '`stmt` is the only nonterminal, so every row starts from it. Each different terminal is counted once.' },
      { t: 'The start symbol is `NUMBER`; there are 3 terminals', why: '`NUMBER` stands for a number token, so it is a terminal, not a blank.' },
    ],
  },

];
