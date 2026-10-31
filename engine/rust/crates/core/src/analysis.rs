//! The layout analyses (book chapters 96–101). They run on VIR, so they work
//! for any language plugin.
//!
//! | step | what it finds |
//! |------|---------------|
//! | 1. collections | which bindings hold an array of same-shaped records, and which functions are *known* (only ever called directly, so every call site is visible) |
//! | 2. shapes and uses | every use of each collection must be one we can rewrite: if anything could observe the old layout, bail out. Collections passed to known functions are followed into the parameter (interprocedural) |
//! | 3. numeric | which values are provably numbers: an optimistic fixpoint over SSA values, bindings and collection fields, with JavaScript or Python semantics |
//! | 4. element uses | each element read from the collection may only have its fields read or written |
//! | 5. bounds, loops, size | which element accesses provably stay in bounds, which fields each loop touches, and how many elements the collection holds |
//!
//! This is a faithful port of `analysis.ts`; the order in which things are
//! visited is preserved exactly, because it decides the order of the
//! messages in `viscosity explain`.

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};

use indexmap::{IndexMap, IndexSet};
use viscosity_vir::{
    build_uses, BindingId, BindingKind, BlockId, Const, Func, FuncId, Inst, Module, Op, Terminator, Use, Uses, ValueId,
};

use crate::cfg::{dominators, loop_of, natural_loops, Dominators, Loop};

/// Binary operators whose result is a number when both operands are.
const ARITH: &[&str] = &["-", "*", "/", "%", "**", "&", "|", "^", "<<", ">>", ">>>", "+"];
/// Python intrinsics that return an int.
const INT_RESULT: &[&str] = &["math.floor", "math.ceil", "math.trunc", "len", "int", "round"];
/// The fixpoint gives up (and fails closed) after this many rounds.
const MAX_ROUNDS: usize = 1000;

/// Which fields one loop (or the code outside loops) reads and writes.
#[derive(Clone, Debug, PartialEq)]
pub struct LoopAccess {
    pub func: String,
    pub line: u32,
    /// 0 for accesses outside any loop.
    pub depth: u32,
    /// Fields read, in first-access order.
    pub reads: IndexSet<String>,
    pub writes: IndexSet<String>,
    /// Estimated iterations per execution, if known.
    pub trips: Option<f64>,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum AccessKind {
    Read,
    Write,
}

/// A field read or write on an element of a collection.
#[derive(Clone, Debug, PartialEq)]
pub struct ElementAccess {
    /// The `field.get` / `field.set` instruction.
    pub inst: ValueId,
    /// The `index.get` that produced the element.
    pub element: ValueId,
    pub field: String,
    pub kind: AccessKind,
}

/// An `index.get` that reads an element, and whether it is provably in
/// bounds.
#[derive(Clone, Debug, PartialEq)]
pub struct IndexGet {
    pub inst: ValueId,
    pub bounds_proven: bool,
}

/// A candidate collection: a binding initialized with an array.
#[derive(Clone, Debug, PartialEq)]
pub struct Collection {
    pub binding: BindingId,
    pub name: String,
    pub fields: Vec<String>,
    /// The instruction that creates it (`array.empty` or `array.new`).
    pub init: ValueId,
    /// `record.new` instructions inside `array.new`, in order.
    pub init_records: Vec<ValueId>,
    pub pushes: Vec<ValueId>,
    /// `index.get` instructions producing elements, with bounds facts.
    pub index_gets: Vec<IndexGet>,
    pub accesses: Vec<ElementAccess>,
    pub length_reads: Vec<ValueId>,
    pub loops: Vec<LoopAccess>,
    /// Estimated number of elements (a JS number: trip counts may be
    /// fractional), if known.
    pub size_estimate: Option<f64>,
    /// The estimate counts pushes that run only on some paths, so it is a
    /// maximum rather than an estimate.
    pub size_is_upper_bound: bool,
    /// Fields provably always numbers, in field order: these get typed
    /// (`Float64Array`) columns.
    pub numeric_fields: IndexSet<String>,
    /// Why the collection can't be transformed (empty = safe).
    pub bailouts: Vec<String>,
    /// The source line of the declaration.
    pub line: u32,
}

/// The result of [`analyze`].
#[derive(Clone, Debug)]
pub struct Analysis {
    /// The module's language (`"javascript"`, `"python"`).
    pub language: String,
    pub uses: Uses,
    /// `is_number[v]`: is value `v` provably a number?
    pub is_number: Vec<bool>,
    pub collections: Vec<Collection>,
}

impl Analysis {
    pub fn is_number(&self, v: ValueId) -> bool {
        self.is_number.get(v.index()).copied().unwrap_or(false)
    }
}

/// Runs every analysis over a module.
pub fn analyze(m: &Module) -> Analysis {
    Analyzer::new(m, MAX_ROUNDS).run()
}

/// The source line of an instruction (0 if unknown). Phis carry no
/// source position of their own; they use the latest line among the
/// values they merge (the reassignment that created the phi).
fn line_of(m: &Module, i: &Inst) -> u32 {
    match i.src {
        Some(s) if s.line != 0 => s.line,
        _ if matches!(i.op, Op::Phi) => i.args.iter().map(|&a| m.inst(a).line()).max().unwrap_or(0),
        _ => 0,
    }
}

/// Shared state of one analysis run. The TS reference keeps these as local
/// variables and closures of `analyze`.
struct Analyzer<'m> {
    m: &'m Module,
    uses: Uses,
    py: bool,
    /// The function each live instruction belongs to.
    func_of: Vec<Option<FuncId>>,
    stores: HashMap<BindingId, Vec<ValueId>>,
    loads: HashMap<BindingId, Vec<ValueId>>,
    /// Known functions and all their call sites.
    call_sites: HashMap<FuncId, Vec<ValueId>>,
    collections: Vec<Collection>,
    /// Values that refer to a collection: its loads, and parameters it flows into.
    collection_of_load: HashMap<ValueId, usize>,
    /// `index.get` value -> the collection it reads from.
    element_of: HashMap<ValueId, usize>,
    /// Index operands that must be numbers (`arr['x']` reads a property).
    index_checks: Vec<(usize, ValueId)>,
    // numeric inference state
    num: Vec<bool>,
    int: Vec<bool>,
    /// `col_numeric[c][k]`: can field `k` of collection `c` only hold numbers?
    col_numeric: Vec<Vec<bool>>,
    binding_numeric: Vec<bool>,
    binding_int: Vec<bool>,
    /// Dominators and loops per function, computed on demand.
    cfg: HashMap<FuncId, (Vec<Loop>, Dominators)>,
    /// The round budget of the numeric fixpoint.
    max_rounds: usize,
}

