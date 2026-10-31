// Lowering JavaScript (ESTree) to VIR (book chapter 93).
//
// Each function becomes a VIR Func: a control-flow graph in SSA form. Local
// variables that no closure captures become SSA values. Captured variables,
// module-level variables used by inner functions, variables assigned inside
// try blocks, and every variable initialized with an array become explicit
// bindings (loadBinding/storeBinding), so the analyses can see every read and
// write of them.
//
// Anything the lowering does not model becomes an `opaque` instruction that
// takes, as arguments, every variable its subtree mentions. Opaque means
// "might do anything with these", so the analyses treat each as escaping.
// That is how the front-end stays sound without understanding all of
// JavaScript.
import { ModuleBuilder, type FunctionBuilder } from '../../core/src/builder.ts';
import type { BindingId, BlockId, Module, SourceRef, ValueId } from '../../core/src/vir.ts';
import { children, isFunction, patternNames, type Node } from './estree.ts';
import type { JsBinding, Resolution } from './resolve.ts';

const PURE_MATH = new Set([
  'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh',
  'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max', 'min', 'pow',
  'random', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc',
]);

export interface Lowered {
  module: Module;
  /** VIR binding id for each JS binding */
  bindingOf: Map<JsBinding, BindingId>;
  jsBinding: Map<BindingId, JsBinding>;
  /** bindings lowered as SSA values (never seen as load/store) */
  ssa: Set<JsBinding>;
}

