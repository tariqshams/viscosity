//! The JavaScript language plugin for Viscosity: parse with
//! [oxc](https://oxc.rs), resolve scopes, lower to VIR, and rewrite the
//! source from a layout plan by splicing source ranges.
//!
//! This is the Rust port of `engine/ts/packages/frontend-js`. For the same
//! input it produces the same VIR decisions and byte-identical output as the
//! TypeScript reference (which parses with acorn). TypeScript input, which
//! the reference strips with sucrase first, is not supported by the port.

pub mod ast;
pub mod emit;
pub mod lines;
pub mod lower;
pub mod resolve;

use std::collections::HashMap;

use indexmap::IndexMap;
use oxc_allocator::Allocator;
use oxc_parser::{ParseOptions, Parser};
use oxc_semantic::SemanticBuilder;
use oxc_span::SourceType;
use viscosity_core::{Annotation, CompileError, LanguagePlugin, Layout, LoweredModule, Plan};
use viscosity_vir::BindingId;

use crate::lines::LineIndex;
use crate::lower::JsNode;
use crate::resolve::JsBindingId;

/// What the JavaScript plugin carries from `lower` to `emit`.
#[derive(Clone, Debug)]
pub struct JsExtra {
    /// Facts about the syntax nodes behind instructions.
    pub nodes: Vec<JsNode>,
    /// The VIR binding of each JS binding that has one.
    pub binding_of: IndexMap<JsBindingId, BindingId>,
}

/// The JavaScript plugin.
#[derive(Copy, Clone, Debug, Default)]
pub struct JsPlugin;

/// A comment, as acorn reports it: the text without delimiters, and the
/// line it ends on.
struct Comment<'s> {
    value: &'s str,
    line: u32,
}

impl LanguagePlugin for JsPlugin {
    type Extra = JsExtra;

    fn id(&self) -> &'static str {
        "javascript"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &[".js", ".mjs"]
    }

    fn lower(&self, source: &str) -> Result<LoweredModule<JsExtra>, CompileError> {
        let allocator = Allocator::default();
        // acorn's `sourceType: 'module'`, without JSX; parentheses are not
        // kept as nodes (acorn's default `preserveParens: false`), and
        // regular expressions are validated, as acorn does.
        let options =
            ParseOptions { preserve_parens: false, parse_regular_expression: true, ..ParseOptions::default() };
        let ret = Parser::new(&allocator, source, SourceType::mjs()).with_options(options).parse();
        if let Some(e) = ret.diagnostics.errors().next() {
            return Err(CompileError(format!("SyntaxError: {e}")));
        }
        let program = ret.program;
        // acorn reports ECMAScript's early errors (redeclarations, `break`
        // outside a loop, duplicate labels, undeclared exports, strict-mode
        // rules, ...) while parsing. oxc's parser leaves many of them to
        // semantic analysis, so run its syntax checks too.
        let semantic = SemanticBuilder::new().with_check_syntax_error(true).build(&program);
        if let Some(e) = semantic.diagnostics.errors().next() {
            return Err(CompileError(format!("SyntaxError: {e}")));
        }
        let lines = LineIndex::new(source);
        let mut comments = Vec::new();
        if let Some(h) = &program.hashbang {
            comments.push(Comment { value: h.value.as_str(), line: lines.line(h.span.end) });
        }
        for c in &program.comments {
            let content = c.content_span();
            comments.push(Comment {
                value: &source[content.start as usize..content.end as usize],
                line: lines.line(c.span.end),
            });
        }
        let resolution = resolve::resolve_scopes(&program)?;
        let lowered = lower::lower(&program, source, &lines, &resolution)?;

        // `// @viscosity soa` (or aos, aosoa(8)) on the line before a
        // declaration. A trailing comment (code before it on its line)
        // annotates that line only; a comment on a line of its own
        // annotates the next line.
        let mut annotations = HashMap::new();
        // Split at the same line breaks the line numbers count.
        let src_lines = lines::split_lines(source);
        for cm in &comments {
            let Some((layout, block_size, block_text)) = parse_annotation(cm.value) else {
                continue;
            };
            let own = src_lines.get(cm.line as usize - 1).is_some_and(|l| starts_comment(l));
            for (&jb, &id) in &lowered.binding_of {
                let Some(decl) = resolution.binding(jb).decl else {
                    continue;
                };
                let line = lines.line(decl.start);
                if if own { line == cm.line + 1 } else { line == cm.line } {
                    annotations.insert(
                        id,
                        Annotation { layout, block_size, block_text: block_text.map(str::to_string), line: cm.line },
                    );
                }
            }
        }
        Ok(LoweredModule {
            module: lowered.module,
            annotations,
            extra: JsExtra { nodes: lowered.nodes, binding_of: lowered.binding_of },
        })
    }

    fn emit(&self, source: &str, lowered: &LoweredModule<JsExtra>, plan: &Plan) -> Result<String, CompileError> {
        emit::emit_js(source, &lowered.module, &lowered.extra.nodes, plan)
    }
}

