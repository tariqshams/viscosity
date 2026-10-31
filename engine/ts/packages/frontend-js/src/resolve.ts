// Scope analysis for JavaScript (book chapters 42 and 93): resolve every
// identifier to the binding it refers to, and record which function each
// reference occurs in, so lowering knows which variables closures capture.
import type { Node } from './estree.ts';
import { children, isFunction, patternNames } from './estree.ts';

export interface JsBinding {
  id: number;
  name: string;
  kind: 'const' | 'let' | 'var' | 'param' | 'function' | 'class' | 'import' | 'global' | 'catch';
  /** the function (or Program) node whose scope declares it */
  owner: Node;
  decl: Node | null;
  /** functions (or Program) that reference it */
  usedIn: Set<Node>;
  /** assigned somewhere other than its declaration */
  reassigned: boolean;
  /** assigned inside a try block (SSA would be unsound across exception edges) */
  assignedInTry: boolean;
  /** the declarator's initializer, if any */
  init: Node | null;
}

interface Scope {
  names: Map<string, JsBinding>;
  parent: Scope | null;
  fn: Node;
  isFunctionScope: boolean;
}

export interface Resolution {
  bindings: JsBinding[];
  /** Identifier node -> binding (references and declarations) */
  refs: Map<Node, JsBinding>;
  /** parent pointers, for rewriting decisions */
  parent: Map<Node, Node>;
}

