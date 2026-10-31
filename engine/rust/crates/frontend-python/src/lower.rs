//! Lowering Python to VIR (book chapter 115). The same IR as JavaScript:
//! records come from `@dataclass` constructor calls, collections from
//! lists, `append` is a push, `len(xs)` reads the length, `for i in
//! range(...)` is a counting loop and `for x in xs` an element loop. The
//! core analyses then work unchanged.
//!
//! Port of `lower.ts`. Instructions are emitted in exactly the reference's
//! order (arguments before callees, and so on), so value ids, phis and
//! therefore every analysis result are the same.

use std::collections::HashMap;

use indexmap::{IndexMap, IndexSet};
use viscosity_core::builder::{add_binding, FunctionBuilder};
use viscosity_vir::{
    BindingId, BindingKind, BlockId, Const, FuncId, Module, NodeRef, Op, SourceRef, Terminator, ValueId,
};

use crate::parser::{Ast, ConstValue, Kind, NodeId};

const MATH: &[&str] = &[
    "sqrt", "sin", "cos", "tan", "atan2", "exp", "log", "log10", "log2", "fabs", "floor", "ceil", "trunc", "pow",
    "hypot", "asin", "acos", "atan", "sinh", "cosh", "tanh",
];

/// A module-level `@dataclass` class with only annotated fields.
#[derive(Clone, Debug, PartialEq)]
pub struct Dataclass {
    pub name: String,
    pub fields: Vec<String>,
    /// Each field's default value, if it has one.
    pub defaults: Vec<Option<NodeId>>,
    pub node: NodeId,
}

impl Dataclass {
    /// The default of a field (by its first occurrence, as `indexOf`).
    pub fn default_of(&self, field: &str) -> Option<NodeId> {
        let k = self.fields.iter().position(|f| f == field)?;
        self.defaults[k]
    }
}

/// What lowering produces besides the module.
#[derive(Clone, Debug)]
pub struct PyLowered {
    pub ast: Ast,
    pub dataclasses: Vec<Dataclass>,
    /// The parent of every node (`None` for the root).
    pub parent: Vec<Option<NodeId>>,
    /// The dataclass (index into `dataclasses`) a `record.new` came from.
    pub record_class: HashMap<ValueId, usize>,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
enum BKind {
    Let,
    Param,
    Function,
    Class,
    Import,
}

#[derive(Clone, Debug)]
struct PyBinding {
    id: u32,
    name: String,
    owner: NodeId,
    kind: BKind,
    /// `mode === 'cell'`: explicit loads and stores instead of SSA.
    cell: bool,
    vir: Option<BindingId>,
    module: Option<String>,
}

/// SSA variable keys: `p<id>`, `range<start>`, `forin<start>`.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
enum Key {
    Var(u32),
    Range(u32),
    ForIn(u32),
}

fn is_literal_default(ast: &Ast, e: NodeId) -> bool {
    match ast.kind(e) {
        // An f-string is not a literal: it reads variables when it runs.
        Kind::Constant(ConstValue::Str { fstring: true, .. }) => false,
        Kind::Constant(_) => true,
        Kind::UnaryOp { op, operand } if op == "-" || op == "+" => {
            matches!(ast.kind(*operand), Kind::Constant(ConstValue::Int(_) | ConstValue::Float(_)))
        }
        _ => false,
    }
}

struct Lowerer<'a> {
    ast: &'a Ast,
    m: Module,
    bindings: Vec<PyBinding>,
    scopes: HashMap<NodeId, IndexMap<String, usize>>,
    enclosing: HashMap<NodeId, Option<NodeId>>,
    globals_decl: HashMap<NodeId, IndexSet<String>>,
    /// Functions in the order their scopes were collected.
    scope_order: Vec<NodeId>,
    /// How many statements bind each module-level name. A dataclass is
    /// only modelled when its class statement is the only one: after
    /// `P = Other`, a call `P(...)` may not construct the dataclass.
    module_defs: HashMap<String, u32>,
    dataclasses: Vec<Dataclass>,
    dc_by_name: HashMap<String, usize>,
    func_ids: HashMap<NodeId, FuncId>,
    record_class: HashMap<ValueId, usize>,
}

/// Per-function lowering state.
struct Cx {
    fb: FunctionBuilder<Key>,
    node: NodeId,
    /// (break target, continue target) of the enclosing loops.
    loops: Vec<(BlockId, BlockId)>,
}

