// Chapter 89b cards (split from chapter 89). Keys are stable ids.
//
// Grammars are data: { head: [body, ...] }, [] is ε. A table maps
// table[A][token] to the index of the body to use.

export const prompts = {
  'cell-what': {
    q: 'In an LL(1) table, what does the cell for nonterminal `A` and token `a` hold?',
    a: 'Which of `A`’s rules to use when `A` is on top of the stack and `a` is the next token (or nothing, which means a syntax error).',
  },
  'fill-rule': {
    q: 'Which cells does a rule `A → α` go into?',
    a: 'Row `A`, every column in FIRST(α); and, if α is nullable, every column in FOLLOW(A) as well.',
  },
  'll1-what': {
    q: 'What makes a grammar **LL(1)**?',
    a: 'Its table has at most one rule in every cell, so one token of lookahead always decides.',
  },
  'push-reverse': {
    q: 'Why does the table-driven parser push a rule’s body in reverse?',
    a: 'So that the body’s first symbol ends up on top of the stack, to be matched or expanded first.',
  },
  'left-rec-breaks': {
    q: 'Why can a grammar with `expr → expr "+" item | item` never be LL(1)?',
    a: 'Both rules begin with whatever `item` begins with, so both land in the same cells: the next token cannot choose between them.',
  },
  'elim-shape': {
    q: 'What does left-recursion elimination turn `A → A α | β` into?',
    a: '`A → β A′` and `A′ → α A′ | ε`: start with β, then any number of αs.',
  },
  'left-factor': {
    q: 'What is **left factoring**?',
    a: 'Pulling a shared start out of two rules: `A → α β₁ | α β₂` becomes `A → α A′` and `A′ → β₁ | β₂`, so the choice is made after α.',
  },
  'drip-fn': {
    q: 'Why does `fn` at the start of a Drip declaration need a second token to decide?',
    a: '`fn` can start a function declaration (`fn f(...)`) or an expression statement starting with an anonymous function (`fn (...)`); the token after it, a name or `(`, decides.',
  },
};

export const examples = {
  leftRecLoop: {
    title: 'Left recursion, and the loop that replaces it',
    code: `// tokens of 1 + 2 + 3
const ts = ['1', '+', '2', '+', '3'];
let i = 0;

// expr → expr "+" item | item, coded
// directly: expr calls itself first
function exprBad() {
  const left = exprBad();
  return left; // never reached
}
try {
  exprBad();
} catch (e) {
  console.log(e.name, e.message);
}

// expr → item rest,
// rest → "+" item rest | ε, as a loop
function expr() {
  let left = ts[i++];
  while (ts[i] === '+') {
    i++;
    const right = ts[i++];
    left = '(' + left + ' + ' +
      right + ')';
  }
  return left;
}
console.log(expr());`,
  },
};

const DATA = `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item', 'rest']],
  rest: [['+', 'item', 'rest'], []],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const gFirst = { stmt: ['print'], expr: ['NUMBER', '('],
  rest: ['+'], item: ['NUMBER', '('] };
const gFollow = { stmt: ['$'], expr: [';', ')'],
  rest: [';', ')'], item: ['+', ';', ')'] };
const gNul = ['rest'];
const gTable = {
  stmt: { print: 0 },
  expr: { NUMBER: 0, '(': 0 },
  rest: { '+': 0, ';': 1, ')': 1 },
  item: { NUMBER: 0, '(': 1 },
};`;

