// Chapter 6 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ref-what': {
    q: 'When a variable “holds” an object, what does it actually hold?',
    a: 'A reference: an arrow pointing at the object, not a copy of the object.',
  },
  'alias-change': {
    q: '`const b = a;` where `a` is an object, then `b.x = 5`. What is `a.x`, and why?',
    a: '`5`. `a` and `b` are aliases: two arrows to the same object.',
  },
  identity: {
    q: 'What does `{ x: 1 } === { x: 1 }` give, and why?',
    a: '`false`. For objects `===` asks “same object?”, and these are two separate objects with equal contents.',
  },
  'const-arrow': {
    q: 'Why can you `push` onto an array declared with `const`?',
    a: '`const` only stops the name being re-aimed at a different array; the array itself can still be changed.',
  },
  'fn-mutates': {
    q: 'A function sets `obj.n = 1` on an object it was passed. Does the caller see the change?',
    a: 'Yes. The parameter holds a copy of the arrow, so both point at the same object.',
  },
  'fn-reassign': {
    q: 'A function does `param = {}` to a parameter it was passed. Does the caller’s variable change?',
    a: 'No. That only re-aims the function’s local arrow; the caller’s arrow is untouched.',
  },
  'spread-copy': {
    q: 'What does `{ ...p, x: 50 }` produce?',
    a: 'A brand-new object with all of `p`’s properties, except `x` is `50`.',
  },
  shallow: {
    q: 'What does it mean that spread `{ ...obj }` is a *shallow* copy?',
    a: 'Only the top level is copied. Properties that hold objects still point at the same inner objects.',
  },
};

export const examples = {
  'refs-play': {
    title: 'Arrows in action',
    code: `const a = { x: 1 };
const b = a;
b.x = 99;
console.log(a.x);

const c = { x: 99 };
console.log(a === b, a === c);

const list = [1, 2];
const same = list;
same.push(3);
console.log(list);`,
  },
};

