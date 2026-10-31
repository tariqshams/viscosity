// Chapter 81 cards. Keys are stable ids: never rename them.

export const prompts = {
  'dce-what': {
    q: 'What does dead code elimination remove?',
    a: 'Instructions whose results can never affect what the program does.',
  },
  'uses-list': {
    q: 'In SSA, what tells you at a glance that a value is unused?',
    a: 'Its use list is empty: no instruction, branch or return reads it.',
  },
  'dce-roots': {
    q: 'In mark-and-sweep DCE, which instructions are the roots?',
    a: 'Those with observable effects: output, visible stores, calls to unknown code, returns and branches.',
  },
  'dce-chain': {
    q: 'How can a value that *has* a use still be dead?',
    a: 'If every instruction that uses it is itself dead.',
  },
  'adce-optimistic': {
    q: 'What does mark-and-sweep DCE assume about every instruction before marking?',
    a: 'That it is dead until something live is shown to need it.',
  },
  'plus-effect': {
    q: 'Why can’t a JavaScript compiler always delete an unused `w + h`?',
    a: 'If `w` or `h` is an object, `+` calls its `valueOf` (or `toString`), which can run any code.',
  },
  'number-proof': {
    q: 'What fact makes the unused `w + h` in `area` safe to delete?',
    a: 'Viscosity proves `w` and `h` are numbers at every call site, so `+` runs no user code.',
  },
  'liveness-what': {
    q: 'When is a variable live at a point in the program?',
    a: 'When some path from that point reads it before it is overwritten.',
  },
  'liveness-backward': {
    q: 'Which way does liveness flow, and how are facts merged at a branch?',
    a: 'Backwards, against the edges; by union (live if live on any successor).',
  },
  'dead-store': {
    q: 'In `x = 1; x = 2; print(x)`, which statement is dead, and why?',
    a: '`x = 1`: `x` is overwritten before anything reads it, so it isn’t live after that store.',
  },
  'ssa-easier': {
    q: 'Why is DCE simpler in SSA than with ordinary reassigned variables?',
    a: 'Each value has one definition, so it is needed exactly when a live instruction uses it. There’s no overwriting to reason about.',
  },
};

export const examples = {
  'valueof-runs': {
    title: 'An “unused” + that prints',
    code: `function area(w, h) {
  const p = w + h; // never used
  return w * h;
}

const o = {
  valueOf() {
    console.log('valueOf ran');
    return 3;
  },
};

console.log(area(o, 4));
// Delete the line with p: one
// "valueOf ran" disappears.`,
  },
};

