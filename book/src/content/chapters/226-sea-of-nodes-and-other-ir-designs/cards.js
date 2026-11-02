// Chapter 226 cards. Keys are stable ids: never rename them.

export const prompts = {
  'graph-what': {
    q: 'What is a graph IR?',
    a: 'An IR whose nodes are operations and whose edges say which operation uses which, instead of a list in a fixed order.',
  },
  'list-hides': {
    q: 'In `t1 = a * 2; t2 = b * 2`, what does the list state that the program does not need?',
    a: 'That `t1` is computed before `t2`; nothing depends on that order.',
  },
  'son-what': {
    q: 'What orders the instructions in a sea of nodes?',
    a: 'Only dependencies: data edges (which value feeds which) and control edges (and, in TurboFan, effect edges for memory operations).',
  },
  'son-float': {
    q: 'What does it mean for a node to float?',
    a: 'It has no control edge, so it belongs to no block; only its inputs and its uses limit where it may be placed.',
  },
  'gcm-rule': {
    q: 'Between its early and late blocks, where does global code motion place a node?',
    a: 'On the dominator-tree path from late to early, in the block with the least loop depth, and as late as possible among those.',
  },
  'v8-left': {
    q: 'Name two reasons the V8 team gave for replacing TurboFan’s sea of nodes with Turboshaft.',
    a: 'Any two of: most JavaScript nodes end up on the effect or control chain anyway; graphs are hard to read; managing effect and control chains by hand caused bugs; compiling was slow.',
  },
  'cps-what': {
    q: 'In continuation-passing style, what does a function do instead of returning?',
    a: 'It calls its continuation (a callback saying what to do next) with the result.',
  },
  'dialect-what': {
    q: 'What is an MLIR dialect?',
    a: 'A named set of operations, types and attributes (like `affine` or `llvm`); several can coexist in one program.',
  },
  'progressive': {
    q: 'What is progressive lowering?',
    a: 'Translating a program through a sequence of dialects, a few operations at a time, from high-level to close to the machine.',
  },
};

export const examples = {
  cps: {
    title: 'One computation, three ways',
    code: `const g = (x) => x * 10;

// Direct style: nested calls.
console.log(g(2) + 1);

// ANF: every intermediate is named.
const t1 = g(2);
const t2 = t1 + 1;
console.log(t2);

// CPS: each step is told what is next.
const gk = (x, k) => k(x * 10);
const addk = (a, b, k) => k(a + b);
gk(2, (u1) =>
  addk(u1, 1, (u2) =>
    console.log(u2)));`,
  },
};

