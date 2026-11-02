// Chapter 60 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 70, 70.

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
  hops: {
    q: 'Inside `inner`, `b` has depth 1 and `a` depth 2. What does the interpreter do for `a`?',
    a: 'Starts at the current environment, follows two parent links, and reads `a` there.',
  },
  'must-match': {
    q: 'Why must the resolver begin a scope exactly where the interpreter makes an environment?',
    a: 'Otherwise the recorded distances would be off by one past the mismatch, and lookups would read the wrong variable.',
  },
  'static-what': {
    q: 'What does *static analysis* mean?',
    a: 'Learning facts about a program from its source or syntax tree, without running it.',
  },
  'compile-vs-runtime': {
    q: 'What is the difference between a compile error and a runtime error in Drip?',
    a: 'A compile error is found before the program starts, so nothing runs (exit 65); a runtime error stops it part-way (exit 70).',
  },
  'rare-branch': {
    q: 'Why is it useful that the resolver checks code inside an `if` that hardly ever runs?',
    a: 'Its results hold for every run, so the mistake is found now rather than the first time that branch runs.',
  },
  'loop-depth': {
    q: 'How does the resolver know whether a `break` is inside a loop?',
    a: 'It keeps a count, `loopDepth`, raised on entering a loop body and lowered on leaving it; 0 means no loop.',
  },
  'all-errors': {
    q: 'Does the resolver stop at the first error it finds?',
    a: 'No. It reports each one and keeps walking, so every error is listed, in source order.',
  },
  'syntax-first': {
    q: 'A program has a syntax error and a `return` at the top level. Which errors are reported?',
    a: 'Only the syntax error: the static rules are checked only when the program parsed cleanly.',
  },
  'break-in-fn': {
    q: 'Why is `while true { fn g() { break; } }` a compile error?',
    a: 'Entering a function resets the loop count to 0: the `break` would run in a call of `g`, not inside the loop.',
  },
  'cannot-know': {
    q: 'Name a Drip mistake the resolver cannot catch, and say why.',
    a: 'For example `"a" + 1`, a wrong argument count or an undefined global: the source does not say what a name will hold.',
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
  'static-errors': {
    title: 'Every error, before anything runs',
    lang: 'drip',
    expectError: true,
    code: `print "first line";
{
  let a = "outer";
  {
    let a = a;
  }
}
fn f(x) {
  let x = 2;
  continue;
}
return f;`,
  },
};

