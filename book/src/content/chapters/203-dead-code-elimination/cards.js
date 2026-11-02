// Chapter 203 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dce-what': {
    q: 'What does dead code elimination remove?',
    a: 'Instructions whose results can never affect what the program does.',
  },
  'dce-roots': {
    q: 'In mark-and-sweep DCE, which instructions are the roots?',
    a: 'Those whose effect can be seen: returns and throws, calls, stores, and branches.',
  },
  'plus-effect': {
    q: 'Why can’t a JavaScript compiler always delete an unused `w + h`?',
    a: 'If `w` or `h` is an object, `+` calls its `valueOf` (or `toString`), which can run any code.',
  },
  'unused-call': {
    q: '`console.log(5)` returns `undefined` and nothing reads that result. Is the call dead?',
    a: 'No. It prints, and printing can be seen, so the call is a root. Unused is not the same as dead.',
  },
  'dce-chain': {
    q: 'How can a value that *has* a use still be dead?',
    a: 'If every instruction that uses it is itself dead.',
  },
  'smallest-live': {
    q: 'Why must the live set be the *smallest* set that contains the roots and is closed under operands?',
    a: 'Every bigger set obeys the same two rules too (the set of all instructions does), but would delete less; the smallest one deletes everything that can go.',
  },
  'adce-optimistic': {
    q: 'What does an "aggressive" DCE assume that the simple version does not?',
    a: 'That even branches are dead until a live instruction is shown to depend on which way they go.',
  },
  'unreachable-block': {
    q: 'After SCCP turns `condbr %3, b1, b2` into `br b1`, what can happen to `b2`?',
    a: 'If no other edge reaches it, it is unreachable and can be deleted as a whole block.',
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
    walkthrough: `**How to think about it.** This is the mark-and-sweep collector with instructions in place of objects. Ask two questions in order: which instructions must stay whatever happens (the roots), and, given that an instruction stays, what else must stay with it (whatever defines its operands). The second question is asked again for each newly kept instruction, so it is a worklist: keep a list of live instructions whose operands you have not looked at yet, and stop when it is empty. Only at the very end do you delete anything.

**The solution, line by line.**

- \`const byId = new Map(); for (const i of code) { byId.set(i.id, i); }\` builds a lookup from an id to its instruction, so that from an operand id you can jump straight to the instruction that defines it.
- \`const live = new Set();\` will hold the ids of instructions proven live.
- \`const work = code.filter((i) => EFFECTS.includes(i.op));\` starts the worklist with the roots: instructions the outside world can observe, live whatever happens.
- \`while (work.length > 0) {\` keeps going while some live instruction still has operands to follow.
- \`const i = work.pop();\` takes one off the list (which end does not matter).
- \`if (live.has(i.id)) continue;\` skips an instruction already marked; without this, an operand shared by two users (like \`p\` in \`p * p\`) is processed again and again, and a cycle would never end.
- \`live.add(i.id);\` marks it live.
- \`for (const a of i.args) { work.push(byId.get(a)); }\` queues the instruction behind every operand: if \`i\` is needed, so is everything it reads.
- \`return code.filter((i) => live.has(i.id));\` is the sweep. Filtering the *original* array keeps the survivors in program order, which matters, because an instruction must still come after the ones it uses.

In the second test, \`q\` uses \`p\`, but \`q\` is never marked (it is not a root and nothing live uses it), so nobody ever pushes \`p\`, and both are swept in one go. A pass that only deleted "instructions with no uses" would delete \`q\` first, and need a second round to notice \`p\`.

**Common wrong attempts.**

- Keeping everything that is used by anything: a use only counts when the user is live, so this keeps dead chains.
- Treating only \`return\` as a root: a \`print\` or \`store\` nobody reads then disappears, and its effect was the whole point of it.
- Filtering in the order you marked things: the result is no longer in program order.`,
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
};

export const quiz = [
  {
    q: 'In this listing, which instructions does mark-and-sweep DCE delete?\n\n```text\n%0 = const 2\n%1 = binop * %0, %0\n%2 = binop + %1, %0\nreturn %0\n```',
    options: [
      { t: 'Only `%2`', why: '`%2` is dead, but so is `%1`: its only user is `%2`, which is never marked.' },
      { t: '`%1` and `%2`', correct: true, why: 'The root is `return %0`, which marks `%0`. Nothing live uses `%1` or `%2`, so both are swept.' },
      { t: 'Nothing: every value is used by something', why: '`%1` is used, but only by the dead `%2`. Uses by dead instructions don’t count.' },
      { t: '`%0`, `%1` and `%2`', why: '`%0` is read by `return`, a root, so it is live.' },
    ],
  },
  {
    q: 'Why does mark-and-sweep remove a dead chain like `p = w + h; q = p * p` in a single pass?',
    options: [
      { t: 'It deletes instructions from the bottom up', why: 'The order of deletion is not the reason: marking decides everything before anything is deleted.' },
      { t: 'It counts uses twice', why: 'It does not count uses at all; it only follows operands from instructions already marked live.' },
      { t: 'It only follows operands of live instructions, so `q` never marks `p`', correct: true, why: 'Liveness spreads outward from the roots. Since `q` is never reached, its use of `p` is never followed.' },
    ],
  },
  {
    q: 'A JavaScript function contains `const t = o.size;` and never uses `t`. May a compiler delete the line?',
    options: [
      { t: 'Yes, always: `t` is unused', why: 'Unused is not dead: `o.size` could be a getter that runs code with effects.' },
      { t: 'No, never: property reads always have effects', why: 'Most property reads have no effect; the compiler just has to know which ones.' },
      { t: 'Only if it knows the read runs no user code, for example that `size` is a plain data property', correct: true, why: 'A property read can call a getter, so deleting it is safe only with that knowledge.' },
      { t: 'Only if `o` is declared with `const`', why: '`const` stops `o` being reassigned; it says nothing about whether `size` is a getter.' },
    ],
  },
  {
    q: 'Which instruction is a root, even though nothing uses its result?',
    options: [
      { t: '`%4 = const 2`', why: 'A constant only produces a value; if nothing live uses it, it is dead.' },
      { t: '`store total, %0`', correct: true, why: 'A store changes memory that other code can read later, so it must stay.' },
      { t: '`%6 = phi %4, %5`', why: 'A phi only chooses a value; with no live users it is dead.' },
    ],
  },
  {
    q: 'Why do compilers usually run DCE after SCCP and inlining rather than before?',
    options: [
      { t: 'Those passes leave behind instructions whose results are no longer needed, and DCE collects them', correct: true, why: 'SCCP replaces uses with constants and inlining copies whole bodies; both make work useless without deleting it.' },
      { t: 'DCE needs constants to work at all', why: 'DCE works on any code; it only needs to know the roots.' },
      { t: 'Running DCE first would delete the calls that inlining needs', why: 'Calls are roots, so DCE never deletes them.' },
    ],
  },
  {
    q: 'What does Viscosity do about dead code?',
    options: [
      { t: 'It runs mark-and-sweep DCE before its layout analyses', why: 'Viscosity has no DCE pass; it rewrites only the code that touches collections.' },
      { t: 'It deletes any value whose use list is empty', why: 'It builds use lists, but not to delete code; and an empty use list doesn’t mean dead, since calls and stores matter.' },
      { t: 'It leaves dead code alone, but builds the use lists a DCE would need and classifies instructions by what they can do', correct: true, why: '`buildUses` gives every value’s users, and `analysis.ts` asks whether an instruction is inert, may throw, or has effects.' },
    ],
  },
];
