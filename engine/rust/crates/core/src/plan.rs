//! The planner and cost model (the book's chapters “What Viscosity refuses to touch” to “The cost model”): decide, for every
//! collection, which layout to use and record *why*, so `viscosity explain`
//! can tell the programmer.

use std::collections::HashMap;

use indexmap::IndexSet;
use viscosity_vir::{js_number, BindingId, SourceRef};

use crate::analysis::{Analysis, Collection};

/// How a collection is stored.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Layout {
    /// Array of structs: left alone.
    Aos,
    /// Struct of arrays: one column per field.
    Soa,
    /// Array of structs of arrays: blocks of N elements, field-major inside.
    Aosoa,
}

impl Layout {
    pub fn as_str(self) -> &'static str {
        match self {
            Layout::Aos => "aos",
            Layout::Soa => "soa",
            Layout::Aosoa => "aosoa",
        }
    }
}

/// A `@viscosity soa` style annotation in the source.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Annotation {
    pub layout: Layout,
    /// `aosoa(N)`: the block size N, if given as a whole number.
    pub block_size: Option<u64>,
    /// What was written between the parentheses, if anything (`aosoa(x)`:
    /// `x`), for the planner's messages.
    pub block_text: Option<String>,
    /// The line of the annotation comment.
    pub line: u32,
}

