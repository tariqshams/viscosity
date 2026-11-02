// Chapter 211 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'gen-what': {
    q: 'For reaching definitions, what is in a block’s **gen** set?',
    a: 'The block’s own definitions that are not overwritten later in the same block.',
  },
  'kill-what': {
    q: 'For reaching definitions, what is in a block’s **kill** set?',
    a: 'Every other definition of a variable the block assigns.',
  },
  'transfer-gk': {
    q: 'Write the gen/kill transfer function.',
    a: 'OUT[B] = gen[B] ∪ (IN[B] − kill[B]): remove what it kills, then add what it generates.',
  },
  'last-def-gen': {
    q: 'A block runs `d7: x = 1` then `d8: x = 2`. Which of the two is in its gen set, and why?',
    a: 'Only d8: d7 is overwritten before the block ends, so it never leaves the block.',
  },
  'reach-what': {
    q: 'When does a definition `d` of `v` **reach** a point `p`?',
    a: 'When some path goes from d to p without assigning v again.',
  },
  'reach-may': {
    q: 'Is reaching definitions a “may” or a “must” problem, and what is its meet?',
    a: 'A may problem (some path is enough), so its meet is union.',
  },
  'reach-start-empty': {
    q: 'Why does every OUT start as the empty set in reaching definitions?',
    a: 'The meet is union, and union leaves the empty set alone, so the guess adds nothing false.',
  },
  'phi-where': {
    q: 'Two definitions of `i` reach the loop test. What does SSA put there?',
    a: 'A phi for i, choosing between the two by which edge was taken.',
  },
};

export const examples = {
  'gen-kill': {
    title: 'gen and kill for the loop body',
    code: `// b2's definitions, as [def, var]:
const b2 = [['d3', 'y'], ['d4', 'x'],
  ['d5', 'i']];
// every definition in the function:
const all = [['d1', 'i'],
  ['d2', 'x'], ...b2];
// the last def of each var in b2:
const last = new Map();
for (const [d, v] of b2) {
  last.set(v, d);
}
const gen = [...last.values()];
const kill = all
  .filter(([d, v]) => last.has(v))
  .filter(([d]) => !gen.includes(d))
  .map(([d]) => d);
console.log('gen', gen.join(' '));
console.log('kill', kill.join(' '));`,
  },
};

