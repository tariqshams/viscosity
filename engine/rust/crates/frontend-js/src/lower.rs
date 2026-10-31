//! Lowering JavaScript (oxc's AST) to VIR (book chapter 93).
//!
//! Each function becomes a VIR [`Func`](viscosity_vir::Func): a control-flow
//! graph in SSA form. Local variables that no closure captures become SSA
//! values. Captured variables, module-level variables used by inner
//! functions, variables assigned inside `try` blocks, and every variable
//! initialized with an array become explicit bindings
//! (`loadBinding`/`storeBinding`), so the analyses can see every read and
//! write of them.
//!
//! Anything the lowering does not model becomes an `opaque` instruction that
//! takes, as arguments, every variable its subtree mentions. Opaque means
//! "might do anything with these", so the analyses treat each as escaping.
//! That is how the front-end stays sound without understanding all of
//! JavaScript.
//!
//! This is a port of `lower.ts`. The reference walks ESTree; oxc's AST
//! splits some ESTree nodes (identifiers into references, bindings and
//! names; member expressions into computed, static and private; exports
//! into three kinds), so each case below names the ESTree shape it mirrors
//! where the mapping is not obvious.
//!
//! The emitter later needs a few facts about the syntax behind some
//! instructions (the object and index of `a[i]`, the values of an object
//! literal...). Instead of keeping the AST alive, the lowering records them
//! in a side table of [`JsNode`]s, referenced from each instruction's
//! [`SourceRef::node`](viscosity_vir::SourceRef).

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};

use indexmap::IndexMap;
use oxc_ast::ast::*;
use oxc_ast_visit::{walk, Visit};
use oxc_span::{GetSpan, Span};
use oxc_syntax::scope::ScopeFlags;
use viscosity_core::builder::{add_binding, FunctionBuilder};
use viscosity_core::CompileError;
use viscosity_vir::{
    BindingId, BindingKind, BlockId, Const, FuncId, Module, NodeRef, Op, SourceRef, Terminator, ValueId,
};

use crate::ast::{binding_pattern_names, expression_type, statement_type, target_names};
use crate::lines::LineIndex;
use crate::resolve::{FnKey, JsBindingId, JsKind, Resolution};

/// `Math` functions known to be pure and numeric.
const PURE_MATH: &[&str] = &[
    "abs", "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh", "cbrt", "ceil", "clz32", "cos", "cosh", "exp",
    "expm1", "floor", "fround", "hypot", "imul", "log", "log10", "log1p", "log2", "max", "min", "pow", "random",
    "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc",
];

/// What the emitter needs to know about the syntax node behind an
/// instruction. Entry 0 of the table is always [`JsNode::Plain`].
#[derive(Clone, Debug, PartialEq)]
pub enum JsNode {
    /// Nothing the emitter uses.
    Plain,
    /// `object[property]` or `object.property`.
    Member {
        object: Span,
        property: Span,
        /// The index is an identifier or a literal (safe to repeat).
        simple_property: bool,
        /// The index is a sequence expression (`a[(i, j)]`), whose span
        /// excludes its parentheses.
        sequence_property: bool,
        /// The expression is itself the object of a member expression
        /// (`a[i].x`), rather than stored somewhere (`const p = a[i]`).
        direct: bool,
    },
    /// An assignment or update whose target is a member expression;
    /// `operator` is the assignment operator (`=`, `+=`, ...), `None` for
    /// an update (`++`, `--`).
    Write { member: Span, object: Span, operator: Option<String> },
    /// An object literal: its property values.
    Object { values: Vec<Value> },
    /// A call; if its first argument is an object literal, that argument
    /// and its property values.
    Call { object_arg: Option<(Span, Vec<Value>)> },
    /// A `for (left of right)` loop; `binding` is the loop variable's name
    /// when it is a plain identifier.
    ForOf { left: Span, right: Span, binding: Option<String> },
}

/// A property value of an object literal, as the emitter splices it.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Value {
    pub span: Span,
    /// A sequence expression (`(a, b)`), which needs parentheses when it is
    /// spliced into an argument list (its span excludes them).
    pub is_sequence: bool,
}

impl Value {
    fn of(e: &Expression) -> Self {
        Value { span: e.span(), is_sequence: matches!(e, Expression::SequenceExpression(_)) }
    }
}

/// A lowered JavaScript module.
#[derive(Clone, Debug)]
pub struct Lowered {
    pub module: Module,
    /// The node facts referenced by `SourceRef::node`.
    pub nodes: Vec<JsNode>,
    /// The VIR binding of each JS binding that has one, in creation order.
    pub binding_of: IndexMap<JsBindingId, BindingId>,
    /// `ssa[b]`: is JS binding `b` lowered as SSA values?
    pub ssa: Vec<bool>,
}

/// The SSA variable key: a JS binding, or the hidden index of a `for...of`.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
enum VarKey {
    Binding(JsBindingId),
    ForOf(u32),
}

#[derive(Clone, Debug)]
struct LoopTargets {
    break_to: BlockId,
    continue_to: BlockId,
    label: Option<String>,
}

/// A function-like node: the program, a function or an arrow.
#[derive(Copy, Clone)]
enum FnNode<'b, 'a> {
    Program(&'b Program<'a>),
    Function(&'b Function<'a>),
    Arrow(&'b ArrowFunctionExpression<'a>),
}

impl FnNode<'_, '_> {
    fn key(&self) -> FnKey {
        match self {
            FnNode::Program(_) => FnKey::Program,
            FnNode::Function(f) => FnKey::Func(f.span),
            FnNode::Arrow(f) => FnKey::Func(f.span),
        }
    }

    fn span(&self) -> Span {
        match self {
            FnNode::Program(p) => p.span,
            FnNode::Function(f) => f.span,
            FnNode::Arrow(f) => f.span,
        }
    }
}

/// The per-function lowering state, saved and restored around nested
/// functions.
struct FnState {
    fb: FunctionBuilder<VarKey>,
    key: FnKey,
    loops: Vec<LoopTargets>,
    pending_label: Option<String>,
}

/// An assignable place (`readTarget` in the reference).
enum Place {
    Var { binding: JsBindingId, target: Span },
    Index { obj: ValueId, idx: ValueId, get_src: SourceRef },
    Field { obj: ValueId, field: String, get_src: SourceRef },
}

type R<T> = Result<T, CompileError>;

/// Lowers a resolved program to VIR.
pub fn lower(program: &Program, source: &str, lines: &LineIndex, res: &Resolution) -> R<Lowered> {
    // Decide SSA vs binding for every JS binding.
    let ssa = res
        .bindings
        .iter()
        .map(|b| {
            let captured_elsewhere = b.used_in.iter().any(|f| *f != b.owner);
            let simple = matches!(b.kind, JsKind::Const | JsKind::Let | JsKind::Var | JsKind::Param | JsKind::Catch);
            simple && !captured_elsewhere && !b.assigned_in_try && !b.array_init
        })
        .collect();
    let mut m = Module::new("javascript", source);
    // The program is the outermost function, `<module>`.
    let program_src = SourceRef {
        node: NodeRef(0),
        start: program.span.start,
        end: program.span.end,
        line: lines.line(program.span.start),
    };
    let fb = FunctionBuilder::new(&mut m, "<module>", Some(program_src));
    let main = fb.func;
    let mut l = Lowerer {
        lines,
        res,
        m,
        nodes: vec![JsNode::Plain],
        binding_of: IndexMap::new(),
        func_id_of: HashMap::from_iter([(FnKey::Program, main)]),
        ssa,
        f: FnState { fb, key: FnKey::Program, loops: Vec::new(), pending_label: None },
        direct: false,
    };
    l.lower_function_body(FnNode::Program(program))?;
    l.m.main = main;
    // Bindings for main's captured locals must be owned by main.
    for (&b, &id) in &l.binding_of {
        let owner = l.func_id_of.get(&res.binding(b).owner).copied();
        l.m.bindings[id.index()].owner = owner;
    }
    Ok(Lowered { module: l.m, nodes: l.nodes, binding_of: l.binding_of, ssa: l.ssa })
}

