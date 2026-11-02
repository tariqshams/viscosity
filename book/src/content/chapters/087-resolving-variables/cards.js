// Chapter 87 cards. Keys are stable ids: never rename them.

export const prompts = {
  'shadow-bug': {
    q: 'With lookups that search the chain at run time, why can `show`’s `print x` print `global` and then `block`?',
    a: 'A later `let x` adds `x` to the same environment `show` captured, so the second search finds it sooner.',
  },
  'resolver-when': {
    q: 'When does the resolver run?',
    a: 'Once, after parsing and before the interpreter starts running the program.',
  },
  'what-recorded': {
    q: 'What does the resolver record for each local variable use?',
    a: 'Its distance: how many scopes (environments) out from the current one its declaration is.',
  },
  'global-no-entry': {
    q: 'The resolver can’t find a name in any scope. What does it do?',
    a: 'Nothing: it assumes the name is a global, and the interpreter looks it up in the globals.',
  },
  'node-keys': {
    q: 'Why does `locals` use syntax-tree nodes as its keys, not names?',
    a: 'Two uses of the same name can refer to different variables. Each node is a separate object, so each gets its own entry.',
  },
  hops: {
    q: '`getAt(2, "a")`: what does the interpreter do?',
    a: 'Follows the parent link twice from the current environment, then reads `a` from that environment’s map.',
  },
  'must-match': {
    q: 'Why must the resolver push a scope exactly where the interpreter creates an environment?',
    a: 'Distances count levels. One extra or missing level on either side makes every distance past it wrong.',
  },
  'self-init': {
    q: 'How does the resolver catch `let a = a;` inside a block?',
    a: '`a` is declared “not ready” before the initializer is resolved, and reading a not-ready variable is an error.',
  },
  'before-running': {
    q: 'A program’s first line is a `print`, and a later line has a resolver error. Does the `print` run?',
    a: 'No. Resolver errors stop the program (exit code 65) before the interpreter starts.',
  },
  'first-compiler-step': {
    q: 'What will Drip’s bytecode compiler in Part IV turn each local variable into, instead of a distance?',
    a: 'A slot number, so the VM never looks locals up by name.',
  },
};

