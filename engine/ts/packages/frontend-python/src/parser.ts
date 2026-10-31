// Parsing a Python subset (book chapter 114): the part of Python that
// numeric, data-heavy code uses — functions, dataclass records, lists,
// for/while/if, arithmetic and calls. Statements are recursive descent;
// expressions use binding powers. Anything outside the subset is a clear
// syntax error rather than a silent mis-parse.
import { PySyntaxError, tokenize, type PyTok } from './tokens.ts';

export interface PyNode { type: string; start: number; end: number; line: number; [k: string]: any }

const BIN: Record<string, number> = {
  or: 1, and: 2,
  '<': 4, '>': 4, '==': 4, '!=': 4, '<=': 4, '>=': 4, in: 4, 'not in': 4, is: 4, 'is not': 4,
  '|': 5, '^': 6, '&': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '//': 10, '%': 10,
};
const AUG = new Set(['+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=']);
const KEYWORDS = new Set(['def', 'class', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'not', 'and', 'or', 'is', 'pass', 'break', 'continue', 'import', 'from', 'global', 'True', 'False', 'None', 'lambda', 'yield', 'with', 'try', 'except', 'finally', 'raise', 'as', 'del', 'assert', 'nonlocal', 'async', 'await']);

export function parsePython(src: string): PyNode {
  const toks = tokenize(src);
  let p = 0;
  const peek = (o = 0) => toks[p + o];
  const isOp = (v: string, o = 0) => peek(o).type === 'op' && peek(o).value === v;
  const isKw = (v: string, o = 0) => peek(o).type === 'name' && peek(o).value === v;
  const fail = (m: string): never => { throw new PySyntaxError(`${m} at line ${peek().line} near '${peek().value}'`); };
  const op = (v: string) => (isOp(v) ? toks[p++] : fail(`expected '${v}'`));
  const kw = (v: string) => (isKw(v) ? toks[p++] : fail(`expected '${v}'`));
  const node = (type: string, start: PyTok, extra: Record<string, unknown>): PyNode =>
    ({ type, start: start.start, end: toks[p - 1].end, line: start.line, ...extra });
  const name = (): PyNode => {
    const t = peek();
    if (t.type !== 'name' || KEYWORDS.has(t.value)) fail('expected a name');
    p++;
    return { type: 'Name', id: t.value, start: t.start, end: t.end, line: t.line };
  };
  const unsupported = (what: string): never => fail(`${what}: not supported by Viscosity's Python subset`);

  function block(): PyNode[] {
    op(':');
    if (peek().type !== 'newline') {
      const s = simpleLine();
      return s;
    }
    p++;
    if (peek().type !== 'indent') fail('expected an indented block');
    p++;
    const body: PyNode[] = [];
    while (peek().type !== 'dedent' && peek().type !== 'eof') body.push(...statement());
    p++;
    return body;
  }

  function simpleLine(): PyNode[] {
    const out = [simple()];
    while (isOp(';')) { p++; if (peek().type === 'newline') break; out.push(simple()); }
    if (peek().type !== 'newline' && peek().type !== 'eof') fail('expected end of line');
    if (peek().type === 'newline') p++;
    return out;
  }

  function statement(): PyNode[] {
    const t = peek();
    if (t.type === 'op' && t.value === '@') {
      p++;
      const dec = expr();
      if (peek().type !== 'newline') fail('expected end of line after decorator');
      p++;
      const inner = statement();
      inner[0].decorators = [dec, ...(inner[0].decorators ?? [])];
      inner[0].start = t.start;
      return inner;
    }
    if (t.type === 'name') {
      switch (t.value) {
        case 'def': {
          p++;
          const nm = name();
          op('(');
          const params: PyNode[] = [];
          while (!isOp(')')) {
            const prm = name();
            if (isOp(':')) { p++; expr(); }
            if (isOp('=')) unsupported('default parameter values');
            params.push(prm);
            if (!isOp(')')) op(',');
          }
          p++;
          if (isOp('->')) { p++; expr(); }
          const body = block();
          return [node('FunctionDef', t, { name: nm.id, nameNode: nm, params, body })];
        }
        case 'class': {
          p++;
          const nm = name();
          if (isOp('(')) { p++; if (!isOp(')')) unsupported('base classes'); p++; }
          const body = block();
          return [node('ClassDef', t, { name: nm.id, body })];
        }
        case 'if': {
          p++;
          const test = expr();
          const body = block();
          let orelse: PyNode[] = [];
          if (isKw('elif')) {
            toks[p] = { ...toks[p], value: 'if' };
            orelse = statement();
          } else if (isKw('else')) {
            p++;
            orelse = block();
          }
          return [node('If', t, { test, body, orelse })];
        }
        case 'while': {
          p++;
          const test = expr();
          const body = block();
          if (isKw('else')) unsupported('while-else');
          return [node('While', t, { test, body })];
        }
        case 'for': {
          p++;
          const target = name();
          kw('in');
          const iter = expr();
          const body = block();
          if (isKw('else')) unsupported('for-else');
          return [node('For', t, { target, iter, body })];
        }
        case 'try': case 'with': case 'async': case 'lambda': case 'yield':
          return unsupported(`'${t.value}'`);
      }
    }
    return simpleLine();
  }

  function simple(): PyNode {
    const t = peek();
    if (t.type === 'name') {
      switch (t.value) {
        case 'pass': p++; return node('Pass', t, {});
        case 'break': p++; return node('Break', t, {});
        case 'continue': p++; return node('Continue', t, {});
        case 'return': {
          p++;
          const value = peek().type === 'newline' || isOp(';') ? null : expr();
          return node('Return', t, { value });
        }
        case 'import': {
          p++;
          const names: PyNode[] = [name()];
          while (isOp('.')) { p++; name(); }
          if (isKw('as')) unsupported('import ... as');
          while (isOp(',')) { p++; names.push(name()); }
          return node('Import', t, { names });
        }
        case 'from': {
          p++;
          name();
          while (isOp('.')) { p++; name(); }
          kw('import');
          const names: PyNode[] = [name()];
          while (isOp(',')) { p++; names.push(name()); }
          return node('ImportFrom', t, { names });
        }
        case 'global': {
          p++;
          const names = [name()];
          while (isOp(',')) { p++; names.push(name()); }
          return node('Global', t, { names });
        }
        case 'del': case 'raise': case 'assert': case 'nonlocal':
          return unsupported(`'${t.value}'`);
      }
    }
    const target = expr();
    if (isOp('=')) {
      p++;
      const value = expr();
      if (isOp('=')) unsupported('chained assignment');
      return node('Assign', t, { target, value });
    }
    if (peek().type === 'op' && AUG.has(peek().value)) {
      const o = toks[p++].value.slice(0, -1);
      const value = expr();
      return node('AugAssign', t, { target, op: o, value });
    }
    if (isOp(':')) {
      // annotated assignment / declaration: x: float [= value]
      p++;
      const annotation = expr();
      const value = isOp('=') ? (p++, expr()) : null;
      return node('AnnAssign', t, { target, annotation, value });
    }
    return node('Expr', t, { value: target });
  }

  // ---- expressions ---------------------------------------------------------
  function expr(): PyNode {
    const t = peek();
    const body = binary(0);
    if (isKw('if')) {
      p++;
      const test = binary(0);
      kw('else');
      const orelse = expr();
      return node('IfExp', t, { test, body, orelse });
    }
    return body;
  }

  function binopAt(): string | null {
    const t = peek();
    if (t.type === 'op' && BIN[t.value] !== undefined) return t.value;
    if (t.type === 'name') {
      if (t.value === 'not' && isKw('in', 1)) return 'not in';
      if (t.value === 'is' && isKw('not', 1)) return 'is not';
      if (t.value === 'and' || t.value === 'or' || t.value === 'in' || t.value === 'is') return t.value;
    }
    return null;
  }

  function binary(minBp: number): PyNode {
    const t = peek();
    let left = unary();
    for (;;) {
      const o = binopAt();
      if (o === null) break;
      const bp = BIN[o];
      if (bp <= minBp) break;
      p += o.includes(' ') ? 2 : 1;
      const right = binary(bp);
      if (o === 'and' || o === 'or') left = node('BoolOp', t, { op: o, left, right });
      else if (bp === 4) {
        if (left.type === 'Compare') unsupported('chained comparisons');
        left = node('Compare', t, { op: o, left, right });
      } else left = node('BinOp', t, { op: o, left, right });
    }
    return left;
  }

  function unary(): PyNode {
    const t = peek();
    if (isKw('not')) { p++; return node('UnaryOp', t, { op: 'not', operand: binary(3) }); }
    if (isOp('-') || isOp('+') || isOp('~')) { p++; return node('UnaryOp', t, { op: t.value, operand: unary() }); }
    return power();
  }

  function power(): PyNode {
    const t = peek();
    const base = postfix();
    if (isOp('**')) {
      p++;
      return node('BinOp', t, { op: '**', left: base, right: unary() }); // right-associative
    }
    return base;
  }

  function postfix(): PyNode {
    const t = peek();
    let e = atom();
    for (;;) {
      if (isOp('.')) { p++; const a = name(); e = node('Attribute', t, { value: e, attr: a.id }); }
      else if (isOp('[')) {
        p++;
        if (isOp(':')) unsupported('slices');
        const index = expr();
        if (isOp(':')) unsupported('slices');
        op(']');
        e = node('Subscript', t, { value: e, index });
      } else if (isOp('(')) {
        p++;
        const args: PyNode[] = [];
        const keywords: { arg: string; value: PyNode }[] = [];
        while (!isOp(')')) {
          if (isOp('*') || isOp('**')) unsupported('*args / **kwargs');
          if (peek().type === 'name' && isOp('=', 1)) {
            const k = name();
            p++;
            keywords.push({ arg: k.id, value: expr() });
          } else {
            if (keywords.length) fail('positional argument after keyword argument');
            args.push(expr());
          }
          if (!isOp(')')) op(',');
        }
        p++;
        e = node('Call', t, { func: e, args, keywords });
      } else return e;
    }
  }

  function atom(): PyNode {
    const t = peek();
    if (t.type === 'num') {
      p++;
      return node('Constant', t, { value: Number(t.value.replace(/_/g, '')), kind: t.isFloat ? 'float' : 'int' });
    }
    if (t.type === 'str') {
      p++;
      // Adjacent string literals concatenate.
      while (peek().type === 'str') p++;
      return node('Constant', t, { value: 'str', kind: 'str', fstring: !!t.fstring, raw: src.slice(t.start, toks[p - 1].end) });
    }
    if (t.type === 'name') {
      if (t.value === 'True' || t.value === 'False') { p++; return node('Constant', t, { value: t.value === 'True', kind: 'bool' }); }
      if (t.value === 'None') { p++; return node('Constant', t, { value: null, kind: 'none' }); }
      return name();
    }
    if (isOp('(')) {
      p++;
      if (isOp(')')) { p++; return node('Tuple', t, { elts: [] }); }
      const e = expr();
      if (isOp(',')) {
        const elts = [e];
        while (isOp(',')) { p++; if (isOp(')')) break; elts.push(expr()); }
        op(')');
        return node('Tuple', t, { elts });
      }
      op(')');
      return e;
    }
    if (isOp('[')) {
      p++;
      const elts: PyNode[] = [];
      while (!isOp(']')) {
        elts.push(expr());
        if (isKw('for')) unsupported('list comprehensions');
        if (!isOp(']')) op(',');
      }
      p++;
      return node('List', t, { elts });
    }
    if (isOp('{')) return unsupported('dict and set literals');
    return fail('expected an expression');
  }

  const body: PyNode[] = [];
  while (peek().type !== 'eof') body.push(...statement());
  return { type: 'Module', start: 0, end: src.length, line: 1, body };
}
