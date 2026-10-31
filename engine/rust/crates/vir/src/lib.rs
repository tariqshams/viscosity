//! VIR: Viscosity's intermediate representation (book chapter 91).
//!
//! VIR is language-neutral: a front-end plugin lowers its syntax tree into
//! VIR, the analyses run on VIR, and the plugin uses the resulting plan to
//! rewrite its own source. A VIR function is a control-flow graph of basic
//! blocks in SSA form: every local, non-captured variable becomes values that
//! are assigned exactly once, joined by `phi` instructions. Variables that
//! closures capture, or that live at module level, are *bindings*, read and
//! written with `loadBinding` / `storeBinding`.
//!
//! Records and collections are first-class (`record.new`, `index.get`,
//! `field.get`, `push`, `length`), so the layout analyses never see JS- or
//! Python-specific syntax.
//!
//! Everything lives in arenas owned by the [`Module`] and is referred to by
//! small typed ids ([`ValueId`], [`BlockId`], [`FuncId`], [`BindingId`]).
//! Instruction ids are global to the module, so a value id alone identifies
//! an instruction.

use std::collections::BTreeSet;
use std::fmt;

mod number;
pub use number::js_number;

macro_rules! id_type {
    ($(#[$doc:meta])* $name:ident, $prefix:literal) => {
        $(#[$doc])*
        #[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
        pub struct $name(pub u32);

        impl $name {
            /// The id as an index into its arena.
            #[inline]
            pub fn index(self) -> usize {
                self.0 as usize
            }
        }

        impl fmt::Debug for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, concat!($prefix, "{}"), self.0)
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "{}", self.0)
            }
        }
    };
}

id_type!(
    /// An instruction, and the value it produces (`%n` in listings).
    ValueId, "%"
);
id_type!(
    /// A basic block within one function (`bN` in listings).
    BlockId, "b"
);
id_type!(
    /// A function of the module.
    FuncId, "f"
);
id_type!(
    /// A variable that is not in SSA form (captured, module-level, ...).
    BindingId, "binding"
);

/// An opaque handle to the plugin's own syntax node. VIR never looks inside
/// it; the front-end that produced it uses it again when rewriting source.
/// (The TypeScript reference stores the ESTree node itself here.)
#[derive(Copy, Clone, PartialEq, Eq, Hash, Debug, Default)]
pub struct NodeRef(pub u32);

/// Where an instruction came from, for rewriting and for explain output.
///
/// `start` and `end` are offsets into the plugin's source text in whatever
/// unit the plugin slices with; the JavaScript plugin uses UTF-8 byte
/// offsets, which slice Rust strings exactly as the TS reference's UTF-16
/// offsets slice JavaScript strings.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct SourceRef {
    pub node: NodeRef,
    pub start: u32,
    pub end: u32,
    /// 1-based line number of `start`.
    pub line: u32,
}

/// A constant: `number | string | boolean | null | undefined`.
#[derive(Clone, PartialEq, Debug)]
pub enum Const {
    Number(f64),
    Str(String),
    Bool(bool),
    Null,
    Undefined,
}

impl Const {
    /// The value if it is a number (`typeof v === 'number'`).
    pub fn as_number(&self) -> Option<f64> {
        match self {
            Const::Number(n) => Some(*n),
            _ => None,
        }
    }

    /// JSON-ish rendering, as `JSON.stringify` prints it in listings.
    fn listing(&self) -> String {
        match self {
            Const::Number(n) if n.is_finite() => js_number(*n),
            Const::Number(_) | Const::Null => "null".into(),
            Const::Str(s) => format!("{s:?}"),
            Const::Bool(b) => b.to_string(),
            Const::Undefined => "undefined".into(),
        }
    }
}