struct Lowerer<'s> {
    lines: &'s LineIndex,
    res: &'s Resolution,
    m: Module,
    nodes: Vec<JsNode>,
    binding_of: IndexMap<JsBindingId, BindingId>,
    func_id_of: HashMap<FnKey, FuncId>,
    ssa: Vec<bool>,
    f: FnState,
    /// Set just before lowering the object of a member expression, and
    /// consumed by the next `expr` call (the ESTree parent check of
    /// `emit.ts`: "is this node the object of a MemberExpression?").
    direct: bool,
}

impl<'s> Lowerer<'s> {
    // ---- small helpers --------------------------------------------------------

    fn src(&self, span: Span) -> SourceRef {
        SourceRef { node: NodeRef(0), start: span.start, end: span.end, line: self.lines.line(span.start) }
    }

    fn src_with(&mut self, span: Span, node: JsNode) -> SourceRef {
        self.nodes.push(node);
        SourceRef { node: NodeRef(self.nodes.len() as u32 - 1), ..self.src(span) }
    }

    fn emit(&mut self, op: Op, args: Vec<ValueId>, note: Option<&str>, src: Option<SourceRef>) -> ValueId {
        self.f.fb.emit(&mut self.m, op, args, note, src)
    }

    fn constant(&mut self, c: Const, src: Option<SourceRef>) -> ValueId {
        self.f.fb.constant(&mut self.m, c, src)
    }

    fn new_block(&mut self) -> BlockId {
        self.f.fb.new_block(&mut self.m)
    }

    fn seal(&mut self, b: BlockId) {
        self.f.fb.seal(&mut self.m, b);
    }

    fn br(&mut self, b: BlockId) {
        self.f.fb.br(&mut self.m, b);
    }

    fn terminate(&mut self, t: Terminator) {
        self.f.fb.terminate(&mut self.m, t);
    }

    fn switch_to(&mut self, b: BlockId) {
        self.f.fb.switch_to(b);
    }

    fn opaque(&mut self, args: Vec<ValueId>, note: &str, src: Option<SourceRef>) -> ValueId {
        self.emit(Op::Opaque, args, Some(note), src)
    }

    /// Keep lowering after a return/break: continue in a fresh, unreachable
    /// block.
    fn live(&mut self) {
        if self.f.fb.terminated(&self.m) {
            let b = self.new_block();
            self.switch_to(b);
        }
    }

    /// The binding an identifier resolved to. The reference crashes with a
    /// TypeError when there is none (reading `field` of `undefined`); so
    /// does the port, as an error.
    fn binding(&self, ident: Span, field: &str) -> R<JsBindingId> {
        self.res
            .refs
            .get(&ident)
            .copied()
            .ok_or_else(|| CompileError(format!("Cannot read properties of undefined (reading '{field}')")))
    }

    /// The VIR binding of JS binding `b`, created on first use.
    fn vb(&mut self, b: JsBindingId, owner: Option<FuncId>) -> BindingId {
        if let Some(&id) = self.binding_of.get(&b) {
            return id;
        }
        let jb = self.res.binding(b);
        let kind = match jb.kind {
            JsKind::Const => BindingKind::Const,
            JsKind::Let | JsKind::Catch => BindingKind::Let,
            JsKind::Var => BindingKind::Var,
            JsKind::Param => BindingKind::Param,
            JsKind::Function => BindingKind::Function,
            JsKind::Class => BindingKind::Class,
            JsKind::Import => BindingKind::Import,
            JsKind::Global => BindingKind::Global,
            JsKind::Using => BindingKind::Using,
        };
        let src = jb.decl.map(|d| self.src(d));
        let id = add_binding(&mut self.m, &jb.name, kind, owner, src);
        self.binding_of.insert(b, id);
        id
    }

    fn is_ssa(&self, b: JsBindingId) -> bool {
        self.ssa[b.0 as usize]
    }

    fn read(&mut self, b: JsBindingId, at: Span) -> ValueId {
        let jb = self.res.binding(b);
        if jb.kind == JsKind::Global {
            let c = match jb.name.as_str() {
                "undefined" => Some(Const::Undefined),
                "NaN" => Some(Const::Number(f64::NAN)),
                "Infinity" => Some(Const::Number(f64::INFINITY)),
                _ => None,
            };
            if let Some(c) = c {
                let src = self.src(at);
                return self.constant(c, Some(src));
            }
        }
        if self.is_ssa(b) {
            return self.f.fb.read(&mut self.m, &VarKey::Binding(b));
        }
        if jb.owner != self.f.key {
            let id = self.vb(b, None);
            self.m.functions[self.f.fb.func.index()].captures.insert(id);
        }
        let owner = self.func_id_of.get(&jb.owner).copied();
        let binding = self.vb(b, owner);
        let src = self.src(at);
        self.emit(Op::LoadBinding { binding }, vec![], None, Some(src))
    }

    fn write(&mut self, b: JsBindingId, v: ValueId, at: Span) {
        if self.is_ssa(b) {
            let cur = self.f.fb.current;
            self.f.fb.write_variable(VarKey::Binding(b), cur, v);
            return;
        }
        let jb = self.res.binding(b);
        if jb.owner != self.f.key {
            let id = self.vb(b, None);
            self.m.functions[self.f.fb.func.index()].captures.insert(id);
        }
        let owner = self.func_id_of.get(&jb.owner).copied();
        let binding = self.vb(b, owner);
        let src = self.src(at);
        self.emit(Op::StoreBinding { binding }, vec![v], None, Some(src));
    }

    /// Writes `v` to every name in `names` (destructuring targets).
    fn write_all(&mut self, names: &[Span], v: ValueId) -> R<()> {
        for &id in names {
            let b = self.binding(id, "owner")?;
            self.write(b, v, id);
        }
        Ok(())
    }

    /// Every variable a subtree mentions, read as values (the arguments of
    /// an opaque instruction). `visit` feeds the subtree to the collector.
    fn mentioned(&mut self, visit: impl FnOnce(&mut Mentions)) -> Vec<ValueId> {
        let mut c = Mentions::default();
        visit(&mut c);
        let mut out = Vec::new();
        let mut seen = HashSet::default();
        for (span, inner) in c.found {
            let Some(&b) = self.res.refs.get(&span) else {
                continue;
            };
            if self.res.binding(b).kind == JsKind::Global || !seen.insert(b) {
                continue;
            }
            // Inside a nested function the variable is captured: it is a
            // binding by construction, so read the binding.
            out.push(if inner && self.is_ssa(b) {
                self.f.fb.read(&mut self.m, &VarKey::Binding(b))
            } else {
                self.read(b, span)
            });
        }
        out
    }

