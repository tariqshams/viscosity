// Chapter 95b cards (LR(1) and LALR). Keys are stable ids.

export const prompts = {
  'lr1-item': {
    q: 'What does the LR(1) item `[R → L ·, $]` allow that `R → L ·` in an SLR parser does not decide?',
    a: 'It allows the reduction R → L only when the next token is $; the lookahead belongs to this item in this state, not to R everywhere.',
  },
  'lr1-closure': {
    q: 'Closing `[P → · L = R, $]`, what lookahead do the new `L` items get, and why?',
    a: '`=`: the token after that L is the first token of `= R`, which is `=`.',
  },
  'lr1-cost': {
    q: 'What is the price of canonical LR(1) compared with LR(0)?',
    a: 'More states: a core that is reached with different lookaheads becomes several states (22 instead of 12 for the expression grammar).',
  },
  'core-what': {
    q: 'What is the **core** of an LR(1) state?',
    a: 'Its set of LR(0) items: the items with their lookaheads ignored.',
  },
  'lalr-states': {
    q: 'How many states does an LALR parser have, compared with the LR(0) automaton of the same grammar?',
    a: 'Exactly as many: merging LR(1) states with equal cores leaves one state per LR(0) item set.',
  },
  'merge-rr': {
    q: 'What kind of conflict can LALR merging create that LR(1) did not have?',
    a: 'Only reduce/reduce: pooled lookaheads can put two reductions under one token, but a shift depends on the core alone, so no new shift/reduce conflict can appear.',
  },
  'bison-default': {
    q: 'With no precedence declarations, how does Bison settle a shift/reduce conflict, and a reduce/reduce one?',
    a: 'It shifts; and for reduce/reduce it uses the rule that appears first in the grammar (which its manual calls risky to rely on).',
  },
  'later-line': {
    q: 'With `%left \'+\'` on one line and `%left \'*\'` on the next, which binds tighter, and what happens on `exp + exp` with `*` next?',
    a: '`*`, because later declarations have higher precedence; the token outranks the rule, so Bison shifts.',
  },
};

export const examples = {
  precedence: {
    title: 'How Bison settles a shift/reduce conflict',
    code: `// %left '+' '-'  then  %left '*' '/'
const LEVEL = {
  '+': 1, '-': 1, '*': 2, '/': 2,
};
const ASSOC = { 1: 'left', 2: 'left' };
// rule: the operator in the rule being
// reduced; next: the lookahead token
function decide(rule, next) {
  const r = LEVEL[rule];
  const t = LEVEL[next];
  if (r === undefined) return 'shift';
  if (t === undefined) return 'shift';
  if (t > r) return 'shift';
  if (r > t) return 'reduce';
  return ASSOC[r] === 'left'
    ? 'reduce'
    : 'shift';
}
// exp + exp on the stack:
console.log(decide('+', '*'));
console.log(decide('+', '+'));
// exp * exp on the stack:
console.log(decide('*', '+'));
console.log(decide('*', '/'));`,
  },
};

const STARTER = `// an LR(1) item: [rule, dot, lookahead]
// core(s): the state's LR(0) items, as
// one string, e.g. '5.1 6.1'
function core(s) {
  const ks = new Set(
    s.map(([r, d]) => r + '.' + d));
  return [...ks].sort().join(' ');
}

function merge(states) {
  return states;
}

function rrConflicts(g, state) {
  return [];
}`;

