//! Parsing a Python subset (book chapter 114): the part of Python that
//! numeric, data-heavy code uses — functions, dataclass records, lists,
//! for/while/if, arithmetic and calls. Statements are recursive descent;
//! expressions use binding powers. Anything outside the subset is a clear
//! syntax error rather than a silent mis-parse.
//!
//! Port of `parser.ts`. The reference builds plain objects; here the nodes
//! live in an arena ([`Ast`]) and refer to each other by [`NodeId`].
//! [`Ast::children`] lists a node's children in the order the reference's
//! generic `walk` visits the object's keys.

use crate::tokens::{tokenize, PySyntaxError, Tok, TokType};

/// A node of the arena.
pub type NodeId = u32;

/// A constant's value and kind (`Constant.kind` in the reference).
#[derive(Clone, PartialEq, Debug)]
pub enum ConstValue {
    Int(f64),
    Float(f64),
    /// A string; the reference's value is the placeholder `'str'`.
    Str {
        fstring: bool,
        raw: String,
    },
    Bool(bool),
    None,
}

#[derive(Clone, PartialEq, Debug)]
pub enum Kind {
    Module { body: Vec<NodeId> },
    // statements
    FunctionDef { name: String, name_node: NodeId, params: Vec<NodeId>, body: Vec<NodeId> },
    ClassDef { name: String, body: Vec<NodeId> },
    If { test: NodeId, body: Vec<NodeId>, orelse: Vec<NodeId> },
    While { test: NodeId, body: Vec<NodeId> },
    For { target: NodeId, iter: NodeId, body: Vec<NodeId> },
    Pass,
    Break,
    Continue,
    Return { value: Option<NodeId> },
    Import { names: Vec<NodeId> },
    ImportFrom { names: Vec<NodeId> },
    Global { names: Vec<NodeId> },
    Assign { target: NodeId, value: NodeId },
    AugAssign { target: NodeId, op: String, value: NodeId },
    AnnAssign { target: NodeId, annotation: NodeId, value: Option<NodeId> },
    Expr { value: NodeId },
    // expressions
    IfExp { test: NodeId, body: NodeId, orelse: NodeId },
    BoolOp { op: String, left: NodeId, right: NodeId },
    Compare { op: String, left: NodeId, right: NodeId },
    BinOp { op: String, left: NodeId, right: NodeId },
    UnaryOp { op: String, operand: NodeId },
    Attribute { value: NodeId, attr: String },
    Subscript { value: NodeId, index: NodeId },
    Call { func: NodeId, args: Vec<NodeId>, keywords: Vec<(String, NodeId)> },
    Constant(ConstValue),
    Name { id: String },
    Tuple { elts: Vec<NodeId> },
    List { elts: Vec<NodeId> },
}