    /// An opaque instruction for an unmodelled expression.
    fn opaque_expr(&mut self, e: &Expression, note: &str) -> ValueId {
        let args = self.mentioned(|c| c.visit_expression(e));
        let src = self.src(e.span());
        self.opaque(args, note, Some(src))
    }

    fn opaque_stmt(&mut self, s: &Statement, note: &str) -> ValueId {
        let args = self.mentioned(|c| c.visit_statement(s));
        let src = self.src(s.span());
        self.opaque(args, note, Some(src))
    }

    // ---- functions --------------------------------------------------------------

    fn lower_function(&mut self, node: FnNode, name: &str) -> R<FuncId> {
        let src = self.src(node.span());
        let fb = FunctionBuilder::new(&mut self.m, name, Some(src));
        let id = fb.func;
        let state = FnState { fb, key: node.key(), loops: Vec::new(), pending_label: None };
        let outer = std::mem::replace(&mut self.f, state);
        self.func_id_of.insert(node.key(), id);
        let result = self.lower_function_body(node);
        self.f = outer;
        result.map(|()| id)
    }

    fn lower_function_body(&mut self, node: FnNode) -> R<()> {
        // ---- parameters and hoisted function declarations -------------------
        let params = match node {
            FnNode::Program(_) => None,
            FnNode::Function(f) => Some(&*f.params),
            FnNode::Arrow(f) => Some(&*f.params),
        };
        if let Some(params) = params {
            for (i, p) in params.items.iter().enumerate() {
                let simple = match (&p.pattern, &p.initializer) {
                    (BindingPattern::BindingIdentifier(id), None) => Some(id.span),
                    _ => None,
                };
                self.param(i as u32, p.span, simple, &p.pattern, |c| c.visit_formal_parameter(p))?;
            }
            // A rest parameter is an ESTree RestElement: never a plain identifier.
            if let Some(rest) = &params.rest {
                let pattern = &rest.rest.argument;
                self.param(params.items.len() as u32, rest.span, None, pattern, |c| c.visit_binding_pattern(pattern))?;
            }
        }
        let (directives, body): (&[Directive], &[Statement]) = match node {
            FnNode::Program(p) => (&p.directives, &p.body),
            FnNode::Function(f) => match &f.body {
                Some(b) => (&b.directives, &b.statements),
                None => (&[], &[]),
            },
            FnNode::Arrow(f) => match &f.body {
                ArrowFunctionBody::FunctionBody(b) => (&b.directives, &b.statements),
                _ => (&[], &[]),
            },
        };
        self.hoist(body)?;

        // ---- body -----------------------------------------------------------
        let expression_body = match node {
            FnNode::Arrow(f) => f.body.as_expression(),
            _ => None,
        };
        if let Some(e) = expression_body {
            let v = self.expr(e)?;
            let src = self.src(e.span());
            self.terminate(Terminator::Return { value: Some(v), src: Some(src) });
        } else {
            self.directives(directives);
            self.stmts(body)?;
            self.terminate(Terminator::Return { value: None, src: None });
        }
        self.f.fb.finish(&mut self.m);
        Ok(())
    }

    /// One formal parameter. `simple` is the identifier of a plain `x`
    /// parameter (ESTree `Identifier`); anything else (a default, a
    /// destructuring pattern, a rest element) is lowered as an opaque value.
    fn param(
        &mut self,
        index: u32,
        span: Span,
        simple: Option<Span>,
        pattern: &BindingPattern,
        visit: impl FnOnce(&mut Mentions),
    ) -> R<()> {
        let src = self.src(span);
        let v = self.emit(Op::Param { index }, vec![], None, Some(src));
        let fid = self.f.fb.func;
        self.m.functions[fid.index()].params.push(v);
        if let Some(id) = simple {
            let b = self.binding(id, "owner")?;
            let pb = if self.is_ssa(b) { None } else { Some(self.vb(b, Some(fid))) };
            self.m.functions[fid.index()].param_bindings.push(pb);
            self.write(b, v, span);
            return Ok(());
        }
        self.m.functions[fid.index()].param_bindings.push(None);
        // Destructuring, default or rest parameter: the argument escapes.
        let mut args = vec![v];
        args.extend(self.mentioned(visit));
        let o = self.opaque(args, "parameter pattern", Some(src));
        let names: Vec<Span> = binding_pattern_names(pattern).iter().map(|id| id.span).collect();
        self.write_all(&names, o)
    }

    /// Lowers the function declarations of a statement list up front
    /// (JavaScript hoists them), storing each closure in its binding.
    fn hoist(&mut self, stmts: &[Statement]) -> R<()> {
        for s in stmts {
            if let Statement::ExportDefaultDeclaration(e) = s {
                if let ExportDefaultDeclarationKind::FunctionDeclaration(f) = &e.declaration {
                    if f.id.is_none() {
                        // `export default function () {}`: no binding; the
                        // closure escapes.
                        let fid = self.lower_function(FnNode::Function(f), "default")?;
                        let fsrc = self.src(f.span);
                        let c = self.emit(Op::Closure { func: fid }, vec![], None, Some(fsrc));
                        let src = self.src(e.span);
                        self.opaque(vec![c], "export", Some(src));
                        continue;
                    }
                }
            }
            let f = match s {
                Statement::FunctionDeclaration(f) => f,
                Statement::ExportDeclaration(e) => match &e.declaration {
                    Declaration::FunctionDeclaration(f) => f,
                    _ => continue,
                },
                Statement::ExportDefaultDeclaration(e) => match &e.declaration {
                    ExportDefaultDeclarationKind::FunctionDeclaration(f) => f,
                    _ => continue,
                },
                _ => continue,
            };
            let Some(id) = &f.id else { continue };
            let fid = self.lower_function(FnNode::Function(f), &id.name)?;
            let src = self.src(f.span);
            let c = self.emit(Op::Closure { func: fid }, vec![], None, Some(src));
            let b = self.binding(id.span, "owner")?;
            let own = self.f.fb.func;
            let declared = self.vb(b, Some(own));
            self.m.functions[fid.index()].declared_as = Some(declared);
            self.write(b, c, f.span);
        }
        Ok(())
    }

    // ---- statements ---------------------------------------------------------------

    /// ESTree keeps directives (`"use strict"`) as expression statements, so
    /// the reference lowers them as string constants. They produce no
    /// output, but they keep value numbering identical.
    fn directives(&mut self, ds: &[Directive]) {
        for d in ds {
            self.live();
            self.f.pending_label = None;
            let value = js_string(&d.expression.value);
            let src = self.src(d.expression.span);
            self.constant(Const::Str(value), Some(src));
        }
    }

    fn stmts(&mut self, list: &[Statement]) -> R<()> {
        for s in list {
            self.stmt(s)?;
        }
        Ok(())
    }

