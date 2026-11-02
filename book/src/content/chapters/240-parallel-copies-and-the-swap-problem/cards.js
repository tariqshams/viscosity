// Chapter 240 cards (the second half of chapter 239): recall prompts,
// examples, exercises and quiz. Keys are stable ids.

export const prompts = {
  'swap-what': {
    q: 'What is the **swap problem**?',
    a: 'Two phis that read each other (p2 = φ(…, q2), q2 = φ(…, p2)) become copies p2 = q2; q2 = p2, and the second reads the value the first just overwrote.',
  },
  'parallel-meaning': {
    q: 'What does the parallel copy `(d1, ..., dn) := (s1, ..., sn)` mean?',
    a: 'Read every source first, then write every destination: no write affects any read.',
  },
  'why-parallel': {
    q: 'Why do the copies replacing one block’s phis form a parallel copy?',
    a: 'All the phis of a block take their values at the same instant, as control crosses the edge, so none may see another’s new value.',
  },
  'swap-not-critical': {
    q: 'Is the swap problem caused by a critical edge?',
    a: 'No: the copies are in the right place (b2 has one successor) but in an order that cannot work; a swap needs a spare register.',
  },
  'safe-first': {
    q: 'When is a copy `d = s` safe to do first, out of a parallel copy?',
    a: 'When no other waiting copy still reads d, since d’s old value is then needed by nobody.',
  },
  'stuck-means-cycle': {
    q: 'What does it mean if no waiting copy is safe, and what do we do?',
    a: 'The waiting copies form cycles. Save one value of a cycle in a spare register t, let its reader read t, and continue.',
  },
  'how-many': {
    q: 'How many sequential copies does a parallel copy need?',
    a: 'One per copy (dropping any copy of a register to itself), plus one extra per cycle, to save a value in t.',
  },
  'chain-order': {
    q: 'Why must `(a, b) := (b, c)` be written `a = b; b = c` and not the other way round?',
    a: '`b = c` first would destroy the old b, and then `a = b` would copy c into a.',
  },
};

export const examples = {
  sequence: {
    title: 'Parallel copies, one at a time',
    code: `// moves: [[dst, src], ...], meant to
// happen all at once.
function sequence(moves) {
  const todo = moves
    .filter(([d, s]) => d !== s)
    .map(([d, s]) => [d, s]);
  const out = [];
  const read = (r) =>
    todo.some(([, s]) => s === r);
  while (todo.length > 0) {
    const k = todo.findIndex(
      ([d]) => !read(d));
    if (k >= 0) {
      const [d, s] = todo[k];
      todo.splice(k, 1);
      out.push(d + ' = ' + s);
    } else {
      // Only cycles are left: save one
      // value in t, read it from there.
      const d = todo[0][0];
      out.push('t = ' + d);
      for (const m of todo) {
        if (m[1] === d) m[1] = 't';
      }
    }
  }
  return out;
}

// The swap on the back edge:
console.log(sequence(
  [['p2', 'q2'], ['q2', 'p2']]));
// A 3-cycle, and d also reading a:
console.log(sequence([['a', 'b'],
  ['b', 'c'], ['c', 'a'], ['d', 'a']]));
// sumsq's back edge: no conflict.
console.log(sequence(
  [['s1', 's2'], ['i1', 'i2']]));`,
  },
};

