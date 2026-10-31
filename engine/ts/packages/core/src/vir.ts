// VIR: Viscosity's intermediate representation (book chapter 91).
//
// Language-neutral: a front-end plugin lowers its syntax tree into VIR, the
// analyses run on VIR, and the plugin uses the resulting plan to rewrite its
// own source. VIR is a control-flow graph of basic blocks in SSA form:
// every local, non-captured variable becomes values assigned exactly once,
// joined by phi instructions. Variables that closures capture, or that live at
// module level, are "bindings", read and written with loadBinding/storeBinding.
//
// Records and collections are first-class (record.new, index.get, field.get,
// push, length), so the layout analyses never see JS- or Python-specific
// syntax.

export type ValueId = number;
export type BlockId = number;
export type FuncId = number;
export type BindingId = number;

/** Where an instruction came from, for rewriting and for explain output. */
export interface SourceRef {
  /** the plugin's own syntax node (ESTree node for JavaScript) */
  node: unknown;
  start: number;
  end: number;
  line: number;
}

export type Op =
  | 'const'        // value: number | string | boolean | null | undefined
  | 'param'        // index
  | 'phi'          // args: one per predecessor, in pred order
  | 'binop'        // operator; args [a, b]
  | 'unop'         // operator; args [a]
  | 'logical'      // && || ?? : args [a, b] (short-circuiting not modelled)
  | 'select'       // a ? b : c
  | 'loadBinding'  // binding
  | 'storeBinding' // binding; args [value]
  | 'record.new'   // fields: string[]; args: values in field order
  | 'array.new'    // args: elements
  | 'array.empty'  // [] with no elements
  | 'field.get'    // field; args [obj]
  | 'field.set'    // field; args [obj, value]
  | 'index.get'    // args [arr, index]
  | 'index.set'    // args [arr, index, value]
  | 'length'       // args [arr]
  | 'push'         // args [arr, ...values]
  | 'intrinsic'    // name (e.g. 'Math.sqrt'): a known numeric function that keeps no reference to its arguments
  | 'call'         // args [callee, ...args]: an unknown call
  | 'closure'      // func: a function value; captured bindings are on the Func
  | 'opaque';      // anything not modelled: every arg escapes, result unknown

export interface Inst {
  id: ValueId;
  op: Op;
  args: ValueId[];
  block: BlockId;
  value?: number | string | boolean | null | undefined;
  operator?: string;
  binding?: BindingId;
  fields?: string[];
  field?: string;
  name?: string;
  func?: FuncId;
  index?: number;
  /** for opaque: a short description, used in explain output */
  note?: string;
  src?: SourceRef;
}

export type Terminator =
  | { kind: 'br'; target: BlockId }
  | { kind: 'condbr'; cond: ValueId; then: BlockId; else: BlockId; src?: SourceRef }
  | { kind: 'return'; value: ValueId | null; src?: SourceRef }
  | { kind: 'throw'; value: ValueId; src?: SourceRef }
  | { kind: 'unreachable' };

export interface Block {
  id: BlockId;
  insts: Inst[];
  term: Terminator;
  preds: BlockId[];
}

export interface Func {
  id: FuncId;
  name: string;
  params: ValueId[];
  /** the binding each parameter is bound to, if any */
  paramBindings: (BindingId | null)[];
  blocks: Block[];
  entry: BlockId;
  /** bindings this function reads or writes that belong to an outer scope */
  captures: Set<BindingId>;
  /** the binding a function declaration is stored in, if any */
  declaredAs: BindingId | null;
  src?: SourceRef;
}

export interface Binding {
  id: BindingId;
  name: string;
  kind: 'const' | 'let' | 'var' | 'param' | 'function' | 'class' | 'import' | 'global';
  /** the function whose scope declares it (-1 for implicit globals) */
  owner: FuncId;
  src?: SourceRef;
}

export interface Module {
  language: string;
  source: string;
  functions: Func[];
  bindings: Binding[];
  /** every instruction by id */
  values: Inst[];
  /** the top-level code */
  main: FuncId;
}

/** Iterate every instruction in a module. */
export function* allInsts(m: Module): Generator<Inst> {
  for (const f of m.functions) for (const b of f.blocks) yield* b.insts;
}

/** users[v] = instructions (and terminators) that use value v. */
export interface Use { inst?: Inst; term?: { func: Func; block: Block } }

export function buildUses(m: Module): Map<ValueId, Use[]> {
  const uses = new Map<ValueId, Use[]>();
  const add = (v: ValueId, u: Use) => {
    let l = uses.get(v);
    if (!l) uses.set(v, (l = []));
    l.push(u);
  };
  for (const f of m.functions) {
    for (const b of f.blocks) {
      for (const i of b.insts) for (const a of i.args) add(a, { inst: i });
      const t = b.term;
      if (t.kind === 'condbr') add(t.cond, { term: { func: f, block: b } });
      if (t.kind === 'return' && t.value !== null) add(t.value, { term: { func: f, block: b } });
      if (t.kind === 'throw') add(t.value, { term: { func: f, block: b } });
    }
  }
  return uses;
}

/** A readable listing of a function, for debugging and the book. */
export function printFunc(m: Module, f: Func): string {
  const out: string[] = [`func ${f.name}(${f.params.map((p) => '%' + p).join(', ')}):`];
  const fmt = (i: Inst): string => {
    const args = i.args.map((a) => '%' + a).join(', ');
    switch (i.op) {
      case 'const': return `%${i.id} = const ${JSON.stringify(i.value)}`;
      case 'binop': case 'unop': case 'logical': return `%${i.id} = ${i.op} ${i.operator} ${args}`;
      case 'loadBinding': return `%${i.id} = load ${m.bindings[i.binding!].name}`;
      case 'storeBinding': return `store ${m.bindings[i.binding!].name}, ${args}`;
      case 'record.new': return `%${i.id} = record {${i.fields!.join(', ')}} ${args}`;
      case 'field.get': return `%${i.id} = field.get ${args} .${i.field}`;
      case 'field.set': return `field.set ${args} .${i.field}`;
      case 'intrinsic': return `%${i.id} = ${i.name}(${args})`;
      case 'closure': return `%${i.id} = closure ${m.functions[i.func!].name}`;
      case 'opaque': return `%${i.id} = opaque(${i.note ?? ''}) ${args}`;
      default: return `%${i.id} = ${i.op} ${args}`;
    }
  };
  for (const b of f.blocks) {
    out.push(`  b${b.id}:${b.preds.length ? `  ; preds ${b.preds.map((p) => 'b' + p).join(' ')}` : ''}`);
    for (const i of b.insts) out.push(`    ${fmt(i)}`);
    const t = b.term;
    if (t.kind === 'br') out.push(`    br b${t.target}`);
    else if (t.kind === 'condbr') out.push(`    condbr %${t.cond}, b${t.then}, b${t.else}`);
    else if (t.kind === 'return') out.push(`    return${t.value === null ? '' : ' %' + t.value}`);
    else if (t.kind === 'throw') out.push(`    throw %${t.value}`);
    else out.push('    unreachable');
  }
  return out.join('\n');
}