pub fn lower_python(ast: Ast, source: &str) -> (Module, PyLowered) {
    let mut parent = vec![None; ast.nodes.len()];
    ast.walk(ast.root, &mut |n, p| {
        if p.is_some() {
            parent[n as usize] = p;
        }
    });
    let mut lw = Lowerer {
        ast: &ast,
        m: Module::new("python", source),
        bindings: Vec::new(),
        scopes: HashMap::new(),
        enclosing: HashMap::new(),
        globals_decl: HashMap::new(),
        scope_order: Vec::new(),
        module_defs: HashMap::new(),
        dataclasses: Vec::new(),
        dc_by_name: HashMap::new(),
        func_ids: HashMap::new(),
        record_class: HashMap::new(),
    };
    let module = ast.root;
    lw.collect_scope(module, None);
    lw.declare_globals();
    lw.find_dataclasses();
    lw.choose_modes();
    let main = lw.lower_fn(module, "<module>");
    lw.m.main = main;
    let Lowerer { m, dataclasses, record_class, .. } = lw;
    (m, PyLowered { ast, dataclasses, parent, record_class })
}

impl<'a> Lowerer<'a> {
    fn src(&self, n: NodeId) -> Option<SourceRef> {
        let node = self.ast.node(n);
        Some(SourceRef { node: NodeRef(n), start: node.start, end: node.end, line: node.line })
    }

    // ---- scopes -------------------------------------------------------------

    fn collect_scope(&mut self, f: NodeId, outer: Option<NodeId>) {
        let ast = self.ast;
        self.scopes.insert(f, IndexMap::new());
        self.enclosing.insert(f, outer);
        self.globals_decl.insert(f, IndexSet::new());
        self.scope_order.push(f);
        if let Kind::FunctionDef { params, .. } = ast.kind(f) {
            for &prm in params {
                self.add(f, ast.name_of(prm).expect("a name"), BKind::Param, None);
            }
        }
        let body = match ast.kind(f) {
            Kind::Module { body } | Kind::FunctionDef { body, .. } => body,
            _ => unreachable!("a scope"),
        };
        self.visit(f, body);
    }

    fn add(&mut self, f: NodeId, name: &str, kind: BKind, module: Option<String>) {
        if self.globals_decl[&f].contains(name) {
            return;
        }
        if f == self.ast.root {
            *self.module_defs.entry(name.to_string()).or_default() += 1;
        }
        if self.scopes[&f].contains_key(name) {
            return;
        }
        let id = self.bindings.len() as u32;
        self.bindings.push(PyBinding { id, name: name.to_string(), owner: f, kind, cell: false, vir: None, module });
        self.scopes.get_mut(&f).expect("a scope").insert(name.to_string(), id as usize);
    }

    fn visit(&mut self, f: NodeId, stmts: &[NodeId]) {
        let ast = self.ast;
        for &s in stmts {
            match ast.kind(s) {
                Kind::Global { names } => {
                    for &n in names {
                        let name = ast.name_of(n).expect("a name").to_string();
                        self.globals_decl.get_mut(&f).expect("a scope").insert(name);
                    }
                }
                Kind::Assign { target, .. } | Kind::AugAssign { target, .. } | Kind::AnnAssign { target, .. } => {
                    if let Some(name) = ast.name_of(*target) {
                        self.add(f, name, BKind::Let, None);
                    }
                }
                Kind::For { target, body, .. } => {
                    self.add(f, ast.name_of(*target).expect("a name"), BKind::Let, None);
                    self.visit(f, body);
                }
                Kind::If { body, orelse, .. } => {
                    self.visit(f, body);
                    self.visit(f, orelse);
                }
                Kind::While { body, .. } => self.visit(f, body),
                Kind::FunctionDef { name, .. } => {
                    self.add(f, name, BKind::Function, None);
                    self.collect_scope(s, Some(f));
                }
                Kind::ClassDef { name, .. } => self.add(f, name, BKind::Class, None),
                Kind::Import { names } => {
                    for &n in names {
                        let name = ast.name_of(n).expect("a name");
                        self.add(f, name, BKind::Import, Some(name.to_string()));
                    }
                }
                Kind::ImportFrom { names } => {
                    for &n in names {
                        self.add(f, ast.name_of(n).expect("a name"), BKind::Import, None);
                    }
                }
                _ => {}
            }
        }
    }

    /// A `global g` names a module variable even when the module itself
    /// never assigns `g` (a function may create it).
    fn declare_globals(&mut self) {
        let module = self.ast.root;
        for f in self.scope_order.clone() {
            for g in self.globals_decl[&f].clone() {
                // A function that declares `global g` may bind it.
                if f != module {
                    *self.module_defs.entry(g.clone()).or_default() += 1;
                }
                if !self.scopes[&module].contains_key(&g) {
                    let id = self.bindings.len() as u32;
                    self.bindings.push(PyBinding {
                        id,
                        name: g.clone(),
                        owner: module,
                        kind: BKind::Let,
                        cell: false,
                        vir: None,
                        module: None,
                    });
                    self.scopes.get_mut(&module).expect("the module scope").insert(g, id as usize);
                }
            }
        }
    }

