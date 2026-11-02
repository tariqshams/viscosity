// Chapter 110 cards. Keys are stable ids: never rename them.

export const prompts = {
  'shadow-bug': {
    q: 'With lookups that search the chain at run time, why can `show()` print `global` once and `block` the next time?',
    a: 'A later `let x` adds `x` to the very environment `show` captured, so the second search finds it first.',
  },
  'resolver-when': {
    q: 'When does the resolver run?',
    a: 'After parsing and before interpreting: once, over the whole program, without running it.',
  },
  'what-recorded': {
    q: 'What does the resolver record for each use of a local variable?',
    a: 'How many scopes out its declaration is: its scope depth.',
  },
  'global-no-entry': {
    q: 'What does the resolver record for a global variable?',
    a: 'Nothing. A name with no entry is looked up in the globals.',
  },
  'node-keys': {
    q: 'Why can `locals` tell apart two different uses of `x` that are spelled the same?',
    a: 'Its keys are the syntax-tree nodes themselves, and a `Map` compares object keys by identity.',
  },
  'depth-what': {
    q: 'What is a variable use’s *scope depth*?',
    a: 'The number of environments between the one where it is used and the one where it is declared.',
  },
  'hops': {
    q: 'Inside `inner`, `b` has depth 1 and `a` depth 2. What does the interpreter do for `a`?',
    a: 'Starts at the current environment, follows two parent links, and reads `a` there.',
  },
  'must-match': {
    q: 'Why must the resolver begin a scope exactly where the interpreter makes an environment?',
    a: 'Otherwise the recorded distances would be off by one past the mismatch, and lookups would read the wrong variable.',
  },
};

export const examples = {
  hops: {
    title: 'Distances, with a shadow',
    lang: 'drip',
    code: `fn outer() {
  let a = 1;
  {
    let b = 2;
    fn inner() {
      let a = 10;
      print a + b;
    }
    inner();
  }
  print a;
}
outer();`,
  },
};

