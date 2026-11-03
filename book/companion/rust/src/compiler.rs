//! The single-pass compiler (the book's chapters “One pass from source to bytecode” and “String interning and globals by name” to 59): a Pratt
//! parser that emits bytecode as it parses, with no syntax tree between.
//!
//! It is a port of the TypeScript compiler (`../ts/src/vm/compiler.ts`),
//! function for function, so the two report exactly the same errors and
//! emit exactly the same bytecode. Syntax errors put the parser in panic
//! mode until the next statement; broken static rules (a redeclared
//! local, `return` outside a function...) are reported only when there
//! are no syntax errors, as the tree-walker's resolver does.

use std::rc::Rc;

use crate::chunk::{Chunk, OpCode};
use crate::gc::{Heap, Trace};
use crate::object::{Gc, ObjFunction, StrRef};
use crate::scanner::{Scanner, Token, TokenKind, unescape};
use crate::value::Value;

/// Locals and upvalues are addressed by one-byte operands.
const MAX_SLOTS: usize = 256;

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
    let eof = Token { kind: TokenKind::Eof, lexeme: "", line: 1 };
    let mut compiler = Compiler {
        scanner: Scanner::new(source),
        current: eof,
        previous: eof,
        panic_mode: false,
        block_depth: 0,
        syntax_errors: Vec::new(),
        static_errors: Vec::new(),
        functions: Vec::new(),
        classes: Vec::new(),
        heap,
        roots,
    };
    compiler.begin_function(FunctionKind::Script);
    compiler.advance();
    while !compiler.matches(TokenKind::Eof) {
        compiler.declaration();
    }
    let (function, _) = compiler.end_function();
    if compiler.syntax_errors.is_empty() {
        errors.append(&mut compiler.static_errors);
    } else {
        errors.append(&mut compiler.syntax_errors);
    }
    errors.is_empty().then_some(function)
}

// Precedence, weakest first.
const PREC_NONE: u8 = 0;
const PREC_ASSIGNMENT: u8 = 1;
const PREC_OR: u8 = 2;
const PREC_AND: u8 = 3;
const PREC_EQUALITY: u8 = 4;
const PREC_COMPARISON: u8 = 5;
const PREC_TERM: u8 = 6;
const PREC_FACTOR: u8 = 7;
const PREC_UNARY: u8 = 8;
const PREC_CALL: u8 = 9;

/// How tightly a token binds as an infix operator.
fn infix_precedence(kind: TokenKind) -> u8 {
    use TokenKind as T;
    match kind {
        T::LeftParen | T::LeftBracket | T::Dot => PREC_CALL,
        T::Star | T::Slash | T::Percent => PREC_FACTOR,
        T::Plus | T::Minus => PREC_TERM,
        T::Less | T::LessEqual | T::Greater | T::GreaterEqual => PREC_COMPARISON,
        T::EqualEqual | T::BangEqual => PREC_EQUALITY,
        T::AndAnd => PREC_AND,
        T::OrOr => PREC_OR,
        _ => PREC_NONE,
    }
}

/// The instruction for a binary operator.
fn binary_op(kind: TokenKind) -> OpCode {
    use TokenKind as T;
    match kind {
        T::Plus => OpCode::Add,
        T::Minus => OpCode::Sub,
        T::Star => OpCode::Mul,
        T::Slash => OpCode::Div,
        T::Percent => OpCode::Rem,
        T::EqualEqual => OpCode::Eq,
        T::BangEqual => OpCode::Ne,
        T::Less => OpCode::Lt,
        T::LessEqual => OpCode::Le,
        T::Greater => OpCode::Gt,
        T::GreaterEqual => OpCode::Ge,
        _ => unreachable!("not a binary operator"),
    }
}

/// Where a statement can start: where error recovery stops skipping.
fn starts_statement(kind: TokenKind) -> bool {
    use TokenKind as T;
    matches!(
        kind,
        T::Class
            | T::Fn
            | T::Let
            | T::For
            | T::If
            | T::While
            | T::Print
            | T::Return
            | T::Break
            | T::Continue
    )
}

/// What a token does at the start of an expression.
#[derive(Clone, Copy)]
enum Prefix {
    Grouping,
    List,
    Unary,
    Number,
    String,
    Literal(OpCode),
    Variable,
    SelfKw,
    Super,
    New,
    Fn,
}

fn prefix_rule(kind: TokenKind) -> Option<Prefix> {
    use TokenKind as T;
    Some(match kind {
        T::LeftParen => Prefix::Grouping,
        T::LeftBracket => Prefix::List,
        T::Minus | T::Bang => Prefix::Unary,
        T::Number => Prefix::Number,
        T::String => Prefix::String,
        T::True => Prefix::Literal(OpCode::True),
        T::False => Prefix::Literal(OpCode::False),
        T::None => Prefix::Literal(OpCode::None),
        T::Identifier => Prefix::Variable,
        T::SelfKw => Prefix::SelfKw,
        T::Super => Prefix::Super,
        T::New => Prefix::New,
        T::Fn => Prefix::Fn,
        _ => return None,
    })
}

