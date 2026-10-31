// Builds VIR functions, including SSA construction on the fly.
//
// SSA construction follows Braun, Buchwald, Hack, Leißa, Mallon and Zwinkau,
// "Simple and Efficient Construction of Static Single Assignment Form"
// (CC 2013): variables are read and written per block; reading in a block
// with several predecessors creates a phi; blocks whose predecessors aren't
// all known yet ("unsealed", e.g. loop headers) get incomplete phis that are
// filled in when the block is sealed. Trivial phis are removed.
import type {
  Binding, BindingId, Block, BlockId, Func, FuncId, Inst, Module, Op, SourceRef, Terminator, ValueId,
} from './vir.ts';

export class ModuleBuilder {
  readonly module: Module;
  constructor(language: string, source: string) {
    this.module = { language, source, functions: [], bindings: [], values: [], main: 0 };
  }
  addBinding(name: string, kind: Binding['kind'], owner: FuncId, src?: SourceRef): BindingId {
    const id = this.module.bindings.length;
    this.module.bindings.push({ id, name, kind, owner, src });
    return id;
  }
  newFunction(name: string, src?: SourceRef): FunctionBuilder {
    const f: Func = {
      id: this.module.functions.length, name, params: [], paramBindings: [], blocks: [], entry: 0,
      captures: new Set(), declaredAs: null, src,
    };
    this.module.functions.push(f);
    return new FunctionBuilder(this.module, f);
  }
}

/** A variable key for SSA: any string the front-end chooses (e.g. scope-qualified name). */
export type VarKey = string;

export class FunctionBuilder {
  readonly module: Module;
  readonly func: Func;
  current: Block;
  private defs = new Map<BlockId, Map<VarKey, ValueId>>();
  private sealed = new Set<BlockId>();
  private incomplete = new Map<BlockId, Map<VarKey, Inst>>();
  /** blocks reachable only after a terminator; instructions there are dead */
  constructor(module: Module, func: Func) {
    this.module = module;
    this.func = func;
    this.current = this.newBlock();
    func.entry = this.current.id;
    this.seal(this.current.id);
  }

  newBlock(): Block {
    const b: Block = { id: this.func.blocks.length, insts: [], term: { kind: 'unreachable' }, preds: [] };
    this.func.blocks.push(b);
    return b;
  }

  block(id: BlockId): Block {
    return this.func.blocks[id];
  }

  /** Has the current block already been terminated? */
  get terminated(): boolean {
    return this.current.term.kind !== 'unreachable';
  }

  emit(op: Op, args: ValueId[], extra: Partial<Inst> = {}): ValueId {
    const inst: Inst = { id: this.module.values.length, op, args, block: this.current.id, ...extra };
    this.module.values.push(inst);
    this.current.insts.push(inst);
    return inst.id;
  }

  constant(value: Inst['value'], src?: SourceRef): ValueId {
    return this.emit('const', [], { value, src });
  }

  terminate(t: Terminator): void {
    if (this.terminated) return; // code after return/break is unreachable
    this.current.term = t;
    const succ = t.kind === 'br' ? [t.target] : t.kind === 'condbr' ? [t.then, t.else] : [];
    for (const s of succ) this.block(s).preds.push(this.current.id);
  }

  br(target: BlockId): void {
    this.terminate({ kind: 'br', target });
  }

  switchTo(b: Block): void {
    this.current = b;
  }

  // ---- SSA (Braun et al.) --------------------------------------------------

  writeVariable(v: VarKey, block: BlockId, value: ValueId): void {
    let m = this.defs.get(block);
    if (!m) this.defs.set(block, (m = new Map()));
    m.set(v, value);
  }

  readVariable(v: VarKey, block: BlockId = this.current.id): ValueId {
    const local = this.defs.get(block)?.get(v);
    if (local !== undefined) return local;
    return this.readVariableRecursive(v, block);
  }

  private newPhi(block: BlockId): Inst {
    const inst: Inst = { id: this.module.values.length, op: 'phi', args: [], block };
    this.module.values.push(inst);
    this.block(block).insts.unshift(inst);
    return inst;
  }

  private readVariableRecursive(v: VarKey, block: BlockId): ValueId {
    const b = this.block(block);
    let val: ValueId;
    if (!this.sealed.has(block)) {
      const phi = this.newPhi(block);
      let m = this.incomplete.get(block);
      if (!m) this.incomplete.set(block, (m = new Map()));
      m.set(v, phi);
      val = phi.id;
    } else if (b.preds.length === 1) {
      val = this.readVariable(v, b.preds[0]);
    } else if (b.preds.length === 0) {
      // Read before any write on this path: the variable is undefined here.
      const save = this.current;
      this.current = this.block(this.func.entry);
      const inst: Inst = { id: this.module.values.length, op: 'const', args: [], block: this.func.entry, value: undefined };
      this.module.values.push(inst);
      this.block(this.func.entry).insts.unshift(inst);
      this.current = save;
      val = inst.id;
    } else {
      const phi = this.newPhi(block);
      this.writeVariable(v, block, phi.id); // break cycles
      val = this.addPhiOperands(v, phi);
    }
    this.writeVariable(v, block, val);
    return val;
  }

  private addPhiOperands(v: VarKey, phi: Inst): ValueId {
    for (const p of this.block(phi.block).preds) phi.args.push(this.readVariable(v, p));
    return this.tryRemoveTrivialPhi(phi);
  }

  private tryRemoveTrivialPhi(phi: Inst): ValueId {
    let same: ValueId | null = null;
    for (const op of phi.args) {
      if (op === same || op === phi.id) continue;
      if (same !== null) return phi.id; // merges at least two values: not trivial
      same = op;
    }
    if (same === null) {
      // Unreachable or undefined: replace with an undefined constant.
      phi.op = 'const';
      phi.value = undefined;
      phi.args = [];
      return phi.id;
    }
    // Replace every use of the phi with `same`.
    const users: Inst[] = [];
    for (const f of [this.func]) {
      for (const b of f.blocks) {
        for (const i of b.insts) {
          if (i !== phi && i.args.includes(phi.id)) {
            i.args = i.args.map((a) => (a === phi.id ? same! : a));
            if (i.op === 'phi') users.push(i);
          }
        }
        const t = b.term;
        if (t.kind === 'condbr' && t.cond === phi.id) t.cond = same;
        if (t.kind === 'return' && t.value === phi.id) t.value = same;
      }
    }
    for (const m of this.defs.values()) for (const [k, val] of m) if (val === phi.id) m.set(k, same);
    // Remove the phi from its block.
    const blk = this.block(phi.block);
    blk.insts = blk.insts.filter((i) => i !== phi);
    phi.op = 'opaque';
    phi.note = 'removed-trivial-phi';
    phi.args = [];
    for (const u of users) this.tryRemoveTrivialPhi(u);
    return same;
  }

  seal(block: BlockId): void {
    const inc = this.incomplete.get(block);
    if (inc) {
      for (const [v, phi] of inc) this.addPhiOperands(v, phi);
      this.incomplete.delete(block);
    }
    this.sealed.add(block);
  }

  /** Seal every remaining block (call once lowering is finished). */
  finish(): Func {
    for (const b of this.func.blocks) if (!this.sealed.has(b.id)) this.seal(b.id);
    return this.func;
  }
}
