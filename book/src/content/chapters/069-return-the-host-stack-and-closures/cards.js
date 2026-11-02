// Chapter 60 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 69, 69, 69, 69.

export const prompts = {
  'return-deep': {
    q: 'When a `return` inside an `if` inside a `while` runs, what does it have to leave?',
    a: 'Every statement between it and the start of the call: the `if`, the loop body, the loop and the function body, all in one move.',
  },
  'two-ways': {
    q: 'Name the two common ways a tree-walker implements `return`.',
    a: 'Completion codes passed back up by every method, or an exception thrown at the `return` and caught at the edge of the call.',
  },
  'four-codes': {
    q: 'What are the four completion codes in the companion’s interpreter?',
    a: '`NORMAL`, `BREAK`, `CONTINUE` and `RETURN`.',
  },
  'parked-where': {
    q: 'Where does a `return` statement put its value while the `RETURN` code travels up?',
    a: 'In a field of the interpreter, `returnValue`, until `callFunction` takes it out.',
  },
  'block-passes': {
    q: 'What does `executeBlock` do when one of its statements gives back `RETURN`?',
    a: 'It stops running its statements and returns `RETURN` itself (its `finally` restores the environment).',
  },
  'loop-return': {
    q: 'A loop’s body gives back `BREAK`, and later another gives back `RETURN`. What does the loop do with each?',
    a: 'On `BREAK` it stops looping and finishes normally; on `RETURN` it stops and passes `RETURN` up.',
  },
  'own-call': {
    q: 'In `fib(3)`, does the `RETURN` code from inside `fib(2)` ever reach `fib(3)`’s methods?',
    a: 'No. `fib(2)`’s own `callFunction` turns it into a value; `fib(3)` only sees the number.',
  },
  'return-none': {
    q: 'What does a Drip call give back when its body has no `return`, or a bare `return;`?',
    a: '`none`.',
  },
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
  'call-parent-question': {
    q: 'A call makes a fresh environment. What is the key design question about it, for closures?',
    a: 'Which environment should be its parent: the globals, the caller’s, or the one where the function was made.',
  },
  'parent-globals': {
    q: 'If every call’s environment had the globals as its parent, what would `count` inside `makeCounter` see?',
    a: 'Not `n`: the lookup would go from the call straight to the globals, giving `undefined variable \'n\'`.',
  },
  'parent-caller': {
    q: 'What is the rule called where a call’s parent is the *caller’s* environment, and does Drip use it?',
    a: 'Dynamic scope. Drip does not use it; it uses lexical scope.',
  },
  'closure-field': {
    q: 'What does the `closure` field of a `DripFunction` hold?',
    a: 'The environment that was current when the function value was made.',
  },
  'which-env': {
    q: 'When `count` is declared inside a call of `makeCounter`, which environment does it capture?',
    a: 'That call’s environment (holding `n`), because it is the current one when the declaration runs.',
  },
  'variable-not-value': {
    q: '`let x = 1; let f = fn () { print x; }; x = 2; f();` What is printed, and why?',
    a: '`2`. A closure captures the variable itself, so it reads its current value.',
  },
  'loop-fresh': {
    q: 'Why do functions made in a Drip `for` loop remember different values of the loop variable?',
    a: 'Each pass makes a brand-new environment holding that pass’s value, and each function captures its own pass’s.',
  },
  'while-shared': {
    q: 'Why do functions made in a `while` loop all see the same counter?',
    a: 'The counter is one variable declared outside the loop, so every function’s chain leads to it.',
  },
  'heap-why': {
    q: 'Why is a Drip call’s environment on the heap rather than in the call’s TypeScript frame?',
    a: 'It is made with `new Environment(...)`, and JavaScript objects made with `new` live on the heap; the frame only holds a reference.',
  },
  'gc-what': {
    q: 'When may JavaScript’s garbage collector reclaim an object?',
    a: 'Once the program can no longer reach it by following references.',
  },
  outlives: {
    q: 'Can a Drip environment outlive the call that created it? Give an example.',
    a: 'Yes: when the call returns a function made inside it, that function’s closure keeps the call’s environment alive.',
  },
  'host-frame': {
    q: 'When `makeCounter` returns, what disappears and what stays?',
    a: 'Its TypeScript frames on the host stack disappear; its environment (a heap object) stays while the closure refers to it.',
  },
  'what-keeps': {
    q: 'Name three things that can keep a Drip environment alive.',
    a: 'A running call, a child environment (through its parent link), and a function’s captured environment.',
  },
  'live-shared': {
    q: 'Two functions made in the same call both use `v`. One assigns `v = 5`. What does the other see?',
    a: '`5`. They captured the same environment, so they share the variable.',
  },
  'reclaimed-when': {
    q: 'After `let a = makeCounter(); a = none;`, can the counter’s environment be reclaimed?',
    a: 'Yes: nothing refers to the function any more, so nothing reaches its captured environment.',
  },
  'call-allocates': {
    q: 'What does every Drip function call allocate in the tree-walker, even when no closure needs it?',
    a: 'A new `Environment` object, with a new `Map` inside it.',
  },
};