fn is_assign_op(kind: TokenKind) -> bool {
    matches!(kind, TokenKind::Equal | TokenKind::PlusEqual | TokenKind::MinusEqual)
}

/// The arithmetic of `+=` and `-=`.
fn compound_op(kind: TokenKind) -> OpCode {
    if kind == TokenKind::PlusEqual { OpCode::Add } else { OpCode::Sub }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum FunctionKind {
    Script,
    Function,
    Anonymous,
    Method,
    Initializer,
}

struct Local<'src> {
    name: &'src str,
    /// The scope depth, or `None` while its initialiser is being compiled.
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

/// A loop being compiled, for `break` and `continue`.
struct Loop {
    /// `break` pops the locals deeper than this, then jumps to the end.
    break_depth: usize,
    breaks: Vec<usize>,
    /// `continue` pops the locals deeper than this, then goes on.
    continue_depth: usize,
    /// A while loop continues by jumping back here; a for loop forward.
    continue_target: Option<usize>,
    continues: Vec<usize>,
}

/// The compiler's state for one function being compiled. Functions nest,
/// so the compiler keeps a stack of these.
struct FunctionState<'src> {
    function: Gc<ObjFunction>,
    /// The bytecode so far. It moves into the function when it's done.
    chunk: Chunk,
    kind: FunctionKind,
    locals: Vec<Local<'src>>,
    upvalues: Vec<UpvalueRef>,
    scope_depth: usize,
    loops: Vec<Loop>,
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
    /// Set by a syntax error, cleared at the next statement boundary:
    /// errors in between are likely echoes of the first.
    panic_mode: bool,
    /// How many blocks and class bodies we are inside.
    block_depth: usize,
    syntax_errors: Vec<String>,
    static_errors: Vec<String>,
    functions: Vec<FunctionState<'src>>,
    classes: Vec<ClassState>,
    heap: &'a mut Heap,
    roots: &'a dyn Trace,
}

