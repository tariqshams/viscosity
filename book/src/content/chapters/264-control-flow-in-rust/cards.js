// Chapter 264 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'pj-returns': {
    q: 'What does drip-rs’s `emit_jump` return, and of what type?',
    a: 'The position of the jump’s two placeholder bytes, `code.len() - 2`, as a `usize`.',
  },
  'pj-number': {
    q: 'Why does the caller keep the jump’s position as a number rather than a `&mut u8` into the code?',
    a: 'A number borrows nothing, so the compiler can keep emitting the body. A reference would lock the chunk until the patch.',
  },
  'pj-minus-two': {
    q: 'In `patch_jump`, why is the distance `len - offset - 2`?',
    a: 'A jump is measured from the end of its operand, and the operand is the two bytes starting at `offset`.',
  },
  'pj-as-u8': {
    q: 'What does `jump as u8` do, and what was its TypeScript twin?',
    a: 'It keeps the low 8 bits (a numeric cast truncates). TypeScript wrote `jump & 0xff`.',
  },
  'pj-order': {
    q: 'Why does `patch_jump` call `self.error(...)` before `let code = &mut self.chunk().code;`?',
    a: '`code` borrows `self` mutably through `chunk()`, and `self.error` needs `&mut self` too. Taking `code` first and erroring after is E0499.',
  },
  'pj-big-endian': {
    q: 'In which order are a jump’s two offset bytes stored?',
    a: 'High byte first: `code[offset] = (jump >> 8) as u8`, then the low byte.',
  },
  'pj-loop-plus': {
    q: 'Why does `emit_loop` compute `len - loop_start + 2`?',
    a: 'When it computes the offset, the two operand bytes aren’t written yet, and the VM steps back from the end of the operand.',
  },
  'pj-option-exit': {
    q: 'How does `for_statement` say “this loop has no condition, so there is no exit jump”?',
    a: '`exit_jump` is `None`; it is patched with `if let Some(exit_jump) = exit_jump`. TypeScript used `-1`.',
  },
};

export const examples = {};

