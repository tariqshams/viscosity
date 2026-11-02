#!/usr/bin/env node
// Migrate old Drip (the Lox-like language of the book's first drafts) to
// Drip as book/DRIP.md specifies it.
//
//   node scripts/migrate_drip.mjs file.drip...          rewrite files in place
//   node scripts/migrate_drip.mjs --stdin               old source in, new source out
//   node scripts/migrate_drip.mjs --chapters [--dry-run] [chapter...]
//
// The rewrite is AST-based: a small parser for old Drip finds the
// statements and expressions, and the tool edits the source text at
// exactly those places, so comments, layout and everything it doesn't
// need to touch stay as they were. It changes:
//
//   // comment              -> # comment
//   var, fun                -> let, fn
//   nil, and, or, this      -> none, &&, ||, self
//   class B < A             -> class B extends A
//   if (c) s, while (c) s   -> if c { s }, while c { s }   (braces always)
//   for (init; cond; inc) s -> for i in a..b { s }  when it is exactly a
//                              counting loop by 1 that doesn't assign i or
//                              capture it in a closure; otherwise the
//                              same loop as let + while
//   Foo(args)               -> new Foo(args)   when Foo is a class declared
//                              in the same program
//   a name that is a keyword now (new, self, in, none, ...) gets a `_`
//
// Source that doesn't parse as old Drip (a fragment, say) gets the
// token-level changes only, and is reported.
//
// --chapters finds Drip in book/src/content/chapters/*/cards.js (examples
// and exercises whose lang is 'drip' or 'drip-vm': code, starter,
// solution, wrong attempts, and `tests`, the expected output, which is
// recomputed by running the migrated solution where printing changed) and
// in ```drip fences, and ```text fences that parse as old Drip, in
// index.mdx. It reports every change, and with --dry-run writes nothing.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---- scanning old Drip -------------------------------------------------

const OLD_KEYWORDS = new Set([
  'and', 'class', 'else', 'false', 'for', 'fun', 'fn', 'if', 'nil', 'or', 'print', 'return',
  'super', 'this', 'true', 'var', 'let', 'while',
]);
/** Words that are keywords in new Drip but were names in old Drip. */
const NEW_KEYWORDS = new Set(['break', 'continue', 'extends', 'in', 'init', 'new', 'none', 'self']);

/** Tokens with offsets; comments separately. Never throws. */
export function scanOld(src) {
  const tokens = [];
  const comments = [];
  let i = 0;
  let line = 1;
  const isDigit = (c) => c >= '0' && c <= '9';
  const isAlpha = (c) => /[A-Za-z_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    const start = i;
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      comments.push({ start, end: i, text: src.slice(start, i) });
      continue;
    }
    if (c === '"') {
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\n') line++;
        i++;
      }
      i++;
      tokens.push({ type: 'string', text: src.slice(start, i), start, end: i, line });
      continue;
    }
    if (isDigit(c)) {
      while (isDigit(src[i])) i++;
      if (src[i] === '.' && isDigit(src[i + 1] ?? '')) {
        i++;
        while (isDigit(src[i])) i++;
      }
      tokens.push({ type: 'number', text: src.slice(start, i), start, end: i, line });
      continue;
    }
    if (isAlpha(c)) {
      while (i < src.length && /[A-Za-z_0-9]/.test(src[i])) i++;
      const text = src.slice(start, i);
      tokens.push({ type: OLD_KEYWORDS.has(text) ? text : 'identifier', text, start, end: i, line });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['!=', '==', '<=', '>='].includes(two)) {
      i += 2;
      tokens.push({ type: two, text: two, start, end: i, line });
      continue;
    }
    i++;
    tokens.push({ type: c, text: c, start, end: i, line });
  }
  tokens.push({ type: 'eof', text: '', start: src.length, end: src.length, line });
  return { tokens, comments };
}

// ---- parsing old Drip ----------------------------------------------------

class OldParseError extends Error {}