export const exercises = {
  sweep: {
    title: 'Mark and sweep the dead instructions',
    prompt:
      'Each instruction is `{ id, op, args }`, where `args` lists the ids it uses. Instructions whose `op` is in `EFFECTS` are roots. Write `dce(code)` that returns the live instructions, **in their original order**: the roots, plus everything a live instruction uses, directly or indirectly.',
    starter: `const EFFECTS = ['print', 'store',
  'return'];

function dce(code) {
  // your code here
  return code;
}

// I('p', '+', 'w', 'h') makes
// { id: 'p', op: '+',
//   args: ['w', 'h'] }
const I = (id, op, ...args) =>
  ({ id, op, args });
const code = [
  I('w', 'const'),
  I('h', 'const'),
  I('p', '+', 'w', 'h'),
  I('a', '*', 'w', 'h'),
  I('r', 'return', 'a'),
];
console.log(dce(code).map((i) => i.id));`,
    solution: `const EFFECTS = ['print', 'store',
  'return'];

function dce(code) {
  const byId = new Map();
  for (const i of code) {
    byId.set(i.id, i);
  }
  const live = new Set();
  const work = code.filter(
    (i) => EFFECTS.includes(i.op));
  while (work.length > 0) {
    const i = work.pop();
    if (live.has(i.id)) continue;
    live.add(i.id);
    for (const a of i.args) {
      work.push(byId.get(a));
    }
  }
  return code.filter(
    (i) => live.has(i.id));
}`,
    tests: `const K = (id) => ({ id, op: 'const', args: [] });
const ids = (code) => dce(code).map((i) => i.id);
test('removes an unused sum', () => {
  const code = [K('w'), K('h'),
    { id: 'p', op: '+', args: ['w', 'h'] },
    { id: 'a', op: '*', args: ['w', 'h'] },
    { id: 'r', op: 'return', args: ['a'] }];
  expect(ids(code)).toEqual(['w', 'h', 'a', 'r']);
});
test('removes a whole dead chain at once', () => {
  const code = [K('w'), K('h'),
    { id: 'p', op: '+', args: ['w', 'h'] },
    { id: 'q', op: '*', args: ['p', 'p'] },
    { id: 'r', op: 'return', args: ['w'] }];
  expect(ids(code)).toEqual(['w', 'r']);
});
test('keeps effects even when nothing uses them', () => {
  const code = [K('a'), K('b'),
    { id: 's', op: 'print', args: ['a'] },
    { id: 't', op: 'store', args: ['b'] }];
  expect(ids(code)).toEqual(['a', 'b', 's', 't']);
});
test('follows operands several levels deep', () => {
  const code = [K('a'),
    { id: 'b', op: 'neg', args: ['a'] },
    { id: 'c', op: '*', args: ['b', 'b'] },
    { id: 'u', op: 'print', args: ['c'] }];
  expect(ids(code)).toEqual(['a', 'b', 'c', 'u']);
});
test('no roots means nothing survives', () => {
  expect(ids([K('a'), { id: 'b', op: '+', args: ['a', 'a'] }])).toEqual([]);
});`,
    hints: [
      'Build a `Map` from id to instruction first, so you can jump from an operand id to its instruction.',
      'Start a worklist with every instruction whose op is in `EFFECTS`. Pop one, mark it live, push its operands.',
      'Skip an instruction you have already marked, or the work never ends on shared operands. At the end, `filter` the original array so the order is kept.',
    ],
    walkthrough: `This is the collector from chapter 58 with instructions instead of objects.

- **Roots.** \`code.filter((i) => EFFECTS.includes(i.op))\` is the set of instructions the outside world can observe. They are live whatever happens.
- **Mark.** A worklist holds instructions known to be live whose operands haven't been looked at yet. Pop one, record it in \`live\`, and push the instruction behind each operand id. The \`live.has\` check stops shared operands (like \`p\` used twice in \`p * p\`) from being processed twice.
- **Sweep.** Filtering the *original* array keeps the instructions in program order, which matters: an instruction must still come after the ones it uses.

Why it removes a chain in one go: \`q\` uses \`p\`, but \`q\` is never marked, so nobody ever pushes \`p\`. A pass that only deletes “instructions with no uses” would delete \`q\` first and need a second round to notice \`p\`.`,
    wrong: [
      {
        code: `const EFFECTS = ['print', 'store',
  'return'];

function dce(code) {
  const used = new Set();
  for (const i of code) {
    for (const a of i.args) used.add(a);
  }
  return code.filter((i) =>
    used.has(i.id) ||
    EFFECTS.includes(i.op));
}`,
        why: 'This keeps anything that is used by *anything*, including dead code. In `q = p * p` with `q` unused, `p` survives because `q` uses it. A use only counts when the user is live.',
      },
      {
        code: `function dce(code) {
  const byId = new Map();
  for (const i of code) {
    byId.set(i.id, i);
  }
  const live = new Set();
  const work = code.filter(
    (i) => i.op === 'return');
  while (work.length > 0) {
    const i = work.pop();
    if (live.has(i.id)) continue;
    live.add(i.id);
    for (const a of i.args) {
      work.push(byId.get(a));
    }
  }
  return code.filter(
    (i) => live.has(i.id));
}`,
        why: 'Only `return` is treated as a root, so a `print` or `store` whose result nobody reads gets deleted. Its effect is the whole point of it.',
      },
    ],
  },
  deadStores: {
    optional: true,
    title: 'Find dead stores with liveness',
    prompt:
      'Straight-line code with ordinary variables: each instruction is `{ def, uses, effect }`, where `def` is the variable it assigns (or `null`), `uses` the variables it reads, and `effect` is `true` for things like `print`. Write `deadStores(code)` returning the indexes (ascending) of instructions that assign a variable which is not live afterwards and have no effect. Treat a dead instruction’s reads as not happening.',
    starter: `function deadStores(code) {
  // your code here
  return [];
}

const st = (def, uses = []) =>
  ({ def, uses, effect: false });
const code = [
  st('x'), // x = 1
  st('x'), // x = 2
  st('y', ['x']), // y = x + 1
  { def: null, uses: ['y'],
    effect: true }, // print y
];
console.log(deadStores(code)); // [0]`,
    solution: `function deadStores(code) {
  const live = new Set();
  const dead = [];
  const n = code.length;
  for (let k = n - 1; k >= 0; k--) {
    const ins = code[k];
    if (ins.def && !ins.effect &&
        !live.has(ins.def)) {
      dead.push(k);
      continue;
    }
    if (ins.def) live.delete(ins.def);
    for (const u of ins.uses) {
      live.add(u);
    }
  }
  return dead.reverse();
}`,
    tests: `const S = (def, uses = []) => ({ def, uses, effect: false });
const P = (...uses) => ({ def: null, uses, effect: true });
test('an overwritten store is dead', () => {
  expect(deadStores([S('x'), S('x'), S('y', ['x']), P('y')])).toEqual([0]);
});
test('a dead chain is found in one walk', () => {
  expect(deadStores([S('t', ['a']), S('u', ['t']), P('a')])).toEqual([0, 1]);
});
test('a store after the last read is dead', () => {
  expect(deadStores([S('x'), P('x'), S('x')])).toEqual([2]);
});
test('effects are never dead', () => {
  expect(deadStores([{ def: 'x', uses: [], effect: true }])).toEqual([]);
});
test('everything needed survives', () => {
  expect(deadStores([S('a'), S('b', ['a']), P('a', 'b')])).toEqual([]);
});`,
    hints: [
      'Walk from the last instruction to the first, keeping a `Set` of variables that will be read later.',
      'An instruction is dead if it has a `def`, no effect, and its `def` is not in the live set. Record it and skip it entirely.',
      'For a live instruction: remove its `def` from the set (it’s overwritten here), then add its `uses`.',
    ],
    walkthrough: `Liveness flows backwards, so the loop runs from the end.

- \`live\` holds the variables that some later instruction will read. At the very end nothing is live.
- A store is dead when nobody will read the variable before it is overwritten, which is exactly \`!live.has(ins.def)\`. We also skip its \`uses\`: since the instruction will be deleted, its reads never happen. That is what lets one walk catch the chain \`t = a; u = t\`.
- For a live instruction, the order matters: first \`delete\` the def (above this point, the old value of that variable is not needed), then \`add\` the uses (above this point, they will be read). For \`x = x + 1\` this correctly leaves \`x\` live.

With branches and loops, the same transfer function runs inside the dataflow framework of chapter 79, merging successors by union.`,
    wrong: [
      {
        code: `function deadStores(code) {
  const read = new Set();
  for (const ins of code) {
    for (const u of ins.uses) {
      read.add(u);
    }
  }
  const dead = [];
  code.forEach((ins, k) => {
    if (ins.def && !ins.effect &&
        !read.has(ins.def)) {
      dead.push(k);
    }
  });
  return dead;
}`,
        why: 'This asks “is the variable ever read anywhere?”, not “is it read *after this point, before being overwritten*?”. In `x = 1; x = 2; y = x` it keeps the first store, because `x` is read somewhere.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In this listing, which instructions does mark-and-sweep DCE delete?\n\n```text\n%0 = const 2\n%1 = binop * %0, %0\n%2 = binop + %1, %0\nprint %0\n```',
    options: [
      { t: 'Only `%2`', why: '`%2` is dead, but so is `%1`: its only user is `%2`, which is never marked.' },
      { t: '`%1` and `%2`', correct: true, why: 'The root is `print %0`, which marks `%0`. Nothing live uses `%1` or `%2`, so both are swept.' },
      { t: 'Nothing: every value is used by something', why: '`%1` is used, but only by dead `%2`. Uses by dead instructions don’t count.' },
      { t: '`%0`, `%1` and `%2`', why: '`%0` is read by `print`, a root, so it is live.' },
    ],
  },
  {
    q: 'Why does mark-and-sweep remove a dead chain like `p = w + h; q = p * p` in a single pass?',
    options: [
      { t: 'It deletes instructions from the bottom up', why: 'Order of deletion isn’t the reason; the marking phase decides everything before anything is deleted.' },
      { t: 'It counts uses twice', why: 'It doesn’t count uses at all. It only follows operands from live instructions.' },
      { t: 'It only follows operands of instructions already proven live, so `q` never marks `p`', correct: true, why: 'Liveness spreads outward from the roots. Since `q` is never reached, its use of `p` is never followed.' },
    ],
  },
  {
    q: 'A JavaScript function contains `const t = o.size;` and never uses `t`. May a compiler delete the line?',
    options: [
      { t: 'Yes, always: `t` is unused', why: 'Unused isn’t the same as dead. `o.size` could be a getter that runs code with effects.' },
      { t: 'Only if it knows the read runs no user code, for example that `size` is a plain data property', correct: true, why: 'A property read can call a getter. Deleting it is safe only with that knowledge (or if `o` is known to be a simple object).' },
      { t: 'No, never: property reads always have effects', why: 'Most property reads have no effect. The compiler just has to know which ones.' },
      { t: 'Only if `o` is declared with `const`', why: '`const` stops `o` being reassigned; it says nothing about whether `size` is a getter.' },
    ],
  },
  {
    q: 'How is liveness computed at a branch where one successor reads `x` and the other does not?',
    options: [
      { t: '`x` is live before the branch', correct: true, why: 'Liveness merges by union: if any path may read `x` before overwriting it, `x` is live.' },
      { t: '`x` is dead before the branch, since one path doesn’t read it', why: 'That would be intersection. Deleting the store would break the path that does read it.' },
      { t: 'It depends on which successor comes first in the block list', why: 'The order of successors doesn’t matter; the merge is a set union.' },
    ],
  },
  {
    q: 'What does Viscosity do about dead code?',
    options: [
      { t: 'It runs mark-and-sweep DCE before its layout analyses', why: 'Viscosity has no DCE pass. It rewrites only the code that touches collections.' },
      { t: 'It deletes any value whose use list is empty', why: 'It builds use lists, but uses them for its safety analysis, not to delete code. And an empty use list doesn’t mean dead: calls and stores matter.' },
      { t: 'It refuses to compile programs that contain dead code', why: 'Dead code is harmless for its analyses; nothing refuses it.' },
      { t: 'It leaves dead code in place, but builds the use lists a DCE would need, and its safety check asks the mirror-image question about every use', correct: true, why: '`buildUses` gives every value’s users; the safety analysis then checks that every use of a collection is one it understands.' },
    ],
  },
  {
    q: 'In `area(w, h)`, Viscosity proves the unused `w + h` runs no user code. Which change to the program removes that proof?',
    options: [
      { t: 'Calling `area(3, 4)` twice', why: 'Both call sites still pass numbers, so the parameters are still provably numbers.' },
      { t: 'Renaming `p` to `perimeter`', why: 'Names don’t matter to the IR; the instruction is the same.' },
      { t: 'Adding a call `area(o, 4)` where `o` is an object', correct: true, why: 'Now not every call site passes a number, so `%0` is no longer known to be a number, and `+` might call `o.valueOf()`.' },
    ],
  },
];
