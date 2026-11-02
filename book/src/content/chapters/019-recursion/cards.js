// Chapter 19 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rec-what': {
    q: 'What is a recursive function?',
    a: 'A function that calls itself, each time on a smaller version of the problem.',
  },
  'base-case': {
    q: 'What is the **base case** of a recursive function?',
    a: 'An input the function answers directly, without calling itself. It is where the recursion stops.',
  },
  smaller: {
    q: 'Why must every recursive call work on a *smaller* problem?',
    a: 'So the calls are guaranteed to reach the base case eventually, instead of going on forever.',
  },
  'frame-what': {
    q: 'What is a stack frame?',
    a: 'The page one unfinished call keeps for its own parameters and local variables.',
  },
  'stack-order': {
    q: 'Calls A, then B, then C are on the call stack. Which one finishes first, and why?',
    a: 'C. It was pushed last, so it is on top: the last call to start is the first to finish.',
  },
  paused: {
    q: 'While `sumTo(2)` is running inside `sumTo(3)`, what is the `sumTo(3)` frame doing?',
    a: 'Waiting, paused part-way through `3 + sumTo(2)`, with its own `n` still 3.',
  },
  'overflow-cause': {
    q: 'What causes a **stack overflow**?',
    a: 'Too many unfinished calls, usually recursion that never reaches its base case: frames keep being pushed until the stack runs out of space.',
  },
  'never-reached': {
    q: '`sumTo` has the base case `if (n === 0)`. What happens with `sumTo(-1)`?',
    a: 'It asks about -2, -3, … and never reaches 0, so it ends in a stack overflow.',
  },
};

export const examples = {
  'down-up': {
    title: 'Down the stack and back up',
    code: `function down(n) {
  if (n === 0) {
    console.log('bottom');
    return;
  }
  console.log('in ' + n);
  down(n - 1);
  console.log('out ' + n);
}

down(3);`,
  },
};