impl Kind {
    /// The reference's `type` string.
    pub fn type_name(&self) -> &'static str {
        match self {
            Kind::Module { .. } => "Module",
            Kind::FunctionDef { .. } => "FunctionDef",
            Kind::ClassDef { .. } => "ClassDef",
            Kind::If { .. } => "If",
            Kind::While { .. } => "While",
            Kind::For { .. } => "For",
            Kind::Pass => "Pass",
            Kind::Break => "Break",
            Kind::Continue => "Continue",
            Kind::Return { .. } => "Return",
            Kind::Import { .. } => "Import",
            Kind::ImportFrom { .. } => "ImportFrom",
            Kind::Global { .. } => "Global",
            Kind::Assign { .. } => "Assign",
            Kind::AugAssign { .. } => "AugAssign",
            Kind::AnnAssign { .. } => "AnnAssign",
            Kind::Expr { .. } => "Expr",
            Kind::IfExp { .. } => "IfExp",
            Kind::BoolOp { .. } => "BoolOp",
            Kind::Compare { .. } => "Compare",
            Kind::BinOp { .. } => "BinOp",
            Kind::UnaryOp { .. } => "UnaryOp",
            Kind::Attribute { .. } => "Attribute",
            Kind::Subscript { .. } => "Subscript",
            Kind::Call { .. } => "Call",
            Kind::Constant(_) => "Constant",
            Kind::Name { .. } => "Name",
            Kind::Tuple { .. } => "Tuple",
            Kind::List { .. } => "List",
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub struct Node {
    pub start: u32,
    pub end: u32,
    pub line: u32,
    pub kind: Kind,
    /// Decorators, outermost first. The reference's `walk` skips them.
    pub decorators: Vec<NodeId>,
}

/// A parsed module: the node arena and its root.
#[derive(Clone, PartialEq, Debug, Default)]
pub struct Ast {
    pub nodes: Vec<Node>,
    pub root: NodeId,
}

impl Ast {
    pub fn node(&self, id: NodeId) -> &Node {
        &self.nodes[id as usize]
    }

    pub fn kind(&self, id: NodeId) -> &Kind {
        &self.nodes[id as usize].kind
    }

    /// The name of a `Name` node.
    pub fn name_of(&self, id: NodeId) -> Option<&str> {
        match self.kind(id) {
            Kind::Name { id } => Some(id),
            _ => None,
        }
    }

    /// A node's children in the order the reference's `walk` visits them
    /// (the order of the object's keys; decorators are skipped).
    pub fn children(&self, id: NodeId) -> Vec<NodeId> {
        let mut out = Vec::new();
        match self.kind(id) {
            Kind::Module { body } | Kind::ClassDef { body, .. } => out.extend(body),
            Kind::FunctionDef { name_node, params, body, .. } => {
                out.push(*name_node);
                out.extend(params);
                out.extend(body);
            }
            Kind::If { test, body, orelse } => {
                out.push(*test);
                out.extend(body);
                out.extend(orelse);
            }
            Kind::While { test, body } => {
                out.push(*test);
                out.extend(body);
            }
            Kind::For { target, iter, body } => {
                out.extend([*target, *iter]);
                out.extend(body);
            }
            Kind::Pass | Kind::Break | Kind::Continue | Kind::Constant(_) | Kind::Name { .. } => {}
            Kind::Return { value } => out.extend(value),
            Kind::Import { names } | Kind::ImportFrom { names } | Kind::Global { names } => out.extend(names),
            Kind::Assign { target, value } | Kind::AugAssign { target, value, .. } => out.extend([*target, *value]),
            Kind::AnnAssign { target, annotation, value } => {
                out.extend([*target, *annotation]);
                out.extend(value);
            }
            Kind::Expr { value } => out.push(*value),
            Kind::IfExp { test, body, orelse } => out.extend([*test, *body, *orelse]),
            Kind::BoolOp { left, right, .. } | Kind::Compare { left, right, .. } | Kind::BinOp { left, right, .. } => {
                out.extend([*left, *right])
            }
            Kind::UnaryOp { operand, .. } => out.push(*operand),
            Kind::Attribute { value, .. } => out.push(*value),
            Kind::Subscript { value, index } => out.extend([*value, *index]),
            Kind::Call { func, args, keywords } => {
                out.push(*func);
                out.extend(args);
                out.extend(keywords.iter().map(|(_, v)| *v));
            }
            Kind::Tuple { elts } | Kind::List { elts } => out.extend(elts),
        }
        out
    }

    /// The reference's `walk`: `f(node, parent)` in preorder.
    pub fn walk(&self, id: NodeId, f: &mut impl FnMut(NodeId, Option<NodeId>)) {
        self.walk_from(id, None, f);
    }

    fn walk_from(&self, id: NodeId, parent: Option<NodeId>, f: &mut impl FnMut(NodeId, Option<NodeId>)) {
        f(id, parent);
        for c in self.children(id) {
            self.walk_from(c, Some(id), f);
        }
    }
}

/// Binding powers of the binary operators.
fn bin_bp(op: &str) -> Option<u8> {
    Some(match op {
        "or" => 1,
        "and" => 2,
        "<" | ">" | "==" | "!=" | "<=" | ">=" | "in" | "not in" | "is" | "is not" => 4,
        "|" => 5,
        "^" => 6,
        "&" => 7,
        "<<" | ">>" => 8,
        "+" | "-" => 9,
        "*" | "/" | "//" | "%" => 10,
        _ => return None,
    })
}

const AUG: &[&str] = &["+=", "-=", "*=", "/=", "//=", "%=", "**=", "&=", "|=", "^=", "<<=", ">>="];
const KEYWORDS: &[&str] = &[
    "def", "class", "return", "if", "elif", "else", "while", "for", "in", "not", "and", "or", "is", "pass", "break",
    "continue", "import", "from", "global", "True", "False", "None", "lambda", "yield", "with", "try", "except",
    "finally", "raise", "as", "del", "assert", "nonlocal", "async", "await",
];

type R<T> = Result<T, PySyntaxError>;

struct Parser<'s> {
    src: &'s str,
    toks: Vec<Tok>,
    p: usize,
    nodes: Vec<Node>,
}

pub fn parse_python(src: &str) -> R<Ast> {
    let toks = tokenize(src)?;
    let mut ps = Parser { src, toks, p: 0, nodes: Vec::new() };
    let mut body = Vec::new();
    while ps.peek(0).ty != TokType::Eof {
        body.extend(ps.statement()?);
    }
    let root =
        ps.add(Node { start: 0, end: src.len() as u32, line: 1, kind: Kind::Module { body }, decorators: vec![] });
    Ok(Ast { nodes: ps.nodes, root })
}

impl Parser<'_> {
    fn peek(&self, o: usize) -> &Tok {
        // The token list always ends with EOF, and nothing reads past it
        // more than one token ahead; clamp like an out-of-range read would
        // fail every comparison.
        let k = (self.p + o).min(self.toks.len() - 1);
        &self.toks[k]
    }

