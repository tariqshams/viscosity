// Chapter 7 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ref-what': {
    q: 'When a variable “holds” an object, what does it actually hold?',
    a: 'A reference: an arrow pointing at the object, not a copy of the object.',
  },
  'alias-change': {
    q: '`const b = a;` where `a` is an object, then `b.x = 5`. What is `a.x`, and why?',
    a: '`5`. `a` and `b` are aliases: two arrows to the same object.',
  },
  'const-arrow': {
    q: 'Why can you `push` onto an array declared with `const`?',
    a: '`const` only stops the name being re-aimed at a different array; the array itself can still be changed.',
  },
  'mutation-what': {
    q: 'Which of these is a mutation: `o.k = 1`, `xs.push(2)`, `o = {}`?',
    a: 'The first two. `o = {}` re-aims the variable’s arrow; it changes no object.',
  },
  'fn-mutates': {
    q: 'A function sets `obj.n = 1` on an object it was passed. Does the caller see the change?',
    a: 'Yes. The parameter holds a copy of the arrow, so both point at the same object.',
  },
  'fn-reassign': {
    q: 'A function does `param = {}` to a parameter it was passed. Does the caller’s variable change?',
    a: 'No. That only re-aims the function’s local arrow; the caller’s arrow is untouched.',
  },
  identity: {
    q: 'What does `{ x: 1 } === { x: 1 }` give, and why?',
    a: '`false`. For objects `===` asks “same object?”, and these are two separate objects with equal contents.',
  },
  'same-contents': {
    q: 'How can you check that two objects `a` and `c` hold the same `x`, if `a === c` is false?',
    a: 'Compare the fields themselves: `a.x === c.x` compares two numbers.',
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
console.log(a.x === c.x);

function reset(o) {
  o.x = 0;
  o = { x: 50 };
}
reset(a);
console.log(a.x, b.x);`,
  },
};

export const exercises = {
  indexOfSame: {
    title: 'Find this exact object',
    prompt: 'Write `indexOfSame(xs, target)` that returns the index of the first slot of `xs` holding **the very same object** as `target` (identity, not equal contents), or `-1` if there is none.',
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
test('the first of two aliases', () => {
  const a = { id: 2 };
  expect(indexOfSame([{ id: 0 }, a, a], a)).toBe(1);
});
test('empty list', () => {
  expect(indexOfSame([], {})).toBe(-1);
});`,
    hints: [
      'Which comparison asks “is this the very same object?” rather than “does it look the same?”',
      'Loop over the slots (*Visiting every slot*) and compare each slot with `target` using `===`.',
      'As soon as `xs[i] === target`, `return i`. If the loop finishes without finding one, `return -1`.',
    ],
    walkthrough: `**How to think about it.** The words "the very same object" are the whole clue: that is identity, and \`===\` on objects is exactly the identity test, \`true\` only when both arrows point at one object. So the job is a search: look at each slot in turn, ask "is this arrow pointing at the same object as \`target\`?", and stop at the first yes. If you get to the end without a yes, report "not found" with \`-1\` (which can never be a real index, so the caller can tell the two cases apart).

**The solution, line by line.**

- \`function indexOfSame(xs, target) {\` takes the array and the object to find.
- \`  for (let i = 0; i < xs.length; i++) {\` visits the slots in order, from 0.
- \`    if (xs[i] === target) {\` compares the arrow in slot \`i\` with the arrow in \`target\`. It does not look inside the objects at all.
- \`      return i;\` stops the function at once with the index found (the early return from *Functions*), which is why the third test, with \`a\` in two slots, gets the first one, 1.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return -1;\` only runs if the loop finished without returning, which means no slot matched.
- \`}\` closes the body.

The first test is the point of the exercise: slot 0 holds \`{ id: 1 }\`, which looks exactly like \`a\` but is a separate object, so it is skipped, and the answer is 1.

**Common wrong attempts.**

- Comparing contents, \`xs[i].id === target.id\`, matches the lookalike in slot 0, so the first test gets 0 rather than 1.
- Putting \`return -1;\` inside the loop, in an \`else\`, gives up after looking at the first slot only.`,
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
      {
        code: `function indexOfSame(xs, target) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === target) {
      return i;
    } else {
      return -1;
    }
  }
  return -1;
}`,
        why: 'The `else` returns `-1` as soon as the first slot fails to match, so the rest of the array is never searched.',
      },
    ],
  },
  distinct: {
    optional: true,
    title: 'How many different objects?',
    prompt: 'Write `distinct(xs)` that returns how many **different objects** the array `xs` holds, counting by identity. An object that appears in several slots counts once; two lookalike objects count twice. For example, with `const a = {}` and `const b = {}`, `distinct([a, a, b])` is `2`.',
    starter: `function distinct(xs) {
  // your code here
}

const a = {};
const b = {};
console.log(distinct([a, a, b]));`,
    solution: `function distinct(xs) {
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    let seen = false;
    for (let j = 0; j < i; j++) {
      if (xs[j] === xs[i]) seen = true;
    }
    if (!seen) n++;
  }
  return n;
}`,
    tests: `test('an alias counts once', () => {
  const a = {};
  const b = {};
  expect(distinct([a, a, b])).toBe(2);
});
test('lookalikes count separately', () => {
  expect(distinct([{ x: 1 }, { x: 1 }])).toBe(2);
});
test('the same object three times', () => {
  const p = { x: 0 };
  expect(distinct([p, p, p])).toBe(1);
});
test('empty array', () => {
  expect(distinct([])).toBe(0);
});`,
    hints: [
      'Count a slot only if its object has not appeared in any earlier slot.',
      'For slot `i`, look at every earlier slot `j` (from 0 up to, but not including, `i`) and check `xs[j] === xs[i]`.',
      'Use a `let seen = false;` for each `i`, set it to `true` when you find a match, and add one to the count only if it is still `false`.',
    ],
    walkthrough: `**How to think about it.** Say "count each object the first time you meet it". For \`[a, a, b]\`: slot 0 is \`a\`, never seen before, so count it (1); slot 1 is \`a\` again, already met in slot 0, so skip it; slot 2 is \`b\`, new, so count it (2). "Already met" means "some earlier slot holds the very same object", which is a little search over the slots before the current one, using \`===\` for identity. A loop inside a loop does it.

**The solution, line by line.**

- \`let n = 0;\` counts the different objects found so far.
- \`for (let i = 0; i < xs.length; i++) {\` visits each slot.
- \`  let seen = false;\` starts fresh for every slot: we have not yet found this object earlier.
- \`  for (let j = 0; j < i; j++) {\` visits only the slots *before* \`i\`. For \`i = 0\` this inner loop runs zero times, so the first slot always counts.
- \`    if (xs[j] === xs[i]) seen = true;\` marks the object as already met if an earlier slot holds the same arrow.
- \`  if (!seen) n++;\` counts it only if no earlier slot matched (\`!\` turns \`false\` into \`true\`).
- \`return n;\` after the outer loop.

**Common wrong attempts.**

- Letting the inner loop reach the current slot (\`j <= i\`, or \`j < xs.length\`) means every object finds itself when \`j\` equals \`i\`, so \`seen\` is always \`true\` and the answer is always 0.
- Comparing contents (for example with a field) would count the two lookalikes in the second test as one.`,
    wrong: [
      {
        code: `function distinct(xs) {
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    let seen = false;
    for (let j = 0; j <= i; j++) {
      if (xs[j] === xs[i]) seen = true;
    }
    if (!seen) n++;
  }
  return n;
}`,
        why: 'With `j <= i` the inner loop reaches `j === i`, where every object matches itself, so `seen` is always `true` and the count is always 0. Only look at earlier slots: `j < i`.',
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
      {
        t: '`1`',
        why: 'That would be true if `b` were a copy, but `const b = a` copies only the arrow.',
      },
      {
        t: '`undefined`',
        why: '`a.n` exists; it was changed through `b`.',
      },
      {
        t: '`2`',
        correct: true,
        why: '`a` and `b` point at one object, so the change through `b` shows through `a`.',
      },
      {
        t: 'An error, because `b` is `const`',
        why: '`const` stops re-aiming `b`, not changing the object it points at.',
      },
    ],
  },
  {
    q: 'What is `[1, 2] === [1, 2]`?',
    options: [
      {
        t: '`true`',
        why: 'The contents are equal, but `===` on arrays checks identity.',
      },
      {
        t: '`false`',
        correct: true,
        why: 'Each `[...]` makes a new array, so these are two different objects.',
      },
      {
        t: 'An error',
        why: 'Comparing arrays with `===` is allowed; it just compares identity.',
      },
      {
        t: 'It depends on the engine',
        why: 'The language specifies this precisely: different objects are never `===`.',
      },
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
      {
        t: '`1`',
        correct: true,
        why: '`o = ...` re-aims only the function’s own copy of the arrow; `x` still points at `{ v: 1 }`.',
      },
      {
        t: '`2`',
        why: 'That would need `o.v = 2` (a mutation), not re-aiming `o`.',
      },
      {
        t: '`undefined`',
        why: '`x` still points at its original object, which has `v: 1`.',
      },
      {
        t: 'An error',
        why: 'Re-assigning a parameter is allowed.',
      },
    ],
  },
  {
    q: `Which line stops the program?
\`\`\`
const p = { x: 1 };
p.x = 2;        // line 2
p.y = 3;        // line 3
p = { x: 4 };   // line 4
\`\`\``,
    options: [
      {
        t: 'Line 2',
        why: 'Changing a property is a mutation of the object, which `const` allows.',
      },
      {
        t: 'Line 3',
        why: 'Adding a property is also a mutation of the object, so it is allowed.',
      },
      {
        t: 'None of them',
        why: 'Line 4 tries to re-aim a `const` name, which is refused.',
      },
      {
        t: 'Line 4',
        correct: true,
        why: 'It tries to point `p` at a different object: “TypeError: Assignment to constant variable.”',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const ps = [{ x: 0 }];
const cur = ps[0];
cur.x = 9;
console.log(ps[0].x, cur === ps[0]);
\`\`\``,
    options: [
      {
        t: '`0 false`',
        why: '`cur = ps[0]` copies the arrow from the slot, so it reaches the same object.',
      },
      {
        t: '`9 true`',
        correct: true,
        why: '`cur` and `ps[0]` are aliases: the change shows through the slot, and `===` confirms it is one object.',
      },
      {
        t: '`9 false`',
        why: 'They are the same object, so `===` is `true`.',
      },
      {
        t: '`0 true`',
        why: 'If they are the same object (they are), the change through `cur` must show in `ps[0]`.',
      },
    ],
  },
  {
    q: 'In C, `struct P b = a;` and then `b.x = 99;`. What happens to `a.x`?',
    options: [
      {
        t: 'It becomes 99, as in JavaScript',
        why: 'In C, assigning a struct copies all of it, so `b` is a separate struct.',
      },
      {
        t: 'It is unchanged: `b` is a copy',
        correct: true,
        why: 'C copies structs by value; to alias `a` you need a pointer, `&a`.',
      },
      {
        t: 'The program will not compile',
        why: 'Copying a struct by assignment is ordinary C.',
      },
    ],
  },
];