/// Does a source line start (after whitespace) with a comment: `//`, `/*`,
/// or the `*` of a block comment's continuation line?
/// (`/^\s*(\/\/|\/\*|\*)/`)
fn starts_comment(line: &str) -> bool {
    let t = line.trim_start_matches(emit::is_js_space);
    t.starts_with("//") || t.starts_with("/*") || t.starts_with('*')
}

/// Matches `/@viscosity\s+(aosoa|soa|aos)\b(?:\(([^)]*)\))?/` against a
/// comment, returning the layout, the block size if the text between the
/// parentheses is a whole number, and that text.
pub fn parse_annotation(comment: &str) -> Option<(Layout, Option<u64>, Option<&str>)> {
    const TAG: &str = "@viscosity";
    let is_word = |c: char| c.is_ascii_alphanumeric() || c == '_';
    let mut from = 0;
    while let Some(at) = comment[from..].find(TAG) {
        let start = from + at;
        from = start + TAG.len();
        let after = &comment[from..];
        let rest = after.trim_start_matches(emit::is_js_space);
        if rest.len() == after.len() {
            continue; // `\s+` needs at least one space
        }
        for (word, layout) in [("aosoa", Layout::Aosoa), ("soa", Layout::Soa), ("aos", Layout::Aos)] {
            let Some(tail) = rest.strip_prefix(word) else {
                continue;
            };
            if tail.chars().next().is_some_and(is_word) {
                continue; // `\b`
            }
            let block = tail.strip_prefix('(').and_then(|t| t.find(')').map(|end| &t[..end]));
            // `Number(digits)`; huge values saturate, and are refused as
            // larger than the maximum block size anyway.
            let size = block
                .filter(|d| !d.is_empty() && d.bytes().all(|b| b.is_ascii_digit()))
                .map(|d| d.parse::<f64>().expect("digits") as u64);
            return Some((layout, size, block));
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn annotations() {
        assert_eq!(parse_annotation(" @viscosity soa"), Some((Layout::Soa, None, None)));
        assert_eq!(parse_annotation(" @viscosity aosoa(16) please"), Some((Layout::Aosoa, Some(16), Some("16"))));
        assert_eq!(parse_annotation(" @viscosity aosoa(x)"), Some((Layout::Aosoa, None, Some("x"))));
        assert_eq!(parse_annotation(" @viscosity aosoa()"), Some((Layout::Aosoa, None, Some(""))));
        assert_eq!(parse_annotation(" @viscosity aosoa(8"), Some((Layout::Aosoa, None, None)));
        assert_eq!(parse_annotation(" @viscosity   aos"), Some((Layout::Aos, None, None)));
        assert_eq!(parse_annotation(" @viscosity soap"), None);
        assert_eq!(parse_annotation(" @viscositysoa"), None);
        assert_eq!(parse_annotation(" @viscosity x @viscosity soa"), Some((Layout::Soa, None, None)));
    }
}
