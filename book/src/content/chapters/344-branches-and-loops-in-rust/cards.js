// Chapter 344 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'pj-returns': {
    q: 'What does drip-rs’s `emit_jump` return, and of what type?',
    a: 'The position of the jump’s first placeholder byte, `code.len() - 2`, as a `usize`.',
  },
  'pj-number': {
    q: 'Why does the caller keep the jump’s position as a number rather than a `&mut u8` into the code?',
    a: 'A number borrows nothing, so the compiler can keep emitting the body. A `&mut` reference would lock the chunk until the patch.',
  },
  'pj-minus-two': {
    q: 'In `patch_jump`, why is the distance `len - offset - 2`?',
    a: 'A jump is measured from the end of its operand, and the operand is the two bytes starting at `offset`; the VM’s `ip` is at `offset + 2` when it adds.',
  },
  'pj-as-u8': {
    q: 'What does `jump as u8` do, and what was its TypeScript twin?',
    a: 'It keeps the low 8 bits (a numeric cast to a smaller integer truncates). TypeScript wrote `jump & 0xff`.',
  },
  'pj-order': {
    q: 'Why does `patch_jump` call `self.static_error(...)` before `let code = &mut self.chunk().code;`?',
    a: '`code` borrows `self` mutably through `chunk()`, and `static_error` needs `&mut self` too. Borrowing `code` first and reporting after is error E0499.',
  },
  'pj-big-endian': {
    q: 'In which order are a jump’s two offset bytes stored, and why?',
    a: 'High byte first, because the VM’s `read_short` rebuilds the number as `(high << 8) | low`.',
  },
  'pj-loop-plus': {
    q: 'Why does `emit_loop` compute `len - loop_start + 2`?',
    a: 'When it works out the offset, the two operand bytes are not written yet, and the VM steps back from the end of the operand, two bytes further on.',
  },
  'pj-continue-target': {
    q: 'A `while` loop records `continue_target: Some(loop_start)`; a `for` loop records `None`. Why the difference?',
    a: 'In a `while`, `continue` jumps back to the condition, which is already compiled (`emit_loop`). In a `for`, it must jump forwards past the body to the step, so it needs a hole patched later.',
  },
};

export const examples = {
  primes: {
    lang: 'drip-vm',
    title: 'for, while, break and continue',
    code: `# The primes below 20.
for n in 2..20 {
  let prime = true;
  let d = 2;
  while d * d <= n {
    if n % d == 0 {
      prime = false;
      break;
    }
    d += 1;
  }
  if !prime { continue; }
  print n;
}`,
  },
};

// The small compiler both exercises share, with one method left open.
const head = (consts) => `${consts}

struct Compiler {
    code: Vec<u8>,
    errors: Vec<String>,
}

impl Compiler {
    fn new() -> Self {
        Compiler {
            code: Vec::new(),
            errors: Vec::new(),
        }
    }

    fn emit(&mut self, byte: u8) {
        self.code.push(byte);
    }

    fn static_error(
        &mut self,
        m: &str,
    ) {
        self.errors.push(m.into());
    }
`;

const JUMPS = `const JUMP: u8 = 1;
const JUMP_UNLESS: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "too much code to jump over";`;

const pj = (emitBody, patchBody) => `${head(JUMPS)}
    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
${emitBody}
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
${patchBody}
    }
}`;

const EMIT = `        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2`;

const LOOPS = `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "loop body too large";`;

const el = (body) => `${head(LOOPS)}
    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
${body}
    }
}`;