/** Parse old Drip into a tree of nodes with source spans. Throws OldParseError. */
export function parseOld(src) {
  const { tokens, comments } = scanOld(src);
  let p = 0;
  const peek = () => tokens[p];
  const prev = () => tokens[p - 1];
  const check = (t) => peek().type === t;
  const match = (...ts) => {
    if (ts.includes(peek().type)) {
      p++;
      return true;
    }
    return false;
  };
  const expect = (t) => {
    if (!check(t)) throw new OldParseError(`line ${peek().line}: expected ${t}, found '${peek().text || 'end'}'`);
    return tokens[p++];
  };
  const classes = new Set();
  let depth = 0; // 0 at the top level of the program

  function declaration() {
    const start = peek().start;
    if (match('class')) {
      const name = expect('identifier');
      classes.add(name.text);
      let less = null;
      let superclass = null;
      if (match('<')) {
        less = prev();
        superclass = expect('identifier');
      }
      expect('{');
      const methods = [];
      while (!check('}') && !check('eof')) methods.push(fnRest('method'));
      expect('}');
      return { kind: 'class', start, end: prev().end, name, less, superclass, methods };
    }
    if (check('fun') || check('fn')) {
      if (tokens[p + 1].type === 'identifier') {
        p++;
        return { ...fnRest('function'), start, end: prev().end };
      }
    }
    if (match('var', 'let')) {
      const name = expect('identifier');
      const init = match('=') ? expression() : null;
      expect(';');
      return { kind: 'var', start, end: prev().end, name, init };
    }
    return statement();
  }

  function fnRest(kind) {
    const start = peek().start;
    const name = expect('identifier');
    expect('(');
    const params = [];
    if (!check(')')) {
      do params.push(expect('identifier'));
      while (match(','));
    }
    expect(')');
    const body = block();
    return { kind: 'fun', fnKind: kind, start, end: prev().end, name, params, body };
  }

  function block() {
    const lbrace = expect('{');
    depth++;
    const statements = [];
    while (!check('}') && !check('eof')) statements.push(declaration());
    depth--;
    const rbrace = expect('}');
    return { kind: 'block', start: lbrace.start, end: rbrace.end, lbrace, rbrace, statements };
  }

  function statement() {
    const start = peek().start;
    if (match('print')) {
      const value = expression();
      expect(';');
      return { kind: 'print', start, end: prev().end, value };
    }
    if (match('return')) {
      const value = check(';') ? null : expression();
      expect(';');
      return { kind: 'return', start, end: prev().end, value };
    }
    if (match('if')) {
      const lparen = expect('(');
      const cond = expression();
      const rparen = expect(')');
      const then = statement();
      let elseTok = null;
      let otherwise = null;
      if (match('else')) {
        elseTok = prev();
        otherwise = statement();
      }
      return { kind: 'if', start, end: prev().end, keyword: tokens[p], lparen, cond, rparen, then, elseTok, otherwise };
    }
    if (match('while')) {
      const lparen = expect('(');
      const cond = expression();
      const rparen = expect(')');
      const body = statement();
      return { kind: 'while', start, end: prev().end, lparen, cond, rparen, body };
    }
    if (match('for')) {
      const atTop = depth === 0;
      expect('(');
      let init = null;
      if (match(';')) init = null;
      else if (check('var') || check('let')) init = declaration();
      else {
        const s = peek().start;
        const e = expression();
        expect(';');
        init = { kind: 'expr', start: s, end: prev().end, expr: e };
      }
      const cond = check(';') ? null : expression();
      expect(';');
      const inc = check(')') ? null : expression();
      expect(')');
      depth++; // the loop variable's scope
      const body = statement();
      depth--;
      return { kind: 'for', start, end: prev().end, atTop, init, cond, inc, body };
    }
    if (check('{')) {
      const b = block();
      return b;
    }
    const expr = expression();
    expect(';');
    return { kind: 'expr', start, end: prev().end, expr };
  }

  // Expressions, by precedence.
  function expression() {
    return assignment();
  }
  function assignment() {
    const left = or();
    if (match('=')) {
      const value = assignment();
      if (left.kind !== 'variable' && left.kind !== 'get') throw new OldParseError('invalid assignment target');
      return { kind: 'assign', start: left.start, end: value.end, target: left, value };
    }
    return left;
  }
  const binaryLevel = (next, ...ops) => () => {
    let left = next();
    while (match(...ops)) {
      const op = prev();
      const right = next();
      left = { kind: 'binary', start: left.start, end: right.end, op, left, right };
    }
    return left;
  };
  const unary = () => {
    if (match('!', '-')) {
      const op = prev();
      const right = unary();
      return { kind: 'unary', start: op.start, end: right.end, op, right };
    }
    return call();
  };
  const factor = binaryLevel(unary, '*', '/');
  const term = binaryLevel(factor, '+', '-');
  const comparison = binaryLevel(term, '<', '<=', '>', '>=');
  const equality = binaryLevel(comparison, '==', '!=');
  const and = binaryLevel(equality, 'and');
  const or = binaryLevel(and, 'or');

  function call() {
    let e = primary();
    for (;;) {
      if (match('(')) {
        const args = [];
        if (!check(')')) {
          do args.push(expression());
          while (match(','));
        }
        expect(')');
        e = { kind: 'call', start: e.start, end: prev().end, callee: e, args };
      } else if (match('.')) {
        const name = expect('identifier');
        e = { kind: 'get', start: e.start, end: name.end, object: e, name };
      } else return e;
    }
  }

  function primary() {
    const t = peek();
    if (match('number', 'string', 'true', 'false', 'nil')) return { kind: 'literal', start: t.start, end: t.end, token: t };
    if (match('this')) return { kind: 'this', start: t.start, end: t.end, token: t };
    if (match('identifier')) return { kind: 'variable', start: t.start, end: t.end, token: t };
    if (match('super')) {
      expect('.');
      const name = expect('identifier');
      return { kind: 'super', start: t.start, end: name.end, name };
    }
    if (match('(')) {
      const inner = expression();
      expect(')');
      return { kind: 'group', start: t.start, end: prev().end, inner };
    }
    if (check('fun') || check('fn')) {
      // An anonymous function, which some drafts had.
      p++;
      expect('(');
      const params = [];
      if (!check(')')) {
        do params.push(expect('identifier'));
        while (match(','));
      }
      expect(')');
      const body = block();
      return { kind: 'lambda', start: t.start, end: body.end, params, body };
    }
    throw new OldParseError(`line ${t.line}: expected an expression, found '${t.text || 'end of file'}'`);
  }

  const statements = [];
  while (!check('eof')) statements.push(declaration());
  return { statements, tokens, comments, classes };
}

