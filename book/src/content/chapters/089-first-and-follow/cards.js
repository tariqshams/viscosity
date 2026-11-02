// Chapter 89 cards. Keys are stable ids: never rename them.
//
// Grammars are data, as in the chapter on grammars: { head: [body, ...] },
// a body is an array of symbols, [] is ε, and a symbol is a nonterminal
// exactly when it is a key of the object.

export const prompts = {
  'first-what': {
    q: 'What is **FIRST(A)** for a nonterminal `A`?',
    a: 'The set of tokens that can begin something `A` derives.',
  },
  'nullable-what': {
    q: 'What does it mean for a nonterminal to be **nullable**?',
    a: 'It can derive the empty row, ε: it can vanish without using any tokens.',
  },
  'first-seq': {
    q: 'If `A` is nullable and `B` is not, what is FIRST of the row `A B c`?',
    a: 'FIRST(A) together with FIRST(B). Because `A` can vanish, `B` can start the row; `B` cannot vanish, so `c` never starts it.',
  },
  'follow-what': {
    q: 'What is **FOLLOW(A)**?',
    a: 'The set of tokens that can come straight after `A` in some sentential form, with `$` for the end of the input.',
  },
  'why-follow': {
    q: 'When does a top-down parser need FOLLOW, and not only FIRST?',
    a: 'When a rule can produce nothing (such as `rest → ε`): it takes that rule when the next token is one that can come *after* the nonterminal.',
  },
  dollar: {
    q: 'Why is `$` always in FOLLOW of the start symbol?',
    a: 'The start symbol derives the whole program, so the end of the input comes straight after it.',
  },
  'fixed-point': {
    q: 'Why does the sweep-until-nothing-changes loop always stop?',
    a: 'The sets only ever grow, and there are only finitely many tokens to add, so a sweep must eventually add nothing.',
  },
  'drip-brace': {
    q: 'In Drip, `{` is in FOLLOW(expression). Why does that let Drip drop the brackets round an `if` condition?',
    a: 'No expression rule continues with `{`, so the parser knows the condition has ended exactly when it sees the `{` of the block.',
  },
};

export const examples = {
  nullableSweeps: {
    title: 'Nullable, sweep by sweep',
    code: `const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item', 'rest']],
  rest: [['+', 'item', 'rest'], []],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
  opt:  [['rest', 'rest']],
};

function nullable(rules) {
  const nul = new Set();
  let changed = true;
  let sweep = 0;
  while (changed) {
    changed = false;
    sweep++;
    for (const A in rules) {
      if (nul.has(A)) continue;
      for (const body of rules[A]) {
        // ε, or only nullable symbols?
        const all = body.every(
          (s) => nul.has(s));
        if (all) {
          nul.add(A);
          changed = true;
          break;
        }
      }
    }
    console.log(sweep, [...nul]);
  }
  return nul;
}

nullable(g);
// Try: put opt first in g. Then it
// needs one sweep more: why?`,
  },
};

const NULLABLE = `function nullable(rules) {
  const nul = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const A in rules) {
      if (nul.has(A)) continue;
      for (const body of rules[A]) {
        const all = body.every(
          (s) => nul.has(s));
        if (all) {
          nul.add(A);
          changed = true;
          break;
        }
      }
    }
  }
  return nul;
}`;

const GRAMMARS = `const show = (m) => Object.fromEntries(
  Object.entries(m).map(([k, s]) => [k, [...s].sort()]));
const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item', 'rest']],
  rest: [['+', 'item', 'rest'], []],
  item: [['NUMBER'], ['(', 'expr', ')']],
};
const d = {
  stmt: [['print', 'expr', ';'],
    ['if', 'expr', 'block', 'elsePart'], ['block']],
  elsePart: [['else', 'block'], []],
  block: [['{', 'stmts', '}']],
  stmts: [['stmt', 'stmts'], []],
  expr: [['NUMBER'], ['IDENT']],
};
const c = { S: [['A', 'B', 'c']], A: [['a'], []], B: [['b'], []] };`;

