// Cards for "Field representations" (split from chapter 57). Keys are
// stable ids: never rename them.

export const prompts = {
  'rep-what': {
    q: 'What is a **field representation**?',
    a: 'How the engine has decided to store one field (Smi, Double, heap object, Tagged), recorded in the hidden class.',
  },
  'widen-only': {
    q: 'A field has the Double representation and then receives `7`. Does it go back to Smi?',
    a: 'No. A field only widens; `7` is stored as the double 7.0 and the field stays Double.',
  },
  'double-in-place': {
    q: 'Why can a field with the Double representation be updated without allocating?',
    a: 'Its value lives in a box only that object can see, so V8 can overwrite the box in place.',
  },
  'null-start': {
    q: 'Why is `{ start: null }` a bad start for a field that will hold times from `performance.now()`?',
    a: '`null` makes it a heap-object field; the first double then widens it to Tagged, so every new time is a fresh HeapNumber.',
  },
  'ts-field-undefined': {
    q: 'With an ES2022 or later target, what does a TypeScript field `x: number;` hold before the constructor body runs?',
    a: '`undefined`. It compiles to a real class field with no starting value.',
  },
  'declare-emits': {
    q: 'What JavaScript does TypeScript emit for `declare x: number;` in a class?',
    a: 'Nothing. The field only appears when the constructor first assigns it.',
  },
  'generalize-cost': {
    q: 'Why did widening `x` to Tagged make `p.x += 0.1` slow?',
    a: 'A Tagged field keeps doubles as immutable HeapNumbers, so every update allocates a new one.',
  },
  'float64array-rep': {
    q: 'Why can a `Float64Array` column never suffer from a widened field representation?',
    a: 'It has no per-element representation: every element is a raw 64-bit double, side by side.',
  },
};

export const examples = {
  'field-undefined': {
    title: 'A class field exists before the constructor',
    code: `class P {
  x;
  constructor(x) {
    console.log('before:', this.x);
    console.log('has x?', 'x' in this);
    this.x = x;
  }
}
const p = new P(0.5);
console.log('after:', p.x);`,
  },
};