    fn lookup(&self, f: NodeId, name: &str) -> Option<usize> {
        if self.globals_decl.get(&f).is_some_and(|g| g.contains(name)) {
            return self.scopes[&self.ast.root].get(name).copied();
        }
        let mut cur = Some(f);
        while let Some(fc) = cur {
            if let Some(&b) = self.scopes[&fc].get(name) {
                return Some(b);
            }
            cur = self.enclosing.get(&fc).copied().flatten();
        }
        None
    }

    /// Module-level `@dataclass` classes with only annotated fields.
    fn find_dataclasses(&mut self) {
        let ast = self.ast;
        let Kind::Module { body } = ast.kind(ast.root) else { unreachable!("a module") };
        for &s in body {
            let Kind::ClassDef { name, body: cbody } = ast.kind(s) else { continue };
            let is_dc = ast.node(s).decorators.iter().any(|&d| match ast.kind(d) {
                Kind::Name { id } => id == "dataclass",
                Kind::Attribute { attr, .. } => attr == "dataclass",
                _ => false,
            });
            if !is_dc {
                continue;
            }
            let mut fields = Vec::new();
            let mut defaults = Vec::new();
            let mut ok = true;
            for &b in cbody {
                match ast.kind(b) {
                    Kind::AnnAssign { target, value, .. } if ast.name_of(*target).is_some() => {
                        // Python evaluates a default once, when the class is
                        // defined; the emitter copies its text to each call
                        // site. That is only the same for literal constants,
                        // so anything else leaves the class unmodelled.
                        if value.is_some_and(|v| !is_literal_default(ast, v)) {
                            ok = false;
                        }
                        fields.push(ast.name_of(*target).expect("a name").to_string());
                        defaults.push(*value);
                    }
                    Kind::Pass => {}
                    Kind::Expr { value } if matches!(ast.kind(*value), Kind::Constant(ConstValue::Str { .. })) => {}
                    _ => ok = false,
                }
            }
            if ok && !fields.is_empty() && self.module_defs.get(name) == Some(&1) {
                let dc = Dataclass { name: name.clone(), fields, defaults, node: s };
                // `Map.set`: a later class of the same name replaces it.
                match self.dc_by_name.get(name) {
                    Some(&k) => self.dataclasses[k] = dc,
                    None => {
                        self.dc_by_name.insert(name.clone(), self.dataclasses.len());
                        self.dataclasses.push(dc);
                    }
                }
            }
        }
    }

    /// A binding is a cell (explicit loads and stores) if a different
    /// function touches it, or if it is ever bound to a list (a candidate
    /// collection).
    fn choose_modes(&mut self) {
        let ast = self.ast;
        let module = ast.root;
        let mut all_fns = Vec::new();
        ast.walk(module, &mut |n, _| {
            if matches!(ast.kind(n), Kind::FunctionDef { .. }) && self.scopes.contains_key(&n) {
                all_fns.push(n);
            }
        });
        for &f in std::iter::once(&module).chain(&all_fns) {
            let body = match ast.kind(f) {
                Kind::Module { body } | Kind::FunctionDef { body, .. } => body,
                _ => unreachable!("a scope"),
            };
            for &s in body {
                let mut cells = Vec::new();
                ast.walk(s, &mut |n, _| match ast.kind(n) {
                    Kind::Name { id } => {
                        if let Some(b) = self.lookup(f, id) {
                            if self.bindings[b].owner != f {
                                cells.push(b);
                            }
                        }
                    }
                    Kind::Assign { target, value } if matches!(ast.kind(*value), Kind::List { .. }) => {
                        if let Some(b) = ast.name_of(*target).and_then(|t| self.lookup(f, t)) {
                            cells.push(b);
                        }
                    }
                    _ => {}
                });
                for b in cells {
                    self.bindings[b].cell = true;
                }
            }
        }
        for &f in &all_fns {
            for g in &self.globals_decl[&f] {
                if let Some(&b) = self.scopes[&module].get(g) {
                    self.bindings[b].cell = true;
                }
            }
        }
    }

    // ---- functions ----------------------------------------------------------

    fn emit(&mut self, cx: &mut Cx, op: Op, args: Vec<ValueId>, note: Option<&str>, src: Option<SourceRef>) -> ValueId {
        cx.fb.emit(&mut self.m, op, args, note, src)
    }

    fn int_const(&mut self, cx: &mut Cx, value: f64, src: Option<SourceRef>) -> ValueId {
        self.emit(cx, Op::Const(Const::Number(value)), vec![], Some("int"), src)
    }

    fn vb(&mut self, b: usize) -> BindingId {
        if let Some(v) = self.bindings[b].vir {
            return v;
        }
        let pb = &self.bindings[b];
        let kind = match pb.kind {
            BKind::Let => BindingKind::Let,
            BKind::Param => BindingKind::Param,
            BKind::Function => BindingKind::Function,
            BKind::Class => BindingKind::Class,
            BKind::Import => BindingKind::Import,
        };
        let owner = self.func_ids.get(&pb.owner).copied();
        let name = pb.name.clone();
        let v = add_binding(&mut self.m, &name, kind, owner, None);
        self.bindings[b].vir = Some(v);
        v
    }

