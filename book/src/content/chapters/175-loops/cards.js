// Chapter 175 cards. Keys are stable ids: never rename them.

export const prompts = {
  'back-edge': {
    q: 'What makes a CFG edge `t → h` a back edge?',
    a: 'Its target `h` dominates its source `t`.',
  },
  'natural-loop': {
    q: 'Which blocks belong to the natural loop of a back edge `t → h`?',
    a: '`h` plus every block that can reach `t` without passing through `h`.',
  },
  'loop-depth': {
    q: 'What is a loop’s depth?',
    a: 'The number of loops that contain it, itself included: 1 for an outermost loop.',
  },
  'iv-what': {
    q: 'What is an induction variable?',
    a: 'A variable that changes by a fixed step on every trip around a loop, like `i` in `i++`.',
  },
  'trip-count': {
    q: 'When can Viscosity tell how many times a loop runs?',
    a: 'When its header tests a counting phi that starts at 0 against a constant bound with `<` or `<=`.',
  },
  'bounds-dominate': {
    q: 'Why must the header test’s “true” successor dominate the access `ps[i]`?',
    a: 'Then every path to the access goes through the test passing, so `i < ps.length` holds when the access runs.',
  },
  'and-guard': {
    q: 'Can Viscosity prove `ps[i]` in bounds when the header tests `i < ps.length && go`?',
    a: 'Yes. It splits the condition into its `&&` parts, and one part is `i < ps.length`.',
  },
  'invariant-what': {
    q: 'When is a value loop-invariant?',
    a: 'When it is the same on every trip: each operand is defined outside the loop or is itself loop-invariant.',
  },
  'length-not-invariant': {
    q: 'In a loop that calls `g.push(...)`, is `g.length` loop-invariant?',
    a: 'No. `g` doesn’t change, but the memory `g.length` reads does.',
  },
  'hoist-safe': {
    q: 'Why can hoisting `g[i].x` out of a loop be wrong even if it is invariant?',
    a: 'If the loop would have run zero times, the hoisted read may throw an error the original never threw.',
  },
};

export const examples = {};

