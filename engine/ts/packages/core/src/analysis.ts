// The layout analyses (book chapters 96–101): run on VIR, so they work for
// any language plugin.
//
//  numeric      which values are provably JavaScript numbers (a dataflow
//               fixpoint over SSA values, bindings and collection fields)
//  collections  which bindings hold an array of same-shaped records
//  safety       every use of the collection and of its elements must be one we
//               can rewrite: if anything could observe the old layout, bail out
//  bounds       which element accesses provably stay in bounds
//  access       per loop: which fields are read and written
//  size         an estimate of how many elements the collection holds
import { dominators, dominates, loopOf, naturalLoops, type Loop } from './cfg.ts';
import { buildUses, type BindingId, type Func, type Inst, type Module, type Use, type ValueId } from './vir.ts';

const ARITH = new Set(['-', '*', '/', '%', '**', '&', '|', '^', '<<', '>>', '>>>', '+']);

export interface LoopAccess {
  func: string;
  line: number;
  depth: number;
  reads: Set<string>;
  writes: Set<string>;
  /** estimated iterations per execution, if known */
  trips: number | null;
}

export interface ElementAccess {
  /** the field.get / field.set instruction */
  inst: Inst;
  /** the index.get that produced the element */
  element: Inst;
  field: string;
  kind: 'read' | 'write';
}

export interface Collection {
  binding: BindingId;
  name: string;
  fields: string[];
  /** the instruction that creates it (array.empty or array.new) */
  init: Inst;
  /** record.new instructions inside array.new, in order */
  initRecords: Inst[];
  pushes: Inst[];
  /** index.get instructions producing elements, with bounds facts */
  indexGets: { inst: Inst; boundsProven: boolean }[];
  accesses: ElementAccess[];
  lengthReads: Inst[];
  loops: LoopAccess[];
  sizeEstimate: number | null;
  /** fields provably always numbers: these get Float64Array columns */
  numericFields: Set<string>;
  /** why the collection can't be transformed (empty = safe) */
  bailouts: string[];
  /** the source line of the declaration */
  line: number;
}

export interface Analysis {
  module: Module;
  uses: Map<ValueId, Use[]>;
  isNumber: (v: ValueId) => boolean;
  collections: Collection[];
}

