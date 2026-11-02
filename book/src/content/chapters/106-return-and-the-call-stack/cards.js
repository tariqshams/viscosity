// Chapter 106 cards. Keys are stable ids: never rename them.

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
};

// A tiny language with completion codes, like the interpreter's.
const PRELUDE = `const NORMAL = 0;
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
`;

export const exercises = {
  callFn: {
    title: 'Pass the code up',
    prompt: `\`exec(s, st, log)\` (given) runs one statement of a tiny language and returns a completion code, exactly like Drip's \`execute\`: a \`log\` statement pushes its text onto \`log\` and gives \`NORMAL\`; a \`return\` parks its value in \`st.ret\` and gives \`RETURN\`; an \`if\` whose \`test\` is true runs its \`body\` with \`execBlock\`. Write the two missing methods.

- \`execBlock(stmts, st, log)\` runs the statements in order and stops as soon as one gives back something other than \`NORMAL\`, returning that code; if all finish normally, it returns \`NORMAL\`.
- \`callFn(body, log)\` makes a fresh state \`{ ret: null }\`, runs \`body\` with \`execBlock\`, and returns the parked value if the body gave \`RETURN\`, or \`null\` otherwise.`,
    starter: `${PRELUDE}
function execBlock(stmts, st, log) {
  // your code here
}

function callFn(body, log) {
  // your code here
}`,
    solution: `${PRELUDE}
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
        code: `${PRELUDE}
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
        code: `${PRELUDE}
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
    prompt:
      'Write a recursive Drip function `pow(b, e)` that **returns** `b` to the power `e`, for whole numbers `e >= 0`. Use the facts that `pow(b, 0)` is 1 and `pow(b, e)` is `b * pow(b, e - 1)`. The program should print `1024`, `81` and `1`.',
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
        why: "The last line prints instead of returning, so each call gives `none`, and the call above it fails: `cannot use '*' on a number and none`.",
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
      { t: '`-1`', why: 'The `return i` leaves the whole function, not only the loop, so `return -1` never runs.' },
      { t: '`3`', correct: true, why: 'When `i` is 3, `return i` parks 3; the RETURN code leaves the if, the loop body and the loop, and `callFunction` gives back 3.' },
      { t: '`0 1 2 3`', why: 'Nothing in the function prints; only the outer `print` does.' },
      { t: 'A compile error', why: 'A `return` inside a loop inside a function is fine.' },
    ],
  },
  {
    q: 'What does `print g();` print, if `fn g() { let x = 1; }`?',
    options: [
      { t: '`1`', why: 'A `let` does not return anything. With no `return`, the call gives none.' },
      { t: 'A runtime error', why: 'Running off the end of a body is the normal way to finish without a value.' },
      { t: '`none`', correct: true, why: 'The body finished with NORMAL, not RETURN, so `callFunction` returns null, Drip’s `none`.' },
    ],
  },
  {
    q: 'In the companion’s interpreter, what does `execute` do for `return x;`?',
    options: [
      { t: 'It throws an exception holding the value of `x`', why: 'That is the other design. The companion never throws for a `return`.' },
      { t: 'It stores the value of `x` in `returnValue` and returns the code RETURN', correct: true, why: 'The value is parked in the interpreter, and the small code travels up through the methods.' },
      { t: 'It pops the call off Drip’s own stack of frames', why: 'That is what the bytecode VM does in Part IV. The tree-walker passes a code up instead.' },
    ],
  },
  {
    q: 'A `while` loop’s body gives back the code RETURN. What does the loop do?',
    options: [
      { t: 'Goes round again', why: 'That is what happens for NORMAL and CONTINUE.' },
      { t: 'Stops and finishes normally', why: 'That is what it does for BREAK. A return must leave the whole function, not just the loop.' },
      { t: 'Stops and gives RETURN back to its own caller', correct: true, why: '`if (c === RETURN) return c;` passes the code up towards `callFunction`.' },
    ],
  },
  {
    q: 'What is one cost of completion codes compared with throwing an exception for `return`?',
    options: [
      { t: 'Every method that runs statements must check the code and pass it on', correct: true, why: 'A method that forgot to check would break `return` for everything inside it; an exception needs no help on the way.' },
      { t: 'A runtime error can no longer be reported', why: 'Runtime errors are still thrown as exceptions; only `return`, `break` and `continue` use codes.' },
      { t: 'Recursion stops working', why: 'Each call has its own `callFunction`, which takes its own return value; recursion works as before.' },
    ],
  },
];