    fn read(&mut self, cx: &mut Cx, name: &str, src: Option<SourceRef>) -> ValueId {
        let Some(b) = self.lookup(cx.node, name) else {
            return self.emit(cx, Op::Opaque, vec![], Some(&format!("builtin {name}")), src);
        };
        if !self.bindings[b].cell {
            let key = Key::Var(self.bindings[b].id);
            return cx.fb.read(&mut self.m, &key);
        }
        let binding = self.vb(b);
        if self.bindings[b].owner != cx.node {
            cx.fb.func_mut(&mut self.m).captures.insert(binding);
        }
        self.emit(cx, Op::LoadBinding { binding }, vec![], None, src)
    }

    fn read_name(&mut self, cx: &mut Cx, n: NodeId) -> ValueId {
        let ast = self.ast;
        self.read(cx, ast.name_of(n).expect("a name"), self.src(n))
    }

    fn write(&mut self, cx: &mut Cx, name: &str, v: ValueId, at: NodeId) {
        let b = self.lookup(cx.node, name).expect("every written name has a binding");
        if !self.bindings[b].cell {
            let key = Key::Var(self.bindings[b].id);
            let cur = cx.fb.current;
            cx.fb.write_variable(key, cur, v);
            return;
        }
        let binding = self.vb(b);
        if self.bindings[b].owner != cx.node {
            cx.fb.func_mut(&mut self.m).captures.insert(binding);
        }
        let src = self.src(at);
        self.emit(cx, Op::StoreBinding { binding }, vec![v], None, src);
    }

    fn write_name(&mut self, cx: &mut Cx, n: NodeId, v: ValueId, at: NodeId) {
        let ast = self.ast;
        self.write(cx, ast.name_of(n).expect("a name"), v, at);
    }

    fn live(&mut self, cx: &mut Cx) {
        if cx.fb.terminated(&self.m) {
            let b = cx.fb.new_block(&mut self.m);
            cx.fb.switch_to(b);
        }
    }

    /// Reads of every resolvable name inside `n`, in preorder.
    fn names(&mut self, cx: &mut Cx, n: NodeId) -> Vec<ValueId> {
        let ast = self.ast;
        let mut found = Vec::new();
        ast.walk(n, &mut |x, _| {
            if let Kind::Name { id } = ast.kind(x) {
                if self.lookup(cx.node, id).is_some() {
                    found.push(x);
                }
            }
        });
        found.into_iter().map(|x| self.read_name(cx, x)).collect()
    }

    fn new_block(&mut self, cx: &mut Cx) -> BlockId {
        cx.fb.new_block(&mut self.m)
    }

    fn br(&mut self, cx: &mut Cx, b: BlockId) {
        cx.fb.br(&mut self.m, b);
    }

    fn seal(&mut self, cx: &mut Cx, b: BlockId) {
        cx.fb.seal(&mut self.m, b);
    }

    fn condbr(&mut self, cx: &mut Cx, cond: ValueId, then: BlockId, else_: BlockId, src: Option<SourceRef>) {
        cx.fb.terminate(&mut self.m, Terminator::CondBr { cond, then, else_, src });
    }

    fn lower_fn(&mut self, fn_node: NodeId, name: &str) -> FuncId {
        let ast = self.ast;
        let src = self.src(fn_node);
        let fb = FunctionBuilder::new(&mut self.m, name, src);
        self.func_ids.insert(fn_node, fb.func);
        let mut cx = Cx { fb, node: fn_node, loops: Vec::new() };
        let body = match ast.kind(fn_node) {
            Kind::Module { body } => body,
            Kind::FunctionDef { params, body, .. } => {
                for (i, &prm) in params.iter().enumerate() {
                    let src = self.src(prm);
                    let v = self.emit(&mut cx, Op::Param { index: i as u32 }, vec![], None, src);
                    cx.fb.func_mut(&mut self.m).params.push(v);
                    let b = self.lookup(fn_node, ast.name_of(prm).expect("a name")).expect("a parameter binding");
                    let pb = if self.bindings[b].cell { Some(self.vb(b)) } else { None };
                    cx.fb.func_mut(&mut self.m).param_bindings.push(pb);
                    self.write_name(&mut cx, prm, v, prm);
                }
                body
            }
            _ => unreachable!("a function"),
        };
        self.stmts(&mut cx, body);
        cx.fb.terminate(&mut self.m, Terminator::Return { value: None, src: None });
        cx.fb.finish(&mut self.m)
    }