    fn is_op(&self, v: &str, o: usize) -> bool {
        let t = self.peek(o);
        t.ty == TokType::Op && t.value == v
    }

    fn is_kw(&self, v: &str, o: usize) -> bool {
        let t = self.peek(o);
        t.ty == TokType::Name && t.value == v
    }

    fn fail<T>(&self, m: &str) -> R<T> {
        let t = self.peek(0);
        let near = if t.value.is_empty() { String::new() } else { format!(" near '{}'", t.value) };
        Err(PySyntaxError(format!("{m} at line {}{near}", t.line)))
    }

    fn unsupported<T>(&self, what: &str) -> R<T> {
        self.fail(&format!("{what}: not supported by Viscosity's Python subset"))
    }

    fn op(&mut self, v: &str) -> R<()> {
        if self.is_op(v, 0) {
            self.p += 1;
            Ok(())
        } else {
            self.fail(&format!("expected '{v}'"))
        }
    }

    fn kw(&mut self, v: &str) -> R<()> {
        if self.is_kw(v, 0) {
            self.p += 1;
            Ok(())
        } else {
            self.fail(&format!("expected '{v}'"))
        }
    }

    fn add(&mut self, n: Node) -> NodeId {
        self.nodes.push(n);
        (self.nodes.len() - 1) as NodeId
    }

    /// A node from token `start` to the last consumed token.
    fn node(&mut self, start: (u32, u32), kind: Kind) -> NodeId {
        let end = self.toks[self.p - 1].end;
        self.add(Node { start: start.0, end, line: start.1, kind, decorators: vec![] })
    }

    /// The (start, line) of the next token.
    fn here(&self) -> (u32, u32) {
        let t = self.peek(0);
        (t.start, t.line)
    }

    fn name(&mut self) -> R<NodeId> {
        let t = self.peek(0).clone();
        if t.ty != TokType::Name || KEYWORDS.contains(&t.value.as_str()) {
            return self.fail("expected a name");
        }
        self.p += 1;
        Ok(self.add(Node {
            start: t.start,
            end: t.end,
            line: t.line,
            kind: Kind::Name { id: t.value },
            decorators: vec![],
        }))
    }

    fn name_str(&self, id: NodeId) -> String {
        match &self.nodes[id as usize].kind {
            Kind::Name { id } => id.clone(),
            _ => unreachable!("a Name node"),
        }
    }

    fn block(&mut self) -> R<Vec<NodeId>> {
        self.op(":")?;
        if self.peek(0).ty != TokType::Newline {
            return self.simple_line();
        }
        self.p += 1;
        if self.peek(0).ty != TokType::Indent {
            return self.fail("expected an indented block");
        }
        self.p += 1;
        let mut body = Vec::new();
        while self.peek(0).ty != TokType::Dedent && self.peek(0).ty != TokType::Eof {
            body.extend(self.statement()?);
        }
        self.p += 1;
        Ok(body)
    }

