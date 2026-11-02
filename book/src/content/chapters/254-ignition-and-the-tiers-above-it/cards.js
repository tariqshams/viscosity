// Ignition and the tiers above it: cards.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ignition-why': {
    q: 'What problem was V8’s Ignition interpreter originally built to solve?',
    a: 'Memory: its bytecode is a quarter to a half the size of the baseline machine code V8 used to generate for every function.',
  },
  'bytecode-shared': {
    q: 'Since V8 5.9 (2017), what does TurboFan compile from?',
    a: 'Ignition’s bytecode, not the source text; every function starts in Ignition, so the bytecode is the form all the tiers share.',
  },
  'param-count': {
    q: 'In V8 12.4, `--print-bytecode` reports “Parameter count 2” for `function sum(xs)`. Why 2?',
    a: 'The receiver (`this`) is passed as a hidden first parameter, so a function’s parameter count is its declared parameters plus one.',
  },
  'frame-size': {
    q: 'An Ignition listing (V8 12.4, 64-bit) says “Register count 3” and “Frame size 24”. How are the two related?',
    a: 'Ignition’s registers are 8-byte slots in the call’s stack frame, so three registers take 24 bytes.',
  },
  'source-pos': {
    q: 'In a `--print-bytecode` listing, what does a mark such as `57 S>` or `52 E>` give?',
    a: 'A source position: the character offset where a statement (S) or expression (E) begins, used to map bytecode back to the source.',
  },
  'jumploop-ops': {
    q: 'What are the three operands of V8’s `JumpLoop [26], [0], [7]` (V8 12.4)?',
    a: 'How many bytes to jump back (26), the loop depth (0 for an outermost loop) and a feedback slot (7).',
  },
  'sparkplug-ir': {
    q: 'What intermediate representation does V8’s Sparkplug build between bytecode and machine code?',
    a: 'None: it makes one pass over the bytecode (a switch inside a for loop) and emits machine code directly.',
  },
  'same-frame': {
    q: 'Why can a running call move from Ignition into Sparkplug code with almost no work?',
    a: 'Sparkplug code uses the interpreter’s frame layout, registers and all, so the values are already where it expects them.',
  },
  'sparkplug-batch': {
    q: 'In Node 22 (V8 12.4), does Sparkplug compile each warm function the moment it is warm?',
    a: 'No: it queues them and compiles a whole batch, on the main thread, once their estimated size passes a threshold (4096 by default).',
  },
  'maglev-node': {
    q: 'In Node v22.23.4, which V8 tier is turned off by default, and what happens if you ask for it with `--maglev`?',
    a: 'Maglev; even with `--maglev`, `%OptimizeMaglevOnNextCall` reports “Maglev is not enabled.”, so code goes from Sparkplug to TurboFan.',
  },
  'osr-what': {
    q: 'What is on-stack replacement (OSR)?',
    a: 'Switching a call that is already running into another tier’s code at a loop back edge, by building the new frame from the current one and jumping into the middle of the new code.',
  },
  'osr-where': {
    q: 'In V8, at which bytecode can a running loop enter OSR code, and how does `--trace-osr` name the place?',
    a: 'At the loop’s `JumpLoop`; the trace gives its bytecode offset as `osr offset`.',
  },
  'osr-not-installed': {
    q: 'In Node 22, after a single call has run its loop in TurboFan OSR code, is that code used for the function’s next call?',
    a: 'No: OSR code is for that loop entry; the function’s next call starts in its normal tier (here Sparkplug) and is optimised separately.',
  },
};

export const examples = {
  'osr-chunks': {
    title: 'One call, timed in blocks of trips',
    code: `function longSum(n) {
  let s = 0;
  let t = performance.now();
  for (let i = 0; i < n; i++) {
    s += i % 7;
    if (i % 2e5 === 199999) {
      const now = performance.now();
      const ms = (now - t).toFixed(1);
      console.log(i + 1, ms, 'ms');
      t = now;
    }
  }
  return s;
}
console.log(longSum(2e6));`,
  },
};

