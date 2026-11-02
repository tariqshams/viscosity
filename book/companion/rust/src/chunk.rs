//! Bytecode chunks and the instruction set (book chapters 45 and 46).
//!
//! Operands follow the opcode byte: a constant index is two bytes
//! (big-endian), a stack slot, upvalue index or count is one byte, and a
//! jump distance is two bytes. See `../ts/src/vm/chunk.ts`, which has the
//! same instructions with the same numbers.

use crate::value::Value;

/// One instruction's opcode. `#[repr(u8)]` makes each variant exactly the
/// byte that encodes it, so `op as u8` is free.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OpCode {
    Const,
    None,
    True,
    False,
    Pop,
    Dup,
    Dup2,
    List,
    LoadLocal,
    StoreLocal,
    LoadGlobal,
    DefineGlobal,
    StoreGlobal,
    LoadUpvalue,
    StoreUpvalue,
    GetProp,
    SetProp,
    GetSuper,
    IndexGet,
    IndexSet,
    Add,
    Sub,
    Mul,
    Div,
    Rem,
    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
    Not,
    Neg,
    Print,
    Jump,
    JumpUnless,
    JumpUnlessKeep,
    JumpIfKeep,
    Loop,
    IterRange,
    IterList,
    ListLen,
    IncLocal,
    Call,
    Invoke,
    InvokeSuper,
    New,
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
    pub const ALL: [OpCode; 53] = {
        use OpCode::*;
        [
            Const, None, True, False, Pop, Dup, Dup2, List, LoadLocal, StoreLocal,
            LoadGlobal, DefineGlobal, StoreGlobal, LoadUpvalue, StoreUpvalue,
            GetProp, SetProp, GetSuper, IndexGet, IndexSet, Add, Sub, Mul, Div,
            Rem, Eq, Ne, Lt, Le, Gt, Ge, Not, Neg, Print, Jump, JumpUnless,
            JumpUnlessKeep, JumpIfKeep, Loop, IterRange, IterList, ListLen,
            IncLocal, Call, Invoke, InvokeSuper, New, Closure, CloseUpvalue,
            Return, Class, Inherit, Method,
        ]
    };

    /// Decode a byte, or `None` if no opcode has that encoding.
    pub fn from_byte(byte: u8) -> Option<OpCode> {
        OpCode::ALL.get(byte as usize).copied()
    }

    /// The name the disassembler prints, such as `load.local`.
    pub fn name(self) -> String {
        // Turn `JumpUnlessKeep` into `jump.unless.keep`.
        let mut name = String::new();
        for (i, c) in format!("{self:?}").chars().enumerate() {
            if c.is_ascii_uppercase() && i > 0 {
                name.push('.');
            }
            name.push(c.to_ascii_lowercase());
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
    /// still fits in the two-byte operand.
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
        assert_eq!(OpCode::from_byte(53), None);
        assert_eq!(OpCode::JumpUnlessKeep.name(), "jump.unless.keep");
        assert_eq!(OpCode::Dup2.name(), "dup2");
    }
}
