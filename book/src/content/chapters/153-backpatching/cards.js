// Chapter 152-b cards (split from 147). Keys are stable ids.

export const prompts = {
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

const ERR = `const BIG =
  'too much code to jump over';
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
    prompt: `\`code\` is an array of bytes. Write the two backpatching helpers:

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
        code: `${HEAD}${EMIT_OK}
${MID}
  const d = code.length - at;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = (d >> 8) & 0xff;
  code[at + 1] = d & 0xff;
}`,
        why: 'This counts from the placeholder itself, but the VM counts from *after* the two operand bytes. Every jump would land two bytes too far.',
      },
      {
        code: `${HEAD}${EMIT_OK}
${MID}
  const d = code.length - at - 2;
  if (d > 0xffff) throw new Error(BIG);
  code[at] = d & 0xff;
  code[at + 1] = (d >> 8) & 0xff;
}`,
        why: 'The bytes are swapped: low byte first. The VM reads the high byte first, so 300 would be read as 44 × 256 + 1.',
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
  'skip-and-stop': {
    optional: true,
    lang: 'drip-vm',
    title: 'Skip and stop',
    prompt:
      'Using `for i in 0..20`, print the numbers from 1 upwards, but skip every multiple of 3 (with `continue`), and stop the loop as soon as `i` reaches 10 (with `break`). The output is `1`, `2`, `4`, `5`, `7`, `8`.',
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
    q: 'A placeholder starts at offset 2, and the compiler is now about to write offset 11. What distance does `patchJump(2)` write?',
    options: [
      { t: '9', why: 'That counts from the placeholder; the VM counts from after it.' },
      { t: '7', correct: true, why: '11 − 2 − 2 = 7: from offset 4, just past the operand, to 11.' },
      { t: '11', why: 'That is the target, not the distance.' },
      { t: '8', why: 'The operand is two bytes, so subtract 2, not 1.' },
    ],
  },
  {
    q: 'Which jump never needs backpatching?',
    options: [
      { t: 'The `jump.unless` of a `while` loop', why: 'Its target is past the body, which is not compiled yet.' },
      { t: 'A `break`', why: 'It jumps to the loop’s end, which is not compiled yet.' },
      { t: 'The `loop` at the end of a `while` body', correct: true, why: 'Its target, the condition, is already compiled, so the distance is known at once.' },
      { t: 'The `jump` over an else-branch', why: 'The else-branch is compiled after it.' },
    ],
  },
  {
    q: 'Why does a loop keep a *list* of break positions rather than just one?',
    options: [
      { t: 'A loop can contain any number of `break`s, and each has its own placeholder to fill', correct: true, why: 'All of them are patched when the loop reaches its end.' },
      { t: 'Each break jumps to a different place', why: 'They all jump to the same place, the end of the loop.' },
      { t: 'To undo them if the loop is empty', why: 'Nothing is undone; every break is patched.' },
      { t: 'So the VM can find them at run time', why: 'The list exists only in the compiler.' },
    ],
  },
  {
    q: 'In `for i in 0..5 { let sq = i * i; if sq > 9 { break; } }`, what does `break` emit before its jump?',
    options: [
      { t: 'Nothing: the jump goes straight to the end', why: 'Then `i` and `sq` would be left on the stack.' },
      { t: 'Four `pop`s, for everything on the stack', why: 'The hidden counter and end are popped at the loop’s exit, not by the break.' },
      { t: 'A `loop`', why: 'A break leaves the loop; it does not go round again.' },
      { t: 'Two `pop`s, for `sq` and `i`', correct: true, why: 'It pops the locals deeper than the loop’s own scope; the hidden locals are popped where it lands.' },
    ],
  },
  {
    q: 'What does `for i in 0..3` keep in its two hidden locals?',
    options: [
      { t: 'The list and the index', why: 'That is `for x in xs`, a loop over a list.' },
      { t: 'The counter and the end value', correct: true, why: 'The counter is copied into a fresh `i` each time round and stepped with `inc.local`.' },
      { t: 'The start and the loop variable', why: 'The loop variable is a third, visible local.' },
      { t: 'Nothing: ranges need no hidden locals', why: 'The counter and end have to live somewhere between rounds.' },
    ],
  },
];
