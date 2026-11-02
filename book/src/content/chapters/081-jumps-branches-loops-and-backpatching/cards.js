// Chapter 62 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 81, 81.

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
  'why-placeholder': {
    q: 'Why can’t a single-pass compiler write a forward jump’s distance straight away?',
    a: 'The distance is the size of the code being jumped over, which has not been compiled yet.',
  },
  'emitjump-returns': {
    q: 'What does `emitJump` return, and why?',
    a: 'The position of the first placeholder byte, so `patchJump` can come back and overwrite exactly those two bytes.',
  },
  'patch-math': {
    q: 'Why does `patchJump` compute `code.length - offset - 2`?',
    a: 'The jump lands at `code.length`, and at run time `ip` will be at `offset + 2`, just past the two operand bytes.',
  },
  'loop-no-patch': {
    q: 'Why does `loop` never need backpatching?',
    a: 'It jumps backward, to code that is already compiled, so its distance is known when it is emitted.',
  },
  'hidden-locals': {
    q: 'What are the two hidden locals of `for i in a..b`?',
    a: 'The counter and the end value, in slots whose names start with a space, so no program can name them.',
  },
  'breaks-list': {
    q: 'Why does each loop keep a list of `break` positions?',
    a: 'There may be many `break`s, all jumping to the loop’s end, which is not compiled yet; the loop patches every one when it reaches its end.',
  },
  'break-pops': {
    q: 'Why does `break` emit `pop`s before its jump?',
    a: 'The jump skips the closing braces that would have popped the loop’s locals, so it pops them itself.',
  },
  'continue-for': {
    q: 'In a `for` loop, why is `continue` a forward jump, while in a `while` loop it is a `loop`?',
    a: 'A `for` loop must still run its increment, which comes after the body; a `while` loop goes straight back to its condition, which is already compiled.',
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
  loops: {
    title: 'for, break and continue',
    lang: 'drip-vm',
    code: `let xs = [4, 8, 15, 16, 23, 42];
for x in xs {
  if x % 2 == 1 { continue; }
  if x > 20 { break; }
  print x;
}
for i in 0..3 {
  print i * 10;
}`,
  },
};

