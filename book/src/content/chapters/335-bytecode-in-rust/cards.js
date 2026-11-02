// Chapter 335 cards. Keys are stable ids: never rename them.

export const prompts = {
  'repr-u8': {
    q: 'What does `#[repr(u8)]` on an enum without data guarantee?',
    a: 'The enum has the size and alignment of a `u8`, and its discriminants are `u8`s: each value is stored as its byte.',
  },
  'implicit-numbers': {
    q: 'Nothing in `enum OpCode { Const, None, ... }` says `None = 1`. Where does the 1 come from?',
    a: 'Implicit discriminants: the first variant is 0 and each next one is one more, in the order written.',
  },
  'encode-free': {
    q: 'How does drip-rs’s compiler turn an `OpCode` into a byte?',
    a: '`op as u8`, a numeric cast of the discriminant. With `#[repr(u8)]` it is the stored byte itself.',
  },
  'no-cast': {
    q: 'Why doesn’t `byte as OpCode` compile?',
    a: '`as` only converts between primitive types (E0605). And most bytes, 53 to 255, are not opcodes at all.',
  },
  'all-table': {
    q: 'How does `OpCode::from_byte` decode a byte without `unsafe`?',
    a: 'It indexes a table of every opcode in encoding order: `OpCode::ALL.get(byte as usize).copied()`, which is `None` for bytes past the end.',
  },
  'option-one-byte': {
    q: 'Why is `Option<OpCode>` still 1 byte?',
    a: 'Byte values 53 to 255 are never a valid `OpCode`, so rustc uses one of those spare values for `None`.',
  },
  'name-debug': {
    q: 'Where do disassembler names like `jump.unless.keep` come from in drip-rs?',
    a: 'From the derived `Debug` name, `JumpUnlessKeep`: `name()` puts a dot before each capital after the first and lowercases every letter.',
  },
  'disasm-heap': {
    q: 'Why does drip-rs’s `disassemble_instruction` take a `&Heap` when the TypeScript one doesn’t?',
    a: 'String and function constants are handles into the heap, so printing them needs the heap to look them up.',
  },
  'jump-usize': {
    q: 'How does drip-rs’s disassembler work out where a `loop` instruction at `offset` lands, and why that way?',
    a: '`offset + 3 - jump`: it subtracts, because offsets are `usize` and can’t hold a negative distance.',
  },
};

