// Chapter 177 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 92, 92, 92, 92, 92.

export const prompts = {
  'why-not-paths': {
    q: 'Why can’t a compiler answer “was `y` assigned on every path?” by listing the paths?',
    a: 'There are far too many: they double with every `if`, and a loop makes infinitely many.',
  },
  'dataflow-what': {
    q: 'What are the three parts of a **dataflow analysis**?',
    a: 'A fact at each point (IN and OUT of every block), a transfer function per block, and a meet where paths join.',
  },
  'in-out': {
    q: 'In a dataflow analysis, what do `IN[B]` and `OUT[B]` stand for?',
    a: 'The fact at the start of block B and the fact at its end.',
  },
  'meet-where': {
    q: 'Where in a CFG does the meet operator do its work?',
    a: 'At a block with several incoming edges (several predecessors, in a forward analysis), to combine the facts that arrive.',
  },
  'forward-backward': {
    q: 'In a **backward** analysis, which fact does a block’s transfer function compute from which?',
    a: 'It computes IN[B] (the start) from OUT[B] (the end), which is the meet of its successors’ IN facts.',
  },
  'must-may': {
    q: 'A “must” question meets with intersection. What does a “may” question meet with, and why?',
    a: 'Union: a fact that holds on at least one incoming path may hold, so it is kept.',
  },
  'lattice-what': {
    q: 'What is a **lattice**, in a dataflow analysis?',
    a: 'The set of possible facts with an order on them, in which any two facts have a meet: the highest fact below both.',
  },
  'merge-two': {
    q: 'Meet “number” with “maybe-not”. What do you get?',
    a: '“maybe-not”: if either side might not be a number, the merge might not be one either.',
  },
  'side-by-side': {
    q: 'In the lattice of sets ordered by “contains”, what is `{x} ⊓ {y}`, and why?',
    a: 'The empty set: it is the highest set contained in both.',
  },
  'loop-circle': {
    q: 'Why can’t a loop’s dataflow equations be solved in one pass, block after block?',
    a: 'The loop header’s IN needs the body’s OUT, which needs the header’s OUT: a circle with no first block.',
  },
  'fixpoint-what': {
    q: 'What is a **fixpoint** of a set of dataflow equations?',
    a: 'A choice of facts that applying every equation once more leaves unchanged.',
  },
  'start-top': {
    q: 'Why is it safe to start unknown facts at the top of the lattice?',
    a: 'The meet with the top changes nothing, and the equations then lower any fact that is contradicted.',
  },
  'why-optimistic': {
    q: 'A loop phi depends on its own back-edge value. Why does a pessimistic start fail to prove it a number?',
    a: 'Each value stays “maybe not” because the other one is: a consistent answer that never improves.',
  },
  'worklist-what': {
    q: 'What is a **worklist**?',
    a: 'The list of blocks (or values) whose facts may be out of date and must be recomputed.',
  },
  requeue: {
    q: 'In a forward analysis, block b’s OUT just changed. What goes on the worklist?',
    a: 'b’s successors (unless already there), since their IN is computed from b’s OUT.',
  },
  'finite-height': {
    q: 'Why must a worklist solver on a finite-height lattice stop, if facts only move down?',
    a: 'Each fact can move down only a bounded number of times, and blocks are re-added only after such a move.',
  },
  'viscosity-rounds': {
    q: 'How does Viscosity’s numeric inference iterate, and what happens if it never settles?',
    a: 'In rounds, rerunning every rule until a round changes nothing; after 1000 rounds it gives up every fact (fails closed).',
  },
  'partial-what': {
    q: 'What makes an order **partial** rather than total?',
    a: 'Some pairs need not be comparable: neither is below the other, like {a, b} and {b, c}.',
  },
  'meet-join': {
    q: 'In the lattice of subsets of {a, b, c}, what are the meet and the join of {a, b} and {b, c}?',
    a: 'Meet {b} (the highest set below both); join {a, b, c} (the lowest set above both).',
  },
  'height-what': {
    q: 'What is the **height** of a lattice?',
    a: 'The largest number of steps down from its top to its bottom.',
  },
  'wide-short': {
    q: 'The constant lattice has infinitely many facts. Why does an analysis on it still stop?',
    a: 'Its height is only 2, so each fact can move down at most twice.',
  },
  'monotone-what': {
    q: 'What does it mean for a transfer function to be **monotone**?',
    a: 'A higher input never gives a lower output: x ⊑ y implies f(x) ⊑ f(y).',
  },
  'genkill-monotone': {
    q: 'Why is `f(IN) = gen ∪ (IN − kill)` monotone (with ⊆ as the order)?',
    a: 'A bigger IN, minus the same kill and plus the same gen, still gives a set at least as big.',
  },
  'framework-what': {
    q: 'What are the three ingredients of a **monotone framework**?',
    a: 'A lattice of finite height, a meet, and monotone transfer functions.',
  },
  'greatest-fixpoint': {
    q: 'Iterating from the top reaches which fixpoint, and why is it the best one?',
    a: 'The greatest: every fixpoint is below the top, and monotone steps keep it below every step of the chain.',
  },
  'mop-what': {
    q: 'What is the **meet over all paths** answer?',
    a: 'Apply the transfer functions along each path separately, then meet the results of all the paths.',
  },
  'distributive-equal': {
    q: 'When does the iterative answer equal the meet over all paths?',
    a: 'When every transfer function is distributive: f(x ⊓ y) = f(x) ⊓ f(y).',
  },
  'fold-what': {
    q: 'What is **constant folding**?',
    a: 'Computing, at compile time, an instruction whose operands are all constants, and replacing it with a `const` holding the result.',
  },
  'fold-one-unknown': {
    q: 'In `%7 = binop < %3, %6`, `%6` is `const 100` but `%3` is a loop counter (a phi). Can `%7` be folded?',
    a: 'No. One operand that is not a known constant is enough to stop a fold; the answer changes each time round the loop.',
  },
  'fold-ssa-free': {
    q: 'After `%6` is folded to `const 100`, why does nothing need to be copied into the instructions that use `%6`?',
    a: 'In SSA they refer to `%6` itself, which is defined once and is now a constant, so every user sees the constant at once.',
  },
  'fold-exact': {
    q: 'A folder rewrites `0.1 + 0.2` as `const 0.3`. What went wrong?',
    a: 'It changed the program: at run time the float64 sum is 0.30000000000000004, and the folded answer must match it exactly.',
  },
  'fold-host': {
    q: 'Why does a folder written in C++ or Rust need more care than one written in JavaScript, when compiling JavaScript?',
    a: 'It must copy JavaScript’s rules (string `+`, `NaN`, `Infinity`, `-0`, float rounding) by hand; a JavaScript folder gets them by doing the same operation.',
  },
  'fold-never': {
    q: 'Name two kinds of instruction a folder must leave alone even when every operand is a constant.',
    a: 'Ones with side effects (a call that prints, a store) and ones that can throw (such as reading an index of something that may not be an array).',
  },
  'plus-object': {
    q: 'Why can `+` run code in JavaScript?',
    a: 'If an operand is an object, `+` first calls its `valueOf` (or `toString`) method, and that method can do anything.',
  },
  'algebra-trap': {
    q: 'Why is rewriting `x * 1` as `x` wrong in JavaScript unless `x` is known to be a number?',
    a: 'If `x` is the string `\'3\'`, `x * 1` is the number `3`, not the string; the rewrite would change the value’s type.',
  },
  'prop-what': {
    q: 'What is **constant propagation**?',
    a: 'Finding which values are the same constant on every run, across blocks and through phis, and replacing their uses with that constant.',
  },
  'fold-not-enough': {
    q: 'In `g`, folding turns `x > 0` into `true`. Why can folding alone still not find that `g` returns 20?',
    a: 'The result goes through a phi of 2 and 3, and folding only handles operations on constants; something has to notice that the branch giving 3 never runs.',
  },
  'top-what': {
    q: 'In the constant lattice, what does ⊤ mean, and what does ⊥ mean?',
    a: '⊤: no information yet (not worked out, or its block not reached). ⊥: varies, not a constant.',
  },
  'meet-rule': {
    q: 'Meet 2 with 3. Then meet 2 with ⊤.',
    a: '2 ⊓ 3 = ⊥ (two different constants vary). 2 ⊓ ⊤ = 2 (⊤ gives way).',
  },
  'loop-seven': {
    q: 'A loop header has `%5 = phi %1, %5` with `%1 = const 7`. Why must the analysis start `%5` at ⊤ to prove it is 7?',
    a: 'The phi uses itself. Starting at ⊤, 7 ⊓ ⊤ = 7, which is then consistent. Starting at ⊥, 7 ⊓ ⊥ = ⊥, which is also consistent, but useless.',
  },
  counter: {
    q: 'What does constant propagation conclude about a loop counter `i = φ(0, i + 1)`?',
    a: '⊥: 0 arrives from the entry, then 1 round the back edge, and 0 ⊓ 1 varies.',
  },
  'sccp-edges': {
    q: 'What second kind of fact does SCCP track, besides a lattice value per SSA value?',
    a: 'Which CFG edges are executable (and so which blocks are reachable).',
  },
  'sccp-phi': {
    q: 'At a phi, which operands does SCCP meet?',
    a: 'Only the ones arriving along edges already proven executable; the others are ignored.',
  },
  'sccp-sparse': {
    q: 'What are SCCP’s two worklists?',
    a: 'CFG edges that just became executable (visit their target block) and SSA values whose fact just changed (revisit their users).',
  },
};

