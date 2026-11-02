// Chapter 256 cards. Keys are stable ids: never rename them.

export const prompts = {
  'repr-u8': {
    q: 'What does `#[repr(u8)]` on a fieldless enum guarantee?',
    a: 'The enum has the size and alignment of a `u8`, and its discriminants are `u8`s: each value is stored as its byte.',
  },
  'implicit-numbers': {
    q: 'Nothing in `enum OpCode { Constant, Nil, ... }` says `Nil = 1`. Where does the 1 come from?',
    a: 'Implicit discriminants: the first variant is 0 and each next one is one more, in the order written.',
  },
  'encode-free': {
    q: 'How does drip-rs’s compiler turn an `OpCode` into a byte?',
    a: '`op as u8`, a numeric cast of the discriminant. With `#[repr(u8)]` it is the stored byte itself.',
  },
  'no-cast': {
    q: 'Why doesn’t `byte as OpCode` compile?',
    a: '`as` only converts between primitive types (E0605). And most bytes, 37 to 255, are not opcodes at all.',
  },
  'all-table': {
    q: 'How does `OpCode::from_byte` decode a byte without `unsafe`?',
    a: 'It indexes a table of every opcode in encoding order: `OpCode::ALL.get(byte as usize).copied()`, which is `None` for bytes past the end.',
  },
  'option-one-byte': {
    q: 'Why is `Option<OpCode>` still 1 byte?',
    a: 'Byte values 37 to 255 are never a valid `OpCode`, so rustc uses one of those spare values for `None`.',
  },
  'name-debug': {
    q: 'Where do disassembler names like `OP_JUMP_IF_FALSE` come from in drip-rs?',
    a: 'From the derived `Debug` name, `JumpIfFalse`: `name()` adds `OP`, an `_` before each capital, and uppercases.',
  },
  'disasm-heap': {
    q: 'Why does drip-rs’s `disassemble_instruction` take a `&Heap` when the TypeScript one doesn’t?',
    a: 'String and function constants are handles into the heap, so printing them needs the heap to look them up.',
  },
  'jump-usize': {
    q: 'The TypeScript disassembler computes a loop’s target as `offset + 3 + sign * j` with `sign = -1`. What does drip-rs do, and why?',
    a: 'Its `Loop` arm computes `offset + 3 - jump`, because offsets are `usize` and can’t be negative.',
  },
};

export const examples = {
  opcodes: {
    lang: 'rust',
    title: 'Opcodes and a tiny disassembler',
    code: `// Opcodes and a tiny disassembler,
// adapted from drip-rs's chunk.rs and
// debug.rs.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum OpCode {
    Constant,
    Nil,
    Add,
    Print,
    Return,
}

use OpCode::*;

impl OpCode {
    const ALL: [OpCode; 5] = [
        Constant, Nil, Add,
        Print, Return,
    ];

    fn from_byte(b: u8)
        -> Option<OpCode> {
        let i = b as usize;
        Self::ALL.get(i).copied()
    }

    // GetLocal -> OP_GET_LOCAL
    fn name(self) -> String {
        let mut s = String::from("OP");
        let dbg = format!("{self:?}");
        for c in dbg.chars() {
            if c.is_ascii_uppercase() {
                s.push('_');
            }
            s.extend(c.to_uppercase());
        }
        s
    }
}

#[derive(Default)]
struct Chunk {
    code: Vec<u8>,
    lines: Vec<usize>,
    constants: Vec<f64>,
}

impl Chunk {
    fn write(&mut self, b: u8, l: usize)
    {
        self.code.push(b);
        self.lines.push(l);
    }
}

// One instruction: its text and the
// offset of the next one.
fn dis(c: &Chunk, at: usize)
    -> (String, usize) {
    let b = c.code[at];
    let p = format!("{at:04} {:>4} ",
        c.lines[at]);
    let Some(op) = OpCode::from_byte(b)
    else {
        let u = "Unknown opcode";
        let t = format!("{u} {b}");
        return (p + &t, at + 1);
    };
    let name = op.name();
    if op == Constant {
        let k = c.code[at + 1];
        let v = c.constants[k as usize];
        let t = format!(
            "{name:<16} {k:>4} '{v}'");
        return (p + &t, at + 2);
    }
    (p + &name, at + 1)
}

fn main() {
    let mut c = Chunk::default();
    c.constants.push(1.5);
    c.write(Constant as u8, 1);
    c.write(0, 1);
    c.write(Print as u8, 1);
    c.write(Nil as u8, 2);
    c.write(Return as u8, 2);
    c.write(99, 2); // not an opcode
    println!("bytes: {:?}", c.code);

    let mut at = 0;
    while at < c.code.len() {
        let (text, next) = dis(&c, at);
        println!("{text}");
        at = next;
    }
    use std::mem::size_of;
    let n = size_of::<Option<OpCode>>();
    println!("Option<OpCode>: {n} B");
}`,
  },
};

