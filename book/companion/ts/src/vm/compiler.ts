// The single-pass bytecode compiler (the book's chapters “One pass from source to bytecode” and “Globals by name” to “Objects and method calls in the VM”): a Pratt
// parser that emits bytecode as it parses, with no syntax tree in between.
//
// It parses with the same functions, in the same order, as the
// tree-walker's parser (src/parser.ts), and recovers from errors the same
// way, so the two report the same syntax errors. The static rules the
// tree-walker's resolver checks (redeclared locals, `return` outside a
// function, and so on) are checked here as the code is compiled; like the
// resolver, those are only reported when the program has no syntax errors.
import { Chunk, Op } from './chunk.ts';
import { Scanner, type VmToken } from './scanner.ts';
import type { ObjFunction, Value } from './object.ts';
import type { Heap } from './heap.ts';
import { describeToken, type TokenType } from '../token.ts';
import { INFIX_PREC, Prec, STATEMENT_STARTS } from '../parser.ts';

type FnType = 'script' | 'function' | 'anonymous' | 'method' | 'initializer';

interface Local {
  name: string;
  /** scope depth; -1 while its initialiser is being compiled */
  depth: number;
  isCaptured: boolean;
}
interface UpvalueRef { index: number; isLocal: boolean }

/** A loop being compiled, for `break` and `continue`. */
interface Loop {
  /** `break` pops the locals deeper than this, then jumps to the end */
  breakDepth: number;
  breaks: number[];
  /** `continue` pops the locals deeper than this, then goes on */
  continueDepth: number;
  /** a while loop continues by jumping back here; a for loop forward */
  continueTarget: number;
  continues: number[];
}

interface FnCompiler {
  enclosing: FnCompiler | null;
  fn: ObjFunction;
  type: FnType;
  locals: Local[];
  upvalues: UpvalueRef[];
  scopeDepth: number;
  loops: Loop[];
}

interface ClassCompiler { enclosing: ClassCompiler | null; hasSuperclass: boolean }

type PrefixFn = (canAssign: boolean) => void;

const MAX_SLOTS = 256;
const ASSIGN_OPS: TokenType[] = ['=', '+=', '-='];

const BINARY_OPS: Partial<Record<TokenType, number>> = {
  '+': Op.Add, '-': Op.Sub, '*': Op.Mul, '/': Op.Div, '%': Op.Rem,
  '==': Op.Eq, '!=': Op.Ne, '<': Op.Lt, '<=': Op.Le, '>': Op.Gt, '>=': Op.Ge,
};