export const exercises = {
  track: {
    title: 'Climb the ladder',
    prompt:
      'Model a field\'s representation. Write `track(vals)`, which is given the values stored into one field, in order, and returns where the field ends up: `\'none\'` (nothing stored yet), `\'smi\'`, `\'double\'`, `\'heap\'` or `\'tagged\'`. A value\'s kind is `\'smi\'` for a whole number from `-(2 ** 30)` to `2 ** 30 - 1` that is not `-0`; `\'double\'` for any other number; `\'heap\'` for anything that is not a number. Widening: `none` becomes the new kind; the same kind stays; `smi` with `double` gives `double`; every other mix gives `tagged`.',
    starter: `function track(vals) {
  let rep = 'none';
  // for each value: widen rep
  return rep;
}

console.log(track([1, 1.5]));`,
    solution: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  const small = Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 30) && v < 2 ** 30;
  return small ? 'smi' : 'double';
}
function widen(a, b) {
  if (a === 'none') return b;
  if (a === b) return a;
  const num = (r) =>
    r === 'smi' || r === 'double';
  if (num(a) && num(b)) return 'double';
  return 'tagged';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) {
    rep = widen(rep, kind(v));
  }
  return rep;
}`,
    tests: `test('nothing stored yet', () => {
  expect(track([])).toBe('none');
});
test('small integers stay Smi', () => {
  expect(track([1, 2, 3])).toBe('smi');
});
test('a fraction widens to double', () => {
  expect(track([1, 1.5, 7])).toBe('double');
});
test('-0 and 2 ** 30 are not Smis', () => {
  expect(track([-0])).toBe('double');
  expect(track([2 ** 30])).toBe('double');
});
test('non-numbers are heap objects', () => {
  expect(track([undefined])).toBe('heap');
  expect(track(['a', {}])).toBe('heap');
});
test('null then a double is tagged', () => {
  expect(track([null, 0.5])).toBe('tagged');
});
test('it never widens back down', () => {
  expect(track([0.5, undefined, 1]))
    .toBe('tagged');
});`,
    hints: [
      'Split it in two small helpers: `kind(v)`, the kind of one value, and `widen(a, b)`, where a field at rung `a` ends up after receiving a value of kind `b`. Then `track` is a loop.',
      '`kind`: `typeof v !== \'number\'` means `\'heap\'`. For a number, it is a Smi when `Number.isInteger(v)`, it is not `-0` (use `Object.is`), and it is in range; otherwise `\'double\'`.',
      '`widen`: if `a` is `\'none\'`, return `b`; if `a === b`, return `a`; if both are number kinds (`smi` or `double`), return `\'double\'`; otherwise `\'tagged\'`. Then `track` does `rep = widen(rep, kind(v))` for each value.',
    ],
    walkthrough: `**How to think about it.** The ladder in the chapter has two separate questions in it, and the exercise gets much easier if you answer them separately. First: what kind of value is this one? (That depends only on the value.) Second: given where the field already is, and the kind of the new value, where does the field go? (That depends only on the two rungs.) Write one small function for each, and \`track\` becomes a loop that keeps asking the second question. Try one by hand: \`[1, 1.5, 7]\` starts at none; \`1\` is a Smi, so the field is Smi; \`1.5\` is a double, and Smi with Double is Double; \`7\` is a Smi, and Double with Smi is still Double.

**The solution, line by line.**

- \`function kind(v) {\` answers the first question.
- \`if (typeof v !== 'number') {\` and \`return 'heap';\`: anything that is not a number (\`undefined\`, \`null\`, a string, an object) is a heap object.
- \`const small = Number.isInteger(v) &&\` starts the Smi test: it must be a whole number (this also rules out \`NaN\` and \`Infinity\`),
- \`!Object.is(v, -0) &&\` must not be minus zero (which \`===\` cannot spot, since \`-0 === 0\`),
- \`v >= -(2 ** 30) && v < 2 ** 30;\` and must fit in 31 bits with the sign. (\`v < 2 ** 30\` is the same as \`v <= 2 ** 30 - 1\` for whole numbers.)
- \`return small ? 'smi' : 'double';\` any number that fails the test is a double.
- \`function widen(a, b) {\` answers the second question.
- \`if (a === 'none') return b;\`: the first value decides the first rung.
- \`if (a === b) return a;\`: the same kind again changes nothing.
- \`const num = (r) =>\` and \`r === 'smi' || r === 'double';\` is a tiny helper: is this rung one of the two number rungs?
- \`if (num(a) && num(b)) return 'double';\`: two different number kinds meet at Double, whichever came first. That is the "never back down" rule: a Double field receiving a Smi stays Double.
- \`return 'tagged';\` covers every other mix: a number with a heap object, or anything with Tagged.
- \`function track(vals) {\`, \`let rep = 'none';\` start with nothing stored.
- \`for (const v of vals) {\` and \`rep = widen(rep, kind(v));\` move the field up the ladder, one value at a time.
- \`return rep;\` is where it ended up.

So \`track([null, 0.5])\` goes none, then heap (for \`null\`), then Tagged (heap with double), which is the \`{ start: null }\` story from the chapter; and \`track([0.5, undefined, 1])\` goes Double, then Tagged, and stays Tagged when \`1\` arrives.

**Common wrong attempts.**

- Setting \`rep = kind(v)\` without widening forgets the history: \`[1, 1.5, 7]\` would end at Smi because the last value is \`7\`. A representation describes *every* value the field has held, not the latest.
- Treating every integer as a Smi: \`-0\` and \`2 ** 30\` are integers by \`Number.isInteger\`, but neither is a Smi.
- Making Smi with heap give heap: a field that has held both a number and \`undefined\` can only be described by Tagged.`,
    wrong: [
      {
        code: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  return Number.isInteger(v)
    ? 'smi' : 'double';
}
function widen(a, b) {
  if (a === 'none') return b;
  if (a === b) return a;
  const num = (r) =>
    r === 'smi' || r === 'double';
  if (num(a) && num(b)) return 'double';
  return 'tagged';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) {
    rep = widen(rep, kind(v));
  }
  return rep;
}`,
        why: 'Every integer is called a Smi here, so `-0` and `2 ** 30` come out as `\'smi\'`. A Smi must also not be `-0` and must fit in 31 bits.',
      },
      {
        code: `function kind(v) {
  if (typeof v !== 'number') {
    return 'heap';
  }
  const small = Number.isInteger(v) &&
    !Object.is(v, -0) &&
    v >= -(2 ** 30) && v < 2 ** 30;
  return small ? 'smi' : 'double';
}
function track(vals) {
  let rep = 'none';
  for (const v of vals) rep = kind(v);
  return rep;
}`,
        why: 'This only remembers the last value. `[1, 1.5, 7]` ends at `\'smi\'`, but the field has held a fraction, so it must be `\'double\'`: a field never widens back down.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A field has held `1`, then `2.5`, then `3`. Which representation does it have now?',
    options: [
      { t: 'Smi, because the last value is a small integer', why: 'A field does not go back down; it describes every value it has held.' },
      { t: 'Double', correct: true, why: '`2.5` widened it from Smi to Double, and `3` fits a Double field.' },
      { t: 'Tagged', why: 'Every value was a number, so Double covers them all; Tagged is for a mix with non-numbers.' },
    ],
  },
  {
    q: 'A TypeScript class declares `x: number;` and its constructor stores doubles into `x`. Why can `p.x += 0.1` allocate?',
    options: [
      { t: 'TypeScript adds a type check to every assignment', why: 'Types are erased; no checks run at all.' },
      { t: 'Class instances are always slower than object literals', why: 'The constructor-only class was as fast as the object literals.' },
      { t: 'The field starts as `undefined`, so the first double widens it to Tagged, which keeps doubles as immutable HeapNumbers', correct: true, why: 'This is what `--trace-generalization` printed: `h{Any}` to `t{Any}`.' },
      { t: 'Doubles can never be stored in object fields', why: 'They can: that is what the Double representation is for.' },
    ],
  },
  {
    q: 'What does TypeScript emit for the line `declare x: number;` inside a class?',
    options: [
      { t: 'A class field `x;` that starts as `undefined`', why: 'That is what plain `x: number;` becomes with a modern target.' },
      { t: 'Nothing at all', correct: true, why: '`declare` only tells the type checker the field exists; the constructor creates it.' },
      { t: 'A field `x = 0;`', why: 'TypeScript never invents a starting value.' },
    ],
  },
  {
    q: 'Which of these is the best way to start an object that will store times from `performance.now()` in `start`?',
    options: [
      { t: '`{ start: null }`', why: '`null` makes `start` a heap-object field, so the first time widens it to Tagged.' },
      { t: '`{ start: undefined }`', why: 'The same problem as `null`: undefined is a heap object, not a number.' },
      { t: '`{ start: performance.now() }`', correct: true, why: 'The first value is already a double, so the field is Double from the start.' },
      { t: 'It makes no difference to V8', why: 'It does: the first value decides the first rung.' },
    ],
  },
  {
    q: 'Why does a `Float64Array` column avoid every problem in this chapter?',
    options: [
      { t: 'It turns doubles into Smis', why: 'It stores doubles, not Smis.' },
      { t: 'V8 copies it into WebAssembly', why: 'Typed arrays are ordinary JavaScript objects.' },
      { t: 'It stores raw 64-bit doubles side by side, with no per-element representation to widen', correct: true, why: 'There are no tags, no boxes and no hidden-class records per element.' },
    ],
  },
];