export const examples = {
  'must-may': {
    title: 'The same two facts, met two ways',
    code: `// What reaches the join from b1, b2:
const b1 = new Set(['x', 'y']);
const b2 = new Set(['x']);

// must: true on EVERY path
const must = [...b1].filter(
  (v) => b2.has(v));
// may: true on SOME path
const may = new Set([...b1, ...b2]);

console.log('must', must);
console.log('may', [...may]);`,
  },
  optimistic: {
    title: 'Two starting guesses for a loop',
    code: `// s = 0; loop: s = s + i (i: number)
// v2 = φ(v1, v3), v3 = v2 + i
// true means "is a number".
function solve(start) {
  let v2 = start;
  let v3 = start;
  for (let r = 0; r < 5; r++) {
    v2 = true && v3; // φ(v1, v3)
    v3 = v2 && true; // v2 + i
  }
  return v2;
}
console.log('optimistic', solve(true));
console.log('pessimistic',
  solve(false));`,
  },
  mop: {
    title: 'Meet first, or add first?',
    code: `// A constant, or 'varies'.
const meet = (p, q) =>
  p === q ? p : 'varies';
const add = (p, q) =>
  p === 'varies' || q === 'varies'
    ? 'varies' : p + q;
// if c { a = 1; b = 2 }
// else { a = 2; b = 1 }
// x = a + b
const l = { a: 1, b: 2 };
const r = { a: 2, b: 1 };
// Each path on its own, then meet:
const mop = meet(add(l.a, l.b),
  add(r.a, r.b));
// Meet at the join, then add:
const a = meet(l.a, r.a);
const b = meet(l.b, r.b);
console.log('per path:', mop);
console.log('merged first:', add(a, b));`,
  },
  corners: {
    title: 'Answers a folder must copy exactly',
    code: `console.log('1' + 2);
console.log(1 / 0);
console.log(0 / 0);
console.log(0.1 + 0.2);
console.log(Object.is(0 * -1, -0));
console.log(1 / (0 * -1));
console.log(2 ** 53 + 1);`,
  },
  merges: {
    title: 'Merging facts at a phi',
    code: `const TOP = '⊤';
const BOT = '⊥';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT)
    return BOT;
  return Object.is(a, b) ? a : BOT;
}
const phi = (...xs) =>
  xs.reduce(meet, TOP);
console.log(phi(2, 2));
console.log(phi(7, TOP));
console.log(phi(0, 1));
console.log(phi(2, TOP, BOT));
console.log(phi(0, -0));`,
  },
};

