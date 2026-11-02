// Chapter 8 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'spread-copy': {
    q: 'What does `{ ...p, x: 50 }` produce?',
    a: 'A brand-new plain object with copies of all of `p`’s own properties, except that `x` is `50`. (Spread copies only an object’s own properties, not anything it inherits.)',
  },
  'spread-order': {
    q: '`p` has `x: 1`. What is `x` in `{ x: 9, ...p }`, and why?',
    a: '`1`: properties are filled in order, so the copied `x` from `p` comes after the `9` and replaces it.',
  },
  'copy-identity': {
    q: 'What is `{ ...p } === p`, and why?',
    a: '`false`: spread always makes a new object, and `===` on objects compares identity.',
  },
  'copy-vs-alias': {
    q: 'After `const q = p;` versus `const q = { ...p };`, which version lets `q.x = 5` leave `p` alone?',
    a: 'The spread one. `q = p` copies only the arrow, so `q` is an alias of `p`.',
  },
  shallow: {
    q: 'What does it mean that spread `{ ...obj }` is a *shallow* copy?',
    a: 'Only the top level is copied. Properties that hold objects still point at the same inner objects.',
  },
  'deep-one-level': {
    q: '`a.pos` is an object. How do you copy `a` so that the copy has its own `pos` too?',
    a: '`{ ...a, pos: { ...a.pos } }`: spread the outer object, and replace `pos` with a spread copy of it.',
  },
  'alias-problem': {
    q: 'Why is aliasing a problem for an optimiser that turns an array of objects into a struct of arrays?',
    a: 'Other arrows to the same objects (like `first = ps[0]`) must still see every change, so it must know everywhere those arrows can go.',
  },
  'copy-is-fresh': {
    q: 'Why is a freshly made `{ ...p }` easier for an optimiser to reason about than `p`?',
    a: 'It is a new object, so at first no other code holds an arrow to it: it has no aliases yet.',
  },
};

export const examples = {
  copies: {
    title: 'A copy and an alias, side by side',
    code: `const p = { x: 1, pos: { y: 0 } };
const alias = p;
const copy = { ...p, x: 50 };

alias.x = 2;
console.log(p.x, copy.x);
console.log(p === alias);
console.log(p === copy);

copy.pos.y = 7;
console.log(p.pos.y);

const xs = [1, 2];
const ys = [...xs, 3];
ys[0] = 9;
console.log(xs, ys);`,
  },
};

