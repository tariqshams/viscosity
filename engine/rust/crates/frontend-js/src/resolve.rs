//! Scope analysis for JavaScript (book chapters 42 and 93): resolve every
//! identifier to the binding it refers to, and record which function each
//! reference occurs in, so lowering knows which variables closures capture.
//!
//! This is a port of `resolve.ts`, which walks ESTree. The walk here runs
//! over oxc's AST with [`Visit`]: the node kinds the reference treats
//! specially are overridden, and everything else falls through to oxc's
//! default traversal, which visits children in source order just like the
//! reference's generic `children()`.

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};

use oxc_ast::ast::*;
use oxc_ast_visit::{walk, Visit};
use oxc_span::Span;
use oxc_syntax::scope::ScopeFlags;
use viscosity_core::CompileError;

use crate::ast::{binding_pattern_names, is_array_init, simple_target_names, target_names};

/// Identifies a function (or the program): the scope owner of bindings.
#[derive(Copy, Clone, PartialEq, Eq, Hash, Debug)]
pub enum FnKey {
    Program,
    /// A function or arrow, by its span (spans of function nodes are unique).
    Func(Span),
}

#[derive(Copy, Clone, PartialEq, Eq, Hash, Debug, PartialOrd, Ord)]
pub struct JsBindingId(pub u32);

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum JsKind {
    Const,
    Let,
    Var,
    Param,
    Function,
    Class,
    Import,
    Global,
    Catch,
    Using,
}

/// A JavaScript binding: a declared (or implicitly global) name.
#[derive(Clone, Debug)]
pub struct JsBinding {
    pub id: JsBindingId,
    pub name: String,
    pub kind: JsKind,
    /// The function (or program) whose scope declares it.
    pub owner: FnKey,
    /// The declaring identifier.
    pub decl: Option<Span>,
    /// Functions (or the program) that reference it.
    pub used_in: HashSet<FnKey>,
    /// Assigned somewhere other than its declaration.
    pub reassigned: bool,
    /// Assigned inside a `try` block (SSA would be unsound across exception
    /// edges).
    pub assigned_in_try: bool,
    /// Initialized with an array literal or `new Array(...)`.
    pub array_init: bool,
}

/// The result of scope resolution.
#[derive(Clone, Debug, Default)]
pub struct Resolution {
    pub bindings: Vec<JsBinding>,
    /// Identifier span -> binding (references and declarations).
    pub refs: HashMap<Span, JsBindingId>,
}

impl Resolution {
    pub fn binding(&self, id: JsBindingId) -> &JsBinding {
        &self.bindings[id.0 as usize]
    }

    pub fn lookup(&self, ident: Span) -> Option<&JsBinding> {
        self.refs.get(&ident).map(|&b| self.binding(b))
    }
}

struct Scope {
    names: HashMap<String, JsBindingId>,
    parent: Option<usize>,
    fn_key: FnKey,
    is_function_scope: bool,
}

/// Resolves every identifier of `program`.
pub fn resolve_scopes(program: &Program) -> Result<Resolution, CompileError> {
    let mut r = Resolver {
        res: Resolution::default(),
        globals: HashMap::default(),
        scopes: vec![Scope {
            names: HashMap::default(),
            parent: None,
            fn_key: FnKey::Program,
            is_function_scope: true,
        }],
        scope: 0,
        fn_key: FnKey::Program,
        try_depth: 0,
        error: None,
    };
    // Program: hoisted names, then lexical names, then the statements.
    r.hoist_program(program);
    r.declare_lexical(&program.body);
    for s in &program.body {
        r.visit_statement(s);
    }
    match r.error {
        Some(e) => Err(e),
        None => Ok(r.res),
    }
}

struct Resolver {
    res: Resolution,
    globals: HashMap<String, JsBindingId>,
    scopes: Vec<Scope>,
    /// The current scope.
    scope: usize,
    /// The function the walk is in.
    fn_key: FnKey,
    try_depth: u32,
    /// The first failure (the reference throws a TypeError).
    error: Option<CompileError>,
}

/// A name declared by `var` or a function declaration, found by hoisting.
struct Hoisted {
    name: String,
    span: Span,
    kind: JsKind,
    array_init: bool,
}