    fn stmts(&mut self, cx: &mut Cx, list: &[NodeId]) {
        for &s in list {
            self.live(cx);
            self.stmt(cx, s);
        }
    }

    /// `for target in range(start, bound)`: a counting loop.
    fn counting(&mut self, cx: &mut Cx, target: NodeId, start: ValueId, bound: ValueId, body: &[NodeId], s: NodeId) {
        let key = Key::Range(self.ast.node(s).start);
        let cur = cx.fb.current;
        cx.fb.write_variable(key.clone(), cur, start);
        let head = self.new_block(cx);
        let body_b = self.new_block(cx);
        let cont = self.new_block(cx);
        let exit = self.new_block(cx);
        self.br(cx, head);
        cx.fb.switch_to(head);
        let i = cx.fb.read(&mut self.m, &key);
        let src = self.src(s);
        let cond = self.emit(cx, Op::Binop { operator: "<".into() }, vec![i, bound], None, src);
        self.condbr(cx, cond, body_b, exit, src);
        self.seal(cx, body_b);
        cx.fb.switch_to(body_b);
        let iv = cx.fb.read(&mut self.m, &key);
        self.write_name(cx, target, iv, target);
        cx.loops.push((exit, cont));
        self.stmts(cx, body);
        cx.loops.pop();
        self.br(cx, cont);
        self.seal(cx, cont);
        cx.fb.switch_to(cont);
        self.increment(cx, key);
        self.br(cx, head);
        self.seal(cx, head);
        self.seal(cx, exit);
        cx.fb.switch_to(exit);
    }

    /// `key = key + 1` at the end of a loop body (in the current block).
    fn increment(&mut self, cx: &mut Cx, key: Key) {
        let old = cx.fb.read(&mut self.m, &key);
        let one = self.int_const(cx, 1.0, None);
        let next = self.emit(cx, Op::Binop { operator: "+".into() }, vec![old, one], None, None);
        let cur = cx.fb.current;
        cx.fb.write_variable(key, cur, next);
    }

    fn stmt(&mut self, cx: &mut Cx, s: NodeId) {
        let ast = self.ast;
        match ast.kind(s) {
            Kind::Pass | Kind::Global { .. } => {}
            Kind::Expr { value } => {
                self.expr(cx, *value);
            }
            Kind::Import { names } | Kind::ImportFrom { names } => {
                for &n in names {
                    let src = self.src(n);
                    let v = self.emit(cx, Op::Opaque, vec![], Some("import"), src);
                    self.write_name(cx, n, v, s);
                }
            }
            Kind::Assign { target, value } => self.assign(cx, *target, *value, s),
            Kind::AnnAssign { target, value, .. } => {
                if let Some(value) = value {
                    self.assign(cx, *target, *value, s);
                }
            }
            Kind::AugAssign { target, op, value } => {
                let t = *target;
                let ssrc = self.src(s);
                let binop = Op::Binop { operator: op.clone() };
                match ast.kind(t) {
                    Kind::Name { .. } => {
                        let old = self.read_name(cx, t);
                        let val = self.expr(cx, *value);
                        let v = self.emit(cx, binop, vec![old, val], None, ssrc);
                        self.write_name(cx, t, v, s);
                    }
                    Kind::Attribute { value: obj_node, attr } => {
                        let obj = self.expr(cx, *obj_node);
                        let tsrc = self.src(t);
                        let old = self.emit(cx, Op::FieldGet { field: attr.clone() }, vec![obj], None, tsrc);
                        let val = self.expr(cx, *value);
                        let v = self.emit(cx, binop, vec![old, val], None, ssrc);
                        self.emit(cx, Op::FieldSet { field: attr.clone() }, vec![obj, v], None, ssrc);
                    }
                    Kind::Subscript { value: obj_node, index } => {
                        let obj = self.expr(cx, *obj_node);
                        let idx = self.expr(cx, *index);
                        let tsrc = self.src(t);
                        let old = self.emit(cx, Op::IndexGet, vec![obj, idx], None, tsrc);
                        let val = self.expr(cx, *value);
                        let v = self.emit(cx, binop, vec![old, val], None, ssrc);
                        self.emit(cx, Op::IndexSet, vec![obj, idx, v], None, ssrc);
                    }
                    _ => {
                        let args = self.names(cx, s);
                        self.emit(cx, Op::Opaque, args, Some("augmented assignment"), ssrc);
                    }
                }
            }
            Kind::Return { value } => {
                let v = value.map(|v| self.expr(cx, v));
                let src = self.src(s);
                cx.fb.terminate(&mut self.m, Terminator::Return { value: v, src });
            }
            Kind::If { test, body, orelse } => {
                let c = self.expr(cx, *test);
                let th = self.new_block(cx);
                let el = self.new_block(cx);
                let join = self.new_block(cx);
                let tsrc = self.src(*test);
                self.condbr(cx, c, th, el, tsrc);
                self.seal(cx, th);
                self.seal(cx, el);
                cx.fb.switch_to(th);
                self.stmts(cx, body);
                self.br(cx, join);
                cx.fb.switch_to(el);
                self.stmts(cx, orelse);
                self.br(cx, join);
                self.seal(cx, join);
                cx.fb.switch_to(join);
            }
            Kind::While { test, body } => {
                let head = self.new_block(cx);
                let body_b = self.new_block(cx);
                let exit = self.new_block(cx);
                self.br(cx, head);
                cx.fb.switch_to(head);
                let c = self.expr(cx, *test);
                let tsrc = self.src(*test);
                self.condbr(cx, c, body_b, exit, tsrc);
                self.seal(cx, body_b);
                cx.fb.switch_to(body_b);
                cx.loops.push((exit, head));
                self.stmts(cx, body);
                cx.loops.pop();
                self.br(cx, head);
                self.seal(cx, head);
                self.seal(cx, exit);
                cx.fb.switch_to(exit);
            }
            Kind::For { target, iter, body } => self.for_stmt(cx, s, *target, *iter, body),
            Kind::Break | Kind::Continue => {
                if let Some(&(break_to, continue_to)) = cx.loops.last() {
                    let to = if matches!(ast.kind(s), Kind::Break) { break_to } else { continue_to };
                    self.br(cx, to);
                }
            }
            Kind::FunctionDef { name, .. } => {
                let fid = self.lower_fn(s, name);
                let src = self.src(s);
                let c = self.emit(cx, Op::Closure { func: fid }, vec![], None, src);
                let b = self.lookup(cx.node, name).expect("a function binding");
                let declared = self.vb(b);
                self.m.functions[fid.index()].declared_as = Some(declared);
                self.bindings[b].cell = true;
                self.write(cx, name, c, s);
            }
            Kind::ClassDef { name, .. } => {
                let args = self.names(cx, s);
                let src = self.src(s);
                let v = self.emit(cx, Op::Opaque, args, Some("class"), src);
                self.write(cx, name, v, s);
            }
            other => {
                let args = self.names(cx, s);
                let src = self.src(s);
                self.emit(cx, Op::Opaque, args, Some(other.type_name()), src);
            }
        }
    }

