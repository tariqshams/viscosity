// The book's hand-written JavaScript parser (book chapter 92).
//
// It parses the subset of JavaScript that numeric, data-heavy code uses —
// declarations, functions and arrows, loops (including for-of), objects,
// arrays, calls, member access, and every operator with the right precedence
// — and produces ESTree nodes with start/end offsets and line numbers, the
// same shape acorn produces. Statements are recursive descent; expressions
// use Pratt binding powers (the same two techniques as Drip's parser).
// Anything outside the subset is a clear syntax error, so `--parser mini`
// never silently mis-parses.
import type { Node } from './estree.ts';

type Tok = { type: 'num' | 'str' | 'name' | 'punct' | 'template' | 'eof'; value: string; start: number; end: number; line: number; nlBefore: boolean };

const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'new', 'typeof', 'void', 'delete', 'true', 'false', 'null', 'of', 'in', 'instanceof', 'throw', 'try', 'catch', 'finally', 'this', 'export']);
const PUNCT = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>', '?.',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.'];

export class MiniSyntaxError extends SyntaxError { override name = 'MiniSyntaxError'; }

export interface MiniComment { value: string; line: number }

function tokenize(src: string, comments: MiniComment[] = []): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  let line = 1;
  let nl = false;
  const err = (m: string) => { throw new MiniSyntaxError(`${m} (line ${line})`); };
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; nl = true; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const s0 = i + 2;
      while (i < src.length && src[i] !== '\n') i++;
      comments.push({ value: src.slice(s0, i), line });
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const j = src.indexOf('*/', i + 2);
      if (j < 0) err('unterminated comment');
      for (let k = i; k < j; k++) if (src[k] === '\n') { line++; nl = true; }
      comments.push({ value: src.slice(i + 2, j), line });
      i = j + 2;
      continue;
    }
    const start = i;
    const push = (type: Tok['type'], value: string) => { toks.push({ type, value, start, end: i, line, nlBefore: nl }); nl = false; };
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
      if (c === '0' && /[xXbBoO]/.test(src[i + 1])) { i += 2; while (/[0-9a-fA-F_]/.test(src[i])) i++; }
      else {
        while (/[0-9_]/.test(src[i])) i++;
        if (src[i] === '.') { i++; while (/[0-9_]/.test(src[i])) i++; }
        if (/[eE]/.test(src[i])) { i++; if (/[+-]/.test(src[i])) i++; while (/[0-9]/.test(src[i])) i++; }
      }
      if (src[i] === 'n') err('BigInt literals are not supported by the mini parser');
      push('num', src.slice(start, i));
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      while (i < src.length && /[\w$]/.test(src[i])) i++;
      push('name', src.slice(start, i));
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; if (src[i] === '\n') err('unterminated string'); i++; }
      if (i >= src.length) err('unterminated string');
      i++;
      push('str', src.slice(start, i));
      continue;
    }
    if (c === '`') {
      i++;
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') i++;
        else if (src[i] === '$' && src[i + 1] === '{') err('template literals with ${} are not supported by the mini parser');
        if (src[i] === '\n') line++;
        i++;
      }
      i++;
      push('template', src.slice(start, i));
      continue;
    }
    const p = PUNCT.find((q) => src.startsWith(q, i));
    if (!p) err(`unexpected character '${c}'`);
    i += p!.length;
    push('punct', p!);
  }
  toks.push({ type: 'eof', value: '', start: src.length, end: src.length, line, nlBefore: true });
  return toks;
}

function decodeString(raw: string): string {
  return raw.slice(1, -1).replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/gs, (_m, e: string) => {
    if (e[0] === 'u') return String.fromCodePoint(parseInt(e[1] === '{' ? e.slice(2, -1) : e.slice(1), 16));
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    return ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0', '\n': '' } as Record<string, string>)[e] ?? e;
  });
}

// Binary operator binding powers (higher binds tighter).
const BIN: Record<string, number> = {
  '??': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6,
  '==': 7, '!=': 7, '===': 7, '!==': 7,
  '<': 8, '>': 8, '<=': 8, '>=': 8, instanceof: 8, in: 8,
  '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10, '*': 11, '/': 11, '%': 11, '**': 12,
};
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??=']);