impl Resolver {
    fn make(&mut self, name: &str, kind: JsKind, owner: FnKey, decl: Option<Span>, array_init: bool) -> JsBindingId {
        let id = JsBindingId(self.res.bindings.len() as u32);
        self.res.bindings.push(JsBinding {
            id,
            name: name.to_string(),
            kind,
            owner,
            decl,
            used_in: HashSet::default(),
            reassigned: false,
            assigned_in_try: false,
            array_init,
        });
        id
    }

    fn binding_mut(&mut self, id: JsBindingId) -> &mut JsBinding {
        &mut self.res.bindings[id.0 as usize]
    }

    fn push_scope(&mut self, fn_key: FnKey, is_function_scope: bool) -> usize {
        self.scopes.push(Scope { names: HashMap::default(), parent: Some(self.scope), fn_key, is_function_scope });
        self.scopes.len() - 1
    }

    /// Declares `name` in `scope` (or, for `var` and functions, in the
    /// nearest function scope). A function declaration always makes a new
    /// binding; anything else reuses an existing one of the same name.
    fn declare(&mut self, scope: usize, name: &str, span: Span, kind: JsKind, array_init: bool) {
        let mut target = scope;
        if matches!(kind, JsKind::Var | JsKind::Function) {
            while !self.scopes[target].is_function_scope {
                target = self.scopes[target].parent.expect("the root scope is a function scope");
            }
        }
        let existing = self.scopes[target].names.get(name).copied();
        let b = match existing {
            Some(b) if kind != JsKind::Function => b,
            _ => {
                let owner = self.scopes[target].fn_key;
                let b = self.make(name, kind, owner, Some(span), array_init);
                self.scopes[target].names.insert(name.to_string(), b);
                b
            }
        };
        self.res.refs.insert(span, b);
    }

    fn lookup(&mut self, name: &str) -> JsBindingId {
        let mut s = Some(self.scope);
        while let Some(i) = s {
            if let Some(&b) = self.scopes[i].names.get(name) {
                return b;
            }
            s = self.scopes[i].parent;
        }
        if let Some(&g) = self.globals.get(name) {
            return g;
        }
        let g = self.make(name, JsKind::Global, FnKey::Program, None, false);
        self.globals.insert(name.to_string(), g);
        g
    }

    // ---- hoisting --------------------------------------------------------------

    fn hoist_program(&mut self, program: &Program) {
        let mut h = HoistCollector::default();
        for s in &program.body {
            h.visit_statement(s);
        }
        self.declare_hoisted(h);
    }

    fn declare_hoisted(&mut self, h: HoistCollector) {
        for d in h.found {
            self.declare(self.scope, &d.name, d.span, d.kind, d.array_init);
        }
    }

    /// Declares block-scoped names (`let`, `const`, `class`, imports) at the
    /// start of a statement list.
    fn declare_lexical(&mut self, stmts: &[Statement]) {
        for s in stmts {
            match s {
                Statement::ExportDeclaration(e) => self.declare_lexical_declaration(&e.declaration),
                Statement::ExportDefaultDeclaration(e) => {
                    if let ExportDefaultDeclarationKind::ClassDeclaration(c) = &e.declaration {
                        if let Some(id) = &c.id {
                            self.declare(self.scope, &id.name, id.span, JsKind::Class, false);
                        }
                    }
                }
                Statement::ImportDeclaration(d) => {
                    for sp in d.specifiers.iter().flatten() {
                        let local = sp.local();
                        self.declare(self.scope, &local.name, local.span, JsKind::Import, false);
                    }
                }
                _ => {
                    if let Some(d) = s.as_declaration() {
                        self.declare_lexical_declaration(d);
                    }
                }
            }
        }
    }

    fn declare_lexical_declaration(&mut self, d: &Declaration) {
        match d {
            Declaration::VariableDeclaration(d) => self.declare_lexical_vars(d),
            Declaration::ClassDeclaration(c) => {
                if let Some(id) = &c.id {
                    self.declare(self.scope, &id.name, id.span, JsKind::Class, false);
                }
            }
            _ => {}
        }
    }