export const exercises = {
  'merge-cores': {
    title: 'Merge by core, then look for trouble',
    prompt:
      'An LR(1) state is an array of items `[rule, dot, lookahead]`, and `core(s)` (given) turns a state into a string naming its LR(0) items. Write `merge(states)`, which returns the LALR states: one array per distinct core, holding all the items of every state with that core (repeats are fine), in the order the cores first appear. Then write `rrConflicts(g, state)`, which returns the sorted list of lookahead tokens on which two **different** complete items of the state would both reduce. `g` is the grammar, rule `r` being `[head, body]`.',
    starter: STARTER,
    solution: `// an LR(1) item: [rule, dot, lookahead]
// core(s): the state's LR(0) items, as
// one string, e.g. '5.1 6.1'
function core(s) {
  const ks = new Set(
    s.map(([r, d]) => r + '.' + d));
  return [...ks].sort().join(' ');
}

function merge(states) {
  const byCore = new Map();
  for (const s of states) {
    const k = core(s);
    const old = byCore.get(k) ?? [];
    byCore.set(k, [...old, ...s]);
  }
  return [...byCore.values()];
}

function rrConflicts(g, state) {
  const by = {};
  const bad = new Set();
  for (const [r, d, a] of state) {
    if (d < g[r][1].length) continue;
    if (a in by && by[a] !== r) {
      bad.add(a);
    }
    by[a] = r;
  }
  return [...bad].sort();
}`,
    tests: `const abc = [['S',['P']],['P',['a','A','d']],['P',['b','B','d']],['P',['a','B','e']],['P',['b','A','e']],['A',['c']],['B',['c']]];
const afterAC = [[5, 1, 'd'], [6, 1, 'e']];
const afterBC = [[6, 1, 'd'], [5, 1, 'e']];
test('two states with one core become one', () => {
  expect(merge([afterAC, afterBC]).length).toBe(1);
  expect(merge([afterAC, afterBC])[0].length).toBe(4);
});
test('different cores stay apart', () => {
  expect(merge([afterAC, [[1, 2, '$']], [[3, 2, '$']]]).length).toBe(3);
});
test('each LR(1) state alone has no conflict', () => {
  expect(rrConflicts(abc, afterAC)).toEqual([]);
  expect(rrConflicts(abc, afterBC)).toEqual([]);
});
test('merging creates a reduce/reduce conflict', () => {
  const [m] = merge([afterAC, afterBC]);
  expect(rrConflicts(abc, m)).toEqual(['d', 'e']);
});
const lrg = [['S',['P']],['P',['L','=','R']],['P',['R']],['L',['*','R']],['L',['id']],['R',['L']]];
const lr1 = [[[0,0,'$'],[1,0,'$'],[2,0,'$'],[3,0,'='],[4,0,'='],[5,0,'$'],[3,0,'$'],[4,0,'$']],[[0,1,'$']],[[1,1,'$'],[5,1,'$']],[[2,1,'$']],[[3,1,'='],[3,1,'$'],[5,0,'='],[5,0,'$'],[3,0,'='],[4,0,'='],[3,0,'$'],[4,0,'$']],[[4,1,'='],[4,1,'$']],[[1,2,'$'],[5,0,'$'],[3,0,'$'],[4,0,'$']],[[3,2,'='],[3,2,'$']],[[5,1,'='],[5,1,'$']],[[1,3,'$']],[[5,1,'$']],[[3,1,'$'],[5,0,'$'],[3,0,'$'],[4,0,'$']],[[4,1,'$']],[[3,2,'$']]];
test('assignment grammar: 14 LR(1) states merge to 10', () => {
  expect(merge(lr1).length).toBe(10);
});
test('and no merged state has a conflict', () => {
  expect(merge(lr1).flatMap((s) => rrConflicts(lrg, s))).toEqual([]);
});
test('one rule under two lookaheads is no conflict', () => {
  expect(rrConflicts(lrg, [[5, 1, '='], [5, 1, '$']])).toEqual([]);
});
const expr = [[[0,0,'$'],[1,0,'$'],[2,0,'$'],[1,0,'+'],[2,0,'+'],[3,0,'$'],[4,0,'$'],[3,0,'+'],[4,0,'+'],[3,0,'*'],[4,0,'*'],[5,0,'$'],[6,0,'$'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[0,1,'$'],[1,1,'$'],[1,1,'+']],[[2,1,'$'],[2,1,'+'],[3,1,'$'],[3,1,'+'],[3,1,'*']],[[4,1,'$'],[4,1,'+'],[4,1,'*']],[[5,1,'$'],[5,1,'+'],[5,1,'*'],[1,0,')'],[2,0,')'],[1,0,'+'],[2,0,'+'],[3,0,')'],[4,0,')'],[3,0,'+'],[4,0,'+'],[3,0,'*'],[4,0,'*'],[5,0,')'],[6,0,')'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[6,1,'$'],[6,1,'+'],[6,1,'*']],[[1,2,'$'],[1,2,'+'],[3,0,'$'],[4,0,'$'],[3,0,'+'],[4,0,'+'],[3,0,'*'],[4,0,'*'],[5,0,'$'],[6,0,'$'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[3,2,'$'],[3,2,'+'],[3,2,'*'],[5,0,'$'],[6,0,'$'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[5,2,'$'],[5,2,'+'],[5,2,'*'],[1,1,')'],[1,1,'+']],[[2,1,')'],[2,1,'+'],[3,1,')'],[3,1,'+'],[3,1,'*']],[[4,1,')'],[4,1,'+'],[4,1,'*']],[[5,1,')'],[5,1,'+'],[5,1,'*'],[1,0,')'],[2,0,')'],[1,0,'+'],[2,0,'+'],[3,0,')'],[4,0,')'],[3,0,'+'],[4,0,'+'],[3,0,'*'],[4,0,'*'],[5,0,')'],[6,0,')'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[6,1,')'],[6,1,'+'],[6,1,'*']],[[1,3,'$'],[1,3,'+'],[3,1,'$'],[3,1,'+'],[3,1,'*']],[[3,3,'$'],[3,3,'+'],[3,3,'*']],[[5,3,'$'],[5,3,'+'],[5,3,'*']],[[1,2,')'],[1,2,'+'],[3,0,')'],[4,0,')'],[3,0,'+'],[4,0,'+'],[3,0,'*'],[4,0,'*'],[5,0,')'],[6,0,')'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[3,2,')'],[3,2,'+'],[3,2,'*'],[5,0,')'],[6,0,')'],[5,0,'+'],[6,0,'+'],[5,0,'*'],[6,0,'*']],[[5,2,')'],[5,2,'+'],[5,2,'*'],[1,1,')'],[1,1,'+']],[[1,3,')'],[1,3,'+'],[3,1,')'],[3,1,'+'],[3,1,'*']],[[3,3,')'],[3,3,'+'],[3,3,'*']],[[5,3,')'],[5,3,'+'],[5,3,'*']]];
test('expression grammar: 22 LR(1) states merge to 12', () => {
  expect(merge(expr).length).toBe(12);
});
test('merged states keep the order cores first appear', () => {
  expect(core(merge(lr1)[2])).toBe(core(lr1[2]));
});`,
    hints: [
      'For `merge`, use a `Map` from core string to the list of items collected so far. A `Map` remembers the order its keys were first added, which is the order the answer needs.',
      'For each state `s`: `const k = core(s)`, then store `[...(byCore.get(k) ?? []), ...s]` under `k`. At the end, `[...byCore.values()]` is the list of merged states.',
      'For `rrConflicts`, remember, for each lookahead token, which rule reduces under it (an object `by`). Walk the complete items (`d === g[r][1].length`); if `by[a]` already holds a *different* rule, `a` is a conflict token. Collect those in a `Set` and return them sorted.',
    ],
    walkthrough: `**How to think about it.** LALR is two small ideas, and the exercise has one function for each. Merging is grouping: states whose cores are equal go in one bucket, and a bucket's items are all the items of its states (the union of the lookaheads happens by itself, because each item carries its own lookahead). Checking for the new kind of conflict is a matter of asking, for each lookahead token, "how many different rules want to reduce under you?".

**The solution, line by line.**

- \`core(s)\` is given: it drops each item's lookahead, removes repeats with a \`Set\`, sorts, and joins, so two states with the same LR(0) items give the same string whatever their lookaheads.
- \`function merge(states) {\` takes the list of LR(1) states.
- \`  const byCore = new Map();\` will map each core string to the items gathered for it. A \`Map\` keeps its keys in the order they were first inserted.
- \`  for (const s of states) {\` visits every LR(1) state.
- \`    const k = core(s);\` is its core.
- \`    const old = byCore.get(k) ?? [];\` fetches what this core has collected so far, or an empty list the first time.
- \`    byCore.set(k, [...old, ...s]);\` stores the old items followed by this state's items. Setting an existing key does not move it, so the order of first appearance is kept.
- \`  return [...byCore.values()];\` returns one merged state per core.
- \`function rrConflicts(g, state) {\` takes the grammar (to know which items are complete) and one state.
- \`  const by = {};\` maps a lookahead token to the rule that reduces under it.
- \`  const bad = new Set();\` collects the conflict tokens without repeats.
- \`  for (const [r, d, a] of state) {\` visits each item: rule, dot, lookahead.
- \`    if (d < g[r][1].length) continue;\` skips items that are not complete; only complete items reduce.
- \`    if (a in by && by[a] !== r) {\` / \`bad.add(a);\` notices a second, different rule reducing under the same token. The \`!== r\` matters: the same rule under the same token twice (which merging produces all the time) is not a conflict.
- \`    by[a] = r;\` records this rule for this token.
- \`  return [...bad].sort();\` returns the tokens in a fixed order.

On the \`a c\` / \`b c\` states, the merged state holds \`[5,1,'d'], [6,1,'e'], [6,1,'d'], [5,1,'e']\`: under \`d\` rule 5 is recorded, then rule 6 arrives, so \`d\` is bad; the same happens under \`e\`. On the assignment grammar the fourteen states fall into ten buckets, and every complete item in a bucket belongs to one rule, so there is no conflict: that grammar is LALR(1).

**Common wrong attempts.**

- Grouping by the whole state (lookaheads included) merges nothing, since LR(1) states are already distinct: you get 14 and 22 states back.
- Reporting every token that two complete items share, without checking that the rules differ, flags \`$\` in the merged state for \`R → L ·\`, where \`[R → L ·, $]\` appears twice (once from each LR(1) state) but both copies belong to the same rule.`,
    wrong: [
      {
        code: `function core(s) {
  const ks = new Set(
    s.map(([r, d]) => r + '.' + d));
  return [...ks].sort().join(' ');
}

function merge(states) {
  const byKey = new Map();
  for (const s of states) {
    const k = JSON.stringify(s);
    const old = byKey.get(k) ?? [];
    byKey.set(k, [...old, ...s]);
  }
  return [...byKey.values()];
}

function rrConflicts(g, state) {
  const by = {};
  const bad = new Set();
  for (const [r, d, a] of state) {
    if (d < g[r][1].length) continue;
    if (a in by && by[a] !== r) {
      bad.add(a);
    }
    by[a] = r;
  }
  return [...bad].sort();
}`,
        why: 'It groups by the whole state, lookaheads included, so no two LR(1) states ever merge: 14 stay 14.',
      },
      {
        code: `function core(s) {
  const ks = new Set(
    s.map(([r, d]) => r + '.' + d));
  return [...ks].sort().join(' ');
}

function merge(states) {
  const byCore = new Map();
  for (const s of states) {
    const k = core(s);
    const old = byCore.get(k) ?? [];
    byCore.set(k, [...old, ...s]);
  }
  return [...byCore.values()];
}

function rrConflicts(g, state) {
  const seen = new Set();
  const bad = new Set();
  for (const [r, d, a] of state) {
    if (d < g[r][1].length) continue;
    if (seen.has(a)) bad.add(a);
    seen.add(a);
  }
  return [...bad].sort();
}`,
        why: 'It flags any token seen twice, even when the same rule reduces under it twice, so the merged states of the assignment grammar falsely report conflicts.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Closing `[P → · R, $]` in the assignment grammar adds which item for R?',
    options: [
      { t: '`[R → · L, =]`', why: 'Nothing follows R in `P → R`, so its lookahead is the item’s own: $.' },
      { t: '`[R → · L, $]`', correct: true, why: 'β is empty, so FIRST(β $) is just $.' },
      { t: '`[R → · L, =]` and `[R → · L, $]`', why: 'Only $ can follow this R; `=` would need an L = R context, which this item is not in.' },
    ],
  },
  {
    q: 'What does LALR do with two LR(1) states that have the same core?',
    options: [
      { t: 'Keeps both, so that no information is lost', why: 'That is canonical LR(1).' },
      { t: 'Merges them into one state whose items carry the lookaheads of both', correct: true, why: 'That is the whole idea: LR(0)’s number of states, with lookaheads pooled.' },
      { t: 'Deletes the one with fewer lookaheads', why: 'Nothing is thrown away; the lookaheads are united.' },
    ],
  },
  {
    q: 'After `a c` the LR(1) state is `[A → c ·, d]`, `[B → c ·, e]`; after `b c` it is `[A → c ·, e]`, `[B → c ·, d]`. What happens in LALR?',
    options: [
      { t: 'They merge, and both reductions land under d and under e: a reduce/reduce conflict', correct: true, why: 'Same core, so they merge; the pooled lookaheads put A and B under both tokens.' },
      { t: 'They merge into a shift/reduce conflict', why: 'Both items are complete; there is no shift to conflict with.' },
      { t: 'They stay apart, because their lookaheads differ', why: 'LALR merges on the core alone; the lookaheads do not keep states apart.' },
    ],
  },
  {
    q: 'Bison is given `%left \'+\' \'-\'` and then `%left \'*\' \'/\'`. With `exp * exp` on the stack and `+` next, what does it do?',
    options: [
      { t: 'Shift the `+`', why: 'The rule (level of `*`) outranks the token `+`, so it reduces.' },
      { t: 'Report a conflict and stop', why: 'Precedence resolves it; Bison builds the parser without complaint.' },
      { t: 'Reduce `exp * exp`', correct: true, why: 'Later lines bind tighter, so the rule’s precedence is higher than the token’s: reduce, which groups the product first.' },
    ],
  },
  {
    q: 'Which statement about LR(1) and LALR is true?',
    options: [
      { t: 'LALR can parse some grammars that LR(1) cannot', why: 'LALR is LR(1) with states merged; anything conflict-free in LALR was conflict-free in LR(1).' },
      { t: 'Every LR(1) grammar is also LALR(1)', why: 'The `a c` / `b c` grammar is LR(1) but not LALR(1).' },
      { t: 'LALR has as many states as LR(0), and is what yacc and Bison build by default', correct: true, why: 'Merging by core leaves one state per LR(0) item set; Bison uses LALR(1) unless told otherwise.' },
    ],
  },
];
