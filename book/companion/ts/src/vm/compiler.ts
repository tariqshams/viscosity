// The single-pass bytecode compiler (book chapters 48, 53–59): a Pratt
// parser that emits bytecode as it parses, with no syntax tree in between.
// Its structure and error messages follow clox from Crafting Interpreters
// (MIT), so the VM can be checked against the same test suite.
import { Chunk, OP } from './chunk.ts';
import { Scanner, type VmToken, type VmTokenType } from './scanner.ts';
import type { ObjFunction, Value } from './object.ts';
import type { Heap } from './heap.ts';

const Prec = {
  NONE: 0, ASSIGNMENT: 1, OR: 2, AND: 3, EQUALITY: 4, COMPARISON: 5,
  TERM: 6, FACTOR: 7, UNARY: 8, CALL: 9, PRIMARY: 10,
} as const;
type Prec = number;

type FnType = 'function' | 'initializer' | 'method' | 'script';

interface Local { name: VmToken; depth: number; isCaptured: boolean }
interface UpvalueRef { index: number; isLocal: boolean }

interface FnCompiler {
  enclosing: FnCompiler | null;
  fn: ObjFunction;
  type: FnType;
  locals: Local[];
  upvalues: UpvalueRef[];
  scopeDepth: number;
}

interface ClassCompiler { enclosing: ClassCompiler | null; hasSuperclass: boolean }

type ParseFn = (canAssign: boolean) => void;
interface Rule { prefix: ParseFn | null; infix: ParseFn | null; prec: Prec }

const UINT8_COUNT = 256;

