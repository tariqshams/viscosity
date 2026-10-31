//! Bytecode chunks and the instruction set (book chapters 45 and 46).

use crate::value::Value;

/// One instruction's opcode. `#[repr(u8)]` makes each variant exactly the
/// byte that encodes it, so `op as u8` is free, and the numbering matches
/// the TypeScript VM's `OP` table one for one.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OpCode {
    Constant,
    Nil,
    True,
    False,
    Pop,
    GetLocal,
    SetLocal,
    GetGlobal,
    DefineGlobal,
    SetGlobal,
    GetUpvalue,
    SetUpvalue,
    GetProperty,
    SetProperty,
    GetSuper,
    Equal,
    Greater,
    Less,
    Add,
    Subtract,
    Multiply,
    Divide,
    Not,
    Negate,
    Print,
    Jump,
    JumpIfFalse,
    Loop,
    Call,
    Invoke,
    SuperInvoke,
    Closure,
    CloseUpvalue,
    Return,
    Class,
    Inherit,
    Method,
}

impl OpCode {
    /// Every opcode, in encoding order: `ALL[op as usize] == op`.
    #[rustfmt::skip]
    pub const ALL: [OpCode; 37] = {
        use OpCode::*;
        [
            Constant, Nil, True, False, Pop, GetLocal, SetLocal, GetGlobal,
            DefineGlobal, SetGlobal, GetUpvalue, SetUpvalue, GetProperty,
            SetProperty, GetSuper, Equal, Greater, Less, Add, Subtract,
            Multiply, Divide, Not, Negate, Print, Jump, JumpIfFalse, Loop,
            Call, Invoke, SuperInvoke, Closure, CloseUpvalue, Return, Class,
            Inherit, Method,
        ]
    };

    /// Decode a byte, or `None` if no opcode has that encoding.
    pub fn from_byte(byte: u8) -> Option<OpCode> {
        OpCode::ALL.get(byte as usize).copied()
    }

    /// The name the disassembler prints, such as `OP_GET_LOCAL`.
    pub fn name(self) -> String {
        // Turn `GetLocal` into `GET_LOCAL`.
        let mut name = String::from("OP");
        for c in format!("{self:?}").chars() {
            if c.is_ascii_uppercase() {
                name.push('_');
            }
            name.push(c.to_ascii_uppercase());
        }
        name
    }
}

/// A function's bytecode, the source line of each byte, and its constants.
#[derive(Default)]
pub struct Chunk {
    pub code: Vec<u8>,
    pub lines: Vec<usize>,
    pub constants: Vec<Value>,
}

impl Chunk {
    pub fn write(&mut self, byte: u8, line: usize) {
        self.code.push(byte);
        self.lines.push(line);
    }

    /// Add a constant and return its index. The compiler checks the index
    /// still fits in the one-byte operand.
    pub fn add_constant(&mut self, value: Value) -> usize {
        self.constants.push(value);
        self.constants.len() - 1
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opcodes_round_trip_through_bytes() {
        for (i, op) in OpCode::ALL.iter().enumerate() {
            assert_eq!(*op as usize, i);
            assert_eq!(OpCode::from_byte(i as u8), Some(*op));
        }
        assert_eq!(OpCode::from_byte(37), None);
        assert_eq!(OpCode::JumpIfFalse.name(), "OP_JUMP_IF_FALSE");
    }
}
