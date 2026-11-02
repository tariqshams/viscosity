// Chapter 69 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'two-ways': {
    q: 'Name the two common ways a tree-walking interpreter implements `return`.',
    a: 'Completion codes passed back up by every method that runs statements, or an exception thrown at the `return` and caught at the edge of the call.',
  },
  'loop-return': {
    q: 'In a tree-walker that uses completion codes, a loop’s body reports `BREAK` in one round and `RETURN` in another. What does the loop do with each?',
    a: 'On `BREAK` it stops looping and finishes normally; on `RETURN` it stops and passes `RETURN` up, since the return leaves the whole function.',
  },
  'host-stack-what': {
    q: 'What is the *host stack* of an interpreter?',
    a: 'The call stack of the language the interpreter is written in (for a TypeScript tree-walker, TypeScript’s); a tree-walker’s calls ride on it.',
  },
  'closure-field': {
    q: 'In a lexically scoped tree-walking interpreter, which environment does a function value store when it is made?',
    a: 'The environment that was current when the function value was made (where its `fn` ran); every call’s environment hangs off it.',
  },
  'variable-not-value': {
    q: 'In Drip (as in JavaScript), `let x = 1; let f = fn () { print x; }; x = 2; f();` What is printed, and why?',
    a: '`2`. A closure captures the variable itself, so it reads the variable’s current value.',
  },
  'outlives': {
    q: 'When environments are heap objects, can one outlive the call that created it? Give an example.',
    a: 'Yes: when the call returns a function made inside it, that function’s captured environment keeps the call’s environment alive.',
  },
  'what-keeps': {
    q: 'Name three things that can keep an interpreter’s environment alive.',
    a: 'A running call, a child environment (through its parent link), and a function that captured it.',
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
  formatTrace: {
    optional: true,
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
  fixLoop: {
    optional: true,
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
  liveEnvs: {
    optional: true,
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
    q: `In Drip, what does this print?
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
    q: `When Drip runs this program, what is the last line of its error?
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
    q: `In Drip, what does this print?
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
    q: `In Drip, what does this print?
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
];