    fn lower_loop(
        &mut self,
        header: impl FnOnce(&mut Self) -> R<()>,
        test: Option<&Expression>,
        body: &Statement,
        update: Option<&Expression>,
        label: Option<String>,
    ) -> R<()> {
        let head = self.new_block();
        let body_b = self.new_block();
        let cont = self.new_block();
        let exit = self.new_block();
        self.br(head);
        self.switch_to(head);
        header(self)?;
        if let Some(test) = test {
            let c = self.expr(test)?;
            let src = self.src(test.span());
            self.terminate(Terminator::CondBr { cond: c, then: body_b, else_: exit, src: Some(src) });
        } else {
            self.br(body_b);
        }
        self.seal(body_b);
        self.switch_to(body_b);
        self.f.loops.push(LoopTargets { break_to: exit, continue_to: cont, label });
        self.stmt(body)?;
        self.f.loops.pop();
        self.br(cont);
        self.seal(cont);
        self.switch_to(cont);
        if let Some(u) = update {
            self.expr(u)?;
        }
        self.br(head);
        self.seal(head);
        self.seal(exit);
        self.switch_to(exit);
        Ok(())
    }

    fn declare(&mut self, d: &VariableDeclaration) -> R<()> {
        for decl in &d.declarations {
            if let BindingPattern::BindingIdentifier(id) = &decl.id {
                let b = self.binding(id.span, "owner")?;
                if let Some(init) = &decl.init {
                    let v = self.expr(init)?;
                    self.write(b, v, decl.span);
                } else if d.kind != VariableDeclarationKind::Var {
                    let src = self.src(decl.span);
                    let v = self.constant(Const::Undefined, Some(src));
                    self.write(b, v, decl.span);
                }
            } else {
                let v = match &decl.init {
                    Some(init) => self.expr(init)?,
                    None => self.constant(Const::Undefined, None),
                };
                let src = self.src(decl.span);
                let o = self.opaque(vec![v], "destructuring", Some(src));
                let names: Vec<Span> = binding_pattern_names(&decl.id).iter().map(|id| id.span).collect();
                self.write_all(&names, o)?;
            }
        }
        Ok(())
    }

    /// A block statement reached through another node (try, catch,
    /// finally), with the statement prologue of `stmt`.
    fn block(&mut self, b: &BlockStatement) -> R<()> {
        self.live();
        self.f.pending_label = None;
        self.hoist(&b.body)?;
        self.stmts(&b.body)
    }

    fn stmt(&mut self, s: &Statement) -> R<()> {
        self.live();
        let label = self.f.pending_label.take();
        match s {
            Statement::EmptyStatement(_) | Statement::FunctionDeclaration(_) | Statement::DebuggerStatement(_) => {}
            Statement::ExpressionStatement(e) => {
                self.expr(&e.expression)?;
            }
            Statement::VariableDeclaration(d) => self.declare(d)?,
            Statement::BlockStatement(b) => {
                self.hoist(&b.body)?;
                self.stmts(&b.body)?;
            }
            Statement::ReturnStatement(r) => {
                let value = match &r.argument {
                    Some(a) => Some(self.expr(a)?),
                    None => None,
                };
                let src = self.src(r.span);
                self.terminate(Terminator::Return { value, src: Some(src) });
            }
            Statement::ThrowStatement(t) => {
                let value = self.expr(&t.argument)?;
                let src = self.src(t.span);
                self.terminate(Terminator::Throw { value, src: Some(src) });
            }
            Statement::IfStatement(i) => {
                let c = self.expr(&i.test)?;
                let then_b = self.new_block();
                let else_b = self.new_block();
                let join = self.new_block();
                let src = self.src(i.test.span());
                self.terminate(Terminator::CondBr { cond: c, then: then_b, else_: else_b, src: Some(src) });
                self.seal(then_b);
                self.seal(else_b);
                self.switch_to(then_b);
                self.stmt(&i.consequent)?;
                self.br(join);
                self.switch_to(else_b);
                if let Some(alt) = &i.alternate {
                    self.stmt(alt)?;
                }
                self.br(join);
                self.seal(join);
                self.switch_to(join);
            }
            Statement::WhileStatement(w) => self.lower_loop(|_| Ok(()), Some(&w.test), &w.body, None, label)?,
            Statement::DoWhileStatement(d) => {
                let body_b = self.new_block();
                let cont = self.new_block();
                let exit = self.new_block();
                self.br(body_b);
                self.switch_to(body_b);
                self.f.loops.push(LoopTargets { break_to: exit, continue_to: cont, label });
                self.stmt(&d.body)?;
                self.f.loops.pop();
                self.br(cont);
                self.seal(cont);
                self.switch_to(cont);
                let c = self.expr(&d.test)?;
                let src = self.src(d.test.span());
                self.terminate(Terminator::CondBr { cond: c, then: body_b, else_: exit, src: Some(src) });
                self.seal(body_b);
                self.seal(exit);
                self.switch_to(exit);
            }
            Statement::ForStatement(f) => {
                match &f.init {
                    Some(ForStatementInit::VariableDeclaration(d)) => self.declare(d)?,
                    Some(init) => {
                        if let Some(e) = init.as_expression() {
                            self.expr(e)?;
                        }
                    }
                    None => {}
                }
                self.lower_loop(|_| Ok(()), f.test.as_ref(), &f.body, f.update.as_ref(), label)?;
            }
            Statement::ForOfStatement(f) => self.for_of(f, label)?,
            Statement::ForInStatement(f) => {
                let o = self.expr(&f.right)?;
                let names = for_left_names(&f.left);
                let span = f.span;
                self.lower_loop(
                    move |l| {
                        let src = l.src(span);
                        let k = l.opaque(vec![o], "for-in key", Some(src));
                        l.write_all(&names, k)
                    },
                    None,
                    &f.body,
                    None,
                    label,
                )?;
            }
            Statement::BreakStatement(b) => self.jump(s, b.label.as_ref(), true)?,
            Statement::ContinueStatement(c) => self.jump(s, c.label.as_ref(), false)?,
            Statement::LabeledStatement(l) => {
                self.f.pending_label = Some(l.label.name.to_string());
                self.stmt(&l.body)?;
            }
            Statement::TryStatement(t) => {
                // Bindings assigned inside try blocks are never SSA (see
                // resolve.rs), so approximating control flow here stays
                // sound for the analyses.
                self.block(&t.block)?;
                self.live();
                if let Some(h) = &t.handler {
                    if let Some(p) = &h.param {
                        let src = self.src(h.span);
                        let e = self.opaque(vec![], "caught exception", Some(src));
                        let names: Vec<Span> = binding_pattern_names(&p.pattern).iter().map(|id| id.span).collect();
                        self.write_all(&names, e)?;
                    }
                    self.block(&h.body)?;
                    self.live();
                }
                if let Some(fin) = &t.finalizer {
                    self.block(fin)?;
                }
            }
            Statement::SwitchStatement(sw) => {
                let d = self.expr(&sw.discriminant)?;
                let exit = self.new_block();
                let continue_to = self.f.loops.last().map_or(exit, |l| l.continue_to);
                self.f.loops.push(LoopTargets { break_to: exit, continue_to, label });
                // Model as: each case body may run (fall-through included).
                for c in &sw.cases {
                    if let Some(test) = &c.test {
                        let t = self.expr(test)?;
                        let src = self.src(c.span);
                        self.emit(Op::Binop { operator: "===".into() }, vec![d, t], None, Some(src));
                    }
                    let case_b = self.new_block();
                    let next = self.new_block();
                    let cond = self.opaque(vec![], "switch match", None);
                    self.terminate(Terminator::CondBr { cond, then: case_b, else_: next, src: None });
                    self.seal(case_b);
                    self.seal(next);
                    self.switch_to(case_b);
                    self.stmts(&c.consequent)?;
                    self.br(next);
                    self.switch_to(next);
                }
                self.f.loops.pop();
                self.br(exit);
                self.seal(exit);
                self.switch_to(exit);
            }
            Statement::ClassDeclaration(c) => self.class_declaration(c)?,
            Statement::ImportDeclaration(d) => {
                for sp in d.specifiers.iter().flatten() {
                    let src = self.src(sp.span());
                    let v = self.opaque(vec![], "import", Some(src));
                    let local = sp.local();
                    let b = self.binding(local.span, "owner")?;
                    self.write(b, v, local.span);
                }
            }
            // ESTree ExportNamedDeclaration with a declaration.
            Statement::ExportDeclaration(e) => {
                self.export_declaration(&e.declaration)?;
                // Exported bindings are visible to other modules: they escape.
                let ids: Vec<Span> = match &e.declaration {
                    Declaration::VariableDeclaration(d) => {
                        d.declarations.iter().flat_map(|d| binding_pattern_names(&d.id)).map(|id| id.span).collect()
                    }
                    Declaration::FunctionDeclaration(f) => f.id.iter().map(|id| id.span).collect(),
                    Declaration::ClassDeclaration(c) => c.id.iter().map(|id| id.span).collect(),
                    _ => vec![],
                };
                let mut args = Vec::new();
                for id in ids {
                    let b = self.binding(id, "kind")?;
                    args.push(self.read(b, id));
                }
                let src = self.src(e.span);
                self.opaque(args, "export", Some(src));
            }
            // ESTree ExportNamedDeclaration without a declaration or source.
            Statement::ExportNamedDeclaration(e) => {
                let mut args = Vec::new();
                for sp in &e.specifiers {
                    let span = sp.local.span();
                    let b = self.binding(span, "kind")?;
                    args.push(self.read(b, span));
                }
                let src = self.src(e.span);
                self.opaque(args, "export", Some(src));
            }
            // ESTree ExportNamedDeclaration with a source: nothing local.
            Statement::ExportFromDeclaration(_) | Statement::ExportAllDeclaration(_) => {}
            Statement::ExportDefaultDeclaration(e) => {
                let src = self.src(e.span);
                match &e.declaration {
                    ExportDefaultDeclarationKind::FunctionDeclaration(f) if f.id.is_some() => {
                        let id = f.id.as_ref().expect("checked").span;
                        let b = self.binding(id, "kind")?;
                        let v = self.read(b, id);
                        self.opaque(vec![v], "export", Some(src));
                    }
                    ExportDefaultDeclarationKind::ClassDeclaration(c) => {
                        self.live();
                        self.f.pending_label = None;
                        self.class_declaration(c)?;
                    }
                    // An anonymous default function is handled when hoisting.
                    ExportDefaultDeclarationKind::FunctionDeclaration(_) => {}
                    other => {
                        let v = match other.as_expression() {
                            Some(x) => self.expr(x)?,
                            None => self.opaque(vec![], "TSInterfaceDeclaration", Some(src)),
                        };
                        self.opaque(vec![v], "export", Some(src));
                    }
                }
            }
            other => {
                self.opaque_stmt(other, statement_type(other));
            }
        }
        Ok(())
    }