export const exercises = {
  withX: {
    title: 'Change x without changing the original',
    prompt: 'Write `withX(p, x)` that returns a **new** object just like `p` but with its `x` property set to `x`. The original `p` must not change.',
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
      'Ask first: does this function need a new object, or may it change the one it was given? Read the second test.',
      'A new object with all of `p`’s properties is `{ ...p }`.',
      'Properties written after the spread win, so `{ ...p, x: x }` copies everything and then sets `x`.',
    ],
    walkthrough: `**How to think about it.** The parameter \`p\` holds an arrow to the *caller's* object, so anything you write through \`p\` (such as \`p.x = x\`) changes their object: the aliasing trap from last chapter, and exactly what the test "the original is untouched" checks. So the function must build a second object. It should have every property \`p\` has (the last test adds properties \`a\` and \`b\` that the function knows nothing about), with one change. "Copy everything, then change one thing" is what spread followed by a property does.

**The solution, line by line.**

- \`function withX(p, x) {\` takes the original object and the new x value.
- \`  return { ...p, x: x };\` does three things in one expression. The curly braces make a brand-new, empty object. \`...p\` copies each of \`p\`'s properties into it, so it now holds \`x: 1, y: 2\` (on the first test). Then \`x: x\` sets the property named \`x\` to the parameter \`x\` (9); because it comes after the spread, it replaces the copied 1. The new object is returned, and \`p\` was only read, never written.
- \`}\` closes the body.

On the left of the colon, \`x\` is the property's name; on the right, \`x\` is the parameter's value. (JavaScript also lets you shorten \`x: x\` to just \`x\`, which you will see in real code.) This "copy, then change the copy" style is often called an *immutable update*, and it is popular precisely because it avoids aliasing surprises.

**Common wrong attempts.**

- \`p.x = x; return p;\` returns an object that looks right, but it is the caller's own object, now changed. Two tests catch it.
- \`const q = p; q.x = x; return q;\` is the same mistake in disguise: \`q = p\` copies the arrow, not the object, so \`q\` is an alias.
- \`return { x: x, ...p };\` puts the new \`x\` *first*, so the copied \`x\` from \`p\` overrides it and nothing changes.`,
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
        why: '`const q = p` copies the arrow, not the object, so `q` is just another alias: this is the opening puzzle of the chapter.',
      },
      {
        code: `function withX(p, x) {
  return { x: x, ...p };
}`,
        why: 'Order matters: the spread comes after `x: x`, so `p`’s own `x` overwrites the new value.',
      },
    ],
  },
  withPosX: {
    optional: true,
    title: 'A copy one level deeper',
    prompt: 'Particles here keep their position in an inner object: `{ id: 1, pos: { x: 0, y: 0 } }`. Write `withPosX(a, x)` that returns a **new** particle like `a` whose `pos.x` is `x`, leaving `a` and `a.pos` completely unchanged.',
    starter: `function withPosX(a, x) {
  // your code here
}

const a = {
  id: 1,
  pos: { x: 0, y: 3 },
};
const b = withPosX(a, 5);
console.log(a.pos.x, b.pos.x);`,
    solution: `function withPosX(a, x) {
  const pos = { ...a.pos, x: x };
  return { ...a, pos: pos };
}`,
    tests: `test('the copy has the new pos.x', () => {
  const a = { id: 1, pos: { x: 0, y: 2 } };
  expect(withPosX(a, 5)).toEqual({ id: 1, pos: { x: 5, y: 2 } });
});
test('the original pos is untouched', () => {
  const a = { id: 1, pos: { x: 0, y: 0 } };
  withPosX(a, 5);
  expect(a.pos.x).toBe(0);
});
test('the copy has its own pos', () => {
  const a = { id: 1, pos: { x: 0, y: 0 } };
  expect(withPosX(a, 5).pos === a.pos).toBe(false);
});`,
    hints: [
      'A plain `{ ...a }` shares `a.pos` with the copy. Which test would that break, if you then changed `pos.x`?',
      'You need two new objects: a new outer one, and a new `pos`.',
      'First build the new position, `{ ...a.pos, x: x }`; then build the new particle, `{ ...a, pos: ... }`, using it.',
    ],
    walkthrough: `**How to think about it.** Draw the arrows. \`a\` points at an outer object whose \`pos\` property is an arrow to an inner object. A shallow \`{ ...a }\` gives a new outer object, but its \`pos\` arrow leads to the *same* inner object, so changing \`pos.x\` through the copy changes \`a.pos.x\` too. The thing being changed lives in the inner object, so the inner object is the one that must be copied, and the outer one must be copied as well, so that it can point at the new inner one.

**The solution, line by line.**

- \`function withPosX(a, x) {\` takes the particle and the new x.
- \`  const pos = { ...a.pos, x: x };\` makes the new inner object first: a spread copy of the old position (\`x\` and \`y\`), with \`x\` then set to the new value. Nothing about \`a.pos\` changes; it is only read.
- \`  return { ...a, pos: pos };\` makes the new outer particle: \`...a\` copies \`id\` and the old \`pos\` arrow, and then \`pos: pos\` replaces that copied arrow with an arrow to the new inner object from the line before.
- \`}\` closes the body.

Afterwards \`a\` and \`a.pos\` have never been written to; the result has its own outer object and its own \`pos\`, which the third test checks with \`===\`.

**Common wrong attempts.**

- \`const b = { ...a }; b.pos.x = x; return b;\` is the shallow-copy trap: \`b.pos\` and \`a.pos\` are one object, so the original's position moves too.
- \`return { ...a, pos: { x: x } };\` makes a new \`pos\` but forgets to copy \`y\`, so the copy loses it.`,
    wrong: [
      {
        code: `function withPosX(a, x) {
  const b = { ...a };
  b.pos.x = x;
  return b;
}`,
        why: 'Spread is shallow: `b.pos` is the same object as `a.pos`, so this moves the original too.',
      },
      {
        code: `function withPosX(a, x) {
  return { ...a, pos: { x: x } };
}`,
        why: 'The new `pos` has only `x`; the original’s `y` is lost. Spread `a.pos` into it first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const c = { ...a };` and `a.pos` is an object. Which is true?',
    options: [
      {
        t: '`c.pos` is a separate copy of `a.pos`',
        why: 'Spread is shallow: inner objects aren’t copied.',
      },
      {
        t: '`c === a`',
        why: 'Spread always creates a new outer object.',
      },
      {
        t: '`c.pos` is `undefined`',
        why: 'Spread copies every property, including `pos`.',
      },
      {
        t: '`c.pos === a.pos`',
        correct: true,
        why: 'The arrow to the inner object was copied, so both point at the same `pos`.',
      },
    ],
  },
  {
    q: 'Which line creates a **new** object rather than another alias of `p`?',
    options: [
      {
        t: '`const q = p;`',
        why: 'That copies the arrow: `q` is an alias.',
      },
      {
        t: '`const q = { ...p };`',
        correct: true,
        why: 'Spread builds a brand-new object and copies the properties in.',
      },
      {
        t: '`p.copy = true;`',
        why: 'That mutates `p` itself.',
      },
      {
        t: '`const q = [p][0];`',
        why: 'That puts the arrow in an array and takes it back out: still the same object.',
      },
    ],
  },
  {
    q: 'What is `{ ...{ x: 1, y: 2 }, x: 3 }`?',
    options: [
      {
        t: '`{ x: 1, y: 2 }`',
        why: 'The `x: 3` written after the spread overrides the copied `x`.',
      },
      {
        t: '`{ x: 3, y: 2 }`',
        correct: true,
        why: 'Copy `x: 1` and `y: 2`, then `x: 3` replaces the `x`.',
      },
      {
        t: '`{ x: 3 }`',
        why: 'Spread copied `y` as well, and nothing removes it.',
      },
      {
        t: 'An error: `x` appears twice',
        why: 'Writing a key that is already there simply replaces its value.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const xs = [1, 2];
const ys = [...xs];
ys.push(3);
console.log(xs.length);
\`\`\``,
    options: [
      {
        t: '`3`',
        why: '`[...xs]` is a new array, so pushing onto `ys` leaves `xs` alone.',
      },
      {
        t: '`2`',
        correct: true,
        why: '`ys` is a copy, not an alias, so `xs` still has two slots.',
      },
      {
        t: '`undefined`',
        why: '`xs` is still an array, with a length.',
      },
    ],
  },
  {
    q: 'Why is aliasing a problem for an optimiser that changes an array of objects into a struct of arrays?',
    options: [
      {
        t: 'Aliases make arrays longer',
        why: 'Aliasing doesn’t change any lengths.',
      },
      {
        t: 'Struct of arrays can’t hold numbers',
        why: 'SoA is ideal for numbers; that isn’t the issue.',
      },
      {
        t: 'Other references to the same objects must still see every change, so the optimiser must know where all the arrows can go',
        correct: true,
        why: 'If any alias could observe the old layout, the program could print wrong answers. Alias and escape analysis answer this.',
      },
      {
        t: 'It isn’t a problem; layout never affects behaviour',
        why: 'Layout changes are only safe when no code can tell the difference, and aliases can.',
      },
    ],
  },
];