export function resolveScopes(program: Node): Resolution {
  const bindings: JsBinding[] = [];
  const refs = new Map<Node, JsBinding>();
  const parent = new Map<Node, Node>();
  const globals = new Map<string, JsBinding>();

  const make = (name: string, kind: JsBinding['kind'], owner: Node, decl: Node | null, init: Node | null = null): JsBinding => {
    const b: JsBinding = { id: bindings.length, name, kind, owner, decl, usedIn: new Set(), reassigned: false, assignedInTry: false, init };
    bindings.push(b);
    return b;
  };
  const declare = (scope: Scope, id: Node, kind: JsBinding['kind'], init: Node | null = null) => {
    let target = scope;
    if (kind === 'var' || kind === 'function') while (!target.isFunctionScope) target = target.parent!;
    let b = target.names.get(id.name);
    if (!b || kind === 'function') {
      b = make(id.name, kind, target.fn, id, init);
      target.names.set(id.name, b);
    }
    refs.set(id, b);
    return b;
  };
  const lookup = (scope: Scope | null, name: string): JsBinding => {
    for (let s = scope; s; s = s.parent) {
      const b = s.names.get(name);
      if (b) return b;
    }
    let g = globals.get(name);
    if (!g) {
      g = make(name, 'global', program, null);
      globals.set(name, g);
    }
    return g;
  };

  // Declare hoisted names (var, function) of a function body ahead of time,
  // and block-scoped names (let, const, class) at the start of each block.
  const hoistVars = (node: Node, scope: Scope) => {
    const visit = (n: Node) => {
      if (n.type === 'VariableDeclaration' && n.kind === 'var') {
        for (const d of n.declarations) for (const id of patternNames(d.id)) declare(scope, id, 'var', d.id.type === 'Identifier' ? d.init : null);
      }
      if (n.type === 'FunctionDeclaration' && n !== node) {
        declare(scope, n.id, 'function');
        return; // its body has its own scope
      }
      if (isFunction(n) && n !== node) return;
      for (const c of children(n)) visit(c);
    };
    for (const c of children(node)) visit(c);
  };
  const declareLexical = (stmts: Node[], scope: Scope) => {
    for (const s of stmts) {
      const d = (s.type === 'ExportNamedDeclaration' || s.type === 'ExportDefaultDeclaration') && s.declaration ? s.declaration : s;
      if (d.type === 'VariableDeclaration' && d.kind !== 'var') {
        for (const decl of d.declarations) for (const id of patternNames(decl.id)) declare(scope, id, d.kind, decl.id.type === 'Identifier' ? decl.init : null);
      } else if (d.type === 'ClassDeclaration' && d.id) {
        declare(scope, d.id, 'class');
      } else if (d.type === 'ImportDeclaration') {
        for (const sp of d.specifiers) declare(scope, sp.local, 'import');
      }
    }
  };

  let tryDepth = 0;
  const walk = (n: Node, scope: Scope, fn: Node) => {
    for (const c of children(n)) parent.set(c, n);
    switch (n.type) {
      case 'Program': {
        hoistVars(n, scope);
        declareLexical(n.body, scope);
        for (const c of n.body) walk(c, scope, fn);
        return;
      }
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        const fscope: Scope = { names: new Map(), parent: scope, fn: n, isFunctionScope: true };
        if (n.type === 'FunctionExpression' && n.id) declare(fscope, n.id, 'function');
        for (const p of n.params) for (const id of patternNames(p)) declare(fscope, id, 'param');
        hoistVars(n.body, fscope);
        const savedTry = tryDepth;
        tryDepth = 0;
        if (n.body.type === 'BlockStatement') {
          declareLexical(n.body.body, fscope);
          for (const c of n.body.body) walk(c, fscope, n);
        } else {
          walk(n.body, fscope, n);
        }
        for (const p of n.params) walkPatternDefaults(p, fscope, n);
        tryDepth = savedTry;
        return;
      }
      case 'BlockStatement':
      case 'StaticBlock': {
        const b: Scope = { names: new Map(), parent: scope, fn, isFunctionScope: false };
        declareLexical(n.body, b);
        for (const c of n.body) walk(c, b, fn);
        return;
      }
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement': {
        const b: Scope = { names: new Map(), parent: scope, fn, isFunctionScope: false };
        const init = n.type === 'ForStatement' ? n.init : n.left;
        if (init && init.type === 'VariableDeclaration' && init.kind !== 'var') declareLexical([init], b);
        for (const c of children(n)) walk(c, b, fn);
        return;
      }
      case 'SwitchStatement': {
        walk(n.discriminant, scope, fn);
        const b: Scope = { names: new Map(), parent: scope, fn, isFunctionScope: false };
        declareLexical(n.cases.flatMap((c: Node) => c.consequent), b);
        for (const c of n.cases) walk(c, b, fn);
        return;
      }
      case 'TryStatement': {
        tryDepth++;
        walk(n.block, scope, fn);
        tryDepth--;
        if (n.handler) walk(n.handler, scope, fn);
        if (n.finalizer) walk(n.finalizer, scope, fn);
        return;
      }
      case 'CatchClause': {
        const b: Scope = { names: new Map(), parent: scope, fn, isFunctionScope: false };
        for (const id of patternNames(n.param)) declare(b, id, 'catch');
        walk(n.body, b, fn);
        return;
      }
      case 'ClassDeclaration':
      case 'ClassExpression': {
        const b: Scope = { names: new Map(), parent: scope, fn, isFunctionScope: false };
        if (n.type === 'ClassExpression' && n.id) declare(b, n.id, 'class');
        if (n.superClass) walk(n.superClass, scope, fn);
        walk(n.body, b, fn);
        return;
      }
      case 'VariableDeclaration': {
        for (const d of n.declarations) {
          for (const id of patternNames(d.id)) {
            const b = refs.get(id) ?? lookup(scope, id.name);
            refs.set(id, b);
            b.usedIn.add(fn);
          }
          walkPatternDefaults(d.id, scope, fn);
          if (d.init) walk(d.init, scope, fn);
          parent.set(d, n);
          if (d.init) parent.set(d.init, d);
          parent.set(d.id, d);
        }
        return;
      }
      case 'Identifier': {
        const b = lookup(scope, n.name);
        refs.set(n, b);
        b.usedIn.add(fn);
        return;
      }
      case 'MemberExpression':
        walk(n.object, scope, fn);
        if (n.computed) walk(n.property, scope, fn);
        return;
      case 'Property':
      case 'PropertyDefinition':
      case 'MethodDefinition':
        if (n.computed) walk(n.key, scope, fn);
        if (n.value) walk(n.value, scope, fn);
        return;
      case 'LabeledStatement':
        walk(n.body, scope, fn);
        return;
      case 'BreakStatement':
      case 'ContinueStatement':
        return;
      case 'AssignmentExpression':
      case 'UpdateExpression': {
        const target = n.type === 'AssignmentExpression' ? n.left : n.argument;
        for (const id of target.type === 'MemberExpression' ? [] : patternNames(target)) {
          const b = lookup(scope, id.name);
          b.reassigned = true;
          if (tryDepth > 0) b.assignedInTry = true;
        }
        for (const c of children(n)) walk(c, scope, fn);
        return;
      }
      case 'ImportDeclaration':
        for (const sp of n.specifiers) refs.get(sp.local)?.usedIn.add(fn);
        return;
      case 'ExportNamedDeclaration':
        if (n.declaration) walk(n.declaration, scope, fn);
        else for (const sp of n.specifiers ?? []) if (!n.source) walk(sp.local, scope, fn);
        return;
      default:
        for (const c of children(n)) walk(c, scope, fn);
    }
  };
  const walkPatternDefaults = (p: Node, scope: Scope, fn: Node) => {
    if (!p) return;
    if (p.type === 'AssignmentPattern') {
      walk(p.right, scope, fn);
      walkPatternDefaults(p.left, scope, fn);
    } else if (p.type === 'ObjectPattern') {
      for (const q of p.properties) {
        if (q.computed) walk(q.key, scope, fn);
        walkPatternDefaults(q.type === 'RestElement' ? q.argument : q.value, scope, fn);
      }
    } else if (p.type === 'ArrayPattern') {
      for (const e of p.elements) walkPatternDefaults(e, scope, fn);
    }
  };

  const root: Scope = { names: new Map(), parent: null, fn: program, isFunctionScope: true };
  walk(program, root, program);
  return { bindings, refs, parent };
}