    /// `stmt(s.declaration)` of an export, with the statement prologue.
    fn export_declaration(&mut self, d: &Declaration) -> R<()> {
        self.live();
        self.f.pending_label = None;
        match d {
            Declaration::VariableDeclaration(v) => self.declare(v),
            Declaration::FunctionDeclaration(_) => Ok(()), // hoisted
            Declaration::ClassDeclaration(c) => self.class_declaration(c),
            _ => {
                let src = self.src(d.span());
                self.opaque(vec![], "TSDeclaration", Some(src));
                Ok(())
            }
        }
    }

    fn class_declaration(&mut self, c: &Class) -> R<()> {
        let args = self.mentioned(|m| m.visit_class(c));
        let src = self.src(c.span);
        let v = self.opaque(args, "class", Some(src));
        // `export default class {}` has no name.
        if let Some(id) = &c.id {
            let b = self.binding(id.span, "owner")?;
            self.write(b, v, id.span);
        }
        Ok(())
    }

    fn jump(&mut self, s: &Statement, label: Option<&LabelIdentifier>, is_break: bool) -> R<()> {
        let target = match label {
            Some(l) => self.f.loops.iter().rev().find(|t| t.label.as_deref() == Some(l.name.as_str())),
            None => self.f.loops.last(),
        }
        .cloned();
        match target {
            None => {
                self.opaque_stmt(s, "labelled jump");
            }
            Some(t) => self.br(if is_break { t.break_to } else { t.continue_to }),
        }
        Ok(())
    }

    /// `for (const p of arr) body` ==> an index loop over `arr` (chapter 93).
    fn for_of(&mut self, s: &ForOfStatement, label: Option<String>) -> R<()> {
        let arr = self.expr(&s.right)?;
        let idx_key = VarKey::ForOf(s.span.start);
        // The loop variable: the declarator's pattern, or the bare target.
        enum Decl<'b, 'a> {
            Pattern(&'b BindingPattern<'a>),
            Target(&'b AssignmentTarget<'a>),
        }
        let decl = match &s.left {
            ForStatementLeft::VariableDeclaration(d) => Decl::Pattern(&d.declarations[0].id),
            other => Decl::Target(other.as_assignment_target().expect("not a declaration")),
        };
        let (decl_ident, decl_span) = match &decl {
            Decl::Pattern(BindingPattern::BindingIdentifier(id)) => (Some((id.name.to_string(), id.span)), id.span),
            Decl::Pattern(p) => (None, p.span()),
            Decl::Target(AssignmentTarget::AssignmentTargetIdentifier(id)) => {
                (Some((id.name.to_string(), id.span)), id.span)
            }
            Decl::Target(t) => (None, t.span()),
        };
        let src = self.src_with(
            s.span,
            JsNode::ForOf {
                left: s.left.span(),
                right: s.right.span(),
                binding: decl_ident.as_ref().map(|d| d.0.clone()),
            },
        );
        let zero = self.constant(Const::Number(0.0), Some(src));
        let cur = self.f.fb.current;
        self.f.fb.write_variable(idx_key.clone(), cur, zero);
        let head = self.new_block();
        let body_b = self.new_block();
        let cont = self.new_block();
        let exit = self.new_block();
        self.br(head);
        self.switch_to(head);
        let i = self.f.fb.read(&mut self.m, &idx_key);
        let indexed = matches!(s.right, Expression::Identifier(_)) && !s.r#await;
        let len_test = if indexed {
            let len = self.emit(Op::FieldGet { field: "length".into() }, vec![arr], None, Some(src));
            self.emit(Op::Binop { operator: "<".into() }, vec![i, len], None, Some(src))
        } else {
            self.opaque(vec![arr], "iterator protocol", Some(src))
        };
        self.terminate(Terminator::CondBr { cond: len_test, then: body_b, else_: exit, src: Some(src) });
        self.seal(body_b);
        self.switch_to(body_b);
        let el = if indexed {
            let i = self.f.fb.read(&mut self.m, &idx_key);
            self.emit(Op::IndexGet, vec![arr, i], Some("for-of"), Some(src))
        } else {
            self.opaque(vec![arr], "iterator value", Some(src))
        };
        if let Some((_, span)) = decl_ident {
            let b = self.binding(span, "owner")?;
            self.write(b, el, span);
        } else {
            let dsrc = self.src(decl_span);
            let o = self.opaque(vec![el], "destructuring", Some(dsrc));
            let names = match decl {
                Decl::Pattern(p) => binding_pattern_names(p).iter().map(|id| id.span).collect(),
                Decl::Target(t) => {
                    let mut n = Vec::new();
                    target_names(t, &mut n);
                    n.into_iter().map(|(_, s)| s).collect::<Vec<_>>()
                }
            };
            self.write_all(&names, o)?;
        }
        self.f.loops.push(LoopTargets { break_to: exit, continue_to: cont, label });
        self.stmt(&s.body)?;
        self.f.loops.pop();
        self.br(cont);
        self.seal(cont);
        self.switch_to(cont);
        let one = self.constant(Const::Number(1.0), None);
        let i = self.f.fb.read(&mut self.m, &idx_key);
        let next = self.emit(Op::Binop { operator: "+".into() }, vec![i, one], None, None);
        self.f.fb.write_variable(idx_key, cont, next);
        self.br(head);
        self.seal(head);
        self.seal(exit);
        self.switch_to(exit);
        Ok(())
    }