    fn simple_line(&mut self) -> R<Vec<NodeId>> {
        let mut out = vec![self.simple()?];
        while self.is_op(";", 0) {
            self.p += 1;
            if self.peek(0).ty == TokType::Newline {
                break;
            }
            out.push(self.simple()?);
        }
        let ty = self.peek(0).ty;
        if ty != TokType::Newline && ty != TokType::Eof {
            return self.fail("expected end of line");
        }
        if ty == TokType::Newline {
            self.p += 1;
        }
        Ok(out)
    }

    fn statement(&mut self) -> R<Vec<NodeId>> {
        let t = self.peek(0).clone();
        let at = (t.start, t.line);
        if t.ty == TokType::Op && t.value == "@" {
            self.p += 1;
            let dec = self.expr()?;
            if self.peek(0).ty != TokType::Newline {
                return self.fail("expected end of line after decorator");
            }
            self.p += 1;
            let inner = self.statement()?;
            let first = &mut self.nodes[inner[0] as usize];
            first.decorators.insert(0, dec);
            first.start = t.start;
            return Ok(inner);
        }
        if t.ty == TokType::Name {
            match t.value.as_str() {
                "def" => {
                    self.p += 1;
                    let nm = self.name()?;
                    self.op("(")?;
                    let mut params = Vec::new();
                    while !self.is_op(")", 0) {
                        let prm = self.name()?;
                        if self.is_op(":", 0) {
                            self.p += 1;
                            self.expr()?;
                        }
                        if self.is_op("=", 0) {
                            return self.unsupported("default parameter values");
                        }
                        params.push(prm);
                        if !self.is_op(")", 0) {
                            self.op(",")?;
                        }
                    }
                    self.p += 1;
                    if self.is_op("->", 0) {
                        self.p += 1;
                        self.expr()?;
                    }
                    let body = self.block()?;
                    let name = self.name_str(nm);
                    return Ok(vec![self.node(at, Kind::FunctionDef { name, name_node: nm, params, body })]);
                }
                "class" => {
                    self.p += 1;
                    let nm = self.name()?;
                    if self.is_op("(", 0) {
                        self.p += 1;
                        if !self.is_op(")", 0) {
                            return self.unsupported("base classes");
                        }
                        self.p += 1;
                    }
                    let body = self.block()?;
                    let name = self.name_str(nm);
                    return Ok(vec![self.node(at, Kind::ClassDef { name, body })]);
                }
                "if" => {
                    self.p += 1;
                    let test = self.expr()?;
                    let body = self.block()?;
                    let mut orelse = Vec::new();
                    if self.is_kw("elif", 0) {
                        // `elif` is parsed as a nested `if`.
                        self.toks[self.p].value = "if".into();
                        orelse = self.statement()?;
                    } else if self.is_kw("else", 0) {
                        self.p += 1;
                        orelse = self.block()?;
                    }
                    return Ok(vec![self.node(at, Kind::If { test, body, orelse })]);
                }
                "while" => {
                    self.p += 1;
                    let test = self.expr()?;
                    let body = self.block()?;
                    if self.is_kw("else", 0) {
                        return self.unsupported("while-else");
                    }
                    return Ok(vec![self.node(at, Kind::While { test, body })]);
                }
                "for" => {
                    self.p += 1;
                    let target = self.name()?;
                    self.kw("in")?;
                    let iter = self.expr()?;
                    let body = self.block()?;
                    if self.is_kw("else", 0) {
                        return self.unsupported("for-else");
                    }
                    return Ok(vec![self.node(at, Kind::For { target, iter, body })]);
                }
                "try" | "with" | "async" | "lambda" | "yield" => {
                    return self.unsupported(&format!("'{}'", t.value));
                }
                _ => {}
            }
        }
        self.simple_line()
    }

