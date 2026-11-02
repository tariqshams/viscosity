// Chapter 195 cards. Keys are stable ids: never rename them.

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
};

const HEAD = `// blocks: { b: { preds, assigns } }
// order: every block after its preds
// Return { b: sorted variables
//   definitely assigned at b's start }
function definite(blocks, order) {`;

const SOL = `${HEAD}
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
}`;

export const exercises = {
  'one-pass': {
    title: 'Definitely assigned, in one pass',
    prompt: `Write \`definite(blocks, order)\`. Each block has \`preds\` (the blocks with an edge into it) and \`assigns\` (the variables it gives a value to). The CFG has **no loops**, and \`order\` lists every block after all of its predecessors.

Compute, for every block, the variables **definitely** assigned at its start, as a **sorted** array:

- a block with no predecessors (the entry) starts with nothing assigned;
- otherwise IN is the **intersection** of the predecessors’ OUT;
- OUT is IN plus the block’s own \`assigns\`.

Return the IN facts, one entry per block.`,
    starter: `${HEAD}
  const inn = {};
  for (const b of order) inn[b] = [];
  return inn;
}`,
    solution: SOL,
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
        code: SOL.replace(`      s = s === null ? out[p]
        : s.filter((v) =>
          out[p].includes(v));`, `      s = [...new Set([...(s ?? []),
        ...out[p]])].sort();`),
        why: 'This is a union, the meet of a “may” question: b3 gets `y` from b1 even though the path through b2 never assigns it.',
      },
      {
        code: SOL.replace('let s = null;', 'let s = [];'),
        why: 'Starting the intersection from the empty set keeps nothing: every intersection with `[]` is `[]`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does a dataflow analysis attach facts to blocks rather than following paths?',
    options: [
      { t: 'Blocks are faster to read than instructions.', why: 'Speed of reading is not the point; the trouble with paths is how many there are.' },
      { t: 'A program can have far too many paths, even infinitely many with a loop, but it has only a few blocks.', correct: true, why: 'One fact per block point, with rules on edges, covers every path at once.' },
      { t: 'Paths do not exist until the program runs.', why: 'Paths through the CFG exist on paper; there are just too many of them to list.' },
    ],
  },
  {
    q: 'At a join, OUT of the two predecessors is `{a, b}` and `{b, c}`. In a “definitely assigned” (must) analysis, what is IN of the join?',
    options: [
      { t: '`{a, b, c}`', why: 'That is the union, the answer to “may have been assigned”.' },
      { t: '`{ }`', why: 'The sets share `b`, so the intersection is not empty.' },
      { t: '`{b}`', correct: true, why: 'A must question keeps only what is true on every incoming path: the intersection.' },
    ],
  },
  {
    q: '“Will this variable be read again later?” Which kind of analysis answers it?',
    options: [
      { t: 'Backward: facts flow from a block’s successors to it.', correct: true, why: 'The question is about the future, so information comes from the blocks that run afterwards.' },
      { t: 'Forward: facts flow from a block’s predecessors to it.', why: 'Predecessors run earlier; they cannot tell you about later reads.' },
      { t: 'Neither: it needs the program to run.', why: 'It is a classic static question, answered by a backward dataflow analysis.' },
    ],
  },
  {
    q: 'Which is the transfer function of a block in the “definitely assigned” analysis?',
    options: [
      { t: 'OUT = IN minus the variables the block reads', why: 'Reading a variable doesn’t un-assign it.' },
      { t: 'OUT = the intersection of the successors’ IN', why: 'That would be a backward meet, not a transfer function.' },
      { t: 'OUT = IN, unchanged', why: 'Then no variable would ever count as assigned.' },
      { t: 'OUT = IN plus the variables the block assigns', correct: true, why: 'Passing through the block can only add assigned variables.' },
    ],
  },
  {
    q: 'In a lattice, what is the meet of two facts?',
    options: [
      { t: 'The fact that appears most often', why: 'Merging is not a vote.' },
      { t: 'The lowest fact in the whole lattice', why: 'That is always below both, but usually far lower than needed: it throws information away.' },
      { t: 'The highest fact that is below both of them', correct: true, why: 'It keeps as much as both facts promise, and no more.' },
      { t: 'Whichever of the two facts is higher', why: 'That would keep a promise one side doesn’t make. And for `{x}` and `{y}` neither is higher.' },
    ],
  },
];