    fn for_stmt(&mut self, cx: &mut Cx, s: NodeId, target: NodeId, it: NodeId, body: &[NodeId]) {
        let ast = self.ast;
        if let Kind::Call { func, args, keywords } = ast.kind(it) {
            let is_range = ast.name_of(*func) == Some("range")
                && self.lookup(cx.node, "range").is_none()
                && keywords.is_empty()
                && (1..=2).contains(&args.len());
            if is_range {
                let start = if args.len() == 2 {
                    self.expr(cx, args[0])
                } else {
                    let src = self.src(it);
                    self.int_const(cx, 0.0, src)
                };
                let bound = self.expr(cx, args[args.len() - 1]);
                self.counting(cx, target, start, bound, body, s);
                return;
            }
        }
        // for x in xs: an element loop over a list (or opaque iteration).
        let arr = self.expr(cx, it);
        let key = Key::ForIn(ast.node(s).start);
        let zero = self.int_const(cx, 0.0, None);
        let cur = cx.fb.current;
        cx.fb.write_variable(key.clone(), cur, zero);
        let head = self.new_block(cx);
        let body_b = self.new_block(cx);
        let cont = self.new_block(cx);
        let exit = self.new_block(cx);
        self.br(cx, head);
        cx.fb.switch_to(head);
        let i = cx.fb.read(&mut self.m, &key);
        let via_index = matches!(ast.kind(it), Kind::Name { .. });
        let src = self.src(s);
        let cond = if via_index {
            let len = self.emit(cx, Op::FieldGet { field: "length".into() }, vec![arr], None, src);
            self.emit(cx, Op::Binop { operator: "<".into() }, vec![i, len], None, src)
        } else {
            self.emit(cx, Op::Opaque, vec![arr], Some("iterator protocol"), src)
        };
        self.condbr(cx, cond, body_b, exit, src);
        self.seal(cx, body_b);
        cx.fb.switch_to(body_b);
        let el = if via_index {
            let iv = cx.fb.read(&mut self.m, &key);
            self.emit(cx, Op::IndexGet, vec![arr, iv], Some("for-of"), src)
        } else {
            self.emit(cx, Op::Opaque, vec![arr], Some("iterator value"), src)
        };
        self.write_name(cx, target, el, target);
        cx.loops.push((exit, cont));
        self.stmts(cx, body);
        cx.loops.pop();
        self.br(cx, cont);
        self.seal(cx, cont);
        cx.fb.switch_to(cont);
        self.increment(cx, key);
        self.br(cx, head);
        self.seal(cx, head);
        self.seal(cx, exit);
        cx.fb.switch_to(exit);
    }

