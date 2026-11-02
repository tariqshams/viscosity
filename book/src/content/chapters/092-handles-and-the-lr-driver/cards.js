// Chapter 91b cards (split from chapter 91). Keys are stable ids.
//
// prods is a numbered list of [head, body]; prods[0] is the extra start
// rule S' → E. action[state][token] is 's4' (shift, go to state 4),
// 'r2' (reduce by rule 2) or 'acc'; gotos[state][nonterminal] is a state.

export const prompts = {
  'handle-what': {
    q: 'What is a **handle**?',
    a: 'The rule body (and its place) whose reduction is exactly one step back along the rightmost derivation.',
  },
  'handle-top': {
    q: 'In a shift-reduce parse, where is the handle always found?',
    a: 'At the top of the stack; so the only questions are whether the top is a handle yet, and of which rule.',
  },
  'match-not-handle': {
    q: 'With `E + T` on the stack and `*` next, why is `E + T` not a handle?',
    a: 'The `T` is not finished: `*` binds tighter, so `T * F` must be built and reduced first.',
  },
  'lr-state': {
    q: 'What does the state on top of an LR parser’s stack stand for?',
    a: 'A summary of everything on the stack below it: enough to decide, with the next token, whether to shift or which rule to reduce.',
  },
  'action-goto': {
    q: 'What are the two parts of an LR table for?',
    a: 'ACTION[state, token] says shift, reduce or accept; GOTO[state, nonterminal] says which state to push after a reduction.',
  },
  'reduce-steps': {
    q: 'An LR parser reduces by a rule with a 3-symbol body. What does it do to its stack of states?',
    a: 'Pops 3 states, then pushes GOTO[the state now on top, the rule’s head].',
  },
  'table-precedence': {
    q: 'Where, in an LR parser, does “`*` binds tighter than `+`” live?',
    a: 'In the table: in the state with `E + T` on the stack, `*` means shift while `+` and `$` mean reduce.',
  },
  'regular-prefixes': {
    q: 'Why can a finite set of states track a stack that can grow without limit?',
    a: 'The stack contents that can occur in a parse form a regular language, so a finite automaton can follow them.',
  },
};

export const examples = {
  greedy: {
    title: 'Reducing greedily goes wrong',
    code: `const prods = [
  ['E', ['E', '+', 'T']], ['E', ['T']],
  ['T', ['T', '*', 'F']], ['T', ['F']],
  ['F', ['n']],
];

// Reduce whenever a body is on top
// (the longest one), else shift.
function greedy(tokens) {
  const stack = [];
  const input = [...tokens];
  for (;;) {
    let best = null;
    for (const [h, b] of prods) {
      const t = stack.slice(-b.length);
      const same =
        t.join(' ') === b.join(' ');
      const longer = !best ||
        b.length > best[1].length;
      if (same && longer) best = [h, b];
    }
    if (best) {
      stack.length -= best[1].length;
      stack.push(best[0]);
    } else if (input.length) {
      stack.push(input.shift());
    } else {
      break;
    }
    console.log(stack.join(' '));
  }
  console.log(stack.join(' ') === 'E'
    ? 'accepted' : 'stuck');
}

greedy(['n', '+', 'n', '*', 'n']);`,
  },
};

const TABLE = `const prods = [
  ["S'", ['E']], ['E', ['E', '+', 'T']], ['E', ['T']],
  ['T', ['T', '*', 'F']], ['T', ['F']], ['F', ['n']],
];
const action = {
  0: { n: 's4' },
  1: { '+': 's5', $: 'acc' },
  2: { '+': 'r2', '*': 's6', $: 'r2' },
  3: { '+': 'r4', '*': 'r4', $: 'r4' },
  4: { '+': 'r5', '*': 'r5', $: 'r5' },
  5: { n: 's4' },
  6: { n: 's4' },
  7: { '+': 'r1', '*': 's6', $: 'r1' },
  8: { '+': 'r3', '*': 'r3', $: 'r3' },
};
const gotos = {
  0: { E: 1, T: 2, F: 3 }, 5: { T: 7, F: 3 }, 6: { F: 8 },
};
const sp = (s) => s.split(' ');`;

