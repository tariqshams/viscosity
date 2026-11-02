// Chapter 110 (second half: static analysis) cards. Keys are stable ids.

export const prompts = {
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

const msg = `const msg = (s) =>
  \`line \${s.line}: '\${s.kind}'\` +
  ' outside a loop';
`;

export const exercises = {
  checkLoops: {
    title: 'break outside a loop',
    prompt: `Write the resolver's loop check for a tiny tree. A statement is one of:

- \`{ kind: 'break', line }\` or \`{ kind: 'continue', line }\`,
- \`{ kind: 'while', body }\` (a loop), \`{ kind: 'fn', body }\` (a function declaration) or \`{ kind: 'block', body }\`, where \`body\` is an array of statements,
- \`{ kind: 'print' }\`, which contains nothing.

\`checkLoops(stmts)\` returns an array of error messages, in source order, one for each \`break\` or \`continue\` that is not inside a loop, built with the given helper \`msg(s)\` (it gives \`line 3: 'break' outside a loop\`). Like Drip, a function body starts outside any loop, even when the function is declared inside one.`,
    starter: `${msg}
function checkLoops(stmts) {
  // your code here
  return [];
}`,
    solution: `${msg}
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
        code: `${msg}
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
        code: `${msg}
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
    prompt:
      'This Drip program is rejected before it runs. Make it print `copy of outer` and then `outer`, without changing the outer `let a`.',
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
    q: 'Which of these is a compile error in Drip?',
    options: [
      { t: '`let a = 1; let a = 2;` at the top level', why: 'Globals are not tracked by the resolver, so redeclaring one is allowed and replaces the old value.' },
      { t: 'Calling a function with too many arguments', why: 'That is a runtime error: the resolver does not know what a name will hold.' },
      { t: 'Two `let b`s in the same block', correct: true, why: "`'b' is already declared in this scope`." },
      { t: 'Adding a string to a number', why: 'A runtime error, found when the `+` runs.' },
    ],
  },
  {
    q: 'Why is the resolver’s checking called *static* analysis?',
    options: [
      { t: 'It works from the syntax tree without running the program', correct: true, why: '“Static” means “without running”. The resolver only reads the tree.' },
      { t: 'It runs once per function call', why: 'It runs once for the whole program, before any call.' },
      { t: 'It only handles global variables', why: 'It deliberately ignores globals and handles locals.' },
    ],
  },
  {
    q: `What does this program print?
\`\`\`
print "start";
return 1;
\`\`\``,
    options: [
      { t: '`start`, then an error', why: 'The error is found before the program starts, so the first line never runs.' },
      { t: "Only `line 2: 'return' outside a function`", correct: true, why: 'A compile error stops the program before it starts: nothing is printed.' },
      { t: '`start`', why: 'A top-level `return` is not allowed; it is a compile error.' },
    ],
  },
  {
    q: 'A program has three mistakes the resolver can catch. What does Drip report?',
    options: [
      { t: 'Only the first one', why: 'The resolver reports each and carries on walking.' },
      { t: 'All three, in source order, each as `line N: message`', correct: true, why: 'Every compile error is listed, then the program stops with exit code 65.' },
      { t: 'All three, then it runs the program anyway', why: 'Any compile error means nothing runs.' },
    ],
  },
  {
    q: 'Inside `while x { fn g() { break; } }`, why is the `break` an error?',
    options: [
      { t: 'Functions cannot be declared inside loops', why: 'They can; only the `break` is a problem.' },
      { t: '`break` needs a semicolon after the brace', why: 'It has one; the rule is about where it sits.' },
      { t: 'A function body starts with no loops around it, because it runs in a call of its own', correct: true, why: 'The resolver resets `loopDepth` to 0 for a function: the `break` would run inside `g`, not inside the loop.' },
    ],
  },
];