export const examples = {
  'static-errors': {
    title: 'Caught before running',
    lang: 'drip',
    expectError: true,
    code: `print "first line";
{
  let a = "outer";
  {
    let a = a;
  }
}
let g = 1;
let g = 2;
return g;`,
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
    walkthrough: `Two details carry the whole exercise: the direction of the search and what you count.

\`\`\`js
function resolveDepth(scopes, name) {
  const top = scopes.length - 1;
  for (let i = top; i >= 0; i--) {
    if (scopes[i].has(name)) {
      return top - i;
    }
  }
  return null;
}
\`\`\`

- **Innermost first.** If two scopes both declare \`x\`, the inner one shadows the outer one. Searching from the inside and stopping at the first match gets that right for free.
- **Count from the top.** The index \`i\` says how far a scope is from the *outside*. The interpreter starts from the current (innermost) environment and hops outwards, so it needs \`top - i\`.
- **\`null\` for globals.** The real resolver records nothing at all for globals; the interpreter treats "no entry" as "look in the globals".

This is the same loop as \`resolveLocal\` in the companion resolver, minus the map it writes into.`,
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
  copyOuter: {
    optional: true,
    title: 'A copy of the outer value',
    lang: 'drip',
    prompt:
      'This Drip program is rejected by the resolver. Make it print `copy of outer` and then `outer`, without changing the outer `let a`.',
    starter: `{
  let a = "outer";
  {
    let a = "copy of " + a;
    print a;
  }
  print a;
}`,
    solution: `{
  let a = "outer";
  {
    let b = "copy of " + a;
    print b;
  }
  print a;
}`,
    tests: `copy of outer
outer`,
    hints: [
      'The inner `let a` is being declared while its initializer mentions `a`. The resolver forbids that.',
      'Give the inner variable a different name, so `a` in the initializer can only mean the outer one.',
    ],
    walkthrough: `In \`let a = "copy of " + a;\` the resolver declares the new \`a\` first (not ready), then resolves the initializer. The \`a\` in the initializer finds the *new*, not-ready \`a\` in the innermost scope, so it is an error: \`Can't read local variable in its own initializer.\`

Renaming the inner variable makes the meaning unambiguous:

\`\`\`
let b = "copy of " + a;
print b;
\`\`\`

Now \`a\` is found one scope out, the outer \`a\`, and the outer value is untouched, so the last line still prints \`outer\`.

Dropping the inner \`let\` doesn't work: \`a = "copy of " + a;\` is an assignment to the *outer* \`a\`, so the last line would print \`copy of outer\` too.`,
    wrong: [
      {
        code: `{
  let a = "outer";
  {
    a = "copy of " + a;
    print a;
  }
  print a;
}`,
        why: 'Without `let`, this assigns to the outer `a`, so both lines print `copy of outer`. You need a new variable with a new name.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does the resolver need to know about each variable in a scope?',
    options: [
      { t: 'Its current value', why: 'The resolver never runs the program, so there are no values yet.' },
      { t: 'Its name, and whether its declaration has finished (“ready”)', correct: true, why: 'Each scope maps a name to a ready flag. The flag catches a variable read in its own initializer.' },
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
      { t: 'A resolver error', why: 'Shadowing an outer `x` in an inner block is allowed. Only a duplicate in the *same* scope is an error.' },
    ],
  },
  {
    q: 'The resolver recorded distance 2 for a variable. What does the interpreter do?',
    options: [
      { t: 'Searches up to 2 environments for the name', why: 'There is no search: it goes straight to the environment exactly 2 parents up.' },
      { t: 'Reads the 2nd variable of the current environment', why: 'The distance counts environments, not variables within one.' },
      { t: 'Looks in the globals', why: 'Globals have no entry at all. A recorded distance means a local.' },
      { t: 'Follows the parent link twice, then reads the name there', correct: true, why: '`getAt(2, name)` is `ancestor(2).values.get(name)`.' },
    ],
  },
  {
    q: 'Which of these is a resolver error in Drip?',
    options: [
      { t: '`let a = 1; let a = 2;` at the top level', why: 'Globals aren’t tracked by the resolver, so redeclaring one is allowed. This prints 2 if you print `a`.' },
      { t: 'Two `let b`s in the same block', correct: true, why: '`Already a variable with this name in this scope.`' },
      { t: 'Calling a function with too many arguments', why: 'That is a runtime error: the resolver doesn’t know what a name will hold.' },
      { t: 'Adding a string to a number', why: 'Also a runtime error, found when the `+` runs.' },
    ],
  },
  {
    q: 'Why is the resolver called *static* analysis?',
    options: [
      { t: 'It works from the syntax tree without running the program', correct: true, why: 'Static means “before or without running”. The resolver only reads the tree.' },
      { t: 'It runs once per function call', why: 'It runs once for the whole program, before any call.' },
      { t: 'It only handles global variables', why: 'It deliberately ignores globals and handles locals.' },
      { t: 'Its results never change while the program runs', why: 'That is true, but it follows from the real reason: it is computed without running anything.' },
    ],
  },
  {
    q: 'The resolver pushes a scope for a block, but suppose the interpreter ran blocks without making a new environment. What breaks?',
    options: [
      { t: 'Nothing: the distances still work', why: 'The resolver would count one more level than really exists inside every block.' },
      { t: 'Only globals break', why: 'Globals don’t use distances at all, so they’d be fine. Locals would break.' },
      { t: 'Distances that cross that block point one environment too far', correct: true, why: 'The two sides must create levels in exactly the same places, or every hop count past the mismatch is off by one.' },
      { t: 'The resolver reports an error', why: 'The resolver can’t see what the interpreter does. The mismatch would show up as wrong values at run time.' },
    ],
  },
];