export const exercises = {
  patchJump: {
    lang: 'rust',
    title: 'emit_jump and patch_jump',
    prompt: `Write the two halves of a forward jump for this small compiler.

- \`emit_jump(op)\` emits \`op\` and two placeholder bytes \`0xff, 0xff\`, and returns the index of the first placeholder.
- \`patch_jump(at)\` makes that jump land on the next byte to be emitted. The distance counts from the end of the two-byte operand. Store it high byte first. If it doesn't fit in a \`u16\`, report \`TOO_FAR\` with \`self.error\`.

Remember the order: \`self.error\` needs all of \`self\`, so call it before you borrow \`self.code\` for writing.`,
    starter: `const JUMP: u8 = 1;
const JUMP_IF_FALSE: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "Too much code to jump over.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        todo!()
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        todo!()
    }
}`,
    solution: `const JUMP: u8 = 1;
const JUMP_IF_FALSE: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "Too much code to jump over.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
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
    let j = c.emit_jump(JUMP_IF_FALSE);
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
    // if (..) { A } else { B C }
    let mut c = Compiler::new();
    let then_j = c.emit_jump(JUMP_IF_FALSE);
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
      'After emitting three bytes, the first placeholder is at `self.code.len() - 2`.',
      'The distance is `self.code.len() - at - 2`: everything after the operand.',
      'Check `jump > u16::MAX as usize` and report first. Then write `(jump >> 8) as u8` at `at` and `jump as u8` at `at + 1`.',
    ],
    walkthrough: `**The hole.** \`emit_jump\` can't know the distance, so it writes \`0xff 0xff\` and returns where they are. That \`usize\` is all the caller keeps.

**The distance.** When the VM reads a jump, its \`ip\` ends up just past the two operand bytes, at \`at + 2\`. The target is the current end of the code, \`len\`. So the jump is \`len - (at + 2)\`. A jump over nothing is 0.

**The bytes.** \`(jump >> 8) as u8\` is the high byte and \`jump as u8\` the low one: \`as\` keeps the low 8 bits. 300 is 1 × 256 + 44. The VM's \`read_short\` puts them back together as \`(high << 8) | low\`, so the order must match.

**The order of operations.** \`let code = &mut self.code;\` borrows a field of \`self\`. While \`code\` is still to be used, \`self.error(..)\`, which borrows all of \`self\`, is E0499. drip-rs's \`patch_jump\` checks and reports first for exactly this reason.

**Two holes.** In an \`if\`/\`else\`, the then-jump is patched as soon as the then-branch is done, and the else-jump after the else-branch. Each \`usize\` is independent, so any number of holes can be open at once.`,
    wrong: [
      {
        code: `const JUMP: u8 = 1;
const JUMP_IF_FALSE: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "Too much code to jump over.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at;
        if jump > u16::MAX as usize {
            self.error(TOO_FAR);
        }
        let code = &mut self.code;
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
        why: 'It forgets the operand: `len - at` counts the two offset bytes themselves, so every jump lands 2 bytes too far.',
      },
      {
        code: `const JUMP: u8 = 1;
const JUMP_IF_FALSE: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "Too much code to jump over.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let len = self.code.len();
        let jump = len - at - 2;
        if jump > u16::MAX as usize {
            self.error(TOO_FAR);
        }
        let code = &mut self.code;
        let hi = (jump >> 8) as u8;
        code[at] = jump as u8;
        code[at + 1] = hi;
    }
}`,
        why: 'It stores the low byte first. Any jump of 256 or more is read back by the VM as a different distance.',
      },
      {
        code: `const JUMP: u8 = 1;
const JUMP_IF_FALSE: u8 = 2;
const POP: u8 = 3;

const TOO_FAR: &str =
    "Too much code to jump over.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit \`op\`, then a 2-byte hole.
    // Return where the hole is.
    fn emit_jump(&mut self, op: u8)
        -> usize {
        self.emit(op);
        self.emit(0xff);
        self.emit(0xff);
        self.code.len() - 2
    }

    // Make the jump whose operand is at
    // \`at\` land on the next byte.
    fn patch_jump(&mut self, at: usize)
    {
        let code = &mut self.code;
        let jump = code.len() - at - 2;
        if jump > u16::MAX as usize {
            self.error(TOO_FAR);
        }
        code[at] = (jump >> 8) as u8;
        code[at + 1] = jump as u8;
    }
}`,
        why: 'It borrows `self.code` and then calls `self.error` while that borrow is still to be used: E0499. Check and report before borrowing.',
      },
    ],
  },
  emitLoop: {
    optional: true,
    lang: 'rust',
    title: 'emit_loop',
    prompt: `Write \`emit_loop(to)\`: emit \`LOOP\`, then a two-byte offset, high byte first, such that the VM jumps back to \`to\`.

The VM reads the offset with its \`ip\` just past the operand and subtracts it (the tests' \`lands_at\` does the same). If the offset doesn't fit in a \`u16\`, report \`TOO_BIG\`.`,
    starter: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "Loop body too large.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        todo!()
    }
}`,
    solution: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "Loop body too large.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        self.emit(LOOP);
        let len = self.code.len();
        // +2: operand still to come
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
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
      'Emit `LOOP` first, then measure `self.code.len()`.',
      'The VM subtracts from the position *after* the operand, which is 2 bytes past the current length: `len - to + 2`.',
      'Report the error if needed, then emit `(offset >> 8) as u8` and `offset as u8`.',
    ],
    walkthrough: `**Backwards needs no hole.** The loop's start is already known, so the offset can be written at once.