    fn simple(&mut self) -> R<NodeId> {
        let t = self.peek(0).clone();
        let at = (t.start, t.line);
        if t.ty == TokType::Name {
            match t.value.as_str() {
                "pass" => {
                    self.p += 1;
                    return Ok(self.node(at, Kind::Pass));
                }
                "break" => {
                    self.p += 1;
                    return Ok(self.node(at, Kind::Break));
                }
                "continue" => {
                    self.p += 1;
                    return Ok(self.node(at, Kind::Continue));
                }
                "return" => {
                    self.p += 1;
                    let value = if self.peek(0).ty == TokType::Newline || self.is_op(";", 0) {
                        None
                    } else {
                        Some(self.expr()?)
                    };
                    return Ok(self.node(at, Kind::Return { value }));
                }
                "import" => {
                    self.p += 1;
                    let mut names = vec![self.name()?];
                    while self.is_op(".", 0) {
                        self.p += 1;
                        self.name()?;
                    }
                    if self.is_kw("as", 0) {
                        return self.unsupported("import ... as");
                    }
                    while self.is_op(",", 0) {
                        self.p += 1;
                        names.push(self.name()?);
                    }
                    return Ok(self.node(at, Kind::Import { names }));
                }
                "from" => {
                    self.p += 1;
                    self.name()?;
                    while self.is_op(".", 0) {
                        self.p += 1;
                        self.name()?;
                    }
                    self.kw("import")?;
                    let mut names = vec![self.name()?];
                    while self.is_op(",", 0) {
                        self.p += 1;
                        names.push(self.name()?);
                    }
                    return Ok(self.node(at, Kind::ImportFrom { names }));
                }
                "global" => {
                    self.p += 1;
                    let mut names = vec![self.name()?];
                    while self.is_op(",", 0) {
                        self.p += 1;
                        names.push(self.name()?);
                    }
                    return Ok(self.node(at, Kind::Global { names }));
                }
                "del" | "raise" | "assert" | "nonlocal" => return self.unsupported(&format!("'{}'", t.value)),
                _ => {}
            }
        }
        let target = self.expr()?;
        if self.is_op("=", 0) {
            self.p += 1;
            let value = self.expr()?;
            if self.is_op("=", 0) {
                return self.unsupported("chained assignment");
            }
            return Ok(self.node(at, Kind::Assign { target, value }));
        }
        if self.peek(0).ty == TokType::Op && AUG.contains(&self.peek(0).value.as_str()) {
            let v = &self.toks[self.p].value;
            let op = v[..v.len() - 1].to_string();
            self.p += 1;
            let value = self.expr()?;
            return Ok(self.node(at, Kind::AugAssign { target, op, value }));
        }
        if self.is_op(":", 0) {
            // annotated assignment / declaration: x: float [= value]
            self.p += 1;
            let annotation = self.expr()?;
            let value = if self.is_op("=", 0) {
                self.p += 1;
                Some(self.expr()?)
            } else {
                None
            };
            return Ok(self.node(at, Kind::AnnAssign { target, annotation, value }));
        }
        Ok(self.node(at, Kind::Expr { value: target }))
    }

    // ---- expressions -------------------------------------------------------

    fn expr(&mut self) -> R<NodeId> {
        let at = self.here();
        let body = self.binary(0)?;
        if self.is_kw("if", 0) {
            self.p += 1;
            let test = self.binary(0)?;
            self.kw("else")?;
            let orelse = self.expr()?;
            return Ok(self.node(at, Kind::IfExp { test, body, orelse }));
        }
        Ok(body)
    }

