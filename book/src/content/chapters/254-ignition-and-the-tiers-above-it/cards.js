// Chapter 249 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ignition-why': {
    q: 'What problem was Ignition originally built to solve?',
    a: 'Memory: its bytecode is a quarter to a half the size of the baseline machine code V8 used to generate.',
  },
  accumulator: {
    q: 'In Ignition’s `Ldar a1; Add a0, [0]; Return`, where does the sum end up?',
    a: 'In the accumulator, the implicit register most bytecodes read and write. `Return` returns it.',
  },
  'feedback-slot': {
    q: 'What is the `[0]` in `Add a0, [0]`?',
    a: 'A feedback slot number: where the handler records what kinds of values this addition saw.',
  },
  'sparkplug-removes': {
    q: 'Sparkplug does no optimisations. What does it remove, then?',
    a: 'The interpreter’s overhead: decoding each instruction’s operands and dispatching to the next one.',
  },
  speculate: {
    q: 'What does it mean that Maglev and TurboFan make **speculative** code?',
    a: 'The code assumes what the feedback saw will keep happening (for example, small integers) and checks that assumption, bailing out if it fails.',
  },
  'sparkplug-batch': {
    q: 'In Node 22, does Sparkplug compile each warm function the moment it is warm?',
    a: 'No: it queues them and compiles a whole batch once their estimated size passes a threshold (4096), on the main thread.',
  },
  'maglev-node': {
    q: 'Why did the tier-watching run never show Maglev?',
    a: 'In this Node 22 build Maglev is not enabled (even `--maglev` reports “Maglev is not enabled.”), so code goes from Sparkplug to TurboFan.',
  },
  'why-fall': {
    q: 'Why did `add` drop out of TurboFan near call 65,536?',
    a: 'The running sum passed the largest Smi (2³¹ − 1), so TurboFan’s assumption of small integers failed and its code was thrown away.',
  },
};

export const examples = {
  acc: {
    title: 'a + b + c on a stack and in an accumulator',
    code: `const a = 1, b = 2, c = 3;
// Drip-style: a stack of values
const st = [];
st.push(a);
st.push(b);
st.push(st.pop() + st.pop());
st.push(c);
st.push(st.pop() + st.pop());
console.log('stack:', st.pop());
// Ignition-style: one accumulator
let acc = c;    // Ldar c
acc = b + acc;  // Add b
acc = a + acc;  // Add a
console.log('accumulator:', acc);
// Same answer; count the steps.`,
  },
};