    // ---- expressions --------------------------------------------------------------

    /// Lowers the object of a member expression.
    fn expr_object(&mut self, e: &Expression) -> R<ValueId> {
        self.direct = true;
        self.expr(e)
    }

    fn member_facts(&self, m: &MemberExpression, direct: bool) -> JsNode {
        let (property, simple_property, sequence_property) = match m {
            MemberExpression::ComputedMemberExpression(c) => (
                c.expression.span(),
                is_identifier_or_literal(&c.expression),
                matches!(c.expression, Expression::SequenceExpression(_)),
            ),
            MemberExpression::StaticMemberExpression(s) => (s.property.span, true, false),
            MemberExpression::PrivateFieldExpression(p) => (p.field.span, false, false),
        };
        JsNode::Member { object: m.object().span(), property, simple_property, sequence_property, direct }
    }

    fn write_facts(m: &MemberExpression, operator: Option<&str>) -> JsNode {
        JsNode::Write { member: m.span(), object: m.object().span(), operator: operator.map(str::to_string) }
    }

    /// `"assigns"` when the right-hand side of an assignment assigns or
    /// updates something (`rhsNote` in the reference): writes to SSA
    /// variables leave no instruction, but the emitter must know the
    /// right-hand side has an effect.
    fn rhs_note(rhs: Option<&Expression>) -> Option<&'static str> {
        #[derive(Default)]
        struct Assigns(bool);
        impl<'a> Visit<'a> for Assigns {
            fn visit_assignment_expression(&mut self, _: &AssignmentExpression<'a>) {
                self.0 = true;
            }
            fn visit_update_expression(&mut self, _: &UpdateExpression<'a>) {
                self.0 = true;
            }
        }
        let mut v = Assigns::default();
        if let Some(e) = rhs {
            v.visit_expression(e);
        }
        v.0.then_some("assigns")
    }

    /// The field name of a non-computed member (`p.x`; also `p.#x`, whose
    /// ESTree property is a PrivateIdentifier named `x`).
    ///
    /// NOTE: like the reference, assignment targets and method calls treat
    /// the private `p.#x` as the public field `x` (reads of `p.#x` are
    /// opaque). Only programs that would throw a TypeError at runtime can
    /// tell the difference, since object-literal records have no private
    /// fields. Kept for parity.
    fn field_name(m: &MemberExpression) -> Option<String> {
        match m {
            MemberExpression::StaticMemberExpression(s) => Some(s.property.name.to_string()),
            MemberExpression::PrivateFieldExpression(p) => Some(p.field.name.to_string()),
            MemberExpression::ComputedMemberExpression(_) => None,
        }
    }

    /// An assignable place for `target` (`readTarget`).
    fn place(&mut self, target: &SimpleAssignmentTarget) -> R<Option<Place>> {
        if let SimpleAssignmentTarget::AssignmentTargetIdentifier(id) = target {
            let binding = self.binding(id.span, "kind")?;
            return Ok(Some(Place::Var { binding, target: id.span }));
        }
        let Some(m) = target.as_member_expression() else {
            return Ok(None);
        };
        if m.optional() {
            return Ok(None);
        }
        let obj = self.expr_object(m.object())?;
        let facts = self.member_facts(m, false);
        if let MemberExpression::ComputedMemberExpression(c) = m {
            let idx = self.expr(&c.expression)?;
            let get_src = self.src_with(m.span(), facts);
            return Ok(Some(Place::Index { obj, idx, get_src }));
        }
        let get_src = self.src_with(m.span(), facts);
        Ok(Some(Place::Field { obj, field: Self::field_name(m).expect("non-computed"), get_src }))
    }

    fn place_get(&mut self, p: &Place) -> ValueId {
        match p {
            Place::Var { binding, target } => self.read(*binding, *target),
            Place::Index { obj, idx, get_src } => self.emit(Op::IndexGet, vec![*obj, *idx], None, Some(*get_src)),
            Place::Field { obj, field, get_src } => {
                self.emit(Op::FieldGet { field: field.clone() }, vec![*obj], None, Some(*get_src))
            }
        }
    }

    /// Stores `v` in place `p`; `assign` is the assignment's operator and
    /// right-hand side (`None` for an update).
    fn place_set(
        &mut self,
        p: &Place,
        v: ValueId,
        at: Span,
        target: &SimpleAssignmentTarget,
        assign: Option<(&str, &Expression)>,
    ) {
        let operator = assign.map(|(op, _)| op);
        let facts = target.as_member_expression().map_or(JsNode::Plain, |m| Self::write_facts(m, operator));
        match p {
            Place::Var { binding, .. } => self.write(*binding, v, at),
            Place::Index { obj, idx, .. } => {
                let src = self.src_with(at, facts);
                self.emit(Op::IndexSet, vec![*obj, *idx, v], None, Some(src));
            }
            Place::Field { obj, field, .. } => {
                let src = self.src_with(at, facts);
                let note = Self::rhs_note(assign.map(|(_, rhs)| rhs));
                self.emit(Op::FieldSet { field: field.clone() }, vec![*obj, v], note, Some(src));
            }
        }
    }

    /// `target = value` (`assignTo`).
    fn assign_to(&mut self, target: &AssignmentTarget, value: &Expression, at: Span) -> R<ValueId> {
        if let AssignmentTarget::AssignmentTargetIdentifier(id) = target {
            let v = self.expr(value)?;
            let b = self.binding(id.span, "owner")?;
            self.write(b, v, at);
            return Ok(v);
        }
        if let Some(m) = target.as_member_expression().filter(|m| !m.optional()) {
            let obj = self.expr_object(m.object())?;
            if let MemberExpression::ComputedMemberExpression(c) = m {
                let idx = self.expr(&c.expression)?;
                let v = self.expr(value)?;
                let src = self.src_with(at, Self::write_facts(m, Some("=")));
                self.emit(Op::IndexSet, vec![obj, idx, v], None, Some(src));
                return Ok(v);
            }
            let v = self.expr(value)?;
            let src = self.src_with(at, Self::write_facts(m, Some("=")));
            let field = Self::field_name(m).expect("non-computed");
            self.emit(Op::FieldSet { field }, vec![obj, v], Self::rhs_note(Some(value)), Some(src));
            return Ok(v);
        }
        // Destructuring assignment: everything involved escapes.
        let v = self.expr(value)?;
        let mut args = vec![v];
        args.extend(self.mentioned(|c| c.visit_assignment_target(target)));
        let src = self.src(at);
        let o = self.opaque(args, "destructuring", Some(src));
        let mut names = Vec::new();
        target_names(target, &mut names);
        let names: Vec<Span> = names.into_iter().map(|(_, s)| s).collect();
        self.write_all(&names, o)?;
        Ok(v)
    }

    fn arguments(&mut self, args: &[Argument]) -> R<Vec<ValueId>> {
        let mut out = Vec::with_capacity(args.len());
        for a in args {
            out.push(match a {
                Argument::SpreadElement(s) => self.expr(&s.argument)?,
                other => self.expr(other.to_expression())?,
            });
        }
        Ok(out)
    }

    fn expr(&mut self, e: &Expression) -> R<ValueId> {
        let direct = std::mem::take(&mut self.direct);
        let src = self.src(e.span());
        Ok(match e {
            Expression::BooleanLiteral(l) => self.constant(Const::Bool(l.value), Some(src)),
            Expression::NullLiteral(_) => self.constant(Const::Null, Some(src)),
            Expression::NumericLiteral(l) => self.constant(Const::Number(l.value), Some(src)),
            Expression::StringLiteral(l) => self.constant(Const::Str(js_string(&l.value)), Some(src)),
            Expression::BigIntLiteral(_) | Expression::RegExpLiteral(_) => self.opaque(vec![], "literal", Some(src)),
            Expression::Identifier(id) => {
                let b = self.binding(id.span, "kind")?;
                self.read(b, id.span)
            }
            Expression::TemplateLiteral(t) => {
                let mut vals = Vec::new();
                for x in &t.expressions {
                    vals.push(self.expr(x)?);
                }
                self.opaque(vals, "template", Some(src))
            }
            Expression::BinaryExpression(b) => {
                let l = self.expr(&b.left)?;
                let r = self.expr(&b.right)?;
                self.emit(Op::Binop { operator: b.operator.as_str().into() }, vec![l, r], None, Some(src))
            }
            // ESTree: a BinaryExpression whose left is a PrivateIdentifier,
            // which the reference lowers as an unmodelled node.
            Expression::PrivateInExpression(p) => {
                let lsrc = self.src(p.left.span);
                let l = self.opaque(vec![], "PrivateIdentifier", Some(lsrc));
                let r = self.expr(&p.right)?;
                self.emit(Op::Binop { operator: "in".into() }, vec![l, r], None, Some(src))
            }
            Expression::LogicalExpression(l) => {
                let a = self.expr(&l.left)?;
                let b = self.expr(&l.right)?;
                self.emit(Op::Logical { operator: l.operator.as_str().into() }, vec![a, b], None, Some(src))
            }
            Expression::UnaryExpression(u) => {
                if u.operator == UnaryOperator::Delete {
                    return Ok(self.opaque_expr(e, "delete"));
                }
                let a = self.expr(&u.argument)?;
                self.emit(Op::Unop { operator: u.operator.as_str().into() }, vec![a], None, Some(src))
            }
            Expression::UpdateExpression(u) => {
                let Some(t) = self.place(&u.argument)? else {
                    return Ok(self.opaque_expr(e, "update"));
                };
                let got = self.place_get(&t);
                let old = self.emit(Op::Unop { operator: "+".into() }, vec![got], None, Some(src)); // ToNumber
                let one = self.constant(Const::Number(1.0), None);
                let op = if u.operator == UpdateOperator::Increment { "+" } else { "-" };
                let next = self.emit(Op::Binop { operator: op.into() }, vec![old, one], None, Some(src));
                self.place_set(&t, next, u.span, &u.argument, None);
                if u.prefix {
                    next
                } else {
                    old
                }
            }
            Expression::AssignmentExpression(a) => {
                if a.operator == AssignmentOperator::Assign {
                    return self.assign_to(&a.left, &a.right, a.span);
                }
                let Some(simple) = a.left.as_simple_assignment_target() else {
                    return Ok(self.opaque_expr(e, "assignment"));
                };
                let Some(t) = self.place(simple)? else {
                    return Ok(self.opaque_expr(e, "assignment"));
                };
                let full = a.operator.as_str();
                let op = &full[..full.len() - 1];
                let got = self.place_get(&t);
                let r = self.expr(&a.right)?;
                let v = if matches!(op, "&&" | "||" | "??") {
                    self.emit(Op::Logical { operator: op.into() }, vec![got, r], None, Some(src))
                } else {
                    self.emit(Op::Binop { operator: op.into() }, vec![got, r], None, Some(src))
                };
                self.place_set(&t, v, a.span, simple, Some((full, &a.right)));
                v
            }
            Expression::ComputedMemberExpression(_)
            | Expression::StaticMemberExpression(_)
            | Expression::PrivateFieldExpression(_) => {
                let m = e.as_member_expression().expect("a member expression");
                if m.optional() {
                    return Ok(self.opaque_expr(e, "optional chain"));
                }
                let obj = self.expr_object(m.object())?;
                match m {
                    MemberExpression::ComputedMemberExpression(c) => {
                        let idx = self.expr(&c.expression)?;
                        let src = self.src_with(m.span(), self.member_facts(m, direct));
                        self.emit(Op::IndexGet, vec![obj, idx], None, Some(src))
                    }
                    MemberExpression::PrivateFieldExpression(_) => self.opaque(vec![obj], "private field", Some(src)),
                    MemberExpression::StaticMemberExpression(s) => {
                        let src = self.src_with(m.span(), self.member_facts(m, direct));
                        self.emit(Op::FieldGet { field: s.property.name.to_string() }, vec![obj], None, Some(src))
                    }
                }
            }
            Expression::ChainExpression(_) => self.opaque_expr(e, "optional chain"),
            Expression::CallExpression(c) => self.call(e, c, src)?,
            Expression::NewExpression(n) => {
                let mut args = vec![self.expr(&n.callee)?];
                args.extend(self.arguments(&n.arguments)?);
                self.opaque(args, "new", Some(src))
            }
            Expression::ObjectExpression(o) => {
                let mut fields: Vec<String> = Vec::new();
                let mut simple = true;
                for p in &o.properties {
                    let ObjectPropertyKind::ObjectProperty(p) = p else {
                        simple = false;
                        break;
                    };
                    if p.computed || p.kind != PropertyKind::Init || p.method {
                        simple = false;
                        break;
                    }
                    let k = match &p.key {
                        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
                        PropertyKey::StringLiteral(s) => Some(js_string(&s.value)),
                        _ => None,
                    };
                    match k {
                        Some(k) if !fields.contains(&k) => fields.push(k),
                        _ => {
                            simple = false;
                            break;
                        }
                    }
                }
                if !simple {
                    return Ok(self.opaque_expr(e, "object literal"));
                }
                let mut values = Vec::new();
                let mut spans = Vec::new();
                for p in &o.properties {
                    if let ObjectPropertyKind::ObjectProperty(p) = p {
                        values.push(self.expr(&p.value)?);
                        spans.push(Value::of(&p.value));
                    }
                }
                let src = self.src_with(o.span, JsNode::Object { values: spans });
                self.emit(Op::RecordNew { fields }, values, None, Some(src))
            }
            Expression::ArrayExpression(a) => {
                if a.elements
                    .iter()
                    .any(|x| matches!(x, ArrayExpressionElement::Elision(_) | ArrayExpressionElement::SpreadElement(_)))
                {
                    return Ok(self.opaque_expr(e, "array literal"));
                }
                if a.elements.is_empty() {
                    return Ok(self.emit(Op::ArrayEmpty, vec![], None, Some(src)));
                }
                let mut vals = Vec::new();
                for x in &a.elements {
                    vals.push(self.expr(x.to_expression())?);
                }
                self.emit(Op::ArrayNew, vals, None, Some(src))
            }
            Expression::FunctionExpression(f) => {
                let name = f.id.as_ref().map_or("(anonymous)".to_string(), |id| id.name.to_string());
                let fid = self.lower_function(FnNode::Function(f), &name)?;
                self.emit(Op::Closure { func: fid }, vec![], None, Some(src))
            }
            Expression::ArrowFunctionExpression(f) => {
                let fid = self.lower_function(FnNode::Arrow(f), "(anonymous)")?;
                self.emit(Op::Closure { func: fid }, vec![], None, Some(src))
            }
            Expression::ConditionalExpression(c) => {
                let t = self.expr(&c.test)?;
                let a = self.expr(&c.consequent)?;
                let b = self.expr(&c.alternate)?;
                self.emit(Op::Select, vec![t, a, b], None, Some(src))
            }
            Expression::SequenceExpression(s) => {
                let mut v = ValueId(0);
                for x in &s.expressions {
                    v = self.expr(x)?;
                }
                v
            }
            Expression::ParenthesizedExpression(p) => {
                self.direct = direct;
                self.expr(&p.expression)?
            }
            other => self.opaque_expr(other, expression_type(other)),
        })
    }

    fn call(&mut self, e: &Expression, c: &CallExpression, src: SourceRef) -> R<ValueId> {
        if c.optional || c.arguments.iter().any(|a| matches!(a, Argument::SpreadElement(_))) {
            return Ok(self.opaque_expr(e, "call"));
        }
        if let Some(m) = c.callee.as_member_expression().filter(|m| !m.is_computed() && !m.optional()) {
            let name = Self::field_name(m).expect("non-computed");
            // Math.sqrt(x) etc.: known pure numeric functions.
            if let Expression::Identifier(obj) = m.object() {
                let global = self.res.lookup(obj.span).is_some_and(|b| b.kind == JsKind::Global);
                if obj.name == "Math" && global && PURE_MATH.contains(&name.as_str()) {
                    let args = self.arguments(&c.arguments)?;
                    return Ok(self.emit(Op::Intrinsic { name: format!("Math.{name}") }, args, None, Some(src)));
                }
            }
            let obj = self.expr_object(m.object())?;
            if name == "push" {
                let mut args = vec![obj];
                args.extend(self.arguments(&c.arguments)?);
                let object_arg = match c.arguments.first() {
                    Some(Argument::ObjectExpression(o)) => Some((
                        o.span,
                        o.properties
                            .iter()
                            .filter_map(|p| match p {
                                ObjectPropertyKind::ObjectProperty(p) => Some(Value::of(&p.value)),
                                ObjectPropertyKind::SpreadProperty(_) => None,
                            })
                            .collect(),
                    )),
                    _ => None,
                };
                let src = self.src_with(c.span, JsNode::Call { object_arg });
                return Ok(self.emit(Op::Push, args, None, Some(src)));
            }
            // A method call: the receiver and the arguments flow into it.
            let fsrc = self.src_with(m.span(), self.member_facts(m, false));
            let f = self.emit(Op::FieldGet { field: name }, vec![obj], None, Some(fsrc));
            let mut args = vec![f, obj];
            args.extend(self.arguments(&c.arguments)?);
            return Ok(self.emit(Op::Call, args, Some("method"), Some(src)));
        }
        let f = self.expr(&c.callee)?;
        let mut args = vec![f];
        args.extend(self.arguments(&c.arguments)?);
        Ok(self.emit(Op::Call, args, None, Some(src)))
    }
}

