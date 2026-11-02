// Chapter 93 cards (SLR and lookahead sets). Keys are stable ids.

export const prompts = {
  'lookahead-what': {
    q: 'What is the **lookahead set** of a reduction?',
    a: 'The tokens (including $, the end) on which the parser may perform that reduction; every other cell of the row is left for shifts or errors.',
  },
  'lr0-lookahead': {
    q: 'In LR(0) terms, what is the lookahead set of every reduction?',
    a: 'Every terminal: LR(0) never looks at the next token, so a complete item reduces whatever comes.',
  },
  'token-kept': {
    q: 'When the next token is not in a reduction’s lookahead set, is that token thrown away?',
    a: 'No. It stays next in the input; the parser shifts it if the row has a shift for it, and reports an error otherwise.',
  },
  'slr-what': {
    q: 'What lookahead set does SLR use for a reduction to `A`?',
    a: 'FOLLOW(A): the terminals that can come right after an A anywhere in the grammar.',
  },
  'slr-same-states': {
    q: 'Does an SLR parser have more states than the LR(0) parser for the same grammar?',
    a: 'No. It uses the LR(0) automaton unchanged; only the reduce entries of the table differ.',
  },
  'state9-star': {
    q: 'With `E + T` complete on the stack and `*` next, why does the SLR parser shift?',
    a: '`*` is not in FOLLOW(E) = { + ) $ }, so reducing to E is not allowed there; the only action under * is the shift.',
  },
  'follow-too-big': {
    q: 'Why does SLR report a conflict in state 2 of the `L = R` grammar?',
    a: 'FOLLOW(R) contains `=` (from `* R = ...`), so SLR reduces R → L under `=`, though in that state an R can never be followed by `=`.',
  },
  'not-ambiguous': {
    q: 'Does an SLR conflict prove that a grammar is ambiguous?',
    a: 'No. The `L = R` grammar is unambiguous and needs only one token of lookahead; FOLLOW sets are too coarse for it.',
  },
};

export const examples = {
  'slr-row': {
    title: 'An SLR parser that explains itself',
    code: `// SLR table for the grammar with *
const ROWS = {
  0: 'n s5 ( s4', 1: '+ s6 $ acc',
  2: '+ r2 * s7 ) r2 $ r2',
  3: '+ r4 * r4 ) r4 $ r4',
  4: 'n s5 ( s4',
  5: '+ r6 * r6 ) r6 $ r6',
  6: 'n s5 ( s4', 7: 'n s5 ( s4',
  8: ') s11 + s6',
  9: '+ r1 * s7 ) r1 $ r1',
  10: '+ r3 * r3 ) r3 $ r3',
  11: '+ r5 * r5 ) r5 $ r5',
};
const ACT = {};
for (const q in ROWS) {
  const w = ROWS[q].split(' ');
  ACT[q] = {};
  for (let i = 0; i < w.length; i++) {
    ACT[q][w[i]] = w[++i];
  }
}
const GO = {
  0: { E: 1, T: 2, F: 3 },
  4: { E: 8, T: 2, F: 3 },
  6: { T: 9, F: 3 }, 7: { F: 10 },
};
// rule -> [head, body length]
const R = [['S', 1], ['E', 3], ['E', 1],
  ['T', 3], ['T', 1],
  ['F', 3], ['F', 1]];
function parse(src) {
  const input = src.split(' ');
  input.push('$');
  const st = [0];
  let i = 0;
  while (true) {
    const q = st.at(-1);
    const a = ACT[q][input[i]];
    console.log(q, input[i], '->', a);
    if (!a || a === 'acc') return a;
    const k = Number(a.slice(1));
    if (a[0] === 's') {
      st.push(k);
      i++;
    } else {
      st.length -= R[k][1];
      st.push(GO[st.at(-1)][R[k][0]]);
    }
  }
}
parse('n + n * n');`,
  },
};

const DATA = `// m = { g, items, shifts, follow }
// g: rules [head, body]
// items: this state's items [rule, dot]
// shifts: { token: next state }
// follow: { nonterminal: [tokens] }`;