export const exercises = {
  runAcc: {
    title: 'A tiny accumulator machine',
    prompt: 'Write `runAcc(code, regs, fb)`, an interpreter for five Ignition-style instructions. `code` is an array of instructions such as `[\'Ldar\', \'a1\']`. `regs` is an object of registers, like `{ a0: 2, a1: 3 }`, and `fb` is an array of feedback slots. The instructions are: `[\'LdaSmi\', n]` puts the number `n` in the accumulator; `[\'Ldar\', r]` copies register `r` into the accumulator; `[\'Star\', r]` copies the accumulator into register `r`; `[\'Add\', r, k]` sets the accumulator to `regs[r] + acc` (in that order) and sets `fb[k]` to `\'number\'` if both operands were numbers, or `\'any\'` otherwise; `[\'Return\']` returns the accumulator.',
    starter: `function runAcc(code, regs, fb) {
  let acc;
  return acc;
}`,
    solution: `function runAcc(code, regs, fb) {
  let acc;
  for (const [op, x, k] of code) {
    if (op === 'LdaSmi') acc = x;
    if (op === 'Ldar') acc = regs[x];
    if (op === 'Star') regs[x] = acc;
    if (op === 'Add') {
      const r = regs[x];
      const num = typeof r === 'number'
        && typeof acc === 'number';
      fb[k] = num ? 'number' : 'any';
      acc = r + acc;
    }
    if (op === 'Return') return acc;
  }
}`,
    tests: `const ADD = [['Ldar', 'a1'], ['Add', 'a0', 0],
  ['Return']];
test('add(2, 3) is 5', () => {
  expect(runAcc(ADD, { a0: 2, a1: 3 }, [])).toBe(5);
});
test('Add records number feedback', () => {
  const fb = [];
  runAcc(ADD, { a0: 2, a1: 3 }, fb);
  expect(fb[0]).toBe('number');
});
test('strings: a0 comes first, feedback is any', () => {
  const fb = [];
  const r = runAcc(ADD, { a0: 'a', a1: 'b' }, fb);
  expect(r).toBe('ab');
  expect(fb[0]).toBe('any');
});
test('LdaSmi and Star', () => {
  const regs = { a0: 10 };
  const code = [['LdaSmi', 5], ['Star', 'r0'],
    ['Ldar', 'a0'], ['Add', 'r0', 1], ['Return']];
  expect(runAcc(code, regs, [])).toBe(15);
  expect(regs.r0).toBe(5);
});`,
    hints: [
      'Your Drip VM had a loop that read one instruction at a time and did what it said. This is the same loop, with one variable, `acc`, instead of a stack.',
      'Loop over `code` with `for (const [op, x, k] of code)`, so each instruction is split into its name and operands. Then one `if` per instruction name (an instruction has only one name, so at most one of them runs).',
      'For `Add`: read `const r = regs[x]`, set `fb[k]` by checking `typeof r === \'number\' && typeof acc === \'number\'`, then `acc = r + acc` (register first, as Ignition does). `Return` is `return acc;`.',
    ],
    walkthrough: `**How to think about it.** You have already built a dispatch loop for Drip: read an instruction, decide what it is, do it, move on. An accumulator machine is the same loop with a different place to keep values: instead of a stack, one variable (\`acc\`) that most instructions read or write, plus named registers in \`regs\`. Write down, for each of the five instructions, what it does to \`acc\`, \`regs\` and \`fb\`, and the code follows almost word for word. The one detail to watch is the order in \`Add\`: Ignition's \`Add a0\` computes \`a0 + acc\`, which matters for strings.

**The solution, line by line.**

- \`function runAcc(code, regs, fb) {\` receives the instructions, the registers and the feedback slots.
- \`  let acc;\` is the accumulator; it starts empty (\`undefined\`).
- \`  for (const [op, x, k] of code) {\` is the dispatch loop. Each instruction is an array, and destructuring splits it into the instruction's name \`op\` and up to two operands, \`x\` and \`k\` (missing ones are \`undefined\`).
- \`    if (op === 'LdaSmi') acc = x;\` loads a constant: the operand itself is the value.
- \`    if (op === 'Ldar') acc = regs[x];\` loads a register into the accumulator; \`x\` is the register's name.
- \`    if (op === 'Star') regs[x] = acc;\` goes the other way, storing the accumulator into a register, so it survives later instructions.
- \`    if (op === 'Add') {\` begins the one instruction with feedback. (Separate \`if\`s are fine here: each instruction has one name, so only one of them matches.)
- \`      const r = regs[x];\` reads the register operand.
- \`      const num = typeof r === 'number'\` and the next line, \`&& typeof acc === 'number';\`, ask whether both operands were numbers.
- \`      fb[k] = num ? 'number' : 'any';\` writes what was seen into slot \`k\`: this is the note Ignition leaves for the compilers above.
- \`      acc = r + acc;\` does the work, register first.
- \`    }\` ends the \`Add\` case.
- \`    if (op === 'Return') return acc;\` ends the run with the accumulator's value.
- The closing braces end the loop and the function.

Trace the first test: \`Ldar a1\` makes \`acc\` 3; \`Add a0, 0\` reads \`r = 2\`, sees two numbers, records \`'number'\` in \`fb[0]\` and makes \`acc\` 5; \`Return\` returns 5. Three instructions, no stack.

**Common wrong attempts.**

- Writing \`acc = acc + r\`: for numbers it gives the same answer, but for strings \`'b' + 'a'\` is \`'ba'\`, not \`'ab'\`; the order of \`+\` matters in JavaScript.
- Forgetting \`Star\`: the last test stores 5 into \`r0\` first, then adds through it, so a machine that ignores \`Star\` reads \`undefined\` and returns \`NaN\`.
- Recording feedback from the result instead of the operands: \`'a' + 'b'\` is a string either way, but \`1 + '1'\` shows why the operands, not the result, are what an optimising compiler needs to know.`,
    wrong: [
      {
        code: `function runAcc(code, regs, fb) {
  let acc;
  for (const [op, x, k] of code) {
    if (op === 'Ldar') acc = regs[x];
    else if (op === 'Add') {
      fb[k] = 'number';
      acc = acc + regs[x];
    } else if (op === 'Return') {
      return acc;
    }
  }
}`,
        why: 'Three mistakes: no `LdaSmi` or `Star`, feedback always says `number`, and `acc + regs[x]` puts the operands in the wrong order, so the string test gives `\'ba\'`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Drip’s VM needs `load.local, load.local, add` where Ignition needs `Ldar, Add`. Why?',
    options: [
      {
        t: 'Ignition skips reading one of the parameters',
        why: 'Both are read: one by `Ldar`, one as `Add`’s register operand.',
      },
      {
        t: 'Ignition is a register machine whose accumulator is an implicit operand',
        correct: true,
        why: '`Add a0` adds a register to the accumulator directly, so nothing needs pushing first.',
      },
      {
        t: 'Drip’s VM is badly written',
        why: 'It is a faithful stack machine. Stack machines need explicit pushes.',
      },
    ],
  },
  {
    q: 'In `Add a0, [0]`, what is `[0]`?',
    options: [
      {
        t: 'The constant 0 being added',
        why: 'The value added is in register `a0`. The bracketed operand is something else.',
      },
      {
        t: 'The address of the result',
        why: 'The result goes into the accumulator, implicitly.',
      },
      {
        t: 'The line number',
        why: 'Source positions are stored in a separate table, not as operands.',
      },
      {
        t: 'A feedback slot where Ignition records what kinds of values it saw',
        correct: true,
        why: 'The optimising tiers later read this feedback to decide what to specialise for.',
      },
    ],
  },
  {
    q: 'What does Sparkplug remove, if it does no optimisations?',
    options: [
      {
        t: 'The cost of decoding bytecode and dispatching to the next instruction',
        correct: true,
        why: 'Its machine code does the same work as the interpreter, minus the dispatch loop.',
      },
      {
        t: 'The need for feedback',
        why: 'Sparkplug calls the same helpers as the interpreter and keeps the same frame layout; feedback is still collected.',
      },
      {
        t: 'Parsing',
        why: 'Sparkplug starts from bytecode, which parsing already produced.',
      },
    ],
  },
  {
    q: 'In the chapter’s Node 22 runs, why did `add` never use Maglev?',
    options: [
      {
        t: 'Maglev was removed from V8 in 2023',
        why: 'It was introduced in 2023, in Chrome M117.',
      },
      {
        t: '`add` was not hot enough',
        why: 'It was hot enough for TurboFan, the tier above Maglev.',
      },
      {
        t: 'This Node build does not enable Maglev; even `--maglev` reports “Maglev is not enabled.”',
        correct: true,
        why: 'So the run went Ignition, Sparkplug, TurboFan. Defaults differ between builds and versions.',
      },
    ],
  },
  {
    q: 'Near call 65,536, `add` left TurboFan. What failed?',
    options: [
      {
        t: 'The guess that `a` and `b` are small integers: the sum passed 2³¹ − 1, the largest Smi',
        correct: true,
        why: '`--trace-deopt` reports `reason: not a Smi`. The program carried on, correctly, in a slower tier.',
      },
      {
        t: 'TurboFan ran out of memory',
        why: 'The trace names the reason, and it is about the value, not memory.',
      },
      {
        t: 'JavaScript numbers overflowed',
        why: 'JavaScript numbers go far beyond 2³¹; only the engine’s small-integer form has that limit.',
      },
      {
        t: 'The feedback slot was full',
        why: 'A slot does not fill up; it records kinds of value, and widens.',
      },
    ],
  },
];