export const exercises = {
  sequence: {
    title: 'Sequence a parallel copy',
    prompt:
      'Write `sequence(moves)`. `moves` is a parallel copy as an array of `[dst, src]` pairs (all destinations different). Return an array of copy strings like `\'a = b\'` that, run one after another, leave every destination holding the value its source had *before* any copy ran. Drop copies of a register to itself. Use the register name `t` as the spare when a cycle needs one, and do not change the arrays you are given. The tests run your copies and compare with the parallel meaning, and also count them: a swap must take exactly 3 copies, and a chain must not use `t`.',
    starter: `// moves: [[dst, src], ...], meant to
// happen all at once. Returns copies to
// run one at a time, using t if needed.
function sequence(moves) {
  // Wrong: copies in the order given.
  return moves.map(
    ([d, s]) => d + ' = ' + s);
}`,
    solution: `// moves: [[dst, src], ...], meant to
// happen all at once. Returns copies to
// run one at a time, using t if needed.
function sequence(moves) {
  const todo = moves
    .filter(([d, s]) => d !== s)
    .map(([d, s]) => [d, s]);
  const out = [];
  const read = (r) =>
    todo.some(([, s]) => s === r);
  while (todo.length > 0) {
    const k = todo.findIndex(
      ([d]) => !read(d));
    if (k >= 0) {
      const [d, s] = todo[k];
      todo.splice(k, 1);
      out.push(d + ' = ' + s);
    } else {
      // Only cycles are left: save one
      // value in t, read it from there.
      const d = todo[0][0];
      out.push('t = ' + d);
      for (const m of todo) {
        if (m[1] === d) m[1] = 't';
      }
    }
  }
  return out;
}`,
    tests: `// Run copies one at a time on env.
function run(copies, env) {
  const e = { ...env };
  for (const c of copies) {
    const [d, s] = c.split(' = ');
    e[d] = e[s];
  }
  return e;
}
// What the parallel copy should give.
function par(moves, env) {
  const e = { ...env };
  for (const [d, s] of moves) e[d] = env[s];
  return e;
}
function same(moves, env) {
  const got = run(sequence(moves), env);
  const want = par(moves, env);
  for (const r of Object.keys(want)) {
    if (r !== 't') expect(got[r]).toBe(want[r]);
  }
}
const env = { a: 1, b: 2, c: 3, d: 4,
  p: 5, q: 6, t: 0 };
test('a swap needs t, and three copies', () => {
  const m = [['p', 'q'], ['q', 'p']];
  same(m, env);
  expect(sequence(m).length).toBe(3);
});
test('a chain is ordered, no t', () => {
  const m = [['a', 'b'], ['b', 'c']];
  same(m, env);
  expect(sequence(m)).toEqual(['a = b', 'b = c']);
});
test('reversed chain still comes out right', () => {
  const m = [['b', 'c'], ['a', 'b']];
  same(m, env);
  expect(sequence(m).length).toBe(2);
});
test('a 3-cycle plus a branch', () => {
  const m = [['a', 'b'], ['b', 'c'],
    ['c', 'a'], ['d', 'a']];
  same(m, env);
  expect(sequence(m).length).toBe(5);
});
test('a copy to itself is dropped', () => {
  expect(sequence([['a', 'a']])).toEqual([]);
});
test('independent copies stay as they are', () => {
  const m = [['p', 'a'], ['q', 'b']];
  same(m, env);
  expect(sequence(m).length).toBe(2);
});`,
    hints: [
      'Keep a list of copies still to do. Ask, over and over: which waiting copy can go now without destroying a value somebody still needs?',
      'A copy `[d, s]` can go when no waiting copy has `d` as its source. If none can go, every waiting destination is someone’s source: that is a cycle.',
      'To break a cycle, take the destination `d` of any waiting copy, emit `t = d`, and change every waiting copy whose source is `d` to read `t`. Now that copy’s destination is free, and the loop continues. Copy the pairs first (`.map(([d, s]) => [d, s])`) so you do not change the caller’s arrays.',
    ],
    walkthrough: `**How to think about it.** A parallel copy promises that every source is read before any destination is written; a sequence of copies keeps that promise if, every time we overwrite a register, nobody still waiting needs its old value. So the job is a loop that keeps picking a copy that is *safe now*. When there is none, the only way that can happen is a cycle (every destination is somebody's source, all the way round), and one spare register breaks it: save one value, redirect its reader, and the cycle becomes a chain.

**The solution, line by line.**

- \`const todo = moves.filter(([d, s]) => d !== s).map(([d, s]) => [d, s]);\` keeps the copies that do something (a copy of a register to itself is a no-op) and copies each pair, because we will edit sources later and the caller's arrays must not change.
- \`const out = [];\` collects the sequential copies.
- \`const read = (r) => todo.some(([, s]) => s === r);\` asks whether any waiting copy still reads register \`r\`.
- \`while (todo.length > 0) {\` repeats until every copy is done.
- \`const k = todo.findIndex(([d]) => !read(d));\` looks for a copy whose destination nobody reads: overwriting it is harmless.
- \`if (k >= 0) { const [d, s] = todo[k]; todo.splice(k, 1); out.push(d + ' = ' + s); }\` does that copy and removes it from the list; that may make others safe on the next round.
- \`else {\` means we are stuck: only cycles remain.
- \`const d = todo[0][0]; out.push('t = ' + d);\` saves the value of one destination in the spare register before anything overwrites it.
- \`for (const m of todo) { if (m[1] === d) m[1] = 't'; }\` redirects whoever wanted that old value to read \`t\`. Now nobody reads \`d\`, so on the next round its copy is safe.

For \`(a, b, c, d) := (b, c, a, a)\`: \`d = a\` is safe at once (nobody reads \`d\`); then \`a\`, \`b\`, \`c\` form a cycle, so \`t = a\`, and \`c\` now reads \`t\`; then \`a = b\`, \`b = c\` and \`c = t\`: five copies, as the test expects. For the swap, the first round is already stuck: \`t = p\`, then \`p = q\`, then \`q = t\`.

**Common wrong attempts.**

- Writing the copies in the order given: fine for a chain in the right order, wrong for a chain in the other order and for every cycle.
- Breaking a cycle by just doing one of its copies anyway (without saving a value in \`t\`): that is the swap bug itself, and the 3-cycle test sees the lost value.
- Picking a copy whose *source* is not written by anyone, instead of one whose *destination* is not read by anyone: the test that matters is about what gets destroyed, which is the destination's old value.`,
    wrong: [
      {
        code: `// moves: [[dst, src], ...], meant to
// happen all at once. Returns copies to
// run one at a time, using t if needed.
function sequence(moves) {
  const todo = moves
    .filter(([d, s]) => d !== s)
    .map(([d, s]) => [d, s]);
  const out = [];
  const read = (r) =>
    todo.some(([, s]) => s === r);
  while (todo.length > 0) {
    const k = todo.findIndex(
      ([d]) => !read(d));
    if (k >= 0) {
      const [d, s] = todo[k];
      todo.splice(k, 1);
      out.push(d + ' = ' + s);
    } else {
      // Only cycles are left: save one
      // value in t, read it from there.
      const d = todo[0][0];
      out.push('t = ' + d);
      const [dd, ss] = todo.shift();
      out.push(dd + ' = ' + ss);
    }
  }
  return out;
}`,
        why: 'When stuck, this just does one copy of the cycle, destroying a value another copy still needs: the swap comes out as both 6.',
      },
      {
        code: `// moves: [[dst, src], ...], meant to
// happen all at once. Returns copies to
// run one at a time, using t if needed.
function sequence(moves) {
  const todo = moves
    .filter(([d, s]) => d !== s)
    .map(([d, s]) => [d, s]);
  const out = [];
  const read = (r) =>
    todo.some(([, s]) => s === r);
  while (todo.length > 0) {
    const k = todo.findIndex(
      ([, s]) => !todo.some(
        ([d]) => d === s));
    if (k >= 0) {
      const [d, s] = todo[k];
      todo.splice(k, 1);
      out.push(d + ' = ' + s);
    } else {
      // Only cycles are left: save one
      // value in t, read it from there.
      const d = todo[0][0];
      out.push('t = ' + d);
      for (const m of todo) {
        if (m[1] === d) m[1] = 't';
      }
    }
  }
  return out;
}`,
        why: 'This asks whether the copy’s source is written by anyone, which is not what makes a copy safe: on the chain `(a, b) := (b, c)` it does `b = c` first, destroying the b that `a = b` still needs.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'p = 5 and q = 6. Which sequence performs the parallel copy `(p, q) := (q, p)`?',
    options: [
      { t: '`p = q; q = p`', why: 'After the first copy both are 6, so q gets 6 back: the 5 is lost.' },
      { t: '`q = p; p = q`', why: 'The same problem the other way round: both end up 5.' },
      { t: '`t = p; p = q; q = t`', correct: true, why: 't keeps the old p, so p becomes 6 and q becomes 5.' },
    ],
  },
  {
    q: 'Why do the copies replacing one block’s phis have to behave as a parallel copy?',
    options: [
      { t: 'Because RISC-V runs copies in parallel', why: 'It runs them one at a time; that is the difficulty.' },
      { t: 'Because all the phis of a block take their values at the same moment, as control enters', correct: true, why: 'No phi sees another’s new value, so no copy may see another copy’s write.' },
      { t: 'Because the copies sit on a critical edge', why: 'The swap problem happens with no critical edge at all.' },
    ],
  },
  {
    q: 'In `(a, b) := (b, c)`, which copy can safely go first?',
    options: [
      { t: '`a = b`, because no copy reads a', correct: true, why: 'Overwriting a destroys nothing still needed; then b = c.' },
      { t: '`b = c`, because c is not written by anyone', why: 'b = c destroys the old b, which a = b still needs.' },
      { t: 'Either; there is no cycle', why: 'There is no cycle, but there is still an order: a chain must run from its free end.' },
    ],
  },
  {
    q: 'How many sequential copies does `(a, b, c) := (b, c, a)` need?',
    options: [
      { t: '3', why: 'A cycle needs one extra copy to save a value.' },
      { t: '4', correct: true, why: 'Three copies plus one save: t = a; a = b; b = c; c = t.' },
      { t: '6', why: 'One spare is enough for the whole cycle.' },
    ],
  },
  {
    q: 'What does regalloc2’s ParallelMoves do?',
    options: [
      { t: 'It runs moves on several processor cores at once', why: 'The moves are parallel in meaning, not in execution.' },
      { t: 'It removes phi nodes from LLVM IR', why: 'regalloc2 is Cranelift’s allocator, and it takes block parameters, not LLVM IR.' },
      { t: 'It turns a set of moves that must happen at once into ordinary moves, using a scratch register if one is needed', correct: true, why: 'That is this chapter’s algorithm, applied to registers and stack slots.' },
    ],
  },
];
