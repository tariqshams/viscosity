//! The single-pass compiler (book chapters 48 and 53 to 59): a Pratt
//! parser that emits bytecode as it parses, with no syntax tree between.
//!
//! Its structure and error messages follow clox from *Crafting
//! Interpreters* (MIT) and the TypeScript compiler line for line, so all
//! three can be checked against the same test suite.

use std::rc::Rc;

use crate::chunk::{Chunk, OpCode};
use crate::gc::{Heap, Trace};
use crate::object::{Gc, ObjFunction, StrRef};
use crate::scanner::{Scanner, Token, TokenKind};
use crate::value::Value;

/// Locals, upvalues and constants are addressed by one-byte operands.
const UINT8_COUNT: usize = 256;

/// Compile a whole program into the function for its top-level script.
/// Errors are appended to `errors`; if there were any, the result is
/// `None`. `roots` are the caller's own roots, for any collection that
/// happens while compiling.
pub fn compile(
    source: &str,
    heap: &mut Heap,
    roots: &dyn Trace,
    errors: &mut Vec<String>,
) -> Option<Gc<ObjFunction>> {
    let mut compiler = Compiler {
        scanner: Scanner::new(source),
        current: Token { kind: TokenKind::Eof, lexeme: "", line: 1 },
        previous: Token { kind: TokenKind::Eof, lexeme: "", line: 1 },
        had_error: false,
        panic_mode: false,
        functions: Vec::new(),
        classes: Vec::new(),
        heap,
        roots,
        errors,
    };
    compiler.begin_function(FunctionKind::Script);
    compiler.advance();
    while !compiler.matches(TokenKind::Eof) {
        compiler.declaration();
    }
    let (function, _) = compiler.end_function();
    (!compiler.had_error).then_some(function)
}

/// Operator precedence, lowest first: the derived ordering compares them.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Precedence {
    None,
    Assignment, // =
    Or,         // or
    And,        // and
    Equality,   // == !=
    Comparison, // < > <= >=
    Term,       // + -
    Factor,     // * /
    Unary,      // ! -
    Call,       // . ()
    Primary,
}

impl Precedence {
    /// One level tighter: the right operand of a left-associative operator.
    fn next(self) -> Precedence {
        use Precedence as P;
        match self {
            P::None => P::Assignment,
            P::Assignment => P::Or,
            P::Or => P::And,
            P::And => P::Equality,
            P::Equality => P::Comparison,
            P::Comparison => P::Term,
            P::Term => P::Factor,
            P::Factor => P::Unary,
            P::Unary => P::Call,
            P::Call | P::Primary => P::Primary,
        }
    }
}

/// A parse function; the flag says whether an `=` may follow.
type ParseFn<'src, 'a> = fn(&mut Compiler<'src, 'a>, bool);

/// A row of the Pratt table: how a token parses in prefix and infix
/// position, and how tightly it binds as an infix operator.
struct ParseRule<'src, 'a> {
    prefix: Option<ParseFn<'src, 'a>>,
    infix: Option<ParseFn<'src, 'a>>,
    precedence: Precedence,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum FunctionKind {
    Function,
    Initializer,
    Method,
    Script,
}

struct Local<'src> {
    name: &'src str,
    /// The scope depth, or `None` while the variable is declared but its
    /// initializer is still being compiled.
    depth: Option<usize>,
    /// Captured by a closure: it must be closed over, not just popped.
    is_captured: bool,
}

/// Where a closure finds a captured variable when it is created: a local
/// of the enclosing function, or one of the enclosing closure's upvalues.
#[derive(Clone, Copy, PartialEq, Eq)]
struct UpvalueRef {
    index: u8,
    is_local: bool,
}

/// The compiler's state for one function being compiled. Functions nest,
/// so the compiler keeps a stack of these; clox links them in a list.
struct FunctionState<'src> {
    function: Gc<ObjFunction>,
    /// The bytecode so far. It moves into the function when it's done.
    chunk: Chunk,
    kind: FunctionKind,
    locals: Vec<Local<'src>>,
    upvalues: Vec<UpvalueRef>,
    scope_depth: usize,
}

