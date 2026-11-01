//! The Python language plugin for Viscosity (milestone M7): a Python subset
//! — functions, `@dataclass` records, lists, `for`/`while`/`if`, arithmetic
//! and calls — lowered to the same VIR as JavaScript, and rewritten to
//! column storage (`array('d')` or list columns) from a layout plan.
//!
//! This is the Rust port of `engine/ts/packages/frontend-python`; for the
//! same input it makes the same decisions and emits byte-identical Python.
//! Source outside the subset is left exactly as it is (fail closed).
//!
//! | reference | here |
//! |---|---|
//! | `tokens.ts` | [`tokens`] |
//! | `parser.ts` | [`parser`] |
//! | `lower.ts` | [`lower`] |
//! | `emit.ts` | [`emit`] |
//! | `index.ts` | this file |

pub mod emit;
pub mod lower;
pub mod parser;
pub mod tokens;

use std::collections::HashMap;

use viscosity_core::builder::FunctionBuilder;
use viscosity_core::{Annotation, CompileError, LanguagePlugin, Layout, LoweredModule, Plan};
use viscosity_vir::Module;

use crate::lower::PyLowered;

/// What the Python plugin carries from `lower` to `emit`.
#[derive(Clone, Debug)]
pub struct PyExtra {
    /// `None` when the source is outside the supported subset.
    pub low: Option<PyLowered>,
    /// Why the source is outside the subset.
    pub unsupported: Option<String>,
}

/// The Python plugin.
#[derive(Copy, Clone, Debug, Default)]
pub struct PyPlugin;

impl LanguagePlugin for PyPlugin {
    type Extra = PyExtra;

    fn id(&self) -> &'static str {
        "python"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &[".py"]
    }

    fn lower(&self, source: &str) -> Result<LoweredModule<PyExtra>, CompileError> {
        let ast = match parser::parse_python(source) {
            Ok(ast) => ast,
            Err(e) => {
                // Outside the supported subset: leave the file exactly as it is.
                let mut m = Module::new("python", source);
                FunctionBuilder::<()>::new(&mut m, "<module>", None).finish(&mut m);
                return Ok(LoweredModule {
                    module: m,
                    annotations: HashMap::new(),
                    extra: PyExtra { low: None, unsupported: Some(e.0) },
                });
            }
        };
        let (module, low) = lower::lower_python(ast, source);
        // `# @viscosity soa` on the line above `xs = []` (module level).
        let mut annotations = HashMap::new();
        let lines: Vec<&str> = source.split('\n').collect();
        for (i, l) in lines.iter().enumerate() {
            let next = lines.get(i + 1).copied().unwrap_or("");
            let (Some(layout), Some(target)) = (parse_annotation(l), assigned_name(next)) else {
                continue;
            };
            if let Some(b) = module.bindings.iter().find(|b| b.name == target && b.owner == Some(module.main)) {
                annotations.insert(b.id, Annotation { layout, block_size: None, block_text: None, line: i as u32 + 1 });
            }
        }
        Ok(LoweredModule { module, annotations, extra: PyExtra { low: Some(low), unsupported: None } })
    }

    fn emit(&self, source: &str, lowered: &LoweredModule<PyExtra>, plan: &Plan) -> Result<String, CompileError> {
        match &lowered.extra.low {
            Some(low) => emit::emit_python(source, &lowered.module, low, plan),
            None => Ok(source.to_string()),
        }
    }
}

fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// Matches `/#\s*@viscosity\s+(soa|aos)\b/` against a source line.
pub fn parse_annotation(line: &str) -> Option<Layout> {
    for (k, _) in line.match_indices('#') {
        let rest = line[k + 1..].trim_start_matches(emit_space);
        let Some(after) = rest.strip_prefix("@viscosity") else { continue };
        let words = after.trim_start_matches(emit_space);
        if words.len() == after.len() {
            continue; // `\s+` needs at least one space
        }
        for (word, layout) in [("soa", Layout::Soa), ("aos", Layout::Aos)] {
            if let Some(tail) = words.strip_prefix(word) {
                if !tail.chars().next().is_some_and(is_word) {
                    return Some(layout);
                }
            }
        }
    }
    None
}

/// Matches `/^([A-Za-z_]\w*)\s*=/`, returning the name.
pub fn assigned_name(line: &str) -> Option<&str> {
    if !line.starts_with(|c: char| c.is_ascii_alphabetic() || c == '_') {
        return None;
    }
    let end = line.find(|c: char| !is_word(c)).unwrap_or(line.len());
    line[end..].trim_start_matches(emit_space).starts_with('=').then(|| &line[..end])
}

/// JavaScript's `\s`.
fn emit_space(c: char) -> bool {
    matches!(
        c,
        '\t' | '\n' | '\u{b}' | '\u{c}' | '\r' | ' ' | '\u{a0}' | '\u{1680}' | '\u{2000}'
            ..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}'
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use viscosity_core::{compile, CompileOptions};

    #[test]
    fn annotations() {
        assert_eq!(parse_annotation("# @viscosity soa"), Some(Layout::Soa));
        assert_eq!(parse_annotation("x = 1  #@viscosity  aos please"), Some(Layout::Aos));
        assert_eq!(parse_annotation("# @viscosity aosoa(8)"), None);
        assert_eq!(parse_annotation("# @viscositysoa"), None);
        assert_eq!(parse_annotation("# x # @viscosity soa"), Some(Layout::Soa));
        assert_eq!(assigned_name("ps = []"), Some("ps"));
        assert_eq!(assigned_name("ps== []"), Some("ps"));
        assert_eq!(assigned_name(" ps = []"), None);
        assert_eq!(assigned_name("ps.x = 1"), None);
    }

    #[test]
    fn unsupported_source_is_left_alone() {
        let src = "xs = [x * 2 for x in range(10)]\nprint(sum(xs))\n";
        let r = compile(src, &PyPlugin, CompileOptions { python_auto: true, ..CompileOptions::default() })
            .expect("compiles");
        assert_eq!(r.code, src);
        assert_eq!(r.explain, "");
    }

    #[test]
    fn python_defaults_keep_objects_unless_annotated() {
        let src = "from dataclasses import dataclass\n\n@dataclass\nclass P:\n    x: float\n\nps = []\nfor i in range(1000):\n    ps.append(P(i * 1.0))\nfor p in ps:\n    p.x += 1.0\n";
        let r = compile(src, &PyPlugin, CompileOptions::default()).expect("compiles");
        assert_eq!(r.plan.collections[0].layout, Layout::Aos);
        assert!(r.explain.contains("CPython"), "{}", r.explain);
        let annotated = src.replace("ps = []", "# @viscosity soa\nps = []");
        let r = compile(&annotated, &PyPlugin, CompileOptions::default()).expect("compiles");
        assert_eq!(r.plan.collections[0].layout, Layout::Soa);
        assert!(r.code.contains("ps = _Vsc_ps()"), "{}", r.code);
    }
}
