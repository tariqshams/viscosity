//! Builds VIR functions, including SSA construction on the fly.
//!
//! SSA construction follows Braun, Buchwald, Hack, Leißa, Mallon and
//! Zwinkau, "Simple and Efficient Construction of Static Single Assignment
//! Form" (CC 2013): variables are read and written per block; reading in a
//! block with several predecessors creates a phi; blocks whose predecessors
//! aren't all known yet ("unsealed", e.g. loop headers) get incomplete phis
//! that are filled in when the block is sealed. Trivial phis are removed.
//!
//! The builder does not own the [`Module`]: every method that touches it
//! takes `&mut Module`. That lets a front-end keep one module and switch
//! between several function builders (one per nested function) freely.

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};
use std::hash::Hash;

use indexmap::IndexMap;
use viscosity_vir::{
    Binding, BindingId, BindingKind, Block, BlockId, Const, Func, FuncId, Inst, Module, Op, SourceRef, Terminator,
    ValueId,
};

/// Adds a binding to the module and returns its id.
pub fn add_binding(
    m: &mut Module,
    name: &str,
    kind: BindingKind,
    owner: Option<FuncId>,
    src: Option<SourceRef>,
) -> BindingId {
    let id = BindingId(m.bindings.len() as u32);
    m.bindings.push(Binding { id, name: name.to_string(), kind, owner, src });
    id
}

/// Builds one function. `K` is the front-end's variable key: anything that
/// names a variable uniquely (the JS plugin uses the resolved binding, or a
/// synthetic key for a `for...of` index).
pub struct FunctionBuilder<K> {
    pub func: FuncId,
    /// The block instructions are currently appended to.
    pub current: BlockId,
    defs: HashMap<BlockId, HashMap<K, ValueId>>,
    sealed: HashSet<BlockId>,
    /// Incomplete phis of unsealed blocks. Insertion order matters: sealing
    /// fills them in this order, which decides value numbering and the
    /// order of instructions, exactly as in the TS reference.
    incomplete: HashMap<BlockId, IndexMap<K, ValueId>>,
}

impl<K: Clone + Eq + Hash> FunctionBuilder<K> {
    /// Starts a new function with a sealed entry block.
    pub fn new(m: &mut Module, name: &str, src: Option<SourceRef>) -> Self {
        let id = FuncId(m.functions.len() as u32);
        m.functions.push(Func {
            id,
            name: name.to_string(),
            params: Vec::new(),
            param_bindings: Vec::new(),
            blocks: Vec::new(),
            entry: BlockId(0),
            captures: Default::default(),
            declared_as: None,
            src,
        });
        let mut fb = FunctionBuilder {
            func: id,
            current: BlockId(0),
            defs: HashMap::default(),
            sealed: HashSet::default(),
            incomplete: HashMap::default(),
        };
        let entry = fb.new_block(m);
        fb.current = entry;
        fb.func_mut(m).entry = entry;
        fb.seal(m, entry);
        fb
    }