**Where the + 2 comes from.** After emitting \`LOOP\`, the length is the position of the first operand byte. The VM's \`ip\` will be two bytes later, past the operand, when it subtracts. So the offset is \`(len + 2) - to\`. In chapter 264's listing, \`LOOP\` is at 24, \`len\` is 25, and \`25 - 4 + 2 = 23\` takes \`ip\` from 27 back to 4.

**Why emit first.** Measuring \`len\` before emitting \`LOOP\` makes every loop land one byte early, in the middle of an instruction.

**No borrow trouble here.** \`emit\` and \`error\` are separate calls, and nothing is held between them.`,
    wrong: [
      {
        code: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "Loop body too large.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        self.emit(LOOP);
        let len = self.code.len();
        let offset = len - to;
        if offset > u16::MAX as usize {
            self.error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
        why: 'Without `+ 2`, the offset is measured from before the operand, but the VM subtracts from after it, so the loop lands 2 bytes past its start.',
      },
      {
        code: `const LOOP: u8 = 4;
const POP: u8 = 3;

const TOO_BIG: &str =
    "Loop body too large.";

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

    fn error(&mut self, msg: &str) {
        self.errors.push(msg.into());
    }

    // Emit LOOP and a 2-byte offset
    // that takes the VM back to \`to\`.
    fn emit_loop(&mut self, to: usize)
    {
        let len = self.code.len();
        self.emit(LOOP);
        // +2: operand still to come
        let offset = len - to + 2;
        if offset > u16::MAX as usize {
            self.error(TOO_BIG);
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }
}`,
        why: 'It measures the length before emitting `LOOP`, so the offset is one short and the VM lands one byte late.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`emit_jump` returns 10. What is at offsets 10 and 11 right after it returns?',
    options: [
      { t: 'The jump’s opcode and the first byte of the next instruction', why: 'The opcode is at 9. 10 and 11 are the operand.' },
      { t: '`0xff 0xff`, the placeholder', correct: true, why: '`patch_jump(10)` will overwrite them with the real distance.' },
      { t: 'The final jump distance', why: 'It isn’t known yet: the code being jumped over hasn’t been compiled.' },
      { t: 'Nothing: the operand is added by `patch_jump`', why: 'The two bytes are reserved now, so later code lands after them.' },
    ],
  },
  {
    q: 'The `JUMP_IF_FALSE` operand is at offset 10, and the code is 27 bytes long when it is patched. What distance is written?',
    options: [
      { t: '17', why: '27 − 10 counts the operand’s own two bytes.' },
      { t: '27', why: 'Jumps are relative, not absolute.' },
      { t: '15', correct: true, why: '27 − 10 − 2. From 12, just past the operand, 15 bytes on is 27.' },
      { t: '18', why: 'That would be measured from the opcode at 9.' },
    ],
  },
  {
    q: 'Why does this `patch_jump` fail to compile?\n```rust\nlet code = &mut self.chunk().code;\nlet jump = code.len() - offset - 2;\nif jump > u16::MAX as usize {\n    self.error("Too much code...");\n}\ncode[offset] = (jump >> 8) as u8;\n```',
    options: [
      { t: '`u16::MAX` can’t be compared with a `usize`', why: '`as usize` converts it. The comparison is fine.' },
      { t: '`code` mutably borrows `self` and is used after `self.error`, which needs `&mut self` too', correct: true, why: 'E0499. Check and report before taking `code`.' },
      { t: '`as u8` is not allowed on a `usize`', why: 'It is allowed: it truncates to the low 8 bits.' },
      { t: 'A `Vec<u8>` can’t be indexed with a `usize`', why: '`usize` is exactly the index type.' },
    ],
  },
  {
    q: 'What does `(jump >> 8) as u8` give for `jump = 300`?',
    options: [
      { t: '44', why: 'That is `300 as u8`, the low byte.' },
      { t: '300', why: 'A `u8` can’t hold 300.' },
      { t: 'A panic, because 300 doesn’t fit', why: '`as` never panics; it truncates. Here no truncation is needed: 300 >> 8 is 1.' },
      { t: '1', correct: true, why: '300 = 1 × 256 + 44, so the high byte is 1.' },
    ],
  },
  {
    q: 'Why doesn’t a `LOOP` instruction need backpatching?',
    options: [
      { t: 'Its target, the loop’s start, has already been compiled, so the distance is known', correct: true, why: '`emit_loop(loop_start)` writes the offset at once.' },
      { t: 'The VM searches backwards for the loop’s start', why: 'The VM just subtracts the offset from `ip`.' },
      { t: 'Loops always jump back exactly 3 bytes', why: 'The distance depends on the size of the body.' },
      { t: 'It does: `patch_jump` is called on every loop', why: '`patch_jump` is for forward jumps, like the loop’s exit.' },
    ],
  },
  {
    q: 'In drip-rs, a `for` loop has no condition. How does `for_statement` record that?',
    options: [
      { t: '`exit_jump = -1`', why: 'A `usize` can’t be −1. That was TypeScript’s sentinel.' },
      { t: 'It emits a `JUMP_IF_FALSE` that is never patched', why: 'An unpatched `0xff 0xff` would jump far past the code.' },
      { t: 'It reports a compile error', why: '`for (;;)` is legal: it loops until something returns.' },
      { t: '`exit_jump` stays `None`, and only `Some` is patched', correct: true, why: '`if let Some(exit_jump) = exit_jump { self.patch_jump(exit_jump); ... }`.' },
    ],
  },
];