/// The operation of an instruction. The comment on each variant says what
/// its `args` hold.
#[derive(Clone, PartialEq, Debug)]
pub enum Op {
    /// no args
    Const(Const),
    /// no args; the parameter's position
    Param { index: u32 },
    /// one arg per predecessor, in predecessor order
    Phi,
    /// `[a, b]`
    Binop { operator: String },
    /// `[a]`
    Unop { operator: String },
    /// `&&`, `||`, `??`: `[a, b]` (short-circuiting is not modelled)
    Logical { operator: String },
    /// `a ? b : c`: `[a, b, c]`
    Select,
    /// no args
    LoadBinding { binding: BindingId },
    /// `[value]`
    StoreBinding { binding: BindingId },
    /// one arg per field, in field order
    RecordNew { fields: Vec<String> },
    /// the elements
    ArrayNew,
    /// `[]` with no elements
    ArrayEmpty,
    /// `[obj]`
    FieldGet { field: String },
    /// `[obj, value]`
    FieldSet { field: String },
    /// `[arr, index]`
    IndexGet,
    /// `[arr, index, value]`
    IndexSet,
    /// `[arr]`
    Length,
    /// `[arr, ...values]`
    Push,
    /// a known pure numeric function such as `Math.sqrt`; the arguments
    Intrinsic { name: String },
    /// an unknown call: `[callee, ...args]`
    Call,
    /// a function value; captured bindings are on the [`Func`]
    Closure { func: FuncId },
    /// anything not modelled: every arg escapes, the result is unknown
    Opaque,
}

impl Op {
    /// The operation's name as the TS reference spells it (used in explain
    /// text: "used by index.set at line 4").
    pub fn name(&self) -> &'static str {
        match self {
            Op::Const(_) => "const",
            Op::Param { .. } => "param",
            Op::Phi => "phi",
            Op::Binop { .. } => "binop",
            Op::Unop { .. } => "unop",
            Op::Logical { .. } => "logical",
            Op::Select => "select",
            Op::LoadBinding { .. } => "loadBinding",
            Op::StoreBinding { .. } => "storeBinding",
            Op::RecordNew { .. } => "record.new",
            Op::ArrayNew => "array.new",
            Op::ArrayEmpty => "array.empty",
            Op::FieldGet { .. } => "field.get",
            Op::FieldSet { .. } => "field.set",
            Op::IndexGet => "index.get",
            Op::IndexSet => "index.set",
            Op::Length => "length",
            Op::Push => "push",
            Op::Intrinsic { .. } => "intrinsic",
            Op::Call => "call",
            Op::Closure { .. } => "closure",
            Op::Opaque => "opaque",
        }
    }

    /// The operator of a `binop`, `unop` or `logical`.
    pub fn operator(&self) -> Option<&str> {
        match self {
            Op::Binop { operator } | Op::Unop { operator } | Op::Logical { operator } => Some(operator),
            _ => None,
        }
    }

    /// The field of a `field.get` / `field.set`.
    pub fn field(&self) -> Option<&str> {
        match self {
            Op::FieldGet { field } | Op::FieldSet { field } => Some(field),
            _ => None,
        }
    }

    /// The binding of a `loadBinding` / `storeBinding`.
    pub fn binding(&self) -> Option<BindingId> {
        match self {
            Op::LoadBinding { binding } | Op::StoreBinding { binding } => Some(*binding),
            _ => None,
        }
    }
}

/// One instruction. Its id is also the id of the value it produces.
#[derive(Clone, Debug)]
pub struct Inst {
    pub id: ValueId,
    pub op: Op,
    pub args: Vec<ValueId>,
    pub block: BlockId,
    /// A short annotation: for `opaque`, a description used in explain
    /// output; `"method"` on method calls; `"for-of"` on the element read of
    /// a `for...of` loop; `"int"`/`"float"` on Python numeric constants.
    pub note: Option<String>,
    pub src: Option<SourceRef>,
}

impl Inst {
    /// The source line, or 0 when the instruction has no source.
    pub fn line(&self) -> u32 {
        self.src.map_or(0, |s| s.line)
    }

    pub fn note_is(&self, note: &str) -> bool {
        self.note.as_deref() == Some(note)
    }
}