export const exercises = {
  opcodeRoundTrip: {
    lang: 'rust',
    title: 'Encode, decode, name',
    prompt:
      'Here are five opcodes, numbered by `#[repr(u8)]` in the order written. Add a constant `ALL` holding every opcode in encoding order, then write `encode` (the opcode’s byte), `decode` (the opcode for a byte, or `None`), and `name`, which turns `GetLocal` into `OP_GET_LOCAL` like the TypeScript disassembler.',
    starter: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Constant,
    Nil,
    GetLocal,
    JumpIfFalse,
    Return,
}

impl Op {
    fn encode(self) -> u8 {
        todo!()
    }

    fn decode(b: u8) -> Option<Op> {
        todo!()
    }

    fn name(self) -> String {
        todo!()
    }
}`,
    solution: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Constant,
    Nil,
    GetLocal,
    JumpIfFalse,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Constant,
        Op::Nil,
        Op::GetLocal,
        Op::JumpIfFalse,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`GetLocal\` -> \`OP_GET_LOCAL\`
    fn name(self) -> String {
        let mut s = String::from("OP");
        let dbg = format!("{self:?}");
        for c in dbg.chars() {
            if c.is_ascii_uppercase() {
                s.push('_');
            }
            s.extend(c.to_uppercase());
        }
        s
    }
}`,
    tests: `#[test]
fn encoding_follows_declaration_order() {
    assert_eq!(Op::Constant.encode(), 0);
    assert_eq!(Op::GetLocal.encode(), 2);
    assert_eq!(Op::JumpIfFalse.encode(), 3);
    assert_eq!(Op::Return.encode(), 4);
}

#[test]
fn every_opcode_round_trips() {
    for b in 0..5u8 {
        let op = Op::decode(b).unwrap();
        assert_eq!(op.encode(), b);
    }
    assert_eq!(Op::decode(1), Some(Op::Nil));
}

#[test]
fn other_bytes_are_not_opcodes() {
    assert_eq!(Op::decode(5), None);
    assert_eq!(Op::decode(255), None);
}

#[test]
fn names_match_the_typescript_vm() {
    assert_eq!(Op::Constant.name(), "OP_CONSTANT");
    assert_eq!(Op::GetLocal.name(), "OP_GET_LOCAL");
    assert_eq!(Op::JumpIfFalse.name(), "OP_JUMP_IF_FALSE");
}`,
    hints: [
      '`encode` is a cast: `self as u8`.',
      'Write `const ALL: [Op; 5] = [Op::Constant, ...];` inside the `impl`, in the same order as the enum. Then `decode` is `Op::ALL.get(b as usize).copied()`.',
      'For `name`, start with `String::from("OP")`, loop over the characters of `format!("{self:?}")`, push `_` before each uppercase letter, and push the uppercased letter.',
    ],
    walkthrough: `This is \`chunk.rs\`’s \`OpCode\` in miniature.

- **\`encode\`.** A fieldless enum casts to an integer with \`as\`, and with \`#[repr(u8)]\` the result is the byte the value is stored as. \`JumpIfFalse\` is fourth in the list, so it is 3.
- **\`ALL\` and \`decode\`.** The cast doesn’t go the other way, so keep a table where position \`i\` holds the opcode whose byte is \`i\`. \`get\` returns \`Option<&Op>\` and \`.copied()\` turns it into \`Option<Op>\`: \`Some\` for 0 to 4, \`None\` for anything else, never a panic. The round-trip test is the same one drip-rs runs over all 37 opcodes; it catches a table written out of order.
- **\`name\`.** \`Debug\` gives \`"JumpIfFalse"\`. Each capital starts a word, so it gets an \`_\` in front, and every letter is uppercased: \`OP\` + \`_JUMP\` + \`_IF\` + \`_FALSE\`.

drip-rs pushes \`c.to_ascii_uppercase()\`; \`s.extend(c.to_uppercase())\` does the same for these ASCII names.`,
    wrong: [
      {
        code: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Constant,
    Nil,
    GetLocal,
    JumpIfFalse,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Constant,
        Op::Nil,
        Op::GetLocal,
        Op::JumpIfFalse,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Some(Op::ALL[b as usize])
    }

    /// \`GetLocal\` -> \`OP_GET_LOCAL\`
    fn name(self) -> String {
        let mut s = String::from("OP");
        let dbg = format!("{self:?}");
        for c in dbg.chars() {
            if c.is_ascii_uppercase() {
                s.push('_');
            }
            s.extend(c.to_uppercase());
        }
        s
    }
}`,
        why: 'Indexing with `[]` panics for a byte past the end, like 5 or 255. A byte from a corrupt chunk should give `None`, which is what `get` returns.',
      },
      {
        code: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Constant,
    Nil,
    GetLocal,
    JumpIfFalse,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Constant,
        Op::Nil,
        Op::GetLocal,
        Op::JumpIfFalse,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`GetLocal\` -> \`OP_GET_LOCAL\`
    fn name(self) -> String {
        let dbg = format!("{self:?}");
        let up = dbg.to_uppercase();
        format!("OP_{up}")
    }
}`,
        why: 'Uppercasing the whole name loses the word breaks: `OP_GETLOCAL`. Put an `_` before each capital first.',
      },
      {
        code: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Constant,
    Nil,
    GetLocal,
    JumpIfFalse,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Constant,
        Op::GetLocal,
        Op::Nil,
        Op::JumpIfFalse,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`GetLocal\` -> \`OP_GET_LOCAL\`
    fn name(self) -> String {
        let mut s = String::from("OP");
        let dbg = format!("{self:?}");
        for c in dbg.chars() {
            if c.is_ascii_uppercase() {
                s.push('_');
            }
            s.extend(c.to_uppercase());
        }
        s
    }
}`,
        why: '`ALL` must be in encoding order. With `Nil` and `GetLocal` swapped, `decode(1)` gives `GetLocal`, whose byte is 2. This is the mistake drip-rs’s round-trip test exists to catch.',
      },
    ],
  },
  jumpTarget: {
    lang: 'rust',
    optional: true,
    title: 'Where does the jump land?',
    prompt:
      'A jump instruction at offset `at` is three bytes: the opcode, then a 16-bit distance, high byte first. The distance counts from the end of the instruction (`at + 3`): forward for `Jump` and `JumpIfFalse`, backward for `Loop`. Write `target`, which the disassembler prints after `->`.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpIfFalse,
    Loop,
}