// ---- rewriting -------------------------------------------------------------

/** Visit every node under `node` (objects with a `kind`). */
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
    return;
  }
  if (node.kind) visit(node);
  for (const [k, v] of Object.entries(node)) {
    if (k === 'token' || k === 'name' || k === 'op' || k === 'lparen' || k === 'rparen' || k === 'lbrace' || k === 'rbrace') continue;
    if (v && typeof v === 'object') walk(v, visit);
  }
}

const indentAt = (src, offset) => {
  const lineStart = src.lastIndexOf('\n', offset - 1) + 1;
  return src.slice(lineStart).match(/^[ \t]*/)[0];
};
const reindent = (text, extra) => text.replace(/\n(?=[^\n])/g, '\n' + extra);

/** Does `node` assign to variable `name`, or capture it in a function? */
function assignsOrCaptures(node, name) {
  let found = false;
  walk(node, (n) => {
    if (n.kind === 'assign' && n.target.kind === 'variable' && n.target.token.text === name) found = true;
    if (n.kind === 'fun' || n.kind === 'lambda') {
      walk(n.body, (m) => {
        if (m.kind === 'variable' && m.token.text === name) found = true;
      });
    }
  });
  return found;
}

/** `for (var i = a; i < b; i = i + 1)` (or `i <= b`): return { name, from, to, inclusive } or null. */
function countingLoop(f, src) {
  const { init, cond, inc, body } = f;
  if (!init || init.kind !== 'var' || !init.init || !cond || !inc) return null;
  const name = init.name.text;
  if (cond.kind !== 'binary' || (cond.op.type !== '<' && cond.op.type !== '<=') || cond.left.kind !== 'variable' || cond.left.token.text !== name) return null;
  if (inc.kind !== 'assign' || inc.target.kind !== 'variable' || inc.target.token.text !== name) return null;
  const v = inc.value;
  const isOne = (n) => n.kind === 'literal' && n.token.type === 'number' && Number(n.token.text) === 1;
  const isI = (n) => n.kind === 'variable' && n.token.text === name;
  if (!(v.kind === 'binary' && v.op.type === '+' && ((isI(v.left) && isOne(v.right)) || (isOne(v.left) && isI(v.right))))) return null;
  if (assignsOrCaptures(body, name)) return null;
  // The bound is evaluated once in new Drip: it must not change in the loop.
  let stable = true;
  walk(cond.right, (n) => {
    if (n.kind === 'call' || n.kind === 'get' || n.kind === 'assign') stable = false;
    if (n.kind === 'variable' && assignsOrCaptures(body, n.token.text)) stable = false;
    if (n.kind === 'variable' && n.token.text === name) stable = false;
  });
  if (!stable) return null;
  return { name, from: init.init, to: cond.right, inclusive: cond.op.type === '<=', src };
}