    fn binop_at(&self) -> Option<&'static str> {
        let t = self.peek(0);
        if t.ty == TokType::Op {
            return OPS_BIN.iter().copied().find(|o| *o == t.value);
        }
        if t.ty == TokType::Name {
            if t.value == "not" && self.is_kw("in", 1) {
                return Some("not in");
            }
            if t.value == "is" && self.is_kw("not", 1) {
                return Some("is not");
            }
            return ["and", "or", "in", "is"].into_iter().find(|o| *o == t.value);
        }
        None
    }

    fn binary(&mut self, min_bp: u8) -> R<NodeId> {
        let at = self.here();
        let mut left = self.unary()?;
        while let Some(o) = self.binop_at() {
            let bp = bin_bp(o).expect("a binary operator");
            if bp <= min_bp {
                break;
            }
            self.p += if o.contains(' ') { 2 } else { 1 };
            let right = self.binary(bp)?;
            let op = o.to_string();
            left = if o == "and" || o == "or" {
                self.node(at, Kind::BoolOp { op, left, right })
            } else if bp == 4 {
                if matches!(self.nodes[left as usize].kind, Kind::Compare { .. }) {
                    return self.unsupported("chained comparisons");
                }
                self.node(at, Kind::Compare { op, left, right })
            } else {
                self.node(at, Kind::BinOp { op, left, right })
            };
        }
        Ok(left)
    }

    fn unary(&mut self) -> R<NodeId> {
        let t = self.peek(0).clone();
        let at = (t.start, t.line);
        if self.is_kw("not", 0) {
            self.p += 1;
            let operand = self.binary(3)?;
            return Ok(self.node(at, Kind::UnaryOp { op: "not".into(), operand }));
        }
        if self.is_op("-", 0) || self.is_op("+", 0) || self.is_op("~", 0) {
            self.p += 1;
            let operand = self.unary()?;
            return Ok(self.node(at, Kind::UnaryOp { op: t.value, operand }));
        }
        self.power()
    }

    fn power(&mut self) -> R<NodeId> {
        let at = self.here();
        let base = self.postfix()?;
        if self.is_op("**", 0) {
            self.p += 1;
            let right = self.unary()?; // right-associative
            return Ok(self.node(at, Kind::BinOp { op: "**".into(), left: base, right }));
        }
        Ok(base)
    }

    fn postfix(&mut self) -> R<NodeId> {
        let at = self.here();
        let mut e = self.atom()?;
        loop {
            if self.is_op(".", 0) {
                self.p += 1;
                let a = self.name()?;
                let attr = self.name_str(a);
                e = self.node(at, Kind::Attribute { value: e, attr });
            } else if self.is_op("[", 0) {
                self.p += 1;
                if self.is_op(":", 0) {
                    return self.unsupported("slices");
                }
                let index = self.expr()?;
                if self.is_op(":", 0) {
                    return self.unsupported("slices");
                }
                self.op("]")?;
                e = self.node(at, Kind::Subscript { value: e, index });
            } else if self.is_op("(", 0) {
                self.p += 1;
                let mut args = Vec::new();
                let mut keywords = Vec::new();
                while !self.is_op(")", 0) {
                    if self.is_op("*", 0) || self.is_op("**", 0) {
                        return self.unsupported("*args / **kwargs");
                    }
                    if self.peek(0).ty == TokType::Name && self.is_op("=", 1) {
                        let k = self.name()?;
                        self.p += 1;
                        let v = self.expr()?;
                        keywords.push((self.name_str(k), v));
                    } else {
                        if !keywords.is_empty() {
                            return self.fail("positional argument after keyword argument");
                        }
                        args.push(self.expr()?);
                    }
                    if !self.is_op(")", 0) {
                        self.op(",")?;
                    }
                }
                self.p += 1;
                e = self.node(at, Kind::Call { func: e, args, keywords });
            } else {
                return Ok(e);
            }
        }
    }

    fn atom(&mut self) -> R<NodeId> {
        let t = self.peek(0).clone();
        let at = (t.start, t.line);
        match t.ty {
            TokType::Num => {
                self.p += 1;
                let v = js_number_of_literal(&t.value.replace('_', ""));
                let c = if t.is_float { ConstValue::Float(v) } else { ConstValue::Int(v) };
                return Ok(self.node(at, Kind::Constant(c)));
            }
            TokType::Str => {
                self.p += 1;
                // Adjacent string literals concatenate.
                while self.peek(0).ty == TokType::Str {
                    self.p += 1;
                }
                let raw = self.src[t.start as usize..self.toks[self.p - 1].end as usize].to_string();
                return Ok(self.node(at, Kind::Constant(ConstValue::Str { fstring: t.fstring, raw })));
            }
            TokType::Name => {
                if t.value == "True" || t.value == "False" {
                    self.p += 1;
                    return Ok(self.node(at, Kind::Constant(ConstValue::Bool(t.value == "True"))));
                }
                if t.value == "None" {
                    self.p += 1;
                    return Ok(self.node(at, Kind::Constant(ConstValue::None)));
                }
                return self.name();
            }
            _ => {}
        }
        if self.is_op("(", 0) {
            self.p += 1;
            if self.is_op(")", 0) {
                self.p += 1;
                return Ok(self.node(at, Kind::Tuple { elts: vec![] }));
            }
            let e = self.expr()?;
            if self.is_op(",", 0) {
                let mut elts = vec![e];
                while self.is_op(",", 0) {
                    self.p += 1;
                    if self.is_op(")", 0) {
                        break;
                    }
                    elts.push(self.expr()?);
                }
                self.op(")")?;
                return Ok(self.node(at, Kind::Tuple { elts }));
            }
            self.op(")")?;
            return Ok(e);
        }
        if self.is_op("[", 0) {
            self.p += 1;
            let mut elts = Vec::new();
            while !self.is_op("]", 0) {
                elts.push(self.expr()?);
                if self.is_kw("for", 0) {
                    return self.unsupported("list comprehensions");
                }
                if !self.is_op("]", 0) {
                    self.op(",")?;
                }
            }
            self.p += 1;
            return Ok(self.node(at, Kind::List { elts }));
        }
        if self.is_op("{", 0) {
            return self.unsupported("dict and set literals");
        }
        self.fail("expected an expression")
    }
}

