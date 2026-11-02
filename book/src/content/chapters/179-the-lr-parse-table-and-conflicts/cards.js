// Chapter 260 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'action-goto': {
    q: 'What is the difference between the ACTION and the GOTO part of an LR table?',
    a: 'ACTION has a column per terminal (and $) and says shift, reduce, accept or error; GOTO has a column per nonterminal and says which state to push after a reduction.',
  },
  'reduce-every-column': {
    q: 'Why does an LR(0) table put a reduction in **every** column of its row?',
    a: 'An LR(0) item never looks at the next token, so a complete item means "reduce" whatever comes next.',
  },
  'pop-length': {
    q: 'When the parser reduces by `E → E + T`, how many states does it pop, and why?',
    a: 'Three: one state was pushed for each symbol of the body, so popping three removes exactly E, + and T.',
  },
  'reduce-no-token': {
    q: 'Does a reduce move the parser on to the next input token?',
    a: 'No. Only a shift reads a token; after a reduce, the same token is looked up again in the new state.',
  },
  'sr-cause': {
    q: 'Which two kinds of item in one state cause a shift/reduce conflict?',
    a: 'A complete item (A → α ·) and an item with a terminal right after its dot (B → β · a γ).',
  },
  'rr-cause': {
    q: 'What causes a reduce/reduce conflict?',
    a: 'Two different complete items in the same state: the parser knows it must reduce, but not by which rule.',
  },
  'ambiguous-conflict': {
    q: 'Why can no amount of lookahead fix the conflict in `E → E + E | n`?',
    a: 'The grammar is ambiguous: `n + n + n` really has two parse trees, so both the shift and the reduce lead to a correct parse.',
  },
  'lr0-grammar': {
    q: 'When is a grammar called LR(0)?',
    a: 'When its LR(0) table has no conflicts: every cell holds at most one action.',
  },
};

export const examples = {
  'lr-driver': {
    title: 'A table-driven LR parser',
    code: `// rule number -> [head, body length]
const R = [
  ['S', 1], ['E', 3], ['E', 1],
  ['T', 1], ['T', 3],
];
const ACT = {
  0: { n: 's3', '(': 's4' },
  1: { '+': 's5', $: 'acc' },
  4: { n: 's3', '(': 's4' },
  5: { n: 's3', '(': 's4' },
  6: { '+': 's5', ')': 's8' },
};
// rows that reduce in every column
const RED = [
  [2, 2], [3, 3], [7, 1], [8, 4],
];
for (const [q, r] of RED) {
  ACT[q] = {};
  for (const t of 'n+()$') {
    ACT[q][t] = 'r' + r;
  }
}
const GO = {
  0: { E: 1, T: 2 },
  4: { E: 6, T: 2 },
  5: { T: 7 },
};
function parse(tokens) {
  const st = [0];
  const input = [...tokens, '$'];
  let i = 0;
  while (true) {
    const a = ACT[st.at(-1)][input[i]];
    if (!a) {
      return 'error at ' + input[i];
    }
    if (a === 'acc') return 'accepted';
    const k = Number(a.slice(1));
    if (a[0] === 's') {
      st.push(k);
      i++;
    } else {
      const [head, len] = R[k];
      st.length -= len;
      st.push(GO[st.at(-1)][head]);
      console.log('reduce by rule', k);
    }
  }
}
console.log(parse(['n', '+', 'n']));
console.log(parse(['(', 'n', ')']));
console.log(parse(['n', '+']));`,
  },
};