export const exercises = {
  resolveDepth: {
    title: 'How far up?',
    prompt: 'Write `resolveDepth(scopes, name)`, the heart of the resolver. `scopes` is an array of `Set`s of names, outermost first and innermost **last**. Return how many scopes out from the innermost one `name` is declared (`0` means the innermost scope). If no scope has it, return `null`: it is a global.',
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
  checkLoops: {
    title: 'break outside a loop',
    prompt: `Write the resolver's loop check for a tiny tree. A statement is one of:

- \`{ kind: 'break', line }\` or \`{ kind: 'continue', line }\`,
- \`{ kind: 'while', body }\` (a loop), \`{ kind: 'fn', body }\` (a function declaration) or \`{ kind: 'block', body }\`, where \`body\` is an array of statements,
- \`{ kind: 'print' }\`, which contains nothing.

\`checkLoops(stmts)\` returns an array of error messages, in source order, one for each \`break\` or \`continue\` that is not inside a loop, built with the given helper \`msg(s)\` (it gives \`line 3: 'break' outside a loop\`). Like Drip, a function body starts outside any loop, even when the function is declared inside one.`,
    starter: `const msg = (s) =>
  \`line \${s.line}: '\${s.kind}'\` +
  ' outside a loop';

function checkLoops(stmts) {
  // your code here
  return [];
}`,
    solution: `const msg = (s) =>
  \`line \${s.line}: '\${s.kind}'\` +
  ' outside a loop';

function checkLoops(stmts) {
  const errors = [];
  let loops = 0;
  const walk = (list) => {
    for (const s of list) {
      const k = s.kind;
      if (k === 'break' ||
          k === 'continue') {
        if (loops === 0) {
          errors.push(msg(s));
        }
      } else if (k === 'while') {
        loops++;
        walk(s.body);
        loops--;
      } else if (k === 'fn') {
        const saved = loops;
        loops = 0;
        walk(s.body);
        loops = saved;
      } else if (s.body) {
        walk(s.body);
      }
    }
  };
  walk(stmts);
  return errors;
}`,
    tests: `const brk = (line) => ({ kind: 'break', line });
const cont = (line) => ({ kind: 'continue', line });
const loop = (...body) => ({ kind: 'while', body });
const fn = (...body) => ({ kind: 'fn', body });
const blk = (...body) => ({ kind: 'block', body });
test('a break in a loop is fine', () => {
  expect(checkLoops([loop(brk(2))])).toEqual([]);
});
test('a break at the top level is an error', () => {
  expect(checkLoops([brk(1)])).toEqual(["line 1: 'break' outside a loop"]);
});
test('blocks inside a loop are still in the loop', () => {
  expect(checkLoops([loop(blk(blk(cont(4))))])).toEqual([]);
});
test('after the loop ends, break is an error again', () => {
  expect(checkLoops([loop({ kind: 'print' }), brk(5)]))
    .toEqual(["line 5: 'break' outside a loop"]);
});
test('a function inside a loop starts outside any loop', () => {
  expect(checkLoops([loop(fn(brk(3)), brk(4))]))
    .toEqual(["line 3: 'break' outside a loop"]);
});
test('every error, in source order', () => {
  expect(checkLoops([cont(1), blk(brk(2)), fn(loop(brk(4))), brk(6)])).toEqual([
    "line 1: 'continue' outside a loop",
    "line 2: 'break' outside a loop",
    "line 6: 'break' outside a loop",
  ]);
});`,
    hints: [
      'Walk the statements in order, and keep one number: how many loops you are inside right now.',
      'A `while` raises the count while you walk its body and lowers it afterwards. A `break` or `continue` with the count at 0 is an error. A `block` just walks its body.',
      'For a `fn`, save the count, set it to 0, walk the body, then put the saved count back.',
    ],
    walkthrough: `**How to think about it.** Whether a \`break\` is allowed depends only on what it is *inside*, and the walk visits the insides of each statement while that statement is "open". So carry one number as you walk, the number of loops currently open, exactly as the resolver's \`loopDepth\` does. The one twist is a function: its body runs in a call of its own, so whatever loops surround the declaration do not count inside it; save the count, start the body at 0, and restore the count afterwards.

**The solution, line by line.**

- \`const msg = ...\` (given) builds a message such as \`line 3: 'break' outside a loop\`.
- \`function checkLoops(stmts) {\` checks a whole program.
- \`  const errors = [];\` collects the messages in the order they are found, which is source order because the walk goes in order.
- \`  let loops = 0;\` is the count of open loops.
- \`  const walk = (list) => {\` walks a list of statements; it calls itself for nested bodies.
- \`    for (const s of list) {\` and \`      const k = s.kind;\` visit each statement.
- \`      if (k === 'break' ||\` \`k === 'continue') {\` picks out the two statements that need a loop, and \`if (loops === 0) { errors.push(msg(s)); }\` reports one outside any loop, and keeps going.
- \`      } else if (k === 'while') {\` with \`loops++\`, \`walk(s.body)\`, \`loops--\` opens a loop for exactly the length of its body. Forgetting \`loops--\` would leave every later statement "inside" a loop that has ended.
- \`      } else if (k === 'fn') {\` saves the count in \`saved\`, sets \`loops = 0\`, walks the body, and puts \`saved\` back, so a loop around the declaration does not leak into the function, and the loop is still open again once the function's body is done.
- \`      } else if (s.body) {\` handles a \`block\`: it changes nothing, it only has statements inside. A \`print\` has no body and is skipped.
- \`  walk(stmts);\` starts at the top level, and \`  return errors;\` hands back the list.

**Common wrong attempts.**

- Treating \`fn\` like a \`block\`: a \`break\` in a function declared inside a loop is then accepted, but at run time it would be in a different call from the loop.
- Raising the count for a loop but never lowering it: a \`break\` after the loop has ended is then wrongly accepted.
- Stopping at the first error (returning straight away): the later errors are never reported, so the last test fails.`,
    wrong: [
      {
        code: `const msg = (s) =>
  \`line \${s.line}: '\${s.kind}'\` +
  ' outside a loop';

function checkLoops(stmts) {
  const errors = [];
  let loops = 0;
  const walk = (list) => {
    for (const s of list) {
      const k = s.kind;
      if (k === 'break' ||
          k === 'continue') {
        if (loops === 0) {
          errors.push(msg(s));
        }
      } else if (k === 'while') {
        loops++;
        walk(s.body);
        loops--;
      } else if (s.body) {
        walk(s.body);
      }
    }
  };
  walk(stmts);
  return errors;
}`,
        why: 'A function is walked like a block, so a `break` in a function declared inside a loop is accepted. Reset the count to 0 for a function’s body.',
      },
      {
        code: `const msg = (s) =>
  \`line \${s.line}: '\${s.kind}'\` +
  ' outside a loop';

function checkLoops(stmts) {
  const errors = [];
  let loops = 0;
  const walk = (list) => {
    for (const s of list) {
      const k = s.kind;
      if (k === 'break' ||
          k === 'continue') {
        if (loops === 0) {
          errors.push(msg(s));
        }
      } else if (k === 'while') {
        loops++;
        walk(s.body);
      } else if (k === 'fn') {
        const saved = loops;
        loops = 0;
        walk(s.body);
        loops = saved;
      } else if (s.body) {
        walk(s.body);
      }
    }
  };
  walk(stmts);
  return errors;
}`,
        why: 'The count goes up for a loop but never comes down, so a `break` after the loop has ended is wrongly accepted.',
      },
    ],
  },
  copyOuter: {
    optional: true,
    title: 'A copy of the outer value',
    lang: 'drip',
    prompt: 'This Drip program is rejected before it runs. Make it print `copy of outer` and then `outer`, without changing the outer `let a`.',
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
      'Run it first and read the error: which `a` does the `a` in the initialiser mean?',
      'The inner `let a` is being declared while its initialiser mentions `a`, which can only mean the new, unfinished `a`.',
      'Give the inner variable a different name, such as `b`, so the `a` in its initialiser can only mean the outer one.',
    ],
    walkthrough: `**How to think about it.** In \`let a = "copy of " + a;\` the resolver first declares the new \`a\` in the inner scope (not ready yet), then resolves the initialiser. The \`a\` in the initialiser finds that new, not-ready \`a\` in the innermost scope, so the resolver reports \`line 4: cannot read 'a' in its own initialiser\`, and nothing runs. The fix is to stop the two names clashing.

**The solution, line by line.**

- \`{\` and \`  let a = "outer";\` are unchanged: a block with a local \`a\`.
- \`  {\` opens an inner block, with a scope of its own.
- \`    let b = "copy of " + a;\` declares \`b\` instead; now no scope declares \`a\` in the inner block, so the \`a\` in the initialiser resolves one scope out, to the outer \`a\`.
- \`    print b;\` prints \`copy of outer\`.
- \`  }\` closes the inner block.
- \`  print a;\` prints the outer \`a\`, untouched: \`outer\`.
- \`}\` closes the outer block.

**Common wrong attempts.**

- Dropping the inner \`let\` (\`a = "copy of " + a;\`): that is an assignment to the *outer* \`a\`, so it compiles, but the last line then prints \`copy of outer\` too.`,
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
    q: 'What does the resolver keep about each variable in a scope?',
    options: [
      {
        t: 'Its current value',
        why: 'The resolver never runs the program, so there are no values yet.',
      },
      {
        t: 'Its name, and whether its declaration has finished (“ready”)',
        correct: true,
        why: 'Each scope maps a name to a ready flag; the flag catches a variable read in its own initialiser.',
      },
      {
        t: 'Its type',
        why: 'Drip is dynamically typed. The resolver only works out which declaration a name means.',
      },
      {
        t: 'How many times it is used',
        why: 'It records where each use points, not a count.',
      },
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
      {
        t: '`global` then `block`',
        why: 'That is the bug from searching the chain at run time. The resolver fixed `show`’s `x` as the global before the block’s `x` existed.',
      },
      {
        t: '`block` twice',
        why: 'When `show` was resolved, the block had no `x` yet.',
      },
      {
        t: '`global` twice',
        correct: true,
        why: 'The resolver found no local `x` when it walked `show`’s body, so `x` there always means the global.',
      },
      {
        t: 'A compile error',
        why: 'Shadowing an outer `x` in an inner block is allowed. Only a second declaration in the *same* scope is an error.',
      },
    ],
  },
  {
    q: 'The resolver recorded distance 2 for a variable. What does the interpreter do?',
    options: [
      {
        t: 'Searches up to 2 environments for the name',
        why: 'There is no search: it goes straight to the environment exactly 2 parents up.',
      },
      {
        t: 'Reads the 2nd variable of the current environment',
        why: 'The distance counts environments, not variables within one.',
      },
      {
        t: 'Looks in the globals',
        why: 'Globals have no entry at all. A recorded distance means a local.',
      },
      {
        t: 'Follows the parent link twice, then reads the name there',
        correct: true,
        why: '`getAt(2, name)` reads the name in `ancestor(2)`.',
      },
    ],
  },
  {
    q: 'In `for i in 0..3 { print i; }`, what distance does the resolver record for the `i` in `print i`?',
    options: [
      {
        t: '0',
        why: 'The innermost scope is the body’s own, which does not declare `i`.',
      },
      {
        t: '1',
        correct: true,
        why: 'The loop variable has its own scope just outside the body’s, and the interpreter makes the matching two environments on every pass.',
      },
      {
        t: 'None: loop variables are globals',
        why: 'A loop variable is local to the loop.',
      },
    ],
  },
  {
    q: 'Suppose the interpreter ran blocks without making a new environment, while the resolver still began a scope for each. What breaks?',
    options: [
      {
        t: 'Nothing: the distances still work',
        why: 'The resolver would count one more level than really exists inside every block.',
      },
      {
        t: 'Only globals break',
        why: 'Globals do not use distances at all, so they would be fine. Locals would break.',
      },
      {
        t: 'Distances that cross that block point one environment too far',
        correct: true,
        why: 'The two sides must create levels in exactly the same places, or every hop count past the mismatch is off by one.',
      },
      {
        t: 'The resolver reports an error',
        why: 'The resolver cannot see what the interpreter does. The mismatch would show up as wrong values at run time.',
      },
    ],
  },
  {
    q: 'Which of these is a compile error in Drip?',
    options: [
      {
        t: '`let a = 1; let a = 2;` at the top level',
        why: 'Globals are not tracked by the resolver, so redeclaring one is allowed and replaces the old value.',
      },
      {
        t: 'Calling a function with too many arguments',
        why: 'That is a runtime error: the resolver does not know what a name will hold.',
      },
      {
        t: 'Two `let b`s in the same block',
        correct: true,
        why: '`\'b\' is already declared in this scope`.',
      },
      {
        t: 'Adding a string to a number',
        why: 'A runtime error, found when the `+` runs.',
      },
    ],
  },
  {
    q: 'Why is the resolver’s checking called *static* analysis?',
    options: [
      {
        t: 'It works from the syntax tree without running the program',
        correct: true,
        why: '“Static” means “without running”. The resolver only reads the tree.',
      },
      {
        t: 'It runs once per function call',
        why: 'It runs once for the whole program, before any call.',
      },
      {
        t: 'It only handles global variables',
        why: 'It deliberately ignores globals and handles locals.',
      },
    ],
  },
  {
    q: `What does this program print?
\`\`\`
print "start";
return 1;
\`\`\``,
    options: [
      {
        t: '`start`, then an error',
        why: 'The error is found before the program starts, so the first line never runs.',
      },
      {
        t: 'Only `line 2: \'return\' outside a function`',
        correct: true,
        why: 'A compile error stops the program before it starts: nothing is printed.',
      },
      {
        t: '`start`',
        why: 'A top-level `return` is not allowed; it is a compile error.',
      },
    ],
  },
  {
    q: 'A program has three mistakes the resolver can catch. What does Drip report?',
    options: [
      {
        t: 'Only the first one',
        why: 'The resolver reports each and carries on walking.',
      },
      {
        t: 'All three, in source order, each as `line N: message`',
        correct: true,
        why: 'Every compile error is listed, then the program stops with exit code 65.',
      },
      {
        t: 'All three, then it runs the program anyway',
        why: 'Any compile error means nothing runs.',
      },
    ],
  },
  {
    q: 'Inside `while x { fn g() { break; } }`, why is the `break` an error?',
    options: [
      {
        t: 'Functions cannot be declared inside loops',
        why: 'They can; only the `break` is a problem.',
      },
      {
        t: '`break` needs a semicolon after the brace',
        why: 'It has one; the rule is about where it sits.',
      },
      {
        t: 'A function body starts with no loops around it, because it runs in a call of its own',
        correct: true,
        why: 'The resolver resets `loopDepth` to 0 for a function: the `break` would run inside `g`, not inside the loop.',
      },
    ],
  },
];
