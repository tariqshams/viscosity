// Chapter 40 cards. Keys are stable ids: never rename them.

export const prompts = {
  'return-deep': {
    q: 'When `return` runs inside an `if` inside a `while` inside a function, what does the interpreter have to leave?',
    a: 'Every `execute` and `executeBlock` call between the `return` and the function call, all at once.',
  },
  'why-throw': {
    q: 'Why does Drip implement `return` with a thrown signal instead of a returned flag?',
    a: 'A throw abandons every frame up to the catch by itself. A flag would need a check in every loop, block and `if`.',
  },
  'catch-where': {
    q: 'Where is the `ReturnSignal` caught?',
    a: 'In `executeFunctionBody`, at the edge of each function call.',
  },
  'rethrow': {
    q: 'What does `executeFunctionBody` do with a caught exception that isn’t a `ReturnSignal`?',
    a: 'It throws it again (`throw e`), so a real runtime error keeps travelling up and gets reported.',
  },
  'finally-unwind': {
    q: 'As a `ReturnSignal` passes through `executeBlock`, what does the `finally` do?',
    a: 'It switches the current environment back to the one from before the block.',
  },
  'signal-own-call': {
    q: 'In `fib(3)`, does `fib(3)` ever catch the signal thrown by a `return` inside `fib(2)`?',
    a: 'No. Each signal is caught by its own call’s `executeFunctionBody`. To `fib(3)`, `fib(2)` just returned a value.',
  },
  'return-nil': {
    q: 'What does a Drip function return if its body ends without a `return`, or with a bare `return;`?',
    a: '`nil`.',
  },
  'host-stack-what': {
    q: 'What is the *host stack* of a Drip program run by the tree-walker?',
    a: 'TypeScript’s own call stack. Each Drip call becomes several TypeScript calls on it.',
  },
  'overflow-why': {
    q: 'Why does a deeply recursive Drip program hit "Stack overflow." much sooner than the same recursion in TypeScript would?',
    a: 'Each Drip call uses several host frames, so the host stack fills up several times faster.',
  },
  'no-drip-frames': {
    q: 'Where, in the tree-walker, is the information "which Drip call to go back to" kept?',
    a: 'Only in TypeScript’s frames on the host stack. There is no Drip frame data structure.',
  },
};