export const exercises = {
  withX: {
    title: 'Change x without changing the original',
    prompt:
      'Write `withX(p, x)` that returns a **new** object just like `p` but with its `x` property set to `x`. The original `p` must not change.',
    starter: `function withX(p, x) {
  // your code here
}

const p = { x: 1, y: 2 };
const q = withX(p, 9);
console.log(p, q);`,
    solution: `function withX(p, x) {
  return { ...p, x: x };
}`,
    tests: `test('the copy has the new x', () => {
  const q = withX({ x: 1, y: 2 }, 9);
  expect(q).toEqual({ x: 9, y: 2 });
});
test('the original is untouched', () => {
  const p = { x: 1, y: 2 };
  withX(p, 9);
  expect(p.x).toBe(1);
});
test('it is a different object', () => {
  const p = { x: 1 };
  expect(withX(p, 1) === p).toBe(false);
});
test('keeps every other property', () => {
  const p = { x: 0, a: 1, b: 2 };
  expect(withX(p, 5)).toEqual({ x: 5, a: 1, b: 2 });
});`,
    hints: [
      'If you write `p.x = x`, you mutate the caller’s object: the test “the original is untouched” will fail.',
      'Build a new object with spread: `{ ...p }` copies every property.',
      'Properties written after the spread win: `{ ...p, x: x }`.',
    ],
    walkthrough: `The whole exercise is one line, but it hinges on this chapter’s big idea.

- **Don’t mutate.** \`p\` is an arrow to the caller’s object. \`p.x = x\` would change *their* object, the aliasing trap.
- **Build a new object.** \`{ ...p }\` creates a fresh object and copies \`p\`’s properties in.
- **Override x.** Listing \`x: x\` after the spread replaces the copied \`x\`. (JavaScript also lets you shorten \`x: x\` to just \`x\`.)

This “copy, then change the copy” style is called *immutable update*. It’s popular precisely because it avoids aliasing surprises.`,
    wrong: [
      {
        code: `function withX(p, x) {
  p.x = x;
  return p;
}`,
        why: 'This returns the right-looking object, but it is the *same* object, and the caller’s original now has the new `x` too. Two tests catch it.',
      },
      {
        code: `function withX(p, x) {
  const q = p;
  q.x = x;
  return q;
}`,
        why: '`const q = p` copies the arrow, not the object, so `q` is just another alias. This is the exact puzzle from the start of the chapter.',
      },
    ],
  },
  indexOfSame: {
    optional: true,
    title: 'Find this exact object',
    prompt:
      'Write `indexOfSame(xs, target)` that returns the index of the slot holding **the very same object** as `target` (identity, not equal contents), or `-1` if there is none.',
    starter: `function indexOfSame(xs, target) {
  // your code here
}

const a = { id: 1 };
const xs = [{ id: 1 }, a];
console.log(indexOfSame(xs, a));`,
    solution: `function indexOfSame(xs, target) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === target) {
      return i;
    }
  }
  return -1;
}`,
    tests: `test('finds the same object, not a lookalike', () => {
  const a = { id: 1 };
  expect(indexOfSame([{ id: 1 }, a], a)).toBe(1);
});
test('a lookalike is not a match', () => {
  expect(indexOfSame([{ id: 1 }], { id: 1 })).toBe(-1);
});
test('empty list', () => {
  expect(indexOfSame([], {})).toBe(-1);
});`,
    hints: [
      'Loop over the list and compare each slot with `target` using `===`.',
      'Return the index as soon as you find a match. After the loop, return `-1`.',
    ],
    walkthrough: `\`===\` on objects is exactly the identity test we need: it is \`true\` only when both arrows point at the same object.

- Loop over every slot.
- \`if (xs[i] === target) return i;\`: the early return from chapter 1.
- If the loop finishes without a match, \`return -1\`, the usual “not found” value.

The test with a lookalike \`{ id: 1 }\` is the point of the exercise: equal contents don’t make the same object.`,
    wrong: [
      {
        code: `function indexOfSame(xs, target) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i].id === target.id) {
      return i;
    }
  }
  return -1;
}`,
        why: 'This compares *contents* (the `id`), so a lookalike object matches. The exercise asks for the very same object: compare the references with `xs[i] === target`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
const a = { n: 1 };
const b = a;
b.n = 2;
console.log(a.n);
\`\`\``,
    options: [
      { t: '`1`', why: 'That would be true if `b` were a copy, but `const b = a` copies only the arrow.' },
      { t: '`undefined`', why: '`a.n` exists; it was changed through `b`.' },
      { t: '`2`', correct: true, why: '`a` and `b` point at one object, so the change through `b` shows through `a`.' },
      { t: 'An error, because `b` is `const`', why: '`const` stops re-aiming `b`, not changing the object it points at.' },
    ],
  },
  {
    q: 'What is `[1, 2] === [1, 2]`?',
    options: [
      { t: '`true`', why: 'The contents are equal, but `===` on arrays checks identity.' },
      { t: '`false`', correct: true, why: 'Each `[...]` makes a new array, so these are two different objects.' },
      { t: 'An error', why: 'Comparing arrays with `===` is allowed; it just compares identity.' },
      { t: 'It depends on the engine', why: 'The language specifies this precisely: different objects are never `===`.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
function f(o) {
  o = { v: 2 };
}
const x = { v: 1 };
f(x);
console.log(x.v);
\`\`\``,
    options: [
      { t: '`1`', correct: true, why: '`o = ...` re-aims only the function’s own copy of the arrow; `x` still points at `{ v: 1 }`.' },
      { t: '`2`', why: 'That would need `o.v = 2` (a mutation), not re-aiming `o`.' },
      { t: '`undefined`', why: '`x` still points at its original object, which has `v: 1`.' },
      { t: 'An error', why: 'Re-assigning a parameter is allowed.' },
    ],
  },
  {
    q: '`const c = { ...a };` and `a.pos` is an object. Which is true?',
    options: [
      { t: '`c.pos` is a separate copy of `a.pos`', why: 'Spread is shallow: inner objects aren’t copied.' },
      { t: '`c === a`', why: 'Spread always creates a new outer object.' },
      { t: '`c.pos` is `undefined`', why: 'Spread copies every property, including `pos`.' },
      { t: '`c.pos === a.pos`', correct: true, why: 'The arrow to the inner object was copied, so both point at the same `pos`.' },
    ],
  },
  {
    q: 'Why is aliasing a problem for an optimizer that changes an array of objects into a struct of arrays?',
    options: [
      { t: 'Aliases make arrays longer', why: 'Aliasing doesn’t change any lengths.' },
      { t: 'Other references to the same objects must still see every change, so the optimizer must know where all the arrows can go', correct: true, why: 'If any alias could observe the old layout, the program could print wrong answers. Alias and escape analysis answer this.' },
      { t: 'Struct of arrays can’t hold numbers', why: 'SoA is ideal for numbers; that isn’t the issue.' },
      { t: 'It isn’t a problem; layout never affects behaviour', why: 'Layout changes are only safe when no code can tell the difference, and aliases can.' },
    ],
  },
  {
    q: 'Which line creates a **new** object rather than another alias of `p`?',
    options: [
      { t: '`const q = p;`', why: 'That copies the arrow: `q` is an alias.' },
      { t: '`const q = { ...p };`', correct: true, why: 'Spread builds a brand-new object and copies the properties in.' },
      { t: '`p.copy = true;`', why: 'That mutates `p` itself.' },
      { t: '`const q = [p][0];`', why: 'That puts the arrow in an array and takes it back out: still the same object.' },
    ],
  },
];