export const exercises = {
  buildTable: {
    title: 'Build an LL(1) table',
    prompt:
      'Write `buildTable(rules, first, follow, nul)`. `first` and `follow` map each nonterminal to an array of tokens, and `nul` is an array of the nullable nonterminals. Return an object with one row per nonterminal, where `table[A][a]` is the **index** of the body of `A` to use when `a` is next. For each rule `A → body` (number `k`), put `k` in every column of FIRST(body); if the body is nullable, also in every column of FOLLOW(A). If a cell would get two different rules, throw an error: the grammar is not LL(1).',
    starter: `function buildTable(
  rules, first, follow, nul) {
  const table = {};
  for (const A in rules) table[A] = {};
  // your code here
  return table;
}`,
    solution: `function buildTable(
  rules, first, follow, nul) {
  const table = {};
  for (const A in rules) table[A] = {};
  const put = (A, a, k) => {
    const old = table[A][a];
    const clash = old !== undefined
      && old !== k;
    if (clash) {
      throw new Error(A + ', ' + a);
    }
    table[A][a] = k;
  };
  for (const A in rules) {
    rules[A].forEach((body, k) => {
      let vanish = true;
      for (const s of body) {
        const f = s in rules
          ? first[s] : [s];
        for (const a of f) put(A, a, k);
        if (!nul.includes(s)) {
          vanish = false;
          break;
        }
      }
      if (vanish) {
        for (const b of follow[A]) {
          put(A, b, k);
        }
      }
    });
  }
  return table;
}`,
    tests: `${DATA}
test('the adding grammar', () => {
  expect(buildTable(g, gFirst, gFollow, gNul)).toEqual(gTable);
});
test('Drip’s optional else: no conflict', () => {
  const d = {
    s: [['if', 'c', 'b', 'ep'], ['x']],
    ep: [['else', 'b'], []],
    b: [['{', 's', '}']],
  };
  const t = buildTable(d,
    { s: ['if', 'x'], ep: ['else'], b: ['{'] },
    { s: ['$', '}'], ep: ['$', '}'], b: ['$', '}', 'else'] },
    ['ep']);
  expect(t.ep).toEqual({ else: 0, $: 1, '}': 1 });
  expect(t.s).toEqual({ if: 0, x: 1 });
});
test('left recursion: conflict', () => {
  const lr = { E: [['E', '+', 'n'], ['n']] };
  expect(() => buildTable(lr, { E: ['n'] },
    { E: ['$', '+'] }, [])).toThrow();
});
test('C-style dangling else: conflict', () => {
  const c = {
    s: [['if', 'c', 's', 'ep'], ['x']],
    ep: [['else', 's'], []],
  };
  expect(() => buildTable(c, { s: ['if', 'x'], ep: ['else'] },
    { s: ['$', 'else'], ep: ['$', 'else'] }, ['ep'])).toThrow();
});`,
    hints: [
      'Go through every rule with its number: `rules[A].forEach((body, k) => ...)`. Each rule writes `k` into some cells of row `A`.',
      'FIRST of a body: walk its symbols, adding FIRST of each (a terminal is its own FIRST), and stop at the first symbol that is not nullable. If you never stopped, the body can vanish, and FOLLOW(A) gets `k` too.',
      'Write all cells through one small helper `put(A, a, k)` that throws when the cell already holds a different number; then conflicts are caught in one place.',
    ],
    walkthrough: `**How to think about it.** A cell answers one question: "with \`A\` on top and \`a\` next, which rule?" A rule \`A → body\` is the right answer for token \`a\` in two cases. Either the body can *start* with \`a\` (so \`a\` is in FIRST of the body), or the body can vanish and \`a\` is what comes *after* \`A\` (in FOLLOW(A)). So for every rule, work out those tokens and write the rule's number in their cells. If two rules want the same cell, one token cannot decide between them, and the grammar is not LL(1): that is the error.

FIRST of a whole body is the walk from the last chapter: add FIRST of each symbol from the left, and stop at the first one that cannot vanish; if the walk reaches the end without stopping, the body is nullable.

**The solution, line by line.**

- \`const table = {};\` and the \`for...in\` line make an empty row for each nonterminal.
- \`const put = (A, a, k) => { ... }\` writes rule \`k\` into cell \`[A, a]\`. It first reads the old value; \`clash\` is true when there is one and it is a *different* rule, and then it throws, naming the cell. Writing the same rule twice is fine (the body \`item rest\` reaches \`NUMBER\` only once, but a body could reach a token by two routes).
- \`rules[A].forEach((body, k) => {\` visits each rule of \`A\` with its index \`k\`, which is what the table stores.
- \`let vanish = true;\` assumes the body can vanish until a symbol proves otherwise.
- \`for (const s of body) { ... }\` walks the body: \`const f = s in rules ? first[s] : [s];\` is what \`s\` can begin with, \`for (const a of f) put(A, a, k);\` writes the rule into those columns, and \`if (!nul.includes(s)) { vanish = false; break; }\` stops at a symbol that cannot vanish.
- \`if (vanish) { for (const b of follow[A]) put(A, b, k); }\` writes the rule into the FOLLOW columns when the whole body can vanish. For an empty body the walk does nothing at all, so \`vanish\` stays \`true\`, which is how \`rest → ε\` lands in the \`;\` and \`)\` columns.
- \`return table;\`

In the left-recursive test, \`E → E "+" n\` starts with \`E\`, whose FIRST is \`n\`, so rule 0 goes in cell \`[E, n]\`; then \`E → n\` wants the same cell, and \`put\` throws. In the C-style \`if\` test, \`ep → else s\` puts rule 0 in \`[ep, else]\`, and \`ep → ε\` puts rule 1 there too, because \`else\` is in FOLLOW(ep): the dangling else, found by a program. Drip's braces remove it: there, FOLLOW(ep) has no \`else\` in it.

**Common wrong attempts.**

- Using FOLLOW only for empty bodies (\`body.length === 0\`) misses bodies that vanish because every symbol in them is nullable, such as \`opt → rest rest\`.
- Silently overwriting a cell instead of throwing builds a table that quietly picks one rule, hiding exactly the conflicts this exercise is meant to find.
- Putting the FOLLOW columns in for every rule, not only nullable ones, creates conflicts that are not real: \`item → NUMBER\` would land in \`[item, +]\`.`,
    wrong: [
      {
        code: `function buildTable(
  rules, first, follow, nul) {
  const table = {};
  for (const A in rules) table[A] = {};
  for (const A in rules) {
    rules[A].forEach((body, k) => {
      const s = body[0];
      if (s === undefined) {
        for (const b of follow[A]) {
          table[A][b] = k;
        }
        return;
      }
      const f = s in rules
        ? first[s] : [s];
      for (const a of f) {
        table[A][a] = k;
      }
    });
  }
  return table;
}`,
        why: 'It overwrites cells instead of reporting a conflict, so the left-recursive and dangling-else grammars are accepted.',
      },
    ],
  },
  parseLL: {
    optional: true,
    title: 'Run a table-driven parser',
    prompt:
      'Write `parseLL(rules, table, start, tokens)`. Keep a stack as an array whose **end** is the top, starting as `[\'$\', start]`, and add `\'$\'` to the end of the tokens. Repeat until the stack is empty: pop the top; if it is a terminal (or `$`), it must equal the next token, and you move past that token; if it is a nonterminal, look up `table[top][next]` and push that body’s symbols in reverse. Return the list of rules used, as strings like `\'expr → item rest\'` (an empty body is written `\'rest → ε\'`). Throw an error on a mismatch or an empty cell.',
    starter: `function parseLL(
  rules, table, start, tokens) {
  const used = [];
  // your code here
  return used;
}`,
    solution: `function parseLL(
  rules, table, start, tokens) {
  const input = [...tokens, '$'];
  const stack = ['$', start];
  const used = [];
  let i = 0;
  while (stack.length > 0) {
    const top = stack.pop();
    const a = input[i];
    if (!(top in rules)) {
      if (top !== a) {
        throw new Error('want ' + top);
      }
      i++;
      continue;
    }
    const k = table[top][a];
    if (k === undefined) {
      throw new Error('bad ' + a);
    }
    const body = rules[top][k];
    const text = body.join(' ') || 'ε';
    used.push(top + ' → ' + text);
    for (let j = body.length - 1;
         j >= 0; j--) {
      stack.push(body[j]);
    }
  }
  return used;
}`,
    tests: `${DATA}
const P = (s) => parseLL(g, gTable, 'stmt', s.split(' '));
test('print 1 + 2 ;', () => {
  expect(P('print NUMBER + NUMBER ;')).toEqual([
    'stmt → print expr ;',
    'expr → item rest',
    'item → NUMBER',
    'rest → + item rest',
    'item → NUMBER',
    'rest → ε',
  ]);
});
test('brackets', () => {
  expect(P('print ( NUMBER ) ;').length).toBe(7);
});
test('a missing ;', () => {
  expect(() => P('print NUMBER')).toThrow();
});
test('an empty cell', () => {
  expect(() => P('print + NUMBER ;')).toThrow();
});
test('tokens after the end', () => {
  expect(() => P('print NUMBER ; ;')).toThrow();
});`,
    hints: [
      'There are only two cases for the popped symbol: a terminal (match it against the next token) or a nonterminal (expand it from the table).',
      'For a nonterminal, the rule is `rules[top][table[top][a]]`, where `a` is the next token. If the cell is `undefined`, throw.',
      'Push the body from its last symbol to its first, so that the first symbol ends up on the top (the end of the array). Record `top + \' → \' + (body.join(\' \') || \'ε\')`.',
    ],
    walkthrough: `**How to think about it.** The stack holds what the parser still *expects* to see, with the next expectation on top. At the start it expects a whole \`start\`, followed by the end of the input. Each round looks at the top expectation. If it is a token, the input must have that token next: the expectation is met, and both move on. If it is a nonterminal, the table says which rule to expect it to be, and the expectation is replaced by the rule's body. When the stack is empty, every expectation has been met, including the final \`$\`, so all the tokens were used. The step-through diagram is this loop, one round per step.

**The solution, line by line.**

- \`const input = [...tokens, '$'];\` copies the tokens and adds the end marker; \`const stack = ['$', start];\` puts \`start\` on top of \`$\` (the end of the array is the top, because \`push\` and \`pop\` work there).
- \`const used = []; let i = 0;\` hold the rules used and the position of the next token.
- \`while (stack.length > 0) {\` runs until every expectation is met.
- \`const top = stack.pop(); const a = input[i];\` take the top expectation and the next token.
- \`if (!(top in rules)) { ... }\` handles a terminal (\`$\` is one too): if it is not the next token, \`throw\`; otherwise \`i++\` moves past the token, and \`continue\` starts the next round.
- \`const k = table[top][a];\` asks the table which rule; \`undefined\` means no rule of \`top\` can start with \`a\`, a syntax error found at exactly that token.
- \`const body = rules[top][k];\` and the two lines after it record the rule as text, writing \`ε\` when the joined body is the empty string (\`'' || 'ε'\` is \`'ε'\`).
- The \`for\` loop counts \`j\` down from the last symbol and pushes each, so \`body[0]\` is pushed last and sits on top.
- \`return used;\`

For \`print NUMBER + NUMBER ;\` the rules come out in the order of the leftmost derivation from "Derivations, parse trees and ambiguity"; a table-driven LL parser *is* a machine for finding leftmost derivations. With \`print NUMBER ; ;\`, the second \`;\` is still there when the stack's \`$\` is popped, and the mismatch is reported.

**Common wrong attempts.**

- Pushing the body in its own order puts its *last* symbol on top: for \`stmt\` the parser would then expect \`;\` first and fail at once on \`print\`.
- Stopping when the input runs out, rather than when the stack is empty, accepts \`print NUMBER\`, because \`;\` is still expected on the stack.`,
    wrong: [
      {
        code: `function parseLL(
  rules, table, start, tokens) {
  const input = [...tokens, '$'];
  const stack = ['$', start];
  const used = [];
  let i = 0;
  while (stack.length > 0) {
    const top = stack.pop();
    const a = input[i];
    if (!(top in rules)) {
      if (top !== a) throw Error(a);
      i++;
      continue;
    }
    const k = table[top][a];
    const body = rules[top][k];
    used.push(top + ' → ' +
      (body.join(' ') || 'ε'));
    stack.push(...body);
  }
  return used;
}`,
        why: 'It pushes the body in its own order, so the last symbol is on top and `;` is expected before `print`.',
      },
    ],
  },
  removeLeftRec: {
    optional: true,
    title: 'Remove left recursion',
    prompt:
      'Write `removeLeftRec(rules, A)`, returning a **new** grammar in which `A`’s immediate left recursion is gone. Split `A`’s bodies into those that start with `A` (`A α`) and the rest (`β`). With a new nonterminal named `A + "\'"` (so `expr\'`), the new rules are `A → β A\'` for each β, and `A\' → α A\'` for each α, plus `A\' → ε`. Leave every other nonterminal as it is. If `A` has no left-recursive body, return a copy of the grammar unchanged.',
    starter: `function removeLeftRec(rules, A) {
  // your code here
  return rules;
}`,
    solution: `function removeLeftRec(rules, A) {
  const isRec = (b) => b[0] === A;
  const rec = rules[A].filter(isRec);
  if (rec.length === 0) {
    return { ...rules };
  }
  const base = rules[A].filter(
    (b) => !isRec(b));
  const R = A + "'";
  return {
    ...rules,
    [A]: base.map((b) => [...b, R]),
    [R]: [
      ...rec.map((b) =>
        [...b.slice(1), R]),
      [],
    ],
  };
}`,
    tests: `test('the adding grammar', () => {
  const g = { expr: [['expr', '+', 'item'], ['item']],
    item: [['NUMBER']] };
  expect(removeLeftRec(g, 'expr')).toEqual({
    expr: [['item', "expr'"]],
    "expr'": [['+', 'item', "expr'"], []],
    item: [['NUMBER']],
  });
});
test('two operators', () => {
  const g = { t: [['t', '+', 'f'], ['t', '-', 'f'], ['f']] };
  expect(removeLeftRec(g, 't')).toEqual({
    t: [['f', "t'"]],
    "t'": [['+', 'f', "t'"], ['-', 'f', "t'"], []],
  });
});
test('Drip-style calls', () => {
  const g = { call: [['call', '(', ')'],
    ['call', '.', 'IDENT'], ['primary']] };
  expect(removeLeftRec(g, 'call')).toEqual({
    call: [['primary', "call'"]],
    "call'": [['(', ')', "call'"],
      ['.', 'IDENT', "call'"], []],
  });
});
test('no left recursion: unchanged', () => {
  const g = { item: [['NUMBER'], ['(', 'item', ')']] };
  expect(removeLeftRec(g, 'item')).toEqual(g);
});
test('the input is not changed', () => {
  const g = { e: [['e', 'x'], ['y']] };
  removeLeftRec(g, 'e');
  expect(g).toEqual({ e: [['e', 'x'], ['y']] });
});`,
    hints: [
      'Use `filter` twice on `rules[A]`: once for the bodies whose first symbol is `A`, once for the others.',
      'Each non-recursive body β becomes `[...β, R]`; each recursive body `A α` becomes `[...α, R]`, where α is `body.slice(1)`.',
      'Build the answer with a spread, `{ ...rules, [A]: ..., [R]: [...] }`; the square brackets let a key be a computed value. Do not forget the empty body `[]` at the end of `R`’s list.',
    ],
    walkthrough: `**How to think about it.** Read what \`A → A α | β\` allows: any string from it must *start* with a β (the only way out of the recursion), followed by any number of αs, each added by one more use of the recursive rule. So say exactly that, without recursion on the left: \`A\` is a β followed by a "tail", and a tail is an α followed by a tail, or nothing. The recursion has moved to the *right* end of the tail rule, where a top-down parser can handle it, because by the time it recurses it has used up the α's tokens.

**The solution, line by line.**

- \`const isRec = (b) => b[0] === A;\` tests whether a body starts with \`A\`.
- \`const rec = rules[A].filter(isRec);\` keeps the left-recursive bodies; if there are none, \`return { ...rules };\` returns a copy unchanged.
- \`const base = rules[A].filter((b) => !isRec(b));\` keeps the other bodies, the βs.
- \`const R = A + "'";\` names the tail nonterminal, \`expr'\` for \`expr\`.
- \`return { ...rules, ... }\` copies the grammar and then replaces two entries. \`[A]: base.map((b) => [...b, R])\` makes each β into "β then the tail". \`[R]: [...rec.map((b) => [...b.slice(1), R]), []]\` makes each \`A α\` into "α then the tail" (\`slice(1)\` drops the leading \`A\`), and adds \`[]\`, the way out. The square brackets round \`A\` and \`R\` make the keys the *values* of those variables, rather than the letters "A" and "R".

Nothing in \`rules\` is changed: \`filter\`, \`map\`, \`slice\` and the spreads all make new arrays and objects, which the last test checks. On the adding grammar this produces exactly the grammar of the last chapter, with \`expr'\` in place of \`rest\`. On the call rule it produces the shape of Drip's real \`call → primary ( "(" args? ")" | "." IDENT | ... )*\`, the star written as plain rules.

Remember what the rewrite changes: the language is the same, but the parse trees now lean right, because each tail hangs below the one before it. A parser that wants \`1 - 2 - 3\` to mean \`(1 - 2) - 3\` builds its syntax tree as it goes round the tail, as the loop in the runnable example does.

**Common wrong attempts.**

- Forgetting the empty body \`[]\` leaves the tail with no way out, so no finite sentence can be derived.
- Keeping the leading \`A\` (using \`b\` instead of \`b.slice(1)\`) leaves the tail rules starting with \`A\`, which only moves the problem.
- Changing \`rules[A]\` in place (with \`push\` or by assignment) also changes the caller's grammar.`,
    wrong: [
      {
        code: `function removeLeftRec(rules, A) {
  const isRec = (b) => b[0] === A;
  const rec = rules[A].filter(isRec);
  if (rec.length === 0) {
    return { ...rules };
  }
  const base = rules[A].filter(
    (b) => !isRec(b));
  const R = A + "'";
  return {
    ...rules,
    [A]: base.map((b) => [...b, R]),
    [R]: rec.map((b) =>
      [...b.slice(1), R]),
  };
}`,
        why: 'The tail has no empty body, so it can never stop: no sentence can be finished.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the adding grammar’s table, why is `rest → ε` in the column for `)`?',
    options: [
      { t: 'Because `)` is in FIRST(rest)', why: 'FIRST(rest) is only `+`.' },
      { t: 'Because `rest → ε` is nullable and `)` is in FOLLOW(rest)', correct: true, why: 'A body that can vanish goes in the columns of what can follow its head.' },
      { t: 'Because every ε rule goes in every column', why: 'Only the FOLLOW columns; elsewhere the cell stays empty, meaning a syntax error.' },
      { t: 'Because `)` closes an `item`', why: 'True, but the table needs the FOLLOW set to know that `)` can come after `rest`.' },
    ],
  },
  {
    q: 'The parser has `item` on top of its stack and the next token is `+`. The cell `[item, +]` is empty. What happens?',
    options: [
      { t: 'It pops `item` and carries on', why: 'That would skip part of the grammar.' },
      { t: 'It uses the first rule of `item`', why: 'An empty cell means no rule of `item` can start with `+`.' },
      { t: 'It reports a syntax error at the `+`', correct: true, why: 'An empty cell is how the table says “this token cannot come here”.' },
    ],
  },
  {
    q: 'What does left-recursion elimination do to `list → list "," x | x`?',
    options: [
      { t: '`list → x more`, `more → "," x more | ε`', correct: true, why: 'Start with the non-recursive body, then any number of `, x`.' },
      { t: '`list → "," x list | x`', why: 'That describes `, x , x x`: commas in the wrong places.' },
      { t: '`list → x | ε`', why: 'That loses every list longer than one.' },
      { t: 'Nothing: `list` is right-recursive already', why: 'Its recursive rule starts with `list`, which is left recursion.' },
    ],
  },
  {
    q: 'After left factoring, a C-style grammar has `elsePart → "else" stmt | ε`, and `else` is in FOLLOW(elsePart). What does the table show?',
    options: [
      { t: 'Nothing unusual: the grammar is LL(1)', why: 'Two rules want the same cell, so it is not LL(1).' },
      { t: 'The cell `[elsePart, $]` is empty', why: '`$` is in FOLLOW(elsePart), so `elsePart → ε` is there.' },
      { t: 'Left factoring removed the ambiguity', why: 'Left factoring delays a choice; it cannot remove an ambiguity.' },
      { t: 'A conflict in `[elsePart, else]`: the dangling else', correct: true, why: 'Both rules land there; parsers resolve it by preferring `"else" stmt`, the nearest `if`.' },
    ],
  },
  {
    q: 'Which of these is a spot where Drip’s grammar needs more than one token of lookahead?',
    options: [
      { t: 'Every binary operator, because the grammar is left-recursive', why: 'Drip’s grammar uses `*` for repetition, which unfolds into right recursion.' },
      { t: '`fn` can begin both a function declaration and an expression statement, so one token cannot choose', correct: true, why: 'The second token, a name or `(`, decides, so that spot needs two tokens of lookahead.' },
      { t: 'The `else` of an `if`', why: 'With braces required, FOLLOW(elsePart) has no `else` in it, so one token decides.' },
    ],
  },
];
