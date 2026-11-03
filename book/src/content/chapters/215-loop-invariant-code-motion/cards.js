// Chapter 217 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'preheader-what': {
    q: 'What is a loop preheader?',
    a: 'A block outside the loop, through which every way into the loop passes, whose only successor is the header.',
  },
  'preheader-why': {
    q: 'Why can hoisted code not simply go into the loop header?',
    a: 'The header runs on every trip (the latch jumps back to it), so code there still runs once per trip.',
  },
  'preheader-runs': {
    q: 'An inner loop’s preheader sits inside an outer loop. How often does it run?',
    a: 'Once per entry to the inner loop: once per trip of the outer loop.',
  },
  'licm-what': {
    q: 'What does loop-invariant code motion do?',
    a: 'Moves loop-invariant instructions into the preheader, so they run once per entry to the loop instead of once per trip.',
  },
  'hoist-order': {
    q: 'In what order are hoisted instructions placed in the preheader?',
    a: 'In the order they were found invariant, so each one comes after the instructions it uses.',
  },
  'zero-trip': {
    q: 'Why can hoisting `g[i].x` out of a loop throw an error the original never threw?',
    a: 'If the loop runs zero times, the original never reads it; the hoisted read runs anyway, and fails if `g[i]` is `undefined`.',
  },
  'effects-stay': {
    q: 'Why can a call to `console.log(k)`, with `k` invariant, not be hoisted?',
    a: 'It has an effect: hoisted, it would print once instead of once per trip.',
  },
  'guard-what': {
    q: 'What is a loop guard, and what does it make safe?',
    a: 'A test like `if (n > 0)` around the loop and its preheader; it lets a possibly failing invariant read be hoisted, since it now runs only when the loop would have run.',
  },
};

export const examples = {
  hoist: {
    title: 'Count the work, before and after hoisting',
    code: `let work = 0;
function mul(a, b) {
  work++;
  return a * b;
}
function before(n, y, W) {
  let s = 0;
  for (let x = 0; x < n; x++) {
    s += mul(y, W) + x;
  }
  return s;
}
function after(n, y, W) {
  let s = 0;
  const t = mul(y, W); // hoisted
  for (let x = 0; x < n; x++) {
    s += t + x;
  }
  return s;
}
console.log(before(1000, 3, 512), work);
work = 0;
console.log(after(1000, 3, 512), work);`,
  },
};

