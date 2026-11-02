// Chapter 206 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'avail-what': {
    q: 'When is an expression **available** at a point?',
    a: 'When every path to that point computes it and no operand is assigned after that, on the way.',
  },
  'avail-kill': {
    q: 'In available expressions, which expressions does a block **kill**?',
    a: 'Every expression that uses a variable the block assigns.',
  },
  'avail-start': {
    q: 'Available expressions starts every OUT (except the entry’s) at “all expressions”. Why?',
    a: 'It is a must problem with meet intersection, and intersection leaves “all” alone; starting empty would lose expressions around loops.',
  },
  'self-kill': {
    q: 'Is `a + b` in the gen set of a block whose only line is `a = a + b`?',
    a: 'No: it is computed, then a changes at once, so it is not available at the block’s end.',
  },
  'busy-what': {
    q: 'When is an expression **very busy** at a point?',
    a: 'When every path from that point computes it before any of its operands is assigned.',
  },
  'busy-backward': {
    q: 'Why is very busy expressions a **backward** analysis?',
    a: 'It asks what happens on the paths ahead, so facts come from a block’s successors.',
  },
  'busy-gen': {
    q: 'For very busy expressions, which expressions are in a block’s gen set?',
    a: 'Those it computes before assigning any of their operands in the block.',
  },
  'four-problems': {
    q: 'Give the direction and meet of: reaching definitions, available expressions, very busy expressions, live variables.',
    a: 'Forward ∪; forward ∩; backward ∩; backward ∪.',
  },
};

export const examples = {
  busy: {
    title: 'Very busy expressions, from the exit up',
    code: `const U = ['a+b', 'a*2'];
const blocks = {
  b0: { succ: ['b1', 'b2'],
    gen: [], kill: [] },
  b1: { succ: ['b3'],
    gen: ['a+b', 'a*2'], kill: [] },
  b2: { succ: ['b3'], gen: ['a+b'],
    kill: ['a+b', 'a*2'] },
  b3: { succ: [], gen: ['a*2'],
    kill: [] },
};
const inn = {};
for (const b in blocks) inn[b] = U;
// No loop: four rounds are plenty.
for (let r = 0; r < 4; r++) {
  for (const b in blocks) {
    const { succ, gen, kill } =
      blocks[b];
    let out = succ.length ? U : [];
    for (const s of succ) {
      out = out.filter(
        (e) => inn[s].includes(e));
    }
    const keep = out.filter(
      (e) => !kill.includes(e));
    inn[b] = [...new Set([...gen,
      ...keep])];
  }
}
for (const b in blocks) {
  console.log(b, 'IN',
    inn[b].join(' '));
}`,
  },
};