export const exercises = {
  placeNode: {
    title: 'Place a floating node',
    prompt:
      'Global code motion has already found a node’s **early** block. `idom` maps each block to its immediate dominator (`null` for the entry), and `depth` maps each block to its loop depth. Write `place(idom, depth, early, uses)`, where `uses` is a non-empty array of the blocks that use the node: first find **late**, the nearest common dominator of all the use blocks; then walk up the dominator tree from late to early (both included) and return the block with the **smallest loop depth**, preferring the one nearest late when several tie.',
    starter: `function place(idom, depth, early,
  uses) {
  // your code here
  return early;
}`,
    solution: `function place(idom, depth, early,
  uses) {
  const up = (b) => {
    const p = [];
    while (b !== null) {
      p.push(b);
      b = idom[b];
    }
    return p;
  };
  let late = uses[0];
  for (const u of uses) {
    const doms = up(u);
    while (!doms.includes(late)) {
      late = idom[late];
    }
  }
  let best = late;
  let b = late;
  while (true) {
    if (depth[b] < depth[best]) {
      best = b;
    }
    if (b === early) break;
    b = idom[b];
  }
  return best;
}`,
    tests: `// e -> h (loop header) -> body -> h;
// h -> x; x -> t, x -> f; t, f -> j
const idom = { e: null, h: 'e', body: 'h',
  x: 'h', t: 'x', f: 'x', j: 'x' };
const depth = { e: 0, h: 1, body: 1,
  x: 0, t: 0, f: 0, j: 0 };
test('used in a loop: hoisted out', () => {
  expect(place(idom, depth, 'e', ['body'])).toBe('e');
});
test('used in one arm: sunk into it', () => {
  expect(place(idom, depth, 'e', ['t'])).toBe('t');
});
test('used in both arms: at the branch', () => {
  expect(place(idom, depth, 'e', ['t', 'f'])).toBe('x');
});
test('input made in the loop: stays in', () => {
  expect(place(idom, depth, 'h', ['body'])).toBe('body');
});
test('uses in an arm and at the join', () => {
  expect(place(idom, depth, 'e', ['j', 't'])).toBe('x');
});`,
    hints: [
      'Do it in two parts: first find late from the uses, then walk from late towards early.',
      'For late, start at the first use block. For every use, move late up (`late = idom[late]`) until late is that use block or one of its dominators. A helper that lists a block and all its dominators makes this easy.',
      'For the walk, start with `best = late` and go up through `idom` until you reach `early`, replacing `best` only when the depth is strictly smaller, so ties keep the block nearest late.',
    ],
    walkthrough: `**How to think about it.** A floating node may go in any block that comes after all its inputs and before all its uses. "After all its inputs" is \`early\`, which you are given. "Before all its uses" means a block that dominates every use, so that the value has always been computed by the time any use runs; the latest such block is the nearest common dominator of the use blocks, \`late\`. Every legal block lies on the dominator-tree path from \`late\` up to \`early\`. Among them, a block inside fewer loops runs fewer times, so loop depth comes first; and among blocks with equal depth, later is better, because a later block is reached on fewer paths (the arm of an \`if\` instead of the code before it).

**The solution, line by line.**

- \`const up = (b) => { ... }\` returns \`b\` followed by all its dominators: push \`b\`, step to \`idom[b]\`, and stop after the entry, whose \`idom\` is \`null\`.
- \`let late = uses[0];\` starts with the first use block, which certainly dominates itself.
- \`for (const u of uses) {\` makes \`late\` dominate every use in turn.
- \`const doms = up(u);\` lists the blocks that dominate \`u\` (including \`u\`).
- \`while (!doms.includes(late)) { late = idom[late]; }\` climbs from \`late\` until it reaches one of them. Since \`late\` only ever climbs, it still dominates the earlier uses; and since it climbs one step at a time, it stops at the *nearest* common dominator.
- \`let best = late; let b = late;\` begins the walk at the latest legal block.
- \`if (depth[b] < depth[best]) { best = b; }\` keeps a block only if it is in strictly fewer loops, so on a tie the earlier choice, nearer \`late\`, stays.
- \`if (b === early) break;\` stops once \`early\` itself has been considered.
- \`b = idom[b];\` moves one step up the dominator tree.
- \`return best;\` is the placement.

In the tests, a use inside the loop body gives \`late = body\`, and the walk \`body, h, e\` finds depth 0 at \`e\`: the node is hoisted out of the loop, which is loop-invariant code motion. A use only in \`t\` keeps the node in \`t\`, so the other arm never computes it. Uses in both \`t\` and \`f\` meet at \`x\`, the branch block.

**Common wrong attempts.**

- Returning \`late\` straight away forgets loops: a node used inside the loop is then computed on every trip.
- Returning \`early\` straight away computes everything as soon as possible, even values only one arm needs (this is what the starter does).
- Using \`<=\` in the comparison moves a node as early as possible among equal depths, so \`['t']\` gives \`e\` instead of \`t\`.`,
    wrong: [
      {
        code: `function place(idom, depth, early,
  uses) {
  const up = (b) => {
    const p = [];
    while (b !== null) {
      p.push(b);
      b = idom[b];
    }
    return p;
  };
  let late = uses[0];
  for (const u of uses) {
    const doms = up(u);
    while (!doms.includes(late)) {
      late = idom[late];
    }
  }
  return late;
}`,
        why: 'It ignores loop depth. A node used in the loop body stays in the body and runs on every trip, instead of being hoisted to `e`.',
      },
      {
        code: `function place(idom, depth, early,
  uses) {
  const up = (b) => {
    const p = [];
    while (b !== null) {
      p.push(b);
      b = idom[b];
    }
    return p;
  };
  let late = uses[0];
  for (const u of uses) {
    const doms = up(u);
    while (!doms.includes(late)) {
      late = idom[late];
    }
  }
  let best = late;
  let b = late;
  while (true) {
    if (depth[b] <= depth[best]) {
      best = b;
    }
    if (b === early) break;
    b = idom[b];
  }
  return best;
}`,
        why: 'With `<=`, ties move the node up, as early as possible: a value used only in `t` ends up in `e`, computed even when the other arm runs.',
      },
    ],
  },
  toAnf: {
    optional: true,
    title: 'Name every intermediate (ANF)',
    prompt:
      'An expression is a name (a string such as `\'a\'`) or `[op, left, right]`, e.g. `[\'+\', [\'*\', \'a\', \'b\'], \'c\']`. Write `toAnf(e)`, returning the lines of its A-normal form: each operation gets a fresh temporary `t1`, `t2`, ... in the order it is evaluated (left before right), as strings like `\'t1 = a * b\'`. For a plain name, return no lines.',
    starter: `function toAnf(e) {
  const lines = [];
  // your code here
  return lines;
}

console.log(toAnf(
  ['+', ['*', 'a', 'b'], 'c']));`,
    solution: `function toAnf(e) {
  const lines = [];
  let n = 0;
  const go = (x) => {
    if (typeof x === 'string') return x;
    const a = go(x[1]);
    const b = go(x[2]);
    const t = 't' + ++n;
    lines.push(t + ' = ' + a + ' ' +
      x[0] + ' ' + b);
    return t;
  };
  go(e);
  return lines;
}`,
    tests: `test('a name needs no lines', () => {
  expect(toAnf('a')).toEqual([]);
});
test('one operation', () => {
  expect(toAnf(['-', 'a', 'b'])).toEqual(['t1 = a - b']);
});
test('nested on the left', () => {
  expect(toAnf(['+', ['*', 'a', 'b'], 'c']))
    .toEqual(['t1 = a * b', 't2 = t1 + c']);
});
test('left before right', () => {
  expect(toAnf(['*', ['+', 'a', 'b'], ['-', 'c', 'd']]))
    .toEqual(['t1 = a + b', 't2 = c - d', 't3 = t1 * t2']);
});`,
    hints: [
      'Write a helper that turns any expression into a *name* holding its value, adding lines as it goes.',
      'A string is already a name: return it. For `[op, l, r]`, first get names for `l` and then `r`, then make a new temporary for the operation.',
      'Keep a counter for the temporaries, and push `t + \' = \' + a + \' \' + op + \' \' + b` before returning `t`.',
    ],
    walkthrough: `**How to think about it.** ANF names every intermediate value, so every operation's operands must be plain names. Think recursively: whatever the expression, I can turn it into a name that holds its value. A name already is one; an operation needs its two operands turned into names first (left, then right, which fixes the order of evaluation), and then one new temporary for itself.

**The solution, line by line.**

- \`const lines = [];\` collects the output; \`let n = 0;\` counts temporaries.
- \`const go = (x) => {\` returns a name holding the value of \`x\`.
- \`if (typeof x === 'string') return x;\` a name needs no work and no line.
- \`const a = go(x[1]);\` names the left operand first, adding any lines it needs.
- \`const b = go(x[2]);\` then the right operand.
- \`const t = 't' + ++n;\` makes the next temporary: \`++n\` adds one before the value is used, so the first is \`t1\`.
- \`lines.push(t + ' = ' + a + ' ' + x[0] + ' ' + b);\` records the operation on names only.
- \`return t;\` hands the temporary back to whoever needed this value.
- \`go(e); return lines;\` runs it on the whole expression.

**Common wrong attempts.**

- Making the temporary *before* naming the operands numbers the outer operation first, so \`t1 = t2 + c\` uses \`t2\` before it exists.
- Naming the right operand before the left changes the order of evaluation, which matters in a language where operands can have side effects.`,
    wrong: [
      {
        code: `function toAnf(e) {
  const lines = [];
  let n = 0;
  const go = (x) => {
    if (typeof x === 'string') return x;
    const t = 't' + ++n;
    const a = go(x[1]);
    const b = go(x[2]);
    lines.push(t + ' = ' + a + ' ' +
      x[0] + ' ' + b);
    return t;
  };
  go(e);
  return lines;
}`,
        why: 'The outer operation takes `t1` before its operands are named, so the lines come out numbered out of order (`t2 = a * b` then `t1 = t2 + c`).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a sea of nodes, which of these normally has no control edge?',
    options: [
      { t: 'A pure multiply such as `x * c`', correct: true, why: 'It depends only on its inputs, so it floats until it is scheduled.' },
      { t: 'A branch on `b`', why: 'Branches are on the control chain: they decide which nodes run next.' },
      { t: 'A return', why: 'Returns must follow the branch that leads to them, so they have control inputs.' },
      { t: 'The start node', why: 'Start begins the control chain.' },
    ],
  },
  {
    q: '`k * 2` is computed inside a loop and `k` is defined before it. Where does global code motion put it?',
    options: [
      { t: 'Inside the loop, where it was written', why: 'The rule prefers the least loop depth on the legal path.' },
      { t: 'Before the loop, because that block has a smaller loop depth and is still after `k`', correct: true, why: 'That is loop-invariant code motion, falling out of the placement rule.' },
      { t: 'After the loop', why: 'Its uses are inside the loop, so it must come before them.' },
      { t: 'Nowhere: floating nodes are never placed', why: 'Every node must be placed before machine code can be emitted.' },
    ],
  },
  {
    q: 'Which reason did the V8 team give for leaving the sea of nodes?',
    options: [
      { t: 'It cannot represent loops', why: 'It can; the post’s complaint is that loops are hard to find in it, not impossible.' },
      { t: 'It was invented for Java and is illegal to use elsewhere', why: 'Nothing like that is said.' },
      { t: 'Graph IRs cannot be optimised', why: 'TurboFan optimised code with one for a decade.' },
      { t: 'In JavaScript most nodes end up on the effect or control chain anyway, so little floats, while the graphs are harder to read and slower to compile', correct: true, why: 'Their summary: too complex, too limited, too slow; compile time halved with the CFG IR.' },
    ],
  },
  {
    q: 'What is the difference between CPS and ANF?',
    options: [
      { t: 'ANF has no named intermediates', why: 'Naming every intermediate is the point of ANF.' },
      { t: 'Both name every intermediate; CPS also passes “what next” as a continuation instead of returning', correct: true, why: 'ANF keeps ordinary returns, which is why it looks like three-address code.' },
      { t: 'CPS is only used in C compilers', why: 'It comes from functional-language compilers.' },
      { t: 'There is none', why: 'Only CPS replaces returns with calls to continuations.' },
    ],
  },
  {
    q: 'In MLIR’s Toy tutorial, what is still in the program after the partial lowering to affine loops?',
    options: [
      { t: 'Nothing from `toy`: every operation is lowered at once', why: 'Lowering is progressive; one operation waits.' },
      { t: 'Only LLVM dialect operations', why: 'That is the next step, not this one.' },
      { t: '`toy.print`, beside `affine`, `arith` and `memref` operations in the same function', correct: true, why: 'Dialects can coexist; `toy.print` is lowered later.' },
      { t: 'The original tensors, unchanged', why: 'They became buffers (memrefs) that the loops read and write.' },
    ],
  },
];