export const exercises = {
  'slr-actions': {
    title: 'One SLR row',
    prompt:
      'Write `slrRow(m)`, which builds the ACTION row of one state. `m.g` is the grammar (rule 0 is the added start rule), `m.items` the state\'s items as `[rule, dot]`, `m.shifts` an object from each token the state can shift to the state it goes to, and `m.follow` the FOLLOW set of each nonterminal, as an array. Return an object from token to action: `"s7"` for a shift to state 7, `"r2"` for a reduction by rule 2 (only under the tokens in FOLLOW of the rule\'s head), `"acc"` under `"$"` for the finished start rule. If a cell gets two actions, join them with a slash, shift first: `"s6/r5"`, or `"r3/r4"`.',
    starter: `${DATA}
function slrRow(m) {
  return {};
}`,
    solution: `function slrRow(m) {
  const { g, items, shifts } = m;
  const row = {};
  const put = (t, a) => {
    if (row[t]) a = row[t] + '/' + a;
    row[t] = a;
  };
  for (const t of Object.keys(shifts)) {
    put(t, 's' + shifts[t]);
  }
  for (const [r, d] of items) {
    const [head, body] = g[r];
    if (d < body.length) continue;
    if (r === 0) {
      put('$', 'acc');
      continue;
    }
    for (const t of m.follow[head]) {
      put(t, 'r' + r);
    }
  }
  return row;
}`,
    tests: `const expr = [['S',['E']],['E',['E','+','T']],['E',['T']],['T',['T','*','F']],['T',['F']],['F',['(','E',')']],['F',['n']]];
const fe = { S: ['$'], E: ['+', ')', '$'], T: ['+', '*', ')', '$'], F: ['+', '*', ')', '$'] };
test('state 2: shift on *, reduce on FOLLOW(E)', () => {
  expect(slrRow({ g: expr, items: [[2,1],[3,1]], shifts: { '*': 7 }, follow: fe }))
    .toEqual({ '*': 's7', '+': 'r2', ')': 'r2', '$': 'r2' });
});
test('state 9: E + T is reduced only on + ) $', () => {
  expect(slrRow({ g: expr, items: [[1,3],[3,1]], shifts: { '*': 7 }, follow: fe }))
    .toEqual({ '*': 's7', '+': 'r1', ')': 'r1', '$': 'r1' });
});
test('the start rule accepts under $ only', () => {
  expect(slrRow({ g: expr, items: [[0,1],[1,1]], shifts: { '+': 6 }, follow: fe }))
    .toEqual({ '+': 's6', '$': 'acc' });
});
test('a state with only shifts', () => {
  expect(slrRow({ g: expr, items: [[5,2],[1,1]], shifts: { ')': 11, '+': 6 }, follow: fe }))
    .toEqual({ ')': 's11', '+': 's6' });
});
const lr = [['S',['P']],['P',['L','=','R']],['P',['R']],['L',['*','R']],['L',['id']],['R',['L']]];
const fl = { S: ['$'], P: ['$'], L: ['=', '$'], R: ['$', '='] };
test('the L = R grammar: a conflict under =', () => {
  expect(slrRow({ g: lr, items: [[1,1],[5,1]], shifts: { '=': 6 }, follow: fl }))
    .toEqual({ '=': 's6/r5', '$': 'r5' });
});
const xg = [['S',['X']],['X',['A']],['X',['B']],['A',['x']],['B',['x']]];
test('two reductions in one cell', () => {
  expect(slrRow({ g: xg, items: [[3,1],[4,1]], shifts: {}, follow: { A: ['$'], B: ['$'] } }))
    .toEqual({ '$': 'r3/r4' });
});`,
    hints: [
      'Two sources fill the row: the shifts (straight from `m.shifts`) and the complete items (dot at the end of the body). Do the shifts first, so a conflict comes out as `"s6/r5"`, shift first.',
      'For a complete item `[r, d]` with `d === g[r][1].length`: if `r` is 0, put `"acc"` under `"$"`; otherwise put `"r" + r` under each token in `follow[g[r][0]]`.',
      'Write one small helper, `put(t, a)`, that stores `a` in `row[t]`, or, if the cell already has something, stores the old value, a slash and `a`. Then every place that fills a cell uses `put`, and conflicts appear on their own.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's Formal box turned into code: shifts as in LR(0), accept as in LR(0), and reductions only under FOLLOW of the rule's head. The one design decision is what to do when a cell is already filled; the exercise asks you to keep both actions, joined by a slash, so a conflict is visible in the answer instead of one action silently overwriting the other.

**The solution, line by line.**

- \`function slrRow(m) {\` takes one object, as in the last chapter's exercise.
- \`  const { g, items, shifts } = m;\` unpacks three of its parts; the fourth, \`m.follow\`, is used once, below.
- \`  const row = {};\` is the row being built, token to action.
- \`  const put = (t, a) => {\` is the helper every cell goes through.
- \`    if (row[t]) a = row[t] + '/' + a;\` handles a crowded cell: if something is already there, the new value becomes "old/new". An empty cell is \`undefined\`, which is falsy, so this line does nothing the first time.
- \`    row[t] = a;\` stores the action (or the joined actions).
- \`  for (const t of Object.keys(shifts)) {\` / \`put(t, 's' + shifts[t]);\` adds the shifts first, so in a conflict the shift is written first, as asked: \`{ '*': 7 }\` becomes \`'*': 's7'\`.
- \`  for (const [r, d] of items) {\` looks at each item.
- \`    const [head, body] = g[r];\` fetches its rule.
- \`    if (d < body.length) continue;\` skips items whose dot is not at the end.
- \`    if (r === 0) {\` / \`put('$', 'acc');\` / \`continue;\` is the finished start rule: accept, only at the end of the input.
- \`    for (const t of m.follow[head]) {\` / \`put(t, 'r' + r);\` is the one new idea of SLR: the reduction goes only under the tokens that can follow the head.
- \`  return row;\` returns the finished row.

In state 2 of the \`L = R\` grammar the shift adds \`'=': 's6'\`, then the complete item \`R → L ·\` (rule 5) puts \`'r5'\` under each token of FOLLOW(R), \`$\` and \`=\`; the \`=\` cell is already taken, so it becomes \`'s6/r5'\`, which is the conflict in the chapter's figure.

**Common wrong attempts.**

- Writing \`row[t] = a\` directly overwrites the shift with the reduction, so the conflict in the \`L = R\` grammar silently disappears (and the parser built from that row would reduce where it should shift).
- Putting the reductions under every token that appears in the row, or under \`$\` only, is LR(0) or less than SLR: state 2 of the expression grammar needs \`r2\` under \`+\` and \`)\` as well as \`$\`.`,
    wrong: [
      {
        code: `function slrRow(m) {
  const { g, items, shifts } = m;
  const row = {};
  for (const t of Object.keys(shifts)) {
    row[t] = 's' + shifts[t];
  }
  for (const [r, d] of items) {
    const [head, body] = g[r];
    if (d < body.length) continue;
    if (r === 0) {
      row.$ = 'acc';
      continue;
    }
    for (const t of m.follow[head]) {
      row[t] = 'r' + r;
    }
  }
  return row;
}`,
        why: 'Each cell keeps only the last action written, so conflicts vanish: state 2 of the `L = R` grammar gives `"r5"` under `=`, hiding the shift.',
      },
      {
        code: `function slrRow(m) {
  const { g, items, shifts } = m;
  const row = {};
  for (const t of Object.keys(shifts)) {
    row[t] = 's' + shifts[t];
  }
  for (const [r, d] of items) {
    if (d < g[r][1].length) continue;
    row.$ = r === 0 ? 'acc' : 'r' + r;
  }
  return row;
}`,
        why: 'Reductions go under `$` only, not under FOLLOW of the head, so state 2 of the expression grammar has no `r2` under `+` or `)`, and `n + n` would be a syntax error.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'For the grammar with `*`, FOLLOW(E) is `{ + ) $ }`. In SLR, where does the reduction `E → T` go in state 2?',
    options: [
      { t: 'Under every terminal', why: 'That is the LR(0) table, which clashes with the shift on `*`.' },
      { t: 'Under `+`, `)` and `$`', correct: true, why: 'SLR uses FOLLOW(E) as the lookahead set, so `*` is left for the shift.' },
      { t: 'Under `*` only', why: 'Under `*` the T is the start of a product, so the parser must shift.' },
    ],
  },
  {
    q: 'Compared with the LR(0) automaton of a grammar, how many states does its SLR parser have?',
    options: [
      { t: 'Twice as many', why: 'SLR adds no states; that is closer to what LR(1) does.' },
      { t: 'Fewer, because conflicts are removed', why: 'No states are removed either; only reduce entries move.' },
      { t: 'Exactly the same', correct: true, why: 'SLR uses the LR(0) automaton unchanged and only changes which cells get reductions.' },
    ],
  },
  {
    q: 'The stack is `E + T`, state 9, and the next token is `$`. What does the SLR parser do?',
    options: [
      { t: 'Reduce by `E → E + T`', correct: true, why: '`$` is in FOLLOW(E), and state 9 has no shift on `$`.' },
      { t: 'Shift the `$`', why: 'Nothing shifts the end marker; it is only ever looked at.' },
      { t: 'Report a conflict', why: 'The only conflict state 9 had was under `*`, and SLR resolved it.' },
    ],
  },
  {
    q: 'Why is `=` in FOLLOW(R) for the grammar `P → L = R | R`, `L → * R | id`, `R → L`?',
    options: [
      { t: 'Because `R → L` and FOLLOW(R) always equals FOLLOW(L)', why: 'R → L puts FOLLOW(R) into FOLLOW(L), not the other way round.' },
      { t: 'Because `L → * R` puts everything that follows L after that R, and `=` follows L in `L = R`', correct: true, why: 'In `* R = ...` the R is followed by `=`, so `=` is in FOLLOW(R).' },
      { t: 'Because every nonterminal has `=` in its FOLLOW set', why: '`=` appears only after L in this grammar, and spreads only where the rules carry it.' },
    ],
  },
  {
    q: 'The `L = R` grammar has an SLR conflict. What does that tell you?',
    options: [
      { t: 'The grammar is ambiguous', why: 'It is not: every statement has one tree. The conflict comes from FOLLOW being too coarse.' },
      { t: 'The grammar needs two tokens of lookahead', why: 'One token is enough if the parser asks what can follow R in this particular state.' },
      { t: 'The grammar is not SLR(1), though a more precise use of one token might parse it', correct: true, why: 'SLR uses one FOLLOW set for every state; LR(1), next chapter, tracks what can follow in each state.' },
    ],
  },
];