export const exercises = {
  target: {
    title: 'Where does this jump land?',
    prompt: 'Write `target(code, at)`, the arithmetic the disassembler does to print `13 -> 30`. `code` is an array of bytes and `at` is the offset of a jump instruction: `code[at]` is the opcode, and `code[at + 1]`, `code[at + 2]` are its two-byte distance, high byte first. The distance counts from the byte after the instruction. Every jump moves forward except `loop` (opcode `LOOP`, 38), which moves backward.',
    starter: `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {
  // your code here
}`,
    solution: `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {
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
        code: `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {
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
        code: `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {
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
        code: `const LOOP = 38;
// code: an array of bytes.
// at: the offset of a jump.
// Return the offset it lands on.
function target(code, at) {
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
    prompt: 'Using a `while` loop, print every power of two that is less than 100: `1`, `2`, `4`, `8`, `16`, `32`, `64`, one per line.',
    starter: '# your code here',
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
  patch: {
    title: 'emitJump and patchJump',
    prompt: `\`code\` is an array of bytes. Write the two backpatching helpers:

- \`emitJump(code, op)\` pushes \`op\` and two placeholder bytes \`0xff 0xff\`, and returns the **index of the first placeholder byte**.
- \`patchJump(code, at)\` fills in the placeholder at \`at\` so that the jump lands at \`code.length\` (the next byte to be written). The distance is counted from just after the two operand bytes, and stored high byte first. If it is more than \`0xffff\`, \`throw new Error(BIG)\`.`,
    starter: `const BIG =
  'too much code to jump over';

// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {
  // your code here
}

// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {
  // your code here
}`,
    solution: `const BIG =
  'too much code to jump over';

// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {
  code.push(op, 0xff, 0xff);
  return code.length - 2;
}

// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`,
    tests: `const UNLESS = 35;
const read = (c, at) =>
  (c[at] << 8) | c[at + 1];
test('emitJump writes 3 bytes', () => {
  const c = [2];
  expect(emitJump(c, UNLESS)).toBe(2);
  expect(c).toEqual(
    [2, UNLESS, 255, 255]);
});
test('patch a short jump', () => {
  const c = [];
  const at = emitJump(c, UNLESS);
  c.push(0, 0, 0, 33);
  patchJump(c, at);
  expect(c.slice(0, 3))
    .toEqual([UNLESS, 0, 4]);
});
test('lands at the end of the code', () => {
  const c = [2];
  const at = emitJump(c, UNLESS);
  c.push(0, 0, 0, 33, 34, 9, 9);
  patchJump(c, at);
  expect(at + 2 + read(c, at))
    .toBe(c.length);
});
test('high byte first', () => {
  const c = [];
  const at = emitJump(c, UNLESS);
  for (let i = 0; i < 300; i++) {
    c.push(4);
  }
  patchJump(c, at);
  expect(c[at]).toBe(1);
  expect(c[at + 1]).toBe(44);
});
test('too far to jump', () => {
  const c = [];
  const at = emitJump(c, UNLESS);
  for (let i = 0; i < 70000; i++) {
    c.push(4);
  }
  expect(() => patchJump(c, at))
    .toThrow();
});`,
    hints: [
      'Do `emitJump` first. After `code.push(op, 0xff, 0xff)`, which index holds the first `0xff`?',
      '`emitJump` returns `code.length - 2`. In `patchJump`, `ip` will be at `at + 2` when the jump runs, and it must end up at `code.length`, so the distance is `code.length - at - 2`.',
      'Check the limit first, then write the high byte, `(d >> 8) & 0xff`, at `code[at]` and the low byte, `d & 0xff`, at `code[at + 1]`.',
    ],
    walkthrough: `**How to think about it.** Split it into "what will the VM do?" and "what must the compiler write so that happens?". The VM reads the opcode, then two operand bytes, which leaves \`ip\` just past them, then adds the distance. So the compiler must remember where the operand is (to come back to it), and later write whatever number takes \`ip\` from just past the operand to the target.

**The solution, line by line.**

- \`code.push(op, 0xff, 0xff);\` writes the opcode and two placeholder bytes. \`0xff\` is only a marker; any value would do, because it will be overwritten.
- \`return code.length - 2;\` returns the index of the first placeholder byte: the array now ends with \`op, 0xff, 0xff\`, so that byte is two from the end.
- \`const d = code.length - at - 2;\` is the distance. The target is "here", \`code.length\`; at run time \`ip\` will be at \`at + 2\`; the difference is the distance. The third test checks exactly that equation.
- \`if (d > 0xffff) throw new Error(BIG);\` refuses a distance that two bytes cannot hold (65,535 at most), rather than writing a wrapped-round, wrong one.
- \`code[at] = (d >> 8) & 0xff;\` writes the high byte: \`d >> 8\` shifts away the low 8 bits. For 300 that is 1.
- \`code[at + 1] = d & 0xff;\` writes the low byte: the bottom 8 bits. For 300 (which is 1 × 256 + 44) that is 44.

**Common wrong attempts.**

- \`code.length - at\` counts from the placeholder itself, but the VM counts from after the operand, so every jump lands two bytes too far, in the middle of an instruction.
- Writing the low byte first looks right for short jumps in some tests by accident, but the VM reads the high byte first, so 300 would be read as 44 × 256 + 1.
- Returning \`code.length\` from \`emitJump\` points \`patchJump\` at the byte after the placeholder, so it overwrites the wrong two bytes and leaves \`0xff 0xff\` in the jump.`,
    wrong: [
      {
        code: `const BIG =
  'too much code to jump over';

// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {
  code.push(op, 0xff, 0xff);
  return code.length - 2;
}

// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {
  const d = code.length - at;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`,
        why: 'This counts from the placeholder itself, but the VM counts from *after* the two operand bytes. Every jump would land two bytes too far.',
      },
      {
        code: `const BIG =
  'too much code to jump over';

// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {
  code.push(op, 0xff, 0xff);
  return code.length - 2;
}

// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = d & 0xff;
  code[at + 1] = (d >> 8) & 0xff;
}`,
        why: 'The bytes are swapped: low byte first. The VM reads the high byte first, so 300 would be read as 44 × 256 + 1.',
      },
      {
        code: `const BIG =
  'too much code to jump over';

// Push op and a 2-byte placeholder.
// Return where the placeholder starts.
function emitJump(code, op) {
  code.push(op, 0xff, 0xff);
  return code.length;
}

// Fill the placeholder at code[at] so
// the jump lands at code.length.
function patchJump(code, at) {
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`,
        why: '`emitJump` returns the index *after* the placeholder, so `patchJump` overwrites the wrong two bytes and leaves `0xff 0xff` in the jump.',
      },
    ],
  },
  'skip-and-stop': {
    optional: true,
    lang: 'drip-vm',
    title: 'Skip and stop',
    prompt: 'Using `for i in 0..20`, print the numbers from 1 upwards, but skip every multiple of 3 (with `continue`), and stop the loop as soon as `i` reaches 10 (with `break`). The output is `1`, `2`, `4`, `5`, `7`, `8`.',
    starter: `for i in 0..20 {
  print i;
}`,
    solution: `for i in 0..20 {
  if i % 3 == 0 { continue; }
  if i >= 10 { break; }
  print i;
}`,
    tests: `1
2
4
5
7
8`,
    hints: [
      'Two `if`s at the top of the body, before the `print`: one to skip, one to stop.',
      '`i % 3 == 0` is true for 0, 3, 6, 9...; `continue` there skips the `print`. Then `if i >= 10 { break; }`.',
    ],
    walkthrough: `**How to think about it.** Every number goes through the same body, so the body decides, in order: should this one be skipped, should the loop stop, and if neither, print it. 0 is a multiple of 3, so it is skipped too, which is why the output starts at 1.

**The solution, line by line.**

- \`for i in 0..20 {\` makes the two hidden locals (counter 0, end 20) and a fresh \`i\` each time round.
- \`if i % 3 == 0 { continue; }\` compiles to a test, a \`jump.unless\` over the \`continue\`, and the \`continue\` itself: a forward \`jump\` (patched when the body ends) to the \`pop\` of \`i\`, after which the counter is still incremented.
- \`if i >= 10 { break; }\`: the \`break\` pops \`i\`, then jumps (patched when the loop ends) to the two \`pop\`s of the hidden locals. 10 is not a multiple of 3, so it gets past the first test and reaches this one, and the loop stops without printing it.
- \`print i;\` runs only for the numbers that got past both tests.

**Common wrong attempts.**

- Putting the \`break\` test first with \`i > 10\` prints \`10\`, because 10 is not a multiple of 3 and is not greater than 10.`,
    wrong: [
      {
        code: `for i in 0..20 {
  if i % 3 == 0 { continue; }
  if i > 10 { break; }
  print i;
}`,
        why: 'With `> 10`, the number 10 itself is printed before the loop stops. The loop must stop as soon as `i` reaches 10: `>= 10`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `jump.unless` at offset 10 has distance 5, and the condition is `false`. Where does `ip` go?',
    options: [
      {
        t: '15',
        why: 'That counts from the opcode; the distance counts from the end of the 3-byte instruction.',
      },
      {
        t: '13',
        why: 'That is where it would go if the condition were true: the next instruction.',
      },
      {
        t: '18',
        correct: true,
        why: '10 + 3 = 13 is the end of the instruction, and 13 + 5 = 18.',
      },
      {
        t: '5',
        why: 'The operand is a distance, not an offset.',
      },
    ],
  },
  {
    q: 'Why is a jump’s distance counted from the byte after the instruction?',
    options: [
      {
        t: 'By the time the VM has read the operand, `ip` already points there',
        correct: true,
        why: '`readShort` moves `ip` past both operand bytes before the distance is added.',
      },
      {
        t: 'To make room for a longer distance',
        why: 'The range is 0 to 65,535 either way.',
      },
      {
        t: 'Because the disassembler needs it',
        why: 'The disassembler follows the VM’s rule, not the other way round.',
      },
      {
        t: 'It is not: it counts from the opcode',
        why: 'Counting from the opcode would land three bytes short.',
      },
    ],
  },
  {
    q: 'How many jumps does `if x { print 1; }` (with no else) compile to?',
    options: [
      {
        t: 'None: the VM checks x itself',
        why: 'Something has to skip the branch when x is falsey.',
      },
      {
        t: 'Two',
        why: 'The second jump only exists to get over an else-branch.',
      },
      {
        t: 'Three',
        why: 'There is only one place to skip to.',
      },
      {
        t: 'One `jump.unless`',
        correct: true,
        why: 'It skips the body when x is falsey; when x is truthy the VM falls through.',
      },
    ],
  },
  {
    q: 'Why does `a && b` use `jump.unless.keep`?',
    options: [
      {
        t: 'It is faster than `jump.unless`',
        why: 'The point is what it leaves on the stack, not its speed.',
      },
      {
        t: 'When `a` is falsey, `a` is the answer and must stay on the stack',
        correct: true,
        why: '`jump.unless` would pop it, leaving nothing to be the value of the expression.',
      },
      {
        t: 'So that `b` is evaluated first',
        why: '`a` is always evaluated first; `b` may be skipped.',
      },
      {
        t: 'Because `&&` needs a backward jump',
        why: 'It jumps forward, over `b`.',
      },
    ],
  },
  {
    q: 'The disassembler prints `loop 27 -> 6`. What is the operand?',
    options: [
      {
        t: '6',
        why: 'The operand is a distance; 6 is where it lands.',
      },
      {
        t: '21',
        why: 'That counts from the opcode; the distance counts from 30, the end of the instruction.',
      },
      {
        t: '33',
        why: 'That would be a forward jump.',
      },
      {
        t: '24',
        correct: true,
        why: 'The instruction ends at 30, and 30 − 24 = 6.',
      },
    ],
  },
  {
    q: 'A placeholder starts at offset 2, and the compiler is now about to write offset 11. What distance does `patchJump(2)` write?',
    options: [
      {
        t: '9',
        why: 'That counts from the placeholder; the VM counts from after it.',
      },
      {
        t: '7',
        correct: true,
        why: '11 − 2 − 2 = 7: from offset 4, just past the operand, to 11.',
      },
      {
        t: '11',
        why: 'That is the target, not the distance.',
      },
      {
        t: '8',
        why: 'The operand is two bytes, so subtract 2, not 1.',
      },
    ],
  },
  {
    q: 'Which jump never needs backpatching?',
    options: [
      {
        t: 'The `jump.unless` of a `while` loop',
        why: 'Its target is past the body, which is not compiled yet.',
      },
      {
        t: 'A `break`',
        why: 'It jumps to the loop’s end, which is not compiled yet.',
      },
      {
        t: 'The `loop` at the end of a `while` body',
        correct: true,
        why: 'Its target, the condition, is already compiled, so the distance is known at once.',
      },
      {
        t: 'The `jump` over an else-branch',
        why: 'The else-branch is compiled after it.',
      },
    ],
  },
  {
    q: 'Why does a loop keep a *list* of break positions rather than just one?',
    options: [
      {
        t: 'A loop can contain any number of `break`s, and each has its own placeholder to fill',
        correct: true,
        why: 'All of them are patched when the loop reaches its end.',
      },
      {
        t: 'Each break jumps to a different place',
        why: 'They all jump to the same place, the end of the loop.',
      },
      {
        t: 'To undo them if the loop is empty',
        why: 'Nothing is undone; every break is patched.',
      },
      {
        t: 'So the VM can find them at run time',
        why: 'The list exists only in the compiler.',
      },
    ],
  },
  {
    q: 'In `for i in 0..5 { let sq = i * i; if sq > 9 { break; } }`, what does `break` emit before its jump?',
    options: [
      {
        t: 'Nothing: the jump goes straight to the end',
        why: 'Then `i` and `sq` would be left on the stack.',
      },
      {
        t: 'Four `pop`s, for everything on the stack',
        why: 'The hidden counter and end are popped at the loop’s exit, not by the break.',
      },
      {
        t: 'A `loop`',
        why: 'A break leaves the loop; it does not go round again.',
      },
      {
        t: 'Two `pop`s, for `sq` and `i`',
        correct: true,
        why: 'It pops the locals deeper than the loop’s own scope; the hidden locals are popped where it lands.',
      },
    ],
  },
  {
    q: 'What does `for i in 0..3` keep in its two hidden locals?',
    options: [
      {
        t: 'The list and the index',
        why: 'That is `for x in xs`, a loop over a list.',
      },
      {
        t: 'The counter and the end value',
        correct: true,
        why: 'The counter is copied into a fresh `i` each time round and stepped with `inc.local`.',
      },
      {
        t: 'The start and the loop variable',
        why: 'The loop variable is a third, visible local.',
      },
      {
        t: 'Nothing: ranges need no hidden locals',
        why: 'The counter and end have to live somewhere between rounds.',
      },
    ],
  },
];