    fn declare_lexical_vars(&mut self, d: &VariableDeclaration) {
        let kind = match d.kind {
            VariableDeclarationKind::Var => return,
            VariableDeclarationKind::Let => JsKind::Let,
            VariableDeclarationKind::Const => JsKind::Const,
            VariableDeclarationKind::Using | VariableDeclarationKind::AwaitUsing => JsKind::Using,
        };
        for decl in &d.declarations {
            let array_init =
                matches!(decl.id, BindingPattern::BindingIdentifier(_)) && is_array_init(decl.init.as_ref());
            for id in binding_pattern_names(&decl.id) {
                self.declare(self.scope, &id.name, id.span, kind, array_init);
            }
        }
    }

    /// Walks the default expressions inside a binding pattern
    /// (`walkPatternDefaults`). Like the reference, it does not look inside
    /// array rest elements.
    fn walk_pattern_defaults(&mut self, p: &BindingPattern) {
        match p {
            BindingPattern::AssignmentPattern(a) => {
                self.visit_expression(&a.right);
                self.walk_pattern_defaults(&a.left);
            }
            BindingPattern::ObjectPattern(o) => {
                for q in &o.properties {
                    if q.computed {
                        self.visit_property_key(&q.key);
                    }
                    self.walk_pattern_defaults(&q.value);
                }
                if let Some(rest) = &o.rest {
                    self.walk_pattern_defaults(&rest.argument);
                }
            }
            BindingPattern::ArrayPattern(a) => {
                for e in a.elements.iter().flatten() {
                    self.walk_pattern_defaults(e);
                }
            }
            BindingPattern::BindingIdentifier(_) => {}
        }
    }

    fn walk_param_defaults(&mut self, params: &FormalParameters) {
        for p in &params.items {
            // An ESTree AssignmentPattern: the default first, then the pattern.
            if let Some(init) = &p.initializer {
                self.visit_expression(init);
            }
            self.walk_pattern_defaults(&p.pattern);
        }
        // (A rest parameter is an ESTree RestElement, which the reference
        // does not look into.)
    }

    /// The function case of the walk, shared by functions and arrows.
    fn walk_function_like(
        &mut self,
        key: FnKey,
        own_name: Option<&BindingIdentifier>,
        params: &FormalParameters,
        body: FunctionLikeBody,
    ) {
        let (saved_scope, saved_fn, saved_try) = (self.scope, self.fn_key, self.try_depth);
        let fscope = self.push_scope(key, true);
        self.scope = fscope;
        if let Some(id) = own_name {
            self.declare(fscope, &id.name, id.span, JsKind::Function, false);
        }
        for p in &params.items {
            for id in binding_pattern_names(&p.pattern) {
                self.declare(fscope, &id.name, id.span, JsKind::Param, false);
            }
        }
        if let Some(rest) = &params.rest {
            for id in binding_pattern_names(&rest.rest.argument) {
                self.declare(fscope, &id.name, id.span, JsKind::Param, false);
            }
        }
        let mut h = HoistCollector::default();
        match body {
            FunctionLikeBody::Block(b) => {
                for s in &b.statements {
                    h.visit_statement(s);
                }
            }
            FunctionLikeBody::Expression(e) => h.visit_children_of_expression(e),
        }
        self.declare_hoisted(h);
        self.try_depth = 0;
        self.fn_key = key;
        match body {
            FunctionLikeBody::Block(b) => {
                self.declare_lexical(&b.statements);
                for s in &b.statements {
                    self.visit_statement(s);
                }
            }
            FunctionLikeBody::Expression(e) => self.visit_expression(e),
        }
        self.walk_param_defaults(params);
        self.scope = saved_scope;
        self.fn_key = saved_fn;
        self.try_depth = saved_try;
    }

    fn with_block_scope(&mut self, f: impl FnOnce(&mut Self, usize)) {
        let saved = self.scope;
        let b = self.push_scope(self.fn_key, false);
        self.scope = b;
        f(self, b);
        self.scope = saved;
    }

    fn reference(&mut self, name: &str, span: Span) {
        let b = self.lookup(name);
        self.res.refs.insert(span, b);
        let fk = self.fn_key;
        self.binding_mut(b).used_in.insert(fk);
    }

    fn mark_assigned(&mut self, targets: Vec<(String, Span)>) {
        for (name, _) in targets {
            let b = self.lookup(&name);
            let in_try = self.try_depth > 0;
            let b = self.binding_mut(b);
            b.reassigned = true;
            if in_try {
                b.assigned_in_try = true;
            }
        }
    }
}