    pub fn func_mut<'m>(&self, m: &'m mut Module) -> &'m mut Func {
        &mut m.functions[self.func.index()]
    }

    fn block_mut<'m>(&self, m: &'m mut Module, b: BlockId) -> &'m mut Block {
        &mut m.functions[self.func.index()].blocks[b.index()]
    }

    pub fn new_block(&mut self, m: &mut Module) -> BlockId {
        let f = self.func_mut(m);
        let id = BlockId(f.blocks.len() as u32);
        f.blocks.push(Block { id, insts: Vec::new(), term: Terminator::Unreachable, preds: Vec::new() });
        id
    }

    /// Has the current block already been terminated?
    pub fn terminated(&self, m: &Module) -> bool {
        m.func(self.func).block(self.current).term != Terminator::Unreachable
    }

    /// Appends an instruction to the current block.
    pub fn emit(
        &mut self,
        m: &mut Module,
        op: Op,
        args: Vec<ValueId>,
        note: Option<&str>,
        src: Option<SourceRef>,
    ) -> ValueId {
        let id = ValueId(m.values.len() as u32);
        m.values.push(Inst { id, op, args, block: self.current, note: note.map(str::to_string), src });
        let cur = self.current;
        self.block_mut(m, cur).insts.push(id);
        id
    }

    pub fn constant(&mut self, m: &mut Module, value: Const, src: Option<SourceRef>) -> ValueId {
        self.emit(m, Op::Const(value), vec![], None, src)
    }

    /// Ends the current block. Code after a return or break is unreachable,
    /// so terminating an already-terminated block does nothing.
    pub fn terminate(&mut self, m: &mut Module, t: Terminator) {
        if self.terminated(m) {
            return;
        }
        let succ = t.successors();
        let cur = self.current;
        self.block_mut(m, cur).term = t;
        for s in succ {
            self.block_mut(m, s).preds.push(cur);
        }
    }

    pub fn br(&mut self, m: &mut Module, target: BlockId) {
        self.terminate(m, Terminator::Br { target });
    }

    pub fn switch_to(&mut self, b: BlockId) {
        self.current = b;
    }

    // ---- SSA (Braun et al.) ------------------------------------------------

    pub fn write_variable(&mut self, v: K, block: BlockId, value: ValueId) {
        self.defs.entry(block).or_default().insert(v, value);
    }

    /// Reads `v` in the current block.
    pub fn read(&mut self, m: &mut Module, v: &K) -> ValueId {
        let cur = self.current;
        self.read_variable(m, v, cur)
    }

    pub fn read_variable(&mut self, m: &mut Module, v: &K, block: BlockId) -> ValueId {
        if let Some(&local) = self.defs.get(&block).and_then(|d| d.get(v)) {
            return local;
        }
        self.read_variable_recursive(m, v, block)
    }

    /// Creates an empty phi at the start of `block`.
    fn new_phi(&mut self, m: &mut Module, block: BlockId) -> ValueId {
        let id = ValueId(m.values.len() as u32);
        m.values.push(Inst { id, op: Op::Phi, args: vec![], block, note: None, src: None });
        self.block_mut(m, block).insts.insert(0, id);
        id
    }

    fn read_variable_recursive(&mut self, m: &mut Module, v: &K, block: BlockId) -> ValueId {
        let preds = m.func(self.func).block(block).preds.clone();
        let val = if !self.sealed.contains(&block) {
            let phi = self.new_phi(m, block);
            self.incomplete.entry(block).or_default().insert(v.clone(), phi);
            phi
        } else if preds.len() == 1 {
            self.read_variable(m, v, preds[0])
        } else if preds.is_empty() {
            // Read before any write on this path: the variable is undefined.
            let entry = m.func(self.func).entry;
            let id = ValueId(m.values.len() as u32);
            m.values.push(Inst {
                id,
                op: Op::Const(Const::Undefined),
                args: vec![],
                block: entry,
                note: None,
                src: None,
            });
            self.block_mut(m, entry).insts.insert(0, id);
            id
        } else {
            let phi = self.new_phi(m, block);
            self.write_variable(v.clone(), block, phi); // break cycles
            self.add_phi_operands(m, v, phi)
        };
        self.write_variable(v.clone(), block, val);
        val
    }

    fn add_phi_operands(&mut self, m: &mut Module, v: &K, phi: ValueId) -> ValueId {
        let block = m.inst(phi).block;
        let preds = m.func(self.func).block(block).preds.clone();
        for p in preds {
            let a = self.read_variable(m, v, p);
            m.inst_mut(phi).args.push(a);
        }
        self.try_remove_trivial_phi(m, phi)
    }

    fn try_remove_trivial_phi(&mut self, m: &mut Module, phi: ValueId) -> ValueId {
        let mut same: Option<ValueId> = None;
        for &op in &m.inst(phi).args {
            if Some(op) == same || op == phi {
                continue;
            }
            if same.is_some() {
                return phi; // merges at least two values: not trivial
            }
            same = Some(op);
        }
        let Some(same) = same else {
            // Unreachable or undefined: replace with an undefined constant.
            let p = m.inst_mut(phi);
            p.op = Op::Const(Const::Undefined);
            p.args.clear();
            return phi;
        };
        // Replace every use of the phi with `same` (in this function only:
        // SSA values never cross functions).
        let mut users = Vec::new();
        let func = self.func.index();
        for bi in 0..m.functions[func].blocks.len() {
            for ii in 0..m.functions[func].blocks[bi].insts.len() {
                let i = m.functions[func].blocks[bi].insts[ii];
                if i == phi || !m.inst(i).args.contains(&phi) {
                    continue;
                }
                let inst = m.inst_mut(i);
                for a in inst.args.iter_mut() {
                    if *a == phi {
                        *a = same;
                    }
                }
                if inst.op == Op::Phi {
                    users.push(i);
                }
            }
            match &mut m.functions[func].blocks[bi].term {
                Terminator::CondBr { cond, .. } if *cond == phi => *cond = same,
                Terminator::Return { value: Some(v), .. } if *v == phi => *v = same,
                Terminator::Throw { value, .. } if *value == phi => *value = same,
                _ => {}
            }
        }
        for defs in self.defs.values_mut() {
            for val in defs.values_mut() {
                if *val == phi {
                    *val = same;
                }
            }
        }
        // Remove the phi from its block.
        let block = m.inst(phi).block;
        self.block_mut(m, block).insts.retain(|&i| i != phi);
        let p = m.inst_mut(phi);
        p.op = Op::Opaque;
        p.note = Some("removed-trivial-phi".into());
        p.args.clear();
        for u in users {
            self.try_remove_trivial_phi(m, u);
        }
        same
    }

    /// Marks `block` as having all its predecessors, completing its phis.
    pub fn seal(&mut self, m: &mut Module, block: BlockId) {
        if let Some(inc) = self.incomplete.remove(&block) {
            for (v, phi) in inc {
                self.add_phi_operands(m, &v, phi);
            }
        }
        self.sealed.insert(block);
    }

    /// Seals every remaining block (call once lowering is finished).
    pub fn finish(&mut self, m: &mut Module) -> FuncId {
        for b in 0..m.func(self.func).blocks.len() {
            let b = BlockId(b as u32);
            if !self.sealed.contains(&b) {
                self.seal(m, b);
            }
        }
        self.func
    }
}