impl<'m> Analyzer<'m> {
    fn new(m: &'m Module, max_rounds: usize) -> Self {
        let mut func_of = vec![None; m.values.len()];
        for f in &m.functions {
            for b in &f.blocks {
                for &i in &b.insts {
                    func_of[i.index()] = Some(f.id);
                }
            }
        }
        Analyzer {
            m,
            uses: build_uses(m),
            py: m.language == "python",
            func_of,
            stores: HashMap::default(),
            loads: HashMap::default(),
            call_sites: HashMap::default(),
            collections: Vec::new(),
            collection_of_load: HashMap::default(),
            element_of: HashMap::default(),
            index_checks: Vec::new(),
            num: Vec::new(),
            int: Vec::new(),
            col_numeric: Vec::new(),
            binding_numeric: Vec::new(),
            binding_int: Vec::new(),
            cfg: HashMap::default(),
            max_rounds,
        }
    }

    fn inst(&self, v: ValueId) -> &'m Inst {
        self.m.inst(v)
    }

    fn uses_of(&self, v: ValueId) -> Vec<Use> {
        self.uses.of(v).to_vec()
    }

    fn stores_of(&self, b: BindingId) -> &[ValueId] {
        self.stores.get(&b).map_or(&[], Vec::as_slice)
    }

    fn run(mut self) -> Analysis {
        self.find_collections();
        self.shapes_and_uses();
        self.numeric_inference();
        self.element_uses();
        self.bounds_loops_and_sizes();
        // Deduplicate bailout messages, keeping the first of each.
        for c in &mut self.collections {
            let unique: IndexSet<String> = c.bailouts.drain(..).collect();
            c.bailouts = unique.into_iter().collect();
        }
        Analysis {
            language: self.m.language.clone(),
            uses: self.uses,
            is_number: self.num,
            collections: self.collections,
        }
    }

    // ---- 1. candidate collections -------------------------------------------

    fn find_collections(&mut self) {
        let m = self.m;
        for i in m.all_insts() {
            match i.op {
                Op::StoreBinding { binding } => self.stores.entry(binding).or_default().push(i.id),
                Op::LoadBinding { binding } => self.loads.entry(binding).or_default().push(i.id),
                _ => {}
            }
        }

        // Known functions: declared functions whose binding is only ever
        // called directly. For those we know every call site, so parameters
        // can be analyzed interprocedurally (book chapter 99).
        for f in &m.functions {
            let Some(declared) = f.declared_as else {
                continue;
            };
            let st = self.stores_of(declared);
            if st.len() != 1 {
                continue;
            }
            let store = st[0];
            let mut sites = Vec::new();
            let mut ok = true;
            for &l in self.loads.get(&declared).map_or(&[][..], Vec::as_slice) {
                for u in self.uses.of(l) {
                    match u.inst().map(|i| self.inst(i)) {
                        Some(i) if matches!(i.op, Op::Call) && i.args[0] == l && !i.note_is("method") => {
                            sites.push(i.id)
                        }
                        _ => ok = false,
                    }
                }
            }
            // The closure value itself may only be stored, never used otherwise.
            for u in self.uses.of(self.inst(store).args[0]) {
                if u.inst() != Some(store) {
                    ok = false;
                }
            }
            if ok {
                self.call_sites.insert(f.id, sites);
            }
        }

        for binding in &m.bindings {
            if !matches!(binding.kind, BindingKind::Const | BindingKind::Let) {
                continue;
            }
            let st = self.stores_of(binding.id);
            let Some(&first_array_store) =
                st.iter().find(|&&x| matches!(self.inst(self.inst(x).args[0]).op, Op::ArrayEmpty | Op::ArrayNew))
            else {
                continue;
            };
            let init = self.inst(self.inst(first_array_store).args[0]);
            let mut c = Collection {
                binding: binding.id,
                name: binding.name.clone(),
                fields: Vec::new(),
                init: init.id,
                init_records: Vec::new(),
                pushes: Vec::new(),
                index_gets: Vec::new(),
                accesses: Vec::new(),
                length_reads: Vec::new(),
                loops: Vec::new(),
                size_estimate: None,
                size_is_upper_bound: false,
                numeric_fields: IndexSet::new(),
                bailouts: Vec::new(),
                line: init.line(),
            };
            if st.len() > 1 {
                let last = self.inst(*st.last().expect("non-empty"));
                c.bailouts.push(format!(
                    "\"{}\" is reassigned (line {}), so it may not always hold this array",
                    binding.name,
                    line_of(self.m, last)
                ));
            }
            if matches!(init.op, Op::ArrayNew) {
                for &a in &init.args {
                    if !matches!(self.inst(a).op, Op::RecordNew { .. }) {
                        let line = init.src.map_or("undefined".to_string(), |s| s.line.to_string());
                        let what = if self.py {
                            "list literal is not a dataclass constructor call"
                        } else {
                            "array literal is not a plain object literal"
                        };
                        c.bailouts.push(format!("line {line}: an element of the {what}"));
                        break;
                    }
                    c.init_records.push(a);
                }
            }
            let ci = self.collections.len();
            self.collections.push(c);
            for &l in self.loads.get(&binding.id).map_or(&[][..], Vec::as_slice) {
                self.collection_of_load.insert(l, ci);
            }
        }
    }

    /// Why use `u` of value `v` makes `v` escape, for explain output.
    fn describe_use(&self, u: Use, v: ValueId) -> String {
        let i = match u {
            Use::Term { func, .. } => return format!("returned or branched on in {}()", self.m.func(func).name),
            Use::Inst(i) => self.inst(i),
        };
        let line = line_of(self.m, i);
        // Stores: say which operand v was, not just that a store happened.
        match &i.op {
            Op::FieldSet { field } if i.args[0] == v => {
                return format!("modified directly (its .{field} is assigned) at line {line}")
            }
            Op::IndexSet if i.args[0] == v => return format!("written with an index store at line {line}"),
            Op::IndexSet | Op::IndexGet if i.args[1] == v => return format!("used as an index at line {line}"),
            _ => {}
        }
        match &i.op {
            Op::FieldGet { .. } if i.note_is("len") => format!("passed to len() at line {line}"),
            Op::Call if i.note_is("method") => format!("passed to a method call at line {line}"),
            Op::Call => format!("passed to a function call at line {line}"),
            Op::StoreBinding { binding } => {
                format!("stored in another variable ({}) at line {line}", self.m.binding(*binding).name)
            }
            Op::FieldSet { .. } => format!("stored into an object property at line {line}"),
            Op::IndexSet => format!("stored into an array at line {line}"),
            Op::RecordNew { .. } => format!("put inside another object at line {line}"),
            Op::ArrayNew => format!("put inside another array at line {line}"),
            Op::Binop { operator } => format!("compared or combined with \"{operator}\" at line {line}"),
            Op::Opaque => format!(
                "used by code Viscosity doesn't model ({}) at line {line}",
                i.note.as_deref().unwrap_or("undefined")
            ),
            Op::Phi if line == 0 => "merged with other values (a variable reassigned along different paths)".into(),
            Op::Phi => {
                format!("merged with other values (a variable reassigned along different paths) near line {line}")
            }
            op => format!("used by {} at line {line}", op.name()),
        }
    }

    // ---- 2. shapes and uses ---------------------------------------------------

    fn set_shape(&mut self, ci: usize, r: ValueId, location: &str) {
        let Op::RecordNew { fields } = &self.inst(r).op else { unreachable!("set_shape on a record.new") };
        let aliased = self.uses.of(r).len() != 1;
        let c = &mut self.collections[ci];
        if c.fields.is_empty() {
            c.fields = fields.clone();
        } else if c.fields != *fields {
            c.bailouts.push(format!(
                "{location}: records with different fields or field order ({{{}}} vs {{{}}})",
                fields.join(", "),
                c.fields.join(", ")
            ));
        }
        if aliased {
            c.bailouts.push(format!("{location}: the new record is also referenced elsewhere, so it could be aliased"));
        }
    }

    fn shapes_and_uses(&mut self) {
        for ci in 0..self.collections.len() {
            for r in self.collections[ci].init_records.clone() {
                let location = format!("line {}", line_of(self.m, self.inst(r)));
                self.set_shape(ci, r, &location);
            }
            let init = self.collections[ci].init;
            if self.uses.of(init).len() != 1 {
                let c = &mut self.collections[ci];
                c.bailouts.push(format!("line {}: the array is used before being stored in \"{}\"", c.line, c.name));
            }
            let mut work: Vec<ValueId> = self.loads.get(&self.collections[ci].binding).cloned().unwrap_or_default();
            let mut seen_param: HashSet<ValueId> = HashSet::default();
            while let Some(l) = work.pop() {
                for u in self.uses_of(l) {
                    if let Some(follow) = self.use_of_collection(ci, l, u, &mut seen_param) {
                        work.push(follow);
                    }
                }
            }
            let c = &mut self.collections[ci];
            if c.fields.is_empty() && c.bailouts.is_empty() {
                c.bailouts.push("no records are ever added, so there is nothing to lay out".into());
            }
        }
    }

    /// Checks one use `u` of `l`, a value referring to collection `ci`.
    /// Returns a parameter the collection flows into, to be checked next.
    fn use_of_collection(
        &mut self,
        ci: usize,
        l: ValueId,
        u: Use,
        seen_param: &mut HashSet<ValueId>,
    ) -> Option<ValueId> {
        let Some(iv) = u.inst() else {
            let msg = self.describe_use(u, l);
            self.collections[ci].bailouts.push(msg);
            return None;
        };
        let i = self.inst(iv);
        let line = line_of(self.m, i);
        // Passed to a known function: follow it into the parameter.
        let first = i.args.iter().position(|&a| a == l);
        if matches!(i.op, Op::Call) && !i.note_is("method") && first.is_some_and(|p| p > 0) {
            let pos = first.expect("checked");
            let callee = self.inst(i.args[0]);
            let f = match callee.op {
                Op::LoadBinding { binding } => self
                    .m
                    .functions
                    .iter()
                    .find(|g| g.declared_as == Some(binding) && self.call_sites.contains_key(&g.id)),
                _ => None,
            };
            let k = pos - 1;
            let last = i.args.iter().rposition(|&a| a == l).expect("present");
            if let Some(f) = f.filter(|f| last == k + 1 && k < f.params.len()) {
                let all_same = self.call_sites[&f.id].iter().all(|&site| {
                    self.inst(site).args.get(k + 1).is_some_and(|a| self.collection_of_load.get(a) == Some(&ci))
                });
                let (value, binding) = (f.params[k], f.param_bindings[k]);
                if all_same && binding.is_none() {
                    if !seen_param.insert(value) {
                        return None;
                    }
                    self.collection_of_load.insert(value, ci);
                    return Some(value);
                }
                if !all_same {
                    self.collections[ci]
                        .bailouts
                        .push(format!("line {line}: passed to {}(), which is also called with other values", f.name));
                    return None;
                }
            }
        }
        let c = &mut self.collections[ci];
        match &i.op {
            Op::FieldGet { field } if field == "length" && i.args[0] == l => {
                c.length_reads.push(iv);
                return None;
            }
            Op::Push if i.args[0] == l => {
                if i.args.len() != 2 {
                    c.bailouts.push(format!(
                        "line {line}: push with {} arguments (only one record at a time is supported)",
                        i.args.len() - 1
                    ));
                    return None;
                }
                let r = i.args[1];
                if !matches!(self.m.inst(r).op, Op::RecordNew { .. }) {
                    let what = if self.py {
                        "appends something that is not a fresh dataclass instance (dataclasses with non-literal defaults are not modelled)"
                    } else {
                        "pushes something that is not a fresh object literal"
                    };
                    c.bailouts.push(format!("line {line}: {what}"));
                    return None;
                }
                self.set_shape(ci, r, &format!("line {line}"));
                self.collections[ci].pushes.push(iv);
                return None;
            }
            Op::IndexGet if i.args[0] == l => {
                self.index_checks.push((ci, iv));
                c.index_gets.push(IndexGet { inst: iv, bounds_proven: false });
                self.element_of.insert(iv, ci);
                return None;
            }
            Op::FieldGet { field } if i.args[0] == l => {
                c.bailouts
                    .push(format!("line {line}: uses .{field} on the array (only .length and .push are supported)"));
                return None;
            }
            _ => {}
        }
        let msg = format!("the array is {}", self.describe_use(u, l));
        self.collections[ci].bailouts.push(msg);
        None
    }

    // ---- 3. numeric inference (optimistic fixpoint) --------------------------

    fn n(&self, v: ValueId) -> bool {
        self.num.get(v.index()).copied().unwrap_or(false)
    }

    fn i(&self, v: ValueId) -> bool {
        self.int.get(v.index()).copied().unwrap_or(false)
    }

    /// Does every call site of the function owning `param` pass a value
    /// satisfying `pred` at its position?
    fn all_sites(&self, param: &Inst, index: u32, pred: impl Fn(ValueId) -> bool) -> bool {
        let sites = self.func_of[param.id.index()].and_then(|f| self.call_sites.get(&f));
        match sites {
            Some(sites) if !sites.is_empty() => {
                sites.iter().all(|&s| self.inst(s).args.get(index as usize + 1).is_some_and(|&a| pred(a)))
            }
            _ => false,
        }
    }

    /// Field `field` of an element of a collection, if `i` reads one.
    fn element_field(&self, i: &Inst, field: &str) -> Option<(usize, usize)> {
        let ci = *self.element_of.get(&i.args[0])?;
        let k = self.collections[ci].fields.iter().position(|f| f == field)?;
        Some((ci, k))
    }

    /// Python only: is the value provably an int?
    fn compute_int(&self, i: &Inst) -> bool {
        if !self.py {
            return false;
        }
        match &i.op {
            Op::Const(_) => i.note_is("int"),
            Op::Binop { operator } => {
                ["+", "-", "*", "%", "//"].contains(&operator.as_str()) && self.i(i.args[0]) && self.i(i.args[1])
            }
            Op::Unop { operator } => (operator == "-" || operator == "+") && self.i(i.args[0]),
            Op::Intrinsic { name } => INT_RESULT.contains(&name.as_str()),
            Op::Phi => i.args.iter().all(|&a| self.i(a)),
            Op::LoadBinding { binding } => self.binding_int[binding.index()],
            Op::Param { index } => self.all_sites(i, *index, |a| self.i(a)),
            Op::FieldGet { field } => field == "length" && self.collection_of_load.contains_key(&i.args[0]),
            _ => false,
        }
    }

    /// Is the value provably a number? In JavaScript every number is a
    /// double, so "numeric" means "a JS number". In Python a typed
    /// `array('d')` column may only hold floats (an int would come back as a
    /// float and print as 1.0), so "numeric" means "a Python float", and
    /// ints are tracked separately by [`Self::compute_int`].
    fn compute(&self, i: &Inst) -> bool {
        let n = |v: ValueId| self.n(v);
        if self.py {
            let n_or_i = |v: ValueId| self.n(v) || self.i(v);
            match &i.op {
                Op::Const(c) => return matches!(c, Const::Number(_)) && i.note_is("float"),
                Op::Binop { operator } => {
                    let (a, b) = (i.args[0], i.args[1]);
                    return match operator.as_str() {
                        "/" => n_or_i(a) && n_or_i(b),
                        // `**` with a non-integer exponent can be complex:
                        // (-1.0) ** 0.5 is 1j.
                        "**" => n(a) && self.i(b),
                        "+" | "-" | "*" | "%" | "//" => (n(a) && n_or_i(b)) || (self.i(a) && n(b)),
                        _ => false,
                    };
                }
                Op::Unop { operator } => return (operator == "-" || operator == "+") && n(i.args[0]),
                Op::Intrinsic { name } => return !INT_RESULT.contains(&name.as_str()),
                Op::Push => return false,
                Op::FieldGet { field } if field == "length" => return false,
                _ => {}
            }
        }
        match &i.op {
            Op::Const(c) => matches!(c, Const::Number(_)),
            Op::Binop { operator } => ARITH.contains(&operator.as_str()) && n(i.args[0]) && n(i.args[1]),
            Op::Unop { operator } => matches!(operator.as_str(), "-" | "+" | "~") && n(i.args[0]),
            Op::Intrinsic { .. } => true,
            Op::Logical { .. } => n(i.args[0]) && n(i.args[1]),
            Op::Select => n(i.args[1]) && n(i.args[2]),
            Op::Phi => i.args.iter().all(|&a| n(a)),
            Op::LoadBinding { binding } => self.binding_numeric[binding.index()],
            Op::Param { index } => self.all_sites(i, *index, n),
            Op::Push => self.collection_of_load.contains_key(&i.args[0]),
            Op::FieldGet { field } => {
                if field == "length" && self.collection_of_load.contains_key(&i.args[0]) {
                    return true;
                }
                self.element_field(i, field).is_some_and(|(ci, k)| self.col_numeric[ci][k])
            }
            _ => false,
        }
    }

    fn numeric_inference(&mut self) {
        let m = self.m;
        self.col_numeric = self.collections.iter().map(|c| vec![true; c.fields.len()]).collect();
        self.binding_numeric = m
            .bindings
            .iter()
            .map(|b| {
                !self.stores_of(b.id).is_empty()
                    && matches!(b.kind, BindingKind::Const | BindingKind::Let | BindingKind::Var)
            })
            .collect();
        self.binding_int = m.bindings.iter().map(|b| self.py && !self.stores_of(b.id).is_empty()).collect();

        // Start optimistic for values that depend on cycles, then iterate.
        // Values not yet initialized read as `false`, as in the reference.
        self.int = vec![false; m.values.len()];
        self.num = vec![false; m.values.len()];
        for v in &m.values {
            let cyclic = matches!(v.op, Op::Phi | Op::LoadBinding { .. } | Op::Param { .. });
            self.int[v.id.index()] = if self.py && cyclic { true } else { self.compute_int(v) };
        }
        for v in &m.values {
            let optimistic = matches!(v.op, Op::Phi | Op::LoadBinding { .. } | Op::FieldGet { .. } | Op::Param { .. });
            self.num[v.id.index()] = optimistic || self.compute(v);
        }

        let mut converged = false;
        for _round in 0..self.max_rounds {
            let mut changed = false;
            // Values are updated in place (Gauss-Seidel), in id order.
            for v in &m.values {
                let ni = self.compute_int(v);
                if self.int[v.id.index()] != ni {
                    self.int[v.id.index()] = ni;
                    changed = true;
                }
                let nv = self.compute(v);
                if self.num[v.id.index()] != nv {
                    self.num[v.id.index()] = nv;
                    changed = true;
                }
            }
            for b in &m.bindings {
                let nb = self.binding_int[b.id.index()]
                    && self.stores_of(b.id).iter().all(|&s| self.i(self.inst(s).args[0]));
                if self.binding_int[b.id.index()] != nb {
                    self.binding_int[b.id.index()] = nb;
                    changed = true;
                }
            }
            for b in &m.bindings {
                let nb = self.binding_numeric[b.id.index()]
                    && self.stores_of(b.id).iter().all(|&s| self.n(self.inst(s).args[0]));
                if self.binding_numeric[b.id.index()] != nb {
                    self.binding_numeric[b.id.index()] = nb;
                    changed = true;
                }
            }
            for ci in 0..self.collections.len() {
                let c = &self.collections[ci];
                for k in 0..c.fields.len() {
                    let ok = self.col_numeric[ci][k] && self.field_stays_numeric(c, k);
                    if ok != self.col_numeric[ci][k] {
                        self.col_numeric[ci][k] = ok;
                        changed = true;
                    }
                }
            }
            if !changed {
                converged = true;
                break;
            }
        }
        // Fail closed: if the fixpoint did not converge, nothing is proven.
        // (As in the reference, the per-binding facts are left as they are;
        // they are only read through values, which are all reset.)
        if !converged {
            self.num.fill(false);
            self.int.fill(false);
            for col in &mut self.col_numeric {
                col.fill(false);
            }
        }

        // A valid index: a JS number, or a Python int.
        for (ci, iv) in std::mem::take(&mut self.index_checks) {
            let idx = self.inst(iv).args[1];
            let ok = if self.py { self.i(idx) } else { self.n(idx) };
            if !ok {
                let what = if self.py { "an int" } else { "a number" };
                let line = line_of(self.m, self.inst(iv));
                self.collections[ci]
                    .bailouts
                    .push(format!("line {line}: indexes the array with something that may not be {what}"));
            }
        }
    }

    /// Does every record added to `c` and every write to field `k` store a
    /// number?
    fn field_stays_numeric(&self, c: &Collection, k: usize) -> bool {
        let field = &c.fields[k];
        let records = c.init_records.iter().copied().chain(c.pushes.iter().map(|&p| self.inst(p).args[1]));
        let mut ok = true;
        for r in records {
            // A record of a different shape may lack the argument: not numeric.
            if !self.inst(r).args.get(k).is_some_and(|&a| self.n(a)) {
                ok = false;
            }
        }
        for ig in &c.index_gets {
            for u in self.uses.of(ig.inst) {
                if let Some(i) = u.inst().map(|i| self.inst(i)) {
                    if matches!(&i.op, Op::FieldSet { field: f } if f == field)
                        && i.args[0] == ig.inst
                        && !self.n(i.args[1])
                    {
                        ok = false;
                    }
                }
            }
        }
        ok
    }

    // ---- 4. element uses --------------------------------------------------------

    fn element_uses(&mut self) {
        for ci in 0..self.collections.len() {
            for ig in self.collections[ci].index_gets.clone() {
                for u in self.uses_of(ig.inst) {
                    let i = u.inst().map(|i| self.inst(i));
                    let c = &mut self.collections[ci];
                    match i.map(|i| (i, &i.op)) {
                        // Python's `len(e)` lowers to `e.length`, but it
                        // never reads a field.
                        Some((i, Op::FieldGet { field })) if i.args[0] == ig.inst && !i.note_is("len") => {
                            if c.fields.contains(field) {
                                c.accesses.push(ElementAccess {
                                    inst: i.id,
                                    element: ig.inst,
                                    field: field.clone(),
                                    kind: AccessKind::Read,
                                });
                            } else {
                                c.bailouts.push(format!(
                                    "line {}: reads .{field}, which the records don't have",
                                    line_of(self.m, i)
                                ));
                            }
                        }
                        Some((i, Op::FieldSet { field })) if i.args[0] == ig.inst => {
                            if c.fields.contains(field) {
                                c.accesses.push(ElementAccess {
                                    inst: i.id,
                                    element: ig.inst,
                                    field: field.clone(),
                                    kind: AccessKind::Write,
                                });
                            } else {
                                c.bailouts.push(format!(
                                    "line {}: adds a new property .{field} to an element",
                                    line_of(self.m, i)
                                ));
                            }
                        }
                        _ => {
                            // Don't repeat the line: "line 5: an element is ... at line 5"
                            // (or "... near line 5", for phis).
                            let line = line_of(self.m, self.inst(ig.inst));
                            let why = self.describe_use(u, ig.inst);
                            // (`/ (?:at|near) line N$/` in the reference.)
                            let why = [" at line ", " near line "]
                                .iter()
                                .find_map(|p| why.strip_suffix(&format!("{p}{line}")))
                                .unwrap_or(&why);
                            let msg = format!("line {line}: an element is {why}");
                            self.collections[ci].bailouts.push(msg);
                        }
                    }
                }
            }
            // Fields that may hold non-numbers still get a column, just a
            // plain array instead of a Float64Array (book chapter 108).
            let c = &mut self.collections[ci];
            for (k, f) in c.fields.iter().enumerate() {
                if self.col_numeric[ci][k] {
                    c.numeric_fields.insert(f.clone());
                }
            }
        }
    }

    // ---- 5. bounds, loops, access patterns, size --------------------------------

    fn ensure_cfg(&mut self, f: FuncId) {
        let m = self.m;
        self.cfg.entry(f).or_insert_with(|| {
            let idom = dominators(m.func(f));
            (natural_loops(m.func(f), &idom), idom)
        });
    }

    /// Is `v` provably a non-negative integer? (constants, sums, counting
    /// loops). `seen` is shared across the whole query, as in the reference:
    /// a value reached twice is assumed fine the second time (which is what
    /// makes cycles through phis work).
    fn non_neg_int(&self, v: &Inst, seen: &mut HashSet<ValueId>) -> bool {
        if !seen.insert(v.id) {
            return true;
        }
        match &v.op {
            Op::Const(Const::Number(x)) => x.is_finite() && x.trunc() == *x && *x >= 0.0,
            Op::Binop { operator } => {
                (operator == "+" || operator == "*") && v.args.iter().all(|&a| self.non_neg_int(self.inst(a), seen))
            }
            Op::Unop { operator } => operator == "+" && self.non_neg_int(self.inst(v.args[0]), seen),
            Op::Phi => v.args.iter().all(|&a| self.non_neg_int(self.inst(a), seen)),
            _ => false,
        }
    }

    /// Is `phi` a counting induction variable: start >= 0 (or exactly 0),
    /// step +1 each trip?
    fn is_counting_phi(&self, phi: &Inst, zero_start: bool) -> bool {
        if !matches!(phi.op, Op::Phi) || phi.args.len() != 2 {
            return false;
        }
        for (s0, s1) in [(0, 1), (1, 0)] {
            let start = self.inst(phi.args[s0]);
            let step = self.inst(phi.args[s1]);
            if step.op.operator() != Some("+") || !matches!(step.op, Op::Binop { .. }) {
                continue;
            }
            let (x, y) = (self.inst(step.args[0]), self.inst(step.args[1]));
            let base = if matches!(&x.op, Op::Unop { operator } if operator == "+") { self.inst(x.args[0]) } else { x };
            if base.id != phi.id || y.op != Op::Const(Const::Number(1.0)) {
                continue;
            }
            let start_ok = if zero_start {
                start.op == Op::Const(Const::Number(0.0))
            } else {
                self.non_neg_int(start, &mut HashSet::default())
            };
            if start_ok {
                return true;
            }
        }
        false
    }

    /// The conjuncts of a branch condition: `a && b && c` -> `[a, b, c]`.
    fn conjuncts(&self, v: &'m Inst, out: &mut Vec<&'m Inst>) {
        match &v.op {
            Op::Logical { operator } if operator == "&&" => {
                for &a in &v.args {
                    self.conjuncts(self.inst(a), out);
                }
            }
            _ => out.push(v),
        }
    }

    /// Iterations of loop `l` per execution, for `for (i = 0; i < N; i++)`
    /// with a constant `N`.
    fn trip_count(&self, f: &Func, l: &Loop) -> Option<f64> {
        let Terminator::CondBr { cond, .. } = f.block(l.header).term else {
            return None;
        };
        let cond = self.inst(cond);
        let op = cond.op.operator().filter(|_| matches!(cond.op, Op::Binop { .. }))?;
        if op != "<" && op != "<=" {
            return None;
        }
        let (iv, bound) = (self.inst(cond.args[0]), self.inst(cond.args[1]));
        let Op::Const(Const::Number(n)) = bound.op else {
            return None;
        };
        if !self.is_counting_phi(iv, true) {
            return None;
        }
        Some(if op == "<" { n } else { n + 1.0 })
    }

    /// Does a push in block `push` run every time its enclosing regions do?
    ///
    /// Regions go from the outermost (the function, whose exits are its
    /// `return`/`throw` blocks) to the innermost enclosing loop (whose exits
    /// are its latches: body blocks with an edge back to the header). In
    /// each region, the next region in (the inner loop's header), or the
    /// push itself for the innermost, must dominate every exit. If not, the
    /// push runs only on some paths and counting it every time gives a
    /// maximum, not an estimate.
    fn push_runs_on_every_path(&self, f: &Func, loops: &[Loop], idom: &Dominators, push: BlockId) -> bool {
        let mut enclosing: Vec<&Loop> = loops.iter().filter(|l| l.body.contains(&push)).collect();
        enclosing.sort_by_key(|l| std::cmp::Reverse(l.body.len())); // outermost first (stable)
        let region_ok = |header: Option<&Loop>, must: BlockId| {
            f.blocks
                .iter()
                .filter(|b| idom.contains(b.id))
                .filter(|b| match header {
                    None => matches!(b.term, Terminator::Return { .. } | Terminator::Throw { .. }),
                    Some(l) => l.body.contains(&b.id) && b.term.successors().contains(&l.header),
                })
                .all(|b| idom.dominates(must, b.id))
        };
        let must = |k: usize| enclosing.get(k).map_or(push, |l| l.header);
        let mut ok = region_ok(None, must(0));
        for (k, l) in enclosing.iter().enumerate() {
            ok &= region_ok(Some(l), must(k + 1));
        }
        ok
    }

    fn bounds_loops_and_sizes(&mut self) {
        let m = self.m;
        for ci in 0..self.collections.len() {
            let funcs: Vec<FuncId> = (self.collections[ci].index_gets.iter().map(|g| g.inst))
                .chain(self.collections[ci].accesses.iter().map(|a| a.inst))
                .chain(self.collections[ci].pushes.iter().copied())
                .filter_map(|v| self.func_of[v.index()])
                .collect();
            for f in funcs {
                self.ensure_cfg(f);
            }

            // Bounds: an index that counts up from >= 0 in a loop guarded by
            // `idx < c.length`, accessed where the guard holds.
            let mut proven = Vec::new();
            for ig in &self.collections[ci].index_gets {
                let gi = self.inst(ig.inst);
                let f = self.func_of[gi.id.index()].expect("live");
                let (loops, idom) = &self.cfg[&f];
                let idx = self.inst(gi.args[1]);
                // The loop that counts with idx: any loop (not just the
                // innermost) whose header defines idx and contains the access.
                let l = loops.iter().find(|lp| lp.header == idx.block && lp.body.contains(&gi.block));
                let Some(l) = l.filter(|_| self.is_counting_phi(idx, false)) else {
                    proven.push(false);
                    continue;
                };
                let Terminator::CondBr { cond, then, .. } = m.func(f).block(l.header).term else {
                    proven.push(false);
                    continue;
                };
                let mut conds = Vec::new();
                self.conjuncts(self.inst(cond), &mut conds);
                let guarded = conds.iter().any(|cond| {
                    if cond.op.operator() != Some("<") || !matches!(cond.op, Op::Binop { .. }) || cond.args[0] != idx.id
                    {
                        return false;
                    }
                    let bound = self.inst(cond.args[1]);
                    matches!(&bound.op, Op::FieldGet { field } if field == "length")
                        && self.collection_of_load.get(&bound.args[0]) == Some(&ci)
                });
                proven.push(guarded && idom.dominates(then, gi.block));
            }
            for (ig, p) in self.collections[ci].index_gets.iter_mut().zip(proven) {
                ig.bounds_proven |= p;
            }

            // Access patterns per loop.
            let mut by_loop: IndexMap<(FuncId, Option<BlockId>), LoopAccess> = IndexMap::new();
            for a in &self.collections[ci].accesses {
                let ai = self.inst(a.inst);
                let f = self.func_of[ai.id.index()].expect("live");
                let func = m.func(f);
                let (loops, _) = &self.cfg[&f];
                let l = loop_of(loops, ai.block);
                let la = by_loop.entry((f, l.map(|l| l.header))).or_insert_with(|| {
                    let line = match l.map(|l| &func.block(l.header).term) {
                        Some(Terminator::CondBr { src, .. }) => src.map_or(line_of(self.m, ai), |s| s.line),
                        _ => line_of(self.m, ai),
                    };
                    LoopAccess {
                        func: func.name.clone(),
                        line,
                        depth: l.map_or(0, |l| l.depth),
                        reads: IndexSet::new(),
                        writes: IndexSet::new(),
                        trips: match l {
                            Some(l) => self.trip_count(func, l),
                            None => Some(1.0),
                        },
                    }
                });
                match a.kind {
                    AccessKind::Read => la.reads.insert(a.field.clone()),
                    AccessKind::Write => la.writes.insert(a.field.clone()),
                };
            }
            let mut loops: Vec<LoopAccess> = by_loop.into_values().collect();
            loops.sort_by_key(|l| l.line); // stable, like Array.prototype.sort

            // Size estimate: literal elements + pushes inside loops with
            // known trip counts.
            let c = &self.collections[ci];
            let mut size = c.init_records.len() as f64;
            let mut known = true;
            let mut upper = false;
            for &p in &c.pushes {
                let pi = self.inst(p);
                let f = self.func_of[p.index()].expect("live");
                let (cfg_loops, idom) = &self.cfg[&f];
                if !self.push_runs_on_every_path(m.func(f), cfg_loops, idom, pi.block) {
                    upper = true;
                }
                let mut mult = 1.0;
                for l in cfg_loops {
                    if !l.body.contains(&pi.block) {
                        continue;
                    }
                    match self.trip_count(m.func(f), l) {
                        Some(t) => mult *= t,
                        None => {
                            known = false;
                            break;
                        }
                    }
                }
                if f != m.main {
                    known = false; // pushes in a function: depends on how often it's called
                }
                size += mult;
            }
            let c = &mut self.collections[ci];
            c.loops = loops;
            c.size_estimate = known.then_some(size);
            c.size_is_upper_bound = known && upper;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::FunctionBuilder;
    use viscosity_vir::Terminator;

    /// `return 1 + 2` as VIR.
    fn sum_module() -> (Module, ValueId) {
        let mut m = Module::new("javascript", "");
        let mut fb = FunctionBuilder::<u32>::new(&mut m, "<module>", None);
        let a = fb.constant(&mut m, Const::Number(1.0), None);
        let b = fb.constant(&mut m, Const::Number(2.0), None);
        let s = fb.emit(&mut m, Op::Binop { operator: "+".into() }, vec![a, b], None, None);
        fb.terminate(&mut m, Terminator::Return { value: Some(s), src: None });
        fb.finish(&mut m);
        (m, s)
    }

    #[test]
    fn numeric_inference_converges() {
        let (m, s) = sum_module();
        assert!(analyze(&m).is_number(s));
    }

    #[test]
    fn numeric_inference_fails_closed_without_convergence() {
        // With no rounds the fixpoint cannot be confirmed: nothing is proven.
        let (m, s) = sum_module();
        let a = Analyzer::new(&m, 0).run();
        assert!(!a.is_number(s));
        assert!(a.is_number.iter().all(|n| !n));
    }
}
