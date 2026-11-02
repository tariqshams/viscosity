// Chapter 56 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 61, 61, 61, 61.

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
  'bnf-what': {
    q: 'What is BNF?',
    a: 'The standard notation for writing grammars: each rule is a head, an arrow (or `::=`), and a body of terminals and nonterminals.',
  },
  'bar-means': {
    q: 'In BNF, what does `item → NUMBER | "(" expr ")"` mean?',
    a: 'An item is a NUMBER, or an expr in brackets. `|` means “or”: it is two rules written on one line.',
  },
  'star-means': {
    q: 'In BNF, what does `expr → item ( "+" item )*` mean?',
    a: 'An item, followed by zero or more `+ item` pairs.',
  },
  'question-means': {
    q: 'In `letDecl → "let" IDENT ( "=" expression )? ";"`, what does `?` mean?',
    a: 'The group is optional: once, or not at all. So `let x;` and `let x = 1;` both fit.',
  },
  'star-binds': {
    q: 'In `args → expr "," expr*`, what does the star repeat?',
    a: 'Only the `expr` just before it. To repeat a comma and an expr together, group them: `( "," expr )*`.',
  },
  'epsilon-what': {
    q: 'What does ε mean in a rule such as `R → ε`?',
    a: 'The empty row of symbols: R may stand for nothing at all. It is how an unfolded star stops repeating.',
  },
  'nest-how': {
    q: 'Which loop of rules lets a Drip block contain another block?',
    a: 'A block holds declarations, a declaration can be a statement, and a statement can be a block.',
  },
  'regex-limit': {
    q: 'What can a grammar describe that a regular expression over tokens cannot?',
    a: 'Nesting to any depth, such as brackets inside brackets or calls inside calls. It needs rules that mention themselves.',
  },
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
  callRegex: {
    title: 'A rule as a regular expression',
    code: `// One letter per token type:
// n = NUMBER, i = IDENT
// args → NUMBER ( "," NUMBER )*
const args = 'n(,n)*';
// call → IDENT "(" args? ")"
const call = new RegExp(
  '^i\\\\((' + args + ')?\\\\)$');

const rows = ['i()', 'i(n)', 'i(n,n,n)',
  'i(n,)', 'i(,)', 'i(n'];
for (const r of rows) {
  console.log(r, call.test(r));
}

// Try: allow names as arguments too,
// with args = '[ni](,[ni])*'.`,
  },
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
  sortSymbols: {
    title: 'Sort a grammar’s symbols',
    prompt: 'A grammar is stored as data, as in the runnable example: an object whose keys are the nonterminals, each holding a list of bodies, where a body is an array of symbols. Write `sortSymbols(rules)`, which returns `{ nonterminals, terminals }`: the nonterminals in the order of the keys, and every terminal **once**, in the order it is first met (reading the rules top to bottom, each body left to right).',
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
    tests: `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const hi = {
  greeting: [['hello', 'name']],
  name: [['Ada'], ['Alan']],
};
const xs = { list: [['x'], ['x', 'list']] };

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
    prompt: 'Write `selfRules(rules)`, which returns the heads (in key order) that have at least one body containing the head itself, such as `expr` in `expr → expr "+" item`. These are the rules that make a grammar describe endlessly many rows.',
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
    tests: `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const hi = {
  greeting: [['hello', 'name']],
  name: [['Ada'], ['Alan']],
};
const xs = { list: [['x'], ['x', 'list']] };

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
  isSum: {
    title: 'Check tokens against a grammar',
    prompt: 'The grammar is `sum → NUMBER ( "+" NUMBER )*`. Write `isSum(ts)`, which gets an array of token types (such as `[\'number\', \'+\', \'number\']`) and returns `true` if the whole array is a `sum`, and `false` otherwise.',
    starter: `function isSum(ts) {
  // your code here
}

console.log(isSum(['number', '+',
  'number']));  // true
console.log(isSum(['number', '+']));
// false`,
    solution: `function isSum(ts) {
  if (ts[0] !== 'number') return false;
  let i = 1;
  while (ts[i] === '+') {
    if (ts[i + 1] !== 'number') {
      return false;
    }
    i += 2;
  }
  return i === ts.length;
}`,
    tests: `test('one number', () => {
  expect(isSum(['number'])).toBe(true);
});
test('a longer sum', () => {
  expect(isSum(['number', '+', 'number', '+', 'number'])).toBe(true);
});
test('nothing at all', () => {
  expect(isSum([])).toBe(false);
});
test('starts with +', () => {
  expect(isSum(['+', 'number'])).toBe(false);
});
test('ends with +', () => {
  expect(isSum(['number', '+'])).toBe(false);
});
test('two numbers with no + between', () => {
  expect(isSum(['number', 'number'])).toBe(false);
});
test('two + in a row', () => {
  expect(isSum(['number', '+', '+', 'number'])).toBe(false);
});`,
    hints: [
      'Read the rule from left to right and do one check for each piece. The first piece is `NUMBER`: what must be true of `ts[0]`?',
      'The `( "+" NUMBER )*` part is “zero or more”, which is a loop: keep an index `i`, and while `ts[i]` is `+`, the token after it must be a `number`.',
      'Inside the loop, move past both tokens with `i += 2`. When the loop stops, every token must have been used, so return `i === ts.length`.',
    ],
    walkthrough: `**How to think about it.** A rule is read left to right, and each piece of it becomes one piece of code. The rule \`sum → NUMBER ( "+" NUMBER )*\` has two pieces: one \`NUMBER\`, which is a single check, and a starred group, which is "zero or more times", the natural job of a \`while\` loop. Then there is one more thing the rule says without writing it: the whole array must be a sum, so nothing may be left over at the end. Try a few rows on paper first: \`number\` fits (zero repeats), \`number + number + number\` fits (two repeats), and \`number +\` does not, because the group always brings a \`number\` with its \`+\`.

**The solution, line by line.**

- \`function isSum(ts) {\` takes the array of token types.
- \`  if (ts[0] !== 'number') return false;\` is the first piece of the rule, \`NUMBER\`. If the first token is anything else, the row cannot be a sum. An empty array lands here too, because \`ts[0]\` is \`undefined\`, which is not \`'number'\`.
- \`  let i = 1;\` keeps our place: the index of the next token we have not checked yet.
- \`  while (ts[i] === '+') {\` is the starred group. Each time round, the next token is a \`+\`, so we are at the start of one more \`"+" NUMBER\` pair. If the next token is not \`+\`, the group repeats no more, and the loop stops (possibly without running at all).
- \`    if (ts[i + 1] !== 'number') {\` checks the second half of the pair: a \`+\` must be followed by a number.
- \`      return false;\` rejects rows like \`number +\` (where \`ts[i + 1]\` is \`undefined\`) and \`number + +\`.
- \`    }\` closes the check.
- \`    i += 2;\` moves past the whole pair, the \`+\` and its number.
- \`  }\` closes the loop.
- \`  return i === ts.length;\` is the "nothing left over" check. The loop stopped at the first token that is not \`+\`; if that is the end of the array, \`i\` equals the length and the row is a sum. If not, something the rule does not allow is sitting there, such as a second number with no \`+\` before it.
- \`}\` closes the function.

For \`['number', '+', 'number']\`: \`ts[0]\` is a number, \`i\` is 1, \`ts[1]\` is \`+\` and \`ts[2]\` is a number, so \`i\` becomes 3; \`ts[3]\` is \`undefined\`, so the loop stops, and \`3 === 3\` is \`true\`.

**Common wrong attempts.**

- Forgetting the last check and returning \`true\` after the loop: \`['number', 'number']\` then passes, because the loop stops at the second number and nobody looks at it.
- Checking that numbers and \`+\` simply alternate, with \`every\`: close, but the empty array passes (\`every\` on no items is \`true\`), and so does \`['number', '+']\`, which ends with a \`+\`.

This shape, *a loop for every star*, is exactly how you will write a parser in the chapter "Recursive descent parsing"; a parser does the same walk, but builds something as it goes.`,
    wrong: [
      {
        code: `function isSum(ts) {
  if (ts[0] !== 'number') return false;
  let i = 1;
  while (ts[i] === '+') {
    if (ts[i + 1] !== 'number') {
      return false;
    }
    i += 2;
  }
  return true;
}`,
        why: 'This never checks that every token was used, so `[\'number\', \'number\']` passes: the loop stops at the second number and the leftover is ignored.',
      },
      {
        code: `function isSum(ts) {
  return ts.every((t, i) =>
    i % 2 === 0
      ? t === 'number'
      : t === '+');
}`,
        why: 'Checking that numbers and `+` alternate is close, but the empty array passes (`every` on nothing is `true`), and so does `[\'number\', \'+\']`, which ends with `+`.',
      },
    ],
  },
  isCall: {
    optional: true,
    title: 'A grammar with an optional part',
    prompt: 'Write `isCall(ts)` for this grammar: `call → IDENT "(" args? ")"` and `args → NUMBER ( "," NUMBER )*`. So `f()`, `f(1)` and `f(1, 2, 3)` are calls; `f(1,)` and `f(,)` are not. The input is an array of token types, such as `[\'identifier\', \'(\', \')\']`.',
    starter: `function isCall(ts) {
  // your code here
}

console.log(isCall(['identifier', '(',
  'number', ')']));  // true`,
    solution: `function isCall(ts) {
  if (ts[0] !== 'identifier') {
    return false;
  }
  if (ts[1] !== '(') return false;
  let i = 2;
  if (ts[i] === 'number') {
    i++;
    while (ts[i] === ',' &&
           ts[i + 1] === 'number') {
      i += 2;
    }
  }
  return ts[i] === ')' &&
    i === ts.length - 1;
}`,
    tests: `const id = 'identifier';
test('no arguments', () => {
  expect(isCall([id, '(', ')'])).toBe(true);
});
test('one argument', () => {
  expect(isCall([id, '(', 'number', ')'])).toBe(true);
});
test('three arguments', () => {
  expect(isCall([id, '(', 'number', ',', 'number', ',', 'number', ')'])).toBe(true);
});
test('a trailing comma', () => {
  expect(isCall([id, '(', 'number', ',', ')'])).toBe(false);
});
test('a lone comma', () => {
  expect(isCall([id, '(', ',', ')'])).toBe(false);
});
test('missing )', () => {
  expect(isCall([id, '(', 'number'])).toBe(false);
});
test('something after the )', () => {
  expect(isCall([id, '(', ')', ')'])).toBe(false);
});
test('no name', () => {
  expect(isCall(['(', ')'])).toBe(false);
});`,
    hints: [
      'Check the fixed parts of `call` first: an `identifier` at index 0 and `(` at index 1.',
      '`args?` means the arguments may be missing, which is an `if`. Every list of arguments starts with a number, so if `ts[2]` is a `number`, read the arguments; otherwise skip straight to the `)` check.',
      'Inside the arguments, loop while you see `,` followed by a `number`, moving `i` on by 2 each time. At the end, `ts[i]` must be `)` and it must be the last token: `i === ts.length - 1`.',
    ],
    walkthrough: `**How to think about it.** Two rules, but one walk: wherever \`call\` says \`args\`, we do what \`args\` says, right there. Read \`call\` left to right: two fixed tokens, an optional group, a fixed token, and nothing after it. "Optional" is the job of an \`if\`; "zero or more" is the job of a \`while\`; a fixed token is one check. The one question is how to know whether the optional \`args\` is there; the answer is to look at the next token, because every \`args\` begins with a \`NUMBER\`, and \`)\` (the only other thing that may come next) is not a number.

**The solution, line by line.**

- \`function isCall(ts) {\` takes the token types.
- \`  if (ts[0] !== 'identifier') {\` checks the first symbol of \`call\`, \`IDENT\`: the function's name.
- \`    return false;\` rejects rows with no name, such as \`( )\`.
- \`  }\` closes it.
- \`  if (ts[1] !== '(') return false;\` checks the second symbol, the opening bracket.
- \`  let i = 2;\` is our place: the first token after the bracket.
- \`  if (ts[i] === 'number') {\` is \`args?\`: the arguments are there exactly when the next token is a number.
- \`    i++;\` moves past that first number, which is the \`NUMBER\` at the start of \`args\`.
- \`    while (ts[i] === ',' &&\` and \`           ts[i + 1] === 'number') {\` are the starred group \`( "," NUMBER )*\`: one more pair, a comma and a number, each time round.
- \`      i += 2;\` moves past the pair.
- \`    }\` and \`  }\` close the loop and the \`if\`.
- \`  return ts[i] === ')' &&\` checks the closing bracket, which must be wherever we have got to.
- \`    i === ts.length - 1;\` checks that the bracket is the last token, so nothing follows the call.
- \`}\` closes the function.

Try \`f(1,)\`: after the \`1\`, \`ts[i]\` is \`,\` but \`ts[i + 1]\` is \`)\`, so the loop does not run; \`ts[i]\` is then the comma, not \`)\`, and the answer is \`false\`, exactly as the grammar demands (a comma must be followed by a number).

**Common wrong attempts.**

- A loop that skips any mixture of numbers and commas: it accepts \`f(1,)\` and \`f(,)\`, because it never checks that a comma is followed by a number. The grammar fixes the order inside the group, so the code must too.
- Checking only that the last token is \`)\`: \`f())\` then passes, because the first \`)\` is never compared with the end of the array.

Optional means \`if\`, repetition means \`while\`, and a row of symbols means one check after another: that is most of what you need to turn a grammar into code.`,
    wrong: [
      {
        code: `function isCall(ts) {
  if (ts[0] !== 'identifier') {
    return false;
  }
  if (ts[1] !== '(') return false;
  let i = 2;
  while (ts[i] === 'number' ||
         ts[i] === ',') {
    i++;
  }
  return ts[i] === ')' &&
    i === ts.length - 1;
}`,
        why: 'This lets numbers and commas come in any order, so `f(1,)` and `f(,)` are accepted. The grammar says a comma must always be followed by a number.',
      },
    ],
  },
  leftmost: {
    title: 'Run a leftmost derivation',
    prompt: 'A grammar is stored as data, as in the chapter on grammars: an object whose keys are the nonterminals, each holding a list of bodies (an empty array `[]` is the body ε). Write `leftmost(rules, start, picks)`. Start from the form `[start]`; for each number `k` in `picks`, replace the **leftmost** nonterminal with its body number `k`. Return every form along the way, each joined into a string with spaces, starting with the start symbol. If a pick comes when no nonterminal is left, throw an error.',
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
    tests: `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const lst = { list: [['x', 'list'], []] };
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
    prompt: 'Using the same picks as a **leftmost** derivation, build the parse tree. Write `toTree(rules, start, picks)`, returning a terminal as its plain string and a nonterminal node as an array: its name first, then its children, so `item → NUMBER` becomes `[\'item\', \'NUMBER\']`. A node built from an empty body is just `[name]`.',
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
    tests: `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item'], ['expr', '+', 'item']],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const lst = { list: [['x', 'list'], []] };
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
  groupings: {
    title: 'Every tree, written out',
    prompt: 'Under the ambiguous grammar `expr → expr op expr | NUMBER`, a row of tokens such as `[\'1\', \'-\', \'2\', \'-\', \'3\']` can have several parse trees. Write `groupings(ts)`, returning every tree as a fully bracketed string with no spaces: a single number stays as it is (`\'1\'`), and an operator node is `(left op right)`. List the trees by the position of the root operator, leftmost first, and within that in the order of the left side’s list, then the right side’s. So `groupings(\'1 - 2 - 3\'.split(\' \'))` is `[\'(1-(2-3))\', \'((1-2)-3)\']`.',
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
    prompt: 'A grammar (as data, with `[]` for ε) is **right-linear**, the regular kind at the bottom of the Chomsky hierarchy, when every body is empty, a single terminal, or a terminal followed by one nonterminal. Write `isRightLinear(rules)`, returning `true` or `false`.',
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
    q: 'Which problem can a grammar catch that a scanner can’t?',
    options: [
      {
        t: 'A character that isn’t allowed anywhere, like `@`',
        why: 'That is a scanning error: no token starts with `@`.',
      },
      {
        t: 'A string with no closing quote',
        why: 'The scanner catches that, because it happens inside one token.',
      },
      {
        t: 'Tokens in an order that makes no sense, like `print + ;`',
        correct: true,
        why: 'Each token is fine on its own. Only rules about order reject it.',
      },
      {
        t: 'A misspelled keyword, like `whlie`',
        why: '`whlie` is a perfectly good identifier. A grammar might reject where it appears, but nothing knows it was meant to be `while`.',
      },
    ],
  },
  {
    q: 'In `item → "(" expr ")"`, which symbols are terminals?',
    options: [
      {
        t: '`"("` and `")"`',
        correct: true,
        why: 'They are in quotes: each stands for exactly one token. `item` and `expr` are names of rules.',
      },
      {
        t: '`item` and `expr`',
        why: 'Those are nonterminals: blanks to be filled by their own rules.',
      },
      {
        t: 'All four',
        why: '`item` and `expr` still have to be filled in, so they are not terminals.',
      },
      {
        t: 'Only `expr`, because it is in the middle',
        why: 'Position doesn’t matter; what matters is whether it stands for a token or names a rule.',
      },
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
      {
        t: '`print 1 +;`',
        why: 'Every `+` must be followed by an item.',
      },
      {
        t: '`print;`',
        why: 'An expr must contain at least one item.',
      },
      {
        t: '`print (1 + 2;`',
        why: 'An opening bracket must be matched by `)`.',
      },
      {
        t: '`print (1) + 2;`',
        correct: true,
        why: 'The expr is two items joined by `+`: the first is `( expr )` holding the number 1, the second is the number 2.',
      },
    ],
  },
  {
    q: 'A grammar has `list → "x" list` and no other rule for `list`. Which rows of tokens does `list` describe?',
    options: [
      {
        t: 'One or more `x`',
        why: 'To stop at some number of `x`, there would need to be a rule with no `list` in its body.',
      },
      {
        t: 'None at all: every use leaves another `list`, so no row can be finished',
        correct: true,
        why: 'A recursive rule needs a non-recursive alternative, like a base case.',
      },
      {
        t: 'Endlessly many: x, xx, xxx, …',
        why: 'Each of those would need the blanks to run out, and they never can.',
      },
      {
        t: 'Just `x`',
        why: 'After one use you have `"x" list`, which still has a blank in it.',
      },
    ],
  },
  {
    q: 'A grammar has the rules `stmt → "print" NUMBER ";"` and `stmt → "print" "(" NUMBER ")" ";"`. What is its start symbol, and how many terminals does it use?',
    options: [
      {
        t: 'The start symbol is `print`; there are 4 terminals',
        why: '`print` is in quotes, so it is a terminal; the start symbol is a nonterminal.',
      },
      {
        t: 'The start symbol is `stmt`; there are 5 terminals: print, NUMBER, ;, ( and )',
        correct: true,
        why: '`stmt` is the only nonterminal, so every row starts from it. Each different terminal is counted once.',
      },
      {
        t: 'The start symbol is `NUMBER`; there are 3 terminals',
        why: '`NUMBER` stands for a number token, so it is a terminal, not a blank.',
      },
    ],
  },
  {
    q: 'Which rule says the same as `args → NUMBER ( "," NUMBER )*`?',
    options: [
      {
        t: '`args → NUMBER "," NUMBER`',
        why: 'This allows exactly two numbers, not one or many.',
      },
      {
        t: '`args → NUMBER | args "," NUMBER`',
        correct: true,
        why: 'One number, or a shorter args followed by one more `, NUMBER`. Recursion and `*` describe the same lists.',
      },
      {
        t: '`args → ( NUMBER "," )*`',
        why: 'This allows an empty list and forces a trailing comma.',
      },
      {
        t: '`args → NUMBER?`',
        why: 'This allows at most one number.',
      },
    ],
  },
  {
    q: 'In `ifStmt → "if" expression block ( "else" block )?`, what does the `?` allow?',
    options: [
      {
        t: 'Any number of `else` parts',
        why: 'That would be `*`.',
      },
      {
        t: 'The condition to be left out',
        why: 'The `?` applies only to the group just before it, the `else` part.',
      },
      {
        t: 'An `if` with or without one `else` part',
        correct: true,
        why: '`?` means once, or not at all; unfolded, it is two rules, one with the else part and one without.',
      },
      {
        t: 'The `else` to come before the `if`',
        why: 'A rule is read in order; `?` doesn’t move anything.',
      },
    ],
  },
  {
    q: 'Unfolding the shorthand in `list → "[" ( NUMBER )* "]"` into plain rules needs what?',
    options: [
      {
        t: 'Nothing: a star is already a plain rule',
        why: 'Plain BNF has no star; that is why it is called a shorthand.',
      },
      {
        t: 'A rule for every possible length of list',
        why: 'That would be endlessly many rules. One helper that mentions itself covers every length.',
      },
      {
        t: 'A new helper nonterminal R, with `R → NUMBER R` and `R → ε`, and `list → "[" R "]"`',
        correct: true,
        why: 'R repeats by mentioning itself, and ε is its way out.',
      },
    ],
  },
  {
    q: 'Which of these does the rule `call → IDENT "(" ( NUMBER ( "," NUMBER )* )? ")"` allow?',
    options: [
      {
        t: '`f(1, 2)`',
        correct: true,
        why: 'A name, a bracket, the optional group present (one number, then one `, NUMBER` pair) and a bracket.',
      },
      {
        t: '`f(1,)`',
        why: 'Each comma must bring a number with it.',
      },
      {
        t: '`f 1`',
        why: 'The brackets are terminals outside the optional group, so they are required.',
      },
      {
        t: '`f(,)`',
        why: 'The optional group, when present, must start with a number.',
      },
    ],
  },
  {
    q: 'Why can a rule that uses only `|`, `( )`, `?` and `*` over tokens (and no nonterminals) be written as a regular expression?',
    options: [
      {
        t: 'Because those are exactly the operators regular expressions have, and nothing in such a rule can nest',
        correct: true,
        why: 'What a regular expression cannot do is check nesting to any depth, which needs a rule that mentions itself.',
      },
      {
        t: 'Because every grammar can be written as a regular expression',
        why: 'Not so: no regular expression can check that brackets are balanced at any depth.',
      },
      {
        t: 'Because regular expressions understand tokens',
        why: 'They match characters; the example works by writing one letter per token type.',
      },
    ],
  },
  {
    q: 'With `expr → expr "+" item | item` and `item → NUMBER`, which of these is a single derivation step?',
    options: [
      {
        t: '`expr + item ⇒ NUMBER + item`',
        why: 'That needs two steps: `expr ⇒ item` and then `item ⇒ NUMBER`.',
      },
      {
        t: '`expr + item ⇒ expr + NUMBER`',
        correct: true,
        why: 'One nonterminal, `item`, is replaced by the body of one of its rules, `NUMBER`.',
      },
      {
        t: '`expr + item ⇒ item + NUMBER`',
        why: 'Two nonterminals changed at once; a step replaces exactly one.',
      },
      {
        t: '`expr + item ⇒ expr - item`',
        why: 'Terminals are never replaced, and there is no `-` in this grammar.',
      },
    ],
  },
  {
    q: 'The form is `print expr + item ;`. In a **rightmost** derivation, what is rewritten next?',
    options: [
      {
        t: '`;`',
        why: '`;` is a terminal: it is never rewritten.',
      },
      {
        t: '`expr`',
        why: 'That would be next in a leftmost derivation.',
      },
      {
        t: '`item`',
        correct: true,
        why: 'Of the two nonterminals, `item` is further right.',
      },
      {
        t: 'Either; a rightmost derivation may choose',
        why: 'The order is fixed: always the rightmost nonterminal.',
      },
    ],
  },
  {
    q: 'What is the **yield** of a parse tree?',
    options: [
      {
        t: 'The number of rules used',
        why: 'That is the number of inner nodes, not the yield.',
      },
      {
        t: 'Its leaves read from left to right: the sentence it derives',
        correct: true,
        why: 'Reading the leaves in order gives back the row of tokens.',
      },
      {
        t: 'The start symbol at its root',
        why: 'The root is where the derivation begins; the yield is where it ends.',
      },
      {
        t: 'Its rightmost derivation',
        why: 'A tree corresponds to a derivation, but its yield is the sentence.',
      },
    ],
  },
  {
    q: 'Two derivations of one sentence use the same rules on the same nonterminals, in a different order. What can you say about their parse trees?',
    options: [
      {
        t: 'They are the same tree',
        correct: true,
        why: 'A parse tree records which rule was used on which nonterminal, and forgets the order of the steps.',
      },
      {
        t: 'One leans left, the other right',
        why: 'The shape comes from the rules used, not from the order of the steps.',
      },
      {
        t: 'The leftmost one has more nodes',
        why: 'Both use the same rules, so both have the same nodes.',
      },
    ],
  },
  {
    q: 'In a parse tree, a node `elsePart` was rewritten with `elsePart → ε`. What are its children?',
    options: [
      {
        t: 'None, and the node is removed',
        why: 'The node stays, to show the rule was used.',
      },
      {
        t: 'The next token in the sentence',
        why: 'ε means the empty row: the rule produces no tokens.',
      },
      {
        t: 'A copy of `elsePart`',
        why: 'That would be a rule `elsePart → elsePart`, which is different.',
      },
      {
        t: 'One leaf, `ε`, which adds nothing to the sentence',
        correct: true,
        why: 'The leaf records the empty body, and the yield skips it.',
      },
    ],
  },
  {
    q: 'Which of these shows that a grammar is ambiguous?',
    options: [
      {
        t: 'A sentence with a leftmost and a rightmost derivation',
        why: 'Every sentence of a grammar has both, and the two can still draw one and the same tree.',
      },
      {
        t: 'A sentence that is very long',
        why: 'Length has nothing to do with it.',
      },
      {
        t: 'A sentence with two different parse trees',
        correct: true,
        why: 'That is the definition: two trees, so two possible meanings.',
      },
      {
        t: 'A rule that mentions itself',
        why: 'Recursive rules are normal; the layered grammar is recursive and unambiguous.',
      },
    ],
  },
  {
    q: 'Under `term → term "+" factor | factor`, `factor → factor "*" primary | primary`, `primary → NUMBER`, what is at the root of the tree for `1 + 2 * 3`?',
    options: [
      {
        t: 'The `+`',
        correct: true,
        why: '`*` can only join `primary`s inside a `factor`, so `2 * 3` is one `factor`, and the `+` joins `1` to it.',
      },
      {
        t: 'The `*`',
        why: 'That would need `1 + 2` to be a `primary`, and a `primary` here is only a number.',
      },
      {
        t: 'Either, since the grammar is ambiguous',
        why: 'This layered grammar has exactly one tree for every sentence.',
      },
    ],
  },
  {
    q: 'JavaScript’s specification resolves `if (a) if (b) s1; else s2;` how?',
    options: [
      {
        t: 'It is a syntax error',
        why: 'It is allowed; the specification says which `if` gets the `else`.',
      },
      {
        t: 'The `else` belongs to the outer `if`',
        why: 'That is the other reading, which JavaScript does not choose.',
      },
      {
        t: 'The engine chooses at run time',
        why: 'The grouping is fixed when the program is parsed.',
      },
      {
        t: 'The `else` belongs to the nearest (inner) `if`',
        correct: true,
        why: 'Its grammar has a note saying exactly this.',
      },
    ],
  },
  {
    q: 'Why does Drip have no dangling else?',
    options: [
      {
        t: 'Its parser tries both trees',
        why: 'A parser that tried both would still have to choose one.',
      },
      {
        t: 'Braces are required, so an inner `if` and its `else` are always inside `{ }`',
        correct: true,
        why: 'The braces show which `if` an `else` belongs to; there is only one tree.',
      },
      {
        t: 'Drip has no `else`',
        why: 'It does: `if c { ... } else { ... }`.',
      },
    ],
  },
  {
    q: 'Which machine recognises exactly the context-free languages?',
    options: [
      {
        t: 'A finite automaton',
        why: 'That recognises the regular languages, the level below.',
      },
      {
        t: 'A Turing machine',
        why: 'That reaches the top level, type 0.',
      },
      {
        t: 'A pushdown automaton: a finite automaton with a stack',
        correct: true,
        why: 'The stack is what remembers how many brackets are open.',
      },
      {
        t: 'A linear-bounded automaton',
        why: 'That recognises the context-sensitive languages, type 1.',
      },
    ],
  },
];