/**
 * Rewrite old Drip source. Returns { text, notes, parsed }: notes say what
 * could not be done automatically.
 */
export function migrate(src) {
  const notes = [];
  let parsed = null;
  try {
    parsed = parseOld(src);
  } catch (e) {
    if (!(e instanceof OldParseError)) throw e;
    notes.push(`does not parse as old Drip (${e.message}): only token-level changes made`);
  }
  const { tokens, comments } = parsed ?? scanOld(src);
  const classes = parsed?.classes ?? new Set();
  /** Replacements: { start, end, text: string | (render) => string } */
  const reps = [];
  const rep = (start, end, text) => reps.push({ start, end, text });

  // Token-level changes.
  for (const c of comments) rep(c.start, c.end, '#' + c.text.slice(2));
  const RENAME = { var: 'let', fun: 'fn', nil: 'none', and: '&&', or: '||', this: 'self' };
  tokens.forEach((t, i) => {
    if (RENAME[t.type]) rep(t.start, t.end, RENAME[t.type]);
    else if (t.type === 'identifier' && NEW_KEYWORDS.has(t.text)) {
      const isMethodName = t.text === 'init' && (tokens[i - 1]?.type === '{' || tokens[i - 1]?.type === '}' || tokens[i - 1]?.type === '.')
        && tokens[i + 1]?.type === '(';
      if (t.text === 'init' && tokens[i - 1]?.type === '.' && tokens[i - 2]?.type !== 'super') {
        notes.push(`line ${t.line}: calls init by name, which new Drip does not allow; rewrite it by hand`);
      } else if (!isMethodName) rep(t.start, t.end, t.text + '_');
    }
  });
  if (!parsed) {
    // Without a tree, `class B < A` can still be recognised by its tokens.
    tokens.forEach((t, i) => {
      if (t.type === '<' && tokens[i - 2]?.type === 'class' && tokens[i - 1]?.type === 'identifier') rep(t.start, t.end, 'extends');
    });
    if (tokens.some((t) => ['if', 'while', 'for'].includes(t.type))) {
      notes.push('has if/while/for that need parentheses removed and braces added by hand');
    }
    return { text: render(src, reps, 0, src.length), notes, parsed: false };
  }

  // Structural changes.
  const braced = (stmt, afterParen) => {
    // A statement that must become a block: `s` -> `{ s }`.
    if (stmt.kind === 'block') return;
    const between = src.slice(afterParen, stmt.start);
    if (between.includes('\n')) {
      const indent = indentAt(src, afterParen - 1);
      rep(afterParen, stmt.end, (r) => ` {${between}${r(stmt.start, stmt.end)}\n${indent}}`);
    } else {
      rep(stmt.start, stmt.end, (r) => `{ ${r(stmt.start, stmt.end)} }`);
    }
  };
  /** `(cond)` -> ` cond ` around a condition. */
  const unparen = (node) => {
    const before = src[node.lparen.start - 1];
    const after = src[node.rparen.end];
    rep(node.lparen.start, node.rparen.end, (r) =>
      (before === ' ' || before === undefined ? '' : ' ') + r(node.cond.start, node.cond.end) +
      (after === ' ' || after === '\n' || after === '\r' ? '' : ' '));
  };

  walk(parsed.statements, (n) => {
    switch (n.kind) {
      case 'if':
        unparen(n);
        braced(n.then, n.rparen.end);
        if (n.otherwise && n.otherwise.kind !== 'if') braced(n.otherwise, n.elseTok.end);
        break;
      case 'while':
        unparen(n);
        braced(n.body, n.rparen.end);
        break;
      case 'class':
        if (n.less) rep(n.less.start, n.less.end, 'extends');
        break;
      case 'call':
        if (n.callee.kind === 'variable' && classes.has(n.callee.token.text)) {
          rep(n.callee.start, n.callee.end, 'new ' + n.callee.token.text);
        }
        break;
      case 'for':
        rep(n.start, n.end, (r) => rewriteFor(n, r, src, tokens));
        break;
    }
  });
  return { text: render(src, reps, 0, src.length), notes, parsed: true };
}

