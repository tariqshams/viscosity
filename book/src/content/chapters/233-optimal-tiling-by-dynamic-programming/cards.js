// Cards for "Optimal tiling by dynamic programming": recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'munch-fooled': {
    q: 'With `sh3add` costing 3 and every other instruction 1, what does maximal munch pay for `ADD(SHL(i, CONST 3), CONST 8)`, and what is the cheapest?',
    a: 'Munch takes sh3add (3) and then needs li for the 8 (1): 4. The cheapest is slli + addi: 2.',
  },
  'size-vs-cost': {
    q: 'Why can the biggest tile lead to a dearer cover?',
    a: 'Size is how many nodes a tile covers, not what it costs; a big tile may be slow, or may force its leaves into extra instructions.',
  },
  'dp-what': {
    q: 'What is **dynamic programming**?',
    a: 'Solving each smaller problem once, writing the answer down, and building bigger answers from the stored ones instead of solving anything twice.',
  },
  'dp-why-once': {
    q: 'In optimal tree tiling where every tile leaves its result in a register, why can the best cost of a subtree be worked out once and reused?',
    a: 'The cheapest way to compute a subtree into a register does not depend on what is above it, so every tile at the parent can use the same number.',
  },
  'two-passes': {
    q: 'What are the two passes of optimal tiling?',
    a: 'Bottom-up: label each node with best(n) and the tile that achieves it. Top-down: follow the chosen tiles from the root and write each instruction after its children’s.',
  },
  'best-leaf': {
    q: 'In optimal tiling by dynamic programming, what is the best cost of a node whose value is already in a register?',
    a: 'Zero: no instruction is needed to compute it.',
  },
  'dp-cost': {
    q: 'With every RISC-V instruction costing 1, why does the addi tile (total 1) beat the add tile (total 2) at the root of `ADD(a0, CONST 5)`?',
    a: 'add needs the 5 in a register too (an li, cost 1) plus its own instruction; addi carries the 5 inside.',
  },
  'dp-tree-only': {
    q: 'Why does the dynamic programming guarantee break on a graph where one node feeds two parents?',
    a: 'The two parents’ tiles must agree about the shared node, so its best cost is no longer independent of what is above it.',
  },
};

export const examples = {
  'munch-vs-best': {
    title: 'Maximal munch against the cheapest cover',
    code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });
const small = (t) => t.op === 'k' &&
  t.v >= -2048 && t.v <= 2047;
const isShl3 = (t) => t.op === 'shl' &&
  t.r.v === 3;

// A tile: instruction, cost, nodes it
// covers, and match(t): the subtrees
// at its leaves (null if no fit).
const TILES = [
  { ins: 'li', cost: 1, size: 1,
    match: (t) => t.op === 'k'
      ? [] : null },
  { ins: 'add', cost: 1, size: 1,
    match: (t) => t.op === 'add'
      ? [t.l, t.r] : null },
  { ins: 'addi', cost: 1, size: 2,
    match: (t) => t.op === 'add' &&
      small(t.r) ? [t.l] : null },
  { ins: 'slli', cost: 1, size: 2,
    match: (t) => t.op === 'shl'
      ? [t.l] : null },
  { ins: 'sh3add', cost: 3, size: 3,
    match: (t) => t.op === 'add' &&
      isShl3(t.l)
      ? [t.l.l, t.r] : null },
];

const choice = new Map();

function best(t) {
  if (t.op === 'reg') return 0;
  if (choice.has(t)) {
    return choice.get(t).cost;
  }
  let win = null;
  for (const tile of TILES) {
    const leaves = tile.match(t);
    if (!leaves) continue;
    let c = tile.cost;
    for (const x of leaves) {
      c += best(x);
    }
    if (!win || c < win.cost) {
      win = { tile, cost: c };
    }
  }
  choice.set(t, win);
  return win.cost;
}