export const exercises = {
  findLoops: {
    title: 'Find natural loops from back edges',
    prompt:
      '`succ` maps each block to its successors; `dom` maps each block to the list of blocks that dominate it (itself included). Write `findLoops(succ, dom)` returning an object that maps each loop **header** to its loop body as a **sorted** array. Back edges with the same header make one loop. Return `{}` if there are none.',
    starter: `function findLoops(succ, dom) {
  // your code here
  return {};
}

const succ = {
  b0: ['b1'], b1: ['b2', 'b3'],
  b2: ['b1'], b3: [],
};
const dom = {
  b0: ['b0'], b1: ['b0', 'b1'],
  b2: ['b0', 'b1', 'b2'],
  b3: ['b0', 'b1', 'b3'],
};
console.log(findLoops(succ, dom));
// { b1: ['b1', 'b2'] }`,
    solution: `function findLoops(succ, dom) {
  const preds = {};
  for (const b of Object.keys(succ)) {
    preds[b] = preds[b] ?? [];
    for (const s of succ[b]) {
      preds[s] = preds[s] ?? [];
      preds[s].push(b);
    }
  }
  const loops = {};
  for (const t of Object.keys(succ)) {
    for (const h of succ[t]) {
      if (!dom[t].includes(h)) continue;
      const body = new Set(loops[h]);
      body.add(h);
      const stack = [t];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...preds[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
    tests: `test('the nested loops of sum()', () => {
  const succ = {
    b0: ['b1'], b1: ['b2', 'b4'], b2: ['b5'], b3: ['b1'], b4: [],
    b5: ['b6', 'b8'], b6: ['b7'], b7: ['b5'], b8: ['b3'],
  };
  const dom = {
    b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b1', 'b2'],
    b4: ['b0', 'b1', 'b4'], b5: ['b0', 'b1', 'b2', 'b5'],
    b6: ['b0', 'b1', 'b2', 'b5', 'b6'],
    b7: ['b0', 'b1', 'b2', 'b5', 'b6', 'b7'],
    b8: ['b0', 'b1', 'b2', 'b5', 'b8'],
    b3: ['b0', 'b1', 'b2', 'b5', 'b8', 'b3'],
  };
  expect(findLoops(succ, dom)).toEqual({
    b1: ['b1', 'b2', 'b3', 'b5', 'b6', 'b7', 'b8'],
    b5: ['b5', 'b6', 'b7'],
  });
});
test('two back edges to one header make one loop', () => {
  const succ = { e: ['h'], h: ['a', 'x'], a: ['b', 'h'], b: ['h'], x: [] };
  const dom = { e: ['e'], h: ['e', 'h'], a: ['e', 'h', 'a'], b: ['e', 'h', 'a', 'b'], x: ['e', 'h', 'x'] };
  expect(findLoops(succ, dom)).toEqual({ h: ['a', 'b', 'h'] });
});
test('a block that loops to itself', () => {
  const succ = { b0: ['b1'], b1: ['b1', 'b2'], b2: [] };
  const dom = { b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b1', 'b2'] };
  expect(findLoops(succ, dom)).toEqual({ b1: ['b1'] });
});
test('no back edges, no loops', () => {
  const succ = { b0: ['b1', 'b2'], b1: ['b3'], b2: ['b3'], b3: [] };
  const dom = { b0: ['b0'], b1: ['b0', 'b1'], b2: ['b0', 'b2'], b3: ['b0', 'b3'] };
  expect(findLoops(succ, dom)).toEqual({});
});
test('a cycle with two entrances is not a natural loop', () => {
  const succ = { e: ['a', 'b'], a: ['b'], b: ['a'] };
  const dom = { e: ['e'], a: ['e', 'a'], b: ['e', 'b'] };
  expect(findLoops(succ, dom)).toEqual({});
});`,
    hints: [
      'You will walk backwards, so first build `preds` from `succ`.',
      'For every edge `t → h`, it is a back edge exactly when `dom[t]` includes `h`.',
      'Start the body with the header (and anything already found for that header), push `t`, and keep adding predecessors of blocks you add. Blocks already in the body stop the walk.',
    ],
    walkthrough: `This is \`naturalLoops\` from \`cfg.ts\`, on plain objects.

- **Predecessors.** The walk goes backwards, so invert \`succ\` once. Every block gets an entry, even if nothing jumps to it.
- **Back edges.** An edge \`t → h\` is a back edge when \`h\` dominates \`t\`. Dominance, not block order, is what counts: in the last test \`a\` and \`b\` form a cycle, but each can be entered without the other, so neither dominates the other and there is no natural loop. (Such “irreducible” cycles are rare in practice; JavaScript’s structured loops never produce them.)
- **Growing the body.** Put the header in first. Then walk predecessors from \`t\`. The header acts as a fence: the walk adds it already, so it never continues to the header’s own predecessors outside the loop.
- **Merging.** Seeding the set with \`loops[h]\` merges a second back edge into the same loop, as the real code does with its \`byHeader\` map. \`new Set(undefined)\` is just an empty set.`,
    wrong: [
      {
        code: `function findLoops(succ, dom) {
  const order = Object.keys(succ);
  const preds = {};
  for (const b of order) {
    preds[b] = preds[b] ?? [];
    for (const s of succ[b]) {
      preds[s] = preds[s] ?? [];
      preds[s].push(b);
    }
  }
  const loops = {};
  for (const t of order) {
    for (const h of succ[t]) {
      const back = order.indexOf(h) <=
        order.indexOf(t);
      if (!back) continue;
      const body = new Set(loops[h]);
      body.add(h);
      const stack = [t];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...preds[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
        why: 'An edge that goes “up” the listing is not necessarily a back edge. Block order is an accident of how the CFG was built; dominance is what defines a loop. This finds a fake loop in the two-entrance cycle and breaks on `sum()`, where `b3` is listed before `b5`.',
      },
      {
        code: `function findLoops(succ, dom) {
  const loops = {};
  for (const t of Object.keys(succ)) {
    for (const h of succ[t]) {
      if (!dom[t].includes(h)) continue;
      const body = new Set(loops[h]);
      const stack = [h];
      while (stack.length > 0) {
        const x = stack.pop();
        if (body.has(x)) continue;
        body.add(x);
        stack.push(...succ[x]);
      }
      loops[h] = [...body].sort();
    }
  }
  return loops;
}`,
        why: 'Walking *forwards* from the header collects everything reachable from it, including the blocks after the loop. The loop is what leads *to* the back edge, so walk predecessors from `t`.',
      },
    ],
  },
  invariants: {
    optional: true,
    title: 'Find the loop-invariant instructions',
    prompt:
      '`loop` is a list of instructions `{ id, op, args }` inside a loop; `outside` lists ids defined before the loop. An instruction is invariant if its op is in `PURE` and every operand is defined outside or is invariant. Return the invariant ids in `loop` order. Note: an instruction may be listed before one it depends on.',
    starter: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  // your code here
  return [];
}

const I = (id, op, ...args) =>
  ({ id, op, args });
const loop = [
  I('i', 'phi', 'z', 'j'),
  I('k', 'const'),
  I('m', '*', 'n', 'k'),
  I('j', '+', 'i', 'k'),
];
const out = ['n', 'z'];
console.log(invariants(loop, out));
// ['k', 'm']`,
    solution: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  const inv = new Set(outside);
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of loop) {
      if (inv.has(i.id)) continue;
      const ok = PURE.includes(i.op) &&
        i.args.every((a) => inv.has(a));
      if (ok) {
        inv.add(i.id);
        changed = true;
      }
    }
  }
  return loop
    .filter((i) => inv.has(i.id))
    .map((i) => i.id);
}`,
    tests: `const I = (id, op, ...args) => ({ id, op, args });
test('constants and values built from outside are invariant', () => {
  const loop = [I('i', 'phi', 'z', 'j'), I('k', 'const'), I('m', '*', 'n', 'k'), I('j', '+', 'i', 'k')];
  expect(invariants(loop, ['n', 'z'])).toEqual(['k', 'm']);
});
test('order in the list does not matter', () => {
  const loop = [I('b', '*', 'a', 'a'), I('a', '+', 'n', 'n')];
  expect(invariants(loop, ['n'])).toEqual(['b', 'a']);
});
test('a phi is never invariant', () => {
  expect(invariants([I('p', 'phi', 'n', 'n')], ['n'])).toEqual([]);
});
test('memory reads are not assumed invariant', () => {
  const loop = [I('v', 'load', 'g', 'i0'), I('w', '+', 'v', 'v')];
  expect(invariants(loop, ['g', 'i0'])).toEqual([]);
});`,
    hints: [
      'Keep a `Set` of ids known invariant, starting with everything defined outside.',
      'Sweep over the loop, adding any pure instruction whose operands are all in the set.',
      'One sweep may not be enough when an instruction comes before one it depends on. Repeat until a sweep adds nothing: a fixpoint.',
    ],
    walkthrough: `This is a tiny fixpoint computation, like the dataflow of chapter 167.

- Values defined outside the loop are invariant by definition, so they seed the set.
- A pure instruction whose operands are all invariant computes the same value every trip, so it joins the set.
- Because the listing order isn’t a dependency order (blocks in a loop body can be listed in any order), keep sweeping until nothing changes.

Two ops are deliberately not in \`PURE\`. A **phi** in the loop merges a value from the latch, so it changes by design (it is the induction variable!). A **load** reads memory that a store inside the loop might change: deciding that needs alias analysis, the subject of the next chapter.`,
    wrong: [
      {
        code: `const PURE = ['const', '+', '-', '*'];

function invariants(loop, outside) {
  const inv = new Set(outside);
  for (const i of loop) {
    const ok = PURE.includes(i.op) &&
      i.args.every((a) => inv.has(a));
    if (ok) inv.add(i.id);
  }
  return loop
    .filter((i) => inv.has(i.id))
    .map((i) => i.id);
}`,
        why: 'A single sweep misses `b = a * a` when `b` is listed before `a`: at that moment `a` isn’t known to be invariant yet. Repeat until nothing changes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a CFG, `b4 → b2` is an edge, and `b2` dominates `b4`. What do you know?',
    options: [
      { t: '`b4 → b2` is a back edge, and `b2` is the header of a natural loop containing `b4`', correct: true, why: 'That is the definition: an edge to a block that dominates its source.' },
      { t: '`b4` is unreachable', why: 'Dominance is only defined for reachable blocks; `b4` is reached, through `b2`.' },
      { t: '`b2` is inside a loop headed by `b4`', why: 'The other way round: the target of a back edge is the header.' },
      { t: 'Nothing, unless `b4` comes after `b2` in the block list', why: 'Block order is irrelevant; dominance decides.' },
    ],
  },
  {
    q: 'Why does finding a natural loop walk *predecessors* from the back edge’s source?',
    options: [
      { t: 'Because walking successors is slower', why: 'Speed isn’t the issue; forward walking finds the wrong set.' },
      { t: 'Because the loop is the set of blocks that can lead to the back edge without passing the header, and walking backwards finds exactly those', correct: true, why: 'Forwards from the header you would also collect the blocks after the loop.' },
      { t: 'Because predecessors are already sorted', why: 'Order doesn’t matter for a set.' },
    ],
  },
  {
    q: 'Which header test lets Viscosity prove `ps[i]` in bounds inside a `for (let i = 0; ...; i++)` loop?',
    options: [
      { t: '`i <= ps.length`', why: '`i` can equal `ps.length`, one past the end.' },
      { t: '`i < n`, where `const n = 1000`', why: 'The bound must be the length of the same collection; `n` might not match it.' },
      { t: '`i < ps.length && i < 64`', correct: true, why: 'The condition is split at `&&`, and one part is `i < ps.length`.' },
      { t: '`ps.length > i - 1`', why: 'The proof looks for the pattern `i < ps.length` with the counting phi on the left.' },
    ],
  },
  {
    q: 'Why does `for (let i = 0; i < ps.length; i += 2)` leave its accesses checked?',
    options: [
      { t: 'Because stepping by 2 can skip past the end', why: 'Not really: the test `i < ps.length` still runs before each access. Viscosity just only recognizes counting phis that step by exactly 1.' },
      { t: 'Because `isCountingPhi` requires a step of exactly `+1`, so `i` isn’t recognized', correct: true, why: 'The proof is deliberately narrow. Anything it doesn’t recognize gets a check, which is always safe.' },
      { t: 'Because `+=` is not allowed in loops Viscosity transforms', why: 'The collection is still transformed (struct of arrays); only the bounds proof fails.' },
    ],
  },
  {
    q: 'A loop body contains `t = n * 2` (with `n` defined before the loop) and `g.push(t)`. Which is loop-invariant?',
    options: [
      { t: 'Both', why: '`g.push` changes `g` each time; it is a write, not an invariant value.' },
      { t: '`g.length`, because `g` never changes', why: 'The array object stays the same, but its length grows every trip.' },
      { t: 'Neither: nothing in a loop is invariant', why: '`n * 2` is the same every time.' },
      { t: '`t = n * 2`', correct: true, why: 'Its only operands come from outside the loop and multiplication has no effects (when `n` is a number), so it could be computed once before the loop.' },
    ],
  },
  {
    q: 'What does Viscosity do with the loops it finds?',
    options: [
      { t: 'Hoists invariant code out of them', why: 'Viscosity moves no code; it leaves LICM to the engine.' },
      { t: 'Uses them to describe the program: access patterns per loop, trip counts for size estimates, and bounds proofs', correct: true, why: 'Those feed its layout decision and tell it where it can drop bounds checks.' },
      { t: 'Unrolls them to make SoA access faster', why: 'The rewritten program keeps the loops exactly as written.' },
    ],
  },
];