export const exercises = {
  'one-pass': {
    title: 'Definitely assigned, in one pass',
    prompt: `Write \`definite(blocks, order)\`. Each block has \`preds\` (the blocks with an edge into it) and \`assigns\` (the variables it gives a value to). The CFG has **no loops**, and \`order\` lists every block after all of its predecessors.

Compute, for every block, the variables **definitely** assigned at its start, as a **sorted** array:

- a block with no predecessors (the entry) starts with nothing assigned;
- otherwise IN is the **intersection** of the predecessors’ OUT;
- OUT is IN plus the block’s own \`assigns\`.

Return the IN facts, one entry per block.`,
    starter: `// blocks: { b: { preds, assigns } }
// order: every block after its preds
// Return { b: sorted variables
//   definitely assigned at b's start }
function definite(blocks, order) {
  const inn = {};
  for (const b of order) inn[b] = [];
  return inn;
}`,
    solution: `// blocks: { b: { preds, assigns } }
// order: every block after its preds
// Return { b: sorted variables
//   definitely assigned at b's start }
function definite(blocks, order) {
  const inn = {};
  const out = {};
  for (const b of order) {
    const preds = blocks[b].preds;
    const adds = blocks[b].assigns;
    let s = null;
    for (const p of preds) {
      s = s === null ? out[p]
        : s.filter((v) =>
          out[p].includes(v));
    }
    inn[b] = s === null ? [] : s;
    const o = new Set([...inn[b],
      ...adds]);
    out[b] = [...o].sort();
  }
  return inn;
}`,
    tests: `test('a straight line', () => {
  expect(definite({
    b0: { preds: [], assigns: ['x'] },
    b1: { preds: ['b0'],
      assigns: ['y'] },
    b2: { preds: ['b1'], assigns: [] },
  }, ['b0', 'b1', 'b2'])).toEqual({
    b0: [], b1: ['x'], b2: ['x', 'y'],
  });
});
test('the chapter’s if/else', () => {
  expect(definite({
    b0: { preds: [], assigns: ['x'] },
    b1: { preds: ['b0'],
      assigns: ['y'] },
    b2: { preds: ['b0'],
      assigns: ['x'] },
    b3: { preds: ['b1', 'b2'],
      assigns: [] },
  }, ['b0', 'b1', 'b2', 'b3']).b3)
    .toEqual(['x']);
});
test('assigned on both sides', () => {
  expect(definite({
    b0: { preds: [], assigns: [] },
    b1: { preds: ['b0'],
      assigns: ['z', 'y'] },
    b2: { preds: ['b0'],
      assigns: ['y'] },
    b3: { preds: ['b1', 'b2'],
      assigns: [] },
  }, ['b0', 'b1', 'b2', 'b3']).b3)
    .toEqual(['y']);
});`,
    hints: [
      'Keep two objects, `inn` and `out`. Visit the blocks in `order`, so every predecessor’s OUT is ready when you need it.',
      'For IN, start from the first predecessor’s OUT and keep only the variables that every other predecessor’s OUT also includes (`filter` with `includes`). No predecessors means `[]`.',
      'For OUT, put IN and `assigns` into one `Set` (which drops repeats), spread it into an array, and `sort()` it.',
    ],
    walkthrough: `**How to think about it.** This is the stepper from the chapter, written as code. The equations say exactly what to compute for each block: IN is the intersection of the predecessors' OUT facts (empty for the entry), and OUT is IN plus whatever the block assigns. The only question is *when* to compute each one; because \`order\` puts every block after its predecessors and there are no loops, a single walk through \`order\` always finds the predecessors' OUT facts already computed. Represent each fact as a sorted array, so that the tests can compare them with \`toEqual\`.

**The solution, line by line.**

- \`const inn = {}; const out = {};\` hold the IN and OUT fact of every block, by name.
- \`for (const b of order) {\` visits the blocks predecessors-first.
- \`const preds = blocks[b].preds;\` and \`const adds = blocks[b].assigns;\` pull out the two fields we need.
- \`let s = null;\` will hold the intersection so far; \`null\` means "no predecessor seen yet", which is different from "the empty set".
- \`for (const p of preds) {\` goes through the predecessors.
- \`s = s === null ? out[p] : s.filter((v) => out[p].includes(v));\` takes the first predecessor's OUT as it is, and for each later one keeps only the variables that its OUT also includes: that is the intersection, the meet of a "must" question.
- \`inn[b] = s === null ? [] : s;\` stores IN; a block with no predecessors (the entry) starts with nothing assigned.
- \`const o = new Set([...inn[b], ...adds]);\` is the transfer function: everything assigned on the way in, plus what this block assigns. A \`Set\` drops repeats, which matters for the chapter's b2, which assigns \`x\` again.
- \`out[b] = [...o].sort();\` stores OUT as a sorted array. Because \`filter\` keeps the order of the array it starts from, every IN is sorted too.
- \`return inn;\` gives back the facts at the start of every block.

On the chapter's example, \`out.b1\` is \`['x', 'y']\` and \`out.b2\` is \`['x']\`, so the filter for b3 keeps only \`'x'\`.

**Common wrong attempts.**

- Using union instead of intersection (collecting every predecessor's variables): b3 would get \`['x', 'y']\`, saying \`y\` is definitely assigned when the path through b2 never assigns it. That answers the "may" question, not the "must" one.
- Starting the intersection from \`[]\` instead of from the first predecessor's OUT: the intersection of anything with the empty set is empty, so every block would end up with nothing.
- Forgetting the block's own \`assigns\` in OUT: then nothing ever becomes assigned, and every IN is empty.`,
    wrong: [
      {
        code: `// blocks: { b: { preds, assigns } }
// order: every block after its preds
// Return { b: sorted variables
//   definitely assigned at b's start }
function definite(blocks, order) {
  const inn = {};
  const out = {};
  for (const b of order) {
    const preds = blocks[b].preds;
    const adds = blocks[b].assigns;
    let s = null;
    for (const p of preds) {
      s = [...new Set([...(s ?? []),
        ...out[p]])].sort();
    }
    inn[b] = s === null ? [] : s;
    const o = new Set([...inn[b],
      ...adds]);
    out[b] = [...o].sort();
  }
  return inn;
}`,
        why: 'This is a union, the meet of a “may” question: b3 gets `y` from b1 even though the path through b2 never assigns it.',
      },
      {
        code: `// blocks: { b: { preds, assigns } }
// order: every block after its preds
// Return { b: sorted variables
//   definitely assigned at b's start }
function definite(blocks, order) {
  const inn = {};
  const out = {};
  for (const b of order) {
    const preds = blocks[b].preds;
    const adds = blocks[b].assigns;
    let s = [];
    for (const p of preds) {
      s = s === null ? out[p]
        : s.filter((v) =>
          out[p].includes(v));
    }
    inn[b] = s === null ? [] : s;
    const o = new Set([...inn[b],
      ...adds]);
    out[b] = [...o].sort();
  }
  return inn;
}`,
        why: 'Starting the intersection from the empty set keeps nothing: every intersection with `[]` is `[]`.',
      },
    ],
  },
  solver: {
    title: 'A worklist solver for any forward analysis',
    prompt: `Write \`solve(p)\`, a worklist solver for a **forward** dataflow analysis. \`p\` describes the CFG and the analysis:

- \`blocks\` (all block names), \`preds\` and \`succs\` (each maps a block to a list of blocks), and \`entry\`;
- \`start\`, the fact at the start of the entry, and \`top\`, the starting guess for every OUT (the meet leaves it alone);
- \`meet(a, b)\`, \`transfer(b, f)\` (block b’s OUT, given its IN \`f\`) and \`same(a, b)\` (are two facts equal?).

Put every block on a worklist. Take blocks off the front: IN is the meet of the predecessors’ OUT (starting from \`start\` for the entry and \`top\` otherwise), OUT is the transfer of IN. Only if OUT changed, store it and add the block’s successors to the back of the list (unless already there). Return \`{ inn, out }\`.`,
    starter: `// p: { blocks, preds, succs, entry,
//   start, top, meet(a, b),
//   transfer(b, f), same(a, b) }
// Return { inn, out } at a fixpoint.
function solve(p) {
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    inn[b] = p.top;
    out[b] = p.top;
  }
  return { inn, out };
}`,
    solution: `// p: { blocks, preds, succs, entry,
//   start, top, meet(a, b),
//   transfer(b, f), same(a, b) }
// Return { inn, out } at a fixpoint.
function solve(p) {
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    out[b] = p.top;
  }
  const work = [...p.blocks];
  while (work.length > 0) {
    const b = work.shift();
    let f = b === p.entry
      ? p.start : p.top;
    for (const q of p.preds[b]) {
      f = p.meet(f, out[q]);
    }
    inn[b] = f;
    const o = p.transfer(b, f);
    if (p.same(o, out[b])) continue;
    out[b] = o;
    for (const s of p.succs[b]) {
      if (!work.includes(s)) {
        work.push(s);
      }
    }
  }
  return { inn, out };
}`,
    tests: `const uni = (a, b) =>
  [...new Set([...a, ...b])].sort();
const inter = (a, b) =>
  a.filter((v) => b.includes(v));
const A = { b0: ['i', 'x'], b1: [],
  b2: ['i', 'x', 'y'], b3: [] };
const loop = (meet, top) => ({
  blocks: ['b0', 'b1', 'b2', 'b3'],
  preds: { b0: [], b1: ['b0', 'b2'],
    b2: ['b1'], b3: ['b1'] },
  succs: { b0: ['b1'],
    b1: ['b2', 'b3'], b2: ['b1'],
    b3: [] },
  entry: 'b0', start: [], top, meet,
  transfer: (b, f) => uni(f, A[b]),
  same: (a, b) => a.join() === b.join(),
});
test('definitely assigned (must)', () => {
  const r = solve(loop(inter,
    ['i', 'x', 'y']));
  expect(r.inn.b3).toEqual(['i', 'x']);
  expect(r.inn.b1).toEqual(['i', 'x']);
});
test('maybe assigned (may)', () => {
  const r = solve(loop(uni, []));
  expect(r.inn.b1)
    .toEqual(['i', 'x', 'y']);
  expect(r.inn.b3)
    .toEqual(['i', 'x', 'y']);
});
test('a straight line', () => {
  const r = solve({
    blocks: ['a', 'b'],
    preds: { a: [], b: ['a'] },
    succs: { a: ['b'], b: [] },
    entry: 'a', start: 0, top: 99,
    meet: Math.min,
    transfer: (b, f) => f + 1,
    same: (x, y) => x === y,
  });
  expect(r.out).toEqual({ a: 1, b: 2 });
});`,
    hints: [
      'Start every `out[b]` at `p.top` and put every block on the list: `const work = [...p.blocks];`. Loop while the list is not empty, taking blocks off with `work.shift()`.',
      'For IN, start from `p.start` if the block is the entry and `p.top` otherwise, then fold in each predecessor with `f = p.meet(f, out[q])`.',
      'Compute `o = p.transfer(b, f)`. If `p.same(o, out[b])`, nothing downstream can change: `continue`. Otherwise store it and push each successor that is not already on the list.',
    ],
    walkthrough: `**How to think about it.** The solver does not know or care what the facts are: sets of variables, numbers, anything. All it needs is the CFG, a starting guess (\`top\`), and the three operations. So write the loop from the chapter, and call \`p.meet\`, \`p.transfer\` and \`p.same\` wherever the chapter's code did a set operation. The tests run it twice on the same loop: once as a "must" analysis (meet is intersection, top is every variable) and once as a "may" analysis (meet is union, top is the empty set, which union leaves alone). The may version is the one that needs the back edge: b1 only learns that \`y\` may be assigned after b2 has been processed, so b1 must go back on the list.

**The solution, line by line.**

- \`const inn = {}; const out = {};\` hold the facts by block name.
- \`for (const b of p.blocks) { out[b] = p.top; }\` is the optimistic guess: every OUT starts at the top.
- \`const work = [...p.blocks];\` puts every block on the worklist (a copy, so we don't change \`p.blocks\`).
- \`while (work.length > 0) {\` runs until the list is empty, which is when we are at a fixpoint.
- \`const b = work.shift();\` takes the first block off the front.
- \`let f = b === p.entry ? p.start : p.top;\` starts the meet: the entry has its own starting fact, and every other block starts from the top, which the meet leaves alone.
- \`for (const q of p.preds[b]) { f = p.meet(f, out[q]); }\` folds in each predecessor's OUT; in the must test, at b1 this is \`['i','x']\` met with the guess \`['i','x','y']\`.
- \`inn[b] = f;\` records IN.
- \`const o = p.transfer(b, f);\` computes the new OUT.
- \`if (p.same(o, out[b])) continue;\` If OUT did not change, no successor can be affected, so move on. This line is what makes the loop end.
- \`out[b] = o;\` stores the new OUT.
- \`for (const s of p.succs[b]) { if (!work.includes(s)) { work.push(s); } }\` puts every successor back on the list (once), because their IN is computed from this OUT.
- \`return { inn, out };\` returns the fixpoint.

In the may test, the first visit to b1 gives IN \`['i','x']\`. Then b2 changes its OUT from \`[]\` to \`['i','x','y']\` and puts b1 back on the list; b1's second visit gives \`['i','x','y']\`, which puts b2 and b3 back; b2 doesn't change, and b3 picks up \`y\`.

**Common wrong attempts.**

- Never putting successors back on the list: each block is visited once, and in the may test b1 never hears about b2's \`y\`.
- Comparing facts with \`===\` instead of \`p.same\`: two arrays with the same contents are different objects, so every block always looks changed and the successors are re-added for ever (or until something else stops it).
- Starting IN from \`out[preds[0]]\` and ignoring \`p.start\`: the entry has no predecessors, and \`undefined\` reaches the transfer function.`,
    wrong: [
      {
        code: `// p: { blocks, preds, succs, entry,
//   start, top, meet(a, b),
//   transfer(b, f), same(a, b) }
// Return { inn, out } at a fixpoint.
function solve(p) {
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    out[b] = p.top;
  }
  const work = [...p.blocks];
  while (work.length > 0) {
    const b = work.shift();
    let f = b === p.entry
      ? p.start : p.top;
    for (const q of p.preds[b]) {
      f = p.meet(f, out[q]);
    }
    inn[b] = f;
    const o = p.transfer(b, f);
    if (p.same(o, out[b])) continue;
    out[b] = o;
  }
  return { inn, out };
}`,
        why: 'Each block is visited once. In the may test, b1 was visited before b2, so it never learns that y may arrive along the back edge.',
      },
      {
        code: `// p: { blocks, preds, succs, entry,
//   start, top, meet(a, b),
//   transfer(b, f), same(a, b) }
// Return { inn, out } at a fixpoint.
function solve(p) {
  const inn = {};
  const out = {};
  for (const b of p.blocks) {
    out[b] = p.top;
  }
  const work = [...p.blocks];
  while (work.length > 0) {
    const b = work.shift();
    let f = p.top;
    for (const q of p.preds[b]) {
      f = p.meet(f, out[q]);
    }
    inn[b] = f;
    const o = p.transfer(b, f);
    if (p.same(o, out[b])) continue;
    out[b] = o;
    for (const s of p.succs[b]) {
      if (!work.includes(s)) {
        work.push(s);
      }
    }
  }
  return { inn, out };
}`,
        why: 'The entry starts from the top instead of `start`. In the must test, that claims i, x and y are all assigned before the function has run.',
      },
    ],
  },
  numeric: {
    optional: true,
    title: 'An optimistic worklist over SSA values',
    prompt: `The sparse version: facts belong to SSA values, and a changed value puts its **users** back on the list. Write \`numeric(insts)\`. Each instruction has an \`op\` and a list of \`args\` (ids of other instructions):

- \`'num'\` is a number constant, and \`'str'\` a string constant (no args);
- \`'add'\` is a number only if all its args are;
- \`'phi'\` is a number only if all its args are.

Start optimistic: every fact is \`true\` except \`'str'\`. Put every id on a worklist. Repeatedly take the first id, recompute its fact from its args, and if it changed, add its users to the end of the list (unless already there). Return the facts. Loops are allowed: a phi may use a value defined later.`,
    starter: `// insts: { id: { op, args } }
// op: 'num' | 'str' | 'add' | 'phi'
// Return { id: true if a number }.
function numeric(insts) {
  const fact = {};
  for (const id in insts) {
    fact[id] = insts[id].op === 'num';
  }
  return fact;
}`,
    solution: `// insts: { id: { op, args } }
// op: 'num' | 'str' | 'add' | 'phi'
// Return { id: true if a number }.
function numeric(insts) {
  const users = {};
  const fact = {};
  for (const id in insts) {
    const { op, args } = insts[id];
    fact[id] = op !== 'str';
    for (const a of args) {
      (users[a] ??= []).push(id);
    }
  }
  const work = Object.keys(insts);
  while (work.length) {
    const id = work.shift();
    const { op, args } = insts[id];
    if (op === 'num') continue;
    if (op === 'str') continue;
    const f = args.every(
      (a) => fact[a]);
    if (f === fact[id]) continue;
    fact[id] = f;
    for (const u of users[id] ?? []) {
      if (!work.includes(u)) {
        work.push(u);
      }
    }
  }
  return fact;
}`,
    tests: `const I = (op, ...args) =>
  ({ op, args });
test('straight-line', () => {
  expect(numeric({
    a: I('num'), b: I('num'),
    c: I('add', 'a', 'b'),
  })).toEqual({ a: true, b: true,
    c: true });
});
test('a string poisons a sum', () => {
  expect(numeric({
    a: I('num'), s: I('str'),
    c: I('add', 'a', 's'),
  }).c).toBe(false);
});
test('a counting loop', () => {
  const f = numeric({
    v1: I('num'),
    v2: I('phi', 'v1', 'v4'),
    v3: I('num'),
    v4: I('add', 'v2', 'v3'),
  });
  expect(f.v2).toBe(true);
  expect(f.v4).toBe(true);
});
test('doubt goes round the loop', () => {
  const f = numeric({
    v1: I('num'),
    v2: I('phi', 'v1', 'v6'),
    v3: I('add', 'v2', 'v1'),
    v4: I('str'),
    v5: I('phi', 'v3', 'v4'),
    v6: I('add', 'v5', 'v1'),
  });
  expect(f).toEqual({ v1: true,
    v2: false, v3: false, v4: false,
    v5: false, v6: false });
});`,
    hints: [
      'First build `users`: for every instruction and every arg `a`, record that this instruction uses `a`.',
      'The worklist is an array: `work.shift()` takes from the front, `work.push(u)` adds to the back.',
      'Only when a fact actually changes do you push its users. That is what makes the loop end.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's sparse stepper as code, and the worklist version of Viscosity's rounds. Three ideas carry it. Start optimistic, so that a loop whose values only feed each other stays "number" unless something contradicts it. Record, for every value, which instructions *use* it, because those are the only ones whose facts can change when it changes. And only requeue after a real change, so the list runs dry.

**The solution, line by line.**

- \`const users = {}; const fact = {};\` hold, for each id, who reads it, and its current fact.
- \`for (const id in insts) {\` visits every instruction once to set things up.
- \`const { op, args } = insts[id];\` takes out its kind and operands.
- \`fact[id] = op !== 'str';\` is the optimistic start: everything is a number except a string constant.
- \`for (const a of args) { (users[a] ??= []).push(id); }\` records that \`id\` uses each of its operands (\`??=\` creates the list the first time).
- \`const work = Object.keys(insts);\` puts every id on the worklist.
- \`while (work.length) {\` runs until it is empty.
- \`const id = work.shift();\` takes the first id.
- \`if (op === 'num') continue; if (op === 'str') continue;\` Constants never change.
- \`const f = args.every((a) => fact[a]);\` is the rule for both \`add\` and \`phi\`: a number only if every operand is.
- \`if (f === fact[id]) continue;\` No change, nothing to tell anyone.
- \`fact[id] = f;\` stores the new fact.
- \`for (const u of users[id] ?? []) { if (!work.includes(u)) { work.push(u); } }\` puts every user back on the list, once.
- \`return fact;\`

In the last test the doubt travels \`v5 → v6 → v2 → v3\`, round the back edge. A fact only ever goes from \`true\` to \`false\`, never back, so each value changes at most once, and the list must empty.

**Common wrong attempts.**

- Starting pessimistic (only constants are numbers): in the counting loop, the phi and the sum each wait for the other, and neither is ever proven a number.
- Not requeueing users: when v6 changes, the loop phi v2 has already been processed and stays wrongly \`true\`.`,
    wrong: [
      {
        code: `// insts: { id: { op, args } }
// op: 'num' | 'str' | 'add' | 'phi'
// Return { id: true if a number }.
function numeric(insts) {
  const users = {};
  const fact = {};
  for (const id in insts) {
    const { op, args } = insts[id];
    fact[id] = op === 'num';
    for (const a of args) {
      (users[a] ??= []).push(id);
    }
  }
  const work = Object.keys(insts);
  while (work.length) {
    const id = work.shift();
    const { op, args } = insts[id];
    if (op === 'num') continue;
    if (op === 'str') continue;
    const f = args.every(
      (a) => fact[a]);
    if (f === fact[id]) continue;
    fact[id] = f;
    for (const u of users[id] ?? []) {
      if (!work.includes(u)) {
        work.push(u);
      }
    }
  }
  return fact;
}`,
        why: 'This starts pessimistic: the loop phi and the sum each wait for the other to become a number, so the counting loop is never proven numeric.',
      },
      {
        code: `// insts: { id: { op, args } }
// op: 'num' | 'str' | 'add' | 'phi'
// Return { id: true if a number }.
function numeric(insts) {
  const users = {};
  const fact = {};
  for (const id in insts) {
    const { op, args } = insts[id];
    fact[id] = op !== 'str';
    for (const a of args) {
      (users[a] ??= []).push(id);
    }
  }
  const work = Object.keys(insts);
  while (work.length) {
    const id = work.shift();
    const { op, args } = insts[id];
    if (op === 'num') continue;
    if (op === 'str') continue;
    const f = args.every(
      (a) => fact[a]);
    if (f === fact[id]) continue;
    fact[id] = f;
  }
  return fact;
}`,
        why: 'Without requeueing users, each value is visited once. When v6 changes, the loop phi v2 has already been processed and stays wrongly `true`.',
      },
    ],
  },
  monotone: {
    title: 'Is this rule monotone?',
    prompt: `Write \`isMonotone(points, leq, f)\`. \`points\` lists every fact of a small lattice, \`leq(x, y)\` says whether \`x\` is below or equal to \`y\`, and \`f\` maps facts to facts.

Return \`true\` if \`f\` is monotone (for every pair with \`x ⊑ y\`, also \`f(x) ⊑ f(y)\`) and \`false\` otherwise. The tests use the two-point lattice \`'number'\` above \`'maybe'\`, and sets of variables (sorted arrays) ordered by “contains”.`,
    starter: `// points: every fact in the lattice
// leq(x, y): is x below or equal y?
// f: a function from facts to facts
// Return true if f is monotone.
function isMonotone(points, leq, f) {
  return true;
}`,
    solution: `// points: every fact in the lattice
// leq(x, y): is x below or equal y?
// f: a function from facts to facts
// Return true if f is monotone.
function isMonotone(points, leq, f) {
  for (const x of points) {
    for (const y of points) {
      if (!leq(x, y)) continue;
      const ok = leq(f(x), f(y));
      if (!ok) return false;
    }
  }
  return true;
}`,
    tests: `const two = ['maybe', 'number'];
const le2 = (x, y) =>
  x === y || x === 'maybe';
const sets = [[], ['a'], ['b'],
  ['a', 'b']];
const sub = (x, y) =>
  x.every((v) => y.includes(v));
test('the identity is monotone', () => {
  expect(isMonotone(two, le2,
    (x) => x)).toBe(true);
});
test('swapping is not', () => {
  expect(isMonotone(two, le2,
    (x) => x === 'number'
      ? 'maybe' : 'number'))
    .toBe(false);
});
test('a constant rule is monotone', () => {
  expect(isMonotone(two, le2,
    () => 'maybe')).toBe(true);
});
test('gen/kill is monotone', () => {
  const f = (s) => [...new Set(['b',
    ...s.filter((v) => v !== 'a')])]
    .sort();
  expect(isMonotone(sets, sub, f))
    .toBe(true);
});
test('“if empty, add a” is not', () => {
  const f = (s) =>
    s.length === 0 ? ['a'] : [];
  expect(isMonotone(sets, sub, f))
    .toBe(false);
});`,
    hints: [
      'The definition talks about every pair of facts, so loop over every `x` and, inside, every `y`.',
      'Skip the pairs where `x` is not below or equal to `y`: the definition says nothing about them.',
      'For the others, check `leq(f(x), f(y))`. One failure is enough to return `false`; if no pair fails, return `true`.',
    ],
    walkthrough: `**How to think about it.** Monotone is a statement about every pair: "whenever x ⊑ y, f(x) ⊑ f(y)". On a small lattice you can check it directly by trying all the pairs. There are two traps: checking only pairs where the condition holds (pairs that are not ordered tell you nothing), and checking the conclusion the wrong way round.

**The solution, line by line.**

- \`for (const x of points) {\` and \`for (const y of points) {\` try every ordered pair of facts, including a fact with itself (which always passes).
- \`if (!leq(x, y)) continue;\` skips pairs where x is not below y: the rule only promises something about ordered pairs. For sets this skips, for example, \`['a']\` against \`['b']\`.
- \`const ok = leq(f(x), f(y));\` checks the promise: the output for the lower input must be below or equal to the output for the higher one.
- \`if (!ok) return false;\` One broken pair is enough: the function is not monotone.
- \`return true;\` No pair broke the promise.

For the "if empty, add a" rule, the pair \`x = []\`, \`y = ['a']\` has \`x ⊑ y\`, but \`f(x) = ['a']\` and \`f(y) = []\`, and \`['a']\` is not contained in \`[]\`: a bigger input gave a smaller output. For swapping, \`'maybe' ⊑ 'number'\`, but the outputs are \`'number'\` and \`'maybe'\`, the wrong way round. The gen/kill rule (remove \`a\`, add \`b\`) passes every pair, as the chapter argued it must.

**Common wrong attempts.**

- Checking \`leq(f(y), f(x))\`, the conclusion turned round: that tests whether \`f\` turns the order upside down, which swapping does, so swapping would wrongly pass.
- Checking only \`leq(f(x), x)\` ("the rule never goes up"): a rule can go up and still be monotone (the constant rule "always number" goes up from \`'maybe'\`), and a rule can never go up and still not be monotone (on sets, a rule that turns \`['a', 'b']\` into \`['b']\` and leaves every other set alone never goes up, yet \`['a'] ⊑ ['a', 'b']\` while the outputs are \`['a']\` and \`['b']\`).
- Returning \`true\` as soon as one pair passes: monotone needs *every* ordered pair to pass.`,
    wrong: [
      {
        code: `// points: every fact in the lattice
// leq(x, y): is x below or equal y?
// f: a function from facts to facts
// Return true if f is monotone.
function isMonotone(points, leq, f) {
  for (const x of points) {
    for (const y of points) {
      if (!leq(x, y)) continue;
      const ok = leq(f(y), f(x));
      if (!ok) return false;
    }
  }
  return true;
}`,
        why: 'This checks the order turned upside down: swapping number and maybe passes it, though it is not monotone.',
      },
      {
        code: `// points: every fact in the lattice
// leq(x, y): is x below or equal y?
// f: a function from facts to facts
// Return true if f is monotone.
function isMonotone(points, leq, f) {
  for (const x of points) {
    for (const y of points) {
      const ok = leq(f(x), f(y));
      if (!ok) return false;
    }
  }
  return true;
}`,
        why: 'Without skipping unordered pairs, even the identity fails (for x = number, y = maybe), though it is monotone.',
      },
    ],
  },
  fold: {
    title: 'A folder for one block',
    prompt: `Write \`fold(insts)\` for one block of SSA instructions, given in order. Each instruction is an object with an \`id\` and an \`op\`:

- \`'const'\` has a \`value\` (a number, string or boolean);
- \`'param'\` is an unknown value;
- \`'call'\` calls something (its \`args\` are ids) and may have side effects;
- \`'+'\`, \`'-'\`, \`'*'\`, \`'/'\` and \`'<'\` have two \`args\`, the ids of earlier instructions.

Return a **new list**, in the same order and the same length. An instruction whose op is in \`OPS\` and whose two args are both known constants (a \`'const'\`, or something you already folded) becomes \`{ id, op: 'const', value }\`, with the value computed by \`OPS\`. Everything else is returned unchanged. A \`'call'\` is never folded.`,
    starter: `// An instruction: { id, op, args,
// value }. op is 'const' (with a
// value), 'param', 'call', or one of
// the keys of OPS (two args).
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '<': (a, b) => a < b,
};
function fold(insts) {
  return insts;
}`,
    solution: `// An instruction: { id, op, args,
// value }. op is 'const' (with a
// value), 'param', 'call', or one of
// the keys of OPS (two args).
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '<': (a, b) => a < b,
};
function fold(insts) {
  const known = new Map();
  const out = [];
  for (const i of insts) {
    if (i.op === 'const') {
      known.set(i.id, i.value);
      out.push(i);
      continue;
    }
    const f = OPS[i.op];
    const ok = f && i.args.every(
      (a) => known.has(a));
    if (!ok) {
      out.push(i);
      continue;
    }
    const [x, y] = i.args.map(
      (a) => known.get(a));
    const v = f(x, y);
    known.set(i.id, v);
    out.push({ id: i.id, op: 'const',
      value: v });
  }
  return out;
}`,
    tests: `const C = (id, value) =>
  ({ id, op: 'const', value });
const B = (id, op, a, b) =>
  ({ id, op, args: [a, b] });
const P = (id) =>
  ({ id, op: 'param', args: [] });
test('one fold', () => {
  const out = fold([C(1, 2), C(2, 50),
    B(3, '*', 1, 2)]);
  expect(out[2]).toEqual(C(3, 100));
});
test('a folded value feeds the next fold', () => {
  const out = fold([C(1, 60),
    B(2, '*', 1, 1), C(3, 24),
    B(4, '*', 2, 3)]);
  expect(out[3]).toEqual(C(4, 86400));
});
test('one unknown operand stops a fold', () => {
  const out = fold([P(1), C(2, 100),
    B(3, '<', 1, 2), C(4, 5),
    B(5, '-', 4, 4)]);
  expect(out[2]).toEqual(B(3, '<', 1, 2));
  expect(out[4]).toEqual(C(5, 0));
});
test('calls are never folded', () => {
  const call = { id: 2, op: 'call',
    args: [1] };
  const out = fold([C(1, 5), call]);
  expect(out[1]).toEqual(call);
});
test('JavaScript answers, exactly', () => {
  const out = fold([C(1, '1'), C(2, 2),
    B(3, '+', 1, 2), C(4, 0.1),
    C(5, 0.2), B(6, '+', 4, 5),
    C(7, 0), C(8, -1), B(9, '*', 7, 8),
    B(10, '/', 2, 7)]);
  expect(out[2].value).toBe('12');
  expect(out[5].value)
    .toBe(0.30000000000000004);
  expect(out[8].value).toBe(-0);
  expect(out[9].value).toBe(Infinity);
});
test('same length and order', () => {
  const out = fold([C(1, 2), P(2)]);
  expect(out.map((i) => i.id))
    .toEqual([1, 2]);
});`,
    hints: [
      'Walk the list once, from the top. Because the code is SSA and straight-line, every operand is defined above its use, so when you reach an instruction you already know everything you ever will about its operands.',
      'Keep a `Map` from id to known constant value. A `const` goes straight into it. An instruction can be folded if `OPS[i.op]` exists and both of its args are in the map (use `has`, not a truthiness test: `0` and `\'\'` are real constants).',
      'When you fold one, compute `OPS[i.op](x, y)`, push `{ id: i.id, op: \'const\', value: v }`, and also put `v` into the map under `i.id`, so that later instructions using it can fold too.',
    ],
    walkthrough: `**How to think about it.** Do the first test by hand: \`%1 = const 2\`, \`%2 = const 50\`, \`%3 = %1 * %2\`. When you reach \`%3\` you ask "do I know both operands?", look them up, find 2 and 50, multiply, and write \`const 100\`. So the whole job is: remember the value of every constant you pass, and, for each arithmetic instruction, look its operands up. The one subtle point is the second test: after folding \`%2 = %1 * %1\` into \`const 3600\`, the instruction \`%4 = %2 * %3\` must be able to fold too, so a folded result has to go into the same memory as an original \`const\`.

**The solution, line by line.**

- \`const known = new Map();\` remembers, for each id, the constant value it is known to hold.
- \`const out = [];\` is the new list we return; we never change the input.
- \`for (const i of insts) {\` visits the instructions in order, top to bottom.
- \`if (i.op === 'const') { known.set(i.id, i.value); out.push(i); continue; }\` handles a constant: record its value and keep it as it is.
- \`const f = OPS[i.op];\` looks up the operation. For \`'param'\` and \`'call'\` there is no entry, so \`f\` is \`undefined\`, which is how calls are kept safe: they are simply not in the table of things we know how to do early.
- \`const ok = f && i.args.every((a) => known.has(a));\` is true only if we know how to do the operation *and* both operands are known constants.
- \`if (!ok) { out.push(i); continue; }\` keeps any instruction we cannot fold, unchanged.
- \`const [x, y] = i.args.map((a) => known.get(a));\` fetches the two operand values.
- \`const v = f(x, y);\` does the operation now, with JavaScript's own \`+\`, \`*\` and so on, which is exactly why \`'1' + 2\` gives \`'12'\` and \`0 * -1\` gives \`-0\`, the same as at run time.
- \`known.set(i.id, v);\` records the result, so this folded value can feed later folds.
- \`out.push({ id: i.id, op: 'const', value: v });\` replaces the instruction with a constant of the same id; anything that used this id now uses the constant.
- \`return out;\` hands back the new list.

**Common wrong attempts.**

- Testing operands with \`k[a]\` (truthiness) instead of \`known.has(a)\`: the constant \`0\` (and \`''\` and \`false\`) looks "unknown", so \`0 * -1\` is never folded and the \`-0\` test fails.
- Remembering only the original \`const\` instructions: the first fold works, but its result is never recorded, so \`%4 = %2 * %3\` in the second test is left alone.
- Writing your own arithmetic, such as \`Number(x) + Number(y)\`, "to be safe": that turns \`'1' + 2\` into \`3\`, which is not what JavaScript computes.`,
    wrong: [
      {
        code: `// An instruction: { id, op, args,
// value }. op is 'const' (with a
// value), 'param', 'call', or one of
// the keys of OPS (two args).
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '<': (a, b) => a < b,
};
function fold(insts) {
  const k = {};
  return insts.map((i) => {
    if (i.op === 'const') {
      k[i.id] = i.value;
      return i;
    }
    const f = OPS[i.op];
    if (!f || !i.args.every(
      (a) => k[a])) return i;
    const v = f(k[i.args[0]],
      k[i.args[1]]);
    k[i.id] = v;
    return { id: i.id, op: 'const',
      value: v };
  });
}`,
        why: '`k[a]` is a truthiness test, so a constant `0` counts as unknown and `0 * -1` is never folded. Ask whether the id is known (`has`, or `in`), not whether its value is truthy.',
      },
      {
        code: `// An instruction: { id, op, args,
// value }. op is 'const' (with a
// value), 'param', 'call', or one of
// the keys of OPS (two args).
const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '<': (a, b) => a < b,
};
function fold(insts) {
  const k = new Map();
  for (const i of insts) {
    if (i.op === 'const')
      k.set(i.id, i.value);
  }
  return insts.map((i) => {
    const f = OPS[i.op];
    if (!f || !i.args.every(
      (a) => k.has(a))) return i;
    return { id: i.id, op: 'const',
      value: f(k.get(i.args[0]),
        k.get(i.args[1])) };
  });
}`,
        why: 'Folded results are never added to the map, so a fold cannot feed the next one: `%4 = %2 * %3` stays unfolded in the second test.',
      },
    ],
  },
  sccp: {
    title: 'Sparse conditional constant propagation',
    prompt: `Write \`sccp(f)\` for a small function in SSA. \`f.blocks\` is a list of blocks; block 0 is the entry. Each block has \`preds\` (its predecessor block numbers), \`insts\` and a terminator \`term\`:

- an instruction is \`{ id, op, args, value }\`, where \`op\` is \`'const'\` (with a \`value\`), \`'param'\` (unknown), \`'phi'\` (its \`args\` line up with the block's \`preds\`: the k-th arg comes from the k-th predecessor), or one of the keys of \`OPS\`;
- \`term\` is \`{ kind: 'br', to }\`, \`{ kind: 'cond', c, t, e }\` (go to block \`t\` if value \`c\` is true, else to \`e\`) or \`{ kind: 'ret', v }\`.

Return \`{ val, live }\`: \`val\` is a \`Map\` from instruction id to its lattice value (a constant or \`BOT\`; ids you never set count as \`TOP\`), and \`live\` is the \`Set\` of reachable blocks. Start optimistic about everything. You may repeat rounds over all reachable blocks until nothing changes (the worklists of the chapter are a faster way to the same answer). \`meet\` and \`OPS\` are given.`,
    starter: `const TOP = 'top';
const BOT = 'varies';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}
const OPS = {
  '+': (a, b) => a + b,
  '*': (a, b) => a * b,
  '<': (a, b) => a < b,
};
// f.blocks[b] = { preds, insts, term }
// inst: { id, op, args, value }
// term: { kind: 'br', to }
//   | { kind: 'cond', c, t, e }
//   | { kind: 'ret', v }
function sccp(f) {
  // your code here
  return { val: new Map(),
    live: new Set([0]) };
}`,
    solution: `const TOP = 'top';
const BOT = 'varies';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}
const OPS = {
  '+': (a, b) => a + b,
  '*': (a, b) => a * b,
  '<': (a, b) => a < b,
};
// f.blocks[b] = { preds, insts, term }
// inst: { id, op, args, value }
// term: { kind: 'br', to }
//   | { kind: 'cond', c, t, e }
//   | { kind: 'ret', v }
function sccp(f) {
  const val = new Map();
  const get = (id) =>
    val.has(id) ? val.get(id) : TOP;
  const live = new Set([0]);
  const exec = new Set();
  let changed = true;
  const mark = (a, b) => {
    const k = a + '>' + b;
    if (exec.has(k)) return;
    exec.add(k);
    live.add(b);
    changed = true;
  };
  const evaluate = (i, b) => {
    if (i.op === 'const')
      return i.value;
    if (i.op === 'param') return BOT;
    if (i.op === 'phi') {
      const ps = f.blocks[b].preds;
      let v = TOP;
      i.args.forEach((a, k) => {
        if (exec.has(ps[k] + '>' + b))
          v = meet(v, get(a));
      });
      return v;
    }
    const [x, y] = i.args.map(get);
    if (x === BOT || y === BOT)
      return BOT;
    if (x === TOP || y === TOP)
      return TOP;
    return OPS[i.op](x, y);
  };
  while (changed) {
    changed = false;
    f.blocks.forEach((blk, b) => {
      if (!live.has(b)) return;
      for (const i of blk.insts) {
        const v = evaluate(i, b);
        if (!Object.is(v, get(i.id))) {
          val.set(i.id, v);
          changed = true;
        }
      }
      const t = blk.term;
      if (t.kind === 'br')
        mark(b, t.to);
      if (t.kind !== 'cond') return;
      const c = get(t.c);
      if (c === true || c === BOT)
        mark(b, t.t);
      if (c === false || c === BOT)
        mark(b, t.e);
    });
  }
  return { val, live };
}
`,
    tests: `const K = (id, value) =>
  ({ id, op: 'const', args: [], value });
const O = (id, op, ...args) =>
  ({ id, op, args });
const at = (r, id) =>
  r.val.has(id) ? r.val.get(id) : TOP;
const diamond = (cond) => ({ blocks: [
  { preds: [], insts: [K(0, 1), K(2, 0),
    cond], term: { kind: 'cond', c: 3,
    t: 1, e: 2 } },
  { preds: [0], insts: [K(4, 2)],
    term: { kind: 'br', to: 3 } },
  { preds: [0], insts: [K(5, 3)],
    term: { kind: 'br', to: 3 } },
  { preds: [1, 2], insts: [
    O(6, 'phi', 4, 5), K(7, 10),
    O(8, '*', 6, 7)],
    term: { kind: 'ret', v: 8 } },
] });
test('a constant branch: z is 20', () => {
  const r = sccp(diamond(O(3, '<', 2, 0)));
  expect(at(r, 3)).toBe(true);
  expect(at(r, 6)).toBe(2);
  expect(at(r, 8)).toBe(20);
});
test('the dead block is never reached', () => {
  const r = sccp(diamond(O(3, '<', 2, 0)));
  expect(r.live.has(2)).toBe(false);
  expect(at(r, 5)).toBe(TOP);
  expect([...r.live].sort()).toEqual([0, 1, 3]);
});
test('an unknown branch: both sides', () => {
  const r = sccp(diamond(O(3, 'param')));
  expect(at(r, 6)).toBe(BOT);
  expect(at(r, 8)).toBe(BOT);
  expect(r.live.has(2)).toBe(true);
});
const loop = (step) => ({ blocks: [
  { preds: [], insts: [K(0, 7),
    O(1, 'param'), K(9, 1)],
    term: { kind: 'br', to: 1 } },
  { preds: [0, 2], insts: [
    O(2, 'phi', 0, step),
    O(3, '<', 2, 1)],
    term: { kind: 'cond', c: 3,
      t: 2, e: 3 } },
  { preds: [1], insts: [O(4, '+', 2, 9)],
    term: { kind: 'br', to: 1 } },
  { preds: [1], insts: [],
    term: { kind: 'ret', v: 2 } },
] });
test('a loop that never changes x', () => {
  const r = sccp(loop(2));
  expect(at(r, 2)).toBe(7);
});
test('a counter varies', () => {
  const r = sccp(loop(4));
  expect(at(r, 2)).toBe(BOT);
  expect(at(r, 4)).toBe(BOT);
});
`,
    hints: [
      'You need three pieces of state: `val` (id to lattice value), `live` (reachable blocks, starting with block 0) and `exec`, the set of executable edges (a string such as `\'0>1\'` makes a good key). Wrap everything in `while (changed) { changed = false; ... }`.',
      'Write a helper `evaluate(i, b)` for one instruction: a `const` gives its value, a `param` gives `BOT`, an operator gives `BOT` if an operand is `BOT`, `TOP` if an operand is still `TOP`, and otherwise `OPS[i.op](x, y)`.',
      'For a phi in block `b`, start at `TOP` and `meet` in arg `k` only if the edge from `preds[k]` to `b` is in `exec`. For a terminator: `br` marks its edge; `cond` marks the `t` edge when the condition is `true` or `BOT`, and the `e` edge when it is `false` or `BOT`. Marking a new edge adds its target to `live` and sets `changed`.',
    ],
    walkthrough: `**How to think about it.** SCCP keeps two kinds of fact and is optimistic about both: every value starts at ⊤ ("nothing known yet") and every edge starts not executable. Only facts that the code *forces* are added: a constant gets its value, a branch on \`true\` opens its then edge, and so on. Because values only move down the ladder (⊤, then a constant, then ⊥) and edges only ever get opened, never closed, repeating the same rules until a whole round changes nothing must stop, and the place it stops is the most precise consistent answer. The worklists in the chapter are a way to avoid revisiting instructions whose inputs did not change; repeating rounds reaches exactly the same fixpoint, only more slowly, so we use rounds to keep the code short.

**The solution, line by line.**

- \`const val = new Map();\` holds the lattice value of each instruction we have evaluated.
- \`const get = (id) => val.has(id) ? val.get(id) : TOP;\` reads a value, treating anything not yet set as ⊤. This *is* the optimistic start: we never write ⊤ down, we just assume it.
- \`const live = new Set([0]);\` says the entry block is reachable; nothing else is, yet.
- \`const exec = new Set();\` holds the executable edges, as strings like \`'0>1'\`.
- \`let changed = true;\` drives the outer loop.
- \`const mark = (a, b) => { ... }\` opens the edge from block \`a\` to block \`b\`: if it is already open it returns; otherwise it records the edge, makes \`b\` reachable and sets \`changed\`, because a new edge can change a phi in \`b\` or make a whole new block worth visiting.
- \`const evaluate = (i, b) => { ... }\` gives one instruction's value from its operands' current values:
  - \`if (i.op === 'const') return i.value;\` a constant is itself;
  - \`if (i.op === 'param') return BOT;\` a parameter could be anything;
  - for a \`'phi'\`, \`const ps = f.blocks[b].preds;\` fetches the block's predecessors, \`let v = TOP;\` starts the merge, and the \`forEach\` meets in the k-th argument only when the edge \`ps[k] + '>' + b\` is executable; arguments from edges nobody has opened are ignored, which is the heart of SCCP;
  - for an operator, \`const [x, y] = i.args.map(get);\` reads both operands; if either is ⊥ the answer varies, if either is still ⊤ we do not know yet, and otherwise \`OPS[i.op](x, y)\` folds it, exactly as in the last chapter.
- \`while (changed) { changed = false;\` repeats rounds until one changes nothing.
- \`f.blocks.forEach((blk, b) => { if (!live.has(b)) return;\` visits only reachable blocks: an unreachable block's instructions stay at ⊤.
- The inner \`for\` evaluates each instruction and, if its value differs from the stored one (\`Object.is\`, so that \`0\` and \`-0\` count as different and \`NaN\` as equal to itself), stores it and sets \`changed\`.
- \`if (t.kind === 'br') mark(b, t.to);\` an unconditional jump opens its one edge.
- \`const c = get(t.c);\` reads the branch condition. \`if (c === true || c === BOT) mark(b, t.t);\` and \`if (c === false || c === BOT) mark(b, t.e);\` open the edges the condition allows: one for a constant, both when it varies, and neither while it is still ⊤ (a later round will decide).
- \`return { val, live };\` hands back both kinds of fact.

On the diamond, round one: block 0 gives \`%3 = (0 < 1) = true\`, so only edge 0>1 opens; block 1 gives \`%4 = 2\` and opens 1>3; block 3's phi meets only \`%4\` (edge 2>3 is closed), so \`%6 = 2\` and \`%8 = 20\`. Round two changes nothing, and block 2 was never visited. In the loop test, the header phi first meets only \`7\` (the back edge is closed), and when the back edge opens it brings \`%2\` itself, still 7, so it stays 7.

**Common wrong attempts.**

- Meeting every phi argument whether or not its edge is open: on its own this still gives 2 on the diamond, because the dead block is never visited and its \`%5\` stays ⊤, which gives way. Combine it with opening both edges of every \`cond\` (the wrong attempt below, which is plain constant propagation) and the dead block is visited, \`%5\` becomes 3, and \`%6\` falls to ⊥.
- Treating an operand that is still ⊤ as ⊥ ("I don't know, so assume it varies"): that is a pessimistic start, and the loop that never changes \`x\` comes out as ⊥, because its phi meets 7 with its own not-yet-known value.
- Opening both edges of every \`cond\` but keeping the edge check in phis: the dead block becomes reachable, its edge to the join opens, and its 3 spoils the phi just the same.`,
    wrong: [
      {
        code: `const TOP = 'top';
const BOT = 'varies';
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}
const OPS = {
  '+': (a, b) => a + b,
  '*': (a, b) => a * b,
  '<': (a, b) => a < b,
};
// f.blocks[b] = { preds, insts, term }
// inst: { id, op, args, value }
// term: { kind: 'br', to }
//   | { kind: 'cond', c, t, e }
//   | { kind: 'ret', v }
function sccp(f) {
  const val = new Map();
  const get = (id) =>
    val.has(id) ? val.get(id) : TOP;
  const live = new Set([0]);
  const exec = new Set();
  let changed = true;
  const mark = (a, b) => {
    const k = a + '>' + b;
    if (exec.has(k)) return;
    exec.add(k);
    live.add(b);
    changed = true;
  };
  const evaluate = (i, b) => {
    if (i.op === 'const')
      return i.value;
    if (i.op === 'param') return BOT;
    if (i.op === 'phi') {
      const ps = f.blocks[b].preds;
      let v = TOP;
      i.args.forEach((a, k) => {
        v = meet(v, get(a));
      });
      return v;
    }
    const [x, y] = i.args.map(get);
    if (x === BOT || y === BOT)
      return BOT;
    if (x === TOP || y === TOP)
      return TOP;
    return OPS[i.op](x, y);
  };
  while (changed) {
    changed = false;
    f.blocks.forEach((blk, b) => {
      if (!live.has(b)) return;
      for (const i of blk.insts) {
        const v = evaluate(i, b);
        if (!Object.is(v, get(i.id))) {
          val.set(i.id, v);
          changed = true;
        }
      }
      const t = blk.term;
      if (t.kind === 'br')
        mark(b, t.to);
      if (t.kind !== 'cond') return;
      const c = get(t.c);
      mark(b, t.t);
      mark(b, t.e);
    });
  }
  return { val, live };
}
`,
        why: 'Every branch opens both edges and every phi meets all its arguments, so the dead `else` block is visited and its 3 meets the 2: `%6` comes out ⊥, not 2. That is plain propagation, not conditional.',
      },
    ],
  },
  meet: {
    optional: true,
    title: 'The constant lattice',
    prompt: 'Write `meet(a, b)` for the three-level constant lattice. `TOP` means "no information yet", `BOT` means "varies", and anything else is a constant. Meeting `TOP` with `x` gives `x`; `BOT` with anything gives `BOT`; two constants give that constant if they are the **same value** in JavaScript\'s strictest sense (so `0` and `-0` differ, and `NaN` is the same as `NaN`), and `BOT` otherwise.',
    starter: `const TOP = 'top';
const BOT = 'varies';
// a, b: TOP, BOT, or a constant.
function meet(a, b) {
  return a;
}`,
    solution: `const TOP = 'top';
const BOT = 'varies';
// a, b: TOP, BOT, or a constant.
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return Object.is(a, b) ? a : BOT;
}`,
    tests: `const phi = (...xs) =>
  xs.reduce(meet, TOP);
test('top gives way', () => {
  expect(meet(TOP, 4)).toBe(4);
  expect(meet(4, TOP)).toBe(4);
  expect(meet(TOP, TOP)).toBe(TOP);
});
test('equal constants stay', () => {
  expect(phi(2, 2, 2)).toBe(2);
});
test('different constants vary', () => {
  expect(phi(2, 3)).toBe(BOT);
});
test('bottom wins', () => {
  expect(meet(BOT, 2)).toBe(BOT);
  expect(phi(2, TOP, BOT)).toBe(BOT);
});
test('0 and -0 differ', () => {
  expect(meet(0, -0)).toBe(BOT);
});
test('NaN is the same as NaN', () => {
  expect(meet(NaN, NaN)).toBe(NaN);
});`,
    hints: [
      'Read the lattice from the top: handle `TOP` first, since it gives way to the other side.',
      'Then `BOT`: if either side varies, so does the merge. Only after that compare two real constants.',
      'Compare with `Object.is(a, b)`, not `===`: it says `0` and `-0` differ and that `NaN` is the same as `NaN`.',
    ],
    walkthrough: `**How to think about it.** The order of the checks *is* the lattice, read from top to bottom: first the top, which gives way; then the bottom, which wins; and only when both sides are real constants do you compare them.

**The solution, line by line.**

- \`if (a === TOP) return b;\` a value nobody has worked out yet must not spoil the merge; this is the optimism that lets a loop phi \`φ(7, itself)\` stay 7.
- \`if (b === TOP) return a;\` the same from the other side, so \`meet\` does not care about the order of its arguments.
- \`if (a === BOT || b === BOT) { return BOT; }\` once one side varies, the merge varies.
- \`return Object.is(a, b) ? a : BOT;\` two constants: the same one stays, different ones vary.

**Common wrong attempts.**

- Using \`a === b\` for the last test: \`0 === -0\` is true, yet \`1 / 0\` and \`1 / -0\` differ, so merging the two zeros into one constant would change a program; and \`NaN === NaN\` is false, which would turn a phi of two \`NaN\`s into ⊥ for no reason.
- Checking \`BOT\` before \`TOP\`: it happens to give the same answers here, because \`TOP ⊓ BOT\` is \`BOT\` either way, but reading the lattice from the top keeps the code matching the picture.`,
    wrong: [
      {
        code: `const TOP = 'top';
const BOT = 'varies';
// a, b: TOP, BOT, or a constant.
function meet(a, b) {
  if (a === TOP) return b;
  if (b === TOP) return a;
  if (a === BOT || b === BOT) {
    return BOT;
  }
  return a === b ? a : BOT;
}`,
        why: 'With `===`, `0` and `-0` look equal, though `1 / 0` and `1 / -0` differ; and `NaN` never equals itself, so two `NaN`s would vary.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does a dataflow analysis attach facts to blocks rather than following paths?',
    options: [
      {
        t: 'Blocks are faster to read than instructions.',
        why: 'Speed of reading is not the point; the trouble with paths is how many there are.',
      },
      {
        t: 'A program can have far too many paths, even infinitely many with a loop, but it has only a few blocks.',
        correct: true,
        why: 'One fact per block point, with rules on edges, covers every path at once.',
      },
      {
        t: 'Paths do not exist until the program runs.',
        why: 'Paths through the CFG exist on paper; there are just too many of them to list.',
      },
    ],
  },
  {
    q: 'At a join, OUT of the two predecessors is `{a, b}` and `{b, c}`. In a “definitely assigned” (must) analysis, what is IN of the join?',
    options: [
      {
        t: '`{a, b, c}`',
        why: 'That is the union, the answer to “may have been assigned”.',
      },
      {
        t: '`{ }`',
        why: 'The sets share `b`, so the intersection is not empty.',
      },
      {
        t: '`{b}`',
        correct: true,
        why: 'A must question keeps only what is true on every incoming path: the intersection.',
      },
    ],
  },
  {
    q: '“Will this variable be read again later?” Which kind of analysis answers it?',
    options: [
      {
        t: 'Backward: facts flow from a block’s successors to it.',
        correct: true,
        why: 'The question is about the future, so information comes from the blocks that run afterwards.',
      },
      {
        t: 'Forward: facts flow from a block’s predecessors to it.',
        why: 'Predecessors run earlier; they cannot tell you about later reads.',
      },
      {
        t: 'Neither: it needs the program to run.',
        why: 'It is a classic static question, answered by a backward dataflow analysis.',
      },
    ],
  },
  {
    q: 'Which is the transfer function of a block in the “definitely assigned” analysis?',
    options: [
      {
        t: 'OUT = IN minus the variables the block reads',
        why: 'Reading a variable doesn’t un-assign it.',
      },
      {
        t: 'OUT = the intersection of the successors’ IN',
        why: 'That would be a backward meet, not a transfer function.',
      },
      {
        t: 'OUT = IN, unchanged',
        why: 'Then no variable would ever count as assigned.',
      },
      {
        t: 'OUT = IN plus the variables the block assigns',
        correct: true,
        why: 'Passing through the block can only add assigned variables.',
      },
    ],
  },
  {
    q: 'In a lattice, what is the meet of two facts?',
    options: [
      {
        t: 'The fact that appears most often',
        why: 'Merging is not a vote.',
      },
      {
        t: 'The lowest fact in the whole lattice',
        why: 'That is always below both, but usually far lower than needed: it throws information away.',
      },
      {
        t: 'The highest fact that is below both of them',
        correct: true,
        why: 'It keeps as much as both facts promise, and no more.',
      },
      {
        t: 'Whichever of the two facts is higher',
        why: 'That would keep a promise one side doesn’t make. And for `{x}` and `{y}` neither is higher.',
      },
    ],
  },
  {
    q: 'Why can’t “definitely assigned” be solved in a single pass on a CFG with a loop?',
    options: [
      {
        t: 'Loops have no basic blocks.',
        why: 'A loop is made of ordinary blocks; the trouble is how they depend on each other.',
      },
      {
        t: 'The loop header’s IN depends on the body’s OUT, which depends on the header’s OUT.',
        correct: true,
        why: 'The back edge makes a cycle, so no order visits every block after all its predecessors.',
      },
      {
        t: 'The loop might run for ever.',
        why: 'The analysis never runs the loop. It stops even when the program would not.',
      },
    ],
  },
  {
    q: 'Starting pessimistic, a counting loop’s phi ends up “maybe not a number”. Starting optimistic, it ends up “number”. Which is right?',
    options: [
      {
        t: 'Pessimistic: assuming less is always more correct.',
        why: 'Both are consistent, but the pessimistic one throws away a fact that is in fact true.',
      },
      {
        t: 'Neither: the analysis didn’t reach a fixpoint.',
        why: 'Both are fixpoints: applying the rules again changes nothing in either.',
      },
      {
        t: 'Optimistic: both are fixpoints, and the optimistic one is the most precise.',
        correct: true,
        why: 'No rule contradicts “number” for that loop, so the optimistic answer holds and tells you more.',
      },
    ],
  },
  {
    q: 'In a forward worklist solver, block b’s OUT just changed. What should be added to the worklist?',
    options: [
      {
        t: 'b’s successors',
        correct: true,
        why: 'Their IN is the meet of their predecessors’ OUT, which now includes b’s new fact.',
      },
      {
        t: 'b’s predecessors',
        why: 'Their facts don’t depend on b in a forward analysis; that is the backward case.',
      },
      {
        t: 'Every block in the function',
        why: 'That is the round-based approach. A worklist adds only what could be affected.',
      },
      {
        t: 'Nothing: b has been processed',
        why: 'Blocks that read b’s OUT may now be wrong, so they must be recomputed.',
      },
    ],
  },
  {
    q: 'What guarantees that a worklist solver for “definitely assigned” stops?',
    options: [
      {
        t: 'The worklist never holds more than one block.',
        why: 'It can hold many. What matters is how often each fact can change.',
      },
      {
        t: 'Programs have no infinite loops.',
        why: 'The analysis doesn’t run the program; it ends even on programs that loop for ever.',
      },
      {
        t: 'The cap of 1000 rounds.',
        why: 'That cap is Viscosity’s safety net for its round-based loop; a worklist on this lattice ends without one.',
      },
      {
        t: 'Sets only lose variables, there are finitely many variables, and blocks are re-added only after a change.',
        correct: true,
        why: 'Finite height plus one-way movement bounds the number of changes, so the list empties.',
      },
    ],
  },
  {
    q: 'What does Viscosity do if its numeric inference has not settled after 1000 rounds?',
    options: [
      {
        t: 'Keeps the facts from the last round.',
        why: 'An unsettled answer might still contain a wrong optimistic guess.',
      },
      {
        t: 'Runs another 1000 rounds.',
        why: 'It stops at the cap.',
      },
      {
        t: 'Marks every fact as not proven, so nothing is transformed on its strength.',
        correct: true,
        why: 'It fails closed: a missed optimisation is slow, a wrong one is a bug.',
      },
    ],
  },
  {
    q: 'In the lattice of sets ordered by “contains”, which is true of {a} and {b}?',
    options: [
      {
        t: '{a} is below {b}, because a comes before b.',
        why: 'The order is containment, not the alphabet; neither set contains the other.',
      },
      {
        t: 'Neither is below the other; their meet is { } and their join is {a, b}.',
        correct: true,
        why: 'They are incomparable, which a partial order allows, and the lattice still gives a meet and a join.',
      },
      {
        t: 'They have no meet, so this is not a lattice.',
        why: 'The empty set is below both, and it is the highest such set.',
      },
    ],
  },
  {
    q: 'The constant lattice has a fact for every number. What is its height?',
    options: [
      {
        t: 'Infinite, like its width',
        why: 'Width and height are different: any path from top to bottom has only two steps.',
      },
      {
        t: '1',
        why: 'There are two steps: from “no info” to a constant, and from a constant to “varies”.',
      },
      {
        t: '2',
        correct: true,
        why: '“no info” above every constant, every constant above “varies”.',
      },
    ],
  },
  {
    q: 'Which rule is NOT monotone on sets ordered by “contains”?',
    options: [
      {
        t: 'f(S) = S ∪ {x}',
        why: 'A bigger S gives a bigger result.',
      },
      {
        t: 'f(S) = S − {y}',
        why: 'Removing the same element from both keeps the order.',
      },
      {
        t: 'f(S) = {x} if S is empty, otherwise { }',
        correct: true,
        why: 'Going from { } to a bigger set shrinks the output from {x} to { }.',
      },
      {
        t: 'f(S) = {z}, whatever S is',
        why: 'A constant rule never breaks the order.',
      },
    ],
  },
  {
    q: 'Why does iterating a monotone framework from the top always stop?',
    options: [
      {
        t: 'Every step goes down or stays, and finite height allows only so many steps down.',
        correct: true,
        why: 'Monotone rules started at the top give a descending chain, and its length is bounded by the height.',
      },
      {
        t: 'Because programs are finite.',
        why: 'A finite program still has infinitely many paths; the argument is about the lattice.',
      },
      {
        t: 'Because the worklist is a queue.',
        why: 'The order of visits affects speed, not whether it stops.',
      },
    ],
  },
  {
    q: '`if c { a = 1; b = 2 } else { a = 2; b = 1 }; x = a + b`. What does iterative constant propagation say about x, and why?',
    options: [
      {
        t: 'x = 3, because it is 3 on both paths.',
        why: 'That is the meet-over-all-paths answer; iteration meets a and b at the join first.',
      },
      {
        t: 'Nothing: constant propagation can’t handle if/else.',
        why: 'It handles it; it is just not as precise here.',
      },
      {
        t: 'x varies, because a and b each vary at the join, and varies + varies is varies.',
        correct: true,
        why: 'The rule for + is monotone but not distributive, so meeting first loses information.',
      },
    ],
  },
  {
    q: 'Which of these may a JavaScript compiler fold to a constant?',
    options: [
      {
        t: '`console.log(2 + 3)` into `5`',
        why: 'The `2 + 3` inside can be folded, but the call prints, and that side effect must stay.',
      },
      {
        t: '`0.1 + 0.2` into `0.3`',
        why: 'At run time the answer is 0.30000000000000004; a fold must give exactly that.',
      },
      {
        t: '`\'1\' + 2` into `\'12\'`',
        correct: true,
        why: 'Both operands are primitive constants and string joining has no side effects, so `\'12\'` is exactly what the program would compute.',
      },
      {
        t: '`1 / 0` into an error',
        why: 'In JavaScript `1 / 0` is `Infinity`, not an error, and a fold must keep that.',
      },
    ],
  },
  {
    q: '`%6 = binop * %4, %5` where `%4 = const 2` and `%5 = param`. What can a folder do with `%6`?',
    options: [
      {
        t: 'Nothing: `%5` is not a known constant',
        correct: true,
        why: 'Folding needs every operand to be a constant; a parameter is only known when the function runs.',
      },
      {
        t: 'Replace it with `const 2`',
        why: 'That would be guessing the parameter is 1.',
      },
      {
        t: 'Replace it with `%5`',
        why: 'That is an algebraic shortcut for `* 1`, and the constant here is 2.',
      },
    ],
  },
  {
    q: 'Why is `x + 0 → x` not a safe rewrite in JavaScript, even when `x` is known to be a number?',
    options: [
      {
        t: 'Because `+` is slower than a copy',
        why: 'Speed is the reason to do the rewrite, not a reason against it.',
      },
      {
        t: 'Because `x` might be `NaN`',
        why: '`NaN + 0` is `NaN`, the same as `x`, so `NaN` is not the problem.',
      },
      {
        t: 'Because `-0 + 0` is `+0`, a different value from `x`',
        correct: true,
        why: 'The two zeros differ (`1 / -0` is `-Infinity`), so the rewrite changes the value when `x` is `-0`.',
      },
    ],
  },
  {
    q: 'After folding `%6 = binop * %4, %5` into `%6 = const 100`, what has to happen to `%7 = binop < %3, %6`?',
    options: [
      {
        t: 'Its operand must be rewritten to the literal 100',
        why: 'In SSA, `%7` already refers to `%6`, which is now the constant; nothing needs copying.',
      },
      {
        t: 'Nothing: it now has a constant operand by referring to `%6`',
        correct: true,
        why: 'Each value is defined once, so changing the definition of `%6` changes what every user sees.',
      },
      {
        t: 'It must be folded too',
        why: 'Its other operand, `%3`, is a loop counter, so it cannot be folded.',
      },
      {
        t: 'It must be deleted',
        why: 'It is still needed: the branch tests it.',
      },
    ],
  },
  {
    q: 'Which instruction is **not** safe to fold, even with constant operands?',
    options: [
      {
        t: '`%3 = binop < %1, %2` with constants 1 and 0',
        why: 'A comparison of two numbers has no effects and always gives an answer: it folds to `false`.',
      },
      {
        t: '`%3 = binop / %1, %2` with constants 1 and 0',
        why: 'It gives `Infinity` and cannot throw, so it folds.',
      },
      {
        t: '`%3 = binop * %1, %2` with constants 0 and -1',
        why: 'It folds to `-0`; the folder just has to keep the sign.',
      },
      {
        t: '`%3 = call %1, %2` with constant arguments',
        correct: true,
        why: 'A call can have side effects (printing, changing state), which must still happen at run time.',
      },
    ],
  },
  {
    q: 'Viscosity has no folding pass. What does that change in its output for `for (let i = 0; i < 2 * 50; i++) ps.push(...)`?',
    options: [
      {
        t: 'It refuses to change the layout',
        why: 'It still chooses struct of arrays; folding affects only the size estimate here.',
      },
      {
        t: 'It reports "size unknown statically" instead of "about 100 elements"',
        correct: true,
        why: 'It counts loop trips only when the bound is a `const` instruction, and `2 * 50` stays a `binop`.',
      },
      {
        t: 'It makes the program print a different answer',
        why: 'Viscosity never changes what a program prints; folding or not, the output is the same.',
      },
    ],
  },
  {
    q: 'In the constant lattice, what is `⊤ ⊓ 5`?',
    options: [
      {
        t: '⊤',
        why: '⊤ means "no information yet", so it gives way to real information.',
      },
      {
        t: '5',
        correct: true,
        why: 'Meeting ⊤ with anything gives the other side; that is what lets loops keep their constants.',
      },
      {
        t: '⊥',
        why: 'Nothing contradicts 5 yet, so there is no reason to give up.',
      },
    ],
  },
  {
    q: '`x = 1; if (x > 0) y = 2; else y = 3; z = y * 10;` What does **plain** constant propagation (no edge tracking) conclude about `z`?',
    options: [
      {
        t: '`z` is 20',
        why: 'That needs SCCP: plain propagation still counts the else edge.',
      },
      {
        t: '`z` is not a constant',
        correct: true,
        why: 'It meets 2 and 3 at the phi, gets ⊥, and so `y * 10` varies too, even though the else block can never run.',
      },
      {
        t: '`z` is 30',
        why: 'Nothing would pick the else branch’s value on its own.',
      },
      {
        t: 'It cannot run on code with an `if`',
        why: 'It runs fine; the `if` only limits what it can prove.',
      },
    ],
  },
  {
    q: 'What does SCCP conclude about a loop counter `i = φ(0, i + 1)`?',
    options: [
      {
        t: '0, because that is the first value',
        why: 'The back edge brings 1, and 0 ⊓ 1 = ⊥.',
      },
      {
        t: '⊤, because the loop might not run',
        why: 'The header is reachable from the entry, so the phi gets at least 0.',
      },
      {
        t: '⊥: it varies',
        correct: true,
        why: 'The entry brings 0 and the back edge 1; two different constants meet to ⊥.',
      },
    ],
  },
  {
    q: 'In SCCP, a `condbr` whose condition is still ⊤ marks which edges executable?',
    options: [
      {
        t: 'Both',
        why: 'That is the rule for ⊥. With ⊤ nothing is known yet.',
      },
      {
        t: 'Only the then edge',
        why: 'That is the rule for the constant `true`.',
      },
      {
        t: 'Neither, for now',
        correct: true,
        why: 'Being optimistic, it waits: a later visit, once the condition has a value, decides.',
      },
      {
        t: 'Only the else edge',
        why: 'That is the rule for the constant `false`.',
      },
    ],
  },
  {
    q: 'After SCCP finishes, some values are still ⊤. What does that tell you?',
    options: [
      {
        t: 'They are in blocks that never run',
        correct: true,
        why: 'Every value in a reachable block is evaluated at least once, so only values in unreachable blocks keep ⊤.',
      },
      {
        t: 'They are constants that could not be computed',
        why: 'A constant that was computed would hold its value, not ⊤.',
      },
      {
        t: 'The analysis did not finish',
        why: 'It finishes when both worklists are empty, which they are.',
      },
    ],
  },
  {
    q: 'What does Viscosity’s numeric inference share with SCCP?',
    options: [
      {
        t: 'Tracking which CFG edges are executable',
        why: 'It does not track edges, so values from impossible branches still count.',
      },
      {
        t: 'The three-level constant lattice',
        why: 'Its lattice has two levels: number and maybe not.',
      },
      {
        t: 'A pass that replaces your arithmetic with constants',
        why: 'Viscosity rewrites data layouts, not arithmetic.',
      },
      {
        t: 'An optimistic fixpoint over SSA values',
        correct: true,
        why: 'It starts optimistic and repeats its rules until nothing changes: the same machine on a smaller lattice.',
      },
    ],
  },
];