#[derive(Copy, Clone)]
enum FunctionLikeBody<'b, 'a> {
    Block(&'b FunctionBody<'a>),
    Expression(&'b Expression<'a>),
}

impl<'a> Visit<'a> for Resolver {
    fn visit_function(&mut self, f: &Function<'a>, _flags: ScopeFlags) {
        let own = if f.r#type == FunctionType::FunctionExpression { f.id.as_ref() } else { None };
        let Some(body) = &f.body else { return };
        self.walk_function_like(FnKey::Func(f.span), own, &f.params, FunctionLikeBody::Block(body));
    }

    fn visit_arrow_function_expression(&mut self, f: &ArrowFunctionExpression<'a>) {
        let body = match &f.body {
            ArrowFunctionBody::FunctionBody(b) => FunctionLikeBody::Block(b),
            other => FunctionLikeBody::Expression(other.as_expression().expect("an expression body")),
        };
        self.walk_function_like(FnKey::Func(f.span), None, &f.params, body);
    }

    fn visit_block_statement(&mut self, b: &BlockStatement<'a>) {
        self.with_block_scope(|r, _| {
            r.declare_lexical(&b.body);
            for s in &b.body {
                r.visit_statement(s);
            }
        });
    }

    fn visit_static_block(&mut self, b: &StaticBlock<'a>) {
        self.with_block_scope(|r, _| {
            r.declare_lexical(&b.body);
            for s in &b.body {
                r.visit_statement(s);
            }
        });
    }

    fn visit_for_statement(&mut self, s: &ForStatement<'a>) {
        self.with_block_scope(|r, _| {
            if let Some(ForStatementInit::VariableDeclaration(d)) = &s.init {
                r.declare_lexical_vars(d);
            }
            walk::walk_for_statement(r, s);
        });
    }

    fn visit_for_in_statement(&mut self, s: &ForInStatement<'a>) {
        self.with_block_scope(|r, _| {
            if let ForStatementLeft::VariableDeclaration(d) = &s.left {
                r.declare_lexical_vars(d);
            }
            walk::walk_for_in_statement(r, s);
        });
    }

    fn visit_for_of_statement(&mut self, s: &ForOfStatement<'a>) {
        self.with_block_scope(|r, _| {
            if let ForStatementLeft::VariableDeclaration(d) = &s.left {
                r.declare_lexical_vars(d);
            }
            walk::walk_for_of_statement(r, s);
        });
    }

    fn visit_switch_statement(&mut self, s: &SwitchStatement<'a>) {
        self.visit_expression(&s.discriminant);
        self.with_block_scope(|r, _| {
            let all: Vec<&Statement<'a>> = s.cases.iter().flat_map(|c| c.consequent.iter()).collect();
            r.declare_lexical_refs(&all);
            for c in &s.cases {
                r.visit_switch_case(c);
            }
        });
    }

    fn visit_try_statement(&mut self, s: &TryStatement<'a>) {
        self.try_depth += 1;
        self.visit_block_statement(&s.block);
        self.try_depth -= 1;
        if let Some(h) = &s.handler {
            self.visit_catch_clause(h);
        }
        if let Some(f) = &s.finalizer {
            self.visit_block_statement(f);
        }
    }

    fn visit_catch_clause(&mut self, c: &CatchClause<'a>) {
        self.with_block_scope(|r, b| {
            if let Some(p) = &c.param {
                for id in binding_pattern_names(&p.pattern) {
                    r.declare(b, &id.name, id.span, JsKind::Catch, false);
                }
            }
            r.visit_block_statement(&c.body);
        });
    }

