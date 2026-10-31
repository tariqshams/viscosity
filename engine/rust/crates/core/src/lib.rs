//! Viscosity core: SSA construction, CFG utilities, the layout analyses, the
//! planner and the explain text. The pipeline is
//!
//! ```text
//! plugin.lower ──► analyze ──► plan ──► plugin.emit
//! ```
//!
//! This crate is the Rust port of `engine/ts/packages/core`; it makes the
//! same decisions as the TypeScript reference, message for message.

pub mod analysis;
pub mod builder;
pub mod cfg;
pub mod plan;
pub mod plugin;

pub use analysis::{analyze, AccessKind, Analysis, Collection, ElementAccess, IndexGet, LoopAccess};
pub use cfg::{dominators, loop_of, natural_loops, reverse_postorder, Dominators, Loop};
pub use plan::{explain, plan, Annotation, Bounds, CollectionPlan, Layout, Mode, Plan, PlanOptions};
pub use plugin::{CompileError, LanguagePlugin, LayoutStrategy, LoweredModule, STRATEGIES};
pub use viscosity_vir as vir;

use std::collections::HashMap;

use viscosity_vir::BindingId;

/// Options for [`compile`]. Like the TS `Partial<PlanOptions>`, the
/// annotations default to the ones the plugin found in the source.
#[derive(Clone, Debug)]
pub struct CompileOptions {
    pub mode: Mode,
    pub min_size: f64,
    pub bounds: Bounds,
    /// `None`: use the plugin's annotations.
    pub annotations: Option<HashMap<BindingId, Annotation>>,
    pub profile: Option<HashMap<String, f64>>,
    pub python_auto: bool,
}

impl Default for CompileOptions {
    fn default() -> Self {
        let d = PlanOptions::default();
        CompileOptions {
            mode: d.mode,
            min_size: d.min_size,
            bounds: d.bounds,
            annotations: None,
            profile: d.profile,
            python_auto: d.python_auto,
        }
    }
}

/// Everything [`compile`] produces.
#[derive(Clone, Debug)]
pub struct CompileResult {
    pub code: String,
    pub plan: Plan,
    pub analysis: Analysis,
    pub explain: String,
}

/// The whole pipeline: lower, analyze, plan, emit.
pub fn compile<P: LanguagePlugin>(
    source: &str,
    plugin: &P,
    opts: CompileOptions,
) -> Result<CompileResult, CompileError> {
    let lowered = plugin.lower(source)?;
    let analysis = analyze(&lowered.module);
    let options = PlanOptions {
        mode: opts.mode,
        min_size: opts.min_size,
        bounds: opts.bounds,
        annotations: opts.annotations.unwrap_or_else(|| lowered.annotations.clone()),
        profile: opts.profile,
        python_auto: opts.python_auto,
    };
    let p = plan(&analysis, options);
    let code = plugin.emit(source, &lowered, &p)?;
    let explain = explain(&p);
    Ok(CompileResult { code, plan: p, analysis, explain })
}