// Munch: biggest tile, not cheapest.
function munch(t) {
  if (t.op === 'reg') return 0;
  let big = null;
  for (const tile of TILES) {
    if (!tile.match(t)) continue;
    if (!big || tile.size > big.size) {
      big = tile;
    }
  }
  let c = big.cost;
  for (const x of big.match(t)) {
    c += munch(x);
  }
  return c;
}

// The chosen tiles, children first.
function cover(t, out = []) {
  if (t.op === 'reg') return out;
  const { tile } = choice.get(t);
  for (const x of tile.match(t)) {
    cover(x, out);
  }
  out.push(tile.ins);
  return out;
}

const t = N('add',
  N('shl', R('i'), K(3)), K(8));
console.log('munch cost:', munch(t));
console.log('best cost:', best(t));
console.log('best tiles:', cover(t));`,
  },
};

export const exercises = {
  best: {
    title: 'Label a tree with its cheapest cover',
    prompt: 'Write `best(t)`, the bottom-up pass of optimal tiling. It returns the cost of the cheapest cover of tree `t` and records, in the map `choice`, an object `{ tile, cost }` for `t` (and, through its recursive calls, for every node below). A register (`op: \'reg\'`) costs 0 and has no entry. For any other node, try **every** tile in `TILES` whose `match(t)` is not `null`: its cost is `tile.cost` plus `best` of each subtree in the array `match(t)` returns; keep the smallest. The starter takes the first tile that matches, which is why `i × 8 + 8` costs it 3.',
    starter: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });
const small = (t) => t.op === 'k' &&
  t.v >= -2048 && t.v <= 2047;
const isShl3 = (t) => t.op === 'shl' &&
  t.r.v === 3;

// A tile: instruction, cost, nodes it
// covers, and match(t): the subtrees
// at its leaves (null if no fit).
const TILES = [
  { ins: 'li', cost: 1, size: 1,
    match: (t) => t.op === 'k'
      ? [] : null },
  { ins: 'add', cost: 1, size: 1,
    match: (t) => t.op === 'add'
      ? [t.l, t.r] : null },
  { ins: 'addi', cost: 1, size: 2,
    match: (t) => t.op === 'add' &&
      small(t.r) ? [t.l] : null },
  { ins: 'slli', cost: 1, size: 2,
    match: (t) => t.op === 'shl'
      ? [t.l] : null },
  { ins: 'sh3add', cost: 3, size: 3,
    match: (t) => t.op === 'add' &&
      isShl3(t.l)
      ? [t.l.l, t.r] : null },
];

const choice = new Map();