/// Operator tokens that are binary operators.
const OPS_BIN: &[&str] = &["<", ">", "==", "!=", "<=", ">=", "|", "^", "&", "<<", ">>", "+", "-", "*", "/", "//", "%"];

/// JavaScript's `Number(text)` for the numeric literals the tokenizer
/// produces (underscores already removed): decimal, `0x`/`0o`/`0b`.
pub fn js_number_of_literal(t: &str) -> f64 {
    let radix = |digits: &str, radix: u32| -> f64 {
        if digits.is_empty() || !digits.chars().all(|c| c.is_digit(radix)) {
            return f64::NAN;
        }
        // Exact for anything below 2^128, and rounded like JavaScript.
        match u128::from_str_radix(digits, radix) {
            Ok(v) => v as f64,
            Err(_) => digits.chars().fold(0.0, |acc, c| acc * radix as f64 + c.to_digit(radix).expect("digit") as f64),
        }
    };
    if t.len() >= 2 && t.as_bytes()[0] == b'0' {
        match t.as_bytes()[1] {
            b'x' | b'X' => return radix(&t[2..], 16),
            b'o' | b'O' => return radix(&t[2..], 8),
            b'b' | b'B' => return radix(&t[2..], 2),
            _ => {}
        }
    }
    // Decimal: digits, an optional fraction and an optional exponent
    // (`5.`, `.5` and `1e3` all parse; `1e` and `1e+` do not).
    t.parse::<f64>().unwrap_or(f64::NAN)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn literals_parse_like_javascript_number() {
        assert_eq!(js_number_of_literal("0x1F"), 31.0);
        assert_eq!(js_number_of_literal("0o17"), 15.0);
        assert_eq!(js_number_of_literal("0b101"), 5.0);
        assert_eq!(js_number_of_literal("5."), 5.0);
        assert_eq!(js_number_of_literal(".5"), 0.5);
        assert_eq!(js_number_of_literal("007"), 7.0);
        assert_eq!(js_number_of_literal("1e3"), 1000.0);
        assert!(js_number_of_literal("1e").is_nan());
        assert!(js_number_of_literal("0b12").is_nan());
        assert!(js_number_of_literal("0x").is_nan());
    }

    #[test]
    fn statements_and_precedence() {
        let ast = parse_python("x = a + b * c ** -d\nif x:\n    pass\nelif y:\n    pass\n").expect("parses");
        let Kind::Module { body } = ast.kind(ast.root) else { panic!() };
        assert_eq!(body.len(), 2);
        let Kind::If { orelse, .. } = ast.kind(body[1]) else { panic!() };
        assert!(matches!(ast.kind(orelse[0]), Kind::If { .. }));
        let Kind::Assign { value, .. } = ast.kind(body[0]) else { panic!() };
        let Kind::BinOp { op, right, .. } = ast.kind(*value) else { panic!() };
        assert_eq!(op, "+");
        assert!(matches!(ast.kind(*right), Kind::BinOp { op, .. } if op == "*"));
    }

    #[test]
    fn unsupported_syntax_is_an_error() {
        for src in ["xs = [x for x in y]\n", "try:\n    pass\n", "a < b < c\n", "d = {}\n", "def f(a=1):\n    pass\n"] {
            let e = parse_python(src).expect_err(src);
            assert!(e.0.contains("not supported"), "{src}: {e}");
        }
    }
}