export const exercises = {
  findLoops: {
    title: 'Find the loops in a bytecode listing',
    prompt: 'Write `findLoops(listing)`. `listing` is the text of a `--print-bytecode` listing, one bytecode per line, such as `@ 30 : 8e 1a 00 07 JumpLoop [26], [0], [7]`. For every `JumpLoop` line, return an object `{ at, to, depth, slot }`: `at` is the offset of the `JumpLoop` itself (the number after `@`), `to` is the offset it jumps back to (`at` minus the first operand), `depth` is the second operand and `slot` the third. Return them in the order they appear; ignore every other line. These are the places where V8 can enter OSR code.',
    starter: `function findLoops(listing) {
  const out = [];
  // for each line containing JumpLoop,
  // read @ offset and the three [n]
  return out;
}`,
    solution: `function findLoops(listing) {
  const out = [];
  const lines = listing.split('\\n');
  for (const line of lines) {
    if (!line.includes('JumpLoop'))
      continue;
    const at = Number(
      line.match(/@\\s*(\\d+)/)[1]);
    const ops = [...line
      .matchAll(/\\[(\\d+)\\]/g)]
      .map((m) => Number(m[1]));
    const [back, depth, slot] = ops;
    out.push({ at, to: at - back,
      depth, slot });
  }
  return out;
}`,
    tests: `const SUM = [
  '@ 4 : 2f 03 00 00 GetNamedProperty a0, [0], [0]',
  '@ 8 : 71 f8 02 TestLessThan r1, [2]',
  '@ 30 : 8e 1a 00 07 JumpLoop [26], [0], [7]',
  '@ 34 : 0b f9 Ldar r0',
].join('\\n');
test('one loop in sum', () => {
  expect(findLoops(SUM)).toEqual([
    { at: 30, to: 4, depth: 0, slot: 7 }]);
});
test('no loops', () => {
  expect(findLoops('@ 0 : 0b 04 Ldar a1\\n@ 2 : ae Return'))
    .toEqual([]);
});
test('nested loops, inner first', () => {
  const L = [
    '@ 20 : 8e 0c 01 05 JumpLoop [12], [1], [5]',
    '@ 31 : 8e 1d 00 08 JumpLoop [29], [0], [8]',
  ].join('\\n');
  expect(findLoops(L)).toEqual([
    { at: 20, to: 8, depth: 1, slot: 5 },
    { at: 31, to: 2, depth: 0, slot: 8 }]);
});
test('ignores the feedback operands of other lines', () => {
  const r = findLoops(SUM);
  expect(r.length).toBe(1);
  expect(r[0].to).toBe(4);
});`,
    hints: [
      'Split the listing into lines and skip every line that does not contain `JumpLoop`.',
      'The offset is the number after `@`: a regular expression such as `/@\\s*(\\d+)/` finds it. The three operands are the numbers in square brackets: `matchAll(/\\[(\\d+)\\]/g)` finds them in order.',
      'With `const [back, depth, slot] = ops;`, push `{ at, to: at - back, depth, slot }`. Do not search the whole listing for brackets at once, or the `[0]` of other bytecodes gets mixed in.',
    ],
    walkthrough: `**How to think about it.** A listing is plain text, one bytecode per line, and only one kind of line matters here. For a \`JumpLoop\` line you need two things: where it is (the number after \`@\`) and its three bracketed operands, in order. The first operand is a distance, not an address, so the target is the line's own offset minus that distance; the other two are copied as they are. Working line by line keeps the operands of one bytecode from mixing with another's.

**The solution, line by line.**

- \`const out = [];\` collects one object per loop.
- \`for (const line of listing.split('\\\\n')) {\` walks the listing one bytecode at a time.
- \`if (!line.includes('JumpLoop')) continue;\` skips every other bytecode.
- \`const at = Number(line.match(/@\\\\s*(\\\\d+)/)[1]);\` finds \`@\`, any spaces, and the digits after them; group 1 is the offset, as text, so \`Number\` turns it into a number.
- \`const ops = [...line.matchAll(/\\\\[(\\\\d+)\\\\]/g)].map((m) => Number(m[1]));\` finds every \`[n]\` on the line, in order, and keeps the numbers.
- \`const [back, depth, slot] = ops;\` names them: the jump distance, the loop depth and the feedback slot.
- \`out.push({ at, to: at - back, depth, slot });\` records the loop; for \`sum\`, 30 − 26 = 4, the loop test.
- \`return out;\` returns the loops in listing order, which for nested loops puts the inner \`JumpLoop\` first, since it comes earlier in the bytecode.

**Common wrong attempts.**

- Taking \`to\` as the first operand itself: \`[26]\` is how far back to jump, not where to; the loop test is at 4, not 26.
- Matching brackets across the whole listing: the \`[0]\`, \`[2]\` and so on of other bytecodes come first, and the operands are wrong.
- Matching the hex bytes (\`1a 00 07\`) instead of the decoded operands: they are the same numbers in hex, so parsing them as decimal gives nonsense (\`1a\` is not a decimal number).`,
    wrong: [
      {
        code: `function findLoops(listing) {
  const out = [];
  const lines = listing.split('\\n');
  for (const line of lines) {
    if (!line.includes('JumpLoop'))
      continue;
    const at = Number(
      line.match(/@\\s*(\\d+)/)[1]);
    const ops = [...line
      .matchAll(/\\[(\\d+)\\]/g)]
      .map((m) => Number(m[1]));
    out.push({ at, to: ops[0],
      depth: ops[1], slot: ops[2] });
  }
  return out;
}`,
        why: 'The first operand is a distance back, so `to` must be `at - ops[0]`; this gives 26 for `sum` instead of 4.',
      },
      {
        code: `function findLoops(listing) {
  const ops = [...listing
    .matchAll(/\\[(\\d+)\\]/g)]
    .map((m) => Number(m[1]));
  const at = Number(listing
    .match(/@\\s*(\\d+)\\s*:\\s*8e/)[1]);
  return [{ at, to: at - ops[0],
    depth: ops[1], slot: ops[2] }];
}`,
        why: 'It reads brackets from the whole listing, so the operands of earlier bytecodes are taken for the loop’s; it also always returns exactly one loop, and fails when there are none.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Before V8 5.9 (2017), what ran a JavaScript function the first time it was called?',
    options: [
      {
        t: 'Ignition, as today',
        why: 'Ignition shipped as the first tier for every function only from V8 5.9.',
      },
      {
        t: 'Full-codegen, a quick compiler to machine code, with Crankshaft above it',
        correct: true,
        why: 'Right: Ignition replaced it largely to save memory, since bytecode is a quarter to a half the size of that machine code.',
      },
      {
        t: 'TurboFan, compiling from the source text',
        why: 'TurboFan was the top tier, not the first; and since 2017 it compiles from bytecode.',
      },
    ],
  },
  {
    q: 'A V8 12.4 listing for a function with three declared parameters, on a 64-bit machine, says “Register count 2”. What are its parameter count and frame size?',
    options: [
      {
        t: 'Parameter count 3, frame size 16',
        why: 'The parameter count includes the receiver, `this`, so it is one more than declared.',
      },
      {
        t: 'Parameter count 4, frame size 16',
        correct: true,
        why: 'Right: three declared parameters plus the receiver, and two 8-byte register slots.',
      },
      {
        t: 'Parameter count 4, frame size 2',
        why: 'The frame size is in bytes, and each register is an 8-byte slot.',
      },
      {
        t: 'Parameter count 3, frame size 40',
        why: 'Parameters are not counted in the frame size; they sit above the frame.',
      },
    ],
  },
  {
    q: '`@ 41 : 8e 21 00 09 JumpLoop [33], [0], [9]`. Where does it jump to?',
    options: [
      {
        t: 'Offset 33',
        why: 'The first operand is a distance back, not a target offset.',
      },
      {
        t: 'Offset 8, the top of an outermost loop',
        correct: true,
        why: 'Right: 41 − 33 = 8, and loop depth 0 means it is not nested in another loop.',
      },
      {
        t: 'Offset 9, its feedback slot',
        why: '[9] is a feedback slot number, not a place in the bytecode.',
      },
    ],
  },
  {
    q: 'Why does V8’s Sparkplug compile so much faster than an optimising compiler?',
    options: [
      {
        t: 'It builds no IR: one pass over the bytecode, mostly emitting calls to the interpreter’s helpers, in the interpreter’s frame layout',
        correct: true,
        why: 'Right: the bytecode generator has already done the analysis, so there is nothing to optimise or translate.',
      },
      {
        t: 'It compiles only the hottest loop of each function',
        why: 'It compiles whole functions, in batches.',
      },
      {
        t: 'It runs on many threads at once',
        why: 'In Node 22 it compiles each batch on the main thread.',
      },
    ],
  },
  {
    q: 'A function is called once and spends seconds in one loop. How can V8 run most of that loop in TurboFan code?',
    options: [
      {
        t: 'It cannot: optimised code is only used from the next call',
        why: 'That is true of normal tier-up, but OSR exists exactly for this case.',
      },
      {
        t: 'It restarts the call from the beginning in TurboFan code',
        why: 'The call may already have had effects; V8 never restarts it.',
      },
      {
        t: 'On-stack replacement: it compiles a version that enters at the loop, and jumps into it from a JumpLoop with the current values',
        correct: true,
        why: 'Right: `--trace-osr` names the entry by the JumpLoop’s bytecode offset.',
      },
    ],
  },
  {
    q: 'In Node 22, `node --maglev` runs a program that calls `%OptimizeMaglevOnNextCall(f)`. What happens?',
    options: [
      {
        t: 'f is compiled with Maglev on its next call',
        why: 'This build does not enable Maglev even with the flag.',
      },
      {
        t: 'Node refuses to start: --maglev is not a flag',
        why: 'The flag exists (default --no-maglev); it just has no effect here.',
      },
      {
        t: 'It prints “Maglev is not enabled.” and f carries on in its usual tiers',
        correct: true,
        why: 'Right: so code goes from Sparkplug straight to TurboFan. Defaults differ between builds and versions.',
      },
    ],
  },
];
