//! A disassembler: bytecode as readable text (the book's chapter “Bytecode as data, and a disassembler”). The
//! layout matches the TypeScript `disassembleChunk` column for column.

use crate::chunk::{Chunk, OpCode};
use crate::gc::Heap;
use crate::object::{Gc, ObjFunction};
use crate::value::Value;

/// Disassemble a whole chunk under a `== name ==` heading.
pub fn disassemble_chunk(heap: &Heap, chunk: &Chunk, name: &str) -> Vec<String> {
    let mut lines = vec![format!("== {name} ==")];
    let mut offset = 0;
    while offset < chunk.code.len() {
        let (text, next) = disassemble_instruction(heap, chunk, offset);
        lines.push(text);
        offset = next;
    }
    lines
}

/// Disassemble a function and, after it, every function nested in it.
pub fn disassemble_function(heap: &Heap, function: Gc<ObjFunction>) -> Vec<String> {
    let f = &heap[function];
    let name = match f.name {
        Some(n) => heap.str(n),
        None if f.is_script => "<script>",
        None => "<fn>",
    };
    let mut lines = disassemble_chunk(heap, &f.chunk, name);
    for constant in &f.chunk.constants {
        if let Value::Function(inner) = *constant {
            lines.extend(disassemble_function(heap, inner));
        }
    }
    lines
}

/// Disassemble the instruction at `offset`. Returns its text and the
/// offset of the next instruction.
pub fn disassemble_instruction(
    heap: &Heap,
    chunk: &Chunk,
    offset: usize,
) -> (String, usize) {
    let code = &chunk.code;
    let line = if offset > 0 && chunk.lines[offset] == chunk.lines[offset - 1] {
        "   |".to_string()
    } else {
        format!("{:>4}", chunk.lines[offset])
    };
    let prefix = format!("{offset:04} {line} ");
    let Some(op) = OpCode::from_byte(code[offset]) else {
        return (format!("{prefix}unknown opcode {}", code[offset]), offset + 1);
    };
    let name = op.name();
    let short = |at: usize| (code[at] as usize) << 8 | code[at + 1] as usize;
    let constant = |k: usize| format!("{k:>4} '{}'", chunk.constants[k].format(heap));
    use OpCode::*;
    match op {
        Const | LoadGlobal | DefineGlobal | StoreGlobal | GetProp | SetProp
        | GetSuper | Class | Method => {
            (format!("{prefix}{name:<16} {}", constant(short(offset + 1))), offset + 3)
        }
        LoadLocal | StoreLocal | LoadUpvalue | StoreUpvalue | Call | New | List
        | IncLocal => (format!("{prefix}{name:<16} {:>4}", code[offset + 1]), offset + 2),
        Jump | JumpUnless | JumpUnlessKeep | JumpIfKeep | Loop => {
            let jump = short(offset + 1);
            let target = if op == Loop { offset + 3 - jump } else { offset + 3 + jump };
            (format!("{prefix}{name:<16} {offset:>4} -> {target}"), offset + 3)
        }
        Invoke | InvokeSuper => {
            let text = format!(
                "{prefix}{name:<16} {} ({} args)",
                constant(short(offset + 1)),
                code[offset + 3]
            );
            (text, offset + 4)
        }
        Closure => {
            let k = short(offset + 1);
            let value = chunk.constants[k];
            let mut text = format!("{prefix}{name:<16} {k:>4} {}", value.format(heap));
            let mut next = offset + 3;
            let Value::Function(function) = value else {
                return (text, next);
            };
            for _ in 0..heap[function].upvalue_count {
                let kind = if code[next] == 1 { "local" } else { "upvalue" };
                let slot = code[next + 1];
                text += &format!("\n{next:04}    |   {kind} {slot}");
                next += 2;
            }
            (text, next)
        }
        _ => (format!("{prefix}{name}"), offset + 1),
    }
}