/// How a block ends.
#[derive(Clone, Debug, PartialEq)]
pub enum Terminator {
    Br {
        target: BlockId,
    },
    CondBr {
        cond: ValueId,
        then: BlockId,
        else_: BlockId,
        src: Option<SourceRef>,
    },
    Return {
        value: Option<ValueId>,
        src: Option<SourceRef>,
    },
    Throw {
        value: ValueId,
        src: Option<SourceRef>,
    },
    /// Not terminated (yet): while building, this marks an open block.
    Unreachable,
}

impl Terminator {
    /// Successor blocks, in order (`then` before `else`).
    pub fn successors(&self) -> Vec<BlockId> {
        match self {
            Terminator::Br { target } => vec![*target],
            Terminator::CondBr { then, else_, .. } => vec![*then, *else_],
            _ => vec![],
        }
    }
}

#[derive(Clone, Debug)]
pub struct Block {
    pub id: BlockId,
    /// The block's instructions, in order.
    pub insts: Vec<ValueId>,
    pub term: Terminator,
    pub preds: Vec<BlockId>,
}

#[derive(Clone, Debug)]
pub struct Func {
    pub id: FuncId,
    pub name: String,
    pub params: Vec<ValueId>,
    /// The binding each parameter is bound to, if any.
    pub param_bindings: Vec<Option<BindingId>>,
    pub blocks: Vec<Block>,
    pub entry: BlockId,
    /// Bindings this function reads or writes that belong to an outer scope.
    pub captures: BTreeSet<BindingId>,
    /// The binding a function declaration is stored in, if any.
    pub declared_as: Option<BindingId>,
    pub src: Option<SourceRef>,
}

impl Func {
    pub fn block(&self, b: BlockId) -> &Block {
        &self.blocks[b.index()]
    }
}

/// What kind of declaration introduced a binding.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum BindingKind {
    Const,
    Let,
    Var,
    Param,
    Function,
    Class,
    Import,
    Global,
    /// `using` / `await using` (explicit resource management)
    Using,
}

#[derive(Clone, Debug)]
pub struct Binding {
    pub id: BindingId,
    pub name: String,
    pub kind: BindingKind,
    /// The function whose scope declares it (`None` for implicit globals).
    pub owner: Option<FuncId>,
    pub src: Option<SourceRef>,
}

/// A whole program in VIR.
#[derive(Clone, Debug)]
pub struct Module {
    /// e.g. `"javascript"`, `"python"`
    pub language: String,
    pub source: String,
    pub functions: Vec<Func>,
    pub bindings: Vec<Binding>,
    /// Every instruction ever created, by id (including dead ones, such as
    /// removed trivial phis, which are no longer in any block).
    pub values: Vec<Inst>,
    /// The top-level code.
    pub main: FuncId,
}

impl Module {
    pub fn new(language: &str, source: &str) -> Self {
        Module {
            language: language.to_string(),
            source: source.to_string(),
            functions: Vec::new(),
            bindings: Vec::new(),
            values: Vec::new(),
            main: FuncId(0),
        }
    }

    #[inline]
    pub fn inst(&self, v: ValueId) -> &Inst {
        &self.values[v.index()]
    }

    #[inline]
    pub fn inst_mut(&mut self, v: ValueId) -> &mut Inst {
        &mut self.values[v.index()]
    }

    #[inline]
    pub fn func(&self, f: FuncId) -> &Func {
        &self.functions[f.index()]
    }

    #[inline]
    pub fn binding(&self, b: BindingId) -> &Binding {
        &self.bindings[b.index()]
    }

    /// Every live instruction (one that is in a block), function by function,
    /// block by block, in order.
    pub fn all_insts(&self) -> impl Iterator<Item = &Inst> + '_ {
        self.functions
            .iter()
            .flat_map(|f| f.blocks.iter())
            .flat_map(move |b| b.insts.iter().map(move |&v| self.inst(v)))
    }
}

/// A use of a value: by an instruction, or by a block's terminator.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Use {
    Inst(ValueId),
    Term { func: FuncId, block: BlockId },
}