export function parseMini(src: string, comments: MiniComment[] = []): Node {
  const toks = tokenize(src, comments);
  let p = 0;
  const peek = (o = 0) => toks[p + o];
  const at = (v: string) => peek().value === v && (peek().type === 'punct' || peek().type === 'name');
  const eat = (v: string) => (at(v) ? toks[p++] : null);
  const fail = (m: string): never => { throw new MiniSyntaxError(`${m} at line ${peek().line} near '${peek().value}'`); };
  const expect = (v: string) => eat(v) ?? fail(`expected '${v}'`);
  const node = (type: string, start: Tok, extra: Record<string, unknown>): Node =>
    ({ type, start: start.start, end: toks[p - 1].end, loc: { start: { line: start.line, column: 0 } }, ...extra }) as Node;
  const semi = () => {
    if (eat(';')) return;
    if (at('}') || peek().type === 'eof' || peek().nlBefore) return; // automatic semicolon insertion
    fail('expected \';\'');
  };
  const ident = (): Node => {
    const t = peek();
    if (t.type !== 'name' || (KEYWORDS.has(t.value) && t.value !== 'of')) fail('expected a name');
    p++;
    return { type: 'Identifier', name: t.value, start: t.start, end: t.end, loc: { start: { line: t.line, column: 0 } } } as Node;
  };

  // ---- statements -------------------------------------------------------------
  function statement(): Node {
    const t = peek();
    if (t.type === 'punct' && t.value === '{') return block();
    if (t.type === 'punct' && t.value === ';') { p++; return node('EmptyStatement', t, {}); }
    if (t.type === 'name') {
      switch (t.value) {
        case 'const': case 'let': case 'var': { const d = varDecl(); semi(); return d; }
        case 'function': return functionNode('FunctionDeclaration');
        case 'return': {
          p++;
          const arg = at(';') || at('}') || peek().nlBefore || peek().type === 'eof' ? null : expression();
          semi();
          return node('ReturnStatement', t, { argument: arg });
        }
        case 'if': {
          p++; expect('(');
          const test = expression(); expect(')');
          const consequent = statement();
          const alternate = eat('else') ? statement() : null;
          return node('IfStatement', t, { test, consequent, alternate });
        }
        case 'while': {
          p++; expect('(');
          const test = expression(); expect(')');
          return node('WhileStatement', t, { test, body: statement() });
        }
        case 'do': {
          p++;
          const body = statement();
          expect('while'); expect('(');
          const test = expression(); expect(')'); eat(';');
          return node('DoWhileStatement', t, { body, test });
        }
        case 'for': return forStatement();
        case 'break': case 'continue': {
          p++;
          const label = peek().type === 'name' && !peek().nlBefore && !KEYWORDS.has(peek().value) ? ident() : null;
          semi();
          return node(t.value === 'break' ? 'BreakStatement' : 'ContinueStatement', t, { label });
        }
        case 'throw': {
          p++;
          const arg = expression(); semi();
          return node('ThrowStatement', t, { argument: arg });
        }
        case 'try': {
          p++;
          const blk = block();
          let handler = null;
          if (at('catch')) {
            const c = toks[p++];
            let param = null;
            if (eat('(')) { param = ident(); expect(')'); }
            handler = node('CatchClause', c, { param, body: block() });
          }
          const finalizer = eat('finally') ? block() : null;
          return node('TryStatement', t, { block: blk, handler, finalizer });
        }
        case 'export': {
          p++;
          const decl = at('function') ? functionNode('FunctionDeclaration') : (() => { const d = varDecl(); semi(); return d; })();
          return node('ExportNamedDeclaration', t, { declaration: decl, specifiers: [], source: null });
        }
      }
    }
    const e = expression();
    semi();
    return node('ExpressionStatement', t, { expression: e });
  }

  function block(): Node {
    const t = expect('{');
    const body: Node[] = [];
    while (!at('}')) { if (peek().type === 'eof') fail('unclosed block'); body.push(statement()); }
    p++;
    return node('BlockStatement', t, { body });
  }

  function varDecl(allowIn = true): Node {
    const t = toks[p++];
    const declarations: Node[] = [];
    do {
      const s = peek();
      const id = ident();
      const init = eat('=') ? assignment(allowIn) : null;
      declarations.push(node('VariableDeclarator', s, { id, init }));
    } while (eat(','));
    return node('VariableDeclaration', t, { kind: t.value, declarations });
  }

  function forStatement(): Node {
    const t = toks[p++];
    expect('(');
    let init: Node | null = null;
    if (at('const') || at('let') || at('var')) init = varDecl(false);
    else if (!at(';')) init = expression(false);
    if (init && eat('of')) {
      if (init.type === 'VariableDeclaration' && init.declarations[0].init) fail('for-of declarations cannot have initializers');
      const right = assignment();
      expect(')');
      return node('ForOfStatement', t, { left: init, right, body: statement(), await: false });
    }
    expect(';');
    const test = at(';') ? null : expression();
    expect(';');
    const update = at(')') ? null : expression();
    expect(')');
    return node('ForStatement', t, { init, test, update, body: statement() });
  }

  function params(): Node[] {
    expect('(');
    const ps: Node[] = [];
    while (!at(')')) { ps.push(ident()); if (!at(')')) expect(','); }
    p++;
    return ps;
  }

  function functionNode(type: 'FunctionDeclaration' | 'FunctionExpression'): Node {
    const t = expect('function');
    const id = type === 'FunctionDeclaration' || peek().type === 'name' && !at('(') ? (peek().type === 'name' ? ident() : null) : null;
    const ps = params();
    const body = block();
    return node(type, t, { id, params: ps, body, generator: false, async: false, expression: false });
  }

  // ---- expressions (Pratt) ------------------------------------------------------
  function expression(allowIn = true): Node {
    const t = peek();
    const first = assignment(allowIn);
    if (!at(',')) return first;
    const expressions = [first];
    while (eat(',')) expressions.push(assignment(allowIn));
    return node('SequenceExpression', t, { expressions });
  }

  function isArrowAhead(): boolean {
    if (peek().type === 'name' && !KEYWORDS.has(peek().value) && peek(1).value === '=>') return true;
    if (!at('(')) return false;
    let depth = 0;
    for (let k = p; k < toks.length; k++) {
      const v = toks[k].value;
      if (toks[k].type === 'punct' && (v === '(' || v === '[' || v === '{')) depth++;
      if (toks[k].type === 'punct' && (v === ')' || v === ']' || v === '}')) { depth--; if (depth === 0) return toks[k + 1]?.value === '=>'; }
    }
    return false;
  }

  function arrow(): Node {
    const t = peek();
    const ps = at('(') ? params() : [ident()];
    expect('=>');
    if (at('{')) return node('ArrowFunctionExpression', t, { id: null, params: ps, body: block(), expression: false, generator: false, async: false });
    const body = assignment();
    return node('ArrowFunctionExpression', t, { id: null, params: ps, body, expression: true, generator: false, async: false });
  }

  function assignment(allowIn = true): Node {
    if (isArrowAhead()) return arrow();
    const t = peek();
    const left = conditional(allowIn);
    if (peek().type === 'punct' && ASSIGN.has(peek().value)) {
      if (left.type !== 'Identifier' && left.type !== 'MemberExpression') fail('invalid assignment target');
      const op = toks[p++].value;
      const right = assignment(allowIn);
      return node('AssignmentExpression', t, { operator: op, left, right });
    }
    return left;
  }

  function conditional(allowIn: boolean): Node {
    const t = peek();
    const test = binary(0, allowIn);
    if (!eat('?')) return test;
    const consequent = assignment();
    expect(':');
    const alternate = assignment(allowIn);
    return node('ConditionalExpression', t, { test, consequent, alternate });
  }

  function binary(minBp: number, allowIn: boolean): Node {
    const t = peek();
    let left = unary();
    for (;;) {
      const op = peek().value;
      const bp = (peek().type === 'punct' || op === 'instanceof' || op === 'in') ? BIN[op] : undefined;
      if (bp === undefined || bp <= minBp || (op === 'in' && !allowIn)) break;
      p++;
      // ** is right-associative: parse its right side at bp - 1.
      const right = binary(op === '**' ? bp - 1 : bp, allowIn);
      const type = op === '&&' || op === '||' || op === '??' ? 'LogicalExpression' : 'BinaryExpression';
      left = node(type, t, { operator: op, left, right });
    }
    return left;
  }

  function unary(): Node {
    const t = peek();
    if ((t.type === 'punct' && ['!', '-', '+', '~'].includes(t.value)) || (t.type === 'name' && ['typeof', 'void', 'delete'].includes(t.value))) {
      p++;
      return node('UnaryExpression', t, { operator: t.value, prefix: true, argument: unary() });
    }
    if (at('++') || at('--')) {
      p++;
      return node('UpdateExpression', t, { operator: t.value, prefix: true, argument: unary() });
    }
    const e = postfix();
    if ((at('++') || at('--')) && !peek().nlBefore) {
      const op = toks[p++].value;
      return node('UpdateExpression', t, { operator: op, prefix: false, argument: e });
    }
    return e;
  }

  function args(): Node[] {
    expect('(');
    const out: Node[] = [];
    while (!at(')')) {
      if (at('...')) { const s = toks[p++]; out.push(node('SpreadElement', s, { argument: assignment() })); }
      else out.push(assignment());
      if (!at(')')) expect(',');
    }
    p++;
    return out;
  }

  function postfix(): Node {
    const t = peek();
    let e: Node;
    if (at('new')) {
      p++;
      let callee = primary();
      while (at('.')) { p++; callee = node('MemberExpression', t, { object: callee, property: ident(), computed: false, optional: false }); }
      e = node('NewExpression', t, { callee, arguments: at('(') ? args() : [] });
    } else {
      e = primary();
    }
    for (;;) {
      if (at('.')) { p++; e = node('MemberExpression', t, { object: e, property: ident(), computed: false, optional: false }); }
      else if (at('[')) { p++; const prop = expression(); expect(']'); e = node('MemberExpression', t, { object: e, property: prop, computed: true, optional: false }); }
      else if (at('(')) { const a = args(); e = node('CallExpression', t, { callee: e, arguments: a, optional: false }); }
      else if (at('?.')) fail('optional chaining is not supported by the mini parser');
      else return e;
    }
  }

  function primary(): Node {
    const t = peek();
    if (t.type === 'num') {
      p++;
      return node('Literal', t, { value: Number(t.value.replace(/_/g, '')), raw: t.value });
    }
    if (t.type === 'str') { p++; return node('Literal', t, { value: decodeString(t.value), raw: t.value }); }
    if (t.type === 'template') {
      p++;
      const cooked = t.value.slice(1, -1);
      return node('TemplateLiteral', t, { expressions: [], quasis: [{ type: 'TemplateElement', start: t.start + 1, end: t.end - 1, value: { raw: cooked, cooked }, tail: true }] });
    }
    if (t.type === 'name') {
      switch (t.value) {
        case 'true': case 'false': p++; return node('Literal', t, { value: t.value === 'true', raw: t.value });
        case 'null': p++; return node('Literal', t, { value: null, raw: 'null' });
        case 'this': p++; return node('ThisExpression', t, {});
        case 'function': return functionNode('FunctionExpression');
      }
      return ident();
    }
    if (at('(')) {
      p++;
      const e = expression();
      expect(')');
      return e;
    }
    if (at('[')) {
      p++;
      const elements: Node[] = [];
      while (!at(']')) {
        if (at('...')) { const s = toks[p++]; elements.push(node('SpreadElement', s, { argument: assignment() })); }
        else elements.push(assignment());
        if (!at(']')) expect(',');
      }
      p++;
      return node('ArrayExpression', t, { elements });
    }
    if (at('{')) {
      p++;
      const properties: Node[] = [];
      while (!at('}')) {
        const s = peek();
        if (at('...')) { p++; properties.push(node('SpreadElement', s, { argument: assignment() })); }
        else {
          let key: Node;
          if (s.type === 'str' || s.type === 'num') { p++; key = node('Literal', s, { value: s.type === 'str' ? decodeString(s.value) : Number(s.value), raw: s.value }); }
          else if (s.type === 'name') { p++; key = { type: 'Identifier', name: s.value, start: s.start, end: s.end, loc: { start: { line: s.line, column: 0 } } } as Node; }
          else return fail('expected a property name');
          if (eat(':')) properties.push(node('Property', s, { key, value: assignment(), kind: 'init', computed: false, method: false, shorthand: false }));
          else {
            if (key.type !== 'Identifier' || KEYWORDS.has(key.name)) fail('expected \':\'');
            properties.push(node('Property', s, { key, value: { ...key }, kind: 'init', computed: false, method: false, shorthand: true }));
          }
        }
        if (!at('}')) expect(',');
      }
      p++;
      return node('ObjectExpression', t, { properties });
    }
    return fail('expected an expression');
  }

  const start = peek();
  const body: Node[] = [];
  while (peek().type !== 'eof') body.push(statement());
  return { type: 'Program', start: 0, end: src.length, loc: { start: { line: start.line, column: 0 } }, body, sourceType: 'module' } as Node;
}