/// Functions still being compiled, and their constants, are garbage
/// collection roots.
impl Trace for FunctionState<'_> {
    fn trace(&self, marks: &mut crate::gc::Marks) {
        self.function.trace(marks);
        self.chunk.constants.trace(marks);
    }
}

struct ClassState {
    has_superclass: bool,
}

struct Compiler<'src, 'a> {
    scanner: Scanner<'src>,
    current: Token<'src>,
    previous: Token<'src>,
    had_error: bool,
    /// Set by an error, cleared at the next statement boundary: errors
    /// in between are cascades of the first, so they are not reported.
    panic_mode: bool,
    functions: Vec<FunctionState<'src>>,
    classes: Vec<ClassState>,
    heap: &'a mut Heap,
    roots: &'a dyn Trace,
    errors: &'a mut Vec<String>,
}

impl<'src, 'a> Compiler<'src, 'a> {
    // ---- errors -----------------------------------------------------------

    fn error_at(&mut self, token: Token<'src>, message: &str) {
        if self.panic_mode {
            return;
        }
        self.panic_mode = true;
        let location = match token.kind {
            TokenKind::Eof => " at end".to_string(),
            TokenKind::Error => String::new(),
            _ => format!(" at '{}'", token.lexeme),
        };
        let line = token.line;
        self.errors.push(format!("[line {line}] Error{location}: {message}"));
        self.had_error = true;
    }

    fn error(&mut self, message: &str) {
        self.error_at(self.previous, message);
    }

    fn error_at_current(&mut self, message: &str) {
        self.error_at(self.current, message);
    }

    // ---- tokens -----------------------------------------------------------

    fn advance(&mut self) {
        self.previous = self.current;
        loop {
            self.current = self.scanner.scan_token();
            if self.current.kind != TokenKind::Error {
                break;
            }
            self.error_at_current(self.current.lexeme);
        }
    }

    fn check(&self, kind: TokenKind) -> bool {
        self.current.kind == kind
    }

    fn consume(&mut self, kind: TokenKind, message: &str) {
        if self.check(kind) {
            self.advance();
        } else {
            self.error_at_current(message);
        }
    }

    fn matches(&mut self, kind: TokenKind) -> bool {
        if !self.check(kind) {
            return false;
        }
        self.advance();
        true
    }

    // ---- allocating -------------------------------------------------------

    /// Collect if the heap asks to, before allocating. The roots are the
    /// caller's plus every function still being compiled.
    fn collect_if_needed(&mut self) {
        if self.heap.should_collect() {
            self.heap.collect(&[self.roots, &self.functions]);
        }
    }

    fn intern(&mut self, chars: &str) -> StrRef {
        self.collect_if_needed();
        self.heap.intern(chars)
    }

    // ---- emitting ---------------------------------------------------------