/** The text of [a, b) with every replacement inside it applied, outermost first. */
function render(src, reps, a, b) {
  const inside = reps
    .filter((r) => r.start >= a && r.end <= b && !(r.start === a && r.end === b && r.self))
    .sort((x, y) => x.start - y.start || y.end - x.end);
  let out = '';
  let at = a;
  for (const r of inside) {
    if (r.start < at) continue; // nested in one already applied
    out += src.slice(at, r.start);
    if (typeof r.text === 'string') out += r.text;
    else {
      // Render the replacement's own span without itself.
      const others = reps.filter((x) => x !== r);
      out += r.text((s, e) => render(src, others, s, e));
    }
    at = r.end;
  }
  return out + src.slice(at, b);
}

function rewriteFor(f, r, src, tokens) {
  const indent = indentAt(src, f.start);
  const bodyText = () => {
    if (f.body.kind === 'block') {
      const inner = r(f.body.lbrace.end, f.body.rbrace.start).replace(/\s+$/, '');
      return inner.includes('\n') ? inner : `\n${indent}  ${inner.trim()}`;
    }
    return `\n${indent}  ${r(f.body.start, f.body.end)}`;
  };
  const counting = countingLoop(f, src);
  if (counting) {
    let to = r(counting.to.start, counting.to.end);
    if (counting.inclusive) {
      to = /^\d+$/.test(to) ? String(Number(to) + 1) : counting.to.kind === 'binary' ? `(${to}) + 1` : `${to} + 1`;
    }
    const head = `for ${counting.name} in ${r(counting.from.start, counting.from.end)}..${to} `;
    if (f.body.kind === 'block') return head + r(f.body.start, f.body.end);
    return `${head}{ ${r(f.body.start, f.body.end)} }`;
  }
  const cond = f.cond ? r(f.cond.start, f.cond.end) : 'true';
  let loop = `while ${cond} {${bodyText()}`;
  if (f.inc) loop += `\n${indent}  ${r(f.inc.start, f.inc.end)};`;
  loop += `\n${indent}}`;
  if (!f.init) return loop;
  const init = r(f.init.start, f.init.end);
  // At the top level a global may simply stay declared after the loop,
  // unless the name is used elsewhere; inside a function the loop needs
  // its own block, or a second loop's `let i` would clash.
  const name = f.init.kind === 'var' ? f.init.name.text : null;
  const usedElsewhere = name && tokens.some((t) => t.text === name && (t.start < f.start || t.start >= f.end));
  if (f.atTop && !usedElsewhere) return `${init}\n${indent}${loop}`;
  return `{\n${indent}  ${init}\n${indent}  ${reindent(loop, '  ')}\n${indent}}`;
}

