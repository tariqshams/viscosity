// Chapter 144 cards. Keys are stable ids: never rename them.

export const prompts = {
  'tf-what': {
    q: 'What is *type feedback*?',
    a: 'What the unoptimized code observed while running, such as the shapes and types each operation saw, recorded for the optimizing compiler.',
  },
  'tf-slots': {
    q: '`add(a, b)` is called with integers, then with `1.5`, then with strings. What does the feedback slot for `+` say after each stage (V8 12.4)?',
    a: '`BinaryOp:SignedSmall`, then `BinaryOp:Number`, then `BinaryOp:Any`. It only ever widens.',
  },
  'spec-what': {
    q: 'What does it mean for an optimizing compiler to *speculate*?',
    a: 'It compiles code that is only correct if what it has seen so far stays true, and checks that assumption at run time.',
  },
  'spec-guard': {
    q: 'What does speculative code do before it relies on a guess, such as an object’s shape?',
    a: 'It runs a check (a guard, such as `CheckMaps`) and deoptimizes if the check fails.',
  },
  'spec-why': {
    q: 'Why is speculative code faster than Ignition’s generic `Add`?',
    a: 'Once the guards pass, it can skip every other case (strings, objects, conversions) and work on raw integers or doubles.',
  },
  'spec-deps': {
    q: 'How can optimized code rely on a global that never changes without checking it each time?',
    a: 'It registers a dependency. If the global is ever changed, V8 invalidates and deoptimizes that code.',
  },
  'tf-kinds': {
    q: 'Name three kinds of thing V8’s feedback records, one for each kind of operation in the chapter.',
    a: 'Operand kinds at an `Add` (e.g. SignedSmall), maps at a property load (its inline cache), and the target function at a call site.',
  },
  'tf-widen': {
    q: 'Why must a feedback slot never narrow again?',
    a: 'If it narrowed after a few integer calls, the compiler would repeat a guess already shown to fail, and the code would keep deoptimizing.',
  },
};

export const examples = {
  guarded: {
    title: 'A guess, a guard and a way out',
    code: `let fast = 0, slow = 0;
const isSmi = (v) => Number.isInteger(v)
  && Math.abs(v) < 2 ** 31;
function add(a, b) {
  if (isSmi(a) && isSmi(b)) {
    fast++;          // the bet holds
    return a + b;
  }
  slow++;            // the way out
  return a + b;      // same answer
}
for (let i = 0; i < 1000; i++) {
  add(i, 1);
}
console.log(add('a', 'b'));
console.log({ fast, slow });`,
  },
};