// Fill in: try every tile that
// matches and keep the cheapest. For
// now it takes the first match.
function best(t) {
  if (t.op === 'reg') return 0;
  const tile =
    TILES.find((x) => x.match(t));
  let c = tile.cost;
  for (const x of tile.match(t)) {
    c += best(x);
  }
  choice.set(t, { tile, cost: c });
  return c;
}`,
    solution: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });
const small = (t) => t.op === 'k' &&
  t.v >= -2048 && t.v <= 2047;
const isShl3 = (t) => t.op === 'shl' &&
  t.r.v === 3;

// A tile: instruction, cost, nodes it
// covers, and match(t): the subtrees
// at its leaves (null if no fit).
const TILES = [
  { ins: 'li', cost: 1, size: 1,
    match: (t) => t.op === 'k'
      ? [] : null },
  { ins: 'add', cost: 1, size: 1,
    match: (t) => t.op === 'add'
      ? [t.l, t.r] : null },
  { ins: 'addi', cost: 1, size: 2,
    match: (t) => t.op === 'add' &&
      small(t.r) ? [t.l] : null },
  { ins: 'slli', cost: 1, size: 2,
    match: (t) => t.op === 'shl'
      ? [t.l] : null },
  { ins: 'sh3add', cost: 3, size: 3,
    match: (t) => t.op === 'add' &&
      isShl3(t.l)
      ? [t.l.l, t.r] : null },
];

const choice = new Map();

function best(t) {
  if (t.op === 'reg') return 0;
  if (choice.has(t)) {
    return choice.get(t).cost;
  }
  let win = null;
  for (const tile of TILES) {
    const leaves = tile.match(t);
    if (!leaves) continue;
    let c = tile.cost;
    for (const x of leaves) {
      c += best(x);
    }
    if (!win || c < win.cost) {
      win = { tile, cost: c };
    }
  }
  choice.set(t, win);
  return win.cost;
}`,
    tests: `test('i*8 + 8 costs 2, with addi at the root', () => {
  const t = N('add',
    N('shl', R('i'), K(3)), K(8));
  expect(best(t)).toBe(2);
  expect(choice.get(t).tile.ins).toBe('addi');
});
test('the shift underneath chose slli', () => {
  const s = N('shl', R('i'), K(3));
  best(N('add', s, K(8)));
  expect(choice.get(s).tile.ins).toBe('slli');
});
test('x + 5 costs 1 (addi beats li + add)', () => {
  const t = N('add', R('a0'), K(5));
  expect(best(t)).toBe(1);
  expect(choice.get(t).tile.ins).toBe('addi');
});
test('a register costs nothing', () => {
  expect(best(R('a0'))).toBe(0);
});
test('x + 5000 costs 2 (li, then add)', () => {
  const t = N('add', R('a0'), K(5000));
  expect(best(t)).toBe(2);
  expect(choice.get(t).tile.ins).toBe('add');
});
test('a cheap sh3add wins', () => {
  const old = TILES[4].cost;
  TILES[4].cost = 1;
  const t = N('add',
    N('shl', R('i'), K(3)), R('a0'));
  const c = best(t);
  TILES[4].cost = old;
  expect(c).toBe(1);
  expect(choice.get(t).tile.ins).toBe('sh3add');
});`,
    hints: [
      'You need a loop over all of `TILES`, skipping the ones whose `match(t)` returns `null`, and a variable holding the best option seen so far.',
      'For each matching tile, its total is `tile.cost` plus `best(x)` for every `x` in `tile.match(t)`. Compare totals with `<`, and remember both the tile and its total.',
      'Keep `let win = null;`, and inside the loop `if (!win || c < win.cost) win = { tile, cost: c };`. After the loop, `choice.set(t, win)` and `return win.cost`. (Checking `choice.has(t)` at the start, and returning the stored cost, makes each node cost its work only once.)',
    ],
    walkthrough: `**How to think about it.** The formula says: the best cost of a node is the minimum, over every tile that matches there, of that tile's own cost plus the best costs of the subtrees at its leaves. Each \`best(x)\` is a smaller instance of the same problem, so the function calls itself, and by the time a node compares its options, all of its subtrees' numbers are known. The only real change from the starter is *trying all the tiles* instead of the first; the second, smaller change is remembering the answer so it is never worked out twice.

**The solution, line by line.**

- \`const choice = new Map();\` is the "margin" where answers are written: node object to \`{ tile, cost }\`. A \`Map\` can use the node objects themselves as keys.
- \`if (t.op === 'reg') return 0;\` is the base case: a value already in a register needs no instruction.
- \`if (choice.has(t)) { return choice.get(t).cost; }\` returns a stored answer instead of recomputing it. This is the "do each subproblem once" part: three tiles at the root of \`i × 8 + 8\` all ask about the subtrees, and each answer is computed once.
- \`let win = null;\` will hold the cheapest option found so far.
- \`for (const tile of TILES) {\` tries every tile.
- \`const leaves = tile.match(t); if (!leaves) continue;\` skips tiles that do not fit here. For a fitting tile, \`leaves\` is the list of subtrees it leaves uncovered (empty for \`li\`).
- \`let c = tile.cost;\` starts the total with the tile's own instruction, then \`for (const x of leaves) { c += best(x); }\` adds the best cost of each leftover subtree.
- \`if (!win || c < win.cost) { win = { tile, cost: c }; }\` keeps the option if it is the first or cheaper than the best so far. With \`<\`, the earlier tile in \`TILES\` wins a tie, so the result does not change if you run it twice.
- \`choice.set(t, win); return win.cost;\` writes the answer down and returns it.

For \`ADD(SHL(i, 3), 8)\`: \`add\` costs 1 + 1 (the SHL, by \`slli\`) + 1 (the 8, by \`li\`) = 3; \`addi\` costs 1 + 1 = 2; \`sh3add\` costs 3 + 0 (i is in a register) + 1 = 4. The minimum is 2, with \`addi\`, and the stored choice for the SHL is \`slli\`. In the last test \`sh3add\` costs 1 and the right operand is a register, so \`sh3add\` totals 1 + 0 + 0 = 1 against \`add\`'s 1 + 1 + 0 = 2, and wins.

**Common wrong attempts.**

- Choosing by size (keeping the tile that covers most nodes): that is maximal munch again, and it pays 4 for the first test.
- Comparing only \`tile.cost\`, without adding the leaves' best costs: \`add\` and \`addi\` then both look like 1, and the answer ignores the \`li\` the 8 would need.
- Forgetting the \`reg\` base case: the recursion reaches a register leaf, no tile matches, and \`win\` stays \`null\`.`,
    wrong: [
      {
        code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });
const small = (t) => t.op === 'k' &&
  t.v >= -2048 && t.v <= 2047;
const isShl3 = (t) => t.op === 'shl' &&
  t.r.v === 3;

// A tile: instruction, cost, nodes it
// covers, and match(t): the subtrees
// at its leaves (null if no fit).
const TILES = [
  { ins: 'li', cost: 1, size: 1,
    match: (t) => t.op === 'k'
      ? [] : null },
  { ins: 'add', cost: 1, size: 1,
    match: (t) => t.op === 'add'
      ? [t.l, t.r] : null },
  { ins: 'addi', cost: 1, size: 2,
    match: (t) => t.op === 'add' &&
      small(t.r) ? [t.l] : null },
  { ins: 'slli', cost: 1, size: 2,
    match: (t) => t.op === 'shl'
      ? [t.l] : null },
  { ins: 'sh3add', cost: 3, size: 3,
    match: (t) => t.op === 'add' &&
      isShl3(t.l)
      ? [t.l.l, t.r] : null },
];

const choice = new Map();

function best(t) {
  if (t.op === 'reg') return 0;
  let win = null;
  for (const tile of TILES) {
    const leaves = tile.match(t);
    if (!leaves) continue;
    const big = tile.size;
    if (!win || big > win.tile.size) {
      let c = tile.cost;
      for (const x of leaves) {
        c += best(x);
      }
      win = { tile, cost: c };
    }
  }
  choice.set(t, win);
  return win.cost;
}`,
        why: 'This keeps the biggest tile, not the cheapest: it is maximal munch, and pays 4 for `i × 8 + 8`.',
      },
      {
        code: `const R = (s) => ({ op: 'reg', s });
const K = (v) => ({ op: 'k', v });
const N = (op, l, r) => ({ op, l, r });
const small = (t) => t.op === 'k' &&
  t.v >= -2048 && t.v <= 2047;
const isShl3 = (t) => t.op === 'shl' &&
  t.r.v === 3;