impl<'src> Compiler<'src, '_> {
    // ---- errors -----------------------------------------------------------

    fn error_at(&mut self, token: Token<'src>, message: &str) {
        if self.panic_mode {
            return;
        }
        self.panic_mode = true;
        self.syntax_errors.push(format!("line {}: {message}", token.line));
    }

    fn error(&mut self, message: &str) {
        self.error_at(self.previous, message);
    }

    /// `expected <what>, found <the current token>`, reported at `at`.
    fn expected_at(&mut self, what: &str, at: Token<'src>) {
        let message = format!("expected {what}, found {}", self.current.describe());
        self.error_at(at, &message);
    }

    fn expected(&mut self, what: &str) {
        self.expected_at(what, self.current);
    }

    /// A broken static rule: reported only if there are no syntax errors.
    fn static_error(&mut self, token: Token<'src>, message: &str) {
        self.static_errors.push(format!("line {}: {message}", token.line));
    }

    // ---- tokens -----------------------------------------------------------

    fn advance(&mut self) {
        self.previous = self.current;
        loop {
            self.current = self.scanner.scan_token();
            let TokenKind::Error(error) = self.current.kind else { break };
            let message = error.message(self.current.lexeme);
            self.error_at(self.current, &message);
        }
    }

    fn check(&self, kind: TokenKind) -> bool {
        self.current.kind == kind
    }

    fn matches(&mut self, kind: TokenKind) -> bool {
        if !self.check(kind) {
            return false;
        }
        self.advance();
        true
    }

    fn match_assign_op(&mut self) -> bool {
        if is_assign_op(self.current.kind) {
            self.advance();
            return true;
        }
        false
    }

    /// A missing `;` belongs at the end of the line before, so it is
    /// reported there.
    fn consume(&mut self, kind: TokenKind, what: &str) {
        if self.check(kind) {
            self.advance();
        } else {
            let at =
                if kind == TokenKind::Semicolon { self.previous } else { self.current };
            self.expected_at(what, at);
        }
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

    /// Emit a byte tagged with `line`: the line errors here report.
    fn emit_at(&mut self, line: usize, byte: u8) {
        self.chunk().write(byte, line);
    }

    fn emit(&mut self, byte: u8) {
        let line = self.previous.line;
        self.emit_at(line, byte);
    }

    fn emit_op(&mut self, op: OpCode) {
        self.emit(op as u8);
    }

    fn emit_op_at(&mut self, line: usize, op: OpCode) {
        self.emit_at(line, op as u8);
    }

    fn emit_op_byte_at(&mut self, line: usize, op: OpCode, byte: u8) {
        self.emit_at(line, op as u8);
        self.emit_at(line, byte);
    }

    fn emit_short_at(&mut self, line: usize, n: usize) {
        self.emit_at(line, (n >> 8) as u8);
        self.emit_at(line, n as u8);
    }

    /// An instruction with a two-byte constant operand.
    fn emit_constant_op(&mut self, line: usize, op: OpCode, constant: u16) {
        self.emit_at(line, op as u8);
        self.emit_short_at(line, constant as usize);
    }

    /// Jump backwards to `loop_start`.
    fn emit_loop(&mut self, loop_start: usize) {
        self.emit_op(OpCode::Loop);
        let offset = self.chunk().code.len() - loop_start + 2;
        if offset > u16::MAX as usize {
            self.static_error(self.previous, "loop body too large");
        }
        let line = self.previous.line;
        self.emit_short_at(line, offset);
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
            self.static_error(self.previous, "too much code to jump over");
        }
        let code = &mut self.chunk().code;
        code[offset] = (jump >> 8) as u8;
        code[offset + 1] = jump as u8;
    }

    /// The implicit return at the end of a function body.
    fn emit_return(&mut self) {
        if self.state().kind == FunctionKind::Initializer {
            // An initializer returns `self`, which is in slot 0.
            let line = self.previous.line;
            self.emit_op_byte_at(line, OpCode::LoadLocal, 0);
        } else {
            self.emit_op(OpCode::None);
        }
        self.emit_op(OpCode::Return);
    }

    fn make_constant(&mut self, value: Value) -> u16 {
        let index = self.chunk().add_constant(value);
        match u16::try_from(index) {
            Ok(index) => index,
            Err(_) => {
                self.static_error(self.previous, "too many constants in one function");
                0
            }
        }
    }

    fn identifier_constant(&mut self, name: &str) -> u16 {
        let s = self.intern(name);
        self.make_constant(Value::String(s))
    }

    // ---- functions and scopes ---------------------------------------------

    fn begin_function(&mut self, kind: FunctionKind) {
        self.collect_if_needed();
        let function = self.heap.alloc(ObjFunction {
            arity: 0,
            upvalue_count: 0,
            chunk: Rc::default(),
            name: None,
            is_script: kind == FunctionKind::Script,
        });
        // Slot 0 holds the function being called, or `self` in a method.
        let slot_zero = match kind {
            FunctionKind::Method | FunctionKind::Initializer => "self",
            _ => "",
        };
        self.functions.push(FunctionState {
            function,
            chunk: Chunk::default(),
            kind,
            locals: vec![Local { name: slot_zero, depth: Some(0), is_captured: false }],
            upvalues: Vec::new(),
            scope_depth: 0,
            loops: Vec::new(),
        });
        if matches!(
            kind,
            FunctionKind::Function | FunctionKind::Method | FunctionKind::Initializer
        ) {
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

    /// Pop (or close) the locals deeper than `depth`, without forgetting
    /// them: `break` and `continue` leave scopes the code goes on to use.
    fn pop_locals_deeper_than(&mut self, depth: usize) {
        let ops: Vec<OpCode> = self
            .state()
            .locals
            .iter()
            .rev()
            .take_while(|l| l.depth.is_some_and(|d| d > depth))
            .map(|l| if l.is_captured { OpCode::CloseUpvalue } else { OpCode::Pop })
            .collect();
        for op in ops {
            self.emit_op(op);
        }
    }

    // ---- variables --------------------------------------------------------

    /// The slot of local `name` in function `level` of the stack.
    fn resolve_local(&mut self, level: usize, name: Token<'src>) -> Option<usize> {
        let locals = &self.functions[level].locals;
        let (slot, local) =
            locals.iter().enumerate().rev().find(|(_, l)| l.name == name.lexeme)?;
        if local.depth.is_none() {
            let message = format!("cannot read '{}' in its own initialiser", name.lexeme);
            self.static_error(name, &message);
        }
        Some(slot)
    }

    fn add_upvalue(
        &mut self,
        level: usize,
        index: usize,
        is_local: bool,
        name: Token<'src>,
    ) -> u8 {
        let upvalue = UpvalueRef { index: index as u8, is_local };
        let upvalues = &self.functions[level].upvalues;
        if let Some(i) = upvalues.iter().position(|u| *u == upvalue) {
            return i as u8;
        }
        if upvalues.len() == MAX_SLOTS {
            self.static_error(name, "too many captured variables in one function");
            return 0;
        }
        self.functions[level].upvalues.push(upvalue);
        (self.functions[level].upvalues.len() - 1) as u8
    }

    /// Find `name` in the functions enclosing function `level`, capturing
    /// it in each function on the way in.
    fn resolve_upvalue(&mut self, level: usize, name: Token<'src>) -> Option<u8> {
        let enclosing = level.checked_sub(1)?;
        if let Some(local) = self.resolve_local(enclosing, name) {
            self.functions[enclosing].locals[local].is_captured = true;
            return Some(self.add_upvalue(level, local, true, name));
        }
        let upvalue = self.resolve_upvalue(enclosing, name)?;
        Some(self.add_upvalue(level, upvalue as usize, false, name))
    }

    fn add_local(&mut self, name: &'src str, at: Token<'src>) {
        if self.state().locals.len() == MAX_SLOTS {
            self.static_error(at, "too many local variables in one function");
            return;
        }
        self.state().locals.push(Local { name, depth: None, is_captured: false });
    }

    /// Declare `name` in the current scope, if it is a local scope.
    fn declare_variable(&mut self, name: Token<'src>) {
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
            .any(|l| l.name == name.lexeme);
        if duplicate {
            let message = format!("'{}' is already declared in this scope", name.lexeme);
            self.static_error(name, &message);
        }
        self.add_local(name.lexeme, name);
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

    /// After its value is on the stack: a local is ready, a global stored.
    fn define_variable(&mut self, name: Token<'src>) {
        if self.state().scope_depth > 0 {
            self.mark_initialized();
        } else {
            let constant = self.identifier_constant(name.lexeme);
            self.emit_constant_op(name.line, OpCode::DefineGlobal, constant);
        }
    }

    // ---- declarations and statements --------------------------------------

    /// Skip to the start of the next statement: just after a `;`, at a
    /// keyword that starts a statement, or at the `}` that closes the
    /// block we are in. Braces opened while skipping are skipped whole.
    fn synchronize(&mut self) {
        self.panic_mode = false;
        let mut depth = 0;
        while self.current.kind != TokenKind::Eof {
            if depth == 0
                && (self.previous.kind == TokenKind::Semicolon
                    || starts_statement(self.current.kind)
                    || (self.current.kind == TokenKind::RightBrace
                        && self.block_depth > 0))
            {
                return;
            }
            if self.current.kind == TokenKind::LeftBrace {
                depth += 1;
            } else if self.current.kind == TokenKind::RightBrace && depth > 0 {
                depth -= 1;
            }
            self.advance();
        }
    }

    fn declaration(&mut self) {
        if self.matches(TokenKind::Class) {
            self.class_declaration();
        } else if self.matches(TokenKind::Fn) {
            if self.check(TokenKind::LeftParen) {
                self.expression_statement_from(Some(Prefix::Fn));
            } else {
                self.fn_declaration();
            }
        } else if self.matches(TokenKind::Let) {
            self.let_declaration();
        } else {
            self.statement();
        }
        if self.panic_mode {
            self.synchronize();
        }
    }

    fn class_declaration(&mut self) {
        self.consume(TokenKind::Identifier, "a class name after 'class'");
        let class_name = self.previous;
        let name_constant = self.identifier_constant(class_name.lexeme);
        self.declare_variable(class_name);
        self.emit_constant_op(class_name.line, OpCode::Class, name_constant);
        self.define_variable(class_name);
        self.classes.push(ClassState { has_superclass: false });
        if self.matches(TokenKind::Extends) {
            self.consume(TokenKind::Identifier, "a class name after 'extends'");
            let superclass = self.previous;
            self.named_variable(superclass, false);
            if superclass.lexeme == class_name.lexeme {
                self.static_error(superclass, "a class cannot extend itself");
            }
            // The superclass lives in a local named `super`, which methods capture.
            self.begin_scope();
            self.add_local("super", superclass);
            self.mark_initialized();
            self.named_variable(class_name, false);
            self.emit_op_at(superclass.line, OpCode::Inherit);
            self.classes.last_mut().expect("a class").has_superclass = true;
        }
        self.named_variable(class_name, false);
        if !self.check(TokenKind::LeftBrace) {
            self.expected("'{' before the class body");
        } else {
            self.advance();
            self.block_depth += 1;
            while !self.check(TokenKind::RightBrace) && !self.check(TokenKind::Eof) {
                self.method();
            }
            self.block_depth -= 1;
            self.consume(TokenKind::RightBrace, "'}' to close the class body");
        }
        self.emit_op(OpCode::Pop);
        if self.classes.pop().expect("a class").has_superclass {
            self.end_scope();
        }
    }

    fn method(&mut self) {
        if !self.matches(TokenKind::Init) && !self.matches(TokenKind::Identifier) {
            // Skip the token, so the class body loop always moves on.
            self.expected("a method name");
            self.advance();
            return;
        }
        let name = self.previous;
        let constant = self.identifier_constant(name.lexeme);
        let kind = if name.kind == TokenKind::Init {
            FunctionKind::Initializer
        } else {
            FunctionKind::Method
        };
        self.fn_rest(kind, "'(' after the method name");
        self.emit_constant_op(name.line, OpCode::Method, constant);
    }

    fn fn_declaration(&mut self) {
        self.consume(TokenKind::Identifier, "a function name after 'fn'");
        let name = self.previous;
        self.declare_variable(name);
        self.mark_initialized(); // so the function can call itself
        self.fn_rest(FunctionKind::Function, "'(' after the function name");
        self.define_variable(name);
    }

    /// Compile parameters and body into a new function; leave its closure
    /// on the stack.
    fn fn_rest(&mut self, kind: FunctionKind, paren_message: &str) {
        self.begin_function(kind);
        self.begin_scope();
        self.consume(TokenKind::LeftParen, paren_message);
        if !self.check(TokenKind::RightParen) {
            loop {
                let function = self.state().function;
                if self.heap[function].arity == 255 {
                    self.error_at(
                        self.current,
                        "a function cannot have more than 255 parameters",
                    );
                }
                self.heap[function].arity += 1;
                self.consume(TokenKind::Identifier, "a parameter name");
                self.declare_variable(self.previous);
                self.mark_initialized();
                if !self.matches(TokenKind::Comma) {
                    break;
                }
            }
        }
        self.consume(TokenKind::RightParen, "')' after the parameters");
        // The body shares the parameters' scope: `let` can't redeclare one.
        // No end_scope: the frame's slots all go when the function returns.
        self.braced_block("'{' before the function body", false);
        let (function, upvalues) = self.end_function();
        let constant = self.make_constant(Value::Function(function));
        let line = self.previous.line;
        self.emit_constant_op(line, OpCode::Closure, constant);
        for upvalue in upvalues {
            self.emit(u8::from(upvalue.is_local));
            self.emit(upvalue.index);
        }
    }

    fn let_declaration(&mut self) {
        self.consume(TokenKind::Identifier, "a variable name after 'let'");
        let name = self.previous;
        self.declare_variable(name);
        if self.matches(TokenKind::Equal) {
            self.expression();
        } else {
            self.emit_op(OpCode::None);
        }
        self.consume(TokenKind::Semicolon, "';' after the variable declaration");
        self.define_variable(name);
    }

    fn statement(&mut self) {
        if self.matches(TokenKind::Print) {
            self.expression();
            self.consume(TokenKind::Semicolon, "';' after the value");
            self.emit_op(OpCode::Print);
        } else if self.matches(TokenKind::For) {
            self.for_statement();
        } else if self.matches(TokenKind::If) {
            self.if_statement();
        } else if self.matches(TokenKind::Return) {
            self.return_statement();
        } else if self.matches(TokenKind::While) {
            self.while_statement();
        } else if self.matches(TokenKind::Break) || self.matches(TokenKind::Continue) {
            self.jump_statement();
        } else if self.matches(TokenKind::LeftBrace) {
            self.begin_scope();
            self.block();
            self.end_scope();
        } else {
            self.expression_statement_from(None);
        }
    }

    fn expression_statement_from(&mut self, prefix: Option<Prefix>) {
        match prefix {
            Some(prefix) => self.continue_expression(PREC_ASSIGNMENT, prefix),
            None => self.expression(),
        }
        self.consume(TokenKind::Semicolon, "';' after the expression");
        self.emit_op(OpCode::Pop);
    }

    fn return_statement(&mut self) {
        let keyword = self.previous;
        if self.state().kind == FunctionKind::Script {
            self.static_error(keyword, "'return' outside a function");
        }
        if self.matches(TokenKind::Semicolon) {
            self.emit_return();
            return;
        }
        if self.state().kind == FunctionKind::Initializer {
            self.static_error(keyword, "'init' cannot return a value");
        }
        self.expression();
        self.consume(TokenKind::Semicolon, "';' after the return value");
        self.emit_op(OpCode::Return);
    }

    fn jump_statement(&mut self) {
        let keyword = self.previous;
        let is_break = keyword.kind == TokenKind::Break;
        let target = self.state().loops.last().map(|l| {
            if is_break {
                (l.break_depth, None)
            } else {
                (l.continue_depth, l.continue_target)
            }
        });
        match target {
            None => {
                let message = format!("'{}' outside a loop", keyword.lexeme);
                self.static_error(keyword, &message);
            }
            Some((depth, continue_target)) => {
                self.pop_locals_deeper_than(depth);
                if is_break {
                    let jump = self.emit_jump(OpCode::Jump);
                    self.state().loops.last_mut().expect("a loop").breaks.push(jump);
                } else if let Some(start) = continue_target {
                    self.emit_loop(start);
                } else {
                    let jump = self.emit_jump(OpCode::Jump);
                    self.state().loops.last_mut().expect("a loop").continues.push(jump);
                }
            }
        }
        let what = format!("';' after '{}'", keyword.lexeme);
        self.consume(TokenKind::Semicolon, &what);
    }

    /// `{` declaration* `}`, in a scope of its own if `own_scope`. With no
    /// `{`, report it and compile no body.
    fn braced_block(&mut self, what: &str, own_scope: bool) {
        if !self.check(TokenKind::LeftBrace) {
            self.expected(what);
            return;
        }
        self.advance();
        if own_scope {
            self.begin_scope();
        }
        self.block();
        if own_scope {
            self.end_scope();
        }
    }

    fn if_statement(&mut self) {
        self.expression();
        let then_jump = self.emit_jump(OpCode::JumpUnless);
        self.braced_block("'{' after the condition", true);
        if self.matches(TokenKind::Else) {
            let else_jump = self.emit_jump(OpCode::Jump);
            self.patch_jump(then_jump);
            if self.matches(TokenKind::If) {
                self.if_statement();
            } else {
                self.braced_block("'{' or 'if' after 'else'", true);
            }
            self.patch_jump(else_jump);
        } else {
            self.patch_jump(then_jump);
        }
    }

    fn while_statement(&mut self) {
        let loop_start = self.chunk().code.len();
        self.expression();
        let exit_jump = self.emit_jump(OpCode::JumpUnless);
        let depth = self.state().scope_depth;
        self.state().loops.push(Loop {
            break_depth: depth,
            breaks: Vec::new(),
            continue_depth: depth,
            continue_target: Some(loop_start),
            continues: Vec::new(),
        });
        self.braced_block("'{' after the condition", true);
        self.emit_loop(loop_start);
        self.patch_jump(exit_jump);
        let lp = self.state().loops.pop().expect("a loop");
        for b in lp.breaks {
            self.patch_jump(b);
        }
    }

    /// `for x in a..b` and `for x in list`; see the TypeScript compiler
    /// for the shape of the code. Two hidden locals hold the counter and
    /// the end (or the list and the index); `x` is a fresh local each
    /// time round.
    fn for_statement(&mut self) {
        let keyword = self.previous;
        if self.check(TokenKind::LeftParen) {
            self.expected("a loop variable name after 'for'");
            self.skip_parentheses();
            self.braced_block("'{' before the loop body", true);
            return;
        }
        self.consume(TokenKind::Identifier, "a loop variable name after 'for'");
        let name = self.previous;
        self.consume(TokenKind::In, "'in' after the loop variable");
        self.begin_scope();
        let hidden_depth = self.state().scope_depth;
        self.expression();
        let first = self.state().locals.len() as u8;
        self.add_local(" first", keyword);
        self.mark_initialized();
        let is_range = self.matches(TokenKind::DotDot);
        if is_range {
            self.expression();
            self.emit_op_at(keyword.line, OpCode::IterRange);
        } else {
            self.emit_op_at(keyword.line, OpCode::IterList);
            let zero = self.make_constant(Value::Number(0.0));
            self.emit_constant_op(keyword.line, OpCode::Const, zero);
        }
        let second = self.state().locals.len() as u8;
        self.add_local(" second", keyword);
        self.mark_initialized();
        let counter = if is_range { first } else { second };

        let line = keyword.line;
        let loop_start = self.chunk().code.len();
        if is_range {
            self.emit_op_byte_at(line, OpCode::LoadLocal, first);
            self.emit_op_byte_at(line, OpCode::LoadLocal, second);
        } else {
            self.emit_op_byte_at(line, OpCode::LoadLocal, second);
            self.emit_op_byte_at(line, OpCode::LoadLocal, first);
            self.emit_op_at(line, OpCode::ListLen);
        }
        self.emit_op_at(line, OpCode::Lt);
        let exit_jump = self.emit_jump(OpCode::JumpUnless);
        self.begin_scope();
        self.emit_op_byte_at(line, OpCode::LoadLocal, first);
        if !is_range {
            self.emit_op_byte_at(line, OpCode::LoadLocal, second);
            self.emit_op_at(line, OpCode::IndexGet);
        }
        self.add_local(name.lexeme, name);
        self.mark_initialized();
        let continue_depth = self.state().scope_depth;
        self.state().loops.push(Loop {
            break_depth: hidden_depth,
            breaks: Vec::new(),
            continue_depth,
            continue_target: None,
            continues: Vec::new(),
        });
        self.braced_block("'{' before the loop body", true);
        let continues =
            std::mem::take(&mut self.state().loops.last_mut().expect("a loop").continues);
        for c in continues {
            self.patch_jump(c);
        }
        self.end_scope();
        self.emit_op_byte_at(line, OpCode::IncLocal, counter);
        self.emit_loop(loop_start);
        self.patch_jump(exit_jump);
        let lp = self.state().loops.pop().expect("a loop");
        for b in lp.breaks {
            self.patch_jump(b);
        }
        self.end_scope();
    }

    /// Skip a balanced `( ... )` group, starting at its `(`.
    fn skip_parentheses(&mut self) {
        let mut depth: i32 = 0;
        loop {
            if self.check(TokenKind::LeftParen) {
                depth += 1;
            } else if self.check(TokenKind::RightParen) {
                depth -= 1;
            }
            self.advance();
            if depth <= 0 || self.check(TokenKind::Eof) {
                break;
            }
        }
    }

    fn block(&mut self) {
        self.block_depth += 1;
        while !self.check(TokenKind::RightBrace) && !self.check(TokenKind::Eof) {
            self.declaration();
        }
        self.block_depth -= 1;
        self.consume(TokenKind::RightBrace, "'}' to close the block");
    }

    // ---- expressions: the Pratt parser ------------------------------------

    fn expression(&mut self) {
        self.parse_precedence(PREC_ASSIGNMENT);
    }

    /// Parse an expression whose operators bind at least as tightly as
    /// `precedence`: the heart of the Pratt parser.
    fn parse_precedence(&mut self, precedence: u8) {
        self.advance();
        let Some(prefix) = prefix_rule(self.previous.kind) else {
            let message =
                format!("expected an expression, found {}", self.previous.describe());
            self.error_at(self.previous, &message);
            return;
        };
        self.continue_expression(precedence, prefix);
    }

    /// Run a prefix rule for the token just consumed, then absorb infix
    /// operators.
    fn continue_expression(&mut self, precedence: u8, prefix: Prefix) {
        let can_assign = precedence <= PREC_ASSIGNMENT;
        self.prefix(prefix, can_assign);
        while precedence <= infix_precedence(self.current.kind) {
            self.advance();
            self.infix(self.previous, can_assign);
        }
        if can_assign && self.match_assign_op() {
            self.error("cannot assign to this expression");
        }
    }

    fn prefix(&mut self, prefix: Prefix, can_assign: bool) {
        let token = self.previous;
        match prefix {
            Prefix::Grouping => {
                self.expression();
                self.consume(TokenKind::RightParen, "')' after the expression");
            }
            Prefix::List => self.list(),
            Prefix::Unary => {
                self.parse_precedence(PREC_UNARY);
                let op =
                    if token.kind == TokenKind::Bang { OpCode::Not } else { OpCode::Neg };
                self.emit_op_at(token.line, op);
            }
            Prefix::Number => {
                let n: f64 =
                    token.lexeme.parse().expect("the scanner checked the digits");
                let constant = self.make_constant(Value::Number(n));
                self.emit_constant_op(token.line, OpCode::Const, constant);
            }
            Prefix::String => {
                let s = self.intern(&unescape(token.lexeme));
                let constant = self.make_constant(Value::String(s));
                self.emit_constant_op(token.line, OpCode::Const, constant);
            }
            Prefix::Literal(op) => self.emit_op(op),
            Prefix::Variable => self.named_variable(token, can_assign),
            Prefix::SelfKw => self.self_expression(),
            Prefix::Super => self.super_expression(),
            Prefix::New => self.new_expression(),
            Prefix::Fn => self.fn_rest(FunctionKind::Anonymous, "'(' after 'fn'"),
        }
    }

    fn infix(&mut self, op: Token<'src>, can_assign: bool) {
        match op.kind {
            TokenKind::LeftParen => {
                let argc = self.argument_list();
                self.emit_op_byte_at(op.line, OpCode::Call, argc);
            }
            TokenKind::Dot => self.dot(can_assign),
            TokenKind::LeftBracket => self.index(op, can_assign),
            TokenKind::AndAnd => {
                let end = self.emit_jump(OpCode::JumpUnlessKeep);
                self.emit_op(OpCode::Pop);
                self.parse_precedence(PREC_AND);
                self.patch_jump(end);
            }
            TokenKind::OrOr => {
                let end = self.emit_jump(OpCode::JumpIfKeep);
                self.emit_op(OpCode::Pop);
                self.parse_precedence(PREC_OR);
                self.patch_jump(end);
            }
            kind => {
                // Left-associative: the right side may only hold tighter operators.
                self.parse_precedence(infix_precedence(kind) + 1);
                self.emit_op_at(op.line, binary_op(kind));
            }
        }
    }

    fn list(&mut self) {
        let mut count: usize = 0;
        if !self.check(TokenKind::RightBracket) {
            loop {
                self.expression();
                count += 1;
                if count == 256 {
                    self.error("a list cannot have more than 255 elements");
                }
                if !self.matches(TokenKind::Comma) {
                    break;
                }
            }
        }
        self.consume(TokenKind::RightBracket, "']' after the list elements");
        let line = self.previous.line;
        self.emit_op_byte_at(line, OpCode::List, count.min(255) as u8);
    }

    fn argument_list(&mut self) -> u8 {
        let mut count: usize = 0;
        if !self.check(TokenKind::RightParen) {
            loop {
                self.expression();
                count += 1;
                if count == 256 {
                    self.error("a call cannot have more than 255 arguments");
                }
                if !self.matches(TokenKind::Comma) {
                    break;
                }
            }
        }
        self.consume(TokenKind::RightParen, "')' after the arguments");
        count.min(255) as u8
    }

    /// Emit a get or set of a variable, local, captured or global.
    fn emit_variable(&mut self, line: usize, op: OpCode, arg: u16) {
        if matches!(op, OpCode::LoadGlobal | OpCode::StoreGlobal) {
            self.emit_constant_op(line, op, arg);
        } else {
            self.emit_op_byte_at(line, op, arg as u8);
        }
    }

    fn named_variable(&mut self, name: Token<'src>, can_assign: bool) {
        let top = self.functions.len() - 1;
        let (get, set, arg) = if let Some(slot) = self.resolve_local(top, name) {
            (OpCode::LoadLocal, OpCode::StoreLocal, slot as u16)
        } else if let Some(index) = self.resolve_upvalue(top, name) {
            (OpCode::LoadUpvalue, OpCode::StoreUpvalue, u16::from(index))
        } else {
            let index = self.identifier_constant(name.lexeme);
            (OpCode::LoadGlobal, OpCode::StoreGlobal, index)
        };
        if can_assign && self.match_assign_op() {
            let op = self.previous;
            if op.kind != TokenKind::Equal {
                self.emit_variable(name.line, get, arg);
            }
            self.expression();
            if op.kind != TokenKind::Equal {
                self.emit_op_at(op.line, compound_op(op.kind));
            }
            self.emit_variable(name.line, set, arg);
        } else {
            self.emit_variable(name.line, get, arg);
        }
    }

    fn dot(&mut self, can_assign: bool) {
        self.consume(TokenKind::Identifier, "a property name after '.'");
        let name = self.previous;
        let constant = self.identifier_constant(name.lexeme);
        if can_assign && self.match_assign_op() {
            let op = self.previous;
            if op.kind != TokenKind::Equal {
                self.emit_op_at(name.line, OpCode::Dup);
                self.emit_constant_op(name.line, OpCode::GetProp, constant);
            }
            self.expression();
            if op.kind != TokenKind::Equal {
                self.emit_op_at(op.line, compound_op(op.kind));
            }
            self.emit_constant_op(name.line, OpCode::SetProp, constant);
        } else if self.matches(TokenKind::LeftParen) {
            let argc = self.argument_list();
            self.emit_constant_op(name.line, OpCode::Invoke, constant);
            self.emit_at(name.line, argc);
        } else {
            self.emit_constant_op(name.line, OpCode::GetProp, constant);
        }
    }

    fn index(&mut self, bracket: Token<'src>, can_assign: bool) {
        self.expression();
        self.consume(TokenKind::RightBracket, "']' after the index");
        if can_assign && self.match_assign_op() {
            let op = self.previous;
            if op.kind != TokenKind::Equal {
                self.emit_op_at(bracket.line, OpCode::Dup2);
                self.emit_op_at(bracket.line, OpCode::IndexGet);
            }
            self.expression();
            if op.kind != TokenKind::Equal {
                self.emit_op_at(op.line, compound_op(op.kind));
            }
            self.emit_op_at(bracket.line, OpCode::IndexSet);
        } else {
            self.emit_op_at(bracket.line, OpCode::IndexGet);
        }
    }

    fn self_expression(&mut self) {
        if self.classes.is_empty() {
            self.static_error(self.previous, "cannot use 'self' outside a method");
            self.emit_op(OpCode::None);
            return;
        }
        let token = Token::synthetic("self", self.previous.line);
        self.named_variable(token, false);
    }

    fn super_expression(&mut self) {
        let keyword = self.previous;
        let usable = match self.classes.last() {
            None => {
                self.static_error(keyword, "cannot use 'super' outside a method");
                false
            }
            Some(class) if !class.has_superclass => {
                let message =
                    "cannot use 'super' in a class that does not extend another";
                self.static_error(keyword, message);
                false
            }
            Some(_) => true,
        };
        self.consume(TokenKind::Dot, "'.' after 'super'");
        if !self.matches(TokenKind::Init) {
            self.consume(TokenKind::Identifier, "a method name after 'super.'");
        }
        let name = self.previous;
        let constant = self.identifier_constant(name.lexeme);
        if usable {
            self.named_variable(Token::synthetic("self", self.previous.line), false);
        }
        if self.matches(TokenKind::LeftParen) {
            let argc = self.argument_list();
            if usable {
                self.named_variable(Token::synthetic("super", self.previous.line), false);
                self.emit_constant_op(name.line, OpCode::InvokeSuper, constant);
                self.emit_at(name.line, argc);
            }
        } else if usable {
            self.named_variable(Token::synthetic("super", self.previous.line), false);
            self.emit_constant_op(name.line, OpCode::GetSuper, constant);
        }
    }

    fn new_expression(&mut self) {
        let keyword = self.previous;
        self.consume(TokenKind::Identifier, "a class name after 'new'");
        self.named_variable(self.previous, false);
        self.consume(TokenKind::LeftParen, "'(' after the class name");
        let argc = self.argument_list();
        self.emit_op_byte_at(keyword.line, OpCode::New, argc);
    }
}