#[cfg(test)]
mod tests {
    //! The builder on its own, with hand-built control flow.
    use super::*;
    use viscosity_vir::print_func;

    fn num(m: &mut Module, fb: &mut FunctionBuilder<&'static str>, x: f64) -> ValueId {
        fb.constant(m, Const::Number(x), None)
    }

    #[test]
    fn if_else_join_gets_a_phi() {
        // x = 1; if (c) x = 2; return x;
        let mut m = Module::new("test", "");
        let mut fb = FunctionBuilder::<&str>::new(&mut m, "f", None);
        let one = num(&mut m, &mut fb, 1.0);
        let entry = fb.current;
        fb.write_variable("x", entry, one);
        let cond = fb.emit(&mut m, Op::Opaque, vec![], Some("c"), None);
        let (then_b, join) = (fb.new_block(&mut m), fb.new_block(&mut m));
        fb.terminate(&mut m, Terminator::CondBr { cond, then: then_b, else_: join, src: None });
        fb.seal(&mut m, then_b);
        fb.switch_to(then_b);
        let two = num(&mut m, &mut fb, 2.0);
        fb.write_variable("x", then_b, two);
        fb.br(&mut m, join);
        fb.seal(&mut m, join);
        fb.switch_to(join);
        let x = fb.read(&mut m, &"x");
        fb.terminate(&mut m, Terminator::Return { value: Some(x), src: None });
        fb.finish(&mut m);
        let phi = m.inst(x);
        assert_eq!(phi.op, Op::Phi);
        // Operands in predecessor order: the entry's else edge was added
        // (by the condbr) before the then block's br.
        assert_eq!(phi.args, vec![one, two], "{}", print_func(&m, &m.functions[0]));
    }

    #[test]
    fn unmodified_loop_variable_has_no_phi() {
        // x = 1; while (c) {}; return x;   -- the header phi is trivial
        let mut m = Module::new("test", "");
        let mut fb = FunctionBuilder::<&str>::new(&mut m, "f", None);
        let one = num(&mut m, &mut fb, 1.0);
        let entry = fb.current;
        fb.write_variable("x", entry, one);
        let (head, body, exit) = (fb.new_block(&mut m), fb.new_block(&mut m), fb.new_block(&mut m));
        fb.br(&mut m, head);
        fb.switch_to(head);
        let x_in_loop = fb.read(&mut m, &"x"); // incomplete phi: head is unsealed
        let cond = fb.emit(&mut m, Op::Opaque, vec![], Some("c"), None);
        fb.terminate(&mut m, Terminator::CondBr { cond, then: body, else_: exit, src: None });
        fb.seal(&mut m, body);
        fb.switch_to(body);
        fb.br(&mut m, head);
        fb.seal(&mut m, head); // the phi merges only `one` with itself: removed
        fb.seal(&mut m, exit);
        fb.switch_to(exit);
        let x = fb.read(&mut m, &"x");
        fb.terminate(&mut m, Terminator::Return { value: Some(x), src: None });
        fb.finish(&mut m);
        assert_eq!(x, one);
        assert_eq!(m.inst(x_in_loop).note.as_deref(), Some("removed-trivial-phi"));
        assert!(!print_func(&m, &m.functions[0]).contains("phi"));
    }

    #[test]
    fn reading_an_unwritten_variable_gives_undefined() {
        let mut m = Module::new("test", "");
        let mut fb = FunctionBuilder::<&str>::new(&mut m, "f", None);
        let v = fb.read(&mut m, &"nope");
        assert_eq!(m.inst(v).op, Op::Const(Const::Undefined));
    }
}
