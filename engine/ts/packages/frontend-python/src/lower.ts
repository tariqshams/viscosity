// Lowering Python to VIR (book chapter 115). The same IR as JavaScript:
// records come from @dataclass constructor calls, collections from lists,
// `append` is a push, `len(xs)` reads the length, `for i in range(...)` is a
// counting loop and `for x in xs` an element loop. The core analyses then
// work unchanged.
import { ModuleBuilder } from '../../core/src/builder.ts';
import type { BindingId, Module, SourceRef, ValueId } from '../../core/src/vir.ts';
import type { PyNode } from './parser.ts';

const MATH = new Set(['sqrt', 'sin', 'cos', 'tan', 'atan2', 'exp', 'log', 'log10', 'log2', 'fabs', 'floor', 'ceil', 'trunc', 'pow', 'hypot', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh']);

// An f-string is not a literal: it reads variables when it runs.
const isLiteralDefault = (e: PyNode): boolean =>
  (e.type === 'Constant' && !e.fstring) ||
  (e.type === 'UnaryOp' && (e.op === '-' || e.op === '+') && e.operand.type === 'Constant' && (e.operand.kind === 'int' || e.operand.kind === 'float'));

export interface Dataclass { name: string; fields: string[]; defaults: (PyNode | null)[]; node: PyNode }

export interface PyLowered {
  module: Module;
  dataclasses: Map<string, Dataclass>;
  parent: Map<PyNode, PyNode>;
  /** the dataclass a record.new came from */
  recordClass: Map<number, Dataclass>;
}

interface PyBinding { id: number; name: string; owner: PyNode; kind: 'let' | 'param' | 'function' | 'class' | 'import'; mode: 'ssa' | 'cell'; vir?: BindingId; module?: string }

function walk(n: PyNode, f: (n: PyNode, parent: PyNode | null) => void, parent: PyNode | null = null) {
  f(n, parent);
  for (const k of Object.keys(n)) {
    if (k === 'decorators') continue;
    const v = n[k];
    if (Array.isArray(v)) for (const c of v) { if (c && typeof c.type === 'string') walk(c, f, n); else if (c && c.value && typeof c.value.type === 'string') walk(c.value, f, n); }
    else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, f, n);
  }
}

export function lowerPython(mod: PyNode, source: string): PyLowered {
  const mb = new ModuleBuilder('python', source);
  const m = mb.module;
  const parent = new Map<PyNode, PyNode>();
  walk(mod, (n, p) => { if (p) parent.set(n, p); });
  const src = (n: PyNode): SourceRef => ({ node: n, start: n.start, end: n.end, line: n.line });

  // ---- scopes -----------------------------------------------------------
  const scopes = new Map<PyNode, Map<string, PyBinding>>();
  const enclosing = new Map<PyNode, PyNode | null>();
  const globalsDecl = new Map<PyNode, Set<string>>();
  let nextId = 0;
  const dataclasses = new Map<string, Dataclass>();
  // How many statements bind each module-level name. A dataclass is only
  // modelled when its class statement is the only one: after `P = Other`,
  // a call P(...) may not construct the dataclass.
  const moduleDefs = new Map<string, number>();

  const collectScope = (fn: PyNode, outer: PyNode | null) => {
    const names = new Map<string, PyBinding>();
    scopes.set(fn, names);
    enclosing.set(fn, outer);
    const glob = new Set<string>();
    globalsDecl.set(fn, glob);
    const add = (name: string, kind: PyBinding['kind'], extra: Partial<PyBinding> = {}) => {
      if (glob.has(name)) return;
      if (fn === mod) moduleDefs.set(name, (moduleDefs.get(name) ?? 0) + 1);
      if (!names.has(name)) names.set(name, { id: nextId++, name, owner: fn, kind, mode: 'ssa', ...extra });
    };
    if (fn.type === 'FunctionDef') for (const prm of fn.params) add(prm.id, 'param');
    const visit = (stmts: PyNode[]) => {
      for (const s of stmts) {
        switch (s.type) {
          case 'Global': for (const n of s.names) glob.add(n.id); break;
          case 'Assign': case 'AugAssign': case 'AnnAssign':
            if (s.target.type === 'Name') add(s.target.id, 'let');
            break;
          case 'For': add(s.target.id, 'let'); visit(s.body); break;
          case 'If': visit(s.body); visit(s.orelse); break;
          case 'While': visit(s.body); break;
          case 'FunctionDef': add(s.name, 'function'); collectScope(s, fn); break;
          case 'ClassDef': add(s.name, 'class'); break;
          case 'Import': for (const n of s.names) add(n.id, 'import', { module: n.id }); break;
          case 'ImportFrom': for (const n of s.names) add(n.id, 'import'); break;
        }
      }
    };
    visit(fn.body);
  };
  collectScope(mod, null);
  // A `global g` names a module variable even when the module itself never
  // assigns g (a function may create it).
  for (const [f, glob] of globalsDecl) {
    for (const g of glob) {
      // A function that declares `global g` may bind it.
      if (f !== mod) moduleDefs.set(g, (moduleDefs.get(g) ?? 0) + 1);
      if (!scopes.get(mod)!.has(g)) scopes.get(mod)!.set(g, { id: nextId++, name: g, owner: mod, kind: 'let', mode: 'ssa' });
    }
  }

  // Dataclasses: module-level @dataclass classes with only annotated fields.
  for (const s of mod.body) {
    if (s.type !== 'ClassDef') continue;
    const isDc = (s.decorators ?? []).some((d: PyNode) => (d.type === 'Name' && d.id === 'dataclass') || (d.type === 'Attribute' && d.attr === 'dataclass'));
    if (!isDc) continue;
    const fields: string[] = [];
    const defaults: (PyNode | null)[] = [];
    let ok = true;
    for (const b of s.body) {
      if (b.type === 'AnnAssign' && b.target.type === 'Name') {
        // Python evaluates a default once, when the class is defined; the
        // emitter copies its text to each call site. That is only the same
        // for literal constants, so anything else leaves the class unmodelled.
        if (b.value && !isLiteralDefault(b.value)) ok = false;
        fields.push(b.target.id); defaults.push(b.value);
      }
      else if (b.type === 'Pass' || (b.type === 'Expr' && b.value.type === 'Constant' && b.value.kind === 'str')) continue;
      else ok = false;
    }
    if (ok && fields.length && moduleDefs.get(s.name) === 1) dataclasses.set(s.name, { name: s.name, fields, defaults, node: s });
  }

  const lookup = (fn: PyNode, name: string): PyBinding | null => {
    if (globalsDecl.get(fn)?.has(name)) return scopes.get(mod)!.get(name) ?? null;
    for (let f: PyNode | null = fn; f; f = enclosing.get(f) ?? null) {
      const b = scopes.get(f)!.get(name);
      if (b) return b;
    }
    return null;
  };

  // Mode: a binding is a cell (explicit loads/stores) if a different function
  // touches it, or if it is ever bound to a list (a candidate collection).
  const touch = (fn: PyNode, name: string) => {
    const b = lookup(fn, name);
    if (b && b.owner !== fn) b.mode = 'cell';
  };
  const scanUses = (fn: PyNode) => {
    walk({ type: 'Block', start: 0, end: 0, line: 0, body: fn.body } as PyNode, (n) => {
      if (n.type === 'Name') touch(fn, n.id);
      if (n.type === 'Global') for (const g of n.names) { const b = lookup(fn, g.id); if (b) b.mode = 'cell'; }
      if (n.type === 'Assign' && n.target.type === 'Name' && n.value.type === 'List') {
        const b = lookup(fn, n.target.id);
        if (b) b.mode = 'cell';
      }
    });
    for (const s of fn.body) {
      walk(s, (n) => { if (n.type === 'FunctionDef' && n !== fn) scanUses(n); });
    }
  };
  // Module names that functions use become cells.
  const allFns: PyNode[] = [];
  walk(mod, (n) => { if (n.type === 'FunctionDef' && scopes.has(n)) allFns.push(n); });
  for (const fn of [mod, ...allFns]) {
    walk({ type: 'Block', start: 0, end: 0, line: 0, body: fn.body } as PyNode, (n) => {
      if (n.type === 'Name') touch(fn, n.id);
      if (n.type === 'Assign' && n.target.type === 'Name' && n.value.type === 'List') {
        const b = lookup(fn, n.target.id);
        if (b) b.mode = 'cell';
      }
    });
  }
  for (const fn of allFns) for (const g of globalsDecl.get(fn)!) { const b = scopes.get(mod)!.get(g); if (b) b.mode = 'cell'; }
  void scanUses;

  const funcIds = new Map<PyNode, number>();
  const recordClass = new Map<number, Dataclass>();

  function lowerFn(fnNode: PyNode, name: string): number {
    const fb = mb.newFunction(name, src(fnNode));
    funcIds.set(fnNode, fb.func.id);
    const loops: { breakTo: number; continueTo: number }[] = [];
    const vb = (b: PyBinding): BindingId => {
      if (b.vir === undefined) b.vir = mb.addBinding(b.name, b.kind === 'let' ? 'let' : b.kind === 'param' ? 'param' : b.kind === 'function' ? 'function' : b.kind === 'class' ? 'class' : 'import', funcIds.get(b.owner) ?? -1, undefined);
      return b.vir;
    };
    const read = (nm: PyNode): ValueId => {
      const b = lookup(fnNode, nm.id);
      if (!b) return fb.emit('opaque', [], { note: `builtin ${nm.id}`, src: src(nm) });
      if (b.mode === 'ssa') return fb.readVariable(`p${b.id}`);
      if (b.owner !== fnNode) fb.func.captures.add(vb(b));
      return fb.emit('loadBinding', [], { binding: vb(b), src: src(nm) });
    };
    const write = (nm: PyNode | string, v: ValueId, at: PyNode) => {
      const b = lookup(fnNode, typeof nm === 'string' ? nm : nm.id)!;
      if (b.mode === 'ssa') { fb.writeVariable(`p${b.id}`, fb.current.id, v); return; }
      if (b.owner !== fnNode) fb.func.captures.add(vb(b));
      fb.emit('storeBinding', [v], { binding: vb(b), src: src(at) });
    };
    const live = () => { if (fb.terminated) fb.switchTo(fb.newBlock()); };
    const names = (n: PyNode): ValueId[] => {
      const out: ValueId[] = [];
      walk(n, (x) => { if (x.type === 'Name' && lookup(fnNode, x.id)) out.push(read(x)); });
      return out;
    };

    if (fnNode.type === 'FunctionDef') {
      fnNode.params.forEach((prm: PyNode, i: number) => {
        const v = fb.emit('param', [], { index: i, src: src(prm) });
        fb.func.params.push(v);
        const b = lookup(fnNode, prm.id)!;
        fb.func.paramBindings.push(b.mode === 'ssa' ? null : vb(b));
        write(prm, v, prm);
      });
    }

    // Function definitions are values bound when the def statement runs.
    function stmts(list: PyNode[]) { for (const s of list) { live(); stmt(s); } }

    function counting(target: PyNode, start: ValueId, bound: ValueId, body: PyNode[], s: PyNode) {
      const key = `range${s.start}`;
      fb.writeVariable(key, fb.current.id, start);
      const head = fb.newBlock(), bodyB = fb.newBlock(), cont = fb.newBlock(), exit = fb.newBlock();
      fb.br(head.id);
      fb.switchTo(head);
      const i = fb.readVariable(key);
      const cond = fb.emit('binop', [i, bound], { operator: '<', src: src(s) });
      fb.terminate({ kind: 'condbr', cond, then: bodyB.id, else: exit.id, src: src(s) });
      fb.seal(bodyB.id);
      fb.switchTo(bodyB);
      write(target, fb.readVariable(key), target);
      loops.push({ breakTo: exit.id, continueTo: cont.id });
      stmts(body);
      loops.pop();
      fb.br(cont.id);
      fb.seal(cont.id);
      fb.switchTo(cont);
      fb.writeVariable(key, cont.id, fb.emit('binop', [fb.readVariable(key), fb.emit('const', [], { value: 1, note: 'int' })], { operator: '+' }));
      fb.br(head.id);
      fb.seal(head.id);
      fb.seal(exit.id);
      fb.switchTo(exit);
    }

    function stmt(s: PyNode): void {
      switch (s.type) {
        case 'Pass': case 'Global': return;
        case 'Expr': expr(s.value); return;
        case 'Import': case 'ImportFrom':
          for (const n of s.names) write(n, fb.emit('opaque', [], { note: 'import', src: src(n) }), s);
          return;
        case 'Assign': assign(s.target, () => expr(s.value), s); return;
        case 'AnnAssign': if (s.value) assign(s.target, () => expr(s.value), s); return;
        case 'AugAssign': {
          const t = s.target;
          if (t.type === 'Name') { const v = fb.emit('binop', [read(t), expr(s.value)], { operator: s.op, src: src(s) }); write(t, v, s); return; }
          if (t.type === 'Attribute') {
            const obj = expr(t.value);
            const old = fb.emit('field.get', [obj], { field: t.attr, src: src(t) });
            fb.emit('field.set', [obj, fb.emit('binop', [old, expr(s.value)], { operator: s.op, src: src(s) })], { field: t.attr, src: src(s) });
            return;
          }
          if (t.type === 'Subscript') {
            const obj = expr(t.value), idx = expr(t.index);
            const old = fb.emit('index.get', [obj, idx], { src: src(t) });
            fb.emit('index.set', [obj, idx, fb.emit('binop', [old, expr(s.value)], { operator: s.op, src: src(s) })], { src: src(s) });
            return;
          }
          fb.emit('opaque', names(s), { note: 'augmented assignment', src: src(s) });
          return;
        }
        case 'Return':
          fb.terminate({ kind: 'return', value: s.value ? expr(s.value) : null, src: src(s) });
          return;
        case 'If': {
          const c = expr(s.test);
          const th = fb.newBlock(), el = fb.newBlock(), join = fb.newBlock();
          fb.terminate({ kind: 'condbr', cond: c, then: th.id, else: el.id, src: src(s.test) });
          fb.seal(th.id); fb.seal(el.id);
          fb.switchTo(th); stmts(s.body); fb.br(join.id);
          fb.switchTo(el); stmts(s.orelse); fb.br(join.id);
          fb.seal(join.id); fb.switchTo(join);
          return;
        }
        case 'While': {
          const head = fb.newBlock(), body = fb.newBlock(), exit = fb.newBlock();
          fb.br(head.id); fb.switchTo(head);
          const c = expr(s.test);
          fb.terminate({ kind: 'condbr', cond: c, then: body.id, else: exit.id, src: src(s.test) });
          fb.seal(body.id); fb.switchTo(body);
          loops.push({ breakTo: exit.id, continueTo: head.id });
          stmts(s.body);
          loops.pop();
          fb.br(head.id); fb.seal(head.id); fb.seal(exit.id); fb.switchTo(exit);
          return;
        }
        case 'For': {
          const it = s.iter;
          const isRange = it.type === 'Call' && it.func.type === 'Name' && it.func.id === 'range' && !lookup(fnNode, 'range') && it.keywords.length === 0 && it.args.length >= 1 && it.args.length <= 2;
          if (isRange) {
            const start = it.args.length === 2 ? expr(it.args[0]) : fb.emit('const', [], { value: 0, note: 'int', src: src(it) });
            const bound = expr(it.args[it.args.length - 1]);
            counting(s.target, start, bound, s.body, s);
            return;
          }
          // for x in xs: an element loop over a list (or opaque iteration).
          const arr = expr(it);
          const key = `forin${s.start}`;
          fb.writeVariable(key, fb.current.id, fb.emit('const', [], { value: 0, note: 'int' }));
          const head = fb.newBlock(), bodyB = fb.newBlock(), cont = fb.newBlock(), exit = fb.newBlock();
          fb.br(head.id); fb.switchTo(head);
          const i = fb.readVariable(key);
          const viaIndex = it.type === 'Name';
          const cond = viaIndex
            ? fb.emit('binop', [i, fb.emit('field.get', [arr], { field: 'length', src: src(s) })], { operator: '<', src: src(s) })
            : fb.emit('opaque', [arr], { note: 'iterator protocol', src: src(s) });
          fb.terminate({ kind: 'condbr', cond, then: bodyB.id, else: exit.id, src: src(s) });
          fb.seal(bodyB.id); fb.switchTo(bodyB);
          const el = viaIndex
            ? fb.emit('index.get', [arr, fb.readVariable(key)], { note: 'for-of', src: src(s) })
            : fb.emit('opaque', [arr], { note: 'iterator value', src: src(s) });
          write(s.target, el, s.target);
          loops.push({ breakTo: exit.id, continueTo: cont.id });
          stmts(s.body);
          loops.pop();
          fb.br(cont.id); fb.seal(cont.id); fb.switchTo(cont);
          fb.writeVariable(key, cont.id, fb.emit('binop', [fb.readVariable(key), fb.emit('const', [], { value: 1, note: 'int' })], { operator: '+' }));
          fb.br(head.id); fb.seal(head.id); fb.seal(exit.id); fb.switchTo(exit);
          return;
        }
        case 'Break': case 'Continue': {
          const t = loops[loops.length - 1];
          if (t) fb.br(s.type === 'Break' ? t.breakTo : t.continueTo);
          return;
        }
        case 'FunctionDef': {
          const fid = lowerFn(s, s.name);
          const c = fb.emit('closure', [], { func: fid, src: src(s) });
          const b = lookup(fnNode, s.name)!;
          m.functions[fid].declaredAs = vb(b);
          if (b.mode === 'ssa') b.mode = 'cell';
          write(s.name, c, s);
          return;
        }
        case 'ClassDef':
          write(s.name, fb.emit('opaque', names(s), { note: 'class', src: src(s) }), s);
          return;
        default:
          fb.emit('opaque', names(s), { note: s.type, src: src(s) });
      }
    }

    function assign(t: PyNode, value: () => ValueId, at: PyNode) {
      if (t.type === 'Name') { write(t, value(), at); return; }
      if (t.type === 'Attribute') {
        const obj = expr(t.value);
        fb.emit('field.set', [obj, value()], { field: t.attr, src: src(at) });
        return;
      }
      if (t.type === 'Subscript') {
        const obj = expr(t.value), idx = expr(t.index);
        fb.emit('index.set', [obj, idx, value()], { src: src(at) });
        return;
      }
      fb.emit('opaque', [value(), ...names(t)], { note: 'assignment target', src: src(at) });
    }

    function expr(e: PyNode): ValueId {
      switch (e.type) {
        case 'Constant':
          if (e.kind === 'int' || e.kind === 'float') return fb.emit('const', [], { value: e.value, note: e.kind, src: src(e) });
          if (e.kind === 'str') return e.fstring ? fb.emit('opaque', fstringNames(e), { note: 'f-string', src: src(e) }) : fb.emit('const', [], { value: 'str', note: 'str', src: src(e) });
          return fb.emit('const', [], { value: e.value, note: e.kind, src: src(e) });
        case 'Name': return read(e);
        case 'BinOp': return fb.emit('binop', [expr(e.left), expr(e.right)], { operator: e.op, src: src(e) });
        case 'Compare': return fb.emit('binop', [expr(e.left), expr(e.right)], { operator: e.op, src: src(e) });
        case 'BoolOp': return fb.emit('logical', [expr(e.left), expr(e.right)], { operator: e.op, src: src(e) });
        case 'UnaryOp': return fb.emit('unop', [expr(e.operand)], { operator: e.op === 'not' ? '!' : e.op, src: src(e) });
        case 'IfExp': return fb.emit('select', [expr(e.test), expr(e.body), expr(e.orelse)], { src: src(e) });
        case 'Attribute': return fb.emit('field.get', [expr(e.value)], { field: e.attr, src: src(e) });
        case 'Subscript': return fb.emit('index.get', [expr(e.value), expr(e.index)], { src: src(e) });
        case 'List':
          return e.elts.length === 0
            ? fb.emit('array.empty', [], { src: src(e) })
            : fb.emit('array.new', e.elts.map(expr), { src: src(e) });
        case 'Call': return call(e);
        default: return fb.emit('opaque', names(e), { note: e.type, src: src(e) });
      }
    }

    function fstringNames(e: PyNode): ValueId[] {
      const out: ValueId[] = [];
      for (const m2 of String(e.raw).matchAll(/\{([^{}]*)\}/g)) {
        for (const id of m2[1].matchAll(/[A-Za-z_]\w*/g)) {
          if (lookup(fnNode, id[0])) out.push(read({ type: 'Name', id: id[0], start: e.start, end: e.end, line: e.line }));
        }
      }
      return out;
    }

    function call(e: PyNode): ValueId {
      const f = e.func;
      const builtin = (n: string) => f.type === 'Name' && f.id === n && !lookup(fnNode, n);
      if (f.type === 'Name' && dataclasses.has(f.id) && lookup(fnNode, f.id)?.owner === mod) {
        const dc = dataclasses.get(f.id)!;
        // Positional args, then keywords in field order; defaults fill the rest.
        const vals: ValueId[] = [];
        let ok = e.args.length <= dc.fields.length;
        const kwFields = e.keywords.map((k: { arg: string }) => k.arg);
        const rest = dc.fields.slice(e.args.length);
        let ki = 0;
        for (const fieldName of rest) {
          if (ki < kwFields.length && kwFields[ki] === fieldName) ki++;
          else if (dc.defaults[dc.fields.indexOf(fieldName)] === null) ok = false;
        }
        if (ki !== kwFields.length) ok = false;
        if (ok) {
          for (const a of e.args) vals.push(expr(a));
          let k2 = 0;
          for (const fieldName of rest) {
            if (k2 < e.keywords.length && e.keywords[k2].arg === fieldName) vals.push(expr(e.keywords[k2++].value));
            else vals.push(expr(dc.defaults[dc.fields.indexOf(fieldName)]!));
          }
          const r = fb.emit('record.new', vals, { fields: [...dc.fields], src: src(e) });
          recordClass.set(r, dc);
          return r;
        }
      }
      if (builtin('len') && e.args.length === 1 && !e.keywords.length) return fb.emit('field.get', [expr(e.args[0])], { field: 'length', note: 'len', src: src(e) });
      if ((builtin('float') || builtin('int')) && e.args.length === 1 && !e.keywords.length) return fb.emit('intrinsic', [expr(e.args[0])], { name: f.id, src: src(e) });
      if (f.type === 'Attribute' && f.value.type === 'Name') {
        const mb2 = lookup(fnNode, f.value.id);
        if (mb2 && mb2.kind === 'import' && mb2.module === 'math' && MATH.has(f.attr)) {
          return fb.emit('intrinsic', e.args.map(expr), { name: `math.${f.attr}`, src: src(e) });
        }
      }
      if (f.type === 'Attribute' && f.attr === 'append' && e.args.length === 1 && !e.keywords.length) {
        return fb.emit('push', [expr(f.value), expr(e.args[0])], { src: src(e) });
      }
      const args = [...e.args.map(expr), ...e.keywords.map((k: { value: PyNode }) => expr(k.value))];
      if (f.type === 'Attribute') {
        const obj = expr(f.value);
        const fn = fb.emit('field.get', [obj], { field: f.attr, src: src(f) });
        return fb.emit('call', [fn, obj, ...args], { note: 'method', src: src(e) });
      }
      return fb.emit('call', [expr(f), ...args], { src: src(e) });
    }

    stmts(fnNode.body);
    fb.terminate({ kind: 'return', value: null });
    fb.finish();
    return fb.func.id;
  }

  m.main = lowerFn(mod, '<module>');
  return { module: m, dataclasses, parent, recordClass };
}