    fn assign(&mut self, cx: &mut Cx, t: NodeId, value: NodeId, at: NodeId) {
        let ast = self.ast;
        let src = self.src(at);
        match ast.kind(t) {
            Kind::Name { .. } => {
                let v = self.expr(cx, value);
                self.write_name(cx, t, v, at);
            }
            Kind::Attribute { value: obj_node, attr } => {
                let obj = self.expr(cx, *obj_node);
                let v = self.expr(cx, value);
                self.emit(cx, Op::FieldSet { field: attr.clone() }, vec![obj, v], None, src);
            }
            Kind::Subscript { value: obj_node, index } => {
                let obj = self.expr(cx, *obj_node);
                let idx = self.expr(cx, *index);
                let v = self.expr(cx, value);
                self.emit(cx, Op::IndexSet, vec![obj, idx, v], None, src);
            }
            _ => {
                let mut args = vec![self.expr(cx, value)];
                args.extend(self.names(cx, t));
                self.emit(cx, Op::Opaque, args, Some("assignment target"), src);
            }
        }
    }

    fn expr(&mut self, cx: &mut Cx, e: NodeId) -> ValueId {
        let ast = self.ast;
        let src = self.src(e);
        match ast.kind(e) {
            Kind::Constant(c) => match c {
                ConstValue::Int(v) => self.emit(cx, Op::Const(Const::Number(*v)), vec![], Some("int"), src),
                ConstValue::Float(v) => self.emit(cx, Op::Const(Const::Number(*v)), vec![], Some("float"), src),
                ConstValue::Str { fstring: true, raw } => {
                    let args = self.fstring_names(cx, raw, e);
                    self.emit(cx, Op::Opaque, args, Some("f-string"), src)
                }
                ConstValue::Str { .. } => self.emit(cx, Op::Const(Const::Str("str".into())), vec![], Some("str"), src),
                ConstValue::Bool(b) => self.emit(cx, Op::Const(Const::Bool(*b)), vec![], Some("bool"), src),
                ConstValue::None => self.emit(cx, Op::Const(Const::Null), vec![], Some("none"), src),
            },
            Kind::Name { .. } => self.read_name(cx, e),
            Kind::BinOp { op, left, right } | Kind::Compare { op, left, right } => {
                let a = self.expr(cx, *left);
                let b = self.expr(cx, *right);
                self.emit(cx, Op::Binop { operator: op.clone() }, vec![a, b], None, src)
            }
            Kind::BoolOp { op, left, right } => {
                let a = self.expr(cx, *left);
                let b = self.expr(cx, *right);
                self.emit(cx, Op::Logical { operator: op.clone() }, vec![a, b], None, src)
            }
            Kind::UnaryOp { op, operand } => {
                let a = self.expr(cx, *operand);
                let operator = if op == "not" { "!".to_string() } else { op.clone() };
                self.emit(cx, Op::Unop { operator }, vec![a], None, src)
            }
            Kind::IfExp { test, body, orelse } => {
                let t = self.expr(cx, *test);
                let b = self.expr(cx, *body);
                let o = self.expr(cx, *orelse);
                self.emit(cx, Op::Select, vec![t, b, o], None, src)
            }
            Kind::Attribute { value, attr } => {
                let v = self.expr(cx, *value);
                self.emit(cx, Op::FieldGet { field: attr.clone() }, vec![v], None, src)
            }
            Kind::Subscript { value, index } => {
                let v = self.expr(cx, *value);
                let i = self.expr(cx, *index);
                self.emit(cx, Op::IndexGet, vec![v, i], None, src)
            }
            Kind::List { elts } => {
                if elts.is_empty() {
                    self.emit(cx, Op::ArrayEmpty, vec![], None, src)
                } else {
                    let args = elts.iter().map(|&x| self.expr(cx, x)).collect();
                    self.emit(cx, Op::ArrayNew, args, None, src)
                }
            }
            Kind::Call { .. } => self.call(cx, e),
            other => {
                let args = self.names(cx, e);
                self.emit(cx, Op::Opaque, args, Some(other.type_name()), src)
            }
        }
    }

