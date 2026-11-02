// Chapter 152 cards. Keys are stable ids: never rename them.

export const prompts = {
  'jump-what': {
    q: 'What does every jump instruction change?',
    a: 'The instruction pointer, `ip`, so the VM continues somewhere other than the next instruction.',
  },
  'offset-from': {
    q: 'A jump’s distance is counted from where?',
    a: 'From the byte just after the three-byte jump instruction, because `readShort` has already moved `ip` past the operand.',
  },
  'unless-pops': {
    q: 'What does `jump.unless` do with the condition, and when does it jump?',
    a: 'It pops the condition, and jumps only if it is falsey (`false` or `none`); otherwise it falls through.',
  },
  'loop-back': {
    q: 'How does `loop` differ from `jump`?',
    a: 'It subtracts its distance from `ip` instead of adding it, so it goes backwards. Both always jump.',
  },
  'if-two-jumps': {
    q: 'Why does an `if` with an `else` need two jumps?',
    a: '`jump.unless` gets into the else-branch when the condition is false, and a `jump` at the end of the then-branch gets over the else-branch.',
  },
  'while-shape': {
    q: 'Which two jumps does a `while` loop compile to?',
    a: 'A `jump.unless` after the condition, to leave the loop, and a `loop` at the end of the body, back to the condition.',
  },
  'and-keeps': {
    q: 'Why does `&&` use `jump.unless.keep` rather than `jump.unless`?',
    a: 'When the left side is falsey it *is* the answer, so it must stay on the stack; `jump.unless` would pop it.',
  },
  'or-mirror': {
    q: 'What does `none || "guest"` leave on the stack, and which jump decides?',
    a: '`"guest"`: `jump.if.keep` does not jump (none is falsey), so the VM pops `none` and pushes `"guest"`.',
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

print false && bump();
print true || bump();
print none || "default";
print n;`,
  },
};

const HEAD = `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {`;

export const exercises = {
  target: {
    title: 'Where does this jump land?',
    prompt: `Write \`target(code, at)\`, the arithmetic the disassembler does to print \`13 -> 30\`. \`code\` is an array of bytes and \`at\` is the offset of a jump instruction: \`code[at]\` is the opcode, and \`code[at + 1]\`, \`code[at + 2]\` are its two-byte distance, high byte first. The distance counts from the byte after the instruction. Every jump moves forward except \`loop\` (opcode \`LOOP\`, 38), which moves backward.`,
    starter: `${HEAD}
  // your code here
}`,
    solution: `${HEAD}
  const d = (code[at + 1] << 8) |
    code[at + 2];
  if (code[at] === LOOP) {
    return at + 3 - d;
  }
  return at + 3 + d;
}`,
    tests: `const ifElse = [2, 35, 0, 7, 0, 0, 0,
  33, 34, 0, 4, 0, 0, 1, 33, 1, 49];
test('jump.unless at 1 lands on 11', () => {
  expect(target(ifElse, 1)).toBe(11);
});
test('jump at 8 lands on 15', () => {
  expect(target(ifElse, 8)).toBe(15);
});
test('loop goes backward', () => {
  const c = [];
  c[27] = 38; c[28] = 0; c[29] = 24;
  expect(target(c, 27)).toBe(6);
});
test('high byte first', () => {
  expect(target([34, 1, 44], 0))
    .toBe(303);
});
test('the keep jumps go forward', () => {
  expect(target([36, 0, 4], 0)).toBe(7);
  expect(target([37, 0, 4], 0)).toBe(7);
});`,
    hints: [
      'Two separate steps: first turn the two operand bytes into one distance, then decide which way to move.',
      'The distance is `(code[at + 1] << 8) | code[at + 2]`: the high byte times 256, plus the low byte. The next instruction starts at `at + 3`.',
      'If `code[at]` is `LOOP`, return `at + 3 - d`; otherwise return `at + 3 + d`.',
    ],
    walkthrough: `**How to think about it.** Picture the VM running the jump. It reads the opcode at \`at\`, then \`readShort\` reads the two operand bytes, which leaves \`ip\` at \`at + 3\`. Only then is the distance added (or, for \`loop\`, subtracted). So the target is "the end of this instruction, plus or minus the distance", and the only work is putting the distance back together from its two bytes.

**The solution, line by line.**

- \`const d = (code[at + 1] << 8) |\` takes the high byte and shifts it 8 bits left, which multiplies it by 256...
- \`code[at + 2];\` ...and combines it with the low byte. For \`[34, 1, 44]\` that is \`256 + 44 = 300\`.
- \`if (code[at] === LOOP) {\` checks the opcode: \`loop\` is the only backward jump.
- \`return at + 3 - d;\` for a loop at 27 with distance 24: \`30 - 24 = 6\`, the start of the while loop's condition in the chapter.
- \`return at + 3 + d;\` for every other jump. For the \`jump.unless\` at 1 with distance 7, that is \`4 + 7 = 11\`, the else-branch; for the \`jump\` at 8 with distance 4, \`11 + 4 = 15\`, just past the else-branch.

**Common wrong attempts.**

- \`at + d\` forgets that the distance starts after the instruction, so every target is three bytes short and lands in the middle of the jump itself.
- Reading the bytes the wrong way round, \`(code[at + 2] << 8) | code[at + 1]\`, gives the right answer whenever the high byte is 0, which is why it can look as if it works; \`[34, 1, 44]\` exposes it (44 × 256 + 1).
- Treating \`loop\` like the others sends it forward, past the end of the loop, instead of back to its start.`,
    wrong: [
      {
        code: `${HEAD}
  const d = (code[at + 1] << 8) |
    code[at + 2];
  if (code[at] === LOOP) {
    return at - d;
  }
  return at + d;
}`,
        why: 'The distance counts from the byte after the instruction, `at + 3`, not from the opcode. Every target comes out three bytes short.',
      },
      {
        code: `${HEAD}
  const d = (code[at + 2] << 8) |
    code[at + 1];
  if (code[at] === LOOP) {
    return at + 3 - d;
  }
  return at + 3 + d;
}`,
        why: 'The bytes are swapped. Distances under 256 still come out right (their high byte is 0), but `[34, 1, 44]` is read as 44 × 256 + 1.',
      },
      {
        code: `${HEAD}
  const d = (code[at + 1] << 8) |
    code[at + 2];
  return at + 3 + d;
}`,
        why: '`loop` subtracts its distance; this sends it forward instead of back to the start of the loop.',
      },
    ],
  },
  powers: {
    optional: true,
    lang: 'drip-vm',
    title: 'Powers of two',
    prompt:
      'Using a `while` loop, print every power of two that is less than 100: `1`, `2`, `4`, `8`, `16`, `32`, `64`, one per line.',
    starter: `# your code here`,
    solution: `let p = 1;
while p < 100 {
  print p;
  p = p * 2;
}`,
    tests: `1
2
4
8
16
32
64`,
    hints: [
      'Start a variable at 1, and keep going while it is less than 100.',
      'Inside the loop, print it and then double it: `p = p * 2;`.',
    ],
    walkthrough: `**How to think about it.** Each power of two is the one before it doubled, so the loop needs one variable that starts at 1 and doubles every round, and a condition that stops it once it reaches 100.

**The solution, line by line.**

- \`let p = 1;\` is a global, so it compiles to \`const\` and \`define.global\`.
- \`while p < 100 {\` compiles the condition, \`load.global\`, \`const\`, \`lt\`, followed by a \`jump.unless\` whose target is just past the loop.
- \`print p;\` prints the current power.
- \`p = p * 2;\` doubles it, then the body ends with a \`loop\` back to the condition.

When \`p\` reaches 128, \`128 < 100\` is false, \`jump.unless\` pops it and jumps past the \`loop\`, and the program ends.

**Common wrong attempts.**

- \`p = p + 2;\` counts odd numbers, 1, 3, 5, and so on.
- Starting at \`p = 2\` misses 1, which is two to the power 0.`,
    wrong: [
      {
        code: `let p = 1;
while p < 100 {
  print p;
  p = p + 2;
}`,
        why: '`p + 2` counts odd numbers: 1, 3, 5, …. Doubling is `p * 2`.',
      },
      {
        code: `let p = 2;
while p < 100 {
  print p;
  p = p * 2;
}`,
        why: 'This misses the first power of two, 1 (which is 2 to the power 0).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `jump.unless` at offset 10 has distance 5, and the condition is `false`. Where does `ip` go?',
    options: [
      { t: '15', why: 'That counts from the opcode; the distance counts from the end of the 3-byte instruction.' },
      { t: '13', why: 'That is where it would go if the condition were true: the next instruction.' },
      { t: '18', correct: true, why: '10 + 3 = 13 is the end of the instruction, and 13 + 5 = 18.' },
      { t: '5', why: 'The operand is a distance, not an offset.' },
    ],
  },
  {
    q: 'Why is a jump’s distance counted from the byte after the instruction?',
    options: [
      { t: 'By the time the VM has read the operand, `ip` already points there', correct: true, why: '`readShort` moves `ip` past both operand bytes before the distance is added.' },
      { t: 'To make room for a longer distance', why: 'The range is 0 to 65,535 either way.' },
      { t: 'Because the disassembler needs it', why: 'The disassembler follows the VM’s rule, not the other way round.' },
      { t: 'It is not: it counts from the opcode', why: 'Counting from the opcode would land three bytes short.' },
    ],
  },
  {
    q: 'How many jumps does `if x { print 1; }` (with no else) compile to?',
    options: [
      { t: 'None: the VM checks x itself', why: 'Something has to skip the branch when x is falsey.' },
      { t: 'Two', why: 'The second jump only exists to get over an else-branch.' },
      { t: 'Three', why: 'There is only one place to skip to.' },
      { t: 'One `jump.unless`', correct: true, why: 'It skips the body when x is falsey; when x is truthy the VM falls through.' },
    ],
  },
  {
    q: 'Why does `a && b` use `jump.unless.keep`?',
    options: [
      { t: 'It is faster than `jump.unless`', why: 'The point is what it leaves on the stack, not its speed.' },
      { t: 'When `a` is falsey, `a` is the answer and must stay on the stack', correct: true, why: '`jump.unless` would pop it, leaving nothing to be the value of the expression.' },
      { t: 'So that `b` is evaluated first', why: '`a` is always evaluated first; `b` may be skipped.' },
      { t: 'Because `&&` needs a backward jump', why: 'It jumps forward, over `b`.' },
    ],
  },
  {
    q: 'The disassembler prints `loop 27 -> 6`. What is the operand?',
    options: [
      { t: '6', why: 'The operand is a distance; 6 is where it lands.' },
      { t: '21', why: 'That counts from the opcode; the distance counts from 30, the end of the instruction.' },
      { t: '33', why: 'That would be a forward jump.' },
      { t: '24', correct: true, why: 'The instruction ends at 30, and 30 − 24 = 6.' },
    ],
  },
];