export const exercises = {
  reaching: {
    title: 'Reaching definitions',
    prompt: `Each block has \`preds\` and \`defs\`: the definitions it makes, as \`[name, defId]\`, at most one per name (so every def in a block is in its gen set).

Write \`reaching(blocks)\`, returning for every block the **sorted** list of defIds that reach its start:

- IN[b] is the union of OUT over b’s preds (empty for a block with none);
- OUT[b] is IN[b] minus the definitions of names b assigns (its kill set), plus b’s own defs (its gen set).

Start every OUT empty, and repeat rounds over all the blocks until a round changes no OUT.`,
    starter: `// blocks: { b: { preds: [...],
//   defs: [[name, defId], ...] } }
// Return { b: sorted defIds that
//   reach the start of b }.
function reaching(blocks) {
  const inn = {};
  for (const b in blocks) inn[b] = [];
  return inn;
}`,
    solution: `// blocks: { b: { preds: [...],
//   defs: [[name, defId], ...] } }
// Return { b: sorted defIds that
//   reach the start of b }.
function reaching(blocks) {
  const varOf = {};
  const out = {};
  const inn = {};
  for (const b in blocks) {
    out[b] = [];
    for (const [v, d] of blocks[b].defs)
      varOf[d] = v;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, defs } = blocks[b];
      const s = new Set();
      for (const p of preds)
        for (const d of out[p]) {
          s.add(d);
        }
      inn[b] = [...s].sort();
      const mine = new Set(
        defs.map(([v]) => v));
      const o = inn[b].filter(
        (d) => !mine.has(varOf[d]));
      for (const [, d] of defs) {
        o.push(d);
      }
      o.sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
    tests: `test('a new definition kills', () => {
  expect(reaching({
    b0: { preds: [],
      defs: [['x', 'd1']] },
    b1: { preds: ['b0'],
      defs: [['x', 'd2']] },
    b2: { preds: ['b1'], defs: [] },
  })).toEqual({ b0: [], b1: ['d1'],
    b2: ['d2'] });
});
test('an if/else diamond', () => {
  expect(reaching({
    b0: { preds: [],
      defs: [['x', 'd1'], ['y', 'd2']] },
    b1: { preds: ['b0'],
      defs: [['x', 'd3']] },
    b2: { preds: ['b0'], defs: [] },
    b3: { preds: ['b1', 'b2'],
      defs: [] },
  })).toEqual({ b0: [],
    b1: ['d1', 'd2'], b2: ['d1', 'd2'],
    b3: ['d1', 'd2', 'd3'] });
});
test('a loop needs a second round', () => {
  expect(reaching({
    b0: { preds: [],
      defs: [['x', 'd1']] },
    b1: { preds: ['b0', 'b2'],
      defs: [] },
    b2: { preds: ['b1'],
      defs: [['x', 'd2']] },
    b3: { preds: ['b1'], defs: [] },
  })).toEqual({ b0: [],
    b1: ['d1', 'd2'], b2: ['d1', 'd2'],
    b3: ['d1', 'd2'] });
});
test('the chapter’s loop', () => {
  const r = reaching({
    b0: { preds: [], defs: [['i', 'd1'],
      ['x', 'd2']] },
    b1: { preds: ['b0', 'b2'],
      defs: [] },
    b2: { preds: ['b1'],
      defs: [['y', 'd3'], ['x', 'd4'],
        ['i', 'd5']] },
    b3: { preds: ['b1'], defs: [] },
  });
  expect(r.b3).toEqual(['d1', 'd2',
    'd3', 'd4', 'd5']);
});`,
    hints: [
      'Keep OUT for every block, starting as `[]`. Also make a map `varOf` from each defId to its variable name, so you can tell what a block kills.',
      'In one round, for each block: IN is a `Set` of everything in its predecessors’ OUT; OUT keeps the IN definitions whose variable the block does not assign, then adds the block’s own defIds.',
      'Sort OUT and compare it with the old one (`o.join() !== out[b].join()`). Keep doing rounds while some OUT changed.',
    ],
    walkthrough: `**How to think about it.** Write down the two equations from the chapter and decide how to represent the facts. A set of defIds is the natural fact; storing it as a sorted array makes two facts easy to compare (join them into strings) and lets the tests use \`toEqual\`. The kill set needs one piece of information the blocks don't hand you directly: which variable a defId belongs to. So first build \`varOf\`, mapping every defId to its name; then "b kills d" is "b assigns \`varOf[d]\`". Finally, the loop: this is a may problem, so OUT starts empty, and rounds repeat until nothing changes.

**The solution, line by line.**

- \`const varOf = {}; const out = {}; const inn = {};\` hold the name of each definition, and the OUT and IN facts.
- \`for (const b in blocks) { out[b] = []; ... }\` starts every OUT as the empty set (the guess union leaves alone), and the inner loop \`for (const [v, d] of blocks[b].defs) varOf[d] = v;\` records each definition's variable.
- \`let changed = true; while (changed) { changed = false;\` repeats rounds until one changes nothing: the fixpoint.
- \`for (const b in blocks) {\` visits every block in each round.
- \`const { preds, defs } = blocks[b];\` takes out its predecessors and definitions.
- \`const s = new Set(); for (const p of preds) for (const d of out[p]) { s.add(d); }\` is the meet: the union of the predecessors' OUT sets.
- \`inn[b] = [...s].sort();\` stores IN, sorted.
- \`const mine = new Set(defs.map(([v]) => v));\` is the set of variable names this block assigns.
- \`const o = inn[b].filter((d) => !mine.has(varOf[d]));\` is \`IN − kill\`: keep only the incoming definitions of variables this block does *not* assign.
- \`for (const [, d] of defs) { o.push(d); }\` adds gen: the block's own definitions (the empty slot before the comma skips the name).
- \`o.sort();\` keeps OUT sorted, so it can be compared.
- \`if (o.join() !== out[b].join()) { out[b] = o; changed = true; }\` stores a changed OUT and asks for another round.
- \`return inn;\` returns the definitions reaching the start of every block.

In the loop test, round 1 visits b1 before b2 has any OUT, so IN[b1] is just \`d1\`. Round 2 sees \`d2\` arrive along the back edge, and round 3 changes nothing.

**Common wrong attempts.**

- Doing a single round: with a loop, the body's definitions reach the header only after the back edge has been processed, so b1 and b3 miss them.
- Adding gen before removing kill (\`[...inn[b], ...own]\` and *then* filtering by the block's names): the filter also removes the block's own definitions, since they assign those very names.
- Using intersection at the join: that answers "which definitions reach along every path", which at the diamond's join gives only \`d2\`, losing \`d1\` and \`d3\`.`,
    wrong: [
      {
        code: `// blocks: { b: { preds: [...],
//   defs: [[name, defId], ...] } }
// Return { b: sorted defIds that
//   reach the start of b }.
function reaching(blocks) {
  const varOf = {};
  const out = {};
  const inn = {};
  for (const b in blocks) {
    out[b] = [];
    for (const [v, d] of blocks[b].defs)
      varOf[d] = v;
  }
  let changed = true;
  if (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, defs } = blocks[b];
      const s = new Set();
      for (const p of preds)
        for (const d of out[p]) {
          s.add(d);
        }
      inn[b] = [...s].sort();
      const mine = new Set(
        defs.map(([v]) => v));
      const o = inn[b].filter(
        (d) => !mine.has(varOf[d]));
      for (const [, d] of defs) {
        o.push(d);
      }
      o.sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
        why: 'One round is not enough with a loop: the definition from the loop body only reaches the header after the back edge has been processed.',
      },
      {
        code: `// blocks: { b: { preds: [...],
//   defs: [[name, defId], ...] } }
// Return { b: sorted defIds that
//   reach the start of b }.
function reaching(blocks) {
  const varOf = {};
  const out = {};
  const inn = {};
  for (const b in blocks) {
    out[b] = [];
    for (const [v, d] of blocks[b].defs)
      varOf[d] = v;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, defs } = blocks[b];
      const s = new Set();
      for (const p of preds)
        for (const d of out[p]) {
          s.add(d);
        }
      inn[b] = [...s].sort();
      const mine = new Set(
        defs.map(([v]) => v));
      const o = [...inn[b]];
      for (const [, d] of defs) {
        o.push(d);
      }
      o.sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
        why: 'Nothing is ever killed: d1 (x = 1) would still reach past a block that assigns x again.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A block is `d4: x = x + y`. Which is right about its gen and kill sets?',
    options: [
      {
        t: 'gen = {d4}, kill = the other definitions of x',
        correct: true,
        why: 'It creates d4, and after it x no longer holds any earlier definition’s value.',
      },
      {
        t: 'gen = {d4}, kill = the definitions of x and y',
        why: 'Reading y does not change y, so y’s definitions still reach past the block.',
      },
      {
        t: 'gen = { }, because it reads x before assigning it',
        why: 'Reading x first doesn’t matter: the assignment still creates a new definition of x.',
      },
    ],
  },
  {
    q: 'In `OUT = gen ∪ (IN − kill)`, why is kill removed before gen is added?',
    options: [
      {
        t: 'It isn’t; the order makes no difference.',
        why: 'It does once kill is computed the easy way, as every definition of the variables the block assigns: that kill holds the block’s own definitions too, and adding gen first would lose them.',
      },
      {
        t: 'Because gen is always empty in loops.',
        why: 'Loop bodies generate definitions like any other block.',
      },
      {
        t: 'So the block’s own definitions are not removed by the kill of their own variable.',
        correct: true,
        why: 'The block’s new definitions must leave the block; only the older ones are wiped out.',
      },
    ],
  },
  {
    q: 'Two definitions of `x` reach the start of a join block from its two predecessors. What does reaching definitions report there?',
    options: [
      {
        t: 'Neither: they cancel out.',
        why: 'Definitions never cancel each other at a join; they only die when x is assigned again.',
      },
      {
        t: 'Only the one from the first predecessor.',
        why: 'The analysis can’t know which way control came, so it keeps both.',
      },
      {
        t: 'Both: it is a may problem, and union keeps anything that arrives on some path.',
        correct: true,
        why: 'Either branch could have run, so either definition may have been the last.',
      },
    ],
  },
  {
    q: 'Why does reaching definitions need more than one round on a loop?',
    options: [
      {
        t: 'The loop body’s definitions reach the loop test only along the back edge, after the body has been computed once.',
        correct: true,
        why: 'In round one the body’s OUT is still empty when the header is visited.',
      },
      {
        t: 'Because union is slower than intersection.',
        why: 'Speed has nothing to do with it; the back edge does.',
      },
      {
        t: 'It doesn’t; one round is always enough.',
        why: 'Only without loops, visiting blocks after their predecessors.',
      },
    ],
  },
  {
    q: 'At `print x`, both `d2: x = 0` and `d4: x = x + y` reach. What can a constant-propagating compiler do with `print x`?',
    options: [
      {
        t: 'Replace x with 0.',
        why: 'That is right only if the loop never runs; d4 may have set x instead.',
      },
      {
        t: 'Delete the print.',
        why: 'Reaching definitions says nothing about whether a print is needed.',
      },
      {
        t: 'Leave x alone: two different definitions may reach, so x is not one known constant.',
        correct: true,
        why: 'Only a single reaching constant definition lets the use be replaced.',
      },
      {
        t: 'Replace x with x + y.',
        why: 'That would change the program when the loop runs zero times.',
      },
    ],
  },
];