export const exercises = {
  resolveDepth: {
    title: 'How far up?',
    prompt:
      'Write `resolveDepth(scopes, name)`, the heart of the resolver. `scopes` is an array of `Set`s of names, outermost first and innermost **last**. Return how many scopes out from the innermost one `name` is declared (`0` means the innermost scope). If no scope has it, return `null`: it is a global.',
    starter: `function resolveDepth(scopes, name) {
  // your code here
  return 0;
}`,
    solution: `function resolveDepth(scopes, name) {
  const top = scopes.length - 1;
  for (let i = top; i >= 0; i--) {
    if (scopes[i].has(name)) {
      return top - i;
    }
  }
  return null;
}`,
    tests: `test('innermost is 0', () => {
  const s = [new Set(['a']), new Set(['b'])];
  expect(resolveDepth(s, 'b')).toBe(0);
});
test('counts outwards', () => {
  const s = [
    new Set(['a']),
    new Set(['b']),
    new Set([]),
  ];
  expect(resolveDepth(s, 'a')).toBe(2);
  expect(resolveDepth(s, 'b')).toBe(1);
});
test('the innermost declaration wins', () => {
  const s = [new Set(['x']), new Set(['x'])];
  expect(resolveDepth(s, 'x')).toBe(0);
});
test('not found means global', () => {
  const s = [new Set(['a'])];
  expect(resolveDepth(s, 'z')).toBe(null);
  expect(resolveDepth([], 'a')).toBe(null);
});`,
    hints: [
      'Search from the innermost scope (the last one) towards the outermost (index 0).',
      'If the innermost index is `top = scopes.length - 1`, then a match at index `i` is `top - i` scopes out.',
      'Loop `for (let i = top; i >= 0; i--)`, return `top - i` on the first match, and return `null` after the loop.',
    ],
    walkthrough: `**How to think about it.** Picture the scope stack the way the resolver holds it: the outermost scope at index 0 and the innermost at the end. A use of a name means the *nearest* declaration, so the search must start at the innermost scope and move outwards, stopping at the first scope that has the name. Then think about what the interpreter will do with your answer: it starts from the current (innermost) environment and hops outwards, so the number it needs is how many steps *from the inside*, not the index from the outside.

**The solution, line by line.**

- \`function resolveDepth(scopes, name) {\` takes the stack of scopes and the name being looked up.
- \`  const top = scopes.length - 1;\` is the index of the innermost scope.
- \`  for (let i = top; i >= 0; i--) {\` visits the scopes from the inside out.
- \`    if (scopes[i].has(name)) {\` asks whether this scope declares the name.
- \`      return top - i;\` turns the index into a distance: the innermost scope gives 0, its parent 1, and so on. Returning at the first match is what makes an inner declaration shadow an outer one.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return null;\` is reached only when no scope has the name: it is a global. (The real resolver records nothing at all for globals; \`null\` plays that part here.)
- \`}\` ends the function.

This is the same loop as \`resolveLocal\` in the companion's resolver, minus the map it writes into and the "not ready" check.

**Common wrong attempts.**

- Searching from index 0 upwards finds the *outermost* declaration, so when an inner scope shadows a name, the answer points at the wrong variable.
- Returning \`i\` instead of \`top - i\` searches in the right order but counts from the outside, so the interpreter would hop the wrong number of times.
- Returning \`-1\` or \`0\` for a missing name: \`0\` means "the innermost scope", which is a real answer, so a global would be mistaken for a local.`,
    wrong: [
      {
        code: `function resolveDepth(scopes, name) {
  const top = scopes.length - 1;
  for (let i = 0; i <= top; i++) {
    if (scopes[i].has(name)) {
      return top - i;
    }
  }
  return null;
}`,
        why: 'This searches outermost first. When an inner scope shadows a name, it finds the outer declaration instead. The “innermost declaration wins” test fails.',
      },
      {
        code: `function resolveDepth(scopes, name) {
  const top = scopes.length - 1;
  for (let i = top; i >= 0; i--) {
    if (scopes[i].has(name)) {
      return i;
    }
  }
  return null;
}`,
        why: 'The search order is right, but `i` counts from the outermost scope. The interpreter hops from the innermost one, so return `top - i`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does the resolver keep about each variable in a scope?',
    options: [
      { t: 'Its current value', why: 'The resolver never runs the program, so there are no values yet.' },
      { t: 'Its name, and whether its declaration has finished (“ready”)', correct: true, why: 'Each scope maps a name to a ready flag; the flag catches a variable read in its own initialiser.' },
      { t: 'Its type', why: 'Drip is dynamically typed. The resolver only works out which declaration a name means.' },
      { t: 'How many times it is used', why: 'It records where each use points, not a count.' },
    ],
  },
  {
    q: `With the resolver, what does this print?
\`\`\`
let x = "global";
{
  fn show() { print x; }
  show();
  let x = "block";
  show();
}
\`\`\``,
    options: [
      { t: '`global` then `block`', why: 'That is the bug from searching the chain at run time. The resolver fixed `show`’s `x` as the global before the block’s `x` existed.' },
      { t: '`block` twice', why: 'When `show` was resolved, the block had no `x` yet.' },
      { t: '`global` twice', correct: true, why: 'The resolver found no local `x` when it walked `show`’s body, so `x` there always means the global.' },
      { t: 'A compile error', why: 'Shadowing an outer `x` in an inner block is allowed. Only a second declaration in the *same* scope is an error.' },
    ],
  },
  {
    q: 'The resolver recorded distance 2 for a variable. What does the interpreter do?',
    options: [
      { t: 'Searches up to 2 environments for the name', why: 'There is no search: it goes straight to the environment exactly 2 parents up.' },
      { t: 'Reads the 2nd variable of the current environment', why: 'The distance counts environments, not variables within one.' },
      { t: 'Looks in the globals', why: 'Globals have no entry at all. A recorded distance means a local.' },
      { t: 'Follows the parent link twice, then reads the name there', correct: true, why: '`getAt(2, name)` reads the name in `ancestor(2)`.' },
    ],
  },
  {
    q: 'In `for i in 0..3 { print i; }`, what distance does the resolver record for the `i` in `print i`?',
    options: [
      { t: '0', why: 'The innermost scope is the body’s own, which does not declare `i`.' },
      { t: '1', correct: true, why: 'The loop variable has its own scope just outside the body’s, and the interpreter makes the matching two environments on every pass.' },
      { t: 'None: loop variables are globals', why: 'A loop variable is local to the loop.' },
    ],
  },
  {
    q: 'Suppose the interpreter ran blocks without making a new environment, while the resolver still began a scope for each. What breaks?',
    options: [
      { t: 'Nothing: the distances still work', why: 'The resolver would count one more level than really exists inside every block.' },
      { t: 'Only globals break', why: 'Globals do not use distances at all, so they would be fine. Locals would break.' },
      { t: 'Distances that cross that block point one environment too far', correct: true, why: 'The two sides must create levels in exactly the same places, or every hop count past the mismatch is off by one.' },
      { t: 'The resolver reports an error', why: 'The resolver cannot see what the interpreter does. The mismatch would show up as wrong values at run time.' },
    ],
  },
];