export const exercises = {
  available: {
    title: 'Available expressions',
    prompt: `Write \`available(blocks, all, entry)\`. Each block has \`preds\`, and its \`gen\` and \`kill\` sets of expressions (arrays of strings such as \`'a+b'\`); \`all\` lists every expression in the function, and \`entry\` names the entry block.

Return, for every block, the **sorted** list of expressions available at its start:

- the entry starts with nothing available;
- any other block’s IN is the **intersection** of its predecessors’ OUT;
- OUT is \`gen ∪ (IN − kill)\`.

Start every OUT at \`all\`, and repeat rounds over the blocks until a round changes no OUT.`,
    starter: `// blocks: { b: { preds, gen, kill } }
// all: every expression in the code
// Return { b: sorted expressions
//   available at the start of b }.
function available(blocks, all, entry) {
  const inn = {};
  for (const b in blocks) inn[b] = [];
  return inn;
}`,
    solution: `// blocks: { b: { preds, gen, kill } }
// all: every expression in the code
// Return { b: sorted expressions
//   available at the start of b }.
function available(blocks, all, entry) {
  const out = {};
  const inn = {};
  for (const b in blocks) out[b] = all;
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, gen, kill } =
        blocks[b];
      let f = b === entry ? [] : all;
      for (const p of preds) {
        f = f.filter(
          (e) => out[p].includes(e));
      }
      inn[b] = [...f].sort();
      const keep = f.filter(
        (e) => !kill.includes(e));
      const o = [...new Set([...gen,
        ...keep])].sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
    tests: `const D = {
  b0: { preds: [], gen: ['a+b'],
    kill: [] },
  b1: { preds: ['b0'], gen: ['a*b'],
    kill: [] },
  b2: { preds: ['b0'], gen: ['a*b'],
    kill: ['a+b', 'a*b'] },
  b3: { preds: ['b1', 'b2'],
    gen: ['a*b', 'a+b'], kill: [] },
};
test('the chapter’s diamond', () => {
  expect(available(D,
    ['a*b', 'a+b'], 'b0')).toEqual({
    b0: [], b1: ['a+b'], b2: ['a+b'],
    b3: ['a*b'],
  });
});
test('a sum the loop never changes', () => {
  const L = {
    b0: { preds: [], gen: ['a+b'],
      kill: [] },
    b1: { preds: ['b0', 'b2'],
      gen: [], kill: [] },
    b2: { preds: ['b1'], gen: [],
      kill: ['i+1'] },
    b3: { preds: ['b1'], gen: [],
      kill: [] },
  };
  const r = available(L,
    ['a+b', 'i+1'], 'b0');
  expect(r.b1).toEqual(['a+b']);
  expect(r.b3).toEqual(['a+b']);
});`,
    hints: [
      'Keep OUT for every block, starting at `all`. Each round, visit every block; stop after a round where no OUT changed.',
      'For IN, start from `[]` for the entry and from `all` otherwise, then keep only what every predecessor’s OUT includes (`filter` with `includes`).',
      'For OUT, remove the kill set from IN, add the gen set, drop repeats with a `Set`, and sort, so OUT can be compared with the old one using `join()`.',
    ],
    walkthrough: `**How to think about it.** This is reaching definitions with two things changed: the meet is intersection (a must question) and the starting guess is "everything" rather than "nothing". The second change matters as much as the first. In the loop test, \`a + b\` is computed before the loop and never touched inside it, so it should be available at the loop test; however, the loop test's IN is the intersection of what comes from b0 and what comes round the back edge from b2, and in the first round b2 has not been computed yet. Starting b2's OUT at "all expressions" lets the intersection keep \`a + b\` until b2's real OUT confirms it; starting it empty would throw \`a + b\` away for good, since intersection can never bring it back.

**The solution, line by line.**

- \`const out = {}; const inn = {};\` hold the facts.
- \`for (const b in blocks) out[b] = all;\` is the optimistic start: every OUT is the top of the lattice.
- \`let changed = true; while (changed) { changed = false;\` repeats rounds until nothing changes.
- \`for (const b in blocks) {\` visits every block each round.
- \`const { preds, gen, kill } = blocks[b];\` takes out what the block holds.
- \`let f = b === entry ? [] : all;\` starts the meet. Nothing is available at the start of the function; any other block starts from "all", which intersection leaves alone.
- \`for (const p of preds) { f = f.filter((e) => out[p].includes(e)); }\` intersects with each predecessor's OUT.
- \`inn[b] = [...f].sort();\` stores IN, sorted.
- \`const keep = f.filter((e) => !kill.includes(e));\` is \`IN − kill\`.
- \`const o = [...new Set([...gen, ...keep])].sort();\` adds gen, drops repeats and sorts.
- \`if (o.join() !== out[b].join()) { out[b] = o; changed = true; }\` stores a changed OUT and asks for another round.
- \`return inn;\`

On the diamond, b3's IN is \`['a*b','a+b']\` from b1 intersected with \`['a*b']\` from b2, which is \`['a*b']\`, the chapter's answer.

**Common wrong attempts.**

- Starting every OUT empty: the loop test keeps nothing, because the back edge's empty OUT wipes out \`a + b\` in the first round, and intersection never adds it back.
- Using union at the join: on the diamond, \`a + b\` would count as available at b3 even though b2 changed \`a\`.
- Starting the entry from \`all\` as well: then every expression is "available" before the function has computed anything.`,
    wrong: [
      {
        code: `// blocks: { b: { preds, gen, kill } }
// all: every expression in the code
// Return { b: sorted expressions
//   available at the start of b }.
function available(blocks, all, entry) {
  const out = {};
  const inn = {};
  for (const b in blocks) out[b] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, gen, kill } =
        blocks[b];
      let f = b === entry ? [] : all;
      for (const p of preds) {
        f = f.filter(
          (e) => out[p].includes(e));
      }
      inn[b] = [...f].sort();
      const keep = f.filter(
        (e) => !kill.includes(e));
      const o = [...new Set([...gen,
        ...keep])].sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
        why: 'A pessimistic start: the back edge’s empty OUT removes a + b from the loop test in the first round, and intersection can never bring it back.',
      },
      {
        code: `// blocks: { b: { preds, gen, kill } }
// all: every expression in the code
// Return { b: sorted expressions
//   available at the start of b }.
function available(blocks, all, entry) {
  const out = {};
  const inn = {};
  for (const b in blocks) out[b] = all;
  let changed = true;
  while (changed) {
    changed = false;
    for (const b in blocks) {
      const { preds, gen, kill } =
        blocks[b];
      let f = b === entry ? [] : all;
      for (const p of preds) {
        f = [...new Set([...f,
          ...out[p]])];
      }
      inn[b] = [...f].sort();
      const keep = f.filter(
        (e) => !kill.includes(e));
      const o = [...new Set([...gen,
        ...keep])].sort();
      if (o.join() !== out[b].join()) {
        out[b] = o;
        changed = true;
      }
    }
  }
  return inn;
}`,
        why: 'Union instead of intersection (and starting from all): every expression looks available everywhere, including a + b at the diamond’s join.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A block is `t = a + b; a = 1`. In available expressions, which gen and kill sets are right?',
    options: [
      {
        t: 'gen = {a+b}, kill = { }',
        why: 'a = 1 runs after the sum, so the sum is out of date by the block’s end.',
      },
      {
        t: 'gen = { }, kill = every expression using a',
        correct: true,
        why: 'a + b is computed and then killed in the same block, so it does not leave it.',
      },
      {
        t: 'gen = {a+b}, kill = every expression using a',
        why: 'Kill is right, but a + b is killed after it is computed, so it cannot be in gen.',
      },
    ],
  },
  {
    q: 'At a join, OUT of the predecessors is `{a+b, a*b}` and `{a*b}`. What is available at the join’s start?',
    options: [
      {
        t: '`{a+b, a*b}`',
        why: 'That is the union, the answer to a may question.',
      },
      {
        t: '`{a*b}`',
        correct: true,
        why: 'Available is a must question: only what every way in brings.',
      },
      {
        t: '`{ }`',
        why: 'The two sets share a*b.',
      },
    ],
  },
  {
    q: 'Why does very busy expressions flow backward?',
    options: [
      {
        t: 'Because its meet is intersection.',
        why: 'Available expressions also uses intersection and flows forward. The direction comes from the question.',
      },
      {
        t: 'Because it is cheaper to compute.',
        why: 'Cost has nothing to do with it.',
      },
      {
        t: 'It asks about computations on the paths ahead, so facts come from successors.',
        correct: true,
        why: '“Will every path compute it next?” is about the future of a point.',
      },
    ],
  },
  {
    q: 'The `then` branch of an `if` is `x = a + b`, and the `else` branch is `a = 0; y = a + b`. Can `a + b` be hoisted to just before the `if`?',
    options: [
      {
        t: 'Yes: both branches compute a + b.',
        why: 'The else branch computes it with a new a, so a value from before the if would be wrong there.',
      },
      {
        t: 'No: on the else path, a changes before a + b is computed, so it is not very busy at the if.',
        correct: true,
        why: 'Very busy needs every path to compute it before any operand changes.',
      },
      {
        t: 'Only if a + b is also available at the if.',
        why: 'Hoisting needs it very busy at the new place, not already available.',
      },
    ],
  },
  {
    q: 'Which pair of dataflow directions and meets is right?',
    options: [
      {
        t: 'Reaching definitions: backward, union. Live variables: forward, intersection.',
        why: 'Both are reversed: reaching definitions is forward ∪, live variables backward ∪.',
      },
      {
        t: 'Available expressions: forward, intersection. Very busy expressions: backward, intersection.',
        correct: true,
        why: 'Both are must problems; one looks back, the other ahead.',
      },
      {
        t: 'Available expressions: backward, union. Very busy: forward, union.',
        why: 'Both are must problems (intersection), and available looks back (forward flow).',
      },
    ],
  },
];