export const exercises = {
  'find-conflicts': {
    title: 'Find every conflict',
    prompt: 'Write `conflicts(m)`. Its argument holds a grammar `g` (rule `r` is `[head, body]`, and rule 0 is the added start rule), the LR(0) automaton as `states` (state `i` is an array of items `[rule, dot]`) and `edges` (`[from, symbol, to]`), and `terms`, the terminals including `$`. Fill in each state\'s ACTION row the LR(0) way (a shift for each edge on a terminal; for a complete item, accept under `$` if it is rule 0, otherwise a reduce under every terminal), and return one string per cell that ends up with two or more actions, written like `"2 *: shift/reduce"` or `"4 $: reduce/reduce"`. The order of the strings does not matter.',
    starter: `// m = { g, states, edges, terms }
// g: rules [head, body]
// states: arrays of items [rule, dot]
// edges: [from, symbol, to]
// terms: terminals, including '$'
function conflicts(m) {
  return [];
}`,
    solution: `function conflicts(m) {
  const { g, states, edges } = m;
  const heads = new Set(
    g.map(([h]) => h));
  const found = [];
  states.forEach((items, i) => {
    const acts = {};
    const add = (t, a) => {
      acts[t] = acts[t] ?? new Set();
      acts[t].add(a);
    };
    for (const [from, x] of edges) {
      if (from === i && !heads.has(x)) {
        add(x, 'shift');
      }
    }
    for (const [r, d] of items) {
      if (d < g[r][1].length) continue;
      if (r === 0) {
        add('$', 'accept');
        continue;
      }
      for (const t of m.terms) {
        add(t, 'reduce ' + r);
      }
    }
    for (const t of Object.keys(acts)) {
      const a = [...acts[t]];
      if (a.length < 2) continue;
      const kind = a.includes('shift')
        ? 'shift/reduce'
        : 'reduce/reduce';
      found.push(\`\${i} \${t}: \${kind}\`);
    }
  });
  return found;
}`,
    tests: `const sorted = (xs) => [...xs].sort();
const small = {
  g: [['S',['E']],['E',['E','+','T']],['E',['T']],['T',['n']],['T',['(','E',')']]],
  states: [[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,1],[1,1]],[[2,1]],[[3,1]],[[4,1],[1,0],[2,0],[3,0],[4,0]],[[1,2],[3,0],[4,0]],[[4,2],[1,1]],[[1,3]],[[4,3]]],
  edges: [[0,'E',1],[0,'T',2],[0,'n',3],[0,'(',4],[1,'+',5],[4,'E',6],[4,'T',2],[4,'n',3],[4,'(',4],[5,'T',7],[5,'n',3],[5,'(',4],[6,')',8],[6,'+',5]],
  terms: ['n', '+', '(', ')', '$'],
};
const list = {
  g: [['S',['E']],['E',['T','+','E']],['E',['T']],['T',['n']]],
  states: [[[0,0],[1,0],[2,0],[3,0]],[[0,1]],[[1,1],[2,1]],[[3,1]],[[1,2],[1,0],[2,0],[3,0]],[[1,3]]],
  edges: [[0,'E',1],[0,'T',2],[0,'n',3],[2,'+',4],[4,'E',5],[4,'T',2],[4,'n',3]],
  terms: ['n', '+', '$'],
};
const xg = {
  g: [['S',['X']],['X',['A']],['X',['B']],['A',['x']],['B',['x']]],
  states: [[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,1]],[[1,1]],[[2,1]],[[3,1],[4,1]]],
  edges: [[0,'X',1],[0,'A',2],[0,'B',3],[0,'x',4]],
  terms: ['x', '$'],
};
const expr = {
  g: [['S',['E']],['E',['E','+','T']],['E',['T']],['T',['T','*','F']],['T',['F']],['F',['(','E',')']],['F',['n']]],
  states: [[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]],[[0,1],[1,1]],[[2,1],[3,1]],[[4,1]],[[5,1],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]],[[6,1]],[[1,2],[3,0],[4,0],[5,0],[6,0]],[[3,2],[5,0],[6,0]],[[5,2],[1,1]],[[1,3],[3,1]],[[3,3]],[[5,3]]],
  edges: [[0,'E',1],[0,'T',2],[0,'F',3],[0,'(',4],[0,'n',5],[1,'+',6],[2,'*',7],[4,'E',8],[4,'T',2],[4,'F',3],[4,'(',4],[4,'n',5],[6,'T',9],[6,'F',3],[6,'(',4],[6,'n',5],[7,'F',10],[7,'(',4],[7,'n',5],[8,')',11],[8,'+',6],[9,'*',7]],
  terms: ['n', '+', '*', '(', ')', '$'],
};
test('the chapter grammar has no conflicts', () => {
  expect(conflicts(small)).toEqual([]);
});
test('E → T + E | T: shift/reduce on +', () => {
  expect(conflicts(list)).toEqual(['2 +: shift/reduce']);
});
test('two complete items: reduce/reduce everywhere', () => {
  expect(sorted(conflicts(xg))).toEqual(['4 $: reduce/reduce', '4 x: reduce/reduce']);
});
test('adding * gives two shift/reduce conflicts', () => {
  expect(sorted(conflicts(expr))).toEqual(['2 *: shift/reduce', '9 *: shift/reduce']);
});
test('accept is not a conflict with shift', () => {
  expect(conflicts(small).some((c) => c.startsWith('1 '))).toBe(false);
});`,
    hints: [
      'Do one state at a time. For each, build an object from terminal to the set of actions that cell would get, then report the cells whose set has two or more members.',
      'The shifts come from `edges`: an edge `[from, x, to]` with `from === i` and `x` a terminal (not the head of any rule) puts a shift under `x`. The reductions come from the items whose dot is at the end, `d === g[r][1].length`.',
      'A complete item of rule 0 adds only `accept` under `$`; any other complete item adds `"reduce " + r` under every terminal in `m.terms`. Use a `Set` per cell so the same action added twice counts once, and call the conflict `shift/reduce` if the set holds a shift, `reduce/reduce` otherwise.',
    ],
    walkthrough: `**How to think about it.** A conflict is a cell with two actions, so the plan is to fill in each state's ACTION row as a collection of *possible* actions per cell, instead of a single action, and then look for crowded cells. The chapter's Formal box gives the rules for filling it in: shifts from the edges on terminals, reductions from complete items in every column, and accept for the start rule under \`$\`. Nothing needs the GOTO half: nonterminal columns never conflict, because each state has at most one edge per symbol.

**The solution, line by line.**

- \`function conflicts(m) {\` takes one object, so the call stays short.
- \`  const { g, states, edges } = m;\` unpacks the parts we use often; \`m.terms\` is used once, below.
- \`  const heads = new Set(\` / \`    g.map(([h]) => h));\` collects the nonterminals (every rule head). An edge symbol that is not a head is a terminal.
- \`  const found = [];\` will hold the answers.
- \`  states.forEach((items, i) => {\` visits each state with its number \`i\`.
- \`    const acts = {};\` maps a terminal to the set of actions for that cell of row \`i\`.
- \`    const add = (t, a) => {\` / \`acts[t] = acts[t] ?? new Set();\` / \`acts[t].add(a);\` makes the set on first use and adds an action; a \`Set\` ignores repeats, so adding the same action twice is harmless.
- \`    for (const [from, x] of edges) {\` / \`if (from === i && !heads.has(x)) {\` / \`add(x, 'shift');\` puts a shift in every column where this state has an arrow on a terminal. (The target state is not needed to detect a conflict, so the plain word \`'shift'\` will do.)
- \`    for (const [r, d] of items) {\` looks at every item of the state.
- \`      if (d < g[r][1].length) continue;\` skips items that are not complete.
- \`      if (r === 0) {\` / \`add('$', 'accept');\` / \`continue;\` treats the finished start rule specially: it accepts at the end of the input only.
- \`      for (const t of m.terms) {\` / \`add(t, 'reduce ' + r);\` is the LR(0) rule: reduce under every terminal. Writing the rule number into the action means two different complete items give two different actions.
- \`    for (const t of Object.keys(acts)) {\` checks each filled cell.
- \`      const a = [...acts[t]];\` turns the set into an array, and \`if (a.length < 2) continue;\` skips cells with one action.
- \`      const kind = a.includes('shift') ? 'shift/reduce' : 'reduce/reduce';\` names the conflict: with a shift present it is shift/reduce; otherwise two reduces collided.
- \`      found.push(\\\`\${i} \${t}: \${kind}\\\`);\` records it as, for example, \`2 *: shift/reduce\`.
- \`  return found;\` returns every conflict.

On the \`E → T + E | T\` grammar, state 2 holds \`E → T · + E\` and \`E → T ·\`: the edge on \`+\` adds a shift under \`+\`, the complete item adds \`reduce 2\` under \`n\`, \`+\` and \`$\`, so only the \`+\` cell has two actions.

**Common wrong attempts.**

- Putting reductions only under \`$\` (or under nothing) hides every shift/reduce conflict: that is not LR(0) any more, and the tests on \`list\` and \`expr\` fail.
- Treating the start rule like any other rule puts \`reduce 0\` beside the shift on \`+\` in state 1, which reports a conflict that does not exist: the parser accepts only when the input has run out.
- Calling every crowded cell \`shift/reduce\` gets the \`x\` grammar wrong, where both actions are reductions.`,
    wrong: [
      {
        code: `function conflicts(m) {
  const { g, states, edges } = m;
  const heads = new Set(
    g.map(([h]) => h));
  const found = [];
  states.forEach((items, i) => {
    const acts = {};
    const add = (t, a) => {
      acts[t] = acts[t] ?? new Set();
      acts[t].add(a);
    };
    for (const [from, x] of edges) {
      if (from === i && !heads.has(x)) {
        add(x, 'shift');
      }
    }
    for (const [r, d] of items) {
      if (d < g[r][1].length) continue;
      for (const t of m.terms) {
        add(t, 'reduce ' + r);
      }
    }
    for (const t of Object.keys(acts)) {
      const a = [...acts[t]];
      if (a.length < 2) continue;
      const kind = a.includes('shift')
        ? 'shift/reduce'
        : 'reduce/reduce';
      found.push(\`\${i} \${t}: \${kind}\`);
    }
  });
  return found;
}`,
        why: 'The finished start rule is treated as an ordinary reduce, so state 1 (`S → E ·` beside `E → E · + T`) shows a false shift/reduce conflict on `+`.',
      },
      {
        code: `function conflicts(m) {
  const { g, states, edges } = m;
  const heads = new Set(
    g.map(([h]) => h));
  const found = [];
  states.forEach((items, i) => {
    const acts = {};
    const add = (t, a) => {
      acts[t] = acts[t] ?? new Set();
      acts[t].add(a);
    };
    for (const [from, x] of edges) {
      if (from === i && !heads.has(x)) {
        add(x, 'shift');
      }
    }
    for (const [r, d] of items) {
      if (d < g[r][1].length) continue;
      add('$', r ? 'r' + r : 'accept');
    }
    for (const t of Object.keys(acts)) {
      if (acts[t].size > 1) {
        found.push(i + ' ' + t);
      }
    }
  });
  return found;
}`,
        why: 'Reductions only under `$` is not the LR(0) rule, so the shift/reduce conflicts under `+` and `*` are never seen; and the kind of conflict is not named (the strings are not even in the right form).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In an LR(0) automaton, state 0 has an arrow labelled with the terminal `n` to state 3. What does that put in the parse table?',
    options: [
      {
        t: 'GOTO[0, n] = 3',
        why: 'GOTO columns are for nonterminals; `n` is a terminal.',
      },
      {
        t: 'ACTION[0, n] = reduce by rule 3',
        why: 'The reduction by T → n happens later, in state 3, not in state 0.',
      },
      {
        t: 'ACTION[0, n] = shift 3',
        correct: true,
        why: 'An arrow on a terminal is a shift: read the n and push state 3.',
      },
    ],
  },
  {
    q: 'An LR parser’s stack of states is `0 1 5 7`, and it reduces by `E → E + T`. What happens next?',
    options: [
      {
        t: 'Pop three states, leaving `0`, then push GOTO[0, E]',
        correct: true,
        why: 'The body has three symbols, so three states go, and GOTO from the uncovered state on the head says where to go.',
      },
      {
        t: 'Pop one state, leaving `0 1 5`, then push 7 again',
        why: 'A reduce pops as many states as the body has symbols: three here.',
      },
      {
        t: 'Read the next token, then pop three states',
        why: 'A reduce never reads a token; the same lookahead is used again afterwards.',
      },
    ],
  },
  {
    q: 'A state holds `E → T ·` and `T → T · * F`. What is wrong with its LR(0) row?',
    options: [
      {
        t: 'Nothing: the two items never compete',
        why: 'Under `*` the complete item says reduce and the other says shift.',
      },
      {
        t: 'A reduce/reduce conflict',
        why: 'Only one item is complete; the other wants to shift.',
      },
      {
        t: 'A shift/reduce conflict under `*`',
        correct: true,
        why: 'LR(0) puts the reduce under every column, and the dot before `*` puts a shift there too.',
      },
    ],
  },
  {
    q: 'Which state causes a reduce/reduce conflict?',
    options: [
      {
        t: '`A → x ·` and `B → x ·`',
        correct: true,
        why: 'Two complete items: the parser must reduce, but cannot tell by which rule.',
      },
      {
        t: '`A → x ·` and `A → x · y`',
        why: 'That is a shift/reduce conflict: one item is complete and the other wants the terminal y.',
      },
      {
        t: '`A → · x` and `B → · x`',
        why: 'Neither item is complete; both shift the same x, which is one action, not two.',
      },
    ],
  },
  {
    q: 'The grammar `E → E + E | n` has a shift/reduce conflict. What does it tell you?',
    options: [
      {
        t: 'The table was built wrongly',
        why: 'The construction is right; the conflict is real.',
      },
      {
        t: 'The grammar is ambiguous: `n + n + n` has two parse trees',
        correct: true,
        why: 'Reducing groups the left sum first and shifting groups the right one; the grammar allows both.',
      },
      {
        t: 'One more token of lookahead will remove it',
        why: 'Both choices lead to complete parses, so no lookahead can tell them apart.',
      },
    ],
  },
];