export const examples = {
  pair: {
    title: 'Leaving two loops at once',
    lang: 'drip',
    code: `fn pair(xs, target) {
  for a in xs {
    for b in xs {
      if a + b == target {
        return [a, b];
      }
    }
  }
}

print pair([1, 5, 9], 14);
print pair([1, 5, 9], 100);`,
  },
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
  'two-counters': {
    title: 'Two counters, two n’s',
    lang: 'drip',
    code: `fn makeCounter() {
  let n = 0;
  return fn () {
    n += 1;
    return n;
  };
}

let a = makeCounter();
let b = makeCounter();
print a();
print a();
print b();
print a;`,
  },
  'shared-box': {
    title: 'Two closures, one environment',
    lang: 'drip',
    code: `fn makeBox(v) {
  let get = fn () { return v; };
  let set = fn (x) { v = x; };
  return [get, set];
}

let box = makeBox("old");
print box[0]();
box[1]("new");
print box[0]();`,
  },
};

export const exercises = {
  callFn: {
    title: 'Pass the code up',
    prompt: `\`exec(s, st, log)\` (given) runs one statement of a tiny language and returns a completion code, exactly like Drip's \`execute\`: a \`log\` statement pushes its text onto \`log\` and gives \`NORMAL\`; a \`return\` parks its value in \`st.ret\` and gives \`RETURN\`; an \`if\` whose \`test\` is true runs its \`body\` with \`execBlock\`. Write the two missing methods.

- \`execBlock(stmts, st, log)\` runs the statements in order and stops as soon as one gives back something other than \`NORMAL\`, returning that code; if all finish normally, it returns \`NORMAL\`.
- \`callFn(body, log)\` makes a fresh state \`{ ret: null }\`, runs \`body\` with \`execBlock\`, and returns the parked value if the body gave \`RETURN\`, or \`null\` otherwise.`,
    starter: `const NORMAL = 0;
const RETURN = 3;

// st.ret plays the part of returnValue.
function exec(s, st, log) {
  if (s.kind === 'log') {
    log.push(s.text);
    return NORMAL;
  }
  if (s.kind === 'return') {
    st.ret = s.value;
    return RETURN;
  }
  if (s.kind === 'if') {
    if (!s.test) return NORMAL;
    return execBlock(s.body, st, log);
  }
  throw new Error('unknown ' + s.kind);
}

function execBlock(stmts, st, log) {
  // your code here
}

function callFn(body, log) {
  // your code here
}`,
    solution: `const NORMAL = 0;
const RETURN = 3;

// st.ret plays the part of returnValue.
function exec(s, st, log) {
  if (s.kind === 'log') {
    log.push(s.text);
    return NORMAL;
  }
  if (s.kind === 'return') {
    st.ret = s.value;
    return RETURN;
  }
  if (s.kind === 'if') {
    if (!s.test) return NORMAL;
    return execBlock(s.body, st, log);
  }
  throw new Error('unknown ' + s.kind);
}

function execBlock(stmts, st, log) {
  for (const s of stmts) {
    const c = exec(s, st, log);
    if (c !== NORMAL) return c;
  }
  return NORMAL;
}

function callFn(body, log) {
  const st = { ret: null };
  const c = execBlock(body, st, log);
  if (c === RETURN) return st.ret;
  return null;
}`,
    tests: `const L = (text) => ({ kind: 'log', text });
const R = (value) => ({ kind: 'return', value });
const If = (test, ...body) => ({ kind: 'if', test, body });
test('returns the value', () => {
  expect(callFn([L('a'), R(7)], [])).toBe(7);
});
test('no return gives null', () => {
  expect(callFn([L('a')], [])).toBe(null);
});
test('stops at the return', () => {
  const log = [];
  callFn([L('a'), R(1), L('b')], log);
  expect(log).toEqual(['a']);
});
test('returns from deep inside', () => {
  const log = [];
  const body = [If(true, If(true, L('x'), R(5), L('y'))), L('z')];
  expect(callFn(body, log)).toBe(5);
  expect(log).toEqual(['x']);
});
test('a false if is skipped', () => {
  const log = [];
  expect(callFn([If(false, R(1)), L('b'), R(2)], log)).toBe(2);
  expect(log).toEqual(['b']);
});
test('falsy values come back intact', () => {
  expect(callFn([R(0)], [])).toBe(0);
  expect(callFn([R(false)], [])).toBe(false);
});`,
    hints: [
      '`execBlock` is a loop over the statements. What should it do with the code each `exec` gives back?',
      'Keep going while the code is `NORMAL`; the moment it is anything else, return that same code. After the loop, return `NORMAL`.',
      '`callFn` makes `const st = { ret: null };`, gets `const c = execBlock(body, st, log);`, and returns `st.ret` when `c === RETURN`, else `null`.',
    ],
    walkthrough: `**How to think about it.** This is \`executeBlock\` and the end of \`callFunction\` from the companion's interpreter, in miniature. A \`return\` has already done its half of the job: it parked its value in \`st.ret\` and handed back \`RETURN\`. Your half is to carry that code up through every block, without running another statement, and to turn it back into a value at the edge of the call. Notice that \`exec\` for an \`if\` calls your \`execBlock\`, and your \`execBlock\` calls \`exec\`: the two take turns going deeper, which is exactly how nested blocks work in the real interpreter.

**The solution, line by line.**

- \`function execBlock(stmts, st, log) {\` runs a list of statements.
- \`  for (const s of stmts) {\` visits them in order.
- \`    const c = exec(s, st, log);\` runs one and keeps its completion code.
- \`    if (c !== NORMAL) return c;\` is the whole trick: anything other than \`NORMAL\` means "stop what you are doing and tell your caller", so the block stops (no later statement runs, which is why \`'y'\` and \`'z'\` are never logged in the fourth test) and passes the same code up.
- \`  }\` ends the loop.
- \`  return NORMAL;\` is reached only when every statement finished normally.
- \`function callFn(body, log) {\` is the call.
- \`  const st = { ret: null };\` is a fresh state for this call, so nothing parked by an earlier call can leak in.
- \`  const c = execBlock(body, st, log);\` runs the body.
- \`  if (c === RETURN) return st.ret;\` takes the parked value when the body ended with a \`return\`, however deep it was.
- \`  return null;\` covers a body that ran off its end: Drip's \`none\`.

**Common wrong attempts.**

- Running every statement and ignoring the codes: the \`return\` parks its value, but the block keeps going and logs \`'b'\` after it, so "stops at the return" fails.
- Checking \`if (c === RETURN) return c;\` but forgetting \`return NORMAL;\` at the end of \`execBlock\`: the function then gives \`undefined\` for a normal block, which is not \`NORMAL\`, so an \`if\` that finished normally looks like a way out and stops its caller early.
- Returning \`st.ret || null\` in \`callFn\`: a function may return \`0\` or \`false\`, and \`||\` would turn them into \`null\`.`,
    wrong: [
      {
        code: `const NORMAL = 0;
const RETURN = 3;

// st.ret plays the part of returnValue.
function exec(s, st, log) {
  if (s.kind === 'log') {
    log.push(s.text);
    return NORMAL;
  }
  if (s.kind === 'return') {
    st.ret = s.value;
    return RETURN;
  }
  if (s.kind === 'if') {
    if (!s.test) return NORMAL;
    return execBlock(s.body, st, log);
  }
  throw new Error('unknown ' + s.kind);
}

function execBlock(stmts, st, log) {
  for (const s of stmts) {
    exec(s, st, log);
  }
  return NORMAL;
}

function callFn(body, log) {
  const st = { ret: null };
  execBlock(body, st, log);
  return st.ret;
}`,
        why: 'The codes are ignored, so statements after a `return` still run: `\'b\'` is logged after `return 1`. Stop as soon as a code is not `NORMAL`.',
      },
      {
        code: `const NORMAL = 0;
const RETURN = 3;

// st.ret plays the part of returnValue.
function exec(s, st, log) {
  if (s.kind === 'log') {
    log.push(s.text);
    return NORMAL;
  }
  if (s.kind === 'return') {
    st.ret = s.value;
    return RETURN;
  }
  if (s.kind === 'if') {
    if (!s.test) return NORMAL;
    return execBlock(s.body, st, log);
  }
  throw new Error('unknown ' + s.kind);
}

function execBlock(stmts, st, log) {
  for (const s of stmts) {
    const c = exec(s, st, log);
    if (c !== NORMAL) return c;
  }
  return NORMAL;
}

function callFn(body, log) {
  const st = { ret: null };
  const c = execBlock(body, st, log);
  if (c === RETURN) {
    return st.ret || null;
  }
  return null;
}`,
        why: '`st.ret || null` turns a returned `0` or `false` into `null`. Return the parked value as it is.',
      },
    ],
  },
  power: {
    optional: true,
    lang: 'drip',
    title: 'A recursive power function',
    prompt: 'Write a recursive Drip function `pow(b, e)` that **returns** `b` to the power `e`, for whole numbers `e >= 0`. Use the facts that `pow(b, 0)` is 1 and `pow(b, e)` is `b * pow(b, e - 1)`. The program should print `1024`, `81` and `1`.',
    starter: `fn pow(b, e) {
  # your code here
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
    solution: `fn pow(b, e) {
  if e == 0 {
    return 1;
  }
  return b * pow(b, e - 1);
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
    tests: `1024
81
1`,
    hints: [
      'Start with the case that needs no recursion: what is anything to the power 0?',
      'If `e == 0`, return 1. Otherwise the answer is `b` times a smaller power.',
      'The last line of the body is `return b * pow(b, e - 1);`.',
    ],
    walkthrough: `**How to think about it.** A recursive function needs a case it can answer straight away (the *base case*) and a rule that turns a bigger problem into a smaller one. Here the base case is \`e == 0\`, whose answer is 1, and the rule is \`b * pow(b, e - 1)\`, which makes \`e\` one smaller each time, so it always reaches 0 for a whole number \`e >= 0\`.

**The solution, line by line.**

- \`fn pow(b, e) {\` declares the function with two parameters.
- \`  if e == 0 {\` checks for the base case.
- \`    return 1;\` parks 1 and gives back \`RETURN\`, which leaves the \`if\` and the body at once; the line after the \`if\` does not run.
- \`  }\` closes the \`if\`.
- \`  return b * pow(b, e - 1);\` is reached only when \`e\` is not 0. It evaluates the call first: \`pow(2, 10)\` waits for \`pow(2, 9)\`, which waits for \`pow(2, 8)\`, down to \`pow(2, 0)\`, eleven calls in all, each with its own environment. Then the values come back up: 1, then 2, 4, 8, ... 1024. Each call's \`return\` finds its own \`callFunction\`.
- \`}\` ends the function.

**Common wrong attempts.**

- Printing instead of returning on the last line (\`print b * pow(b, e - 1);\`): the call then gives back \`none\`, so the call above it tries \`2 * none\` and stops with \`cannot use '*' on a number and none\`.
- Leaving out the base case: \`e\` goes 0, -1, -2, ... for ever, until Drip stops with \`stack overflow\` (the next chapter is about that limit).`,
    wrong: [
      {
        code: `fn pow(b, e) {
  if e == 0 {
    return 1;
  }
  print b * pow(b, e - 1);
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
        why: 'The last line prints instead of returning, so each call gives `none`, and the call above it fails: `cannot use \'*\' on a number and none`.',
      },
      {
        code: `fn pow(b, e) {
  return b * pow(b, e - 1);
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
        why: 'There is no base case, so the calls never stop going deeper, and Drip stops with `stack overflow`.',
      },
    ],
  },
  formatTrace: {
    title: 'Print a stack trace',
    prompt: 'Write `formatTrace(msg, fs, errLine)`, the printing half of `drip.ts`. `fs` is the interpreter\'s `frames` list of active calls, **outermost first**: objects `{ place, line }`, where `line` is the line each call is waiting on. `errLine` is the line the error happened on. Return an array of strings: first `\'runtime error: \'` plus `msg`, then one `\'  at line N in PLACE\'` (two spaces first) per frame, **innermost first**. The innermost frame uses `errLine`; every other frame uses its own `line`.',
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
    prompt: 'This countdown never stops: it prints 3, 2, 1, 0, -1, ... until Drip reports `stack overflow`. Add a base case so that it prints `3`, `2`, `1` and then `liftoff`.',
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
  fixLoop: {
    lang: 'drip',
    title: 'One value each',
    prompt: 'This program saves three functions from a `while` loop, but every one prints `4`. Change the loop so that the three calls at the end print `1`, `2` and `3`. Keep the three calls at the end as they are.',
    starter: `let fs = [];
let i = 1;
while i < 4 {
  push(fs, fn () { print i; });
  i += 1;
}

fs[0]();
fs[1]();
fs[2]();`,
    solution: `let fs = [];
for i in 1..4 {
  push(fs, fn () { print i; });
}

fs[0]();
fs[1]();
fs[2]();`,
    tests: `1
2
3`,
    hints: [
      'All three functions capture environments that lead to the same `i`. What value has it reached when they are finally called?',
      'You need a fresh variable for every pass. Which Drip loop makes one for you?',
      'Replace the `while` (and the `let i` and `i += 1`) with `for i in 1..4 { push(fs, fn () { print i; }); }`.',
    ],
    walkthrough: `**How to think about it.** Ask what each saved function will look up when it finally runs. All three were made in the loop body, whose environments all have the same parent chain out to the one global \`i\`. The functions do not run until the loop is over, and by then \`i\` is 4, so each looks up \`i\` and finds 4. To get 1, 2 and 3, each function needs its *own* variable, made fresh on each pass, and a Drip \`for\` loop does exactly that.

**The solution, line by line.**

- \`let fs = [];\` makes the list that will hold the functions.
- \`for i in 1..4 {\` runs the body with \`i\` set to 1, 2 and 3. On each pass \`forLoop\` makes a new environment holding that pass's \`i\`, and a fresh body environment inside it.
- \`  push(fs, fn () { print i; });\` makes an anonymous function, which captures the current body environment (whose parent holds this pass's \`i\`), and pushes it onto the list.
- \`}\` ends the loop. Three function values now exist, each with a different captured chain.
- \`fs[0]();\`, \`fs[1]();\` and \`fs[2]();\` call them in turn. Each lookup of \`i\` goes from the call's environment to the captured body environment and then to its own pass's loop environment, finding 1, then 2, then 3.

(Another correct fix keeps the \`while\` and adds \`let mine = i;\` at the top of the body, capturing \`mine\` instead: the body gets a fresh environment on every pass, so each \`mine\` is a different variable.)

**Common wrong attempts.**

- Adding \`let mine = i;\` *before* the loop instead of inside its body: that is still one variable, shared by all three, and it holds 1, so all three print 1.
- Moving the \`i += 1;\` above the \`push\`: every function still shares the one \`i\`, which still ends at 4.`,
    wrong: [
      {
        code: `let fs = [];
let i = 1;
let mine = i;
while i < 4 {
  push(fs, fn () { print mine; });
  i += 1;
}

fs[0]();
fs[1]();
fs[2]();`,
        why: '`mine` is declared once, outside the loop, so all three share it, and it is 1: they print `1`, `1`, `1`.',
      },
      {
        code: `let fs = [];
let i = 1;
while i < 4 {
  i += 1;
  push(fs, fn () { print i; });
}

fs[0]();
fs[1]();
fs[2]();`,
        why: 'Still one shared `i`, which ends at 4 before any function runs, so all three print `4`.',
      },
    ],
  },
  accumulator: {
    optional: true,
    lang: 'drip',
    title: 'A running total',
    prompt: 'Write `fn makeTotal()` that returns an anonymous function taking one number, adding it to a running total kept in the closure, and returning the new total. Two totals made by separate calls must not share. The program must print `5`, `8`, `10` and `13`.',
    starter: `fn makeTotal() {
  # your code here
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
    solution: `fn makeTotal() {
  let sum = 0;
  return fn (x) {
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
    tests: `5
8
10
13`,
    hints: [
      'The total has to survive between calls of the returned function, so it cannot be a local of that function. Where else can it live?',
      'Declare `let sum = 0;` in `makeTotal`, then return an anonymous function that changes `sum`.',
      'The returned function is `fn (x) { sum += x; return sum; }`.',
    ],
    walkthrough: `**How to think about it.** A variable declared inside the returned function would be made fresh on every call and start from 0 each time. The total must live one level out, in the environment of the call of \`makeTotal\`, which the returned function captures. Each call of \`makeTotal\` makes a separate environment, so \`t\` and \`u\` get separate totals.

**The solution, line by line.**

- \`fn makeTotal() {\` declares the maker.
- \`  let sum = 0;\` makes the total in this call's environment.
- \`  return fn (x) {\` makes an anonymous function, which captures this call's environment, and returns it.
- \`    sum += x;\` finds \`sum\` one step out (in the captured environment) and adds the argument.
- \`    return sum;\` returns the new total.
- \`  };\` ends the anonymous function and the \`return\` statement, and \`}\` ends \`makeTotal\`.
- \`t(5)\` gives 5 and \`t(3)\` gives 8, because both change \`t\`'s \`sum\`; \`u(10)\` gives 10 from its own \`sum\`; and \`t(5)\` gives 13.

**Common wrong attempts.**

- Declaring \`let sum = 0;\` inside the anonymous function: every call starts again from 0, so the program prints 5, 3, 10, 5.
- Declaring \`sum\` as a global, outside \`makeTotal\`: then \`t\` and \`u\` share it, and \`u(10)\` prints 18.`,
    wrong: [
      {
        code: `fn makeTotal() {
  return fn (x) {
    let sum = 0;
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
        why: '`sum` is made fresh on every call, so nothing adds up: it prints `5`, `3`, `10`, `5`.',
      },
      {
        code: `let sum = 0;
fn makeTotal() {
  return fn (x) {
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
        why: 'One global `sum` is shared by `t` and `u`, so `u(10)` prints `18`.',
      },
    ],
  },
  liveEnvs: {
    title: 'Which environments are alive?',
    prompt: `Model the garbage collector's question in plain JavaScript. An environment is \`{ name, parent, vars }\`: \`parent\` is another environment or \`null\`, and \`vars\` is an array of the values it holds. A value is a number, a string, or a function \`{ closure }\` whose \`closure\` is an environment.

Write \`liveEnvs(roots)\`: given an array of root environments, return an array of the **names** of every environment reachable from them, in any order. From an environment you can reach its parent and every value in \`vars\`; from a function you can reach its \`closure\`. Each name appears once, and the function must finish even when an environment holds a function whose closure is that same environment (a cycle).`,
    starter: `function liveEnvs(roots) {
  // your code here
}`,
    solution: `function liveEnvs(roots) {
  const seen = new Set();
  const todo = [...roots];
  while (todo.length > 0) {
    const x = todo.pop();
    if (typeof x !== 'object') continue;
    if (x === null || seen.has(x)) {
      continue;
    }
    if ('closure' in x) {
      todo.push(x.closure);
      continue;
    }
    seen.add(x);
    todo.push(x.parent, ...x.vars);
  }
  return [...seen].map((e) => e.name);
}`,
    tests: `const env = (name, parent, vars = []) => ({ name, parent, vars });
const sorted = (xs) => [...xs].sort();
test('the globals alone', () => {
  const G = env('G', null);
  expect(sorted(liveEnvs([G]))).toEqual(['G']);
});
test('a closure keeps its call alive', () => {
  const G = env('G', null);
  const call = env('call', G, [0]);
  G.vars.push({ closure: call });
  expect(sorted(liveEnvs([G]))).toEqual(['G', 'call']);
});
test('drop the function and the call is gone', () => {
  const G = env('G', null);
  env('call', G, [0]);
  G.vars.push(5);
  expect(sorted(liveEnvs([G]))).toEqual(['G']);
});
test('a child reaches its whole chain', () => {
  const G = env('G', null);
  const A = env('A', G);
  const C = env('C', A);
  expect(sorted(liveEnvs([C]))).toEqual(['A', 'C', 'G']);
});
test('cycles finish, and names appear once', () => {
  const G = env('G', null);
  const call = env('call', G);
  const f = { closure: call };
  call.vars.push(f, f);
  G.vars.push(f);
  expect(sorted(liveEnvs([G, G]))).toEqual(['G', 'call']);
});`,
    hints: [
      'This is a walk over a graph: keep a list of things still to look at, and a set of environments already seen.',
      'Take one item at a time. Skip numbers, strings, `null` and anything already seen. A function sends you on to its `closure`; an environment is recorded, then its `parent` and all its `vars` go on the list.',
      'Use `const seen = new Set(); const todo = [...roots];` and a `while (todo.length > 0)` loop with `todo.pop()`; at the end, map the seen environments to their names.',
    ],
    walkthrough: `**How to think about it.** "Can the program still reach this environment?" is a question about following arrows: from the roots, along parent links, into the values an environment holds, and from functions to their captured environments. The usual way to follow arrows without getting lost is a to-do list plus a set of places already visited. The visited set matters because the arrows can go round in a circle: an environment holding a function whose closure is that same environment is exactly what \`makeCounter\` builds when its body declares \`count\`.

**The solution, line by line.**

- \`function liveEnvs(roots) {\` takes the root environments.
- \`  const seen = new Set();\` will hold every live environment, once each (a \`Set\` ignores repeats and compares objects by identity).
- \`  const todo = [...roots];\` copies the roots into a to-do list.
- \`  while (todo.length > 0) {\` keeps going until nothing is left to look at.
- \`    const x = todo.pop();\` takes one item.
- \`    if (typeof x !== 'object') continue;\` skips numbers and strings, which refer to nothing.
- \`    if (x === null || seen.has(x)) { continue; }\` skips the end of a parent chain (\`null\`, whose \`typeof\` is also \`'object'\`) and anything already visited, which is what stops cycles.
- \`    if ('closure' in x) { todo.push(x.closure); continue; }\` handles a function: it is not an environment itself, but it leads to one.
- \`    seen.add(x);\` records a live environment.
- \`    todo.push(x.parent, ...x.vars);\` queues its parent and every value it holds.
- \`  }\` ends the loop, and \`  return [...seen].map((e) => e.name);\` turns the set into an array of names.

This is, in miniature, the *mark* half of the mark-and-sweep collector that Part IV builds for the VM.

**Common wrong attempts.**

- A recursive walk with no visited set: on a cycle it goes round for ever, until JavaScript stops it with a \`RangeError\` (too much recursion).
- Following only \`parent\` links: the captured environment of a function held in \`vars\` is never found, so the closure test fails; reaching an environment *through a function* is the whole point of this chapter.`,
    wrong: [
      {
        code: `function liveEnvs(roots) {
  const out = [];
  const visit = (x) => {
    if (typeof x !== 'object') return;
    if (x === null) return;
    if ('closure' in x) {
      return visit(x.closure);
    }
    out.push(x.name);
    visit(x.parent);
    x.vars.forEach(visit);
  };
  roots.forEach(visit);
  return out;
}`,
        why: 'With no record of what was visited, a cycle sends it round for ever (a RangeError), and a root listed twice is counted twice.',
      },
      {
        code: `function liveEnvs(roots) {
  const seen = new Set();
  for (let e of roots) {
    while (e && !seen.has(e)) {
      seen.add(e);
      e = e.parent;
    }
  }
  return [...seen].map((e) => e.name);
}`,
        why: 'This follows only parent links, so an environment kept alive by a function’s closure is never found.',
      },
    ],
  },
  account: {
    optional: true,
    lang: 'drip',
    title: 'A shared bank balance',
    prompt: 'Write `fn makeAccount(start)` that returns a list of two anonymous functions sharing one balance: the first takes an amount and adds it, the second returns the balance. The program must print `100`, `150` and `150`.',
    starter: `fn makeAccount(start) {
  # your code here
}

let acct = makeAccount(100);
let deposit = acct[0];
let balance = acct[1];
print balance();
deposit(50);
print balance();
print acct[1]();`,
    solution: `fn makeAccount(start) {
  let money = start;
  let add = fn (x) { money += x; };
  let get = fn () { return money; };
  return [add, get];
}

let acct = makeAccount(100);
let deposit = acct[0];
let balance = acct[1];
print balance();
deposit(50);
print balance();
print acct[1]();`,
    tests: `100
150
150`,
    hints: [
      'Both functions must see the same balance, so it has to live in the environment of the `makeAccount` call, which both capture.',
      'Inside `makeAccount`, keep the balance in a variable, make two anonymous functions that use it, and return them in a list.',
      'The adder is `fn (x) { money += x; }` and the reader is `fn () { return money; }`.',
    ],
    walkthrough: `**How to think about it.** The two functions are made in the same call, so they capture the same environment, and a variable in that environment is shared between them for as long as either lives. The balance belongs there. (Using the parameter \`start\` directly would work too, since parameters live in the call's environment; a separate \`money\` just reads more clearly.)

**The solution, line by line.**

- \`fn makeAccount(start) {\` declares the maker.
- \`  let money = start;\` puts the balance in this call's environment.
- \`  let add = fn (x) { money += x; };\` makes a function that changes the shared \`money\`.
- \`  let get = fn () { return money; };\` makes one that reads it.
- \`  return [add, get];\` hands both back in a list. The call ends, but its environment lives on, kept by both closures.
- The program pulls the two functions out of the list, prints 100, deposits 50 through one closure, and reads 150 through the other; \`acct[1]()\` is the same function as \`balance\`, so it reads 150 too.

**Common wrong attempts.**

- Making \`money\` inside each anonymous function: each call starts afresh, and \`balance()\` never sees the deposit.
- Calling \`makeAccount(100)\` twice (once to get the adder, once for the reader): that makes two separate environments, so the deposit goes into one and the balance is read from the other.`,
    wrong: [
      {
        code: `fn makeAccount(start) {
  let money = start;
  let add = fn (x) { money += x; };
  let get = fn () { return money; };
  return [add, get];
}

let deposit = makeAccount(100)[0];
let balance = makeAccount(100)[1];
let acct = [deposit, balance];
print balance();
deposit(50);
print balance();
print acct[1]();`,
        why: 'Two calls make two separate environments, so the deposit goes into one balance and `balance()` reads the other: `100`, `100`, `100`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
fn f() {
  for i in 0..10 {
    if i == 3 {
      return i;
    }
  }
  return -1;
}
print f();
\`\`\``,
    options: [
      {
        t: '`-1`',
        why: 'The `return i` leaves the whole function, not only the loop, so `return -1` never runs.',
      },
      {
        t: '`3`',
        correct: true,
        why: 'When `i` is 3, `return i` parks 3; the RETURN code leaves the if, the loop body and the loop, and `callFunction` gives back 3.',
      },
      {
        t: '`0 1 2 3`',
        why: 'Nothing in the function prints; only the outer `print` does.',
      },
      {
        t: 'A compile error',
        why: 'A `return` inside a loop inside a function is fine.',
      },
    ],
  },
  {
    q: 'What does `print g();` print, if `fn g() { let x = 1; }`?',
    options: [
      {
        t: '`1`',
        why: 'A `let` does not return anything. With no `return`, the call gives none.',
      },
      {
        t: 'A runtime error',
        why: 'Running off the end of a body is the normal way to finish without a value.',
      },
      {
        t: '`none`',
        correct: true,
        why: 'The body finished with NORMAL, not RETURN, so `callFunction` returns null, Drip’s `none`.',
      },
    ],
  },
  {
    q: 'In the companion’s interpreter, what does `execute` do for `return x;`?',
    options: [
      {
        t: 'It throws an exception holding the value of `x`',
        why: 'That is the other design. The companion never throws for a `return`.',
      },
      {
        t: 'It stores the value of `x` in `returnValue` and returns the code RETURN',
        correct: true,
        why: 'The value is parked in the interpreter, and the small code travels up through the methods.',
      },
      {
        t: 'It pops the call off Drip’s own stack of frames',
        why: 'That is what the bytecode VM does in Part IV. The tree-walker passes a code up instead.',
      },
    ],
  },
  {
    q: 'A `while` loop’s body gives back the code RETURN. What does the loop do?',
    options: [
      {
        t: 'Goes round again',
        why: 'That is what happens for NORMAL and CONTINUE.',
      },
      {
        t: 'Stops and finishes normally',
        why: 'That is what it does for BREAK. A return must leave the whole function, not just the loop.',
      },
      {
        t: 'Stops and gives RETURN back to its own caller',
        correct: true,
        why: '`if (c === RETURN) return c;` passes the code up towards `callFunction`.',
      },
    ],
  },
  {
    q: 'What is one cost of completion codes compared with throwing an exception for `return`?',
    options: [
      {
        t: 'Every method that runs statements must check the code and pass it on',
        correct: true,
        why: 'A method that forgot to check would break `return` for everything inside it; an exception needs no help on the way.',
      },
      {
        t: 'A runtime error can no longer be reported',
        why: 'Runtime errors are still thrown as exceptions; only `return`, `break` and `continue` use codes.',
      },
      {
        t: 'Recursion stops working',
        why: 'Each call has its own `callFunction`, which takes its own return value; recursion works as before.',
      },
    ],
  },
  {
    q: 'In the tree-walker, where is the record that a paused Drip call will carry on at its addition?',
    options: [
      {
        t: 'In the interpreter’s `frames` list',
        why: '`frames` holds only a place and a line per call, for stack traces; it cannot resume anything.',
      },
      {
        t: 'On TypeScript’s own call stack',
        correct: true,
        why: 'The TypeScript `evaluate` for that addition has not returned yet; when its call comes back, TypeScript knows where it was.',
      },
      {
        t: 'In the call’s `Environment`',
        why: 'Environments hold variables, not where a call will carry on.',
      },
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
      {
        t: '`  at line 5 in script`',
        correct: true,
        why: 'The trace lists the innermost call first and ends with the script, waiting on its call of `g` on line 5.',
      },
      {
        t: '`  at line 2 in fn f`',
        why: 'That is the first `at` line, for the innermost call. The script comes last.',
      },
      {
        t: '`  at line 4 in fn g`',
        why: 'That is the middle line: `g` waiting on its call of `f`.',
      },
    ],
  },
  {
    q: 'Why does `isEven(300)` stop with `stack overflow`, while `isEven(10)` works?',
    options: [
      {
        t: 'Mutual recursion is not allowed in Drip',
        why: 'It works: `isEven(10)` runs fine.',
      },
      {
        t: '300 is too large a number for Drip',
        why: 'Numbers are fine; the problem is how deep the calls nest.',
      },
      {
        t: 'It needs about 300 active calls, more than Drip’s limit of 256',
        correct: true,
        why: '`FRAMES_MAX` is 256 (the script counts as one), and `callFunction` refuses to go deeper.',
      },
    ],
  },
  {
    q: 'What does `drip.ts` do when JavaScript itself runs out of stack and throws a `RangeError`?',
    options: [
      {
        t: 'It lets the JavaScript error crash the program',
        why: 'It catches the RangeError so the reader sees Drip’s own message.',
      },
      {
        t: 'It reports Drip’s own `stack overflow` error, with a trace',
        correct: true,
        why: 'It makes a RuntimeError with the message `stack overflow` at the innermost call’s line, and prints the usual trace.',
      },
      {
        t: 'It retries the program with a bigger stack',
        why: 'Nothing is retried; the program stops with an error.',
      },
    ],
  },
  {
    q: 'Which of these is something the tree-walker CANNOT easily do, because it borrows the host stack?',
    options: [
      {
        t: 'Run mutually recursive functions',
        why: 'That works with no extra code, because calls are ordinary host calls.',
      },
      {
        t: 'Print a stack trace',
        why: 'The small `frames` list is enough for that.',
      },
      {
        t: 'Pause a Drip program half-way and resume it later',
        correct: true,
        why: 'The real state of each paused call is in TypeScript’s frames, which Drip cannot save or restore.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn outer() {
  let x = "outer";
  return fn () { print x; };
}
let x = "global";
let f = outer();
f();
\`\`\``,
    options: [
      {
        t: '`global`',
        why: 'That would be the caller’s view (dynamic scope). Drip looks in the environment where the function was made.',
      },
      {
        t: '`outer`',
        correct: true,
        why: 'The anonymous function captured the call of `outer`’s environment, where `x` is `"outer"`.',
      },
      {
        t: 'A runtime error, because `outer` has returned',
        why: 'The captured environment is still there, because the function refers to it.',
      },
    ],
  },
  {
    q: 'Which environment becomes the parent of the environment a Drip call makes?',
    options: [
      {
        t: 'The globals, always',
        why: 'Then nested functions could never see their maker’s locals.',
      },
      {
        t: 'The caller’s current environment',
        why: 'That is dynamic scope, which Drip does not use.',
      },
      {
        t: 'The function’s captured environment (its `closure` field)',
        correct: true,
        why: '`callFunction` does `new Environment(f.closure)`.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 1;
let show = fn () { print n; };
n = 5;
show();
\`\`\``,
    options: [
      {
        t: '`5`',
        correct: true,
        why: 'The closure captured the variable `n`, not the value 1, so it reads the current value.',
      },
      {
        t: '`1`',
        why: 'That would be true if closures copied values when they were made. They capture variables.',
      },
      {
        t: '`none`',
        why: '`n` holds a number the whole time.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let fs = [];
for i in 0..3 {
  push(fs, fn () { print i; });
}
fs[1]();
\`\`\``,
    options: [
      {
        t: '`3`',
        why: 'That would happen if all passes shared one `i`. Each pass of a Drip `for` gets its own.',
      },
      {
        t: '`2`',
        why: '`fs[1]` is the second function, made when `i` was 1.',
      },
      {
        t: '`1`',
        correct: true,
        why: 'Each pass makes a fresh environment for `i`, and `fs[1]` captured the pass where `i` was 1.',
      },
    ],
  },
  {
    q: 'Where does the anonymous function in `fn () { print i; }` store the environment it captures?',
    options: [
      {
        t: 'In the `closure` field of the `DripFunction` made when the expression is evaluated',
        correct: true,
        why: 'The `function` case of `evaluate` does `new DripFunction(e.fn, this.env, false)`.',
      },
      {
        t: 'In the syntax tree node for the expression',
        why: 'The node is shared by every evaluation; each evaluation makes its own function value with its own environment.',
      },
      {
        t: 'Nowhere: anonymous functions cannot be closures',
        why: 'They are closures exactly like named ones.',
      },
    ],
  },
  {
    q: 'After `makeCounter()` returns a function, why does its environment still exist?',
    options: [
      {
        t: 'The interpreter copies the environment into the function',
        why: 'Nothing is copied: the function refers to the same environment object.',
      },
      {
        t: 'Its TypeScript frame stays on the host stack',
        why: 'The frame is gone as soon as the call returns.',
      },
      {
        t: 'The returned function’s closure field refers to it, so it is still reachable',
        correct: true,
        why: 'Heap objects live as long as something can reach them.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn pair() {
  let n = 0;
  let inc = fn () { n += 1; };
  let get = fn () { return n; };
  return [inc, get];
}
let p = pair();
p[0]();
p[0]();
print p[1]();
\`\`\``,
    options: [
      {
        t: '`0`',
        why: '`get` does not have its own copy of `n`; it shares the one `inc` changes.',
      },
      {
        t: '`2`',
        correct: true,
        why: 'Both closures captured the same environment, and `inc` added 1 to its `n` twice.',
      },
      {
        t: '`1`',
        why: 'Each call of `p[0]()` adds 1 to the same `n`, and there are two calls.',
      },
    ],
  },
  {
    q: 'Which of these keeps an environment alive?',
    options: [
      {
        t: 'A function value whose closure field refers to it',
        correct: true,
        why: 'Reachable through the closure, so the garbage collector must keep it.',
      },
      {
        t: 'Having been the environment of a call that has returned',
        why: 'That alone keeps nothing alive; something must still refer to it.',
      },
      {
        t: 'Holding a large number of variables',
        why: 'Size has nothing to do with whether it can be reached.',
      },
    ],
  },
  {
    q: 'In the tree-walker, which calls allocate a new `Environment` object?',
    options: [
      {
        t: 'Only calls of functions that make closures',
        why: 'The tree-walker cannot tell in advance, and does not try: it makes one for every call.',
      },
      {
        t: 'Every call of a Drip function',
        correct: true,
        why: '`callFunction` always does `new Environment(f.closure)`, with a new `Map` inside.',
      },
      {
        t: 'None: environments are made once per function',
        why: 'Each call needs its own parameters, so each call gets its own environment.',
      },
    ],
  },
  {
    q: 'How does Part IV’s bytecode VM keep a captured variable alive after its call returns?',
    options: [
      {
        t: 'It keeps every call’s locals on the heap, as the tree-walker does',
        why: 'It keeps locals in stack slots, which is why it needs a special step for captured ones.',
      },
      {
        t: 'It moves just the captured variables off the stack into small heap objects',
        correct: true,
        why: 'Only what a closure captures pays for a heap object; everything else stays in fast stack slots.',
      },
      {
        t: 'It forbids closures from outliving their call',
        why: 'Drip allows it in both implementations; the results must be identical.',
      },
    ],
  },
];