/** Compile a program. Errors go to `errors`; with any, the result is null. */
export function compile(source: string, heap: Heap, errors: string[]): ObjFunction | null {
  const scanner = new Scanner(source);
  let current: VmToken = { type: 'eof', lexeme: '', line: 1 };
  let previous: VmToken = current;
  let panicMode = false;
  let blockDepth = 0;
  const syntaxErrors: string[] = [];
  const staticErrors: string[] = [];
  let compiler: FnCompiler | null = null;
  let classCompiler: ClassCompiler | null = null;

  const fc = () => compiler!;
  const chunk = (): Chunk => fc().fn.chunk;

  // ---- errors -------------------------------------------------------------
  function errorAt(token: VmToken, message: string) {
    if (panicMode) return;
    panicMode = true;
    syntaxErrors.push(`line ${token.line}: ${message}`);
  }
  const error = (message: string) => errorAt(previous, message);
  const expected = (what: string, at = current) => errorAt(at, `expected ${what}, found ${describeToken(current)}`);
  /** A broken static rule: reported only if there are no syntax errors. */
  const staticError = (token: VmToken, message: string) => staticErrors.push(`line ${token.line}: ${message}`);

  // ---- tokens -------------------------------------------------------------
  function advance() {
    previous = current;
    for (;;) {
      current = scanner.scanToken();
      if (current.type !== 'error') break;
      errorAt(current, current.lexeme);
    }
  }
  const check = (t: TokenType) => current.type === t;
  function match(t: TokenType) {
    if (!check(t)) return false;
    advance();
    return true;
  }
  const matchAny = (ts: TokenType[]) => ts.some((t) => match(t));
  function consume(t: TokenType, what: string) {
    if (check(t)) advance();
    else expected(what, t === ';' ? previous : current);
  }

  // ---- emitting -------------------------------------------------------------
  /** Emit bytes tagged with `line`: the line errors at this instruction report. */
  function emitAt(line: number, ...bytes: number[]) {
    const c = chunk();
    for (const b of bytes) c.write(b, line);
  }
  const emit = (...bytes: number[]) => emitAt(previous.line, ...bytes);
  const emitShort = (line: number, n: number) => emitAt(line, (n >> 8) & 0xff, n & 0xff);
  function emitLoop(loopStart: number) {
    emit(Op.Loop);
    const offset = chunk().code.length - loopStart + 2;
    if (offset > 0xffff) staticError(previous, 'loop body too large');
    emitShort(previous.line, offset);
  }
  function emitJump(op: number): number {
    emit(op, 0xff, 0xff);
    return chunk().code.length - 2;
  }
  function patchJump(offset: number) {
    const jump = chunk().code.length - offset - 2;
    if (jump > 0xffff) staticError(previous, 'too much code to jump over');
    chunk().code[offset] = (jump >> 8) & 0xff;
    chunk().code[offset + 1] = jump & 0xff;
  }
  function emitReturn() {
    if (fc().type === 'initializer') emit(Op.LoadLocal, 0);
    else emit(Op.None);
    emit(Op.Return);
  }
  function makeConstant(v: Value): number {
    const c = chunk().addConstant(v);
    if (c > 0xffff) {
      staticError(previous, 'too many constants in one function');
      return 0;
    }
    return c;
  }
  /** Emit an instruction with a two-byte constant operand. */
  const emitConstantOp = (line: number, op: number, k: number) => emitAt(line, op, (k >> 8) & 0xff, k & 0xff);

  // ---- functions and scopes -----------------------------------------------
  function initCompiler(type: FnType) {
    const fn = heap.newFunction(type === 'script');
    heap.compilerRoots.push(fn);
    compiler = { enclosing: compiler, fn, type, locals: [], upvalues: [], scopeDepth: 0, loops: [] };
    if (type === 'function' || type === 'method' || type === 'initializer') fn.name = heap.copyString(previous.lexeme);
    // Slot 0 holds the function itself, or `self` in methods.
    compiler.locals.push({ name: type === 'method' || type === 'initializer' ? 'self' : '', depth: 0, isCaptured: false });
  }
  function endCompiler(): ObjFunction {
    emitReturn();
    const c = fc();
    c.fn.upvalueCount = c.upvalues.length;
    compiler = c.enclosing;
    heap.compilerRoots.pop();
    return c.fn;
  }

  function beginScope() { fc().scopeDepth++; }
  function endScope() {
    const c = fc();
    c.scopeDepth--;
    while (c.locals.length > 0 && c.locals[c.locals.length - 1].depth > c.scopeDepth) {
      emit(c.locals[c.locals.length - 1].isCaptured ? Op.CloseUpvalue : Op.Pop);
      c.locals.pop();
    }
  }
  /** Pop (or close) the locals deeper than `depth`, without forgetting them:
   *  for `break` and `continue`, which leave scopes the code goes on to use. */
  function popLocalsDeeperThan(depth: number) {
    const locals = fc().locals;
    for (let i = locals.length - 1; i >= 0 && locals[i].depth > depth; i--) {
      emit(locals[i].isCaptured ? Op.CloseUpvalue : Op.Pop);
    }
  }

  const identifierConstant = (name: string) => makeConstant(heap.copyString(name));

  function resolveLocal(c: FnCompiler, name: VmToken): number {
    for (let i = c.locals.length - 1; i >= 0; i--) {
      const l = c.locals[i];
      if (l.name === name.lexeme) {
        if (l.depth === -1) staticError(name, `cannot read '${name.lexeme}' in its own initialiser`);
        return i;
      }
    }
    return -1;
  }
  function addUpvalue(c: FnCompiler, index: number, isLocal: boolean, name: VmToken): number {
    for (let i = 0; i < c.upvalues.length; i++) {
      if (c.upvalues[i].index === index && c.upvalues[i].isLocal === isLocal) return i;
    }
    if (c.upvalues.length === MAX_SLOTS) {
      staticError(name, 'too many captured variables in one function');
      return 0;
    }
    c.upvalues.push({ index, isLocal });
    return c.upvalues.length - 1;
  }
  function resolveUpvalue(c: FnCompiler, name: VmToken): number {
    if (!c.enclosing) return -1;
    const local = resolveLocal(c.enclosing, name);
    if (local !== -1) {
      c.enclosing.locals[local].isCaptured = true;
      return addUpvalue(c, local, true, name);
    }
    const up = resolveUpvalue(c.enclosing, name);
    if (up !== -1) return addUpvalue(c, up, false, name);
    return -1;
  }
  function addLocal(name: string, at: VmToken) {
    if (fc().locals.length === MAX_SLOTS) {
      staticError(at, 'too many local variables in one function');
      return;
    }
    fc().locals.push({ name, depth: -1, isCaptured: false });
  }
  /** Declare `name` in the current scope, if it is a local scope. */
  function declareVariable(name: VmToken) {
    const c = fc();
    if (c.scopeDepth === 0) return;
    for (let i = c.locals.length - 1; i >= 0; i--) {
      const l = c.locals[i];
      if (l.depth !== -1 && l.depth < c.scopeDepth) break;
      if (l.name === name.lexeme) staticError(name, `'${name.lexeme}' is already declared in this scope`);
    }
    addLocal(name.lexeme, name);
  }
  function markInitialized() {
    const c = fc();
    if (c.scopeDepth === 0) return;
    c.locals[c.locals.length - 1].depth = c.scopeDepth;
  }
  /** After its value is on the stack: a local is ready, a global is stored. */
  function defineVariable(name: VmToken) {
    if (fc().scopeDepth > 0) markInitialized();
    else emitConstantOp(name.line, Op.DefineGlobal, identifierConstant(name.lexeme));
  }

  // ---- declarations and statements ----------------------------------------
  function synchronize() {
    panicMode = false;
    let depth = 0;
    while (current.type !== 'eof') {
      if (depth === 0) {
        if (previous.type === ';') return;
        if (STATEMENT_STARTS.has(current.type)) return;
        if (current.type === '}' && blockDepth > 0) return;
      }
      if (current.type === '{') depth++;
      else if (current.type === '}' && depth > 0) depth--;
      advance();
    }
  }

  function declaration() {
    if (match('class')) classDeclaration();
    else if (match('fn')) {
      if (check('(')) expressionStatementFrom(fnExpression);
      else fnDeclaration();
    } else if (match('let')) letDeclaration();
    else statement();
    if (panicMode) synchronize();
  }

  function classDeclaration() {
    consume('identifier', 'a class name after \'class\'');
    const className = previous;
    const nameConstant = identifierConstant(className.lexeme);
    declareVariable(className);
    emitConstantOp(className.line, Op.Class, nameConstant);
    defineVariable(className);
    const cc: ClassCompiler = { enclosing: classCompiler, hasSuperclass: false };
    classCompiler = cc;
    if (match('extends')) {
      consume('identifier', 'a class name after \'extends\'');
      const superclass = previous;
      namedVariable(superclass, false);
      if (superclass.lexeme === className.lexeme) staticError(superclass, 'a class cannot extend itself');
      // The superclass lives in a local named `super`, which methods capture.
      beginScope();
      addLocal('super', superclass);
      markInitialized();
      namedVariable(className, false);
      emitAt(superclass.line, Op.Inherit);
      cc.hasSuperclass = true;
    }
    namedVariable(className, false);
    if (!check('{')) {
      expected('\'{\' before the class body');
    } else {
      advance();
      blockDepth++;
      while (!check('}') && !check('eof')) method();
      blockDepth--;
      consume('}', '\'}\' to close the class body');
    }
    emit(Op.Pop);
    if (cc.hasSuperclass) endScope();
    classCompiler = cc.enclosing;
  }

  function method() {
    if (!match('init') && !match('identifier')) {
      expected('a method name');
      advance();
      return;
    }
    const name = previous;
    const constant = identifierConstant(name.lexeme);
    fnRest(name.type === 'init' ? 'initializer' : 'method', '\'(\' after the method name');
    emitConstantOp(name.line, Op.Method, constant);
  }

  function fnDeclaration() {
    consume('identifier', 'a function name after \'fn\'');
    const name = previous;
    declareVariable(name);
    markInitialized(); // so the function can call itself
    fnRest('function', '\'(\' after the function name');
    defineVariable(name);
  }

  /** Compile parameters and body into a new function; leave its closure on the stack. */
  function fnRest(type: FnType, parenMessage: string) {
    initCompiler(type);
    beginScope();
    consume('(', parenMessage);
    if (!check(')')) {
      do {
        if (fc().fn.arity === 255) errorAt(current, 'a function cannot have more than 255 parameters');
        fc().fn.arity++;
        consume('identifier', 'a parameter name');
        declareVariable(previous);
        markInitialized();
      } while (match(','));
    }
    consume(')', '\')\' after the parameters');
    // The body shares the parameters' scope: `let` can't redeclare one.
    bracedBlock('\'{\' before the function body', false);
    const upvalues = fc().upvalues;
    const fn = endCompiler();
    emitConstantOp(previous.line, Op.Closure, makeConstant(fn));
    for (const u of upvalues) emit(u.isLocal ? 1 : 0, u.index);
  }

  function letDeclaration() {
    consume('identifier', 'a variable name after \'let\'');
    const name = previous;
    declareVariable(name);
    if (match('=')) expression();
    else emit(Op.None);
    consume(';', '\';\' after the variable declaration');
    defineVariable(name);
  }

  function statement() {
    if (match('print')) {
      expression();
      consume(';', '\';\' after the value');
      emit(Op.Print);
    } else if (match('for')) forStatement();
    else if (match('if')) ifStatement();
    else if (match('return')) returnStatement();
    else if (match('while')) whileStatement();
    else if (match('break') || match('continue')) jumpStatement();
    else if (match('{')) {
      beginScope();
      block();
      endScope();
    } else expressionStatementFrom(null);
  }

  function expressionStatementFrom(prefix: PrefixFn | null) {
    if (prefix) continueExpression(Prec.ASSIGNMENT, prefix);
    else expression();
    consume(';', '\';\' after the expression');
    emit(Op.Pop);
  }

  function returnStatement() {
    const keyword = previous;
    if (fc().type === 'script') staticError(keyword, '\'return\' outside a function');
    if (match(';')) {
      emitReturn();
      return;
    }
    if (fc().type === 'initializer') staticError(keyword, '\'init\' cannot return a value');
    expression();
    consume(';', '\';\' after the return value');
    emit(Op.Return);
  }

  function jumpStatement() {
    const keyword = previous;
    const loop = fc().loops[fc().loops.length - 1];
    if (!loop) staticError(keyword, `'${keyword.lexeme}' outside a loop`);
    else if (keyword.type === 'break') {
      popLocalsDeeperThan(loop.breakDepth);
      loop.breaks.push(emitJump(Op.Jump));
    } else {
      popLocalsDeeperThan(loop.continueDepth);
      if (loop.continueTarget >= 0) emitLoop(loop.continueTarget);
      else loop.continues.push(emitJump(Op.Jump));
    }
    consume(';', `';' after '${keyword.lexeme}'`);
  }

  /** `{` declaration* `}` in a scope of its own. With no `{`, report it and
   *  compile no body (the tree-walker's parser does the same). */
  function bracedBlock(what: string, ownScope = true) {
    if (!check('{')) {
      expected(what);
      return;
    }
    advance();
    if (ownScope) beginScope();
    block();
    if (ownScope) endScope();
  }

  function ifStatement() {
    expression();
    const thenJump = emitJump(Op.JumpUnless);
    bracedBlock('\'{\' after the condition');
    if (match('else')) {
      const elseJump = emitJump(Op.Jump);
      patchJump(thenJump);
      if (match('if')) ifStatement();
      else bracedBlock('\'{\' or \'if\' after \'else\'');
      patchJump(elseJump);
    } else {
      patchJump(thenJump);
    }
  }

  function whileStatement() {
    const loopStart = chunk().code.length;
    expression();
    const exitJump = emitJump(Op.JumpUnless);
    const depth = fc().scopeDepth;
    const loop: Loop = { breakDepth: depth, breaks: [], continueDepth: depth, continueTarget: loopStart, continues: [] };
    fc().loops.push(loop);
    bracedBlock('\'{\' after the condition');
    emitLoop(loopStart);
    patchJump(exitJump);
    for (const b of loop.breaks) patchJump(b);
    fc().loops.pop();
  }

  // for x in a..b { body }        for x in list { body }
  //
  //   <a>  <b>  iter.range          <list>  iter.list  const 0
  //   (hidden locals: counter, end)  (hidden locals: list, index)
  // top:
  //   counter < end ?               index < len(list) ?
  //   jump.unless exit
  //   x = counter                   x = list[index]      (a fresh local)
  //   <body>
  // continue:
  //   pop x (or close it, if captured)
  //   inc.local counter             inc.local index
  //   loop top
  // exit, break:
  //   pop the hidden locals
  function forStatement() {
    const keyword = previous;
    if (check('(')) {
      expected('a loop variable name after \'for\'');
      skipParentheses();
      bracedBlock('\'{\' before the loop body');
      return;
    }
    consume('identifier', 'a loop variable name after \'for\'');
    const name = previous;
    consume('in', '\'in\' after the loop variable');
    beginScope();
    const hiddenDepth = fc().scopeDepth;
    expression();
    const first = fc().locals.length; // the counter, or the list
    addLocal(' first', keyword);
    markInitialized();
    const isRange = match('..');
    if (isRange) {
      expression();
      emitAt(keyword.line, Op.IterRange);
    } else {
      emitAt(keyword.line, Op.IterList);
      emitConstantOp(keyword.line, Op.Const, makeConstant(0));
    }
    const second = fc().locals.length; // the end, or the index
    addLocal(' second', keyword);
    markInitialized();
    const counter = isRange ? first : second;

    const loopStart = chunk().code.length;
    if (isRange) {
      emitAt(keyword.line, Op.LoadLocal, first, Op.LoadLocal, second, Op.Lt);
    } else {
      emitAt(keyword.line, Op.LoadLocal, second, Op.LoadLocal, first, Op.ListLen, Op.Lt);
    }
    const exitJump = emitJump(Op.JumpUnless);
    beginScope();
    if (isRange) emitAt(keyword.line, Op.LoadLocal, first);
    else emitAt(keyword.line, Op.LoadLocal, first, Op.LoadLocal, second, Op.IndexGet);
    addLocal(name.lexeme, name);
    markInitialized();
    const loop: Loop = { breakDepth: hiddenDepth, breaks: [], continueDepth: fc().scopeDepth, continueTarget: -1, continues: [] };
    fc().loops.push(loop);
    bracedBlock('\'{\' before the loop body');
    for (const c of loop.continues) patchJump(c);
    endScope();
    emitAt(keyword.line, Op.IncLocal, counter);
    emitLoop(loopStart);
    patchJump(exitJump);
    for (const b of loop.breaks) patchJump(b);
    fc().loops.pop();
    endScope();
  }

  function skipParentheses() {
    let depth = 0;
    do {
      if (check('(')) depth++;
      else if (check(')')) depth--;
      advance();
    } while (depth > 0 && !check('eof'));
  }

  function block() {
    blockDepth++;
    while (!check('}') && !check('eof')) declaration();
    blockDepth--;
    consume('}', '\'}\' to close the block');
  }

  // ---- expressions (Pratt) ----------------------------------------------
  function expression() {
    parsePrecedence(Prec.ASSIGNMENT);
  }

  function parsePrecedence(prec: number) {
    advance();
    const prefix = prefixRule(previous.type);
    if (!prefix) {
      errorAt(previous, `expected an expression, found ${describeToken(previous)}`);
      return;
    }
    continueExpression(prec, prefix);
  }

  function continueExpression(prec: number, prefix: PrefixFn) {
    const canAssign = prec <= Prec.ASSIGNMENT;
    prefix(canAssign);
    while (prec <= (INFIX_PREC[current.type] ?? Prec.NONE)) {
      advance();
      infix(previous, canAssign);
    }
    if (canAssign && matchAny(ASSIGN_OPS)) error('cannot assign to this expression');
  }

  function prefixRule(t: TokenType): PrefixFn | null {
    switch (t) {
      case '(': return grouping;
      case '[': return list;
      case '-': case '!': return unary;
      case 'number': return () => emitConstantOp(previous.line, Op.Const, makeConstant(Number(previous.lexeme)));
      case 'string': return () => emitConstantOp(previous.line, Op.Const, makeConstant(heap.copyString(previous.value!)));
      case 'true': return () => emit(Op.True);
      case 'false': return () => emit(Op.False);
      case 'none': return () => emit(Op.None);
      case 'identifier': return (canAssign) => namedVariable(previous, canAssign);
      case 'self': return selfExpression;
      case 'super': return superExpression;
      case 'new': return newExpression;
      case 'fn': return fnExpression;
      default: return null;
    }
  }

  function infix(op: VmToken, canAssign: boolean) {
    switch (op.type) {
      case '(':
        emitAt(op.line, Op.Call, argumentList());
        return;
      case '.': dot(canAssign); return;
      case '[': indexExpression(op, canAssign); return;
      case '&&': {
        const end = emitJump(Op.JumpUnlessKeep);
        emit(Op.Pop);
        parsePrecedence(Prec.AND);
        patchJump(end);
        return;
      }
      case '||': {
        const end = emitJump(Op.JumpIfKeep);
        emit(Op.Pop);
        parsePrecedence(Prec.OR);
        patchJump(end);
        return;
      }
      default:
        parsePrecedence(INFIX_PREC[op.type]! + 1);
        emitAt(op.line, BINARY_OPS[op.type]!);
    }
  }

  function grouping() {
    expression();
    consume(')', '\')\' after the expression');
  }

  function list() {
    let n = 0;
    if (!check(']')) {
      do {
        expression();
        n++;
        if (n === 256) error('a list cannot have more than 255 elements');
      } while (match(','));
    }
    consume(']', '\']\' after the list elements');
    emit(Op.List, Math.min(n, 255));
  }

  function unary() {
    const op = previous;
    parsePrecedence(Prec.UNARY);
    emitAt(op.line, op.type === '!' ? Op.Not : Op.Neg);
  }

  /** The arithmetic of `+=` or `-=`. */
  const compoundOp = (op: VmToken) => (op.type === '+=' ? Op.Add : Op.Sub);

  function namedVariable(name: VmToken, canAssign: boolean) {
    let getOp: number;
    let setOp: number;
    let arg = resolveLocal(fc(), name);
    let wide = false;
    if (arg !== -1) {
      getOp = Op.LoadLocal;
      setOp = Op.StoreLocal;
    } else if ((arg = resolveUpvalue(fc(), name)) !== -1) {
      getOp = Op.LoadUpvalue;
      setOp = Op.StoreUpvalue;
    } else {
      arg = identifierConstant(name.lexeme);
      getOp = Op.LoadGlobal;
      setOp = Op.StoreGlobal;
      wide = true;
    }
    const emitVar = (op: number) => (wide ? emitConstantOp(name.line, op, arg) : emitAt(name.line, op, arg));
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      if (op.type !== '=') emitVar(getOp);
      expression();
      if (op.type !== '=') emitAt(op.line, compoundOp(op));
      emitVar(setOp);
    } else {
      emitVar(getOp);
    }
  }

  function dot(canAssign: boolean) {
    consume('identifier', 'a property name after \'.\'');
    const name = previous;
    const k = identifierConstant(name.lexeme);
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      if (op.type !== '=') {
        emitAt(name.line, Op.Dup);
        emitConstantOp(name.line, Op.GetProp, k);
      }
      expression();
      if (op.type !== '=') emitAt(op.line, compoundOp(op));
      emitConstantOp(name.line, Op.SetProp, k);
    } else if (match('(')) {
      const argc = argumentList();
      emitConstantOp(name.line, Op.Invoke, k);
      emitAt(name.line, argc);
    } else {
      emitConstantOp(name.line, Op.GetProp, k);
    }
  }

  function indexExpression(bracket: VmToken, canAssign: boolean) {
    expression();
    consume(']', '\']\' after the index');
    if (canAssign && matchAny(ASSIGN_OPS)) {
      const op = previous;
      if (op.type !== '=') emitAt(bracket.line, Op.Dup2, Op.IndexGet);
      expression();
      if (op.type !== '=') emitAt(op.line, compoundOp(op));
      emitAt(bracket.line, Op.IndexSet);
    } else {
      emitAt(bracket.line, Op.IndexGet);
    }
  }

  const synthetic = (lexeme: string): VmToken => ({ type: 'identifier', lexeme, line: previous.line });

  function selfExpression() {
    if (!classCompiler) {
      staticError(previous, 'cannot use \'self\' outside a method');
      emit(Op.None);
      return;
    }
    namedVariable(synthetic('self'), false);
  }

  function superExpression() {
    const keyword = previous;
    if (!classCompiler) staticError(keyword, 'cannot use \'super\' outside a method');
    else if (!classCompiler.hasSuperclass) staticError(keyword, 'cannot use \'super\' in a class that does not extend another');
    const usable = !!classCompiler?.hasSuperclass;
    consume('.', '\'.\' after \'super\'');
    if (!match('init')) consume('identifier', 'a method name after \'super.\'');
    const name = previous;
    const k = identifierConstant(name.lexeme);
    if (usable) namedVariable(synthetic('self'), false);
    if (match('(')) {
      const argc = argumentList();
      if (usable) {
        namedVariable(synthetic('super'), false);
        emitConstantOp(name.line, Op.InvokeSuper, k);
        emitAt(name.line, argc);
      }
    } else if (usable) {
      namedVariable(synthetic('super'), false);
      emitConstantOp(name.line, Op.GetSuper, k);
    }
  }

  function newExpression() {
    const keyword = previous;
    consume('identifier', 'a class name after \'new\'');
    namedVariable(previous, false);
    consume('(', '\'(\' after the class name');
    const argc = argumentList();
    emitAt(keyword.line, Op.New, argc);
  }

  function fnExpression() {
    fnRest('anonymous', '\'(\' after \'fn\'');
  }

  function argumentList(): number {
    let n = 0;
    if (!check(')')) {
      do {
        expression();
        n++;
        if (n === 256) error('a call cannot have more than 255 arguments');
      } while (match(','));
    }
    consume(')', '\')\' after the arguments');
    return Math.min(n, 255);
  }

  // ---- the program --------------------------------------------------------
  initCompiler('script');
  advance();
  while (!match('eof')) declaration();
  const fn = endCompiler();
  if (syntaxErrors.length) errors.push(...syntaxErrors);
  else errors.push(...staticErrors);
  return errors.length ? null : fn;
}