export const examples = {
  overflow: {
    title: 'Recursion with no base case',
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

const PRELUDE = `class Ret {
  constructor(value) {
    this.value = value;
  }
}

// Runs one statement. Given: don't
// change it.
function exec(s, log) {
  switch (s.kind) {
    case 'log':
      log.push(s.text);
      return;
    case 'block':
      for (const t of s.body) {
        exec(t, log);
      }
      return;
    case 'return':
      throw new Ret(s.value);
    default:
      throw new Error('bad: ' + s.kind);
  }
}
`;

export const exercises = {
  callFn: {
    title: 'Catch the return',
    prompt: `\`exec\` runs one statement of a tiny language. A \`return\` statement throws a \`Ret\` holding its value, exactly like Drip's \`ReturnSignal\`. Write \`callFn(body, log)\`: run each statement of the array \`body\` with \`exec(s, log)\`. If a \`Ret\` is thrown, stop and return its \`value\`. If the body finishes without one, return \`null\`. Any other exception must keep travelling: don't swallow it.`,
    starter: `${PRELUDE}
function callFn(body, log) {
  // your code here
}`,
    solution: `${PRELUDE}
function callFn(body, log) {
  try {
    for (const s of body) exec(s, log);
  } catch (e) {
    if (e instanceof Ret) {
      return e.value;
    }
    throw e;
  }
  return null;
}`,
    tests: `const L = (text) => ({ kind: 'log', text });
const R = (value) => ({ kind: 'return', value });
const B = (...body) => ({ kind: 'block', body });
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
  const v = callFn([B(B(L('x'), R(5), L('y'))), L('z')], log);
  expect(v).toBe(5);
  expect(log).toEqual(['x']);
});
test('falsy values come back intact', () => {
  expect(callFn([R(0)], [])).toBe(0);
  expect(callFn([R(false)], [])).toBe(false);
});
test('other errors keep travelling', () => {
  expect(() => callFn([{ kind: 'oops' }], [])).toThrow();
});`,
    hints: [
      'Put the loop over `body` inside a `try`.',
      'In the `catch (e)`, use `e instanceof Ret` to tell a return apart from a real error.',
      'For a `Ret`, return `e.value`. For anything else, `throw e;` again. After the `try`, return `null`.',
    ],
    walkthrough: `This is \`executeFunctionBody\` from the companion's \`interpreter.ts\`, in miniature.

- **The \`try\` wraps the whole body**, so a \`Ret\` thrown at any depth (even inside nested blocks, as in the fourth test) lands here. Every \`exec\` call in between is abandoned, which is why \`'y'\` and \`'z'\` are never logged.
- **\`instanceof Ret\`** picks out returns. A \`Ret\` is the *normal* way out of a function, so it is turned back into an ordinary return value.
- **\`throw e\`** for everything else. Catching an exception you don't understand and carrying on would hide real bugs: in Drip, a runtime error inside a function would silently become \`nil\`.
- **\`return null\`** after the \`try\` covers a body that simply ends: Drip's implicit \`nil\`.

\`\`\`js
try {
  for (const s of body) exec(s, log);
} catch (e) {
  if (e instanceof Ret) {
    return e.value;
  }
  throw e;
}
return null;
\`\`\``,
    wrong: [
      {
        code: `${PRELUDE}
function callFn(body, log) {
  try {
    for (const s of body) exec(s, log);
  } catch (e) {
    return e.value;
  }
  return null;
}`,
        why: 'This catches *every* exception and treats it as a return. A real error comes back as `undefined` instead of being reported. Check `e instanceof Ret`, and rethrow the rest.',
      },
      {
        code: `${PRELUDE}
function callFn(body, log) {
  try {
    for (const s of body) exec(s, log);
  } catch (e) {
    if (e instanceof Ret) {
      return e.value || null;
    }
    throw e;
  }
  return null;
}`,
        why: '`e.value || null` turns `0` and `false` into `null`. A function is allowed to return a falsy value; return `e.value` as it is.',
      },
      {
        code: `${PRELUDE}
function callFn(body, log) {
  for (const s of body) {
    if (s.kind === 'return') {
      return s.value;
    }
    exec(s, log);
  }
  return null;
}`,
        why: 'This only spots a `return` at the top level of the body. One inside a block is still thrown by `exec` and escapes `callFn` completely. That’s why the throw needs a `catch`.',
      },
    ],
  },
  power: {
    optional: true,
    lang: 'drip',
    title: 'A recursive power function',
    prompt:
      'Write a recursive Drip function `pow(b, e)` that **returns** `b` to the power `e`, for whole numbers `e >= 0`. Use the facts `pow(b, 0)` is 1 and `pow(b, e)` is `b * pow(b, e - 1)`. The program should print `1024`, `81` and `1`.',
    starter: `fn pow(b, e) {
  // your code here
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
    solution: `fn pow(b, e) {
  if (e == 0) return 1;
  return b * pow(b, e - 1);
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
    tests: `1024
81
1`,
    hints: [
      'The base case first: if `e == 0`, return 1.',
      'Otherwise return `b * pow(b, e - 1)`. Each call waits for the smaller one to return.',
    ],
    walkthrough: `\`pow(2, 10)\` makes eleven Drip calls, \`e\` from 10 down to 0, each in its own environment. Only \`pow(2, 0)\` hits the base case and throws a ReturnSignal holding 1. Its \`executeFunctionBody\` catches it, and the 1 lands in the multiplication waiting in \`pow(2, 1)\`, which returns 2 the same way, and so on back up to 1024.

The host stack is tallest at the base case: eleven Drip calls deep, each with its handful of TypeScript frames.`,
    wrong: [
      {
        code: `fn pow(b, e) {
  if (e == 0) return 1;
  print b * pow(b, e - 1);
}

print pow(2, 10);
print pow(3, 4);
print pow(5, 0);`,
        why: '`print` shows a value but doesn’t hand it back. Without `return`, each call returns `nil`, so the multiplication above it fails: `Operands must be numbers.`',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
fn f() {
  print "a";
  return;
  print "b";
}
print f();
\`\`\``,
    options: [
      { t: '`a` then `b` then `nil`', why: 'The `return` abandons the rest of the body, so `b` is never printed.' },
      { t: '`a` then `nil`', correct: true, why: 'The bare `return;` throws a signal holding `nil`, which skips `print "b"` and becomes the call’s value.' },
      { t: '`a` only', why: 'The outer `print` still runs. It prints the call’s value, `nil`.' },
      { t: 'A runtime error: return needs a value', why: 'A bare `return;` is allowed and returns `nil`.' },
    ],
  },
  {
    q: 'In the tree-walker, what does `case \'return\'` in `execute` do?',
    options: [
      { t: 'Sets a flag that every loop checks', why: 'That’s the alternative the interpreter avoids. No loop checks anything.' },
      { t: 'Pops a frame from the interpreter’s frame array', why: 'The tree-walker has no frame array. That’s the bytecode VM.' },
      { t: 'Calls the caller back with the value', why: 'Nothing calls the caller. The call that is already waiting gets the value when the signal is caught.' },
      { t: 'Evaluates the value and throws a `ReturnSignal` holding it', correct: true, why: 'The throw unwinds every nested execute until `executeFunctionBody` catches it.' },
    ],
  },
  {
    q: 'A runtime error is thrown inside a Drip function. What does `executeFunctionBody` do with it?',
    options: [
      { t: 'Rethrows it, so it keeps travelling up and gets reported', correct: true, why: 'Only `ReturnSignal`s are turned into return values. Everything else goes on with `throw e`.' },
      { t: 'Catches it and returns `nil`', why: 'That would hide errors. A function that crashes must not look like one that returned `nil`.' },
      { t: 'Prints it and carries on with the next statement', why: 'Nothing in the interpreter resumes after a runtime error.' },
      { t: 'Never sees it, because only ReturnSignals are thrown', why: 'RuntimeErrors are thrown too, and they pass through the same catch.' },
    ],
  },
  {
    q: 'While a `ReturnSignal` unwinds out of a function body, why does the caller end up back in its own environment?',
    options: [
      { t: 'The signal carries the caller’s environment', why: 'It only carries the return value.' },
      { t: 'Each `executeBlock` on the way restores its saved environment in `finally`', correct: true, why: '`finally` runs even while an exception passes through, so every switch is undone.' },
      { t: 'The call environment deletes itself', why: 'Nothing is deleted by hand; the current environment is switched back.' },
      { t: 'It doesn’t: the caller keeps using the callee’s environment', why: 'That would make the callee’s locals visible to the caller, and it doesn’t happen.' },
    ],
  },
  {
    q: 'Where does the tree-walker keep track of which Drip calls are waiting for which?',
    options: [
      { t: 'In an array of Drip call frames', why: 'There is no such array in `interpreter.ts`. The VM has one.' },
      { t: 'In the environments’ parent links', why: 'Parent links follow where functions were declared, not who called whom.' },
      { t: 'In TypeScript’s own call stack: the host stack', correct: true, why: 'Each Drip call is a chain of TypeScript calls, so the waiting calls are paused TypeScript frames.' },
      { t: 'In the syntax tree', why: 'The tree is the program’s text; it doesn’t change while the program runs.' },
    ],
  },
  {
    q: 'What happens when a Drip function recurses with no base case?',
    options: [
      { t: 'It runs forever, because Drip has no stack limit', why: 'Every Drip call uses host frames, and the host stack has a limit.' },
      { t: 'The resolver rejects it before it runs', why: 'Spotting infinite recursion in general isn’t possible before running, and the resolver doesn’t try.' },
      { t: 'It returns `nil` once the stack is full', why: 'Nothing returns. The program stops with an error.' },
      { t: 'The host stack fills up, JavaScript throws a RangeError, and `drip.ts` reports "Stack overflow."', correct: true, why: 'The interpreter reuses the host stack, so a deep Drip recursion becomes a deep TypeScript recursion.' },
    ],
  },
];