/// The names declared or assigned by the left side of a `for...in`.
fn for_left_names(left: &ForStatementLeft) -> Vec<Span> {
    match left {
        ForStatementLeft::VariableDeclaration(d) => {
            binding_pattern_names(&d.declarations[0].id).iter().map(|id| id.span).collect()
        }
        other => {
            let mut n = Vec::new();
            if let Some(t) = other.as_assignment_target() {
                target_names(t, &mut n);
            }
            n.into_iter().map(|(_, s)| s).collect()
        }
    }
}

/// An ESTree `Identifier` or `Literal`.
fn is_identifier_or_literal(e: &Expression) -> bool {
    matches!(
        e,
        Expression::Identifier(_)
            | Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::NumericLiteral(_)
            | Expression::StringLiteral(_)
            | Expression::BigIntLiteral(_)
            | Expression::RegExpLiteral(_)
    )
}

/// A JavaScript string value as a Rust string. A lone surrogate (which Rust
/// strings cannot hold) becomes U+FFFD.
fn js_string(s: &oxc_str::JSStr) -> String {
    match s.as_str() {
        Some(s) => s.to_string(),
        None => char::decode_utf16(s.encode_utf16()).map(|c| c.unwrap_or('\u{FFFD}')).collect(),
    }
}

/// Collects the identifiers a subtree mentions, in source order, with
/// whether each is inside a nested function (`mentioned` in the reference).
/// Non-computed property keys and member properties are names, not
/// identifiers, in oxc, so they are skipped just as the reference skips them.
#[derive(Default)]
struct Mentions {
    found: Vec<(Span, bool)>,
    inner: bool,
}

impl<'a> Visit<'a> for Mentions {
    fn visit_identifier_reference(&mut self, it: &IdentifierReference<'a>) {
        self.found.push((it.span, self.inner));
    }

    fn visit_binding_identifier(&mut self, it: &BindingIdentifier<'a>) {
        self.found.push((it.span, self.inner));
    }

    fn visit_function(&mut self, it: &Function<'a>, flags: ScopeFlags) {
        let saved = std::mem::replace(&mut self.inner, true);
        walk::walk_function(self, it, flags);
        self.inner = saved;
    }

    fn visit_arrow_function_expression(&mut self, it: &ArrowFunctionExpression<'a>) {
        let saved = std::mem::replace(&mut self.inner, true);
        walk::walk_arrow_function_expression(self, it);
        self.inner = saved;
    }
}
