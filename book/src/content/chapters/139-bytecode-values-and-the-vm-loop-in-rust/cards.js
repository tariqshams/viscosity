// Chapter 73 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 139, 139, 139.

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
  've-what': {
    q: 'In drip-rs, what Rust type stands for “any Drip value”?',
    a: 'An enum, `Value`, with one variant per kind: `None`, `Bool(bool)`, `Number(f64)`, `String(StrRef)`, and one handle variant per object type (eleven variants in all).',
  },
  've-copy': {
    q: 'Why can `Value` derive `Copy`?',
    a: 'Every payload is `Copy`: bool, f64, and handles (small indexes). No variant owns heap memory.',
  },
  've-handles': {
    q: 'What would go wrong if `Value` had a `String(String)` variant?',
    a: 'The value would own its text, so it couldn’t be `Copy`. Copying a value onto the stack would mean cloning the text, or sharing it through `Rc`.',
  },
  've-size': {
    q: 'Where does rustc put the `f64` of `Value::Number`, and why there?',
    a: 'At bytes 8 to 15, after the 1-byte tag and 7 bytes of padding: an `f64` must start at a multiple of 8.',
  },
  've-option': {
    q: 'In rustc’s layout report, why does `Option<Value>` have no discriminant of its own?',
    a: '`None` is stored as one of the tag values `Value`’s eleven variants don’t use, so `Some(v)` is just `v`.',
  },
  've-hash-free': {
    q: 'Which bytes of a `Value::String` hold the string’s hash, and why is that free?',
    a: 'Bytes 8 to 11 (the handle is at 4 to 7). `Number` already needs bytes 8 to 15, so every `Value` has them anyway.',
  },
  've-nan-eq': {
    q: 'With `#[derive(PartialEq)]` on `Value`, is `Number(NaN) == Number(NaN)`?',
    a: 'No. f64 equality follows IEEE 754, so NaN is unequal to itself, as with JavaScript’s `===`.',
  },
  've-format-heap': {
    q: 'Why does printing a `Value` need a `&Heap`?',
    a: 'A string or object value holds only a handle (an index). The text and names it prints live in the heap.',
  },
  've-digits': {
    q: 'Rust prints 1e21 as `1000000000000000000000`, JavaScript as `1e+21`. What do the two agree on?',
    a: 'The digits: both use the shortest digits that read back as the same double. Only the layout differs.',
  },
  've-layout': {
    q: 'For which magnitudes does JavaScript print plain decimals instead of exponent notation?',
    a: 'From 1e-6 up to (but not including) 1e21. Outside that range it writes `d.ddde±x`.',
  },
  'md-what': {
    q: 'What are the two steps of each turn of drip-rs’s dispatch loop, after reading a byte?',
    a: 'Decode the byte into an `OpCode` with `from_byte`, then `match` on the opcode and run its arm.',
  },
  'md-exhaustive': {
    q: 'You add a variant to `OpCode` but forget its arm in `run`. What happens?',
    a: 'The VM doesn’t compile: E0004, non-exhaustive patterns. A match over an enum must cover every variant.',
  },
  'md-decode': {
    q: 'With an exhaustive match, where can an unknown opcode still slip in?',
    a: 'Only when decoding: `OpCode::from_byte` returns `None` for a byte no opcode has. drip-rs `expect`s it, trusting its compiler.',
  },
  'md-result': {
    q: 'The TypeScript VM throws on a runtime error. What does drip-rs’s `run` do instead?',
    a: 'It returns `Err(RuntimeError)`. Arms that can fail use `?`, so the error leaves `run` at once.',
  },
  'md-borrow': {
    q: 'Why can’t `run` start with `let code = &self.code;` and keep using it?',
    a: '`self.push` needs `&mut self`, which would overlap the shared borrow of `self.code` (E0502).',
  },
  'md-rc': {
    q: 'Why is the running chunk an `Rc<Chunk>`, not a `&Chunk`?',
    a: 'Its function in the heap owns it too. A reference would keep the heap borrowed, and the arena could move; an `Rc` clone is one more owner, and the frozen chunk needs no `RefCell`.',
  },
  'md-sync': {
    q: 'drip-rs keeps `ip`, `chunk` and `slots` in the `Vm` as registers. When must they be synced with the frame?',
    a: 'On a call (save the caller’s `ip`, load the callee’s state) and on a return (load the caller’s state back).',
  },
  'md-measure': {
    q: 'Why does the cost of reaching the next byte matter so much in a bytecode VM?',
    a: 'Every instruction starts by reading a byte, so that cost is paid on every turn of the loop.',
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
  sizes: {
    title: 'Measure a Value, and watch Rust print',
    lang: 'rust',
    code: `use std::mem::{align_of, size_of};

#[derive(Clone, Copy)]
struct Gc(u32);

#[derive(Clone, Copy)]
struct StrRef {
    handle: Gc,
    hash: u32,
}

#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    String(StrRef),
    Closure(Gc),
}

fn main() {
    let s = size_of::<Value>();
    let a = align_of::<Value>();
    println!("Value: {s} B, align {a}");
    let o = size_of::<Option<Value>>();
    println!("Option<Value>: {o}");

    // {} and {:e} for a few doubles.
    let ns = [0.1 + 0.2, 1e21, 1.5e-7,
        f64::INFINITY, f64::NAN, -0.0];
    for n in ns {
        println!("{n}   {n:e}");
    }
    // Try: delete Number. Size now?
}`,
  },
  registers: {
    lang: 'rust',
    title: 'Registers instead of a borrow',
    code: `// A toy VM in drip-rs's style: the
// running code is an Rc in a field,
// and each read borrows self only
// for one expression.
use std::rc::Rc;

struct Vm {
    code: Rc<Vec<u8>>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn read_byte(&mut self) -> u8 {
        let b = self.code[self.ip];
        self.ip += 1;
        b
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn run(&mut self) {
        let n = self.code.len();
        while self.ip < n {
            let b = self.read_byte();
            self.push(b as f64);
        }
    }
}

fn main() {
    let code = Rc::new(vec![1, 2, 3]);
    let mut vm = Vm {
        code: Rc::clone(&code),
        ip: 0,
        stack: Vec::new(),
    };
    vm.run();
    println!("{:?}", vm.stack);
    let n = Rc::strong_count(&code);
    println!("owners of the code: {n}");
}`,
  },
};