export function analyze(m: Module): Analysis {
  const uses = buildUses(m);
  const inst = (v: ValueId) => m.values[v];
  const usesOf = (v: ValueId) => uses.get(v) ?? [];
  const line = (i: Inst) => i.src?.line ?? 0;
  const funcOf = new Map<Inst, Func>();
  for (const f of m.functions) for (const b of f.blocks) for (const i of b.insts) funcOf.set(i, f);

  // ---- 1. candidate collections ---------------------------------------------
  const stores = new Map<BindingId, Inst[]>();
  const loads = new Map<BindingId, Inst[]>();
  for (const f of m.functions) {
    for (const b of f.blocks) {
      for (const i of b.insts) {
        if (i.op === 'storeBinding') (stores.get(i.binding!) ?? stores.set(i.binding!, []).get(i.binding!)!).push(i);
        if (i.op === 'loadBinding') (loads.get(i.binding!) ?? loads.set(i.binding!, []).get(i.binding!)!).push(i);
      }
    }
  }

  // Known functions: declared functions whose binding is only ever called
  // directly. For those we know every call site, so parameters can be
  // analyzed interprocedurally (book chapter 99).
  const callSites = new Map<Func, Inst[]>();
  for (const f of m.functions) {
    if (f.declaredAs === null) continue;
    const st = stores.get(f.declaredAs) ?? [];
    if (st.length !== 1) continue;
    const sites: Inst[] = [];
    let ok = true;
    const refs = [...(loads.get(f.declaredAs) ?? [])];
    for (const l of refs) {
      for (const u of usesOf(l.id)) {
        if (u.inst && u.inst.op === 'call' && u.inst.args[0] === l.id && u.inst.note !== 'method') sites.push(u.inst);
        else ok = false;
      }
    }
    // An SSA-held function (declared and only used in the same scope)
    for (const u of usesOf(st[0].args[0])) if (u.inst !== st[0]) ok = false;
    if (ok) callSites.set(f, sites);
  }
  const paramInfo = (f: Func, i: number) => ({ value: f.params[i], binding: f.paramBindings[i] });

  // Index operands must be numbers (arr['x'] would read a property instead).
  const indexChecks: { c: Collection; i: Inst }[] = [];
  let isNumberLater: (v: ValueId) => boolean = () => true;

  const collections: Collection[] = [];
  const collectionOfLoad = new Map<ValueId, Collection>();
  const elementOf = new Map<ValueId, Collection>(); // index.get value -> collection
  for (const binding of m.bindings) {
    if (binding.kind !== 'const' && binding.kind !== 'let') continue;
    const st = stores.get(binding.id) ?? [];
    const arrayStores = st.filter((x) => ['array.empty', 'array.new'].includes(inst(x.args[0]).op));
    if (arrayStores.length === 0) continue;
    const init = inst(arrayStores[0].args[0]);
    const c: Collection = {
      binding: binding.id, name: binding.name, fields: [], init, initRecords: [], pushes: [], indexGets: [],
      accesses: [], lengthReads: [], loops: [], sizeEstimate: null, bailouts: [], line: init.src?.line ?? 0,
      numericFields: new Set(),
    };
    if (st.length > 1) c.bailouts.push(`"${binding.name}" is reassigned (line ${line(st[st.length - 1])}), so it may not always hold this array`);
    if (init.op === 'array.new') {
      for (const a of init.args) {
        const r = inst(a);
        if (r.op !== 'record.new') {
          c.bailouts.push(`line ${init.src?.line}: an element of the array literal is not a plain object literal`);
          break;
        }
        c.initRecords.push(r);
      }
    }
    collections.push(c);
    for (const l of loads.get(binding.id) ?? []) collectionOfLoad.set(l.id, c);
  }

  /** Values that refer to collection c: its loads, plus parameters it flows into. */
  const refsOf = new Map<Collection, Inst[]>();
  for (const c of collections) refsOf.set(c, [...(loads.get(c.binding) ?? [])]);

  const describeUse = (u: Use): string => {
    if (u.term) return `returned or branched on in ${u.term.func.name}()`;
    const i = u.inst!;
    switch (i.op) {
      case 'call': return i.note === 'method' ? `passed to a method call at line ${line(i)}` : `passed to a function call at line ${line(i)}`;
      case 'storeBinding': return `stored in another variable (${m.bindings[i.binding!].name}) at line ${line(i)}`;
      case 'field.set': return `stored into an object property at line ${line(i)}`;
      case 'index.set': return `stored into an array at line ${line(i)}`;
      case 'record.new': return `put inside another object at line ${line(i)}`;
      case 'array.new': return `put inside another array at line ${line(i)}`;
      case 'binop': return `compared or combined with "${i.operator}" at line ${line(i)}`;
      case 'opaque': return `used by code Viscosity doesn't model (${i.note}) at line ${line(i)}`;
      case 'phi': return `merged with other values (a variable reassigned along different paths) near line ${line(i)}`;
      default: return `used by ${i.op} at line ${line(i)}`;
    }
  };

  // ---- 2. shapes and uses ------------------------------------------------------
  const setShape = (c: Collection, r: Inst, where: string) => {
    if (c.fields.length === 0) c.fields = [...r.fields!];
    else if (c.fields.join(',') !== r.fields!.join(',')) {
      c.bailouts.push(`${where}: records with different fields or field order ({${r.fields!.join(', ')}} vs {${c.fields.join(', ')}})`);
    }
    const ru = usesOf(r.id);
    if (ru.length !== 1) c.bailouts.push(`${where}: the new record is also referenced elsewhere, so it could be aliased`);
  };

  for (const c of collections) {
    for (const r of c.initRecords) setShape(c, r, `line ${line(r)}`);
    const initUses = usesOf(c.init.id);
    if (initUses.length !== 1) c.bailouts.push(`line ${c.line}: the array is used before being stored in "${c.name}"`);
    const work = [...refsOf.get(c)!];
    const seenParam = new Set<ValueId>();
    while (work.length) {
      const l = work.pop()!;
      for (const u of usesOf(l.id)) {
        const i = u.inst;
        if (!i) { c.bailouts.push(describeUse(u)); continue; }
        // Passed to a known function: follow it into the parameter.
        if (i.op === 'call' && i.note !== 'method' && i.args.indexOf(l.id) > 0) {
          const callee = inst(i.args[0]);
          const f = callee.op === 'loadBinding' ? m.functions.find((g) => g.declaredAs === callee.binding && callSites.has(g)) : undefined;
          const k = i.args.indexOf(l.id) - 1;
          if (f && i.args.lastIndexOf(l.id) === k + 1 && k < f.params.length) {
            const sites = callSites.get(f)!;
            const allSame = sites.every((site) => {
              const a = site.args[k + 1];
              return a !== undefined && collectionOfLoad.get(a) === c;
            });
            const p = paramInfo(f, k);
            if (allSame && p.binding === null && seenParam.has(p.value)) continue;
            if (allSame && p.binding === null) {
              seenParam.add(p.value);
              collectionOfLoad.set(p.value, c);
              refsOf.get(c)!.push(inst(p.value));
              work.push(inst(p.value));
              continue;
            }
            if (!allSame) { c.bailouts.push(`line ${line(i)}: passed to ${f.name}(), which is also called with other values`); continue; }
          }
        }
        if (i.op === 'field.get' && i.field === 'length' && i.args[0] === l.id) { c.lengthReads.push(i); continue; }
        if (i.op === 'push' && i.args[0] === l.id) {
          if (i.args.length !== 2) { c.bailouts.push(`line ${line(i)}: push with ${i.args.length - 1} arguments (only one record at a time is supported)`); continue; }
          const r = inst(i.args[1]);
          if (r.op !== 'record.new') { c.bailouts.push(`line ${line(i)}: pushes something that is not a fresh object literal`); continue; }
          setShape(c, r, `line ${line(i)}`);
          c.pushes.push(i);
          continue;
        }
        if (i.op === 'index.get' && i.args[0] === l.id) {
          indexChecks.push({ c, i });
          c.indexGets.push({ inst: i, boundsProven: false });
          elementOf.set(i.id, c);
          continue;
        }
        if (i.op === 'field.get' && i.args[0] === l.id) {
          c.bailouts.push(`line ${line(i)}: uses .${i.field} on the array (only .length and .push are supported)`);
          continue;
        }
        c.bailouts.push(`the array is ${describeUse(u)}`);
      }
    }
    if (c.fields.length === 0 && c.bailouts.length === 0) c.bailouts.push('no records are ever added, so there is nothing to lay out');
  }

  // ---- 3. numeric inference (optimistic fixpoint) ------------------------
  const num = new Map<ValueId, boolean>();
  const colNumeric = new Map<string, boolean>(); // `${binding}.${field}`
  for (const c of collections) for (const f of c.fields) colNumeric.set(`${c.binding}.${f}`, true);
  const bindingNumeric = new Map<BindingId, boolean>();
  for (const b of m.bindings) bindingNumeric.set(b.id, (stores.get(b.id)?.length ?? 0) > 0 && (b.kind === 'const' || b.kind === 'let' || b.kind === 'var'));

  const elementField = (i: Inst): { c: Collection; f: string } | null => {
    const c = elementOf.get(i.args[0]);
    return c && c.fields.includes(i.field!) ? { c, f: i.field! } : null;
  };

  const compute = (i: Inst): boolean => {
    const n = (v: ValueId) => num.get(v) ?? false;
    switch (i.op) {
      case 'const': return typeof i.value === 'number';
      case 'binop': return ARITH.has(i.operator!) && n(i.args[0]) && n(i.args[1]);
      case 'unop': return (i.operator === '-' || i.operator === '+' || i.operator === '~') && n(i.args[0]);
      case 'intrinsic': return true;
      case 'logical': return n(i.args[0]) && n(i.args[1]);
      case 'select': return n(i.args[1]) && n(i.args[2]);
      case 'phi': return i.args.every(n);
      case 'loadBinding': return bindingNumeric.get(i.binding!) ?? false;
      case 'param': {
        const f = funcOf.get(i)!;
        const sites = callSites.get(f);
        if (!sites || sites.length === 0) return false;
        return sites.every((site) => site.args[i.index! + 1] !== undefined && n(site.args[i.index! + 1]));
      }
      case 'push': return collectionOfLoad.has(i.args[0]);
      case 'field.get': {
        if (i.field === 'length' && collectionOfLoad.has(i.args[0])) return true;
        const ef = elementField(i);
        return ef ? colNumeric.get(`${ef.c.binding}.${ef.f}`)! : false;
      }
      default: return false;
    }
  };
  // Start optimistic for values that depend on cycles, then iterate.
  for (const v of m.values) num.set(v.id, v.op === 'phi' || v.op === 'loadBinding' || v.op === 'field.get' || v.op === 'param' ? true : compute(v));
  for (let changed = true, rounds = 0; changed && rounds < 100; rounds++) {
    changed = false;
    for (const v of m.values) {
      const nv = compute(v);
      if (num.get(v.id) !== nv) { num.set(v.id, nv); changed = true; }
    }
    for (const b of m.bindings) {
      const st = stores.get(b.id) ?? [];
      const nb = (bindingNumeric.get(b.id) ?? false) && st.every((s) => num.get(s.args[0]));
      if (bindingNumeric.get(b.id) !== nb) { bindingNumeric.set(b.id, nb); changed = true; }
    }
    for (const c of collections) {
      for (const f of c.fields) {
        const k = `${c.binding}.${f}`;
        let ok = colNumeric.get(k)!;
        const idx = c.fields.indexOf(f);
        for (const r of [...c.initRecords, ...c.pushes.map((p) => inst(p.args[1]))]) if (!num.get(r.args[idx])) ok = false;
        for (const ig of c.indexGets) {
          for (const u of usesOf(ig.inst.id)) {
            const i = u.inst;
            if (i && i.op === 'field.set' && i.args[0] === ig.inst.id && i.field === f && !num.get(i.args[1])) ok = false;
          }
        }
        if (ok !== colNumeric.get(k)) { colNumeric.set(k, ok); changed = true; }
      }
    }
  }
  const isNumber = (v: ValueId) => num.get(v) ?? false;
  isNumberLater = isNumber;
  for (const { c, i } of indexChecks) {
    if (!isNumber(i.args[1])) c.bailouts.push(`line ${line(i)}: indexes the array with something that may not be a number`);
  }

  // ---- 4. element uses -----------------------------------------------------
  for (const c of collections) {
    for (const ig of c.indexGets) {
      for (const u of usesOf(ig.inst.id)) {
        const i = u.inst;
        if (i && i.op === 'field.get' && i.args[0] === ig.inst.id) {
          if (!c.fields.includes(i.field!)) c.bailouts.push(`line ${line(i)}: reads .${i.field}, which the records don't have`);
          else c.accesses.push({ inst: i, element: ig.inst, field: i.field!, kind: 'read' });
          continue;
        }
        if (i && i.op === 'field.set' && i.args[0] === ig.inst.id) {
          if (!c.fields.includes(i.field!)) c.bailouts.push(`line ${line(i)}: adds a new property .${i.field} to an element`);
          else c.accesses.push({ inst: i, element: ig.inst, field: i.field!, kind: 'write' });
          continue;
        }
        c.bailouts.push(`line ${line(ig.inst)}: an element is ${describeUse(u)}`);
      }
    }
    // Fields that may hold non-numbers still get a column, just a plain
    // JavaScript array instead of a Float64Array (book chapter 108).
    for (const f of c.fields) if (colNumeric.get(`${c.binding}.${f}`)) c.numericFields.add(f);
  }

  // ---- 5. bounds, loops, access patterns, size ---------------------------
  const loopsOf = new Map<Func, { loops: Loop[]; idom: Map<number, number> }>();
  const info = (f: Func) => {
    let x = loopsOf.get(f);
    if (!x) {
      const idom = dominators(f);
      x = { loops: naturalLoops(f, idom), idom };
      loopsOf.set(f, x);
    }
    return x;
  };

  /** Is v provably a non-negative integer? (constants, sums, counting loops) */
  const nonNegInt = (v: Inst, seen = new Set<ValueId>()): boolean => {
    if (seen.has(v.id)) return true; // assume, for cycles through phis
    seen.add(v.id);
    switch (v.op) {
      case 'const': return typeof v.value === 'number' && Number.isInteger(v.value) && v.value >= 0;
      case 'binop': return (v.operator === '+' || v.operator === '*') && v.args.every((a) => nonNegInt(inst(a), seen));
      case 'unop': return v.operator === '+' && nonNegInt(inst(v.args[0]), seen);
      case 'phi': return v.args.every((a) => nonNegInt(inst(a), seen));
      default: return false;
    }
  };

  /** Is phi a counting induction variable: start >= 0, step +1 each trip? */
  const isCountingPhi = (phi: Inst, zeroStart = false): boolean => {
    if (phi.op !== 'phi' || phi.args.length !== 2) return false;
    for (const [s0, s1] of [[0, 1], [1, 0]]) {
      const start = inst(phi.args[s0]);
      const step = inst(phi.args[s1]);
      if (step.op !== 'binop' || step.operator !== '+') continue;
      const [x, y] = step.args.map(inst);
      const base = x.op === 'unop' && x.operator === '+' ? inst(x.args[0]) : x;
      if (base.id !== phi.id || y.op !== 'const' || y.value !== 1) continue;
      if (zeroStart ? start.op === 'const' && start.value === 0 : nonNegInt(start)) return true;
    }
    return false;
  };

  /** The conjuncts of a branch condition: a && b && c -> [a, b, c]. */
  const conjuncts = (v: Inst): Inst[] =>
    v.op === 'logical' && v.operator === '&&' ? v.args.flatMap((a) => conjuncts(inst(a))) : [v];

  const tripCount = (f: Func, l: Loop): number | null => {
    const t = f.blocks[l.header].term;
    if (t.kind !== 'condbr') return null;
    const cond = inst(t.cond);
    if (cond.op !== 'binop' || (cond.operator !== '<' && cond.operator !== '<=')) return null;
    const [iv, bound] = cond.args.map(inst);
    if (!isCountingPhi(iv, true) || bound.op !== 'const' || typeof bound.value !== 'number') return null;
    return cond.operator === '<' ? bound.value : bound.value + 1;
  };

  for (const c of collections) {
    for (const ig of c.indexGets) {
      const f = funcOf.get(ig.inst)!;
      const { loops, idom } = info(f);
      const idx = inst(ig.inst.args[1]);
      // The loop that counts with idx: any loop (not just the innermost)
      // whose header defines idx and which contains this access.
      const l = loops.find((lp) => lp.header === idx.block && lp.body.has(ig.inst.block));
      if (!l || !isCountingPhi(idx)) continue;
      const t = f.blocks[l.header].term;
      if (t.kind !== 'condbr') continue;
      const guarded = conjuncts(inst(t.cond)).some((cond) => {
        if (cond.op !== 'binop' || cond.operator !== '<' || cond.args[0] !== idx.id) return false;
        const bound = inst(cond.args[1]);
        return bound.op === 'field.get' && bound.field === 'length' && collectionOfLoad.get(bound.args[0]) === c;
      });
      if (guarded && dominates(idom, t.then, ig.inst.block)) ig.boundsProven = true;
    }

    // Access patterns per loop.
    const byLoop = new Map<string, LoopAccess>();
    for (const a of c.accesses) {
      const f = funcOf.get(a.inst)!;
      const { loops } = info(f);
      const l = loopOf(loops, a.inst.block);
      const key = l ? `${f.id}:${l.header}` : `${f.id}:none`;
      let la = byLoop.get(key);
      if (!la) {
        const hdr = l ? f.blocks[l.header].term : null;
        const ln = hdr && hdr.kind === 'condbr' ? hdr.src?.line ?? line(a.inst) : line(a.inst);
        la = { func: f.name, line: ln, depth: l ? l.depth : 0, reads: new Set(), writes: new Set(), trips: l ? tripCount(f, l) : 1 };
        byLoop.set(key, la);
      }
      (a.kind === 'read' ? la.reads : la.writes).add(a.field);
    }
    c.loops = [...byLoop.values()].sort((x, y) => x.line - y.line);

    // Size estimate: literal elements + pushes inside loops with known trip counts.
    let size = c.initRecords.length;
    let known = true;
    for (const p of c.pushes) {
      const f = funcOf.get(p)!;
      const { loops } = info(f);
      let mult = 1;
      for (const l of loops) {
        if (!l.body.has(p.block)) continue;
        const t = tripCount(f, l);
        if (t === null) { known = false; break; }
        mult *= t;
      }
      if (f.id !== m.main) known = false; // pushes in a function: depends on how often it's called
      size += mult;
    }
    c.sizeEstimate = known ? size : null;
  }

  // Deduplicate bailout messages.
  for (const c of collections) c.bailouts = [...new Set(c.bailouts)];
  return { module: m, uses, isNumber, collections };
}