fn target(
    op: Op,
    code: &[u8],
    at: usize,
) -> usize {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpIfFalse,
    Loop,
}

/// Where the jump at \`at\` goes. Its two
/// operand bytes are a big-endian u16.
fn target(
    op: Op,
    code: &[u8],
    at: usize,
) -> usize {
    let hi = code[at + 1] as usize;
    let lo = code[at + 2] as usize;
    let jump = hi << 8 | lo;
    if op == Op::Loop {
        at + 3 - jump
    } else {
        at + 3 + jump
    }
}`,
    tests: `#[test]
fn a_forward_jump() {
    // 9: JUMP_IF_FALSE 0 12  ->  24
    let mut code = vec![0u8; 30];
    code[10] = 0;
    code[11] = 12;
    assert_eq!(target(Op::JumpIfFalse, &code, 9), 24);
    assert_eq!(target(Op::Jump, &code, 9), 24);
}

#[test]
fn a_loop_goes_back() {
    // 21: LOOP 0 20  ->  4
    let mut code = vec![0u8; 30];
    code[22] = 0;
    code[23] = 20;
    assert_eq!(target(Op::Loop, &code, 21), 4);
}

#[test]
fn the_high_byte_counts_256() {
    let code = [0u8, 1, 2];
    // 0x0102 = 258 bytes forward
    assert_eq!(target(Op::Jump, &code, 0), 261);
}`,
    hints: [
      'Read `code[at + 1]` and `code[at + 2]`, and convert each to `usize` **before** shifting.',
      'The distance is `hi << 8 | lo`.',
      'For `Loop`, subtract from `at + 3`; otherwise add.',
    ],
    walkthrough: `This is the jump arm of drip-rs’s \`disassemble_instruction\`, as a function.

- **Widen first.** \`code[at + 1] as usize\` turns the byte into a \`usize\` *before* the shift. A \`u8\` shifted left by 8 has no bits left, and rustc rejects \`hi << 8\` on a \`u8\` outright: “this arithmetic operation will overflow”. In TypeScript, \`<<\` works on 32-bit integers, so the problem never showed.
- **Big-endian.** The high byte is worth 256 each: \`1, 2\` is 258.
- **Count from the end of the instruction.** By the time the VM jumps, its instruction pointer is already past the three bytes, so the distance starts at \`at + 3\`.
- **No negatives.** A loop jumps back, and \`usize\` can’t hold \`-20\`, so the \`Loop\` arm subtracts. In the program from the chapter, the \`OP_LOOP\` at 21 with distance 20 lands on 4, where the condition is tested again.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpIfFalse,
    Loop,
}

/// Where the jump at \`at\` goes. Its two
/// operand bytes are a big-endian u16.
fn target(
    op: Op,
    code: &[u8],
    at: usize,
) -> usize {
    let hi = code[at + 1];
    let lo = code[at + 2];
    let jump = (hi << 8 | lo) as usize;
    if op == Op::Loop {
        at + 3 - jump
    } else {
        at + 3 + jump
    }
}`,
        why: 'Shifting a `u8` left by 8 overflows: it doesn’t compile. Convert both bytes to `usize` before combining them.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpIfFalse,
    Loop,
}