export const examples = {
  opcodes: {
    lang: 'rust',
    title: 'Opcodes and a tiny disassembler',
    code: `// Opcodes and a tiny disassembler,
// in the style of drip-rs's chunk.rs
// and debug.rs.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum OpCode {
    Const,
    None,
    Add,
    Print,
    Return,
}

impl OpCode {
    const ALL: [OpCode; 5] = {
        use OpCode::*;
        [Const, None, Add, Print,
         Return]
    };

    fn from_byte(b: u8)
        -> Option<OpCode> {
        let i = b as usize;
        Self::ALL.get(i).copied()
    }

    // JumpUnless -> jump.unless
    fn name(self) -> String {
        let mut s = String::new();
        let d = format!("{self:?}");
        for (i, c) in d.char_indices() {
            let cap = c.is_uppercase();
            if cap && i > 0 {
                s.push('.');
            }
            s.extend(c.to_lowercase());
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
        let u = "unknown opcode";
        let t = format!("{u} {b}");
        return (p + &t, at + 1);
    };
    let name = op.name();
    if op == OpCode::Const {
        // a two-byte, big-endian index
        let code = &c.code;
        let hi = code[at + 1] as usize;
        let lo = code[at + 2] as usize;
        let k = hi << 8 | lo;
        let v = c.constants[k];
        let t = format!(
            "{name:<16} {k:>4} '{v}'");
        return (p + &t, at + 3);
    }
    (p + &name, at + 1)
}

fn main() {
    use OpCode::*;
    let mut c = Chunk::default();
    c.constants.push(1.5);
    c.write(Const as u8, 1);
    c.write(0, 1);
    c.write(0, 1);
    c.write(Print as u8, 1);
    c.write(None as u8, 2);
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
      'Here are five opcodes, numbered by `#[repr(u8)]` in the order written. Add a constant `ALL` holding every opcode in encoding order, then write `encode` (the opcode’s byte), `decode` (the opcode for a byte, or `None`), and `name`, which turns `LoadLocal` into `load.local` and `JumpUnlessKeep` into `jump.unless.keep`, like both disassemblers.',
    starter: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Const,
    None,
    LoadLocal,
    JumpUnlessKeep,
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
    Const,
    None,
    LoadLocal,
    JumpUnlessKeep,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Const,
        Op::None,
        Op::LoadLocal,
        Op::JumpUnlessKeep,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`LoadLocal\` -> \`load.local\`
    fn name(self) -> String {
        let mut s = String::new();
        let d = format!("{self:?}");
        for (i, c) in d.char_indices() {
            let cap = c.is_uppercase();
            if cap && i > 0 {
                s.push('.');
            }
            s.extend(c.to_lowercase());
        }
        s
    }
}`,
    tests: `#[test]
fn encoding_follows_declaration_order() {
    assert_eq!(Op::Const.encode(), 0);
    assert_eq!(Op::LoadLocal.encode(), 2);
    assert_eq!(Op::JumpUnlessKeep.encode(), 3);
    assert_eq!(Op::Return.encode(), 4);
}

#[test]
fn every_opcode_round_trips() {
    for b in 0..5u8 {
        let op = Op::decode(b).unwrap();
        assert_eq!(op.encode(), b);
    }
    assert_eq!(Op::decode(1), Some(Op::None));
}

#[test]
fn other_bytes_are_not_opcodes() {
    assert_eq!(Op::decode(5), None);
    assert_eq!(Op::decode(255), None);
}

#[test]
fn names_match_the_disassemblers() {
    assert_eq!(Op::Const.name(), "const");
    assert_eq!(Op::LoadLocal.name(), "load.local");
    assert_eq!(Op::JumpUnlessKeep.name(), "jump.unless.keep");
}`,
    hints: [
      'Start with the easy direction: `encode` is a single cast.',
      'The cast doesn’t go the other way, so write `const ALL: [Op; 5] = [Op::Const, ...];` inside the `impl`, in the same order as the enum. Then `decode` is `Op::ALL.get(b as usize).copied()`.',
      'For `name`, loop over `format!("{self:?}").char_indices()`, which gives each character with its position. Push a `.` before each uppercase letter except the first (`i > 0`), then append the letter in lower case with `s.extend(c.to_lowercase())`.',
    ],
    walkthrough: `**How to think about it.** There are two directions and they are not alike. From opcode to byte is free, because \`#[repr(u8)]\` makes each value *be* its byte. From byte to opcode needs a check, because only five of the 256 byte values are opcodes, so the answer must be an \`Option\`, and the simplest safe way to build it is a table where position \`i\` holds the opcode whose byte is \`i\`. The name is a third, separate job: the derived \`Debug\` text already has the words, run together in CamelCase, and you only need to split them.

**The solution, line by line.**

- \`const ALL: [Op; 5] = [Op::Const, Op::None, Op::LoadLocal, Op::JumpUnlessKeep, Op::Return];\` lists every opcode in exactly the order of the enum, so \`ALL[i]\` is the opcode whose byte is \`i\`. It is a \`const\` inside the \`impl\`, so it costs nothing at run time.
- \`fn encode(self) -> u8 { self as u8 }\`: a cast of the discriminant. \`JumpUnlessKeep\` is fourth in the list, so it is 3.
- \`fn decode(b: u8) -> Option<Op> { Op::ALL.get(b as usize).copied() }\`: \`b as usize\` widens the byte to an index; \`get\` gives \`Some(&op)\` inside the table and \`None\` past its end, never a panic; \`copied\` turns \`Option<&Op>\` into \`Option<Op>\`.
- \`let mut s = String::new();\` starts the name empty.
- \`let d = format!("{self:?}");\` is the derived \`Debug\` text, such as \`"JumpUnlessKeep"\`.
- \`for (i, c) in d.char_indices()\` visits each character with its position (its byte offset, which for these ASCII names is simply its place in the word).
- \`let cap = c.is_uppercase(); if cap && i > 0 { s.push('.'); }\`: every capital starts a word, and every word but the first gets a dot in front.
- \`s.extend(c.to_lowercase());\` adds the letter in lower case (\`to_lowercase\` gives an iterator of characters, which \`extend\` appends; drip-rs uses \`to_ascii_lowercase\`, which is the same for these ASCII names), giving \`jump\` + \`.unless\` + \`.keep\`.

**Common wrong attempts.**

- \`Some(Op::ALL[b as usize])\`: square-bracket indexing panics for a byte past the end, like 5 or 255, where \`get\` gives \`None\`.
- \`dbg.to_lowercase()\` on its own loses the word breaks: \`loadlocal\`.
- \`ALL\` written in a different order from the enum: \`decode(1)\` then gives \`LoadLocal\`, whose byte is 2. This is the mistake drip-rs’s round-trip test exists to catch.`,
    wrong: [
      {
        code: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Const,
    None,
    LoadLocal,
    JumpUnlessKeep,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Const,
        Op::None,
        Op::LoadLocal,
        Op::JumpUnlessKeep,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Some(Op::ALL[b as usize])
    }

    /// \`LoadLocal\` -> \`load.local\`
    fn name(self) -> String {
        let mut s = String::new();
        let d = format!("{self:?}");
        for (i, c) in d.char_indices() {
            let cap = c.is_uppercase();
            if cap && i > 0 {
                s.push('.');
            }
            s.extend(c.to_lowercase());
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
    Const,
    None,
    LoadLocal,
    JumpUnlessKeep,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Const,
        Op::None,
        Op::LoadLocal,
        Op::JumpUnlessKeep,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`LoadLocal\` -> \`load.local\`
    fn name(self) -> String {
        let dbg = format!("{self:?}");
        dbg.to_lowercase()
    }
}`,
        why: 'Lowercasing the whole name loses the word breaks: `loadlocal`. Put a `.` before each capital after the first.',
      },
      {
        code: `#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Const,
    None,
    LoadLocal,
    JumpUnlessKeep,
    Return,
}

impl Op {
    /// Every opcode, in encoding order.
    const ALL: [Op; 5] = [
        Op::Const,
        Op::LoadLocal,
        Op::None,
        Op::JumpUnlessKeep,
        Op::Return,
    ];

    fn encode(self) -> u8 {
        self as u8
    }

    fn decode(b: u8) -> Option<Op> {
        Op::ALL.get(b as usize).copied()
    }

    /// \`LoadLocal\` -> \`load.local\`
    fn name(self) -> String {
        let mut s = String::new();
        let d = format!("{self:?}");
        for (i, c) in d.char_indices() {
            let cap = c.is_uppercase();
            if cap && i > 0 {
                s.push('.');
            }
            s.extend(c.to_lowercase());
        }
        s
    }
}`,
        why: '`ALL` must be in encoding order. With `None` and `LoadLocal` swapped, `decode(1)` gives `LoadLocal`, whose byte is 2. This is the mistake drip-rs’s round-trip test exists to catch.',
      },
    ],
  },
  jumpTarget: {
    lang: 'rust',
    optional: true,
    title: 'Where does the jump land?',
    prompt:
      'A jump instruction at offset `at` is three bytes: the opcode, then a 16-bit distance, high byte first. The distance counts from the end of the instruction (`at + 3`): forward for `Jump` and `JumpUnless`, backward for `Loop`. Write `target`, which the disassembler prints after `->`.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpUnless,
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
    JumpUnless,
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
    // 9: jump.unless 0 12  ->  24
    let mut code = vec![0u8; 30];
    code[10] = 0;
    code[11] = 12;
    assert_eq!(target(Op::JumpUnless, &code, 9), 24);
    assert_eq!(target(Op::Jump, &code, 9), 24);
}

#[test]
fn a_loop_goes_back() {
    // 21: loop 0 20  ->  4
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
    walkthrough: `**How to think about it.** Work one by hand first. A \`jump.unless\` at offset 9 with operand bytes 0 and 12: the distance is 12, the instruction ends at 9 + 3 = 12, and 12 + 12 = 24. Two details make it subtle in Rust: the two bytes must be combined into one number (high byte first), and a backward jump must subtract, because a \`usize\` cannot be negative.

**The solution, line by line.**

- \`let hi = code[at + 1] as usize;\` reads the high byte and widens it to a \`usize\` *before* any shifting. A \`u8\` shifted left by 8 has no bits left, and rustc rejects \`hi << 8\` on a \`u8\` outright ("this arithmetic operation will overflow"). In TypeScript, \`<<\` works on 32-bit integers, so the problem never showed.
- \`let lo = code[at + 2] as usize;\` reads the low byte the same way.
- \`let jump = hi << 8 | lo;\` puts them together: the high byte is worth 256 each, so bytes \`1, 2\` make 258.
- \`if op == Op::Loop { at + 3 - jump }\` jumps backward from the end of the instruction. By the time the VM jumps, its instruction pointer is already past the three bytes, which is why the count starts at \`at + 3\`.
- \`else { at + 3 + jump }\` jumps forward for \`Jump\` and \`JumpUnless\`.

The disassembler prints exactly this number after \`->\`; for example, drip-rs compiles \`let xs = [10, 20]; for x in xs { print x; }\` (one statement per line) to a listing whose line \`0038    4 loop               38 -> 18\` is a \`loop\` at 38 with distance 23, landing on 18 (38 + 3 − 23), where the loop condition is tested again.

**Common wrong attempts.**

- Combining the bytes before widening them: shifting a \`u8\` by 8 does not compile.
- Counting from \`at\` rather than \`at + 3\`: every target is three bytes short.
`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Op {
    Jump,
    JumpUnless,
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
    JumpUnless,
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
    q: 'In `#[repr(u8)] enum OpCode { Const, None, True, ... }`, what is `OpCode::True as u8`?',
    options: [
      { t: '1', why: 'That is `None`. Counting starts at 0.' },
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
      { t: '1', correct: true, why: 'Measured with rustc 1.97: a spare byte value (53 to 255) stands for `None`.' },
      { t: '2: one byte for the tag, one for the opcode', why: 'That would be needed if every byte were a valid `OpCode`.' },
      { t: '8', why: 'Nothing here is a pointer.' },
    ],
  },
  {
    q: 'Someone adds a new opcode in the middle of the enum but forgets `ALL`. What catches it?',
    options: [
      { t: 'Nothing; the VM silently runs the wrong instruction', why: 'Something does catch it, before any program runs.' },
      { t: 'The compiler: `ALL` now has the wrong length', why: '`ALL` is declared `[OpCode; 53]` and still holds 53 entries, so it compiles.' },
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
];