export function compile(source: string, heap: Heap, errors: string[]): ObjFunction | null {
  const scanner = new Scanner(source);
  let current: VmToken = { type: 'eof', lexeme: '', line: 1 };
  let previous: VmToken = current;
  let hadError = false;
  let panicMode = false;
  let compiler: FnCompiler | null = null;
  let classCompiler: ClassCompiler | null = null;

  const fc = () => compiler!;
  const chunk = (): Chunk => fc().fn.chunk;

  // ---- errors -------------------------------------------------------------
  function errorAt(token: VmToken, message: string) {
    if (panicMode) return; // suppress cascades until we resynchronize
    panicMode = true;
    let where = '';
    if (token.type === 'eof') where = ' at end';
    else if (token.type !== 'error') where = ` at '${token.lexeme}'`;
    errors.push(`[line ${token.line}] Error${where}: ${message}`);
    hadError = true;
  }
  const error = (m: string) => errorAt(previous, m);
  const errorAtCurrent = (m: string) => errorAt(current, m);

  // ---- tokens -------------------------------------------------------------
  function advance() {
    previous = current;
    for (;;) {
      current = scanner.scanToken();
      if (current.type !== 'error') break;
      errorAtCurrent(current.lexeme);
    }
  }
  const check = (t: VmTokenType) => current.type === t;
  function consume(t: VmTokenType, message: string) {
    if (current.type === t) advance();
    else errorAtCurrent(message);
  }
  function match(t: VmTokenType) {
    if (!check(t)) return false;
    advance();
    return true;
  }

  // ---- emitting -------------------------------------------------------------
  const emit = (...bytes: number[]) => { for (const b of bytes) chunk().write(b, previous.line); };
  function emitLoop(loopStart: number) {
    emit(OP.LOOP);
    const offset = chunk().code.length - loopStart + 2;
    if (offset > 0xffff) error('Loop body too large.');
    emit((offset >> 8) & 0xff, offset & 0xff);
  }
  function emitJump(op: number): number {
    emit(op, 0xff, 0xff);
    return chunk().code.length - 2;
  }
  function patchJump(offset: number) {
    const jump = chunk().code.length - offset - 2;
    if (jump > 0xffff) error('Too much code to jump over.');
    chunk().code[offset] = (jump >> 8) & 0xff;
    chunk().code[offset + 1] = jump & 0xff;
  }
  function emitReturn() {
    if (fc().type === 'initializer') emit(OP.GET_LOCAL, 0);
    else emit(OP.NIL);
    emit(OP.RETURN);
  }
  function makeConstant(v: Value): number {
    const c = chunk().addConstant(v);
    if (c > 255) {
      error('Too many constants in one chunk.');
      return 0;
    }
    return c;
  }
  const emitConstant = (v: Value) => emit(OP.CONSTANT, makeConstant(v));

  // ---- compilers --------------------------------------------------------
  function initCompiler(type: FnType) {
    const fn = heap.newFunction();
    const c: FnCompiler = { enclosing: compiler, fn, type, locals: [], upvalues: [], scopeDepth: 0 };
    compiler = c;
    heap.compilerRoots.push(fn);
    if (type !== 'script') fn.name = heap.copyString(previous.lexeme);
    // Slot 0 holds the function itself, or `this` in methods.
    c.locals.push({
      name: { type: 'identifier', lexeme: type !== 'function' && type !== 'script' ? 'this' : '', line: 0 },
      depth: 0,
      isCaptured: false,
    });
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
      emit(c.locals[c.locals.length - 1].isCaptured ? OP.CLOSE_UPVALUE : OP.POP);
      c.locals.pop();
    }
  }

  const identifierConstant = (name: VmToken) => makeConstant(heap.copyString(name.lexeme));

  function resolveLocal(c: FnCompiler, name: VmToken): number {
    for (let i = c.locals.length - 1; i >= 0; i--) {
      const l = c.locals[i];
      if (l.name.lexeme === name.lexeme) {
        if (l.depth === -1) error('Can\'t read local variable in its own initializer.');
        return i;
      }
    }
    return -1;
  }
  function addUpvalue(c: FnCompiler, index: number, isLocal: boolean): number {
    for (let i = 0; i < c.upvalues.length; i++) {
      if (c.upvalues[i].index === index && c.upvalues[i].isLocal === isLocal) return i;
    }
    if (c.upvalues.length === UINT8_COUNT) {
      error('Too many closure variables in function.');
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
      return addUpvalue(c, local, true);
    }
    const up = resolveUpvalue(c.enclosing, name);
    if (up !== -1) return addUpvalue(c, up, false);
    return -1;
  }
  function addLocal(name: VmToken) {
    if (fc().locals.length === UINT8_COUNT) {
      error('Too many local variables in function.');
      return;
    }
    fc().locals.push({ name, depth: -1, isCaptured: false });
  }
  function declareVariable() {
    const c = fc();
    if (c.scopeDepth === 0) return;
    const name = previous;
    for (let i = c.locals.length - 1; i >= 0; i--) {
      const l = c.locals[i];
      if (l.depth !== -1 && l.depth < c.scopeDepth) break;
      if (l.name.lexeme === name.lexeme) error('Already a variable with this name in this scope.');
    }
    addLocal(name);
  }
  function parseVariable(message: string): number {
    consume('identifier', message);
    declareVariable();
    if (fc().scopeDepth > 0) return 0;
    return identifierConstant(previous);
  }
  function markInitialized() {
    const c = fc();
    if (c.scopeDepth === 0) return;
    c.locals[c.locals.length - 1].depth = c.scopeDepth;
  }
  function defineVariable(global: number) {
    if (fc().scopeDepth > 0) {
      markInitialized();
      return;
    }
    emit(OP.DEFINE_GLOBAL, global);
  }
  function argumentList(): number {
    let n = 0;
    if (!check(')')) {
      do {
        expression();
        if (n === 255) error('Can\'t have more than 255 arguments.');
        n++;
      } while (match(','));
    }
    consume(')', 'Expect \')\' after arguments.');
    return n;
  }

  // ---- expressions (Pratt) ----------------------------------------------
  function namedVariable(name: VmToken, canAssign: boolean) {
    let getOp: number;
    let setOp: number;
    let arg = resolveLocal(fc(), name);
    if (arg !== -1) {
      getOp = OP.GET_LOCAL;
      setOp = OP.SET_LOCAL;
    } else if ((arg = resolveUpvalue(fc(), name)) !== -1) {
      getOp = OP.GET_UPVALUE;
      setOp = OP.SET_UPVALUE;
    } else {
      arg = identifierConstant(name);
      getOp = OP.GET_GLOBAL;
      setOp = OP.SET_GLOBAL;
    }
    if (canAssign && match('=')) {
      expression();
      emit(setOp, arg);
    } else {
      emit(getOp, arg);
    }
  }
  const synthetic = (lexeme: string): VmToken => ({ type: 'identifier', lexeme, line: previous.line });

  const grouping: ParseFn = () => {
    expression();
    consume(')', 'Expect \')\' after expression.');
  };
  const number: ParseFn = () => emitConstant(Number(previous.lexeme));
  const string: ParseFn = () => emitConstant(heap.copyString(previous.lexeme.slice(1, -1)));
  const variable: ParseFn = (canAssign) => namedVariable(previous, canAssign);
  const literal: ParseFn = () => {
    if (previous.type === 'false') emit(OP.FALSE);
    else if (previous.type === 'true') emit(OP.TRUE);
    else emit(OP.NIL);
  };
  const unary: ParseFn = () => {
    const op = previous.type;
    parsePrecedence(Prec.UNARY);
    emit(op === '!' ? OP.NOT : OP.NEGATE);
  };
  const binary: ParseFn = () => {
    const op = previous.type;
    parsePrecedence(getRule(op).prec + 1);
    switch (op) {
      case '!=': emit(OP.EQUAL, OP.NOT); break;
      case '==': emit(OP.EQUAL); break;
      case '>': emit(OP.GREATER); break;
      case '>=': emit(OP.LESS, OP.NOT); break;
      case '<': emit(OP.LESS); break;
      case '<=': emit(OP.GREATER, OP.NOT); break;
      case '+': emit(OP.ADD); break;
      case '-': emit(OP.SUBTRACT); break;
      case '*': emit(OP.MULTIPLY); break;
      case '/': emit(OP.DIVIDE); break;
    }
  };
  const and_: ParseFn = () => {
    const endJump = emitJump(OP.JUMP_IF_FALSE);
    emit(OP.POP);
    parsePrecedence(Prec.AND);
    patchJump(endJump);
  };
  const or_: ParseFn = () => {
    const elseJump = emitJump(OP.JUMP_IF_FALSE);
    const endJump = emitJump(OP.JUMP);
    patchJump(elseJump);
    emit(OP.POP);
    parsePrecedence(Prec.OR);
    patchJump(endJump);
  };
  const call: ParseFn = () => emit(OP.CALL, argumentList());
  const dot: ParseFn = (canAssign) => {
    consume('identifier', 'Expect property name after \'.\'.');
    const name = identifierConstant(previous);
    if (canAssign && match('=')) {
      expression();
      emit(OP.SET_PROPERTY, name);
    } else if (match('(')) {
      const n = argumentList();
      emit(OP.INVOKE, name, n);
    } else {
      emit(OP.GET_PROPERTY, name);
    }
  };
  const this_: ParseFn = () => {
    if (!classCompiler) {
      error('Can\'t use \'this\' outside of a class.');
      return;
    }
    variable(false);
  };
  const super_: ParseFn = () => {
    if (!classCompiler) error('Can\'t use \'super\' outside of a class.');
    else if (!classCompiler.hasSuperclass) error('Can\'t use \'super\' in a class with no superclass.');
    consume('.', 'Expect \'.\' after \'super\'.');
    consume('identifier', 'Expect superclass method name.');
    const name = identifierConstant(previous);
    namedVariable(synthetic('this'), false);
    if (match('(')) {
      const n = argumentList();
      namedVariable(synthetic('super'), false);
      emit(OP.SUPER_INVOKE, name, n);
    } else {
      namedVariable(synthetic('super'), false);
      emit(OP.GET_SUPER, name);
    }
  };

  const RULES: Partial<Record<VmTokenType, Rule>> = {
    '(': { prefix: grouping, infix: call, prec: Prec.CALL },
    '.': { prefix: null, infix: dot, prec: Prec.CALL },
    '-': { prefix: unary, infix: binary, prec: Prec.TERM },
    '+': { prefix: null, infix: binary, prec: Prec.TERM },
    '/': { prefix: null, infix: binary, prec: Prec.FACTOR },
    '*': { prefix: null, infix: binary, prec: Prec.FACTOR },
    '!': { prefix: unary, infix: null, prec: Prec.NONE },
    '!=': { prefix: null, infix: binary, prec: Prec.EQUALITY },
    '==': { prefix: null, infix: binary, prec: Prec.EQUALITY },
    '>': { prefix: null, infix: binary, prec: Prec.COMPARISON },
    '>=': { prefix: null, infix: binary, prec: Prec.COMPARISON },
    '<': { prefix: null, infix: binary, prec: Prec.COMPARISON },
    '<=': { prefix: null, infix: binary, prec: Prec.COMPARISON },
    identifier: { prefix: variable, infix: null, prec: Prec.NONE },
    string: { prefix: string, infix: null, prec: Prec.NONE },
    number: { prefix: number, infix: null, prec: Prec.NONE },
    and: { prefix: null, infix: and_, prec: Prec.AND },
    or: { prefix: null, infix: or_, prec: Prec.OR },
    false: { prefix: literal, infix: null, prec: Prec.NONE },
    true: { prefix: literal, infix: null, prec: Prec.NONE },
    nil: { prefix: literal, infix: null, prec: Prec.NONE },
    super: { prefix: super_, infix: null, prec: Prec.NONE },
    this: { prefix: this_, infix: null, prec: Prec.NONE },
  };
  const NO_RULE: Rule = { prefix: null, infix: null, prec: Prec.NONE };
  const getRule = (t: VmTokenType): Rule => RULES[t] ?? NO_RULE;

  function parsePrecedence(prec: Prec) {
    advance();
    const prefix = getRule(previous.type).prefix;
    if (!prefix) {
      error('Expect expression.');
      return;
    }
    const canAssign = prec <= Prec.ASSIGNMENT;
    prefix(canAssign);
    while (prec <= getRule(current.type).prec) {
      advance();
      getRule(previous.type).infix!(canAssign);
    }
    if (canAssign && match('=')) error('Invalid assignment target.');
  }
  function expression() {
    parsePrecedence(Prec.ASSIGNMENT);
  }

  // ---- statements ---------------------------------------------------------
  function block() {
    while (!check('}') && !check('eof')) declaration();
    consume('}', 'Expect \'}\' after block.');
  }
  function fnBody(type: FnType) {
    initCompiler(type);
    beginScope();
    consume('(', 'Expect \'(\' after function name.');
    if (!check(')')) {
      do {
        fc().fn.arity++;
        if (fc().fn.arity > 255) errorAtCurrent('Can\'t have more than 255 parameters.');
        defineVariable(parseVariable('Expect parameter name.'));
      } while (match(','));
    }
    consume(')', 'Expect \')\' after parameters.');
    consume('{', 'Expect \'{\' before function body.');
    block();
    const upvalues = fc().upvalues;
    const fn = endCompiler();
    emit(OP.CLOSURE, makeConstant(fn));
    for (const u of upvalues) emit(u.isLocal ? 1 : 0, u.index);
  }
  function method() {
    consume('identifier', 'Expect method name.');
    const constant = identifierConstant(previous);
    fnBody(previous.lexeme === 'init' ? 'initializer' : 'method');
    emit(OP.METHOD, constant);
  }
  function classDeclaration() {
    consume('identifier', 'Expect class name.');
    const className = previous;
    const nameConstant = identifierConstant(previous);
    declareVariable();
    emit(OP.CLASS, nameConstant);
    defineVariable(nameConstant);
    const cc: ClassCompiler = { enclosing: classCompiler, hasSuperclass: false };
    classCompiler = cc;
    if (match('<')) {
      consume('identifier', 'Expect superclass name.');
      variable(false);
      if (className.lexeme === previous.lexeme) error('A class can\'t inherit from itself.');
      beginScope();
      addLocal(synthetic('super'));
      defineVariable(0);
      namedVariable(className, false);
      emit(OP.INHERIT);
      cc.hasSuperclass = true;
    }
    namedVariable(className, false);
    consume('{', 'Expect \'{\' before class body.');
    while (!check('}') && !check('eof')) method();
    consume('}', 'Expect \'}\' after class body.');
    emit(OP.POP);
    if (cc.hasSuperclass) endScope();
    classCompiler = cc.enclosing;
  }
  function fnDeclaration() {
    const global = parseVariable('Expect function name.');
    markInitialized();
    fnBody('function');
    defineVariable(global);
  }
  function letDeclaration() {
    const global = parseVariable('Expect variable name.');
    if (match('=')) expression();
    else emit(OP.NIL);
    consume(';', 'Expect \';\' after variable declaration.');
    defineVariable(global);
  }
  function expressionStatement() {
    expression();
    consume(';', 'Expect \';\' after expression.');
    emit(OP.POP);
  }
  function forStatement() {
    beginScope();
    consume('(', 'Expect \'(\' after \'for\'.');
    if (match(';')) { /* no initializer */ } else if (match('let')) letDeclaration();
    else expressionStatement();
    let loopStart = chunk().code.length;
    let exitJump = -1;
    if (!match(';')) {
      expression();
      consume(';', 'Expect \';\' after loop condition.');
      exitJump = emitJump(OP.JUMP_IF_FALSE);
      emit(OP.POP);
    }
    if (!match(')')) {
      const bodyJump = emitJump(OP.JUMP);
      const incrementStart = chunk().code.length;
      expression();
      emit(OP.POP);
      consume(')', 'Expect \')\' after for clauses.');
      emitLoop(loopStart);
      loopStart = incrementStart;
      patchJump(bodyJump);
    }
    statement();
    emitLoop(loopStart);
    if (exitJump !== -1) {
      patchJump(exitJump);
      emit(OP.POP);
    }
    endScope();
  }
  function ifStatement() {
    consume('(', 'Expect \'(\' after \'if\'.');
    expression();
    consume(')', 'Expect \')\' after condition.');
    const thenJump = emitJump(OP.JUMP_IF_FALSE);
    emit(OP.POP);
    statement();
    const elseJump = emitJump(OP.JUMP);
    patchJump(thenJump);
    emit(OP.POP);
    if (match('else')) statement();
    patchJump(elseJump);
  }
  function returnStatement() {
    if (fc().type === 'script') error('Can\'t return from top-level code.');
    if (match(';')) emitReturn();
    else {
      if (fc().type === 'initializer') error('Can\'t return a value from an initializer.');
      expression();
      consume(';', 'Expect \';\' after return value.');
      emit(OP.RETURN);
    }
  }
  function whileStatement() {
    const loopStart = chunk().code.length;
    consume('(', 'Expect \'(\' after \'while\'.');
    expression();
    consume(')', 'Expect \')\' after condition.');
    const exitJump = emitJump(OP.JUMP_IF_FALSE);
    emit(OP.POP);
    statement();
    emitLoop(loopStart);
    patchJump(exitJump);
    emit(OP.POP);
  }
  function synchronize() {
    panicMode = false;
    while (current.type !== 'eof') {
      if (previous.type === ';') return;
      switch (current.type) {
        case 'class': case 'fn': case 'let': case 'for': case 'if':
        case 'while': case 'print': case 'return':
          return;
      }
      advance();
    }
  }
  function declaration() {
    if (match('class')) classDeclaration();
    else if (match('fn')) fnDeclaration();
    else if (match('let')) letDeclaration();
    else statement();
    if (panicMode) synchronize();
  }
  function statement() {
    if (match('print')) {
      expression();
      consume(';', 'Expect \';\' after value.');
      emit(OP.PRINT);
    } else if (match('for')) forStatement();
    else if (match('if')) ifStatement();
    else if (match('return')) returnStatement();
    else if (match('while')) whileStatement();
    else if (match('{')) {
      beginScope();
      block();
      endScope();
    } else expressionStatement();
  }

  initCompiler('script');
  advance();
  while (!match('eof')) declaration();
  const fn = endCompiler();
  return hadError ? null : fn;
}