    /// The variables an f-string reads: every identifier inside `{...}`
    /// (`/\{([^{}]*)\}/g`, then `/[A-Za-z_]\w*/g`) that resolves.
    fn fstring_names(&mut self, cx: &mut Cx, raw: &str, e: NodeId) -> Vec<ValueId> {
        let s = raw.as_bytes();
        let mut idents = Vec::new();
        let mut i = 0;
        while i < s.len() {
            if s[i] != b'{' {
                i += 1;
                continue;
            }
            let mut j = i + 1;
            while j < s.len() && s[j] != b'{' && s[j] != b'}' {
                j += 1;
            }
            if j >= s.len() || s[j] != b'}' {
                i += 1;
                continue;
            }
            let inner = &s[i + 1..j];
            let mut k = 0;
            while k < inner.len() {
                if inner[k].is_ascii_alphabetic() || inner[k] == b'_' {
                    let st = k;
                    while k < inner.len() && (inner[k].is_ascii_alphanumeric() || inner[k] == b'_') {
                        k += 1;
                    }
                    idents.push(String::from_utf8_lossy(&inner[st..k]).into_owned());
                } else {
                    k += 1;
                }
            }
            i = j + 1;
        }
        let src = self.src(e);
        let mut out = Vec::new();
        for id in idents {
            if self.lookup(cx.node, &id).is_some() {
                out.push(self.read(cx, &id, src));
            }
        }
        out
    }

    fn call(&mut self, cx: &mut Cx, e: NodeId) -> ValueId {
        let ast = self.ast;
        let Kind::Call { func: f, args, keywords } = ast.kind(e) else { unreachable!("a call") };
        let f = *f;
        let src = self.src(e);
        let fname = ast.name_of(f);
        let node = cx.node;
        let builtin = |lw: &Self, n: &str| fname == Some(n) && lw.lookup(node, n).is_none();
        if let Some(&dci) = fname.and_then(|n| self.dc_by_name.get(n)) {
            let module = ast.root;
            if self.lookup(cx.node, fname.expect("a name")).is_some_and(|b| self.bindings[b].owner == module) {
                let dc = self.dataclasses[dci].clone();
                // Positional args, then keywords in field order; defaults
                // fill the rest.
                let mut ok = args.len() <= dc.fields.len();
                let rest = dc.fields.get(args.len()..).unwrap_or(&[]);
                let mut ki = 0;
                for field in rest {
                    if ki < keywords.len() && keywords[ki].0 == *field {
                        ki += 1;
                    } else if dc.default_of(field).is_none() {
                        ok = false;
                    }
                }
                if ki != keywords.len() {
                    ok = false;
                }
                if ok {
                    let mut vals: Vec<ValueId> = args.iter().map(|&a| self.expr(cx, a)).collect();
                    let mut k2 = 0;
                    for field in rest {
                        if k2 < keywords.len() && keywords[k2].0 == *field {
                            vals.push(self.expr(cx, keywords[k2].1));
                            k2 += 1;
                        } else {
                            let d = dc.default_of(field).expect("checked above");
                            vals.push(self.expr(cx, d));
                        }
                    }
                    let r = self.emit(cx, Op::RecordNew { fields: dc.fields.clone() }, vals, None, src);
                    self.record_class.insert(r, dci);
                    return r;
                }
            }
        }
        if builtin(self, "len") && args.len() == 1 && keywords.is_empty() {
            let a = self.expr(cx, args[0]);
            return self.emit(cx, Op::FieldGet { field: "length".into() }, vec![a], Some("len"), src);
        }
        if (builtin(self, "float") || builtin(self, "int")) && args.len() == 1 && keywords.is_empty() {
            let a = self.expr(cx, args[0]);
            let name = fname.expect("a name").to_string();
            return self.emit(cx, Op::Intrinsic { name }, vec![a], None, src);
        }
        if let Kind::Attribute { value, attr } = ast.kind(f) {
            if let Some(obj_name) = ast.name_of(*value) {
                if let Some(b) = self.lookup(cx.node, obj_name) {
                    let pb = &self.bindings[b];
                    if pb.kind == BKind::Import && pb.module.as_deref() == Some("math") && MATH.contains(&attr.as_str())
                    {
                        let vals = args.iter().map(|&a| self.expr(cx, a)).collect();
                        return self.emit(cx, Op::Intrinsic { name: format!("math.{attr}") }, vals, None, src);
                    }
                }
            }
            if attr == "append" && args.len() == 1 && keywords.is_empty() {
                let obj = self.expr(cx, *value);
                let a = self.expr(cx, args[0]);
                return self.emit(cx, Op::Push, vec![obj, a], None, src);
            }
        }
        let mut vals: Vec<ValueId> = args.iter().map(|&a| self.expr(cx, a)).collect();
        for &(_, v) in keywords {
            vals.push(self.expr(cx, v));
        }
        if let Kind::Attribute { value, attr } = ast.kind(f) {
            let obj = self.expr(cx, *value);
            let fsrc = self.src(f);
            let callee = self.emit(cx, Op::FieldGet { field: attr.clone() }, vec![obj], None, fsrc);
            let mut all = vec![callee, obj];
            all.extend(vals);
            return self.emit(cx, Op::Call, all, Some("method"), src);
        }
        let callee = self.expr(cx, f);
        let mut all = vec![callee];
        all.extend(vals);
        self.emit(cx, Op::Call, all, None, src)
    }
}
