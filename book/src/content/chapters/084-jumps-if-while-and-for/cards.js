// Chapter 84 cards. Keys are stable ids: never rename them.

export const prompts = {
  'jump-what': {
    q: 'What does a **jump** instruction do?',
    a: 'It changes the instruction pointer, so execution continues somewhere other than the next instruction.',
  },
  'jif-peeks': {
    q: 'Does Drip’s `JUMP_IF_FALSE` pop the condition?',
    a: 'No, it only peeks. The compiler emits a `POP` on each path that continues.',
  },
  'offset-from': {
    q: 'A jump’s distance is counted from which byte?',
    a: 'From the byte just after the jump’s two operand bytes: `readShort` has already moved `ip` past them.',
  },
  'why-placeholder': {
    q: 'Why does `emitJump` write `0xff 0xff` instead of the real distance?',
    a: 'The target hasn’t been compiled yet, so the distance isn’t known. The placeholder is filled in later.',
  },
  'patch-math': {
    q: 'A placeholder starts at offset 2, and the code is now 11 bytes long. What distance does `patchJump(2)` write?',
    a: '11 − 2 − 2 = 7: the jump will land at offset 11.',
  },
  'if-has-jump': {
    q: 'Why does an `if` end its then-branch with an unconditional `JUMP`?',
    a: 'To skip the else part (and its `POP`) after the then-branch has run.',
  },
  'loop-no-patch': {
    q: 'Why does the `LOOP` at the end of a `while` need no backpatching?',
    a: 'It jumps backwards, to code already compiled, so the distance is known when it is emitted.',
  },
  'for-increment': {
    q: 'In a compiled `for`, why is there a `JUMP` right before the increment’s code?',
    a: 'The increment is emitted where it is written, before the body, but must run after it. The jump skips it on the way into the body.',
  },
  'and-peek': {
    q: 'In `false and f()`, why is the left `false` still there to print after the jump?',
    a: '`JUMP_IF_FALSE` doesn’t pop, so the left value stays on the stack as the result.',
  },
  'or-two-jumps': {
    q: 'How many jumps does `a or b` compile to?',
    a: 'Two: a `JUMP_IF_FALSE` over a `JUMP`. A truthy `a` takes the `JUMP` past `b`.',
  },
};

export const examples = {
  short: {
    title: 'Skipped right operands',
    lang: 'drip-vm',
    code: `let n = 0;
fn bump() {
  n = n + 1;
  return true;
}

print false and bump();
print true or bump();
print nil or "default";
print n;`,
  },
};

const ERR = `const BIG =
  'Too much code to jump over.';
`;
const HEAD = `${ERR}
// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {`;
const MID = `
// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {`;

const EMIT_OK = `
  code.push(op, 0xff, 0xff);
  return code.length - 2;
}`;
const PATCH_OK = `
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`;

