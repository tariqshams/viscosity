// Chapter 152 cards. Keys are stable ids: never rename them.

export const prompts = {
  'self-opt-what': {
    q: 'What does a node in a **self-optimizing AST** interpreter do?',
    a: 'It records the values it sees and rewrites itself into a version specialized for them, generalizing when they stop holding.',
  },
  'rewrite-on': {
    q: 'In Truffle’s DSL, what does `rewriteOn = ArithmeticException.class` on an int `+` mean?',
    a: 'If the int case ever throws (on overflow), this node never uses it again and the next, more general case runs instead.',
  },
  'sa-uninit': {
    q: 'Why does a self-specializing `+` node start in an *uninitialized* state?',
    a: 'It has seen no values yet, so it has nothing to specialize on; its first execution decides which case to try.',
  },
  'one-way': {
    q: 'Why do specialization rewrites only go from specific to general?',
    a: 'So a node settles: a node that could flip back and forth would keep invalidating and recompiling its code.',
  },
  'sa-overflow': {
    q: 'An int `+` node is given `2147483647` and `1`. What does it return, and what state is it in afterwards?',
    a: '`2147483648`, the right sum; the int case overflowed, so the node moves to its double case and never uses the int case again.',
  },
  'replace-invalidates': {
    q: 'What else happens when a Truffle node calls `replace` to swap itself out?',
    a: 'Compiled code that relied on the old node is invalidated, and execution continues in the interpreter.',
  },
  'graaljs-what': {
    q: 'What is GraalJS?',
    a: 'A JavaScript engine written in Java on top of GraalVM, built as a Truffle self-optimizing AST interpreter.',
  },
  'two-copies': {
    q: 'What duplication does Truffle avoid that a classic interpreter-plus-JIT engine has?',
    a: 'Writing the language’s semantics twice, once in the interpreter and once in the compiler.',
  },
};

export const examples = {};

const LEAVES = `const Lit = (v) =>
  ({ execute: () => v });
const Var = (k) =>
  ({ execute: (env) => env[k] });
const isInt = (x) => (x | 0) === x;
const isNum = (x) =>
  typeof x === 'number';
`;