export const exercises = {
  opcodeRoundTrip: {
    lang: 'rust',
    title: 'Encode, decode, name',
    prompt: 'Here are five opcodes, numbered by `#[repr(u8)]` in the order written. Add a constant `ALL` holding every opcode in encoding order, then write `encode` (the opcode’s byte), `decode` (the opcode for a byte, or `None`), and `name`, which turns `LoadLocal` into `load.local` and `JumpUnlessKeep` into `jump.unless.keep`, like both disassemblers.',
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
    prompt: 'A jump instruction at offset `at` is three bytes: the opcode, then a 16-bit distance, high byte first. The distance counts from the end of the instruction (`at + 3`): forward for `Jump` and `JumpUnless`, backward for `Loop`. Write `target`, which the disassembler prints after `->`.',
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
  value: {
    lang: 'rust',
    title: 'Your own Value',
    prompt: 'Write a cut-down drip-rs `Value`: an enum with the variants `None`, `Bool(bool)`, `Number(f64)` and `Str(StrRef)`, where `StrRef` (given) is a string\'s handle and hash. It must be **Copy**, comparable with `==`, and printable with `{:?}` (the tests use all three). Then write `is_falsey`: Drip\'s rule is that only `none` and `false` are falsey. One test checks that your `Value` is 16 bytes.',
    starter: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

enum Value {
    None,
}

impl Value {
    fn is_falsey(self) -> bool {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
    tests: `use std::mem::size_of;

#[test]
fn none_and_false_are_falsey() {
    assert!(Value::None.is_falsey());
    assert!(Value::Bool(false).is_falsey());
}

#[test]
fn zero_and_strings_are_truthy() {
    assert!(!Value::Bool(true).is_falsey());
    assert!(!Value::Number(0.0).is_falsey());
    let s = StrRef { handle: 0, hash: 7 };
    assert!(!Value::Str(s).is_falsey());
}

#[test]
fn a_value_is_copied_not_moved() {
    let a = Value::Number(1.5);
    let b = a;
    assert_eq!(a, b);
}

#[test]
fn nan_is_not_equal_to_itself() {
    let n = Value::Number(f64::NAN);
    assert_ne!(n, n);
    let z = Value::Number(-0.0);
    assert_eq!(z, Value::Number(0.0));
}

#[test]
fn a_value_is_16_bytes() {
    assert_eq!(size_of::<Value>(), 16);
}`,
    hints: [
      'Each variant with a payload is written like `Number(f64)`. `Str` carries a whole `StrRef`.',
      'Put the same `#[derive(...)]` line on `Value` that `StrRef` has. `Copy` is allowed because every payload is `Copy`.',
      'For `is_falsey`, `match self` with an arm for `Self::None`, one for `Self::Bool(b)`, and `_ => false` for the rest. (`matches!(self, Value::None | Value::Bool(false))` says the same in one expression.)',
    ],
    walkthrough: `**How to think about it.** Start from the question the VM asks of every value: "what kind are you, and what do you carry?" That is exactly an enum: one variant per kind, with a payload where there is something to carry. Then ask what the VM does with values all day (copies them onto and off the stack, compares them), and that tells you which traits to derive.

**The solution, line by line.**

- \`#[derive(Clone, Copy, PartialEq, Debug)]\` on \`Value\`: \`Clone\` and \`Copy\` make \`let b = a;\` a copy rather than a move, so the third test can still use \`a\`; \`PartialEq\` gives \`==\`; \`Debug\` is what \`assert_eq!\` prints when a test fails. Deriving \`Copy\` compiles only because \`bool\`, \`f64\` and \`StrRef\` are all \`Copy\` themselves.
- \`None,\` has no payload: there is nothing to carry.
- \`Bool(bool),\` and \`Number(f64),\` carry their value inline.
- \`Str(StrRef),\` carries the string's handle and hash, never the text, which lives in the heap.
- \`fn is_falsey(self) -> bool {\` takes \`self\` by value, which is free for a \`Copy\` type.
- \`Self::None => true,\` the first falsey value.
- \`Self::Bool(b) => !b,\` falsey exactly when \`b\` is \`false\`.
- \`_ => false,\` everything else is truthy, including \`0\` and the empty string (unlike JavaScript, where \`0\` is falsy). \`matches!(self, Value::None | Value::Bool(false))\`, as drip-rs writes it, says the same in one expression.

**What the tests also show.** The derived \`==\` compares the tag, then the payload, and for \`f64\` that is IEEE comparison: \`NaN != NaN\` and \`-0.0 == 0.0\`, exactly JavaScript's \`===\`, which is what Drip promises. And the size: the biggest payloads are 8 bytes (\`f64\` and \`StrRef\`), the tag takes a byte, and the \`f64\`'s 8-byte alignment rounds 9 up to 16.

**Common wrong attempts.**

- Using JavaScript's rule and calling \`Number(0.0)\` falsey: in Drip only \`none\` and \`false\` are.
- Leaving \`Copy\` out of the derive: \`let b = a;\` then moves \`a\`, and the test that uses \`a\` afterwards does not compile.
- Giving \`Str\` a \`String\` payload: \`Copy\` stops compiling (E0204), and the size grows to 24.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(String),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
        why: 'Doesn’t compile: `String` owns heap memory, so it isn’t `Copy`, and neither can `Value` be (E0204). Store a handle, not the text.',
      },
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            Self::Number(n) => n == 0.0,
            Self::Str(_) => false,
        }
    }
}`,
        why: 'That is JavaScript’s rule, not Drip’s. In Drip, `0` is truthy: only `none` and `false` are falsey.',
      },
      {
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct StrRef {
    handle: u32,
    hash: u32,
}

#[derive(PartialEq, Debug)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
    Str(StrRef),
}

impl Value {
    fn is_falsey(&self) -> bool {
        match self {
            Self::None => true,
            Self::Bool(b) => !b,
            _ => false,
        }
    }
}`,
        why: 'Without `Clone, Copy`, `let b = a;` moves the value, and using `a` afterwards is E0382. A VM copies values on every push and peek, so they must be `Copy`.',
      },
    ],
  },
  jsNumber: {
    optional: true,
    lang: 'rust',
    title: 'Print a number like JavaScript',
    prompt: `Write \`js_num(n)\`, returning the text JavaScript's \`String(n)\` gives, except that negative zero is \`"-0"\`, as in the TypeScript VM. Use Rust's own formatting for the digits:

- NaN is \`"NaN"\`; the infinities are \`"Infinity"\` and \`"-Infinity"\`.
- Zero, and every \`n\` whose size |n| is at least 1e-6 and below 1e21, print exactly as Rust's \`{}\` prints them.
- Everything else prints as Rust's \`{:e}\` does, except that a non-negative exponent gets a \`+\`: \`1e21\` becomes \`1e+21\`.`,
    starter: `fn js_num(n: f64) -> String {
    format!("{}", n)
}`,
    solution: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    if n == f64::INFINITY {
        return "Infinity".to_string();
    }
    if n == -f64::INFINITY {
        return "-Infinity".to_string();
    }
    let a = n.abs();
    let plain = 1e-6 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
    tests: `#[test]
fn ordinary_numbers() {
    assert_eq!(js_num(100.0), "100");
    assert_eq!(js_num(0.1 + 0.2),
        "0.30000000000000004");
    assert_eq!(js_num(-123.456), "-123.456");
}

#[test]
fn nan_and_the_infinities() {
    assert_eq!(js_num(f64::NAN), "NaN");
    assert_eq!(js_num(f64::INFINITY), "Infinity");
    assert_eq!(js_num(-f64::INFINITY),
        "-Infinity");
}

#[test]
fn zero_keeps_its_sign() {
    assert_eq!(js_num(0.0), "0");
    assert_eq!(js_num(-0.0), "-0");
}

#[test]
fn big_numbers_use_e_plus() {
    assert_eq!(js_num(1e21), "1e+21");
    assert_eq!(js_num(1.2345678901234569e23),
        "1.2345678901234569e+23");
    assert_eq!(js_num(1e20),
        "100000000000000000000");
}

#[test]
fn small_numbers_use_e_minus() {
    assert_eq!(js_num(0.000001), "0.000001");
    assert_eq!(js_num(1.5e-7), "1.5e-7");
    assert_eq!(js_num(-1e-7), "-1e-7");
    assert_eq!(js_num(5e-324), "5e-324");
}`,
    hints: [
      'Deal with the odd cases first: `n.is_nan()`, `n.is_infinite()`.',
      'For the plain range, compare `n.abs()` with `1e-6` and `1e21`, and remember zero (which is below 1e-6 but prints plainly).',
      'Outside it, `format!("{:e}", n)` gives `1e21` or `1.5e-7`. Only the first needs changing: replace the `e` with `e+` when there is no `e-`.',
    ],
    walkthrough: `**How to think about it.** Rust's \`{}\` and \`{:e}\` both print the shortest digits that read back as the same double, and JavaScript chooses the same digits. So you never compute digits yourself; you only choose a layout, and the layout depends on three things: is the number special (NaN, an infinity), is it in JavaScript's plain range, and if not, does its exponent need a \`+\`.

**The solution, line by line.**

- \`if n.is_nan() { return "NaN".to_string(); }\` handles NaN first. Rust happens to print \`NaN\` too, but checking it first keeps the later comparisons honest, because every comparison with NaN is false.
- \`if n == f64::INFINITY { return "Infinity".to_string(); }\` and the same for \`-f64::INFINITY\`: Rust spells these \`inf\` and \`-inf\`, JavaScript \`Infinity\` and \`-Infinity\`. (Drip itself then renames them \`inf\`, \`-inf\` and \`nan\`.)
- \`let a = n.abs();\` the size of the number, whatever its sign.
- \`let plain = 1e-6 <= a && a < 1e21;\` JavaScript's plain-decimal range.
- \`if a == 0.0 || plain { return format!("{}", n); }\`: inside the range Rust's \`{}\` prints the same text as JavaScript. Zero is below 1e-6 but prints plainly, and Rust's \`{}\` prints \`-0\` for negative zero, which is what the TypeScript VM wants.
- \`let s = format!("{:e}", n);\` gives \`1e21\` or \`1.5e-7\`.
- \`if s.contains("e-") { s } else { s.replace('e', "e+") }\`: JavaScript always writes the exponent's sign, so only a non-negative exponent needs a \`+\` added.

The real \`format_number\` in drip-rs does the layout itself from \`{:e}\`'s digits, following the ECMAScript steps, so it does not rely on \`{}\` matching JavaScript in the middle range; it is checked against 42 numbers Node printed.

**Common wrong attempts.**

- A lower bound of 1e-7: \`1.5e-7\` then prints as \`0.00000015\`, but JavaScript prints \`1.5e-7\`.
- Forgetting the infinities: they fall through to \`{:e}\`, which prints \`inf\`.`,
    wrong: [
      {
        code: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    if n == f64::INFINITY {
        return "Infinity".to_string();
    }
    if n == -f64::INFINITY {
        return "-Infinity".to_string();
    }
    let a = n.abs();
    let plain = 1e-7 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
        why: 'The lower bound is off by a factor of ten: 1.5e-7 would print as `0.00000015`, but JavaScript prints `1.5e-7`. Plain decimals start at 1e-6.',
      },
      {
        code: `fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    let a = n.abs();
    let plain = 1e-6 <= a && a < 1e21;
    if a == 0.0 || plain {
        return format!("{}", n);
    }
    let s = format!("{:e}", n);
    if s.contains("e-") {
        s
    } else {
        s.replace('e', "e+")
    }
}`,
        why: 'Infinity falls through to `{:e}`, which prints `inf`, not `Infinity`.',
      },
    ],
  },
  tinyVm: {
    lang: 'rust',
    title: 'A tiny stack VM',
    prompt: `Write the dispatch loop of a tiny stack VM. Its instructions are an enum, \`Op\`: \`Num(n)\` pushes the number \`n\`; \`Add\`, \`Sub\` and \`Mul\` pop two numbers and push the result; \`Neg\` negates the top; \`Ret\` stops.

- \`step\` runs **one** instruction: read \`self.code[self.ip]\`, move \`ip\` on, and \`match\`. It returns \`false\` after \`Ret\` and \`true\` otherwise.
- \`run\` calls \`step\` until it returns \`false\`, then pops and returns the result.

For \`Sub\`, the right operand is on top: \`[Num(5), Num(2), Sub]\` is 5 − 2.`,
    starter: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        todo!()
    }

    fn run(&mut self) -> f64 {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let b = self.pop();
                let a = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let b = self.pop();
                let a = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let b = self.pop();
                let a = self.pop();
                self.push(a * b);
            }
            Op::Neg => {
                let n = self.pop();
                self.push(-n);
            }
            Op::Ret => return false,
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
    tests: `use Op::*;

fn eval(code: Vec<Op>) -> f64 {
    Vm::new(code).run()
}

#[test]
fn a_number_comes_back() {
    assert_eq!(eval(vec![Num(7.0), Ret]), 7.0);
}

#[test]
fn add_and_multiply() {
    // 1 + 2 * 3, compiled
    let code = vec![Num(1.0), Num(2.0),
        Num(3.0), Mul, Add, Ret];
    assert_eq!(eval(code), 7.0);
}

#[test]
fn subtract_keeps_the_order() {
    let code =
        vec![Num(5.0), Num(2.0), Sub, Ret];
    assert_eq!(eval(code), 3.0);
}

#[test]
fn negate_the_top() {
    let code = vec![Num(4.0), Neg, Ret];
    assert_eq!(eval(code), -4.0);
}

#[test]
fn ret_returns_the_top() {
    let code = vec![Num(1.0), Num(2.0), Ret];
    assert_eq!(eval(code), 2.0);
}

#[test]
fn step_moves_ip_one_op() {
    let mut vm = Vm::new(vec![Num(1.0), Ret]);
    assert!(vm.step());
    assert_eq!(vm.ip, 1);
    assert!(!vm.step());
}`,
    hints: [
      '`Op` is `Copy`, so `let op = self.code[self.ip];` copies the instruction out, and the borrow of `self.code` ends right there.',
      'Then `self.ip += 1;` and `match op { ... }` with one arm per variant. For a binary operator, pop `b` (the top) first, then `a`.',
      '`Op::Ret => return false,` ends the step early. After the match, return `true`. `run` is `while self.step() {}` and then `self.pop()`.',
    ],
    walkthrough: `**How to think about it.** Every bytecode VM is the same three moves, repeated: fetch the instruction at \`ip\`, move \`ip\` on, and do what the instruction says. Write those three moves as \`step\`, and \`run\` is only "step until told to stop". The one Rust-specific question is borrowing: \`step\` must read \`self.code\` and then call \`self.push\`, which needs \`&mut self\`, and the trick from this chapter is to copy the instruction out first so that nothing stays borrowed.

**The solution, line by line.**

- \`let op = self.code[self.ip];\` fetches the instruction. Because \`Op\` is \`Copy\`, \`op\` is a copy, and the borrow of \`self.code\` ends with this line.
- \`self.ip += 1;\` moves on *before* running the instruction, as drip-rs's \`read_byte\` does: the instruction pointer always points at the next instruction.
- \`match op {\` has one arm per variant and no \`_\` arm, so if you forget one, rustc names it (E0004).
- \`Op::Num(n) => self.push(n),\` pushes the number the instruction carries.
- In \`Op::Add\`, \`let b = self.pop(); let a = self.pop(); self.push(a + b);\`: the left operand was pushed first, so it is *under* the right one; pop \`b\` first. \`Sub\` and \`Mul\` are the same with \`-\` and \`*\`.
- \`Op::Neg => { let n = self.pop(); self.push(-n); }\` replaces the top with its negation.
- \`Op::Ret => return false,\` ends the step and tells \`run\` to stop.
- \`true\` after the \`match\` says "keep going".
- \`fn run(&mut self) -> f64 { while self.step() {} self.pop() }\` loops until \`Ret\`, then pops the answer. In drip-rs, \`Return\` also pops the frame and, with no caller left, returns \`Ok(())\` from \`run\`.

**Common wrong attempts.**

- Popping \`a\` before \`b\`: \`5 - 2\` comes out as \`2 - 5\`. Addition and multiplication do not care, which is why this bug hides until a test subtracts.
- Adding \`_ => {}\` to make the compiler stop complaining: the exhaustiveness check is switched off, and \`Neg\` quietly does nothing, which is the TypeScript \`default\` problem again.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let a = self.pop();
                let b = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let a = self.pop();
                let b = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let a = self.pop();
                let b = self.pop();
                self.push(a * b);
            }
            Op::Neg => {
                let n = self.pop();
                self.push(-n);
            }
            Op::Ret => return false,
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
        why: 'The first pop is the *right* operand. Popping into `a` first makes `5 - 2` come out as `2 - 5`. Add and multiply still pass, which is why this bug hides.',
      },
      {
        code: `#[derive(Clone, Copy, Debug)]
enum Op {
    Num(f64),
    Add,
    Sub,
    Mul,
    Neg,
    Ret,
}

struct Vm {
    code: Vec<Op>,
    ip: usize,
    stack: Vec<f64>,
}

impl Vm {
    fn new(code: Vec<Op>) -> Vm {
        let stack = Vec::new();
        Vm { code, ip: 0, stack }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().expect("empty")
    }

    fn step(&mut self) -> bool {
        let op = self.code[self.ip];
        self.ip += 1;
        match op {
            Op::Num(n) => self.push(n),
            Op::Add => {
                let b = self.pop();
                let a = self.pop();
                self.push(a + b);
            }
            Op::Sub => {
                let b = self.pop();
                let a = self.pop();
                self.push(a - b);
            }
            Op::Mul => {
                let b = self.pop();
                let a = self.pop();
                self.push(a * b);
            }
            Op::Ret => return false,
            _ => {}
        }
        true
    }

    fn run(&mut self) -> f64 {
        while self.step() {}
        self.pop()
    }
}`,
        why: 'The `_ => {}` arm silences the exhaustiveness check, so `Neg` quietly does nothing. That is the TypeScript `default` problem again. Leave `_` out and rustc names every case you missed.',
      },
    ],
  },
  checkedVm: {
    optional: true,
    lang: 'rust',
    title: 'Errors as values',
    prompt: `Now values can be numbers or booleans, and an instruction can fail. Write:

- \`add(a, b)\`: \`Ok\` of the sum if both are numbers, else \`Err\` of Drip's message, \`cannot add a number and a boolean\` (built with the given \`describe\`, left operand first).
- \`neg(v)\`: \`Ok\` of the negated number, else \`Err\` of \`cannot negate a boolean\`.
- \`run(code)\`: run the instructions in order. \`Push(v)\` pushes \`v\`; \`Add\` and \`Neg\` use your functions **with \`?\`**, so an error stops the program; and \`Ret\` returns \`Ok\` of the top value.

The messages are the ones both Drip VMs print.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    todo!()
}

fn neg(v: Value)
    -> Result<Value, String> {
    todo!()
}

fn run(code: &[Op])
    -> Result<Value, String> {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(a), describe(b))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                s.push(add(a, b)?);
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
    tests: `#[test]
fn numbers_add() {
    let code = [Op::Push(Num(1.0)),
        Op::Push(Num(2.0)), Op::Add, Op::Ret];
    assert_eq!(run(&code), Ok(Num(3.0)));
}

#[test]
fn adding_a_bool_is_an_error() {
    let code = [Op::Push(Num(1.0)),
        Op::Push(Bool(true)), Op::Add, Op::Ret];
    assert_eq!(run(&code),
        Err("cannot add a number and a boolean".into()));
}

#[test]
fn negating_a_bool_is_an_error() {
    let code = [Op::Push(Bool(false)),
        Op::Neg, Op::Ret];
    assert_eq!(run(&code),
        Err("cannot negate a boolean".into()));
}

#[test]
fn an_error_stops_the_program() {
    // The Neg after the failing Add never runs.
    let code = [Op::Push(Bool(true)),
        Op::Push(Num(1.0)), Op::Add, Op::Neg,
        Op::Ret];
    assert_eq!(run(&code),
        Err("cannot add a boolean and a number".into()));
}

#[test]
fn negate_a_number() {
    let code = [Op::Push(Num(2.0)), Op::Neg,
        Op::Ret];
    assert_eq!(run(&code), Ok(Num(-2.0)));
}`,
    hints: [
      'Begin with `neg`, the one-value case: `match v { Num(x) => Ok(Num(-x)), _ => Err(...) }`, with the message built by `format!("cannot negate {}", describe(v))`.',
      'In `add`, match on the pair: `match (a, b) { (Num(x), Num(y)) => ..., _ => ... }`. The message names `a` first, because `a` is the left operand.',
      'In `run`, loop with `for &op in code` and match each op. For `Add`, pop `b` (the top) before `a`; then `s.push(add(a, b)?);` either pushes the sum or returns the error from `run`. For `Ret`, return `Ok(pop(&mut s))`; after the loop, return some `Err`, since a program without `Ret` is broken.',
    ],
    walkthrough: `**How to think about it.** This is drip-rs's error handling in miniature. Each instruction that can fail becomes a function returning \`Result\`, and the loop uses \`?\`, so the first error ends the whole run, exactly as \`pop_numbers("-")?\` ends \`Vm::run\`. The messages must match Drip's word for word, which is why \`describe\` is given: it is the cut-down version of drip-rs's own \`describe\`.

**The solution, line by line.**

- \`match (a, b) {\` in \`add\` checks both operands in one pattern, the same idea as \`pop_numbers\`'s \`let (Value::Number(a), Value::Number(b)) = ... else\`.
- \`(Num(x), Num(y)) => { Ok(Num(x + y)) }\` is the one good case.
- \`_ => Err(format!("cannot add {} and {}", describe(a), describe(b))),\` covers every other pair, naming the left operand first, as Drip does.
- \`neg\` has the same shape for one value: \`Num(x) => Ok(Num(-x))\`, otherwise \`cannot negate a boolean\`.
- \`let mut s = Vec::new();\` is the stack; \`for &op in code\` copies each \`Op\` out (it is \`Copy\`).
- \`Op::Push(v) => s.push(v),\` pushes a constant.
- In \`Op::Add\`, \`let b = pop(&mut s); let a = pop(&mut s);\` takes the right operand off first, because it was pushed last.
- \`s.push(add(a, b)?);\`: if \`add\` returns \`Ok(v)\`, \`?\` unwraps it and \`v\` is pushed; if it returns \`Err(e)\`, \`?\` returns \`Err(e)\` from \`run\` immediately, and no later instruction runs.
- \`Op::Neg\` is the same with one value, and \`Op::Ret => { return Ok(pop(&mut s)); }\` hands back the answer.
- \`Err("no Ret".to_string())\` after the loop reports a program that ran off its end.

**Common wrong attempts.**

- \`if let Ok(v) = add(a, b) { s.push(v); }\`: this quietly throws the error away, so a bad \`Add\` shrinks the stack and the program carries on. Use \`?\`.
- Naming the operands the wrong way round: \`true + 1\` must say \`cannot add a boolean and a number\`, and the last test checks it.

In drip-rs the error then reaches \`interpret\`, which clears the stack and frames and reports exit code 70.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(a), describe(b))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                let r = add(a, b);
                if let Ok(v) = r {
                    s.push(v);
                }
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
        why: '`if let Ok(v)` throws the error away, so a bad `Add` just shrinks the stack and the program carries on. Use `?` to stop.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Bool(bool),
}

#[derive(Clone, Copy)]
enum Op {
    Push(Value),
    Add,
    Neg,
    Ret,
}

use Value::*;

/// How error messages name a value.
fn describe(v: Value) -> &'static str {
    match v {
        Num(_) => "a number",
        Bool(_) => "a boolean",
    }
}

fn pop(s: &mut Vec<Value>) -> Value {
    s.pop().expect("stack underflow")
}

fn add(a: Value, b: Value)
    -> Result<Value, String> {
    match (a, b) {
        (Num(x), Num(y)) => {
            Ok(Num(x + y))
        }
        _ => Err(format!(
            "cannot add {} and {}",
            describe(b), describe(a))),
    }
}

fn neg(v: Value)
    -> Result<Value, String> {
    match v {
        Num(x) => Ok(Num(-x)),
        _ => Err(format!(
            "cannot negate {}",
            describe(v))),
    }
}

fn run(code: &[Op])
    -> Result<Value, String> {
    let mut s = Vec::new();
    for &op in code {
        match op {
            Op::Push(v) => s.push(v),
            Op::Add => {
                let b = pop(&mut s);
                let a = pop(&mut s);
                s.push(add(a, b)?);
            }
            Op::Neg => {
                let v = pop(&mut s);
                s.push(neg(v)?);
            }
            Op::Ret => {
                return Ok(pop(&mut s));
            }
        }
    }
    Err("no Ret".to_string())
}`,
        why: 'The message names the operands in the wrong order: `true + 1` must report `cannot add a boolean and a number`, left operand first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `#[repr(u8)] enum OpCode { Const, None, True, ... }`, what is `OpCode::True as u8`?',
    options: [
      {
        t: '1',
        why: 'That is `None`. Counting starts at 0.',
      },
      {
        t: '2',
        correct: true,
        why: 'Implicit discriminants count from 0 in declaration order.',
      },
      {
        t: 'It depends on the compiler',
        why: 'The numbering of implicit discriminants is defined by the language.',
      },
      {
        t: 'It doesn’t compile',
        why: 'Casting a fieldless enum to an integer is allowed.',
      },
    ],
  },
  {
    q: 'Why does drip-rs decode bytes with `OpCode::ALL.get(b as usize).copied()` instead of `b as OpCode`?',
    options: [
      {
        t: '`b as OpCode` is slower',
        why: 'It isn’t a speed question: the cast doesn’t exist (E0605).',
      },
      {
        t: 'Because the crate forbids `as`',
        why: '`as` is used all over drip-rs, including `op as u8`.',
      },
      {
        t: 'Integers can’t be cast to enums, and most bytes are not opcodes; the table gives `None` for those without `unsafe`',
        correct: true,
        why: 'Reinterpreting the byte would need `unsafe`, which `#![forbid(unsafe_code)]` rules out.',
      },
    ],
  },
  {
    q: 'What is `size_of::<Option<OpCode>>()`?',
    options: [
      {
        t: '1',
        correct: true,
        why: 'Measured with rustc 1.97: a spare byte value (53 to 255) stands for `None`.',
      },
      {
        t: '2: one byte for the tag, one for the opcode',
        why: 'That would be needed if every byte were a valid `OpCode`.',
      },
      {
        t: '8',
        why: 'Nothing here is a pointer.',
      },
    ],
  },
  {
    q: 'Someone adds a new opcode in the middle of the enum but forgets `ALL`. What catches it?',
    options: [
      {
        t: 'Nothing; the VM silently runs the wrong instruction',
        why: 'Something does catch it, before any program runs.',
      },
      {
        t: 'The compiler: `ALL` now has the wrong length',
        why: '`ALL` is declared `[OpCode; 53]` and still holds 53 entries, so it compiles.',
      },
      {
        t: 'The borrow checker',
        why: 'No borrowing is involved.',
      },
      {
        t: '`cargo test`: the unit test checks `*op as usize == i` for every entry of `ALL`',
        correct: true,
        why: 'Every opcode after the new one now has a discriminant one higher than its place in the table.',
      },
    ],
  },
  {
    q: 'Why does drip-rs’s disassembler need the heap?',
    options: [
      {
        t: 'To allocate the strings it returns',
        why: 'Its output is ordinary `String`s, not heap objects.',
      },
      {
        t: 'To run the garbage collector first',
        why: 'Disassembling never collects.',
      },
      {
        t: 'Because a string constant is a handle, and only the heap can turn it into text',
        correct: true,
        why: 'Constants are `Value`s; a `Value::String` holds a handle, not the characters.',
      },
    ],
  },
  {
    q: 'Why do drip-rs values hold `Gc` handles for objects, instead of the objects themselves?',
    options: [
      {
        t: 'Handles are faster to dereference than references',
        why: 'Speed isn’t the reason. A handle still has to be looked up in the heap’s arena.',
      },
      {
        t: 'Many values can refer to one object, and a handle owns nothing, so values stay `Copy`',
        correct: true,
        why: 'An owning variant would need one owner per object. A handle is just an index, so any number of values can carry it.',
      },
      {
        t: 'Rust enums can’t contain structs',
        why: 'They can. `StrRef` is a struct inside a variant.',
      },
      {
        t: 'To make `Value` smaller than 8 bytes',
        why: '`Value` is 16 bytes either way, because of the `f64`.',
      },
    ],
  },
  {
    q: 'Which of these explains the 16 bytes of a drip-rs `Value` on x86-64?',
    options: [
      {
        t: 'Eleven variants need 16 bytes of tag',
        why: 'Eleven variants fit in a one-byte tag.',
      },
      {
        t: 'Every Rust enum is 16 bytes',
        why: 'Sizes depend on the payloads. A copy of `Value` without `Number` measures 12 bytes.',
      },
      {
        t: 'The `StrRef` hash makes it 16',
        why: 'Without the hash, `Number` still needs 16. The hash fits in space that was already there.',
      },
      {
        t: 'An 8-byte `f64` plus a tag, rounded up to the `f64`’s 8-byte alignment',
        correct: true,
        why: '1 + 8 = 9 bytes, and a size must be a multiple of the alignment, so 16.',
      },
    ],
  },
  {
    q: 'What does `format!("{}", 1e21)` produce in Rust?',
    options: [
      {
        t: '`1e+21`',
        why: 'That’s JavaScript. Rust’s `{}` never uses an exponent.',
      },
      {
        t: '`1e21`',
        why: 'That’s what `{:e}` or `{:?}` print.',
      },
      {
        t: '`1000000000000000000000`',
        correct: true,
        why: 'Rust’s `Display` for floats writes plain digits. That’s why drip-rs needs its own `format_number`.',
      },
      {
        t: '`inf`',
        why: '1e21 is well within the range of an f64.',
      },
    ],
  },
  {
    q: 'Why does `value.format(&heap)` take the heap?',
    options: [
      {
        t: 'Printing allocates a new string in the heap',
        why: 'Printing only reads. It never allocates Drip objects.',
      },
      {
        t: 'A string value holds only an index, and the text is in the heap',
        correct: true,
        why: 'The handle says which slot to read; the heap is where the slot is.',
      },
      {
        t: 'The heap holds the number formatting rules',
        why: 'Number formatting is a plain function, `format_number`.',
      },
      {
        t: 'To run the garbage collector before printing',
        why: 'Formatting a value never collects.',
      },
    ],
  },
  {
    q: 'In drip-rs, `Value` derives `PartialEq`. Which of these is `true`?',
    options: [
      {
        t: '`Number(NaN) == Number(NaN)`',
        why: 'f64 equality follows IEEE 754: NaN is unequal to everything, itself included.',
      },
      {
        t: '`None == Bool(false)`',
        why: 'Different variants are never equal, even though both are falsey.',
      },
      {
        t: 'Two string values with the same text',
        correct: true,
        why: 'Handles compare by index, and interning gives equal text one handle, so equal strings are equal values.',
      },
      {
        t: '`Number(0.0) == Number(-0.0)` is false',
        why: 'IEEE 754 says 0 and -0 are equal, as JavaScript’s `===` does.',
      },
    ],
  },
  {
    q: 'What replaces the TypeScript switch’s `default: throw` case in drip-rs?',
    options: [
      {
        t: 'A `_ =>` arm that panics',
        why: 'drip-rs has no `_` arm in `run`: it would turn off the exhaustiveness check.',
      },
      {
        t: 'Nothing: the match covers all 53 variants, and only `from_byte` can meet an unknown byte',
        correct: true,
        why: 'The compiler checks every opcode has an arm. Decoding returns `None` for a bad byte, and drip-rs `expect`s a valid one.',
      },
      {
        t: 'A runtime check before every instruction',
        why: 'There’s no extra check: decoding is the only place a bad byte shows up.',
      },
      {
        t: 'The disassembler',
        why: 'The disassembler prints bytecode; it doesn’t run it.',
      },
    ],
  },
  {
    q: `Why does this fail to compile?
\`\`\`rust
let code = &self.code;
for &b in code {
    self.push(b as f64);
}
\`\`\``,
    options: [
      {
        t: '`b as f64` is not allowed for a `u8`',
        why: 'Casting `u8` to `f64` is fine.',
      },
      {
        t: '`code` was moved out of `self`',
        why: '`&self.code` borrows; nothing moves.',
      },
      {
        t: '`self.push` needs `&mut self` while `code` still borrows `self.code`',
        correct: true,
        why: 'E0502: a shared borrow of the field and a mutable borrow of the whole overlap.',
      },
      {
        t: '`for` can’t loop over a reference',
        why: 'Looping over `&Vec<u8>` is normal; it yields `&u8`.',
      },
    ],
  },
  {
    q: 'Why does drip-rs keep the running chunk as an `Rc<Chunk>` field of the `Vm`?',
    options: [
      {
        t: 'So the VM can change the bytecode while it runs',
        why: 'Chunks are frozen once compiled. That’s why no `RefCell` is needed.',
      },
      {
        t: 'Because `Rc` makes reading bytes faster than a `Vec`',
        why: 'The bytes are still in a `Vec<u8>` inside the chunk. The `Rc` is about ownership.',
      },
      {
        t: 'To let the garbage collector free chunks',
        why: 'The `Rc` frees a chunk when its last owner goes, without the collector.',
      },
      {
        t: 'The VM needs its own owner of the chunk, so it doesn’t keep the heap borrowed',
        correct: true,
        why: 'The function in the heap owns the chunk too. A second owner leaves the heap free to change.',
      },
    ],
  },
  {
    q: 'In drip-rs, what does `call` do with the registers?',
    options: [
      {
        t: 'Saves the caller’s `ip` into its frame, then loads the callee’s `ip`, chunk and slots',
        correct: true,
        why: 'The registers always describe the running frame. `pop_frame` loads the caller’s back on return.',
      },
      {
        t: 'Nothing: the registers are recomputed on every byte',
        why: 'Then they wouldn’t save anything. They’re updated only on calls and returns.',
      },
      {
        t: 'Clears the stack',
        why: 'The arguments stay on the stack as the callee’s first slots.',
      },
      {
        t: 'Copies the callee’s bytecode into the `Vm`',
        why: 'It clones the `Rc`, which copies a pointer, not the bytecode.',
      },
    ],
  },
  {
    q: 'The `Sub` arm calls `self.pop_numbers("-")?` and the operands are a string and a number. What happens?',
    options: [
      {
        t: 'The VM panics',
        why: 'Nothing panics. The error is an ordinary value.',
      },
      {
        t: 'The message goes to stderr, and `?` returns `Err(RuntimeError)` from `run`',
        correct: true,
        why: '`runtime_error` writes the message and stack trace; `?` makes the error leave `run` at once.',
      },
      {
        t: 'The string is converted to a number',
        why: 'Drip doesn’t convert; it reports `cannot use \'-\' on a string and a number`.',
      },
      {
        t: 'The instruction is skipped and the loop continues',
        why: '`?` returns from `run`, so the loop stops.',
      },
    ],
  },
];