export const exercises = {
  patch: {
    title: 'emitJump and patchJump',
    prompt: `\`code\` is a chunk's byte array. Write the two backpatching helpers:

- \`emitJump(code, op)\` pushes \`op\` and two placeholder bytes \`0xff 0xff\`, and returns the **index of the first placeholder byte**.
- \`patchJump(code, at)\` fills in the placeholder at \`at\` so that the jump lands at \`code.length\` (the next byte to be written). The distance is counted from just after the two operand bytes, and stored high byte first. If it is more than \`0xffff\`, \`throw new Error(BIG)\`.`,
    starter: `${HEAD}
  // your code here
}
${MID}
  // your code here
}`,
    solution: `${HEAD}${EMIT_OK}
${MID}${PATCH_OK}`,
    tests: `const JIF = 26;
const read = (c, at) =>
  (c[at] << 8) | c[at + 1];
test('emitJump writes 3 bytes', () => {
  const c = [2];
  expect(emitJump(c, JIF)).toBe(2);
  expect(c).toEqual([2, JIF, 255, 255]);
});
test('patch a short jump', () => {
  const c = [];
  const at = emitJump(c, JIF);
  c.push(4, 0, 0, 24);
  patchJump(c, at);
  expect(c.slice(0, 3))
    .toEqual([JIF, 0, 4]);
});
test('lands at the end of the code', () => {
  const c = [2];
  const at = emitJump(c, JIF);
  c.push(4, 0, 0, 24, 25, 9, 9);
  patchJump(c, at);
  expect(at + 2 + read(c, at))
    .toBe(c.length);
});
test('high byte first', () => {
  const c = [];
  const at = emitJump(c, JIF);
  for (let i = 0; i < 300; i++) {
    c.push(4);
  }
  patchJump(c, at);
  expect(c[at]).toBe(1);
  expect(c[at + 1]).toBe(44);
});
test('too far to jump', () => {
  const c = [];
  const at = emitJump(c, JIF);
  for (let i = 0; i < 70000; i++) {
    c.push(4);
  }
  expect(() => patchJump(c, at))
    .toThrow();
});`,
    hints: [
      '`emitJump`: after `code.push(op, 0xff, 0xff)`, the first placeholder byte is at `code.length - 2`.',
      '`patchJump`: the jump will continue from `at + 2`, so the distance is `code.length - at - 2`.',
      'High byte: `(d >> 8) & 0xff`. Low byte: `d & 0xff`.',
    ],
    walkthrough: `These are \`emitJump\` and \`patchJump\` from \`compiler.ts\`, taking the byte array as a parameter.

- **What \`emitJump\` returns.** The compiler has to come back to the *operand*, not the opcode, so it remembers \`code.length - 2\`, the first of the two placeholder bytes.
- **The distance.** At run time, \`readShort\` reads both operand bytes, leaving \`ip\` at \`at + 2\`. Adding the distance must give the target, \`code.length\`, so the distance is \`code.length - (at + 2)\`. The third test checks exactly that equation.
- **Two bytes, high first.** \`d >> 8\` keeps the top 8 of the 16 bits and \`d & 0xff\` the bottom 8. 300 is \`1 * 256 + 44\`, hence 1 and 44. The VM reassembles them with \`(hi << 8) | lo\`.
- **The limit.** Two bytes can only count up to 65,535. A then-branch longer than that can't be jumped over, and the compiler reports it rather than writing a wrapped-around, wrong distance.

\`\`\`js
const d = code.length - at - 2;
if (d > 0xffff) throw new Error(BIG);
code[at] = (d >> 8) & 0xff;
code[at + 1] = d & 0xff;
\`\`\``,
    wrong: [
      {
        code: `${HEAD}${EMIT_OK}
${MID}
  const d = code.length - at;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`,
        why: 'This counts from the placeholder itself, but the VM counts from *after* the two operand bytes. Every jump would land two bytes too far, in the middle of an instruction.',
      },
      {
        code: `${HEAD}${EMIT_OK}
${MID}
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = d & 0xff;
  code[at + 1] = (d >> 8) & 0xff;
}`,
        why: 'The bytes are swapped: low byte first. Short jumps under 256 even look right in some tests by accident, but the VM reads the high byte first, so 300 would be read as 44 × 256 + 1.',
      },
      {
        code: `${HEAD}
  code.push(op, 0xff, 0xff);
  return code.length;
}
${MID}${PATCH_OK}`,
        why: '`emitJump` returns the index *after* the placeholder, so `patchJump` overwrites the wrong two bytes and leaves `0xff 0xff` in the jump.',
      },
    ],
  },
  powers: {
    optional: true,
    lang: 'drip-vm',
    title: 'Powers of two',
    prompt:
      'Using a `for` loop, print every power of two that is less than 100: `1`, `2`, `4`, `8`, `16`, `32`, `64`, one per line.',
    starter: `// your code here`,
    solution: `for (let p = 1; p < 100; p = p * 2) {
  print p;
}`,
    tests: `1
2
4
8
16
32
64`,
    hints: [
      'Start the loop variable at 1, and keep going while it is less than 100.',
      'The increment doubles it: `p = p * 2`.',
    ],
    walkthrough: `\`for (let p = 1; p < 100; p = p * 2)\` compiles to the same shape as in the chapter: the initializer leaves 1 in slot 1, the condition is followed by a \`JUMP_IF_FALSE\` to the exit, a \`JUMP\` skips the increment on the way in, and two \`LOOP\`s tie body → increment → condition. When \`p\` reaches 128, the condition is false and the loop exits.`,
    wrong: [
      {
        code: `for (let p = 1; p < 100; p = p + 2) {
  print p;
}`,
        why: '`p + 2` counts odd numbers: 1, 3, 5, …. Doubling is `p * 2`.',
      },
      {
        code: `for (let p = 2; p < 100; p = p * 2) {
  print p;
}`,
        why: 'This misses the first power of two, 1 (which is 2 to the power 0).',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this disassembly line tell you?
\`\`\`
0016    | OP_JUMP            16 -> 23
\`\`\``,
    options: [
      { t: 'The jump’s operand bytes hold 23', why: 'They hold the distance, 4. The disassembler adds it to 16 + 3.' },
      { t: 'A jump at offset 16 that continues at offset 23', correct: true, why: 'The disassembler prints where the jump is and where it lands.' },
      { t: 'A jump that runs 16 times', why: 'Jumps don’t count anything.' },
      { t: 'A jump from line 16 to line 23', why: 'Those are byte offsets, not source lines.' },
    ],
  },
  {
    q: 'Why can’t the compiler write the real distance when it emits the `JUMP_IF_FALSE` of an `if`?',
    options: [
      { t: 'The VM computes distances at run time', why: 'The distance is stored in the bytecode; the VM just reads it.' },
      { t: 'Distances must be multiples of 256', why: 'Any distance up to 65,535 works.' },
      { t: 'The then-branch hasn’t been compiled yet, so its size is unknown', correct: true, why: 'A single-pass compiler emits the jump before the code it jumps over. Backpatching fixes it up later.' },
      { t: 'It can: it parses the then-branch twice', why: 'It compiles each piece once. That is why it needs a placeholder.' },
    ],
  },
  {
    q: 'Which jump does a `while` loop need no backpatching for?',
    options: [
      { t: 'The `LOOP` at the end of the body', correct: true, why: 'It jumps back to code already compiled, so the distance is known on the spot.' },
      { t: 'The `JUMP_IF_FALSE` after the condition', why: 'That one jumps forward past the body, which isn’t compiled yet: it is patched.' },
      { t: 'Neither: both are patched', why: 'Only forward jumps need patching.' },
      { t: 'Both: while loops never patch', why: 'The exit jump goes forward and must be patched.' },
    ],
  },
  {
    q: 'After `JUMP_IF_FALSE` sees a falsey value and jumps, where is that value?',
    options: [
      { t: 'Popped, like a CPython conditional jump', why: 'CPython’s `POP_JUMP_IF_FALSE` pops; Drip’s only peeks.' },
      { t: 'Stored in a register', why: 'This VM has only its stack.' },
      { t: 'Gone, replaced by `nil`', why: 'Nothing replaces it.' },
      { t: 'Still on top of the stack', correct: true, why: 'Drip’s `JUMP_IF_FALSE` peeks. That is what lets `and` return its left value.' },
    ],
  },
  {
    q: 'What does `print nil or "x";` print, and why?',
    options: [
      { t: '`nil`, because `or` returns its left side', why: 'It returns the left side only if it is truthy.' },
      { t: '`true`', why: 'Drip’s `or` returns one of its operands, not a boolean.' },
      { t: '`x`: `nil` is falsey, so the `JUMP_IF_FALSE` skips the `JUMP`, pops `nil` and evaluates `"x"`', correct: true, why: 'Only a truthy left side takes the `JUMP` past the right operand.' },
      { t: 'A runtime error', why: '`or` accepts any values.' },
    ],
  },
  {
    q: 'In the compiled `for` loop, where does the body’s `LOOP` jump back to?',
    options: [
      { t: 'The initializer', why: 'The initializer runs once, before the loop.' },
      { t: 'The increment, whose own `LOOP` then goes to the condition', correct: true, why: 'That is how the increment, written before the body, runs after it.' },
      { t: 'The condition, skipping the increment', why: 'Then the loop variable would never change.' },
      { t: 'The start of the body', why: 'The condition must be checked again each time.' },
    ],
  },
];