export const exercises = {
  feedbackLattice: {
    title: 'Feedback that only widens',
    prompt:
      'Model the feedback slot for `+`. Write `widen(fb, a, b)`, which returns the new feedback after a call `a + b`, given the old feedback `fb`. The states, from narrowest to widest, are `\'None\'`, `\'SignedSmall\'`, `\'Number\'` and `\'Any\'`. A call where both arguments are integers counts as `\'SignedSmall\'`, both numbers as `\'Number\'`, anything else as `\'Any\'`. The result is the wider of the old state and the call’s. (V8’s real lattice has more states, for example for strings.)',
    starter: `function widen(fb, a, b) {
  return fb;
}`,
    solution: `const ORDER = [
  'None', 'SignedSmall',
  'Number', 'Any',
];
function seen(a, b) {
  const num = (v) =>
    typeof v === 'number';
  if (Number.isInteger(a) &&
      Number.isInteger(b)) return 1;
  if (num(a) && num(b)) return 2;
  return 3;
}
function widen(fb, a, b) {
  const i = ORDER.indexOf(fb);
  return ORDER[Math.max(i, seen(a, b))];
}`,
    tests: `test('the run from this chapter', () => {
  let fb = 'None';
  fb = widen(fb, 1, 2);
  expect(fb).toBe('SignedSmall');
  fb = widen(fb, 1.5, 2);
  expect(fb).toBe('Number');
  fb = widen(fb, 'a', 'b');
  expect(fb).toBe('Any');
});
test('it never narrows', () => {
  expect(widen('Number', 1, 2))
    .toBe('Number');
  expect(widen('Any', 1, 2)).toBe('Any');
});
test('mixed arguments are Any', () => {
  expect(widen('None', 1, 'x')).toBe('Any');
});`,
    hints: [
      'Give each state a position in an array, narrowest first.',
      'Classify the call, then return the state at the larger of the two positions.',
    ],
    walkthrough: `**How to think about it.** This is the chapter's Formal box in code. Two things are needed: a way to compare states (put them in an array, narrowest first, so a state's position is its width), and a way to classify one call (integers, other numbers, anything else). Then the new state is whichever is wider, the old one or the call's, which, with positions, is \`Math.max\`. It is the same pattern as an array's elements kind.

**The solution, line by line.**

- \`const ORDER = [\` with \`'None', 'SignedSmall',\` and \`'Number', 'Any',\` lists the states from narrowest to widest; a state's index is its width.
- \`function seen(a, b) {\` classifies one call by the index of the state it needs.
- \`  const num = (v) =>\` and \`typeof v === 'number';\` is a small helper.
- \`  if (Number.isInteger(a) &&\` and \`Number.isInteger(b)) return 1;\` is the narrowest case, two integers, checked first, because every integer is also a number.
- \`  if (num(a) && num(b)) return 2;\` is two numbers, at least one not an integer.
- \`  return 3;\` is everything else: strings, a mix, objects.
- \`}\` ends \`seen\`.
- \`function widen(fb, a, b) {\` combines the old state with this call.
- \`  const i = ORDER.indexOf(fb);\` turns the old state's name into its width.
- \`  return ORDER[Math.max(i, seen(a, b))];\` takes the wider of the two and turns it back into a name. Because \`max\` never decreases, \`widen('Any', 1, 2)\` stays \`'Any'\`.
- \`}\` closes the function.

**Common wrong attempts.**

- Ignoring \`fb\` and describing only the latest call: the slot then narrows back to \`'SignedSmall'\` after a float, exactly what feedback must not do, since the compiler would make the failed guess again.
- Testing \`num\` before \`Number.isInteger\`: two integers would be classified as \`'Number'\`, too wide, and the compiler would miss the chance to use integer arithmetic.`,
    wrong: [
      {
        code: `const ORDER = [
  'None', 'SignedSmall',
  'Number', 'Any',
];
function widen(fb, a, b) {
  if (Number.isInteger(a) &&
      Number.isInteger(b)) {
    return 'SignedSmall';
  }
  if (typeof a === 'number' &&
      typeof b === 'number') {
    return 'Number';
  }
  return 'Any';
}`,
        why: 'This ignores `fb`, so it only describes the latest call. The slot narrows back to `\'SignedSmall\'` after a float, which is exactly what feedback must not do.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Where does the type feedback that TurboFan and Maglev use come from?',
    options: [
      { t: 'From TypeScript type annotations', why: 'Types are erased before V8 runs anything. The engine learns by watching.' },
      { t: 'From running the code unoptimized and recording what each operation sees', correct: true, why: 'While unoptimized code runs, V8 tracks shapes and types, and the optimizing compilers read that feedback.' },
      { t: 'From a static analysis of the whole program before it starts', why: 'V8 compiles lazily and optimizes only hot functions, using what it observed.' },
      { t: 'From the CPU’s branch predictor', why: 'The branch predictor is hardware that guesses jumps; V8 keeps its own records of what each operation saw.' },
    ],
  },
  {
    q: 'The slot for `+` says `BinaryOp:Number`. Then `add(1, 2)` is called a thousand times. What does it say now?',
    options: [
      { t: '`BinaryOp:SignedSmall`, since only integers came lately', why: 'Feedback never narrows; the earlier non-integer call is still covered.' },
      { t: '`BinaryOp:Number`', correct: true, why: 'The join of Number and SignedSmall is Number.' },
      { t: '`BinaryOp:Any`', why: 'Nothing but numbers was ever seen, so it never needed Any.' },
    ],
  },
  {
    q: '`--trace-deopt` prints `reason: wrong map` for `getX`. Which guess failed?',
    options: [
      { t: 'That `o` would always have the one shape (map) the feedback had seen', correct: true, why: 'The optimized load checked the map before loading at a fixed offset, and an object built in the other key order failed that check.' },
      { t: 'That `o.x` would be a small integer', why: 'That guard fails with a different reason, such as `not a Smi`.' },
      { t: 'That `getX` would not be called again', why: 'Optimized code is made because a function is called a lot.' },
    ],
  },
  {
    q: 'How can Maglev rely on a global that never changes without checking it on every call?',
    options: [
      { t: 'It cannot; every assumption needs a run-time check', why: 'The Maglev post describes the alternative: a dependency.' },
      { t: 'By copying the global into a constant and registering a dependency that invalidates the code if the global changes', correct: true, why: 'No check runs in the fast code; the runtime deoptimizes it if the global is ever written.' },
      { t: 'By making the global read-only', why: 'The program can still change it; V8 does not alter the program’s meaning.' },
    ],
  },
  {
    q: 'Which statement about speculation is **false**?',
    options: [
      { t: 'Some assumptions are checked at run time, others by registering a dependency', why: 'True: a shape check is a run-time guard; a de-facto constant global is a dependency.' },
      { t: 'Speculative code is only correct for the cases it has guards for', why: 'True: anything else must leave through a deopt.' },
      { t: 'Speculation can make a program print different output, which is why it is optional', correct: true, why: 'This is the false one. A guess that fails costs time, never correctness, because the interpreter takes over.' },
    ],
  },
];