    fn visit_class(&mut self, c: &Class<'a>) {
        let saved = self.scope;
        let b = self.push_scope(self.fn_key, false);
        if c.r#type == ClassType::ClassExpression {
            if let Some(id) = &c.id {
                self.declare(b, &id.name, id.span, JsKind::Class, false);
            }
        }
        if let Some(h) = &c.heritage {
            self.visit_expression(&h.expression); // in the outer scope
        }
        self.scope = b;
        self.visit_class_body(&c.body);
        self.scope = saved;
    }

    fn visit_variable_declaration(&mut self, d: &VariableDeclaration<'a>) {
        for decl in &d.declarations {
            for id in binding_pattern_names(&decl.id) {
                let b = match self.res.refs.get(&id.span) {
                    Some(&b) => b,
                    None => self.lookup(&id.name),
                };
                self.res.refs.insert(id.span, b);
                let fk = self.fn_key;
                self.binding_mut(b).used_in.insert(fk);
            }
            self.walk_pattern_defaults(&decl.id);
            if let Some(init) = &decl.init {
                self.visit_expression(init);
            }
        }
    }

    fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
        self.reference(&id.name, id.span);
    }

    /// Declared names are handled where they are declared.
    fn visit_binding_identifier(&mut self, _id: &BindingIdentifier<'a>) {}

    fn visit_assignment_expression(&mut self, e: &AssignmentExpression<'a>) {
        let mut names = Vec::new();
        target_names(&e.left, &mut names);
        self.mark_assigned(names);
        walk::walk_assignment_expression(self, e);
    }

    fn visit_update_expression(&mut self, e: &UpdateExpression<'a>) {
        let mut names = Vec::new();
        simple_target_names(&e.argument, &mut names);
        self.mark_assigned(names);
        walk::walk_update_expression(self, e);
    }

    fn visit_import_declaration(&mut self, d: &ImportDeclaration<'a>) {
        let fk = self.fn_key;
        for sp in d.specifiers.iter().flatten() {
            if let Some(&b) = self.res.refs.get(&sp.local().span) {
                self.binding_mut(b).used_in.insert(fk);
            }
        }
    }

    fn visit_export_named_declaration(&mut self, d: &ExportNamedDeclaration<'a>) {
        for sp in &d.specifiers {
            if let ModuleExportName::IdentifierReference(id) = &sp.local {
                self.visit_identifier_reference(id);
            }
        }
    }

    /// `export ... from '...'` re-exports: nothing local is referenced.
    fn visit_export_from_declaration(&mut self, _d: &ExportFromDeclaration<'a>) {}

    fn visit_export_all_declaration(&mut self, _d: &ExportAllDeclaration<'a>) {}
}

impl Resolver {
    fn declare_lexical_refs(&mut self, stmts: &[&Statement]) {
        for s in stmts {
            self.declare_lexical(std::slice::from_ref(*s));
        }
    }
}

/// Collects the names hoisted to a function scope (`hoistVars`): `var`
/// declarations anywhere in the body, and function declarations, without
/// descending into nested functions.
#[derive(Default)]
struct HoistCollector {
    found: Vec<Hoisted>,
}

impl HoistCollector {
    /// For an arrow's expression body, the reference visits the body's
    /// children (not the body itself).
    fn visit_children_of_expression(&mut self, e: &Expression) {
        match e {
            Expression::FunctionExpression(f) => walk::walk_function(self, f, ScopeFlags::Function),
            Expression::ArrowFunctionExpression(f) => walk::walk_arrow_function_expression(self, f),
            _ => self.visit_expression(e),
        }
    }
}

impl<'a> Visit<'a> for HoistCollector {
    fn visit_variable_declaration(&mut self, d: &VariableDeclaration<'a>) {
        if d.kind == VariableDeclarationKind::Var {
            for decl in &d.declarations {
                let array_init =
                    matches!(decl.id, BindingPattern::BindingIdentifier(_)) && is_array_init(decl.init.as_ref());
                for id in binding_pattern_names(&decl.id) {
                    self.found.push(Hoisted {
                        name: id.name.to_string(),
                        span: id.span,
                        kind: JsKind::Var,
                        array_init,
                    });
                }
            }
        }
        walk::walk_variable_declaration(self, d);
    }

    fn visit_function(&mut self, f: &Function<'a>, _flags: ScopeFlags) {
        if f.r#type == FunctionType::FunctionDeclaration {
            // (`export default function () {}` has no name to declare.)
            if let Some(id) = &f.id {
                self.found.push(Hoisted {
                    name: id.name.to_string(),
                    span: id.span,
                    kind: JsKind::Function,
                    array_init: false,
                });
            }
        }
        // Nested functions have their own scope.
    }

    fn visit_arrow_function_expression(&mut self, _f: &ArrowFunctionExpression<'a>) {}
}