impl Use {
    /// The using instruction, if the use is not a terminator.
    pub fn inst(self) -> Option<ValueId> {
        match self {
            Use::Inst(v) => Some(v),
            Use::Term { .. } => None,
        }
    }
}

/// `uses[v]` lists every use of value `v`, in program order. An instruction
/// that uses a value twice appears twice, exactly as in the TS reference.
#[derive(Clone, Debug, Default)]
pub struct Uses(Vec<Vec<Use>>);

impl Uses {
    pub fn of(&self, v: ValueId) -> &[Use] {
        self.0.get(v.index()).map_or(&[], |u| u.as_slice())
    }
}

/// Builds the use lists of every live value.
pub fn build_uses(m: &Module) -> Uses {
    let mut uses = vec![Vec::new(); m.values.len()];
    for f in &m.functions {
        for b in &f.blocks {
            for &i in &b.insts {
                for &a in &m.inst(i).args {
                    uses[a.index()].push(Use::Inst(i));
                }
            }
            let term = Use::Term { func: f.id, block: b.id };
            match &b.term {
                Terminator::CondBr { cond, .. } => uses[cond.index()].push(term),
                Terminator::Return { value: Some(v), .. } => uses[v.index()].push(term),
                Terminator::Throw { value, .. } => uses[value.index()].push(term),
                _ => {}
            }
        }
    }
    Uses(uses)
}

/// A readable listing of a function, for debugging and the book.
pub fn print_func(m: &Module, f: &Func) -> String {
    let pct = |v: &ValueId| format!("%{}", v.0);
    let mut out = vec![format!("func {}({}):", f.name, f.params.iter().map(pct).collect::<Vec<_>>().join(", "))];
    for b in &f.blocks {
        let preds = if b.preds.is_empty() {
            String::new()
        } else {
            format!("  ; preds {}", b.preds.iter().map(|p| format!("b{}", p.0)).collect::<Vec<_>>().join(" "))
        };
        out.push(format!("  b{}:{preds}", b.id.0));
        for &v in &b.insts {
            let i = m.inst(v);
            let args = i.args.iter().map(pct).collect::<Vec<_>>().join(", ");
            let id = i.id.0;
            let line = match &i.op {
                Op::Const(c) => format!("%{id} = const {}", c.listing()),
                Op::Binop { operator } | Op::Unop { operator } | Op::Logical { operator } => {
                    format!("%{id} = {} {operator} {args}", i.op.name())
                }
                Op::LoadBinding { binding } => format!("%{id} = load {}", m.binding(*binding).name),
                Op::StoreBinding { binding } => {
                    format!("store {}, {args}", m.binding(*binding).name)
                }
                Op::RecordNew { fields } => {
                    format!("%{id} = record {{{}}} {args}", fields.join(", "))
                }
                Op::FieldGet { field } => format!("%{id} = field.get {args} .{field}"),
                Op::FieldSet { field } => format!("field.set {args} .{field}"),
                Op::Intrinsic { name } => format!("%{id} = {name}({args})"),
                Op::Closure { func } => format!("%{id} = closure {}", m.func(*func).name),
                Op::Opaque => format!("%{id} = opaque({}) {args}", i.note.as_deref().unwrap_or("")),
                op => format!("%{id} = {} {args}", op.name()),
            };
            out.push(format!("    {line}"));
        }
        out.push(match &b.term {
            Terminator::Br { target } => format!("    br b{}", target.0),
            Terminator::CondBr { cond, then, else_, .. } => {
                format!("    condbr %{}, b{}, b{}", cond.0, then.0, else_.0)
            }
            Terminator::Return { value: None, .. } => "    return".into(),
            Terminator::Return { value: Some(v), .. } => format!("    return %{}", v.0),
            Terminator::Throw { value, .. } => format!("    throw %{}", value.0),
            Terminator::Unreachable => "    unreachable".into(),
        });
    }
    out.join("\n")
}