// ---- printing changes: old expected output -> new ------------------------

/** What changed in how values print, for output that can't be re-run. */
export function migrateOutput(text) {
  return text
    .split('\n')
    .map((l) => l.replace(/^nil$/, 'none').replace(/^NaN$/, 'nan').replace(/^-?Infinity$/, (m) => (m[0] === '-' ? '-inf' : 'inf'))
      .replace(/^<fn (\w+)>$/, 'fn $1').replace(/^<native fn>$/, 'native fn'))
    .join('\n');
}

/** A line diff (longest common subsequence): the changed lines, as -/+. */
export function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      i++;
      j++;
    } else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) out.push(`- ${a[i++]}`);
    else out.push(`+ ${b[j++]}`);
  }
  return out;
}

// ---- --chapters ----------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const chaptersDir = join(here, '..', 'src', 'content', 'chapters');

/** The source-text forms a string value may have in a cards.js file. */
function literalForms(value) {
  const tpl = '`' + value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  const sq = "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  const dq = JSON.stringify(value);
  return [tpl, sq, dq];
}
const toTemplate = (value) => '`' + value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';

async function chapters(dryRun, only) {
  const { runDrip, checkDripOutput } = await import(pathToFileURL(join(here, '..', 'src', 'lib', 'drip.js')).href);
  const changes = [];
  const problems = [];
  let places = 0;
  const folders = readdirSync(chaptersDir).filter((f) => !only.length || only.some((o) => f.includes(o))).sort();
  for (const folder of folders) {
    const cardsPath = join(chaptersDir, folder, 'cards.js');
    if (existsSync(cardsPath)) {
      let text = readFileSync(cardsPath, 'utf8');
      const cards = await import(pathToFileURL(cardsPath).href + '?t=' + Date.now());
      const edits = []; // [oldValue, newValue, where]
      const plan = (where, oldValue, newValue, notes) => {
        places++;
        for (const n of notes) problems.push(`${folder}/cards.js ${where}: ${n}`);
        if (newValue !== oldValue) edits.push([oldValue, newValue, where]);
      };
      for (const [key, ex] of Object.entries(cards.examples ?? {})) {
        if (ex.lang !== 'drip' && ex.lang !== 'drip-vm') continue;
        const m = migrate(ex.code);
        plan(`examples.${key}.code`, ex.code, m.text, m.notes);
        const r = await runDrip(m.text, ex.lang);
        if (r.exitCode !== 0 && !ex.expectError) problems.push(`${folder}/cards.js examples.${key}: the migrated example fails: ${r.stderr.join(' / ')}`);
      }
      for (const [key, ex] of Object.entries(cards.exercises ?? {})) {
        if (ex.lang !== 'drip' && ex.lang !== 'drip-vm') continue;
        const sol = migrate(ex.solution);
        plan(`exercises.${key}.solution`, ex.solution, sol.text, sol.notes);
        const st = migrate(ex.starter);
        plan(`exercises.${key}.starter`, ex.starter, st.text, st.notes.filter((n) => !n.startsWith('does not parse')));
        let tests = ex.tests;
        const run = await runDrip(sol.text, ex.lang);
        if (run.exitCode === 0) {
          const out = run.stdout.flatMap((l) => l.split('\n')).join('\n');
          tests = out;
          if (out !== ex.tests.replace(/\n$/, '') && out !== migrateOutput(ex.tests.replace(/\n$/, ''))) {
            problems.push(`${folder}/cards.js exercises.${key}: the migrated solution prints something else than the old tests, beyond printing changes; check it`);
          }
          if (ex.tests.endsWith('\n')) tests += '\n';
        } else {
          tests = migrateOutput(ex.tests);
          problems.push(`${folder}/cards.js exercises.${key}: the migrated solution fails: ${run.stderr.join(' / ')}`);
        }
        plan(`exercises.${key}.tests`, ex.tests, tests, []);
        for (const [i, w] of (ex.wrong ?? []).entries()) {
          if (!w.code) continue;
          const mw = migrate(w.code);
          plan(`exercises.${key}.wrong[${i}]`, w.code, mw.text, mw.notes);
          const res = checkDripOutput(await runDrip(mw.text, ex.lang), tests);
          if (res.every((t) => t.ok)) problems.push(`${folder}/cards.js exercises.${key}.wrong[${i}]: the migrated wrong attempt now passes`);
        }
      }
      for (const [oldValue, newValue, where] of edits) {
        changes.push({ file: `${folder}/cards.js`, where, before: oldValue, after: newValue });
        const form = literalForms(oldValue).find((f) => text.includes(f));
        if (!form) {
          problems.push(`${folder}/cards.js ${where}: could not find the value in the source to replace it`);
          continue;
        }
        if (text.split(form).length > 2 && !dryRun) {
          // The same text in several places (a shared constant, or a starter
          // that repeats): replace them all, which is what a reader expects.
        }
        text = text.split(form).join(toTemplate(newValue));
      }
      if (!dryRun && edits.length) writeFileSync(cardsPath, text);
    }
    const mdxPath = join(chaptersDir, folder, 'index.mdx');
    if (existsSync(mdxPath)) {
      const src = readFileSync(mdxPath, 'utf8');
      let out = '';
      let at = 0;
      const fence = /^```(drip|text)[^\n]*\n([\s\S]*?)^```/gm;
      for (let m; (m = fence.exec(src)); ) {
        const [, lang, body] = m;
        let isDrip = lang === 'drip';
        if (!isDrip) {
          try {
            const p = parseOld(body);
            isDrip = p.statements.length > 0 && /;\s*$|}\s*$/.test(body.trim()) &&
              /\b(print|var|let|fun|fn|class|return)\b/.test(body);
          } catch {
            isDrip = false;
          }
        }
        if (!isDrip) continue;
        places++;
        const mg = migrate(body);
        for (const n of mg.notes) problems.push(`${folder}/index.mdx line ${src.slice(0, m.index).split('\n').length}: ${n}`);
        if (mg.text === body) continue;
        const start = m.index + m[0].indexOf('\n') + 1;
        out += src.slice(at, start) + mg.text;
        at = start + body.length;
        changes.push({ file: `${folder}/index.mdx`, where: `\`\`\`${lang} fence at line ${src.slice(0, m.index).split('\n').length}`, before: body, after: mg.text });
      }
      if (!dryRun && at > 0) writeFileSync(mdxPath, out + src.slice(at));
    }
  }
  for (const c of changes) {
    console.log(`\n=== ${c.file} ${c.where}`);
    for (const l of diffLines(c.before.split('\n'), c.after.split('\n'))) console.log(l);
  }
  console.log(`\n${places} places with Drip code found; ${changes.length} would change${dryRun ? ' (dry run: nothing written)' : ''}.`);
  if (problems.length) {
    console.log(`\n${problems.length} things to check by hand:`);
    for (const p of problems) console.log(`- ${p}`);
  }
  return { places, changes, problems };
}

// ---- the command line ----------------------------------------------------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--chapters')) {
    await chapters(args.includes('--dry-run'), args.filter((a) => !a.startsWith('--')));
  } else if (args.includes('--stdin')) {
    const src = readFileSync(0, 'utf8');
    const m = migrate(src);
    process.stdout.write(m.text);
    for (const n of m.notes) console.error(`note: ${n}`);
  } else if (args.length) {
    for (const file of args.filter((a) => !a.startsWith('--'))) {
      const src = readFileSync(file, 'utf8');
      const m = migrate(src);
      for (const n of m.notes) console.error(`${file}: ${n}`);
      if (args.includes('--dry-run')) process.stdout.write(m.text);
      else writeFileSync(file, m.text);
    }
  } else {
    console.error('usage: migrate_drip.mjs [--dry-run] file.drip... | --stdin | --chapters [--dry-run] [chapter...]');
    process.exit(64);
  }
}