export const exercises = {
  firstSets: {
    title: 'Compute the FIRST sets',
    prompt:
      'Write `firstSets(rules)`, returning an object that maps every nonterminal to a `Set` of the terminals that can begin it. A working `nullable(rules)` (from the runnable example) is given. Sweep over every rule until a whole sweep adds nothing. In each body, add FIRST of the first symbol (a terminal is its own FIRST); if that symbol is nullable, carry on to the next symbol, and so on.',
    starter: `${NULLABLE}

function firstSets(rules) {
  const first = {};
  for (const A in rules) {
    first[A] = new Set();
  }
  // your code here
  return first;
}

const g = {
  stmt: [['print', 'expr', ';']],
  expr: [['item', 'rest']],
  rest: [['+', 'item', 'rest'], []],
  item: [['NUMBER'],
         ['(', 'expr', ')']],
};
console.log(firstSets(g));`,
    solution: `${NULLABLE}

function firstSets(rules) {
  const nul = nullable(rules);
  const first = {};
  for (const A in rules) {
    first[A] = new Set();
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const A in rules) {
      for (const body of rules[A]) {
        for (const s of body) {
          const add = s in rules
            ? first[s] : [s];
          for (const t of add) {
            if (!first[A].has(t)) {
              first[A].add(t);
              changed = true;
            }
          }
          if (!nul.has(s)) break;
        }
      }
    }
  }
  return first;
}`,
    tests: `${GRAMMARS}
test('the adding grammar', () => {
  expect(show(firstSets(g))).toEqual({
    stmt: ['print'], expr: ['(', 'NUMBER'],
    rest: ['+'], item: ['(', 'NUMBER'],
  });
});
test('a piece of Drip', () => {
  expect(show(firstSets(d))).toEqual({
    stmt: ['if', 'print', '{'], elsePart: ['else'],
    block: ['{'], stmts: ['if', 'print', '{'],
    expr: ['IDENT', 'NUMBER'],
  });
});
test('nullable symbols let later ones show', () => {
  expect(show(firstSets(c))).toEqual({
    S: ['a', 'b', 'c'], A: ['a'], B: ['b'],
  });
});
test('a rule that refers to itself', () => {
  const r = { xs: [['xs', 'x'], ['y']] };
  expect(show(firstSets(r))).toEqual({ xs: ['y'] });
});`,
    hints: [
      'Copy the shape of `nullable`: a `changed` flag, a `while (changed)` loop, and inside it a loop over every head and every body.',
      'For one body, walk its symbols from the left. Add FIRST of the symbol (`first[s]` for a nonterminal, or just `[s]` for a terminal) to `first[A]`, setting `changed` when something is new.',
      'After adding a symbol’s FIRST, `break` unless that symbol is nullable (`nul.has(s)`): only a symbol that can vanish lets the next one start the body.',
    ],
    walkthrough: `**How to think about it.** Start with the simplest cases and grow. A body that begins with a terminal, like \`["+", "item", "rest"]\`, can only begin with that terminal, so \`+\` goes into FIRST(rest). A body that begins with a nonterminal, like \`["item", "rest"]\`, begins with whatever \`item\` begins with, so FIRST(item) is copied into FIRST(expr). The catch is that FIRST(item) may not be known yet when you look at \`expr\`; rather than working out a clever order, do a whole sweep, then another, and stop when a sweep adds nothing. Sets only grow and there are only so many tokens, so it must stop. The last detail is nullable symbols: if the first symbol can vanish, the second can start the body too, and so on along the row.

**The solution, line by line.**

- \`const nul = nullable(rules);\` works out once which nonterminals can vanish.
- \`const first = {};\` and the \`for...in\` line give every nonterminal an empty \`Set\` (a \`Set\` ignores duplicates, which is exactly what a set of tokens needs).
- \`let changed = true; while (changed) { changed = false; ...\` is the sweep loop: start each sweep assuming nothing will change, and go round again only if something did.
- \`for (const A in rules)\` and \`for (const body of rules[A])\` visit every rule \`A → body\`.
- \`for (const s of body) {\` walks the body from the left.
- \`const add = s in rules ? first[s] : [s];\` is what \`s\` can begin with: its FIRST set if it is a nonterminal, or a one-item list holding itself if it is a terminal.
- The inner \`for (const t of add)\` adds each token to \`first[A]\` if it is not there yet, and sets \`changed = true\` when it adds one.
- \`if (!nul.has(s)) break;\` stops walking this body at the first symbol that cannot vanish. A terminal is never in \`nul\`, so a terminal always stops the walk.
- \`return first;\` after the loop, once a sweep has added nothing.

On the adding grammar, sweep 1 gives \`stmt\` \`print\`, \`rest\` \`+\` and \`item\` \`NUMBER\` and \`(\`, but leaves \`expr\` empty, because \`expr\` is visited before \`item\` has anything; sweep 2 copies FIRST(item) into FIRST(expr); sweep 3 adds nothing, and the loop ends, exactly as the step-through showed. In the third test, \`S → A B c\` collects \`a\`, then (as \`A\` is nullable) \`b\`, then (as \`B\` is nullable too) \`c\`.

**Common wrong attempts.**

- Doing a single sweep, with no \`while\` loop, gets the adding grammar wrong: FIRST(expr) stays empty, because it was read before FIRST(item) was filled in.
- Looking only at the first symbol of each body (no inner walk) misses \`b\` and \`c\` in the third test: when \`A\` can vanish, \`B\` can start the row.
- Never breaking adds every symbol of every body, so FIRST(stmt) would wrongly contain \`;\`.`,
    wrong: [
      {
        code: `${NULLABLE}

function firstSets(rules) {
  const nul = nullable(rules);
  const first = {};
  for (const A in rules) {
    first[A] = new Set();
  }
  for (const A in rules) {
    for (const body of rules[A]) {
      for (const s of body) {
        const add = s in rules
          ? first[s] : [s];
        for (const t of add) {
          first[A].add(t);
        }
        if (!nul.has(s)) break;
      }
    }
  }
  return first;
}`,
        why: 'One sweep is not enough: `expr` is visited before `item`’s set is filled, so FIRST(expr) stays empty.',
      },
      {
        code: `${NULLABLE}

function firstSets(rules) {
  const first = {};
  for (const A in rules) {
    first[A] = new Set();
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const A in rules) {
      for (const body of rules[A]) {
        const s = body[0];
        if (s === undefined) continue;
        const add = s in rules
          ? first[s] : [s];
        for (const t of add) {
          if (!first[A].has(t)) {
            first[A].add(t);
            changed = true;
          }
        }
      }
    }
  }
  return first;
}`,
        why: 'It looks only at the first symbol, so when that symbol can vanish (as `A` can in `S → A B c`) the tokens after it are missed.',
      },
    ],
  },
  followSets: {
    optional: true,
    title: 'Compute the FOLLOW sets',
    prompt:
      'Write `followSets(rules, start, first, nul)`, returning an object mapping every nonterminal to a `Set` of what can follow it. `first` maps each nonterminal to an array of its FIRST tokens and `nul` is an array of the nullable nonterminals (both already computed). Put `$` in FOLLOW(start); then sweep until nothing changes. For every rule `A → body` and every nonterminal `B` at position `i` in the body, add FIRST of each symbol after `B`, walking right while those symbols are nullable; if *all* the symbols after `B` are nullable (or there are none), add FOLLOW(A) to FOLLOW(B).',
    starter: `function followSets(
  rules, start, first, nul) {
  const follow = {};
  for (const A in rules) {
    follow[A] = new Set();
  }
  follow[start].add('$');
  // your code here
  return follow;
}`,
    solution: `function followSets(
  rules, start, first, nul) {
  const follow = {};
  for (const A in rules) {
    follow[A] = new Set();
  }
  follow[start].add('$');
  let changed = true;
  const addAll = (B, xs) => {
    for (const x of xs) {
      if (!follow[B].has(x)) {
        follow[B].add(x);
        changed = true;
      }
    }
  };
  const fst = (s) =>
    s in rules ? first[s] : [s];
  // one rule A → body
  const visit = (A, body) => {
    body.forEach((B, i) => {
      if (!(B in rules)) return;
      const tail = body.slice(i + 1);
      let tailNul = true;
      for (const s of tail) {
        addAll(B, fst(s));
        if (!nul.includes(s)) {
          tailNul = false;
          break;
        }
      }
      if (tailNul) addAll(B, follow[A]);
    });
  };
  while (changed) {
    changed = false;
    for (const A in rules) {
      for (const body of rules[A]) {
        visit(A, body);
      }
    }
  }
  return follow;
}`,
    tests: `${GRAMMARS}
const FIRST_G = { stmt: ['print'], expr: ['NUMBER', '('],
  rest: ['+'], item: ['NUMBER', '('] };
const FIRST_D = { stmt: ['print', 'if', '{'], elsePart: ['else'],
  block: ['{'], stmts: ['print', 'if', '{'], expr: ['NUMBER', 'IDENT'] };
test('the adding grammar', () => {
  expect(show(followSets(g, 'stmt', FIRST_G, ['rest']))).toEqual({
    stmt: ['$'], expr: [')', ';'], rest: [')', ';'],
    item: [')', '+', ';'],
  });
});
test('a piece of Drip', () => {
  expect(show(followSets(d, 'stmt', FIRST_D,
    ['elsePart', 'stmts']))).toEqual({
    stmt: ['$', 'if', 'print', '{', '}'],
    elsePart: ['$', 'if', 'print', '{', '}'],
    block: ['$', 'else', 'if', 'print', '{', '}'],
    stmts: ['}'], expr: [';', '{'],
  });
});
test('nullable neighbours', () => {
  expect(show(followSets(c, 'S', { S: ['a', 'b', 'c'],
    A: ['a'], B: ['b'] }, ['A', 'B']))).toEqual({
    S: ['$'], A: ['b', 'c'], B: ['c'],
  });
});`,
    hints: [
      'The loop has the same shape as for FIRST: `changed`, `while`, every rule. A small helper `addAll(set, xs)` that adds each item and sets `changed` keeps the rest short.',
      'Inside a body, use `body.forEach((B, i) => ...)` and skip terminals. Walk `body.slice(i + 1)`: add FIRST of each symbol (or the terminal itself) to FOLLOW(B), and stop at the first symbol that is not nullable.',
      'Keep a flag that stays `true` only if the walk never stopped; when it is still `true` after the walk, every symbol after `B` can vanish, so `addAll(follow[B], follow[A])`.',
    ],
    walkthrough: `**How to think about it.** FOLLOW(B) asks what can come straight after \`B\`. Look at every place \`B\` appears in a rule body. Whatever the next symbol can begin with can come after \`B\`; if that next symbol can vanish, the one after it counts too, and so on. If *everything* after \`B\` can vanish (or nothing comes after it), then \`B\` can be the last thing in \`A\`'s body, so anything that can follow \`A\` can follow \`B\`. The step-through showed why one sweep is not enough: in the adding grammar, the \`)\` reaches FOLLOW(expr) only at the very last rule, and has to flow on into FOLLOW(item) and FOLLOW(rest) in a second sweep.

**The solution, line by line.**

- The first lines give every nonterminal an empty set and put \`$\`, the end of the input, after the start symbol.
- \`const addAll = (B, xs) => { ... }\` adds each of \`xs\` to FOLLOW(B) and sets \`changed\` when one is new; every update goes through it, so the sweep loop knows when to stop.
- \`const fst = (s) => s in rules ? first[s] : [s];\` is what a symbol can begin with: its FIRST set, or the terminal itself.
- \`const visit = (A, body) => { ... }\` handles one rule \`A → body\`. \`body.forEach((B, i) => { if (!(B in rules)) return; ...\` visits each symbol with its position, skipping terminals (\`return\` inside \`forEach\` moves on to the next symbol).
- \`const tail = body.slice(i + 1);\` is everything after \`B\`, and \`let tailNul = true;\` assumes it can all vanish until shown otherwise.
- \`for (const s of tail) { addAll(B, fst(s)); if (!nul.includes(s)) { tailNul = false; break; } }\` adds what each following symbol can begin with, and stops at the first one that cannot vanish.
- \`if (tailNul) addAll(B, follow[A]);\` handles "B can end A's body".
- The \`while (changed)\` loop at the bottom sweeps over every rule, calling \`visit\`, until a sweep adds nothing.

In the Drip piece, FOLLOW(expr) is \`{ ; {\`: a \`;\` after a printed expression, and a \`{\` after an \`if\` condition, since the condition is followed by the block. FOLLOW(block) has \`else\` in it, while FOLLOW(elsePart) does not, because \`elsePart\` always ends a statement; the next chapter shows why that makes this grammar easy to parse with one token of lookahead.

**Common wrong attempts.**

- Adding only FIRST of the very next symbol misses the tokens after a nullable neighbour: \`A\` in \`S → A B c\` needs \`c\` as well as \`b\`.
- Adding FOLLOW(A) to every nonterminal in the body, rather than only when the rest of the body can vanish, would put \`$\` into FOLLOW(expr) in the adding grammar, which is wrong (a \`;\` always comes first).`,
    wrong: [
      {
        code: `function followSets(
  rules, start, first, nul) {
  const follow = {};
  for (const A in rules) {
    follow[A] = new Set();
  }
  follow[start].add('$');
  for (let k = 0; k < 5; k++) {
    for (const A in rules) {
      for (const body of rules[A]) {
        body.forEach((B, i) => {
          if (!(B in rules)) return;
          const s = body[i + 1];
          if (s === undefined) {
            for (const x of follow[A]) {
              follow[B].add(x);
            }
          } else {
            const xs = s in rules
              ? first[s] : [s];
            for (const x of xs) {
              follow[B].add(x);
            }
          }
        });
      }
    }
  }
  return follow;
}`,
        why: 'It looks only at the very next symbol, so when that symbol can vanish (like `rest`), the tokens after it and FOLLOW of the head are missed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `expr → item rest`, `rest → "+" item rest | ε` and `item → NUMBER | "(" expr ")"`, what is FIRST(expr)?',
    options: [
      { t: '`{ + }`', why: 'That is FIRST(rest). `expr` starts with `item`, which cannot vanish.' },
      { t: '`{ NUMBER, ( }`', correct: true, why: 'FIRST(expr) is FIRST(item), and since `item` is not nullable, nothing after it counts.' },
      { t: '`{ NUMBER, (, + }`', why: '`+` would only count if `item` could vanish.' },
      { t: '`{ ; }`', why: '`;` comes after an `expr`; that is FOLLOW, not FIRST.' },
    ],
  },
  {
    q: 'Which nonterminals are nullable in `S → A B`, `A → "a" | ε`, `B → A A`?',
    options: [
      { t: 'Only `A`', why: '`B → A A` is two nullable symbols, so `B` can vanish too.' },
      { t: '`A` and `B` only', why: 'Then `S → A B` is a body of nullable symbols, so `S` is nullable as well.' },
      { t: '`A`, `B` and `S`', correct: true, why: 'A body made only of nullable symbols makes its head nullable, and the knowledge spreads upwards.' },
    ],
  },
  {
    q: 'In `stmt → "print" expr ";"`, what does this rule add to FOLLOW(expr)?',
    options: [
      { t: '`;`', correct: true, why: 'The terminal `;` comes straight after `expr`.' },
      { t: '`print`', why: '`print` comes before `expr`, not after.' },
      { t: 'FOLLOW(stmt)', why: 'That would only flow in if everything after `expr` could vanish, and `;` cannot.' },
      { t: 'Nothing', why: 'Every place a nonterminal appears tells us something about what follows it.' },
    ],
  },
  {
    q: 'A recursive-descent function for `rest → "+" item rest | ε` sees the token `)`. What should it do, given FOLLOW(rest) = `{ ;, ) }`?',
    options: [
      { t: 'Report a syntax error', why: '`)` can legally come after `rest`, so this is not an error.' },
      { t: 'Take the `+` rule', why: 'That rule needs a `+` next.' },
      { t: 'Skip the `)` and try again', why: 'Skipping a token is error recovery, not normal parsing.' },
      { t: 'Use `rest → ε` and return, leaving `)` for its caller', correct: true, why: '`)` is in FOLLOW(rest), so `rest` produces nothing here.' },
    ],
  },
  {
    q: 'Why compute FIRST by sweeping repeatedly, rather than once in a clever order?',
    options: [
      { t: 'Rules can depend on each other in loops (like `expr` and `item`), so no order handles every case in one pass', correct: true, why: 'Repeating until nothing changes reaches the answer whatever the order.' },
      { t: 'Each sweep removes tokens that were added wrongly', why: 'Sweeps only ever add; nothing is removed.' },
      { t: 'It is faster than one pass', why: 'It is usually slower; it is chosen because it is simple and always right.' },
    ],
  },
];