    fn state(&mut self) -> &mut FunctionState<'src> {
        self.functions.last_mut().expect("compiling a function")
    }

    fn chunk(&mut self) -> &mut Chunk {
        &mut self.state().chunk
    }

    fn emit(&mut self, byte: u8) {
        let line = self.previous.line;
        self.chunk().write(byte, line);
    }

    fn emit_op(&mut self, op: OpCode) {
        self.emit(op as u8);
    }

    fn emit_op_with(&mut self, op: OpCode, operand: u8) {
        self.emit_op(op);
        self.emit(operand);
    }

    /// Jump backwards to `loop_start`.
    fn emit_loop(&mut self, loop_start: usize) {
        self.emit_op(OpCode::Loop);
        let offset = self.chunk().code.len() - loop_start + 2;
        if offset > u16::MAX as usize {
            self.error("Loop body too large.");
        }
        self.emit((offset >> 8) as u8);
        self.emit(offset as u8);
    }

    /// Emit a forward jump with a placeholder offset; return where the
    /// offset is, so [`Compiler::patch_jump`] can fill it in.
    fn emit_jump(&mut self, op: OpCode) -> usize {
        self.emit_op(op);
        self.emit(0xff);
        self.emit(0xff);
        self.chunk().code.len() - 2
    }

    /// Point the jump at `offset` to the next instruction emitted.
    fn patch_jump(&mut self, offset: usize) {
        let jump = self.chunk().code.len() - offset - 2;
        if jump > u16::MAX as usize {
            self.error("Too much code to jump over.");
        }
        let code = &mut self.chunk().code;
        code[offset] = (jump >> 8) as u8;
        code[offset + 1] = jump as u8;
    }

    /// The implicit return at the end of a function body.
    fn emit_return(&mut self) {
        if self.state().kind == FunctionKind::Initializer {
            // An initializer returns `this`, which is in slot 0.
            self.emit_op_with(OpCode::GetLocal, 0);
        } else {
            self.emit_op(OpCode::Nil);
        }
        self.emit_op(OpCode::Return);
    }

    fn make_constant(&mut self, value: Value) -> u8 {
        let index = self.chunk().add_constant(value);
        match u8::try_from(index) {
            Ok(index) => index,
            Err(_) => {
                self.error("Too many constants in one chunk.");
                0
            }
        }
    }

    fn emit_constant(&mut self, value: Value) {
        let index = self.make_constant(value);
        self.emit_op_with(OpCode::Constant, index);
    }

    // ---- functions and scopes ---------------------------------------------

    fn begin_function(&mut self, kind: FunctionKind) {
        self.collect_if_needed();
        let function = self.heap.alloc(ObjFunction {
            arity: 0,
            upvalue_count: 0,
            chunk: Rc::default(),
            name: None,
        });
        // Slot 0 holds the function being called, or `this` in a method.
        let slot_zero = match kind {
            FunctionKind::Method | FunctionKind::Initializer => "this",
            FunctionKind::Function | FunctionKind::Script => "",
        };
        self.functions.push(FunctionState {
            function,
            chunk: Chunk::default(),
            kind,
            locals: vec![Local { name: slot_zero, depth: Some(0), is_captured: false }],
            upvalues: Vec::new(),
            scope_depth: 0,
        });
        if kind != FunctionKind::Script {
            let name = self.intern(self.previous.lexeme);
            self.heap[function].name = Some(name);
        }
    }

    /// Finish the innermost function; return it and what it captures.
    fn end_function(&mut self) -> (Gc<ObjFunction>, Vec<UpvalueRef>) {
        self.emit_return();
        let state = self.functions.pop().expect("compiling a function");
        let function = &mut self.heap[state.function];
        function.upvalue_count = state.upvalues.len();
        function.chunk = Rc::new(state.chunk);
        (state.function, state.upvalues)
    }

    fn begin_scope(&mut self) {
        self.state().scope_depth += 1;
    }

    fn end_scope(&mut self) {
        self.state().scope_depth -= 1;
        loop {
            let state = self.state();
            let depth = state.scope_depth;
            let captured = match state.locals.last() {
                Some(local) if local.depth.is_some_and(|d| d > depth) => {
                    local.is_captured
                }
                _ => break,
            };
            state.locals.pop();
            // A captured variable moves to the heap as its scope ends.
            self.emit_op(if captured { OpCode::CloseUpvalue } else { OpCode::Pop });
        }
    }

    // ---- variables --------------------------------------------------------

    fn identifier_constant(&mut self, name: &str) -> u8 {
        let s = self.intern(name);
        self.make_constant(Value::String(s))
    }

    /// The slot of local `name` in function `level` of the stack.
    fn resolve_local(&mut self, level: usize, name: &str) -> Option<usize> {
        let locals = &self.functions[level].locals;
        let (slot, local) =
            locals.iter().enumerate().rev().find(|(_, l)| l.name == name)?;
        if local.depth.is_none() {
            self.error("Can't read local variable in its own initializer.");
        }
        Some(slot)
    }

    fn add_upvalue(&mut self, level: usize, index: usize, is_local: bool) -> u8 {
        let upvalue = UpvalueRef { index: index as u8, is_local };
        let upvalues = &self.functions[level].upvalues;
        if let Some(i) = upvalues.iter().position(|u| *u == upvalue) {
            return i as u8;
        }
        if upvalues.len() == UINT8_COUNT {
            self.error("Too many closure variables in function.");
            return 0;
        }
        self.functions[level].upvalues.push(upvalue);
        (self.functions[level].upvalues.len() - 1) as u8
    }

    /// Find `name` in the functions enclosing function `level`, capturing
    /// it in each function on the way in.
    fn resolve_upvalue(&mut self, level: usize, name: &str) -> Option<u8> {
        let enclosing = level.checked_sub(1)?;
        if let Some(local) = self.resolve_local(enclosing, name) {
            self.functions[enclosing].locals[local].is_captured = true;
            return Some(self.add_upvalue(level, local, true));
        }
        let upvalue = self.resolve_upvalue(enclosing, name)?;
        Some(self.add_upvalue(level, upvalue as usize, false))
    }

    fn add_local(&mut self, name: &'src str) {
        if self.state().locals.len() == UINT8_COUNT {
            self.error("Too many local variables in function.");
            return;
        }
        let local = Local { name, depth: None, is_captured: false };
        self.state().locals.push(local);
    }

    /// Record a new local variable; globals need no declaring.
    fn declare_variable(&mut self) {
        let name = self.previous.lexeme;
        let state = self.state();
        if state.scope_depth == 0 {
            return;
        }
        let depth = state.scope_depth;
        let duplicate = state
            .locals
            .iter()
            .rev()
            .take_while(|l| l.depth.is_none_or(|d| d >= depth))
            .any(|l| l.name == name);
        if duplicate {
            self.error("Already a variable with this name in this scope.");
        }
        self.add_local(name);
    }

    /// Parse a variable name. For a global, return its name's constant.
    fn parse_variable(&mut self, message: &str) -> u8 {
        self.consume(TokenKind::Identifier, message);
        self.declare_variable();
        if self.state().scope_depth > 0 {
            return 0;
        }
        self.identifier_constant(self.previous.lexeme)
    }

    fn mark_initialized(&mut self) {
        let state = self.state();
        if state.scope_depth == 0 {
            return;
        }
        let depth = state.scope_depth;
        if let Some(local) = state.locals.last_mut() {
            local.depth = Some(depth);
        }
    }

    fn define_variable(&mut self, global: u8) {
        if self.state().scope_depth > 0 {
            self.mark_initialized();
            return;
        }
        self.emit_op_with(OpCode::DefineGlobal, global);
    }

    fn argument_list(&mut self) -> u8 {
        let mut count: usize = 0;
        if !self.check(TokenKind::RightParen) {
            loop {
                self.expression();
                if count == 255 {
                    self.error("Can't have more than 255 arguments.");
                }
                count += 1;
                if !self.matches(TokenKind::Comma) {
                    break;
                }
            }
        }
        self.consume(TokenKind::RightParen, "Expect ')' after arguments.");
        count as u8
    }

    fn named_variable(&mut self, name: Token<'src>, can_assign: bool) {
        let top = self.functions.len() - 1;
        let (get, set, arg) = if let Some(slot) = self.resolve_local(top, name.lexeme) {
            (OpCode::GetLocal, OpCode::SetLocal, slot as u8)
        } else if let Some(index) = self.resolve_upvalue(top, name.lexeme) {
            (OpCode::GetUpvalue, OpCode::SetUpvalue, index)
        } else {
            let index = self.identifier_constant(name.lexeme);
            (OpCode::GetGlobal, OpCode::SetGlobal, index)
        };
        if can_assign && self.matches(TokenKind::Equal) {
            self.expression();
            self.emit_op_with(set, arg);
        } else {
            self.emit_op_with(get, arg);
        }
    }

    // ---- expressions: the Pratt parser ------------------------------------

    fn rule(kind: TokenKind) -> ParseRule<'src, 'a> {
        use Precedence as P;
        use TokenKind as T;
        let (prefix, infix, precedence): (Option<ParseFn>, Option<ParseFn>, _) =
            match kind {
                T::LeftParen => (Some(Self::grouping), Some(Self::call), P::Call),
                T::Dot => (None, Some(Self::dot), P::Call),
                T::Minus => (Some(Self::unary), Some(Self::binary), P::Term),
                T::Plus => (None, Some(Self::binary), P::Term),
                T::Slash | T::Star => (None, Some(Self::binary), P::Factor),
                T::Bang => (Some(Self::unary), None, P::None),
                T::BangEqual | T::EqualEqual => (None, Some(Self::binary), P::Equality),
                T::Greater | T::GreaterEqual | T::Less | T::LessEqual => {
                    (None, Some(Self::binary), P::Comparison)
                }
                T::Identifier => (Some(Self::variable), None, P::None),
                T::String => (Some(Self::string), None, P::None),
                T::Number => (Some(Self::number), None, P::None),
                T::And => (None, Some(Self::and), P::And),
                T::Or => (None, Some(Self::or), P::Or),
                T::False | T::True | T::Nil => (Some(Self::literal), None, P::None),
                T::Super => (Some(Self::super_), None, P::None),
                T::This => (Some(Self::this), None, P::None),
                _ => (None, None, P::None),
            };
        ParseRule { prefix, infix, precedence }
    }

    /// Parse an expression whose operators bind at least as tightly as
    /// `precedence`: the heart of the Pratt parser.
    fn parse_precedence(&mut self, precedence: Precedence) {
        self.advance();
        let Some(prefix) = Self::rule(self.previous.kind).prefix else {
            self.error("Expect expression.");
            return;
        };
        let can_assign = precedence <= Precedence::Assignment;
        prefix(self, can_assign);
        while precedence <= Self::rule(self.current.kind).precedence {
            self.advance();
            let infix = Self::rule(self.previous.kind).infix.expect("infix rule");
            infix(self, can_assign);
        }
        if can_assign && self.matches(TokenKind::Equal) {
            self.error("Invalid assignment target.");
        }
    }

    fn expression(&mut self) {
        self.parse_precedence(Precedence::Assignment);
    }

    fn grouping(&mut self, _can_assign: bool) {
        self.expression();
        self.consume(TokenKind::RightParen, "Expect ')' after expression.");
    }

    fn number(&mut self, _can_assign: bool) {
        let n: f64 = self.previous.lexeme.parse().expect("scanner checked the digits");
        self.emit_constant(Value::Number(n));
    }

    fn string(&mut self, _can_assign: bool) {
        // Strip the quotes.
        let lexeme = self.previous.lexeme;
        let s = self.intern(&lexeme[1..lexeme.len() - 1]);
        self.emit_constant(Value::String(s));
    }

    fn variable(&mut self, can_assign: bool) {
        self.named_variable(self.previous, can_assign);
    }

    fn literal(&mut self, _can_assign: bool) {
        match self.previous.kind {
            TokenKind::False => self.emit_op(OpCode::False),
            TokenKind::True => self.emit_op(OpCode::True),
            _ => self.emit_op(OpCode::Nil),
        }
    }

    fn unary(&mut self, _can_assign: bool) {
        let operator = self.previous.kind;
        self.parse_precedence(Precedence::Unary);
        match operator {
            TokenKind::Bang => self.emit_op(OpCode::Not),
            _ => self.emit_op(OpCode::Negate),
        }
    }

    fn binary(&mut self, _can_assign: bool) {
        use TokenKind as T;
        let operator = self.previous.kind;
        self.parse_precedence(Self::rule(operator).precedence.next());
        // `a >= b` is `!(a < b)`, and so on: three comparison opcodes do.
        let ops: &[OpCode] = match operator {
            T::BangEqual => &[OpCode::Equal, OpCode::Not],
            T::EqualEqual => &[OpCode::Equal],
            T::Greater => &[OpCode::Greater],
            T::GreaterEqual => &[OpCode::Less, OpCode::Not],
            T::Less => &[OpCode::Less],
            T::LessEqual => &[OpCode::Greater, OpCode::Not],
            T::Plus => &[OpCode::Add],
            T::Minus => &[OpCode::Subtract],
            T::Star => &[OpCode::Multiply],
            T::Slash => &[OpCode::Divide],
            _ => unreachable!("not a binary operator"),
        };
        for &op in ops {
            self.emit_op(op);
        }
    }

    /// `and` short-circuits: if the left side is falsey, skip the right.
    fn and(&mut self, _can_assign: bool) {
        let end_jump = self.emit_jump(OpCode::JumpIfFalse);
        self.emit_op(OpCode::Pop);
        self.parse_precedence(Precedence::And);
        self.patch_jump(end_jump);
    }

    /// `or` short-circuits: if the left side is truthy, skip the right.
    fn or(&mut self, _can_assign: bool) {
        let else_jump = self.emit_jump(OpCode::JumpIfFalse);
        let end_jump = self.emit_jump(OpCode::Jump);
        self.patch_jump(else_jump);
        self.emit_op(OpCode::Pop);
        self.parse_precedence(Precedence::Or);
        self.patch_jump(end_jump);
    }

    fn call(&mut self, _can_assign: bool) {
        let count = self.argument_list();
        self.emit_op_with(OpCode::Call, count);
    }

    fn dot(&mut self, can_assign: bool) {
        self.consume(TokenKind::Identifier, "Expect property name after '.'.");
        let name = self.identifier_constant(self.previous.lexeme);
        if can_assign && self.matches(TokenKind::Equal) {
            self.expression();
            self.emit_op_with(OpCode::SetProperty, name);
        } else if self.matches(TokenKind::LeftParen) {
            // `a.b(...)`: one instruction instead of a get and a call.
            let count = self.argument_list();
            self.emit_op_with(OpCode::Invoke, name);
            self.emit(count);
        } else {
            self.emit_op_with(OpCode::GetProperty, name);
        }
    }

    fn this(&mut self, _can_assign: bool) {
        if self.classes.is_empty() {
            self.error("Can't use 'this' outside of a class.");
            return;
        }
        self.variable(false);
    }

    fn super_(&mut self, _can_assign: bool) {
        match self.classes.last() {
            None => self.error("Can't use 'super' outside of a class."),
            Some(class) if !class.has_superclass => {
                self.error("Can't use 'super' in a class with no superclass.");
            }
            Some(_) => {}
        }
        self.consume(TokenKind::Dot, "Expect '.' after 'super'.");
        self.consume(TokenKind::Identifier, "Expect superclass method name.");
        let name = self.identifier_constant(self.previous.lexeme);
        let line = self.previous.line;
        self.named_variable(Token::synthetic("this", line), false);
        if self.matches(TokenKind::LeftParen) {
            let count = self.argument_list();
            self.named_variable(Token::synthetic("super", line), false);
            self.emit_op_with(OpCode::SuperInvoke, name);
            self.emit(count);
        } else {
            self.named_variable(Token::synthetic("super", line), false);
            self.emit_op_with(OpCode::GetSuper, name);
        }
    }

    // ---- statements -------------------------------------------------------

    fn declaration(&mut self) {
        if self.matches(TokenKind::Class) {
            self.class_declaration();
        } else if self.matches(TokenKind::Fn) {
            self.fn_declaration();
        } else if self.matches(TokenKind::Let) {
            self.let_declaration();
        } else {
            self.statement();
        }
        if self.panic_mode {
            self.synchronize();
        }
    }

    fn statement(&mut self) {
        if self.matches(TokenKind::Print) {
            self.expression();
            self.consume(TokenKind::Semicolon, "Expect ';' after value.");
            self.emit_op(OpCode::Print);
        } else if self.matches(TokenKind::For) {
            self.for_statement();
        } else if self.matches(TokenKind::If) {
            self.if_statement();
        } else if self.matches(TokenKind::Return) {
            self.return_statement();
        } else if self.matches(TokenKind::While) {
            self.while_statement();
        } else if self.matches(TokenKind::LeftBrace) {
            self.begin_scope();
            self.block();
            self.end_scope();
        } else {
            self.expression_statement();
        }
    }

    /// Skip to a likely statement boundary after an error.
    fn synchronize(&mut self) {
        use TokenKind as T;
        self.panic_mode = false;
        while self.current.kind != T::Eof {
            if self.previous.kind == T::Semicolon {
                return;
            }
            match self.current.kind {
                T::Class
                | T::Fn
                | T::Let
                | T::For
                | T::If
                | T::While
                | T::Print
                | T::Return => {
                    return;
                }
                _ => self.advance(),
            }
        }
    }

    fn block(&mut self) {
        while !self.check(TokenKind::RightBrace) && !self.check(TokenKind::Eof) {
            self.declaration();
        }
        self.consume(TokenKind::RightBrace, "Expect '}' after block.");
    }

    /// Compile a function's parameters and body, then emit the closure.
    fn function(&mut self, kind: FunctionKind) {
        self.begin_function(kind);
        self.begin_scope();
        self.consume(TokenKind::LeftParen, "Expect '(' after function name.");
        if !self.check(TokenKind::RightParen) {
            loop {
                let function = self.state().function;
                self.heap[function].arity += 1;
                if self.heap[function].arity > 255 {
                    self.error_at_current("Can't have more than 255 parameters.");
                }
                let constant = self.parse_variable("Expect parameter name.");
                self.define_variable(constant);
                if !self.matches(TokenKind::Comma) {
                    break;
                }
            }
        }
        self.consume(TokenKind::RightParen, "Expect ')' after parameters.");
        self.consume(TokenKind::LeftBrace, "Expect '{' before function body.");
        self.block();
        // No end_scope: the frame's slots all go when the function returns.
        let (function, upvalues) = self.end_function();
        let constant = self.make_constant(Value::Function(function));
        self.emit_op_with(OpCode::Closure, constant);
        for upvalue in upvalues {
            self.emit(u8::from(upvalue.is_local));
            self.emit(upvalue.index);
        }
    }

    fn method(&mut self) {
        self.consume(TokenKind::Identifier, "Expect method name.");
        let constant = self.identifier_constant(self.previous.lexeme);
        let kind = if self.previous.lexeme == "init" {
            FunctionKind::Initializer
        } else {
            FunctionKind::Method
        };
        self.function(kind);
        self.emit_op_with(OpCode::Method, constant);
    }

    fn class_declaration(&mut self) {
        self.consume(TokenKind::Identifier, "Expect class name.");
        let class_name = self.previous;
        let name_constant = self.identifier_constant(class_name.lexeme);
        self.declare_variable();
        self.emit_op_with(OpCode::Class, name_constant);
        self.define_variable(name_constant);

        self.classes.push(ClassState { has_superclass: false });
        if self.matches(TokenKind::Less) {
            self.consume(TokenKind::Identifier, "Expect superclass name.");
            self.variable(false);
            if class_name.lexeme == self.previous.lexeme {
                self.error("A class can't inherit from itself.");
            }
            // `super` is a local in a scope around the class's methods,
            // so every method can capture it.
            self.begin_scope();
            self.add_local("super");
            self.define_variable(0);
            self.named_variable(class_name, false);
            self.emit_op(OpCode::Inherit);
            self.classes.last_mut().expect("in a class").has_superclass = true;
        }

        self.named_variable(class_name, false);
        self.consume(TokenKind::LeftBrace, "Expect '{' before class body.");
        while !self.check(TokenKind::RightBrace) && !self.check(TokenKind::Eof) {
            self.method();
        }
        self.consume(TokenKind::RightBrace, "Expect '}' after class body.");
        self.emit_op(OpCode::Pop);

        let class = self.classes.pop().expect("in a class");
        if class.has_superclass {
            self.end_scope();
        }
    }

    fn fn_declaration(&mut self) {
        let global = self.parse_variable("Expect function name.");
        // A function may refer to itself, so it is ready before its body.
        self.mark_initialized();
        self.function(FunctionKind::Function);
        self.define_variable(global);
    }

    fn let_declaration(&mut self) {
        let global = self.parse_variable("Expect variable name.");
        if self.matches(TokenKind::Equal) {
            self.expression();
        } else {
            self.emit_op(OpCode::Nil);
        }
        self.consume(TokenKind::Semicolon, "Expect ';' after variable declaration.");
        self.define_variable(global);
    }

    fn expression_statement(&mut self) {
        self.expression();
        self.consume(TokenKind::Semicolon, "Expect ';' after expression.");
        self.emit_op(OpCode::Pop);
    }

    fn for_statement(&mut self) {
        self.begin_scope();
        self.consume(TokenKind::LeftParen, "Expect '(' after 'for'.");
        if self.matches(TokenKind::Semicolon) {
            // No initializer.
        } else if self.matches(TokenKind::Let) {
            self.let_declaration();
        } else {
            self.expression_statement();
        }

        let mut loop_start = self.chunk().code.len();
        let mut exit_jump = None;
        if !self.matches(TokenKind::Semicolon) {
            self.expression();
            self.consume(TokenKind::Semicolon, "Expect ';' after loop condition.");
            exit_jump = Some(self.emit_jump(OpCode::JumpIfFalse));
            self.emit_op(OpCode::Pop);
        }

        if !self.matches(TokenKind::RightParen) {
            // The increment comes textually before the body but runs after
            // it: jump over it now, and loop back to it from the body.
            let body_jump = self.emit_jump(OpCode::Jump);
            let increment_start = self.chunk().code.len();
            self.expression();
            self.emit_op(OpCode::Pop);
            self.consume(TokenKind::RightParen, "Expect ')' after for clauses.");
            self.emit_loop(loop_start);
            loop_start = increment_start;
            self.patch_jump(body_jump);
        }

        self.statement();
        self.emit_loop(loop_start);
        if let Some(exit_jump) = exit_jump {
            self.patch_jump(exit_jump);
            self.emit_op(OpCode::Pop);
        }
        self.end_scope();
    }

    fn if_statement(&mut self) {
        self.consume(TokenKind::LeftParen, "Expect '(' after 'if'.");
        self.expression();
        self.consume(TokenKind::RightParen, "Expect ')' after condition.");
        let then_jump = self.emit_jump(OpCode::JumpIfFalse);
        self.emit_op(OpCode::Pop);
        self.statement();
        let else_jump = self.emit_jump(OpCode::Jump);
        self.patch_jump(then_jump);
        self.emit_op(OpCode::Pop);
        if self.matches(TokenKind::Else) {
            self.statement();
        }
        self.patch_jump(else_jump);
    }

    fn return_statement(&mut self) {
        let kind = self.state().kind;
        if kind == FunctionKind::Script {
            self.error("Can't return from top-level code.");
        }
        if self.matches(TokenKind::Semicolon) {
            self.emit_return();
        } else {
            if kind == FunctionKind::Initializer {
                self.error("Can't return a value from an initializer.");
            }
            self.expression();
            self.consume(TokenKind::Semicolon, "Expect ';' after return value.");
            self.emit_op(OpCode::Return);
        }
    }

    fn while_statement(&mut self) {
        let loop_start = self.chunk().code.len();
        self.consume(TokenKind::LeftParen, "Expect '(' after 'while'.");
        self.expression();
        self.consume(TokenKind::RightParen, "Expect ')' after condition.");
        let exit_jump = self.emit_jump(OpCode::JumpIfFalse);
        self.emit_op(OpCode::Pop);
        self.statement();
        self.emit_loop(loop_start);
        self.patch_jump(exit_jump);
        self.emit_op(OpCode::Pop);
    }
}