/// Where the jump at \`at\` goes. Its two
/// operand bytes are a big-endian u16.
fn target(
    op: Op,
    code: &[u8],
    at: usize,
) -> usize {
    let hi = code[at + 1] as usize;
    let lo = code[at + 2] as usize;
    let jump = hi << 8 | lo;
    if op == Op::Loop {
        at - jump
    } else {
        at + jump
    }
}`,
        why: 'The distance is measured from the end of the three-byte instruction, `at + 3`, not from the opcode.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `#[repr(u8)] enum OpCode { Constant, Nil, True, ... }`, what is `OpCode::True as u8`?',
    options: [
      { t: '1', why: 'That is `Nil`. Counting starts at 0.' },
      { t: '2', correct: true, why: 'Implicit discriminants count from 0 in declaration order.' },
      { t: 'It depends on the compiler', why: 'The numbering of implicit discriminants is defined by the language.' },
      { t: 'It doesn’t compile', why: 'Casting a fieldless enum to an integer is allowed.' },
    ],
  },
  {
    q: 'Why does drip-rs decode bytes with `OpCode::ALL.get(b as usize).copied()` instead of `b as OpCode`?',
    options: [
      { t: '`b as OpCode` is slower', why: 'It isn’t a speed question: the cast doesn’t exist (E0605).' },
      { t: 'Because the crate forbids `as`', why: '`as` is used all over drip-rs, including `op as u8`.' },
      { t: 'Integers can’t be cast to enums, and most bytes are not opcodes; the table gives `None` for those without `unsafe`', correct: true, why: 'Reinterpreting the byte would need `unsafe`, which `#![forbid(unsafe_code)]` rules out.' },
    ],
  },
  {
    q: 'What is `size_of::<Option<OpCode>>()`?',
    options: [
      { t: '1', correct: true, why: 'Measured with rustc 1.97: a spare byte value (37 to 255) stands for `None`.' },
      { t: '2: one byte for the tag, one for the opcode', why: 'That would be needed if every byte were a valid `OpCode`.' },
      { t: '8', why: 'Nothing here is a pointer.' },
    ],
  },
  {
    q: 'Someone adds a new opcode in the middle of the enum but forgets `ALL`. What catches it?',
    options: [
      { t: 'Nothing; the VM silently runs the wrong instruction', why: 'Something does catch it, before any program runs.' },
      { t: 'The compiler: `ALL` now has the wrong length', why: '`ALL` is declared `[OpCode; 37]` and still holds 37 entries, so it compiles.' },
      { t: 'The borrow checker', why: 'No borrowing is involved.' },
      { t: '`cargo test`: the unit test checks `*op as usize == i` for every entry of `ALL`', correct: true, why: 'Every opcode after the new one now has a discriminant one higher than its place in the table.' },
    ],
  },
  {
    q: 'Why does drip-rs’s disassembler need the heap?',
    options: [
      { t: 'To allocate the strings it returns', why: 'Its output is ordinary `String`s, not heap objects.' },
      { t: 'To run the garbage collector first', why: 'Disassembling never collects.' },
      { t: 'Because a string constant is a handle, and only the heap can turn it into text', correct: true, why: 'Constants are `Value`s; a `Value::String` holds a handle, not the characters.' },
    ],
  },
  {
    q: 'In drip-rs’s disassembler, `{name:<16}` does what the TypeScript code did with…',
    options: [
      { t: '`String(n).padStart(4)`', why: 'That is `{n:>4}`: right-aligned.' },
      { t: '`name.padEnd(16)`', correct: true, why: '`<` left-aligns in a field of 16 characters.' },
      { t: '`pad(offset, 4)` with zeros', why: 'That is `{offset:04}`.' },
      { t: '`name.toUpperCase()`', why: 'Format specs set width and alignment, not case.' },
    ],
  },
];