export const exercises = {
  power: {
    title: 'Powers, recursively',
    prompt: 'Write a **recursive** `power(b, e)` that returns `b` multiplied by itself `e` times, for any whole number `e` that is 0 or more. Anything to the power 0 is `1`. For example `power(2, 3)` is `8` and `power(5, 0)` is `1`. Do not use a loop or `**`: let the function call itself.',
    starter: `function power(b, e) {
  // your code here
}

console.log(power(2, 3));`,
    solution: `function power(b, e) {
  if (e === 0) {
    return 1;
  }
  return b * power(b, e - 1);
}`,
    tests: `test('power(2, 3) is 8', () => {
  expect(power(2, 3)).toBe(8);
});
test('anything to the power 0 is 1', () => {
  expect(power(5, 0)).toBe(1);
  expect(power(0, 0)).toBe(1);
});
test('power 1 is the number itself', () => {
  expect(power(7, 1)).toBe(7);
});
test('bigger powers', () => {
  expect(power(3, 4)).toBe(81);
  expect(power(10, 5)).toBe(100000);
});`,
    hints: [
      'Which power can you answer without any multiplying at all? That is your base case.',
      'Anything to the power 0 is 1, so `if (e === 0) return 1;`.',
      'For a bigger `e`, notice that 2 to the power 3 is 2 times (2 to the power 2). In code: `b * power(b, e - 1)`.',
    ],
    walkthrough: `**How to think about it.** Recursion asks two questions. First: which input is so small you know the answer without thinking? Here it is \`e = 0\`, because anything to the power 0 is 1. Second: if someone handed you the answer to a slightly smaller problem, how would you finish the job? If you knew \`power(2, 2)\` is 4, then \`power(2, 3)\` is one more multiplication by 2: 8. The trick is to **trust** the function you are writing: assume \`power(b, e - 1)\` already works, and use it.

**The solution, line by line.**

- \`function power(b, e) {\` takes the base \`b\` and the exponent \`e\`.
- \`  if (e === 0) {\` checks for the base case.
- \`    return 1;\` answers it directly, with no further call. This is what makes the recursion stop.
- \`  }\` ends the base case.
- \`  return b * power(b, e - 1);\` is the recursive case: work out the power one smaller (\`e - 1\`, so every call gets closer to 0), then multiply by \`b\` once more.
- \`}\` ends the function.

Trace \`power(2, 3)\`: it waits on \`power(2, 2)\`, which waits on \`power(2, 1)\`, which waits on \`power(2, 0)\`. That one is the base case and returns 1, so the frames pop in reverse: \`2 * 1 = 2\`, then \`2 * 2 = 4\`, then \`2 * 4 = 8\`. At the deepest point there were four \`power\` frames on the stack.

**Common wrong attempts.**

- Using \`e === 1\` (returning \`b\`) as the only base case looks fine until \`power(5, 0)\`: \`e\` goes 0, -1, -2 and never meets 1, so the stack overflows.
- Returning \`0\` from the base case makes every answer 0, because the multiplication chain ends with \`* 0\`.
- Forgetting the \`return\` on the last line: the multiplication is worked out and thrown away, and the call gives \`undefined\`.`,
    wrong: [
      {
        code: `function power(b, e) {
  if (e === 1) {
    return b;
  }
  return b * power(b, e - 1);
}`,
        why: 'For `e = 0` the calls go to -1, -2, ... and never reach 1: a stack overflow. The base case must be `e === 0`, returning 1.',
      },
      {
        code: `function power(b, e) {
  if (e === 0) {
    return 0;
  }
  return b * power(b, e - 1);
}`,
        why: 'Every chain of multiplications ends with the base case, so returning 0 there makes every answer 0. Anything to the power 0 is 1.',
      },
    ],
  },
  collatz: {
    optional: true,
    title: 'How many steps to 1?',
    prompt: 'Start with a whole number `n` of 1 or more. If it is even, halve it; if it is odd, make it `3 * n + 1`; repeat until you reach 1. Write a **recursive** `steps(n)` that returns how many steps that takes. `steps(1)` is `0`, `steps(2)` is `1` (2 → 1) and `steps(6)` is `8` (6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1).',
    starter: `function steps(n) {
  // your code here
}

console.log(steps(6));`,
    solution: `function steps(n) {
  if (n === 1) {
    return 0;
  }
  if (n % 2 === 0) {
    return 1 + steps(n / 2);
  }
  return 1 + steps(3 * n + 1);
}`,
    tests: `test('1 takes no steps', () => {
  expect(steps(1)).toBe(0);
});
test('2 takes one step', () => {
  expect(steps(2)).toBe(1);
});
test('6 takes eight steps', () => {
  expect(steps(6)).toBe(8);
});
test('27 takes 111 steps', () => {
  expect(steps(27)).toBe(111);
});`,
    hints: [
      'The base case is the number where you stop: 1, which needs no more steps.',
      'A number is even when `n % 2 === 0` (the remainder after dividing by 2 is 0).',
      'One step, plus however many steps the next number needs: `return 1 + steps(n / 2);` for even `n`, and `1 + steps(3 * n + 1)` for odd.',
    ],
    walkthrough: `**How to think about it.** "How many steps from \`n\` to 1?" contains a smaller question: "how many steps from the *next* number to 1?" If you knew that, you would add one (the step you just took). And at 1 itself there is nothing left to do, so the answer is 0: that is the base case.

**The solution, line by line.**

- \`function steps(n) {\` takes the starting number.
- \`  if (n === 1) {\` and \`    return 0;\` handle the end of the journey: no more steps.
- \`  }\` ends the base case.
- \`  if (n % 2 === 0) {\` checks for an even number.
- \`    return 1 + steps(n / 2);\` takes one step (halving) and adds the steps from there.
- \`  }\` ends that case.
- \`  return 1 + steps(3 * n + 1);\` handles odd numbers the same way.
- \`}\` ends the function.

Here is a curious fact: unlike every other recursion in this chapter, nobody has ever proved that this one always reaches its base case. The numbers sometimes climb a long way before falling (27 takes 111 steps and passes 9,000 on the way), and mathematicians have checked an enormous range of starting values without finding one that never comes down, but no proof is known. "Does every call get closer to the base case?" is usually easy to answer; here it is a famous open question (the *Collatz conjecture*).

**Common wrong attempts.**

- Returning \`steps(n / 2)\` without the \`1 +\` counts nothing: every answer comes back as 0, the base case's value.
- Using \`n === 0\` as the base case: the sequence reaches 1, then 4, 2, 1 again for ever, and never hits 0, so the stack overflows.`,
    wrong: [
      {
        code: `function steps(n) {
  if (n === 1) {
    return 0;
  }
  if (n % 2 === 0) {
    return steps(n / 2);
  }
  return steps(3 * n + 1);
}`,
        why: 'No step is ever counted, so every call returns 0, the base case’s answer. Add `1 +` in front of each recursive call.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
function f(n) {
  if (n === 1) {
    return 1;
  }
  return n * f(n - 1);
}
console.log(f(4));
\`\`\``,
    options: [
      {
        t: '`4`',
        why: 'That would be `f(4)` without the recursive call. Here `4` is multiplied by `f(3)`.',
      },
      {
        t: '`10`',
        why: 'That is 4 + 3 + 2 + 1. This function multiplies.',
      },
      {
        t: '`24`',
        correct: true,
        why: '4 × f(3) = 4 × 3 × f(2) = 4 × 3 × 2 × f(1) = 4 × 3 × 2 × 1 = 24.',
      },
      {
        t: 'A stack overflow',
        why: 'Each call uses a smaller `n`, so the calls reach the base case `n === 1`.',
      },
    ],
  },
  {
    q: 'In `sumTo(3)`, at the moment the base case `sumTo(0)` is running, how many `sumTo` frames are on the call stack?',
    options: [
      {
        t: '1',
        why: 'The earlier calls haven’t finished: each is waiting for the one above it.',
      },
      {
        t: '4',
        correct: true,
        why: '`sumTo(3)`, `sumTo(2)`, `sumTo(1)` and `sumTo(0)` have all started, and none has returned yet.',
      },
      {
        t: '3',
        why: 'Count `sumTo(0)` itself: it is on top of the other three.',
      },
      {
        t: '0',
        why: 'A running call always has a frame.',
      },
    ],
  },
  {
    q: `What does \`down(2)\` print, in order?
\`\`\`
function down(n) {
  if (n === 0) { return; }
  console.log('in ' + n);
  down(n - 1);
  console.log('out ' + n);
}
\`\`\``,
    options: [
      {
        t: '`in 2, out 2, in 1, out 1`',
        why: 'The `out` line waits until the recursive call has finished, and that call prints its own lines first.',
      },
      {
        t: '`in 2, in 1, out 2, out 1`',
        why: 'The `out` lines come in reverse: the most recent call finishes first.',
      },
      {
        t: '`in 1, in 2, out 2, out 1`',
        why: 'The first call is `down(2)`, so `in 2` prints first.',
      },
      {
        t: '`in 2, in 1, out 1, out 2`',
        correct: true,
        why: 'Going down prints `in 2`, `in 1`. Then the frames pop in reverse order: `out 1`, then `out 2`.',
      },
    ],
  },
  {
    q: 'Which of these will cause a stack overflow?',
    options: [
      {
        t: '`function g(n) { if (n <= 0) return 0; return g(n - 1); }` called as `g(5)`',
        why: 'Each call gets closer to 0 and stops there.',
      },
      {
        t: '`function g(n) { if (n === 0) return 0; return g(n - 2); }` called as `g(5)`',
        correct: true,
        why: '5, 3, 1, -1, -3 … skips right past 0. The base case exists but is never reached.',
      },
      {
        t: '`function g(n) { return n * 2; }` called as `g(5)`',
        why: 'No recursion at all: one call, one frame.',
      },
      {
        t: '`function g(n) { if (n === 0) return 0; return g(n - 1); }` called as `g(5)`',
        why: 'Counting down by 1 from 5 lands exactly on 0.',
      },
    ],
  },
  {
    q: 'A recursive function goes far too deep. What happens in C, compared with JavaScript?',
    options: [
      {
        t: 'C gives the same RangeError as JavaScript',
        why: 'RangeError is JavaScript’s; C has no such check.',
      },
      {
        t: 'C checks nothing, so the program usually just crashes',
        correct: true,
        why: 'JavaScript stops with a RangeError; C runs off the end of its stack and typically crashes with no friendly message.',
      },
      {
        t: 'C makes the stack bigger automatically',
        why: 'The stack has a fixed size in C too.',
      },
      {
        t: 'C does not allow recursion',
        why: 'It does; the function looks almost the same as in JavaScript.',
      },
    ],
  },
];