export const exercises = {
  patchJump: {
    lang: 'rust',
    title: 'emit_jump and patch_jump',
    prompt: `Write the two halves of a forward jump for this small compiler, which is shaped like drip-rs's.

- \`emit_jump(op)\` emits \`op\` and two placeholder bytes \`0xff, 0xff\`, and returns the index of the first placeholder.
- \`patch_jump(at)\` makes that jump land on the next byte to be emitted. The distance counts from the end of the two-byte operand. Store it high byte first. If it doesn't fit in a \`u16\`, report \`TOO_FAR\` with \`self.static_error\` (and still write the bytes).

Mind the order: \`static_error\` needs all of \`self\`, so call it before you borrow \`self.code\` for writing.`,
    starter: pj('        todo!()', '        todo!()'),
    solution: pj(EMIT, `        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;`),
    tests: `#[test]
fn emit_jump_leaves_a_hole() {
    let mut c = Compiler::new();
    c.emit(POP);
    let at = c.emit_jump(JUMP);
    assert_eq!(at, 2);
    assert_eq!(c.code,
        [POP, JUMP, 0xff, 0xff]);
}

#[test]
fn jumps_over_three_bytes() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP_UNLESS);
    c.emit(POP);
    c.emit(POP);
    c.emit(POP);
    c.patch_jump(j);
    assert_eq!(c.code[1..3], [0, 3]);
}

#[test]
fn a_jump_over_nothing_is_zero() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    c.patch_jump(j);
    assert_eq!(c.code, [JUMP, 0, 0]);
}

#[test]
fn the_high_byte_comes_first() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    for _ in 0..300 {
        c.emit(POP);
    }
    c.patch_jump(j);
    // 300 = 1 * 256 + 44
    assert_eq!(c.code[1..3], [1, 44]);
    assert!(c.errors.is_empty());
}

#[test]
fn two_holes_patched_in_turn() {
    // if c { A } else { B C }
    let mut c = Compiler::new();
    let then_j = c.emit_jump(JUMP_UNLESS);
    c.emit(POP);
    let else_j = c.emit_jump(JUMP);
    c.patch_jump(then_j);
    c.emit(POP);
    c.emit(POP);
    c.patch_jump(else_j);
    assert_eq!(c.code[1..3], [0, 4]);
    assert_eq!(c.code[5..7], [0, 2]);
}

#[test]
fn too_far_is_an_error() {
    let mut c = Compiler::new();
    let j = c.emit_jump(JUMP);
    for _ in 0..70_000 {
        c.emit(POP);
    }
    c.patch_jump(j);
    assert_eq!(c.errors, [TOO_FAR]);
}`,
    hints: [
      'Start with `emit_jump`: three `emit` calls, then return a position. After three bytes, where does the first placeholder sit?',
      'For `patch_jump`, picture the VM: after reading the jump it stands at `at + 2`, and it should arrive at `self.code.len()`. The distance is the difference.',
      'Check `jump > u16::MAX as usize` and report first. Then borrow `let code = &mut self.code;` and write `(jump >> 8) as u8` at `at` and `jump as u8` at `at + 1`.',
    ],
    walkthrough: `**How to think about it.** A forward jump is two promises kept at different times. When the jump is emitted, nobody knows how far it goes, so all \`emit_jump\` can do is reserve room and say where the room is. Later, when the code to be skipped has been emitted, \`patch_jump\` knows the target (the current end of the code) and fills the room in. The only thing that travels between the two calls is a \`usize\`, the address of the hole. Before writing any arithmetic, draw the bytes: \`[op][hi][lo][...skipped...]\`, and mark where the VM stands after reading the operand.

**\`emit_jump\`, line by line.**

- \`self.emit(op);\` writes the opcode.
- \`self.emit(0xff);\` and \`self.emit(0xff);\` reserve the two operand bytes. Their value does not matter (it will be overwritten), but \`0xff\` makes an unpatched jump easy to spot in a dump.
- \`self.code.len() - 2\` is the function's value: after three bytes, the first placeholder is two from the end. In the first test the code is \`[POP, JUMP, ff, ff]\`, length 4, so the answer is 2.

**\`patch_jump\`, line by line.**

- \`let len = self.code.len();\` is where the target is: the next byte to be emitted.
- \`let jump = len - at - 2;\` is the distance from \`at + 2\` (just past the operand, where the VM's \`ip\` is when it adds) to \`len\`. A jump over nothing is \`0\`; over three \`POP\`s it is \`3\`.
- \`if jump > u16::MAX as usize {\` asks whether the distance fits in two bytes. \`u16::MAX\` is 65,535; \`as usize\` converts it so both sides have the same type.
- \`self.static_error(TOO_FAR);\` records the problem. This line needs \`&mut self\`, which is why it comes *before* the borrow below.
- \`let code = &mut self.code;\` borrows the bytes once for the two writes.
- \`code[at] = (jump >> 8) as u8;\` shifts the high 8 bits down and stores them first. For 300, that is 1.
- \`code[at + 1] = jump as u8;\` stores the low 8 bits: \`as u8\` drops everything above them, so 300 becomes 44 (300 = 1 × 256 + 44).

**Two holes at once.** The \`if\`/\`else\` test opens a then-jump, emits one byte, opens an else-jump, patches the then-jump (distance 4: the \`POP\` and the three bytes of the else-jump), emits two bytes and patches the else-jump (distance 2). Each hole is its own number, so nothing about one affects the other.

**Common wrong attempts.**

- \`let jump = len - at;\` forgets that the VM measures from the end of the operand, so every jump lands two bytes too far, in the middle of some later instruction.
- Writing the low byte first: a jump of 3 is stored as \`[3, 0]\`, which the VM's \`read_short\` (high byte first) reads back as 768, so almost every distance comes out wrong.
- Taking \`let code = &mut self.code;\` first and calling \`self.static_error\` afterwards, while \`code\` is still to be used: rustc rejects it with E0499, two mutable borrows of \`self\` at once.`,
    wrong: [
      {
        code: pj(EMIT, `        let len = self.code.len();
        let jump = len - at;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;`),
        why: 'It forgets the operand: `len - at` counts the two offset bytes themselves, so every jump lands two bytes too far.',
      },
      {
        code: pj(EMIT, `        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        let code = &mut self.code;
        let hi = (jump >> 8) as u8;
        code[at] = jump as u8;
        code[at + 1] = hi;`),
        why: 'It stores the low byte first, so the VM, which reads the high byte first, sees a different distance: 3 is read back as 768.',
      },
      {
        code: pj(EMIT, `        let code = &mut self.code;
        let jump = code.len() - at - 2;
        if jump > u16::MAX as usize {
            self.static_error(TOO_FAR);
        }
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;`),
        why: 'It borrows `self.code` and then calls `self.static_error` while that borrow is still to be used: E0499. Report before borrowing.',
      },
    ],
  },
  emitLoop: {
    optional: true,
    lang: 'rust',
    title: 'emit_loop',
    prompt: `Write \`emit_loop(to)\`: emit \`LOOP\`, then a two-byte offset, high byte first, such that the VM jumps back to \`to\`.

The VM reads the offset with its \`ip\` just past the operand and subtracts it (the tests' \`lands_at\` does the same). If the offset doesn't fit in a \`u16\`, report \`TOO_BIG\` with \`static_error\`.`,
    starter: el('        todo!()'),
    solution: el(`        self.emit(LOOP);
        let len = self.code.len();
        // +2: the operand still to come
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);`),
    tests: `// What the VM does: read the offset, with
// ip just past it, and step back.
fn lands_at(code: &[u8], at: usize)
    -> usize {
    let hi = code[at + 1] as usize;
    let lo = code[at + 2] as usize;
    at + 3 - ((hi << 8) | lo)
}

#[test]
fn writes_loop_then_the_offset() {
    let mut c = Compiler::new();
    c.emit(POP);
    c.emit_loop(0);
    // len 2 after LOOP: 2 - 0 + 2 = 4
    assert_eq!(c.code, [POP, LOOP, 0, 4]);
}

#[test]
fn lands_on_the_loop_start() {
    let mut c = Compiler::new();
    c.emit(POP);
    c.emit(POP); // the loop starts here
    for _ in 0..10 {
        c.emit(POP);
    }
    let at = c.code.len();
    c.emit_loop(2);
    assert_eq!(lands_at(&c.code, at), 2);
}

#[test]
fn a_long_body_uses_the_high_byte() {
    let mut c = Compiler::new();
    for _ in 0..1000 {
        c.emit(POP);
    }
    c.emit_loop(0);
    assert_eq!(lands_at(&c.code, 1000), 0);
    assert!(c.errors.is_empty());
}

#[test]
fn too_long_is_an_error() {
    let mut c = Compiler::new();
    for _ in 0..70_000 {
        c.emit(POP);
    }
    c.emit_loop(0);
    assert_eq!(c.errors, [TOO_BIG]);
}`,
    hints: [
      'A backward jump knows its target already, so there is no hole: emit everything now. What comes first, the opcode or the measuring?',
      'Emit `LOOP`, then measure `self.code.len()`. The VM will subtract from two bytes further on, after the operand.',
      'The offset is `len - to + 2`. Report the error if it is too big, then emit `(offset >> 8) as u8` and `offset as u8`.',
    ],
    walkthrough: `**How to think about it.** A loop's backward jump is the easy case of backpatching: its target, the loop's start, was compiled before the jump, so the distance can be written at once. The only care needed is to measure from the right place, which is where the VM's \`ip\` will be when it subtracts: just past the two operand bytes.

**The solution, line by line.**

- \`self.emit(LOOP);\` writes the opcode first, so that the length measured next is the position of the first operand byte.
- \`let len = self.code.len();\` is that position.
- \`let offset = len - to + 2;\` adds the two operand bytes still to come: the VM will stand at \`len + 2\` and must arrive at \`to\`, so it subtracts \`(len + 2) - to\`. In the chapter's while loop, \`loop\` is at 31, \`len\` is 32, and \`32 - 6 + 2 = 28\` takes \`ip\` from 34 back to 6.
- \`if offset > u16::MAX as usize {\` and \`self.static_error(TOO_BIG);\` report a loop body too long for two bytes.
- \`self.emit((offset >> 8) as u8);\` and \`self.emit(offset as u8);\` write the offset high byte first, as \`read_short\` expects.

There is no borrow trouble here: \`emit\` and \`static_error\` are separate calls, and nothing is held between them.

**Common wrong attempts.**

- Leaving out \`+ 2\`: the offset is measured from before the operand, but the VM subtracts from after it, so the loop lands two bytes past its start, in the middle of an instruction.
- Measuring \`len\` before emitting \`LOOP\`: the offset is one short and the VM lands one byte late.`,
    wrong: [
      {
        code: el(`        self.emit(LOOP);
        let len = self.code.len();
        let offset = len - to;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);`),
        why: 'Without `+ 2`, the offset is measured from before the operand, but the VM subtracts from after it, so the loop lands two bytes past its start.',
      },
      {
        code: el(`        let len = self.code.len();
        self.emit(LOOP);
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.static_error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);`),
        why: 'It measures the length before emitting `LOOP`, so the offset is one short and the VM lands one byte late.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`emit_jump` returns 14. What is at offsets 14 and 15 right after it returns?',
    options: [
      { t: 'The jump’s opcode and the first byte of the next instruction', why: 'The opcode is at 13. Offsets 14 and 15 are its operand.' },
      { t: '`0xff 0xff`, the placeholder', correct: true, why: '`patch_jump(14)` will overwrite them with the real distance once it is known.' },
      { t: 'The final jump distance', why: 'It is not known yet: the code being jumped over has not been compiled.' },
      { t: 'Nothing: the operand is added by `patch_jump`', why: 'The two bytes are reserved now, so that later code lands after them and the patch never has to insert anything.' },
    ],
  },
  {
    q: 'A `jump.unless` operand is at offset 14, and the code is 34 bytes long when it is patched. What distance is written?',
    options: [
      { t: '20', why: '34 − 14 counts the operand’s own two bytes.' },
      { t: '34', why: 'Jumps are relative to where the VM stands, not absolute addresses.' },
      { t: '21', why: 'That would be measured from the opcode at 13.' },
      { t: '18', correct: true, why: '34 − 14 − 2. From 16, just past the operand, 18 bytes on is 34.' },
    ],
  },
  {
    q: 'Why does this version of `patch_jump` fail to compile?\n```rust\nlet code = &mut self.chunk().code;\nlet jump = code.len() - offset - 2;\nif jump > u16::MAX as usize {\n    self.static_error(self.previous,\n        "too much code to jump over");\n}\ncode[offset] = (jump >> 8) as u8;\n```',
    options: [
      { t: '`code` mutably borrows `self` and is used after `static_error`, which needs `&mut self` too', correct: true, why: 'Error E0499: two mutable borrows of `self` alive at once. Report before taking `code`.' },
      { t: '`u16::MAX` cannot be compared with a `usize`', why: '`as usize` converts it, so the comparison is between two `usize`s.' },
      { t: '`as u8` is not allowed on a `usize`', why: 'It is allowed: it keeps the low 8 bits.' },
      { t: 'A `Vec<u8>` cannot be indexed with a `usize`', why: '`usize` is exactly the type a `Vec` is indexed with.' },
    ],
  },
  {
    q: 'What does `(jump >> 8) as u8` give for `jump = 300`?',
    options: [
      { t: '44', why: 'That is `300 as u8`, the low byte.' },
      { t: '1', correct: true, why: '300 = 1 × 256 + 44, so shifting right by 8 leaves 1.' },
      { t: '300', why: 'A `u8` holds 0 to 255, so it cannot be 300.' },
      { t: 'A panic, because 300 does not fit in a `u8`', why: '`as` never panics; it truncates. Here nothing is lost anyway: 300 >> 8 is 1.' },
    ],
  },
  {
    q: 'In drip-rs, why does a `continue` inside a `for` loop need a patched jump, when one inside a `while` does not?',
    options: [
      { t: 'In a `for`, `continue` must skip forwards to the step that moves the counter on, which is not compiled yet', correct: true, why: 'So the loop records `continue_target: None` and keeps the jumps on its `continues` list, patched after the body.' },
      { t: 'A `for` loop has no condition to jump back to', why: 'It has one (counter < end), but `continue` must first run the step, which comes after the body.' },
      { t: '`emit_loop` cannot be used inside a `for`', why: 'It can, and the `for` loop uses it at the end of each pass.' },
      { t: 'It does not: both use `emit_loop`', why: 'Only the `while` loop has `Some(loop_start)` as its continue target.' },
    ],
  },
];
