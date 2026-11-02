// Chapter 106 (second half: the host stack) cards. Keys are stable ids.

export const prompts = {
  'host-stack-what': {
    q: 'What is the *host stack* of an interpreter?',
    a: 'The call stack of the language the interpreter is written in (for Drip’s tree-walker, TypeScript’s).',
  },
  'where-waiting': {
    q: 'While `fib(3)` waits for `fib(2)`, where is the record of where `fib(3)` will carry on?',
    a: 'On TypeScript’s stack: the `evaluate` for its addition has simply not returned yet.',
  },
  'six-per-level': {
    q: 'Roughly how many TypeScript methods does each level of `fib` recursion add to the host stack?',
    a: 'Six (callFunction, executeBlock, execute, two evaluates and call).',
  },
  'trace-order': {
    q: 'In what order does a Drip stack trace list the active calls?',
    a: 'Innermost first, ending with `script`.',
  },
  'frames-what': {
    q: 'What does each entry of the interpreter’s `frames` list hold?',
    a: 'A place (`fn name`, `anonymous fn` or `script`) and a line.',
  },
  'not-popped': {
    q: 'Why does `frames` still hold the failing calls when `drip.ts` prints a trace?',
    a: 'A runtime error is thrown past the `pop` in `callFunction`, so nothing removes their entries.',
  },
  'frames-max': {
    q: 'How many calls may be active at once in Drip, and what happens with one more?',
    a: '256 (the script counts as one); one more is the runtime error `stack overflow`.',
  },
  'borrow-cost': {
    q: 'Name the three costs of borrowing the host stack.',
    a: 'Depth (several host frames per Drip call), visibility (Drip cannot pause or inspect its calls) and speed.',
  },
};

export const examples = {
  overflow: {
    title: 'Running out of stack',
    lang: 'drip',
    expectError: true,
    code: `fn down(n) {
  return down(n + 1);
}

print "going down";
down(0);
print "never printed";`,
  },
};