export const exercises = {
  selfAdd: {
    title: 'A + node that specializes itself',
    prompt:
      'Write `AddNode`, a self-specializing `+` node. Its children `l` and `r` have an `execute(env)` method. `state` starts as `\'uninit\'`. In `execute(env)`, evaluate both children, then: in `\'uninit\'` or `\'int\'`, if both values and their sum are int32 (`isInt`), set `\'int\'` and return the sum. Otherwise, unless the state is `\'generic\'`, if both are numbers set `\'double\'`. Otherwise set `\'generic\'`. Always return `a + b`. A node must **never** move back to a more specific state.',
    starter: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    return a + b;
  }
}`,
    solution: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    const s = this.state;
    if (s === 'uninit' || s === 'int') {
      if (isInt(a) && isInt(b) &&
          isInt(a + b)) {
        this.state = 'int';
        return a + b;
      }
    }
    if (s !== 'generic' &&
        isNum(a) && isNum(b)) {
      this.state = 'double';
      return a + b;
    }
    this.state = 'generic';
    return a + b;
  }
}`,
    tests: `const add = () =>
  new AddNode(Var('a'), Var('b'));
test('starts uninitialized', () => {
  expect(add().state).toBe('uninit');
});
test('ints specialize to int', () => {
  const n = add();
  expect(n.execute({ a: 2, b: 3 })).toBe(5);
  expect(n.state).toBe('int');
});
test('overflow widens to double', () => {
  const n = add();
  n.execute({ a: 1, b: 2 });
  const big = 2 ** 31 - 1;
  expect(n.execute({ a: big, b: 1 }))
    .toBe(2 ** 31);
  expect(n.state).toBe('double');
});
test('never back to int', () => {
  const n = add();
  n.execute({ a: 0.5, b: 1 });
  expect(n.state).toBe('double');
  n.execute({ a: 1, b: 2 });
  expect(n.state).toBe('double');
});
test('strings go generic, and stay', () => {
  const n = add();
  expect(n.execute({ a: 'a', b: 'b' }))
    .toBe('ab');
  expect(n.state).toBe('generic');
  expect(n.execute({ a: 1, b: 2 })).toBe(3);
  expect(n.state).toBe('generic');
});
test('works with literals too', () => {
  const n = new AddNode(Lit(4), Lit(0.25));
  expect(n.execute({})).toBe(4.25);
  expect(n.state).toBe('double');
});`,
    hints: [
      'Read `this.state` into a local `s` first, so each rule looks at the state the node had when this call began.',
      'The int case applies only in `\'uninit\'` or `\'int\'`, and it needs `isInt(a + b)` too: that is the overflow check, like `Math.addExact`.',
      'The double case applies in every state except `\'generic\'`. Everything else falls through to `\'generic\'`.',
    ],
    walkthrough: `**How to think about it.** Write the states down in order first: \`uninit\`, \`int\`, \`double\`, \`generic\`. The rule "never move back" means each case may only be tried by a node whose state is at or below it in that order. So order the code the same way: try the int case only if the state is \`uninit\` or \`int\`; try the double case only if the state is not \`generic\`; otherwise fall through to generic. Then trace a few calls by hand: ints (go to \`int\`), a huge sum such as \`2 ** 31 - 1 + 1\` (the int case fails, go to \`double\`), ints again (stay \`double\`, because the int case is no longer allowed), a string (go to \`generic\`).

**The solution, line by line.**

- \`const a = this.l.execute(env);\` and \`const b = this.r.execute(env);\` evaluate both children first, as any tree-walking \`+\` does.
- \`const s = this.state;\` reads the state once, so every decision below is made from the state the node had when this call began.
- \`if (s === 'uninit' || s === 'int') {\` Only a node that has not yet given up on integers may try the int case.
- \`if (isInt(a) && isInt(b) && isInt(a + b)) {\` The int case needs both inputs to be int32 *and* the sum to fit; \`isInt(a + b)\` plays the part of \`Math.addExact\` in GraalJS, catching overflow such as \`2 ** 31\`.
- \`this.state = 'int'; return a + b;\` records the decision and returns the sum.
- \`if (s !== 'generic' && isNum(a) && isNum(b)) {\` Any node that is not already generic may use the double case when both values are numbers, which includes an \`int\` node whose sum just overflowed.
- \`this.state = 'double'; return a + b;\` widens to \`double\` and returns the sum.
- \`this.state = 'generic'; return a + b;\` Everything else (a string, an object) makes the node generic. It still returns \`a + b\`, with all of JavaScript's rules.

Notice that every path returns the same thing, \`a + b\`: specialization only changes how much checking a compiled version would need, and it must never change the answer. In Truffle, the compiler would treat \`state\` as a constant, keep only the current case, and turn the fall-through into a deoptimization.

**Common wrong attempts.**

- Recomputing the state from scratch on every call (\`if (isInt(a) && ...) state = 'int'; else if ...\`): a node that saw a double goes back to \`'int'\` when integers come again, and the "never goes back" test fails. Real nodes only widen; otherwise they would keep invalidating their compiled code.
- Leaving out the overflow check (\`isInt(a) && isInt(b)\` only): \`2 ** 31 - 1\` plus \`1\` stays in the int state even though the result is not an int32, so the node's guess is silently wrong.
- Letting a \`double\` node try the int case first: integers would move it back to \`int\`, which breaks the one-way rule in the same way as the first attempt.`,
    wrong: [
      {
        code: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    if (isInt(a) && isInt(b) &&
        isInt(a + b)) {
      this.state = 'int';
    } else if (isNum(a) && isNum(b)) {
      this.state = 'double';
    } else {
      this.state = 'generic';
    }
    return a + b;
  }
}`,
        why: 'The state is recomputed from scratch on every call, so a node that saw a double goes back to `\'int\'` when ints come again. Real nodes only widen; otherwise they would keep invalidating their compiled code.',
      },
      {
        code: `${LEAVES}
class AddNode {
  constructor(l, r) {
    this.l = l;
    this.r = r;
    this.state = 'uninit';
  }
  execute(env) {
    const a = this.l.execute(env);
    const b = this.r.execute(env);
    const s = this.state;
    if (s === 'uninit' || s === 'int') {
      if (isInt(a) && isInt(b)) {
        this.state = 'int';
        return a + b;
      }
    }
    if (s !== 'generic' &&
        isNum(a) && isNum(b)) {
      this.state = 'double';
      return a + b;
    }
    this.state = 'generic';
    return a + b;
  }
}`,
        why: 'There is no overflow check: `2 ** 31 - 1 + 1` stays in the int state although the result is not an int32. Check `isInt(a + b)` as well.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a Truffle language implementer mainly write?',
    options: [
      { t: 'A bytecode compiler and a separate optimizing JIT', why: 'That is the classic design Truffle avoids.' },
      { t: 'An AST interpreter whose nodes specialize themselves', correct: true, why: 'Truffle derives compiled code from that interpreter by partial evaluation with the Graal compiler.' },
      { t: 'Machine code for each processor', why: 'The Graal compiler produces the machine code.' },
      { t: 'A transpiler to Java source', why: 'Nothing is translated to Java source; the interpreter itself is Java.' },
    ],
  },
  {
    q: 'A `+` node in the int state receives `2 ** 31 - 1` and `1`. What should it do?',
    options: [
      { t: 'Return a wrapped-around negative number', why: 'JavaScript’s `+` never wraps; the answer must be 2147483648.' },
      { t: 'Throw a TypeError', why: 'The addition is perfectly valid JavaScript.' },
      { t: 'Return the right sum, widen to a more general state, and never use the int case again', correct: true, why: 'That is `rewriteOn = ArithmeticException.class` with `Math.addExact`.' },
      { t: 'Return the sum and stay in the int state', why: 'The result isn’t an int32, so the int specialization’s guess has failed.' },
    ],
  },
  {
    q: 'After seeing ints, then one double, then ints again, which state is a self-specializing `+` node in?',
    options: [
      { t: '`int`, because the latest values were ints', why: 'That would be moving back to a more specific state, which the one-way rule forbids.' },
      { t: '`uninit`, because the double reset it', why: 'Nothing ever resets a node to uninitialized; it only widens.' },
      { t: '`generic`, because it has seen two kinds of number', why: 'Ints and doubles are both numbers, which the double case handles; only non-numbers need generic.' },
      { t: '`double`, and it stays there', correct: true, why: 'Once the int case has failed, the node keeps the more general case for good, so it settles.' },
    ],
  },
  {
    q: 'What would go wrong if a node could move back to a more specific state?',
    options: [
      { t: 'It could flip back and forth for ever, and each change would throw away its compiled code', correct: true, why: 'Truffle’s documentation calls this a deoptimization cycle: compile, invalidate, recompile, again and again.' },
      { t: 'It would give wrong answers', why: 'Every state returns the correct result; the problem is wasted compilation, not wrong output.' },
      { t: 'It would run out of memory', why: 'States take no extra memory; the cost is time spent recompiling.' },
      { t: 'Nothing: moving back would always be faster', why: 'The fast case is useless if the node keeps leaving it and its compiled code keeps being thrown away.' },
    ],
  },
  {
    q: 'In GraalJS’s `doInt`, why use `Math.addExact(a, b)` rather than `a + b`?',
    options: [
      { t: 'Because it is faster than `+` in Java', why: 'Speed is not the reason; the reason is what happens on overflow.' },
      { t: 'Because Java has no `+` for ints', why: 'Java does, but it wraps round on overflow, which is wrong for JavaScript.' },
      { t: 'Because it throws on overflow, and `rewriteOn` turns that into a move to a more general case', correct: true, why: 'Java’s `int` addition would wrap to a negative number; JavaScript needs 2147483648.' },
      { t: 'Because it converts strings to numbers', why: 'It only adds ints; strings are handled by other cases.' },
    ],
  },
];
