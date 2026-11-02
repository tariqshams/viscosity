//! The plugin API (the book's chapter “The plugin API”). A language plugin turns its source into
//! VIR and, given a layout plan, rewrites its source. The core never sees
//! language syntax, so adding a language means implementing
//! [`LanguagePlugin`].

use std::collections::HashMap;
use std::fmt;

use viscosity_vir::{BindingId, Module};

use crate::plan::{Annotation, Plan};

/// What a plugin's `lower` produces: the VIR module, the annotations found
/// in the source, and whatever else the plugin needs to rewrite the source
/// later (`extra`; the JavaScript plugin keeps facts about syntax nodes).
#[derive(Clone, Debug)]
pub struct LoweredModule<X> {
    pub module: Module,
    /// `@viscosity` annotations, keyed by binding.
    pub annotations: HashMap<BindingId, Annotation>,
    pub extra: X,
}

/// A failure to compile: a syntax error, or something the plugin cannot
/// rewrite.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CompileError(pub String);

impl fmt::Display for CompileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for CompileError {}

/// A language front-end and back-end.
pub trait LanguagePlugin {
    /// The plugin's own data carried from `lower` to `emit`.
    type Extra;

    /// e.g. `"javascript"`, `"python"`
    fn id(&self) -> &'static str;
    /// File extensions this plugin handles.
    fn extensions(&self) -> &'static [&'static str];
    /// Parse and lower source to VIR.
    fn lower(&self, source: &str) -> Result<LoweredModule<Self::Extra>, CompileError>;
    /// Rewrite the source according to the plan.
    fn emit(&self, source: &str, lowered: &LoweredModule<Self::Extra>, plan: &Plan) -> Result<String, CompileError>;
}

/// A layout strategy: how a collection is stored.
#[derive(Copy, Clone, Debug)]
pub struct LayoutStrategy {
    pub id: &'static str,
    pub describe: &'static str,
}

pub const STRATEGIES: &[LayoutStrategy] = &[
    LayoutStrategy { id: "aos", describe: "leave it as an array of objects" },
    LayoutStrategy { id: "soa", describe: "one Float64Array per field (struct of arrays)" },
    LayoutStrategy {
        id: "aosoa",
        describe: "blocks of N elements, field-major inside a block (array of structs of arrays)",
    },
];