export const exercises = {
  lrParse: {
    title: 'Run an LR parser from its table',
    prompt:
      'Write `lrParse(prods, action, gotos, tokens)`, the driver of an LR parser. Keep a stack of **states**, starting as `[0]`, and add `\'$\'` to the end of the tokens. Repeat: look up `action[top][next]`. For `\'sK\'`, push state `K` and move past the token. For `\'rK\'`, take rule `prods[K] = [head, body]`, pop `body.length` states, then push `gotos[newTop][head]`, and record `K`. For `\'acc\'`, return the list of rule numbers reduced, in order. An empty cell is a syntax error: throw.',
    starter: `function lrParse(
  prods, action, gotos, tokens) {
  const input = [...tokens, '$'];
  const states = [0];
  const reduced = [];
  // your code here
  return reduced;
}`,
    solution: `function lrParse(
  prods, action, gotos, tokens) {
  const input = [...tokens, '$'];
  const states = [0];
  const reduced = [];
  let i = 0;
  for (;;) {
    const top = states.at(-1);
    const act = action[top][input[i]];
    if (act === undefined) {
      throw new Error('at ' + input[i]);
    }
    if (act === 'acc') return reduced;
    const k = Number(act.slice(1));
    if (act[0] === 's') {
      states.push(k);
      i++;
    } else {
      const [head, body] = prods[k];
      states.length -= body.length;
      const back = states.at(-1);
      states.push(gotos[back][head]);
      reduced.push(k);
    }
  }
}`,
    tests: `${TABLE}
const run = (s) => lrParse(prods, action, gotos, sp(s));
test('one number', () => {
  expect(run('n')).toEqual([5, 4, 2]);
});
test('n + n * n: * first', () => {
  expect(run('n + n * n')).toEqual([5, 4, 2, 5, 4, 5, 3, 1]);
});
test('n * n + n', () => {
  expect(run('n * n + n')).toEqual([5, 4, 5, 3, 2, 5, 4, 1]);
});
test('a missing operand', () => {
  expect(() => run('n +')).toThrow();
});
test('two numbers in a row', () => {
  expect(() => run('n n')).toThrow();
});`,
    hints: [
      'The loop never needs the grammar symbols themselves, only the states: the state on top and the next token pick the action.',
      'A shift is `states.push(k)` and moving to the next token. A reduce pops `body.length` states (`states.length -= body.length` does it), then reads the state now on top.',
      'After popping, push `gotos[back][head]`, where `back` is the new top. Record `k` in `reduced`. Loop with `for (;;)` and return on `acc`.',
    ],
    walkthrough: `**How to think about it.** In the step-through, each round read the state on top of the stack and the next token, looked up one cell, and did what it said. That is the entire driver; the cleverness is all in the table. A shift pushes a new state and moves past the token. A reduce pops one state for each symbol of the rule's body (each symbol on the stack has a state above it, so popping the states pops the body), and then the table's GOTO part says which state stands for "and now a \`head\` is here", pushed on top of whatever state is left. You don't need to keep the symbols at all.

**The solution, line by line.**

- \`const input = [...tokens, '$']; const states = [0]; const reduced = [];\` set up the input with its end marker, the stack with the start state, and the answer.
- \`let i = 0;\` is the position of the next token, and \`for (;;) {\` loops until a \`return\` or a \`throw\` ends it.
- \`const top = states.at(-1);\` is the state on top (\`at(-1)\` reads the last item of an array), and \`const act = action[top][input[i]];\` is the table's instruction for it and the next token.
- \`if (act === undefined) throw ...\` handles an empty cell: no parse can continue with this token, a syntax error found at exactly that token.
- \`if (act === 'acc') return reduced;\` finishes.
- \`const k = Number(act.slice(1));\` reads the number after the letter: the state to go to for a shift, the rule for a reduce.
- For a shift, \`states.push(k); i++;\`.
- For a reduce, \`const [head, body] = prods[k];\` finds the rule; \`states.length -= body.length;\` pops one state per body symbol; \`const back = states.at(-1);\` is the state uncovered underneath; \`states.push(gotos[back][head]);\` pushes the state for "a \`head\` after \`back\`"; and \`reduced.push(k);\` records the rule.

For \`n + n * n\` the reductions are 5, 4, 2 (the first \`n\` becomes \`F\`, \`T\`, \`E\`), then 5, 4 (the second \`n\` becomes a \`T\`), then, because \`*\` is next in state 7, a shift rather than a reduction, then 5, 3 (\`T * F\`) and only then 1 (\`E + T\`): the multiplication is grouped first, by the table alone. Read backwards, the list is the rightmost derivation.

**Common wrong attempts.**

- Pushing \`gotos[top][head]\` with the *old* top (the state before popping) uses the state that was inside the body; read the top again after popping.
- Popping one state for every reduction, whatever the body's length, leaves stale states behind, and \`E + T\` reductions go wrong.
- Treating an \`undefined\` action as "shift" accepts nonsense such as \`n n\`.`,
    wrong: [
      {
        code: `function lrParse(
  prods, action, gotos, tokens) {
  const input = [...tokens, '$'];
  const states = [0];
  const reduced = [];
  let i = 0;
  for (;;) {
    const top = states.at(-1);
    const act = action[top][input[i]];
    if (!act) throw Error();
    if (act === 'acc') return reduced;
    const k = Number(act.slice(1));
    if (act[0] === 's') {
      states.push(k);
      i++;
    } else {
      const [head] = prods[k];
      states.pop();
      const back = states.at(-1);
      states.push(gotos[back][head]);
      reduced.push(k);
    }
  }
}`,
        why: 'It pops one state for every reduction, so after `E → E + T` the states for `E +` are still on the stack.',
      },
    ],
  },
  rightmostFrom: {
    optional: true,
    title: 'From reductions to a rightmost derivation',
    prompt:
      'Write `rightmostFrom(prods, reduced)`: given the rule numbers an LR parser reduced, in order, return the rightmost derivation they form, as strings of symbols joined by spaces. Start from the head of the **last** reduction alone; then take the reductions from last to first, each time replacing the **rightmost** nonterminal (which must be that rule’s head; throw if not) with the rule’s body. A nonterminal is any symbol that is the head of some rule.',
    starter: `function rightmostFrom(prods, reduced) {
  // your code here
  return [];
}`,
    solution: `function rightmostFrom(prods, reduced) {
  const heads = new Set(
    prods.map(([h]) => h));
  const last = reduced.at(-1);
  let form = [prods[last][0]];
  const out = [form.join(' ')];
  for (let j = reduced.length - 1;
       j >= 0; j--) {
    const r = reduced[j];
    const [head, body] = prods[r];
    let i = form.length - 1;
    while (i >= 0 &&
           !heads.has(form[i])) {
      i--;
    }
    if (form[i] !== head) {
      throw new Error('not ' + head);
    }
    form = [...form.slice(0, i),
            ...body,
            ...form.slice(i + 1)];
    out.push(form.join(' '));
  }
  return out;
}`,
    tests: `${TABLE}
test('n + n * n', () => {
  expect(rightmostFrom(prods, [5, 4, 2, 5, 4, 5, 3, 1])).toEqual([
    'E', 'E + T', 'E + T * F', 'E + T * n', 'E + F * n',
    'E + n * n', 'T + n * n', 'F + n * n', 'n + n * n',
  ]);
});
test('one number', () => {
  expect(rightmostFrom(prods, [5, 4, 2]))
    .toEqual(['E', 'T', 'F', 'n']);
});
test('reductions in the wrong order throw', () => {
  expect(() => rightmostFrom(prods, [2, 4, 5])).toThrow();
});`,
    hints: [
      'This is the rightmost derivation from the chapter on derivations, with the picks given as rule numbers and in reverse order.',
      'Loop `j` from the last reduction down to the first. Find the rightmost symbol of the form that is a head of some rule.',
      'If that symbol is not the rule’s head, throw; otherwise splice the body in its place, with `slice` and spreads, and record the joined form.',
    ],
    walkthrough: `**How to think about it.** A shift-reduce parser runs a rightmost derivation backwards: its *last* reduction undoes the derivation's *first* step. So to get the derivation, take the reductions in reverse and apply each one forwards, as a rewrite. In a rightmost derivation each step rewrites the rightmost nonterminal, so the reduction you apply must be a rule for exactly that nonterminal; if it is not, the list did not come from a real parse, and the function throws.

**The solution, line by line.**

- \`const heads = new Set(prods.map(([h]) => h));\` collects every head, which is how we recognise a nonterminal (\`S'\` is included, which does no harm).
- \`const last = reduced.at(-1); let form = [prods[last][0]];\` starts the derivation from the head of the last reduction, \`E\` for a complete parse.
- \`const out = [form.join(' ')];\` records the first form.
- The \`for\` loop counts \`j\` down from the last reduction to the first, and \`const r = reduced[j]; const [head, body] = prods[r];\` reads the rule.
- \`let i = form.length - 1;\` and the \`while (i >= 0 && !heads.has(form[i])) i--;\` loop walks left from the end of the form to the rightmost nonterminal.
- \`if (form[i] !== head) throw ...\` checks the rule fits that nonterminal; \`form[-1]\` is \`undefined\`, so a form with no nonterminal left is caught here too.
- \`form = [...form.slice(0, i), ...body, ...form.slice(i + 1)];\` puts the body in place of the nonterminal, and \`out.push(form.join(' '));\` records the new form.

For \`n + n * n\`, the forms are \`E\`, \`E + T\`, \`E + T * F\`, and so on down to \`n + n * n\`: notice that the \`T\` of \`E + T\` is expanded into \`T * F\` straight away, because it is the rightmost nonterminal, so the tree has the product inside the sum, as precedence says.

**Common wrong attempts.**

- Applying the reductions in their own order (first to last) starts from \`F → n\`, whose head is not the start symbol, and every later step fails.
- Rewriting the *leftmost* nonterminal gives a different list of forms: \`E + T\` would become \`T + T\` first, which is not the derivation the parser found.`,
    wrong: [
      {
        code: `function rightmostFrom(prods, reduced) {
  const heads = new Set(
    prods.map(([h]) => h));
  const last = reduced.at(-1);
  let form = [prods[last][0]];
  const out = [form.join(' ')];
  for (let j = reduced.length - 1;
       j >= 0; j--) {
    const r = reduced[j];
    const [head, body] = prods[r];
    const i = form.findIndex(
      (s) => heads.has(s));
    if (form[i] !== head) throw Error();
    form = [...form.slice(0, i),
            ...body,
            ...form.slice(i + 1)];
    out.push(form.join(' '));
  }
  return out;
}`,
        why: 'It rewrites the leftmost nonterminal, so after `E + T` it tries to apply `T → T * F` to `E`, and throws.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Under `E → E "-" T | T`, `T → NUMBER`, what is the handle of the right sentential form `E - T - 3`?',
    options: [
      { t: '`T`, by `E → T`', why: 'Reducing it gives `E - E - 3`, which is not a step back along any rightmost derivation.' },
      { t: '`3`, by `T → NUMBER`', why: 'Reducing it gives `E - T - T`, which is not in the derivation; the step back from `E - T - 3` is to `E - 3`.' },
      { t: '`E - T`, by `E → E - T`', correct: true, why: 'Reducing it gives `E - 3`, the form one step earlier in the rightmost derivation.' },
      { t: 'There is none', why: 'Every right sentential form except the start symbol has a handle.' },
    ],
  },
  {
    q: 'In the LR table, state 7 means the stack ends in `E + T`. What does it do with each next token?',
    options: [
      { t: 'Reduce by `E → E + T`, whatever comes next', why: 'With `*` next, the `T` is not finished, so it shifts.' },
      { t: 'Shift on `*`; reduce by `E → E + T` on `+` or `$`', correct: true, why: 'That one row is where `*` binding tighter than `+` is decided.' },
      { t: 'Shift on `+`; reduce on `*`', why: 'That would make `+` bind tighter.' },
    ],
  },
  {
    q: 'After a reduction pops its body’s states, how does the parser choose the state to push?',
    options: [
      { t: 'It goes back to state 0', why: 'Only if the stack is now just state 0 and GOTO says so.' },
      { t: 'It pushes the state it popped first', why: 'That state was inside the body, which has just been replaced.' },
      { t: 'It looks up ACTION for the next token', why: 'ACTION is used on the next round, once the new state is pushed.' },
      { t: 'GOTO[state now on top, rule’s head]', correct: true, why: 'The uncovered state plus the head that now follows it decides where to go.' },
    ],
  },
  {
    q: 'Why does the greedy rule “always reduce the longest body on top” fail on `n + n * n`?',
    options: [
      { t: 'It reduces `E + T` to `E` before seeing the `*`, so `2 * 3` can no longer be grouped', correct: true, why: 'Whether `E + T` is a handle depends on the next token, which greedy reduction never looks at.' },
      { t: 'It never shifts', why: 'It shifts whenever nothing can be reduced.' },
      { t: 'The grammar is ambiguous', why: 'This layered grammar has one tree per sentence; the parsing rule is at fault.' },
    ],
  },
  {
    q: 'What did Knuth’s 1965 paper show about LR parsing?',
    options: [
      { t: 'That every context-free grammar is LR', why: 'Ambiguous grammars, for one, are not.' },
      { t: 'That LR parsers need no table', why: 'The table, built from the grammar, is what drives them.' },
      { t: 'How to decide, for a class of grammars called LR(k), when to shift and when to reduce, using k tokens of lookahead', correct: true, why: 'It defined LR(k) grammars and how to parse them from left to right.' },
      { t: 'That top-down parsing is impossible', why: 'Top-down parsing works for LL grammars.' },
    ],
  },
];