/// The largest AoSoA block size (2^16). Larger blocks gain nothing, cost a
/// lot of memory per block, and break the shift arithmetic from 2^32 up.
pub const MAX_BLOCK_SIZE: u64 = 65536;

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub enum Mode {
    /// Decide everything.
    #[default]
    Auto,
    /// Only touch annotated collections.
    OptIn,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub enum Bounds {
    /// Insert bounds checks where accesses are not proven in bounds.
    #[default]
    Check,
    /// Trust the program.
    Assume,
}

/// Options of the planner (`PlanOptions` in the TS reference).
#[derive(Clone, Debug)]
pub struct PlanOptions {
    pub mode: Mode,
    /// Below this many (estimated) elements, leave a collection alone.
    pub min_size: f64,
    pub bounds: Bounds,
    /// Annotations, keyed by binding.
    pub annotations: HashMap<BindingId, Annotation>,
    /// Element counts measured by a profiling run (PGO): binding name ->
    /// `maxLength`.
    pub profile: Option<HashMap<String, f64>>,
    /// Python only: transform without annotations. Off by default because
    /// in CPython column access measured slower per element than attribute
    /// access (the win is memory, about 5x less).
    pub python_auto: bool,
}

impl Default for PlanOptions {
    fn default() -> Self {
        PlanOptions {
            mode: Mode::Auto,
            min_size: 64.0,
            bounds: Bounds::Check,
            annotations: HashMap::new(),
            profile: None,
            python_auto: false,
        }
    }
}

/// The decision for one collection.
#[derive(Clone, Debug, PartialEq)]
pub struct CollectionPlan {
    pub collection: Collection,
    pub layout: Layout,
    /// For AoSoA: elements per block (0 otherwise).
    pub block_size: u64,
    pub reasons: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct Plan {
    pub collections: Vec<CollectionPlan>,
    pub options: PlanOptions,
}

/// Decides a layout for every collection of the analysis.
pub fn plan(a: &Analysis, opts: PlanOptions) -> Plan {
    let mut out = Vec::new();
    for c in &a.collections {
        out.push(plan_one(a, c, &opts));
    }
    Plan { collections: out, options: opts }
}

fn plan_one(a: &Analysis, c: &Collection, opts: &PlanOptions) -> CollectionPlan {
    let keep =
        |reasons: Vec<String>| CollectionPlan { collection: c.clone(), layout: Layout::Aos, block_size: 0, reasons };
    let ann = opts.annotations.get(&c.binding);
    if !c.bailouts.is_empty() {
        return keep(c.bailouts.iter().map(|b| format!("unsafe: {b}")).collect());
    }
    if let Some(ann) = ann.filter(|a| a.layout == Layout::Aosoa) {
        // A block size that is not a whole number (`aosoa(x)`) is refused,
        // not replaced by the default.
        let b = match (&ann.block_text, ann.block_size) {
            (Some(_), None) => None,
            (_, b) => Some(b.unwrap_or(8)),
        };
        let written = ann.block_text.clone().unwrap_or_else(|| js_number(b.unwrap_or(8) as f64));
        if b.is_some_and(|b| b > MAX_BLOCK_SIZE) {
            return keep(vec![format!(
                "annotated aosoa({written}), but the block size must be at most {MAX_BLOCK_SIZE}"
            )]);
        }
        if !b.is_some_and(|b| b >= 2 && b.is_power_of_two()) {
            return keep(vec![format!(
                "annotated aosoa({written}), but the block size must be a power of two (2, 4, 8, 16, ...)"
            )]);
        }
    }
    if let Some(ann) = ann {
        if ann.layout == Layout::Aosoa && c.numeric_fields.len() != c.fields.len() {
            let generic: Vec<&str> =
                c.fields.iter().filter(|f| !c.numeric_fields.contains(*f)).map(String::as_str).collect();
            return keep(vec![format!("annotated aosoa, but fields {} may hold non-numbers", generic.join(", "))]);
        }
        if ann.layout == Layout::Aos {
            return keep(vec![format!("annotated @viscosity aos at line {}", ann.line)]);
        }
        let block_size = ann.block_size.unwrap_or(8);
        let suffix =
            if ann.layout == Layout::Aosoa { format!("({})", js_number(block_size as f64)) } else { String::new() };
        let mut reasons = vec![format!("annotated @viscosity {}{suffix} at line {}", ann.layout.as_str(), ann.line)];
        reasons.extend(describe(c, c.size_estimate, false, &a.language));
        return CollectionPlan { collection: c.clone(), layout: ann.layout, block_size, reasons };
    }
    if opts.mode == Mode::OptIn {
        return keep(vec!["opt-in mode: not annotated".into()]);
    }
    if a.language == "python" && !opts.python_auto {
        return keep(vec!["CPython: column access measured slower per element than objects (the win is about 5x less memory); add \"# @viscosity soa\" above the list to opt in".into()]);
    }
    if c.numeric_fields.is_empty() {
        return keep(vec!["no field is provably numeric, so there are no typed columns to gain".into()]);
    }
    if !c.loops.iter().any(|l| l.depth > 0) {
        return keep(vec!["no loop reads or writes its fields, so a new layout cannot pay off".into()]);
    }
    let measured = opts.profile.as_ref().and_then(|p| p.get(&c.name)).copied();
    let size = measured.or(c.size_estimate);
    if let Some(size) = size {
        if size < opts.min_size {
            return keep(vec![format!(
                "{} {} elements{}: below the {}-element threshold, where the benefit is too small",
                if measured.is_none() && c.size_is_upper_bound { "at most" } else { "about" },
                js_number(size),
                if measured.is_some() { " (measured)" } else { "" },
                js_number(opts.min_size)
            )]);
        }
    }
    CollectionPlan {
        collection: c.clone(),
        layout: Layout::Soa,
        block_size: 0,
        reasons: describe(c, size, measured.is_some(), &a.language),
    }
}

/// The reasons listed for a transformed collection.
fn describe(c: &Collection, size: Option<f64>, measured: bool, language: &str) -> Vec<String> {
    let py = language == "python";
    let typed_name = if py { "array('d')" } else { "Float64Array" };
    let plain_name = if py { "list" } else { "plain array" };
    let mut r = Vec::new();
    for l in c.loops.iter().filter(|l| l.depth > 0) {
        let touched: IndexSet<&String> = l.reads.iter().chain(l.writes.iter()).collect();
        let names: Vec<&str> = touched.iter().map(|s| s.as_str()).collect();
        r.push(format!(
            "loop at line {} in {}() touches {} of {} fields ({})",
            l.line,
            l.func,
            touched.len(),
            c.fields.len(),
            names.join(", ")
        ));
    }
    let (typed, generic): (Vec<&str>, Vec<&str>) =
        c.fields.iter().map(String::as_str).partition(|f| c.numeric_fields.contains(*f));
    r.push(if generic.is_empty() {
        format!("typed {typed_name} columns for all {} fields", c.fields.len())
    } else {
        let typed = if typed.is_empty() { "no fields".to_string() } else { typed.join(", ") };
        format!(
            "typed {typed_name} columns for {typed}; {plain_name} columns for {} ({})",
            generic.join(", "),
            if py { "may hold non-floats" } else { "may hold non-numbers" }
        )
    });
    r.push(match size {
        None => "size unknown statically".into(),
        Some(s) => format!(
            "{} {} elements{}",
            if !measured && c.size_is_upper_bound { "at most" } else { "about" },
            js_number(s),
            if measured { " (measured by profiling)" } else { "" }
        ),
    });
    let proven = c.index_gets.iter().filter(|g| g.bounds_proven).count();
    r.push(format!("{proven} of {} element accesses proven in bounds", c.index_gets.len()));
    r
}

/// The text of `viscosity explain` (the book's chapter “viscosity explain”).
pub fn explain(p: &Plan) -> String {
    explain_text(p, None)
}

/// `viscosity explain --frames`: [`explain`], with a code frame (see
/// [`code_frame`]) under each refusal that has a source position. `source`
/// is the source the plan was made from.
pub fn explain_with_frames(p: &Plan, source: &str) -> String {
    explain_text(p, Some(source))
}

fn explain_text(p: &Plan, frames: Option<&str>) -> String {
    let mut lines = Vec::new();
    for cp in &p.collections {
        let c = &cp.collection;
        let verdict = match cp.layout {
            Layout::Aos => "kept as array of objects".to_string(),
            Layout::Soa => "struct of arrays".to_string(),
            Layout::Aosoa => format!("AoSoA, blocks of {}", js_number(cp.block_size as f64)),
        };
        lines.push(format!("{} (line {}) {{{}}} → {verdict}", c.name, c.line, c.fields.join(", ")));
        // A collection with bailouts is kept with exactly one reason per bailout.
        let refused = !c.bailouts.is_empty() && cp.reasons.len() == c.bailouts.len();
        for (k, r) in cp.reasons.iter().enumerate() {
            lines.push(format!("  · {r}"));
            let at = if refused { c.bailout_sites.get(&c.bailouts[k]).copied().flatten() } else { None };
            let site = frames.zip(at);
            if let Some((src, at)) = site {
                lines.push(code_frame(src, at, "    "));
            }
        }
    }
    lines.join("\n")
}

fn is_line_break(c: char) -> bool {
    matches!(c, '\n' | '\r' | '\u{2028}' | '\u{2029}')
}

/// A code frame, as rustc and tsc print them: the source line where `at`
/// starts, with its line number, and carets under the code `at` covers (to
/// the end of that line). Columns count code points; tabs before the code
/// are kept in the caret line so the carets line up. Two lines, no final
/// line break:
///
/// ```text
///     5 | keep.push(ps[i]);
///       |           ^^^^^
/// ```
pub fn code_frame(source: &str, at: SourceRef, indent: &str) -> String {
    let start = (at.start as usize).min(source.len());
    let s =
        source[..start].rfind(is_line_break).map_or(0, |i| i + source[i..].chars().next().map_or(1, char::len_utf8));
    let e = source[start..].find(is_line_break).map_or(source.len(), |i| start + i);
    let text = source[s..e].trim_end_matches([' ', '\t']);
    let before = &source[s..start];
    let col = before.chars().count();
    let end = (at.end as usize).max(start).min(e);
    let up_to = source[s..end].chars().count();
    let width = up_to.min(text.chars().count()).saturating_sub(col).max(1);
    let pad: String = before.chars().map(|c| if c == '\t' { '\t' } else { ' ' }).collect();
    let num = at.line.to_string();
    let gutter = " ".repeat(num.len());
    let text = if text.is_empty() { String::new() } else { format!(" {text}") };
    format!("{indent}{num} |{text}\n{indent}{gutter} | {pad}{}", "^".repeat(width))
}