export const exercises = {
  hoist: {
    title: 'Hoist the invariant instructions',
    prompt: '`body` lists a loop’s instructions `{ id, op, args }`; an argument is an id (a string) or a number. `outside` lists ids defined before the loop; `guarded` says whether the loop is known to run at least once. Write `hoist(body, outside, guarded)` returning `{ pre, body }`: the ids moved to the preheader **in the order you found them**, and the ids left in the loop in their original order. An instruction is hoisted when all its string arguments are outside or already hoisted, and either its op is in `PURE`, or it is a `load` (args `[array, index]`), the loop is `guarded`, and no `store` in the loop (args `[array, index, value]`) writes the same array.',
    starter: `const PURE = ['const', '+', '-', '*'];

function hoist(body, outside, guarded) {
  // your code here
  return { pre: [], body: [] };
}

const I = (id, op, ...args) =>
  ({ id, op, args });
console.log(hoist([
  I('x', 'phi', 'x0', 'x2'),
  I('t', '*', 'y', 'W'),
  I('i', '+', 't', 'x'),
  I('x2', '+', 'x', 1),
], ['x0', 'y', 'W'], false));
// pre: ['t'], body: ['x', 'i', 'x2']`,
    solution: `const PURE = ['const', '+', '-', '*'];

function hoist(body, outside, guarded) {
  const ready = new Set(outside);
  const stored = new Set(body
    .filter((i) => i.op === 'store')
    .map((i) => i.args[0]));
  const movable = (i) =>
    PURE.includes(i.op) ||
    (i.op === 'load' && guarded &&
      !stored.has(i.args[0]));
  const isId = (a) =>
    typeof a === 'string';
  const pre = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of body) {
      if (ready.has(i.id)) continue;
      if (!movable(i)) continue;
      const args = i.args.filter(isId);
      const ok = (a) => ready.has(a);
      if (args.every(ok)) {
        ready.add(i.id);
        pre.push(i.id);
        changed = true;
      }
    }
  }
  const rest = body
    .filter((i) => !pre.includes(i.id))
    .map((i) => i.id);
  return { pre, body: rest };
}`,
    tests: `const I = (id, op, ...args) => ({ id, op, args });
test('the inner loop of the grid walk', () => {
  const body = [I('x', 'phi', 'x0', 'x2'), I('k', 'const'), I('t', '*', 'y', 'W'), I('i', '+', 't', 'x'), I('st', 'store', 'c', 'i', 'k'), I('one', 'const'), I('x2', '+', 'x', 'one')];
  expect(hoist(body, ['y', 'W', 'c', 'x0'], false)).toEqual({ pre: ['k', 't', 'one'], body: ['x', 'i', 'st', 'x2'] });
});
test('operands go into the preheader before their users', () => {
  const body = [I('b', '*', 'a', 'a'), I('a', '+', 'n', 1)];
  expect(hoist(body, ['n'], false)).toEqual({ pre: ['a', 'b'], body: [] });
});
test('a read stays put when the loop might not run', () => {
  const body = [I('s', 'phi', 'z', 's2'), I('v', 'load', 'g', 'i0'), I('s2', '+', 's', 'v')];
  expect(hoist(body, ['g', 'i0', 'z'], false)).toEqual({ pre: [], body: ['s', 'v', 's2'] });
});
test('a guarded read with no store to its array is hoisted', () => {
  const body = [I('s', 'phi', 'z', 's2'), I('v', 'load', 'g', 'i0'), I('s2', '+', 's', 'v')];
  expect(hoist(body, ['g', 'i0', 'z'], true)).toEqual({ pre: ['v'], body: ['s', 's2'] });
});
test('a store to the same array keeps the read in the loop', () => {
  const body = [I('k', 'phi', 'z', 'k2'), I('v', 'load', 'g', 'i0'), I('w', 'store', 'g', 'k', 'v'), I('k2', '+', 'k', 1)];
  expect(hoist(body, ['g', 'i0', 'z'], true)).toEqual({ pre: [], body: ['k', 'v', 'w', 'k2'] });
});
test('a store to a different array does not', () => {
  const body = [I('k', 'phi', 'z', 'k2'), I('v', 'load', 'g', 'i0'), I('w', 'store', 'h', 'k', 'v'), I('k2', '+', 'k', 1)];
  expect(hoist(body, ['g', 'h', 'i0', 'z'], true)).toEqual({ pre: ['v'], body: ['k', 'w', 'k2'] });
});`,
    hints: [
      'This is last chapter’s invariant sweep, with two changes: you record the order in which instructions are found, and loads get a special rule.',
      'Keep a `Set` of ids that are ready (outside, or already hoisted). Only string arguments need checking; numbers are always available.',
      'Before sweeping, collect the arrays that some `store` in the loop writes. A load is movable only if `guarded` is true and its array is not in that set. Sweep until nothing changes, pushing each new id onto `pre`.',
    ],
    walkthrough: `**How to think about it.** Hoisting is "find the invariants, check safety, move them in order", so start from the sweep you already know: a set of ids that are available before the loop, grown until it stops growing. Two things are new. First, the order you discover instructions in is exactly a safe order for the preheader: an instruction is only discovered once all its operands are available, so writing them down as you go puts every operand first. Second, safety: pure arithmetic and constants can always move, but a \`load\` can fail (the zero-trip problem) and can be changed by a store, so it may move only when the loop is guarded and nothing in the loop stores to its array. (Treating "same array name" as "may write the same memory" is a deliberately rough alias test; chapter 94 does better.)

**The solution, line by line.**

- \`const ready = new Set(outside);\` holds every id whose value is available before the loop.
- \`const stored = new Set(body.filter(...).map(...))\` (three lines) collects the arrays written by any \`store\` in the loop.
- \`const movable = (i) => ...\` says which kinds of instruction may move at all: anything in \`PURE\`, or a \`load\` when \`guarded\` is true and its array (\`i.args[0]\`) is not in \`stored\`. Phis, stores and anything else never move.
- \`const isId = (a) => typeof a === 'string';\` (over two lines) picks out the arguments that name other instructions.
- \`const pre = [];\` will record the hoisted ids, in order.
- \`let changed = true;\`, \`while (changed) {\` and \`changed = false;\` repeat sweeps until one finds nothing new.
- \`if (ready.has(i.id)) continue;\` skips instructions already hoisted, and \`if (!movable(i)) continue;\` skips ones that may never move.
- \`const args = i.args.filter(isId);\` keeps only the id arguments, and \`const ok = (a) => ready.has(a);\` with \`if (args.every(ok)) {\` asks whether all of them are available.
- \`ready.add(i.id);\`, \`pre.push(i.id);\` and \`changed = true;\` hoist it: its value is now available too, it is written into the preheader after its operands, and another sweep is needed.
- \`const rest = body.filter(...).map(...)\` keeps everything not hoisted, in the original order, and \`return { pre, body: rest };\` hands both back.

On the second test, the first sweep skips \`b\` (its operand \`a\` is not ready yet), then hoists \`a\`; the second sweep hoists \`b\`. So \`pre\` is \`['a', 'b']\`, the order the preheader needs.

**Common wrong attempts.**

- A single sweep in listing order misses \`b\` in the second test.
- Hoisting every invariant \`load\`, ignoring \`guarded\`, recreates the zero-trip error from the chapter.
- Hoisting a load when the loop stores to the same array changes what it reads on later trips.`,
    wrong: [
      {
        code: `const PURE = ['const', '+', '-', '*'];

function hoist(body, outside, guarded) {
  const ready = new Set(outside);
  const pre = [];
  for (const i of body) {
    if (!PURE.includes(i.op)) continue;
    const args = i.args.filter(
      (a) => typeof a === 'string');
    if (args.every((a) =>
        ready.has(a))) {
      ready.add(i.id);
      pre.push(i.id);
    }
  }
  const rest = body
    .filter((i) => !pre.includes(i.id))
    .map((i) => i.id);
  return { pre, body: rest };
}`,
        why: 'One sweep in listing order misses `b = a * a` when `b` comes first, and loads never move even when it would be safe.',
      },
      {
        code: `const PURE = ['const', '+', '-', '*'];

function hoist(body, outside, guarded) {
  const ready = new Set(outside);
  const ok = (i) => PURE.includes(i.op)
    || i.op === 'load';
  const pre = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of body) {
      if (ready.has(i.id) || !ok(i))
        continue;
      const args = i.args.filter(
        (a) => typeof a === 'string');
      const has = (a) => ready.has(a);
      if (args.every(has)) {
        ready.add(i.id);
        pre.push(i.id);
        changed = true;
      }
    }
  }
  const rest = body
    .filter((i) => !pre.includes(i.id))
    .map((i) => i.id);
  return { pre, body: rest };
}`,
        why: 'Every invariant load is hoisted, even when the loop might run zero times or stores to the same array: exactly the two traps from the chapter.',
      },
    ],
  },
  addPreheader: {
    optional: true,
    title: 'Add a preheader',
    prompt: '`succ` maps each block to its successors, `h` is a loop header and `loop` lists the loop’s blocks. Write `addPreheader(succ, h, loop)` returning a **new** successor map (do not change `succ`) with an extra block `\'pre\'`: every edge from a block **outside** the loop to `h` now goes to `\'pre\'`, and `\'pre\'` has the single successor `h`. Edges from inside the loop (the back edges) are unchanged.',
    starter: `function addPreheader(succ, h, loop) {
  // your code here
  return succ;
}

const succ = {
  a: ['h'], c: ['h'], h: ['t', 'x'],
  t: ['h'], x: [],
};
console.log(addPreheader(
  succ, 'h', ['h', 't']));`,
    solution: `function addPreheader(succ, h, loop) {
  const out = {};
  for (const b of Object.keys(succ)) {
    const ss = succ[b];
    const inside = loop.includes(b);
    out[b] = ss.map((s) =>
      s === h && !inside ? 'pre' : s);
  }
  out.pre = [h];
  return out;
}`,
    tests: `test('two entering blocks share one preheader', () => {
  const succ = { a: ['h'], c: ['h'], h: ['t', 'x'], t: ['h'], x: [] };
  expect(addPreheader(succ, 'h', ['h', 't'])).toEqual({ a: ['pre'], c: ['pre'], h: ['t', 'x'], t: ['h'], x: [], pre: ['h'] });
});
test('the original map is not changed', () => {
  const succ = { a: ['h'], h: ['h', 'x'], x: [] };
  addPreheader(succ, 'h', ['h']);
  expect(succ).toEqual({ a: ['h'], h: ['h', 'x'], x: [] });
});
test('a self-loop keeps its back edge', () => {
  const succ = { a: ['h'], h: ['h', 'x'], x: [] };
  expect(addPreheader(succ, 'h', ['h'])).toEqual({ a: ['pre'], h: ['h', 'x'], x: [], pre: ['h'] });
});
test('only the edges to the header move', () => {
  const succ = { a: ['h', 'x'], h: ['t', 'x'], t: ['h'], x: [] };
  expect(addPreheader(succ, 'h', ['h', 't'])).toEqual({ a: ['pre', 'x'], h: ['t', 'x'], t: ['h'], x: [], pre: ['h'] });
});`,
    hints: [
      'Build a fresh object: copy each block’s successor list with `map`, so the original lists are untouched.',
      'Only rewrite a successor when it is `h` **and** the block you are copying is outside the loop.',
      'Finish with `out.pre = [h]`.',
    ],
    walkthrough: `**How to think about it.** A preheader must take every edge that enters the header from outside and none of the edges that come back round; so for each edge \`b → h\`, the question is whether \`b\` is in the loop. Edges from inside are back edges and must keep pointing at the header, or the loop would re-run its preheader on every trip, which is the very thing we are trying to avoid. Everything else in the graph stays the same.

**The solution, line by line.**

- \`const out = {};\` is the new map, so \`succ\` itself is never changed.
- \`for (const b of Object.keys(succ)) {\` and \`const ss = succ[b];\` visit each block \`b\` with its successor list \`ss\`.
- \`const inside = loop.includes(b);\` asks whether \`b\` is in the loop.
- \`out[b] = ss.map((s) => s === h && !inside ? 'pre' : s);\` copies the list, sending an edge to \`'pre'\` only when it targets the header from outside; \`map\` makes a new array.
- \`out.pre = [h];\` adds the preheader with its one edge, and \`return out;\` hands back the new map.

**Common wrong attempts.**

- Redirecting every edge to \`h\`, including the latch's: then the back edge goes to \`'pre'\`, which is now inside the cycle, so it is no longer a preheader.
- Editing \`succ[b]\` in place changes the caller's graph.`,
    wrong: [
      {
        code: `function addPreheader(succ, h, loop) {
  const out = {};
  for (const b of Object.keys(succ)) {
    const ss = succ[b];
    out[b] = ss.map((s) =>
      s === h ? 'pre' : s);
  }
  out.pre = [h];
  return out;
}`,
        why: 'The back edge `t → h` is redirected too, so `pre` ends up inside the loop and runs on every trip.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does LICM need a preheader rather than putting hoisted code in the header?',
    options: [
      {
        t: 'The header runs on every trip, because the latch jumps back to it',
        correct: true,
        why: 'Only a block outside the loop, on every way in, runs once per entry.',
      },
      {
        t: 'The header has no room for more instructions',
        why: 'Blocks can hold any number of instructions.',
      },
      {
        t: 'Phis must be the only instructions in a header',
        why: 'Headers usually hold the loop’s test as well.',
      },
    ],
  },
  {
    q: 'A loop header `h` is entered from `a` and from `c`, and its latch is `t`. Which edges does a new preheader `P` take over?',
    options: [
      {
        t: '`a → h`, `c → h` and `t → h`',
        why: '`t → h` is the back edge; redirecting it would put `P` inside the loop.',
      },
      {
        t: 'Only `a → h`',
        why: 'Every way in from outside must pass through `P`, including from `c`.',
      },
      {
        t: '`a → h` and `c → h`; then `P → h`',
        correct: true,
        why: 'All entering edges go to `P`, and `P` has the single edge to the header.',
      },
    ],
  },
  {
    q: 'Inside a loop that may run zero times, `t = g[i].x` is invariant. What can go wrong if it is hoisted without a guard?',
    options: [
      {
        t: 'Nothing: invariant instructions can always be hoisted',
        why: 'Invariance is only the first condition; the read can fail.',
      },
      {
        t: 'It may throw `TypeError: Cannot read properties of undefined` when the original would have run without error',
        correct: true,
        why: 'With zero trips the original never reads `g[i].x`; the hoisted copy reads it anyway.',
      },
      {
        t: 'It will read a different value on each trip',
        why: 'It is read once; the problem is that it is read at all.',
      },
      {
        t: 'The loop will run one extra time',
        why: 'Hoisting does not change how many times the loop runs.',
      },
    ],
  },
  {
    q: 'With `y` and `W` numbers, which instruction can be hoisted out of `for (let x = 0; x < n; x++) s += y * W + x;` with no guard, whatever `n` is?',
    options: [
      {
        t: '`s += ...`',
        why: '`s` is a running sum: it changes every trip.',
      },
      {
        t: '`... + x`',
        why: '`x` is the induction variable.',
      },
      {
        t: '`y * W`',
        correct: true,
        why: 'It is pure, cannot throw on numbers, and both operands come from outside the loop.',
      },
    ],
  },
  {
    q: 'In `for (let j = 0; j < b.length; j++) { const dx = b[j].x - b[i].x; ... }`, where `i` is the outer loop’s counter, what must a compiler prove before hoisting the read `b[i].x`?',
    options: [
      {
        t: 'That `b[i].x` is a number',
        why: 'Its type does not matter for moving it; whether it can change or fail does.',
      },
      {
        t: 'That the `j` loop runs a known number of times',
        why: 'It only needs to know the loop runs at least once (or use a guard).',
      },
      {
        t: 'That `i` is an induction variable of the `j` loop',
        why: '`i` is the outer counter; in the `j` loop it is invariant.',
      },
      {
        t: 'That nothing in the `j` loop may write `b[i].x`, and that the read cannot fail where the original would not have read it',
        correct: true,
        why: 'Those are the memory and safety conditions on top of invariance.',
      },
    ],
  },
  {
    q: 'Why does an invariant-looking memory read, such as `o.n`, need one more check than invariant arithmetic before it is hoisted?',
    options: [
      {
        t: 'Something in the loop may write that memory, so the read may not give the same answer on every trip',
        correct: true,
        why: 'Arithmetic on SSA values depends only on its operands; a read also depends on every store and call in the loop that may alias it.',
      },
      {
        t: 'Memory reads are slower than arithmetic',
        why: 'That is why hoisting them pays, not a condition for doing it.',
      },
      {
        t: 'Reads cannot be placed in a preheader',
        why: 'A preheader can hold any instruction; the question is whether moving it there is correct.',
      },
    ],
  },
];