export function lower(program: Node, source: string, res: Resolution): Lowered {
  const mb = new ModuleBuilder('javascript', source);
  const m = mb.module;
  const bindingOf = new Map<JsBinding, BindingId>();
  const jsBinding = new Map<BindingId, JsBinding>();
  const funcIdOf = new Map<Node, number>();
  const ssa = new Set<JsBinding>();

  const src = (n: Node): SourceRef => ({ node: n, start: n.start, end: n.end, line: n.loc?.start.line ?? 0 });

  // Decide SSA vs binding for every JS binding.
  const isArrayInit = (init: Node | null) =>
    !!init && (init.type === 'ArrayExpression' || (init.type === 'NewExpression' && init.callee.type === 'Identifier' && init.callee.name === 'Array'));
  for (const b of res.bindings) {
    const capturedElsewhere = [...b.usedIn].some((fn) => fn !== b.owner);
    const simple = b.kind === 'const' || b.kind === 'let' || b.kind === 'var' || b.kind === 'param' || b.kind === 'catch';
    if (simple && !capturedElsewhere && !b.assignedInTry && !isArrayInit(b.init)) ssa.add(b);
  }

  const vb = (b: JsBinding, owner: number): BindingId => {
    let id = bindingOf.get(b);
    if (id === undefined) {
      id = mb.addBinding(b.name, b.kind === 'catch' ? 'let' : b.kind, owner, b.decl ? src(b.decl) : undefined);
      bindingOf.set(b, id);
      jsBinding.set(id, b);
    }
    return id;
  };

  interface LoopTargets { breakTo: BlockId; continueTo: BlockId; label?: string }

  function lowerFunction(fnNode: Node, name: string): number {
    const fb = mb.newFunction(name, src(fnNode));
    funcIdOf.set(fnNode, fb.func.id);
    const loops: LoopTargets[] = [];
    let pendingLabel: string | undefined;

    const key = (b: JsBinding) => `b${b.id}`;
    const read = (b: JsBinding, at: Node): ValueId => {
      if (b.kind === 'global' && b.name === 'undefined') return fb.constant(undefined, src(at));
      if (b.kind === 'global' && b.name === 'NaN') return fb.constant(NaN, src(at));
      if (b.kind === 'global' && b.name === 'Infinity') return fb.constant(Infinity, src(at));
      if (ssa.has(b)) return fb.readVariable(key(b));
      if (b.owner !== fnNode) fb.func.captures.add(vb(b, -1));
      return fb.emit('loadBinding', [], { binding: vb(b, funcIdOf.get(b.owner) ?? -1), src: src(at) });
    };
    const write = (b: JsBinding, v: ValueId, at: Node) => {
      if (ssa.has(b)) {
        fb.writeVariable(key(b), fb.current.id, v);
        return;
      }
      if (b.owner !== fnNode) fb.func.captures.add(vb(b, -1));
      fb.emit('storeBinding', [v], { binding: vb(b, funcIdOf.get(b.owner) ?? -1), src: src(at) });
    };
    const binding = (id: Node) => res.refs.get(id)!;

    /** Keep lowering after a return/break: continue in a fresh, unreachable block. */
    const live = () => {
      if (fb.terminated) fb.switchTo(fb.newBlock());
    };

    /** Every variable a subtree mentions, read as values (for opaque). */
    const mentioned = (n: Node): ValueId[] => {
      const out: ValueId[] = [];
      const seen = new Set<JsBinding>();
      const visit = (x: Node, inner: boolean) => {
        if (x.type === 'Identifier') {
          const b = res.refs.get(x);
          if (b && !seen.has(b) && b.kind !== 'global') {
            seen.add(b);
            // Inside a nested function the variable is captured: it is a
            // binding by construction, so read the binding.
            out.push(inner && ssa.has(b) ? fb.readVariable(key(b)) : read(b, x));
          }
          return;
        }
        if (x.type === 'MemberExpression' && !x.computed) {
          visit(x.object, inner);
          return;
        }
        if ((x.type === 'Property' || x.type === 'MethodDefinition' || x.type === 'PropertyDefinition') && !x.computed) {
          if (x.value) visit(x.value, inner);
          return;
        }
        for (const c of children(x)) visit(c, inner || isFunction(x));
      };
      visit(n, false);
      return out;
    };
    const opaque = (n: Node, note: string): ValueId => fb.emit('opaque', mentioned(n), { note, src: src(n) });

    // ---- parameters and hoisted function declarations ------------------------
    (fnNode.params ?? []).forEach((p: Node, i: number) => {
      const v = fb.emit('param', [], { index: i, src: src(p) });
      fb.func.params.push(v);
      if (p.type === 'Identifier') {
        const b = binding(p);
        fb.func.paramBindings.push(ssa.has(b) ? null : vb(b, fb.func.id));
        write(b, v, p);
      } else {
        fb.func.paramBindings.push(null);
        // Destructuring or default parameter: the argument escapes.
        const o = fb.emit('opaque', [v, ...mentioned(p)], { note: 'parameter pattern', src: src(p) });
        for (const id of patternNames(p)) write(binding(id), o, id);
      }
    });
    const body: Node[] = fnNode.type !== "Program" && fnNode.body.type === "BlockStatement" ? fnNode.body.body : [];
    const hoist = (stmts: Node[]) => {
      for (const s of stmts) {
        const d = s.type === 'ExportNamedDeclaration' || s.type === 'ExportDefaultDeclaration' ? s.declaration : s;
        if (d && d.type === 'FunctionDeclaration') {
          const fid = lowerFunction(d, d.id.name);
          const c = fb.emit('closure', [], { func: fid, src: src(d) });
          const b = binding(d.id);
          m.functions[fid].declaredAs = vb(b, fb.func.id);
          write(b, c, d);
        }
      }
    };
    if (fnNode.type === 'Program') hoist(fnNode.body);
    else hoist(body);

    // ---- statements ---------------------------------------------------------
    function stmts(list: Node[]) {
      for (const s of list) stmt(s);
    }

    function loop(header: () => void, test: Node | null, bodyNode: Node, update: Node | null, label?: string) {
      const head = fb.newBlock();
      const bodyB = fb.newBlock();
      const cont = fb.newBlock();
      const exit = fb.newBlock();
      fb.br(head.id);
      fb.switchTo(head);
      header();
      if (test) {
        const c = expr(test);
        fb.terminate({ kind: 'condbr', cond: c, then: bodyB.id, else: exit.id, src: src(test) });
      } else {
        fb.br(bodyB.id);
      }
      fb.seal(bodyB.id);
      fb.switchTo(bodyB);
      loops.push({ breakTo: exit.id, continueTo: cont.id, label });
      stmt(bodyNode);
      loops.pop();
      fb.br(cont.id);
      fb.seal(cont.id);
      fb.switchTo(cont);
      if (update) expr(update);
      fb.br(head.id);
      fb.seal(head.id);
      fb.seal(exit.id);
      fb.switchTo(exit);
    }

    function declare(d: Node) {
      for (const decl of d.declarations) {
        if (decl.id.type === 'Identifier') {
          const b = binding(decl.id);
          if (decl.init) write(b, expr(decl.init), decl);
          else if (d.kind !== 'var') write(b, fb.constant(undefined, src(decl)), decl);
        } else {
          const v = decl.init ? expr(decl.init) : fb.constant(undefined);
          const o = fb.emit('opaque', [v], { note: 'destructuring', src: src(decl) });
          for (const id of patternNames(decl.id)) write(binding(id), o, id);
        }
      }
    }

    function stmt(s: Node): void {
      live();
      const label = pendingLabel;
      pendingLabel = undefined;
      switch (s.type) {
        case 'EmptyStatement':
        case 'FunctionDeclaration': // hoisted
        case 'DebuggerStatement':
          return;
        case 'ExpressionStatement':
          expr(s.expression);
          return;
        case 'VariableDeclaration':
          declare(s);
          return;
        case 'BlockStatement':
          hoist(s.body);
          stmts(s.body);
          return;
        case 'ReturnStatement':
          fb.terminate({ kind: 'return', value: s.argument ? expr(s.argument) : null, src: src(s) });
          return;
        case 'ThrowStatement':
          fb.terminate({ kind: 'throw', value: expr(s.argument), src: src(s) });
          return;
        case 'IfStatement': {
          const c = expr(s.test);
          const thenB = fb.newBlock();
          const elseB = fb.newBlock();
          const join = fb.newBlock();
          fb.terminate({ kind: 'condbr', cond: c, then: thenB.id, else: elseB.id, src: src(s.test) });
          fb.seal(thenB.id);
          fb.seal(elseB.id);
          fb.switchTo(thenB);
          stmt(s.consequent);
          fb.br(join.id);
          fb.switchTo(elseB);
          if (s.alternate) stmt(s.alternate);
          fb.br(join.id);
          fb.seal(join.id);
          fb.switchTo(join);
          return;
        }
        case 'WhileStatement':
          loop(() => {}, s.test, s.body, null, label);
          return;
        case 'DoWhileStatement': {
          const bodyB = fb.newBlock();
          const cont = fb.newBlock();
          const exit = fb.newBlock();
          fb.br(bodyB.id);
          fb.switchTo(bodyB);
          loops.push({ breakTo: exit.id, continueTo: cont.id, label });
          stmt(s.body);
          loops.pop();
          fb.br(cont.id);
          fb.seal(cont.id);
          fb.switchTo(cont);
          const c = expr(s.test);
          fb.terminate({ kind: 'condbr', cond: c, then: bodyB.id, else: exit.id, src: src(s.test) });
          fb.seal(bodyB.id);
          fb.seal(exit.id);
          fb.switchTo(exit);
          return;
        }
        case 'ForStatement':
          if (s.init) {
            if (s.init.type === 'VariableDeclaration') declare(s.init);
            else expr(s.init);
          }
          loop(() => {}, s.test, s.body, s.update, label);
          return;
        case 'ForOfStatement': {
          // for (const p of arr) body  ==>  index loop over arr (chapter 93).
          const arr = expr(s.right);
          const idxKey = `forof${s.start}`;
          fb.writeVariable(idxKey, fb.current.id, fb.constant(0, src(s)));
          const decl = s.left.type === 'VariableDeclaration' ? s.left.declarations[0].id : s.left;
          let lenTest: ValueId = -1;
          const head = fb.newBlock();
          const bodyB = fb.newBlock();
          const cont = fb.newBlock();
          const exit = fb.newBlock();
          fb.br(head.id);
          fb.switchTo(head);
          const i = fb.readVariable(idxKey);
          if (s.right.type === 'Identifier' && !s.await) {
            const len = fb.emit('field.get', [arr], { field: 'length', src: src(s) });
            lenTest = fb.emit('binop', [i, len], { operator: '<', src: src(s) });
          } else {
            lenTest = fb.emit('opaque', [arr], { note: 'iterator protocol', src: src(s) });
          }
          fb.terminate({ kind: 'condbr', cond: lenTest, then: bodyB.id, else: exit.id, src: src(s) });
          fb.seal(bodyB.id);
          fb.switchTo(bodyB);
          const el = s.right.type === 'Identifier' && !s.await
            ? fb.emit('index.get', [arr, fb.readVariable(idxKey)], { note: 'for-of', src: src(s) })
            : fb.emit('opaque', [arr], { note: 'iterator value', src: src(s) });
          if (decl.type === 'Identifier') write(binding(decl), el, decl);
          else {
            const o = fb.emit('opaque', [el], { note: 'destructuring', src: src(decl) });
            for (const id of patternNames(decl)) write(binding(id), o, id);
          }
          loops.push({ breakTo: exit.id, continueTo: cont.id, label });
          stmt(s.body);
          loops.pop();
          fb.br(cont.id);
          fb.seal(cont.id);
          fb.switchTo(cont);
          const one = fb.constant(1);
          fb.writeVariable(idxKey, cont.id, fb.emit('binop', [fb.readVariable(idxKey), one], { operator: '+' }));
          fb.br(head.id);
          fb.seal(head.id);
          fb.seal(exit.id);
          fb.switchTo(exit);
          return;
        }
        case 'ForInStatement': {
          const o = expr(s.right);
          loop(() => {
            const k = fb.emit('opaque', [o], { note: 'for-in key', src: src(s) });
            const decl = s.left.type === 'VariableDeclaration' ? s.left.declarations[0].id : s.left;
            for (const id of patternNames(decl)) write(binding(id), k, id);
          }, null, s.body, null, label);
          return;
        }
        case 'BreakStatement':
        case 'ContinueStatement': {
          const t = s.label ? [...loops].reverse().find((l) => l.label === s.label.name) : loops[loops.length - 1];
          if (!t) {
            opaque(s, 'labelled jump');
            return;
          }
          fb.br(s.type === 'BreakStatement' ? t.breakTo : t.continueTo);
          return;
        }
        case 'LabeledStatement':
          pendingLabel = s.label.name;
          stmt(s.body);
          return;
        case 'TryStatement':
          // Bindings assigned inside try blocks are never SSA (see resolve.ts),
          // so approximating control flow here stays sound for the analyses.
          stmt(s.block);
          live();
          if (s.handler) {
            if (s.handler.param) {
              const e = fb.emit('opaque', [], { note: 'caught exception', src: src(s.handler) });
              for (const id of patternNames(s.handler.param)) write(binding(id), e, id);
            }
            stmt(s.handler.body);
            live();
          }
          if (s.finalizer) stmt(s.finalizer);
          return;
        case 'SwitchStatement': {
          const d = expr(s.discriminant);
          const exit = fb.newBlock();
          loops.push({ breakTo: exit.id, continueTo: loops.length ? loops[loops.length - 1].continueTo : exit.id, label });
          // Model as: each case body may run (fall-through included).
          for (const c of s.cases) {
            if (c.test) fb.emit('binop', [d, expr(c.test)], { operator: '===', src: src(c) });
            const caseB = fb.newBlock();
            const next = fb.newBlock();
            const cond = fb.emit('opaque', [], { note: 'switch match' });
            fb.terminate({ kind: 'condbr', cond, then: caseB.id, else: next.id });
            fb.seal(caseB.id);
            fb.seal(next.id);
            fb.switchTo(caseB);
            stmts(c.consequent);
            fb.br(next.id);
            fb.switchTo(next);
          }
          loops.pop();
          fb.br(exit.id);
          fb.seal(exit.id);
          fb.switchTo(exit);
          return;
        }
        case 'ClassDeclaration': {
          const c = opaque(s, 'class');
          write(binding(s.id), c, s.id);
          return;
        }
        case 'ImportDeclaration':
          for (const sp of s.specifiers) write(binding(sp.local), fb.emit('opaque', [], { note: 'import', src: src(sp) }), sp.local);
          return;
        case 'ExportNamedDeclaration':
          if (s.declaration) {
            stmt(s.declaration);
            // Exported bindings are visible to other modules: they escape.
            const ids = s.declaration.type === 'VariableDeclaration'
              ? s.declaration.declarations.flatMap((d: Node) => patternNames(d.id))
              : s.declaration.id ? [s.declaration.id] : [];
            fb.emit('opaque', ids.map((id: Node) => read(binding(id), id)), { note: 'export', src: src(s) });
          } else if (!s.source) {
            fb.emit('opaque', s.specifiers.map((sp: Node) => read(binding(sp.local), sp.local)), { note: 'export', src: src(s) });
          }
          return;
        case 'ExportDefaultDeclaration':
          if (s.declaration.type === 'FunctionDeclaration' && s.declaration.id) {
            fb.emit('opaque', [read(binding(s.declaration.id), s.declaration.id)], { note: 'export', src: src(s) });
          } else if (s.declaration.type === 'ClassDeclaration') {
            stmt(s.declaration);
          } else {
            fb.emit('opaque', [expr(s.declaration)], { note: 'export', src: src(s) });
          }
          return;
        case 'ExportAllDeclaration':
          return;
        default:
          opaque(s, s.type);
      }
    }

    // ---- expressions -----------------------------------------------------------
    function assignTo(target: Node, value: () => ValueId, at: Node): ValueId {
      if (target.type === 'Identifier') {
        const v = value();
        write(binding(target), v, at);
        return v;
      }
      if (target.type === 'MemberExpression' && !target.optional) {
        const obj = expr(target.object);
        if (target.computed) {
          const idx = expr(target.property);
          const v = value();
          fb.emit('index.set', [obj, idx, v], { src: src(at) });
          return v;
        }
        const v = value();
        fb.emit('field.set', [obj, v], { field: target.property.name, src: src(at) });
        return v;
      }
      // Destructuring assignment: everything involved escapes.
      const v = value();
      const o = fb.emit('opaque', [v, ...mentioned(target)], { note: 'destructuring', src: src(at) });
      for (const id of patternNames(target)) write(binding(id), o, id);
      return v;
    }

    function readTarget(target: Node, at: Node): { get: () => ValueId; set: (v: ValueId) => void } | null {
      if (target.type === 'Identifier') {
        const b = binding(target);
        return { get: () => read(b, target), set: (v) => write(b, v, at) };
      }
      if (target.type === 'MemberExpression' && !target.optional) {
        const obj = expr(target.object);
        if (target.computed) {
          const idx = expr(target.property);
          return {
            get: () => fb.emit('index.get', [obj, idx], { src: src(target) }),
            set: (v) => { fb.emit('index.set', [obj, idx, v], { src: src(at) }); },
          };
        }
        const f = target.property.name;
        return {
          get: () => fb.emit('field.get', [obj], { field: f, src: src(target) }),
          set: (v) => { fb.emit('field.set', [obj, v], { field: f, src: src(at) }); },
        };
      }
      return null;
    }

    function expr(e: Node): ValueId {
      switch (e.type) {
        case 'Literal':
          if (e.regex || e.bigint !== undefined) return fb.emit('opaque', [], { note: 'literal', src: src(e) });
          return fb.constant(e.value, src(e));
        case 'Identifier':
          return read(binding(e), e);
        case 'TemplateLiteral':
          return fb.emit('opaque', e.expressions.map(expr), { note: 'template', src: src(e) });
        case 'BinaryExpression':
          return fb.emit('binop', [expr(e.left), expr(e.right)], { operator: e.operator, src: src(e) });
        case 'LogicalExpression':
          return fb.emit('logical', [expr(e.left), expr(e.right)], { operator: e.operator, src: src(e) });
        case 'UnaryExpression':
          if (e.operator === 'delete') return opaque(e, 'delete');
          return fb.emit('unop', [expr(e.argument)], { operator: e.operator, src: src(e) });
        case 'UpdateExpression': {
          const t = readTarget(e.argument, e);
          if (!t) return opaque(e, 'update');
          const old = fb.emit('unop', [t.get()], { operator: '+', src: src(e) }); // ToNumber
          const next = fb.emit('binop', [old, fb.constant(1)], { operator: e.operator === '++' ? '+' : '-', src: src(e) });
          t.set(next);
          return e.prefix ? next : old;
        }
        case 'AssignmentExpression': {
          if (e.operator === '=') return assignTo(e.left, () => expr(e.right), e);
          const t = readTarget(e.left, e);
          if (!t) return opaque(e, 'assignment');
          const op = e.operator.slice(0, -1);
          if (op === '&&' || op === '||' || op === '??') {
            const v = fb.emit('logical', [t.get(), expr(e.right)], { operator: op, src: src(e) });
            t.set(v);
            return v;
          }
          const v = fb.emit('binop', [t.get(), expr(e.right)], { operator: op, src: src(e) });
          t.set(v);
          return v;
        }
        case 'MemberExpression': {
          if (e.optional) return opaque(e, 'optional chain');
          const obj = expr(e.object);
          if (e.computed) return fb.emit('index.get', [obj, expr(e.property)], { src: src(e) });
          if (e.property.type === 'PrivateIdentifier') return fb.emit('opaque', [obj], { note: 'private field', src: src(e) });
          return fb.emit('field.get', [obj], { field: e.property.name, src: src(e) });
        }
        case 'ChainExpression':
          return opaque(e, 'optional chain');
        case 'CallExpression': {
          if (e.optional || e.arguments.some((a: Node) => a.type === 'SpreadElement')) return opaque(e, 'call');
          const c = e.callee;
          if (c.type === 'MemberExpression' && !c.computed && !c.optional) {
            // Math.sqrt(x) etc.: known pure numeric functions.
            if (c.object.type === 'Identifier' && c.object.name === 'Math' && res.refs.get(c.object)?.kind === 'global' && PURE_MATH.has(c.property.name)) {
              return fb.emit('intrinsic', e.arguments.map(expr), { name: `Math.${c.property.name}`, src: src(e) });
            }
            const obj = expr(c.object);
            if (c.property.name === 'push') {
              return fb.emit('push', [obj, ...e.arguments.map(expr)], { src: src(e) });
            }
            // A method call: the receiver and the arguments flow into it.
            const fn = fb.emit('field.get', [obj], { field: c.property.name, src: src(c) });
            return fb.emit('call', [fn, obj, ...e.arguments.map(expr)], { note: 'method', src: src(e) });
          }
          const fn = expr(c);
          return fb.emit('call', [fn, ...e.arguments.map(expr)], { src: src(e) });
        }
        case 'NewExpression':
          return fb.emit('opaque', [expr(e.callee), ...e.arguments.map((a: Node) => (a.type === 'SpreadElement' ? expr(a.argument) : expr(a)))], { note: 'new', src: src(e) });
        case 'ObjectExpression': {
          const fields: string[] = [];
          const values: ValueId[] = [];
          let simple = true;
          for (const p of e.properties) {
            if (p.type !== 'Property' || p.computed || p.kind !== 'init' || p.method) { simple = false; break; }
            const k = p.key.type === 'Identifier' ? p.key.name : typeof p.key.value === 'string' ? p.key.value : null;
            if (k === null || fields.includes(k)) { simple = false; break; }
            fields.push(k);
          }
          if (!simple) return opaque(e, 'object literal');
          for (const p of e.properties) values.push(expr(p.value));
          return fb.emit('record.new', values, { fields, src: src(e) });
        }
        case 'ArrayExpression':
          if (e.elements.some((x: Node | null) => !x || x.type === 'SpreadElement')) return opaque(e, 'array literal');
          if (e.elements.length === 0) return fb.emit('array.empty', [], { src: src(e) });
          return fb.emit('array.new', e.elements.map(expr), { src: src(e) });
        case 'FunctionExpression':
        case 'ArrowFunctionExpression': {
          const fid = lowerFunction(e, e.id?.name ?? '(anonymous)');
          return fb.emit('closure', [], { func: fid, src: src(e) });
        }
        case 'ConditionalExpression':
          return fb.emit('select', [expr(e.test), expr(e.consequent), expr(e.alternate)], { src: src(e) });
        case 'SequenceExpression': {
          let v = 0;
          for (const x of e.expressions) v = expr(x);
          return v;
        }
        case 'ParenthesizedExpression':
          return expr(e.expression);
        default:
          return opaque(e, e.type);
      }
    }

    // ---- body -------------------------------------------------------------------
    if (fnNode.type === 'Program') {
      stmts(fnNode.body);
      fb.terminate({ kind: 'return', value: null });
    } else if (fnNode.body.type === 'BlockStatement') {
      stmts(body);
      fb.terminate({ kind: 'return', value: null });
    } else {
      fb.terminate({ kind: 'return', value: expr(fnNode.body), src: src(fnNode.body) });
    }
    fb.finish();
    return fb.func.id;
  }

  m.main = lowerFunction(program, '<module>');
  // Bindings for main's captured locals must be owned by main.
  for (const [b, id] of bindingOf) {
    const owner = funcIdOf.get(b.owner);
    m.bindings[id].owner = owner ?? -1;
  }
  return { module: m, bindingOf, jsBinding, ssa };
}

export type { FunctionBuilder };