export const exercises = {
  formatTrace: {
    title: 'Print a stack trace',
    prompt: `Write \`formatTrace(msg, fs, errLine)\`, the printing half of \`drip.ts\`. \`fs\` is the interpreter's \`frames\` list of active calls, **outermost first**: objects \`{ place, line }\`, where \`line\` is the line each call is waiting on. \`errLine\` is the line the error happened on. Return an array of strings: first \`'runtime error: '\` plus \`msg\`, then one \`'  at line N in PLACE'\` (two spaces first) per frame, **innermost first**. The innermost frame uses \`errLine\`; every other frame uses its own \`line\`.`,
    starter: `function formatTrace(msg, fs, errLine) {
  // your code here
}

console.log(formatTrace('oops', [
  { place: 'script', line: 7 },
  { place: 'fn area', line: 0 },
], 2));`,
    solution: `function formatTrace(msg, fs, errLine) {
  const out = ['runtime error: ' + msg];
  const top = fs.length - 1;
  for (let i = top; i >= 0; i--) {
    const line = i === top
      ? errLine : fs[i].line;
    const at = fs[i].place;
    out.push(
      \`  at line \${line} in \${at}\`);
  }
  return out;
}`,
    tests: `test('only the script', () => {
  expect(formatTrace('stack overflow', [{ place: 'script', line: 0 }], 4))
    .toEqual(['runtime error: stack overflow', '  at line 4 in script']);
});
test('three calls, innermost first', () => {
  const fs = [
    { place: 'script', line: 7 },
    { place: 'fn report', line: 5 },
    { place: 'fn area', line: 0 },
  ];
  expect(formatTrace('bad', fs, 2)).toEqual([
    'runtime error: bad',
    '  at line 2 in fn area',
    '  at line 5 in fn report',
    '  at line 7 in script',
  ]);
});
test('the innermost line comes from the error', () => {
  const fs = [{ place: 'script', line: 3 }, { place: 'anonymous fn', line: 99 }];
  expect(formatTrace('x', fs, 1)[1]).toBe('  at line 1 in anonymous fn');
});
test('the frames list is not changed', () => {
  const fs = [{ place: 'script', line: 3 }, { place: 'fn f', line: 0 }];
  formatTrace('x', fs, 1);
  expect(fs.length).toBe(2);
  expect(fs[1].line).toBe(0);
});`,
    hints: [
      'Start the result with the message line, then add one line per frame. Which end of `fs` is the innermost call?',
      'Walk the array backwards: `for (let i = fs.length - 1; i >= 0; i--)`.',
      'Inside the loop, choose the line: `errLine` when `i` is the last index, otherwise `fs[i].line`. Then push a template literal built from that line and `fs[i].place`.',
    ],
    walkthrough: `**How to think about it.** Picture the trace you want for \`area\` called from \`report\` called from the script: the error line first, then \`area\`, then \`report\`, then \`script\`. The \`frames\` list is in the opposite order (the script is pushed first), so the loop must walk it backwards. One line number is special: the innermost call was not waiting on a call at all; it was running, and the line it reached is the one the error remembers, \`errLine\`.

**The solution, line by line.**

- \`function formatTrace(msg, fs, errLine) {\` takes the message, the frames and the error's line.
- \`  const out = ['runtime error: ' + msg];\` starts the result with the first line of every Drip runtime error.
- \`  const top = fs.length - 1;\` is the index of the innermost call, the last one pushed.
- \`  for (let i = top; i >= 0; i--) {\` walks from the innermost call out to the script.
- \`    const line = i === top ? errLine : fs[i].line;\` (over two lines) picks the error's line for the innermost frame and the waiting line for the rest. In the real interpreter the innermost entry's own \`line\` is still 0, because it never made a call, so using it would print \`at line 0\`.
- \`    const at = fs[i].place;\` is \`fn area\`, \`anonymous fn\` or \`script\`.
- \`    out.push(...)\` (over two lines) adds \`  at line N in PLACE\`, with its two leading spaces.
- \`  }\` ends the loop, and \`  return out;\` hands back the lines.

**Common wrong attempts.**

- Walking forwards (\`for (const f of fs)\`): the trace comes out outermost first, with \`script\` at the top.
- Using \`fs[i].line\` for every frame: the innermost line comes out as whatever was stored there (0 in the interpreter), not the line of the error.
- Calling \`fs.reverse()\` to get the order right: it works for the output but turns the caller's list round in place, which the last test catches; walk backwards instead, or copy first.`,
    wrong: [
      {
        code: `function formatTrace(msg, fs, errLine) {
  const out = ['runtime error: ' + msg];
  for (const f of fs) {
    const at = f.place;
    out.push(
      \`  at line \${f.line} in \${at}\`);
  }
  return out;
}`,
        why: 'This lists the frames outermost first, and uses the stored line even for the innermost call instead of `errLine`.',
      },
      {
        code: `function formatTrace(msg, fs, errLine) {
  const out = ['runtime error: ' + msg];
  const rev = fs.reverse();
  rev.forEach((f, i) => {
    const line = i === 0
      ? errLine : f.line;
    const at = f.place;
    out.push(
      \`  at line \${line} in \${at}\`);
  });
  return out;
}`,
        why: '`reverse()` turns the caller’s list round in place, so the list is changed after the call. Walk it backwards instead.',
      },
    ],
  },
  countdown: {
    optional: true,
    lang: 'drip',
    title: 'Stop the runaway',
    prompt:
      'This countdown never stops: it prints 3, 2, 1, 0, -1, ... until Drip reports `stack overflow`. Add a base case so that it prints `3`, `2`, `1` and then `liftoff`.',
    starter: `fn countdown(n) {
  print n;
  countdown(n - 1);
}

countdown(3);`,
    solution: `fn countdown(n) {
  if n == 0 {
    print "liftoff";
    return;
  }
  print n;
  countdown(n - 1);
}

countdown(3);`,
    tests: `3
2
1
liftoff`,
    hints: [
      'Every recursion needs a case where it stops calling itself. Which value of `n` should stop it?',
      'When `n` is 0, print `liftoff` and leave the function without calling `countdown` again.',
      'At the top of the body: `if n == 0 { print "liftoff"; return; }`.',
    ],
    walkthrough: `**How to think about it.** Each call of \`countdown\` makes one more call, so the calls nest deeper and deeper; nothing ever returns, and at 256 active calls Drip stops with \`stack overflow\` (that is \`FRAMES_MAX\` at work). A base case is a value for which the function answers without calling itself, and here it is the moment the count reaches 0.

**The solution, line by line.**

- \`fn countdown(n) {\` is unchanged.
- \`  if n == 0 {\` checks for the base case first, before printing or recursing.
- \`    print "liftoff";\` prints the last line.
- \`    return;\` leaves the call at once (a bare \`return\` gives \`none\`), so the lines below never run for 0, and no deeper call is made.
- \`  }\` closes the \`if\`.
- \`  print n;\` and \`  countdown(n - 1);\` run for 3, 2 and 1, as before.
- \`}\` and \`countdown(3);\` are unchanged. At the deepest point there are only five active calls: the script and \`countdown\` with 3, 2, 1 and 0.

**Common wrong attempts.**

- Putting the check after \`print n;\`: then 0 is printed before \`liftoff\`.
- Printing \`liftoff\` but forgetting the \`return\`: the call carries on to \`countdown(-1)\`, and the runaway starts again.`,
    wrong: [
      {
        code: `fn countdown(n) {
  print n;
  if n == 0 {
    print "liftoff";
    return;
  }
  countdown(n - 1);
}

countdown(3);`,
        why: 'The check comes after `print n;`, so `0` is printed before `liftoff`.',
      },
      {
        code: `fn countdown(n) {
  if n == 0 {
    print "liftoff";
  }
  print n;
  countdown(n - 1);
}

countdown(3);`,
        why: 'Without `return`, the call carries on past `liftoff` and recurses for ever, until `stack overflow`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the tree-walker, where is the record that a paused Drip call will carry on at its addition?',
    options: [
      { t: 'In the interpreter’s `frames` list', why: '`frames` holds only a place and a line per call, for stack traces; it cannot resume anything.' },
      { t: 'On TypeScript’s own call stack', correct: true, why: 'The TypeScript `evaluate` for that addition has not returned yet; when its call comes back, TypeScript knows where it was.' },
      { t: 'In the call’s `Environment`', why: 'Environments hold variables, not where a call will carry on.' },
    ],
  },
  {
    q: `What is the last line of this program’s error?
\`\`\`
fn f() {
  print 1 + none;
}
fn g() { f(); }
g();
\`\`\``,
    options: [
      { t: '`  at line 5 in script`', correct: true, why: 'The trace lists the innermost call first and ends with the script, waiting on its call of `g` on line 5.' },
      { t: '`  at line 2 in fn f`', why: 'That is the first `at` line, for the innermost call. The script comes last.' },
      { t: '`  at line 4 in fn g`', why: 'That is the middle line: `g` waiting on its call of `f`.' },
    ],
  },
  {
    q: 'Why does `isEven(300)` stop with `stack overflow`, while `isEven(10)` works?',
    options: [
      { t: 'Mutual recursion is not allowed in Drip', why: 'It works: `isEven(10)` runs fine.' },
      { t: '300 is too large a number for Drip', why: 'Numbers are fine; the problem is how deep the calls nest.' },
      { t: 'It needs about 300 active calls, more than Drip’s limit of 256', correct: true, why: '`FRAMES_MAX` is 256 (the script counts as one), and `callFunction` refuses to go deeper.' },
    ],
  },
  {
    q: 'What does `drip.ts` do when JavaScript itself runs out of stack and throws a `RangeError`?',
    options: [
      { t: 'It lets the JavaScript error crash the program', why: 'It catches the RangeError so the reader sees Drip’s own message.' },
      { t: 'It reports Drip’s own `stack overflow` error, with a trace', correct: true, why: 'It makes a RuntimeError with the message `stack overflow` at the innermost call’s line, and prints the usual trace.' },
      { t: 'It retries the program with a bigger stack', why: 'Nothing is retried; the program stops with an error.' },
    ],
  },
  {
    q: 'Which of these is something the tree-walker CANNOT easily do, because it borrows the host stack?',
    options: [
      { t: 'Run mutually recursive functions', why: 'That works with no extra code, because calls are ordinary host calls.' },
      { t: 'Print a stack trace', why: 'The small `frames` list is enough for that.' },
      { t: 'Pause a Drip program half-way and resume it later', correct: true, why: 'The real state of each paused call is in TypeScript’s frames, which Drip cannot save or restore.' },
    ],
  },
];