// A tile: instruction, cost, nodes it
// covers, and match(t): the subtrees
// at its leaves (null if no fit).
const TILES = [
  { ins: 'li', cost: 1, size: 1,
    match: (t) => t.op === 'k'
      ? [] : null },
  { ins: 'add', cost: 1, size: 1,
    match: (t) => t.op === 'add'
      ? [t.l, t.r] : null },
  { ins: 'addi', cost: 1, size: 2,
    match: (t) => t.op === 'add' &&
      small(t.r) ? [t.l] : null },
  { ins: 'slli', cost: 1, size: 2,
    match: (t) => t.op === 'shl'
      ? [t.l] : null },
  { ins: 'sh3add', cost: 3, size: 3,
    match: (t) => t.op === 'add' &&
      isShl3(t.l)
      ? [t.l.l, t.r] : null },
];

const choice = new Map();

function best(t) {
  if (t.op === 'reg') return 0;
  let win = null;
  for (const tile of TILES) {
    if (!tile.match(t)) continue;
    const c = tile.cost;
    if (!win || c < win.cost) {
      win = { tile, cost: c };
    }
  }
  choice.set(t, win);
  return win.cost;
}`,
        why: 'This compares only each tile’s own cost and forgets the subtrees at its leaves, so `i × 8 + 8` comes out as 1.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In optimal tiling of an expression tree, what is `best(n)` for a node n?',
    options: [
      {
        t: 'The cost of the biggest tile that matches at n',
        why: 'That is how maximal munch chooses; best(n) compares every tile.',
      },
      {
        t: 'The smallest total cost of any cover of the subtree rooted at n',
        correct: true,
        why: 'It is the minimum over tiles matching at n of the tile’s cost plus best of its leaf subtrees.',
      },
      {
        t: 'The number of nodes under n',
        why: 'Size is not cost; the whole point is that they can disagree.',
      },
    ],
  },
  {
    q: 'With RISC-V tiles where sh3add costs 3 and every other instruction 1, which cover of `ADD(SHL(i, CONST 3), CONST 8)` is cheapest?',
    options: [
      {
        t: 'li for the 8, then sh3add',
        why: 'That is maximal munch’s choice, costing 4.',
      },
      {
        t: 'li for the 3, slli, li for the 8, add',
        why: 'slli carries the 3 itself, and addi carries the 8; this costs far more.',
      },
      {
        t: 'slli, then addi',
        correct: true,
        why: '1 + 1 = 2, the smallest total.',
      },
    ],
  },
  {
    q: 'Why is the bottom-up labelling pass fast even though many tilings are possible?',
    options: [
      {
        t: 'Each node’s best cost is computed once and looked up by every tile that needs it',
        correct: true,
        why: 'That is dynamic programming: the alternatives at a node share the stored answers of their subtrees.',
      },
      {
        t: 'It stops at the first tile that matches',
        why: 'Then it would not be optimal; it tries every tile at each node.',
      },
      {
        t: 'Trees are always small',
        why: 'Speed comes from not repeating work, not from small inputs.',
      },
    ],
  },
  {
    q: 'After labelling, how are the instructions produced?',
    options: [
      {
        t: 'Bottom-up, writing every tile that matched at every node',
        why: 'Only the chosen tiles become instructions, and many nodes are covered by a tile chosen above them.',
      },
      {
        t: 'Top-down from the root, following the chosen tiles to their leaves, writing each tile after its children',
        correct: true,
        why: 'Nodes inside a chosen tile get no instruction of their own; the order puts operands first.',
      },
      {
        t: 'In the order the nodes appear in the IR',
        why: 'The order comes from the tree and the chosen tiles.',
      },
    ],
  },
  {
    q: 'What do Twig and iburg have in common?',
    options: [
      {
        t: 'Both are register allocators',
        why: 'They are code-generator generators for instruction selection.',
      },
      {
        t: 'Both read tree patterns with costs and produce code generators that find the cheapest cover by dynamic programming',
        correct: true,
        why: 'Twig (Aho, Ganapathi and Tjiang) and iburg (Fraser, Hanson and Proebsting) both work this way.',
      },
      {
        t: 'Both are parts of LLVM',
        why: 'Neither is; LLVM generates its selector from .td patterns over a DAG.',
      },
    ],
  },
];
