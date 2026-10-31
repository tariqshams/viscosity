//! Small helpers over the oxc AST: the ESTree view the TS reference relies on
//! (declared names of patterns, node type names for explain output).

use oxc_ast::ast::*;
use oxc_span::Span;

/// Identifiers declared by a binding pattern (`x`, `{a, b: [c]}`, `...rest`,
/// `x = 1`), in source order (`patternNames` in the reference).
pub fn pattern_names<'b, 'a>(p: &'b BindingPattern<'a>, out: &mut Vec<&'b BindingIdentifier<'a>>) {
    match p {
        BindingPattern::BindingIdentifier(id) => out.push(id),
        BindingPattern::ObjectPattern(o) => {
            for prop in &o.properties {
                pattern_names(&prop.value, out);
            }
            if let Some(rest) = &o.rest {
                pattern_names(&rest.argument, out);
            }
        }
        BindingPattern::ArrayPattern(a) => {
            for e in a.elements.iter().flatten() {
                pattern_names(e, out);
            }
            if let Some(rest) = &a.rest {
                pattern_names(&rest.argument, out);
            }
        }
        BindingPattern::AssignmentPattern(a) => pattern_names(&a.left, out),
    }
}

pub fn binding_pattern_names<'b, 'a>(p: &'b BindingPattern<'a>) -> Vec<&'b BindingIdentifier<'a>> {
    let mut out = Vec::new();
    pattern_names(p, &mut out);
    out
}

/// A variable named by an assignment target: its name and span.
pub type Target = (String, Span);

/// Variables an assignment target writes (`patternNames` of an ESTree
/// pattern used as an assignment target). Member expressions name none.
pub fn target_names(t: &AssignmentTarget, out: &mut Vec<Target>) {
    match t {
        AssignmentTarget::AssignmentTargetIdentifier(id) => out.push((id.name.to_string(), id.span)),
        AssignmentTarget::ArrayAssignmentTarget(a) => {
            for e in a.elements.iter().flatten() {
                maybe_default_names(e, out);
            }
            if let Some(rest) = &a.rest {
                target_names(&rest.target, out);
            }
        }
        AssignmentTarget::ObjectAssignmentTarget(o) => {
            for p in &o.properties {
                match p {
                    AssignmentTargetProperty::AssignmentTargetPropertyIdentifier(p) => {
                        out.push((p.binding.name.to_string(), p.binding.span));
                    }
                    AssignmentTargetProperty::AssignmentTargetPropertyProperty(p) => {
                        maybe_default_names(&p.binding, out)
                    }
                }
            }
            if let Some(rest) = &o.rest {
                target_names(&rest.target, out);
            }
        }
        _ => {}
    }
}

fn maybe_default_names(t: &AssignmentTargetMaybeDefault, out: &mut Vec<Target>) {
    match t {
        AssignmentTargetMaybeDefault::AssignmentTargetWithDefault(d) => target_names(&d.binding, out),
        _ => {
            if let Some(t) = t.as_assignment_target() {
                target_names(t, out);
            }
        }
    }
}

/// Variables a simple assignment target writes (just an identifier).
pub fn simple_target_names(t: &SimpleAssignmentTarget, out: &mut Vec<Target>) {
    if let SimpleAssignmentTarget::AssignmentTargetIdentifier(id) = t {
        out.push((id.name.to_string(), id.span));
    }
}

/// Is `init` an array (`[...]` or `new Array(...)`)? Such variables always
/// become bindings, so the analyses see every read and write of them.
pub fn is_array_init(init: Option<&Expression>) -> bool {
    match init {
        Some(Expression::ArrayExpression(_)) => true,
        Some(Expression::NewExpression(n)) => {
            matches!(&n.callee, Expression::Identifier(id) if id.name == "Array")
        }
        _ => false,
    }
}

/// The ESTree `type` of an expression, which the reference uses as the
/// description of opaque instructions ("used by code Viscosity doesn't
/// model (ThisExpression)").
pub fn expression_type(e: &Expression) -> &'static str {
    match e {
        Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BigIntLiteral(_)
        | Expression::RegExpLiteral(_)
        | Expression::StringLiteral(_) => "Literal",
        Expression::TemplateLiteral(_) => "TemplateLiteral",
        Expression::Identifier(_) => "Identifier",
        Expression::Super(_) => "Super",
        Expression::ArrayExpression(_) => "ArrayExpression",
        Expression::ArrowFunctionExpression(_) => "ArrowFunctionExpression",
        Expression::AssignmentExpression(_) => "AssignmentExpression",
        Expression::AwaitExpression(_) => "AwaitExpression",
        Expression::BinaryExpression(_) | Expression::PrivateInExpression(_) => "BinaryExpression",
        Expression::CallExpression(_) => "CallExpression",
        Expression::ChainExpression(_) => "ChainExpression",
        Expression::ClassExpression(_) => "ClassExpression",
        Expression::ConditionalExpression(_) => "ConditionalExpression",
        Expression::FunctionExpression(_) => "FunctionExpression",
        Expression::ImportExpression(_) => "ImportExpression",
        Expression::LogicalExpression(_) => "LogicalExpression",
        Expression::NewExpression(_) => "NewExpression",
        Expression::ObjectExpression(_) => "ObjectExpression",
        Expression::ParenthesizedExpression(_) => "ParenthesizedExpression",
        Expression::SequenceExpression(_) => "SequenceExpression",
        Expression::TaggedTemplateExpression(_) => "TaggedTemplateExpression",
        Expression::ThisExpression(_) => "ThisExpression",
        Expression::UnaryExpression(_) => "UnaryExpression",
        Expression::UpdateExpression(_) => "UpdateExpression",
        Expression::YieldExpression(_) => "YieldExpression",
        Expression::ImportMeta(_) | Expression::NewTarget(_) => "MetaProperty",
        Expression::JSXElement(_) => "JSXElement",
        Expression::JSXFragment(_) => "JSXFragment",
        Expression::TSAsExpression(_) => "TSAsExpression",
        Expression::TSSatisfiesExpression(_) => "TSSatisfiesExpression",
        Expression::TSTypeAssertion(_) => "TSTypeAssertion",
        Expression::TSNonNullExpression(_) => "TSNonNullExpression",
        Expression::TSInstantiationExpression(_) => "TSInstantiationExpression",
        Expression::V8IntrinsicExpression(_) => "V8IntrinsicExpression",
        Expression::ComputedMemberExpression(_)
        | Expression::StaticMemberExpression(_)
        | Expression::PrivateFieldExpression(_) => "MemberExpression",
    }
}

/// The ESTree `type` of a statement the lowering does not model.
pub fn statement_type(s: &Statement) -> &'static str {
    match s {
        Statement::WithStatement(_) => "WithStatement",
        Statement::TSTypeAliasDeclaration(_) => "TSTypeAliasDeclaration",
        Statement::TSInterfaceDeclaration(_) => "TSInterfaceDeclaration",
        Statement::TSEnumDeclaration(_) => "TSEnumDeclaration",
        Statement::TSExternalModuleDeclaration(_)
        | Statement::TSNamespaceDeclaration(_)
        | Statement::TSGlobalDeclaration(_) => "TSModuleDeclaration",
        Statement::TSImportEqualsDeclaration(_) => "TSImportEqualsDeclaration",
        Statement::TSExportAssignment(_) => "TSExportAssignment",
        Statement::TSNamespaceExportDeclaration(_) => "TSNamespaceExportDeclaration",
        _ => "Statement",
    }
}
